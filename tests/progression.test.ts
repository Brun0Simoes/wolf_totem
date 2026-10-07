import { describe, expect, it } from 'vitest';
import { Game, newHero, OFFLINE_CAP_SECONDS } from '../src/game/simulation';
import { RITUAL_COOLDOWN, RITUAL_XP, ritualTotalXp, totalXp, WORK_XP_PER_MINUTE } from '../src/game/tribe';

const rich=(game:Game)=>{game.state.resources={wood:1e8,food:1e8,stone:1e8,spirit:1e8};};
const finish=(game:Game)=>{const h=game.state.heroes[0];if(h.away)game.catchUp(h.away.until-game.state.clock+1);};

describe('two independent awakening tracks',()=>{
  it('does not bypass ritual recruitment requirements through a traveler event',()=>{
    const game=new Game();game.state.villageLevel=5;
    game.state.event={kind:'traveler',expires:500,characterId:49};
    expect(game.answerEvent(true).ok).toBe(true);
    expect(game.state.heroes.map(h=>h.characterId)).toEqual([1]);
  });
  it('keeps returning workers in reserve when their former job has been filled',()=>{
    const game=new Game();rich(game);game.state.buildings.cura=1;
    const h=game.state.heroes[0];game.assignWorker(h.uid,'lumber');game.performRitual(h.uid,'rape');
    game.state.heroes.push(newHero('replacement',2));game.assignWorker('replacement','lumber');game.catchUp(3600);
    expect(h.work).toBeNull();expect(game.state.heroes.filter(h=>h.work==='lumber')).toHaveLength(1);
  });
  it('returns a worker after a ritual and credits only the remaining offline work time',()=>{
    const game=new Game();rich(game);game.state.buildings.cura=1;
    const h=game.state.heroes[0];game.assignWorker(h.uid,'lumber');game.performRitual(h.uid,'rape');
    const loaded=new Game(game.serialize(1000),1000+3600*1000),hero=loaded.state.heroes[0];
    expect(hero.work).toBe('lumber');expect(hero.away).toBeNull();
    expect(totalXp(hero.level,hero.xp)).toBeCloseTo(40*40);
  });
  it('reaches the first avatar in several days with two brief visits per day',()=>{
    const game=new Game(),h=game.state.heroes[0];
    game.assignWorker(h.uid,'lumber');
    let days=0;
    for(let visit=0;visit<40&&h.stars<3;visit++) {
      game.catchUp(12*3600);days=(visit+1)/2;
      while(game.state.villageLevel<3&&game.upgradeVillage().ok){}
      while(game.state.buildings.cura<3&&game.upgradeBuilding('cura').ok){}
      const rite=!h.rituals.rape?'rape':game.state.villageLevel>=3&&h.level>=14&&!h.rituals.ayahuasca?'ayahuasca':game.state.villageLevel>=2&&h.level>=8?'kambo':'sananga';
      game.performRitual(h.uid,rite);
    }
    expect(h.stars).toBe(3);expect(days).toBeGreaterThan(2);expect(days).toBeLessThanOrEqual(9);
    console.info(`First avatar, two visits/day: ${days} days; XP ${h.level}, ritual ${h.ritualLevel}.`);
  });
  it('requires both tracks, keeps equipment and position and awakens when normal activity catches up',()=>{
    const game=new Game(),h=game.state.heroes[0];
    h.level=7;h.ritualLevel=3;h.xp=0;h.items=['presa'];game.state.lootSeed=1;
    expect(game.startHunt(h.uid,'terra-firme').ok).toBe(true);finish(game);
    expect(h.level).toBeGreaterThanOrEqual(8);expect(h.stars).toBe(2);expect(h.slot).toBe(3);expect(h.items).toEqual(['presa']);
    const other=new Game(),body=other.state.heroes[0];body.level=24;body.ritualLevel=1;body.slot=null;
    other.assignWorker(body.uid,'lumber');other.catchUp(60);
    expect(body.stars).toBe(1);expect(body.ritualLevel).toBe(1);expect(body.ritualXp).toBe(0);
  });
  it('awakes after ritual completion and requires the deep ceremony for 3 stars',()=>{
    const game=new Game();rich(game);game.state.villageLevel=3;game.state.buildings.cura=3;
    const h=game.state.heroes[0];h.level=24;h.ritualLevel=8;h.rituals.rape=1;
    expect(game.performRitual(h.uid,'rape').ok).toBe(true);finish(game);expect(h.stars).toBe(2);
    expect(game.performRitual(h.uid,'ayahuasca').ok).toBe(false);
    game.catchUp(RITUAL_COOLDOWN);expect(game.performRitual(h.uid,'ayahuasca').ok).toBe(true);finish(game);
    expect(h.stars).toBe(3);expect(h.rituals.ayahuasca).toBe(1);
  });
  it('does not spend anything when either era milestone is missing',()=>{
    const game=new Game();rich(game);const h=game.state.heroes[0],before={...game.state.resources};
    h.level=30;expect(game.upgradeVillage().ok).toBe(false);expect(game.state.resources).toEqual(before);
    h.ritualLevel=2;h.level=1;expect(game.upgradeVillage().ok).toBe(false);
    h.level=4;expect(game.upgradeVillage().ok).toBe(true);
  });
  it('offers deterministic, unique companions outside the old random shop',()=>{
    const game=new Game();rich(game);game.state.shop=[];
    expect(game.recruit(13).ok).toBe(true);expect(game.recruit(13).ok).toBe(false);
    game.state.villageLevel=3;expect(game.recruit(27).ok).toBe(false);
    game.state.heroes[0].ritualLevel=3;expect(game.recruit(27).ok).toBe(true);
    expect(game.state.heroes.map(h=>h.characterId)).toEqual([1,13,27]);
  });
  it('grants fractional worker XP without ritual XP and matches a long offline interval',()=>{
    const live=new Game(),offline=new Game();
    for(const game of [live,offline]){const h=game.state.heroes[0];h.slot=null;game.assignWorker(h.uid,'lumber');game.state.cacao=60;}
    for(let n=0;n<1200;n++)live.tick(.1);
    offline.catchUp(120);
    const a=live.state.heroes[0],b=offline.state.heroes[0];
    expect(totalXp(a.level,a.xp)).toBeCloseTo(totalXp(b.level,b.xp),5);
    expect(totalXp(b.level,b.xp)).toBeCloseTo(WORK_XP_PER_MINUTE*2+WORK_XP_PER_MINUTE*.25);
    expect(b.ritualXp).toBe(0);
  });
  it('credits a finished ceremony once with its true completion time and preserves integration on reload',()=>{
    const game=new Game();rich(game);game.state.buildings.cura=1;
    const h=game.state.heroes[0];game.performRitual(h.uid,'rape');const until=h.away!.until;
    const loaded=new Game(game.serialize(1000),1000+12*3600*1000),restored=loaded.state.heroes[0];
    expect(restored.away).toBeNull();expect(restored.ritualReadyAt).toBe(until+RITUAL_COOLDOWN);
    expect(ritualTotalXp(restored.ritualLevel,restored.ritualXp)).toBe(RITUAL_XP.rape);
    const again=new Game(loaded.serialize(2000),2000);expect(again.state.stats.rituals).toBe(1);
    expect(OFFLINE_CAP_SECONDS).toBe(12*3600);
  });
  it('allows repeated learning but caps ritual stat bonuses and prevents cacao farming',()=>{
    const game=new Game();rich(game);game.state.villageLevel=3;game.state.buildings.cura=3;
    const h=game.state.heroes[0];h.rituals.rape=3;
    expect(game.performRitual(h.uid,'rape').ok).toBe(true);finish(game);
    expect(h.rituals.rape).toBe(3);const learned=ritualTotalXp(h.ritualLevel,h.ritualXp);
    game.holdCacaoCircle();expect(ritualTotalXp(h.ritualLevel,h.ritualXp)).toBe(learned);
    game.catchUp(601);game.holdCacaoCircle();expect(ritualTotalXp(h.ritualLevel,h.ritualXp)).toBe(learned);
  });
  it('organizes eligible heroes by range, keeps away heroes out and forbids changes in battle',()=>{
    const game=new Game();game.state.heroes.push(newHero('ena',8),newHero('boru',3));
    expect(game.autoFormation().ok).toBe(true);expect(game.state.heroes.find(h=>h.uid==='ena')!.slot).toBeGreaterThanOrEqual(7);
    expect(game.state.heroes.find(h=>h.uid==='boru')!.slot).toBeLessThan(7);
    game.startBattle();expect(game.autoFormation().ok).toBe(false);
  });
});
