import { useState } from 'preact/hooks';
import { get, put, remove, useStore } from './store.js';
import { weightSeries, stallCheck, diagnostic, goalOf, today, addDays, prettyDay, fmt, num, dayIntake, dayBurn, targetKcal, proteinFloor, daysBetween } from './calc.js';
import { GOALS } from './data.js';
import { Icon, Field } from './ui.jsx';

function Chart({ series }) {
  const W = 340, H = 170, P = 26;
  const end = today(), start = addDays(end, -29);
  const pts = series.filter((s) => s.day >= start);
  if (pts.length < 2) return <p class="muted chart-empty">Log at least two weigh-ins to see your trend.</p>;
  const vals = pts.flatMap((s) => [s.kg, s.ma]);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const x = (d) => P + (daysBetween(start, d) / 29) * (W - P - 8);
  const y = (v) => 8 + (1 - (v - lo) / (hi - lo)) * (H - 8 - 22);
  const line = pts.map((s, i) => `${i ? 'L' : 'M'}${x(s.day).toFixed(1)},${y(s.ma).toFixed(1)}`).join('');
  const ticks = [hi, (hi + lo) / 2, lo];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} class="chart" role="img" aria-label="Weight and 7-day average, last 30 days">
      {ticks.map((t) => <g><line x1={P} x2={W - 8} y1={y(t)} y2={y(t)} class="grid" /><text x={P - 4} y={y(t) + 3} class="tick" text-anchor="end">{t.toFixed(1)}</text></g>)}
      {pts.map((s) => <circle cx={x(s.day)} cy={y(s.kg)} r="2.5" class="dot" />)}
      <path d={line} class="ma" />
      <text x={P} y={H - 4} class="tick">{prettyDay(start)}</text>
      <text x={W - 8} y={H - 4} class="tick" text-anchor="end">Today</text>
    </svg>
  );
}

