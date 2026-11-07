import type { FarmState, ProductId, Result } from './FarmModel';
import { discover, farmLevel, rollDaily } from './FarmFeatures';
import { TRAVEL_MAPS, TravelId } from './FarmCatalog';

export const BREAKFAST_STEPS = [
  { title: '收下第一批小麦', hint: '回主农场，点击成熟的小麦。', icon: 'wheat' },
  { title: '到磨坊加工面粉', hint: '磨坊用 2 份小麦做 1 份面粉。记得领取成品。', icon: 'flour' },
  { title: '烤出第一炉面包', hint: '面包房可用 2 份面粉制作磨坊面包，也能用小麦和鸡蛋制作麦香面包。', icon: 'bread' },
  { title: '给阿禾送去面包', hint: '带 1 个面包交给阿禾，小镇会把早餐摆上桌。', icon: 'truck' },
  { title: '领走开垦补给', hint: '阿禾备好了 120 金币、3 农场星和 2 木板。', icon: 'study_star' },
] as const;

export const AREA_STORIES = {
  village: { title: '小镇的第一张餐桌', story: '阿禾打算在小镇广场支起一张早餐桌，想请你送来面包。', item: 'bread', amount: 2, depth: 0, reward: 'cloth', coins: 170 },
  forest: { title: '林间路标', story: '旧路标被风吹倒了。走完森林第一层，再带木材回来把路标立起来。', item: 'wood', amount: 3, depth: 1, reward: 'herb', coins: 220 },
  mine: { title: '矿灯重亮', story: '矿道尽头有盏坏掉的灯。走完矿山第二层，用铜矿修好它。', item: 'ore', amount: 3, depth: 2, reward: 'gem', coins: 320 },
  beach: { title: '码头的渔灯', story: '走完海滩第二层，再带鱼回到码头，一起吃一顿热乎乎的晚餐。', item: 'fish', amount: 3, depth: 2, reward: 'gem', coins: 420 },
  snow: { title: '极光守夜人', story: '走完雪原第三层，再给守夜人带去冰晶，换一把极光莓。', item: 'ice', amount: 3, depth: 3, reward: 'auroraBerry', coins: 620 },
} as const;

export const HONORS = [
  { level: 80, name: '雪原守望者', hint: '安全返程并完成雪原第12层', coins: 6000, stars: 20 },
  { level: 90, name: '家园工匠', hint: '小屋扩到10×10，并摆放至少10件家具', coins: 9000, stars: 30 },
  { level: 100, name: '晴野大使', hint: '完成全部5个地区故事，并领取前两项荣誉', coins: 15000, stars: 50 },
] as const;

const brewStock = (s: FarmState) => (['vinegar', 'sunTea', 'coffeeBrew', 'floralTea', 'berryTea'] as const).find(id => s.inventory[id] > 0);

export const TOWN_CHAPTERS = [
  {
    id: 'second-oven',
    title: '第二炉：小镇早餐铺',
    intro: '阿禾把餐桌留在广场，想把早餐铺成每天一炉。',
    steps: [
      { title: '再留一袋面粉', hint: '回磨坊，用小麦再磨一份面粉，留在仓库里。', icon: 'flour', blocked: '仓库里还没有面粉', ready: (s: FarmState) => s.inventory.flour >= 1, apply: (_s: FarmState) => {} },
      { title: '送出两份面包', hint: '面包房烤两份面包，交给早餐铺。', icon: 'bread', blocked: '需要2份面包', ready: (s: FarmState) => s.inventory.bread >= 2, apply: (s: FarmState) => { s.inventory.bread -= 2; s.coins += 90; s.xp += 18; } },
      { title: '领走铺面招牌', hint: '阿禾备好了招牌木板和一笔铺面金。', icon: 'signpost', blocked: '这一步还不能领取', ready: (_s: FarmState) => true, apply: (s: FarmState) => { s.coins += 160; s.stars += 2; s.inventory.planks += 1; discover(s, 'planks'); } },
    ],
  },
  {
    id: 'brew-kettle',
    title: '第三炉：酿造壶开张',
    intro: '酿造工坊支起了新壶，果醋、咖啡和花茶都能从这里出门。',
    steps: [
      { title: '建成酿造工坊', hint: '16级后到工匠小镇，花1000金币建设酿造工坊。', icon: 'grape', blocked: '先在工匠小镇建成酿造工坊', ready: (s: FarmState) => s.life.factories.includes('brewing'), apply: (s: FarmState) => { s.coins += 40; } },
      { title: '酿出第一壶饮品', hint: '用葡萄酿果醋，或用咖啡、油葵、薰衣草、极光莓做茶饮。', icon: 'vinegar', blocked: '先做出果醋、凉茶、手冲咖啡或花茶', ready: (s: FarmState) => !!brewStock(s), apply: (_s: FarmState) => {} },
      { title: '把一壶饮品送到茶会', hint: '从仓库交一壶酿造品，茶会会记在你的名下。', icon: 'floralTea', blocked: '仓库里没有可送的酿造品', ready: (s: FarmState) => !!brewStock(s), apply: (s: FarmState) => { const id = brewStock(s)!; s.inventory[id]--; s.coins += 220; s.stars += 2; s.xp += 24; } },
    ],
  },
  {
    id: 'four-seasons',
    title: '第四炉：四季供货',
    intro: '早餐铺站稳了，小镇开始按季节向农场订货。',
    steps: [
      { title: '完成一则地区故事', hint: '到森林、矿山、海滩或雪原，完成当地居民的委托。', icon: 'forestCamp', blocked: '先完成任意一个地区故事', ready: (s: FarmState) => s.journey.stories.length >= 1, apply: (_s: FarmState) => {} },
      { title: '备好香草和葡萄', hint: '带2份香草和2串葡萄，给供货单做样品。', icon: 'herb', blocked: '需要香草×2和葡萄×2', ready: (s: FarmState) => s.inventory.herb >= 2 && s.inventory.grape >= 2, apply: (s: FarmState) => { s.inventory.herb -= 2; s.inventory.grape -= 2; s.xp += 15; } },
      { title: '接下常驻委托', hint: '供货板开了，交完这一轮还会有下一轮。', icon: 'truck', blocked: '供货板还没打开', ready: (_s: FarmState) => true, apply: (s: FarmState) => { s.coins += 300; s.stars += 3; } },
    ],
  },
] as const;

