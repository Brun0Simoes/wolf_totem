import Phaser from 'phaser';
import type { Game } from '../game/simulation';
import { TERRITORIES } from '../game/settlement';

const POSITIONS:Record<string,[number,number]>={hearth:[600,365],grove:[280,335],river:[910,335],meadow:[380,555],marsh:[825,555],north:[410,145],ridge:[1050,550],ruins:[600,650],highlands:[770,145]};
const terrainColors={wood:0x30493b,food:0x4b5138,stone:0x3c494a,spirit:0x35454c};
/** Macro view: revealed land, owned routes and workers correspond to the persistent settlement. */
export class FrontierMap {
  readonly layer:Phaser.GameObjects.Layer;
  private ground:Phaser.GameObjects.Graphics;
  private actors:Phaser.GameObjects.Graphics;
  private entries=new Map<string,{label:Phaser.GameObjects.Text;status:Phaser.GameObjects.Text;icons:Phaser.GameObjects.Image[];post:Phaser.GameObjects.Image}>();
  constructor(private scene:Phaser.Scene,private game:Game,onTerritory:(id:string)=>void){
    this.layer=scene.add.layer().setDepth(2).setVisible(false);
    if(scene.textures.exists('frontier-terrain'))this.layer.add(scene.add.image(0,0,'frontier-terrain').setOrigin(0).setDisplaySize(1200,740).setDepth(-10));
    this.ground=scene.add.graphics();this.actors=scene.add.graphics().setDepth(900);this.layer.add([this.ground,this.actors]);
    for(const id of ['hearth',...TERRITORIES.map(t=>t.id)]){
      const [x,y]=POSITIONS[id],t=TERRITORIES.find(t=>t.id===id);
      const label=scene.add.text(x,y-60,t?.name??'CLAREIRA DO LOBO',{fontFamily:'Georgia, serif',fontSize:'16px',color:'#e4d6b2',backgroundColor:'#102423d9',padding:{x:7,y:4}}).setOrigin(.5).setDepth(800);
      const status=scene.add.text(x,y+56,'',{fontFamily:'Arial',fontSize:'10px',color:'#bdd3ae',backgroundColor:'#102423dd',padding:{x:5,y:3}}).setOrigin(.5).setDepth(800);
      const post=scene.add.image(x,y+34,'painted-props',id==='hearth'?'lumber':'totem').setOrigin(.5,1).setDisplaySize(id==='hearth'?112:59,id==='hearth'?114:86).setDepth(400);
      const icons:Array<Phaser.GameObjects.Image>=[];
      if(t)for(let n=0;n<3;n++){const key=t.resource==='wood'?'tree':t.resource==='stone'?'quarry':t.resource==='spirit'?'shrine':'hunt';icons.push(scene.add.image(x+(n-1)*47,y+5+n%2*8,'painted-props',key).setOrigin(.5,1).setDisplaySize(key==='tree'?55:40,key==='tree'?62:41).setDepth(300));}
      const zone=scene.add.zone(x,y,230,145).setInteractive({useHandCursor:true}).setDepth(850);zone.on('pointerdown',()=>onTerritory(id));
      this.layer.add([label,status,post,...icons,zone]);this.entries.set(id,{label,status,post,icons});
    }
  }
  update(time:number,reduced:boolean):void {
    if(!this.layer.visible)return;
    const s=this.game.state,v=s.settlement,g=this.ground;g.clear();if(!this.scene.textures.exists('frontier-terrain')){g.fillStyle(0x0d201f,1);g.fillRect(0,0,1200,740);}
    // Soil flecks make the map read as land, rather than a diagram of floating cards.
    for(let i=0;i<260;i++){g.fillStyle(i%3?0x426049:0x99a267,.1);g.fillCircle((i*193)%1200,(i*71)%740,1+i%3);}
    for(const id of ['hearth',...TERRITORIES.map(t=>t.id)]){
      const [x,y]=POSITIONS[id],t=TERRITORIES.find(t=>t.id===id),seen=v.discovered.includes(id),owned=v.claimed.includes(id),view=this.entries.get(id)!;
      const points=[[-135,-30],[-75,-85],[75,-85],[135,-30],[100,70],[-100,70]].map(([dx,dy])=>new Phaser.Math.Vector2(x+dx,y+dy));
      g.fillStyle(id==='hearth'?0x5b6443:seen?terrainColors[t!.resource]:0x102825,seen?.12:.94);g.fillPoints(points,true);
      g.lineStyle(2,owned?0xc3bb82:seen?0x60775f:0x28423b,owned?.65:.35);g.strokePoints(points,true);
      if(seen)for(let n=0;n<34;n++){g.lineStyle(1,0xa6b680,.12);const px=x-100+(n*71)%200,py=y-40+(n*17)%90;g.lineBetween(px,py,px+3,py-4);}
      const order=v.orders.find(o=>o.target===id&&['scout','claim'].includes(o.kind));
      view.icons.forEach(icon=>icon.setVisible(seen&&!owned));view.post.setVisible(owned);
      view.label.setColor(seen?'#e1d6b3':'#749285');
      view.status.setText(order?`${order.kind==='scout'?'RECONHECENDO':'CONSTRUINDO POSTO'} · ${Math.ceil(order.until-s.clock)}s`:id==='hearth'?`${v.citizens.length} ALDEÕES · ${Object.keys(v.sites).length} CONSTRUÇÕES`:owned?'POSTO AVANÇADO · TERRENO LIBERADO':seen?'RECONHECIDO · RECURSOS DESCOBERTOS':`NÉVOA DA MATA · ERA ${t!.era}`);
      if(owned&&id!=='hearth'){const parent=t!.neighbors.find(n=>v.claimed.includes(n))??'hearth',[px,py]=POSITIONS[parent];g.lineStyle(8,0xc4b581,.16);g.lineBetween(px,py,x,y);g.lineStyle(2,0xdfc384,.3);g.lineBetween(px,py,x,y);}
      if(!seen){g.fillStyle(0x92b7a4,.045);g.fillEllipse(x,y+4,250,120);g.fillEllipse(x+25,y-25,195,65);}
      if(order){const progress=Math.max(0,Math.min(1,(s.clock-order.started)/(order.until-order.started)));g.fillStyle(0x0c1717,.8);g.fillRoundedRect(x-63,y+77,126,5,2);g.fillStyle(0xdcc186,1);g.fillRoundedRect(x-63,y+77,126*progress,5,2);}
    }
    const a=this.actors;a.clear();
    for(const c of v.citizens){const mission=v.orders.find(o=>o.citizenId===c.id),from=POSITIONS.hearth,to=mission?POSITIONS[mission.target]:POSITIONS.hearth;const travel=mission?(s.clock-mission.started)/(mission.until-mission.started):0;
      const x=from[0]+(to[0]-from[0])*Math.min(1,travel)+(c.id%4-1.5)*11,y=from[1]+(to[1]-from[1])*Math.min(1,travel)+28+Math.floor(c.id/4)*5+(reduced?0:Math.sin(time/400+c.id)*2);
      a.fillStyle(mission?0xe2c98b:0xd0d7ac,1);a.fillCircle(x,y-5,3);a.fillTriangle(x-4,y+5,x+4,y+5,x,y-4);
    }
  }
}
