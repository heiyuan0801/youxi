from pathlib import Path
from PIL import Image
import json,sys
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1] if len(sys.argv)>1 else '/Volumes/mac/tmp/sunny-farm-motion-v02')
times=json.loads((source/'timing.json').read_text())
images=[Image.open(f).convert('RGB').resize((960,540),Image.Resampling.LANCZOS) for f in sorted(source.glob('frame-*.jpg'))]
palette=images[0].quantize(colors=255)
frames=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in images]
durations=[max(80,min(300,times[i+1]['time']-t['time'])) if i+1<len(times) else 150 for i,t in enumerate(times)]
target=root/'artifacts/v02-farm-motion.gif'
frames[0].save(target,save_all=True,append_images=frames[1:],duration=durations,loop=0,optimize=True,disposal=1)
check=Image.open(target);assert check.n_frames==36
print(f'{target}: {check.n_frames} frames, {target.stat().st_size} bytes')
