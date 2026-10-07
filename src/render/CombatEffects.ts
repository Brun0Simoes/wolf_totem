import Phaser from 'phaser';
import { ARENA_CENTER as C, ARENA_SPAN as S } from './battleArena';

export interface FxPoint { x: number; y: number }
export const SKILL_COLORS:Record<number,number>={1:0xb7dfff,2:0xaadcca,3:0xd2ac78,4:0xa4df72,5:0xe5bd74,6:0x84d9d0,7:0xe6a189,8:0xd5cdf6,9:0xb3d6aa,10:0xc4e984,11:0xf2d486,12:0xf4dfa0,13:0xc7a3ec,
 14:0x8fbf6a,15:0xc9c3b5,16:0xf2d27a,17:0x8fae5a,18:0x9a8fc4,19:0xc4a473,20:0xd9705a,21:0x7fc8d6,22:0xd96a6a,23:0xb7b0a0,24:0x8f94aa,25:0xbfe6a8,26:0xe0d2b0,
 27:0xcfd8ec,28:0xe8dcc0,29:0xd99a5f,30:0xf2d486,31:0xd9c25a,32:0x7fb8c8,33:0xa5a0b8,34:0xb8a88f,35:0x6f9fc8,36:0xf2b84f,37:0xd28a5e,38:0xe8ecf6,
 39:0xb7dfff,40:0xc0b49c,41:0x8faa5f,42:0xa98bd9,43:0xeadfc6,44:0xd8f0e4,45:0xe2b46a,46:0x6fd0a8,47:0x6fb4e8,48:0xc09d72,
 49:0xcfe9f7,50:0xffcf5a,51:0xf0e6cc,52:0x9d8ad8,53:0xe6e0a8,54:0xf4dfa0,55:0x7faa7a};
const colors=SKILL_COLORS;
type Recipe='leap'|'shield'|'allies'|'heal'|'line'|'nova'|'volley'|'aura'|'call'|'night'|'stampede'|'web'|'totems'|'swap'|'flurry'|'mark';
/** Visual vocabulary for abilities 14–55; damage and positions come only from the simulation. */
const RECIPES:Record<number,Recipe[]>={
 14:['leap','flurry'],15:['shield','nova'],16:['leap'],17:['flurry','nova'],18:['call'],19:['allies','nova'],20:['flurry'],21:['swap'],22:['volley'],
 23:['leap','flurry'],24:['shield'],25:['heal'],26:['flurry','mark'],27:['aura','leap'],28:['allies','nova'],29:['call','volley'],30:['call'],31:['line'],
 32:['nova'],33:['volley'],34:['line','aura'],35:['nova'],36:['aura'],37:['line'],38:['allies'],39:['mark','leap'],40:['nova','aura'],41:['flurry','nova'],
 42:['flurry','aura'],43:['allies','nova'],44:['web','call'],45:['call','volley'],46:['aura','volley'],47:['leap','mark'],48:['stampede'],49:['aura','nova'],
 50:['leap','flurry','aura'],51:['allies','call'],52:['night'],53:['nova','heal'],54:['totems','allies','volley'],55:['leap','nova'],
};

