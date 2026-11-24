'use strict';
// ---------------------------------------------------------------- Abschnitte von Hand: Gjalskerland, Lyrgach, Queste, Ende
PLACE('landestelle', 'Landestelle an der Küste', 'beach', 140, 50);
PLACE('kueste', 'Küste bei Lyrgach', 'beach', 112, 52);
PLACE('ioraanifurt', 'Furt der Ioraani', 'ford', 176, 100);
PLACE('talblick', 'Hügel über dem Gjalskatal', 'hill', 134, 112);
PLACE('firunsfuss', 'Fuß des Firunswalls', 'rock', 140, 167);
Object.assign(LOC, {
  213: 'ioraanifurt', 289: 'talblick', 240: 'firunsfuss', 65: 'gjalskapass', 164: 'niellyn', 145: 'kueste',
  201: 'lyrgach', 234: 'lyrgach_dundoch', 5: 'lyrgach_megrim', 111: 'lyrgach_morghinach', 68: 'lyrgach_grab', 117: 'lyrgach_grab', 195: 'lyrgach_grab',
  108: 'lyrgach_hochweide', 44: 'lyrgach_schwitz', 33: 'lyrgach_keilerstein',
});
const KHURGASH = { name: 'Khurgash Keilerschädel', ini: 12, at: 14, pa: 10, le: 40, rs: 3, tp: '1W+5', img: 'khurgash', wucht: 4 };
// Queste: Zuschlaege
const Q = o => Object.assign({}, o, { modIf: [['k:WINTER', 1]].concat((o && o.modIf) || []) });
const RETRY = (p, txt) => IF('!f:retry', [txt ? 'x:' + txt : 'n:Du nutzt deine eine Wiederholung.', 'f:retry', Object.assign({}, p, { again: true })], ['x:Du hast keine Wiederholung mehr.', '>46']);
const Q_RITUAL = (ok, no) => P('Ritualkenntnis', 3, ok, no, Q({ modIf: [['k:KNAPP', 2], ['k:MUTTERS SEGEN', -2]] }));
const Q_NASE = (ok, no) => P('Sinnenschärfe', -5, ok, no, Q({ modIf: [['k:HEXENRAT', -2]], note: 'Nase −5' }));
const Q_KB = (ok, no) => P('Körperbeherrschung', 0, ok, no, Q({ modIf: [['k:WUNDE', 2]] }));
const Q_SB = (ok, no) => P('Selbstbeherrschung', 0, ok, no, Q({ modIf: [['b>=0', 'B4'], ['k:RUADHS RAT', -2], ['ctx:sb2', 2]], note: 'erschwert um deinen Blutdurst (höchstens 4)' }));
const Q_RAUF = (ok, no) => P('Raufen', 0, ok, no, Q({ modIf: [['k:SAUJAGD', -2], ['k:STIRN', 2], ['k:WUNDE', 2]], note: 'Raufen-Probe auf GE/GE/KK' }));

// ---------------- Firunswall und Khurgash
M(137, 't0-2', 'b1', IF('k:HIRTENJUNGE',
  [F({ foes: [KRIEGER, KRIEGER, KRIEGER], rounds: 2, title: 'Drei Orks' }, ['>129'], ['>129'], ['x:Gleich nach der zweiten Kampfrunde ruft jemand mit heller Stimme etwas.', '>215'])],
  [F({ foes: [KRIEGER, KRIEGER, KRIEGER], title: 'Drei Orks' }, ['x:Selbst nachdem du alle drei besiegt hast, kommen fünf neue, und ein Netz fällt über dich.', '>129'], ['>129'])]));
M(101, 't0-2', P('Schleichen', 4,
  ['x:Deine Finger schließen sich um das Eschenholz.', 't5', 'i+:Dundochs Spieß', 'w:Dundochs Spieß', 'k:DUNDOCHS SPIESS', 'x:Du schleichst zurück in die Felsen.', 't7', '>78'],
  ['x:Ein Ast knackt unter deinem Fuß.', 't10', '>129']));
