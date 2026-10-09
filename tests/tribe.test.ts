import { describe, expect, it } from 'vitest';
import { enemyFormation } from '../src/game/board';
import { expectedLevel } from '../src/game/campaign';
import { nextRandom } from '../src/game/roster';
import { Game, newHero, type Hero } from '../src/game/simulation';
import { CACAO_DURATION, huntChance, huntSlots, levelFromTotal, MAX_HERO_LEVEL, RITUAL_COOLDOWN, PRACTICES, totalXp, TRAILS, xpToNext } from '../src/game/tribe';

const akru = (game: Game) => game.state.heroes[0];
/** Advances village time in steps, as the live clock does. */
const wait = (game: Game, seconds: number) => { for (let t = 0; t < seconds; t += 10) game.tick(10); };
/** A loot seed whose next roll lands at or above the threshold, or below it. */
const seedRolling = (threshold: number, above: boolean) => {
  for (let seed = 1; ; seed++) if ((nextRandom(seed).value >= threshold) === above) return seed;
};

describe('levels', () => {
  it('turns experience into levels and back, up to the cap', () => {
    expect(xpToNext(1)).toBe(50);
    expect(xpToNext(MAX_HERO_LEVEL)).toBe(Infinity);
    for (const total of [0, 49, 50, 777, 4000]) expect(totalXp(levelFromTotal(total).level, levelFromTotal(total).xp)).toBe(total);
    expect(levelFromTotal(1e9)).toEqual({ level: MAX_HERO_LEVEL, xp: 0 });
    expect(expectedLevel(1)).toBe(1);
    expect(expectedLevel(30)).toBe(30);
  });

  it('teaches every hero who marched, newcomers faster, and makes them stronger', () => {
    const game = new Game();
    game.state.heroes.push({ ...newHero('rookie', 3, 1, 4) });
    akru(game).level = 6;
    game.startBattle();
    const before = game.battle!.entities.find(entity => entity.uid === 'hero-1')!.maxHp;
    for (let i = 0; i < 160 && game.battle?.status === 'fighting'; i++) game.tick(1);
    const rookie = game.state.heroes.find(hero => hero.uid === 'rookie')!;
    expect(game.battle!.xp).toBeGreaterThan(0);
    expect(totalXp(rookie.level, rookie.xp)).toBeGreaterThan(game.battle!.xp);
    game.dismissBattle();
    akru(game).level = 1;
    game.startBattle();
    expect(game.battle!.entities.find(entity => entity.uid === 'hero-1')!.maxHp).toBeLessThan(before);
  });

  it('keeps ritual learning independent from normal levels', () => {
    const game=new Game();akru(game).level=4;akru(game).rituals={rape:2};
    expect(game.recruit(1).ok).toBe(false);
    expect(akru(game)).toMatchObject({stars:1,level:4,ritualLevel:1,ritualXp:0,rituals:{rape:2}});
  });

});

describe('hunting', () => {
  it('refuses removed hunting routes and leaves the hero available',()=>{
    const game=new Game(),before=game.serialize(1000);for(const t of TRAILS)expect(game.startHunt('hero-1',t.id).ok).toBe(false);expect(game.serialize(1000)).toBe(before);expect(game.startBattle().ok).toBe(true);
  });

  it('migrates legacy panema and pending hunts into available guardians',()=>{
    const game=new Game(),old=JSON.parse(game.serialize(1000));old.version=8;old.state.heroes[0].panema=3;old.state.heroes[0].away={kind:'hunt',id:'igarape',until:600};const loaded=new Game(old,1e9);expect(loaded.state.heroes[0].panema).toBe(0);expect(loaded.state.heroes[0].away).toBeNull();expect(loaded.state.heroes[0].xp).toBe(0);expect(loaded.state.stats.hunts).toBe(0);
  });

  it('keeps no available hunt action after any era advancement',()=>{
    const game=new Game();game.state.era=5;game.state.heroes.push(newHero('b',3),newHero('c',8));for(const h of game.state.heroes){expect(game.startHunt(h.uid,'igarape').ok).toBe(false);expect(game.recallHunt(h.uid).ok).toBe(false);}expect(game.state.heroes.every(h=>h.away===null)).toBe(true);
  });
});

