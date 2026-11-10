// Evidence-based "results engine" for everyday gym-goers.
// Each rule is simple on purpose: the goal is the minimum effective dose that people actually repeat.
import { rows, get } from './store.js';
import { today, addDays, dayIntake, proteinFloor, goalOf } from './calc.js';
import { e1rm } from './fx.js';

// ---------- research cards (paraphrased findings + source links) ----------
export const EVIDENCE = [
  { id: 'protein', icon: '🥚', title: 'Protein does the heavy lifting',
    text: 'A meta-analysis of 49 trials found muscle gains from training plateau at roughly 1.6 g of protein per kg of bodyweight per day. Your floor sits at or a bit above this, which also helps keep muscle while cutting.',
    src: 'Morton et al., Br J Sports Med 2018', url: 'https://doi.org/10.1136/bjsports-2017-097608' },
  { id: 'volume', icon: '📈', title: 'Hard sets per muscle add up',
    text: 'More weekly sets means more growth, in a dose-response way. About 10 hard sets per muscle per week is a strong target, but even 4–6 sets work well when you are starting out.',
    src: 'Schoenfeld, Ogborn & Krieger, J Sports Sci 2017', url: 'https://doi.org/10.1080/02640414.2016.1210197' },
  { id: 'failure', icon: '🎯', title: 'Close to failure, not always to failure',
    text: 'Sets that stop 0–3 reps short of failure build muscle about as well as grinding every set to failure, with less fatigue. Scaley’s “leave 1–2 in the tank” cue comes from this.',
    src: 'Refalo et al., Sports Med 2023', url: 'https://doi.org/10.1007/s40279-022-01784-y' },
  { id: 'frequency', icon: '📅', title: 'Train on the days you can actually show up',
    text: 'When weekly sets are equal, training a muscle once or several times a week gives similar growth. Pick a split that fits your job, college and commute.',
    src: 'Schoenfeld, Grgic & Krieger, J Sports Sci 2019', url: 'https://doi.org/10.1080/02640414.2018.1555906' },
  { id: 'steps', icon: '🚶', title: 'Steps are a longevity tool',
    text: 'Across 15 cohorts, more daily steps meant lower death risk, levelling off around 6,000–8,000 steps for people over 60 and 8,000–10,000 for younger adults.',
    src: 'Paluch et al., Lancet Public Health 2022', url: 'https://doi.org/10.1016/S2468-2667(21)00302-9' },
  { id: 'sleep', icon: '😴', title: 'Sleep decides what you lose',
    text: 'On the same diet, people sleeping 5.5 h instead of 8.5 h lost far less fat and more lean mass. Protect sleep before cutting more calories.',
    src: 'Nedeltcheva et al., Ann Intern Med 2010', url: 'https://doi.org/10.7326/0003-4819-153-7-201010050-00006' },
  { id: 'rate', icon: '⚖️', title: 'Lose slowly to keep muscle',
    text: 'For lifters, losing about 0.5–1% of bodyweight per week is the sweet spot for keeping muscle. Faster usually costs strength.',
    src: 'Helms, Aragon & Fitschen, JISSN 2014', url: 'https://doi.org/10.1186/1550-2783-11-20' },
  { id: 'walk', icon: '🍛', title: 'Walk after meals',
    text: 'Short walks after eating blunt blood-sugar spikes better than sitting or standing. Very useful after rice- or roti-heavy Indian meals: even 2–5 minutes counts.',
    src: 'Buffey et al., Sports Med 2022', url: 'https://doi.org/10.1007/s40279-022-01649-4' },
  { id: 'snacks', icon: '🪜', title: 'Stair “exercise snacks” build fitness',
    text: 'Three short bursts of brisk stair climbing a day, three days a week, improved fitness in sedentary adults within 6 weeks. Station and office stairs count.',
    src: 'Jenkins et al., Appl Physiol Nutr Metab 2019', url: 'https://doi.org/10.1139/apnm-2018-0675' },
  { id: 'asian', icon: '🇮🇳', title: 'South Asian bodies, lower BMI cut-offs',
    text: 'Asian populations face higher diabetes and heart risk at lower BMIs, so WHO suggests action points of 23 (overweight) and 27.5 (high risk) instead of 25 and 30. Waist size matters too.',
    src: 'WHO Expert Consultation, Lancet 2004', url: 'https://doi.org/10.1016/S0140-6736(03)15268-3' },
  { id: 'icmr', icon: '🥗', title: 'ICMR-NIN: oil, sugar and packets are the problem',
    text: 'India’s 2024 dietary guidelines tie a large share of the disease burden to unhealthy diets and advise less oil, sugar and ultra-processed food, with more dals, vegetables and dairy. That’s why Scaley tracks hidden oil.',
    src: 'ICMR-NIN Dietary Guidelines for Indians 2024', url: 'https://www.nin.res.in/' },
];
export const evidenceOfDay = () => EVIDENCE[Math.floor(Date.now() / 864e5) % EVIDENCE.length];

