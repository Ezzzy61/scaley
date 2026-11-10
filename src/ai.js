// Client for the "ai" Edge Function, plus image downscaling and the user's own-key settings.
import { supa } from './supa.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { FOODS } from './data.js';
import { rows, get } from './store.js';
import { today, addDays, dayIntake, dayBurn, targetKcal, proteinFloor, goalOf, weightSeries, bmr, readiness } from './calc.js';
import { PLANS, recommendPlans, todayKey, CONDITIONS } from './plans.js';
import { climateTip } from './regions.js';

const BYOK_KEY = 'scaley:byok';
export const PROVIDERS = [
  { key: 'gemini', label: 'Google Gemini', model: 'gemini-2.5-flash', url: 'https://aistudio.google.com/apikey' },
  { key: 'openai', label: 'OpenAI (ChatGPT)', model: 'gpt-5-mini', url: 'https://platform.openai.com/api-keys' },
  { key: 'anthropic', label: 'Anthropic (Claude)', model: 'claude-haiku-5-5', url: 'https://console.anthropic.com/settings/keys' },
  { key: 'xai', label: 'xAI (Grok)', model: 'grok-4', url: 'https://console.x.ai' },
];
// Own keys stay on this device only (never synced to Scaley's database).
export function getByok() { try { return JSON.parse(localStorage.getItem(BYOK_KEY)) || null; } catch { return null; } }
export function setByok(v) { try { v ? localStorage.setItem(BYOK_KEY, JSON.stringify(v)) : localStorage.removeItem(BYOK_KEY); } catch {} }

export const aiState = { used: null, limit: null, provider: null };

export async function callAI(task, payload = {}) {
  if (!navigator.onLine) throw new Error('You are offline. AI features need a connection.');
  const { data: { session } } = await supa.auth.getSession();
  if (!session) throw new Error('Please sign in again.');
  const byok = getByok();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ task, ...payload, ...(byok?.key ? { byok } : {}) }),
  });
  let out = {};
  try { out = await res.json(); } catch {}
  if (!res.ok) throw new Error(out.error || `AI error ${res.status}`);
  if (out.limit) { aiState.used = out.used; aiState.limit = out.limit; }
  aiState.provider = out.provider;
  return out;
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
    seasonNote: climateTip(p.city),
    plan: { name: plan.title, today: plan.week[todayKey()] || null },
    targets: { kcal: targetKcal(p), protein_g: proteinFloor(p), bmr: bmr(p) },
    today: { ...dayIntake(t), burn: dayBurn(t, p).total, checkin: ci ? { ...ci, readiness: readiness(ci)?.title } : null },
    recentCheckins, recentActivity: acts, last7days: days, weights: ws, recentSets: lastSets,
  };
}
