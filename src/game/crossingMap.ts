import { CROSSING_PATHS,CROSSING_START,MAP_WIDTH,MAP_HEIGHT,TILE_SIZE,type Point } from './crossingLayout';

export type Terrain='grass'|'earth'|'water'|'path'|'bridge'|'stone'|'cliff';
export type MapProp={kind:'tree'|'rock'|'fern'|'reeds'|'wall';x:number;y:number;size:number;variant:number};
export type MapCell={x:number;y:number;terrain:Terrain;walkable:boolean;river:boolean;variation:number};
export type CrossingMap={columns:number;rows:number;cells:MapCell[];props:MapProp[]};
const river=[{x:920,y:1060},{x:860,y:850},{x:910,y:690},{x:840,y:540},{x:775,y:410},{x:880,y:320},{x:825,y:205},{x:900,y:-40}];
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
function segmentDistance(p:Point,a:Point,b:Point):number {
  const length=(b.x-a.x)**2+(b.y-a.y)**2;
  const t=Math.max(0,Math.min(1,((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/length));
  return distance(p,{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
}
const lineDistance=(p:Point,line:Point[])=>Math.min(...line.slice(1).map((b,i)=>segmentDistance(p,line[i],b)));
const paths=Object.values(CROSSING_PATHS).map(points=>[CROSSING_START,...points]);
const landmarks=[CROSSING_START,...Object.values(CROSSING_PATHS).flat()];
const noise=(x:number,y:number,salt=0)=>{const n=Math.sin(x*127.1+y*311.7+salt*74.7)*43758.5453;return n-Math.floor(n);};
export const cellCenter=(cell:MapCell):Point=>({x:(cell.x+.5)*TILE_SIZE,y:(cell.y+.5)*TILE_SIZE});

export function buildCrossingMap():CrossingMap {
  const columns=MAP_WIDTH/TILE_SIZE,rows=MAP_HEIGHT/TILE_SIZE,cells:MapCell[]=[],props:MapProp[]=[];
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
    const p={x:(x+.5)*TILE_SIZE,y:(y+.5)*TILE_SIZE},n=noise(x,y),water=lineDistance(p,river)<42;
    const road=Math.min(...paths.map(path=>lineDistance(p,path)))<37;
    const clearing=landmarks.some(point=>distance(point,p)<57);
    const edge=x<2||x>=columns-2||y<1||y>=rows-1;
    const cliff=!road&&!clearing&&((x<7&&y>8&&y<20)||(x>39&&y<5));
    let terrain:Terrain=water?'water':cliff?'cliff':p.x>1020&&p.y<470?'stone':n<.25?'earth':'grass';
    if(road)terrain=water?'bridge':'path';
    if(clearing&&!water)terrain=p.y<150||p.x>1000&&p.y<470?'stone':'earth';
    if(edge)terrain='cliff';
    const cell={x,y,terrain,river:water,walkable:terrain!=='water'&&terrain!=='cliff',variation:n};cells.push(cell);
    if(!cell.walkable||road||clearing)continue;
    const forest=p.x<650||p.x>1080||p.y>880||p.y<95;
    if(forest&&noise(x,y,5)<.15){props.push({kind:'tree',x:p.x,y:p.y,size:.8+noise(x,y,3)*.6,variant:Math.floor(n*3)});cell.walkable=false;}
    else if(terrain==='stone'&&noise(x,y,11)<.09){props.push({kind:'wall',x:p.x,y:p.y,size:1,variant:Math.floor(n*3)});cell.walkable=false;}
    else if(noise(x,y,9)<.055){props.push({kind:'rock',x:p.x,y:p.y,size:.7+n*.7,variant:0});cell.walkable=false;}
    else if(n>.86)props.push({kind:lineDistance(p,river)<90?'reeds':'fern',x:p.x,y:p.y,size:.7+n*.5,variant:Math.floor(n*3)});
  }
  for(const points of Object.values(CROSSING_PATHS))for(const i of [1,2,3,5]){
    const point=points[i],cell=cells[Math.floor(point.y/TILE_SIZE)*columns+Math.floor(point.x/TILE_SIZE)];
    cell.walkable=false;
  }
  return {columns,rows,cells,props};
}
export const IGARAPE_MAP=buildCrossingMap();
export function mapCell(p:Point,map=IGARAPE_MAP):MapCell|undefined {
  const x=Math.floor(p.x/TILE_SIZE),y=Math.floor(p.y/TILE_SIZE);
  if(x<0||y<0||x>=map.columns||y>=map.rows)return;
  return map.cells[y*map.columns+x];
}
export function canStand(p:Point,map=IGARAPE_MAP):boolean {
  const r=9;
  return [[0,0],[-r,0],[r,0],[0,-r],[0,r]].every(([dx,dy])=>mapCell({x:p.x+dx,y:p.y+dy},map)?.walkable===true);
}
export function nearestWalkable(p:Point,map=IGARAPE_MAP):Point {
  if(canStand(p,map))return {...p};
  let best=Infinity,result={...CROSSING_START};
  for(const cell of map.cells){if(!cell.walkable)continue;const center=cellCenter(cell),d=distance(center,p);if(d<best){best=d;result=center;}}
  return result;
}
/** Resolve the whole segment, so a long input step cannot tunnel through water or a trunk. */
export function moveOnMap(from:Point,to:Point,map=IGARAPE_MAP):Point {
  if(!canStand(from,map))from=nearestWalkable(from,map);
  const length=distance(from,to),steps=Math.max(1,Math.ceil(length/5)),dx=(to.x-from.x)/steps,dy=(to.y-from.y)/steps;let p={...from};
  for(let i=1;i<=steps;i++){
    const next={x:p.x+dx,y:p.y+dy};
    if(canStand(next,map))p=next;
    else {
      const horizontal={x:next.x,y:p.y},vertical={x:p.x,y:next.y};
      if(Math.abs(dx)>.001&&canStand(horizontal,map))p=horizontal;else if(Math.abs(dy)>.001&&canStand(vertical,map))p=vertical;else break;
    }
  }return p;
}
/** Eight-way A*: bridges connect the banks; diagonals cannot cut blocked corners. */
export function mapPath(from:Point,to:Point,map=IGARAPE_MAP):Point[] {
  const start=mapCell(nearestWalkable(from,map),map)!,goal=mapCell(nearestWalkable(to,map),map)!;
  const index=(c:MapCell)=>c.y*map.columns+c.x,s=index(start),g=index(goal);
  const open=new Set([s]),came=new Map<number,number>(),cost=new Map([[s,0]]);
  const h=(c:MapCell)=>Math.hypot(c.x-goal.x,c.y-goal.y);
  while(open.size){
    let current=-1,score=Infinity;
    for(const i of open){const f=cost.get(i)!+h(map.cells[i]);if(f<score){score=f;current=i;}}
    if(current===g){
      const result:Point[]=[];let i=g;while(i!==s){result.push(cellCenter(map.cells[i]));i=came.get(i)!;}
      result.reverse();result.unshift(cellCenter(start));const end=nearestWalkable(to,map);
      if(result.length&&canStand(end,map))result.push(end);else if(!result.length)result.push(end);
      return result;
    }
    open.delete(current);const c=map.cells[current];
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const x=c.x+dx,y=c.y+dy;if(x<0||y<0||x>=map.columns||y>=map.rows)continue;
      const next=map.cells[y*map.columns+x];if(!next.walkable)continue;
      if(dx&&dy&&(!map.cells[c.y*map.columns+x].walkable||!map.cells[y*map.columns+c.x].walkable))continue;
      const n=index(next),weight=next.terrain==='earth'?1.08:1,newCost=cost.get(current)!+Math.hypot(dx,dy)*weight;
      if(newCost<(cost.get(n)??Infinity)){came.set(n,current);cost.set(n,newCost);open.add(n);}
    }
  }return [];
}
