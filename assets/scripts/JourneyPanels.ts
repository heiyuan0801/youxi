import type { FeaturePanelContext } from './FeaturePanels';
import { FURNITURE, TRAVEL_MAPS, animalSpec } from './FarmCatalog';
import { NAMES, ProductId } from './FarmModel';
import { seasonIndex } from './FarmLife';
import { AREA_STORIES, BREAKFAST_STEPS, COMMISSIONS, HONORS, TOWN_CHAPTERS, advanceBreakfast, advanceTown, breakfastReady, claimHonor, commissionLap, currentCommission, finishStory, honorReady, turnInCommission } from './FarmJourney';
import { FLOWER_PALETTE, FlowerChoice, ICE_ROUND_MS, RACE_MS, SUMMER_LIMIT_MS, calendarEvent, claimCalendar, flowerScore, iceWindow, judgePumpkin, jumpRace, pullIceLine, pullSummerLine, raceWindow, startIceFishing, startPatrol, startRace, startSummerContest, submitFlowers, summerWindow } from './FarmActivities';
import { collectFurniture, startFurniture } from './FarmRoom';
import { buyBait } from './FarmFeatures';

const INK = '#5a3e2b';
const SOFT = '#997455';

export function breakfastPanel(c: FeaturePanelContext, go: (target: 'farm' | 'mill' | 'bakery' | 'honors') => void) {
  const { p, root, w, state: s, button, slot, act } = c;
  const step = s.journey.breakfast;
  p.label(root, '第一炉面包', w / 2, 24, 23, INK, w, 38);
  p.label(root, '跟着阿禾学做面包，把新鲜早餐送到小镇。', w / 2, 62, 14, SOFT, w, 32);
  BREAKFAST_STEPS.forEach((goal, i) => {
    const y = 117 + i * 55;
    slot(w / 2, y, w, 50);
    p.contain(root, goal.icon, 28, y, 34);
    p.label(root, goal.title, w / 2 - 33, y, 15, INK, w - 188, 30, true, 'left');
    p.label(root, i < step ? '已完成' : i === step ? '当前目标' : '未开启', w - 60, y, 13, i === step ? '#42985c' : SOFT, 100, 30);
  });
  if (step < BREAKFAST_STEPS.length) {
    p.label(root, BREAKFAST_STEPS[step].hint, w / 2, 408, 15, SOFT, w - 14, 58);
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

export function townPanel(c: FeaturePanelContext, honors: () => void, breakfast: () => void) {
  const { p, root, w, state: s, button, slot, act } = c;
  if (s.journey.breakfast < BREAKFAST_STEPS.length) {
    p.label(root, '第一炉面包还没烤完。', w / 2, 80, 18, INK, w - 20, 40);
    p.label(root, '跟着阿禾做完早餐，小镇才会把后面的章节交给你。', w / 2, 130, 14, SOFT, w - 24, 50);
    button('回到第一炉面包', w / 2, 200, w - 18, 44, breakfast);
    return;
  }
  const chapter = TOWN_CHAPTERS[s.journey.chapter];
  if (chapter) {
    const step = chapter.steps[s.journey.step];
    p.label(root, chapter.title, w / 2, 24, 22, INK, w, 36);
    p.label(root, chapter.intro, w / 2, 64, 14, SOFT, w - 16, 44);
    chapter.steps.forEach((goal, i) => {
      const y = 130 + i * 58;
      slot(w / 2, y, w, 52);
      p.contain(root, goal.icon, 28, y, 34);
      p.label(root, goal.title, w / 2 - 20, y, 15, INK, w - 180, 30, true, 'left');
      p.label(root, i < s.journey.step ? '已完成' : i === s.journey.step ? '当前目标' : '未开启', w - 58, y, 13, i === s.journey.step ? '#42985c' : SOFT, 96, 28);
    });
    p.label(root, step.hint, w / 2, 318, 15, SOFT, w - 16, 58);
    button(step.ready(s) ? '完成这一步' : step.blocked, w / 2, 390, w - 16, 44, () => act(() => advanceTown(s)), step.ready(s) ? '#67ca70' : '#cfbfa1');
    button('查看晴野荣誉', w / 2, 448, w - 16, 40, honors, '#ffb150', '#dc8a29', 14);
    return;
  }
  const job = currentCommission(s), lap = commissionLap(s);
  const needs = Object.entries(job.needs) as [ProductId, number][];
  const ready = needs.every(([id, n]) => s.inventory[id] >= n);
  p.label(root, '小镇常驻委托', w / 2, 24, 22, INK, w, 36);
  p.label(root, `第${lap + 1}轮 · 交完8单会再开一轮，金币会略微提高。`, w / 2, 62, 13, SOFT, w - 16, 36);
  slot(w / 2, 168, w, 150);
  p.label(root, job.title, w / 2, 118, 20, INK, w - 20, 34);
  p.label(root, needs.map(([id, n]) => `${NAMES[id]} ${Math.min(s.inventory[id], n)}/${n}`).join('  ·  '), w / 2, 160, 15, INK, w - 24, 36);
  p.label(root, `${job.coins + Math.min(lap, 5) * 30}金币 · 经验${job.xp}`, w / 2, 198, 14, SOFT, w, 28);
  button(ready ? '交付委托' : '材料还没备齐', w / 2, 268, w - 16, 44, () => act(() => turnInCommission(s)), ready ? '#67ca70' : '#cfbfa1');
  p.label(root, `已完成 ${s.journey.commission} 单 · 下一单是${COMMISSIONS[(s.journey.commission + 1) % COMMISSIONS.length].title}`, w / 2, 322, 13, SOFT, w - 16, 36);
  button('查看晴野荣誉', w / 2, 378, w - 16, 40, honors, '#ffb150', '#dc8a29', 14);
}

export function areaStoryPanel(c: FeaturePanelContext, explore: () => void) {
  const { p, root, w, state: s, button, act } = c;
  const map = TRAVEL_MAPS.find(m => m.id === s.life.activeMap);
  if (!map) {
    p.label(root, '打开旅行手册，到了目的地再找当地居民。', w / 2, 70, 16, INK, w - 15, 65);
    return;
  }
  const story = AREA_STORIES[map.id], done = s.journey.stories.includes(map.id);
  p.contain(root, map.icon, w / 2, 62, 95, 95);
  p.label(root, story.title, w / 2, 124, 23, INK, w, 39);
  p.label(root, story.story, w / 2, 174, 15, SOFT, w - 24, 62);
  p.label(root, `${NAMES[story.item]} ${Math.min(story.amount, s.inventory[story.item])}/${story.amount}`, w / 2, 228, 16, INK, w, 31);
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
    const y = 119 + 129 * i, claimed = s.journey.honors.includes(honor.level);
    slot(w / 2, y, w, 111);
    p.contain(root, 'study_star', 38, y - 8, 51);
    p.label(root, `${honor.level}级 · ${honor.name}`, w / 2 + 25, y - 34, 18, INK, w - 125, 32);
    p.label(root, honor.hint, w / 2 + 25, y, 13, SOFT, w - 110, 32);
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

export function racePanel(c: FeaturePanelContext) {
  const { p, root, w, state: s, button, slot, act, live } = c;
  const round = s.activities.race;
  p.label(root, '障碍赛', w / 2, 22, 22, INK, w, 36);
  p.label(root, '四道障碍，指针进入绿色区时起跳。命中至少3次完赛。失败20秒后可再跑，成功后本季结算一次。', w / 2, 68, 13, SOFT, w - 16, 48);
  slot(w / 2, 168, w, 120);
  const status = p.label(root, '', w / 2, 132, 15, INK, w - 16, 32);
  const meter = p.g(root, 'RaceMeter');
  const draw = () => {
    const now = Date.now(), width = w - 48, left = 24, y = 176;
    meter.clear();
    p.path(meter, [[left, y - 8], [left + width, y - 8], [left + width, y + 8], [left, y + 8]], '#efe2cf');
    if (!round) {
      status.string = s.activities.raceSeason === seasonIndex(s) ? '本季已经完赛' : '选择一位成年伙伴起跑';
      return;
    }
    const time = raceWindow(round, now), at = (ms: number) => left + width * Math.max(0, Math.min(1, ms / RACE_MS));
    p.path(meter, [[at(time.begin), y - 8], [at(time.end), y - 8], [at(time.end), y + 8], [at(time.begin), y + 8]], '#77c984');
    p.ellipse(meter, at(time.elapsed), y, 5, 14, '#574977');
    const pet = s.animals.find(a => a.id === round.animalId);
    status.string = `${pet ? animalSpec(pet.type).name : '伙伴'} · 第${round.gate + 1}/4道 · 命中${round.hits}`;
  };
  draw();
  live(draw);
  button('起跳', w / 2, 250, w - 20, 44, () => act(() => jumpRace(s)), '#67ca70', '#3fa84d', 16);
  if (!round) s.animals.forEach((a, i) => {
    const y = 320 + i * 52;
    slot(w / 2, y, w, 46);
    p.contain(root, animalSpec(a.type).sprite, 28, y, 36);
    p.label(root, `${animalSpec(a.type).name} #${a.id}`, 150, y, 15, INK, 180, 28, true, 'left');
    button('带它起跑', w - 78, y, 130, 34, () => act(() => startRace(s, a.id)), '#ab89d3', '#8360ac', 13);
  });
}

export function summerFishingPanel(c: FeaturePanelContext) {
  const { p, root, w, state: s, button, slot, act, live } = c;
  const round = s.activities.summer;
  p.label(root, '夏日限时渔赛', w / 2, 22, 22, INK, w, 36);
  p.label(root, '夏季、主农场或海滩。40秒、最多3次收竿，绿色区才算钓到。钓满3条可领季节奖励。', w / 2, 66, 13, SOFT, w - 14, 46);
  slot(w / 2, 168, w, 118);
  const status = p.label(root, '', w / 2, 132, 15, INK, w - 16, 30);
  const meter = p.g(root, 'SummerMeter');
  const draw = () => {
    const now = Date.now(), width = w - 48, left = 24, y = 176;
    meter.clear();
    p.path(meter, [[left, y - 8], [left + width, y - 8], [left + width, y + 8], [left, y + 8]], '#d5ebf5');
    if (!round) {
      status.string = `鱼饵 ${s.features.fishing.bait} · 本季渔赛 ${s.activities.summerScore} 条`;
      return;
    }
    const time = summerWindow(round, now), at = (ms: number) => left + width * Math.max(0, Math.min(1, ms / 6500));
    p.path(meter, [[at(time.begin), y - 8], [at(time.end), y - 8], [at(time.end), y + 8], [at(time.begin), y + 8]], '#77c984');
    p.ellipse(meter, at(Math.min(time.elapsed, 6500)), y, 5, 14, '#574977');
    status.string = `剩余${Math.ceil(time.roundLeft / 1000)}秒 · 第${round.attempt + 1}/${3}次 · 已钓${round.hits}条`;
  };
  draw();
  live(draw);
  button('开始 · 1鱼饵', w / 4, 258, w / 2 - 12, 44, () => act(() => startSummerContest(s)), '#58bde4', '#3295bd', 14);
  button('收竿', w * .75, 258, w / 2 - 12, 44, () => act(() => pullSummerLine(s)), '#67ca70', '#3fa84d', 16);
  p.label(root, `赛时 ${SUMMER_LIMIT_MS / 1000} 秒 · 鱼会进入仓库，并计入夏日渔赛`, w / 2, 312, 12, SOFT, w - 12, 32);
}
