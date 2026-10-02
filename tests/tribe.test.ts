import { describe, expect, it } from 'vitest';
import { enemyFormation } from '../src/game/board';
import { expectedLevel, expectedStars, STAGE_POWER } from '../src/game/campaign';
import { nextRandom } from '../src/game/roster';
import { callBlocker, callOffering, Game, newHero, type Hero } from '../src/game/simulation';
import {
  ASCENSIONS, atCeiling, CALL_LEVEL, CALL_MINUTES, huntChance, huntSlots, levelCap, levelFromTotal, MAX_HERO_LEVEL, PRACTICES, practiceById,
  RITUAL_NEEDED, totalXp, TRAILS, tribeRitualLevel, TRIBE_RITUAL_LEVELS, xpToNext,
} from '../src/game/tribe';

const rich = (game: Game) => { game.state.resources = { wood: 1e9, food: 1e9, stone: 1e9, spirit: 1e9 }; };
const akru = (game: Game) => game.state.heroes[0];
/** Advances village time in steps, as the live clock does. */
const wait = (game: Game, seconds: number) => { for (let t = 0; t < seconds; t += 60) game.tick(Math.min(60, seconds - t)); };
/** A loot seed whose next roll lands at or above the threshold, or below it. */
const seedRolling = (threshold: number, above: boolean) => {
  for (let seed = 1; ; seed++) if ((nextRandom(seed).value >= threshold) === above) return seed;
};
/** A Casa de Cura of the given level, already standing. */
const withCura = (game: Game, level: number, era = 2) => { game.state.buildings.cura = level; game.state.villageLevel = era; };

