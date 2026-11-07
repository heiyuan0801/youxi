import type {FarmState, ProductId, Result} from './FarmModel';
import {RECIPES, craftHooks, farmLevel} from './FarmFeatures';
import {ANIMALS, FURNITURE} from './FarmCatalog';
import {ShareMoment, composeShare, makeInviteCode, validInviteCode} from './FarmShare';
import {atLocalNoon, itemName, localDate, shiftLocal, t, weekKey, type Locale, isLocale} from './FarmI18n';

export type {Locale};
export {localDate, shiftLocal, atLocalNoon, weekKey};

export type TutorialAction = 'continue' | 'harvest' | 'plant' | 'water';
export type Blessing = 'sprout' | 'bounty' | 'drizzle' | 'glow';
export type QuestKind = 'harvest' | 'water' | 'deliver';

export interface NeighborQuest {
  id: string;
  npc: string;
  kind: QuestKind;
  target: number;
  progress: number;
  coins: number;
  stars: number;
  claimed: boolean;
}

export interface TomorrowOrder {
  person: string;
  message: string;
  needs: Partial<Record<ProductId, number>>;
  coins: number;
  xp: number;
  due: string;
  accepted: boolean;
}

export interface Retention {
  schema: 1;
  locale: Locale;
  localeSet: boolean;
  tutorial: {step: number; skipped: boolean; startedAt: number; finishedAt: number};
  checklist: {date: string; harvest: boolean; plant: boolean; water: boolean; festival: boolean; login: boolean; claimed: boolean; streak: number; lastComplete: string; best: number};
  harvestStreak: {days: number; last: string; titles: string[]};
  login: {last: string; next: number; cycles: number};
  medals: string[];
  counts: {plants: number; waters: number; cooks: number; neighborClaims: number; tomorrowDeliveries: number};
  codex: {crops: string[]; animals: string[]; furniture: string[]; layers: string[]; claimed: string[]; primed: boolean};
  audio: {bgm: number; sfx: number; muted: boolean};
  cooking: {discovered: string[]; contestDate: string; contestScore: number; best: number};
  shrine: {date: string; blessing: '' | Blessing};
  neighbors: {week: string; quests: NeighborQuest[]};
  tomorrow: {order: TomorrowOrder | null};
  decorBest: number;
  decorShared: number;
  festivalBest: {pumpkin: number; flower: number};
  hud: {left: boolean; right: boolean};
  share: {pending: ShareMoment | null; latest: ShareMoment | null; seen: string[]; shared: string[]; code: string; redeemed: boolean};
}

