import type { FarmState, Plot, ProductId, Result } from './FarmModel';
import { discover, farmLevel, refreshFeatures, rollDaily } from './FarmFeatures';
import { isAdult, seasonIndex, weatherAt, careFor } from './FarmLife';
import { animalSpec } from './FarmCatalog';
import { growAnimal } from './FarmEcology';
import { FURNITURE, FurnitureId } from './FarmCatalog';

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
  mode: 'lake' | 'control';
}

export interface FestivalScores { pumpkin: number; flower: number; ice: number }
export interface DecorEntry { at: number; score: number; theme: string; placed: number; rare: number; balance: number; votes: number }
export interface SceneEvent { kind: 'mouse' | 'theft'; plot: number; at: number; delay: number }
const blankScores = (): FestivalScores => ({ pumpkin: 0, flower: 0, ice: 0 });
const MAX_DECOR_SCORE = 40 * (8 + 18) + 24 + 16 + 12;

interface SummerRound {
  serial: number;
  attempt: number;
  hits: number;
  startedAt: number;
  castAt: number;
}

interface RaceRound {
  animalId: number;
  serial: number;
  gate: number;
  hits: number;
  gateAt: number;
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
  summer: SummerRound | null;
  summerSerial: number;
  summerScore: number;
  race: RaceRound | null;
  raceSerial: number;
  raceSeason: number;
  raceAt: number;
  pumpkinWeigh: { startedAt: number; daily?: boolean } | null;
  pumpkinWeighBonus: number;
  festivalRite: { startedAt: number } | null;
  festivalRiteBonus: number;
  festivalDay: string;
  festivalWeek: string;
  dayScore: FestivalScores;
  weekScore: FestivalScores;
  lifeScore: FestivalScores;
  dayClaim: string;
  weekClaim: string;
  calendarPlay: string[];
  relics: string[];
  decorLog: DecorEntry[];
  decorBest: number;
  scene: SceneEvent | null;
  sceneAt: number;
  stormCrop: number | null;
  stormDelay: number;
  stormDeco: number | null;
  stormWindow: number;
}

export function newActivities(): FarmActivities {
  return {
    pumpkin: 0, pumpkinRecord: 0, pumpkinSeason: -1, flowerRecord: 0, flowerSeason: -1,
    ice: null, iceSerial: 0, patrol: null, patrolAt: { cat: 0, dog: 0 }, patrolCount: 0,
    stormSeason: -1, stormPlot: null, calendar: [], reserve: 0, furniture: null,
    summer: null, summerSerial: 0, summerScore: 0, race: null, raceSerial: 0, raceSeason: -1, raceAt: 0,
    pumpkinWeigh: null, pumpkinWeighBonus: 0, festivalRite: null, festivalRiteBonus: 0,
    festivalDay: '', festivalWeek: '', dayScore: blankScores(), weekScore: blankScores(), lifeScore: blankScores(),
    dayClaim: '', weekClaim: '', calendarPlay: [], relics: [], decorLog: [], decorBest: 0,
    scene: null, sceneAt: 0, stormCrop: null, stormDelay: 0, stormDeco: null, stormWindow: -1,
  };
}

export function migrateActivities(a: FarmActivities) {
  if (a.summer === undefined) a.summer = null;
  if (!Number.isInteger(a.summerSerial)) a.summerSerial = 0;
  if (!Number.isInteger(a.summerScore)) a.summerScore = 0;
  if (a.race === undefined) a.race = null;
  if (!Number.isInteger(a.raceSerial)) a.raceSerial = 0;
  if (!Number.isInteger(a.raceSeason)) a.raceSeason = -1;
  if (typeof a.raceAt !== 'number') a.raceAt = 0;
  if (a.pumpkinWeigh === undefined) a.pumpkinWeigh = null;
  if (!Number.isInteger(a.pumpkinWeighBonus)) a.pumpkinWeighBonus = 0;
  if (a.festivalRite === undefined) a.festivalRite = null;
  if (!Number.isInteger(a.festivalRiteBonus)) a.festivalRiteBonus = 0;
  if (a.ice && !a.ice.mode) a.ice.mode = 'lake';
  if (typeof a.festivalDay !== 'string') a.festivalDay = '';
  if (typeof a.festivalWeek !== 'string') a.festivalWeek = '';
  if (!a.dayScore) a.dayScore = blankScores();
  if (!a.weekScore) a.weekScore = blankScores();
  if (!a.lifeScore) a.lifeScore = blankScores();
  if (typeof a.dayClaim !== 'string') a.dayClaim = '';
  if (typeof a.weekClaim !== 'string') a.weekClaim = '';
  if (!Array.isArray(a.calendarPlay)) a.calendarPlay = [];
  if (!Array.isArray(a.relics)) a.relics = [];
  if (!Array.isArray(a.decorLog)) a.decorLog = [];
  if (a.decorBest === undefined) a.decorBest = a.decorLog.reduce((best, entry) => Math.max(best, entry?.score ?? 0), 0);
  if (a.scene === undefined) a.scene = null;
  if (typeof a.sceneAt !== 'number') a.sceneAt = 0;
  if (a.stormCrop === undefined) a.stormCrop = null;
  if (!Number.isInteger(a.stormDelay)) a.stormDelay = 0;
  if (a.stormDeco === undefined) a.stormDeco = null;
  if (!Number.isInteger(a.stormWindow)) a.stormWindow = -1;
}

