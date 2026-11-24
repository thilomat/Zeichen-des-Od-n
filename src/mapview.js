'use strict';
// ---------------------------------------------------------------- Karte mit Nebel (Pergament-Stil)
const MAPVIEW = {};
(function () {
  const COL = {
    '~': '#7fa9c9', 'w': '#4f86bf', 'o': '#4f86bf', 'f': '#8fb5d8', '=': '#8a6a45', '.': '#b9c98f', ',': '#ddcf8f', 'h': '#b49aa0', 'T': '#6f9a6a', 'D': '#4f7a4f',
    'L': '#a5c27f', 'b': '#9aa982', 's': '#8a957a', 'm': '#93ab9a', '^': '#c8b58a', 'M': '#8a8580', 'p': '#bdb3a2', '#': '#9a6a3a', 'd': '#7a5a3a', ':': '#d8c47f', 'c': '#e4d7a8', 'H': '#a0402c', 'P': '#6b4a2b',
  };
  let base = null;
  // Orte, die Yurrgold aus der Kartenskizze im Buch kennt
  const MAJOR = ['tannhag', 'baliho', 'gashok', 'lowangen', 'neulowangen', 'svellmia', 'tiefhusen', 'tjolmar', 'enqui', 'niellyn', 'lyrgach', 'knochenfeld'];
  function buildBase() {
    const m = MAPS.world, c = ART.cv(m.w, m.h), g = c.getContext('2d');
    const img = g.createImageData(m.w, m.h), d = img.data;
    for (let i = 0; i < m.w * m.h; i++) {
      const hex = COL[m.t[i]] || '#ff00ff', n = parseInt(hex.slice(1), 16);
      const v = (hash2(i % m.w, Math.floor(i / m.w)) - 0.5) * 14;
      d[i * 4] = clamp((n >> 16) + v, 0, 255); d[i * 4 + 1] = clamp(((n >> 8) & 255) + v, 0, 255); d[i * 4 + 2] = clamp((n & 255) + v, 0, 255); d[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    base = c;
  }
  MAPVIEW.open = function () {
    if (!base) buildBase();
    const m = MAPS.world, S = 2;
    const cnv = ART.cv(m.w * S, m.h * S), g = cnv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(base, 0, 0, m.w * S, m.h * S);
    // Nebel
    const fogC = ART.cv(m.w, m.h), fg = fogC.getContext('2d'), fd = fg.createImageData(m.w, m.h);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const i = (y * m.w + x) * 4;
      if (!ENG.isSeen(x, y)) { fd.data[i] = 214; fd.data[i + 1] = 196; fd.data[i + 2] = 150; fd.data[i + 3] = 165; }
    }
    fg.putImageData(fd, 0, 0);
    g.drawImage(fogC, 0, 0, m.w * S, m.h * S);
    // Orte
    g.font = 'bold 11px Georgia, serif'; g.textBaseline = 'middle';
    for (const id in POI) {
      const p = POI[id];
      if (p.map !== 'world') continue;
      const known = ENG.isSeen(p.x, p.y) || G.visited[id] || G.target === id || MAJOR.includes(id);
      if (!known) continue;
      const big = ['village', 'town', 'city', 'orctown'].includes(p.kind);
      g.fillStyle = big ? '#8e2219' : '#2a1c12';
      g.beginPath(); g.arc(p.x * S + 1, p.y * S + 1, big ? 4 : 2.5, 0, 7); g.fill();
      if (big || G.target === id || G.visited[id]) {
        g.fillStyle = 'rgba(240,228,200,.85)'; const tw = g.measureText(p.name).width;
        g.fillRect(p.x * S + 6, p.y * S - 6, tw + 4, 13);
        g.fillStyle = '#2a1c12'; g.fillText(p.name, p.x * S + 8, p.y * S + 1);
      }
    }
    // Ziel und Held
    let hx = G.x, hy = G.y;
    if (G.map !== 'world' && G.villagePoi && POI[G.villagePoi]) { hx = POI[G.villagePoi].x; hy = POI[G.villagePoi].y; }
    if (G.target && POI[G.target]) {
      let p = POI[G.target]; if (p.map !== 'world' && MAPS[p.map] && POI[MAPS[p.map].poi]) p = POI[MAPS[p.map].poi];
      g.strokeStyle = '#ffd040'; g.lineWidth = 3; g.beginPath(); g.arc(p.x * S + 1, p.y * S + 1, 9, 0, 7); g.stroke();
      g.strokeStyle = '#1d1410'; g.lineWidth = 1; g.beginPath(); g.arc(p.x * S + 1, p.y * S + 1, 9, 0, 7); g.stroke();
    }
    g.fillStyle = '#1d1410'; g.beginPath(); g.arc(hx * S + 1, hy * S + 1, 6, 0, 7); g.fill();
    g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(hx * S + 1, hy * S + 1, 4, 0, 7); g.fill();
    // Panel
    const wrap = el('div', { style: 'overflow:auto;-webkit-overflow-scrolling:touch;max-height:calc(100vh - 210px);border:2px solid #6b4a2b;border-radius:6px;background:#d6c496' });
    cnv.style.width = (m.w * S) + 'px'; cnv.style.imageRendering = 'pixelated'; cnv.style.display = 'block';
    wrap.append(cnv);
    const f = document.createDocumentFragment();
    f.append(wrap);
    f.append(el('div', { style: 'font-size:13.5px;color:#5b4632;margin-top:8px;line-height:1.5' },
      el('span', { style: 'display:inline-block;width:10px;height:10px;border-radius:5px;background:#ffd27a;border:2px solid #1d1410;vertical-align:middle' }), ' du · ',
      el('span', { style: 'display:inline-block;width:12px;height:12px;border-radius:6px;border:3px solid #ffd040;vertical-align:middle' }), ' Ziel · ',
      el('span', { style: 'color:#8e2219' }, '●'), ' Ortschaft. Nicht maßstabsgetreu, nach Thilos Übersichtsskizze.'));
    if (G.target && POI[G.target]) f.append(el('div', { class: 'note' }, `Ziel: ${POI[G.target].name}`));
    UI.panel('Karte', f);
    requestAnimationFrame(() => { wrap.scrollLeft = hx * S - wrap.clientWidth / 2; wrap.scrollTop = hy * S - wrap.clientHeight / 2; });
  };
})();
