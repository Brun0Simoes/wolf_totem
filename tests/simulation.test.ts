import { describe, expect, it } from 'vitest';
import { Game, buildingCost, capacity, getRates, getSynergies, newHero, OFFLINE_CAP_SECONDS, stageUnlocked, villageCost } from '../src/game/simulation';
import { migrateSlot } from '../src/game/board';
import { stageReward } from '../src/game/campaign';

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
    expect(game.state.heroes).toHaveLength(1);
  });

  it('swaps a reserve hero into a full formation and counts unique characters for traits', () => {
    const game = new Game();
    game.state.resources.food = 1000; game.state.resources.spirit = 1000;
    game.state.shop = [3, 8, 2, 4];
    game.recruit(3); game.recruit(8);
    const boru = game.state.heroes.find(hero => hero.characterId === 3)!, ena = game.state.heroes.find(hero => hero.characterId === 8)!;
    expect(game.deploy(boru.uid, 4).ok).toBe(true);
    expect(game.deploy(ena.uid, 10).ok).toBe(true);
    game.state.shop = [1, 2, 4, 6];
    game.recruit(1);
    const reserve = game.state.heroes.find(hero => hero.slot === null)!;
    expect(game.deploy(reserve.uid, 0).ok).toBe(false);
    expect(game.deploy(reserve.uid, 4).ok).toBe(true);
    expect(boru.slot).toBeNull();
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
    data.state.heroes.push({ uid: 'twin', characterId: 3, stars: 1, slot: data.state.heroes[0].slot, level: 99, panema: -4, rituals: { kambo: 50, fake: 3 }, away: { kind: 'hunt', id: 'nowhere', until: 5 } });
    data.battle = { status: 'victory', reward: { spirit: 1e9 } };
    const loaded = new Game(data, 1000);
    expect(loaded.state.resources.wood).toBe(0);
    expect(loaded.state.resources.food).toBe(90);
    expect(loaded.state.villageLevel).toBe(5);
    expect(loaded.state.heroes).toHaveLength(2);
    expect(loaded.state.heroes[1]).toMatchObject({ slot: null, level: 10, panema: 0, rituals: { kambo: 3 }, away: null });
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
    expect(game.recruit(1).ok).toBe(false);
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

  it('lets an evolved, equipped tribe, seasoned by hunts and ceremonies, finish the campaign and open the endless hunt', () => {
    const game = new Game();
    game.state.villageLevel = 5; game.state.progress = 29; game.state.selectedStage = 30;
    game.state.spirits = ['lobo', 'coruja', 'elefante', 'urso'];
    const items = [['garra', 'presa', 'talisma'], ['muralha', 'pele-urso'], ['espinhos'], ['obsidiana', 'garra'], ['cajado-vida'], ['tempestade', 'lanca'], ['carvalho']];
    game.state.heroes = [[39, 3], [28, 3], [40, 2], [8, 3], [25, 2], [33, 2], [49, 2]].map(([characterId, stars], index) => ({
      ...newHero(`final-${index}`, characterId, stars, migrateSlot([1, 2, 0, 9, 10, 5, 3][index])), items: items[index], level: 10, rituals: { rape: 3, sananga: 3, kambo: 3, ayahuasca: 1 },
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
});
