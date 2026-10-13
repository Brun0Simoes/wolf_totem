import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nocturneCharacters,NIGHT_PROFILES} from '../src/data/nocturne';
import {vampireCharacters,VAMPIRE_CHARACTER_IDS} from '../src/data/vampireChronicles';
import {Game,newHero,MAX_ROSTER_SIZE,SAVE_VERSION,isSupportedSaveVersion} from '../src/game/simulation';
import {AVATAR_UNLOCK_REBIRTHS} from '../src/data/collections';
import {characters} from '../src/data/characters';
import {combatProfile} from '../src/render/combatProfiles';
import {traitStatus} from '../src/game/synergies';
import {createMotion,triggerMotion,frameForMotion,type SheetDefinition} from '../src/render/animationModel';
import {portraitHTML} from '../src/render/portrait';
import {deepRiteForHero} from '../src/game/nightRituals';

const prepared=(id:number,stars=3)=>{
 const g=new Game();Object.assign(g.state,{rebirths:1,era:5,commanderLevel:3,progress:19,selectedStage:20});
 g.state.heroes=[newHero('vampire',id,stars,3),newHero('tank',3,stars,2),newHero('healer',25,stars,10)];
 g.state.heroes.forEach(h=>h.level=24);expect(g.startBattle().ok).toBe(true);
 const source=g.battle!.entities.find(e=>e.uid==='vampire')!;source.mana=source.manaMax;
 g.advanceBattle(.7);return {g,source};
};
describe('supernatural visual evolution',()=>{
 for(const c of nocturneCharacters)it(`${c.name}: unique three-star atlases, full poses and independent casting`,()=>{
  const hashes=[];
  for(const stars of [1,2,3]){
   const sheet=JSON.parse(readFileSync(`public/assets/animations/night/${c.id}-${stars}.json`,'utf8')) as SheetDefinition;
   const bytes=readFileSync('public'+sheet.image);hashes.push(createHash('sha256').update(bytes).digest('hex'));
   expect(bytes.readUInt32BE(16)).toBe(640);expect(bytes.readUInt32BE(20)).toBe(960);
   expect(sheet.rigged).toBe(false);expect(sheet.bodyHeight).toBeGreaterThan(40);
   expect(sheet.frameRects).toHaveLength(6);expect(sheet.frameAnchors!.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.x>0&&a.x<320&&a.y>0&&a.y<320)).toBe(true);
   const motion=createMotion();triggerMotion(motion,'windup');expect(frameForMotion(motion,sheet)).toBe(3);
   triggerMotion(motion,'attack');expect(frameForMotion(motion,sheet)).toBe(4);
   triggerMotion(motion,'cast');expect(frameForMotion(motion,sheet)).toBe(5);
   const portrait=portraitHTML(c,stars);expect(portrait).toContain(`${c.id}-${stars}-portrait.png`);
   const png=readFileSync(`public/assets/animations/night/${c.id}-${stars}-portrait.png`);expect(png.readUInt32BE(16)).toBe(320);
  }
  expect(new Set(hashes).size,'Stars must not share the same artwork').toBe(3);
 });
});
describe('Crônicas do Sangue',()=>{
 it('preserves the full expanded collection and accepts the current export version',()=>{
  const g=new Game();Object.assign(g.state,{rebirths:AVATAR_UNLOCK_REBIRTHS,era:5,commanderLevel:28});
  g.state.heroes=characters.map(c=>newHero('all-'+c.id,c.id,1));
  const data=JSON.parse(g.serialize());expect(isSupportedSaveVersion(data.version)).toBe(true);
  expect(MAX_ROSTER_SIZE).toBe(181);expect(new Game(data).state.heroes.map(h=>h.characterId)).toEqual(characters.map(c=>c.id));
  for(let n=1;n<=SAVE_VERSION;n++)expect(isSupportedSaveVersion(n)).toBe(true);
  for(const n of [0,-1,NaN,Infinity,'12',12.5,SAVE_VERSION+1])expect(isSupportedSaveVersion(n)).toBe(false);
 });
 it('matches vampire weapon effects to their painted blades',()=>{
  for(const id of [154,156,157,159,162])expect(combatProfile(id).weapon).toBe('blade');
 });
 it('adds ten distinct identities across all five eras with complete ability profiles',()=>{
  expect(vampireCharacters.map(c=>c.name)).toEqual(['Lestat','Akasha','Louis','Claudia','Armand','Marius','Maharet','Jesse','Santiago','Madeleine']);
  expect(new Set(VAMPIRE_CHARACTER_IDS).size).toBe(10);expect(vampireCharacters.every(c=>NIGHT_PROFILES.has(c.id))).toBe(true);
  for(let era=1;era<=5;era++)expect(vampireCharacters.filter(c=>c.cost===era)).toHaveLength(2);
  expect([2,4,6,8].map(n=>traitStatus('Crônicas do Sangue',n).tier)).toEqual([1,2,3,4]);
 });
 it('Lestat grants one bounded speed buff per ally and stuns a target',()=>{
  const {g,source}=prepared(154);const allies=g.battle!.entities.filter(e=>e.team==='ally');
  expect(allies.every(e=>e.mods.some(m=>m.tag==='requiem-speed'&&m.value===.3))).toBe(true);
  expect(g.battle!.entities.some(e=>e.team==='enemy'&&e.stun>0)).toBe(true);
  source.mana=source.manaMax;g.advanceBattle(.7);
  expect(allies.every(e=>e.mods.filter(m=>m.tag==='requiem-speed').length<=1)).toBe(true);
 });
 it('Akasha creates a finite fire zone and is adapted to the lineage rite',()=>{
  const {g,source}=prepared(155);const zone=g.battle!.zones.find(z=>z.sourceId===source.id&&z.kind==='fire');
  expect(zone).toBeDefined();expect(zone!.duration).toBe(4);expect(zone!.dps).toBeGreaterThan(0);
  expect(deepRiteForHero(155)).toBe('first-blood');expect(deepRiteForHero(154)).toBe('requiem');
 });
 it('retains old heroes and unlocked new identities through save round trips',()=>{
  const g=new Game();Object.assign(g.state,{rebirths:1,era:5,commanderLevel:10});
  g.state.heroes=[newHero('old',103,3,0),...vampireCharacters.map(c=>newHero('new-'+c.id,c.id,2))];
  const loaded=new Game(g.serialize());expect(loaded.state.heroes.map(h=>h.characterId)).toEqual([103,...VAMPIRE_CHARACTER_IDS]);
 });
});
