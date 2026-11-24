'use strict';
// ---------------------------------------------------------------- Hilfsfunktionen
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Zufall: Math.random, fuer Tests austauschbar
let RNG = Math.random;
function setRNG(fn) { RNG = fn; }
function seededRNG(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const W20 = () => 1 + Math.floor(RNG() * 20);
const W6 = () => 1 + Math.floor(RNG() * 6);
const rint = (a, b) => a + Math.floor(RNG() * (b - a + 1));
const pick = arr => arr[Math.floor(RNG() * arr.length)];
function chance(p) { return RNG() < p; }
// "1W+3", "2W6", "1W6+2", "3W6" -> Zahl
function rollExpr(expr) {
  const m = String(expr).replace(/\s/g, '').match(/^(\d*)W(\d*)([+-]\d+)?$/i);
  if (!m) return parseInt(expr, 10) || 0;
  const n = parseInt(m[1] || '1', 10), d = parseInt(m[2] || '6', 10), add = parseInt(m[3] || '0', 10);
  let s = 0; for (let i = 0; i < n; i++) s += 1 + Math.floor(RNG() * d);
  return s + add;
}
// deterministisches Rauschen pro Feld (fuer Kachel-Varianten)
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
// Text mit Absaetzen: Leerzeile = neuer Absatz, *fett*
function paras(text) {
  return String(text).trim().split(/\n\s*\n/).map(p => '<p>' + esc(p.trim()).replace(/\n/g, '<br>').replace(/\*(.+?)\*/g, '<b>$1</b>') + '</p>').join('');
}
function money(h) { // Heller -> Text
  const s = Math.floor(h / 10), r = h % 10;
  if (s && r) return s + ' S ' + r + ' H';
  if (s) return s + ' Silbertaler';
  return r + ' Heller';
}
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
