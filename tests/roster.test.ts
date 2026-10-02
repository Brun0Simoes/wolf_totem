import { describe, expect, it } from 'vitest';
import { characters } from '../src/data/characters';
import { ANIMALITY } from '../src/data/animality';
import { Game, getSynergies, newHero, recruitCost, SKILL_NOTES, type Hero } from '../src/game/simulation';
import { SHOP_ODDS, rollVisitor, sellRefund, unlockedCost } from '../src/game/roster';
import { REGIONS, STAGES } from '../src/game/campaign';
import type { SpiritId } from '../src/game/spirits';
import { BOARD, migrateSlot } from '../src/game/board';

/** A hero placed with a 1.2 slot number, as old saves are, at the given level. */
const placed = (uid: string, characterId: number, stars: number, slot: number, level = 1): Hero => ({ ...newHero(uid, characterId, stars, migrateSlot(slot)), level });
import { TRAIT_RULES } from '../src/game/synergies';

const costOf = (id: number) => characters.find(character => character.id === id)!.cost;

function fight(game: Game, seconds = 160): void {
  for (let i = 0; i < seconds && game.battle?.status === 'fighting'; i++) game.tick(1);
}

describe('recruitment of the full roster', () => {
  it('opens one cost tier per village level and only offers unlocked costs', () => {
    expect([1, 2, 3, 4, 5].map(unlockedCost)).toEqual([1, 2, 3, 4, 5]);
    for (const [index, odds] of SHOP_ODDS.entries()) {
      expect(odds.reduce((sum, value) => sum + value, 0)).toBe(100);
      expect(odds.slice(index + 1).every(value => value === 0)).toBe(true);
    }
    for (const level of [1, 2, 3, 4, 5]) {
      let seed = 1234 + level;
      const seen = new Set<number>();
      for (let i = 0; i < 400; i++) {
        const roll = rollVisitor(seed, level, []);
        seed = roll.seed; seen.add(costOf(roll.id));
        expect(costOf(roll.id)).toBeLessThanOrEqual(level);
      }
      expect(seen.size).toBe(level);
    }
  });

  it('refuses a locked hero, charges by cost and refunds half the spirit when selling', () => {
    const game = new Game();
    game.state.resources = { wood: 0, food: 1000, stone: 0, spirit: 1000 };
    game.state.shop = [49, 1, 2, 4];
    expect(game.recruit(49).ok).toBe(false);
    game.state.villageLevel = 5;
    expect(recruitCost(49)).toEqual({ wood: 0, food: 75, stone: 0, spirit: 150 });
    expect(game.recruit(49).ok).toBe(true);
    expect(game.state.resources).toMatchObject({ food: 925, spirit: 850 });
    const uruq = game.state.heroes.find(hero => hero.characterId === 49)!;
    expect(game.sellHero(uruq.uid).ok).toBe(true);
    expect(game.state.resources.spirit).toBe(850 + sellRefund(5, 1));
    expect(sellRefund(5, 1)).toBe(75);
  });

  it('keeps visits deterministic, free of repeated faces and stable across saves', () => {
    const a = new Game(), b = new Game();
    for (const game of [a, b]) { game.state.villageLevel = 4; game.state.resources.spirit = 100; game.rerollShop(); }
    expect(a.state.shop).toEqual(b.state.shop);
    expect(new Set(a.state.shop).size).toBe(4);
    const loaded = new Game(a.serialize(1000), 1000);
    expect(loaded.state.shopSeed).toBe(a.state.shopSeed);
    expect(loaded.state.shop).toEqual(a.state.shop);
    const legacy = JSON.parse(a.serialize(1000));
    delete legacy.state.shopSeed; legacy.state.shopRotation = 9;
    expect(new Game(legacy, 1000).state.shopSeed).toBe(9);
  });

  it('brings the new cost tier to the campfire as soon as the village grows', () => {
    const game = new Game();
    game.state.resources = { wood: 1e6, food: 1e6, stone: 1e6, spirit: 1e6 };
    for (let level = 2; level <= 5; level++) {
      expect(game.upgradeVillage().ok).toBe(true);
      expect(game.state.shop.every(id => costOf(id) <= level)).toBe(true);
    }
    const offered = new Set<number>();
    for (let i = 0; i < 60; i++) { game.rerollShop(); game.state.shop.forEach(id => offered.add(costOf(id))); }
    expect([...offered].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('restores saved heroes of every cost and drops a shop entry that is still locked', () => {
    const game = new Game();
    const data = JSON.parse(game.serialize(1000));
    data.state.heroes.push({ uid: 'legend', characterId: 55, stars: 2, slot: null, items: [], work: null });
    data.state.shop = [55, 1, 2, 3];
    const loaded = new Game(data, 1000);
    expect(loaded.state.heroes.find(hero => hero.uid === 'legend')?.characterId).toBe(55);
    expect(loaded.state.shop).not.toContain(55);
    expect(loaded.state.shop.every(id => costOf(id) === 1)).toBe(true);
  });
});

describe('abilities, summons and traits', () => {
  it('documents an implemented effect and a visual category for all 55 characters', () => {
    for (const character of characters) {
      expect(SKILL_NOTES[character.id], character.name).toBeTruthy();
      expect(ANIMALITY[character.id], character.name).toBeTruthy();
    }
    const metamorphs = Object.values(ANIMALITY).filter(entry => entry.category === 'Metamorfo');
    expect(metamorphs.length).toBeGreaterThanOrEqual(8);
    expect(metamorphs.length).toBeLessThanOrEqual(12);
    for (const trait of new Set(characters.flatMap(character => character.traits))) expect(TRAIT_RULES[trait], trait).toBeTruthy();
  });

  it('keeps every ability at every star level finite, bounded and on the board', () => {
    for (const character of characters) for (const stars of [1, 2, 3]) {
      const game = new Game();
      game.state.villageLevel = 5; game.state.progress = 20; game.state.selectedStage = 21;
      game.state.heroes = [character.id, character.id === 1 ? 2 : 1, 25].map((characterId, index) => placed(`hero-${index}`, characterId, stars, [1, 2, 9][index], 10));
      game.startBattle();
      const hero = game.battle!.entities.find(entity => entity.uid === 'hero-0')!;
      hero.mana = hero.manaMax;
      for (let t = 0; t < 40 && game.battle!.status === 'fighting'; t++) {
        game.tick(1);
        for (const entity of game.battle!.entities) {
          expect([entity.hp, entity.maxHp, entity.mana, entity.attack, entity.shield, entity.x, entity.y].every(Number.isFinite), `${character.name} ${stars}★`).toBe(true);
          expect(entity.maxHp, `${character.name} ${stars}★`).toBeLessThan(30_000);
          expect(entity.x >= 0 && entity.x <= BOARD.maxX && entity.y >= 0 && entity.y <= BOARD.maxY, `${character.name} ${stars}★`).toBe(true);
        }
      }
    }
  });

  it('summons expire, never decide the battle and are removed at the end', () => {
    const game = new Game();
    game.state.heroes = [placed('nima', 2, 3, 1)];
    game.startBattle();
    const nima = game.battle!.entities.find(entity => entity.uid === 'nima')!;
    nima.mana = nima.manaMax;
    game.tick(0.05);
    const spiders = game.battle!.entities.filter(entity => entity.summon === 'spider');
    expect(spiders).toHaveLength(5);
    expect(game.battle!.zones.some(zone => zone.kind === 'web')).toBe(true);
    nima.hp = 0;
    game.tick(0.05);
    expect(game.battle!.status).toBe('defeat');
    expect(game.battle!.entities.filter(entity => entity.summon).every(entity => entity.hp === 0)).toBe(true);
  });

  it("revives Ssar'ka once with her renewed form", () => {
    const game = new Game();
    game.state.villageLevel = 5;
    game.state.heroes = [placed('ssarka', 53, 2, 1), placed('akru', 1, 3, 2)];
    game.startBattle();
    const ssarka = game.battle!.entities.find(entity => entity.uid === 'ssarka')!;
    const enemy = game.battle!.entities.find(entity => entity.team === 'enemy')!;
    (game as unknown as { damage: (a: unknown, b: unknown, n: number, m: boolean, t: boolean) => void }).damage(enemy, ssarka, 1e6, false, true);
    expect(ssarka.hp).toBeCloseTo(ssarka.maxHp * 0.7);
    expect(ssarka.reborn).toBe(true);
    expect(game.events.some(event => event.type === 'revive')).toBe(true);
    (game as unknown as { damage: (a: unknown, b: unknown, n: number, m: boolean, t: boolean) => void }).damage(enemy, ssarka, 1e6, false, true);
    expect(ssarka.hp).toBe(0);
  });

  it('activates tiered traits and lone spirits from distinct deployed characters', () => {
    const game = new Game();
    game.state.villageLevel = 5;
    game.state.heroes = [9, 15, 19, 24, 49].map((characterId, index) => placed(`g-${index}`, characterId, 1, index));
    const synergies = getSynergies(game.state);
    expect(synergies.find(entry => entry.name === 'Guardião')).toMatchObject({ count: 5, tier: 2, active: true });
    expect(synergies.find(entry => entry.name === 'Espírito do Urso')).toMatchObject({ count: 1, tier: 1, active: true });
    game.startBattle();
    const guardian = game.battle!.entities.find(entity => entity.uid === 'g-1')!;
    expect(guardian.shield).toBeCloseTo(900 * 0.3);
  });
});

describe('expeditions', () => {
  it('defines six regions of five stages, each closed by a boss, growing in cost', () => {
    expect(REGIONS).toHaveLength(6);
    expect(STAGES).toHaveLength(30);
    for (const stage of STAGES) {
      expect(stage.units.filter(unit => unit.boss)).toHaveLength(stage.index === 5 ? 1 : 0);
      for (const unit of stage.units) { expect(costOf(unit.id)).toBeGreaterThanOrEqual(1); expect([1, 2, 3]).toContain(unit.stars); }
    }
    expect(Math.max(...STAGES[0].units.map(unit => costOf(unit.id)))).toBe(1);
    expect(Math.max(...STAGES[29].units.map(unit => costOf(unit.id)))).toBe(5);
  });

  it('starts with Akru alone, who wins the first expedition but needs company for the next', () => {
    const results = [1, 2].map(stage => {
      const game = new Game();
      expect(game.state.heroes).toHaveLength(1);
      game.state.progress = stage - 1; game.state.selectedStage = stage; game.startBattle(); fight(game);
      return game.battle!.status;
    });
    expect(results).toEqual(['victory', 'defeat']);
  });

  it('asks for evolved heroes before the Alpha', () => {
    const alpha = (team: [number, number, number][]) => {
      const game = new Game();
      game.state.villageLevel = 2; game.state.progress = 4; game.state.selectedStage = 5;
      game.state.heroes = team.map(([id, stars, slot], i) => placed(`a-${i}`, id, stars, slot, 3));
      game.startBattle(); fight(game);
      return game.battle!.status;
    };
    expect(alpha([[1, 1, 1], [3, 1, 2], [8, 1, 9]])).toBe('defeat');
    expect(alpha([[1, 2, 1], [3, 1, 2], [8, 2, 9], [15, 1, 10]])).toBe('victory');
  });

  it('lets a tribe behind on levels make up for it with spirits or ceremonies against the King of Buffalo', () => {
    const king = (spirits: SpiritId[], rituals: Hero['rituals']) => {
      const game = new Game();
      game.state.villageLevel = 5; game.state.progress = 19; game.state.selectedStage = 20; game.state.spirits = spirits;
      game.state.heroes = [39, 40, 28, 8, 25, 33, 1].map((characterId, index) => ({ ...placed(`final-${index}`, characterId, 2, [1, 2, 0, 9, 10, 5, 6][index], 5), rituals: { ...rituals } }));
      game.startBattle(); fight(game);
      return game.battle!.status;
    };
    expect(king([], {})).toBe('defeat');
    expect(king(['lobo', 'coruja', 'elefante', 'urso'], {})).toBe('victory');
    expect(king([], { rape: 2, sananga: 2, kambo: 2 })).toBe('victory');
  });
});
