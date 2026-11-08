import type {FarmState, ProductId, Result} from './FarmModel';
import {discover, farmLevel} from './FarmFeatures';
import {seasonIndex} from './FarmLife';
import {itemName, t} from './FarmI18n';

export type SpotId = 'home' | 'beach' | 'snow';
export type BaitId = 'worm' | 'dough' | 'lure';
export type FishId = 'fish' | 'crucian' | 'carp' | 'bass' | 'crab' | 'goldenFish';

export interface FishSpec {
  id: FishId;
  spots: SpotId[];
  seasons: number[];
  baits: BaitId[];
  weight: number;
  pulls: number;
  width: number;
  fingerling: number;
  growMs: number;
  level: number;
}

export const FISH: readonly FishSpec[] = [
  {id: 'fish', spots: ['home'], seasons: [0, 1, 2, 3], baits: ['worm', 'dough'], weight: 8, pulls: 1, width: 30, fingerling: 24, growMs: 45000, level: 6},
  {id: 'crucian', spots: ['home'], seasons: [0, 1, 2], baits: ['worm', 'dough'], weight: 5, pulls: 1, width: 26, fingerling: 40, growMs: 70000, level: 8},
  {id: 'carp', spots: ['home', 'beach'], seasons: [1, 2], baits: ['dough'], weight: 4, pulls: 2, width: 20, fingerling: 70, growMs: 90000, level: 10},
  {id: 'crab', spots: ['beach'], seasons: [1, 2, 3], baits: ['worm'], weight: 3, pulls: 2, width: 18, fingerling: 90, growMs: 110000, level: 12},
  {id: 'bass', spots: ['beach'], seasons: [1, 2], baits: ['lure'], weight: 3, pulls: 2, width: 16, fingerling: 120, growMs: 130000, level: 14},
  {id: 'goldenFish', spots: ['home', 'snow'], seasons: [0, 3], baits: ['lure'], weight: 1, pulls: 3, width: 12, fingerling: 220, growMs: 180000, level: 20},
];

export const BAITS: readonly {id: BaitId; pack: number; cost: number}[] = [
  {id: 'worm', pack: 4, cost: 16},
  {id: 'dough', pack: 3, cost: 28},
  {id: 'lure', pack: 2, cost: 48},
];

export const POND_UNLOCK_LEVEL = 6;
export const POND_UNLOCK_COST = 220;
export const POND_UPGRADES = [
  {level: 8, cost: 180},
  {level: 12, cost: 320},
  {level: 18, cost: 480},
] as const;

export interface Reel {
  pulls: number;
  hits: number;
  startedAt: number;
  period: number;
  zone: number;
  width: number;
}

export interface CastSession {
  serial: number;
  spot: SpotId;
  bait: BaitId;
  species: FishId;
  biteAt: number;
  escapeAt: number;
  reel: Reel | null;
}

export interface PondFish {
  id: number;
  species: FishId;
  fed: boolean;
  readyAt: number;
}

export interface Fishery {
  schema: 1;
  serial: number;
  bait: Record<BaitId, number>;
  session: CastSession | null;
  codex: FishId[];
  pond: {unlocked: boolean; upgrades: number; nextId: number; stock: PondFish[]};
}

const fail = (message: string): Result => ({ok: false, message});
const ok = (message: string, item?: ProductId): Result => ({ok: true, message, item});
const localeOf = (s: FarmState) => s.retention?.locale;
const fishById = (id: string) => FISH.find(fish => fish.id === id);

export function newFishery(): Fishery {
  return {schema: 1, serial: 0, bait: {worm: 4, dough: 0, lure: 0}, session: null, codex: [], pond: {unlocked: false, upgrades: 0, nextId: 1, stock: []}};
}

export function pondCapacity(f: Fishery): number {
  return 2 + f.pond.upgrades * 2;
}

export function reelMarker(reel: Pick<Reel, 'startedAt' | 'period'>, now: number): number {
  const span = reel.period * 2;
  const elapsed = Math.max(0, now - reel.startedAt) % span;
  const pos = elapsed <= reel.period ? elapsed / reel.period : (span - elapsed) / reel.period;
  return Math.round(pos * 1000) / 10;
}

