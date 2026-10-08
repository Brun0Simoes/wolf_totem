import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { endlessStage, FINAL_STAGE, stageReward } from '../src/game/campaign';
import { COMPONENT_IDS, ITEMS, recipeFor } from '../src/game/items';
import { SPIRITS, spiritsOfEra, type SpiritId } from '../src/game/spirits';
import {
  Game, buildingCost, embersFor, forgeRate, getRates, newHero, pendingEra, recruitCost, shopSize, stageUnlocked, wonderCost, workerSlots,
  WONDER_STAGES, type Hero,
} from '../src/game/simulation';
import { migrateSlot } from '../src/game/board';

const fixture = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/journey.json'), 'utf8');
const rich = (game: Game) => { game.state.resources = { wood: 1e7, food: 1e7, stone: 1e7, spirit: 1e7 }; };
/** Slots are written in the 1.2 layout and placed on the larger board as old saves are. */
const hero = (uid: string, characterId: number, stars = 1, slot: number | null = null, items: string[] = []): Hero => ({ ...newHero(uid, characterId, stars, slot === null ? null : migrateSlot(slot)), items });
const fight = (game: Game) => { for (let i = 0; i < 160 && game.battle?.status === 'fighting'; i++) game.tick(1); };

describe('saves', () => {
  it('migrates a 0.x save: waves become cleared stages and heroes gain item and work slots', () => {
    const loaded = new Game(fixture, 1790800000000);
    expect(loaded.state.progress).toBe(0);
    expect(loaded.state.selectedStage).toBe(1);
    expect(loaded.state.heroes.map(h => [h.characterId, h.stars, h.items, h.work, h.level])).toEqual([[1, 3, [], null, 24], [3, 2, [], null, 8], [8, 1, [], null, 1]]);
    expect(loaded.state.buildings.forge).toBe(0);
    expect(loaded.state.buildings.cura).toBe(0);
    expect(JSON.parse(loaded.serialize()).version).toBe(6);
    const later = JSON.parse(fixture); later.state.wave = 7;
    expect(new Game(later, 1790800000000).state.progress).toBe(6);
  });

  it('drops invalid items, spirits out of era order and workers beyond the open slots', () => {
    const game = new Game();
    const data = JSON.parse(game.serialize(1000));
    data.state.inventory = ['presa', 'not-an-item', 'coroa'];
    data.state.spirits = ['lobo', 'urso'];
    data.state.villageLevel = 3;
    data.state.heroes = [{ uid: 'a', characterId: 1, stars: 1, slot: null, items: ['garra', 'x', 'presa', 'arco', 'pena'], work: 'hunt' }, { uid: 'b', characterId: 3, stars: 1, slot: null, items: [], work: 'hunt' }];
    const loaded = new Game(data, 1000);
    expect(loaded.state.inventory).toEqual(['presa', 'coroa']);
    expect(loaded.state.spirits).toEqual(['lobo']);
    expect(loaded.state.heroes[0].items).toEqual(['garra', 'presa', 'arco']);
    expect(loaded.state.heroes.filter(h => h.work === 'hunt')).toHaveLength(workerSlots(loaded.state, 'hunt'));
  });
});

