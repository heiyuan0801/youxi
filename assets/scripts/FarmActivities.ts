import type { FarmState, Plot, ProductId, Result } from './FarmModel';
import { discover, farmLevel, refreshFeatures, rollDaily } from './FarmFeatures';
import { isAdult, seasonIndex, weatherAt } from './FarmLife';
import { FURNITURE, FurnitureId } from './FarmCatalog';
import { noteFestivalPlay, noteFestivalScore } from './FarmRetention';

export type PatrolKind = 'cat' | 'dog';
export const PATROL_SPOTS = [
  { x: 7.5, y: 13.5, name: '谷仓边', icon: 'hay' },
  { x: 13.5, y: 6.2, name: '小路口', icon: 'signpost' },
  { x: 17.5, y: 12.8, name: '花丛旁', icon: 'bush' },
] as const;

interface IceRound {
  serial: number;
  attempt: number;
  hits: number;
  startedAt: number;
}

export interface FarmActivities {
  pumpkin: number;
  pumpkinRecord: number;
  pumpkinSeason: number;
  flowerRecord: number;
  flowerSeason: number;
  ice: IceRound | null;
  iceSerial: number;
  patrol: { kind: PatrolKind; spot: number; tried: number[] } | null;
  patrolAt: Record<PatrolKind, number>;
  patrolCount: number;
  stormSeason: number;
  stormPlot: number | null;
  calendar: string[];
  reserve: number;
  furniture: { type: FurnitureId; readyAt: number } | null;
}

export function newActivities(): FarmActivities {
  return {
    pumpkin: 0, pumpkinRecord: 0, pumpkinSeason: -1, flowerRecord: 0, flowerSeason: -1,
    ice: null, iceSerial: 0, patrol: null, patrolAt: { cat: 0, dog: 0 }, patrolCount: 0,
    stormSeason: -1, stormPlot: null, calendar: [], reserve: 0, furniture: null,
  };
}

export function validActivities(a: FarmActivities, plots: Plot[]): boolean {
  const int = (n: number, min = 0, max = 1e9) => Number.isSafeInteger(n) && n >= min && n <= max;
  const time = (n: number) => Number.isFinite(n) && n >= 0 && n <= 1e15;
  return !!a && int(a.pumpkin, 0, 150) && int(a.pumpkinRecord, 0, 150)
    && int(a.flowerRecord, 0, 150) && int(a.pumpkinSeason, -1) && int(a.flowerSeason, -1)
    && int(a.iceSerial) && (a.ice === null || !!a.ice && a.ice.serial === a.iceSerial
      && int(a.ice.serial, 1) && int(a.ice.attempt, 0, 2) && int(a.ice.hits, 0, a.ice.attempt) && time(a.ice.startedAt))
    && !!a.patrolAt && time(a.patrolAt.cat) && time(a.patrolAt.dog) && int(a.patrolCount)
    && (a.patrol === null || !!a.patrol && ['cat', 'dog'].includes(a.patrol.kind)
      && int(a.patrol.spot, 0, PATROL_SPOTS.length - 1) && Array.isArray(a.patrol.tried)
      && new Set(a.patrol.tried).size === a.patrol.tried.length
      && a.patrol.tried.every(i => int(i, 0, PATROL_SPOTS.length - 1) && i !== a.patrol!.spot))
    && int(a.stormSeason, -1) && (a.stormPlot === null || int(a.stormPlot, 0, plots.length - 1) && plots[a.stormPlot].unlocked && !plots[a.stormPlot].crop)
    && Array.isArray(a.calendar) && new Set(a.calendar).size === a.calendar.length && a.calendar.length <= 128
    && a.calendar.every(key => typeof key === 'string' && /^\d{4}-(spring|summer|autumn|winter)$/.test(key))
    && [0, 5, 10, 20].includes(a.reserve)
    && (a.furniture === null || !!a.furniture && FURNITURE.some(f => f.id === a.furniture!.type) && time(a.furniture.readyAt));
}

const fail = (message: string): Result => ({ ok: false, message });
const ok = (message: string): Result => ({ ok: true, message });

export function compostPumpkin(s: FarmState, index: number, now = Date.now()): Result {
  const plot = s.plots[index];
  if (!plot || (plot.crop !== 'pumpkin' && plot.crop !== 'goldenPumpkin')) return fail('请选择还在地里的南瓜');
  if (plot.composted || s.inventory.feed < 1) return fail(plot.composted ? '已经追加过堆肥' : '堆肥需要1份饲料');
  if (now >= plot.plantedAt + (plot.growSeconds || 360) * 1000) return fail('请给还在生长的南瓜施肥');
  s.inventory.feed--;
  plot.composted = true;
  return ok('已追加堆肥 · 南瓜评选育成分提高');
}

