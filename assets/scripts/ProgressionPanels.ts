import {Node,BlockInputEvents,Graphics} from 'cc';
import {Painter} from './Drawing';
import {CROPS,DECOS,FarmState,levelFor} from './FarmModel';
import {AQUATIC,ANIMALS,FACTORIES,TRAVEL_MAPS} from './FarmCatalog';
import {RECIPES,recipeProduct} from './FarmFeatures';
import {REGIONS,RegionId} from './WorldData';
import {worldWidth,levelReward,unclaimedLevels,hasRegion,openRegion} from './FarmProgression';
import type {FeaturePanelContext} from './FeaturePanels';
export function unlocksAt(level:number){const items:{key:string;name:string}[]=[];
 for(const r of REGIONS)if(r.level===level)items.push({key:r.icon,name:r.name});
 for(const c of CROPS.slice(0,6))if(c.level===level)items.push({key:c.id,name:c.name});
 for(const a of ANIMALS.slice(0,2))if(a.level===level)items.push({key:a.sprite,name:a.name});
 for(const d of DECOS)if(!('stars'in d)&&d.level===level)items.push({key:d.sprite,name:d.name});
 for(const a of ANIMALS.slice(2))if(a.level===level)items.push({key:a.sprite,name:a.name});
 for(const c of CROPS.slice(6))if(c.level===level)items.push({key:c.id,name:c.name});
 for(const a of AQUATIC)if(a.level===level)items.push({key:a.id,name:a.name+'养殖'});
 for(const m of TRAVEL_MAPS)if(m.level===level)items.push({key:m.icon,name:m.name});
 for(const f of FACTORIES)if(f.level===level)items.push({key:'factory_'+f.id,name:f.name});
 for(const r of RECIPES)if(r.level===level)items.push({key:recipeProduct(r),name:r.name});
 return items;
}
export function worldPanel(c:FeaturePanelContext,focus:(id:RegionId|'home')=>void){
 const {p,root,w,state:s,slot,button,act}=c;
 p.label(root,`农场版图 · ${worldWidth(s)} × 22 · ${s.plots.length}个田位`,w/2,21,22,'#5a3e2b',w-20,35);
 p.label(root,'升级解锁区域，开拓后地图、道路和可用空间都会扩大',w/2,56,13,'#997455',w-20,31);
 button('回主农场',w/2,103,180,39,()=>focus('home'),'#58bde4','#3295bd',15);
 REGIONS.forEach((r,i)=>{const y=225+i*192,owned=hasRegion(s,r.id),available=levelFor(s.xp)>=r.level;slot(w/2,y,w,174);p.contain(root,r.icon,57,y-15,82,90);p.label(root,r.name,262,y-53,22,'#5a3e2b',290,33,true,'left');p.label(root,`${r.level}级 · 开拓后地图 ${r.x+r.w}×22`,262,y-19,13,'#997455',290,28,true,'left');p.label(root,r.description,w/2,y+18,12.5,'#997455',w-30,36);p.label(root,owned?'已开拓 · 新区域里可以种植、收获和布置':`${r.coins}金币 + ${r.stars}农场星`,w/2-95,y+62,12,'#997455',w-205,30);button(owned?'前往查看':available?`开拓${r.name}`:`${r.level}级解锁`,w-91,y+62,160,41,()=>{if(owned){focus(r.id);return;}const before=s.progression.regions.length;act(()=>openRegion(s,r.id));if(s.progression.regions.length>before)focus(r.id);},owned?'#58bde4':available?'#67ca70':'#cbbd9e',owned?'#3295bd':available?'#3fa84d':'#ac9978',14);});
}
export function levelsPanel(c:FeaturePanelContext,show:(level:number)=>void){
 const {p,root,w,state:s,slot,button}=c,lv=levelFor(s.xp),pending=unclaimedLevels(s);p.label(root,`当前${lv}级 · ${pending.length}份奖励待领取`,w/2,22,21,'#5a3e2b',w-20,36);p.label(root,'点击奖励查看升级卡片；每级只能领取一次',w/2,58,13,'#997455',w-20,29);
 for(let level=2;level<=Math.min(100,Math.max(10,lv+2));level++){
  const y=133+(level-2)*116,r=levelReward(level),claimed=s.progression.claimedLevels.includes(level),unlocks=unlocksAt(level);slot(w/2,y,w,104);p.contain(root,'star',38,y,52);p.label(root,String(level),38,y+2,19,'#5a3e2b',42,40,true,'center','#ffffff');p.label(root,`${level}级奖励`,191,y-26,18,'#5a3e2b',235,30,true,'left');p.label(root,`${r.coins}金币 · ${r.stars}农场星${r.bait?` · ${r.bait}鱼饵`:''}`,191,y+2,12,'#997455',235,26,true,'left');p.label(root,unlocks.length?'解锁：'+unlocks.map(i=>i.name).join('、'):'继续经营，农场会越来越热闹',w/2-55,y+32,11.5,'#997455',w-140,25,true,'left');button(claimed?'已领取':level>lv?'待升级':'查看奖励',w-64,y-5,112,39,()=>show(level),claimed?'#b1c79e':level>lv?'#cbbd9e':'#ffb54d',claimed?'#8aa477':level>lv?'#ac9978':'#dc922b',14);
 }
}
export function levelUpCard(p:Painter,root:Node,s:FarmState,level:number,button:(label:string,x:number,y:number,w:number,h:number,run:()=>void,color?:string,dark?:string,font?:number)=>Node,confirm:()=>void){
 const compact=p.h<620,x=p.w/2,base=(p.h-(compact?342:520))/2,starY=base+(compact?45:100),top=base+(compact?84:150),width=Math.min(compact?430:380,p.w-24),height=compact?258:360,starSize=compact?110:210;
 const rays=p.g(root,'LevelSunburst');for(let i=0;i<18;i++){const a=i*Math.PI/9,outer=starSize*.95,inner=starSize*.32,pts:[number,number][]=[[x+Math.cos(a-.04)*inner,starY+Math.sin(a-.04)*inner],[x+Math.cos(a-.1)*outer,starY+Math.sin(a-.1)*outer],[x+Math.cos(a+.1)*outer,starY+Math.sin(a+.1)*outer],[x+Math.cos(a+.04)*inner,starY+Math.sin(a+.04)*inner]];p.path(rays,pts,'#ffe591',undefined,1,35);}
 p.surface(root,x,top+height/2,width,height,'panel').addComponent(BlockInputEvents);p.contain(root,'star',x,starY,starSize,starSize);p.label(root,String(level),x,starY+(compact?3:8),compact?36:58,'#ffffff',starSize*.6,starSize*.6,true,'center','#6d4729');
 p.label(root,`升到${level}级！`,x,base+(compact?121:225),compact?24:30,'#ff9848',width-24,42);p.label(root,'你的农场一天天壮大',x,base+(compact?148:260),compact?12.5:14,'#997455',width-24,28);
 const unlocks=unlocksAt(level),shown=unlocks.slice(0,3),labelY=base+(compact?174:297),cardY=base+(compact?222:358),cardW=compact?76:94,cardH=compact?72:94;
 p.label(root,shown.length?(unlocks.length>3?`新解锁 · 另有${unlocks.length-3}项`:'新解锁'):'丰收奖励',x,labelY,compact?11.5:14,'#997455',width-24,25);
 const cards=shown.length?shown:[{key:'coin',name:'金币奖励'},{key:'study_star',name:'农场星'}];cards.forEach((item,i)=>{const xx=x+(i-(cards.length-1)/2)*(cardW+10);p.surface(root,xx,cardY,cardW,cardH,'slot','#ffffff','#f2d8ac');p.contain(root,item.key,xx,cardY-(compact?7:10),compact?43:57,compact?42:57);p.label(root,item.name,xx,cardY+(compact?24:32),compact?11:13,'#5a3e2b',cardW-6,24);});
 const reward=levelReward(level),claimed=s.progression.claimedLevels.includes(level);p.label(root,`${reward.coins}金币 · ${reward.stars}农场星${reward.bait?` · ${reward.bait}鱼饵`:''}`,x,base+(compact?273:425),compact?12:13,'#a87824',width-24,26);
 button(claimed?'已领取 · 继续经营':level>levelFor(s.xp)?'继续努力':'太棒了！',x,base+(compact?310:470),width-54,compact?43:48,confirm,'#67ca70','#3fa84d',compact?17:19);
}
