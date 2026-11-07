import test from 'node:test';
import assert from 'node:assert/strict';
import { levelFloor, newFarm, parseSave, serialize } from '../assets/scripts/FarmModel';
import { collectCraft, enqueueCraft } from '../assets/scripts/FarmFeatures';
import { advanceTown, currentCommission, turnInCommission } from '../assets/scripts/FarmJourney';
import { beginExplore, levelTheme, puzzleFor, resolveExploreEvent, routes, takeRoute } from '../assets/scripts/FarmExplore';
import { dominance, inherit, transmitAllele } from '../assets/scripts/FarmGenetics';
import { baseGenome } from '../assets/scripts/FarmGenetics';
import { jumpRace, pullSummerLine, raceWindow, startRace, startSummerContest, summerWindow } from '../assets/scripts/FarmActivities';
import { claimFestival, openFactory, refreshLife, travel, unlockMap } from '../assets/scripts/FarmLife';
import { machinePose } from '../assets/scripts/FarmMachines';

const NOW = 1_790_000_000_000;

test('brewery turns coffee and flowers into drinks that survive a reload', () => {
  const s = newFarm(NOW);
  s.xp = levelFloor(35);
  s.coins = 5000;
  assert.ok(openFactory(s, 'brewing').ok);
  s.inventory.coffee = 2;
  s.inventory.lavender = 2;
  s.inventory.herb = 1;
  assert.ok(enqueueCraft(s, 'coffeeBrew', NOW).ok);
  assert.ok(enqueueCraft(s, 'floralTea', NOW).ok);
  const restored = parseSave(serialize(s, NOW), NOW + 200000)!;
  for (const job of [...restored.features.jobs]) assert.ok(collectCraft(restored, job.id, NOW + 200000).ok);
  assert.equal(restored.inventory.coffeeBrew, 1);
  assert.equal(restored.inventory.floralTea, 1);
  assert.equal(restored.inventory.coffee, 0);
  assert.equal(restored.inventory.lavender, 0);
});

test('town chapters continue after the first loaf and commissions repeat', () => {
  const s = newFarm(NOW);
  assert.equal(advanceTown(s).ok, false);
  s.journey.breakfast = 5;
  assert.equal(advanceTown(s).ok, false);
  s.inventory.flour = 1;
  assert.ok(advanceTown(s).ok);
  s.inventory.bread = 2;
  assert.ok(advanceTown(s).ok);
  assert.equal(s.inventory.bread, 0);
  assert.ok(advanceTown(s).ok);
  assert.equal(s.journey.chapter, 1);
  assert.equal(s.inventory.planks, 1);
  s.journey.chapter = 3;
  s.journey.step = 0;
  assert.equal(turnInCommission(s).ok, false);
  s.inventory.bread = 2;
  assert.ok(turnInCommission(s).ok);
  assert.equal(s.journey.commission, 1);
  assert.equal(currentCommission(s).id, 'vinegar-cup');
  s.inventory.bread = 20;
  s.inventory.vinegar = 20;
  s.inventory.sunTea = 20;
  s.inventory.coffeeBrew = 20;
  s.inventory.floralTea = 20;
  s.inventory.herb = 20;
  s.inventory.berryTea = 20;
  s.inventory.grapeJuice = 20;
  const stars = s.stars;
  while (s.journey.commission < 8) assert.ok(turnInCommission(s).ok);
  assert.equal(s.stars, stars + 2);
  assert.equal(currentCommission(s).id, 'loaf');
  const legacy = JSON.parse(serialize(s, NOW));
  delete legacy.inventory.coffeeBrew;
  delete legacy.journey.chapter;
  delete legacy.journey.step;
  delete legacy.journey.commission;
  delete legacy.activities.summer;
  delete legacy.activities.summerScore;
  delete legacy.activities.race;
  const restored = parseSave(JSON.stringify(legacy), NOW, false)!;
  assert.equal(restored.inventory.coffeeBrew, 0);
  assert.equal(restored.journey.chapter, 0);
  assert.equal(restored.activities.summer, null);
  assert.equal(restored.activities.summerScore, 0);
});

