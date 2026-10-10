"""Compose pinned Universal LPC layers into Wolf Totem atlases. No game rules are changed.

python scripts/generate-lpc.py --fetch
python scripts/generate-lpc.py --ids 1,3,8   # iterate on a selection
Requires Pillow and NumPy. Upstream source assets remain in the ignored artifacts directory.
"""
from __future__ import annotations
import argparse, csv, hashlib, html, json, math, subprocess
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageColor
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT/'scripts/lpc-profiles.json').read_text(encoding='utf-8'))
UPSTREAM = ROOT/'artifacts/lpc/upstream'
OUTPUT = ROOT/'public/assets/animations/lpc'
REPORT = ROOT/'docs/production/lpc'
SIZE, CENTER, FOOT = 256, 128, 160
DIRS = ['north','west','south','east']
CYCLES = {'idle':[0,0,1], 'walk':list(range(1,9)), 'slash':list(range(6)), 'thrust':list(range(8)),
          'shoot':list(range(13)), 'cast':list(range(7)), 'hurt':[0,1], 'death':list(range(6)), 'victory':list(range(7))}
WEAPONS = {
 'spear':('weapon_polearm_spear','thrust','medium'), 'longspear':('weapon_polearm_longspear','thrust_oversize','medium'),
 'club':('weapon_blunt_club','slash_reverse_oversize','club'), 'axe':('weapon_blunt_waraxe','slash_oversize','waraxe'),
 'dagger':('weapon_sword_dagger','slash','dagger'), 'scimitar':('weapon_sword_scimitar','slash_oversize','scimitar'),
 'staff':('weapon_magic_simple','thrust','simple'), 'gnarled':('weapon_magic_gnarled','thrust_oversize','medium'),
 'crystal':('weapon_magic_crystal','thrust_oversize','blue'), 'bow':('weapon_ranged_bow_normal','shoot','medium'),
 'recurve':('weapon_ranged_bow_recurve','shoot','dark'), 'shield':('shield_round','slash','brown'), 'fists':(None,'slash',None),
 'slingshot':('weapon_ranged_slingshot','shoot','slingshot')}
DEFINITIONS:dict = {}
TREE:set[str] = set()
USED:set[str] = set()
SELECTED:list[dict] = []
PROFILES = [dict(zip(CONFIG['columns'],row)) for row in CONFIG['heroes']]
source=(ROOT/'src/data/characters.ts').read_text(encoding='utf-8')
CHARACTERS = json.loads(source.split('export const characters: Character[] = ')[1].rsplit('];',1)[0]+']')

def git(*args, **kwargs):
    return subprocess.run(['rtk','proxy','git',*args],cwd=UPSTREAM,check=True,**kwargs)

def load_catalog():
    global TREE, DEFINITIONS
    for path in sorted((UPSTREAM/'sheet_definitions').rglob('*.json')):
        if not path.name.startswith('meta_'): DEFINITIONS[path.stem]=json.loads(path.read_text(encoding='utf-8'))
    TREE=set(git('ls-tree','-r','--name-only',CONFIG['revision'],'spritesheets',capture_output=True,text=True).stdout.splitlines())

def layers(profile,stars):
    body=profile['body']; theme=profile['theme']
    head='heads_human_female' if body=='female' else 'heads_human_male'
    if profile['id'] in [29,43,49,51,52,54]: head += '_elderly'
    if stars==3:
        if theme in ['wolf','hyena','jackal','bear']: head='heads_wolf_female' if body=='female' else 'heads_wolf_male'
        elif theme in ['croc','serpent','feather-serpent']: head='heads_lizard_female' if body=='female' else 'heads_lizard_male'
        elif theme in ['buffalo']: head='heads_minotaur_female' if body=='female' else 'heads_minotaur'
        elif theme in ['boar','hippo','rhino']: head='heads_boarman'
    result=[('body','skin'),(head,'skin'),('legs_'+{'short':'shorts_short','skirt':'skirts_plain','slit':'skirts_slit'}[profile['legs']],'cloth')]
    if profile['outfit']=='leather': result.append(('torso_armour_leather','cloth'))
    elif profile['outfit']=='fiber': result.append(('torso_clothes_sleeveless1','cloth'))
    elif profile['outfit']!='bare': result.append(('torso_clothes_'+profile['outfit'],'cloth'))
    if stars<3 or head.startswith('heads_human'): result.append(('hair_'+profile['hair'],'hair'))
    if profile['id'] in [29,49,54]: result.append(('beards_beard','hair'))
    if stars>=2: result += [('arms_bracers','accent'),('neck_necklace_beaded_large','brown')]
    if stars==3:
        if theme in ['crow','eagle','owl','feather-serpent']: result += [('wings_feathered','white' if theme=='owl' else 'black' if theme=='crow' else 'gold')]
        if theme=='bat': result += [('wings_bat','navy')]
        if theme in ['wolf','hyena','jackal','bear']: result += [('tail_wolf_fluffy','fur_grey' if theme in ['wolf','bear'] else 'fur_brown')]
        if theme in ['jaguar','tiger','puma','monkey','otter']: result += [('tail_cat','fur_gold' if theme in ['jaguar','tiger'] else 'fur_brown')]
        if theme in ['croc','serpent','feather-serpent']: result += [('tail_lizard_alt','green')]
        if theme=='mantis': result += [('wings_dragonfly','green')]
    weapon=WEAPONS[profile['weapon']][0]
    if weapon: result.append((weapon,'weapon'))
    return result

