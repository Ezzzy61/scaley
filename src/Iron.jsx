import { useState } from 'preact/hooks';
import { SPLITS, POPULAR_SPLITS, EXERCISE_LIBRARY, isBarbell } from './data.js';
import { recommendPlans, todayKey, DAYS } from './plans.js';
import { activityById } from './activities.js';
import { get, put, remove, rows, newId, useStore } from './store.js';
import { today, prettyDay, lastPerformance, plateMath, fmt, num, int } from './calc.js';
import { Icon, Sheet, Field, Seg } from './ui.jsx';

function startWorkout(split, names) {
  const id = newId();
  const day = today();
  const exercises = (names || SPLITS[split] || []).map((name) => ({ name, bb: isBarbell(name) }));
  put('workouts', { id, day, split: split.slice(0, 40), started_at: new Date().toISOString(), finished: false, exercises });
  for (const ex of exercises) seedSets(id, day, ex.name);
  return id;
}
function seedSets(workoutId, day, name) {
  const last = lastPerformance(name, workoutId);
  const n = Math.max(3, last?.sets.length || 0);
  for (let i = 0; i < n; i++) put('workout_sets', { id: newId(), workout_id: workoutId, day, exercise: name, idx: i, kg: null, reps: null, done: false });
}

export function Iron({ p, onSetDone, askCoach }) {
  useStore();
  const [openId, setOpenId] = useState(null);
  const active = rows('workouts').filter((w) => !w.finished).sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''))[0];
  const w = (openId && get('workouts', openId)) || active;

  if (w) return <Workout w={w} p={p} onSetDone={onSetDone} onClose={() => setOpenId(null)} />;

  const [view, setView] = useState('start');
  const history = rows('workouts').filter((x) => x.finished).sort((a, b) => (b.started_at || b.day).localeCompare(a.started_at || a.day)).slice(0, 12);
  const sets = rows('workout_sets');
  const plans = recommendPlans(p);
  const plan = plans.find((x) => x.id === p.plan_id) || null;
  const todays = plan?.week[todayKey()];
  const templates = rows('workout_templates').sort((a, b) => a.name.localeCompare(b.name));
  const classic = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms', 'Full Body'];
  return (
    <div class="page">
      <header class="top"><div><h1 class="h1">Iron</h1><small class="muted">{plan ? plan.title : 'Pick a session or follow a plan'}</small></div></header>
      <Seg value={view} onChange={setView} options={[{ value: 'start', label: 'Train' }, { value: 'plans', label: 'Plans' }, { value: 'mine', label: 'My workouts' }]} />

      {view === 'start' && <>
        {todays && (
          <section class="card today-plan">
            <small class="eyebrow">Today in your plan · {todayKey()}</small>
            {todays.split ? <>
              <b>{todays.split}</b><small class="muted">{SPLITS[todays.split]?.slice(0, 4).join(' · ')}</small>
              <button class="btn primary full" onClick={() => setOpenId(startWorkout(todays.split))}>Start {todays.split}</button>
            </> : todays.rest ? <b>Rest day. Recovery is where you grow.</b>
              : todays.cardio === 'commute' ? <b>Commute cardio: take the stairs and walk one stop. Log it on the Dashboard.</b>
              : <b>{activityById(todays.cardio).label} · {todays.min} min. Log it on the Dashboard.</b>}
          </section>
        )}
        <h2 class="h2">Classic splits</h2>
        <div class="splits">
          {classic.map((s) => <button class="split" onClick={() => setOpenId(startWorkout(s))}><b>{s}</b><small>{SPLITS[s].slice(0, 3).join(' · ')}</small></button>)}
        </div>
        <h2 class="h2">Indian gym & home favourites</h2>
        <div class="splits">
          {POPULAR_SPLITS.map((s) => <button class="split" onClick={() => setOpenId(startWorkout(s))}><b>{s}</b><small>{SPLITS[s].slice(0, 3).join(' · ')}</small></button>)}
        </div>
        <h2 class="h2">History</h2>
        {!history.length && <p class="muted">No sessions yet. Your first one shows up here.</p>}
        {history.map((h) => {
          const done = sets.filter((s) => s.workout_id === h.id && s.done);
          const vol = done.reduce((a, s) => a + (s.kg || 0) * (s.reps || 0), 0);
          return (
            <button class="card row-btn" onClick={() => setOpenId(h.id)}>
              <div><b>{h.split}</b><small class="muted">{prettyDay(h.day)}</small></div>
              <span class="muted num">{done.length} sets{vol ? ` · ${fmt(vol)} kg vol` : ''}</span>
            </button>
          );
        })}
      </>}

      {view === 'plans' && <PlansView p={p} plans={plans} askCoach={askCoach} />}
      {view === 'mine' && <MyWorkouts templates={templates} start={(t) => setOpenId(startWorkout(t.name, t.exercises))} />}
    </div>
  );
}

