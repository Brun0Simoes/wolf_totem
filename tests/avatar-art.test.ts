import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {avatarCharacters} from '../src/data/avatar';
import {createMotion,triggerMotion,frameForMotion,type SheetDefinition} from '../src/render/animationModel';
import {portraitHTML} from '../src/render/portrait';
describe('Avatar evolving sprite assets',()=>{
 for(const c of avatarCharacters)it(`${c.name}: complete three-tier sprites, alpha and separate cast pose`,()=>{
  const hashes=[];
  for(const stars of [1,2,3]){
   const sheet=JSON.parse(readFileSync(`public/assets/animations/avatar/${c.id}-${stars}.json`,'utf8')) as SheetDefinition;
   const png=readFileSync('public'+sheet.image);expect(png.readUInt32BE(16)).toBe(640);expect(png.readUInt32BE(20)).toBe(960);expect(png[25]).toBe(6);
   hashes.push(createHash('sha256').update(png).digest('hex'));expect(sheet.characterId).toBe(c.id);expect(sheet.stars).toBe(stars);expect(sheet.rigged).toBe(false);
   expect(sheet.frameRects).toHaveLength(6);expect(sheet.frameAnchors!.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>0&&a.x<320&&a.y>0&&a.y<320)).toBe(true);
   expect(sheet.bodyHeight).toBeGreaterThan(40);expect(sheet.clips.walk).toEqual([1,0,2,0]);
   const motion=createMotion();for(const [clip,frame]of [['windup',3],['attack',4],['cast',5]] as const){triggerMotion(motion,clip);expect(frameForMotion(motion,sheet)).toBe(frame);}
   const portrait=readFileSync(`public/assets/animations/avatar/${c.id}-${stars}-portrait.png`);expect(portrait.readUInt32BE(16)).toBe(320);expect(portrait.readUInt32BE(20)).toBe(320);expect(portrait[25]).toBe(6);
   expect(portraitHTML(c,stars)).toContain(`avatar/${c.id}-${stars}-portrait.png`);
  }
  expect(new Set(hashes).size,'Star tiers must have distinct artwork').toBe(3);
 });
});
