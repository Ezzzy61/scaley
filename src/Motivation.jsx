import { useState } from 'preact/hooks';
import { put } from './store.js';
import { ARCHETYPES, archOf, quoteOfDay, linesFor, parseMusic, VIBES, vibeLinks } from './motivation.js';
import { GOAL_ACCENT, applyTheme } from './theme.js';
import { callAI, coachContext } from './ai.js';
import { Icon, Sheet, Field, Seg } from './ui.jsx';

const saveM = (p, patch) => put('profiles', { id: 'me', motivation: { ...(p.motivation || {}), ...patch } });

// ---------- homescreen hero card ----------
export function MotivationCard({ p, onEdit }) {
  const m = p.motivation || {};
  const [off, setOff] = useState(0);
  const [hype, setHype] = useState('');
  const [busy, setBusy] = useState(false);
  if (!m.arch) {
    return (
      <button class="card motive-cta" onClick={onEdit}>
        <span class="motive-emoji">🔥</span>
        <div><b>Who drives you?</b><small class="muted">A boxer, a pehlwan, an anime arc, your faith or your family. Scaley's look, daily lines and coach tone follow it.</small></div>
        <Icon name="right" size={18} />
      </button>
    );
  }
  const a = archOf(m.arch);
  const line = hype || quoteOfDay(m, off);
  async function hypeMe() {
    setBusy(true);
    try {
      const out = await callAI('chat', {
        messages: [{ role: 'user', content: `Give me ONE short original motivational line (max 20 words) for today, in the spirit of ${a.label}${m.hero ? ` / ${m.hero}` : ''}${m.why ? `. My why: ${m.why}` : ''}. Use my coach language. No quotes from real people, films or songs. Reply with the line only.` }],
        context: coachContext(p),
      });
      setHype(String(out.text || '').replace(/^["“]|["”]$/g, '').trim().slice(0, 200));
    } catch (e) { setHype(''); }
    setBusy(false);
  }
  return (
    <section class="card motive">
      <div class="row between">
        <small class="eyebrow">{a.emoji} {m.hero || a.label}</small>
        <button class="icon-btn sm" aria-label="Edit motivation" onClick={onEdit}><Icon name="gear" size={15} /></button>
      </div>
      <p class="quote">{line}</p>
      {m.why && <small class="muted">Your why: {m.why}</small>}
      <div class="row">
        <button class="chip" onClick={() => { setHype(''); setOff((o) => (o + 1) % Math.max(1, linesFor(m).length)); }}>Another</button>
        <button class="chip" disabled={busy} onClick={hypeMe}><Icon name="spark" size={13} /> {busy ? 'Thinking…' : 'Hype me'}</button>
      </div>
    </section>
  );
}

// ---------- music ----------
export function MusicCard({ p, onEdit }) {
  const list = (p.motivation?.music || []).map((x) => ({ ...x, info: parseMusic(x.url) })).filter((x) => x.info);
  const [i, setI] = useState(0);
  const [vibe, setVibe] = useState(null);
  const cur = list[i] || list[0];
  return (
    <section class="card music">
      <div class="row between"><small class="eyebrow"><Icon name="music" size={13} /> Workout music</small><button class="link" onClick={onEdit}>{list.length ? 'Edit' : 'Add links'}</button></div>
      {list.length > 1 && <div class="chips">{list.map((x, k) => <button class={'chip' + (k === i ? ' on' : '')} onClick={() => setI(k)}>{x.label || x.info.label}</button>)}</div>}
      {cur?.info.embed
        ? <iframe class="embed" title={cur.label || cur.info.label} src={cur.info.embed} height={cur.info.height} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" />
        : cur ? <a class="btn primary full" href={cur.url} target="_blank" rel="noopener">Open {cur.label || cur.info.label} ↗</a>
        : <p class="muted small">Paste your SoundCloud, Spotify, YouTube, JioSaavn or any playlist link. Or pick a vibe:</p>}
      <div class="chips">{VIBES.map((v) => <button class={'chip' + (vibe === v.key ? ' on' : '')} onClick={() => setVibe(vibe === v.key ? null : v.key)}>{v.label}</button>)}</div>
      {vibe && <div class="row">{vibeLinks(VIBES.find((v) => v.key === vibe).q).map((l) => <a class="btn ghost sm" href={l.url} target="_blank" rel="noopener">{l.label} ↗</a>)}</div>}
    </section>
  );
}

