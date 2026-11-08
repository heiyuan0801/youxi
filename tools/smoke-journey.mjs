import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import farmModel from '../assets/scripts/FarmModel.ts';
const { newFarm, levelFloor } = farmModel;

const out = 'artifacts/v08';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || '/Volumes/mac/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
});
const context = await browser.newContext({ locale: 'zh-CN', viewport: { width: 1600, height: 900 }, hasTouch: true });
const page = await context.newPage();
const checks = [], errors = [];
page.on('pageerror', e => errors.push(e.message));
const state = () => page.evaluate(() => window.__SUNNY_FARM__.snapshot());
const panel = () => page.evaluate(() => window.__SUNNY_FARM__.panel());
const sleep = (ms = 180) => page.waitForTimeout(ms);
const pass = name => { checks.push(name); console.log('PASS', name); };
const close = async () => {
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape'); await sleep();
    if (!await panel() && await page.evaluate(() => window.__SUNNY_FARM__.levelPopup() === null)) return;
  }
};
const shot = name => page.screenshot({ path: `${out}/${name}.png` });
const readyCraft = () => page.waitForFunction(() => window.__SUNNY_FARM__.buttons().some(b => b.label === '领取成品'), null, {timeout: 40000});

async function tapPoint(x, y) {
  const v = page.viewportSize(), scale = Math.min(v.width / 1600, v.height / 900);
  await page.touchscreen.tap((v.width - 1600 * scale) / 2 + x * scale, (v.height - 900 * scale) / 2 + y * scale);
  await sleep();
}

async function button(label, index = 0) {
  for (let tries = 0; tries < 22; tries++) {
    const match = await page.evaluate(([label, index]) => {
      const list = window.__SUNNY_FARM__.buttons();
      return list.filter(b => b.label === label)[index];
    }, [label, index]);
    assert.ok(match, `Missing button ${label}`);
    const clip = await page.evaluate(async () => {
      const cc = await System.import('cc');
      const scroll = cc.director.getScene().getComponentsInChildren(cc.ScrollView)[0];
      if (!scroll) return null;
      const size = scroll.node.getComponent(cc.UITransform).height * scroll.node.worldScale.y;
      const y = 900 - scroll.node.worldPosition.y;
      return { top: y - size / 2, bottom: y + size / 2 };
    });
    if (!clip || label === '×' || match.y - match.h / 3 >= clip.top && match.y + match.h / 3 <= clip.bottom) {
      await tapPoint(match.x, match.y);
      return;
    }
    const v = page.viewportSize();
    await page.mouse.move(v.width / 2 + Math.min(120, v.width / 7), v.height / 2);
    await page.mouse.wheel(0, match.y > clip.bottom - match.h / 3 ? 175 : -175);
    await sleep(500);
    await page.waitForFunction(async () => {
      const cc = await System.import('cc');
      return cc.director.getScene().getComponentsInChildren(cc.ScrollView).every(s => !s.isAutoScrolling() && !s.isScrolling());
    });
  }
  throw Error(`Cannot scroll to ${label}`);
}

async function plot(index) {
  const at = await page.evaluate(index => window.__SUNNY_FARM__.plot(index), index);
  await tapPoint(at.x, at.y);
}

async function point(x, y, lift = 0) {
  const at = await page.evaluate(([x, y, lift]) => window.__SUNNY_FARM__.point(x, y, lift), [x, y, lift]);
  await tapPoint(at.x, at.y);
}

async function importFile(raw) {
  const chooser = page.waitForEvent('filechooser', { timeout: 15000 });
  await button('导入存档');
  await (await chooser).setFiles({ name: 'farm.json', mimeType: 'application/json', buffer: Buffer.from(raw) });
  await sleep(400);
}

