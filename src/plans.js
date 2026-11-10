// Plan library. Each plan maps weekdays to a session: a split (startable in Iron), a cardio prescription, or rest.
// Conservative by design. Anyone with a medical condition is told to get clearance first.

export const PLANS = [
  { id: 'starter', title: 'New to fitness: 3-day starter', tags: ['new'],
    summary: 'Three short full-body sessions plus daily walks. Learn the movements, build the habit, no soreness drama.',
    week: { Mon: { split: 'Full Body A' }, Tue: { cardio: 'zone2_walk', min: 25 }, Wed: { split: 'Full Body B' }, Thu: { cardio: 'walk_easy', min: 30 }, Fri: { split: 'Full Body A' }, Sat: { cardio: 'zone2_walk', min: 40 }, Sun: { rest: true } },
    notes: ['Start with weights you could lift 12 times and stop at 8–10.', 'Add 2.5 kg or 1–2 reps only when every set feels clean.', 'Sore for more than 3 days means you did too much. Halve the sets next time.'] },
  { id: 'returning', title: 'Getting back: 4-week ramp', tags: ['returning'],
    summary: 'Upper/Lower four days a week, starting at about 60% of your old weights and climbing back over four weeks.',
    week: { Mon: { split: 'Upper' }, Tue: { split: 'Lower' }, Wed: { cardio: 'zone2_walk', min: 30 }, Thu: { split: 'Upper' }, Fri: { split: 'Lower' }, Sat: { cardio: 'cycling_easy', min: 40 }, Sun: { rest: true } },
    notes: ['Week 1: 60% of your old working weights. Week 2: 70%. Week 3: 80%. Week 4: test.', 'Your muscles remember faster than your tendons do. Ramp weights slowly even if it feels easy.'] },
  { id: 'busy_pro', title: 'Busy professional: 3 × 45 min', tags: ['working'],
    summary: 'Three tight full-body sessions that fit before or after office, with your commute counted as cardio.',
    week: { Mon: { split: 'Full Body A' }, Tue: { cardio: 'commute', min: 0 }, Wed: { split: 'Full Body B' }, Thu: { cardio: 'commute', min: 0 }, Fri: { split: 'Full Body A' }, Sat: { cardio: 'zone2_walk', min: 45 }, Sun: { rest: true } },
    notes: ['Get off one station early or take the stairs. Log it on the Dashboard, it counts.', 'Every 90 minutes at your desk, stand up and do 10 bodyweight squats and a 2-minute walk.', 'Late-night client call? Swap that day for a 20-minute home bodyweight session.'] },
  { id: 'student', title: 'Student / hostel: 4-day Upper/Lower', tags: ['student'],
    summary: 'Four sessions with budget protein from the mess and canteen. Train hard while recovery is free.',
    week: { Mon: { split: 'Upper' }, Tue: { split: 'Lower' }, Wed: { cardio: 'badminton', min: 45 }, Thu: { split: 'Upper' }, Fri: { split: 'Lower' }, Sat: { cardio: 'zone2_walk', min: 30 }, Sun: { rest: true } },
    notes: ['Budget protein: 2–3 boiled eggs, a katori of soya chunks, dahi, roasted chana or peanuts.', 'Mess food runs oily. Set the oil toggle to Mess so your numbers stay honest.', 'Exam week? Drop to 2 sessions and keep the protein. That still counts as progress.'] },
  { id: 'desi_split', title: 'Classic Indian gym 6-day split', tags: ['regular'],
    summary: 'The split every Indian gym runs: chest-triceps, back-biceps, shoulders, legs, arms. Good for regular lifters with time.',
    week: { Mon: { split: 'Chest + Triceps' }, Tue: { split: 'Back + Biceps' }, Wed: { split: 'Shoulders' }, Thu: { split: 'Legs' }, Fri: { split: 'Arms' }, Sat: { split: 'Legs' }, Sun: { rest: true } },
    notes: ['Never skip legs, and yes, Saturday is legs again.', 'Six days only works if you sleep 7+ hours. Otherwise use the Upper/Lower plan.'] },
  { id: 'home_bw', title: 'No gym: home & terrace bodyweight', tags: ['new', 'working', 'student'],
    summary: 'Dand, baithak, push-ups, chair dips and Surya Namaskar. Zero equipment, works in a 1BHK.',
    week: { Mon: { split: 'Home Bodyweight' }, Tue: { cardio: 'surya', min: 15 }, Wed: { split: 'Desi Akhada' }, Thu: { cardio: 'zone2_walk', min: 30 }, Fri: { split: 'Home Bodyweight' }, Sat: { cardio: 'skipping', min: 15 }, Sun: { rest: true } },
    notes: ['Progress by adding reps, slowing the tempo, or adding a backpack with books.', 'Do 12 rounds of Surya Namaskar at a steady pace and you\'ve got a full warm-up plus cardio.'] },
  { id: 'zone2', title: 'Low-stress fat loss: zone-2 + strength', tags: ['cut', 'new', 'returning'],
    summary: 'Easy-paced, recovery-friendly cardio most days plus 2 strength days to keep muscle. It doesn\'t beat you up the way HIIT does.',
    week: { Mon: { split: 'Full Body A' }, Tue: { cardio: 'zone2_walk', min: 40 }, Wed: { cardio: 'cycling_easy', min: 40 }, Thu: { split: 'Full Body B' }, Fri: { cardio: 'zone2_walk', min: 40 }, Sat: { cardio: 'hiking', min: 60 }, Sun: { rest: true } },
    notes: ['Zone 2 means you can talk in full sentences but wouldn\'t want to sing.', 'Easy cardio is easier to recover from than all-out intervals, so you can do it often, even on stressful workdays.'] },
  { id: 'longevity', title: 'Healthy ageing (55+): strength, balance, walks', tags: ['senior'],
    summary: 'Two or three gentle strength days to protect muscle and bone, balance work to prevent falls, and a daily walk.',
    week: { Mon: { split: 'Healthy Ageing' }, Tue: { cardio: 'walk_easy', min: 30 }, Wed: { cardio: 'yoga', min: 30 }, Thu: { split: 'Healthy Ageing' }, Fri: { cardio: 'walk_easy', min: 30 }, Sat: { cardio: 'pranayama', min: 15 }, Sun: { cardio: 'walk_easy', min: 20 } },
    notes: ['Get a doctor\'s okay before starting, especially with BP, heart, diabetes or joint issues.', 'Do balance work near a wall or chair. Falls are the real enemy, not the weights.', 'Protein matters more with age. Aim to have dal, paneer, eggs or curd at every meal.'] },
  { id: 'joint', title: 'Joint-friendly plan (knee / back / shoulder)', tags: ['injury'],
    summary: 'Pain-aware training: controlled tempo, supported variations, nothing that spikes pain above 3/10.',
    week: { Mon: { split: 'Joint-friendly' }, Tue: { cardio: 'cycling_easy', min: 25 }, Wed: { cardio: 'swim', min: 25 }, Thu: { split: 'Joint-friendly' }, Fri: { cardio: 'zone2_walk', min: 25 }, Sat: { cardio: 'yoga', min: 30 }, Sun: { rest: true } },
    notes: ['Pain rule: 0–3/10 during exercise and back to normal by the next morning is okay. More than that, stop and scale down.', 'Follow your physio\'s or doctor\'s restrictions first. This plan only works around them.', 'Knee: box squats to a chair height. Back: no heavy deadlifts, use hip hinges with a light load. Shoulder: neutral-grip presses, no behind-the-neck work.'] },
];

