import Phaser from 'phaser';

export interface FxPoint { x: number; y: number }
const colors:Record<number,number>={1:0xb7dfff,2:0xaadcca,3:0xd2ac78,4:0xa4df72,5:0xe5bd74,6:0x84d9d0,7:0xe6a189,8:0xd5cdf6,9:0xb3d6aa,10:0xc4e984,11:0xf2d486,12:0xf4dfa0,13:0xc7a3ec};

/** Scene-only effects. They never apply damage or change simulation positions. */
export class CombatEffects {
 private active=new Map<Phaser.GameObjects.Graphics, Phaser.Tweens.Tween>();
 constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Layer,private reduced=false){}

 private draw(duration:number,paint:(g:Phaser.GameObjects.Graphics,t:number)=>void,delay=0){
  const g=this.scene.add.graphics().setDepth(1100);this.layer.add(g);
  const clock={t:0};
  const tween=this.scene.tweens.add({targets:clock,t:1,duration:this.reduced?Math.min(300,duration):duration,delay,
   onUpdate:()=>{g.clear();paint(g,clock.t);},onComplete:()=>{g.destroy();this.active.delete(g);}});
  this.active.set(g,tween);return g;
 }
 private ring(p:FxPoint,color:number,radius=42,duration=500,delay=0){
  this.draw(duration,(g,t)=>{g.lineStyle(2.5*(1-t)+.5,color,(1-t)*.8);g.strokeEllipse(p.x,p.y,radius*(.3+t*1.7),radius*(.15+t*.75));},delay);
 }
 dust(p:FxPoint,color=0xb8ab79,count=7){
  this.draw(520,(g,t)=>{for(let i=0;i<(this.reduced?2:count);i++){const a=i*2.399;const r=10+t*(17+i*3);g.fillStyle(color,(1-t)*.4);g.fillCircle(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.38-t*10,(2+i%3)*(1-t*.6));}});
 }
 hit(p:FxPoint,color=0xf6e1ad){
  this.draw(210,(g,t)=>{g.lineStyle(2,color,1-t);for(let i=0;i<5;i++){const a=i*1.256;const r=4+t*20;g.lineBetween(p.x+Math.cos(a)*r,p.y-42+Math.sin(a)*r,p.x+Math.cos(a)*(r+7),p.y-42+Math.sin(a)*(r+7));}});
 }
 heal(p:FxPoint){
  this.ring(p,0xa8e1ad,48,760);
  this.draw(850,(g,t)=>{for(let i=0;i<5;i++){const x=p.x+Math.sin(i*2.4)*22,y=p.y-12-i*10-t*40;g.lineStyle(2,0xb3e7b4,Math.sin(t*Math.PI)*.8);g.lineBetween(x-3,y,x+3,y);g.lineBetween(x,y-3,x,y+3);}});
 }
 shield(p:FxPoint){
  this.draw(720,(g,t)=>{const a=Math.sin(Math.PI*t);g.lineStyle(2,0xb7dcdf,a*.85);g.strokeEllipse(p.x,p.y-42,74,100);g.fillStyle(0x8fd5cc,a*.08);g.fillEllipse(p.x,p.y-42,74,100);for(let i=0;i<6;i++){const ang=i*Math.PI/3;g.fillStyle(0xd4eece,a*.9);g.fillCircle(p.x+Math.cos(ang)*37,p.y-42+Math.sin(ang)*50,2);}});
 }
 death(p:FxPoint,color:number){
  this.dust(p,0x9b927a,11);
  this.draw(950,(g,t)=>{for(let i=0;i<8;i++){g.fillStyle(color,Math.sin(t*Math.PI)*.6);g.fillCircle(p.x+Math.sin(i*2.4+t)*20,p.y-20-t*(25+i*6),1.2);}});
 }
 slash(source:FxPoint,target:FxPoint,color:number,count=1){
  const direction=target.x>=source.x?1:-1;
  for(let k=0;k<count;k++)this.draw(300,(g,t)=>{
   g.lineStyle(3*(1-t)+1,color,(1-t)*.85);
   const center={x:target.x+direction*(k-1)*6,y:target.y-43+k*4};
   g.beginPath();for(let j=0;j<12;j++){const a=(-1.3+t*.5)+j/11*1.85;const x=center.x+direction*Math.cos(a)*(27+k*4);const y=center.y+Math.sin(a)*(29+k*3);if(j===0)g.moveTo(x,y);else g.lineTo(x,y);}g.strokePath();
  },k*75);
 }
 projectile(source:FxPoint,target:FxPoint,id:number){
  const color=colors[id]??0xe6d5ae;
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
  }
 }
 clear(){for(const [g,tween] of this.active){tween.stop();g.destroy();}this.active.clear();}
}
