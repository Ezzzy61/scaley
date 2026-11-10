import { useEffect, useRef, useState } from 'preact/hooks';
import { supa } from './supa.js';
import { openStore, closeStore, sync, sync$, get, useStore, hasPulled, pendingCount, storeReady } from './store.js';
import { Auth } from './Auth.jsx';
import { Onboarding, ProfileForm } from './Profile.jsx';
import { Dashboard } from './Dashboard.jsx';
import { Fuel } from './Fuel.jsx';
import { Iron } from './Iron.jsx';
import { Progress } from './Progress.jsx';
import { Coach } from './Coach.jsx';
import { KEY_PROVIDERS, PUTER_MODELS, getEngine, setEngine, connectOpenRouter, finishOpenRouter, puterSignIn, engineLabel, aiState } from './ai.js';
import { Icon, Sheet } from './ui.jsx';

const TABS = [
  { key: 'home', label: 'Dashboard', icon: 'home' },
  { key: 'fuel', label: 'Fuel', icon: 'fuel' },
  { key: 'iron', label: 'Iron', icon: 'iron' },
  { key: 'coach', label: 'Coach', icon: 'chat' },
  { key: 'progress', label: 'Progress', icon: 'chart' },
];
const tabFromHash = () => (TABS.some((t) => '#' + t.key === location.hash) ? location.hash.slice(1) : 'home');

// ---------- rest timer ----------
let audioCtx = null;
function unlockAudio() {
  try { audioCtx ||= new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch {}
}
function beep() {
  try {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    [0, 0.25, 0.5].forEach((d, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = i === 2 ? 1320 : 880; o.type = 'square';
      g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(0.25, t0 + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.18);
      o.connect(g).connect(audioCtx.destination); o.start(t0 + d); o.stop(t0 + d + 0.2);
    });
  } catch {}
  try { navigator.vibrate?.([200, 100, 200, 100, 300]); } catch {}
}

function RestTimer({ timer, setTimer }) {
  const [now, setNow] = useState(Date.now());
  const fired = useRef(null);
  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer]);
  useEffect(() => {
    if (timer && now >= timer.end && fired.current !== timer.end) { fired.current = timer.end; beep(); }
  }, [now, timer]);
  if (!timer) return null;
  const left = Math.max(0, Math.ceil((timer.end - now) / 1000));
  const doneT = left === 0;
  const restart = (s) => { unlockAudio(); setTimer({ end: Date.now() + s * 1000, dur: s }); };
  return (
    <div class={'timer' + (doneT ? ' fin' : '')} role="timer" aria-live="polite">
      <div class="timer-fill" style={{ width: (doneT ? 100 : 100 - (left / timer.dur) * 100) + '%' }} />
      <Icon name="timer" size={18} />
      <b class="num">{doneT ? 'Go! Next set' : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}</b>
      <div class="timer-chips">
        {[60, 90, 150].map((s) => <button class={timer.dur === s ? 'on' : ''} onClick={() => restart(s)}>{s}s</button>)}
        <button aria-label="Dismiss timer" onClick={() => setTimer(null)}><Icon name="x" size={14} /></button>
      </div>
    </div>
  );
}

// ---------- shell ----------
function SyncDot() {
  useStore();
  const n = pendingCount();
  const s = !navigator.onLine ? 'offline' : sync$.status;
  const label = s === 'offline' ? `Offline · ${n} saved on device` : s === 'syncing' ? 'Syncing…' : s === 'error' ? 'Sync retrying' : n ? `${n} to sync` : 'Synced';
  return <span class={'sync ' + (n && s === 'synced' ? 'pending' : s)} title={sync$.error || label}><i />{label}</span>;
}

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });

