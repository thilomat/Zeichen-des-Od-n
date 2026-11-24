'use strict';
// ---------------------------------------------------------------- Abschnitte von Hand: Svellttal, Lowangen, Tiefhusen
const CAITHRA_NOTE = 'n:Caithra kämpft an deiner Seite. Sinken ihre LeP auf 0, stirbt sie nicht, sondern ist schwer verletzt und kämpft nicht mehr, bis der Text sagt, dass sie geheilt ist.';
const ORK_PL = FOE('Ork-Plünderer', 10, 12, 8, 28, 2, '1W+4', 'orc');
const BLUTZAHN = FOE('Blutzahn', 10, 12, 9, 40, 1, '1W+3', 'orc');

PLACE('finstersvellt', 'Am Finsteren Svellt', 'bank', 292, 241);
PLACE('hilvalla', 'Brücke von Hilvalla', 'bridge', 247, 180);

Object.assign(LOC, {
  130: 'finstersvellt', 25: 'neulowangen', 67: 'neulowangen', 59: 'lowangen', 11: 'svellmia', 185: 'tiefhusen', 294: 'tjolmar', 34: 'hilvalla',
});

// Hubs: Baliho (begehbar), Lowangen, Tiefhusen
M(178, 't0-3', 'n:Du kannst diese Orte in beliebiger Reihenfolge besuchen und kehrst danach hierher zurück. Tippe einen an oder lauf selbst hin.',
  CS('baliho_gold', 'Zum Goldschmied am Rindermarkt', '>>120'),
  CS('baliho_markt', 'Über den Markt, Waffen und Ausrüstung ansehen', '>>290'),
  CS('baliho_vieh', 'Zu den Viehhändlern aus dem Svellttal', '>>257'),
  CS('baliho_travia', 'In das Haus der Travia', '>>136'),
  Object.assign(CS('baliho_ring', 'Zum Bärenringen auf dem Rindermarkt', '>>32'), { cond: '!f:ring' }),
  CS('baliho_west', 'Baliho nach Westen verlassen', '>>15'));
M(59, 't0-4', IF('!f:lowangen', ['d1', 'f:lowangen']), 't6', 'n:Du kannst diese Orte besuchen und kehrst danach hierher zurück.',
  C('Den großen Markt', '>>4'), CI('!f:magistra', 'Die Magierakademie mit dem schiefen Turm', '>>283'),
  CI('!f:bache', 'Den Hof hinter der Akademie, aus dem es nach Keiler riecht', '>>28'), C('Die Hafenschenke „Zum Fährmann“', '>>2'),
  C('Die Anlegestelle, wo die Kähne flussabwärts ablegen', '>>67'), C('Lowangen verlassen und zu Fuß am Svellt nach Norden ziehen', '>>292'));
M(185, 't0-2', 'n:Du kannst diese Orte besuchen und kehrst danach hierher zurück.',
  C('Die Schenke an der Brücke', '>>22'), C('Den Markt', '>>159'), C('Dich nach den Wegen in den Norden erkundigen', '>>49'),
  C('Am Hafen nach einem Floß Richtung Tjolmar fragen', '>>21'), C('Tiefhusen nach Westen verlassen, über die Hilval ins Orkland', '>>34'),
  C('Tiefhusen nach Norden verlassen, Richtung Tjolmar', '>>29'));

M(19, 't0-5',
  CI('!ctx:wach', 't6', P('Schleichen', 0, ['c7', 'ctx:zwei', '>58'], ['x:Alle drei sind wach.', 'ctx:drei', '>58'])),
  C('Wirkst du Horriphobus?', Z('Horriphobus', ['x:Die Orks fahren hoch, sehen dich im Feuerschein riesig und grauenhaft und fliehen in die Nacht.', '>258'], ['ctx:drei', '>58'])),
  C('t11', 'ctx:drei', '>>58'));
