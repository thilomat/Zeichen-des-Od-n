'use strict';
// ---------------------------------------------------------------- Abschnitte von Hand: Weiden und Nebelmoor
// Kurzschrift: 'tA-B' Text, 'cN' bereinigtes Ergebnis, '>N' Weiter, '>>N' sofort, '@ort' erst hinlaufen,
// dN Tage, oN Zeichen, bN Blutdurst, k:WORT, s+N Silber, i+:Ding, le/au/ae-+=, ctx:merker
function PLACE(id, name, kind, x, y, extra) { POI[id] = Object.assign({ id, name, kind, map: 'world', x, y, r: 1.5 }, extra || {}); }
const FOE = (name, ini, at, pa, le, rs, tp, img) => [name, ini, at, pa, le, rs, tp, img || ''].join('|');

// zusaetzliche Orte
PLACE('knueppeldamm', 'Knüppeldamm', 'moor', 400, 229);
PLACE('erleninsel', 'Erleninsel', 'moor', 380, 216);
PLACE('orklager', 'Lagerfeuer der Viehdiebe', 'camp', 349, 238);

// ---------------- Weiden
Object.assign(LOC, {
  37: 'tannhag', 52: 'tannhag_waldrand', 75: 'tannhag_alrike', 298: 'tannhag_gasthaus',
  121: 'bodo', 256: 'tannengrund', 197: 'wolfsfels', 99: 'haselgrund', 151: 'baerbach', 229: 'kraehenholz', 223: 'furt',
  178: 'baliho', 120: 'baliho_gold', 290: 'baliho_markt', 257: 'baliho_vieh', 136: 'baliho_travia', 32: 'baliho_ring', 15: 'wegweiser',
  180: 'flussufer', 266: 'moorrand', 27: 'grenzturm', 208: 'grenzturm', 273: 'knueppeldamm', 281: 'boronschrein', 293: 'erleninsel',
  261: 'moorhuegel', 66: 'gashok', 19: 'orklager',
});

M(1, 't0-18', 'n:Tag 0. Am 50. Tag ist Sonnenwende, dann musst du in Lyrgach sein.', 't20-21', C('t22', '>>37'), C('t23', '>>84'));
M(84, 't0-3', P('Orientierung', -3, ['d2', '>121'], ['>282'], { note: 'Waldkundig −3' }));
M(298, 't0-6', TR('Jähzorn', ['c8', '>146'], ['c9', '>138'], ['c9', 'o1', '>146']));
M(121, 't0-8', C('t9', 'd1', '>>256'), C('t10', '>>197'));
M(138, 't0-4', F({ foes: [FOE('Ulf', 9, 10, 7, 28, 0, '1W+1', 'man'), FOE('Gerbold', 8, 11, 6, 32, 0, '1W+2', 'farmer')], brawl: true, weaponBlut: true, title: 'Rauferei mit Ulf und Gerbold' }, ['>184'], ['>20']));
M(197, 't0-3', 'd1', 't5', P('Wildnisleben', -3, ['c7', 't8', '>99'], ['c10', 't11', '>95'], { note: 'Waldkundig −3' }));
M(256, 't0-5', TR('Aberglaube', ['c7', '>89'], ['c8', P('MU', 0, ['>89'], ['c10', '>197'])], ['>89']));
M(151, 't0-1',
  C('t2', P('Tierkunde', -3, ['c3', '>121'], ['c4', '>221'], { note: 'Waldkundig −3' })),
  C('Wirkst du Eins mit der Natur?', Z('Eins mit der Natur', ['x:Der Bär beruhigt sich und trottet davon.', '>121'], ['>221'])),
  C('t7', '>>221'));
M(223, 't0-6',
  C('t7', '>>79'),
  C('t8', P('MU', 2, ['>288'], ['>79'])),
  C('Wirkst du Horriphobus?', Z('Horriphobus', ['>288'], ['>79'])),
  CI('i:Goldener Armreif', 't11', 'i-:Goldener Armreif', '>178'));
