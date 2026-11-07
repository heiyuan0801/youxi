from pathlib import Path
from PIL import Image
import json,shutil
root=Path(__file__).resolve().parents[1]
source=Path('/Users/jiesen/.codex/generated_images/01a1af6c-bba5-7531-8a7b-ecb1febbb50f/exec-3037630d-cc76-4ef4-bcc5-73290c01534d.png')
folder=root/'docs/expansion/v03';folder.mkdir(parents=True,exist_ok=True)
atlas=folder/'items-atlas.png'
if not atlas.exists():shutil.copy2(source,atlas)
image=Image.open(atlas).convert('RGBA');out=root/'assets/resources/expansion';out.mkdir(parents=True,exist_ok=True)
keys=['bread','cheese','jam','pie','fish','goldenFish','bait','watering'];records=[]
for i,key in enumerate(keys):
    x=i%4;y=i//4;tile=image.crop((x*image.width//4,y*image.height//2,(x+1)*image.width//4,(y+1)*image.height//2))
    bbox=tile.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();assert bbox,key
    tile=tile.crop(bbox);tile.thumbnail((256,256),Image.Resampling.LANCZOS)
    pad=Image.new('RGBA',(tile.width+12,tile.height+12));pad.alpha_composite(tile,(6,6));pad.save(out/(key+'.png'),optimize=True)
    records.append({'key':key,'cell':[x,y],'size':pad.size,'alpha':pad.getchannel('A').getextrema()})
(folder/'art-manifest.json').write_text(json.dumps({'tool':'built-in image_gen','source':'items-atlas.png','images':records},ensure_ascii=False,indent=2))
(root/'assets/scripts/ExpansionArt.ts').write_text('export const EXPANSION_ART='+json.dumps(keys)+';\n')
print(json.dumps(records))
