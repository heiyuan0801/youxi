import test from 'node:test';
import assert from 'node:assert/strict';
import { levelFloor, newFarm, parseSave, serialize } from '../assets/scripts/FarmModel';
import { beginExplore, layerStory, puzzleFor, resolveExploreEvent } from '../assets/scripts/FarmExplore';
import { claimCalendarPlay, claimDailyFestival, claimWeeklyFestival, damageStorm, iceControlWindow, practiceFlowers, pullIceLine, pullPumpkinWeigh, recordBoard, repairStormCrop, repairStormDeco, resolveScene, rollScene, startDailyWeigh, startIceControl, submitDecor, weighWindow } from '../assets/scripts/FarmActivities';
import { moveFurniture } from '../assets/scripts/FarmRoom';

const NOW = 1_790_000_000_000;
const save = (farm: ReturnType<typeof newFarm>, now = NOW) => {
  const restored = parseSave(serialize(farm, now), now, false);
  assert.ok(restored);
  return restored;
};

test('daily and weekly festival boards keep the best score and pay once', () => {
  const s = newFarm(NOW);
  s.inventory.herb = 4;
  s.inventory.strawberry = 4;
  assert.ok(startDailyWeigh(s, NOW).ok);
  const hit = NOW + weighWindow(s.activities.pumpkinWeigh!, NOW).begin + 20;
  assert.ok(pullPumpkinWeigh(s, hit).ok);
  assert.equal(s.activities.dayScore.pumpkin, 75);
  assert.equal(s.activities.lifeScore.pumpkin, 75);
  assert.ok(practiceFlowers(s, ['strawberry', 'herb', 'strawberry'], hit).ok);
  assert.equal(s.inventory.strawberry, 4);
  assert.ok(s.activities.dayScore.flower >= 60);
  const coins = s.coins;
  assert.ok(claimDailyFestival(s, hit).ok);
  assert.ok(s.coins > coins);
  assert.equal(claimDailyFestival(s, hit).ok, false);
  recordBoard(s, 'ice', 80, hit);
  assert.ok(claimWeeklyFestival(s, hit).ok);
  assert.ok(s.advanced.room.items.some(item => item.type === 'teaTable'));
  assert.equal(claimWeeklyFestival(save(s, hit), hit).ok, false);
});

test('ice control is four narrowing pulls and keeps a personal best', () => {
  const s = newFarm(NOW);
  s.life.maps.push('snow');
  s.life.activeMap = 'snow';
  assert.ok(startIceControl(s, NOW).ok);
  let time = NOW;
  for (let i = 0; i < 4; i++) {
    time += iceControlWindow(s.activities.ice!, time).begin + 40;
    assert.ok(pullIceLine(s, time).ok);
  }
  assert.equal(s.inventory.goldenFish, 1);
  assert.equal(s.activities.lifeScore.ice, 100);
  assert.equal(s.activities.ice, null);
});

test('first puzzle clear grants one furniture relic and later layers tell a different story', () => {
  const s = newFarm(NOW);
  s.life.maps.push('forest');
  s.life.activeMap = 'forest';
  assert.ok(beginExplore(s, null, NOW).ok);
  const run = s.advanced.explore.run!;
  run.depth = 4;
  run.event = 'puzzle';
  assert.ok(resolveExploreEvent(s, puzzleFor(run).answer).ok);
  assert.equal(s.advanced.room.items.filter(item => item.type === 'lamp').length, 1);
  assert.deepEqual(s.activities.relics, ['forest-4']);
  run.event = 'puzzle';
  run.step = 0;
  assert.ok(resolveExploreEvent(s, puzzleFor(run).answer).ok);
  assert.equal(s.advanced.room.items.filter(item => item.type === 'lamp').length, 1);
  assert.notEqual(layerStory('forest', 1), layerStory('forest', 8));
  assert.notEqual(layerStory('mine', 6), layerStory('beach', 6));
});

test('decor contest stores a local board and leaves votes for a later friend round', () => {
  const s = newFarm(NOW);
  s.advanced.room.items = [
    { id: 1, type: 'bed', x: null, y: null, rotation: 0 },
    { id: 2, type: 'desk', x: null, y: null, rotation: 0 },
    { id: 3, type: 'bookshelf', x: null, y: null, rotation: 0 },
  ];
  s.advanced.room.serial = 3;
  s.life.home.owned.push('bed', 'desk', 'bookshelf');
  assert.equal(submitDecor(s, NOW).ok, false);
  assert.ok(moveFurniture(s, 1, .2, .2).ok);
  assert.ok(moveFurniture(s, 2, .8, .25).ok);
  assert.ok(moveFurniture(s, 3, .3, .8).ok);
  const before = s.coins;
  assert.ok(submitDecor(s, NOW).ok);
  assert.equal(s.activities.decorLog.length, 1);
  assert.equal(s.activities.decorLog[0].votes, 0);
  assert.ok(s.activities.decorLog[0].score > 0);
  assert.ok(s.coins > before);
  assert.ok(submitDecor(s, NOW + 1).ok);
  const restored = save(s);
  assert.equal(restored.activities.decorLog.length, 2);
  assert.ok(restored.activities.decorLog.every(entry => entry.votes === 0));
});

test('a cat undoes mouse damage and a dog can stop a theft', () => {
  const s = newFarm(NOW);
  s.xp = levelFloor(4);
  s.animals.push({ id: 8, type: 'cat', readyAt: NOW });
  const plot = s.plots[3], before = plot.plantedAt;
  assert.equal(rollScene(s, NOW), true);
  assert.equal(s.activities.scene!.kind, 'mouse');
  assert.equal(plot.plantedAt, before + 20000);
  assert.ok(resolveScene(s, true, NOW).ok);
  assert.equal(plot.plantedAt, before);
  assert.equal(s.activities.scene, null);
  s.animals.push({ id: 9, type: 'dog', readyAt: NOW });
  s.activities.sceneAt = NOW;
  s.activities.patrolCount = 1;
  s.plots.forEach(p => { p.crop = null; });
  assert.equal(rollScene(s, NOW), true);
  assert.equal(s.activities.scene!.kind, 'theft');
  assert.ok(resolveScene(s, false, NOW).ok);
  assert.equal(s.coins, 110);
});

test('storm can delay a crop or a decoration, and calendar play pays from a saved score', () => {
  const s = newFarm(NOW);
  s.life.epoch = NOW - 3 * 240000;
  s.xp = levelFloor(5);
  const plot = s.plots[3], before = plot.plantedAt;
  assert.equal(damageStorm(s, NOW), true);
  assert.equal(s.activities.stormCrop, 3);
  assert.equal(plot.plantedAt, before + 15000);
  assert.equal(damageStorm(s, NOW + 1000), false);
  assert.ok(repairStormCrop(s).ok);
  assert.equal(plot.plantedAt, before);
  s.activities.stormWindow = -1;
  s.plots.forEach(p => { p.crop = null; });
  s.decorations.push({ type: 'bush', x: 4, y: 4 });
  assert.equal(damageStorm(s, NOW), true);
  assert.equal(s.activities.stormDeco, 0);
  assert.ok(repairStormDeco(s).ok);
  assert.equal(s.activities.stormDeco, null);
  const october = Date.UTC(2026, 9, 1, 4);
  recordBoard(s, 'pumpkin', 80, october);
  assert.ok(claimCalendarPlay(s, october).ok);
  assert.equal(claimCalendarPlay(s, october).ok, false);
});