M(161, 't0-2', P('Fährtensuchen', -5, ['ctx:hunde2', '>124'], ['ctx:hunde3', 'x:Du findest die Spur erst spät. Jetzt musst du dich gegen drei Hunde stellen.', '>124'], { note: 'Waldkundig −3, Nase −2' }));
M(244, 't0-5', P('CH', 2, ['>112'], ['>243']));
M(20, 't0-3', 'au+2W6', 't5-6', '>52');
M(184, 't0-4', C('t5', '>>127'), C('t6', 'b1', '>>127'));
M(157, 't0-3', 'd4', 't5', P('KK', 2, ['c7', 't8', 's+2'], ['c9', 'au-1W6']), 't10', 'k:GISBERT', '>178');
M(95, 't0', 'n:Fällt der Leitwolf, fliehen die anderen.', F({ foes: [FOE('Leitwolf', 12, 12, 6, 25, 1, '1W+4', 'wolf'), FOE('Wolf', 11, 10, 5, 18, 1, '1W+3', 'wolf'), FOE('Wolf', 11, 10, 5, 18, 1, '1W+3', 'wolf')], leader: 0, title: 'Wölfe an der Felswand' }, ['>99'], ['ctx:wald', '>115']));
M(221, 't0', F({ foes: [FOE('Braunbär', 8, 12, 5, 55, 3, '1W+6', 'bear')], giveupSP: 15, title: 'Braunbär' }, ['x:Der Bär gibt auf und trollt sich ins Unterholz.', '>121'], ['ctx:wald', '>115']));
M(79, 't0-1', 'n:Wer 12 oder mehr SP erlitten hat, wirft die Waffe weg und flieht, nur der Anführer kämpft weiter.',
  F({ foes: [FOE('Anführer', 10, 12, 9, 26, 2, '1W+2', 'deserter'), FOE('Knüppelmann', 8, 10, 7, 24, 1, '1W+1', 'man'), FOE('Speerträger', 8, 10, 6, 22, 1, '1W+5', 'man')], fleeSP: 12, fleeExcept: 0, title: 'Wegelagerer an der Furt' }, ['>77'], ['ctx:weg', '>115']));
M(288, 't0-3', C('Nimmst du den Speer mit?', 'i+:Speer', '>>178'), C('Lässt du ihn liegen?', '>>178'));
M(124, 't0-4', 't6', 't8',
  C('Kämpfst du gegen die Hunde?',
    IF('ctx:hunde3',
      [F({ foes: [FOE('Saupacker', 10, 10, 4, 18, 1, '1W+3', 'dog'), FOE('Saupacker', 10, 10, 4, 18, 1, '1W+3', 'dog'), FOE('Saupacker', 10, 10, 4, 18, 1, '1W+3', 'dog')], fleeSP: 10, title: 'Drei Saupacker' }, ['>194'], ['ctx:kraehenholz', '>115'])],
      [F({ foes: [FOE('Saupacker', 10, 10, 4, 18, 1, '1W+3', 'dog'), FOE('Saupacker', 10, 10, 4, 18, 1, '1W+3', 'dog')], fleeSP: 10, title: 'Zwei Saupacker' }, ['>194'], ['ctx:kraehenholz', '>115'])])),
  C('Wirkst du stattdessen Horriphobus?', Z('Horriphobus', ['x:Alle Hunde fliehen sofort.', '>194'],
    [IF('ctx:hunde3',
      [F({ foes: [FOE('Saupacker', 10, 10, 4, 18, 1, '1W+3', 'dog'), FOE('Saupacker', 10, 10, 4, 18, 1, '1W+3', 'dog'), FOE('Saupacker', 10, 10, 4, 18, 1, '1W+3', 'dog')], fleeSP: 10, title: 'Drei Saupacker' }, ['>194'], ['ctx:kraehenholz', '>115'])],
      [F({ foes: [FOE('Saupacker', 10, 10, 4, 18, 1, '1W+3', 'dog'), FOE('Saupacker', 10, 10, 4, 18, 1, '1W+3', 'dog')], fleeSP: 10, title: 'Zwei Saupacker' }, ['>194'], ['ctx:kraehenholz', '>115'])])])));
M(112, 't0-6', F({ foes: [FOE('Brun', 9, 11, 9, 36, 0, '1W+2', 'farmer')], wrestle: true, title: 'Ringkampf gegen Brun' }, ['>53'], ['>270']));
M(127, 't0-3', 'x:Du breitest draußen am Waldrand deine Decke aus und kommst wieder zu Atem.', 'au+half', '>52');
M(115, 't0-4', 'd2', 'le=12', 'au=max', IF('ctx:weg', ['t7', 'i-:Goldener Armreif', 's=0']), 't8',
  IF('ctx:wald', ['>99'], [IF('ctx:moor', ['>261'], [IF('ctx:moorstrasse', ['>71'], ['>178'])])]));
