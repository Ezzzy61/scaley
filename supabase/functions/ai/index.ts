// Scaley AI gateway (Supabase Edge Function "ai").
// - Only signed-in users can call it (checked through the ai_take_quota RPC with the caller's JWT).
// - Shared keys: Gemini free tier first, Grok (xAI) as fallback, 30 calls/user/day.
// - Bring-your-own-key: the user's key is forwarded for that one request and never stored or logged.
// Secrets: GEMINI_API_KEY, XAI_API_KEY (optional), GEMINI_MODEL, XAI_MODEL (optional overrides).

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });

type Img = { mime: string; b64: string };
type Msg = { role: 'user' | 'assistant'; text: string; images?: Img[] };
class ProviderError extends Error { constructor(public status: number, msg: string) { super(msg); } }

const SAFETY = `Never give medical diagnoses. Never recommend eating below about 1200 kcal (women) / 1500 kcal (men) or losing more than ~1% bodyweight per week. If the user mentions disordered eating, purging, fainting, chest pain or similar, stop coaching numbers and gently suggest a doctor or professional support.`;

function catalogLines(catalog: unknown): string {
  if (!Array.isArray(catalog)) return '';
  return catalog.slice(0, 80).map((f: any) =>
    `${String(f.id).slice(0, 30)} | ${String(f.name).slice(0, 40)} | ${String(f.unit).slice(0, 30)} | ${+f.kcal} kcal | P${+f.p} C${+f.c} F${+f.f}`).join('\n');
}

