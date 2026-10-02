import { describe, expect, it } from 'vitest';
import { Game, buildingCost, buildingTime, capacity, getRates, getSynergies, newHero, OFFLINE_CAP_SECONDS, stageUnlocked, villageCost, villageTime } from '../src/game/simulation';
import { migrateSlot } from '../src/game/board';
import { stageReward } from '../src/game/campaign';

/** Lets the builders finish every work in progress. */
const build = (game: Game) => { while (game.state.construction.length) game.tick(60); };

describe('village and recruitment', () => {
  it('starts with Akru alone at the front centre and produces the published income', () => {
    const game = new Game();
    expect(game.state.heroes.map(hero => [hero.characterId, hero.slot, hero.level])).toEqual([[1, 3, 1]]);
    const initial = game.state.resources.wood;
    const rate = getRates(game.state).wood;
    game.tick(10);
    expect(game.state.resources.wood).toBeCloseTo(initial + 10 * rate);
    game.togglePause(); game.tick(10);
    expect(game.state.resources.wood).toBeCloseTo(initial + 10 * rate);
    expect(game.gather('wood').ok).toBe(false);
  });

  it('charges exactly the displayed prices, builds over time and prevents unaffordable upgrades', () => {
    const game = new Game();
    const before = { ...game.state.resources };
    const cost = buildingCost('lumber', 1);
    expect(game.upgradeBuilding('lumber').ok).toBe(true);
    expect(game.state.resources.wood).toBe(before.wood - cost.wood);
    expect(game.state.resources.stone).toBe(before.stone - cost.stone);
    expect(game.state.buildings.lumber).toBe(1);
    // One builder in the first eras.
    expect(game.upgradeBuilding('hunt').ok).toBe(false);
    for (let t = 0; t < buildingTime('lumber', 1); t += 10) game.tick(10);
    expect(game.state.buildings.lumber).toBe(2);
    expect(game.state.reports.at(-1)?.kind).toBe('build');
    game.state.resources = { wood: 0, food: 0, stone: 0, spirit: 0 };
    expect(game.upgradeVillage().ok).toBe(false);
    expect(game.state.villageLevel).toBe(1);
    game.state.resources = villageCost(1);
    expect(game.upgradeVillage().ok).toBe(true);
    expect(game.state.villageLevel).toBe(1);
    expect(villageTime(1)).toBe(300);
    build(game);
    expect(game.state.villageLevel).toBe(2);
    expect(capacity(game.state)).toBe(4);
  });

  it('lets each era raise the buildings three levels further', () => {
    const game = new Game();
    game.state.resources = { wood: 1e9, food: 1e9, stone: 1e9, spirit: 1e9 };
    game.state.buildings.lumber = 3;
    expect(game.upgradeBuilding('lumber').ok).toBe(false);
    game.state.villageLevel = 2;
    expect(game.upgradeBuilding('lumber').ok).toBe(true);
    build(game);
    expect(game.state.buildings.lumber).toBe(4);
  });

  it('swaps a reserve hero into a full formation and counts unique characters for traits', () => {
    const game = new Game();
    game.state.heroes.push(newHero('boru', 3), newHero('ena', 8), newHero('reserve', 12));
    expect(game.deploy('boru', 4).ok).toBe(true);
    expect(game.deploy('ena', 10).ok).toBe(true);
    expect(game.deploy('reserve', 0).ok).toBe(false);
    expect(game.deploy('reserve', 4).ok).toBe(true);
    expect(game.state.heroes.find(hero => hero.uid === 'boru')!.slot).toBeNull();
    expect(getSynergies(game.state).find(synergy => synergy.name === 'Presas')?.count).toBe(1);
    expect(getSynergies(game.state).find(synergy => synergy.name === 'Caçador')?.count).toBe(3);
  });
});

