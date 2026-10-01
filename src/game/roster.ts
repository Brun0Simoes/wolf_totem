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

export interface WaveDefinition { name: string; units: { id: number; stars: number }[] }
const unit = (id: number, stars = 1) => ({ id, stars });

/** Twelve themed expeditions. The last waves introduce higher costs and finish with a legendary. */
export const WAVES: WaveDefinition[] = [
  { name: 'Batedores do barro', units: [unit(3), unit(7)] },
  { name: 'Olhos na mata', units: [unit(7), unit(12)] },
  { name: 'Trilha da serpente', units: [unit(3), unit(4), unit(12)] },
  { name: 'Margem do rio', units: [unit(9), unit(6), unit(21)] },
  { name: 'Ninho do enxame', units: [unit(24), unit(10), unit(20), unit(2)] },
  { name: 'Copa alta', units: [unit(15), unit(5), unit(23), unit(16)] },
  { name: 'Presas da lua', units: [unit(26), unit(14), unit(7), unit(27), unit(13)] },
  { name: 'O delta', units: [unit(17), unit(32), unit(21), unit(35), unit(22)] },
  { name: 'Manada de marfim', units: [unit(28, 2), unit(19, 2), unit(34), unit(25), unit(12), unit(3)] },
  { name: 'Garras do eclipse', units: [unit(36, 2), unit(42, 2), unit(14), unit(18), unit(33), unit(31)] },
  { name: 'Os reis da floresta', units: [unit(40, 2), unit(41, 2), unit(48), unit(39), unit(44), unit(38), unit(29)] },
  { name: 'O Primeiro Inverno', units: [unit(49, 2), unit(43, 2), unit(39), unit(47), unit(45), unit(1, 2), unit(52)] },
];
