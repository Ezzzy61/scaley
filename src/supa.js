import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Never let a dead basement connection hang a request forever.
const fetchWithTimeout = (url, opts = {}) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  opts.signal?.addEventListener?.('abort', () => ctrl.abort());
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
};

export const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: fetchWithTimeout },
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'scaley-auth' },
});
