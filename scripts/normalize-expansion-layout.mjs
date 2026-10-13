/** Geometry only: retain the atlas pixels, record contact points and frame bounds, and reframe portraits. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let sharp;
try{sharp=require('sharp');}catch{sharp=require('C:/Users/bruno/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');}
const root=path.resolve(import.meta.dirname,'..');
const override=JSON.parse(fs.readFileSync(path.join(root,'docs/production/sprite-layout/overrides.json'),'utf8'));
// [standing height, width limit, height added per star]. Children, companions and spirits have distinct footprints.
const sizes={126:[74,108,4],150:[68,108,4],151:[54,104,4],152:[48,106,3],153:[74,108,4],157:[68,94,4],201:[82,108,5],205:[78,106,5],229:[44,70,3],231:[74,104,4],232:[60,92,4],233:[54,88,4],255:[72,100,4],228:[70,122,4],256:[70,108,4],257:[38,64,3],258:[78,110,4],259:[80,110,4],260:[84,118,4],261:[72,108,4]};
const floating=new Set([150,153,258,259]);
function bounds(data,info,r){
 let x=r.width,y=r.height,right=-1,bottom=-1;
 for(let py=0;py<r.height;py++)for(let px=0;px<r.width;px++)if(data[((r.y+py)*info.width+r.x+px)*4+3]>32){x=Math.min(x,px);y=Math.min(y,py);right=Math.max(right,px);bottom=Math.max(bottom,py);}
 if(right<x)throw Error('Empty frame');
 return {x,y,width:right-x+1,height:bottom-y+1};
}
function support(data,info,r,b,portion){
 let sum=0,mass=0;const bottom=b.y+b.height-1;
 for(let py=bottom-Math.max(2,Math.round(b.height*portion));py<=bottom;py++)for(let px=b.x;px<b.x+b.width;px++){
  const alpha=data[((r.y+py)*info.width+r.x+px)*4+3];if(alpha<180)continue;sum+=(px+.5)*alpha;mass+=alpha;
 }
 return mass?sum/mass:b.x+b.width/2;
}
const report=[];
for(const collection of ['night','avatar']){
 const dir=path.join(root,'public/assets/animations',collection);
 for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))){
  const file=path.join(dir,name),sheet=JSON.parse(fs.readFileSync(file,'utf8'));
  const source=path.join(root,'public',sheet.image.slice(1));
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const boxes=sheet.frameRects.map(r=>bounds(data,info,r));
  const points=boxes.map((b,i)=>{
   const center=b.x+b.width/2;
   const detected=support(data,info,sheet.frameRects[i],b,.04)*.7+support(data,info,sheet.frameRects[i],b,.12)*.3;
   const x=override[sheet.characterId]?.[i]!==undefined?b.x+b.width*override[sheet.characterId][i]:Math.max(center-b.width*.16,Math.min(center+b.width*.16,detected));
   const y=floating.has(sheet.characterId)?b.y+b.height*.6+boxes[0].height*.4:b.y+b.height;
   return {x:Math.round(x),y:Math.round(Math.min(sheet.frameHeight-2,y))};
  });
  sheet.frameBounds=boxes;sheet.frameAnchors=points;sheet.anchorX=points[0].x;sheet.anchorY=points[0].y;
  const size=sizes[sheet.characterId];sheet.arenaHeight=size?size[0]+((sheet.stars??1)-1)*size[2]:100+((sheet.stars??1)-1)*8;sheet.arenaWidth=size?.[1]??112;
  sheet.layoutVersion=1;
  const b=boxes[0],a=points[0],portraitFoot=298;
  // Use a common contact line; fit each side around the body pivot, not around a long cape or weapon.
  const scale=Math.min(264/sheet.bodyHeight,140/Math.max(1,a.x-b.x,b.x+b.width-a.x),270/Math.max(1,a.y-b.y),12/Math.max(1,b.y+b.height-a.y));
  const w=Math.max(1,Math.round(b.width*scale)),h=Math.max(1,Math.round(b.height*scale));
  const sprite=await sharp(source).extract({left:sheet.frameRects[0].x+b.x,top:sheet.frameRects[0].y+b.y,width:b.width,height:b.height}).resize(w,h).png().toBuffer();
  const left=Math.round(160-(a.x-b.x)*scale),top=Math.round(portraitFoot-(a.y-b.y)*scale);
  if(left<0||top<0||left+w>320||top+h>320)throw Error(`Portrait overflow ${name}`);
  await sharp({create:{width:320,height:320,channels:4,background:'#00000000'}}).composite([{input:sprite,left,top}]).png().toFile(path.join(dir,name.replace('.json','-portrait.png')));
  fs.writeFileSync(file,JSON.stringify(sheet,null,2)+'\n');
  report.push({collection,characterId:sheet.characterId,stars:sheet.stars,name:sheet.name,bodyHeight:sheet.bodyHeight,arenaHeight:sheet.arenaHeight,arenaWidth:sheet.arenaWidth,frameBounds:boxes,frameAnchors:points,reviewed:!!override[sheet.characterId]});
 }
}
fs.writeFileSync(path.join(root,'docs/production/sprite-layout/layout.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({forms:report.length,drawnFrames:report.length*6,reviewedForms:report.filter(s=>s.reviewed).length,atlasPixels:'preserved'}));