function Settings({ open, onClose, p }) {
  const [, force] = useState(0);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <ProfileForm initial={p} showAdvanced submitLabel="Save profile" onSaved={onClose} />
      <hr />
      <AiSettings />
      <hr />
      <div class="stack">
        <SyncDot />
        <button class="btn ghost full" onClick={() => sync()}>Sync now</button>
        {!standalone && (deferredInstall
          ? <button class="btn ghost full" onClick={async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; force((x) => x + 1); }}>Install Scaley app</button>
          : <p class="muted">Install: on Android Chrome tap ⋮ then "Add to Home screen". On iPhone Safari tap Share then "Add to Home Screen".</p>)}
        <button class="btn danger full" onClick={async () => {
          if (pendingCount() && !navigator.onLine) { alertBox('Some logs are still only on this device. Go online and sync before signing out.'); return; }
          await sync(); await supa.auth.signOut(); closeStore(true); onClose();
        }}>Sign out</button>
        <p class="fine">Scaley v{__VERSION__}</p>
      </div>
    </Sheet>
  );
}
function AiSettings() {
  const [e, setE] = useState(getEngine);
  const [draft, setDraft] = useState({ provider: e.type === 'key' ? e.provider : 'gemini', key: '', model: e.type === 'key' ? e.model || '' : '' });
  const [msg, setMsg] = useState('');
  const save = (n) => { setEngine(n); setE(n); };
  const prov = KEY_PROVIDERS.find((x) => x.key === draft.provider) || KEY_PROVIDERS[0];
  const opt = (type, title, sub, body) => (
    <div class={'engine' + (e.type === type ? ' on' : '')}>
      <div class="engine-head"><span class="dot" /><div><b>{title}</b><small class="muted">{sub}</small></div></div>
      {body}
    </div>
  );
  return (
    <div class="stack">
      <small class="eyebrow">AI engine · now: {engineLabel(e)}</small>
      <p class="muted small">Coach, plate photos and progress reviews run on the engine you choose. Your keys stay on this device only. ChatGPT/Claude/Gemini app subscriptions can't be linked; use one of the connect options below.</p>

      {opt('free', 'Scaley Free', `Shared free AI (Gemini → Groq → OpenRouter → Grok). ${aiState.limit ? `${aiState.limit - (aiState.used || 0)} of ${aiState.limit} left today` : '30 requests a day'}.`,
        e.type !== 'free' && <button class="btn ghost sm" onClick={() => save({ type: 'free', fallback: true })}>Use Scaley Free</button>)}

      {opt('openrouter', 'Connect OpenRouter (1-click)', 'Sign in with OpenRouter. Free models give you 50 requests a day on your own account, or use any model (GPT, Claude, Gemini, Grok, Llama) with your own credit.',
        e.type === 'openrouter'
          ? <div class="row"><input value={e.model || ''} placeholder="openrouter/free" onChange={(ev) => save({ ...e, model: ev.currentTarget.value.trim() || 'openrouter/free' })} /><button class="link danger-t" onClick={() => save({ type: 'free', fallback: true })}>Disconnect</button></div>
          : <button class="btn primary sm" onClick={() => connectOpenRouter()}>Connect OpenRouter</button>)}

      {opt('puter', 'Sign in with Puter', 'Grok, GPT, Claude or Gemini through your own Puter account (user-pays, includes some free usage). Opens a Puter sign-in popup.',
        <div class="row">
          <select value={e.type === 'puter' ? e.model : PUTER_MODELS[0].id} onChange={(ev) => e.type === 'puter' && save({ ...e, model: ev.currentTarget.value })}>
            {PUTER_MODELS.map((m) => <option value={m.id}>{m.label}</option>)}
          </select>
          {e.type !== 'puter' && <button class="btn primary sm" onClick={async () => {
            setMsg('');
            try { if (await puterSignIn()) save({ type: 'puter', model: PUTER_MODELS[0].id, fallback: true }); } catch (er) { setMsg(er.message || 'Puter sign-in failed'); }
          }}>Sign in</button>}
        </div>)}

      {opt('key', 'Paste an API key', 'Free keys from Google AI Studio (Gemini) or Groq work well. Paid keys (OpenAI, Claude, Grok) also work.',
        <div class="stack">
          <select value={draft.provider} onChange={(ev) => setDraft({ ...draft, provider: ev.currentTarget.value, model: '' })}>
            {KEY_PROVIDERS.map((x) => <option value={x.key}>{x.label}</option>)}
          </select>
          <input type="password" autocomplete="off" value={draft.key} placeholder={e.type === 'key' && e.provider === draft.provider ? 'Saved on this device' : 'Paste your key'} onInput={(ev) => setDraft({ ...draft, key: ev.currentTarget.value.trim() })} />
          <input value={draft.model} placeholder={`Model (default ${prov.model})`} onInput={(ev) => setDraft({ ...draft, model: ev.currentTarget.value.trim() })} />
          <div class="row">
            <a class="link" href={prov.url} target="_blank" rel="noopener">Get a key ↗</a>
            <button class="btn ghost sm" disabled={!draft.key} onClick={() => { save({ type: 'key', provider: draft.provider, key: draft.key, model: draft.model, fallback: e.fallback !== false }); setDraft({ ...draft, key: '' }); }}>Use this key</button>
          </div>
        </div>)}

      <label class="row small"><input type="checkbox" style={{ width: '20px', minHeight: '20px' }} checked={e.fallback !== false} onChange={(ev) => save({ ...e, fallback: ev.currentTarget.checked })} /> If my engine fails or runs out, fall back to Scaley Free</label>
      {msg && <p class="msg bad">{msg}</p>}
    </div>
  );
}