const scoreOk = (n: FestivalScores) => !!n && [n.pumpkin, n.flower, n.ice].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 400);
export function validActivities(a: FarmActivities, plots: Plot[]): boolean {
  const int = (n: number, min = 0, max = 1e9) => Number.isSafeInteger(n) && n >= min && n <= max;
  const time = (n: number) => Number.isFinite(n) && n >= 0 && n <= 1e15;
  return !!a && int(a.pumpkin, 0, 150) && int(a.pumpkinRecord, 0, 150)
    && int(a.flowerRecord, 0, 150) && int(a.pumpkinSeason, -1) && int(a.flowerSeason, -1)
    && int(a.iceSerial) && (a.ice === null || !!a.ice && a.ice.serial === a.iceSerial
      && int(a.ice.serial, 1) && int(a.ice.attempt, 0, 3) && int(a.ice.hits, 0, a.ice.attempt) && time(a.ice.startedAt)
      && (a.ice.mode === 'lake' || a.ice.mode === 'control'))
    && !!a.patrolAt && time(a.patrolAt.cat) && time(a.patrolAt.dog) && int(a.patrolCount)
    && (a.patrol === null || !!a.patrol && ['cat', 'dog'].includes(a.patrol.kind)
      && int(a.patrol.spot, 0, PATROL_SPOTS.length - 1) && Array.isArray(a.patrol.tried)
      && new Set(a.patrol.tried).size === a.patrol.tried.length
      && a.patrol.tried.every(i => int(i, 0, PATROL_SPOTS.length - 1) && i !== a.patrol!.spot))
    && int(a.stormSeason, -1) && (a.stormPlot === null || int(a.stormPlot, 0, plots.length - 1) && plots[a.stormPlot].unlocked && !plots[a.stormPlot].crop)
    && Array.isArray(a.calendar) && new Set(a.calendar).size === a.calendar.length && a.calendar.length <= 128
    && a.calendar.every(key => typeof key === 'string' && /^\d{4}-(spring|summer|autumn|winter)$/.test(key))
    && [0, 5, 10, 20].includes(a.reserve)
    && (a.furniture === null || !!a.furniture && FURNITURE.some(f => f.id === a.furniture!.type) && time(a.furniture.readyAt))
    && int(a.summerSerial) && int(a.summerScore) && (a.summer === null || !!a.summer && a.summer.serial === a.summerSerial
      && int(a.summer.serial, 1) && int(a.summer.attempt, 0, 2) && int(a.summer.hits, 0, a.summer.attempt)
      && time(a.summer.startedAt) && time(a.summer.castAt) && a.summer.castAt >= a.summer.startedAt)
    && int(a.raceSerial) && int(a.raceSeason, -1) && time(a.raceAt)
    && (a.race === null || !!a.race && a.race.serial === a.raceSerial && int(a.race.serial, 1)
      && int(a.race.animalId, 1) && int(a.race.gate, 0, 3) && int(a.race.hits, 0, a.race.gate) && time(a.race.gateAt))
    && int(a.pumpkinWeighBonus, 0, 30) && (a.pumpkinWeigh === null || !!a.pumpkinWeigh && time(a.pumpkinWeigh.startedAt) && (a.pumpkinWeigh.daily === undefined || typeof a.pumpkinWeigh.daily === 'boolean'))
    && int(a.festivalRiteBonus, 0, 200) && (a.festivalRite === null || !!a.festivalRite && time(a.festivalRite.startedAt))
    && /^\d{4}-\d{2}-\d{2}$|^$/.test(a.festivalDay) && /^\d{4}-W\d{2}$|^$/.test(a.festivalWeek)
    && /^\d{4}-\d{2}-\d{2}$|^$/.test(a.dayClaim) && /^\d{4}-W\d{2}$|^$/.test(a.weekClaim)
    && scoreOk(a.dayScore) && scoreOk(a.weekScore) && scoreOk(a.lifeScore)
    && Array.isArray(a.calendarPlay) && new Set(a.calendarPlay).size === a.calendarPlay.length && a.calendarPlay.length <= 128
    && a.calendarPlay.every(key => typeof key === 'string' && /^\d{4}-(spring|summer|autumn|winter)$/.test(key))
    && Array.isArray(a.relics) && new Set(a.relics).size === a.relics.length && a.relics.length <= 12
    && a.relics.every(id => /^(forest|mine|beach|snow)-(4|8|12)$/.test(id))
    && int(a.decorBest, 0, MAX_DECOR_SCORE) && Array.isArray(a.decorLog) && a.decorLog.length <= 8
    && a.decorLog.every(e => !!e && time(e.at) && int(e.score, 0, a.decorBest) && int(e.placed, 0, 40) && int(e.rare, 0, 40) && int(e.balance, 0, 40) && int(e.votes, 0, 1e6) && typeof e.theme === 'string' && e.theme.length <= 8)
    && (a.scene === null || !!a.scene && (a.scene.kind === 'mouse' || a.scene.kind === 'theft') && int(a.scene.plot, -1, plots.length - 1) && time(a.scene.at) && int(a.scene.delay, 0, 120000))
    && time(a.sceneAt) && (a.stormCrop === null || int(a.stormCrop, 0, plots.length - 1)) && int(a.stormDelay, 0, 120000)
    && (a.stormDeco === null || int(a.stormDeco, 0, 39)) && int(a.stormWindow, -1);
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
  const score = a.pumpkin + a.pumpkinWeighBonus, tier = score >= 105 ? 3 : score >= 70 ? 2 : 1;
  s.inventory[item]--;
  a.pumpkinSeason = season;
  a.pumpkinRecord = Math.max(a.pumpkinRecord, score);
  recordBoard(s, 'pumpkin', score, now);
  a.pumpkin = 0;
  a.pumpkinWeighBonus = 0;
  a.pumpkinWeigh = null;
  s.coins += tier * 180;
  s.stars += tier * 2;
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
  recordBoard(s, 'flower', score, now);
  s.coins += score * 3;
  s.stars += score >= 100 ? 4 : 2;
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
  s.activities.ice = { serial: ++s.activities.iceSerial, attempt: 0, hits: 0, startedAt: now, mode: 'lake' };
  return ok('冰湖抛竿 · 指针进入绿色区时拉线');
}

