import { useState } from 'preact/hooks';
import { supa } from './supa.js';
import { Field } from './ui.jsx';

export function Auth() {
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!navigator.onLine) return setMsg({ bad: true, text: 'You are offline. Connect once to sign in. After that Scaley works offline.' });
    if (pw.length < 8) return setMsg({ bad: true, text: 'Password needs at least 8 characters.' });
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supa.auth.signUp({ email: email.trim(), password: pw, options: { emailRedirectTo: location.origin + location.pathname } });
        if (error) throw error;
        if (!data.session) setMsg({ text: 'Account created. Check your inbox to confirm your email, then sign in.' });
      } else {
        const { error } = await supa.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) throw error;
      }
    } catch (err) {
      setMsg({ bad: true, text: err.message || 'Something went wrong' });
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider) {
    setMsg(null);
    if (!navigator.onLine) return setMsg({ bad: true, text: 'You are offline.' });
    const { error } = await supa.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.pathname } });
    if (error) setMsg({ bad: true, text: error.message });
  }

  async function reset() {
    if (!email) return setMsg({ bad: true, text: 'Enter your email first.' });
    const { error } = await supa.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + location.pathname });
    setMsg(error ? { bad: true, text: error.message } : { text: 'Password reset link sent if that email has an account.' });
  }

  return (
    <div class="auth">
      <div class="brand">
        <img src="icons/icon-192.png" width="64" height="64" alt="" />
        <h1>Scaley</h1>
        <p>No scale. No BS. Just katoris, rotis and raw iron.</p>
      </div>
      <form class="card" onSubmit={submit}>
        <div class="oauth">
          <button type="button" class="btn oauth-btn full" onClick={() => oauth('google')}>Continue with Google</button>
          <button type="button" class="btn oauth-btn gh full" onClick={() => oauth('github')}>Continue with GitHub</button>
        </div>
        <div class="or">or use email</div>
        <div class="seg">
          <button type="button" class={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Create account</button>
          <button type="button" class={mode === 'signin' ? 'on' : ''} onClick={() => setMode('signin')}>Sign in</button>
        </div>
        <Field label="Email">
          <input type="email" autocomplete="email" required value={email} onInput={(e) => setEmail(e.currentTarget.value)} />
        </Field>
        <Field label="Password">
          <input type="password" autocomplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={8}
            value={pw} onInput={(e) => setPw(e.currentTarget.value)} />
        </Field>
        {msg && <p class={msg.bad ? 'msg bad' : 'msg'}>{msg.text}</p>}
        <button class="btn primary full" disabled={busy}>{busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
        {mode === 'signin' && <button type="button" class="link" onClick={reset}>Forgot password?</button>}
      </form>
      <p class="fine">100% free. Your logs are private to your account and sync across devices.</p>
    </div>
  );
}