// Conditions: general safety notes only (never treatment advice).
export const CONDITIONS = [
  { id: 'knee', label: 'Knee pain', note: 'Use box squats and step-ups. Avoid deep loaded squats and jumping until pain-free.' },
  { id: 'back', label: 'Lower back pain', note: 'Keep loads moderate and the spine neutral. Swap deadlifts for hip thrusts and back extensions.' },
  { id: 'shoulder', label: 'Shoulder pain', note: 'Use neutral grips and a reduced range. Skip behind-the-neck presses and dips.' },
  { id: 'diabetes', label: 'Diabetes', note: 'A 10–15 minute walk after meals helps blood sugar. Keep a sugar source handy and follow your doctor\'s medication timing.' },
  { id: 'bp', label: 'High BP', note: 'Breathe out on effort, never hold your breath, and avoid max lifts. Get clearance if it isn\'t controlled.' },
  { id: 'thyroid', label: 'Thyroid', note: 'Energy can swing. Go by the daily check-in and keep a steady routine with your medication.' },
  { id: 'pcos', label: 'PCOS / PCOD', note: 'Strength training plus daily walks support insulin sensitivity. Be consistent rather than extreme.' },
  { id: 'asthma', label: 'Asthma', note: 'Warm up for longer, keep your inhaler near, and avoid outdoor cardio on high-AQI days.' },
  { id: 'heart', label: 'Heart condition', note: 'Exercise only with your cardiologist\'s clearance. Until then Scaley recommends only easy walks.' },
  { id: 'pregnancy', label: 'Pregnant / postpartum', note: 'Follow your gynaecologist\'s advice. Scaley won\'t give calorie-deficit targets in this phase.' },
];

export function personaTags(p) {
  const t = new Set();
  if (p.experience === 'new') t.add('new');
  if (p.experience === 'returning') t.add('returning');
  if (p.experience === 'regular') t.add('regular');
  if (p.occupation === 'working') t.add('working');
  if (p.occupation === 'student') t.add('student');
  if ((p.age || 0) >= 55 || p.occupation === 'retired') t.add('senior');
  const c = p.conditions || [];
  if (c.some((x) => ['knee', 'back', 'shoulder'].includes(x))) t.add('injury');
  if (['aggressive', 'moderate', 'recomp'].includes(p.goal)) t.add('cut');
  return t;
}

export function recommendPlans(p) {
  const t = personaTags(p);
  const c = p.conditions || [];
  if (c.includes('heart') || c.includes('pregnancy')) return PLANS.filter((x) => x.id === 'longevity' || x.id === 'zone2').map((x) => ({ ...x, score: 1 }));
  return PLANS.map((x) => {
    const W = { injury: 3, senior: 3 };
    let s = x.tags.filter((g) => t.has(g)).reduce((a, g) => a + (W[g] || 1), 0);
    if (t.has('injury') && x.id === 'home_bw') s -= 1;
    if (t.has('senior') && x.id === 'desi_split') s -= 3;
    if (t.has('injury') && x.id === 'desi_split') s -= 2;
    if (t.has('new') && x.id === 'desi_split') s -= 2;
    return { ...x, score: s };
  }).sort((a, b) => b.score - a.score);
}

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const todayKey = () => DAYS[new Date().getDay()];
