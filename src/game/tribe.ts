import type { Resources } from './simulation';

/**
 * How heroes grow, outside any shop or copies: two tracks per hero.
 * - Experience comes from activities: hunts, work in the village and expeditions.
 * - Ritual strength comes from the shamanic ceremonies of the Casa de Cura.
 * A hero ascends to the next star (1★ human, 2★ spirit bond, 3★ primal avatar) only when both are full:
 * the level reaches the star's ceiling and the ritual bar is complete.
 * New heroes answer the tribe's call at the Circle of Spirits; every character is unique.
 * Times are seconds of village time, which also runs while the game is closed.
 */

const MINUTE = 60, HOUR = 3600;
export const TIME = { MINUTE, HOUR, DAY: 24 * HOUR };

// ——— Levels and experience ———

export const MAX_HERO_LEVEL = 30;
/** Each star opens ten levels: 1★ grows to 10, 2★ to 20 and 3★ to 30. */
export const levelCap = (stars: number): number => Math.min(MAX_HERO_LEVEL, 10 * stars);
/** Experience needed to leave a level: about 7.5 thousand to level 10, 58 thousand to 20 and 190 thousand to 30. */
export const xpToNext = (level: number): number => level >= MAX_HERO_LEVEL ? Infinity : Math.round(35 * Math.pow(level, 1.85));
export function totalXp(level: number, xp: number): number {
  let total = xp;
  for (let l = 1; l < level; l++) total += xpToNext(l);
  return total;
}
/**
 * Level reached with this much experience, never past the star's ceiling. A hero at the ceiling keeps up to
 * one level of experience in reserve, spent as soon as the next star opens; anything beyond is lost.
 */
export function levelFromTotal(total: number, cap = MAX_HERO_LEVEL): { level: number; xp: number } {
  let level = 1, left = Math.max(0, total);
  while (level < cap && left >= xpToNext(level)) { left -= xpToNext(level); level++; }
  return { level, xp: level >= MAX_HERO_LEVEL ? 0 : Math.min(left, xpToNext(level)) };
}
/** True when the hero's experience bar is full and only the next star lets it grow. */
export const atCeiling = (hero: { stars: number; level: number; xp: number }): boolean =>
  hero.level >= levelCap(hero.stars) && (hero.level >= MAX_HERO_LEVEL || hero.xp >= xpToNext(hero.level));
/** Each level adds 6% life and 5% attack: a level-30 avatar is nearly three times its level-1 self, before the stars. */
export const levelMultiplier = (level: number) => ({ hp: 1 + 0.06 * (level - 1), attack: 1 + 0.05 * (level - 1) });
/** Experience for each hero of the formation after a fight: a first victory teaches a lot, repeats little. */
export function battleXp(stage: number, victory: boolean, boss: boolean, firstClear: boolean): number {
  return Math.round((40 + 25 * stage) * (victory ? firstClear ? 1 : 0.12 : 0.08) * (boss ? 1.5 : 1));
}
/** Heroes working in a building learn its craft: experience per second. */
export const workXpRate = (buildingLevel: number): number => (80 + 8 * buildingLevel) / HOUR;

// ——— Ritual strength and ascension ———

/** Ritual strength needed to leave 1★ and 2★. */
export const RITUAL_NEEDED = [120, 500] as const;
export const ritualNeeded = (stars: number): number => stars >= 3 ? 0 : RITUAL_NEEDED[stars - 1];
export interface Ascension { stars: number; name: string; text: string; hours: number; curaLevel: number; cost: Resources }
export const ASCENSIONS: Ascension[] = [
  { stars: 2, name: 'O despertar do vínculo', text: 'O espírito animal se mostra no corpo do herói: marcas acesas, olhos que enxergam como o bicho.', hours: 4, curaLevel: 2, cost: { wood: 300, food: 400, stone: 200, spirit: 500 } },
  { stars: 3, name: 'A forma primal', text: 'Herói e espírito se tornam um só. O avatar primal desperta.', hours: 12, curaLevel: 4, cost: { wood: 2500, food: 3000, stone: 2000, spirit: 4000 } },
];
export const ascensionTo = (stars: number) => ASCENSIONS.find(entry => entry.stars === stars);
/** What still stands between a hero and the next star. */
export function ascensionReady(hero: { stars: number; level: number; ritual: number }): { level: boolean; ritual: boolean; ready: boolean } {
  if (hero.stars >= 3) return { level: false, ritual: false, ready: false };
  const level = hero.level >= levelCap(hero.stars), ritual = hero.ritual >= ritualNeeded(hero.stars);
  return { level, ritual, ready: level && ritual };
}

// ——— Hunting ———

