import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { endlessStage, FINAL_STAGE } from '../src/game/campaign';
import { COMPONENT_IDS, ITEMS, recipeFor } from '../src/game/items';
import { SPIRITS, spiritsOfEra, type SpiritId } from '../src/game/spirits';
import {
  Game,  embersFor,   newHero, pendingEra,   stageUnlocked,
  WONDER_STAGES, type Hero,
} from '../src/game/simulation';
import { migrateSlot } from '../src/game/board';

const fixture = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/journey.json'), 'utf8');
/** Slots are written in the 1.2 layout and placed on the larger board as old saves are. */
const hero = (uid: string, characterId: number, stars = 1, slot: number | null = null, items: string[] = []): Hero => ({ ...newHero(uid, characterId, stars, slot === null ? null : migrateSlot(slot)), items });
const fight = (game: Game) => { for (let i = 0; i < 160 && game.battle?.status === 'fighting'; i++) game.tick(1); };

describe('saves', () => {
  it('migrates a 0.x save: waves become cleared stages and heroes gain item and removed work fields', () => {
    const loaded = new Game(fixture, 1790800000000);
    expect(loaded.state.progress).toBe(0);
    expect(loaded.state.selectedStage).toBe(1);
    expect(loaded.state.heroes.map(h => [h.characterId, h.stars, h.items, h.level])).toEqual([[1, 3, [], 24], [3, 2, [], 8], [8, 1, [], 1]]);
    expect(JSON.parse(loaded.serialize()).version).toBe(10);
    const later = JSON.parse(fixture); later.state.wave = 7;
    expect(new Game(later, 1790800000000).state.progress).toBe(6);
  });

  it('drops invalid items, spirits out of era order and workers beyond the open slots', () => {
    const game = new Game();
    const data = JSON.parse(game.serialize(1000));
    data.state.inventory = ['presa', 'not-an-item', 'coroa'];
    data.state.spirits = ['lobo', 'urso'];
    data.state.era = 3;
    data.state.heroes = [{ uid: 'a', characterId: 1, stars: 1, slot: null, items: ['garra', 'x', 'presa', 'arco', 'pena'], work: 'hunt' }, { uid: 'b', characterId: 3, stars: 1, slot: null, items: [], work: 'hunt' }];
    const loaded = new Game(data, 1000);
    expect(loaded.state.inventory).toEqual(['presa', 'coroa']);
    expect(loaded.state.spirits).toEqual(['lobo']);
    expect(loaded.state.heroes[0].items).toEqual(['garra', 'presa', 'arco']);
    expect(loaded.state.heroes.every(h=>!('work' in h))).toBe(true);
  });
});

describe('equipment and recipes', () => {
  it('has exactly one finished item for every pair of components', () => {
    const pairs = new Set(ITEMS.map(item => [...item.recipe!].sort().join('+')));
    expect(ITEMS).toHaveLength(21);
    expect(pairs.size).toBe(21);
    for (const a of COMPONENT_IDS) for (const b of COMPONENT_IDS) expect(recipeFor(a, b), `${a}+${b}`).toBeTruthy();
  });

  it('completes an item when a second component meets the first on a hero, and returns items when selling', () => {
    const game = new Game();
    game.state.inventory = ['presa', 'arco', 'couro', 'manto', 'raiz'];
    const uid = game.state.heroes[0].uid;
    game.state.heroes.push(hero('companion', 3));
    expect(game.equipItem(uid, 0).ok).toBe(true);
    expect(game.equipItem(uid, 0).ok).toBe(true);
    expect(game.state.heroes[0].items).toEqual(['garra']);
    game.equipItem(uid, 0); game.equipItem(uid, 0);
    expect(game.state.heroes[0].items).toEqual(['garra', 'pele-urso']);
    game.equipItem(uid, 0);
    expect(game.state.heroes[0].items).toEqual(['garra', 'pele-urso', 'raiz']);
    game.state.inventory.push('pena');
    expect(game.equipItem(uid, 0).ok).toBe(true);
    expect(game.state.heroes[0].items).toEqual(['garra', 'pele-urso', 'cajado-vida']);
    expect(game.unequipItem(uid, 0).ok).toBe(true);
    expect(game.state.inventory).toEqual(['garra']);
    expect(game.unequipItem(uid,0).ok).toBe(true);expect(game.unequipItem(uid,0).ok).toBe(true);
    expect(game.state.inventory).toEqual(['garra', 'pele-urso', 'cajado-vida']);
  });

  it('applies item stats and perks to the combat entity', () => {
    const game = new Game();
    game.state.heroes = [hero('a', 3, 1, 1, ['carvalho', 'muralha']), hero('b', 1, 1, 2, ['escudo-totem'])];
    game.startBattle();
    const [a, b] = game.battle!.entities.filter(entity => entity.team === 'ally');
    expect(a.maxHp).toBeCloseTo((720 + 400 + 350) * 1.15);
    expect(a.taunt).toBeGreaterThan(0);
    expect(a.shield).toBeCloseTo(b.maxHp * 0.2);
    expect(b.shield).toBeCloseTo(b.maxHp * 0.2);
  });

  it('consolidates legacy copies and preserves their equipment without creating a star', () => {
    const game=new Game();
    game.state.heroes=[hero('a',1,1,1,['presa','arco']),hero('b',1,1,null,['couro','manto'])];
    const data=JSON.parse(game.serialize(1000));data.version=3;
    const loaded=new Game(data,1000),akru=loaded.state.heroes[0];
    expect(loaded.state.heroes).toHaveLength(1);expect(akru.stars).toBe(1);
    expect(akru.items).toEqual(['presa','arco','couro']);expect(loaded.state.inventory).toEqual(['manto']);
  });

});

