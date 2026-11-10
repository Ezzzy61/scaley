import { useEffect, useRef, useState } from 'preact/hooks';
import { put, remove, rows, newId, useStore } from './store.js';
import { today } from './calc.js';
import { callAI, shrinkImage, coachContext, aiState, getByok } from './ai.js';
import { Icon } from './ui.jsx';

const STARTERS = [
  'Long day, 2 hours of travel and I\'m drained. Should I train today?',
  'Plan my dinner to hit protein with what\'s left today',
  'I ate 2 aloo parathas with butter at a dhaba, how much is that?',
  'Build me a week that fits my office/college hours',
  'Is my weight trend on track for my goal?',
];

export function Coach({ p, ask }) {
  useStore();
  const msgs = rows('coach_messages').sort((a, b) => (a.updated_at < b.updated_at ? -1 : 1)).slice(-60);
  const [text, setText] = useState('');
  const [img, setImg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length, busy]);
  const asked = useRef(null);
  useEffect(() => { if (ask && asked.current !== ask.n) { asked.current = ask.n; send(ask.text); } }, [ask?.n]);

  async function send(q) {
    const content = (q ?? text).trim();
    if ((!content && !img) || busy) return;
    setErr(''); setBusy(true);
    const userMsg = put('coach_messages', { id: newId(), day: today(), role: 'user', content: (img ? '📷 ' : '') + (content || 'What do you see?') });
    setText('');
    try {
      const history = [...msgs, userMsg].slice(-16).map((m) => ({ role: m.role, text: m.content }));
      const out = await callAI('chat', { messages: history, context: coachContext(p), images: img ? [{ mime: img.mime, b64: img.b64 }] : [] });
      put('coach_messages', { id: newId(), day: today(), role: 'assistant', content: (out.text || '…').slice(0, 7900) });
      setImg(null);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const byok = getByok();
  return (
    <div class="page coach">
      <header class="top">
        <div><h1 class="h1">Coach</h1><small class="muted">{byok?.key ? `Using your ${byok.provider} key` : `Free AI${aiState.limit ? ` · ${aiState.limit - (aiState.used || 0)} left today` : ''}`}</small></div>
        {msgs.length > 0 && <button class="link" onClick={() => msgs.forEach((m) => remove('coach_messages', m.id))}>Clear</button>}
      </header>

      {!msgs.length && (
        <div class="stack">
          <p class="muted">Tell Coach about your day like you'd tell a friend: travel, exhaustion, cravings, skipped meals. It sees your logs, check-ins, city and plan, and answers for you specifically. Calorie answers are approximate (±10%).</p>
          {STARTERS.map((s) => <button class="card row-btn starter" onClick={() => send(s)}><span>{s}</span><Icon name="right" size={16} /></button>)}
        </div>
      )}

      <div class="chat">
        {msgs.map((m) => <div class={'bubble ' + m.role}>{m.content}</div>)}
        {busy && <div class="bubble assistant typing"><i /><i /><i /></div>}
        <div ref={end} />
      </div>
      {err && <p class="msg bad">{err}</p>}

      <div class="composer">
        {img && <div class="att"><img src={img.dataUrl} alt="" /><button aria-label="Remove photo" onClick={() => setImg(null)}><Icon name="x" size={14} /></button></div>}
        <div class="row">
          <label class="icon-btn" aria-label="Attach photo">
            <Icon name="image" />
            <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.currentTarget.files?.[0]; if (f) setImg(await shrinkImage(f)); e.currentTarget.value = ''; }} />
          </label>
          <textarea rows={1} value={text} maxLength={2000} placeholder="Ask Coach…" onInput={(e) => setText(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button class="icon-btn send" disabled={busy || (!text.trim() && !img)} onClick={() => send()} aria-label="Send"><Icon name="send" /></button>
        </div>
      </div>
    </div>
  );
}
