import type { Graphics } from 'cc';
import type { MovingAnimal } from './FarmMotion';
import type { PatrolKind } from './FarmActivities';
import { animalClip } from './AnimalAnimation';
import type { Painter, XY } from './Drawing';

const clamp = (n:number) => Math.max(0, Math.min(1, n));
const fadeInOut = (t:number) => Math.sin(Math.PI * clamp(t));

export function drawAnimalAccent(p:Painter,g:Graphics,actor:MovingAnimal,t:number,w:number,h:number){
  const accent=animalClip(actor.species)?.accent;
  if(!accent||t<=0||t>=1)return;
  const x=p.w/2,y=p.h/2,back=actor.flip?-1:1;
  if(accent==='plume'){
    const open=fadeInOut(t),silver=actor.species==='whitePeacock';
    const baseX=x+back*w*.19,baseY=y-h*.37;
    for(let i=0;i<7;i++){
      const angle=(i-3)*.34*open+back*.24;
      const length=h*(.48+open*.36)*(1-Math.abs(i-3)*.07);
      const endX=baseX+Math.sin(angle)*length,endY=baseY-Math.cos(angle)*length;
      const alpha=255*open;
      p.line(g,[[baseX,baseY],[endX,endY]],silver?'#b6ccd7':'#2f866a',2.6,alpha);
      p.ellipse(g,endX,endY,w*.085,w*.135,silver?'#eff9ff':'#72c591',alpha);
      p.ellipse(g,endX,endY,w*.047,w*.072,silver?'#a9b6ef':'#edd26a',alpha);
      p.ellipse(g,endX,endY-1,w*.025,w*.041,silver?'#8f8ac8':'#3d8bbe',alpha);
    }
    return;
  }
  if(accent==='wag'){
    const swing=Math.sin(t*27)*w*.09,alpha=180*fadeInOut(t);
    for(const offset of [0,7]){
      const xx=x+back*(w*.48+offset),yy=y-h*.66+swing;
      p.line(g,[[xx,yy],[xx+back*4,yy-4],[xx+back*3,yy-9]],'#fff4d8',2,alpha);
    }
    return;
  }
  if(accent==='dust'){
    const life=clamp((t-.22)/.65),alpha=(1-life)*140;
    if(t<.22)return;
    for(let i=0;i<4;i++){
      const xx=x+(i-1.5)*w*(.14+life*.12);
      p.ellipse(g,xx,y-2-life*(4+i*2),3+life*2,2+life,'#e4c28d',alpha);
    }
    return;
  }
  const alpha=230*fadeInOut(t),palette=accent==='prism'
    ?['#ff8fb0','#ffd86a','#88deab','#92ccff','#bcb0ff']
    :accent==='warm'?['#ffce56','#ffeaac']:accent==='feathers'?['#fff3d1','#ffffff']:['#bfa9ff','#f9e6a2','#ffffff'];
  for(let i=0;i<5;i++){
    const angle=i*Math.PI*.39+t;
    const xx=x+Math.cos(angle)*w*(.35+t*.3);
    const yy=y-h*.46+Math.sin(angle)*h*.39-t*8;
    const color=palette[i%palette.length],r=2+1.6*fadeInOut(t+i*.015);
    if(accent==='feathers'){
      p.ellipse(g,xx,yy,r*1.2,r*2,color,alpha);
      p.line(g,[[xx-r,yy+r*2],[xx+r*.55,yy-r]],'#eee2be',1,alpha);
    }else drawSpark(p,g,xx,yy,r,color,alpha);
  }
}

function drawSpark(p:Painter,g:Graphics,x:number,y:number,r:number,color:string,alpha:number){
  p.path(g,[[x,y-r*1.8],[x+r*.35,y-r*.35],[x+r*1.5,y],[x+r*.35,y+r*.35],
    [x,y+r*1.8],[x-r*.35,y+r*.35],[x-r*1.5,y],[x-r*.35,y-r*.35]],color,undefined,1,alpha);
}

function drawMouse(p:Painter,g:Graphics,x:number,y:number,dir:number,alpha:number,t:number){
  p.line(g,[[x-dir*8,y-4],[x-dir*13,y-2],[x-dir*18,y-5+Math.sin(t*24)*2]],'#ad8886',2,alpha);
  p.ellipse(g,x,y,9,5.4,'#a98c82',alpha);
  p.ellipse(g,x+dir*6.3,y-3.1,6.2,4.6,'#bc9f91',alpha);
  p.ellipse(g,x+dir*3.1,y-7.2,3.5,3.4,'#d8b3a5',alpha);
  p.ellipse(g,x+dir*3.25,y-7.2,1.7,1.7,'#eab5b6',alpha);
  p.ellipse(g,x+dir*8,y-4,1.1,1.15,'#3f302e',alpha);
  p.ellipse(g,x+dir*12,y-2.7,1.35,1.1,'#e8a7a4',alpha);
}

