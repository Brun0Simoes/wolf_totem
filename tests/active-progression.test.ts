import {characters} from '../src/data/characters';
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
  it('grants immediate XP and charges every requested ceremony',()=>{
    const g=new Game(),h=g.state.heroes[0];expect(g.performActiveRitual(h.uid,'rape',1).ok).toBe(true);expect(h.away).toBeNull();expect(h.ritualLevel).toBe(2);expect(ritualTotalXp(h.ritualLevel,h.ritualXp)).toBe(108);expect(h.integrationWins).toBe(0);expect(g.state.amber).toBe(64);g.state.amber=0;const before=g.serialize(1000);expect(g.performActiveRitual(h.uid,'rape',1).ok).toBe(false);expect(g.serialize(1000)).toBe(before);
  });
  it('keeps participants and reserves available immediately after paid rites',()=>{
    const g=new Game(),h=g.state.heroes[0];g.state.heroes.push(newHero('reserve',3));g.performActiveRitual(h.uid,'rape');g.performActiveRitual('reserve','rape');expect(g.state.heroes.every(h=>!h.away&&!h.integrationWins&&!h.ritualReadyAt)).toBe(true);win(g);g.dismissBattle();h.level=2;expect(g.performActiveRitual(h.uid,'sananga').ok).toBe(true);
  });
  it('awards fewer resources for early repeats and defeats than advanced victories',()=>{
    const g=new Game();g.state.commanderLevel=3;g.state.era=5;g.state.commanderLevel=2+g.state.era;g.state.progress=30;win(g,1);const earned=g.battle!.amber;g.dismissBattle();g.selectStage(20);g.startBattle();finish(g,false);expect(g.battle!.amber).toBeLessThan(earned*5);g.dismissBattle();win(g,20);expect(g.battle!.amber).toBeGreaterThan(earned*4);
  });
  it('retains era, prior ritual, level, funds, pause and combat checks',()=>{
    const g=new Game(),h=g.state.heroes[0];expect(g.performActiveRitual(h.uid,'ayahuasca',1).ok).toBe(false);g.state.paused=true;expect(g.performActiveRitual(h.uid,'rape').ok).toBe(false);g.state.paused=false;g.startBattle();expect(g.performActiveRitual(h.uid,'rape').ok).toBe(false);finish(g);g.dismissBattle();g.state.amber=0;expect(g.performActiveRitual(h.uid,'rape').ok).toBe(false);expect(g.state.stats.rituals).toBe(0);
  });
  it('both ritual entry points pay resources and have no timer route',()=>{
    const g=new Game(),h=g.state.heroes[0];h.level=2;g.performActiveRitual(h.uid,'rape');expect(g.performRitual(h.uid,'sananga').ok).toBe(true);expect(h.away).toBeNull();expect(h.ritualReadyAt).toBe(0);const xp=ritualTotalXp(h.ritualLevel,h.ritualXp);g.catchUp(1e9);expect(ritualTotalXp(h.ritualLevel,h.ritualXp)).toBe(xp);
  });
  it('cacao expires after three battles and requires another paid circle',()=>{
    const g=new Game();g.state.commanderLevel=3;g.state.era=2;g.state.commanderLevel=2+g.state.era;expect(g.holdCacaoCircle().ok).toBe(true);for(let remaining=2;remaining>=0;remaining--){win(g,1);expect(g.state.cacaoBattles).toBe(remaining);}g.dismissBattle();expect(g.holdCacaoCircle().ok).toBe(true);
  });
});

describe("personal guardian proofs", () => {
  it('opens eras by paid formation levels independently from hero XP',()=>{const g=new Game();g.state.amber=10000;const clock=g.state.clock;for(let n=1;n<4;n++)expect(g.buyFormationLevel().ok).toBe(true);expect(g.state.era).toBe(2);expect(g.state.heroes[0].level).toBe(1);expect(g.state.clock).toBe(clock);expect(g.state.commanderLevel).toBe(4);});
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
    g.state.commanderLevel=3;
    g.state.heroes.push(newHero("fixture-8",8));
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
  it('refuses removed personal proofs, including after reload',()=>{const g=new Game();g.state.heroes[0].mastery.wins=10;const before=g.serialize(1000);expect(g.claimHeroProof(g.state.heroes[0].uid,'first').ok).toBe(false);expect(g.serialize(1000)).toBe(before);const loaded=new Game(before);expect(loaded.claimHeroProof(loaded.state.heroes[0].uid,'first').ok).toBe(false);});
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
  it('all guardians progress through battle and rituals instead of proof claims',()=>{for(const id of characters.map(c=>c.id)){const g=new Game();g.state.heroes=[newHero('test',id)];g.state.heroes[0].mastery.wins=1;expect(g.claimHeroProof('test','first').ok).toBe(false);expect(g.state.heroes[0].mastery.claimed).toEqual([]);}});
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
    expect(h).toMatchObject({ level: 8, stars: 2, integrationWins: 0 });
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
