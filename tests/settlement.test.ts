import { describe,expect,it } from 'vitest';
import { Game,getRates,newHero } from '../src/game/simulation';
import { builderCount,populationCap,raidProtection,settlementRates,TERRITORIES } from '../src/game/settlement';
import { activeArmy,armySuggestions,armyWarnings,itemAdvice,recommendedParty,roleOf } from '../src/game/armyAdvisor';
import { characters } from '../src/data/characters';

const rich=()=>{const g=new Game();g.state.resources={wood:1e6,food:1e6,stone:1e6,spirit:1e6};return g;};
const complete=(g:Game)=>g.catchUp(Math.max(...g.state.settlement.orders.map(o=>o.until))-g.state.clock);

describe('RTS settlement economy',()=>{
  it('assigns ordinary villagers without taking heroes out of the army',()=>{
    const g=rich(),h=g.state.heroes[0],before=getRates(g.state).wood;
    expect(g.adjustCitizens('wood',1).ok).toBe(true);expect(getRates(g.state).wood).toBeGreaterThan(before);expect(h.slot).toBe(3);expect(h.work).toBeNull();
    expect(g.adjustCitizens('wood',-1).ok).toBe(true);expect(g.state.settlement.citizens.some(c=>c.job==='idle')).toBe(true);
  });
  it('reserves a builder, rejects duplicate work and applies upgrades only at completion',()=>{
    const g=rich(),before=g.state.buildings.lumber;expect(g.queueBuilding('lumber').ok).toBe(true);
    expect(g.state.buildings.lumber).toBe(before);const balance={...g.state.resources};
    expect(g.queueBuilding('lumber').ok).toBe(false);expect(g.queueBuilding('quarry').ok).toBe(false);expect(g.state.resources).toEqual(balance);
    expect(g.setCitizenJob(4,'wood').ok).toBe(false);complete(g);expect(g.state.buildings.lumber).toBe(before+1);expect(g.setCitizenJob(4,'wood').ok).toBe(true);
  });
  it('supports parallel construction with an additional builder',()=>{
    const g=rich();g.setCitizenJob(3,'builder');expect(builderCount(g.state)).toBe(2);expect(g.queueBuilding('lumber').ok).toBe(true);expect(g.queueBuilding('hunt').ok).toBe(true);expect(g.queueBuilding('quarry').ok).toBe(false);
  });
  it('accounts for the old and new production rates on the exact offline completion boundary',()=>{
    const g=rich();g.queueBuilding('lumber');const deadline=g.state.settlement.orders[0].until,rate=getRates(g.state).wood,before=g.state.resources.wood;
    const loaded=new Game(g.serialize(1000),1000+100*1000),nextRate=getRates(loaded.state).wood;
    expect(loaded.state.resources.wood-before).toBeCloseTo(rate*deadline+nextRate*(100-deadline));expect(loaded.state.settlement.orders).toHaveLength(0);
    const again=new Game(loaded.serialize(101000),101000);expect(again.state.buildings.lumber).toBe(2);
  });
  it('places infrastructure on claimed plots and enforces housing capacity',()=>{
    const g=rich();expect(g.buildInfrastructure('housing','river-1').ok).toBe(false);expect(g.buildInfrastructure('housing','hearth-1').ok).toBe(true);
    expect(g.buildInfrastructure('farm','hearth-1').ok).toBe(false);expect(populationCap(g.state)).toBe(6);complete(g);expect(populationCap(g.state)).toBe(10);
    while(g.state.settlement.citizens.length<10){expect(g.trainCitizen().ok).toBe(true);complete(g);}
    expect(g.trainCitizen().ok).toBe(false);
  });
  it('scouts with a real worker, suppresses that worker income and resumes it on return',()=>{
    const g=rich(),before=settlementRates(g.state).wood;expect(g.scoutTerritory('grove').ok).toBe(true);
    const order=g.state.settlement.orders[0];expect(order.citizenId).toBe(1);expect(settlementRates(g.state).wood).toBeLessThan(before);
    expect(g.setCitizenJob(1,'food').ok).toBe(false);expect(g.scoutTerritory('river').ok).toBe(false);complete(g);
    expect(g.state.settlement.discovered).toContain('grove');expect(settlementRates(g.state).wood).toBe(before);expect(g.scoutTerritory('grove').ok).toBe(false);
    expect(g.claimTerritory('grove').ok).toBe(true);complete(g);expect(g.state.settlement.claimed).toContain('grove');expect(settlementRates(g.state).wood).toBeGreaterThan(before);expect(g.buildInfrastructure('store','grove-1').ok).toBe(true);
  });
  it('requires era, campaign and adjacency before spending on a frontier',()=>{
    const g=rich(),balance={...g.state.resources};expect(g.scoutTerritory('north').ok).toBe(false);g.state.villageLevel=5;g.state.progress=30;expect(g.scoutTerritory('north').ok).toBe(false);expect(g.state.resources).toEqual(balance);
    g.scoutTerritory('grove');complete(g);g.claimTerritory('grove');complete(g);expect(g.scoutTerritory('north').ok).toBe(true);
  });
  it('refunds cancellation once, releases builders and prevents a canceled reward',()=>{
    const g=rich(),before=g.state.resources.wood;g.queueBuilding('lumber');const order=g.state.settlement.orders[0],id=order.id,cost=order.cost.wood;
    expect(g.cancelVillageOrder(id).ok).toBe(true);expect(g.state.resources.wood).toBe(before-cost*.2);const balance=g.state.resources.wood;expect(g.cancelVillageOrder(id).ok).toBe(false);expect(g.state.resources.wood).toBe(balance);g.catchUp(100);expect(g.state.buildings.lumber).toBe(1);
  });
  it('researches three bounded levels with a real effect, and ignores replayed orders',()=>{
    const g=rich(),rate=settlementRates(g.state).wood;expect(g.researchVillage('tools').ok).toBe(true);expect(g.researchVillage('tools').ok).toBe(false);complete(g);expect(settlementRates(g.state).wood).toBeCloseTo(rate*1.15);
    for(let i=0;i<2;i++){g.researchVillage('tools');complete(g);}expect(g.researchVillage('tools').ok).toBe(false);expect(g.state.settlement.research.tools).toBe(3);
  });
  it('makes defense and tactical research affect the simulation',()=>{
    const g=rich();g.state.villageLevel=2;g.researchVillage('warfare');complete(g);const base=rich();base.state.villageLevel=2;
    g.startBattle();base.startBattle();const boosted=g.battle!.entities.find(e=>e.team==='ally')!,normal=base.battle!.entities.find(e=>e.team==='ally')!;
    expect(boosted.maxHp).toBeCloseTo(normal.maxHp*1.04);expect(boosted.attack).toBeCloseTo(normal.attack*1.04);
    g.state.settlement.sites['hearth-1']='watchtower';g.state.settlement.research.sentinels=2;expect(raidProtection(g.state)).toBeCloseTo(.32);
  });
  it('pays development milestones once and forbids trade without the market',()=>{
    const g=rich();expect(g.claimSettlementMilestone('hands').ok).toBe(false);g.trainCitizen();complete(g);expect(g.claimSettlementMilestone('hands').ok).toBe(true);expect(g.claimSettlementMilestone('hands').ok).toBe(false);
    expect(g.tradeResources('wood','food').ok).toBe(false);g.state.settlement.sites['hearth-1']='market';const before={...g.state.resources};expect(g.tradeResources('wood','food').ok).toBe(true);expect(g.state.resources.wood).toBe(before.wood-100);expect(g.state.resources.food).toBe(before.food+65);expect(g.tradeResources('spirit','wood').ok).toBe(false);
  });
  it('migrates legacy saves and rejects malformed, repeated or impossible saved orders',()=>{
    const g=rich(),old=JSON.parse(g.serialize(1000));old.version=4;delete old.state.settlement;
    const loaded=new Game(old,1000);expect(loaded.state.heroes[0].uid).toBe(g.state.heroes[0].uid);expect(loaded.state.settlement.citizens).toHaveLength(4);
    g.queueBuilding('lumber');const save=JSON.parse(g.serialize(1000));save.state.settlement.orders.push({...save.state.settlement.orders[0]}, {id:998,kind:'infrastructure',target:'constructor',plot:'hearth-1',until:500,started:0});save.state.settlement.citizens.push({id:777,job:'toString'});
    const sanitized=new Game(save,1000);expect(sanitized.state.settlement.orders).toHaveLength(1);expect(sanitized.state.settlement.citizens).toHaveLength(4);expect(sanitized.setArmyFocus('toString').ok).toBe(false);
  });
  it('preserves dual hero growth while ordinary population is trained',()=>{
    const g=rich(),h=g.state.heroes[0];g.trainCitizen();complete(g);expect(h.level).toBe(1);expect(h.ritualLevel).toBe(1);expect(h.stars).toBe(1);
  });
});