// ---------- editor ----------
export function MotivationSheet({ open, onClose, p }) {
  const m = p.motivation || {};
  const [arch, setArch] = useState(m.arch || '');
  const [hero, setHero] = useState(m.hero || '');
  const [why, setWhy] = useState(m.why || '');
  const [mantras, setMantras] = useState((m.mantras || []).join('\n'));
  const [music, setMusic] = useState(m.music || []);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [err, setErr] = useState('');
  const [accent, setAccent] = useState(p.accent_mode || 'goal');
  if (!open) return null;

  function addLink(e) {
    e.preventDefault();
    const info = parseMusic(url);
    if (!info) { setErr('That doesn\'t look like a link. Copy it from the app\'s Share button.'); return; }
    if (music.length >= 8) { setErr('Up to 8 links.'); return; }
    setMusic([...music, { url: url.trim().slice(0, 400), label: label.trim().slice(0, 30) || info.label }]); setUrl(''); setLabel(''); setErr('');
  }
  function save() {
    const next = { arch: arch || null, hero: hero.trim().slice(0, 60), why: why.trim().slice(0, 200),
      mantras: mantras.split('\n').map((x) => x.trim().slice(0, 160)).filter(Boolean).slice(0, 6), music };
    put('profiles', { id: 'me', motivation: next, accent_mode: accent });
    applyTheme({ ...p, motivation: next, accent_mode: accent });
    onClose();
  }
  return (
    <Sheet open={open} onClose={onClose} title="Your motivation">
      <div class="stack">
        <p class="muted small">Pick what fires you up. It changes Scaley's colours and fonts, your daily lines and how the coach talks to you.</p>
        <div class="arch-grid">
          {ARCHETYPES.map((a) => (
            <button class={'arch' + (arch === a.key ? ' on' : '')} style={{ '--a': a.color }} onClick={() => setArch(a.key)}>
              <span>{a.emoji}</span><b>{a.label}</b><small>{a.hint}</small>
            </button>
          ))}
        </div>
        <Field label="Your hero or role model (optional)" hint="A boxer, a fictional character, a god or guru, your dad… Used only in your own lines."><input value={hero} maxLength={60} placeholder="e.g. Hanuman, my daughter, a champion boxer" onInput={(e) => setHero(e.currentTarget.value)} /></Field>
        <Field label="Your why"><input value={why} maxLength={200} placeholder="e.g. Run with my kids without getting breathless" onInput={(e) => setWhy(e.currentTarget.value)} /></Field>
        <Field label="Your own mantras, verses or lines (one per line)" hint="Your favourite shloka, prayer, dua or personal motto. Shown on your homescreen.">
          <textarea class="ta" rows={3} value={mantras} onInput={(e) => setMantras(e.currentTarget.value)} placeholder={'Har din, thoda behtar.\nNo zero days.'} />
        </Field>
        <small class="eyebrow">App colour</small>
        <Seg value={accent} onChange={setAccent} options={[{ value: 'goal', label: 'Match my goal', sub: 'cut = orange/green, bulk = amber…' }, { value: 'motivation', label: 'Match my motivation', sub: arch ? archOf(arch).label : 'pick one above' }]} />
        <small class="eyebrow">Workout music</small>
        {music.map((x, k) => (
          <div class="item"><div class="item-name"><b>{x.label}</b><small class="muted">{x.url.slice(0, 60)}</small></div>
            <button class="icon-btn sm" aria-label={`Remove ${x.label}`} onClick={() => setMusic(music.filter((_, j) => j !== k))}><Icon name="trash" size={15} /></button></div>
        ))}
        <form class="stack" onSubmit={addLink}>
          <input type="url" inputMode="url" placeholder="Paste a SoundCloud / Spotify / YouTube / any link" value={url} onInput={(e) => setUrl(e.currentTarget.value)} />
          <div class="row"><input placeholder="Name (e.g. Leg day phonk)" maxLength={30} value={label} onInput={(e) => setLabel(e.currentTarget.value)} /><button class="btn ghost">Add</button></div>
        </form>
        {err && <p class="msg bad">{err}</p>}
        <button class="btn primary full" onClick={save}>Save</button>
      </div>
    </Sheet>
  );
}

// ---------- appearance (in Settings) ----------
export function Appearance({ p }) {
  const set = (patch) => { put('profiles', { id: 'me', ...patch }); applyTheme({ ...p, ...patch }); };
  return (
    <div class="stack">
      <small class="eyebrow">Appearance</small>
      <Seg value={p.theme || 'system'} onChange={(v) => set({ theme: v })} options={[{ value: 'system', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
      <Seg value={p.accent_mode || 'goal'} onChange={(v) => set({ accent_mode: v })} options={[{ value: 'goal', label: 'Goal colour' }, { value: 'motivation', label: 'Motivation colour' }]} />
      <div class="swatches">{Object.entries(GOAL_ACCENT).map(([k, c]) => <span title={k} style={{ background: c, outline: p.goal === k ? '2px solid var(--tx)' : 'none' }} />)}</div>
      <small class="muted">Goal colours: Aggressive Cut orange · Moderate Cut emerald · Recomp teal · Lean Bulk amber · Strength indigo · Diagnostic sky.</small>
    </div>
  );
}
