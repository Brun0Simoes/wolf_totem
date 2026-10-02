import { characters, type Character } from '../data/characters';
import { ALL_CHARACTER_IDS, nextRandom, recruitPrice, rollVisitor, sellRefund, unlockedCost } from './roster';
import { bossScale, endlessLevel, endlessStage, enemyScale, FINAL_STAGE, regionOf, stageById, stageReward, type Stage } from './campaign';
import { COMPONENT_IDS, isComponent, itemById, MAX_ITEMS_PER_HERO, recipeFor, type ItemPerks } from './items';
import { castAbility, SKILL_NOTES } from './skills';
import { MEMORIES, memoryCost, spiritById, spiritsOfEra, type MemoryId, type SpiritId } from './spirits';
import { countTraits, TRAIT_RULES, traitStatus } from './synergies';
import { questById } from './quests';
import { allySlotCenter, BOARD_CENTER, clampX, clampY, ENEMY_SLOTS, enemySlotCenter } from './board';
import { EVENT_TEXT, FIRST_EVENT_AT, nextEventDelay, OMEN_BONUS, OMEN_DURATION, RAID_PENALTY, raidStage, rollEvent, TRIBUTE, type VillageEvent } from './events';

export { SKILL_NOTES, FINAL_STAGE };

/** Pure, deterministic simulation. All times are seconds and positions use board cells. */
export type Resource = 'wood' | 'food' | 'stone' | 'spirit';
export type Resources = Record<Resource, number>;
export type BuildingId = 'lumber' | 'hunt' | 'quarry' | 'shrine' | 'forge';
export type Team = 'ally' | 'enemy';
export interface Hero { uid: string; characterId: number; stars: number; slot: number | null; items: string[]; work: BuildingId | null }
export interface GameState {
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
  stats: { recruits: number; powers: number; victories: number };
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
}
export interface CombatEvent {
  id: number;
  type: 'attack' | 'skill' | 'damage' | 'heal' | 'death' | 'shield' | 'summon' | 'revive' | 'power' | 'phase' | 'overtime';
  sourceId: string;
  targetId?: string;
  amount?: number;
  text?: string;
  x: number;
  y: number;
  time: number;
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
export const BUILDING_KEYS: BuildingId[] = ['lumber', 'hunt', 'quarry', 'shrine', 'forge'];
export const PLAYABLE_IDS = ALL_CHARACTER_IDS;
export const MAX_BUILDING_LEVEL = 15;
export const MAX_VILLAGE_LEVEL = 5;
export const SAVE_VERSION = 2;
export const OFFLINE_CAP_SECONDS = 7200;
export const MAX_ROSTER_SIZE = 18;
export const MAX_INVENTORY = 30;
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
  shrine: ['Xamã', 'Místico', 'Totêmico'], forge: ['Ancestral', 'Escamas', 'Trapaceiro'],
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
  const bonus = (1 + (state.villageLevel - 1) * 0.12) * (1 + 0.25 * memory(state, 'raizes'));
  const omen = (resource: Resource) => state.omen && state.omen.resource === resource && state.clock < state.omen.until ? 1 + OMEN_BONUS : 1;
  const spirit = (resource: Resource) => (1 + chosenSpirits(state).reduce((sum, entry) => sum + (entry.passive.production?.[resource] ?? 0), 0)) * omen(resource);
  return {
    wood: state.buildings.lumber * 1.5 * bonus * spirit('wood') * buildingMultiplier(state, 'lumber'),
    food: state.buildings.hunt * 1.2 * bonus * spirit('food') * buildingMultiplier(state, 'hunt'),
    stone: state.buildings.quarry * 0.85 * bonus * spirit('stone') * buildingMultiplier(state, 'quarry'),
    spirit: state.buildings.shrine * 0.3 * bonus * spirit('spirit') * buildingMultiplier(state, 'shrine'),
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
  const counts = countTraits(state.heroes.filter(hero => hero.slot !== null).map(hero => hero.characterId));
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

const starterHeroes = (): Hero[] => [
  { uid: 'hero-1', characterId: 1, stars: 1, slot: 1, items: [], work: null },
  { uid: 'hero-2', characterId: 3, stars: 1, slot: 2, items: [], work: null },
  { uid: 'hero-3', characterId: 8, stars: 1, slot: 9, items: [], work: null },
];

function initialState(): GameState {
  return {
    resources: { wood: 120, food: 90, stone: 60, spirit: 75 },
    villageLevel: 1,
    buildings: { lumber: 1, hunt: 1, quarry: 1, shrine: 1, forge: 0 },
    heroes: starterHeroes(),
    shop: [1, 2, 4, 6], shopSeed: 7,
    progress: 0, selectedStage: 1, endlessBest: 0, endlessRecord: 0,
    inventory: [], lootSeed: 11, forgeProgress: 0,
    spirits: [], wonder: 0, embers: 0, memories: {}, rebirths: 0,
    settings: { speed: 1, autoRepeat: false },
    quests: [], stats: { recruits: 0, powers: 0, victories: 0 }, clock: 0,
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
    buildings: Object.fromEntries(BUILDING_KEYS.map(key => [key, integer(buildings[key], fallback.buildings[key], key === 'forge' ? 0 : 1, MAX_BUILDING_LEVEL)])) as Record<BuildingId, number>,
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
    stats: { recruits: integer(stats.recruits, 0, 0, 1e9), powers: integer(stats.powers, 0, 0, 1e9), victories: integer(stats.victories, 0, 0, 1e9) },
    clock: finite(input.clock, 0, 0, 1e12),
    event: sanitizeEvent(input.event),
    omen: sanitizeOmen(input.omen),
  };
  state.nextEventAt = finite(input.nextEventAt, state.clock + FIRST_EVENT_AT, 0, state.clock + 3600);
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
      let slot: number | null = typeof hero.slot === 'number' && Number.isInteger(hero.slot) && hero.slot >= 0 && hero.slot < 12 ? hero.slot : null;
      if (slot !== null && (slots.has(slot) || slots.size >= capacity(state))) slot = null;
      if (slot !== null) slots.add(slot);
      let work = slot === null && typeof hero.work === 'string' && BUILDING_KEYS.includes(hero.work as BuildingId) ? hero.work as BuildingId : null;
      if (work && (workers.get(work) ?? 0) >= workerSlots(state, work)) work = null;
      if (work) workers.set(work, (workers.get(work) ?? 0) + 1);
      const items = Array.isArray(hero.items) ? hero.items.filter(id => typeof id === 'string' && !!itemById(id)).slice(0, MAX_ITEMS_PER_HERO) as string[] : [];
      return [{ uid, characterId: hero.characterId as number, stars: integer(hero.stars, 1, 1, 3), slot, items, work }];
    });
    if (!state.heroes.length) state.heroes = starterHeroes();
  }
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

  /** A save can be the serialized JSON string or the parsed versioned save object. */
  constructor(save?: unknown, now = Date.now()) {
    this.state = initialState();
    if (typeof save === 'string') { try { save = JSON.parse(save); } catch { return; } }
    const root = record(save);
    if (root.version !== 1 && root.version !== SAVE_VERSION) return;
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
    this.state.clock += seconds;
    this.updateEvents();
    const rates = getRates(this.state);
    this.addResources(Object.fromEntries(RESOURCE_KEYS.map(key => [key, rates[key] * seconds])) as Resources);
    const rate = forgeRate(this.state);
    if (rate <= 0) return;
    this.state.forgeProgress += rate * seconds;
    while (this.state.forgeProgress >= 1 && this.addItem(this.randomComponent())) this.state.forgeProgress -= 1;
    this.state.forgeProgress = Math.min(1, this.state.forgeProgress);
  }

  /** Unanswered raiders steal provisions; a quiet village sees a new event every few minutes from the second era. */
  private updateEvents(): void {
    const s = this.state;
    if (s.omen && s.clock >= s.omen.until) s.omen = null;
    if (s.event && s.clock > s.event.expires) {
      if (s.event.kind === 'raid') { s.resources.wood *= 1 - RAID_PENALTY; s.resources.food *= 1 - RAID_PENALTY; }
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
        s.heroes.push({ uid: this.newUid(), characterId: event.characterId!, stars: 1, slot: null, items: [], work: null });
        return success(`${characterById(event.characterId!).name} juntou-se à tribo.`);
    }
    return fail('Acontecimento desconhecido.');
  }

  /** Production for time spent away from the page while it stays open (the battle clock does not run). */
  catchUp(seconds: number): void {
    if (this.state.paused || !Number.isFinite(seconds) || seconds <= 0) return;
    this.produce(Math.min(OFFLINE_CAP_SECONDS, seconds));
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
    return success(level === 0 ? 'A Forja de Osso foi erguida. Componentes começam a surgir.' : `Construção melhorada para o nível ${level + 1}.`);
  }

  upgradeVillage(): ActionResult {
    if (this.state.villageLevel >= MAX_VILLAGE_LEVEL) return fail('A aldeia chegou ao nível máximo.');
    if (!this.spend(villageCost(this.state.villageLevel))) return fail('Reúna os recursos necessários para expandir a aldeia.');
    this.state.villageLevel++;
    // The new cost tier arrives immediately with a free visit.
    if (!this.fighting()) this.refreshShop();
    return success(`Era ${this.state.villageLevel}! Escolha um Espírito Protetor. Heróis de custo ${unlockedCost(this.state.villageLevel)} chegam à fogueira.`);
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
    const shopIndex = this.state.shop.indexOf(characterId);
    if (shopIndex < 0) return fail('Este herói não está disponível nesta visita.');
    const character = characterById(characterId);
    if (character.cost > unlockedCost(this.state.villageLevel)) return fail(`${character.name} só atende ao chamado de uma aldeia de nível ${character.cost}.`);
    const duplicates = this.state.heroes.filter(hero => hero.characterId === characterId && hero.stars === 1);
    if (this.state.heroes.length >= MAX_ROSTER_SIZE && duplicates.length < 2) return fail('A reserva está cheia. Combine ou libere um herói.');
    const cost = recruitCost(characterId, this.state);
    if (!this.spend(cost)) return fail(`O recrutamento custa ${cost.spirit} de espírito e ${cost.food} de alimento.`);
    this.state.heroes.push({ uid: this.newUid(), characterId, stars: 1, slot: null, items: [], work: null });
    this.state.stats.recruits++;
    let combined = false;
    for (const stars of [1, 2]) {
      let matching = this.state.heroes.filter(hero => hero.characterId === characterId && hero.stars === stars);
      while (matching.length >= 3) {
        // Preserve a deployed (or working) instance and its place when the three copies merge.
        matching.sort((a, b) => Number(b.slot !== null) - Number(a.slot !== null) || Number(b.work !== null) - Number(a.work !== null) || b.items.length - a.items.length);
        const [keeper, ...consumed] = matching.slice(0, 3);
        const consumedIds = new Set(consumed.map(hero => hero.uid));
        keeper.stars++;
        for (const hero of consumed) for (const item of hero.items) {
          if (keeper.items.length < MAX_ITEMS_PER_HERO) keeper.items.push(item); else this.addItem(item);
        }
        this.state.heroes = this.state.heroes.filter(hero => !consumedIds.has(hero.uid));
        combined = true;
        matching = this.state.heroes.filter(hero => hero.characterId === characterId && hero.stars === stars);
      }
    }
    this.state.shop[shopIndex] = this.nextShopHero(this.state.shop.filter((_, index) => index !== shopIndex));
    return success(combined ? `${character.name} evoluiu! Três cópias formam uma estrela superior.` : `${character.name} chegou à reserva.`);
  }

  rerollShop(): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate.');
    if (!this.spend(REROLL_COST)) return fail('São necessários 8 de espírito para uma nova visita.');
    this.refreshShop();
    return success('Novos heróis chegaram à fogueira.');
  }

  deploy(uid: string, slot: number | null): ActionResult {
    if (this.fighting()) return fail('A formação está em combate.');
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    if (!hero) return fail('Herói não encontrado.');
    if (slot !== null && (!Number.isInteger(slot) || slot < 0 || slot >= 12)) return fail('Escolha um lugar válido da formação.');
    const occupant = slot === null ? undefined : this.state.heroes.find(entry => entry.uid !== uid && entry.slot === slot);
    const deployed = this.state.heroes.filter(entry => entry.slot !== null).length;
    if (slot !== null && hero.slot === null && !occupant && deployed >= capacity(this.state)) return fail('Formação cheia. Expanda a aldeia para levar mais heróis.');
    if (occupant) occupant.slot = hero.slot;
    hero.slot = slot;
    if (slot !== null) hero.work = null;
    return success(slot === null ? 'Herói movido para a reserva.' : 'Formação atualizada.');
  }

  assignWorker(uid: string, building: BuildingId | null): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate.');
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    if (!hero) return fail('Herói não encontrado.');
    if (building === null) { hero.work = null; return success(`${characterById(hero.characterId).name} voltou a descansar.`); }
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
      dealt: 0, taken: 0, healed: 0, shielded: 0, phased: false,
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
    const party = this.state.heroes.filter(hero => hero.slot !== null);
    if (!party.length) return fail('Posicione pelo menos um herói no campo.');
    if (party.length > capacity(this.state)) return fail('Há heróis demais na formação.');
    this.traitTiers = new Map(getSynergies(this.state).filter(synergy => synergy.active).map(synergy => [synergy.name, synergy.tier]));
    const spirits = chosenSpirits(this.state);
    this.healBonus = spirits.reduce((sum, spirit) => sum + (spirit.passive.healPower ?? 0), 0);
    this.summonBonus = spirits.reduce((sum, spirit) => sum + (spirit.passive.summonPct ?? 0), 0);
    const allies = party.map((hero, index) => this.entity(hero.characterId, hero.stars, 'ally', index, hero.slot!, 0, hero));
    for (const ally of allies) {
      if (!ally.perks.teamShield) continue;
      for (const other of allies.filter(other => distance(other, ally) <= 1.1)) other.shield += ally.maxHp * ally.perks.teamShield;
    }
    const enemies = stage.units.map((unit, index) => this.entity(unit.id, unit.stars, 'enemy', index, ENEMY_SLOTS[index], level, undefined, !!unit.boss, stage.region));
    this.events = [];
    this.summonCounter = 0;
    const firstClear = stage.id > 0 && stage.id > this.state.progress;
    this.battle = { entities: [...allies, ...enemies], zones: [], time: 0, stage: stage.id, depth, region: stage.id ? stage.region : 6, name: stage.name, status: 'fighting', reward: null, loot: [], firstClear, prey: {}, lastCast: {}, powersUsed: [] };
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
    this.events.push({ id: ++this.eventCounter, type, sourceId: source.id, targetId: target?.id, amount, text, x: (target ?? source).x, y: (target ?? source).y, time: this.battle!.time });
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
    source.action = 'cast'; source.actionTime = 0.6; source.cooldown = Math.max(source.cooldown, 0.6);
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
    entity.action = 'attack'; entity.actionTime = 0.25;
    if (target.huntMarked > 0) entity.haste = Math.max(entity.haste, 1.5);
    entity.attackCount++;
    const perks = entity.perks;
    if (perks.asStack) addMod(entity, 'attackSpeed', perks.asStack * Math.min(10, entity.attackCount), Infinity, 'garra');
    entity.cooldown = 1 / attackRate(entity);
    this.emit('attack', entity, target);
    const third = entity.attackCount % 3 === 0;
    const power = effectiveAttack(entity);
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
    for (const entity of [...battle.entities]) {
      if (entity.hp <= 0) continue;
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
      if (entity.stun > 0 && !(entity.characterId === 4 && entity.mana >= entity.manaMax)) { entity.action = 'idle'; continue; }
      const target = this.chooseTarget(entity);
      if (!target) { if (!this.opponents(entity).length) break; entity.action = 'idle'; continue; }
      if (entity.actionTime > 0) continue;
      if (entity.mana >= entity.manaMax && entity.manaMax > 0) { this.cast(entity, target); continue; }
      const gap = distance(entity, target);
      if (gap > entity.range + 0.15) {
        const step = Math.min(gap - entity.range, dt * 1.5);
        entity.x += (target.x - entity.x) / gap * step;
        entity.y += (target.y - entity.y) / gap * step;
        entity.action = 'walk';
      } else if (entity.cooldown <= 0) this.basicAttack(entity, target);
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
    battle.zones = [];
    for (const entity of battle.entities) if (entity.summon && entity.hp > 0) { entity.hp = 0; entity.action = 'dead'; }
    // Raiders who win the fight still escape with provisions.
    if (!victory && battle.stage < 0) { this.state.resources.wood *= 1 - RAID_PENALTY; this.state.resources.food *= 1 - RAID_PENALTY; }
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
