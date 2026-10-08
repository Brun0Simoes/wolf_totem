import { characters, type Character } from '../data/characters';
import { attackTiming, castWindup } from './combatTiming';
import { participationBonus } from './ritualPlay';
import { recommendedParty, roleOf } from './armyAdvisor';
import { SETTLEMENT_MILESTONES } from './settlement';
import { builderCount, constructionCount, INFRASTRUCTURE, initialSettlement, orderTitle, populationCap, raidProtection, RESEARCH, researchCost, sanitizeSettlement, settlementRates, territoryById, territoryLock, trainingCost, villagePlots, type CitizenJob, type InfrastructureId, type ResearchId, type Settlement, type VillageOrder } from './settlement';
import { ALL_CHARACTER_IDS, nextRandom, recruitPrice, rollVisitor, sellRefund, unlockedCost } from './roster';
import { bossScale, endlessLevel, endlessStage, enemyScale, expectedLevel, FINAL_STAGE, regionOf, stageById, stageReward, type Stage } from './campaign';
import { COMPONENT_IDS, isComponent, itemById, MAX_ITEMS_PER_HERO, recipeFor, type ItemPerks } from './items';
import { castAbility, SKILL_NOTES } from './skills';
import { MEMORIES, memoryCost, spiritById, spiritsOfEra, type MemoryId, type SpiritId } from './spirits';
import { countTraits, TRAIT_RULES, traitStatus } from './synergies';
import { questById } from './quests';
import { allySlotCenter, BOARD_CENTER, clampX, clampY, enemyFormation, enemySlotCenter, FORMATION_SLOTS, migrateSlot } from './board';
import { AWAKENING, ERA_GROWTH, MAX_RITUAL_LEVEL, ritualFromTotal, ritualTotalXp, ritualXpToNext, RITUAL_COOLDOWN, RITUAL_XP, WORK_XP_PER_MINUTE, battleXp, CACAO_DURATION, CACAO_HEAL, CACAO_XP, FOCUS_BONUS, huntChance, huntSlots, levelFromTotal, levelMultiplier, MAX_HERO_LEVEL, MAX_PANEMA, PANEMA_XP_LOSS, practiceById, PRACTICES, RITUAL_EFFECT, totalXp, trailById, xpToNext, type PracticeId, type TrailId } from './tribe';
import { EVENT_TEXT, FIRST_EVENT_AT, nextEventDelay, OMEN_BONUS, OMEN_DURATION, RAID_PENALTY, raidStage, rollEvent, TRIBUTE, type VillageEvent } from './events';

export { SKILL_NOTES, FINAL_STAGE };

/** Pure, deterministic simulation. All times are seconds and positions use board cells. */
export type Resource = 'wood' | 'food' | 'stone' | 'spirit';
export type Resources = Record<Resource, number>;
export type BuildingId = 'lumber' | 'hunt' | 'quarry' | 'shrine' | 'forge' | 'cura';
export type Team = 'ally' | 'enemy';
/** Away on a hunt or in a ceremony until the village clock reaches `until`; the hero keeps its place in the formation. */
export interface HeroAway { kind: 'hunt' | 'ritual'; id: TrailId | PracticeId; until: number; focus?: boolean; returnWork?: BuildingId; participationXp?: number }
export interface Hero {
  uid: string; characterId: number; stars: number; slot: number | null; items: string[]; work: BuildingId | null;
  level: number; xp: number; ritualLevel: number; ritualXp: number; ritualReadyAt: number;
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
  settlement: Settlement;
  resources: Resources;
  villageLevel: number;
  buildings: Record<BuildingId, number>;
  heroes: Hero[];
  shop: number[];
  shopSeed: number;
  /** Number of campaign stages cleared, in order (0–30). */
  progress: number;
  /** Stage chosen for the next expedition; 0 is the endless hunt. */
  selectedStage: number;
  endlessBest: number;
  endlessRecord: number;
  inventory: string[];
  lootSeed: number;
  forgeProgress: number;
  spirits: SpiritId[];
  wonder: number;
  embers: number;
  memories: Partial<Record<MemoryId, number>>;
  rebirths: number;
  settings: { speed: number; autoRepeat: boolean };
  /** Claimed journal objectives (kept through rebirths) and the counters they read. */
  quests: string[];
  stats: { recruits: number; powers: number; victories: number; hunts: number; rituals: number };
  /** The cacao circle's blessing lasts until this village time. */
  cacao: number;
  /** Latest hunt and ceremony results, newest last. */
  reports: HuntReport[];
  /** Seconds of village time, offline included. */
  clock: number;
  event: VillageEvent | null;
  nextEventAt: number;
  omen: { resource: Resource; until: number } | null;
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
  reward: Resources | null;
  loot: string[];
  firstClear: boolean;
  prey: Partial<Record<Team, { id: string; time: number }>>;
  lastCast: Partial<Record<Team, number>>;
  powersUsed: SpiritId[];
  /** Heroes who marched, and what they learned. */
  party: string[];
  xp: number;
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

const RESOURCE_KEYS: Resource[] = ['wood', 'food', 'stone', 'spirit'];
export const BUILDING_KEYS: BuildingId[] = ['lumber', 'hunt', 'quarry', 'shrine', 'forge', 'cura'];
/** Built from zero instead of standing from the start. */
const OPTIONAL_BUILDINGS: BuildingId[] = ['forge', 'cura'];
export const PLAYABLE_IDS = ALL_CHARACTER_IDS;
export const MAX_BUILDING_LEVEL = 15;
export const MAX_VILLAGE_LEVEL = 5;
export const SAVE_VERSION = 5;
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
/** Heroes whose traits match a building work 50% better there. */
export const WORK_AFFINITY: Record<BuildingId, string[]> = {
  lumber: ['Copa', 'Enxame'], hunt: ['Caçador', 'Presas'], quarry: ['Brigão', 'Guardião', 'Manada'],
  shrine: ['Xamã', 'Místico', 'Totêmico'], forge: ['Ancestral', 'Escamas', 'Trapaceiro'], cura: ['Xamã', 'Rio', 'Noturno'],
};
const BUILDING_RESOURCE: Partial<Record<BuildingId, Resource>> = { lumber: 'wood', hunt: 'food', quarry: 'stone', shrine: 'spirit' };

export function characterById(id: number): Character {
  return characters.find(character => character.id === id) ?? characters[0];
}
export const emptyResources = (): Resources => ({ wood: 0, food: 0, stone: 0, spirit: 0 });
export const capacity = (state: GameState): number => 2 + state.villageLevel;
const memory = (state: GameState, id: MemoryId): number => state.memories[id] ?? 0;
const chosenSpirits = (state: GameState) => state.spirits.map(spiritById).filter(spirit => !!spirit);
export const shopSize = (state: GameState): number => 4 + chosenSpirits(state).reduce((sum, spirit) => sum + (spirit.passive.shopSlot ?? 0), 0);
export const workerSlots = (state: GameState, id: BuildingId): number => state.buildings[id] > 0 ? Math.min(4, 1 + Math.floor(state.buildings[id] / 4)) : 0;

/** Production bonus that one hero adds to a building. */
export function workerBonus(hero: Hero, building: BuildingId): number {
  const character = characterById(hero.characterId);
  const affinity = character.traits.some(trait => WORK_AFFINITY[building].includes(trait)) ? 1.5 : 1;
  return 0.1 * character.cost * STAR_POWER[hero.stars - 1] * affinity;
}
export function buildingMultiplier(state: GameState, building: BuildingId): number {
  return 1 + state.heroes.filter(hero => hero.work === building).reduce((sum, hero) => sum + workerBonus(hero, building), 0);
}

export function getRates(state: GameState): Resources {
  const civic = settlementRates(state);
  const bonus = (1 + (state.villageLevel - 1) * 0.12) * (1 + 0.25 * memory(state, 'raizes'));
  const omen = (resource: Resource) => state.omen && state.omen.resource === resource && state.clock < state.omen.until ? 1 + OMEN_BONUS : 1;
  const spirit = (resource: Resource) => (1 + chosenSpirits(state).reduce((sum, entry) => sum + (entry.passive.production?.[resource] ?? 0), 0)) * omen(resource);
  return {
    wood: (state.buildings.lumber * 1.5 + civic.wood) * bonus * spirit('wood') * buildingMultiplier(state, 'lumber'),
    food: (state.buildings.hunt * 1.2 + civic.food) * bonus * spirit('food') * buildingMultiplier(state, 'hunt'),
    stone: (state.buildings.quarry * 0.85 + civic.stone) * bonus * spirit('stone') * buildingMultiplier(state, 'quarry'),
    spirit: (state.buildings.shrine * 0.3 + civic.spirit) * bonus * spirit('spirit') * buildingMultiplier(state, 'shrine'),
  };
}
/** Components forged per second. */
export function forgeRate(state: GameState): number {
  const level = state.buildings.forge;
  if (!level) return 0;
  const speed = 1 + chosenSpirits(state).reduce((sum, spirit) => sum + (spirit.passive.forgeSpeed ?? 0), 0);
  return level / 900 * buildingMultiplier(state, 'forge') * speed;
}

/** level is the current building level; this returns the price of its next level. */
export function buildingCost(id: BuildingId, level: number): Resources {
  const growth = Math.pow(1.65, Math.max(0, level - 1));
  if (id === 'forge') return { wood: Math.ceil(90 * growth), food: 0, stone: Math.ceil(80 * growth), spirit: Math.ceil(20 * growth) };
  if (id === 'cura') return { wood: Math.ceil(70 * growth), food: Math.ceil(40 * growth), stone: Math.ceil(30 * growth), spirit: Math.ceil(30 * growth) };
  return {
    wood: Math.ceil((id === 'lumber' ? 35 : 45) * growth),
    food: id === 'hunt' ? Math.ceil(15 * growth) : 0,
    stone: Math.ceil((id === 'shrine' ? 35 : 20) * growth),
    spirit: id === 'shrine' ? Math.ceil(10 * growth) : 0,
  };
}

/** level is the current village level. */
export function villageCost(level: number): Resources {
  // Each era costs about three times the previous one, so the ages pace the whole journey.
  const growth = Math.pow(2.8, Math.max(0, level - 1));
  return { wood: Math.ceil(160 * growth), food: Math.ceil(110 * growth), stone: Math.ceil(80 * growth), spirit: Math.ceil(30 * growth) };
}
/** Each of the five stages of the Great Totem; stage is the number already raised. */
export function wonderCost(stage: number): Resources {
  const step = stage + 1;
  return { wood: 2500 * step, food: 1800 * step, stone: 2200 * step, spirit: 1100 * step };
}
export function recruitCost(characterId = 1, state?: GameState): Resources {
  const price = recruitPrice(characterById(characterId).cost);
  const discount = state ? 1 - 0.08 * memory(state, 'fogueira') : 1;
  return { wood: 0, food: Math.round(price.food * discount), stone: 0, spirit: Math.round(price.spirit * discount) };
}
export const REROLL_COST: Resources = { wood: 0, food: 0, stone: 0, spirit: 8 };
export const GATHER_AMOUNT: Resources = { wood: 5, food: 4, stone: 3, spirit: 2 };
/** Embers granted by raising the Great Totem now. */
export const embersFor = (state: GameState): number => 8 + 2 * state.endlessBest + 2 * state.rebirths;

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
  return era <= state.villageLevel ? era : null;
}
export const stageUnlocked = (state: GameState, stageId: number): boolean =>
  stageId === 0 ? state.progress >= FINAL_STAGE : stageId >= 1 && stageId <= Math.min(FINAL_STAGE, state.progress + 1) && regionOf(stageId).village <= state.villageLevel;

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
  ({ uid, characterId, stars, slot, items: [], work: null, level: 1, xp: 0, ritualLevel: 1, ritualXp: 0, ritualReadyAt: 0, panema: 0, rituals: {}, away: null, focus: false });