def attack(profile): return WEAPONS[profile['weapon']][1]
def cycle(profile,motion):
    if motion=='attack': return list(range(13 if attack(profile)=='shoot' else 8 if 'thrust' in attack(profile) else 6))
    return CYCLES[motion]
def source_anim(profile,motion):
    if motion=='attack': return attack(profile).split('_')[0]
    if motion in ['cast','victory']: return 'spellcast'
    if motion in ['hurt','death']: return 'hurt'
    return motion

def variant_for(item,profile,stars,value):
    variants=item.get('variants',[])
    if value=='weapon':
        v=WEAPONS[profile['weapon']][2]
        if stars==3 and 'gold' in variants: v='gold'
        if profile['weapon']=='crystal': v='purple' if profile['theme']=='owl' else 'green' if profile['theme']=='beetle' else 'blue'
        if profile['weapon']=='shield': v='green' if profile['theme']=='turtle' else 'gold' if stars==3 else 'brown'
        return v
    if value in ['skin','hair','cloth','accent']:
        return profile.get('hairColor' if value=='hair' else 'cloth' if value in ['cloth','accent'] else 'skin')
    return value

def resolve_layer(item_id,layer,profile,stars,motion,value):
    item=DEFINITIONS[item_id]; body=profile['body']; path=layer.get(body)
    if not path:
        # Standard garment mappings for muscular/teen bodies use the male/lean limb layout.
        path=layer.get('male' if body=='muscular' else 'female') or layer.get('teen')
        if not path: raise ValueError(f'No body mapping: {item_id} / {body}')
    anim=source_anim(profile,motion); custom=layer.get('custom_animation')
    if custom:
        if motion=='attack' and custom==attack(profile): pass
        elif custom=='walk_128' and motion in ['idle','walk']: pass
        elif profile['weapon']=='club' and item_id=='weapon_blunt_club' and motion in ['idle','walk']:
            pass # The original club's rest frame is extracted from its reverse-slash sheet.
        else: return None
    elif motion=='attack' and any(k.startswith('layer_') and v.get('custom_animation')==attack(profile) for k,v in item.items()):
        if item_id==WEAPONS[profile['weapon']][0]: return None
    elif motion in ['idle','walk'] and any(k.startswith('layer_') and v.get('custom_animation')=='walk_128' for k,v in item.items()):
        return None
    if motion in ['cast','victory'] and item_id==WEAPONS[profile['weapon']][0] and 'spellcast' not in item.get('animations',[]):
        return None # Two free hands during conjuration; weapon returns afterwards.
    variant=variant_for(item,profile,stars,value)
    suffix='' if item.get('recolors') else '/'+str(variant).replace(' ','_')
    options=[f'spritesheets/{path}{anim}{suffix}.png']
    if custom: options=[f'spritesheets/{path}{str(variant).replace(" ","_")}.png',f'spritesheets/{path}{custom}{suffix}.png',*options]
    if motion=='idle': options += [f'spritesheets/{path}walk{suffix}.png']
    # Clothing/body/hair must animate with the actual action. Never silently replace an attack with idle.
    found=next((p for p in options if p in TREE),None)
    if not found and item_id==WEAPONS[profile['weapon']][0] and motion in ['hurt','death']: return None
    if not found: raise ValueError(f'Missing source: {profile["id"]} {stars} {item_id} {motion}: {options}')
    return found

