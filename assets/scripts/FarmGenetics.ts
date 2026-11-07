import type {FarmState,Animal,Result} from './FarmModel';
import {AnimalId,animalSpec} from './FarmCatalog';
import {Genome,Trait} from './FarmAdvanced';
import {isAdult,careFor,refreshLife} from './FarmLife';
export const TRAITS:Trait[]=['production','temper','vitality'];
export const TRAIT_NAMES={production:'产能',temper:'温顺',vitality:'体质'};
export const baseGenome=():Genome=>({production:[1,1],temper:[1,1],vitality:[1,1],parents:null,generation:0,mutated:false});
export const genome=(s:FarmState,id:number)=>s.advanced.genes[id]||baseGenome();
export const geneValue=(g:Genome,t:Trait)=>(g[t][0]+g[t][1])/2;
export type DominanceMode='homo'|'complete'|'incomplete';
export function dominance(pair:[number,number]){const dominant=Math.max(pair[0],pair[1]),recessive=Math.min(pair[0],pair[1]),gap=dominant-recessive;const mode:DominanceMode=gap===0?'homo':gap===1?'incomplete':'complete';return {mode,dominant,recessive,phenotype:mode==='incomplete'?(dominant+recessive)/2:dominant};}
export function transmitAllele(pair:[number,number],roll:number){if(pair[0]===pair[1])return pair[0];const dominant=Math.max(pair[0],pair[1]),recessive=Math.min(pair[0],pair[1]);if(dominant-recessive>=2)return roll<.75?dominant:recessive;return roll<.5?pair[0]:pair[1];}
export const geneBonus=(s:FarmState,id:number)=>Math.max(0,geneValue(genome(s,id),'production')-1)*.06;
export function seedGenome(s:FarmState,a:Animal){const g=baseGenome();for(const [i,t]of TRAITS.entries()){const n=Math.abs(Math.imul(a.id+animalSpec(a.type).level+i*17,2654435761));g[t]=[1+n%3,1+Math.floor(n/7)%3];}s.advanced.genes[a.id]=g;}
export function family(id:AnimalId){return ['cow','rainbowCow'].includes(id)?'cow':['sheep','goldenSheep'].includes(id)?'sheep':['peacock','whitePeacock'].includes(id)?'peacock':['horse','unicorn'].includes(id)?'horse':id;}
export function ancestry(s:FarmState,id:number):number[][]{
 const seen=new Set([id]),generations:number[][]=[];
 let previous=[id];
 for(let depth=0;depth<3;depth++){
  const next:number[]=[];
  for(const member of previous)for(const parent of genome(s,member).parents||[]){
   if(seen.has(parent))continue;
   seen.add(parent);
   next.push(parent);
  }
  generations.push(next);
  previous=next;
 }
 return generations;
}
export function related(s:FarmState,a:number,b:number){
 const kin=new Set([a,...ancestry(s,a).flat()]);
 return [b,...ancestry(s,b).flat()].some(id=>kin.has(id));
}
export function inherit(s:FarmState,a:number,b:number,serial:number,focus:Trait|null):Genome{
 const p=genome(s,a),q=genome(s,b);let seed=(Math.imul(serial+1,1664525)^Math.imul(a,1013904223)^b)>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const g:Genome={...baseGenome(),parents:[a,b],generation:Math.max(p.generation,q.generation)+1};for(const t of TRAITS){const alleles:[number,number]=t===focus?[Math.max(...p[t]),Math.max(...q[t])]:[transmitAllele(p[t],random()),transmitAllele(q[t],random())];if(random()<.02){const i=random()<.5?0:1;alleles[i]=Math.min(3,alleles[i]+1);g.mutated=true;}g[t]=alleles;}return g;
}
export function pairAnimals(s:FarmState,aid:number,bid:number,focus:Trait,now=Date.now()):Result{
 const fail=(message:string)=>({ok:false,message}),a=s.animals.find(a=>a.id===aid),b=s.animals.find(a=>a.id===bid);if(!a||!b||!TRAITS.includes(focus))return fail('请选择两位伙伴和培育方向');if(family(a.type)!==family(b.type))return fail('请选择同一品种家族，稀有品种可与普通品种配对');if(related(s,aid,bid))return fail('不能选择自身或三代内有共同祖先的伙伴');
 refreshLife(s,now);if([a,b].some(a=>!isAdult(s,a,now)||careFor(s,a,now).bond<20||careFor(s,a,now).mood<60||careFor(s,a,now).breedAt>now))return fail('双亲需成年、亲密20、心情60，且不在繁殖冷却');
 if(s.life.breeds.length>=3||s.animals.length+s.life.breeds.length>=60)return fail('育幼或动物容量已满');if(s.coins<150||s.inventory.feed<6)return fail('定向培育需要150金币和6份饲料');
 s.coins-=150;s.inventory.feed-=6;const serial=++s.life.serial,g=inherit(s,aid,bid,serial,focus),rare=animalSpec(a.type).rarity>1?a.type:animalSpec(b.type).rarity>1?b.type:null;let type:AnimalId=serial%2?a.type:b.type;
 if(rare&&serial%5===0)type=rare;else if(!rare&&serial%20===0){if(type==='cow')type='rainbowCow';if(type==='sheep')type='goldenSheep';if(type==='peacock')type='whitePeacock';}
 s.advanced.offspring[serial]=g;s.life.breeds.push({id:serial,type,readyAt:now+120000});[a,b].forEach(a=>careFor(s,a,now).breedAt=now+3600000);return{ok:true,message:`${TRAIT_NAMES[focus]}定向培育开始 · 双亲基因已固定，2分钟后接回幼崽`};
}
export function validGenome(g:any,ids:number[]){return g&&TRAITS.every(t=>Array.isArray(g[t])&&g[t].length===2&&g[t].every((v:any)=>Number.isInteger(v)&&v>=0&&v<=3))&&Number.isInteger(g.generation)&&g.generation>=0&&g.generation<=10000&&typeof g.mutated==='boolean'&&(g.parents===null||Array.isArray(g.parents)&&g.parents.length===2&&g.parents[0]!==g.parents[1]&&g.parents.every((id:any)=>ids.includes(id)));}
