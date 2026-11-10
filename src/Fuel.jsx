import { useState } from 'preact/hooks';
import { FOODS, FOOD_CATS, OIL, SLOTS, oilKcal, foodsForRegion } from './data.js';
import { regionOf } from './regions.js';
import { get, put, remove, rows, newId, useStore } from './store.js';
import { dayIntake, targetKcal, proteinFloor, today, addDays, prettyDay, fmt, num } from './calc.js';
import { Bar, Icon, Sheet, Stepper, Field } from './ui.jsx';
import { DeficitMeter } from './Dashboard.jsx';
import { PhotoFood } from './PhotoFood.jsx';

const mealId = (day, slot) => `${day}_${slot}`;

function ensureMeal(day, slot) {
  const id = mealId(day, slot);
  return get('meals', id) || put('meals', { id, day, slot, oil: 'home' });
}

function addFood(day, slot, f, qty) {
  const m = ensureMeal(day, slot);
  const existing = rows('food_entries').find((e) => e.meal_id === m.id && e.item === f.id && f.id !== 'custom');
  if (existing) return put('food_entries', { id: existing.id, qty: Math.round((existing.qty + (qty ?? 1)) * 100) / 100 });
  put('food_entries', { id: newId(), day, meal_id: m.id, item: f.id, name: f.name, unit: f.unit, qty: qty ?? 1, kcal: f.kcal, protein: f.p, carbs: f.c ?? 0, fat: f.f ?? 0, source: 'manual' });
}

export function Fuel({ p }) {
  useStore();
  const [day, setDay] = useState(today());
  const [picker, setPicker] = useState(null); // slot key
  const [snap, setSnap] = useState(null); // slot key
  const tot = dayIntake(day);
  const target = targetKcal(p), pf = proteinFloor(p);
  const entries = rows('food_entries').filter((e) => e.day === day);

  return (
    <div class="page">
      <header class="top">
        <button class="icon-btn" onClick={() => setDay(addDays(day, -1))} aria-label="Previous day"><Icon name="left" /></button>
        <div class="center"><h1 class="h1">Fuel</h1><small class="muted">{prettyDay(day)}</small></div>
        <button class="icon-btn" disabled={day >= today()} onClick={() => setDay(addDays(day, 1))} aria-label="Next day"><Icon name="right" /></button>
      </header>

      <section class="card totals">
        <div class="tot-row">
          <div><small class="eyebrow">Calories</small><div class={'mid num ' + (tot.kcal > target ? 'rose-t' : '')}>{fmt(tot.kcal)}<span> / {fmt(target)}</span></div></div>
          <div><small class="eyebrow">Protein</small><div class={'mid num ' + (tot.protein >= pf ? 'em-t' : '')}>{tot.protein}<span> / {pf} g</span></div></div>
        </div>
        <Bar value={tot.kcal} max={target} tone={tot.kcal > target ? 'rose' : 'em'} />
        <div class="macro-row num"><span>Carbs {tot.carbs} g</span><span>Fat {tot.fat} g</span></div>
        <small class="muted">Includes {fmt(tot.oil)} kcal of hidden cooking oil</small>
      </section>

      {SLOTS.map((s) => {
        const m = get('meals', mealId(day, s.key));
        const items = entries.filter((e) => e.meal_id === mealId(day, s.key));
        const oil = m?.oil || 'home';
        const kcal = items.reduce((a, e) => a + e.kcal * e.qty, 0) + (items.length ? oilKcal(oil) : 0);
        const prot = items.reduce((a, e) => a + e.protein * e.qty, 0);
        return (
          <section class="card meal">
            <div class="meal-head">
              <h3>{s.label}</h3>
              <span class="muted num">{fmt(kcal)} kcal · {fmt(prot)} g P</span>
            </div>
            <div class="oil" role="radiogroup" aria-label="Cooking style">
              {OIL.map((o) => (
                <button role="radio" aria-checked={oil === o.key} class={oil === o.key ? 'on' : ''}
                  onClick={() => put('meals', { id: mealId(day, s.key), day, slot: s.key, oil: o.key })}>
                  <span>{o.short}</span><small>{o.sub}</small>
                </button>
              ))}
            </div>
            {items.map((e) => {
              const f = FOODS.find((x) => x.id === e.item);
              return (
                <div class="item">
                  <div class="item-name"><b>{e.name}</b><small class="muted">{e.unit} · {fmt(e.kcal * e.qty)} kcal · {fmt(e.protein * e.qty, 1)} g P{e.source === 'photo' ? ' · 📷 ±10%' : ''}</small></div>
                  <Stepper value={e.qty} step={f?.step || 1}
                    onChange={(q) => (q <= 0 ? remove('food_entries', e.id) : put('food_entries', { id: e.id, qty: q }))} />
                </div>
              );
            })}
            <div class="grid2">
              <button class="btn ghost" onClick={() => setPicker(s.key)}><Icon name="plus" size={16} /> Add food</button>
              <button class="btn ghost" onClick={() => setSnap(s.key)}><Icon name="camera" size={16} /> Snap plate</button>
            </div>
          </section>
        );
      })}

      <DeficitMeter p={p} day={day} />

      <Picker open={!!picker} slot={picker} day={day} p={p} onClose={() => setPicker(null)} />
      <PhotoFood open={!!snap} slot={snap} day={day} onClose={() => setSnap(null)} />
    </div>
  );
}

