import { describe, expect, it } from 'vitest';
import { QUESTS } from '../src/game/quests';
import { allySlotCenter, cellCenter, COLUMNS, enemyFormation, enemySlotCenter, FORMATION_SLOTS, hexCorners, MIDLINE, migrateSlot } from '../src/game/board';
import { Game,  MAX_ROSTER_SIZE, newHero, OVERTIME_START, overtimeDamage, overtimeHealing, type Hero } from '../src/game/simulation';

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
    expect(game.battle!.entities.some(e=>e.summon==='spider')).toBe(false);
    game.tick(.5);
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
    const knowledge = game.state.journey.knowledge;
    expect(game.claimQuest('primeira-cacada').ok).toBe(true);
    expect(game.state.journey.knowledge).toBe(knowledge+2);
    expect(game.claimQuest('primeira-cacada').ok).toBe(false);
    expect(game.claimQuest('nope').ok).toBe(false);
    game.state.inventory = [];
    game.state.era = 2;
    expect(game.claimQuest('era-2').ok).toBe(true);
    expect(game.state.inventory).toHaveLength(1);
    game.state.era = 5; game.state.progress = 30; game.state.wonder = 5;
    game.ascend();
    expect(game.state.quests).toEqual(['primeira-cacada', 'era-2']);
    expect(game.claimQuest('renascer').ok).toBe(true);
    expect(new Set(QUESTS.map(q => q.id)).size).toBe(QUESTS.length);
  });

  it('counts recruits and spirit powers for the journal', () => {
    const game = new Game();

    game.recruit(2);
    expect(game.state.stats.recruits).toBe(1);
    game.state.era = 2; game.state.spirits = ['lobo'];
    game.startBattle(); game.tick(1);
    expect(game.usePower('lobo').ok).toBe(true);
    expect(game.state.stats.powers).toBe(1);
  });
});

describe('boss phases', () => {
  it('triggers each campaign boss mechanic once below half life', () => {
    for (const stage of [5, 10, 15, 20, 25, 30]) {
      const game = new Game();
      game.state.era = 5; game.state.progress = stage - 1; game.state.selectedStage = stage;
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
