// Client for the "ai" Edge Function, plus image downscaling and the user's own-key settings.
import { supa } from './supa.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { FOODS } from './data.js';
import { rows, get } from './store.js';
import { today, addDays, dayIntake, dayBurn, targetKcal, proteinFloor, goalOf, weightSeries, bmr, readiness } from './calc.js';
import { PLANS, recommendPlans, todayKey, CONDITIONS } from './plans.js';
import { climateTip } from './regions.js';

const ENGINE_KEY = 'scaley:engine';
export const KEY_PROVIDERS = [
  { key: 'gemini', label: 'Google Gemini (free tier)', model: 'gemini-flash-latest', url: 'https://aistudio.google.com/apikey', free: true },
  { key: 'groq', label: 'Groq (free tier)', model: 'openai/gpt-oss-120b', url: 'https://console.groq.com/keys', free: true },
  { key: 'openrouter', label: 'OpenRouter', model: 'openrouter/free', url: 'https://openrouter.ai/keys', free: true },
  { key: 'openai', label: 'OpenAI (ChatGPT API)', model: 'gpt-5-mini', url: 'https://platform.openai.com/api-keys' },
  { key: 'anthropic', label: 'Anthropic (Claude API)', model: 'claude-haiku-5-5', url: 'https://console.anthropic.com/settings/keys' },
  { key: 'xai', label: 'xAI (Grok API)', model: 'grok-4', url: 'https://console.x.ai' },
];
export const PROVIDERS = KEY_PROVIDERS;
export const PUTER_MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini Flash' },
  { id: 'x-ai/grok-4.3', label: 'Grok' },
  { id: 'gpt-5.5', label: 'GPT' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet' },
];

// Engine choice lives on this device only. Keys are never synced to Scaley's database.
// { type: 'free' | 'openrouter' | 'puter' | 'key', provider?, key?, model?, fallback: boolean }
export function getEngine() {
  try {
    const e = JSON.parse(localStorage.getItem(ENGINE_KEY));
    if (e) return e;
    const old = JSON.parse(localStorage.getItem('scaley:byok'));
    if (old?.key) return { type: 'key', provider: old.provider, key: old.key, model: old.model, fallback: true };
  } catch {}
  return { type: 'free', fallback: true };
}
export function setEngine(e) { try { localStorage.setItem(ENGINE_KEY, JSON.stringify(e)); localStorage.removeItem('scaley:byok'); } catch {} }
export const getByok = () => { const e = getEngine(); return e.type === 'key' || e.type === 'openrouter' ? { provider: e.provider || 'openrouter', key: e.key, model: e.model } : null; };
export const setByok = (b) => setEngine(b ? { type: 'key', ...b, fallback: true } : { type: 'free', fallback: true });
export function engineLabel(e = getEngine()) {
  if (e.type === 'openrouter') return 'Your OpenRouter';
  if (e.type === 'puter') return `Puter · ${PUTER_MODELS.find((m) => m.id === e.model)?.label || 'AI'}`;
  if (e.type === 'key') return `Your ${KEY_PROVIDERS.find((p) => p.key === e.provider)?.label.split(' (')[0] || 'key'}`;
  return 'Scaley Free';
}

export const aiState = { used: null, limit: null, provider: null };

async function fnCall(body) {
  const { data: { session } } = await supa.auth.getSession();
  if (!session) throw Object.assign(new Error('Please sign in again.'), { fatal: true });
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  let out = {};
  try { out = await res.json(); } catch {}
  if (!res.ok) throw Object.assign(new Error(out.error || `AI error ${res.status}`), { status: res.status });
  return out;
}

// ---------- Puter (user-pays, sign in with Puter) ----------
let puterLoading = null;
export function loadPuter() {
  if (window.puter) return Promise.resolve(window.puter);
  puterLoading ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://js.puter.com/v2/'; s.async = true;
    s.onload = () => res(window.puter); s.onerror = () => { puterLoading = null; rej(new Error('Could not load Puter. Check your connection.')); };
    document.head.appendChild(s);
  });
  return puterLoading;
}
export async function puterSignIn() {
  const puter = await loadPuter();
  if (!puter.auth.isSignedIn()) await puter.auth.signIn();
  return puter.auth.isSignedIn();
}
const textOf = (r) => {
  const c = r?.message?.content ?? r?.text ?? r;
  return Array.isArray(c) ? c.map((x) => x.text || '').join('') : String(c ?? '');
};
function parseJsonLoose(t) {
  try { return JSON.parse(t); } catch {}
  const m = String(t).match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}
async function runPuter(eng, task, payload) {
  const puter = await loadPuter();
  if (!puter.auth.isSignedIn()) await puter.auth.signIn();
  const { prompt } = await fnCall({ task: 'prompt', kind: task, ...payload, images: [] });
  const model = eng.model || PUTER_MODELS[0].id;
  const imgs = payload.images || [];
  let reply;
  if (imgs.length) {
    const last = prompt.msgs[prompt.msgs.length - 1]?.text || '';
    reply = await puter.ai.chat(`${prompt.system}\n\n${last}`, `data:${imgs[0].mime};base64,${imgs[0].b64}`, false, { model });
  } else {
    reply = await puter.ai.chat([{ role: 'system', content: prompt.system }, ...prompt.msgs.map((m) => ({ role: m.role, content: m.text }))], { model });
  }
  const text = textOf(reply);
  if (prompt.wantJson) {
    const data = parseJsonLoose(text);
    if (!data) throw new Error('The AI returned something unreadable. Try again.');
    return { data, provider: 'puter', model };
  }
  return { text, provider: 'puter', model };
}

