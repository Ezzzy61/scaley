import { useState } from 'preact/hooks';
import { GOALS } from './data.js';
import { bmr, targetKcal, proteinFloor, plannedBurn, kcalFloor, today, fmt, num, int } from './calc.js';
import { put, get } from './store.js';
import { Field, Seg } from './ui.jsx';

// Shared by onboarding and settings.
export function ProfileForm({ initial, onSaved, submitLabel = 'Save', showAdvanced }) {
  const [f, setF] = useState(() => ({
    sex: initial?.sex || 'male',
    age: initial?.age ?? '',
    height_cm: initial?.height_cm ?? '',
    weight_kg: initial?.weight_kg ?? '',
    target_kg: initial?.target_kg ?? '',
    goal: initial?.goal || 'moderate',
    step_goal: initial?.step_goal ?? 8000,
    plan_workout_kcal: initial?.plan_workout_kcal ?? 250,
    rest_default: initial?.rest_default ?? 90,
  }));
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.currentTarget.value });

  const draft = {
    ...f, age: int(f.age), height_cm: num(f.height_cm), weight_kg: num(f.weight_kg), target_kg: num(f.target_kg),
    step_goal: int(f.step_goal) ?? 8000, plan_workout_kcal: int(f.plan_workout_kcal) ?? 250, rest_default: int(f.rest_default) ?? 90,
    tdee: initial?.tdee ?? null,
  };
  const valid = draft.age >= 13 && draft.age <= 100 && draft.height_cm >= 100 && draft.height_cm <= 250
    && draft.weight_kg >= 25 && draft.weight_kg <= 300 && draft.target_kg >= 25 && draft.target_kg <= 300;
  const clamped = valid && plannedBurn(draft) + GOALS[draft.goal].offset < kcalFloor(draft);

  function save(e) {
    e.preventDefault();
    if (!valid) return setErr('Check age (13–100), height (100–250 cm) and weights (25–300 kg).');
    const startNew = draft.goal === 'figure' && (initial?.goal !== 'figure' || !initial?.started_on);
    const row = put('profiles', {
      id: 'me', ...draft,
      started_on: startNew ? today() : initial?.started_on ?? today(),
    });
    // First weigh-in comes for free from onboarding.
    if (!initial && !get('weigh_ins', today())) put('weigh_ins', { id: today(), day: today(), kg: draft.weight_kg });
    onSaved?.(row);
  }

  return (
    <form onSubmit={save} class="stack">
      <Field label="Sex"><Seg value={f.sex} onChange={(v) => setF({ ...f, sex: v })}
        options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} /></Field>
      <div class="grid2">
        <Field label="Age"><input inputMode="numeric" value={f.age} onInput={set('age')} placeholder="27" /></Field>
        <Field label="Height (cm)"><input inputMode="decimal" value={f.height_cm} onInput={set('height_cm')} placeholder="175" /></Field>
        <Field label="Current weight (kg)"><input inputMode="decimal" value={f.weight_kg} onInput={set('weight_kg')} placeholder="82" /></Field>
        <Field label="Target weight (kg)"><input inputMode="decimal" value={f.target_kg} onInput={set('target_kg')} placeholder="75" /></Field>
      </div>
      <div class="field"><span class="field-label">Goal</span>
        <div class="goals">
          {Object.entries(GOALS).map(([k, g]) => (
            <button type="button" class={'goal' + (f.goal === k ? ' on' : '')} onClick={() => setF({ ...f, goal: k })}>
              <b>{g.label}</b><small>{g.sub}</small>
            </button>
          ))}
        </div>
      </div>
      {showAdvanced && (
        <div class="grid2">
          <Field label="Daily step goal"><input inputMode="numeric" value={f.step_goal} onInput={set('step_goal')} /></Field>
          <Field label="Avg training kcal/day"><input inputMode="numeric" value={f.plan_workout_kcal} onInput={set('plan_workout_kcal')} /></Field>
          <Field label="Default rest (sec)"><Seg small value={String(f.rest_default)} onChange={(v) => setF({ ...f, rest_default: v })}
            options={[{ value: '60', label: '60' }, { value: '90', label: '90' }, { value: '150', label: '150' }]} /></Field>
        </div>
      )}
      {valid && (
        <div class="preview">
          <div><small>BMR</small><b>{fmt(bmr(draft))}</b></div>
          <div><small>Daily target</small><b>{fmt(targetKcal(draft))} kcal</b></div>
          <div><small>Protein floor</small><b>{proteinFloor(draft)} g</b></div>
        </div>
      )}
      {clamped && <p class="msg">Target held at the {kcalFloor(draft)} kcal safety floor. Push steps up instead of eating less.</p>}
      {draft.goal === 'figure' && <p class="msg">For 7 days, eat normally and log everything with a morning weigh-in. Scaley then calculates your real maintenance (TDEE).</p>}
      {err && <p class="msg bad">{err}</p>}
      <button class="btn primary full">{submitLabel}</button>
    </form>
  );
}

export function Onboarding() {
  return (
    <div class="page onboard">
      <h1 class="h1">Set your baseline</h1>
      <p class="muted">Scaley needs this for your BMR, daily calorie target and protein floor. You can change it later.</p>
      <ProfileForm submitLabel="Start tracking" />
    </div>
  );
}
