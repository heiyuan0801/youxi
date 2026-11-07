import type { FarmState, Result } from './FarmModel';
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

export interface Journey {
  breakfast: number;
  stories: TravelId[];
  honors: number[];
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
  return { breakfast, stories: [], honors: [] };
}

export function validJourney(j: Journey): boolean {
  return !!j && Number.isInteger(j.breakfast) && j.breakfast >= 0 && j.breakfast <= BREAKFAST_STEPS.length
    && Array.isArray(j.stories) && new Set(j.stories).size === j.stories.length
    && j.stories.every(id => TRAVEL_MAPS.some(m => m.id === id))
    && Array.isArray(j.honors) && new Set(j.honors).size === j.honors.length
    && j.honors.every(level => HONORS.some(h => h.level === level))
    && (!j.honors.includes(100) || j.honors.includes(80) && j.honors.includes(90));
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
