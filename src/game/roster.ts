import { characters } from '../data/characters';

/** Roster rules for the Set 1 characters. Canonical character data stays in src/data. */
export const ALL_CHARACTER_IDS = characters.map(character => character.id);
export const MAX_COST = 5;

/** Each era lets the tribe call heroes of one more cost: Era I → cost 1 … Era V → cost 5. */
export const unlockedCost = (villageLevel: number): number => Math.max(1, Math.min(MAX_COST, Math.floor(villageLevel)));

export const charactersOfCost = (cost: number): number[] => characters.filter(character => character.cost === cost).map(character => character.id);

/** 32-bit deterministic generator; the state is stored in the save so a reload never rerolls a hunt or a loot drop. */
export function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) >>> 0;
  const next = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: next };
}
