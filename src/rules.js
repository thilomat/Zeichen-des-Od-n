'use strict';
// ---------------------------------------------------------------- Held und Regeln (nach dem Spielbuch, DSA 4.1)
const HERO = {
  attr: { MU: 15, KL: 10, IN: 14, CH: 12, FF: 8, GE: 14, KO: 16, KK: 15 },
  max: { le: 35, au: 41, ae: 15 },
  mr: 3, iniB: 12, atB: 9, paB: 9, fkB: 7,
  // Talent: [TaW, Probe]
  tal: {
    'Athletik': [6, 'GE/KO/KK'], 'Klettern': [3, 'MU/GE/KK'], 'Körperbeherrschung': [6, 'MU/IN/GE'], 'Schleichen': [4, 'MU/IN/GE'],
    'Schwimmen': [4, 'GE/KO/KK'], 'Selbstbeherrschung': [8, 'MU/KO/KK'], 'Sich verstecken': [2, 'MU/IN/GE'], 'Singen': [0, 'IN/CH/CH'],
    'Sinnenschärfe': [8, 'KL/IN/IN'], 'Tanzen': [0, 'CH/GE/GE'], 'Zechen': [1, 'IN/KO/KK'],
    'Menschenkenntnis': [2, 'KL/IN/CH'], 'Überreden': [0, 'MU/IN/CH'],
    'Fährtensuchen': [7, 'KL/IN/KO'], 'Fallen stellen': [3, 'KL/FF/KK'], 'Fischen/Angeln': [2, 'IN/FF/KK'], 'Orientierung': [4, 'KL/IN/IN'],
    'Wettervorhersage': [3, 'KL/IN/IN'], 'Wildnisleben': [7, 'IN/GE/KO'],
    'Götter und Kulte': [2, 'KL/KL/IN'], 'Pflanzenkunde': [4, 'KL/IN/FF'], 'Rechnen': [0, 'KL/KL/IN'], 'Sagen und Legenden': [2, 'KL/IN/CH'], 'Tierkunde': [2, 'MU/KL/IN'],
    'Thorwalsch': [8, 'KL/IN/CH'], 'Ologhaijan': [6, 'KL/IN/CH'], 'Alaani': [4, 'KL/IN/CH'],
    'Abrichten': [1, 'MU/IN/CH'], 'Feuersteinbearbeitung': [4, 'KL/FF/FF'], 'Gerber/Kürschner': [5, 'KL/FF/KO'], 'Heilkunde Wunden': [4, 'KL/CH/FF'],
    'Holzbearbeitung': [3, 'KL/FF/KK'], 'Kochen': [0, 'KL/IN/FF'], 'Lederarbeiten': [4, 'KL/FF/FF'],
    'Ritualkenntnis': [7, 'MU/KO/KK'],
    'Raufen': [8, 'GE/GE/KK'],   // nur fuer die letzte Pruefung der Queste
  },
  talGroups: {
    'Körper': ['Athletik', 'Klettern', 'Körperbeherrschung', 'Schleichen', 'Schwimmen', 'Selbstbeherrschung', 'Sich verstecken', 'Sinnenschärfe', 'Zechen'],
    'Gesellschaft': ['Menschenkenntnis', 'Überreden'],
    'Natur': ['Fährtensuchen', 'Fallen stellen', 'Fischen/Angeln', 'Orientierung', 'Wettervorhersage', 'Wildnisleben'],
    'Wissen': ['Götter und Kulte', 'Pflanzenkunde', 'Sagen und Legenden', 'Tierkunde'],
    'Sprachen': ['Thorwalsch', 'Ologhaijan', 'Alaani'],
    'Handwerk': ['Abrichten', 'Feuersteinbearbeitung', 'Gerber/Kürschner', 'Heilkunde Wunden', 'Holzbearbeitung', 'Lederarbeiten'],
    'Ritual': ['Ritualkenntnis'],
  },
  // Kampftalente: [TaW, AT, PA]
  kampf: {
    'Speere': [9, 14, 13], 'Hiebwaffen': [6, 12, 12], 'Raufen': [8, 13, 13], 'Ringen': [5, 13, 10], 'Dolche': [2, 10, 10],
    'Säbel': [0, 9, 9], 'Zweihandhiebwaffen': [1, 10, 9], 'Wurfspeere': [5, 12, 0],
  },
  spells: {
    'Axxeleratus': { zfw: 4, probe: 'KL/GE/KO', cost: 7, text: 'ZfP* × 3 Kampfrunden: PA +2, Nahkampf-TP +2, Gegner parieren um 2 erschwert, INI-Basis verdoppelt.' },
    'Eins mit der Natur': { zfw: 3, probe: 'IN/GE/KO', cost: 6, text: 'Bis zum nächsten Sonnenaufgang Fährtensuchen, Orientierung, Wettervorhersage und Wildnisleben um ZfP* erleichtert. Nicht in Siedlungen.' },
    'Eiseskälte Kämpferherz': { zfw: 3, probe: 'MU/IN/KO', cost: 5, text: 'Für einen Kampf weder Schmerz noch Furcht.' },
    'Horriphobus': { zfw: 3, probe: 'MU/IN/CH', cost: 7, text: 'Gegner sehen eine Schreckgestalt und weichen zurück oder fliehen; was geschieht, steht im Text.' },
    'Leib der Erde': { zfw: 3, probe: 'MU/IN/GE', cost: 10, text: 'Erde, Holz und Pflanzen schaden dir nicht. Gegen Holzwaffen, Krallen, Bisse und Fäuste RS + ZfP*/3.' },
  },
  traits: { 'Aberglaube': 9, 'Jähzorn': 8, 'Meeresangst': 5, 'Neugier': 5, 'Prinzipientreue': 5, 'Rachsucht': 8, 'Totenangst': 5, 'Vorurteile gegen Orks': 10 },
  vorteile: ['Eisern', 'Herausragender Sinn (Geruch)', 'Kälteresistenz', 'Meisterhandwerk (KO; Raufen, Selbstbeherrschung, Sinnenschärfe)', 'Schutzgeist', 'Übernatürliche Begabung (5 Zauber)', 'Viertelzauberer', 'Zäher Hund'],
  sf: ['Finte', 'Waffenloser Kampfstil: Bornländisch', 'Wurf', 'Würgegriff', 'Niederringen', 'Griff', 'Halten', 'Tritt', 'Kopfstoß', 'Waldkundig', 'Sumpfkundig', 'Kulturkunde (Gjalskerländer)', 'Ritualkenntnis: Durro-Dûn 7', 'Gabe des Odûn: Hauch des Odûn'],
  hauch: ['KO', 'Raufen', 'Selbstbeherrschung', 'Sinnenschärfe'],
};
// Gegenstaende: id -> Daten
const ITEMS = {
  'Wanderstab': { kind: 'weapon', tal: 'Hiebwaffen', tp: '1W+1', desc: 'Knorriger Stab, im Kampf wie ein Knüppel' },
  'Jagdspieß': { kind: 'weapon', tal: 'Speere', tp: '1W+6' },
  'Speer': { kind: 'weapon', tal: 'Speere', tp: '1W+5' },
  'Saufeder': { kind: 'weapon', tal: 'Speere', tp: '1W+6' },
  'Arbach': { kind: 'weapon', tal: 'Säbel', tp: '1W+4' },
  'Orknase': { kind: 'weapon', tal: 'Zweihandhiebwaffen', tp: '2W+4' },
  'Knüppel': { kind: 'weapon', tal: 'Hiebwaffen', tp: '1W+2' },
  'Dolch': { kind: 'weapon', tal: 'Dolche', tp: '1W+1' },
  'Dundochs Spieß': { kind: 'weapon', tal: 'Speere', tp: '1W+6', desc: 'Der Jagdspieß deines Vaters, Eschenholz' },
  'Hakons Silberreif': { kind: 'gear', desc: 'Geflochtenes Silber, etwa 8 Silbertaler wert' },
  'Wurfspeer': { kind: 'throw', tal: 'Wurfspeere', tp: '1W+4', desc: 'Zum Werfen, solange der Gegner anrennt' },
  'Fellweste': { kind: 'armor', rs: 1 },
  'Lederweste': { kind: 'armor', rs: 1 },
  'Heiltrank': { kind: 'use', heal: '3W6', desc: 'Heilt einmal 3W6 LeP' },
  'Wolfskrautsalbe': { kind: 'use', heal: '1W6+2', desc: 'Heilt einmal 1W6+2 LeP' },
  'Wegzehrung': { kind: 'food', desc: 'Proviant für einige Tage' },
  'Kurzbogen': { kind: 'gear', desc: 'Für Caithra: Fernkampf 14, TP 1W+4' },
  'Mückennetz': { kind: 'gear', desc: 'Gegen die Mücken der Marschen' },
  'Mückenfett': { kind: 'gear', desc: 'Stinkt, aber die Mücken meiden dich' },
  'Zaubertrank': { kind: 'use', ae: '2W6', desc: 'Gibt einmal 2W6 AsP zurück' },
  // Kraeuter (Extras)
  'Einbeeren': { kind: 'use', heal: '1W3', desc: 'Eine Handvoll heilt 1W3 LeP' },
  'Wirselkraut': { kind: 'use', heal: '1W6', desc: 'Auf eine Wunde gelegt: 1W6 LeP' },
  'Vierblättrige Einbeere': { kind: 'use', heal: '2W6', desc: 'Selten und kostbar: 2W6 LeP' },
  'Gulmond': { kind: 'use', aup: '2W6', desc: 'Gekaut gibt es 2W6 AuP zurück' },
  'Belmart': { kind: 'use', aup: '1W6', desc: 'Bitteres Sumpfkraut: 1W6 AuP' },
};
const START_ITEMS = ['Wanderstab', 'Wollumhang mit Kapuze', 'Kilt aus grober Wolle', 'Ogerreißzahn an Lederschnur', 'Goldener Armreif', 'Holzbecher',
  'Feuerstein und Stahl', 'Alte Decke', 'Verbeulter Messingtopf', 'Heiltrank', 'Proviantbeutel', 'Wasserschlauch', 'Schlauch mit Salzwasser'];
