
/**
 * Hero growth outside the formation: experience and levels, hunting trails, panema and the
 * ceremonies of the Casa de Cura. Everything here is data and pure rules; the Game applies them.
 */

export const MAX_HERO_LEVEL = 30;
export const MAX_RITUAL_LEVEL = 10;
export const RITUAL_COOLDOWN = 3 * 3600;
export const RITUAL_XP: Record<PracticeId, number> = { rape: 90, sananga: 180, kambo: 450, ayahuasca: 900, cacau: 60 };
export const ritualXpToNext = (level: number): number => level >= MAX_RITUAL_LEVEL ? Infinity : Math.round(90 * Math.pow(level, 1.4));
export function ritualTotalXp(level: number, xp: number): number {
  let total = xp;
  for (let n = 1; n < level; n++) total += ritualXpToNext(n);
  return total;
}
export function ritualFromTotal(total: number): { ritualLevel: number; ritualXp: number } {
  let ritualLevel = 1, ritualXp = Math.max(0, total);
  while (ritualLevel < MAX_RITUAL_LEVEL && ritualXp >= ritualXpToNext(ritualLevel)) { ritualXp -= ritualXpToNext(ritualLevel); ritualLevel++; }
  return { ritualLevel, ritualXp: ritualLevel >= MAX_RITUAL_LEVEL ? 0 : ritualXp };
}
export const AWAKENING = [
  { stars: 2, level: 8, ritualLevel: 3, ayahuasca: false },
  { stars: 3, level: 24, ritualLevel: 8, ayahuasca: true },
] as const;
export const ERA_GROWTH = [
  { level: 4, ritualLevel: 2 }, { level: 10, ritualLevel: 3 },
  { level: 16, ritualLevel: 5 }, { level: 22, ritualLevel: 7 },
] as const;
/** Experience needed to leave a level. */
export const xpToNext = (level: number): number => level >= MAX_HERO_LEVEL ? Infinity : Math.round(50 * Math.pow(level, 2.1));
/** Total experience gathered by a hero at this level and progress, used for progression and legacy save consolidation. */
export function totalXp(level: number, xp: number): number {
  let total = xp;
  for (let l = 1; l < level; l++) total += xpToNext(l);
  return total;
}
export function levelFromTotal(total: number): { level: number; xp: number } {
  let level = 1, left = Math.max(0, total);
  while (level < MAX_HERO_LEVEL && left >= xpToNext(level)) { left -= xpToNext(level); level++; }
  return { level, xp: level >= MAX_HERO_LEVEL ? 0 : left };
}
/** Each level adds 7% life and 5% attack. */
export const levelMultiplier = (level: number) => ({ hp: 1 + 0.07 * (level - 1), attack: 1 + 0.05 * (level - 1) });
/** Experience for each hero of the formation after a fight; repeats and defeats teach less. */
export function battleXp(level: number, victory: boolean, boss: boolean, firstClear: boolean): number {
  return Math.round((80 + Math.pow(Math.min(60, Math.max(1, level)), 2) * 28) * (victory ? firstClear ? 2 : 0.8 : 0.25) * (boss ? 1.3 : 1));
}

// ——— Hunting ———

export type TrailId = 'igarape' | 'terra-firme' | 'varzea' | 'serra' | 'cabeceira';
export interface Trail { id: TrailId; name: string; text: string; minutes: number; era: number; minLevel: number; xp: number; component: number }
export const TRAILS: Trail[] = [
  { id: 'igarape', name: 'Margem do igarapé', text: 'Pacas e peixes perto da aldeia. Bom para quem está começando.', minutes: 10, era: 1, minLevel: 1, xp: 1600, component: 0.05 },
  { id: 'terra-firme', name: 'Mata de terra firme', text: 'Queixadas em bando e rastros fundos entre as castanheiras.', minutes: 60, era: 1, minLevel: 4, xp: 8000, component: 0.15 },
  { id: 'varzea', name: 'Várzea alagada', text: 'Na cheia, a caça se esconde entre as árvores submersas.', minutes: 180, era: 2, minLevel: 8, xp: 30000, component: 0.25 },
  { id: 'serra', name: 'Serra das antas', text: 'Uma longa trilha atrás da maior caça da floresta.', minutes: 360, era: 3, minLevel: 14, xp: 80000, component: 0.4 },
  { id: 'cabeceira', name: 'Cabeceiras do rio', text: 'Onde o rio nasce e os espíritos da mata vigiam cada passo.', minutes: 480, era: 4, minLevel: 18, xp: 120000, component: 0.6 },
];
export const trailById = (id: string) => TRAILS.find(trail => trail.id === id);

/**
 * Panema is the Amazonian word for a hunter's bad luck: arrows that miss, game that flees.
 * It grows with failed hunts and is lifted by sananga and kambô.
 */