export const ICE_CONTROL_MS = 4800;
export function iceControlWindow(round: IceRound, now: number) {
  const elapsed = now - round.startedAt;
  const begin = 700 + ((round.serial * 113 + round.attempt * 197) % 400);
  const end = begin + 900 - round.attempt * 140;
  return { elapsed, begin, end, expired: elapsed > ICE_CONTROL_MS };
}

export function startIceControl(s: FarmState, now = Date.now()): Result {
  const winter = seasonIndex(s, now) % 4 === 3;
  if (s.life.activeMap !== 'snow' && !(s.life.activeMap === 'home' && winter)) return fail('到极光雪原，或在冬季的主农场冰窟控线');
  if (s.activities.ice && !(s.activities.ice.mode === 'control' ? iceControlWindow(s.activities.ice, now) : iceWindow(s.activities.ice, now)).expired) return fail('这一竿还没收完');
  refreshFeatures(s, now);
  if (s.features.fishing.bait < 1) return fail('鱼饵不足，可到钓鱼面板购买');
  s.features.fishing.bait--;
  s.activities.ice = { serial: ++s.activities.iceSerial, attempt: 0, hits: 0, startedAt: now, mode: 'control' };
  return ok('控线开始 · 四次把指针留在越来越窄的绿色区');
}

export function pullIceLine(s: FarmState, now = Date.now()): Result {
  const a = s.activities, round = a.ice;
  if (!round) return fail('请先在冰湖抛竿');
  if (round.mode === 'control') return pullIceControl(s, now);
  if (s.life.activeMap !== 'snow') return fail('请先在冰湖抛竿');
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
  recordBoard(s, 'ice', round.hits * 30, now);
  if (round.hits < 2) return ok('命中不足2次，鱼游走啦');
  const item: ProductId = round.hits === 3 ? 'goldenFish' : 'fish';
  rollDaily(s, now);
  s.inventory[item]++;
  s.features.stats.catches++;
  s.xp += round.hits === 3 ? 20 : 10;
  discover(s, item);
  return { ok: true, item, message: round.hits === 3 ? '三次拉线全中 · 钓到金色锦鲤' : '冰钓成功 · 溪流鱼已入库' };
}