M(58, 'n:Ein Ork, der 15 oder mehr SP erlitten hat, flieht, es sei denn, er ist der letzte.',
  IF('ctx:zwei',
    [F({ foes: [ORK_PL, ORK_PL], fleeSP: 15, fleeNotLast: true, title: 'Ork-Plünderer' }, ['>>58.1'], ['ctx:moorstrasse', '>115'])],
    [F({ foes: [ORK_PL, ORK_PL, ORK_PL], fleeSP: 15, fleeNotLast: true, title: 'Ork-Plünderer' }, ['>>58.1'], ['ctx:moorstrasse', '>115'])]));
M('58.1', 'x:Einer der Orks kriecht mit zerschmettertem Bein durch das Gras.', 't4-5',
  C('t6', 'b1', '>258'),
  C('t7', P('Selbstbeherrschung', 3, ['x:Du lässt die Hand sinken.', 'o1', '>258'], ['x:Deine Hand schlägt zu, bevor du es entscheiden kannst.', 'b1', '>258'])));
M(258, 't0-2', 'd1', 't4-5', 'i+:Jagdspieß', 'o1', 'le+1W6', 'au=max', '>71');
M(90, 't0-1', P('KO', 0, ['c3'], ['x:Das Fieber hält dich fest. Du brauchst einen zusätzlichen Tag, bis du wieder sicher auf den Beinen bist.', 'le-1W6', 'd1']), '>261');
M(280, 't0-1', 's+6', 't4-5', 'd2', '>66');
M(149, 't0-4', C('t5', '>>165'), C('Willst du Caithra heute Nacht heimlich befreien?', '>>295'), C('Verlässt du die Stadt?', '>>130'));
M(152, 't0-4', 'k:CAITHRA', 'comp:Caithra', 't6-7', CAITHRA_NOTE, 't11', '>130');
M(295, 't0-2', P('Schleichen', 2, ['>196'], ['c5', 'x:Im Nu sind fünf Orks mit Fackeln da.', '>155']));
M(102, 't0-3', 'd2', 'le=12', 'au=max', 't6', 's=0', 'w-', IF('comp', ['c7', 'comple=max']),
  IF('ctx:norden', ['>185'], [IF('ctx:tjolmar', ['>294'], ['>25'])]));
M(173, 't0-5', 'o1', 'le+1W6', 't8-9', 'd1', '>25');
M(30, 't0-4', F({ foes: [BLUTZAHN], brawl: true, title: 'Grubenkampf gegen Blutzahn' }, ['>285'], ['>14']));
M(165, 't0-3', F({ foes: [BLUTZAHN], brawl: true, title: 'Grubenkampf gegen Blutzahn' }, ['>205'], ['>14']));
M(285, 't0', C('t1', 'b1'), C('t2', 'o1'), 't3-4', 'k:KHURGASH', 't5', CI('s>=20', 't6', 's-20', '>>152'), C('Verlässt du Gashok?', 'x:Du verlässt Gashok mit Ghorrashs Lachen im Nacken.', '>130'));
M(205, 't0-1', C('t2', 'b1'), C('t3', 'o1'), 't4-5', 'au+half', 'k:CAITHRA', 'comp:Caithra', CAITHRA_NOTE, '>130');
M(196, 't0-3', P('KK', 2, ['c5', 'ctx:frei'], ['c6', 'ctx:dicht']), 't7', 'k:CAITHRA', 'f:caithraFlucht', 'comp:Caithra', CAITHRA_NOTE, 't11', '>57');
M(57, 't0-3',
  C('Versteckt ihr euch im Schilf?', P('Sich verstecken', -5, ['x:Die Fackeln ziehen vorbei.', '>140'], ['>189'], { note: 'Sumpfkundig −3, Wasser −2', modIf: [['ctx:dicht', 3]] })),
  C('Wollt ihr am Ufer entlang davonlaufen?', P('Athletik', 2, ['x:Ihr hängt die Verfolger ab.', '>140'], ['x:Sie holen euch an einer Furt ein.', '>189'], { modIf: [['ctx:dicht', 3]] })));
