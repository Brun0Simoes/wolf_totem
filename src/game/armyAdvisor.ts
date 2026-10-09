import { characters, type Character } from "../data/characters";
import { countTraits, TRAIT_RULES, traitStatus } from "./synergies";
import { ITEMS, itemById, recipeFor, type ItemDef } from "./items";
import type { GameState, Hero } from "./simulation";
import { unlockedCost } from "./roster";
import { expectedLevel, stageById, endlessStage } from "./campaign";
import {
  allySlotCenter,
  enemyFormation,
  enemySlotCenter,
  FORMATION_SLOTS,
} from "./board";
import { PREPARATIONS } from "./ancestralJourney";
import { spiritById } from "./spirits";

export type ArmyRole =
  | "front"
  | "ranged"
  | "caster"
  | "support"
  | "flank"
  | "summon";
export const ROLE_GUIDE: Record<
  ArmyRole,
  { name: string; position: string; description: string; items: string[] }
> = {
  front: {
    name: "Linha de frente",
    position: "Primeira fileira",
    description:
      "Absorve os primeiros golpes e protege quem ataca de longe. Vida, armadura e resistência aumentam sua permanência.",
    items: ["muralha", "carvalho", "pele-urso"],
  },
  ranged: {
    name: "Atirador",
    position: "Últimas fileiras",
    description:
      "Causa dano constante com ataques. Precisa de espaço, proteção e velocidade de ataque.",
    items: ["garra", "tempestade", "talisma"],
  },
  caster: {
    name: "Conjurador",
    position: "Atrás da linha de frente",
    description:
      "Seu impacto vem das habilidades. Mana e poder de habilidade antecipam e fortalecem as conjurações.",
    items: ["lanca", "coroa", "colar-lua"],
  },
  support: {
    name: "Suporte",
    position: "Centro ou retaguarda",
    description:
      "Sustenta os companheiros com cura ou escudos. Proteja-o para que consiga conjurar várias vezes.",
    items: ["cajado-vida", "coroa", "escudo-totem"],
  },
  flank: {
    name: "Flanqueador",
    position: "Laterais da formação",
    description:
      "Pressiona alvos vulneráveis. Ataque, velocidade e sobrevivência ajudam a alcançar a retaguarda.",
    items: ["vento", "garra", "talisma"],
  },
  summon: {
    name: "Invocador",
    position: "Segunda fileira",
    description:
      "Precisa conjurar cedo para aumentar o número de aliados. Mana inicial e o laço Invocador apoiam esse plano.",
    items: ["coroa", "colar-lua", "cajado-vida"],
  },
};
function deriveRole(c: Character): ArmyRole {
  if (c.traits.includes("Invocador")) return "summon";
  if (c.traits.includes("Guardião") || c.traits.includes("Brigão"))
    return "front";
  if (c.traits.includes("Espreitador") || c.traits.includes("Trapaceiro"))
    return "flank";
  if (
    /cura|curar|escudo para|aliados.*escudo|concede AS e Mana/i.test(
      c.ability.description,
    ) &&
    c.range > 1
  )
    return "support";
  if (c.traits.includes("Xamã") || c.traits.includes("Místico"))
    return "caster";
  return c.range > 1 ? "ranged" : "front";
}
const roleCache = new WeakMap<Character, ArmyRole>();
export function roleOf(c: Character): ArmyRole {
  const cached = roleCache.get(c);
  if (cached) return cached;
  const role = deriveRole(c);
  roleCache.set(c, role);
  return role;
}
const characterMap = new Map(characters.map((c) => [c.id, c]));
const char = (h: Hero) => characterMap.get(h.characterId)!;
export const activeArmy = (s: GameState) =>
  s.heroes.filter((h) => h.slot !== null && !h.away);
