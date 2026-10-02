import { characters } from '../data/characters';
import { nextRandom } from './roster';

/** The expedition map: six regions of five stages, each closed by a boss, then the endless hunt. */
export interface StageUnit { id: number; stars: number; boss?: boolean }
export interface Stage { id: number; region: number; index: number; name: string; units: StageUnit[] }
export interface Region { id: number; name: string; subtitle: string; village: number; boss: string; palette: { floor: number; floorAlt: number; ally: number; allyAlt: number; line: number } }

const u = (id: number, stars = 1): StageUnit => ({ id, stars });
const boss = (id: number, stars = 2): StageUnit => ({ id, stars, boss: true });

export const REGIONS: Region[] = [
  { id: 1, name: 'Clareira do Lobo', subtitle: 'Onde a tribo deu os primeiros passos.', village: 1, boss: 'O Alfa Cinzento', palette: { floor: 0x77755a, floorAlt: 0x7e7b5d, ally: 0x647257, allyAlt: 0x6d7a5e, line: 0xccca9d } },
  { id: 2, name: 'Margem do Rio', subtitle: 'Lodo, correnteza e escamas.', village: 2, boss: 'A Boca do Delta', palette: { floor: 0x5f7462, floorAlt: 0x667b68, ally: 0x56705f, allyAlt: 0x5e7866, line: 0xa9cbbd } },
  { id: 3, name: 'Copa Alta', subtitle: 'Galhos, enxames e olhos no escuro.', village: 3, boss: 'O Oráculo da Copa', palette: { floor: 0x5d6f4b, floorAlt: 0x657752, ally: 0x56694a, allyAlt: 0x5e7150, line: 0xc4d39a } },
  { id: 4, name: 'Savana de Marfim', subtitle: 'Manadas, presas douradas e chifres de guerra.', village: 4, boss: 'O Rei dos Búfalos', palette: { floor: 0x8b7d58, floorAlt: 0x93845e, ally: 0x7a7656, allyAlt: 0x827d5c, line: 0xe2d29d } },
  { id: 5, name: 'Pântano Ancestral', subtitle: 'Águas negras onde mandíbulas antigas esperam.', village: 5, boss: 'O Leviatã do Pântano', palette: { floor: 0x4c5b4b, floorAlt: 0x536250, ally: 0x485846, allyAlt: 0x4f5f4c, line: 0x9fb59a } },
  { id: 6, name: 'Montanhas do Primeiro Inverno', subtitle: 'O lar dos ancestrais e do Urso Branco.', village: 5, boss: 'O Primeiro Inverno', palette: { floor: 0x7d8a8c, floorAlt: 0x869395, ally: 0x6d7b78, allyAlt: 0x75837f, line: 0xe4eef0 } },
];

const STAGE_LIST: [string, StageUnit[]][] = [
  ['Batedor do barro', [u(7)]],
  ['Olhos na mata', [u(7), u(12)]],
  ['Trilha da serpente', [u(3), u(4), u(12), u(7)]],
  ['Risos na noite', [u(7), u(8), u(13), u(3)]],
  ['O Alfa Cinzento', [boss(1, 1), u(12), u(3), u(7), u(13)]],

  ['Pescadores do lodo', [u(9), u(6), u(4), u(2)]],
  ['Correnteza', [u(21), u(6), u(5), u(9)]],
  ['Ninho de quitina', [u(24), u(10), u(2), u(9), u(6)]],
  ['Escamas vermelhas', [u(22), u(17), u(9), u(4), u(21)]],
  ['A Boca do Delta', [boss(17), u(21), u(6), u(22), u(9)]],

  ['Galhos traiçoeiros', [u(15), u(5), u(23), u(16), u(24)]],
  ['Enxame solar', [u(30), u(20), u(10), u(24), u(16)]],
  ['Olhos do crepúsculo', [u(14), u(8), u(13), u(27), u(15)]],
  ['Mãos da copa', [u(15, 2), u(23), u(16), u(37), u(5), u(30)]],
  ['O Oráculo da Copa', [boss(29), u(30), u(15), u(23), u(14), u(24)]],

  ['Manada errante', [u(19, 2), u(25), u(12), u(34), u(3)]],
  ['Presas douradas', [u(36), u(26, 2), u(7), u(1), u(12)]],
  ['Chifres de guerra', [u(34, 2), u(19), u(28), u(25), u(33)]],
  ['A matilha', [u(39), u(1, 2), u(26), u(36), u(8)]],
  ['O Rei dos Búfalos', [boss(48), u(28, 2), u(34), u(19), u(25), u(39)]],

  ['Águas negras', [u(35, 2), u(32), u(31), u(17), u(22), u(21)]],
  ['Eclipse', [u(42, 2), u(27, 2), u(14), u(18), u(38), u(13)]],
  ['Mãe das mil teias', [u(44, 2), u(30, 2), u(24), u(20), u(2), u(22)]],
  ['Mandíbulas antigas', [u(41, 2), u(17, 2), u(32), u(47), u(35), u(31)]],
  ['O Leviatã do Pântano', [boss(55), u(41, 2), u(35, 2), u(32), u(53), u(46)]],

  ['Memórias do rebanho', [u(51), u(43, 2), u(28, 2), u(25), u(19), u(38)]],
  ['As mil máscaras', [u(45, 2), u(54), u(29, 2), u(18), u(11, 2), u(38)]],
  ['O sol devorado', [u(50), u(36, 2), u(27, 2), u(42), u(39), u(33)]],
  ['Noite absoluta', [u(52), u(33, 2), u(18, 2), u(38), u(8, 2), u(53), u(46)]],
  ['O Primeiro Inverno', [boss(49, 2), u(39, 2), u(43, 2), u(54), u(50), u(52), u(40, 2)]],
];

