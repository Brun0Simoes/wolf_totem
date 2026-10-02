import { describe, expect, it } from 'vitest';
import { enemyFormation } from '../src/game/board';
import { expectedLevel } from '../src/game/campaign';
import { nextRandom } from '../src/game/roster';
import { Game, newHero, type Hero } from '../src/game/simulation';
import { CACAO_DURATION, huntChance, huntSlots, levelFromTotal, MAX_HERO_LEVEL, PRACTICES, totalXp, TRAILS, xpToNext } from '../src/game/tribe';

const rich = (game: Game) => { game.state.resources = { wood: 1e7, food: 1e7, stone: 1e7, spirit: 1e7 }; };
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
    expect(expectedLevel(30)).toBe(10);
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

  it('keeps the most experienced copy and half of the rest when three copies merge', () => {
    const game = new Game();
    rich(game);
    akru(game).level = 4; akru(game).rituals = { rape: 2 };
    game.state.shop = [1, 1, 2, 3];
    game.recruit(1); game.recruit(1);
    const merged = akru(game);
    expect(merged.stars).toBe(2);
    expect(merged.level).toBe(4);
    expect(merged.rituals.rape).toBe(2);
  });
});

describe('hunting', () => {
  it('sends a hero along an open trail, who returns with experience and game, offline too', () => {
    const game = new Game();
    expect(game.startHunt('hero-1', 'varzea').ok).toBe(false);
    expect(game.startHunt('hero-1', 'terra-firme').ok).toBe(false);
    game.state.lootSeed = seedRolling(0.5, false);
    expect(game.startHunt('hero-1', 'igarape').ok).toBe(true);
    expect(game.startHunt('hero-1', 'igarape').ok).toBe(false);
    expect(game.startBattle().ok).toBe(false);
    const food = game.state.resources.food;
    const loaded = new Game(game.serialize(1_000_000), 1_000_000 + 3 * 60 * 1000);
    const hero = loaded.state.heroes[0];
    expect(hero.away).toBeNull();
    expect(hero.level).toBe(1);
    expect(hero.xp).toBe(TRAILS[0].xp);
    expect(loaded.state.resources.food).toBeGreaterThan(food + TRAILS[0].food);
    expect(loaded.state.reports.at(-1)?.ok).toBe(true);
    expect(loaded.state.stats.hunts).toBe(1);
  });

  it('brings panema home from failed hunts, which weighs on the next ones', () => {
    const game = new Game();
    akru(game).panema = 2;
    game.state.lootSeed = seedRolling(huntChance(1, 2, 0), true);
    game.startHunt('hero-1', 'igarape');
    wait(game, 130);
    expect(akru(game).panema).toBe(3);
    expect(game.state.reports.at(-1)?.ok).toBe(false);
    expect(huntChance(1, 3, 0)).toBeLessThan(huntChance(1, 0, 0));
    expect(huntChance(3, 0, 3)).toBeLessThanOrEqual(0.98);
  });

  it('limits hunters by the camp and lets one be called home early', () => {
    const game = new Game();
    rich(game);
    game.state.heroes.push(newHero('b', 3), newHero('c', 8));
    expect(huntSlots(1)).toBe(1);
    expect(game.startHunt('hero-1', 'igarape').ok).toBe(true);
    expect(game.startHunt('b', 'igarape').ok).toBe(false);
    game.state.buildings.hunt = 4;
    expect(game.startHunt('b', 'igarape').ok).toBe(true);
    expect(game.recallHunt('b').ok).toBe(true);
    expect(game.state.heroes.find(hero => hero.uid === 'b')!.away).toBeNull();
    expect(game.assignWorker('hero-1', 'lumber').ok).toBe(false);
    expect(game.sellHero('hero-1').ok).toBe(false);
  });
});