const CROP_IDS = ['wheat','carrot','tomato','strawberry','corn','pumpkin','rice','potato','cabbage','cucumber','soybean','cotton','sugarcane','watermelon','grape','orange','sunflowerCrop','cocoa','coffee','lavender','auroraBerry','goldenPumpkin'];
const LAYER_MAPS = ['forest', 'mine', 'beach', 'snow'] as const;
const RARE_DECOS = new Set(['sunflower', 'signpost', 'bakery', 'swing']);
const STARTERS = new Set(['bread', 'flour', 'feed']);
const TITLES = [{id: 'till-3', days: 3}, {id: 'till-7', days: 7}, {id: 'till-14', days: 14}, {id: 'till-30', days: 30}];
const CODEX_GIFTS = [
  {id: 'crops-4', kind: 'crops' as const, n: 4, coins: 40},
  {id: 'crops-8', kind: 'crops' as const, n: 8, coins: 80},
  {id: 'crops-16', kind: 'crops' as const, n: 16, coins: 140},
  {id: 'animals-3', kind: 'animals' as const, n: 3, coins: 50},
  {id: 'animals-8', kind: 'animals' as const, n: 8, coins: 90},
  {id: 'furniture-3', kind: 'furniture' as const, n: 3, coins: 60},
  {id: 'layers-1', kind: 'layers' as const, n: 1, coins: 40},
  {id: 'layers-4', kind: 'layers' as const, n: 4, coins: 120},
];
const ACHIEVEMENTS = [
  {id: 'harvest-1', coins: 20, met: (s: FarmState) => s.stats.harvests >= 1},
  {id: 'harvest-30', coins: 80, met: (s: FarmState) => s.stats.harvests >= 30},
  {id: 'water-10', coins: 40, met: (s: FarmState) => s.retention.counts.waters >= 10},
  {id: 'streak-3', coins: 40, met: (s: FarmState) => s.retention.checklist.best >= 3},
  {id: 'streak-7', coins: 90, met: (s: FarmState) => s.retention.checklist.best >= 7},
  {id: 'login-7', coins: 100, met: (s: FarmState) => s.retention.login.cycles >= 1},
  {id: 'codex-8', coins: 60, met: (s: FarmState) => s.retention.codex.crops.length >= 8},
  {id: 'cook-1', coins: 40, met: (s: FarmState) => s.retention.counts.cooks >= 1},
  {id: 'neighbor-1', coins: 40, met: (s: FarmState) => s.retention.counts.neighborClaims >= 1},
  {id: 'soil-red', coins: 80, met: (s: FarmState) => s.plots.some(plot => plot.soil === 2)},
  {id: 'explore-1', coins: 40, met: (s: FarmState) => s.retention.codex.layers.length >= 1},
  {id: 'decor-40', coins: 50, met: (s: FarmState) => s.retention.decorBest >= 40},
] as const;
const LOGIN_REWARDS: {coins?: number; stars?: number; item?: ProductId; amount?: number}[] = [
  {coins: 30}, {item: 'wheat', amount: 2}, {coins: 50}, {item: 'herb', amount: 1}, {coins: 80, stars: 1}, {item: 'carrot', amount: 3}, {coins: 150, stars: 5},
];
const TOMORROW = [
  {person: '林奶奶', message: '明天早餐想用南瓜和小麦，今晚先把单子收下吧。', needs: {pumpkin: 1, wheat: 2} as Partial<Record<ProductId, number>>, coins: 160, xp: 22},
  {person: '面包师阿禾', message: '明早的面包炉要提前备料，明天把鸡蛋和小麦送来就好。', needs: {egg: 2, wheat: 2}, coins: 130, xp: 18},
  {person: '邻居小满', message: '明天想做一锅热汤，今晚先记下胡萝卜和牛奶。', needs: {milk: 1, carrot: 2}, coins: 150, xp: 20},
];
const QUEST_DEFS: Omit<NeighborQuest, 'progress' | 'claimed'>[] = [
  {id: 'granny-harvest', npc: '林奶奶', kind: 'harvest', target: 6, coins: 80, stars: 1},
  {id: 'baker-deliver', npc: '面包师阿禾', kind: 'deliver', target: 2, coins: 100, stars: 1},
  {id: 'xiaoman-water', npc: '邻居小满', kind: 'water', target: 4, coins: 70, stars: 1},
];

export const TUTORIAL_STEPS: {action: TutorialAction; title: string}[] = [
  {action: 'continue', title: 'tut.welcome.title'},
  {action: 'harvest', title: 'tut.harvest.title'},
  {action: 'plant', title: 'tut.plant.title'},
  {action: 'water', title: 'tut.water.title'},
  {action: 'continue', title: 'tut.checklist.title'},
  {action: 'continue', title: 'tut.login.title'},
  {action: 'continue', title: 'tut.hooks.title'},
];

const fail = (message: string): Result => ({ok: false, message});
const ok = (message: string): Result => ({ok: true, message});
const loc = (s: FarmState) => s.retention?.locale;
const freshQuests = (): NeighborQuest[] => QUEST_DEFS.map(quest => ({...quest, progress: 0, claimed: false}));

export function newRetention(now = Date.now()): Retention {
  return {
    schema: 1, locale: 'zh-CN', localeSet: false,
    tutorial: {step: 0, skipped: false, startedAt: now, finishedAt: 0},
    checklist: {date: localDate(now), harvest: false, plant: false, water: false, festival: false, login: false, claimed: false, streak: 0, lastComplete: '', best: 0},
    harvestStreak: {days: 0, last: '', titles: []},
    login: {last: '', next: 0, cycles: 0},
    medals: [],
    counts: {plants: 0, waters: 0, cooks: 0, neighborClaims: 0, tomorrowDeliveries: 0},
    codex: {crops: [], animals: [], furniture: [], layers: [], claimed: [], primed: false},
    audio: {bgm: 80, sfx: 80, muted: false},
    cooking: {discovered: ['bread', 'flour', 'feed'], contestDate: '', contestScore: 0, best: 0},
    shrine: {date: '', blessing: ''},
    neighbors: {week: weekKey(now), quests: freshQuests()},
    tomorrow: {order: null},
    decorBest: 0, decorShared: 0,
    festivalBest: {pumpkin: 0, flower: 0},
    hud: {left: true, right: true},
    share: {pending: null, latest: null, seen: [], shared: [], code: makeInviteCode(now || 1), redeemed: false},
  };
}

export function legacyRetention(now = Date.now()): Retention {
  const retention = newRetention(now);
  retention.tutorial.step = TUTORIAL_STEPS.length;
  retention.tutorial.skipped = true;
  retention.tutorial.finishedAt = now;
  retention.localeSet = true;
  return retention;
}

