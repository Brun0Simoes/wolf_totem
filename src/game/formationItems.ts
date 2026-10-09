import { characters } from "../data/characters";
import type { GameState, Hero } from "./simulation";
import { activeArmy, contextualItemFit, itemReason, roleOf } from "./armyAdvisor";
import { ITEMS, itemById, isComponent, type ItemDef } from "./items";
import { countTraits, traitStatus } from "./synergies";
import { allySlotCenter } from "./board";
import { componentCost } from "./economy";

export interface FormationItemStep {
  kind: "equip" | "craft" | "complete";
  heroUid: string;
  itemId: string;
  /** Original bag indices. No piece is reserved twice, including identical components. */
  bagIndices: number[];
  equippedIndex?: number;
  score: number;
  reason: string;
}
const character = (h: Hero) => characters.find(c => c.id === h.characterId)!;
const spellRole = (h: Hero) => ["caster", "support", "summon"].includes(roleOf(character(h)));
function neighbors(h: Hero, party: Hero[]) {
  if (h.slot === null) return [];
  const p = allySlotCenter(h.slot);
  return party.filter(v => v.uid !== h.uid && v.slot !== null &&
    Math.hypot(p.x - allySlotCenter(v.slot).x, p.y - allySlotCenter(v.slot).y) <= 1.1);
}
/** Marginal value for the actual deployed tribe: roles, active bonds, existing gear and enemy threats. */
export function formationItemScore(s: GameState, h: Hero, item: ItemDef, party = activeArmy(s)) {
  const c = character(h), role = roleOf(c), spell = spellRole(h);
  const counts = countTraits(party.map(v => v.characterId));
  const tier = (name: string) => c.traits.includes(name) ? traitStatus(name, counts.get(name) ?? 0).tier : 0;
  let score = contextualItemFit(s, h, item);
  score += (item.perks?.shred ?? 0) * party.filter(spellRole).length * (spell ? 1 : 2.5);
  score += (item.perks?.teamShield ?? 0) * neighbors(h, party).length * 28;
  score += (item.stats.attackPct ?? 0) * (tier("Caçador") + tier("Noturno")) * 15;
  score += (item.stats.spellPower ?? 0) * (tier("Xamã") + tier("Místico")) * 15;
  score += ((item.stats.hp ?? 0) * .008 + (item.stats.hpPct ?? 0) * 15) * tier("Guardião");
  if (!c.manaMax) score -= (item.stats.mana ?? 0) * .9 + (item.stats.manaRegen ?? 0) * 8;
  // Perks do not stack in the combat runtime. Avoid spending a pair on a repeated passive.
  const existingPerks = h.items.flatMap(id => Object.keys(itemById(id)?.perks ?? {}));
  const repeated = Object.keys(item.perks ?? {}).some(k => existingPerks.includes(k));
  if (repeated) score *= .55;
  if (h.items.includes(item.id)) score *= .6;
  // Experienced damage dealers benefit from offensive stats, without starving an unequipped front.
  if (["ranged", "flank", "caster"].includes(role)) score *= 1 + Math.min(.3, (h.level - 1) * .007 + (h.stars - 1) * .08);
  return score / (1 + h.items.filter(id => !isComponent(id)).length * .18);
}
export function formationItemReason(s: GameState, h: Hero, item: ItemDef, party = activeArmy(s)) {
  const counts = countTraits(party.map(v => v.characterId)), c = character(h);
  if (item.perks?.shred && party.some(v => v.uid !== h.uid && spellRole(v)))
    return "Seus ataques removem resistência mágica e ajudam os conjuradores da formação a causar dano.";
  if (item.perks?.teamShield) {
    const names = neighbors(h, party).map(v => character(v).name);
    return names.length ? `Na posição atual, o escudo protege também ${names.join(", ")}.` : "Escuda o portador. Aproxime aliados a até 1,1 célula para compartilhar a proteção.";
  }
  const core = c.traits.find(n => traitStatus(n, counts.get(n) ?? 0).tier > 0 &&
    ((["Caçador", "Noturno"].includes(n) && (item.stats.attackPct || item.perks?.crit3 || item.perks?.asStack)) ||
     (["Xamã", "Místico"].includes(n) && (item.stats.spellPower || item.stats.mana || item.stats.manaRegen)) ||
     (n === "Guardião" && (item.stats.hp || item.stats.hpPct))));
  return (core ? `Apoia o núcleo ${core} (${counts.get(core)} em campo). ` : "") + itemReason(c, item, s);
}