export function reelHit(reel: Reel, now: number): boolean {
  const marker = reelMarker(reel, now);
  return marker >= reel.zone && marker <= reel.zone + reel.width;
}

export function zoneFor(serial: number, width: number): number {
  const n = (Math.imul(serial || 1, 1664525) + 1013904223) >>> 0;
  return n % (100 - width + 1);
}

export function rollSpecies(spot: SpotId, season: number, bait: BaitId, serial: number): FishId {
  const seasonIndex = ((season % 4) + 4) % 4;
  const pool = FISH.filter(fish => fish.spots.includes(spot) && fish.seasons.includes(seasonIndex) && fish.baits.includes(bait));
  const list = pool.length ? pool : FISH.filter(fish => fish.id === 'fish');
  const total = list.reduce((sum, fish) => sum + fish.weight, 0);
  let pick = ((Math.imul(serial, 1103515245) + seasonIndex * 13 + bait.length * 17) >>> 0) % total;
  for (const fish of list) {
    if (pick < fish.weight) return fish.id;
    pick -= fish.weight;
  }
  return list[0].id;
}

export function spotOpen(s: FarmState, spot: SpotId): boolean {
  if (spot === 'home') return true;
  return s.life.maps.includes(spot) || s.life.activeMap === spot;
}

export type AnglingPhase = 'idle' | 'waiting' | 'bite' | 'reel' | 'escaped';
export function anglingPhase(s: FarmState, now = Date.now()): AnglingPhase {
  const session = s.fishery?.session;
  if (!session) return 'idle';
  if (session.reel) return 'reel';
  if (now < session.biteAt) return 'waiting';
  if (now <= session.escapeAt) return 'bite';
  return 'escaped';
}

function remember(s: FarmState, species: FishId) {
  if (!s.fishery.codex.includes(species)) s.fishery.codex.push(species);
  discover(s, species);
}

export function castRod(s: FarmState, spot: SpotId, bait: BaitId, now = Date.now()): Result {
  const fishery = s.fishery;
  if (!fishery || !FISH.some(fish => fish.spots.includes(spot)) || !BAITS.some(entry => entry.id === bait)) return fail(t('fish.bad', {}, localeOf(s)));
  if (!spotOpen(s, spot)) return fail(t('fish.lockedSpot', {}, localeOf(s)));
  const phase = anglingPhase(s, now);
  if (phase === 'waiting' || phase === 'bite' || phase === 'reel') return fail(t('fish.busy', {}, localeOf(s)));
  if (fishery.bait[bait] < 1) return fail(t('fish.noBait', {}, localeOf(s)));
  fishery.bait[bait]--;
  const serial = ++fishery.serial;
  const season = seasonIndex(s, now);
  const species = rollSpecies(spot, season, bait, serial);
  const wait = 1800 + (serial % 5) * 350;
  fishery.session = {serial, spot, bait, species, biteAt: now + wait, escapeAt: now + wait + 3200, reel: null};
  return ok(t('fish.cast', {}, localeOf(s)));
}

export function hookBite(s: FarmState, now = Date.now()): Result {
  const session = s.fishery?.session;
  const phase = anglingPhase(s, now);
  if (!session || phase === 'idle') return fail(t('fish.needCast', {}, localeOf(s)));
  if (phase === 'waiting') return fail(t('fish.wait', {}, localeOf(s)));
  if (phase === 'escaped') {
    s.fishery.session = null;
    return fail(t('fish.escaped', {}, localeOf(s)));
  }
  if (phase === 'reel') return fail(t('fish.reeling', {}, localeOf(s)));
  const spec = fishById(session.species)!;
  session.reel = {pulls: spec.pulls, hits: 0, startedAt: now, period: 1400, zone: zoneFor(session.serial, spec.width), width: spec.width};
  return ok(t('fish.hook', {pulls: spec.pulls}, localeOf(s)));
}