M(209, 't0-9', IF('k:SCHREINSCHÄNDER', ['c10']), 't11', '>96');
M(296, 't0', P('Schleichen', 2, ['c2', 't3', 'k:WARNUNG', 't4', '>182'], ['x:Unter deinem Knie lösen sich Steine.', 't7', '>93']));
M(96, 't0',
  CI('!i:Dundochs Spieß', 'Hebst du den Spieß deines Vaters auf?', 'i+:Dundochs Spieß', 'w:Dundochs Spieß', 't2-4'),
  CI('armed&!i:Dundochs Spieß', 'Kämpfst du mit deiner eigenen Waffe?'),
  IF('i:Dundochs Spieß', ['w:Dundochs Spieß']),
  IF('comp', ['c7']), 'n:Niemand mischt sich ein. Einmal im Kampf schlägt Khurgash einen Wuchtschlag: um 4 erschwert, aber 4 TP mehr.',
  F({ foes: [KHURGASH], stopLe: 10, persist: 'kh1', companion: false, title: 'Zweikampf gegen Khurgash' }, ['>174'], ['>129']));
M(93, 't0-1', C('t2', P('Athletik', 3, ['c3', '>73'], ['x:Ein Ork wirft sich auf dich, dann noch drei.', '>129'])), C('Ergibst du dich?', '>>129'));
M(174, 't0-6',
  C('t7', 'k:KHURGASH-TOT', 't8', C('t9', 'b1'), C('Lässt du es dabei bewenden?')),
  C('t10', P('Selbstbeherrschung', 6, ['x:Du senkst den Spieß.', 't12', 'o2', 'k:KHURGASH-VERSCHONT'], ['x:Du stößt zu, bevor du es entscheiden kannst.', 'k:KHURGASH-TOT'])),
  't15', IF('!i:Dundochs Spieß', ['i+:Dundochs Spieß']), 'k:DUNDOCHS SPIESS', '>218');
M(218, 't0-2', IF('k:KHURGASH-TOT',
  ['x:Khurgash ist tot. Es wird keinen Überfall auf die Hochweide geben, jedenfalls nicht in diesem Jahr.'],
  ['x:Khurgash hat überlebt. Er hat dir sein Wort nicht gegeben, und du weißt nicht, was ein Ork-Wort wert ist.']), 'le+half', 'd1', '>73');
M(213, 't0-1', P('Athletik', 2, ['x:Du kämpfst dich durch die Furt.'], ['x:Das Wasser reißt dich um, bis du dich ans andere Ufer gerettet hast.', 'le-1W6']), 'd2', '>86');

// ---------------- Seefahrt
M(278, IF('k:VERSÖHNT', ['>>18']), 't1-3', TR('Jähzorn',
  ['c5', '>18'],
  ['x:Du packst den Kerl am Bart und schlägst ihm die Nase blutig, bevor Hakon brüllend dazwischengeht und euch beide mit einem Eimer Seewasser übergießt.', 'b1', '>18'],
  ['x:Hakon nickt dir vom Steuerruder aus kaum merklich zu.', 'o1', '>18']));
M(47, 't0', P('GE', 4, ['x:Das Tau spannt sich, und du ziehst Hakon mit aller Kraft heran, bis die Männer ihn an Bord hieven.', 't3', 'o1', 'k:VERSÖHNT'], ['x:Das Tau fällt ins Leere.', 't6']), '>242');
M(48, 't0-1', P('MU', 0,
  ['x:Du springst.', 't5', P('Schwimmen', 4, ['c7', 't8-10', 'o2', 'k:VERSÖHNT', 'f:hakonGerettet'], ['c11', 't12', 'le-1W6+2', 't14', 'o1', 'k:VERSÖHNT'])],
  ['x:Du stehst wie gelähmt an der Bordwand.', '>47'], { modIf: [['f:meeresangst', 3]] }), '>242');
M(242, '!landestelle', 'f-:seekrank', 't0-3', 'd2', IF('k:VERSÖHNT', ['x:Hakon steigt mit dir an Land und streift sich einen Armreif aus geflochtenem Silber vom Handgelenk.', 't6-7', 'i+:Hakons Silberreif']), '>132');
M(132, 't0-1', IF('comp', ['c2', 't3', '>164'], ['x:Du ziehst an Niellyn vorbei nach Süden, das Tal der Gjalska hinauf.', 'd3', '>222']));
M(164, 't0-6', 'i+:Speer', 'k:HEIMGEBRACHT', 't7-8', 'comp-', 'd3', '>222');

// ---------------- Ankunft in Lyrgach
M(222, 'x:Du zählst deine Tage.',
  IF('day<=40', ['c1', 'k:FRÜH', 'o1', 'n:Du hast Zeit, dich in Ruhe vorzubereiten.']),
  IF('day>=41&day<=47', ['c3']),
  IF('day>=48&day<=50', ['c4', 'k:KNAPP', 'n:Für das dreitägige Fasten vor der Queste bleibt keine Zeit mehr.']),
  IF('day=50', ['f:tag50']),
  IF('day>50', ['c6', '>201'], ['>234']));