// Namen im Buchtext -> Gegenstands-Id
const ITEM_ALIAS = { 'Armreif': 'Goldener Armreif', 'goldener Armreif': 'Goldener Armreif', 'Messingtopf': 'Verbeulter Messingtopf', 'Salzwasser': 'Schlauch mit Salzwasser' };
function itemId(n) { return ITEM_ALIAS[n] || n; }

const R = {};
(function () {
  // Aktuelle Erschwernisse (0 AuP: alles +2)
  R.exhausted = () => G.au <= 0;
  R.attrVal = a => HERO.attr[a];
  // Talentwert inkl. Boni (Eins mit der Natur)
  R.taw = name => {
    if (HERO.tal[name]) {
      let t = HERO.tal[name][0];
      if (G.fx && G.fx.einsNatur && ['Fährtensuchen', 'Orientierung', 'Wettervorhersage', 'Wildnisleben'].includes(name)) t += G.fx.einsNatur;
      return t;
    }
    if (HERO.spells[name]) return HERO.spells[name].zfw;
    return 0;
  };
  R.probeAttrs = name => (HERO.tal[name] ? HERO.tal[name][1] : HERO.spells[name] ? HERO.spells[name].probe : '').split('/');
  R.isAttr = name => name in HERO.attr;
  R.kind = name => R.isAttr(name) ? 'attr' : HERO.spells[name] ? 'spell' : HERO.tal[name] ? 'talent' : HERO.traits[name] !== undefined ? 'trait' : 'unknown';
  // Eigenschaftsprobe: rolls=[w]
  R.evalAttr = (attr, mod, rolls, bonus) => {
    const v = HERO.attr[attr] + (bonus || 0) - mod - (R.exhausted() ? 2 : 0);
    const r = rolls[0];
    const ok = r === 1 ? true : r === 20 ? false : r <= v;
    return { ok, need: [v], rolls, left: v - r, crit: r === 1 ? 'lucky' : r === 20 ? 'fumble' : null };
  };
  // Talent-/Zauberprobe nach den Buchregeln
  R.evalTalent = (name, mod, rolls, bonusTaw) => {
    const attrs = R.probeAttrs(name).map(a => HERO.attr[a]);
    const taw = R.taw(name) + (bonusTaw || 0);
    let pts = taw - mod - (R.exhausted() ? 2 : 0);
    const ones = rolls.filter(r => r === 1).length, twenties = rolls.filter(r => r === 20).length;
    let ok, left, need;
    if (pts >= 0) {
      let p = pts;
      for (let i = 0; i < 3; i++) if (rolls[i] > attrs[i]) p -= rolls[i] - attrs[i];
      ok = p >= 0; left = p; need = attrs.slice();
    } else {
      need = attrs.map(a => a + pts);
      ok = rolls.every((r, i) => r <= need[i]); left = ok ? 0 : -rolls.reduce((s, r, i) => s + Math.max(0, r - need[i]), 0);
    }
    let crit = null;
    if (ones >= 2) { ok = true; crit = 'lucky'; left = Math.max(left, taw); }
    if (twenties >= 2) { ok = false; crit = 'fumble'; }
    const star = ok ? Math.max(1, Math.min(taw, left)) : 0;
    return { ok, need, rolls, left, star, pts, crit, attrs: R.probeAttrs(name) };
  };
  // Modifikatoren fuer die Anzeige
  R.modText = mod => mod > 0 ? '+' + mod : mod < 0 ? '−' + (-mod) : '±0';
  // Waffe
  R.weapon = () => {
    const id = G.weapon || 'Wanderstab';
    if (id === 'Fäuste') return { id, name: 'Fäuste', tal: 'Raufen', tp: '1W+1', aus: true };
    const it = ITEMS[id] || ITEMS['Wanderstab'];
    return { id, name: id, tal: it.tal, tp: it.tp };
  };
  R.rs = () => {
    let rs = 0;
    for (const id in G.inv) if (G.inv[id] > 0 && ITEMS[id] && ITEMS[id].kind === 'armor' && G.armor === id) rs = Math.max(rs, ITEMS[id].rs);
    return rs;
  };
  R.combatVals = tal => {
    const k = HERO.kampf[tal] || [0, HERO.atB, HERO.paB];
    return { taw: k[0], at: k[1], pa: k[2] };
  };
  R.throwCount = () => G.inv['Wurfspeer'] || 0;
})();