export type TrailId = 'igarape' | 'terra-firme' | 'varzea' | 'serra' | 'cabeceira';
export interface Trail { id: TrailId; name: string; text: string; minutes: number; era: number; minLevel: number; xp: number; food: number; component: number }
export const TRAILS: Trail[] = [
  { id: 'igarape', name: 'Margem do igarapé', text: 'Pacas e peixes perto da aldeia. Bom para quem está começando.', minutes: 10, era: 1, minLevel: 1, xp: 45, food: 60, component: 0.05 },
  { id: 'terra-firme', name: 'Mata de terra firme', text: 'Queixadas em bando e rastros fundos entre as castanheiras.', minutes: 30, era: 1, minLevel: 4, xp: 180, food: 220, component: 0.12 },
  { id: 'varzea', name: 'Várzea alagada', text: 'Na cheia, a caça se esconde entre as árvores submersas.', minutes: 60, era: 2, minLevel: 8, xp: 480, food: 500, component: 0.2 },
  { id: 'serra', name: 'Serra das antas', text: 'Horas de trilha atrás da maior caça da floresta.', minutes: 180, era: 3, minLevel: 14, xp: 1950, food: 1400, component: 0.35 },
  { id: 'cabeceira', name: 'Cabeceiras do rio', text: 'Uma noite inteira onde o rio nasce e os espíritos da mata vigiam cada passo.', minutes: 480, era: 4, minLevel: 20, xp: 7000, food: 4000, component: 0.6 },
];
export const trailById = (id: string) => TRAILS.find(trail => trail.id === id);

/**
 * Panema is the Amazonian word, of Tupi origin, for a hunter's bad luck: arrows that miss, game that flees.
 * It grows with failed hunts and is lifted by sananga and kambô.
 */
export const MAX_PANEMA = 3;
export const PANEMA_XP_LOSS = 0.15;
/** Sananga's sharp sight before a hunt. */
export const SIGHT_BONUS = 0.15;
/** Rapé's focus before a hunt. */
export const FOCUS_BONUS = 0.5;
/** Chance that a hunt comes home with game. */
export function huntChance(stars: number, panema: number, sight = false): number {
  return Math.max(0.3, Math.min(0.98, 0.86 + 0.04 * (stars - 1) - 0.14 * panema + (sight ? SIGHT_BONUS : 0)));
}
/** The hunting camp sends more hunters as it grows. */
export const huntSlots = (campLevel: number): number => Math.min(5, 1 + Math.floor(campLevel / 3));

// ——— Ceremonies of the Casa de Cura ———

export type PracticeId = 'rape' | 'sananga' | 'kambo' | 'ayahuasca' | 'cacau';
export interface Practice {
  id: PracticeId; name: string; native: string; peoples: string;
  /** What the practice is for the peoples who keep it. */
  text: string;
  /** What it does in the game, besides ritual strength. */
  effect: string;
  /** Ritual strength it adds to the hero, or to each hero at home for the cacao circle. */
  ritual: number;
  /** Seconds of ceremony and integration, with the hero away; rapé and sananga take effect at once. */
  duration: number;
  /** Seconds before the same hero (or the tribe, for the cacao circle) can repeat it. */
  cooldown: number;
  curaLevel: number; era: number; minLevel: number;
  tribe?: boolean;
  requires?: PracticeId;
  /** Offering for a hero of these stars. */
  cost: (stars: number) => Resources;
}
const offering = (wood: number, food: number, stone: number, spirit: number) => (stars: number): Resources =>
  ({ wood: wood * stars, food: food * stars, stone: stone * stars, spirit: spirit * stars });
