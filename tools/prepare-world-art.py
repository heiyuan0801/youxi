from pathlib import Path
from PIL import Image
import shutil,json
root=Path(__file__).resolve().parents[1];folder=root/'docs/expansion/v04';out=root/'assets/resources/worldart';out.mkdir(parents=True,exist_ok=True)
atlas=folder/'world-items-atlas.png'
if not atlas.exists():shutil.copy2('/Users/jiesen/.codex/generated_images/01a1af6c-bba5-7531-8a7b-ecb1febbb50f/exec-99ac8896-7a0f-4b5d-bd43-74d1e86f1149.png',atlas)
im=Image.open(atlas).convert('RGBA');records=[];keys=['apple','honey','orchardBasket','beehive']
for i,key in enumerate(keys):
 x=i%2;y=i//2;tile=im.crop((x*im.width//2,y*im.height//2,(x+1)*im.width//2,(y+1)*im.height//2));bbox=tile.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();assert bbox;tile=tile.crop(bbox);tile.thumbnail((384 if key=='beehive' else 256,384 if key=='beehive' else 256),Image.Resampling.LANCZOS);tile.save(out/(key+'.png'),optimize=True);records.append({'key':key,'size':tile.size,'alpha':tile.getchannel('A').getextrema()})
(folder/'art-manifest.json').write_text(json.dumps({'tool':'built-in image_gen','atlas':'world-items-atlas.png','images':records},ensure_ascii=False,indent=2))
(root/'assets/scripts/WorldArt.ts').write_text('export const WORLD_ART='+json.dumps(keys)+';\n');print(records)
