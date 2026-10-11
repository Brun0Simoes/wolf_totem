"""Slice transparent generation contact sheets into anchored game illustrations.
This packs existing pixels; motion and star auras are supplied by the renderer.
"""
import json, pathlib, re
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[1]
source=root/'docs/production/night'
files=[f'concept-{n}.png' for n in range(1,5)]
cuts=[[0,293,583,884,1170,1402],[0,287,569,846,1120,1402],[0,310,617,919,1206,1402],[0,299,629,921,1212,1402]]
out=root/'public/assets/animations/night';out.mkdir(parents=True,exist_ok=True)
design=root/'docs/production/night';design.mkdir(parents=True,exist_ok=True)
names=re.findall(r"^  \['([^']+)'",(root/'src/data/nocturne.ts').read_text(encoding='utf8'),re.M)
for group,file in enumerate(files):
 image=Image.open(source/file).convert('RGBA');w,h=image.size
 for slot in range(14 if group==3 else 13):
  row,col=divmod(slot,3);x0=round(col*w/3);x1=round((col+1)*w/3)
  if group==3 and row==4:x0=0 if col==0 else 550;x1=550 if col==0 else w
  crop=image.crop((x0,cuts[group][row],x1,cuts[group][row+1]))
  bbox=crop.getchannel('A').point(lambda a:255 if a>=24 else 0).getbbox()
  if not bbox:raise ValueError(f'Empty character {group}:{slot}')
  crop=crop.crop(bbox);cw,ch=crop.size
  # One transparent margin around each packaged illustration; preserve generated alpha.
  frame=Image.new('RGBA',(cw+32,ch+24));frame.alpha_composite(crop,(16,12))
  id=101+group*13+slot;name=names[id-101];fw,fh=frame.size
  frame.save(out/f'{id}.png',optimize=True)
  for stars in [1,2,3]:
   meta=dict(characterId=id,stars=stars,name=name,image=f'/assets/animations/night/{id}.png',columns=1,rows=1,frameWidth=fw,frameHeight=fh,bodyHeight=ch,anchorX=fw/2,anchorY=fh-12,clips=dict(idle=[0],walk=[0],attack=[0]),rigged=True,notes='Generated original illustration; programmed idle, walk, attacks, spells, impact, death and victory. Stars use supernatural auras; not independently drawn animation frames.')
   (out/f'{id}-{stars}.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(dict(characters=len(names),illustrations=53,forms=159,method='illustration + programmed motion'),ensure_ascii=False))
