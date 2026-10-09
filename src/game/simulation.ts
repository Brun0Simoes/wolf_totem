import { characters, type Character } from '../data/characters';
import { attackTiming, castWindup } from './combatTiming';
import { participationBonus } from './ritualPlay';
import { STARTING_AMBER, draftCost, rerollCost, ritualCost, componentCost, battleAmber, drawCandidates, draftPool, sanitizeDraft, type Draft } from './economy';
import { BUILDS, buildTransaction } from './builds';
import { freshMastery, sanitizeMastery, HERO_PROOFS, type HeroMastery } from './heroMastery';
import { recommendedParty, positionPlan, equipmentPlan, planSignature, roleOf, compositionPlans } from './armyAdvisor';
import { initialJourney, sanitizeJourney, migrateSettlement, blessingLock, legacyLevel, legacyCost, legacyLock, LEGACIES, PREPARATIONS, TRIALS, trialProgress, type AncestralJourney, type PreparationId } from './ancestralJourney';
import { ALL_CHARACTER_IDS, nextRandom, unlockedCost } from './roster';
import { bossScale, endlessLevel, endlessStage, enemyScale, expectedLevel, FINAL_STAGE, regionOf, stageById, type Stage } from './campaign';
import { COMPONENT_IDS, isComponent, itemById, MAX_ITEMS_PER_HERO, recipeFor, type ItemPerks } from './items';
import { castAbility, SKILL_NOTES } from './skills';
import { MEMORIES, memoryCost, spiritById, spiritsOfEra, type MemoryId, type SpiritId } from './spirits';
import { countTraits, TRAIT_RULES, traitStatus, traitPower } from './synergies';
import { questById } from './quests';
import { allySlotCenter, BOARD_CENTER, clampX, clampY, enemyFormation, enemySlotCenter, FORMATION_SLOTS, migrateSlot } from './board';
import { AWAKENING, ERA_GROWTH, MAX_RITUAL_LEVEL, ritualFromTotal, ritualTotalXp, ritualXpToNext, RITUAL_COOLDOWN, RITUAL_XP, battleXp, CACAO_DURATION, CACAO_HEAL, CACAO_XP, levelFromTotal, levelMultiplier, MAX_HERO_LEVEL, MAX_PANEMA, practiceById, PRACTICES, RITUAL_EFFECT, totalXp, trailById, xpToNext, type PracticeId, type TrailId } from './tribe';

export { SKILL_NOTES, FINAL_STAGE };

/** Pure, deterministic simulation. All times are seconds and positions use board cells. */
export type Team = 'ally' | 'enemy';
/** Legacy save shape, consumed by migration; active play never schedules an absence. */
export interface HeroAway { kind: 'hunt' | 'ritual'; id: TrailId | PracticeId; until: number; focus?: boolean; participationXp?: number }
export interface Hero {
  uid: string; characterId: number; stars: number; slot: number | null; items: string[];
  level: number; xp: number; ritualLevel: number; ritualXp: number; ritualReadyAt: number;
  mastery: HeroMastery;
  /** Legacy integration counter, reset to zero when loading. */
  integrationWins: number;
  /** A hunter's bad luck, 0–3. */
  panema: number;
  /** Completed ceremonies per practice. */
  rituals: Partial<Record<PracticeId, number>>;
  away: HeroAway | null;
  /** Rapé before the next hunt. */
  focus: boolean;
}
export interface HuntReport { clock: number; uid: string; name: string; text: string; ok: boolean }
export interface GameState {
  journey: AncestralJourney;
  amber: number;
  draft: Draft | null;
  cacaoBattles: number;
  cacaoCircles: number;
  era: number;
  heroes: Hero[];
  /** Number of campaign stages cleared, in order (0–30). */
  progress: number;
  /** Stage chosen for the next expedition; 0 is the endless hunt. */
  selectedStage: number;
  endlessBest: number;
  endlessRecord: number;
  inventory: string[];
  lootSeed: number;
  spirits: SpiritId[];
  wonder: number;
  embers: number;
  memories: Partial<Record<MemoryId, number>>;
  rebirths: number;
  settings: { speed: number; autoRepeat: boolean };
  /** Claimed journal objectives (kept through rebirths) and the counters they read. */
  quests: string[];
  stats: { recruits: number; powers: number; victories: number; hunts: number; rituals: number };
  /** Legacy cacao timestamps, retained only for save migration. */
  cacao: number;
  cacaoReadyAt: number;
  cacaoIntegrationWins: number;
  /** Latest hunt and ceremony results, newest last. */
  reports: HuntReport[];
  /** Seconds of village time, offline included. */
  clock: number;
  paused: boolean;
}
export interface ActionResult { ok: boolean; message: string }
export interface Synergy { name: string; count: number; threshold: number; thresholds: number[]; tier: number; active: boolean; description: string }
export type SummonKind = 'spider' | 'crow' | 'beetle' | 'echo' | 'elephant' | 'wolf';
export type ModStat = 'attack' | 'attackSpeed' | 'armor' | 'magicResist' | 'lifesteal' | 'damageTaken' | 'cleave' | 'wetBonus';
export interface Modifier { stat: ModStat; value: number; time: number; tag?: string }
export interface CombatEntity {
  id: string;
  uid?: string;
  characterId: number;
  name: string;
  team: Team;
  stars: number;
  cost: number;
  boss: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mana: number;
  manaMax: number;
  attack: number;
  armor: number;
  magicResist: number;
  attackSpeed: number;
  range: number;
  shield: number;
  cooldown: number;
  action: 'idle' | 'walk' | 'attack' | 'cast' | 'dead';
  actionTime: number;
  stun: number;
  slow: number;
  haste: number;
  guard: number;
  poison: number;
  poisonDamage: number;
  marked: number;
  huntMarked: number;
  empowered: number;
  dodge: number;
  dotClock: number;
  guardBurst: boolean;
  /** Untargetable by single-target choices; area effects still apply. */
  stealth: number;
  taunt: number;
  wet: number;
  hex: number;
  hexDamage: number;
  antiheal: number;
  /** Seconds left in a metamorphosis; the renderer enlarges and tints the unit. */
  transform: number;
  stacks: number;
  omen: number;
  reborn: boolean;
  shieldBurst: number;
  deathBurst: number;
  summon?: SummonKind;
  ownerId?: string;
  lifetime: number;
  spellPower: number;
  manaRegen: number;
  regen: number;
  manaRefund: number;
  manaDrain: number;
  scavenger: boolean;
  bonds: string[];
  mods: Modifier[];
  items: string[];
  perks: ItemPerks;
  attackCount: number;
  prevStun: number;
  lowHpShieldUsed: boolean;
  /** Battle summary: damage dealt (summons credit their owner), damage taken, healing and shields given. */
  dealt: number;
  taken: number;
  healed: number;
  shielded: number;
  /** Bosses unleash their mechanic once, below half life. */
  phased: boolean;
  /** Hero level, or the level enemies are tuned for. */
  level: number;
}
export interface CombatEvent {
  id: number;
  type: 'prepare' | 'attack' | 'skill' | 'damage' | 'heal' | 'death' | 'shield' | 'summon' | 'revive' | 'power' | 'phase' | 'overtime';
  sourceId: string;
  targetId?: string;
  amount?: number;
  text?: string;
  x: number;
  y: number;
  time: number;
  duration?:number;
  sourceX?:number;
  sourceY?:number;
  school?:'physical'|'magic'|'true';
  absorbed?:number;
}
export type ZoneKind = 'web' | 'water' | 'veil' | 'domain' | 'frost';
export interface CombatZone {
  id: number;
  kind: ZoneKind;
  team: Team;
  sourceId: string;
  followId?: string;
  x: number;
  y: number;
  radius: number;
  time: number;
  duration: number;
  pulse: number;
  /** Damage per second to opponents inside. */
  dps?: number;
  slow?: boolean;
  wet?: boolean;
  /** Fraction of max life healed per second for allies inside. */
  allyHeal?: number;
  ownerHeal?: number;
  /** Damage reduction for allies inside. */
  protect?: number;
  ownerAttack?: number;
  ownerArmor?: number;
}
export interface BattleState {
  entities: CombatEntity[];
  zones: CombatZone[];
  time: number;
  /** Campaign stage id, or 0 for the endless hunt. */
  stage: number;
  depth: number;
  region: number;
  name: string;
  status: 'fighting' | 'victory' | 'defeat';
  loot: string[];
  firstClear: boolean;
  prey: Partial<Record<Team, { id: string; time: number }>>;
  lastCast: Partial<Record<Team, number>>;
  powersUsed: SpiritId[];
  preparations:PreparationId[];
  /** Heroes who marched, and what they learned. */
  party: string[];
  xp: number;
  amber: number;
  levelUps: string[];
}
export interface SummonSpec { hp: number; attack: number; range: number; lifetime: number; attackSpeed?: number; taunt?: number; deathBurst?: number; characterId?: number; stars?: number; x?: number; y?: number }

/** What a skill may do. Skills never touch saves, the economy or the renderer. */
export interface CombatApi {
  battle: BattleState;
  enemiesOf(entity: CombatEntity): CombatEntity[];
  targetableEnemiesOf(entity: CombatEntity): CombatEntity[];
  alliesOf(entity: CombatEntity): CombatEntity[];
  fallen(team: Team): CombatEntity[];
  damage(source: CombatEntity, target: CombatEntity, raw: number, magic?: boolean, trueDamage?: boolean): number;
  heal(source: CombatEntity, target: CombatEntity, amount: number): void;
  shield(source: CombatEntity, target: CombatEntity, amount: number): void;
  emit(type: CombatEvent['type'], source: CombatEntity, target?: CombatEntity, amount?: number, text?: string): void;
  summon(owner: CombatEntity, kind: SummonKind, spec: SummonSpec): CombatEntity | null;
  addZone(zone: Omit<CombatZone, 'id' | 'pulse' | 'duration'>): void;
  cast(abilityId: number, source: CombatEntity, target: CombatEntity, power: number): void;
}

export const PLAYABLE_IDS = ALL_CHARACTER_IDS;
export const MAX_ERA = 5;
export const SAVE_VERSION = 9;
export const OFFLINE_CAP_SECONDS = 12 * 3600;
export const MAX_ROSTER_SIZE = 55;
export const MAX_INVENTORY = 180;
export const WONDER_STAGES = 5;
const MAX_SUMMONS_PER_OWNER = 6;
/** Twilight: past this second, healing fades and every blow lands harder, so no battle stalls. */
export const OVERTIME_START = 75;
export const overtimeDamage = (time: number) => 1 + Math.max(0, time - OVERTIME_START) * 0.03;
export const overtimeHealing = (time: number) => Math.max(0.15, 1 - Math.max(0, time - OVERTIME_START) * 0.02);
const STAR_POWER = [1, 2.2, 4];
export function characterById(id: number): Character {
  return characters.find(character => character.id === id) ?? characters[0];
}
export const capacity = (state: GameState): number => 2 + state.era;
const memory = (state: GameState, id: MemoryId): number => state.memories[id] ?? 0;
const chosenSpirits = (state: GameState) => state.spirits.map(spiritById).filter(spirit => !!spirit);
/** Embers granted by raising the Great Totem now. */
export const embersFor = (state: GameState): number => 8 + 2 * state.endlessBest + 2 * state.rebirths;

/** Each consecration follows a conquest or hero milestone; no materials are required. */
export function totemLock(s:GameState):string|null {
  if(s.wonder>=WONDER_STAGES)return 'Totem completo';
  if(s.era<5||s.progress<25)return 'Alcance a Era V e vença o Leviatã do Pântano';
  if(s.wonder===1&&s.progress<27)return 'Vença a expedição 27';
  if(s.wonder===2&&!s.heroes.some(h=>h.ritualLevel>=8))return 'Alcance vínculo ritual 8 com um herói';
  if(s.wonder===3&&!(s.progress>=30&&s.heroes.some(h=>h.stars>=3)))return 'Vença o Primeiro Inverno e desperte um herói 3★';
  if(s.wonder===4&&s.endlessBest<1)return 'Vença a primeira profundidade da Caçada Eterna';
  return null;
}

