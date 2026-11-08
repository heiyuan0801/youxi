import test from 'node:test';
import assert from 'node:assert/strict';
import { levelFloor, newFarm, parseSave, serialize } from '../assets/scripts/FarmModel';
import { beginExplore, layerStory, puzzleFor, resolveExploreEvent } from '../assets/scripts/FarmExplore';
import { claimCalendarPlay, claimDailyFestival, claimWeeklyFestival, damageStorm, iceControlWindow, practiceFlowers, pullIceLine, pullPumpkinWeigh, pullSummerLine, recordBoard, repairStormCrop, repairStormDeco, resolveScene, rollScene, startDailyWeigh, startIceControl, startSummerContest, submitDecor, summerWindow, weighWindow } from '../assets/scripts/FarmActivities';
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
  const best = s.activities.decorLog[0].score;
  const paid = s.coins;
  const legacy = JSON.parse(serialize(s, NOW));
  delete legacy.activities.decorBest;
  const migrated = parseSave(JSON.stringify(legacy), NOW, false);
  assert.ok(migrated);
  assert.equal(migrated.activities.decorBest, best);
  migrated.advanced.room.wall = 1;
  for (let i = 1; i <= 8; i++) assert.ok(submitDecor(migrated, NOW + i).ok);
  const restored = save(migrated, NOW + 9);
  assert.equal(restored.activities.decorLog.length, 8);
  assert.ok(restored.activities.decorLog.every(entry => entry.votes === 0));
  assert.ok(restored.activities.decorLog.every(entry => entry.score < best));
  restored.advanced.room.wall = 0;
  assert.ok(submitDecor(restored, NOW + 10).ok);
  assert.equal(restored.activities.decorBest, best);
  assert.equal(restored.coins, paid);
});

test('a high-scoring decoration layout still loads from its save', () => {
  const s = newFarm(NOW);
  s.life.home.owned.push('bookshelf');
  s.advanced.room.serial = 20;
  s.advanced.room.items = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1, type: 'bookshelf', x: .2 + (i % 5) * .15, y: .2 + Math.floor(i / 5) * .15, rotation: 0,
  }));
  assert.ok(submitDecor(s, NOW).ok);
  assert.ok(s.activities.decorBest > 500);
  assert.equal(save(s).activities.decorBest, s.activities.decorBest);
});

test('July reward uses saved summer contest catches instead of ice scores', () => {
  const july = Date.UTC(2026, 6, 15, 3);
  const s = newFarm(july - 1_200_000);
  recordBoard(s, 'ice', 100, july);
  assert.equal(claimCalendarPlay(s, july).ok, false);
  assert.ok(startSummerContest(s, july).ok);
  let time = july;
  for (let i = 0; i < 2; i++) {
    time += summerWindow(s.activities.summer!, time).begin + 40;
    assert.ok(pullSummerLine(s, time).ok);
    if (i === 0) assert.equal(claimCalendarPlay(s, time).ok, false);
  }
  const restored = save(s, time);
  const before = restored.coins;
  assert.ok(claimCalendarPlay(restored, time).ok);
  assert.equal(restored.coins, before + 120);
  assert.equal(claimCalendarPlay(save(restored, time), time).ok, false);
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
