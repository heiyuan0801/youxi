import {FACTORIES,FactoryId} from './FarmCatalog';
import {openFactory} from './FarmLife';
import {Node,Label,Sprite,UITransform} from 'cc';
import {Painter,tint} from './Drawing';
import {FarmState,Result,ProductId,PRODUCTS,NAMES,PRICES,TASKS,claimTask,levelFor} from './FarmModel';
import {RECIPES,RecipeId,enqueueCraft,collectCraft,queueCapacity,recipeSeconds,fishingPhase,castLine,reelLine,buyBait,DAILY_GOALS,dailyProgress,claimDaily,claimDailyBonus,UPGRADE_INFO,UpgradeId,upgradeCost,buyUpgrade,discoveredCount,ALBUM_MILESTONES,claimAlbum,recipeFactory,recipeProduct} from './FarmFeatures';
export interface FeaturePanelContext {
 p:Painter;root:Node;w:number;h:number;state:FarmState;act:(f:()=>Result)=>void;
 button:(label:string,x:number,y:number,w:number,h:number,run:()=>void,color?:string,dark?:string,font?:number)=>Node;
 slot:(x:number,y:number,w:number,h:number)=>Node;live:(f:()=>void)=>void;
}
const INK='#5a3e2b',SOFT='#997455';
const duration=(seconds:number)=>seconds>=60?`${Math.floor(seconds/60)}分${Math.ceil(seconds%60)}秒`:`${Math.ceil(seconds)}秒`;
export function workshopPanel(c:FeaturePanelContext,factory:FactoryId='bakery',select:(id:FactoryId)=>void=()=>{},carpenter:()=>void=()=>{}){
 const {p,root,w,state:s,button,slot,act,live}=c,jobs=s.features.jobs.filter(j=>recipeFactory(RECIPES.find(r=>r.id===j.recipe)!)===factory),recipes=RECIPES.filter(r=>recipeFactory(r)===factory),spec=FACTORIES.find(f=>f.id===factory)!;
 p.contain(root,'windmill',47,37,58,70);p.label(root,'把新鲜收获，做成更值钱的农场好物',w/2+25,21,17,INK,w-110,32);
 p.label(root,`队列 ${jobs.length}/${queueCapacity(s)} · 原料立即扣除 · 离线也会继续制作`,w/2+25,51,12.5,SOFT,w-100,27);
 FACTORIES.forEach((f,i)=>{const x=w/6+i%3*w/3,y=94+Math.floor(i/3)*36;button(f.name,x,y,w/3-6,30,()=>select(f.id),factory===f.id?'#ffb150':'#dfcfb2',factory===f.id?'#dc8a29':'#beaa87',12);});
 p.label(root,spec.description,w/2-82,203,12,SOFT,w-180,31);if(!s.life.factories.includes(factory))button(`建设 · ${spec.cost}`,w-85,203,150,34,()=>act(()=>openFactory(s,factory)),'#67ca70','#3fa84d',12);
 else if(factory==='lumber')button('家具制作台',w-85,203,150,34,carpenter,'#ffb150','#dc8a29',13);
 if(!jobs.length){p.rect(root,w/2,260,w,56,'#fff1d6',17);p.label(root,'选一份配方开始制作吧',w/2,260,14,SOFT,w-20,34);}
 jobs.forEach((job,i)=>{
  const r=RECIPES.find(r=>r.id===job.recipe)!,y=260+i*66;slot(w/2,y,w,58);p.contain(root,recipeProduct(r),35,y,45);
  p.label(root,r.name,158,y-10,15,INK,180,24,true,'left');const label=p.label(root,'',158,y+14,12,SOFT,180,23,true,'left');
  const update=()=>{const now=Date.now();label.string=now>=job.readyAt?'做好啦，趁热领取！':now<job.startedAt?`排队中 · 约${duration((job.readyAt-now)/1000)}后完成`:`制作中 · 剩余${duration((job.readyAt-now)/1000)}`;};update();live(update);
  const ready=Date.now()>=job.readyAt;button(ready?'领取成品':'制作中',w-69,y,115,38,()=>act(()=>collectCraft(s,job.id)),ready?'#67ca70':'#cbbd9e',ready?'#3fa84d':'#ac9978',14);
 });
 const start=351+(Math.max(1,jobs.length)-1)*66;
 recipes.forEach((r,i)=>{
  const y=start+i*150,locked=levelFor(s.xp)<r.level;slot(w/2,y,w,137);const im=p.contain(root,recipeProduct(r),61,y-3,91,95);if(locked){im.getComponent(Sprite)!.grayscale=true;p.opacity(im,130);}
  p.label(root,r.name+((r.amount||1)>1?` ×${r.amount}`:'')+(locked?` · ${r.level}级解锁`:''),270,y-43,18,INK,280,30,true,'left');
  Object.entries(r.needs).forEach(([key,n],j)=>{const id=key as ProductId,x=154+j*125;p.contain(root,id,x,y-4,32);p.label(root,`${NAMES[id]} ${s.inventory[id]}/${n}`,x+60,y-4,11.5,s.inventory[id]>=n!?'#4a9e47':'#c56b52',91,30);});
  p.label(root,`${duration(recipeSeconds(s,r))} · 批次售价${PRICES[recipeProduct(r)]*(r.amount||1)}金币 · 经验${r.xp}`,251,y+41,12,SOFT,255,26,true,'left');
  button(`制作 · ${r.name}`,w-96,y+39,170,40,()=>act(()=>enqueueCraft(s,r.id)),locked?'#cbbd9e':'#ffb150',locked?'#ac9978':'#dc8a29',13);
 });
}
export function fishingPanel(c:FeaturePanelContext){
 const {p,root,w,state:s,button,slot,act,live}=c,f=s.features.fishing,phase=fishingPhase(s),compact=c.h<450,pondY=compact?105:182,pondH=compact?96:237,waterY=compact?101:178,waterH=compact?35:82;
 p.contain(root,'bait',27,25,46);p.label(root,`鱼饵 ×${f.bait}`,115,16,17,INK,125,31,true,'left');
 const refill=p.label(root,'',192,44,11.5,SOFT,290,24,true,'left');const refillUpdate=()=>refill.string=f.bait>=5?'鱼饵充足 · 自然恢复上限5份':`每5分钟恢复1份 · 下份${duration(Math.max(0,f.nextBaitAt-Date.now())/1000)}`;refillUpdate();live(refillUpdate);
 button('买鱼饵 · 30',w-79,26,140,40,()=>act(()=>buyBait(s)),'#ffb150','#dc8a29',13.5);
 slot(w/2,pondY,w,pondH);const g=p.g(root,'FishingPond');p.ellipse(g,w/2,waterY,w*.43,waterH*1.14,'#c3e5a7');p.ellipse(g,w/2,waterY,w*.39,waterH,'#65c4e3');p.ellipse(g,w/2,waterY-5,w*.37,waterH*.89,'#a2e4f5');
 const fish=p.contain(root,'fish',w*.34,waterY+9,compact?58:86,compact?36:56);p.opacity(fish,125);const rare=p.contain(root,'goldenFish',w*.71,waterY-13,compact?38:54,compact?28:44);p.opacity(rare,100);
 const bob=p.g(root,'Float');const bobUpdate=()=>{const t=Date.now()/1000,bx=w/2+Math.sin(t*.8)*9,by=waterY-9+Math.sin(t*3)*(phase==='bite'?8:2);bob.clear();p.line(bob,[[w*.22,waterY-waterH*.8],[bx,by]],'#927659',1.1,140);p.ellipse(bob,bx,by+6,17,4,'#ffffff',100);p.ellipse(bob,bx,by,5,8,phase==='bite'?'#ff779a':'#ffffff');p.ellipse(bob,bx,by-4,5,5,'#ff779a');fish.setPosition((w*.34-p.w/2)+Math.sin(t*.9)*25,p.h/2-waterY-9+Math.cos(t)*5);};bobUpdate();live(bobUpdate);
 if(!compact)p.label(root,'溪流鱼 · 金色锦鲤',w/2,277,13,SOFT,w-20,27);
 const status=p.label(root,'',w/2,compact?174:326,compact?17:21,phase==='bite'?'#db5e83':INK,w-20,36);const statusUpdate=()=>{status.string=phase==='waiting'?`等待咬钩 · ${Math.max(0,Math.ceil((f.cast!.biteAt-Date.now())/1000))}秒`:phase==='bite'?`咬钩啦！${Math.max(0,Math.ceil((f.cast!.escapeAt-Date.now())/1000))}秒内收杆`:phase==='escaped'?'鱼游走啦，再试一竿吧':'池塘很安静，抛一竿试试运气吧';};statusUpdate();live(statusUpdate);
 const label=phase==='idle'?'抛竿 · 1鱼饵':phase==='escaped'?'再抛一竿':phase==='bite'?'收杆！':'等待咬钩';
 button(label,w/2,compact?215:387,270,compact?43:52,()=>act(()=>phase==='idle'||phase==='escaped'?castLine(s):reelLine(s)),phase==='bite'?'#ff7aa2':'#57bddd',phase==='bite'?'#d64f7d':'#3493b1',compact?18:20);
 p.label(root,'咬钩后4.5秒内收杆 · 有机会遇到稀有金色锦鲤',w/2,compact?253:443,compact?11:12.5,SOFT,w-20,25);if(!compact)p.label(root,'离开界面仍会计时，钓到的鱼可出售、交订单并点亮图鉴',w/2,473,12,SOFT,w-20,32);
}
export type DiaryTab='成长'|'今日'|'建设'|'图鉴';
export const diaryHeight=(tab:DiaryTab)=>({成长:680,今日:710,建设:610,图鉴:240+Math.ceil(PRODUCTS.length/3)*132}[tab]);
export function journalPanel(c:FeaturePanelContext,tab:DiaryTab){
 const {p,root,w,state:s,button,slot,act}=c;
 if(tab==='成长'){
  p.label(root,'日常经营，让自己的小农场慢慢长大',w/2,77,13,SOFT,w-10,30);
  TASKS.forEach((t,i)=>{const y=141+i*99;slot(w/2,y,w,88);p.contain(root,i%2?'truck':'wheat',38,y,48);p.label(root,t.name,181,y-21,17,INK,220,29,true,'left');p.label(root,`${t.description} · ${Math.min(t.target,s.stats[t.stat])}/${t.target}`,181,y+8,12.5,SOFT,220,26,true,'left');p.label(root,`奖励 ${t.coins}金币 · 3农场星`,181,y+30,11.5,SOFT,220,23,true,'left');button(s.claimed.includes(t.id)?'已领取':'领取',w-59,y,95,40,()=>act(()=>claimTask(s,t.id)),s.claimed.includes(t.id)?'#a5c89c':'#67ca70','#3fa84d',14);});return;
 }
 if(tab==='今日'){
  const d=s.features.daily;p.label(root,`${d.day} · 北京时间零点更新 · 五选三，按自己喜欢的节奏来`,w/2,77,12,SOFT,w-10,30);
  p.rect(root,w/2,147,w,102,'#fff0c8',21);p.contain(root,'study_star',37,144,55);p.label(root,`今日三件小事 ${Math.min(3,d.claimed.length)}/3`,224,125,19,INK,285,31,true,'left');p.label(root,'额外100金币 · 3农场星 · 2鱼饵',224,158,12,SOFT,285,27,true,'left');button(d.bonusClaimed?'已领取':'领取额外奖励',w-82,157,145,38,()=>act(()=>claimDailyBonus(s)),'#ffba52','#df942f',13);
  DAILY_GOALS.forEach((goal,i)=>{const y=252+i*91,claimed=d.claimed.includes(goal.id),progress=dailyProgress(s,goal.id);slot(w/2,y,w,79);p.contain(root,goal.icon,37,y,46);p.label(root,goal.name,203,y-20,17,INK,260,28,true,'left');p.label(root,`${goal.description} · ${Math.min(goal.target,progress)}/${goal.target}`,203,y+8,12,SOFT,260,25,true,'left');p.label(root,`${goal.coins}金币 · 1农场星 · 5经验`,203,y+29,11,SOFT,260,23,true,'left');button(claimed?'今日已领':'领取每日奖励',w-73,y,128,38,()=>act(()=>claimDaily(s,goal.id)),claimed?'#b6c8a0':progress>=goal.target?'#67ca70':'#cfbea4',claimed?'#8fa679':progress>=goal.target?'#3fa84d':'#ac9676',12.5);});return;
 }
 if(tab==='建设'){
  p.label(root,'永久升级，让下一轮生产更轻松',w/2,77,14,SOFT,w-10,30);
  (Object.keys(UPGRADE_INFO) as UpgradeId[]).forEach((id,i)=>{const d=UPGRADE_INFO[id],lv=s.features.upgrades[id],cost=upgradeCost(s,id),y=172+i*170;slot(w/2,y,w,151);p.contain(root,d.icon,53,y-11,75,80);p.label(root,`${d.name} · ${lv}/3级`,281,y-45,20,INK,320,32,true,'left');p.label(root,d.description,281,y-9,13,SOFT,320,39,true,'left');p.label(root,lv>=3?'已经建设完成':`${cost.level}级 · ${cost.coins}金币 + ${cost.stars}农场星`,252,y+44,12.5,SOFT,270,29,true,'left');button(lv>=3?'已满级':`升级${d.name}`,w-79,y+45,140,40,()=>act(()=>buyUpgrade(s,id)),lv>=3?'#b6c8a0':'#67ca70',lv>=3?'#8fa679':'#3fa84d',13);});
  p.label(root,'已在生长、制作、产出的倒计时会保持原样',w/2,602,12,SOFT,w-20,30);return;
 }
 const count=discoveredCount(s);p.label(root,`丰收图鉴 · 已发现 ${count}/${PRODUCTS.length} 种`,w/2,81,21,INK,w-10,37);
 p.label(root,'亲手收获、制作或钓到即点亮，出售后记录也会保留',w/2,115,12,SOFT,w-10,30);
 ALBUM_MILESTONES.forEach((m,i)=>{const x=w/(ALBUM_MILESTONES.length*2)+i*w/ALBUM_MILESTONES.length,claimed=s.features.album.claimed.includes(m.target);button(claimed?`${m.target}种 · 已领`:`${m.target}种奖励`,x,166,w/ALBUM_MILESTONES.length-7,39,()=>act(()=>claimAlbum(s,m.target)),claimed?'#b6c8a0':count>=m.target?'#ffb950':'#cfbea4',claimed?'#8fa679':'#bd9a60',12);p.label(root,`${m.coins}币 · ${m.stars}星`,x,202,11,SOFT,w/ALBUM_MILESTONES.length-4,25);});
 const ww=(w-20)/3;PRODUCTS.forEach((id,i)=>{const x=ww/2+i%3*(ww+10),y=292+Math.floor(i/3)*132,n=s.features.album.counts[id]||0;slot(x,y,ww,120);const im=p.contain(root,id,x,y-19,67,66);if(!n){im.getComponent(Sprite)!.grayscale=true;p.opacity(im,80);}p.label(root,n?NAMES[id]:'尚未发现',x,y+29,14,INK,ww-6,24);p.label(root,n?`累计获得 ${n}`:NAMES[id],x,y+49,11.5,SOFT,ww-6,22);});
}
