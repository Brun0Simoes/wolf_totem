import { characters, type Character } from '../data/characters';

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
  shopRotation: number;
  wave: number;
  victories: number;
  paused: boolean;
}
export interface ActionResult { ok: boolean; message: string }
export interface Synergy { name: string; count: number; threshold: number; active: boolean; description: string }
export interface CombatEntity {
  id: string;
  uid?: string;
  characterId: number;
  name: string;
  team: Team;
  stars: number;
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
}
export interface CombatEvent {
  id: number;
  type: 'attack' | 'skill' | 'damage' | 'heal' | 'death' | 'shield';
  sourceId: string;
  targetId?: string;
  amount?: number;
  text?: string;
  x: number;
  y: number;
  time: number;
}
export interface BattleState {
  entities: CombatEntity[];
  time: number;
  wave: number;
  status: 'fighting' | 'victory' | 'defeat';
  reward: Resources | null;
}

const RESOURCE_KEYS: Resource[] = ['wood', 'food', 'stone', 'spirit'];
const BUILDING_KEYS: BuildingId[] = ['lumber', 'hunt', 'quarry', 'shrine'];
const PLAYABLE_IDS = Array.from({ length: 13 }, (_, i) => i + 1);
export const MAX_BUILDING_LEVEL = 10;
export const MAX_VILLAGE_LEVEL = 5;
export const MAX_WAVE = 12;
export const SAVE_VERSION = 1;
export const OFFLINE_CAP_SECONDS = 7200;
export const MAX_ROSTER_SIZE = 18;

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
export function recruitCost(_characterId = 1): Resources { return { wood: 0, food: 15, stone: 0, spirit: 30 }; }
export const REROLL_COST: Resources = { wood: 0, food: 0, stone: 0, spirit: 8 };
export const GATHER_AMOUNT: Resources = { wood: 5, food: 4, stone: 3, spirit: 2 };

const SYNERGY_RULES: Record<string, string> = {
  Presas: '+15% de ataque para os heróis de Presas.',
  Manada: '+20% de vida para os heróis de Manada.',
  Rio: '+20 de resistência mágica para os heróis de Rio.',
  Noturno: '+18% de velocidade de ataque para os heróis de Noturno.',
  Enxame: '+20 de mana inicial para os heróis de Enxame.',
  'Caçador': '+15% de velocidade de ataque para os Caçadores.',
  'Brigão': '+20 de armadura para os Brigões.',
  Espreitador: '+20% de ataque para os Espreitadores.',
  'Místico': '+25% de cura e de dano de habilidades para os Místicos.',
};
export function getSynergies(state: GameState): Synergy[] {
  const unique = new Set(state.heroes.filter(hero => hero.slot !== null).map(hero => hero.characterId));
  const counts = new Map<string, number>();
  for (const id of unique) for (const trait of characterById(id).traits) {
    if (SYNERGY_RULES[trait]) counts.set(trait, (counts.get(trait) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, count, threshold: 2, active: count >= 2, description: SYNERGY_RULES[name] }))
    .sort((a, b) => Number(b.active) - Number(a.active) || b.count - a.count || a.name.localeCompare(b.name));
}

