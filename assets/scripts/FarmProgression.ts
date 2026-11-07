import type {FarmState,Result,ProductId} from './FarmModel';
import {farmLevel,discover,rollDaily} from './FarmFeatures';
import {AnimalId,animalSpec} from './FarmCatalog';
import {REGIONS,RegionId} from './WorldData';
export interface FarmProgression {schema:1;regions:RegionId[];claimedLevels:number[];appleAt:number[];honeyAt:number[];}
export const newProgression=():FarmProgression=>({schema:1,regions:[],claimedLevels:[1],appleAt:[],honeyAt:[]});
export const worldWidth=(s:FarmState)=>22+s.progression.regions.length*8;
export const hasRegion=(s:FarmState,id:RegionId)=>s.progression.regions.includes(id);
export const levelReward=(level:number)=>({coins:40+20*level,stars:1+Math.floor(level/5),bait:level%3===0?2:0});
export function unclaimedLevels(s:FarmState){return Array.from({length:Math.max(0,farmLevel(s.xp)-1)},(_,i)=>i+2).filter(l=>!s.progression.claimedLevels.includes(l));}
export function claimLevelReward(s:FarmState,level:number):Result{
 if(!Number.isInteger(level)||level<2||level>farmLevel(s.xp)||level>100)return{ok:false,message:'还没有达到这个等级'};
 if(s.progression.claimedLevels.includes(level))return{ok:false,message:'这个等级的奖励已经领取'};
 const r=levelReward(level);s.progression.claimedLevels.push(level);s.coins+=r.coins;s.stars+=r.stars;s.features.fishing.bait=Math.min(99,s.features.fishing.bait+r.bait);
 return{ok:true,message:`${level}级奖励 · ${r.coins}金币 · ${r.stars}农场星${r.bait?` · ${r.bait}鱼饵`:''}`};
}
export function openRegion(s:FarmState,id:RegionId,now=Date.now()):Result{
 const index=REGIONS.findIndex(r=>r.id===id),r=REGIONS[index];if(!r)return{ok:false,message:'没有这片区域'};
 if(hasRegion(s,id))return{ok:false,message:'这片区域已经开拓'};if(s.progression.regions.length!==index)return{ok:false,message:'先开拓前一片区域吧'};
 if(farmLevel(s.xp)<r.level)return{ok:false,message:`${r.level}级解锁${r.name}`};if(s.coins<r.coins||s.stars<r.stars)return{ok:false,message:`需要${r.coins}金币和${r.stars}农场星`};
 s.coins-=r.coins;s.stars-=r.stars;s.progression.regions.push(id);s.plots.push(...Array.from({length:18},(_,i)=>({unlocked:i<6,crop:null,plantedAt:0,watered:false})));s.stats.expansions++;
 if(id==='orchard'){s.progression.appleAt=[now,now+30000,now+60000,now+90000];s.progression.honeyAt=[now,now+90000];}
 return{ok:true,message:`${r.name}已开拓！地图扩大，赠送6块已开垦田地`};
}
export function collectOrchard(s:FarmState,kind:'apple'|'honey',index:number,now=Date.now()):Result{
 if(!hasRegion(s,'orchard'))return{ok:false,message:'先开拓甜蜜果林吧'};const at=kind==='apple'?s.progression.appleAt:s.progression.honeyAt;
 if(!Number.isInteger(index)||index<0||index>=at.length)return{ok:false,message:'没有这个生产点'};
 if(now<at[index])return{ok:false,message:`${kind==='apple'?'苹果':'蜂蜜'}还需${Math.ceil((at[index]-now)/1000)}秒`};
 rollDaily(s,now);at[index]=now+(kind==='apple'?120000:180000);s.inventory[kind]++;s.xp+=kind==='apple'?8:12;discover(s,kind);
 return{ok:true,message:`${kind==='apple'?'苹果':'蜂蜜'} +1 · 已放入仓库`,item:kind};
}
export const animalCapacity=(s:FarmState,type:AnimalId)=>type==='hen'||type==='cow'?(type==='hen'?8:4)+s.penBonus[type]+(hasRegion(s,'pasture')?(type==='hen'?2:1):0):animalSpec(type).rarity>0?3:6;
export function validateProgression(p:any):p is FarmProgression{
 const time=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e15;
 if(!p||p.schema!==1||!Array.isArray(p.regions)||p.regions.length>3||!p.regions.every((id:string,i:number)=>id===REGIONS[i].id))return false;
 if(!Array.isArray(p.claimedLevels)||new Set(p.claimedLevels).size!==p.claimedLevels.length||!p.claimedLevels.every((l:unknown)=>typeof l==='number'&&Number.isInteger(l)&&l>=1&&l<=100))return false;
 return Array.isArray(p.appleAt)&&Array.isArray(p.honeyAt)&&p.appleAt.length===(p.regions.includes('orchard')?4:0)&&p.honeyAt.length===(p.regions.includes('orchard')?2:0)&&p.appleAt.every(time)&&p.honeyAt.every(time);
}
