import { useState } from 'preact/hooks';
import { FOODS, OIL, SLOTS, oilKcal } from './data.js';
import { get, put, rows, newId } from './store.js';
import { fmt } from './calc.js';
import { callAI, shrinkImage, foodCatalog } from './ai.js';
import { Sheet, Stepper, Icon, Seg, Field } from './ui.jsx';

export const range = (k) => `${fmt(Math.round(k * 0.9 / 5) * 5)}–${fmt(Math.round(k * 1.1 / 5) * 5)}`;

export function PhotoFood({ open, slot, day, onClose }) {
  const [img, setImg] = useState(null);
  const [note, setNote] = useState('');
  const [state, setState] = useState('pick'); // pick | busy | review | error
  const [err, setErr] = useState('');
  const [items, setItems] = useState([]);
  const [oil, setOil] = useState('home');
  const [aiNote, setAiNote] = useState('');

  const reset = () => { setImg(null); setNote(''); setState('pick'); setItems([]); setErr(''); setAiNote(''); };
  const close = () => { reset(); onClose(); };
  if (!open) return null;
  const label = SLOTS.find((s) => s.key === slot)?.label || 'Meal';

  async function pick(e) {
    const f = e.currentTarget.files?.[0];
    if (!f) return;
    try { setImg(await shrinkImage(f)); } catch { setErr('Could not read that image.'); setState('error'); }
  }

  async function analyze() {
    setState('busy'); setErr('');
    try {
      const out = await callAI('food', { images: [{ mime: img.mime, b64: img.b64 }], catalog: foodCatalog(), slot: label, note });
      const list = (out.data?.items || []).map((it) => {
        const cat = FOODS.find((f) => f.id === it.id);
        const n = (v) => Math.max(0, Number(v) || 0);
        return cat
          ? { item: cat.id, name: cat.name, unit: cat.unit, qty: Math.max(0.5, Math.round(n(it.qty) * 2) / 2 || 1), kcal: cat.kcal, protein: cat.p, carbs: cat.c, fat: cat.f, step: cat.step }
          : { item: 'ai', name: String(it.name || 'Food').slice(0, 80), unit: String(it.unit || 'portion').slice(0, 40), qty: Math.max(0.5, Math.round(n(it.qty) * 2) / 2 || 1), kcal: Math.min(2000, n(it.kcal)), protein: Math.min(200, n(it.protein)), carbs: Math.min(400, n(it.carbs)), fat: Math.min(200, n(it.fat)), step: 0.5 };
      });
      if (!list.length) { setErr(out.data?.notes || 'No food detected. Try a clearer, top-down photo.'); setState('error'); return; }
      setItems(list);
      setOil(OIL.some((o) => o.key === out.data?.oil) ? out.data.oil : 'home');
      setAiNote(out.data?.notes || '');
      setState('review');
    } catch (e) { setErr(e.message); setState('error'); }
  }

  const tot = items.reduce((a, i) => ({ k: a.k + i.kcal * i.qty, p: a.p + i.protein * i.qty, c: a.c + i.carbs * i.qty, f: a.f + i.fat * i.qty }), { k: 0, p: 0, c: 0, f: 0 });
  const kcal = tot.k + (items.length ? oilKcal(oil) : 0);

  function log() {
    const mid = `${day}_${slot}`;
    put('meals', { id: mid, day, slot, oil });
    for (const it of items) {
      if (it.qty <= 0) continue;
      const existing = it.item !== 'ai' && rows('food_entries').find((e) => e.meal_id === mid && e.item === it.item);
      if (existing) put('food_entries', { id: existing.id, qty: Math.round((existing.qty + it.qty) * 100) / 100 });
      else put('food_entries', { id: newId(), day, meal_id: mid, item: it.item, name: it.name, unit: it.unit, qty: it.qty, kcal: it.kcal, protein: it.protein, carbs: it.carbs, fat: it.fat, source: 'photo' });
    }
    close();
  }

  return (
    <Sheet open={open} onClose={close} title={`Snap ${label}`}>
      {state === 'pick' || state === 'error' ? (
        <div class="stack">
          <label class="photo-drop">
            {img ? <img src={img.dataUrl} alt="Your meal" /> : <><Icon name="camera" size={28} /><b>Take or choose a photo</b><small class="muted">Top-down, whole plate in frame, katori/roti visible</small></>}
            <input type="file" accept="image/*" capture="environment" onChange={pick} hidden />
          </label>
          <Field label="Anything the photo can't show? (optional)">
            <input value={note} maxLength={300} onInput={(e) => setNote(e.currentTarget.value)} placeholder="e.g. 2 more rotis off-camera, made with butter" />
          </Field>
          {err && <p class="msg bad">{err}</p>}
          <button class="btn primary full" disabled={!img} onClick={analyze}>Estimate calories & macros</button>
          <p class="fine">AI estimates are approximate (±10%). Your manual katori/roti logging stays the source of truth.</p>
        </div>
      ) : state === 'busy' ? (
        <div class="stack center-pad"><div class="spinner" /><p class="muted">Reading the plate…</p></div>
      ) : (
        <div class="stack">
          {img && <img class="thumb-wide" src={img.dataUrl} alt="" />}
          <div class="card est">
            <small class="eyebrow">Estimate · ±10%</small>
            <div class="big num">{range(kcal)}<span> kcal</span></div>
            <div class="macro-row num"><span>P {fmt(tot.p)} g</span><span>C {fmt(tot.c)} g</span><span>F {fmt(tot.f + (items.length ? oilKcal(oil) / 9 : 0))} g</span></div>
            {aiNote && <small class="muted">{aiNote}</small>}
          </div>
          <Field label="Cooking style (hidden oil)">
            <Seg small value={oil} onChange={setOil} options={OIL.map((o) => ({ value: o.key, label: o.short, sub: o.sub }))} />
          </Field>
          {items.map((it, i) => (
            <div class="item">
              <div class="item-name"><b>{it.name}{it.item === 'ai' && <span class="tag">AI</span>}</b><small class="muted">{it.unit} · ~{fmt(it.kcal * it.qty)} kcal</small></div>
              <Stepper value={it.qty} step={it.step || 0.5} onChange={(q) => setItems(q <= 0 ? items.filter((_, j) => j !== i) : items.map((x, j) => (j === i ? { ...x, qty: q } : x)))} />
            </div>
          ))}
          <p class="fine">Fix the quantities if something looks off, then log it. Items matched to Scaley's food list use Scaley's own numbers.</p>
          <button class="btn primary full" disabled={!items.length} onClick={log}>Log to {label}</button>
          <button class="link" onClick={reset}>Retake</button>
        </div>
      )}
    </Sheet>
  );
}