try {
  await page.goto('http://localhost:7526/?journey=0.8.0');
  await page.waitForFunction(() => window.__SUNNY_FARM__?.ready);
  assert.equal(await page.evaluate(() => window.__SUNNY_FARM__.version), '0.8.0');
  await button('开始游戏');
  await button('农场主线');
  await button('回田里收小麦');
  await plot(0); await plot(1);
  await button('农场主线'); await button('完成这一步'); await button('打开磨坊');
  await button('制作 · 面粉'); assert.equal((await state()).features.jobs[0].recipe, 'flour');
  await readyCraft(); await button('领取成品'); await close();
  const at = await page.evaluate(() => {
    const animal = window.__SUNNY_FARM__.motion().animals.find(a => a.id === 3);
    return window.__SUNNY_FARM__.point(animal.x, animal.y, -93);
  });
  await tapPoint(at.x, at.y);
  assert.ok((await state()).inventory.egg > 0, 'egg collected by tapping a real animal');
  await button('农场主线'); await button('完成这一步'); await button('打开面包房');
  await button('制作 · 麦香面包'); assert.equal((await state()).features.jobs[0].recipe, 'bread');
  await readyCraft(); await button('领取成品'); await close();
  await button('农场主线'); await button('完成这一步'); await button('把面包交给阿禾'); await button('领取开垦补给');
  const first = await state();
  assert.equal(first.journey.breakfast, 5);
  assert.equal(first.inventory.planks, 2);
  await shot('breakfast-complete');
  pass('fresh farm: real harvest, egg, two timed crafts, dispatch and one-time chapter reward');
  await close(); await button('设置');
  await importFile('{"bad":true}');
  assert.equal(await panel(), 'settings');
  assert.equal((await state()).coins, first.coins);

  const now = Date.now(), fixture = newFarm(now);
  fixture.xp = levelFloor(48); fixture.coins = 23500;
  fixture.life.epoch = now - 2400000;
  fixture.life.maps.push('forest', 'mine', 'beach', 'snow');
  fixture.life.factories.push('lumber');
  fixture.inventory.wood = 10; fixture.inventory.planks = 6; fixture.inventory.cloth = 4; fixture.inventory.feed = 8;
  fixture.animals.push({ id: 5, type: 'dog', readyAt: now + 20000 });
  fixture.life.care[5] = { ...fixture.life.care[1] };
  fixture.advanced.explore.best.forest = fixture.advanced.explore.claimed.forest = 3;
  fixture.advanced.explore.seen.forest = ['fox'];
  fixture.plots[4] = { unlocked: true, crop: 'pumpkin', plantedAt: now - 400000, growSeconds: 360, watered: true, composted: true };
  fixture.features.album.counts = { wheat: 2, flour: 1, bread: 1 }; fixture.stats.deliveries = 1;
  // Simulate a real pre-update export. Preserve the mature pumpkin and other existing progress.
  delete fixture.journey; delete fixture.activities;
  await importFile(JSON.stringify(fixture));
  assert.equal(await panel(), 'restore-save');
  await button('取消恢复'); assert.equal((await state()).coins, first.coins);
  await importFile(JSON.stringify(fixture)); await button('确认恢复');
  assert.equal((await state()).coins, fixture.coins);
  assert.equal((await state()).journey.breakfast, 4);
  pass('file picker import, corrupt input rejection, cancel, confirmation, and legacy migration');

  await plot(4); assert.equal((await state()).activities.pumpkin, 110);
  await button('节庆'); await button('四季比赛与日历'); await button('送南瓜参赛');
  assert.equal((await state()).activities.pumpkinRecord, 110);
  await shot('festival'); await close();
  await button('我的小屋 · 装修'); await button('家具制作台'); await button('制作绿叶小床');
  assert.equal((await state()).activities.furniture.type, 'bed');
  const furnitureTime = (await state()).activities.furniture.readyAt;
  await shot('carpenter'); await close();
  pass('actual pumpkin plot drives scored competition, furniture workshop starts a real timed job');

  await button('宠物巡院'); await button('带小狗找货袋'); await button('回农场找线索');
  const spot = (await state()).activities.patrol.spot;
  const where = [[7.5, 13.5], [13.5, 6.2], [17.5, 12.8]][spot];
  await shot('patrol'); await point(...where, -43);
  assert.equal((await state()).activities.patrol, null);
  assert.equal((await state()).inventory.wood, 12);
  await button('旅行手册'); await button('前往青杉森林');
  await button('地区故事'); await button('完成委托 · 220金币');
  assert.deepEqual((await state()).journey.stories, ['forest']);
  await button('完成探索故事');
  assert.deepEqual((await state()).journey.quests, ['forest-fox']);
  await shot('forest-story'); await close(); await button('返回主农场');
  pass('pet clue click and both forest story turn-ins through the region panel');

  await button('旅行手册'); await button('前往极光雪原');
  await page.setViewportSize({ width: 844, height: 390 }); await sleep(450);
  await button('冰湖垂钓'); await button('抛竿 · 1鱼饵');
  for (let attempt = 0; attempt < 3; attempt++) {
    const round = (await state()).activities.ice;
    const middle = 900 + (round.serial * 137 + round.attempt * 281) % 550 + 500;
    await sleep(Math.max(0, round.startedAt + middle - Date.now()));
    if (attempt === 0) await shot('ice-fishing-mobile');
    await button('拉线');
  }
  assert.equal((await state()).inventory.goldenFish, 1);
  await close(); await button('返回主农场');
  pass('three real touch pulls win a golden fish and the phone layout can return to the main farm');

  await page.setViewportSize({ width: 1600, height: 900 }); await sleep(250);
  await sleep(Math.max(0, furnitureTime - Date.now() + 150));
  await button('我的小屋 · 装修'); await button('家具制作台'); await button('领取制成家具');
  assert.equal((await state()).advanced.room.items[0].type, 'bed');
  await close(); await button('设置'); await button('恢复本机备份'); await button('确认恢复');
  const restored = await state();
  assert.equal(restored.coins, first.coins);
  assert.equal(restored.journey.breakfast, 5);
  assert.deepEqual(errors, []);
  pass('furniture production continues off-panel and backup restores prior farm');
  writeFileSync(`${out}/journey-smoke.json`, JSON.stringify({ passed: true, checks, errors }, null, 2));
} catch (error) {
  await shot('journey-failure');
  writeFileSync(`${out}/journey-smoke.json`, JSON.stringify({ passed: false, checks, errors, error: String(error), panel: await panel().catch(() => null) }, null, 2));
  throw error;
} finally {
  await browser.close();
}
