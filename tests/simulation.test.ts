import { describe, expect, it } from 'vitest';
import { Game,  capacity,  getSynergies, newHero, OFFLINE_CAP_SECONDS, stageUnlocked } from '../src/game/simulation';
import { migrateSlot } from '../src/game/board';

describe('tribe and recruitment', () => {

  it('refuses another copy without changing the hero', () => {
    const game=new Game();
    const before=game.serialize(1000);
    expect(game.recruit(1).ok).toBe(false);
    expect(game.serialize(1000)).toBe(before);
    expect(game.state.heroes).toHaveLength(1);
    expect(game.state.heroes[0].stars).toBe(1);
  });

  it('swaps a reserve hero into a full formation and counts unique characters for traits', () => {
    const game = new Game();

    game.state.heroes.push(newHero('fixture-3',3));game.state.stats.recruits++; game.state.heroes.push(newHero('fixture-8',8));game.state.stats.recruits++;
    const boru = game.state.heroes.find(hero => hero.characterId === 3)!, ena = game.state.heroes.find(hero => hero.characterId === 8)!;
    expect(game.deploy(boru.uid, 4).ok).toBe(true);
    expect(game.deploy(ena.uid, 10).ok).toBe(true);

    game.state.heroes.push(newHero('fixture-6',6));game.state.stats.recruits++;
    const reserve = game.state.heroes.find(hero => hero.slot === null)!;
    expect(game.deploy(reserve.uid, 0).ok).toBe(false);
    expect(game.deploy(reserve.uid, 4).ok).toBe(true);
    expect(boru.slot).toBeNull();
    expect(getSynergies(game.state).find(synergy => synergy.name === 'Presas')?.count).toBe(1);
    expect(getSynergies(game.state).find(synergy => synergy.name === 'Caçador')?.count).toBe(2);
  });
});

describe('versioned saves and offline time', () => {

  it('sanitizes malformed saves and never restores combat or credits unfinished rewards', () => {
    const fresh = new Game();
    expect(new Game('{broken').state).toEqual(fresh.state);
    const data = JSON.parse(fresh.serialize(1000));
    data.state.resources = {wood:-10,food:'NaN'};
    data.state.era = 999;
    data.state.heroes.push({ uid: '<script>', characterId: 99, stars: 999, slot: 99 });
    data.state.heroes.push({ uid: 'twin', characterId: 3, stars: 1, slot: data.state.heroes[0].slot, level: 99, panema: -4, rituals: { kambo: 50, fake: 3 }, away: { kind: 'hunt', id: 'nowhere', until: 5 } });
    data.battle = { status: 'victory', reward: { spirit: 1e9 } };
    const loaded = new Game(data, 1000);
    expect('resources' in loaded.state).toBe(false);
    expect(loaded.state.era).toBe(5);
    expect(loaded.state.heroes).toHaveLength(2);
    expect(loaded.state.heroes[1]).toMatchObject({ slot: null, level: 30, panema: 0, rituals: { kambo: 3 }, away: null });
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

    expect(game.battle?.firstClear).toBe(true);
    expect(game.battle?.loot).toHaveLength(1);
    expect(game.state.progress).toBe(1);
    expect(game.state.selectedStage).toBe(2);
    const lootCount = game.state.inventory.length;
    game.tick(1);
    expect(game.state.inventory).toHaveLength(lootCount);
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
      expect(game.events.some(event => event.type === 'prepare' && event.sourceId === hero.id)).toBe(true);
      game.tick(.5);
      expect(game.events.some(event => event.type === 'skill' && event.sourceId === hero.id)).toBe(true);
      game.tick(10);
      expect(game.battle!.entities.every(entity => [entity.hp, entity.mana, entity.attack, entity.x, entity.y].every(Number.isFinite))).toBe(true);
    }
  });

  it('lets an evolved, equipped tribe, seasoned by hunts and ceremonies, finish the campaign and open the endless hunt', () => {
    const game = new Game();
    game.state.era = 5; game.state.progress = 29; game.state.selectedStage = 30;
    game.state.spirits = ['lobo', 'coruja', 'elefante', 'urso'];
    const items = [['garra','obsidiana','talisma'], ['muralha','pele-urso','carvalho'], ['escudo-totem','pele-urso','carvalho'], ['tempestade','garra','talisma'], ['coroa','colar-lua','cajado-vida'], ['coroa','lanca','colar-lua'], ['muralha','carvalho','pele-urso']];
    game.state.heroes = [[39, 3], [28, 3], [40, 3], [8, 3], [25, 3], [33, 3], [49, 3]].map(([characterId, stars], index) => ({
      ...newHero(`final-${index}`, characterId, stars, migrateSlot([1, 2, 0, 9, 10, 5, 3][index])), items: items[index], level: 30, ritualLevel: 10, rituals: { rape: 3, sananga: 3, kambo: 3, ayahuasca: 1 },
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
