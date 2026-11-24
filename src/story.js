'use strict';
// ---------------------------------------------------------------- Spielbuch-Abschnitte ausfuehren
const MECH = {};      // Abschnitt -> Schritte
const SECLOC = {};    // Abschnitt -> Ortsangabe fuer Bilder/Musik
function M(n, ...steps) { MECH[n] = steps; }
const C = (label, ...steps) => ({ type: 'choice', label, steps });
const CI = (cond, label, ...steps) => ({ type: 'choice', label, steps, cond });
const CS = (spot, label, ...steps) => ({ type: 'choice', label, steps, spot });   // Wahl an einem Ort im Dorf
const LOC = {};       // Abschnitt -> Ort, zu dem man erst laufen muss
function applyLoc() { for (const n in LOC) { const m = MECH[n]; if (m && m[0] !== '@' + LOC[n]) m.unshift('@' + LOC[n]); } }
const P = (skill, mod, ok, no, o) => Object.assign({ type: 'probe', skill, mod: mod || 0, ok: ok || [], no: no || [] }, o || {});
const TR = (trait, keep, seized, resisted, o) => Object.assign({ type: 'trait', trait, keep: keep || [], seized: seized || [], resisted }, o || {});
const Z = (spell, ok, no, o) => Object.assign({ type: 'spell', spell, ok: ok || [], no: no || [] }, o || {});
const F = (spec, win, lose, timeout) => ({ type: 'fight', spec, win: win || [], lose: lose || [], timeout });
const IF = (cond, then, els) => ({ type: 'if', cond, then: then || [], els: els || [] });
const SHOP = (items, o) => Object.assign({ type: 'shop', items }, o || {});
const PIC = (spec) => ({ type: 'pic', spec });
const GIVE = (items) => ({ type: 'give', items });

