'use strict';
// ---------------------------------------------------------------- Vorlesen
// Zwei Stimmen: die Stimme des Geraets (Web Speech API) und „Thorsten“
// (Piper, rechnet mit ONNX Runtime in einem Hintergrund-Thread; Modell einmalig ca. 63 MB).
const TTS = {};
(function () {
  const VOICE_ID = 'de_DE-thorsten-medium';
  const MODEL_URLS = [
    'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx',
    'https://huggingface.co/diffusionstudio/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx',
  ];
  const CACHE = 'odun-stimmen-v1';
  const hasWeb = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  let queue = [], gen = 0, busy = false, curEl = null, unlocked = false, lastCancel = 0;
  const state = { speaking: false };
  const set = () => UI.settings();
  const rateNow = () => clamp(set().ttsRate || 1, 0.6, 1.6);

  // ---------------- Text fuer die Stimme aufbereiten
  const ABBR = [[/\bLeP\b/g, 'Lebenspunkte'], [/\bAuP\b/g, 'Ausdauerpunkte'], [/\bAsP\b/g, 'Astralpunkte'], [/\bSP\b/g, 'Schadenspunkte'],
    [/\bTP\b/g, 'Trefferpunkte'], [/\bAP\b/g, 'Abenteuerpunkte'], [/\bINI\b/g, 'Initiative'], [/\bAT\b/g, 'Attacke'], [/\bPA\b/g, 'Parade'],
    [/\bRS\b/g, 'Rüstungsschutz'], [/\bMU\b/g, 'Mut'], [/\bKL\b/g, 'Klugheit'], [/\bKO\b/g, 'Konstitution'], [/\bKK\b/g, 'Körperkraft'],
    [/\bGE\b/g, 'Gewandtheit'], [/\bCH\b/g, 'Charisma'], [/\bFF\b/g, 'Fingerfertigkeit'],
    [/(\d)W6/g, '$1 W sechs'], [/(\d)W20/g, '$1 W zwanzig'], [/\bW6\b/g, 'W sechs'], [/\bW20\b/g, 'W zwanzig'],
    [/Odûn/g, 'Odun'], [/û/g, 'u'], [/–|—/g, ', '], [/…/g, '. ']];
  function speakable(t) {
    let s = String(t || '');
    for (const [re, rep] of ABBR) s = s.replace(re, rep);
    // Schluesselwoerter in Grossbuchstaben normal sprechen
    s = s.replace(/\b([A-ZÄÖÜ]{2,})(-[A-ZÄÖÜ]{2,})?\b/g, w => w.split('-').map(x => x[0] + x.slice(1).toLowerCase()).join('-'));
    s = s.replace(/(\w)\+(\d)/g, '$1 plus $2').replace(/[„“”»«"]/g, '').replace(/\s+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1').replace(/([,.;:!?])\1+/g, '$1').trim();
    return s;
  }
  // in Stuecke teilen, damit lange Absaetze nicht abreissen
  function chunks(text, max) {
    const out = []; let cur = '';
    const parts = text.match(/[^.!?;:]+[.!?;:]*\s*/g) || [text];
    for (const p of parts) {
      if ((cur + p).length > max && cur) { out.push(cur.trim()); cur = ''; }
      if (p.length > max) {
        for (const w of p.split(/\s+/)) { if ((cur + ' ' + w).length > max && cur) { out.push(cur.trim()); cur = ''; } cur += (cur ? ' ' : '') + w; }
      } else cur += p;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  // ---------------- Stimme des Geraets
  function webVoices() { return hasWeb ? speechSynthesis.getVoices().filter(v => /^de(-|_|$)/i.test(v.lang)) : []; }
  function bestWebVoice() {
    const list = webVoices(); if (!list.length) return null;
    const want = set().ttsVoice;
    const chosen = want && list.find(v => v.voiceURI === want); if (chosen) return chosen;
    const score = v => (/premium|enhanced|erweitert|natural|neural/i.test(v.name + v.voiceURI) ? 50 : 0) + (/google/i.test(v.name) ? 30 : 0) +
      (/microsoft/i.test(v.name) && /online/i.test(v.name) ? 28 : 0) + (/anna|helena|markus|yannick|petra|katja|conrad|martin|viktor/i.test(v.name) ? 12 : 0) +
      (/de-DE/i.test(v.lang) ? 5 : 0) + (v.localService ? 2 : 0);
    return list.slice().sort((a, b) => score(b) - score(a))[0];
  }
  function webSay(text, my) {
    return new Promise(res => {
      if (!hasWeb || my !== gen) return res(false);
      const u = new SpeechSynthesisUtterance(text);
      const v = bestWebVoice(); if (v) { try { u.voice = v; } catch (e) { } }
      u.lang = (v && v.lang) || 'de-DE';
      u.rate = rateNow();
      TTS._u = u; // Safari vergisst sonst manchmal das Ende
      let done = false;
      const fin = ok => { if (!done) { done = true; clearTimeout(guard); res(ok); } };
      u.onend = () => fin(true); u.onerror = () => fin(false);
      // Schutz, falls ein Browser das Ende verschluckt
      const guard = setTimeout(() => fin(true), (4000 + text.length * 120) / u.rate);
      const go = () => { if (my !== gen) return fin(false); try { speechSynthesis.speak(u); } catch (e) { fin(false); } };
      // direkt nach einem Abbruch verschlucken manche Browser den naechsten Satz
      const wait = lastCancel + 150 - Date.now();
      if (wait > 0) setTimeout(go, wait); else go();
    });
  }
  if (hasWeb) { try { speechSynthesis.getVoices(); } catch (e) { } }

  // ---------------- Thorsten (Piper im Browser)
  const P = { status: 'aus', progress: 0, worker: null, error: '', loading: null };
  let vendorOk = false, wid = 0;
  const waiting = new Map();
  const base = () => new URL('vendor/', location.href).href;
  TTS.thorstenPossible = () => vendorOk;
  const key = name => new URL('stimmen-cache/' + name, location.href).href;
  async function cached(name) { try { const c = await caches.open(CACHE); const r = await c.match(key(name)); return r ? await r.arrayBuffer() : null; } catch (e) { return null; } }
  async function store(name, buf) { try { const c = await caches.open(CACHE); await c.put(key(name), new Response(buf)); } catch (e) { console.warn('Zwischenspeicher', e); } }
  async function download(url, onp) {
    const r = await fetch(url, { mode: 'cors' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const total = +r.headers.get('content-length') || 63200000;
    if (!r.body || !r.body.getReader) { const b = await r.arrayBuffer(); onp(1); return b; }
    const reader = r.body.getReader(); const parts = []; let got = 0;
    for (; ;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; onp(Math.min(0.99, got / total)); }
    const out = new Uint8Array(got); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
    onp(1); return out.buffer;
  }
  function call(msg, transfer) {
    return new Promise((resolve, reject) => {
      const id = ++wid; waiting.set(id, { resolve, reject });
      P.worker.postMessage(Object.assign({ id }, msg), transfer || []);
    });
  }
  function startWorker() {
    const w = new Worker(base() + 'thorsten-worker.js', { type: 'module' });
    w.onmessage = e => { const m = e.data || {}; const h = waiting.get(m.id); if (!h) return; waiting.delete(m.id); m.ok ? h.resolve(m) : h.reject(new Error(m.error || 'Fehler')); };
    w.onerror = e => { const err = new Error((e && e.message) || 'Hintergrund-Thread gestoppt'); for (const h of waiting.values()) h.reject(err); waiting.clear(); };
    return w;
  }
  const tell = () => { try { TTS.onProgress && TTS.onProgress(P); } catch (e) { } };
  TTS.thorstenStatus = () => P;
  TTS.thorstenCached = async () => !!(await cached(VOICE_ID + '.onnx'));
  TTS.loadThorsten = function () {
    if (P.status === 'bereit') return Promise.resolve(true);
    if (P.loading) return P.loading;
    P.loading = (async () => {
      try {
        P.status = 'lädt'; P.error = ''; P.progress = 0; tell();
        let cfg = await cached(VOICE_ID + '.json');
        let model = await cached(VOICE_ID + '.onnx');
        const fresh = !(cfg && model);
        let lastErr = null;
        for (const u of MODEL_URLS) {
          if (cfg && model) break;
          try {
            if (!cfg) { const r = await fetch(u + '.json', { mode: 'cors' }); if (!r.ok) throw new Error('HTTP ' + r.status); cfg = await r.arrayBuffer(); }
            if (!model) model = await download(u, f => { P.progress = f; tell(); });
          } catch (e) { lastErr = e; cfg = null; model = null; }
        }
        if (!cfg || !model) throw lastErr || new Error('Stimme nicht erreichbar');
        const config = JSON.parse(new TextDecoder().decode(cfg));
        if (fresh) { await store(VOICE_ID + '.json', cfg); await store(VOICE_ID + '.onnx', model); }
        if (P.worker) { try { P.worker.terminate(); } catch (e) { } }
        P.worker = startWorker();
        await call({ type: 'init', config, model }, [model]);
        P.status = 'bereit'; P.progress = 1; tell();
        return true;
      } catch (e) {
        console.error(e);
        if (P.worker) { try { P.worker.terminate(); } catch (x) { } P.worker = null; }
        P.status = 'fehler'; P.error = String(e && e.message || e); tell();
        return false;
      } finally { P.loading = null; }
    })();
    return P.loading;
  };
  TTS.removeThorsten = async function () {
    try { await caches.delete(CACHE); } catch (e) { }
    if (P.worker) { try { P.worker.terminate(); } catch (e) { } }
    P.worker = null; P.status = 'aus'; P.progress = 0; tell();
  };
  async function synth(text) {
    const r = await call({ type: 'synth', text, rate: rateNow() });
    return { pcm: r.pcm, rate: r.sampleRate };
  }
  let src = null;
  function playPcm(a, my) {
    return new Promise(res => {
      const ctx = AUD.context && AUD.context();
      if (!ctx || my !== gen || !a.pcm.length) return res(false);
      if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) { } }
      const buf = ctx.createBuffer(1, a.pcm.length, a.rate);
      buf.copyToChannel(a.pcm, 0);
      const s = ctx.createBufferSource(); s.buffer = buf; s.connect(ctx.destination);
      src = s;
      let done = false;
      const fin = () => { if (done) return; done = true; clearTimeout(guard); if (src === s) src = null; res(true); };
      // Schutz, falls das Ende nicht gemeldet wird
      const guard = setTimeout(fin, a.pcm.length / a.rate * 1000 + 1500);
      s.onended = fin;
      s.start();
    });
  }

  // ---------------- Warteschlange
  function mark(el) { if (curEl) curEl.classList.remove('reading'); curEl = el || null; if (curEl) curEl.classList.add('reading'); }
  function engine() { return set().ttsEngine === 'thorsten' && P.status === 'bereit' ? 'thorsten' : 'web'; }
  TTS.available = () => hasWeb || vendorOk;
  async function pumpWeb(my) {
    while (queue.length && my === gen) {
      const item = queue.shift(); const text = speakable(item.text); if (!text) continue;
      mark(item.el);
      for (const part of chunks(text, 180)) { if (my !== gen) return; await webSay(part, my); }
    }
  }
  async function pumpThorsten(my) {
    let parts = [];
    const next = () => {
      while (!parts.length && queue.length) { const it = queue.shift(); const t = speakable(it.text); if (t) parts = chunks(t, 170).map(x => ({ el: it.el, text: x })); }
      const p = parts.shift(); if (!p) return null;
      p.job = synth(p.text).catch(() => null);
      return p;
    };
    let cur = next();
    while (cur && my === gen) {
      const nxt = next(); // schon berechnen, waehrend der aktuelle Satz laeuft
      const a = await cur.job;
      if (my !== gen) return;
      mark(cur.el);
      if (a) await playPcm(a, my); else if (hasWeb) await webSay(cur.text, my);
      cur = nxt || next();
    }
  }
  async function pump() {
    if (busy) return; busy = true;
    const my = gen;
    state.speaking = true; TTS.onState(); if (AUD.duck) AUD.duck(true);
    try {
      if (engine() === 'thorsten') await pumpThorsten(my); else await pumpWeb(my);
    } catch (e) { console.error(e); }
    finally {
      if (my === gen) { busy = false; mark(null); state.speaking = false; TTS.onState(); if (AUD.duck) AUD.duck(false); }
    }
  }
  TTS.say = function (items) {
    if (!TTS.available()) return;
    for (const it of items) if (it && it.text && it.text.trim()) queue.push(it);
    if (queue.length) pump();
  };
  TTS.stop = function () {
    gen++; queue = []; busy = false;
    if (hasWeb) { try { if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); lastCancel = Date.now(); } } catch (e) { } }
    if (src) { try { src.stop(); } catch (e) { } src = null; }
    if (P.worker) { try { P.worker.postMessage({ type: 'cancel', upTo: wid }); } catch (e) { } }
    mark(null);
    if (state.speaking) { state.speaking = false; TTS.onState(); if (AUD.duck) AUD.duck(false); }
  };
  TTS.speaking = () => state.speaking;
  TTS.onState = function () {
    const b = document.getElementById('ttsbtn');
    if (b) { b.textContent = state.speaking ? '■' : '🔊'; b.setAttribute('aria-label', state.speaking ? 'Vorlesen anhalten' : 'Vorlesen'); }
  };
  // Seite vorlesen (alle Absaetze und Hinweise des Abschnitts)
  TTS.readPage = function () {
    const body = document.getElementById('pagebody'); if (!body) return;
    TTS.stop();
    TTS.say([...body.querySelectorAll('p, .note')].map(el => ({ text: el.textContent, el })));
  };
  // Neuer Text im Buch: bei „automatisch“ gleich vorlesen
  TTS.added = function (els) { if (!set().ttsAuto || !TTS.available()) return; TTS.say(els.map(el => ({ text: el.textContent, el }))); };
  TTS.pageStart = function () { TTS.stop(); };
  // iPhone und Co. erlauben Sprache erst nach einer Beruehrung: einmal stumm sprechen
  TTS.unlock = function () {
    if (unlocked || !hasWeb) return; unlocked = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'de-DE'; speechSynthesis.speak(u); } catch (e) { }
  };
  TTS.test = function () {
    TTS.stop();
    TTS.say([{ text: `So klinge ich, wenn ich dir die Haut des Odûn vorlese. Viel Glück auf deinem Weg nach Lyrgach${typeof G !== 'undefined' && G && G.name ? ', ' + G.name : ''}.` }]);
  };
  // Beim Start pruefen, ob Thorsten mitgeliefert ist, und ihn aus dem Speicher holen, wenn er gewaehlt ist (nie ungefragt herunterladen)
  TTS.init = async function () {
    try {
      if (/^https?:$/.test(location.protocol) && typeof Worker !== 'undefined' && 'caches' in window) {
        const r = await fetch(base() + 'thorsten-worker.js', { method: 'HEAD', cache: 'no-store' });
        vendorOk = r.ok;
      }
    } catch (e) { vendorOk = false; }
    if (vendorOk && set().ttsEngine === 'thorsten' && await TTS.thorstenCached()) TTS.loadThorsten();
  };
  TTS.webVoices = webVoices;
  TTS.bestWebVoice = bestWebVoice;
  TTS._speakable = speakable;
  TTS._chunks = chunks;
})();