/** The journey begins with Akru alone at the front centre; the tribe grows from there. */
const starterHeroes = (): Hero[] => [newHero('hero-1', 1, 1, 3)];
/** A hero is in the village when not hunting or in ceremony. */
export const available = (hero: Hero) => !hero.away;
/** Ceremonies run faster with helpers in the Casa de Cura. */
export const ritualSpeed = (state: GameState): number => Math.min(1.5, buildingMultiplier(state, 'cura'));

function initialState(): GameState {
  return {
    settlement: initialSettlement(),
    resources: { wood: 120, food: 90, stone: 60, spirit: 75 },
    villageLevel: 1,
    buildings: { lumber: 1, hunt: 1, quarry: 1, shrine: 1, forge: 0, cura: 0 },
    heroes: starterHeroes(),
    shop: [1, 2, 4, 6], shopSeed: 7,
    progress: 0, selectedStage: 1, endlessBest: 0, endlessRecord: 0,
    inventory: [], lootSeed: 11, forgeProgress: 0,
    spirits: [], wonder: 0, embers: 0, memories: {}, rebirths: 0,
    settings: { speed: 1, autoRepeat: false },
    quests: [], stats: { recruits: 0, powers: 0, victories: 0, hunts: 0, rituals: 0 }, clock: 0, cacao: 0, reports: [],
    event: null, nextEventAt: FIRST_EVENT_AT, omen: null,
    paused: false,
  };
}

function sanitizeEvent(value: unknown): VillageEvent | null {
  const input = record(value);
  if (!(typeof input.kind === 'string' && input.kind in EVENT_TEXT) || typeof input.expires !== 'number' || !Number.isFinite(input.expires)) return null;
  const event: VillageEvent = { kind: input.kind as VillageEvent['kind'], expires: input.expires };
  if (event.kind === 'merchant') {
    const price = record(input.price);
    if (typeof input.item !== 'string' || !itemById(input.item)) return null;
    event.item = input.item;
    event.price = Object.fromEntries(RESOURCE_KEYS.map(key => [key, finite(price[key], 0, 0, 1e9)])) as Resources;
  }
  if (event.kind === 'omen') { if (!RESOURCE_KEYS.includes(input.resource as Resource)) return null; event.resource = input.resource as Resource; }
  if (event.kind === 'traveler') { if (!PLAYABLE_IDS.includes(input.characterId as number)) return null; event.characterId = input.characterId as number; }
  return event;
}
function sanitizeOmen(value: unknown): GameState['omen'] {
  const input = record(value);
  return RESOURCE_KEYS.includes(input.resource as Resource) && typeof input.until === 'number' && Number.isFinite(input.until) ? { resource: input.resource as Resource, until: input.until } : null;
}