function PlansView({ p, plans, askCoach }) {
  const [open, setOpen] = useState(p.plan_id || plans[0]?.id);
  return (
    <div class="stack">
      <p class="muted">Ranked for you: {[p.experience === 'new' ? 'new to training' : p.experience === 'returning' ? 'getting back' : 'regular lifter', p.occupation, p.age >= 55 ? '55+' : null, (p.conditions || []).length ? 'health notes considered' : null].filter(Boolean).join(' · ')}</p>
      {plans.map((pl, i) => (
        <section class={'card plan' + (p.plan_id === pl.id ? ' em' : '')}>
          <button class="plan-head" onClick={() => setOpen(open === pl.id ? null : pl.id)}>
            <div><b>{pl.title}</b>{i === 0 && pl.score > 0 && <span class="tag em">Best fit</span>}{p.plan_id === pl.id && <span class="tag em">Following</span>}<small class="muted">{pl.summary}</small></div>
            <Icon name={open === pl.id ? 'minus' : 'plus'} size={18} />
          </button>
          {open === pl.id && <>
            <div class="week-grid">
              {DAYS.slice(1).concat('Sun').map((d) => {
                const x = pl.week[d];
                return <div class="wk"><small>{d}</small><span>{!x || x.rest ? 'Rest' : x.split ? x.split : x.cardio === 'commute' ? 'Commute cardio' : `${activityById(x.cardio).label.split(' (')[0]} ${x.min}m`}</span></div>;
              })}
            </div>
            <ul class="tips">{pl.notes.map((n) => <li>{n}</li>)}</ul>
            <div class="row">
              {p.plan_id === pl.id
                ? <button class="btn ghost" onClick={() => put('profiles', { id: 'me', plan_id: null })}>Stop following</button>
                : <button class="btn primary" onClick={() => put('profiles', { id: 'me', plan_id: pl.id })}>Follow this plan</button>}
              <button class="btn ghost" onClick={() => askCoach(`Adapt the "${pl.title}" plan to my actual week. Use my job/college hours, commute, city and any health notes, and tell me exactly which days and times to train.`)}><Icon name="chat" size={14} /> Personalise</button>
            </div>
          </>}
        </section>
      ))}
    </div>
  );
}

function MyWorkouts({ templates, start }) {
  const [name, setName] = useState('');
  const [list, setList] = useState([]);
  const [ex, setEx] = useState('');
  function add(e) { e.preventDefault(); const n = ex.trim().slice(0, 60); if (n && !list.includes(n)) setList([...list, n]); setEx(''); }
  function save() { if (!name.trim() || !list.length) return; put('workout_templates', { id: newId(), name: name.trim().slice(0, 40), exercises: list }); setName(''); setList([]); }
  return (
    <div class="stack">
      {templates.map((t) => (
        <section class="card">
          <div class="row between"><b>{t.name}</b><button class="icon-btn sm" aria-label={`Delete ${t.name}`} onClick={() => remove('workout_templates', t.id)}><Icon name="trash" size={15} /></button></div>
          <small class="muted">{t.exercises.join(' · ')}</small>
          <button class="btn primary full sm" onClick={() => start(t)}>Start</button>
        </section>
      ))}
      <section class="card stack">
        <small class="eyebrow">Create your own workout</small>
        <Field label="Name"><input value={name} maxLength={40} placeholder="e.g. Terrace HIIT, Sunday legs" onInput={(e) => setName(e.currentTarget.value)} /></Field>
        <form class="row" onSubmit={add}>
          <input list="ex-lib2" placeholder="Add exercise…" value={ex} maxLength={60} onInput={(e) => setEx(e.currentTarget.value)} />
          <datalist id="ex-lib2">{EXERCISE_LIBRARY.map((n) => <option value={n} />)}</datalist>
          <button class="btn ghost">Add</button>
        </form>
        {list.length > 0 && <div class="chips">{list.map((n) => <button class="chip on" onClick={() => setList(list.filter((x) => x !== n))}>{n} ✕</button>)}</div>}
        <button class="btn primary full" disabled={!name.trim() || !list.length} onClick={save}>Save workout</button>
        <small class="fine left">Tip: you can also save any live session as a workout from its screen.</small>
      </section>
    </div>
  );
}

