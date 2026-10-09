import { describe, expect, it } from 'vitest';
import { RitualPlay, participationBonus } from '../src/game/ritualPlay';
import { Game, newHero } from '../src/game/simulation';
import { RITUAL_XP, ritualTotalXp, RITUAL_COOLDOWN } from '../src/game/tribe';

const advance = (play: RitualPlay, seconds: number) => { for (let n=0;n<Math.round(seconds*100);n++) play.tick(.01); };
const prepared = () => { const game=new Game();game.state.era=3;const h=game.state.heroes[0];h.level=24;h.rituals.rape=1;return game; };

describe('interactive ritual mechanics',()=>{
  it('measures three separate blows and scores release timing',()=>{
    const p=new RitualPlay('rape');
    for(let n=0;n<3;n++){p.press();advance(p,p.target/.48);p.release();}
    expect(p.done).toBe(true);expect(p.quality).toBeGreaterThan(.98);expect(p.points).toHaveLength(3);
    p.press();p.release();expect(p.points).toHaveLength(3);
    const early=new RitualPlay('rape');early.press();early.release();expect(early.points[0]).toBe(0);
  });
  it('requires focus alignment, with a wider optional timing window',()=>{
    const seconds=Math.acos(1-2*.65)*3/(2*Math.PI),p=new RitualPlay('sananga');
    advance(p,seconds);p.press();expect(p.points[0]).toBeGreaterThan(.97);
    const normal=new RitualPlay('sananga'),gentle=new RitualPlay('sananga',1,true);
    advance(normal,.7);advance(gentle,.7);normal.press();gentle.press();expect(gentle.quality).toBeGreaterThan(normal.quality);
  });
  it('blocks answers during the memory demonstration and checks the actual order',()=>{
    const p=new RitualPlay('kambo',42);p.press(p.pattern[0]);expect(p.memoryIndex).toBe(0);
    for(let n=0;n<3;n++){const pattern=p.pattern;advance(p,pattern.length*.9+.41);for(const stone of pattern)p.press(stone);}
    expect(p.done).toBe(true);expect(p.quality).toBe(1);
    const wrong=new RitualPlay('kambo',42);advance(wrong,3.2);wrong.press((wrong.pattern[0]+1)%4);expect(wrong.quality).toBe(0);
  });
  it('scores shared pulses independently and missed beats cannot be retried',()=>{
    const p=new RitualPlay('cacau');for(let i=0;i<8;i++){advance(p,1.17);p.press();}
    expect(p.done).toBe(true);expect(p.quality).toBeCloseTo(1);
    const missed=new RitualPlay('cacau');advance(missed,2);expect(missed.round).toBe(1);expect(missed.points[0]).toBe(0);
  });
  it('scores time spent following the river rather than number of clicks',()=>{
    const guided=new RitualPlay('ayahuasca'),idle=new RitualPlay('ayahuasca');
    for(let i=0;i<1801;i++){guided.light=guided.river;guided.tick(.01);idle.tick(.01);}
    expect(guided.done).toBe(true);expect(guided.quality).toBeGreaterThan(.99);expect(idle.quality).toBeLessThan(.6);
  });
  it('caps frame advances, ignores invalid time and ends an abandoned preparation',()=>{
    const p=new RitualPlay('rape');p.tick(NaN);p.tick(-1);expect(p.elapsed).toBe(0);p.tick(3600);expect(p.elapsed).toBe(.05);
    advance(p,46);expect(p.done).toBe(true);expect(p.quality).toBe(0);
  });
});

describe('participation and lasting progression',()=>{
  it('caps invalid and out-of-range scores',()=>{
    expect(participationBonus(90,NaN)).toBe(0);expect(participationBonus(90,Infinity)).toBe(0);expect(participationBonus(90,-1)).toBe(0);expect(participationBonus(90,10)).toBe(18);
  });
  it('persists immediate participation XP with no extra reward after reload',()=>{
    const game=prepared(),h=game.state.heroes[0];expect(game.performRitual(h.uid,'rape',1).ok).toBe(true);expect(ritualTotalXp(h.ritualLevel,h.ritualXp)).toBe(108);const loaded=new Game(game.serialize(1000),1e9);expect(loaded.state.heroes[0].away).toBeNull();expect(loaded.state.heroes[0].ritualReadyAt).toBe(0);expect(ritualTotalXp(loaded.state.heroes[0].ritualLevel,loaded.state.heroes[0].ritualXp)).toBe(108);expect(loaded.state.amber).toBe(game.state.amber);
  });
  it('keeps automatic ceremonies at base XP and rejects unmet requirements without spending',()=>{
    const game=prepared(),h=game.state.heroes[0];h.level=1;const before=game.state.era;
    expect(game.performRitual(h.uid,'ayahuasca',1).ok).toBe(false);expect(game.state.era).toEqual(before);
    expect(game.performRitual(h.uid,'rape').ok).toBe(true);game.catchUp(1201);expect(ritualTotalXp(h.ritualLevel,h.ritualXp)).toBe(RITUAL_XP.rape);
  });
  it('caps a forged v8 pending participation bonus during one-time migration',()=>{
    const g=prepared(),save=JSON.parse(g.serialize(1000));save.version=8;save.state.heroes[0].away={kind:'ritual',id:'rape',until:200,participationXp:999999};const loaded=new Game(save,1000);expect(ritualTotalXp(loaded.state.heroes[0].ritualLevel,loaded.state.heroes[0].ritualXp)).toBe(108);expect(new Game(loaded.serialize(1000),1e9).state).toEqual(loaded.state);
  });
  it('shares purchased cacao learning with all guardians without timer prerequisites',()=>{
    const game=prepared();game.state.heroes.push(newHero('b',2),newHero('c',3));expect(game.holdCacaoCircle(1).ok).toBe(true);expect(game.state.heroes.every(h=>ritualTotalXp(h.ritualLevel,h.ritualXp)===72)).toBe(true);const before=game.serialize(1000);expect(game.holdCacaoCircle(1).ok).toBe(false);expect(game.serialize(1000)).toBe(before);
  });
});