/** Scene-only effects. They never apply damage or change simulation positions. */
export class CombatEffects {
 private sprites=new Map<Phaser.GameObjects.Image,Phaser.Tweens.Tween>();
 private active=new Map<Phaser.GameObjects.Graphics, Phaser.Tweens.Tween>();
 constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Layer,public reduced=false){}

 private stamp(frame:string,p:FxPoint,width:number,duration:number,angle=0,destination=p){
  if(!this.scene.textures.exists('painted-fx')||this.sprites.size>=24)return;
  const image=this.scene.add.image(p.x,p.y,'painted-fx',frame).setDepth(1101).setAngle(angle);
  const scale=width/image.width;image.setScale(scale*.72).setAlpha(this.reduced?.45:.8);this.layer.add(image);
  const tween=this.scene.tweens.add({targets:image,x:destination.x,y:destination.y,scale:scale*1.15,alpha:0,duration:this.reduced?Math.min(250,duration):duration,ease:'Cubic.easeOut',onComplete:()=>{this.sprites.delete(image);image.destroy();}});
  this.sprites.set(image,tween);
 }
 private draw(duration:number,paint:(g:Phaser.GameObjects.Graphics,t:number)=>void,delay=0){
  if(this.active.size>=48){const oldest=this.active.entries().next().value;if(oldest){oldest[1].stop();oldest[0].destroy();this.active.delete(oldest[0]);}}
  const g=this.scene.add.graphics().setDepth(1100);this.layer.add(g);
  const clock={t:0};paint(g,0);
  const tween=this.scene.tweens.add({targets:clock,t:1,duration:this.reduced?Math.min(300,duration):duration,delay,
   onUpdate:()=>{g.clear();paint(g,clock.t);},onComplete:()=>{g.destroy();this.active.delete(g);}});
  this.active.set(g,tween);return g;
 }
 private ring(p:FxPoint,color:number,radius=42,duration=500,delay=0){
  this.draw(duration,(g,t)=>{g.lineStyle(2.5*(1-t)+.5,color,(1-t)*.8);g.strokeEllipse(p.x,p.y,radius*(.3+t*1.7),radius*(.15+t*.75));},delay);
 }
 dust(p:FxPoint,color=0xb8ab79,count=7){
  this.stamp('dust',{x:p.x,y:p.y-12},55,520);
  this.draw(520,(g,t)=>{for(let i=0;i<(this.reduced?2:count);i++){const a=i*2.399;const r=10+t*(17+i*3);g.fillStyle(color,(1-t)*.4);g.fillCircle(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.38-t*10,(2+i%3)*(1-t*.6));}});
 }
 hit(p:FxPoint,color=0xf6e1ad){
  this.stamp('hit',{x:p.x,y:p.y-42},42,210);
  this.draw(210,(g,t)=>{g.lineStyle(2,color,1-t);for(let i=0;i<5;i++){const a=i*1.256;const r=4+t*20;g.lineBetween(p.x+Math.cos(a)*r,p.y-42+Math.sin(a)*r,p.x+Math.cos(a)*(r+7),p.y-42+Math.sin(a)*(r+7));}});
 }
 heal(p:FxPoint){
  this.stamp('heal',{x:p.x,y:p.y-37},74,850);
  this.ring(p,0xa8e1ad,48,760);
  this.draw(850,(g,t)=>{for(let i=0;i<5;i++){const x=p.x+Math.sin(i*2.4)*22,y=p.y-12-i*10-t*40;g.lineStyle(2,0xb3e7b4,Math.sin(t*Math.PI)*.8);g.lineBetween(x-3,y,x+3,y);g.lineBetween(x,y-3,x,y+3);}});
 }
 shield(p:FxPoint){
  this.stamp('shield',{x:p.x,y:p.y-43},75,720);
  this.draw(720,(g,t)=>{const a=Math.sin(Math.PI*t);g.lineStyle(2,0xb7dcdf,a*.85);g.strokeEllipse(p.x,p.y-42,74,100);g.fillStyle(0x8fd5cc,a*.08);g.fillEllipse(p.x,p.y-42,74,100);for(let i=0;i<6;i++){const ang=i*Math.PI/3;g.fillStyle(0xd4eece,a*.9);g.fillCircle(p.x+Math.cos(ang)*37,p.y-42+Math.sin(ang)*50,2);}});
 }
 death(p:FxPoint,color:number){
  this.dust(p,0x9b927a,11);
  this.draw(950,(g,t)=>{for(let i=0;i<8;i++){g.fillStyle(color,Math.sin(t*Math.PI)*.6);g.fillCircle(p.x+Math.sin(i*2.4+t)*20,p.y-20-t*(25+i*6),1.2);}});
 }
 slash(source:FxPoint,target:FxPoint,color:number,count=1){
  this.stamp('slash',{x:target.x,y:target.y-43},62,300,target.x>=source.x?0:180);
  const direction=target.x>=source.x?1:-1;
  for(let k=0;k<count;k++)this.draw(300,(g,t)=>{
   g.lineStyle(3*(1-t)+1,color,(1-t)*.85);
   const center={x:target.x+direction*(k-1)*6,y:target.y-43+k*4};
   g.beginPath();for(let j=0;j<12;j++){const a=(-1.3+t*.5)+j/11*1.85;const x=center.x+direction*Math.cos(a)*(27+k*4);const y=center.y+Math.sin(a)*(29+k*3);if(j===0)g.moveTo(x,y);else g.lineTo(x,y);}g.strokePath();
  },k*75);
 }
 projectile(source:FxPoint,target:FxPoint,id:number){
  const color=colors[id]??0xe6d5ae;
  if(id!==8&&id!==12)this.stamp('orb',{x:source.x,y:source.y-47},28,260,0,{x:target.x,y:target.y-44});
  this.draw(260,(g,t)=>{
   const x=Phaser.Math.Linear(source.x,target.x,t),y=Phaser.Math.Linear(source.y-47,target.y-44,t)-Math.sin(Math.PI*t)*12;
   const a=Math.atan2(target.y-source.y,target.x-source.x),len=id===12?27:id===8?19:10;
   g.lineStyle(2,color,.92);g.lineBetween(x-Math.cos(a)*len,y-Math.sin(a)*len,x,y);
   if(id===8||id===12){g.fillStyle(color,1);g.fillTriangle(x+Math.cos(a)*5,y+Math.sin(a)*5,x+Math.sin(a)*3,y-Math.cos(a)*3,x-Math.sin(a)*3,y+Math.cos(a)*3);}
   else {g.fillStyle(color,.22);g.fillCircle(x,y,8);g.fillStyle(color,.9);g.fillCircle(x,y,3);}
  });
 }
 attack(id:number,source:FxPoint,target:FxPoint,ranged:boolean){
  if(ranged)this.projectile(source,target,id);
  else if(id===3||id===9){this.ring(target,colors[id],38,320);this.dust(target,colors[id],5);}
  else this.slash(source,target,colors[id],id===7||id===10?2:1);
 }
 skill(id:number,source:FxPoint,target:FxPoint,allies:FxPoint[],enemies:FxPoint[]){
  const color=colors[id]??0xe7d091;
  this.stamp('cast',{x:source.x,y:source.y-15},85,650);
  this.ring(source,color,80,650);
  switch(id){
   case 1:
    this.draw(640,(g,t)=>{const a=Math.sin(t*Math.PI),x=target.x,y=target.y-78;
     g.lineStyle(2.2,0xbfe4ff,a);g.beginPath();g.moveTo(x-24,y+12);g.lineTo(x-20,y-20);g.lineTo(x-8,y-8);g.lineTo(x,y-14);g.lineTo(x+8,y-8);g.lineTo(x+20,y-20);g.lineTo(x+24,y+12);g.lineTo(x,y+33);g.closePath();g.strokePath();g.fillStyle(0xe2f1ff,a);g.fillTriangle(x-13,y+1,x-5,y+3,x-8,y+6);g.fillTriangle(x+13,y+1,x+5,y+3,x+8,y+6);});
    this.slash(source,target,color,3);break;
   case 2:
    this.draw(1350,(g,t)=>{const r=56*Math.min(1,t*5),a=Math.min(1,t*5)*(1-t*.85);g.lineStyle(1,0xc8ebd8,a*.85);for(let i=0;i<8;i++){const ang=i*Math.PI/4;g.lineBetween(target.x,target.y,target.x+Math.cos(ang)*r,target.y+Math.sin(ang)*r*.5);}for(let k=1;k<=3;k++){g.beginPath();for(let j=0;j<=8;j++){const a=j*Math.PI/4,x=target.x+Math.cos(a)*r*k/3,y=target.y+Math.sin(a)*r*k/6;if(!j)g.moveTo(x,y);else g.lineTo(x,y);}g.strokePath();}});break;
   case 3:this.dust(target,0xc6a475,15);this.ring(target,color,110,650);this.shield(source);break;
   case 4:
    this.draw(950,(g,t)=>{g.lineStyle(3,color,Math.sin(t*Math.PI)*.8);g.beginPath();for(let i=0;i<24;i++){const p=i/23,x=source.x+Math.sin(p*Math.PI*3+t*9)*28,y=source.y-p*80;if(!i)g.moveTo(x,y);else g.lineTo(x,y);}g.strokePath();});break;
   case 5:this.projectile(source,target,5);this.draw(700,(g,t)=>{for(let i=0;i<5;i++){const p=(t+i*.07)%1,x=Phaser.Math.Linear(target.x,source.x,p),y=Phaser.Math.Linear(target.y,source.y,p)-Math.sin(p*Math.PI)*48;g.fillStyle(color,(1-t)*.7);g.fillCircle(x,y-35,3-i*.3);}});break;
   case 6:
    this.draw(1400,(g,t)=>{const points=[...allies,...enemies];for(const p of points)for(let i=0;i<(this.reduced?2:7);i++){const drop=(t*2+i*.17)%1,x=p.x+(i-3)*11,y=p.y-125+drop*126;g.lineStyle(1.5,0x99deda,Math.sin(t*Math.PI)*.65);g.lineBetween(x,y,x-5,y+14);}});for(const p of allies)this.heal(p);break;
   case 7:this.slash(source,target,0xf1aa89,3);this.ring(target,0xd98273,70,400);break;
   case 8:
    this.draw(700,(g,t)=>{const a=Math.sin(t*Math.PI),y=target.y-98;g.lineStyle(2,color,a);g.strokeEllipse(target.x-11,y,19,22);g.strokeEllipse(target.x+11,y,19,22);g.fillStyle(color,a);g.fillCircle(target.x-11,y,3);g.fillCircle(target.x+11,y,3);g.fillTriangle(target.x-4,y+8,target.x+4,y+8,target.x,y+15);});this.projectile(source,target,8);break;
   case 9:this.shield(source);this.ring(source,color,105,850);break;
   case 10:this.slash(source,target,color,3);break;
   case 11:
    this.draw(1150,(g,t)=>{const a=Math.sin(Math.PI*t);g.lineStyle(2,color,a);g.strokeRect(source.x-8,source.y-66,16,64);g.strokeTriangle(source.x-16,source.y-56,source.x+16,source.y-56,source.x,source.y-78);for(let i=0;i<3;i++){g.lineStyle(1.3,color,a*.6);g.strokeEllipse(source.x,source.y-16-i*18+t*9,55+i*12,12);}});for(const p of allies)this.ring(p,color,50,750,80);break;
   case 12:for(const p of enemies.slice(0,3))this.projectile(source,p,12);break;
   case 13:
    for(let i=0;i<3;i++)this.draw(640,(g,t)=>{const x=Phaser.Math.Linear(source.x,target.x,t),y=Phaser.Math.Linear(source.y-43,target.y-43,t);g.lineStyle(2.5,color,(1-t)*.8);g.strokeEllipse(x,y,12+t*54,24+t*82);},i*100);break;
   default:this.skillRecipe(id,source,target,allies,enemies);
  }
 }
 leap(source:FxPoint,target:FxPoint,color:number){
  this.draw(420,(g,t)=>{for(let i=0;i<6;i++){const p=Math.max(0,t-i*.05);const x=Phaser.Math.Linear(source.x,target.x,p),y=Phaser.Math.Linear(source.y,target.y,p)-60-Math.sin(Math.PI*p)*70;g.fillStyle(color,(1-t)*(.75-i*.11));g.fillCircle(x,y+20,4-i*.5);}});
 }
 nova(p:FxPoint,color:number,radius=95){this.ring(p,color,radius,700);this.ring(p,color,radius*.6,560,110);this.dust(p,color,9);}
 beam(source:FxPoint,target:FxPoint,color:number){
  const dx=target.x-source.x,dy=target.y-source.y,len=Math.hypot(dx,dy)||1,ex=source.x+dx/len*Math.max(len,320),ey=source.y+dy/len*Math.max(len,320);
  this.draw(520,(g,t)=>{const a=Math.sin(Math.PI*t);g.lineStyle(7*a,color,.25*a);g.lineBetween(source.x,source.y-44,ex,ey-44);g.lineStyle(2.5*a,color,.9*a);g.lineBetween(source.x,source.y-44,Phaser.Math.Linear(source.x,ex,Math.min(1,t*2)),Phaser.Math.Linear(source.y,ey,Math.min(1,t*2))-44);});
 }
 aura(p:FxPoint,color:number){
  this.draw(900,(g,t)=>{const a=Math.sin(Math.PI*t);for(let i=0;i<9;i++){const ang=i/9*Math.PI*2+t*2,x=p.x+Math.cos(ang)*34,y=p.y-20+Math.sin(ang)*12-t*70*((i%3)+1)/3;g.lineStyle(2,color,a*.75);g.lineBetween(x,y,x,y-14);}g.lineStyle(2,color,a*.5);g.strokeEllipse(p.x,p.y-48,80+t*30,120+t*30);});
 }
 summon(p:FxPoint,color:number){
  this.stamp('summon',{x:p.x,y:p.y-20},85,620);
  this.ring(p,color,46,520);
  this.draw(620,(g,t)=>{for(let i=0;i<7;i++){const a=i*.9+t*3,r=8+t*26;g.fillStyle(color,(1-t)*.8);g.fillCircle(p.x+Math.cos(a)*r,p.y-14+Math.sin(a)*r*.4-t*18,2);}});
 }
 revive(p:FxPoint){
  this.ring(p,0xf1e7a8,90,900);
  this.draw(1200,(g,t)=>{for(let i=0;i<14;i++){const a=i*.45+t*7,r=40*(1-t)+6,y=p.y-t*110+i*3;g.fillStyle(0xf3e6a5,Math.sin(Math.PI*t)*.85);g.fillCircle(p.x+Math.cos(a)*r,y-10+Math.sin(a)*r*.3,2.2);}});
 }
 night(points:FxPoint[]){
  this.draw(1500,(g,t)=>{const a=Math.sin(Math.PI*t);g.fillStyle(0x140f24,.42*a);g.fillEllipse(C.x,C.y,S.right-S.left+260,S.bottom-S.top+200);for(const p of points){g.lineStyle(1.5,0x9d8ad8,a*.8);g.strokeEllipse(p.x-9,p.y-100,14,9);g.strokeEllipse(p.x+9,p.y-100,14,9);}});
 }
 stampede(points:FxPoint[],color:number){
  for(let k=0;k<5;k++)this.draw(700,(g,t)=>{const y=S.top+k*(C.y-S.top)/4,x=Phaser.Math.Linear(S.left-120,S.right+120,t);g.fillStyle(color,(1-t)*.5);g.fillEllipse(x,y,90,26);g.fillStyle(color,(1-t)*.8);g.fillTriangle(x+40,y-10,x+64,y-22,x+50,y);},k*70);
  for(const p of points)this.dust(p,color,6);
 }
 private skillRecipe(id:number,source:FxPoint,target:FxPoint,allies:FxPoint[],enemies:FxPoint[]){
  const color=colors[id]??0xe7d091;
  for(const recipe of RECIPES[id]??['nova']){
   switch(recipe){
    case 'leap':this.leap(source,target,color);this.slash(source,target,color,1);break;
    case 'flurry':this.slash(source,target,color,3);break;
    case 'shield':this.shield(source);break;
    case 'allies':for(const p of allies){this.ring(p,color,46,700,60);}break;
    case 'heal':for(const p of allies)this.heal(p);break;
    case 'line':this.beam(source,target,color);break;
    case 'nova':this.nova(id===32||id===35||id===40||id===49?source:target,color);break;
    case 'volley':for(const p of enemies.slice(0,6))this.projectile(source,p,id);break;
    case 'aura':this.aura(source,color);break;
    case 'call':this.summon(source,color);break;
    case 'night':this.night(enemies);break;
    case 'stampede':this.stampede(enemies,color);break;
    case 'web':this.skill(2,source,target,allies,enemies);break;
    case 'totems':this.skill(11,source,target,allies,enemies);break;
    case 'swap':this.leap(source,target,color);this.shield(source);break;
    case 'mark':this.draw(700,(g,t)=>{const a=Math.sin(t*Math.PI),y=target.y-98;g.lineStyle(2,color,a);g.strokeCircle(target.x,y,11+t*4);g.lineBetween(target.x-17,y,target.x+17,y);g.lineBetween(target.x,y-17,target.x,y+17);});break;
   }
  }
 }
 /** A patron spirit answers: its glyph rises over the field with a wave in its color. */
 power(texture:string,color:number,allies:FxPoint[],enemies:FxPoint[]){
  if(this.sprites.size>=24)return;
  const image=this.scene.add.image(C.x,C.y-60,texture).setDepth(1150).setAlpha(0).setScale(.6);this.layer.add(image);
  const tween=this.scene.tweens.add({targets:image,alpha:{from:0,to:.85},scale:1.25,y:C.y-90,duration:this.reduced?200:520,yoyo:true,hold:this.reduced?100:380,ease:'Sine.easeOut',onComplete:()=>{this.sprites.delete(image);image.destroy();}});this.sprites.set(image,tween);
  this.draw(1100,(g,t)=>{const a=Math.sin(Math.PI*t);g.lineStyle(3,color,a*.7);g.strokeEllipse(C.x,C.y,200+t*700,90+t*320);g.fillStyle(color,a*.06);g.fillEllipse(C.x,C.y,200+t*700,90+t*320);});
  for(const p of [...allies,...enemies])this.ring(p,color,46,700,120);
 }
 clear(){for(const [image,tween]of this.sprites){tween.stop();image.destroy();}this.sprites.clear();for(const [g,tween] of this.active){tween.stop();g.destroy();}this.active.clear();}
}
