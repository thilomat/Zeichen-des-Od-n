'use strict';
// ---------------------------------------------------------------- Szenenbilder (160 x 72 Pixel, aus Ebenen zusammengesetzt)
const PICS = {};
(function () {
  let W = 160;
  let g, H, rnd;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function sky(kind) {
    const top = { day: ['#7fb2e0', '#cfe6f5'], dusk: ['#3c2f5c', '#e3966a'], night: ['#0b1026', '#25315a'], fog: ['#9aa3a5', '#c9cfcd'], dawn: ['#6d7fb8', '#f0c0a0'], storm: ['#2a2f36', '#5a636b'], vision: ['#2a1a40', '#c88ad8'] }[kind] || ['#7fb2e0', '#cfe6f5'];
    for (let y = 0; y < H; y++) { const t = y / H; R(0, y, W, 1, mix(top[0], top[1], t)); }
    if (kind === 'night' || kind === 'vision') { for (let i = 0; i < 40; i++) R(rnd() * W, rnd() * H * 0.5, 1, 1, rnd() < 0.3 ? '#fff' : '#9ab'); R(128, 8, 7, 7, '#f0ecd0'); R(129, 9, 2, 2, '#d8d2b0'); }
    if (kind === 'day') { R(22, 9, 9, 9, '#fff6c8'); for (let i = 0; i < 3; i++) cloud(30 + i * 45 + rnd() * 10, 8 + rnd() * 8); }
    if (kind === 'dusk' || kind === 'dawn') R(70, H * 0.42, 22, 6, '#ffd890');
  }
  function cloud(x, y) { R(x, y, 18, 4, 'rgba(255,255,255,.8)'); R(x + 4, y - 3, 10, 4, 'rgba(255,255,255,.8)'); }
  function mix(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function ridge(y, amp, col, step, jag) {
    let h = 0;
    for (let x = 0; x < W; x++) {
      h = Math.sin(x / step + y) * amp * 0.6 + Math.sin(x / (step * 0.37) + y * 2) * amp * 0.4;
      if (jag) h += (rnd() - 0.5) * jag;
      R(x, y - h, 1, H - (y - h), col);
    }
  }
  function mountains(base, snow) {
    for (let i = 0; i < 6; i++) {
      const cx = i * 32 + rnd() * 20, hgt = 18 + rnd() * 16, w = 26 + rnd() * 18;
      for (let y = 0; y < hgt; y++) { const ww = (y / hgt) * w; R(cx - ww / 2, base - hgt + y, ww, 1, y < hgt * 0.25 && snow ? '#eef2f5' : (y % 3 ? '#6f6f78' : '#62626b')); }
    }
  }
  function pines(base, n, col, scale) {
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, s = (scale || 1) * (0.7 + rnd() * 0.6), h = 14 * s;
      for (let y = 0; y < h; y++) { const w = (y / h) * 7 * s; R(x - w / 2, base - h + y, w, 1, col); }
      R(x - 0.5, base, 1, 2 * s, '#3a2a1c');
    }
  }
  function ground(kind, y0) {
    const c = { meadow: ['#5f8a3a', '#6f9a45'], moor: ['#4a4f36', '#5a5f3e'], steppe: ['#b19f55', '#c2b066'], heath: ['#6e5a5a', '#7d6a64'], marsh: ['#58705a', '#6a8468'], snow: ['#d8dde2', '#eef2f5'], road: ['#8a6a45', '#a7835a'], beach: ['#cdb98a', '#ddc99a'], town: ['#8f7556', '#9c8262'] }[kind] || ['#5f8a3a', '#6f9a45'];
    for (let y = y0; y < H; y++) R(0, y, W, 1, (y % 4 < 2) ? c[0] : c[1]);
    if (kind === 'moor' || kind === 'marsh') for (let i = 0; i < 6; i++) { const x = rnd() * W, y = y0 + 4 + rnd() * (H - y0 - 6); R(x, y, 14 + rnd() * 12, 2, '#33474a'); R(x + 3, y, 6, 1, '#5b7c80'); }
    if (kind === 'heath') for (let i = 0; i < 40; i++) R(rnd() * W, y0 + rnd() * (H - y0), 1, 1, '#b36fae');
    if (kind === 'meadow') for (let i = 0; i < 25; i++) R(rnd() * W, y0 + rnd() * (H - y0), 1, 1, rnd() < 0.5 ? '#e9d76d' : '#8cbf5c');
  }
  function water(y0, h, col) { for (let y = y0; y < y0 + h; y++) R(0, y, W, 1, (y % 3) ? (col || '#3a6ea8') : '#5a8ec8'); for (let i = 0; i < 12; i++) R(rnd() * W, y0 + rnd() * h, 6, 1, '#a6c8ec'); }
  function sprite(name, x, y, scale) {
    const img = ART.figs[name] || ART.big[name] || ART.poi[name]; if (!img) return;
    const s = scale || 2; g.drawImage(img, Math.round(x - img.width * s / 2), Math.round(y - img.height * s), img.width * s, img.height * s);
  }
  function fire(x, y) { R(x - 7, y - 1, 14, 3, '#3a2a1c'); for (let i = 0; i < 3; i++) { R(x - 4 + i * 3, y - 7 - (i % 2) * 3, 3, 7, '#e8742c'); R(x - 3 + i * 3, y - 5, 1, 4, '#ffd040'); } g.fillStyle = 'rgba(255,190,90,.18)'; g.beginPath(); g.arc(x, y - 4, 22, 0, 7); g.fill(); }
  function kiln(x, y) { for (let r = 14; r > 0; r--) R(x - r, y - (14 - r) * 0.7, r * 2, 1, r % 3 ? '#4a3a2c' : '#3a2c20'); for (let i = 0; i < 5; i++) R(x - 2 + Math.sin(i) * 3, y - 14 - i * 5, 5 - i * 0.6, 4, `rgba(200,200,200,${0.6 - i * 0.1})`); }
  function hut(x, y, roof) { R(x - 10, y - 10, 20, 10, '#8a6a42'); for (let k = 0; k < 9; k++) R(x - 12 + k, y - 10 - k, 24 - 2 * k, 1, roof || '#6f6a2e'); R(x - 2, y - 6, 4, 6, '#2a1d14'); }
  function longhouse(x, y) { R(x - 22, y - 9, 44, 9, '#7a5a3a'); for (let k = 0; k < 8; k++) R(x - 24 + k * 0.5, y - 9 - k, 48 - k, 1, '#8a7a3a'); R(x - 2, y - 6, 4, 6, '#2a1d14'); R(x + 10, y - 22, 2, 6, '#555'); }
  function palisade(y, x0, x1) { for (let x = x0; x < x1; x += 3) { R(x, y - 14, 2, 14, '#6b4a2b'); R(x, y - 15, 2, 1, '#3a2a1c'); } }
  function town(y, orc) { for (let i = 0; i < 7; i++) { const x = 20 + i * 20 + rnd() * 6, h = 10 + rnd() * 10; R(x - 8, y - h, 16, h, orc ? '#5a4a3a' : '#a98656'); for (let k = 0; k < 6; k++) R(x - 9 + k, y - h - k, 18 - 2 * k, 1, orc ? '#2e241c' : '#8a4a2a'); } if (!orc) { R(76, y - 34, 8, 34, '#9a9aa0'); for (let k = 0; k < 6; k++) R(75 + k * 0.3, y - 34 - k, 10 - k * 0.6, 1, '#6a3a2a'); } else { R(100, y - 30, 1, 20, '#2a1d14'); R(101, y - 30, 8, 5, '#111'); } }
  function shrine(x, y) { R(x - 12, y - 14, 24, 14, '#6f6a66'); R(x - 14, y - 16, 28, 3, '#4f4a46'); R(x - 3, y - 9, 6, 9, '#1c1c1c'); R(x - 3, y - 22, 6, 5, '#2a2a2a'); R(x + 2, y - 21, 3, 2, '#2a2a2a'); }
  function stones(x, y) { [[-18, 12], [-8, 16], [3, 14], [13, 18], [22, 11]].forEach(([dx, h]) => { R(x + dx, y - h, 5, h, '#8d857d'); R(x + dx, y - h, 1, h, '#b1a99f'); }); }
  function boat(x, y) { R(x - 18, y - 4, 36, 4, '#6b4a2b'); R(x - 20, y - 6, 4, 3, '#6b4a2b'); R(x + 16, y - 6, 4, 3, '#6b4a2b'); }
  function ship(x, y) { R(x - 30, y - 6, 60, 6, '#5a3a22'); R(x - 34, y - 12, 6, 7, '#5a3a22'); R(x + 28, y - 12, 6, 7, '#5a3a22'); R(x - 1, y - 40, 2, 34, '#3a2a1c'); for (let k = 0; k < 24; k++) R(x - 14, y - 38 + k, 28, 1, k % 6 < 3 ? '#c0392b' : '#efe7d6'); for (let i = 0; i < 6; i++) R(x - 24 + i * 9, y - 9, 5, 5, ['#c0392b', '#e5c14a', '#3f5f8f'][i % 3]); }
  function tower(x, y) { R(x - 8, y - 40, 16, 40, '#8d857d'); for (let k = 0; k < 4; k++) R(x - 9 + k * 5, y - 44, 3, 4, '#8d857d'); R(x - 2, y - 30, 4, 6, '#222'); }
  function tents(y) { [[40, '#b49a74'], [70, '#8a7356'], [110, '#b49a74']].forEach(([x, c]) => { for (let k = 0; k < 16; k++) R(x - k * 0.7, y - 16 + k, k * 1.4 + 1, 1, c); }); }
  function fog() { for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(225,230,230,.22)'; g.fillRect(rnd() * W - 40, H * 0.35 + rnd() * H * 0.5, 80 + rnd() * 60, 6 + rnd() * 6); } }
  function rain() { g.fillStyle = 'rgba(200,210,230,.5)'; for (let i = 0; i < 90; i++) g.fillRect(rnd() * W, rnd() * H, 1, 4); }

  // ---------------- Bild nach Beschreibung
  // spec: Objekt {sky, far, ground, gy, feats:[], figs:[]} oder Name
  const NAMED = {
    herb: { sky: 'day', far: 'forest', ground: 'meadow', figs: ['hero'], feats: [] },
    hunt: { sky: 'day', far: 'forest', ground: 'meadow', figs: ['hero', 'deer'] },
    meditate: { sky: 'dusk', far: 'forest', ground: 'meadow', figs: ['hero'] },
    night: { sky: 'night', far: 'forest', ground: 'meadow', feats: ['fire'], figs: ['hero'] },
    wolves: { sky: 'dusk', far: 'forest', ground: 'meadow', figs: ['hero', 'wolf', 'wolf'] },
    bandits: { sky: 'day', far: 'forest', ground: 'road', figs: ['hero', 'deserter', 'man'] },
    orcs: { sky: 'day', far: 'hills', ground: 'steppe', figs: ['hero', 'orc', 'orcSpear'] },
    goblins: { sky: 'day', far: 'hills', ground: 'steppe', figs: ['hero', 'man', 'man'] },
    marsh: { sky: 'fog', far: 'none', ground: 'marsh', figs: ['hero', 'leech'], fog: true },
    moor: { sky: 'fog', far: 'none', ground: 'moor', figs: ['hero'], fog: true },
    bear: { sky: 'day', far: 'forest', ground: 'meadow', figs: ['hero', 'bear'] },
    wisp: { sky: 'night', far: 'none', ground: 'moor', figs: ['hero', 'wisp'], fog: true },
    trader: { sky: 'day', far: 'forest', ground: 'road', figs: ['hero', 'trader'] },
    refugees: { sky: 'day', far: 'hills', ground: 'road', figs: ['hero', 'farmer', 'woman', 'child'] },
    deer: { sky: 'dawn', far: 'forest', ground: 'meadow', figs: ['hero'] },
    raven: { sky: 'fog', far: 'forest', ground: 'meadow', figs: ['hero', 'raven'] },
    kiln: { sky: 'day', far: 'forest', ground: 'meadow', feats: ['kiln'], figs: ['hero', 'charburner'] },
    nivese: { sky: 'fog', far: 'none', ground: 'marsh', figs: ['hero', 'nivese'] },
    gjalsk: { sky: 'fog', far: 'mountains', ground: 'heath', figs: ['hero', 'gjalsk'] },
  };
  PICS.drawSpec = function (canvas, spec) {
    if (!canvas) return;
    if (typeof spec === 'string') spec = NAMED[spec] || NAMED.herb;
    g = canvas.getContext('2d'); W = canvas.width; H = canvas.height; rnd = seededRNG(spec.seed || 9);
    g.imageSmoothingEnabled = false;
    const gy = spec.gy || Math.round(H * 0.62);
    sky(spec.sky || 'day');
    const far = spec.far || 'forest';
    if (far === 'mountains') mountains(gy - 2, true);
    if (far === 'hills') ridge(gy - 6, 6, '#5d7a45', 24);
    if (far === 'forest') { ridge(gy - 4, 3, '#2f5a32', 20); pines(gy - 2, 22, '#24452a', 1.1); }
    if (far === 'darkforest') { ridge(gy - 4, 3, '#1c3322', 20); pines(gy - 2, 30, '#152a1a', 1.5); }
    if (far === 'sea') water(gy - 10, 10, '#2c5486');
    if (far === 'town') town(gy, false);
    if (far === 'orctown') town(gy, true);
    if (far === 'stones') { ridge(gy - 4, 4, '#6e5a5a', 26); }
    ground(spec.ground || 'meadow', gy);
    if (spec.river) water(gy + 6, 8);
    if (spec.sea) water(gy, H - gy, '#2c5486');
    for (const f of (spec.feats || [])) {
      if (f === 'fire') fire(100, H - 8);
      if (f === 'kiln') kiln(110, gy + 8);
      if (f === 'hut') hut(118, gy + 6);
      if (f === 'longhouse') { longhouse(110, gy + 8); longhouse(40, gy + 4); }
      if (f === 'palisade') palisade(gy + 4, 0, W);
      if (f === 'shrine') shrine(110, gy + 6);
      if (f === 'stones') stones(90, gy + 4);
      if (f === 'boat') boat(100, gy + 12);
      if (f === 'ship') ship(105, gy + 10);
      if (f === 'tower') tower(120, gy + 4);
      if (f === 'tents') tents(gy + 8);
      if (f === 'well') sprite('well', 120, gy + 10, 1);
    }
    // Figuren: links der Held, rechts die anderen
    const figs = spec.figs || [];
    figs.forEach((name, i) => {
      if (name === 'hero') { const img = ART.heroDoll(G && G.daughter, G && /Speer|Spieß/.test(G.weapon || '') ? 'spear' : 'staff'); g.drawImage(img, 22, H - 34, 32, 32); return; }
      if (name === 'deer') return;
      sprite(name, 82 + i * 22, H - 3, 2);
    });
    if (spec.fog) fog();
    if (spec.rain) rain();
    if (spec.sky === 'night') { g.fillStyle = 'rgba(10,15,40,.25)'; g.fillRect(0, 0, W, H); }
  };
  // ---------------- Bild zum Abschnitt: Ort + Stichwoerter im Text
  const KEYS = [
    [/\bWölfe|\bWolf\b|Leitwolf|Rudel/, 'wolf', 2], [/\bOrks?\b|Schwarzpelz|Orkkrieger/, 'orc', 2], [/\bBär\b|Bärin|Bären\b/, 'bear', 1], [/Keiler|Eber|Bache|Frischling/, 'boar', 1],
    [/Moorleiche/, 'corpse', 1], [/Rabe|Krähe/, 'raven', 1], [/\bHunde?\b|Meute|Rüde/, 'dog', 2], [/Goblin/, 'man', 1], [/Thorwaler|Hakon/, 'thorwal', 1], [/Nivese/, 'nivese', 1],
    [/Söldner|Deserteur|Wegelagerer|Plünderer/, 'deserter', 2], [/Ritter|Junker/, 'knight', 1], [/Geist|Schemen|Tote[nr]?\b/, 'ghost', 1], [/Kinder|Junge\b|Mädchen\b/, 'child', 1],
    [/Alte\b|Kräuterfrau|Mutter Wiltrud|Greisin/, 'oldwoman', 1], [/Köhler/, 'charburner', 1], [/Caithra|Bogenschützin/, 'archer', 1], [/Morghinach|Schamane/, 'shaman', 1], [/Megrim/, 'gjalskW', 1],
  ];
  PICS.draw = function (canvas, sec) {
    const all = (BOOK[parseInt(sec, 10)] || []).map(s => s[0]);
    const sents = all.join(' ');
    const BACK = /vergessen|schon einmal|erzählt|erzählen|heißt es|letztes Jahr|damals|vor dreißig|früher|träumst|Traum/;
    const scene = all.slice(0, 5).filter(t => !BACK.test(t)).join(' ');
    const spec = { sky: 'day', far: 'forest', ground: 'meadow', feats: [], figs: ['hero'], seed: sec };
    // Ort
    const reg = G && G.map === 'world' ? ENG.region(G.x, G.y) : null;
    const vil = G && G.map !== 'world' ? G.map : null;
    if (reg === 'm') Object.assign(spec, { sky: 'fog', far: 'none', ground: 'moor', fog: true });
    if (reg === 's') Object.assign(spec, { far: 'hills', ground: 'meadow', river: /Fluss|Svellt|Ufer|Kahn/.test(sents) });
    if (reg === 'o') Object.assign(spec, { far: 'hills', ground: 'steppe' });
    if (reg === 'k') Object.assign(spec, { sky: 'fog', far: 'none', ground: 'marsh', fog: true });
    if (reg === 'g' || reg === 'f') Object.assign(spec, { far: 'mountains', ground: 'heath' });
    if (vil === 'tannhag') Object.assign(spec, { far: 'forest', feats: ['palisade'], ground: 'town' });
    if (vil === 'baliho' || vil === 'lowangen' || vil === 'tiefhusen') Object.assign(spec, { far: 'town', ground: 'town' });
    if (vil === 'gashok') Object.assign(spec, { far: 'orctown', ground: 'town', feats: ['palisade'] });
    if (vil === 'tjolmar') Object.assign(spec, { far: 'town', ground: 'town', feats: ['tents'] });
    if (vil === 'enqui') Object.assign(spec, { far: 'sea', ground: 'beach', feats: ['ship'] });
    if (vil === 'lyrgach') Object.assign(spec, { far: 'mountains', ground: 'heath', feats: ['longhouse'] });
    // Stichwoerter
    if (/Nacht|Mondlicht|Mitternacht|Sterne/.test(sents)) spec.sky = 'night';
    else if (/Abend|Dämmerung|Sonnenuntergang/.test(sents)) spec.sky = spec.sky === 'fog' ? 'fog' : 'dusk';
    else if (/Morgengrauen|Morgen\b|Sonnenaufgang/.test(sents)) spec.sky = spec.sky === 'fog' ? 'fog' : 'dawn';
    if (/Nebel/.test(sents)) { spec.sky = 'fog'; spec.fog = true; }
    if (/Sturm|Regen|Gewitter/.test(sents)) { spec.sky = 'storm'; spec.rain = true; }
    if (/Feuer\b|Lagerfeuer|Flammen/.test(sents)) spec.feats.push('fire');
    if (/Meiler/.test(sents)) spec.feats.push('kiln');
    if (/Schrein|Boron/.test(sents)) spec.feats.push('shrine');
    if (/Hütte|Kate/.test(sents) && !spec.feats.length) spec.feats.push('hut');
    if (/Turm\b/.test(sents) && !vil) spec.feats.push('tower');
    if (/Knorr|Drachenboot|Langschiff|Schiff\b/.test(sents)) { spec.far = 'sea'; spec.feats.push('ship'); }
    else if (/Kahn|Boot\b|Fähre/.test(sents)) { spec.river = true; spec.feats.push('boat'); }
    if (/Keilerstein|Steinkreis|Menhir/.test(sents)) spec.feats.push('stones');
    if (/Vision|Geisterwelt|Traum/.test(sents) && /Keiler/.test(sents)) { spec.sky = 'vision'; }
    if (/Sonnenwende/.test(sents) && vil === 'lyrgach') spec.sky = 'dawn';
    let n = 0;
    for (const [re, fig, cnt] of KEYS) { if (re.test(scene) && n < 3) { for (let i = 0; i < cnt && n < 3; i++, n++) spec.figs.push(fig); } }
    PICS.drawSpec(canvas, spec);
  };
  PICS.title = function (canvas) {
    const portrait = window.innerHeight > window.innerWidth;
    canvas.width = portrait ? 100 : 180; canvas.height = portrait ? 178 : 100;
    const cw = canvas.width, ch = canvas.height;
    PICS.drawSpec(canvas, { sky: 'dawn', far: 'mountains', ground: 'heath', gy: Math.round(ch * (portrait ? 0.42 : 0.58)), figs: [], seed: 3 });
    // Keilerstein auf der Kuppe, davor der Held und der graue Keiler
    const gy = Math.round(ch * (portrait ? 0.42 : 0.58));
    const sx = Math.round(cw * 0.62);
    for (let k = 0; k < 10; k++) R(sx - 14 + k, gy - 4 - k * 0.2, 28 - 2 * k, 1, '#7d6a64');
    R(sx - 4, gy - 30, 9, 28, '#8d857d'); R(sx - 4, gy - 30, 2, 28, '#b1a99f'); R(sx - 3, gy - 33, 7, 3, '#8d857d');
    R(sx - 1, gy - 24, 3, 2, '#5a524a'); R(sx - 2, gy - 18, 5, 1, '#5a524a');
    const hero = ART.heroDoll(G && G.daughter, 'spear');
    const hs = portrait ? 40 : 34;
    g.drawImage(hero, Math.round(cw * 0.12), Math.round(gy + (portrait ? 6 : 2)), hs, hs);
    const boar = ART.figs.boar;
    if (boar) { g.save(); g.globalAlpha = 0.9; g.drawImage(boar, Math.round(cw * 0.5), Math.round(gy + (portrait ? 14 : 8)), 32, 32); g.restore(); }
  };
})();
