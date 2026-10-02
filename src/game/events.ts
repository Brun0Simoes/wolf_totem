import { characters } from '../data/characters';
import { nextRandom, unlockedCost } from './roster';
import { COMPONENT_IDS, ITEMS } from './items';
import type { Resource, Resources } from './simulation';
import type { Stage } from './campaign';

/** Village happenings in real play time: a merchant, an omen, a lost traveller or a raid. */
export type EventKind = 'merchant' | 'omen' | 'traveler' | 'raid';
export interface VillageEvent { kind: EventKind; expires: number; item?: string; price?: Resources; resource?: Resource; characterId?: number }

/** Events wait five minutes for an answer; an omen lasts half an hour. */
export const EVENT_DURATION = 300;
export const OMEN_DURATION = 1800;
export const OMEN_BONUS = 0.5;
export const FIRST_EVENT_AT = 240;
const RESOURCE_KEYS: Resource[] = ['wood', 'food', 'stone', 'spirit'];

export const EVENT_TEXT: Record<EventKind, { title: string; text: string; accept: string; decline: string }> = {
  merchant: { title: 'Mercador errante', text: 'Um mercador de outra margem do rio oferece um objeto de troca.', accept: 'Trocar', decline: 'Dispensar' },
  omen: { title: 'Presságio favorável', text: 'Os espíritos sorriem para a aldeia: a produção de um recurso cresce por meia hora.', accept: 'Celebrar', decline: 'Ignorar' },
  traveler: { title: 'Viajante perdido', text: 'Alguém chegou ferido à fogueira e pede abrigo. Acolhido, junta-se à tribo sem precisar de chamado.', accept: 'Acolher', decline: 'Indicar o caminho' },
  raid: { title: 'Incursão de saqueadores', text: 'Saqueadores rondam a aldeia. Defenda-a em combate, pague um tributo ou arrisque perder provisões.', accept: 'Defender', decline: 'Pagar tributo' },
};

/** Seconds until the next event, between eight and fifteen minutes. */
export function nextEventDelay(seed: number): { delay: number; seed: number } {
  const roll = nextRandom(seed);
  return { delay: 480 + Math.floor(roll.value * 420), seed: roll.seed };
}

/** A traveller is someone the tribe has not met yet, from the costs its era can call. */
export function rollEvent(seed: number, clock: number, villageLevel: number, known: number[]): { event: VillageEvent; seed: number } {
  let roll = nextRandom(seed);
  const strangers = characters.filter(c => c.cost <= unlockedCost(villageLevel) && !known.includes(c.id)).map(c => c.id);
  // Travellers are rarer than the rest: most heroes come through the Circle of Spirits.
  const kinds: EventKind[] = ['merchant', 'merchant', 'merchant', 'omen', 'omen', 'omen', 'raid', 'raid', ...(strangers.length ? ['traveler' as const] : [])];
  const kind = kinds[Math.floor(roll.value * kinds.length)];
  const event: VillageEvent = { kind, expires: clock + EVENT_DURATION };
  roll = nextRandom(roll.seed);
  if (kind === 'merchant') {
    const finished = roll.value < 0.35;
    const pool = finished ? ITEMS.map(item => item.id) : COMPONENT_IDS as string[];
    roll = nextRandom(roll.seed);
    event.item = pool[Math.floor(roll.value * pool.length)];
    const scale = (finished ? 2.4 : 1) * (0.8 + villageLevel * 0.45);
    event.price = { wood: Math.round(70 * scale), food: Math.round(40 * scale), stone: Math.round(55 * scale), spirit: Math.round(25 * scale) };
  } else if (kind === 'omen') event.resource = RESOURCE_KEYS[Math.floor(roll.value * RESOURCE_KEYS.length)];
  else if (kind === 'traveler') event.characterId = strangers[Math.floor(roll.value * strangers.length)];
  return { event, seed: roll.seed };
}

/** Raiders scale with the campaign progress; costs follow the current era. */
export function raidStage(seed: number, progress: number, villageLevel: number): { stage: Stage; level: number; seed: number } {
  let current = seed;
  const count = 2 + villageLevel;
  const pool = characters.filter(c => c.cost <= unlockedCost(villageLevel)).map(c => c.id);
  const units: { id: number; stars: number }[] = [];
  for (let i = 0; i < count; i++) {
    const roll = nextRandom(current); current = roll.seed;
    const options = pool.filter(id => !units.some(unit => unit.id === id));
    units.push({ id: options[Math.floor(roll.value * options.length)], stars: progress > 15 && i < 2 ? 2 : 1 });
  }
  return { stage: { id: -1, region: Math.min(6, Math.max(1, Math.ceil((progress + 1) / 5))), index: 0, name: 'Incursão de saqueadores', units }, level: Math.max(2, progress * 0.85), seed: current };
}

/** What the tribe loses when nobody answers the raiders. */
export const RAID_PENALTY = 0.06;
export const TRIBUTE = 0.1;