function buildPrompt(body: any): { system: string; msgs: Msg[]; wantJson: boolean } {
  const imgs: Img[] = (Array.isArray(body.images) ? body.images : []).slice(0, 2)
    .filter((i: any) => typeof i?.b64 === 'string' && i.b64.length < 2_000_000 && /^image\/(jpeg|png|webp)$/.test(i.mime));
  const note = typeof body.note === 'string' ? body.note.slice(0, 500) : '';
  const ctx = body.context ? JSON.stringify(body.context).slice(0, 6000) : '{}';

  switch (body.task) {
    case 'food':
      return {
        wantJson: true,
        system: `You are Scaley's food-photo estimator for Indian meals (home, mess/tiffin, dhaba and restaurant).
Identify every distinct food item visible and estimate portions in Indian household units, using visual cues: steel thali ~28-30 cm, katori ~150 ml, restaurant plates/bowls are larger, roti ~15-18 cm, glass ~250 ml, spoon/hand size.
Prefer the closest item from this catalog (use its id, and count quantity in ITS unit). Only use id "other" if nothing in the catalog fits, and then give your own per-unit nutrition.
Catalog (id | name | unit | per-unit nutrition):
${catalogLines(body.catalog)}
Judge the cooking oil style of the meal: "air" (boiled/air-fried/dry), "home" (normal home tadka), "mess" (visibly oily), "dhaba" (restaurant gravy with oil sheen/butter/cream).
Return ONLY JSON: {"items":[{"id":"","name":"","unit":"","qty":1,"kcal":0,"protein":0,"carbs":0,"fat":0,"confidence":0.0}],"oil":"home","setting":"home|mess|restaurant|packaged","notes":"one short sentence"}
kcal/protein/carbs/fat are PER UNIT, excluding the separate added-oil style. qty can be 0.5 steps. If it is not food, return {"items":[],"notes":"No food detected"}.`,
        msgs: [{ role: 'user', text: `Meal: ${String(body.slot || '').slice(0, 20)}. ${note}`, images: imgs }],
      };
    case 'scale':
      return {
        wantJson: true,
        system: `Read the body weight shown on the bathroom scale display in the photo. If the display shows lb, convert to kg. Return ONLY JSON: {"kg": number or null, "shown": "the raw reading", "confidence": 0.0-1.0}. If no scale reading is legible return {"kg": null}.`,
        msgs: [{ role: 'user', text: 'Read this scale.', images: imgs }],
      };
    case 'physique':
      return {
        wantJson: true,
        system: `You are a supportive, honest strength coach reviewing a lifter's own progress photo(s). The first image is the newest; a second image, if present, is an earlier photo. Comment only on training-relevant visible changes (fat distribution, muscle fullness, posture), note when lighting/pose/pump differences make comparison unreliable, and connect it to the weight trend in the context. Never shame, never comment on attractiveness, never guess body-fat to a decimal. If the person appears to be a minor, or the image is not a progress photo, return {"summary":"Can't review this photo.","observations":[],"next":[]}.
${SAFETY}
Context: ${ctx}
Return ONLY JSON: {"summary":"2 sentences","observations":["..."],"next":["actionable training/nutrition step"],"bodyfat_range":"e.g. 18-22% or null"}`,
        msgs: [{ role: 'user', text: note || 'Review my progress.', images: imgs }],
      };
    default: { // chat
      const hist: Msg[] = (Array.isArray(body.messages) ? body.messages : []).slice(-16)
        .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
        .map((m: any) => ({ role: m.role, text: m.text.slice(0, 4000) }));
      if (hist.length && imgs.length && hist[hist.length - 1].role === 'user') hist[hist.length - 1].images = imgs;
      return {
        wantJson: false,
        system: `You are Scaley Coach, a personal fitness coach who feels like a desi elder sibling: warm, motivating, honest, never preachy. Your user is one specific person. Everything you say must be built on THEIR context below (city/locality, job or college, commute, check-ins, plan, logs, diet, health notes), so it never reads like a generic article.
How you coach:
- Short, practical answers (under 150 words unless they ask for a plan). End with one clear next action.
- Language: if coach_language is "hinglish", reply in natural Hinglish (Roman script, e.g. "Aaj light rakho, bhai/didi"). Use a gender-neutral address unless the profile sex makes it obvious. If "english", reply in simple Indian English with the occasional desi touch.
- Use Indian reality: katori/roti/glass units, dal-chawal, mess/tiffin/dhaba food, local train/metro commutes, small iron gyms, festivals, weddings, monsoon, heat, AQI. Mention their actual city or locality when it helps (local parks, sea-face or lake walks, metro stairs, typical commute).
- Should-I-train questions: use today's check-in (sleep, energy, stress, soreness, travel minutes) and their plan. Decide clearly between push, controlled, light zone-2 or rest, and say why in one line.
- Travel days or long commutes: suggest hotel-room, platform or office-stairs mini sessions, and protein options available on the road (railway pantry, highway dhabas, airports).
- Prefer easy-paced zone-2 cardio (conversational pace, roughly 180 minus age bpm) for fat loss on stressful weeks. Don't make exaggerated hormone claims.
- Respect their diet (veg/egg/non-veg/Jain/vegan) in every food suggestion.
- Celebrate effort and streaks genuinely. When they slip, be kind and give a reset plan, never guilt.
- When estimating calories from descriptions or photos, give about a ±10% range and say it's approximate.
- Health notes: adapt exercises conservatively, never diagnose, and tell them to follow their doctor/physio. If the profile has a heart condition or pregnancy, keep to what their doctor allows.
${SAFETY}
User context (their own data): ${ctx}`,
        msgs: hist.length ? hist : [{ role: 'user', text: 'Hi' }],
      };
    }
  }
}

async function gemini(key: string, model: string, system: string, msgs: Msg[], wantJson: boolean) {
  const contents = msgs.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [...(m.images || []).map((i) => ({ inline_data: { mime_type: i.mime, data: i.b64 } })), { text: m.text || '.' }],
  }));
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 4096, ...(wantJson ? { responseMimeType: 'application/json' } : {}) },
    }),
  });
  if (!r.ok) throw new ProviderError(r.status, `Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return (j.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
}

async function openaiLike(base: string, key: string, model: string, system: string, msgs: Msg[]) {
  const messages = [{ role: 'system', content: system }, ...msgs.map((m) => ({
    role: m.role,
    content: m.images?.length
      ? [{ type: 'text', text: m.text || '.' }, ...m.images.map((i) => ({ type: 'image_url', image_url: { url: `data:${i.mime};base64,${i.b64}` } }))]
      : (m.text || '.'),
  }))];
  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages }),
  });
  if (!r.ok) throw new ProviderError(r.status, `${base.includes('x.ai') ? 'Grok' : 'OpenAI'} ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content || '';
}

