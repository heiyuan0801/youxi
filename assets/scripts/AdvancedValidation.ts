import type {FarmState} from './FarmModel';
import {EXTRA_CROPS,FURNITURE,TRAVEL_MAPS} from './FarmCatalog';
import {RECIPES,recipeFactory} from './FarmFeatures';
import {validGenome} from './FarmGenetics';
import {EXPLORE_EVENTS} from './FarmAdvanced';
export function validateAdvanced(s:FarmState,products:readonly string[]){
 const a=s.advanced,n=(v:any,max=1e15)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max,i=(v:any,max=1e9)=>n(v,max)&&Number.isInteger(v),obj=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v),ids=s.animals.map(a=>a.id),maps=TRAVEL_MAPS.filter(m=>m.id!=='village').map(m=>m.id) as string[];
 if(!a||a.schema!==1||!obj(a.genes)||!obj(a.offspring)||!obj(a.room)||!obj(a.auto)||!obj(a.explore))return false;
 if(!Object.entries(a.genes).every(([id,g])=>ids.includes(Number(id))&&String(Number(id))===id&&validGenome(g,ids)&&(!g.parents||g.parents.every(p=>p<Number(id))))||!Object.entries(a.offspring).every(([id,g])=>s.life.breeds.some(j=>String(j.id)===id)&&validGenome(g,ids)))return false;
 const r=a.room;if(![6,8,10].includes(r.size)||!i(r.wall,3)||!i(r.floor,3)||!i(r.serial)||!Array.isArray(r.items)||r.items.length>40||new Set(r.items.map(f=>f.id)).size!==r.items.length||!r.items.every(f=>i(f.id)&&f.id>0&&f.id<=r.serial&&FURNITURE.some(v=>v.id===f.type)&&s.life.home.owned.includes(f.type)&&i(f.rotation,3)&&((f.x===null&&f.y===null)||(n(f.x,.92)&&n(f.y,.92)&&f.x!>=.08&&f.y!>=.08))))return false;
 const e=a.explore;if(!i(e.serial)||!obj(e.best)||!obj(e.claimed)||![e.best,e.claimed].every(d=>Object.entries(d).every(([k,v])=>maps.includes(k)&&s.life.maps.includes(k as any)&&i(v,12)))||Object.entries(e.claimed).some(([k,v])=>v!>(e.best[k as keyof typeof e.best]||0)))return false;
 if(e.run){const r=e.run;if(!maps.includes(r.map)||!s.life.maps.includes(r.map)||!i(r.seed,4294967295)||!i(r.depth,12)||r.depth<1||!i(r.step,3)||!i(r.stamina,12)||!obj(r.bag)||!Object.entries(r.bag).every(([k,v])=>products.includes(k)&&i(v)&&v!>0)||!(r.event===null||(EXPLORE_EVENTS as readonly string[]).includes(r.event))||r.event!==null&&r.step>=3||r.companion!==null&&!ids.includes(r.companion))return false;}else if(e.run!==null)return false;
 const au=a.auto,crops=['wheat','carrot','tomato','strawberry','corn','pumpkin',...EXTRA_CROPS.map(c=>c.id)];if(!['built','enabled','replant','animals','ponds','craft'].every(k=>typeof (au as any)[k]==='boolean')||au.enabled&&!au.built||!n(au.cursor)||!crops.includes(au.seed)||!Array.isArray(au.recipes)||!au.recipes.every(id=>RECIPES.some(r=>r.id===id))||new Set(au.recipes.map(id=>recipeFactory(RECIPES.find(r=>r.id===id)!))).size!==au.recipes.length)return false;
 const q=au.report;if(q!==null&&(!q||!i(q.seconds,28800)||typeof q.limited!=='boolean'||typeof q.unread!=='boolean'||!['harvests','plants','products','crafts','feeds','coinsSpent','xp'].every(k=>i((q as any)[k]))||!obj(q.items)||!Object.entries(q.items).every(([k,v])=>products.includes(k)&&Number.isInteger(v)&&Math.abs(v!)<=1e9)))return false;
 return true;
}
