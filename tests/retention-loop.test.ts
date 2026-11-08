import test from 'node:test';
import assert from 'node:assert/strict';
import {newFarm, harvest, plant, water, parseSave, serialize, readyPlot} from '../assets/scripts/FarmModel';
import {upgradeSoil, upgradeSoilBatch, soilTier, cropGrowSeconds} from '../assets/scripts/FarmSoil';
import {t, itemName, localizeOrder, storyCopy, localDate, shiftLocal, atLocalNoon, weekKey} from '../assets/scripts/FarmI18n';
import {submitFlowers} from '../assets/scripts/FarmActivities';
import {
  acceptTomorrow, advanceTutorial, audioMix, claimAchievement, claimChecklist, claimLogin, claimNeighbor, toggleHud,
  decorScore, deliverTomorrow, enterContest, markFestival, noteDecor, noteFestivalScore, noteRecipe,
  pickBlessing, redeemInvite, setVolume, skipTutorial, toggleMute, tutorialDone, revealRecipe,
} from '../assets/scripts/FarmRetention';

const NOW = atLocalNoon(localDate(1_800_000_000_000));

test('hud menus collapse independently and the choice survives a reload', () => {
  const s = newFarm(NOW);
  assert.deepEqual(s.retention.hud, {left: true, right: true});
  assert.equal(toggleHud(s, 'left').ok, true);
  assert.equal(s.retention.hud.left, false);
  assert.equal(s.retention.hud.right, true);
  const loaded = parseSave(serialize(s, NOW), NOW)!;
  assert.equal(loaded.retention.hud.left, false);
  assert.equal(toggleHud(loaded, 'right').ok, true);
  assert.deepEqual(loaded.retention.hud, {left: false, right: false});
  const raw = JSON.parse(serialize(newFarm(NOW), NOW));
  delete raw.retention.hud;
  assert.deepEqual(parseSave(JSON.stringify(raw), NOW)?.retention.hud, {left: true, right: true});
  raw.retention.hud = {left: 1, right: true};
  assert.equal(parseSave(JSON.stringify(raw), NOW), null);
});

test('tutorial can be skipped or walked, and names the next day', () => {
  const skipped = newFarm(NOW);
  const message = skipTutorial(skipped, NOW).message;
  assert.equal(tutorialDone(skipped), true);
  assert.match(message, /晨间清单|morning list|朝のリスト|아침 목록/);
  const walked = newFarm(NOW);
  assert.equal(advanceTutorial(walked, 'continue', NOW).ok, true);
  assert.equal(advanceTutorial(walked, 'continue', NOW).ok, false);
  assert.equal(harvest(walked, 0, NOW).ok, true);
  assert.equal(plant(walked, 4, 'wheat', NOW).ok, true);
  assert.equal(water(walked, 4, NOW).ok, true);
  assert.equal(advanceTutorial(walked, 'continue', NOW).ok, true);
  assert.equal(advanceTutorial(walked, 'continue', NOW).ok, true);
  assert.equal(advanceTutorial(walked, 'continue', NOW).ok, true);
  assert.equal(tutorialDone(walked), true);
});

test('morning list pays once, continues the next day, and breaks after a gap', () => {
  const s = newFarm(NOW);
  s.retention.checklist.login = true;
  harvest(s, 0, NOW); plant(s, 4, 'wheat', NOW); water(s, 4, NOW); markFestival(s, NOW);
  const coins = s.coins;
  assert.equal(claimChecklist(s, NOW).ok, true);
  assert.equal(s.retention.checklist.streak, 1);
  assert.equal(s.coins, coins + 25);
  assert.equal(claimChecklist(s, NOW).ok, false);
  const next = atLocalNoon(shiftLocal(localDate(NOW), 1));
  harvest(s, 1, next); plant(s, 5, 'carrot', next); water(s, 5, next); markFestival(s, next);
  s.retention.checklist.login = true;
  assert.equal(claimChecklist(s, next).ok, true);
  assert.equal(s.retention.checklist.streak, 2);
  const later = atLocalNoon(shiftLocal(localDate(NOW), 3));
  harvest(s, 4, later); plant(s, 6, 'wheat', later); water(s, 6, later); markFestival(s, later);
  s.retention.checklist.login = true;
  assert.equal(claimChecklist(s, later).ok, true);
  assert.equal(s.retention.checklist.streak, 1);
});

test('login gifts follow local dates, reset after a gap, and share day 7 once', () => {
  const s = newFarm(NOW);
  for (let day = 0; day < 7; day++) {
    const now = atLocalNoon(shiftLocal(localDate(NOW), day));
    assert.equal(claimLogin(s, now).ok, true);
    assert.equal(claimLogin(s, now).ok, false);
  }
  assert.equal(s.retention.login.cycles, 1);
  assert.equal(s.retention.share.pending?.id, 'login-streak-7');
  assert.equal(s.inventory.wheat >= 2, true);
  const gap = atLocalNoon(shiftLocal(localDate(NOW), 9));
  assert.equal(claimLogin(s, gap).ok, true);
  assert.equal(s.retention.login.next, 1);
});