M(180, 't0-1',
  C('t2', P('Schwimmen', 2, ['c3', '>266'], ['c4', 'le-1W6', 'i-:Verbeulter Messingtopf', 'x:Der verbeulte Messingtopf treibt davon.', '>266'])),
  C('t7', 'd1', '>>180.1'));
M('180.1', '@furt_nord', '>>266');
M(92, 't0-2',
  C('t3', 'k:HEXENRAT', 'k:HAARLOCKE', 't4', '>99'),
  CI('i:Goldener Armreif', 't6', 'i-:Goldener Armreif', 'k:HEXENRAT', 't7', '>99'),
  C('t9', '>>277'));
M(77, 't0-2', C('t3', 'o1'), C('t4', 'b1'), 't5', C('Nimmst du den Speer mit?', 'i+:Speer', '>>178'), C('Lässt du ihn liegen?', '>>178'));
M(32, 't0-3', C('t4', '>>248'), C('t5', '>>178'));
M(120, 't0-2', IF('k:GISBERT', ['c3', 't4-5']),
  CI('i:Goldener Armreif', 'Verkaufst du den Armreif?', 'i-:Goldener Armreif', IF('k:GISBERT', ['s+25'], ['s+20']), '>178'),
  C('t7', '>>178'));
M(136, 't0-2', C('t3', 'd1', 'all=max', 't5-6', '>178'), C('Gehst du gleich wieder?', 't5-6', '>178'));
M(257, 't0-4', C('t5', 'k:VIEHTRIEB', '>>260'), C('t6', '>>178'));
M(290, 't0', 't6-7', SHOP([['Jagdspieß', 8], ['Speer', 5], ['Wurfspeer', 3], ['Fellweste', 4], ['Wegzehrung', 1]]), '>178');
M(194, 't0-7', 'o1', 'k:SAUJAGD', 'k:RITTERFEIND', '>84');
M(53, 't0-7', 'o1', 'k:SAUJAGD', 'au=max', C('t10', '>>147'), C('t11', '>>84'));
M(187, 't0-3', C('t4', 'ctx:proviant', '>>131'), C('t5', 'ctx:hasen', '>>131'), C('t6', '>>180'));
M(131, IF('ctx:proviant', ['t0-1']),
  IF('ctx:hasen', [P('Fallen stellen', -3, ['x:Am Abend hängt ein fetter Hase in der Schlinge, und am nächsten Morgen noch einer.'], ['x:Ihr braucht länger, bis die erste Schlinge Beute bringt.', 'd1'], { note: 'Waldkundig −3' })]),
  't5-8', 'o1', '>180');
M(266, 't0-3', 'd1', C('t5', '>>269'), C('t6', 'd1', '>>27'));
M(277, 't0-1', '@wolfsquelle', 't2-4',
  C('t5', P('Selbstbeherrschung', 2, ['c6', 't7', 'i+:Wolfskrautsalbe', 'o1', 'k:HEXENRAT'], ['c10', 't11-12', 'k:HEXENRAT'])),
  C('Scheuchst du die Wölfin mit Gebrüll fort?', 'c10', 't11-12', 'k:HEXENRAT'),
  'd1', '>99');
M(27, 't0-1', 'd1', 't3-4', IF('k:RITTERFEIND', ['>87'], ['>85']));
M(269, 't0-3', 'd1', 'f:nebelmoor', P('Orientierung', -3, ['>273'], ['>245'], { note: 'Sumpfkundig −3' }));
M(248, 'f:ring', 't0-3', F({ foes: [FOE('Gerwulf der Bär', 9, 12, 10, 40, 0, '1W+3', 'man')], wrestle: true, title: 'Bärenringen von Baliho' }, ['>142'], ['x:Du rappelst dich unter dem Gelächter der Menge auf.', 'au+half', '>178']));
M(66, 't0-5', CI('k:VIEHTRIEB', 'Gehst du mit Mertels Herde ohne Fragen durchs Tor?', '>>62'), C('t7', '>>175'), C('t8', '>>130'));
M(87, 't0-2', C('t3', '>>269'), C('t4', P('CH', 4, ['x:Der Ältere lacht.', 't6', '>85'], ['x:Du verbringst eine Nacht im Turm, bis der Hauptmann dich am Morgen mit einem Achselzucken freilässt.', 'd1', '>85'])));
M(245, 't0-2', IF('k:HAARLOCKE', ['c3']), C('t4', '>>76'),
  C('t5', P('Selbstbeherrschung', 2, ['c6', '>273'], ['c7', '>76'], { modIf: [['k:HAARLOCKE', 2]] })));
