import { GOALS, oilKcal } from './data.js';
import { rows, get } from './store.js';

// ---------- dates ----------
export const ymd = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const today = () => ymd();
export const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
export const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
export const prettyDay = (s) => {
  const t = today();
  if (s === t) return 'Today';
  if (s === addDays(t, -1)) return 'Yesterday';
  return new Date(s + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

// ---------- targets ----------
export const goalOf = (p) => GOALS[p?.goal] || GOALS.moderate;
export function bmr(p) {
  if (!p?.weight_kg) return 0;
  return Math.round(10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + (p.sex === 'male' ? 5 : -161));
}
export const stepKcal = (steps) => Math.round((steps || 0) * 0.045);
// Planned daily burn = measured TDEE if the 7-day diagnostic found one, else BMR + planned training + step goal.
export function plannedBurn(p) {
  if (p?.tdee) return p.tdee;
  return bmr(p) + (p?.plan_workout_kcal ?? 250) + stepKcal(p?.step_goal ?? 8000);
}
export const kcalFloor = (p) => (p?.sex === 'male' ? 1500 : 1200);
export const noDeficit = (p) => (p?.conditions || []).includes('pregnancy');
export function targetKcal(p) {
  const raw = plannedBurn(p) + (noDeficit(p) ? Math.max(0, goalOf(p).offset) : goalOf(p).offset);
  return Math.max(kcalFloor(p), Math.round(raw / 10) * 10);
}
export const proteinFloor = (p) => Math.round((p?.weight_kg || 0) * goalOf(p).protein);

// ---------- per-day numbers ----------
export function dayIntake(day) {
  const foods = rows('food_entries').filter((f) => f.day === day);
  let kcal = 0, protein = 0, carbs = 0, fat = 0;
  for (const f of foods) { kcal += f.kcal * f.qty; protein += f.protein * f.qty; carbs += (f.carbs || 0) * f.qty; fat += (f.fat || 0) * f.qty; }
  let oil = 0;
  for (const m of rows('meals').filter((m) => m.day === day)) {
    if (foods.some((f) => f.meal_id === m.id && f.qty > 0)) oil += oilKcal(m.oil);
  }
  return { kcal: Math.round(kcal + oil), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat + oil / 9), oil, items: foods.length };
}

// Strength training estimate: ~0.18 kcal per kg bodyweight per completed working set.
export function autoWorkoutKcal(day, p) {
  const sets = rows('workout_sets').filter((s) => s.day === day && s.done).length;
  return Math.round(sets * (p?.weight_kg || 70) * 0.18);
}
export function dayBurn(day, p) {
  const log = get('day_logs', day);
  const steps = log?.steps || 0;
  const auto = autoWorkoutKcal(day, p);
  const workout = log?.workout_kcal ?? auto;
  const acts = rows('activities').filter((a) => a.day === day);
  const activity = acts.reduce((s, a) => s + (a.kcal || 0), 0);
  const activeMin = acts.reduce((s, a) => s + (a.minutes || 0), 0);
  const b = bmr(p);
  return { bmr: b, steps, stepsKcal: stepKcal(steps), workout, autoWorkout: auto, activity, activeMin, total: b + workout + stepKcal(steps) + activity };
}

// Readiness 0-100 from today's check-in, plus a plain-language call.
export function readiness(c, travelMin = 0) {
  if (!c) return null;
  if (c.sick) return { score: 15, level: 'rest', title: 'Rest and recover', text: 'You\'re unwell. No training today. Sleep, fluids, dal-chawal and rest. If it lasts more than a few days or you have chest pain or fever, see a doctor.' };
  const sleepPts = Math.max(0, 25 - Math.abs(7.5 - (c.sleep_h ?? 7)) * 7);
  const q = ((c.sleep_q ?? 3) - 1) / 4, e = ((c.energy ?? 3) - 1) / 4, s = 1 - ((c.stress ?? 3) - 1) / 4, so = 1 - ((c.soreness ?? 3) - 1) / 4;
  let score = sleepPts + q * 15 + e * 25 + s * 15 + so * 20;
  if (travelMin > 120) score -= Math.min(15, (travelMin - 120) / 12);
  score = Math.round(Math.max(0, Math.min(100, score)));
  if (score >= 75) return { score, level: 'go', title: 'Green light. Train as planned', text: 'You\'re recovered. Go for your planned session, and try a small PR if the warm-up sets fly.' };
  if (score >= 55) return { score, level: 'steady', title: 'Train, but keep it controlled', text: 'Do your session at RPE 7, leaving 2–3 reps in the tank. Skip extra cardio today.' };
  if (score >= 35) return { score, level: 'light', title: 'Go light today', text: 'A 30–40 minute zone-2 walk plus 10 minutes of mobility. It feels easy and builds the habit without draining you further.' };
  return { score, level: 'rest', title: 'Rest day, no guilt', text: 'Recovery is training too. Get to bed early, keep your protein floor, maybe 15 minutes of easy walking.' };
}
// Real-time deficit = (BMR + workout + steps*0.045) - eaten.
export function dayBalance(day, p) {
  const intake = dayIntake(day);
  const burn = dayBurn(day, p);
  return { intake, burn, deficit: burn.total - intake.kcal, target: targetKcal(p), goalDeficit: -goalOf(p).offset };
}

// ---------- weight trend ----------
export function weightSeries() {
  const w = rows('weigh_ins').slice().sort((a, b) => a.day.localeCompare(b.day));
  return w.map((r) => {
    const from = addDays(r.day, -6);
    const win = w.filter((x) => x.day >= from && x.day <= r.day);
    return { day: r.day, kg: r.kg, ma: win.reduce((s, x) => s + x.kg, 0) / win.length };
  });
}

// Stall = the 7-day average has not set a new low (cut) / new high (bulk) for 10+ days.
export function stallCheck(p) {
  const g = goalOf(p);
  const s = weightSeries();
  if (!g.dir || s.length < 4) return null;
  const span = daysBetween(s[0].day, today());
  if (span < 10) return null;
  let bestIdx = 0;
  for (let i = 1; i < s.length; i++) {
    if (g.dir < 0 ? s[i].ma < s[bestIdx].ma - 0.05 : s[i].ma > s[bestIdx].ma + 0.05) bestIdx = i;
  }
  const since = daysBetween(s[bestIdx].day, today());
  return { stalled: since >= 10, since, bestDay: s[bestIdx].day, bestMa: s[bestIdx].ma };
}

// Linear-regression slope of weigh-ins, kg per day.
export function slope(points) {
  if (points.length < 2) return 0;
  const x0 = points[0].day;
  const xs = points.map((p) => daysBetween(x0, p.day)), ys = points.map((p) => p.kg);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  return den ? num / den : 0;
}

// "Figure It Out": TDEE = average logged intake − (weight trend × 7700 kcal/kg).
export function diagnostic(p) {
  const start = p?.started_on || today();
  const elapsed = Math.min(daysBetween(start, today()), 30);
  const end = addDays(today(), -1);
  const days = [];
  for (let i = 0; i < 14; i++) { const d = addDays(end, -i); if (d < start) break; days.push(d); }
  const logged = days.map((d) => ({ d, ...dayIntake(d) })).filter((x) => x.items > 0);
  const weighs = rows('weigh_ins').filter((w) => w.day >= start).sort((a, b) => a.day.localeCompare(b.day));
  const ready = elapsed >= 7 && logged.length >= 5 && weighs.length >= 3;
  const avgIntake = logged.length ? Math.round(logged.reduce((s, x) => s + x.kcal, 0) / logged.length) : 0;
  const kgPerDay = slope(weighs);
  const tdee = ready ? Math.min(6000, Math.max(800, Math.round((avgIntake - kgPerDay * 7700) / 10) * 10)) : null;
  return { elapsed, loggedDays: logged.length, weighIns: weighs.length, avgIntake, kgPerWeek: kgPerDay * 7, tdee, ready };
}

// ---------- iron ----------
export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export function plateMath(target, bar) {
  let side = (target - bar) / 2;
  if (!(target > 0) || side < 0) return null;
  const out = [];
  for (const pl of PLATES) while (side >= pl - 1e-9) { out.push(pl); side -= pl; }
  return { perSide: out, leftover: Math.round(side * 2 * 100) / 100, loaded: target - Math.round(side * 2 * 100) / 100 };
}

export function lastPerformance(exercise, excludeWorkoutId) {
  const ws = rows('workouts').filter((w) => w.id !== excludeWorkoutId)
    .sort((a, b) => (b.started_at || b.day).localeCompare(a.started_at || a.day));
  const allSets = rows('workout_sets');
  for (const w of ws) {
    const sets = allSets.filter((s) => s.workout_id === w.id && s.exercise === exercise && s.done && s.kg != null)
      .sort((a, b) => a.idx - b.idx);
    if (sets.length) return { day: w.day, sets };
  }
  return null;
}

export const fmt = (n, d = 0) => (n == null || isNaN(n) ? '–' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: 0 }));
export const num = (v) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
export const int = (v) => { const n = num(v); return n == null ? null : Math.round(n); };
