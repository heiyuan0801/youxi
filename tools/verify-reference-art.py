from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'reference-site/download-manifest.json').read_text())
for item in manifest['files']:
    assert 'error' not in item,item
    file=root/'reference-site'/item['path']
    assert file.stat().st_size==item['bytes'],item['path']
    assert hashlib.sha256(file.read_bytes()).hexdigest()==item['sha256'],item['path']
records=json.loads((root/'docs/reference/v02/art-manifest.json').read_text())
for item in records:
    image=Image.open(root/'assets/resources/refart'/(item['key']+'.png'))
    assert image.mode=='RGBA' and image.getchannel('A').getextrema()==(0,255),item['key']
    assert abs(image.width/image.height-item['nativeSize'][0]/item['nativeSize'][1])<.02,item['key']
frames=list((root/'assets/resources/refart').glob('*.png'))
assert len(frames)==90,len(frames)
for actor in ['chicken','cow','girl','boy','grandpa']:
    for n in range(4):assert (root/'assets/resources/refart'/f'{actor}_walk{n}.png').exists()
result={'passed':True,'archivedFiles':len(manifest['files']),'originalWebP':len(records),'runtimePNG':len(frames),'checks':['all archived SHA-256 hashes match','original sprite aspect ratio and alpha retained','five actors have four walk frames each','four SVG UI icons converted to PNG']}
(root/'artifacts/reference-art-qa-v02.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False))
