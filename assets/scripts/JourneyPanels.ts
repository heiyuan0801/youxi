import type { FeaturePanelContext } from './FeaturePanels';
import { FURNITURE, TRAVEL_MAPS } from './FarmCatalog';
import { NAMES } from './FarmModel';
import { breakfastLine, honorLine, itemName, storyCopy } from './FarmI18n';
import { seasonIndex } from './FarmLife';
import { AREA_STORIES, BREAKFAST_STEPS, HONORS, advanceBreakfast, breakfastReady, claimHonor, finishStory, honorReady } from './FarmJourney';
import { FLOWER_PALETTE, FlowerChoice, ICE_ROUND_MS, calendarEvent, claimCalendar, flowerScore, iceWindow, judgePumpkin, pullIceLine, startIceFishing, startPatrol, submitFlowers } from './FarmActivities';
import { collectFurniture, startFurniture } from './FarmRoom';
import { buyBait } from './FarmFeatures';

const INK = '#5a3e2b';
const SOFT = '#997455';

export function breakfastPanel(c: FeaturePanelContext, go: (target: 'farm' | 'mill' | 'bakery' | 'honors') => void) {
  const { p, root, w, state: s, button, slot, act } = c;
  const step = s.journey.breakfast;
  const locale = s.retention?.locale;
  p.label(root, '第一炉面包', w / 2, 24, 23, INK, w, 38);
  p.label(root, '跟着阿禾学做面包，把新鲜早餐送到小镇。', w / 2, 62, 14, SOFT, w, 32);
  BREAKFAST_STEPS.forEach((goal, i) => {
    const y = 117 + i * 55;
    const line = breakfastLine(i, locale);
    slot(w / 2, y, w, 50);
    p.contain(root, goal.icon, 28, y, 34);
    p.label(root, line.title, w / 2 - 33, y, 15, INK, w - 188, 30, true, 'left');
    p.label(root, i < step ? '已完成' : i === step ? '当前目标' : '未开启', w - 60, y, 13, i === step ? '#42985c' : SOFT, 100, 30);
  });
  if (step < BREAKFAST_STEPS.length) {
    p.label(root, breakfastLine(step, locale).hint, w / 2, 408, 15, SOFT, w - 14, 58);
    const ready = breakfastReady(s);
    if (ready) {
      const label = step === 3 ? '把面包交给阿禾' : step === 4 ? '领取开垦补给' : '完成这一步';
      button(label, w / 2, 472, w - 14, 44, () => act(() => advanceBreakfast(s)));
    } else {
      const target = step === 0 ? 'farm' : step === 1 ? 'mill' : 'bakery';
      button(step === 0 ? '回田里收小麦' : step === 1 ? '打开磨坊' : '打开面包房', w / 2, 472, w - 14, 44, () => go(target));
    }
  } else {
    p.label(root, '阿禾已经摆好早餐。接着去各地看看，或挑战农场荣誉吧。', w / 2, 424, 16, SOFT, w - 16, 65);
    button('查看农场荣誉', w / 2, 472, w - 14, 44, () => go('honors'));
  }
}

export function areaStoryPanel(c: FeaturePanelContext, explore: () => void) {
  const { p, root, w, state: s, button, act } = c;
  const map = TRAVEL_MAPS.find(m => m.id === s.life.activeMap);
  if (!map) {
    p.label(root, '打开旅行手册，到了目的地再找当地居民。', w / 2, 70, 16, INK, w - 15, 65);
    return;
  }
  const story = AREA_STORIES[map.id], done = s.journey.stories.includes(map.id), copy = storyCopy(map.id, s.retention?.locale);
  p.contain(root, map.icon, w / 2, 62, 95, 95);
  p.label(root, copy.title, w / 2, 124, 23, INK, w, 39);
  p.label(root, copy.body, w / 2, 174, 15, SOFT, w - 24, 62);
  p.label(root, `${itemName(story.item, NAMES[story.item], s.retention?.locale)} ${Math.min(story.amount, s.inventory[story.item])}/${story.amount}`, w / 2, 228, 16, INK, w, 31);
  if (story.depth) {
    p.label(root, `已结算探索层数 ${Math.min(story.depth, s.advanced.explore.claimed[map.id] || 0)}/${story.depth}`, w / 2, 263, 14, SOFT, w, 31);
    if (!done) button('前往分层探索', w / 2, 355, w - 18, 39, explore, '#58bde4', '#3295bd', 14);
  }
  button(done ? '故事已完成' : `完成委托 · ${story.coins}金币`, w / 2, 308, w - 18, 42,
    () => act(() => finishStory(s, map.id)), done ? '#b6c8a0' : '#67ca70');
}

