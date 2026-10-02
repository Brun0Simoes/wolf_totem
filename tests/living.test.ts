import { describe, expect, it } from 'vitest';
import { EVENT_DURATION, FIRST_EVENT_AT, OMEN_BONUS, OMEN_DURATION, RAID_PENALTY, TRIBUTE } from '../src/game/events';
import { QUESTS } from '../src/game/quests';
import { allySlotCenter, cellCenter, COLUMNS, enemyFormation, enemySlotCenter, FORMATION_SLOTS, hexCorners, MIDLINE, migrateSlot } from '../src/game/board';
import { Game, getRates, MAX_ROSTER_SIZE, newHero, OVERTIME_START, overtimeDamage, overtimeHealing, type Hero } from '../src/game/simulation';

/** Slots are written in the 1.2 layout and placed on the larger board as old saves are. */
const hero = (uid: string, characterId: number, stars = 1, slot: number | null = null, items: string[] = []): Hero => ({ ...newHero(uid, characterId, stars, slot === null ? null : migrateSlot(slot)), items });
const fight = (game: Game) => { for (let i = 0; i < 160 && game.battle?.status === 'fighting'; i++) game.tick(1); };
const advanceVillage = (game: Game, seconds: number) => { for (let t = 0; t < seconds; t += 10) game.tick(10); };

describe('battle summary', () => {
  it('records damage dealt and taken, and credits summons to their summoner', () => {
    const game = new Game();
    game.state.heroes = [hero('nima', 2, 3, 1), hero('akru', 1, 2, 2)];
    game.startBattle();
    const nima = game.battle!.entities.find(e => e.uid === 'nima')!;
    nima.mana = nima.manaMax;
    game.tick(0.05);
    const spiders = game.battle!.entities.filter(e => e.summon === 'spider');
    expect(spiders.length).toBeGreaterThan(0);
    const before = nima.dealt;
    fight(game);
    expect(nima.dealt).toBeGreaterThan(before);
    expect(spiders.every(spider => spider.dealt === 0)).toBe(true);
    const enemies = game.battle!.entities.filter(e => e.team === 'enemy');
    expect(enemies.reduce((sum, e) => sum + e.taken, 0)).toBeGreaterThan(0);
  });
});

describe('journal', () => {
  it('pays each objective once, only when done, and keeps claims through rebirth', () => {
    const game = new Game();
    expect(game.claimQuest('primeira-cacada').ok).toBe(false);
    game.startBattle(); fight(game);
    const spirit = game.state.resources.spirit;
    expect(game.claimQuest('primeira-cacada').ok).toBe(true);
    expect(game.state.resources.spirit).toBeCloseTo(spirit + 40);
    expect(game.claimQuest('primeira-cacada').ok).toBe(false);
    expect(game.claimQuest('nope').ok).toBe(false);
    game.state.inventory = [];
    game.state.villageLevel = 2;
    expect(game.claimQuest('era-2').ok).toBe(true);
    expect(game.state.inventory).toHaveLength(1);
    game.state.villageLevel = 5; game.state.progress = 30; game.state.wonder = 5;
    game.rebirth();
    expect(game.state.quests).toEqual(['primeira-cacada', 'era-2']);
    expect(game.claimQuest('renascer').ok).toBe(true);
    expect(new Set(QUESTS.map(q => q.id)).size).toBe(QUESTS.length);
  });

  it('counts calls and spirit powers for the journal', () => {
    const game = new Game();
    game.state.resources = { wood: 500, food: 500, stone: 500, spirit: 500 };
    expect(game.call(3).ok).toBe(true);
    advanceVillage(game, 200);
    expect(game.state.stats.calls).toBe(1);
    game.state.villageLevel = 2; game.state.spirits = ['lobo'];
    game.startBattle(); game.tick(1);
    expect(game.usePower('lobo').ok).toBe(true);
    expect(game.state.stats.powers).toBe(1);
  });
});

describe('boss phases', () => {
  it('triggers each campaign boss mechanic once below half life', () => {
    for (const stage of [5, 10, 15, 20, 25, 30]) {
      const game = new Game();
      game.state.villageLevel = 5; game.state.progress = stage - 1; game.state.selectedStage = stage;
      game.state.heroes = [[39, 3], [28, 3], [40, 3], [8, 3], [25, 3], [33, 3], [49, 3]].map(([id, stars], i) => hero(`b${i}`, id, stars, [1, 2, 0, 9, 10, 5, 6][i], ['garra', 'talisma', 'carvalho']));
      game.startBattle();
      const boss = game.battle!.entities.find(e => e.boss)!;
      game.tick(0.05);
      (game as unknown as { damage: (a: unknown, b: unknown, n: number, m: boolean, t: boolean) => void }).damage(game.battle!.entities[0], boss, boss.hp - boss.maxHp * 0.45, false, true);
      expect(boss.phased, `stage ${stage}`).toBe(true);
      expect(game.events.filter(e => e.type === 'phase')).toHaveLength(1);
      game.tick(3);
      expect(game.battle!.entities.every(e => [e.hp, e.maxHp, e.attack, e.x, e.y].every(Number.isFinite))).toBe(true);
    }
  });
});

