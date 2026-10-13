import {describe,expect,it} from 'vitest';
import {Game,newHero,SAVE_VERSION} from '../src/game/simulation';
import {LEGACIES,PREPARATIONS,trialProgress} from '../src/game/ancestralJourney';
import {activeArmy,positionPlan,recommendedParty,planSignature,equipmentPlan,craftingPlan,buffAdvice,synergyChanges,roleOf,enemyThreats} from '../src/game/armyAdvisor';
import {endlessStage} from '../src/game/campaign';
import {characters} from '../src/data/characters';
import {allySlotCenter} from '../src/game/board';
const rich=()=>{const g=new Game();g.state.commanderLevel=3;return g;};
describe('ancestral progression',()=>{
  it('begins with a meaningful legacy choice and no RTS state',()=>{
    const g=new Game();g.state.commanderLevel=3;expect(g.state.journey.knowledge).toBe(3);expect('settlement' in g.state).toBe(false);
    expect(g.learnLegacy('vigor').ok).toBe(true);expect(g.state.journey.knowledge).toBe(0);expect(g.state.heroes[0].stars).toBe(1);
    const save=JSON.parse(g.serialize(1000));expect(save.version).toBe(13);expect(save.state.settlement).toBeUndefined();
  });
  it('retires manual challenges and pays knowledge directly after victory',()=>{const g=new Game();const before=g.state.journey.knowledge;expect(g.acceptTrial('combat').ok).toBe(false);g.startBattle();for(const e of g.battle!.entities.filter(e=>e.team==='enemy'))e.hp=0;g.advanceBattle(.1);expect(g.state.journey.knowledge).toBe(before+3);expect(g.claimTrial().ok).toBe(false);});
  it('cannot reactivate old missions',()=>{const g=new Game(),before=g.serialize(1000);for(const id of ['combat','hunt','ritual'])expect(g.acceptTrial(id).ok).toBe(false);expect(g.serialize(1000)).toBe(before);});
  it('recruitment no longer grants mission rewards',()=>{const g=rich(),knowledge=g.state.journey.knowledge;g.openDraft();g.recruit(g.state.draft!.offers[0]);const loaded=new Game(g.serialize(1000));expect(loaded.state.stats.recruits).toBe(1);expect(loaded.state.journey.trial).toBeNull();expect(loaded.state.journey.knowledge).toBe(knowledge);});
  it('requires parents, era and knowledge, and stops at three legacy levels',()=>{
    const g=rich();g.state.journey.knowledge=1e4;expect(g.learnLegacy('tactics').ok).toBe(false);g.learnLegacy('vigor');g.learnLegacy('tactics');expect(g.learnLegacy('guard').ok).toBe(false);g.state.era=2;g.state.commanderLevel=2+g.state.era;
    expect(g.learnLegacy('guard').ok).toBe(true);for(let i=0;i<2;i++)expect(g.learnLegacy('vigor').ok).toBe(true);expect(g.learnLegacy('vigor').ok).toBe(false);
    g.state.journey.knowledge=0;const before=JSON.stringify(g.state);expect(g.learnLegacy('roots').ok).toBe(false);expect(JSON.stringify(g.state)).toBe(before);
  });
  it('sanitizes knowledge, legacy levels, selections and invalid focused traits',()=>{
    const g=rich(),save=JSON.parse(g.serialize(1000));save.state.journey={knowledge:-4,legacies:{vigor:999,toString:3},preparations:{feast:99},selected:['feast','feast','bad'],focusTraits:['toString','Presas'],trial:{id:'bad',start:-3}};
    const loaded=new Game(save,1000);expect(loaded.state.journey.knowledge).toBe(0);expect(loaded.state.journey.legacies.vigor).toBe(3);expect(loaded.state.journey.selected).toEqual([]);expect(loaded.state.journey.focusTraits).toEqual(['Presas']);expect(loaded.state.journey.trial).toBeNull();expect(SAVE_VERSION).toBe(13);
  });
  it('a trivial completed campaign cannot reset',()=>{const g=rich();g.state.progress=30;g.state.wonder=5;const before=g.serialize(1000);expect(g.ascend().ok).toBe(false);expect(g.serialize(1000)).toBe(before);});
});