const dateOk = (value: unknown) => value === '' || typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const intOk = (value: unknown, max = 1e9) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
const unique = (values: string[], max: number) => values.length <= max && new Set(values).size === values.length && values.every(value => typeof value === 'string' && value.length > 0 && value.length <= 48);

function momentOk(moment: ShareMoment | null, seen: string[]): boolean {
  if (moment === null) return true;
  return !!moment && typeof moment.id === 'string' && moment.id.length <= 40 && seen.includes(moment.id)
    && ['first-harvest', 'decor', 'festival', 'streak', 'red-soil', 'recipe', 'codex'].includes(moment.kind)
    && intOk(moment.score, 100000) && typeof moment.token === 'string' && moment.token.length <= 40 && intOk(moment.at, 1e15);
}

export function validRetention(r: Retention): boolean {
  if (!r || r.schema !== 1 || !isLocale(r.locale) || typeof r.localeSet !== 'boolean') return false;
  const tutorial = r.tutorial;
  if (!tutorial || !intOk(tutorial.step, TUTORIAL_STEPS.length) || typeof tutorial.skipped !== 'boolean' || !intOk(tutorial.startedAt, 1e15) || !intOk(tutorial.finishedAt, 1e15)) return false;
  const list = r.checklist;
  if (!list || !dateOk(list.date) || !['harvest', 'plant', 'water', 'festival', 'login', 'claimed'].every(key => typeof list[key as 'harvest'] === 'boolean') || !intOk(list.streak, 100000) || !dateOk(list.lastComplete) || !intOk(list.best, 100000) || list.best < list.streak && list.lastComplete !== list.date) return false;
  if (!r.harvestStreak || !intOk(r.harvestStreak.days, 100000) || !dateOk(r.harvestStreak.last) || !unique(r.harvestStreak.titles, 8) || r.harvestStreak.titles.some(id => !TITLES.some(title => title.id === id))) return false;
  if (!r.login || !dateOk(r.login.last) || !intOk(r.login.next, 6) || !intOk(r.login.cycles, 100000)) return false;
  if (!unique(r.medals, 32) || r.medals.some(id => !ACHIEVEMENTS.some(item => item.id === id))) return false;
  if (!r.counts || !['plants', 'waters', 'cooks', 'neighborClaims', 'tomorrowDeliveries'].every(key => intOk(r.counts[key as 'plants']))) return false;
  const codex = r.codex;
  if (!codex || typeof codex.primed !== 'boolean' || !unique(codex.crops, 40) || !unique(codex.animals, 40) || !unique(codex.furniture, 20) || !unique(codex.layers, 64) || !unique(codex.claimed, 16)) return false;
  if (codex.crops.some(id => !CROP_IDS.includes(id)) || codex.animals.some(id => !ANIMALS.some(animal => animal.id === id)) || codex.furniture.some(id => !FURNITURE.some(item => item.id === id))) return false;
  if (codex.layers.some(id => {const [map, depth] = id.split(':'); return !LAYER_MAPS.includes(map as typeof LAYER_MAPS[number]) || !intOk(Number(depth), 12) || Number(depth) < 1;})) return false;
  if (codex.claimed.some(id => !CODEX_GIFTS.some(gift => gift.id === id))) return false;
  if (!r.audio || !intOk(r.audio.bgm, 100) || !intOk(r.audio.sfx, 100) || typeof r.audio.muted !== 'boolean') return false;
  const cooking = r.cooking;
  if (!cooking || !unique(cooking.discovered, RECIPES.length) || cooking.discovered.some(id => !RECIPES.some(recipe => recipe.id === id)) || !dateOk(cooking.contestDate) || !intOk(cooking.contestScore, 10000) || !intOk(cooking.best, 10000)) return false;
  if (!r.shrine || !dateOk(r.shrine.date) || !['', 'sprout', 'bounty', 'drizzle', 'glow'].includes(r.shrine.blessing)) return false;
  if (!r.neighbors || !dateOk(r.neighbors.week) || !Array.isArray(r.neighbors.quests) || r.neighbors.quests.length !== 3) return false;
  if (!r.neighbors.quests.every((quest, index) => quest.id === QUEST_DEFS[index].id && quest.kind === QUEST_DEFS[index].kind && quest.target === QUEST_DEFS[index].target && intOk(quest.progress, quest.target) && typeof quest.claimed === 'boolean' && quest.npc === QUEST_DEFS[index].npc)) return false;
  const order = r.tomorrow?.order;
  if (!r.tomorrow || (order !== null && (!order || typeof order.person !== 'string' || typeof order.message !== 'string' || !dateOk(order.due) || order.due === '' || typeof order.accepted !== 'boolean' || !intOk(order.coins, 100000) || !intOk(order.xp, 100000) || !order.needs || Object.keys(order.needs).length === 0 || !Object.entries(order.needs).every(([id, amount]) => TOMORROW.some(row => row.needs[id as ProductId]) && intOk(amount, 9) && amount! > 0)))) return false;
  if (!intOk(r.decorBest, 100000) || !intOk(r.decorShared, 100000) || !r.festivalBest || !intOk(r.festivalBest.pumpkin, 100000) || !intOk(r.festivalBest.flower, 100000)) return false;
  const share = r.share;
  if (!share || !validInviteCode(share.code) || typeof share.redeemed !== 'boolean' || !unique(share.seen, 80) || !unique(share.shared, 80) || share.shared.some(id => !share.seen.includes(id)) || !momentOk(share.pending, share.seen) || !momentOk(share.latest, share.seen)) return false;
  if (!r.hud || typeof r.hud.left !== 'boolean' || typeof r.hud.right !== 'boolean') return false;
  return true;
}