/** First-slice interpretations of the provided character plan; not full Set 1 rules. */
export const SKILL_NOTES: Record<number, string> = {
  1: 'Golpe de 150/225/340% do ataque; marca a presa e acelera aliados que a atacam.',
  2: 'A teia causa dano periódico por 5 s e desacelera inimigos próximos; as manifestações são representadas pelo dano periódico.',
  3: 'Avança até a presa, causa 150% do ataque, atordoa por 1 s e recebe escudo.',
  4: 'Remove o atordoamento, evita dano por 1 s e envenena os próximos ataques por 6 s.',
  5: 'Causa 160% do ataque e transfere 12% do ataque da presa para si, até um limite.',
  6: 'Cura aliados e causa dano mágico aos inimigos numa chuva sobre todo o campo.',
  7: 'Causa 170% do ataque; o dano dobra contra presas abaixo de 40% de vida. Uma execução cura Taka.',
  8: 'Acerta e marca o inimigo mais distante, que recebe 20% de dano adicional por 6 s.',
  9: 'Recebe escudo e reduz o dano por 4 s; ao terminar, causa dano ao redor.',
  10: 'Três cortes causam 225% do ataque e aplicam sangramento por 4 s.',
  11: 'O totem concede 5 s de velocidade de ataque e 15 de mana para os outros aliados.',
  12: 'Um dardo perfura até três inimigos, causando 180% do ataque ao primeiro e 120% aos demais.',
  13: 'Uma onda atinge até três inimigos próximos e reduz sua velocidade de ataque por 5 s.',
};

const success = (message: string): ActionResult => ({ ok: true, message });
const fail = (message: string): ActionResult => ({ ok: false, message });
const finite = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
const integer = (value: unknown, fallback: number, min: number, max: number): number => Math.floor(finite(value, fallback, min, max));
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const distance = (a: CombatEntity, b: CombatEntity): number => Math.hypot(a.x - b.x, a.y - b.y);

