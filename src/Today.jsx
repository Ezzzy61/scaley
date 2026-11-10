import { useState } from 'preact/hooks';
import { get, put, remove, rows, newId, useStore } from './store.js';
import { today, readiness, dayIntake, proteinFloor, targetKcal, fmt, int, stallCheck, goalOf } from './calc.js';
import { ACTIVITIES, activityById, activityKcal, INTENSITY_MET, zone2HR } from './activities.js';
import { presetsFor, TRAVEL_PRESETS, climateTip, CITIES } from './regions.js';
import { PLANS, CONDITIONS, recommendPlans, todayKey } from './plans.js';
import { Sheet, Icon, Field, Seg } from './ui.jsx';

const SCALE = [1, 2, 3, 4, 5];
const travelTypes = new Set(ACTIVITIES.filter((a) => a.group === 'Commute' || a.group === 'Travel day').map((a) => a.id));
export const travelMinutes = (day) => rows('activities').filter((a) => a.day === day && travelTypes.has(a.type)).reduce((s, a) => s + a.minutes, 0);

export function CheckInCard({ p, askCoach }) {
  useStore();
  const day = today();
  const c = get('checkins', day);
  const [open, setOpen] = useState(false);
  const r = readiness(c, travelMinutes(day));
  return (
    <section class={'card checkin ' + (r ? 'r-' + r.level : '')}>
      {!r ? (
        <>
          <small class="eyebrow">Morning check-in</small>
          <b>How's the body today?</b>
          <p class="muted small">30 seconds: sleep, energy, stress, soreness. Scaley tells you whether to push, go light or rest.</p>
          <button class="btn primary full" onClick={() => setOpen(true)}>Check in</button>
        </>
      ) : (
        <>
          <div class="row between"><small class="eyebrow">Readiness</small><button class="link" onClick={() => setOpen(true)}>Edit</button></div>
          <div class="ready-row"><div class="ready-num num">{r.score}</div><div><b>{r.title}</b><p class="muted small">{r.text}</p></div></div>
          <button class="btn ghost full sm" onClick={() => askCoach(`Today's check-in: slept ${c.sleep_h ?? '?'}h (quality ${c.sleep_q}/5), energy ${c.energy}/5, stress ${c.stress}/5, soreness ${c.soreness}/5${c.sick ? ', feeling unwell' : ''}${travelMinutes(day) ? `, ${travelMinutes(day)} min commute/travel` : ''}. ${c.note || ''} Should I train today, and what exactly should I do?`)}>
            <Icon name="chat" size={14} /> Ask Coach what to do today
          </button>
        </>
      )}
      <CheckInSheet open={open} onClose={() => setOpen(false)} existing={c} />
    </section>
  );
}

function CheckInSheet({ open, onClose, existing }) {
  const [f, setF] = useState(null);
  if (!open) return null;
  const v = f || { sleep_h: existing?.sleep_h ?? 7, sleep_q: existing?.sleep_q ?? 3, energy: existing?.energy ?? 3, stress: existing?.stress ?? 3, soreness: existing?.soreness ?? 2, sick: existing?.sick ?? false, note: existing?.note ?? '' };
  const set = (k, x) => setF({ ...v, [k]: x });
  const pick = (k, lo, hi) => (
    <div class="scale5">{SCALE.map((n) => <button type="button" class={v[k] === n ? 'on' : ''} onClick={() => set(k, n)}>{n}</button>)}
      <small class="muted">{lo} → {hi}</small></div>
  );
  function save() {
    const day = today();
    const r = readiness(v, travelMinutes(day));
    put('checkins', { id: day, day, ...v, sleep_h: Math.max(0, Math.min(16, Number(v.sleep_h) || 0)), note: (v.note || '').slice(0, 1000), score: r.score });
    setF(null); onClose();
  }
  return (
    <Sheet open={open} onClose={() => { setF(null); onClose(); }} title="Morning check-in">
      <div class="stack">
        <Field label={`Sleep: ${v.sleep_h} hours`}><input type="range" min="0" max="12" step="0.5" value={v.sleep_h} onInput={(e) => set('sleep_h', Number(e.currentTarget.value))} /></Field>
        <Field label="Sleep quality">{pick('sleep_q', 'broken', 'deep')}</Field>
        <Field label="Energy">{pick('energy', 'drained', 'charged')}</Field>
        <Field label="Stress (work / college / home)">{pick('stress', 'calm', 'maxed out')}</Field>
        <Field label="Muscle soreness">{pick('soreness', 'none', 'very sore')}</Field>
        <label class="row"><input type="checkbox" checked={v.sick} onChange={(e) => set('sick', e.currentTarget.checked)} style={{ width: '22px', minHeight: '22px' }} /> Feeling unwell / fever / injured today</label>
        <Field label="Anything else? (optional)"><input value={v.note} maxLength={300} placeholder="e.g. late office call, skipped lunch, long travel tomorrow" onInput={(e) => set('note', e.currentTarget.value)} /></Field>
        <button class="btn primary full" onClick={save}>Save check-in</button>
      </div>
    </Sheet>
  );
}

