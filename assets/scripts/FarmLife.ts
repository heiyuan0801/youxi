import {genome,geneValue,geneBonus,inherit,related} from './FarmGenetics';
import {growthLevel,growAnimal} from './FarmEcology';
import type {FarmState,Result,ProductId,Animal} from './FarmModel';
import {ANIMALS,AnimalId,animalSpec,FACTORIES,FactoryId,TRAVEL_MAPS,TravelId,MapId,FURNITURE,FurnitureId,SEASONS,WEATHER_NAMES,WeatherId,EXTRA_CROPS,furnitureGems,furnitureLevel} from './FarmCatalog';
import {farmLevel,discover,rollDaily} from './FarmFeatures';
export interface AnimalCare {hunger:number;mood:number;health:number;bond:number;lastAt:number;groomAt:number;bornAt:number;adultAt:number;breedAt:number;}
export interface FarmLife {
 schema:1;epoch:number;activeMap:MapId;maps:TravelId[];factories:FactoryId[];
 care:Record<number,AnimalCare>;breeds:{id:number;type:AnimalId;readyAt:number}[];serial:number;
 energy:number;energyAt:number;nodes:Record<string,number>;expedition:null|{map:TravelId;readyAt:number;item:ProductId;amount:number};
 seasonIndex:number;festivalBaseline:number;festivalClaimed:boolean;weatherClaim:number;weatherWindow:number;
 stats:{gathered:number;bred:number;flowers:number};home:{owned:FurnitureId[];slots:(FurnitureId|null)[]};
 automation:{harvest:boolean;feed:boolean;harvestBuilt:boolean;feedBuilt:boolean;lastAt:number};
}
const ok=(message:string,item?:ProductId):Result=>({ok:true,message,item}),fail=(message:string):Result=>({ok:false,message});
export const newCare=(now:number):AnimalCare=>({hunger:100,mood:80,health:100,bond:0,lastAt:now,groomAt:0,bornAt:0,adultAt:0,breedAt:0});
export function newLife(now=Date.now()):FarmLife{return{schema:1,epoch:now,activeMap:'home',maps:['village'],factories:['bakery','mill'],care:{},breeds:[],serial:0,energy:24,energyAt:now+120000,nodes:{},expedition:null,seasonIndex:0,festivalBaseline:0,festivalClaimed:false,weatherClaim:-1,weatherWindow:-1,stats:{gathered:0,bred:0,flowers:0},home:{owned:[],slots:Array(6).fill(null)},automation:{harvest:false,feed:false,harvestBuilt:false,feedBuilt:false,lastAt:now}};}
export const careFor=(s:FarmState,a:Animal,now=Date.now())=>s.life.care[a.id]||(s.life.care[a.id]=newCare(now));
export const isAdult=(s:FarmState,a:Animal,now=Date.now())=>now>=careFor(s,a,now).adultAt;
export function efficiency(s:FarmState,a:Animal){const c=careFor(s,a);return Math.max(.55,1+geneBonus(s,a.id)+(growthLevel(s,a)-1)*.02+Math.max(0,c.mood-80)*.002+c.bond*.001+animalSpec(a.type).rarity*.1-Math.max(0,60-c.hunger)*.003-Math.max(0,80-c.health)*.002);}
export const lifeClock=(s:FarmState,now=Date.now())=>Math.max(0,now-s.life.epoch);
export const seasonIndex=(s:FarmState,now=Date.now())=>Math.floor(lifeClock(s,now)/1200000);
export function weatherAt(s:FarmState,now=Date.now()):WeatherId {const win=Math.floor(lifeClock(s,now)/240000),season=seasonIndex(s,now)%4,sequence:WeatherId[]=['sunny','rain','sunny','storm','rainbow','sunny','thunder','rain','sunny','rainbow'];if(season===3)return(['snow','sunny','aurora','snow','sunny'] as WeatherId[])[win%5];return sequence[win%sequence.length];}
export function festival(s:FarmState,now=Date.now()){const index=seasonIndex(s,now)%4;return [{name:'春日花会',description:'收获5朵花',target:5,coins:180,icon:'wp_flower',value:s.life.stats.flowers},{name:'夏日渔赛',description:'限时渔赛钓到3条',target:3,coins:240,icon:'fish',value:s.activities.summerScore},{name:'秋日丰收节',description:'收获12次作物',target:12,coins:300,icon:'pumpkin',value:s.stats.harvests},{name:'冬日工匠节',description:'领取3份加工品',target:3,coins:360,icon:'cake',value:s.features.stats.crafted}][index];}
export function refreshLife(s:FarmState,now=Date.now()){
 let changed=false;const l=s.life,win=Math.floor(lifeClock(s,now)/240000),weather=weatherAt(s,now),season=seasonIndex(s,now);
 for(const a of s.animals){const c=careFor(s,a,now),minutes=Math.floor((now-c.lastAt)/60000);if(minutes>0){c.hunger=Math.max(20,c.hunger-minutes*2/(1+geneValue(genome(s,a.id),'vitality')*.1));c.mood=Math.max(40,c.mood-minutes*.5);c.health=Math.max(60,c.health-(c.hunger<35?minutes*.2:0));c.lastAt+=minutes*60000;changed=true;}}
 if(l.energy<24&&now>=l.energyAt){const n=Math.floor((now-l.energyAt)/120000)+1;l.energy=Math.min(24,l.energy+n);l.energyAt=l.energy>=24?now+120000:l.energyAt+n*120000;changed=true;}
 if(l.seasonIndex!==season){l.seasonIndex=season;l.festivalBaseline=festival(s,now).value;l.festivalClaimed=false;changed=true;}
 if(l.weatherWindow!==win){l.weatherWindow=win;changed=true;}
 for(const p of s.plots){
  if(p.pauseAt!==undefined&&p.pauseUntil!==undefined&&now>=p.pauseUntil){p.plantedAt+=Math.max(0,p.pauseUntil-p.pauseAt);delete p.pauseAt;delete p.pauseUntil;changed=true;}
  if(!p.crop)continue;
  if((weather==='rain'||weather==='storm'||weather==='thunder')&&!p.watered){p.plantedAt-=(p.growSeconds||20)*200;p.watered=true;changed=true;}
  if(weather==='snow'&&p.pauseAt===undefined&&EXTRA_CROPS.some(c=>c.id===p.crop&&['cocoa','coffee','watermelon','cucumber','sugarcane'].includes(c.id))&&now<p.plantedAt+(p.growSeconds||20)*1000){p.pauseAt=now;p.pauseUntil=l.epoch+(win+1)*240000;changed=true;}
 }
 return changed;
}
export function careAnimal(s:FarmState,id:number,kind:'feed'|'groom'|'heal',now=Date.now()):Result{
 const a=s.animals.find(a=>a.id===id);if(!a)return fail('找不到这只动物');refreshLife(s,now);const c=careFor(s,a,now);
 if(kind==='feed'){if(c.hunger>=100&&c.mood>=100)return fail('已经吃饱啦');if(s.inventory.feed<1)return fail('需要1份饲料，可以去磨坊制作');s.inventory.feed--;c.hunger=Math.min(100,c.hunger+30);c.mood=Math.min(100,c.mood+12);c.bond=Math.min(100,c.bond+3);}
 else if(kind==='groom'){if(now<c.groomAt)return fail(`再过${Math.ceil((c.groomAt-now)/1000)}秒可以互动`);c.groomAt=now+120000;c.bond=Math.min(100,c.bond+5+Math.floor(geneValue(genome(s,a.id),'temper')));c.mood=Math.min(100,c.mood+8);}
 else{if(c.health>=100)return fail('它很健康');if(s.coins<30)return fail('治疗需要30金币');s.coins-=30;c.health=100;}
 if(kind==='groom')growAnimal(s,a,10);
 return ok(`${animalSpec(a.type).name}${kind==='feed'?'吃得很开心':kind==='groom'?'更亲近你啦':'恢复健康啦'}`);
}
export function breedAnimals(s:FarmState,type:AnimalId,now=Date.now()):Result{
 refreshLife(s,now);const spec=animalSpec(type),parents=s.animals.filter(a=>a.type===type&&isAdult(s,a,now)&&careFor(s,a,now).bond>=20&&careFor(s,a,now).mood>=60&&careFor(s,a,now).breedAt<=now);
 if(parents.length>=2){const pair=parents.flatMap((a,i)=>parents.slice(i+1).filter(b=>!related(s,a.id,b.id)).map(b=>[a,b]))[0];if(pair)parents.splice(0,parents.length,...pair);else parents.length=0;}
 if(parents.length<2)return fail('需要两只同品种成年动物，亲密度≥20、心情≥60，且不在繁殖冷却中');
 if(s.life.breeds.length>=3||s.animals.length+s.life.breeds.length>=60)return fail('育幼小屋住满啦，先照顾已有伙伴');
 if(s.coins<100||s.inventory.feed<4)return fail('繁殖需要100金币和4份饲料');
 s.coins-=100;s.inventory.feed-=4;parents.slice(0,2).forEach(a=>careFor(s,a,now).breedAt=now+3600000);
 const serial=++s.life.serial;s.advanced.offspring[serial]=inherit(s,parents[0].id,parents[1].id,serial,null);let roll=(Math.imul(serial,1664525)+1013904223)>>>0;roll=Math.imul(roll^(roll>>>16),2246822507)>>>0;const rare=roll%100<5;let child:AnimalId=type;if(rare&&type==='sheep')child='goldenSheep';if(rare&&type==='cow')child='rainbowCow';
 s.life.breeds.push({id:serial,type:child,readyAt:now+120000});return ok(`${spec.name}繁殖开始 · 2分钟后迎接幼崽`);
}
export function collectBaby(s:FarmState,id:number,now=Date.now()):Result{
 const i=s.life.breeds.findIndex(j=>j.id===id),j=s.life.breeds[i];if(!j)return fail('幼崽已领取');if(now<j.readyAt)return fail('幼崽还在育幼小屋里');if(s.animals.length>=60)return fail('农场最多可照顾60只动物');
 const aid=Math.max(0,...s.animals.map(a=>a.id))+1,adultAt=now+300000;s.animals.push({id:aid,type:j.type,readyAt:adultAt+animalSpec(j.type).seconds*1000});s.life.care[aid]={...newCare(now),bornAt:now,adultAt};if(s.advanced.offspring[id]){s.advanced.genes[aid]=s.advanced.offspring[id];delete s.advanced.offspring[id];}s.life.breeds.splice(i,1);s.life.stats.bred++;return ok('幼崽加入农场 · 5分钟后长大');
}
export function openFactory(s:FarmState,id:FactoryId):Result {const f=FACTORIES.find(f=>f.id===id);if(!f)return fail('没有这座工厂');if(s.life.factories.includes(id))return fail('工厂已经建成');if(farmLevel(s.xp)<f.level)return fail(`${f.level}级解锁${f.name}`);if(s.coins<f.cost)return fail(`建设需要${f.cost}金币`);s.coins-=f.cost;s.life.factories.push(id);return ok(`${f.name}开工啦 · 拥有独立生产队列`);}
export function unlockMap(s:FarmState,id:TravelId):Result {const m=TRAVEL_MAPS.find(m=>m.id===id);if(!m)return fail('没有这张地图');if(s.life.maps.includes(id))return fail('地图已经解锁');if(farmLevel(s.xp)<m.level)return fail(`${m.level}级解锁${m.name}`);if(s.coins<m.cost)return fail(`需要${m.cost}金币`);s.coins-=m.cost;s.life.maps.push(id);return ok(`${m.name}可以前往啦`);}
export function travel(s:FarmState,id:MapId):Result {if(id!=='home'&&!s.life.maps.includes(id))return fail('先解锁这张地图吧');s.life.activeMap=id;return ok(id==='home'?'回到自己的农场':`抵达${TRAVEL_MAPS.find(m=>m.id===id)!.name}`);}
export const NODE_POSITIONS=Array.from({length:9},(_,i)=>({x:6+(i%3)*4,y:7+Math.floor(i/3)*4}));
function spendEnergy(s:FarmState,n:number,now:number){if(s.life.energy<n)return false;if(s.life.energy===24)s.life.energyAt=now+120000;s.life.energy-=n;return true;}
export function gather(s:FarmState,index:number,now=Date.now()):Result {
 refreshLife(s,now);const map=s.life.activeMap,m=TRAVEL_MAPS.find(m=>m.id===map);if(!m||map==='village')return fail('去森林、矿山或海边寻找资源吧');if(!Number.isInteger(index)||index<0||index>=9)return fail('没有这个资源点');
 const key=`${map}:${index}`;if((s.life.nodes[key]||0)>now)return fail(`资源恢复还需${Math.ceil((s.life.nodes[key]-now)/1000)}秒`);if(!spendEnergy(s,2,now))return fail('体力不足，每2分钟恢复1点');
 const item=m.loot[index%3] as ProductId,amount=index%3===2?1:2;s.life.nodes[key]=now+600000;s.inventory[item]+=amount;s.xp+=10+index*2;s.life.stats.gathered++;discover(s,item,amount);return ok(`${itemName(item)} ×${amount} · 体力 -2`,item);
}
export function itemName(id:ProductId){return ({wood:'木材',herb:'香草',truffle:'松露',ore:'铜矿',coal:'煤炭',gem:'蓝宝石',fish:'溪流鱼',ice:'冰晶',auroraBerry:'极光莓'} as Record<string,string>)[id]||id;}
export function startExpedition(s:FarmState,now=Date.now()):Result {
 refreshLife(s,now);const m=TRAVEL_MAPS.find(m=>m.id===s.life.activeMap);if(!m||m.id==='village')return fail('到资源地图后再出发');if(s.life.expedition)return fail('先领取上一趟探险奖励');if(!spendEnergy(s,4,now))return fail('远行需要4点体力');
 const adult=(id:AnimalId)=>s.animals.some(a=>a.type===id&&isAdult(s,a,now)),speed=adult('unicorn')?.6:adult('horse')?.75:1,serial=++s.life.serial,item=m.loot[serial%3] as ProductId;
 s.life.expedition={map:m.id,readyAt:now+30000*speed,item,amount:3+(adult('dog')?1:0)};return ok('探险队出发 · 离线也会继续远行');
}
export function collectExpedition(s:FarmState,now=Date.now()):Result {const j=s.life.expedition;if(!j)return fail('还没有探险队');if(now<j.readyAt)return fail('伙伴们还在路上');s.life.expedition=null;s.inventory[j.item]+=j.amount;s.xp+=30;discover(s,j.item,j.amount);return ok(`探险归来 · ${itemName(j.item)} ×${j.amount}`,j.item);}
export function claimFestival(s:FarmState,now=Date.now()):Result {refreshLife(s,now);const f=festival(s,now);if(s.life.festivalClaimed)return fail('本季奖励已经领取');if(f.value-s.life.festivalBaseline<f.target)return fail(`还需要${f.description}`);s.life.festivalClaimed=true;s.coins+=f.coins;s.stars+=5;return ok(`${SEASONS[seasonIndex(s,now)%4]}季庆典 · ${f.coins}金币 · 5农场星`);}
export function claimWeather(s:FarmState,now=Date.now()):Result {refreshLife(s,now);const weather=weatherAt(s,now),win=s.life.weatherWindow;if(!['rainbow','aurora','thunder'].includes(weather))return fail('雷电、彩虹或极光出现时，会有特别礼物');if(s.life.weatherClaim===win)return fail('这次天气礼物已经领取');s.life.weatherClaim=win;const item:ProductId=weather==='aurora'?'auroraBerry':weather==='thunder'?'ore':'gem';s.inventory[item]+=2;discover(s,item,2);if(weather==='aurora'&&!s.cropUnlocks.includes('auroraBerry'))s.cropUnlocks.push('auroraBerry');return ok(`${WEATHER_NAMES[weather]}的礼物 · ${itemName(item)} ×2`,item);}
export function buyFurniture(s:FarmState,id:FurnitureId):Result {const f=FURNITURE.find(f=>f.id===id);if(!f)return fail('没有这件家具');if(s.life.home.owned.includes(id))return fail('家具已经拥有，可以放进房间');if(farmLevel(s.xp)<furnitureLevel(f))return fail(`${furnitureLevel(f)}级可以制作${f.name}`);const gems=furnitureGems(f);if(s.coins<f.cost||s.inventory.planks<f.planks||s.inventory.cloth<f.cloth||s.inventory.gem<gems)return fail(`需要${f.cost}金币、${f.planks}木板、${f.cloth}棉布${gems?`和${gems}宝石`:''}`);s.coins-=f.cost;s.inventory.planks-=f.planks;s.inventory.cloth-=f.cloth;s.inventory.gem-=gems;s.life.home.owned.push(id);s.advanced.room.items.push({id:++s.advanced.room.serial,type:id,x:null,y:null,rotation:0});return ok(`${f.name}已收入家具箱`);}
export function placeFurniture(s:FarmState,id:FurnitureId|null,index:number):Result {if(!Number.isInteger(index)||index<0||index>=6)return fail('没有这个位置');if(id!==null&&!s.life.home.owned.includes(id))return fail('先购买这件家具吧');s.life.home.slots=s.life.home.slots.map(x=>x===id?null:x);s.life.home.slots[index]=id;if(id){const item=s.advanced.room.items.find(f=>f.type===id),positions=[[.23,.23],[.53,.2],[.78,.23],[.25,.65],[.55,.55],[.78,.76]];if(item){item.x=positions[index][0];item.y=positions[index][1];}}return ok(id?'家具摆好了':'腾出一个位置');}
export function toggleAutomation(s:FarmState,kind:'harvest'|'feed'):Result {const a=s.life.automation,built=kind==='harvest'?'harvestBuilt':'feedBuilt',level=kind==='harvest'?10:6,cost=kind==='harvest'?400:250,ore=kind==='harvest'?5:2;if(!a[built]){if(farmLevel(s.xp)<level)return fail(`${level}级解锁`);if(s.coins<cost||s.inventory.ore<ore)return fail(`建设需要${cost}金币和${ore}铜矿`);s.coins-=cost;s.inventory.ore-=ore;a[built]=true;}a[kind]=!a[kind];return ok(`${kind==='harvest'?'自动收获':'自动喂养'}${a[kind]?'已开启':'已暂停'}`);}
export function autoFeed(s:FarmState,now=Date.now()){let n=0;if(!s.life.automation.feed)return n;for(const a of s.animals)if(careFor(s,a,now).hunger<50&&s.inventory.feed>s.activities.reserve){careAnimal(s,a.id,'feed',now);n++;}return n;}
export function validateLife(l:any,animals:Animal[],products:readonly string[]):l is FarmLife {
 const num=(n:unknown,max=1e15)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max,int=(n:unknown,max=1e9)=>num(n,max)&&Number.isInteger(n),unique=(a:any[])=>new Set(a).size===a.length;
 const list=(a:any,ids:readonly string[])=>Array.isArray(a)&&unique(a)&&a.every(x=>ids.includes(x));
 if(!l||l.schema!==1||!num(l.epoch)||!list(l.maps,TRAVEL_MAPS.map(m=>m.id))||!list(l.factories,FACTORIES.map(f=>f.id))||!(l.activeMap==='home'||l.maps.includes(l.activeMap)))return false;
 if(!l.care||typeof l.care!=='object'||Array.isArray(l.care)||Object.keys(l.care).some(k=>!animals.some(a=>a.id===Number(k))))return false;
 if(!animals.every(a=>{const c=l.care[a.id];return c&&['hunger','mood','health','bond'].every(k=>num(c[k],100))&&['lastAt','groomAt','bornAt','adultAt','breedAt'].every(k=>num(c[k]))&&c.adultAt>=c.bornAt;}))return false;
 if(!int(l.serial)||!Array.isArray(l.breeds)||l.breeds.length>3||!unique(l.breeds.map((j:any)=>j.id))||!l.breeds.every((j:any)=>int(j.id)&&j.id>0&&j.id<=l.serial&&ANIMALS.some(a=>a.id===j.type)&&num(j.readyAt)))return false;
 if(!int(l.energy,24)||!num(l.energyAt)||!l.nodes||typeof l.nodes!=='object'||Array.isArray(l.nodes)||!Object.entries(l.nodes).every(([key,v])=>/^(forest|mine|beach|snow):[0-8]$/.test(key)&&num(v)))return false;
 const j=l.expedition;if(j!==null&&(!j||!l.maps.includes(j.map)||j.map==='village'||!TRAVEL_MAPS.some(m=>m.id===j.map&&(m.loot as readonly string[]).includes(j.item))||!num(j.readyAt)||!int(j.amount,4)||j.amount<3||!products.includes(j.item)))return false;
 if(!int(l.seasonIndex)||!int(l.festivalBaseline)||typeof l.festivalClaimed!=='boolean'||!Number.isInteger(l.weatherClaim)||l.weatherClaim< -1||!Number.isInteger(l.weatherWindow)||l.weatherWindow< -1)return false;
 if(!l.stats||!['gathered','bred','flowers'].every(k=>int(l.stats[k])))return false;
 if(!l.home||!list(l.home.owned,FURNITURE.map(f=>f.id))||!Array.isArray(l.home.slots)||l.home.slots.length!==6||!l.home.slots.every((x:any)=>x===null||l.home.owned.includes(x))||!unique(l.home.slots.filter((x:any)=>x!==null)))return false;
 const a=l.automation;return !!a&&['harvest','feed','harvestBuilt','feedBuilt'].every(k=>typeof a[k]==='boolean')&&(!a.harvest||a.harvestBuilt)&&(!a.feed||a.feedBuilt)&&num(a.lastAt);
}
