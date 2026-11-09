import { useState } from 'preact/hooks';
import { SPLITS, EXERCISE_LIBRARY, isBarbell } from './data.js';
import { get, put, remove, rows, newId, useStore } from './store.js';
import { today, prettyDay, lastPerformance, plateMath, fmt, num, int } from './calc.js';
import { Icon, Sheet, Field } from './ui.jsx';

function startWorkout(split) {
  const id = newId();
  const day = today();
  const exercises = SPLITS[split].map((name) => ({ name, bb: isBarbell(name) }));
  put('workouts', { id, day, split, started_at: new Date().toISOString(), finished: false, exercises });
  for (const ex of exercises) seedSets(id, day, ex.name);
  return id;
}
function seedSets(workoutId, day, name) {
  const last = lastPerformance(name, workoutId);
  const n = Math.max(3, last?.sets.length || 0);
  for (let i = 0; i < n; i++) put('workout_sets', { id: newId(), workout_id: workoutId, day, exercise: name, idx: i, kg: null, reps: null, done: false });
}

export function Iron({ p, onSetDone }) {
  useStore();
  const [openId, setOpenId] = useState(null);
  const active = rows('workouts').filter((w) => !w.finished).sort((a, b) => (b.started_at || '').localeCompare(a.started_at || ''))[0];
  const w = (openId && get('workouts', openId)) || active;

  if (w) return <Workout w={w} p={p} onSetDone={onSetDone} onClose={() => setOpenId(null)} />;

  const history = rows('workouts').filter((x) => x.finished).sort((a, b) => (b.started_at || b.day).localeCompare(a.started_at || a.day)).slice(0, 12);
  const sets = rows('workout_sets');
  return (
    <div class="page">
      <header class="top"><div><h1 class="h1">Iron</h1><small class="muted">Pick today's split</small></div></header>
      <div class="splits">
        {Object.keys(SPLITS).map((s) => (
          <button class="split" onClick={() => setOpenId(startWorkout(s))}><b>{s}</b><small>{SPLITS[s].slice(0, 3).join(' · ')}</small></button>
        ))}
      </div>
      <h2 class="h2">History</h2>
      {!history.length && <p class="muted">No sessions yet. Your first one shows up here.</p>}
      {history.map((h) => {
        const done = sets.filter((s) => s.workout_id === h.id && s.done);
        const vol = done.reduce((a, s) => a + (s.kg || 0) * (s.reps || 0), 0);
        return (
          <button class="card row-btn" onClick={() => setOpenId(h.id)}>
            <div><b>{h.split}</b><small class="muted">{prettyDay(h.day)}</small></div>
            <span class="muted num">{done.length} sets · {fmt(vol)} kg vol</span>
          </button>
        );
      })}
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
