import {describe,it,expect} from 'vitest';
import {readFileSync,readdirSync} from 'node:fs';
import type {SheetDefinition,MotionClip} from '../src/render/animationModel';
import {createMotion,frameForMotion,poseForMotion,CLIP_DURATION} from '../src/render/animationModel';
import {arenaSpriteScale,previewGround,previewSpriteScale,spriteAnchor,spriteHitBounds} from '../src/render/spriteGeometry';
import {combatProfile} from '../src/render/combatProfiles';

const sheets=['night','avatar'].flatMap(dir=>readdirSync(`public/assets/animations/${dir}`).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(`public/assets/animations/${dir}/${f}`,'utf8')) as SheetDefinition));
describe('expansion sprite placement',()=>{
 it('covers all 126 heroes and 378 evolved forms',()=>{expect(sheets).toHaveLength(378);expect(new Set(sheets.map(s=>s.characterId)).size).toBe(126);});
 for(const id of [...new Set(sheets.map(s=>s.characterId))])it(`${id}: every pose fits the arena footprint and the preview in both directions`,()=>{
  for(const sheet of sheets.filter(s=>s.characterId===id)){
   expect(sheet.layoutVersion).toBe(1);expect(sheet.frameBounds).toHaveLength(6);
   const arena=arenaSpriteScale(sheet,116),preview=previewSpriteScale(sheet,640,560),ground=previewGround(sheet,560);
   expect(arena).toBeGreaterThan(0);expect(preview).toBeGreaterThan(0);
   for(const [i,b]of sheet.frameBounds!.entries()){
    expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(320);expect(b.y+b.height).toBeLessThanOrEqual(320);
    expect(b.width*arena).toBeLessThanOrEqual(sheet.arenaWidth!*(i===0?1:1.5)+.001);
    const hit=spriteHitBounds(sheet,i);expect(hit.x).toBeGreaterThanOrEqual(b.x);expect(hit.x+hit.width).toBeLessThanOrEqual(b.x+b.width+.001);
   }
   for(const facing of [1,-1])for(const clip of ['idle','walk','windup','attack','cast'] as MotionClip[])for(let step=0;step<12;step++){
    const motion=createMotion();Object.assign(motion,{clip,facing,elapsed:CLIP_DURATION[clip]*step/12,...combatProfile(id)});
    const frame=frameForMotion(motion,sheet),b=sheet.frameBounds![frame],a=spriteAnchor(sheet,frame),pose=poseForMotion(motion,true);
    const rad=pose.angle*Math.PI/180;
    // Project asset corners independently using the real renderer's motion and its fixed stage scale.
    for(const x of [b.x-a.x,b.x+b.width-a.x])for(const y of [b.y-a.y,b.y+b.height-a.y]){
     const sx=x*facing*preview*pose.scaleX,sy=y*preview*pose.scaleY;
     const px=320+pose.x*2+sx*Math.cos(rad)-sy*Math.sin(rad),py=ground+pose.y*2+sx*Math.sin(rad)+sy*Math.cos(rad);
     expect(px,`${sheet.name} ${sheet.stars} ${clip} x`).toBeGreaterThanOrEqual(0);expect(px).toBeLessThanOrEqual(640);
     expect(py,`${sheet.name} ${sheet.stars} ${clip} y`).toBeGreaterThanOrEqual(0);expect(py).toBeLessThanOrEqual(512);
    }
   }
  }
 });
 it('keeps small companions and children smaller than adult warriors',()=>{
  const height=(id:number)=>sheets.find(s=>s.characterId===id&&s.stars===3)!.arenaHeight!;
  expect(height(229)).toBeLessThan(height(202));expect(height(257)).toBeLessThan(height(256));expect(height(157)).toBeLessThan(height(154));expect(height(233)).toBeLessThan(height(230));
 });
});
