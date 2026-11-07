import {FeaturePanelContext} from './FeaturePanels';
import {AQUATIC,animalSpec} from './FarmCatalog';
import {NAMES} from './FarmModel';
import {seasonIndex} from './FarmLife';
import {growthFor,growthLevel,trainAnimal,contestAnimal,buildPond,feedPond,harvestPond,seasonEvents,deliverSeasonEvent,unlockAuroraAnimal} from './FarmEcology';
const INK='#5a3e2b',SOFT='#997455';
export function pondPanel(c:FeaturePanelContext){
 const {p,root,w,state:s,button,slot,act}=c;
 p.label(root,'水产养殖 · 五种池塘伙伴',w/2,23,22,INK,w,36);p.label(root,'每轮消耗1份饲料 · 离线继续生长 · 成熟后收进仓库',w/2,62,13,SOFT,w,30);
 AQUATIC.forEach((f,i)=>{const y=181+i*205,t=s.ecology.ponds[f.id];slot(w/2,y,w,188);p.rect(root,67,y-20,109,100,'#d9f2f5',24);const fish=p.contain(root,f.id,67,y-20,90,86);
  p.label(root,f.name,w/2+60,y-59,23,INK,w-150,35,true,'left');p.label(root,`${f.level}级 · ${f.seconds}秒 · 每轮${f.output}份`,w/2+60,y-24,13,SOFT,w-150,30,true,'left');
  const l=p.label(root,'',w/2+60,y+8,13,'#438aa2',w-150,30,true,'left');
  // Preserve the sprite's layout position while gently bobbing in its pond card.
  const start=fish.position.clone();const live=()=>{l.string=!t?'尚未建设':!t.fed?'等待投喂':Date.now()>=t.readyAt?'已成熟 · 可以收获':`生长中 · ${Math.ceil((t.readyAt-Date.now())/1000)}秒`;fish.setPosition(start.x+Math.sin(Date.now()/900+i)*8,start.y+Math.sin(Date.now()/600+i)*3);};live();c.live(live);
  if(!t)button(`建池 · ${f.cost}`,w/2,y+63,w-24,39,()=>act(()=>buildPond(s,f.id)),'#58bde4','#3295bd',14);else{button('投喂 · 1饲料',w*.25,y+63,w*.44,39,()=>act(()=>feedPond(s,f.id)),'#ffb150','#dc8a29',13);button('收获'+f.name,w*.75,y+63,w*.44,39,()=>act(()=>harvestPond(s,f.id)),t.fed?'#67ca70':'#c6d5ba',t.fed?'#3fa84d':'#9daf92',13);}
 });
}
export function growthPanel(c:FeaturePanelContext,race:()=>void=()=>{}){
 const {p,root,w,state:s,button,slot,act}=c;p.label(root,'伙伴训练与友谊赛',w/2,22,22,INK,w,36);p.label(root,'成长1—10级，每级效率+2% · 互动、收集产物也增加成长经验',w/2,58,12,SOFT,w,30);p.label(root,'友谊赛按属性评分。障碍赛要自己看准时机起跳。',w/2,88,12,SOFT,w,30);
 button('障碍赛 · 带伙伴亲自跑',w/2,128,w-20,38,race,'#ab89d3','#8360ac',14);
 s.animals.forEach((a,i)=>{const y=250+i*177,g=growthFor(s,a),spec=animalSpec(a.type);slot(w/2,y,w,160);p.contain(root,spec.sprite,53,y-16,83,90);p.label(root,`${spec.name} #${a.id} · 成长${growthLevel(s,a)}级`,w/2+60,y-45,19,INK,w-140,34,true,'left');p.label(root,`经验 ${g.xp}/450 · 奖牌积分 ${g.medals}`,w/2+60,y-12,13,SOFT,w-140,29,true,'left');
  const l=p.label(root,'',w/2+60,y+15,12,SOFT,w-140,27,true,'left'),live=()=>l.string=g.trainAt>Date.now()?`训练休息 ${Math.ceil((g.trainAt-Date.now())/1000)}秒`:'准备好参加训练';live();c.live(live);
  button('训练 · 1饲料',w*.25,y+55,w*.44,36,()=>act(()=>trainAnimal(s,a.id)),'#58bde4','#3295bd',13);button(g.contestSeason===seasonIndex(s)?'本季已参赛':'参加友谊赛',w*.75,y+55,w*.44,36,()=>act(()=>contestAnimal(s,a.id)),'#ffb150','#dc8a29',13);
 });
}
export function eventsPanel(c:FeaturePanelContext,games:()=>void=()=>{}){
 const {p,root,w,state:s,button,slot,act}=c;p.label(root,'四季活动手册',w*.29,22,22,INK,w*.48,36);p.label(root,'每季3项活动 · 提交材料领取奖励 · 下次同季再次开放',w/2,61,12,SOFT,w,32);
 button('四季比赛与日历',w*.77,23,w*.40,34,games,'#ffb150','#dc8a29',14);
 seasonEvents(s).forEach((e,i)=>{const y=184+i*188,claimed=s.ecology.eventSeason===seasonIndex(s)&&s.ecology.events.includes(i);slot(w/2,y,w,171);p.label(root,e.name,w/2,y-60,22,INK,w-20,35);p.label(root,e.description,w/2,y-27,13,SOFT,w-20,29);p.label(root,Object.entries(e.needs).map(([id,n])=>`${NAMES[id as keyof typeof NAMES]} ${s.inventory[id as keyof typeof NAMES]}/${n}`).join('  ·  '),w/2,y+5,13,'#699751',w-20,32);button(claimed?'本季已完成':`提交 · ${e.coins}金币 + ${e.stars}星`,w/2,y+57,w-24,39,()=>act(()=>deliverSeasonEvent(s,i)),'#ffb150','#dc8a29',14);});
 slot(w/2,761,w,165);p.contain(root,'whitePeacock',62,747,100,105);p.label(root,'极光下的白色孔雀',w/2+65,715,21,INK,w-150,35,true,'left');p.label(root,'极光天气中开启奇遇，可提前领养稀有伙伴',w/2+65,753,12,SOFT,w-150,42,true,'left');button(s.ecology.auroraAnimal?'奇遇已解锁':'寻找极光伙伴',w/2,809,w-24,39,()=>act(()=>unlockAuroraAnimal(s)),'#ab89d3','#8360ac',14);
}
