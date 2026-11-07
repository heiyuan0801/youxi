import {hudLayout} from './HudLayout';
import {nativeInsets} from './NativePlatform';
import {geneticsPanel,explorePanel,automationPanel,offlinePanel} from './AdvancedPanels';
import {roomPanel} from './RoomPanel';
import {Trait} from './FarmAdvanced';
import {pondPanel,growthPanel,eventsPanel} from './EcologyPanels';
import {Node,UITransform,Mask,ScrollView,Vec2,Vec3,view,SpriteFrame,Sprite,Texture2D,ImageAsset,UIOpacity,BlockInputEvents,Graphics,LabelOutline} from 'cc';
import {Painter,empty,tint,XY} from './Drawing';
import {FarmState,CropId,ProductId,DecoId,CROPS,DECOS,PRODUCTS,NAMES,PRICES,TASKS,Result,levelFor,levelFloor,levelCeil,canDeliver,expansionCost,skipOrder,deliver,sell,expand,buyAnimal,claimTask,unlockWithStars,expandWithStars,expandPen,readyPlot,cropById,plantAll,waterAll,harvestAll} from './FarmModel';
import {SOIL_GROWTH_LABEL,SOIL_NAME,SOIL_WATER_LABEL,soilCostLabel,soilTier,upgradeSoil} from './FarmSoil';
import {LOCALE_LABEL,LOCALES,LocaleId,t} from './SoilText';
import {workshopPanel,fishingPanel,journalPanel,diaryHeight,DiaryTab,FeaturePanelContext} from './FeaturePanels';
import {DAILY_GOALS,dailyProgress,fishingPhase,RECIPES,recipeFactory} from './FarmFeatures';
import {ANIMALS,TRAVEL_MAPS,FactoryId,FurnitureId,MapId,SEASONS,WEATHER_NAMES} from './FarmCatalog';
import {seasonIndex,weatherAt} from './FarmLife';
import {animalsPanel,travelPanel,homePanel,seasonPanel} from './LifePanels';
import {claimLevelReward,unclaimedLevels,animalCapacity} from './FarmProgression';
import {worldPanel,levelsPanel,levelUpCard} from './ProgressionPanels';
import {RegionId} from './WorldData';
import { FLOWER_PALETTE, FlowerChoice, repairStormPlot } from './FarmActivities';
import { areaStoryPanel, breakfastPanel, carpenterPanel, festivalGamesPanel, honorsPanel, iceFishingPanel, patrolPanel } from './JourneyPanels';
export type Panel='warehouse'|'orders'|'shop'|'tasks'|'workshop'|'fishing'|'world'|'levels'|'animals'|'travel'|'home'|'seasons'|'genetics'|'explore'|'automation'|'offline'|'ponds'|'growth'|'events'|'settings'|'privacy'|'confirm-reset'|'breakfast'|'story'|'honors'|'carpenter'|'festival-games'|'ice-fishing'|'patrol'|'restore-save'|null;
export interface UICallbacks {act:(f:()=>Result)=>void;pick:(id:CropId)=>void;place:(id:DecoId)=>void;zoom:(factor:number)=>void;focus:(id:RegionId|'home')=>void;travel:(id:MapId)=>void;settings:(key:'sound'|'music'|'haptics')=>void;setLocale:(id:LocaleId)=>void;exportSave:()=>void;chooseSave:()=>void;restoreBackup:()=>void;confirmSave:()=>void;reset:()=>void;start:()=>void;}
const PALE='#fffcf4',LINE='#f2d8ac',INK='#5a3e2b',SOFT='#997455';
export class FarmUI {
  panel:Panel=null;shopTab='土地';seedOpen=false;selected:CropId|null=null;started=true;
  parents:number[]=[];geneFocus:Trait='production';roomSelected:number|null=null;companion:number|null=null;
  seedPage=0;factory:FactoryId='bakery';furniture:FurnitureId|null=null;
  private flowers:FlowerChoice[]=['strawberry','herb','strawberry'];
  restorePreview:{level:number;coins:number;animals:number;plots:number}|null=null;
  diaryTab:DiaryTab='成长';private liveUpdates:(()=>void)[]=[];
  private scrollId='';
  levelUp:number|null=null;private levelQueue:number[]=[];
  landIndex:number|null=null;soilIndex:number|null=null;
  p!:Painter;private buttons:{label:string;n:Node}[]=[];private modalRoot!:Node;private toastRoot!:Node;
  private backdrop:SpriteFrame|null=null;private backdropTexture:Texture2D|null=null;private backdropCanvas:HTMLCanvasElement|null=null;
  constructor(public root:Node,private art:Map<string,SpriteFrame>,private state:()=>FarmState,private cb:UICallbacks){}
  captureBackdrop(source:HTMLCanvasElement|null){if(sys.isNative||!source||this.panel||this.seedOpen||!this.started||typeof document==='undefined')return;const width=Math.min(800,source.width),height=Math.round(width*source.height/source.width);if(!width||!height)return;
    if(!this.backdropCanvas||this.backdropCanvas.width!==width||this.backdropCanvas.height!==height){this.backdrop?.destroy();this.backdropTexture?.destroy();this.backdropCanvas=document.createElement('canvas');this.backdropCanvas.width=width;this.backdropCanvas.height=height;this.backdropTexture=new Texture2D();this.backdropTexture.image=new ImageAsset(this.backdropCanvas);this.backdrop=new SpriteFrame();this.backdrop.texture=this.backdropTexture;}
    const c=this.backdropCanvas.getContext('2d')!;c.clearRect(0,0,width,height);c.filter=`blur(${3*width/source.width}px)`;c.drawImage(source,-3,-3,width+6,height+6);this.backdropTexture!.uploadData(this.backdropCanvas);
  }
  get diagnostics(){return this.buttons.filter(b=>b.n.activeInHierarchy).map(b=>{const a=b.n.worldPosition;return{label:b.label,x:a.x,y:900-a.y,w:b.n.getComponent(UITransform)!.width*this.root.scale.x,h:b.n.getComponent(UITransform)!.height*this.root.scale.y};});}
  private button(p:Painter,parent:Node,label:string,x:number,y:number,w:number,h:number,run:()=>void,color='#67ca70',dark='#3fa94d',font=16){const n=p.button(parent,label,x,y,w,h,run,color,dark,font);this.buttons.push({label,n});return n;}
  private closeButton(p:Painter,parent:Node,x:number,y:number,run:()=>void){this.button(p,parent,'×',x,y,44,44,run,'#ff7aa2','#d64d7d',26);}
  private iconButton(p:Painter,parent:Node,label:string,key:string,x:number,y:number,w:number,h:number,run:()=>void,fill=PALE){const n=p.rect(parent,x,y,w,h,fill,h/2,'#ffffff',2);p.contain(n,key,p.w/2,p.h/2,w*.67,h*.67);n.name='Button-'+label;p.hit(n,run);this.buttons.push({label,n});return n;}
  private money(p:Painter,parent:Node,value:number|string,x:number,y:number,size=17,key='coin',w=90){p.contain(parent,key,x-w/2+size*.6,y,size*1.25);p.label(parent,String(value),x+size*.4,y,size,key==='coin'?'#a87505':'#d38300',w-size*1.3,size*1.5,true);}
  private slot(p:Painter,parent:Node,x:number,y:number,w:number,h:number){return p.surface(parent,x,y,w,h,'slot','#ffffff','#f2d8ac');}
  render(){
    const id=[this.panel,this.panel==='tasks'?this.diaryTab:this.panel==='shop'?this.shopTab:this.panel==='workshop'?this.factory:''].join(':'),previous=this.modalRoot?.isValid?this.modalRoot.getComponentInChildren(ScrollView):null,offset=id===this.scrollId?previous?.getScrollOffset():null;this.scrollId=id;
    empty(this.root);this.buttons=[];this.liveUpdates=[];const frame=view.getFrameSize(),layout=hudLayout(frame.width,frame.height,sys.isNative,nativeInsets());this.root.setScale(layout.scale,layout.scale,1);this.root.setPosition(layout.x,layout.y,0);this.p=new Painter(layout.width,layout.height,this.art);const p=this.p,w=p.w,h=p.h,state=this.state(),lv=levelFor(state.xp),left=state.xp-levelFloor(lv),next=levelCeil(lv)-levelFloor(lv);
    // The reference HUD has no large title/task boxes and no full-width bottom toolbar.
    const ratio=lv>=100?1:Math.min(1,left/next);p.pill(this.root,165,43,200,40);p.label(this.root,`${lv}级`,149,33,11,SOFT,120,18,true,'left');p.rect(this.root,153,51,130,11,'#f1e2c8',5);if(ratio>0)p.rect(this.root,88+130*ratio/2,51,Math.max(4,130*ratio),11,'#69c957',5);p.label(this.root,lv>=100?'满级':`${left}/${next}`,235,43,12,SOFT,52,24);
    const levelStar=p.contain(this.root,'star',51,43,62);p.label(this.root,String(lv),51,45,22,INK,45,45,true,'center','#ffffff');p.hit(levelStar,()=>this.open('levels'));this.buttons.push({label:'等级奖励',n:levelStar});
    const ready=state.features.jobs.filter(j=>j.readyAt<=Date.now()).length;
    for(const [x,label,key,panel]of [[80,ready?`工坊 · ${ready}`:'工坊','windmill','workshop'],[209,fishingPhase(state)==='bite'?'咬钩啦！':'钓鱼','fish','fishing']] as const){const n=p.pill(this.root,x,108,118,40);p.contain(n,key,p.w/2-36,p.h/2,33,36);p.label(n,label,p.w/2+16,p.h/2,14,INK,76,32);p.hit(n,()=>this.open(panel));this.buttons.push({label:panel==='workshop'?'工坊':'钓鱼',n});}
    for(const [x,label,key,panel]of [[80,'开拓地图','tree_round','world'],[209,unclaimedLevels(state).length?`奖励 · ${unclaimedLevels(state).length}`:'等级册','star','levels']] as const){const n=p.pill(this.root,x,158,118,40);p.contain(n,key,p.w/2-37,p.h/2,32,34);p.label(n,label,p.w/2+15,p.h/2,13,INK,79,32);p.hit(n,()=>this.open(panel));this.buttons.push({label:panel==='world'?'开拓地图':'等级册',n});}
    for(const [x,label,key,panel]of [[80,'动物伙伴','duck','animals'],[209,'旅行手册','forestCamp','travel']] as const){const n=p.pill(this.root,x,208,118,40);p.contain(n,key,p.w/2-37,p.h/2,32,34);p.label(n,label,p.w/2+15,p.h/2,13,INK,79,32);p.hit(n,()=>this.open(panel));this.buttons.push({label,n});}
    const dayLabel=SEASONS[seasonIndex(state)%4]+' · '+WEATHER_NAMES[weatherAt(state)];const season=p.pill(this.root,w-115,sys.isNative?136:124,178,35);p.label(season,dayLabel+' · 节庆',p.w/2,p.h/2,13,SOFT,168,31);p.hit(season,()=>this.open('seasons'));this.buttons.push({label:'季节与自动化',n:season});const home=p.pill(this.root,w-115,sys.isNative?180:168,178,35);p.label(home,'我的小屋 · 装修',p.w/2,p.h/2,13,SOFT,168,31);p.hit(home,()=>this.open('home'));this.buttons.push({label:'我的小屋',n:home});
    if(state.life.activeMap!=='home'){
      const name=TRAVEL_MAPS.find(m=>m.id===state.life.activeMap)!.name,y=w<1000?h-137:38;
      p.pill(this.root,w/2,y,310,48);p.label(this.root,'当前位置 · '+name,w/2-66,y,12,INK,160,35);
      this.button(p,this.root,'返回主农场',w/2+80,y,138,38,()=>this.cb.travel('home'),'#67ca70','#3fa94d',14);
      this.button(p,this.root,state.journey.stories.includes(state.life.activeMap)?'地区故事 ✓':'地区故事',80,256,118,35,()=>this.open('story'),'#ffb150','#dc8a29',13);
      if(state.life.activeMap==='snow')this.button(p,this.root,'冰湖垂钓',209,256,118,35,()=>this.open('ice-fishing'),'#58bde4','#3295bd',13);
    }else{
      this.button(p,this.root,state.journey.breakfast<5?'农场主线':'晴野荣誉',w/2-14,w<650?92:sys.isNative?44:32,104,34,()=>this.open(state.journey.breakfast<5?'breakfast':'honors'),'#ffb150','#dc8a29',13);
      if(state.animals.some(a=>a.type==='cat'||a.type==='dog'))this.button(p,this.root,state.activities.patrol?'巡院线索':'宠物巡院',80,256,118,35,()=>this.open('patrol'),'#ab89d3','#8360ac',13);
      if(state.activities.stormPlot!==null)this.button(p,this.root,'疏通积水',209,256,118,35,()=>this.cb.act(()=>repairStormPlot(state)),'#58bde4','#3295bd',13);
      this.button(p,this.root,t('soil.open',{},state.locale),348,256,136,35,()=>{this.shopTab='土地';this.open('shop');},'#8d6b4a','#6a4c32',13);
      this.renderBatch(state,w,h);
    }
    this.button(p,this.root,'自动农场',w-115,sys.isNative?224:212,178,35,()=>this.open('automation'),'#ab89d3','#8360ac',13);
    if(state.advanced.auto.report)this.button(p,this.root,state.advanced.auto.report.unread?'离线收获 · 查看':'离线报告',w-115,sys.isNative?266:254,178,33,()=>this.open('offline'),'#ffb150','#dc8a29',13);
    const right=w-20,topY=sys.isNative?44:32,secondY=sys.isNative?90:78;p.pill(this.root,right-186,topY,114,40);p.contain(this.root,'coin',right-217,topY,44);p.label(this.root,String(state.coins),right-174,topY,20,INK,65,35);
    this.iconButton(p,this.root,'放大','ui_plus',right-104,topY,32,topY,()=>this.cb.zoom(1.2));
    this.iconButton(p,this.root,'缩小','ui_minus',right-64,topY,32,topY,()=>this.cb.zoom(1/1.2));
    const set=this.button(p,this.root,'',right-20,topY,40,40,()=>this.open('settings'),'#a98bd9','#7f63b3');set.name='Button-设置';this.buttons.push({label:'设置',n:set});p.contain(set,'ui_gear',p.w/2,p.h/2,19);
    p.pill(this.root,right-124,secondY,60,36);p.contain(this.root,'ui_flame',right-138,secondY,20);p.label(this.root,String(state.days),right-115,secondY,17,SOFT,22,28);
    p.pill(this.root,right-44,secondY,88,36);p.contain(this.root,'study_star',right-63,secondY,36);p.label(this.root,String(state.stars),right-30,secondY,18,'#c88a00',33,30);
    const count=Object.values(state.inventory).reduce((a,b)=>a+b,0),fulfillable=state.orders.filter(o=>canDeliver(state,o)).length,claimable=TASKS.filter(t=>!state.claimed.includes(t.id)&&state.stats[t.stat]>=t.target).length+DAILY_GOALS.filter(g=>!state.features.daily.claimed.includes(g.id)&&dailyProgress(state,g.id)>=g.target).length;
    const nav=[{label:'农场',key:'school',color:'#4f8ff7',panel:'tasks' as Panel,badge:claimable||'!'},{label:`仓库 · ${count}`,key:'barn',color:'#ff9f43',panel:'warehouse' as Panel,badge:0},{label:'订单',key:'truck',color:'#3cc9a6',panel:'orders' as Panel,badge:fulfillable},{label:'商店',key:'market',color:'#ff7aa2',panel:'shop' as Panel,badge:0}];
    if(!this.seedOpen)nav.forEach((b,i)=>{const x=w/2+(i-1.5)*102,y=h-62.5;const n=p.node(this.root,'Button-'+b.label,x,y,78,92);p.surface(n,p.w/2,p.h/2-4,78,78,'nav',b.color,b.color);p.contain(n,b.key,p.w/2,p.h/2-4,72,72);p.rect(n,p.w/2,p.h/2+34,Math.max(54,b.label.length*12+20),23,b.color,12,'#ffffff',2);p.label(n,b.label,p.w/2,p.h/2+34,13,'#ffffff',100,22,true);p.hit(n,()=>this.open(b.panel));this.buttons.push({label:b.label,n});if(b.badge){p.rect(n,p.w/2+31,p.h/2-42,28,28,'#ff7aa2',14,'#ffffff',2);p.label(n,String(b.badge),p.w/2+31,p.h/2-42,14,'#ffffff',25,25);}});
    if(this.seedOpen)this.renderSeeds();
    this.modalRoot=p.node(this.root,'Modal');this.toastRoot=p.node(this.root,'ToastLayer');
    if(this.panel)this.renderPanel(this.panel);
    if(offset){const scroll=this.modalRoot.getComponentInChildren(ScrollView);if(scroll)scroll.scrollToOffset(offset,0);}
    if(!this.started)this.title();
    if(this.levelUp!==null)this.renderLevelUp();
  }
  private gear(p:Painter,n:Node,x:number,y:number){const g=p.g(n);const pts:XY[]=[];for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=i%3===0?9:7.5;pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}p.path(g,pts,'#a98bd9','#ffffff',1.8);g.strokeColor=tint('#ffffff');g.lineWidth=1.5;g.circle(x-p.w/2,p.h/2-y,3);g.stroke();}
  open(panel:Panel){this.panel=panel;this.seedOpen=false;this.render();}
  resetSelection(){
    this.levelUp=null;this.levelQueue=[];this.panel=null;this.seedOpen=false;this.selected=null;this.seedPage=0;
    this.parents=[];this.companion=null;this.roomSelected=null;this.landIndex=null;this.soilIndex=null;this.restorePreview=null;this.scrollId='';
  }
  close(){if(this.levelUp!==null){this.levelUp=null;this.levelQueue=[];}else{this.panel=null;this.seedOpen=false;}this.render();}
  celebrate(from:number,to:number){const levels=Array.from({length:Math.max(0,to-from)},(_,i)=>from+i+1).filter(l=>!this.state().progression.claimedLevels.includes(l));this.levelQueue.push(...levels);if(this.levelUp===null)this.levelUp=this.levelQueue.shift()??null;this.seedOpen=false;this.render();}
  private previewLevel(level:number){this.levelQueue=[];this.levelUp=level;this.render();}
  showSeeds(){this.seedOpen=true;this.panel=null;this.render();}
  tick(){for(const update of this.liveUpdates)update();}
  private renderSeeds(){
    const p=this.p,w=Math.min(760,p.w-16),height=238,x=p.w/2,y=p.h-height/2-10,root=p.node(this.root,'SeedPicker');const panel=p.rect(root,x,y+6,w,height,'#efd9b3',28);p.rect(root,x,y,w,height,PALE,28,'#ffffff',3);panel.addComponent(BlockInputEvents);
    const soilPlot=this.soilIndex!==null?this.state().plots[this.soilIndex]:undefined,soilName=soilPlot?.unlocked?t(SOIL_NAME[soilTier(soilPlot)],{},this.state().locale):'';
    p.label(root,'选择种子',x-w/2+126,y-height/2+25,20,INK,215,30,true,'left');p.label(root,(this.selected?'点按或滑过空地，连续播种':'选一种作物种到地里')+(soilName?` · ${soilName}`:''),x-w/2+169,y-height/2+49,12.5,SOFT,340,24,true,'left');this.closeButton(p,root,x+w/2-35,y-height/2+35,()=>{this.seedOpen=false;this.selected=null;this.render();});
    this.button(p,root,'上一页',x+110,y-height/2+25,65,28,()=>{this.seedPage=(this.seedPage+Math.ceil(CROPS.length/6)-1)%Math.ceil(CROPS.length/6);this.render();},'#d6c4a4','#bba17b',11);p.label(root,`${this.seedPage+1}/${Math.ceil(CROPS.length/6)}`,x+166,y-height/2+25,12,SOFT,40,25);this.button(p,root,'下一页',x+222,y-height/2+25,65,28,()=>{this.seedPage=(this.seedPage+1)%Math.ceil(CROPS.length/6);this.render();},'#ffb150','#dc8a29',11);
    const cardW=Math.min(104,(w-34-50)/6),gap=10,start=x-w/2+16+cardW/2;
    CROPS.slice(this.seedPage*6,this.seedPage*6+6).forEach((c,i)=>{const xx=start+i*(cardW+gap),cy=y+29,locked=levelFor(this.state().xp)<c.level&&!this.state().cropUnlocks.includes(c.id),selected=this.selected===c.id;
      const n=this.slot(p,root,xx,cy,cardW,151);if(selected)p.rect(n,p.w/2,p.h/2,cardW,151,'#f3ffe9',18,'#64c85b',3);
      const im=p.contain(root,c.id,xx,cy-36,64,70);if(locked){p.opacity(im,90);im.getComponent(Sprite)!.grayscale=true;}
      p.label(root,c.name,xx,cy+12,14.5,INK,cardW-6,24);p.label(root,shortTime(c.seconds),xx,cy+32,11,SOFT,cardW-6,20);
      p.rect(root,xx,cy+55,cardW-10,19,'#fff3d1',10);p.contain(root,'coin',xx-cardW/2+20,cy+55,16);p.label(root,`${c.cost} → ${c.sell}`,xx+6,cy+55,12,'#b97a00',cardW-22,18);
      if(locked){p.pill(root,xx,cy-33,57,24,'#82796d','#ffffff');p.label(root,`${c.level}级`,xx,cy-33,11,'#ffffff',54,22);}if(selected){p.rect(root,xx+cardW/2-4,cy-71,24,24,'#61c45b',12,'#ffffff',2);p.label(root,'✓',xx+cardW/2-4,cy-71,16,'#ffffff',22,22);}
      p.hit(n,()=>{if(locked){this.toast(`${c.level}级解锁${c.name}`);return;}this.selected=c.id;this.cb.pick(c.id);this.render();});this.buttons.push({label:'种子-'+c.name,n});
    });
  }
  private modal(title:string,icon:string,width:number,naturalHeight:number,contentHeight:number){
    const p=this.p,w=Math.min(width,p.w-16),h=Math.min(naturalHeight,p.h*.86),x=p.w/2,y=p.h/2,top=y-h/2,root=this.modalRoot;
    if(this.backdrop){const n=p.node(root,'BlurredFarm',x,y,p.w,p.h),s=n.addComponent(Sprite);s.sizeMode=Sprite.SizeMode.CUSTOM;s.spriteFrame=this.backdrop;n.getComponent(UITransform)!.setContentSize(p.w,p.h);}
    const shade=p.rect(root,x,y,p.w+4,p.h+4,'#462d19',0,undefined,2,97);p.hit(shade,()=>this.close());
    const body=p.surface(root,x,y,w,h,'panel');body.addComponent(BlockInputEvents);
    const ribbonW=title.length*22+(icon?100:52);p.surface(root,x,top,ribbonW,42,'button','#ffab48','#ef7c1a');if(icon)p.contain(root,icon,x-ribbonW/2+35,top,44);p.label(root,title,x+(icon?15:0),top,22,'#ffffff',ribbonW-44,36,true,'center','#d47d27');
    this.closeButton(p,root,x+w/2-36,top+34,()=>this.close());
    const innerW=w-52,viewportH=h-70,cy=top+55+viewportH/2,clip=p.node(root,'ScrollViewport',x,cy,innerW,viewportH),mask=clip.addComponent(Mask);mask.type=Mask.Type.GRAPHICS_RECT;
    const scroll=clip.addComponent(ScrollView);scroll.horizontal=false;scroll.vertical=contentHeight>viewportH;scroll.inertia=true;scroll.elastic=true;scroll.brake=.65;
    const virtualH=Math.max(contentHeight,viewportH),content=p.node(clip,'Content',p.w/2,p.h/2,innerW,virtualH);content.setPosition(0,viewportH/2-virtualH/2);scroll.content=content;
    return {p:new Painter(innerW,virtualH,this.art),root:content,w:innerW,h:virtualH};
  }
  private renderPanel(panel:Exclude<Panel,null>){
    const state=this.state();
    if(panel==='breakfast'||panel==='story'||panel==='honors'||panel==='carpenter'||panel==='festival-games'||panel==='ice-fishing'||panel==='patrol'){
      const spec={
        breakfast:['农场主线','bread',515],story:['地区故事','signpost',388],honors:['晴野荣誉','star',440],
        carpenter:['家具制作','planks',675],'festival-games':['四季比赛','sunflower',735],
        'ice-fishing':['冰湖垂钓','fish',310],patrol:['宠物巡院','dog',330],
      } as const;
      const [title,icon,height]=spec[panel],c=this.featureContext(this.modal(title,icon,610,height+70,height));
      if(panel==='breakfast')breakfastPanel(c,target=>{
        if(target==='farm')this.close();
        else if(target==='honors')this.open('honors');
        else{this.factory=target;this.open('workshop');}
      });
      else if(panel==='story')areaStoryPanel(c,()=>this.open('explore'));
      else if(panel==='honors')honorsPanel(c);
      else if(panel==='carpenter')carpenterPanel(c,()=>{this.factory='lumber';this.open('workshop');});
      else if(panel==='festival-games')festivalGamesPanel(c,this.flowers,i=>{
        const next=(FLOWER_PALETTE.findIndex(f=>f.id===this.flowers[i])+1)%FLOWER_PALETTE.length;
        this.flowers[i]=FLOWER_PALETTE[next].id;this.render();
      });
      else if(panel==='ice-fishing')iceFishingPanel(c);
      else patrolPanel(c,()=>this.close());
      return;
    }
    if(panel==='genetics'||panel==='explore'||panel==='automation'||panel==='offline'||panel==='home'){
      const height=panel==='genetics'?270+state.animals.length*196:panel==='explore'?650:panel==='automation'?500+RECIPES.length*61:panel==='home'?1450+state.advanced.room.items.length*66:500,title={genetics:'基因育种',explore:'分层探索',automation:'自动农场',offline:'离线收获',home:'我的小屋'}[panel],m=this.modal(title,panel==='genetics'?'goldenSheep':panel==='explore'?'mineEntrance':panel==='home'?'farmhouse':'harvester',700,height+70,height),c=this.featureContext(m);
      if(panel==='genetics')geneticsPanel(c,this.parents,this.geneFocus,id=>{this.parents=this.parents.includes(id)?this.parents.filter(v=>v!==id):[...this.parents.slice(-1),id];this.render();},t=>{this.geneFocus=t;this.render();});
      else if(panel==='explore')explorePanel(c,this.companion,()=>{const ids=[null,...state.animals.map(a=>a.id)];this.companion=ids[(ids.indexOf(this.companion)+1)%ids.length];this.render();},()=>{this.panel=null;this.cb.travel('home');});
      else if(panel==='automation')automationPanel(c);else if(panel==='offline')offlinePanel(c,()=>this.close());else roomPanel(c,this.roomSelected,id=>{this.roomSelected=id;this.render();},this.p.h<500,()=>this.open('carpenter'));return;
    }
    if(panel==='ponds'||panel==='growth'||panel==='events'){const height=panel==='ponds'?1120:panel==='growth'?120+state.animals.length*177:880,m=this.modal(panel==='ponds'?'水产养殖':panel==='growth'?'训练与比赛':'四季活动',panel==='ponds'?'carp':panel==='growth'?'star':'whitePeacock',660,height+70,height),c=this.featureContext(m);if(panel==='ponds')pondPanel(c);else if(panel==='growth')growthPanel(c);else eventsPanel(c,()=>this.open('festival-games'));return;}
    if(['animals','travel','seasons'].includes(panel)){
      const title={animals:'动物伙伴',travel:'旅行手册',home:'我的小屋',seasons:'四季农场'}[panel as 'animals'|'travel'|'home'|'seasons']!,height=panel==='animals'?330+state.animals.length*190+state.life.breeds.length*74:panel==='travel'?1140:970,m=this.modal(title,panel==='animals'?'duck':panel==='travel'?'forestCamp':'sunflower',660,height+70,height),c=this.featureContext(m);
      if(panel==='animals')animalsPanel(c,()=>{this.shopTab='动物';this.open('shop');},id=>this.open(id));else if(panel==='travel')travelPanel(c,id=>{this.panel=null;this.cb.travel(id);},()=>this.open('explore'));else seasonPanel(c,()=>this.open('events'),()=>this.open('festival-games'));return;
    }
    if(panel==='world'||panel==='levels'){
      const height=panel==='world'?760:210+116*Math.max(9,Math.min(100,Math.max(10,levelFor(state.xp)+2))-1),m=this.modal(panel==='world'?'开拓地图':'等级奖励',panel==='world'?'tree_round':'star',640,height+70,height),context=this.featureContext(m);if(panel==='world')worldPanel(context,id=>{this.panel=null;this.cb.focus(id);this.render();});else levelsPanel(context,level=>this.previewLevel(level));return;
    }
    if(panel==='workshop'||panel==='fishing'){
      const contentH=panel==='workshop'?400+RECIPES.filter(r=>recipeFactory(r)===this.factory).length*150+Math.max(0,state.features.jobs.filter(j=>recipeFactory(RECIPES.find(r=>r.id===j.recipe)!)===this.factory).length-1)*66:Math.min(500,this.p.h*.86-70),m=this.modal(panel==='workshop'?'风车工坊':'池塘钓鱼',panel==='workshop'?'windmill':'fish',panel==='workshop'?700:640,contentH+70,contentH),context=this.featureContext(m);if(panel==='workshop')workshopPanel(context,this.factory,id=>{this.factory=id;this.render();},()=>this.open('carpenter'));else fishingPanel(context);return;
    }
    if(panel==='warehouse'){
      const items=PRODUCTS.filter(id=>state.inventory[id]>0),rows=Math.ceil(items.length/3),height=Math.max(250,rows*194+80),m=this.modal('仓库','barn',560,height+70,height),{p,root,w}=m;
      p.rect(root,w/2,24,w,42,'#fff1d6',16);p.label(root,'库存总价值',80,24,13.5,SOFT,138,32,true,'left');this.money(p,root,items.reduce((a,id)=>a+state.inventory[id]*PRICES[id],0),w-55,24,18,'coin',95);
      if(!items.length){p.contain(root,'hay',w/2,112,96);p.label(root,'仓库还是空的',w/2,181,19,INK,w-20,32);p.label(root,'收获蔬菜，收集鸡蛋和牛奶，让仓库热闹起来吧！',w/2,216,13.5,SOFT,w-24,40);}
      items.forEach((id,i)=>{const ww=(w-20)/3,x=ww/2+(i%3)*(ww+10),y=146+Math.floor(i/3)*194;this.slot(p,root,x,y,ww,181);p.contain(root,id,x,y-45,68);p.pill(root,x+27,y-18,43,23,INK);p.label(root,`×${state.inventory[id]}`,x+27,y-18,13,'#ffffff',39,22);p.label(root,NAMES[id],x,y+8,15,INK,ww-8,25);this.money(p,root,`${PRICES[id]}/个`,x,y+31,12.5,'coin',82);this.button(p,root,'卖1个',x-ww/4,y+64,ww/2-7,36,()=>this.cb.act(()=>sell(state,id,1)),'#ffca55','#dfa432',13.5);this.button(p,root,'全部卖出',x+ww/4,y+64,ww/2-7,36,()=>this.cb.act(()=>sell(state,id,state.inventory[id])),'#6bcb70','#44a750',13);});
      p.label(root,'小提示：交订单比在集市零卖赚得多哦！',w/2,height-17,12,SOFT,w-10,28);return;
    }
    if(panel==='orders'){
      const m=this.modal('订单','truck',600,838,818),{p,root,w}=m;p.label(root,`已交付${state.stats.deliveries}单 · 把新鲜农产品送给邻居吧`,w/2,15,13,SOFT,w,30);
      state.orders.forEach((o,i)=>{const y=166+i*260;this.slot(p,root,w/2,y,w,246);p.rect(root,43,y-81,56,56,['#ffe3ec','#e2f7ef','#e3f2fd'][i],16,'#ffffff',2);p.contain(root,['girl','grandpa','boy'][i],43,y-75,48,63);p.label(root,o.person,157,y-91,17,INK,154,29,true,'left');this.money(p,root,o.coins,117,y-64,15,'coin',76);this.money(p,root,o.xp,200,y-64,15,'star',72);this.button(p,root,'↻',w-30,y-80,34,34,()=>this.cb.act(()=>skipOrder(state,o.id)),'#d9c4a3','#bca381',20);
        p.rect(root,w/2,y-20,w-24,53,'#f1f9ff',17,'#cfe9f7',2);p.label(root,`“${o.message}”`,w/2,y-20,15.5,'#1f5d80',w-48,47);
        Object.entries(o.needs).forEach(([key,n],j)=>{const id=key as ProductId,ok=state.inventory[id]>=n!,xx=89+j*151;p.rect(root,xx,y+45,136,52,ok?'#effbe9':'#fffaf1',15,ok?'#bfe8b8':LINE,2);p.contain(root,id,xx-43,y+45,40);p.label(root,NAMES[id],xx+13,y+33,11.5,SOFT,78,22,true,'left');p.label(root,`${Math.min(state.inventory[id],n!)}/${n}`,xx+13,y+54,15,ok?'#3ca55a':'#d6553f',78,24,true,'left');});
        this.button(p,root,canDeliver(state,o)?'交货':'货不够',w/2,y+101,w-24,44,()=>this.cb.act(()=>deliver(state,o.id)),canDeliver(state,o)?'#3cc9a6':'#badacc',canDeliver(state,o)?'#269f84':'#9fbdad',16);
      });return;
    }
    if(panel==='shop'){
      const contentH=this.shopTab==='装饰'?590:this.shopTab==='农场星'?1240:this.shopTab==='动物'?80+Math.ceil(ANIMALS.length/2)*325:640,m=this.modal('商店','market',600,contentH+70,contentH),{p,root,w}=m;
      p.rect(root,w/2,23,w,40,'#f5e6c8',20);['土地','动物','装饰','农场星'].forEach((tab,i)=>{const xx=w/8+i*w/4,n=p.rect(root,xx,23,w/4-4,34,this.shopTab===tab?'#ffffff':'#f5e6c8',18);p.label(root,tab,xx,23,14,this.shopTab===tab?INK:SOFT,w/4-8,28);p.hit(n,()=>{this.shopTab=tab;this.render();});this.buttons.push({label:'商店-'+tab,n});});
      if(this.shopTab==='土地'){
        const start=this.landIndex===null?0:this.landIndex<30?0:30+Math.floor((this.landIndex-30)/18)*18,end=this.landIndex===null?state.plots.length:start===0?30:start+18,target=state.plots.findIndex((plot,i)=>i>=start&&i<end&&!plot.unlocked),area=this.landIndex===null?'':start===0?'主农场':(['东侧草甸','甜蜜果林','阳光牧场'][Math.floor((start-30)/18)]||'');
        this.slot(p,root,w/2,225,w,323);const cx=w/2,cy=124;p.poly(root,[[cx,cy-30],[cx+82,cy+12],[cx,cy+54],[cx-82,cy+12]],'#7cd36a','#ffffff',3);p.poly(root,[[cx-82,cy+12],[cx,cy+54],[cx,cy+66],[cx-82,cy+24]],'#c98a52');p.poly(root,[[cx+82,cy+12],[cx,cy+54],[cx,cy+66],[cx+82,cy+24]],'#a86c3c');p.poly(root,[[cx,cy-16],[cx+56,cy+12],[cx,cy+40],[cx-56,cy+12]],'#a8714a');p.contain(root,'wheat',cx+74,cy-20,56);p.label(root,area?`开垦${area}`:'扩建田地',cx,219,20,INK,w-30,34);const n=state.plots.filter(p=>p.unlocked).length;p.label(root,`已有${n}/${state.plots.length}块地。地越多，收成越多！`,cx,251,13.5,SOFT,w-30,27);p.rect(root,cx,276,260,10,'#f1e2c8',5);p.rect(root,cx-130+260*n/state.plots.length/2,276,260*n/state.plots.length,10,'#a7744a',5);this.button(p,root,target<0?'这片田地已全部开垦':`购买田地 · ${expansionCost(state)}`,cx,324,210,48,()=>this.cb.act(()=>target<0?{ok:false,message:'这片田地已经全部开垦'}:expand(state,target)),'#67ca70','#3fa84d',17);p.label(root,'也可以直接点田里的价格牌',cx,368,12.5,SOFT,w-20,27);
        this.renderSoilShop(p,root,w,state);
      }else if(this.shopTab==='动物'){
        ANIMALS.forEach((spec,i)=>{const id=spec.id,x=w/4+i%2*w/2,y=213+Math.floor(i/2)*325,locked=levelFor(state.xp)<spec.level&&!(spec.id==='whitePeacock'&&state.ecology.auroraAnimal);this.slot(p,root,x,y,w/2-8,309);p.pill(root,x-51,y-118,58,25,'#fff1d6');p.label(root,`${state.animals.filter(a=>a.type===id).length}/${animalCapacity(state,id)}`,x-51,y-118,13,INK,54,23);const img=p.contain(root,spec.sprite,x,y-41,116,120);if(locked){p.opacity(img,130);img.getComponent(Sprite)!.grayscale=true;p.pill(root,x,y-43,94,27,INK);p.label(root,`${spec.level}级解锁`,x,y-43,12,'#ffffff',91,25);}p.label(root,spec.name,x,y+46,20,INK,w/2-20,31);p.label(root,`${NAMES[spec.product]} · ${shortTime(spec.seconds)}`,x,y+77,13,SOFT,w/2-20,27);this.button(p,root,`购买 · ${spec.cost}`,x,y+120,w/2-30,44,()=>this.cb.act(()=>buyAnimal(state,id)),'#ff7aa2','#d64f7d',15.5);});
      }else if(this.shopTab==='装饰'){
        p.label(root,'选一个装饰，再点空草地放置',w/2,69,13.5,SOFT,w-10,27);DECOS.filter(d=>!('stars'in d)).forEach((d,i)=>{const ww=(w-20)/3,x=ww/2+i%3*(ww+10),y=177+Math.floor(i/3)*166,locked=levelFor(state.xp)<d.level,n=this.slot(p,root,x,y,ww,150);const im=p.contain(root,d.sprite,x,y-31,80,81);if(locked){p.opacity(im,100);im.getComponent(Sprite)!.grayscale=true;}p.label(root,d.name,x,y+24,15,INK,ww-8,25);this.money(p,root,d.cost,x,y+50,13.5,'coin',75);p.hit(n,()=>{if(locked){this.toast(`${d.level}级解锁${d.name}`);return;}this.panel=null;this.cb.place(d.type);this.render();});this.buttons.push({label:'装饰-'+d.name,n});if(locked){p.pill(root,x,y-33,58,23,INK);p.label(root,`${d.level}级`,x,y-33,11,'#ffffff',55,21);}});
      }else{
        p.contain(root,'study_star',w/2-60,87,40);p.label(root,`${state.stars}颗农场星`,w/2+25,87,21,'#be8900',210,38);p.label(root,'完成订单、领取任务、收获花圃，都能赚取农场星。',w/2,132,13.5,SOFT,w-20,42);
        this.slot(p,root,w/2,193,w,74);p.label(root,'新田地',110,181,17,INK,185,27,true,'left');p.label(root,`已有${state.plots.filter(p=>p.unlocked).length}/${state.plots.length}块田地`,110,209,12,SOFT,185,24,true,'left');this.button(p,root,'15 星',w-68,193,105,40,()=>this.cb.act(()=>expandWithStars(state)),'#ffc84e','#d9a030',15);
        (['hen','cow'] as const).forEach((type,i)=>{const y=280+i*82;this.slot(p,root,w/2,y,w,72);p.label(root,type==='hen'?'扩建鸡舍':'扩建牛棚',130,y-13,17,INK,220,28,true,'left');p.label(root,`容量 ${animalCapacity(state,type)} · 每次+${type==='hen'?2:1}个位置`,130,y+16,12,SOFT,220,25,true,'left');this.button(p,root,type==='hen'?'18 星':'30 星',w-68,y,105,40,()=>this.cb.act(()=>expandPen(state,type)),'#ffc84e','#d9a030',15);});p.label(root,'提前解锁作物',w/2,426,19,INK,w-20,35);CROPS.slice(2,6).forEach((c,i)=>{const y=480+i*84;this.slot(p,root,w/2,y,w,74);p.contain(root,c.id,38,y,54);p.label(root,c.name,150,y-12,17,INK,190,26,true,'left');p.label(root,`通常${c.level}级解锁`,150,y+15,12,SOFT,190,24,true,'left');this.button(p,root,(state.cropUnlocks.includes(c.id)||levelFor(state.xp)>=c.level)?'已解锁':`${[15,25,35,50][i]} 星`,w-68,y,105,40,()=>this.cb.act(()=>unlockWithStars(state,c.id)),'#ffc84e','#d9a030',15);});
        p.label(root,'特别装饰',w/2,817,19,INK,w-20,35);DECOS.filter(d=>'stars'in d).forEach((d,i)=>{if(!('stars'in d))return;const y=877+i*86;this.slot(p,root,w/2,y,w,76);p.contain(root,d.sprite,39,y,56);p.label(root,d.name,161,y-13,17,INK,200,28,true,'left');const unlocked=state.claimed.includes(d.task);p.label(root,unlocked?'已完成对应农场任务':`完成“${TASKS.find(t=>t.id===d.task)?.name}”`,161,y+15,12,SOFT,200,26,true,'left');this.button(p,root,`${d.stars} 星`,w-68,y,105,40,()=>{if(!unlocked){this.toast('先完成对应农场任务吧');return;}this.panel=null;this.cb.place(d.type);this.render();},'#ffc84e','#d9a030',15);});
      }return;
    }
    if(panel==='tasks'){
      const height=diaryHeight(this.diaryTab),m=this.modal('农场手记','school',600,height+70,height),{p,root,w}=m;
      p.rect(root,w/2,23,w,40,'#f5e6c8',20);(['成长','今日','建设','图鉴'] as const).forEach((tab,i)=>{const x=w/8+i*w/4,n=p.rect(root,x,23,w/4-4,34,this.diaryTab===tab?'#ffffff':'#f5e6c8',18);p.label(root,tab,x,23,14,this.diaryTab===tab?INK:SOFT,w/4-8,28);p.hit(n,()=>{this.diaryTab=tab;this.render();});this.buttons.push({label:'手记-'+tab,n});});journalPanel(this.featureContext(m),this.diaryTab);return;
    }
    if(panel==='settings'){
      const m=this.modal('设置','',500,760,690),{p,root,w}=m;p.label(root,'声音与触感',w/2,18,18,'#7755a6',w-20,33);(['music','sound','haptics'] as const).forEach((key,i)=>{const y=80+i*63;this.slot(p,root,w/2,y,w,53);p.label(root,{music:'背景音乐',sound:'音效',haptics:'振动'}[key],100,y,16,INK,175,35,true,'left');const on=state[key];this.button(p,root,on?'开启':'关闭',w-52,y,80,34,()=>this.cb.settings(key),on?'#67ca70':'#c9bca5',on?'#3fa84d':'#ad9b7e',14);});
      p.label(root,t('soil.lang',{},state.locale),w/2,262,16,'#7755a6',w-20,28);LOCALES.forEach((id,i)=>{const ww=(w-16)/5,x=ww/2+8+i*ww;this.button(p,root,LOCALE_LABEL[id],x,300,ww-6,36,()=>this.cb.setLocale(id),state.locale===id?'#67ca70':'#cfbfa1',state.locale===id?'#3fa84d':'#ad9875',12);});
      this.button(p,root,'导出存档',w/2,362,w-20,43,this.cb.exportSave,'#5ebde8','#3397c2',16);this.button(p,root,'隐私与存档说明',w/2,421,w-20,43,()=>this.open('privacy'),'#ab89d3','#8360ac',16);this.button(p,root,'重新开始',w/2,480,w-20,43,()=>this.open('confirm-reset'),'#ff7aa2','#d64f7d',16);
      this.button(p,root,'导入存档',w/2,539,w-20,43,this.cb.chooseSave,'#67ca70','#3fa84d',16);
      this.button(p,root,'恢复本机备份',w/2,598,w-20,43,this.cb.restoreBackup,'#ffb150','#dc8a29',16);return;
    }
    if(panel==='restore-save'){
      const m=this.modal('确认恢复存档','',590,360,285),{p,root,w}=m,preview=this.restorePreview;
      if(!preview)return;
      p.label(root,`${preview.level}级 · ${preview.coins}金币 · ${preview.animals}只动物 · ${preview.plots}块已开垦田地`,w/2,57,18,INK,w-16,68);
      p.label(root,'确认后会载入选中的农场。当前进度会先存为本机备份。',w/2,130,15,SOFT,w-20,65);
      this.button(p,root,'取消恢复',w/4,218,w/2-12,43,()=>this.open('settings'),'#cfbfa1','#ac9676');
      this.button(p,root,'确认恢复',w*3/4,218,w/2-12,43,this.cb.confirmSave);return;
    }
    if(panel==='privacy'){
      const m=this.modal('隐私与存档说明','',650,650,560),{p,root,w}=m;
      p.label(root,'晴野物语 · 单机离线版',w/2,28,23,INK,w,38);
      p.label(root,'农场进度、库存和声音设置保存在本机。\n本游戏不设账号，不集成广告、跟踪或分析SDK，\n不主动收集或上传个人信息。',w/2,112,16,SOFT,w-20,116);
      p.label(root,'你主动导出时，存档由系统文件选择器保存到你选择的位置；云盘等目标位置按对应服务规则处理文件。\n卸载或清除应用数据可能删除本机进度，请先导出备份。',w/2,255,16,SOFT,w-20,145);
      p.label(root,'通过TestFlight测试时，Apple可能按其隐私政策处理测试诊断与反馈。\n在设置中可导入备份文件或恢复本机备份。',w/2,399,16,SOFT,w-20,117);
      this.button(p,root,'返回设置',w/2,510,w-20,44,()=>this.open('settings'));return;
    }
    const m=this.modal('重新开始','',450,264,190),{p,root,w}=m;p.label(root,'确定重新开始这座农场吗？\n当前进度会先保存为本地备份。',w/2,50,17,INK,w-20,70);this.button(p,root,'继续经营',w*.27,132,w*.43,44,()=>this.open('settings'),'#67ca70','#3fa84d',16);this.button(p,root,'重新开始',w*.75,132,w*.43,44,this.cb.reset,'#ff7aa2','#d64f7d',16);
  }
  private renderLevelUp(){const level=this.levelUp!,p=this.p,root=p.node(this.root,'LevelUpOverlay');if(this.backdrop){const n=p.node(root,'BlurredFarm',p.w/2,p.h/2,p.w,p.h),s=n.addComponent(Sprite);s.sizeMode=Sprite.SizeMode.CUSTOM;s.spriteFrame=this.backdrop;n.getComponent(UITransform)!.setContentSize(p.w,p.h);}const shade=p.rect(root,p.w/2,p.h/2,p.w+4,p.h+4,'#423d31',0,undefined,2,105);shade.addComponent(BlockInputEvents);levelUpCard(p,root,this.state(),level,(label,x,y,w,h,run,color,dark,font)=>this.button(p,root,label,x,y,w,h,run,color,dark,font),()=>{this.levelUp=this.levelQueue.shift()??null;if(level>levelFor(this.state().xp)||this.state().progression.claimedLevels.includes(level))this.render();else this.cb.act(()=>claimLevelReward(this.state(),level));});}
  private featureContext(m:{p:Painter;root:Node;w:number;h:number}):FeaturePanelContext{return{...m,state:this.state(),act:this.cb.act,button:(label,x,y,w,h,run,color,dark,font)=>this.button(m.p,m.root,label,x,y,w,h,run,color,dark,font),slot:(x,y,w,h)=>this.slot(m.p,m.root,x,y,w,h),live:f=>this.liveUpdates.push(f)};}
  private renderBatch(state:FarmState,w:number,h:number){
    const now=Date.now(),seed=this.selected?cropById(this.selected):null,locale=state.locale;
    const open=(plot:FarmState['plots'][number],i:number)=>plot.unlocked&&!plot.crop&&state.activities.stormPlot!==i;
    const plantable=seed&&seed.cost>0&&(levelFor(state.xp)>=seed.level||state.cropUnlocks.includes(seed.id))?Math.min(state.plots.filter(open).length,Math.floor(state.coins/seed.cost)):0;
    const thirsty=state.plots.filter(plot=>!!plot.crop&&!plot.watered&&!readyPlot(plot,now)).length;
    const ripe=state.plots.filter(plot=>readyPlot(plot,now)).length;
    const batch=[
      plantable>0&&this.selected?{label:`${t('hud.plant',{},locale)} · ${plantable}`,run:()=>this.cb.act(()=>plantAll(state,this.selected!)),color:'#67ca70',dark:'#3fa84d'}:null,
      thirsty>0?{label:`${t('hud.water',{},locale)} · ${thirsty}`,run:()=>this.cb.act(()=>waterAll(state)),color:'#58bde4',dark:'#3295bd'}:null,
      ripe>0?{label:`${t('hud.harvest',{},locale)} · ${ripe}`,run:()=>this.cb.act(()=>harvestAll(state)),color:'#ffb150',dark:'#dc8a29'}:null,
    ].flatMap(item=>item?[item]:[]);
    if(!batch.length)return;
    const y=this.seedOpen?h-278:h-148,bw=Math.min(176,(w-24)/batch.length-8);
    batch.forEach((item,i)=>{const x=w/2+(i-(batch.length-1)/2)*(bw+8);this.button(this.p,this.root,item.label,x,y,bw,44,item.run,item.color,item.dark,14);});
  }
  private renderSoilShop(p:Painter,root:Node,w:number,state:FarmState){
    const locale=state.locale,idx=this.soilIndex,plot=idx!==null?state.plots[idx]:undefined,tier=plot?.unlocked?soilTier(plot):null;
    this.slot(p,root,w/2,520,w,210);
    p.label(root,t('soil.open',{},locale),w/2,438,18,INK,w-20,30);
    p.label(root,`${t(SOIL_NAME[0],{},locale)} ${SOIL_GROWTH_LABEL[0]} · ${SOIL_WATER_LABEL[0]}`,w/2,472,13,SOFT,w-28,26);
    p.label(root,`${t(SOIL_NAME[1],{},locale)} ${SOIL_GROWTH_LABEL[1]} · ${SOIL_WATER_LABEL[1]}    ${t(SOIL_NAME[2],{},locale)} ${SOIL_GROWTH_LABEL[2]} · ${SOIL_WATER_LABEL[2]}`,w/2,498,13,SOFT,w-28,26);
    if(tier===null||idx===null){p.label(root,t('soil.pick',{},locale),w/2,548,14,SOFT,w-24,40);return;}
    p.label(root,t('soil.current',{index:idx+1,name:t(SOIL_NAME[tier],{},locale)},locale),w/2,540,15,INK,w-24,28);
    if(tier>=2){this.button(p,root,t('soil.max',{},locale),w/2,586,w-40,42,()=>this.toast(t('soil.max',{},locale)),'#cbbd9e','#ac9978',14);return;}
    const next=(tier+1) as 1|2,label=`${t('soil.upgrade',{name:t(SOIL_NAME[next],{},locale)},locale)} · ${soilCostLabel(next,locale)}`;
    this.button(p,root,label,w/2,586,w-40,42,()=>this.cb.act(()=>upgradeSoil(state,idx)),'#67ca70','#3fa84d',14);
  }
  toast(message:string){if(!this.toastRoot)return;empty(this.toastRoot);const p=this.p,w=Math.min(p.w-24,message.length*15+60),n=p.pill(this.toastRoot,p.w/2,135,w,42);p.label(this.toastRoot,message,p.w/2,135,14.5,INK,w-20,35);setTimeout(()=>{if(n.isValid&&this.toastRoot.isValid)empty(this.toastRoot);},2300);}
  private title(){const p=this.p,n=p.node(this.root,'Title');p.rect(n,p.w/2,p.h/2,p.w,p.h,'#bfe1d2',0).addComponent(BlockInputEvents);const f=this.art.get('cover')!,ratio=f.rect.width/f.rect.height,ww=Math.max(p.w,p.h*ratio);p.image(n,'cover',p.w/2,ww/ratio/2,ww,ww/ratio);this.button(p,n,'开始游戏',p.w/2,p.h*.87,Math.min(300,p.w*.45),p.h<500?44:57,()=>{this.started=true;this.cb.start();this.panel=this.state().advanced.auto.report?.unread?'offline':null;this.render();},'#67ca70','#3fa84d',p.h<500?20:25);p.label(n,'种田 · 育种 · 装修 · 探索',p.w/2,p.h*.96,13,'#ffffff',300,25,true,'center','#5a3e2b');} 
}
import {Label,sys} from 'cc';
function importLabel(){return Label;}
function shortTime(n:number){return n<60?`${n}秒`:`${Math.floor(n/60)}分${n%60?`${n%60}秒`:''}`;}
