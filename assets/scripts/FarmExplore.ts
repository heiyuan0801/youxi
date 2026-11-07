import type {FarmState,ProductId,Result} from './FarmModel';
import {TRAVEL_MAPS,TravelId} from './FarmCatalog';
import {ExploreEvent,ExploreRun} from './FarmAdvanced';
import {farmLevel,discover} from './FarmFeatures';
import {isAdult,refreshLife} from './FarmLife';
export const DEPTH_LIMIT=12;
type FieldMap=Exclude<TravelId,'village'>;
const CLASSIC:{name:string;kind:'treasure'|'bridge'|'nest'|'spring';icon:string}[]=[
 {name:'林间遗迹',kind:'treasure',icon:'gem'},
 {name:'断桥小径',kind:'bridge',icon:'planks'},
 {name:'迷路幼鸟',kind:'nest',icon:'pigeon'},
 {name:'清泉营地',kind:'spring',icon:'forestCamp'},
];
const REGIONAL:Record<FieldMap,{name:string;kind:Exclude<ExploreEvent,'puzzle'>;icon:string;cost:number}>={
 forest:{name:'林狐引路',kind:'fox',icon:'dog',cost:1},
 mine:{name:'晶脉裂缝',kind:'vein',icon:'gem',cost:1},
 beach:{name:'搁浅海贝',kind:'shell',icon:'fish',cost:1},
 snow:{name:'极光裂隙',kind:'flare',icon:'ice',cost:1},
};
const PUZZLES:Record<FieldMap,{title:string;icon:string;choices:string[];hint:(answer:number)=>string}>={
 forest:{title:'林灯谜题',icon:'tree_round',choices:['左灯','中灯','右灯'],hint:n=>`苔藓只长在第${n+1}盏灯下。点亮那一盏。`},
 mine:{title:'矿车配重',icon:'ore',choices:['轻车','中车','重车'],hint:n=>`轨道刻着“第${n+1}辆”。把矿石放上对应的车。`},
 beach:{title:'潮汐贝壳',icon:'beachPier',choices:['白贝','粉贝','蓝贝'],hint:n=>`潮线停在第${n+1}枚贝壳旁。拾起那一枚。`},
 snow:{title:'冰晶折射',icon:'ice',choices:['左棱','中棱','右棱'],hint:n=>`极光落在第${n+1}块冰棱上。转动那一块。`},
};
const HELP:Record<Exclude<ExploreEvent,'puzzle'>,{item:ProductId;name:string}>={
 bridge:{item:'planks',name:'木板'},nest:{item:'feed',name:'饲料'},spring:{item:'herb',name:'香草'},
 fox:{item:'feed',name:'饲料'},vein:{item:'planks',name:'木板'},shell:{item:'fish',name:'鱼'},flare:{item:'herb',name:'香草'},
};
export const EVENT_TEXT:Record<Exclude<ExploreEvent,'puzzle'>,{title:string;detail:string;help:string}>={
 bridge:{title:'断桥小径',detail:'帮助可得1宝石与2体力；绕路消耗1体力，得到1木材',help:'用1木板修桥'},
 nest:{title:'迷路幼鸟',detail:'帮助可得1宝石与2体力；绕路消耗1体力，得到1木材',help:'用1饲料喂幼鸟'},
 spring:{title:'清泉营地',detail:'帮助可得1宝石与2体力；绕路消耗1体力，得到1木材',help:'用1香草调制补给'},
 fox:{title:'林狐引路',detail:'林狐挡住小路。喂它一份饲料，它会叼来宝石。',help:'用1饲料招待林狐'},
 vein:{title:'晶脉裂缝',detail:'用木板撑住裂缝，才能取下里面的宝石。',help:'用1木板撑住晶脉'},
 shell:{title:'搁浅海贝',detail:'把一条鱼放回潮汐，贝壳里会留下宝石。',help:'用1条鱼交换'},
 flare:{title:'极光裂隙',detail:'用香草稳住裂隙，极光会凝成宝石。',help:'用1香草稳定裂隙'},
};
const BANDS:Record<FieldMap,{ground:string;tiles:string;icon:string}[]>= {
 forest:[{ground:'#abd780',tiles:'#b8e18c',icon:'tree_round'},{ground:'#83c48f',tiles:'#9cd3a0',icon:'tree_pink'},{ground:'#77a875',tiles:'#8bbc86',icon:'forestCamp'}],
 mine:[{ground:'#b6b8a3',tiles:'#c0c1ad',icon:'ore'},{ground:'#a3a5b9',tiles:'#b9bbc9',icon:'gem'},{ground:'#a99eb8',tiles:'#bab0ce',icon:'coal'}],
 beach:[{ground:'#f9df9c',tiles:'#ffe9b3',icon:'beachPier'},{ground:'#e8cead',tiles:'#f7e3c3',icon:'wood'},{ground:'#efd2b2',tiles:'#fbe4cb',icon:'gem'}],
 snow:[{ground:'#f4fbff',tiles:'#e6f3fa',icon:'ice'},{ground:'#dfeefb',tiles:'#d4e5f8',icon:'tree_pine'},{ground:'#dde1fa',tiles:'#ecedff',icon:'gem'}],
};
const LAYER_TITLES:Record<FieldMap,string[]>={
 forest:['林缘小径','萤火岔路','古树空地','苔桥深处','松果坡','雾中木屋','溪声弯','鸟巢层','藤蔓廊','静湖','深林祭坛','林心'],
 mine:['浅层矿道','支架巷','铜铃声','蓝晶洞室','矿车坡','落石厅','煤层','地下水','幽光矿脉','晶簇房','深井','矿心'],
 beach:['浅湾沙滩','潮线','漂流木','潮汐滩涂','礁石缝','贝壳湾','暖滩','落日礁岸','灯塔影','夜潮','珊瑚阶','海平线'],
 snow:['薄雪湖畔','脚印坡','冰桥','晶霜坡道','雾凇林','暖棚','风口','极光山谷','冰窟','星雪台','寂静岭','极光之心'],
};
function shade(hex:string,shift:number){if(!shift)return hex;const n=parseInt(hex.slice(1),16);const ch=(i:number)=>Math.max(0,Math.min(255,((n>>(16-8*i))&255)+shift));return '#'+[0,1,2].map(i=>ch(i).toString(16).padStart(2,'0')).join('');}
export interface LevelTheme {id:string;art:string;ground:string;tiles:string;title:string;icon:string;}
export function levelTheme(map:TravelId,depth=1):LevelTheme{
 if(map==='village')return {id:'village-layer-01',art:'village-square',ground:'#abd780',tiles:'#b8e18c',title:'工匠小镇',icon:'signpost'};
 const index=Math.min(DEPTH_LIMIT,Math.max(1,depth))-1,band=BANDS[map][Math.floor(index/4)],shift=(index%4)*7;
 return {id:`${map}-layer-${String(index+1).padStart(2,'0')}`,art:`${map}-layer-${String(index+1).padStart(2,'0')}`,ground:shade(band.ground,shift),tiles:shade(band.tiles,shift),title:LAYER_TITLES[map][index],icon:band.icon};
}
export function puzzleFor(run:ExploreRun){const bank=PUZZLES[run.map as FieldMap];const answer=(Math.imul(run.seed+run.depth*17,1664525)>>>0)%bank.choices.length;return {title:bank.title,hint:bank.hint(answer),choices:bank.choices,answer,icon:bank.icon};}
function eventRoute(r:ExploreRun){
 if(r.depth%4===0){const puzzle=PUZZLES[r.map as FieldMap];return {name:puzzle.title,kind:'puzzle' as const,icon:puzzle.icon,cost:1};}
 if(r.depth%3===0)return REGIONAL[r.map as FieldMap];
 const n=(Math.imul(r.seed+r.depth*101+r.step*19,1664525)>>>0)%4,classic=CLASSIC[n];
 return {name:classic.name,kind:classic.kind,icon:classic.icon,cost:1};
}
export function routes(s:FarmState){const r=s.advanced.explore.run;if(!r)return[];const event=eventRoute(r);return [{name:r.map==='mine'?'开采矿脉':r.map==='snow'?'冰湖垂钓':'沿途采集',kind:'gather' as const,icon:r.map==='mine'?'ore':r.map==='snow'?'fish':'wood',cost:2},event,{name:'扎营休息',kind:'rest' as const,icon:'forestCamp',cost:0}];}
const fail=(message:string):Result=>({ok:false,message});
export function beginExplore(s:FarmState,companion:number|null,now=Date.now()):Result{
 const m=TRAVEL_MAPS.find(m=>m.id===s.life.activeMap);if(!m||m.id==='village')return fail('先前往森林、矿山、海滩或雪原');if(s.advanced.explore.run)return fail('先完成当前探索或带物资回家');const pet=s.animals.find(a=>a.id===companion);if(companion!==null&&(!pet||!isAdult(s,pet,now)))return fail('请带成年伙伴出发');
 refreshLife(s,now);if(s.life.energy<4)return fail('出发需要4点农场体力');if(s.life.energy===24)s.life.energyAt=now+120000;s.life.energy-=4;const serial=++s.advanced.explore.serial;
 s.advanced.explore.run={map:m.id,seed:(Math.imul(serial,1664525)+1013904223)>>>0,depth:1,step:0,stamina:12,bag:{},event:null,companion};return {ok:true,message:'探索开始 · 物资暂存背包，随时可安全返程入库'};
}
export function takeRoute(s:FarmState,index:number):Result{
 const r=s.advanced.explore.run;if(!r)return fail('先开始分层探索');if(r.event)return fail('先处理眼前的事件');if(r.step>=3)return fail('本层已探索，可以进入下一层或返程');const route=routes(s)[index];if(!route)return fail('没有这条路线');
 if(route.kind==='rest'){if(r.stamina>=12)return fail('体力充足，可以继续探索');if(s.inventory.feed<1)return fail('扎营需要1份饲料补给');s.inventory.feed--;r.stamina=Math.min(12,r.stamina+5);return {ok:true,message:'扎营休息 · 探索体力 +5'};}
 const pet=s.animals.find(a=>a.id===r.companion),cost=pet&&['horse','unicorn','camel'].includes(pet.type)?1:route.cost;if(r.stamina<cost)return fail('探索体力不足，扎营补给或安全返程');r.stamina-=cost;
 if(route.kind!=='gather'&&route.kind!=='treasure'){r.event=route.kind;return {ok:true,message:route.kind==='puzzle'?'遇见地图谜题，读完提示再选择':'遇见新的事件，选择你的行动'};}
 const map=TRAVEL_MAPS.find(m=>m.id===r.map)!,item:ProductId=route.kind==='treasure'?'gem':r.map==='snow'?'fish':map.loot[(r.depth+r.step)%3] as ProductId,amount=1+Math.floor(r.depth/3)+(pet?.type==='dog'?1:0);r.bag[item]=(r.bag[item]||0)+amount;r.step++;return {ok:true,message:`${route.name}成功 · 物资放入探索背包`};
}
export function resolveExploreEvent(s:FarmState,choice:number):Result{
 const r=s.advanced.explore.run;if(!r?.event)return fail('没有待处理事件');
 if(r.event==='puzzle'){const puzzle=puzzleFor(r);if(choice===puzzle.choices.length){if(r.stamina<1)return fail('绕开谜题需要1探索体力，也可以直接返程');r.stamina--;r.bag.wood=(r.bag.wood||0)+1;r.event=null;r.step++;return {ok:true,message:'绕开谜题 · 收集1木材'};}if(!puzzle.choices[choice])return fail('没有这个选项');if(choice!==puzzle.answer){if(r.stamina<1)return fail('答错了，再试需要1探索体力');r.stamina--;return {ok:true,message:'不是这一处，再看看提示'};}r.bag.gem=(r.bag.gem||0)+1;r.stamina=Math.min(12,r.stamina+2);r.event=null;r.step++;return {ok:true,message:'谜题解开 · 获得宝石与2探索体力'};}
 if(![0,1].includes(choice))return fail('没有待处理事件');const help=HELP[r.event];if(choice===0){if(s.inventory[help.item]<1)return fail(`需要1份${help.name}`);s.inventory[help.item]--;r.bag.gem=(r.bag.gem||0)+1;r.stamina=Math.min(12,r.stamina+2);}else{if(r.stamina<1)return fail('绕行需要1探索体力，也可以直接返程');r.stamina--;r.bag.wood=(r.bag.wood||0)+1;}r.event=null;r.step++;return {ok:true,message:choice===0?'帮助成功 · 获得宝石与2探索体力':'沿安全小径绕行 · 收集1木材'};
}
export function descendExplore(s:FarmState):Result{
 const r=s.advanced.explore.run;if(!r||r.event||r.step<3)return fail('先完成本层3处路线');s.advanced.explore.best[r.map]=Math.max(s.advanced.explore.best[r.map]||0,r.depth);if(r.depth>=DEPTH_LIMIT)return fail('已到最深第12层，带着收获返程吧');
 const level=TRAVEL_MAPS.find(m=>m.id===r.map)!.level+r.depth*3;if(farmLevel(s.xp)<level)return fail(`下一层需要农场${level}级`);if(r.stamina<1)return fail('下一层需要1探索体力');r.stamina--;r.depth++;r.step=0;return {ok:true,message:`进入第${r.depth}层 · ${levelTheme(r.map,r.depth).title}`};
}
export function finishExplore(s:FarmState):Result{
 const r=s.advanced.explore.run;if(!r)return fail('没有进行中的探索');const completed=r.step>=3?r.depth:r.depth-1,old=s.advanced.explore.claimed[r.map]||0,bonus=Math.max(0,completed-old);let count=0;
 for(const [key,n]of Object.entries(r.bag)){const item=key as ProductId;s.inventory[item]+=n!;discover(s,item,n!);count+=n!;}s.xp+=count*8;s.stars+=bonus*2;s.coins+=bonus*80;s.advanced.explore.best[r.map]=Math.max(s.advanced.explore.best[r.map]||0,completed);s.advanced.explore.claimed[r.map]=Math.max(old,completed);s.advanced.explore.run=null;s.life.activeMap='home';return {ok:true,message:`安全返程 · ${count}份物资入库 · 首次通层奖励${bonus*80}金币、${bonus*2}星`};
}