describe('the Casa de Cura', () => {
  it('completes the four personal rites with integration, lifts panema and preserves their combat effects', () => {
    const game = new Game(), hero = akru(game);game.state.amber=1000;
    expect(game.performRitual(hero.uid, 'rape').ok).toBe(true);
    expect(hero.ritualReadyAt).toBe(0);
    wait(game, PRACTICES[0].rest + 10);
    expect(hero.rituals.rape).toBe(1);
    expect(hero.focus).toBe(true);
    expect(game.performRitual(hero.uid, 'sananga').ok).toBe(false);
    game.state.era = 3; hero.level = 14; hero.panema = 2;
    wait(game, RITUAL_COOLDOWN);
    expect(game.performRitual(hero.uid, 'sananga').ok).toBe(true);
    wait(game, PRACTICES[1].rest + 10 + RITUAL_COOLDOWN);
    expect(hero.panema).toBe(1);
    expect(game.performRitual(hero.uid, 'kambo').ok).toBe(true);
    wait(game, PRACTICES[2].rest + 10 + RITUAL_COOLDOWN);
    expect(hero.panema).toBe(0);
    expect(game.performRitual(hero.uid, 'ayahuasca').ok).toBe(true);
    wait(game, PRACTICES[3].rest + 10);
    expect(hero.rituals).toEqual({ rape: 1, sananga: 1, kambo: 1, ayahuasca: 1 });
    game.state.amber=0;expect(game.performRitual(hero.uid, 'ayahuasca').ok).toBe(false);
    game.startBattle();
    const entity = game.battle!.entities.find(e => e.uid === hero.uid)!;
    const plain = new Game(); akru(plain).level = hero.level; akru(plain).stars = hero.stars; plain.startBattle();
    const base = plain.battle!.entities.find(e => e.uid === 'hero-1')!;
    expect(entity.maxHp).toBeCloseTo(base.maxHp * 1.08);
    expect(entity.attack).toBeCloseTo(base.attack * 1.06);
    expect(entity.attackSpeed).toBeCloseTo(base.attackSpeed * 1.05);
    expect(entity.spellPower).toBeCloseTo(base.spellPower * 1.2);
  });
  it('describes five practices with their peoples and meaning', () => {
    expect(PRACTICES.map(practice => practice.id)).toEqual(['rape', 'sananga', 'kambo', 'ayahuasca', 'cacau']);
    for (const practice of PRACTICES) { expect(practice.peoples.length).toBeGreaterThan(5); expect(practice.text.length).toBeGreaterThan(40); }
  });

  it('repeated paid rape strengthens attack speed only to its learned cap',()=>{
    const g=new Game();g.state.amber=1000;for(let n=0;n<5;n++)expect(g.performRitual('hero-1','rape').ok).toBe(true);expect(g.state.heroes[0].rituals.rape).toBe(3);g.startBattle();const e=g.battle!.entities[0];const base=new Game();base.startBattle();expect(e.attackSpeed).toBeCloseTo(base.battle!.entities[0].attackSpeed*1.15);
  });

  it('cacao learning stays active through elapsed time and is paid once',()=>{
    const game=new Game();game.state.era=2;expect(game.holdCacaoCircle().ok).toBe(true);expect(game.xpBonus()).toBe(1.25);wait(game,1000);expect(game.xpBonus()).toBe(1.25);expect(game.state.cacaoBattles).toBe(3);expect(game.holdCacaoCircle().ok).toBe(false);
  });
});

describe('a harder field', () => {
  it('puts melee enemies in front and archers behind', () => {
    const slots = enemyFormation([false, true, false, true]);
    expect(slots.slice(0, 1)).toEqual([3]);
    expect(Math.floor(slots[1] / 7)).toBe(1);
    expect(Math.floor(slots[2] / 7)).toBe(0);
    expect(new Set(slots).size).toBe(4);
  });

  it('moves 1.2 formations onto the larger board', () => {
    const game = new Game();
    const data = JSON.parse(game.serialize(1000));
    data.version = 2;
    data.state.heroes = [{ uid: 'old', characterId: 1, stars: 1, slot: 9, items: [] }] as Partial<Hero>[];
    expect(new Game(data, 1000).state.heroes[0]).toMatchObject({ slot: 17, level: 1, panema: 0, away: null });
  });
});
