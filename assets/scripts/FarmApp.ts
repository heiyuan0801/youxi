import {nativeHaptic,exportNativeSave,beginNativeSaveImport,takeNativeSaveImport,shareNative,beginInvitePrompt,takeInvitePrompt,requestAndroidFrameRate} from './NativePlatform';
import {detectLocale,isLocale,setActiveLocale,type LocaleId} from './Locale';
import {compostPumpkin,damageStorm,recordStorm,repairStormPlot,resolveScene,rollScene,searchPatrol,PATROL_SPOTS} from './FarmActivities';
import {settleAutomation} from './FarmAutomation';
import {takeRoute} from './FarmExplore';
import {_decorator,Component,Node,Texture2D,SpriteFrame,resources,view,ResolutionPolicy,profiler,UITransform,EventTouch,EventMouse,Vec3,sys,input,Input,KeyCode,EventKeyboard,Font,director,Director,game,Game,native,AudioClip} from 'cc';
import {Painter,XY} from './Drawing';
import {FarmScene} from './FarmScene';
import {FarmUI} from './FarmUI';
import {REF_ART} from './RefArtData';
import {EXPANSION_ART} from './ExpansionArt';
import {WORLD_ART} from './WorldArt';
import {LIFE_ART} from './LifeArt';
import {ART_PLACEHOLDERS,AquaticId,MapId,FactoryId,animalSpec} from './FarmCatalog';
import {NEXT_ART} from './NextArt';
import {refreshLife,travel,gather,autoFeed,isAdult} from './FarmLife';
import {FarmAudio,SOUND_KEYS,SoundKey,animalVoice,aquaticVoice} from './FarmAudio';
import {worldWidth,hasRegion,collectOrchard} from './FarmProgression';
import {REGIONS,RegionId} from './WorldData';
import {refreshFeatures,fishingPhase,rollDaily} from './FarmFeatures';
import {anglingPhase} from './FarmAngling';
import {ART_HOOKS, FARM_ART_HOOKS, hookStem} from './ArtHooks';
import {PLOTS,unproject,freeGrass,project,BASE_Z,WIDTH,HEIGHT} from './SceneLayout';
import {FarmState,FrameRate,Result,CropId,DecoId,SAVE_KEY,newFarm,parseSave,serialize,plant,harvest,water,readyPlot,secondsLeft,cropById,collectAnimal,buyDecoration,tendFlower,levelFor} from './FarmModel';
import {audioMix,markShared,redeemInvite,setFarmLocale,setVolume,sharePayloadFor,toggleHud,toggleMute,touchRetention} from './FarmRetention';
import {presentShare,type ShareHost} from './FarmShare';
const {ccclass}=_decorator;
const MAX_SAVE_BYTES=8*1024*1024;
@ccclass('FarmApp')
export class FarmApp extends Component {
  state!:FarmState;private art=new Map<string,SpriteFrame>();private world!:Node;private scene!:FarmScene;private ui!:FarmUI;
  private pendingPlot:number|null=null;private placing:DecoId|null=null;private pointer:XY|null=null;private moved=0;private drag:'pan'|'plant'|'harvest'='pan';private visited=new Set<number>();private pinch=0;
  private dirty=false;private clock=0;private signature={world:'',hud:''};private resize=()=>{};private audio:AudioContext|null=null;private audioStarted=false;private musicClock=0;private musicNote=0;
  private lastBackdropAt=0;
  private afterDraw=()=>{
    if(!sys.isBrowser||this.pointer||this.pinch)return;
    const now=performance.now();
    if(now-this.lastBackdropAt<250)return;
    this.lastBackdropAt=now;
    this.ui?.captureBackdrop(game.canvas);
  };
  private nativeClips=new Map<string,AudioClip>();private soundClips=new Map<SoundKey,AudioClip>();private sfx!:FarmAudio;private dragLevel=1;
  private saveInput:HTMLInputElement|null=null;
  private nativeSavePending=false;private invitePending=false;
  private pendingSave:FarmState|null=null;
  onLoad(){
    view.setDesignResolutionSize(WIDTH,HEIGHT,ResolutionPolicy.SHOW_ALL);if(sys.isBrowser)view.resizeWithBrowserSize(true);profiler.hideStats();
    let raw:string|null=null;try{raw=sys.localStorage.getItem(SAVE_KEY);}catch{}
    const loaded=parseSave(raw,Date.now(),false);this.state=loaded||newFarm();this.applyFrameRate();if(!loaded)this.state.locale=detectLocale(sys.isBrowser ? navigator.language : typeof sys.languageCode==='string'&&sys.languageCode?sys.languageCode:undefined);else if(!isLocale(this.state.locale))this.state.locale='zh-CN';this.state.retention.locale=this.state.locale;setActiveLocale(this.state.locale);settleAutomation(this.state);refreshFeatures(this.state);refreshLife(this.state);
    if(raw){try{const old=JSON.parse(raw);if(!loaded)sys.localStorage.setItem(SAVE_KEY+'-unreadable-backup',raw);else{if(!old.features)sys.localStorage.setItem(SAVE_KEY+'-before-v03',raw);if(!old.progression)sys.localStorage.setItem(SAVE_KEY+'-before-v04',raw);if(!old.life)sys.localStorage.setItem(SAVE_KEY+'-before-v05',raw);if(!old.ecology)sys.localStorage.setItem(SAVE_KEY+'-before-v06',raw);if(!old.advanced)sys.localStorage.setItem(SAVE_KEY+'-before-v07',raw);if(!old.journey)sys.localStorage.setItem(SAVE_KEY+'-before-v08',raw);}if(old.layoutVersion!==2)sys.localStorage.setItem(SAVE_KEY+'-before-v02',raw);}catch{try{sys.localStorage.setItem(SAVE_KEY+'-unreadable-backup',raw);}catch{}}}
    const p=new Painter(WIDTH,HEIGHT,this.art),loading=p.label(this.node,'晴野物语 · 正在准备农场…',800,450,24,'#5a3e2b',600,80);
    const adopt=(key:string,texture:Texture2D)=>{texture.setFilters(Texture2D.Filter.LINEAR,Texture2D.Filter.LINEAR);const frame=new SpriteFrame();frame.texture=texture;this.art.set(key,frame);};
    const images=[{key:'cover',path:'branding/'},...Object.keys(REF_ART).map(key=>({key,path:'refart/'})),...EXPANSION_ART.map(key=>({key,path:'expansion/'})),...WORLD_ART.map(key=>({key,path:'worldart/'})),...Object.keys(NEXT_ART).map(key=>({key,path:'nextart/'})),...Object.keys(LIFE_ART).map(key=>({key,path:'lifeart/'}))].map(({key,path})=>new Promise<void>((resolve,reject)=>resources.load(path+key+'/texture',Texture2D,(err,texture)=>{
      if(err){reject(err);return;}adopt(key,texture);resolve();
    })));
    const hooks=FARM_ART_HOOKS.map(key=>new Promise<void>(resolve=>resources.load('hooks/'+key+'/texture',Texture2D,(err,texture)=>{if(!err&&texture)adopt(key,texture);resolve();})));
    const fishingHooks=ART_HOOKS.map(hook=>new Promise<void>(resolve=>resources.load('hooks/'+hookStem(hook.file)+'/texture',Texture2D,(err,texture)=>{if(!err&&texture)adopt(hook.id,texture);resolve();})));
    const fonts=(sys.isNative?['QingyeSC']:['Baloo2','Nunito']).map((name,i)=>new Promise<void>((resolve,reject)=>resources.load('fonts/'+name,Font,(err,font)=>{if(err){reject(err);return;}if(sys.isNative){Painter.displayFont=font;Painter.bodyFont=font;}else if(i===0)Painter.displayFont=font;else Painter.bodyFont=font;resolve();})));
    const sounds=SOUND_KEYS.map(key=>new Promise<void>((resolve,reject)=>resources.load('audio/'+key,AudioClip,(err,clip)=>{if(err){reject(err);return;}this.soundClips.set(key,clip);resolve();})));
    const nativeSounds=sys.isNative?['theme','ui'].map(key=>new Promise<void>((resolve,reject)=>resources.load('audio/'+key,AudioClip,(err,clip)=>{if(err){reject(err);return;}this.nativeClips.set(key,clip);resolve();}))):[];
    Promise.all([...images,...hooks,...fishingHooks,...fonts,...sounds,...nativeSounds]).then(()=>{loading.node.destroy();this.initialize(p);}).catch(err=>{loading.string='农场资源没有加载完整，请刷新重试';console.error(err);});
  }
  private initialize(p:Painter){
    for(const [alias,source] of Object.entries(ART_PLACEHOLDERS)){const frame=this.art.get(source);if(frame&&!this.art.has(alias))this.art.set(alias,frame);}
    this.world=p.node(this.node,'FarmWorld',800,450,9000,7000);const hud=p.node(this.node,'ReferenceUI');this.scene=new FarmScene(this.world,this.art,()=>this.state);    touchRetention(this.state);
    this.sfx=new FarmAudio(this.node,this.soundClips,this.nativeClips);this.applyAudio();
    this.ui=new FarmUI(hud,this.art,()=>this.state,{act:f=>this.act(f),pick:id=>this.pick(id),place:id=>{this.placing=id;this.ui.toast('点一块空草地，放下新的装饰');},zoom:f=>this.zoom(f),focus:id=>this.focus(id),travel:id=>this.travelTo(id),settings:key=>{this.state[key]=!this.state[key];this.applyAudio();this.save();this.ui.render();},setVolume:(kind,value)=>{const result=setVolume(this.state,kind,value);this.applyAudio();this.save();this.ui.toast(result.message);this.ui.render();},toggleMute:()=>{const result=toggleMute(this.state);this.applyAudio();this.save();this.ui.toast(result.message);this.ui.render();},setFrameRate:rate=>this.setFrameRate(rate),setLocale:(locale:LocaleId)=>{setFarmLocale(this.state,locale);setActiveLocale(this.state.locale);this.save();this.ui.render();},toggleHud:side=>{toggleHud(this.state,side);this.save();this.ui.render();},share:which=>void this.share(which),askRedeem:()=>this.askRedeem(),exportSave:()=>this.exportSave(),chooseSave:()=>this.chooseSave(),restoreBackup:()=>this.restoreBackup(),confirmSave:()=>this.confirmSave(),reset:()=>this.reset(),start:()=>this.startAudio()});
    this.ui.started=!!rawSession();
    this.world.on(Node.EventType.TOUCH_START,this.touchStart,this);this.world.on(Node.EventType.TOUCH_MOVE,this.touchMove,this);this.world.on(Node.EventType.TOUCH_END,this.touchEnd,this);this.world.on(Node.EventType.TOUCH_CANCEL,()=>{this.pointer=null;this.pinch=0;this.flush();});
    this.world.on(Node.EventType.MOUSE_WHEEL,(e:EventMouse)=>this.zoom(e.getScrollY()>0?1.08:1/1.08,e.getUILocation()));
    input.on(Input.EventType.KEY_DOWN,this.key,this);this.resize=()=>this.ui.render();view.on('canvas-resize',this.resize);director.on(Director.EVENT_AFTER_DRAW,this.afterDraw);
    this.refresh();if(this.ui.started&&this.state.advanced.auto.report?.unread)this.ui.open('offline');this.save();if(sys.isBrowser){window.addEventListener('pagehide',this.hide);document.addEventListener('visibilitychange',this.visibility);document.getElementById('qingye-loader')?.remove();}if(sys.isNative){game.on(Game.EVENT_HIDE,this.hide);game.on(Game.EVENT_SHOW,this.show);}
    (globalThis as any).__SUNNY_FARM__={ready:true,version:'0.8.0',snapshot:()=>JSON.parse(JSON.stringify(this.state)),motion:()=>this.scene.motion.snapshot(),audio:()=>this.sfx.snapshot(),levelPopup:()=>this.ui.levelUp,world:()=>({width:worldWidth(this.state),height:22,plots:this.state.plots.length}),point:(x:number,y:number,lift=0)=>this.mapPoint(x,y,lift),panel:()=>this.ui.panel,buttons:()=>this.ui.diagnostics,art:()=>Array.from(this.art.keys()),view:()=>({x:this.world.position.x,y:this.world.position.y,zoom:this.world.scale.x,selected:this.ui.selected,seedOpen:this.ui.seedOpen}),plot:(i:number)=>{const b=PLOTS[i];return this.mapPoint(b.x+.5,b.y+.5);}};
  }
  private hide=()=>{this.sfx?.setMusic(false);if(this.state){settleAutomation(this.state);this.save();}};
  private show=()=>{if(this.ui){const r=settleAutomation(this.state);refreshFeatures(this.state);refreshLife(this.state);touchRetention(this.state);this.save();this.refresh();if(r?.unread)this.ui.open('offline');this.applyAudio();this.applyFrameRate();}};
  private visibility=()=>{if(document.hidden)this.hide();else this.show();};
  private refresh(){this.scene.redraw();this.ui.render();this.signature=this.currentSignature();}
  private currentSignature(){
    const s=this.state,now=Date.now(),map=s.life.activeMap,season=s.life.seasonIndex%4;
    const crops=s.plots.map(plot=>readyPlot(plot,now)?1:0).join('');
    const adult=s.animals.map(animal=>isAdult(s,animal,now)?1:0).join('');
    const resources=Object.entries(s.life.nodes).filter(([key])=>key.startsWith(map+':')).map(([,at])=>now>=at?1:0).join('');
    const plants=s.beds.map(at=>at?Math.min(3,Math.floor((now-at)/20000)):0).join('');
    const orchard=[...s.progression.appleAt,...s.progression.honeyAt].map(at=>now>=at?1:0).join('');
    const world=map==='home'?`${map}:${season}:${crops}:${plants}:${orchard}:${adult}`:`${map}:${season}:${resources}`;
    const animals=s.animals.map(animal=>animal.readyAt<=now?1:0).join('');
    const jobs=s.features.jobs.map(job=>now>=job.readyAt?1:0).join('');
    const hud=`${crops}:${adult}:${animals}:${jobs}:${fishingPhase(s,now)}:${anglingPhase(s,now)}`;
    return {world,hud};
  }
  private save(){try{sys.localStorage.setItem(SAVE_KEY,serialize(this.state));}catch{this.ui?.toast('当前设备无法保存进度，请导出存档备份');}}
  private recordDay(){const now=new Date(Date.now()+8*60*60*1000).toISOString().slice(0,10);if(this.state.activeDate!==now){this.state.days++;this.state.activeDate=now;}}
  private act(f:()=>Result,at?:XY){this.startAudio();const settlement=settleAutomation(this.state);if(settlement)this.save();const previous=levelFor(this.state.xp),orders=this.state.stats.deliveries,harvests=this.state.stats.harvests,result=f();if(result.ok){this.recordDay();this.save();this.refresh();if(this.state.stats.deliveries>orders)this.scene.motion.sendTruck();if(at)this.scene.burst(at,result.item||'star');if(this.state.stats.harvests>harvests||result.item==='apple'||result.item==='honey')this.sfx.play('harvest');else this.chime(true);if(this.state.haptics){if(sys.isNative){nativeHaptic();}else if(typeof navigator!=='undefined'&&navigator.vibrate)navigator.vibrate(10);}const level=levelFor(this.state.xp);if(level>previous){this.sfx.play('levelup');this.ui.celebrate(previous,level);}else this.ui.toast(result.message);}else this.ui.toast(result.message);return result;}
  private startAudio(){if(!this.audioStarted){this.audioStarted=true;try{sessionStorage.setItem('sunny-farm-started','1');}catch{}this.applyAudio();}if(sys.isNative||!sys.isBrowser)return;try{const Audio=window.AudioContext||(window as any).webkitAudioContext;if(Audio&&!this.audio)this.audio=new Audio();if(this.audio?.state==='suspended')void this.audio.resume();}catch{}}
  private chime(good:boolean){const gain=audioMix(this.state).sfx;if(gain<=0)return;if(sys.isNative){this.sfx.playUi();return;}if(!this.audio)return;const ctx=this.audio;[good?660:480,...(good?[880]:[])].forEach((f,i)=>this.note(f,ctx.currentTime+i*.07,.13,.025*gain));}
  private setFrameRate(rate:FrameRate){
    if(this.state.frameRate===rate)return;
    this.state.frameRate=rate;
    this.applyFrameRate();
    this.save();
    this.ui.render();
  }
  private applyFrameRate(){
    const rate=this.state.frameRate;
    if(game.frameRate!==rate)game.frameRate=rate;
    requestAndroidFrameRate(rate);
  }
  private applyAudio(){
    const mix=audioMix(this.state);
    this.sfx?.applyMix(this.audioStarted?mix.bgm:0,mix.sfx);
  }
  private note(f:number,start:number,len:number,volume:number){if(!this.audio)return;const o=this.audio.createOscillator(),g=this.audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(volume,start+.015);g.gain.exponentialRampToValueAtTime(.0001,start+len);o.connect(g);g.connect(this.audio.destination);o.start(start);o.stop(start+len+.01);}
  private local(e:EventTouch):XY{const q=e.getUILocation(),p=this.world.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(q.x,q.y));return[p.x+800,450-p.y];}
  private touchStart(e:EventTouch){if(this.ui.panel||this.ui.levelUp!==null||!this.ui.started)return;this.startAudio();const touches=e.getAllTouches();if(touches.length>=2){const [a,b]=touches.map(t=>t.getUILocation());this.pinch=Math.hypot(a.x-b.x,a.y-b.y);this.pointer=null;return;}const q=e.getUILocation();this.pointer=[q.x,q.y];this.moved=0;this.visited.clear();this.dragLevel=levelFor(this.state.xp);const i=this.scene.plotAt(this.local(e));this.drag=i>=0&&readyPlot(this.state.plots[i])?'harvest':i>=0&&!this.state.plots[i].crop&&this.state.plots[i].unlocked&&this.ui.seedOpen&&this.ui.selected?'plant':'pan';}
  private touchMove(e:EventTouch){if(this.ui.panel||this.ui.levelUp!==null)return;const touches=e.getAllTouches();if(touches.length>=2){const [a,b]=touches.map(t=>t.getUILocation()),d=Math.hypot(a.x-b.x,a.y-b.y);if(this.pinch>0)this.zoom(d/this.pinch,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});this.pinch=d;return;}if(!this.pointer)return;const d=e.getUIDelta();this.moved+=Math.hypot(d.x,d.y);if(this.drag==='pan'){const p=this.world.position;this.world.setPosition(p.x+d.x,p.y+d.y);this.clampMap();}else{const i=this.scene.plotAt(this.local(e));if(i>=0&&!this.visited.has(i)){this.visited.add(i);const r=this.drag==='harvest'?harvest(this.state,i):this.ui.selected?plant(this.state,i,this.ui.selected):{ok:false,message:''};if(r.ok){this.dirty=true;if(this.drag==='harvest'){this.sfx.play('harvest');const b=PLOTS[i];this.scene.burst(project(b.x+.5,b.y+.5),r.item||'star',3);}}}}}
  private touchEnd(e:EventTouch){this.pinch=0;if(this.ui.panel||this.ui.levelUp!==null||!this.pointer)return;this.pointer=null;if(this.moved>7){this.flush();return;}const at=this.local(e);if(this.placing){const coord=unproject(at[0],at[1]);if(!freeGrass(coord.x,coord.y,worldWidth(this.state))||this.state.decorations.some(d=>Math.hypot(d.x-coord.x,d.y-coord.y)<.8)){this.ui.toast('这里已经有东西啦，选一片空草地吧');return;}const id=this.placing;const r=this.act(()=>buyDecoration(this.state,id,Math.floor(coord.x),Math.floor(coord.y)),at);if(r.ok)this.placing=null;return;}
    const hit=this.scene.hit(at);if(!hit)return;
    if(hit.type==='plot'){
      const i=Number(hit.id),plot=this.state.plots[i];
      if(plot.unlocked)this.ui.soilIndex=i;
      if(this.state.activities.stormPlot===i){this.act(()=>repairStormPlot(this.state),at);return;}
      if(!plot.unlocked){const start=i<30?0:30+Math.floor((i-30)/18)*18,end=i<30?30:start+18,next=this.state.plots.findIndex((p,n)=>n>=start&&n<end&&!p.unlocked);if(i===next){this.ui.landIndex=i;this.ui.shopTab='土地';this.ui.open('shop');}else this.ui.toast('先开垦这片田里有价格牌的地块吧');return;}
      if(readyPlot(plot)){this.act(()=>harvest(this.state,i),at);return;}
      if(plot.crop){
        this.scene.showTimer(i);
        const pumpkin=plot.crop==='pumpkin'||plot.crop==='goldenPumpkin';
        if(this.pendingPlot===i&&!plot.watered)this.act(()=>water(this.state,i),at);
        else if(this.pendingPlot===i&&pumpkin&&!plot.composted)this.act(()=>compostPumpkin(this.state,i),at);
        else this.ui.toast(`${cropById(plot.crop).name}还需${secondsLeft(plot)}秒${!plot.watered?' · 再点浇水':pumpkin&&!plot.composted?' · 再点施堆肥':''}`);
        this.pendingPlot=i;return;
      }
      if(this.ui.seedOpen&&this.ui.selected){this.act(()=>plant(this.state,i,this.ui.selected!),at);}
      else{this.pendingPlot=i;this.ui.showSeeds();}
      return;
    }
    if(hit.type==='animal'){
      const id=Number(hit.id),a=this.state.animals.find(a=>a.id===id)!,ready=a.readyAt<=Date.now();
      this.scene.motion.pet(id,ready);
      this.sfx.play(animalVoice(a.type));
      if(ready)this.act(()=>collectAnimal(this.state,id),at);
      else{this.scene.burst([at[0],at[1]-35],'study_star',3);this.ui.toast(`${animalSpec(a.type).name} · ${animalSpec(a.type).role} · 还需${Math.ceil((a.readyAt-Date.now())/1000)}秒`);}
      return;
    }
    if(hit.type==='scene-mouse'||hit.type==='scene-theft'){this.act(()=>resolveScene(this.state,true),at);return;}
    if(hit.type==='patrol'){
      const spot=Number(hit.id),patrol=this.state.activities.patrol,found=patrol?.spot===spot;
      const result=this.act(()=>searchPatrol(this.state,spot),at);
      if(result.ok&&patrol){
        const pet=this.state.animals.find(a=>a.type===patrol.kind&&isAdult(this.state,a));
        const sound=()=>this.sfx.play(patrol.kind==='cat'?'catChase':'dogFind');
        const playing=pet&&this.scene.motion.playPatrolCue(pet.id,patrol.kind,PATROL_SPOTS[spot],found,sound);
        if(found&&!playing)sound();
      }
      return;
    }
    if(hit.type==='story'){this.ui.open('story');return;}
    if(hit.type==='ice-fishing'){this.ui.open('ice-fishing');return;}
    if(hit.type==='summer-fishing'){this.ui.open('summer-fishing');return;}
    if(hit.type==='automation'){this.ui.open('automation');return;}
    if(hit.type==='deep-route'){this.act(()=>takeRoute(this.state,Number(hit.id)),at);this.ui.open('explore');return;}
    if(hit.type==='explore'){this.ui.open('explore');return;}
    if(hit.type==='resource'){this.act(()=>gather(this.state,Number(hit.id)),at);return;}
    if(hit.type==='factory'){this.ui.factory=hit.id as FactoryId;this.ui.open('workshop');return;}
    if(hit.type==='building'){const key=String(hit.id);if(key==='barn')this.ui.open('warehouse');else if(key==='market')this.ui.open('shop');else if(key==='farmhouse')this.ui.open('orders');else if(key==='school')this.ui.open('tasks');else if(key==='windmill')this.ui.open('workshop');else if(key==='coop'){this.ui.shopTab='动物';this.ui.open('shop');}return;}
    if(hit.type==='region'){this.ui.open('world');return;}
    if(hit.type==='apple'||hit.type==='honey'){const kind=hit.type;this.act(()=>collectOrchard(this.state,kind,Number(hit.id)),at);return;}
    if(hit.type==='aquatic'){this.sfx.play(aquaticVoice(String(hit.id) as AquaticId));this.ui.open('ponds');return;}
    if(hit.type==='pond'){this.ui.open('fishing');return;}
    if(hit.type==='villager'){const w=this.scene.motion.walkers.find(w=>w.kind===hit.id);if(w){w.say=['农场里的蔬菜长得真好！','早上好，今天也大丰收吧。','来集市看看新鲜收获吧！'][Math.floor(Math.random()*3)];w.sayUntil=this.scene.motion.time+3;w.state='wave';w.left=2.2;}this.chime(false);return;}
    if(hit.type==='bed')this.act(()=>tendFlower(this.state,Number(hit.id)),at);else if(hit.type==='garden-sign')this.ui.toast('花圃：点空花坑种花，盛开后收获金币和农场星');else this.scene.burst(at,'star',5);
  }
  private pick(id:CropId){if(this.pendingPlot!==null&&!this.state.plots[this.pendingPlot].crop){const i=this.pendingPlot;this.pendingPlot=null;this.act(()=>plant(this.state,i,id));}}
  private flush(){if(!this.dirty)return;this.dirty=false;this.recordDay();this.save();this.refresh();const level=levelFor(this.state.xp);if(level>this.dragLevel){this.sfx.play('levelup');this.ui.celebrate(this.dragLevel,level);}else if(this.drag==='plant')this.chime(true);this.dragLevel=level;}
  private zoom(factor:number,point={x:800,y:450}){const tr=this.world.getComponent(UITransform)!,at=tr.convertToNodeSpaceAR(new Vec3(point.x,point.y)),parent=this.node.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(point.x,point.y)),scale=Math.max(.3/BASE_Z,Math.min(1.7/BASE_Z,this.world.scale.x*factor));this.world.setScale(scale,scale,1);this.world.setPosition(parent.x-at.x*scale,parent.y-at.y*scale);this.clampMap();}
  private mapPoint(x:number,y:number,lift=0){const [u,v]=project(x,y,lift),point=this.world.getComponent(UITransform)!.convertToWorldSpaceAR(new Vec3(u-800,450-v));return{x:point.x,y:900-point.y};}
  private travelTo(id:MapId){this.pendingPlot=null;this.placing=null;this.ui.selected=null;this.ui.seedOpen=false;this.world.setPosition(0,0);this.world.setScale(1,1,1);this.act(()=>travel(this.state,id));}
  private focus(id:RegionId|'home'){if(this.state.life.activeMap!=='home'){this.state.life.activeMap='home';this.save();this.refresh();}if(id==='home'){this.world.setScale(1,1,1);this.world.setPosition(0,0);return;}const region=REGIONS.find(r=>r.id===id);if(!region||!hasRegion(this.state,id))return;const [x,y]=project(region.x+4,11),scale=.78;this.world.setScale(scale,scale,1);this.world.setPosition(-(x-800)*scale,(y-450)*scale);this.clampMap();}
  private clampMap(){const size=this.state.life.activeMap==='home'?worldWidth(this.state):22,scale=this.world.scale.x,points=[[0,0],[size,0],[size,22],[0,22]].map(([x,y])=>project(x,y)),xs=points.map(p=>(p[0]-800)*scale),ys=points.map(p=>(450-p[1])*scale),p=this.world.position;this.world.setPosition(Math.max(-Math.max(...xs)+160,Math.min(-Math.min(...xs)-160,p.x)),Math.max(-Math.max(...ys)+120,Math.min(-Math.min(...ys)-120,p.y)));}
  private key(e:EventKeyboard){if(e.keyCode===KeyCode.ESCAPE){this.pendingPlot=null;this.placing=null;this.ui.selected=null;this.ui.close();}}
  private shareHost():ShareHost{
    const nav=typeof navigator==='undefined'?undefined:navigator;
    return {
      platform:sys.isNative?(sys.os===sys.OS.IOS?'ios':sys.os===sys.OS.ANDROID?'android':'other'):'web',
      iosShare:(text,svg)=>shareNative(text,svg),
      webShare:nav&&typeof nav.share==='function'?(data)=>nav.share(data as ShareData):undefined,
      canShareFiles:files=>!!nav?.canShare?.({files:files as File[]}),
      makeFile:(filename,svg)=>typeof File==='undefined'?undefined:new File([svg],filename,{type:'image/svg+xml'}),
      clipboard:nav?.clipboard?.writeText?.bind(nav.clipboard),
      saveImage:(filename,svg)=>{if(typeof document==='undefined')return false;const blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;},
    };
  }
  private async share(which:'invite'|'pending'|'latest'){
    const payload=sharePayloadFor(this.state,which);
    if(!payload){this.ui.toast('还没有可以分享的卡片');return;}
    const result=await presentShare(payload,this.shareHost());
    if(result.ok)markShared(this.state,payload.momentId);
    this.save();this.ui.toast(result.message);this.ui.render();
  }
  private askRedeem(){
    if(sys.isNative&&sys.os===sys.OS.IOS){if(this.invitePending)return;try{this.invitePending=beginInvitePrompt();}catch{this.invitePending=false;}if(!this.invitePending)this.ui.toast('无法打开邀请码输入');return;}
    const entered=typeof window!=='undefined'&&typeof window.prompt==='function'?window.prompt('输入朋友的 8 位邀请码。只在本机换一份新手礼物。'):null;
    if(entered)this.finishRedeem(entered);
  }
  private pollInvite(){
    if(!this.invitePending)return;
    let result='';
    try{result=takeInvitePrompt();}catch{result='!error';}
    if(!result)return;
    this.invitePending=false;
    if(result==='!cancel')return;
    if(result==='!error'){this.ui.toast('无法读取邀请码');return;}
    this.finishRedeem(result);
  }
  private finishRedeem(code:string){const result=redeemInvite(this.state,code);this.save();this.ui.toast(result.message);this.ui.render();}
  private exportSave(){if(sys.isNative){try{exportNativeSave(serialize(this.state));this.ui.toast('请选择存档保存位置');}catch{this.ui.toast('存档导出未打开，请稍后重试');}return;}if(typeof document==='undefined')return;const blob=new Blob([serialize(this.state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='晴野物语-存档.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);this.ui.toast('存档已导出');}
  private chooseSave(){
    if(sys.isNative){
      if(this.nativeSavePending)return;
      try{this.nativeSavePending=beginNativeSaveImport();}catch{this.nativeSavePending=false;}
      if(!this.nativeSavePending)this.ui.toast('无法打开文件选择器');
      return;
    }
    this.saveInput?.remove();
    const input=document.createElement('input');
    input.type='file';input.accept='.json,application/json';input.style.display='none';
    this.saveInput=input;document.body.appendChild(input);
    const cleanup=()=>{input.remove();if(this.saveInput===input)this.saveInput=null;};
    input.oncancel=cleanup;
    input.onchange=async()=>{
      const file=input.files?.[0];cleanup();
      if(!file)return;
      if(file.size>MAX_SAVE_BYTES){this.ui.toast('存档文件超过8MB');return;}
      try{const raw=await file.text();if(this.isValid)this.previewSave(raw);}
      catch{if(this.isValid)this.ui.toast('读取存档文件失败');}
    };
    input.click();
  }
  private pollSaveImport(){
    if(!this.nativeSavePending)return;
    let result:string;
    try{result=takeNativeSaveImport();}catch{result='!error';}
    if(!result)return;
    this.nativeSavePending=false;
    if(result==='!cancel')return;
    if(result==='!error'){this.ui.toast('读取存档文件失败或文件超过8MB');return;}
    this.previewSave(result);
  }
  private previewSave(raw:string){
    const next=parseSave(raw.replace(/^\uFEFF/,''),Date.now(),false);
    if(!next){this.ui.toast('存档无效或版本不兼容');return;}
    this.pendingSave=next;
    this.ui.restorePreview={level:levelFor(next.xp),coins:next.coins,animals:next.animals.length,plots:next.plots.filter(p=>p.unlocked).length};
    this.ui.open('restore-save');
  }
  private restoreBackup(){
    try{
      const saves=['-before-restore','-before-reset'].map(key=>sys.localStorage.getItem(SAVE_KEY+key))
        .flatMap(raw=>{const save=parseSave(raw,Date.now(),false);return raw&&save?[{raw,at:save.savedAt}]:[];})
        .sort((a,b)=>b.at-a.at);
      if(saves.length){this.previewSave(saves[0].raw);return;}
    }catch{}
    this.ui.toast('还没有可恢复的本机备份');
  }
  private confirmSave(){
    if(this.ui.panel!=='restore-save'||!this.pendingSave)return;
    const next=this.pendingSave;
    settleAutomation(next);refreshFeatures(next);refreshLife(next);
    try{
      sys.localStorage.setItem(SAVE_KEY+'-before-restore',serialize(this.state));
      sys.localStorage.setItem(SAVE_KEY,serialize(next));
    }catch{this.ui.toast('存储空间不足，当前农场已保留');return;}
    this.pendingSave=null;this.state=next;setActiveLocale(next.locale);this.applyFrameRate();
    this.pendingPlot=null;this.placing=null;this.pointer=null;this.dirty=false;
    this.ui.resetSelection();this.scene.motion.cancelPatrol();this.scene.motion.animals.clear();
    this.world.setPosition(0,0);this.world.setScale(1,1,1);
    this.applyAudio();
    this.refresh();this.ui.toast('存档已恢复 · 原进度已备份');
  }
  private reset(){
    try{sys.localStorage.setItem(SAVE_KEY+'-before-reset',serialize(this.state));}
    catch{this.ui.toast('备份失败，当前农场已保留');return;}
    const {locale,frameRate}=this.state;
    this.state=newFarm();this.state.frameRate=frameRate;setFarmLocale(this.state,locale);setActiveLocale(locale);
    this.applyAudio();
    this.ui.resetSelection();this.pendingSave=null;this.pendingPlot=null;this.placing=null;this.pointer=null;this.dirty=false;
    this.scene.motion.cancelPatrol();this.scene.motion.animals.clear();this.world.setPosition(0,0);this.world.setScale(1,1,1);this.save();this.refresh();
  }
  update(dt:number){
    if(!this.scene)return;
    this.scene.update(Math.min(dt,.05));
    const livePanel=this.ui.panel==='ice-fishing'||this.ui.panel==='race'||this.ui.panel==='summer-fishing'
      ||this.ui.panel==='fishing'&&this.ui.fishTab==='cast'&&this.state.fishery.session?.reel;
    if(livePanel)this.ui.tick();
    this.clock+=dt;
    if(this.clock>.35){
      this.clock=0;
      this.pollSaveImport();
      this.pollInvite();
      if(this.state.advanced.auto.enabled){
        const report=settleAutomation(this.state);
        if(report){
          this.save();
          if(this.ui.panel!=='home'&&(report.harvests||report.plants||report.products||report.crafts||report.feeds))this.refresh();
        }
      }
      const changed=refreshFeatures(this.state)||false,lifeChanged=refreshLife(this.state);
      const storm=recordStorm(this.state),strike=damageStorm(this.state),scene=rollScene(this.state);
      if(changed||lifeChanged||storm||strike||scene)this.save();
      const automation=this.state.life.automation;
      if(!this.state.advanced.auto.enabled&&!this.pointer&&!this.ui.panel&&this.ui.levelUp===null&&this.state.life.activeMap==='home'
        &&Date.now()-automation.lastAt>=5000&&(automation.harvest||automation.feed)){
        automation.lastAt=Date.now();
        const ready=automation.harvest?this.state.plots.map((p,i)=>readyPlot(p)?i:-1).filter(i=>i>=0):[];
        const feedNeeded=automation.feed&&this.state.inventory.feed>this.state.activities.reserve
          &&Object.values(this.state.life.care).some(c=>c.hunger<50);
        if(ready.length||feedNeeded)this.act(()=>{
          for(const i of ready)harvest(this.state,i);
          const fed=autoFeed(this.state);
          return{ok:true,message:`小助手收获${ready.length}块田，喂养${fed}位伙伴`};
        });
      }
      if(this.dirty&&!this.pointer)this.flush();
      else if(this.ui.panel!=='home'){
        const signature=this.currentSignature();
        const worldChanged=storm||strike||scene||signature.world!==this.signature.world;
        if(worldChanged)this.scene.redraw();
        if(worldChanged||changed||lifeChanged||signature.hud!==this.signature.hud)this.ui.render();
        this.signature=signature;
      }
      if(!livePanel)this.ui.tick();
    }
    const music=audioMix(this.state).bgm;
    if(this.audioStarted&&music>0&&this.audio){
      this.musicClock+=dt;
      if(this.musicClock>.42){
        this.musicClock=0;
        const melody=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5,880,783.99,659.25,587.33];
        this.note(melody[this.musicNote++%melody.length],this.audio.currentTime,.32,.006*music);
      }
    }
  }
  onDestroy(){this.scene?.dispose();this.saveInput?.remove();game.off(Game.EVENT_HIDE,this.hide);game.off(Game.EVENT_SHOW,this.show);if(sys.isBrowser){window.removeEventListener('pagehide',this.hide);document.removeEventListener('visibilitychange',this.visibility);}input.off(Input.EventType.KEY_DOWN,this.key,this);view.off('canvas-resize',this.resize);director.off(Director.EVENT_AFTER_DRAW,this.afterDraw);if(this.state)this.save();void this.audio?.close();}
}
function rawSession(){if(sys.isNative)return false;try{return sessionStorage.getItem('sunny-farm-started');}catch{return true;}}