export function ActivityCard({ p }) {
  useStore();
  const day = today();
  const acts = rows('activities').filter((a) => a.day === day).sort((a, b) => (a.updated_at < b.updated_at ? -1 : 1));
  const [sheet, setSheet] = useState(false);
  const presets = presetsFor(p.city);
  const quick = (id, minutes) => {
    const a = activityById(id);
    put('activities', { id: newId(), day, type: id, label: a.label, minutes, met: a.met, kcal: activityKcal(a.met, minutes, p.weight_kg) });
  };
  const total = acts.reduce((s, a) => s + a.kcal, 0);
  return (
    <section class="card">
      <div class="row between"><small class="eyebrow">Commute & activity · {p.city || 'your city'}</small><span class="muted small num">+{fmt(total)} kcal</span></div>
      <div class="chips">
        {presets.map(([id, min]) => <button class="chip" onClick={() => quick(id, min)}>+ {activityById(id).label} · {min}m</button>)}
      </div>
      {acts.map((a) => (
        <div class="item">
          <div class="item-name"><b>{a.label}</b><small class="muted">{a.minutes} min · +{a.kcal} kcal</small></div>
          <button class="icon-btn sm" aria-label={`Remove ${a.label}`} onClick={() => remove('activities', a.id)}><Icon name="trash" size={15} /></button>
        </div>
      ))}
      <button class="btn ghost full sm" onClick={() => setSheet(true)}><Icon name="plus" size={14} /> Walk, cardio, yoga, sport, travel day…</button>
      <small class="fine left">Tap a chip to add it with the usual time. If your phone already counts steps, don't log the same walks twice.</small>
      <ActivitySheet open={sheet} onClose={() => setSheet(false)} p={p} />
    </section>
  );
}

function ActivitySheet({ open, onClose, p }) {
  const [type, setType] = useState('zone2_walk');
  const [min, setMin] = useState('30');
  const [label, setLabel] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  if (!open) return null;
  const a = activityById(type);
  const met = type === 'custom' ? INTENSITY_MET[intensity] : a.met;
  const minutes = Math.max(1, Math.min(1440, int(min) || 0));
  const groups = [...new Set(ACTIVITIES.map((x) => x.group))];
  function save() {
    put('activities', { id: newId(), day: today(), type, label: (type === 'custom' ? label || 'Activity' : a.label).slice(0, 80), minutes, met, kcal: activityKcal(met, minutes, p.weight_kg) });
    onClose();
  }
  return (
    <Sheet open={open} onClose={onClose} title="Log activity">
      <div class="stack">
        <Field label="What did you do?">
          <select value={type} onChange={(e) => setType(e.currentTarget.value)}>
            {groups.map((g) => <optgroup label={g}>{ACTIVITIES.filter((x) => x.group === g).map((x) => <option value={x.id}>{x.label}</option>)}</optgroup>)}
          </select>
        </Field>
        {type === 'custom' && <>
          <Field label="Name"><input value={label} maxLength={80} onInput={(e) => setLabel(e.currentTarget.value)} placeholder="e.g. Kho-kho with kids" /></Field>
          <Field label="Effort"><Seg small value={intensity} onChange={setIntensity} options={[{ value: 'easy', label: 'Easy' }, { value: 'moderate', label: 'Moderate' }, { value: 'hard', label: 'Hard' }]} /></Field>
        </>}
        {[...TRAVEL_PRESETS.map(([id]) => id)].includes(type) && <p class="msg">Travel days are long but mostly seated. Coach can plan a hotel-room or station-platform mini workout. Ask on the Coach tab.</p>}
        {a.easy && <p class="msg">Zone 2 for you is about {zone2HR(p.age)}. Breathing a little harder, but you can still talk in full sentences.</p>}
        <Field label="Minutes"><input inputMode="numeric" value={min} onInput={(e) => setMin(e.currentTarget.value)} /></Field>
        <p class="muted">≈ <b class="num">{activityKcal(met, minutes, p.weight_kg)}</b> kcal on top of your BMR</p>
        <button class="btn primary full" onClick={save}>Add</button>
      </div>
    </Sheet>
  );
}

