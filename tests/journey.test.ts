import test from 'node:test';
import assert from 'node:assert/strict';
import { collectAnimal, harvest, levelFloor, makeOrder, newFarm, parseSave, plant, serialize, water } from '../assets/scripts/FarmModel';
import { advanceBreakfast, claimHonor, finishStory } from '../assets/scripts/FarmJourney';
import { calendarEvent, claimCalendar, compostPumpkin, iceWindow, judgePumpkin, pullIceLine, recordStorm, repairStormPlot, searchPatrol, startIceFishing, startPatrol, submitFlowers } from '../assets/scripts/FarmActivities';
import { collectCraft, enqueueCraft } from '../assets/scripts/FarmFeatures';
import { collectFurniture, startFurniture } from '../assets/scripts/FarmRoom';
import { settleAutomation } from '../assets/scripts/FarmAutomation';
import { ancestry, baseGenome, related } from '../assets/scripts/FarmGenetics';

const NOW = 1_790_000_000_000;
const save = (farm: ReturnType<typeof newFarm>, now = NOW) => {
  const restored = parseSave(serialize(farm, now), now, false);
  assert.ok(restored);
  return restored;
};

test('breakfast quests follow actual produce and award supplies exactly once', () => {
  const s = newFarm(NOW);
  assert.equal(advanceBreakfast(s).ok, false);
  assert.ok(harvest(s, 0, NOW).ok && harvest(s, 1, NOW).ok);
  assert.ok(advanceBreakfast(s).ok && collectAnimal(s, 3, NOW).ok);
  assert.ok(enqueueCraft(s, 'flour', NOW).ok);
  assert.equal(advanceBreakfast(s).ok, false);
  assert.ok(collectCraft(s, s.features.jobs[0].id, NOW + 20000).ok);
  assert.ok(advanceBreakfast(s).ok);
  assert.ok(enqueueCraft(s, 'bread', NOW + 21000).ok);
  assert.ok(collectCraft(s, s.features.jobs[0].id, NOW + 51000).ok);
  assert.ok(advanceBreakfast(s).ok && advanceBreakfast(s).ok && advanceBreakfast(s).ok);
  const restored = save(s);
  assert.equal(restored.journey.breakfast, 5);
  assert.equal(restored.inventory.bread, 0);
  assert.equal(restored.inventory.planks, 2);
  assert.equal(restored.stats.deliveries, 1);
  assert.equal(advanceBreakfast(restored).ok, false);
});

test('legacy migration recognizes previous progress and keeps production and inventory', () => {
  const s = newFarm(NOW);
  s.features.album.counts = { wheat: 5, flour: 3, bread: 1 };
  s.stats.deliveries = 4;
  const legacy = JSON.parse(serialize(s, NOW));
  delete legacy.journey;
  delete legacy.activities;
  const restored = parseSave(JSON.stringify(legacy), NOW, false)!;
  assert.equal(restored.journey.breakfast, 4);
  assert.deepEqual(restored.animals, s.animals);
  assert.deepEqual(restored.inventory, s.inventory);
  legacy.activities = { pumpkin: 800 };
  assert.equal(parseSave(JSON.stringify(legacy), NOW, false), null);
});

test('new orders require an obtainable ingredient or a working recipe chain', () => {
  const s = newFarm(NOW);
  s.xp = levelFloor(100);
  const orders = () => Array.from({ length: 80 }, (_, i) => makeOrder(i, 100, s));
  assert.ok(orders().every(o => !o.needs.apple && !o.needs.yogurt && !o.needs.wood));
  s.life.factories.push('dairy', 'candy');
  assert.ok(orders().some(o => o.needs.yogurt && o.needs.cookies));
  s.life.maps.push('forest');
  assert.ok(orders().some(o => o.needs.wood));
});

test('carpentry consumes materials before work, survives reload, and yields a single placeable item', () => {
  const s = newFarm(NOW);
  s.xp = levelFloor(3);
  s.life.factories.push('lumber');
  s.inventory.planks = 3;
  s.inventory.cloth = 1;
  assert.ok(startFurniture(s, 'bed', NOW).ok);
  assert.equal(s.inventory.planks, 1);
  assert.equal(startFurniture(s, 'bed', NOW).ok, false);
  const restored = save(s);
  assert.equal(collectFurniture(restored, NOW + 44999).ok, false);
  assert.ok(collectFurniture(restored, NOW + 45000).ok);
  assert.equal(restored.advanced.room.items[0].type, 'bed');
  assert.equal(collectFurniture(restored, NOW + 46000).ok, false);
});

