'use strict';
// ---------------------------------------------------------------- Begehbare Doerfer und Staedte
// Jede Ortschaft wird aus einer kurzen Beschreibung erzeugt: Gelaende, Palisade, Wege, Bauten, Orte (Spots).
const VILLAGES = {};
const VIL = {};
(function () {
  // Grundflaeche der grossen Bauten (in Feldern): [Breite, Hoehe, feste Zeilen von unten]
  const FOOT = {
    house1: [5, 5, 3], house2: [4, 5, 3], towerRound: [3, 7, 3], towerRoof: [3, 5, 3], fountain: [3, 3, 2], stall: [5, 5, 2],
    gate: [3, 2, 1], bigGate: [5, 3, 1], wall: [3, 6, 4], well: [3, 2, 1], log: [3, 1, 1], stump: [2, 2, 1], tentG: [2, 2, 1], tentB: [2, 2, 1],
    bigTree: [2, 2, 1], bench: [3, 2, 1], crates: [2, 3, 1], barrels: [2, 2, 1], dock: [3, 2, 0], statue: [2, 3, 1], cave: [3, 3, 1],
    banner: [1, 2, 1], fence: [2, 1, 1], post: [1, 1, 1],
  };
  function propImg(k) { return ART.big[k] || ART.figs[k] || ART.poi[k]; }
  VIL.build = function (id) {
    const V = VILLAGES[id];
    const W = V.w, H = V.h, rnd = seededRNG(V.seed || 7);
    const t = new Array(W * H).fill(V.ground || '.');
    const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = c; };
    const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? t[y * W + x] : 'X';
    // Flaechen mit ausgefransten Raendern
    for (const [c, x0, y0, w, h, rough] of (V.areas || [])) {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        const edge = Math.min(x - x0, x0 + w - 1 - x, y - y0, y0 + h - 1 - y);
        if (rough !== 0 && edge === 0 && rnd() < 0.35) continue;
        set(x, y, c);
      }
    }
    // Wasserlaeufe (Polylinien)
    for (const wl of (V.water || [])) line(wl.pts, wl.c || 'w', wl.width || 1);
    // Palisade (Ellipse mit Toren)
    if (V.ring) {
      const { cx, cy, rx, ry, gates } = V.ring;
      for (let a = 0; a < Math.PI * 2; a += 0.01) {
        const x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry);
        const isGate = (gates || []).some(g => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) < 0.13);
        if (!isGate && get(x, y) !== 'w') set(x, y, V.ring.c || 'P');
      }
      // innen Dorfboden
      if (V.ring.inner) for (let y = cy - ry + 1; y < cy + ry; y++) for (let x = cx - rx + 1; x < cx + rx; x++) {
        if (((x - cx) / (rx - 0.6)) ** 2 + ((y - cy) / (ry - 0.6)) ** 2 < 1 && get(x, y) !== 'P') set(x, y, V.ring.inner);
      }
    }
    for (const [x, y, w, h] of (V.plaza ? [V.plaza] : [])) for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, 'H');
    for (const r of (V.roads || [])) line(r, '#', 1);
    for (const [c, x, y] of (V.tiles || [])) set(x, y, c);
    function line(pts, c, width) {
      for (let i = 0; i + 1 < pts.length; i++) {
        let [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1];
        while (x0 !== x1 || y0 !== y1) {
          for (let k = 0; k < width; k++) { if (Math.abs(x1 - x0) >= Math.abs(y1 - y0)) set(x0, y0 + k, c); else set(x0 + k, y0, c); }
          if (x0 !== x1 && (Math.abs(x1 - x0) >= Math.abs(y1 - y0) || y0 === y1)) x0 += Math.sign(x1 - x0); else y0 += Math.sign(y1 - y0);
        }
        for (let k = 0; k < width; k++) set(x1 + (Math.abs(x1 - pts[i][0]) >= Math.abs(y1 - pts[i][1]) ? 0 : k), y1 + (Math.abs(x1 - pts[i][0]) >= Math.abs(y1 - pts[i][1]) ? k : 0), c);
      }
    }
    // Bauten: Position = linke obere Ecke; Feste Felder
    const solid = new Uint8Array(W * H);
    const props = [];
    for (const pr of (V.props || [])) {
      const [k, x, y, opt] = pr;
      const img = propImg(k); if (!img) continue;
      const fw = FOOT[k] ? FOOT[k][0] : Math.ceil(img.width / 16), fh = FOOT[k] ? FOOT[k][1] : Math.ceil(img.height / 16);
      const solidRows = FOOT[k] ? FOOT[k][2] : 1;
      props.push({ img: k, x, y: y + fh - 1, z: (opt && opt.z) || 0 });
      if (!(opt && opt.walk)) for (let yy = y + fh - solidRows; yy < y + fh; yy++) for (let xx = x; xx < x + fw; xx++) if (xx >= 0 && yy >= 0 && xx < W && yy < H) solid[yy * W + xx] = 1;
      if (opt && opt.door) { const [dx, dy] = opt.door; solid[(y + dy) * W + x + dx] = 0; }
    }
    // Orte im Dorf
    for (const s of (V.spots || [])) {
      POI[s.id] = Object.assign({ map: id, r: 1, kind: 'spot' }, s);
      solid[s.y * W + s.x] = 0;
      if (t[s.y * W + s.x] === 'P' || t[s.y * W + s.x] === 'T') t[s.y * W + s.x] = 'H';
    }
    // Ausgaenge: begehbare Randfelder
    const exits = [], entries = [];
    const cx = W / 2, cy = H / 2;
    for (let x = 0; x < W; x++) for (const y of [0, H - 1]) addExit(x, y);
    for (let y = 1; y < H - 1; y++) for (const x of [0, W - 1]) addExit(x, y);
    function addExit(x, y) {
      const c = get(x, y);
      if (['~', 'w', 'o', 'M', 'P', 'X'].includes(c) || solid[y * W + x]) return;
      const dir = Math.atan2(y - cy, x - cx);
      exits.push({ x, y, dir });
      const ix = x === 0 ? 1 : x === W - 1 ? W - 2 : x, iy = y === 0 ? 1 : y === H - 1 ? H - 2 : y;
      if (!['~', 'w', 'o', 'M', 'P', 'X'].includes(get(ix, iy)) && !solid[iy * W + ix]) entries.push({ x: ix, y: iy, dir, road: c === '#' });
    }
    // Wege bevorzugt als Eingang
    entries.sort((a, b) => (b.road ? 1 : 0) - (a.road ? 1 : 0));
    MAPS[id] = {
      id, name: V.name, w: W, h: H, t: t.join(''), kind: 'village', props, solid, exits, entries: entries.length ? entries : [{ x: 1, y: 1, dir: 0 }],
      poi: V.poi, music: V.music || 'town', exitAt: (x, y) => x === 0 || y === 0 || x === W - 1 || y === H - 1,
    };
    if (POI[V.poi]) POI[V.poi].village = id;
  };

  // ---------------- Tannhag (nach Thilos Dorfskizze)
  VILLAGES.tannhag = {
    name: 'Tannhag', poi: 'tannhag', w: 32, h: 24, seed: 11, music: 'town',
    areas: [['T', 0, 0, 32, 3], ['T', 0, 0, 3, 9], ['D', 4, 0, 8, 2], [':', 3, 15, 6, 6], [':', 24, 6, 7, 4], ['L', 23, 16, 9, 7], ['T', 27, 0, 5, 5]],
    ring: { cx: 15, cy: 12, rx: 8, ry: 6, gates: [0, Math.PI, Math.PI / 2, -Math.PI / 2], inner: '.' },
    plaza: [12, 11, 7, 4],
    roads: [[[0, 13], [15, 13], [31, 12]], [[15, 13], [15, 23]], [[15, 11], [15, 3], [14, 0]], [[23, 12], [25, 6]]],
    props: [['house1', 12, 5, { door: [2, 4] }], ['house2', 8, 8], ['hs1', 19, 8], ['hs2', 9, 14], ['hs0', 20, 15], ['hs3', 18, 16], ['hs1', 11, 16],
      ['well', 14, 12, { walk: false }], ['hs2', 24, 3], ['log', 25, 5], ['log', 26, 6], ['banner', 23, 10],
      ['farmer', 17, 13], ['soldier', 24, 11], ['woman', 13, 15]],
    spots: [
      { id: 'tannhag_tor', name: 'Tor mit dem Bärenkopf', x: 23, y: 12 },
      { id: 'tannhag_gasthaus', name: 'Gasthaus am Dorfplatz', x: 14, y: 10, icon: null },
      { id: 'tannhag_platz', name: 'Dorfplatz', x: 15, y: 14 },
      { id: 'tannhag_alrike', name: 'Alrikes Holzstapel', x: 25, y: 7 },
      { id: 'tannhag_waldrand', name: 'Waldrand', x: 14, y: 3 },
    ],
  };
  // ---------------- Baliho (Viehmarkt, Rondra-Tempel, Haus der Travia)
  VILLAGES.baliho = {
    name: 'Baliho', poi: 'baliho', w: 36, h: 28, seed: 21, music: 'town', ground: '.',
    areas: [[':', 0, 0, 10, 8], [':', 27, 20, 9, 8], ['L', 28, 0, 8, 6], ['H', 8, 9, 20, 11, 0]],
    ring: { cx: 18, cy: 14, rx: 13, ry: 10, gates: [Math.PI, 0, Math.PI / 2], c: 'P', inner: null },
    roads: [[[0, 15], [35, 15]], [[18, 15], [18, 27]], [[18, 9], [18, 5]]],
    props: [['towerRoof', 16, 2], ['house1', 8, 6, { door: [2, 4] }], ['house2', 24, 6], ['stall', 10, 16], ['stall', 21, 16], ['fountain', 17, 12],
      ['hs0', 6, 17], ['hs1', 29, 12], ['hs2', 27, 17], ['hs3', 7, 12], ['fence', 25, 21], ['fence', 27, 21], ['fence', 29, 21],
      ['crates', 15, 19], ['barrels', 22, 20], ['knight', 19, 8], ['trader', 12, 14], ['man', 23, 13], ['dog', 26, 18], ['priest', 11, 11]],
    spots: [
      { id: 'baliho_tempel', name: 'Rondra-Tempel', x: 17, y: 7 },
      { id: 'baliho_gold', name: 'Goldschmied am Rindermarkt', x: 26, y: 11 },
      { id: 'baliho_markt', name: 'Markt: Waffen und Ausrüstung', x: 12, y: 21 },
      { id: 'baliho_vieh', name: 'Viehhändler aus dem Svellttal', x: 28, y: 22 },
      { id: 'baliho_travia', name: 'Haus der Travia', x: 10, y: 11 },
      { id: 'baliho_ring', name: 'Bärenringen auf dem Rindermarkt', x: 23, y: 22 },
      { id: 'baliho_west', name: 'Westtor', x: 5, y: 15 },
    ],
  };
  // ---------------- Lyrgach (nach Thilos Dorfplan)
  VILLAGES.lyrgach = {
    name: 'Lyrgach', poi: 'lyrgach', w: 44, h: 31, seed: 33, music: 'gjalsk', ground: '.',
    areas: [['T', 27, 0, 17, 31], ['D', 34, 0, 10, 31], ['T', 2, 1, 8, 4], [':', 11, 1, 9, 5], ['h', 1, 10, 7, 12], ['h', 0, 0, 2, 31],
      ['L', 1, 24, 12, 7], ['T', 10, 22, 4, 3], ['h', 29, 0, 0, 0]],
    water: [{ pts: [[23, 0], [24, 7], [25, 13], [26, 20], [27, 30]], c: 'w', width: 2 }],
    roads: [[[20, 0], [19, 4], [18, 10], [18, 16]], [[18, 16], [14, 21], [10, 26], [5, 30]], [[18, 16], [22, 15]], [[15, 15], [11, 12], [8, 8]]],
    props: [['house1', 16, 11, { door: [2, 4] }], ['house1', 12, 16, { door: [2, 4] }], ['house2', 20, 18], ['house2', 21, 8], ['house2', 7, 15],
      ['hs3', 9, 9], ['stones', 6, 5], ['barrow', 18, 4], ['dock', 22, 14, { walk: true }], ['barrels', 20, 13],
      ['fence', 8, 19], ['fence', 10, 19], ['fence', 12, 21], ['fence', 4, 25], ['fence', 6, 25], ['fence', 8, 25], ['fence', 4, 29], ['fence', 8, 29],
      ['oldwoman', 15, 22], ['child', 17, 21], ['gjalsk', 20, 16], ['gjalskW', 19, 11], ['shaman', 10, 16], ['dog', 11, 21], ['boar', 3, 27]],
    spots: [
      { id: 'lyrgach_megrim', name: 'Megrims Langhaus', x: 18, y: 16 },
      { id: 'lyrgach_dundoch', name: 'Dundochs Langhaus', x: 14, y: 21 },
      { id: 'lyrgach_morghinach', name: 'Morghinachs Hütte', x: 9, y: 15 },
      { id: 'lyrgach_pferche', name: 'Pferche', x: 10, y: 18 },
      { id: 'lyrgach_boote', name: 'Netze und Boote', x: 22, y: 16 },
      { id: 'lyrgach_keilerstein', name: 'Keilerstein', x: 7, y: 7 },
      { id: 'lyrgach_schwitz', name: 'Schwitzhütte', x: 10, y: 11 },
      { id: 'lyrgach_grab', name: 'Dundochs Steinhügel', x: 19, y: 6 },
      { id: 'lyrgach_hochweide', name: 'Hochweide mit Pferch', x: 7, y: 27 },
      { id: 'lyrgach_waeldchen', name: 'Wäldchen unter der Hochweide', x: 12, y: 24 },
    ],
  };
  // Kleine Haeuser als Bauten verfuegbar machen
  VIL.prepare = function () {
    ART.house.std.forEach((c, i) => { ART.big['hs' + i] = c; });
    ART.house.orc.forEach((c, i) => { ART.big['ho' + i] = c; });
  };
})();