export function armyScore(party: Hero[], focus: string[] = []): number {
  const traits = countTraits(party.map((h) => h.characterId));
  let score = party.reduce(
    (sum, h) => sum + h.level * 0.8 + h.stars * 10 + char(h).cost * 2,
    0,
  );
  for (const [name, count] of traits) {
    const rule = TRAIT_RULES[name],
      tier = traitStatus(name, count).tier;
    // A six-member commitment beats a stack of shallow pairs at equal hero strength.
    score +=
      rule.kind === "espírito" ? tier * 3 : ([0, 9, 32, 110][tier] ?? 110);
    if (rule.kind !== "espírito") score += Math.pow(count, 1.6) * 0.7;
    if (focus.includes(name)) score += count * 9 + tier * 8;
  }
  const roles = party.map((h) => roleOf(char(h))),
    front = roles.filter((r) => r === "front").length;
  score += front ? Math.min(2, front) * 10 : -22;
  score += roles.some((r) =>
    ["ranged", "caster", "summon", "flank"].includes(r),
  )
    ? 8
    : -12;
  if (front > Math.ceil(party.length * 0.65))
    score -= (front - Math.ceil(party.length * 0.65)) * 7;
  if (roles.includes("support")) score += 5;
  return score;
}
function selectParty(
  s: GameState,
  focus: string[] = s.journey.focusTraits,
  style = "balanced",
): Hero[] {
  const eligible = s.heroes.filter((h) => !h.away),
    limit = 2 + s.era,
    party: Hero[] = [];
  const value = (p: Hero[]) =>
    strategicScore(p, s, focus) +
    p.reduce(
      (n, h) =>
        n +
        (style === "magic" &&
        ["caster", "summon", "support"].includes(roleOf(char(h)))
          ? 7
          : style === "physical" &&
              ["ranged", "flank"].includes(roleOf(char(h)))
            ? 7
            : style === "durable" && roleOf(char(h)) === "front"
              ? 5
              : 0),
      0,
    );
  // Seed all members of a requested deep trait before filling the supporting roles.
  if (focus.length === 1) {
    const core = eligible
      .filter((h) => char(h).traits.includes(focus[0]))
      .sort((a, b) => value([b]) - value([a]) || a.characterId - b.characterId);
    party.push(...core.slice(0, Math.min(limit, 6)));
  }
  while (party.length < limit && party.length < eligible.length) {
    const best = eligible
      .filter((h) => !party.includes(h))
      .sort(
        (a, b) =>
          value([...party, b]) - value([...party, a]) ||
          a.characterId - b.characterId,
      )[0];
    party.push(best);
  }
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < party.length; i++)
      for (const h of eligible.filter((h) => !party.includes(h))) {
        const swap = party.map((p, j) => (j === i ? h : p));
        if (value(swap) > value(party) + 0.01) party[i] = h;
      }
  return party.sort(
    (a, b) =>
      Number(roleOf(char(b)) === "front") -
        Number(roleOf(char(a)) === "front") ||
      b.level - a.level ||
      a.characterId - b.characterId,
  );
}
export interface CompositionPlan {
  id: string;
  name: string;
  focus: string[];
  party: Hero[];
  score: number;
  description: string;
}
const compositionCache = new WeakMap<
  GameState,
  { key: string; plans: CompositionPlan[] }