// ---------- OpenRouter one-click connect (OAuth PKCE) ----------
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function connectOpenRouter() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const state = b64url(crypto.getRandomValues(new Uint8Array(12)));
  sessionStorage.setItem('scaley:or', JSON.stringify({ verifier, state }));
  const cb = `${location.origin}${location.pathname}?or_cb=1`;
  location.href = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(cb)}&code_challenge=${challenge}&code_challenge_method=S256&state=${state}`;
}
// Call once on app start (after sign-in). Returns true if a connection was completed.
export async function finishOpenRouter() {
  const q = new URLSearchParams(location.search);
  if (!q.get('or_cb') || !q.get('code')) return false;
  const saved = JSON.parse(sessionStorage.getItem('scaley:or') || 'null');
  history.replaceState(null, '', location.pathname + location.hash);
  if (!saved || (q.get('state') && q.get('state') !== saved.state)) throw new Error('OpenRouter connection expired. Please try again.');
  sessionStorage.removeItem('scaley:or');
  const { key } = await fnCall({ task: 'or_exchange', code: q.get('code'), verifier: saved.verifier });
  setEngine({ type: 'openrouter', provider: 'openrouter', key, model: 'openrouter/free', fallback: true });
  return true;
}

// ---------- main entry ----------
async function runEngine(type, eng, task, payload) {
  if (type === 'puter') return runPuter(eng, task, payload);
  const byok = type === 'free' ? null : { provider: eng.provider || 'openrouter', key: eng.key, model: eng.model || undefined };
  return fnCall({ task, ...payload, ...(byok ? { byok } : {}) });
}
export async function callAI(task, payload = {}) {
  if (!navigator.onLine) throw new Error('You are offline. AI features need a connection.');
  const eng = getEngine();
  const order = eng.type === 'free' ? ['free'] : [eng.type, ...(eng.fallback !== false ? ['free'] : [])];
  let lastErr;
  for (const t of order) {
    try {
      const out = await runEngine(t, eng, task, payload);
      if (out.limit) { aiState.used = out.used; aiState.limit = out.limit; }
      aiState.provider = out.provider;
      return out;
    } catch (e) { lastErr = e; if (e.fatal) break; }
  }
  throw lastErr;
}

// Resize to keep uploads small and fast on mobile data.
export async function shrinkImage(file, max = 1024, quality = 0.82) {
  const bmp = await (window.createImageBitmap ? createImageBitmap(file) : new Promise((res, rej) => {
    const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = URL.createObjectURL(file);
  }));
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', quality));
  const dataUrl = cv.toDataURL('image/jpeg', quality);
  return { blob, dataUrl, mime: 'image/jpeg', b64: dataUrl.split(',')[1] };
}

export const foodCatalog = () => FOODS.map((f) => ({ id: f.id, name: f.name, unit: f.unit, kcal: f.kcal, p: f.p, c: f.c, f: f.f }));

// Compact snapshot of the user's own numbers for the coach.
export function coachContext(p) {
  const t = today();
  const days = [];
  for (let i = 0; i < 7; i++) { const d = addDays(t, -i); const x = dayIntake(d); if (x.items) days.push({ d, kcal: x.kcal, p: x.protein, c: x.carbs, f: x.fat }); }
  const ws = weightSeries().slice(-14).map((w) => ({ d: w.day, kg: w.kg, avg7: Math.round(w.ma * 10) / 10 }));
  const lastSets = rows('workout_sets').filter((s) => s.done && s.day >= addDays(t, -14))
    .sort((a, b) => b.day.localeCompare(a.day)).slice(0, 25).map((s) => `${s.day} ${s.exercise} ${s.kg}kg×${s.reps}`);
  const plan = PLANS.find((x) => x.id === p.plan_id) || recommendPlans(p)[0];
  const ci = get('checkins', t);
  const acts = rows('activities').filter((a) => a.day >= addDays(t, -2)).map((a) => `${a.day} ${a.label} ${a.minutes}min`);
  const recentCheckins = rows('checkins').filter((c) => c.day >= addDays(t, -6)).sort((a, b) => a.day.localeCompare(b.day))
    .map((c) => ({ d: c.day, sleep: c.sleep_h, energy: c.energy, stress: c.stress, sore: c.soreness, score: c.score }));
  return {
    now: new Date().toLocaleString('en-IN', { weekday: 'long', hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' }),
    profile: { sex: p.sex, age: p.age, height_cm: p.height_cm, weight_kg: p.weight_kg, target_kg: p.target_kg, goal: goalOf(p).label,
      occupation: p.occupation, experience: p.experience, diet: p.diet,
      location: [p.locality, p.city, p.state].filter(Boolean).join(', ') || 'India',
      conditions: (p.conditions || []).map((c) => CONDITIONS.find((x) => x.id === c)?.label || c),
      coach_language: p.coach_lang || 'hinglish' },
    motivation: p.motivation?.arch ? { style: p.motivation.arch, hero: p.motivation.hero || null, why: p.motivation.why || null,
      note: 'Match this energy in your tone and metaphors (original words only, never quote copyrighted lines).' } : null,
    seasonNote: climateTip(p.city),
    plan: { name: plan.title, today: plan.week[todayKey()] || null },
    targets: { kcal: targetKcal(p), protein_g: proteinFloor(p), bmr: bmr(p) },
    today: { ...dayIntake(t), burn: dayBurn(t, p).total, checkin: ci ? { ...ci, readiness: readiness(ci)?.title } : null },
    recentCheckins, recentActivity: acts, last7days: days, weights: ws, recentSets: lastSets,
  };
}
