import type {FeaturePanelContext} from './FeaturePanels';
import {NAMES} from './FarmModel';
import {RECIPES} from './FarmFeatures';
import {ANIMALS, FURNITURE} from './FarmCatalog';
import {itemName, named, t, localizeOrder} from './FarmI18n';
import {achievementList, achievementReady, acceptTomorrow, claimAchievement, claimChecklist, claimCodex, claimLogin, claimNeighbor, codexGifts, decorScore, deliverTomorrow, enterContest, markFestival, nextDayHooks, pickBlessing, revealRecipe, tomorrowOffer, type Blessing} from './FarmRetention';

export type AgendaTab = 'morning' | 'login' | 'medals' | 'codex' | 'cook' | 'shrine' | 'neighbors' | 'tomorrow';

const INK = '#5a3e2b', SOFT = '#997455';

export function agendaHeight(tab: AgendaTab): number {
  if (tab === 'codex') return 980;
  if (tab === 'cook') return 220 + RECIPES.length * 48;
  if (tab === 'medals') return 160 + achievementList.length * 62;
  return 760;
}

export function agendaPanel(c: FeaturePanelContext, tab: AgendaTab, setTab: (tab: AgendaTab) => void) {
  const {p, root, w, state: s, button, slot, act} = c;
  const locale = s.retention.locale;
  const tabs: AgendaTab[] = ['morning', 'login', 'medals', 'codex', 'cook', 'shrine', 'neighbors', 'tomorrow'];
  const labels = [t('check.title', {}, locale), t('login.title', {}, locale), t('ach.title', {}, locale), t('codex.title', {}, locale), t('cook.title', {}, locale), t('shrine.title', {}, locale), t('neighbor.title', {}, locale), t('tomorrow.title', {}, locale)];
  tabs.forEach((id, index) => {
    const x = w / 8 + (index % 4) * (w / 4);
    const y = 22 + Math.floor(index / 4) * 36;
    button(labels[index], x, y, w / 4 - 6, 30, () => setTab(id), tab === id ? '#ffb150' : '#dfcfb2', tab === id ? '#dc8a29' : '#beaa87', 11);
  });
  if (tab === 'morning') morning(c, locale);
  else if (tab === 'login') login(c, locale);
  else if (tab === 'medals') medals(c, locale);
  else if (tab === 'codex') codex(c, locale);
  else if (tab === 'cook') cook(c, locale);
  else if (tab === 'shrine') shrine(c, locale);
  else if (tab === 'neighbors') neighbors(c, locale);
  else tomorrow(c, locale);
  void p; void root; void w; void slot; void act; void s;
}

function morning(c: FeaturePanelContext, locale: string) {
  const {p, root, w, state: s, button, slot, act} = c;
  const list = s.retention.checklist;
  const rows: [string, boolean][] = [
    [t('check.harvest', {}, locale), list.harvest],
    [t('check.plant', {}, locale), list.plant],
    [t('check.water', {}, locale), list.water],
    [t('check.festival', {}, locale), list.festival],
    [t('check.login', {}, locale), list.login],
  ];
  p.label(root, t('check.streak', {n: list.streak}, locale), w / 2, 108, 16, INK, w - 20, 28);
  rows.forEach(([label, done], index) => {
    const y = 156 + index * 52;
    slot(w / 2, y, w, 46);
    p.label(root, `${done ? '✓' : '·'} ${label}`, 24, y, 15, done ? '#3c8f4e' : INK, w - 40, 30, true, 'left');
  });
  button(t('check.glance', {}, locale), w / 2, 430, w - 20, 40, () => act(() => markFestival(s)), '#ffb150', '#dc8a29', 14);
  button(list.claimed ? t('check.done', {}, locale) : t('check.claim', {}, locale), w / 2, 482, w - 20, 44, () => act(() => claimChecklist(s)));
  nextDayHooks(s).forEach((line, index) => p.label(root, line, w / 2, 540 + index * 36, 12, SOFT, w - 16, 34));
  const titles = s.retention.harvestStreak.titles;
  p.label(root, t('title.wall', {}, locale), w / 2, 700, 15, INK, w - 16, 26);
  p.label(root, titles.length ? titles.map(id => t(`title.${id}`, {}, locale)).join(' · ') : '·', w / 2, 728, 13, SOFT, w - 16, 26);
}

