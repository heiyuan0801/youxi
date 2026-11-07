import type {FarmState,ProductId,Result} from './FarmModel';
import {TRAVEL_MAPS,TravelId,animalSpec} from './FarmCatalog';
import {farmLevel,discover} from './FarmFeatures';
import {isAdult,refreshLife} from './FarmLife';
export const DEPTH_LIMIT=12;
export function routes(s:FarmState){const r=s.advanced.explore.run;if(!r)return[];const n=(Math.imul(r.seed+r.depth*101+r.step*19,1664525)>>>0)%4;return [{name:r.map==='mine'?'开采矿脉':r.map==='snow'?'冰湖垂钓':'沿途采集',kind:'gather',icon:r.map==='mine'?'ore':r.map==='snow'?'fish':'wood',cost:2},{name:['林间遗迹','断桥小径','迷路幼鸟','清泉营地'][n],kind:['treasure','bridge','nest','spring'][n],icon:n===0?'gem':n===1?'planks':n===2?'pigeon':'forestCamp',cost:1},{name:'扎营休息',kind:'rest',icon:'forestCamp',cost:0}];}
export function beginExplore(s:FarmState,companion:number|null,now=Date.now()):Result{
 const m=TRAVEL_MAPS.find(m=>m.id===s.life.activeMap);if(!m||m.id==='village')return{ok:false,message:'先前往森林、矿山、海滩或雪原'};if(s.advanced.explore.run)return{ok:false,message:'先完成当前探索或带物资回家'};const pet=s.animals.find(a=>a.id===companion);if(companion!==null&&(!pet||!isAdult(s,pet,now)))return{ok:false,message:'请带成年伙伴出发'};
 refreshLife(s,now);if(s.life.energy<4)return{ok:false,message:'出发需要4点农场体力'};if(s.life.energy===24)s.life.energyAt=now+120000;s.life.energy-=4;const serial=++s.advanced.explore.serial;
 s.advanced.explore.run={map:m.id,seed:(Math.imul(serial,1664525)+1013904223)>>>0,depth:1,step:0,stamina:12,bag:{},event:null,companion};return{ok:true,message:'探索开始 · 物资暂存背包，随时可安全返程入库'};
}
export function takeRoute(s:FarmState,index:number):Result{
 const r=s.advanced.explore.run;if(!r)return{ok:false,message:'先开始分层探索'};if(r.event)return{ok:false,message:'先处理眼前的事件'};if(r.step>=3)return{ok:false,message:'本层已探索，可以进入下一层或返程'};const route=routes(s)[index];if(!route)return{ok:false,message:'没有这条路线'};
 if(route.kind==='rest'){if(r.stamina>=12)return{ok:false,message:'体力充足，可以继续探索'};if(s.inventory.feed<1)return{ok:false,message:'扎营需要1份饲料补给'};s.inventory.feed--;r.stamina=Math.min(12,r.stamina+5);return{ok:true,message:'扎营休息 · 探索体力 +5'};}
 const pet=s.animals.find(a=>a.id===r.companion),cost=pet&&['horse','unicorn','camel'].includes(pet.type)?1:route.cost;if(r.stamina<cost)return{ok:false,message:'探索体力不足，扎营补给或安全返程'};r.stamina-=cost;
 if(['bridge','nest','spring'].includes(route.kind)){r.event=route.kind as 'bridge'|'nest'|'spring';return{ok:true,message:'遇见新的事件，选择你的行动'};}
 const map=TRAVEL_MAPS.find(m=>m.id===r.map)!,item:ProductId=route.kind==='treasure'?'gem':r.map==='snow'?'fish':map.loot[(r.depth+r.step)%3] as ProductId,amount=1+Math.floor(r.depth/3)+(pet?.type==='dog'?1:0);r.bag[item]=(r.bag[item]||0)+amount;r.step++;return{ok:true,message:`${route.name}成功 · 物资放入探索背包`};
}
export function resolveExploreEvent(s:FarmState,choice:number):Result{
 const r=s.advanced.explore.run;if(!r?.event||![0,1].includes(choice))return{ok:false,message:'没有待处理事件'};const e=r.event;if(choice===0){const item=e==='bridge'?'planks':e==='nest'?'feed':'herb';if(s.inventory[item]<1)return{ok:false,message:`需要1份${e==='bridge'?'木板':e==='nest'?'饲料':'香草'}`};s.inventory[item]--;r.bag.gem=(r.bag.gem||0)+1;r.stamina=Math.min(12,r.stamina+2);}else{if(r.stamina<1)return{ok:false,message:'绕行需要1探索体力，也可以直接返程'};r.stamina--;r.bag.wood=(r.bag.wood||0)+1;}r.event=null;r.step++;return{ok:true,message:choice===0?'帮助成功 · 获得宝石与2探索体力':'沿安全小径绕行 · 收集1木材'};
}
export function descendExplore(s:FarmState):Result{
 const r=s.advanced.explore.run;if(!r||r.event||r.step<3)return{ok:false,message:'先完成本层3处路线'};s.advanced.explore.best[r.map]=Math.max(s.advanced.explore.best[r.map]||0,r.depth);if(r.depth>=DEPTH_LIMIT)return{ok:false,message:'已到最深第12层，带着收获返程吧'};
 const level=TRAVEL_MAPS.find(m=>m.id===r.map)!.level+r.depth*3;if(farmLevel(s.xp)<level)return{ok:false,message:`下一层需要农场${level}级`};if(r.stamina<1)return{ok:false,message:'下一层需要1探索体力'};r.stamina--;r.depth++;r.step=0;return{ok:true,message:`进入第${r.depth}层 · 资源更丰盛`};
}
export function finishExplore(s:FarmState):Result{
 const r=s.advanced.explore.run;if(!r)return{ok:false,message:'没有进行中的探索'};const completed=r.step>=3?r.depth:r.depth-1,old=s.advanced.explore.claimed[r.map]||0,bonus=Math.max(0,completed-old);let count=0;
 for(const [key,n]of Object.entries(r.bag)){const item=key as ProductId;s.inventory[item]+=n!;discover(s,item,n!);count+=n!;}s.xp+=count*8;s.stars+=bonus*2;s.coins+=bonus*80;s.advanced.explore.best[r.map]=Math.max(s.advanced.explore.best[r.map]||0,completed);s.advanced.explore.claimed[r.map]=Math.max(old,completed);s.advanced.explore.run=null;s.life.activeMap='home';return{ok:true,message:`安全返程 · ${count}份物资入库 · 首次通层奖励${bonus*80}金币、${bonus*2}星`};
}
