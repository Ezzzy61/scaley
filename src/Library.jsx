// Exercise library: 876 exercises with how-to steps and photos from free-exercise-db
// (github.com/yuhonas/free-exercise-db, released into the public domain under the Unlicense).
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Sheet, Icon } from './ui.jsx';
import { aa } from './fx.js';

const IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
let cache = null;
export function loadLibrary() {
  cache ||= fetch('data/exercises.json').then((r) => { if (!r.ok) throw new Error('Library unavailable offline'); return r.json(); }).catch((e) => { cache = null; throw e; });
  return cache;
}

const GROUPS = [
  { key: 'all', label: 'All' },
  { key: 'chest', label: 'Chest', m: ['chest'] },
  { key: 'back', label: 'Back', m: ['lats', 'middle back', 'lower back', 'traps'] },
  { key: 'shoulders', label: 'Shoulders', m: ['shoulders', 'neck'] },
  { key: 'arms', label: 'Arms', m: ['biceps', 'triceps', 'forearms'] },
  { key: 'legs', label: 'Legs', m: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'] },
  { key: 'core', label: 'Core', m: ['abdominals'] },
];
const WHERE = [
  { key: 'any', label: 'Any' },
  { key: 'home', label: 'Home', e: ['body only', 'dumbbell', 'bands', 'kettlebells', 'other', 'exercise ball', 'foam roll', 'medicine ball'] },
  { key: 'body', label: 'No equipment', e: ['body only'] },
  { key: 'gym', label: 'Gym', e: ['barbell', 'cable', 'machine', 'e-z curl bar', 'dumbbell'] },
];
const LEVEL = { b: 'Beginner', i: 'Intermediate', e: 'Expert' };

export function ExerciseLibrary({ open, onClose, onAdd, initial = '' }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState(initial);
  const [g, setG] = useState('all');
  const [w, setW] = useState('any');
  const [kind, setKind] = useState('strength');
  const [sel, setSel] = useState(null);
  useEffect(() => { if (open) { setQ(initial); loadLibrary().then(setData).catch((e) => setErr(e.message)); } }, [open]);

  const list = useMemo(() => {
    if (!data) return [];
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const gm = GROUPS.find((x) => x.key === g)?.m, we = WHERE.find((x) => x.key === w)?.e;
    return data.filter((x) =>
      (kind === 'all' || (kind === 'strength' ? ['strength', 'powerlifting', 'olympic weightlifting', 'strongman'].includes(x.c) : x.c === kind)) &&
      (!gm || x.m.some((m) => gm.includes(m))) && (!we || we.includes(x.e)) &&
      words.every((wd) => x.n.toLowerCase().includes(wd) || x.m.join(' ').includes(wd)))
      .sort((a, b) => (a.l === 'b' ? 0 : 1) - (b.l === 'b' ? 0 : 1) || a.n.localeCompare(b.n)).slice(0, 80);
  }, [data, q, g, w, kind]);

  if (!open) return null;
  if (sel) return <ExerciseDetail x={sel} onBack={() => setSel(null)} onClose={() => { setSel(null); onClose(); }} onAdd={onAdd} />;
  return (
    <Sheet open={open} onClose={onClose} title="Exercise library">
      <div class="stack">
        <input type="search" placeholder="Search 870+ exercises (e.g. squat, curl, plank)" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
        <div class="tabs">{[['strength', 'Strength'], ['stretching', 'Mobility'], ['plyometrics', 'Plyo'], ['cardio', 'Cardio'], ['all', 'Everything']].map(([k, l]) => <button class={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{l}</button>)}</div>
        <div class="chips">{GROUPS.map((x) => <button class={'chip' + (g === x.key ? ' on' : '')} onClick={() => setG(x.key)}>{x.label}</button>)}</div>
        <div class="chips">{WHERE.map((x) => <button class={'chip' + (w === x.key ? ' on' : '')} onClick={() => setW(x.key)}>{x.label}</button>)}</div>
        {err && <p class="msg bad">{err}</p>}
        {!data && !err && <div class="spinner" />}
        <div class="food-list" ref={aa}>
          {list.map((x) => (
            <button class="food lib-row" key={x.id} onClick={() => setSel(x)}>
              <img loading="lazy" src={IMG + x.id + '/0.jpg'} alt="" width="56" height="42" />
              <div><b>{x.n}</b><small class="muted">{x.m.join(', ')} · {x.e} · {LEVEL[x.l]}</small></div>
              <Icon name="right" size={16} />
            </button>
          ))}
          {data && !list.length && <p class="muted">Nothing matches. Try fewer filters.</p>}
        </div>
        <small class="fine">Exercise data and photos: free-exercise-db (public domain).</small>
      </div>
    </Sheet>
  );
}

function ExerciseDetail({ x, onBack, onClose, onAdd }) {
  const [f, setF] = useState(0);
  useEffect(() => { if (x.k < 2) return; const id = setInterval(() => setF((n) => (n + 1) % x.k), 900); return () => clearInterval(id); }, [x.id]);
  const [added, setAdded] = useState(false);
  return (
    <Sheet open onClose={onClose} title={x.n}>
      <div class="stack">
        <button class="link left" onClick={onBack}>← Back to library</button>
        <div class="ex-anim"><img src={IMG + x.id + '/' + f + '.jpg'} alt={`${x.n} demonstration`} /></div>
        <div class="chips">
          {x.m.map((m) => <span class="chip on">{m}</span>)}{x.s.map((m) => <span class="chip">{m}</span>)}
          <span class="chip">{x.e}</span><span class="chip">{LEVEL[x.l]}</span>
        </div>
        <ol class="howto">{x.i.map((s) => <li>{s}</li>)}</ol>
        {onAdd && <button class="btn primary full" disabled={added} onClick={() => { onAdd(x.n.slice(0, 60)); setAdded(true); }}>{added ? 'Added to workout ✓' : 'Add to workout'}</button>}
      </div>
    </Sheet>
  );
}