export function honorsPanel(c: FeaturePanelContext) {
  const { p, root, w, state: s, button, slot, act } = c;
  p.label(root, '晴野荣誉册', w / 2, 26, 23, INK, w, 38);
  HONORS.forEach((honor, i) => {
    const y = 119 + 129 * i, claimed = s.journey.honors.includes(honor.level), line = honorLine(honor.level, s.retention?.locale);
    slot(w / 2, y, w, 111);
    p.contain(root, 'study_star', 38, y - 8, 51);
    p.label(root, `${honor.level}级 · ${line.name}`, w / 2 + 25, y - 34, 18, INK, w - 125, 32);
    p.label(root, line.hint, w / 2 + 25, y, 13, SOFT, w - 110, 32);
    p.label(root, `${honor.coins}金币 · ${honor.stars}星`, w * .33, y + 34, 12, SOFT, w / 2, 25);
    button(claimed ? '已获荣誉' : '领取荣誉', w * .79, y + 33, w * .35, 32, () => act(() => claimHonor(s, honor.level)),
      honorReady(s, honor.level) ? '#67ca70' : '#cfbfa1', '#829c66', 13);
  });
}

export function carpenterPanel(c: FeaturePanelContext, lumber: () => void) {
  const { p, root, w, state: s, button, slot, act, live } = c;
  const job = s.activities.furniture;
  p.label(root, '木材厂 · 家具制作台', w / 2, 24, 22, INK, w, 38);
  p.label(root, '耗木板和棉布，45秒后领取。做好后直接收入家具箱。', w / 2, 61, 13, SOFT, w - 14, 40);
  if (job) {
    const label = p.label(root, '', w / 2, 102, 16, INK, w, 36);
    const update = () => {
      const remaining = Math.max(0, Math.ceil((job.readyAt - Date.now()) / 1000));
      label.string = FURNITURE.find(f => f.id === job.type)!.name + (remaining ? ` · 还需${remaining}秒` : ' · 可以领取');
    };
    update();
    live(update);
    button('领取制成家具', w / 2, 147, w - 14, 41, () => act(() => collectFurniture(s)));
  } else if (!s.life.factories.includes('lumber')) {
    button('前往木材厂', w / 2, 118, w - 14, 41, lumber, '#58bde4', '#3295bd', 14);
  }
  FURNITURE.forEach((f, i) => {
    const y = 205 + i * 67;
    slot(w / 2, y, w, 60);
    p.contain(root, f.id, 36, y, 49, 48);
    p.label(root, f.name, 145, y - 12, 15, INK, 160, 30, true, 'left');
    p.label(root, `${f.planks}木板 · ${f.cloth}棉布`, 145, y + 13, 13, SOFT, 160, 27, true, 'left');
    button('制作' + f.name, w - 86, y, 150, 36, () => act(() => startFurniture(s, f.id)), '#67ca70', '#3fa94d', 13);
  });
}

export function festivalGamesPanel(c: FeaturePanelContext, flowers: FlowerChoice[], choose: (i: number) => void) {
  const { p, root, w, state: s, button, slot, act } = c;
  const a = s.activities, season = seasonIndex(s), event = calendarEvent();
  slot(w / 2, 105, w, 191);
  p.contain(root, 'pumpkin', 56, 74, 76, 76);
  p.label(root, '秋日南瓜评选', w / 2 + 36, 40, 20, INK, w - 130, 38);
  p.label(root, '浇水、堆肥、秋季收获都能提高育成分。\n点两次生长中的南瓜浇水后，可追加堆肥。', w / 2 + 31, 82, 12, SOFT, w - 130, 58);
  p.label(root, `候选育成分 ${a.pumpkin || '—'} · 历史最高 ${a.pumpkinRecord || '—'}`, w / 2, 132, 14, INK, w, 30);
  button(a.pumpkinSeason === season ? '本季已参赛' : '送南瓜参赛', w / 2, 173, w - 20, 38, () => act(() => judgePumpkin(s)));
  slot(w / 2, 368, w, 306);
  p.label(root, '春日花艺赛', w / 2, 241, 20, INK, w, 36);
  const focal = FLOWER_PALETTE[Math.floor(season / 4) % FLOWER_PALETTE.length];
  p.label(root, `主花用${focal.name}加30分 · 两边对称加20分\n点花位切换花材。花材来自仓库，提交时扣除。`, w / 2, 286, 13, SOFT, w - 25, 51);
  flowers.forEach((id, i) => {
    const x = (i + .5) * w / 3, flower = FLOWER_PALETTE.find(f => f.id === id)!;
    p.contain(root, id, x, 341, 44);
    button(`${i === 1 ? '主花' : '侧花'} · ${flower.name}`, x, 388, w / 3 - 13, 35, () => choose(i), '#ab89d3', '#8360ac', 13);
    p.label(root, `库存 ${s.inventory[id]}`, x, 423, 12, SOFT, w / 3, 24);
  });
  p.label(root, `预计 ${flowerScore(flowers, Math.floor(season / 4))}分 · 历史最高 ${a.flowerRecord || '—'}`, w / 2, 457, 14, INK, w, 27);
  button(a.flowerSeason === season ? '本季已提交' : '提交花艺作品', w / 2, 493, w - 20, 38, () => act(() => submitFlowers(s, flowers)));
  slot(w / 2, 633, w, 194);
  p.label(root, event?.title || '现实日历活动', w / 2, 567, 20, INK, w, 38);
  p.label(root, event ? `本月准备${event.amount}份${NAMES[event.item]} · 可得${event.coins}金币与4星` : '每年4月、7月、10月、12月各有一场活动。', w / 2, 617, 14, SOFT, w - 15, 49);
  if (event) button(a.calendar.includes(event.key) ? '已完成本月活动' : '交付日历活动物资', w / 2, 679, w - 20, 38, () => act(() => claimCalendar(s)));
}

