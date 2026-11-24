'use strict';
// ---------------------------------------------------------------- Oberflaeche
const UI = {};
const PAGE = {};
const DICE = {};
(function () {
  const sheet = () => $('#sheet');
  let sheetHidden = false, busyDice = false, panelOpen = false, combatOpen = false;
  UI.busy = () => (!sheet().classList.contains('hidden') && !sheetHidden) || busyDice || panelOpen || combatOpen;
  UI.setCombat = v => { combatOpen = v; };
  UI.settings = () => { if (G) G.settings = G.settings || {}; const s = store.get('odun_settings', {}); return Object.assign({ music: true, sound: true, autoDice: false }, s); };
  UI.saveSettings = s => store.set('odun_settings', s);

  // ---------------- HUD
  UI.hud = function () {
    if (!G) return;
    const left = 50 - G.day;
    $('#hudday').innerHTML = `Tag <b>${G.day}</b> · ${left > 0 ? left + ' bis Sonnenwende' : left === 0 ? 'Sonnenwende!' : 'Sonnenwende vorbei'}`;
    $('#hudcount').innerHTML = `<span class="sig">◆ ${G.odun}</span><span class="blut">● ${G.blut}</span><span>${G.silver} S</span>`;
    const bars = $$('#hudbars .bar');
    [['le', 0], ['au', 1], ['ae', 2]].forEach(([k, i]) => {
      const v = G[k], mx = HERO.max[k];
      bars[i].querySelector('i').style.width = (100 * v / mx) + '%';
      bars[i].querySelector('em').textContent = `${{ le: 'LeP', au: 'AuP', ae: 'AsP' }[k]} ${v}/${mx}`;
    });
  };
  UI.place = function () {
    if (!G) return;
    let t = '';
    if (G.map !== 'world') t = MAPS[G.map].name;
    else t = REGNAMES[ENG.region(G.x, G.y)] || '';
    if (G.target && POI[G.target]) t += ` · Ziel: ${POI[G.target].name}`;
    $('#hudplace').textContent = t;
    UI.targetBtn();
  };
  UI.toast = function (msg) {
    const t = el('div', { class: 'toast' }, msg);
    $('#toastbox').append(t);
    setTimeout(() => t.remove(), 3100);
    while ($('#toastbox').children.length > 4) $('#toastbox').firstChild.remove();
  };
  // Knopf "Zum Ziel" und "Weiterlesen"
  UI.targetBtn = function () {
    let b = $('#goalbtn');
    if (!b) {
      b = el('button', { id: 'goalbtn', style: 'position:fixed;left:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 70px);z-index:6;min-height:44px;border-radius:22px;padding:0 14px;border:1px solid #5d4630;background:rgba(36,24,16,.9);color:#ffd27a;font-size:14px;font-family:inherit' });
      document.body.append(b);
      b.addEventListener('click', () => { AUD.unlock(); if (b.dataset.mode === 'read') { UI.showSheet(); } else { ENG.walkToTarget(); } });
    }
    if (sheetHidden) { b.dataset.mode = 'read'; b.textContent = '📖 Weiterlesen'; b.classList.remove('hidden'); }
    else if (G && G.target) { b.dataset.mode = 'goal'; b.textContent = '➜ Zum Ziel laufen'; b.classList.remove('hidden'); }
    else b.classList.add('hidden');
  };

  // ---------------- Seite (Abschnitt)
  let body, actions, scroller;
  function ensureSheet() {
    const s = sheet();
    if (!s.querySelector('.scroll')) {
      s.innerHTML = '';
      const top = el('div', { style: 'position:relative' },
        el('canvas', { class: 'pic', width: 160, height: 72, id: 'scenepic' }),
        el('button', { id: 'hidesheet', style: 'position:absolute;right:8px;top:8px;width:40px;height:40px;border-radius:20px;border:1px solid #6b5236;background:rgba(36,24,16,.8);color:#f1e4c8;font-size:18px', 'aria-label': 'Ausblenden' }, '▾'));
      if (TTS.available()) {
        const tb = el('button', { id: 'ttsbtn', 'aria-label': 'Vorlesen', style: 'position:absolute;right:56px;top:8px;width:40px;height:40px;border-radius:20px;border:1px solid #6b5236;background:rgba(36,24,16,.8);color:#f1e4c8;font-size:17px;line-height:1' }, '🔊');
        tb.addEventListener('click', e => { e.stopPropagation(); AUD.unlock(); if (TTS.speaking()) TTS.stop(); else TTS.readPage(); });
        top.append(tb);
      }
      scroller = el('div', { class: 'scroll' });
      body = el('div', { id: 'pagebody' }); actions = el('div', { class: 'choices' });
      scroller.append(body, actions);
      s.append(top, scroller);
      $('#hidesheet', s).addEventListener('click', () => { if (!extraOpen) UI.hideSheet(); });
    }
  }
  UI.hideSheet = function () { sheet().classList.add('hidden'); $('#veil').classList.add('hidden'); sheetHidden = true; UI.targetBtn(); };
  UI.showSheet = function () { sheet().classList.remove('hidden'); $('#veil').classList.remove('hidden'); sheetHidden = false; UI.targetBtn(); };
  PAGE.open = function (sec, step) {
    ensureSheet();
    TTS.pageStart();
    UI.showSheet();
    body.innerHTML = ''; actions.innerHTML = '';
    body.append(el('div', { style: 'text-align:center;color:#8e2219;font-size:15px;margin:10px 0 2px;letter-spacing:2px' }, `~ ${parseInt(sec, 10)} ~`));
    PICS.draw($('#scenepic'), sec);
    scroller.scrollTop = 0;
  };
  // Seite ausserhalb des Buches (Begegnungen, Kraeuter)
  let extraOpen = false;
  PAGE.openExtra = function (title, pic) {
    ensureSheet(); UI.showSheet(); extraOpen = true; TTS.pageStart();
    body.innerHTML = ''; actions.innerHTML = '';
    body.append(el('h2', {}, title));
    PICS.drawSpec($('#scenepic'), pic);
    scroller.scrollTop = 0;
  };
  PAGE.closeExtra = function () { extraOpen = false; sheetHidden = false; $('#veil').classList.add('hidden'); UI.targetBtn(); };
  UI.suspended = () => sheetHidden;
  PAGE.text = function (paras) {
    const made = [];
    for (const p of paras) if (p) { const e = el('p', { html: esc(p).replace(/\b([A-ZÄÖÜ][A-ZÄÖÜ\-]{3,}(?:\s[A-ZÄÖÜ][A-ZÄÖÜ\-]{2,})*)\b/g, '<b>$1</b>') }); body.append(e); made.push(e); }
    TTS.added(made);
    scrollDown();
  };
  PAGE.fx = function (line, bad) { body.append(el('div', { class: 'fxline' + (bad ? ' bad' : '') }, line)); UI.hud(); scrollDown(); };
  PAGE.note = function (t) { const e = el('div', { class: 'note' }, t); body.append(e); TTS.added([e]); scrollDown(); };
  PAGE.pic = function (spec) { PICS.drawSpec($('#scenepic'), spec); };
  function scrollDown() { requestAnimationFrame(() => { scroller.scrollTop = scroller.scrollHeight; }); }
  function buttons(list) {
    actions.innerHTML = '';
    return new Promise(res => {
      list.forEach((b, i) => {
        const btn = el('button', { class: 'choice' + (b.cls ? ' ' + b.cls : '') }, b.label, b.small ? el('small', {}, b.small) : null);
        if (b.disabled) btn.disabled = true;
        btn.addEventListener('click', () => { AUD.unlock(); AUD.sfx('click'); TTS.stop(); actions.innerHTML = ''; res(b); });
        actions.append(btn);
      });
      scrollDown();
    });
  }
  PAGE.cont = async function (label) { await buttons([{ label: label || 'Weiter', cls: 'grey' }]); };
  PAGE.choose = async function (list) {
    const b = await buttons(list.map(x => ({ label: x.label, x })));
    body.append(el('div', { style: 'margin:8px 0;color:#5b4632;font-style:italic' }, '» ' + b.label));
    return b.x;
  };
  PAGE.travel = async function (poiId) {
    const p = POI[poiId];
    const name = p ? p.name : poiId;
    body.append(el('div', { class: 'note' }, `Ziel: ${name}. Lass dich hinführen oder lauf selbst über die Karte. Die Geschichte geht weiter, sobald du dort bist.`));
    G.target = poiId; UI.place();
    const b = await buttons([{ label: '➜ Hinführen lassen', cls: 'alt' }, { label: 'Selbst laufen', cls: 'grey' }]);
    UI.hideSheet(); sheet().classList.add('hidden'); sheetHidden = false; $('#veil').classList.add('hidden');
    UI.targetBtn();
    if (b.label.startsWith('➜')) setTimeout(() => ENG.walkToTarget(), 150);
  };
  function probeTitle(s) {
    const k = R.kind(s.skill);
    const mod = s.mod ? ' ' + R.modText(s.mod) : '';
    if (k === 'attr') return `${{ MU: 'Mut', KL: 'Klugheit', IN: 'Intuition', CH: 'Charisma', FF: 'Fingerfertigkeit', GE: 'Gewandtheit', KO: 'Konstitution', KK: 'Körperkraft' }[s.skill]}-Probe${mod}`;
    return `${s.skill}-Probe${mod}`;
  }
  PAGE.probe = async function (s) {
    await buttons([{ label: '🎲 ' + (s.label || probeTitle(s)), small: s.note || '' }]);
    const r = await DICE.probe(s.skill, s.mod, s);
    body.append(el('div', { class: 'fxline' + (r.ok ? '' : ' bad') }, `${probeTitle(s)}: ${r.ok ? 'gelungen' : 'misslungen'}${r.extra || ''}`));
    return r.ok;
  };
  PAGE.trait = async function (s) {
    const v = HERO.traits[s.trait] !== undefined ? HERO.traits[s.trait] : 5;
    await buttons([{ label: `🎲 Würfle auf deine${/Aberglaube|Jähzorn|Prinzipientreue/.test(s.trait) ? 'n' : ''} ${s.trait} (W20, Wert ${v})` }]);
    const r = await DICE.trait(s.trait, s);
    body.append(el('div', { class: 'fxline' + (r === 'seized' ? ' bad' : '') }, r === 'keep' ? 'Du behältst die Oberhand.' : r === 'resisted' ? 'Du beherrschst dich.' : `${s.trait} packt dich.`));
    return r;
  };
  PAGE.spell = async function (s) {
    const sp = HERO.spells[s.spell];
    if (G.ae < Math.ceil(sp.cost / 2)) { PAGE.note(`Für ${s.spell} fehlen dir die Astralpunkte.`); return false; }
    await buttons([{ label: `✨ ${s.spell} wirken (${sp.cost} AsP)`, small: sp.text }]);
    const r = await DICE.probe(s.spell, s.mod || 0, s);
    const cost = r.ok ? sp.cost : Math.ceil(sp.cost / 2);
    G.ae = Math.max(0, G.ae - cost); UI.hud();
    body.append(el('div', { class: 'fxline' + (r.ok ? '' : ' bad') }, `${s.spell}: ${r.ok ? 'gelungen, ZfP* ' + r.star : 'misslungen'} (−${cost} AsP)`));
    if (r.ok && s.spell === 'Eins mit der Natur') G.fx.einsNatur = r.star;
    return r.ok;
  };
  PAGE.fight = async function (s) {
    await buttons([{ label: '⚔ Kampf!', small: (s.spec.title || '') }]);
    const res = await COMBAT.run(s.spec);
    body.append(el('div', { class: 'fxline' + (res.win ? '' : ' bad') }, res.win ? 'Der Kampf ist gewonnen.' : res.horri ? 'Die Gegner fliehen vor dir.' : 'Du bist besiegt.'));
    UI.hud();
    return res;
  };
  PAGE.shop = async function (s) {
    await new Promise(res => UI.shop(s.items, res, s.sell));
  };

  // ---------------- Wuerfelschale
  const box = () => $('#dicebox');
  function dieEl(n, lab, d6) { return el('div', { class: 'die rolling' }, el('div', { class: 'face' + (d6 ? ' d6' : '') }, '?'), el('div', { class: 'lab' }, lab || '')); }
  DICE.roll = function (labels, title, sub, opts) {
    opts = opts || {};
    return new Promise(res => {
      busyDice = true;
      const dlg = $('#dice'); dlg.classList.remove('hidden');
      const b = box(); b.innerHTML = '';
      b.append(el('h3', {}, title), el('div', { class: 'sub' }, sub || ''));
      if (opts.mods) b.append(el('div', { id: 'dicemods' }, opts.mods));
      const row = el('div', { id: 'dicerow' }); const dice = labels.map(l => dieEl(0, l, opts.d6));
      dice.forEach(d => row.append(d)); b.append(row);
      const result = el('div', { id: 'diceresult' }); b.append(result);
      const tap = el('div', { id: 'dicetap' }, 'Antippen zum Würfeln'); b.append(tap);
      const btns = el('div', { id: 'dicebtns' }); b.append(btns);
      if (opts.pre) opts.pre(btns);
      let rolled = false;
      const go = () => {
        if (rolled) return; rolled = true; tap.remove(); btns.innerHTML = '';
        AUD.sfx('dice');
        const sides = opts.d6 ? 6 : 20;
        const vals = labels.map(() => 1 + Math.floor(RNG() * sides));
        let k = 0; const iv = setInterval(() => { dice.forEach(d => d.querySelector('.face').textContent = 1 + Math.floor(Math.random() * sides)); if (++k > 6) { clearInterval(iv); dice.forEach((d, i) => { d.classList.remove('rolling'); d.querySelector('.face').textContent = vals[i]; }); res({ vals, dice, result, btns, close }); } }, 70);
      };
      const close = () => { dlg.classList.add('hidden'); busyDice = false; b.onclick = null; };
      b.onclick = e => { if (e.target.closest('button')) return; go(); };
      if (UI.settings().autoDice || opts.auto) setTimeout(go, 250);
    });
  };
  function waitBtns(btns, list) {
    return new Promise(res => {
      btns.innerHTML = '';
      list.forEach(x => { const bt = el('button', { class: 'btn ' + (x.cls || '') }, x.label); bt.addEventListener('click', e => { e.stopPropagation(); AUD.sfx('click'); res(x); }); btns.append(bt); });
    });
  }
  DICE.wait = waitBtns;
  // Probe auf Eigenschaft, Talent oder Zauber
  DICE.probe = async function (skill, mod, opts) {
    opts = opts || {};
    const kind = R.kind(skill);
    let pre = 0; // Hauch des Odun vorher (AsP)
    const hauch = HERO.hauch.includes(skill) && !opts.noAsp && !G.flags.queste;
    let ease = 0; // Queste: Zeichen des Odun erleichtern
    const pool = () => G.flags.queste ? (G.questPool || 0) : 0;
    const modsTxt = () => {
      const parts = [];
      if (mod) parts.push(`Probe ${R.modText(mod)}`);
      if (R.exhausted()) parts.push('erschöpft +2');
      if (G.fx.einsNatur && ['Fährtensuchen', 'Orientierung', 'Wettervorhersage', 'Wildnisleben'].includes(skill)) parts.push(`Eins mit der Natur +${G.fx.einsNatur} TaW`);
      if (pre) parts.push(`Hauch des Odûn: ${pre} AsP`);
      if (G.flags.seekrank) parts.push('Meeresangst: alle Proben +2');
      if (ease) parts.push(`Zeichen des Odûn: −${ease}`);
      return parts.join(' · ');
    };
    let title, labels, sub;
    if (kind === 'attr') { title = skill + '-Probe'; labels = [`${skill} ${HERO.attr[skill]}`]; sub = `W20 höchstens ${HERO.attr[skill] - mod - (R.exhausted() ? 2 : 0)}`; }
    else { const at = R.probeAttrs(skill); title = skill + '-Probe'; labels = at.map(a => `${a} ${HERO.attr[a]}`); sub = `${kind === 'spell' ? 'ZfW' : 'TaW'} ${R.taw(skill)}${mod ? ', ' + R.modText(mod) : ''} → ${R.taw(skill) - mod - (R.exhausted() ? 2 : 0)} Punkte zum Ausgleichen`; }
    const d = await DICE.roll(labels, title, sub, {
      mods: modsTxt(), pre: (hauch || pool() > 0) ? btns => {
        if (pool() > 0) {
          const be = el('button', { class: 'btn alt' }, `Zeichen des Odûn: −1 (noch ${pool()})`);
          be.addEventListener('click', e => { e.stopPropagation(); if (pool() > 0) { G.questPool--; ease++; be.textContent = `Zeichen des Odûn: −1 (noch ${pool()})`; $('#dicemods').textContent = modsTxt(); } });
          btns.append(be);
        }
        if (!hauch) return;
        const bt = el('button', { class: 'btn alt' }, '+1 AsP vorher (Hauch des Odûn)');
        bt.addEventListener('click', e => {
          e.stopPropagation();
          const cap = kind === 'attr' ? HERO.attr[skill] : R.taw(skill) / 2;
          if (G.ae > pre && pre < Math.max(1, Math.floor(cap / (kind === 'attr' ? 2 : 1)))) { pre++; $('#dicemods').textContent = modsTxt(); }
        });
        btns.append(bt);
      } : null
    });
    if (pre) { G.ae -= pre; UI.hud(); }
    mod -= ease;
    let r = kind === 'attr' ? R.evalAttr(skill, mod, d.vals, pre * 2) : R.evalTalent(skill, mod, d.vals, kind === 'spell' ? 0 : pre * 2);
    show(r, d, kind);
    // Hauch des Odun nachher
    if (!r.ok && hauch && r.crit !== 'fumble' && r.left < 0 && -r.left <= G.ae) {
      const need = -r.left;
      const ch = await waitBtns(d.btns, [{ label: `Mit ${need} AsP retten (Hauch des Odûn)`, cls: 'alt', v: 1 }, { label: 'Misslungen lassen', cls: 'grey', v: 0 }]);
      if (ch.v) { G.ae -= need; UI.hud(); r.ok = true; r.star = 1; r.extra = ` (mit ${need} AsP gerettet)`; d.result.textContent = 'Gerettet!'; d.result.className = 'ok'; AUD.sfx('ok'); }
    }
    await waitBtns(d.btns, [{ label: 'Weiter', cls: 'grey' }]);
    d.close();
    return r;
  };
  function show(r, d, kind) {
    d.dice.forEach((de, i) => {
      const need = r.need[i] !== undefined ? r.need[i] : r.need[0];
      de.classList.add(d.vals[i] <= need ? 'ok' : 'bad');
      de.querySelector('.lab').textContent += ` · ${d.vals[i] <= need ? '✓' : '+' + (d.vals[i] - need)}`;
    });
    let txt = r.ok ? 'Gelungen' : 'Misslungen';
    if (kind !== 'attr' && r.ok) txt += ` · ${kind === 'spell' ? 'ZfP*' : 'TaP*'} ${r.star}`;
    if (kind !== 'attr' && !r.ok && r.left < 0) txt += ` · ${-r.left} ${-r.left === 1 ? 'Punkt fehlt' : 'Punkte fehlen'}`;
    if (r.crit === 'lucky') txt = 'Glücklich gelungen!';
    if (r.crit === 'fumble') txt = 'Patzer!';
    d.result.textContent = txt; d.result.className = r.ok ? 'ok' : 'bad';
    AUD.sfx(r.ok ? 'ok' : 'fail');
  }
  // Schlechte Eigenschaft
  DICE.trait = async function (trait, opts) {
    const v = HERO.traits[trait] !== undefined ? HERO.traits[trait] : 5;
    const d = await DICE.roll([`${trait} ${v}`], `Würfle auf ${trait}`, `Mehr als ${v}: Du behältst die Oberhand.`);
    const seized = d.vals[0] <= v;
    d.dice[0].classList.add(seized ? 'bad' : 'ok');
    d.result.textContent = seized ? 'Die Schwäche packt dich!' : 'Du behältst die Oberhand.'; d.result.className = seized ? 'bad' : 'ok';
    AUD.sfx(seized ? 'fail' : 'ok');
    if (!seized) { await waitBtns(d.btns, [{ label: 'Weiter', cls: 'grey' }]); d.close(); return 'keep'; }
    if (opts && opts.noSB) { await waitBtns(d.btns, [{ label: 'Weiter', cls: 'grey' }]); d.close(); return 'seized'; }
    const sbMod = opts && opts.sbMod !== undefined ? opts.sbMod : Math.ceil(v / 2);
    const ch = await waitBtns(d.btns, [{ label: `Beherrschen: Selbstbeherrschung +${sbMod}`, cls: 'alt', v: 1 }, { label: 'Nachgeben', cls: 'grey', v: 0 }]);
    d.close();
    if (!ch.v) return 'seized';
    const r = await DICE.probe('Selbstbeherrschung', sbMod, {});
    return r.ok ? 'resisted' : 'seized';
  };
  // einfacher Wurf (Kampf): gibt Zahlen zurueck
  DICE.quick = async function (labels, title, sub, d6, auto) {
    const d = await DICE.roll(labels, title, sub, { d6, auto });
    await sleep(auto ? 350 : 450);
    d.close();
    return d.vals;
  };

  // ---------------- Panels
  function panel(title, content, onClose) {
    panelOpen = true;
    const p = $('#panel'); p.innerHTML = ''; p.classList.remove('hidden');
    const close = el('button', { 'aria-label': 'Schließen' }, '✕');
    close.addEventListener('click', () => { p.classList.add('hidden'); panelOpen = false; AUD.sfx('click'); if (onClose) onClose(); });
    p.append(el('header', {}, el('h2', {}, title), close));
    const b = el('div', { class: 'body' }); b.append(content); p.append(b);
    return p;
  }
  UI.panel = panel;
  UI.held = function () {
    const f = document.createDocumentFragment();
    f.append(el('div', { style: 'font-size:15px;margin:4px 0 8px' }, `${G.name}, ${G.daughter ? 'Tochter' : 'Sohn'} des Dundoch · Durro-Dûn des Keilers aus Lyrgach`));
    const g = el('div', { class: 'grid' });
    for (const a in HERO.attr) g.append(el('div', { class: 'cell' }, el('b', {}, HERO.attr[a]), el('span', {}, a)));
    f.append(el('h3', {}, 'Eigenschaften'), g);
    const g2 = el('div', { class: 'grid' });
    [['LeP', G.le + '/' + HERO.max.le], ['AuP', G.au + '/' + HERO.max.au], ['AsP', G.ae + '/' + HERO.max.ae], ['MR', HERO.mr], ['INI-B', HERO.iniB], ['AT-B', HERO.atB], ['PA-B', HERO.paB], ['RS', R.rs()]].forEach(([k, v]) => g2.append(el('div', { class: 'cell' }, el('b', { style: 'font-size:17px' }, v), el('span', {}, k))));
    f.append(el('h3', {}, 'Basiswerte'), g2);
    const kt = el('table', { class: 't' }, el('tr', {}, el('th', {}, 'Kampftalent'), el('th', {}, 'TaW'), el('th', {}, 'AT'), el('th', {}, 'PA')));
    for (const k in HERO.kampf) { const v = HERO.kampf[k]; kt.append(el('tr', {}, el('td', {}, k), el('td', { class: 'n' }, v[0]), el('td', { class: 'n' }, k === 'Wurfspeere' ? 'FK ' + v[1] : v[1]), el('td', { class: 'n' }, v[2] || '–'))); }
    const w = R.weapon();
    f.append(el('h3', {}, 'Kampf'), el('div', { style: 'font-size:14.5px;margin-bottom:6px' }, `Waffe: ${w.name} (${w.tal}, TP ${w.tp}) · INI ${HERO.iniB} + 1W6`), kt);
    for (const grp in HERO.talGroups) {
      const t = el('table', { class: 't' });
      for (const n of HERO.talGroups[grp]) { const v = HERO.tal[n]; t.append(el('tr', {}, el('td', {}, n), el('td', {}, v[1].split('/').map(a => `${a} ${HERO.attr[a]}`).join(' · ')), el('td', { class: 'n' }, v[0]))); }
      f.append(el('h3', {}, grp), t);
    }
    const zt = el('table', { class: 't' });
    for (const n in HERO.spells) { const s = HERO.spells[n]; zt.append(el('tr', {}, el('td', {}, el('b', {}, n), el('br'), el('small', {}, s.text)), el('td', {}, s.probe), el('td', { class: 'n' }, s.zfw), el('td', { class: 'n' }, s.cost + ' AsP'))); }
    f.append(el('h3', {}, 'Zauber (Übernatürliche Begabungen)'), zt);
    const tt = el('table', { class: 't' });
    for (const n in HERO.traits) tt.append(el('tr', {}, el('td', {}, n), el('td', { class: 'n' }, HERO.traits[n])));
    f.append(el('h3', {}, 'Schlechte Eigenschaften'), tt);
    f.append(el('h3', {}, 'Vorteile'), el('div', { style: 'font-size:14.5px' }, HERO.vorteile.join(', ') + '. Nachteil: Impulsiv.'));
    f.append(el('h3', {}, 'Sonderfertigkeiten'), el('div', { style: 'font-size:14.5px' }, HERO.sf.join(', ') + '.'));
    f.append(el('div', { class: 'note', style: 'margin-top:14px' }, 'Hauch des Odûn: Bei Proben auf KO, Raufen, Selbstbeherrschung und Sinnenschärfe darfst du Astralpunkte einsetzen: vorher je 1 AsP für +2 (höchstens doppelt), nachher je 1 AsP für einen fehlenden Punkt.'));
    panel('Heldenbogen', f);
  };
  UI.pack = function () {
    const f = document.createDocumentFragment();
    f.append(el('div', { class: 'grid', style: 'grid-template-columns:repeat(3,1fr)' },
      el('div', { class: 'cell' }, el('b', {}, G.silver), el('span', {}, 'Silbertaler')),
      el('div', { class: 'cell' }, el('b', {}, R.weapon().name.split(' ')[0]), el('span', {}, 'Waffe')),
      el('div', { class: 'cell' }, el('b', {}, R.rs()), el('span', {}, 'Rüstungsschutz'))));
    f.append(el('h3', {}, 'Gegenstände'));
    const ids = Object.keys(G.inv).filter(k => G.inv[k] > 0).sort();
    for (const id of ids) {
      const it = ITEMS[id] || {}; const n = G.inv[id];
      const row = el('div', { class: 'itm' }, el('div', {}, (n > 1 ? n + '× ' : '') + id, it.desc || it.tp ? el('small', {}, it.desc || `${it.tal}, TP ${it.tp}`) : null));
      const btns = el('div', { class: 'row' });
      if ((it.kind === 'weapon') && G.weapon !== id) btns.append(btn('Führen', () => { G.weapon = id; UI.toast(`Du führst jetzt: ${id}`); UI.pack(); }));
      if (it.kind === 'weapon' && G.weapon === id) btns.append(el('span', { class: 'tag' }, 'geführt'));
      if (it.kind === 'armor') btns.append(G.armor === id ? btn('Ablegen', () => { G.armor = null; UI.pack(); }, 'grey') : btn('Anlegen', () => { G.armor = id; UI.toast(`${id} angelegt (RS ${it.rs})`); UI.pack(); }));
      if (it.kind === 'use') btns.append(btn('Benutzen', () => { UI.useItem(id); UI.pack(); }, 'alt'));
      row.append(btns); f.append(row);
    }
    if (G.weapon !== 'Fäuste') f.append(el('div', { class: 'itm' }, el('div', {}, 'Mit bloßen Fäusten kämpfen', el('small', {}, 'Raufen 13/13, TP 1W+1 (A)')), btn('Wählen', () => { G.weapon = 'Fäuste'; UI.pack(); }, 'grey')));
    if (G.companion) f.append(el('h3', {}, 'Begleitung'), el('div', { class: 'itm' }, el('div', {}, G.companion.name, el('small', {}, `LeP ${G.companion.le}/${G.companion.max} · AT ${G.companion.at} · PA ${G.companion.pa}`))));
    f.append(el('h3', {}, 'Schlüsselwörter'), el('div', {}, G.kw.length ? G.kw.map(k => el('span', { class: 'tag' }, k)) : el('span', { style: 'font-size:14px;color:#5b4632' }, 'noch keine')));
    panel('Gepäck', f);
  };
  function btn(label, fn, cls) { const b = el('button', { class: 'btn ' + (cls || '') }, label); b.addEventListener('click', () => { AUD.sfx('click'); fn(); }); return b; }
  UI.btn = btn;
  UI.useItem = function (id) {
    const it = ITEMS[id]; if (!it || !G.inv[id]) return;
    let msg = '';
    if (it.heal) { const v = rollExpr(it.heal); const b = G.le; G.le = Math.min(HERO.max.le, G.le + v); msg = `${id}: +${G.le - b} LeP`; AUD.sfx('heal'); }
    if (it.aup) { const v = rollExpr(it.aup); const b = G.au; G.au = Math.min(HERO.max.au, G.au + v); msg = `${id}: +${G.au - b} AuP`; AUD.sfx('heal'); }
    if (it.ae) { const v = rollExpr(it.ae); const b = G.ae; G.ae = Math.min(HERO.max.ae, G.ae + v); msg = `${id}: +${G.ae - b} AsP`; AUD.sfx('heal'); }
    G.inv[id]--; if (!G.inv[id]) delete G.inv[id];
    UI.toast(msg); UI.hud(); ENG.save();
  };
  UI.journal = function () {
    const f = document.createDocumentFragment();
    f.append(el('div', { class: 'grid', style: 'grid-template-columns:repeat(3,1fr)' },
      el('div', { class: 'cell' }, el('b', {}, G.day), el('span', {}, 'Tage (von 50)')),
      el('div', { class: 'cell' }, el('b', { style: 'color:#3d5a2a' }, G.odun), el('span', {}, 'Zeichen des Odûn')),
      el('div', { class: 'cell' }, el('b', { style: 'color:#8e2219' }, G.blut), el('span', {}, 'Blutdurst'))));
    if (G.target && POI[G.target]) f.append(el('div', { class: 'note' }, `Aktuelles Ziel: ${POI[G.target].name}`));
    const hints = G.journal.filter(j => j.hint).slice().reverse();
    f.append(el('h3', {}, 'Notizen und Hinweise'));
    if (!hints.length) f.append(el('div', { style: 'font-size:14px;color:#5b4632' }, 'Noch keine.'));
    for (const j of hints) f.append(el('div', { class: 'jent' }, el('div', { class: 'd' }, `Tag ${j.d}`), j.t));
    f.append(el('h3', {}, 'Wegprotokoll'), el('div', { style: 'font-size:14px;line-height:1.7;word-spacing:2px' }, (G.path || []).join(' · ')));
    panel('Tagebuch', f);
  };
  UI.menu = function () {
    const s = UI.settings();
    const f = document.createDocumentFragment();
    const toggle = (label, key) => { const b = btn(s[key] ? 'an' : 'aus', () => { s[key] = !s[key]; UI.saveSettings(s); if (key === 'music') AUD.setMusic(s.music); UI.menu(); }, s[key] ? 'alt' : 'grey'); return el('div', { class: 'set' }, el('span', {}, label), b); };
    f.append(toggle('Musik', 'music'), toggle('Klänge', 'sound'), toggle('Würfel automatisch werfen', 'autoDice'));
    f.append(el('div', { class: 'set' }, el('span', {}, 'Kartenzoom'), btn('wechseln', () => { ENG.toggleZoom(); })));
    if (TTS.available()) f.append(...UI.ttsSettings(s));
    f.append(el('h3', {}, 'Kurzregeln'), el('div', { style: 'font-size:14.5px;line-height:1.45' },
      el('p', {}, 'Eigenschaftsprobe: 1W20, höchstens der Wert. Talentprobe: 3W20 gegen die drei Eigenschaften; Überschüsse gleichst du mit dem TaW aus. Erschwernisse ziehst du vorher vom TaW ab. Zwei Einsen gelingen immer, zwei Zwanzigen misslingen.'),
      el('p', {}, 'Kampf: INI-Basis + 1W6. Jede Runde eine Attacke und eine Parade; jede weitere Parade in derselben Runde +4. Treffer: TP − RS = SP. Bestätigte 1: halbe Parade, doppelte TP. Bestätigte 20: nächste Runde keine Attacke. Sinken deine LeP im Kampf auf 5 oder darunter, bist du besiegt.'),
      el('p', {}, 'Schlechte Eigenschaften: W20. Mehr als der Wert: Du behältst die Oberhand. Sonst darfst du eine Selbstbeherrschungs-Probe versuchen, erschwert um den halben Wert.'),
      el('p', {}, 'LeP, AuP und AsP bekommst du nur zurück, wenn der Text es sagt. Außerhalb von Kämpfen sinken die LeP nie unter 1. Bei 0 AuP sind alle Proben und Kampfwerte um 2 erschwert.')));
    f.append(el('h3', {}, 'Spiel'), el('div', { class: 'row' },
      (() => {
        // zweistufig statt confirm(), das in eingebetteten Seiten gesperrt ist
        let armed = false, tm = null;
        const b = btn('Neues Spiel', () => {
          if (!armed) { armed = true; b.textContent = 'Wirklich? Spielstand löschen'; b.className = 'btn'; b.style.background = '#8e2219'; b.style.color = '#fff'; tm = setTimeout(() => { armed = false; b.textContent = 'Neues Spiel'; b.className = 'btn grey'; b.style.background = ''; b.style.color = ''; }, 4000); return; }
          clearTimeout(tm); store.del('odun_save_v2'); try { location.reload(); } catch (e) { UI.toast('Bitte die Seite neu laden.'); }
        }, 'grey');
        return b;
      })()));
    f.append(el('h3', {}, 'Mitwirkende'), el('div', { style: 'font-size:13.5px;line-height:1.5;color:#5b4632' },
      el('p', {}, 'Abenteuer: „Die Haut des Odûn“, Spielbuch von Claude (Anthropic) für Thilo, 2026. Regeln nach Das Schwarze Auge 4.1 (inoffizielles Fan-Werk).'),
      el('p', {}, 'Grafik: „Zelda-like tilesets and sprites“ von ArMM1998 (CC0) · „Roguelike pack“ und „Roguelike Characters pack“ von Kenney, kenney.nl (CC0) · Tiere, Moor und Gebirge selbst gezeichnet.'),
      el('p', {}, 'Vorlesen: Stimme deines Geräts oder „Thorsten“ (Thorsten-Voice von Thorsten Müller, CC0) mit Piper, espeak-ng (GPL-3.0) und ONNX Runtime Web (MIT).'),
      el('p', {}, 'Das Schwarze Auge, Aventurien und Dere sind eingetragene Marken der Significant Fantasy Medienrechte GbR. Dieses Spiel steht in keiner Verbindung zu Ulisses Spiele.')));
    panel('Menü', f);
  };
  // Einstellungen zum Vorlesen
  UI.ttsSettings = function (s) {
    const out = [el('h3', {}, 'Vorlesen')];
    const save = () => UI.saveSettings(s);
    const thor = TTS.thorstenStatus();
    const useThor = s.ttsEngine === 'thorsten';
    const info = el('div', { style: 'font-size:13.5px;color:#5b4632;margin:4px 0' });
    const showInfo = () => {
      info.textContent = thor.status === 'bereit' ? 'Thorsten ist geladen und bleibt auf deinem Gerät gespeichert.'
        : thor.status === 'lädt' ? `Thorsten wird geladen: ${Math.round(thor.progress * 100)} %`
        : thor.status === 'fehler' ? `Laden hat nicht geklappt (${thor.error}). Versuch es im WLAN noch einmal.`
        : 'Thorsten ist eine freie deutsche Männerstimme (Piper, CC0). Sie läuft auf deinem Gerät und wird einmalig geladen: etwa 90 MB, am besten im WLAN.';
    };
    TTS.onProgress = () => { if (info.isConnected) showInfo(); };
    const loadThor = () => {
      UI.toast('Thorsten wird geladen …');
      TTS.loadThorsten().then(ok => {
        UI.toast(ok ? 'Thorsten ist bereit.' : 'Thorsten konnte nicht geladen werden. Die Handy-Stimme liest weiter.');
        if (!ok) { s.ttsEngine = 'web'; save(); }
        const h = $('#panel h2'); if (!$('#panel').classList.contains('hidden') && h && h.textContent === 'Menü') UI.menu();
      });
    };
    const auto = btn(s.ttsAuto ? 'an' : 'aus', () => { s.ttsAuto = !s.ttsAuto; save(); UI.menu(); }, s.ttsAuto ? 'alt' : 'grey');
    out.push(el('div', { class: 'set' }, el('span', {}, 'Neue Abschnitte automatisch vorlesen'), auto));
    out.push(el('div', { style: 'font-size:13.5px;color:#5b4632;margin:-2px 0 8px' }, 'Sonst tippst du auf der Buchseite auf 🔊.'));
    const bWeb = btn('Handy', () => { s.ttsEngine = 'web'; save(); TTS.stop(); UI.menu(); }, useThor ? 'grey' : 'alt');
    const bThor = btn('Thorsten', () => {
      if (!TTS.thorstenPossible()) { UI.toast('Thorsten gibt es nur in der GitHub-Fassung des Spiels.'); return; }
      s.ttsEngine = 'thorsten'; save(); TTS.stop();
      if (thor.status !== 'bereit') loadThor(); else UI.menu();
    }, useThor ? 'alt' : 'grey');
    out.push(el('div', { class: 'set' }, el('span', {}, 'Stimme'), el('span', { style: 'display:flex;gap:6px' }, bWeb, bThor)));
    // Stimmen des Geraets
    const vs = TTS.webVoices();
    if (vs.length) {
      const best = TTS.bestWebVoice();
      const sel = el('select', { style: 'font:inherit;font-size:15px;max-width:60%;padding:8px;border-radius:8px;border:1px solid #6b5236;background:#f4ead2;color:#2a1c12' });
      for (const v of vs) { const o = el('option', { value: v.voiceURI }, `${v.name} (${v.lang})`); if (best && v.voiceURI === best.voiceURI) o.selected = true; sel.append(o); }
      sel.addEventListener('change', () => { s.ttsVoice = sel.value; save(); });
      out.push(el('div', { class: 'set' }, el('span', {}, 'Handy-Stimme'), sel));
    } else if (!useThor) out.push(el('div', { style: 'font-size:13.5px;color:#5b4632' }, 'Dein Gerät meldet gerade keine deutsche Stimme. Öffne das Menü gleich noch einmal, manche Geräte laden ihre Stimmen erst nach.'));
    // Tempo
    const rate = Math.round((s.ttsRate || 1) * 10) / 10;
    const setRate = d => { s.ttsRate = Math.round(clamp((s.ttsRate || 1) + d, 0.6, 1.6) * 10) / 10; save(); UI.menu(); };
    out.push(el('div', { class: 'set' }, el('span', {}, 'Tempo'), el('span', { style: 'display:flex;gap:6px;align-items:center' },
      btn('−', () => setRate(-0.1), 'grey'), el('b', { style: 'min-width:38px;text-align:center' }, rate.toFixed(1).replace('.', ',')), btn('+', () => setRate(0.1), 'grey'))));
    // Thorsten laden oder entfernen
    if (TTS.thorstenPossible()) {
      showInfo(); out.push(info);
      out.push(el('div', { class: 'row' }, btn(thor.status === 'bereit' ? 'Thorsten entfernen' : 'Thorsten laden', () => {
        if (thor.status === 'bereit') { TTS.removeThorsten().then(() => { s.ttsEngine = 'web'; save(); UI.menu(); }); return; }
        s.ttsEngine = 'thorsten'; save(); loadThor();
      }, 'grey')));
    }
    out.push(el('div', { class: 'row' }, btn('Probe hören', () => { AUD.unlock(); TTS.test(); }, 'alt')));
    return out;
  };
  UI.lager = function () {
    const f = document.createDocumentFragment();
    const inSettle = G.map !== 'world';
    f.append(el('div', { style: 'font-size:14.5px;margin:4px 0 10px' }, 'Abseits der Geschichte kannst du die Wildnis nutzen. Jede Tätigkeit kostet Zeit.'));
    const act = (label, sub, fn, dis) => { const r = el('div', { class: 'itm' }, el('div', {}, label, el('small', {}, sub))); const b = btn('Los', fn); if (dis) b.disabled = true; r.append(b); return r; };
    f.append(act('Kräuter suchen', 'Pflanzenkunde-Probe, 2 Stunden', () => { $('#panel').classList.add('hidden'); panelOpen = false; EXTRA.searchHerbs(); }, inSettle));
    f.append(act('Jagen', 'Fährtensuchen, dann Wurfspeer oder Speer; halber Tag', () => { $('#panel').classList.add('hidden'); panelOpen = false; EXTRA.hunt(); }, inSettle));
    f.append(act('Eins mit der Natur', '6 AsP · bis Sonnenaufgang Wildnistalente leichter', () => { $('#panel').classList.add('hidden'); panelOpen = false; EXTRA.einsNatur(); }, inSettle || G.fx.einsNatur));
    f.append(act('Rasten bis zum Morgen', 'Der Tag endet. (Das Buch gibt dir dafür keine Kräfte zurück.)', () => { $('#panel').classList.add('hidden'); panelOpen = false; EXTRA.camp(); }, inSettle));
    const usable = Object.keys(G.inv).filter(k => ITEMS[k] && ITEMS[k].kind === 'use');
    if (usable.length) { f.append(el('h3', {}, 'Heilmittel')); for (const id of usable) f.append(act(`${id} (${G.inv[id]})`, ITEMS[id].desc, () => { UI.useItem(id); UI.lager(); })); }
    panel('Lager', f);
  };
  // Laden
  UI.shop = function (items, done, sell) {
    const draw = () => {
      const f = document.createDocumentFragment();
      f.append(el('div', { class: 'note' }, `Du hast ${G.silver} Silbertaler.`));
      for (const [name, price, extra] of items) {
        const id = itemId(name); const it = ITEMS[id] || {};
        const r = el('div', { class: 'itm' }, el('div', {}, `${name}: ${price} S`, el('small', {}, extra || it.desc || (it.tp ? `${it.tal}, TP ${it.tp}` : it.rs ? `RS ${it.rs}` : ''))));
        const b = btn('Kaufen', () => { if (G.silver < price) return; G.silver = Math.round((G.silver - price) * 10) / 10; G.inv[id] = (G.inv[id] || 0) + 1; AUD.sfx('coin'); UI.toast(`Gekauft: ${name}`); if (it.kind === 'weapon' && (G.weapon === 'Wanderstab' || G.weapon === 'Fäuste')) G.weapon = id; if (it.kind === 'armor' && !G.armor) G.armor = id; UI.hud(); draw(); });
        if (G.silver < price) b.disabled = true;
        r.append(b); f.append(r);
      }
      panel('Einkaufen', f, () => done());
    };
    draw();
  };

  // ---------------- Ende
  UI.ending = function () {
    const passed = G.kw.includes('QUESTE BESTANDEN') || G.flags.questOk;
    let ap = 100 + Math.max(0, 10 * G.odun - 10 * G.blut);
    if (G.kw.includes('DUNDOCHS FRIEDEN')) ap += 30;
    if (G.kw.includes('HEIMGEBRACHT')) ap += 20;
    if (G.kw.includes('STIRN') && passed) ap += 10;
    const se = [];
    if (G.flags.orkland || G.flags.marschen) se.push('Wildnisleben');
    if (G.flags.nebelmoor) se.push('Orientierung');
    if (passed) se.push('Ritualkenntnis');
    if (G.blut <= 1) se.push('Selbstbeherrschung');
    if (G.flags.ringWon) se.push('Raufen');
    if (G.flags.hakonGerettet) se.push('Schwimmen');
    const f = document.createDocumentFragment();
    f.append(el('div', { class: 'grid', style: 'grid-template-columns:repeat(3,1fr)' },
      el('div', { class: 'cell' }, el('b', {}, ap), el('span', {}, 'Abenteuerpunkte')),
      el('div', { class: 'cell' }, el('b', {}, G.odun), el('span', {}, 'Zeichen')),
      el('div', { class: 'cell' }, el('b', {}, G.blut), el('span', {}, 'Blutdurst'))));
    f.append(el('h3', {}, 'Spezielle Erfahrungen'), el('div', {}, se.length ? se.join(', ') : 'keine'));
    f.append(el('h3', {}, passed ? 'Gabe' : 'Die Queste'), el('div', {}, passed ? 'Haut des Odûn (WdZ S. 168–169). Die 200 AP waren dafür schon zurückgelegt.' : 'Der graue Keiler wartet zur nächsten Sonnenwende am Keilerstein über Lyrgach.'));
    f.append(el('h3', {}, 'Für die Helden-Software'));
    const txt = `Die Haut des Odûn – ${G.name}\nAP: ${ap}\nSpezielle Erfahrungen: ${se.join(', ') || 'keine'}\n${passed ? 'Gabe: Haut des Odûn' : 'Queste nicht bestanden'}\nTage: ${G.day} · Zeichen des Odûn: ${G.odun} · Blutdurst: ${G.blut}\nSilber: ${G.silver} S\nGegenstände: ${Object.keys(G.inv).join(', ')}\nSchlüsselwörter: ${G.kw.join(', ')}`;
    const ta = el('textarea', { style: 'width:100%;height:170px;font-size:13px;border-radius:8px;border:1px solid #c9b48a;padding:8px;font-family:inherit' }); ta.value = txt;
    f.append(ta, el('div', { class: 'row', style: 'margin-top:8px' }, btn('Kopieren', () => { ta.select(); const ok = () => UI.toast('Kopiert'); const fb = () => { try { document.execCommand('copy'); ok(); } catch (e) { UI.toast('Text ist markiert: bitte selbst kopieren.'); } }; try { navigator.clipboard.writeText(txt).then(ok, fb); } catch (e) { fb(); } })));
    panel('Abenteuerbericht', f);
  };

  // ---------------- Knoepfe unten
  UI.initBar = function () {
    $$('#bottombar button').forEach(b => b.addEventListener('click', () => {
      AUD.unlock(); AUD.sfx('click'); ENG.stop();
      const k = b.dataset.b;
      if (k === 'held') UI.held(); else if (k === 'pack') UI.pack(); else if (k === 'journal') UI.journal(); else if (k === 'map') MAPVIEW.open(); else if (k === 'menu') UI.menu(); else if (k === 'lager') UI.lager();
    }));
    $('#zoombtn').addEventListener('click', () => ENG.toggleZoom());
  };
})();
