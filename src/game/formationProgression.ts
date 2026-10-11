import { FORMATION_SLOTS } from './board';
import type { GameState } from './simulation';

export const MAX_FORMATION_LEVEL = FORMATION_SLOTS;
export const ERA_LEVELS = [1, 4, 8, 13, 18] as const;
/** Buying a level opens exactly one additional deployment cell. */
export const formationLevelCost = (level: number) => level >= MAX_FORMATION_LEVEL ? 0 : 28 + 12 * (level - 1) + 4 * (level - 1) ** 2;
export const eraForLevel = (level: number) => ERA_LEVELS.filter(n => level >= n).length;
export const consecrationCost = (part: number) => 400 + part * 250;
export const rebirthCost = (rebirths: number) => 2400 + Math.min(20, rebirths) * 600;
export const expansionUnlocked = (s: Pick<GameState, 'rebirths'>) => s.rebirths >= 1;
export function resetRequirements(s: GameState) {
  return [
    { label: `Formação no nível ${MAX_FORMATION_LEVEL}`, current: s.commanderLevel, target: MAX_FORMATION_LEVEL },
    { label: 'Grande Totem completo', current: s.wonder, target: 5 },
    { label: 'Primeiro Inverno vencido', current: s.progress, target: 30 },
    { label: `Abismo: profundidade ${10 + Math.min(20, s.rebirths) * 2}`, current: s.endlessBest, target: 10 + Math.min(20, s.rebirths) * 2 },
    { label: 'Três guardiões 3★ com XP 24 e ritual 8', current: s.heroes.filter(h => h.stars === 3 && h.level >= 24 && h.ritualLevel >= 8).length, target: 3 },
    { label: 'Âmbar para o renascimento', current: s.amber, target: rebirthCost(s.rebirths) },
  ].map(r => ({ ...r, ready: r.current >= r.target }));
}
export const resetLock = (s: GameState) => resetRequirements(s).find(r => !r.ready)?.label ?? null;
/** Farming old rounds teaches less. Defeat never produces a currency profit. */
export const frontierReward = (stage: number, frontier: number) => stage <= 0 ? 1 : Math.max(.15, 1 - Math.max(0, frontier - stage) * .065);
