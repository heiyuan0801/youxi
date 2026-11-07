import {LIFE_ITEMS,FactoryId} from './FarmCatalog';
import type {FarmState,ProductId,Result} from './FarmModel';

export const FEATURE_ITEMS={...LIFE_ITEMS,
 bread:{name:'麦香面包',sell:76},cheese:{name:'农场奶酪',sell:186},jam:{name:'草莓果酱',sell:204},pie:{name:'南瓜派',sell:386},
 fish:{name:'溪流鱼',sell:24},goldenFish:{name:'金色锦鲤',sell:80},apple:{name:'苹果',sell:36},honey:{name:'蜂蜜',sell:70},orchardBasket:{name:'果园礼篮',sell:330}
} as const;
export type FeatureProductId=keyof typeof FEATURE_ITEMS;
export const FEATURE_NAMES=Object.fromEntries(Object.entries(FEATURE_ITEMS).map(([id,v])=>[id,v.name])) as Record<FeatureProductId,string>;
export const FEATURE_PRICES=Object.fromEntries(Object.entries(FEATURE_ITEMS).map(([id,v])=>[id,v.sell])) as Record<FeatureProductId,number>;
export type RecipeId=string;
export type UpgradeId='irrigation'|'workshop'|'animalCare';
export interface Recipe {id:RecipeId;name:string;level:number;seconds:number;xp:number;needs:Partial<Record<ProductId,number>>;factory?:FactoryId;product?:ProductId;amount?:number;}
export const RECIPES:Recipe[]=[
 {id:'bread',name:'麦香面包',level:1,seconds:30,xp:8,needs:{wheat:2,egg:1}},
 {id:'cheese',name:'农场奶酪',level:3,seconds:60,xp:15,needs:{milk:2}},
 {id:'jam',name:'草莓果酱',level:4,seconds:90,xp:22,needs:{strawberry:2}},
 {id:'pie',name:'南瓜派',level:8,seconds:120,xp:35,needs:{pumpkin:1,egg:1,milk:1}},
 {id:'orchardBasket',name:'果园礼篮',level:6,seconds:120,xp:35,needs:{apple:2,honey:1,bread:1}},
 {id:'flour',name:'面粉',factory:'mill',level:1,seconds:20,xp:5,needs:{wheat:2}},
 {id:'feed',name:'饲料',factory:'mill',amount:3,level:1,seconds:25,xp:5,needs:{wheat:2}},
 {id:'soyFeed',product:'feed',name:'豆香饲料',factory:'mill',amount:6,level:7,seconds:35,xp:10,needs:{soybean:2}},
 {id:'milledBread',product:'bread',name:'磨坊面包',factory:'bakery',level:2,seconds:25,xp:10,needs:{flour:2}},
 {id:'cake',name:'浆果蛋糕',factory:'bakery',level:11,seconds:100,xp:30,needs:{flour:2,egg:1,sugar:1}},
 {id:'cookies',name:'曲奇',factory:'bakery',level:11,seconds:65,xp:22,needs:{flour:1,butter:1,sugar:1}},
 {id:'butter',name:'黄油',factory:'dairy',level:5,seconds:45,xp:12,needs:{milk:2}},
 {id:'yogurt',name:'酸奶',factory:'dairy',level:5,seconds:60,xp:16,needs:{milk:2,strawberry:1}},
 {id:'dairyCheese',product:'cheese',name:'山羊奶酪',amount:2,factory:'dairy',level:12,seconds:60,xp:20,needs:{goatMilk:2}},
 {id:'appleJuice',name:'苹果汁',factory:'juice',level:6,seconds:40,xp:12,needs:{apple:2}},
 {id:'orangeJuice',name:'橙汁',factory:'juice',level:19,seconds:75,xp:25,needs:{orange:2}},
 {id:'grapeJuice',name:'葡萄汁',factory:'juice',level:16,seconds:65,xp:22,needs:{grape:2}},
 {id:'cloth',name:'棉布',factory:'textile',level:9,seconds:55,xp:18,needs:{cotton:2}},
 {id:'clothes',name:'衣服',factory:'textile',level:12,seconds:110,xp:35,needs:{cloth:2,wool:2}},
 {id:'sugar',name:'蔗糖',factory:'candy',level:11,seconds:45,xp:18,needs:{sugarcane:2}},
 {id:'chocolate',name:'巧克力',factory:'candy',level:26,seconds:110,xp:40,needs:{cocoa:2,sugar:1,milk:1}},
 {id:'candy',name:'糖果',factory:'candy',level:16,seconds:75,xp:28,needs:{sugar:2,grape:1}},
 {id:'vinegar',name:'果醋',factory:'brewing',level:16,seconds:120,xp:30,needs:{grape:2}},
 {id:'planks',name:'木板',factory:'lumber',level:3,seconds:35,xp:10,needs:{wood:2}},
 {id:'fruitCan',name:'水果罐头',factory:'cannery',level:19,seconds:90,xp:35,needs:{orange:2,sugar:2}},
 {id:'vegCan',name:'蔬菜罐头',factory:'cannery',level:19,seconds:80,xp:30,needs:{cabbage:2,carrot:2}}
];
export const recipeFactory=(r:Recipe):FactoryId=>r.factory||'bakery';
export const recipeProduct=(r:Recipe):ProductId=>(r.product||r.id) as ProductId;
export const UPGRADE_INFO={
 irrigation:{name:'田间水渠',icon:'watering',description:'新播作物生长时间每级减少10%'},
 workshop:{name:'风车工坊',icon:'windmill',description:'新制作每级提速15%，队列位置+1'},
 animalCare:{name:'精心照料',icon:'cow',description:'下一轮鸡蛋、牛奶等待每级减少10%'}
} as const;
export type DailyCounts={harvests:number;products:number;deliveries:number;crafted:number;catches:number};
export const DAILY_GOALS=[
 {id:'harvest',name:'篮子装满啦',description:'今天收获6次作物',stat:'harvests',target:6,coins:40,icon:'wheat'},
 {id:'animals',name:'小院早安',description:'今天收集3份鸡蛋或牛奶',stat:'products',target:3,coins:50,icon:'egg'},
 {id:'delivery',name:'给邻居送新鲜',description:'今天交付1张订单',stat:'deliveries',target:1,coins:65,icon:'truck'},
 {id:'craft',name:'刚出炉的香气',description:'今天领取1份工坊商品',stat:'crafted',target:1,coins:55,icon:'bread'},
 {id:'fishing',name:'池塘小收获',description:'今天钓到2条鱼',stat:'catches',target:2,coins:45,icon:'fish'}
] as const;
export const ALBUM_MILESTONES=[{target:4,coins:80,stars:2},{target:8,coins:180,stars:4},{target:12,coins:320,stars:6},{target:14,coins:500,stars:10},{target:17,coins:700,stars:12}];
export interface CraftJob {id:number;recipe:RecipeId;startedAt:number;readyAt:number;}
export interface FishingCast {serial:number;reward:'fish'|'goldenFish';biteAt:number;escapeAt:number;}
export interface FarmFeatures {
 schema:1;jobs:CraftJob[];nextJobId:number;upgrades:Record<UpgradeId,number>;
 stats:{crafted:number;catches:number};
 daily:{day:string;baseline:DailyCounts;claimed:string[];bonusClaimed:boolean};
 fishing:{bait:number;nextBaitAt:number;serial:number;cast:FishingCast|null};
 album:{counts:Partial<Record<ProductId,number>>;claimed:number[]};
}
const ok=(message:string,item?:ProductId):Result=>({ok:true,message,item});
const fail=(message:string):Result=>({ok:false,message});
export const farmLevel=(xp:number)=>{let level=1;while(xp>=15*level*level+5*level&&level<100)level++;return level;};
export const dayKey=(now=Date.now())=>new Date(now+8*3600000).toISOString().slice(0,10);
export function newFeatures(stats:{harvests:number;products:number;deliveries:number},now=Date.now()):FarmFeatures{return{
 schema:1,jobs:[],nextJobId:1,upgrades:{irrigation:0,workshop:0,animalCare:0},stats:{crafted:0,catches:0},
 daily:{day:dayKey(now),baseline:{harvests:stats.harvests,products:stats.products,deliveries:stats.deliveries,crafted:0,catches:0},claimed:[],bonusClaimed:false},
 fishing:{bait:5,nextBaitAt:now+300000,serial:0,cast:null},album:{counts:{},claimed:[]}
};}
function totals(s:FarmState):DailyCounts{return{harvests:s.stats.harvests,products:s.stats.products,deliveries:s.stats.deliveries,...s.features.stats};}
export function rollDaily(s:FarmState,now=Date.now()){const day=dayKey(now);if(day<=s.features.daily.day)return false;s.features.daily={day,baseline:totals(s),claimed:[],bonusClaimed:false};return true;}
export function refreshFeatures(s:FarmState,now=Date.now()){
 let changed=rollDaily(s,now);const f=s.features.fishing;
 if(f.bait<5&&now>=f.nextBaitAt){const n=Math.floor((now-f.nextBaitAt)/300000)+1;f.bait=Math.min(5,f.bait+n);f.nextBaitAt=f.bait>=5?now+300000:f.nextBaitAt+n*300000;changed=true;}
 return changed;
}
export function discover(s:FarmState,id:ProductId,amount=1){s.features.album.counts[id]=(s.features.album.counts[id]||0)+amount;}
export const queueCapacity=(s:FarmState)=>2+s.features.upgrades.workshop;
export const recipeSeconds=(s:FarmState,r:Recipe)=>Math.round(r.seconds*(1-.15*s.features.upgrades.workshop)*10)/10;
export function enqueueCraft(s:FarmState,id:RecipeId,now=Date.now()):Result{
 const r=RECIPES.find(r=>r.id===id);if(!r)return fail('没有这种配方');if(farmLevel(s.xp)<r.level)return fail(`${r.level}级解锁${r.name}`);
 if(r.factory&&!s.life.factories.includes(r.factory))return fail('先在工匠小镇建设这座工厂');
 if(s.features.jobs.filter(j=>recipeFactory(RECIPES.find(r=>r.id===j.recipe)! )===recipeFactory(r)).length>=queueCapacity(s))return fail('制作队列已满，先领取成品或升级工坊');
 if(!Object.entries(r.needs).every(([id,n])=>s.inventory[id as ProductId]>=n!))return fail('原料还不够，收获后再来制作吧');
 for(const [id,n]of Object.entries(r.needs))s.inventory[id as ProductId]-=n!;
 const start=Math.max(now,...s.features.jobs.filter(j=>recipeFactory(RECIPES.find(r=>r.id===j.recipe)!)===recipeFactory(r)).map(j=>j.readyAt));s.features.jobs.push({id:s.features.nextJobId++,recipe:id,startedAt:start,readyAt:start+recipeSeconds(s,r)*1000});
 return ok(`${r.name}加入制作队列，离线也会继续加工`);
}
export function collectCraft(s:FarmState,id:number,now=Date.now()):Result{
 const i=s.features.jobs.findIndex(j=>j.id===id),job=s.features.jobs[i];if(!job)return fail('这份成品已经领取');if(now<job.readyAt)return fail('还在制作中，再等一会儿吧');
 rollDaily(s,now);const r=RECIPES.find(r=>r.id===job.recipe)!;s.features.jobs.splice(i,1);const item=recipeProduct(r),amount=r.amount||1;s.inventory[item]+=amount;s.xp+=r.xp;s.features.stats.crafted++;discover(s,item,amount);
 return ok(`${r.name} +${amount} · 经验 +${r.xp}`,item);
}
export function upgradeCost(s:FarmState,id:UpgradeId){const lv=s.features.upgrades[id];return{coins:[180,450,900][lv]||0,stars:[2,4,6][lv]||0,level:2+lv*2};}
export function buyUpgrade(s:FarmState,id:UpgradeId):Result{
 if(!Object.prototype.hasOwnProperty.call(UPGRADE_INFO,id))return fail('没有这种设施');const lv=s.features.upgrades[id],cost=upgradeCost(s,id);if(lv>=3)return fail('这项设施已经升到最高级');
 if(farmLevel(s.xp)<cost.level)return fail(`${cost.level}级可以继续升级`);if(s.coins<cost.coins||s.stars<cost.stars)return fail(`升级需要${cost.coins}金币和${cost.stars}颗农场星`);
 s.coins-=cost.coins;s.stars-=cost.stars;s.features.upgrades[id]++;return ok(`${UPGRADE_INFO[id].name}升到${lv+1}级啦`);
}
export function dailyProgress(s:FarmState,id:string){const goal=DAILY_GOALS.find(g=>g.id===id);return goal?Math.max(0,totals(s)[goal.stat]-s.features.daily.baseline[goal.stat]):0;}
export function claimDaily(s:FarmState,id:string,now=Date.now()):Result{
 rollDaily(s,now);const goal=DAILY_GOALS.find(g=>g.id===id);if(!goal)return fail('没有这个每日目标');if(s.features.daily.claimed.includes(id))return fail('今天这份奖励已经领取');if(dailyProgress(s,id)<goal.target)return fail('今天的小目标还没有完成');
 s.features.daily.claimed.push(id);s.coins+=goal.coins;s.stars++;s.xp+=5;return ok(`每日目标完成 · ${goal.coins}金币 · 农场星 +1`);
}
export function claimDailyBonus(s:FarmState,now=Date.now()):Result{
 rollDaily(s,now);const daily=s.features.daily;if(daily.bonusClaimed)return fail('今天的三件小事奖励已经领取');if(daily.claimed.length<3)return fail('先完成并领取任意3个每日目标');
 daily.bonusClaimed=true;s.coins+=100;s.stars+=3;s.features.fishing.bait=Math.min(99,s.features.fishing.bait+2);return ok('今日三件小事完成 · 100金币 · 3农场星 · 2鱼饵');
}
export const discoveredCount=(s:FarmState)=>Object.values(s.features.album.counts).filter(n=>n!>0).length;
export function claimAlbum(s:FarmState,target:number):Result{
 const stage=ALBUM_MILESTONES.find(m=>m.target===target);if(!stage)return fail('没有这个图鉴奖励');if(s.features.album.claimed.includes(target))return fail('这份图鉴奖励已经领取');if(discoveredCount(s)<target)return fail(`再发现一些农产品吧，需要${target}种`);
 s.features.album.claimed.push(target);s.coins+=stage.coins;s.stars+=stage.stars;return ok(`图鉴收集奖励 · ${stage.coins}金币 · ${stage.stars}农场星`);
}
export function fishingPhase(s:FarmState,now=Date.now()):'idle'|'waiting'|'bite'|'escaped'{const c=s.features.fishing.cast;return !c?'idle':now<c.biteAt?'waiting':now<=c.escapeAt?'bite':'escaped';}
function castRandom(serial:number,day:string){let n=serial*1103515245;for(const c of day)n=(Math.imul(n^c.charCodeAt(0),1664525)+1013904223)>>>0;return(n>>>0)/4294967296;}
export function castLine(s:FarmState,now=Date.now()):Result{
 refreshFeatures(s,now);const f=s.features.fishing;if(f.cast&&fishingPhase(s,now)!=='escaped')return fail('鱼竿已经在水里，等咬钩后收杆吧');if(f.bait<1)return fail('鱼饵用完啦，可以等它恢复或购买一小包');
 if(f.bait>=5)f.nextBaitAt=now+300000;f.bait--;const serial=++f.serial,r=castRandom(serial,dayKey(now)),biteAt=now+3500+Math.round(r*2000);f.cast={serial,reward:r<.14?'goldenFish':'fish',biteAt,escapeAt:biteAt+4500};return ok('已抛竿！等浮漂下沉，再及时收杆');
}
export function reelLine(s:FarmState,now=Date.now()):Result{
 const f=s.features.fishing,phase=fishingPhase(s,now);if(phase==='idle')return fail('先放一份鱼饵抛竿吧');if(phase==='waiting')return fail('还没咬钩，看到提示再收杆');if(phase==='escaped')return fail('鱼跑掉啦，换一份鱼饵再试试');
 rollDaily(s,now);const item=f.cast!.reward;f.cast=null;s.inventory[item]++;s.features.stats.catches++;s.xp+=item==='goldenFish'?12:5;discover(s,item);return ok(`${item==='goldenFish'?'钓到稀有的金色锦鲤！':'钓到一条溪流鱼！'} · 已放入仓库`,item);
}
export function buyBait(s:FarmState,now=Date.now()):Result{refreshFeatures(s,now);if(s.features.fishing.bait>94)return fail('鱼饵已经很充足啦');if(s.coins<30)return fail('一小包鱼饵需要30金币');s.coins-=30;s.features.fishing.bait+=5;return ok('鱼饵 +5');}

