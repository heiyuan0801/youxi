import {levelTheme,lootName,nodeLoot,routes} from './FarmExplore';
import {NEXT_ART} from './NextArt';
import {Node,Sprite,Graphics,UITransform,Vec3,UIOpacity} from 'cc';
import {machinePose} from './FarmMachines';
import {Painter,XY,empty,tint} from './Drawing';
import {WIDTH,HEIGHT,BASE_Z as Z,project,unproject,BUILDINGS,PATHS,PROPS,PROP_WIDTH,PLOTS,HEDGES,GARDEN,inside,freeGrass,iso} from './SceneLayout';
import {FarmMotion,MovingAnimal,Walker} from './FarmMotion';
import {FarmState,readyPlot,cropById,growSeconds,secondsLeft,DECOS,DecoId} from './FarmModel';
import {REF_ART} from './RefArtData';
import {LIFE_ART} from './LifeArt';
import {AQUATIC,AquaticId,animalSpec,TRAVEL_MAPS,FACTORIES,WEATHER_NAMES} from './FarmCatalog';
import {NODE_POSITIONS,isAdult,weatherAt,seasonIndex} from './FarmLife';
import {worldWidth,hasRegion} from './FarmProgression';
import {REGIONS,ORCHARD_TREES,BEEHIVES} from './WorldData';
import {PATROL_SPOTS} from './FarmActivities';
import {SOIL_CROP,SOIL_EDGE,SOIL_EMPTY,SOIL_FURROW,SOIL_FURROW_CROP,soilTier} from './FarmSoil';
import {t} from './SoilText';
import {animalClip,aquaticMotion} from './AnimalAnimation';
import {drawAnimalAccent,drawPatrolCue,drawPatrolTrail} from './AnimalEffects';
interface Hit {key?:string;x:number;y:number;w:number;h:number;depth:number;sprite?:Node;type:string;id:string|number;}
interface DepthNode {n:Node;depth:number;}
export class FarmScene {
  motion=new FarmMotion();private p:Painter;private depth:DepthNode[]=[];private hits:Hit[]=[];
  private aquaticNodes:{id:AquaticId;n:Node;phase:number}[]=[];
  private animalNodes=new Map<number,{root:Node;sprite:Node;bubble:Node;accent:Graphics|null;key:string;w:number;h:number}>();
  private patrolOverlay!:Graphics;
  private patrolOverlayDepth!:DepthNode;
  private walkers:{root:Node;sprite:Node;bubble:Node;key:string;h:number}[]=[];
  private cars:{root:Node;sprite:Node}[]=[];private trees:{n:Node;phase:number}[]=[];
  private cloudNodes:{n:Node;phase:number}[]=[];private ripples!:Graphics;private ambient!:Graphics;
  private cropNodes:{n:Node;index:number;ready:boolean}[]=[];private timers=new Map<number,number>();
  private selected:number|null=null;private price!:Node;private flowers:Node[]=[];private timerRoot!:Node;private timerClock=0;
  private particles:{n:Node;left:number;max:number;vx:number;vy:number}[]=[];private smoke=0;private sortTimer=0;
  placing:DecoId|null=null;
  private weather!:Graphics;
  private machines:Graphics|null=null;
  private homeTerrain:Graphics|null=null;
  private homeTerrainKey='';
  private rigs:{n:Node;x:number;y:number;kind:'harvest'|'feed'}[]=[];
  constructor(public root:Node,art:Map<string,import('cc').SpriteFrame>,private getState:()=>FarmState){this.p=new Painter(WIDTH,HEIGHT,art);}
  private groundRect(g:Graphics,x:number,y:number,w:number,h:number,fill:string,lift=0,r=.12,stroke?:string,line=1){const pts:XY[]=[];const rr=Math.min(r,w/2,h/2);for(const [cx,cy,start] of [[x+rr,y+rr,Math.PI],[x+w-rr,y+rr,Math.PI*1.5],[x+w-rr,y+h-rr,0],[x+rr,y+h-rr,Math.PI/2]])for(let i=0;i<=5;i++){const a=start+i*Math.PI/10;pts.push(project(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,lift));}this.p.path(g,pts,fill,stroke,line);}
  private groundEllipse(g:Graphics,x:number,y:number,rx:number,ry:number,fill:string,lift=0,alpha=255){const pts:XY[]=Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2;return project(x+Math.cos(a)*rx,y+Math.sin(a)*ry,lift);});this.p.path(g,pts,fill,undefined,1,alpha);}
  private object(key:string,x:number,y:number,width:number,depth:number,bottom=true,parent=this.root){const meta=REF_ART[key]||(LIFE_ART[key]||NEXT_ART[key]),frame=this.p.art.get(key);const h=width*(meta?.h||frame?.rect.height||1)/(meta?.w||frame?.rect.width||1);const n=this.p.image(parent,key,x,y,width,h,bottom);if(parent===this.root)this.depth.push({n,depth});return n;}
  private addHit(key:string,x:number,y:number,w:number,depth:number,type:string,id:string|number){const m=REF_ART[key]||(LIFE_ART[key]||NEXT_ART[key]),f=this.p.art.get(key),ratio=(m?.h||f?.rect.height||1)/(m?.w||f?.rect.width||1);this.hits.push({key,x:x-w/2,y:y-w*ratio,w,h:w*ratio,depth,type,id});}
  redraw(){
    this.homeTerrain?.node.removeFromParent();
    this.rigs=[];const state=this.getState(),size=worldWidth(state);this.motion.sync(state.animals,hasRegion(state,'pasture'),size,state.ecology.roaming);empty(this.root);this.depth=[];this.hits=[];this.trees=[];this.cropNodes=[];this.cloudNodes=[];this.animalNodes.clear();this.aquaticNodes=[];this.walkers=[];this.cars=[];this.flowers=[];this.particles=[];
    const p=this.p,sky=p.g(this.root,'Sky');p.path(sky,[[-6000,-4000],[6000,-4000],[6000,4000],[-6000,4000]],'#fff3dc');
    if(state.life.activeMap!=='home'){
      this.motion.cancelPatrol();
      this.drawTravel();this.weather=p.g(this.root,'Weather');this.update(0);return;
    }
    const activePatrol=state.activities.patrol;
    const patrolPet=activePatrol&&state.animals.find(a=>a.type===activePatrol.kind&&isAdult(state,a));
    this.motion.setPatrolTour(patrolPet?.id??null,
      activePatrol?`${state.activities.patrolCount}:${activePatrol.tried.join(',')}`:'',
      activePatrol?PATROL_SPOTS.filter((_,i)=>!activePatrol.tried.includes(i)):[]);
    // Public reference scene: 22x22 isometric island, 64x32 tile projection.
    for(let i=0;i<18;i++){const y=-100+i*80;const t=Math.min(1,i/13),r=Math.round(191+(255-191)*t),gg=Math.round(233+(243-233)*t),b=Math.round(255+(220-255)*t);p.path(sky,[[-2000,y],[3600,y],[3600,y+82],[-2000,y+82]],'#'+[r,gg,b].map(x=>x.toString(16).padStart(2,'0')).join(''));}
    for(let i=0;i<6;i++){const n=p.node(this.root,'Cloud');const cg=p.g(n);const x=800,y=450,size=1+i%3*.35;for(const [dx,dy,rx,ry] of [[0,0,70,26],[-40,8,44,20],[46,6,50,22],[8,-16,40,24]])p.ellipse(cg,x+dx*size,y+dy*size,rx*size,ry*size,'#ffffff',140);this.cloudNodes.push({n,phase:i*977});}
    this.drawHomeTerrain(size,seasonIndex(state)%4===3,state.progression.regions.length);
    const g=p.g(this.root,'Fields');
    GARDEN.forEach((b,i)=>{this.groundEllipse(g,b.x+.5,b.y+.5,.38,.38,'#7c4f30',3);this.groundEllipse(g,b.x+.5,b.y+.5,.38,.38,'#b07c52');const [x,y]=project(b.x+.5,b.y+.5);const ring=p.g(this.root,'FlowerBed-'+i);const pts=Array.from({length:24},(_,j)=>{const a=j/24*Math.PI*2;return project(b.x+.5+Math.cos(a)*.38,b.y+.5+Math.sin(a)*.38);});for(let j=0;j<pts.length;j+=2)p.line(ring,[pts[j],pts[(j+1)%pts.length]],'#e2c6a4',1.4);this.depth.push({n:ring.node,depth:b.x+b.y+.9});
      const planted=(state.beds||[])[i];if(planted){const age=(Date.now()-planted)/1000,key=age>=60?'wp_flower':age>30?'wp_leaf':age>10?'wp_sprout':'wp_seed';const n=this.object(key,x,y+8*Z,66*Z,b.x+b.y+1);this.flowers.push(n);}
    });
    this.groundRect(g,8.92,5.92,6.16,5.16,'#93603d',6,.25);this.groundRect(g,8.92,5.92,6.16,5.16,'#b98058',0,.25);
    for(const r of REGIONS.slice(0,state.progression.regions.length)){this.groundRect(g,r.x+.92,5.92,6.16,3.16,'#93603d',6,.25);this.groundRect(g,r.x+.92,5.92,6.16,3.16,'#b98058',0,.25);}
    if(hasRegion(state,'pasture'))this.groundRect(g,39,10,5,8,'#bfe38f',0,.35);
    PLOTS.forEach((b,i)=>{const plot=state.plots[i];if(!plot)return;if(!plot.unlocked){this.groundRect(g,b.x+.05,b.y+.05,.9,.9,'#a6d977',0,.12,'#d7e6b7',1.8);return;}const tier=soilTier(plot);this.groundRect(g,b.x+.07,b.y+.07,.86,.86,SOIL_EDGE[tier],5,.14);this.groundRect(g,b.x+.07,b.y+.07,.86,.86,plot.crop?SOIL_CROP[tier]:SOIL_EMPTY[tier],0,.14);
      for(const offset of [.3,.5,.7])p.line(g,[project(b.x+.2,b.y+offset),project(b.x+.8,b.y+offset)],plot.crop?SOIL_FURROW_CROP[tier]:SOIL_FURROW[tier],2.3);
      if(tier>0){const [x,y]=project(b.x+.5,b.y+.18,-8),badge=p.node(this.root,'Soil-'+i);p.rect(badge,x,y,58*Z,22*Z,tier===2?'#c4513e':'#3c342c',11);p.label(badge,t(tier===2?'soil.badge.red':'soil.badge.black',{},state.locale),x,y,12*Z,'#fffaf1',52*Z,20*Z);this.depth.push({n:badge,depth:b.x+b.y+.35});}
      if(plot.crop){const [x,y]=project(b.x+.5,b.y+.5),ready=readyPlot(plot),size=((({wheat:92,carrot:96,tomato:88,strawberry:96,corn:92,pumpkin:104} as Record<string,number>)[plot.crop])||90)*Z;const progress=1-secondsLeft(plot)/growSeconds(plot);
        if(ready||progress>.55){const w=size*(ready?1:.5+(progress-.55)/.45*.28),n=this.object(plot.crop,x,y+16*Z,w,b.x+b.y+1);this.cropNodes.push({n,index:i,ready});this.addHit(plot.crop,x,y+16*Z,w,b.x+b.y+1,'plot',i);}
        else{const spr=p.g(this.root,'Sprouts-'+i);for(const [dx,dy]of[[.3,.35],[.68,.32],[.5,.62],[.3,.72],[.72,.68]]){const [u,v]=project(b.x+dx,b.y+dy),height=(4+progress/.55*9)*Z;p.line(spr,[[u,v],[u,v-height*.9]],'#3f8f37',1.3);p.ellipse(spr,u-height*.45,v-height*.9,height*.5,height*.26,'#6fd25a');p.ellipse(spr,u+height*.45,v-height*.95,height*.5,height*.26,'#6fd25a');}this.depth.push({n:spr.node,depth:b.x+b.y+1});}
      }
    });
    for(const b of BUILDINGS){const [x]=project(b.x+b.w/2,b.y+b.h/2),[,y]=project(b.x+b.w,b.y+b.h,b.lift),w=b.width*Z;const n=this.object(b.key,x,y,w,b.x+b.w+b.y+b.h-1.2);this.addHit(b.key,x,y,w,b.x+b.w+b.y+b.h-1.2,'building',b.key);}
    for(const b of PROPS){const [x,y]=project(b.x+.5,b.y+.5),w=(PROP_WIDTH[b.key]||100)*Z;p.ellipse(g,x,y+8*Z,w*.36,w*.17,'#2d5528',46);const n=this.object(b.key,x,y+(b.key.startsWith('tree')||b.key==='bush'?14:10)*Z,w,b.x+b.y+1);if(b.key.startsWith('tree')||b.key==='bush')this.trees.push({n,phase:b.x*1.7+b.y});this.addHit(b.key,x,y+14*Z,w,b.x+b.y+1,'prop',b.key);}
    this.drawRegions(g);
    for(const deco of state.decorations){const d=DECOS.find(d=>d.type===deco.type);if(!d)continue;const coord=deco.x>46||deco.y>22?unproject(deco.x,deco.y):deco;const [x,y]=project(coord.x+.5,coord.y+.5);this.object(d.sprite,x,y+14*Z,(PROP_WIDTH[d.sprite]||100)*Z,coord.x+coord.y+1);}
    for(const h of HEDGES){const hedge=p.g(this.root,'Hedge'),hor=h.y0===h.y1,x=hor?h.x0:h.x0-.17,y=hor?h.y0-.17:h.y0,w=hor?h.x1-h.x0:.34,hh=hor?.34:h.y1-h.y0;this.groundRect(hedge,x+.05,y+.08,w,hh,'#87b563');for(let lift=0;lift<=20;lift+=4)this.groundRect(hedge,x,y,w,hh,lift>16?'#7ccf63':'#55ad4a',-lift,.17);this.groundRect(hedge,x+.04,y+.04,w-.08,hh-.12,'#8ddb70',-21,.13);this.depth.push({n:hedge.node,depth:(h.x0+h.x1+h.y0+h.y1)/2});}
    const segments:number[][]=[];const add=(x:number,y:number,a:number,b:number)=>segments.push([x,y,a,b]);for(let x=3;x<6;x++)add(x,6,x+1,6);for(let y=8;y<14;y++)add(1,y,1,y+1);for(let x=1;x<6;x++)add(x,14,x+1,14);for(let y=6;y<14;y++)if(y!==10)add(6,y,6,y+1);
    for(let x=1;x<7;x++){add(x,15,x+1,15);add(x,18,x+1,18);}for(let y=15;y<18;y++){add(1,y,1,y+1);if(y!==16)add(7,y,7,y+1);}segments.forEach(s=>this.fence(s));
    const sign=p.node(this.root,'FlowerGardenSign');const [gx,gy]=project(6.5,14.55);p.rect(sign,gx-17*Z,gy-15*Z,5*Z,45*Z,'#8a5a37',2);p.rect(sign,gx+17*Z,gy-15*Z,5*Z,45*Z,'#8a5a37',2);p.rect(sign,gx,gy-54*Z,88*Z,40*Z,'#a7744a',9*Z);p.rect(sign,gx,gy-58*Z,82*Z,36*Z,'#f6dfb2',8*Z);p.label(sign,'FLOWER',gx,gy-65*Z,10,'#5a3e2b',72*Z,15*Z);p.label(sign,'GARDEN',gx,gy-52*Z,10,'#5a3e2b',72*Z,15*Z);this.depth.push({n:sign,depth:21.5});this.hits.push({x:gx-40,y:gy-78,w:80,h:92,depth:21.5,type:'garden-sign',id:0});
    this.ripples=p.g(this.root,'PondRipples');this.ambient=p.g(this.root,'AmbientButterflies');
    for(const [i,f]of AQUATIC.entries())if(state.ecology.ponds[f.id]){const n=this.object(f.id,800,450,41*Z,27.4,false);this.aquaticNodes.push({id:f.id,n,phase:i*1.7});}
    for(const a of this.motion.animals.values())this.makeAnimal(a);
    this.patrolOverlay=p.g(this.root,'PatrolAnimation');
    this.patrolOverlayDepth={n:this.patrolOverlay.node,depth:32};
    this.depth.push(this.patrolOverlayDepth);
    for(const w of this.motion.walkers)this.makeWalker(w);
    for(const v of this.motion.vehicles){const root=p.node(this.root,'Vehicle-'+v.kind),s=this.object(v.kind,p.w/2,p.h/2,(v.kind==='truck'?150:112)*Z,0,true,root);const sg=p.g(root);p.ellipse(sg,p.w/2,p.h/2+4*Z,(v.kind==='truck'?63:47)*Z,(v.kind==='truck'?24:18)*Z,'#2d5528',40);sg.node.setSiblingIndex(0);this.cars.push({root,sprite:s});this.depth.push({n:root,depth:v.x+v.lane});}
    if(state.activities.stormPlot!==null){
      const i=state.activities.stormPlot,b=PLOTS[i];
      this.groundEllipse(g,b.x+.5,b.y+.5,.43,.39,'#71bdde');
      this.marker(b.x+.5,b.y+.5,'积水 · 疏通','plot',i);
    }
    if(state.activities.stormCrop!==null){
      const i=state.activities.stormCrop,b=PLOTS[i];
      if(b)this.marker(b.x+.5,b.y+.2,'暴雨压倒 · 扶起','plot',i);
    }
    if(state.activities.scene){
      const scene=state.activities.scene,b=scene.plot>=0?PLOTS[scene.plot]:null;
      this.marker(b?b.x+.5:11,b?b.y-.3:8,scene.kind==='mouse'?'田鼠 · 让猫来':'货袋 · 让狗看',scene.kind==='mouse'?'scene-mouse':'scene-theft',scene.plot);
    }
    const patrol=state.activities.patrol;
    if(patrol)PATROL_SPOTS.forEach((spot,i)=>{
      if(patrol.tried.includes(i))return;
      const [x,y]=project(spot.x,spot.y);
      this.object(spot.icon,x,y,45*Z,spot.x+spot.y);
      this.marker(spot.x,spot.y,spot.name+' · 线索','patrol',i);
    });
    this.price=p.node(this.root,'ExpansionPrice');this.drawPrice();this.timerRoot=p.node(this.root,'CropTimers');this.drawTimers();this.weather=p.g(this.root,'Weather');
    this.machines=p.g(this.root,'Machines');this.depth.push({n:this.machines.node,depth:18});this.rigs=[];
    if(state.life.automation.harvestBuilt){this.marker(7.55,9.2,state.life.automation.harvest?'收菜器运转':'收菜器停着','automation',0);if(this.p.art.has('machineHarvester')){const [u,v]=project(7.55,9.2);const n=this.object('machineHarvester',u,v,78*Z,16.8);this.rigs.push({n,x:7.55,y:9.2,kind:'harvest'});}}
    if(state.life.automation.feedBuilt){this.marker(4.3,4.55,state.life.automation.feed?'喂养器运转':'喂养器停着','automation',1);if(this.p.art.has('machineFeeder')){const [u,v]=project(4.3,4.55);const n=this.object('machineFeeder',u,v,70*Z,8.9);this.rigs.push({n,x:4.3,y:4.55,kind:'feed'});}}
    this.update(0);
  }
  private drawHomeTerrain(size:number,winter:boolean,regions:number){
    const key=`${size}:${winter}`;
    if(this.homeTerrain&&this.homeTerrainKey===key){
      this.homeTerrain.node.parent=this.root;
      return;
    }
    this.homeTerrain?.node.destroy();
    const p=this.p,g=p.g(this.root,'Terrain');
    this.homeTerrain=g;
    this.homeTerrainKey=key;
    const drawPaths=[...PATHS,...(size>22?[
      {x:22,y:4,w:size-22,h:1},{x:22,y:18,w:size-22,h:1},{x:22,y:21,w:size-22,h:1},
      ...REGIONS.slice(0,regions).map(r=>({x:r.x+7,y:5,w:1,h:13})),
    ]:[])];
    const [sx,sy]=project(size/2,11,190);p.ellipse(g,sx,sy,(1500+(size-22)*40)*Z,(560+(size-22)*12)*Z,'#467896',35);
    const layers=['#b77a52','#c98d5f','#bb8157','#d39a6a'];for(let h=84;h>12;h-=4)this.groundRect(g,0,0,size,22,layers[Math.floor((84-h)/18)%4],h,.7);
    this.groundRect(g,0,0,size,22,'#6fbd4b',12,.7);this.groundRect(g,0,0,size,22,'#86cf5c',6,.7);this.groundRect(g,0,0,size,22,winter?'#e9f4ed':'#a9de7c',0,.7);
    for(let y=0;y<22;y++)for(let x=0;x<size;x++)if((x+y)%2===0&&!drawPaths.some(r=>inside(x,y,r)))this.groundRect(g,x,y,1,1,winter?'#f6fbf8':'#b0e286',0,0);
    let rng=7;const rand=()=>{rng=(rng*1664525+1013904223)>>>0;return rng/4294967296;};
    for(let i=0;i<180;i++){const x=rand()*size,y=rand()*18;if(!freeGrass(x,y,size))continue;const [u,v]=project(x,y);if(i%2){for(let j=0;j<5;j++)p.ellipse(g,u+Math.cos(j*1.256)*2.5,v+Math.sin(j*1.256)*1.6,2.1,2.1,['#ffffff','#ffb3c7','#ffe066','#c9b6ff'][i%4]);}else for(let j=-1;j<=1;j++)p.line(g,[[u+j*4,v],[u+j*5,v-(j===0?7:5)]],'#85bf68',1.3);}
    this.groundRect(g,1,6,5,8,'#bfe38f',0,.35);this.groundEllipse(g,3.6,10.2,1.2,.8,'#b7bc76');this.groundEllipse(g,4.4,12.8,.7,.45,'#b7bc76');
    this.groundRect(g,0,19,size,2,'#666d7c',0,0);this.groundRect(g,0,19.08,size,1.84,'#737b8b',0,0);
    for(let x=0;x<size;x++)this.groundRect(g,x+.2,19.96,.5,.08,'#f7f7f6',0,0);
    for(const x of [7,17])for(let i=0;i<5;i++)this.groundRect(g,x+.06+i*.19,19.12,.1,1.76,'#f7f7f6',0,0);
    for(const r of [...drawPaths,{x:3,y:3.7,w:1,h:.6},{x:11,y:3.7,w:1,h:.6},{x:15.2,y:15.85,w:1.6,h:2.2},{x:18.6,y:3.75,w:.8,h:.5}]){this.groundRect(g,r.x+.04,r.y+.04,r.w-.08,r.h-.08,'#e2c993',5,.32);this.groundRect(g,r.x+.04,r.y+.04,r.w-.08,r.h-.08,'#fbf0d4',0,.32);}
    this.groundEllipse(g,12,15.4,2.84,1.79,'#f2dca1');this.groundEllipse(g,12,15.44,2.54,1.49,'#4fb3dd');this.groundEllipse(g,12,15.4,2.5,1.45,'#7fd3f2');this.groundEllipse(g,11.5,15.1,1.37,.65,'#9fe0f7');
    for(const [x,y,r]of[[13.3,14.9,.26],[10.6,15.9,.22],[12.4,16.25,.18]])this.groundEllipse(g,x,y,r,r,'#5fc06a');this.groundEllipse(g,13.32,14.88,.08,.08,'#ff9ec0');
    this.groundRect(g,1.02,15.02,5.96,2.96,'#a7744a',6,.3);this.groundRect(g,1.02,15.02,5.96,2.96,'#d9b27a',0,.3);this.groundRect(g,1.1,15.1,5.8,2.8,'#c99a63',0,.24);
  }
  dispose(){this.homeTerrain?.node.destroy();}
  private marker(x:number,y:number,label:string,type:string,id:number){
    const [u,v]=project(x,y,-43),width=Math.max(80,label.length*13+20),depth=x+y+30;
    const node=this.p.pill(this.root,u,v,width,31,'#fff1be');
    this.p.label(node,label,800,450,13,'#6c552a',width-12,28);
    this.depth.push({n:node,depth});
    this.hits.push({x:u-width/2,y:v-16,w:width,h:32,depth,type,id});
  }
  private drawTravel(){
    const p=this.p,s=this.getState(),map=TRAVEL_MAPS.find(m=>m.id===s.life.activeMap)!,g=p.g(this.root,'TravelTerrain'),snow=map.id==='snow',beach=map.id==='beach',village=map.id==='village',run=s.advanced.explore.run?.map===map.id?s.advanced.explore.run:null;
    p.path(g,[[-4000,-3000],[5000,-3000],[5000,4000],[-4000,4000]],snow?'#d9e9f7':beach?'#9bdcea':'#c5e4d5');
    const [sx,sy]=project(11,11,65);p.ellipse(g,sx,sy,640,265,'#689591',60);
    for(let lift=60;lift>0;lift-=8)this.groundRect(g,1,2,20,18,lift>30?'#ab7956':'#cb9b6a',lift,.8);
    const theme=levelTheme(map.id,run?.depth||1),ground=theme.ground,tiles=theme.tiles,section=theme.title,landmark=this.p.art.has(theme.art)?theme.art:theme.icon;
    this.groundRect(g,1,2,20,18,ground,0,.8);
    for(let y=3;y<19;y++)for(let x=2;x<20;x++)if((x+y)%2===0)this.groundRect(g,x,y,1,1,tiles,0,0);
    this.groundRect(g,2,10.5,18,1,'#ead2a4',0,.2);this.groundRect(g,9.5,3,1,16,'#f7e9ca',0,.2);
    for(let i=0;i<18;i++){const x=i%2?1.5:20.1,y=3+Math.floor(i/2)*1.8,[u,v]=project(x,y);this.object(map.id==='mine'?'ore':snow?'tree_pine':beach?'bush':i%3?'tree_pine':'tree_round',u,v+8,(map.id==='mine'?65:i%3?75:126)*Z,x+y);}
    const [hx,hy]=project(10,4),heading=p.pill(this.root,hx,hy-70,270,42,'#fffcf4');p.label(heading,run?section+' · 第'+run.depth+'层':map.name,800,450,21,'#6d7843',250,36);this.depth.push({n:heading,depth:1});
    if(run)for(let i=0;i<3;i++){
      const x=15+i+(run.depth%3)*.25,y=12+i*1.25,[u,v]=project(x,y);
      this.object(landmark,u,v,(55+i*11)*Z,x+y);
    }
    if(!village){const [u,v]=project(5,5);this.object(map.icon,u,v,170*Z,10);}
    NODE_POSITIONS.forEach((pos,i)=>{if(run){if(i>=3)return;const option=routes(s)[i],at={x:6+i*4,y:10+i%2*4},[u,v]=project(at.x,at.y),depth=at.x+at.y,done=run.step>=3||run.event!==null,key=done?'gem':option.kind==='fox'&&this.p.art.has('fox')?'fox':option.icon;this.groundEllipse(g,at.x,at.y,1.5,1.1,'#dfcfa0');this.object(key,u,v,100*Z,depth);this.addHit(key,u,v,100*Z,depth,done?'explore':'deep-route',i);const n=p.pill(this.root,u,v+30,160,28);p.label(n,done?(run.event?'处理当前奇遇':'本层完成 · 继续探索'):option.name,800,450,13,'#6d7843',152,25);this.depth.push({n,depth:depth+.1});this.hits.push({x:u-80,y:v+16,w:160,h:30,depth:depth+.2,type:done?'explore':'deep-route',id:i});return;}const [u,v]=project(pos.x,pos.y),depth=pos.x+pos.y,key=village?'factory_'+FACTORIES[i].id:map.loot[i%3],available=village?s.life.factories.includes(FACTORIES[i].id):(s.life.nodes[`${map.id}:${i}`]||0)<=Date.now(),width=(village?174:72)*Z;this.groundEllipse(g,pos.x,pos.y,1.25,.95,village?'#e7c999':snow?'#cbdde9':beach?'#e6c581':'#8fbc67');const n=this.object(key,u,v+10*Z,width,depth);if(!available)p.opacity(n,110);this.addHit(key,u,v+10*Z,width,depth,village?'factory':'resource',village?FACTORIES[i].id:i);
      const label=p.pill(this.root,u,v+28,village?135:108,24,'#fff7df');p.label(label,village?FACTORIES[i].name:available?lootName(nodeLoot(map.id,i)):'恢复中',800,450,12,available?'#658b3c':'#9b8162',village?130:100,22);this.depth.push({n:label,depth:depth+.1});this.hits.push({x:u-(village?70:54),y:v+16,w:village?140:108,h:28,depth:depth+.2,type:village?'factory':'resource',id:village?FACTORIES[i].id:i});
    });
    if(beach){this.groundEllipse(g,17.5,6,2.1,1.5,'#6dcbe5');const [u,v]=project(17,5.5);this.object('beachPier',u,v,145*Z,23);this.addHit('beachPier',u,v,145*Z,23,'pond',0);if(seasonIndex(s)%4===1)this.marker(15.2,8.2,'夏日限时渔赛','summer-fishing',0);}
    const [storyX,storyY]=project(5,7);
    this.object('signpost',storyX,storyY,85*Z,12);
    this.marker(5,7,s.journey.stories.includes(map.id)?'故事已完成':'地区故事','story',0);
    if(snow){
      this.groundEllipse(g,17.5,6,2.05,1.48,'#a4cfe8');
      this.groundEllipse(g,17.5,6,1.7,1.12,'#c4e5f3');
      this.groundEllipse(g,17.5,6,.65,.48,'#5ba8c8');
      this.marker(17.5,6,'冰湖垂钓','ice-fishing',0);
    }
    this.depth.sort((a,b)=>a.depth-b.depth).forEach(a=>a.n.setSiblingIndex(this.root.children.length-1));
  }
  private drawMachines(t:number){
    const g=this.machines;if(!g?.isValid)return;g.clear();
    const state=this.getState(),auto=state.life.automation,p=this.p;
    const specs=[
      {hook:'machineHarvester',x:7.55,y:9.2,built:auto.harvestBuilt,enabled:auto.harvest,working:auto.harvest&&state.plots.some(plot=>readyPlot(plot)),body:'#d08a3a',wheel:'#6d4a2e'},
      {hook:'machineFeeder',x:4.3,y:4.55,built:auto.feedBuilt,enabled:auto.feed,working:auto.feed&&state.animals.some(a=>(state.life.care[a.id]?.hunger??100)<50),body:'#e07a4a',wheel:'#5c4030'},
    ];
    for(const rig of this.rigs){
      const spec=specs.find(item=>item.x===rig.x);
      if(!spec)continue;
      const pose=machinePose(t,spec.enabled,spec.working),[x,y]=project(rig.x,rig.y,pose.bob);
      rig.n.setPosition(x-p.w/2,p.h/2-y);rig.n.angle=pose.arm*22;
    }
    for(const spec of specs){
      if(!spec.built||this.p.art.has(spec.hook))continue;
      const pose=machinePose(t,spec.enabled,spec.working),[x,y]=project(spec.x,spec.y,pose.bob);
      p.ellipse(g,x,y+10,34,12,'#2d5528',60);
      p.ellipse(g,x,y,36,16,spec.enabled?'#f3d7a2':'#d9c7ae');
      p.ellipse(g,x-8,y-16,22,10,spec.body);
      p.ellipse(g,x+20,y+6,10,10,spec.wheel);
      p.line(g,[[x+20,y+6],[x+20+Math.cos(pose.spin)*8,y+6-Math.sin(pose.spin)*8]],'#fff7e8',2);
      p.line(g,[[x-4,y-18],[x-18+pose.arm*16,y-34]],spec.body,3);
      if(pose.working)p.ellipse(g,x-18+pose.arm*16,y-34,3.5,3.5,'#fff4c8');
    }
  }
  private drawWeather(t:number){if(!this.weather)return;const g=this.weather,p=this.p,w=weatherAt(this.getState());g.clear();if(['rain','storm','thunder','snow'].includes(w)){for(let i=0;i<46;i++){const x=(i*143.3+t*31)%1800-100,y=(i*83.7+t*(w==='snow'?35:330))%1100-100;if(w==='snow')p.ellipse(g,x+Math.sin(t+i)*12,y,2.5,2.5,'#ffffff',210);else p.line(g,[[x,y],[x-6,y+18]],'#a6d8f1',1.2,w==='rain'?110:180);}}if(w==='rainbow'||w==='aurora'){for(let i=0;i<6;i++)p.ellipse(g,700+i*36+Math.sin(t*.3)*30,80+i*8,390-i*34,30,['#ffafc2','#ffd37c','#b8e98c','#99dfeb','#c6b8f5','#f9bcdd'][i],35);}}
  private drawRegions(g:Graphics){
    const p=this.p,state=this.getState(),size=worldWidth(state);
    for(const region of REGIONS.slice(0,state.progression.regions.length)){
      const [tx,ty]=project(region.x+4,3,-10),label=p.pill(this.root,tx,ty,176*Z,36*Z);p.label(label,region.name,800,450,16*Z,'#6c8c38',165*Z,30*Z);this.depth.push({n:label,depth:region.x+7});
      for(let x=region.x;x<region.x+8;x+=2){const [u,v]=project(x+.5,.5);this.object(x%4?'tree_round':'tree_pine',u,v+14*Z,(x%4?150:74)*Z,x+1);}
      for(const y of[10.5,16.5])if(region.id!=='pasture'){const [u,v]=project(region.x+1,y);this.object('bush',u,v+14*Z,72*Z,region.x+1+y);}
    }
    if(size>22)for(let y=1;y<18;y+=3){const [x,v]=project(size-.5,y+.5);this.object(y%2?'tree_pine':'tree_round',x,v+14*Z,(y%2?74:150)*Z,size+y);}
    if(hasRegion(state,'orchard')){
      ORCHARD_TREES.forEach((b,i)=>{const [x,y]=project(b.x,b.y),depth=b.x+b.y;this.object('tree_round',x,y+14*Z,154*Z,depth);this.addHit('tree_round',x,y+14*Z,154*Z,depth,'apple',i);if(state.progression.appleAt[i]<=Date.now()){for(const dx of[-23,20])this.object('apple',x+dx*Z,y-55*Z,30*Z,depth+.02,false);this.productBubble(x,y-132*Z,'apple',depth+.1,i);}});
      BEEHIVES.forEach((b,i)=>{const [x,y]=project(b.x,b.y),depth=b.x+b.y;this.object('beehive',x,y+10*Z,92*Z,depth);this.addHit('beehive',x,y+10*Z,92*Z,depth,'honey',i);if(state.progression.honeyAt[i]<=Date.now())this.productBubble(x,y-106*Z,'honey',depth+.1,i);});
    }
    if(hasRegion(state,'pasture')){
      const [x]=project(40,11),[,y]=project(41,12,4);this.object('coop',x,y,230*Z,51.8);this.addHit('coop',x,y,230*Z,51.8,'building','coop');
      const [hx,hy]=project(43.5,16.5);this.object('hay',hx,hy+10*Z,100*Z,60);
      for(let x=39;x<44;x++){this.fence([x,10,x+1,10]);this.fence([x,18,x+1,18]);}for(let y=10;y<18;y++){this.fence([39,y,39,y+1]);if(y!==14)this.fence([44,y,44,y+1]);}
    }
    const next=REGIONS[state.progression.regions.length];if(next){const [x,y]=project(size-.5,10,-20),sign=p.pill(this.root,x,y,184*Z,46*Z);p.label(sign,`${next.level}级 · 开拓${next.name}`,800,450,14*Z,'#8b6a43',175*Z,38*Z);this.depth.push({n:sign,depth:size+10});this.hits.push({x:x-92*Z,y:y-23*Z,w:184*Z,h:46*Z,depth:size+10,type:'region',id:next.id});}
  }
  private productBubble(x:number,y:number,key:string,depth:number,index:number){const n=this.p.node(this.root,'OrchardProduct',x,y);this.p.bubble(n,800,450,42*Z);this.p.contain(n,key,800,450,28*Z,29*Z);this.depth.push({n,depth});this.hits.push({x:x-22*Z,y:y-22*Z,w:44*Z,h:44*Z,depth,type:key,id:index});}
  private fence(s:number[]){const p=this.p,g=p.g(this.root,'WhiteFence'),a=project(s[0],s[1]),b=project(s[2],s[3]);for(const h of [9,18]){p.line(g,[[a[0],a[1]-h*Z],[b[0],b[1]-h*Z]],'#cdb995',6*Z);p.line(g,[[a[0],a[1]-(h+.6)*Z],[b[0],b[1]-(h+.6)*Z]],'#fffaf0',3.6*Z);}for(const t of[0,.34,.67,1]){const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,h=t===0||t===1?27:22;p.rect(g.node,x,y-h*Z/2,5.2*Z,h*Z,'#fffaf0',2*Z,'#cdb995',1);}this.depth.push({n:g.node,depth:(s[0]+s[1]+s[2]+s[3])/2+.02});}
  private drawPrice(){const s=this.getState();empty(this.price);for(const start of [0,30,48,66]){if(start>=s.plots.length)continue;const end=start===0?30:start+18,i=s.plots.findIndex((p,n)=>n>=start&&n<end&&!p.unlocked);if(i<0)continue;const b=PLOTS[i],[x,y]=project(b.x+.5,b.y+.5,-18);this.p.pill(this.price,x,y,66*Z,28*Z,'#fffaf1');this.p.contain(this.price,'coin',x-22*Z,y,21*Z);this.p.label(this.price,String(60+Math.max(0,s.plots.filter(p=>p.unlocked).length-9)*40),x+9*Z,y,17*Z,'#7f4c20',47*Z,25*Z);}}
  private makeAnimal(a:MovingAnimal){
    const p=this.p,state=this.getState(),model=state.animals.find(v=>v.id===a.id)!;
    const spec=animalSpec(a.species),clip=animalClip(a.species),key=clip?spec.sprite:a.kind+'_stand';
    const meta=REF_ART[key]||LIFE_ART[key]||NEXT_ART[key];
    const w=spec.size*Z*(isAdult(state,model)?1:.55),h=w*meta.h/meta.w;
    const root=p.node(this.root,'Animal-'+a.id),shadow=p.g(root);
    p.ellipse(shadow,p.w/2,p.h/2+2*Z,w*.31,h*.13,'#2d5528',45);
    const accent=clip?.accent?p.g(root,'SignatureEffect'):null;
    if(accent)accent.node.active=false;
    const sprite=this.object(key,p.w/2,p.h/2,w,0,true,root);
    const bubble=p.node(root,'ProductBubble');
    p.bubble(bubble,p.w/2,p.h/2,46*Z);
    p.contain(bubble,spec.product,p.w/2,p.h/2,30*Z,34*Z);
    this.animalNodes.set(a.id,{root,sprite,bubble,accent,key,w,h});
    this.depth.push({n:root,depth:a.x+a.y});
  }
  private makeWalker(w:Walker){const p=this.p,root=p.node(this.root,'Villager-'+w.kind),g=p.g(root);p.ellipse(g,p.w/2,p.h/2+2,16*Z,6.5*Z,'#2d5528',45);const ww=(w.kind==='girl'?72*211/260:w.kind==='boy'?72*183/260:70*180/260)*Z,h=ww*(w.kind==='girl'?266/211:w.kind==='boy'?263/183:263/180);const sprite=this.object(w.kind+'_walk1',p.w/2,p.h/2,ww,0,true,root),bubble=p.node(root,'Speech');this.walkers.push({root,sprite,bubble,key:'',h});this.depth.push({n:root,depth:w.x+w.y});}
  private screenToLocal(point:XY):XY{const world=this.root.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(point[0],point[1],0));return[world.x+WIDTH/2,HEIGHT/2-world.y];}
  private hitsPoint(h:Hit,x:number,y:number){
    let u:number,v:number;
    if(h.sprite){
      // The visual anchor is at the feet. Undo the exact rendered rotation and
      // scale before reading the original alpha mask.
      const dx=x-h.x,dy=h.y-y,angle=h.sprite.angle*Math.PI/180;
      const cos=Math.cos(angle),sin=Math.sin(angle),scale=h.sprite.scale;
      u=(cos*dx+sin*dy)/scale.x/h.w+.5;
      v=1-(-sin*dx+cos*dy)/scale.y/h.h;
    }else{
      u=(x-h.x)/h.w;v=(y-h.y)/h.h;
    }
    if(u<0||u>1||v<0||v>1)return false;
    const mask=h.key&&(REF_ART[h.key]||LIFE_ART[h.key]||NEXT_ART[h.key])?.mask;
    if(!mask)return true;
    const cell=Math.min(31,Math.floor(v*32))*32+Math.min(31,Math.floor(u*32));
    return !!(parseInt(mask[cell>>2],16)&(1<<(3-(cell&3))));
  }
  hit(point:XY):{type:string;id:string|number;at:XY}|null {
    const [x,y]=point,state=this.getState(),dynamic:Hit[]=[];
    if(state.life.activeMap==='home'){
      for(const f of this.aquaticNodes){
        const pos=f.n.position;
        dynamic.push({x:pos.x+800-22,y:450-pos.y-19,w:44,h:38,depth:28,type:'aquatic',id:f.id});
      }
      for(const a of this.motion.animals.values()){
        const n=this.animalNodes.get(a.id);
        if(!n)continue;
        const [px,py]=project(a.x,a.y),offset=n.sprite.position;
        dynamic.push({key:n.key,x:px+offset.x,y:py-offset.y,w:n.w,h:n.h,
          depth:a.x+a.y,sprite:n.sprite,type:'animal',id:a.id});
        if(n.bubble.active){
          const b=n.bubble.position;
          dynamic.push({x:px+b.x-24,y:py-b.y-23,w:48,h:52,depth:a.x+a.y+.1,type:'animal',id:a.id});
        }
      }
      this.motion.walkers.forEach((w,i)=>{
        const n=this.walkers[i],[px,py]=project(w.x,w.y),width=n.sprite.getComponent(UITransform)!.width;
        dynamic.push({x:px-width/2,y:py-n.h,w:width,h:n.h,depth:w.x+w.y,type:'villager',id:w.kind});
      });
    }
    for(const h of [...this.hits,...dynamic].sort((a,b)=>b.depth-a.depth)){
      if(this.hitsPoint(h,x,y))return {type:h.type,id:h.id,at:point};
    }
    if(state.life.activeMap!=='home')return null;
    const tile=unproject(x,y),i=PLOTS.findIndex(p=>Math.floor(tile.x)===p.x&&Math.floor(tile.y)===p.y);
    if(i>=0&&i<state.plots.length)return {type:'plot',id:i,at:point};
    if((((tile.x-12)/2.54)**2+((tile.y-15.4)/1.49)**2)<1)return {type:'pond',id:0,at:point};
    const bed=GARDEN.findIndex(p=>Math.floor(tile.x)===p.x&&Math.floor(tile.y)===p.y);
    return bed>=0?{type:'bed',id:bed,at:point}:null;
  }
  plotAt(point:XY){if(this.getState().life.activeMap!=='home')return -1;const t=unproject(point[0],point[1]);const i=PLOTS.findIndex(p=>Math.floor(t.x)===p.x&&Math.floor(t.y)===p.y);return i<this.getState().plots.length?i:-1;}
  showTimer(i:number){this.timers.set(i,this.motion.time+2.6);this.selected=i;this.drawTimers();}
  private drawTimers(){if(!this.timerRoot)return;empty(this.timerRoot);for(const [i,end]of this.timers){const plot=this.getState().plots[i];if(end<this.motion.time||!plot.crop||readyPlot(plot)){this.timers.delete(i);continue;}const b=PLOTS[i],[x,y]=project(b.x+.5,b.y+.5,-72),c=cropById(plot.crop),left=secondsLeft(plot);this.p.pill(this.timerRoot,x,y,142*Z,36*Z);this.p.contain(this.timerRoot,plot.crop,x-50*Z,y,28*Z);this.p.label(this.timerRoot,`${c.name} · ${left}秒`,x+12*Z,y,13*Z,'#5a3e2b',108*Z,30*Z);}}
  burst(at:XY,key='star',count=8){for(let i=0;i<count;i++){const n=this.p.contain(this.root,key,at[0],at[1],12+Math.random()*12);this.particles.push({n,left:.9+Math.random()*.5,max:1.4,vx:(Math.random()-.5)*90,vy:45+Math.random()*60});}}
  update(dt:number){
    const state=this.getState();
    if(state.life.activeMap!=='home'){
      this.motion.time+=dt;this.drawWeather(this.motion.time);return;
    }
    const now=Date.now();
    const readyIds=new Set(state.animals.filter(a=>a.readyAt<=now).map(a=>a.id));
    this.motion.update(dt,readyIds);
    const t=this.motion.time,patrolActor=this.motion.patrolActor(),patrolCue=this.motion.patrolVisual();
    for(const f of this.aquaticNodes){
      const move=aquaticMotion(f.id,t,f.phase),[x,y]=project(move.x,move.y);
      f.n.setPosition(x-800,450-y);
      f.n.setScale((move.flip?-1:1)*move.width,move.height,1);
      f.n.angle=move.flip?-move.tilt:move.tilt;
    }
    for(const a of this.motion.animals.values()){
      const o=this.animalNodes.get(a.id);
      if(!o)continue;
      const [x,y]=project(a.x,a.y),flip=a.flip?-1:1,pose=this.motion.pose(a);
      o.root.setPosition(x-800,450-y);
      if(pose){
        o.sprite.setPosition(pose.x*o.w*flip,pose.lift*o.w);
        o.sprite.setScale(flip*pose.width,pose.height,1);
        o.sprite.angle=pose.tilt*flip;
      }else{
        const moving=a.action==='walk'||a.action==='run';
        const bob=moving?(1-Math.cos(a.frame*Math.PI))*(a.kind==='cow'?.8:1.3)*Z:0;
        const hop=Math.sin(a.hop*Math.PI)*18*Z,breath=!moving?Math.sin(t*2.6+a.phase)*.016:0;
        const frame=a.kind+'_'+this.motion.frame(a);
        if(this.p.art.has(frame)&&o.key!==frame){
          o.sprite.getComponent(Sprite)!.spriteFrame=this.p.art.get(frame)!;
          o.key=frame;
        }
        o.sprite.setPosition(0,bob+hop);
        o.sprite.setScale(flip*(1-breath*.5),1+breath,1);
        o.sprite.angle=0;
      }
      if(o.accent){
        const progress=this.motion.gestureProgress(a);
        o.accent.node.active=progress>0&&progress<1;
        if(o.accent.node.active){
          o.accent.clear();
          drawAnimalAccent(this.p,o.accent,a,progress,o.w,o.h);
        }
      }
      const actionLift=pose?Math.max(0,pose.lift*o.w)+Math.max(0,pose.height-1)*o.h:0;
      o.bubble.active=readyIds.has(a.id)&&patrolCue?.actor!==a;
      o.bubble.setPosition(0,Math.max(o.h+20*Z,(a.kind==='cow'?135:97)*Z)+actionLift+Math.sin(t*3+a.x)*3*Z);
      const d=this.depth.find(d=>d.n===o.root);
      if(d)d.depth=a.x+a.y;
    }
    this.patrolOverlay.node.active=!!patrolActor;
    if(patrolActor){
      const node=this.animalNodes.get(patrolActor.id);
      if(node){
        const [x,y]=project(patrolActor.x,patrolActor.y);
        this.patrolOverlayDepth.depth=patrolActor.x+patrolActor.y+.3;
        this.patrolOverlay.clear();
        if(patrolCue)drawPatrolCue(this.p,this.patrolOverlay,x,y,node.w,node.h,patrolActor,
          node.sprite.position.x,node.sprite.position.y,patrolCue);
        else drawPatrolTrail(this.p,this.patrolOverlay,x,y,node.w,node.h,patrolActor,t);
      }
    }
    this.motion.walkers.forEach((w,i)=>{const o=this.walkers[i];if(!o)return;const [x,y]=project(w.x,w.y),frame=w.kind+'_'+(w.state==='walk'?`walk${Math.floor(w.frame)%4}`:w.state==='sit'?'sit':w.state==='wave'?'wave':w.state==='chat'?(Math.floor(t*3)%2?'talk':'walk1'):Math.sin(t*1.3+i)> .98?'blink':'walk1');if(frame!==o.key&&this.p.art.has(frame)){o.sprite.getComponent(Sprite)!.spriteFrame=this.p.art.get(frame)!;o.key=frame;}o.root.setPosition(x-800,450-y);o.sprite.setScale(w.flip?-1:1,1,1);o.sprite.setPosition(0,w.state==='walk'?(1-Math.cos(w.frame*Math.PI))*1.1*Z:0);o.sprite.angle=w.state==='walk'?Math.sin(w.frame*Math.PI/2)*2:0;const d=this.depth.find(d=>d.n===o.root);if(d)d.depth=w.x+w.y+(w.state==='sit'?.05:0);o.bubble.active=!!w.say;if(w.say){if(o.bubble.name!==w.say){empty(o.bubble);this.p.pill(o.bubble,800,450,Math.min(190,w.say.length*11+20),26);this.p.label(o.bubble,w.say,800,450,11,'#5a3e2b',180,25);o.bubble.name=w.say;}o.bubble.setPosition(0,o.h+20);}});
    this.motion.vehicles.forEach((v,i)=>{const n=this.cars[i];if(!n)return;const[x,y]=project(v.x,v.lane,16);n.root.setPosition(x-800,450-y+Math.abs(Math.sin(t*14+v.x))*Z);const fade=Math.max(0,Math.min(1,(v.x+1.5)/1.5,(worldWidth(state)+1.5-v.x)/1.5));n.root.active=v.delay<=0&&fade>0;this.p.opacity(n.root,fade*255);const d=this.depth.find(d=>d.n===n.root);if(d)d.depth=v.x+v.lane;});
    for(const a of this.trees)a.n.angle=Math.sin(t*1.4+a.phase)*.68;
    this.cloudNodes.forEach((c,i)=>{const x=((c.phase*3.1+t*(8+i*2))%(WIDTH+600))-300,y=40+(c.phase*7)%(HEIGHT*.5)-64*.05;c.n.setPosition(x-800,450-y);});
    this.ripples.clear();for(let i=0;i<3;i++){const f=(t*.35+i/3)%1,cx=12+.8-i*.9,cy=15.4+.2+(i%2)*.3;const pts:XY[]=Array.from({length:32},(_,j)=>{const a=j/31*Math.PI*2;return project(cx+Math.cos(a)*(.2+f*.5),cy+Math.sin(a)*(.12+f*.3));});this.p.line(this.ripples,pts,'#d6f4fd',1.3,Math.round((1-f)*180));}
    this.ambient.clear();for(let i=0;i<5;i++){const gx=4+i*3.3+Math.sin(t*.18+i)*1.5,gy=8+i*1.8+Math.cos(t*.14+i)*1.4,[x,y]=project(gx,gy,-36),r=2+Math.abs(Math.sin(t*12+i))*2;this.p.ellipse(this.ambient,x-r,y,r,2,['#ff8fb1','#ffd84d','#ffffff','#b9a3ff','#8fd3ff'][i]);this.p.ellipse(this.ambient,x+r,y,r,2,['#ff8fb1','#ffd84d','#ffffff','#b9a3ff','#8fd3ff'][i]);}
    const cast=state.features.fishing.cast;if(cast&&Date.now()<=cast.escapeAt){const [fx,fy]=project(12,15.4,-4),bite=Date.now()>=cast.biteAt,bob=Math.sin(t*(bite?18:3))*(bite?4:1.5);this.p.ellipse(this.ambient,fx,fy+3,11,3,'#ffffff',160);this.p.ellipse(this.ambient,fx,fy+bob,3.5,7,'#ffffff');this.p.ellipse(this.ambient,fx,fy-3+bob,3.5,4,'#ff779a');}
    for(const c of this.cropNodes){if(c.ready){const v=Math.sin(t*4+c.index)*.03;c.n.setScale(1-v,1+v,1);}}
    this.price.setPosition(0,Math.sin(t*2.5)*2);this.timerClock+=dt;if(this.timerClock>.2){this.timerClock=0;this.drawTimers();}
    this.smoke+=dt;if(this.smoke>.6){this.smoke=0;const [x,y]=project(3.5,2.5);const puff=this.p.node(this.root,'ChimneySmoke',x+80,y-270);const g=this.p.g(puff);this.p.ellipse(g,800,450,9,7,'#ffffff',70);this.particles.push({n:puff,left:2.6,max:2.6,vx:5,vy:20});}
    this.particles=this.particles.filter(a=>{a.left-=dt;if(a.left<=0){a.n.destroy();return false;}const pos=a.n.position;a.n.setPosition(pos.x+a.vx*dt,pos.y+a.vy*dt);this.p.opacity(a.n,Math.min(1,a.left/a.max)*210);return true;});
    this.drawMachines(t);
    this.drawWeather(t);this.sortTimer+=dt;if(this.sortTimer>.12||dt===0){this.sortTimer=0;this.sortHomeLayers();}
  }
  private sortHomeLayers(){
    this.depth.sort((a,b)=>a.depth-b.depth);
    const layers=[...this.depth.map(entry=>entry.n),this.ripples.node,this.ambient.node,
      this.price,this.timerRoot,...this.particles.map(particle=>particle.n),this.weather.node];
    let index=this.root.children.length-1;
    for(let i=layers.length-1;i>=0;i--,index--){
      const node=layers[i];
      if(this.root.children[index]!==node)node.setSiblingIndex(index);
    }
  }
}