M(201, 't0-5', IF('!k:KHURGASH-TOT&!k:KHURGASH-VERSCHONT', ['>220'], ['>16']));
M(220, 't0', IF('k:WARNUNG', ['x:In diesen Tagen haben dich Boten gesucht, um dich zu fragen, aber du warst nicht da, und niemand wusste, was du wusstest.']), 't2-4', '>16');
M(16, 't0-9', 'k:WINTER', 'o1', 'all=max', 'k-:KNAPP', 'k-:WUNDE', '>231');
M(231, 't0-2', IF('!k:GRABSTEIN', ['c3', '>117'], ['>123']));
M(117, 't0-2', TR('Totenangst', ['>>117.1'],
  [C('Wirkst du Eiseskälte Kämpferherz, um zu bleiben?', Z('Eiseskälte Kämpferherz', ['>>117.1'], ['x:Du fliehst den Hügel hinunter.', '>123'])), C('Fliehst du den Hügel hinunter?', '>>123')]));
M('117.1', 'k:GRABSTEIN', 't6', IF('k:GEISTERWORT', ['>13'], ['x:Du stehst im Schnee, bis die Gestalt verblasst.', '>123']));
M(234, 't0-8', IF('comp', ['>168'], ['>268']));
M(168, 't0-6', 'k:HEIMGEBRACHT', 'n:Den Speer aus Niellyn erhältst du erst nach der Queste.', 'f:speerNachQueste', 'comp-', '>268');
M(268, 't0-5',
  CI('i:Goldener Armreif', 'Gibst du deiner Mutter oder deiner Schwester den goldenen Armreif?', 'ctx:armreif', '>>82'),
  CI('i:Hakons Silberreif', 'Gibst du deiner Mutter oder deiner Schwester Hakons Silberreif?', 'ctx:silberreif', '>>82'),
  C('Behältst du, was du hast?', '>>5'));
M(82, 't0-1',
  C('Gibst du ihn deiner Mutter?', 'x:Murraya dreht den Reif zwischen ihren rauen Fingern, dann schiebt sie ihn über ihr Handgelenk, und du siehst, dass sie lächelt.'),
  C('Gibst du ihn Dunyabra?', 'x:Dunyabra, die noch wach auf ihrem Lager liegt, quietscht so laut, dass die Nachbarn lachen, und schläft mit dem Reif am Handgelenk ein.'),
  't4-7', IF('ctx:silberreif', ['i-:Hakons Silberreif'], ['i-:Goldener Armreif']), 'k:MUTTERS SEGEN', '>5');
M(5, 't0-5', IF('k:VERSÖHNT', ['>134'], [IF('k:WARNUNG', ['>156'], ['>235'])]));
M(134, 't0-3', 'o1', IF('k:WARNUNG', ['>156'], ['>235']));
M(235, IF('k:KHURGASH-TOT', ['c0', 't1-3']), IF('k:KHURGASH-VERSCHONT', ['c4', 't5-7']),
  IF('!k:KHURGASH-TOT&!k:KHURGASH-VERSCHONT&k:KHURGASH', ['x:Du erzählst ihr, was du über Khurgash weißt.', 't8-10']), '>111');
M(111, 't0-7', IF('b>=3', ['>144'], ['>214']));
M(214, 't0', IF('k:KNAPP', ['x:Er schüttelt den Kopf.', 't2']), IF('k:FRÜH', ['>118'], ['>68']));
M(118, 't0-3', 'all=max', 't5-7', '>88');
M(68, 't0-3', TR('Totenangst', ['>40'],
  [C('Wirkst du Eiseskälte Kämpferherz, um zu bleiben?', Z('Eiseskälte Kämpferherz', ['>40'], ['x:Du fliehst den Hügel hinunter.', '>179'])), C('Fliehst du den Hügel hinunter?', '>>179')]));
M(40, 't0-5', 'k:GRABSTEIN', IF('k:GEISTERWORT', ['c7', 't8', '>169'], ['x:Du stehst lange da, bis der Morgen graut und die Gestalt verblasst.', 't11', '>179']));
M(179, 't0-3', TR('Aberglaube', [], ['x:Du siehst überall Zeichen und schläfst schlecht.', 'au-1W6']),
  IF('k:KHURGASH-TOT', ['>241']), IF('k:KHURGASH-VERSCHONT', ['>241']),
  IF('f:tag50', ['x:Du kommst zu spät für die Nacht davor: Die Orks haben die Hochweide überfallen, dreißig Schafe geraubt und vier Hirten erschlagen, darunter den alten Fearghas.', 't8', '>123']), '>246');