// ---------- double progression ----------
const ISOLATION = /curl|raise|fly|flye|extension|pushdown|kickback|calf|shrug|crunch|plank|face pull|pec deck/i;
const DUMBBELL = /dumbbell|db\b|kettlebell|goblet|cable|machine/i;
export function repRange(p, exercise) {
  if (goalOf(p).label === 'Pure Strength' && !ISOLATION.test(exercise)) return [3, 6];
  return ISOLATION.test(exercise) ? [10, 15] : [6, 10];
}
// From last session's working sets, suggest the next target: add reps until the top of the range, then add weight.
export function suggestNext(p, exercise, last) {
  if (!last?.sets?.length) return null;
  const [lo, hi] = repRange(p, exercise);
  const work = last.sets.filter((s) => s.kg != null && s.reps != null);
  if (!work.length) return null;
  const top = Math.max(...work.map((s) => s.kg));
  const topSets = work.filter((s) => s.kg === top);
  const minReps = Math.min(...topSets.map((s) => s.reps));
  if (top === 0) return { kg: 0, reps: Math.min(minReps + 1, 30), why: 'Bodyweight: add a rep each time, then make it harder.' };
  if (minReps >= hi) {
    const jump = ISOLATION.test(exercise) || DUMBBELL.test(exercise) ? (top < 20 ? 1 : 2) : top < 100 ? 2.5 : 5;
    return { kg: Math.round((top + jump) * 4) / 4, reps: lo, why: `You hit ${hi} reps on every top set. Add weight and restart at ${lo}.` };
  }
  if (minReps < lo - 1) return { kg: top, reps: lo, why: `Stay at ${top} kg and build back to ${lo} reps.` };
  return { kg: top, reps: minReps + 1, why: `Same weight, one more rep. Add weight once you reach ${hi}.` };
}

// ---------- muscles & weekly dose ----------
export const MUSCLES = [
  { key: 'chest', label: 'Chest', re: /bench|chest|push-?up|fly|flye|dip|pec/i },
  { key: 'back', label: 'Back', re: /row|pull-?up|chin-?up|pulldown|lat\b|deadlift|rack pull|face pull|shrug/i },
  { key: 'legs', label: 'Legs', re: /squat|lunge|leg press|leg ext|leg curl|step-?up|calf|rdl|romanian|hip thrust|glute|baithak|split squat/i },
  { key: 'shoulders', label: 'Shoulders', re: /overhead|military|shoulder|lateral|arnold|ohp|face pull|pike|upright row|dand/i },
  { key: 'arms', label: 'Arms', re: /curl|tricep|pushdown|skull|extension|kickback|close-?grip|dip/i },
  { key: 'core', label: 'Core', re: /plank|crunch|ab\b|abs|core|leg raise|hollow|russian|surya|sit-?up|carry/i },
];
export const musclesOf = (name) => MUSCLES.filter((m) => m.re.test(name)).map((m) => m.key);

export function weekStats(p) {
  const t = today(), from = addDays(t, -6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  const sets = rows('workout_sets').filter((s) => s.done && s.day >= from && s.day <= t);
  const perMuscle = Object.fromEntries(MUSCLES.map((m) => [m.key, 0]));
  for (const s of sets) for (const m of musclesOf(s.exercise)) perMuscle[m] += 1;
  const sessions = new Set(sets.map((s) => s.day)).size;
  const pf = proteinFloor(p);
  const proteinDays = days.filter((d) => pf && dayIntake(d).protein >= pf * 0.95).length;
  const stepVals = days.map((d) => get('day_logs', d)?.steps).filter((x) => x != null);
  const avgSteps = stepVals.length ? Math.round(stepVals.reduce((a, b) => a + b, 0) / stepVals.length) : null;
  const sleepVals = days.map((d) => get('checkins', d)?.sleep_h).filter((x) => x);
  const avgSleep = sleepVals.length ? Math.round((sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length) * 10) / 10 : null;
  const stepGoal = (p?.age || 30) >= 60 ? 7000 : 8000;
  const setTarget = p?.experience === 'new' ? 6 : 10;
  const score = Math.round(
    Math.min(1, sessions / 3) * 30 +
    Math.min(1, proteinDays / 5) * 25 +
    (avgSteps == null ? 0 : Math.min(1, avgSteps / stepGoal)) * 25 +
    (avgSleep == null ? 0 : Math.min(1, avgSleep / 7)) * 20);
  return { sessions, perMuscle, proteinDays, avgSteps, avgSleep, stepGoal, setTarget, score };
}

// Consecutive days (ending today or yesterday) with any log.
export function streak() {
  const logged = new Set([
    ...rows('food_entries').map((r) => r.day), ...rows('workout_sets').filter((s) => s.done).map((r) => r.day),
    ...rows('weigh_ins').map((r) => r.day), ...rows('checkins').map((r) => r.day), ...rows('activities').map((r) => r.day),
  ]);
  let d = today(); if (!logged.has(d)) d = addDays(d, -1);
  let n = 0; while (logged.has(d) && n < 3650) { n++; d = addDays(d, -1); }
  return n;
}

// Best estimated 1RM ever for an exercise, excluding one set (for PR checks).
export function bestE1rm(exercise, excludeId) {
  let best = 0;
  for (const s of rows('workout_sets')) if (s.done && s.exercise === exercise && s.id !== excludeId) best = Math.max(best, e1rm(s.kg, s.reps));
  return best;
}

// BMI with WHO Asian action points.
export function asianBmi(p) {
  if (!p?.weight_kg || !p?.height_cm) return null;
  const bmi = p.weight_kg / (p.height_cm / 100) ** 2;
  const band = bmi < 18.5 ? 'Underweight' : bmi < 23 ? 'Healthy (Asian cut-off)' : bmi < 27.5 ? 'Overweight (Asian cut-off)' : 'High risk (Asian cut-off)';
  return { bmi: Math.round(bmi * 10) / 10, band };
}
