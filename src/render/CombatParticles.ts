import Phaser from 'phaser';
import { combatProfile, type WeaponStyle } from './combatProfiles';

export interface ParticlePoint {x:number;y:number}
type Brush='glow'|'spark'|'smoke'|'shard'|'feather'|'leaf'|'drop'|'arrow';
interface Particle {image:Phaser.GameObjects.Image;age:number;life:number;x:number;y:number;vx:number;vy:number;gravity:number;size:number;spin:number;angle:number;alpha:number;brush:Brush}
interface Missile {image:Phaser.GameObjects.Image;age:number;duration:number;from:ParticlePoint;target:()=>ParticlePoint;color:number;style:WeaponStyle}
interface Burst {brush?:Brush;count:number;color:number;life?:number;speed?:number;size?:number;gravity?:number;angle?:number;spread?:number;alpha?:number;ground?:boolean}

/** Bounded, recycled view objects. Particle clocks follow battle speed and pause. */
export class CombatParticles {
  private live:Particle[]=[];
  private free:Phaser.GameObjects.Image[]=[];
  private missiles:Missile[]=[];
  private seed=7341;
  private delayed:{left:number;run:()=>void}[]=[];
  reduced=false;
  get budget():number {return this.scene.scale.parentSize.width<600?120:240;}
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Layer){
    this.createBrushes();
  }
  private random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
  private createBrushes():void {
    for(const brush of ['glow','spark','smoke','shard','feather','leaf','drop','arrow'] as Brush[]){
      const key=`combat-brush-${brush}`;if(this.scene.textures.exists(key))continue;
      const texture=this.scene.textures.createCanvas(key,64,64);if(!texture)continue;
      const c=texture.context;c.translate(32,32);c.fillStyle='#ffffff';
      if(brush==='glow'||brush==='smoke'){
        const g=c.createRadialGradient(0,0,0,0,0,31);g.addColorStop(0,brush==='glow'?'#ffffffff':'#ffffff77');g.addColorStop(.25,'#ffffff77');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(-32,-32,64,64);
      }else if(brush==='spark'){c.beginPath();c.moveTo(-3,0);c.lineTo(0,-28);c.lineTo(3,0);c.lineTo(0,12);c.closePath();c.fill();}
      else if(brush==='arrow'){c.fillRect(-23,-1,40,2);c.beginPath();c.moveTo(28,0);c.lineTo(14,-5);c.lineTo(14,5);c.closePath();c.fill();c.fillRect(-24,-5,3,10);}
      else if(brush==='feather'||brush==='leaf'){c.beginPath();c.moveTo(0,-26);c.quadraticCurveTo(19,-4,0,25);c.quadraticCurveTo(-16,0,0,-26);c.fill();c.strokeStyle='#bac8c4';c.lineWidth=2;c.beginPath();c.moveTo(0,-23);c.lineTo(0,24);c.stroke();}
      else if(brush==='drop'){c.beginPath();c.moveTo(0,-26);c.bezierCurveTo(25,7,16,25,0,25);c.bezierCurveTo(-16,25,-25,7,0,-26);c.fill();}
      else{c.beginPath();c.moveTo(0,-26);c.lineTo(9,5);c.lineTo(-3,25);c.lineTo(-11,-7);c.closePath();c.fill();}
      texture.refresh();
    }
  }
  private image(brush:Brush):Phaser.GameObjects.Image {
    const image=this.free.pop()??this.scene.add.image(0,0,`combat-brush-${brush}`);
    image.setTexture(`combat-brush-${brush}`).setVisible(true).setOrigin(.5).setAlpha(1).setRotation(0).setFlip(false,false);this.layer.add(image);return image;
  }
  private recycle(image:Phaser.GameObjects.Image):void {image.setVisible(false);this.free.push(image);}
  burst(p:ParticlePoint,options:Burst):void {
    const count=Math.min(this.budget-this.live.length,this.reduced?Math.min(3,options.count):options.count);
    for(let i=0;i<count;i++){
      const brush=options.brush??'spark',image=this.image(brush),a=(options.angle??-Math.PI/2)+(this.random()-.5)*(options.spread??Math.PI*2);
      const speed=(options.speed??70)*(.35+this.random()*.65),size=(options.size??9)*(.65+this.random()*.7);
      image.setTint(options.color).setBlendMode(brush==='glow'||brush==='spark'?Phaser.BlendModes.ADD:Phaser.BlendModes.NORMAL).setDepth(options.ground?100:p.y+710).setPosition(p.x,p.y);
      this.live.push({image,brush,age:0,life:(options.life??.55)*(.8+this.random()*.35),x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,gravity:options.gravity??55,size,angle:a,spin:brush==='smoke'?0:(this.random()-.5)*5,alpha:options.alpha??.7});
    }
  }
  later(delay:number,run:()=>void):void {if(this.delayed.length<32)this.delayed.push({left:delay,run});}
  charge(p:ParticlePoint,id:number,seconds:number):void {
    const {color}=combatProfile(id);
    this.burst({x:p.x,y:p.y-38},{brush:'glow',count:2,color,life:seconds,size:27,speed:0,gravity:0,alpha:.35});
    for(let i=0;i<8;i++)this.later(seconds*i/10,()=>this.burst({x:p.x+Math.cos(i*2.4)*20,y:p.y-25+Math.sin(i*2.4)*10},{count:1,color,life:.22,speed:18,size:6,gravity:-100}));
  }
  footstep(p:ParticlePoint):void {this.burst(p,{brush:'smoke',count:3,color:0xc7b594,life:.45,size:17,speed:18,gravity:-6,alpha:.19,ground:true});}
  impact(p:ParticlePoint,id:number,intensity:number,magic=false,absorbed=0):void {
    const color=magic?combatProfile(id).color:0xffd8a0;
    this.burst({x:p.x,y:p.y-42},{count:Math.round(5+intensity*9),color,life:.22+intensity*.15,speed:75+intensity*65,size:6,gravity:140});
    this.burst({x:p.x,y:p.y-42},{brush:'glow',count:1,color,life:.14,size:27+intensity*15,speed:0,gravity:0,alpha:.42});
    if(absorbed>0)this.burst({x:p.x,y:p.y-35},{brush:'shard',count:4,color:0xa3dbe0,life:.38,size:7,speed:55,gravity:90});
    if(intensity>.6)this.footstep(p);
  }
  projectile(from:ParticlePoint,target:()=>ParticlePoint,id:number,seconds:number):void {
    if(this.missiles.length>=24)return;
    const profile=combatProfile(id),style=profile.weapon,brush=style==='bow'||style==='spear'?'arrow':'glow';
    const image=this.image(brush).setTint(profile.color).setDepth(1090).setBlendMode(brush==='glow'?Phaser.BlendModes.ADD:Phaser.BlendModes.NORMAL);
    this.missiles.push({image,age:0,duration:Math.max(.08,seconds),from:{x:from.x,y:from.y-45},target,color:profile.color,style});
  }
  spell(id:number,p:ParticlePoint,target:ParticlePoint,allies:ParticlePoint[],enemies:ParticlePoint[],stars=1):void {
    const profile=combatProfile(id),color=profile.color,amount=stars===3?1.3:stars===2?1.12:1;
    const burst=(point:ParticlePoint,brush:Brush,count:number,speed=90,gravity=40)=>this.burst(point,{brush,count:Math.round(count*amount),color,speed,gravity,life:.7,size:brush==='smoke'?35:10});
    switch(profile.spell){
      case 'silk':for(let i=0;i<3;i++)this.later(i*.12,()=>burst(target,'spark',8,45,-30));break;
      case 'venom':case 'sting':case 'swamp':burst({x:target.x,y:target.y-25},'drop',14,80,160);burst(target,'smoke',5,28,-25);break;
      case 'rain':for(const point of [...allies,...enemies].slice(0,12))for(let i=0;i<3;i++)this.later(i*.18,()=>this.burst({x:point.x,y:point.y-120},{brush:'drop',count:3,color,speed:170,angle:1.8,spread:.24,gravity:100,life:.7,size:7,alpha:.6}));break;
      case 'crow':case 'volley':case 'dive':burst({x:p.x,y:p.y-45},'feather',15,105,50);break;
      case 'leaf':case 'spring':for(const point of allies.slice(0,7))burst({x:point.x,y:point.y-25},'leaf',5,45,-25);break;
      case 'frost':for(const point of enemies.slice(0,9))burst(point,'shard',9,70,-60);burst(p,'smoke',8,30,-8);break;
      case 'sun':case 'eclipse':burst({x:p.x,y:p.y-55},'spark',26,140,-35);break;
      case 'night':for(const point of enemies.slice(0,9))burst({x:point.x,y:point.y-60},'smoke',4,22,-25);break;
      case 'charge':case 'wall':case 'storm':case 'domain':case 'grapple':burst(target,'smoke',12,75,-10);burst(target,'shard',7,100,200);break;
      case 'moon':case 'revive':case 'avatar':burst({x:p.x,y:p.y-40},'spark',20,70,-70);break;
      case 'hunt':case 'leap':case 'flurry':burst({x:target.x,y:target.y-42},'spark',15,150,55);break;
      case 'guard':case 'shell':burst({x:p.x,y:p.y-42},'shard',12,50,-15);break;
      case 'drain':for(let i=0;i<5;i++)this.later(i*.09,()=>this.projectile(target,()=>p,id,.23));break;
      case 'beam':case 'echo':case 'gaze':burst({x:target.x,y:target.y-42},'glow',4,15,-10);break;
      case 'totem':for(const point of allies.slice(0,7))burst(point,'spark',5,35,-95);break;
      case 'tide':burst(target,'drop',20,75,-15);break;
    }
  }
  update(seconds:number):void {
    if(seconds<=0)return;const dt=Math.min(.3,seconds);
    const waiting=this.delayed;this.delayed=[];for(const task of waiting){task.left-=dt;if(task.left<=0)task.run();else this.delayed.push(task);}
    this.live=this.live.filter(p=>{
      p.age+=dt;if(p.age>=p.life){this.recycle(p.image);return false;}
      const t=p.age/p.life;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;
      p.image.setPosition(p.x,p.y).setRotation(p.angle).setDisplaySize(p.size*(p.brush==='smoke'?1+t:1-t*.55),p.size*(p.brush==='spark'?2.3:1)*(p.brush==='smoke'?1+t:1-t*.4)).setAlpha(p.alpha*Math.min(1,t*12)*Math.pow(1-t,1.3));return true;
    });
    this.missiles=this.missiles.filter(m=>{
      m.age+=dt;const t=Math.min(1,m.age/m.duration),target=m.target();
      const x=Phaser.Math.Linear(m.from.x,target.x,t),y=Phaser.Math.Linear(m.from.y,target.y-42,t)-Math.sin(t*Math.PI)*(m.style==='bow'?12:3);
      const angle=Math.atan2(target.y-42-m.from.y,target.x-m.from.x);m.image.setPosition(x,y).setRotation(angle).setDisplaySize(m.style==='bow'||m.style==='spear'?27:18,m.style==='bow'||m.style==='spear'?8:18);
      if(!this.reduced)this.burst({x,y},{brush:'glow',count:1,color:m.color,life:.14,size:8,speed:0,gravity:0,alpha:.3});
      if(t>=1){this.recycle(m.image);return false;}return true;
    });
  }
  clear():void {for(const p of this.live)this.recycle(p.image);for(const m of this.missiles)this.recycle(m.image);this.live=[];this.missiles=[];this.delayed=[];}
  destroy():void {this.clear();for(const image of this.free)image.destroy();this.free=[];}
}