export function toggleHud(s: FarmState, side: 'left' | 'right'): Result {
  if (!s.retention?.hud || (side !== 'left' && side !== 'right')) return fail(t('hud.leftShow'));
  s.retention.hud[side] = !s.retention.hud[side];
  const open = s.retention.hud[side];
  return ok(t(side === 'left' ? (open ? 'hud.leftShow' : 'hud.leftHide') : (open ? 'hud.rightShow' : 'hud.rightHide'), {}, loc(s)));
}

function ensureToday(s: FarmState, now: number) {
  const today = localDate(now);
  const list = s.retention.checklist;
  if (list.date !== today) {
    list.date = today;
    list.harvest = list.plant = list.water = list.festival = list.login = list.claimed = false;
  }
  if (s.retention.shrine.date && s.retention.shrine.date !== today) s.retention.shrine = {date: '', blessing: ''};
  const week = weekKey(now);
  if (s.retention.neighbors.week !== week) {
    s.retention.neighbors.week = week;
    s.retention.neighbors.quests = freshQuests();
  }
  const order = s.retention.tomorrow.order;
  if (order && order.due < today) s.retention.tomorrow.order = null;
}

export function touchRetention(s: FarmState, now = Date.now()) {
  if (!s.retention) return;
  ensureToday(s, now);
  s.retention.checklist.login = true;
  syncCodex(s);
}

function bumpQuest(s: FarmState, kind: QuestKind, now: number) {
  ensureToday(s, now);
  for (const quest of s.retention.neighbors.quests) if (quest.kind === kind && quest.progress < quest.target) quest.progress++;
}

function queue(s: FarmState, moment: Omit<ShareMoment, 'at'>, now: number) {
  const share = s.retention.share;
  if (share.seen.includes(moment.id)) return;
  share.seen.push(moment.id);
  if (share.seen.length > 80) share.seen.splice(0, share.seen.length - 80);
  share.shared = share.shared.filter(id => share.seen.includes(id));
  const card: ShareMoment = {...moment, at: now};
  share.pending = card;
  share.latest = card;
}

function tryTutorial(s: FarmState, action: TutorialAction, now: number) {
  const tutorial = s.retention.tutorial;
  if (tutorial.step >= TUTORIAL_STEPS.length || TUTORIAL_STEPS[tutorial.step].action !== action) return;
  advanceTutorial(s, action, now);
}

export function tutorialDone(s: FarmState): boolean {
  return !s.retention || s.retention.tutorial.step >= TUTORIAL_STEPS.length;
}

export function tutorialPrompt(s: FarmState): {title: string; body: string; canContinue: boolean} | null {
  if (tutorialDone(s)) return null;
  const step = TUTORIAL_STEPS[s.retention.tutorial.step];
  const id = step.title.replace('.title', '');
  return {title: t(step.title, {}, loc(s)), body: t(`${id}.body`, {}, loc(s)), canContinue: step.action === 'continue'};
}

export function nextDayHooks(s: FarmState): string[] {
  return [1, 2, 3, 4].map(index => t(`tut.hook${index}`, {}, loc(s)));
}

export function advanceTutorial(s: FarmState, action: TutorialAction, now = Date.now()): Result {
  if (!s.retention) return fail(t('tut.done'));
  if (tutorialDone(s)) return fail(t('tut.done', {}, loc(s)));
  if (TUTORIAL_STEPS[s.retention.tutorial.step].action !== action) return fail(tutorialPrompt(s)!.body);
  s.retention.tutorial.step++;
  if (tutorialDone(s)) {
    s.retention.tutorial.finishedAt = now;
    return ok(t('tut.finished', {}, loc(s)));
  }
  return ok(tutorialPrompt(s)!.title);
}