export function getSynergies(state: GameState): Synergy[] {
  const counts = countTraits(state.heroes.filter(hero => hero.slot !== null && available(hero)).map(hero => hero.characterId));
  return [...counts].map(([name, count]) => {
    const status = traitStatus(name, count);
    return { name, count, threshold: status.next, thresholds: status.thresholds, tier: status.tier, active: status.tier > 0, description: status.description };
  }).sort((a, b) => Number(b.active) - Number(a.active) || b.tier - a.tier || b.count - a.count || a.name.localeCompare(b.name));
}

/** The era reached but not yet consecrated to a patron spirit, if any. */
export function pendingEra(state: GameState): number | null {
  const era = state.spirits.length + 2;
  return era <= state.era ? era : null;
}
export const stageUnlocked = (state: GameState, stageId: number): boolean =>
  stageId === 0 ? state.progress >= FINAL_STAGE : stageId >= 1 && stageId <= Math.min(FINAL_STAGE, state.progress + 1) && regionOf(stageId).village <= state.era;

const success = (message: string): ActionResult => ({ ok: true, message });
const fail = (message: string): ActionResult => ({ ok: false, message });
const finite = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const integer = (value: unknown, fallback: number, min: number, max: number): number => Math.floor(finite(value, fallback, min, max));
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
export const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);
const modTotal = (entity: CombatEntity, stat: ModStat): number => entity.mods.reduce((sum, mod) => mod.stat === stat ? sum + mod.value : sum, 0);
export const effectiveAttack = (entity: CombatEntity): number => entity.attack * Math.max(0.2, 1 + modTotal(entity, 'attack'));
const effectiveArmor = (entity: CombatEntity): number => entity.armor + modTotal(entity, 'armor');
const effectiveMagicResist = (entity: CombatEntity): number => entity.magicResist + modTotal(entity, 'magicResist');
export function attackRate(entity: CombatEntity): number {
  return entity.attackSpeed * (entity.haste > 0 ? 1.25 : 1) * (entity.slow > 0 ? 0.7 : 1) * Math.max(0.3, 1 + modTotal(entity, 'attackSpeed'));
}
/** Adds a timed modifier; a tagged modifier replaces the previous one with the same tag. */
export function addMod(entity: CombatEntity, stat: ModStat, value: number, time: number, tag?: string): void {
  if (tag) entity.mods = entity.mods.filter(mod => mod.tag !== tag);
  entity.mods.push({ stat, value, time, tag });
}
export const clampToBoard = (entity: CombatEntity): void => {
  entity.x = clampX(entity.x);
  entity.y = clampY(entity.y);
};

export const newHero = (uid: string, characterId: number, stars = 1, slot: number | null = null): Hero =>
  ({ uid, characterId, stars, slot, items: [], level: 1, xp: 0, ritualLevel: 1, ritualXp: 0, ritualReadyAt: 0, integrationWins: 0, mastery: freshMastery(), panema: 0, rituals: {}, away: null, focus: false });
/** The journey begins with Akru alone at the front centre; the tribe grows from there. */
const starterHeroes = (): Hero[] => [newHero('hero-1', 1, 1, 3)];
/** Kept for formation checks; migrated heroes are always available. */
export const available = (hero: Hero) => !hero.away;

function initialState(): GameState {
  return {
    journey: initialJourney(), amber: STARTING_AMBER, draft: null, cacaoBattles: 0, cacaoCircles: 0,
    era: 1,
    heroes: starterHeroes(),
    progress: 0, selectedStage: 1, endlessBest: 0, endlessRecord: 0,
    inventory: [], lootSeed: 11,
    spirits: [], wonder: 0, embers: 0, memories: {}, rebirths: 0,
    settings: { speed: 1, autoRepeat: false },
    quests: [], stats: { recruits: 0, powers: 0, victories: 0, hunts: 0, rituals: 0 }, clock: 0, cacao: 0, cacaoReadyAt: 0, cacaoIntegrationWins: 0, reports: [],
    paused: false,
  };
}

function sanitizeState(value: unknown, version: number): GameState {
  const input = record(value);
  const fallback = initialState();
  const settings = record(input.settings);
  const memories = record(input.memories);
  const stats = record(input.stats);
  // Version 1 counted linear waves; each cleared wave becomes a cleared stage.
  const progress = version === 1 ? integer(input.wave, 1, 1, FINAL_STAGE + 1) - 1 : integer(input.progress, 0, 0, FINAL_STAGE);
  const state: GameState = {
    ...fallback,
    amber: version < 9 ? Math.min(400, STARTING_AMBER + progress * 8) : integer(input.amber, 0, 0, 1e9),
    cacaoBattles: version < 9 ? (finite(input.cacao,0,0,1e12) > finite(input.clock,0,0,1e12) ? 3 : 0) : integer(input.cacaoBattles, 0, 0, 3),
    cacaoCircles:version<9?(finite(input.cacao,0,0,1e12)>0?1:0):integer(input.cacaoCircles,0,0,1e9),
    era: integer(input.era ?? input.villageLevel, 1, 1, MAX_ERA),
    paused: input.paused === true,
    // Saves from 0.3 stored a rotation index; it is a valid starting seed.
    lootSeed: integer(input.lootSeed, 11, 0, 4294967295),
    progress,
    endlessBest: integer(input.endlessBest, 0, 0, 10_000),
    endlessRecord: integer(input.endlessRecord, 0, 0, 10_000),
    wonder: integer(input.wonder, 0, 0, WONDER_STAGES),
    embers: integer(input.embers, 0, 0, 1_000_000),
    rebirths: integer(input.rebirths, 0, 0, 100_000),
    memories: Object.fromEntries(MEMORIES.map(entry => [entry.id, integer(memories[entry.id], 0, 0, entry.max)])),
    settings: { speed: integer(settings.speed, 1, 1, 3), autoRepeat: settings.autoRepeat === true },
    inventory: Array.isArray(input.inventory) ? input.inventory.filter(id => typeof id === 'string' && !!itemById(id)).slice(0, MAX_INVENTORY) as string[] : [],
    quests: Array.isArray(input.quests) ? [...new Set(input.quests.filter(id => typeof id === 'string' && !!questById(id)))] as string[] : [],
    stats: { recruits: integer(stats.recruits, 0, 0, 1e9), powers: integer(stats.powers, 0, 0, 1e9), victories: integer(stats.victories, 0, 0, 1e9), hunts: integer(stats.hunts, 0, 0, 1e9), rituals: integer(stats.rituals, 0, 0, 1e9) },
    clock: finite(input.clock, 0, 0, 1e12),
    reports: Array.isArray(input.reports) ? input.reports.slice(-8).flatMap(value => {
      const report = record(value);
      return typeof report.text === 'string' && typeof report.name === 'string' && typeof report.uid === 'string'
        ? [{ clock: finite(report.clock, 0, 0, 1e12), uid: report.uid.slice(0, 40), name: report.name.slice(0, 40), text: report.text.slice(0, 160), ok: report.ok === true }] : [];
    }) : [],
  };
  state.journey = version >= 6 ? sanitizeJourney(input.journey) : initialJourney();
  if(version<7)migrateSettlement(state,input);
  state.journey.focusTraits=state.journey.focusTraits.filter(trait=>Object.hasOwn(TRAIT_RULES,trait));
  state.cacao = finite(input.cacao, 0, 0, state.clock + CACAO_DURATION);
  state.cacaoReadyAt = finite(input.cacaoReadyAt, state.cacao > state.clock ? state.clock + RITUAL_COOLDOWN : 0, 0, state.clock + RITUAL_COOLDOWN);
  state.cacaoIntegrationWins = state.cacaoReadyAt > state.clock ? integer(input.cacaoIntegrationWins, 2, 0, 2) : 0;
  state.endlessRecord = Math.max(state.endlessRecord, state.endlessBest);
  const spirits: SpiritId[] = [];
  if (Array.isArray(input.spirits)) for (const [index, id] of input.spirits.entries()) {
    const spirit = typeof id === 'string' ? spiritById(id) : undefined;
    if (spirit && spirit.era === index + 2 && index + 2 <= state.era) spirits.push(spirit.id); else break;
  }
  state.spirits = spirits;
  const slots = new Set<number>();
  const uids = new Set<string>();
  if (Array.isArray(input.heroes)) {
    state.heroes = input.heroes.slice(0, MAX_ROSTER_SIZE).flatMap((value, index) => {
      const hero = record(value);
      if (!PLAYABLE_IDS.includes(hero.characterId as number)) return [];
      let uid = typeof hero.uid === 'string' && /^[a-z0-9-]{1,40}$/.test(hero.uid) ? hero.uid : `restored-${index}`;
      let suffix = 0;
      while (uids.has(uid)) uid = `restored-${index}-${suffix++}`;
      uids.add(uid);
      const legacy = version < 3;
      let slot: number | null = typeof hero.slot === 'number' && Number.isInteger(hero.slot) && hero.slot >= 0 && hero.slot < (legacy ? 12 : FORMATION_SLOTS) ? hero.slot : null;
      if (slot !== null && legacy) slot = migrateSlot(slot);
      if (slot !== null && (slots.has(slot) || slots.size >= capacity(state))) slot = null;
      if (slot !== null) slots.add(slot);
      const items = Array.isArray(hero.items) ? hero.items.filter(id => typeof id === 'string' && !!itemById(id)).slice(0, MAX_ITEMS_PER_HERO) as string[] : [];
      const level = integer(hero.level, 1, 1, MAX_HERO_LEVEL);
      const rituals = record(hero.rituals);
      const awayInput = record(hero.away);
      const awayKind = awayInput.kind === 'hunt' || awayInput.kind === 'ritual' ? awayInput.kind : null;
      const awayValid = awayKind && typeof awayInput.id === 'string' && (awayKind === 'hunt' ? !!trailById(awayInput.id) : !!practiceById(awayInput.id) && !practiceById(awayInput.id)!.tribe)
        && typeof awayInput.until === 'number' && Number.isFinite(awayInput.until) && awayInput.until <= state.clock + 24 * 3600;
      const away: HeroAway | null = awayValid ? { kind: awayKind!, id: awayInput.id as TrailId | PracticeId, until: Math.max(0, awayInput.until as number), focus: awayInput.focus === true } : null;
      if (away?.kind === 'ritual') away.participationXp = integer(awayInput.participationXp, 0, 0, participationBonus(RITUAL_XP[away.id as PracticeId], 1));
      return [{
        ...newHero(uid, hero.characterId as number, integer(hero.stars, 1, 1, 3), slot), items, level,
        ritualLevel: integer(hero.ritualLevel, 1, 1, MAX_RITUAL_LEVEL),
        ritualXp: integer(hero.ritualLevel, 1, 1, MAX_RITUAL_LEVEL) >= MAX_RITUAL_LEVEL ? 0 : finite(hero.ritualXp, 0, 0, ritualXpToNext(integer(hero.ritualLevel, 1, 1, MAX_RITUAL_LEVEL)) - 1),
        ritualReadyAt: finite(hero.ritualReadyAt, 0, 0, state.clock + 24 * 3600),
        integrationWins: finite(hero.ritualReadyAt, 0, 0, state.clock + 24 * 3600) > state.clock ? integer(hero.integrationWins, 2, 0, 2) : 0,
        mastery: sanitizeMastery(hero.mastery),
        xp: level >= MAX_HERO_LEVEL ? 0 : finite(hero.xp, 0, 0, xpToNext(level) - 1),
        panema: integer(hero.panema, 0, 0, MAX_PANEMA),
        rituals: Object.fromEntries(PRACTICES.filter(entry => !entry.tribe).map(entry => [entry.id, integer(rituals[entry.id], 0, 0, entry.max)]).filter(([, count]) => (count as number) > 0)),
        away, focus: hero.focus === true,
      }];
    });
    if (!state.heroes.length) state.heroes = starterHeroes();
  }
  // Versions 1–3 could own copies. Keep the strongest identity, equipment and learned progress.
  const unique = new Map<number, Hero>();
  for (const hero of state.heroes) {
    if (version < 4) {
      const learned = Object.entries(hero.rituals).reduce((sum, [id, count]) => sum + (RITUAL_XP[id as PracticeId] ?? 0) * count, 0);
      Object.assign(hero, ritualFromTotal(learned));
      // Earned legacy stars remain earned after migration.
      const threshold = AWAKENING.find(entry => entry.stars === hero.stars);
      if (threshold) { hero.level = Math.max(hero.level, threshold.level); hero.ritualLevel = Math.max(hero.ritualLevel, threshold.ritualLevel); }
    }
    const keeper = unique.get(hero.characterId);
    if (!keeper) { unique.set(hero.characterId, hero); continue; }
    keeper.stars = Math.max(keeper.stars, hero.stars);
    if (totalXp(hero.level, hero.xp) > totalXp(keeper.level, keeper.xp)) { keeper.level = hero.level; keeper.xp = hero.xp; }
    if (ritualTotalXp(hero.ritualLevel, hero.ritualXp) > ritualTotalXp(keeper.ritualLevel, keeper.ritualXp)) { keeper.ritualLevel = hero.ritualLevel; keeper.ritualXp = hero.ritualXp; }
    if (keeper.slot === null && hero.slot !== null) { keeper.slot = hero.slot; }
    keeper.panema = Math.min(keeper.panema, hero.panema);
    keeper.ritualReadyAt = Math.max(keeper.ritualReadyAt, hero.ritualReadyAt);
    keeper.away ??= hero.away;
    for (const practice of PRACTICES) if (!practice.tribe) keeper.rituals[practice.id] = Math.max(keeper.rituals[practice.id] ?? 0, hero.rituals[practice.id] ?? 0);
    for (const item of hero.items) { if (keeper.items.length < MAX_ITEMS_PER_HERO) keeper.items.push(item); else state.inventory.push(item); }
  }
  state.heroes = [...unique.values()];
  state.draft = sanitizeDraft(input.draft, state.era, state.heroes.map(h=>h.characterId));
  // Convert the old hunt challenge to recruitment without comparing unrelated counters.
  if(version<9&&state.journey.trial?.id==='hunt'){
    if(state.stats.hunts>state.journey.trial.start){
      state.journey.knowledge+=TRIALS.find(t=>t.id==='hunt')!.reward;
      state.journey.completed++;state.journey.trial=null;
    } else state.journey.trial.start=state.stats.recruits;
  }
  // Grandfather paid time in old ceremonies once; hunts return and all clocks disappear.
  if (version < 9) for (const h of state.heroes) {
    if(h.away?.kind === 'ritual') {
      const id=h.away.id as PracticeId, p=practiceById(id)!;
      h.rituals[id]=Math.min(p.max,(h.rituals[id]??0)+1);
      Object.assign(h,ritualFromTotal(ritualTotalXp(h.ritualLevel,h.ritualXp)+RITUAL_XP[id]+(h.away.participationXp??0)));
      state.stats.rituals++;
      for(const need of AWAKENING)if(h.level>=need.level&&h.ritualLevel>=need.ritualLevel&&(!need.ayahuasca||h.rituals.ayahuasca))h.stars=Math.max(h.stars,need.stars);
    }
  }
  for(const h of state.heroes){h.away=null;h.ritualReadyAt=0;h.integrationWins=0;h.panema=0;}
  state.cacao=0;state.cacaoReadyAt=0;state.cacaoIntegrationWins=0;
  const selected = integer(input.selectedStage, Math.min(FINAL_STAGE, state.progress + 1), 0, FINAL_STAGE);
  state.selectedStage = stageUnlocked(state, selected) ? selected : Math.max(1, Math.min(state.progress + 1, FINAL_STAGE));
  while (state.selectedStage > 1 && !stageUnlocked(state, state.selectedStage)) state.selectedStage--;
  state.journey.selected=state.journey.selected.filter(id=>!blessingLock(state,id));
  return state;
}

