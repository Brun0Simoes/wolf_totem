import { describe, expect, it } from 'vitest';
import { Game, newHero, OFFLINE_CAP_SECONDS } from '../src/game/simulation';
import { RITUAL_COOLDOWN, RITUAL_XP, ritualTotalXp, totalXp } from '../src/game/tribe';

const finish=(game:Game)=>{const h=game.state.heroes[0];if(h.away)game.catchUp(h.away.until-game.state.clock+1);};

describe('two independent awakening tracks',()=>{
  it('awakens from battle XP while preserving equipment, position and the independent ritual track',()=>{
    const game=new Game(),h=game.state.heroes[0];h.level=7;h.ritualLevel=3;h.xp=50*Math.pow(7,2.1)-100;h.items=['presa'];
game.startBattle();for(let n=0;n<160&&game.battle!.status==='fighting';n++)game.tick(1);
expect(h.level).toBeGreaterThanOrEqual(8);expect(h.stars).toBe(2);expect(h.items).toEqual(['presa']);expect(h.slot).toBe(3);
const other=new Game();other.state.heroes[0].level=24;other.catchUp(1e9);expect(other.state.heroes[0].ritualLevel).toBe(1);expect(other.state.heroes[0].stars).toBe(1);
  });
  it('awakes after ritual completion and requires the deep ceremony for 3 stars',()=>{
    const game=new Game();game.state.era=3;
    const h=game.state.heroes[0];h.level=24;h.ritualLevel=8;h.rituals.rape=1;
    expect(game.performRitual(h.uid,'rape').ok).toBe(true);finish(game);expect(h.stars).toBe(2);
    expect(game.performRitual(h.uid,'ayahuasca').ok).toBe(false);game.state.amber=200;
    game.catchUp(RITUAL_COOLDOWN);expect(game.performRitual(h.uid,'ayahuasca').ok).toBe(true);finish(game);
    expect(h.stars).toBe(3);expect(h.rituals.ayahuasca).toBe(1);
  });
  it('does not spend anything when either era milestone is missing',()=>{
    const game=new Game();const h=game.state.heroes[0],before=game.state.era;
    h.level=30;expect(game.advanceEra().ok).toBe(false);expect(game.state.era).toEqual(before);
    h.ritualLevel=2;h.level=1;expect(game.advanceEra().ok).toBe(false);
    h.level=4;expect(game.advanceEra().ok).toBe(true);
  });
  it('requires a paid offer and accepts exactly one unique identity',()=>{
    const game=new Game();expect(game.recruit(13).ok).toBe(false);game.openDraft();const id=game.state.draft!.offers[0];expect(game.recruit(id).ok).toBe(true);expect(game.recruit(id).ok).toBe(false);expect(game.state.heroes.map(h=>h.characterId)).toEqual([1,id]);
  });
  it('persists immediate ritual learning without offline duplication or integration clocks',()=>{
    const game=new Game(),h=game.state.heroes[0];game.performRitual(h.uid,'rape');const loaded=new Game(game.serialize(1000),1e9),restored=loaded.state.heroes[0];expect(restored.away).toBeNull();expect(restored.ritualReadyAt).toBe(0);expect(ritualTotalXp(restored.ritualLevel,restored.ritualXp)).toBe(90);expect(loaded.state.amber).toBe(game.state.amber);expect(new Game(loaded.serialize(1000),1e9).state.stats.rituals).toBe(1);
  });
  it('caps ritual stat bonuses while charging each repeated ceremony',()=>{
    const game=new Game();game.state.era=3;game.state.amber=1000;const h=game.state.heroes[0];h.rituals.rape=3;expect(game.performRitual(h.uid,'rape').ok).toBe(true);expect(h.rituals.rape).toBe(3);const learned=ritualTotalXp(h.ritualLevel,h.ritualXp);expect(game.holdCacaoCircle().ok).toBe(true);expect(ritualTotalXp(h.ritualLevel,h.ritualXp)).toBe(learned+60);const before=game.serialize(1000);expect(game.holdCacaoCircle().ok).toBe(false);expect(game.serialize(1000)).toBe(before);
  });
  it('organizes eligible heroes by range, keeps away heroes out and forbids changes in battle',()=>{
    const game=new Game();game.state.heroes.push(newHero('ena',8),newHero('boru',3));
    expect(game.autoFormation().ok).toBe(true);expect(game.state.heroes.find(h=>h.uid==='ena')!.slot).toBeGreaterThanOrEqual(7);
    expect(game.state.heroes.find(h=>h.uid==='boru')!.slot).toBeLessThan(7);
    game.startBattle();expect(game.autoFormation().ok).toBe(false);
  });
});