>();
export function compositionPlans(s: GameState): CompositionPlan[] {
  const key = planSignature(s),
    cached = compositionCache.get(s);
  if (cached?.key === key) return cached.plans;
  const definitions = [
    {
      id: "balanced",
      name: "Guarda equilibrada",
      focus: [] as string[],
      style: "balanced",
      description: "Frente resistente, dano e proteção.",
    },
    {
      id: "magic",
      name: "Conselho dos espíritos",
      focus: [] as string[],
      style: "magic",
      description: "Habilidades, invocações e mana.",
    },
    {
      id: "physical",
      name: "Flechas e emboscadas",
      focus: [] as string[],
      style: "physical",
      description: "Dano contínuo e pressão na retaguarda.",
    },
    {
      id: "durable",
      name: "Muralha ancestral",
      focus: [] as string[],
      style: "durable",
      description: "Resistência para enfrentar dano concentrado.",
    },
    ...Object.entries(TRAIT_RULES)
      .filter(
        ([name, r]) =>
          r.kind !== "espírito" &&
          s.heroes.filter((h) => !h.away && char(h).traits.includes(name))
            .length >= 2,
      )
      .map(([name, r]) => ({
        id: "trait:" + name,
        name: name + " · conjunto",
        focus: [name],
        style: "balanced",
        description: `Busque ${r.thresholds.at(-1)} membros; complete com funções que protejam seu núcleo.`,
      })),
    ...[
      ["Presas", "Caçador"],
      ["Manada", "Guardião"],
      ["Enxame", "Invocador"],
      ["Rio", "Xamã"],
      ["Noturno", "Espreitador"],
      ["Escamas", "Brigão"],
      ["Copa", "Místico"],
      ["Ancestral", "Xamã"],
    ].map((focus) => ({
      id: "pair:" + focus.join("/"),
      name: focus.join(" + "),
      focus,
      style: "balanced",
      description: "Dois eixos que compartilham funções e equipamentos.",
    })),
  ];
  const seen = new Set<string>(),
    plans: CompositionPlan[] = [];
  for (const d of definitions) {
    const party = selectParty(s, d.focus, d.style);
    if (!party.length) continue;
    const counts = countTraits(party.map((h) => h.characterId));
    // A named composition must actually activate every advertised core.
    if (
      d.focus.some(
        (name) => traitStatus(name, counts.get(name) ?? 0).tier === 0,
      )
    )
      continue;
    const key = party
      .map((h) => h.uid)
      .sort()
      .join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    plans.push({ ...d, party, score: strategicScore(party, s) });
  }
  plans.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  compositionCache.set(s, { key, plans });
  return plans;
}
export function recommendedParty(s: GameState, composition = "auto"): Hero[] {
  if (composition !== "auto")
    return compositionPlans(s).find((p) => p.id === composition)?.party ?? [];
  const focused = selectParty(s),
    best = compositionPlans(s)[0]?.party ?? focused;
  return s.journey.focusTraits.length
    ? focused
    : strategicScore(best, s) > strategicScore(focused, s)
      ? best
      : focused;
}
export function armySuggestions(s: GameState) {
  const current = activeArmy(s),
    score = armyScore(current, s.journey.focusTraits),
    limit = 2 + s.era;
  return s.heroes
    .filter((h) => h.slot === null && !h.away)
    .map((hero) => {
      const parties =
        current.length < limit
          ? [{ party: [...current, hero], replace: null as Hero | null }]
          : current.map((replace) => ({
              party: current.map((h) => (h === replace ? hero : h)),
              replace,
            }));
      const choice = parties.sort(
        (a, b) =>
          armyScore(b.party, s.journey.focusTraits) -
          armyScore(a.party, s.journey.focusTraits),
      )[0];
      if (!choice) return null;
      const old = countTraits(current.map((h) => h.characterId)),
        next = countTraits(choice.party.map((h) => h.characterId));
      const gained = [...next]
        .filter(
          ([name, count]) =>
            traitStatus(name, count).tier >
            traitStatus(name, old.get(name) ?? 0).tier,
        )
        .map(([name]) => name);
      const lost = [...old]
        .filter(
          ([name, count]) =>
            traitStatus(name, count).tier >
            traitStatus(name, next.get(name) ?? 0).tier,
        )
        .map(([name]) => name);
      return {
        hero,
        replace: choice.replace,
        gained,
        lost,
        improvement: armyScore(choice.party, s.journey.focusTraits) - score,
      };
    })
    .filter((v): v is NonNullable<typeof v> => !!v)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 5);
}
export function nearTraits(s: GameState) {
  const counts = countTraits(activeArmy(s).map((h) => h.characterId));
  return Object.entries(TRAIT_RULES)
    .map(([name, rule]) => {
      const count = counts.get(name) ?? 0,
        status = traitStatus(name, count);
      const members = characters.filter((c) => c.traits.includes(name));
      const recruits = members.filter(
        (c) =>
          !s.heroes.some((h) => h.characterId === c.id) &&
          c.cost <= unlockedCost(s.era),
      );
      return {
        ...status,
        missing: status.next - count,
        members,
        recruits,
        complete: status.tier === rule.thresholds.length,
      };
    })
    .filter((t) => t.count > 0 || s.journey.focusTraits.includes(t.name))
    .sort(
      (a, b) =>
        Number(b.name && s.journey.focusTraits.includes(b.name)) -
          Number(s.journey.focusTraits.includes(a.name)) ||
        a.missing - b.missing ||
        b.count - a.count,
    );
}
export function itemFit(c: Character, item: ItemDef): number {
  const r = roleOf(c),
    s = item.stats,
    p = item.perks ?? {},
    front = r === "front",
    spell = ["caster", "support", "summon"].includes(r);
  return (
    (s.hp ?? 0) * (front ? 0.04 : 0.012) +
    (s.hpPct ?? 0) * (front ? 50 : 15) +
    (s.armor ?? 0) * (front ? 0.7 : 0.18) +
    (s.magicResist ?? 0) * (front ? 0.6 : 0.2) +
    (s.attackPct ?? 0) * (spell ? 15 : 70) +
    (s.attackSpeedPct ?? 0) * (spell ? 20 : 75) +
    (s.mana ?? 0) * (spell ? 0.9 : 0.2) +
    (s.spellPower ?? 0) * (spell ? 80 : 20) +
    (s.manaRegen ?? 0) * (spell ? 8 : 2) +
    (s.lifesteal ?? 0) * 45 +
    (p.teamShield ?? 0) * 70 +
    (p.healAllyOnCast ?? 0) * (spell ? 120 : 30) +
    (p.manaAfterCast ?? 0) * (spell ? 0.8 : 0.2) +
    (p.chain3 ?? 0) * 30 +
    (p.asStack ?? 0) * 200 +
    (p.crit3 ?? 0) * (spell ? 5 : 22) +
    (p.thorns ?? 0) * (front ? 60 : 8) +
    (p.healOnHit ?? 0) * (front || r === "flank" ? 450 : 150) +
    (p.healOnKill ?? 0) * (spell ? 12 : 30) +
    (p.startStealth ?? 0) * (r === "flank" ? 7 : 2) +
    (p.startTaunt ?? 0) * (front ? 4 : -3) +
    (p.lowHpShield ?? 0) * (front ? 45 : 25) +
    (p.manaOnHit ?? 0) * (spell ? 3 : 1) +
    (s.regen ?? 0) * (front ? 650 : 200)
  );
}
export function itemAdvice(s: GameState, h: Hero) {
  const c = char(h),
    owned = s.inventory
      .map((id, index) => ({ item: itemById(id)!, index }))
      .filter((v) => !!v.item)
      .sort((a, b) => itemFit(c, b.item) - itemFit(c, a.item));
  const recipes = [] as { item: ItemDef; a: number; b: number }[];
  for (let a = 0; a < s.inventory.length; a++)
    for (let b = a + 1; b < s.inventory.length; b++) {
      const item = recipeFor(s.inventory[a], s.inventory[b]);
      if (item && !recipes.some((v) => v.item.id === item.id))
        recipes.push({ item, a, b });
    }
  recipes.sort((a, b) => itemFit(c, b.item) - itemFit(c, a.item));
  return {
    owned: owned.slice(0, 4),
    recipes: recipes.slice(0, 3),
    ideal: ITEMS.filter((i) => ROLE_GUIDE[roleOf(c)].items.includes(i.id)),
  };
}
export function armyWarnings(s: GameState, stage = s.selectedStage): string[] {
  const party = activeArmy(s),
    warnings: string[] = [];
  if (!party.length)
    return ["Sua formação está vazia. Posicione guardiões no campo."];
  if (party.length < 2 + s.era)
    warnings.push(
      `${2 + s.era - party.length} vaga(s) livres: mais companheiros aumentam as opções de laços.`,
    );
  if (!party.some((h) => roleOf(char(h)) === "front"))
    warnings.push(
      "Falta uma linha de frente. Atiradores e conjuradores receberão os primeiros golpes.",
    );
  for (const h of party) {
    const role = roleOf(char(h));
    if (role === "front" && h.slot! >= 7)
      warnings.push(`${char(h).name} pode proteger melhor a primeira fileira.`);
    if (["ranged", "support", "caster", "summon"].includes(role) && h.slot! < 7)
      warnings.push(`${char(h).name} está exposto na primeira fileira.`);
  }
  const average = party.reduce((sum, h) => sum + h.level, 0) / party.length;
  if (stage > 0 && average < expectedLevel(stage) * 0.8)
    warnings.push(
      `Sua experiência média (${Math.round(average)}) está abaixo da referência da expedição (${Math.round(expectedLevel(stage))}). Provas pessoais, rituais e equipamentos podem ajudar.`,
    );
  if (party.some((h) => h.items.length === 0) && s.inventory.length)
    warnings.push("Há itens na bolsa e companheiros sem equipamento.");
  return warnings;
}