export const COMMISSIONS: { id: string; title: string; needs: Partial<Record<ProductId, number>>; coins: number; xp: number }[] = [
  { id: 'loaf', title: '加炉面包', needs: { bread: 2 }, coins: 160, xp: 18 },
  { id: 'vinegar-cup', title: '果醋小杯', needs: { vinegar: 1 }, coins: 280, xp: 24 },
  { id: 'sun-tea', title: '葵花凉茶', needs: { sunTea: 1 }, coins: 320, xp: 26 },
  { id: 'coffee', title: '午后手冲', needs: { coffeeBrew: 1 }, coins: 420, xp: 30 },
  { id: 'floral', title: '花茶待客', needs: { floralTea: 1, herb: 1 }, coins: 520, xp: 34 },
  { id: 'berry', title: '极光暖茶', needs: { berryTea: 1 }, coins: 680, xp: 40 },
  { id: 'breakfast-set', title: '节日早餐组', needs: { bread: 1, coffeeBrew: 1, floralTea: 1 }, coins: 960, xp: 52 },
  { id: 'cellar', title: '酒窖盘点', needs: { vinegar: 2, grapeJuice: 1 }, coins: 1100, xp: 55 },
];

export const EXPLORE_QUESTS: { id: string; map: TravelId; title: string; story: string; depth: number; seen: 'fox' | 'vein' | 'shell' | 'flare' | 'puzzle'; item: ProductId; amount: number; reward: ProductId; coins: number }[] = [
  { id: 'forest-fox', map: 'forest', title: '送走林狐', story: '在第3层处理过林狐，再带回1份香草给护林人。', depth: 3, seen: 'fox', item: 'herb', amount: 1, reward: 'gem', coins: 240 },
  { id: 'forest-lamps', map: 'forest', title: '林灯谜底', story: '解开第4层林灯，并用2份木材修好路牌。', depth: 4, seen: 'puzzle', item: 'wood', amount: 2, reward: 'planks', coins: 280 },
  { id: 'forest-heart', map: 'forest', title: '林心回信', story: '走到第8层并再解一次谜题，留下1颗宝石。', depth: 8, seen: 'puzzle', item: 'gem', amount: 1, reward: 'cloth', coins: 420 },
  { id: 'mine-vein', map: 'mine', title: '撑住晶脉', story: '在第3层处理晶脉裂缝，再交2份铜矿。', depth: 3, seen: 'vein', item: 'ore', amount: 2, reward: 'coal', coins: 320 },
  { id: 'mine-cart', map: 'mine', title: '矿车谜题', story: '解开第4层矿车配重，用1块木板加固轨道。', depth: 4, seen: 'puzzle', item: 'planks', amount: 1, reward: 'gem', coins: 360 },
  { id: 'beach-shell', map: 'beach', title: '归还海贝', story: '在第3层处理搁浅海贝，再留下2条鱼。', depth: 3, seen: 'shell', item: 'fish', amount: 2, reward: 'gem', coins: 380 },
  { id: 'beach-tide', map: 'beach', title: '夜潮谜题', story: '走到第8层解开潮汐贝壳，带1份木材做标记。', depth: 8, seen: 'puzzle', item: 'wood', amount: 1, reward: 'cloth', coins: 460 },
  { id: 'snow-flare', map: 'snow', title: '稳住极光', story: '在第3层处理极光裂隙，交2份冰晶。', depth: 3, seen: 'flare', item: 'ice', amount: 2, reward: 'auroraBerry', coins: 520 },
  { id: 'snow-heart', map: 'snow', title: '极光之心', story: '走到第12层解开冰晶谜题，献上1颗宝石。', depth: 12, seen: 'puzzle', item: 'gem', amount: 1, reward: 'estateBox', coins: 880 },
];