def required_paths():
    result=set();errors=set()
    for p in PROFILES:
        for stars in [1,2,3]:
            for motion in ['idle','walk','attack','cast','hurt','death','victory']:
                for item_id,value in layers(p,stars):
                    item=DEFINITIONS[item_id]
                    try: recolor_map(item,p,stars,value)
                    except (ValueError,KeyError,AttributeError) as e: errors.add(str(e))
                    for name,layer in item.items():
                        if name.startswith('layer_'):
                            try: path=resolve_layer(item_id,layer,p,stars,motion,value)
                            except (ValueError,KeyError) as e: errors.add(str(e));continue
                            if path: result.add(path)
    if errors: raise ValueError('\n'.join(sorted(errors)[:30])+f'\n{len(errors)} invalid layer selections')
    return result

def fetch_assets(paths):
    patterns=['/*','!/*/','/sheet_definitions/','/palette_definitions/','/sources/']+['/'+p for p in sorted(paths)]
    git('sparse-checkout','set','--no-cone','--stdin',input='\n'.join(patterns)+'\n',text=True)
    missing=[p for p in paths if not (UPSTREAM/p).exists()]
    if missing: raise ValueError(f'{len(missing)} sources were not downloaded')

def rgb(value): return ImageColor.getrgb(value)
@lru_cache(maxsize=64)
def palette(material):
    return json.loads((UPSTREAM/f'palette_definitions/{material}/{material}_ulpc.json').read_text(encoding='utf-8'))

def recolor_map(item,profile,stars,value):
    spec=item.get('recolors')
    if not spec: return {}
    specs=spec.values() if 'material' not in spec else [spec]
    mapping={}
    for part in specs:
        material=part['material']; colors=palette(material)
        base=(part.get('base') or {'body':'light','hair':'orange','cloth':'white','metal':'steel','eye':'blue','wood':'maple'}[material]).replace('ulpc.','')
        target=variant_for(item,profile,stars,value)
        if material=='eye': continue
        if value=='accent': target='bronze' if material=='metal' else profile['cloth']
        if value=='brown': target='bronze' if material=='metal' else 'brown'
        if value=='cloth' and material=='metal': target='gold' if stars==3 else 'bronze'
        if value=='hair' and material=='cloth': target=profile['cloth']
        if stars==3 and value=='skin' and item.get('name','').lower().startswith(('wolf','boarman','minotaur')):
            target='fur_grey' if profile['theme'] in ['wolf','bear'] else 'fur_brown' if profile['theme'] in ['hyena','jackal','boar'] else 'fur_tan'
        if stars==3 and value=='skin' and item.get('name','').lower().startswith('lizard'): target='pale_green'
        if target not in colors: raise ValueError(f'Unknown palette {material}:{target} for {profile["id"]} {item["name"]}')
        mapping.update(zip(map(rgb,colors[base]),map(rgb,colors[target])))
    return mapping

@lru_cache(maxsize=3000)
def image_for(path,mapping_tuple):
    im=Image.open(UPSTREAM/path).convert('RGBA')
    if mapping_tuple:
        data=np.array(im); original=data[:,:,:3].copy()
        for before,after in mapping_tuple: data[:,:,:3][np.all(original==before,axis=2)]=after
        im=Image.fromarray(data)
    return im

def extract(path,item_id,profile,stars,motion,column,direction,value,layer):
    USED.add(path)
    item=DEFINITIONS[item_id]
    mapping=recolor_map(item,profile,stars,value)
    im=image_for(path,tuple(sorted(mapping.items())))
    custom=layer.get('custom_animation')
    cell=im.height//4 if custom else 64
    row=0 if im.height==64 else direction
    col=column
    if custom and profile['weapon']=='club' and motion in ['idle','walk']: col=0
    elif motion=='attack' and attack(profile)=='slash_reverse_oversize' and item_id!=WEAPONS[profile['weapon']][0]: col=5-column
    if motion=='idle' and '/walk' in path: col=0
    if col*cell>=im.width: raise ValueError(f'Frame outside {path}: {motion}/{col}, cell {cell}')
    tile=im.crop((col*cell,row*cell,(col+1)*cell,(row+1)*cell))
    return tile