M(22, 't0-1', C('t2', 'd1', 'le+2W6', 'au=max', 'ae+2W6', 'comple=max'), C('Bleibst du nicht über Nacht?'), 't4-8', 'f:tjaku', '>185');
M(34, 't0-6', 'd1', IF('comp', ['c8', 't9', 'x:„Nach Süden. Jetzt gehe ich nach Norden, und das Land gehört immer noch ihnen.“']),
  C('Willst du bei Tag wandern, schneller, aber weithin sichtbar?', '>>163'), C('t11', '>>254'));
M(49, 't0-1', IF('k:KHURGASH', ['x:Du fragst nach Khurgash.', 't2-3']), 't4', '>185');
M(159, IF('i:Goldener Armreif', ['t0', C('Verkaufst du den Armreif für 22 Silbertaler?', 'i-:Goldener Armreif', 's+22'), C('Behältst du ihn?')]),
  SHOP([['Jagdspieß', 9], ['Wurfspeer', 3], ['Kurzbogen', 8, 'Für Caithra: Fernkampf 14, TP 1W+4'], ['Wegzehrung', 2, 'für zwei Wochen']]), '>185');
M(2, 't0-10', C('Hörst du ihm zu und bestellst ihm einen Krug?', IF('s>=1', ['s-1']), '>>110'), C('t12', '>>59'));
M(4, 't0', IF('i:Goldener Armreif', ['t1', C('Verkaufst du den Armreif für 28 Silbertaler?', 'i-:Goldener Armreif', 's+28'), C('Behältst du ihn?')]),
  SHOP([['Jagdspieß', 8], ['Speer', 5], ['Wurfspeer', 3], ['Kurzbogen', 7, 'Für Caithra: Fernkampf 14, TP 1W+4'], ['Lederweste', 5]]), '>59');
M(28, 't0-8', CI('s>=10', 't9', 's-10', '>>264'), C('t10', '>>263'), C('t11', '>>59'));
M(283, 't0-3', TR('Aberglaube',
  [C('Stimmst du zu?', '>>216'), C('Lehnst du trotzdem ab?', '>>59')],
  ['c5', '>59'],
  [C('Stimmst du zu?', '>>216'), C('Lehnst du trotzdem ab?', '>>59')]));
M(67, 't0-1', 'x:„Zwei Silber pro Nase bis Tiefhusen. Oder du ruderst. Mit den Schultern bist du drei Knechte wert.“',
  CI('s>=2&!comp', 'Zahlst du zwei Silbertaler?', 's-2', '>>42'),
  CI('s>=4&comp', 'Zahlst du vier Silbertaler für dich und Caithra?', 's-4', '>>42'),
  C('t3', P('KK', 0, ['x:Du darfst umsonst mitfahren.'], ['x:Du ruderst trotzdem, aber die Arbeit kostet dich Kraft.', 'au-2W6']), '>42'),
  C('t7', '>>292'));
M(14, 't0-4', 's=0', 'au+10', '>130');
M(294, 't0-1', 'd2', 'n:Hier kannst du Wegzehrung und Ausrüstung kaufen und den Armreif für 20 Silbertaler verkaufen.',
  IF('i:Goldener Armreif', [C('Verkaufst du den Armreif für 20 Silbertaler?', 'i-:Goldener Armreif', 's+20'), C('Behältst du ihn?')]),
  SHOP([['Jagdspieß', 9], ['Speer', 5], ['Wurfspeer', 3], ['Fellweste', 4], ['Mückennetz', 1], ['Wegzehrung', 1, 'für eine Woche']]),
  't11', '>207');

