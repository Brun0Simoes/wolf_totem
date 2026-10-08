import { describe, expect, it } from 'vitest';
import { characters } from '../src/data/characters';
import { ANIMALITY } from '../src/data/animality';
import { Game, getSynergies, newHero,  SKILL_NOTES, type Hero } from '../src/game/simulation';
import { unlockedCost } from '../src/game/roster';
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
      game.state.era = 5; game.state.progress = 20; game.state.selectedStage = 21;
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
    game.tick(.5);
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
    game.state.era = 5;
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
    game.state.era = 5;
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
      game.state.era = 2; game.state.progress = 4; game.state.selectedStage = 5;
      game.state.heroes = team.map(([id, stars, slot], i) => placed(`a-${i}`, id, stars, slot, 8));
      game.startBattle(); fight(game);
      return game.battle!.status;
    };
    expect(alpha([[1, 1, 1], [3, 1, 2], [8, 1, 9]])).toBe('defeat');
    expect(alpha([[1, 2, 1], [3, 1, 2], [8, 2, 9], [15, 1, 10]])).toBe('victory');
  });

  it('lets a tribe behind on levels make up for it with spirits or ceremonies against the King of Buffalo', () => {
    const king = (spirits: SpiritId[], rituals: Hero['rituals']) => {
      const game = new Game();
      game.state.era = 5; game.state.progress = 19; game.state.selectedStage = 20; game.state.spirits = spirits;
      game.state.heroes = [39, 40, 28, 8, 25, 33, 1].map((characterId, index) => ({ ...placed(`final-${index}`, characterId, 2, [1, 2, 0, 9, 10, 5, 6][index], 16), rituals: { ...rituals } }));
      game.startBattle(); fight(game);
      return game.battle!.status;
    };
    expect(king([], {})).toBe('defeat');
    expect(king(['lobo', 'coruja', 'elefante', 'urso'], {})).toBe('victory');
    expect(king([], { rape: 2, sananga: 2, kambo: 2 })).toBe('victory');
  });
});
