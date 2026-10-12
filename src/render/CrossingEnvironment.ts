import Phaser from 'phaser';
import { IGARAPE_MAP,cellCenter,type MapProp } from '../game/crossingMap';
import { CROSSING_PATHS,CROSSING_START,TILE_SIZE,MAP_WIDTH,MAP_HEIGHT,type Point } from '../game/crossingLayout';

const palette={grass:[0x334c36,0x344d37,0x324b35,0x354e38],earth:[0x394d35,0x3b5038,0x384d35],path:[0x8e7450,0x917750,0x89714d],stone:[0x59645a,0x606b5e,0x5b655a],cliff:[0x27382e,0x2b3c30],water:[0x255b60,0x2c6668,0x286265],bridge:[0x9f7950,0x96714b]};
const polygon=(g:Phaser.GameObjects.Graphics,points:number[][],color:number,alpha=1)=>g.fillStyle(color,alpha).fillPoints(points.map(([x,y])=>({x,y})),true);

/** Build terrain and independent objects directly in the scene, without a background bitmap. */
export function createCrossingEnvironment(scene:Phaser.Scene){
  const ground=scene.add.graphics().setDepth(-20),shadows=scene.add.graphics().setDepth(-10);
  const water=scene.add.graphics().setDepth(-8),lights=scene.add.graphics().setDepth(1300);
  const occluders:{object:Phaser.GameObjects.Container;x:number;y:number;radius:number}[]=[];
  const fires:Point[]=[];
  ground.fillStyle(0x1e3227).fillRect(0,0,MAP_WIDTH,MAP_HEIGHT);
  for(const cell of IGARAPE_MAP.cells){
    const x=cell.x*TILE_SIZE,y=cell.y*TILE_SIZE,p=cellCenter(cell),colors=palette[cell.terrain];
    const clearing=cell.terrain==='earth'&&[CROSSING_START,...Object.values(CROSSING_PATHS).flat()].some(a=>Math.hypot(a.x-p.x,a.y-p.y)<57);
    const color=clearing?0x7d6b49:colors[Math.min(colors.length-1,Math.floor(cell.variation*colors.length))];
    ground.fillStyle(cell.river?palette.water[0]:color).fillRect(x,y,TILE_SIZE,TILE_SIZE);
    if(cell.terrain==='water'){
      ground.fillStyle(color).fillRoundedRect(x,y,TILE_SIZE,TILE_SIZE,5);
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=cell.x+dx,ny=cell.y+dy,other=nx>=0&&nx<IGARAPE_MAP.columns&&ny>=0&&ny<IGARAPE_MAP.rows?IGARAPE_MAP.cells[ny*IGARAPE_MAP.columns+nx]:undefined;
        if(other&&!other.river){ground.lineStyle(5,0x819575,.5).lineBetween(x+(dx===1?32:0),y+(dy===1?32:0),x+(dx?dx===1?32:0:32),y+(dy?dy===1?32:0:32));}
      }
    }else if(cell.terrain==='bridge'){
      ground.fillStyle(0x0b3034,.45).fillRect(x-3,y+6,38,31);
      ground.fillStyle(color).fillRect(x,y+2,32,28);
      for(let i=2;i<32;i+=6){ground.lineStyle(1,0x4c3c2b,.8).lineBetween(x+i,y+2,x+i,y+30);ground.fillStyle(0xc4a675,.55).fillCircle(x+i+2,y+5,1);}
      ground.lineStyle(3,0x5a4731).lineBetween(x,y+2,x+32,y+2).lineBetween(x,y+30,x+32,y+30);
    }else if(cell.terrain==='cliff'){
      ground.fillStyle(0x16241d,.5).fillRect(x,y+19,32,13);
      polygon(ground,[[x+1,y+3],[x+27,y],[x+32,y+20],[x+18,y+26],[x,y+19]],color);
      ground.lineStyle(1,0x728365,.22).lineBetween(x+3,y+4,x+27,y+2);
    }else if(cell.terrain==='stone'){
      ground.lineStyle(1,0x34463a,.5).strokeRoundedRect(x+2,y+2,28,27,4);
      if(cell.variation>.65)ground.lineStyle(2,0x829273,.22).lineBetween(x+3,y+26,x+14,y+26);
    }else if(cell.terrain==='path'){
      ground.fillStyle(0xbca478,.24).fillEllipse(p.x,p.y,19,10);
      ground.fillStyle(0x564930,.6).fillEllipse(p.x+8,p.y+10,3,2);
    }else {
      ground.lineStyle(1,0x9ca975,.17).lineBetween(x+8,y+21,x+9,y+16).lineBetween(x+17,y+10,x+19,y+5);
      if(cell.variation>.75)ground.fillStyle(0xa6ae75,.14).fillEllipse(p.x,p.y,16,8);
    }
  }
  function objectAt(p:Point){const body=scene.add.graphics(),group=scene.add.container(p.x,p.y,[body]).setDepth(p.y);return {body,group};}
  function prop(prop:MapProp){
    const {body:g,group}=objectAt(prop);group.setScale(prop.size);
    shadows.fillStyle(0x0d2318,.35).fillEllipse(prop.x+9,prop.y+4,prop.kind==='tree'?74:45,prop.kind==='tree'?25:15);
    if(prop.kind==='tree'){
      polygon(g,[[-8,3],[-5,-77],[3,-86],[12,1]],0x493b2b);g.lineStyle(3,0x827148,.7).lineBetween(-2,-64,4,-5);
      polygon(g,[[-3,-38],[-24,-65],[-28,-67],[-8,-29]],0x4c402c);polygon(g,[[2,-48],[22,-83],[29,-84],[11,-41]],0x4c402c);
      const leaf=prop.variant===0?0x315f3c:prop.variant===1?0x3e6840:0x426d43;
      g.fillStyle(0x1a3827).fillEllipse(1,-78,101,66).fillEllipse(-28,-64,59,44).fillEllipse(32,-69,54,44);
      g.fillStyle(leaf).fillEllipse(-22,-91,64,49).fillEllipse(25,-90,60,43).fillEllipse(1,-111,63,43);
      g.fillStyle(0x789354,.32).fillEllipse(-14,-119,41,17).fillEllipse(30,-93,27,10);
      g.lineStyle(2,0x93a461,.16).lineBetween(-28,-91,-4,-109).lineBetween(16,-90,28,-77);
      occluders.push({object:group,x:prop.x,y:prop.y,radius:57*prop.size});
    }else if(prop.kind==='rock'){
      polygon(g,[[-24,1],[-18,-23],[5,-32],[25,-13],[24,2],[0,12]],0x58655a);
      polygon(g,[[-18,-23],[5,-32],[17,-15],[-2,-12]],0x89917b);polygon(g,[[17,-15],[25,-13],[24,2],[0,12],[-2,-12]],0x3d5145);
      g.lineStyle(2,0x9fab8a,.3).lineBetween(-16,-22,5,-29);
    }else if(prop.kind==='wall'){
      polygon(g,[[-24,0],[-24,-52],[23,-60],[29,-9],[14,5]],0x607166);polygon(g,[[-24,-52],[-15,-64],[27,-68],[23,-60]],0x99a38b);
      g.lineStyle(2,0x314a3f,.8).lineBetween(-23,-32,26,-38).lineBetween(-20,-15,28,-20).lineBetween(2,-58,4,-35).lineBetween(-5,-32,-2,-18);
      g.fillStyle(0x486b45).fillEllipse(-16,-51,19,7).fillEllipse(18,-38,17,5);occluders.push({object:group,x:prop.x,y:prop.y,radius:36});
    }else if(prop.kind==='fern'){
      g.lineStyle(3,0x62834b,.9);for(let i=0;i<7;i++){const a=(i-3)*.38;g.lineBetween(0,0,Math.sin(a)*22,-Math.cos(a)*25).lineBetween(Math.sin(a)*13,-Math.cos(a)*15,Math.sin(a)*19-7,-Math.cos(a)*17);}
    }else {
      g.lineStyle(2,0x9f9b5d,.9);for(let i=0;i<5;i++){g.lineBetween((i-2)*5,0,(i-2)*7,-26-i%3*6);g.fillStyle(0xcbb774).fillEllipse((i-2)*7,-27-i%3*6,3,10);}
    }
  }
  IGARAPE_MAP.props.forEach(prop);
  const seen=new Set<string>();
  for(const [route,points]of Object.entries(CROSSING_PATHS))for(const [i,p]of points.entries()){
    const key=`${p.x}:${p.y}`;if(seen.has(key))continue;seen.add(key);const {body:g,group}=objectAt(p);
    shadows.fillStyle(0x0d2318,.4).fillEllipse(p.x+4,p.y+5,i===5?105:67,22);
    if(i===0){
      for(let j=0;j<4;j++){g.fillStyle(0x292f21,.6).fillEllipse((j%2?8:-8)+j*6,j*9-20,5,9);g.fillCircle((j%2?8:-8)+j*6+3,j*9-25,2);}
      g.lineStyle(3,0xba9771,.7).lineBetween(-32,-10,-32,-41);polygon(g,[[-44,-37],[-22,-40],[-18,-22],[-43,-22]],0x78634a);
    }else if(i===1){
      polygon(g,[[-33,4],[0,-60],[35,4]],0x9c8056);polygon(g,[[0,-60],[8,-8],[35,4]],0x726047);polygon(g,[[-10,4],[1,-21],[13,4]],0x172b22);
      g.lineStyle(2,0xd6ba85).lineBetween(0,-60,-3,-69).lineBetween(-33,4,0,-60).lineBetween(35,4,0,-60);fires.push({x:p.x+38,y:p.y+9});
    }else if(i===4){
      g.lineStyle(4,0x879578,.6).strokeEllipse(0,0,72,35);g.fillStyle(0x756343).fillEllipse(0,-7,29,17);g.fillStyle(route==='river'?0x94bbb0:0xd0ad72).fillCircle(0,-10,6);
    }else{
      for(let s=0;s<(i===5?3:2);s++)g.fillStyle(s%2?0x7a8877:0x586d60).fillRoundedRect(-35+s*5,-s*11,70-s*10,15,4);
      polygon(g,[[-20,-13],[-17,-(i===5?88:60)],[17,-(i===5?91:66)],[23,-17]],0x647b6a);polygon(g,[[17,-(i===5?91:66)],[27,-(i===5?76:51)],[29,-13],[23,-17]],0x365343);
      g.lineStyle(2,0xcac59a,.75).strokeCircle(0,-40,11).lineBetween(-7,-40,7,-40).lineBetween(0,-50,0,-30);
      if(i===2||i===5){g.fillStyle(0x93cfab,.9).fillCircle(0,-40,5);g.fillStyle(0xa4dbb0,.12).fillCircle(0,-40,18);}
      if(i===5){g.lineStyle(3,0x91a880,.45).strokeEllipse(0,0,116,62);g.lineStyle(1,0xc4c59b,.45).strokeEllipse(0,0,138,76);}
      occluders.push({object:group,x:p.x,y:p.y,radius:30});
    }
  }
  const camp=scene.add.graphics().setDepth(-5);camp.lineStyle(3,0xb2a276,.6).strokeEllipse(CROSSING_START.x,CROSSING_START.y,105,57);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;camp.fillStyle(0x879580).fillEllipse(CROSSING_START.x+Math.cos(a)*53,CROSSING_START.y+Math.sin(a)*28,12,7);}
  const ripples=IGARAPE_MAP.cells.filter(c=>c.river&&c.terrain!=='bridge'&&c.variation>.7).map(cellCenter);
  const motes=IGARAPE_MAP.cells.filter(c=>c.terrain==='grass'&&c.variation>.985).map(cellCenter);
  return {update(time:number,position:Point|undefined,reduced:boolean){
    water.clear();lights.clear();const t=reduced?0:time;
    for(const [i,p]of ripples.entries()){const offset=(t*16+i*7)%22;water.lineStyle(1,0x98cfbd,.17+Math.sin(t*2+i)*.05).lineBetween(p.x-7,p.y-12+offset,p.x+8,p.y-12+offset);if(i%5===0)water.fillStyle(0xc1dfcb,.35).fillCircle(p.x+6,p.y-9+offset,1.3);}
    for(const [i,p]of fires.entries()){
      const pulse=1+Math.sin(t*7+i)*.14;lights.fillStyle(0xe9a958,.08).fillEllipse(p.x,p.y,68*pulse,40*pulse);
      lights.fillStyle(0xf1a351,.9).fillTriangle(p.x-7,p.y,p.x+7,p.y,p.x+Math.sin(t*6)*3,p.y-22*pulse);lights.fillStyle(0xffdf8b,.95).fillTriangle(p.x-4,p.y,p.x+3,p.y,p.x,p.y-13*pulse);
      if(!reduced)lights.fillStyle(0xffda8b,.7).fillCircle(p.x+Math.sin(t*2+i)*10,p.y-10-(t*17+i*9)%25,1.4);
    }
    for(const [i,p]of motes.entries()){const x=p.x+Math.sin(t*.8+i)*13,y=p.y-20+Math.cos(t*.6+i)*9,a=.18+(Math.sin(t*2+i)+1)*.2;lights.fillStyle(0xdcd88f,a*.12).fillCircle(x,y,9);lights.fillStyle(0xf1e8a1,a).fillCircle(x,y,1.5);}
    for(const o of occluders){const covered=position&&Math.abs(position.x-o.x)<o.radius&&position.y<o.y+9&&position.y>o.y-125;o.object.setAlpha(Phaser.Math.Linear(o.object.alpha,covered?.38:1,.16));}
  }};
}