export class Game {
  state: GameState;
  battle: BattleState | null = null;
  events: CombatEvent[] = [];
  offlineSeconds = 0;
  private uidCounter = 4;
  private eventCounter = 0;
  private summonCounter = 0;
  private zoneCounter = 0;
  private traitTiers = new Map<string, number>();
  private enemyTraits = new Map<string, number>();
  private healBonus = 0;
  private summonBonus = 0;
  private battlePreparations:PreparationId[]=[];
  private battleSkillUsers = new Set<string>();
  private windups=new Map<string,{kind:'attack'|'cast';targetId:string;remaining:number}>();
  private projectiles:{source:CombatEntity;target:CombatEntity;remaining:number;power:number;third:boolean}[]=[];

  /** A save can be the serialized JSON string or the parsed versioned save object. */
  constructor(save?: unknown, now = Date.now()) {
    this.state = initialState();
    if (typeof save === 'string') { try { save = JSON.parse(save); } catch { return; } }
    const root = record(save);
    if (typeof root.version !== 'number' || ![1,2,3,4,5,6,7,8,SAVE_VERSION].includes(root.version)) return;
    this.state = sanitizeState(root.state, root.version as number);
    this.offlineSeconds = 0;
  }

  /** Combat is deliberately omitted. Reloading abandons an unfinished fight without rewards. */
  serialize(now = Date.now()): string {
    return JSON.stringify({ version: SAVE_VERSION, savedAt: now, state: this.state });
  }

  private fighting(): boolean { return this.battle?.status === 'fighting'; }
  private random(): number {
    const roll = nextRandom(this.state.lootSeed);
    this.state.lootSeed = roll.seed;
    return roll.value;
  }
  private randomComponent(): string { return COMPONENT_IDS[Math.floor(this.random() * COMPONENT_IDS.length)]; }
  private addItem(id: string): boolean {
    if (this.state.inventory.length >= MAX_INVENTORY) return false;
    this.state.inventory.push(id);
    return true;
  }

  /** The clock timestamps reports. Leaving the game grants no resources or progress. */
  private produce(seconds: number): void { this.state.clock += seconds; }
  catchUp(_seconds: number): void { /* Progress is earned through play. */ }

  setArmyFocus(trait:string):ActionResult {
    if(!Object.hasOwn(TRAIT_RULES,trait))return fail('Laço desconhecido.');
    const j=this.state.journey;j.focusTraits=j.focusTraits.includes(trait)?j.focusTraits.filter(t=>t!==trait):[...j.focusTraits.slice(-1),trait];return success('Prioridades da formação atualizadas.');
  }
  acceptTrial(id:string):ActionResult {
    const def=TRIALS.find(t=>t.id===id);if(!def||this.state.paused)return fail('Escolha um desafio com a jornada em atividade.');
    if(this.state.journey.trial?.id===id)return fail('Este desafio já está ativo.');
    this.state.journey.trial={id:def.id,start:this.state.stats[def.stat]};return success(`${def.name}: suas próximas atividades contam para este desafio.`);
  }
  claimTrial():ActionResult {
    const j=this.state.journey,def=TRIALS.find(t=>t.id===j.trial?.id);
    if(!def||trialProgress(this.state)<def.goal||this.state.paused)return fail('Conclua o desafio ativo antes de receber conhecimento.');
    j.knowledge+=def.reward;j.completed++;j.trial=null;return success(`Desafio concluído: +${def.reward} de conhecimento ancestral.`);
  }
  learnLegacy(id:string):ActionResult {
    const def=LEGACIES.find(d=>d.id===id);if(!def||this.state.paused)return fail('Retome a jornada e escolha um legado.');
    if(this.fighting())return fail('Escolha legados entre os combates.');
    const lock=legacyLock(this.state,def);if(lock)return fail(lock);
    const level=legacyLevel(this.state,def.id),cost=legacyCost(level);if(this.state.journey.knowledge<cost)return fail(`São necessários ${cost} de conhecimento.`);
    this.state.journey.knowledge-=cost;this.state.journey.legacies[def.id]=level+1;return success(`${def.name} chegou ao nível ${level+1}.`);
  }
  selectPreparation(id:string):ActionResult {
    const j=this.state.journey,def=PREPARATIONS.find(d=>d.id===id);
    if(!def||this.state.paused||this.fighting())return fail('Escolha bênçãos entre os combates, com a jornada em atividade.');
    if(j.selected.includes(def.id)){j.selected=j.selected.filter(p=>p!==def.id);return success('Bênção retirada da formação.');}
    const lock=blessingLock(this.state,def.id);if(lock)return fail(lock);
    if(j.selected.length>=2)return fail('Retire uma das duas bênçãos selecionadas.');
    j.selected.push(def.id);return success(`${def.name} acompanha sua formação em todas as próximas batalhas.`);
  }

  advanceEra():ActionResult {
    if(this.state.paused||this.fighting())return fail('Avance entre os combates, com a jornada em atividade.');
    if(this.state.era>=MAX_ERA)return fail('A Era V já foi alcançada.');
    const need=ERA_GROWTH[this.state.era-1];
    if(!this.state.heroes.some(h=>h.level>=need.level&&h.ritualLevel>=need.ritualLevel))return fail(`A próxima era pede um herói com experiência nível ${need.level} e ritual nível ${need.ritualLevel}.`);
    this.state.era++;
    return success(`Era ${this.state.era}! Escolha um Espírito Protetor e acolha os novos companheiros.`);
  }

  chooseSpirit(id: SpiritId): ActionResult {
    const era = pendingEra(this.state);
    if (!era) return fail('Nenhuma era aguarda um Espírito Protetor.');
    const spirit = spiritsOfEra(era).find(entry => entry.id === id);
    if (!spirit) return fail('Este espírito não pertence a esta era.');
    this.state.spirits.push(spirit.id);
    return success(`O ${spirit.name} protege a tribo. Novo poder: ${spirit.power.name}.`);
  }

  private newUid(): string {
    let uid = `hero-${this.uidCounter++}`;
    while (this.state.heroes.some(hero => hero.uid === uid)) uid = `hero-${this.uidCounter++}`;
    return uid;
  }
  openDraft():ActionResult {
    if(this.fighting()||this.state.paused)return fail('O draft se abre entre combates, com a jornada em atividade.');
    if(this.state.draft)return fail('Escolha uma das cartas do draft atual.');
    if(!draftPool(this.state.era,this.state.heroes.map(h=>h.characterId)).length)return fail('Todos os guardiões disponíveis nesta era já foram acolhidos.');
    const cost=draftCost(this.state.era);
    if(this.state.amber<cost)return fail(`São necessários ${cost} de âmbar. Lute para receber recursos.`);
    const draw=drawCandidates(this.state.era,this.state.heroes.map(h=>h.characterId),[],this.state.lootSeed,3);
    this.state.amber-=cost;this.state.lootSeed=draw.seed;
    this.state.draft={era:this.state.era,offers:draw.offers,rolls:0};
    return success('Escolha um guardião. A escolha já está paga e pode ser concluída depois.');
  }
  rerollDraft(index:number,target=''):ActionResult {
    if(this.fighting()||this.state.paused)return fail('Troque cartas entre os combates.');
    const d=this.state.draft;
    if(!d||!Number.isInteger(index)||index<0||index>=d.offers.length)return fail('Carta de draft inválida.');
    const draw=drawCandidates(d.era,this.state.heroes.map(h=>h.characterId),d.offers,this.state.lootSeed,1,target);
    if(!draw.offers.length)return fail('Nenhuma alternativa inédita corresponde ao filtro. Seu âmbar foi preservado.');
    const cost=rerollCost(d.era);
    if(this.state.amber<cost)return fail(`São necessários ${cost} de âmbar para trocar esta carta.`);
    this.state.amber-=cost;this.state.lootSeed=draw.seed;d.offers[index]=draw.offers[0];d.rolls++;
    return success('Carta substituída. As outras duas ofertas foram preservadas.');
  }
  recruit(characterId:number):ActionResult {
    if(this.fighting()||this.state.paused)return fail('Escolha seu guardião entre os combates.');
    if(this.state.heroes.some(h=>h.characterId===characterId))return fail('Este guardião já pertence à tribo.');
    if(!this.state.draft?.offers.includes(characterId))return fail('Este guardião precisa estar no draft pago atual.');
    const c=characterById(characterId);
    if(c.cost>this.state.era)return fail('Avance de era para receber este guardião.');
    this.state.heroes.push(newHero(this.newUid(),characterId));this.state.stats.recruits++;
    this.state.draft=null;
    return success(`${c.name} se uniu à tribo. Acolhimento único, sem fusão de cópias.`);
  }
  buyComponent(id:string):ActionResult {
    if(this.fighting()||this.state.paused)return fail('Prepare itens entre os combates.');
    if(!isComponent(id))return fail('Componente desconhecido.');
    const cost=componentCost(this.state.era);
    if(this.state.amber<cost)return fail(`São necessários ${cost} de âmbar.`);
    if(!this.addItem(id))return fail('A bolsa está cheia.');
    this.state.amber-=cost;return success(`${itemById(id)!.name} adquirido.`);
  }
  buyRelic(id:string):ActionResult {
    if(this.fighting()||this.state.paused)return fail('Prepare relíquias entre os combates.');
    const d=itemById(id);if(!d?.price||!d.era)return fail('Relíquia desconhecida.');
    if(this.state.era<d.era)return fail(`Exige Era ${d.era}.`);
    if(this.state.amber<d.price)return fail(`São necessários ${d.price} de âmbar.`);
    if(!this.addItem(id))return fail('A bolsa está cheia.');
    this.state.amber-=d.price;return success(`${d.name} adquirido. Escolha seu portador.`);
  }
  prepareBuild(uid:string,id:string):ActionResult {
    if(this.fighting()||this.state.paused)return fail('Prepare builds entre os combates.');
    const h=this.state.heroes.find(h=>h.uid===uid),b=BUILDS.find(b=>b.id===id);
    if(!h||!b)return fail('Build desconhecida.');
    const plan=buildTransaction(this.state.era,this.state.inventory,h.items,b.items);
    if(!plan||plan.bag.length>MAX_INVENTORY)return fail('A bolsa não comporta a troca.');
    if(this.state.amber<plan.cost)return fail(`Faltam ${plan.cost-this.state.amber} de âmbar para completar esta build.`);
    this.state.amber-=plan.cost;this.state.inventory=plan.bag;h.items=plan.items;
    return success(`${b.name} preparada em ${characterById(h.characterId).name}. Peças anteriores foram devolvidas à bolsa.`);
  }


