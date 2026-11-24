// Thorsten-Stimme fuer „Die Haut des Odûn“.
// Rechnet im Hintergrund (Web Worker), damit das Spiel beim Vorlesen fluessig bleibt.
// Lautschrift: espeak-ng ueber piper-phonemize (siehe piper/QUELLEN.md, GPL-3.0)
// Stimme: Piper-Modell „de_DE-thorsten-medium“ (CC0) mit ONNX Runtime Web (MIT)
const base = new URL('./', import.meta.url).href;
let ort = null, session = null, config = null, wasmMod = null, dataBuf = null, createPhonemize = null, skipUpTo = 0;
let chain = Promise.resolve();

self.onmessage = e => {
  const m = e.data || {};
  if (m.type === 'cancel') { skipUpTo = Math.max(skipUpTo, m.upTo || 0); return; }
  chain = chain.then(() => handle(m)).catch(() => { });
};

async function handle(m) {
  try {
    if (m.type === 'init') {
      const o = await import(base + 'ort/ort.wasm.min.js');
      ort = o.default || o;
      ort.env.wasm.wasmPaths = base + 'ort/';
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.proxy = false;
      createPhonemize = (await import(base + 'piper/phonemize.js')).createPiperPhonemize;
      wasmMod = await WebAssembly.compile(await (await fetch(base + 'piper/piper_phonemize.wasm')).arrayBuffer());
      dataBuf = await (await fetch(base + 'piper/piper_phonemize.data')).arrayBuffer();
      config = m.config;
      session = await ort.InferenceSession.create(new Uint8Array(m.model), { executionProviders: ['wasm'] });
      self.postMessage({ id: m.id, ok: true });
      return;
    }
    if (m.type === 'synth') {
      if (m.id <= skipUpTo) { self.postMessage({ id: m.id, ok: false, error: 'abgebrochen' }); return; }
      if (!session) throw new Error('Stimme nicht geladen');
      const ids = await phonemize(m.text);
      const inf = config.inference || {};
      const feeds = {
        input: new ort.Tensor('int64', BigInt64Array.from(ids, x => BigInt(x)), [1, ids.length]),
        input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
        scales: new ort.Tensor('float32', Float32Array.from([inf.noise_scale ?? 0.667, (inf.length_scale ?? 1) / (m.rate || 1), inf.noise_w ?? 0.8]), [3]),
      };
      if ((config.num_speakers || 1) > 1) feeds.sid = new ort.Tensor('int64', BigInt64Array.from([0n]), [1]);
      const out = await session.run(feeds);
      const t = out.output || out[session.outputNames[0]];
      const pcm = new Float32Array(t.data);
      // Lautstaerke angleichen wie bei Piper selbst
      let peak = 0; for (let i = 0; i < pcm.length; i++) { const a = Math.abs(pcm[i]); if (a > peak) peak = a; }
      const g = 0.9 / Math.max(0.05, peak); if (g !== 1) for (let i = 0; i < pcm.length; i++) pcm[i] *= g;
      self.postMessage({ id: m.id, ok: true, pcm, sampleRate: (config.audio && config.audio.sample_rate) || 22050 }, [pcm.buffer]);
    }
  } catch (err) {
    self.postMessage({ id: m.id, ok: false, error: String(err && err.message || err) });
  }
}

// espeak-ng liefert die Lautschrift als Zahlenfolge fuer das Modell
function phonemize(text) {
  return new Promise((resolve, reject) => {
    const ids = [];
    createPhonemize({
      print: d => { try { const j = JSON.parse(d); if (j && j.phoneme_ids) ids.push(...j.phoneme_ids); } catch (e) { } },
      printErr: () => { },
      getPreloadedPackage: () => dataBuf,
      instantiateWasm: (imports, done) => { WebAssembly.instantiate(wasmMod, imports).then(inst => done(inst, wasmMod), reject); return {}; },
      locateFile: u => base + 'piper/' + String(u).split('/').pop(),
    }).then(mod => {
      try { mod.callMain(['-l', config.espeak.voice, '--input', JSON.stringify([{ text }]), '--espeak_data', '/espeak-ng-data']); } catch (e) { }
      ids.length ? resolve(ids) : reject(new Error('Lautschrift leer'));
    }, reject);
  });
}