M(241, 't0', IF('k:KHURGASH-TOT',
  ['x:Die Hirten erzählen sich am Feuer, dass sein Stamm sich zerstritten hat und nach Süden gezogen ist.'],
  ['x:Eines Morgens steht ein Speer mit einem Fetzen schwarzen Fells im Gras vor dem Pferch, die Spitze in den Boden gerammt, nach Süden gekehrt.']),
  't3-6', IF('k:DUNDOCHS SPIESS', ['x:Der Spieß deines Vaters hängt in diesen Tagen an Megrims Wand.', 't8']), 't9', 'le=max', 'au=max', '>123');
M(246, 't0-5', IF('k:VORBEREITET', ['>69'], ['>108']));

// ---------------- Die Nacht auf der Hochweide
M(259, 't0-4', 'dmin48', 'k:KNAPP', 'le=max', 'au=max', '!lyrgach_waeldchen', 't7-10', '>63');
M(125, 't0-3', F({ foes: [KRIEGER, KRIEGER], fleeSP: 15, weaponIfNone: { name: 'Speer', tal: 'Speere', tp: '1W+5' }, title: 'Zwei Orks im Pferch' }, ['>17'], ['>237']));
M(122, 't0-2', F({ foes: [KRIEGER, KRIEGER], seq: true, fleeSP: 15, weaponIfNone: { name: 'Dunyabras Hirtenstab', tal: 'Hiebwaffen', tp: '1W+2' }, title: 'Zwei Orks, nacheinander' },
  ['x:Dunyabra fällt dir um den Hals, weinend und lachend zugleich.', 't8-9', 'o1', 't10', '>265'], ['>237']));
M(186, 't0-2', IF('k:DUNDOCHS SPIESS',
  ['x:Du hältst den Spieß deines Vaters selbst in der Hand.', 'w:Dundochs Spieß'],
  [C('Ziehst du den Spieß deines Vaters aus der Erde?', 'i+:Dundochs Spieß', 'w:Dundochs Spieß'), CI('armed', 'Kämpfst du mit deiner eigenen Waffe?'), CI('!armed', 'Fängst du Megrims Speer auf?')]),
  't4-7', 'n:Einmal im Kampf schlägt Khurgash einen Wuchtschlag: um 4 erschwert, aber 4 TP mehr. Nach der dritten Kampfrunde geht es weiter, auch wenn noch niemand gefallen ist.',
  F({ foes: [KHURGASH], rounds: 3, stopLe: 10, persist: 'kh2', companion: false, weaponIfNone: { name: 'Megrims Speer', tal: 'Speere', tp: '1W+5' }, title: 'Zweikampf gegen Khurgash' }, ['>139'], ['>237'], ['>139']));
M(139, 't0-5', TR('Jähzorn', ['c7'], ['x:Du stürmst blind vor Wut auf ihn los: Für den Rest des Kampfes ist deine Attacke um 2 erleichtert, aber deine Parade um 4 erschwert.', 'f:raserei', 'b1'], ['x:Du beherrschst dich.'], { sbModIf: [['k:RUADHS RAT', -2]] }),
  IF('foe:kh2<=10', ['>10']),
  F({ foes: [KHURGASH], stopLe: 10, persist: 'kh2', companion: false, weaponIfNone: { name: 'Megrims Speer', tal: 'Speere', tp: '1W+5' }, title: 'Zweikampf gegen Khurgash' }, ['>10'], ['>237']));
M(10, 't0-6',
  C('t7', 'k:KHURGASH-TOT', 't8', C('t9', 'b1'), C('Lässt du es dabei bewenden?')),
  C('t10', P('Selbstbeherrschung', 6, ['x:Du senkst die Waffe.', 't12-13', 'o2', 'k:KHURGASH-VERSCHONT'], ['x:Du stößt zu, bevor du es entscheiden kannst.', 'k:KHURGASH-TOT'])),
  '>31');