function pullIceControl(s: FarmState, now: number): Result {
  const round = s.activities.ice!;
  const timing = iceControlWindow(round, now);
  if (timing.expired) {
    s.activities.ice = null;
    recordBoard(s, 'ice', round.hits * 25, now);
    return ok('线绷断了，鱼已经钻回冰层');
  }
  if (timing.elapsed >= timing.begin && timing.elapsed <= timing.end) round.hits++;
  round.attempt++;
  if (round.attempt < 4) {
    round.startedAt = now;
    return ok(`第${round.attempt}次控线完成 · 已稳住${round.hits}次`);
  }
  s.activities.ice = null;
  const noted = recordBoard(s, 'ice', round.hits * 25, now);
  if (round.hits < 3) return ok(`控线不稳，只稳住${round.hits}次 · 今日最好 ${noted.best}分`);
  const item: ProductId = round.hits === 4 ? 'goldenFish' : 'fish';
  rollDaily(s, now);
  s.inventory[item]++;
  s.features.stats.catches++;
  s.xp += round.hits === 4 ? 24 : 12;
  discover(s, item);
  return { ok: true, item, message: round.hits === 4 ? '四次控线全中 · 钓到金色锦鲤' : '控线成功 · 溪流鱼已入库' };
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
  spring: { month: 4, title: '四月樱花信', item: 'herb', amount: 3, coins: 180, game: 'flower' },
  summer: { month: 7, title: '七月海边假日', item: 'fish', amount: 3, coins: 250, game: 'summer' },
  autumn: { month: 10, title: '十月丰收月', item: 'corn', amount: 3, coins: 320, game: 'pumpkin' },
  winter: { month: 12, title: '十二月暖冬集市', item: 'bread', amount: 2, coins: 280, game: null },
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
  const bonus = s.activities.festivalRiteBonus;
  s.activities.festivalRiteBonus = 0;
  s.activities.festivalRite = null;
  s.activities.calendar.push(event.key);
  if (s.activities.calendar.length > 128) s.activities.calendar.shift();
  s.coins += event.coins + bonus;
  s.stars += 4;
  return ok(`${event.title}完成 · ${event.coins + bonus}金币与4农场星`);
}

export function weighWindow(round: { startedAt: number }, now: number) {
  const elapsed = now - round.startedAt;
  return { elapsed, begin: 900, end: 1700, expired: elapsed > 4000 };
}

export function startPumpkinWeigh(s: FarmState, now = Date.now()): Result {
  if (seasonIndex(s, now) % 4 !== 2) return fail('秋季才能给参赛南瓜称重');
  if (s.activities.pumpkinSeason === seasonIndex(s, now)) return fail('本季南瓜已经送评');
  if (!s.activities.pumpkin) return fail('先收获一颗培育过的南瓜');
  s.activities.pumpkinWeigh = { startedAt: now };
  return ok('秤开始摆动 · 指针进入绿色区时落秤');
}

export function pullPumpkinWeigh(s: FarmState, now = Date.now()): Result {
  const round = s.activities.pumpkinWeigh;
  if (!round) return fail('请先开始称重');
  const timing = weighWindow(round, now);
  s.activities.pumpkinWeigh = null;
  const hit = !timing.expired && timing.elapsed >= timing.begin && timing.elapsed <= timing.end;
  if (round.daily) {
    const score = hit ? 75 : 20;
    const noted = recordBoard(s, 'pumpkin', score, now);
    if (noted.improved) s.coins += hit ? 35 : 8;
    return ok(hit ? `今日称重 ${score}分 · 个人最好 ${noted.best}` : `秤晃过去了 · ${score}分已记入今日`);
  }
  if (hit) {
    s.activities.pumpkinWeighBonus = 15;
    recordBoard(s, 'pumpkin', s.activities.pumpkin + 15, now);
    return ok('落秤正好 · 评选额外 +15 分');
  }
  s.activities.pumpkinWeighBonus = 0;
  return ok('秤晃过去了，育成分维持原样');
}

export function riteWindow(round: { startedAt: number }, now: number) {
  const elapsed = now - round.startedAt;
  return { elapsed, begin: 800, end: 1800, expired: elapsed > 4500 };
}

