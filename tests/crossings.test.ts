import { describe,it,expect } from 'vitest';
import { Game,newHero } from '../src/game/simulation';
import { AFFINITIES, ROUTES, SCENARIOS, atCrossingNode, affinityOffers, crossingEvent, crossingStage, puzzleSequence, sanitizeChronicle, SPECIALIZATIONS } from '../src/game/crossings';
import { objectiveOutcome } from '../src/game/battleObjectives';
import { characters } from '../src/data/characters';
import { mapPath } from '../src/game/crossingMap';

function reach(game:Game){const r=game.state.crossings.active!,p=ROUTES.find(d=>d.id===r.route)!.points[r.node];for(const step of mapPath(r.position,p))game.moveCrossing(step.x,step.y);expect(atCrossingNode(r)).toBe(true);}
function clue(game:Game){reach(game);const r=game.state.crossings.active!;expect(game.crossingPuzzle(puzzleSequence(r),affinityOffers(r)[0].id).ok).toBe(true);}
function event(game:Game){reach(game);const r=game.state.crossings.active!,e=crossingEvent(r),choice=e.choices.find(c=>c.effect!=='risk')!;expect(game.crossingChoice(choice.id).ok).toBe(true);}
function prepare(game:Game){clue(game);event(game);reach(game);expect(game.prepareCrossing().ok).toBe(true);expect(game.startCrossingBattle().ok).toBe(true);}

describe('crossing decisions and saved world',()=>{
  it('suspends exploration rewards while a tactical scenario is running',()=>{
    for(const phase of ['clue','event']){
      const g=new Game();g.startCrossing(1,'ridge');if(phase==='event')clue(g);reach(g);
      const run=g.state.crossings.active!,node=run.node;g.startScenario('last-stand');const before=g.serialize(1000);
      const result=phase==='clue'?g.crossingPuzzle(puzzleSequence(run),affinityOffers(run)[0].id):g.crossingChoice(crossingEvent(run).choices[0].id);
      expect(result.ok).toBe(false);expect(g.serialize(1000)).toBe(before);expect(run.node).toBe(node);
    }
  });
  it('migrates v11 without charging or replacing the roster',()=>{
    const old=new Game(),save=JSON.parse(old.serialize(1000));save.version=11;delete save.state.crossings;
    const g=new Game(save);expect(g.state.heroes).toEqual(old.state.heroes);expect(g.state.amber).toBe(old.state.amber);expect(g.state.crossings.active).toBeNull();
    expect(g.startCrossing(1,'river').ok).toBe(true);expect(g.state.heroes).toHaveLength(1);expect(g.state.amber).toBe(old.state.amber);
  });
  it('requires reaching a clue, preserves failed attempts, and grants each discovery once',()=>{
    const g=new Game();g.startCrossing(2,'river');const run=g.state.crossings.active!,order=puzzleSequence(run),a=affinityOffers(run)[0].id;
    const before=g.serialize(1000);expect(g.crossingPuzzle(order,a).ok).toBe(false);expect(g.serialize(1000)).toBe(before);
    reach(g);const xp=g.state.heroes[0].xp,knowledge=g.state.journey.knowledge;
    expect(g.crossingPuzzle([],a).ok).toBe(false);expect(g.state.heroes[0].xp).toBe(xp);
    expect(g.crossingPuzzle(order,a).ok).toBe(true);expect(g.state.journey.knowledge).toBe(knowledge+1);
    expect(g.crossingPuzzle(order,a).ok).toBe(false);expect(g.state.journey.knowledge).toBe(knowledge+1);
    expect(run.node).toBe(1);expect(run.affinities).toEqual([a]);expect(g.state.crossings.chapters[2]).toBe(1);
  });
  it('offers distinct effects, freezes event choices across reloads, and rejects invented rewards',()=>{
    const g=new Game();g.startCrossing(1,'ridge');clue(g);reach(g);
    const loaded=new Game(g.serialize()),a=g.state.crossings.active!,b=loaded.state.crossings.active!;
    expect(crossingEvent(a)).toEqual(crossingEvent(b));expect(affinityOffers(a)).toEqual(affinityOffers(b));
    const before=loaded.serialize(1000);expect(loaded.crossingChoice('free-amber').ok).toBe(false);expect(loaded.serialize(1000)).toBe(before);
    expect(new Set(affinityOffers(a).map(d=>d.id)).size).toBe(3);expect(AFFINITIES).toHaveLength(6);
  });
  it('retains completed rewards after leaving and restores interrupted fights for preparation',()=>{
    const g=new Game();g.startCrossing(3,'river');prepare(g);
    const loaded=new Game(g.serialize());expect(loaded.battle).toBeNull();expect(loaded.state.crossings.active?.mode).toBe('prepare');
    const before=g.state.amber;g.battle!.entities.filter(e=>e.team==='enemy').forEach(e=>e.hp=0);g.advanceBattle(.1);
    expect(g.battle?.status).toBe('victory');expect(g.state.crossings.active?.node).toBe(3);expect(g.state.amber).toBeGreaterThan(before);
    const earned=g.state.amber;g.advanceBattle(30);expect(g.state.amber).toBe(earned);
    g.dismissBattle();expect(g.endCrossing().ok).toBe(true);expect(g.state.amber).toBe(earned);expect(g.state.crossings.chapters[3]).toBe(1);
  });
  it('bounds hostile saves and restores only valid affinities, routes and specialties',()=>{
    const c=sanitizeChronicle({visits:Infinity,chapters:{1:999},specializations:{1:'lone',2:'charge'},discoveries:['<script>','recipe:river'],active:{guide:1,route:'river',node:3,mode:'battle',seed:7,tier:99,position:{x:1e10,y:-55},affinities:['healing','healing','bad','roots','echo']}});
    expect(c.visits).toBe(0);expect(c.chapters[1]).toBe(2);expect(c.specializations).toEqual({'1':'lone'});expect(c.discoveries).toEqual(['recipe:river']);
    expect(c.active).toMatchObject({tier:3,mode:'explore',affinities:['healing','roots']});expect(c.active!.position.x).toBeLessThanOrEqual(1536);
  });
});