function Workout({ w, p, onSetDone, onClose }) {
  useStore();
  const [plate, setPlate] = useState(null);
  const [addName, setAddName] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const sets = rows('workout_sets').filter((s) => s.workout_id === w.id);
  const doneCount = sets.filter((s) => s.done).length;

  function addExercise(e) {
    e.preventDefault();
    const name = addName.trim().slice(0, 60);
    if (!name || w.exercises.some((x) => x.name === name)) return;
    put('workouts', { id: w.id, exercises: [...w.exercises, { name, bb: isBarbell(name) }] });
    seedSets(w.id, w.day, name);
    setAddName('');
  }
  function removeExercise(name) {
    put('workouts', { id: w.id, exercises: w.exercises.filter((x) => x.name !== name) });
    sets.filter((s) => s.exercise === name).forEach((s) => remove('workout_sets', s.id));
  }

  return (
    <div class="page">
      <header class="top">
        <div><h1 class="h1">{w.split}</h1><small class="muted">{prettyDay(w.day)} · {doneCount} sets done</small></div>
        {w.finished
          ? <button class="btn ghost" onClick={onClose}>Back</button>
          : <button class="btn primary" onClick={() => { put('workouts', { id: w.id, finished: true }); onClose(); }}>Finish</button>}
      </header>

      {w.exercises.map((ex) => {
        const exSets = sets.filter((s) => s.exercise === ex.name).sort((a, b) => a.idx - b.idx);
        const last = lastPerformance(ex.name, w.id);
        return (
          <section class="card ex">
            <div class="ex-head">
              <h3>{ex.name}</h3>
              <div class="row">
                {ex.bb && <button class="chip" onClick={() => setPlate({ target: exSets.find((s) => !s.done)?.kg ?? last?.sets[0]?.kg ?? 60 })}><Icon name="plate" size={14} /> Plates</button>}
                {!w.finished && <button class="icon-btn sm" aria-label={`Remove ${ex.name}`} onClick={() => removeExercise(ex.name)}><Icon name="trash" size={16} /></button>}
              </div>
            </div>
            <div class="set-grid set-head"><span>Set</span><span>Previous</span><span>kg</span><span>Reps</span><span /></div>
            {exSets.map((s, i) => <SetRow key={s.id} s={s} n={i + 1} prev={last?.sets[i] || last?.sets[last.sets.length - 1]}
              onDone={() => onSetDone()} openPlates={(kg) => ex.bb && setPlate({ target: kg })} />)}
            {!w.finished && (
              <button class="btn ghost full sm" onClick={() => {
                const lastSet = exSets[exSets.length - 1];
                put('workout_sets', { id: newId(), workout_id: w.id, day: w.day, exercise: ex.name, idx: (lastSet?.idx ?? -1) + 1, kg: lastSet?.kg ?? null, reps: lastSet?.reps ?? null, done: false });
              }}><Icon name="plus" size={14} /> Add set</button>
            )}
          </section>
        );
      })}

      {!w.finished && (
        <form class="card row add-ex" onSubmit={addExercise}>
          <input list="ex-lib" placeholder="Add exercise…" value={addName} maxLength={60} onInput={(e) => setAddName(e.currentTarget.value)} />
          <datalist id="ex-lib">{EXERCISE_LIBRARY.map((n) => <option value={n} />)}</datalist>
          <button class="btn primary">Add</button>
        </form>
      )}

      {w.exercises.length > 0 && <button class="btn ghost full sm" onClick={() => { put('workout_templates', { id: newId(), name: w.split.slice(0, 40), exercises: w.exercises.map((x) => x.name) }); }}>Save as my workout</button>}

      {confirmDel
        ? <div class="row"><button class="btn danger" onClick={() => { sets.forEach((s) => remove('workout_sets', s.id)); remove('workouts', w.id); onClose(); }}>Delete session for good</button><button class="btn ghost" onClick={() => setConfirmDel(false)}>Keep</button></div>
        : <button class="link danger-t" onClick={() => setConfirmDel(true)}>Delete this session</button>}

      <PlateSheet plate={plate} onClose={() => setPlate(null)} />
    </div>
  );
}