export const PRACTICES: Practice[] = [
  {
    id: 'rape', name: 'Rapé', native: 'rume', peoples: 'Huni Kuin, Yawanawá, Noke Koî e outros povos do Acre',
    text: 'Tabaco moído com cinzas de árvores, soprado pelo tepi por quem conduz ou pelo kuripe, em si mesmo. Para os povos que o guardam, limpa o pensamento, protege e firma a presença; também prepara para outras cerimônias.',
    effect: 'Foco na próxima caçada: +50% de experiência.',
    ritual: 4, duration: 0, cooldown: 2 * HOUR, curaLevel: 1, era: 1, minLevel: 1,
    cost: offering(0, 10, 0, 15),
  },
  {
    id: 'sananga', name: 'Sananga', native: 'colírio da floresta', peoples: 'Matsés, Huni Kuin e Tikuna',
    text: 'Gotas da raiz da sananga (gênero Tabernaemontana) nos olhos. Arde forte e, para os caçadores, devolve a nitidez da mata e afasta a panema.',
    effect: 'Tira 1 de panema e afia o olhar: +15% de sucesso na próxima caçada.',
    ritual: 8, duration: 0, cooldown: 6 * HOUR, curaLevel: 1, era: 1, minLevel: 3,
    cost: offering(10, 20, 0, 30),
  },
  {
    id: 'kambo', name: 'Kambô', native: 'kampô', peoples: 'Noke Koî (Katukina), Matsés, Yawanawá e Huni Kuin',
    text: 'A secreção do sapo Phyllomedusa bicolor, aplicada por quem conhece o rito. É uma prova física dura, feita para afastar a panema e devolver o vigor ao caçador.',
    effect: 'Tira toda a panema.',
    ritual: 20, duration: HOUR, cooldown: 24 * HOUR, curaLevel: 2, era: 2, minLevel: 6,
    cost: offering(30, 60, 20, 80),
  },
  {
    id: 'ayahuasca', name: 'Ayahuasca', native: 'nixi pae', peoples: 'Huni Kuin; também Yawanawá, Asháninka e outros povos da Amazônia',
    text: 'O cipó e a folha, bebidos à noite em roda, guiados pelos cantos huni meka: a abertura (pae txanima), as mirações (dautibuya) e o fechamento (kayatibu). Para os Huni Kuin, nixi pae é o encanto do cipó, caminho de cura e conhecimento.',
    effect: 'A cerimônia de maior força ritual. Exige um rapé antes.',
    ritual: 45, duration: 8 * HOUR, cooldown: 72 * HOUR, curaLevel: 3, era: 2, minLevel: 8, requires: 'rape',
    cost: offering(100, 150, 40, 250),
  },
  {
    id: 'cacau', name: 'Roda de cacau', native: 'Theobroma, alimento dos deuses', peoples: 'Mayo-Chinchipe da Alta Amazônia, que o cultivavam há mais de 5 mil anos; depois maias e outros povos',
    text: 'O cacau nasceu domesticado na Alta Amazônia e virou bebida de festa e aliança entre os maias. Em roda, a tribo bebe, canta e celebra junta.',
    effect: 'Toda a tribo que estiver na aldeia: +3 de força ritual e +25% de experiência por 2 horas.',
    ritual: 3, duration: 2 * HOUR, cooldown: 12 * HOUR, curaLevel: 2, era: 2, minLevel: 1, tribe: true,
    cost: () => ({ wood: 60, food: 300, stone: 0, spirit: 90 }),
  },
];
export const practiceById = (id: string) => PRACTICES.find(practice => practice.id === id);
export const CACAO_XP = 0.25;
/** Heroes the Casa de Cura can hold in ceremony at once. */
export const ceremonySlots = (curaLevel: number): number => curaLevel > 0 ? Math.min(5, 1 + Math.floor(curaLevel / 3)) : 0;

/** A respectful note shown with the ceremonies. */
export const CURA_NOTE = 'As práticas da Casa de Cura vêm de povos indígenas e aparecem aqui de forma simbólica, com respeito. Fora do jogo, algumas têm riscos sérios à saúde e só fazem sentido no seu contexto tradicional, conduzidas por quem as conhece.';

// ——— The tribe's ritual level and the call of the spirits ———

/** Every point of ritual strength the tribe gathers raises its ritual level, which decides who answers its call. */
export const TRIBE_RITUAL_LEVELS = [0, 20, 60, 120, 220, 400, 650, 1000, 1500, 2200] as const;
export function tribeRitualLevel(total: number): { level: number; into: number; span: number } {
  let level = 1;
  while (level < TRIBE_RITUAL_LEVELS.length && total >= TRIBE_RITUAL_LEVELS[level]) level++;
  const floor = TRIBE_RITUAL_LEVELS[level - 1], next = TRIBE_RITUAL_LEVELS[level];
  return { level, into: total - floor, span: next === undefined ? 0 : next - floor };
}
/** Tribe ritual level needed to call a hero of each cost. */
export const CALL_LEVEL = [1, 2, 4, 6, 8] as const;
/** Called heroes arrive having learned from the tribe: half the level of its strongest hero, up to 10. */
export const arrivalLevel = (topLevel: number): number => Math.max(1, Math.min(10, Math.floor(topLevel / 2)));
/** Minutes a call takes and the offering, by cost. */
export const CALL_MINUTES = [3, 30, 120, 480, 1440] as const;
const CALL_WEIGHT = [1, 4, 12, 30, 70] as const;
export const callCost = (cost: number): Resources => {
  const k = CALL_WEIGHT[cost - 1];
  return { wood: 60 * k, food: 120 * k, stone: 40 * k, spirit: 100 * k };
};
/** Calls the Circle of Spirits can hold at once. */
export const callSlots = (shrineLevel: number, extra = 0): number => 1 + Math.floor(shrineLevel / 5) + extra;

// ——— Construction ———

/** Seconds to raise a building from this level to the next (0 means building it from the ground). */
export const buildTime = (level: number): number => Math.round(45 * Math.pow(1.65, Math.max(0, level - 1)));
/** Seconds to enter each era from the previous one (index: current village level). */
export const ERA_TIME = [0, 5 * MINUTE, HOUR, 6 * HOUR, 24 * HOUR] as const;
export const builderSlots = (villageLevel: number): number => villageLevel >= 3 ? 2 : 1;