function sanitizeState(value: unknown, version: number): GameState {
  const input = record(value);
  const fallback = initialState();
  const resources = record(input.resources);
  const buildings = record(input.buildings);
  const settings = record(input.settings);
  const memories = record(input.memories);
  const stats = record(input.stats);
  // Version 1 counted linear waves; each cleared wave becomes a cleared stage.
  const progress = version === 1 ? integer(input.wave, 1, 1, FINAL_STAGE + 1) - 1 : integer(input.progress, 0, 0, FINAL_STAGE);
  const state: GameState = {
    ...fallback,
    resources: Object.fromEntries(RESOURCE_KEYS.map(key => [key, finite(resources[key], fallback.resources[key], 0, 1e12)])) as Resources,
    buildings: Object.fromEntries(BUILDING_KEYS.map(key => [key, integer(buildings[key], fallback.buildings[key], OPTIONAL_BUILDINGS.includes(key) ? 0 : 1, MAX_BUILDING_LEVEL)])) as Record<BuildingId, number>,
    villageLevel: integer(input.villageLevel, 1, 1, MAX_VILLAGE_LEVEL),
    paused: input.paused === true,
    // Saves from 0.3 stored a rotation index; it is a valid starting seed.
    shopSeed: integer(input.shopSeed ?? input.shopRotation, 7, 0, 4294967295),
    lootSeed: integer(input.lootSeed, 11, 0, 4294967295),
    progress,
    endlessBest: integer(input.endlessBest, 0, 0, 10_000),
    endlessRecord: integer(input.endlessRecord, 0, 0, 10_000),
    forgeProgress: finite(input.forgeProgress, 0, 0, 1),
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
    event: sanitizeEvent(input.event),
    omen: sanitizeOmen(input.omen),
  };
  state.nextEventAt = finite(input.nextEventAt, state.clock + FIRST_EVENT_AT, 0, state.clock + 3600);
  state.settlement = sanitizeSettlement(input.settlement, state.clock);
  state.settlement.focusTraits = state.settlement.focusTraits.filter(trait => Object.hasOwn(TRAIT_RULES,trait));
  state.cacao = finite(input.cacao, 0, 0, state.clock + CACAO_DURATION);
  state.endlessRecord = Math.max(state.endlessRecord, state.endlessBest);
  const spirits: SpiritId[] = [];
  if (Array.isArray(input.spirits)) for (const [index, id] of input.spirits.entries()) {
    const spirit = typeof id === 'string' ? spiritById(id) : undefined;
    if (spirit && spirit.era === index + 2 && index + 2 <= state.villageLevel) spirits.push(spirit.id); else break;
  }
  state.spirits = spirits;
  const slots = new Set<number>();
  const uids = new Set<string>();
  const workers = new Map<BuildingId, number>();
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
      let work = slot === null && typeof hero.work === 'string' && BUILDING_KEYS.includes(hero.work as BuildingId) ? hero.work as BuildingId : null;
      if (work && (workers.get(work) ?? 0) >= workerSlots(state, work)) work = null;
      if (work) workers.set(work, (workers.get(work) ?? 0) + 1);
      const items = Array.isArray(hero.items) ? hero.items.filter(id => typeof id === 'string' && !!itemById(id)).slice(0, MAX_ITEMS_PER_HERO) as string[] : [];
      const level = integer(hero.level, 1, 1, MAX_HERO_LEVEL);
      const rituals = record(hero.rituals);
      const awayInput = record(hero.away);
      const awayKind = awayInput.kind === 'hunt' || awayInput.kind === 'ritual' ? awayInput.kind : null;
      const awayValid = awayKind && typeof awayInput.id === 'string' && (awayKind === 'hunt' ? !!trailById(awayInput.id) : !!practiceById(awayInput.id) && !practiceById(awayInput.id)!.tribe)
        && typeof awayInput.until === 'number' && Number.isFinite(awayInput.until) && awayInput.until <= state.clock + 24 * 3600;
      const away: HeroAway | null = awayValid ? { kind: awayKind!, id: awayInput.id as TrailId | PracticeId, until: Math.max(0, awayInput.until as number), focus: awayInput.focus === true } : null;
      if (away && typeof awayInput.returnWork === 'string' && BUILDING_KEYS.includes(awayInput.returnWork as BuildingId)) away.returnWork = awayInput.returnWork as BuildingId;
      if (away?.kind === 'ritual') away.participationXp = integer(awayInput.participationXp, 0, 0, participationBonus(RITUAL_XP[away.id as PracticeId], 1));
      if (away) work = null;
      return [{
        ...newHero(uid, hero.characterId as number, integer(hero.stars, 1, 1, 3), slot), items, work, level,
        ritualLevel: integer(hero.ritualLevel, 1, 1, MAX_RITUAL_LEVEL),
        ritualXp: integer(hero.ritualLevel, 1, 1, MAX_RITUAL_LEVEL) >= MAX_RITUAL_LEVEL ? 0 : finite(hero.ritualXp, 0, 0, ritualXpToNext(integer(hero.ritualLevel, 1, 1, MAX_RITUAL_LEVEL)) - 1),
        ritualReadyAt: finite(hero.ritualReadyAt, 0, 0, state.clock + 24 * 3600),
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
    if (keeper.slot === null && hero.slot !== null) { keeper.slot = hero.slot; keeper.work = null; }
    if (!keeper.work && keeper.slot === null) keeper.work = hero.work;
    keeper.panema = Math.min(keeper.panema, hero.panema);
    keeper.ritualReadyAt = Math.max(keeper.ritualReadyAt, hero.ritualReadyAt);
    keeper.away ??= hero.away;
    for (const practice of PRACTICES) if (!practice.tribe) keeper.rituals[practice.id] = Math.max(keeper.rituals[practice.id] ?? 0, hero.rituals[practice.id] ?? 0);
    for (const item of hero.items) { if (keeper.items.length < MAX_ITEMS_PER_HERO) keeper.items.push(item); else state.inventory.push(item); }
  }
  state.heroes = [...unique.values()];
  const allowed = (id: unknown) => PLAYABLE_IDS.includes(id as number) && characterById(id as number).cost <= unlockedCost(state.villageLevel);
  const shop = Array.isArray(input.shop) ? [...new Set(input.shop.filter(allowed))] as number[] : [];
  state.shop = [...shop, ...PLAYABLE_IDS.filter(id => !shop.includes(id) && allowed(id))].slice(0, shopSize(state));
  const selected = integer(input.selectedStage, Math.min(FINAL_STAGE, state.progress + 1), 0, FINAL_STAGE);
  state.selectedStage = stageUnlocked(state, selected) ? selected : Math.max(1, Math.min(state.progress + 1, FINAL_STAGE));
  while (state.selectedStage > 1 && !stageUnlocked(state, state.selectedStage)) state.selectedStage--;
  return state;
}

export class Game {
  state: GameState;
  battle: BattleState | null = null;
  events: CombatEvent[] = [];
  offlineGains: Resources | null = null;
  offlineSeconds = 0;
  private uidCounter = 4;
  private eventCounter = 0;
  private summonCounter = 0;
  private zoneCounter = 0;
  private traitTiers = new Map<string, number>();
  private healBonus = 0;
  private summonBonus = 0;
  private windups=new Map<string,{kind:'attack'|'cast';targetId:string;remaining:number}>();
  private projectiles:{source:CombatEntity;target:CombatEntity;remaining:number;power:number;third:boolean}[]=[];

  /** A save can be the serialized JSON string or the parsed versioned save object. */
  constructor(save?: unknown, now = Date.now()) {
    this.state = initialState();
    if (typeof save === 'string') { try { save = JSON.parse(save); } catch { return; } }
    const root = record(save);
    if (root.version !== 1 && root.version !== 2 && root.version !== 3 && root.version !== 4 && root.version !== SAVE_VERSION) return;
    this.state = sanitizeState(root.state, root.version as number);
    const savedAt = finite(root.savedAt, now, 0, Number.MAX_SAFE_INTEGER);
    this.offlineSeconds = this.state.paused ? 0 : Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (now - savedAt) / 1000));
    if (this.offlineSeconds > 0) {
      const before = { ...this.state.resources };
      this.produce(this.offlineSeconds);
      this.offlineGains = Object.fromEntries(RESOURCE_KEYS.map(key => [key, this.state.resources[key] - before[key]])) as Resources;
    }
  }

  /** Combat is deliberately omitted. Reloading abandons an unfinished fight without rewards. */
  serialize(now = Date.now()): string {
    return JSON.stringify({ version: SAVE_VERSION, savedAt: now, state: this.state });
  }

  canAfford(cost: Resources): boolean { return RESOURCE_KEYS.every(key => this.state.resources[key] + 1e-8 >= cost[key]); }
  private spend(cost: Resources): boolean {
    if (!this.canAfford(cost)) return false;
    for (const key of RESOURCE_KEYS) this.state.resources[key] = Math.max(0, this.state.resources[key] - cost[key]);
    return true;
  }
  private addResources(resources: Resources): void {
    for (const key of RESOURCE_KEYS) this.state.resources[key] = Math.min(1e12, this.state.resources[key] + resources[key]);
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

  /** Village production and the forge; shared by the live clock and offline time. */
  private produce(seconds: number): void {
    this.resolveVillageOrders();
    this.resolveAway();
    const nextReturn = Math.min(...this.state.heroes.filter(h => h.away).map(h => h.away!.until), ...this.state.settlement.orders.map(o=>o.until));
    const segment = nextReturn - this.state.clock;
    if (segment > 0 && segment < seconds) { this.produce(segment); this.produce(seconds - segment); return; }
    const learningSeconds = seconds + Math.min(seconds, Math.max(0, this.state.cacao - this.state.clock)) * CACAO_XP;
    for (const hero of this.state.heroes) if (hero.work && !hero.away) this.gainXp(hero, WORK_XP_PER_MINUTE / 60 * learningSeconds, false);
    this.state.clock += seconds;
    this.updateEvents();
    const rates = getRates(this.state);
    this.addResources(Object.fromEntries(RESOURCE_KEYS.map(key => [key, rates[key] * seconds])) as Resources);
    const rate = forgeRate(this.state);
    if (rate > 0) {
      this.state.forgeProgress += rate * seconds;
      while (this.state.forgeProgress >= 1 && this.addItem(this.randomComponent())) this.state.forgeProgress -= 1;
      this.state.forgeProgress = Math.min(1, this.state.forgeProgress);
    }
    this.resolveAway();
    this.resolveVillageOrders();
  }

  /** Unanswered raiders steal provisions; a quiet village sees a new event every few minutes from the second era. */
  private updateEvents(): void {
    const s = this.state;
    if (s.omen && s.clock >= s.omen.until) s.omen = null;
    if (s.event && s.clock > s.event.expires) {
      if (s.event.kind === 'raid') { const loss=RAID_PENALTY*(1-raidProtection(s)); s.resources.wood *= 1 - loss; s.resources.food *= 1 - loss; }
      s.event = null;
    }
    if (!s.event && s.villageLevel >= 2 && s.clock >= s.nextEventAt) {
      const rolled = rollEvent(s.lootSeed, s.clock, s.villageLevel, s.heroes.length >= MAX_ROSTER_SIZE);
      const delay = nextEventDelay(rolled.seed);
      s.event = rolled.event; s.lootSeed = delay.seed; s.nextEventAt = s.clock + delay.delay;
    }
  }

  /** Answers the current village event. Accepting a raid starts the defence battle. */
  answerEvent(accept: boolean): ActionResult {
    const s = this.state, event = s.event;
    if (!event) return fail('Nenhum acontecimento aguarda a tribo.');
    if (this.fighting()) return fail('Conclua a expedição atual primeiro.');
    const text = EVENT_TEXT[event.kind];
    if (event.kind === 'raid') {
      if (accept) {
        if (this.battle) return fail('Feche a expedição anterior antes de defender a aldeia.');
        const raid = raidStage(s.lootSeed, s.progress, s.villageLevel);
        s.lootSeed = raid.seed;
        const result = this.beginBattle(raid.stage, raid.level, 0);
        if (result.ok) s.event = null;
        return result;
      }
      s.resources.food *= 1 - TRIBUTE; s.resources.spirit *= 1 - TRIBUTE;
      s.event = null;
      return success('O tributo foi pago. Os saqueadores partem.');
    }
    s.event = null;
    if (!accept) return success(`${text.title}: a tribo seguiu seu caminho.`);
    switch (event.kind) {
      case 'merchant':
        if (!event.price || !event.item) return fail('Oferta inválida.');
        if (s.inventory.length >= MAX_INVENTORY) { s.event = event; return fail('A bolsa está cheia.'); }
        if (!this.spend(event.price)) { s.event = event; return fail('Recursos insuficientes para a troca.'); }
        this.addItem(event.item);
        return success(`${itemById(event.item)!.name} foi para a bolsa.`);
      case 'omen':
        s.omen = { resource: event.resource!, until: s.clock + OMEN_DURATION };
        return success('O presságio se cumpre: a produção cresce por 3 minutos.');
      case 'traveler':
        if (s.heroes.length >= MAX_ROSTER_SIZE) { s.event = event; return fail('A reserva está cheia.'); }
        if (s.heroes.some(hero => hero.characterId === event.characterId)) { this.addResources({ ...emptyResources(), spirit: 120 }); return success('O companheiro reencontrou a tribo e trouxe 120 de espírito.'); }
        if (!s.heroes.some(hero => hero.ritualLevel >= [1, 2, 3, 5, 7][characterById(event.characterId!).cost - 1])) {
          this.addResources({ ...emptyResources(), spirit: 120 });
          return success('O viajante trouxe histórias e 120 de espírito. Aprofunde o vínculo ritual para acolher esse companheiro.');
        }
        s.heroes.push(newHero(this.newUid(), event.characterId!));
        return success(`${characterById(event.characterId!).name} juntou-se à tribo.`);
    }
    return fail('Acontecimento desconhecido.');
  }

  /** Production for time spent away from the page while it stays open (the battle clock does not run). */
  catchUp(seconds: number): void {
    if (this.state.paused || !Number.isFinite(seconds) || seconds <= 0) return;
    this.produce(Math.min(OFFLINE_CAP_SECONDS, seconds));
  }

  private villageLog(text:string, at=this.state.clock):void {
    this.state.settlement.log.push({at,text});this.state.settlement.log=this.state.settlement.log.slice(-12);
  }
  private resolveVillageOrders():void {
    const s=this.state,v=s.settlement;
    const complete=v.orders.filter(o=>o.until<=s.clock).sort((a,b)=>a.until-b.until||a.id-b.id);
    v.orders=v.orders.filter(o=>o.until>s.clock);
    for(const o of complete) {
      if(o.kind==='building')s.buildings[o.target as BuildingId]=Math.max(s.buildings[o.target as BuildingId],o.level);
      if(o.kind==='infrastructure'&&o.plot&&!v.sites[o.plot])v.sites[o.plot]=o.target as InfrastructureId;
      if(o.kind==='train'&&v.citizens.length<40)v.citizens.push({id:v.nextCitizen++,job:'idle'});
      if(o.kind==='research')v.research[o.target as ResearchId]=Math.max(v.research[o.target as ResearchId],Math.min(3,o.level));
      if(o.kind==='scout'&&!v.discovered.includes(o.target)) {
        v.discovered.push(o.target);const t=territoryById(o.target)!;const cache=emptyResources();cache[t.resource]=35*t.era;this.addResources(cache);
      }
      if(o.kind==='claim'&&!v.claimed.includes(o.target))v.claimed.push(o.target);
      this.villageLog(`${orderTitle(o)} concluído.`,o.until);
    }
  }
  private queueVillageOrder(order:Omit<VillageOrder,'id'|'started'|'until'>,seconds:number):ActionResult {
    if(this.state.paused)return fail('Retome a jornada para dar uma ordem.');
    if(this.state.settlement.orders.length>=12)return fail('Conclua uma das ordens em andamento.');
    if(!this.spend(order.cost))return fail('Faltam recursos para esta ordem.');
    const o={...order,id:this.state.settlement.nextOrder++,started:this.state.clock,until:this.state.clock+seconds};
    this.state.settlement.orders.push(o);this.villageLog(`${orderTitle(o)} iniciado.`);
    return success(`${orderTitle(o)} em andamento.`);
  }
  queueBuilding(id:BuildingId):ActionResult {
    const s=this.state;
    if(!BUILDING_KEYS.includes(id))return fail('Construção desconhecida.');
    if(s.settlement.orders.some(o=>o.kind==='building'&&o.target===id))return fail('Esta construção já tem uma obra em andamento.');
    if(s.buildings[id]>=MAX_BUILDING_LEVEL)return fail('Nível máximo alcançado.');
    if(id==='forge'&&s.villageLevel<2)return fail('A Forja de Osso exige a Era II.');
    if(constructionCount(s)>=builderCount(s))return fail('Designe mais um construtor ou conclua a obra atual.');
    return this.queueVillageOrder({kind:'building',target:id,level:s.buildings[id]+1,cost:buildingCost(id,s.buildings[id])},25+s.buildings[id]*12);
  }
  buildInfrastructure(id:InfrastructureId,plot:string):ActionResult {
    const s=this.state,def=INFRASTRUCTURE[id];
    if(!def)return fail('Escolha uma construção.');
    if(s.villageLevel<def.era)return fail(`Esta construção exige a Era ${def.era}.`);
    if(!villagePlots(s).some(p=>p.id===plot)||s.settlement.sites[plot]||s.settlement.orders.some(o=>o.plot===plot))return fail('Escolha um terreno livre dentro do território da tribo.');
    if(constructionCount(s)>=builderCount(s))return fail('Todos os construtores estão ocupados.');
    return this.queueVillageOrder({kind:'infrastructure',target:id,plot,level:1,cost:{...def.cost}},def.seconds);
  }
  trainCitizen():ActionResult {
    const s=this.state;
    if(s.settlement.orders.some(o=>o.kind==='train'))return fail('Um aldeão já está em preparação.');
    if(s.settlement.citizens.length>=populationCap(s))return fail('Erga uma moradia para acolher mais aldeões.');
    return this.queueVillageOrder({kind:'train',target:'citizen',level:1,cost:trainingCost()},30);
  }
  setCitizenJob(id:number,job:CitizenJob):ActionResult {
    if(!['wood','food','stone','spirit','builder','idle'].includes(job))return fail('Ofício desconhecido.');
    if(this.state.paused)return fail('Retome a jornada para dar uma ordem.');
    const c=this.state.settlement.citizens.find(c=>c.id===id);
    if(!c)return fail('Aldeão não encontrado.');
    if(this.state.settlement.orders.some(o=>o.citizenId===id))return fail('Este aldeão volta ao ofício após o reconhecimento.');
    if(c.job==='builder'&&job!=='builder'&&builderCount(this.state)<=constructionCount(this.state))return fail('Este construtor precisa concluir a obra antes de mudar de ofício.');
    c.job=job;return success('Ofício do aldeão atualizado.');
  }
  adjustCitizens(job:CitizenJob,delta:number):ActionResult {
    const v=this.state.settlement,reserved=(id:number)=>v.orders.some(o=>o.citizenId===id);
    if(delta<0){const c=v.citizens.find(c=>c.job===job&&!reserved(c.id));return c?this.setCitizenJob(c.id,'idle'):fail('Nenhum aldeão disponível neste ofício.');}
    const candidate=v.citizens.find(c=>c.job==='idle'&&!reserved(c.id))??v.citizens.filter(c=>c.job!==job&&c.job!=='builder'&&!reserved(c.id)).sort((a,b)=>v.citizens.filter(c=>c.job===b.job).length-v.citizens.filter(c=>c.job===a.job).length)[0];
    return candidate?this.setCitizenJob(candidate.id,job):fail('Prepare outro aldeão ou libere um ofício.');
  }
  scoutTerritory(id:string):ActionResult {
    const s=this.state,t=territoryById(id);if(!t)return fail('Território desconhecido.');
    const lock=territoryLock(s,t);if(lock)return fail(lock);
    if(s.settlement.discovered.includes(id)||s.settlement.orders.some(o=>o.kind==='scout'))return fail('O território já foi reconhecido ou a equipe está explorando.');
    const c=s.settlement.citizens.filter(c=>c.job!=='builder').sort((a,b)=>Number(b.job==='idle')-Number(a.job==='idle'))[0];
    if(!c)return fail('Disponibilize um aldeão para reconhecer a mata.');
    return this.queueVillageOrder({kind:'scout',target:id,citizenId:c.id,level:1,cost:{wood:0,food:20*t.era,stone:0,spirit:0}},t.scout*(1-.15*s.settlement.research.tracking));
  }
  claimTerritory(id:string):ActionResult {
    const s=this.state,t=territoryById(id);if(!t)return fail('Território desconhecido.');
    const lock=territoryLock(s,t);if(lock)return fail(lock);
    if(!s.settlement.discovered.includes(id))return fail('Reconheça a mata antes de estabelecer o posto.');
    if(s.settlement.claimed.includes(id)||s.settlement.orders.some(o=>o.kind==='claim'&&o.target===id))return fail('O posto já existe ou está em construção.');
    if(constructionCount(s)>=builderCount(s))return fail('Disponibilize um construtor para o posto avançado.');
    return this.queueVillageOrder({kind:'claim',target:id,level:1,cost:{...t.cost}},45+t.era*15);
  }
  researchVillage(id:ResearchId):ActionResult {
    const s=this.state,def=RESEARCH[id];if(!def)return fail('Pesquisa desconhecida.');
    if(s.villageLevel<def.era)return fail(`Esta pesquisa exige a Era ${def.era}.`);
    if(s.settlement.research[id]>=3||s.settlement.orders.some(o=>o.kind==='research'&&o.target===id))return fail('Pesquisa no máximo ou já em andamento.');
    return this.queueVillageOrder({kind:'research',target:id,level:s.settlement.research[id]+1,cost:researchCost(s,id)},def.seconds*(1+s.settlement.research[id]*.5));
  }
  cancelVillageOrder(id:number):ActionResult {
    this.resolveVillageOrders();const v=this.state.settlement,o=v.orders.find(o=>o.id===id);if(!o)return fail('Esta ordem já foi concluída.');
    v.orders=v.orders.filter(o=>o.id!==id);this.addResources(Object.fromEntries(RESOURCE_KEYS.map(r=>[r,o.cost[r]*.8])) as Resources);
    this.villageLog(`${orderTitle(o)} cancelado. 80% dos recursos devolvidos.`);return success('Ordem cancelada; 80% dos recursos foram devolvidos.');
  }
  tradeResources(from:Resource,to:Resource):ActionResult {
    if(!Object.values(this.state.settlement.sites).includes('market'))return fail('Erga a Casa de trocas primeiro.');
    if(!['wood','food','stone'].includes(from)||!['wood','food','stone'].includes(to)||from===to)return fail('Escolha dois recursos materiais diferentes.');
    if(this.state.paused)return fail('Retome a jornada.');const cost=emptyResources();cost[from]=100;
    if(!this.spend(cost))return fail('São necessários 100 recursos para a troca.');const gain=emptyResources();gain[to]=65;this.addResources(gain);return success('Troca concluída: 100 por 65.');
  }
  setArmyFocus(trait:string):ActionResult {
    if(!Object.hasOwn(TRAIT_RULES,trait))return fail('Laço desconhecido.');const v=this.state.settlement;
    v.focusTraits=v.focusTraits.includes(trait)?v.focusTraits.filter(t=>t!==trait):[...v.focusTraits.slice(-1),trait];return success('Plano da formação atualizado.');
  }
  claimSettlementMilestone(id:string):ActionResult {
    const v=this.state.settlement,m=SETTLEMENT_MILESTONES.find(m=>m.id===id);
    if(!m||v.milestones.includes(id)||!m.done(this.state))return fail('Este marco ainda não está disponível ou já foi recebido.');
    v.milestones.push(id);this.addResources(m.reward);this.villageLog(`${m.name}: recompensa recebida.`);return success(`${m.name}: a aldeia recebeu os recursos.`);
  }

  gather(resource: Resource): ActionResult {
    if (!RESOURCE_KEYS.includes(resource)) return fail('Recurso desconhecido.');
    if (this.state.paused) return fail('Retome o tempo para coletar.');
    this.state.resources[resource] = Math.min(1e12, this.state.resources[resource] + GATHER_AMOUNT[resource] * this.state.villageLevel);
    return success(`+${GATHER_AMOUNT[resource] * this.state.villageLevel}`);
  }

  upgradeBuilding(id: BuildingId): ActionResult {
    if (!BUILDING_KEYS.includes(id)) return fail('Construção desconhecida.');
    const level = this.state.buildings[id];
    if (level >= MAX_BUILDING_LEVEL) return fail('Esta construção chegou ao nível máximo.');
    if (id === 'forge' && this.state.villageLevel < 2) return fail('A Forja de Osso exige a aldeia de nível 2.');
    if (!this.spend(buildingCost(id, level))) return fail('Recursos insuficientes para melhorar a construção.');
    this.state.buildings[id]++;
    return success(level === 0 ? (id === 'cura' ? 'A Casa de Cura foi erguida. Prepare a primeira cerimônia.' : 'A Forja de Osso foi erguida. Componentes começam a surgir.') : `Construção melhorada para o nível ${level + 1}.`);
  }

  upgradeVillage(): ActionResult {
    if (this.state.villageLevel >= MAX_VILLAGE_LEVEL) return fail('A aldeia chegou ao nível máximo.');
    const need = ERA_GROWTH[this.state.villageLevel - 1];
    if (!this.state.heroes.some(hero => hero.level >= need.level && hero.ritualLevel >= need.ritualLevel)) return fail(`A próxima era pede um herói com experiência nível ${need.level} e ritual nível ${need.ritualLevel}.`);
    if (!this.spend(villageCost(this.state.villageLevel))) return fail('Reúna os recursos necessários para expandir a aldeia.');
    this.state.villageLevel++;
    // Retain legacy visitor state for older save compatibility.
    if (!this.fighting()) this.refreshShop();
    return success(`Era ${this.state.villageLevel}! Escolha um Espírito Protetor. Novos companheiros ficam disponíveis na Tribo conforme seu vínculo ritual.`);
  }

  chooseSpirit(id: SpiritId): ActionResult {
    const era = pendingEra(this.state);
    if (!era) return fail('Nenhuma era aguarda um Espírito Protetor.');
    const spirit = spiritsOfEra(era).find(entry => entry.id === id);
    if (!spirit) return fail('Este espírito não pertence a esta era.');
    this.state.spirits.push(spirit.id);
    while (this.state.shop.length < shopSize(this.state)) this.state.shop.push(this.nextShopHero(this.state.shop));
    return success(`O ${spirit.name} protege a tribo. Novo poder: ${spirit.power.name}.`);
  }

  private newUid(): string {
    let uid = `hero-${this.uidCounter++}`;
    while (this.state.heroes.some(hero => hero.uid === uid)) uid = `hero-${this.uidCounter++}`;
    return uid;
  }
  private nextShopHero(exclude: number[]): number {
    const roll = rollVisitor(this.state.shopSeed, this.state.villageLevel, exclude);
    this.state.shopSeed = roll.seed;
    return roll.id;
  }
  private refreshShop(): void {
    const next: number[] = [];
    for (let i = 0; i < shopSize(this.state); i++) next.push(this.nextShopHero(next));
    this.state.shop = next;
  }
  recruit(characterId: number): ActionResult {
    if (this.fighting()) return fail('O recrutamento volta ao fim do combate.');
    if (!PLAYABLE_IDS.includes(characterId)) return fail('Companheiro desconhecido.');
    if (this.state.heroes.some(hero => hero.characterId === characterId)) return fail('Este companheiro já faz parte da tribo. Estrelas são conquistadas com experiência e rituais.');
    const character = characterById(characterId);
    if (character.cost > unlockedCost(this.state.villageLevel)) return fail(`${character.name} se une à tribo na Era ${character.cost}.`);
    const required = [1, 2, 3, 5, 7][character.cost - 1];
    if (!this.state.heroes.some(hero => hero.ritualLevel >= required)) return fail(`O vínculo de ${character.name} exige um herói no nível ritual ${required}.`);
    if (this.state.heroes.length >= MAX_ROSTER_SIZE) return fail('Todos os companheiros já foram acolhidos.');
    const cost = recruitCost(characterId, this.state);
    if (!this.spend(cost)) return fail(`O acolhimento custa ${cost.spirit} de espírito e ${cost.food} de alimento.`);
    this.state.heroes.push(newHero(this.newUid(), characterId));
    this.state.stats.recruits++;
    return success(`${character.name} chegou à tribo. Seu caminho de experiência e rituais começa agora.`);
  }

  rerollShop(): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate.');
    if (!this.spend(REROLL_COST)) return fail('São necessários 8 de espírito para uma nova visita.');
    this.refreshShop();
    return success('Novos heróis chegaram à fogueira.');
  }

  autoFormation(): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate para organizar a formação.');
    const party = this.state.heroes.filter(hero => !hero.away)
      .sort((a,b) => b.stars-a.stars || b.level-a.level).slice(0,capacity(this.state));
    if (!party.length) return fail('A tribo está em atividades fora da aldeia.');
    const slots = enemyFormation(party.map(hero => characterById(hero.characterId).range > 1));
    for (const hero of this.state.heroes) hero.slot = null;
    party.forEach((hero,index) => { hero.slot=slots[index]; hero.work=null; });
    return success('Formação organizada: combatentes à frente, conjuradores e atiradores atrás.');
  }

  applyArmyPlan():ActionResult {
    if(this.fighting())return fail('Aguarde o fim do combate para mudar a formação.');
    if(this.state.paused)return fail('Retome a jornada.');
    const party=recommendedParty(this.state);if(!party.length)return fail('Disponibilize companheiros que estejam na aldeia e fora do trabalho.');
    const slots=enemyFormation(party.map(h=>!['front','flank'].includes(roleOf(characterById(h.characterId)))));
    for(const h of this.state.heroes)h.slot=null;
    party.forEach((h,i)=>{h.slot=slots[i];});return success('Plano aplicado: laços priorizados, linha de frente protegendo a retaguarda.');
  }

  deploy(uid: string, slot: number | null): ActionResult {
    if (this.fighting()) return fail('A formação está em combate.');
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    if (!hero) return fail('Herói não encontrado.');
    if (slot !== null && (!Number.isInteger(slot) || slot < 0 || slot >= FORMATION_SLOTS)) return fail('Escolha um lugar válido da formação.');
    const occupant = slot === null ? undefined : this.state.heroes.find(entry => entry.uid !== uid && entry.slot === slot);
    const deployed = this.state.heroes.filter(entry => entry.slot !== null).length;
    if (slot !== null && hero.slot === null && !occupant && deployed >= capacity(this.state)) return fail('Formação cheia. Expanda a aldeia para levar mais heróis.');
    if (occupant) occupant.slot = hero.slot;
    hero.slot = slot;
    if (slot !== null) hero.work = null;
    if (slot !== null && hero.away) return success(`Formação atualizada. ${characterById(hero.characterId).name} luta quando voltar à aldeia.`);
    return success(slot === null ? 'Herói movido para a reserva.' : 'Formação atualizada.');
  }

  assignWorker(uid: string, building: BuildingId | null): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate.');
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    if (!hero) return fail('Herói não encontrado.');
    if (building === null) { hero.work = null; return success(`${characterById(hero.characterId).name} voltou a descansar.`); }
    if (hero.away) return fail(`${characterById(hero.characterId).name} está fora da aldeia.`);
    if (!BUILDING_KEYS.includes(building) || this.state.buildings[building] <= 0) return fail('Esta construção ainda não existe.');
    const busy = this.state.heroes.filter(entry => entry.work === building && entry !== hero).length;
    if (busy >= workerSlots(this.state, building)) return fail('Não há vagas de trabalho nesta construção. Melhore-a para abrir mais.');
    hero.slot = null; hero.work = building;
    return success(`${characterById(hero.characterId).name} começou a trabalhar.`);
  }

  sellHero(uid: string): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate.');
    if (this.state.heroes.length <= 1) return fail('Mantenha pelo menos um herói na aldeia.');
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    if (!hero) return fail('Herói não encontrado.');
    if (hero.away) return fail(`${characterById(hero.characterId).name} está fora da aldeia.`);
    this.state.heroes = this.state.heroes.filter(entry => entry.uid !== uid);
    for (const item of hero.items) this.addItem(item);
    this.state.resources.spirit += sellRefund(characterById(hero.characterId).cost, hero.stars);
    return success('Herói liberado. Parte do espírito foi devolvida e os itens voltaram à bolsa.');
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
    if (this.state.buildings.forge <= 0) return fail('Construa a Forja de Osso para combinar componentes na bolsa.');
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

  buildWonder(): ActionResult {
    if (this.state.wonder >= WONDER_STAGES) return fail('O Grande Totem já está completo.');
    if (this.state.villageLevel < MAX_VILLAGE_LEVEL || this.state.progress < 25) return fail('O Grande Totem exige a Era V e a vitória sobre o Leviatã do Pântano.');
    if (!this.spend(wonderCost(this.state.wonder))) return fail('Recursos insuficientes para erguer esta parte do Grande Totem.');
    this.state.wonder++;
    return success(this.state.wonder === WONDER_STAGES ? 'O Grande Totem está completo. Os ancestrais aguardam o renascimento.' : `O Grande Totem cresce: ${this.state.wonder} de ${WONDER_STAGES}.`);
  }

  ascend(): ActionResult {
    if (this.fighting()) return fail('Conclua a expedição antes do ritual.');
    if (this.state.wonder < WONDER_STAGES || this.state.progress < FINAL_STAGE) return fail('O renascimento exige o Grande Totem completo e a vitória no Primeiro Inverno.');
    const gained = embersFor(this.state);
    const keep = { embers: this.state.embers + gained, memories: { ...this.state.memories }, rebirths: this.state.rebirths + 1, endlessRecord: Math.max(this.state.endlessRecord, this.state.endlessBest), settings: { ...this.state.settings }, shopSeed: this.state.shopSeed, lootSeed: this.state.lootSeed, quests: [...this.state.quests], stats: { ...this.state.stats }, clock: this.state.clock };
    this.state = { ...initialState(), ...keep };
    const heritage = 150 * memory(this.state, 'heranca');
    for (const key of RESOURCE_KEYS) this.state.resources[key] += heritage;
    for (let i = 0; i < memory(this.state, 'forja'); i++) this.addItem(this.randomComponent());
    this.battle = null; this.events = [];
    return success(`A tribo renasce com ${gained} brasas ancestrais.`);
  }

  // ——— Experience, hunts and ceremonies ———

  /** Experience gained now, with the cacao circle's blessing. */
  xpBonus(): number { return this.state.clock < this.state.cacao ? 1 + CACAO_XP : 1; }
  /** Adds experience already multiplied by any bonus; returns the levels gained. */
  private gainXp(hero: Hero, amount: number, mentored = true): number {
    if (hero.level >= MAX_HERO_LEVEL || !(amount > 0)) return 0;
    // Newcomers learn faster from the tribe's veterans: +25% per level beyond the first behind the strongest, up to double.
    const top = Math.max(...this.state.heroes.map(other => other.level));
    const mentoring = mentored ? Math.min(2, 1 + 0.25 * Math.max(0, top - hero.level - 1)) : 1;
    const before = hero.level, next = levelFromTotal(totalXp(hero.level, hero.xp) + amount * mentoring);
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

  /** Hunters come home and ceremonies end as the village clock passes their time, offline included. */
  private resolveAway(): void {
    for (const hero of this.state.heroes) {
      const away = hero.away;
      if (!away || this.state.clock < away.until) continue;
      hero.away = null;
      const reached = this.state.clock;
      this.state.clock = away.until;
      if (away.kind === 'hunt') this.finishHunt(hero, away.id as TrailId, !!away.focus);
      else this.finishRitual(hero, away.id as PracticeId, away.until, away.participationXp ?? 0);
      if (away.returnWork && hero.slot === null && this.state.buildings[away.returnWork] > 0
        && this.state.heroes.filter(h => h.work === away.returnWork).length < workerSlots(this.state, away.returnWork)) hero.work = away.returnWork;
      this.state.clock = reached;
    }
  }
  private finishHunt(hero: Hero, trailId: TrailId, focus: boolean): void {
    const trail = trailById(trailId)!;
    this.state.stats.hunts++;
    const ok = this.random() < Math.min(.98,huntChance(hero.stars, hero.panema, hero.rituals.sananga ?? 0)+this.state.settlement.research.tracking*.03);
    const xp = Math.round(trail.xp * (1 - PANEMA_XP_LOSS * hero.panema) * (focus ? 1 + FOCUS_BONUS : 1) * (ok ? 1 : 0.4) * this.xpBonus());
    const levels = this.gainXp(hero, xp);
    const gains = [`+${xp} XP`];
    if (ok) {
      const food = Math.round(trail.food * (1 + 0.15 * (hero.stars - 1)));
      this.addResources({ ...emptyResources(), food });
      gains.push(`+${food} alimento`);
      if (this.random() < trail.component) { const id = this.randomComponent(); if (this.addItem(id)) gains.push(itemById(id)!.name); }
    } else hero.panema = Math.min(MAX_PANEMA, hero.panema + 1);
    const text = ok ? `voltou da ${trail.name} com caça: ${gains.join(', ')}.` : `voltou da ${trail.name} sem caça (${gains[0]}). A panema pesa: ${hero.panema}/${MAX_PANEMA}.`;
    this.report(hero, levels ? `${text} Agora está no nível ${hero.level}!` : text, ok);
  }
  private finishRitual(hero: Hero, id: PracticeId, completedAt: number, bonus = 0): void {
    const practice = practiceById(id)!;
    this.state.stats.rituals++;
    hero.rituals[id] = Math.min(practice.max, (hero.rituals[id] ?? 0) + 1);
    Object.assign(hero, ritualFromTotal(ritualTotalXp(hero.ritualLevel, hero.ritualXp) + RITUAL_XP[id] + bonus));
    hero.ritualReadyAt = completedAt + RITUAL_COOLDOWN;
    this.awaken(hero);
    if (id === 'rape') hero.focus = true;
    if (id === 'sananga') hero.panema = Math.max(0, hero.panema - 1);
    if (id === 'kambo') hero.panema = 0;
    this.report(hero, `concluiu ${practice.name}: +${RITUAL_XP[id] + bonus} XP ritual${bonus ? ` (${bonus} pela participação)` : ''}. Integração de 3 horas antes da próxima cerimônia.`, true);
  }

  /** Sends a hero along a hunting trail; the hero keeps a place in the formation but cannot fight until back. */
  startHunt(uid: string, trailId: string): ActionResult {
    const hero = this.state.heroes.find(entry => entry.uid === uid), trail = trailById(trailId);
    if (!hero || !trail) return fail('Escolha um herói e uma trilha.');
    const name = characterById(hero.characterId).name;
    if (hero.away) return fail(`${name} ainda não voltou.`);
    if (this.inBattle(hero)) return fail(`${name} está em combate.`);
    if (this.state.villageLevel < trail.era) return fail(`Esta trilha se abre na Era ${['I', 'II', 'III', 'IV', 'V'][trail.era - 1]}.`);
    if (hero.level < trail.minLevel) return fail(`${trail.name} exige um herói de nível ${trail.minLevel}.`);
    const out = this.state.heroes.filter(entry => entry.away?.kind === 'hunt').length;
    if (out >= huntSlots(this.state.buildings.hunt)) return fail('Todos os caçadores já estão na mata. Melhore o Acampamento de caça para mandar mais.');
    hero.work = null;
    hero.away = { kind: 'hunt', id: trail.id, until: this.state.clock + trail.minutes * 60, focus: hero.focus };
    hero.focus = false;
    return success(`${name} partiu para a ${trail.name}.`);
  }
  /** Calls a hunter home early, empty-handed. */
  recallHunt(uid: string): ActionResult {
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    if (!hero || hero.away?.kind !== 'hunt') return fail('Este herói não está caçando.');
    hero.focus = hero.focus || !!hero.away.focus;
    hero.away = null;
    return success(`${characterById(hero.characterId).name} voltou da mata sem caça.`);
  }
  /** A ceremony of the Casa de Cura for one hero. */
  performRitual(uid: string, id: string, quality = 0): ActionResult {
    const practice = practiceById(id);
    if (!practice || practice.tribe) return fail('Escolha uma cerimônia para um herói.');
    const level = this.state.buildings.cura;
    if (level < practice.curaLevel) return fail(level ? `${practice.name} exige a Casa de Cura nível ${practice.curaLevel}.` : 'Construa a Casa de Cura primeiro.');
    if (this.state.villageLevel < practice.era) return fail(`${practice.name} chega à tribo na Era ${['I', 'II', 'III', 'IV', 'V'][practice.era - 1]}.`);
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    if (!hero) return fail('Herói não encontrado.');
    const name = characterById(hero.characterId).name;
    if (hero.away) return fail(`${name} está fora da aldeia.`);
    if (this.inBattle(hero)) return fail(`${name} está em combate.`);
    if (hero.level < practice.minLevel) return fail(`${practice.name} pede um herói de nível ${practice.minLevel}.`);
    const done = hero.rituals[practice.id] ?? 0;
    if (this.state.clock < hero.ritualReadyAt) return fail(`${name} está integrando a última cerimônia. Aguarde antes do próximo ritual.`);
    if (practice.requires && !hero.rituals[practice.requires]) return fail(`Antes, ${name} precisa de uma cerimônia de ${practiceById(practice.requires)!.name}.`);
    if (!this.spend(practice.cost(done))) return fail('Faltam recursos para preparar a cerimônia.');
    const returnWork = hero.work ?? undefined;
    hero.work = null;
    hero.away = { kind: 'ritual', id: practice.id, until: this.state.clock + practice.rest / ritualSpeed(this.state), returnWork, participationXp: participationBonus(RITUAL_XP[practice.id], quality) };
    return success(`${name} entrou na cerimônia de ${practice.name}.`);
  }
  /** The cacao circle blesses the whole tribe for a while. */
  holdCacaoCircle(quality = 0): ActionResult {
    const practice = practiceById('cacau')!;
    if (this.state.buildings.cura < practice.curaLevel) return fail(`A roda de cacau exige a Casa de Cura nível ${practice.curaLevel}.`);
    if (this.state.villageLevel < practice.era) return fail('A roda de cacau chega à tribo na Era II.');
    if (this.state.clock < this.state.cacao) return fail('A roda de cacau ainda aquece a tribo.');
    if (!this.spend(practice.cost(0))) return fail('Faltam recursos para a roda de cacau.');
    this.state.cacao = this.state.clock + CACAO_DURATION;
    this.state.stats.rituals++;
    for (const hero of this.state.heroes.filter(hero => !hero.away && this.state.clock >= hero.ritualReadyAt)) {
      Object.assign(hero, ritualFromTotal(ritualTotalXp(hero.ritualLevel, hero.ritualXp) + RITUAL_XP.cacau + participationBonus(RITUAL_XP.cacau, quality)));
      hero.ritualReadyAt = this.state.clock + RITUAL_COOLDOWN;
      this.awaken(hero);
    }
    return success('A tribo se reúne na roda de cacau.');
  }

  claimQuest(id: string): ActionResult {
    const quest = questById(id);
    if (!quest) return fail('Objetivo desconhecido.');
    if (this.state.quests.includes(id)) return fail('Esta recompensa já foi recebida.');
    if (!quest.done(this.state)) return fail('Este objetivo ainda não foi cumprido.');
    this.state.quests.push(id);
    const reward = quest.reward;
    this.addResources({ ...emptyResources(), ...reward.resources });
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
      return entity;
    }
    for (const trait of character.traits) {
      const tier = this.traitTiers.get(trait) ?? 0;
      if (!tier) continue;
      entity.bonds.push(trait);
      switch (trait) {
        case 'Presas': entity.attack *= 1 + 0.15 * tier; break;
        case 'Manada': entity.maxHp *= 1 + 0.2 * tier; break;
        case 'Rio': entity.magicResist += tier > 1 ? 45 : 20; if (tier > 1) entity.regen += 0.015; break;
        case 'Noturno': entity.attackSpeed *= 1 + 0.18 * tier; break;
        case 'Enxame': entity.mana += 20 * tier; break;
        case 'Copa': entity.stealth = 1.5 * tier; break;
        case 'Escamas': addMod(entity, 'damageTaken', tier > 1 ? -0.25 : -0.12, Infinity, 'escamas'); break;
        case 'Ancestral': entity.maxHp *= 1 + 0.2 * tier; entity.attack *= 1 + 0.2 * tier; break;
        case 'Caçador': entity.attackSpeed *= 1 + 0.15 * tier; break;
        case 'Brigão': entity.armor += tier > 1 ? 45 : 20; break;
        case 'Espreitador': entity.attack *= 1 + 0.2 * tier; break;
        case 'Místico': entity.spellPower *= 1 + 0.25 * tier; break;
        case 'Guardião': entity.shield += character.hp[stars - 1] * 0.15 * tier; break;
        case 'Xamã': entity.manaRefund = 0.25 * tier; break;
        case 'Trapaceiro': entity.manaDrain = 5 * tier; break;
        case 'Necrófago': entity.scavenger = true; break;
        case 'Totêmico': case 'Invocador': break;
        default: {
          const rule = TRAIT_RULES[trait];
          const bonus = rule.thresholds.length > 1 ? 0.1 * tier : rule.thresholds[0] === 2 ? 0.12 : 0.1;
          entity.maxHp *= 1 + bonus; entity.attack *= 1 + bonus;
        }
      }
    }
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
      const growth = levelMultiplier(hero.level), r = hero.rituals;
      const tactics=1+this.state.settlement.research.warfare*.04;
      entity.maxHp*=tactics;entity.attack*=tactics;
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
    entity.manaRegen += 2 * (this.traitTiers.get('Totêmico') ?? 0);
    entity.hp = entity.maxHp;
    return entity;
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
    const spirits = chosenSpirits(this.state);
    this.healBonus = spirits.reduce((sum, spirit) => sum + (spirit.passive.healPower ?? 0), 0) + (this.state.clock < this.state.cacao ? CACAO_HEAL : 0);
    this.summonBonus = spirits.reduce((sum, spirit) => sum + (spirit.passive.summonPct ?? 0), 0);
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
    this.battle = { entities: [...allies, ...enemies], zones: [], time: 0, stage: stage.id, depth, region: stage.id ? stage.region : 6, name: stage.name, status: 'fighting', reward: null, loot: [], firstClear, prey: {}, lastCast: {}, powersUsed: [], party: party.map(hero => hero.uid), xp: 0, levelUps: [] };
    if (stage.id < 0) this.battle.region = stage.region;
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
    const boost = owner.team === 'ally' ? (1 + 0.4 * (this.traitTiers.get('Invocador') ?? 0)) * (1 + this.summonBonus) : 1;
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
      if (hero && this.gainXp(hero, battle.xp)) battle.levelUps.push(`${characterById(hero.characterId).name} · nível ${hero.level}`);
    }
    // Raiders who win the fight still escape with provisions.
    if (!victory && battle.stage < 0) { const loss=RAID_PENALTY*(1-raidProtection(this.state)); this.state.resources.wood *= 1 - loss; this.state.resources.food *= 1 - loss; }
    if (!victory) return;
    this.state.stats.victories++;
    if (battle.stage < 0) {
      // A defended village: a generous reward and a guaranteed component.
      const base = stageReward(Math.max(2, this.state.progress * 0.85), false);
      battle.reward = Object.fromEntries(RESOURCE_KEYS.map(key => [key, Math.round(base[key] * 1.2 * (1 + 0.2 * memory(this.state, 'botim')))])) as Resources;
      this.addResources(battle.reward);
      const id = this.randomComponent(); if (this.addItem(id)) battle.loot.push(id);
      return;
    }
    const endless = battle.stage === 0;
    const level = endless ? endlessLevel(battle.depth) : battle.stage;
    const base = stageReward(level, !endless && !battle.firstClear);
    const loot = 1 + 0.2 * memory(this.state, 'botim');
    battle.reward = Object.fromEntries(RESOURCE_KEYS.map(key => [key, Math.round(base[key] * loot)])) as Resources;
    this.addResources(battle.reward);
    const drops = endless ? (battle.depth % 5 === 0 ? 2 : 1) : battle.firstClear ? (stageById(battle.stage)!.index === 5 ? 2 : 1) : this.random() < 0.35 ? 1 : 0;
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
