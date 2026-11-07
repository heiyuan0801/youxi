"""Archive the public static files of the user-specified reference site."""
from urllib.request import urlopen, Request
from urllib.parse import urljoin, urlparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import re,json,hashlib,argparse
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'reference-site'
BASE='https://cozy-farm-2d.rork.app/'
DEST.mkdir(exist_ok=True)
parser=argparse.ArgumentParser();parser.add_argument('--refresh',action='store_true',help='Fetch again instead of retaining the archived snapshot');args=parser.parse_args()
archive=DEST/'download-manifest.json'
seed=[f['url'] for f in json.loads(archive.read_text())['files']] if archive.exists() else []
seed += [BASE]
seen=set();manifest=[];queue=seed
def fetch(url):
    rel=urlparse(url).path.lstrip('/') or 'index.html'
    try:
        target=DEST/rel
        data=target.read_bytes() if target.exists() and not args.refresh else urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=40).read()
        target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
        refs=[]
        if rel.endswith(('.js','.css','.html')):
            s=data.decode('utf-8')
            for link in re.findall(r'''(?:["'`])((?:\./|/assets/|/sprites/)[^"'`\s<>]+?\.(?:js|css|webp|png|jpg|woff2|ttf))(?:["'`])''',s):
                refs.append(urljoin(url,link))
            if rel=='index.html':
                refs.extend(urljoin(BASE,l) for l in re.findall(r'''(?:src|href)=["'](/[^"']+\.(?:js|css|png|jpg))["']''',s))
        return {'url':url,'path':rel,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()},refs
    except Exception as e:return {'url':url,'error':str(e)},[]
with ThreadPoolExecutor(max_workers=7) as pool:
    while queue:
        batch=list(dict.fromkeys(u for u in queue if u not in seen and '${' not in u and urlparse(u).netloc==urlparse(BASE).netloc))
        seen.update(batch);queue=[]
        for item,refs in pool.map(fetch,batch):
            manifest.append(item);queue.extend(u for u in refs if u not in seen)
(DEST/'download-manifest.json').write_text(json.dumps({'source':BASE,'purpose':'User requested website/static-code/art scan for Cocos reconstruction','files':manifest},ensure_ascii=False,indent=2))
print(f'Downloaded {sum("error" not in x for x in manifest)} files; {sum("error" in x for x in manifest)} failures')
