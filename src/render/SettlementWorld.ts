import Phaser from 'phaser';
import type { Game } from '../game/simulation';
import { INFRASTRUCTURE, TERRITORIES, villagePlots, type InfrastructureId } from '../game/settlement';

const JOB_POINTS={wood:[360,335],food:[810,360],stone:[864,490],spirit:[410,480],builder:[535,290],idle:[620,475]} satisfies Record<string,number[]>;
const JOB_COLORS={wood:0xd9b479,food:0xb6d78a,stone:0xadd1dc,spirit:0xc3a7ed,builder:0xefb788,idle:0xd3d6c4};

/** Living settlement view. All commands return to Game; no economic rules live here. */
export class SettlementWorld {
  private territories=new Map<string,{ring:Phaser.GameObjects.Ellipse;label:Phaser.GameObjects.Text;status:Phaser.GameObjects.Text;post:Phaser.GameObjects.Image}>();
  private plots=new Map<string,{zone:Phaser.GameObjects.Zone;marker:Phaser.GameObjects.Graphics;label:Phaser.GameObjects.Text;image?:Phaser.GameObjects.Image;type?:string}>();
  private citizens=new Map<number,{body:Phaser.GameObjects.Graphics;zone:Phaser.GameObjects.Zone}>();
  private works:Phaser.GameObjects.Graphics;
  private placement:InfrastructureId|null=null;
  private selected:number|null=null;
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Layer,private game:Game,private onTerritory:(id:string)=>void,private onPlot:(id:string)=>void,private onCitizen:(id:number)=>void) {
    this.works=scene.add.graphics().setDepth(990);layer.add(this.works);
    for(const t of TERRITORIES){
      const ring=scene.add.ellipse(t.x,t.y,124,59,0x0c191c,.86).setStrokeStyle(1,0x739088,.55).setDepth(t.y+170);
      const label=scene.add.text(t.x,t.y-8,t.name.toUpperCase(),{fontFamily:'Arial',fontSize:'10px',color:'#c3d4c8'}).setOrigin(.5).setDepth(t.y+172);
      const status=scene.add.text(t.x,t.y+9,'MATA NÃO RECONHECIDA',{fontFamily:'Arial',fontSize:'8px',color:'#879d92'}).setOrigin(.5).setDepth(t.y+172);
      const zone=scene.add.zone(t.x,t.y,140,65).setInteractive({useHandCursor:true}).setDepth(t.y+173);
      zone.on('pointerdown',()=>this.onTerritory(t.id));
      zone.on('pointerover',()=>ring.setStrokeStyle(2,0xe2bf83,.9));
      const post=scene.add.image(t.x,t.y-22,'painted-props','totem').setOrigin(.5,1).setDisplaySize(58,75).setDepth(t.y+10).setVisible(false);
      layer.add([ring,label,status,zone,post]);this.territories.set(t.id,{ring,label,status,post});
    }
  }
  setPlacement(id:InfrastructureId|null):void {this.placement=id;}
  selectCitizen(id:number|null):void {this.selected=id;}
  update(time:number,reduced:boolean):void {
    const s=this.game.state,v=s.settlement;
    this.works.clear();
    for(const t of TERRITORIES){const view=this.territories.get(t.id)!,owned=v.claimed.includes(t.id),seen=v.discovered.includes(t.id),order=v.orders.find(o=>o.target===t.id&&(o.kind==='claim'||o.kind==='scout'));
      const color=owned?0xb1d395:seen?0xd9b479:0x739088;
      view.ring.setStrokeStyle(1.5,color,owned?.9:.5).setFillStyle(owned?0x203a2b:0x0c191c,.88);view.label.setColor(owned?'#d8e8bd':seen?'#e2c99e':'#9faea2');view.post.setVisible(owned);
      view.status.setText(order?`${order.kind==='scout'?'RECONHECENDO':'ERGUENDO POSTO'} · ${Math.max(0,Math.ceil(order.until-s.clock))}s`:owned?'POSTO DA TRIBO · + PRODUÇÃO':seen?'RECONHECIDO · ESTABELECER POSTO':'MATA NÃO RECONHECIDA');
      if(owned){this.works.lineStyle(1,0xb1d395,.16);this.works.lineBetween(610,430,t.x,t.y);}
    }
    const currentPlots=villagePlots(s),plotIds=new Set(currentPlots.map(p=>p.id));
    for(const [id,view]of this.plots)if(!plotIds.has(id)){view.zone.destroy();view.marker.destroy();view.label.destroy();view.image?.destroy();this.plots.delete(id);}
    for(const p of currentPlots) {
      if(!this.plots.has(p.id)){
        const marker=this.scene.add.graphics().setDepth(p.y-4),label=this.scene.add.text(p.x,p.y+17,'',{fontFamily:'Arial',fontSize:'9px',color:'#e9cc97'}).setOrigin(.5).setDepth(1010);
        const zone=this.scene.add.zone(p.x,p.y-10,85,78).setDepth(p.y+260).setInteractive({useHandCursor:true});zone.on('pointerdown',()=>this.onPlot(p.id));
        this.layer.add([marker,label,zone]);this.plots.set(p.id,{marker,label,zone});
      }
      const view=this.plots.get(p.id)!,type=v.sites[p.id],order=v.orders.find(o=>o.plot===p.id);view.marker.clear();
      if(!type&&view.image){view.image.destroy();view.image=undefined;view.type=undefined;}
      view.zone.input!.enabled=!!type||!!this.placement;
      view.label.setVisible(!!type||!!order||!!this.placement);
      if(type&&view.type!==type){view.image?.destroy();const frame=type==='watchtower'?'totem':type==='housing'||type==='farm'?'hunt':'lumber';view.image=this.scene.add.image(p.x,p.y,'painted-props',frame).setOrigin(.5,1).setDisplaySize(type==='watchtower'?52:77,type==='watchtower'?98:80).setDepth(p.y);this.layer.add(view.image);view.type=type;}
      if(type==='farm'){view.marker.lineStyle(4,0x91b262,.7);for(let n=0;n<5;n++)view.marker.lineBetween(p.x-46+n*14,p.y+7,p.x-24+n*14,p.y-8);}
      if(!type&&(this.placement||order)){view.marker.lineStyle(2,order?0xe9b984:0xd9c68f,.8);view.marker.strokeEllipse(p.x,p.y,76,35);view.marker.lineBetween(p.x-26,p.y-8,p.x+26,p.y+8);view.marker.lineBetween(p.x-26,p.y+8,p.x+26,p.y-8);}
      view.label.setText(type?INFRASTRUCTURE[type].name:order?`OBRA · ${Math.ceil(order.until-s.clock)}s`:'TERRENO LIVRE');
      if(order){this.works.fillStyle(0x112426,.85);this.works.fillRect(p.x-30,p.y+28,60,5);this.works.fillStyle(0xe5c394,1);this.works.fillRect(p.x-30,p.y+28,60*Math.min(1,(s.clock-order.started)/(order.until-order.started)),5);}
    }
    const live=new Set(v.citizens.map(c=>c.id));for(const [id,view]of this.citizens)if(!live.has(id)){view.body.destroy();view.zone.destroy();this.citizens.delete(id);}
    for(const citizen of v.citizens){
      if(!this.citizens.has(citizen.id)){const body=this.scene.add.graphics(),zone=this.scene.add.zone(0,0,28,38).setInteractive({useHandCursor:true});zone.on('pointerdown',()=>this.onCitizen(citizen.id));this.layer.add([body,zone]);this.citizens.set(citizen.id,{body,zone});}
      const view=this.citizens.get(citizen.id)!,mission=v.orders.find(o=>o.citizenId===citizen.id),work=v.orders.filter(o=>['building','infrastructure','claim'].includes(o.kind)),goal=mission?territoryByMission(mission.target):citizen.job==='builder'&&work.length?orderPoint(work[(citizen.id-1)%work.length],s):JOB_POINTS[citizen.job];
      const phase=(time/1000+citizen.id*2.7)%16;
      const travel=reduced?1:phase<5?phase/5:phase<11?1:1-(phase-11)/5;
      const offset=(citizen.id%4)*9,x=610+(goal[0]+offset-610)*travel,y=458+(goal[1]+offset*.4-458)*travel;
      const g=view.body;g.clear();g.setDepth(y+5);view.zone.setPosition(x,y-14).setDepth(y+120);
      g.fillStyle(0x081012,.4);g.fillEllipse(x,y+2,21,8);
      if(this.selected===citizen.id){g.lineStyle(2,0xffdb99,1);g.strokeEllipse(x,y+1,28,12);}
      const bob=reduced?0:Math.sin(phase*7)*1.4;
      g.fillStyle(JOB_COLORS[citizen.job],1);g.fillTriangle(x-6,y,x+6,y,x,y-17+bob);
      g.fillStyle(0xb68d62,1);g.fillCircle(x,y-19+bob,4);g.lineStyle(2,0x564533,1);g.lineBetween(x-3,y,x-4,y+6);g.lineBetween(x+3,y,x+5,y+6);
      if(phase>11&&citizen.job!=='idle'&&citizen.job!=='builder'){g.fillStyle(JOB_COLORS[citizen.job],.9);g.fillRoundedRect(x+4,y-14,7,8,2);}
    }
  }
}
function territoryByMission(id:string):number[]{const t=TERRITORIES.find(t=>t.id===id);return t?[t.x,t.y]:[600,450];}
function orderPoint(o:{kind:string;target:string;plot?:string},s:Game['state']):number[]{if(o.plot){const p=villagePlots(s).find(p=>p.id===o.plot);if(p)return[p.x,p.y];}if(o.kind==='claim')return territoryByMission(o.target);return ({lumber:[390,329],hunt:[797,337],quarry:[838,494],shrine:[398,493],forge:[672,254],cura:[566,578]} as Record<string,number[]>)[o.target]??[535,290];}