const STORY = {};
(function () {
  // ---------------- Text
  const base = n => parseInt(n, 10);
  function sentences(n) { return BOOK[base(n)] || []; }
  function tochter(n, text) {
    n = base(n);
    if (!G.daughter || !BOOK_T[n]) return text;
    for (const [o, nw] of BOOK_T[n]) if (text.includes(o)) text = text.replace(o, nw);
    return text;
  }
  STORY.tochter = tochter;
  // Anweisungen am Satzende entfernen
  function stripTail(s) {
    s = s.replace(/\s*:\s*Lies (?:weiter )?(?:dann )?(?:ebenfalls )?bei \d+(?: weiter)?\.?/g, '.');
    s = s.replace(/[,;]?\s*(?:und |dann )?lies (?:dann )?(?:ebenfalls |weiter )*(?:bei|weiter bei) \d+(?: weiter)?\.?/gi, '.');
    s = s.replace(/\s*Lies (?:dann )?(?:ebenfalls )?(?:weiter )?bei \d+(?: weiter)?\.?/g, '');
    // angehaengte Anweisung nach einem Zitat ("... “ Notiere dir ...")
    s = s.replace(/([“”!?.])\s+(?:Notiere|Zähle|Streiche|Du erhältst|Du verlierst|Ist Caithra|[A-ZÄÖÜ][a-zäöüß]+st du)\b[^„“]*$/, '$1');
    s = s.replace(/\.\./g, '.').replace(/\s+\./g, '.').trim();
    return s;
  }
  STORY.stripTail = stripTail;
  // Bedingungs-Anfang entfernen und Satzstellung drehen
  const PRON = { er: 'Er', sie: 'Sie', es: 'Es', ihr: 'Ihr', er: 'Er' };
  function cleanOutcome(s) {
    s = stripTail(s);
    s = s.replace(/^(?:Gelingt|Misslingt) (?:sie|er|es|der Zauber|die Probe|ihm das|dir das)(?: oder [^,]+)?,\s*/, '');
    s = s.replace(/^(?:Würfelst du [^,:]+|Hast du [^,:]+|Gewinnst du|Verlierst du|Sonst|Falls [^,]+|Wenn [^,]+|Lässt du [^,]+|Erschlägst du [^,]+|Willst du [^,]+|Sinken [^,]+|Ist Caithra bei dir|War Caithra bei dir|Habt ihr gewonnen)[,:]\s*/, '');
    if (/^lies\b/i.test(s) || !s) return '';
    let m;
    if ((m = s.match(/^(\S+) du (.*)$/))) s = 'Du ' + m[1] + ' ' + m[2];
    else if ((m = s.match(/^(\S+) (er|sie|es|ihr) (.*)$/))) s = PRON[m[2]] + ' ' + m[1] + ' ' + m[3];
    else if ((m = s.match(/^(\S+) (dich|dir|euch|ihn|ihm) (die|der|das|den|ein|eine|einen|dein|deine) (\S+)(.*)$/))) s = cap(m[3]) + ' ' + m[4] + ' ' + m[1] + ' ' + m[2] + m[5];
    else if ((m = s.match(/^(\S+) (dein|deine|der|die|das|ein|eine|einer|dein|sein|seine|ihr|ihre) (\S+)(.*)$/))) s = cap(m[2]) + ' ' + m[3] + ' ' + m[1] + m[4];
    else s = cap(s);
    return s;
  }
  STORY.cleanOutcome = cleanOutcome;
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
  function choiceLabel(s) {
    s = s.replace(/[,;:]\s*(?:notiere|zähle|lies|lege|streiche|würfle|Lies|wenn der Zauber|sonst)\b.*$/s, '');
    s = s.replace(/\s*\(.*?Silbertaler[^)]*\)/, '');
    s = s.trim().replace(/[.:,]$/, '');
    if (!/[?!]$/.test(s)) s += '?';
    return s;
  }
  STORY.choiceLabel = choiceLabel;
  function rangeIdx(spec) {
    const out = [];
    for (const part of spec.split(',')) {
      const [a, b] = part.split('-').map(Number);
      for (let i = a; i <= (isNaN(b) ? a : b); i++) out.push(i);
    }
    return out;
  }
  // Text aus Satznummern
  STORY.text = function (n, spec, clean) {
    const S = sentences(n), idx = rangeIdx(spec);
    const paras = []; let cur = '';
    idx.forEach((i, k) => {
      if (!S[i]) return;
      let t = clean ? cleanOutcome(S[i][0]) : stripTail(S[i][0]);
      if (!t) return;
      if (S[i][1] && k > 0 && cur) { paras.push(cur); cur = ''; }
      cur = cur ? cur + ' ' + t : t;
    });
    if (cur) paras.push(cur);
    return paras.map(p => tochter(n, p));
  };
  STORY.label = function (n, lab) {
    if (/^t\d+$/.test(lab)) { const S = sentences(n)[+lab.slice(1)]; return S ? tochter(n, choiceLabel(S[0])) : lab; }
    return lab;
  };

  // ---------------- Bedingungen
  STORY.cond = function (c) {
    if (!c) return true;
    if (typeof c === 'function') return c();
    return c.split('&').every(part => {
      part = part.trim(); let neg = false;
      if (part[0] === '!') { neg = true; part = part.slice(1); }
      let r = false, m;
      if ((m = part.match(/^k:(.+)$/))) r = G.kw.includes(m[1]);
      else if ((m = part.match(/^i:(.+)$/))) r = (G.inv[itemId(m[1])] || 0) > 0;
      else if ((m = part.match(/^f:(.+)$/))) r = !!G.flags[m[1]];
      else if ((m = part.match(/^ctx:(.+)$/))) r = G.ctx === m[1];
      else if ((m = part.match(/^(s|o|b|day|le|au|ae)(>=|<=|>|<|=)(\d+)$/))) {
        const v = { s: G.silver, o: G.odun, b: G.blut, day: G.day, le: G.le, au: G.au, ae: G.ae }[m[1]], n = +m[3];
        r = m[2] === '>=' ? v >= n : m[2] === '<=' ? v <= n : m[2] === '>' ? v > n : m[2] === '<' ? v < n : v === n;
      }
      else if (part === 'comp') r = !!G.companion;
      else if (part === 'armed') r = R.weapon().id !== 'Fäuste';
      else if ((m = part.match(/^foe:(\w+)<=(\d+)$/))) r = !!(G.persist && G.persist[m[1]] !== undefined && G.persist[m[1]] <= +m[2]);
      else if (part === 'daughter') r = G.daughter;
      return neg ? !r : r;
    });
  };

  // ---------------- Effekte
  function dice(v) { return /W/.test(v) ? rollExpr(v) : parseInt(v, 10); }
  STORY.fx = function (s) {
    let m;
    if ((m = s.match(/^d(-?\d+)$/))) { ENG.addDays(+m[1], true); return `Tag ${G.day} (${+m[1] > 0 ? '+' : ''}${m[1]})`; }
    if ((m = s.match(/^dmin(\d+)$/))) { if (G.day < +m[1]) { const d = +m[1] - G.day; ENG.addDays(d, true); return `Tag ${G.day} (+${d})`; } return null; }
    if ((m = s.match(/^h(\d+)$/))) { ENG.addHours(+m[1]); return null; }
    if (s === 'qpool') { G.questPool = Math.min(3, Math.floor(G.odun / 2)); return `Zeichen des Odûn für die Queste: ${G.questPool} Erleichterung${G.questPool === 1 ? '' : 'en'}`; }
    if ((m = s.match(/^next:(.+):(-?\d+)$/))) { G.nextMod = G.nextMod || {}; G.nextMod[m[1]] = (G.nextMod[m[1]] || 0) + +m[2]; return null; }
    if ((m = s.match(/^o(-?\d+)$/))) { G.odun = Math.max(0, G.odun + +m[1]); AUD.sfx(+m[1] > 0 ? 'odun' : 'fail'); return `${+m[1] > 0 ? '+' : ''}${m[1]} Zeichen des Odûn (jetzt ${G.odun})`; }
    if ((m = s.match(/^b(-?\d+)$/))) { G.blut = Math.max(0, G.blut + +m[1]); AUD.sfx('blut'); return `${+m[1] > 0 ? '+' : ''}${m[1]} Blutdurst (jetzt ${G.blut})`; }
    if ((m = s.match(/^k:(.+)$/))) { if (!G.kw.includes(m[1])) G.kw.push(m[1]); return `Schlüsselwort: ${m[1]}`; }
    if ((m = s.match(/^k-:(.+)$/))) { G.kw = G.kw.filter(k => k !== m[1]); return null; }
    if ((m = s.match(/^s([+-=])(\d+(?:\.\d+)?)$/))) {
      const v = +m[2]; if (m[1] === '=') G.silver = v; else G.silver = Math.max(0, Math.round((G.silver + (m[1] === '+' ? v : -v)) * 10) / 10);
      AUD.sfx('coin'); return `${m[1] === '-' ? '−' : '+'}${v} Silbertaler (jetzt ${G.silver})`;
    }
    if ((m = s.match(/^i([+-])(\d*):(.+)$/))) {
      const id = itemId(m[3]), n = +(m[2] || 1);
      if (m[1] === '+') { G.inv[id] = (G.inv[id] || 0) + n; return `Neu im Gepäck: ${n > 1 ? n + '× ' : ''}${id}`; }
      if (!G.inv[id]) return null;
      G.inv[id] = Math.max(0, G.inv[id] - n); if (!G.inv[id]) delete G.inv[id];
      if (G.weapon === id && !G.inv[id]) G.weapon = G.inv['Wanderstab'] ? 'Wanderstab' : 'Fäuste';
      if (G.armor === id && !G.inv[id]) G.armor = null;
      return `Verloren: ${id}`;
    }
    if ((m = s.match(/^(le|au|ae)([+\-=])(.+)$/))) {
      const key = m[1], mx = HERO.max[key], before = G[key];
      let v;
      if (m[3] === 'max') v = mx;
      else if (m[3] === 'half') v = m[2] === '-' ? before - Math.ceil(before / 2) : m[2] === '=' ? Math.ceil(mx / 2) : before + Math.ceil((mx - before) / 2);
      else { const d = dice(m[3]); v = m[2] === '+' ? before + d : m[2] === '-' ? before - d : d; }
      G[key] = clamp(v, key === 'le' ? 1 : 0, mx);
      const diff = G[key] - before, nm = { le: 'LeP', au: 'AuP', ae: 'AsP' }[key];
      if (diff < 0) AUD.sfx('hurt');
      UI.hud();
      return diff === 0 ? `${nm}: ${G[key]}` : `${diff > 0 ? '+' : '−'}${Math.abs(diff)} ${nm} (jetzt ${G[key]})`;
    }
    if (s === 'all=max') { G.le = HERO.max.le; G.au = HERO.max.au; G.ae = HERO.max.ae; UI.hud(); return 'LeP, AuP und AsP sind wieder voll.'; }
    if ((m = s.match(/^f:(.+)$/))) { G.flags[m[1]] = 1; return null; }
    if ((m = s.match(/^f-:(.+)$/))) { delete G.flags[m[1]]; return null; }
    if ((m = s.match(/^ctx:(.+)$/))) { G.ctx = m[1]; return null; }
    if ((m = s.match(/^j:(.+)$/))) { G.journal.push({ d: G.day, t: m[1], hint: true }); return null; }
    if ((m = s.match(/^w:(.+)$/))) { G.weapon = itemId(m[1]); return `Du führst jetzt: ${G.weapon}`; }
    if (s === 'w-') {
      const w = G.weapon;
      if (!w || w === 'Wanderstab' || w === 'Fäuste' || !G.inv[w]) return null;
      G.inv[w]--; if (!G.inv[w]) delete G.inv[w];
      G.weapon = G.inv['Wanderstab'] ? 'Wanderstab' : 'Fäuste';
      return `Verloren: ${w}`;
    }
    if ((m = s.match(/^comp:(.+)$/))) { G.companion = Object.assign({}, COMPANIONS[m[1]]); G.companion.le = G.companion.max; return `${m[1]} begleitet dich.`; }
    if (s === 'comp-') { const n = G.companion && G.companion.name; G.companion = null; return n ? `${n} geht ihrer Wege.` : null; }
    if ((m = s.match(/^comp(le)([+\-=])(.+)$/))) { if (G.companion) { const d = m[3] === 'max' ? G.companion.max : dice(m[3]); G.companion.le = clamp(m[2] === '+' ? G.companion.le + d : m[2] === '-' ? G.companion.le - d : d, 0, G.companion.max); } return null; }
    return null;
  };

  // ---------------- Ablauf
  let RUN = 0; // Laufzaehler, um alte Ablaeufe abzubrechen
  STORY.start = function (n, step) {
    const my = ++RUN;
    G.sec = n; G.step = step || 0;
    if (!step) { G.path = G.path || []; if (G.path[G.path.length - 1] !== n) G.path.push(n); }
    ENG.save();
    play(n, step || 0, my);
  };
  async function play(n, start, my) {
    let cur = n, st = start;
    while (cur && my === RUN) {
      PAGE.open(cur, st);
      const res = await runSteps(MECH[cur] || [`x:(Abschnitt ${cur} ist noch nicht eingebaut.)`], cur, st, true, my);
      if (my !== RUN) return;
      if (res && res.goto) {
        cur = res.goto; st = 0;
        G.sec = cur; G.step = 0; if (G.path[G.path.length - 1] !== cur) G.path.push(cur);
        ENG.save();
        continue;
      }
      return;
    }
  }
  async function runSteps(steps, sec, start, top, my) {
    for (let i = start || 0; i < steps.length; i++) {
      if (my !== RUN) return { stop: true };
      const s = steps[i];
      if (typeof s === 'string') {
        let m;
        if ((m = s.match(/^t([\d,\-]+)$/))) { PAGE.text(STORY.text(sec, m[1], false)); continue; }
        if ((m = s.match(/^c([\d,\-]+)$/))) { PAGE.text(STORY.text(sec, m[1], true)); continue; }
        if (s.startsWith('x:')) { PAGE.text([tochter(sec, s.slice(2))]); continue; }
        if (s.startsWith('n:')) { PAGE.note(tochter(sec, s.slice(2))); continue; }
        if ((m = s.match(/^>(\d+(?:\.\d+)?)$/))) { await PAGE.cont(); return { goto: m[1] }; }
        if ((m = s.match(/^>>(\d+(?:\.\d+)?)$/))) { return { goto: m[1] }; } // ohne Weiter-Knopf
        if ((m = s.match(/^@(.+)$/))) {
          if (ENG.atPoi(m[1])) continue;
          if (!top) console.warn('Ortsangabe nur auf oberster Ebene', sec);
          G.sec = sec; G.step = i + 1; G.target = m[1];
          const p = ENG.map() === MAPS.world && POI[m[1]] && POI[m[1]].map === 'world' ? ENG.path(MAPS.world, G.x, G.y, ...ENG.nearestFree(MAPS.world, POI[m[1]].x, POI[m[1]].y), 120000) : null;
          G.leg = { poi: m[1], walked: 0, direct: p ? ENG.pathCost(p) : 30 };
          ENG.save();
          await PAGE.travel(m[1]);
          return { wait: true };
        }
        if ((m = s.match(/^!(.+)$/))) { ENG.teleport(m[1]); continue; }
        if (s === 'end') {
          G.finished = true; ENG.save();
          await PAGE.cont('Zum Abenteuerbericht'); UI.ending();
          for (; ;) {
            const b = await PAGE.choose([{ label: 'Abenteuerbericht ansehen', v: 1 }, { label: 'Neues Abenteuer beginnen', v: 2 }]);
            if (b.v === 1) UI.ending(); else { store.del('odun_save_v2'); try { location.reload(); } catch (e) { } return { stop: true }; }
          }
        }
        const line = STORY.fx(s);
        if (line) PAGE.fx(line, /^[−\-]|Blutdurst|Verloren/.test(line));
        continue;
      }
      if (s.type === 'choice') {
        const group = []; let j = i;
        while (j < steps.length && steps[j] && steps[j].type === 'choice') group.push(steps[j++]);
        const vis = group.filter(c => STORY.cond(c.cond));
        // Orte im Dorf: hinlaufen waehlt die Moeglichkeit
        const hub = vis.filter(c => c.spot).map(c => ({ spot: c.spot, goto: c.steps.length === 1 && /^>>?[\d.]+$/.test(c.steps[0]) ? c.steps[0].replace(/>/g, '') : null })).filter(h => h.goto);
        G.hubOpts = hub.length ? hub : null;
        const pick = await PAGE.choose(vis.map(c => ({ label: STORY.label(sec, c.label), c })));
        G.hubOpts = null;
        const r = await runSteps(pick.c.steps, sec, 0, false, my);
        if (r) return r;
        i = j - 1; continue;
      }
      if (s.type === 'if') {
        const r = await runSteps(STORY.cond(s.cond) ? s.then : s.els, sec, 0, false, my);
        if (r) return r; continue;
      }
      if (s.type === 'pic') { PAGE.pic(s.spec); continue; }
      if (s.type === 'probe') {
        let mod = s.mod || 0;
        if (s.modIf) for (const [c, v] of s.modIf) if (STORY.cond(c)) mod += v === 'B4' ? Math.min(4, G.blut) : v;
        if (G.flags.seekrank) mod += 2;
        // Zuschlaege aus vorigen Abschnitten ("die naechste Probe auf ...")
        G.nextMod = G.nextMod || {};
        if (G.nextMod[s.skill]) { mod += G.nextMod[s.skill]; G.lastNext = { skill: s.skill, v: G.nextMod[s.skill] }; delete G.nextMod[s.skill]; }
        else if (s.again && G.lastNext && G.lastNext.skill === s.skill) mod += G.lastNext.v;
        const ok = await PAGE.probe(Object.assign({}, s, { mod }));
        const r = await runSteps(ok ? s.ok : s.no, sec, 0, false, my);
        if (r) return r; continue;
      }
      if (s.type === 'trait') {
        let ts = s;
        if (s.sbModIf) { let sb = Math.ceil((HERO.traits[s.trait] || 5) / 2); for (const [c, v] of s.sbModIf) if (STORY.cond(c)) sb += v; ts = Object.assign({}, s, { sbMod: sb }); }
        const res = await PAGE.trait(ts);
        const r = await runSteps(res === 'keep' ? s.keep : res === 'resisted' ? (s.resisted || s.keep) : s.seized, sec, 0, false, my);
        if (r) return r; continue;
      }
      if (s.type === 'spell') {
        const ok = await PAGE.spell(s);
        const r = await runSteps(ok ? s.ok : s.no, sec, 0, false, my);
        if (r) return r; continue;
      }
      if (s.type === 'fight') {
        const res = await PAGE.fight(s);
        const r = await runSteps(res.win ? s.win : res.timeout && s.timeout ? s.timeout : (res.horri && s.spec.horri ? s.spec.horri : s.lose), sec, 0, false, my);
        if (r) return r; continue;
      }
      if (s.type === 'shop') { await PAGE.shop(s); continue; }
      if (s.type === 'give') {
        const have = (s.items || Object.keys(G.inv)).map(itemId).filter(id => G.inv[id] > 0);
        if (!have.length) { PAGE.note('Du hast nichts, was du geben könntest.'); continue; }
        const pick = await PAGE.choose(have.map(id => ({ label: id, id })));
        PAGE.fx(STORY.fx('i-:' + pick.id), true);
        continue;
      }
    }
    return null;
  }
  // Ankunft am Ziel pruefen
  STORY.checkArrival = function (rest) {
    if (G && G.hubOpts && !G.target && UI.suspended() && !UI.busy()) {
      const h = G.hubOpts.find(o => ENG.atPoi(o.spot));
      if (h) { G.hubOpts = null; ENG.stop(); STORY.start(h.goto); return; }
    }
    if (!G || !G.target || UI.busy()) return;
    if (ENG.atPoi(G.target)) {
      const leg = G.leg; G.target = null; G.leg = null;
      ENG.stop(); ENG.chain = false; UI.place();
      if (leg && leg.walked > leg.direct * 1.35 + 3) { /* Umweg bereits verbucht */ }
      STORY.start(G.sec, G.step);
    }
  };
  STORY.resume = function () {
    if (G.target) { UI.toast('Ziel: ' + (POI[G.target] ? POI[G.target].name : G.target)); return; }
    STORY.start(G.sec, G.step);
  };
})();