// ---------------- Svellt, Tjolmar, Marschen, Orkland
PLACE('ahnengrab', 'Grab am Treidelpfad', 'stones', 272, 238);
PLACE('sklavenlager', 'Lager am Bach', 'camp', 268, 150);
PLACE('nivesenlager', 'Zelte der Nivesen', 'camp', 266, 118);
PLACE('brinaskquelle', 'Am Brinask', 'bank', 252, 100);
PLACE('pfahlhuetten', 'Hütten auf Pfählen', 'hut', 242, 92);
PLACE('sibra', 'Sibra', 'village', 261, 204);
PLACE('elchgrund', 'Steppe am Hain', 'field', 205, 176);
PLACE('ziegenweide', 'Ziegenweide', 'field', 200, 188);
Object.assign(LOC, { 70: 'svellmia', 267: 'ahnengrab', 104: 'sklavenlager', 91: 'nivesenlager', 113: 'brinaskquelle', 74: 'pfahlhuetten', 133: 'enqui', 8: 'sibra', 225: 'knochenfeld', 128: 'elchgrund', 55: 'ziegenweide' });
const ZOLL = FOE('Ork-Zöllner', 10, 11, 8, 26, 2, '1W+4', 'orc');

M(3, 't0-1', IF('f:tjaku', ['c2']), C('t3', '>>114'), C('t4', '>>160'));
M(21, 't0-3', '!tjolmar', '>294');
M(42, 't0-4', IF('comp&f:caithraFlucht', ['x:Die Orks suchen nach Caithra; ein entlaufener Sklave bringt Belohnung.', 't6',
  P('Sich verstecken', 0, ['x:Die Orks finden nichts.'], ['c8', F({ foes: [ZOLL, ZOLL], fleeSP: 12, title: 'Ork-Zöllner' }, [], ['ctx:norden', '>102'])], { label: 'Sich-verstecken-Probe für Caithra (mit deinen Werten)' })]),
  't11-12', 'd3', '!tiefhusen', '>185');
M(70, 't0-2', 'x:„Ein Silber. Für Gjalsker zwei.“', CI('s>=2', 'Zahlst du zwei Silbertaler?', 's-2', '>>11'),
  C('t4', P('Schwimmen', 2, ['x:Du erreichst triefend das andere Ufer.'], ['x:Die Strömung reißt dich mit und nimmt etwas von deiner Ausrüstung mit.', 'le-1W6', GIVE(null)]), '>11'));
M(267, 't0-3', P('Ritualkenntnis', 0, ['c5', 'o1', 'k:AHNENGRAB', 'ae+1W6'], ['c8']), 't9', '>70');
M(140, 't0-8', 'le+1W6', 'au=max', '>130');
M(189, 't0', IF('comp', ['n:Caithra übernimmt den Hund.']), F({ foes: [FOE('Ork-Fährtensucher', 11, 11, 8, 26, 1, '1W+3', 'orcSpear'), FOE('Ork-Fährtensucher', 11, 11, 8, 26, 1, '1W+3', 'orcSpear'), FOE('Hund', 10, 9, 4, 16, 1, '1W+3', 'dog')], fleeSP: 15, title: 'Ork-Fährtensucher' }, ['>140'], ['>102']));
M(104, 't0-3', P('Schleichen', 2, ['c5', 't6', 'o1'], ['x:Ein Wächter bemerkt dich. Du musst fliehen, und ein Pfeil streift dich.', 'le-1W6+2', 't10']), 'd1', '>294');
M(91, 't0-7', 'i+:Mückenfett', 'le+1W6', 'ae+1W6', '>113');
M(113, 't0-1', 'd2', 't3-4', P('Körperbeherrschung', 0, ['x:Du kommst trocken hinüber.'], ['x:Du rutschst ab und landest im eiskalten Wasser. Die Strömung nimmt etwas von deiner Ausrüstung mit.', 'le-1W6', GIVE(null)]), '>232');
M(263, 'f:bache', 't0', P('Klettern', 0, ['x:Du kommst hinüber.'], ['x:Du schrammst dir Hände und Knie auf, aber du kommst hinüber.', 'le-1W6']), 't3',
  P('KK', 0, ['c5'], ['x:Du brauchst drei Versuche und noch mehr Lärm.']), 't7-8', 'o1', 't10-11', '>67');
