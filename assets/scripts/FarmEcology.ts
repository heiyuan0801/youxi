import type {FarmState,Result,ProductId,Animal} from './FarmModel';
import {noteFestivalPlay} from './FarmRetention';
import {AQUATIC,AquaticId,ANIMALS,AnimalId,animalSpec} from './FarmCatalog';
import {careFor,isAdult,seasonIndex,weatherAt} from './FarmLife';
import {farmLevel,discover} from './FarmFeatures';

export interface Growth {xp:number;trainAt:number;contestSeason:number;medals:number;}
export interface Ecology {
 schema:1;roaming:boolean;growth:Record<number,Growth>;
 ponds:Partial<Record<AquaticId,{readyAt:number;fed:boolean;cycles:number}>>;
 eventSeason:number;events:number[];auroraAnimal:boolean;
}
export const newEcology=():Ecology=>({schema:1,roaming:true,growth:{},ponds:{},eventSeason:0,events:[],auroraAnimal:false});
const ok=(message:string,item?:ProductId):Result=>({ok:true,message,item}),fail=(message:string):Result=>({ok:false,message});
export const growthFor=(s:FarmState,a:Animal)=>s.ecology.growth[a.id]||(s.ecology.growth[a.id]={xp:0,trainAt:0,contestSeason:-1,medals:0});
export const growthLevel=(s:FarmState,a:Animal)=>Math.min(10,1+Math.floor((s.ecology.growth[a.id]?.xp||0)/50));
export function growAnimal(s:FarmState,a:Animal,n:number){const g=growthFor(s,a);g.xp=Math.min(450,g.xp+n);}
export function toggleRoaming(s:FarmState):Result{s.ecology.roaming=!s.ecology.roaming;return ok(s.ecology.roaming?'打开小院门，所有动物沿小路出去玩':'召回伙伴：它们会沿小路走回小院');}
export function trainAnimal(s:FarmState,id:number,now=Date.now()):Result{
 const a=s.animals.find(a=>a.id===id);if(!a)return fail('找不到这位伙伴');if(!isAdult(s,a,now))return fail('幼崽长大后再训练');
 const g=growthFor(s,a),c=careFor(s,a,now);if(g.xp>=450)return fail('已经达到成长10级');if(now<g.trainAt)return fail('训练后休息2分钟吧');if(s.inventory.feed<1)return fail('训练需要1份饲料');
 s.inventory.feed--;g.trainAt=now+120000;growAnimal(s,a,20);c.bond=Math.min(100,c.bond+4);c.mood=Math.min(100,c.mood+5);return ok(`${animalSpec(a.type).name}成长经验 +20 · 成长${growthLevel(s,a)}级`);
}
export function contestAnimal(s:FarmState,id:number,now=Date.now()):Result{
 const a=s.animals.find(a=>a.id===id);if(!a)return fail('找不到这位伙伴');if(!isAdult(s,a,now))return fail('幼崽长大后再参赛');const c=careFor(s,a,now),g=growthFor(s,a),season=seasonIndex(s,now);
 if(g.contestSeason===season)return fail('这位伙伴本季已经参赛，下季再来');if(c.hunger<60||c.health<80)return fail('参赛需要饱食60、健康80');
 const score=Math.floor((c.mood+c.health+c.bond)/3)+growthLevel(s,a)*5+animalSpec(a.type).rarity*5,tier=score>=120?3:score>=95?2:1;
 g.contestSeason=season;g.medals+=tier;growAnimal(s,a,15);s.coins+=tier*120;s.stars+=tier*2;
 return ok(`动物友谊赛 · ${score}分 · ${['','铜','银','金'][tier]}牌！金币 +${tier*120} · 农场星 +${tier*2}`);
}
export function buildPond(s:FarmState,id:AquaticId):Result{
 const f=AQUATIC.find(f=>f.id===id);if(!f)return fail('没有这种水产');if(s.ecology.ponds[id])return fail('已经拥有这个养殖池');if(farmLevel(s.xp)<f.level)return fail(`${f.level}级解锁${f.name}养殖`);if(s.coins<f.cost)return fail(`建设需要${f.cost}金币`);
 s.coins-=f.cost;s.ecology.ponds[id]={readyAt:0,fed:false,cycles:0};return ok(`${f.name}养殖池建好啦，投喂后开始生长`);
}
export function feedPond(s:FarmState,id:AquaticId,now=Date.now()):Result{
 const f=AQUATIC.find(f=>f.id===id),p=s.ecology.ponds[id];if(!f||!p)return fail('先建养殖池');if(p.fed)return fail('先收获这一批水产');if(s.inventory.feed<1)return fail('投喂需要1份饲料');
 s.inventory.feed--;p.fed=true;p.readyAt=now+f.seconds*1000;return ok(`${f.name}开始生长 · ${f.seconds}秒后可收获`);
}
export function harvestPond(s:FarmState,id:AquaticId,now=Date.now()):Result{
 const f=AQUATIC.find(f=>f.id===id),p=s.ecology.ponds[id];if(!f||!p||!p.fed)return fail('投喂后才会开始生长');if(now<p.readyAt)return fail('水产还在生长');p.fed=false;p.readyAt=0;p.cycles++;s.inventory[id]+=f.output;s.xp+=15;s.stats.products+=f.output;discover(s,id,f.output);return ok(`${f.name} ×${f.output} 已入库 · 经验 +15`,id);
}
export const SEASON_EVENTS:[{name:string;description:string;needs:Partial<Record<ProductId,number>>;coins:number;stars:number},...{name:string;description:string;needs:Partial<Record<ProductId,number>>;coins:number;stars:number}[]]=[
 {name:'春耕播种节',description:'为邻居准备播种物资',needs:{wheat:8,feed:2},coins:220,stars:3},
 {name:'樱花茶会',description:'献上香草与甜蜜果酱',needs:{herb:4,jam:1},coins:420,stars:4},
 {name:'春日花艺展',description:'用薰衣草和香草装饰会场',needs:{lavender:2,herb:3},coins:850,stars:6},
 {name:'西瓜节',description:'送上清凉西瓜与橙汁',needs:{watermelon:3,orangeJuice:1},coins:1100,stars:5},
 {name:'海滩野餐',description:'准备面包与苹果汁',needs:{bread:3,appleJuice:2},coins:650,stars:4},
 {name:'夏日鲜鱼展',description:'带上自己养殖的鲜鱼',needs:{carp:3,crucian:2},coins:600,stars:5},
 {name:'南瓜评选',description:'普通与黄金南瓜共同参展',needs:{pumpkin:5,goldenPumpkin:1},coins:1450,stars:7},
 {name:'丰收宴会',description:'送上玉米、土豆和面包',needs:{corn:4,potato:4,bread:2},coins:850,stars:5},
 {name:'秋日绒线节',description:'给镇民准备温暖的衣服',needs:{clothes:1,wool:3},coins:1250,stars:6},
 {name:'雪原冰雕会',description:'用雪原冰晶点缀节日',needs:{ice:5,gem:1},coins:850,stars:5},
 {name:'冬日礼物节',description:'为镇民送上蛋糕和糖果',needs:{cake:1,candy:1},coins:1750,stars:7},
 {name:'暖冬衣橱',description:'募集衣服和木材',needs:{clothes:2,wood:5},coins:1850,stars:8}
];
export function seasonEvents(s:FarmState,now=Date.now()){return SEASON_EVENTS.slice(seasonIndex(s,now)%4*3,seasonIndex(s,now)%4*3+3);}
export function deliverSeasonEvent(s:FarmState,index:number,now=Date.now()):Result{
 if(!Number.isInteger(index)||index<0||index>2)return fail('没有这个活动');const season=seasonIndex(s,now),e=seasonEvents(s,now)[index];
 if(s.ecology.eventSeason===season&&s.ecology.events.includes(index))return fail('本季活动奖励已领取');const needs=Object.entries(e.needs) as [ProductId,number][];if(needs.some(([id,n])=>s.inventory[id]<n))return fail('材料还没准备齐，去种植、养殖或工坊制作吧');
  if(s.ecology.eventSeason!==season){s.ecology.eventSeason=season;s.ecology.events=[];}for(const [id,n]of needs)s.inventory[id]-=n;s.ecology.events.push(index);s.coins+=e.coins;s.stars+=e.stars;noteFestivalPlay(s,now);return ok(`${e.name}完成 · ${e.coins}金币 · ${e.stars}农场星`);
}
export function unlockAuroraAnimal(s:FarmState,now=Date.now()):Result{
 if(weatherAt(s,now)!=='aurora')return fail('在极光天气中寻找白色孔雀');if(s.ecology.auroraAnimal)return fail('白色孔雀已开放领养');s.ecology.auroraAnimal=true;return ok('极光奇遇 · 白色孔雀已提前开放领养，可前往商店购买');
}
export function validateEcology(e:any,animals:Animal[]):e is Ecology {
 const n=(x:any,max=1e15)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max,i=(x:any,max=1e9)=>n(x,max)&&Number.isInteger(x),obj=(x:any)=>x&&typeof x==='object'&&!Array.isArray(x);
 if(!e||e.schema!==1||typeof e.roaming!=='boolean'||typeof e.auroraAnimal!=='boolean'||!obj(e.growth)||!obj(e.ponds))return false;
 if(!Object.entries(e.growth).every(([id,v])=>{const g=v as Growth;return animals.some(a=>String(a.id)===id)&&g&&i(g.xp,450)&&n(g.trainAt)&&Number.isInteger(g.contestSeason)&&g.contestSeason>=-1&&g.contestSeason<=1e9&&i(g.medals);}))return false;
 if(!Object.entries(e.ponds).every(([id,v])=>{const p=v as any;return AQUATIC.some(f=>f.id===id)&&p&&n(p.readyAt)&&typeof p.fed==='boolean'&&(p.fed?p.readyAt>0:p.readyAt===0)&&i(p.cycles);}))return false;
 return i(e.eventSeason)&&Array.isArray(e.events)&&e.events.length<=3&&new Set(e.events).size===e.events.length&&e.events.every((x:any)=>i(x,2));
}
