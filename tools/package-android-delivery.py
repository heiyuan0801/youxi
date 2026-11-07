"""Package the signed APK, editable gameplay text and artwork (no PDF)."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json, hashlib, shutil

root = Path(__file__).resolve().parents[1]
version = json.loads((root/'package.json').read_text())['version']
docs = root/f'docs/release-android-{version}'
releases = root/'releases'
apk = releases/f'QingyeTales-{version}-android-arm64.apk'
digest = hashlib.sha256(apk.read_bytes()).hexdigest()
assert apk.with_suffix('.apk.sha256').read_text().split()[0] == digest
licenses = docs/'licenses'
licenses.mkdir(exist_ok=True)
shutil.copy(root/'assets/resources/fonts/OFL-NotoSansSC.txt', licenses/'OFL-NotoSansSC.txt')
shutil.copy(root/'docs/audio/CREDITS.md', licenses/'音效来源.md')
shutil.copy(root/'docs/expansion/v07/cover-prompt.json', docs/'media/cover-prompt.json')
entries = [(apk, apk.name), (apk.with_suffix('.apk.sha256'), apk.name+'.sha256')]
entries += [(p, str(p.relative_to(docs))) for p in sorted(docs.rglob('*')) if p.is_file() and p.suffix.lower() in {'.md','.txt','.png','.json'} and p.name!='.DS_Store']
target = releases/f'QingyeTales-{version}-delivery.zip'
with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as z:
    for source, name in entries:
        z.write(source, name)
with ZipFile(target) as z:
    assert z.testzip() is None
    assert not any(n.lower().endswith(('.pdf','.p12','.jks','.sqlite')) for n in z.namelist())
    assert hashlib.sha256(z.read(apk.name)).hexdigest() == digest
result = {'version':version,'apk':{'file':apk.name,'bytes':apk.stat().st_size,'sha256':digest},'bundle':{'file':target.name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()},'files':len(entries),'pdfIncluded':False}
target.with_suffix('.zip.sha256').write_text(result['bundle']['sha256']+'  '+target.name+'\n')
(releases/f'QingyeTales-{version}-delivery.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False,indent=2))