function login(c: FeaturePanelContext, locale: string) {
  const {p, root, w, state: s, button, slot} = c;
  const today = s.retention.checklist.date;
  const claimedToday = s.retention.login.last === today;
  const index = claimedToday ? (s.retention.login.next === 0 ? 7 : s.retention.login.next) : (s.retention.login.last === '' ? 1 : s.retention.login.next + 1);
  p.label(root, t('login.hint', {}, locale), w / 2, 120, 13, SOFT, w - 16, 56);
  for (let day = 1; day <= 7; day++) {
    const y = 176 + day * 46;
    slot(w / 2, y, w, 40);
    p.label(root, `${day}`, w / 2, y, 15, day === index ? '#3c8f4e' : INK, w - 24, 28);
  }
  button(t('login.claim', {n: index}, locale), w / 2, 540, w - 20, 46, () => c.act(() => claimLogin(s)));
}

function medals(c: FeaturePanelContext, locale: string) {
  const {p, root, w, state: s, button, slot, act} = c;
  achievementList.forEach((item, index) => {
    const y = 120 + index * 62;
    const owned = s.retention.medals.includes(item.id);
    slot(w / 2, y, w, 54);
    p.label(root, t(`ach.${item.id}.name`, {}, locale), 20, y, 15, INK, w * .55, 28, true, 'left');
    button(owned ? t('ach.have', {}, locale) : t('ach.claim', {}, locale), w - 78, y, 130, 36, () => act(() => claimAchievement(s, item.id)), owned || !achievementReady(s, item.id) ? '#cbbd9e' : '#67ca70', '#3fa84d', 12);
  });
  p.label(root, `${t('title.wall', {}, locale)} · ${decorScore(s)}`, w / 2, 120 + achievementList.length * 62, 13, SOFT, w - 16, 28);
}

function codex(c: FeaturePanelContext, locale: string) {
  const {p, root, w, state: s, button, act} = c;
  const groups: [string, string[], (id: string) => string][] = [
    [t('codex.crops', {}, locale), s.retention.codex.crops, id => itemName(id, NAMES[id as keyof typeof NAMES] || id, locale)],
    [t('codex.animals', {}, locale), s.retention.codex.animals, id => named('animal', id, ANIMALS.find(animal => animal.id === id)?.name || id, locale)],
    [t('codex.furniture', {}, locale), s.retention.codex.furniture, id => named('furniture', id, FURNITURE.find(item => item.id === id)?.name || id, locale)],
    [t('codex.layers', {}, locale), s.retention.codex.layers, id => id],
  ];
  let y = 110;
  for (const [title, ids, name] of groups) {
    p.label(root, `${title} · ${ids.length}`, w / 2, y, 16, INK, w - 16, 26);
    p.label(root, ids.length ? ids.map(name).join('、') : '·', w / 2, y + 28, 12, SOFT, w - 16, 36);
    y += 72;
  }
  codexGifts.forEach((gift, index) => {
    const row = y + index * 48;
    const owned = s.retention.codex.claimed.includes(gift.id);
    button(`${t(`codex.${gift.id}`, {}, locale)} · ${owned ? t('codex.have', {}, locale) : t('codex.claim', {}, locale)}`, w / 2, row, w - 16, 40, () => act(() => claimCodex(s, gift.id)), owned ? '#cbbd9e' : '#67ca70', '#3fa84d', 12);
  });
}

