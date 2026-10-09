import { describe, it, expect } from "vitest";
import { Game, newHero, SAVE_VERSION } from "../src/game/simulation";
import {
  draftCost,
  rerollCost,
  ritualCost,
  battleAmber,
  drawCandidates,
  draftPool,
} from "../src/game/economy";
import { characters } from "../src/data/characters";
import {
  countTraits,
  traitStatus,
  TRAIT_RULES,
  traitPower,
} from "../src/game/synergies";
import {
  compositionPlans,
  recommendedParty,
  armyScore,
  roleOf,
} from "../src/game/armyAdvisor";
import { BUILDS, buildTransaction } from "../src/game/builds";
import { ritualTotalXp } from "../src/game/tribe";
import { draftHall } from "../src/ui/DraftHall";
import { arsenal } from "../src/ui/Arsenal";
const complete = (g: Game, victory = true) => {
  g.battle!.entities.filter(
    (e) => e.team === (victory ? "enemy" : "ally"),
  ).forEach((e) => {
    e.hp = 0;
    e.action = "dead";
  });
  g.advanceBattle(0.1);
};
const rich = () => {
  const g = new Game();
  g.state.amber = 10000;
  return g;
};
describe("paid three-card draft", () => {
  it("rejects direct free recruitment and bills only an actual draft", () => {
    const g = new Game(),
      before = g.serialize(1000);
    expect(g.recruit(3).ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
    expect(g.openDraft().ok).toBe(true);
    expect(g.state.amber).toBe(80 - draftCost(1));
    expect(g.state.draft!.offers).toHaveLength(3);
  });
  it("has no owned, repeated or future-era heroes for many seeds and all five eras", () => {
    for (let era = 1; era <= 5; era++)
      for (let seed = 1; seed <= 150; seed++) {
        const draw = drawCandidates(era, [1, 3, 8], [], seed, 3);
        expect(new Set(draw.offers).size).toBe(draw.offers.length);
        for (const id of draw.offers) {
          expect([1, 3, 8]).not.toContain(id);
          expect(characters.find((c) => c.id === id)!.cost).toBeLessThanOrEqual(
            era,
          );
        }
      }
  });
  it("is deterministic for the same seed and survives reload without a second bill", () => {
    const a = new Game(),
      b = new Game();
    a.openDraft();
    b.openDraft();
    expect(a.state.draft).toEqual(b.state.draft);
    const loaded = new Game(a.serialize(1000), 999999);
    expect(loaded.state.amber).toBe(a.state.amber);
    expect(loaded.state.draft).toEqual(a.state.draft);
    expect(loaded.openDraft().ok).toBe(false);
  });
  it("chooses exactly one, clears all offers and rejects a second choice", () => {
    const g = rich();
    g.openDraft();
    const [a, b] = g.state.draft!.offers,
      amber = g.state.amber;
    expect(g.recruit(a).ok).toBe(true);
    expect(g.state.heroes).toHaveLength(2);
    expect(g.state.amber).toBe(amber);
    expect(g.state.draft).toBeNull();
    expect(g.recruit(b).ok).toBe(false);
    expect(g.recruit(a).ok).toBe(false);
  });
  it("rerolls one slot into the requested role, preserving the other slots", () => {
    const g = rich();
    g.openDraft();
    const before = [...g.state.draft!.offers],
      amber = g.state.amber;
    expect(g.rerollDraft(1, "role:caster").ok).toBe(true);
    const after = g.state.draft!.offers;
    expect(after[0]).toBe(before[0]);
    expect(after[2]).toBe(before[2]);
    expect(before).not.toContain(after[1]);
    expect(roleOf(characters.find((c) => c.id === after[1])!)).toBe("caster");
    expect(g.state.amber).toBe(amber - rerollCost(1));
  });
  it("filters by a trait and refuses impossible or invalid replacements without charging", () => {
    const g = rich();
    g.openDraft();
    expect(g.rerollDraft(0, "trait:Manada").ok).toBe(true);
    expect(
      characters.find((c) => c.id === g.state.draft!.offers[0])!.traits,
    ).toContain("Manada");
    const before = g.serialize(1000);
    for (const [index, target] of [
      [5, ""],
      [0, "trait:unavailable"],
      [0, "role:invalid"],
    ] as const)
      expect(g.rerollDraft(index, target).ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
  });
  it("does not spend on an exhausted roster or slot with no alternative", () => {
    const g = rich();
    g.state.heroes = characters
      .filter((c) => c.cost === 1)
      .map((c) => newHero("h-" + c.id, c.id));
    const before = g.state.amber;
    expect(g.openDraft().ok).toBe(false);
    expect(g.state.amber).toBe(before);
    g.state.heroes.pop();
    g.openDraft();
    expect(g.state.draft!.offers).toHaveLength(1);
    const price = g.state.amber;
    expect(g.rerollDraft(0).ok).toBe(false);
    expect(g.state.amber).toBe(price);
  });
  it("keeps a paid era-I draft in its original pool after era advancement and reload", () => {
    const g = rich();
    g.openDraft();
    g.state.era = 5;
    const loaded = new Game(g.serialize(1000), 1000);
    expect(loaded.state.draft!.era).toBe(1);
    loaded.rerollDraft(0);
    expect(
      loaded.state.draft!.offers.every(
        (id) => characters.find((c) => c.id === id)!.cost === 1,
      ),
    ).toBe(true);
  });
  it("guards insufficient funds, pause and fighting with no state change", () => {
    const g = new Game();
    g.state.amber = 0;
    let before = g.serialize(1000);
    expect(g.openDraft().ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
    g.state.amber = 1000;
    g.state.paused = true;
    before = g.serialize(1000);
    expect(g.openDraft().ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
    g.state.paused = false;
    g.openDraft();
    g.startBattle();
    before = g.serialize(1000);
    expect(g.rerollDraft(0).ok).toBe(false);
    expect(g.recruit(g.state.draft!.offers[0]).ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
  });
  it("can finish the entire roster with no duplicate hero or empty paid drafts", () => {
    const g = rich();
    g.state.amber = 1e6;
    g.state.era = 5;
    while (g.state.heroes.length < 55) {
      expect(g.openDraft().ok).toBe(true);
      expect(g.state.draft!.offers.length).toBeGreaterThan(0);
      expect(g.recruit(g.state.draft!.offers[0]).ok).toBe(true);
    }
    expect(new Set(g.state.heroes.map((h) => h.characterId)).size).toBe(55);
    expect(g.openDraft().ok).toBe(false);
  });
  it("sanitizes corrupt offers, owned identities, future eras and duplicates", () => {
    const g = rich(),
      save = JSON.parse(g.serialize(1000));
    save.state.draft = { era: 99, offers: [1, 2, 2, 55, "bad"], rolls: -99 };
    const loaded = new Game(save, 1000);
    expect(loaded.state.draft).toEqual({ era: 1, offers: [2], rolls: 0 });
  });
});
describe("resources instead of waiting", () => {
  it("pays each finished victory or defeat once, and rewards harder encounters more", () => {
    for (const victory of [true, false]) {
      const g = new Game(),
        before = g.state.amber;
      g.startBattle();
      complete(g, victory);
      expect(g.battle!.amber).toBe(battleAmber(1, victory, true, false));
      expect(g.state.amber).toBe(before + g.battle!.amber);
      const earned = g.state.amber;
      g.advanceBattle(50);
      expect(g.state.amber).toBe(earned);
    }
    expect(battleAmber(20, true, false, false)).toBeGreaterThan(
      battleAmber(1, true, false, false),
    );
  });
  it("grants no income or XP by leaving, changing the clock or abandoning a fight", () => {
    const g = new Game(),
      before = g.serialize(1000);
    g.catchUp(1e9);
    expect(g.serialize(1000)).toBe(before);
    g.startBattle();
    const loaded = new Game(g.serialize(1000), 999999999);
    expect(loaded.state.amber).toBe(80);
    expect(loaded.state.heroes[0].xp).toBe(0);
  });
  it("permits repeated paid rituals immediately, blocks missing funds without mutation", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    expect(g.performActiveRitual(h.uid, "rape", 1).ok).toBe(true);
    expect(h.ritualReadyAt).toBe(0);
    expect(h.away).toBeNull();
    const next = ritualCost("rape", 1);
    expect(g.performActiveRitual(h.uid, "rape").ok).toBe(true);
    expect(g.state.amber).toBe(80 - 16 - next);
    g.state.amber = 0;
    const before = g.serialize(1000);
    expect(g.performActiveRitual(h.uid, "rape").ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
  });
  it("cacao lasts three actual combats, persists offline and consumes defeats too", () => {
    const g = rich();
    g.state.era = 2;
    g.holdCacaoCircle();
    g.catchUp(1e9);
    expect(g.state.cacaoBattles).toBe(3);
    expect(new Game(g.serialize(1000), 1e9).state.cacaoBattles).toBe(3);
    for (let n = 2; n >= 0; n--) {
      g.startBattle();
      complete(g, false);
      expect(g.state.cacaoBattles).toBe(n);
      g.dismissBattle();
    }
    expect(g.holdCacaoCircle().ok).toBe(true);
  });
  it("migrates old hunt challenges without mixing hunt and recruitment counts or paying twice", () => {
    const old = JSON.parse(new Game().serialize(1000));
    old.version = 8;
    old.state.stats.hunts = 23;
    old.state.stats.recruits = 0;
    old.state.journey.trial = { id: "hunt", start: 23 };
    const pending = new Game(old);
    expect(pending.state.journey.trial!.start).toBe(0);
    expect(pending.claimTrial().ok).toBe(false);
    pending.openDraft();
    pending.recruit(pending.state.draft!.offers[0]);
    expect(pending.claimTrial().ok).toBe(true);
    old.state.journey.trial.start = 22;
    const complete = new Game(old);
    expect(complete.state.journey.trial).toBeNull();
    expect(complete.state.journey.knowledge).toBe(
      old.state.journey.knowledge + 4,
    );
    expect(complete.state.journey.completed).toBe(
      old.state.journey.completed + 1,
    );
    expect(new Game(complete.serialize()).state.journey).toEqual(
      complete.state.journey,
    );
  });
  it("migrates a v8 pending ceremony once, recalls hunts and removes all integration clocks", () => {
    const g = rich(),
      old = JSON.parse(g.serialize(1000));
    old.version = 8;
    old.state.heroes[0].away = {
      kind: "ritual",
      id: "rape",
      until: 100,
      participationXp: 18,
    };
    old.state.heroes.push({
      ...newHero("hunter", 3),
      away: { kind: "hunt", id: "igarape", until: 500 },
    });
    const loaded = new Game(old, 1000);
    expect(
      ritualTotalXp(
        loaded.state.heroes[0].ritualLevel,
        loaded.state.heroes[0].ritualXp,
      ),
    ).toBe(108);
    expect(
      loaded.state.heroes.every(
        (h) => !h.away && !h.ritualReadyAt && !h.integrationWins,
      ),
    ).toBe(true);
    expect(JSON.parse(loaded.serialize()).version).toBe(SAVE_VERSION);
    expect(new Game(loaded.serialize(1000), 1e9).state).toEqual(loaded.state);
  });
});
describe("build transactions and deep compositions", () => {
  it("calculates Guardian shields from the final life after levels and equipment", () => {
    const g = rich();
    g.state.era = 5;
    g.state.heroes = characters
      .filter((c) => c.traits.includes("Guardião"))
      .slice(0, 6)
      .map((c, i) => ({
        ...newHero("g-" + c.id, c.id, 2, i),
        level: 25,
        items: ["carvalho"],
      }));
    g.startBattle();
    for (const e of g.battle!.entities.filter((e) => e.team === "ally"))
      expect(e.shield).toBeCloseTo(e.maxHp * 0.55);
  });
  it("reuses owned pieces, equips three items and returns the previous loadout atomically", () => {
    const g = rich(),
      h = g.state.heroes[0];
    h.items = ["presa"];
    g.state.inventory = ["couro", "raiz", "couro", "manto"];
    const plan = buildTransaction(
      1,
      g.state.inventory,
      h.items,
      BUILDS[0].items,
    )!;
    const before = g.state.amber;
    expect(g.prepareBuild(h.uid, "front-hold").ok).toBe(true);
    expect(h.items).toEqual(BUILDS[0].items);
    expect(g.state.inventory).toContain("presa");
    expect(g.state.amber).toBe(before - plan.cost);
    expect(h.items).toHaveLength(3);
  });
  it("does not duplicate repeated components and rejects unaffordable builds without moving items", () => {
    expect(buildTransaction(1, ["presa"], [], ["obsidiana"])!.cost).toBe(30);
    const g = new Game();
    g.state.amber = 0;
    g.state.heroes[0].items = ["arco"];
    const before = g.serialize(1000);
    expect(g.prepareBuild("hero-1", "front-hold").ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
  });
  it("blocks purchases and build changes during battle and respects relic era gates", () => {
    const g = rich();
    expect(g.buyRelic("orbe-aurora").ok).toBe(false);
    g.state.era = 3;
    expect(g.buyRelic("orbe-aurora").ok).toBe(true);
    g.startBattle();
    const before = g.serialize(1000);
    expect(g.buyComponent("presa").ok).toBe(false);
    expect(g.buyRelic("orbe-aurora").ok).toBe(false);
    expect(g.prepareBuild("hero-1", "front-hold").ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
  });
  it("applies all six relic mechanics through the real combat entities", () => {
    const g = rich(),
      h = g.state.heroes[0];
    h.items = ["orbe-aurora", "egide-tronco", "coroa-inverno"];
    g.startBattle();
    const e = g.battle!.entities.find((e) => e.uid === h.uid)!;
    expect(e.perks.manaAfterCast).toBe(15);
    expect(e.perks.teamShield).toBe(0.12);
    expect(e.perks.ccShield).toBe(3);
    expect(e.perks.lowHpShield).toBe(0.35);
    expect(e.regen).toBe(0.01);
    expect(e.spellPower).toBe(1.35);
  });
  it("exposes many distinct legal plans, all roles have three meaningful builds", () => {
    const g = rich();
    g.state.era = 5;
    g.state.heroes = characters.map((c) => ({
      ...newHero("h-" + c.id, c.id, 2),
      level: 20,
    }));
    const plans = compositionPlans(g.state);
    expect(plans.length).toBeGreaterThanOrEqual(15);
    expect(
      new Set(
        plans.map((p) =>
          p.party
            .map((h) => h.uid)
            .sort()
            .join(),
        ),
      ).size,
    ).toBe(plans.length);
    expect(plans.every((p) => p.party.length === 7)).toBe(true);
    for (const plan of plans) {
      const counts = countTraits(plan.party.map((h) => h.characterId));
      expect(
        plan.focus.every(
          (name) => traitStatus(name, counts.get(name) ?? 0).tier > 0,
        ),
      ).toBe(true);
    }
    for (const role of new Set(characters.map(roleOf)))
      expect(BUILDS.filter((b) => b.role === role)).toHaveLength(3);
    console.info("Distinct balanced plans:", plans.length);
  });
  it("actually recommends and applies a six-member core when equally experienced heroes permit it", () => {
    const g = rich();
    g.state.era = 5;
    g.state.heroes = characters.map((c) => ({
      ...newHero("h-" + c.id, c.id, 2),
      level: 20,
    }));
    const plan = recommendedParty(g.state),
      counts = countTraits(plan.map((h) => h.characterId));
    expect(
      [...counts].some(
        ([n, c]) => TRAIT_RULES[n].kind !== "espírito" && c >= 6,
      ),
    ).toBe(true);
    expect(g.applyArmyPlan().ok).toBe(true);
    expect(
      new Set(g.state.heroes.filter((h) => h.slot !== null).map((h) => h.slot))
        .size,
    ).toBe(7);
  });
  it("awards the documented third-tier power in combat and only counts distinct heroes", () => {
    const g = rich();
    g.state.era = 5;
    const six = characters
      .filter((c) => c.traits.includes("Caçador"))
      .slice(0, 6);
    expect(six).toHaveLength(6);
    g.state.heroes = six.map((c, i) => newHero("h-" + c.id, c.id, 1, i));
    g.startBattle();
    const e = g.battle!.entities.find((e) => e.uid === g.state.heroes[0].uid)!;
    expect(traitStatus("Caçador", 6).tier).toBe(3);
    expect(e.attackSpeed).toBeCloseTo(
      six[0].attackSpeed *
        (1 + traitPower("Caçador", 3)) *
        (six[0].traits.includes("Noturno")
          ? 1 +
            traitPower(
              "Noturno",
              traitStatus(
                "Noturno",
                countTraits(six.map((c) => c.id)).get("Noturno") ?? 0,
              ).tier,
            )
          : 1),
    );
    expect(countTraits([1, 1]).get("Caçador")).toBe(1);
  });
  it("renders detailed draft cards, build recipes and no free catalogue recruitment", () => {
    const g = rich();
    g.openDraft();
    const html = draftHall(g.state, false);
    expect(html.match(/data-recruit=/g)).toHaveLength(3);
    expect(html).toContain("Filtro da carta 3");
    expect(html).toContain("draft-base-stats");
    expect(arsenal(g.state, null, "builds", false)).toContain(
      "data-prepare-build",
    );
    expect(
      arsenal(g.state, null, "recipes", false).match(/class="recipe-card/g),
    ).toHaveLength(21);
  });
});
