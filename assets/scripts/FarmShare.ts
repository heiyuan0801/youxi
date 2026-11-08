import {itemName, t} from './FarmI18n';

export type ShareKind = 'invite' | 'first-harvest' | 'decor' | 'festival' | 'streak' | 'red-soil' | 'recipe' | 'codex';

export interface ShareMoment {
  id: string;
  kind: Exclude<ShareKind, 'invite'>;
  score: number;
  token: string;
  at: number;
}

export interface SharePayload {
  momentId: string;
  locale: string;
  title: string;
  text: string;
  link: string;
  svg: string;
  filename: string;
}

export interface ShareHost {
  platform: 'ios' | 'android' | 'web' | 'other';
  iosShare?: (text: string, svg: string) => boolean;
  webShare?: (data: {title?: string; text?: string; url?: string; files?: unknown[]}) => Promise<void>;
  canShareFiles?: (files: unknown[]) => boolean;
  makeFile?: (filename: string, svg: string) => unknown;
  clipboard?: (text: string) => Promise<void>;
  saveImage?: (filename: string, svg: string) => boolean;
}

export interface ShareResult {
  ok: boolean;
  channel: 'ios' | 'web-share' | 'copy' | 'save-image' | 'unavailable';
  message: string;
}

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function checksum(body: string): string {
  let hash = 0;
  for (let i = 0; i < body.length; i++) hash = (hash + ALPHA.indexOf(body[i]) * (i * 7 + 3)) % (ALPHA.length * ALPHA.length);
  return ALPHA[Math.floor(hash / ALPHA.length)] + ALPHA[hash % ALPHA.length];
}

export function makeInviteCode(seed: number): string {
  let n = (Math.imul(Math.floor(Math.abs(seed)) % 0x100000000, 1664525) + 1013904223) >>> 0;
  if (n === 0) n = 1;
  let body = '';
  for (let i = 0; i < 6; i++) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    body += ALPHA[n % ALPHA.length];
  }
  return body + checksum(body);
}

export function validInviteCode(code: string): boolean {
  const value = code.trim().toUpperCase();
  if (value.length !== 8 || value.split('').some(char => !ALPHA.includes(char))) return false;
  return value.slice(6) === checksum(value.slice(0, 6));
}

export function inviteLink(code: string): string {
  return `qingye://invite?code=${code}`;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[char]!));
}

export function momentText(moment: ShareMoment | null, locale: string | undefined, code: string): {title: string; line: string} {
  if (!moment) return {title: t('share.inviteTitle', {}, locale), line: t('share.inviteBody', {code}, locale)};
  const name = moment.token ? itemName(moment.token, t(`codex.${moment.token}`, {}, locale), locale) : '';
  const line = t(`share.card.${moment.kind}`, {score: moment.score, name}, locale);
  return {title: t('share.inviteTitle', {}, locale), line};
}

export function composeShare(locale: string | undefined, code: string, moment?: ShareMoment | null): SharePayload {
  const copy = momentText(moment ?? null, locale, code);
  const text = moment
    ? `${copy.line}\n${t('share.inviteBody', {code}, locale)}`
    : t('share.inviteBody', {code}, locale);
  const svg = renderShareCard(copy.title, copy.line, t('share.offlineNote', {}, locale), code);
  return {
    momentId: moment?.id || 'invite',
    locale: locale || 'zh-CN',
    title: copy.title,
    text,
    link: inviteLink(code),
    svg,
    filename: 'qingye-share.svg',
  };
}

export function renderShareCard(title: string, line: string, note: string, code: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900">
  <rect width="720" height="900" rx="36" fill="#f6e7c8"/>
  <rect x="36" y="36" width="648" height="828" rx="28" fill="#fffaf1" stroke="#e7c48a" stroke-width="4"/>
  <circle cx="150" cy="180" r="54" fill="#8dce73"/>
  <circle cx="520" cy="150" r="28" fill="#f2c14e"/>
  <text x="360" y="300" text-anchor="middle" font-size="40" fill="#5a3e2b" font-family="sans-serif">${escapeXml(title)}</text>
  <text x="360" y="420" text-anchor="middle" font-size="28" fill="#7a5538" font-family="sans-serif">${escapeXml(line)}</text>
  <text x="360" y="560" text-anchor="middle" font-size="24" fill="#997455" font-family="sans-serif">${escapeXml(note)}</text>
  <text x="360" y="680" text-anchor="middle" font-size="36" fill="#3f6b45" font-family="sans-serif">${escapeXml(code)}</text>
</svg>`;
}

export async function presentShare(payload: SharePayload, host: ShareHost): Promise<ShareResult> {
  const text = `${payload.text}\n${payload.link}`;
  const say = (key: string) => t(key, {}, payload.locale);
  if (host.platform === 'ios' && host.iosShare?.(text, payload.svg)) {
    return {ok: true, channel: 'ios', message: say('share.ios')};
  }
  if (host.webShare) {
    try {
      const data: {title?: string; text?: string; url?: string; files?: unknown[]} = {title: payload.title, text: payload.text, url: payload.link};
      if (host.makeFile && host.canShareFiles) {
        const file = host.makeFile(payload.filename, payload.svg);
        if (file && host.canShareFiles([file])) data.files = [file];
      }
      await host.webShare(data);
      return {ok: true, channel: 'web-share', message: say('share.web')};
    } catch (error) {
      const name = error && typeof error === 'object' && 'name' in error ? String((error as {name: string}).name) : '';
      if (name === 'AbortError') return {ok: false, channel: 'web-share', message: say('share.cancel')};
    }
  }
  let copied = false;
  let saved = false;
  if (host.clipboard) {
    try { await host.clipboard(text); copied = true; } catch { copied = false; }
  }
  if (host.saveImage) saved = host.saveImage(payload.filename, payload.svg) !== false;
  if (copied) return {ok: true, channel: 'copy', message: say('share.copy')};
  if (saved) return {ok: true, channel: 'save-image', message: say('share.saved')};
  return {ok: false, channel: 'unavailable', message: say('share.fail')};
}
