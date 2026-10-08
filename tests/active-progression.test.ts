import { describe, expect, it } from "vitest";
import { Game, newHero, SAVE_VERSION } from "../src/game/simulation";
import {
  HERO_PROOFS,
  freshMastery,
  sanitizeMastery,
} from "../src/game/heroMastery";
import {
  battleXp,
  ritualTotalXp,
  totalXp,
  RITUAL_COOLDOWN,
} from "../src/game/tribe";

/** Resolve through the real combat loop, using a defeated opponent fixture. */
function finish(g: Game, victory = true) {
  const targets = g.battle!.entities.filter(
    (e) => e.team === (victory ? "enemy" : "ally"),
  );
  targets.forEach((e) => {
    e.hp = 0;
    e.action = "dead";
  });
  g.advanceBattle(0.1);
}
function win(g: Game, stage?: number) {
  if (g.battle) g.dismissBattle();
  if (stage !== undefined) expect(g.selectStage(stage).ok).toBe(true);
  expect(g.startBattle().ok).toBe(true);
  finish(g);
}

describe("active ritual progression", () => {
  it("grants XP immediately, keeps the hero available and commits once", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    expect(g.performActiveRitual(h.uid, "rape", 1).ok).toBe(true);
    expect(h.away).toBeNull();
    expect(h.ritualLevel).toBe(2);
    expect(ritualTotalXp(h.ritualLevel, h.ritualXp)).toBe(108);
    expect(h.integrationWins).toBe(2);
    expect(g.state.stats.rituals).toBe(1);
    const before = g.serialize(1000);
    expect(g.performActiveRitual(h.uid, "rape", 1).ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
  });
  it("integrates through two victories by the actual participating hero", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    g.state.heroes.push(newHero("reserve", 3));
    g.performActiveRitual(h.uid, "rape");
    g.performActiveRitual("reserve", "rape");
    win(g);
    expect(h.integrationWins).toBe(1);
    expect(g.state.heroes[1].integrationWins).toBe(2);
    win(g);
    expect(h.integrationWins).toBe(0);
    expect(h.ritualReadyAt).toBe(g.state.clock);
    g.dismissBattle();
    expect(g.performActiveRitual(h.uid, "sananga").ok).toBe(true);
  });
  it("cannot integrate a veteran by repeating trivial fights or losing", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    h.level = 24;
    g.state.era = 5;
    g.state.progress = 30;
    g.performActiveRitual(h.uid, "rape");
    win(g, 1);
    expect(h.integrationWins).toBe(2);
    g.dismissBattle();
    g.startBattle();
    finish(g, false);
    expect(h.integrationWins).toBe(2);
    expect(h.ritualReadyAt).toBe(RITUAL_COOLDOWN);
  });
  it("retains era, prior ritual, hero level, away, pause and combat checks", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    expect(g.performActiveRitual(h.uid, "ayahuasca", 1).ok).toBe(false);
    g.state.paused = true;
    expect(g.performActiveRitual(h.uid, "rape").ok).toBe(false);
    g.state.paused = false;
    g.startBattle();
    expect(g.performActiveRitual(h.uid, "rape").ok).toBe(false);
    finish(g);
    g.dismissBattle();
    g.startHunt(h.uid, "igarape");
    expect(g.performActiveRitual(h.uid, "rape").ok).toBe(false);
    expect(g.state.stats.rituals).toBe(0);
  });
  it("also integrates offline and keeps the optional timed ceremony intact", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    h.level = 2;
    g.performActiveRitual(h.uid, "rape");
    g.catchUp(RITUAL_COOLDOWN);
    expect(g.performRitual(h.uid, "sananga").ok).toBe(true);
    const xp = ritualTotalXp(h.ritualLevel, h.ritualXp);
    expect(h.away!.kind).toBe("ritual");
    g.catchUp(h.away!.until - g.state.clock);
    expect(ritualTotalXp(h.ritualLevel, h.ritualXp)).toBeGreaterThan(xp);
  });
  it("integrates cacao after two suitable wins and allows another circle immediately", () => {
    const g = new Game();
    g.state.era = 2;
    expect(g.holdCacaoCircle().ok).toBe(true);
    win(g);
    expect(g.state.cacaoIntegrationWins).toBe(1);
    win(g);
    g.dismissBattle();
    expect(g.state.cacaoIntegrationWins).toBe(0);
    expect(g.holdCacaoCircle().ok).toBe(true);
  });
});