export function skipTutorial(s: FarmState, now = Date.now()): Result {
  if (!s.retention || tutorialDone(s)) return fail(t('tut.done', {}, loc(s)));
  s.retention.tutorial.step = TUTORIAL_STEPS.length;
  s.retention.tutorial.skipped = true;
  s.retention.tutorial.finishedAt = now;
  return ok(t('tut.skipped', {}, loc(s)));
}

function addUnique(list: string[], id: string) {
  if (!list.includes(id)) list.push(id);
}

export function syncCodex(s: FarmState, now = Date.now()) {
  if (!s.retention) return;
  const codex = s.retention.codex;
  const before = new Set(CODEX_GIFTS.filter(gift => codex[gift.kind].length >= gift.n).map(gift => gift.id));
  for (const plot of s.plots) if (plot.crop && CROP_IDS.includes(plot.crop)) addUnique(codex.crops, plot.crop);
  for (const [id, count] of Object.entries(s.features?.album?.counts || {})) if (count && CROP_IDS.includes(id)) addUnique(codex.crops, id);
  for (const animal of s.animals || []) addUnique(codex.animals, animal.type);
  for (const item of s.advanced?.room?.items || []) addUnique(codex.furniture, item.type);
  for (const id of s.life?.home?.owned || []) addUnique(codex.furniture, id);
  for (const map of LAYER_MAPS) {
    const depth = Math.max(s.advanced?.explore?.best?.[map] || 0, s.advanced?.explore?.claimed?.[map] || 0);
    for (let layer = 1; layer <= depth && layer <= 12; layer++) addUnique(codex.layers, `${map}:${layer}`);
  }
  if (!codex.primed) {
    codex.primed = true;
    return;
  }
  for (const gift of CODEX_GIFTS) {
    if (!before.has(gift.id) && codex[gift.kind].length >= gift.n) queue(s, {id: `codex-${gift.id}`, kind: 'codex', score: gift.n, token: gift.id}, now);
  }
}

export function decorScore(s: FarmState): number {
  const placed = s.decorations?.length || 0;
  const types = new Set((s.decorations || []).map(item => item.type)).size;
  const rare = (s.decorations || []).filter(item => RARE_DECOS.has(item.type)).length;
  const room = s.advanced?.room?.items?.filter(item => item.x !== null).length || 0;
  return placed * 8 + types * 6 + rare * 12 + room * 5;
}

export function noteDecor(s: FarmState, now = Date.now()) {
  if (!s.retention) return;
  syncCodex(s);
  const score = decorScore(s);
  const previous = s.retention.decorBest;
  if (score > previous) s.retention.decorBest = score;
  if (score >= 40 && score >= s.retention.decorShared + 15 && score > previous) {
    s.retention.decorShared = score;
    queue(s, {id: `decor-${score}`, kind: 'decor', score, token: ''}, now);
  }
}

export function noteHarvest(s: FarmState, cropId: string, now = Date.now()) {
  if (!s.retention) return;
  ensureToday(s, now);
  s.retention.checklist.harvest = true;
  if (CROP_IDS.includes(cropId)) addUnique(s.retention.codex.crops, cropId);
  bumpQuest(s, 'harvest', now);
  const today = localDate(now);
  const streak = s.retention.harvestStreak;
  if (streak.last !== today) {
    streak.days = streak.last === shiftLocal(today, -1) ? streak.days + 1 : 1;
    streak.last = today;
    for (const title of TITLES) if (streak.days >= title.days && !streak.titles.includes(title.id)) {
      streak.titles.push(title.id);
      if (title.days === 7) queue(s, {id: 'harvest-streak-7', kind: 'streak', score: 7, token: title.id}, now);
    }
  }
  if (s.stats.harvests === 1) queue(s, {id: 'first-harvest', kind: 'first-harvest', score: 1, token: cropId}, now);
  tryTutorial(s, 'harvest', now);
  syncCodex(s, now);
}

export function notePlant(s: FarmState, cropId: string, now = Date.now()) {
  if (!s.retention) return;
  ensureToday(s, now);
  s.retention.checklist.plant = true;
  s.retention.counts.plants++;
  if (CROP_IDS.includes(cropId)) addUnique(s.retention.codex.crops, cropId);
  tryTutorial(s, 'plant', now);
  syncCodex(s, now);
}

export function noteWater(s: FarmState, now = Date.now()) {
  if (!s.retention) return;
  ensureToday(s, now);
  s.retention.checklist.water = true;
  s.retention.counts.waters++;
  bumpQuest(s, 'water', now);
  tryTutorial(s, 'water', now);
}

