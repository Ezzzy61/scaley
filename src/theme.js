// Theme engine: light/dark/system, accent from goal or motivation archetype, display "skin".
import { archOf } from './motivation.js';

export const GOAL_ACCENT = {
  aggressive: '#f97316', // burn orange
  moderate: '#10b981', // emerald
  recomp: '#14b8a6', // teal
  leanbulk: '#f59e0b', // amber
  strength: '#6366f1', // indigo
  figure: '#0ea5e9', // sky
};

const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgb2hex = (r) => '#' + r.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };

export function accentFor(p) {
  if (p?.accent_mode === 'motivation' && p?.motivation?.arch) return archOf(p.motivation.arch).color;
  return GOAL_ACCENT[p?.goal] || GOAL_ACCENT.moderate;
}
export function resolvedTheme(p) {
  const t = p?.theme || localStorage.getItem('scaley:theme') || 'system';
  return t === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : t;
}

let mq = null;
export function applyTheme(p) {
  const root = document.documentElement;
  const mode = resolvedTheme(p);
  const acc = hex2rgb(accentFor(p));
  const light = mode === 'light';
  // em2 = readable accent text: lighter on dark, darker on light.
  const em2 = light ? mix(acc, [0, 0, 0], 0.28) : mix(acc, [255, 255, 255], 0.25);
  root.dataset.theme = mode;
  root.dataset.skin = p?.motivation?.arch ? archOf(p.motivation.arch).skin : 'clean';
  root.style.setProperty('--em', rgb2hex(acc));
  root.style.setProperty('--em2', rgb2hex(em2));
  root.style.setProperty('--emr', acc.join(','));
  root.style.setProperty('--on-em', lum(acc) > 0.35 ? '#0b0b0d' : '#ffffff');
  // If the accent itself is red/pink, move warnings to amber so "goal hit" and "over limit" never look the same.
  const [r, g, b] = acc, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let hue = 0; if (mx !== mn) { hue = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; hue = (hue * 60 + 360) % 360; }
  const reddish = mx - mn > 60 && (hue < 20 || hue > 315);
  for (const [k, dark, lightV] of [['--ro', '#f59e0b', '#d97706'], ['--ro2', '#fbbf24', '#b45309'], ['--rob', 'rgba(245,158,11,.13)', 'rgba(217,119,6,.10)'], ['--ro-tx', '#fde68a', '#92400e']]) {
    if (reddish) root.style.setProperty(k, light ? lightV : dark); else root.style.removeProperty(k);
  }
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = light ? '#f6f6f3' : '#09090b';
  try { localStorage.setItem('scaley:theme', p?.theme || 'system'); } catch {}
  if (!mq) { mq = matchMedia('(prefers-color-scheme: light)'); mq.addEventListener?.('change', () => applyTheme(window.__scaleyP)); }
  window.__scaleyP = p;
}
