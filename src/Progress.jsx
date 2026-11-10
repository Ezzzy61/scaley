import { useEffect, useState } from 'preact/hooks';
import { get, put, remove, rows, newId, useStore } from './store.js';
import { supa } from './supa.js';
import { callAI, shrinkImage, coachContext } from './ai.js';
import { weightSeries, stallCheck, diagnostic, goalOf, today, addDays, prettyDay, fmt, num, dayIntake, dayBurn, targetKcal, proteinFloor, daysBetween } from './calc.js';
import { GOALS } from './data.js';
import { Icon, Field, Seg } from './ui.jsx';

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
  const [scaleMsg, setScaleMsg] = useState('');
  async function readScale(e) {
    const f = e.currentTarget.files?.[0]; e.currentTarget.value = '';
    if (!f) return;
    setScaleMsg('Reading the scale…');
    try {
      const img = await shrinkImage(f, 900);
      const out = await callAI('scale', { images: [{ mime: img.mime, b64: img.b64 }] });
      const v = Number(out.data?.kg);
      if (v >= 25 && v <= 300) { setKg(String(Math.round(v * 10) / 10)); setScaleMsg(`Read ${out.data?.shown || v + ' kg'}. Check it, then Save.`); }
      else setScaleMsg("Couldn't read the display. Try a sharper, straight-on photo.");
    } catch (err) { setScaleMsg(err.message); }
  }
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
        <label class="btn ghost full"><Icon name="camera" size={16} /> Read weight from a scale photo
          <input type="file" accept="image/*" capture="environment" hidden onChange={readScale} />
        </label>
        {scaleMsg && <small class="muted">{scaleMsg}</small>}
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

      <ProgressPhotos p={p} />

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

function ProgressPhotos({ p }) {
  useStore();
  const photos = rows('progress_photos').sort((a, b) => b.day.localeCompare(a.day) || (b.updated_at > a.updated_at ? 1 : -1));
  const [urls, setUrls] = useState({});
  const [kind, setKind] = useState('front');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);
  const key = photos.map((x) => x.path).join('|');

  useEffect(() => {
    const need = photos.map((x) => x.path).filter((pth) => !urls[pth]);
    if (!need.length || !navigator.onLine) return;
    supa.storage.from('progress').createSignedUrls(need, 3600).then(({ data }) => {
      if (data) setUrls((u) => { const n = { ...u }; data.forEach((d) => { if (d.signedUrl) n[d.path] = d.signedUrl; }); return n; });
    });
  }, [key]);

  async function upload(e) {
    const f = e.currentTarget.files?.[0]; e.currentTarget.value = '';
    if (!f) return;
    if (!navigator.onLine) { setErr('Connect to the internet to upload photos.'); return; }
    setErr(''); setBusy('Uploading…');
    try {
      const img = await shrinkImage(f, 1280, 0.85);
      const { data: { session } } = await supa.auth.getSession();
      const id = newId(), day = today();
      const path = `${session.user.id}/${day}-${id}.jpg`;
      const { error } = await supa.storage.from('progress').upload(path, img.blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      const latestW = rows('weigh_ins').sort((a, b) => b.day.localeCompare(a.day))[0];
      put('progress_photos', { id, day, path, kind, kg: latestW?.kg ?? null });
      setUrls((u) => ({ ...u, [path]: img.dataUrl }));
    } catch (er) { setErr(er.message || 'Upload failed'); }
    finally { setBusy(''); }
  }

  async function analyze(ph) {
    setErr(''); setBusy('Coach is looking…');
    try {
      const toImg = async (pth) => {
        const { data, error } = await supa.storage.from('progress').download(pth);
        if (error) throw error;
        return shrinkImage(data, 896, 0.8);
      };
      const prev = photos.find((x) => x.kind === ph.kind && x.day < ph.day && daysBetween(x.day, ph.day) >= 7);
      const imgs = [await toImg(ph.path)];
      if (prev) imgs.push(await toImg(prev.path));
      const out = await callAI('physique', { images: imgs.map((i) => ({ mime: i.mime, b64: i.b64 })), context: { ...coachContext(p), photoDay: ph.day, comparedWith: prev?.day || null } });
      const d = out.data || {};
      const note = [d.summary, ...(d.observations || []).map((o) => '• ' + o), ...(d.next || []).map((o) => '→ ' + o), d.bodyfat_range ? `Rough body-fat range: ${d.bodyfat_range} (visual guess)` : ''].filter(Boolean).join('\n');
      put('progress_photos', { id: ph.id, ai_note: note.slice(0, 5900) });
    } catch (er) { setErr(er.message); }
    finally { setBusy(''); }
  }

  const cur = open && photos.find((x) => x.id === open);
  return (
    <section class="card">
      <small class="eyebrow">Progress photos · private to you</small>
      <div class="row">
        <Seg small value={kind} onChange={setKind} options={[{ value: 'front', label: 'Front' }, { value: 'side', label: 'Side' }, { value: 'back', label: 'Back' }]} />
        <label class="btn primary"><Icon name="camera" size={16} /> Add
          <input type="file" accept="image/*" hidden onChange={upload} />
        </label>
      </div>
      {busy && <small class="muted">{busy}</small>}
      {err && <p class="msg bad">{err}</p>}
      {!photos.length && <p class="muted">Same spot, same light, every 1–2 weeks. Coach compares each photo with one from at least a week earlier.</p>}
      <div class="ph-grid">
        {photos.slice(0, 12).map((x) => (
          <button class={'ph' + (open === x.id ? ' on' : '')} onClick={() => setOpen(open === x.id ? null : x.id)}>
            {urls[x.path] ? <img src={urls[x.path]} alt={`${x.kind} ${x.day}`} loading="lazy" /> : <span class="muted">…</span>}
            <small>{prettyDay(x.day)}{x.kg ? ` · ${fmt(x.kg, 1)}` : ''}</small>
          </button>
        ))}
      </div>
      {cur && (
        <div class="stack">
          {cur.ai_note ? <p class="ai-note">{cur.ai_note}</p> : <p class="muted">No review yet.</p>}
          <div class="row">
            <button class="btn ghost" disabled={!!busy} onClick={() => analyze(cur)}><Icon name="spark" size={16} /> {cur.ai_note ? 'Review again' : 'Get Coach review'}</button>
            <button class="link danger-t" onClick={async () => { await supa.storage.from('progress').remove([cur.path]); remove('progress_photos', cur.id); setOpen(null); }}>Delete</button>
          </div>
        </div>
      )}
    </section>
  );
}
