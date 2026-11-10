// Local-first store. Every write lands in localStorage immediately (so nothing is lost in a
// basement gym with no signal), is queued in an outbox, and is pushed to Supabase when online.
// Pulls are incremental on the server-assigned synced_at column. Conflicts: last write wins
// by updated_at, and a local row with unpushed changes is never overwritten by an older remote row.
import { useEffect, useState } from 'preact/hooks';
import { supa } from './supa.js';

export const TABLES = ['profiles', 'meals', 'food_entries', 'workouts', 'workout_sets', 'weigh_ins', 'day_logs', 'progress_photos', 'coach_messages', 'checkins', 'activities', 'workout_templates'];
const COMMON = ['user_id', 'id', 'updated_at', 'deleted'];
const COLS = {
  profiles: ['sex', 'age', 'height_cm', 'weight_kg', 'target_kg', 'goal', 'step_goal', 'plan_workout_kcal', 'rest_default', 'tdee', 'started_on',
    'state', 'city', 'locality', 'occupation', 'experience', 'conditions', 'coach_lang', 'plan_id', 'diet', 'theme', 'accent_mode', 'motivation'],
  meals: ['day', 'slot', 'oil'],
  food_entries: ['day', 'meal_id', 'item', 'name', 'unit', 'qty', 'kcal', 'protein', 'carbs', 'fat', 'source'],
  workouts: ['day', 'split', 'started_at', 'finished', 'exercises'],
  workout_sets: ['workout_id', 'day', 'exercise', 'idx', 'kg', 'reps', 'done'],
  weigh_ins: ['day', 'kg'],
  day_logs: ['day', 'steps', 'workout_kcal'],
  progress_photos: ['day', 'path', 'kind', 'note', 'ai_note', 'kg'],
  coach_messages: ['day', 'role', 'content'],
  checkins: ['day', 'sleep_h', 'sleep_q', 'energy', 'stress', 'soreness', 'sick', 'note', 'score'],
  activities: ['day', 'type', 'label', 'minutes', 'met', 'kcal'],
  workout_templates: ['name', 'exercises'],
};

let S = null;
const subs = new Set();
let version = 0;
export const sync$ = { status: 'idle', at: null, error: null };

const lsKey = (uid) => 'scaley:v1:' + uid;

export function openStore(uid) {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(lsKey(uid))); } catch {}
  S = raw && raw.uid === uid ? raw : { uid, data: {}, outbox: {}, cursor: {}, pulled: false };
  for (const t of TABLES) S.data[t] ||= {};
  try { localStorage.setItem('scaley:lastUid', uid); } catch {}
  emit();
}
export function closeStore(wipe) {
  if (S && wipe) { try { localStorage.removeItem(lsKey(S.uid)); localStorage.removeItem('scaley:lastUid'); } catch {} }
  S = null; emit();
}
export const storeReady = () => !!S;
export const hasPulled = () => !!S?.pulled;
export const pendingCount = () => (S ? Object.keys(S.outbox).length : 0);

function persist() {
  try { localStorage.setItem(lsKey(S.uid), JSON.stringify(S)); } catch (e) { console.warn('persist failed', e); }
}
function emit() { version++; subs.forEach((f) => f(version)); }
export function useStore() {
  const [, set] = useState(0);
  useEffect(() => { subs.add(set); return () => subs.delete(set); }, []);
  return version;
}

export const rows = (t) => (S ? Object.values(S.data[t]).filter((r) => !r.deleted) : []);
export const get = (t, id) => { const r = S?.data[t]?.[id]; return r && !r.deleted ? r : null; };

export function put(t, row) {
  if (!S) return null;
  const prev = S.data[t][row.id] || {};
  const r = { ...prev, ...row, user_id: S.uid, updated_at: new Date().toISOString() };
  if (r.deleted === undefined) r.deleted = false;
  S.data[t][r.id] = r;
  S.outbox[t + '|' + r.id] = 1;
  persist(); emit(); scheduleSync();
  return r;
}
export function remove(t, id) { if (S?.data[t]?.[id]) put(t, { id, deleted: true }); }

export const newId = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));

function setStatus(status, error = null) {
  sync$.status = status; sync$.error = error;
  if (status === 'synced') sync$.at = new Date();
  emit();
}

let timer = null;
export function scheduleSync(ms = 1200) { clearTimeout(timer); timer = setTimeout(sync, ms); }

let running = false;
export async function sync() {
  if (!S || running) return;
  if (!navigator.onLine) { setStatus('offline'); return; }
  running = true; setStatus('syncing');
  const uid = S.uid;
  try {
    const { data: { session } } = await Promise.race([
      supa.auth.getSession(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Auth check timed out')), 10000)),
    ]);
    if (!session || session.user.id !== uid) throw new Error('Not signed in');

    // Push queued writes.
    const byTable = {};
    for (const k of Object.keys(S.outbox)) { const i = k.indexOf('|'); (byTable[k.slice(0, i)] ||= []).push(k.slice(i + 1)); }
    for (const t of TABLES) {
      const ids = byTable[t]; if (!ids) continue;
      const payload = ids.map((id) => S.data[t][id]).filter(Boolean).map((r) => {
        const o = {}; for (const c of [...COMMON, ...COLS[t]]) if (r[c] !== undefined) o[c] = r[c]; return o;
      });
      for (let i = 0; i < payload.length; i += 200) {
        const chunk = payload.slice(i, i + 200);
        const { error } = await supa.from(t).upsert(chunk, { onConflict: 'user_id,id' });
        if (error) throw error;
        if (!S || S.uid !== uid) return;
        for (const r of chunk) if (S.data[t][r.id]?.updated_at === r.updated_at) delete S.outbox[t + '|' + r.id];
      }
    }

    // Pull everything changed since our last cursor.
    for (const t of TABLES) {
      for (let page = 0; page < 50; page++) {
        let q = supa.from(t).select('*').order('synced_at', { ascending: true }).limit(1000);
        if (S.cursor[t]) q = q.gte('synced_at', S.cursor[t]);
        const { data, error } = await q;
        if (error) throw error;
        if (!S || S.uid !== uid) return;
        for (const r of data) {
          const local = S.data[t][r.id];
          const pending = S.outbox[t + '|' + r.id];
          const remoteNewer = !local || Date.parse(r.updated_at) >= Date.parse(local.updated_at);
          if (!pending || remoteNewer) {
            S.data[t][r.id] = r;
            if (pending) delete S.outbox[t + '|' + r.id];
          }
        }
        const prevCursor = S.cursor[t];
        if (data.length) S.cursor[t] = data[data.length - 1].synced_at;
        if (data.length < 1000 || S.cursor[t] === prevCursor) break;
      }
    }
    S.pulled = true;
    persist();
    setStatus(Object.keys(S.outbox).length ? 'pending' : 'synced');
    if (Object.keys(S.outbox).length) scheduleSync(3000);
  } catch (e) {
    console.warn('sync failed', e);
    setStatus(navigator.onLine ? 'error' : 'offline', e.message || String(e));
    scheduleSync(8000);
  } finally {
    running = false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => scheduleSync(300));
  window.addEventListener('offline', () => setStatus('offline'));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleSync(300); });
  setInterval(() => { if (S && document.visibilityState === 'visible') sync(); }, 60000);
}