export function startFestivalRite(s: FarmState, now = Date.now()): Result {
  const event = calendarEvent(now);
  if (!event || s.activities.calendar.includes(event.key)) return fail('这个月没有可参加的节日节奏');
  s.activities.festivalRite = { startedAt: now };
  return ok('节日节奏开始 · 鼓点进入绿色区时敲下');
}

export function playFestivalRite(s: FarmState, now = Date.now()): Result {
  const round = s.activities.festivalRite;
  if (!round) return fail('请先开始节日节奏');
  const timing = riteWindow(round, now);
  s.activities.festivalRite = null;
  if (!timing.expired && timing.elapsed >= timing.begin && timing.elapsed <= timing.end) {
    s.activities.festivalRiteBonus = 80;
    return ok('节奏正好 · 交付时额外 +80 金币');
  }
  s.activities.festivalRiteBonus = 0;
  return ok('鼓点错过了，交付奖励维持原样');
}

export const SUMMER_LIMIT_MS = 40000;
export const SUMMER_CASTS = 3;
export function summerWindow(round: SummerRound, now: number) {
  const elapsed = now - round.castAt;
  const begin = 800 + ((round.serial * 149 + round.attempt * 263) % 600);
  const end = begin + 1200 - round.attempt * 90;
  const roundLeft = Math.max(0, SUMMER_LIMIT_MS - (now - round.startedAt));
  return { elapsed, begin, end, roundLeft, expired: elapsed > 6500 || roundLeft === 0 };
}

export function startSummerContest(s: FarmState, now = Date.now()): Result {
  if (seasonIndex(s, now) % 4 !== 1) return fail('夏季才开放限时渔赛');
  if (s.life.activeMap !== 'home' && s.life.activeMap !== 'beach') return fail('在主农场池塘或贝壳海滩参加');
  if (s.activities.summer && !summerWindow(s.activities.summer, now).expired) return fail('这一轮还没结束');
  refreshFeatures(s, now);
  if (s.features.fishing.bait < 1) return fail('鱼饵不足，可到钓鱼面板购买');
  s.features.fishing.bait--;
  s.activities.summer = { serial: ++s.activities.summerSerial, attempt: 0, hits: 0, startedAt: now, castAt: now };
  return ok('限时渔赛开始 · 40秒内收竿3次，指针进入绿色区才算钓到');
}

export function pullSummerLine(s: FarmState, now = Date.now()): Result {
  const round = s.activities.summer;
  if (!round) return fail('请先开始限时渔赛');
  const timing = summerWindow(round, now);
  const caught = !timing.expired && timing.elapsed >= timing.begin && timing.elapsed <= timing.end;
  if (caught) {
    round.hits++;
    s.activities.summerScore++;
    rollDaily(s, now);
    s.inventory.fish++;
    s.features.stats.catches++;
    s.xp += 8;
    discover(s, 'fish');
  }
  round.attempt++;
  if (round.attempt >= SUMMER_CASTS || timing.roundLeft === 0) {
    const hits = round.hits;
    s.activities.summer = null;
    return ok(hits ? `限时渔赛结束 · 钓到${hits}条溪流鱼` : '时间到了，这条鱼游走啦');
  }
  round.castAt = now;
  return ok(caught ? `收竿成功 · 已钓到${round.hits}条` : `没收住 · 还剩${SUMMER_CASTS - round.attempt}次`);
}

export const RACE_GATES = 4;
export const RACE_MS = 7000;
export function raceWindow(round: RaceRound, now: number) {
  const elapsed = now - round.gateAt;
  const begin = 700 + ((round.serial * 97 + round.gate * 211) % 700);
  const end = begin + 1100 - round.gate * 80;
  return { elapsed, begin, end, expired: elapsed > RACE_MS };
}

export function startRace(s: FarmState, id: number, now = Date.now()): Result {
  const a = s.activities, pet = s.animals.find(animal => animal.id === id);
  if (!pet || !isAdult(s, pet, now)) return fail('请带一位成年伙伴参赛');
  if (a.race && !raceWindow(a.race, now).expired) return fail('这一轮障碍还没跑完');
  if (a.raceSeason === seasonIndex(s, now)) return fail('本季障碍赛已经完赛，下季再来');
  if (now < a.raceAt) return fail(`再等${Math.ceil((a.raceAt - now) / 1000)}秒可以重新起跑`);
  const care = careFor(s, pet, now);
  if (care.hunger < 40 || care.mood < 40) return fail('参赛需要饱食40、心情40');
  a.race = { animalId: id, serial: ++a.raceSerial, gate: 0, hits: 0, gateAt: now };
  return ok(`${animalSpec(pet.type).name}起跑 · 指针进入绿色区时起跳`);
}

