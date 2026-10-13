/** Packaging only: preserves generated pixels, detects row gutters and fixes scale/foot anchors. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
let sharp;
try { sharp=require('sharp'); } catch {
  sharp=require('C:/Users/bruno/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
}
const root=path.resolve(import.meta.dirname,'..');
const jobsFile=path.join(root,'docs/production/night-evolution/generations.json');
const jobs=JSON.parse(fs.readFileSync(jobsFile,'utf8'));
const roster=JSON.parse(fs.readFileSync(path.join(root,'docs/production/night/roster.json'),'utf8'));
const ids=process.argv.slice(2).map(Number);
const out=path.join(root,'public/assets/animations/night');
const sources=path.join(root,'artifacts/night-evolution/sources');
fs.mkdirSync(sources,{recursive:true});
const frameSize=320,foot=304;

function bbox(data,width,height) {
  let l=width,t=height,r=-1,b=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  if(r<l)throw Error('Empty generated pose');
  return {left:l,top:t,width:r-l+1,height:b-t+1};
}
function components(data,width,height){
  const visited=new Uint8Array(width*height),groups=[];
  for(let i=0;i<visited.length;i++){
    if(visited[i]||data[i*4+3]<=245)continue;
    const pixels=[i];visited[i]=1;
    for(let at=0;at<pixels.length;at++){
      const p=pixels[at],x=p%width,y=Math.floor(p/width);
      for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]){
        const nx=x+dx,ny=y+dy,q=ny*width+nx;
        if(nx<0||nx>=width||ny<0||ny>=height||visited[q]||data[q*4+3]<=245)continue;
        visited[q]=1;pixels.push(q);
      }
    }
    groups.push(pixels);
  }
  return groups.filter(g=>g.length>=32).map(pixels=>{
    let l=width,t=height,r=0,b=0;for(const p of pixels){const x=p%width,y=Math.floor(p/width);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
    return {pixels,left:l,top:t,right:r,bottom:b,cx:(l+r)/2,cy:(t+b)/2};
  });
}
function rowCuts(data,width,height,rows=6) {
  const counts=Array.from({length:height},(_,y)=>{
    let n=0;for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>100)n++;return n;
  });
  const cuts=[0];
  for(let row=1;row<rows;row++){
    const nominal=Math.round(height*row/rows),margin=Math.round(height/rows*.28);
    let best=nominal,score=Infinity;
    for(let y=Math.max(cuts.at(-1)+height/10,nominal-margin);y<Math.min(height-height/10,nominal+margin);y++){
      const at=Math.round(y);const cost=counts.slice(at-3,at+4).reduce((a,b)=>a+b,0)+Math.abs(at-nominal)*.06;
      if(cost<score){score=cost;best=at;}
    }
    cuts.push(best);
  }
  cuts.push(height);return cuts;
}
async function isolateAtlas(source,customCuts,id,rows=6){
  const meta=await sharp(source).metadata();
  if(!meta.hasAlpha)throw Error(`Atlas ${id} lacks alpha`);
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const cuts=customCuts??rowCuts(data,info.width,info.height,rows);
  const groups=components(data,info.width,info.height);
  const slots=Array.from({length:rows*3},(_,i)=>({col:i%3,row:Math.floor(i/3),cx:(i%3+.5)*info.width/3,cy:(cuts[Math.floor(i/3)]+cuts[Math.floor(i/3)+1])/2,groups:[]}));
  for(const g of groups){
    const slot=[...slots].sort((a,b)=>Math.hypot((a.cx-g.cx)/info.width*3,(a.cy-g.cy)/info.height*rows)-Math.hypot((b.cx-g.cx)/info.width*3,(b.cy-g.cy)/info.height*rows))[0];
    slot.groups.push(g);
  }
  const roots=slots.map(slot=>slot.groups.sort((a,b)=>b.pixels.length-a.pixels.length)[0]);
  if(roots.some(r=>!r||r.pixels.length<500))throw Error(`Missing opaque pose root ${id}`);
  const owners=new Uint8Array(info.width*info.height),queue=new Uint32Array(owners.length);let tail=0;
  // Loose weapon ornaments belong to the nearest actual body, rather than the nominal grid centre.
  const distance=(g,root)=>Math.hypot(Math.max(root.left-g.cx,0,g.cx-root.right),Math.max(root.top-g.cy,0,g.cy-root.bottom))+.03*Math.hypot(g.cx-root.cx,g.cy-root.cy);
  for(const slot of slots)slot.groups=[];
  for(const g of groups){
    let index=roots.indexOf(g);
    if(index<0){let best=Infinity;for(let i=0;i<roots.length;i++){const d=distance(g,roots[i]);if(d<best){best=d;index=i;}}}
    slots[index].groups.push(g);
    for(const p of g.pixels)if(!owners[p]){owners[p]=index+1;queue[tail++]=p;}
  }
  // Extend ownership into the generated antialiasing and translucent pixels without taking neighbours.
  for(let head=0;head<tail;head++){
    const p=queue[head],x=p%info.width,y=Math.floor(p/info.width);
    for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nx=x+dx,ny=y+dy,q=ny*info.width+nx;
      if(nx<0||nx>=info.width||ny<0||ny>=info.height||owners[q]||data[q*4+3]<=16)continue;
      owners[q]=owners[p];queue[tail++]=q;
    }
  }
  return {data,info,cuts,slots,owners};
}
const report=[];
const failures=[];
for(const job of jobs.filter(j=>(!ids.length||ids.includes(j.id))&&j.source)){
  try {
  const character=roster.find(c=>c.id===job.id);if(!character)throw Error(`Unknown hero ${job.id}; regenerate roster first`);
  const source=fs.readFileSync(job.source);
  const atlas=await isolateAtlas(source,job.rowCuts,job.id);
  const rowAtlases={};
  for(const [row,spec]of Object.entries(job.rowSources??{})){
    const pixels=fs.readFileSync(spec.source);
    rowAtlases[row]={...await isolateAtlas(pixels,undefined,job.id,spec.rows??6),sourceRow:spec.row??Number(row)};
    fs.writeFileSync(path.join(sources,`${job.id}-row-${row}.png`),pixels);
  }
  fs.writeFileSync(path.join(sources,`${job.id}.png`),source);
  for(let col=0;col<3;col++){
    const frames=[];
    for(let row=0;row<6;row++){
      const {data,info,slots,owners,sourceRow=row}=rowAtlases[row]??atlas;
      const slot=slots[sourceRow*3+col];const largest=Math.max(...slot.groups.map(g=>g.pixels.length));
      const kept=slot.groups.filter(g=>g.pixels.length>=Math.max(40,largest*.004));
      if(largest<500)throw Error(`Missing body ${job.id} star ${col+1} pose ${row}`);
      if(kept.some(g=>g.bottom-g.top>info.height*.29))throw Error(`Connected rows ${job.id} star ${col+1} pose ${row}; needs generation repair`);
      const left=Math.max(0,Math.min(...kept.map(g=>g.left))-3),top=Math.max(0,Math.min(...kept.map(g=>g.top))-3);
      const right=Math.min(info.width-1,Math.max(...kept.map(g=>g.right))+3),bottom=Math.min(info.height-1,Math.max(...kept.map(g=>g.bottom))+3);
      const rect={left,top,width:right-left+1,height:bottom-top+1};
      const pixels=Buffer.alloc(rect.width*rect.height*4);
      // Preserve antialiasing and translucent cloth inside the isolated body's bounds.
      for(let y=0;y<rect.height;y++)for(let x=0;x<rect.width;x++){
        const p=(y+top)*info.width+x+left;if(owners[p]===sourceRow*3+col+1)data.copy(pixels,(y*rect.width+x)*4,p*4,p*4+4);
      }
      const raw={data:pixels,info:{width:rect.width,height:rect.height,channels:4}};
      const box=bbox(raw.data,raw.info.width,raw.info.height);
      frames.push({rect,box,raw});
    }
    // One scale for the whole stage; fit the widest attack without resizing each pose independently.
    const minimum=[126,150,151,152,153].includes(job.id)?.35:.6;
    if(frames.some(f=>f.box.height<frames[0].box.height*minimum))throw Error(`Truncated or undersized pose ${job.id} star ${col+1}; needs generation repair`);
    const scale=Math.min(278/frames[0].box.height,...frames.map(f=>296/f.box.width),...frames.map(f=>286/f.box.height));
    const composite=[];
    for(let row=0;row<6;row++){
      const f=frames[row];const width=Math.max(1,Math.round(f.box.width*scale)),height=Math.max(1,Math.round(f.box.height*scale));
      const cell=await sharp(f.raw.data,{raw:f.raw.info}).png().toBuffer();
      const image=await sharp(cell).extract(f.box).resize(width,height).png().toBuffer();
      // Bottom-centre anchor is shared by every pose. It works identically for mirrored combatants.
      const left=Math.floor((frameSize-width)/2),top=foot-height;
      composite.push({input:image,left:row%2*frameSize+left,top:Math.floor(row/2)*frameSize+top});
      if(row===0){
        await sharp({create:{width:frameSize,height:frameSize,channels:4,background:'#00000000'}}).composite([{input:image,left,top}]).png().toFile(path.join(out,`${job.id}-${col+1}-portrait.png`));
      }
    }
    const name=`${job.id}-${col+1}`,image=`/assets/animations/night/${name}.png`;
    await sharp({create:{width:frameSize*2,height:frameSize*3,channels:4,background:'#00000000'}}).composite(composite).png().toFile(path.join(out,name+'.png'));
    const sheet={characterId:job.id,stars:col+1,name:character.name,image,columns:2,rows:3,frameWidth:frameSize,frameHeight:frameSize,imageWidth:640,imageHeight:960,bodyHeight:Math.round(frames[0].box.height*scale),anchorX:160,anchorY:foot,frameRects:frames.map((_,i)=>({x:i%2*frameSize,y:Math.floor(i/2)*frameSize,width:frameSize,height:frameSize})),frameAnchors:frames.map(()=>({x:160,y:foot})),portrait:{x:0,y:0,width:frameSize,height:frameSize},clips:{idle:[0],walk:[1,0,2,0],windup:[3],attack:[4,4,0],cast:[5,5,0]},rigged:false,notes:'Six independently drawn poses per star: idle, two walk contacts, anticipation, attack release and spell gesture. Breathing, recovery, impact, death and victory are renderer motion. Three distinct generated costume/equipment designs.'};
    fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(sheet,null,2)+'\n');
  }
  report.push({id:job.id,name:character.name,sha256:crypto.createHash('sha256').update(source).digest('hex'),width:atlas.info.width,height:atlas.info.height,rowCuts:atlas.cuts,rowSources:Object.fromEntries(Object.entries(job.rowSources??{}).map(([row,spec])=>[row,{sha256:crypto.createHash('sha256').update(fs.readFileSync(spec.source)).digest('hex'),rows:spec.rows??6,row:spec.row??Number(row)}]))});
  }catch(error){failures.push({id:job.id,error:String(error)});}
}
const reportFile=path.join(root,'docs/production/night-evolution/packaging.json');
const previous=fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile,'utf8')):[];
fs.writeFileSync(reportFile,JSON.stringify([...previous.filter(p=>!report.some(r=>r.id===p.id)),...report].sort((a,b)=>a.id-b.id),null,2)+'\n');
console.log(JSON.stringify({packaged:report.map(r=>r.id),stages:report.length*3,poses:report.length*18,failures}));
if(failures.length)process.exitCode=1;
