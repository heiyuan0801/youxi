export const REGIONS=[
 {id:'meadow',name:'东侧草甸',level:3,coins:300,stars:3,x:22,w:8,icon:'tree_round',description:'18个新田位，6块免费开垦，更多布置空间'},
 {id:'orchard',name:'甜蜜果林',level:6,coins:900,stars:6,x:30,w:8,icon:'apple',description:'18个新田位，苹果树、蜂箱和果园礼篮'},
 {id:'pasture',name:'阳光牧场',level:10,coins:2200,stars:12,x:38,w:8,icon:'cow',description:'18个新田位，新动物小院，鸡容量+2、牛+1'}
] as const;
export type RegionId=typeof REGIONS[number]['id'];
const base=Array.from({length:30},(_,i)=>({x:9+i%6,y:6+Math.floor(i/6),c:i%6,r:Math.floor(i/6)})).sort((a,b)=>Math.max(a.c,a.r)-Math.max(b.c,b.r)||a.c+a.r-b.c-b.r||a.r-b.r);
export const WORLD_PLOTS=[...base,...REGIONS.flatMap(r=>Array.from({length:18},(_,i)=>({x:r.x+1+i%6,y:6+Math.floor(i/6),c:i%6,r:Math.floor(i/6)})))];
export const ORCHARD_TREES=[{x:31.5,y:12},{x:33.8,y:12},{x:31.5,y:15.5},{x:33.8,y:15.5}];
export const BEEHIVES=[{x:36,y:12},{x:36,y:15.5}];