test('medals pay once and codex remembers crops, animals, furniture, and layers', () => {
  const s = newFarm(NOW);
  harvest(s, 0, NOW);
  assert.equal(claimAchievement(s, 'harvest-1').ok, true);
  assert.equal(claimAchievement(s, 'harvest-1').ok, false);
  assert.ok(s.retention.codex.crops.includes('wheat'));
  assert.ok(s.retention.codex.animals.includes('hen'));
  s.advanced.room.items.push({id: 1, type: 'bed', x: null, y: null, rotation: 0});
  s.life.home.owned.push('bed');
  s.advanced.explore.best.forest = 2;
  harvest(s, 1, NOW);
  assert.ok(s.retention.codex.furniture.includes('bed'));
  assert.ok(s.retention.codex.layers.includes('forest:1'));
  assert.ok(s.retention.codex.layers.includes('forest:2'));
});

test('volume clamps and mute does not forget the chosen levels', () => {
  const s = newFarm(NOW);
  setVolume(s, 'bgm', 140);
  setVolume(s, 'sfx', -4);
  assert.equal(s.retention.audio.bgm, 100);
  assert.equal(s.retention.audio.sfx, 0);
  s.music = false;
  assert.equal(audioMix(s).bgm, 0);
  s.music = true;
  assert.equal(audioMix(s).bgm, 1);
  toggleMute(s);
  assert.equal(s.retention.audio.muted, true);
  assert.equal(s.retention.audio.bgm, 100);
});

test('stories, orders, and items translate, and missing lines fall back to simplified Chinese', () => {
  assert.equal(t('probe.only', {}, 'ja'), '仅简体');
  assert.equal(t('missing.key', {}, 'en'), 'missing.key');
  assert.notEqual(itemName('wheat', '小麦', 'en'), '小麦');
  assert.equal(itemName('not-a-crop', '小麦', 'en'), '小麦');
  const order = localizeOrder('林奶奶', '早上的面包，就差新鲜的麦香啦。', 'en');
  assert.match(order.message, /wheat/i);
  assert.notEqual(storyCopy('forest', 'ko').body, storyCopy('forest', 'zh-CN').body);
  assert.equal(storyCopy('forest', 'fr').body, storyCopy('forest', 'zh-CN').body);
});

test('cooking contest is once a day and can reveal a recipe', () => {
  const s = newFarm(NOW);
  s.coins = 100;
  s.inventory.wheat = 4;
  s.inventory.egg = 2;
  assert.equal(enterContest(s, 'bread', NOW).ok, true);
  assert.equal(enterContest(s, 'bread', NOW).ok, false);
  assert.equal(s.inventory.wheat, 2);
  const next = atLocalNoon(shiftLocal(localDate(NOW), 1));
  s.xp = 5000;
  assert.equal(revealRecipe(s, next).ok, true);
  assert.ok(s.retention.cooking.discovered.length > 3);
  assert.equal(s.retention.share.pending?.kind, 'recipe');
});

test('shrine blessing lasts only the local day', () => {
  const s = newFarm(NOW);
  assert.equal(pickBlessing(s, 'sprout', NOW).ok, true);
  assert.equal(pickBlessing(s, 'glow', NOW).ok, false);
  plant(s, 4, 'carrot', NOW);
  assert.ok((s.plots[4].growSeconds || 0) < 45);
  const next = atLocalNoon(shiftLocal(localDate(NOW), 1));
  plant(s, 5, 'carrot', next);
  assert.equal(s.plots[5].growSeconds, 45);
  assert.equal(pickBlessing(s, 'glow', next).ok, true);
});

test('neighbor errands reset on the next local week', () => {
  const s = newFarm(NOW);
  for (let i = 4; i < 8; i++) {
    plant(s, i, 'wheat', NOW);
    water(s, i, NOW);
  }
  assert.equal(s.retention.neighbors.quests.find(q => q.kind === 'water')!.progress, 4);
  assert.equal(claimNeighbor(s, 'xiaoman-water', NOW).ok, true);
  assert.equal(claimNeighbor(s, 'xiaoman-water', NOW).ok, false);
  let later = NOW;
  while (weekKey(later) === weekKey(NOW)) later = atLocalNoon(shiftLocal(localDate(later), 1));
  assert.equal(plant(s, 8, 'wheat', later).ok, true);
  assert.equal(water(s, 8, later).ok, true);
  assert.equal(s.retention.neighbors.quests.find(q => q.kind === 'water')!.progress, 1);
  assert.equal(s.retention.neighbors.quests.find(q => q.kind === 'water')!.claimed, false);
});

