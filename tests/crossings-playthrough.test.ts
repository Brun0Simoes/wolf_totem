import { describe,it,expect } from 'vitest';
import { Game,newHero } from '../src/game/simulation';
import { ROUTES,SCENARIOS,affinityOffers,puzzleSequence,crossingEvent } from '../src/game/crossings';

function finishFight(g:Game){for(let i=0;i<1500&&g.battle?.status==='fighting';i++)g.advanceBattle(.05);}
function traverse(g:Game){
  for(let step=0;step<6;step++){
    const r=g.state.crossings.active!,p=ROUTES.find(d=>d.id===r.route)!.points[r.node];g.moveCrossing(p.x,p.y);
    if(r.node===0||r.node===3)g.crossingPuzzle(puzzleSequence(r),affinityOffers(r)[0].id);
    else if(r.node===1||r.node===4){const e=crossingEvent(r),choice=e.choices.find(c=>c.effect==='rest'||c.effect==='shelter')??e.choices.find(c=>c.effect==='component')??e.choices[0];g.crossingChoice(choice.id);}
    else{g.prepareCrossing();g.startCrossingBattle();finishFight(g);if(g.battle?.status!=='victory')return false;g.dismissBattle();}
  }return g.state.crossings.active?.mode==='complete';
}
describe('real crossing playthroughs',()=>{
  it('allows an early balanced team to complete all three routes without forced outcomes',()=>{
    const results=[];
    for(const route of ROUTES){const g=new Game(undefined,1000,31);g.state.commanderLevel=3;g.state.progress=3;g.state.heroes=[{...newHero('boru',3,1,1),level:4},{...newHero('akru',1,1,10),level:4},{...newHero('miru',11,1,24),level:4}];
      g.startCrossing(1,route.id);const won=traverse(g);results.push({route:route.id,won,node:g.state.crossings.active!.node,status:g.battle?.status});}
    console.log('Crossing early-team playthroughs:',JSON.stringify(results));expect(results.every(r=>r.won)).toBe(true);
  });
  it('provides solvable guest scenarios with placement affecting the outcome',()=>{
    const layouts=[[1,5,9,12,22,25],[0,6,10,11,22,26],[3,10,0,6,22,25],[1,4,8,12,24,26],[0,1,2,3,4,5],[22,23,24,25,26,27]];
    const results=SCENARIOS.map(s=>{const wins=layouts.map(slots=>{const g=new Game();g.startScenario(s.id,slots);finishFight(g);return g.battle?.status==='victory';});return{id:s.id,wins};});
    console.log('Scenario placement playthroughs:',JSON.stringify(results));expect(results.every(r=>r.wins.some(Boolean))).toBe(true);
    expect(results.some(r=>r.wins.some(Boolean)&&r.wins.some(w=>!w))).toBe(true);
  });
});