function drawBag(p:Painter,g:Graphics,x:number,y:number,alpha:number){
  p.path(g,[[x-7,y-14],[x+6,y-14],[x+11,y-4],[x+9,y+5],[x-9,y+5],[x-11,y-4]],
    '#ca8e4a','#805438',1.5,alpha);
  p.path(g,[[x-5,y-17],[x-9,y-23],[x+8,y-22],[x+5,y-16]],'#edc27d','#805438',1.3,alpha);
  p.line(g,[[x-7,y-15],[x+7,y-15]],'#805438',2.3,alpha);
  p.line(g,[[x-2,y-13],[x-5,y-7],[x-5,y-3]],'#e9ba79',1.6,alpha);
}

export function drawPatrolCue(p:Painter,g:Graphics,x:number,y:number,w:number,h:number,actor:MovingAnimal,
  poseX:number,lift:number,cue:{kind:PatrolKind;found:boolean;progress:number}){
  const t=cue.progress,dir=actor.flip?1:-1;
  if(!cue.found){
    const alpha=255*fadeInOut(t),xx=x+dir*w*.38,yy=y-h*.96-11*t;
    p.ellipse(g,xx,yy,9,10,'#fff4d9',alpha);
    p.line(g,[[xx-3,yy-3],[xx-1,yy-6],[xx+3,yy-5],[xx+4,yy-2],[xx,yy+1]],'#9d7452',1.5,alpha);
    p.ellipse(g,xx,yy+5,1.1,1.1,'#9d7452',alpha);
    return;
  }
  if(cue.kind==='cat'){
    const start=clamp((t-.12)/.22),dash=clamp((t-.28)/.67);
    const xx=x+dir*w*(.36+dash*.93+dash*dash*.52),yy=y-2-Math.abs(Math.sin(dash*24))*5;
    const alpha=255*start*(1-clamp((t-.79)/.19));
    drawMouse(p,g,xx,yy,dir,alpha,t);
    if(t>.29&&t<.78){
      const trailAlpha=150*fadeInOut((t-.29)/.49);
      for(let i=0;i<3;i++)p.ellipse(g,xx-dir*(17+i*5),y-2+i*.5,1.8+i*.5,1.4,'#eee4c7',trailAlpha);
    }
    if(t>.57)for(let i=0;i<4;i++){
      const k=clamp((t-.57)/.43);
      p.ellipse(g,x+dir*w*.7+(i-1.5)*7*k,y-2-k*(5+i*3),2.5+k*2,2,'#e4c28d',150*(1-k));
    }
    return;
  }
  const pick=clamp((t-.34)/.26),alpha=255*(1-clamp((t-.81)/.19));
  const floorX=x+dir*w*.59,mouthX=x+poseX+dir*w*.37;
  const bagX=floorX+(mouthX-floorX)*pick,bagY=y-6-(lift+h*.33)*pick;
  drawBag(p,g,bagX,bagY,alpha);
  if(t>.45){
    const shine=fadeInOut((t-.45)/.55);
    drawSpark(p,g,bagX+dir*12,bagY-18,4,'#ffdc76',230*shine);
    drawSpark(p,g,bagX-dir*9,bagY-10,2.5,'#ffffff',210*shine);
  }
}

export function drawPatrolTrail(p:Painter,g:Graphics,x:number,y:number,w:number,h:number,actor:MovingAnimal,t:number){
  const dir=actor.flip?1:-1;
  if(actor.action==='patrol-sniff'){
    for(let i=0;i<3;i++){
      const phase=(t*.9+i/3)%1,xx=x+dir*(w*.39+phase*15),yy=y-h*.22-phase*13;
      p.ellipse(g,xx,yy,2.4+phase*2.3,1.7+phase,'#fff5dc',Math.sin(phase*Math.PI)*170);
    }
    return;
  }
  if(actor.action!=='walk'&&actor.action!=='run')return;
  for(let i=0;i<3;i++){
    const phase=(t*2+i/3)%1,xx=x-dir*(w*.24+phase*29),yy=y+4+(i%2)*3;
    const alpha=130*(1-phase),color='#c7a87e';
    const center:XY=[xx,yy];
    p.ellipse(g,...center,2.9,2,color,alpha);
    for(let toe=0;toe<3;toe++)p.ellipse(g,xx-2+toe*2,yy-2.8,1.05,1,color,alpha);
  }
}