export function jumpRace(s: FarmState, now = Date.now()): Result {
  const a = s.activities, round = a.race;
  if (!round) return fail('请先选择伙伴起跑');
  const pet = s.animals.find(animal => animal.id === round.animalId);
  if (!pet) { a.race = null; return fail('参赛伙伴不在农场里'); }
  const timing = raceWindow(round, now);
  if (!timing.expired && timing.elapsed >= timing.begin && timing.elapsed <= timing.end) round.hits++;
  round.gate++;
  if (round.gate < RACE_GATES) {
    round.gateAt = now;
    return ok(`越过第${round.gate}道障碍 · 已命中${round.hits}次`);
  }
  a.race = null;
  if (round.hits < 3) {
    a.raceAt = now + 20000;
    return ok(`撞到了障碍，命中${round.hits}/4 · 20秒后可以再跑`);
  }
  a.raceSeason = seasonIndex(s, now);
  const tier = round.hits >= 4 ? 3 : 2;
  growAnimal(s, pet, 20);
  s.coins += tier * 150;
  s.stars += tier;
  return ok(`障碍赛完赛 · 命中${round.hits}/4 · ${tier === 3 ? '金牌' : '银牌'} · ${tier * 150}金币`);
}

export function festivalKeys(now = Date.now()) {
  const date = new Date(now + 8 * 3600000);
  const y = date.getUTCFullYear(), m = date.getUTCMonth(), d = date.getUTCDate();
  const day = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const utc = Date.UTC(y, m, d);
  const tmp = new Date(utc);
  tmp.setUTCDate(tmp.getUTCDate() - ((tmp.getUTCDay() + 6) % 7) + 3);
  const firstThursday = Date.UTC(tmp.getUTCFullYear(), 0, 4);
  const week = 1 + Math.round((tmp.getTime() - firstThursday) / 604800000);
  return { day, week: `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}` };
}

export function syncFestivalBoards(s: FarmState, now = Date.now()) {
  const keys = festivalKeys(now), a = s.activities;
  if (a.festivalDay !== keys.day) { a.festivalDay = keys.day; a.dayScore = blankScores(); }
  if (a.festivalWeek !== keys.week) { a.festivalWeek = keys.week; a.weekScore = blankScores(); }
}

export function recordBoard(s: FarmState, game: keyof FestivalScores, score: number, now = Date.now()) {
  syncFestivalBoards(s, now);
  const a = s.activities, before = a.dayScore[game];
  a.dayScore[game] = Math.max(before, score);
  a.weekScore[game] = Math.max(a.weekScore[game], score);
  a.lifeScore[game] = Math.max(a.lifeScore[game], score);
  if (game === 'pumpkin') a.pumpkinRecord = Math.max(a.pumpkinRecord, score);
  if (game === 'flower') a.flowerRecord = Math.max(a.flowerRecord, score);
  return { improved: score > before, best: a.lifeScore[game] };
}

export function startDailyWeigh(s: FarmState, now = Date.now()): Result {
  if (s.activities.pumpkinWeigh) return fail('秤还在摆动');
  s.activities.pumpkinWeigh = { startedAt: now, daily: true };
  return ok('今日称重开始 · 指针进入绿色区时落秤');
}

export function practiceFlowers(s: FarmState, choices: readonly FlowerChoice[], now = Date.now()): Result {
  if (choices.length !== 3 || !choices.every(id => FLOWER_PALETTE.some(f => f.id === id))) return fail('请先选好三个花位');
  const score = flowerScore(choices, Math.floor(seasonIndex(s, now) / 4));
  const noted = recordBoard(s, 'flower', score, now);
  if (noted.improved) s.coins += Math.floor(score / 5);
  return ok(`今日插花 ${score}分 · 不消耗花材 · 个人最好 ${noted.best}`);
}

export function claimDailyFestival(s: FarmState, now = Date.now()): Result {
  syncFestivalBoards(s, now);
  const a = s.activities, sum = a.dayScore.pumpkin + a.dayScore.flower + a.dayScore.ice;
  if (a.dayClaim === a.festivalDay) return fail('今日节日奖励已经领取');
  if (sum < 40) return fail('先完成一项今日小游戏，再来领奖励');
  a.dayClaim = a.festivalDay;
  s.coins += 50 + Math.floor(sum / 2);
  s.inventory.herb++;
  discover(s, 'herb');
  return ok(`今日节日 · ${50 + Math.floor(sum / 2)}金币 · 香草 ×1`);
}

