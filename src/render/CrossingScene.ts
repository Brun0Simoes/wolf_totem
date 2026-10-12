import Phaser from 'phaser';
import { animationSheets,frameRect } from './animationAssets';
import { createMotion,advanceMotion,frameForMotion,type SheetDefinition } from './animationModel';
import { routeOf,pointDistance,NODE_NAMES,type CrossingRun,type Point } from '../game/crossings';
import { CROSSING_START,MAP_WIDTH,MAP_HEIGHT } from '../game/crossingLayout';
import { canStand,mapCell,mapPath,moveOnMap,nearestWalkable } from '../game/crossingMap';
import { createCrossingEnvironment } from './CrossingEnvironment';

export function createCrossingWorld(parent:HTMLElement,getRun:()=>CrossingRun|null,callbacks:{
  position:(x:number,y:number)=>void;arrived:()=>void;interact:()=>void;enabled:()=>boolean;reduced:()=>boolean;feedback:(message:string)=>void;
}):{travel:()=>void;zoom:(direction:number)=>void;center:()=>void;destroy:()=>void}{
  let scene:CrossingScene|undefined;
  class CrossingScene extends Phaser.Scene {
    private trail!:Phaser.GameObjects.Graphics;
    private pins!:Phaser.GameObjects.Graphics;
    private shadow!:Phaser.GameObjects.Ellipse;
    private sprite!:Phaser.GameObjects.Sprite;
    private environment!:ReturnType<typeof createCrossingEnvironment>;
    private labels:Phaser.GameObjects.Text[]=[];
    private sheets=new Map<number,SheetDefinition>();
    private motion=createMotion(1);
    private keys!:Record<string,Phaser.Input.Keyboard.Key>;
    private runIdentity:CrossingRun|null=null;
    private position:Point={...CROSSING_START};
    private targets:Point[]=[];
    private clock=0;
    private zoomLevel=1;
    private destination:Point|null=null;
    private ping:Point|null=null;
    private pingTime=0;
    constructor(){super('CrossingIgarape');}
    preload(){for(const id of [1,2,3]){const sheet=animationSheets.get(`${id}:1`);if(sheet){this.sheets.set(id,sheet);this.load.image(`cross-guide-${id}`,sheet.image);}}}
    create(){
      scene=this;this.environment=createCrossingEnvironment(this);
      this.trail=this.add.graphics().setDepth(-3);this.pins=this.add.graphics().setDepth(1450);
      for(const [id,sheet]of this.sheets){const texture=this.textures.get(`cross-guide-${id}`);for(let i=0;i<sheet.columns*sheet.rows;i++){const r=frameRect(sheet,i);texture.add(i,0,r.x,r.y,r.width,r.height);}}
      this.shadow=this.add.ellipse(0,0,46,14,0x081b12,.42);
      this.sprite=this.add.sprite(CROSSING_START.x,CROSSING_START.y,'cross-guide-1',0).setOrigin(.5,1);
      this.fitCamera();this.scale.on('resize',()=>this.fitCamera());
      this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE',false) as Record<string,Phaser.Input.Keyboard.Key>;
      this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
        const run=getRun();if(!run||run.mode!=='explore'||!callbacks.enabled())return;
        const target=routeOf(run.route).points[run.node],clicked={x:p.worldX,y:p.worldY};
        if(pointDistance(clicked,target)<58){if(pointDistance(this.position,target)<115)callbacks.interact();else this.travel();return;}
        if(!canStand(clicked)){this.ping=clicked;this.pingTime=this.clock;callbacks.feedback(mapCell(clicked)?.terrain==='water'?'Água profunda. Atravesse pelas pontes.':'Esse trecho está bloqueado. Escolha uma área livre.');return;}
        this.navigate(clicked);
      });
      this.game.canvas.setAttribute('role','img');this.game.canvas.setAttribute('aria-label','Mapa do Igarapé: terreno, rio, pontes e ruínas. Clique em uma área livre para caminhar, ou use WASD e setas.');
    }
    private fitCamera(){
      const width=this.scale.width,height=this.scale.height,mobile=width<650;
      const base=mobile?Math.max(width/740,height/850):Math.max(width/MAP_WIDTH,height/MAP_HEIGHT);
      this.cameras.main.setBounds(0,0,MAP_WIDTH,MAP_HEIGHT).setZoom(base*this.zoomLevel);
      if(getRun())this.cameras.main.startFollow(this.sprite,true,.12,.12,0,70);
      else{this.cameras.main.stopFollow();this.cameras.main.centerOn(MAP_WIDTH/2,MAP_HEIGHT/2);}
    }
    zoom(direction:number){this.zoomLevel=Phaser.Math.Clamp(this.zoomLevel+direction*.2,.8,1.8);this.fitCamera();}
    center(){this.zoomLevel=1;this.fitCamera();if(getRun())this.cameras.main.centerOn(this.position.x,this.position.y-70);}
    private navigate(target:Point){
      const path=mapPath(this.position,target);if(!path.length){callbacks.feedback('Não há uma passagem livre até esse ponto.');return;}
      this.targets=path;this.destination=path[path.length-1];
    }
    travel(){const run=getRun();if(!run||run.mode!=='explore'||!callbacks.enabled())return;this.navigate(routeOf(run.route).points[run.node]);}
    update(_time:number,delta:number){
      if(!parent.offsetWidth||!parent.offsetHeight||!this.sprite)return;
      const run=getRun(),visible=!!run,dt=Math.min(.05,delta/1000);
      if(callbacks.enabled())this.clock+=dt;this.environment.update(this.clock,run?this.position:undefined,callbacks.reduced());
      this.sprite.setVisible(visible);this.shadow.setVisible(visible);this.pins.clear();this.trail.clear();this.labels.forEach(t=>t.setVisible(false));
      if(!run)return;
      if(run!==this.runIdentity){this.runIdentity=run;this.position=nearestWalkable(run.position);this.targets=[];this.destination=null;this.motion=createMotion(run.guide);this.sprite.setPosition(this.position.x,this.position.y);this.fitCamera();this.cameras.main.centerOn(this.position.x,this.position.y-70);}
      const enabled=callbacks.enabled()&&run.mode==='explore';let dx=0,dy=0,arrived=false;const before={...this.position};
      if(enabled){
        const k=this.keys;dx=Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown);dy=Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown);
        if(dx||dy){this.targets=[];this.destination=null;const length=Math.hypot(dx,dy);this.position=moveOnMap(this.position,{x:this.position.x+dx/length*200*dt,y:this.position.y+dy/length*200*dt});}
        else if(this.targets.length){
          const target=this.targets[0],length=pointDistance(this.position,target),step=200*dt;dx=target.x-this.position.x;dy=target.y-this.position.y;
          const next=length<=step?target:{x:this.position.x+dx/length*step,y:this.position.y+dy/length*step};this.position=moveOnMap(this.position,next);
          if(pointDistance(this.position,target)<1){this.targets.shift();if(!this.targets.length){arrived=true;this.destination=null;}}
          else if(pointDistance(before,this.position)<.01){this.targets=[];this.destination=null;}
        }
        if(pointDistance(before,this.position)>.01)callbacks.position(this.position.x,this.position.y);
        if(arrived)callbacks.arrived();const space=Phaser.Input.Keyboard.JustDown(k.SPACE);
        if(Phaser.Input.Keyboard.JustDown(k.E)||(space&&!document.activeElement?.closest('button')))callbacks.interact();
      }else{this.targets=[];this.destination=null;}
      const sheet=this.sheets.get(run.guide)!;advanceMotion(this.motion,pointDistance(before,this.position)>.01?'walk':'idle',enabled?dt:0,dx);
      const frame=frameForMotion(this.motion,sheet,callbacks.reduced()),anchor=sheet.frameAnchors?.[frame]??{x:sheet.anchorX,y:sheet.anchorY},rect=frameRect(sheet,frame);
      this.sprite.setTexture(`cross-guide-${run.guide}`,frame).setOrigin(anchor.x/rect.width,anchor.y/rect.height).setScale(82/sheet.bodyHeight).setFlipX(this.motion.facing<0).setPosition(this.position.x,this.position.y).setDepth(this.position.y+1);
      this.shadow.setPosition(this.position.x,this.position.y-4).setDepth(this.position.y-1);
      for(let i=0;i<this.targets.length;i+=2){const p=this.targets[i];this.trail.fillStyle(0xe8cd91,.5).fillCircle(p.x,p.y,2.8);}
      if(this.destination)this.pins.lineStyle(2,0xead19b,.8).strokeEllipse(this.destination.x,this.destination.y,28,16);
      const points=routeOf(run.route).points,current=points[Math.min(5,run.node)];this.pins.lineStyle(2,0xf4d59a,.3).strokeEllipse(current.x,current.y,105+Math.sin(this.clock*2)*5,57);
      for(let i=0;i<6;i++){
        const p=points[i],markerY=Math.max(22,p.y-92),done=i<run.node,active=i===run.node,color=active?0xf3dba0:done?0x9bbe95:0x76917c;
        this.pins.fillStyle(0x183a2a,.9).fillCircle(p.x,markerY,active?17:13);this.pins.lineStyle(active?2:1,color,.9).strokeCircle(p.x,markerY,active?17:13);
        if(!this.labels[i])this.labels[i]=this.add.text(p.x,markerY,'',{fontFamily:'Georgia,serif',fontSize:'15px',color:'#e8d7ae',stroke:'#183327',strokeThickness:3}).setOrigin(.5).setDepth(1500);
        this.labels[i].setVisible(true).setPosition(p.x,markerY).setText(done?'✓':String(i+1)).setAlpha(i<=run.node?1:.65);
      }
      if(this.ping&&this.clock-this.pingTime<1)this.pins.lineStyle(2,0xdf9875,1-(this.clock-this.pingTime)).strokeEllipse(this.ping.x,this.ping.y,30+(this.clock-this.pingTime)*28,18);
      this.game.canvas.setAttribute('aria-label',`Igarapé: ${NODE_NAMES[Math.min(run.node,5)]}, marco ${Math.min(run.node+1,6)} de 6. Clique no terreno livre para explorar. Pontes permitem atravessar o rio.`);
    }
  }
  const renderer=new Phaser.Game({type:Phaser.AUTO,parent,width:Math.max(1,parent.clientWidth),height:Math.max(1,parent.clientHeight),backgroundColor:'#1e3227',scene:CrossingScene,
    scale:{mode:Phaser.Scale.NONE,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,powerPreference:'low-power'},audio:{noAudio:true},fps:{target:45}});
  const resize=new ResizeObserver(()=>{const width=parent.clientWidth,height=parent.clientHeight;if(width>0&&height>0&&renderer.isBooted&&(renderer.scale.width!==width||renderer.scale.height!==height))renderer.scale.resize(width,height);});resize.observe(parent);
  return {travel:()=>scene?.travel(),zoom:direction=>scene?.zoom(direction),center:()=>scene?.center(),destroy:()=>{resize.disconnect();renderer.destroy(true);}};
}
