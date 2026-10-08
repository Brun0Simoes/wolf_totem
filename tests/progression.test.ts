import { describe, expect, it } from 'vitest';
import { Game, newHero, OFFLINE_CAP_SECONDS } from '../src/game/simulation';
import { RITUAL_COOLDOWN, RITUAL_XP, ritualTotalXp, totalXp } from '../src/game/tribe';

const finish=(game:Game)=>{const h=game.state.heroes[0];if(h.away)game.catchUp(h.away.until-game.state.clock+1);};

describe('two independent awakening tracks',()=>{
  it('requires both tracks, keeps equipment and position and awakens when normal activity catches up',()=>{
    const game=new Game(),h=game.state.heroes[0];
    h.level=7;h.ritualLevel=3;h.xp=0;h.items=['presa'];game.state.lootSeed=1;
    expect(game.startHunt(h.uid,'terra-firme').ok).toBe(true);finish(game);
    expect(h.level).toBeGreaterThanOrEqual(8);expect(h.stars).toBe(2);expect(h.slot).toBe(3);expect(h.items).toEqual(['presa']);
    const other=new Game(),body=other.state.heroes[0];body.level=24;body.ritualLevel=1;body.slot=null;
    other.catchUp(60);
    expect(body.stars).toBe(1);expect(body.ritualLevel).toBe(1);expect(body.ritualXp).toBe(0);
  });
  it('awakes after ritual completion and requires the deep ceremony for 3 stars',()=>{
    const game=new Game();game.state.era=3;
    const h=game.state.heroes[0];h.level=24;h.ritualLevel=8;h.rituals.rape=1;
    expect(game.performRitual(h.uid,'rape').ok).toBe(true);finish(game);expect(h.stars).toBe(2);
    expect(game.performRitual(h.uid,'ayahuasca').ok).toBe(false);
    game.catchUp(RITUAL_COOLDOWN);expect(game.performRitual(h.uid,'ayahuasca').ok).toBe(true);finish(game);
    expect(h.stars).toBe(3);expect(h.rituals.ayahuasca).toBe(1);
  });
  it('does not spend anything when either era milestone is missing',()=>{
    const game=new Game();const h=game.state.heroes[0],before=game.state.era;
    h.level=30;expect(game.advanceEra().ok).toBe(false);expect(game.state.era).toEqual(before);
    h.ritualLevel=2;h.level=1;expect(game.advanceEra().ok).toBe(false);
    h.level=4;expect(game.advanceEra().ok).toBe(true);
  });
  it('offers deterministic, unique companions outside the old random shop',()=>{
    const game=new Game();
    expect(game.recruit(13).ok).toBe(true);expect(game.recruit(13).ok).toBe(false);
    game.state.era=3;expect(game.recruit(27).ok).toBe(false);
    game.state.heroes[0].ritualLevel=3;expect(game.recruit(27).ok).toBe(true);
    expect(game.state.heroes.map(h=>h.characterId)).toEqual([1,13,27]);
  });
  it('credits a finished ceremony once with its true completion time and preserves integration on reload',()=>{
    const game=new Game();
    const h=game.state.heroes[0];game.performRitual(h.uid,'rape');const until=h.away!.until;
    const loaded=new Game(game.serialize(1000),1000+12*3600*1000),restored=loaded.state.heroes[0];
    expect(restored.away).toBeNull();expect(restored.ritualReadyAt).toBe(until+RITUAL_COOLDOWN);
    expect(ritualTotalXp(restored.ritualLevel,restored.ritualXp)).toBe(RITUAL_XP.rape);
    const again=new Game(loaded.serialize(2000),2000);expect(again.state.stats.rituals).toBe(1);
    expect(OFFLINE_CAP_SECONDS).toBe(12*3600);
  });
  it('allows repeated learning but caps ritual stat bonuses and prevents cacao farming',()=>{
    const game=new Game();game.state.era=3;
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