test('one-tap soil upgrade matches single-plot tiers and leaves locked or flooded plots', () => {
  const poor = newFarm(NOW);
  poor.coins = 10;
  assert.equal(upgradeSoilBatch(poor, NOW).ok, false);
  assert.equal(poor.coins, 10);
  assert.equal(soilTier(poor.plots[0]), 0);
  const s = newFarm(NOW);
  s.coins = 150;
  assert.equal(upgradeSoilBatch(s, NOW).ok, true);
  assert.equal(s.plots.filter(plot => plot.soil === 1).length, 1);
  assert.equal(s.coins, 50);
  s.activities.stormPlot = 1;
  s.coins = 500;
  s.inventory.feed = 4;
  s.plots[2].soil = 1;
  upgradeSoil(s, 2, NOW);
  assert.equal(s.plots[2].soil, 2);
  assert.equal(s.plots[1].soil, undefined);
  assert.equal(s.retention.share.pending?.kind, 'red-soil');
  const before = s.plots[0].growSeconds;
  plant(s, 3, 'carrot', NOW);
  assert.equal(cropGrowSeconds(45, 0, 2), 29.25);
  s.plots[4].soil = 2;
  plant(s, 4, 'carrot', NOW);
  assert.equal(s.plots[4].growSeconds, 29.25);
  assert.equal(before, undefined);
  const plain = newFarm(NOW);
  plant(plain, 4, 'carrot', NOW);
  water(plain, 4, NOW);
  assert.equal(readyPlot(plain.plots[4], NOW + 36000), true);
  assert.equal(readyPlot(plain.plots[4], NOW + 35999), false);
});

test('tomorrow orders wait for the next local day and then pay a bonus', () => {
  const s = newFarm(NOW);
  assert.equal(acceptTomorrow(s, NOW).ok, true);
  const order = s.retention.tomorrow.order!;
  for (const [id, amount] of Object.entries(order.needs)) s.inventory[id as 'wheat'] = amount!;
  const raw = serialize(s, NOW);
  assert.equal(deliverTomorrow(s, NOW).ok, false);
  assert.equal(serialize(s, NOW), raw);
  const next = atLocalNoon(order.due);
  const coins = s.coins;
  assert.equal(deliverTomorrow(s, next).ok, true);
  assert.equal(s.coins, coins + Math.round(order.coins * 1.2));
  assert.equal(s.retention.tomorrow.order, null);
});

test('harvest titles stick after the streak breaks', () => {
  const s = newFarm(NOW);
  for (let day = 0; day < 3; day++) harvest(s, day, atLocalNoon(shiftLocal(localDate(NOW), day)));
  assert.ok(s.retention.harvestStreak.titles.includes('till-3'));
  harvest(s, 3, atLocalNoon(shiftLocal(localDate(NOW), 5)));
  assert.equal(s.retention.harvestStreak.days, 1);
  assert.ok(s.retention.harvestStreak.titles.includes('till-3'));
});

test('old saves gain retention without restarting the tutorial, and bad soil or retention is rejected', () => {
  const raw = JSON.parse(serialize(newFarm(NOW), NOW));
  delete raw.retention;
  const loaded = parseSave(JSON.stringify(raw), NOW)!;
  assert.ok(loaded);
  assert.equal(tutorialDone(loaded), true);
  assert.equal(loaded.retention.audio.bgm, 80);
  raw.retention = {schema: 1};
  assert.equal(parseSave(JSON.stringify(raw), NOW), null);
  const soil = JSON.parse(serialize(newFarm(NOW), NOW));
  soil.plots[0].soil = 3;
  assert.equal(parseSave(JSON.stringify(soil), NOW), null);
  soil.plots[0].soil = 1;
  assert.equal(parseSave(JSON.stringify(soil), NOW)?.plots[0].soil, 1);
});

test('festival personal best and yard score offer a share card', () => {
  const s = newFarm(NOW);
  s.inventory.herb = 1;
  s.inventory.strawberry = 2;
  assert.equal(submitFlowers(s, ['strawberry', 'herb', 'strawberry'], NOW).ok, true);
  assert.equal(s.retention.share.pending?.kind, 'festival');
  noteFestivalScore(s, 'flower', 10, NOW);
  assert.notEqual(s.retention.share.pending?.score, 10);
  s.decorations = Array.from({length: 6}, () => ({type: 'bush' as const, x: 1, y: 1}));
  noteDecor(s, NOW);
  assert.ok(decorScore(s) >= 40);
  assert.equal(s.retention.share.pending?.kind, 'decor');
  noteRecipe(s, 'cheese', NOW);
  assert.equal(s.retention.share.latest?.kind, 'recipe');
});