export function noteDeliver(s: FarmState, now = Date.now()) {
  if (!s.retention) return;
  bumpQuest(s, 'deliver', now);
}

export function noteFestivalPlay(s: FarmState, now = Date.now()) {
  if (!s.retention) return;
  ensureToday(s, now);
  s.retention.checklist.festival = true;
}

export function noteFestivalScore(s: FarmState, kind: 'pumpkin' | 'flower', score: number, now = Date.now()) {
  noteFestivalPlay(s, now);
  if (!s.retention || score <= s.retention.festivalBest[kind]) return;
  s.retention.festivalBest[kind] = score;
  queue(s, {id: `festival-${kind}-${score}`, kind: 'festival', score, token: kind}, now);
}

export function noteRedSoil(s: FarmState, now = Date.now()) {
  if (!s.retention) return;
  if (s.plots.some(plot => plot.soil === 2)) queue(s, {id: 'red-soil', kind: 'red-soil', score: 2, token: ''}, now);
}

export function noteRecipe(s: FarmState, id: string, now = Date.now()) {
  if (!s.retention || s.retention.cooking.discovered.includes(id) || !RECIPES.some(recipe => recipe.id === id)) return;
  s.retention.cooking.discovered.push(id);
  if (!STARTERS.has(id)) queue(s, {id: `recipe-${id}`, kind: 'recipe', score: 0, token: id}, now);
}

export function markFestival(s: FarmState, now = Date.now()): Result {
  noteFestivalPlay(s, now);
  return ok(t('check.glanced', {}, loc(s)));
}

export function claimChecklist(s: FarmState, now = Date.now()): Result {
  if (!s.retention) return fail(t('check.need'));
  ensureToday(s, now);
  const list = s.retention.checklist;
  if (list.claimed) return fail(t('check.done', {}, loc(s)));
  if (!list.harvest || !list.plant || !list.water || !list.festival || !list.login) return fail(t('check.need', {}, loc(s)));
  const today = localDate(now);
  list.streak = list.lastComplete === shiftLocal(today, -1) ? list.streak + 1 : 1;
  list.lastComplete = today;
  list.best = Math.max(list.best, list.streak);
  list.claimed = true;
  const coins = 20 + list.streak * 5;
  s.coins += coins;
  s.stars += 1;
  if (list.streak === 7) queue(s, {id: 'checklist-streak-7', kind: 'streak', score: 7, token: 'checklist'}, now);
  return ok(t('check.paid', {coins, n: list.streak}, loc(s)));
}

export function claimLogin(s: FarmState, now = Date.now()): Result {
  if (!s.retention) return fail(t('login.today'));
  ensureToday(s, now);
  const today = localDate(now);
  const login = s.retention.login;
  if (login.last === today) return fail(t('login.today', {}, loc(s)));
  const index = login.last === shiftLocal(today, -1) ? login.next : 0;
  const reward = LOGIN_REWARDS[index];
  if (reward.coins) s.coins += reward.coins;
  if (reward.stars) s.stars += reward.stars;
  if (reward.item && reward.amount) s.inventory[reward.item] += reward.amount;
  login.last = today;
  if (index === 6) {
    login.cycles++;
    login.next = 0;
    queue(s, {id: 'login-streak-7', kind: 'streak', score: 7, token: 'login'}, now);
  } else login.next = index + 1;
  return ok(t('login.paid', {n: index + 1}, loc(s)));
}

export const achievementList = ACHIEVEMENTS;
export function achievementReady(s: FarmState, id: string): boolean {
  const item = ACHIEVEMENTS.find(entry => entry.id === id);
  return !!item && !s.retention.medals.includes(id) && item.met(s);
}
export function claimAchievement(s: FarmState, id: string): Result {
  const item = ACHIEVEMENTS.find(entry => entry.id === id);
  if (!item || !s.retention) return fail(t('ach.locked', {}, loc(s)));
  if (s.retention.medals.includes(id)) return fail(t('ach.have', {}, loc(s)));
  if (!item.met(s)) return fail(t('ach.locked', {}, loc(s)));
  s.retention.medals.push(id);
  s.coins += item.coins;
  return ok(t('ach.paid', {coins: item.coins}, loc(s)));
}

export function claimCodex(s: FarmState, id: string): Result {
  const gift = CODEX_GIFTS.find(entry => entry.id === id);
  if (!gift || !s.retention) return fail(t('codex.have', {}, loc(s)));
  if (s.retention.codex.claimed.includes(id)) return fail(t('codex.have', {}, loc(s)));
  if (s.retention.codex[gift.kind].length < gift.n) return fail(t('ach.locked', {}, loc(s)));
  s.retention.codex.claimed.push(id);
  s.coins += gift.coins;
  return ok(t('codex.paid', {coins: gift.coins}, loc(s)));
}
export const codexGifts = CODEX_GIFTS;

