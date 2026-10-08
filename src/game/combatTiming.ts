/** Authoritative action timing. Values are in battle seconds, independent of rendering. */
export interface AttackTiming { windup:number; recovery:number; flight:number }
export function attackTiming(range:number,attackSpeed:number,gap:number):AttackTiming {
  const interval=1/Math.max(.25,attackSpeed);
  const windup=Math.min(range>1?.22:.17,interval*.24);
  return {windup,recovery:Math.min(.23,interval*.28),flight:range>1?Math.min(.42,Math.max(.14,gap*.085)):0};
}
export const castWindup=(id:number)=>[15,24,28,38,49,51,52,54].includes(id)?.38:[1,3,14,16,23,34,42,47,50,55].includes(id)?.24:.3;

export interface BodyPoint {id:string;x:number;y:number;hp:number;summon?:string}
/** A view may separate copies of positions without changing combat ranges or destinations. */
export function separateBodies(bodies:BodyPoint[],dt:number,clamp:(p:BodyPoint)=>void):void {
  for(let a=0;a<bodies.length;a++)for(let b=a+1;b<bodies.length;b++) {
    const one=bodies[a],two=bodies[b];if(one.hp<=0||two.hp<=0)continue;
    const minimum=(one.summon||two.summon) ? .31 : .52;
    let dx=two.x-one.x,dy=two.y-one.y,gap=Math.hypot(dx,dy);if(gap>=minimum)continue;
    if(gap<.001){const sign=one.id<two.id?1:-1;dx=.6*sign;dy=.8;gap=1;}
    const offset=Math.min(.09,(minimum-Math.hypot(two.x-one.x,two.y-one.y))*.5)*Math.min(1,dt*25);
    one.x-=dx/gap*offset;one.y-=dy/gap*offset;two.x+=dx/gap*offset;two.y+=dy/gap*offset;clamp(one);clamp(two);
  }
}
