import { characters, type Character } from "../data/characters";
import { nextRandom } from "./roster";
import { characterUnlocked } from '../data/collections';
import type { PracticeId } from "./tribe";

export interface Draft {
  era: number;
  offers: number[];
  rolls: number;
  /** One free, random replacement per card, persisted across reloads. */
  rerolled: boolean[];
}
export const STARTING_AMBER = 80;
export const draftCost = (era: number) => 24 + era * 12;
export const componentCost = (era: number) => 26 + era * 4;
export const RITUAL_PRICES: Record<PracticeId, number> = {
  rape: 16,
  sananga: 28,
  kambo: 48,
  ayahuasca: 90,
  cacau: 44,
  consecration: 36, "blood-pact": 48, "soul-forge": 64, "speaker-seal": 56, "ancestral-song": 44, eclipse: 120,
  requiem:52, 'first-blood':88,
  'air-discipline':36,'water-flow':44,'earth-root':52,'fire-breath':48,'warrior-path':36,'spirit-balance':64,'avatar-convergence':120,
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
      (victory ? (first ? 1.8 : 1) : 0) *
      (boss ? 1.4 : 1),
  );
export function draftPool(
  era: number,
  owned: number[],
  excluded: number[] = [],
  rebirths = 0,
): Character[] {
  return characters.filter((c) => c.cost <= era && characterUnlocked(c.id,rebirths) && !owned.includes(c.id) && !excluded.includes(c.id));
}
/** Cost tiers use equal weights. Exhausted tiers disappear; candidates are sampled without replacement. */
export function drawCandidates(
  era: number,
  owned: number[],
  excluded: number[],
  seed: number,
  count: number,
  rebirths = 0,
) {
  const offers: number[] = [];
  for (let i = 0; i < count; i++) {
    const pool = draftPool(era, owned, [...excluded, ...offers], rebirths);
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
  legacy = false,
  rebirths = 0,
): Draft | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Record<string, unknown>;
  if (!Array.isArray(d.offers)) return null;
  const paidEra =
    typeof d.era === "number" && Number.isInteger(d.era)
      ? Math.max(1, Math.min(era, d.era))
      : era;
  const offers: number[] = [], rerolled: boolean[] = [];
  const allowed = new Set(draftPool(paidEra, owned, [], rebirths).map(c => c.id));
  d.offers.forEach((id, index) => {
    if (typeof id !== "number" || !allowed.has(id) || offers.includes(id) || offers.length >= 3) return;
    offers.push(id);
    // v9 did not record card history. Its existing offers receive the new allowance once.
    // Missing or corrupt v10 flags cannot restore a spent replacement.
    rerolled.push(legacy ? false : !Array.isArray(d.rerolled) || d.rerolled[index] !== false);
  });
  return offers.length
    ? {
        era: paidEra,
        offers,
        rerolled,
        rolls:
          typeof d.rolls === "number" && Number.isFinite(d.rolls)
            ? Math.max(0, Math.min(1e6, Math.floor(d.rolls)))
            : 0,
      }
    : null;
}
