'use strict';
// ---------------------------------------------------------------- Musik und Klaenge (alles im Browser erzeugt)
const AUD = {};
(function () {
  let ctx = null, master = null, musicBus = null, sfxBus = null, duck = null, unlocked = false;
  let theme = null, timer = null, nextT = 0, beat = 0, wantTheme = null;
  const set = () => UI.settings();
  AUD.context = () => { if (!ctx) AUD.unlock(); return ctx; };
  // Musik leiser, solange vorgelesen wird
  AUD.duck = function (on) {
    if (!ctx || !duck) return;
    try { const t = ctx.currentTime; duck.gain.cancelScheduledValues(t); duck.gain.setTargetAtTime(on ? 0.3 : 1, t, 0.3); } catch (e) { }
  };
  AUD.unlock = function () {
    if (typeof TTS !== 'undefined') TTS.unlock();
    if (unlocked && ctx && ctx.state === 'running') return;
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (e) { }
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
        duck = ctx.createGain(); duck.gain.value = 1; duck.connect(master);
        musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(duck);
        sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
        // stilles Audio-Element: iPhone spielt dann auch im Lautlos-Modus
        try {
          const a = document.createElement('audio');
          a.setAttribute('playsinline', ''); a.loop = true; a.volume = 0.01;
          a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
          const pr = a.play(); if (pr && pr.catch) pr.catch(() => { });
        } catch (e) { }
      }
      if (ctx.state !== 'running') ctx.resume();
      const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
      unlocked = true;
      if (wantTheme) { const t = wantTheme; wantTheme = null; AUD.music(t); }
    } catch (e) { }
  };
  // ---------------- Instrumente
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function env(g, t, a, d, peak, sus) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t + a + d);
  }
  function osc(type, f, t, dur, vol, bus, opts) {
    opts = opts || {};
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (opts.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.2; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.12); l.stop(t + dur + 0.2); }
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);
    let node = o;
    if (opts.lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = opts.lp; o.connect(fl); node = fl; }
    node.connect(g); g.connect(bus || musicBus);
    if (opts.pad) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur); }
    else env(g, t, opts.a || 0.01, dur, vol, opts.sus);
    o.start(t); o.stop(t + dur + 0.1);
  }
  function noise(t, dur, vol, bus, hp, lp) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur)), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(); s.buffer = b;
    let node = s;
    if (hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f; }
    if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f; }
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g); g.connect(bus || sfxBus); s.start(t);
  }
  const INST = {
    harp: (m, t, d, v) => { osc('triangle', mtof(m), t, d * 1.6, 0.22 * v); osc('sine', mtof(m + 12), t, d * 0.8, 0.05 * v); },
    pluck: (m, t, d, v) => osc('triangle', mtof(m), t, Math.min(0.5, d), 0.2 * v, null, { lp: 2400 }),
    flute: (m, t, d, v) => osc('sine', mtof(m), t, d * 0.95, 0.15 * v, null, { vib: true, a: 0.06, sus: 0.07 * v }),
    pipe: (m, t, d, v) => osc('sawtooth', mtof(m), t, d * 0.95, 0.05 * v, null, { lp: 1600, vib: true, a: 0.03, sus: 0.035 * v }),
    drone: (m, t, d, v) => { osc('sawtooth', mtof(m), t, d, 0.05 * v, null, { lp: 500, pad: true }); osc('sine', mtof(m - 12), t, d, 0.08 * v, null, { pad: true }); },
    pad: (m, t, d, v) => { osc('sine', mtof(m), t, d, 0.06 * v, null, { pad: true }); osc('triangle', mtof(m + 7), t, d, 0.03 * v, null, { pad: true }); },
    bass: (m, t, d, v) => osc('triangle', mtof(m - 12), t, d * 0.9, 0.2 * v, null, { lp: 700 }),
    drum: (t, v) => { osc('sine', 110, t, 0.22, 0.5 * v, null, { slide: 45 }); noise(t, 0.08, 0.12 * v, musicBus, 0, 1200); },
    tick: (t, v) => noise(t, 0.04, 0.06 * v, musicBus, 3000),
    bell: (m, t, d, v) => { osc('sine', mtof(m), t, d * 2, 0.12 * v); osc('sine', mtof(m) * 2.76, t, d, 0.03 * v); },
  };
  // ---------------- Themen: Tonart, Tempo, Begleitung, Melodie
  const MODES = { dorian: [0, 2, 3, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], mixo: [0, 2, 4, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], ionian: [0, 2, 4, 5, 7, 9, 11] };
  const THEMES = {
    title: { root: 62, mode: 'dorian', bpm: 70, lead: 'harp', acc: 'drone', prog: [0, 0, 5, 3], dens: 0.55, drum: 0 },
    travel: { root: 62, mode: 'dorian', bpm: 92, lead: 'flute', acc: 'pluck', prog: [0, 3, 4, 0, 5, 3, 4, 4], dens: 0.7, drum: 0 },
    travel2: { root: 60, mode: 'mixo', bpm: 96, lead: 'flute', acc: 'pluck', prog: [0, 6, 3, 0, 0, 4, 6, 0], dens: 0.7, drum: 0 },
    moor: { root: 52, mode: 'phryg', bpm: 60, lead: 'flute', acc: 'drone', prog: [0, 1, 0, 6], dens: 0.35, drum: 0 },
    town: { root: 67, mode: 'mixo', bpm: 112, lead: 'pipe', acc: 'pluck', prog: [0, 6, 0, 4, 0, 6, 3, 4], dens: 0.85, drum: 1 },
    fight: { root: 50, mode: 'aeolian', bpm: 132, lead: 'pipe', acc: 'bass', prog: [0, 0, 5, 6, 0, 0, 3, 4], dens: 0.8, drum: 2 },
    orkland: { root: 52, mode: 'phryg', bpm: 100, lead: 'pipe', acc: 'bass', prog: [0, 1, 0, 6], dens: 0.5, drum: 2 },
    gjalsk: { root: 62, mode: 'mixo', bpm: 88, lead: 'pipe', acc: 'drone', prog: [0, 0, 6, 0, 3, 0, 6, 4], dens: 0.75, drum: 1 },
    night: { root: 57, mode: 'aeolian', bpm: 62, lead: 'harp', acc: 'pad', prog: [0, 5, 3, 4], dens: 0.35, drum: 0 },
    sea: { root: 55, mode: 'dorian', bpm: 74, lead: 'flute', acc: 'pad', prog: [0, 3, 0, 6], dens: 0.45, drum: 0, waves: true },
    vision: { root: 62, mode: 'dorian', bpm: 56, lead: 'bell', acc: 'pad', prog: [0, 4, 5, 3], dens: 0.4, drum: 0 },
    sad: { root: 57, mode: 'aeolian', bpm: 66, lead: 'harp', acc: 'pad', prog: [0, 5, 3, 4], dens: 0.45, drum: 0 },
  };
  let melodyPos = 2, motif = null;
  function scaleNote(th, deg) {
    const md = MODES[th.mode], o = Math.floor(deg / 7), i = ((deg % 7) + 7) % 7;
    return th.root + md[i] + 12 * o;
  }
  function schedule() {
    if (!theme || !ctx) return;
    const th = THEMES[theme];
    const spb = 60 / th.bpm / 2; // Achtel
    while (nextT < ctx.currentTime + 0.25) {
      const bar = Math.floor(beat / 8), inBar = beat % 8;
      const chord = th.prog[bar % th.prog.length];
      const v = 1;
      // Begleitung
      if (th.acc === 'drone' || th.acc === 'pad') { if (inBar === 0) INST[th.acc](scaleNote(th, chord) - 12, nextT, spb * 8, v); }
      else if (th.acc === 'pluck') { const pat = [0, 2, 4, 2, 0, 2, 4, 7]; if (inBar % 2 === 0) INST.pluck(scaleNote(th, chord + pat[inBar]) - 12, nextT, spb * 2, 0.8); }
      else if (th.acc === 'bass') { if (inBar % 2 === 0) INST.bass(scaleNote(th, chord), nextT, spb * 2, inBar === 0 ? 1 : 0.7); }
      if (th.drum === 1 && (inBar === 0 || inBar === 3 || inBar === 6)) INST.drum(nextT, 0.6);
      if (th.drum === 2) { if (inBar % 2 === 0) INST.drum(nextT, inBar === 0 ? 1 : 0.6); else INST.tick(nextT, 0.6); }
      if (th.waves && inBar === 0 && bar % 2 === 0) noise(nextT, spb * 7, 0.035, musicBus, 200, 900);
      // Melodie: Motive mit Schrittbewegung
      if (!motif || motif.i >= motif.notes.length) motif = makeMotif(th, chord);
      const n = motif.notes[motif.i];
      if (n && n.at === inBar) {
        motif.i++;
        INST[th.lead](scaleNote(th, n.deg), nextT, spb * n.len, n.v);
      }
      if (inBar === 7 && motif.i >= motif.notes.length) motif = null;
      nextT += spb; beat++;
    }
  }
  function makeMotif(th, chord) {
    const notes = [];
    const rhythms = [[0, 2, 4, 6], [0, 3, 4, 6], [0, 1, 2, 4, 6], [0, 4], [0, 2, 3, 4, 6], [0, 6]];
    const r = rhythms[Math.floor(Math.random() * rhythms.length)];
    for (let k = 0; k < r.length; k++) {
      if (Math.random() > th.dens && k > 0) continue;
      const step = [-2, -1, -1, 1, 1, 2, 0, 3, -3][Math.floor(Math.random() * 9)];
      melodyPos = clamp(melodyPos + step, -2, 9);
      if (k === 0 && Math.random() < 0.5) melodyPos = chord + [0, 2, 4, 7][Math.floor(Math.random() * 4)];
      const len = (r[k + 1] !== undefined ? r[k + 1] : 8) - r[k];
      notes.push({ at: r[k], deg: melodyPos, len, v: k === 0 ? 1 : 0.8 });
    }
    return { notes, i: 0 };
  }
  AUD.music = function (name) {
    if (!name) return;
    if (!ctx || !unlocked) { wantTheme = name; return; }
    if (!set().music) { theme = null; stop(); wantTheme = name; return; }
    if (theme === name) return;
    theme = name; beat = 0; motif = null; melodyPos = 2;
    nextT = ctx.currentTime + 0.1;
    // weich ueberblenden
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0.0001, ctx.currentTime); musicBus.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 1.2);
    if (!timer) timer = setInterval(schedule, 60);
  };
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  AUD.setMusic = function (on) { if (!on) { theme = null; stop(); } else if (G) { const t = G.map === 'world' ? AUD.regionTheme() : 'town'; theme = null; AUD.music(t); } };
  AUD.regionTheme = function () {
    if (!G) return 'title';
    if (G.map !== 'world') return (MAPS[G.map] && MAPS[G.map].music) || 'town';
    const r = ENG.region(G.x, G.y);
    return { w: 'travel', m: 'moor', s: 'travel2', o: 'orkland', k: 'moor', f: 'gjalsk', g: 'gjalsk', n: 'travel' }[r] || 'travel';
  };
  // ---------------- Klaenge
  AUD.sfx = function (k) {
    if (!ctx || !unlocked || !set().sound) return;
    const t = ctx.currentTime;
    switch (k) {
      case 'click': osc('triangle', 660, t, 0.05, 0.12, sfxBus); break;
      case 'dice': for (let i = 0; i < 6; i++) noise(t + i * 0.055 + Math.random() * 0.02, 0.035, 0.25, sfxBus, 1800); break;
      case 'ok': osc('triangle', 523, t, 0.12, 0.25, sfxBus); osc('triangle', 784, t + 0.1, 0.22, 0.25, sfxBus); break;
      case 'fail': osc('triangle', 330, t, 0.15, 0.25, sfxBus); osc('triangle', 247, t + 0.12, 0.3, 0.25, sfxBus); break;
      case 'hit': noise(t, 0.12, 0.5, sfxBus, 0, 900); osc('sine', 120, t, 0.12, 0.4, sfxBus, { slide: 50 }); break;
      case 'hurt': osc('sawtooth', 200, t, 0.18, 0.18, sfxBus, { slide: 90, lp: 900 }); noise(t, 0.1, 0.25, sfxBus, 0, 700); break;
      case 'parry': osc('square', 1400, t, 0.08, 0.08, sfxBus, { lp: 4000 }); osc('triangle', 2100, t, 0.18, 0.07, sfxBus); break;
      case 'miss': noise(t, 0.18, 0.15, sfxBus, 1200, 3000); break;
      case 'coin': osc('square', 1318, t, 0.06, 0.07, sfxBus, { lp: 5000 }); osc('square', 1760, t + 0.07, 0.12, 0.07, sfxBus, { lp: 5000 }); break;
      case 'odun': [62, 66, 69, 74].forEach((m, i) => INST.bell(m, t + i * 0.09, 0.4, 1.2)); break;
      case 'blut': osc('sawtooth', 98, t, 0.5, 0.15, sfxBus, { lp: 400 }); osc('sine', 73, t, 0.6, 0.25, sfxBus); break;
      case 'heal': [67, 71, 74].forEach((m, i) => osc('sine', mtof(m), t + i * 0.08, 0.3, 0.15, sfxBus)); break;
      case 'page': noise(t, 0.2, 0.06, sfxBus, 2500); break;
      case 'day': INST.bell(74, t, 0.5, 1); break;
    }
  };
})();
