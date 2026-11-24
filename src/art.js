'use strict';
// ---------------------------------------------------------------- Pixel-Grafik
// Landschaft: "Zelda-like tilesets and sprites" von ArMM1998 (CC0)
// Figuren und Ergaenzungen: Kenney "Roguelike pack" und "Roguelike Characters pack" (CC0, kenney.nl)
// Tiere, Moor, Gebirge und Kleinkram: selbst gezeichnet
const TS = 16;
const ART = { ready: false };
(function () {
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  ART.cv = cv;
  const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const px = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  ART.rect = rect; ART.px = px;
  let S = {}; // geladene Bogen
  ART.load = function () {
    const jobs = Object.entries(SHEETS).map(([k, src]) => new Promise(res => { const im = new Image(); im.onload = () => { S[k] = im; res(); }; im.onerror = res; im.src = src; }));
    return Promise.all(jobs).then(() => { build(); ART.ready = true; });
  };
  // Ausschnitt: Bogen, Spalte, Zeile, Breite, Hoehe (in Feldern)
  function cut(sheet, c, r, w = 1, h = 1) {
    const st = sheet === 'ow' ? 16 : 17;
    const out = cv(w * 16, h * 16), g = out.getContext('2d');
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
      g.drawImage(S[sheet], (c + i) * st, (r + j) * st, 16, 16, i * 16, j * 16, 16, 16);
    return out;
  }
  ART.cut = cut;
  function layer(...cs) { const o = cv(cs[0].width, cs[0].height), g = o.getContext('2d'); cs.forEach(c => c && g.drawImage(c, 0, 0)); return o; }
  // Farbtonung: f(r,g,b,a) -> [r,g,b,a]
  function recolor(c, f) {
    const o = cv(c.width, c.height), g = o.getContext('2d'); g.drawImage(c, 0, 0);
    const d = g.getImageData(0, 0, o.width, o.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const r = f(a[i], a[i + 1], a[i + 2]); a[i] = r[0]; a[i + 1] = r[1]; a[i + 2] = r[2]; }
    g.putImageData(d, 0, 0); return o;
  }
  ART.recolor = recolor;
  const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
  const toneMap = (base, dark, light) => (r, g, b) => { const t = Math.min(1, Math.max(0, (lum(r, g, b) - 40) / 170)); return [0, 1, 2].map(k => Math.round(dark[k] + (light[k] - dark[k]) * t + (base[k] - (dark[k] + light[k]) / 2) * 0.15)); };
  const TONES = {
    steppe: toneMap([200, 180, 100], [120, 100, 45], [232, 214, 140]),
    heath: toneMap([140, 100, 110], [80, 55, 70], [178, 140, 150]),
    moor: toneMap([90, 92, 60], [48, 52, 34], [125, 128, 84]),
    marsh: toneMap([100, 128, 104], [52, 74, 64], [140, 168, 140]),
    dark: toneMap([60, 110, 60], [24, 60, 34], [92, 150, 80]),
    birch: toneMap([110, 130, 80], [60, 76, 44], [150, 170, 110]),
    snow: toneMap([230, 235, 240], [150, 160, 175], [255, 255, 255]),
    grey: toneMap([150, 150, 150], [70, 70, 75], [210, 210, 210]),
    pale: (r, g, b) => { const l = lum(r, g, b); return [l * 0.75 + 40, l * 0.85 + 40, l * 0.8 + 50]; },
    ghost: (r, g, b) => { const l = lum(r, g, b); return [l * 0.55 + 90, l * 0.7 + 90, l * 0.75 + 110]; },
    rust: (r, g, b) => [Math.min(255, r * 1.1 + 20), g * 0.75, b * 0.55],
  };
  ART.TONES = TONES;

  // ---------------- selbst gezeichnete Figuren (16x16, Kenney-Stil)
  const PAL = { k: '#1d1410', g: '#6c6c70', G: '#9a9aa0', w: '#d8d8dc', b: '#6a4428', B: '#8a5a34', d: '#3c2a1c', y: '#f2ead0', r: '#a0281c', e: '#ffd040', l: '#9bd0ff', L: '#e6f6ff', p: '#2d2d34', s: '#b9a18a', o: '#c07030', n: '#4a3a2a', v: '#5a5a64' };
  const ASCII = {
    wolf: [
      '................', '................', '..k.k...........', '.kgkgk..........', '.kGgGk..........', 'kgwgggkk........',
      'kpkgggggkkkkk...', '.kkgggggggggGk..', '...kgGGgggggggk.', '...kggggggggggk.', '...kgggkkkkgggk.', '...kgk.k..kgk.k.',
      '...kgk.k..kgk...', '...kk..kk.kk....', '................', '................'],
    bear: [
      '................', '..kk.....kk.....', '.kbbk...kbbk....', '.kbbbkkkkbbk....', '.kbbbbbbbbbk....', 'kbbdbbbbdbbbkkk.',
      'kbbbbbbbbbbbbbbk', 'kbsskbbbbbbbbbbk', '.kssbbbbbbbbbbbk', '..kkbbbbbbbbbbbk', '...kbbbbbbbbbbbk', '...kbbbkkkkbbbbk',
      '...kbbk...kbbbk.', '...kbbk...kbbk..', '...kkk....kkk...', '................'],
    boar: [
      '................', '................', '.....kk.........', '....kGGk........', '...kGggGkkkkkk..', '..kGgggggGGGGGk.',
      '.kggwgggggggggGk', 'kpggggggggggggGk', 'kpyggggggggggggk', '.kkygggggggggggk', '..kkggggggggggk.', '...kgggkkkkgggk.',
      '...kgk....kgk...', '...kgk....kgk...', '...kk.....kk....', '................'],
    piglet: [
      '................', '................', '................', '................', '.....kkkk.......', '....kbBbBkkkk...',
      '...kBwbBbBbBbk..', '..kpbbBbBbBbBk..', '..kpbbbbbbbbbk..', '...kkbbbbbbbk...', '....kbk..kbk....', '....kk...kk.....',
      '................', '................', '................', '................'],
    dog: [
      '................', '................', '................', '..kk............', '.kwwk...........', 'kwwdwkk.........',
      'kpwwwwwkkkkk....', '.kkwwdwwwddwk...', '...kwwwwwwwwk..k', '...kwdwwwdwwkkdk', '...kwwwkkkwwwkk.', '...kwk.k.kwk....',
      '...kwk...kwk....', '...kk....kk.....', '................', '................'],
    raven: [
      '................', '................', '................', '......kkk.......', '.....kpppk......', '....kpwpppk.....',
      '...oopppppk.....', '.....kppppppk...', '....kpppppppppk.', '....kppppppppk..', '.....kppppppk...', '......kpkpk.....',
      '......o..o......', '................', '................', '................'],
    wisp: [
      '................', '................', '.......L........', '......LlL.......', '.....LllL.......', '....LlllllL.....',
      '....lllLlll.....', '...LllLLLllL....', '...lllLLLlll....', '...LllLLLllL....', '....LlllllL.....', '.....LlllL......',
      '......LLL.......', '.......L........', '................', '................'],
    skull: [
      '................', '................', '................', '.....kkkkkk.....', '....kyyyyyyk....', '...kyyyyyyyyk...',
      '...kykkyykkyk...', '...kykkyykkyk...', '...kyyyyyyyyk...', '....kyykkyyk....', '....kyyyyyyk....', '.....kykyykk....',
      '......kkkk......', '................', '................', '................'],
    fire: [
      '................', '................', '................', '.......e........', '......eoe.......', '.....eoroe......',
      '.....eorroe.....', '....eorrroe.....', '....eorrrroe....', '.....eorroe.....', '...kdbdbbdbdk...', '..kbbdbbbdbbdk..',
      '...kkkkkkkkkk...', '................', '................', '................'],
  };
  function ascii(rows, pal) {
    const c = cv(16, 16), g = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.' && (pal || PAL)[ch]) px(g, x, y, (pal || PAL)[ch]); }));
    return c;
  }
  ART.ascii = ascii;

  // ---------------- Gebirge und Kleinkram (selbst gezeichnet)
  function mountain(v) {
    const c = cv(16, 24), g = c.getContext('2d');
    const peak = 2 + (v % 3), k = '#2b2622';
    for (let y = peak; y < 24; y++) {
      const w = Math.round((y - peak) * 0.45) + 1;
      for (let x = 8 - w; x <= 8 + w; x++) {
        let col = x < 8 ? '#8f8780' : '#6e6761';
        if (y < peak + 4) col = x < 8 ? '#f4f6f8' : '#cdd6de';
        px(g, x, y, (x === 8 - w || x === 8 + w) ? k : col);
      }
    }
    rect(g, 1, 23, 14, 1, k);
    px(g, 6, peak + 9, '#5d5753'); px(g, 10, peak + 12, '#5d5753'); px(g, 5, peak + 15, '#a7a097');
    return c;
  }
  function reeds(v) {
    const c = cv(16, 16), g = c.getContext('2d'), rnd = seededRNG(300 + v);
    for (let i = 0; i < 4; i++) { const x = 1 + Math.floor(rnd() * 14), h = 3 + Math.floor(rnd() * 4); rect(g, x, 15 - h, 1, h, '#a7a656'); px(g, x, 15 - h, '#6b4a2b'); }
    return c;
  }
  function puddles(v) {
    const c = cv(16, 16), g = c.getContext('2d'), rnd = seededRNG(500 + v);
    for (let i = 0; i < 2; i++) { const x = 1 + Math.floor(rnd() * 9), y = 2 + Math.floor(rnd() * 10); rect(g, x, y, 5, 2, '#34474a'); rect(g, x + 1, y, 3, 1, '#4c6a70'); }
    return c;
  }
  function heather(v) {
    const c = cv(16, 16), g = c.getContext('2d'), rnd = seededRNG(700 + v);
    for (let i = 0; i < 7; i++) { const x = Math.floor(rnd() * 15), y = Math.floor(rnd() * 15); px(g, x, y, '#b36fae'); px(g, x + 1, y, '#8f4f8b'); }
    return c;
  }
  function furrows(v) {
    const c = cv(16, 16), g = c.getContext('2d');
    rect(g, 0, 0, 16, 16, v % 2 ? '#a38c44' : '#8f7a3a');
    for (let y = 1; y < 16; y += 3) { rect(g, 0, y, 16, 1, v % 2 ? '#7d6a2e' : '#6c8a3a'); for (let x = (y + v) % 4; x < 16; x += 4) px(g, x, y - 1, '#c9b35c'); }
    return c;
  }
  function stakes() {
    const c = cv(16, 20), g = c.getContext('2d');
    for (let x = 0; x < 16; x += 3) { rect(g, x, 5, 2, 14, '#6b4a2b'); px(g, x, 4, '#3a2a1c'); rect(g, x, 5, 1, 14, '#8a6038'); }
    rect(g, 0, 11, 16, 1, '#3a2a1c');
    return c;
  }
  function miniHouse(style, v) {
    const c = cv(16, 18), g = c.getContext('2d'), k = '#2a1d14';
    const wall = style === 'orc' ? '#6b5a44' : (v % 2 ? '#c8a878' : '#b08a5a');
    const roof = style === 'orc' ? '#3c2c20' : style === 'stone' ? '#8a8a92' : (v % 3 ? '#9a6a32' : '#7a5228');
    rect(g, 3, 9, 10, 7, wall); rect(g, 2, 8, 12, 1, k); rect(g, 3, 15, 10, 1, '#5a4632');
    for (let y = 2; y < 9; y++) { const w = Math.min(7, y - 1); rect(g, 8 - w, y, w * 2, 1, roof); px(g, 8 - w, y, k); px(g, 7 + w, y, k); }
    rect(g, 7, 12, 2, 4, '#3a2a1c'); if (v % 2 === 0) rect(g, 4, 11, 2, 2, '#f0d48a');
    if (style === 'orc') { rect(g, 13, 0, 1, 10, '#3a2a1c'); rect(g, 10, 0, 3, 3, '#141414'); }
    return c;
  }

  // ---------------- Figuren aus Kenneys Baukasten
  function doll(parts, tone) {
    const c = cv(16, 16), g = c.getContext('2d');
    parts.forEach(([col, row]) => g.drawImage(S.kc, col * 17, row * 17, 16, 16, 0, 0, 16, 16));
    return tone ? recolor(c, tone) : c;
  }
  ART.doll = doll;
  const W_STAFF = [42, 0], W_SPEAR = [49, 0], W_AXE = [47, 0], W_SWORD = [44, 6], W_CLUB = [42, 1], W_BOW = [52, 0];
  function boarHelmet(base) {
    const c = cv(16, 16), g = c.getContext('2d'); g.drawImage(base, 0, 0);
    rect(g, 4, 0, 8, 3, '#d8d0b8'); rect(g, 3, 1, 1, 2, '#1d1410'); rect(g, 12, 1, 1, 2, '#1d1410'); rect(g, 4, 0, 8, 1, '#1d1410');
    px(g, 5, 2, '#1d1410'); px(g, 10, 2, '#1d1410'); px(g, 3, 3, '#f2ead0'); px(g, 12, 3, '#f2ead0');
    return c;
  }

  function build() {
    // Boden
    const grass = [[5, 9], [6, 9], [7, 9], [5, 10], [6, 10], [7, 10]].map(([c, r]) => cut('ow', c, r));
    const darkGrass = [[2, 16], [3, 16], [4, 16]].map(([c, r]) => cut('ow', c, r));
    const tone = (arr, t) => arr.map(x => recolor(x, TONES[t]));
    ART.ground = {
      '.': grass.slice(0, 4).concat([layer(grass[4], cut('ow', 0, 8)), layer(grass[5], cut('ow', 1, 8))]),
      'L': grass.slice(0, 4),
      'T': darkGrass.concat([grass[0]]),
      'D': tone(darkGrass, 'dark'),
      'b': tone(grass.slice(0, 3), 'birch'),
      's': tone(grass.slice(0, 4), 'moor').map((t, i) => i % 2 ? layer(t, puddles(i)) : t),
      'm': tone(grass.slice(0, 4), 'marsh').map((t, i) => layer(t, puddles(i + 7))),
      'h': tone(grass.slice(0, 4), 'heath').map((t, i) => layer(t, heather(i))),
      ',': tone(grass.slice(0, 4), 'steppe'),
      '^': tone(grass.slice(0, 3), 'steppe').map(t => recolor(t, (r, g, b) => [r * 0.8 + 20, g * 0.9 + 15, b * 0.8 + 10])),
      'M': [cut('kr', 7, 0), cut('kr', 7, 1)].map(t => recolor(t, TONES.grey)),
      'p': [cut('kr', 7, 0), cut('kr', 7, 1)],
      '#': [0, 1, 2].map(v => { const o = cut('ow', 1, 30), g = o.getContext('2d'), rnd = seededRNG(40 + v); for (let i = 0; i < 6; i++) px(g, Math.floor(rnd() * 16), Math.floor(rnd() * 16), i % 2 ? '#8a6a45' : '#c9a77a'); return o; }),
      'd': [cut('kr', 1, 26), cut('kr', 1, 27)],
      ':': [cut('ow', 0, 34), cut('ow', 1, 34), furrows(0), furrows(1)],
      'c': [cut('kr', 8, 0), cut('kr', 8, 1)],
      'H': [cut('ow', 1, 30), cut('kr', 6, 0)],
      'P': grass.slice(0, 2),
    };
    // Wasser (4 Bilder)
    const wf = [0, 1, 2, 3].map(i => cut('ow', i, 1));
    ART.water = {
      'w': wf, '~': wf.map(t => recolor(t, (r, g, b) => [r * 0.8, g * 0.85, b * 0.95])),
      'o': wf.map(t => recolor(t, (r, g, b) => [r * 0.75, g * 0.85, b * 0.9])),
      'f': wf.map(t => { const o = recolor(t, (r, g, b) => [Math.min(255, r * 1.25 + 30), Math.min(255, g * 1.15 + 25), b]); const g2 = o.getContext('2d'); [[3, 5], [10, 11], [12, 3], [6, 13]].forEach(([x, y]) => { rect(g2, x, y, 2, 2, '#9a938b'); px(g2, x, y, '#cfc7bb'); }); return o; }),
    };
    ART.bridge = [0, 1, 2, 3].map(i => { const o = cv(16, 16), g = o.getContext('2d'); g.drawImage(wf[i], 0, 0); g.drawImage(cut('kr', 1, 26), 0, 0); rect(g, 0, 0, 1, 16, '#3a2a1c'); rect(g, 15, 0, 1, 16, '#3a2a1c'); return o; });
    // Objekte
    ART.obj = {
      'T': [cut('kr', 16, 10, 1, 2), cut('kr', 18, 10, 1, 2), cut('kr', 16, 9), cut('kr', 18, 10, 1, 2)],
      'D': [cut('kr', 18, 10, 1, 2), cut('kr', 18, 10, 1, 2), recolor(cut('kr', 16, 10, 1, 2), TONES.dark)],
      'L': [cut('kr', 15, 10, 1, 2), cut('kr', 15, 9), cut('ow', 2, 14), cut('kr', 23, 10, 1, 2)],
      'b': [cut('kr', 27, 10, 1, 2), cut('kr', 27, 9), reeds(1)],
      's': [reeds(2), reeds(3)], 'm': [reeds(4), reeds(5)],
      '^': [cut('ow', 6, 5), cut('ow', 8, 5), cut('ow', 9, 5), cut('ow', 7, 5)],
      'M': [0, 1, 2, 3].map(mountain),
      'P': [stakes()],
    };
    ART.house = { std: [0, 1, 2, 3].map(v => miniHouse('std', v)), orc: [0, 1, 2, 3].map(v => miniHouse('orc', v)), stone: [0, 1].map(v => miniHouse('stone', v)) };
    // Grosse Bauten fuer Doerfer
    ART.big = {
      house1: cut('ow', 6, 0, 5, 5), house2: cut('ow', 11, 0, 4, 5), towerRound: cut('ow', 0, 21, 3, 7), towerRoof: cut('ow', 3, 22, 3, 5),
      fountain: cut('ow', 22, 9, 3, 3), stall: cut('ow', 19, 23, 5, 5), gate: cut('ow', 7, 27, 3, 2), bigGate: cut('ow', 4, 31, 5, 3),
      wall: cut('ow', 22, 0, 3, 6), well: cut('ow', 6, 22, 3, 2), log: cut('ow', 3, 5, 3, 1), stump: cut('ow', 31, 3, 2, 2),
      tentG: cut('kr', 46, 10, 2, 2), tentB: cut('kr', 48, 10, 2, 2), bigTree: cut('ow', 5, 16, 2, 2), bench: cut('ow', 28, 4, 3, 2),
      crates: cut('ow', 30, 0, 2, 3), barrels: cut('ow', 33, 0, 2, 2), dock: cut('ow', 6, 6, 3, 2), statue: cut('ow', 8, 31, 2, 3),
      cave: cut('ow', 11, 31, 3, 3), banner: cut('ow', 5, 27, 1, 2), fence: cut('ow', 2, 17, 2, 1), post: cut('ow', 0, 17),
    };
    // Ortssymbole auf der Weltkarte
    const sign = cut('kr', 19, 0), grave = cut('kr', 52, 9), cross = cut('kr', 53, 9);
    ART.poi = {
      hill: layer(cut('ow', 6, 5), cut('ow', 9, 5)), kiln: ascii(ASCII.fire), hut: miniHouse('std', 3), snare: cut('kr', 20, 9),
      shrine: layer(cut('kr', 51, 10), ascii(ASCII.raven)), tower: miniHouse('stone', 1), grove: cut('kr', 14, 9),
      sign, ford: null, bank: null, moor: reeds(9), rock: cut('ow', 10, 5), creek: null, spring: cut('ow', 2, 0),
      ruin: layer(cut('ow', 8, 5), cross), field: layer(grave, cut('kr', 53, 9)), pass: cut('ow', 7, 5),
      stones: layer(cut('ow', 36, 5)), tent: cut('kr', 46, 10, 2, 2), orccamp: cut('kr', 48, 10, 2, 2), camp: ascii(ASCII.fire),
      barrow: cut('ow', 31, 3, 2, 2), cave: cut('ow', 11, 31, 3, 3), bay: cut('ow', 6, 6, 3, 2),
      village: cut('ow', 5, 27, 1, 2), town: cut('ow', 6, 27, 1, 2), city: cut('ow', 6, 27, 1, 2), orctown: null,
    };
    ART.herb = {};
    const hc = { wirsel: '#7cc0e8', einbeere: '#2c2c6c', gulmond: '#f2d04a', belmart: '#e8e8f0', vierblatt: '#5a2aa0' };
    for (const k in hc) { const c = cv(16, 16), g = c.getContext('2d'); rect(g, 7, 9, 1, 6, '#3d6b2a'); rect(g, 4, 12, 3, 1, '#4f8a35'); rect(g, 9, 11, 3, 1, '#4f8a35'); rect(g, 6, 7, 3, 3, hc[k]); px(g, 6, 7, '#ffffff'); px(g, 7, 6, '#1d1410'); ART.herb[k] = c; }
    // Figuren
    const SON = [[0, 0], [6, 7], [26, 1], [23, 3]], DAU = [[1, 0], [6, 7], [24, 1]];
    ART.heroDoll = (daughter, weapon) => doll((daughter ? DAU : SON).concat(weapon === 'spear' ? [W_SPEAR] : weapon === 'axe' ? [W_AXE] : weapon === 'none' ? [] : [W_STAFF]));
    const orc = (w, cl) => doll([[0, 3], cl || [9, 4], [23, 4], w || W_AXE]);
    ART.figs = {
      orc: orc(W_AXE), orcSpear: orc(W_SPEAR, [17, 4]), orcClub: orc(W_CLUB, [13, 4]),
      khurgash: boarHelmet(orc(W_AXE, [17, 4])),
      man: doll([[0, 1], [7, 4], [19, 0], W_CLUB]), farmer: doll([[0, 0], [10, 6], [19, 1]]), woman: doll([[1, 0], [11, 2], [20, 1]]),
      oldwoman: doll([[1, 0], [15, 2], [20, 9]]), oldman: doll([[0, 0], [11, 6], [21, 8], [22, 8]]), child: doll([[1, 1], [8, 6], [24, 2]]),
      soldier: doll([[0, 0], [12, 4], [28, 0], W_SPEAR]), knight: doll([[0, 0], [10, 4], [30, 1], W_SPEAR]), deserter: doll([[0, 1], [11, 7], [19, 0], W_SWORD]),
      trader: doll([[0, 0], [8, 0], [19, 4], [22, 6]]), charburner: doll([[0, 2], [14, 7], [23, 4], [25, 6]]),
      thorwal: doll([[0, 0], [10, 4], [22, 5], [19, 7], W_AXE]), nivese: doll([[0, 1], [9, 4], [24, 4]]), gjalsk: doll([[0, 0], [6, 7], [24, 1], [26, 3], W_SPEAR]),
      gjalskW: doll([[1, 0], [6, 7], [24, 1], W_SPEAR]), shaman: doll([[0, 0], [9, 4], [21, 8], [22, 8], W_STAFF]), mage: doll([[0, 0], [14, 0], [28, 2], [44, 0]]),
      priest: doll([[1, 0], [16, 2], [20, 9]]), archer: doll([[1, 0], [6, 5], [20, 5], W_BOW]),
      corpse: doll([[0, 3], [13, 9], [23, 6]], TONES.moor), ghost: doll([[0, 0], [6, 7], [26, 1], [23, 3]], TONES.ghost),
      skeleton: doll([[0, 0], [10, 9]], TONES.pale),
      wolf: ascii(ASCII.wolf), bear: ascii(ASCII.bear), boar: ascii(ASCII.boar), piglet: ascii(ASCII.piglet), dog: ascii(ASCII.dog),
      raven: ascii(ASCII.raven), wisp: ascii(ASCII.wisp), skull: ascii(ASCII.skull), fire: ascii(ASCII.fire),
      leech: ascii(['................', '................', '................', '................', '................', '....kkkkkkk.....', '...kpvvvvvvk....', '..kpvvpvvvvvkk..', '..kvvvvvvpvvvk..', '...kkvvvvvvvk...', '.....kkkkkkk....', '................', '................', '................', '................', '................']),
    };
    // Spieler: Bilder je Waffe (Sohn/Tochter)
    ART.hero = {};
  };
  ART.heroSprite = function () {
    const key = (G.daughter ? 'T' : 'S') + (G.weapon || 'Wanderstab');
    if (!ART.hero[key]) {
      const w = G.weapon || 'Wanderstab';
      const kind = /Speer|Spieß|Saufeder/.test(w) ? 'spear' : /Arbach|Orknase|Axt/.test(w) ? 'axe' : w === 'Fäuste' ? 'none' : 'staff';
      ART.hero[key] = ART.heroDoll(G.daughter, kind);
    }
    return ART.hero[key];
  };
})();