describe('eras, patron spirits and powers', () => {
  it('asks for a patron after each village level and only accepts that era\'s spirits', () => {
    const game = new Game();

    expect(pendingEra(game.state)).toBeNull();
    game.state.heroes[0].level=4;game.state.heroes[0].ritualLevel=2;game.advanceEra();
    expect(pendingEra(game.state)).toBe(2);
    expect(game.chooseSpirit('urso').ok).toBe(false);
    expect(game.chooseSpirit('lobo').ok).toBe(true);
    expect(pendingEra(game.state)).toBeNull();
    expect(spiritsOfEra(2).map(s => s.id)).toEqual(['lobo', 'cervo', 'corvo']);
    expect(SPIRITS).toHaveLength(12);
  });

  it('calls each power once per expedition and keeps every stat finite', () => {
    for (const spirit of SPIRITS) {
      const game = new Game();
      game.state.era = 5;
      const path: SpiritId[] = [spiritsOfEra(2)[0].id, spiritsOfEra(3)[0].id, spiritsOfEra(4)[0].id, spiritsOfEra(5)[0].id];
      path[spirit.era - 2] = spirit.id;
      game.state.spirits = path;
      expect(game.usePower(spirit.id).ok).toBe(false);
      game.state.progress = 9; game.state.selectedStage = 10;
      game.state.heroes[0].level=16;game.state.heroes[0].stars=2;
      game.startBattle(); game.tick(2);
      if (spirit.id === 'urso') game.battle!.entities.filter(e => e.team === 'ally')[0].hp = 0;
      expect(game.usePower(spirit.id).ok, spirit.id).toBe(true);
      expect(game.usePower(spirit.id).ok).toBe(false);
      expect(game.events.some(event => event.type === 'power')).toBe(true);
      game.tick(5);
      expect(game.battle!.entities.every(e => [e.hp, e.maxHp, e.attack, e.shield, e.mana].every(Number.isFinite)), spirit.id).toBe(true);
    }
  });
});

describe('campaign', () => {
  it('gates regions by era, gives two components for a first boss victory', () => {
    const game = new Game();
    game.state.progress = 5;
    expect(stageUnlocked(game.state, 6)).toBe(false);
    game.state.era = 2;
    expect(stageUnlocked(game.state, 6)).toBe(true);
    expect(stageUnlocked(game.state, 7)).toBe(false);

    const boss = new Game();
    boss.state.heroes = [hero('a', 1, 3, 1, ['obsidiana']), hero('b', 3, 3, 2), hero('c', 8, 3, 9)];
    boss.state.progress = 4; boss.state.selectedStage = 5;
    boss.startBattle(); fight(boss);
    expect(boss.battle!.status).toBe('victory');
    expect(boss.battle!.loot).toHaveLength(2);
    expect(boss.state.progress).toBe(5);
  });

  it('builds deterministic, growing endless hunts and records their depth', () => {
    expect(endlessStage(4)).toEqual(endlessStage(4));
    expect(endlessStage(20).units.length).toBeGreaterThan(endlessStage(1).units.length);
    expect(new Set(endlessStage(12).units.map(unit => unit.id)).size).toBe(endlessStage(12).units.length);
    const game = new Game();
    game.state.era = 5; game.state.progress = FINAL_STAGE;
    game.state.heroes = [[39, 3], [28, 3], [40, 3], [8, 3], [25, 3], [33, 3], [49, 3]].map(([id, stars], i) => hero(`e${i}`, id, stars, [1, 2, 0, 9, 10, 5, 6][i], ['garra', 'talisma', 'carvalho']));
    expect(game.selectStage(0).ok).toBe(true);
    game.startBattle(); fight(game);
    expect(game.battle!.status).toBe('victory');
    expect(game.state.endlessBest).toBe(1);
    expect(game.state.endlessRecord).toBe(1);
  });

  it('advances combat faster without producing extra resources', () => {
    const game = new Game();
    game.startBattle();
    const clock = game.state.clock;
    game.advanceBattle(5);
    expect(game.battle!.time).toBeCloseTo(5);
    expect(game.state.clock).toBe(clock);
  });
});
