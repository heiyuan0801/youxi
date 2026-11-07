"""Normalize imagegen atlases into padded runtime sprites, alpha masks and provenance.
Pillow only performs pipeline cropping/normalization, not image generation.
"""
from pathlib import Path
from PIL import Image
import json, shutil, hashlib
ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'docs/expansion/v05'
OUT=ROOT/'assets/resources/lifeart'
OUT.mkdir(parents=True,exist_ok=True)
KEYS={
 'animals':'duck sheep pig goat rabbit cat dog horse peacock goldenSheep rainbowCow unicorn',
 'crops':'rice potato cabbage cucumber soybean cotton sugarcane cocoa coffee watermelon grape orange sunflowerCrop lavender auroraBerry goldenPumpkin',
 'goods-a':'flour feed wool truffle goatMilk duckEgg fur feather butter yogurt appleJuice orangeJuice grapeJuice cloth clothes sugar',
 'goods-b':'chocolate candy vinegar planks fruitCan vegCan cake cookies wood ore coal gem herb ice rainbowMilk goldenWool',
 'buildings':'factory_mill factory_bakery factory_dairy factory_juice factory_textile factory_candy factory_brewing factory_lumber factory_cannery',
 'places':'mineEntrance forestCamp beachPier snowCabin bed sofa desk rug housePlant lamp bookshelf woodenSign'}
meta={}; manifest=[]
for q in json.loads((DOC/'atlas-prompts.json').read_text()):
 src=Path(q['source']);target=DOC/(q['name']+'-atlas.png');shutil.copy2(src,target)
 atlas=Image.open(src).convert('RGBA');cols,rows=q['cols'],q['rows'];keys=KEYS[q['name']].split()
 for i,key in enumerate(keys):
  x,y=i%cols,i//cols;cell=atlas.crop((round(x*atlas.width/cols),round(y*atlas.height/rows),round((x+1)*atlas.width/cols),round((y+1)*atlas.height/rows)))
  # imagegen alpha=1 RGB preview noise is discarded, preserving visible artwork.
  alpha=cell.getchannel('A').point(lambda a:0 if a<32 else a);cell.putalpha(alpha)
  bbox=alpha.getbbox();assert bbox,key
  cell=cell.crop(bbox);cap=384 if q['name']=='buildings' or key in keys[:4] and q['name']=='places' else 256
  cell.thumbnail((cap-16,cap-16),Image.Resampling.LANCZOS)
  sprite=Image.new('RGBA',(cell.width+16,cell.height+16));sprite.alpha_composite(cell,(8,8));sprite.save(OUT/(key+'.png'))
  mask=sprite.getchannel('A').resize((32,32),Image.Resampling.BOX);bits=''.join('1' if a>32 else '0' for a in mask.getdata());hexmask=''.join(format(int(bits[j:j+4],2),'x') for j in range(0,len(bits),4))
  meta[key]={'w':sprite.width,'h':sprite.height,'mask':hexmask}
  manifest.append({'key':key,'atlas':target.name,'cell':i,'width':sprite.width,'height':sprite.height,'sha256':hashlib.sha256((OUT/(key+'.png')).read_bytes()).hexdigest()})
(ROOT/'assets/scripts/LifeArt.ts').write_text('export const LIFE_ART:Record<string,{w:number;h:number;mask:string}>='+json.dumps(meta,separators=(',',':'))+';\n')
(DOC/'art-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(f'Normalized {len(meta)} sprites; all PNG RGBA with 8px alpha padding.')