M(31, 't0-2', IF('!i:Dundochs Spieß', ['i+:Dundochs Spieß']), 'k:DUNDOCHS SPIESS', '>170');
M(237, 't0-6', 'le=12', 'k:WUNDE', '>170');
M(170, 't0-1', IF('k:VORBEREITET', ['x:Es sind nur zwei, denn Megrims Hinterhalt hat die Orks überrascht.'], ['x:Es sind fünf, und der alte Fearghas ist einer davon.']),
  IF('k:DUNYABRAS NARBE', ['c4', 't5-7']), 't10', 'le+2W6', IF('le<15', ['k:WUNDE']), 't13-15', '>123');

// ---------------- Sonnenwende und Queste
M(123, 't0-6', 'n:Die 200 Abenteuerpunkte, die du für die Queste zurückgelegt hast, sind ausgegeben, gleich wie die Queste ausgeht.', 't9', '>44');
M(44, 't0-3', C('t4', P('KO', 2, ['c5', 'o1'], ['x:Du taumelst hinaus in die kalte Abendluft.', 'au-2W6'])), C('Gehst du hinaus, wenn es dir zu viel wird?', 'x:Es ist nichts verloren.'), 't9', '>33');
M(252, 't0-3', 'f:queste', 'qpool',
  'n:Regeln der Queste: keine Zauber, keine Astralpunkte, auch nicht für den Hauch des Odûn. Einmal in der ganzen Queste darfst du eine misslungene Probe wiederholen. Für je zwei Zeichen des Odûn darfst du eine Probe um 1 erleichtern, insgesamt höchstens um 3; das entscheidest du jeweils vor dem Wurf.',
  IF('k:WINTER', ['n:WINTER: Alle Proben der Queste sind um 1 erschwert.']), IF('k:WUNDE', ['n:WUNDE: Proben auf Körperbeherrschung und Raufen sind um 2 erschwert.']),
  't10', IF('k:KNAPP', ['n:KNAPP: Die Probe ist um weitere 2 erschwert, weil du nicht gefastet hast.']), IF('k:MUTTERS SEGEN', ['c13']),
  Q_RITUAL(['>176'], ['>191']));
M(191, 't0-2', RETRY(Q_RITUAL(['>176'], ['>46'])));
M(61, 't0-3', IF('k:AHNENGRAB', ['>12'], [IF('k:BEGRABEN', ['>12'], ['x:Du gehst schweigend zwischen den Hügeln hindurch, und niemand spricht zu dir.', '>227'])]));
M(12, 't0-4', 'next:Sinnenschärfe:-1', 'n:Die nächste Probe auf Sinnenschärfe ist um 1 erleichtert, und du weißt, welcher Geruch der richtige ist, wenn du dich nur traust, ihm zu folgen.', '>227');
M(162, 't0-3', TR('Jähzorn', ['>35'], ['c5', 'b1', '>35']));
M(226, 't0-3', TR('Meeresangst', ['>287'], ['c5', 'au-2W6', 'next:Sinnenschärfe:2', 'n:Die nächste Probe auf Sinnenschärfe ist um 2 erschwert.', '>98']));
M(35, 't0-4', 'next:Sinnenschärfe:3', 'n:Die nächste Probe auf Sinnenschärfe ist um 3 erschwert.', '>98');
M(287, 't0-8', 'next:Sinnenschärfe:1', 'n:Die nächste Probe auf Sinnenschärfe ist um 1 erschwert.', '>98');
M(43, 't0-6', 'next:Sinnenschärfe:3', 'n:Die nächste Probe auf Sinnenschärfe ist um 3 erschwert.', '>98');
M(154, 't0-7', 'next:Sinnenschärfe:1', 'n:Die nächste Probe auf Sinnenschärfe ist um 1 erschwert.', '>98');
M(98, 't0-4', IF('k:HEXENRAT', ['c6']), Q_NASE(['>190'], ['>204']));
M(204, 't0-1', RETRY(Q_NASE(['>190'], ['>46'])));
M(199, 't0-4', TR('Meeresangst', [], ['x:Dir zittern die Knie bei dem Donnern da unten.', 'next:Körperbeherrschung:2', 'n:Die nächste Probe auf Körperbeherrschung ist um 2 erschwert.']), 't7', '>83');
M(116, 't0-5', IF('!k:GEISTERWORT', ['k:GEISTERWORT']), 't7', 'next:Körperbeherrschung:2', 'n:Die nächste Probe auf Körperbeherrschung ist um 2 erschwert.', '>247');
M(247, Q_KB(['>119'], ['>200']));
M(200, 't0-1', RETRY(Q_KB(['>119'], ['>46']), 'Ein Windstoß trägt dich zurück an den Anfang des Stammes, und du darfst die Probe wiederholen.'));
M(7, 't0-2', IF('k:KHURGASH-VERSCHONT', ['x:Khurgash lacht noch lauter.', 't4']), 't5', C('t6', '>>148'), C('t7', '>>153'));
M(148, 't0-2', 'b1', 't4', IF('!f:retry',
  ['x:Alles zerstiebt wie Funken im Wind, und du stehst wieder am Rand der Lichtung, und Khurgash grinst dich an, als wäre nichts geschehen. Die Probe ist jetzt um 2 erschwert, und deine Wiederholung ist verbraucht.', 'f:retry', 'ctx:sb2', '>153'],
  ['>46']));
