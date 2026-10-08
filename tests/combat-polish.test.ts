import {describe,expect,it} from 'vitest';
import {Game,newHero} from '../src/game/simulation';
import {attackTiming,castWindup,separateBodies} from '../src/game/combatTiming';
import {COMBAT_PROFILES,combatProfile} from '../src/render/combatProfiles';
import {advanceMotion,createMotion,poseForMotion,triggerMotion} from '../src/render/animationModel';

function duel(ranged=false){
  const g=new Game();g.state.heroes=[newHero('fighter',ranged?8:1,1,3)];g.startBattle();
  const a=g.battle!.entities.find(e=>e.team==='ally')!,b=g.battle!.entities.find(e=>e.team==='enemy')!;
  Object.assign(a,{x:3,y:4,manaMax:0,cooldown:0});Object.assign(b,{x:3,y:ranged?1.5:3.2,cooldown:100,manaMax:0});
  return{g,a,b};
}
describe('combat choreography',()=>{
  it('applies melee damage after anticipation, once per attack',()=>{
    const {g,a,b}=duel(),hp=b.hp;g.tick(.05);expect(b.hp).toBe(hp);
    expect(g.events.some(e=>e.type==='prepare'&&e.sourceId===a.id)).toBe(true);
    g.tick(.1);expect(b.hp).toBe(hp);g.tick(.1);expect(b.hp).toBeLessThan(hp);
    const hit=b.hp;g.tick(.2);expect(b.hp).toBe(hit);expect(a.attackCount).toBe(1);
  });
  it('keeps ranged damage separate from launch until the projectile arrives',()=>{
    const {g,a,b}=duel(true),hp=b.hp;g.tick(.3);
    const launch=g.events.find(e=>e.type==='attack'&&e.sourceId===a.id)!;
    expect(launch.duration).toBeGreaterThan(.14);expect(b.hp).toBe(hp);
    g.tick(.3);expect(b.hp).toBeLessThan(hp);
    const damage=g.events.find(e=>e.type==='damage'&&e.sourceId===a.id)!;
    expect(damage.time-launch.time).toBeGreaterThanOrEqual(launch.duration!-.05);expect(damage.school).toBe('physical');
  });
  it('interrupts an unfinished attack when its source is stunned or killed',()=>{
    for(const killed of [false,true]){const {g,a,b}=duel(),hp=b.hp;g.tick(.05);if(killed)a.hp=0;else a.stun=1;g.tick(.3);expect(b.hp).toBe(hp);expect(a.attackCount).toBe(0);}
  });
  it('allows an already launched projectile to land after its source dies',()=>{
    const {g,a,b}=duel(true);g.state.heroes.push(newHero('reserve',3,1,4));
    // Keep another real ally standing while the shot flies.
    const ally={...a,id:'survivor',uid:'reserve',x:5,y:6,cooldown:100};g.battle!.entities.push(ally);
    const hp=b.hp;g.tick(.3);a.hp=0;g.tick(.3);expect(b.hp).toBeLessThan(hp);
  });
  it('freezes preparation and flight while paused',()=>{
    const {g,a,b}=duel(true);g.tick(.3);const snapshot=JSON.stringify([a,b,g.events,g.battle!.time]);g.togglePause();g.tick(5);expect(JSON.stringify([a,b,g.events,g.battle!.time])).toBe(snapshot);g.togglePause();g.tick(.3);expect(b.hp).toBeLessThan(b.maxHp);
  });
  it('clears pending actions between expeditions and never restores them from a save',()=>{
    const {g}=duel(true);g.tick(.3);const restored=new Game(g.serialize(1000),1000);expect(restored.battle).toBeNull();
    for(const e of g.battle!.entities.filter(e=>e.team==='enemy'))e.hp=0;g.tick(.01);g.dismissBattle();g.state.selectedStage=1;g.startBattle();const enemy=g.battle!.entities.find(e=>e.team==='enemy')!;const hp=enemy.hp;g.tick(.05);expect(enemy.hp).toBe(hp);
  });
  it('executes all 55 abilities in all three forms after a bounded anticipation',()=>{
    for(let id=1;id<=55;id++)for(let stars=1;stars<=3;stars++){
      const g=new Game();g.state.heroes=[newHero('actor',id,stars,3)];g.startBattle();const actor=g.battle!.entities.find(e=>e.team==='ally')!;
      actor.mana=actor.manaMax;g.tick(.05);expect(g.events.some(e=>e.type==='prepare'&&e.text==='cast')).toBe(true);
      expect(g.events.some(e=>e.type==='skill')).toBe(false);g.tick(.5);expect(g.events.some(e=>e.type==='skill'&&e.sourceId===actor.id)).toBe(true);
      expect(g.battle!.entities.every(e=>[e.hp,e.mana,e.x,e.y].every(Number.isFinite))).toBe(true);
    }
  });
  it('keeps slow and rapid attack timings bounded without overlap',()=>{
    for(const speed of [.1,.5,1,2,5])for(const range of [1,3,4]){const t=attackTiming(range,speed,8);expect(t.windup).toBeGreaterThan(0);expect(t.windup+t.recovery).toBeLessThanOrEqual(1/Math.max(.25,speed));expect(t.flight).toBeLessThanOrEqual(.42);}
    expect(castWindup(49)).toBeGreaterThan(castWindup(1));
  });
});
describe('presentation coverage and clocks',()=>{
  it('defines finite movement and effect profiles for the complete roster',()=>{
    expect(COMBAT_PROFILES.size).toBe(55);for(let id=1;id<=55;id++){const p=combatProfile(id);expect(p.weapon).toBeTruthy();expect(p.spell).toBeTruthy();expect([p.color,p.weight,p.stride,p.reach,p.arc].every(Number.isFinite)).toBe(true);}
  });
  it('separates copied positions without moving simulation entities',()=>{
    const original=[{id:'a',x:3,y:3,hp:10},{id:'b',x:3,y:3,hp:10}],snapshot=structuredClone(original);const copied=original.map(e=>({...e}));separateBodies(copied,.05,()=>{});expect(Math.hypot(copied[0].x-copied[1].x,copied[0].y-copied[1].y)).toBeGreaterThan(0);expect(original).toEqual(snapshot);
  });
  it('respects action duration, local impact holds and reduced motion',()=>{
    const state=createMotion();triggerMotion(state,'windup',1,.3);advanceMotion(state,'idle',.1);expect(poseForMotion(state,true).x).toBeLessThan(0);
    state.freeze=.04;const t=state.elapsed;advanceMotion(state,'idle',.02);expect(state.elapsed).toBe(t);advanceMotion(state,'idle',.1);advanceMotion(state,'idle',.2);expect(state.clip).toBe('idle');
    triggerMotion(state,'death');advanceMotion(state,'death',.3);expect(poseForMotion(state,true,true).angle).toBe(0);
  });
});
