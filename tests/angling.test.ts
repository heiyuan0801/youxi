import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {newFarm, parseSave, serialize} from '../assets/scripts/FarmModel';
import {ART_HOOKS, artHook} from '../assets/scripts/ArtHooks';
import {
  castRod, feedPondFish, harvestPondFish, hookBite, reelCheck, reelHit, reelMarker, rollSpecies,
  sellPondFish, stockPond, unlockPond, upgradePond, pondCapacity, zoneFor,
} from '../assets/scripts/FarmAngling';
import {t} from '../assets/scripts/FarmI18n';

const NOW = 1_800_000_000_000;

function hitAt(reel: {startedAt: number; period: number; zone: number; width: number}, from: number) {
  for (let time = from; time < from + reel.period * 2; time += 20) if (reelHit({...reel, pulls: 1, hits: 0}, time)) return time;
  throw new Error('no green window');
}
function missAt(reel: {startedAt: number; period: number; zone: number; width: number}, from: number) {
  for (let time = from; time < from + reel.period * 2; time += 20) if (!reelHit({...reel, pulls: 1, hits: 0}, time)) return time;
  throw new Error('zone covers the whole sweep');
}

test('location, season and bait choose the fish', () => {
  assert.equal(rollSpecies('snow', 3, 'lure', 4), 'goldenFish');
  assert.ok(['fish', 'crucian'].includes(rollSpecies('home', 0, 'worm', 9)));
  assert.equal(rollSpecies('beach', 1, 'lure', 3), 'bass');
  assert.notEqual(t('fish.caught', {name: 'Trout'}, 'en'), t('fish.caught', {name: '鳟鱼'}, 'zh-CN'));
  assert.equal(t('fish.missing-key', {}, 'ja'), 'fish.missing-key');
});

test('a cast waits for the bite, then the reel check lands or loses the fish', () => {
  const s = newFarm(NOW);
  assert.equal(castRod(s, 'home', 'worm', NOW).ok, true);
  assert.equal(s.fishery.bait.worm, 3);
  assert.equal(castRod(s, 'home', 'worm', NOW + 10).ok, false);
  assert.equal(s.fishery.bait.worm, 3);
  const session = s.fishery.session!;
  assert.equal(hookBite(s, session.biteAt - 1).ok, false);
  assert.equal(hookBite(s, session.biteAt).ok, true);
  const reel = s.fishery.session!.reel!;
  assert.equal(reel.zone, zoneFor(session.serial, reel.width));
  const miss = missAt(reel, reel.startedAt);
  assert.equal(reelCheck(s, miss).ok, false);
  assert.equal(s.inventory.fish, 0);
  assert.equal(s.fishery.session, null);
  const again = newFarm(NOW);
  castRod(again, 'home', 'worm', NOW);
  const bite = again.fishery.session!;
  hookBite(again, bite.biteAt);
  let guard = 0;
  while (again.fishery.session?.reel && guard++ < 5) {
    const current = again.fishery.session.reel;
    assert.equal(reelCheck(again, hitAt(current, current.startedAt)).ok, true);
  }
  assert.equal(again.fishery.session, null);
  assert.equal(again.features.stats.catches, 1);
  assert.equal(again.fishery.codex.length, 1);
  assert.ok(again.inventory[again.fishery.codex[0]] >= 1);
  const saved = parseSave(serialize(again, NOW), NOW)!;
  assert.deepEqual(saved.fishery.codex, again.fishery.codex);
});

test('an unfinished cast survives reload and a late hook loses the bait', () => {
  const s = newFarm(NOW);
  s.fishery.bait.dough = 2;
  castRod(s, 'home', 'dough', NOW);
  const raw = serialize(s, NOW);
  const loaded = parseSave(raw, s.fishery.session!.biteAt)!;
  assert.equal(hookBite(loaded, loaded.fishery.session!.biteAt).ok, true);
  assert.equal(reelMarker(loaded.fishery.session!.reel!, loaded.fishery.session!.reel!.startedAt), 0);
  const late = newFarm(NOW);
  castRod(late, 'home', 'worm', NOW);
  const escape = late.fishery.session!.escapeAt;
  assert.equal(hookBite(late, escape + 1).ok, false);
  assert.equal(late.fishery.session, null);
  assert.equal(late.features.stats.catches, 0);
});

test('ponds unlock on a level gate, then stock, feed, harvest or sell inside capacity', () => {
  const locked = newFarm(NOW);
  const before = serialize(locked, NOW);
  assert.equal(unlockPond(locked).ok, false);
  assert.equal(stockPond(locked, 'fish', NOW).ok, false);
  assert.equal(serialize(locked, NOW), before);
  locked.xp = 450;
  locked.coins = 5000;
  locked.inventory.feed = 3;
  assert.equal(unlockPond(locked).ok, true);
  assert.equal(unlockPond(locked).ok, false);
  assert.equal(stockPond(locked, 'crucian', NOW).ok, false);
  assert.equal(stockPond(locked, 'fish', NOW).ok, true);
  assert.equal(stockPond(locked, 'fish', NOW).ok, true);
  assert.equal(stockPond(locked, 'fish', NOW).ok, false);
  assert.equal(locked.fishery.pond.stock.length, pondCapacity(locked.fishery));
  const id = locked.fishery.pond.stock[0].id;
  assert.equal(harvestPondFish(locked, id, NOW).ok, false);
  assert.equal(feedPondFish(locked, id, NOW).ok, true);
  assert.equal(feedPondFish(locked, id, NOW).ok, false);
  const ready = locked.fishery.pond.stock[0].readyAt;
  assert.equal(harvestPondFish(locked, id, ready - 1).ok, false);
  assert.equal(harvestPondFish(locked, id, ready).ok, true);
  assert.equal(locked.inventory.fish, 1);
  assert.ok(locked.fishery.codex.includes('fish'));
  const other = locked.fishery.pond.stock[0].id;
  const coins = locked.coins;
  assert.equal(sellPondFish(locked, other, NOW).ok, true);
  assert.ok(locked.coins > coins);
  assert.equal(locked.fishery.pond.stock.length, 0);
  locked.xp = 2000;
  assert.equal(upgradePond(locked).ok, true);
  assert.equal(pondCapacity(locked.fishery), 4);
  const migrated = JSON.parse(serialize(newFarm(NOW), NOW));
  delete migrated.fishery;
  assert.equal(parseSave(JSON.stringify(migrated), NOW)?.fishery.bait.worm, 4);
  migrated.fishery = {schema: 1, bait: {worm: -1}};
  assert.equal(parseSave(JSON.stringify(migrated), NOW), null);
});

test('art hooks name the rod, pond, fish and bait and the PNGs sit beside their metas', () => {
  assert.ok(ART_HOOKS.some(hook => hook.id === 'hook-rod' && hook.file === 'hooks/rod.png'));
  assert.ok(ART_HOOKS.some(hook => hook.id === 'hook-pond-empty'));
  assert.ok(ART_HOOKS.some(hook => hook.id === 'hook-fish-koi'));
  assert.ok(ART_HOOKS.some(hook => hook.id === 'hook-fish-bucket'));
  for (const hook of ART_HOOKS) {
    assert.equal(existsSync('assets/resources/' + hook.file), true, hook.file);
    assert.equal(existsSync('assets/resources/' + hook.file + '.meta'), true, hook.file);
  }
  assert.equal(artHook('hook-rod', () => false), 'fish');
  assert.equal(artHook('hook-fish-carp', id => id === 'hook-fish-carp'), 'hook-fish-carp');
  assert.equal(artHook('hook-fish-koi', () => false), 'goldenFish');
});
