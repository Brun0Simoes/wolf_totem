import { NIGHT_PROFILES } from '../data/nocturne';
import type { CombatApi, CombatEntity } from './simulation';
import { clampX, clampY } from './board';

/** Shared power archetypes with distinct identity, equipment, faction and star scaling. */
export function castNightAbility(api:CombatApi, id:number, s:CombatEntity,t:CombatEntity,p:number):boolean {
  const profile=NIGHT_PROFILES.get(id);if(!profile)return false;
  const star=Math.min(2,s.stars-1),near=api.enemiesOf(s).sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y));
  const allies=api.alliesOf(s).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);
  let struck=t;
  const hit=(n:number,k:number,magic=false)=>near.slice(0,n).forEach(e=>api.damage(s,e,p*k,magic));
  const mod=(e:CombatEntity,stat:'armor'|'attack',value:number,time:number)=>{e.mods=e.mods.filter(m=>m.tag!==`night-${id}`);e.mods.push({stat,value,time,tag:`night-${id}`});};
  switch(profile.ability){
    case 'anthem':
      hit(3,[1.6,2.1,2.7][star],true);
      for(const a of [...allies].sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)).slice(0,3)){
        a.mods=a.mods.filter(m=>m.tag!=='requiem-speed');a.mods.push({stat:'attackSpeed',value:[.15,.22,.3][star],time:4,tag:'requiem-speed'});
      }
      t.stun=Math.max(t.stun,[1,1.3,1.6][star]);break;
    case 'pyre':
      for(const e of near.slice(0,3)){const dealt=api.damage(s,e,p*[1.8,2.4,3.1][star],true);api.heal(s,s,dealt*.15);}
      api.addZone({kind:'fire',team:s.team,sourceId:s.id,x:t.x,y:t.y,radius:1.6,time:4,dps:p*[.4,.55,.75][star]});break;
    case 'whip':hit(3,[1.8,2.3,2.9][star]);t.huntMarked=5;mod(t,'armor',-[12,18,24][star],5);break;
    case 'elements':api.damage(s,t,p*[1.6,2.1,2.8][star],true);api.addZone({kind:'frost',team:s.team,sourceId:s.id,x:t.x,y:t.y,radius:1.7,time:5,dps:p*[.35,.45,.6][star],slow:true});break;
    case 'blade':{
      const far=api.targetableEnemiesOf(s).sort((a,b)=>Math.hypot(b.x-s.x,b.y-s.y)-Math.hypot(a.x-s.x,a.y-s.y))[0]??t;
      struck=far;
      s.x=clampX(far.x);s.y=clampY(far.y+(s.team==='ally'?.6:-.6));s.stealth=1;
      api.damage(s,far,p*[2.4,3,3.9][star]);api.shield(s,s,s.maxHp*[.12,.18,.24][star]);break;
    }
    case 'blood':for(const e of near.slice(0,3)){const dealt=api.damage(s,e,p*[1.8,2.3,3][star],true);api.heal(s,s,dealt*.35);e.antiheal=5;}break;
    case 'heal':for(const a of allies.slice(0,3)){api.heal(s,a,p*[1.8,2.5,3.4][star]);a.poison=0;a.hex=0;a.mana=Math.min(a.manaMax,a.mana+10);}break;
    case 'forge':
      if(id===135){for(const characterId of [150,151,152,153])api.summon(s,'echo',{characterId,hp:s.maxHp*.16,attack:s.attack*[.35,.45,.55][star],range:characterId===150||characterId===153?3:1,lifetime:8});}
      else for(let i=0;i<[2,3,4][star];i++)api.summon(s,'echo',{hp:s.maxHp*.18,attack:s.attack*[.4,.5,.65][star],range:1,lifetime:9});break;
    case 'guard':api.shield(s,s,s.maxHp*[.25,.35,.45][star]);s.taunt=4;for(const a of [...allies].sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)).filter(a=>a!==s).slice(0,3))api.shield(s,a,s.maxHp*[.12,.18,.25][star]);break;
    case 'curse':for(const e of api.enemiesOf(s).sort((a,b)=>b.hp-a.hp).slice(0,2)){e.hex=5;e.hexDamage=p*[2,2.7,3.5][star]/5;e.mana=Math.max(0,e.mana-[15,25,35][star]);e.antiheal=5;}break;
    case 'volley':hit(4,[1.4,1.8,2.3][star]);api.damage(s,t,p*[1.4,1.8,2.3][star]);t.marked=5;break;
    case 'portal':api.addZone({kind:'domain',team:s.team,sourceId:s.id,x:t.x,y:t.y,radius:2,time:4,dps:p*[.45,.6,.8][star],slow:true});api.shield(s,s,s.maxHp*[.18,.25,.32][star]);break;
    case 'serpent':s.transform=6;mod(s,'attack',[.25,.35,.5][star],6);hit(3,[1.8,2.4,3.2][star],true);for(const e of near.slice(0,3)){e.poison=5;e.poisonDamage=Math.max(e.poisonDamage,p*.25);}break;
    case 'beast':hit(3,[1.8,2.4,3.2][star]);t.stun=[1,1.3,1.6][star];s.haste=4;break;
    case 'eclipse':for(const e of api.enemiesOf(s).sort((a,b)=>b.hp-a.hp).slice(0,4)){api.damage(s,e,p*[2.1,2.8,3.7][star],true);e.antiheal=6;}api.shield(s,s,s.maxHp*[.2,.28,.36][star]);break;
  }
  const timed=(stat:CombatEntity['mods'][number]['stat'],value:number,time:number,target=s)=>{target.mods=target.mods.filter(m=>m.tag!==`signature-${id}`);target.mods.push({stat,value,time,tag:`signature-${id}`});};
  const mana=(e:CombatEntity,n:number)=>e.mana=Math.min(e.manaMax,e.mana+n);
  switch(id){
    case 101:for(const a of allies.filter(a=>Math.hypot(a.x-t.x,a.y-t.y)<2))a.haste=Math.max(a.haste,3);break;
    case 102:t.wet=5;break;case 103:s.haste=4;break;
    case 104:api.addZone({kind:'domain',team:s.team,sourceId:s.id,x:t.x,y:t.y,radius:1.8,time:4,dps:p*.2});break;
    case 105:if(allies[0])api.shield(s,allies[0],p*.8);break;
    case 106:api.summon(s,'echo',{characterId:129,hp:s.maxHp*.15,attack:s.attack*.4,range:1,lifetime:8});break;
    case 107:api.summon(s,'beetle',{hp:s.maxHp*.15,attack:s.attack*.4,range:1,lifetime:8});break;
    case 108:for(const e of near.slice(0,5))e.antiheal=5;break;
    case 109:timed('attack',-.12,5,t);break;case 110:timed('armor',25,5);break;
    case 111:for(const a of allies.slice(0,3))timed('attack',.1,5,a);break;
    case 112:mana(s,15);break;case 113:s.dodge=1;break;
    case 114:if(t.hp>0&&t.hp/t.maxHp<.4)api.damage(s,t,p*.6);break;
    case 115:for(const e of near.slice(0,2))e.slow=3;break;
    case 116:timed('damageTaken',-.12,4);break;case 117:timed('attackSpeed',.2,4);break;
    case 118:timed('armor',-20,4,t);break;
    case 119:if(t.hp>0&&t.hp/t.maxHp<.2)api.damage(s,t,p*.8,false,true);break;
    case 120:timed('lifesteal',.12,5);break;case 121:api.heal(s,s,s.maxHp*.05);break;
    case 122:if(allies[0])api.shield(s,allies[0],p*.7);break;case 123:for(const e of near.slice(0,3))e.slow=3;break;
    case 124:t.mana=Math.max(0,t.mana-10);break;
    case 125:case 150:t.poison=4;t.poisonDamage=Math.max(t.poisonDamage,p*.15);break;
    case 126:api.heal(s,s,s.maxHp*.08);break;case 127:for(const e of near.slice(0,3))e.antiheal=6;break;
    case 128:for(const a of allies.slice(0,2))mana(a,12);break;case 129:timed('magicResist',20,5);break;
    case 130:s.poison=0;s.hex=0;break;case 131:t.hex+=2;break;case 132:s.taunt=2;break;
    case 133:for(const e of near.slice(0,3))e.mana=Math.max(0,e.mana-10);break;
    case 134:api.addZone({kind:'domain',team:s.team,sourceId:s.id,x:t.x,y:t.y,radius:1.3,time:3,dps:p*.2});break;
    case 136:api.shield(s,s,s.maxHp*.15);break;case 137:for(const a of allies.slice(0,3))a.haste=3;break;
    case 138:t.stun=Math.max(t.stun,.8);break;case 139:mana(s,10);break;case 140:timed('attack',.15,4);break;
    case 141:s.transform=8;break;case 142:timed('magicResist',20,5);break;
    case 143:s.x=clampX(t.x);s.y=clampY(t.y+(s.team==='ally'?.6:-.6));break;
    case 144:timed('attack',.15,5);break;case 145:if(allies[0])api.shield(s,allies[0],p*.8);break;
    case 146:for(const a of allies.slice(0,3))mana(a,15);break;case 147:mana(s,12);break;
    case 148:t.stun+=.4;break;case 149:for(const a of allies.slice(0,3))api.heal(s,a,p*.8);break;
    case 151:for(const e of near.slice(0,3))e.slow=3;break;
    case 152:api.addZone({kind:'veil',team:s.team,sourceId:s.id,followId:s.id,x:s.x,y:s.y,radius:1.8,time:4,protect:.12});break;
    case 153:for(const e of near.slice(0,3))e.wet=6;break;
    case 156:if(struck.marked>0&&struck.hp>0)api.damage(s,struck,p*.4);break;
    case 157:if(t.hp>0&&t.hp/t.maxHp<.3)api.damage(s,t,p*.3);break;
    case 158:t.stun=Math.max(t.stun,[.6,.8,1][star]);timed('attack',-.1,4,t);break;
    case 159:for(const a of [...allies].sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)).filter(a=>a!==s).slice(0,3))timed('armor',[12,18,25][star],4,a);break;
    case 160:for(const a of allies.slice(0,2)){api.heal(s,a,p*[.8,1.1,1.5][star]);a.hex=0;}break;
    case 161:for(const e of near.slice(0,3)){e.stealth=0;e.marked=5;}break;
    case 162:s.dodge=.6;s.taunt=2;break;
    case 163:if(allies[0])api.shield(s,allies[0],p*[.6,.9,1.2][star]);break;
  }
  return true;
}