describe('the Casa de Cura', () => {
  it('describes five practices with their peoples and meaning', () => {
    expect(PRACTICES.map(practice => practice.id)).toEqual(['rape', 'sananga', 'kambo', 'ayahuasca', 'cacau']);
    for (const practice of PRACTICES) { expect(practice.peoples.length).toBeGreaterThan(5); expect(practice.text.length).toBeGreaterThan(40); }
  });

  it('holds ceremonies only with the house built, for heroes in the village, and applies them when they end', () => {
    const game = new Game();
    rich(game);
    const hero = akru(game);
    expect(game.performRitual('hero-1', 'rape').ok).toBe(false);
    expect(game.upgradeBuilding('cura').ok).toBe(true);
    const spirit = game.state.resources.spirit;
    expect(game.performRitual('hero-1', 'rape').ok).toBe(true);
    expect(game.state.resources.spirit).toBe(spirit - PRACTICES[0].cost(0).spirit);
    expect(game.performRitual('hero-1', 'sananga').ok).toBe(false);
    wait(game, 40);
    expect(hero.rituals.rape).toBe(1);
    expect(hero.focus).toBe(true);
    expect(game.performRitual('hero-1', 'kambo').ok).toBe(false);
    expect(game.performRitual('hero-1', 'ayahuasca').ok).toBe(false);
    game.state.villageLevel = 3; game.state.buildings.cura = 3; hero.level = 5; hero.panema = 2;
    expect(game.performRitual('hero-1', 'sananga').ok).toBe(true);
    wait(game, 60);
    expect(hero.panema).toBe(1);
    expect(game.performRitual('hero-1', 'kambo').ok).toBe(true);
    wait(game, 200);
    expect(hero.panema).toBe(0);
    expect(game.performRitual('hero-1', 'ayahuasca').ok).toBe(true);
    wait(game, 610);
    expect(hero.rituals).toEqual({ rape: 1, sananga: 1, kambo: 1, ayahuasca: 1 });
    expect(game.performRitual('hero-1', 'ayahuasca').ok).toBe(false);
    game.startBattle();
    const entity = game.battle!.entities.find(e => e.uid === 'hero-1')!;
    const plain = new Game(); akru(plain).level = 5; plain.startBattle();
    const base = plain.battle!.entities.find(e => e.uid === 'hero-1')!;
    expect(entity.maxHp).toBeCloseTo(base.maxHp * 1.08);
    expect(entity.attack).toBeCloseTo(base.attack * 1.06);
    expect(entity.attackSpeed).toBeCloseTo(base.attackSpeed * 1.05);
    expect(entity.spellPower).toBeCloseTo(base.spellPower * 1.2);
  });

  it('gives rapé focus to the next hunt', () => {
    const plain = new Game(), focused = new Game();
    for (const game of [plain, focused]) game.state.lootSeed = seedRolling(0.5, false);
    akru(focused).focus = true;
    for (const game of [plain, focused]) { game.startHunt('hero-1', 'igarape'); wait(game, 130); }
    expect(totalXp(akru(focused).level, akru(focused).xp)).toBe(totalXp(akru(plain).level, akru(plain).xp) * 1.5);
    expect(akru(focused).focus).toBe(false);
  });

  it('gathers the whole tribe in the cacao circle for a while', () => {
    const game = new Game();
    rich(game);
    game.state.buildings.cura = 1;
    expect(game.holdCacaoCircle().ok).toBe(false);
    game.state.buildings.cura = 2; game.state.villageLevel = 2;
    expect(game.holdCacaoCircle().ok).toBe(true);
    expect(game.holdCacaoCircle().ok).toBe(false);
    expect(game.xpBonus()).toBeCloseTo(1.25);
    wait(game, CACAO_DURATION + 10);
    expect(game.xpBonus()).toBe(1);
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
    data.state.heroes = [{ uid: 'old', characterId: 1, stars: 1, slot: 9, items: [], work: null }] as Partial<Hero>[];
    expect(new Game(data, 1000).state.heroes[0]).toMatchObject({ slot: 17, level: 1, panema: 0, away: null });
  });
});