M(264, 'f:bache', 't0-1', 't3-5', 'o1', 'd1', '>59');
M(216, 'f:magistra', 't0-6', 's+5', 'i+:Zaubertrank', '>59');
M(128, 't0-1', C('t2', P('Sich verstecken', 2, ['c3', '>233'], ['x:Einer der Reiter schreit auf und deutet auf dich.', '>274'])), C('t5', P('Athletik', 2, ['c6', '>233'], ['>274'])));
M(55, 't0-2', C('t3', '>>286'), C('Lässt du ihn laufen, ohne ein Wort?', 'x:Er sieht dich lange an, dann rennt er mit seinen Ziegen davon.', 't5', 'o1', 'k:HIRTENJUNGE', '>233'), C('t8', 'b2', '>>233'));
M(8, 't0-1', 'd2', 'le+1W6', 'ae+1W6', IF('comp', ['comple=max']), 't4', '>225');
M(251, 't0', 't2', F({ foes: [FOE('Ork-Krieger', 11, 13, 9, 30, 2, '1W+4', 'orc')], title: 'Ork-Reiter' }, ['>275'], ['x:Die Freischärler schleppen dich aus dem Kampf, und du erwachst später bei ihrem Feuer.', 'le=10', '>275']));
M(274, 't0-1', IF('comp', ['n:Caithra übernimmt einen der beiden.']), F({ foes: [FOE('Ork-Jäger', 11, 12, 8, 27, 1, '1W+3', 'orcSpear'), FOE('Ork-Jäger', 11, 12, 8, 27, 1, '1W+3', 'orcSpear')], fleeSP: 15, title: 'Ork-Jäger' }, ['>233'], ['>38']));
M(286, 't0-5', TR('Rachsucht',
  ['c7', 'x:Du sagst: „Geh nach Hause, Ushrak. Und sag deinem Vater, dass Dundochs Sohn kommt.“ Der Junge rennt.', 'o2', 'k:HIRTENJUNGE', 'k:KHURGASH'],
  ['x:Die Rachsucht packt dich.', 'b2', 'k:KHURGASH', 't12'],
  ['x:Du sagst: „Geh nach Hause, Ushrak. Und sag deinem Vater, dass Dundochs Sohn kommt.“ Der Junge rennt.', 'o2', 'k:HIRTENJUNGE', 'k:KHURGASH']), '>233');
M(60, 't0-1', 'd2', 'f:marschen', P('KO', 0, ['x:Die Mücken können dir nichts anhaben.'], ['x:Das Sumpffieber packt dich.', 'le-1W6', 'au-2W6'], { modIf: [['i:Mückenfett', -2], ['i:Mückennetz&!i:Mückenfett', -2]] }), '>74');
M(211, 't0-2', 'd1', 'f:marschen', P('Orientierung', -3, ['>249'], ['>172'], { note: 'Sumpfkundig −3' }));
M(225, 't0-5', TR('Totenangst',
  ['c8', IF('k:GEISTERWORT', ['>166'], ['x:Du gehst mit zusammengebissenen Zähnen weiter.', '>36'])],
  ['x:Du rennst in Panik davon, bis die Lunge brennt.', 'au-2W6', '>36']));
M(275, 't0-6', C('t7', 'b1'), C('t8', P('CH', 0, ['x:Berthold schimpft, aber er lässt die beiden laufen.', 'o1'], ['x:Sie hängen die Orks trotzdem, und du siehst dabei zu.'])), C('Willst du dich gar nicht einmischen?', 'x:Du wendest dich ab.'),
  'x:Die Freischärler geben dir zum Dank Brot, Trockenfisch und einen Wurfspeer der Orks.', 'i+:Wurfspeer', 'le+1W6', 'd1', '>8');
