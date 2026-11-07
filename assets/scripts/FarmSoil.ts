import type {FarmState, Result} from './FarmModel';
import {noteRedSoil} from './FarmRetention';
import {t} from './FarmI18n';

export type SoilTier = 0 | 1 | 2;

/** Same tiers as the open soil-upgrade branch: growth is stored on plant, not rewritten later. */
export const SOIL_GROWTH: Record<SoilTier, {num: number; den: number}> = {
  0: {num: 1, den: 1},
  1: {num: 4, den: 5},
  2: {num: 13, den: 20},
};
export const SOIL_WATER: Record<SoilTier, {num: number; den: number}> = {
  0: {num: 1, den: 5},
  1: {num: 3, den: 10},
  2: {num: 2, den: 5},
};
export const SOIL_COST: Record<SoilTier, {coins: number; feed: number}> = {
  0: {coins: 0, feed: 0},
  1: {coins: 100, feed: 0},
  2: {coins: 240, feed: 2},
};
export const SOIL_GROWTH_LABEL: Record<SoilTier, string> = {0: '×1.00', 1: '×0.80', 2: '×0.65'};
export const SOIL_WATER_LABEL: Record<SoilTier, string> = {0: '20%', 1: '30%', 2: '40%'};

export function soilTier(plot: {soil?: number} | undefined): SoilTier {
  return plot?.soil === 1 || plot?.soil === 2 ? plot.soil : 0;
}

export function cropGrowSeconds(baseSeconds: number, irrigation: number, tier: SoilTier): number {
  const {num, den} = SOIL_GROWTH[tier];
  return baseSeconds * (1 - 0.1 * irrigation) * num / den;
}

export function waterCutMs(growSeconds: number, tier: SoilTier): number {
  const {num, den} = SOIL_WATER[tier];
  return growSeconds * 1000 * num / den;
}

const fail = (message: string): Result => ({ok: false, message});
const localeOf = (s: FarmState) => s.retention?.locale;

function charge(s: FarmState, next: SoilTier): Result | null {
  const cost = SOIL_COST[next];
  const name = t(next === 2 ? 'soil.red' : 'soil.black', {}, localeOf(s));
  if (s.coins < cost.coins) return fail(t('soil.coins', {name, coins: cost.coins}, localeOf(s)));
  if (cost.feed > 0 && s.inventory.feed < cost.feed) return fail(t('soil.feed', {name, feed: cost.feed}, localeOf(s)));
  s.coins -= cost.coins;
  if (cost.feed > 0) s.inventory.feed -= cost.feed;
  return null;
}

export function upgradeSoil(s: FarmState, index: number, now = Date.now()): Result {
  const plot = Number.isInteger(index) ? s.plots[index] : undefined;
  if (!plot?.unlocked) return fail(t('soil.locked', {}, localeOf(s)));
  if (s.activities.stormPlot === index) return fail(t('soil.flood', {}, localeOf(s)));
  const tier = soilTier(plot);
  if (tier >= 2) return fail(t('soil.max', {}, localeOf(s)));
  const next = (tier + 1) as SoilTier;
  const denied = charge(s, next);
  if (denied) return denied;
  plot.soil = next;
  if (next === 2) noteRedSoil(s, now);
  const name = t(next === 2 ? 'soil.red' : 'soil.black', {}, localeOf(s));
  return {ok: true, message: t('soil.done', {name, growth: SOIL_GROWTH_LABEL[next], water: SOIL_WATER_LABEL[next]}, localeOf(s))};
}

export function upgradeSoilBatch(s: FarmState, now = Date.now()): Result {
  const indexes = s.plots.map((_, index) => index).filter(index => {
    const plot = s.plots[index];
    return plot.unlocked && s.activities.stormPlot !== index && soilTier(plot) < 2;
  });
  if (!indexes.length) return fail(t('soil.batchNone', {}, localeOf(s)));
  let coins = 0;
  let feed = 0;
  const plan: {index: number; next: SoilTier}[] = [];
  for (const index of indexes) {
    const next = (soilTier(s.plots[index]) + 1) as SoilTier;
    const cost = SOIL_COST[next];
    if (s.coins < coins + cost.coins || s.inventory.feed < feed + cost.feed) continue;
    coins += cost.coins;
    feed += cost.feed;
    plan.push({index, next});
  }
  if (!plan.length) {
    const next = (soilTier(s.plots[indexes[0]]) + 1) as SoilTier;
    return charge(s, next) || fail(t('soil.batchNone', {}, localeOf(s)));
  }
  s.coins -= coins;
  s.inventory.feed -= feed;
  for (const step of plan) s.plots[step.index].soil = step.next;
  if (plan.some(step => step.next === 2)) noteRedSoil(s, now);
  return {ok: true, message: t('soil.batch', {n: plan.length}, localeOf(s))};
}