export function enemyAdvice(s: GameState): {
  name: string;
  roles: { role: ArmyRole; count: number }[];
  tips: string[];
} {
  const stage = stageById(s.selectedStage) ?? endlessStage(s.endlessBest + 1);
  const roster = stage.units
      .map((u) => characters.find((c) => c.id === u.id)!)
      .filter(Boolean),
    roles = Object.keys(ROLE_GUIDE)
      .map((r) => ({
        role: r as ArmyRole,
        count: roster.filter((c) => roleOf(c) === r).length,
      }))
      .filter((r) => r.count > 0);
  const count = (role: ArmyRole) =>
      roles.find((r) => r.role === role)?.count ?? 0,
    tips: string[] = [];
  if (count("caster") + count("summon") >= 2)
    tips.push(
      "Há vários conjuradores ou invocadores: resistência mágica e conjurações rápidas são opções úteis.",
    );
  if (count("ranged") >= 2)
    tips.push(
      "A retaguarda inimiga tem atiradores: mantenha uma linha de frente resistente e considere flanqueadores.",
    );
  if (count("flank"))
    tips.push(
      "Há flanqueadores: evite deixar seu suporte isolado nas laterais.",
    );
  if (count("front") >= 2)
    tips.push(
      "A frente inimiga é numerosa: dano sustentado e habilidades ajudam a atravessá-la.",
    );
  if (!tips.length)
    tips.push(
      "Distribua as funções, equipe seus companheiros e confira a experiência antes de partir.",
    );
  return { name: stage.name, roles, tips };
}

