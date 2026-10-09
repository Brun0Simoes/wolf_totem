import { characters, type Character } from "../data/characters";
import { nextRandom } from "./roster";
import { roleOf } from "./armyAdvisor";
import type { PracticeId } from "./tribe";

export interface Draft {
  era: number;
  offers: number[];
  rolls: number;
}
export const STARTING_AMBER = 80;
export const draftCost = (era: number) => 24 + era * 12;
export const rerollCost = (era: number) => 5 + era * 3;
export const componentCost = (era: number) => 26 + era * 4;
export const RITUAL_PRICES: Record<PracticeId, number> = {
  rape: 16,
  sananga: 28,
  kambo: 48,
  ayahuasca: 90,
  cacau: 44,
};
/** Learned ritual bonuses raise the price; repeat XP never needs a waiting period. */
export const ritualCost = (id: PracticeId, count = 0) =>
  Math.round(RITUAL_PRICES[id] * (1 + Math.min(20, count) * 0.08));
export const battleAmber = (
  stage: number,
  victory: boolean,
  first: boolean,
  boss: boolean,
) =>
  Math.round(
    (12 + Math.min(60, Math.max(1, stage)) * 3) *
      (victory ? (first ? 1.8 : 1) : 0.3) *
      (boss ? 1.4 : 1),
  );
export function draftPool(
  era: number,
  owned: number[],
  excluded: number[] = [],
  target = "",
): Character[] {
  return characters.filter((c) => {
    if (c.cost > era || owned.includes(c.id) || excluded.includes(c.id))
      return false;
    if (!target) return true;
    if (target.startsWith("role:")) return roleOf(c) === target.slice(5);
    if (target.startsWith("trait:")) return c.traits.includes(target.slice(6));
    return false;
  });
}
/** Cost tiers use equal weights. Exhausted tiers disappear; candidates are sampled without replacement. */
export function drawCandidates(
  era: number,
  owned: number[],
  excluded: number[],
  seed: number,
  count: number,
  target = "",
) {
  const offers: number[] = [];
  for (let i = 0; i < count; i++) {
    const pool = draftPool(era, owned, [...excluded, ...offers], target);
    if (!pool.length) break;
    const tiers = [...new Set(pool.map((c) => c.cost))];
    const a = nextRandom(seed);
    seed = a.seed;
    const tier = tiers[Math.floor(a.value * tiers.length)];
    const options = pool.filter((c) => c.cost === tier);
    const b = nextRandom(seed);
    seed = b.seed;
    offers.push(options[Math.floor(b.value * options.length)].id);
  }
  return { offers, seed };
}
export function sanitizeDraft(
  value: unknown,
  era: number,
  owned: number[],
): Draft | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Record<string, unknown>;
  if (!Array.isArray(d.offers)) return null;
  const paidEra =
    typeof d.era === "number" && Number.isInteger(d.era)
      ? Math.max(1, Math.min(era, d.era))
      : era;
  const offers = [...new Set(d.offers)]
    .filter(
      (id) =>
        typeof id === "number" &&
        draftPool(paidEra, owned).some((c) => c.id === id),
    )
    .slice(0, 3) as number[];
  return offers.length
    ? {
        era: paidEra,
        offers,
        rolls:
          typeof d.rolls === "number" && Number.isFinite(d.rolls)
            ? Math.max(0, Math.min(1e6, Math.floor(d.rolls)))
            : 0,
      }
    : null;
}
