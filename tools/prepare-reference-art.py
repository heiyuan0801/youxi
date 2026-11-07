from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
out=root/'assets/resources/refart';out.mkdir(parents=True,exist_ok=True)
records=[];runtime={}
for f in sorted((root/'reference-site/sprites').rglob('*.webp')):
    im=Image.open(f).convert('RGBA');native=im.size
    key=f.stem
    if f.parent.name=='anim':key=f.stem
    cap=768 if key in ['farmhouse','barn','windmill','market','school','logo'] else 384
    im.thumbnail((cap,cap),Image.Resampling.LANCZOS)
    im.save(out/(key+'.png'),optimize=True)
    alpha=im.getchannel('A').resize((32,32),Image.Resampling.BILINEAR)
    bits=''.join('1' if a>40 else '0' for a in alpha.getdata())
    mask=''.join(format(int(bits[i:i+4],2),'x') for i in range(0,1024,4))
    runtime[key]={'w':im.width,'h':im.height,'mask':mask}
    records.append({'key':key,'source':str(f.relative_to(root)),'nativeSize':native,'runtimeSize':im.size,'alpha':im.getchannel('A').getextrema()})
(root/'docs/reference/v02/art-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
for f in sorted((root/'reference-site/ui-icons').glob('ui_*.png')):
    im=Image.open(f).convert('RGBA');im.save(out/f.name,optimize=True)
    alpha=im.getchannel('A').resize((32,32),Image.Resampling.BILINEAR)
    bits=''.join('1' if a>40 else '0' for a in alpha.getdata())
    runtime[f.stem]={'w':im.width,'h':im.height,'mask':''.join(format(int(bits[i:i+4],2),'x') for i in range(0,1024,4))}
(root/'assets/scripts/RefArtData.ts').write_text('export const REF_ART:Record<string,{w:number;h:number;mask:string}>='+json.dumps(runtime,separators=(',',':'))+';\n')
print(f'Prepared {len(records)} reference images; original aspect ratios and alpha preserved')
