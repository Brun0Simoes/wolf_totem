import { describe, expect, it } from 'vitest';
import { Game, buildingCost, capacity, getRates, getSynergies, OFFLINE_CAP_SECONDS, villageCost } from '../src/game/simulation';

describe('village and recruitment', () => {
  it('starts with the three specified heroes and produces the published income', () => {
    const game = new Game();
    expect(game.state.heroes.map(hero => hero.characterId)).toEqual([1, 3, 8]);
    const initial = game.state.resources.wood;
    const rate = getRates(game.state).wood;
    game.tick(10);
    expect(game.state.resources.wood).toBeCloseTo(initial + 10 * rate);
    game.togglePause(); game.tick(10);
    expect(game.state.resources.wood).toBeCloseTo(initial + 10 * rate);
    expect(game.gather('wood').ok).toBe(false);
  });

  it('charges exactly the displayed prices and prevents unaffordable upgrades', () => {
    const game = new Game();
    const before = { ...game.state.resources };
    const cost = buildingCost('lumber', 1);
    expect(game.upgradeBuilding('lumber').ok).toBe(true);
    expect(game.state.resources.wood).toBe(before.wood - cost.wood);
    expect(game.state.resources.stone).toBe(before.stone - cost.stone);
    game.state.resources = { wood: 0, food: 0, stone: 0, spirit: 0 };
    expect(game.upgradeVillage().ok).toBe(false);
    expect(game.state.villageLevel).toBe(1);
    game.state.resources = villageCost(1);
    expect(game.upgradeVillage().ok).toBe(true);
    expect(capacity(game.state)).toBe(4);
  });

  it('combines three copies while preserving the deployed hero and slot', () => {
    const game = new Game();
    game.state.resources.food = 1000; game.state.resources.spirit = 1000;
    const original = { ...game.state.heroes[0] };
    expect(game.recruit(1).ok).toBe(true);
    game.state.shop = [1, 2, 3, 4];
    expect(game.recruit(1).ok).toBe(true);
    const akrus = game.state.heroes.filter(hero => hero.characterId === 1);
    expect(akrus).toEqual([{ ...original, stars: 2 }]);
    expect(game.state.heroes).toHaveLength(3);
  });

  it('swaps a reserve hero into a full formation and counts unique characters for traits', () => {
    const game = new Game();
    game.recruit(1);
    const reserve = game.state.heroes.find(hero => hero.slot === null)!;
    expect(game.deploy(reserve.uid, 0).ok).toBe(false);
    expect(game.deploy(reserve.uid, 2).ok).toBe(true);
    expect(game.state.heroes.find(hero => hero.characterId === 3)?.slot).toBeNull();
    expect(getSynergies(game.state).find(synergy => synergy.name === 'Presas')?.count).toBe(1);
    expect(getSynergies(game.state).find(synergy => synergy.name === 'Caçador')?.count).toBe(2);
  });
});

describe('versioned saves and offline time', () => {
  it('caps offline production at two hours and excludes paused time', () => {
    const original = new Game();
    const rates = getRates(original.state);
    const loaded = new Game(original.serialize(10_000), 10_000 + 24 * 3600 * 1000);
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
    data.state.heroes[1].slot = data.state.heroes[0].slot;
    data.battle = { status: 'victory', reward: { spirit: 1e9 } };
    const loaded = new Game(data, 1000);
    expect(loaded.state.resources.wood).toBe(0);
    expect(loaded.state.resources.food).toBe(90);
    expect(loaded.state.villageLevel).toBe(5);
    expect(loaded.state.heroes).toHaveLength(3);
    expect(loaded.state.heroes[1].slot).toBeNull();
    expect(loaded.battle).toBeNull();
    expect(loaded.state.wave).toBe(1);
    fresh.startBattle(); fresh.tick(1);
    expect(new Game(fresh.serialize(1000), 1000).battle).toBeNull();
    expect(new Game(fresh.serialize(1000), 1000).state.wave).toBe(1);
  });
});

describe('automatic combat', () => {
  it('lets the starter party win the first expedition and pays the reward once', () => {
    const game = new Game();
    expect(game.startBattle().ok).toBe(true);
    expect(game.deploy(game.state.heroes[0].uid, null).ok).toBe(false);
    expect(game.recruit(1).ok).toBe(false);
    for (let i = 0; i < 150 && game.battle?.status === 'fighting'; i++) game.tick(1);
    expect(game.battle?.status).toBe('victory');
    expect(game.battle?.reward?.spirit).toBe(43);
    expect(game.state.wave).toBe(2);
    const resources = game.state.resources.spirit;
    game.tick(1);
    expect(game.state.resources.spirit).toBeCloseTo(resources + getRates(game.state).spirit);
    expect(game.state.wave).toBe(2);
    const saved = new Game(game.serialize(1000), 1000);
    expect(saved.state.wave).toBe(2);
    expect(saved.battle).toBeNull();
  });

  it('restores the entire roster after defeat and permits retrying the same expedition', () => {
    const game = new Game();
    const heroes = JSON.stringify(game.state.heroes);
    game.startBattle();
    for (const entity of game.battle!.entities) if (entity.team === 'ally') entity.hp = 0;
    game.tick(0.1);
    expect(game.battle?.status).toBe('defeat');
    expect(game.state.wave).toBe(1);
    expect(JSON.stringify(game.state.heroes)).toBe(heroes);
    expect(game.dismissBattle().ok).toBe(true);
    expect(game.startBattle().ok).toBe(true);
    expect(game.battle?.entities.filter(entity => entity.team === 'ally').every(entity => entity.hp === entity.maxHp)).toBe(true);
  });

  it('executes each of the 55 prototype skills with finite battle stats', () => {
    for (let characterId = 1; characterId <= 55; characterId++) {
      const game = new Game();
      game.state.heroes = [{ uid: 'test-hero', characterId, stars: 2, slot: 1 }];
      game.startBattle();
      const hero = game.battle!.entities.find(entity => entity.team === 'ally')!;
      hero.mana = hero.manaMax;
      game.tick(0.05);
      expect(game.events.some(event => event.type === 'skill' && event.sourceId === hero.id)).toBe(true);
      game.tick(10);
      expect(game.battle!.entities.every(entity => [entity.hp, entity.mana, entity.attack, entity.x, entity.y].every(Number.isFinite))).toBe(true);
    }
  });

  it('allows an evolved full party to complete the last expedition', () => {
    const game = new Game();
    game.state.villageLevel = 5;
    game.state.wave = 12;
    game.state.heroes = [1, 3, 6, 8, 9, 11, 12].map((characterId, index) => ({ uid: `final-${index}`, characterId, stars: 3, slot: index }));
    game.startBattle();
    for (let i = 0; i < 150 && game.battle?.status === 'fighting'; i++) game.tick(1);
    expect(game.battle?.status).toBe('victory');
    expect(game.state.wave).toBe(13);
    game.dismissBattle();
    expect(game.startBattle().ok).toBe(false);
  });
});