export function claimWeeklyFestival(s: FarmState, now = Date.now()): Result {
  syncFestivalBoards(s, now);
  const a = s.activities, sum = a.weekScore.pumpkin + a.weekScore.flower + a.weekScore.ice;
  if (a.weekClaim === a.festivalWeek) return fail('本周节日奖励已经领取');
  if (sum < 150) return fail('本周三项合计还不到150分');
  a.weekClaim = a.festivalWeek;
  s.coins += 220;
  const owned = s.advanced.room.items.some(item => item.type === 'teaTable');
  if (!owned && s.advanced.room.items.length < 40) {
    s.advanced.room.items.push({ id: ++s.advanced.room.serial, type: 'teaTable', x: null, y: null, rotation: 0 });
    if (!s.life.home.owned.includes('teaTable')) s.life.home.owned.push('teaTable');
    return ok('本周节日 · 220金币 · 花茶几已收入家具箱');
  }
  s.inventory.gem++;
  discover(s, 'gem');
  return ok('本周节日 · 220金币 · 蓝宝石 ×1');
}

const PUZZLE_RELIC: Record<string, FurnitureId> = {
  'forest-4': 'lamp', 'forest-8': 'housePlant', 'forest-12': 'teaTable',
  'mine-4': 'desk', 'mine-8': 'bookshelf', 'mine-12': 'cabinet',
  'beach-4': 'rug', 'beach-8': 'sofa', 'beach-12': 'teaTable',
  'snow-4': 'lamp', 'snow-8': 'housePlant', 'snow-12': 'cabinet',
};

export function grantPuzzleRelic(s: FarmState, map: string, depth: number): string {
  const id = `${map}-${depth}`, type = PUZZLE_RELIC[id];
  if (!type || s.activities.relics.includes(id)) return '';
  s.activities.relics.push(id);
  const name = FURNITURE.find(f => f.id === type)!.name;
  if (s.advanced.room.items.length >= 40) {
    s.coins += 80;
    return `首次解开 · 家具箱已满，改为80金币`;
  }
  s.advanced.room.items.push({ id: ++s.advanced.room.serial, type, x: null, y: null, rotation: 0 });
  if (!s.life.home.owned.includes(type)) s.life.home.owned.push(type);
  return `首次解开 · ${name}已收入家具箱`;
}

export function scoreDecor(s: FarmState) {
  const placed = s.advanced.room.items.filter(item => item.x !== null && item.y !== null);
  const rare = placed.filter(item => item.type === 'cabinet' || item.type === 'teaTable' || item.type === 'bookshelf').length;
  const xs = placed.map(item => item.x!), ys = placed.map(item => item.y!);
  const balance = placed.length < 2 ? 0 : (Math.max(...xs) - Math.min(...xs) > .25 && Math.max(...ys) - Math.min(...ys) > .2 ? 24 : 8);
  const theme = s.advanced.room.wall === s.advanced.room.floor ? '成套' : '混搭';
  const yard = Math.min(12, s.decorations.length * 2);
  const damaged = s.activities.stormDeco !== null ? 10 : 0;
  const score = Math.max(0, placed.length * 8 + rare * 18 + balance + (theme === '成套' ? 16 : 10) + yard - damaged);
  return { score, theme, placed: placed.length, rare, balance, votes: 0 };
}

export function submitDecor(s: FarmState, now = Date.now()): Result {
  const card = scoreDecor(s);
  if (card.placed < 3) return fail('至少在小屋摆好3件家具，再参加本地装饰赛');
  const a = s.activities;
  a.decorLog.unshift({ at: now, ...card });
  if (a.decorLog.length > 8) a.decorLog.pop();
  if (card.score > a.decorBest) {
    a.decorBest = card.score;
    s.coins += 30 + card.score;
  }
  return ok(`本地装饰赛 ${card.score}分 · ${card.theme} · 最高 ${a.decorBest}。票数留给以后的好友评选`);
}

export function rollScene(s: FarmState, now = Date.now()): boolean {
  if (s.life.activeMap !== 'home' || s.activities.scene || now < s.activities.sceneAt || farmLevel(s.xp) < 4) return false;
  const cat = s.animals.some(pet => pet.type === 'cat' && isAdult(s, pet, now));
  const dog = s.animals.some(pet => pet.type === 'dog' && isAdult(s, pet, now));
  if (!cat && !dog) return false;
  const plot = s.plots.findIndex(p => p.unlocked && p.crop && now < p.plantedAt + (p.growSeconds || 20) * 1000);
  const mouse = cat && (!dog || s.activities.patrolCount % 2 === 0) && plot !== -1;
  if (mouse) {
    s.plots[plot].plantedAt += 20000;
    s.activities.scene = { kind: 'mouse', plot, at: now, delay: 20000 };
  } else if (dog) {
    s.activities.scene = { kind: 'theft', plot: -1, at: now, delay: 25 };
  } else return false;
  s.activities.sceneAt = now + 180000;
  return true;
}

