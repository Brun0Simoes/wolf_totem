
from PIL import Image
from pathlib import Path
import json,shutil,numpy as np
import sys
jobs=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
dest=Path(__file__).resolve().parents[2]/"public"/"assets"/"animations"/"v3"
dest.mkdir(parents=True,exist_ok=True)
def split_at(mask,axis,ideal,radius):
    counts=mask.sum(axis=axis)
    lo=max(2,int(ideal-radius));hi=min(len(counts)-3,int(ideal+radius))
    candidates=[i for i in range(lo,hi+1) if counts[i-2:i+3].sum()==0]
    if not candidates:candidates=[i for i in range(lo,hi+1) if counts[i-1:i+2].sum()==0]
    if not candidates:raise ValueError("no transparent cut near "+str(ideal))
    return min(candidates,key=lambda i:abs(i-ideal))
def feet_anchor(mask,box):
    bottom=box[3]-1; band=max(12,min(48,int((box[3]-box[1])*.16)))
    sub=mask[max(0,bottom-band):bottom+1,:]
    counts=sub.sum(axis=0); occupied=counts>2; groups=[];start=None
    for i,v in enumerate(list(occupied)+[False]):
        if v and start is None:start=i
        elif not v and start is not None:
            if i-start>=4:groups.append((int(counts[start:i].sum()),start,i))
            start=None
    top=sorted(groups,reverse=True)[:2]
    if top:x=(min(v[1] for v in top)+max(v[2] for v in top))/2
    else:x=(box[0]+box[2])/2
    return {"x":round(x),"y":bottom}
results=[]
for j in jobs:
    src=Path(j["path"]); im=Image.open(src).convert("RGBA"); w,h=im.size
    a=np.array(im.getchannel("A"));mask=a>8
    try:
        ys=[0,split_at(mask,1,h/3,h*.075),split_at(mask,1,2*h/3,h*.075),h]
        rects=[];anchors=[];bboxes=[]
        for row in range(3):
            y0,y1=ys[row],ys[row+1];rowmask=mask[y0:y1,:]
            xs=[0]+[split_at(rowmask,0,w*k/4,w*.07) for k in range(1,4)]+[w]
            for col in range(4):
                x0,x1=xs[col],xs[col+1];local=rowmask[:,x0:x1]
                visible=a[y0:y1,x0:x1]>32
                yy,xx=np.where(visible)
                if len(xx)<100:raise ValueError("empty or near empty pose")
                box=[int(xx.min()),int(yy.min()),int(xx.max())+1,int(yy.max())+1]
                if box[0]<1 or box[1]<1 or box[2]>=x1-x0 or box[3]>=y1-y0:raise ValueError("pose touches outer edge "+str((row,col,box)))
                rects.append({"x":x0,"y":y0,"width":x1-x0,"height":y1-y0})
                anchors.append(feet_anchor(visible,box));bboxes.append(box)
        slug=str(j["id"])+"-s"+str(j["stars"])
        shutil.copyfile(src,dest/(slug+".png"))
        p=bboxes[0];r=rects[0]
        meta={"characterId":j["id"],"stars":j["stars"],"name":j["name"],"image":"/assets/animations/v3/"+slug+".png","columns":4,"rows":3,"frameWidth":round(w/4),"frameHeight":round(h/3),"imageWidth":w,"imageHeight":h,"bodyHeight":p[3]-p[1],"anchorX":anchors[0]["x"],"anchorY":anchors[0]["y"],"frameRects":rects,"frameAnchors":anchors,"portrait":{"x":r["x"]+p[0],"y":r["y"]+p[1],"width":p[2]-p[0],"height":p[3]-p[1]},"clips":{"idle":[0,1,2,3],"walk":[4,5,6,7],"attack":[8,9,10,11]},"notes":"Built-in imagegen. PNG copied without pixel edits. 12 alpha-validated atlas rectangles (gutters alpha8, visible bounds alpha32) separated by transparent gutters; individual foot anchors. Canonical star evolution from src/data/characters.ts."}
        (dest/(slug+".json")).write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        results.append({"id":j["id"],"stars":j["stars"],"status":"ready","portrait":meta["portrait"],"height":meta["bodyHeight"],"file":str(dest/(slug+".png"))})
    except Exception as e:results.append({"id":j["id"],"stars":j["stars"],"status":"repair","error":str(e)})
print(json.dumps(results,ensure_ascii=True))