test('water and compost affect a harvested pumpkin, with one submission per autumn', () => {
  const s = newFarm(NOW);
  s.life.epoch = NOW - 2 * 1200000;
  s.xp = levelFloor(8);
  s.inventory.feed = 2;
  assert.ok(plant(s, 4, 'pumpkin', NOW).ok);
  assert.ok(water(s, 4, NOW + 1).ok);
  assert.ok(compostPumpkin(s, 4, NOW + 2).ok);
  assert.equal(compostPumpkin(s, 4, NOW + 3).ok, false);
  const restored = save(s);
  assert.ok(harvest(restored, 4, NOW + 360000).ok);
  assert.equal(restored.activities.pumpkin, 110);
  assert.ok(judgePumpkin(restored, NOW + 360000).ok);
  assert.equal(judgePumpkin(restored, NOW + 360001).ok, false);
  assert.equal(restored.inventory.pumpkin, 0);
});

test('flower scoring charges its exact arrangement and calendar rewards survive reload', () => {
  const s = newFarm(NOW);
  s.inventory.strawberry = 2;
  s.inventory.herb = 1;
  assert.ok(submitFlowers(s, ['strawberry', 'herb', 'strawberry'], NOW).ok);
  assert.equal(s.activities.flowerRecord, 110);
  assert.equal(submitFlowers(s, ['strawberry', 'herb', 'strawberry'], NOW).ok, false);
  const october = Date.UTC(2026, 8, 30, 16);
  assert.equal(calendarEvent(october)?.key, '2026-autumn');
  s.inventory.corn = 3;
  assert.ok(claimCalendar(s, october).ok);
  assert.equal(claimCalendar(save(s), october + 10000).ok, false);
});

test('ice fishing charges once, checks each timed pull and cannot replay the catch', () => {
  const s = newFarm(NOW);
  s.life.maps.push('snow');
  s.life.activeMap = 'snow';
  assert.ok(startIceFishing(s, NOW).ok);
  assert.equal(startIceFishing(s, NOW + 1).ok, false);
  const restored = save(s);
  let time = NOW;
  for (let i = 0; i < 3; i++) {
    time += iceWindow(restored.activities.ice!, time).begin + 300;
    assert.ok(pullIceLine(restored, time).ok);
  }
  assert.equal(restored.inventory.goldenFish, 1);
  assert.equal(restored.features.fishing.bait, 4);
  assert.equal(pullIceLine(restored, time + 1).ok, false);
});

test('storm damage affects one empty plot and pet patrol has one persisted outcome', () => {
  const s = newFarm(NOW);
  s.life.epoch = NOW - 3 * 240000;
  s.xp = levelFloor(5);
  assert.ok(recordStorm(s, NOW));
  const index = s.activities.stormPlot!;
  assert.equal(plant(s, index, 'wheat', NOW).ok, false);
  assert.ok(repairStormPlot(s).ok && plant(s, index, 'wheat', NOW).ok);
  assert.equal(recordStorm(s, NOW + 1000), false);
  s.animals.push({ id: 5, type: 'dog', readyAt: NOW + 10000 });
  assert.ok(startPatrol(s, 'dog', NOW).ok);
  const restored = save(s);
  assert.ok(searchPatrol(restored, 1).ok);
  assert.equal(searchPatrol(restored, 1).ok, false);
  assert.ok(searchPatrol(restored, 0).ok);
  assert.equal(restored.inventory.wood, 2);
  assert.equal(startPatrol(restored, 'dog', NOW + 1).ok, false);
});

test('stories require travel and settled depth, and late honors cannot be double claimed', () => {
  const s = newFarm(NOW);
  s.xp = levelFloor(100);
  s.life.maps.push('forest');
  s.inventory.wood = 3;
  assert.equal(finishStory(s, 'forest').ok, false);
  s.life.activeMap = 'forest';
  assert.equal(finishStory(s, 'forest').ok, false);
  s.advanced.explore.best.forest = 1;
  s.advanced.explore.claimed.forest = 1;
  assert.ok(finishStory(s, 'forest').ok);
  assert.equal(finishStory(s, 'forest').ok, false);
  assert.equal(claimHonor(s, 80).ok, false);
  s.life.maps.push('snow');
  s.advanced.explore.best.snow = s.advanced.explore.claimed.snow = 12;
  assert.ok(claimHonor(s, 80).ok);
  assert.equal(claimHonor(save(s), 80).ok, false);
});

test('ancestry and automatic material reserve cover extended family and offline processing', () => {
  const s = newFarm(NOW);
  s.advanced.genes[6] = { ...baseGenome(), parents: [1, 2] };
  s.advanced.genes[7] = { ...baseGenome(), parents: [3, 6] };
  assert.deepEqual(ancestry(s, 7), [[3, 6], [1, 2], []]);
  assert.ok(related(s, 7, 1));
  assert.equal(related(s, 7, 4), false);
  s.activities.reserve = 5;
  s.inventory.wheat = 7;
  Object.assign(s.advanced.auto, { built: true, enabled: true, craft: true, recipes: ['flour'] });
  settleAutomation(s, NOW + 5000);
  assert.equal(s.inventory.wheat, 5);
  assert.equal(s.features.jobs.length, 1);
});
