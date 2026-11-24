'use strict';
// ---------------------------------------------------------------- Start, Titel, Hauptschleife
(function () {
  let last = 0, running = false;
  function loop(t) {
    const dt = Math.min(0.1, (t - last) / 1000 || 0); last = t;
    try { ENG.update(dt); ENG.draw(t); } catch (e) { console.error(e); }
    requestAnimationFrame(loop);
  }
  function showGame() {
    $('#title').classList.add('hidden');
    ['#hud', '#bottombar', '#zoombtn'].forEach(s => $(s).classList.remove('hidden'));
    ENG.resize(); UI.hud(); UI.place();
    if (!running) { running = true; requestAnimationFrame(loop); }
    AUD.music(G.map === 'world' ? AUD.regionTheme() : (MAPS[G.map].music || 'town'));
  }
  function newGameDialog() {
    const box = $('#titlebox');
    box.innerHTML = '';
    let daughter = false;
    const name = el('input', { value: 'Yurrgold', maxlength: 24, style: 'width:100%;min-height:48px;font-size:18px;border-radius:10px;border:2px solid #6b4a2b;padding:8px 12px;font-family:inherit;background:#f6ecd4;color:#2a1c12;margin:6px 0 4px' });
    const bS = el('button', {}, 'Dundochs Sohn'), bT = el('button', { class: 'alt' }, 'Dundochs Tochter');
    const mark = () => { bS.style.outline = daughter ? '' : '3px solid #ffd27a'; bT.style.outline = daughter ? '3px solid #ffd27a' : ''; };
    bS.addEventListener('click', () => { daughter = false; if (name.value === 'Gjalla') name.value = 'Yurrgold'; mark(); AUD.unlock(); AUD.sfx('click'); });
    bT.addEventListener('click', () => { daughter = true; if (name.value === 'Yurrgold') name.value = 'Gjalla'; mark(); AUD.unlock(); AUD.sfx('click'); });
    const go = el('button', { style: 'margin-top:14px' }, 'Aufbrechen');
    go.addEventListener('click', () => {
      AUD.unlock();
      ENG.newGame({ name: (name.value || '').trim() || (daughter ? 'Gjalla' : 'Yurrgold'), daughter });
      showGame();
      setTimeout(() => STORY.start(1), 300);
    });
    box.append(el('h1', { style: 'font-size:30px' }, 'Wer kehrt heim?'),
      el('div', { class: 'sub', style: 'margin-bottom:8px' }, 'Gjalskerländer Tierkrieger, Durro-Dûn des Keilers. Den Namen wählst du selbst.'),
      el('div', { style: 'display:flex;gap:8px' }, bS, bT), name, go,
      el('div', { class: 'fine' }, 'Beide Ausgaben erzählen dasselbe Abenteuer, nur die Anreden unterscheiden sich.'));
    mark();
  }
  async function boot() {
    try {
      await ART.load();
      ENG.initMaps(); applyLoc(); TTS.init();
      ENG.initCanvas(); ENG.initInput(); UI.initBar();
      PICS.title($('#titlepic'));
      const has = !!store.get('odun_save_v2', null);
      if (has) $('#btnContinue').classList.remove('hidden');
      $('#btnContinue').addEventListener('click', () => {
        AUD.unlock();
        if (!ENG.load()) { UI.toast('Kein Spielstand gefunden.'); return; }
        showGame();
        setTimeout(() => STORY.resume(), 300);
      });
      $('#btnNew').addEventListener('click', () => { AUD.unlock(); newGameDialog(); });
    } catch (e) {
      console.error(e);
      document.body.append(el('div', { style: 'position:fixed;left:0;right:0;bottom:0;background:#8e2219;color:#fff;padding:12px;z-index:99' }, 'Fehler beim Laden: ' + e.message));
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && G) ENG.save(); });
  window.addEventListener('pagehide', () => { if (G) ENG.save(); });
  window.addEventListener('error', e => { if (G) console.error(e.message); });
  boot();
})();