export const STAGES: Stage[] = STAGE_LIST.map(([name, units], index) => ({ id: index + 1, region: Math.floor(index / 5) + 1, index: index % 5 + 1, name, units }));
export const FINAL_STAGE = STAGES.length;
export const regionOf = (stageId: number): Region => REGIONS[Math.max(0, Math.min(REGIONS.length - 1, Math.ceil(stageId / 5) - 1))];
export const stageById = (stageId: number): Stage | undefined => STAGES.find(stage => stage.id === stageId);

/** The hero level a tribe that hunts, works and fights along the way has reached at each stage: one per stage. */
export const expectedLevel = (level: number): number => Math.max(1, Math.min(30, level));
/** Stars the tribe has awakened by then: the ascension rites open levels 11 and 21. */
export const expectedStars = (level: number): number => level <= 10 ? 1 : level <= 20 ? 2 : 3;
/**
 * Enemy power at each campaign stage, calibrated by simulation. The tribe expected there (one level per stage,
 * stars awakened at 11 and 21, a sound formation of its era, a few items and the patron spirits) wins with
 * about 10% to spare in the first two regions and 30% from the third on; from there, a loose formation of the
 * same stars also wins once it is four levels ahead. A tribe a star behind cannot win.
 */
export const STAGE_POWER = [
  0.89, 1.15, 0.8, 0.93, 0.65, 1.47, 1.88, 1.48, 1.69, 0.95,
  4.36, 3.7, 3.89, 3.25, 3.7, 4.86, 5.92, 5, 6.24, 3.27,
  16.39, 14.29, 15.68, 15.85, 7.08, 12.98, 18.57, 17.08, 16.87, 7.25,
] as const;
const growth = (level: number) => 0.56 + level * 0.03 + level * level * 0.0009;
/** Regular stages (bosses aside) guide raids between stages and the endless hunt beyond the campaign. */
const ANCHORS = STAGE_POWER.map((power, index) => [index + 1, power] as const).filter(([stage]) => stage % 5 !== 0);
export function enemyPower(level: number, stageId = 0): number {
  if (Number.isInteger(stageId) && stageId >= 1 && stageId <= STAGE_POWER.length) return STAGE_POWER[stageId - 1];
  if (level <= ANCHORS[0][0]) return ANCHORS[0][1];
  const last = ANCHORS[ANCHORS.length - 1];
  if (level >= last[0]) return last[1] * growth(level) / growth(last[0]);
  const next = ANCHORS.findIndex(([stage]) => stage >= level), [b, pb] = ANCHORS[next], [a, pa] = ANCHORS[next - 1];
  return pa + (pb - pa) * (level - a) / (b - a);
}
/** Costlier units start from stronger canonical stats, so they are scaled a little less. */
export const enemyScale = (level: number, cost: number, stageId = 0): number => enemyPower(level, stageId) / (1 + 0.12 * (cost - 1));
/** Bosses grow with the region: the Alpha is a lesson, the First Winter a wall. */
export const bossScale = (region: number) => ({ hp: 1.66 + 0.06 * region, attack: 1.12 + 0.02 * region });

export interface Reward { wood: number; food: number; stone: number; spirit: number }
export function stageReward(level: number, repeat: boolean): Reward {
  const factor = repeat ? 0.5 : 1;
  return {
    wood: Math.round((40 + level * 14) * factor), food: Math.round((35 + level * 12) * factor),
    stone: Math.round((25 + level * 10) * factor), spirit: Math.round((40 + level * 10) * factor),
  };
}

/** The endless hunt: seeded lineups that keep growing in size, stars and strength. */
export function endlessStage(depth: number): Stage {
  let seed = 7919 * depth + 17;
  const count = Math.min(8, 5 + Math.floor(depth / 4));
  const maxCost = Math.min(5, 3 + Math.floor(depth / 3));
  const pool = characters.filter(character => character.cost <= maxCost && character.cost >= 2).map(character => character.id);
  const units: StageUnit[] = [];
  for (let i = 0; i < count; i++) {
    const roll = nextRandom(seed); seed = roll.seed;
    const options = pool.filter(id => !units.some(unit => unit.id === id));
    const stars = depth >= 15 ? (i < 4 ? 3 : 2) : depth >= 8 ? (i < 2 ? 3 : 2) : depth >= 3 ? (i < 3 ? 2 : 1) : (i < 1 ? 2 : 1);
    units.push({ id: options[Math.floor(roll.value * options.length)], stars, boss: depth % 5 === 0 && i === 0 });
  }
  return { id: 0, region: 6, index: depth, name: depth % 5 === 0 ? `Caçada Eterna ${depth} · Fera alfa` : `Caçada Eterna ${depth}`, units };
}
export const endlessLevel = (depth: number): number => FINAL_STAGE + depth * 1.6;
