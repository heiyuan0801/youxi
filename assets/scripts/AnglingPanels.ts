import type {FeaturePanelContext} from './FeaturePanels';
import {artHook, fishArtHook} from './ArtHooks';
import {itemName, t} from './FarmI18n';
import {
  BAITS, FISH, POND_UNLOCK_COST, POND_UPGRADES, anglingPhase, buyAnglingBait, castRod, feedPondFish,
  harvestPondFish, hookBite, pondCapacity, reelCheck, reelMarker, sellPondFish, stockPond, unlockPond,
  upgradePond, type BaitId, type SpotId,
} from './FarmAngling';

const INK = '#5a3e2b', SOFT = '#997455';
export type FishTab = 'cast' | 'pond';

export function anglingPanel(c: FeaturePanelContext, tab: FishTab, setTab: (tab: FishTab) => void, spot: SpotId, bait: BaitId, setSpot: (spot: SpotId) => void, setBait: (bait: BaitId) => void) {
  const {p, root, w, state: s, button, slot, act, live} = c;
  const locale = s.retention?.locale;
  const has = (key: string) => p.art.has(key);
  (['cast', 'pond'] as const).forEach((id, index) => {
    button(t(id === 'cast' ? 'fish.tabCast' : 'fish.tabPond', {}, locale), w / 4 + index * w / 2, 24, w / 2 - 12, 36, () => setTab(id), tab === id ? '#57bddd' : '#dfcfb2', tab === id ? '#3493b1' : '#beaa87', 14);
  });
  if (tab === 'pond') return pondTab(c, locale, has);
  const phase = anglingPhase(s);
  const session = s.fishery.session;
  p.contain(root, artHook('hook-rod', has), 36, 78, 52, 52);
  BAITS.forEach((entry, index) => {
    const x = 120 + index * 150;
    p.contain(root, artHook(`hook-bait-${entry.id}`, has), x - 28, 78, 28, 28);
    button(`${t(`bait.${entry.id}`, {}, locale)} ${s.fishery.bait[entry.id]}`, x + 36, 78, 108, 34, () => { setBait(entry.id); act(() => buyAnglingBait(s, entry.id)); }, bait === entry.id ? '#ffb150' : '#dfcfb2', '#dc8a29', 11);
  });
  (['home', 'beach', 'snow'] as const).forEach((id, index) => {
    button(t(`spot.${id}`, {}, locale), w / 6 + index * w / 3, 132, w / 3 - 10, 34, () => setSpot(id), spot === id ? '#57bddd' : '#dfcfb2', '#3493b1', 12);
  });
  const status = p.label(root, '', w / 2, 176, 15, INK, w - 16, 36);
  const paint = () => {
    const now = Date.now();
    const current = anglingPhase(s, now);
    status.string = current === 'waiting' ? t('fish.wait', {}, locale) : current === 'bite' ? t('fish.hook', {pulls: FISH.find(fish => fish.id === session?.species)?.pulls || 1}, locale) : current === 'reel' ? `${t('fish.reeling', {}, locale)} ${session?.reel ? Math.round(reelMarker(session.reel, now)) : ''}` : current === 'escaped' ? t('fish.escaped', {}, locale) : t('fish.cast', {}, locale);
  };
  paint();
  live(paint);
  if (session?.reel) {
    const reel = session.reel;
    const y = 230;
    const trackW = w - 48;
    p.rect(root, w / 2, y, trackW, 18, '#d7eef5', 8);
    p.rect(root, 24 + trackW * (reel.zone + reel.width / 2) / 100, y, trackW * reel.width / 100, 18, '#8ed48a', 8);
    const marker = p.rect(root, 24, y, 12, 28, '#5a3e2b', 4);
    const move = () => {
      const x = 24 + trackW * reelMarker(reel, Date.now()) / 100;
      marker.setPosition(x - p.w / 2, p.h / 2 - y);
    };
    move();
    live(move);
    p.label(root, `${reel.hits}/${reel.pulls}`, w / 2, 262, 13, SOFT, w - 20, 24);
  }
  const action = phase === 'reel' ? () => reelCheck(s) : phase === 'bite' ? () => hookBite(s) : () => castRod(s, spot, bait);
  button(phase === 'reel' ? t('fish.reelBtn', {}, locale) : phase === 'bite' ? t('fish.lift', {}, locale) : phase === 'waiting' ? t('fish.wait', {}, locale) : t('fish.tabCast', {}, locale), w / 2, 320, Math.min(280, w - 24), 48, () => act(action), phase === 'bite' || phase === 'reel' ? '#ff7aa2' : '#57bddd', '#3493b1', 18);
  p.contain(root, artHook('hook-fish-bucket', has), 36, 378, 36, 36);
  p.label(root, s.fishery.codex.length ? s.fishery.codex.map(id => itemName(id, id, locale)).join('、') : '·', w / 2 + 16, 378, 13, SOFT, w - 70, 40);
}

function pondTab(c: FeaturePanelContext, locale: string | undefined, has: (key: string) => boolean) {
  const {p, root, w, state: s, button, slot, act} = c;
  const pond = s.fishery.pond;
  p.contain(root, artHook(!pond.unlocked || !pond.stock.length ? 'hook-pond-empty' : 'hook-pond', has), 40, 86, 56, 48);
  if (!pond.unlocked) {
    p.label(root, t('pond.locked', {}, locale), w / 2, 150, 16, INK, w - 20, 32);
    button(`${t('pond.dig', {}, locale)} · ${POND_UNLOCK_COST}`, w / 2, 210, w - 40, 46, () => act(() => unlockPond(s)));
    return;
  }
  const next = POND_UPGRADES[pond.upgrades];
  p.label(root, `${pond.stock.length}/${pondCapacity(s.fishery)}`, w / 2, 78, 16, INK, 120, 28);
  button(next ? `${next.cost}` : t('pond.max', {}, locale), w - 80, 78, 130, 36, () => act(() => upgradePond(s)), '#ffb150', '#dc8a29', 13);
  FISH.forEach((fish, index) => {
    const y = 140 + index * 52;
    slot(w / 2, y, w, 46);
    p.contain(root, artHook(fishArtHook(fish.id), has), 28, y, 32, 28);
    p.label(root, `${itemName(fish.id, fish.id, locale)} · ${fish.fingerling}`, 120, y, 13, INK, 180, 28, true, 'left');
    button(t('pond.place', {}, locale), w - 54, y, 80, 32, () => act(() => stockPond(s, fish.id)), '#57bddd', '#3493b1', 12);
  });
  pond.stock.forEach((fish, index) => {
    const y = 470 + index * 64;
    slot(w / 2, y, w, 56);
    p.contain(root, artHook(fishArtHook(fish.species, true), has), 28, y, 32, 28);
    p.label(root, itemName(fish.species, fish.species, locale), 78, y, 14, INK, 110, 28, true, 'left');
    button(t('pond.feedBtn', {}, locale), w * .48, y, 70, 32, () => act(() => feedPondFish(s, fish.id)), '#ffb150', '#dc8a29', 12);
    button(t('pond.haul', {}, locale), w * .68, y, 70, 32, () => act(() => harvestPondFish(s, fish.id)));
    button(t('pond.sellBtn', {}, locale), w * .88, y, 70, 32, () => act(() => sellPondFish(s, fish.id)), '#c9bca5', '#ad9b7e', 12);
  });
}