M(100, 't0-1', 'd2', 'f:orkland', P('Wildnisleben', 2, ['c5'], ['x:Du quälst dich zwei Tage mit trockener Kehle weiter.', 'le-1W6', 'au-2W6', 'comple-1W6'], { note: 'Eins mit der Natur hilft, wenn du ihn vorher wirkst (Lager).' }), '>272');
M(74, 't0-4', P('Heilkunde Wunden', 2, ['c6', 't7', 'o1', 't10-11', 'ctx:boot'], ['c12', 'd1']), 't14', '>167');
M(167, 't0-1', IF('ctx:boot', ['d1'], ['d2']), '>133');
M(172, 't0-2', 'le-1W6', 'd1', '>249');
M(272, 't0-2', C('t3', P('Athletik', 0, ['c4', '>212'], ['x:Goblin und Proviant sind fort.', 'i-:Proviantbeutel', '>188'])), C('t7', 'i-:Proviantbeutel', '>>188'));
M(129, 't0-2', 'k-:DUNDOCHS SPIESS', 't4-5', IF('k:HIRTENJUNGE', ['>56']), IF('comp', ['>135']), 'x:Du musst dir selbst helfen.',
  C('t9', P('KK', 4, ['>183'], ['>259'])), C('Versuchst du es nicht?', '>>259'));
M(103, 't0-4', 'd1', 'ae+1W6', 'au=max', '>3');

// ---------------- Enqui, Ogerzähne, Firunswall, Schiff
PLACE('schaedelhuegel', 'Hügel mit den Schädelpfählen', 'stones', 181, 178);
PLACE('ogerzaehne', 'Ogerzähne', 'rock', 152, 170);
PLACE('jaegerlager', 'Lager der Jäger', 'camp', 212, 88);
Object.assign(LOC, { 188: 'ogerzaehne', 233: 'schaedelhuegel', 299: 'hirschpass', 193: 'jaegerlager' });
const KRIEGER = FOE('Ork-Krieger', 11, 13, 9, 30, 2, '1W+4', 'orc');
const WAECHTER = FOE('Ork-Wächter', 10, 11, 8, 26, 1, '1W+3', 'orcSpear');
const MEERESANGST = 'n:Bis du wieder an Land bist, sind alle deine Proben um 2 erschwert.';

M(297, 't0-3', TR('Totenangst', ['c7', 't8-11', 'k:GEISTERWORT', 'o1', '>103'], ['x:Du wirfst dich ins Wasser und flüchtest.', 'au-2W6', '>103']));
M(188, 't0-9',
  CI('i:Ogerreißzahn an Lederschnur', 'Ziehst du den Zahn hervor und hältst ihn ihr entgegen, als hättest du den Oger selbst erschlagen?', '>>202'),
  CI('i:Ogerreißzahn an Lederschnur', 't10', '>>107'),
  C('t11', P('Athletik', 3, ['x:Du entkommst durch eine Felsspalte, in die sie nicht passt.', 'd1', '>126'], ['x:Ihre Keule erwischt dich, und du kommst nur mit knapper Not davon.', 'le-3W6', 'd1', '>126'])));
M(212, 't0-3', 'k:GOBLINPFAD', 't5', C('Lässt du ihn laufen?', 'x:Er rennt davon, ohne sich umzusehen.'), C('t7', 'b1'), '>188');
M(183, 't0-1', C('t2', P('Schleichen', 2, ['x:Du hast ihn.', 'k:DUNDOCHS SPIESS'], ['x:Ein Ork wacht auf, und du musst ohne den Spieß fliehen, verfolgt von Gebrüll.', '>78'])), C('Fliehst du sofort?'),
  'x:Du kletterst lautlos die Felsen hinauf, und erst im Morgengrauen bemerken sie, dass du fort bist.', '>73');
