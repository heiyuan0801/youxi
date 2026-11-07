import {toggleRoaming,growthLevel} from './FarmEcology';
import {FeaturePanelContext} from './FeaturePanels';
import {FarmState,NAMES,levelFor} from './FarmModel';
import {ANIMALS,animalSpec,TRAVEL_MAPS,MapId,FURNITURE,FurnitureId,SEASONS,WEATHER_NAMES} from './FarmCatalog';
import {careFor,isAdult,efficiency,careAnimal,breedAnimals,collectBaby,unlockMap,startExpedition,collectExpedition,festival,seasonIndex,weatherAt,claimFestival,claimWeather,buyFurniture,placeFurniture,toggleAutomation} from './FarmLife';
const INK='#5a3e2b',SOFT='#997455';
const time=(at:number)=>Math.max(0,Math.ceil((at-Date.now())/1000));
export function animalsPanel(c:FeaturePanelContext,shop:()=>void,open:(id:'ponds'|'growth'|'genetics')=>void){
 const {p,root,w,state:s,button,slot,act}=c;
 p.label(root,`动物伙伴 · ${s.animals.length}/60`,w/2-76,22,22,INK,w-170,34);button('领养新伙伴',w-84,23,148,40,shop,'#ff7aa2','#d64f7d',14);
 p.label(root,'喂食和互动提升生产效率；两只成年同品种亲密度20可繁殖',w/2,62,12,SOFT,w-14,36);
 button(s.ecology.roaming?'召回小院':'一起出去玩',w/6,105,w/3-10,39,()=>act(()=>toggleRoaming(s)),'#67ca70','#3fa84d',13);button('水产养殖',w/2,105,w/3-10,39,()=>open('ponds'),'#58bde4','#3295bd',13);button('训练与比赛',w*5/6,105,w/3-10,39,()=>open('growth'),'#ffb150','#dc8a29',13);p.label(root,s.ecology.roaming?'自由游玩中 · 沿小路出门，点击召回后走回小院':'小院休息中 · 所有动物都可以出去玩',w/2,148,12,SOFT,w,30);
 button('基因育种 · 选择双亲',w/2,191,w-16,37,()=>open('genetics'),'#ab89d3','#8360ac',14);
 s.life.breeds.forEach((j,i)=>{const y=279+i*74;slot(w/2,y,w,66);p.contain(root,animalSpec(j.type).sprite,35,y,48);p.label(root,`${animalSpec(j.type).name}幼崽`,165,y-13,17,INK,200,30,true,'left');const l=p.label(root,'',165,y+13,12,SOFT,200,25,true,'left');const update=()=>l.string=time(j.readyAt)?`育幼中 · ${time(j.readyAt)}秒`:'幼崽准备好啦';update();c.live(update);button('迎接幼崽',w-74,y,130,39,()=>act(()=>collectBaby(s,j.id)));});
 s.animals.forEach((a,i)=>{const y=346+s.life.breeds.length*74+i*190,spec=animalSpec(a.type),care=careFor(s,a),adult=isAdult(s,a);slot(w/2,y,w,176);p.contain(root,spec.sprite,58,y-29,86,88);p.label(root,`${spec.name} #${a.id}${adult?'':' · 幼崽'}`,w/2+60,y-66,18,INK,w-140,30,true,'left');p.label(root,`${spec.rarity?'★'.repeat(spec.rarity)+' 稀有':'普通品种'} · 效率${Math.round(efficiency(s,a)*100)}% · ${adult?'成年':`成长剩余${time(care.adultAt)}秒`}`,w/2+60,y-35,12,SOFT,w-140,26,true,'left');
  p.label(root,`饱食 ${Math.round(care.hunger)}   心情 ${Math.round(care.mood)}   健康 ${Math.round(care.health)}   亲密 ${Math.round(care.bond)}`,w/2+60,y-8,12,'#699751',w-140,27,true,'left');p.label(root,spec.role,w/2,y+24,12,SOFT,w-26,26);
  button('喂食 · 1饲料',w*.16,y+62,w*.29,36,()=>act(()=>careAnimal(s,a.id,'feed')),'#ffb150','#dc8a29',12);button('互动',w*.395,y+62,w*.15,36,()=>act(()=>careAnimal(s,a.id,'groom')),'#ff7aa2','#d64f7d',12);button('治疗 · 30',w*.59,y+62,w*.22,36,()=>act(()=>careAnimal(s,a.id,'heal')),'#58bde4','#3295bd',12);button('繁殖',w*.845,y+62,w*.23,36,()=>act(()=>breedAnimals(s,a.type)),'#ab89d3','#8360ac',12);
 });
 p.label(root,'繁殖：100金币 + 4饲料 · 育幼2分钟 · 成长5分钟 · 双亲冷却1小时',w/2,281+s.life.breeds.length*74+s.animals.length*190,11.5,SOFT,w-10,38);
}
export function travelPanel(c:FeaturePanelContext,go:(id:MapId)=>void,explore:()=>void){
 const {p,root,w,state:s,button,slot,act}=c;
 p.label(root,`旅行手册 · 体力 ${s.life.energy}/24`,w/2,21,22,INK,w-20,35);p.label(root,'每2分钟恢复1点 · 采集消耗2点 · 资源点10分钟恢复',w/2,55,12,SOFT,w-10,29);
 button('返回主农场',w*.25,103,w*.44,40,()=>go('home'),'#58bde4','#3295bd',14);const j=s.life.expedition;
 button(j?'领取探险奖励':'远行探险 · 4体力',w*.75,103,w*.44,40,()=>act(()=>j?collectExpedition(s):startExpedition(s)),'#ffb150','#dc8a29',13);
 const l=p.label(root,'',w/2,146,12,SOFT,w-10,30),update=()=>l.string=j?`${TRAVEL_MAPS.find(m=>m.id===j.map)!.name}探险队 · ${time(j.readyAt)?`返回还需${time(j.readyAt)}秒`:'已返回，快领取奖励'}`:'抵达资源地图后可出发 · 马和独角兽加速，小狗增加奖励';update();c.live(update);
 button('分层探索 · 路线与奇遇',w/2,195,w-16,40,explore,'#ab89d3','#8360ac',14);
 TRAVEL_MAPS.forEach((m,i)=>{const y=311+i*170,owned=s.life.maps.includes(m.id);slot(w/2,y,w,155);p.contain(root,m.icon,62,y-17,104,102);p.label(root,m.name,w/2+65,y-49,21,INK,w-150,34,true,'left');p.label(root,m.description,w/2+65,y-13,12,SOFT,w-150,38,true,'left');p.label(root,owned?'通行证已获得':`${m.level}级 · ${m.cost}金币`,w/2-90,y+47,12,SOFT,w-210,30);button(owned?'前往'+m.name:'解锁'+m.name,w-95,y+47,170,40,()=>owned?go(m.id):act(()=>unlockMap(s,m.id)),owned?'#58bde4':'#67ca70',owned?'#3295bd':'#3fa84d',13);});
}
export function seasonPanel(c:FeaturePanelContext,events:()=>void,games:()=>void=()=>{},summer:()=>void=()=>{}){
 const {p,root,w,state:s,button,slot,act}=c,index=seasonIndex(s),weather=weatherAt(s),f=festival(s),progress=Math.max(0,f.value-s.life.festivalBaseline);
 p.contain(root,weather==='snow'||weather==='aurora'?'snowCabin':weather==='rainbow'?'rainbowCow':'sunflower',w/2,70,108,110);p.label(root,`${SEASONS[index%4]}季 · ${WEATHER_NAMES[weather]}`,w/2,151,26,INK,w-20,42);
 button('限时渔赛',w*.18,70,w*.28,36,summer,'#58bde4','#3295bd',13);
 button('四季比赛与日历',w*.82,70,w*.32,40,games,'#ffb150','#dc8a29',14);
 p.label(root,'一季20分钟 · 天气每4分钟变化 · 离线也会轮转',w/2,192,12,SOFT,w-10,30);
 slot(w/2,290,w,132);p.contain(root,f.icon,55,273,76);p.label(root,f.name,w/2+65,252,22,INK,w-150,35,true,'left');p.label(root,`${f.description} · ${Math.min(f.target,progress)}/${f.target}`,w/2+65,283,14,SOFT,w-150,31,true,'left');button(s.life.festivalClaimed?'本季已领':'领取季节奖励',w-100,327,177,38,()=>act(()=>claimFestival(s)),'#ffb150','#dc8a29',13);p.label(root,`${f.coins}金币 + 5农场星`,132,327,12,SOFT,240,28,true,'left');
 slot(w/2,451,w,138);p.label(root,'天气里的小惊喜',w/2,406,21,INK,w-20,34);p.label(root,'雨天自动浇水；冬季大雪会暂停喜暖作物。\n雷电送铜矿，彩虹送宝石，极光送极光莓并提前解锁种子。',w/2,448,13,SOFT,w-35,59);button('领取天气礼物',w/2,501,220,38,()=>act(()=>claimWeather(s)),'#ab89d3','#8360ac',14);
 p.label(root,'自动化小助手',w/2,570,23,INK,w-20,37);
 (['harvest','feed'] as const).forEach((kind,i)=>{const a=s.life.automation,built=kind==='harvest'?a.harvestBuilt:a.feedBuilt,y=657+i*130;slot(w/2,y,w,113);p.contain(root,kind==='harvest'?'harvester':'feed',44,y-12,67);p.label(root,kind==='harvest'?'自动收获器':'自动喂养器',w/2+60,y-32,20,INK,w-140,34,true,'left');p.label(root,kind==='harvest'?'10级 · 400金币 + 5铜矿':'6级 · 250金币 + 2铜矿',w/2+60,y-1,12,SOFT,w-140,28,true,'left');p.label(root,kind==='harvest'?'回到农场，关闭弹窗后自动收获成熟田地':'饱食低于50时消耗仓库饲料喂食',w/2-80,y+33,11.5,SOFT,w-190,28);button(!built?'建造并开启':a[kind]?'暂停':'开启',w-71,y+30,126,37,()=>act(()=>toggleAutomation(s,kind)));});
 p.label(root,'开启右侧自动农场中的离线管理站，可继续离线收菜与喂养',w/2,843,11,SOFT,w-20,32);
 button('四季活动 · 稀有动物奇遇',w/2,878,w-20,44,events,'#ab89d3','#8360ac',15);
}
export function homePanel(c:FeaturePanelContext,selected:FurnitureId|null,select:(id:FurnitureId)=>void){
 const {p,root,w,state:s,button,slot,act}=c;
 p.label(root,'我的小屋 · 家具可以自由换位置',w/2,20,22,INK,w-20,36);
 const cx=w/2,cy=224,g=p.g(root,'Room');p.path(g,[[cx-210,cy-52],[cx,cy-90],[cx+210,cy-52],[cx,cy+56]],'#d7b28d','#a87750',2);p.path(g,[[cx-210,cy-52],[cx-210,cy-100],[cx,cy-180],[cx,cy-90]],'#f7e7d3','#d6b692',2);p.path(g,[[cx,cy-90],[cx,cy-180],[cx+210,cy-100],[cx+210,cy-52]],'#fff0db','#d6b692',2);
 const places=[[cx-100,cy-65],[cx+25,cy-100],[cx+118,cy-85],[cx-90,cy-14],[cx+12,cy-62],[cx+12,cy+1]];
 s.life.home.slots.forEach((id,i)=>{const [x,y]=places[i];if(id)p.contain(root,id,x,y-27,id==='rug'?90:82,90);p.pill(root,x,y+22,28,24,'#fff7df');p.label(root,String(i+1),x,y+22,12,SOFT,27,23);});
 p.label(root,selected?`已选：${FURNITURE.find(f=>f.id===selected)!.name} · 点位置摆放`:'购买家具后点“选中”，再选择位置',w/2,315,13,SOFT,w-15,30);
 for(let i=0;i<6;i++)button(`位置${i+1}`,w/12+i*w/6,355,w/6-7,35,()=>act(()=>placeFurniture(s,selected,i)),'#58bde4','#3295bd',12);
 FURNITURE.forEach((f,i)=>{const y=455+i*125,owned=s.life.home.owned.includes(f.id);slot(w/2,y,w,112);p.contain(root,f.id,48,y,78,86);p.label(root,f.name,w/2+60,y-30,19,INK,w-140,32,true,'left');p.label(root,owned?'家具箱里已有这件家具':`${f.cost}金币 · ${f.planks}木板 · ${f.cloth}棉布`,w/2+60,y+1,12,SOFT,w-140,29,true,'left');button(owned?selected===f.id?'已选中':'选中家具':'购买家具',w-85,y+32,150,36,()=>owned?select(f.id):act(()=>buyFurniture(s,f.id)),selected===f.id?'#ab89d3':'#67ca70',selected===f.id?'#8360ac':'#3fa84d',13);});
}