function SetRow({ s, n, prev, onDone, openPlates }) {
  const [kg, setKg] = useState(s.kg ?? '');
  const [reps, setReps] = useState(s.reps ?? '');
  const commit = (k, r) => put('workout_sets', { id: s.id, kg: num(k), reps: int(r) });
  function toggle() {
    if (s.done) return put('workout_sets', { id: s.id, done: false });
    const k = num(kg) ?? prev?.kg ?? null;
    const r = int(reps) ?? prev?.reps ?? null;
    setKg(k ?? ''); setReps(r ?? '');
    put('workout_sets', { id: s.id, kg: k, reps: r, done: true });
    onDone();
  }
  return (
    <div class={'set-grid' + (s.done ? ' done' : '')}>
      <span class="set-n">{n}</span>
      <span class="prev muted">{prev ? `Last: ${fmt(prev.kg, 2)}kg × ${prev.reps ?? '–'}` : '—'}</span>
      <input inputMode="decimal" aria-label={`Set ${n} kg`} placeholder={prev?.kg ?? 'kg'} value={kg}
        onInput={(e) => { setKg(e.currentTarget.value); commit(e.currentTarget.value, reps); }}
        onDblClick={() => openPlates(num(kg) ?? prev?.kg)} />
      <input inputMode="numeric" aria-label={`Set ${n} reps`} placeholder={prev?.reps ?? 'reps'} value={reps}
        onInput={(e) => { setReps(e.currentTarget.value); commit(kg, e.currentTarget.value); }} />
      <button class={'check' + (s.done ? ' on' : '')} aria-pressed={s.done} aria-label={`Complete set ${n}`} onClick={toggle}><Icon name="check" size={18} stroke={3} /></button>
    </div>
  );
}

const PLATE_COLORS = { 25: '#ef4444', 20: '#3b82f6', 15: '#eab308', 10: '#22c55e', 5: '#e4e4e7', 2.5: '#a1a1aa', 1.25: '#71717a' };

function PlateSheet({ plate, onClose }) {
  const [t, setT] = useState('');
  const open = !!plate;
  const target = num(t) ?? plate?.target ?? 0;
  return (
    <Sheet open={open} onClose={() => { setT(''); onClose(); }} title="Plate math">
      <Field label="Target weight on bar (kg)">
        <input inputMode="decimal" value={t === '' ? (plate?.target ?? '') : t} onInput={(e) => setT(e.currentTarget.value)} autoFocus />
      </Field>
      {[20, 15].map((bar) => {
        const r = plateMath(target, bar);
        return (
          <div class="card plate-card">
            <div class="row between"><b>{bar} kg bar</b><span class="muted">{r ? 'per side' : ''}</span></div>
            {!r ? <p class="muted">Target is lighter than the bar.</p> : (
              <>
                <div class="bar-viz">
                  <div class="sleeve" />
                  {r.perSide.length === 0 && <span class="muted">Empty bar</span>}
                  {r.perSide.map((pl) => <span class="pl" style={{ background: PLATE_COLORS[pl], height: 22 + pl * 1.8 + 'px', color: pl >= 5 && pl !== 5 ? '#fff' : '#09090b' }}>{pl}</span>)}
                </div>
                <p class="num">{r.perSide.length ? r.perSide.join(' + ') + ' kg each side' : 'Just the bar'}</p>
                {r.leftover > 0 && <p class="rose-t">Can't make exactly {fmt(target, 2)} kg. Closest is {fmt(r.loaded, 2)} kg.</p>}
              </>
            )}
          </div>
        );
      })}
    </Sheet>
  );
}
