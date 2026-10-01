import { characters, type Character } from '../data/characters';
import { ALL_CHARACTER_IDS, WAVES, recruitPrice, rollVisitor, sellRefund, unlockedCost } from './roster';
import { castAbility, SKILL_NOTES } from './skills';
import { countTraits, TRAIT_RULES, traitStatus } from './synergies';

export { SKILL_NOTES };

/** Pure, deterministic simulation. All times are seconds and positions use board cells. */
export type Resource = 'wood' | 'food' | 'stone' | 'spirit';
export type Resources = Record<Resource, number>;
export type BuildingId = 'lumber' | 'hunt' | 'quarry' | 'shrine';
export type Team = 'ally' | 'enemy';
export interface Hero { uid: string; characterId: number; stars: number; slot: number | null }
export interface GameState {
  resources: Resources;
  villageLevel: number;
  buildings: Record<BuildingId, number>;
  heroes: Hero[];
  shop: number[];
  shopSeed: number;
  wave: number;
  victories: number;
  paused: boolean;
}
export interface ActionResult { ok: boolean; message: string }
export interface Synergy { name: string; count: number; threshold: number; thresholds: number[]; tier: number; active: boolean; description: string }
export type SummonKind = 'spider' | 'crow' | 'beetle' | 'echo' | 'elephant';
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
}
export interface CombatEvent {
  id: number;
  type: 'attack' | 'skill' | 'damage' | 'heal' | 'death' | 'shield' | 'summon' | 'revive';
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
  wave: number;
  name: string;
  status: 'fighting' | 'victory' | 'defeat';
  reward: Resources | null;
  prey: Partial<Record<Team, { id: string; time: number }>>;
  lastCast: Partial<Record<Team, number>>;
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
const BUILDING_KEYS: BuildingId[] = ['lumber', 'hunt', 'quarry', 'shrine'];
export const PLAYABLE_IDS = ALL_CHARACTER_IDS;
export const MAX_BUILDING_LEVEL = 10;
export const MAX_VILLAGE_LEVEL = 5;
export const MAX_WAVE = WAVES.length;
export const SAVE_VERSION = 1;
export const OFFLINE_CAP_SECONDS = 7200;
export const MAX_ROSTER_SIZE = 18;
export const SHOP_SIZE = 4;
const MAX_SUMMONS_PER_OWNER = 6;
const BOARD = { maxX: 3, maxY: 5 };

export function characterById(id: number): Character {
  return characters.find(character => character.id === id) ?? characters[0];
}
export const emptyResources = (): Resources => ({ wood: 0, food: 0, stone: 0, spirit: 0 });
export const capacity = (state: GameState): number => 2 + state.villageLevel;

export function getRates(state: GameState): Resources {
  const bonus = 1 + (state.villageLevel - 1) * 0.12;
  return {
    wood: state.buildings.lumber * 1.5 * bonus,
    food: state.buildings.hunt * 1.2 * bonus,
    stone: state.buildings.quarry * 0.85 * bonus,
    spirit: state.buildings.shrine * 0.3 * bonus,
  };
}

/** level is the current building level; this returns the price of its next level. */
export function buildingCost(id: BuildingId, level: number): Resources {
  const growth = Math.pow(1.65, Math.max(0, level - 1));
  return {
    wood: Math.ceil((id === 'lumber' ? 35 : 45) * growth),
    food: id === 'hunt' ? Math.ceil(15 * growth) : 0,
    stone: Math.ceil((id === 'shrine' ? 35 : 20) * growth),
    spirit: id === 'shrine' ? Math.ceil(10 * growth) : 0,
  };
}

/** level is the current village level. */
export function villageCost(level: number): Resources {
  const growth = Math.pow(2.25, Math.max(0, level - 1));
  return { wood: Math.ceil(120 * growth), food: Math.ceil(80 * growth), stone: Math.ceil(60 * growth), spirit: Math.ceil(20 * growth) };
}
export function recruitCost(characterId = 1): Resources {
  const price = recruitPrice(characterById(characterId).cost);
  return { wood: 0, food: price.food, stone: 0, spirit: price.spirit };
}
export const REROLL_COST: Resources = { wood: 0, food: 0, stone: 0, spirit: 8 };
export const GATHER_AMOUNT: Resources = { wood: 5, food: 4, stone: 3, spirit: 2 };

export function getSynergies(state: GameState): Synergy[] {
  const counts = countTraits(state.heroes.filter(hero => hero.slot !== null).map(hero => hero.characterId));
  return [...counts].map(([name, count]) => {
    const status = traitStatus(name, count);
    return { name, count, threshold: status.next, thresholds: status.thresholds, tier: status.tier, active: status.tier > 0, description: status.description };
  }).sort((a, b) => Number(b.active) - Number(a.active) || b.tier - a.tier || b.count - a.count || a.name.localeCompare(b.name));
}

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
  entity.x = Math.max(0, Math.min(BOARD.maxX, entity.x));
  entity.y = Math.max(0, Math.min(BOARD.maxY, entity.y));
};