def details(canvas,profile,stars,motion,column,direction,head_box):
    """Original tribal accents aligned to the modular head, shared across every frame of a sequence."""
    if not head_box: return
    d=ImageDraw.Draw(canvas); accent=rgb(profile['accent']); cx=(head_box[0]+head_box[2])//2; top=head_box[1]
    front=direction==2; side=direction in [1,3]; sign=-1 if direction==1 else 1
    theme=profile['theme']; glow=accent+(220,); phase=math.sin(column*.65)
    if stars>=2:
        d.line((cx-8,top+5,cx+8,top+5),fill=(103,70,41,255),width=2)
        d.polygon([(cx,top+1),(cx+2,top+4),(cx,top+7),(cx-2,top+4)],fill=glow)
    if theme in ['owl'] and (front or side):
        d.ellipse((cx-8,top+3,cx+8,top+16),fill=(216,212,183,255),outline=(61,62,55,255),width=1)
        if front:
            for x in [cx-4,cx+4]: d.ellipse((x-3,top+6,x+3,top+12),fill=(50,50,49,255)); d.point((x,top+8),fill=glow)
        else: d.ellipse((cx+sign*2-3,top+6,cx+sign*2+3,top+12),fill=(50,50,49,255))
        d.polygon([(cx-2,top+11),(cx+2,top+11),(cx,top+15)],fill=(157,111,62,255))
    if theme=='antler' and stars>=2:
        for sign in [-1,1]:
            d.line([(cx+sign*5,top+4),(cx+sign*9,top-7),(cx+sign*8,top-15)],fill=glow,width=2)
            d.line([(cx+sign*9,top-8),(cx+sign*14,top-13)],fill=glow,width=2)
            if stars==3: d.line([(cx+sign*8,top-13),(cx+sign*3,top-18)],fill=glow,width=2)
    if theme in ['totem','masks','ancestors']:
        height=18+stars*6; x=cx-14 if direction!=1 else cx+14
        d.rectangle((x-3,top+20-height,x+3,top+20),fill=(113,75,42,255),outline=(55,43,32,255))
        for yy in range(top+22-height,top+15,8):
            d.line((x-2,yy,x+2,yy),fill=accent+(255,),width=1);d.point((x-1,yy+2),fill=(25,26,26,255));d.point((x+1,yy+2),fill=(25,26,26,255))
    if stars<3: return
    if theme in ['jaguar','tiger','puma','otter','bear']:
        # Distinct primal face masks; the human head remains the animation reference.
        fur=(212,161,64,255) if theme in ['tiger','jaguar'] else (117,83,57,255) if theme in ['puma','otter'] else (187,210,219,255)
        d.ellipse((cx-9,top+1,cx+9,top+17),fill=fur,outline=(46,47,44,255))
        for x in [cx-7,cx+7]: d.ellipse((x-3,top-1,x+3,top+5),fill=fur,outline=(46,47,44,255))
        shade=tuple(int(v*.7) for v in fur[:3])+(255,)
        d.line((cx-7,top+5,cx-7,top+12),fill=shade,width=2)
        d.line((cx+7,top+6,cx+7,top+13),fill=shade,width=2)
        d.line((cx-4,top+3,cx+4,top+3),fill=tuple(min(255,v+25) for v in fur[:3])+(255,),width=1)
        if front or side:
            muzzle=cx if front else cx+sign*7
            d.ellipse((muzzle-5,top+10,muzzle+5,top+16),fill=(222,204,165,255),outline=shade)
            d.polygon([(muzzle-2,top+11),(muzzle+2,top+11),(muzzle,top+13)],fill=(42,42,37,255))
            d.line((muzzle,top+13,muzzle,top+15),fill=shade,width=1)
            for x in [cx-4,cx+4] if front else [cx+sign*4]:
                d.line((x-2,top+7,x+2,top+7),fill=(31,35,29,255),width=2);d.point((x,top+7),fill=glow)
        if theme in ['jaguar','tiger']:
            for y in [top+2,top+5,top+10]: d.line((cx-8,y,cx-5,y+1),fill=(55,44,35,255),width=1);d.line((cx+5,y,cx+8,y+1),fill=(55,44,35,255),width=1)
    if theme=='elephant':
        for x in [cx-12,cx+12]: d.ellipse((x-5,top+1,x+5,top+20),fill=(146,141,122,255),outline=(72,75,65,255))
        if front or side:
            xx=cx if front else cx+sign*6;d.line([(xx,top+9),(xx,top+25),(xx+sign*5,top+28)],fill=(145,142,124,255),width=5)
            d.line([(cx-7,top+13),(cx-8,top+23),(cx-4,top+20)],fill=(232,222,185,255),width=2)
            d.line([(cx+7,top+13),(cx+8,top+23),(cx+4,top+20)],fill=(232,222,185,255),width=2)
    if theme in ['monkey','gorilla','anteater']:
        fur=(78,60,43,255) if theme!='anteater' else (107,104,81,255)
        d.ellipse((cx-9,top+1,cx+9,top+18),fill=fur,outline=(36,39,30,255))
        for x in [cx-10,cx+10]: d.ellipse((x-3,top+5,x+3,top+13),fill=fur,outline=(36,39,30,255))
        if front or side:
            muzzle=cx if front else cx+sign*7
            d.ellipse((muzzle-6,top+8,muzzle+6,top+17),fill=(162,133,97,255),outline=(61,55,41,255))
            d.line((muzzle-3,top+14,muzzle+3,top+14),fill=(53,43,30,255),width=1)
            for x in [cx-4,cx+4] if front else [cx+sign*4]:
                d.line((x-2,top+6,x+2,top+6),fill=(25,29,24,255),width=2);d.point((x,top+6),fill=glow)
            if theme=='anteater':
                d.polygon([(muzzle-4,top+9),(muzzle+4,top+9),(muzzle+sign*10,top+19),(muzzle+sign*7,top+21)],fill=fur,outline=(36,39,30,255))
        # Long forearms and knuckles remain attached to the native torso's moving reference.
        if theme=='gorilla':
            for s in [-1,1]:
                d.line([(cx+s*13,top+21),(cx+s*16,top+32),(cx+s*15,top+41)],fill=fur,width=5)
                d.rectangle((cx+s*15-3,top+39,cx+s*15+3,top+43),fill=fur,outline=(36,39,30,255))
    if theme in ['boar','rhino','hippo','buffalo'] and (front or side):
        if theme=='rhino': d.polygon([(cx-3,top+12),(cx+3,top+12),(cx+sign*5,top+3)],fill=(228,221,192,255))
        elif theme=='boar':
            for sign in [-1,1]: d.line([(cx+sign*5,top+17),(cx+sign*8,top+11),(cx+sign*7,top+7)],fill=(239,224,181,255),width=2)
    if theme=='frog' and front:
        for x in [cx-6,cx+6]: d.ellipse((x-4,top+1,x+4,top+9),fill=(83,128,91,255),outline=(43,66,51,255));d.rectangle((x-1,top+3,x+1,top+5),fill=glow)
    if theme in ['mantis'] and front:
        d.line((cx-7,top+14,cx+7,top+14),fill=accent+(255,),width=3)
        for s in [-1,1]:
            d.line([(cx+s*9,top+3),(cx+s*12,top-7)],fill=glow,width=1)
            d.polygon([(cx+s*12,top+19),(cx+s*20,top+26),(cx+s*14,top+35)],fill=(99,142,76,255),outline=(39,66,43,255))
    if theme=='croc':
        for y in range(top+17,top+38,5): d.polygon([(cx-3,y),(cx+3,y),(cx,y-5)],fill=glow)
    if theme=='beetle':
        d.line([(cx,top+4),(cx,top-5),(cx-4,top-9)],fill=glow,width=3)
        d.line((cx,top-5,cx+4,top-9),fill=glow,width=2)
    # Marks move with the head and upper torso rather than with a fixed canvas coordinate.
    if front:
        for x in [cx-6,cx+6]: d.line((x,top+19,x,top+23),fill=glow,width=2)
    if motion=='cast':
        for i in range(5):
            a=i*math.tau/5+column*.12
            x=cx+int(math.cos(a)*21);y=top+17+int(math.sin(a)*15)
            d.rectangle((x-1,y-1,x+1,y+1),fill=accent+(180,))

