import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { Game, newHero, SAVE_VERSION, WONDER_STAGES } from "../src/game/simulation";
import { characters } from "../src/data/characters";
import { nextRandom } from "../src/game/roster";
import { formationItemPlan, formationItemGoals, formationItemScore, formationItemReason } from "../src/game/formationItems";
import { planSignature } from "../src/game/armyAdvisor";
import { itemById, isComponent } from "../src/game/items";
import { formationItemsPanel } from "../src/ui/FormationItems";
import { draftHall } from "../src/ui/DraftHall";

const tribe = () => {
  const g = new Game();
  g.state.era = 3;
  g.state.amber = 180;
  g.state.heroes = [newHero("boru",3,2,3),newHero("ena",8,2,17),newHero("nima",2,2,10)];
  g.state.heroes.forEach(h => h.level=12);
  return g;
};
function pieces(g: Game) {
  return [...g.state.inventory,...g.state.heroes.flatMap(h=>h.items)].flatMap(id=>itemById(id)!.recipe??[id]).sort();
}
describe("random journey starters", () => {
  it("can start with every era-I hero, as a deployed one-star hero, with reproducible seeds", () => {
    const seen = new Set<number>();
    for(let seed=0;seed<250;seed++) {
      const g=new Game(undefined,1000,seed), h=g.state.heroes[0];
      seen.add(h.characterId);
      expect(g.state.heroes).toHaveLength(1);
      expect(characters.find(c=>c.id===h.characterId)!.cost).toBe(1);
      expect(h).toMatchObject({stars:1,level:1,ritualLevel:1,slot:3,items:[]});
      expect(g.state.amber).toBe(80);
      expect(new Game(undefined,1000,seed).state).toEqual(g.state);
      expect(g.state.lootSeed).toBe(nextRandom(seed).seed);
    }
    expect([...seen].sort((a,b)=>a-b)).toEqual(characters.filter(c=>c.cost===1).map(c=>c.id));
  });
  it("preserves the starter and all progress when a save is loaded with another fresh seed", () => {
    const g=new Game(undefined,1000,11);
    g.state.heroes[0].xp=17;
    expect(g.state.heroes[0].characterId).not.toBe(1);
    const loaded = new Game(g.serialize(1000),1000,19);
    expect(loaded.state.heroes).toEqual(g.state.heroes);
    expect(loaded.state.lootSeed).toBe(g.state.lootSeed);
    expect(loaded.state.amber).toBe(g.state.amber);
    expect(new Game(loaded.serialize(1000),1000,7).state).toEqual(loaded.state);
  });
  it("lets all thirteen starters complete a real first battle and earn resources and XP", () => {
    for (const c of characters.filter(c=>c.cost===1)) {
      let seed = 0;
      while (new Game(undefined,1000,seed).state.heroes[0].characterId!==c.id) seed++;
      const g = new Game(undefined,1000,seed),h=g.state.heroes[0];
      expect(g.startBattle().ok).toBe(true);
      for(let t=0;t<2400&&g.battle!.status==='fighting';t++) g.advanceBattle(.1);
      expect(g.battle!.status, c.name).not.toBe('fighting');
      expect(g.state.amber,c.name).toBeGreaterThan(80);
      expect(h.level>1||h.xp>0,c.name).toBe(true);
    }
  });
  it("also draws a new era-I starter on rebirth and consumes the seed", () => {
    const g=new Game();
    g.state.wonder=WONDER_STAGES;g.state.progress=30;g.state.lootSeed=11;
    const expected=new Game(undefined,1000,11).state;
    expect(g.ascend().ok).toBe(true);
    expect(g.state.heroes[0].characterId).toBe(expected.heroes[0].characterId);
    expect(g.state.lootSeed).toBe(expected.lootSeed);
  });
});
describe("free draft migration", () => {
  it("migrates v9 offers once without rerandomizing heroes or granting amber", () => {
    const g=new Game();g.openDraft();g.state.amber=0;
    const old=JSON.parse(g.serialize(1000));old.version=9;delete old.state.draft.rerolled;old.state.draft.rolls=12;
    const loaded=new Game(old,1000,11);
    expect(loaded.state.heroes).toEqual(g.state.heroes);
    expect(loaded.state.amber).toBe(0);
    expect(loaded.state.draft!.offers).toEqual(g.state.draft!.offers);
    expect(loaded.state.draft!.rerolled).toEqual([false,false,false]);
    loaded.rerollDraft(2);
    const reloaded=new Game(loaded.serialize(1000));
    expect(reloaded.state.draft!.rerolled).toEqual([false,false,true]);
    expect(reloaded.rerollDraft(2).ok).toBe(false);
    expect(JSON.parse(reloaded.serialize()).version).toBe(SAVE_VERSION);
  });
  it("keeps allowances aligned with surviving offers after sanitizing invalid entries", () => {
    const g=new Game(), save=JSON.parse(g.serialize(1000));
    save.state.draft={era:1,offers:[1,2,2,3,999,8],rolls:1,rerolled:[false,true,false,false,false,true]};
    const loaded=new Game(save);
    expect(loaded.state.draft!.offers).toEqual([2,3,8]);
    expect(loaded.state.draft!.rerolled).toEqual([true,false,true]);
    expect(loaded.rerollDraft(0).ok).toBe(false);
    expect(loaded.rerollDraft(1).ok).toBe(true);
    expect(draftHall(loaded.state,false)).not.toContain("<select");
    expect(draftHall(loaded.state,false).match(/Troca gratuita usada/g)).toHaveLength(3);
  });
});
describe("formation equipment", () => {
  it("reserves shared pieces only once and applies craft and equipment without spending or losing items", () => {
    const g=tribe();g.state.inventory=["pena","pena","couro","raiz","garra","arco","arco"];
    const before=pieces(g), amber=g.state.amber, plan=formationItemPlan(g.state);
    expect(plan.some(p=>p.kind==='equip')).toBe(true);
    expect(plan.some(p=>p.kind==='craft')).toBe(true);
    const used=plan.flatMap(p=>p.bagIndices);
    expect(new Set(used).size).toBe(used.length);
    expect(g.applyFormationItems(planSignature(g.state)).ok).toBe(true);
    expect(pieces(g)).toEqual(before);
    expect(g.state.amber).toBe(amber);
    for(const h of g.state.heroes) expect(h.items.length).toBeLessThanOrEqual(3);
    expect(g.state.heroes.find(h=>h.uid==='boru')!.items).toContain('muralha');
    expect(g.state.heroes.find(h=>h.uid==='ena')!.items).toContain('garra');
    expect(g.state.heroes.find(h=>h.uid==='nima')!.items).toContain('coroa');
  });
  it("completes an equipped component despite a full loadout, preserves the other items", () => {
    const g=tribe(),h=g.state.heroes[0];
    h.items=['pele-urso','couro','carvalho'];
    g.state.inventory=['raiz'];
    const before=pieces(g),plan=formationItemPlan(g.state);
    const index=plan.findIndex(p=>p.heroUid===h.uid&&p.kind==='complete');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(g.applyFormationItems(planSignature(g.state),index).ok).toBe(true);
    expect(h.items).toEqual(['pele-urso','muralha','carvalho']);
    expect(pieces(g)).toEqual(before);
    expect(g.state.inventory).toEqual([]);
  });
  it("applies an individual recommendation without consuming another reserved recipe", () => {
    const g=tribe();g.state.inventory=['pena','pena','couro','raiz'];
    const plan=formationItemPlan(g.state), step=plan[1],bag=[...g.state.inventory],before=pieces(g);
    expect(g.applyFormationItems(planSignature(g.state),1).ok).toBe(true);
    expect(g.state.inventory).toEqual(bag.filter((_,i)=>!step.bagIndices.includes(i)));
    expect(g.state.heroes.find(h=>h.uid===step.heroUid)!.items).toContain(step.itemId);
    expect(pieces(g)).toEqual(before);
  });
  it("rejects stale, invalid, paused and fighting actions without moving gear", () => {
    const g=tribe();g.state.inventory=['pena','pena'];
    const stale=planSignature(g.state);g.state.heroes[0].slot=2;
    let before=g.serialize(1000);
    expect(g.applyFormationItems(stale).ok).toBe(false);
    for(const index of [-1,999,NaN,.5]) expect(g.applyFormationItems(planSignature(g.state),index).ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
    g.state.paused=true;before=g.serialize(1000);
    expect(g.applyFormationItems(planSignature(g.state)).ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
    g.state.paused=false;g.startBattle();before=g.serialize(1000);
    expect(g.applyFormationItems(planSignature(g.state)).ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
  });
  it("ignores reserve heroes, gives no plans for full finished loadouts, and leaves the input untouched", () => {
    const g=tribe();g.state.heroes.push(newHero('reserve',1,3));g.state.inventory=['garra','arco','presa'];
    g.state.heroes.filter(h=>h.slot!==null).forEach(h=>h.items=['garra','pele-urso','coroa']);
    const before=g.serialize(1000);
    expect(formationItemPlan(g.state)).toEqual([]);
    expect(formationItemGoals(g.state)).toEqual([]);
    expect(g.applyFormationItems(planSignature(g.state)).ok).toBe(false);
    expect(g.serialize(1000)).toBe(before);
  });
  it("values magic shred for a spell-heavy formation and names actual shield neighbors", () => {
    const g=tribe(),h=g.state.heroes[1],corda=itemById('corda')!;
    const alone={...g.state,heroes:[h]};
    expect(formationItemScore(g.state,h,corda)).toBeGreaterThan(formationItemScore(alone,h,corda));
    expect(formationItemReason(g.state,h,corda)).toContain('conjuradores');
    g.state.heroes[1].slot=10;
    g.state.heroes[2].slot=4;
    expect(formationItemReason(g.state,g.state.heroes[0],itemById('escudo-totem')!)).toContain('Nima');
  });
  it("penalizes repeated passives, and offers exact missing-piece costs without buying anything", () => {
    const g=tribe(),h=g.state.heroes[1],garra=itemById('garra')!;
    const score=formationItemScore(g.state,h,garra);h.items=['garra'];
    expect(formationItemScore(g.state,h,garra)).toBeLessThan(score);
    g.state.inventory=['pena'];
    const before=g.serialize(1000),goals=formationItemGoals(g.state);
    expect(goals.length).toBeGreaterThan(0);
    for(const goal of goals) {
      expect(goal.missing.every(isComponent)).toBe(true);
      expect(goal.cost).toBe(goal.missing.length*38);
    }
    expect(g.serialize(1000)).toBe(before);
  });
  it("renders actionable recipes with hero targets and records representative UI fixtures", () => {
    const g=tribe();g.state.heroes[0].items=['couro','pele-urso'];
    g.state.inventory=['pena','pena','raiz','arco','presa'];
    const html=formationItemsPanel(g.state,false);
    expect(html).toContain('data-formation-items');expect(html).toContain('Combinar e equipar');
    expect(html).toContain('em Boru');expect(html).toContain('Comprar');
    mkdirSync('artifacts/items-3.2',{recursive:true});
    writeFileSync('artifacts/items-3.2/formation-fixture.json',g.serialize(1000));
    g.openDraft();g.state.amber=0;g.rerollDraft(1);
    writeFileSync('artifacts/items-3.2/draft-fixture.json',g.serialize(1000));
  });
});