type Threats = {
  magic: number;
  physical: number;
  front: number;
  flank: number;
  area: number;
  control: number;
  total: number;
};
const threatCache = new WeakMap<GameState, { key: string; value: Threats }>();
export function enemyThreats(s: GameState): Threats {
  const key = s.selectedStage + ":" + s.endlessBest,
    cached = threatCache.get(s);
  if (cached?.key === key) return cached.value;
  const roster = (
    stageById(s.selectedStage) ?? endlessStage(s.endlessBest + 1)
  ).units.map((u) => char({ characterId: u.id } as Hero));
  const magic = roster.filter((c) =>
    ["caster", "support", "summon"].includes(roleOf(c)),
  ).length;
  const front = roster.filter((c) => roleOf(c) === "front").length,
    flank = roster.filter((c) => roleOf(c) === "flank").length;
  const area = roster.filter((c) =>
    /área|todos os|inimigos próximos|ao redor|linha|cone/i.test(
      c.ability.description,
    ),
  ).length;
  const control = roster.filter((c) =>
    /atordoa|atordoamento|lentidão|mana|silencia/i.test(c.ability.description),
  ).length;
  const value = {
    magic,
    physical: roster.length - magic,
    front,
    flank,
    area,
    control,
    total: roster.length,
  };
  threatCache.set(s, { key, value });
  return value;
}
function strategicScore(
  party: Hero[],
  s: GameState,
  focus = s.journey.focusTraits,
): number {
  const t = enemyThreats(s),
    roles = party.map((h) => roleOf(char(h)));
  let score = armyScore(party, focus);
  score += party.reduce(
    (n, h) =>
      n +
      h.items.reduce((v, id) => v + itemFit(char(h), itemById(id)!) * 0.035, 0),
    0,
  );
  if (t.front >= 2) {
    score += Math.min(2, roles.filter((r) => r === "front").length) * 5;
    score += roles.filter((r) => r === "caster").length * 2;
  }
  if (t.magic >= 2) score += roles.filter((r) => r === "flank").length * 3;
  if (t.flank && roles.includes("front")) score += 3;
  return score;
}
export interface PositionAdvice {
  hero: Hero;
  slot: number;
  row: number;
  reason: string;
  adjacent: string[];
}
/** Scores real board cells. Adjacent shields follow the simulation's 1.1-cell radius. */
export function positionPlan(
  s: GameState,
  party = recommendedParty(s),
): PositionAdvice[] {
  const t = enemyThreats(s),
    taken = new Set<number>(),
    result: PositionAdvice[] = [];
  const order = [...party].sort((a, b) => {
    const rank = (h: Hero) =>
      ({ front: 0, flank: 2, ranged: 3, caster: 4, support: 5, summon: 1 })[
        roleOf(char(h))
      ];
    return (
      rank(a) - rank(b) ||
      char(b).hp[b.stars - 1] - char(a).hp[a.stars - 1] ||
      a.uid.localeCompare(b.uid)
    );
  });
  for (const hero of order) {
    const c = char(hero),
      role = roleOf(c),
      shield = hero.items.some(
        (id) => (itemById(id)?.perks?.teamShield ?? 0) > 0,
      );
    const scored = Array.from({ length: FORMATION_SLOTS }, (_, slot) => {
      const row = Math.floor(slot / 7),
        col = slot % 7,
        p = allySlotCenter(slot),
        center = Math.abs(col - 3);
      let score =
        role === "front"
          ? -row * 12 - center * 2
          : role === "flank"
            ? -row * 10 + center * 2
            : role === "support"
              ? -Math.abs(row - 2) * 8 - center * 3
              : -Math.abs(row - 1) * 9 - center;
      if (t.flank && ["support", "caster", "ranged"].includes(role))
        score -= center * 3;
      for (const other of result) {
        const q = allySlotCenter(other.slot),
          distance = Math.hypot(p.x - q.x, p.y - q.y);
        if (t.area >= 2 && distance < 1.1) score -= 3;
        if (
          other.hero.items.some(
            (id) => (itemById(id)?.perks?.teamShield ?? 0) > 0,
          ) &&
          distance <= 1.1
        )
          score += 7;
        if (shield && distance <= 1.1) score += 5;
      }
      return { slot, score };
    })
      .filter((v) => !taken.has(v.slot))
      .sort((a, b) => b.score - a.score || a.slot - b.slot);
    const slot = scored[0].slot;
    taken.add(slot);
    const reason =
      role === "front"
        ? "Absorve a aproximação e protege a retaguarda."
        : role === "flank"
          ? "A lateral abre uma rota de aproximação; seu alcance continua sendo respeitado."
          : role === "support"
            ? "Centro protegido para sustentar curas e escudos."
            : role === "summon"
              ? "Segunda fileira para conjurar cedo com proteção."
              : "Atrás dos resistentes, mantendo distância para atacar e conjurar.";
    result.push({
      hero,
      slot,
      row: Math.floor(slot / 7) + 1,
      reason:
        reason +
        (t.flank && role === "support"
          ? " Evita a lateral exposta aos flanqueadores."
          : "") +
        (t.area >= 2
          ? " A formação busca reduzir agrupamentos contra dano em área."
          : ""),
      adjacent: [],
    });
  }
  for (const a of result) {
    const p = allySlotCenter(a.slot);
    a.adjacent = result
      .filter(
        (b) =>
          b !== a &&
          Math.hypot(
            p.x - allySlotCenter(b.slot).x,
            p.y - allySlotCenter(b.slot).y,
          ) <= 1.1,
      )
      .map((b) => char(b.hero).name);
  }
  return result;
}
export function planSignature(s: GameState): string {
  return JSON.stringify([
    s.selectedStage,
    s.era,
    s.journey.focusTraits,
    s.inventory,
    s.heroes.map((h) => [
      h.uid,
      h.characterId,
      h.stars,
      h.level,
      h.slot,
      h.away?.until,
      h.items,
    ]),
  ]);
}
export function itemReason(c: Character, item: ItemDef, s: GameState): string {
  const role = ROLE_GUIDE[roleOf(c)].name,
    t = enemyThreats(s);
  if (item.perks?.teamShield)
    return "Escuda o portador e aliados até 1,1 célula dele: confira os vizinhos no plano.";
  if (item.stats.magicResist && t.magic >= 2)
    return `${role}: resistência contra ${t.magic} conjurador(es) ou invocador(es) adversários.`;
  if (item.stats.armor && t.physical >= 2)
    return `${role}: armadura reduz os golpes físicos esperados neste encontro.`;
  if (item.stats.mana || item.stats.spellPower || item.perks?.manaAfterCast)
    return `${role}: antecipa ou fortalece a habilidade ${c.ability.name}.`;
  if (item.stats.attackSpeedPct || item.perks?.asStack)
    return `${role}: favorece ataques contínuos e efeitos acionados por ataque.`;
  if (item.stats.hp || item.stats.hpPct)
    return `${role}: mais vida para permanecer em combate.`;
  return `${role}: ${item.text}`;
}
export function contextualItemFit(s: GameState, h: Hero, item: ItemDef): number {
  const t = enemyThreats(s),
    r = roleOf(char(h));
  return (
    itemFit(char(h), item) +
    (item.stats.magicResist ?? 0) * Math.min(3, t.magic) * 0.15 +
    (item.stats.armor ?? 0) * Math.min(3, t.physical) * 0.1 +
    (item.perks?.ccShield ?? 0) * t.control * 4 +
    (r === "front" ? (item.perks?.teamShield ?? 0) * 60 : 0)
  );
}
export function equipmentPlan(s: GameState, party = activeArmy(s)) {
  const used = new Set<number>(),
    slots = new Map(party.map((h) => [h.uid, h.items.length]));
  const result: { hero: Hero; item: ItemDef; index: number; reason: string }[] =
    [];
  // A global greedy allocation prevents the same inventory entry being offered to several heroes.
  const candidates = party
    .flatMap((hero) =>
      s.inventory.flatMap((id, index) => {
        const item = itemById(id)!;
        return item.kind === "item"
          ? [{ hero, item, index, score: contextualItemFit(s, hero, item) }]
          : [];
      }),
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.index - b.index ||
        a.hero.uid.localeCompare(b.hero.uid),
    );
  for (const c of candidates)
    if (c.score > 0 && !used.has(c.index) && (slots.get(c.hero.uid) ?? 3) < 3) {
      used.add(c.index);
      slots.set(c.hero.uid, slots.get(c.hero.uid)! + 1);
      result.push({ ...c, reason: itemReason(char(c.hero), c.item, s) });
    }
  return result;
}
export function craftingPlan(s: GameState, party = activeArmy(s)) {
  const used = new Set<number>(),
    result: {
      item: ItemDef;
      a: number;
      b: number;
      hero: Hero;
      reason: string;
    }[] = [];
  const remaining = new Map(party.map((h) => [h.uid, 3 - h.items.length]));
  const candidates = [] as {
    item: ItemDef;
    a: number;
    b: number;
    hero: Hero;
    score: number;
  }[];
  for (let a = 0; a < s.inventory.length; a++)
    for (let b = a + 1; b < s.inventory.length; b++) {
      const item = recipeFor(s.inventory[a], s.inventory[b]);
      if (!item) continue;
      for (const hero of party.filter((h) => h.items.length < 3))
        candidates.push({
          item,
          a,
          b,
          hero,
          score: contextualItemFit(s, hero, item),
        });
    }
  candidates.sort((a, b) => b.score - a.score || a.a - b.a || a.b - b.b);
  for (const c of candidates)
    if (
      !used.has(c.a) &&
      !used.has(c.b) &&
      (remaining.get(c.hero.uid) ?? 0) > 0
    ) {
      used.add(c.a);
      used.add(c.b);
      remaining.set(c.hero.uid, remaining.get(c.hero.uid)! - 1);
      result.push({ ...c, reason: itemReason(char(c.hero), c.item, s) });
    }
  return result;
}
export function buffAdvice(s: GameState) {
  const t = enemyThreats(s),
    party = activeArmy(s),
    roles = party.map((h) => roleOf(char(h)));
  return PREPARATIONS.map((p) => ({
    ...p,
    score:
      p.id === "amulet"
        ? t.magic * 4
        : p.id === "bark"
          ? t.physical * 3
          : p.id === "incense"
            ? roles.filter((r) => ["caster", "support", "summon"].includes(r))
                .length * 4
            : p.id === "feast"
              ? 5
              : p.id === "spring"
                ? 3
                : 4,
    reason:
      p.id === "amulet"
        ? `${t.magic} inimigo(s) com função de conjuração ou invocação.`
        : p.id === "bark"
          ? `${t.physical} inimigo(s) com funções voltadas a golpes e aproximação.`
          : p.id === "incense"
            ? "Mana inicial ajuda os seus conjuradores, suportes e invocadores a agir antes."
            : p.id === "feast"
              ? "Mais vida ajuda a formação a suportar a abertura."
              : p.id === "spring"
                ? "Sustenta batalhas longas; perde valor contra redução de cura."
                : "Fortalece o dano dos ataques básicos.",
  }))
    .filter((p) => p.era <= s.era)
    .sort((a, b) => b.score - a.score);
}
export function spiritAdvice(s: GameState) {
  const t = enemyThreats(s);
  return s.spirits.map((id) => {
    const spirit = spiritById(id)!;
    const timing =
      id === "urso"
        ? "Use após perder companheiros; o poder revive os caídos."
        : id === "coruja"
          ? "Observe as barras inimigas: use perto da mana cheia para atrasar conjurações."
          : id === "cervo"
            ? "Guarde para aliados feridos ou envenenados."
            : id === "crocodilo"
              ? "Use quando um inimigo ficar abaixo de 40% de vida."
              : id === "elefante"
                ? "Use antes de uma sequência forte de dano para aproveitar o escudo."
                : id === "lobo"
                  ? "Use quando a sua formação já estiver alcançando os alvos."
                  : id === "aguia"
                    ? "Use antes da sequência de dano ou para revelar furtivos."
                    : t.magic
                      ? "Interrompa a abertura dos inimigos e acompanhe as barras de mana."
                      : "Use quando os aliados estiverem em posição de aproveitar o efeito.";
    return { spirit, timing };
  });
}
export function synergyChanges(s: GameState, party = recommendedParty(s)) {
  const current = countTraits(activeArmy(s).map((h) => h.characterId)),
    next = countTraits(party.map((h) => h.characterId));
  return Object.keys(TRAIT_RULES)
    .flatMap((name) => {
      const before = traitStatus(name, current.get(name) ?? 0),
        after = traitStatus(name, next.get(name) ?? 0);
      return before.count || after.count
        ? [{ name, before, after, delta: after.tier - before.tier }]
        : [];
    })
    .sort((a, b) => b.delta - a.delta || b.after.tier - a.after.tier);
}