def background_details(canvas,p,stars,motion,column,direction,head_box):
    if not head_box: return
    d=ImageDraw.Draw(canvas);cx=(head_box[0]+head_box[2])//2;top=head_box[1];a=rgb(p['accent'])+(170,);theme=p['theme']
    if stars==3 and theme=='spider':
        for sign in [-1,1]:
            for i in range(4 if p['id']==44 else 3):
                y=top+18+i*4;reach=20+i*4;bob=int(math.sin(column*.55+i)*3)
                d.line([(cx,y),(cx+sign*(reach-6),y-12+bob),(cx+sign*reach,y+12+bob)],fill=a,width=2)
    if stars==3 and theme in ['turtle','beetle']:
        color=(60,84,56,255) if theme=='turtle' else (154,121,40,255)
        d.ellipse((cx-21,top+7,cx+21,top+41),fill=color,outline=a,width=2)
        for yy in [top+17,top+29]: d.line((cx-18,yy,cx+18,yy),fill=a,width=1)
        d.line((cx,top+9,cx,top+40),fill=a,width=1)
    if stars==3 and theme=='scorpion':
        bob=int(math.sin(column*.5)*2)
        d.line([(cx,top+30),(cx+23,top+18),(cx+26,top-2+bob),(cx+15,top-8+bob)],fill=a,width=4)
        d.polygon([(cx+15,top-10+bob),(cx+9,top-4+bob),(cx+19,top-4+bob)],fill=a)
    if stars==3 and theme=='ray':
        d.polygon([(cx-38,top+34),(cx-13,top+6),(cx,top+15),(cx+13,top+6),(cx+38,top+34),(cx,top+45)],fill=a,outline=rgb(p['accent'])+(245,))

