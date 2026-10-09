import { it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { Game, newHero } from "../src/game/simulation";
import { characters } from "../src/data/characters";
import { roleOf } from "../src/game/armyAdvisor";
import { BUILDS } from "../src/game/builds";
it("measures weak and prepared teams across the campaign", () => {
  const rows = [];
  for (const stage of [5, 10, 15, 20, 25, 30])
    for (const mode of ["bare", "prepared", "core"]) {
      const g = new Game();
      g.state.era = Math.min(5, Math.ceil(stage / 5) + 1);
      g.state.progress = stage - 1;
      g.state.selectedStage = stage;
      const level =
        stage === 5
          ? 8
          : stage === 10
            ? 12
            : stage === 15
              ? 17
              : stage === 20
                ? 23
                : stage === 25
                  ? 27
                  : 30;
      const stars = stage < 25 ? 2 : 3;
      g.state.heroes = (
        mode === "core"
          ? characters.filter((c) => c.cost <= g.state.era)
          : stage >= 20
            ? characters.filter((c) =>
                [39, 40, 28, 8, 25, 33, 1].includes(c.id),
              )
            : characters
                .filter((c) => c.cost <= g.state.era)
                .slice(0, 2 + g.state.era)
      ).map((c) => ({
        ...newHero("h-" + c.id, c.id, stars),
        level,
        ritualLevel: 8,
        rituals:
          mode === "bare"
            ? {}
            : { rape: 3, sananga: 3, kambo: 3, ayahuasca: 1 },
        items:
          mode === "bare"
            ? []
            : BUILDS.find((b) => b.role === roleOf(c))!.items,
      }));
      if (mode !== "bare")
        g.state.spirits = (
          ["lobo", "coruja", "elefante", "urso"] as const
        ).slice(0, g.state.era - 1);
      g.applyArmyPlan();
      g.startBattle();
      for (let n = 0; n < 1600 && g.battle!.status === "fighting"; n++)
        g.advanceBattle(0.1);
      rows.push({
        stage,
        mode,
        level,
        stars,
        status: g.battle!.status,
        time: Math.round(g.battle!.time),
        survivors: g
          .battle!.entities.filter((e) => e.hp > 0 && !e.summon)
          .map((e) => ({ name: e.name, team: e.team, hp: Math.round(e.hp) })),
        party: g.state.heroes
          .filter((h) => h.slot !== null)
          .map((h) => h.characterId),
      });
      if (stage === 30 && mode === "core") {
        // Isolated browser QA imports this generated roster through the ordinary save UI.
        mkdirSync("artifacts/tactical-3.1", { recursive: true });
        writeFileSync(
          "artifacts/tactical-3.1/full-roster-fixture.json",
          g.serialize(),
        );
      }
    }
  mkdirSync("artifacts/tactical-3.1", { recursive: true });
  writeFileSync(
    "artifacts/tactical-3.1/balance.json",
    JSON.stringify(rows, null, 2),
  );
  expect(rows.some((r) => r.mode === "bare" && r.status === "defeat")).toBe(
    true,
  );
  expect(rows.find((r) => r.stage === 30 && r.mode === "core")!.status).toBe(
    "victory",
  );
  expect(
    rows.filter((r) => r.mode === "core" && r.status === "victory").length,
  ).toBeGreaterThan(
    rows.filter((r) => r.mode === "bare" && r.status === "victory").length,
  );
}, 20000);