export interface Journey {
  breakfast: number;
  stories: TravelId[];
  honors: number[];
  chapter: number;
  step: number;
  commission: number;
  quests: string[];
}

export function newJourney(s?: FarmState): Journey {
  let breakfast = 0;
  if (s && (s.features.album.counts.wheat || s.stats.harvests)) {
    breakfast = 1;
    if (s.features.album.counts.flour) {
      breakfast = 2;
      if (s.features.album.counts.bread) breakfast = s.stats.deliveries ? 4 : 3;
    }
  }
  return { breakfast, stories: [], honors: [], chapter: 0, step: 0, commission: 0, quests: [] };
}

export function migrateJourney(j: Journey) {
  if (!Number.isInteger(j.chapter)) j.chapter = 0;
  if (!Number.isInteger(j.step)) j.step = 0;
  if (!Number.isInteger(j.commission)) j.commission = 0;
  if (!Array.isArray(j.quests)) j.quests = [];
}

export function validJourney(j: Journey): boolean {
  return !!j && Number.isInteger(j.breakfast) && j.breakfast >= 0 && j.breakfast <= BREAKFAST_STEPS.length
    && Array.isArray(j.stories) && new Set(j.stories).size === j.stories.length
    && j.stories.every(id => TRAVEL_MAPS.some(m => m.id === id))
    && Array.isArray(j.honors) && new Set(j.honors).size === j.honors.length
    && j.honors.every(level => HONORS.some(h => h.level === level))
    && (!j.honors.includes(100) || j.honors.includes(80) && j.honors.includes(90))
    && Number.isInteger(j.chapter) && j.chapter >= 0 && j.chapter <= TOWN_CHAPTERS.length
    && Number.isInteger(j.step) && j.step >= 0 && j.step < (j.chapter >= TOWN_CHAPTERS.length ? 1 : TOWN_CHAPTERS[j.chapter].steps.length)
    && Number.isInteger(j.commission) && j.commission >= 0 && j.commission <= 100000
    && Array.isArray(j.quests) && new Set(j.quests).size === j.quests.length
    && j.quests.every(id => EXPLORE_QUESTS.some(q => q.id === id))
    && ['forest', 'mine', 'beach', 'snow'].every(map => {
      const chain = EXPLORE_QUESTS.filter(q => q.map === map).map(q => j.quests.includes(q.id));
      return chain.every((done, index) => !done || chain.slice(0, index).every(Boolean));
    });
}

export function breakfastReady(s: FarmState): boolean {
  const seen = s.features.album.counts;
  switch (s.journey.breakfast) {
    case 0: return (seen.wheat || 0) >= 1;
    case 1: return (seen.flour || 0) >= 1;
    case 2: return (seen.bread || 0) >= 1;
    case 3: return s.inventory.bread >= 1;
    case 4: return true;
    default: return false;
  }
}

export function advanceBreakfast(s: FarmState): Result {
  if (!breakfastReady(s)) return { ok: false, message: '先完成当前目标' };
  if (s.journey.breakfast === 3) {
    rollDaily(s);
    s.inventory.bread--;
    s.coins += 60;
    s.xp += 15;
    s.stats.deliveries++;
  }
  if (s.journey.breakfast === 4) {
    s.coins += 120;
    s.stars += 3;
    s.inventory.planks += 2;
    discover(s, 'planks', 2);
  }
  s.journey.breakfast++;
  return { ok: true, message: s.journey.breakfast === 5 ? '第一炉面包完成 · 补给已入库' : '主线推进 · 下一步已开启' };
}

export function advanceTown(s: FarmState): Result {
  if (s.journey.breakfast < BREAKFAST_STEPS.length) return { ok: false, message: '先完成第一炉面包' };
  const chapter = TOWN_CHAPTERS[s.journey.chapter];
  if (!chapter) return { ok: false, message: '主线章节已完成，去交付小镇委托' };
  const step = chapter.steps[s.journey.step];
  if (!step.ready(s)) return { ok: false, message: step.blocked };
  step.apply(s);
  s.journey.step++;
  const finished = s.journey.step >= chapter.steps.length;
  if (finished) {
    s.journey.chapter++;
    s.journey.step = 0;
  }
  return { ok: true, message: finished ? `${chapter.title}完成` : '主线推进 · 下一步已开启' };
}

