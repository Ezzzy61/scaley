import { useEffect, useRef, useState } from 'preact/hooks';
import { supa } from './supa.js';
import { openStore, closeStore, sync, sync$, get, useStore, hasPulled, pendingCount, storeReady } from './store.js';
import { Auth } from './Auth.jsx';
import { Onboarding, ProfileForm } from './Profile.jsx';
import { Dashboard } from './Dashboard.jsx';
import { Fuel } from './Fuel.jsx';
import { Iron } from './Iron.jsx';
import { Progress } from './Progress.jsx';
import { Icon, Sheet } from './ui.jsx';

const TABS = [
  { key: 'home', label: 'Dashboard', icon: 'home' },
  { key: 'fuel', label: 'Fuel', icon: 'fuel' },
  { key: 'iron', label: 'Iron', icon: 'iron' },
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
function alertBox(text) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = text; document.body.appendChild(d); setTimeout(() => d.remove(), 4000); }

export function App() {
  useStore();
  const [auth, setAuth] = useState({ loading: true, uid: null });
  const [tab, setTab] = useState(tabFromHash());
  const [settings, setSettings] = useState(false);
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

  const onSetDone = () => { unlockAudio(); const s = p.rest_default || 90; setTimer({ end: Date.now() + s * 1000, dur: s }); };

  return (
    <div class="app">
      <div class="statusbar"><SyncDot /></div>
      <main>
        {tab === 'home' && <Dashboard p={p} go={go} openSettings={() => setSettings(true)} />}
        {tab === 'fuel' && <Fuel p={p} />}
        {tab === 'iron' && <Iron p={p} onSetDone={onSetDone} />}
        {tab === 'progress' && <Progress p={p} />}
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