async function anthropic(key: string, model: string, system: string, msgs: Msg[]) {
  // Anthropic requires alternating roles starting with user.
  const merged: Msg[] = [];
  for (const m of msgs) {
    if (merged.length && merged[merged.length - 1].role === m.role) merged[merged.length - 1].text += '\n' + m.text;
    else merged.push({ ...m });
  }
  if (merged[0]?.role !== 'user') merged.unshift({ role: 'user', text: '.' });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model, max_tokens: 2000, system,
      messages: merged.map((m) => ({
        role: m.role,
        content: [...(m.images || []).map((i) => ({ type: 'image', source: { type: 'base64', media_type: i.mime, data: i.b64 } })), { type: 'text', text: m.text || '.' }],
      })),
    }),
  });
  if (!r.ok) throw new ProviderError(r.status, `Claude ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return (j.content || []).map((c: any) => c.text || '').join('');
}

function parseJson(text: string) {
  try { return JSON.parse(text); } catch { /* fall through */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* ignore */ } }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 5_000_000) return json({ error: 'Request too large' }, 413);
    const body = JSON.parse(raw);
    const byok = body.byok && typeof body.byok.key === 'string' && body.byok.key.length > 10 ? body.byok : null;

    // Authenticate (and count quota for shared keys) using the caller's own JWT.
    const q = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/ai_take_quota`, {
      method: 'POST',
      headers: {
        apikey: Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || req.headers.get('apikey') || '',
        Authorization: req.headers.get('Authorization') || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ p_count: !byok }),
    });
    if (!q.ok) return json({ error: 'Please sign in again.' }, 401);
    const quota = await q.json();
    if (!quota.ok) return json({ error: `You've used today's ${quota.limit} free AI requests. Add your own AI key in Settings, or try again tomorrow.` }, 429);

    const { system, msgs, wantJson } = buildPrompt(body);
    let text = '', provider = '', model = '';

    if (byok) {
      provider = String(byok.provider);
      if (provider === 'openai') { model = byok.model || 'gpt-5-mini'; text = await openaiLike('https://api.openai.com/v1', byok.key, model, system, msgs); }
      else if (provider === 'xai') { model = byok.model || 'grok-4'; text = await openaiLike('https://api.x.ai/v1', byok.key, model, system, msgs); }
      else if (provider === 'anthropic') { model = byok.model || 'claude-haiku-5-5'; text = await anthropic(byok.key, model, system, msgs); }
      else if (provider === 'gemini') { model = byok.model || 'gemini-2.5-flash'; text = await gemini(byok.key, model, system, msgs, wantJson); }
      else return json({ error: 'Unknown provider' }, 400);
    } else {
      const errors: string[] = [];
      const gKey = Deno.env.get('GEMINI_API_KEY'), xKey = Deno.env.get('XAI_API_KEY');
      if (gKey) {
        try { model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash'; text = await gemini(gKey, model, system, msgs, wantJson); provider = 'gemini'; }
        catch (e) { errors.push((e as Error).message); }
      }
      if (!provider && xKey) {
        try { model = Deno.env.get('XAI_MODEL') || 'grok-4'; text = await openaiLike('https://api.x.ai/v1', xKey, model, system, msgs); provider = 'grok'; }
        catch (e) { errors.push((e as Error).message); }
      }
      if (!provider) {
        console.error('all providers failed', errors);
        return json({ error: 'The free AI is busy or out of credits right now. Try again later, or add your own key in Settings.' }, 503);
      }
    }

    const data = wantJson ? parseJson(text) : null;
    if (wantJson && !data) return json({ error: 'The AI returned something unreadable. Try another photo.' }, 502);
    return json({ text: wantJson ? null : text, data, provider, model, used: quota.used ?? null, limit: quota.limit });
  } catch (e) {
    const status = e instanceof ProviderError ? (e.status === 401 || e.status === 403 ? 400 : 502) : 500;
    console.error(e instanceof Error ? e.message : e);
    return json({ error: e instanceof ProviderError && (e.status === 401 || e.status === 403) ? 'Your AI key was rejected. Check it in Settings.' : 'AI request failed. Try again.' }, status);
  }
});
