import {pathTo,walkable,BENCHES,Tile} from './SceneLayout';
import {AnimalId} from './FarmCatalog';
import type {PatrolKind} from './FarmActivities';
import {animalClip,gaitPose,sampleKeys,SNIFF_POSE,CAT_CHASE_POSE,DOG_FIND_POSE} from './AnimalAnimation';
import type {AnimalPose} from './AnimalAnimation';
export type AnimalAction='walk'|'run'|'idle'|'peck'|'scratch'|'flap'|'graze'|'tail'|'moo'|'sleep'|'startle'|'happy'|'signature'|'patrol-sniff'|'patrol-result';
export interface MovingAnimal {id:number;kind:'chicken'|'cow';species:AnimalId;x:number;y:number;tx:number;ty:number;action:AnimalAction;left:number;frame:number;flip:boolean;hop:number;phase:number;pasture:boolean;path:Tile[];poseAt:number;}
interface PatrolTour { actor:MovingAnimal; key:string; stops:readonly Tile[]; index:number; }
interface PatrolCue {
  actor:MovingAnimal;
  kind:PatrolKind;
  goal:Tile;
  found:boolean;
  pace:number;
  start:number|null;
  duration:number;
  onBeat:(()=>void)|null;
}
export interface Walker {kind:'girl'|'boy'|'grandpa';x:number;y:number;path:Tile[];state:'idle'|'walk'|'sit'|'wave'|'chat';left:number;frame:number;flip:boolean;bench:number;say:string;sayUntil:number;}
export interface Vehicle {kind:'car'|'truck';x:number;lane:number;speed:number;delay:number;deliveryUntil:number;}
export class FarmMotion {
  time=0;animals=new Map<number,MovingAnimal>();private mapWidth=22;private roaming=false;private routed=false;
  private tour:PatrolTour|null=null;
  private cue:PatrolCue|null=null;
  walkers:Walker[]=[{kind:'girl',x:8.5,y:4.5},{kind:'boy',x:7.5,y:12.5},{kind:'grandpa',x:14.5,y:18.5}].map((a,i)=>({...a,kind:a.kind as Walker['kind'],path:[],state:'idle',left:1+i*.4,frame:i,flip:false,bench:-1,say:'',sayUntil:0}));
  vehicles:Vehicle[]=[{kind:'truck',x:13,lane:20.55,speed:1.4,delay:0,deliveryUntil:0},{kind:'car',x:8,lane:19.55,speed:2.1,delay:0,deliveryUntil:0}];
  constructor(private random:()=>number=Math.random){}
  range(a:number,b:number){return a+(b-a)*this.random();}
  private penFree(x:number,y:number,pasture=false){x-=pasture?38:0;y-=pasture?4:0;return x>=1.35&&x<=5.65&&y>=6.35&&y<=13.65&&!(x<3.3&&y<8.5)&&!(x>4.7&&y>11.6&&y<13.4);}
  penSpot(pasture=false):Tile {for(let i=0;i<24;i++){const x=this.range(1.35,5.65)+(pasture?38:0),y=this.range(6.35,13.65)+(pasture?4:0);if(this.penFree(x,y,pasture))return{x,y};}return{x:4+(pasture?38:0),y:10+(pasture?4:0)};}
  sync(list:{id:number;type:AnimalId}[],expanded=false,width=22,roaming=false){
    const changed=this.roaming!==roaming;
    this.roaming=roaming;this.routed=this.routed||roaming;this.mapWidth=width;
    const ids=new Set(list.map(a=>a.id));
    for(const id of this.animals.keys())if(!ids.has(id))this.animals.delete(id);
    for(const a of list){
      const pasture=expanded&&a.id>4,old=this.animals.get(a.id);
      if(!old||old.pasture!==pasture||old.species!==a.type){
        const p=this.penSpot(pasture),target=this.penSpot(pasture);
        const actor:MovingAnimal={id:a.id,species:a.type,kind:['hen','duck','rabbit','cat','peacock'].includes(a.type)?'chicken':'cow',
          ...p,tx:target.x,ty:target.y,action:'walk',left:1,frame:a.id,flip:false,hop:0,phase:a.id*2.7,pasture,path:[],poseAt:this.time};
        this.animals.set(a.id,actor);
        if(this.routed)this.routeAnimal(actor,roaming);
      }else if(changed&&this.routed&&this.tour?.actor!==old&&this.cue?.actor!==old)this.routeAnimal(old,roaming);
    }
    if(this.tour&&this.animals.get(this.tour.actor.id)!==this.tour.actor)this.tour=null;
    if(this.cue&&this.animals.get(this.cue.actor.id)!==this.cue.actor)this.cue=null;
  }
  // Walkable cell graph: animals use the two pen gates and pedestrian paths;
  // field beds, ponds, buildings and car lanes are never traversed.
  private penCell(x:number,y:number){return x>=1&&x<=5&&y>=6&&y<=13?1:this.mapWidth===46&&x>=39&&x<=43&&y>=10&&y<=17?2:0;}
  animalWalkable(x:number,y:number){if(x<0||x>=this.mapWidth||y<0||y>18)return false;const pen=this.penCell(x,y);if(pen)return this.penFree(x+.5,y+.5,pen===2);if(x===6&&y===10||this.mapWidth===46&&x===44&&y===14)return true;if(x<22)return walkable(x,y);return y===4||y===18||(x-29)%8===0&&y>=5&&y<=17;}
  private crossing(x:number,y:number,nx:number,ny:number){const a=this.penCell(x,y),b=this.penCell(nx,ny);if(a===b)return true;return y===ny&&((y===10&&Math.min(x,nx)===5)||(y===14&&Math.min(x,nx)===43));}
  private routeAnimal(a:MovingAnimal,outside:boolean,goal?:Tile){
    const sx=Math.floor(a.x),sy=Math.floor(a.y),key=(x:number,y:number)=>`${x},${y}`,start=key(sx,sy),queue=[{x:sx,y:sy}],prev=new Map<string,string|null>([[start,null]]);
    for(let i=0;i<queue.length;i++){const p=queue[i];for(const [x,y]of [[p.x+1,p.y],[p.x-1,p.y],[p.x,p.y+1],[p.x,p.y-1]]){const k=key(x,y);if(!prev.has(k)&&this.animalWalkable(x,y)&&this.crossing(p.x,p.y,x,y)){prev.set(k,key(p.x,p.y));queue.push({x,y});}}}
    const choices=queue.filter(p=>outside?!this.penCell(p.x,p.y):this.penCell(p.x,p.y)===(a.pasture?2:1));
    const target=goal?choices.reduce<Tile|undefined>((best,p)=>!best||Math.hypot(p.x+.5-goal.x,p.y+.5-goal.y)<Math.hypot(best.x+.5-goal.x,best.y+.5-goal.y)?p:best,undefined):choices[Math.floor(this.random()*choices.length)];if(!target){a.action='idle';a.left=2;a.tx=a.x;a.ty=a.y;a.path=[];return;}
    const route:Tile[]=[];let k:string|null=key(target.x,target.y);while(k&&k!==start){const [x,y]=k.split(',').map(Number);route.unshift({x:x+.5,y:y+.5});k=prev.get(k)||null;}
    // Complete the current cell before entering cardinal corridors (no diagonal corner cuts).
    a.tx=sx+.5;a.ty=sy+.5;a.path=route;a.action='walk';a.left=2;
  }
  private idle(actor:MovingAnimal){
    actor.action='idle';actor.path=[];actor.tx=actor.x;actor.ty=actor.y;actor.left=1;
  }
  cancelPatrol(){
    if(this.tour)this.idle(this.tour.actor);
    if(this.cue)this.idle(this.cue.actor);
    this.tour=null;this.cue=null;
  }
  setPatrolTour(id:number|null,key:string,stops:readonly Tile[]){
    const actor=id===null?undefined:this.animals.get(id);
    if(actor&&this.tour?.actor===actor&&this.tour.key===key)return;
    if(this.tour&&this.tour.actor!==this.cue?.actor)this.idle(this.tour.actor);
    this.tour=actor&&stops.length?{actor,key,stops,index:0}:null;
    if(this.tour&&this.tour.actor!==this.cue?.actor)this.startTourLeg(this.tour);
  }
  private startTourLeg(tour:PatrolTour){
    this.routeAnimal(tour.actor,true,tour.stops[tour.index]);
    tour.actor.action='walk';tour.actor.hop=0;
  }
  playPatrolCue(id:number,kind:PatrolKind,goal:Tile,found:boolean,onBeat:()=>void){
    const actor=this.animals.get(id);
    if(!actor)return false;
    if(this.cue&&this.cue.actor!==actor)this.idle(this.cue.actor);
    this.routeAnimal(actor,true,goal);
    actor.action='run';actor.hop=0;
    let distance=0,last:Tile=actor;
    for(const point of [{x:actor.tx,y:actor.ty},...actor.path]){
      distance+=Math.hypot(point.x-last.x,point.y-last.y);
      last=point;
    }
    this.cue={actor,kind,goal,found,pace:Math.max(2.8,distance/1.8),start:null,
      duration:found?(kind==='cat'?1.65:1.7):.9,onBeat:found?onBeat:null};
    return true;
  }
  patrolVisual(){
    if(!this.cue||this.cue.start===null)return null;
    const {actor,kind,found,start,duration}=this.cue;
    return {actor,kind,found,progress:Math.min(1,(this.time-start)/duration)};
  }
  patrolActor(){return this.cue?.actor||this.tour?.actor||null;}
  private movePatrolLeg(actor:MovingAnimal,dt:number,pace:number){
    actor.frame+=dt*(actor.action==='run'?15:9);
    let remaining=dt*pace;
    while(remaining>0){
      const dx=actor.tx-actor.x,dy=actor.ty-actor.y,distance=Math.hypot(dx,dy);
      if(distance>.001){
        const step=Math.min(remaining,distance);
        actor.x+=dx/distance*step;actor.y+=dy/distance*step;
        if(Math.abs(dx-dy)>.001)actor.flip=dx-dy>0;
        if(step<distance)return false;
        remaining-=step;
      }
      const next=actor.path.shift();
      if(!next)return true;
      actor.tx=next.x;actor.ty=next.y;
    }
    return false;
  }
  private updatePatrol(actor:MovingAnimal,dt:number){
    const cue=this.cue;
    if(cue?.actor===actor){
      if(cue.start===null){
        if(this.movePatrolLeg(actor,dt,cue.pace)){
          cue.start=this.time;
          actor.action='patrol-result';
          const direction=(cue.goal.x-cue.goal.y)-(actor.x-actor.y);
          if(Math.abs(direction)>.05)actor.flip=direction>0;
        }
      }else{
        const progress=(this.time-cue.start)/cue.duration;
        if(cue.onBeat&&progress>=(cue.kind==='cat'?.38:.45)){
          const play=cue.onBeat;cue.onBeat=null;play();
        }
        if(progress>=1){
          this.cue=null;
          if(this.tour?.actor===actor)this.startTourLeg(this.tour);
          else this.idle(actor);
        }
      }
      return true;
    }
    const tour=this.tour;
    if(tour?.actor!==actor)return false;
    if(actor.action==='patrol-sniff'){
      if(this.time-actor.poseAt>=1){
        tour.index=(tour.index+1)%tour.stops.length;
        this.startTourLeg(tour);
      }
    }else if(this.movePatrolLeg(actor,dt,actor.species==='dog'?1.8:1.5)){
      actor.action='patrol-sniff';actor.poseAt=this.time;
    }
    return true;
  }
  gestureProgress(a:MovingAnimal){
    const clip=animalClip(a.species);
    return clip&&a.action==='signature'?Math.min(1,(this.time-a.poseAt)/clip.duration):0;
  }
  pose(a:MovingAnimal):AnimalPose|null{
    const clip=animalClip(a.species);
    if(!clip)return null;
    if(a.action==='signature')return sampleKeys(clip.keys,this.gestureProgress(a));
    if(a.action==='walk'||a.action==='run')return gaitPose(clip,a.frame,a.action==='run');
    if(a.action==='patrol-sniff')return sampleKeys(SNIFF_POSE,this.time-a.poseAt);
    if(a.action==='patrol-result'&&this.cue?.actor===a&&this.cue.start!==null){
      const keys=!this.cue.found?SNIFF_POSE:a.species==='cat'?CAT_CHASE_POSE:DOG_FIND_POSE;
      return sampleKeys(keys,(this.time-this.cue.start)/this.cue.duration);
    }
    const breath=Math.sin(this.time*2.6+a.phase)*.016;
    return {x:0,lift:0,width:1-breath*.5,height:(a.action==='sleep'?.83:1)+breath,tilt:0};
  }
  private nextAnimal(a:MovingAnimal,ready:boolean){
    const clip=animalClip(a.species);
    const options:AnimalAction[]=clip?['walk','walk','signature','signature','idle']:
      a.kind==='chicken'?['walk','walk','peck','peck','scratch','flap','idle']:['walk','walk','graze','graze','tail','moo','idle'];
    if(!ready)options.push('sleep');
    a.action=options[Math.floor(this.random()*options.length)];
    a.poseAt=this.time;
    a.left=a.action==='signature'&&clip?clip.duration:this.range(1.5,a.action==='sleep'?9:4.5);
    if(a.action==='walk'){
      if(this.routed||!this.penFree(a.x,a.y,a.pasture))this.routeAnimal(a,this.roaming&&this.random()<.85);
      else{const p=this.penSpot(a.pasture);a.tx=p.x;a.ty=p.y;}
    }
  }
  pet(id:number,ready:boolean){
    const a=this.animals.get(id);
    if(!a||this.tour?.actor===a||this.cue?.actor===a)return;
    const clip=animalClip(a.species);
    if(clip){
      a.action='signature';a.poseAt=this.time;a.left=clip.duration;a.hop=0;
    }else{
      a.hop=1;
      if(!ready){a.action=a.kind==='chicken'?'startle':'happy';a.left=a.kind==='chicken'?.45:1.1;}
    }
  }
  sendTruck(){const t=this.vehicles[0];t.x=5;t.delay=0;t.deliveryUntil=this.time+7;}
  frame(a:MovingAnimal){const wave=(f:number,r=.5)=>(this.time*f+a.phase)%1<r;switch(a.action){case'walk':case'run':return `walk${Math.floor(a.frame)%4}`;case'idle':return'stand';case'peck':return wave(1.3)&&wave(4,.45)?'peck':'stand';case'scratch':return wave(3.2)?'scratch':'stand';case'flap':return wave(7,.55)?'flap':'stand';case'tail':return wave(2.1)?'tail':'stand';default:return a.action;}}
  private nextWalker(w:Walker){
    if(w.state==='sit'){const b=BENCHES[w.bench];w.x=b.x+.5;w.y=b.y+1.5;w.bench=-1;w.state='idle';w.left=1;return;}
    if(this.random()<.26){const options=BENCHES.map((_,i)=>i).filter(i=>!this.walkers.some(a=>a!==w&&a.bench===i));if(options.length){const i=options[Math.floor(this.random()*options.length)],b=BENCHES[i];w.path=pathTo(w,{x:b.x,y:b.y+1});if(w.path.length){w.bench=i;w.state='walk';return;}}}
    const cells:Tile[]=[];for(let y=0;y<22;y++)for(let x=0;x<22;x++)if(walkable(x,y))cells.push({x,y});const goal=cells[Math.floor(this.random()*cells.length)];w.path=pathTo(w,goal);w.state=w.path.length?'walk':'idle';w.left=this.range(1.2,3.5);
  }
  update(dt:number,readyIds:Set<number>){
    this.time+=dt;
    for(const a of this.animals.values()){
      a.hop=Math.max(0,a.hop-dt*2.5);
      if(this.updatePatrol(a,dt))continue;
      if(a.action==='walk'||a.action==='run'){
        const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy),speed=(this.routed?(a.kind==='cow'?.72:.95):(a.kind==='cow'?.32:.55))*(a.action==='run'?2.6:1);
        a.frame+=dt*(a.kind==='cow'?5.5:10)*(a.action==='run'?1.8:1);
        if(d<.05){if(a.path.length){const p=a.path.shift()!;a.tx=p.x;a.ty=p.y;}else this.nextAnimal(a,readyIds.has(a.id));}else{const step=Math.min(d,dt*speed),nx=a.x+dx/d*step,ny=a.y+dy/d*step;if(this.routed||!this.penFree(a.x,a.y,a.pasture)||a.path.length>0||this.penFree(nx,ny,a.pasture)){a.x=nx;a.y=ny;}else{const p=this.penSpot(a.pasture);a.tx=p.x;a.ty=p.y;}if(Math.abs(dx-dy)>.001)a.flip=dx-dy>0;}
      }else{
        a.left-=dt;if(a.left<=0){if(a.action==='startle'){if(this.routed)this.routeAnimal(a,this.roaming);else{const p=this.penSpot(a.pasture);a.tx=p.x;a.ty=p.y;}a.action='run';}else this.nextAnimal(a,readyIds.has(a.id));}
        if(a.action==='sleep'&&readyIds.has(a.id)){a.action='idle';a.left=1.4;a.hop=.7;}
      }
    }
    for(const v of this.vehicles){if(v.delay>0){v.delay-=dt;continue;}v.x+=v.speed*dt;if(v.x>this.mapWidth+2.5){v.x=-3;v.delay=this.range(1,6);v.speed=v.kind==='truck'?this.range(1.2,1.6):this.range(1.8,2.5);}}
    for(const w of this.walkers){
      if(w.sayUntil<this.time)w.say='';
      if(w.state==='walk'){
        const goal=w.path[0];if(!goal){if(w.bench>=0){const b=BENCHES[w.bench];w.x=b.x+.5;w.y=b.y+.5;w.state='sit';w.left=this.range(8,14);}else{w.state='idle';w.left=this.range(1.2,3.5);}continue;}
        const dx=goal.x-w.x,dy=goal.y-w.y,d=Math.hypot(dx,dy),step=Math.min(d,dt*(w.kind==='grandpa'?.72:1.02));w.frame+=dt*(w.kind==='grandpa'?5.4:7);if(d<.04)w.path.shift();else{w.x+=dx/d*step;w.y+=dy/d*step;w.flip=dx-dy>0;}
      }else{w.left-=dt;if(w.left<=0)this.nextWalker(w);}
    }
    for(let i=0;i<this.walkers.length;i++)for(let j=i+1;j<this.walkers.length;j++){const a=this.walkers[i],b=this.walkers[j];if(a.state==='walk'&&b.state==='walk'&&Math.hypot(a.x-b.x,a.y-b.y)<.7&&this.random()<dt*.4){a.state=b.state='chat';a.left=b.left=4;a.path=[];b.path=[];a.say='今天的农场真热闹！';b.say='一起去集市看看吧。';a.sayUntil=b.sayUntil=this.time+4;}}
  }
  snapshot(){return{time:this.time,animals:Array.from(this.animals.values()).map(a=>({id:a.id,species:a.species,x:a.x,y:a.y,action:a.action,frame:this.frame(a),outside:!this.penFree(a.x,a.y,a.pasture)})),vehicles:this.vehicles.map(v=>({...v})),walkers:this.walkers.map(w=>({kind:w.kind,x:w.x,y:w.y,state:w.state}))};}
}
