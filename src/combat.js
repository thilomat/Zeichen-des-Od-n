'use strict';
// ---------------------------------------------------------------- Kampf nach den Regeln des Spielbuchs
// spec: { foes: ['Name|INI|AT|PA|LeP|RS|TP', ...] oder Objekte, seq, brawl, wrestle, range, flee:[steps]|true,
//         fleeSP, fleeLe, leader, giveupSP, horri:[steps], weaponBlut, companion:false, title, noSpells, foeFirst }
const COMPANIONS = {
  'Caithra': { name: 'Caithra', at: 11, pa: 9, max: 24, rs: 0, tp: '1W+2', ini: 11, fk: 14, desc: 'Gjalskerin aus Niellyn' },
};
const COMBAT = {};
(function () {
  let S = null; // aktueller Kampf
  const root = () => $('#combat');
  function parseFoe(f, i) {
    if (typeof f === 'object') return Object.assign({ i, sp: 0, max: f.le }, f);
    const [n, ini, at, pa, le, rs, tp, img] = f.split('|');
    return { i, name: n, ini: +ini, at: +at, pa: +pa, le: +le, max: +le, rs: +rs || 0, tp: tp || '1W+3', img: img || guessImg(n), sp: 0 };
  }
  function guessImg(n) {
    const s = n.toLowerCase();
    if (/khurgash/.test(s)) return 'khurgash';
    if (/ork|schwarzpelz|krieger/.test(s)) return /speer/.test(s) ? 'orcSpear' : /knüppel|treiber/.test(s) ? 'orcClub' : 'orc';
    if (/wolf|wölf/.test(s)) return 'wolf';
    if (/bär/.test(s)) return 'bear';
    if (/hund|dogge|rüde/.test(s)) return 'dog';
    if (/keiler|eber|bache/.test(s)) return 'boar';
    if (/leiche|moor/.test(s)) return 'corpse';
    if (/geist|toter|schemen/.test(s)) return 'ghost';
    if (/skelett|knochen/.test(s)) return 'skeleton';
    if (/egel/.test(s)) return 'leech';
    if (/söldner|deserteur|räuber|wegelagerer|plünderer/.test(s)) return 'deserter';
    if (/thorwal|hakon/.test(s)) return 'thorwal';
    if (/knecht|bauer|treiber|hirte/.test(s)) return 'man';
    if (/irrlicht/.test(s)) return 'wisp';
    return 'man';
  }
  COMBAT.parseFoe = parseFoe;

  COMBAT.run = function (spec) {
    return new Promise(resolve => {
      UI.setCombat(true);
      AUD.music('fight');
      const foes = spec.foes.map(parseFoe);
      if (spec.persist) { G.persist = G.persist || {}; if (G.persist[spec.persist] !== undefined) foes[0].le = G.persist[spec.persist]; }
      if (spec.brawl || spec.wrestle) foes.forEach(f => { f.aus = true; });
      const brawl = !!(spec.brawl || spec.wrestle);
      S = {
        spec, foes, brawl, round: 0, log: [], done: false, resolve,
        hero: { iniRoll: 0, noAttack: false, paMalus: 0, parries: 0, axx: 0, eis: spec.eis ? 1 : 0, defend: false },
        range: spec.range || 0, target: 0, auto: UI.settings().autoDice,
        comp: (G.companion && spec.companion !== false && G.companion.le > 0) ? Object.assign({ sp: 0 }, G.companion, { fk: G.inv['Kurzbogen'] ? 14 : 0 }) : null,
        weaponBefore: G.weapon,
      };
      if (brawl) S.weapon = { name: 'Fäuste', tal: 'Raufen', tp: '1W+1', aus: true };
      if (spec.weapon) S.weapon = spec.weapon;
      if (spec.weaponIfNone && R.weapon().id === 'Fäuste' && !brawl) S.weapon = spec.weaponIfNone;
      // Ini
      const iniH = HERO.iniB + W6() + (R.weapon().id === 'Jagdspieß' ? -1 : 0);
      S.hero.ini = iniH;
      foes.forEach(f => { f.iniVal = f.ini + W6(); });
      if (S.comp) S.comp.iniVal = (S.comp.ini || 12) + W6();
      render();
      log(`Initiative: du ${iniH}, ${foes.map(f => `${f.name} ${f.iniVal}`).join(', ')}${S.comp ? `, ${S.comp.name} ${S.comp.iniVal}` : ''}.`, 'x');
      if (S.range > 0 && R.throwCount() > 0 && !brawl) log('Die Gegner sind noch nicht heran. Zeit für einen Wurfspeer!', 'h');
      nextRound();
    });
  };
  function heroWeapon() { return S.weapon || R.weapon(); }
  function heroVals() {
    const w = heroWeapon();
    const k = R.combatVals(w.tal);
    let at = k.at, pa = k.pa;
    if (R.exhausted() && !S.hero.eis) { at -= 2; pa -= 2; }
    if (S.hero.axx > 0) pa += 2;
    if (G.flags.raserei) { at += 2; pa -= 4; }
    return { at, pa, taw: k.taw, tp: w.tp, tal: w.tal, name: w.name };
  }
  function alive() { return S.foes.filter(f => !f.out); }
  function active() {
    const a = alive();
    if (S.spec.seq) return a.length ? [a[0]] : [];
    return a;
  }
  // ---------------- Darstellung
  function render() {
    const r = root(); r.classList.remove('hidden'); r.innerHTML = '';
    const top = el('div', { id: 'cbtop' });
    S.foes.forEach((f, i) => {
      const c = el('canvas', { width: 16, height: 16 });
      const img = ART.figs[f.img] || ART.figs.man; c.getContext('2d').drawImage(img, 0, 0);
      const pool = f.le, max = f.max;
      const card = el('div', { class: 'foe' + (f.out ? ' dead' : '') + (i === S.target && !f.out ? ' sel' : '') },
        c, el('div', { class: 'nm' }, f.name), el('div', { class: 'lb' }, el('i', { style: `width:${Math.max(0, 100 * pool / max)}%;background:${f.aus ? '#d9a53a' : '#c0392b'}` })),
        el('div', { style: 'font-size:11px;opacity:.85' }, f.out ? f.outWhy || 'besiegt' : `${f.aus ? 'AuP' : 'LeP'} ${Math.max(0, pool)} · AT ${f.at} · PA ${f.pa}`));
      if (S.spec.seq && !f.out && active()[0] !== f) card.style.opacity = '.6';
      card.addEventListener('click', () => { if (!f.out) { S.target = i; render(); } });
      top.append(card);
    });
    if (S.comp) {
      const c = el('canvas', { width: 16, height: 16 }); c.getContext('2d').drawImage(ART.figs.archer, 0, 0);
      top.append(el('div', { class: 'foe', style: 'border-color:#4b6a33' }, c, el('div', { class: 'nm' }, S.comp.name), el('div', { class: 'lb' }, el('i', { style: `width:${100 * S.comp.le / S.comp.max}%;background:#4b8a33` })), el('div', { style: 'font-size:11px' }, `LeP ${S.comp.le}`)));
    }
    const lg = el('div', { id: 'cblog' });
    S.log.slice(-40).forEach(([t, c]) => lg.append(el('div', { class: c || '' }, t)));
    const hv = heroVals();
    const hb = el('div', { id: 'cbhero' },
      el('div', { class: 'bar le' }, el('i', { style: `width:${100 * G.le / HERO.max.le}%` }), el('em', {}, `LeP ${G.le}`)),
      el('div', { class: 'bar au' }, el('i', { style: `width:${100 * G.au / HERO.max.au}%` }), el('em', {}, `AuP ${G.au}`)),
      el('div', { class: 'bar ae' }, el('i', { style: `width:${100 * G.ae / HERO.max.ae}%` }), el('em', {}, `AsP ${G.ae}`)));
    const info = el('div', { id: 'cbinfo' }, `Runde ${S.round} · ${hv.name}: AT ${hv.at} / PA ${hv.pa} · TP ${hv.tp}${S.brawl ? ' (A)' : ''}${R.rs() ? ' · RS ' + R.rs() : ''}${S.hero.axx > 0 ? ` · Axxeleratus ${S.hero.axx} KR` : ''}${S.hero.eis ? ' · Eiseskälte' : ''}${S.range > 0 ? ' · Gegner auf Distanz' : ''}`);
    const acts = el('div', { id: 'cbacts' });
    const autoB = el('button', { style: 'margin-left:8px;min-height:30px;border-radius:15px;padding:0 10px;border:1px solid #6b5236;background:' + (S.auto ? '#4b6a33' : 'rgba(0,0,0,.4)') + ';color:#f1e4c8;font-family:inherit;font-size:12.5px;vertical-align:middle' }, S.auto ? '🎲 automatisch' : '🎲 antippen');
    autoB.addEventListener('click', () => { S.auto = !S.auto; render(); });
    info.append(autoB);
    r.append(top, lg, info, hb, acts);
    lg.scrollTop = lg.scrollHeight;
    S.acts = acts;
  }
  function log(t, c) { S.log.push([t, c]); const lg = $('#cblog'); if (lg) { lg.append(el('div', { class: c || '' }, t)); lg.scrollTop = lg.scrollHeight; } }
  function actions(list) {
    return new Promise(res => {
      const a = S.acts; a.innerHTML = '';
      list.forEach(x => {
        const b = el('button', { class: x.cls || '' }, x.label);
        if (x.disabled) b.disabled = true;
        b.addEventListener('click', () => { AUD.sfx('click'); res(x); });
        a.append(b);
      });
    });
  }
  async function roll(labels, title, sub, d6, forceAuto) {
    return DICE.quick(labels, title, sub, d6, forceAuto || S.auto);
  }
  const wait = ms => sleep(S.auto ? ms * 0.6 : ms);

  // ---------------- Ablauf
  async function nextRound() {
    while (!S.done) {
      S.round++;
      S.hero.parries = 0; S.hero.defend = false; S.hero.casting = false;
      S.foes.forEach(f => { f.parries = 0; });
      // Reihenfolge
      const actors = [{ kind: 'hero', ini: S.hero.ini * (S.hero.axx > 0 ? 1 : 1) + (S.hero.axx > 0 ? HERO.iniB : 0) }];
      active().forEach(f => actors.push({ kind: 'foe', f, ini: f.iniVal }));
      if (S.comp && S.comp.le > 0) actors.push({ kind: 'comp', ini: S.comp.iniVal });
      actors.sort((a, b) => b.ini - a.ini || (a.kind === 'hero' ? -1 : 1));
      render();
      log(`— Runde ${S.round} —`, 'x');
      for (const ac of actors) {
        if (S.done) return;
        if (ac.kind === 'hero') await heroTurn();
        else if (ac.kind === 'foe' && !ac.f.out) await foeTurn(ac.f);
        else if (ac.kind === 'comp') await compTurn();
        if (checkEnd()) return;
      }
      // Rundenende
      if (S.hero.axx > 0) { S.hero.axx--; if (!S.hero.axx) log('Der Axxeleratus verfliegt.', 's'); }
      if (S.range > 0) { S.range--; if (!S.range) log('Die Gegner sind heran.', 'x'); }
      if (checkEnd()) return;
      if (S.spec.rounds && S.round >= S.spec.rounds) { finish(false, false, true); return; }
    }
  }
  function checkEnd() {
    if (S.done) return true;
    const heroDown = S.brawl ? G.au <= 0 : G.le <= 5;
    if (heroDown) { finish(false); return true; }
    if (!alive().length) { finish(true); return true; }
    if (S.spec.stopLe !== undefined && S.foes.some(f => !f.out && f.le <= S.spec.stopLe)) { finish(true); return true; }
    return false;
  }
  function finish(win, horri, timeout) {
    S.done = true;
    if (S.spec.persist) G.persist[S.spec.persist] = Math.max(0, S.foes[0].le);
    delete G.flags.raserei;
    G.stats.fights++; if (win) G.stats.won++;
    if (S.comp && G.companion) G.companion.le = Math.max(0, S.comp.le);
    if (timeout) log('Der Kampf wird unterbrochen.', 'x');
    else log(win ? 'Der Kampf ist vorbei. Du hast gewonnen.' : horri ? 'Sie fliehen vor dem Schrecken, den sie in dir sehen.' : (S.brawl ? 'Dir geht die Luft aus. Du hast verloren.' : 'Deine Kräfte schwinden. Du bist besiegt.'), win || horri ? 'g' : 'e');
    if (G.le < 1) G.le = 1;
    UI.hud();
    actions([{ label: 'Weiter', cls: 'alt' }]).then(() => {
      root().classList.add('hidden'); UI.setCombat(false);
      AUD.music(G.map === 'world' ? AUD.regionTheme() : (MAPS[G.map].music || 'town'));
      ENG.save();
      S.resolve({ win, horri: !!horri, timeout: !!timeout });
    });
  }

  // ---------------- Held
  async function heroTurn() {
    if (S.hero.noAttack) { S.hero.noAttack = false; log('Du fängst dich nach dem Patzer und kommst nicht zum Angriff.', 'e'); return; }
    const hv = heroVals();
    const tg = active().includes(S.foes[S.target]) && !S.foes[S.target].out ? S.foes[S.target] : active()[0];
    if (!tg) return;
    S.target = tg.i;
    let finte = 0, wucht = 0;
    for (; ;) {
      render();
      const list = [];
      const manTxt = (finte ? ` Finte ${finte}` : '') + (wucht ? ` Wucht ${wucht}` : '');
      if (S.range > 0 && !S.brawl) {
        if (R.throwCount() > 0) list.push({ k: 'throw', label: `🎯 Wurfspeer werfen (${R.throwCount()})`, cls: 'alt' });
        list.push({ k: 'wait', label: 'Abwarten', cls: 'grey' });
      } else list.push({ k: 'at', label: `⚔ Angriff auf ${tg.name}${manTxt}` });
      if (!S.brawl && S.range <= 0) {
        list.push({ k: 'finte', label: `Finte ${finte ? finte + ' (+1)' : '+1'}`, cls: 'grey', disabled: finte + wucht >= hv.taw });
        list.push({ k: 'wucht', label: `Wuchtschlag ${wucht ? wucht + ' (+1)' : '+1'}`, cls: 'grey', disabled: finte + wucht >= hv.taw });
        if (finte || wucht) list.push({ k: 'reset', label: 'Ansagen löschen', cls: 'grey' });
      }
      if (S.spec.wrestle) list.push({ k: 'wurf', label: 'Wurf (Ringen +4)', cls: 'alt' });
      if (!S.spec.noSpells && !S.brawl) {
        if (!S.hero.axx) list.push({ k: 'axx', label: 'Axxeleratus (7 AsP)', cls: 'alt', disabled: G.ae < 4 });
        if (!S.hero.eis) list.push({ k: 'eis', label: 'Eiseskälte (5 AsP)', cls: 'alt', disabled: G.ae < 3 });
      }
      if (S.spec.horri) list.push({ k: 'horri', label: 'Horriphobus (7 AsP)', cls: 'alt', disabled: G.ae < 4 });
      if (S.brawl && S.spec.weaponBlut) list.push({ k: 'weapon', label: 'Zur Waffe greifen', cls: 'grey' });
      const heal = Object.keys(G.inv).filter(k => ITEMS[k] && ITEMS[k].kind === 'use' && ITEMS[k].heal);
      if (heal.length) list.push({ k: 'heal', label: `Heilmittel (${heal.length})`, cls: 'grey' });
      list.push({ k: 'def', label: 'Nur verteidigen', cls: 'grey' });
      if (S.spec.flee) list.push({ k: 'flee', label: 'Fliehen', cls: 'grey' });
      const ch = await actions(list);
      if (ch.k === 'finte') { finte++; continue; }
      if (ch.k === 'wucht') { wucht++; continue; }
      if (ch.k === 'reset') { finte = 0; wucht = 0; continue; }
      if (ch.k === 'wait') { log('Du wartest ab, den Blick auf die Gegner.', 'h'); return; }
      if (ch.k === 'def') { S.hero.defend = true; log('Du verteidigst dich nur und wartest auf eine Lücke.', 'h'); return; }
      if (ch.k === 'flee') { log('Du suchst dein Heil in der Flucht.', 'h'); S.done = true; root().classList.add('hidden'); UI.setCombat(false); S.resolve({ win: false, fled: true }); return; }
      if (ch.k === 'heal') {
        const pick = await actions(heal.map(k => ({ label: `${k} (${G.inv[k]})`, k })).concat([{ label: 'Zurück', cls: 'grey', k: null }]));
        if (!pick.k) continue;
        UI.useItem(pick.k); log(`Du nimmst ${pick.k}. LeP jetzt ${G.le}.`, 'g'); return;
      }
      if (ch.k === 'weapon') {
        S.weapon = null; G.weapon = S.weaponBefore || 'Wanderstab'; S.brawl = false; S.foes.forEach(f => { f.aus = false; });
        STORY.fx('b1'); log('Du greifst zur Waffe. Das ist kein Raufen mehr. (+1 Blutdurst)', 'e'); continue;
      }
      if (ch.k === 'axx' || ch.k === 'eis' || ch.k === 'horri') {
        const sp = ch.k === 'axx' ? 'Axxeleratus' : ch.k === 'eis' ? 'Eiseskälte Kämpferherz' : 'Horriphobus';
        const r = await DICE.probe(sp, 0, { noAsp: true });
        const cost = r.ok ? HERO.spells[sp].cost : Math.ceil(HERO.spells[sp].cost / 2);
        G.ae = Math.max(0, G.ae - cost); UI.hud();
        if (!r.ok) { log(`${sp} misslingt (−${cost} AsP).`, 'e'); S.hero.casting = true; return; }
        if (ch.k === 'axx') { S.hero.axx = r.star * 3; log(`Axxeleratus! Für ${S.hero.axx} Kampfrunden bist du schneller als jeder Gegner (−${cost} AsP).`, 's'); }
        if (ch.k === 'eis') { S.hero.eis = r.star; log(`Eiseskälte Kämpferherz: kein Schmerz, keine Furcht (−${cost} AsP).`, 's'); }
        if (ch.k === 'horri') { log(`Horriphobus! Deine Gegner sehen eine Schreckgestalt (−${cost} AsP).`, 's'); S.done = true; await wait(600); finish(false, true); return; }
        S.hero.casting = true; // Zauber kostet die Runde
        return;
      }
      if (ch.k === 'throw') { await heroThrow(tg); return; }
      if (ch.k === 'wurf') { await heroWurf(tg); return; }
      await heroAttack(tg, finte, wucht);
      return;
    }
  }
  async function heroThrow(tg) {
    G.inv['Wurfspeer']--; if (!G.inv['Wurfspeer']) delete G.inv['Wurfspeer'];
    const fk = HERO.kampf['Wurfspeere'][1] - (R.exhausted() ? 2 : 0);
    const [w] = await roll([`FK ${fk}`], `Wurfspeer auf ${tg.name}`, `W20 höchstens ${fk}`);
    if (w <= fk && w !== 20) {
      const [d] = await roll(['1W6+4'], 'Trefferpunkte', 'Wurfspeer: 1W+4', true);
      const sp = Math.max(0, d + 4 - tg.rs);
      hurtFoe(tg, sp, `Dein Wurfspeer trifft ${tg.name}: ${d + 4} TP, ${sp} SP.`);
      AUD.sfx('hit');
    } else { log(`Der Wurfspeer verfehlt ${tg.name}.`, 'x'); AUD.sfx('miss'); }
    await wait(300);
  }
  async function heroWurf(tg) {
    const at = R.combatVals('Ringen').at - 4 - (R.exhausted() ? 2 : 0);
    const [w] = await roll([`Ringen ${at}`], `Wurf gegen ${tg.name}`, `Ringen-AT +4: höchstens ${at}`);
    if (w > at || w === 20) { log('Dein Griff rutscht ab.', 'x'); AUD.sfx('miss'); return; }
    const pa = foePa(tg, 0);
    const p = W20();
    if (p <= pa && p !== 20) { log(`${tg.name} windet sich aus dem Griff (PA ${p}).`, 'x'); AUD.sfx('parry'); return; }
    tg.out = true; tg.outWhy = 'geworfen'; tg.le = 0;
    log(`Du packst ${tg.name}, hebst ihn aus und wirfst ihn auf den Rücken!`, 'g'); AUD.sfx('hit');
    await wait(400);
  }
  function foePa(f, finte) {
    let pa = f.pa - (finte || 0) - (S.hero.axx > 0 ? 2 : 0);
    return pa;
  }
  async function heroAttack(tg, finte, wucht) {
    const hv = heroVals();
    const at = hv.at - finte - wucht;
    const [w] = await roll([`AT ${at}`], `Angriff auf ${tg.name}`, `W20 höchstens ${at}${finte ? `, Finte ${finte}` : ''}${wucht ? `, Wuchtschlag ${wucht}` : ''}`);
    let lucky = false;
    if (w === 20) {
      const [c] = await roll([`AT ${at}`], 'Patzer? Bestätigungswurf', 'Gelingt er, ist es nur ein Fehlschlag');
      if (c > at) { log('Patzer! Du stolperst und kommst nächste Runde nicht zum Angriff.', 'e'); S.hero.noAttack = true; AUD.sfx('fail'); }
      else log('Daneben.', 'x');
      if (finte || wucht) S.hero.paMalus = finte + wucht;
      return;
    }
    if (w > at) { log(`Dein Angriff geht ins Leere (${w}).`, 'x'); AUD.sfx('miss'); if (finte || wucht) { S.hero.paMalus = finte + wucht; log(`Deine nächste Parade ist um ${finte + wucht} erschwert.`, 'x'); } return; }
    if (w === 1) {
      const [c] = await roll([`AT ${at}`], 'Glückliche Attacke? Bestätigen', `W20 höchstens ${at}`);
      if (c <= at) { lucky = true; log('Glückliche Attacke!', 'g'); }
    }
    // Parade des Gegners
    let pa = foePa(tg, finte);
    if (lucky) pa = Math.floor(pa / 2);
    if (tg.parries) pa -= 4 * tg.parries;
    tg.parries = (tg.parries || 0) + 1;
    const p = tg.pa > 0 ? W20() : 99;
    if (p <= pa && p !== 20) { log(`${tg.name} pariert (${p}).`, 'x'); AUD.sfx('parry'); await wait(250); return; }
    // Schaden
    const tpExpr = hv.tp;
    const m = tpExpr.match(/(\d*)W\+?(\d*)/);
    const nd = +(m && m[1] || 1), add = +(m && m[2] || 0);
    const dice = await roll(Array.from({ length: nd }, () => 'W6'), 'Trefferpunkte', `${tpExpr}${wucht ? ' + Wucht ' + Math.ceil(wucht / 2) : ''}${S.hero.axx > 0 && !S.brawl ? ' + 2 (Axxeleratus)' : ''}${lucky ? ', verdoppelt' : ''}`, true);
    let tp = dice.reduce((a, b) => a + b, 0) + add;
    if (lucky) tp *= 2;
    tp += Math.ceil(wucht / 2) + (S.hero.axx > 0 && !S.brawl ? 2 : 0);
    const sp = Math.max(0, tp - (S.brawl ? 0 : tg.rs));
    hurtFoe(tg, sp, `Du triffst ${tg.name}: ${tp} TP${S.brawl ? '(A)' : ''}, ${sp} ${S.brawl ? 'Schaden an der Ausdauer' : 'SP'}.`);
    AUD.sfx('hit');
    await wait(300);
  }
  function hurtFoe(f, sp, msg) {
    f.le -= sp; f.sp += sp;
    log(msg, 'h');
    const spec = S.spec;
    if (f.le <= 0) {
      f.out = true; f.outWhy = S.brawl ? 'am Boden' : (f.undead ? 'zerfallen' : 'liegt am Boden');
      log(`${f.name} ${S.brawl ? 'geht zu Boden und bleibt liegen' : 'bricht zusammen'}.`, 'g');
      if (spec.leader === f.i) { S.foes.forEach(o => { if (!o.out) { o.out = true; o.outWhy = 'geflohen'; o.fled = true; } }); log('Ihr Anführer ist gefallen. Die anderen fliehen!', 'g'); }
    } else if (spec.fleeSP && f.sp >= spec.fleeSP && f.i !== spec.leader && f.i !== spec.fleeExcept && !(spec.fleeNotLast && alive().length <= 1)) {
      f.out = true; f.outWhy = 'geflohen'; f.fled = true; log(`${f.name} hat genug und flieht.`, 'g');
    } else if (spec.fleeLe && f.le <= spec.fleeLe) {
      f.out = true; f.outWhy = 'geflohen'; f.fled = true; log(`${f.name} wendet sich zur Flucht.`, 'g');
    } else if (spec.giveupSP && f.sp >= spec.giveupSP) {
      f.out = true; f.outWhy = 'gibt auf'; f.fled = true; log(`${f.name} gibt auf.`, 'g');
    }
    render();
  }

  // ---------------- Gegner
  async function foeTurn(f) {
    if (S.range > 0 && !f.ranged) { return; }
    if (f.noAttack) { f.noAttack = false; log(`${f.name} rappelt sich nach dem Patzer auf.`, 'x'); return; }
    // Gegner mit Begleitung: der letzte Gegner nimmt sich die Begleiterin vor
    if (S.comp && S.comp.le > 0 && !S.spec.seq && alive().length > 1 && f === alive()[alive().length - 1]) return foeVsComp(f);
    await wait(350);
    let at = f.at, bonus = 0;
    if (f.wucht && !f.wuchtUsed && S.round >= 2) { f.wuchtUsed = true; at -= f.wucht; bonus = f.wucht; log(`${f.name} holt zu einem gewaltigen Wuchtschlag aus!`, 'e'); }
    f.bonus = bonus;
    const w = W20();
    if (w === 20) { if (W20() > at) { f.noAttack = true; log(`${f.name} patzt und kommt ins Straucheln.`, 'g'); } else log(`${f.name} verfehlt dich.`, 'x'); return; }
    if (w > at) { log(`${f.name} greift an und verfehlt dich (${w}).`, 'x'); AUD.sfx('miss'); return; }
    let lucky = false;
    if (w === 1 && W20() <= at) { lucky = true; log(`${f.name} landet eine glückliche Attacke!`, 'e'); }
    log(`${f.name} greift an (${w}) – du musst parieren!`, 'e');
    // Parade des Helden
    if (S.hero.casting) { S.hero.casting = false; await hit(f, lucky, 'Du bist beim Zaubern und kannst nicht parieren.'); return; }
    const hv = heroVals();
    let pa = hv.pa - S.hero.paMalus;
    if (S.hero.parries > 0 && !S.hero.defend) pa -= 4 * S.hero.parries;
    if (lucky) pa = Math.floor(pa / 2);
    S.hero.parries++;
    S.hero.paMalus = 0;
    const [p] = await roll([`PA ${pa}`], `Parade gegen ${f.name}`, `W20 höchstens ${pa}${S.hero.parries > 1 && !S.hero.defend ? ' (weitere Parade +4)' : ''}`);
    if (p <= pa && p !== 20) { log(`Pariert (${p})!`, 'h'); AUD.sfx('parry'); return; }
    await hit(f, lucky);
  }
  async function hit(f, lucky, pre) {
    if (pre) log(pre, 'e');
    let tp = rollExpr(f.tp) + (f.bonus || 0);
    if (lucky) tp *= 2;
    const rs = S.brawl ? 0 : R.rs() + (S.hero.eis ? 1 : 0);
    const sp = Math.max(0, tp - rs);
    if (S.brawl || f.aus) { G.au = Math.max(0, G.au - sp); log(`${f.name} trifft dich: ${sp} Schaden an deiner Ausdauer.`, 'e'); }
    else { G.le = Math.max(0, G.le - sp); log(`${f.name} trifft dich: ${tp} TP${rs ? ', RS ' + rs : ''}, ${sp} SP.`, 'e'); }
    AUD.sfx('hurt'); UI.hud(); render();
    await wait(300);
  }
  async function foeVsComp(f) {
    const c = S.comp;
    await wait(300);
    const w = W20();
    if (w <= f.at && w !== 20) {
      const p = W20();
      if (p <= c.pa) { log(`${c.name} pariert den Angriff von ${f.name}.`, 'x'); return; }
      const sp = Math.max(0, rollExpr(f.tp) - (c.rs || 0)); c.le -= sp;
      log(`${f.name} trifft ${c.name}: ${sp} SP.`, 'e');
      if (c.le <= 0) { c.le = 0; log(`${c.name} ist schwer verletzt und kämpft nicht mehr.`, 'e'); }
    } else log(`${f.name} verfehlt ${c.name}.`, 'x');
    render();
  }
  async function compTurn() {
    const c = S.comp; if (!c || c.le <= 0) return;
    const a = active(); if (!a.length) return;
    const tg = a.length > 1 && !S.spec.seq ? a[a.length - 1] : a[0];
    await wait(300);
    const atv = S.range > 0 && c.fk ? c.fk : c.at;
    const w = W20();
    if (w <= atv && w !== 20) {
      const p = S.range > 0 ? 99 : W20();
      if (p <= tg.pa && p !== 20) { log(`${c.name} greift ${tg.name} an, aber der pariert.`, 'x'); return; }
      const sp = Math.max(0, rollExpr(S.range > 0 && c.fk ? '1W+4' : c.tp) - (S.brawl ? 0 : tg.rs));
      hurtFoe(tg, sp, `${c.name} trifft ${tg.name}: ${sp} SP.`);
    } else log(`${c.name} verfehlt ${tg.name}.`, 'x');
  }
})();
