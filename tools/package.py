from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib,json
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text())['version']
out=root/'artifacts'
tag='v'+''.join(version.split('.')[:2])
def files(folder):
    return [p for p in folder.rglob('*') if p.is_file() and '.DS_Store' not in p.parts and '__pycache__' not in p.parts]
def archive(name,entries):
    target=out/name
    with ZipFile(target,'w',ZIP_DEFLATED,compresslevel=6) as z:
        for path,arc in entries:z.write(path,arc)
    with ZipFile(target) as z:assert z.testzip() is None
    return {'file':name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
source=[]
for name in ['assets','settings','tools','tests','docs','reference-site']:
    source.extend((p,'sunny-farm/'+str(p.relative_to(root))) for p in files(root/name))
for name in ['README.md','package.json','package-lock.json','tsconfig.json','tsconfig.check.json','build-config.json','.gitignore']:
    source.append((root/name,'sunny-farm/'+name))
for p in out.iterdir():
    if p.is_file() and (tag in p.name) and not p.name.startswith(('delivery-','SHA256SUMS-')) and ('first' not in p.name) and ('failed' not in p.name) and ('debug' not in p.name) and p.suffix in ['.png','.gif','.json','.txt','.log']:
        source.append((p,'sunny-farm/artifacts/'+p.name))
records=[archive(f'sunny-farm-source-{version}.zip',source),
         archive(f'sunny-farm-h5-{version}.zip',[(p,str(p.relative_to(root/'build/web-desktop'))) for p in files(root/'build/web-desktop')]),
         archive('cozy-farm-public-site-2026-11-06.zip',[(p,'reference-site/'+str(p.relative_to(root/'reference-site'))) for p in files(root/'reference-site')])]
(out/f'SHA256SUMS-{tag}.txt').write_text(''.join(f"{r['sha256']}  {r['file']}\n" for r in records))
(out/f'delivery-{tag}.json').write_text(json.dumps({'version':version,'packages':records},indent=2))
print(json.dumps(records,indent=2))
