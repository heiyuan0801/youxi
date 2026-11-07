import {WORLD_PLOTS,REGIONS,ORCHARD_TREES,BEEHIVES} from './WorldData';
export const WIDTH=1600,HEIGHT=900,BASE_Z=900/1150;
export type Tile={x:number;y:number};
export const iso=(x:number,y:number):[number,number]=>[(x-y)*64,(x+y)*32];
export const project=(x:number,y:number,lift=0):[number,number]=>{const [u,v]=iso(x,y);return[800+(u-64)*BASE_Z,450+(v-640+lift)*BASE_Z];};
export const unproject=(x:number,y:number):Tile=>{const u=(x-800)/BASE_Z+64,v=(y-450)/BASE_Z+640;return {x:(u/64+v/32)/2,y:(v/32-u/64)/2};};
export const BUILDINGS=[
 {key:'farmhouse',x:2,y:1,w:3,h:3,width:400,lift:6},
 {key:'windmill',x:6,y:2,w:2,h:2,width:236,lift:4},
 {key:'barn',x:10,y:1,w:3,h:3,width:370,lift:6},
 {key:'coop',x:1,y:6,w:2,h:2,width:230,lift:4},
 {key:'market',x:15,y:14,w:2,h:2,width:262,lift:4},
 {key:'school',x:18,y:2,w:2,h:2,width:250,lift:4}
] as const;
export const PATHS=[{x:1,y:4,w:20,h:1},{x:7,y:5,w:1,h:13},{x:17,y:5,w:1,h:13},{x:8,y:12,w:9,h:1},{x:0,y:18,w:22,h:1},{x:0,y:21,w:22,h:1}];
export const BENCHES=[{x:16,y:11},{x:13,y:17}];
export const PLOTS=WORLD_PLOTS;
export const GARDEN=Array.from({length:18},(_,i)=>({x:1+i%6,y:15+Math.floor(i/6)}));
export const PROP_WIDTH:Record<string,number>={tree_round:150,tree_pink:156,tree_pine:74,bush:72,hay:100,scarecrow:90,well:112,bench:94,sunflower:70,signpost:78,bakery:132,swing:128};
export const PROPS:{key:string;x:number;y:number}[]=[];
const add=(key:string,x:number,y:number)=>PROPS.push({key,x,y});
for(let x=0;x<22;x+=2)add(x%4===0?'tree_pine':'tree_round',x,0);
[['tree_pine',0,2],['tree_round',0,4],['tree_pine',5,1],['tree_pine',8,1],['tree_pink',14,1],['well',16,2],['tree_round',20,2]].forEach(([k,x,y])=>add(String(k),Number(x),Number(y)));
for(let y=5;y<18;y+=2)add(y%4===1?'tree_pine':'tree_round',21,y);
[['hay',19,6],['tree_pink',19,9],['bush',20,11],['tree_round',19,12],['bush',19,16],['scarecrow',15,7],['bush',16,10],['bush',8,6],['bush',8,10],['hay',5,12],['tree_pink',0,14],['tree_pine',0,16],['bush',2,14],['bush',9,14],['tree_round',15,17],['bush',9,17]].forEach(([k,x,y])=>add(String(k),Number(x),Number(y)));
BENCHES.forEach(b=>add('bench',b.x,b.y));
export const HEDGES=[{x0:9.1,y0:5.5,x1:14.9,y1:5.5},{x0:9.1,y0:11.5,x1:14.9,y1:11.5},{x0:1.2,y0:5.55,x1:2.6,y1:5.55},{x0:18.4,y0:5.5,x1:20.8,y1:5.5},{x0:18.4,y0:17.5,x1:20.8,y1:17.5},{x0:8.4,y0:17.5,x1:9.6,y1:17.5}];
export const inside=(x:number,y:number,r:{x:number;y:number;w:number;h:number})=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;
export function walkable(x:number,y:number){if(!PATHS.some(r=>inside(x,y,r)))return false;return !BUILDINGS.some(r=>inside(x,y,r));}
export function freeGrass(x:number,y:number,width=22){if(x<.5||x>=width-.5||y<=.5||y>=18)return false;if(x>=22){if(y>=4&&y<5||y>=18||PLOTS.slice(30).some(p=>Math.floor(x)===p.x&&Math.floor(y)===p.y))return false;if(x>=30&&x<38&&[...ORCHARD_TREES,...BEEHIVES].some(p=>Math.hypot(p.x-x,p.y-y)<1.2))return false;if(x>=39&&x<44&&y>=10&&y<18)return false;return true;}return !PATHS.some(r=>inside(x,y,r))&&!BUILDINGS.some(r=>inside(x,y,r))&&!inside(x,y,{x:1,y:6,w:5,h:8})&&!inside(x,y,{x:9,y:6,w:6,h:5})&&!inside(x,y,{x:1,y:15,w:6,h:3})&&!PROPS.some(r=>Math.hypot(r.x+.5-x,r.y+.5-y)<.8)&&!(((x-12)/2.9)**2+((y-15.4)/1.8)**2<1);}
export function pathTo(start:Tile,end:Tile):Tile[]{const startKey=`${Math.floor(start.x)},${Math.floor(start.y)}`,target=`${Math.floor(end.x)},${Math.floor(end.y)}`,queue=[startKey],prev=new Map<string,string|null>([[startKey,null]]);for(let n=0;n<queue.length;n++){const k=queue[n];if(k===target)break;const [x,y]=k.split(',').map(Number);for(const [a,b] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const kk=`${a},${b}`;if(walkable(a,b)&&!prev.has(kk)){prev.set(kk,k);queue.push(kk);}}}if(!prev.has(target))return[];const out:Tile[]=[];let k:string|null=target;while(k&&k!==startKey){const [x,y]=k.split(',').map(Number);out.unshift({x:x+.5,y:y+.5});k=prev.get(k)||null;}return out;}