M(142, 't0-2', 's+10', 'f:ringWon', 't4-7', 'au=max', C('t8', 'o1', '>178'), C('Lässt du sie stehen?', '>>178'));
M(208, 't0-3', F({ foes: [FOE('Ork-Viehdieb', 10, 11, 8, 26, 1, '1W+3', 'orcSpear'), FOE('Ork-Viehdieb', 10, 11, 8, 26, 1, '1W+3', 'orcSpear')], fleeSP: 12, title: 'Ork-Viehdiebe' },
  ['x:Du hast die Herde und die Treiber verteidigt.', 'o1', C('t7', 'b1', 'd1', '>109'), C('Lässt du die Fliehenden laufen?', '>>109')],
  ['x:Mertels Knechte retten dich mit Fackeln und Dreschflegeln.', 'le+5', '>109']));
M(175, 't0-3', TR('Vorurteile gegen Orks', ['c5', '>276'], ['c6', '>155'], ['c6', 'o1', '>276']));
M(224, 't0-1', P('Fährtensuchen', -2, ['c3', '>19'], ['c4', 'd1', 'ctx:wach', '>19'], { note: 'Nase −2' }));
M(76, 't0-1', P('Körperbeherrschung', -3, ['c3', 'au-1W6', '>261'], ['c6', 'x:Als du endlich draußen bist, ist die alte Decke im Moor geblieben.', 'le-1W6', 'i-:Alte Decke', 't9', '>90'], { note: 'Sumpfkundig −3' }));
M(281, 't0-3', TR('Totenangst',
  ['c7', C('Legst du etwas auf den Steintisch?', GIVE(['Holzbecher', 'Verbeulter Messingtopf', 'Ogerreißzahn an Lederschnur', 'Goldener Armreif', 'Alte Decke', 'Wasserschlauch']), 't9', 'k:GEISTERWORT', 'o1', '>293'),
    C('Gehst du, ohne etwas dazulassen?', 'x:Du hörst nichts als das Tropfen des Wassers.', '>293')],
  ['x:Das Grauen packt dich: Du stolperst hinaus und läufst blind in den Nebel.', 'au-1W6', '>293']));
M(293, 't0-7', 'd1', TR('Totenangst',
  ['>>293.1'],
  [C('Wirkst du Eiseskälte Kämpferherz, um trotzdem zu bleiben?', Z('Eiseskälte Kämpferherz', ['>>293.2'], ['c10', '>76'])), C('Fliehst du?', 'c10', '>76')]));
M('293.1', F({ foes: [{ name: 'Moorleiche', ini: 6, at: 9, pa: 3, le: 30, rs: 3, tp: '1W+3', img: 'corpse', undead: true }], title: 'Moorleiche' }, ['>261'], ['ctx:moor', '>115']));
M('293.2', F({ foes: [{ name: 'Moorleiche', ini: 6, at: 9, pa: 3, le: 30, rs: 3, tp: '1W+3', img: 'corpse', undead: true }], eis: true, title: 'Moorleiche' }, ['>261'], ['ctx:moor', '>115']));
M(109, 't0-1', P('Körperbeherrschung', 0, ['c3'], ['x:Du wirst umgerissen und getrampelt.', 'le-2W6']), 'd3', '>280');
M(171, 't0-2', CI('i:Goldener Armreif', 'Verkaufst du den Armreif?', 'i-:Goldener Armreif', 's+12', '>62'), C('Behältst du ihn?', '>>62'));
M(219, 't0-10', 'k:KHURGASH', 't12-14',
  CI('s>=20', 't15', 's-20', '>>152'), C('t16', '>>295'), C('t17', '>>149'), C('t18', '>>130'));
M(72, 't0', IF('comp', ['n:Caithra übernimmt einen der beiden.']),
  F({ foes: [FOE('Ork-Tributeintreiber', 10, 11, 8, 26, 2, '1W+3', 'orcClub'), FOE('Ork-Tributeintreiber', 10, 11, 8, 26, 2, '1W+3', 'orcClub')], fleeSP: 15, title: 'Ork-Tributeintreiber' }, ['>173'], ['>102']));
M(206, 't0-1', IF('comp', ['c2']), '>25');
M(155, 't0-2', 'x:Die Orks prügeln dich zu Boden.', 'le-1W6', 'au-half', 't4-8', '>30');
M(276, 't0', CI('s>=2', 't1', 's-2', '>>62'), C('t2', 'd1', 't3', '>62'), C('t5', '>>130'));