export function iceFishingPanel(c: FeaturePanelContext) {
  const { p, root, w, state: s, button, slot, act, live } = c;
  const round = s.activities.ice;
  p.label(root, '极光雪原 · 冰湖垂钓', w / 2, 22, 22, INK, w, 38);
  p.label(root, '在绿色区拉线，三次至少命中两次。三次全中会钓到金色锦鲤。', w / 2, 63, 13, SOFT, w - 12, 39);
  slot(w / 2, 139, w, 105);
  const status = p.label(root, '', w / 2, 113, 16, INK, w - 12, 32);
  const meter = p.g(root, 'IceTimingMeter');
  const draw = () => {
    const now = Date.now(), width = w - 48, left = 24, y = 154;
    meter.clear();
    p.path(meter, [[left, y - 7], [left + width, y - 7], [left + width, y + 7], [left, y + 7]], '#cfdeeb');
    if (!round) {
      status.string = `鱼饵 ${s.features.fishing.bait}份 · 可以抛竿`;
      return;
    }
    const time = iceWindow(round, now), at = (ms: number) => left + width * Math.max(0, Math.min(1, ms / ICE_ROUND_MS));
    p.path(meter, [[at(time.begin), y - 7], [at(time.end), y - 7], [at(time.end), y + 7], [at(time.begin), y + 7]], '#77c984');
    p.ellipse(meter, at(time.elapsed), y, 5, 13, '#574977');
    status.string = time.expired ? '鱼线松了，重新抛竿吧' : `第${round.attempt + 1}/3次拉线 · 已命中${round.hits}次`;
  };
  draw();
  live(draw);
  button('抛竿 · 1鱼饵', w / 4, 222, w / 2 - 12, 45, () => act(() => startIceFishing(s)), '#58bde4', '#3295bd', 15);
  button('拉线', w * .75, 222, w / 2 - 12, 45, () => act(() => pullIceLine(s)), '#67ca70', '#3fa94d', 16);
  button('补充鱼饵 · 30金币', w / 2, 282, w - 22, 36, () => act(() => buyBait(s)), '#ffb150', '#dc8a29', 13);
}

export function patrolPanel(c: FeaturePanelContext, back: () => void) {
  const { p, root, w, state: s, button, act } = c;
  p.label(root, '宠物巡院', w / 2, 25, 23, INK, w, 40);
  p.label(root, '带成年猫或狗沿院子找线索。发光的牌子会出现在农场里，点它就能查看。', w / 2, 83, 15, SOFT, w - 20, 78);
  p.contain(root, 'cat', w / 4, 158, 81);
  p.contain(root, 'dog', w * .75, 158, 81);
  button('带猫咪找田鼠', w / 4, 226, w / 2 - 12, 43, () => act(() => startPatrol(s, 'cat')));
  button('带小狗找货袋', w * .75, 226, w / 2 - 12, 43, () => act(() => startPatrol(s, 'dog')));
  if (s.activities.patrol) button('回农场找线索', w / 2, 290, w - 18, 43, back, '#58bde4', '#3295bd');
}