describe('village events', () => {
  it('starts after the second era and expires a raid with a small loss', () => {
    const game = new Game();
    advanceVillage(game, FIRST_EVENT_AT + 30);
    expect(game.state.event).toBeNull();
    game.state.villageLevel = 2;
    game.tick(1);
    expect(game.state.event).not.toBeNull();
    game.state.event = { kind: 'raid', expires: game.state.clock + 5 };
    const wood = game.state.resources.wood;
    game.tick(6);
    expect(game.state.event?.kind === 'raid' && game.state.event.expires < game.state.clock).toBeFalsy();
    expect(game.state.resources.wood).toBeLessThan(wood);
    expect(game.state.nextEventAt).toBeGreaterThan(game.state.clock - 1);
    expect(EVENT_DURATION).toBeGreaterThan(60);
  });

  it('trades with the merchant, blesses production with an omen and shelters a traveller', () => {
    const game = new Game();
    game.state.resources = { wood: 1000, food: 1000, stone: 1000, spirit: 1000 };
    game.state.event = { kind: 'merchant', expires: game.state.clock + 100, item: 'presa', price: { wood: 100, food: 50, stone: 80, spirit: 30 } };
    expect(game.answerEvent(true).ok).toBe(true);
    expect(game.state.inventory).toEqual(['presa']);
    expect(game.state.resources.wood).toBe(900);
    game.state.event = { kind: 'omen', expires: game.state.clock + 100, resource: 'stone' };
    const stone = getRates(game.state).stone;
    game.answerEvent(true);
    expect(getRates(game.state).stone).toBeCloseTo(stone * (1 + OMEN_BONUS));
    advanceVillage(game, OMEN_DURATION + 10);
    expect(game.state.omen).toBeNull();
    game.state.event = { kind: 'traveler', expires: game.state.clock + 100, characterId: 22 };
    expect(game.answerEvent(true).ok).toBe(true);
    expect(game.state.heroes.some(h => h.characterId === 22)).toBe(true);
    expect(MAX_ROSTER_SIZE).toBeGreaterThan(game.state.heroes.length);
  });

  it('defends the village in a raid battle without touching campaign progress, or pays tribute', () => {
    const game = new Game();
    game.state.villageLevel = 2;
    game.state.heroes = [hero('a', 1, 3, 1, ['obsidiana']), hero('b', 3, 3, 2), hero('c', 8, 3, 9)];
    game.state.event = { kind: 'raid', expires: game.state.clock + 100 };
    expect(game.answerEvent(true).ok).toBe(true);
    expect(game.battle!.stage).toBe(-1);
    fight(game);
    expect(game.battle!.status).toBe('victory');
    expect(game.battle!.loot).toHaveLength(1);
    expect(game.state.progress).toBe(0);
    game.dismissBattle();
    game.state.event = { kind: 'raid', expires: game.state.clock + 100 };
    const food = game.state.resources.food;
    expect(game.answerEvent(false).ok).toBe(true);
    expect(game.state.resources.food).toBeCloseTo(food * (1 - TRIBUTE));
    expect(RAID_PENALTY).toBeLessThan(TRIBUTE);
  });

  it('saves and sanitizes events', () => {
    const game = new Game();
    game.state.event = { kind: 'merchant', expires: 500, item: 'garra', price: { wood: 1, food: 2, stone: 3, spirit: 4 } };
    game.state.omen = { resource: 'food', until: 900 };
    const loaded = new Game(game.serialize(1000), 1000);
    expect(loaded.state.event).toEqual(game.state.event);
    expect(loaded.state.omen).toEqual(game.state.omen);
    const data = JSON.parse(game.serialize(1000));
    data.state.event = { kind: 'merchant', expires: 5, item: 'fake' };
    data.state.omen = { resource: 'gold', until: 3 };
    const broken = new Game(data, 1000);
    expect(broken.state.event).toBeNull();
    expect(broken.state.omen).toBeNull();
  });
});

describe('hex board and twilight', () => {
  it('lays out offset rows whose hexes tile without gaps, the tribe below the midline', () => {
    for (let slot = 0; slot < FORMATION_SLOTS; slot++) {
      expect(allySlotCenter(slot).y).toBeGreaterThan(MIDLINE);
      expect(enemySlotCenter(slot).y).toBeLessThan(MIDLINE);
    }
    expect(FORMATION_SLOTS).toBe(28);
    expect(Math.abs(allySlotCenter(COLUMNS).x - allySlotCenter(0).x)).toBeCloseTo(0.5);
    // Old formations keep their row and land in the middle columns.
    expect(migrateSlot(1)).toBe(3); expect(migrateSlot(9)).toBe(17);
    // A hex shares its lower-right edge with the neighbour below and to the right.
    const [a, b] = [hexCorners(cellCenter(1, 2)), hexCorners(cellCenter(1, 3))];
    expect(a[0].x).toBeCloseTo(b[4].x); expect(a[0].y).toBeCloseTo(b[4].y);
    expect(a[1].x).toBeCloseTo(b[3].x); expect(a[1].y).toBeCloseTo(b[3].y);
  });

  it('fades healing and hardens blows after the twilight so long fights resolve', () => {
    expect(overtimeDamage(OVERTIME_START - 10)).toBe(1);
    expect(overtimeHealing(OVERTIME_START)).toBe(1);
    expect(overtimeDamage(OVERTIME_START + 50)).toBeGreaterThan(2);
    expect(overtimeHealing(OVERTIME_START + 200)).toBeGreaterThan(0);
    const game = new Game();
    game.startBattle();
    game.battle!.time = OVERTIME_START - 0.05;
    game.tick(0.1);
    expect(game.events.some(event => event.type === 'overtime')).toBe(true);
  });
});