describe('versioned saves and offline time', () => {
  it('caps offline production at a day and excludes paused time', () => {
    const original = new Game();
    const rates = getRates(original.state);
    const loaded = new Game(original.serialize(10_000), 10_000 + 3 * 24 * 3600 * 1000);
    expect(loaded.offlineSeconds).toBe(OFFLINE_CAP_SECONDS);
    expect(loaded.state.resources.spirit).toBeCloseTo(original.state.resources.spirit + rates.spirit * OFFLINE_CAP_SECONDS);
    original.togglePause();
    const paused = new Game(original.serialize(10_000), 100_000);
    expect(paused.offlineSeconds).toBe(0);
    expect(paused.state.resources).toEqual(original.state.resources);
  });

  it('sanitizes malformed saves and never restores combat or credits unfinished rewards', () => {
    const fresh = new Game();
    expect(new Game('{broken').state).toEqual(fresh.state);
    const data = JSON.parse(fresh.serialize(1000));
    data.state.resources.wood = -10;
    data.state.resources.food = 'NaN';
    data.state.villageLevel = 999;
    data.state.heroes.push({ uid: '<script>', characterId: 99, stars: 999, slot: 99 });
    data.state.heroes.push({ uid: 'twin', characterId: 3, stars: 1, slot: data.state.heroes[0].slot, level: 99, ritual: 9999, panema: -4, rituals: { kambo: 50, fake: 3 }, cooldowns: { kambo: 1e12, fake: 3 }, away: { kind: 'hunt', id: 'nowhere', until: 5 } });
    data.state.heroes.push({ uid: 'copy', characterId: 3, stars: 1, slot: null, items: ['garra'] });
    data.state.callings = [{ characterId: 3, until: 50 }, { characterId: 99, until: 50 }, { characterId: 30, until: 1e12 }];
    data.state.construction = [{ id: 'lumber', until: 9e9 }, { id: 'lumber', until: 5 }, { id: 'palace', until: 5 }];
    data.battle = { status: 'victory', reward: { spirit: 1e9 } };
    const loaded = new Game(data, 1000);
    expect(loaded.state.resources.wood).toBe(0);
    expect(loaded.state.resources.food).toBe(90);
    expect(loaded.state.villageLevel).toBe(5);
    expect(loaded.state.heroes).toHaveLength(2);
    expect(loaded.state.heroes[1]).toMatchObject({ slot: null, level: 10, ritual: 120, panema: 0, rituals: { kambo: 50 }, away: null });
    expect(loaded.state.heroes[1].cooldowns.kambo).toBeLessThanOrEqual(1000 + 24 * 3600);
    // The copy's items wait in the bag.
    expect(loaded.state.inventory).toEqual(['garra']);
    expect(loaded.state.callings).toEqual([{ characterId: 30, until: 1440 * 60 }]);
    expect(loaded.state.construction).toEqual([{ id: 'lumber', until: 24 * 3600 }]);
    expect(loaded.battle).toBeNull();
    expect(loaded.state.progress).toBe(0);
    fresh.startBattle(); fresh.tick(1);
    expect(new Game(fresh.serialize(1000), 1000).battle).toBeNull();
    expect(new Game(fresh.serialize(1000), 1000).state.progress).toBe(0);
  });
});