M(153, 't0-2', IF('k:RUADHS RAT', ['x:Du hörst die Stimme des alten Trinkers aus Lowangen: Schlag nicht zu, Junge, was auch immer kommt. Die Probe ist um 2 erleichtert.']), Q_SB(['>81'], ['>80']));
M(80, 't0-2', RETRY(Q_SB(['>81'], ['>46'])));
M(54, 't0-8',
  C('„Lass los, Vater. Ich trage ihn nicht mehr. Und du musst es auch nicht.“', '>>24'),
  C('„Ich halte ihn für dich fest. Ich bringe es zu Ende, dann ist es vorbei.“', '>>238'),
  C('Du sagst nichts, sondern nimmst seine Fäuste in deine Hände.', 't11', '>24'));
M(210, IF('k:WINTER', ['x:Hinter dem Wald liegt ein kahler Hügel im Mondlicht, und Schnee liegt darauf, der unter dem Mond glitzert.'], ['x:Hinter dem Wald liegt ein kahler Hügel im Mondlicht.']),
  't1-8', IF('k:SAUJAGD', ['c9', 't10']), '>105');
M(105, 't0-3', C('Stellst du dich ihm frontal entgegen und packst ihn an den Hauern?', 'k:STIRN', 'n:Die Probe ist dann um 2 erschwert.', '>>250'), C('t6', '>>250'));
M(250, IF('k:SAUJAGD', ['n:SAUJAGD: Die Probe ist um 2 erleichtert.']), Q_RAUF(['>192'], ['>203']));
M(203, 't0-1', RETRY(Q_RAUF(['>192'], ['>46']), 'Du rappelst dich auf, und der Keiler wendet sich wieder dir zu und scharrt mit dem Huf.'));
M(291, 't0-8', 'f:questOk', 'k:QUESTE BESTANDEN',
  'n:Du hast die Gabe Haut des Odûn erhalten: Fell (RS 2), Hauer (1W6+2 TP) und die Nase eines Keilers, für 4 AsP je Verwandlung (WdZ S. 168–169).', 't10-12', '>228');
M(46, 't0-11', 'f-:queste', IF('k:DUNDOCHS FRIEDEN', ['x:Die Haut hast du nicht erlangt, aber das, was du deinem Vater versprochen hast, kannst du trotzdem tun.', '>158'], ['>195']));
M(228, 't0-2', IF('k:WINTER',
  ['x:Unter dir im Tal steigt Rauch aus den Dächern von Lyrgach, und im Osten geht die Sonne auf, über dem kürzesten Tag des Jahres, rot über dem Schnee.'],
  ['x:Unter dir im Tal steigt Rauch aus den Dächern von Lyrgach, und im Osten geht die Sonne auf, über dem längsten Tag des Jahres.']), 't4-7', 'f-:queste', '>6');
M(6, 't0-1', IF('k:DUNYABRAS NARBE', ['c2', 't3']), 't4-5', IF('k:DUNDOCHS SPIESS', ['c6', 't7-8']), IF('k:DUNDOCHS FRIEDEN', ['>158'], ['>50']));
M(158, 't0-8', TR('Meeresangst', [], ['c10']), 't11-12', '>145');
M(271, 't0', IF('k:DUNDOCHS SPIESS', ['x:Du hältst den Spieß deines Vaters in der Hand.', 't2', C('t3', '>>41'), C('t4', '>>300')], ['>300']));
M(41, 't0-2', 'i-:Dundochs Spieß', 'k-:DUNDOCHS SPIESS', 'f:meer', '>300');
M(300, 't0-1', IF('k:HEIMGEBRACHT&f:speerNachQueste', ['x:Den Speer aus Niellyn bekommst du jetzt.', 'i+:Speer']), 'end');