// Personalised tips from the user's own data, city, season and profile, with no AI call needed.
export function ForYou({ p, go, askCoach }) {
  useStore();
  const day = today();
  const tips = [];
  const it = dayIntake(day), pf = proteinFloor(p), hour = new Date().getHours();
  const plan = PLANS.find((x) => x.id === p.plan_id) || recommendPlans(p)[0];
  const session = plan.week[todayKey()];
  const c = get('checkins', day), r = readiness(c, travelMinutes(day));

  if (session) {
    const what = session.rest ? 'Rest day in your plan. Easy walk, stretch, sleep well.'
      : session.split ? `Today: ${session.split} (${plan.title}).`
      : session.cardio === 'commute' ? 'Today your commute is the cardio. Take the stairs and get off one stop early.'
      : `Today: ${activityById(session.cardio).label}, ${session.min} min.`;
    tips.push({ icon: 'iron', title: 'Your plan', text: r && r.level === 'rest' && !session.rest ? `${what} But your check-in says rest, so listen to your body today.` : what, cta: session.split ? ['Open Iron', () => go('iron')] : null });
  }
  if (hour >= 15 && it.items && it.protein < pf * 0.6) {
    const gap = pf - it.protein;
    const veg = ['veg', 'jain', 'vegan'].includes(p.diet);
    tips.push({ icon: 'fuel', title: `${gap} g protein to go`, text: veg ? 'Quick fixes: a katori of soya chunks (26 g), 100 g paneer (18 g), a big katori of dahi plus roasted chana.' : 'Quick fixes: 3 boiled eggs (19 g), a palm-size chicken piece (23 g), or a katori of dahi plus a scoop of whey.' });
  }
  const tip = climateTip(p.city);
  if (tip) tips.push({ icon: 'spark', title: `${p.city} this month`, text: tip });
  if (CITIES[p.city] && !rows('activities').some((a) => a.day === day) && hour >= 10) tips.push({ icon: 'home', title: 'Log your commute', text: `Standing in the ${p.city === 'Mumbai' ? 'local' : 'metro'} and walking to the station all burns calories. Tap a chip in Commute & activity.` });
  for (const cid of p.conditions || []) {
    const cond = CONDITIONS.find((x) => x.id === cid);
    if (cond && ['diabetes', 'bp', 'pcos', 'asthma'].includes(cid)) { tips.push({ icon: 'alert', title: cond.label, text: cond.note }); break; }
  }
  const stall = stallCheck(p);
  if (stall?.stalled) tips.push({ icon: 'chart', title: 'Plateau check', text: `No new ${goalOf(p).dir < 0 ? 'low' : 'high'} in ${stall.since} days. Ask Coach for a fix built on your logs.`, cta: ['Ask Coach', () => askCoach('My weight has stalled. Look at my logs and tell me exactly what to change this week.')] });
  const m = new Date().getMonth() + 1;
  if (m === 10 || m === 11) tips.push({ icon: 'fuel', title: 'Festive & wedding season', text: 'Mithai and shaadi buffets add up fast. Plan for it: protein first at the buffet, one sweet, and log it honestly.' });

  if (!tips.length) return null;
  return (
    <section class="foryou">
      <h2 class="h2">For you{p.city ? ` · ${p.city}` : ''}</h2>
      {tips.slice(0, 4).map((t) => (
        <div class="card tip">
          <div class="row"><Icon name={t.icon} size={18} /><b>{t.title}</b></div>
          <p class="muted small">{t.text}</p>
          {t.cta && <button class="link left" onClick={t.cta[1]}>{t.cta[0]} →</button>}
        </div>
      ))}
    </section>
  );
}