function cook(c: FeaturePanelContext, locale: string) {
  const {p, root, w, state: s, button, slot, act} = c;
  p.label(root, s.retention.cooking.contestDate === s.retention.checklist.date ? t('cook.today', {}, locale) : t('cook.title', {}, locale), w / 2, 110, 14, SOFT, w - 16, 28);
  button(t('cook.reveal', {}, locale), w / 2, 154, w - 16, 40, () => act(() => revealRecipe(s)), '#ffb150', '#dc8a29', 13);
  RECIPES.forEach((recipe, index) => {
    const y = 214 + index * 48;
    const known = s.retention.cooking.discovered.includes(recipe.id);
    slot(w / 2, y, w, 42);
    p.label(root, known ? itemName(recipe.id, recipe.name, locale) : t('cook.locked', {}, locale), 18, y, 13, INK, w * .48, 26, true, 'left');
    if (known) button(t('cook.enter', {}, locale), w - 78, y, 130, 32, () => act(() => enterContest(s, recipe.id)), '#67ca70', '#3fa84d', 11);
  });
}

function shrine(c: FeaturePanelContext, locale: string) {
  const {p, root, w, state: s, button, act} = c;
  const blessings: Blessing[] = ['sprout', 'bounty', 'drizzle', 'glow'];
  p.label(root, s.retention.shrine.blessing && s.retention.shrine.date === s.retention.checklist.date ? t('shrine.have', {}, locale) : t('shrine.title', {}, locale), w / 2, 120, 14, SOFT, w - 16, 48);
  blessings.forEach((id, index) => {
    const y = 190 + index * 90;
    p.label(root, t(`shrine.${id}`, {}, locale), w / 2, y, 14, INK, w - 20, 40);
    button(t('shrine.pick', {}, locale), w / 2, y + 36, w - 40, 36, () => act(() => pickBlessing(s, id)));
  });
}

function neighbors(c: FeaturePanelContext, locale: string) {
  const {p, root, w, state: s, button, slot, act} = c;
  p.label(root, t('neighbor.note', {}, locale), w / 2, 120, 13, SOFT, w - 16, 50);
  s.retention.neighbors.quests.forEach((quest, index) => {
    const y = 200 + index * 120;
    slot(w / 2, y, w, 104);
    const label = t(`neighbor.${quest.kind}`, {n: quest.target}, locale);
    p.label(root, `${quest.npc} · ${label}`, w / 2, y - 24, 15, INK, w - 24, 28);
    p.label(root, `${quest.progress}/${quest.target}`, w / 2, y + 4, 14, SOFT, w - 24, 24);
    button(quest.claimed ? t('ach.have', {}, locale) : t('neighbor.claim', {}, locale), w / 2, y + 34, w - 40, 36, () => act(() => claimNeighbor(s, quest.id)), quest.progress >= quest.target && !quest.claimed ? '#67ca70' : '#cbbd9e', '#3fa84d', 13);
  });
}

function tomorrow(c: FeaturePanelContext, locale: string) {
  const {p, root, w, state: s, button, act} = c;
  const order = s.retention.tomorrow.order?.accepted ? s.retention.tomorrow.order : tomorrowOffer(s);
  const view = localizeOrder(order.person, order.message, locale);
  p.label(root, t('tomorrow.note', {}, locale), w / 2, 120, 14, SOFT, w - 16, 50);
  p.label(root, view.person, w / 2, 190, 18, INK, w - 16, 30);
  p.label(root, view.message, w / 2, 240, 15, SOFT, w - 20, 60);
  const needs = Object.entries(order.needs).map(([id, amount]) => `${itemName(id, NAMES[id as keyof typeof NAMES] || id, locale)} ×${amount}`).join('  ');
  p.label(root, needs, w / 2, 300, 14, INK, w - 16, 28);
  button(t('tomorrow.accept', {}, locale), w / 2, 360, w - 20, 42, () => act(() => acceptTomorrow(s)), '#ffb150', '#dc8a29');
  button(t('tomorrow.deliver', {}, locale), w / 2, 416, w - 20, 42, () => act(() => deliverTomorrow(s)));
}
