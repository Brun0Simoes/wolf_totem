import { characters } from '../data/characters';

/** Prototype progression rules for the Set 1 roster. Canonical character data stays in src/data. */
export const ALL_CHARACTER_IDS = characters.map(character => character.id);
export const MAX_COST = 5;

/** Each village level opens the next cost tier: level 1 → cost 1 … level 5 → cost 5. */
export const unlockedCost = (villageLevel: number): number => Math.max(1, Math.min(MAX_COST, Math.floor(villageLevel)));

/** Percent chance of each cost (index 0 = cost 1) appearing at the campfire, by village level. */
export const SHOP_ODDS: readonly (readonly number[])[] = [
  [100, 0, 0, 0, 0],
  [70, 30, 0, 0, 0],
  [45, 35, 20, 0, 0],
  [30, 32, 25, 13, 0],
  [22, 27, 26, 17, 8],
];
export const shopOdds = (villageLevel: number): readonly number[] => SHOP_ODDS[unlockedCost(villageLevel) - 1];

export const charactersOfCost = (cost: number): number[] => characters.filter(character => character.cost === cost).map(character => character.id);

/** 32-bit deterministic generator; the state is stored in the save so a reload never rerolls the campfire. */
export function nextRandom(seed: number): { value: number; seed: number } {
  let t = (seed + 0x6d2b79f5) >>> 0;
  const next = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: next };
}

/** Rolls one campfire visitor. `exclude` keeps a visit free of repeated faces. */
export function rollVisitor(seed: number, villageLevel: number, exclude: number[]): { id: number; seed: number } {
  const odds = shopOdds(villageLevel);
  let roll = nextRandom(seed);
  let pick = roll.value * 100;
  let cost = 1;
  for (let index = 0; index < odds.length; index++) {
    if (pick < odds[index]) { cost = index + 1; break; }
    pick -= odds[index];
  }
  let pool = charactersOfCost(cost).filter(id => !exclude.includes(id));
  if (!pool.length) pool = ALL_CHARACTER_IDS.filter(id => !exclude.includes(id) && (characters.find(character => character.id === id)?.cost ?? 1) <= unlockedCost(villageLevel));
  roll = nextRandom(roll.seed);
  return { id: pool[Math.floor(roll.value * pool.length)] ?? 1, seed: roll.seed };
}

/** Food and spirit scale with cost. Selling returns half of the spirit spent on every copy. */
export function recruitPrice(cost: number): { food: number; spirit: number } {
  return { food: 15 * cost, spirit: 30 * cost };
}
export const sellRefund = (cost: number, stars: number): number => 15 * cost * Math.pow(3, stars - 1);
