import {FeaturePanelContext} from './FeaturePanels';
import {NAMES,CROPS,levelFor} from './FarmModel';
import {animalSpec,TRAVEL_MAPS} from './FarmCatalog';
import {Trait} from './FarmAdvanced';
import {genome,geneValue,family,ancestry,TRAITS,TRAIT_NAMES,pairAnimals} from './FarmGenetics';
import {routes,beginExplore,takeRoute,resolveExploreEvent,descendExplore,finishExplore} from './FarmExplore';
import {toggleOffline,toggleAutoOption,selectAutoSeed,toggleAutoRecipe,cycleAutomationReserve} from './FarmAutomation';
import {toggleAutomation} from './FarmLife';
import {RECIPES} from './FarmFeatures';
const INK='#5a3e2b',SOFT='#997455';
export function geneticsPanel(c:FeaturePanelContext,parents:number[],focus:Trait,select:(id:number)=>void,setFocus:(t:Trait)=>void){
 const {p,root,w,state:s,button,slot,act}=c;p.label(root,'基因育种 · 选择两位同族伙伴',w/2,23,22,INK,w,35);p.label(root,'产能影响效率，温顺影响亲密，体质减缓饥饿 · 双亲基因可遗传',w/2,60,12,SOFT,w,31);
 p.label(root,'双亲：'+(parents.map(id=>animalSpec(s.animals.find(a=>a.id===id)!.type).name+' #'+id).join(' ＋ ')||'尚未选择'),w/2,98,16,INK,w,35);
 TRAITS.forEach((t,i)=>button('偏重'+TRAIT_NAMES[t],w/6+i*w/3,142,w/3-8,37,()=>setFocus(t),focus===t?'#ab89d3':'#cfbfa1',focus===t?'#8360ac':'#ad9875',13));
 button('定向培育 · 150金币 + 6饲料',w/2,191,w-16,42,()=>act(()=>pairAnimals(s,parents[0],parents[1],focus)),'#67ca70','#3fa84d',14);
 p.label(root,'同族可杂交 · 三代内有共同祖先不可配对 · 双亲亲密≥20',w/2,232,12,SOFT,w,32);
 s.animals.forEach((a,i)=>{
  const y=350+i*196,g=genome(s,a.id),chosen=parents.includes(a.id),line=ancestry(s,a.id);
  slot(w/2,y,w,181);p.contain(root,animalSpec(a.type).sprite,52,y-24,80,90);
  p.label(root,`${animalSpec(a.type).name} #${a.id} · 第${g.generation}代`,w/2+60,y-65,18,INK,w-140,32,true,'left');
  p.label(root,TRAITS.map(t=>`${TRAIT_NAMES[t]} ${g[t].join('/')} (${geneValue(g,t)})`).join('  '),w/2+60,y-34,12,'#699751',w-140,30,true,'left');
  const pedigree=line.map((ids,depth)=>ids.length?`${['双亲','祖辈','曾祖辈'][depth]} ${ids.map(id=>'#'+id).join(' ')}`:'').filter(Boolean);
  p.label(root,pedigree.length?pedigree.join('\n')+(g.mutated?' · 有突变':''):'创始品种 · '+animalSpec(family(a.type)).name+'家族',
    w/2+60,y+14,12,SOFT,w-140,58,true,'left');
  button(chosen?'已选双亲 #'+a.id:'选择双亲 #'+a.id,w/2,y+65,w-20,34,()=>select(a.id),chosen?'#ab89d3':'#58bde4',chosen?'#8360ac':'#3295bd',13);
 });
}
export function explorePanel(c:FeaturePanelContext,companion:number|null,selectPet:()=>void,home:()=>void){
 const {p,root,w,state:s,button,slot,act}=c,r=s.advanced.explore.run,pet=s.animals.find(a=>a.id===(r?r.companion:companion));p.label(root,r?`${TRAVEL_MAPS.find(m=>m.id===r.map)!.name} · 第${r.depth}/12层`:'深入未知的农场世界',w/2,24,23,INK,w,36);
 if(!r){p.label(root,'先进入森林、矿山、海滩或雪原，每层有3处路线。\n沿途选择会改变收获；随时安全返程，带回探索背包。',w/2,89,14,SOFT,w-30,70);p.contain(root,'forestCamp',w/2,198,140,140);button('同行：'+(pet?animalSpec(pet.type).name+' #'+pet.id:'独自出发'),w/2,304,w-20,42,selectPet,'#58bde4','#3295bd',14);p.label(root,'马／独角兽／骆驼节省体力，小狗增加采集产量',w/2,347,12,SOFT,w,30);button('开始探索 · 4农场体力',w/2,398,w-20,44,()=>act(()=>beginExplore(s,companion)),'#67ca70','#3fa84d',15);return;}
 p.label(root,`探索体力 ${r.stamina}/12 · 本层进度 ${r.step}/3 · ${pet?animalSpec(pet.type).name+'同行':'独自探索'}`,w/2,67,14,SOFT,w,32);
 if(r.event){const names={bridge:'断桥小径',nest:'迷路幼鸟',spring:'清泉营地'},needs={bridge:'用1木板修桥',nest:'用1饲料喂幼鸟',spring:'用1香草调制补给'};slot(w/2,185,w,170);p.label(root,names[r.event],w/2,129,24,INK,w,40);p.label(root,'帮助可得1宝石与2体力；绕路消耗1体力，得到1木材',w/2,173,12,SOFT,w-20,32);button(needs[r.event],w*.25,229,w*.46,40,()=>act(()=>resolveExploreEvent(s,0)),'#67ca70','#3fa84d',13);button('绕路通过',w*.75,229,w*.46,40,()=>act(()=>resolveExploreEvent(s,1)),'#58bde4','#3295bd',13);}
 else if(r.step<3)routes(s).forEach((route,i)=>{const y=137+i*81;slot(w/2,y,w,70);p.contain(root,route.icon,40,y,52);p.label(root,route.kind==='rest'?'消耗1饲料，恢复5探索体力':`消耗最多${route.cost}探索体力`,w/2-25,y+13,12,SOFT,w-200,27);button(route.name,w-104,y,185,40,()=>act(()=>takeRoute(s,i)),'#58bde4','#3295bd',14);});
 else{p.contain(root,'gem',w/2,172,90);p.label(root,'本层探索完成！',w/2,247,21,INK,w,36);button('进入下一层',w/2,305,w-20,43,()=>act(()=>descendExplore(s)),'#67ca70','#3fa84d',15);}
 slot(w/2,448,w,184);p.label(root,'探索背包 · 返程后入库',w/2,381,19,INK,w,33);p.label(root,Object.entries(r.bag).map(([id,n])=>`${NAMES[id as keyof typeof NAMES]} ×${n}`).join('  ·  ')||'还没有收获，选择路线继续前进',w/2,437,13,SOFT,w-24,75);p.label(root,'每层首次完成另奖励80金币＋2星，重复探索不重复发奖',w/2,505,12,SOFT,w-20,31);
 button('安全返程 · 物资入库',w/2,589,w-20,45,()=>{act(()=>finishExplore(s));home();},'#ffb150','#dc8a29',15);
}
export function automationPanel(c:FeaturePanelContext){
 const {p,root,w,state:s,button,slot,act}=c,a=s.advanced.auto;p.label(root,'自动农场 · 在线与离线持续生产',w/2,24,22,INK,w,36);p.label(root,'最多结算8小时 · 缺钱或缺材料时暂停相应任务 · 产物直接入库',w/2,63,12,SOFT,w,32);
 button(!a.built?'建管理站 · 800金币 + 10木材 + 5铜矿':a.enabled?'暂停离线管理站':'开启离线管理站',w/2,111,w-20,43,()=>act(()=>toggleOffline(s)),'#ab89d3','#8360ac',14);
 (['harvest','feed'] as const).forEach((kind,i)=>{const la=s.life.automation,built=kind==='harvest'?la.harvestBuilt:la.feedBuilt;button((kind==='harvest'?'收菜器':'喂养器')+' · '+(!built?'建造':la[kind]?'已开启':'已暂停'),w/4+i*w/2,169,w/2-10,39,()=>act(()=>toggleAutomation(s,kind)),'#67ca70','#3fa84d',13);});
 (['replant','animals','ponds','craft'] as const).forEach((key,i)=>button(['自动补种','动物产物','水产循环','加工循环'][i]+' · '+(a[key]?'开':'关'),w/4+i%2*w/2,222+Math.floor(i/2)*46,w/2-10,38,()=>act(()=>toggleAutoOption(s,key)),a[key]?'#58bde4':'#cfbfa1',a[key]?'#3295bd':'#ad9875',13));
 button(`自动消耗保留 · 每种${s.activities.reserve}份`,w/2,312,w-20,37,()=>act(()=>cycleAutomationReserve(s)),'#ab89d3','#8360ac',13);
 const available=CROPS.filter(c=>levelFor(s.xp)>=c.level||s.cropUnlocks.includes(c.id)),crop=CROPS.find(c=>c.id===a.seed)!;button('补种：'+crop.name+' · 切换',w/2,355,w-20,40,()=>act(()=>selectAutoSeed(s,available[(available.findIndex(c=>c.id===a.seed)+1)%available.length].id)),'#ffb150','#dc8a29',14);
 p.label(root,'自动配方 · 每厂选一种，材料充足时自动接续',w/2,410,19,INK,w,36);
 RECIPES.forEach((r,i)=>{const y=465+i*61;slot(w/2,y,w,53);p.label(root,r.name,145,y,15,INK,270,29,true,'left');button(a.recipes.includes(r.id)?'停止'+r.name:'自动'+r.name,w-90,y,158,35,()=>act(()=>toggleAutoRecipe(s,r.id)),a.recipes.includes(r.id)?'#67ca70':'#cfbfa1',a.recipes.includes(r.id)?'#3fa84d':'#ad9875',13);});
}
export function offlinePanel(c:FeaturePanelContext,done:()=>void){const {p,root,w,state:s,button,act}=c,r=s.advanced.auto.report;p.label(root,'欢迎回到晴野物语',w/2,27,24,INK,w,38);if(!r){p.label(root,'离线超过30秒后，这里会记录小助手的工作',w/2,100,14,SOFT,w,50);return;}p.label(root,`结算 ${Math.floor(r.seconds/60)}分${r.seconds%60}秒${r.limited?' · 已达8小时上限':''}`,w/2,77,16,SOFT,w,32);p.label(root,`收获${r.harvests}次 · 补种${r.plants}次 · 动物水产${r.products}份\n加工${r.crafts}批 · 喂养${r.feeds}次\n消耗${r.coinsSpent}金币 · 获得${r.xp}经验`,w/2,151,17,INK,w-20,107);p.label(root,'库存净变化（已自动入库，材料消耗也已扣除）',w/2,234,13,SOFT,w,32);p.label(root,Object.entries(r.items).map(([id,n])=>`${NAMES[id as keyof typeof NAMES]} ${n!>0?'+':''}${n}`).join('  ·  ')||'本次没有库存变化，可检查开关、金币和材料',w/2,322,14,'#699751',w-24,140);button('知道了 · 继续经营',w/2,433,w-20,43,()=>{act(()=>{r.unread=false;return{ok:true,message:'离线报告已读，所有产物已经入库'};});done();},'#67ca70','#3fa84d',15);}