export function revealRecipe(s: FarmState, now = Date.now()): Result {
  if (!s.retention) return fail(t('cook.none'));
  const hidden = RECIPES.filter(recipe => !s.retention.cooking.discovered.includes(recipe.id) && farmLevel(s.xp) >= recipe.level);
  if (!hidden.length) return fail(t('cook.none', {}, loc(s)));
  if (s.coins < 40) return fail(t('cook.coins', {}, loc(s)));
  s.coins -= 40;
  const pick = hidden[Math.abs(hash(localDate(now))) % hidden.length];
  noteRecipe(s, pick.id, now);
  return ok(itemName(pick.id, pick.name, loc(s)));
}

export function enterContest(s: FarmState, id: string, now = Date.now()): Result {
  if (!s.retention) return fail(t('cook.today'));
  ensureToday(s, now);
  const today = localDate(now);
  if (s.retention.cooking.contestDate === today) return fail(t('cook.today', {}, loc(s)));
  const recipe = RECIPES.find(entry => entry.id === id);
  if (!recipe || !s.retention.cooking.discovered.includes(id)) return fail(t('cook.locked', {}, loc(s)));
  if (!Object.entries(recipe.needs).every(([item, amount]) => s.inventory[item as ProductId] >= amount!)) return fail(t('cook.need', {}, loc(s)));
  for (const [item, amount] of Object.entries(recipe.needs)) s.inventory[item as ProductId] -= amount!;
  const score = 40 + recipe.level * 5;
  s.retention.cooking.contestDate = today;
  s.retention.cooking.contestScore = score;
  s.retention.cooking.best = Math.max(s.retention.cooking.best, score);
  s.retention.counts.cooks++;
  s.coins += score;
  s.xp += 12;
  s.stars += score >= 90 ? 2 : 1;
  const hidden = RECIPES.find(entry => !s.retention.cooking.discovered.includes(entry.id) && farmLevel(s.xp) >= entry.level);
  if (hidden) noteRecipe(s, hidden.id, now);
  return ok(t('cook.paid', {score}, loc(s)));
}

export function pickBlessing(s: FarmState, blessing: Blessing, now = Date.now()): Result {
  if (!s.retention || !['sprout', 'bounty', 'drizzle', 'glow'].includes(blessing)) return fail(t('shrine.have'));
  ensureToday(s, now);
  const today = localDate(now);
  if (s.retention.shrine.date === today && s.retention.shrine.blessing) return fail(t('shrine.have', {}, loc(s)));
  s.retention.shrine = {date: today, blessing};
  return ok(t('shrine.paid', {}, loc(s)));
}

export function shrineGrowFactor(s: FarmState, now = Date.now()): number {
  return s.retention?.shrine.blessing === 'sprout' && s.retention.shrine.date === localDate(now) ? 0.9 : 1;
}
export function shrineWaterExtraMs(s: FarmState, growSeconds: number, now = Date.now()): number {
  return s.retention?.shrine.blessing === 'drizzle' && s.retention.shrine.date === localDate(now) ? growSeconds * 100 : 0;
}
export function shrineHarvestBonus(s: FarmState, now = Date.now()): {coins: number; xp: number} {
  if (!s.retention || s.retention.shrine.date !== localDate(now)) return {coins: 0, xp: 0};
  if (s.retention.shrine.blessing === 'bounty') return {coins: 3, xp: 0};
  if (s.retention.shrine.blessing === 'glow') return {coins: 0, xp: 1};
  return {coins: 0, xp: 0};
}

export function claimNeighbor(s: FarmState, id: string, now = Date.now()): Result {
  if (!s.retention) return fail(t('neighbor.need'));
  ensureToday(s, now);
  const quest = s.retention.neighbors.quests.find(entry => entry.id === id);
  if (!quest || quest.claimed) return fail(t('neighbor.need', {}, loc(s)));
  if (quest.progress < quest.target) return fail(t('neighbor.need', {}, loc(s)));
  quest.claimed = true;
  s.coins += quest.coins;
  s.stars += quest.stars;
  s.retention.counts.neighborClaims++;
  return ok(t('neighbor.paid', {name: quest.npc}, loc(s)));
}

function hash(value: string): number {
  let n = 0;
  for (const char of value) n = (Math.imul(n, 33) + char.charCodeAt(0)) >>> 0;
  return n;
}