describe('army advice',()=>{
  it('explains a role for all 55 characters',()=>{for(const c of characters)expect(['front','ranged','caster','support','flank','summon']).toContain(roleOf(c));});
  it('suggests unique available heroes and preserves working or away heroes',()=>{
    const g=rich();g.state.heroes.push(newHero('nima',2),newHero('boru',3),newHero('ena',4));g.state.heroes[2].work='lumber';g.state.heroes[3].away={kind:'hunt',id:'igarape',until:200};
    const plan=recommendedParty(g.state);expect(plan.map(h=>h.uid)).toEqual(expect.arrayContaining(['hero-1','nima']));expect(plan).toHaveLength(2);g.applyArmyPlan();expect(g.state.heroes[2].work).toBe('lumber');expect(g.state.heroes[2].slot).toBeNull();expect(g.state.heroes[3].away).not.toBeNull();
  });
  it('prioritizes actual trait members, persists the plan and locks formation during battle',()=>{
    const g=rich();g.state.heroes.push(...[2,3,4,5,6,7,8].map(id=>newHero(`h-${id}`,id)));g.setArmyFocus('Presas');g.setArmyFocus('Caçador');
    expect(g.state.settlement.focusTraits).toEqual(['Presas','Caçador']);expect(new Game(g.serialize(1000),1000).state.settlement.focusTraits).toEqual(['Presas','Caçador']);expect(g.applyArmyPlan().ok).toBe(true);expect(activeArmy(g.state).length).toBe(3);g.startBattle();expect(g.applyArmyPlan().ok).toBe(false);
  });
  it('reports tradeoffs and uses real recipes from the inventory',()=>{
    const g=rich();g.state.heroes.push(newHero('nima',2),newHero('ena',4));expect(armySuggestions(g.state).length).toBeGreaterThan(0);g.state.inventory=['couro','raiz'];
    const advice=itemAdvice(g.state,g.state.heroes[0]);expect(advice.recipes[0].item.id).toBe('muralha');expect(advice.recipes[0].a).toBe(0);expect(advice.recipes[0].b).toBe(1);expect(armyWarnings(g.state).length).toBeGreaterThan(0);
  });
  it('limits focused traits to two and invalid plans do not mutate the state',()=>{const g=rich();for(const t of ['Presas','Caçador','Manada'])g.setArmyFocus(t);expect(g.state.settlement.focusTraits).toEqual(['Caçador','Manada']);expect(g.setArmyFocus('xyz').ok).toBe(false);expect(g.state.settlement.focusTraits).toHaveLength(2);});
});