export const MAX_PANEMA = 3;
export const PANEMA_XP_LOSS = 0.15;
/** Chance that a hunt comes home with game. */
export function huntChance(stars: number, panema: number, sananga: number): number {
  return Math.max(0.3, Math.min(0.98, 0.86 + 0.04 * (stars - 1) + 0.04 * sananga - 0.14 * panema));
}
/** Each era makes room for another hunter, up to four. */
export const huntSlots = (era: number): number => Math.max(1, Math.min(4, Math.floor(era)));
/** Rapé before the hunt: focus and a steady aim. */
export const FOCUS_BONUS = 0.5;

// ——— Casa de Cura ———

export type PracticeId = 'rape' | 'sananga' | 'kambo' | 'ayahuasca' | 'cacau';
export interface Practice {
  id: PracticeId; name: string; native: string; peoples: string;
  /** What the practice is for the peoples who keep it. */
  text: string;
  /** What it does in the game. */
  effect: string;
  max: number; era: number; minLevel: number;
  /** Seconds the hero spends in ceremony and integration, away from fights. */
  rest: number;
  /** Shared by the whole tribe instead of one hero. */
  tribe?: boolean;
  requires?: PracticeId;
}
export const PRACTICES: Practice[] = [
  {
    id: 'rape', name: 'Rapé', native: 'rume', peoples: 'Huni Kuin, Yawanawá, Noke Koî e outros povos do Acre',
    text: 'Tabaco moído com cinzas de árvores, soprado pelo tepi por quem conduz ou pelo kuripe, em si mesmo. Para os povos que o guardam, limpa o pensamento, protege e firma a presença; também prepara para outras cerimônias.',
    effect: '+5% de velocidade de ataque por cerimônia (até 3) e foco na próxima caçada: +50% de experiência.',
    max: 3, era: 1, minLevel: 1, rest: 1200,
  },
  {
    id: 'sananga', name: 'Sananga', native: 'colírio da floresta', peoples: 'Matsés, Huni Kuin e Tikuna',
    text: 'Gotas da raiz da sananga (gênero Tabernaemontana) nos olhos. Arde forte e, para os caçadores, devolve a nitidez da mata e afasta a panema.',
    effect: 'Tira 1 de panema; +6% de dano por cerimônia (até 3) e +4% de sucesso nas caçadas por cerimônia.',
    max: 3, era: 1, minLevel: 2, rest: 2700,
  },
  {
    id: 'kambo', name: 'Kambô', native: 'kampô', peoples: 'Noke Koî (Katukina), Matsés, Yawanawá e Huni Kuin',
    text: 'A secreção do sapo Phyllomedusa bicolor, aplicada por quem conhece o rito. É uma prova física dura, feita para afastar a panema e devolver o vigor ao caçador.',
    effect: 'Tira toda a panema; +8% de vida máxima por cerimônia (até 3). A cerimônia dura 2 horas.',
    max: 3, era: 2, minLevel: 8, rest: 7200,
  },
  {
    id: 'ayahuasca', name: 'Ayahuasca', native: 'nixi pae', peoples: 'Huni Kuin; também Yawanawá, Asháninka e outros povos da Amazônia',
    text: 'O cipó e a folha, bebidos à noite em roda, guiados pelos cantos huni meka: a abertura (pae txanima), as mirações (dautibuya) e o fechamento (kayatibu). Para os Huni Kuin, nixi pae é o encanto do cipó, caminho de cura e conhecimento.',
    effect: '+20% de poder de habilidade e +25 de mana inicial, uma vez por herói. Exige um rapé antes. A cerimônia e a dieta duram 6 horas.',
    max: 1, era: 3, minLevel: 14, rest: 21600, requires: 'rape',
  },
  {
    id: 'cacau', name: 'Roda de cacau', native: 'Theobroma, alimento dos deuses', peoples: 'Mayo-Chinchipe da Alta Amazônia, que o cultivavam há mais de 5 mil anos; depois maias e outros povos',
    text: 'O cacau nasceu domesticado na Alta Amazônia e virou bebida de festa e aliança entre os maias. Em roda, a tribo bebe, canta e celebra junta.',
    effect: 'Toda a tribo por 10 minutos: +25% de experiência de caçadas e batalhas e +10% de cura e escudos.',
    max: Infinity, era: 2, minLevel: 1, rest: 0, tribe: true,
  },
];
export const practiceById = (id: string) => PRACTICES.find(practice => practice.id === id);
export const CACAO_DURATION = 600;
export const CACAO_XP = 0.25;
export const CACAO_HEAL = 0.1;

/** Ceremonies change heroes through these numbers; the Game reads them when a fight starts. */
export const RITUAL_EFFECT = { rapeAttackSpeed: 0.05, sanangaDamage: 0.06, kamboHp: 0.08, ayahuascaSpell: 0.2, ayahuascaMana: 25 };

/** A respectful note shown with the ceremonies. */
export const CURA_NOTE = 'As práticas da Casa de Cura vêm de povos indígenas e aparecem aqui de forma simbólica, com respeito. Fora do jogo, algumas têm riscos sérios à saúde e só fazem sentido no seu contexto tradicional, conduzidas por quem as conhece.';
