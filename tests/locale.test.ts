import test from 'node:test';
import assert from 'node:assert/strict';
import { activeLocale, detectLocale, setActiveLocale, t } from '../assets/scripts/Locale';
import { newFarm, parseSave, serialize } from '../assets/scripts/FarmModel';

const NOW = 1_790_000_000_000;

test('device language maps to a shipped locale and unknown languages use zh-CN', () => {
  assert.equal(detectLocale('zh-TW'), 'zh-TW');
  assert.equal(detectLocale('zh-HK'), 'zh-TW');
  assert.equal(detectLocale('zh-CN'), 'zh-CN');
  assert.equal(detectLocale('en-US'), 'en');
  assert.equal(detectLocale('ja-JP'), 'ja');
  assert.equal(detectLocale('ko-KR'), 'ko');
  assert.equal(detectLocale('fr-FR'), 'zh-CN');
  assert.equal(detectLocale('xx'), 'zh-CN');
});

test('missing translations fall back to zh-CN and the choice is saved', () => {
  setActiveLocale('en');
  assert.equal(t('hud.plant'), 'Plant all');
  assert.equal(t('note.untranslated'), '这段还没有译文，先显示简体中文。');
  assert.equal(t('missing.key'), 'missing.key');
  assert.equal(t('hud.level', { n: 3 }), 'Lv 3');
  const fresh = newFarm(NOW);
  assert.equal(fresh.locale, 'zh-CN');
  fresh.locale = 'ja';
  fresh.coins = 321;
  const restored = parseSave(serialize(fresh, NOW), NOW, false);
  assert.ok(restored);
  assert.equal(restored.locale, 'ja');
  assert.equal(restored.coins, 321);
  const old = JSON.parse(serialize(fresh, NOW));
  delete old.locale;
  const migrated = parseSave(JSON.stringify(old), NOW, false);
  assert.equal(migrated?.locale, 'zh-CN');
  setActiveLocale('zh-CN');
  assert.equal(activeLocale(), 'zh-CN');
  assert.equal(t('hud.plant'), '一键种植');
});
