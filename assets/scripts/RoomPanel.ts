import {Node,EventTouch,UITransform,Vec3,ScrollView,BlockInputEvents} from 'cc';
import {FeaturePanelContext} from './FeaturePanels';
import {FURNITURE} from './FarmCatalog';
import {moveFurniture,buyRoomFurniture,rotateFurniture,storeFurniture,roomStyle,expandRoom,WALLS,FLOORS} from './FarmRoom';
export function roomPanel(c:FeaturePanelContext,selected:number|null,select:(id:number)=>void,compact=false,carpenter:()=>void=()=>{}){
 const {p,root,w,h,state:s,button,slot,act}=c,r=s.advanced.room,INK='#5a3e2b',SOFT='#997455',cx=w/2,cy=compact?166:243,rx=Math.min(compact?210:240,w*.43),ry=compact?65:104,wall=compact?33:55,shift=compact?117:0;
 const point=(x:number,y:number)=>[cx+(x-y)*rx,cy+(x+y-1)*ry] as [number,number],inverse=(x:number,y:number)=>({x:((x-cx)/rx+(y-cy)/ry+1)/2,y:((y-cy)/ry+1-(x-cx)/rx)/2});
 p.label(root,`自由装修 · ${r.size}×${r.size}小屋`,w/2,compact?18:24,compact?20:22,INK,w,35);p.label(root,'选中家具后点地板摆放；拖动移动，旋转或收回后自动保存',w/2,compact?47:61,12,SOFT,w,33);
 const board=p.rect(root,w/2,compact?164:234,w-4,compact?196:297,'#f5ecd9',20);board.name='RoomBoard';const g=p.g(root,'FreeRoomFloor');
 p.path(g,[[cx-rx,cy],[cx-rx,cy-wall],[cx,cy-ry-wall],[cx,cy-ry]],WALLS[r.wall],'#cfb797',2);p.path(g,[[cx,cy-ry],[cx,cy-ry-wall],[cx+rx,cy-wall],[cx+rx,cy]],WALLS[r.wall],'#cfb797',2);p.path(g,[point(0,0),point(1,0),point(1,1),point(0,1)],FLOORS[r.floor],'#a78360',2);
 for(let i=1;i<r.size;i++){p.line(g,[point(i/r.size,0),point(i/r.size,1)],'#ffffff',.8,70);p.line(g,[point(0,i/r.size),point(1,i/r.size)],'#ffffff',.8,70);}
 const local=(e:EventTouch)=>{const q=e.getUILocation(),v=root.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(q.x,q.y));return{x:v.x+w/2,y:h/2-v.y};};
 board.on(Node.EventType.TOUCH_END,(e:EventTouch)=>{e.propagationStopped=true;if(selected===null)return;const q=local(e),v=inverse(q.x,q.y);act(()=>moveFurniture(s,selected,v.x,v.y));});board.addComponent(BlockInputEvents);
 [...r.items].filter(f=>f.x!==null).sort((a,b)=>a.type==='rug'?-1:b.type==='rug'?1:(a.x!+a.y!)-(b.x!+b.y!)).forEach(f=>{const [x,y]=point(f.x!,f.y!),scale=(compact?.76:1)*6/r.size,n=p.contain(root,f.type,x,y-19*scale,(f.type==='rug'?92:74)*scale,90*scale);n.name='RoomPiece-'+f.id;n.angle=-f.rotation*90;if(f.id===selected){const mark=p.g(root,'SelectedFurniture');p.line(mark,[[x-30*scale,y+6],[x+30*scale,y+6]],'#6dbe5c',4);}
  n.addComponent(BlockInputEvents);let start={x:0,y:0},target={x,y},moved=false;const scroll=root.parent?.getComponent(ScrollView);let scrollEnabled=true;
  n.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{e.propagationStopped=true;start=local(e);target={x,y};moved=false;if(scroll){scrollEnabled=scroll.enabled;scroll.enabled=false;}});
  n.on(Node.EventType.TOUCH_MOVE,(e:EventTouch)=>{e.propagationStopped=true;const q=local(e);target={x:x+q.x-start.x,y:y+q.y-start.y};moved=moved||Math.hypot(q.x-start.x,q.y-start.y)>4;n.setPosition(target.x-w/2,h/2-target.y+19*scale);});
  n.on(Node.EventType.TOUCH_END,(e:EventTouch)=>{e.propagationStopped=true;if(scroll)scroll.enabled=scrollEnabled;if(!moved){select(f.id);return;}const v=inverse(target.x,target.y);n.setPosition(x-w/2,h/2-y+19*scale);act(()=>moveFurniture(s,f.id,v.x,v.y));});
  n.on(Node.EventType.TOUCH_CANCEL,()=>{if(scroll)scroll.enabled=scrollEnabled;n.setPosition(x-w/2,h/2-y+19*scale);});
 });
 const f=r.items.find(f=>f.id===selected);p.label(root,f?`已选 ${FURNITURE.find(t=>t.id===f.type)!.name} #${f.id} · 角度${f.rotation*90}°`:'点选下方家具，或直接拖动房间中的家具',w/2,377-shift,13,SOFT,w,31);
 button('旋转90°',w/4,420-shift,w/2-10,38,()=>act(()=>rotateFurniture(s,selected!)),'#58bde4','#3295bd',14);button('收回家具箱',w*3/4,420-shift,w/2-10,38,()=>act(()=>storeFurniture(s,selected!)),'#ab89d3','#8360ac',14);
 button('更换墙面',w/6,467-shift,w/3-8,37,()=>act(()=>roomStyle(s,'wall')),'#ffb150','#dc8a29',13);button('更换地板',w/2,467-shift,w/3-8,37,()=>act(()=>roomStyle(s,'floor')),'#ffb150','#dc8a29',13);button(r.size>=10?'房间已满级':`扩房 · ${(r.size-4)*400}金币`,w*5/6,467-shift,w/3-8,37,()=>act(()=>expandRoom(s)),'#67ca70','#3fa84d',12);
 p.label(root,'家具箱 · 最多40件',w*.28,520-shift,17,INK,w*.5,34);
 button('家具制作台',w*.77,520-shift,w*.37,34,carpenter,'#ffb150','#dc8a29',14);
 r.items.forEach((f,i)=>{const y=575-shift+i*66;slot(w/2,y,w,58);p.contain(root,f.type,36,y,48,50);p.label(root,`${FURNITURE.find(t=>t.id===f.type)!.name} #${f.id}${f.x===null?' · 未摆放':''}`,w/2-10,y,14,SOFT,w-150,29);button(f.id===selected?'已选择 #'+f.id:'选择 #'+f.id,w-73,y,130,35,()=>select(f.id),'#58bde4','#3295bd',13);});
 const base=610-shift+r.items.length*66;p.label(root,'添置家具',w/2,base,20,INK,w,35);FURNITURE.forEach((f,i)=>{const y=base+78+i*105;slot(w/2,y,w,94);p.contain(root,f.id,45,y,70,75);p.label(root,`${f.name} · ${f.cost}金币`,w/2+35,y-23,18,INK,w-140,31,true,'left');p.label(root,`${f.planks}木板 + ${f.cloth}棉布`,w/2-10,y+16,12,SOFT,w-230,29);button('添置'+f.name,w-86,y+20,151,35,()=>act(()=>buyRoomFurniture(s,f.id)),'#67ca70','#3fa84d',13);});
}