describe('objective combat and persistent rewards',()=>{
  it('keeps objective health fixed when the owned army gains levels or another guardian',()=>{
    for(const route of ['river','ruins'] as const){
      const a=new Game(),b=new Game();
      b.state.commanderLevel=2;b.state.heroes=[{...newHero('strong',3,1,1),level:10},newHero('support',11,1,25)];
      a.startCrossing(1,route);b.startCrossing(1,route);prepare(a);prepare(b);
      expect(b.battle!.entities.filter(e=>e.structure).map(e=>e.maxHp)).toEqual(a.battle!.entities.filter(e=>e.structure).map(e=>e.maxHp));
      expect(b.battle!.entities.filter(e=>e.team==='ally'&&!e.structure).reduce((sum,e)=>sum+e.maxHp,0)).toBeGreaterThan(a.battle!.entities.filter(e=>e.team==='ally'&&!e.structure).reduce((sum,e)=>sum+e.maxHp,0));
    }
  });
  it('loses when the altar falls even with a living army',()=>{
    const g=new Game();g.startCrossing(1,'river');prepare(g);const altar=g.battle!.entities.find(e=>e.structure==='altar')!;
    altar.hp=0;g.advanceBattle(.1);expect(g.battle!.status).toBe('defeat');expect(g.state.crossings.active!.mode).toBe('prepare');expect(g.state.crossings.active!.failures).toBe(1);expect(g.battle!.amber).toBe(0);
  });
  it('keeps first-clear rewards claimed even after retreating before the final encounter',()=>{
    const g=new Game();g.startCrossing(1,'river');prepare(g);g.battle!.entities.filter(e=>e.team==='enemy').forEach(e=>e.hp=0);g.advanceBattle(.1);g.dismissBattle();g.endCrossing();
    expect(g.state.crossings.routes).toEqual([]);expect(g.state.crossings.discoveries).toContain('encounter:river:1:2');
    const loaded=new Game(g.serialize());loaded.startCrossing(1,'river');prepare(loaded);expect(loaded.battle!.firstClear).toBe(false);
  });
  it('wins by destroying seals while combat enemies remain alive',()=>{
    const g=new Game();g.startCrossing(1,'ruins');prepare(g);
    g.battle!.entities.filter(e=>e.structure==='seal').forEach(e=>e.hp=0);g.advanceBattle(.1);
    expect(g.battle!.entities.some(e=>e.team==='enemy'&&!e.structure&&e.hp>0)).toBe(true);expect(g.battle!.status).toBe('victory');
  });
  it('fails the seal objective at its deadline and completes altar survival',()=>{
    const g=new Game();g.startScenario('broken-seals');const b=g.battle!;
    expect(objectiveOutcome(b.objective!,b.entities,65)).toBe(false);
    g.dismissBattle();const altarGame=new Game();altarGame.startScenario('last-stand');expect(objectiveOutcome(altarGame.battle!.objective!,altarGame.battle!.entities,45)).toBe(true);
  });
  it('lets the focus directive choose structures instead of the nearest defender',()=>{
    const g=new Game();g.startCrossing(1,'ruins');prepare(g);const unit=g.battle!.entities.find(e=>e.team==='ally'&&!e.structure)!;
    g.advanceBattle(.1);expect(unit.action).toBe('walk');expect(unit.y).toBeLessThan(4);
  });
  it('finishes the story, keeps its unlocks through rebirth, and does not grant duplicate heroes',()=>{
    const g=new Game();g.startCrossing(1,'river');prepare(g);g.battle!.entities.filter(e=>e.team==='enemy').forEach(e=>e.hp=0);g.advanceBattle(.1);g.dismissBattle();
    clue(g);event(g);reach(g);g.prepareCrossing();g.startCrossingBattle();g.battle!.entities.filter(e=>e.structure==='seal').forEach(e=>e.hp=0);g.advanceBattle(.1);g.dismissBattle();
    expect(g.state.crossings.active?.mode).toBe('complete');expect(g.state.crossings.chapters[1]).toBe(2);expect(g.state.crossings.routes).toEqual(['river']);
    expect(g.selectSpecialization(1,'lone').ok).toBe(true);expect(g.state.heroes).toHaveLength(1);
    g.state.commanderLevel=28;g.state.wonder=5;g.state.progress=30;g.state.endlessBest=10;g.state.amber=2400;
    g.state.heroes=[1,2,3].map((id,i)=>({...newHero(`reset-${i}`,id,3,i),level:24,ritualLevel:8}));
    expect(g.ascend().ok).toBe(true);expect(g.state.crossings.chapters[1]).toBe(2);expect(g.state.crossings.specializations[1]).toBe('lone');expect(g.state.crossings.active).toBeNull();
  });
  it('crafts only discovered recipes, consumes the two components, and never spends duplicate rewards',()=>{
    const g=new Game();g.state.inventory=['pena','raiz'];expect(g.forgeCrossingRelic('eco-igarape').ok).toBe(false);
    g.state.crossings.discoveries.push('recipe:river');expect(g.forgeCrossingRelic('eco-igarape').ok).toBe(true);expect(g.state.inventory).toEqual(['eco-igarape']);expect(g.forgeCrossingRelic('eco-igarape').ok).toBe(false);
  });
  it('applies the specialization with a real tradeoff and permits free removal',()=>{
    const g=new Game();g.state.heroes=[newHero('akru',1,1,3)];g.state.crossings.chapters[1]=2;g.selectSpecialization(1,'lone');g.startBattle();const e=g.battle!.entities.find(e=>e.uid==='akru')!,base=characters.find(c=>c.id===1)!;
    expect(e.maxHp).toBeCloseTo(base.hp[0]*.88);expect(e.spellPower).toBeCloseTo(1.22);
    e.hp=0;g.advanceBattle(.1);g.dismissBattle();expect(g.selectSpecialization(1,'lone').ok).toBe(true);expect(g.state.crossings.specializations[1]).toBeUndefined();expect(SPECIALIZATIONS).toHaveLength(6);
  });
});