export function validateFeatures(f:any,products:readonly string[]):f is FarmFeatures{
 const int=(n:unknown,max=1e9)=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<=max;
 const time=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e15;
 const unique=(a:any[])=>new Set(a).size===a.length;
 if(!f||f.schema!==1||!f.upgrades||!Object.keys(UPGRADE_INFO).every(k=>int(f.upgrades[k],3)))return false;
 if(!f.stats||!int(f.stats.crafted)||!int(f.stats.catches)||!int(f.nextJobId)||f.nextJobId<1)return false;
 if(!Array.isArray(f.jobs)||f.jobs.length>9*(2+f.upgrades.workshop)||!unique(f.jobs.map((j:any)=>j.id))||!f.jobs.every((j:any)=>int(j.id)&&j.id<f.nextJobId&&RECIPES.some(r=>r.id===j.recipe)&&time(j.startedAt)&&time(j.readyAt)&&j.readyAt>j.startedAt))return false;
 for(const factory of ['bakery','mill','dairy','juice','textile','candy','brewing','lumber','cannery']){const jobs=f.jobs.filter((j:any)=>recipeFactory(RECIPES.find(r=>r.id===j.recipe)!)===factory);if(jobs.length>2+f.upgrades.workshop||jobs.some((j:any,i:number)=>i>0&&j.startedAt<jobs[i-1].readyAt))return false;}
 const d=f.daily;if(!d||typeof d.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d.day)||!d.baseline||!['harvests','products','deliveries','crafted','catches'].every(k=>int(d.baseline[k]))||typeof d.bonusClaimed!=='boolean'||!Array.isArray(d.claimed)||!unique(d.claimed)||!d.claimed.every((id:string)=>DAILY_GOALS.some(g=>g.id===id)))return false;
 const b=f.fishing;if(!b||!int(b.bait,99)||!time(b.nextBaitAt)||!int(b.serial))return false;
 if(b.cast!==null&&(!b.cast||!int(b.cast.serial)||b.cast.serial!==b.serial||!['fish','goldenFish'].includes(b.cast.reward)||!time(b.cast.biteAt)||!time(b.cast.escapeAt)||b.cast.escapeAt-b.cast.biteAt!==4500))return false;
 const a=f.album;return !!a&&!!a.counts&&typeof a.counts==='object'&&!Array.isArray(a.counts)&&Object.entries(a.counts).every(([id,n])=>products.includes(id)&&int(n))&&Array.isArray(a.claimed)&&unique(a.claimed)&&a.claimed.every((n:number)=>ALBUM_MILESTONES.some(m=>m.target===n));
}
