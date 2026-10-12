import { describe,it,expect } from 'vitest';
import { CROSSING_PATHS,CROSSING_START,type Point } from '../src/game/crossingLayout';
import { IGARAPE_MAP,buildCrossingMap,canStand,cellCenter,mapCell,mapPath,moveOnMap,nearestWalkable,type CrossingMap } from '../src/game/crossingMap';
import { Game } from '../src/game/simulation';

function follow(start:Point,path:Point[]):Point {
  let position=start;
  for(const target of path){position=moveOnMap(position,target);expect(canStand(position)).toBe(true);expect(Math.hypot(position.x-target.x,position.y-target.y)).toBeLessThan(.01);}
  return position;
}
describe('constructed Igarape terrain and navigation',()=>{
  it('builds the same connected terrain and obstacles on every load',()=>{
    expect(buildCrossingMap()).toEqual(IGARAPE_MAP);
    expect(new Set(IGARAPE_MAP.cells.map(c=>c.terrain)).size).toBe(7);
    expect(IGARAPE_MAP.props.some(p=>p.kind==='tree')).toBe(true);expect(IGARAPE_MAP.props.some(p=>p.kind==='wall')).toBe(true);
    expect(canStand(CROSSING_START)).toBe(true);
  });
  it('walks the whole path to every landmark in all three routes without clipping obstacles',()=>{
    for(const points of Object.values(CROSSING_PATHS)){
      let position={...CROSSING_START};
      for(const target of points){const path=mapPath(position,target);expect(path.length).toBeGreaterThan(0);position=follow(position,path);expect(Math.hypot(position.x-target.x,position.y-target.y)).toBeLessThan(50);}
    }
  });
  it('crosses the river through a bridge and rejects direct movement through deep water',()=>{
    const from=nearestWalkable({x:700,y:560}),to=nearestWalkable({x:990,y:560}),path=mapPath(from,to);
    expect(path.some(p=>mapCell(p)?.terrain==='bridge')).toBe(true);expect(path.every(p=>canStand(p))).toBe(true);
    const arrived=follow(from,path);expect(Math.hypot(arrived.x-to.x,arrived.y-to.y)).toBeLessThan(.01);
    const blocked=moveOnMap(from,to);expect(Math.hypot(blocked.x-to.x,blocked.y-to.y)).toBeGreaterThan(80);expect(canStand(blocked)).toBe(true);
  });
  it('does not cut a blocked diagonal corner',()=>{
    const map:CrossingMap={columns:2,rows:2,props:[],cells:[
      {x:0,y:0,walkable:true,terrain:'grass',river:false,variation:0},
      {x:1,y:0,walkable:false,terrain:'water',river:true,variation:0},
      {x:0,y:1,walkable:false,terrain:'cliff',river:false,variation:0},
      {x:1,y:1,walkable:true,terrain:'grass',river:false,variation:0},
    ]};
    expect(mapPath({x:16,y:16},{x:48,y:48},map)).toEqual([]);
  });
  it('restores free exploration positions and moves invalid old positions onto nearby land',()=>{
    const g=new Game();g.startCrossing(1,'river');const destination=nearestWalkable({x:620,y:820});
    for(const p of mapPath(g.state.crossings.active!.position,destination))g.moveCrossing(p.x,p.y);
    const loaded=new Game(g.serialize());expect(loaded.state.crossings.active!.position).toEqual(g.state.crossings.active!.position);
    const save=JSON.parse(g.serialize());save.state.crossings.active.position=cellCenter(IGARAPE_MAP.cells.find(c=>c.terrain==='water')!);
    const migrated=new Game(save);expect(canStand(migrated.state.crossings.active!.position)).toBe(true);
  });
});
