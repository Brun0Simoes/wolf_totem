import Phaser from 'phaser';
import { animationSheets, assetUrl, frameRect } from './animationAssets';
import { createMotion, advanceMotion, frameForMotion, type SheetDefinition } from './animationModel';
import { crossingPath, routeOf, pathProjection, pointDistance, NODE_NAMES, type CrossingRun, type Point } from '../game/crossings';

export function createCrossingWorld(parent:HTMLElement,getRun:()=>CrossingRun|null,callbacks:{
  position:(x:number,y:number)=>void; arrived:()=>void; interact:()=>void; enabled:()=>boolean; reduced:()=>boolean;
}):{travel:()=>void;destroy:()=>void} {
  let scene:CrossingScene|undefined;
  class CrossingScene extends Phaser.Scene {
    private path!:Phaser.GameObjects.Graphics;
    private pins!:Phaser.GameObjects.Graphics;
    private glow!:Phaser.GameObjects.Graphics;
    private shadow!:Phaser.GameObjects.Ellipse;
    private sprite!:Phaser.GameObjects.Sprite;
    private labels:Phaser.GameObjects.Text[]=[];
    private sheets=new Map<number,SheetDefinition>();
    private motion=createMotion(1);
    private keys!:Record<string,Phaser.Input.Keyboard.Key>;
    private runIdentity:CrossingRun|null=null;
    private position:Point={x:760,y:830};
    private targets:Point[]=[];
    private clock=0;
    constructor(){super('CrossingIgarape');}
    preload(){
      this.load.image('igarape',assetUrl('/assets/travessias/igarape.webp'));
      for(const id of [1,2,3]){const sheet=animationSheets.get(`${id}:1`);if(sheet){this.sheets.set(id,sheet);this.load.image(`cross-guide-${id}`,sheet.image);}}
    }
    create(){
      scene=this;
      this.add.image(0,0,'igarape').setOrigin(0).setDisplaySize(1536,1024);
      this.add.rectangle(0,0,1536,1024,0x10241b,.13).setOrigin(0);
      this.path=this.add.graphics();this.glow=this.add.graphics();this.pins=this.add.graphics();
      for(const [id,sheet]of this.sheets){const texture=this.textures.get(`cross-guide-${id}`);for(let i=0;i<sheet.columns*sheet.rows;i++){const r=frameRect(sheet,i);texture.add(i,0,r.x,r.y,r.width,r.height);}}
      this.shadow=this.add.ellipse(0,0,54,17,0x04100b,.46);
      this.sprite=this.add.sprite(760,830,'cross-guide-1',0).setOrigin(.5,1);
      const camera=()=>{const width=this.scale.width,height=this.scale.height,mobile=width<650;this.cameras.main.setBounds(0,0,1536,1024).setZoom(mobile?Math.max(width/750,height/850):Math.max(width/1536,height/1024));this.cameras.main.startFollow(this.sprite,true,.12,.12,0,80);};
      camera();this.scale.on('resize',camera);
      this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE',false) as Record<string,Phaser.Input.Keyboard.Key>;
      this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
        const run=getRun();if(!run||run.mode!=='explore'||!callbacks.enabled())return;
        const target=routeOf(run.route).points[run.node];
        if(pointDistance({x:p.worldX,y:p.worldY},target)<95&&pointDistance(this.position,target)<115)callbacks.interact();
        else this.travel();
      });
      this.game.canvas.setAttribute('role','img');
      this.game.canvas.setAttribute('aria-label','Mapa explorável do Igarapé. Use WASD, setas ou o botão Ir até o marco. E investiga uma pista próxima.');
    }
    travel(){
      const run=getRun();if(!run||run.mode!=='explore'||!callbacks.enabled())return;
      const path=crossingPath(run).slice(0,run.node+2);
      // Walk along authored paths, including intermediate landmarks.
      const closest=pathProjection(this.position,path);
      let best=Infinity,start=0;
      for(let i=1;i<path.length;i++){const projection=pathProjection(closest,[path[i-1],path[i]]);const d=pointDistance(closest,projection);if(d<best){best=d;start=i;}}
      this.targets=path.slice(start).map(p=>({...p}));
    }
    update(_time:number,delta:number){
      if(!parent.offsetWidth||!parent.offsetHeight)return;
      const run=getRun(),visible=!!run;
      this.sprite.setVisible(visible);this.shadow.setVisible(visible);
      if(!run)return;
      if(run!==this.runIdentity){this.runIdentity=run;this.position={...run.position};this.targets=[];this.motion=createMotion(run.guide);this.sprite.setPosition(this.position.x,this.position.y);this.cameras.main.centerOn(this.position.x,this.position.y-80);}
      const dt=Math.min(.05,delta/1000),enabled=callbacks.enabled()&&run.mode==='explore';
      if(enabled)this.clock+=dt;
      let dx=0,dy=0;
      if(enabled){
        const k=this.keys;dx=Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown);dy=Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown);
        if(dx||dy){this.targets=[];const length=Math.hypot(dx,dy);const p=pathProjection({x:this.position.x+dx/length*190*dt,y:this.position.y+dy/length*190*dt},crossingPath(run).slice(0,run.node+2));this.position=p;}
        else if(this.targets.length){const target=this.targets[0],length=pointDistance(this.position,target),step=190*dt;dx=target.x-this.position.x;dy=target.y-this.position.y;
          if(length<=step){this.position={...target};this.targets.shift();if(!this.targets.length)callbacks.arrived();}
          else {this.position.x+=dx/length*step;this.position.y+=dy/length*step;}}
        callbacks.position(this.position.x,this.position.y);
        const space=Phaser.Input.Keyboard.JustDown(k.SPACE);
        if(Phaser.Input.Keyboard.JustDown(k.E)||(space&&!document.activeElement?.closest('button')))callbacks.interact();
      }else this.targets=[];
      const sheet=this.sheets.get(run.guide)!;
      advanceMotion(this.motion,(dx||dy)&&enabled?'walk':'idle',enabled?dt:0,dx);
      const frame=frameForMotion(this.motion,sheet,callbacks.reduced()),anchor=sheet.frameAnchors?.[frame]??{x:sheet.anchorX,y:sheet.anchorY},rect=frameRect(sheet,frame);
      this.sprite.setTexture(`cross-guide-${run.guide}`,frame).setOrigin(anchor.x/rect.width,anchor.y/rect.height).setScale(88/sheet.bodyHeight).setFlipX(this.motion.facing<0).setPosition(this.position.x,this.position.y);
      this.shadow.setPosition(this.position.x,this.position.y-5);
      const path=crossingPath(run),points=routeOf(run.route).points;
      this.path.clear().lineStyle(6,0x132d20,.72).beginPath().moveTo(path[0].x,path[0].y);
      path.slice(1).forEach(p=>this.path.lineTo(p.x,p.y));this.path.strokePath();
      this.path.lineStyle(2,0xd3bb79,.65).beginPath().moveTo(path[0].x,path[0].y);path.slice(1).forEach(p=>this.path.lineTo(p.x,p.y));this.path.strokePath();
      this.pins.clear();this.glow.clear();
      const current=points[Math.min(5,run.node)];
      this.glow.fillStyle(0xe8d18a,.08).fillCircle(current.x,current.y,75+Math.sin(this.clock*2)*6);
      this.glow.lineStyle(2,0xf5dea0,.5).strokeCircle(current.x,current.y,53);
      for(let i=0;i<6;i++){
        const p=points[i],done=i<run.node,active=i===run.node,color=active?0xf6dfa2:done?0x92c5a1:0x94a798;
        this.pins.fillStyle(0x09261e,active?.94:.72).fillCircle(p.x,p.y,active?27:19);
        this.pins.lineStyle(active?3:1,color,active?1:.75).strokeCircle(p.x,p.y,active?27:19);
        if(!this.labels[i])this.labels[i]=this.add.text(p.x,p.y,String(i+1),{fontFamily:'Georgia,serif',fontSize:'19px',color:'#ecdfb9',stroke:'#17342a',strokeThickness:3}).setOrigin(.5);
        this.labels[i].setPosition(p.x,p.y).setText(done?'✓':String(i+1)).setAlpha(i<=run.node?1:.7);
      }
      this.game.canvas.setAttribute('aria-label',`Igarapé, ${NODE_NAMES[Math.min(run.node,5)]}. Marco ${Math.min(run.node+1,6)} de 6. Use o botão contextual para caminhar ou investigar.`);
    }
  }
  const renderer=new Phaser.Game({type:Phaser.AUTO,parent,width:Math.max(1,parent.clientWidth),height:Math.max(1,parent.clientHeight),backgroundColor:'#0e201a',transparent:false,scene:CrossingScene,
    scale:{mode:Phaser.Scale.NONE,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,powerPreference:'low-power'},audio:{noAudio:true},fps:{target:45}});
  // Hidden tabs have zero bounds. Keep the last valid GPU size until the map is visible again.
  const resize=new ResizeObserver(()=>{const width=parent.clientWidth,height=parent.clientHeight;if(width>0&&height>0&&renderer.isBooted&&(renderer.scale.width!==width||renderer.scale.height!==height))renderer.scale.resize(width,height);});
  resize.observe(parent);
  return {travel:()=>scene?.travel(),destroy:()=>{resize.disconnect();renderer.destroy(true);}};
}
