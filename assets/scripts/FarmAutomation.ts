import {FarmState,Result,ProductId,CropId,CROPS,readyPlot,harvest,plant,collectAnimal} from './FarmModel';
import {AutoReport} from './FarmAdvanced';
import {refreshLife,autoFeed} from './FarmLife';
import {AQUATIC} from './FarmCatalog';
import {harvestPond,feedPond} from './FarmEcology';
import {RECIPES,RecipeId,enqueueCraft,collectCraft,refreshFeatures,farmLevel,recipeFactory} from './FarmFeatures';
export const OFFLINE_LIMIT=8*60*60*1000,STEP=5000;
export function settleAutomation(s:FarmState,now=Date.now()):AutoReport|null{
 const a=s.advanced.auto;if(now<=a.cursor)return null;if(!a.enabled){a.cursor=now;return null;}
 const elapsed=now-a.cursor,span=Math.min(OFFLINE_LIMIT,elapsed);if(span<STEP)return null;
 const before={...s.inventory},coins=s.coins,xp=s.xp,start=a.cursor,end=start+Math.floor(span/STEP)*STEP;
 const report:AutoReport={seconds:Math.floor(span/1000),limited:elapsed>OFFLINE_LIMIT,harvests:0,plants:0,products:0,crafts:0,feeds:0,coinsSpent:0,xp:0,items:{},unread:elapsed>=30000};
 for(let time=start+STEP;time<=end;time+=STEP){
  refreshLife(s,time);refreshFeatures(s,time);
  if(s.life.automation.harvest)for(let i=0;i<s.plots.length;i++)if(readyPlot(s.plots[i],time)&&harvest(s,i,time).ok)report.harvests++;
  if(a.replant&&s.life.automation.harvest)for(let i=0;i<s.plots.length;i++)if(s.plots[i].unlocked&&!s.plots[i].crop&&plant(s,i,a.seed,time).ok)report.plants++;
  if(a.animals)for(const animal of s.animals)if(animal.readyAt<=time&&collectAnimal(s,animal.id,time).ok)report.products++;
  report.feeds+=autoFeed(s,time);
  if(a.ponds)for(const f of AQUATIC){const p=s.ecology.ponds[f.id];if(!p)continue;if(p.fed&&time>=p.readyAt&&harvestPond(s,f.id,time).ok)report.products+=f.output;if(!p.fed&&s.inventory.feed>s.activities.reserve&&feedPond(s,f.id,time).ok)report.feeds++;}
  if(a.craft){
   for(const job of [...s.features.jobs])if(job.readyAt<=time&&collectCraft(s,job.id,time).ok)report.crafts++;
   for(const id of a.recipes){
    const recipe=RECIPES.find(r=>r.id===id);
    if(!recipe)continue;
    for(let slot=0;slot<5;slot++){
     const keepsReserve=Object.entries(recipe.needs).every(([item,amount])=>s.inventory[item as ProductId]-amount!>=s.activities.reserve);
     if(!keepsReserve||!enqueueCraft(s,id,time).ok)break;
    }
   }
  }
 }
 a.cursor=report.limited?now:end;report.coinsSpent=coins-s.coins;report.xp=s.xp-xp;for(const id of Object.keys(before) as ProductId[])if(s.inventory[id]!==before[id])report.items[id]=s.inventory[id]-before[id];
 if(report.unread)a.report=report;return report;
}
export function cycleAutomationReserve(s:FarmState,now=Date.now()):Result{
 settleAutomation(s,now);
 const choices=[0,5,10,20];
 s.activities.reserve=choices[(choices.indexOf(s.activities.reserve)+1)%choices.length];
 return{ok:true,message:`自动消耗材料保留量改为${s.activities.reserve}份`};
}
export function toggleOffline(s:FarmState,now=Date.now()):Result{settleAutomation(s,now);const a=s.advanced.auto;if(!a.built){if(farmLevel(s.xp)<10)return{ok:false,message:'10级解锁离线管理站'};if(s.coins<800||s.inventory.wood<10||s.inventory.ore<5)return{ok:false,message:'需要800金币、10木材、5铜矿'};s.coins-=800;s.inventory.wood-=10;s.inventory.ore-=5;a.built=true;}a.enabled=!a.enabled;a.cursor=now;return{ok:true,message:a.enabled?'离线管理站启用 · 最多结算8小时，按实际材料生产':'离线管理站已暂停'};}
export function toggleAutoOption(s:FarmState,key:'replant'|'animals'|'ponds'|'craft',now=Date.now()):Result{settleAutomation(s,now);s.advanced.auto[key]=!s.advanced.auto[key];return{ok:true,message:'自动化任务已更新'};}
export function selectAutoSeed(s:FarmState,id:CropId,now=Date.now()):Result{const c=CROPS.find(c=>c.id===id);if(!c||farmLevel(s.xp)<c.level&&!s.cropUnlocks.includes(id))return{ok:false,message:'先解锁这种作物'};settleAutomation(s,now);s.advanced.auto.seed=id;return{ok:true,message:`自动补种改为${c.name}`};}
export function toggleAutoRecipe(s:FarmState,id:RecipeId,now=Date.now()):Result{const r=RECIPES.find(r=>r.id===id);if(!r||farmLevel(s.xp)<r.level||!s.life.factories.includes(recipeFactory(r)))return{ok:false,message:'先解锁配方和对应工厂'};settleAutomation(s,now);const a=s.advanced.auto;if(a.recipes.includes(id))a.recipes=a.recipes.filter(v=>v!==id);else a.recipes=[...a.recipes.filter(v=>recipeFactory(RECIPES.find(r=>r.id===v)!)!==recipeFactory(r)),id];return{ok:true,message:'每厂一种自动配方已更新'};}