export const currentCommission = (s: FarmState) => COMMISSIONS[s.journey.commission % COMMISSIONS.length];
export const commissionLap = (s: FarmState) => Math.floor(s.journey.commission / COMMISSIONS.length);

export function turnInCommission(s: FarmState): Result {
  if (s.journey.breakfast < BREAKFAST_STEPS.length) return { ok: false, message: '先完成第一炉面包' };
  if (s.journey.chapter < TOWN_CHAPTERS.length) return { ok: false, message: '先把后续章节做完，委托板才会敞开' };
  const job = currentCommission(s);
  const needs = Object.entries(job.needs) as [ProductId, number][];
  if (needs.some(([id, n]) => s.inventory[id] < n)) return { ok: false, message: '委托材料还没备齐' };
  for (const [id, n] of needs) s.inventory[id] -= n;
  const lap = commissionLap(s);
  const coins = job.coins + Math.min(lap, 5) * 30;
  s.coins += coins;
  s.xp += job.xp;
  s.journey.commission++;
  if (s.journey.commission % COMMISSIONS.length === 0) s.stars += 2;
  return { ok: true, message: `${job.title}送达 · ${coins}金币 · 第${lap + 1}轮` };
}

export const mapQuests = (map: TravelId) => EXPLORE_QUESTS.filter(q => q.map === map);
export const nextExploreQuest = (s: FarmState, map: TravelId) => mapQuests(map).find(q => !s.journey.quests.includes(q.id));

export function finishExploreQuest(s: FarmState, id: string): Result {
  const quest = EXPLORE_QUESTS.find(q => q.id === id);
  if (!quest || s.life.activeMap !== quest.map || !s.life.maps.includes(quest.map)) return { ok: false, message: '请到当地再交这则探索故事' };
  if (s.journey.quests.includes(quest.id)) return { ok: false, message: '这则探索故事已经完成' };
  const earlier = mapQuests(quest.map).filter(q => EXPLORE_QUESTS.indexOf(q) < EXPLORE_QUESTS.indexOf(quest));
  if (earlier.some(q => !s.journey.quests.includes(q.id))) return { ok: false, message: '先完成上一则探索故事' };
  if ((s.advanced.explore.claimed[quest.map] || 0) < quest.depth) return { ok: false, message: `先安全返程并完成第${quest.depth}层` };
  if (!(s.advanced.explore.seen[quest.map] || []).includes(quest.seen)) return { ok: false, message: '先在分层探索里遇到这一幕' };
  if (s.inventory[quest.item] < quest.amount) return { ok: false, message: '故事材料还没备齐' };
  s.inventory[quest.item] -= quest.amount;
  s.inventory[quest.reward]++;
  discover(s, quest.reward);
  s.coins += quest.coins;
  s.stars += 2;
  s.journey.quests.push(quest.id);
  return { ok: true, message: `${quest.title}完成 · ${quest.coins}金币和2农场星` };
}

export function finishStory(s: FarmState, id: TravelId): Result {
  const story = AREA_STORIES[id];
  if (!story || s.life.activeMap !== id || !s.life.maps.includes(id)) return { ok: false, message: '请到当地与居民交谈' };
  if (s.journey.stories.includes(id)) return { ok: false, message: '这个故事已经完成' };
  if ((s.advanced.explore.claimed[id] || 0) < story.depth || s.inventory[story.item] < story.amount) {
    return { ok: false, message: '请准备材料，并完成所需探索后安全返程' };
  }
  s.inventory[story.item] -= story.amount;
  s.inventory[story.reward]++;
  discover(s, story.reward);
  s.coins += story.coins;
  s.stars += 2;
  s.journey.stories.push(id);
  return { ok: true, message: `${story.title}完成 · 获得${story.coins}金币和2农场星` };
}

export function honorReady(s: FarmState, level: number): boolean {
  if (farmLevel(s.xp) < level || s.journey.honors.includes(level)) return false;
  if (level === 80) return (s.advanced.explore.claimed.snow || 0) >= 12;
  if (level === 90) return s.advanced.room.size === 10 && s.advanced.room.items.filter(item => item.x !== null).length >= 10;
  return level === 100 && s.journey.stories.length === 5 && [80, 90].every(n => s.journey.honors.includes(n));
}

export function claimHonor(s: FarmState, level: number): Result {
  const honor = HONORS.find(h => h.level === level);
  if (!honor || !honorReady(s, level)) return { ok: false, message: '这项荣誉未达成或已领取' };
  s.journey.honors.push(level);
  s.coins += honor.coins;
  s.stars += honor.stars;
  return { ok: true, message: `获得荣誉 · ${honor.name}` };
}
