import { AVATAR_TRAITS } from '../data/avatarTraits';
import type { CombatEntity } from './simulation';
import type { PracticeId } from './tribe';
export function applyAvatarTraits(e:CombatEntity,trait:string,tier:number){
 const rule=AVATAR_TRAITS[trait];if(!rule)return false;if(tier<=0)return true;
 const n=Math.min(rule.thresholds.length,tier)-1;
 switch(trait){
  case 'Tribos da Água':e.manaRegen+=[.5,1,1.8,2.5][n];e.spellPower*=1+[.05,.1,.18,.26][n];break;
  case 'Reino da Terra':e.armor+=[12,24,40,60][n];e.maxHp*=1+[.08,.16,.26,.38][n];break;
  case 'Nação do Fogo':e.attack*=1+[.08,.18,.32,.48][n];e.spellPower*=1+[.1,.2,.35,.5][n];break;
  case 'Nômades do Ar':e.mods.push({stat:'attackSpeed',value:[.08,.15,.24,.35][n],time:Infinity,tag:'avatar-air'});e.mods.push({stat:'damageTaken',value:-[.05,.1,.16,.22][n],time:Infinity,tag:'avatar-air-guard'});break;
  case 'Cidade República':e.attack*=1+[.1,.22,.37,.55][n];e.armor+=[6,12,20,30][n];break;
  case 'Mundo Espiritual':e.magicResist+=[10,20,35,50][n];e.spellPower*=1+[.08,.15,.25,.35][n];break;
  case 'Ciclo Avatar':e.spellPower*=1+[.2,.35,.5][n];e.mana+=[10,20,30][n];break;
  case 'Lótus Branca':e.manaRegen+=[.5,1,1.5][n];e.spellPower*=1+[.1,.2,.35][n];break;
  case 'Lótus Vermelha':e.mods.push({stat:'attackSpeed',value:[.15,.3][n],time:Infinity,tag:'avatar-red-lotus'});e.spellPower*=1+[.2,.4][n];break;
 }
 return true;
}
export function applyAvatarRituals(e:CombatEntity,r:Partial<Record<PracticeId,number>>){
 const count=(id:PracticeId)=>Math.max(0,Math.min(3,r[id]??0));
 e.attackSpeed*=1+.04*count('air-discipline');e.spellPower*=1+.04*count('water-flow');e.manaRegen+=.25*count('water-flow');
 e.maxHp*=1+.05*count('earth-root');e.armor+=6*count('earth-root');
 e.attack*=1+.05*count('fire-breath');e.spellPower*=1+.03*count('fire-breath');
 e.attack*=1+.04*count('warrior-path');e.armor+=4*count('warrior-path');
 e.magicResist+=8*count('spirit-balance');e.spellPower*=1+.04*count('spirit-balance');
 if(r['avatar-convergence']){e.spellPower*=1.15;e.mana+=15;}
}
