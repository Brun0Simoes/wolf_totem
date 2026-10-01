import { describe, expect, it } from 'vitest';
import { advanceMotion, createMotion, triggerMotion, frameForMotion, poseForMotion, type SheetDefinition } from '../src/render/animationModel';

const sheet:SheetDefinition = {characterId:1,name:'Akru',image:'akru.png',columns:4,rows:3,frameWidth:256,frameHeight:256,bodyHeight:200,anchorX:128,anchorY:220,clips:{idle:[0,1,2,3],walk:[4,5,6,7],attack:[8,9,10,11]}};
describe('animation transitions',()=>{
 it('lets an attack finish while simulation returns to idle',()=>{
  const state=createMotion();triggerMotion(state,'attack');
  advanceMotion(state,'idle',.1);expect(state.clip).toBe('attack');
  for(let i=0;i<5;i++)advanceMotion(state,'idle',.1);
  expect(state.clip).toBe('idle');
 });
 it('never revives a dead unit due to late hit or attack events',()=>{
  const state=createMotion();triggerMotion(state,'death');triggerMotion(state,'attack');
  advanceMotion(state,'walk',.1);expect(state.clip).toBe('death');
 });
 it('freezes all state when dt is zero',()=>{
  const state=createMotion();triggerMotion(state,'cast');triggerMotion(state,'hurt');const old={...state};
  advanceMotion(state,'walk',0);expect(state).toEqual(old);
 });
 it('uses independent idle, walk and attack frame rows',()=>{
  const state=createMotion();expect(frameForMotion(state,sheet)).toBe(0);
  triggerMotion(state,'walk');advanceMotion(state,'walk',.1);expect(frameForMotion(state,sheet)).toBeGreaterThanOrEqual(4);
  triggerMotion(state,'attack');state.elapsed=.4;expect(frameForMotion(state,sheet)).toBe(11);
 });
 it('keeps hit feedback independent from casting and respects reduced motion',()=>{
  const state=createMotion();triggerMotion(state,'cast');triggerMotion(state,'hurt');expect(state.clip).toBe('cast');
  const idle=createMotion();idle.elapsed=.5;expect(frameForMotion(idle,sheet,true)).toBe(0);expect(poseForMotion(idle,true,true).y).toBe(0);
 });
});