describe('items and the bone forge', () => {
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
    expect(game.sellHero(uid).ok).toBe(true);
    expect(game.state.inventory).toEqual(['garra', 'pele-urso', 'cajado-vida']);
  });

  it('combines components in the bag only with the forge, which also produces components over time', () => {
    const game = new Game();
    game.state.inventory = ['pena', 'pena'];
    expect(game.combineItems(0, 1).ok).toBe(false);
    rich(game);
    expect(game.upgradeBuilding('forge').ok).toBe(false);
    game.state.villageLevel = 2;
    expect(game.upgradeBuilding('forge').ok).toBe(true);
    expect(game.combineItems(0, 1).ok).toBe(true);
    expect(game.state.inventory).toEqual(['coroa']);
    const seconds = 2 / forgeRate(game.state);
    for (let t = 0; t < seconds; t += 30) game.tick(30);
    expect(game.state.inventory.length).toBeGreaterThanOrEqual(2);
    expect(game.state.inventory.slice(1).every(id => (COMPONENT_IDS as string[]).includes(id))).toBe(true);
    expect(buildingCost('forge', 0).stone).toBeGreaterThan(0);
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
    rich(game);
    expect(pendingEra(game.state)).toBeNull();
    game.state.heroes[0].level=4;game.state.heroes[0].ritualLevel=2;game.upgradeVillage();
    expect(pendingEra(game.state)).toBe(2);
    expect(game.chooseSpirit('urso').ok).toBe(false);
    const before = getRates(game.state).food;
    expect(game.chooseSpirit('lobo').ok).toBe(true);
    expect(getRates(game.state).food).toBeCloseTo(before * 1.1);
    expect(pendingEra(game.state)).toBeNull();
    expect(spiritsOfEra(2).map(s => s.id)).toEqual(['lobo', 'cervo', 'corvo']);
    expect(SPIRITS).toHaveLength(12);
  });

  it('opens a fifth campfire slot with the eagle', () => {
    const game = new Game();
    game.state.villageLevel = 4; game.state.spirits = ['lobo', 'coruja'];
    expect(game.chooseSpirit('aguia').ok).toBe(true);
    expect(shopSize(game.state)).toBe(5);
    expect(game.state.shop).toHaveLength(5);
  });

  it('calls each power once per expedition and keeps every stat finite', () => {
    for (const spirit of SPIRITS) {
      const game = new Game();
      game.state.villageLevel = 5;
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

describe('workers', () => {
  it('raises production with heroes from the reserve and frees them when deployed', () => {
    const game = new Game();
    game.state.heroes.push(hero('w', 12, 2));
    const before = getRates(game.state).food;
    expect(game.assignWorker('w', 'hunt').ok).toBe(true);
    // Kalu is a Hunter: cost 1 × 2★ power 2.2 × affinity 1.5 × 10%.
    expect(getRates(game.state).food).toBeCloseTo(before * (1 + 0.1 * 2.2 * 1.5));
    expect(game.assignWorker('hero-1', 'hunt').ok).toBe(false);
    expect(game.state.heroes.find(h => h.uid === 'hero-1')!.slot).not.toBeNull();
    expect(game.deploy('w', 1).ok).toBe(true);
    expect(game.state.heroes.find(h => h.uid === 'w')!.work).toBeNull();
    expect(getRates(game.state).food).toBeCloseTo(before);
  });
});

describe('campaign', () => {
  it('gates regions by era, halves repeat rewards and gives two components for a first boss victory', () => {
    const game = new Game();
    game.state.progress = 5;
    expect(stageUnlocked(game.state, 6)).toBe(false);
    game.state.villageLevel = 2;
    expect(stageUnlocked(game.state, 6)).toBe(true);
    expect(stageUnlocked(game.state, 7)).toBe(false);
    expect(stageReward(3, true).wood).toBe(Math.round(stageReward(3, false).wood / 2));
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
    game.state.villageLevel = 5; game.state.progress = FINAL_STAGE;
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
    const wood = game.state.resources.wood;
    game.advanceBattle(5);
    expect(game.battle!.time).toBeCloseTo(5);
    expect(game.state.resources.wood).toBe(wood);
  });
});

describe('the Great Totem and rebirth', () => {
  it('requires the fifth era and the swamp boss, then five stages, before the tribe can be reborn', () => {
    const game = new Game();
    rich(game);
    expect(game.buildWonder().ok).toBe(false);
    game.state.villageLevel = 5; game.state.progress = 25;
    for (let stage = 0; stage < WONDER_STAGES; stage++) expect(game.buildWonder().ok).toBe(true);
    expect(game.buildWonder().ok).toBe(false);
    expect(wonderCost(4).wood).toBe(5 * wonderCost(0).wood);
    expect(game.ascend().ok).toBe(false);
    game.state.progress = FINAL_STAGE; game.state.endlessBest = 3;
    const embers = embersFor(game.state);
    expect(embers).toBe(8 + 6);
    expect(game.ascend().ok).toBe(true);
    expect(game.state).toMatchObject({ villageLevel: 1, progress: 0, wonder: 0, embers, rebirths: 1, endlessRecord: 3, endlessBest: 0, spirits: [], inventory: [] });
    expect(game.state.heroes.map(h => h.characterId)).toEqual([1]);
  });

  it('turns embers into permanent memories', () => {
    const game = new Game();
    game.state.embers = 40;
    const rates = getRates(game.state).wood, price = recruitCost(3, game.state).spirit;
    expect(game.buyMemory('raizes').ok).toBe(true);
    expect(getRates(game.state).wood).toBeCloseTo(rates * 1.25);
    expect(game.buyMemory('fogueira').ok).toBe(true);
    expect(recruitCost(3, game.state).spirit).toBe(Math.round(price * 0.92));
    expect(game.buyMemory('heranca').ok).toBe(true);
    expect(game.buyMemory('forja').ok).toBe(true);
    game.state.wonder = WONDER_STAGES; game.state.villageLevel = 5; game.state.progress = FINAL_STAGE;
    game.ascend();
    expect(game.state.resources.wood).toBe(120 + 150);
    expect(game.state.inventory).toHaveLength(1);
    expect(game.state.memories).toMatchObject({ raizes: 1, fogueira: 1, heranca: 1, forja: 1 });
    expect(game.state.villageLevel).toBe(1);
  });
});