function initialState(): GameState {
  return {
    resources: { wood: 120, food: 90, stone: 60, spirit: 75 },
    villageLevel: 1,
    buildings: { lumber: 1, hunt: 1, quarry: 1, shrine: 1 },
    heroes: [{ uid: 'hero-1', characterId: 1, stars: 1, slot: 1 }, { uid: 'hero-2', characterId: 3, stars: 1, slot: 2 }, { uid: 'hero-3', characterId: 8, stars: 1, slot: 9 }],
    shop: [1, 2, 4, 6], shopRotation: 7,
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
    shopRotation: integer(input.shopRotation, 7, 0, 1_000_000),
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
  const shop = Array.isArray(input.shop) ? [...new Set(input.shop.filter(id => PLAYABLE_IDS.includes(id as number)))] as number[] : [];
  state.shop = [...shop, ...PLAYABLE_IDS.filter(id => !shop.includes(id))].slice(0, 4);
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
  private activeSynergies = new Set<string>();

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
    return success(`Aldeia nível ${this.state.villageLevel}. Mais um lugar na formação!`);
  }

  private newUid(): string {
    let uid = `hero-${this.uidCounter++}`;
    while (this.state.heroes.some(hero => hero.uid === uid)) uid = `hero-${this.uidCounter++}`;
    return uid;
  }
  private nextShopHero(exclude: number[]): number {
    for (let i = 0; i < 13; i++) {
      const id = this.state.shopRotation % 13 + 1;
      this.state.shopRotation = (this.state.shopRotation + 1) % 13;
      if (!exclude.includes(id)) return id;
    }
    return 1;
  }
  recruit(characterId: number): ActionResult {
    if (this.fighting()) return fail('O recrutamento volta ao fim do combate.');
    const shopIndex = this.state.shop.indexOf(characterId);
    if (shopIndex < 0) return fail('Este herói não está disponível nesta visita.');
    const duplicates = this.state.heroes.filter(hero => hero.characterId === characterId && hero.stars === 1);
    if (this.state.heroes.length >= MAX_ROSTER_SIZE && duplicates.length < 2) return fail('A reserva está cheia. Combine ou libere um herói.');
    if (!this.spend(recruitCost(characterId))) return fail('O recrutamento custa 30 de espírito e 15 de alimento.');
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
    return success(combined ? `${characterById(characterId).name} evoluiu! Três cópias formam uma estrela superior.` : `${characterById(characterId).name} chegou à reserva.`);
  }

  rerollShop(): ActionResult {
    if (this.fighting()) return fail('Aguarde o fim do combate.');
    if (!this.spend(REROLL_COST)) return fail('São necessários 8 de espírito para uma nova visita.');
    const next: number[] = [];
    for (let i = 0; i < 4; i++) next.push(this.nextShopHero(next));
    this.state.shop = next;
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
    this.state.resources.spirit += 15 * Math.pow(3, hero.stars - 1);
    return success('Herói liberado. Parte do espírito foi devolvida.');
  }

  togglePause(): boolean { this.state.paused = !this.state.paused; return this.state.paused; }

  private entity(characterId: number, stars: number, team: Team, index: number, slot: number, uid?: string): CombatEntity {
    const character = characterById(characterId);
    const wave = this.state.wave;
    const scale = team === 'enemy' ? 0.65 + wave * 0.055 : 1;
    const entity: CombatEntity = {
      id: `${team}-${index}`, uid, characterId, team, name: character.name, stars,
      x: slot % 4, y: team === 'ally' ? 3 + Math.floor(slot / 4) : 2 - Math.floor(slot / 4),
      hp: character.hp[stars - 1] * scale, maxHp: character.hp[stars - 1] * scale,
      mana: character.manaStart, manaMax: character.manaMax,
      attack: character.attack[stars - 1] * scale, armor: character.armor,
      magicResist: character.magicResist, attackSpeed: character.attackSpeed, range: character.range,
      shield: 0, cooldown: index * 0.08, action: 'idle', actionTime: 0,
      stun: 0, slow: 0, haste: 0, guard: 0, poison: 0, poisonDamage: 0, marked: 0, huntMarked: 0,
      empowered: 0, dodge: 0, dotClock: 0, guardBurst: false,
    };
    if (team === 'ally') {
      const has = (trait: string) => this.activeSynergies.has(trait) && character.traits.includes(trait);
      if (has('Presas')) entity.attack *= 1.15;
      if (has('Manada')) entity.maxHp *= 1.2;
      if (has('Rio')) entity.magicResist += 20;
      if (has('Noturno')) entity.attackSpeed *= 1.18;
      if (has('Caçador')) entity.attackSpeed *= 1.15;
      if (has('Brigão')) entity.armor += 20;
      if (has('Espreitador')) entity.attack *= 1.2;
      if (has('Enxame')) entity.mana = Math.min(entity.manaMax, entity.mana + 20);
      entity.hp = entity.maxHp;
    }
    return entity;
  }

  startBattle(): ActionResult {
    if (this.state.paused) return fail('Retome o tempo antes de iniciar a expedição.');
    if (this.battle) return fail('Conclua ou feche a expedição atual.');
    if (this.state.wave > MAX_WAVE) return fail('Você concluiu as 12 expedições desta versão.');
    const party = this.state.heroes.filter(hero => hero.slot !== null);
    if (!party.length) return fail('Posicione pelo menos um herói no campo.');
    if (party.length > capacity(this.state)) return fail('Há heróis demais na formação.');
    this.activeSynergies = new Set(getSynergies(this.state).filter(synergy => synergy.active).map(synergy => synergy.name));
    const allies = party.map((hero, index) => this.entity(hero.characterId, hero.stars, 'ally', index, hero.slot!, hero.uid));
    const wave = this.state.wave;
    const count = Math.min(8, 2 + Math.floor((wave - 1) / 2));
    const enemyIds = [3, 7, 12, 9, 4, 6, 10, 13];
    const enemySlots = [1, 2, 5, 6, 0, 3, 8, 11];
    const enemies = Array.from({ length: count }, (_, index) => this.entity(enemyIds[(index + Math.floor((wave - 1) / 3)) % enemyIds.length], wave >= 9 && index < 2 ? 2 : 1, 'enemy', index, enemySlots[index]));
    this.events = [];
    this.battle = { entities: [...allies, ...enemies], time: 0, wave, status: 'fighting', reward: null };
    return success(`Expedição ${wave}: a caçada começou.`);
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
  private damage(source: CombatEntity, target: CombatEntity, raw: number, magic = false): void {
    if (target.hp <= 0 || target.dodge > 0) return;
    const resist = Math.max(0, magic ? target.magicResist : target.armor);
    const damage = raw * 100 / (100 + resist) * (target.guard > 0 ? 0.45 : 1) * (target.marked > 0 ? 1.2 : 1);
    const absorbed = Math.min(target.shield, damage);
    target.shield -= absorbed;
    const dealt = Math.min(target.hp, damage - absorbed);
    target.hp = Math.max(0, target.hp - dealt);
    target.mana = Math.min(target.manaMax, target.mana + 5);
    this.emit('damage', source, target, Math.round(dealt));
    if (target.hp <= 0) { target.action = 'dead'; this.emit('death', source, target); }
  }
  private heal(source: CombatEntity, target: CombatEntity, amount: number): void {
    if (target.hp <= 0) return;
    const healed = Math.min(amount, target.maxHp - target.hp);
    target.hp += healed;
    if (healed > 0) this.emit('heal', source, target, Math.round(healed));
  }
  private giveShield(source: CombatEntity, amount: number): void {
    source.shield += amount;
    this.emit('shield', source, source, Math.round(amount));
  }

  private cast(source: CombatEntity, target: CombatEntity): void {
    source.mana = 0;
    source.action = 'cast'; source.actionTime = 0.6; source.cooldown = Math.max(source.cooldown, 0.6);
    this.emit('skill', source, target, undefined, characterById(source.characterId).ability.name);
    const enemies = this.opponents(source);
    const allies = this.living(source.team);
    const multiplier = source.team === 'ally' && this.activeSynergies.has('Místico') && characterById(source.characterId).traits.includes('Místico') ? 1.25 : 1;
    const power = source.attack * multiplier;
    switch (source.characterId) {
      case 1:
        this.damage(source, target, source.attack * [1.5, 2.25, 3.4][source.stars - 1]); target.huntMarked = 5;
        break;
      case 2:
        for (const enemy of enemies.filter(enemy => distance(target, enemy) <= 1.8)) { enemy.slow = 5; enemy.poison = 5; enemy.poisonDamage = power * 0.6; }
        break;
      case 3:
        source.x = Math.max(0, Math.min(3, target.x)); source.y = Math.max(0, Math.min(5, target.y + (source.team === 'ally' ? 0.7 : -0.7)));
        this.damage(source, target, power * 1.5); target.stun = 1; this.giveShield(source, source.maxHp * 0.2);
        break;
      case 4:
        source.stun = 0; source.slow = 0; source.dodge = 1; source.empowered = 6;
        break;
      case 5: {
        this.damage(source, target, power * 1.6);
        const stolen = target.attack * 0.12;
        target.attack = Math.max(characterById(target.characterId).attack[target.stars - 1] * 0.4, target.attack - stolen);
        source.attack = Math.min(characterById(source.characterId).attack[source.stars - 1] * 2, source.attack + stolen);
        break;
      }
      case 6:
        for (const ally of allies) this.heal(source, ally, power * 1.8);
        for (const enemy of enemies) this.damage(source, enemy, power * 1.1, true);
        break;
      case 7:
        this.damage(source, target, power * (target.hp / target.maxHp < 0.4 ? 3.4 : 1.7));
        if (target.hp <= 0) this.heal(source, source, source.maxHp * 0.25);
        break;
      case 8: {
        const farthest = [...enemies].sort((a, b) => distance(source, b) - distance(source, a))[0];
        farthest.marked = 6; this.damage(source, farthest, power * 2);
        break;
      }
      case 9:
        source.guard = 4; source.guardBurst = true; this.giveShield(source, source.maxHp * 0.2);
        break;
      case 10:
        this.damage(source, target, power * 2.25); target.poison = 4; target.poisonDamage = power * 0.4;
        break;
      case 11:
        for (const ally of allies) { ally.haste = 5; if (ally.id !== source.id) ally.mana = Math.min(ally.manaMax, ally.mana + 15); }
        break;
      case 12:
        [...enemies].sort((a, b) => distance(source, a) - distance(source, b)).slice(0, 3).forEach((enemy, index) => this.damage(source, enemy, power * (index === 0 ? 1.8 : 1.2)));
        break;
      case 13:
        for (const enemy of [...enemies].sort((a, b) => distance(source, a) - distance(source, b)).slice(0, 3)) { this.damage(source, enemy, power * 1.8, true); enemy.slow = 5; }
        break;
    }
  }

  private combatStep(dt: number): void {
    const battle = this.battle!;
    battle.time += dt;
    this.events = this.events.filter(event => battle.time - event.time < 2);
    for (const entity of battle.entities) {
      if (entity.hp <= 0) continue;
      const wasGuarded = entity.guard > 0;
      const wasPoisoned = entity.poison > 0;
      for (const key of ['stun', 'slow', 'haste', 'guard', 'poison', 'marked', 'huntMarked', 'empowered', 'dodge', 'actionTime', 'cooldown'] as const) entity[key] = Math.max(0, entity[key] - dt);
      if (wasGuarded && entity.guard === 0 && entity.guardBurst) {
        entity.guardBurst = false;
        for (const enemy of this.opponents(entity).filter(enemy => distance(entity, enemy) <= 2)) this.damage(entity, enemy, entity.attack * 2, true);
      }
      if (wasPoisoned) {
        entity.dotClock += dt;
        if (entity.dotClock >= 1) { entity.dotClock -= 1; this.damage(entity, entity, entity.poisonDamage, true); }
      } else entity.dotClock = 0;
      if (entity.hp <= 0) continue;
      if (entity.stun > 0 && !(entity.characterId === 4 && entity.mana >= entity.manaMax)) { entity.action = 'idle'; continue; }
      const targets = this.opponents(entity).sort((a, b) => distance(entity, a) - distance(entity, b));
      const target = targets[0];
      if (!target) break;
      if (entity.actionTime > 0) continue;
      if (entity.mana >= entity.manaMax && entity.manaMax > 0) { this.cast(entity, target); continue; }
      const gap = distance(entity, target);
      if (gap > entity.range + 0.15) {
        const step = Math.min(gap - entity.range, dt * 1.5);
        entity.x += (target.x - entity.x) / gap * step;
        entity.y += (target.y - entity.y) / gap * step;
        entity.action = 'walk';
      } else if (entity.cooldown <= 0) {
        entity.action = 'attack'; entity.actionTime = 0.25;
        if (target.huntMarked > 0) entity.haste = Math.max(entity.haste, 1.5);
        entity.cooldown = 1 / (entity.attackSpeed * (entity.haste > 0 ? 1.25 : 1) * (entity.slow > 0 ? 0.7 : 1));
        this.emit('attack', entity, target);
        this.damage(entity, target, entity.attack);
        entity.mana = Math.min(entity.manaMax, entity.mana + 12);
        if (entity.empowered > 0) { target.poison = 4; target.poisonDamage = entity.attack * 0.45; }
      } else entity.action = 'idle';
    }
    if (!this.living('enemy').length) this.finishBattle(true);
    else if (!this.living('ally').length || battle.time >= 150) this.finishBattle(false);
  }

  private finishBattle(victory: boolean): void {
    const battle = this.battle!;
    if (battle.status !== 'fighting') return;
    battle.status = victory ? 'victory' : 'defeat';
    if (victory) {
      battle.reward = { wood: 35 + battle.wave * 12, food: 30 + battle.wave * 10, stone: 20 + battle.wave * 8, spirit: 35 + battle.wave * 8 };
      this.addResources(battle.reward);
      this.state.wave = Math.min(MAX_WAVE + 1, battle.wave + 1);
      this.state.victories = this.state.wave - 1;
    }
  }
}
