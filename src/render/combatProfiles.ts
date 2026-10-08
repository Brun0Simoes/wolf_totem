import { characters } from '../data/characters';

export type WeaponStyle='spear'|'claw'|'hammer'|'bow'|'staff'|'blade'|'bite';
export type SpellStyle='hunt'|'silk'|'charge'|'venom'|'drain'|'rain'|'flurry'|'gaze'|'guard'|'totem'|'volley'|'echo'|'leaf'|'dive'|'grapple'|'crow'|'wall'|'sting'|'tide'|'leap'|'shell'|'spring'|'moon'|'sun'|'beam'|'domain'|'storm'|'eclipse'|'frost'|'night'|'revive'|'avatar'|'swamp';
export interface CombatProfile {weapon:WeaponStyle;spell:SpellStyle;color:number;weight:number;stride:number;reach:number;arc:number}
const spells:SpellStyle[]=['hunt','silk','charge','venom','drain','rain','flurry','gaze','guard','flurry','totem','volley','echo','leaf','guard','dive','grapple','crow','wall','sting','tide','venom','leap','shell','spring','drain','moon','wall','echo','sun','beam','tide','crow','charge','night','sun','grapple','moon','hunt','domain','grapple','eclipse','wall','silk','avatar','venom','dive','storm','frost','eclipse','revive','night','revive','totem','swamp'];
const weapons:WeaponStyle[]=['spear','staff','hammer','claw','staff','staff','bite','bow','hammer','blade','staff','spear','staff','claw','hammer','bow','bite','staff','hammer','spear','staff','staff','claw','hammer','staff','bite','claw','hammer','staff','staff','staff','hammer','bow','spear','staff','claw','spear','staff','claw','hammer','bite','claw','hammer','staff','staff','bow','spear','hammer','hammer','claw','hammer','staff','staff','staff','bite'];
const colors=[0xb7dfff,0xaadcca,0xd2ac78,0xa4df72,0xe5bd74,0x84d9d0,0xe6a189,0xd5cdf6,0xb3d6aa,0xc4e984,0xf2d486,0xf4dfa0,0xc7a3ec,0x8fbf6a,0xc9c3b5,0xf2d27a,0x8fae5a,0x9a8fc4,0xc4a473,0xd9705a,0x7fc8d6,0xd96a6a,0xb7b0a0,0x8f94aa,0xbfe6a8,0xe0d2b0,0xcfd8ec,0xe8dcc0,0xd99a5f,0xf2d486,0xd9c25a,0x7fb8c8,0xa5a0b8,0xb8a88f,0x6f9fc8,0xf2b84f,0xd28a5e,0xe8ecf6,0xb7dfff,0xc0b49c,0x8faa5f,0xa98bd9,0xeadfc6,0xd8f0e4,0xe2b46a,0x6fd0a8,0x6fb4e8,0xc09d72,0xcfe9f7,0xffcf5a,0xf0e6cc,0x9d8ad8,0xe6e0a8,0xf4dfa0,0x7faa7a];
export const COMBAT_PROFILES:ReadonlyMap<number,CombatProfile>=new Map(characters.map((c,i)=>{
  const heavy=c.traits.some(t=>['Manada','Guardião','Brigão'].includes(t)),light=c.traits.some(t=>['Espreitador','Trapaceiro','Noturno'].includes(t));
  return[c.id,{weapon:weapons[i],spell:spells[i],color:colors[i],weight:heavy?1.3:light?.75:1,stride:heavy?.82:light?1.22:1,reach:weapons[i]==='spear'?14:weapons[i]==='hammer'?8:11,arc:['hunt','leap','dive'].includes(spells[i])?34:0}];
}));
export const combatProfile=(id:number)=>COMBAT_PROFILES.get(id)??COMBAT_PROFILES.get(1)!;
