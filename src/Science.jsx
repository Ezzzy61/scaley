import { useState } from 'preact/hooks';
import { weekStats, EVIDENCE, evidenceOfDay, MUSCLES, asianBmi } from './science.js';
import { Bar, Icon, Sheet } from './ui.jsx';
import { fmt } from './calc.js';

// Weekly "minimum effective dose" scorecard: training, protein, steps, sleep and sets per muscle.
export function WeeklyDose({ p, go }) {
  const w = weekStats(p);
  const [open, setOpen] = useState(false);
  const row = (label, val, max, text) => (
    <div class="dose-row"><span>{label}</span><Bar value={Math.min(val, max)} max={max} tone={val >= max ? 'em' : 'neutral'} /><small class="num">{text}</small></div>
  );
  return (
    <section class="card">
      <div class="row between">
        <small class="eyebrow">Last 7 days · results score</small>
        <button class="link" onClick={() => setOpen(!open)}>{open ? 'Less' : 'Per muscle'}</button>
      </div>
      <div class="row"><div class="big num">{w.score}<span> / 100</span></div></div>
      {row('Workouts', w.sessions, 3, `${w.sessions}/3`)}
      {row('Protein floor', w.proteinDays, 5, `${w.proteinDays}/5 days`)}
      {row('Steps (avg)', w.avgSteps || 0, w.stepGoal, w.avgSteps == null ? 'not logged' : fmt(w.avgSteps))}
      {row('Sleep (avg)', w.avgSleep || 0, 7, w.avgSleep == null ? 'check in daily' : `${w.avgSleep} h`)}
      {open && <>
        <small class="eyebrow">Hard sets per muscle (target {w.setTarget}+)</small>
        {MUSCLES.map((m) => row(m.label, w.perMuscle[m.key], w.setTarget, `${w.perMuscle[m.key]} sets`))}
        <small class="muted">Under target? Add 2–3 sets for that muscle to your next sessions, or open Iron → Library for home options.</small>
      </>}
      {w.sessions === 0 && <button class="btn ghost sm" onClick={() => go('iron')}>Start a 30-min session</button>}
    </section>
  );
}

export function EvidenceCard() {
  const e = evidenceOfDay();
  const [all, setAll] = useState(false);
  return (
    <>
      <section class="card tip">
        <small class="eyebrow"><Icon name="book" size={13} /> Science of the day</small>
        <b>{e.icon} {e.title}</b>
        <p class="muted small">{e.text}</p>
        <div class="row between"><a class="link" href={e.url} target="_blank" rel="noopener">{e.src} ↗</a><button class="link" onClick={() => setAll(true)}>All {EVIDENCE.length}</button></div>
      </section>
      <Sheet open={all} onClose={() => setAll(false)} title="Why Scaley works">
        <div class="stack">
          <p class="muted small">Scaley's targets come from research. Plain-English summaries, with links to the original papers.</p>
          {EVIDENCE.map((x) => (
            <section class="card tip"><b>{x.icon} {x.title}</b><p class="muted small">{x.text}</p><a class="link left" href={x.url} target="_blank" rel="noopener">{x.src} ↗</a></section>
          ))}
        </div>
      </Sheet>
    </>
  );
}

export function BmiNote({ p }) {
  const b = asianBmi(p);
  if (!b) return null;
  return <small class="muted">BMI {b.bmi} · {b.band}. Indians face higher risk at lower BMI (WHO Asian cut-offs: 23 / 27.5).</small>;
}