function Picker({ open, slot, day, p, onClose }) {
  useStore();
  const region = regionOf(p?.state);
  const local = region === 'ALL' ? foodsForRegion('ALL') : FOODS.filter((f) => f.r && (f.r.includes(region) || f.r.includes('ALL')));
  const [cat, setCat] = useState(local.length ? 'local' : 'bread');
  const [c, setC] = useState({ name: '', kcal: '', p: '', cb: '', ft: '' });
  if (!open) return null;
  const meal = mealId(day, slot);
  const inMeal = rows('food_entries').filter((e) => e.meal_id === meal);
  const label = SLOTS.find((s) => s.key === slot)?.label;

  function addCustom(e) {
    e.preventDefault();
    const kcal = num(c.kcal), p = num(c.p) ?? 0;
    if (!c.name.trim() || kcal == null) return;
    addFood(day, slot, { id: 'custom', name: c.name.trim().slice(0, 80), unit: 'custom', kcal, p, c: num(c.cb) ?? 0, f: num(c.ft) ?? 0, step: 1 }, 1);
    setC({ name: '', kcal: '', p: '', cb: '', ft: '' });
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Add to ${label}`}>
      <div class="tabs">
        {[...FOOD_CATS, { key: 'custom', label: 'Custom' }].map((x) => (
          <button class={cat === x.key ? 'on' : ''} onClick={() => setCat(x.key)}>{x.label}</button>
        ))}
      </div>
      {cat === 'custom' ? (
        <form class="stack" onSubmit={addCustom}>
          <Field label="Name"><input value={c.name} maxLength={80} onInput={(e) => setC({ ...c, name: e.currentTarget.value })} placeholder="e.g. Office canteen thali" /></Field>
          <div class="grid2">
            <Field label="kcal"><input inputMode="decimal" value={c.kcal} onInput={(e) => setC({ ...c, kcal: e.currentTarget.value })} /></Field>
            <Field label="Protein (g)"><input inputMode="decimal" value={c.p} onInput={(e) => setC({ ...c, p: e.currentTarget.value })} /></Field>
            <Field label="Carbs (g)"><input inputMode="decimal" value={c.cb} onInput={(e) => setC({ ...c, cb: e.currentTarget.value })} /></Field>
            <Field label="Fat (g)"><input inputMode="decimal" value={c.ft} onInput={(e) => setC({ ...c, ft: e.currentTarget.value })} /></Field>
          </div>
          <button class="btn primary full">Add custom item</button>
        </form>
      ) : (
        <div class="food-list">
          {(cat === 'local' ? local : FOODS.filter((f) => f.cat === cat)).map((f) => {
            const q = inMeal.find((e) => e.item === f.id)?.qty;
            return (
              <button class={'food' + (q ? ' on' : '')} onClick={() => addFood(day, slot, f)}>
                <div><b>{f.name}</b><small class="muted">{f.unit} · {f.kcal} kcal · {f.p} g P</small></div>
                <span class="food-q">{q ? `×${q}` : <Icon name="plus" size={18} />}</span>
              </button>
            );
          })}
        </div>
      )}
      <button class="btn primary full sticky-done" onClick={onClose}>Done</button>
    </Sheet>
  );
}