M(259, 't0-4', 'dmin48', 'k:KNAPP', 'le=max', 'au=max', 't7-10', '>63');
M(107, 't0-3', 'i-:Ogerreißzahn an Lederschnur', 'o1', 'k:KHURGASH', 'd1', '>126');
M(126, 't0-4', 'le+1W6', 'au=max', 'ae+1W6', 'd1', '>240');
M(202, P('MU', 2, ['c1', 't2-4', 'o1'], ['x:Sie lacht, ein Geräusch wie eine Steinlawine, und holt aus.', 'le-2W6', 'x:Du entkommst durch eine Felsspalte.']), 'd1', '>126');
M(73, 't0-1', 'ctx:-', IF('k:GOBLINPFAD', ['c3']), 'n:Für jede misslungene Probe verlierst du 1W6 AuP und brauchst einen halben Tag länger.',
  P('Athletik', 0, [], ['au-1W6', 'ctx:f1'], { modIf: [['k:GOBLINPFAD', -2]], label: 'Erste Athletik-Probe' }),
  P('Athletik', 0, [], ['au-1W6', IF('ctx:f1', ['ctx:f2'])], { modIf: [['k:GOBLINPFAD', -2]], label: 'Zweite Athletik-Probe' }),
  't5', IF('ctx:f2', ['d3'], ['d2']), '>299');
M(78, 't0-1', P('Athletik', 2,
  ['c3', F({ foes: [KRIEGER, KRIEGER], seq: true, fleeSP: 15, title: 'Auf dem Sims' }, ['t7', '>73'], ['>129'])],
  ['c4', F({ foes: [KRIEGER, KRIEGER], fleeSP: 15, title: 'Auf offenem Geröll' }, ['t7', '>73'], ['>129'])]));
M(63, 't0-9',
  C('t10', P('KK', 3, ['>150'], [P('KK', 6, ['>150'], ['>141'], { label: 'Zweiter Versuch: Körperkraft-Probe +6' })])),
  C('t14', '>>141'));
M(94, 't0-3', C('t4', '>>279'),
  CI('s>=8&!comp', 'Bietest du ihm 8 Silbertaler für die Überfahrt?', 's-8', '>>217'),
  CI('s>=12&comp', 'Bietest du ihm 12 Silbertaler für dich und Caithra?', 's-12', '>>217'),
  CI('i:Goldener Armreif', 'Bietest du ihm den goldenen Armreif?', 'i-:Goldener Armreif', '>>217'),
  C('t6', '>>45'), C('t7', '>>236'));
M(198, 't0-1', 'd1', 'le+2W6', 'au=max', 'ae+2W6', 'comple=max', 't4-5', 'k:KHURGASH', C('t6', '>>94'), C('t7', '>>253'), C('t8', '>>236'));
M(236, 't0', CI('s>=1', 'Zahlst du dem Fährmann einen Silbertaler?', 's-1'), C('Arbeitest du einen halben Tag an seinen Reusen?', 'x:Einen halben Tag lang leerst du Reusen und flickst Netze.', 'h6'), 't1', 'd2', 't3-5', '>193');
M(253, 't0-3', CI('i:Goldener Armreif', 'Bezahlst du ihn mit dem Armreif?', 'i-:Goldener Armreif', 'd2', '>>86'), CI('s>=8', 'Bezahlst du ihn mit 8 Silbertalern?', 's-8', 'd2', '>>86'), C('t5', '>>133'));
M(114, 't0', P('KK', 0, ['c2'], ['x:Du rutschst selbst ein Stück hinein, und ihr braucht beide eine Ewigkeit, bis ihr wieder auf festem Grund liegt.', 'au-2W6']), 't4-6', 'le+1W6', 'o1', 'ctx:kuerzer', '>160');
M(160, 't0-1', P('Körperbeherrschung', -3, ['c3'], ['x:Du versinkst bis zur Brust und kommst erst nach langem Kampf frei.', 'le-1W6', GIVE(null)], { note: 'Sumpfkundig −3' }), IF('!ctx:kuerzer', ['d1']), 't6-7', '>133');
M(299, 't0-5', IF('comp', ['c6', 't7']), '>97');
M(150, 't0-2', 'n:Ein Ast dient dir als Knüppel (Hiebwaffen, TP 1W+2).', F({ foes: [WAECHTER, WAECHTER], fleeSP: 15, weapon: { name: 'Ast', tal: 'Hiebwaffen', tp: '1W+2' }, title: 'Ork-Wächter' },
  ['x:Du nimmst einem der beiden den Speer ab und rennst den Hang hinauf.', 'i+:Speer', 'w:Speer', '>108'], ['>237']));