export function reelCheck(s: FarmState, now = Date.now()): Result {
  const session = s.fishery?.session;
  const reel = session?.reel;
  if (!session || !reel) return fail(t('fish.needHook', {}, localeOf(s)));
  if (now > reel.startedAt + reel.period * 2 * reel.pulls + 4000) {
    s.fishery.session = null;
    return fail(t('fish.miss', {}, localeOf(s)));
  }
  if (!reelHit(reel, now)) {
    s.fishery.session = null;
    return fail(t('fish.miss', {}, localeOf(s)));
  }
  reel.hits++;
  reel.startedAt = now;
  if (reel.hits < reel.pulls) return ok(t('fish.pull', {hit: reel.hits, pulls: reel.pulls}, localeOf(s)));
  const species = session.species;
  s.fishery.session = null;
  s.inventory[species]++;
  s.features.stats.catches++;
  s.xp += fishById(species)!.pulls * 4;
  remember(s, species);
  return ok(t('fish.caught', {name: itemName(species, species, localeOf(s))}, localeOf(s)), species);
}

export function buyAnglingBait(s: FarmState, bait: BaitId): Result {
  const pack = BAITS.find(entry => entry.id === bait);
  if (!s.fishery || !pack) return fail(t('fish.bad', {}, localeOf(s)));
  if (s.fishery.bait[bait] + pack.pack > 99) return fail(t('fish.baitFull', {}, localeOf(s)));
  if (s.coins < pack.cost) return fail(t('fish.coins', {cost: pack.cost}, localeOf(s)));
  s.coins -= pack.cost;
  s.fishery.bait[bait] += pack.pack;
  return ok(t('fish.bought', {name: t(`bait.${bait}`, {}, localeOf(s)), n: pack.pack}, localeOf(s)));
}

export function unlockPond(s: FarmState): Result {
  const pond = s.fishery?.pond;
  if (!pond) return fail(t('pond.locked', {}, localeOf(s)));
  if (pond.unlocked) return fail(t('pond.have', {}, localeOf(s)));
  if (farmLevel(s.xp) < POND_UNLOCK_LEVEL) return fail(t('pond.level', {level: POND_UNLOCK_LEVEL}, localeOf(s)));
  if (s.coins < POND_UNLOCK_COST) return fail(t('fish.coins', {cost: POND_UNLOCK_COST}, localeOf(s)));
  s.coins -= POND_UNLOCK_COST;
  pond.unlocked = true;
  return ok(t('pond.unlocked', {}, localeOf(s)));
}

export function upgradePond(s: FarmState): Result {
  const pond = s.fishery?.pond;
  if (!pond?.unlocked) return fail(t('pond.locked', {}, localeOf(s)));
  const next = POND_UPGRADES[pond.upgrades];
  if (!next) return fail(t('pond.max', {}, localeOf(s)));
  if (farmLevel(s.xp) < next.level) return fail(t('pond.level', {level: next.level}, localeOf(s)));
  if (s.coins < next.cost) return fail(t('fish.coins', {cost: next.cost}, localeOf(s)));
  s.coins -= next.cost;
  pond.upgrades++;
  return ok(t('pond.upgraded', {n: pondCapacity(s.fishery)}, localeOf(s)));
}

export function stockPond(s: FarmState, species: FishId, now = Date.now()): Result {
  const spec = fishById(species);
  const pond = s.fishery?.pond;
  if (!spec || !pond) return fail(t('fish.bad', {}, localeOf(s)));
  if (!pond.unlocked) return fail(t('pond.locked', {}, localeOf(s)));
  if (farmLevel(s.xp) < spec.level) return fail(t('pond.level', {level: spec.level}, localeOf(s)));
  if (pond.stock.length >= pondCapacity(s.fishery)) return fail(t('pond.full', {}, localeOf(s)));
  if (s.coins < spec.fingerling) return fail(t('fish.coins', {cost: spec.fingerling}, localeOf(s)));
  s.coins -= spec.fingerling;
  pond.stock.push({id: pond.nextId++, species, fed: false, readyAt: now});
  return ok(t('pond.stocked', {name: itemName(species, species, localeOf(s))}, localeOf(s)));
}