function workingState(s: GameState) {
  return { bag: s.inventory.map((id, index) => ({id, index})), party: activeArmy(s).map(h => ({...h, items: [...h.items]})) };
}
type WorkingState = ReturnType<typeof workingState>;
function reservePair(bag: WorkingState["bag"], recipe: [string, string]) {
  const a = bag.find(v => v.id === recipe[0]);
  const b = bag.find(v => v.id === recipe[1] && v.index !== a?.index);
  return a && b ? [a.index, b.index] : null;
}
function applyStep(work: WorkingState, step: FormationItemStep) {
  work.bag = work.bag.filter(v => !step.bagIndices.includes(v.index));
  const h = work.party.find(h => h.uid === step.heroUid)!;
  if (step.equippedIndex !== undefined) h.items[step.equippedIndex] = step.itemId;
  else h.items.push(step.itemId);
}

/** One shared reservation plan for ready items, bag recipes and components already equipped. */
export function formationItemPlan(s: GameState): FormationItemStep[] {
  const work = workingState(s), result: FormationItemStep[] = [];
  // At most three actions per deployed hero. Enumerating recipe types keeps large bags inexpensive.
  for (let round = 0; round < work.party.length * 3; round++) {
    const candidates: FormationItemStep[] = [];
    for (const hero of work.party) {
      const add = (item: ItemDef, kind: FormationItemStep["kind"], bagIndices: number[], equippedIndex?: number) => {
        candidates.push({kind, heroUid: hero.uid, itemId: item.id, bagIndices, equippedIndex,
          score: formationItemScore(s, hero, item, work.party), reason: formationItemReason(s, hero, item, work.party)});
      };
      if (hero.items.length < 3) {
        for (const v of work.bag) {
          const item = itemById(v.id)!;
          if (item.kind === "item") add(item, "equip", [v.index]);
        }
        for (const item of ITEMS) {
          const pair = reservePair(work.bag, item.recipe!);
          if (pair) add(item, "craft", pair);
        }
      }
      hero.items.forEach((id, equippedIndex) => {
        if (!isComponent(id)) return;
        for (const item of ITEMS) {
          const recipe = [...item.recipe!], at = recipe.indexOf(id);
          if (at < 0) continue;
          recipe.splice(at, 1);
          const other = work.bag.find(v => v.id === recipe[0]);
          if (other) add(item, "complete", [other.index], equippedIndex);
        }
      });
    }
    candidates.sort((a, b) => b.score - a.score || a.bagIndices[0] - b.bagIndices[0] || a.heroUid.localeCompare(b.heroUid) || a.itemId.localeCompare(b.itemId));
    const step = candidates[0];
    if (!step || step.score <= 0) break;
    result.push(step);
    applyStep(work, step);
  }
  return result;
}

/** Future goals reserve nothing and never buy components automatically. */
export function formationItemGoals(s: GameState) {
  const work = workingState(s);
  formationItemPlan(s).forEach(step => applyStep(work, step));
  const candidates = work.party.flatMap(hero => ITEMS.flatMap(item => {
    if (hero.items.includes(item.id)) return [];
    const equippedIndex = hero.items.findIndex(id => isComponent(id) && item.recipe!.some(piece => piece === id));
    if (hero.items.length >= 3 && equippedIndex < 0) return [];
    const remaining = [...item.recipe!];
    if (equippedIndex >= 0) remaining.splice(remaining.findIndex(id => id === hero.items[equippedIndex]), 1);
    const available = work.bag.map(v => v.id), missing: string[] = [];
    for (const id of remaining) {
      const i = available.indexOf(id);
      if (i >= 0) available.splice(i, 1); else missing.push(id);
    }
    if (!missing.length) return [];
    const score = formationItemScore(s, hero, item, work.party);
    return [{heroUid: hero.uid, itemId: item.id, missing, cost: missing.length * componentCost(s.era), score,
      reason: formationItemReason(s, hero, item, work.party)}];
  })).sort((a, b) => b.score / (1 + b.missing.length * .4) - a.score / (1 + a.missing.length * .4));
  const heroes = new Set<string>(), items = new Set<string>();
  return candidates.filter(v => {
    if (heroes.has(v.heroUid) || items.has(v.itemId)) return false;
    heroes.add(v.heroUid); items.add(v.itemId); return true;
  }).slice(0, 3);
}