  autoFormation(): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate para organizar a formação.');
    const party = this.state.heroes.filter(hero => !hero.away)
      .sort((a,b) => b.stars-a.stars || b.level-a.level).slice(0,capacity(this.state));
    if (!party.length) return fail('A tribo está em atividades fora da aldeia.');
    const slots = enemyFormation(party.map(hero => characterById(hero.characterId).range > 1));
    for (const hero of this.state.heroes) hero.slot = null;
    party.forEach((hero,index) => { hero.slot=slots[index]; });
    return success('Formação organizada: combatentes à frente, conjuradores e atiradores atrás.');
  }

  applyArmyPlan(expected?:string,composition='auto'):ActionResult {
    if(this.fighting())return fail('Aguarde o fim do combate para mudar a formação.');
    if(this.state.paused)return fail('Retome a jornada.');
    if(expected&&expected!==planSignature(this.state))return fail('O elenco mudou. Confira o plano atualizado.');
    if(composition!=='auto'&&!compositionPlans(this.state).some(p=>p.id===composition))return fail('Esta composição não está mais disponível.');
    const party=recommendedParty(this.state,composition);if(!party.length)return fail('Selecione guardiões para o campo.');
    const positions=positionPlan(this.state,party);
    for(const h of this.state.heroes)h.slot=null;
    positions.forEach(p=>{p.hero.slot=p.slot;});return success('Formação aplicada: posições, funções e laços ajustados ao encontro.');
  }
  applyEquipmentPlan(expected?:string):ActionResult {
    if(this.fighting()||this.state.paused)return fail('Distribua equipamentos entre os combates, com a jornada em atividade.');
    if(expected&&expected!==planSignature(this.state))return fail('A bolsa ou formação mudou. Confira a distribuição atualizada.');
    const plan=equipmentPlan(this.state);if(!plan.length)return fail('Não há itens prontos e vagas na formação para distribuir.');
    for(const p of [...plan].sort((a,b)=>b.index-a.index)){p.hero.items.push(this.state.inventory[p.index]);this.state.inventory.splice(p.index,1);}
    return success(`${plan.length} item(ns) distribuído(s). Os equipamentos anteriores foram preservados.`);
  }

  deploy(uid: string, slot: number | null): ActionResult {
    if (this.fighting()) return fail('A formação está em combate.');
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    if (!hero) return fail('Herói não encontrado.');
    if (slot !== null && (!Number.isInteger(slot) || slot < 0 || slot >= FORMATION_SLOTS)) return fail('Escolha um lugar válido da formação.');
    const occupant = slot === null ? undefined : this.state.heroes.find(entry => entry.uid !== uid && entry.slot === slot);
    const deployed = this.state.heroes.filter(entry => entry.slot !== null).length;
    if (slot !== null && hero.slot === null && !occupant && deployed >= capacity(this.state)) return fail('Formação cheia. Avance de era para levar mais heróis.');
    if (occupant) occupant.slot = hero.slot;
    hero.slot = slot;
    if (slot !== null && hero.away) return success(`Formação atualizada. ${characterById(hero.characterId).name} luta quando voltar à aldeia.`);
    return success(slot === null ? 'Herói movido para a reserva.' : 'Formação atualizada.');
  }

  equipItem(uid: string, inventoryIndex: number): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate.');
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    const id = this.state.inventory[inventoryIndex];
    if (!hero || !id) return fail('Escolha um item da bolsa e um herói.');
    if (isComponent(id)) {
      // Like the auto battlers that inspired it, a component placed beside another completes the item.
      const partner = hero.items.findIndex(owned => isComponent(owned));
      if (partner >= 0) {
        const result = recipeFor(hero.items[partner], id)!;
        hero.items[partner] = result.id;
        this.state.inventory.splice(inventoryIndex, 1);
        return success(`${result.name} foi forjado em ${characterById(hero.characterId).name}.`);
      }
    }
    if (hero.items.length >= MAX_ITEMS_PER_HERO) return fail('Este herói já carrega três itens.');
    hero.items.push(id);
    this.state.inventory.splice(inventoryIndex, 1);
    return success(`${itemById(id)!.name} entregue a ${characterById(hero.characterId).name}.`);
  }

  unequipItem(uid: string, itemIndex: number): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate.');
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    const id = hero?.items[itemIndex];
    if (!hero || !id) return fail('Item não encontrado.');
    if (this.state.inventory.length >= MAX_INVENTORY) return fail('A bolsa está cheia.');
    hero.items.splice(itemIndex, 1);
    this.state.inventory.push(id);
    return success(`${itemById(id)!.name} voltou à bolsa.`);
  }

  combineItems(first: number, second: number): ActionResult {
    if (first === second) return fail('Escolha dois componentes diferentes da bolsa.');
    const a = this.state.inventory[first], b = this.state.inventory[second];
    if (!a || !b || !isComponent(a) || !isComponent(b)) return fail('Só componentes podem ser combinados.');
    if(this.fighting()||this.state.paused)return fail('Combine equipamentos entre os combates, com a jornada em atividade.');
    const result = recipeFor(a, b)!;
    this.state.inventory = this.state.inventory.filter((_, index) => index !== first && index !== second);
    this.state.inventory.push(result.id);
    return success(`${result.name} foi forjado.`);
  }

  selectStage(stageId: number): ActionResult {
    if (this.fighting()) return fail('A expedição atual ainda está em andamento.');
    if (!stageUnlocked(this.state, stageId)) return fail(stageId === 0 ? 'A Caçada Eterna desperta após o Primeiro Inverno.' : 'Esta expedição ainda não foi alcançada.');
    this.state.selectedStage = stageId;
    return success(stageId === 0 ? `Caçada Eterna · profundidade ${this.state.endlessBest + 1}.` : `${stageById(stageId)!.name} escolhida.`);
  }

  setSpeed(speed: number): void { this.state.settings.speed = Math.max(1, Math.min(3, Math.round(speed))); }
  toggleAutoRepeat(): boolean { this.state.settings.autoRepeat = !this.state.settings.autoRepeat; return this.state.settings.autoRepeat; }

  buildWonder():ActionResult {
    if(this.state.paused||this.fighting())return fail('Consagre o Totem entre os combates, com a jornada em atividade.');
    const lock=totemLock(this.state);if(lock)return fail(lock);
    this.state.wonder++;
    return success(this.state.wonder===WONDER_STAGES?'O Grande Totem está completo. Os ancestrais aguardam o renascimento.':`Totem consagrado: ${this.state.wonder}/${WONDER_STAGES}.`);
  }

  ascend(): ActionResult {
    if (this.fighting()) return fail('Conclua a expedição antes do ritual.');
    if (this.state.wonder < WONDER_STAGES || this.state.progress < FINAL_STAGE) return fail('O renascimento exige o Grande Totem completo e a vitória no Primeiro Inverno.');
    const gained = embersFor(this.state);
    const keep = { embers: this.state.embers + gained, memories: { ...this.state.memories }, rebirths: this.state.rebirths + 1, endlessRecord: Math.max(this.state.endlessRecord, this.state.endlessBest), settings: { ...this.state.settings }, lootSeed: this.state.lootSeed, quests: [...this.state.quests], stats: { ...this.state.stats }, journey:{...this.state.journey,selected:[]}, clock: this.state.clock };
    this.state = { ...initialState(), ...keep };
    this.gainXp(this.state.heroes[0],1500*memory(this.state,'heranca'),false);
    for (let i = 0; i < memory(this.state, 'forja'); i++) this.addItem(this.randomComponent());
    this.battle = null; this.events = [];
    return success(`A tribo renasce com ${gained} brasas ancestrais.`);
  }

  // ——— Experience, hunts and ceremonies ———

  /** Experience gained now, with the cacao circle's blessing. */
  xpBonus(): number { return this.state.cacaoBattles > 0 ? 1 + CACAO_XP : 1; }
  /** Adds experience already multiplied by any bonus; returns the levels gained. */
  private gainXp(hero: Hero, amount: number, mentored = true): number {
    if (hero.level >= MAX_HERO_LEVEL || !(amount > 0)) return 0;
    // Newcomers learn faster from the tribe's veterans: +25% per level beyond the first behind the strongest, up to double.
    const top = Math.max(...this.state.heroes.map(other => other.level));
    const mentoring = mentored ? Math.min(2, 1 + 0.25 * Math.max(0, top - hero.level - 1)) : 1;
    const before = hero.level, next = levelFromTotal(totalXp(hero.level, hero.xp) + amount * mentoring*(1+legacyLevel(this.state,'learning')*.04+memory(this.state,'raizes')*.1));
    hero.level = next.level; hero.xp = next.xp;
    this.awaken(hero);
    return hero.level - before;
  }
  /** Evolution needs both independent tracks and the deep ceremony for the final form. */
  private awaken(hero: Hero): void {
    for (const need of AWAKENING) {
      if (hero.stars >= need.stars || hero.level < need.level || hero.ritualLevel < need.ritualLevel || (need.ayahuasca && !hero.rituals.ayahuasca)) continue;
      hero.stars = need.stars;
      this.report(hero, `despertou ${need.stars}★: experiência e vínculo ritual alcançados.`, true);
    }
  }

  private report(hero: Hero, text: string, ok: boolean): void {
    this.state.reports.push({ clock: this.state.clock, uid: hero.uid, name: characterById(hero.characterId).name, text, ok });
    if (this.state.reports.length > 8) this.state.reports.splice(0, this.state.reports.length - 8);
  }
  private inBattle(hero: Hero): boolean { return this.fighting() && this.battle!.party.includes(hero.uid); }

  private finishRitual(hero: Hero, id: PracticeId, completedAt: number, bonus = 0): void {
    const practice = practiceById(id)!;
    this.state.stats.rituals++;
    hero.rituals[id] = Math.min(practice.max, (hero.rituals[id] ?? 0) + 1);
    Object.assign(hero, ritualFromTotal(ritualTotalXp(hero.ritualLevel, hero.ritualXp) + (RITUAL_XP[id] + bonus)*(1+legacyLevel(this.state,'ceremony')*.04)));
    hero.ritualReadyAt = 0;
    hero.integrationWins = 0;
    this.awaken(hero);
    if (id === 'rape') hero.focus = true;
    if (id === 'sananga') hero.panema = Math.max(0, hero.panema - 1);
    if (id === 'kambo') hero.panema = 0;
    this.report(hero, `concluiu ${practice.name}: +${Math.round((RITUAL_XP[id] + bonus)*(1+legacyLevel(this.state,'ceremony')*.04))} XP ritual. O guardião está pronto para o campo.`, true);
  }

  /** Compatibility entry points refuse retired hunting activities. */
  startHunt(_uid:string,_trail:string):ActionResult { return fail('Caçadas foram retiradas. Expedições concedem XP, âmbar e itens.'); }
  recallHunt(_uid:string):ActionResult { return fail('Não há caçadas em andamento.'); }
  ritualLock(uid:string,id:string):string|null {
    const p=practiceById(id),h=this.state.heroes.find(h=>h.uid===uid);
    if(!p||p.tribe||!h)return 'Escolha uma cerimônia e um guardião.';
    if(this.state.paused||this.fighting())return 'Conduza cerimônias entre os combates, com a jornada em atividade.';
    if(this.state.era<p.era)return `Exige Era ${p.era}.`;
    if(h.level<p.minLevel)return `Exige experiência ${p.minLevel}.`;
    if(p.requires&&!h.rituals[p.requires])return `Conclua ${practiceById(p.requires)!.name} antes.`;
    const cost=ritualCost(p.id,h.rituals[p.id]??0);
    if(this.state.amber<cost)return `Faltam ${cost-this.state.amber} de âmbar.`;
    return null;
  }
  performRitual(uid:string,id:string,quality=0):ActionResult { return this.performActiveRitual(uid,id,quality); }
  performActiveRitual(uid:string,id:string,quality=0):ActionResult {
    const lock=this.ritualLock(uid,id);if(lock)return fail(lock);
    const h=this.state.heroes.find(h=>h.uid===uid)!,p=practiceById(id)!;
    this.state.amber-=ritualCost(p.id,h.rituals[p.id]??0);
    this.finishRitual(h,p.id,this.state.clock,participationBonus(RITUAL_XP[p.id],quality));
    return success(`${p.name} concluído. XP ritual recebido; guardião disponível agora.`);
  }
  claimHeroProof(uid: string, id: string): ActionResult {
    if (this.state.paused || this.fighting()) return fail('Receba a prova entre os combates, com a jornada em atividade.');
    const hero = this.state.heroes.find(h => h.uid === uid), proof = HERO_PROOFS.find(p => p.id === id);
    if (!hero || !proof) return fail('Prova desconhecida.');
    if (hero.mastery.claimed.includes(id)) return fail('Esta prova já foi recebida.');
    if (proof.progress(hero.mastery) < proof.goal) return fail('Conclua o objetivo da prova primeiro.');
    hero.mastery.claimed.push(id);
    this.gainXp(hero, proof.xp);
    return success(`${proof.name}: +${proof.xp} XP para ${characterById(hero.characterId).name}. Nível ${hero.level}.`);
  }
  /** A purchased blessing lasts for three battles, with no wall-clock timer. */
  holdCacaoCircle(quality=0):ActionResult {
    if(this.state.paused||this.fighting())return fail('Reúna a roda entre os combates.');
    if(this.state.era<2)return fail('Exige Era II.');
    if(this.state.cacaoBattles>0)return fail('A bênção de cacau ainda acompanha as próximas batalhas.');
    if(this.state.amber<ritualCost('cacau'))return fail(`São necessários ${ritualCost('cacau')} de âmbar.`);
    this.state.amber-=ritualCost('cacau');this.state.cacaoBattles=3;this.state.cacaoCircles++;this.state.stats.rituals++;
    for(const h of this.state.heroes){
      Object.assign(h,ritualFromTotal(ritualTotalXp(h.ritualLevel,h.ritualXp)+(RITUAL_XP.cacau+participationBonus(RITUAL_XP.cacau,quality))*(1+legacyLevel(this.state,'ceremony')*.04)));
      this.awaken(h);
    }
    return success('XP ritual recebido pela tribo. Cacau acompanha três batalhas.');
  }

  claimQuest(id: string): ActionResult {
    const quest = questById(id);
    if (!quest) return fail('Objetivo desconhecido.');
    if (this.state.quests.includes(id)) return fail('Esta recompensa já foi recebida.');
    if (!quest.done(this.state)) return fail('Este objetivo ainda não foi cumprido.');
    this.state.quests.push(id);
    const reward = quest.reward;
    this.state.journey.knowledge+=reward.knowledge??0;
    for (let i = 0; i < (reward.components ?? 0); i++) this.addItem(this.randomComponent());
    this.state.embers += reward.embers ?? 0;
    return success(`Objetivo cumprido: ${quest.title}.`);
  }

  buyMemory(id: MemoryId): ActionResult {
    const entry = MEMORIES.find(item => item.id === id);
    if (!entry) return fail('Memória desconhecida.');
    const level = memory(this.state, id);
    if (level >= entry.max) return fail('Esta memória já está completa.');
    const cost = memoryCost(entry, level);
    if (this.state.embers < cost) return fail(`São necessárias ${cost} brasas.`);
    this.state.embers -= cost;
    this.state.memories[id] = level + 1;
    return success(`${entry.name} alcançou o nível ${level + 1}.`);
  }

  togglePause(): boolean { this.state.paused = !this.state.paused; return this.state.paused; }

  private blankEntity(character: Character, team: Team, id: string, stars: number): CombatEntity {
    return {
      id, characterId: character.id, team, name: character.name, stars, cost: character.cost, boss: false,
      x: 0, y: 0, hp: character.hp[stars - 1], maxHp: character.hp[stars - 1],
      mana: character.manaStart, manaMax: character.manaMax,
      attack: character.attack[stars - 1], armor: character.armor,
      magicResist: character.magicResist, attackSpeed: character.attackSpeed, range: character.range,
      shield: 0, cooldown: 0, action: 'idle', actionTime: 0,
      stun: 0, slow: 0, haste: 0, guard: 0, poison: 0, poisonDamage: 0, marked: 0, huntMarked: 0,
      empowered: 0, dodge: 0, dotClock: 0, guardBurst: false,
      stealth: 0, taunt: 0, wet: 0, hex: 0, hexDamage: 0, antiheal: 0, transform: 0, stacks: 0, omen: 0,
      reborn: false, shieldBurst: 0, deathBurst: 0, lifetime: 0,
      spellPower: 1, manaRegen: 0, regen: 0, manaRefund: 0, manaDrain: 0, scavenger: false, bonds: [], mods: [],
      items: [], perks: {}, attackCount: 0, prevStun: 0, lowHpShieldUsed: false,
      dealt: 0, taken: 0, healed: 0, shielded: 0, phased: false, level: 1,
    };
  }

  private entity(characterId: number, stars: number, team: Team, index: number, slot: number, level: number, hero?: Hero, isBoss = false, region = 1): CombatEntity {
    const character = characterById(characterId);
    const entity = this.blankEntity(character, team, `${team}-${index}`, stars);
    entity.uid = hero?.uid;
    const cell = team === 'ally' ? allySlotCenter(slot) : enemySlotCenter(slot);
    entity.x = cell.x; entity.y = cell.y;
    entity.cooldown = index * 0.08;
    if (team === 'enemy') {
      const scale = enemyScale(level, character.cost);
      const boss = bossScale(region);
      entity.hp *= scale * (isBoss ? boss.hp : 1); entity.maxHp = entity.hp; entity.attack *= scale * (isBoss ? boss.attack : 1);
      entity.boss = isBoss;
      entity.level = Math.round(expectedLevel(level));
      if (isBoss) { entity.name = `${character.name}, chefe`; entity.armor += 15; entity.magicResist += 15; }
      this.applyTraits(entity,character,this.enemyTraits);
      // Enemies acquire coherent role builds as regions advance.
      if(level>=6){
        const role=roleOf(character),build=role==='front'?['muralha','pele-urso','carapaca']:['caster','support','summon'].includes(role)?['colar-lua','lanca','coroa']:['garra','talisma','tempestade'];
        const count=level>=22?3:level>=14?2:1;
        entity.items=build.slice(0,count);
        for(const id of entity.items){const d=itemById(id)!;entity.attack*=1+(d.stats.attackPct??0);entity.attackSpeed*=1+(d.stats.attackSpeedPct??0);entity.maxHp+=d.stats.hp??0;entity.armor+=d.stats.armor??0;entity.magicResist+=d.stats.magicResist??0;entity.mana+=d.stats.mana??0;entity.manaRegen+=d.stats.manaRegen??0;entity.regen+=d.stats.regen??0;entity.spellPower*=1+(d.stats.spellPower??0);if(d.stats.lifesteal)addMod(entity,'lifesteal',d.stats.lifesteal,Infinity,'enemy-item');Object.assign(entity.perks,d.perks);}
      }
      if(character.traits.includes('Guardião'))entity.shield+=entity.maxHp*traitPower('Guardião',this.enemyTraits.get('Guardião')??0);
      entity.hp=entity.maxHp;entity.mana=Math.min(entity.manaMax,entity.mana);
      return entity;
    }
    this.applyTraits(entity,character,this.traitTiers);
    // Patron spirits of the eras already reached.
    for (const spirit of chosenSpirits(this.state)) {
      const passive = spirit.passive;
      entity.mana += passive.startMana ?? 0;
      if (passive.traits && !character.traits.some(trait => passive.traits!.includes(trait))) continue;
      entity.attack *= 1 + (passive.attackPct ?? 0); entity.maxHp *= 1 + (passive.hpPct ?? 0);
      entity.attackSpeed *= 1 + (passive.attackSpeedPct ?? 0);
      entity.armor += passive.armor ?? 0; entity.magicResist += passive.magicResist ?? 0;
      entity.spellPower *= 1 + (passive.spellPower ?? 0);
      if (passive.damageTaken) addMod(entity, 'damageTaken', passive.damageTaken, Infinity, `espirito-${spirit.id}`);
    }
    const blessing = 1 + 0.06 * memory(this.state, 'bencao');
    entity.maxHp *= blessing; entity.attack *= blessing;
    // Levels and ceremonies.
    if (hero) {
      entity.maxHp *= 1 + .03 * memory(this.state, 'fogueira');
      const growth = levelMultiplier(hero.level), r = hero.rituals;
      entity.maxHp*=1+legacyLevel(this.state,'vigor')*.03;entity.attack*=1+legacyLevel(this.state,'tactics')*.03+legacyLevel(this.state,'tracking')*.02;
      entity.attackSpeed*=1+legacyLevel(this.state,'resolve')*.03;entity.spellPower*=1+legacyLevel(this.state,'insight')*.04;
      entity.magicResist+=legacyLevel(this.state,'ward')*4;entity.mana+=legacyLevel(this.state,'channel')*5;
      for(const id of this.battlePreparations){
        if(id==='feast')entity.maxHp*=1.12;if(id==='warpaint')entity.attack*=1.08;if(id==='incense')entity.mana+=12;
        if(id==='bark')entity.armor+=12;if(id==='amulet')entity.magicResist+=15;if(id==='spring')entity.regen+=.005;
      }
      entity.level = hero.level;
      entity.maxHp *= growth.hp * (1 + RITUAL_EFFECT.kamboHp * (r.kambo ?? 0));
      entity.attack *= growth.attack * (1 + RITUAL_EFFECT.sanangaDamage * (r.sananga ?? 0));
      entity.attackSpeed *= 1 + RITUAL_EFFECT.rapeAttackSpeed * (r.rape ?? 0);
      if (r.ayahuasca) { entity.spellPower *= 1 + RITUAL_EFFECT.ayahuascaSpell; entity.mana += RITUAL_EFFECT.ayahuascaMana; }
    }
    // Items: flat stats first, then perks.
    entity.items = [...(hero?.items ?? [])];
    let hpPct = 0;
    for (const id of entity.items) {
      const definition = itemById(id);
      if (!definition) continue;
      const stats = definition.stats;
      entity.attack *= 1 + (stats.attackPct ?? 0); entity.attackSpeed *= 1 + (stats.attackSpeedPct ?? 0);
      entity.armor += stats.armor ?? 0; entity.magicResist += stats.magicResist ?? 0;
      entity.mana += stats.mana ?? 0; entity.maxHp += stats.hp ?? 0; hpPct += stats.hpPct ?? 0;
      entity.spellPower *= 1 + (stats.spellPower ?? 0); entity.manaRegen += stats.manaRegen ?? 0; entity.regen += stats.regen ?? 0;
      if (stats.lifesteal) addMod(entity, 'lifesteal', stats.lifesteal, Infinity, `item-${id}-${entity.mods.length}`);
      for (const [key, value] of Object.entries(definition.perks ?? {}) as [keyof ItemPerks, number][]) entity.perks[key] = (entity.perks[key] ?? 0) + value;
    }
    // Percent life applies after every flat bonus, whatever the item order.
    entity.maxHp *= 1 + hpPct;
    entity.stealth = Math.max(entity.stealth, entity.perks.startStealth ?? 0);
    entity.taunt = Math.max(entity.taunt, entity.perks.startTaunt ?? 0);
    entity.mana = Math.min(entity.manaMax, entity.mana);

    if(hero)entity.shield+=entity.maxHp*legacyLevel(this.state,'guard')*.03;
    if(character.traits.includes('Guardião'))entity.shield+=entity.maxHp*traitPower('Guardião',this.traitTiers.get('Guardião')??0);
    entity.hp = entity.maxHp;
    return entity;
  }

  private applyTraits(entity:CombatEntity,character:Character,tiers:Map<string,number>):void {
    for (const trait of character.traits) {
      const tier = tiers.get(trait) ?? 0;
      if (!tier) continue;
      entity.bonds.push(trait);
      const power=traitPower(trait,tier);
      switch (trait) {
        case 'Presas': entity.attack *= 1 + power; break;
        case 'Manada': entity.maxHp *= 1 + power; break;
        case 'Rio': entity.magicResist += power; if (tier > 1) entity.regen += tier===3?.025:.015; break;
        case 'Noturno': entity.attackSpeed *= 1 + power; break;
        case 'Enxame': entity.mana += power; if(tier===3)entity.spellPower*=1.35; break;
        case 'Copa': entity.stealth = power; if(tier===3)entity.attack*=1.45; break;
        case 'Escamas': addMod(entity, 'damageTaken', -power, Infinity, 'escamas'); break;
        case 'Ancestral': entity.maxHp *= 1 + power; entity.attack *= 1 + power; break;
        case 'Caçador': entity.attackSpeed *= 1 + power; break;
        case 'Brigão': entity.armor += power; break;
        case 'Espreitador': entity.attack *= 1 + power; break;
        case 'Místico': entity.spellPower *= 1 + power; break;
        case 'Guardião': break; // Final life is known only after growth and equipment.
        case 'Xamã': entity.manaRefund = power; if(tier===3)entity.spellPower*=1.25; break;
        case 'Trapaceiro': entity.manaDrain = power; break;
        case 'Necrófago': entity.scavenger = true; break;
        case 'Totêmico': case 'Invocador': break;
        default: {
          const rule = TRAIT_RULES[trait];
          const bonus = rule.thresholds.length > 1 ? 0.1 * tier : rule.thresholds[0] === 2 ? 0.12 : 0.1;
          entity.maxHp *= 1 + bonus; entity.attack *= 1 + bonus;
        }
      }
    }
    entity.manaRegen+=traitPower('Totêmico',tiers.get('Totêmico')??0);
  }

  /** The stage the next expedition will fight. */
  nextStage(): { stage: Stage; level: number; depth: number } {
    if (this.state.selectedStage === 0) {
      const depth = this.state.endlessBest + 1;
      return { stage: endlessStage(depth), level: endlessLevel(depth), depth };
    }
    const stage = stageById(this.state.selectedStage) ?? stageById(1)!;
    return { stage, level: stage.id, depth: 0 };
  }

  startBattle(): ActionResult {
    if (this.state.paused) return fail('Retome o tempo antes de iniciar a expedição.');
    if (this.battle) return fail('Conclua ou feche a expedição atual.');
    if (!stageUnlocked(this.state, this.state.selectedStage)) return fail('Escolha uma expedição já alcançada no mapa.');
    const { stage, level, depth } = this.nextStage();
    return this.beginBattle(stage, level, depth);
  }

  /** Shared by expeditions, the endless hunt and village raids. */
  private beginBattle(stage: Stage, level: number, depth: number): ActionResult {
    if (this.state.paused) return fail('Retome o tempo antes do combate.');
    const deployed = this.state.heroes.filter(hero => hero.slot !== null);
    if (!deployed.length) return fail('Posicione pelo menos um herói no campo.');
    if (deployed.length > capacity(this.state)) return fail('Há heróis demais na formação.');
    const party = deployed.filter(available);
    if (!party.length) return fail('Os heróis da formação estão fora da aldeia, caçando ou em cerimônia.');
    this.traitTiers = new Map(getSynergies(this.state).filter(synergy => synergy.active).map(synergy => [synergy.name, synergy.tier]));
    this.enemyTraits=new Map([...countTraits(stage.units.map(u=>u.id))].map(([name,count])=>[name,traitStatus(name,count).tier]));
    const spirits = chosenSpirits(this.state);
    this.healBonus = spirits.reduce((sum, spirit) => sum + (spirit.passive.healPower ?? 0), 0) + (this.state.cacaoBattles > 0 ? CACAO_HEAL : 0);
    this.summonBonus = spirits.reduce((sum, spirit) => sum + (spirit.passive.summonPct ?? 0), 0);
    this.battlePreparations=stage.id>=0?this.state.journey.selected.filter(id=>!blessingLock(this.state,id)):[];
    const allies = party.map((hero, index) => this.entity(hero.characterId, hero.stars, 'ally', index, hero.slot!, 0, hero));
    for (const ally of allies) {
      if (!ally.perks.teamShield) continue;
      for (const other of allies.filter(other => distance(other, ally) <= 1.1)) other.shield += ally.maxHp * ally.perks.teamShield;
    }
    const slots = enemyFormation(stage.units.map(unit => characterById(unit.id).range > 1));
    const enemies = stage.units.map((unit, index) => this.entity(unit.id, unit.stars, 'enemy', index, slots[index], level, undefined, !!unit.boss, stage.region));
    this.events = [];
    this.summonCounter = 0;
    this.windups.clear();this.projectiles=[];
    const firstClear = stage.id > 0 && stage.id > this.state.progress;
    this.battleSkillUsers.clear();
    this.battle = { entities: [...allies, ...enemies], zones: [], time: 0, stage: stage.id, depth, region: stage.id ? stage.region : 6, name: stage.name, status: 'fighting', loot: [], firstClear, prey: {}, lastCast: {}, powersUsed: [], preparations:[...this.battlePreparations],party: party.map(hero => hero.uid), xp: 0, amber: 0, levelUps: [] };
    if (stage.id < 0) this.battle.region = stage.region;
    this.state.journey.selected=this.state.journey.selected.filter(id=>!blessingLock(this.state,id));
    return success(`${stage.name}: a caçada começou.`);
  }

  dismissBattle(): ActionResult {
    if (this.fighting()) return fail('A expedição ainda está em andamento.');
    this.battle = null;
    this.events = [];
    return success('De volta à aldeia.');
  }

  /** Calls a patron spirit's power, once per expedition. */
  usePower(id: SpiritId): ActionResult {
    const battle = this.battle;
    if (!battle || battle.status !== 'fighting') return fail('Os poderes espirituais só respondem durante uma expedição.');
    if (this.state.paused) return fail('Retome o tempo para invocar os espíritos.');
    const spirit = spiritById(id);
    if (!spirit || !this.state.spirits.includes(id)) return fail('Este espírito ainda não protege a tribo.');
    if (battle.powersUsed.includes(id)) return fail(`${spirit.power.name} já foi usado nesta expedição.`);
    battle.powersUsed.push(id);
    this.state.stats.powers++;
    const allies = this.living('ally').filter(entity => !entity.summon);
    const enemies = this.living('enemy');
    const caster = allies[0] ?? battle.entities.find(entity => entity.team === 'ally')!;
    this.emit('power', caster, caster, undefined, `${spirit.name}: ${spirit.power.name}`);
    switch (id) {
      case 'lobo': for (const ally of this.living('ally')) { addMod(ally, 'attackSpeed', 0.4, 6, 'poder-lobo'); addMod(ally, 'attack', 0.2, 6, 'poder-lobo-ataque'); } break;
      case 'cervo': for (const ally of this.living('ally')) { ally.poison = 0; this.heal(caster, ally, ally.maxHp * 0.35); } break;
      case 'corvo': for (const enemy of enemies) { this.damage(caster, enemy, enemy.maxHp * 0.1, true, true); addMod(enemy, 'armor', -20, 8, 'poder-corvo'); } break;
      case 'serpente': for (const enemy of enemies) { enemy.poison = 6; enemy.poisonDamage = enemy.maxHp * 0.04; } break;
      case 'coruja': for (const enemy of enemies) { enemy.mana = 0; enemy.slow = Math.max(enemy.slow, 5); } break;
      case 'gorila': for (const enemy of enemies) enemy.stun = Math.max(enemy.stun, 1.75); break;
      case 'crocodilo': {
        const prey = [...enemies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        for (const enemy of enemies) {
          enemy.wet = Math.max(enemy.wet, 6);
          if (enemy === prey && enemy.hp / enemy.maxHp < 0.4) this.damage(caster, enemy, enemy.hp + enemy.shield + 1, false, true);
          else this.damage(caster, enemy, enemy.maxHp * 0.12, true, true);
        }
        break;
      }
      case 'elefante': for (const ally of this.living('ally')) this.giveShield(caster, ally, ally.maxHp * 0.3); break;
      case 'aguia': for (const enemy of enemies) { enemy.marked = Math.max(enemy.marked, 10); enemy.stealth = 0; } break;
      case 'urso':
        for (const fallen of battle.entities.filter(entity => entity.team === 'ally' && entity.hp <= 0 && !entity.summon)) {
          fallen.hp = fallen.maxHp * 0.35; fallen.action = 'idle'; fallen.stun = 0; fallen.poison = 0; fallen.mods = fallen.mods.filter(mod => mod.time === Infinity);
          this.emit('revive', fallen, fallen, undefined, 'Despertar do Inverno');
        }
        break;
      case 'jaguar': for (const ally of this.living('ally')) { ally.stealth = Math.max(ally.stealth, 2.5); addMod(ally, 'attack', 0.5, 6, 'poder-jaguar'); } break;
      case 'aranha': for (const enemy of enemies) { enemy.stun = Math.max(enemy.stun, 1); enemy.slow = Math.max(enemy.slow, 6); } break;
    }
    return success(`${spirit.power.name}!`);
  }

  /** Call each frame with elapsed simulation seconds. One call is capped at 60 s. */
  tick(dtSeconds: number): void {
    if (this.state.paused || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return;
    const dt = Math.min(60, dtSeconds);
    this.produce(dt);
    this.advanceBattle(dt);
  }

  /** Extra combat time for the speed control; the economy keeps its own clock. */
  advanceBattle(dtSeconds: number): void {
    if (this.state.paused || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return;
    let remaining = Math.min(60, dtSeconds);
    while (remaining > 0.000001 && this.fighting()) {
      const step = Math.min(0.05, remaining);
      this.combatStep(step);
      remaining -= step;
    }
  }

  private living(team: Team): CombatEntity[] { return this.battle!.entities.filter(entity => entity.team === team && entity.hp > 0); }
  private opponents(entity: CombatEntity): CombatEntity[] { return this.living(entity.team === 'ally' ? 'enemy' : 'ally'); }
  private emit(type: CombatEvent['type'], source: CombatEntity, target?: CombatEntity, amount?: number, text?: string): void {
    this.events.push({ id: ++this.eventCounter, type, sourceId: source.id, targetId: target?.id, amount, text, x: (target ?? source).x, y: (target ?? source).y, sourceX:source.x,sourceY:source.y,time: this.battle!.time });
  }

  private insideZone(entity: CombatEntity, zone: CombatZone): boolean { return distance(entity, zone) <= zone.radius; }
  /** Summons and echoes credit their summoner in the battle summary. */
  private creditOf(entity: CombatEntity): CombatEntity {
    return entity.ownerId ? this.battle!.entities.find(other => other.id === entity.ownerId) ?? entity : entity;
  }

  private damage(source: CombatEntity, target: CombatEntity, raw: number, magic = false, trueDamage = false): number {
    if (target.hp <= 0 || target.dodge > 0 || !(raw > 0)) return 0;
    const resist = trueDamage ? 0 : Math.max(0, magic ? effectiveMagicResist(target) : effectiveArmor(target));
    let multiplier = 100 / (100 + resist) * (target.guard > 0 ? 0.45 : 1) * (target.marked > 0 ? 1.2 : 1);
    multiplier *= Math.max(0.2, 1 + modTotal(target, 'damageTaken')) * overtimeDamage(this.battle!.time);
    if (target.wet > 0) multiplier *= 1 + modTotal(source, 'wetBonus');
    for (const zone of this.battle!.zones) if (zone.protect && zone.team === target.team && this.insideZone(target, zone)) multiplier *= 1 - zone.protect;
    const damage = raw * multiplier;
    const hadShield = target.shield > 0;
    const absorbed = Math.min(target.shield, damage);
    target.shield -= absorbed;
    if (hadShield && target.shield <= 0.01 && target.shieldBurst > 0) {
      const burst = target.shieldBurst;
      target.shield = 0; target.shieldBurst = 0;
      this.emit('skill', target, target, undefined, 'Carapaça explode');
      for (const enemy of this.opponents(target).filter(enemy => distance(target, enemy) <= 1.6)) this.damage(target, enemy, burst, true);
    }
    const dealt = Math.min(target.hp, damage - absorbed);
    target.hp = Math.max(0, target.hp - dealt);
    target.taken += dealt + absorbed;
    if (source !== target) this.creditOf(source).dealt += dealt + absorbed;
    target.mana = Math.min(target.manaMax, target.mana + 5);
    this.emit('damage', source, target, Math.round(dealt));
    Object.assign(this.events[this.events.length-1],{school:trueDamage?'true':magic?'magic':'physical',absorbed:Math.round(absorbed)});
    const lifesteal = source !== target ? modTotal(source, 'lifesteal') : 0;
    if (lifesteal > 0 && dealt > 0) this.heal(source, source, dealt * lifesteal);
    if (!magic && source !== target && target.perks.thorns && source.hp > 0 && damage > 0) this.damage(target, source, damage * target.perks.thorns, true);
    if (target.hp > 0 && target.perks.lowHpShield && !target.lowHpShieldUsed && target.hp / target.maxHp < 0.4) {
      target.lowHpShieldUsed = true; this.giveShield(target, target, target.maxHp * target.perks.lowHpShield);
    }
    if (target.boss && !target.phased && target.hp > 0 && target.hp <= target.maxHp * 0.5) this.bossPhase(target);
    if (target.hp <= 0) this.handleDeath(target, source);
    return dealt;
  }

  /** Each campaign boss answers half its life with its own mechanic; endless alphas grow furious. */
  private bossPhase(boss: CombatEntity): void {
    boss.phased = true;
    const foes = this.opponents(boss), api = this.api(), power = effectiveAttack(boss) * boss.spellPower;
    const announce = (name: string) => this.emit('phase', boss, boss, undefined, name);
    const center = (list: CombatEntity[]) => [...list].sort((a, b) => list.filter(o => distance(o, b) <= 1.5).length - list.filter(o => distance(o, a) <= 1.5).length)[0];
    switch (this.battle!.stage ? boss.characterId : 0) {
      case 1:
        announce('Uivo do Alfa');
        for (let i = 0; i < 2; i++) this.summon(boss, 'wolf', { hp: boss.maxHp * 0.18, attack: boss.attack * 0.45, range: 1, lifetime: 20, attackSpeed: 0.9 });
        for (const ally of this.living(boss.team)) addMod(ally, 'attackSpeed', 0.3, 8, 'uivo-alfa');
        break;
      case 17:
        announce('Mergulho no Delta');
        boss.stealth = 1.5; this.heal(boss, boss, boss.maxHp * 0.25);
        api.addZone({ kind: 'water', team: boss.team, sourceId: boss.id, followId: boss.id, x: boss.x, y: boss.y, radius: 1.8, time: 8, ownerHeal: 0.03, slow: true, wet: true });
        break;
      case 29: {
        announce('Coro dos Ecos');
        const choir = this.living(boss.team).filter(ally => ally !== boss && !ally.summon).slice(0, 2);
        for (const ally of choir) { const target = this.chooseTarget(boss); if (target) castAbility(api, ally.characterId, boss, target, power * 0.8); }
        boss.mana = Math.min(boss.manaMax, boss.mana + 60);
        break;
      }
      case 48: {
        announce('Fúria da Manada');
        addMod(boss, 'attackSpeed', 0.5, Infinity, 'furia-manada'); addMod(boss, 'attack', 0.3, Infinity, 'furia-manada-ataque');
        const target = this.chooseTarget(boss);
        if (target) castAbility(api, 48, boss, target, power);
        break;
      }
      case 55: {
        announce('Fome Abissal');
        const focus = center(foes);
        if (focus) { boss.x = focus.x; boss.y = focus.y - (boss.team === 'ally' ? -0.7 : 0.7); clampToBoard(boss); }
        boss.transform = 3;
        for (const foe of foes.filter(foe => focus && distance(foe, focus) <= 1.6)) { this.damage(boss, foe, foe.maxHp * 0.2, false, true); foe.stun = Math.max(foe.stun, 1); foe.wet = Math.max(foe.wet, 5); }
        this.giveShield(boss, boss, boss.maxHp * 0.25);
        break;
      }
      case 49:
        announce('Nevasca Eterna');
        api.addZone({ kind: 'frost', team: boss.team, sourceId: boss.id, x: BOARD_CENTER.x, y: BOARD_CENTER.y, radius: 4.5, time: 12, dps: power * 0.35, slow: true });
        { const target = this.chooseTarget(boss); if (target) castAbility(api, 49, boss, target, power); }
        break;
      default:
        announce('Fúria do Alfa');
        addMod(boss, 'attackSpeed', 0.4, Infinity, 'furia-alfa'); addMod(boss, 'attack', 0.2, Infinity, 'furia-alfa-ataque');
        this.giveShield(boss, boss, boss.maxHp * 0.2);
    }
  }

  private handleDeath(target: CombatEntity, killer: CombatEntity): void {
    if (target.characterId === 53 && !target.reborn && !target.summon) {
      // Ssar'ka sheds the dying skin and returns in a stronger form, once per battle.
      target.reborn = true;
      target.hp = target.maxHp * [0.6, 0.7, 0.85][target.stars - 1];
      target.stun = 0; target.slow = 0; target.poison = 0; target.hex = 0;
      target.transform = Infinity;
      addMod(target, 'attack', 0.4, Infinity, 'renascida'); addMod(target, 'attackSpeed', 0.3, Infinity, 'renascida-as');
      target.mana = target.manaMax;
      this.emit('revive', target, target, undefined, 'Pele Sem Fim');
      return;
    }
    target.action = 'dead';
    this.emit('death', killer, target);
    if (target.deathBurst > 0) {
      const burst = target.deathBurst; target.deathBurst = 0;
      for (const enemy of this.opponents(target).filter(enemy => distance(target, enemy) <= 1.3)) this.damage(target, enemy, burst, true);
    }
    if (target.summon) return;
    if (killer !== target && killer.hp > 0 && killer.perks.healOnKill) this.heal(killer, killer, killer.maxHp * killer.perks.healOnKill);
    for (const entity of this.battle!.entities) {
      if (entity.hp <= 0) continue;
      if (entity.characterId === 33 && !entity.summon) entity.stacks = Math.min(12, entity.stacks + 1);
      if (entity.team !== target.team) {
        if (entity.omen > 0) for (const ally of this.living(entity.team)) ally.mana = Math.min(ally.manaMax, ally.mana + 10);
        if (entity.scavenger) { entity.attack *= 1.05; this.heal(entity, entity, entity.maxHp * 0.1); }
      }
    }
  }
  private heal(source: CombatEntity, target: CombatEntity, amount: number): void {
    if (target.hp <= 0) return;
    const boost = source.team === 'ally' ? 1 + this.healBonus : 1;
    const healed = Math.min(amount * boost * (target.antiheal > 0 ? 0.5 : 1) * overtimeHealing(this.battle!.time), target.maxHp - target.hp);
    target.hp += healed;
    if (healed > 0) { this.creditOf(source).healed += healed; this.emit('heal', source, target, Math.round(healed)); }
  }
  private giveShield(source: CombatEntity, target: CombatEntity, amount: number): void {
    if (target.hp <= 0 || !(amount > 0)) return;
    const value = amount * (source.team === 'ally' ? 1 + this.healBonus : 1) * overtimeHealing(this.battle!.time);
    target.shield += value;
    this.creditOf(source).shielded += value;
    this.emit('shield', source, target, Math.round(value));
  }

  private summon(owner: CombatEntity, kind: SummonKind, spec: SummonSpec): CombatEntity | null {
    const battle = this.battle!;
    if (battle.entities.filter(entity => entity.ownerId === owner.id && entity.hp > 0).length >= MAX_SUMMONS_PER_OWNER) return null;
    const character = characterById(spec.characterId ?? owner.characterId);
    const entity = this.blankEntity(character, owner.team, `${owner.team}-s${++this.summonCounter}`, spec.stars ?? owner.stars);
    const boost=(1+traitPower('Invocador',(owner.team==='ally'?this.traitTiers:this.enemyTraits).get('Invocador')??0))*(owner.team==='ally'?1+this.summonBonus:1);
    const index = this.summonCounter;
    entity.summon = kind; entity.ownerId = owner.id;
    entity.name = kind === 'echo' ? `Eco de ${character.name}` : { spider: 'Cria de seda', crow: 'Corvo', beetle: 'Escaravelho', elephant: 'Espírito do marfim', wolf: 'Lobo cinzento' }[kind];
    entity.hp = entity.maxHp = spec.hp * boost;
    entity.attack = spec.attack * boost;
    entity.armor = owner.armor * 0.6; entity.magicResist = owner.magicResist * 0.6;
    entity.attackSpeed = spec.attackSpeed ?? 0.8; entity.range = spec.range;
    entity.mana = 0; entity.manaMax = 0;
    entity.lifetime = spec.lifetime; entity.taunt = spec.taunt ?? 0; entity.deathBurst = (spec.deathBurst ?? 0) * boost;
    entity.cooldown = 0.2;
    entity.x = (spec.x ?? owner.x) + [-0.45, 0.45, 0, -0.3, 0.3, 0][index % 6];
    entity.y = (spec.y ?? owner.y) + (owner.team === 'ally' ? -0.4 : 0.4) + [0, 0, -0.3, 0.3, 0.3, -0.3][index % 6];
    clampToBoard(entity);
    battle.entities.push(entity);
    this.emit('summon', owner, entity, undefined, entity.name);
    return entity;
  }

  private api(): CombatApi {
    return {
      battle: this.battle!,
      enemiesOf: entity => this.opponents(entity),
      targetableEnemiesOf: entity => this.targetable(entity),
      alliesOf: entity => this.living(entity.team),
      fallen: team => this.battle!.entities.filter(entity => entity.team === team && entity.hp <= 0 && !entity.summon),
      damage: (source, target, raw, magic, trueDamage) => this.damage(source, target, raw, magic, trueDamage),
      heal: (source, target, amount) => this.heal(source, target, amount),
      shield: (source, target, amount) => this.giveShield(source, target, amount),
      emit: (type, source, target, amount, text) => this.emit(type, source, target, amount, text),
      summon: (owner, kind, spec) => this.summon(owner, kind, spec),
      addZone: zone => { this.battle!.zones.push({ ...zone, id: ++this.zoneCounter, pulse: 0, duration: zone.time }); },
      cast: (abilityId, source, target, power) => castAbility(this.api(), abilityId, source, target, power),
    };
  }

  private cast(source: CombatEntity, target: CombatEntity): void {
    const battle = this.battle!;
    source.mana = 0;
    if (source.uid) this.battleSkillUsers.add(source.uid);
    source.action = 'cast'; source.actionTime = 0.26; source.cooldown = Math.max(source.cooldown, 0.26);
    this.emit('skill', source, target, undefined, characterById(source.characterId).ability.name);
    castAbility(this.api(), source.characterId, source, target, effectiveAttack(source) * source.spellPower);
    if (source.characterId !== 29) battle.lastCast[source.team] = source.characterId;
    source.mana = Math.min(source.manaMax, source.mana + source.manaMax * source.manaRefund + (source.perks.manaAfterCast ?? 0));
    if (source.perks.healAllyOnCast) {
      const wounded = this.living(source.team).filter(ally => !ally.summon).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (wounded) this.heal(source, wounded, wounded.maxHp * source.perks.healAllyOnCast);
    }
    if (source.hex > 0 && source.hp > 0) {
      // Veyra's night punishes every enemy spell.
      this.damage(source, source, source.hexDamage, true);
      source.stun = Math.max(source.stun, 1);
    }
  }

  private targetable(entity: CombatEntity): CombatEntity[] { return this.opponents(entity).filter(other => other.stealth <= 0); }

  private chooseTarget(entity: CombatEntity): CombatEntity | undefined {
    const candidates = this.targetable(entity);
    if (!candidates.length) return undefined;
    const prey = this.battle!.prey[entity.team];
    if (prey && prey.time > 0) {
      const marked = candidates.find(other => other.id === prey.id);
      if (marked) return marked;
    }
    const byDistance = (a: CombatEntity, b: CombatEntity) => distance(entity, a) - distance(entity, b);
    const taunting = candidates.filter(other => other.taunt > 0 && distance(entity, other) <= 3);
    return (taunting.length ? taunting : candidates).sort(byDistance)[0];
  }

  private processZones(dt: number): void {
    const battle = this.battle!;
    for (const zone of battle.zones) {
      zone.time -= dt;
      const owner = battle.entities.find(entity => entity.id === zone.sourceId);
      if (zone.followId) {
        const follower = battle.entities.find(entity => entity.id === zone.followId);
        if (!follower || follower.hp <= 0) { zone.time = 0; continue; }
        zone.x = follower.x; zone.y = follower.y;
      }
      zone.pulse += dt;
      while (zone.pulse >= 0.5 && zone.time > 0) {
        zone.pulse -= 0.5;
        for (const entity of battle.entities.filter(other => other.hp > 0 && this.insideZone(other, zone))) {
          if (entity.team !== zone.team) {
            if (zone.slow) entity.slow = Math.max(entity.slow, 0.6);
            if (zone.wet) entity.wet = Math.max(entity.wet, 1.5);
            if (zone.dps && owner) this.damage(owner, entity, zone.dps * 0.5, true);
          } else {
            if (zone.allyHeal && owner) this.heal(owner, entity, entity.maxHp * zone.allyHeal * 0.5);
            if (entity.id === zone.sourceId) {
              if (zone.ownerHeal) this.heal(entity, entity, entity.maxHp * zone.ownerHeal * 0.5);
              if (zone.ownerAttack) addMod(entity, 'attack', zone.ownerAttack, 0.6, `zone-${zone.id}-attack`);
              if (zone.ownerArmor) addMod(entity, 'armor', zone.ownerArmor, 0.6, `zone-${zone.id}-armor`);
            }
          }
        }
      }
    }
    battle.zones = battle.zones.filter(zone => zone.time > 0);
  }

  private basicAttack(entity: CombatEntity, target: CombatEntity): void {
    const timing=attackTiming(entity.range,attackRate(entity),distance(entity,target));
    entity.action = 'attack'; entity.actionTime = timing.recovery;
    if (target.huntMarked > 0) entity.haste = Math.max(entity.haste, 1.5);
    entity.attackCount++;
    const perks = entity.perks;
    if (perks.asStack) addMod(entity, 'attackSpeed', perks.asStack * Math.min(10, entity.attackCount), Infinity, 'garra');
    this.emit('attack', entity, target);
    this.events[this.events.length-1].duration=timing.flight;
    const third = entity.attackCount % 3 === 0;
    const power = effectiveAttack(entity);
    if(timing.flight){this.projectiles.push({source:entity,target,remaining:timing.flight,power,third});return;}
    this.attackImpact(entity,target,power,third);
  }

  private attackImpact(entity:CombatEntity,target:CombatEntity,power:number,third:boolean):void {
    if(target.hp<=0)return;
    const perks=entity.perks;
    this.damage(entity, target, power * (third && perks.crit3 ? 1 + perks.crit3 : 1));
    const cleave = modTotal(entity, 'cleave');
    if (cleave > 0) for (const other of this.opponents(entity).filter(other => other !== target && distance(other, target) <= 1.3)) this.damage(entity, other, power * cleave);
    if (third && perks.chain3) for (const other of this.opponents(entity).filter(other => other !== target).sort((a, b) => distance(a, target) - distance(b, target)).slice(0, 2)) this.damage(entity, other, power * perks.chain3, true);
    if (perks.shred) target.magicResist = Math.max(0, target.magicResist - perks.shred);
    if (perks.healOnHit) this.heal(entity, entity, entity.maxHp * perks.healOnHit);
    if (entity.manaMax > 0) entity.mana = Math.min(entity.manaMax, entity.mana + 12 + (perks.manaOnHit ?? 0));
    if (entity.manaDrain > 0) target.mana = Math.max(0, target.mana - entity.manaDrain);
    if (entity.empowered > 0) { target.poison = 4; target.poisonDamage = power * 0.45; }
  }

  private prepareAction(entity:CombatEntity,target:CombatEntity,kind:'attack'|'cast'):void {
    const duration=kind==='cast'?castWindup(entity.characterId):attackTiming(entity.range,attackRate(entity),distance(entity,target)).windup;
    entity.action=kind==='cast'?'cast':'attack';entity.actionTime=duration;
    if(kind==='attack')entity.cooldown=1/attackRate(entity);
    this.windups.set(entity.id,{kind,targetId:target.id,remaining:duration});
    this.emit('prepare',entity,target,undefined,kind);this.events[this.events.length-1].duration=duration;
  }

  private combatStep(dt: number): void {
    const battle = this.battle!;
    const wasTwilight = battle.time >= OVERTIME_START;
    battle.time += dt;
    if (!wasTwilight && battle.time >= OVERTIME_START) { const first = battle.entities.find(entity => entity.hp > 0); if (first) this.emit('overtime', first, undefined, undefined, 'Crepúsculo'); }
    this.events = this.events.filter(event => battle.time - event.time < 2);
    for (const team of ['ally', 'enemy'] as const) {
      const prey = battle.prey[team];
      if (prey) { prey.time -= dt; if (prey.time <= 0) delete battle.prey[team]; }
    }
    this.processZones(dt);
    const flying=this.projectiles;this.projectiles=[];
    for(const shot of flying){shot.remaining-=dt;if(shot.remaining<=.000001)this.attackImpact(shot.source,shot.target,shot.power,shot.third);else this.projectiles.push(shot);}
    for (const entity of [...battle.entities]) {
      if (entity.hp <= 0) {this.windups.delete(entity.id);continue;}
      // Item protection against crowd control cancels a freshly applied stun.
      if (entity.stun > entity.prevStun + 0.01 && (entity.perks.ccShield ?? 0) > 0) { entity.stun = entity.prevStun; entity.perks.ccShield!--; }
      const wasGuarded = entity.guard > 0;
      const wasPoisoned = entity.poison > 0;
      for (const key of ['stun', 'slow', 'haste', 'guard', 'poison', 'marked', 'huntMarked', 'empowered', 'dodge', 'actionTime', 'cooldown', 'stealth', 'taunt', 'wet', 'hex', 'antiheal', 'transform', 'omen'] as const) entity[key] = Math.max(0, entity[key] - dt);
      entity.prevStun = entity.stun;
      if (entity.mods.length) {
        for (const mod of entity.mods) mod.time -= dt;
        entity.mods = entity.mods.filter(mod => mod.time > 0);
      }
      if (entity.summon) {
        entity.lifetime -= dt;
        if (entity.lifetime <= 0) { entity.hp = 0; this.handleDeath(entity, entity); continue; }
      }
      if (wasGuarded && entity.guard === 0 && entity.guardBurst) {
        entity.guardBurst = false;
        for (const enemy of this.opponents(entity).filter(enemy => distance(entity, enemy) <= 2)) this.damage(entity, enemy, effectiveAttack(entity) * 2, true);
      }
      if (wasPoisoned) {
        entity.dotClock += dt;
        if (entity.dotClock >= 1) { entity.dotClock -= 1; this.damage(entity, entity, entity.poisonDamage, true); }
      } else entity.dotClock = 0;
      if (entity.hp <= 0) continue;
      if (entity.regen > 0) entity.hp = Math.min(entity.maxHp, entity.hp + entity.maxHp * entity.regen * dt * (entity.antiheal > 0 ? 0.5 : 1) * overtimeHealing(battle.time));
      if (entity.manaRegen > 0 && entity.manaMax > 0) entity.mana = Math.min(entity.manaMax, entity.mana + entity.manaRegen * dt);
      if (entity.stun > 0 && !(entity.characterId === 4 && entity.mana >= entity.manaMax)) { this.windups.delete(entity.id);entity.action = 'idle'; continue; }
      const winding=this.windups.get(entity.id);
      if(winding){
        winding.remaining-=dt;
        if(winding.remaining<=.000001){
          this.windups.delete(entity.id);
          const target=battle.entities.find(e=>e.id===winding.targetId&&e.hp>0&&e.stealth<=0)??this.chooseTarget(entity);
          if(target){if(winding.kind==='cast')this.cast(entity,target);else if(distance(entity,target)<=entity.range+.65)this.basicAttack(entity,target);}
        }
        continue;
      }
      const target = this.chooseTarget(entity);
      if (!target) { if (!this.opponents(entity).length) break; entity.action = 'idle'; continue; }
      if (entity.actionTime > 0) continue;
      if (entity.mana >= entity.manaMax && entity.manaMax > 0) { this.prepareAction(entity, target,'cast'); continue; }
      const gap = distance(entity, target);
      if (gap > entity.range + 0.15) {
        const step = Math.min(gap - entity.range, dt * 1.5);
        entity.x += (target.x - entity.x) / gap * step;
        entity.y += (target.y - entity.y) / gap * step;
        entity.action = 'walk';
      } else if (entity.cooldown <= 0) this.prepareAction(entity, target,'attack');
      else entity.action = 'idle';
    }
    const standing = (team: Team) => this.living(team).some(entity => !entity.summon);
    if (!standing('enemy')) this.finishBattle(true);
    else if (!standing('ally') || battle.time >= 150) this.finishBattle(false);
  }

  private finishBattle(victory: boolean): void {
    const battle = this.battle!;
    if (battle.status !== 'fighting') return;
    battle.status = victory ? 'victory' : 'defeat';
    this.windups.clear();this.projectiles=[];
    battle.zones = [];
    for (const entity of battle.entities) if (entity.summon && entity.hp > 0) { entity.hp = 0; entity.action = 'dead'; }
    // Everyone who marched learns from the fight, a little even in defeat.
    const xpLevel = battle.stage < 0 ? Math.max(2, this.state.progress * 0.85) : battle.stage === 0 ? endlessLevel(battle.depth) : battle.stage;
    battle.xp = Math.round(battleXp(xpLevel, victory, battle.entities.some(entity => entity.boss), battle.firstClear) * this.xpBonus());
    for (const uid of battle.party) {
      const hero = this.state.heroes.find(entry => entry.uid === uid);
      if (hero && victory) {
        const mastery = hero.mastery;
        mastery.wins++;
        if (battle.stage > 0 && !mastery.stages.includes(battle.stage)) mastery.stages.push(battle.stage);
        if (this.battleSkillUsers.has(uid)) mastery.skillWins++;
        if (hero.items.length) mastery.equippedWins++;
        if (battle.entities.some(e => e.boss)) mastery.bossWins++;
        if (getSynergies(this.state).some(s => s.active && characterById(hero.characterId).traits.includes(s.name))) mastery.linkedWins++;

      }
      if (hero && this.gainXp(hero, battle.xp)) battle.levelUps.push(`${characterById(hero.characterId).name} · nível ${hero.level}`);
    }
    battle.amber=Math.round(battleAmber(xpLevel,victory,battle.firstClear,battle.entities.some(e=>e.boss))*(1+legacyLevel(this.state,'roots')*.04));
    this.state.amber=Math.min(1e9,this.state.amber+battle.amber);
    if(this.state.cacaoBattles>0)this.state.cacaoBattles--;
    if (!victory) return;
    this.state.stats.victories++;
    const endless = battle.stage === 0;
    const drops = endless ? (battle.depth % 5 === 0 ? 2 : 1) : battle.firstClear ? (stageById(battle.stage)!.index === 5 ? 2 : 1) : this.random() < 0.35+memory(this.state,'botim')*.05+legacyLevel(this.state,'forge')*.02 ? 1 : 0;
    for (let i = 0; i < drops; i++) { const id = this.randomComponent(); if (this.addItem(id)) battle.loot.push(id); }
    if (endless) {
      this.state.endlessBest = Math.max(this.state.endlessBest, battle.depth);
      this.state.endlessRecord = Math.max(this.state.endlessRecord, this.state.endlessBest);
    } else if (battle.firstClear) {
      this.state.progress = Math.max(this.state.progress, battle.stage);
      // Move on to the next stage when it is open; otherwise keep farming the current one.
      if (stageUnlocked(this.state, battle.stage + 1) && !this.state.settings.autoRepeat) this.state.selectedStage = battle.stage + 1;
    }
  }
}