export function recordPumpkin(s: FarmState, plot: Plot, now: number) {
  if (plot.crop !== 'pumpkin' && plot.crop !== 'goldenPumpkin') return;
  const score = 40 + (plot.watered ? 25 : 0) + (plot.composted ? 35 : 0)
    + (plot.crop === 'goldenPumpkin' ? 25 : 0) + (seasonIndex(s, now) % 4 === 2 ? 10 : 0);
  s.activities.pumpkin = Math.max(s.activities.pumpkin, score);
}

export function judgePumpkin(s: FarmState, now = Date.now()): Result {
  const a = s.activities, season = seasonIndex(s, now);
  if (season % 4 !== 2) return fail('秋季开放南瓜评选，平时可以先培育南瓜');
  if (a.pumpkinSeason === season) return fail('本季已经参赛');
  const item = s.inventory.pumpkin > 0 ? 'pumpkin' : 'goldenPumpkin';
  if (!a.pumpkin || !s.inventory[item]) return fail('请先收获南瓜，并保留一份参赛');
  const score = a.pumpkin, tier = score >= 105 ? 3 : score >= 70 ? 2 : 1;
  s.inventory[item]--;
  a.pumpkinSeason = season;
  a.pumpkinRecord = Math.max(a.pumpkinRecord, score);
  a.pumpkin = 0;
  s.coins += tier * 180;
  s.stars += tier * 2;
  noteFestivalScore(s, 'pumpkin', score, now);
  return ok(`南瓜评选 · ${score}分 · ${tier * 180}金币和${tier * 2}农场星`);
}

export const FLOWER_PALETTE = [
  { id: 'herb', color: '绿', name: '香草' },
  { id: 'lavender', color: '紫', name: '薰衣草' },
  { id: 'sunflowerCrop', color: '黄', name: '油葵' },
  { id: 'strawberry', color: '红', name: '草莓枝' },
] as const;
export type FlowerChoice = typeof FLOWER_PALETTE[number]['id'];

export function flowerScore(choices: readonly FlowerChoice[], season: number): number {
  const focal = FLOWER_PALETTE[season % FLOWER_PALETTE.length].id;
  return 30 + new Set(choices).size * 15 + (choices[1] === focal ? 30 : 0)
    + (choices[0] === choices[2] && choices[0] !== choices[1] ? 20 : 0);
}

export function submitFlowers(s: FarmState, choices: readonly FlowerChoice[], now = Date.now()): Result {
  const season = seasonIndex(s, now), a = s.activities;
  if (season % 4 !== 0) return fail('春季才开放花艺比赛');
  if (a.flowerSeason === season) return fail('本季已经交过花艺作品');
  if (choices.length !== 3 || !choices.every(id => FLOWER_PALETTE.some(f => f.id === id))) return fail('请先选好三个花位');
  for (const id of choices) if (s.inventory[id] < choices.filter(x => x === id).length) return fail('仓库里的花材不够');
  const score = flowerScore(choices, Math.floor(season / 4));
  for (const id of choices) s.inventory[id]--;
  a.flowerSeason = season;
  a.flowerRecord = Math.max(a.flowerRecord, score);
  s.coins += score * 3;
  s.stars += score >= 100 ? 4 : 2;
  noteFestivalScore(s, 'flower', score, now);
  return ok(`花艺作品获${score}分 · ${score * 3}金币已入账`);
}

export const ICE_ROUND_MS = 5500;
export function iceWindow(round: IceRound, now: number) {
  const elapsed = now - round.startedAt;
  const begin = 900 + ((round.serial * 137 + round.attempt * 281) % 550);
  const end = begin + 1250 - round.attempt * 100;
  return { elapsed, begin, end, expired: elapsed > ICE_ROUND_MS };
}

export function startIceFishing(s: FarmState, now = Date.now()): Result {
  if (s.life.activeMap !== 'snow' || !s.life.maps.includes('snow')) return fail('先前往极光雪原的冰湖');
  if (s.activities.ice && !iceWindow(s.activities.ice, now).expired) return fail('这一竿还没收完');
  refreshFeatures(s, now);
  if (s.features.fishing.bait < 1) return fail('鱼饵不足，可到钓鱼面板购买');
  s.features.fishing.bait--;
  s.activities.ice = { serial: ++s.activities.iceSerial, attempt: 0, hits: 0, startedAt: now };
  return ok('冰湖抛竿 · 指针进入绿色区时拉线');
}