function alertBox(text) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = text; document.body.appendChild(d); setTimeout(() => d.remove(), 4000); }

export function App() {
  useStore();
  const [auth, setAuth] = useState({ loading: true, uid: null });
  const [tab, setTab] = useState(tabFromHash());
  const [settings, setSettings] = useState(false);
  const [ask, setAsk] = useState(null);
  const [timer, setTimerState] = useState(() => { try { const t = JSON.parse(localStorage.getItem('scaley:timer')); return t && t.end > Date.now() - 60000 ? t : null; } catch { return null; } });
  const setTimer = (t) => { setTimerState(t); try { t ? localStorage.setItem('scaley:timer', JSON.stringify(t)) : localStorage.removeItem('scaley:timer'); } catch {} };

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    let lastUid = null;
    try { lastUid = localStorage.getItem('scaley:lastUid'); } catch {}
    supa.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id || (!navigator.onLine ? lastUid : null); // offline: keep working from device data
      if (uid) { openStore(uid); sync(); }
      setAuth({ loading: false, uid });
      if (uid) finishOpenRouter().then((ok) => { if (ok) { alertBox('OpenRouter connected. Coach now runs on your account.'); setSettings(true); } }).catch((er) => alertBox(er.message));
    }).catch(() => { if (lastUid) openStore(lastUid); setAuth({ loading: false, uid: lastUid }); });
    const { data: sub } = supa.auth.onAuthStateChange((ev, session) => {
      if (session?.user && (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION' || ev === 'TOKEN_REFRESHED')) {
        if (!storeReady()) openStore(session.user.id);
        setAuth({ loading: false, uid: session.user.id });
        sync();
      } else if (ev === 'SIGNED_OUT') {
        closeStore(false);
        setAuth({ loading: false, uid: null });
      }
    });
    return () => { window.removeEventListener('hashchange', onHash); sub.subscription.unsubscribe(); };
  }, []);

  const go = (k) => { location.hash = k === 'home' ? '' : k; setTab(k); window.scrollTo(0, 0); };

  if (auth.loading) return <div class="splash"><img src="icons/icon-192.png" width="72" height="72" alt="Scaley" /></div>;
  if (!auth.uid) return <Auth />;
  const p = get('profiles', 'me');
  if (!p) {
    if (!hasPulled() && navigator.onLine && sync$.status !== 'error') return <div class="splash"><img src="icons/icon-192.png" width="72" height="72" alt="" /><p class="muted">Loading your logs…</p></div>;
    return <Onboarding />;
  }

  const askCoach = (text) => { setAsk({ text, n: Date.now() }); go('coach'); };
  const onSetDone = () => { unlockAudio(); const s = p.rest_default || 90; setTimer({ end: Date.now() + s * 1000, dur: s }); };

  return (
    <div class="app">
      <div class="statusbar"><SyncDot /></div>
      <main>
        {tab === 'home' && <Dashboard p={p} go={go} openSettings={() => setSettings(true)} askCoach={askCoach} />}
        {tab === 'fuel' && <Fuel p={p} />}
        {tab === 'iron' && <Iron p={p} onSetDone={onSetDone} askCoach={askCoach} />}
        {tab === 'progress' && <Progress p={p} />}
        {tab === 'coach' && <Coach p={p} ask={ask} />}
      </main>
      <RestTimer timer={timer} setTimer={setTimer} />
      <nav class="tabbar">
        {TABS.map((t) => (
          <button class={tab === t.key ? 'on' : ''} onClick={() => go(t.key)} aria-current={tab === t.key ? 'page' : undefined}>
            <Icon name={t.icon} size={22} /><span>{t.label}</span>
          </button>
        ))}
      </nav>
      <Settings open={settings} onClose={() => setSettings(false)} p={p} />
    </div>
  );
}
