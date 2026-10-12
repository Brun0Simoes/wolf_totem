export type Point = { x:number; y:number };
export type RouteId = 'ridge'|'river'|'ruins';
export const MAP_WIDTH=1536,MAP_HEIGHT=1024,TILE_SIZE=32;
export const CROSSING_START:Point={x:760,y:830};
export const CROSSING_PATHS:Record<RouteId,Point[]>={
  ridge:[{x:545,y:725},{x:395,y:470},{x:380,y:290},{x:505,y:185},{x:660,y:155},{x:815,y:95}],
  river:[{x:815,y:690},{x:685,y:465},{x:835,y:390},{x:980,y:300},{x:925,y:175},{x:815,y:95}],
  ruins:[{x:1040,y:735},{x:1200,y:600},{x:1110,y:420},{x:1145,y:265},{x:990,y:175},{x:815,y:95}],
};
