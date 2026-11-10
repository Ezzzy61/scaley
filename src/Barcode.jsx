// Packaged foods via Open Food Facts (open database, ODbL): barcode scan (BarcodeDetector) or search.
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon, Field } from './ui.jsx';
import { num, fmt } from './calc.js';

const OFF = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_en,brands,nutriments,serving_size,serving_quantity,image_front_small_url';

function normalise(p) {
  const n = p?.nutriments || {};
  const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] != null ? n['energy_100g'] / 4.184 : null);
  if (kcal == null) return null;
  return {
    code: String(p.code || ''), name: (p.product_name_en || p.product_name || 'Packaged food').trim(), brand: (p.brands || '').split(',')[0].trim(),
    kcal: +kcal, p: +(n.proteins_100g || 0), c: +(n.carbohydrates_100g || 0), f: +(n.fat_100g || 0),
    serving: num(p.serving_quantity), servingLabel: p.serving_size || '', img: p.image_front_small_url || '',
  };
}

export function PackagedFood({ onPick }) {
  const [code, setCode] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [results, setResults] = useState([]);
  const [item, setItem] = useState(null);
  const [grams, setGrams] = useState('');
  const [scanning, setScanning] = useState(false);
  const video = useRef(null);
  const canScan = 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

  async function lookup(c) {
    c = String(c).replace(/\D/g, '');
    if (c.length < 8) { setMsg('Enter the 8–14 digit number under the barcode.'); return; }
    setBusy('Looking up…'); setMsg(''); setResults([]);
    try {
      const r = await fetch(`${OFF}/api/v2/product/${c}.json?fields=${FIELDS}`);
      const j = await r.json();
      const it = j.status === 1 ? normalise({ ...j.product, code: c }) : null;
      if (!it) setMsg('Not in Open Food Facts yet (or no calories listed). Use Custom with the label values, or add it at openfoodfacts.org to help everyone.');
      else choose(it);
    } catch { setMsg('Could not reach Open Food Facts. Check your connection.'); }
    setBusy('');
  }
  async function search(e) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setBusy('Searching…'); setMsg(''); setItem(null);
    try {
      const u = `${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(q.trim())}&search_simple=1&action=process&json=1&page_size=24&fields=${FIELDS}&tagtype_0=countries&tag_contains_0=contains&tag_0=india`;
      const j = await (await fetch(u)).json();
      const list = (j.products || []).map(normalise).filter(Boolean);
      setResults(list);
      if (!list.length) setMsg('No matches with nutrition data. Try the brand name, e.g. "Amul protein" or "Haldiram bhujia".');
    } catch { setMsg('Search is busy (Open Food Facts limits searches). Try again in a minute, or scan the barcode.'); }
    setBusy('');
  }
  function choose(it) { setItem(it); setGrams(String(it.serving || 100)); setResults([]); }

  async function startScan() {
    setMsg(''); setScanning(true);
    let stream, stop = false;
    try {
      const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      await new Promise((r) => setTimeout(r, 50));
      const v = video.current; if (!v) throw new Error('no video');
      v.srcObject = stream; await v.play();
      const t0 = Date.now();
      while (!stop && Date.now() - t0 < 30000) {
        const codes = await det.detect(v).catch(() => []);
        if (codes[0]?.rawValue) { stop = true; setCode(codes[0].rawValue); lookup(codes[0].rawValue); break; }
        await new Promise((r) => setTimeout(r, 250));
      }
      if (!stop) setMsg('No barcode found. Hold the phone steady about 15 cm away, or type the number.');
    } catch { setMsg('Camera scanning isn\'t available here. Type the barcode number instead.'); }
    stream?.getTracks().forEach((t) => t.stop());
    setScanning(false);
  }
  useEffect(() => () => { const s = video.current?.srcObject; s?.getTracks?.().forEach((t) => t.stop()); }, []);

  const g = num(grams) || 0;
  return (
    <div class="stack">
      {item ? (
        <section class="card est">
          <div class="row">
            {item.img && <img src={item.img} alt="" width="52" height="52" style={{ objectFit: 'contain', borderRadius: '8px', background: '#fff' }} />}
            <div class="item-name"><b>{item.name}</b><small class="muted">{item.brand} · per 100 g: {fmt(item.kcal)} kcal · {fmt(item.p, 1)} g P</small></div>
          </div>
          <Field label={`How much did you have (g or ml)?${item.servingLabel ? ` · 1 serving = ${item.servingLabel}` : ''}`}>
            <input inputMode="decimal" value={grams} onInput={(e) => setGrams(e.currentTarget.value)} />
          </Field>
          <p class="num">{fmt(item.kcal * g / 100)} kcal · {fmt(item.p * g / 100, 1)} g protein · {fmt(item.c * g / 100)} g carbs · {fmt(item.f * g / 100)} g fat</p>
          <div class="row">
            <button class="btn primary" disabled={!g} onClick={() => { onPick(item, g); setItem(null); setCode(''); setMsg(`Added ${item.name}.`); }}>Add</button>
            <button class="btn ghost" onClick={() => setItem(null)}>Back</button>
          </div>
        </section>
      ) : <>
        {canScan && (scanning
          ? <div class="scan-box"><video ref={video} playsInline muted /><span>Point at the barcode…</span></div>
          : <button class="btn primary full" onClick={startScan}><Icon name="camera" size={16} /> Scan barcode</button>)}
        <form class="row" onSubmit={(e) => { e.preventDefault(); lookup(code); }}>
          <input inputMode="numeric" placeholder="Barcode number (e.g. 8901262…)" value={code} onInput={(e) => setCode(e.currentTarget.value)} />
          <button class="btn ghost">Find</button>
        </form>
        <form class="row" onSubmit={search}>
          <input type="search" placeholder="Search packaged foods in India" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
          <button class="btn ghost">Search</button>
        </form>
      </>}
      {busy && <p class="muted">{busy}</p>}
      {msg && <p class={'msg' + (/Added/.test(msg) ? '' : ' bad')}>{msg}</p>}
      {!item && results.map((r) => (
        <button class="food" onClick={() => choose(r)}>
          <div><b>{r.name}</b><small class="muted">{r.brand} · {fmt(r.kcal)} kcal · {fmt(r.p, 1)} g P per 100 g</small></div>
          <Icon name="plus" size={18} />
        </button>
      ))}
      <small class="fine">Packaged food data: Open Food Facts (ODbL). Label values can contain errors.</small>
    </div>
  );
}
