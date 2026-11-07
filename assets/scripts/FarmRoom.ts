import type {FarmState,Result} from './FarmModel';
import {FURNITURE,FurnitureId} from './FarmCatalog';
import {farmLevel} from './FarmFeatures';
import {noteDecor} from './FarmRetention';
export const WALLS=['#fff0db','#e5f1df','#e0edfa','#f8e1e8'];
export const FLOORS=['#d7b28d','#b9cbad','#a8bfce','#dab8c6'];
export function buyRoomFurniture(s:FarmState,type:FurnitureId):Result{
 const f=FURNITURE.find(f=>f.id===type);
 if(!f)return{ok:false,message:'没有这件家具'};
 if(s.advanced.room.items.length+(s.activities.furniture?1:0)>=40)return{ok:false,message:'家具箱最多40件，正在制作的也会占一个位置'};
 if(s.coins<f.cost||s.inventory.planks<f.planks||s.inventory.cloth<f.cloth)return{ok:false,message:`需要${f.cost}金币、${f.planks}木板、${f.cloth}棉布`};
 s.coins-=f.cost;s.inventory.planks-=f.planks;s.inventory.cloth-=f.cloth;
 return putInFurnitureBox(s,type);
}
function putInFurnitureBox(s:FarmState,type:FurnitureId):Result{
 const room=s.advanced.room,f=FURNITURE.find(f=>f.id===type)!;
 room.items.push({id:++room.serial,type,x:null,y:null,rotation:0});
 if(!s.life.home.owned.includes(type))s.life.home.owned.push(type);
 noteDecor(s);return{ok:true,message:`${f.name}收入家具箱 · 选中后点地板摆放`};
}
export function startFurniture(s:FarmState,type:FurnitureId,now=Date.now()):Result{
 const f=FURNITURE.find(f=>f.id===type);
 if(!f)return{ok:false,message:'没有这件家具'};
 if(farmLevel(s.xp)<3||!s.life.factories.includes('lumber'))return{ok:false,message:'3级后先在工坊建造木材厂'};
 if(s.activities.furniture)return{ok:false,message:'先领取上一件家具'};
 if(s.advanced.room.items.length>=40)return{ok:false,message:'家具箱最多40件'};
 if(s.inventory.planks<f.planks||s.inventory.cloth<f.cloth)return{ok:false,message:'请备齐木板和棉布'};
 s.inventory.planks-=f.planks;s.inventory.cloth-=f.cloth;
 s.activities.furniture={type,readyAt:now+45000};
 return{ok:true,message:`${f.name}开始制作 · 45秒后可领取`};
}
export function collectFurniture(s:FarmState,now=Date.now()):Result{
 const job=s.activities.furniture;
 if(!job||now<job.readyAt)return{ok:false,message:'家具还没做好'};
 if(s.advanced.room.items.length>=40)return{ok:false,message:'家具箱已满'};
 s.activities.furniture=null;
 return putInFurnitureBox(s,job.type);
}
export function moveFurniture(s:FarmState,id:number,x:number,y:number):Result{
 const r=s.advanced.room,f=r.items.find(f=>f.id===id);if(!f||!Number.isFinite(x+y)||x<.08||x>.92||y<.08||y>.92)return{ok:false,message:'请放在房间地板内'};
 if(f.type!=='rug'&&r.items.some(a=>a.id!==id&&a.type!=='rug'&&a.x!==null&&a.y!==null&&Math.hypot(a.x-x,a.y-y)<.85/r.size))return{ok:false,message:'这里已经摆了家具，换个位置吧'};
 f.x=Math.round(x*1000)/1000;f.y=Math.round(y*1000)/1000;noteDecor(s);return{ok:true,message:'家具位置已保存'};
}
export function rotateFurniture(s:FarmState,id:number):Result{const f=s.advanced.room.items.find(f=>f.id===id);if(!f)return{ok:false,message:'先选中一件家具'};f.rotation=(f.rotation+1)%4;return{ok:true,message:'家具旋转90°'};}
export function storeFurniture(s:FarmState,id:number):Result{const f=s.advanced.room.items.find(f=>f.id===id);if(!f)return{ok:false,message:'先选中家具'};f.x=f.y=null;return{ok:true,message:'已收回家具箱'};}
export function roomStyle(s:FarmState,kind:'wall'|'floor'):Result{const r=s.advanced.room;r[kind]=(r[kind]+1)%4;return{ok:true,message:kind==='wall'?'墙面颜色已更换':'地板颜色已更换'};}
export function expandRoom(s:FarmState):Result{const r=s.advanced.room;if(r.size>=10)return{ok:false,message:'房间已扩至10×10'};const cost=(r.size-4)*400,wood=r.size-3;if(s.coins<cost||s.inventory.planks<wood)return{ok:false,message:`扩房需要${cost}金币和${wood}木板`};s.coins-=cost;s.inventory.planks-=wood;r.size+=2;return{ok:true,message:`小屋扩到${r.size}×${r.size}，可以摆得更宽敞`};}