describe('complete war council',()=>{
  const party=()=>{const g=rich();g.state.era=5;g.state.commanderLevel=2+g.state.era;g.state.progress=29;g.state.selectedStage=30;g.state.heroes=[3,6,8,11,13,15,16,20,49].map(id=>newHero(`h-${id}`,id,2));return g;};
  it('covers all heroes with a function and valid unique planned board cells',()=>{
    for(let offset=0;offset<55;offset+=7){const g=party();g.state.heroes=characters.slice(offset,offset+7).map(c=>newHero(`h-${c.id}`,c.id));const plan=positionPlan(g.state);expect(new Set(plan.map(p=>p.slot)).size).toBe(plan.length);for(const p of plan){expect(p.slot).toBeGreaterThanOrEqual(0);expect(p.slot).toBeLessThan(28);expect(p.reason.length).toBeGreaterThan(15);expect(ROLE_IDS).toContain(roleOf(characters.find(c=>c.id===p.hero.characterId)!));}}
  });
  it('excludes working and absent heroes and applies the exact displayed positions',()=>{
    const g=party();g.state.heroes[1].away={kind:'hunt',id:'igarape',until:200};const plan=positionPlan(g.state),signature=planSignature(g.state);expect(g.applyArmyPlan(signature).ok).toBe(true);for(const p of plan)expect(p.hero.slot).toBe(p.slot);expect(g.state.heroes[1].away).not.toBeNull();expect(activeArmy(g.state)).toHaveLength(7);
  });
  it('rejects stale and locked plans without modifying heroes or equipment',()=>{
    const g=party(),signature=planSignature(g.state);g.state.inventory.push('muralha');const before=JSON.stringify(g.state.heroes);expect(g.applyArmyPlan(signature).ok).toBe(false);expect(g.applyEquipmentPlan(signature).ok).toBe(false);expect(JSON.stringify(g.state.heroes)).toBe(before);g.applyArmyPlan();g.startBattle();expect(g.applyArmyPlan().ok).toBe(false);expect(g.applyEquipmentPlan().ok).toBe(false);
  });
  it('allocates each physical inventory entry once and preserves existing gear and components',()=>{
    const g=party();g.applyArmyPlan();g.state.inventory=['muralha','garra','coroa','manto','raiz'];activeArmy(g.state)[0].items=['pele-urso'];const plan=equipmentPlan(g.state),indices=plan.map(p=>p.index);expect(new Set(indices).size).toBe(indices.length);const existing=activeArmy(g.state)[0];expect(g.applyEquipmentPlan(planSignature(g.state)).ok).toBe(true);expect(existing.items).toContain('pele-urso');expect(g.state.inventory).toEqual(['manto','raiz']);expect(g.state.heroes.every(h=>h.items.length<=3)).toBe(true);expect(g.applyEquipmentPlan().ok).toBe(false);
  });
  it('reserves crafting components globally and never recommends imaginary recipes',()=>{
    const g=party();g.applyArmyPlan();g.state.inventory=['couro','raiz','couro','raiz'];const plan=craftingPlan(g.state),indices=plan.flatMap(p=>[p.a,p.b]);expect(plan.length).toBeGreaterThan(0);expect(new Set(indices).size).toBe(indices.length);expect(plan.every(p=>p.item.recipe!.map(id=>id).sort().join(',')===[g.state.inventory[p.a],g.state.inventory[p.b]].sort().join(','))).toBe(true);
  });
  it('reserves the recipient equipment slots across the whole crafting plan',()=>{
    const g=party();const hero=g.state.heroes[0];hero.slot=3;hero.items=['muralha','coroa'];g.state.inventory=['couro','raiz','couro','raiz','pena','pena'];
    const plan=craftingPlan(g.state,[hero]);expect(plan).toHaveLength(1);expect(plan[0].hero).toBe(hero);hero.items.push('pele-urso');expect(craftingPlan(g.state,[hero])).toEqual([]);
  });
  it('analyzes the next endless roster rather than campaign stage one',()=>{
    const g=party();g.state.progress=30;g.state.selectedStage=0;g.state.endlessBest=8;expect(enemyThreats(g.state).total).toBe(endlessStage(9).units.length);expect(positionPlan(g.state)).toHaveLength(7);
  });
  it('reports actual adjacent allies for item shields using board distances',()=>{
    const g=party();g.state.heroes[0].items=['escudo-totem'];const plan=positionPlan(g.state,g.state.heroes.slice(0,7)),owner=plan.find(p=>p.hero.items.includes('escudo-totem'))!,origin=allySlotCenter(owner.slot);
    const expected=plan.filter(p=>p!==owner&&Math.hypot(origin.x-allySlotCenter(p.slot).x,origin.y-allySlotCenter(p.slot).y)<=1.1).map(p=>characters.find(c=>c.id===p.hero.characterId)!.name);expect(owner.adjacent).toEqual(expected);
  });
  it('explains synergy changes and ranks preparations available in the actual era',()=>{
    const g=party();g.setArmyFocus('Guardião');const changes=synergyChanges(g.state);expect(changes.some(c=>c.delta>0)).toBe(true);const buffs=buffAdvice(g.state);expect(buffs).toHaveLength(6);expect(buffs.every(p=>p.reason.length>15)).toBe(true);g.state.era=1;g.state.commanderLevel=2+g.state.era;expect(buffAdvice(g.state).every(p=>p.era===1)).toBe(true);expect(g.setArmyFocus('toString').ok).toBe(false);
  });
});
const ROLE_IDS=['front','ranged','caster','support','flank','summon'];