describe('automatic combat', () => {
  it('lets the starter party win the first expedition and pays the reward once', () => {
    const game = new Game();
    expect(game.startBattle().ok).toBe(true);
    expect(game.deploy(game.state.heroes[0].uid, null).ok).toBe(false);
    for (let i = 0; i < 150 && game.battle?.status === 'fighting'; i++) game.tick(1);
    expect(game.battle?.status).toBe('victory');
    expect(game.battle?.reward?.spirit).toBe(stageReward(1, false).spirit);
    expect(game.battle?.firstClear).toBe(true);
    expect(game.battle?.loot).toHaveLength(1);
    expect(game.state.progress).toBe(1);
    expect(game.state.selectedStage).toBe(2);
    const resources = game.state.resources.spirit;
    game.tick(1);
    expect(game.state.resources.spirit).toBeCloseTo(resources + getRates(game.state).spirit);
    expect(game.state.progress).toBe(1);
    const saved = new Game(game.serialize(1000), 1000);
    expect(saved.state.progress).toBe(1);
    expect(saved.state.inventory).toEqual(game.state.inventory);
    expect(saved.battle).toBeNull();
  });

  it('restores the entire roster after defeat and permits retrying the same expedition', () => {
    const game = new Game();
    const roster = () => JSON.stringify(game.state.heroes.map(({ uid, characterId, stars, slot, items }) => ({ uid, characterId, stars, slot, items })));
    const heroes = roster();
    game.startBattle();
    for (const entity of game.battle!.entities) if (entity.team === 'ally') entity.hp = 0;
    game.tick(0.1);
    expect(game.battle?.status).toBe('defeat');
    expect(game.state.progress).toBe(0);
    expect(roster()).toBe(heroes);
    // Even a defeat teaches a little.
    expect(game.state.heroes[0].xp).toBeGreaterThan(0);
    expect(game.dismissBattle().ok).toBe(true);
    expect(game.startBattle().ok).toBe(true);
    expect(game.battle?.entities.filter(entity => entity.team === 'ally').every(entity => entity.hp === entity.maxHp)).toBe(true);
  });

  it('executes each of the 55 prototype skills with finite battle stats', () => {
    for (let characterId = 1; characterId <= 55; characterId++) {
      const game = new Game();
      game.state.heroes = [newHero('test-hero', characterId, 2, 3)];
      game.startBattle();
      const hero = game.battle!.entities.find(entity => entity.team === 'ally')!;
      hero.mana = hero.manaMax;
      game.tick(0.05);
      expect(game.events.some(event => event.type === 'skill' && event.sourceId === hero.id)).toBe(true);
      game.tick(10);
      expect(game.battle!.entities.every(entity => [entity.hp, entity.mana, entity.attack, entity.x, entity.y].every(Number.isFinite))).toBe(true);
    }
  });

  it('lets an awakened, equipped tribe at the top of its levels finish the campaign and open the endless hunt', () => {
    const game = new Game();
    game.state.villageLevel = 5; game.state.progress = 29; game.state.selectedStage = 30;
    game.state.spirits = ['lobo', 'coruja', 'elefante', 'urso'];
    const items = [['garra', 'presa', 'talisma'], ['muralha', 'pele-urso'], ['espinhos'], ['obsidiana', 'garra'], ['cajado-vida'], ['tempestade', 'lanca'], ['carvalho']];
    game.state.heroes = [39, 28, 40, 8, 25, 33, 49].map((characterId, index) => ({
      ...newHero(`final-${index}`, characterId, 3, migrateSlot([1, 2, 0, 9, 10, 5, 3][index]), 30), items: items[index],
    }));
    expect(stageUnlocked(game.state, 0)).toBe(false);
    game.startBattle();
    for (let i = 0; i < 160 && game.battle?.status === 'fighting'; i++) game.tick(1);
    expect(game.battle?.status).toBe('victory');
    expect(game.state.progress).toBe(30);
    expect(stageUnlocked(game.state, 0)).toBe(true);
    game.dismissBattle();
    expect(game.selectStage(0).ok).toBe(true);
    expect(game.startBattle().ok).toBe(true);
    expect(game.battle?.stage).toBe(0);
  });

  it('asks for the third star before the last region', () => {
    const final = (stars: number, level: number) => {
      const game = new Game();
      game.state.villageLevel = 5; game.state.progress = 25; game.state.selectedStage = 26;
      game.state.spirits = ['lobo', 'coruja', 'elefante', 'urso'];
      game.state.heroes = [39, 28, 40, 8, 25, 33, 49].map((characterId, index) => newHero(`f-${index}`, characterId, stars, migrateSlot([1, 2, 0, 9, 10, 5, 3][index]), level));
      game.startBattle();
      for (let i = 0; i < 160 && game.battle?.status === 'fighting'; i++) game.tick(1);
      return game.battle!.status;
    };
    expect(final(2, 20)).toBe('defeat');
    expect(final(3, 28)).toBe('victory');
  });
});