export function feedPondFish(s: FarmState, id: number, now = Date.now()): Result {
  const fish = s.fishery?.pond.stock.find(entry => entry.id === id);
  const spec = fish && fishById(fish.species);
  if (!fish || !spec) return fail(t('pond.missing', {}, localeOf(s)));
  if (fish.fed) return fail(t('pond.fed', {}, localeOf(s)));
  if (s.inventory.feed < 1) return fail(t('pond.needFeed', {}, localeOf(s)));
  s.inventory.feed--;
  fish.fed = true;
  fish.readyAt = now + spec.growMs;
  return ok(t('pond.feeding', {}, localeOf(s)));
}

export function harvestPondFish(s: FarmState, id: number, now = Date.now()): Result {
  const pond = s.fishery?.pond;
  const index = pond?.stock.findIndex(entry => entry.id === id) ?? -1;
  const fish = index >= 0 ? pond!.stock[index] : undefined;
  if (!fish?.fed || now < fish.readyAt) return fail(t('pond.growing', {}, localeOf(s)));
  pond!.stock.splice(index, 1);
  s.inventory[fish.species]++;
  s.xp += 6;
  s.stats.products++;
  remember(s, fish.species);
  return ok(t('pond.harvest', {name: itemName(fish.species, fish.species, localeOf(s))}, localeOf(s)), fish.species);
}

export function sellPondFish(s: FarmState, id: number, now = Date.now()): Result {
  const pond = s.fishery?.pond;
  const index = pond?.stock.findIndex(entry => entry.id === id) ?? -1;
  const fish = index >= 0 ? pond!.stock[index] : undefined;
  if (!fish) return fail(t('pond.missing', {}, localeOf(s)));
  const price = s.inventory ? sellPrice(s, fish, now) : 0;
  pond!.stock.splice(index, 1);
  s.coins += price;
  return ok(t('pond.sold', {coins: price}, localeOf(s)));
}

function sellPrice(s: FarmState, fish: PondFish, now: number): number {
  const full = ({fish: 24, crucian: 80, carp: 65, bass: 140, crab: 210, goldenFish: 80} as Record<FishId, number>)[fish.species];
  return fish.fed && now >= fish.readyAt ? full : Math.max(1, Math.floor(full / 2));
}

const intOk = (value: unknown, max = 1e9) => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
const timeOk = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e15;

export function validFishery(f: Fishery): boolean {
  if (!f || f.schema !== 1 || !intOk(f.serial) || !f.bait) return false;
  if (!BAITS.every(bait => intOk(f.bait[bait.id], 99))) return false;
  if (!Array.isArray(f.codex) || new Set(f.codex).size !== f.codex.length || f.codex.some(id => !fishById(id))) return false;
  const session = f.session;
  if (session !== null) {
    const spec = session && fishById(session.species);
    if (!spec || !intOk(session.serial) || session.serial !== f.serial || !spec.spots.includes(session.spot) || !BAITS.some(bait => bait.id === session.bait) || !timeOk(session.biteAt) || !timeOk(session.escapeAt) || session.escapeAt <= session.biteAt) return false;
    const reel = session.reel;
    if (reel !== null && (!reel || !intOk(reel.pulls, 3) || reel.pulls < 1 || !intOk(reel.hits, reel.pulls) || !timeOk(reel.startedAt) || !intOk(reel.period, 4000) || reel.period < 400 || !intOk(reel.zone, 100) || !intOk(reel.width, 40) || reel.width < 8 || reel.zone + reel.width > 100)) return false;
  }
  const pond = f.pond;
  if (!pond || typeof pond.unlocked !== 'boolean' || !intOk(pond.upgrades, 3) || !intOk(pond.nextId) || !Array.isArray(pond.stock) || pond.stock.length > pondCapacity(f)) return false;
  if (new Set(pond.stock.map(fish => fish.id)).size !== pond.stock.length) return false;
  return pond.stock.every(fish => intOk(fish.id) && fish.id < pond.nextId && !!fishById(fish.species) && typeof fish.fed === 'boolean' && timeOk(fish.readyAt) && (!fish.fed || fish.readyAt > 0));
}
