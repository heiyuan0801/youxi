import test from 'node:test';
import assert from 'node:assert/strict';
import {newFarm, parseSave, serialize} from '../assets/scripts/FarmModel';
import {makeInviteCode, presentShare, validInviteCode, type ShareHost} from '../assets/scripts/FarmShare';
import {redeemInvite, sharePayloadFor} from '../assets/scripts/FarmRetention';
import {atLocalNoon, localDate} from '../assets/scripts/FarmI18n';

const NOW = atLocalNoon(localDate(1_800_000_000_000));

test('invite codes round-trip and reject edits', () => {
  const code = makeInviteCode(NOW);
  assert.equal(validInviteCode(code.toLowerCase()), true);
  assert.equal(validInviteCode(code.slice(0, 7) + (code[7] === 'A' ? 'B' : 'A')), false);
  assert.equal(validInviteCode('SHORT'), false);
});

test('a friend code grants one local starter gift and never pays the sender', () => {
  const host = newFarm(NOW);
  const guest = newFarm(NOW + 1);
  const before = host.coins;
  assert.equal(redeemInvite(guest, host.retention.share.code).ok, true);
  assert.equal(guest.coins, newFarm(NOW).coins + 40);
  assert.equal(guest.inventory.wheat, 4);
  assert.equal(guest.stars, 1);
  assert.equal(redeemInvite(guest, host.retention.share.code).ok, false);
  assert.equal(guest.coins, newFarm(NOW).coins + 40);
  assert.equal(host.coins, before);
  assert.equal(redeemInvite(host, host.retention.share.code).ok, false);
  assert.equal(redeemInvite(newFarm(NOW), 'not-a-code').ok, false);
  assert.ok(parseSave(serialize(guest, NOW), NOW));
});

test('share text stays offline and the sheet falls back without a friend list', async () => {
  const s = newFarm(NOW);
  const payload = sharePayloadFor(s, 'invite')!;
  assert.match(payload.text, /单机|offline|オフライン|오프라인/);
  assert.match(payload.text, /没有好友列表|no friend list|友だちリストも|친구 목록도/);
  assert.doesNotMatch(payload.text, /multiplayer|在线好友：/);
  assert.match(payload.link, /^qingye:\/\/invite\?code=/);
  assert.match(payload.svg, /<svg/);
  const ios = await presentShare(payload, {platform: 'ios', iosShare: () => true});
  assert.equal(ios.channel, 'ios');
  let shared: {url?: string; files?: unknown[]} | undefined;
  const web = await presentShare(payload, {
    platform: 'web',
    webShare: async data => { shared = data; },
    canShareFiles: () => true,
    makeFile: () => ({name: 'card'}),
  });
  assert.equal(web.channel, 'web-share');
  assert.equal(shared?.url, payload.link);
  assert.equal(shared?.files?.length, 1);
  const cancelled = await presentShare(payload, {platform: 'web', webShare: async () => { throw Object.assign(new Error('no'), {name: 'AbortError'}); }});
  assert.equal(cancelled.ok, false);
  let copied = '';
  let saved = '';
  const fallback = await presentShare(payload, {
    platform: 'android',
    webShare: async () => { throw new Error('missing'); },
    clipboard: async text => { copied = text; },
    saveImage: (name, svg) => { saved = name + svg.slice(0, 4); return true; },
  } satisfies ShareHost);
  assert.equal(fallback.channel, 'copy');
  assert.match(copied, /qingye:\/\/invite/);
  assert.match(saved, /qingye-share\.svg/);
});
