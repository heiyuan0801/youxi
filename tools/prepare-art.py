"""Deterministically slice generated art, align animation pivots, and export GIF preview."""
from PIL import Image
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/resources/art'
names=['house','barn','windmill','coop','market','tree','cherry','pond','wheat','carrot','strawberry','tomato','corn','pumpkin','hen','cow']
sheet=Image.open(ROOT/'docs/art/farm-atlas-source.png').convert('RGBA')
manifest=[]
for i,name in enumerate(names):
    col,row=i%4,i//4
    cell=sheet.crop((col*sheet.width//4,row*sheet.height//4,(col+1)*sheet.width//4,(row+1)*sheet.height//4))
    bbox=cell.getchannel('A').point(lambda x:255 if x>20 else 0).getbbox()
    if not bbox:raise ValueError(f'Empty sprite: {name}')
    cell=cell.crop(bbox)
    size=384 if i<8 else 192
    cell.thumbnail((size-8,size-8),Image.Resampling.LANCZOS)
    result=Image.new('RGBA',(size,size))
    result.alpha_composite(cell,((size-cell.width)//2,size-4-cell.height))
    result.save(OUT/f'{name}.png',optimize=True)
    manifest.append({'key':name,'size':[size,size],'sourceCell':i,'pivot':'bottom-center','alpha':result.getchannel('A').getextrema(),'source':'image_gen built-in','role':'game-runtime'})
anim=Image.open(ROOT/'docs/art/hen-idle-source.png').convert('RGBA')
frames=[]
for i in range(6):
    col,row=i%3,i//3
    cell=anim.crop((col*anim.width//3,row*anim.height//2,(col+1)*anim.width//3,(row+1)*anim.height//2))
    cell=cell.crop(cell.getchannel('A').point(lambda x:255 if x>20 else 0).getbbox())
    cell.thumbnail((172,180),Image.Resampling.LANCZOS)
    frame=Image.new('RGBA',(192,192))
    frame.alpha_composite(cell,((192-cell.width)//2,188-cell.height))
    frame.save(OUT/f'hen-idle-{i}.png',optimize=True)
    frames.append(frame)
    manifest.append({'key':f'hen-idle-{i}','size':[192,192],'pivot':'bottom-center','source':'image_gen built-in','role':'animation-frame'})
# GIF is a review artifact; Cocos plays the alpha-preserving PNG sequence.
gif=[]
for frame in frames:
    bg=Image.new('RGBA',frame.size,'#e9f4d7');bg.alpha_composite(frame)
    gif.append(bg.convert('RGB'))
gif[0].save(ROOT/'docs/art/hen-idle.gif',save_all=True,append_images=gif[1:],duration=[180,180,140,180,180,260],loop=0)
(ROOT/'docs/art/asset-manifest.json').write_text(json.dumps({'atlasSize':sheet.size,'animationSourceSize':anim.size,'generator':'Built-in image_gen; no model/version selector exposed.','items':manifest},ensure_ascii=False,indent=2))
print(f'Prepared {len(manifest)} transparent sprites and hen-idle.gif')
