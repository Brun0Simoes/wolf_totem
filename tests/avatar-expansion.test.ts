import {describe,it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {characters} from '../src/data/characters';
import {avatarCharacters,AVATAR_PROFILES} from '../src/data/avatar';
import {AVATAR_RITES} from '../src/data/avatarRituals';
import {AVATAR_TRAITS} from '../src/data/avatarTraits';
import {AVATAR_UNLOCK_REBIRTHS,characterUnlocked} from '../src/data/collections';
import {Game,newHero,MAX_ROSTER_SIZE} from '../src/game/simulation';
import {draftPool} from '../src/game/economy';
import {ritesForHero,deepRiteForHero} from '../src/game/nightRituals';
import {RitualPlay,RITUAL_PLAY} from '../src/game/ritualPlay';
import {traitStatus} from '../src/game/synergies';
import {endlessStage} from '../src/game/campaign';
import {BOARD} from '../src/game/board';
import {applyAvatarTraits} from '../src/game/avatarProgression';
import {BUILDS} from '../src/game/builds';
import {roleOf} from '../src/game/armyAdvisor';

const prepared=(id:number,stars:number)=>{
 const g=new Game();Object.assign(g.state,{rebirths:AVATAR_UNLOCK_REBIRTHS,era:5,commanderLevel:3,progress:19,selectedStage:20});
 g.state.heroes=[newHero('avatar',id,stars,3),newHero('tank',3,3,2),newHero('support',25,3,10)];g.state.heroes.forEach(h=>h.level=24);
 expect(g.startBattle().ok).toBe(true);const source=g.battle!.entities.find(e=>e.uid==='avatar')!;source.mana=source.manaMax;
 g.advanceBattle(.7);return {g,source};
};
describe('Quatro Nações roster and access',()=>{
 it('adds exactly 63 identities, seven Avatars and all five era tiers',()=>{
  expect(avatarCharacters).toHaveLength(63);expect(characters).toHaveLength(181);
  expect(new Set(characters.map(c=>c.id)).size).toBe(181);expect(new Set(characters.map(c=>c.name)).size).toBe(181);
  expect(avatarCharacters.filter(c=>c.traits.includes('Ciclo Avatar'))).toHaveLength(7);
  for(let era=1;era<=5;era++)expect(avatarCharacters.some(c=>c.cost===era)).toBe(true);
  for(const c of avatarCharacters){expect(AVATAR_PROFILES.has(c.id)).toBe(true);expect(new Set(c.evolution).size).toBe(3);expect(c.hp[2]).toBeGreaterThan(c.hp[1]);expect(c.hp[1]).toBeGreaterThan(c.hp[0]);}
 });
 it('keeps both expansion gates in draft, rerolls, recruitment, saves and Abismo',()=>{
  expect(draftPool(5,[],[],0)).toHaveLength(55);expect(draftPool(5,[],[],1)).toHaveLength(118);expect(draftPool(5,[],[],AVATAR_UNLOCK_REBIRTHS)).toHaveLength(181);
  for(const rebirths of [0,1,AVATAR_UNLOCK_REBIRTHS]){
   const g=new Game();Object.assign(g.state,{rebirths,era:5,amber:10000});g.openDraft();for(let n=0;n<3;n++)g.rerollDraft(n);
   expect(g.state.draft!.offers.every(id=>characterUnlocked(id,rebirths))).toBe(true);
   g.state.draft={era:5,offers:[201,202,204],rolls:0,rerolled:[false,false,false]};g.state.heroes.push(newHero('injected',205));
   const loaded=new Game(g.serialize());expect(loaded.state.heroes.some(h=>h.characterId===205)).toBe(rebirths>=AVATAR_UNLOCK_REBIRTHS);
   expect((loaded.state.draft?.offers??[]).every(id=>characterUnlocked(id,rebirths))).toBe(true);
   g.state.heroes=g.state.heroes.filter(h=>h.characterId!==204);expect(g.recruit(204).ok).toBe(rebirths>=AVATAR_UNLOCK_REBIRTHS);
   for(let depth=1;depth<=20;depth++)expect(endlessStage(depth,rebirths).units.every(u=>characterUnlocked(u.id,rebirths))).toBe(true);
  }
 });
 it('excludes owned and current cards, even when only three new heroes remain',()=>{
  const owned=characters.filter(c=>![201,202,204].includes(c.id)).map(c=>c.id);
  expect(draftPool(5,owned,[201],AVATAR_UNLOCK_REBIRTHS).map(c=>c.id)).toEqual([202,204]);
 });
 it('never starts a fresh journey with an expansion hero',()=>{for(let seed=0;seed<80;seed++)expect(new Game(undefined,1000,seed).state.heroes[0].characterId).toBeLessThan(101);});
 it('retains the complete 181-hero collection and old identities',()=>{
  const g=new Game();Object.assign(g.state,{rebirths:AVATAR_UNLOCK_REBIRTHS,era:5,commanderLevel:28});g.state.heroes=characters.map(c=>newHero('all-'+c.id,c.id,2));
  expect(MAX_ROSTER_SIZE).toBe(181);expect(new Game(g.serialize()).state.heroes.map(h=>h.characterId)).toEqual(characters.map(c=>c.id));
 });
 it('preserves non-bender training and source identity',()=>{
  for(const id of [204,210,216,217,218,219,226,238,243,244,257])expect(deepRiteForHero(id)).toBe('warrior-path');
  expect(AVATAR_PROFILES.get(213)!.source).toBe('A Lenda de Korra');expect(avatarCharacters.find(c=>c.id===251)!.evolution[0]).toContain('braços de água');
 });
});
describe('Avatar combat, traits and awakening',()=>{
 for(const c of avatarCharacters)it(`${c.name}: three bounded skills and compatible awakening`,()=>{
  const own=deepRiteForHero(c.id);expect(ritesForHero(c.id).some(r=>r.id===own)).toBe(true);expect(ritesForHero(c.id).every(r=>AVATAR_RITES.includes(r.id))).toBe(true);
  for(const stars of [1,2,3]){
   const {g,source}=prepared(c.id,stars);expect(g.events.some(e=>e.type==='skill'&&e.sourceId===source.id)).toBe(true);
   for(let n=0;n<50&&g.battle!.status==='fighting';n++)g.advanceBattle(.1);
   for(const e of g.battle!.entities){expect([e.hp,e.maxHp,e.mana,e.attack,e.x,e.y].every(Number.isFinite)).toBe(true);expect(e.x>=0&&e.x<=BOARD.maxX&&e.y>=0&&e.y<=BOARD.maxY).toBe(true);}
  }
  const g=new Game();Object.assign(g.state,{rebirths:AVATAR_UNLOCK_REBIRTHS,era:5,amber:10000});const h={...newHero('awaken',c.id),level:24,ritualLevel:8};g.state.heroes=[h];
  expect(g.performActiveRitual(h.uid,'rape').ok).toBe(false);expect(g.performActiveRitual(h.uid,'blood-pact').ok).toBe(false);expect(g.performActiveRitual(h.uid,own,1).ok).toBe(true);expect(h.stars).toBe(3);expect(h.ritualReadyAt).toBe(0);
 });
 it('requires experience and ritual level independently for stars',()=>{
  for(const [level,ritualLevel]of [[23,8],[24,7]]){const g=new Game();Object.assign(g.state,{rebirths:AVATAR_UNLOCK_REBIRTHS,era:5,amber:10000});const h={...newHero('aang',201,2),level,ritualLevel};g.state.heroes=[h];g.performActiveRitual(h.uid,'avatar-convergence');expect(h.stars).toBe(2);}
 });
 it('reaches every horizontal trait threshold and caps the last tier',()=>{
  const {source}=prepared(201,3);
  for(const [name,rule]of Object.entries(AVATAR_TRAITS)){
   const members=avatarCharacters.filter(c=>c.traits.includes(name)).length;expect(rule.thresholds.at(-1)).toBeLessThanOrEqual(members);
   for(let tier=1;tier<=rule.thresholds.length;tier++){expect(traitStatus(name,rule.thresholds[tier-1]).tier).toBe(tier);const clone={...source,mods:[]};applyAvatarTraits(clone,name,tier);expect([clone.attack,clone.maxHp,clone.mana,clone.manaRegen,clone.spellPower].every(Number.isFinite)).toBe(true);}
   const a={...source,mods:[]},b={...source,mods:[]};applyAvatarTraits(a,name,rule.thresholds.length);applyAvatarTraits(b,name,999);expect(b).toEqual(a);
  }
 });
 it('records active Avatar bonds on actual combat entities',()=>{
  const g=new Game();Object.assign(g.state,{rebirths:AVATAR_UNLOCK_REBIRTHS,era:5,commanderLevel:28});
  g.state.heroes=[newHero('air-aang',201,1,0),newHero('air-tenzin',230,1,1)];
  expect(g.startBattle().ok).toBe(true);
  for(const e of g.battle!.entities.filter(e=>e.team==='ally')){expect(e.bonds).toContain('Nômades do Ar');expect(e.mods.some(m=>m.tag==='avatar-air')).toBe(true);}
  expect(g.battle!.entities.find(e=>e.uid==='air-aang')!.bonds).not.toContain('Ciclo Avatar');
 });
 it('finishes all seven interactive exercises without waiting timers',()=>{for(const id of AVATAR_RITES){expect(RITUAL_PLAY[id].instruction.length).toBeGreaterThan(25);expect(RITUAL_PLAY[id].sound.length).toBeGreaterThan(10);const play=new RitualPlay(id,17);for(let n=0;n<1200&&!play.done;n++)play.tick(.05);expect(play.done).toBe(true);}});
 it('exports a full mixed expansion QA save with legal positions and item builds',()=>{
  const g=new Game();Object.assign(g.state,{rebirths:AVATAR_UNLOCK_REBIRTHS,era:5,commanderLevel:28,progress:29,selectedStage:30,amber:20000});
  g.state.heroes=avatarCharacters.map(c=>({...newHero('avatar-'+c.id,c.id,3),level:30,ritualLevel:10,rituals:Object.fromEntries(ritesForHero(c.id).map(r=>[r.id,r.max])),items:[...BUILDS.find(b=>b.role===roleOf(c))!.items]}));g.applyArmyPlan();
  mkdirSync('artifacts/avatar-evolution',{recursive:true});writeFileSync('artifacts/avatar-evolution/post-reset.json',g.serialize());expect(new Game(g.serialize()).state.heroes).toHaveLength(63);
  expect(new Set(g.state.heroes.filter(h=>h.slot!==null).map(h=>h.slot)).size).toBe(28);
  expect(g.startBattle().ok).toBe(true);for(let n=0;n<1600&&g.battle!.status==='fighting';n++)g.advanceBattle(.1);
  writeFileSync('artifacts/avatar-evolution/balance.json',JSON.stringify({status:g.battle!.status,time:g.battle!.time,party:g.battle!.party},null,2));expect(g.battle!.status).toBe('victory');
 });
});