M(45, 't0-3', F({ foes: [FOE('Hakon Asgrimmson', 10, 12, 10, 42, 0, '1W+3', 'thorwal')], wrestle: true, title: 'Ringkampf gegen Hakon' },
  ['x:Hakon rappelt sich prustend aus dem flachen Wasser neben dem Steg auf und lacht, bis ihm die Tränen kommen.', 't6', 'k:HAKON', '>230'],
  ['x:Du liegst auf dem Rücken, und Hakon steht über dir.', 't8-9', 'au+half', '>236']));
M(217, 't0-1', 'k:HAKON', '>230');
M(279, 't0-3', P('Selbstbeherrschung', 4,
  ['c5', 't6-8', 'o1', 'k:HAKON', 'k:VERSÖHNT', '>230'],
  ['x:Du bringst die Worte nicht heraus.', 't11-12',
    CI('s>=8&!comp', 'Bietest du ihm nun 8 Silbertaler?', 's-8', '>>217'), CI('s>=12&comp', 'Bietest du ihm nun 12 Silbertaler für dich und Caithra?', 's-12', '>>217'),
    CI('i:Goldener Armreif', 'Bietest du ihm den Armreif?', 'i-:Goldener Armreif', '>>217'), C('t13', '>>45'), C('t14', '>>236')]));
M(193, 't0-8', F({ foes: [FOE('Brannagh, der Jäger', 11, 12, 10, 35, 0, '1W+2', 'gjalsk')], wrestle: true, title: 'Ringkampf gegen Brannagh' },
  ['x:Brannagh lacht im Gras liegend.', 'x:„Lyrgach! Nur in Lyrgach wachsen solche Ochsen.“'], []),
  'x:Sie teilen ihr Essen mit dir, geräuchertes Hammelfleisch und Haferfladen, und Brannagh schenkt dir einen Wurfspeer.', 'i+:Wurfspeer', 'au=max', 't14',
  IF('!k:KHURGASH', ['x:Der Anführer der Orks heißt Khurgash und trägt einen Keilerschädel.', 'k:KHURGASH']), '>213');
M(86, 't0-1', P('Orientierung', -3, ['d3'], ['c3', 'd4'], { note: 'Waldkundig −3' }), '>289');
M(51, 't0-1', IF('comp', ['n:Ist Caithra bei dir, packt sie dich am Arm und zischt: „Nicht so! Er hat zwanzig Krieger!“ Die Selbstbeherrschungs-Probe ist dann um 2 erleichtert.']),
  TR('Rachsucht', ['c3', '>65'], ['x:Du stürmst los.', '>137'], ['>65'], { sbModIf: [['comp', -2]] }));
M(108, 't0-12', TR('Rachsucht', [C('t18', '>>122'), C('t19', '>>9')], ['x:Es zieht dich mit aller Macht zu Khurgash.', '>9'], [C('t18', '>>122'), C('t19', '>>9')]));
M(237, 't0-6', 'le=12', 'k:WUNDE', '>170');
M(230, 't0-5', TR('Meeresangst', ['c7'],
  ['c8', 'f:seekrank', 'f:meeresangst', C('Wirkst du Eiseskälte Kämpferherz?', Z('Eiseskälte Kämpferherz', ['f-:seekrank', 'x:Die Kälte in deinem Herzen vertreibt die Angst.'], [MEERESANGST])), C('Erträgst du es?', MEERESANGST)]),
  IF('comp', ['c10', 't11']), '>278');