describe("personal guardian proofs", () => {
  it("advances the first era and awakening with real battles and rituals, without offline catch-up", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    g.recruit(3);
    g.recruit(8);
    g.autoFormation();
    g.performActiveRitual(h.uid, "rape");
    for (let run = 0; run < 24 && h.stars < 2; run++) {
      if (g.battle) g.dismissBattle();
      if (g.state.era >= 2) {
        g.recruit(2);
        g.autoFormation();
      }
      if (g.advanceEra().ok) {
        const pending = g.state.era;
        const spirit = { 2: "lobo", 3: "coruja", 4: "urso", 5: "elefante" }[
          pending as 2 | 3 | 4 | 5
        ];
        if (spirit)
          g.chooseSpirit(spirit as Parameters<Game["chooseSpirit"]>[0]);
      }
      g.selectStage(Math.min(30, g.state.progress + 1));
      expect(g.startBattle().ok).toBe(true);
      for (
        let frame = 0;
        frame < 1500 && g.battle!.status === "fighting";
        frame++
      )
        g.advanceBattle(0.1);
      if (g.battle!.status === "defeat") {
        g.dismissBattle();
        g.selectStage(Math.max(1, g.state.progress));
        continue;
      }
      for (const proof of HERO_PROOFS)
        if (proof.progress(h.mastery) >= proof.goal)
          g.claimHeroProof(h.uid, proof.id);
      if (g.state.clock >= h.ritualReadyAt)
        g.performActiveRitual(h.uid, h.level >= 2 ? "sananga" : "rape");
    }
    expect(
      h.stars,
      JSON.stringify({
        level: h.level,
        ritual: h.ritualLevel,
        xp: h.ritualXp,
        integration: h.integrationWins,
        progress: g.state.progress,
        stage: g.state.selectedStage,
        era: g.state.era,
        proofs: h.mastery.claimed,
      }),
    ).toBe(2);
    expect(g.state.era).toBeGreaterThanOrEqual(2);
    expect(g.state.clock).toBe(0);
    expect(h.mastery.claimed).toContain("first");
    expect(g.state.progress).toBeGreaterThanOrEqual(3);
  });
  it("credits only participants, on victory, once for a completed battle", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    g.state.heroes.push(newHero("reserve", 3));
    win(g);
    expect(h.mastery.wins).toBe(1);
    expect(h.mastery.stages).toEqual([1]);
    expect(g.state.heroes[1].mastery.wins).toBe(0);
    g.advanceBattle(10);
    expect(h.mastery.wins).toBe(1);
    g.dismissBattle();
    g.startBattle();
    finish(g, false);
    expect(h.mastery.wins).toBe(1);
  });
  it("repeating a stage does not count as exploration", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    win(g, 1);
    win(g, 1);
    expect(h.mastery.stages).toEqual([1]);
    win(g, 2);
    expect(h.mastery.stages).toEqual([1, 2]);
  });
  it("records items and this hero’s active traits, without crediting an unrelated trait", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    g.recruit(8);
    g.deploy(g.state.heroes[1].uid, 10);
    h.items = ["presa"];
    win(g);
    expect(h.mastery.equippedWins).toBe(1);
    expect(h.mastery.linkedWins).toBe(1);
    expect(g.state.heroes[1].mastery.equippedWins).toBe(0);
  });
  it("records actual casts during a real fight", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    g.startBattle();
    const a = g.battle!.entities.find((e) => e.uid === h.uid)!,
      enemy = g.battle!.entities.find((e) => e.team === "enemy")!;
    a.mana = a.manaMax;
    enemy.hp = 1e7;
    enemy.attack = 0;
    enemy.x = a.x + 0.5;
    enemy.y = a.y;
    for (
      let i = 0;
      i < 100 &&
      !g.events.some((e) => e.type === "skill" && e.sourceId === a.id);
      i++
    )
      g.advanceBattle(0.1);
    expect(
      g.events.some((e) => e.type === "skill" && e.sourceId === a.id),
    ).toBe(true);
    finish(g);
    expect(h.mastery.skillWins).toBe(1);
    win(g, 1);
    expect(h.mastery.skillWins).toBe(1);
  });
  it("claims each reward for its hero once, including across saves", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    expect(g.claimHeroProof(h.uid, "first").ok).toBe(false);
    win(g);
    const xp = totalXp(h.level, h.xp);
    expect(g.claimHeroProof(h.uid, "first").ok).toBe(true);
    expect(totalXp(h.level, h.xp)).toBe(xp + 400);
    const loaded = new Game(g.serialize(1000), 1000);
    const before = loaded.serialize(1000);
    expect(loaded.claimHeroProof(h.uid, "first").ok).toBe(false);
    expect(loaded.serialize(1000)).toBe(before);
  });
  it("does not grant rewards from abandoned battles or timer-only activity", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    g.startBattle();
    const loaded = new Game(g.serialize(1000), 1000 + 12 * 3600 * 1000);
    expect(loaded.battle).toBeNull();
    expect(loaded.state.heroes[0].mastery).toEqual(freshMastery());
    expect(loaded.claimHeroProof(h.uid, "first").ok).toBe(false);
  });
  it("cannot claim while paused or in combat", () => {
    const g = new Game(),
      h = g.state.heroes[0];
    win(g);
    g.state.paused = true;
    expect(g.claimHeroProof(h.uid, "first").ok).toBe(false);
    g.state.paused = false;
    g.dismissBattle();
    g.startBattle();
    expect(g.claimHeroProof(h.uid, "first").ok).toBe(false);
  });
  it("supports all 55 identities with bounded, unique rewards", () => {
    expect(HERO_PROOFS).toHaveLength(8);
    expect(new Set(HERO_PROOFS.map((p) => p.id)).size).toBe(8);
    expect(HERO_PROOFS.reduce((sum, p) => sum + p.xp, 0)).toBe(69000);
    for (let id = 1; id <= 55; id++) {
      const g = new Game();
      g.state.heroes = [newHero("test", id)];
      g.state.heroes[0].mastery.wins = 1;
      expect(g.claimHeroProof("test", "first").ok).toBe(true);
      expect(g.state.heroes[0].mastery.claimed).toEqual(["first"]);
    }
  });
  it("preserves v7 progress and makes its pending integration playable", () => {
    const g = new Game(),
      old = JSON.parse(g.serialize(1000));
    old.version = 7;
    old.state.heroes[0].ritualReadyAt = 1000;
    old.state.heroes[0].level = 8;
    old.state.heroes[0].stars = 2;
    delete old.state.heroes[0].mastery;
    delete old.state.heroes[0].integrationWins;
    const loaded = new Game(old, 1000),
      h = loaded.state.heroes[0];
    expect(h).toMatchObject({ level: 8, stars: 2, integrationWins: 2 });
    expect(h.mastery).toEqual(freshMastery());
    expect(JSON.parse(loaded.serialize()).version).toBe(SAVE_VERSION);
    expect(new Game(loaded.serialize(1000), 1000).state).toEqual(loaded.state);
  });
  it("rejects corrupt counters, foreign IDs and duplicate claims", () => {
    const m = sanitizeMastery({
      wins: Infinity,
      stages: [1, 1, 2, -1, 31, "3"],
      claimed: ["first", "first", "bad"],
      skillWins: -20,
      bossWins: 2.8,
    });
    expect(m.wins).toBe(0);
    expect(m.stages).toEqual([1, 2]);
    expect(m.claimed).toEqual(["first"]);
    expect(m.skillWins).toBe(0);
    expect(m.bossWins).toBe(2);
  });
  it("makes normal fighting worthwhile while rewarding exploration over repeats", () => {
    expect(battleXp(1, true, false, true)).toBe(216);
    expect(battleXp(20, true, false, false)).toBeGreaterThan(8000);
    expect(battleXp(20, true, false, true)).toBeGreaterThan(
      battleXp(20, true, false, false),
    );
    expect(battleXp(20, false, false, false)).toBeLessThan(
      battleXp(20, true, false, false),
    );
  });
});
