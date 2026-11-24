'use strict';
// ---------------------------------------------------------------- Welt, Bewegung, Zeit, Speichern
let G = null;            // Spielstand
const MAPS = {};         // Karten (Welt + Doerfer)
const POI = {};          // alle Orte: id -> {id,name,kind,map,x,y,r}
const CODES = '~wofs=.,hTDLbm^Mp#d:cHP';
const BLOCK = new Set(['~', 'w', 'o', 'M', 'P', 'X']);
const STEP_H = { '.': 2, ',': 2, 'h': 2.5, 'T': 2.5, 'D': 3.5, 'L': 2.5, 'b': 3, 's': 3.5, 'm': 4, '^': 3, 'p': 4, '#': 1.2, 'd': 1.5, ':': 2, 'c': 2.5, 'H': 0.5, '=': 1.2, 'f': 3 };
const HOURS_PER_DAY = 12;
const REGNAMES = { w: 'Herzogtum Weiden', m: 'Nebelmoor', s: 'Svellttal', o: 'Orkland', k: 'Brinasker Marschen', f: 'Firunswall', g: 'Gjalskerland', n: 'Nordmarken' };

const ENG = {};
(function () {
  // ---------------- Karten laden
  ENG.initMaps = function () {
    const W = WORLDDATA;
    MAPS.world = { id: 'world', name: 'Aventurien', w: W.w, h: W.h, t: W.tiles, reg: W.regions, kind: 'world' };
    for (const p of W.pois) POI[p.id] = Object.assign({ map: 'world', r: p.size ? Math.max(p.size[0], p.size[1]) / 2 + 0.5 : 1.5 }, p);
    if (typeof VILLAGES !== 'undefined') { VIL.prepare(); for (const id in VILLAGES) VIL.build(id); }
    // Kraeuter
    MAPS.world.herbs = W.herbs;
  };
  ENG.map = () => MAPS[G.map];
  ENG.tile = (m, x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h) ? 'X' : m.t[y * m.w + x];
  ENG.region = (x, y) => { const m = MAPS.world; return m.reg[y * m.w + x]; };
  ENG.passable = (m, x, y) => !BLOCK.has(ENG.tile(m, x, y)) && !(m.solid && m.solid[y * m.w + x]);

  // ---------------- Wegsuche (A*)
  ENG.path = function (m, sx, sy, tx, ty, maxN) {
    if (!ENG.passable(m, tx, ty)) return null;
    const W = m.w, start = sy * W + sx, goal = ty * W + tx;
    const g = new Map([[start, 0]]), came = new Map();
    const heap = [[0, start]];
    const push = (f, n) => { heap.push([f, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break;[heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (; ;) { const l = 2 * i + 1, r = l + 1; let s = i; if (l < heap.length && heap[l][0] < heap[s][0]) s = l; if (r < heap.length && heap[r][0] < heap[s][0]) s = r; if (s === i) break;[heap[s], heap[i]] = [heap[i], heap[s]]; i = s; } } return top; };
    let n = 0; maxN = maxN || 60000;
    while (heap.length) {
      const [, cur] = pop();
      if (cur === goal) break;
      if (++n > maxN) return null;
      const cx = cur % W, cy = (cur - cx) / W, cg = g.get(cur);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (!ENG.passable(m, nx, ny)) continue;
        const ni = ny * W + nx, ng = cg + (STEP_H[ENG.tile(m, nx, ny)] || 2);
        if (!g.has(ni) || ng < g.get(ni)) { g.set(ni, ng); came.set(ni, cur); push(ng + (Math.abs(nx - tx) + Math.abs(ny - ty)) * 1.0, ni); }
      }
    }
    if (!came.has(goal) && start !== goal) return null;
    const out = []; let c = goal;
    while (c !== start) { out.push([c % W, Math.floor(c / W)]); c = came.get(c); }
    return out.reverse();
  };
  ENG.pathCost = p => p ? p.reduce((s, [x, y]) => s + (STEP_H[ENG.tile(ENG.map(), x, y)] || 2), 0) : 0;
  // naechstes begehbares Feld
  ENG.nearestFree = function (m, x, y) {
    for (let r = 0; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (ENG.passable(m, x + dx, y + dy)) return [x + dx, y + dy];
    return [x, y];
  };

  // ---------------- Neues Spiel
  ENG.newGame = function (opts) {
    G = {
      v: 2, name: opts.name || 'Yurrgold', daughter: !!opts.daughter,
      le: HERO.max.le, au: HERO.max.au, ae: HERO.max.ae,
      day: 0, hours: 0, odun: 0, blut: 0, silver: 0, kw: [], inv: {}, weapon: 'Wanderstab', armor: null,
      flags: {}, fx: {}, journal: [], visited: {}, herbs: {}, map: 'world', x: POI.start.x, y: POI.start.y,
      sec: 1, step: 0, target: null, leg: null, companion: null, seen: '', stats: { fights: 0, won: 0, herbs: 0, hunts: 0 },
      settings: null, started: Date.now(), path: [1],
    };
    for (const it of START_ITEMS) G.inv[it] = 1;
    ENG.reveal(G.x, G.y, 8);
  };
  ENG.save = function () {
    if (!G) return;
    G.seen = ENG.packSeen();
    store.set('odun_save_v2', G);
  };
  ENG.load = function () {
    const s = store.get('odun_save_v2', null);
    if (!s || s.v !== 2) return false;
    G = s; ENG.unpackSeen(G.seen); return true;
  };
  // ---------------- Erkundet (Kartennebel)
  let SEEN = null;
  ENG.reveal = function (x, y, r) {
    if (G.map !== 'world') return;
    const m = MAPS.world; if (!SEEN) SEEN = new Uint8Array(m.w * m.h);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < m.w && yy < m.h) SEEN[yy * m.w + xx] = 1;
    }
  };
  ENG.isSeen = (x, y) => SEEN && SEEN[y * MAPS.world.w + x];
  ENG.packSeen = function () { if (!SEEN) return ''; let s = '', run = 0, cur = 0; for (let i = 0; i < SEEN.length; i++) { if (SEEN[i] === cur) run++; else { s += run.toString(36) + ','; cur = SEEN[i]; run = 1; } } return s + run.toString(36); };
  ENG.unpackSeen = function (s) {
    const m = MAPS.world; SEEN = new Uint8Array(m.w * m.h); if (!s) return;
    let i = 0, cur = 0; for (const part of s.split(',')) { const n = parseInt(part, 36); SEEN.fill(cur, i, i + n); i += n; cur ^= 1; }
  };

  // ---------------- Zeit
  ENG.addDays = function (n, quiet) {
    if (!n) return;
    G.day += n;
    if (!quiet) UI.toast(n > 0 ? `+${n} ${n === 1 ? 'Tag' : 'Tage'} · Tag ${G.day}` : `${n} Tage`);
    if (G.fx.einsNatur) delete G.fx.einsNatur;
    UI.hud();
  };
  ENG.addHours = function (h) {
    G.hours += h;
    while (G.hours >= HOURS_PER_DAY) { G.hours -= HOURS_PER_DAY; ENG.addDays(1); EXTRA.nightfall(); }
  };

  // ---------------- Bewegung
  const MOVE = { path: null, t: 0, speed: 7.5, onArrive: null };
  ENG.moving = () => !!MOVE.path;
  ENG.walkTo = function (tx, ty, onArrive) {
    const m = ENG.map();
    const p = ENG.path(m, G.x, G.y, tx, ty, G.map === 'world' ? 90000 : 8000);
    if (!p) { UI.toast('Dorthin führt kein Weg.'); return false; }
    if (!p.length) { MOVE.path = null; if (onArrive) onArrive(); ENG.onRest(); return true; }
    MOVE.path = p; MOVE.t = 0; MOVE.onArrive = onArrive || null; MOVE.target = [tx, ty];
    return true;
  };
  ENG.stop = function () { MOVE.path = null; MOVE.onArrive = null; };
  ENG.update = function (dt) {
    if (!MOVE.path || UI.busy()) return;
    MOVE.t += dt * MOVE.speed * (G.map === 'world' ? 1 : 0.8);
    while (MOVE.path && MOVE.t >= 1) {
      MOVE.t -= 1;
      if (!MOVE.path.length) { MOVE.path = null; break; }
      const [nx, ny] = MOVE.path.shift();
      const dx = nx - G.x; if (dx) G.face = dx < 0 ? -1 : 1;
      G.x = nx; G.y = ny; G.anim = (G.anim || 0) + 1;
      ENG.onStep();
      if (!MOVE.path) break;
      if (!MOVE.path.length) { const cb = MOVE.onArrive; MOVE.path = null; MOVE.onArrive = null; if (cb) cb(); ENG.onRest(); break; }
      if (UI.busy()) { break; }
    }
  };
  // Ein Schritt: Zeit, Nebel, Ausloeser
  ENG.onStep = function () {
    const m = ENG.map();
    if (G.map === 'world') {
      ENG.reveal(G.x, G.y, 7);
      const h = STEP_H[ENG.tile(m, G.x, G.y)] || 2;
      if (G.leg) {
        G.leg.walked += h;
        const allow = G.leg.direct * 1.35 + 3;
        if (G.leg.walked > allow) { const over = G.leg.walked - allow; G.leg.walked = allow; ENG.addHours(over); }
      } else ENG.addHours(h);
      // Region
      const r = ENG.region(G.x, G.y);
      if (r !== G.lastReg) { G.lastReg = r; UI.place(); }
      // Dorf betreten?
      for (const id in POI) {
        const p = POI[id];
        if (p.map === 'world' && p.village && MAPS[p.village] && Math.abs(G.x - p.x) <= (p.size ? p.size[0] / 2 : 1) && Math.abs(G.y - p.y) <= (p.size ? p.size[1] / 2 : 1)) {
          if (G.justLeft === id) continue;
          ENG.enterVillage(p.village, id); return;
        }
      }
      if (G.justLeft && POI[G.justLeft] && (Math.abs(G.x - POI[G.justLeft].x) > 6 || Math.abs(G.y - POI[G.justLeft].y) > 6)) G.justLeft = null;
      EXTRA.onStep();
    } else {
      const v = MAPS[G.map];
      if (v.exitAt && v.exitAt(G.x, G.y)) { ENG.leaveVillage(); return; }
    }
    STORY.checkArrival();
  };
  ENG.onRest = function () { STORY.checkArrival(true); ENG.save(); };

  // ---------------- Doerfer
  ENG.enterVillage = function (vid, poiId) {
    const v = MAPS[vid]; if (!v) return;
    ENG.stop();
    G.worldPos = [G.x, G.y];
    G.map = vid; G.villagePoi = poiId;
    // Eingang: naechster zur Herkunftsrichtung
    const p = POI[poiId];
    const dir = Math.atan2(G.worldPos[1] - p.y, G.worldPos[0] - p.x);
    let best = v.entries[0], bd = 9;
    for (const e of v.entries) { const d = Math.abs(Math.atan2(Math.sin(dir - e.dir), Math.cos(dir - e.dir))); if (d < bd) { bd = d; best = e; } }
    G.x = best.x; G.y = best.y;
    G.visited[poiId] = (G.visited[poiId] || 0) + 1;
    UI.place(); UI.toast(v.name);
    AUD.music(v.music || 'town');
    STORY.checkArrival(true);
    ENG.continueChain();
  };
  ENG.leaveVillage = function () {
    const v = MAPS[G.map]; const p = POI[G.villagePoi];
    ENG.stop();
    // Austritt: Richtung des Ausgangs
    const ex = v.exits.find(e => Math.abs(e.x - G.x) <= 1 && Math.abs(e.y - G.y) <= 1) || v.exits[0];
    const rad = (p.size ? Math.max(p.size[0], p.size[1]) / 2 : 1) + 2;
    const wx = Math.round(p.x + Math.cos(ex.dir) * rad), wy = Math.round(p.y + Math.sin(ex.dir) * rad);
    const [fx, fy] = ENG.nearestFree(MAPS.world, wx, wy);
    G.map = 'world'; G.x = fx; G.y = fy; G.justLeft = G.villagePoi; G.villagePoi = null;
    UI.place(); AUD.music(AUD.regionTheme());
    STORY.checkArrival(true);
    ENG.continueChain();
  };
  // Ist der Held an einem Ort?
  ENG.atPoi = function (id) {
    const p = POI[id]; if (!p) return false;
    if (p.map !== G.map) {
      // Dorf zaehlt als Ort des Dorfes
      if (G.map !== 'world' && G.villagePoi === id) return true;
      return false;
    }
    if (p.map === 'world' && p.village && MAPS[p.village]) return false; // erst im Dorf angekommen
    const r = p.r || 1.5;
    return Math.abs(G.x - p.x) <= r && Math.abs(G.y - p.y) <= r;
  };
  ENG.teleport = function (id) {
    const p = POI[id]; if (!p) return;
    ENG.stop();
    if (p.map === 'world') {
      if (G.map !== 'world') { G.map = 'world'; G.villagePoi = null; }
      const [x, y] = ENG.nearestFree(MAPS.world, p.x, p.y); G.x = x; G.y = y;
      ENG.reveal(G.x, G.y, 8);
      if (p.village && MAPS[p.village]) { ENG.enterVillage(p.village, id); return; }
    } else {
      G.map = p.map; G.villagePoi = MAPS[p.map].poi; const [x, y] = ENG.nearestFree(MAPS[p.map], p.x, p.y); G.x = x; G.y = y;
    }
    UI.place();
  };

  // ---------------- Kamera und Zeichnen
  const CAM = { x: 0, y: 0, scale: 3 };
  ENG.cam = CAM;
  let canvas, ctx, vw = 0, vh = 0;
  ENG.initCanvas = function () {
    canvas = $('#game'); ctx = canvas.getContext('2d');
    window.addEventListener('resize', ENG.resize); ENG.resize();
  };
  ENG.resize = function () {
    const z = (G && G.settings && G.settings.zoom) || (window.innerWidth < 500 ? 3 : 4);
    CAM.scale = z;
    vw = Math.ceil(window.innerWidth / z); vh = Math.ceil(window.innerHeight / z);
    canvas.width = vw; canvas.height = vh;
    canvas.style.width = (vw * z) + 'px'; canvas.style.height = (vh * z) + 'px';
    ctx.imageSmoothingEnabled = false;
  };
  ENG.toggleZoom = function () { G.settings = G.settings || {}; G.settings.zoom = CAM.scale === 3 ? 2 : CAM.scale === 2 ? 4 : 3; ENG.resize(); };
  ENG.screenToTile = function (cx, cy) {
    return [Math.floor((cx / CAM.scale + CAM.x) / TS), Math.floor((cy / CAM.scale + CAM.y) / TS)];
  };
  let T0 = 0;
  ENG.draw = function (time) {
    if (!G || !ART.ready) return;
    const m = ENG.map();
    // Kamera folgt (weich)
    const fx = (G.x + 0.5) * TS - vw / 2, fy = (G.y + 0.5) * TS - vh / 2 + 6;
    const k = MOVE.path ? 0.25 : 0.18;
    CAM.x += (fx - CAM.x) * k; CAM.y += (fy - CAM.y) * k;
    if (Math.abs(fx - CAM.x) > vw) { CAM.x = fx; CAM.y = fy; }
    CAM.x = clamp(CAM.x, -8, m.w * TS - vw + 8); CAM.y = clamp(CAM.y, -40, m.h * TS - vh + 60);
    const ox = Math.round(CAM.x), oy = Math.round(CAM.y);
    ctx.fillStyle = m.kind === 'world' ? '#2b4f7e' : '#3a5a2a'; ctx.fillRect(0, 0, vw, vh);
    const x0 = Math.max(0, Math.floor(ox / TS) - 1), y0 = Math.max(0, Math.floor(oy / TS) - 1);
    const x1 = Math.min(m.w - 1, Math.ceil((ox + vw) / TS) + 1), y1 = Math.min(m.h - 1, Math.ceil((oy + vh) / TS) + 2);
    const wf = Math.floor(time / 450) % 4;
    const objs = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const c = ENG.tile(m, x, y), sx = x * TS - ox, sy = y * TS - oy, hv = hash2(x, y);
      if (ART.water[c]) {
        ctx.drawImage(ART.water[c][(wf + ((x + y) & 3)) & 3], sx, sy);
        // Ufer
        ctx.fillStyle = 'rgba(235,248,255,.55)';
        if (!isWater(m, x, y - 1)) ctx.fillRect(sx, sy, 16, 2);
        if (!isWater(m, x, y + 1)) ctx.fillRect(sx, sy + 14, 16, 2);
        if (!isWater(m, x - 1, y)) ctx.fillRect(sx, sy, 2, 16);
        if (!isWater(m, x + 1, y)) ctx.fillRect(sx + 14, sy, 2, 16);
        continue;
      }
      if (c === '=') { ctx.drawImage(ART.bridge[wf], sx, sy); continue; }
      const gv = ART.ground[c] || ART.ground['.'];
      ctx.drawImage(gv[Math.floor(hv * gv.length)], sx, sy);
      // Objekte
      const ob = ART.obj[c];
      if (ob && (c !== 'L' || hv > 0.35) && (c !== '^' || hv > 0.5) && (c !== 's' || hv > 0.6) && (c !== 'm' || hv > 0.55) && (c !== 'b' || hv > 0.45)) {
        const img = ob[Math.floor(hash2(x + 7, y + 3) * ob.length)];
        objs.push([y * TS + 15, img, sx, sy + 16 - img.height]);
      }
      if (c === 'H' && m.kind === 'world') {
        const st = houseStyle(x, y); const img = ART.house[st][Math.floor(hv * ART.house[st].length)];
        if (hv > 0.25) objs.push([y * TS + 15, img, sx, sy - 2]);
      }
    }
    // Dorf-Bauten
    if (m.props) for (const pr of m.props) {
      const img = ART.big[pr.img] || ART.figs[pr.img] || ART.poi[pr.img];
      if (!img) continue;
      const sx = pr.x * TS - ox, sy = pr.y * TS - oy - img.height + TS;
      if (sx > vw + 100 || sy > vh + 100 || sx + img.width < -100 || sy + img.height < -100) continue;
      objs.push([pr.y * TS + 15 + (pr.z || 0), img, sx, sy]);
    }
    // Orte
    for (const id in POI) {
      const p = POI[id];
      if (p.map !== G.map || p.hidden) continue;
      if (p.x < x0 - 2 || p.x > x1 + 2 || p.y < y0 - 2 || p.y > y1 + 2) continue;
      let img = p.icon ? (ART.figs[p.icon] || ART.poi[p.icon] || ART.big[p.icon]) : ART.poi[p.kind];
      if (p.kind === 'orctown') img = null;
      if (img) objs.push([p.y * TS + 14, img, p.x * TS - ox + 8 - img.width / 2, p.y * TS - oy + 16 - img.height]);
    }
    // Kraeuter
    if (m.herbs) for (let i = 0; i < m.herbs.length; i++) {
      const h = m.herbs[i]; if (G.herbs[i]) continue;
      if (h.x < x0 || h.x > x1 || h.y < y0 || h.y > y1) continue;
      objs.push([h.y * TS + 8, ART.herb[h.k], h.x * TS - ox, h.y * TS - oy + 1]);
    }
    // Held
    const hs = ART.heroSprite();
    const bob = MOVE.path ? ((G.anim || 0) % 2) : 0;
    objs.push([G.y * TS + 15.5, 'hero', G.x * TS - ox, G.y * TS - oy - bob - 3, hs]);
    objs.sort((a, b) => a[0] - b[0]);
    for (const o of objs) {
      if (o[1] === 'hero') {
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(o[2] + 4, G.y * TS - oy + 13, 8, 2);
        if (G.face < 0) { ctx.save(); ctx.translate(o[2] + 16, o[3]); ctx.scale(-1, 1); ctx.drawImage(o[4], 0, 0); ctx.restore(); }
        else ctx.drawImage(o[4], o[2], o[3]);
      } else ctx.drawImage(o[1], Math.round(o[2]), Math.round(o[3]));
    }
    // Ziel-Markierung
    if (G.target && POI[G.target]) {
      const p = POI[G.target];
      if (p.map === G.map) {
        const tx = p.x * TS - ox + 8, ty = p.y * TS - oy - 6 + Math.sin(time / 250) * 2;
        drawMarker(tx, ty);
      } else if (G.map !== 'world' || (POI[p.map] && false)) { /* Ausgang zeigen */ }
      drawPointer(p, ox, oy, time);
    }
    if (MOVE.path && MOVE.path.length) {
      ctx.fillStyle = 'rgba(255,240,200,.75)';
      for (let i = 1; i < MOVE.path.length; i += 2) { const [x, y] = MOVE.path[i]; ctx.fillRect(x * TS - ox + 7, y * TS - oy + 7, 2, 2); }
      const [tx, ty] = MOVE.path[MOVE.path.length - 1];
      ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.strokeRect(tx * TS - ox + 2.5, ty * TS - oy + 2.5, 11, 11);
    }
    // Nebel im Moor, Daemmerung
    if (m.kind === 'world') {
      const r = ENG.region(G.x, G.y);
      if (r === 'm') { ctx.fillStyle = 'rgba(210,215,215,.22)'; ctx.fillRect(0, 0, vw, vh); }
      const late = clamp((G.hours - 8) / 4, 0, 1);
      if (late > 0) { ctx.fillStyle = `rgba(60,30,60,${late * 0.28})`; ctx.fillRect(0, 0, vw, vh); }
    }
  };
  function isWater(m, x, y) { const c = ENG.tile(m, x, y); return c === '~' || c === 'w' || c === 'o' || c === 'f' || c === '=' || c === 'X'; }
  function houseStyle(x, y) {
    for (const id of ['gashok']) { const p = POI[id]; if (p && Math.abs(x - p.x) < 8 && Math.abs(y - p.y) < 8) return 'orc'; }
    return 'std';
  }
  function drawMarker(x, y) {
    ctx.fillStyle = '#1d1410'; ctx.beginPath(); ctx.moveTo(x - 5, y - 9); ctx.lineTo(x + 5, y - 9); ctx.lineTo(x, y); ctx.fill();
    ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.moveTo(x - 3.5, y - 8); ctx.lineTo(x + 3.5, y - 8); ctx.lineTo(x, y - 2); ctx.fill();
  }
  // Pfeil am Bildrand zum Ziel
  function drawPointer(p, ox, oy, time) {
    let tx, ty;
    if (p.map === G.map) { tx = p.x * TS - ox + 8; ty = p.y * TS - oy; }
    else if (G.map !== 'world') { const v = MAPS[G.map]; const e = v.exits[0]; tx = e.x * TS - ox + 8; ty = e.y * TS - oy; }
    else if (POI[MAPS[p.map] && MAPS[p.map].poi]) { const q = POI[MAPS[p.map].poi]; tx = q.x * TS - ox + 8; ty = q.y * TS - oy; }
    else return;
    if (tx > 10 && tx < vw - 10 && ty > 30 && ty < vh - 40) return;
    const cx = vw / 2, cy = vh / 2, a = Math.atan2(ty - cy, tx - cx);
    const r = Math.min(vw, vh) / 2 - 18;
    const px2 = cx + Math.cos(a) * r, py2 = cy + Math.sin(a) * r * 1.2;
    ctx.save(); ctx.translate(px2, clamp(py2, 40, vh - 70)); ctx.rotate(a);
    ctx.fillStyle = '#1d1410'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-5, -7); ctx.lineTo(-5, 7); ctx.fill();
    ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-3, -5); ctx.lineTo(-3, 5); ctx.fill();
    ctx.restore();
  }

  // ---------------- Eingabe
  ENG.initInput = function () {
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY, Date.now()]; AUD.unlock(); });
    canvas.addEventListener('pointerup', e => {
      if (!down || UI.busy()) { down = null; return; }
      const d = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null;
      if (d > 20) return;
      const [tx, ty] = ENG.screenToTile(e.clientX, e.clientY);
      ENG.tap(tx, ty);
    });
  };
  ENG.tap = function (tx, ty) {
    if (!G) return;
    ENG.chain = false;
    const m = ENG.map();
    if (tx === G.x && ty === G.y) { ENG.stop(); ENG.onRest(); return; }
    // Kraut antippen
    if (m.herbs) { const i = m.herbs.findIndex(h => h.x === tx && h.y === ty && !G.herbs[m.herbs.indexOf(h)]); if (i >= 0) { ENG.walkTo(tx, ty, () => EXTRA.herb(i)); return; } }
    let [x, y] = [tx, ty];
    if (!ENG.passable(m, x, y)) { [x, y] = ENG.nearestFree(m, x, y); }
    ENG.walkTo(x, y);
  };
  // Zum Ziel laufen (ganzer Weg, auch durch Dorfausgaenge)
  ENG.chain = false;
  function worldPos(id) {
    const p = POI[id]; if (!p) return null;
    if (p.map === 'world') return p;
    const vp = MAPS[p.map] && POI[MAPS[p.map].poi]; return vp || null;
  }
  ENG.walkToTarget = function () {
    if (!G.target) return;
    const p = POI[G.target]; if (!p) return;
    ENG.chain = true;
    if (p.map === G.map) { const [x, y] = ENG.nearestFree(ENG.map(), p.x, p.y); ENG.walkTo(x, y, () => { ENG.chain = false; }); return; }
    if (G.map !== 'world') {
      // Ausgang in Richtung des Ziels
      const v = MAPS[G.map], here = POI[G.villagePoi], wp = worldPos(G.target);
      let best = v.exits[0];
      if (here && wp) {
        const dir = Math.atan2(wp.y - here.y, wp.x - here.x); let bd = 9;
        for (const e of v.exits) { const d = Math.abs(Math.atan2(Math.sin(dir - e.dir), Math.cos(dir - e.dir))); if (d < bd) { bd = d; best = e; } }
      }
      ENG.walkTo(best.x, best.y); return;
    }
    const vp = worldPos(G.target); if (vp) { const [x, y] = ENG.nearestFree(MAPS.world, vp.x, vp.y); ENG.walkTo(x, y); }
  };
  ENG.continueChain = function () { if (ENG.chain && G.target && !UI.busy()) setTimeout(() => { if (ENG.chain && G.target && !ENG.moving()) ENG.walkToTarget(); }, 120); };
})();
