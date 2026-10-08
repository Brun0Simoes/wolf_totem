
/**
 * Age of Mythology inspiration: each new era asks the tribe to honour one of three patron spirits.
 * A patron gives a permanent passive and a Spirit Power that can be called once per expedition.
 */
export type SpiritId = 'lobo' | 'cervo' | 'corvo' | 'serpente' | 'coruja' | 'gorila' | 'crocodilo' | 'elefante' | 'aguia' | 'urso' | 'jaguar' | 'aranha';
export interface SpiritPassive {
  /** Traits whose heroes receive the combat bonus below. Empty means every hero. */
  traits?: string[];
  attackPct?: number; hpPct?: number; attackSpeedPct?: number; armor?: number; magicResist?: number;
  healPower?: number; summonPct?: number; spellPower?: number; startMana?: number; damageTaken?: number;
}
export interface SpiritDef { id: SpiritId; name: string; era: number; animal: string; color: string; passiveText: string; passive: SpiritPassive; power: { name: string; text: string } }

export const SPIRITS: SpiritDef[] = [
  { id: 'lobo', era: 2, name: 'Lobo', animal: 'wolf', color: '#b7dfff', passiveText: 'Presas e Caçadores ganham +12% de ataque.',
    passive: { traits: ['Presas', 'Caçador'], attackPct: 0.12 }, power: { name: 'Uivo da Matilha', text: 'Toda a formação ganha +40% de velocidade de ataque e +20% de ataque por 6 s.' } },
  { id: 'cervo', era: 2, name: 'Cervo', animal: 'deer', color: '#bfe6a8', passiveText: 'Curas e escudos 20% mais fortes.',
    passive: { healPower: 0.2 }, power: { name: 'Chuva de Primavera', text: 'Cura 35% da vida de todos os aliados e remove venenos.' } },
  { id: 'corvo', era: 2, name: 'Corvo', animal: 'raven', color: '#9a8fc4', passiveText: 'Toda a formação começa com +12 de mana.',
    passive: { startMana: 12 }, power: { name: 'Revoada', text: 'Corvos ferem todos os inimigos em 10% da vida máxima e removem 20 de armadura por 8 s.' } },

  { id: 'serpente', era: 3, name: 'Serpente', animal: 'serpent', color: '#a4df72', passiveText: 'Escamas recebem 12% menos dano.',
    passive: { traits: ['Escamas'], damageTaken: -0.12 }, power: { name: 'Bote Coletivo', text: 'Envenena todos os inimigos: 4% da vida máxima por segundo durante 6 s.' } },
  { id: 'coruja', era: 3, name: 'Coruja', animal: 'owl', color: '#d5cdf6', passiveText: 'Místicos, Xamãs e Totêmicos com +20% de poder.',
    passive: { traits: ['Místico', 'Xamã', 'Totêmico'], spellPower: 0.2 }, power: { name: 'Silêncio da Noite', text: 'Inimigos perdem toda a mana e ficam lentos por 5 s.' } },
  { id: 'gorila', era: 3, name: 'Gorila', animal: 'gorilla', color: '#c9c3b5', passiveText: 'Copa e Guardiões com +15% de vida.',
    passive: { traits: ['Copa', 'Guardião'], hpPct: 0.15 }, power: { name: 'Rugido da Copa', text: 'Atordoa todos os inimigos por 1,75 s.' } },

  { id: 'crocodilo', era: 4, name: 'Crocodilo', animal: 'crocodile', color: '#8faa5f', passiveText: 'Rio e Brigões com +12% de vida e ataque.',
    passive: { traits: ['Rio', 'Brigão'], hpPct: 0.12, attackPct: 0.12 }, power: { name: 'Fome do Pântano', text: 'Devora o inimigo mais ferido abaixo de 40% da vida; os outros sofrem dano e ficam molhados.' } },
  { id: 'elefante', era: 4, name: 'Elefante', animal: 'elephant', color: '#e8dcc0', passiveText: 'Manada e Ancestrais com +25 de armadura e resistência.',
    passive: { traits: ['Manada', 'Ancestral'], armor: 25, magicResist: 25 }, power: { name: 'Muralha de Marfim', text: 'Escudo de 30% da vida para todos os aliados.' } },
  { id: 'aguia', era: 4, name: 'Águia', animal: 'eagle', color: '#f2d27a', passiveText: 'Caçadores com +12% de velocidade de ataque.',
    passive: { traits: ['Caçador'], attackSpeedPct: 0.12, }, power: { name: 'Olho do Céu', text: 'Marca todos os inimigos (+20% de dano recebido) e revela os furtivos por 10 s.' } },

  { id: 'urso', era: 5, name: 'Urso', animal: 'bear', color: '#cfe9f7', passiveText: 'Toda a formação com +10% de vida.',
    passive: { hpPct: 0.1 }, power: { name: 'Despertar do Inverno', text: 'Ergue todos os aliados caídos com 35% da vida.' } },
  { id: 'jaguar', era: 5, name: 'Jaguar', animal: 'jaguar', color: '#ffcf5a', passiveText: 'Espreitadores e Noturnos com +18% de ataque.',
    passive: { traits: ['Espreitador', 'Noturno'], attackPct: 0.18 }, power: { name: 'Eclipse', text: 'Aliados ficam inalvejáveis por 2,5 s e ganham +50% de ataque por 6 s.' } },
  { id: 'aranha', era: 5, name: 'Aranha', animal: 'spider', color: '#aadcca', passiveText: 'Invocações +50% mais fortes.',
    passive: { summonPct: 0.5, }, power: { name: 'Teia Mãe', text: 'Cobre o campo inimigo: atordoa por 1 s e desacelera por 6 s.' } },
];
export const spiritById = (id: string): SpiritDef | undefined => SPIRITS.find(spirit => spirit.id === id);
export const spiritsOfEra = (era: number): SpiritDef[] => SPIRITS.filter(spirit => spirit.era === era);
export const ERA_NAMES = ['I · As Primeiras Pegadas', 'II · O Chamado dos Espíritos', 'III · A Floresta Desperta', 'IV · As Grandes Manadas', 'V · A Era dos Ancestrais'];

/** Permanent upgrades bought with embers earned by raising the Great Totem. */
export type MemoryId = 'raizes' | 'fogueira' | 'bencao' | 'heranca' | 'forja' | 'botim';
export interface MemoryDef { id: MemoryId; name: string; text: string; max: number; base: number }
export const MEMORIES: MemoryDef[] = [
  { id: 'raizes', name: 'Raízes Profundas', text: '+10% de experiência de atividades por nível.', max: 10, base: 3 },
  { id: 'bencao', name: 'Bênção Ancestral', text: '+6% de vida e ataque para todos os heróis por nível.', max: 10, base: 4 },
  { id: 'fogueira', name: 'Fogueira Acolhedora', text: '+3% de vida da formação por nível.', max: 5, base: 3 },
  { id: 'botim', name: 'Botim das Caçadas', text: '+5 pontos percentuais de chance de componente nas vitórias repetidas por nível.', max: 5, base: 3 },
  { id: 'heranca', name: 'Herança da Tribo', text: 'Cada renascimento começa com +1.500 XP no primeiro herói por nível.', max: 5, base: 2 },
  { id: 'forja', name: 'Memória da Forja', text: 'Cada renascimento começa com um componente por nível.', max: 3, base: 4 },
];
export const memoryCost = (memory: MemoryDef, level: number): number => memory.base * (level + 1);