export function Progress({ p }) {
  useStore();
  const [day, setDay] = useState(today());
  const existing = get('weigh_ins', day);
  const [kg, setKg] = useState('');
  const series = weightSeries();
  const last = series[series.length - 1];
  const weekAgo = [...series].reverse().find((s) => s.day <= addDays(last?.day || today(), -7));
  const g = goalOf(p);
  const stall = stallCheck(p);
  const diag = p.goal === 'figure' ? diagnostic(p) : null;

  function save(e) {
    e.preventDefault();
    const v = num(kg);
    if (v == null || v < 25 || v > 300) return;
    put('weigh_ins', { id: day, day, kg: v });
    if (day === today()) put('profiles', { id: 'me', weight_kg: v });
    setKg('');
  }

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(today(), -i);
    const it = dayIntake(d);
    week.push({ d, ...it, burn: dayBurn(d, p).total });
  }
  const logged = week.filter((w) => w.items);
  const avg = logged.length ? Math.round(logged.reduce((a, w) => a + w.kcal, 0) / logged.length) : null;
  const proteinHits = logged.filter((w) => w.protein >= proteinFloor(p)).length;

  return (
    <div class="page">
      <header class="top"><div><h1 class="h1">Diagnostics</h1><small class="muted">Weight trend, stalls and real intake</small></div></header>

      <form class="card stack" onSubmit={save}>
        <small class="eyebrow">Morning weigh-in</small>
        <div class="row">
          <select value={day} onChange={(e) => setDay(e.currentTarget.value)} aria-label="Day">
            {Array.from({ length: 7 }, (_, i) => addDays(today(), -i)).map((d) => <option value={d}>{prettyDay(d)}</option>)}
          </select>
          <input inputMode="decimal" placeholder={existing ? `${existing.kg} kg logged` : 'kg'} value={kg} onInput={(e) => setKg(e.currentTarget.value)} aria-label="Weight in kg" />
          <button class="btn primary">Save</button>
        </div>
        {existing && <button type="button" class="link danger-t" onClick={() => remove('weigh_ins', day)}>Remove {prettyDay(day).toLowerCase()}'s weigh-in</button>}
      </form>

      <section class="card">
        <div class="tot-row">
          <div><small class="eyebrow">7-day average</small><div class="mid num">{last ? fmt(last.ma, 1) : '–'}<span> kg</span></div></div>
          <div><small class="eyebrow">Avg change, 7 days</small>
            <div class={'mid num ' + (last && weekAgo ? ((last.ma - weekAgo.ma) * (g.dir || -1) > 0 ? 'em-t' : 'rose-t') : '')}>
              {last && weekAgo ? (last.ma - weekAgo.ma > 0 ? '+' : '') + fmt(last.ma - weekAgo.ma, 2) : '–'}<span> kg</span></div></div>
          <div><small class="eyebrow">To target</small><div class="mid num">{last ? fmt(Math.abs(last.ma - p.target_kg), 1) : '–'}<span> kg</span></div></div>
        </div>
        <Chart series={series} />
        <small class="muted"><span class="legend dot" /> daily weigh-in &nbsp; <span class="legend ma" /> 7-day average. Ignore single spikes from a salty dhaba dinner and watch the line.</small>
      </section>

      {stall && (
        <section class={'card ' + (stall.stalled ? 'stall' : 'ok')}>
          <div class="row"><Icon name={stall.stalled ? 'alert' : 'check'} /><b>{stall.stalled ? `Stalled for ${stall.since} days` : 'Trending the right way'}</b></div>
          {stall.stalled ? (
            <ul class="tips">
              <li>Your 7-day average last set a new {g.dir < 0 ? 'low' : 'high'} on {prettyDay(stall.bestDay)} ({fmt(stall.bestMa, 1)} kg).</li>
              {g.dir < 0 ? <>
                <li>Check your oil toggles first. Mess food logged as "Home" hides about 45 kcal per meal.</li>
                <li>Add 2,000 steps a day (≈ 90 kcal) before cutting food.</li>
                <li>If that doesn't move it in a week, drop the target by 100–150 kcal.</li>
              </> : <>
                <li>Add one more katori of rice or a glass of milk a day (+150–250 kcal).</li>
                <li>Make sure the bar weight is going up. A surplus without progression is just fat.</li>
              </>}
            </ul>
          ) : <p class="muted">New 7-day {g.dir < 0 ? 'low' : 'high'} {stall.since === 0 ? 'today' : `${stall.since} day${stall.since > 1 ? 's' : ''} ago`}. Keep going.</p>}
        </section>
      )}

      {diag && (
        <section class="card">
          <small class="eyebrow">Figure It Out: TDEE diagnostic</small>
          <div class="tot-row">
            <div><small>Days</small><b class="num">{Math.min(diag.elapsed, 7)}/7</b></div>
            <div><small>Days logged</small><b class="num">{diag.loggedDays}</b></div>
            <div><small>Weigh-ins</small><b class="num">{diag.weighIns}</b></div>
          </div>
          {diag.ready ? (
            <>
              <p>Average intake <b>{fmt(diag.avgIntake)} kcal</b>. Weight trend <b>{diag.kgPerWeek > 0 ? '+' : ''}{fmt(diag.kgPerWeek, 2)} kg/week</b>.</p>
              <p class="big num em-t">{fmt(diag.tdee)} <span>kcal/day real maintenance</span></p>
              <p class="muted">Pick a goal to lock this in. Your targets will build on this measured number instead of the formula.</p>
              <div class="goals">
                {Object.entries(GOALS).filter(([k]) => k !== 'figure').map(([k, gg]) => (
                  <button class="goal" onClick={() => put('profiles', { id: 'me', goal: k, tdee: diag.tdee })}>
                    <b>{gg.label}</b><small>{fmt(Math.max(diag.tdee + gg.offset, p.sex === 'male' ? 1500 : 1200))} kcal/day</small>
                  </button>
                ))}
              </div>
            </>
          ) : <p class="muted">Eat normally, log every meal and weigh in each morning. The result needs 7 days, at least 5 logged days and 3 weigh-ins.</p>}
        </section>
      )}

      <section class="card">
        <small class="eyebrow">Last 7 days</small>
        <div class="week">
          <div class="week-row head"><span>Day</span><span>Eaten</span><span>Protein</span><span>Balance</span></div>
          {week.map((w) => (
            <div class="week-row">
              <span>{prettyDay(w.d)}</span>
              <span class={'num ' + (w.kcal > targetKcal(p) ? 'rose-t' : '')}>{w.items ? fmt(w.kcal) : '–'}</span>
              <span class={'num ' + (w.protein >= proteinFloor(p) ? 'em-t' : '')}>{w.items ? w.protein + ' g' : '–'}</span>
              <span class={'num ' + (w.items ? (w.burn - w.kcal >= 0 ? 'em-t' : 'rose-t') : '')}>{w.items ? (w.burn - w.kcal >= 0 ? '−' : '+') + fmt(Math.abs(w.burn - w.kcal)) : '–'}</span>
            </div>
          ))}
        </div>
        {avg != null && <p class="muted">Avg {fmt(avg)} kcal on {logged.length} logged days · protein floor hit {proteinHits}/{logged.length}</p>}
      </section>
    </div>
  );
}
