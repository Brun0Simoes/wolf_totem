/**
 * Visual rule of the Set 1 plan: 1★ tribal human, 2★ evident spirit bond, 3★ Primal Avatar.
 * The four categories say how far each person gives in to the spirit at 3★.
 * `plano` marks the examples named in the original plan; `proposta` is the classification
 * derived from each 3★ description, pending the author's approval.
 */
export type Animality = 'Manifestador' | 'Marcado' | 'Híbrido' | 'Metamorfo';
export interface AnimalityEntry { category: Animality; source: 'plano' | 'proposta' }

export const ANIMALITY_RULES: Record<Animality, string> = {
  Manifestador: 'Continua humano; o animal aparece externamente — totens, membros espirituais, silhuetas.',
  Marcado: 'Olhos, garras, escamas ou penas, mas continua majoritariamente humano.',
  'Híbrido': 'Partes significativas do corpo mudam de forma permanente no 3★.',
  Metamorfo: 'A habilidade permite assumir outra forma durante a batalha.',
};

const plan = (category: Animality): AnimalityEntry => ({ category, source: 'plano' });
const proposed = (category: Animality): AnimalityEntry => ({ category, source: 'proposta' });

export const ANIMALITY: Record<number, AnimalityEntry> = {
  1: proposed('Híbrido'), 2: proposed('Manifestador'), 3: proposed('Híbrido'), 4: proposed('Marcado'),
  5: proposed('Marcado'), 6: proposed('Marcado'), 7: proposed('Marcado'), 8: plan('Marcado'),
  9: proposed('Manifestador'), 10: proposed('Híbrido'), 11: proposed('Manifestador'), 12: plan('Marcado'),
  13: proposed('Marcado'),
  14: proposed('Híbrido'), 15: proposed('Híbrido'), 16: proposed('Marcado'), 17: proposed('Híbrido'),
  18: plan('Manifestador'), 19: proposed('Manifestador'), 20: proposed('Marcado'), 21: proposed('Manifestador'),
  22: proposed('Híbrido'), 23: proposed('Híbrido'), 24: proposed('Manifestador'), 25: plan('Marcado'),
  26: proposed('Manifestador'),
  27: plan('Metamorfo'), 28: plan('Híbrido'), 29: proposed('Híbrido'), 30: proposed('Manifestador'),
  31: proposed('Marcado'), 32: proposed('Híbrido'), 33: proposed('Marcado'), 34: proposed('Metamorfo'),
  35: proposed('Manifestador'), 36: plan('Metamorfo'), 37: proposed('Manifestador'), 38: plan('Manifestador'),
  39: plan('Híbrido'), 40: plan('Híbrido'), 41: proposed('Híbrido'), 42: proposed('Metamorfo'),
  43: proposed('Manifestador'), 44: proposed('Híbrido'), 45: proposed('Manifestador'), 46: proposed('Metamorfo'),
  47: proposed('Marcado'), 48: proposed('Híbrido'),
  49: plan('Metamorfo'), 50: plan('Metamorfo'), 51: proposed('Manifestador'), 52: proposed('Marcado'),
  53: plan('Metamorfo'), 54: plan('Manifestador'), 55: plan('Metamorfo'),
};
