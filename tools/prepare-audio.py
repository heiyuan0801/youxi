from pathlib import Path
import subprocess,wave,array,math,random,json,hashlib
root=Path(__file__).resolve().parents[1];out=root/'assets/resources/audio';out.mkdir(parents=True,exist_ok=True)
rate=22050
def save(name,data):
    peak=max(abs(x) for x in data) or 1;gain=.72/peak
    samples=array.array('h',(round(max(-1,min(1,x*gain))*32767) for x in data))
    with wave.open(str(out/(name+'.wav')),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(samples.tobytes())
records=[]
for name,seconds in [('chicken',1.2),('cow',2.25)]:
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(root/'docs/audio'/(name+'-original.mp3')),'-ar',str(rate),'-ac','1','-f','s16le','-'])
    pcm=array.array('h',raw);span=int(seconds*rate);step=rate//20
    energies=[sum(v*v for v in pcm[i:i+step]) for i in range(0,len(pcm),step)];blocks=math.ceil(span/step)
    index=max(range(max(1,len(energies)-blocks)),key=lambda i:sum(energies[i:i+blocks]));start=max(0,index*step-int(.03*rate));clip=[v/32768 for v in pcm[start:start+span]]
    for i in range(len(clip)):clip[i]*=min(1,i/(rate*.012),(len(clip)-1-i)/(rate*.09))
    save(name,clip);records.append({'name':name,'start':start/rate,'seconds':len(clip)/rate})
rng=random.Random(127)
harvest=[]
for i in range(int(rate*.32)):
    t=i/rate;noise=(rng.random()*2-1)*math.exp(-t*45)*.28
    pluck=math.sin(2*math.pi*(640*t+90*t*t))*math.exp(-t*16)*.3
    pop=math.sin(2*math.pi*180*t)*math.exp(-t*42)*.18
    harvest.append((noise+pluck+pop)*min(1,t/.006))
save('harvest',harvest)
notes=[523.25,659.25,783.99,1046.5];celebration=[]
for i in range(int(rate*1.35)):
    t=i/rate;v=0
    for j,f in enumerate(notes):
        a=t-j*.105
        if a>=0:v+=(math.sin(2*math.pi*f*a)+.22*math.sin(2*math.pi*f*2*a))*min(1,a/.012)*math.exp(-a*4.2)*.18
    celebration.append(v*min(1,(1.35-t)/.12))
save('levelup',celebration)
for f in out.glob('*.wav'):
    with wave.open(str(f)) as w:seconds=w.getnframes()/w.getframerate()
    records.append({'file':str(f.relative_to(root)),'seconds':seconds,'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
(root/'docs/audio/manifest.json').write_text(json.dumps(records,indent=2));print(json.dumps(records))