function initialState(): GameState {
  return {
    resources: { wood: 120, food: 90, stone: 60, spirit: 75 },
    villageLevel: 1,
    buildings: { lumber: 1, hunt: 1, quarry: 1, shrine: 1 },
    heroes: [{ uid: 'hero-1', characterId: 1, stars: 1, slot: 1 }, { uid: 'hero-2', characterId: 3, stars: 1, slot: 2 }, { uid: 'hero-3', characterId: 8, stars: 1, slot: 9 }],
    shop: [1, 2, 4, 6], shopSeed: 7,
    wave: 1, victories: 0, paused: false,
  };
}

function sanitizeState(value: unknown): GameState {
  const input = record(value);
  const fallback = initialState();
  const resources = record(input.resources);
  const buildings = record(input.buildings);
  const state: GameState = {
    ...fallback,
    resources: Object.fromEntries(RESOURCE_KEYS.map(key => [key, finite(resources[key], fallback.resources[key], 0, 10_000_000)])) as Resources,
    buildings: Object.fromEntries(BUILDING_KEYS.map(key => [key, integer(buildings[key], 1, 1, MAX_BUILDING_LEVEL)])) as Record<BuildingId, number>,
    villageLevel: integer(input.villageLevel, 1, 1, MAX_VILLAGE_LEVEL),
    wave: integer(input.wave, 1, 1, MAX_WAVE + 1),
    victories: integer(input.victories, 0, 0, MAX_WAVE),
    paused: input.paused === true,
    // Saves from 0.3 stored a rotation index; it is a valid starting seed.
    shopSeed: integer(input.shopSeed ?? input.shopRotation, 7, 0, 4294967295),
  };
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
      let slot: number | null = typeof hero.slot === 'number' && Number.isInteger(hero.slot) && hero.slot >= 0 && hero.slot < 12 ? hero.slot : null;
      if (slot !== null && (slots.has(slot) || slots.size >= capacity(state))) slot = null;
      if (slot !== null) slots.add(slot);
      return [{ uid, characterId: hero.characterId as number, stars: integer(hero.stars, 1, 1, 3), slot }];
    });
    if (!state.heroes.length) state.heroes = fallback.heroes;
  }
  const allowed = (id: unknown) => PLAYABLE_IDS.includes(id as number) && characterById(id as number).cost <= unlockedCost(state.villageLevel);
  const shop = Array.isArray(input.shop) ? [...new Set(input.shop.filter(allowed))] as number[] : [];
  state.shop = [...shop, ...PLAYABLE_IDS.filter(id => !shop.includes(id) && allowed(id))].slice(0, SHOP_SIZE);
  state.victories = state.wave - 1;
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

  /** A save can be the serialized JSON string or the parsed versioned save object. */
  constructor(save?: unknown, now = Date.now()) {
    this.state = initialState();
    if (typeof save === 'string') { try { save = JSON.parse(save); } catch { return; } }
    const root = record(save);
    if (root.version !== SAVE_VERSION) return;
    this.state = sanitizeState(root.state);
    const savedAt = finite(root.savedAt, now, 0, Number.MAX_SAFE_INTEGER);
    this.offlineSeconds = this.state.paused ? 0 : Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (now - savedAt) / 1000));
    if (this.offlineSeconds > 0) {
      this.offlineGains = emptyResources();
      const rates = getRates(this.state);
      for (const key of RESOURCE_KEYS) {
        this.offlineGains[key] = rates[key] * this.offlineSeconds;
        this.state.resources[key] = Math.min(10_000_000, this.state.resources[key] + this.offlineGains[key]);
      }
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
    for (const key of RESOURCE_KEYS) this.state.resources[key] = Math.min(10_000_000, this.state.resources[key] + resources[key]);
  }
  private fighting(): boolean { return this.battle?.status === 'fighting'; }

  gather(resource: Resource): ActionResult {
    if (!RESOURCE_KEYS.includes(resource)) return fail('Recurso desconhecido.');
    if (this.state.paused) return fail('Retome o tempo para coletar.');
    this.state.resources[resource] = Math.min(10_000_000, this.state.resources[resource] + GATHER_AMOUNT[resource]);
    return success(`+${GATHER_AMOUNT[resource]}`);
  }

  upgradeBuilding(id: BuildingId): ActionResult {
    if (!BUILDING_KEYS.includes(id)) return fail('Construção desconhecida.');
    const level = this.state.buildings[id];
    if (level >= MAX_BUILDING_LEVEL) return fail('Esta construção chegou ao nível máximo.');
    if (!this.spend(buildingCost(id, level))) return fail('Recursos insuficientes para melhorar a construção.');
    this.state.buildings[id]++;
    return success(`Construção melhorada para o nível ${level + 1}.`);
  }

  upgradeVillage(): ActionResult {
    if (this.state.villageLevel >= MAX_VILLAGE_LEVEL) return fail('A aldeia chegou ao nível máximo.');
    if (!this.spend(villageCost(this.state.villageLevel))) return fail('Reúna os recursos necessários para expandir a aldeia.');
    this.state.villageLevel++;
    // The new cost tier arrives immediately with a free visit.
    if (!this.fighting()) this.refreshShop();
    return success(`Aldeia nível ${this.state.villageLevel}. Mais um lugar na formação e heróis de custo ${unlockedCost(this.state.villageLevel)} chegam à fogueira!`);
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
    for (let i = 0; i < SHOP_SIZE; i++) next.push(this.nextShopHero(next));
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
    const cost = recruitCost(characterId);
    if (!this.spend(cost)) return fail(`O recrutamento custa ${cost.spirit} de espírito e ${cost.food} de alimento.`);
    this.state.heroes.push({ uid: this.newUid(), characterId, stars: 1, slot: null });
    let combined = false;
    for (const stars of [1, 2]) {
      let matching = this.state.heroes.filter(hero => hero.characterId === characterId && hero.stars === stars);
      while (matching.length >= 3) {
        // Preserve a deployed instance and its position when the three copies merge.
        matching.sort((a, b) => Number(b.slot !== null) - Number(a.slot !== null));
        const [keeper, ...consumed] = matching.slice(0, 3);
        const consumedIds = new Set(consumed.map(hero => hero.uid));
        keeper.stars++;
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
    return success(slot === null ? 'Herói movido para a reserva.' : 'Formação atualizada.');
  }

  sellHero(uid: string): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate.');
    if (this.state.heroes.length <= 1) return fail('Mantenha pelo menos um herói na aldeia.');
    const hero = this.state.heroes.find(entry => entry.uid === uid);
    if (!hero) return fail('Herói não encontrado.');
    this.state.heroes = this.state.heroes.filter(entry => entry.uid !== uid);
    this.state.resources.spirit += sellRefund(characterById(hero.characterId).cost, hero.stars);
    return success('Herói liberado. Parte do espírito foi devolvida.');
  }

  togglePause(): boolean { this.state.paused = !this.state.paused; return this.state.paused; }

  private blankEntity(character: Character, team: Team, id: string, stars: number): CombatEntity {
    return {
      id, characterId: character.id, team, name: character.name, stars, cost: character.cost,
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
    };
  }

  private entity(characterId: number, stars: number, team: Team, index: number, slot: number, uid?: string): CombatEntity {
    const character = characterById(characterId);
    const entity = this.blankEntity(character, team, `${team}-${index}`, stars);
    entity.uid = uid;
    entity.x = slot % 4;
    entity.y = team === 'ally' ? 3 + Math.floor(slot / 4) : 2 - Math.floor(slot / 4);
    entity.cooldown = index * 0.08;
    if (team === 'enemy') {
      // Higher costs carry stronger canonical stats, so their wave scaling is softened.
      const scale = (0.65 + this.state.wave * 0.055) / (1 + 0.1 * (character.cost - 1));
      entity.hp *= scale; entity.maxHp *= scale; entity.attack *= scale;
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
    entity.mana = Math.min(entity.manaMax, entity.mana);
    entity.manaRegen += 2 * (this.traitTiers.get('Totêmico') ?? 0);
    entity.hp = entity.maxHp;
    return entity;
  }

  startBattle(): ActionResult {
    if (this.state.paused) return fail('Retome o tempo antes de iniciar a expedição.');
    if (this.battle) return fail('Conclua ou feche a expedição atual.');
    if (this.state.wave > MAX_WAVE) return fail(`Você concluiu as ${MAX_WAVE} expedições desta versão.`);
    const party = this.state.heroes.filter(hero => hero.slot !== null);
    if (!party.length) return fail('Posicione pelo menos um herói no campo.');
    if (party.length > capacity(this.state)) return fail('Há heróis demais na formação.');
    this.traitTiers = new Map(getSynergies(this.state).filter(synergy => synergy.active).map(synergy => [synergy.name, synergy.tier]));
    const allies = party.map((hero, index) => this.entity(hero.characterId, hero.stars, 'ally', index, hero.slot!, hero.uid));
    const wave = this.state.wave;
    const definition = WAVES[wave - 1];
    const enemySlots = [1, 2, 5, 6, 0, 3, 8, 11];
    const enemies = definition.units.map((unit, index) => this.entity(unit.id, unit.stars, 'enemy', index, enemySlots[index]));
    this.events = [];
    this.summonCounter = 0;
    this.battle = { entities: [...allies, ...enemies], zones: [], time: 0, wave, name: definition.name, status: 'fighting', reward: null, prey: {}, lastCast: {} };
    return success(`Expedição ${wave} · ${definition.name}: a caçada começou.`);
  }

  dismissBattle(): ActionResult {
    if (this.fighting()) return fail('A expedição ainda está em andamento.');
    this.battle = null;
    this.events = [];
    return success('De volta à aldeia.');
  }

  /** Call each frame with elapsed simulation seconds. One call is capped at 60 s. */
  tick(dtSeconds: number): void {
    if (this.state.paused || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return;
    const dt = Math.min(60, dtSeconds);
    const rates = getRates(this.state);
    this.addResources(Object.fromEntries(RESOURCE_KEYS.map(key => [key, rates[key] * dt])) as Resources);
    let remaining = dt;
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

  private damage(source: CombatEntity, target: CombatEntity, raw: number, magic = false, trueDamage = false): number {
    if (target.hp <= 0 || target.dodge > 0 || !(raw > 0)) return 0;
    const resist = trueDamage ? 0 : Math.max(0, magic ? effectiveMagicResist(target) : effectiveArmor(target));
    let multiplier = 100 / (100 + resist) * (target.guard > 0 ? 0.45 : 1) * (target.marked > 0 ? 1.2 : 1);
    multiplier *= Math.max(0.2, 1 + modTotal(target, 'damageTaken'));
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
    target.mana = Math.min(target.manaMax, target.mana + 5);
    this.emit('damage', source, target, Math.round(dealt));
    const lifesteal = source !== target ? modTotal(source, 'lifesteal') : 0;
    if (lifesteal > 0 && dealt > 0) this.heal(source, source, dealt * lifesteal);
    if (target.hp <= 0) this.handleDeath(target, source);
    return dealt;
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
    const healed = Math.min(amount * (target.antiheal > 0 ? 0.5 : 1), target.maxHp - target.hp);
    target.hp += healed;
    if (healed > 0) this.emit('heal', source, target, Math.round(healed));
  }
  private giveShield(source: CombatEntity, target: CombatEntity, amount: number): void {
    if (target.hp <= 0 || !(amount > 0)) return;
    target.shield += amount;
    this.emit('shield', source, target, Math.round(amount));
  }

  private summon(owner: CombatEntity, kind: SummonKind, spec: SummonSpec): CombatEntity | null {
    const battle = this.battle!;
    if (battle.entities.filter(entity => entity.ownerId === owner.id && entity.hp > 0).length >= MAX_SUMMONS_PER_OWNER) return null;
    const character = characterById(spec.characterId ?? owner.characterId);
    const entity = this.blankEntity(character, owner.team, `${owner.team}-s${++this.summonCounter}`, spec.stars ?? owner.stars);
    const boost = owner.team === 'ally' ? 1 + 0.4 * (this.traitTiers.get('Invocador') ?? 0) : 1;
    const index = this.summonCounter;
    entity.summon = kind; entity.ownerId = owner.id;
    entity.name = kind === 'echo' ? `Eco de ${character.name}` : { spider: 'Cria de seda', crow: 'Corvo', beetle: 'Escaravelho', elephant: 'Espírito do marfim' }[kind];
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
    source.mana = Math.min(source.manaMax, source.mana + source.manaMax * source.manaRefund);
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
    entity.cooldown = 1 / attackRate(entity);
    this.emit('attack', entity, target);
    const power = effectiveAttack(entity);
    this.damage(entity, target, power);
    const cleave = modTotal(entity, 'cleave');
    if (cleave > 0) for (const other of this.opponents(entity).filter(other => other !== target && distance(other, target) <= 1.3)) this.damage(entity, other, power * cleave);
    if (entity.manaMax > 0) entity.mana = Math.min(entity.manaMax, entity.mana + 12);
    if (entity.manaDrain > 0) target.mana = Math.max(0, target.mana - entity.manaDrain);
    if (entity.empowered > 0) { target.poison = 4; target.poisonDamage = power * 0.45; }
  }

  private combatStep(dt: number): void {
    const battle = this.battle!;
    battle.time += dt;
    this.events = this.events.filter(event => battle.time - event.time < 2);
    for (const team of ['ally', 'enemy'] as const) {
      const prey = battle.prey[team];
      if (prey) { prey.time -= dt; if (prey.time <= 0) delete battle.prey[team]; }
    }
    this.processZones(dt);
    for (const entity of [...battle.entities]) {
      if (entity.hp <= 0) continue;
      const wasGuarded = entity.guard > 0;
      const wasPoisoned = entity.poison > 0;
      for (const key of ['stun', 'slow', 'haste', 'guard', 'poison', 'marked', 'huntMarked', 'empowered', 'dodge', 'actionTime', 'cooldown', 'stealth', 'taunt', 'wet', 'hex', 'antiheal', 'transform', 'omen'] as const) entity[key] = Math.max(0, entity[key] - dt);
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
      if (entity.regen > 0) entity.hp = Math.min(entity.maxHp, entity.hp + entity.maxHp * entity.regen * dt * (entity.antiheal > 0 ? 0.5 : 1));
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
    if (victory) {
      battle.reward = { wood: 35 + battle.wave * 12, food: 30 + battle.wave * 10, stone: 20 + battle.wave * 8, spirit: 35 + battle.wave * 8 };
      this.addResources(battle.reward);
      this.state.wave = Math.min(MAX_WAVE + 1, battle.wave + 1);
      this.state.victories = this.state.wave - 1;
    }
  }
}
