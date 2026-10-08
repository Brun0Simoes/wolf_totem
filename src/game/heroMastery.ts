/** Personal achievements are earned by taking part in completed battles. */
export interface HeroMastery {
  wins: number;
  stages: number[];
  skillWins: number;
  equippedWins: number;
  linkedWins: number;
  bossWins: number;
  claimed: string[];
}
export const freshMastery = (): HeroMastery => ({
  wins: 0,
  stages: [],
  skillWins: 0,
  equippedWins: 0,
  linkedWins: 0,
  bossWins: 0,
  claimed: [],
});
/** The current campaign frontier remains useful even after a personal XP reward. */
export const integrationEligible = (
  stage: number,
  progress: number,
  enemyLevel: number,
  heroLevel: number,
): boolean =>
  (stage > 0 && stage >= Math.max(1, progress)) || enemyLevel >= heroLevel - 3;
export const HERO_PROOFS = [
  {
    id: "first",
    name: "Primeiro chamado",
    text: "Vença uma batalha com este guardião na formação.",
    icon: "swords",
    goal: 1,
    xp: 400,
    progress: (m: HeroMastery) => m.wins,
  },
  {
    id: "explorer",
    name: "Novos horizontes",
    text: "Vença três expedições diferentes com este guardião.",
    icon: "compass",
    goal: 3,
    xp: 1200,
    progress: (m: HeroMastery) => m.stages.length,
  },
  {
    id: "skill",
    name: "Voz do espírito",
    text: "Vença três batalhas em que ele use a habilidade.",
    icon: "zap",
    goal: 3,
    xp: 2400,
    progress: (m: HeroMastery) => m.skillWins,
  },
  {
    id: "gear",
    name: "Armas da jornada",
    text: "Vença duas batalhas com um item equipado nele.",
    icon: "gem",
    goal: 2,
    xp: 2500,
    progress: (m: HeroMastery) => m.equippedWins,
  },
  {
    id: "bond",
    name: "Força dos laços",
    text: "Vença três batalhas com um laço deste guardião ativo.",
    icon: "network",
    goal: 3,
    xp: 4500,
    progress: (m: HeroMastery) => m.linkedWins,
  },
  {
    id: "path",
    name: "Além da clareira",
    text: "Vença cinco expedições diferentes com ele.",
    icon: "route",
    goal: 5,
    xp: 10000,
    progress: (m: HeroMastery) => m.stages.length,
  },
  {
    id: "boss",
    name: "Diante dos gigantes",
    text: "Vença cinco batalhas contra chefes com ele.",
    icon: "crown",
    goal: 5,
    xp: 18000,
    progress: (m: HeroMastery) => m.bossWins,
  },
  {
    id: "traveller",
    name: "Memória das terras",
    text: "Vença dez expedições diferentes com ele.",
    icon: "mountain",
    goal: 10,
    xp: 30000,
    progress: (m: HeroMastery) => m.stages.length,
  },
] as const;
export function sanitizeMastery(value: unknown): HeroMastery {
  const m =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const count = (key: string) =>
    typeof m[key] === "number" && Number.isFinite(m[key])
      ? Math.max(0, Math.min(1e6, Math.floor(m[key] as number)))
      : 0;
  return {
    wins: count("wins"),
    skillWins: count("skillWins"),
    equippedWins: count("equippedWins"),
    linkedWins: count("linkedWins"),
    bossWins: count("bossWins"),
    stages: Array.isArray(m.stages)
      ? ([
          ...new Set(
            m.stages.filter((n) => Number.isInteger(n) && n >= 1 && n <= 30),
          ),
        ] as number[])
      : [],
    claimed: Array.isArray(m.claimed)
      ? ([
          ...new Set(
            m.claimed.filter((id) => HERO_PROOFS.some((p) => p.id === id)),
          ),
        ] as string[])
      : [],
  };
}