export function tomorrowOffer(s: FarmState, now = Date.now()): TomorrowOrder {
  const today = localDate(now);
  const template = TOMORROW[hash(today) % TOMORROW.length];
  return {...template, needs: {...template.needs}, due: shiftLocal(today, 1), accepted: false};
}

export function acceptTomorrow(s: FarmState, now = Date.now()): Result {
  if (!s.retention) return fail(t('tomorrow.held'));
  ensureToday(s, now);
  const today = localDate(now);
  const current = s.retention.tomorrow.order;
  if (current?.accepted && current.due >= today) return fail(t('tomorrow.held', {}, loc(s)));
  s.retention.tomorrow.order = {...tomorrowOffer(s, now), accepted: true};
  return ok(t('tomorrow.accept', {}, loc(s)));
}

export function deliverTomorrow(s: FarmState, now = Date.now()): Result {
  if (!s.retention) return fail(t('tomorrow.empty'));
  ensureToday(s, now);
  const order = s.retention.tomorrow.order;
  const today = localDate(now);
  if (!order?.accepted) return fail(t('tomorrow.empty', {}, loc(s)));
  if (today < order.due) return fail(t('tomorrow.wait', {}, loc(s)));
  if (today > order.due) {
    s.retention.tomorrow.order = null;
    return fail(t('tomorrow.missed', {}, loc(s)));
  }
  const needs = Object.entries(order.needs) as [ProductId, number][];
  if (needs.some(([id, amount]) => s.inventory[id] < amount)) return fail(t('tomorrow.short', {}, loc(s)));
  for (const [id, amount] of needs) s.inventory[id] -= amount;
  const coins = Math.round(order.coins * 1.2);
  s.coins += coins;
  s.xp += order.xp;
  s.stars += 1;
  s.retention.counts.tomorrowDeliveries++;
  s.retention.tomorrow.order = null;
  return ok(t('tomorrow.paid', {coins}, loc(s)));
}

export function setVolume(s: FarmState, kind: 'bgm' | 'sfx', value: number): Result {
  if (!s.retention || !Number.isFinite(value)) return fail(t('settings.bgm'));
  s.retention.audio[kind] = Math.max(0, Math.min(100, Math.round(value)));
  return ok(`${s.retention.audio[kind]}%`);
}
export function toggleMute(s: FarmState): Result {
  if (!s.retention) return fail(t('settings.mute'));
  s.retention.audio.muted = !s.retention.audio.muted;
  return ok(t(s.retention.audio.muted ? 'settings.mute' : 'settings.unmute', {}, loc(s)));
}
export function setFarmLocale(s: FarmState, locale: string): Result {
  if (!s.retention || !isLocale(locale)) return fail(t('settings.lang'));
  s.retention.locale = locale;
  s.retention.localeSet = true;
  return ok(t('settings.lang', {}, locale));
}

export function dismissShare(s: FarmState): Result {
  if (s.retention) s.retention.share.pending = null;
  return ok(t('hud.later', {}, loc(s)));
}
export function markShared(s: FarmState, id: string) {
  if (!s.retention || !id || id === 'invite') return;
  if (!s.retention.share.shared.includes(id)) s.retention.share.shared.push(id);
  if (s.retention.share.pending?.id === id) s.retention.share.pending = null;
}
export function sharePayloadFor(s: FarmState, which: 'invite' | 'pending' | 'latest') {
  const moment = which === 'pending' ? s.retention.share.pending : which === 'latest' ? s.retention.share.latest : null;
  if (which !== 'invite' && !moment) return null;
  return composeShare(s.retention.locale, s.retention.share.code, moment);
}

export function redeemInvite(s: FarmState, code: string): Result {
  if (!s.retention) return fail(t('share.redeem.bad'));
  if (s.retention.share.redeemed) return fail(t('share.redeem.used', {}, loc(s)));
  const value = code.trim().toUpperCase();
  if (!validInviteCode(value)) return fail(t('share.redeem.bad', {}, loc(s)));
  if (value === s.retention.share.code) return fail(t('share.redeem.own', {}, loc(s)));
  s.retention.share.redeemed = true;
  s.coins += 40;
  s.inventory.wheat += 2;
  s.stars += 1;
  return ok(t('share.redeem.ok', {}, loc(s)));
}

export function audioMix(s: FarmState) {
  const audio = s.retention?.audio || {bgm: 80, sfx: 80, muted: false};
  return {
    music: s.music && !audio.muted && audio.bgm > 0,
    sound: s.sound && !audio.muted && audio.sfx > 0,
    bgm: audio.muted ? 0 : audio.bgm / 100,
    sfx: audio.muted || !s.sound ? 0 : audio.sfx / 100,
  };
}

craftHooks.onCraft = (s, id) => noteRecipe(s, id);