test('exploration adds a solvable puzzle, a regional event, and one art hook per layer', () => {
  const s = newFarm(NOW);
  s.xp = levelFloor(8);
  s.coins = 1000;
  assert.ok(unlockMap(s, 'forest').ok);
  assert.ok(travel(s, 'forest').ok);
  assert.ok(beginExplore(s, null, NOW).ok);
  assert.equal(routes(s).some(route => route.kind === 'puzzle' || route.kind === 'fox'), false);
  s.advanced.explore.run!.depth = 4;
  assert.equal(routes(s)[1].kind, 'puzzle');
  assert.ok(takeRoute(s, 1).ok);
  const run = s.advanced.explore.run!, puzzle = puzzleFor(run), wrong = [0, 1, 2].find(choice => choice !== puzzle.answer)!;
  const stamina = run.stamina;
  assert.ok(resolveExploreEvent(s, wrong).ok);
  assert.equal(s.advanced.explore.run!.step, 0);
  assert.equal(s.advanced.explore.run!.stamina, stamina - 1);
  assert.ok(resolveExploreEvent(s, puzzle.answer).ok);
  assert.equal(s.advanced.explore.run!.step, 1);
  assert.ok((s.advanced.explore.run!.bag.gem || 0) >= 1);
  const saved = parseSave(serialize(s, NOW), NOW)!;
  assert.equal(saved.advanced.explore.run!.event, null);
  saved.advanced.explore.run!.depth = 3;
  saved.advanced.explore.run!.step = 0;
  assert.equal(routes(saved)[1].kind, 'fox');
  const ids = Array.from({ length: 12 }, (_, i) => levelTheme('forest', i + 1).id);
  assert.equal(new Set(ids).size, 12);
  assert.equal(levelTheme('forest', 1).ground, '#abd780');
  assert.equal(levelTheme('forest', 1).art, 'forest-layer-01');
  assert.equal(levelTheme('mine', 12).title, '矿心');
});

test('complete dominance biases transmission and focused breeding stays exact', () => {
  assert.equal(transmitAllele([0, 3], .1), 3);
  assert.equal(transmitAllele([0, 3], .9), 0);
  assert.equal(transmitAllele([1, 2], .4), 1);
  assert.equal(transmitAllele([2, 2], .9), 2);
  assert.equal(dominance([0, 3]).mode, 'complete');
  assert.equal(dominance([1, 2]).phenotype, 1.5);
  assert.equal(dominance([2, 2]).mode, 'homo');
  const s = newFarm(NOW);
  s.advanced.genes[1] = { ...baseGenome(), production: [0, 3], temper: [1, 1], vitality: [1, 1] };
  s.advanced.genes[2] = { ...baseGenome(), production: [3, 3], temper: [1, 1], vitality: [1, 1] };
  let dominant = 0;
  for (let serial = 1; serial <= 80; serial++) if (inherit(s, 1, 2, serial, null).production[0] === 3) dominant++;
  assert.ok(dominant > 45 && dominant < 80);
  const focused = inherit(s, 1, 2, 1, 'production');
  assert.deepEqual(focused.production, [3, 3]);
});

test('summer contest is timed and the season reward counts only those catches', () => {
  const s = newFarm(NOW);
  s.life.epoch = NOW - 1_200_000;
  refreshLife(s, NOW);
  s.life.activeMap = 'village';
  assert.equal(startSummerContest(s, NOW).ok, false);
  s.life.activeMap = 'beach';
  s.life.maps.push('beach');
  assert.ok(startSummerContest(s, NOW).ok);
  assert.equal(s.features.fishing.bait, 4);
  let time = NOW;
  for (let i = 0; i < 3; i++) {
    time += summerWindow(s.activities.summer!, time).begin + 40;
    assert.ok(pullSummerLine(s, time).ok);
  }
  assert.equal(s.activities.summer, null);
  assert.equal(s.activities.summerScore, 3);
  assert.equal(s.inventory.fish, 3);
  assert.ok(claimFestival(s, time).ok);
  assert.equal(claimFestival(s, time).ok, false);
});

test('obstacle race pays for timed jumps and locks the season after a clear', () => {
  const s = newFarm(NOW);
  const before = s.coins;
  let time = NOW;
  assert.ok(startRace(s, 1, time).ok);
  for (let i = 0; i < 4; i++) {
    time += raceWindow(s.activities.race!, time).begin + 40;
    assert.ok(jumpRace(s, time).ok);
  }
  assert.equal(s.activities.race, null);
  assert.equal(s.activities.raceSeason, 0);
  assert.ok(s.coins > before);
  assert.equal(startRace(s, 1, time + 1).ok, false);
  const missed = newFarm(NOW);
  assert.ok(startRace(missed, 1, NOW).ok);
  assert.ok(jumpRace(missed, NOW + 1).ok);
  assert.equal(missed.activities.race!.hits, 0);
});

test('harvester and feeder poses only spin while the device is running', () => {
  const off = machinePose(2, false, true);
  const idle = machinePose(2, true, false);
  const working = machinePose(2, true, true);
  assert.equal(off.spin, 0);
  assert.equal(off.arm, 0);
  assert.ok(working.spin > idle.spin);
  assert.ok(Math.abs(working.arm) >= 0);
  assert.equal(working.working, true);
  assert.equal(idle.working, false);
});
