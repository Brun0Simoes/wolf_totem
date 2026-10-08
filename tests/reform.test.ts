import {describe,expect,it} from 'vitest';
import {Game,newHero,OFFLINE_CAP_SECONDS,SAVE_VERSION,totemLock} from '../src/game/simulation';
import {PREPARATIONS,blessingLock} from '../src/game/ancestralJourney';
import {PRACTICES,TRAILS,RITUAL_COOLDOWN,totalXp,ritualTotalXp} from '../src/game/tribe';
import {journeyPage} from '../src/ui/AncestralJourney';
import {armyCoach} from '../src/ui/ArmyCoach';
const finish=(g:Game)=>{const h=g.state.heroes[0];if(h.away)g.catchUp(h.away.until-g.state.clock);};
const learned=()=>{const g=new Game();g.state.era=5;const h=g.state.heroes[0];h.ritualLevel=8;h.rituals={rape:1,sananga:1,kambo:1,ayahuasca:1};return g;};
describe('game without a material economy',()=>{
  it('serializes only hero and journey progression and never produces idle rewards',()=>{
    const g=new Game(),heroes=structuredClone(g.state.heroes);g.catchUp(12*3600);
    expect(g.state.heroes).toEqual(heroes);expect(g.state.inventory).toEqual([]);
    for(const key of ['resources','buildings','shop','shopSeed','forgeProgress','settlement','event','omen','nextEventAt'])expect(g.state).not.toHaveProperty(key);
    expect(g.state.heroes[0]).not.toHaveProperty('work');expect(g.state.journey).not.toHaveProperty('preparations');expect(JSON.parse(g.serialize()).version).toBe(8);
  });
  it('welcomes every era-one identity freely, once, and keeps earned stars',()=>{
    const g=new Game();for(const id of [2,3,8,13])expect(g.recruit(id).ok).toBe(true);
    const before=g.serialize(1000);expect(g.recruit(2).ok).toBe(false);expect(g.serialize(1000)).toBe(before);expect(g.state.heroes.every(h=>h.stars===1)).toBe(true);
  });
  it('requires era and ritual affinity for the higher roster',()=>{
    const g=new Game();expect(g.recruit(49).ok).toBe(false);g.state.era=5;expect(g.recruit(49).ok).toBe(false);g.state.heroes[0].ritualLevel=7;expect(g.recruit(49).ok).toBe(true);
  });
  it('advances only when the same hero meets both XP and ritual milestones',()=>{
    const g=new Game(),h=g.state.heroes[0];h.level=4;g.state.heroes.push({...newHero('ritual',2),ritualLevel:2});expect(g.advanceEra().ok).toBe(false);
    h.ritualLevel=2;expect(g.advanceEra().ok).toBe(true);expect(g.state.era).toBe(2);expect(g.recruit(15).ok).toBe(true);
  });
  it('keeps pause and combat guards for recruitment, era, hunts and blessings',()=>{
    const g=learned();g.state.paused=true;const before=g.serialize(1000);
    expect(g.recruit(2).ok).toBe(false);expect(g.startHunt('hero-1','igarape').ok).toBe(false);expect(g.selectPreparation('feast').ok).toBe(false);expect(g.performRitual('hero-1','rape').ok).toBe(false);expect(g.buildWonder().ok).toBe(false);expect(g.serialize(1000)).toBe(before);
    g.state.paused=false;g.startBattle();expect(g.advanceEra().ok).toBe(false);expect(g.holdCacaoCircle().ok).toBe(false);expect(g.selectPreparation('feast').ok).toBe(false);
  });
  it('offers ceremonies immediately and requires XP, era and earlier rites for ayahuasca',()=>{
    const g=new Game();expect(g.performRitual('hero-1','rape').ok).toBe(true);finish(g);expect(g.state.heroes[0].rituals.rape).toBe(1);
    g.catchUp(RITUAL_COOLDOWN);expect(g.performRitual('hero-1','ayahuasca').ok).toBe(false);g.state.era=3;g.state.heroes[0].level=14;expect(g.performRitual('hero-1','ayahuasca').ok).toBe(true);
    expect(PRACTICES.every(p=>!('cost' in p)&&!('curaLevel' in p))).toBe(true);
  });
  it('caps activity time at twelve offline hours and credits completion exactly once',()=>{
    const g=new Game();g.startHunt('hero-1','igarape');const save=g.serialize(1000),loaded=new Game(save,1000+24*3600*1000);
    expect(loaded.offlineSeconds).toBe(OFFLINE_CAP_SECONDS);expect(loaded.state.stats.hunts).toBe(1);expect(loaded.state.heroes[0].away).toBeNull();expect(totalXp(loaded.state.heroes[0].level,loaded.state.heroes[0].xp)).toBeGreaterThan(0);
    expect(new Game(loaded.serialize(1000),1000).state.stats.hunts).toBe(1);
    g.state.paused=true;expect(new Game(g.serialize(1000),1000+24*3600*1000).state.heroes[0].away).not.toBeNull();
  });
  it('grows hunting slots with eras and forbids a fifth simultaneous hunter',()=>{
    const g=new Game();g.recruit(2);expect(g.startHunt('hero-1','igarape').ok).toBe(true);expect(g.startHunt(g.state.heroes[1].uid,'igarape').ok).toBe(false);
    g.state.era=5;for(const id of [3,4,5])g.recruit(id);for(const h of g.state.heroes.slice(1,4))expect(g.startHunt(h.uid,'igarape').ok).toBe(true);expect(g.startHunt(g.state.heroes[4].uid,'igarape').ok).toBe(false);
  });
  it('combines components from the first era without a building and respects item guards',()=>{
    const g=new Game();g.state.inventory=['presa','arco'];expect(g.combineItems(0,1).ok).toBe(true);expect(g.state.inventory).toEqual(['garra']);
    g.state.inventory=['presa','arco'];g.startBattle();expect(g.combineItems(0,1).ok).toBe(false);expect(g.state.inventory).toEqual(['presa','arco']);
  });
  it('uses roots and memories for real activity XP rather than idle production',()=>{
    const a=new Game(),b=new Game();a.state.journey.legacies.roots=1;a.state.memories.raizes=1;
    for(const g of [a,b]){g.state.lootSeed=1;g.startHunt('hero-1','igarape');finish(g);}
    expect(totalXp(a.state.heroes[0].level,a.state.heroes[0].xp)).toBeCloseTo(totalXp(b.state.heroes[0].level,b.state.heroes[0].xp)*1.08*1.1,0);
  });
  it('requires integration between cacao circles to prevent free challenge farming',()=>{
    const g=new Game();g.state.era=2;expect(g.holdCacaoCircle().ok).toBe(true);g.catchUp(601);expect(g.holdCacaoCircle().ok).toBe(false);expect(g.state.stats.rituals).toBe(1);
    g.catchUp(RITUAL_COOLDOWN);expect(g.holdCacaoCircle().ok).toBe(true);expect(g.state.stats.rituals).toBe(2);
  });
});
describe('ritual blessings',()=>{
  it('unlocks by actual completed rites and never by era alone',()=>{
    const g=new Game();g.state.era=5;expect(blessingLock(g.state,'feast')).not.toBeNull();expect(g.selectPreparation('feast').ok).toBe(false);
    g.state.heroes[0].rituals.kambo=1;expect(blessingLock(g.state,'feast')).toBeNull();expect(g.selectPreparation('feast').ok).toBe(true);
  });
  it('keeps at most two reusable blessings, with an explicit swap',()=>{
    const g=learned();for(const id of ['feast','warpaint'])expect(g.selectPreparation(id).ok).toBe(true);
    expect(g.selectPreparation('incense').ok).toBe(false);g.selectPreparation('feast');expect(g.selectPreparation('incense').ok).toBe(true);expect(g.state.journey.selected).toEqual(['warpaint','incense']);
  });
  it.each(PREPARATIONS.map(p=>p.id))('applies %s to allies and preserves the choice for the next fight',id=>{
    const g=learned(),base=learned();g.selectPreparation(id);g.startBattle();base.startBattle();const a=g.battle!.entities[0],b=base.battle!.entities[0];
    const checks={feast:()=>expect(a.maxHp).toBeCloseTo(b.maxHp*1.12),warpaint:()=>expect(a.attack).toBeCloseTo(b.attack*1.08),incense:()=>expect(a.mana).toBe(Math.min(a.manaMax,b.mana+12)),bark:()=>expect(a.armor).toBe(b.armor+12),amulet:()=>expect(a.magicResist).toBe(b.magicResist+15),spring:()=>expect(a.regen).toBeCloseTo(b.regen+.005)};
    checks[id]();expect(g.battle!.preparations).toEqual([id]);expect(g.state.journey.selected).toEqual([id]);expect(g.battle!.entities.find(e=>e.team==='enemy')!.maxHp).toBe(base.battle!.entities.find(e=>e.team==='enemy')!.maxHp);
    g.battle!.status='defeat';g.dismissBattle();g.startBattle();expect(g.battle!.preparations).toEqual([id]);
  });
});
describe('progress preservation and ancestral goal',()=>{
  it('converts v6 workshop investment once and keeps all learned hero progress',()=>{
    const g=learned(),old=JSON.parse(g.serialize(1000));old.version=6;old.state.villageLevel=old.state.era;delete old.state.era;
    old.state.resources={wood:1e8,food:1e8,stone:1e8,spirit:1e8};old.state.buildings={lumber:8,hunt:5,forge:3,cura:3};old.state.journey.preparations={feast:2};old.state.heroes[0].work='lumber';old.state.heroes[0].items=['garra'];
    const loaded=new Game(old,1000);expect(loaded.state.era).toBe(5);expect(loaded.state.heroes[0]).toMatchObject({stars:1,ritualLevel:8,items:['garra'],rituals:g.state.heroes[0].rituals});expect(loaded.state.journey.knowledge).toBe(20);expect(loaded.state.journey.migrated).toBe(true);
    const again=new Game(loaded.serialize(1000),1000);expect(again.state).toEqual(loaded.state);expect(again.state).not.toHaveProperty('resources');
  });
  it('converts a v5 settlement and preserves focused traits',()=>{
    const g=new Game(),old=JSON.parse(g.serialize(1000));old.version=5;delete old.state.journey;old.state.settlement={sites:{a:'housing'},research:{tools:2},focusTraits:['Presas']};
    const loaded=new Game(old,1000);expect(loaded.state.journey.knowledge).toBe(11);expect(loaded.state.journey.focusTraits).toEqual(['Presas']);expect(new Game(loaded.serialize(1000),1000).state).toEqual(loaded.state);
  });
  it('consecrates all five stages through conquest and awakening milestones',()=>{
    const g=new Game();expect(g.buildWonder().ok).toBe(false);g.state.era=5;g.state.progress=25;expect(g.buildWonder().ok).toBe(true);expect(g.buildWonder().ok).toBe(false);
    g.state.progress=27;expect(g.buildWonder().ok).toBe(true);expect(g.buildWonder().ok).toBe(false);g.state.heroes[0].ritualLevel=8;expect(g.buildWonder().ok).toBe(true);
    g.state.progress=30;g.state.heroes[0].stars=3;expect(g.buildWonder().ok).toBe(true);expect(g.buildWonder().ok).toBe(false);g.state.endlessBest=1;expect(g.buildWonder().ok).toBe(true);expect(totemLock(g.state)).toBe('Totem completo');
    g.state.memories.heranca=1;g.state.memories.forja=1;expect(g.ascend().ok).toBe(true);expect(totalXp(g.state.heroes[0].level,g.state.heroes[0].xp)).toBe(1500);expect(g.state.inventory).toHaveLength(1);expect(g.state.embers).toBe(10);
  });
  it('changes the old recruitment memory into formation health',()=>{
    const a=new Game(),b=new Game();a.state.memories.fogueira=1;a.startBattle();b.startBattle();expect(a.battle!.entities[0].maxHp).toBeCloseTo(b.battle!.entities[0].maxHp*1.03);
  });
  it('renders the journey and advisor without workshop or material purchasing actions',()=>{
    const g=learned();const html=journeyPage(g.state,'paths','wild')+journeyPage(g.state,'preparations','war')+armyCoach(g.state,null,'Caçador',false,'buffs');
    expect(html).not.toMatch(/data-cost|data-upgrade-workshop|data-prepare-expedition|data-workshop-hero/);expect(html).toContain('Ativar bênção');
  });
  it('reaches the first 3-star hero over multiple days with two short visits per day',()=>{
    const g=new Game(),h=g.state.heroes[0];let visits=0;
    // Alternate a hunting visit and a ritual visit, choosing the strongest unlocked activity.
    for(;visits<60&&h.stars<3;visits++){
      g.catchUp(12*3600);while(g.state.era<5&&g.advanceEra().ok){}
      if(visits%2===0){const t=[...TRAILS].reverse().find(t=>t.era<=g.state.era&&t.minLevel<=h.level)!;g.startHunt(h.uid,t.id);}
      else {const id=!h.rituals.rape?'rape':g.state.era>=3&&h.level>=14&&!h.rituals.ayahuasca?'ayahuasca':g.state.era>=2&&h.level>=8?'kambo':'sananga';g.performRitual(h.uid,id,1);}
    }
    expect(h.stars).toBe(3);expect(visits/2).toBeGreaterThan(3);expect(visits/2).toBeLessThanOrEqual(15);
    expect(h.level).toBeGreaterThanOrEqual(24);expect(h.ritualLevel).toBeGreaterThanOrEqual(8);expect(ritualTotalXp(h.ritualLevel,h.ritualXp)).toBeGreaterThan(0);
    console.info(`First 3-star hero: ${visits/2} days, two visits/day, XP ${h.level}, ritual ${h.ritualLevel}.`);
  });
});
