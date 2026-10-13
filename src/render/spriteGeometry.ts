import type {SheetDefinition} from './animationModel';

/** Opaque bounds and contact points are asset data; all poses keep one scale. */
export function spriteBounds(sheet:SheetDefinition,index:number){
 return sheet.frameBounds?.[index]??{x:0,y:0,width:sheet.frameRects?.[index]?.width??sheet.frameWidth,height:sheet.frameRects?.[index]?.height??sheet.frameHeight};
}
export function spriteAnchor(sheet:SheetDefinition,index:number){
 return sheet.frameAnchors?.[index]??{x:sheet.anchorX,y:sheet.anchorY};
}
export function arenaSpriteScale(sheet:SheetDefinition,height:number){
 const standing=(sheet.arenaHeight??height)/sheet.bodyHeight;
 if(!sheet.arenaWidth||!sheet.frameBounds)return standing;
 return Math.min(standing,sheet.arenaWidth/sheet.frameBounds[0].width,sheet.arenaWidth*1.5/Math.max(...sheet.frameBounds.map(b=>b.width)));
}
export const previewGround=(sheet:SheetDefinition,height:number)=>sheet.frameBounds?height-104:480;
export function previewSpriteScale(sheet:SheetDefinition,width:number,height:number){
 if(!sheet.frameBounds)return Math.min(330/sheet.bodyHeight,430/(sheet.portrait?.height??sheet.bodyHeight),570/Math.max(...(sheet.frameRects?.map(f=>f.width)??[sheet.frameWidth])));
 let left=0,right=0,up=0,down=0;
 const frames=sheet.frameRects?.length??sheet.columns*sheet.rows;
 for(let i=0;i<frames;i++){
  const b=spriteBounds(sheet,i),a=spriteAnchor(sheet,i);
  for(const x of [b.x-a.x,b.x+b.width-a.x])for(const y of [b.y-a.y,b.y+b.height-a.y])for(const angle of [-10,0,10]){
   const rad=angle*Math.PI/180,rx=(x*Math.cos(rad)-y*Math.sin(rad))*1.04,ry=(x*Math.sin(rad)+y*Math.cos(rad))*1.04;
   left=Math.max(left,-rx);right=Math.max(right,rx);up=Math.max(up,-ry);down=Math.max(down,ry);
  }
 }
 // Reserve room for recoil, rotation, the cast lift and the star controls below the ground line.
 return Math.min(330/sheet.bodyHeight,(width/2-46)/Math.max(1,left,right),(previewGround(sheet,height)-46)/Math.max(1,up),42/Math.max(1,down));
}
export function spriteHitBounds(sheet:SheetDefinition,index:number){
 const b=spriteBounds(sheet,index),a=spriteAnchor(sheet,index);
 if(!sheet.frameBounds)return b;
 const width=Math.min(b.width,sheet.bodyHeight*.62);
 const x=Math.max(b.x,Math.min(b.x+b.width-width,a.x-width/2));
 return {x,y:b.y,width,height:b.height};
}