export function resolveScene(s: FarmState, help: boolean, now = Date.now()): Result {
  const scene = s.activities.scene;
  if (!scene || s.life.activeMap !== 'home') return fail('院子里现在没有需要处理的事');
  if (help && scene.kind === 'mouse' && !s.animals.some(pet => pet.type === 'cat' && isAdult(s, pet, now))) return fail('需要一只成年猫咪来抓田鼠');
  if (help && scene.kind === 'theft' && !s.animals.some(pet => pet.type === 'dog' && isAdult(s, pet, now))) return fail('需要一只成年小狗看住货袋');
  s.activities.scene = null;
  if (scene.kind === 'mouse') {
    const plot = s.plots[scene.plot];
    if (!help) return ok('先不管田鼠，这块作物会晚一点成熟');
    if (plot) plot.plantedAt = Math.max(0, plot.plantedAt - scene.delay);
    s.inventory.herb++;
    s.coins += 15;
    discover(s, 'herb');
    return { ok: true, item: 'herb', message: '猫咪赶走田鼠 · 作物恢复 · 香草 ×1 · 15金币' };
  }
  if (!help) {
    s.coins = Math.max(0, s.coins - scene.delay);
    return ok(`货袋被搬走了 · 金币 -${scene.delay}`);
  }
  s.coins += 20;
  s.inventory.wood++;
  discover(s, 'wood');
  return { ok: true, item: 'wood', message: '小狗看住货袋 · 木材 ×1 · 20金币' };
}

export function damageStorm(s: FarmState, now = Date.now()): boolean {
  const weather = weatherAt(s, now), win = Math.floor((now - s.life.epoch) / 240000);
  if (s.life.activeMap !== 'home' || farmLevel(s.xp) < 5 || (weather !== 'storm' && weather !== 'thunder') || s.activities.stormWindow === win) return false;
  const plot = s.plots.findIndex((p, index) => p.unlocked && p.crop && index !== s.activities.stormPlot && now < p.plantedAt + (p.growSeconds || 20) * 1000);
  if (plot !== -1) {
    s.plots[plot].plantedAt += 15000;
    s.activities.stormCrop = plot;
    s.activities.stormDelay = 15000;
    s.activities.stormWindow = win;
    return true;
  }
  if (s.decorations.length) {
    s.activities.stormDeco = 0;
    s.activities.stormWindow = win;
    return true;
  }
  return false;
}

export function repairStormCrop(s: FarmState): Result {
  const index = s.activities.stormCrop;
  if (index === null) return fail('没有被暴雨耽误的作物');
  const plot = s.plots[index];
  if (plot) plot.plantedAt = Math.max(0, plot.plantedAt - s.activities.stormDelay);
  s.activities.stormCrop = null;
  s.activities.stormDelay = 0;
  return ok('扶好了被暴雨压倒的作物');
}

export function repairStormDeco(s: FarmState): Result {
  if (s.activities.stormDeco === null) return fail('没有被暴雨刮倒的装饰');
  if (s.inventory.planks > 0) s.inventory.planks--;
  else if (s.coins >= 25) s.coins -= 25;
  else return fail('修好装饰需要1木板或25金币');
  s.activities.stormDeco = null;
  return ok('装饰已经扶正');
}

export function claimCalendarPlay(s: FarmState, now = Date.now()): Result {
  const event = calendarEvent(now);
  if (!event) return fail('这个月没有节日小游戏');
  const a = s.activities;
  if (a.calendarPlay.includes(event.key)) return fail('本月节日小游戏已经领过');
  syncFestivalBoards(s, now);
  const game = event.game;
  if (game === 'summer') {
    if (a.summerScore < 2) return fail('先在夏日渔赛钓到2条鱼');
  } else {
    const scores = a.lifeScore;
    const score = game ? Math.max(scores[game], a.weekScore[game], a.dayScore[game]) : Math.max(scores.pumpkin, scores.flower, scores.ice);
    if (score < 60) return fail('先在对应节日小游戏里留下60分');
  }
  a.calendarPlay.push(event.key);
  if (a.calendarPlay.length > 128) a.calendarPlay.shift();
  s.coins += 120;
  s.stars += 2;
  return ok(`${event.title}小游戏 · 120金币与2农场星`);
}