export function pullIceLine(s: FarmState, now = Date.now()): Result {
  const a = s.activities, round = a.ice;
  if (s.life.activeMap !== 'snow' || !round) return fail('请先在冰湖抛竿');
  const timing = iceWindow(round, now);
  if (timing.expired) {
    a.ice = null;
    return ok('鱼线松了，鱼已经游走');
  }
  if (timing.elapsed >= timing.begin && timing.elapsed <= timing.end) round.hits++;
  round.attempt++;
  if (round.attempt < 3) {
    round.startedAt = now;
    return ok(`第${round.attempt}次拉线完成 · 已命中${round.hits}次`);
  }
  a.ice = null;
  if (round.hits < 2) return ok('命中不足2次，鱼游走啦');
  const item: ProductId = round.hits === 3 ? 'goldenFish' : 'fish';
  rollDaily(s, now);
  s.inventory[item]++;
  s.features.stats.catches++;
  s.xp += round.hits === 3 ? 20 : 10;
  discover(s, item);
  noteFestivalPlay(s, now);
  return { ok: true, item, message: round.hits === 3 ? '三次拉线全中 · 钓到金色锦鲤' : '冰钓成功 · 溪流鱼已入库' };
}

export function startPatrol(s: FarmState, kind: PatrolKind, now = Date.now()): Result {
  const a = s.activities;
  if (s.life.activeMap !== 'home' || !s.animals.some(pet => pet.type === kind && isAdult(s, pet, now))) {
    return fail('需要一位已成年的宠物伙伴，并回到主农场');
  }
  if (a.patrol) return fail('先找完当前巡院线索');
  if (now < a.patrolAt[kind]) return fail(`伙伴还要休息${Math.ceil((a.patrolAt[kind] - now) / 1000)}秒`);
  a.patrol = { kind, spot: a.patrolCount++ % PATROL_SPOTS.length, tried: [] };
  a.patrolAt[kind] = now + 300000;
  return ok('巡院开始 · 到农场里找发光的线索牌');
}

export function searchPatrol(s: FarmState, spot: number): Result {
  const patrol = s.activities.patrol;
  if (s.life.activeMap !== 'home' || !patrol || !PATROL_SPOTS[spot] || patrol.tried.includes(spot)) return fail('这里没有新的线索');
  if (patrol.spot !== spot) {
    patrol.tried.push(spot);
    return ok('脚印到这里就断了，再去看看别处');
  }
  const cat = patrol.kind === 'cat', item = cat ? 'herb' : 'wood';
  s.activities.patrol = null;
  s.inventory[item] += 2;
  discover(s, item, 2);
  s.coins += 35;
  return { ok: true, item, message: cat ? '猫咪把田鼠赶回草丛 · 带回香草与35金币' : '小狗找回丢失的货袋 · 带回木材与35金币' };
}

export function recordStorm(s: FarmState, now = Date.now()): boolean {
  const a = s.activities, season = seasonIndex(s, now);
  if (s.life.activeMap !== 'home' || farmLevel(s.xp) < 5 || weatherAt(s, now) !== 'storm'
    || a.stormPlot !== null || season <= a.stormSeason) return false;
  const plot = s.plots.findIndex(p => p.unlocked && !p.crop);
  if (plot === -1 || s.plots.filter(p => p.unlocked && !p.crop).length < 2) return false;
  a.stormSeason = season;
  a.stormPlot = plot;
  return true;
}

export function repairStormPlot(s: FarmState): Result {
  if (s.activities.stormPlot === null) return fail('田地没有需要修复的积水');
  if (s.inventory.planks > 0) s.inventory.planks--;
  else if (s.coins >= 40) s.coins -= 40;
  else return fail('修复需要1木板或40金币');
  s.activities.stormPlot = null;
  return ok('积水已疏通 · 可以继续播种');
}

const CALENDAR = {
  spring: { month: 4, title: '四月樱花信', item: 'herb', amount: 3, coins: 180 },
  summer: { month: 7, title: '七月海边假日', item: 'fish', amount: 3, coins: 250 },
  autumn: { month: 10, title: '十月丰收月', item: 'corn', amount: 3, coins: 320 },
  winter: { month: 12, title: '十二月暖冬集市', item: 'bread', amount: 2, coins: 280 },
} as const;

export function calendarEvent(now = Date.now()) {
  const date = new Date(now + 8 * 3600000);
  const event = Object.entries(CALENDAR).find(([, e]) => e.month === date.getUTCMonth() + 1);
  return event ? { ...event[1], key: `${date.getUTCFullYear()}-${event[0]}` } : null;
}

export function claimCalendar(s: FarmState, now = Date.now()): Result {
  const event = calendarEvent(now);
  if (!event || s.activities.calendar.includes(event.key)) return fail('当前没有可领取的日历活动');
  if (s.inventory[event.item] < event.amount) return fail('活动物资还没备齐');
  s.inventory[event.item] -= event.amount;
  s.activities.calendar.push(event.key);
  if (s.activities.calendar.length > 128) s.activities.calendar.shift();
  s.coins += event.coins;
  s.stars += 4;
  noteFestivalPlay(s, now);
  return ok(`${event.title}完成 · ${event.coins}金币与4农场星`);
}