describe('two tracks: experience and ritual strength', () => {
  it('turns experience into levels and back, and stops each star at its ceiling with one level in reserve', () => {
    expect(xpToNext(1)).toBe(35);
    expect(xpToNext(MAX_HERO_LEVEL)).toBe(Infinity);
    for (const total of [0, 34, 35, 777, 4000]) expect(totalXp(levelFromTotal(total).level, levelFromTotal(total).xp)).toBe(total);
    expect(levelFromTotal(1e9)).toEqual({ level: MAX_HERO_LEVEL, xp: 0 });
    expect([1, 2, 3].map(levelCap)).toEqual([10, 20, 30]);
    const capped = levelFromTotal(1e9, 10);
    expect(capped).toEqual({ level: 10, xp: xpToNext(10) });
    expect(atCeiling({ stars: 1, ...capped })).toBe(true);
    expect(atCeiling({ stars: 2, ...capped })).toBe(false);
    expect(totalXp(20, 0)).toBeGreaterThan(50_000);
    expect(totalXp(30, 0)).toBeGreaterThan(150_000);
  });

  it('expects one level per stage and an awakened star at stages 11 and 21', () => {
    expect([1, 10, 11, 20, 21, 30, 40].map(expectedLevel)).toEqual([1, 10, 11, 20, 21, 30, 30]);
    expect([10, 11, 20, 21].map(expectedStars)).toEqual([1, 2, 2, 3]);
    expect(STAGE_POWER).toHaveLength(30);
    expect(STAGE_POWER[20]).toBeGreaterThan(STAGE_POWER[18] * 2);
  });

  it('teaches every hero who marched, newcomers faster, and makes them stronger', () => {
    const game = new Game();
    game.state.heroes.push(newHero('rookie', 3, 1, 4));
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

  it('teaches the craft to heroes who work, offline too, but not while they are away', () => {
    const game = new Game();
    game.state.heroes.push(newHero('worker', 3));
    expect(game.assignWorker('worker', 'lumber').ok).toBe(true);
    const loaded = new Game(game.serialize(0), 3 * 3600 * 1000);
    const worker = loaded.state.heroes.find(hero => hero.uid === 'worker')!;
    expect(totalXp(worker.level, worker.xp)).toBeGreaterThan(200);
    const xp = totalXp(worker.level, worker.xp);
    worker.away = { kind: 'hunt', id: 'igarape', until: loaded.state.clock + 1e6 };
    wait(loaded, 600);
    expect(totalXp(worker.level, worker.xp)).toBe(xp);
    expect(worker.work).toBe('lumber');
  });

  it('fills the ritual bar with ceremonies, up to what the next star asks, and counts all of it for the tribe', () => {
    const game = new Game();
    rich(game); withCura(game, 3);
    const hero = akru(game);
    hero.ritual = RITUAL_NEEDED[0] - 2;
    expect(game.performRitual('hero-1', 'rape').ok).toBe(true);
    expect(hero.ritual).toBe(RITUAL_NEEDED[0]);
    expect(game.state.ritualTotal).toBe(4);
    expect(hero.away).toBeNull();
    expect(hero.focus).toBe(true);
  });
});

describe('ascension', () => {
  it('asks for both bars full, the Casa de Cura and an offering, then awakens the next star', () => {
    const game = new Game();
    rich(game); withCura(game, 1);
    const hero = akru(game);
    hero.level = 10; hero.xp = 0;
    expect(game.ascend('hero-1').ok).toBe(false);
    hero.ritual = RITUAL_NEEDED[0];
    expect(game.ascensionBlocker('hero-1')).toContain('Casa de Cura nível 2');
    game.state.buildings.cura = 2;
    hero.level = 9;
    expect(game.ascend('hero-1').ok).toBe(false);
    hero.level = 10; hero.xp = xpToNext(10);
    const spirit = game.state.resources.spirit;
    expect(game.ascend('hero-1').ok).toBe(true);
    expect(game.state.resources.spirit).toBe(spirit - ASCENSIONS[0].cost.spirit);
    expect(hero.away?.kind).toBe('ascension');
    expect(game.startHunt('hero-1', 'igarape').ok).toBe(false);
    wait(game, ASCENSIONS[0].hours * 3600 + 60);
    expect(hero.stars).toBe(2);
    expect(hero.ritual).toBe(0);
    // The experience kept at the old ceiling flows into level 11 at once.
    expect(hero.level).toBe(11);
    expect(game.state.stats.ascensions).toBe(1);
    expect(game.state.reports.at(-1)?.kind).toBe('ascension');
  });

  it('takes a hero from 2★ to the primal form only with 500 of ritual strength and level 20', () => {
    const game = new Game();
    rich(game); withCura(game, 4, 3);
    const hero: Hero = { ...akru(game), stars: 2, level: 20, xp: 0, ritual: RITUAL_NEEDED[1] - 1 };
    game.state.heroes = [hero];
    expect(game.ascend(hero.uid).ok).toBe(false);
    hero.ritual = RITUAL_NEEDED[1];
    expect(game.ascend(hero.uid).ok).toBe(true);
    wait(game, ASCENSIONS[1].hours * 3600 + 60);
    expect(hero.stars).toBe(3);
    expect(game.ascend(hero.uid).ok).toBe(false);
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
    const loaded = new Game(game.serialize(1_000_000), 1_000_000 + 12 * 60 * 1000);
    const hero = loaded.state.heroes[0];
    expect(hero.away).toBeNull();
    expect(totalXp(hero.level, hero.xp)).toBe(TRAILS[0].xp);
    expect(loaded.state.resources.food).toBeGreaterThan(food + TRAILS[0].food);
    expect(loaded.state.reports.at(-1)).toMatchObject({ ok: true, kind: 'hunt' });
    expect(loaded.state.stats.hunts).toBe(1);
  });

  it('brings panema home from failed hunts, which weighs on the next ones', () => {
    const game = new Game();
    akru(game).panema = 2;
    game.state.lootSeed = seedRolling(huntChance(1, 2), true);
    game.startHunt('hero-1', 'igarape');
    wait(game, 11 * 60);
    expect(akru(game).panema).toBe(3);
    expect(game.state.reports.at(-1)?.ok).toBe(false);
    expect(huntChance(1, 3)).toBeLessThan(huntChance(1, 0));
    expect(huntChance(1, 1, true)).toBeGreaterThan(huntChance(1, 1));
    expect(huntChance(3, 0, true)).toBeLessThanOrEqual(0.98);
  });

  it('limits hunters by the camp and lets one be called home early', () => {
    const game = new Game();
    game.state.heroes.push(newHero('b', 3), newHero('c', 8));
    expect(huntSlots(1)).toBe(1);
    expect(game.startHunt('hero-1', 'igarape').ok).toBe(true);
    expect(game.startHunt('b', 'igarape').ok).toBe(false);
    game.state.buildings.hunt = 4;
    expect(game.startHunt('b', 'igarape').ok).toBe(true);
    expect(game.recallHunt('b').ok).toBe(true);
    expect(game.state.heroes.find(hero => hero.uid === 'b')!.away).toBeNull();
  });

  it('gives rapé focus and sananga sight to the next hunt', () => {
    const plain = new Game(), blessed = new Game();
    for (const game of [plain, blessed]) { game.state.lootSeed = seedRolling(0.5, false); rich(game); withCura(game, 1, 1); }
    expect(blessed.performRitual('hero-1', 'rape').ok).toBe(true);
    for (const game of [plain, blessed]) { game.startHunt('hero-1', 'igarape'); wait(game, 11 * 60); }
    expect(totalXp(akru(plain).level, akru(plain).xp)).toBe(TRAILS[0].xp);
    expect(totalXp(akru(blessed).level, akru(blessed).xp)).toBe(Math.round(TRAILS[0].xp * 1.5));
    expect(akru(blessed).focus).toBe(false);
    akru(blessed).level = 3; akru(blessed).panema = 2;
    expect(blessed.performRitual('hero-1', 'sananga').ok).toBe(true);
    expect(akru(blessed)).toMatchObject({ panema: 1, sight: true });
  });
});

describe('the Casa de Cura', () => {
  it('describes five practices with their peoples and meaning', () => {
    expect(PRACTICES.map(practice => practice.id)).toEqual(['rape', 'sananga', 'kambo', 'ayahuasca', 'cacau']);
    for (const practice of PRACTICES) { expect(practice.peoples.length).toBeGreaterThan(5); expect(practice.text.length).toBeGreaterThan(40); }
  });

  it('holds each ceremony again only after its rest, in a house with room, for heroes in the village', () => {
    const game = new Game();
    rich(game);
    const hero = akru(game);
    expect(game.performRitual('hero-1', 'rape').ok).toBe(false);
    withCura(game, 2);
    expect(game.performRitual('hero-1', 'rape').ok).toBe(true);
    expect(game.performRitual('hero-1', 'rape').ok).toBe(false);
    wait(game, practiceById('rape')!.cooldown);
    expect(game.performRitual('hero-1', 'rape').ok).toBe(true);
    expect(game.performRitual('hero-1', 'kambo').ok).toBe(false);
    hero.level = 6; hero.panema = 3;
    expect(game.performRitual('hero-1', 'kambo').ok).toBe(true);
    expect(hero.away?.kind).toBe('ritual');
    game.state.heroes.push(newHero('b', 3, 1, null, 8));
    expect(game.ritualBlocker('b', 'kambo')).toContain('maloca está cheia');
    wait(game, 3600 + 60);
    expect(hero.panema).toBe(0);
    expect(hero.ritual).toBe(4 + 4 + 20);
    expect(game.performRitual('hero-1', 'kambo').ok).toBe(false);
    expect(game.ritualBlocker('hero-1', 'ayahuasca')).toContain('Casa de Cura nível 3');
    game.state.buildings.cura = 3; hero.level = 8;
    expect(game.performRitual('hero-1', 'ayahuasca').ok).toBe(true);
    wait(game, 8 * 3600 + 60);
    expect(hero.rituals).toEqual({ rape: 2, kambo: 1, ayahuasca: 1 });
    expect(hero.ritual).toBe(28 + 45);
  });

  it('gathers the tribe at home in the cacao circle: ritual strength and faster learning', () => {
    const game = new Game();
    rich(game);
    game.state.heroes.push(newHero('b', 3), newHero('c', 8));
    game.state.buildings.cura = 1;
    expect(game.holdCacaoCircle().ok).toBe(false);
    withCura(game, 2);
    game.state.heroes[2].away = { kind: 'hunt', id: 'igarape', until: game.state.clock + 1e6 };
    expect(game.holdCacaoCircle().ok).toBe(true);
    expect(game.state.heroes.map(hero => hero.ritual)).toEqual([3, 3, 0]);
    expect(game.holdCacaoCircle().ok).toBe(false);
    expect(game.xpBonus()).toBeCloseTo(1.25);
    wait(game, 2 * 3600 + 60);
    expect(game.xpBonus()).toBe(1);
    wait(game, 10 * 3600);
    game.state.heroes[2].away = null;
    expect(game.holdCacaoCircle().ok).toBe(true);
  });
});

describe('the call of the spirits', () => {
  it('raises the tribe ritual level with every point of ritual strength', () => {
    expect(tribeRitualLevel(0).level).toBe(1);
    expect(tribeRitualLevel(TRIBE_RITUAL_LEVELS[1]).level).toBe(2);
    expect(tribeRitualLevel(1e9).level).toBe(TRIBE_RITUAL_LEVELS.length);
    expect(CALL_LEVEL).toEqual([1, 2, 4, 6, 8]);
  });

  it('calls each character once, by era and tribe ritual level, and brings the hero after a while', () => {
    const game = new Game();
    rich(game);
    expect(callBlocker(game.state, 1)).toContain('já caminha');
    expect(callBlocker(game.state, 14)).toContain('Era II');
    expect(game.call(3).ok).toBe(true);
    expect(game.call(3).ok).toBe(false);
    expect(game.call(8).ok).toBe(false);
    wait(game, CALL_MINUTES[0] * 60 + 30);
    const boru = game.state.heroes.find(hero => hero.characterId === 3)!;
    expect(boru).toMatchObject({ stars: 1, level: 1 });
    // A free place in the formation is taken at once.
    expect(boru.slot).not.toBeNull();
    expect(game.state.stats.calls).toBe(1);
    game.state.villageLevel = 2;
    expect(callBlocker(game.state, 14)).toContain('nível ritual 2');
    game.state.ritualTotal = TRIBE_RITUAL_LEVELS[1];
    expect(callBlocker(game.state, 14)).toBeNull();
    expect(callOffering(game.state, 14).spirit).toBeGreaterThan(callOffering(new Game().state, 14).spirit);
  });

  it('lets veterans welcome newcomers at half their level', () => {
    const game = new Game();
    rich(game);
    akru(game).level = 9;
    game.call(3);
    wait(game, 4 * 60);
    expect(game.state.heroes.find(hero => hero.characterId === 3)!.level).toBe(4);
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
});
