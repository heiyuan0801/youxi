import {Advanced,newAdvanced,migrateAdvanced} from './FarmAdvanced';
import {validateAdvanced} from './AdvancedValidation';
import {seedGenome} from './FarmGenetics';
import {Journey,newJourney,validJourney} from './FarmJourney';
import {FarmActivities,newActivities,validActivities,recordPumpkin} from './FarmActivities';
import {Ecology,newEcology,validateEcology,growAnimal} from './FarmEcology';
import {FEATURE_ITEMS,FEATURE_NAMES,FEATURE_PRICES,FeatureProductId,FarmFeatures,newFeatures,validateFeatures,rollDaily,refreshFeatures,discover,farmLevel,RECIPES,recipeFactory,recipeProduct} from './FarmFeatures';
import {FarmProgression,newProgression,validateProgression,animalCapacity} from './FarmProgression';
import {EXTRA_CROPS,ExtraCropId,ANIMALS,animalSpec,AnimalId,TRAVEL_MAPS,AQUATIC} from './FarmCatalog';
import {FarmLife,newLife,newCare,careFor,isAdult,efficiency,validateLife,refreshLife} from './FarmLife';
import {Retention,newRetention,legacyRetention,validRetention,touchRetention,notePlant,noteHarvest,noteWater,noteDeliver,noteDecor,syncCodex,shrineGrowFactor,shrineWaterExtraMs,shrineHarvestBonus} from './FarmRetention';
import {soilTier,cropGrowSeconds,waterCutMs,SOIL_WATER_LABEL} from './FarmSoil';
import {Fishery,newFishery,validFishery} from './FarmAngling';
export type {AnimalId} from './FarmCatalog';
export type CropId = 'wheat' | 'carrot' | 'tomato' | 'strawberry' | 'corn' | 'pumpkin' | ExtraCropId;
export type ProductId = CropId | 'egg' | 'milk' | FeatureProductId;
export interface Crop { id: CropId; name: string; seconds: number; cost: number; sell: number; xp: number; level: number; }
export const CROPS: Crop[] = [
  {id:'wheat',name:'小麦',seconds:20,cost:5,sell:10,xp:2,level:1},
  {id:'carrot',name:'胡萝卜',seconds:45,cost:10,sell:22,xp:4,level:1},
  {id:'tomato',name:'番茄',seconds:90,cost:18,sell:40,xp:7,level:3},
  {id:'strawberry',name:'草莓',seconds:150,cost:30,sell:68,xp:11,level:4},
  {id:'corn',name:'玉米',seconds:240,cost:45,sell:104,xp:16,level:6},
  {id:'pumpkin',name:'南瓜',seconds:360,cost:70,sell:165,xp:25,level:8},...EXTRA_CROPS
];
export const PRODUCTS = [...CROPS.map(c=>c.id), 'egg', 'milk',...Object.keys(FEATURE_ITEMS)] as ProductId[];
export const NAMES = {...Object.fromEntries(CROPS.map(c=>[c.id,c.name])),egg:'鸡蛋',milk:'牛奶',...FEATURE_NAMES} as Record<ProductId,string>;
export const PRICES = {...Object.fromEntries(CROPS.map(c=>[c.id,c.sell])),egg:30,milk:62,...FEATURE_PRICES} as Record<ProductId,number>;
export const DECOS=[{type:'bush',sprite:'bush',name:'花丛',cost:25,level:1,xp:1},{type:'pine',sprite:'tree_pine',name:'松树',cost:40,level:1,xp:2},{type:'tree',sprite:'tree_round',name:'绿树',cost:60,level:2,xp:3},{type:'hay',sprite:'hay',name:'干草堆',cost:50,level:2,xp:2},{type:'cherry',sprite:'tree_pink',name:'樱花树',cost:120,level:3,xp:5},{type:'scarecrow',sprite:'scarecrow',name:'稻草人',cost:90,level:4,xp:4},{type:'well',sprite:'well',name:'石井',cost:180,level:5,xp:6},{type:'sunflower',sprite:'sunflower',name:'向日葵',cost:0,level:1,xp:2,stars:8,task:'first-harvest'},{type:'signpost',sprite:'signpost',name:'路标',cost:0,level:1,xp:2,stars:8,task:'first-order'},{type:'bakery',sprite:'bakery',name:'面包摊',cost:0,level:1,xp:4,stars:14,task:'harvest-30'},{type:'swing',sprite:'swing',name:'秋千',cost:0,level:1,xp:4,stars:12,task:'animal-friend'}] as const;
export type DecoId=typeof DECOS[number]['type'];
export interface Plot { unlocked: boolean; crop: CropId | null; plantedAt: number; watered: boolean; growSeconds?:number; pauseAt?:number;pauseUntil?:number; composted?:boolean; soil?:0|1|2; }
export interface Animal { id: number; type: AnimalId; readyAt: number; }
export interface Order { id: number; person: string; message: string; needs: Partial<Record<ProductId,number>>; coins: number; xp: number; }
export interface FarmState {
  version: 1; coins: number; xp: number; inventory: Record<ProductId,number>; plots: Plot[];
  animals: Animal[]; orders: Order[]; orderSequence: number;
  stats: { harvests:number; deliveries:number; expansions:number; products:number };
  claimed: string[]; decorations: {type:DecoId;x:number;y:number}[]; savedAt:number; sound:boolean;
  layoutVersion:2; stars:number;days:number;activeDate:string;cropUnlocks:CropId[];beds:number[];music:boolean;haptics:boolean;penBonus:{hen:number;cow:number};
  features:FarmFeatures;
  progression:FarmProgression;
  life:FarmLife;ecology:Ecology;advanced:Advanced;
  journey:Journey;activities:FarmActivities;retention:Retention;fishery:Fishery;
}
export interface Result { ok:boolean; message:string; item?:ProductId; }
const fail=(message:string):Result=>({ok:false,message});
const success=(message:string,item?:ProductId):Result=>({ok:true,message,item});
export const levelFor=farmLevel;
export const levelFloor=(level:number)=>15*(level-1)*(level-1)+5*(level-1);
export const levelCeil=(level:number)=>15*level*level+5*level;
export const cropById=(id:CropId)=>CROPS.find(c=>c.id===id)!;
export function newFarm(now=Date.now()):FarmState {
  const inventory=Object.fromEntries(PRODUCTS.map(id=>[id,0])) as Record<ProductId,number>;
  inventory.wheat=2;
  const plots:Plot[]=Array.from({length:30},(_,i)=>({unlocked:i<9,crop:null,plantedAt:0,watered:false}));
  [0,1].forEach(i=>Object.assign(plots[i],{crop:'wheat',plantedAt:now-30000}));
  Object.assign(plots[2],{crop:'carrot',plantedAt:now-20000});Object.assign(plots[3],{crop:'wheat',plantedAt:now-8000});
  const life=newLife(now);for(let id=1;id<=4;id++)life.care[id]=newCare(now);
  return {version:1,journey:newJourney(),activities:newActivities(),advanced:newAdvanced(now),ecology:newEcology(),life,progression:newProgression(),features:newFeatures({harvests:0,products:0,deliveries:0},now),layoutVersion:2,stars:0,days:0,activeDate:'',cropUnlocks:[],beds:Array(18).fill(0),music:true,haptics:true,penBonus:{hen:0,cow:0},coins:120,xp:0,inventory,plots,animals:[
    {id:1,type:'hen',readyAt:now+6000},{id:2,type:'hen',readyAt:now+18000},
    {id:3,type:'hen',readyAt:now-1000},{id:4,type:'cow',readyAt:now+30000}],
    orders:[makeOrder(0),makeOrder(1),makeOrder(2)],orderSequence:3,
    stats:{harvests:0,deliveries:0,expansions:0,products:0},claimed:[],decorations:[],savedAt:now,sound:true,retention:newRetention(now),fishery:newFishery()};
}
const templates = [
  {person:'林奶奶',message:'早上的面包，就差新鲜的麦香啦。',needs:{wheat:3,carrot:1},coins:76,xp:12},
  {person:'面包师阿禾',message:'想用你的鸡蛋，烤一炉松软的小蛋糕。',needs:{egg:2,wheat:2},coins:84,xp:14},
  {person:'邻居小满',message:'给家人准备一份暖暖的农场早餐。',needs:{milk:1,carrot:2},coins:125,xp:18},
  {person:'集市店长',message:'今天的摊位需要一篮刚收下来的蔬菜。',needs:{carrot:3,wheat:2},coins:125,xp:18},
  {person:'露营的朋友',message:'带一点鸡蛋和牛奶，去草地上野餐吧。',needs:{egg:2,milk:1},coins:112,xp:16}
];
const artisanOrders=[
 {level:1,person:'池塘边的渔友',message:'新鲜的鱼配上胡萝卜，今晚煮一锅鲜汤。',needs:{fish:2,carrot:1},coins:95,xp:14},
 {level:2,person:'野餐的朋友',message:'想带上刚出炉的面包，去草地喝杯牛奶。',needs:{bread:1,milk:1},coins:185,xp:24},
 {level:3,person:'集市小厨',message:'你的农场奶酪，配蔬菜沙拉一定很棒。',needs:{cheese:1,carrot:2},coins:310,xp:30},
 {level:4,person:'果酱爱好者',message:'早餐最喜欢草莓果酱，记得留一罐给我。',needs:{jam:1,wheat:3},coins:315,xp:34},
 {level:8,person:'丰收宴主人',message:'南瓜派和金色锦鲤，让今晚的丰收宴更热闹。',needs:{pie:1,goldenFish:1},coins:625,xp:50},
 {level:6,person:'果林里的朋友',message:'带两颗新鲜苹果，再来一罐甜甜的蜂蜜。',needs:{apple:2,honey:1},coins:195,xp:28},
 {level:6,person:'礼品店店长',message:'想把你的果园礼篮，送给远方的朋友。',needs:{orchardBasket:1},coins:445,xp:45},
 {level:3,person:'森林木匠',message:'用新鲜木材和面粉，换一张暖心的订单。',needs:{wood:3,flour:2},coins:175,xp:25},
 {level:7,person:'牧场裁缝',message:'需要柔软的羊毛，给伙伴做一条围巾。',needs:{wool:2,cotton:1},coins:355,xp:38},
 {level:12,person:'小镇早餐铺',message:'今天想供应酸奶和现烤的曲奇。',needs:{yogurt:1,cookies:1},coins:960,xp:55},
 {level:16,person:'葡园旅人',message:'一瓶果醋，一杯葡萄汁，带着果香出发。',needs:{vinegar:1,grapeJuice:1},coins:1080,xp:65},
 {level:26,person:'节庆甜品师',message:'想用巧克力和糖果装点丰收节的餐桌。',needs:{chocolate:1,candy:1},coins:2050,xp:95},
 {level:40,person:'稀有动物研究员',message:'收集彩虹奶和黄金羊毛，记录小院里的奇迹。',needs:{rainbowMilk:1,goldenWool:1},coins:1100,xp:120},
 {level:60,person:'金色丰收宴',message:'把黄金南瓜和极光莓做成丰收展品吧。',needs:{goldenPumpkin:2,auroraBerry:1},coins:2200,xp:180}
];
export function makeOrder(id:number,level=1,state?:FarmState):Order {
  let eligible=[...templates,...artisanOrders.filter(o=>o.level<=level)];
  if(state){
    const renewable=new Set<ProductId>(['fish','goldenFish']);
    for(const crop of CROPS)if(crop.level<=level||state.cropUnlocks.includes(crop.id))renewable.add(crop.id);
    for(const animal of state.animals)renewable.add(animalSpec(animal.type).product);
    for(const map of TRAVEL_MAPS)if(map.id!=='village'&&state.life.maps.includes(map.id))for(const item of map.loot)renewable.add(item);
    for(const species of AQUATIC)if(state.ecology.ponds[species.id])renewable.add(species.id);
    if(state.progression.regions.includes('orchard')){renewable.add('apple');renewable.add('honey');}
    const obtainable=(needs:Partial<Record<ProductId,number>>)=>Object.entries(needs).every(([key,amount])=>{
      const item=key as ProductId;
      return renewable.has(item)||state.inventory[item]>=amount!;
    });
    let previousSize=0;
    while(previousSize!==renewable.size){
      previousSize=renewable.size;
      for(const recipe of RECIPES){
        if(recipe.level<=level&&state.life.factories.includes(recipeFactory(recipe))
          &&Object.keys(recipe.needs).every(item=>renewable.has(item as ProductId)))renewable.add(recipeProduct(recipe));
      }
    }
    eligible=eligible.filter(order=>obtainable(order.needs as Order['needs']));
  }
  const template=eligible[id%eligible.length]||templates[0];
  return {...template,id,needs:{...template.needs}} as Order;
}
export const growSeconds=(p:Plot)=>p.crop?(p.growSeconds??cropById(p.crop).seconds):0;
const paused=(p:Plot,now:number)=>p.pauseAt===undefined?0:Math.max(0,Math.min(now,p.pauseUntil!)-p.pauseAt);
export function readyPlot(p:Plot,now=Date.now()) {return !!p.crop&&now>=p.plantedAt+growSeconds(p)*1000+paused(p,now);}
export function secondsLeft(p:Plot,now=Date.now()) {return p.crop?Math.max(0,Math.ceil((p.plantedAt+growSeconds(p)*1000+paused(p,now)-now)/1000)):0;}
export function plant(s:FarmState,index:number,id:CropId,now=Date.now()):Result {
  const p=s.plots[index],c=cropById(id); if(!p||!p.unlocked)return fail('先扩建这块田地吧');
  if(s.activities.stormPlot===index)return fail('田里还有积水，先疏通再播种');
  if(p.crop)return fail('这块田里已经有作物了'); if(levelFor(s.xp)<c.level&&!s.cropUnlocks.includes(id))return fail(`${c.level}级解锁${c.name}`);
  if(s.coins<c.cost)return fail('金币不足，试试出售库存或完成订单');
  s.coins-=c.cost;delete p.pauseAt;delete p.pauseUntil;let grow=cropGrowSeconds(c.seconds,s.features.upgrades.irrigation,soilTier(p));const factor=shrineGrowFactor(s,now);if(factor!==1)grow=Math.round(grow*factor*1000)/1000;Object.assign(p,{crop:id,plantedAt:now,watered:false,growSeconds:grow});notePlant(s,id,now);return success(`种下${c.name}`,id);
}
export function harvest(s:FarmState,index:number,now=Date.now()):Result {
  const p=s.plots[index]; if(!p?.crop||!readyPlot(p,now))return fail('作物还在慢慢长大');
  recordPumpkin(s,p,now);
  rollDaily(s,now);const id=p.crop,c=cropById(id),bonus=shrineHarvestBonus(s,now);s.inventory[id]++;s.xp+=c.xp+bonus.xp;s.coins+=bonus.coins;s.stats.harvests++;discover(s,id);
  delete p.pauseAt;delete p.pauseUntil;delete p.composted;Object.assign(p,{crop:null,plantedAt:0,watered:false});noteHarvest(s,id,now);return success(`${c.name} +1 · 经验 +${c.xp}`,id);
}
export function water(s:FarmState,index:number,now=Date.now()):Result {
  const p=s.plots[index];if(!p?.crop||readyPlot(p,now))return fail('选择正在生长的作物浇水');
  if(p.watered)return fail('已经浇过水了，耐心等它长大吧');
  const tier=soilTier(p),cut=waterCutMs(growSeconds(p),tier)+shrineWaterExtraMs(s,growSeconds(p),now);p.plantedAt-=cut;p.watered=true;noteWater(s,now);const label=SOIL_WATER_LABEL[tier];return success(label==='20%'&&cut===growSeconds(p)*200?'浇水成功 · 生长时间缩短20%':`浇水成功 · 生长时间缩短${label}`);
}
export function sell(s:FarmState,id:ProductId,amount:number):Result {
  if(!Number.isInteger(amount)||amount<1||s.inventory[id]<amount)return fail('库存不足');
  const total=PRICES[id]*amount;s.inventory[id]-=amount;s.coins+=total;return success(`卖出${NAMES[id]} ×${amount} · 金币 +${total}`,id);
}
export const canDeliver=(s:FarmState,o:Order)=>Object.entries(o.needs).every(([id,n])=>s.inventory[id as ProductId]>=n!);
export function deliver(s:FarmState,id:number,now=Date.now()):Result {
  const i=s.orders.findIndex(o=>o.id===id),o=s.orders[i];if(!o)return fail('这张订单已完成');if(!canDeliver(s,o))return fail('还缺一些农产品，继续经营吧');
  rollDaily(s,now);for(const [id,n] of Object.entries(o.needs))s.inventory[id as ProductId]-=n!;
  s.coins+=o.coins;s.xp+=o.xp;s.stars++;s.stats.deliveries++;s.orders[i]=makeOrder(s.orderSequence++,levelFor(s.xp),s);
  noteDeliver(s,now);return success(`订单完成 · 金币 +${o.coins} · 经验 +${o.xp}`);
}
export const expansionCost=(s:FarmState)=>60+Math.max(0,s.plots.filter(p=>p.unlocked).length-9)*40;
export function expand(s:FarmState,index?:number):Result {
  const p=index===undefined?s.plots.find(p=>!p.unlocked):Number.isInteger(index)?s.plots[index]:undefined;if(!p)return fail('当前田地已全部开垦，可以去开拓新区域');if(p.unlocked)return fail('这块田地已经开垦');
  const cost=expansionCost(s);if(s.coins<cost)return fail(`扩建需要${cost}金币`);
  s.coins-=cost;p.unlocked=true;s.stats.expansions++;s.xp+=4;return success('新田地已开垦 · 经验 +4');
}
export const animalSeconds=(type:AnimalId)=>animalSpec(type).seconds;
export function collectAnimal(s:FarmState,id:number,now=Date.now()):Result {
  const a=s.animals.find(a=>a.id===id);if(!a)return fail('没有找到这只动物');
  if(!isAdult(s,a,now))return fail('幼崽正在成长，长大后才会生产');
  if(a.readyAt>now)return fail(`还需${Math.ceil((a.readyAt-now)/1000)}秒`);
  rollDaily(s,now);const spec=animalSpec(a.type),item=spec.product as ProductId,xp=spec.xp;s.inventory[item]++;s.xp+=xp;s.stats.products++;discover(s,item);
  growAnimal(s,a,5);a.readyAt=now+animalSeconds(a.type)*(1-.1*s.features.upgrades.animalCare)/efficiency(s,a)*1000;syncCodex(s,now);return success(`${NAMES[item]} +1 · 经验 +${xp}`,item);
}
export function buyAnimal(s:FarmState,type:AnimalId,now=Date.now()):Result {
  const spec=animalSpec(type);if(!spec)return fail('没有这种动物');const lv=spec.level,cost=spec.cost,cap=animalCapacity(s,type);
  if(levelFor(s.xp)<lv&&!(type==='whitePeacock'&&s.ecology.auroraAnimal))return fail(`${lv}级解锁购买${spec.name}`);if(s.animals.length>=60)return fail('最多可照顾60只动物');
  if(s.animals.filter(a=>a.type===type).length>=cap)return fail('动物小院已经住满啦');
  if(s.coins<cost)return fail('金币不足');s.coins-=cost;
  const id=Math.max(...s.animals.map(a=>a.id),0)+1;s.life.care[id]=newCare(now);s.animals.push({id,type,readyAt:now+animalSeconds(type)*(1-.1*s.features.upgrades.animalCare)*1000});
  seedGenome(s,s.animals[s.animals.length-1]);syncCodex(s,now);return success('新伙伴加入农场啦');
}
export const TASKS=[
  {id:'first-harvest',name:'丰收的喜悦',description:'收获5次作物',stat:'harvests',target:5,coins:50,xp:10},
  {id:'first-order',name:'邻里的心意',description:'完成1张订单',stat:'deliveries',target:1,coins:70,xp:10},
  {id:'first-land',name:'再多一片绿',description:'扩建1块田地',stat:'expansions',target:1,coins:40,xp:6},
  {id:'animal-friend',name:'小院好朋友',description:'收集5份动物产物',stat:'products',target:5,coins:65,xp:12},
  {id:'harvest-30',name:'熟练小农夫',description:'累计收获30次作物',stat:'harvests',target:30,coins:180,xp:30},
  {id:'order-10',name:'集市常客',description:'累计完成10张订单',stat:'deliveries',target:10,coins:260,xp:40}
] as const;
export function claimTask(s:FarmState,id:string):Result {
  const t=TASKS.find(t=>t.id===id);if(!t||s.claimed.includes(id))return fail('奖励已领取');
  if(s.stats[t.stat]<t.target)return fail('再努力一点，就能领取奖励啦');
  s.claimed.push(id);s.coins+=t.coins;s.xp+=t.xp;s.stars+=3;return success(`任务完成 · 金币 +${t.coins} · 农场星 +3`);
}
export function buyDecoration(s:FarmState,type:DecoId,x:number,y:number):Result {
  const d=DECOS.find(d=>d.type===type);if(!d)return fail('没有这种装饰');if(levelFor(s.xp)<d.level)return fail(`${d.level}级解锁${d.name}`);if(s.coins<d.cost)return fail('金币不足');if(s.decorations.length>=60)return fail('农场里的装饰已经很多啦');
  if('stars'in d){if(!s.claimed.includes(d.task))return fail('完成对应农场任务后解锁这件装饰');if(s.stars<d.stars)return fail(`需要${d.stars}颗农场星`);s.stars-=d.stars;}
  s.coins-=d.cost;s.xp+=d.xp;s.decorations.push({type,x,y});noteDecor(s);return success('新的风景，种在农场里');
}
export function skipOrder(s:FarmState,id:number):Result {const i=s.orders.findIndex(o=>o.id===id);if(i<0)return fail('订单已更新');s.orders[i]=makeOrder(s.orderSequence++,levelFor(s.xp),s);return success('收到一张新的邻里订单');}
export function unlockWithStars(s:FarmState,id:CropId):Result {const c=cropById(id),cost=({tomato:15,strawberry:25,corn:35,pumpkin:50} as Partial<Record<CropId,number>>)[id];if(!cost||levelFor(s.xp)>=c.level||s.cropUnlocks.includes(id))return fail('这颗种子已经解锁');if(s.stars<cost)return fail(`需要${cost}颗农场星，完成订单和任务可以获得`);s.stars-=cost;s.cropUnlocks.push(id);return success(`${c.name}已提前解锁`);}
export function expandWithStars(s:FarmState):Result {if(s.stars<15)return fail('需要15颗农场星');const p=s.plots.find(p=>!p.unlocked);if(!p)return fail('所有田地已开垦');s.stars-=15;p.unlocked=true;s.stats.expansions++;return success('用农场星开垦了一块新田地');}
export function expandPen(s:FarmState,type:'hen'|'cow'):Result {const cost=type==='hen'?18:30,max=type==='hen'?6:2,step=type==='hen'?2:1;if(s.penBonus[type]>=max)return fail('动物小院已经扩建到最大');if(s.stars<cost)return fail(`需要${cost}颗农场星`);s.stars-=cost;s.penBonus[type]=Math.min(max,s.penBonus[type]+step);return success('动物小院有更多位置啦');}
export function tendFlower(s:FarmState,index:number,now=Date.now()):Result {if(!Number.isInteger(index)||index<0||index>=18)return fail('没有这块花圃');const planted=s.beds[index];if(!planted){if(s.coins<5)return fail('种一颗花种需要5金币');s.coins-=5;s.beds[index]=now;return success('种下花种 · 一分钟后收获花朵');}if(now-planted<60000)return fail(`花朵还需${Math.ceil((60000-now+planted)/1000)}秒`);s.beds[index]=0;s.coins+=12;s.xp+=2;s.stars++;s.life.stats.flowers++;return success('花朵盛开 · 金币 +12 · 农场星 +1');}
export const SAVE_KEY='sunny-meadow-farm-v1';
export function serialize(s:FarmState,now=Date.now()):string {s.savedAt=now;return JSON.stringify(s);}
export function parseSave(raw:string|null,now=Date.now(),refresh=true):FarmState|null {
  if(!raw)return null;try{
    const s=JSON.parse(raw) as FarmState;
    const num=(x:unknown,max=1e12)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
    const int=(x:unknown,max=1e9)=>num(x,max)&&Number.isInteger(x);
    const legacy=s.features===undefined,beforeV04=s.progression===undefined,beforeV05=s.life===undefined;if(legacy&&s.inventory)for(const id of Object.keys(FEATURE_ITEMS))if(s.inventory[id as ProductId]===undefined)s.inventory[id as ProductId]=0;
    if(beforeV04){s.progression=newProgression();if(s.inventory)for(const id of ['apple','honey','orchardBasket'] as const)if(s.inventory[id]===undefined)s.inventory[id]=0;}
    if(beforeV05){s.life=newLife(now);if(s.inventory)for(const id of PRODUCTS)if(s.inventory[id]===undefined)s.inventory[id]=0;if(Array.isArray(s.animals))for(const a of s.animals)s.life.care[a.id]=newCare(now);}
    if(s.ecology===undefined){s.ecology=newEcology();if(s.inventory)for(const id of ['carp','crucian','bass','lobster','crab'] as const)if(s.inventory[id]===undefined)s.inventory[id]=0;}
    if(!validateProgression(s.progression))return null;
    if(s.version!==1||!int(s.coins)||!int(s.xp)||!num(s.savedAt,1e15)||!s.inventory||!PRODUCTS.every(id=>int(s.inventory[id])))return null;
    if(!Array.isArray(s.plots)||s.plots.length!==30+18*s.progression.regions.length||!s.plots.every(p=>typeof p.unlocked==='boolean'&&typeof p.watered==='boolean'&&(p.crop===null||CROPS.some(c=>c.id===p.crop))&&num(p.plantedAt,1e15)&&(!p.crop||p.unlocked)&&(p.growSeconds===undefined||(num(p.growSeconds,3600)&&p.growSeconds>0))&&((p.pauseAt===undefined&&p.pauseUntil===undefined)||(num(p.pauseAt,1e15)&&num(p.pauseUntil,1e15)&&p.pauseUntil!>=p.pauseAt!&&p.pauseUntil!-p.pauseAt!<=240000))&&(p.soil===undefined||p.soil===0||p.soil===1||p.soil===2)))return null;
    if(!Array.isArray(s.animals)||s.animals.length>60||!s.animals.every(a=>int(a.id)&&ANIMALS.some(v=>v.id===a.type)&&num(a.readyAt,1e15))||new Set(s.animals.map(a=>a.id)).size!==s.animals.length)return null;
    if(!Array.isArray(s.orders)||s.orders.length!==3||!int(s.orderSequence)||!s.orders.every(o=>int(o.id)&&typeof o.person==='string'&&typeof o.message==='string'&&int(o.coins)&&int(o.xp)&&o.needs&&Object.entries(o.needs).length>0&&Object.entries(o.needs).every(([id,n])=>PRODUCTS.includes(id as ProductId)&&int(n,99)&&n!>0)))return null;
    if(new Set(s.orders.map(o=>o.id)).size!==3||s.orders.some(o=>o.id>=s.orderSequence))return null;
    if(!s.stats||!['harvests','deliveries','expansions','products'].every(k=>int(s.stats[k as keyof typeof s.stats])))return null;
    if(!Array.isArray(s.claimed)||!s.claimed.every(id=>TASKS.some(t=>t.id===id))||new Set(s.claimed).size!==s.claimed.length)return null;
    if(!Array.isArray(s.decorations)||s.decorations.length>60||!s.decorations.every(d=>DECOS.some(x=>x.type===d.type)&&num(d.x,2000)&&num(d.y,1200)))return null;
    if(s.stars===undefined)s.stars=0;if(s.days===undefined)s.days=0;if(s.activeDate===undefined)s.activeDate='';if(s.cropUnlocks===undefined)s.cropUnlocks=[];
    if(s.beds===undefined)s.beds=Array(18).fill(0);if(s.music===undefined)s.music=true;if(s.haptics===undefined)s.haptics=true;
    if(s.penBonus===undefined)s.penBonus={hen:0,cow:0};if(!s.penBonus||!int(s.penBonus.hen,6)||!int(s.penBonus.cow,2))return null;
    if(!Array.isArray(s.beds)||s.beds.length!==18||!s.beds.every(n=>num(n,1e15))||typeof s.music!=='boolean'||typeof s.haptics!=='boolean')return null;
    if(!int(s.stars)||!int(s.days)||typeof s.activeDate!=='string'||!Array.isArray(s.cropUnlocks)||!s.cropUnlocks.every(id=>CROPS.some(c=>c.id===id)))return null;
    if(s.layoutVersion!==2){s.plots=[...s.plots.filter(p=>p.unlocked),...s.plots.filter(p=>!p.unlocked)];s.layoutVersion=2;}
    if(typeof s.sound!=='boolean')s.sound=true;
    if(legacy){s.features=newFeatures(s.stats,now);for(const id of PRODUCTS)if(s.inventory[id]>0)s.features.album.counts[id]=s.inventory[id];}
    if(!validateFeatures(s.features,PRODUCTS))return null;
    if(s.advanced===undefined)s.advanced=migrateAdvanced(s,now);
    if(!validateAdvanced(s,PRODUCTS))return null;
    if(!validateEcology(s.ecology,s.animals))return null;
    if(s.journey===undefined)s.journey=newJourney(s);
    if(s.activities===undefined)s.activities=newActivities();
    if(!validJourney(s.journey)||!validActivities(s.activities,s.plots))return null;
    if(s.activities.furniture&&s.advanced.room.items.length>=40)return null;
    if(s.plots.some(p=>p.composted!==undefined&&(p.composted!==true||p.crop!=='pumpkin'&&p.crop!=='goldenPumpkin')))return null;
    if(!validateLife(s.life,s.animals,PRODUCTS))return null;
    if(s.fishery===undefined)s.fishery=newFishery();
    if(!validFishery(s.fishery))return null;
    if(s.retention===undefined)s.retention=legacyRetention(now);
    if(s.retention.hud===undefined)s.retention.hud={left:true,right:true};
    if(!validRetention(s.retention))return null;
    if(refresh){refreshFeatures(s,now);refreshLife(s,now);touchRetention(s,now);}
    return s;
  }catch{return null;}
}