describe('standardized tactical scenarios',()=>{
  it('uses guest armies without touching owned heroes, items, levels or currency',()=>{
    const g=new Game(),heroes=structuredClone(g.state.heroes),inventory=[...g.state.inventory],amber=g.state.amber;
    expect(g.startScenario('last-stand',[0,1,2,3,4,5]).ok).toBe(true);
    expect(g.battle!.party).toHaveLength(6);expect(g.battle!.entities.filter(e=>e.uid).every(e=>e.level===1)).toBe(true);
    g.battle!.entities.filter(e=>e.team==='enemy').forEach(e=>e.hp=0);g.advanceBattle(.1);
    expect(g.state.heroes).toEqual(heroes);expect(g.state.inventory).toEqual(inventory);expect(g.state.amber).toBe(amber);expect(g.state.crossings.scenarios).toEqual(['last-stand']);
    const knowledge=g.state.journey.knowledge;g.dismissBattle();g.startScenario('last-stand');g.battle!.entities.filter(e=>e.team==='enemy').forEach(e=>e.hp=0);g.advanceBattle(.1);expect(g.state.journey.knowledge).toBe(knowledge);
  });
  it('is independent of permanent power and rejects patron powers',()=>{
    const a=new Game(),b=new Game();b.state.rebirths=8;b.state.memories={bencao:5,fogueira:5};b.state.journey.legacies={vigor:5,tactics:5};b.state.spirits=['lobo'];
    a.startScenario('broken-seals');b.startScenario('broken-seals');
    expect(b.battle!.entities.map(e=>[e.characterId,e.maxHp,e.attack,e.armor])).toEqual(a.battle!.entities.map(e=>[e.characterId,e.maxHp,e.attack,e.armor]));expect(b.usePower('lobo').ok).toBe(false);
  });
  it('uses different objective rules across its permanent library',()=>{
    expect(SCENARIOS).toHaveLength(4);expect(new Set(SCENARIOS.map(s=>s.objective)).size).toBe(2);
    for(const d of SCENARIOS){const g=new Game();expect(g.startScenario(d.id).ok).toBe(true);expect(g.battle!.objective!.kind).toBe(d.objective);}
  });
});
