import { characters } from '../data/characters';

/** Prototype numbers for every Set 1 trait. Thresholds count distinct deployed characters. */
export type TraitKind = 'povo' | 'função' | 'espírito';
export interface TraitRule { kind: TraitKind; thresholds: number[]; effects: string[] }

const spirit = (members: number): TraitRule => members >= 3
  ? { kind: 'espírito', thresholds: [2, 3], effects: ['Vínculo: +10% de vida e ataque para os portadores.', 'Vínculo pleno: +20% de vida e ataque para os portadores.'] }
  : members === 2
    ? { kind: 'espírito', thresholds: [2], effects: ['Vínculo: +12% de vida e ataque para os portadores.'] }
    : { kind: 'espírito', thresholds: [1], effects: ['Espírito solitário: +10% de vida e ataque.'] };

export const TRAIT_RULES: Record<string, TraitRule> = {
  Presas: { kind: 'povo', thresholds: [2, 4], effects: ['+15% de ataque para Presas.', '+30% de ataque para Presas.'] },
  Manada: { kind: 'povo', thresholds: [2, 4], effects: ['+20% de vida para Manada.', '+40% de vida para Manada.'] },
  Rio: { kind: 'povo', thresholds: [2, 4], effects: ['+20 de resistência mágica para Rio.', '+45 de resistência mágica e 1,5% de vida regenerada por segundo para Rio.'] },
  Noturno: { kind: 'povo', thresholds: [2, 4], effects: ['+18% de velocidade de ataque para Noturnos.', '+36% de velocidade de ataque para Noturnos.'] },
  Enxame: { kind: 'povo', thresholds: [2, 4], effects: ['+20 de mana inicial para Enxame.', '+40 de mana inicial para Enxame.'] },
  Copa: { kind: 'povo', thresholds: [2, 4], effects: ['Copa começa o combate inalvejável por 1,5 s.', 'Copa começa o combate inalvejável por 3 s.'] },
  Escamas: { kind: 'povo', thresholds: [2, 4], effects: ['Escamas recebem 12% menos dano.', 'Escamas recebem 25% menos dano.'] },
  Ancestral: { kind: 'povo', thresholds: [2, 4], effects: ['+20% de vida e ataque para Ancestrais.', '+40% de vida e ataque para Ancestrais.'] },
  'Totêmico': { kind: 'povo', thresholds: [2, 4], effects: ['Toda a formação recebe +2 de mana por segundo.', 'Toda a formação recebe +4 de mana por segundo.'] },
  'Caçador': { kind: 'função', thresholds: [2, 4], effects: ['+15% de velocidade de ataque para Caçadores.', '+30% de velocidade de ataque para Caçadores.'] },
  'Brigão': { kind: 'função', thresholds: [2, 4], effects: ['+20 de armadura para Brigões.', '+45 de armadura para Brigões.'] },
  Espreitador: { kind: 'função', thresholds: [2, 4], effects: ['+20% de ataque para Espreitadores.', '+40% de ataque para Espreitadores.'] },
  'Místico': { kind: 'função', thresholds: [2, 4], effects: ['+25% de cura e de dano de habilidades para Místicos.', '+50% de cura e de dano de habilidades para Místicos.'] },
  'Guardião': { kind: 'função', thresholds: [2, 4], effects: ['Guardiões começam com escudo de 15% da vida.', 'Guardiões começam com escudo de 30% da vida.'] },
  'Xamã': { kind: 'função', thresholds: [2, 4], effects: ['Xamãs recuperam 25% da mana após conjurar.', 'Xamãs recuperam 50% da mana após conjurar.'] },
  Invocador: { kind: 'função', thresholds: [2, 3], effects: ['Invocações recebem +40% de vida e ataque.', 'Invocações recebem +80% de vida e ataque.'] },
  Trapaceiro: { kind: 'função', thresholds: [2, 3], effects: ['Ataques de Trapaceiros drenam 5 de mana do alvo.', 'Ataques de Trapaceiros drenam 10 de mana do alvo.'] },
  'Necrófago': { kind: 'função', thresholds: [2], effects: ['Cada inimigo derrotado cura Necrófagos em 10% e soma 5% de ataque.'] },
};
for (const character of characters) for (const trait of character.traits) {
  if (TRAIT_RULES[trait]) continue;
  TRAIT_RULES[trait] = spirit(characters.filter(other => other.traits.includes(trait)).length);
}

export interface TraitStatus { name: string; kind: TraitKind; count: number; tier: number; thresholds: number[]; next: number; description: string }

/** Tier 0 means inactive. `next` is the threshold to reach, or the highest one when complete. */
export function traitStatus(name: string, count: number): TraitStatus {
  const rule = TRAIT_RULES[name];
  const tier = rule.thresholds.filter(threshold => count >= threshold).length;
  return {
    name, kind: rule.kind, count, tier, thresholds: rule.thresholds,
    next: rule.thresholds[tier] ?? rule.thresholds[rule.thresholds.length - 1],
    description: rule.effects[Math.max(0, tier - 1)],
  };
}

export function countTraits(characterIds: Iterable<number>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of new Set(characterIds)) {
    const character = characters.find(entry => entry.id === id);
    for (const trait of character?.traits ?? []) counts.set(trait, (counts.get(trait) ?? 0) + 1);
  }
  return counts;
}
