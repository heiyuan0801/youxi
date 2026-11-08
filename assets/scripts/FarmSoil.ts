import type {FarmState, Result} from './FarmModel';
import {t} from './SoilText';
import {noteRedSoil} from './FarmRetention';
import {t as retentionText} from './FarmI18n';

export type SoilTier = 0 | 1 | 2;

/**
 * Plot soil tiers. Growth is applied when a crop is planted, on top of irrigation
 * (`crop.seconds * (1 - 0.1 * irrigationLevel) * growth`). The result is stored on
 * the plot as growSeconds, so a later upgrade does not rewrite a crop already in the ground.
 *
 * | tier | name     | growth | faster | water cut |
 * | 0    | 普通土地 | 1.00   | —      | 20%       |
 * | 1    | 黑土地   | 0.80   | 20%    | 30%       |
 * | 2    | 红土地   | 0.65   | 35%    | 40%       |
 *
 * Water cut is the share of the stored growSeconds removed by one watering or one rain.
 * Tier 0 keeps the original 20% (`growSeconds * 200` ms). Higher tiers hold water better.
 *
 * Upgrade cost is charged once per plot, only for the next tier:
 *   普通土地 → 黑土地: 100 coins
 *   黑土地 → 红土地: 240 coins + 2 feed (饲料, mill recipe: 2 wheat → 3 feed)
 * Flooded plots (`activities.stormPlot`) and locked plots cannot be upgraded or batch-planted.
 */
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
export const SOIL_NAME: Record<SoilTier, 'soil.normal' | 'soil.black' | 'soil.red'> = {
  0: 'soil.normal', 1: 'soil.black', 2: 'soil.red',
};
export const SOIL_GROWTH_LABEL: Record<SoilTier, string> = {0: '×1.00', 1: '×0.80', 2: '×0.65'};
export const SOIL_WATER_LABEL: Record<SoilTier, string> = {0: '20%', 1: '30%', 2: '40%'};
export const SOIL_EMPTY = ['#cf9160', '#5c5148', '#e07a62'] as const;
export const SOIL_CROP = ['#a8693f', '#4a4038', '#b94a3c'] as const;
export const SOIL_EDGE = ['#8e5a37', '#2c2622', '#8d3028'] as const;
export const SOIL_FURROW = ['#b78055', '#6d6258', '#f0b2a4'] as const;
export const SOIL_FURROW_CROP = ['#945d3d', '#3a332e', '#8d3d32'] as const;

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

export function soilCostLabel(tier: SoilTier, locale?: string): string {
  const cost = SOIL_COST[tier];
  return cost.feed
    ? t('soil.costFeed', {coins: cost.coins, feed: cost.feed}, locale)
    : t('soil.costCoins', {coins: cost.coins}, locale);
}

const fail = (message: string): Result => ({ok: false, message});

export function upgradeSoil(s: FarmState, index: number, now = Date.now()): Result {
  const plot = Number.isInteger(index) ? s.plots[index] : undefined;
  const locale = s.locale;
  if (!plot?.unlocked) return fail(t('soil.locked', {}, locale));
  if (s.activities.stormPlot === index) return fail(t('soil.flood', {}, locale));
  const tier = soilTier(plot);
  if (tier >= 2) return fail(t('soil.max', {}, locale));
  const next = (tier + 1) as SoilTier;
  const cost = SOIL_COST[next];
  const name = t(SOIL_NAME[next], {}, locale);
  if (s.coins < cost.coins) return fail(t('soil.coins', {name, coins: cost.coins}, locale));
  if (cost.feed > 0 && s.inventory.feed < cost.feed) return fail(t('soil.feed', {name, feed: cost.feed}, locale));
  s.coins -= cost.coins;
  if (cost.feed > 0) s.inventory.feed -= cost.feed;
  plot.soil = next;
  if (next === 2) noteRedSoil(s, now);
  return {ok: true, message: t('soil.done', {name, growth: SOIL_GROWTH_LABEL[next], water: SOIL_WATER_LABEL[next]}, locale)};
}

export function upgradeSoilBatch(s: FarmState, now = Date.now()): Result {
  const indexes = s.plots.map((_, index) => index).filter(index => {
    const plot = s.plots[index];
    return plot.unlocked && s.activities.stormPlot !== index && soilTier(plot) < 2;
  });
  if (!indexes.length) return fail(retentionText('soil.batchNone', {}, s.locale));
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
    const cost = SOIL_COST[next], name = t(SOIL_NAME[next], {}, s.locale);
    return s.coins < cost.coins
      ? fail(t('soil.coins', {name, coins: cost.coins}, s.locale))
      : fail(t('soil.feed', {name, feed: cost.feed}, s.locale));
  }
  s.coins -= coins;
  s.inventory.feed -= feed;
  for (const step of plan) s.plots[step.index].soil = step.next;
  if (plan.some(step => step.next === 2)) noteRedSoil(s, now);
  return {ok: true, message: retentionText('soil.batch', {n: plan.length}, s.locale)};
}