def frame(p,stars,motion,column,direction):
    calls=[];head_box=None
    for item_id,value in layers(p,stars):
        item=DEFINITIONS[item_id]
        for key,layer in item.items():
            if not key.startswith('layer_'): continue
            path=resolve_layer(item_id,layer,p,stars,motion,value)
            if not path: continue
            tile=extract(path,item_id,p,stars,motion,column,direction,value,layer)
            at=((SIZE-tile.width)//2,(SIZE-tile.height)//2)
            if item_id.startswith('heads_'):
                box=tile.getbbox()
                if box: head_box=tuple(v+at[i%2] for i,v in enumerate(box))
            calls.append((layer['zPos'],tile,at))
    result=Image.new('RGBA',(SIZE,SIZE))
    detail_direction=2 if motion in ['hurt','death'] else direction
    background_details(result,p,stars,motion,column,detail_direction,head_box)
    for _,tile,at in sorted(calls,key=lambda c:c[0]): result.alpha_composite(tile,at)
    details(result,p,stars,motion,column,detail_direction,head_box)
    box=result.getbbox()
    if not box: raise ValueError('Blank frame')
    if box[0]==0 or box[1]==0 or box[2]==SIZE or box[3]==SIZE: raise ValueError(f'Clipped frame: {p["id"]}:{stars}:{motion}:{direction}:{column}')
    # The foot pivot must stay within every cropped frame, including falling poses.
    box=(min(box[0]-2,CENTER-1),min(box[1]-2,FOOT-1),max(box[2]+2,CENTER+1),max(box[3]+2,FOOT+1))
    return result.crop(box),{'x':CENTER-box[0],'y':FOOT-box[1]}

def pack(frames):
    width=1024;rects=[];anchors=[];x=y=rowheight=0
    for tile,anchor in frames:
        if x+tile.width>width: x=0;y+=rowheight+2;rowheight=0
        rects.append({'x':x,'y':y,'width':tile.width,'height':tile.height});anchors.append(anchor)
        x+=tile.width+2;rowheight=max(rowheight,tile.height)
    atlas=Image.new('RGBA',(width,y+rowheight))
    for (tile,_),rect in zip(frames,rects): atlas.alpha_composite(tile,(rect['x'],rect['y']))
    return atlas,rects,anchors

def build(p,stars):
    frames=[];directions={}
    for di,name in enumerate(DIRS):
        clips={}
        for motion in ['idle','walk','attack','cast','hurt','death','victory']:
            clips[motion]=[]
            for column in cycle(p,motion):
                clips[motion].append(len(frames));frames.append(frame(p,stars,motion,column,di))
        directions[name]=clips
    atlas,rects,anchors=pack(frames)
    name=f'{p["id"]:02}-s{stars}';path=OUTPUT/(name+'.png');atlas.save(path,optimize=True)
    c=CHARACTERS[p['id']-1];default=directions['south'];pr=rects[default['idle'][0]]
    meta={'characterId':p['id'],'stars':stars,'name':c['name'],'image':f'/assets/animations/lpc/{name}.png',
          'style':'lpc','columns':13,'rows':math.ceil(len(frames)/13),'frameWidth':SIZE,'frameHeight':SIZE,'bodyHeight':52,
          'anchorX':anchors[default['idle'][0]]['x'],'anchorY':anchors[default['idle'][0]]['y'],'imageWidth':atlas.width,'imageHeight':atlas.height,
          'frameRects':rects,'frameAnchors':anchors,'portrait':pr,'clips':default,'directions':directions,
          'license':'CC-BY-SA-4.0','credits':'/credits/lpc-credits.html','notes':'Pinned LPC layers, recolored and composed for Wolf Totem. Tribal masks and spirit details follow the animated head.'}
    (OUTPUT/(name+'.json')).write_text(json.dumps(meta,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    profile={**p,'name':c['name'],'stars':stars,'evolution':c['evolution'][stars-1],'layers':[v[0] for v in layers(p,stars)],'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    SELECTED.append(profile)
    print(f'{p["id"]:02} {c["name"]} {stars}*: {len(frames)} frames, {atlas.width}x{atlas.height}',flush=True)

def write_credits(paths):
    records={}
    with (UPSTREAM/'CREDITS.csv').open(encoding='utf-8',newline='') as f:
        for r in csv.DictReader(f,skipinitialspace=True): records[r['filename'].strip()]=r
    credits=[]
    for path in sorted(paths):
        filename=path.removeprefix('spritesheets/');row=records.get(filename)
        # The exported CSV credits uncolored originals; generated palette variants inherit that art.
        if not row:
            p=Path(filename)
            original=(p.parent.parent/(p.parent.name+'.png')).as_posix()
            row=records.get(original)
        if not row:
            choices=[c for item in DEFINITIONS.values() for c in item.get('credits',[]) if filename.startswith(c['file'].rstrip('/')+'/')]
            if choices:
                longest=max(len(c['file']) for c in choices)
                choices=[c for c in choices if len(c['file'])==longest]
                row={'filename':filename,'notes':' | '.join(c.get('notes','') for c in choices),
                     **{k:','.join(dict.fromkeys(v for c in choices for v in c[k])) for k in ['authors','licenses','urls']}}
        if not row: raise ValueError(f'No attribution record: {filename}')
        offers=[s.strip() for s in row['licenses'].split(',')]
        chosen=next((v for v in offers if v.startswith('CC-BY-SA')),None) or next((v for v in offers if v.startswith(('CC-BY ','OGA-BY ','CC0'))),None)
        if not chosen: raise ValueError(f'No supported art license for {filename}: {offers}')
        credits.append({k:row[k].strip() for k in row}|{'filename':filename,'selectedLicense':chosen})
    directory=ROOT/'public/credits';directory.mkdir(parents=True,exist_ok=True)
    data={'project':CONFIG['upstream'],'revision':CONFIG['revision'],'outputLicense':'CC-BY-SA-4.0','assets':credits}
    (directory/'lpc-credits.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    with (directory/'lpc-credits.csv').open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(credits[0]));writer.writeheader();writer.writerows(credits)
    authors=sorted({a.strip() for r in credits for a in r['authors'].split(',')})
    rows=''.join(f'<tr><td>{html.escape(r["filename"])}</td><td>{html.escape(r["authors"])}</td><td>{html.escape(r["selectedLicense"])}</td><td>'+''.join(f'<a href="{html.escape(u.strip(),quote=True)}">Fonte</a> ' for u in r['urls'].split(','))+'</td></tr>' for r in credits)
    page=f'''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Créditos LPC · Wolf Totem</title><style>body{{background:#102227;color:#e7e7db;font:16px system-ui;max-width:1200px;margin:auto;padding:32px}}a{{color:#e7c58e}}p{{line-height:1.8}}table{{font-size:12px;border-collapse:collapse;width:100%}}td,th{{text-align:left;border-bottom:1px solid #39504b;padding:12px;overflow-wrap:anywhere}}.table{{overflow:auto}}header{{margin-bottom:32px}}</style><header><a href="../">Voltar ao Wolf Totem</a><h1>Os artistas da tribo</h1><p>Personagens compostos com arte do <a href="{CONFIG['upstream']}">Universal LPC Spritesheet Character Generator</a>, revisão {CONFIG['revision']}. Créditos e licenças se referem a cada arquivo de origem efetivamente utilizado. As folhas resultantes, com recolorações, composição e detalhes tribais de Wolf Totem, são distribuídas sob <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Essa licença se aplica à arte LPC adaptada.</p><p>Autores: {html.escape(', '.join(authors))}.</p><p><a href="lpc-credits.csv">Baixar créditos CSV</a> · <a href="lpc-credits.json">Baixar créditos JSON</a> · <a href="lpc-license.txt">Condições e alterações</a></p></header><div class="table"><table><thead><tr><th>Arquivo</th><th>Autores</th><th>Licença escolhida na origem</th><th>Referências</th></tr></thead><tbody>{rows}</tbody></table></div></html>'''
    (directory/'lpc-credits.html').write_text(page,encoding='utf-8')
    (directory/'lpc-license.txt').write_text('Wolf Totem LPC adapted artwork\nLicense: Creative Commons Attribution-ShareAlike 4.0 International\nhttps://creativecommons.org/licenses/by-sa/4.0/legalcode\n\nOriginal artists, source links and original license choices are listed in lpc-credits.csv and lpc-credits.json.\nChanges: palette replacement; layer composition; frame cropping and packing; tribal face masks, markings, antlers, trunks, spirit appendages and totems; animation metadata.\nThese adapted sheets are freely available in the public GitHub repository.\nNo endorsement by the upstream artists or LPC project is implied.\n',encoding='utf-8')
    print(f'{len(credits)} attributed source files, {len(authors)} credited authors')

def previews():
    REPORT.mkdir(parents=True,exist_ok=True)
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',14)
    for era in range(1,6):
        heroes=[c for c in CHARACTERS if c['cost']==era];im=Image.new('RGB',(1100,math.ceil(len(heroes)/5)*210),(16,34,39));d=ImageDraw.Draw(im)
        for n,c in enumerate(heroes):
            x=n%5*220;y=n//5*210;d.text((x+12,y+10),f'{c["id"]:02} {c["name"]}',font=font,fill=(229,197,142))
            for stars in [1,2,3]:
                meta=json.loads((OUTPUT/f'{c["id"]:02}-s{stars}.json').read_text(encoding='utf-8'));r=meta['portrait']
                sheet=Image.open(OUTPUT/f'{c["id"]:02}-s{stars}.png');tile=sheet.crop((r['x'],r['y'],r['x']+r['width'],r['y']+r['height']))
                scale=min(65/tile.width,130/tile.height);tile=tile.resize((int(tile.width*scale),int(tile.height*scale)),Image.Resampling.NEAREST)
                im.paste(tile,(x+5+(stars-1)*70+(65-tile.width)//2,y+170-tile.height),tile)
                d.text((x+22+(stars-1)*70,y+178),f'{stars}*',font=font,fill=(169,190,177))
        im.save(REPORT/f'era-{era}.png')

def check_outputs():
    hashes=set();total=0
    for p in PROFILES:
        for stars in [1,2,3]:
            stem=f'{p["id"]:02}-s{stars}'
            meta=json.loads((OUTPUT/(stem+'.json')).read_text(encoding='utf-8'))
            image=Image.open(OUTPUT/(stem+'.png')).convert('RGBA')
            assert image.size==(meta['imageWidth'],meta['imageHeight']),stem
            assert list(meta['directions'])==DIRS,stem
            indices=[]
            for direction in DIRS:
                for motion in ['idle','walk','attack','cast','hurt','death','victory']:
                    clip=meta['directions'][direction][motion]
                    assert len(clip)==len(cycle(p,motion)),(stem,direction,motion)
                    indices.extend(clip)
            assert sorted(set(indices))==list(range(len(meta['frameRects']))),stem
            for r,a in zip(meta['frameRects'],meta['frameAnchors']):
                assert 0<=r['x'] and 0<=r['y'] and r['x']+r['width']<=image.width and r['y']+r['height']<=image.height,stem
                assert 0<a['x']<r['width'] and 0<a['y']<r['height'],stem
                tile=image.crop((r['x'],r['y'],r['x']+r['width'],r['y']+r['height']))
                box=tile.getbbox()
                assert box and box[0]>0 and box[1]>0 and box[2]<tile.width and box[3]<tile.height,stem
            hashes.add(hashlib.sha256((OUTPUT/(stem+'.png')).read_bytes()).hexdigest())
            total+=len(meta['frameRects'])
    assert len(hashes)==165,'Every form must have a distinct atlas'
    print(f'Validated 165 distinct forms, {total} nonempty frames, four directions and seven clips per form.',flush=True)

def write_roster():
    roster=[{'id':c['id'],'name':c['name'],'title':c['title'],'era':c['cost'],'themeLabel':next((trait for trait in c['traits'] if trait.startswith('Espírito')),c['traits'][-1])} for c in CHARACTERS]
    (ROOT/'public/assets/lpc-roster.json').write_text(json.dumps(roster,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

if __name__=='__main__':
    args=argparse.ArgumentParser();args.add_argument('--fetch',action='store_true');args.add_argument('--ids');args.add_argument('--check',action='store_true');opts=args.parse_args()
    if not UPSTREAM.exists(): raise SystemExit('Clone the pinned upstream into artifacts/lpc/upstream first (see docs/production/LPC.md).')
    revision=git('rev-parse','HEAD',capture_output=True,text=True).stdout.strip()
    if revision!=CONFIG['revision']: raise SystemExit('Upstream revision differs from the pinned profile source.')
    load_catalog();required=required_paths()
    print(f'{len(required)} required source layers',flush=True)
    if opts.fetch: fetch_assets(required)
    missing=[p for p in required if not (UPSTREAM/p).exists()]
    if missing: raise SystemExit(f'{len(missing)} source PNGs missing. Run with --fetch.')
    if opts.check: check_outputs();raise SystemExit(0)
    OUTPUT.mkdir(parents=True,exist_ok=True);REPORT.mkdir(parents=True,exist_ok=True)
    wanted=set(map(int,opts.ids.split(','))) if opts.ids else set(range(1,56))
    for p in PROFILES:
        if p['id'] in wanted:
            for stars in [1,2,3]: build(p,stars)
    (REPORT/'profiles.json').write_text(json.dumps(SELECTED,ensure_ascii=False,indent=2),encoding='utf-8')
    write_credits(required)
    if not opts.ids: previews();write_roster();check_outputs()
