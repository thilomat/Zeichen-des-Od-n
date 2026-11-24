'use strict';
// ---------------------------------------------------------------- Offene Welt: Kraeuter, Jagd, Begegnungen
const EXTRA = {};
(function () {
  const HERBNAME = { wirsel: 'Wirselkraut', einbeere: 'Einbeeren', gulmond: 'Gulmond', belmart: 'Belmart', vierblatt: 'Vierblättrige Einbeere' };
  function terrainMod(skill) {
    // Waldkundig/Sumpfkundig: -3 in passendem Gelaende
    const c = ENG.tile(ENG.map(), G.x, G.y);
    if ('TDLb'.includes(c) && ['Orientierung', 'Wildnisleben', 'Fährtensuchen', 'Fallen stellen', 'Pflanzenkunde', 'Schleichen', 'Sich verstecken'].includes(skill)) return -3;
    if ('smb'.includes(c) && ['Orientierung', 'Wildnisleben', 'Fährtensuchen', 'Fallen stellen', 'Pflanzenkunde', 'Schleichen', 'Sich verstecken'].includes(skill)) return -3;
    return 0;
  }
  EXTRA.terrainMod = terrainMod;
  // Kleine Seite ohne Abschnittsnummer
  async function page(title, pic, text) {
    PAGE.openExtra(title, pic);
    if (text) PAGE.text([text]);
  }
  async function close() { await PAGE.cont('Weiter'); UI.hideSheet(); $('#sheet').classList.add('hidden'); PAGE.closeExtra(); }

  // ---------------- Kraeuter
  EXTRA.herb = async function (i) {
    const h = MAPS.world.herbs[i]; if (!h || G.herbs[i] || UI.busy()) return;
    const name = HERBNAME[h.k];
    await page('Ein Kraut am Wegrand', 'herb', `Zwischen Gras und Moos leuchtet etwas: Das könnte ${name} sein. Erkennst du es sicher?`);
    const ok = await PAGE.probe({ skill: 'Pflanzenkunde', mod: terrainMod('Pflanzenkunde') + (h.k === 'vierblatt' ? 4 : 0) });
    ENG.addHours(1);
    if (ok) { G.herbs[i] = 1; G.inv[name] = (G.inv[name] || 0) + 1; G.stats.herbs++; PAGE.fx(`Neu im Gepäck: ${name} (${ITEMS[name].desc})`); }
    else { G.herbs[i] = 2; PAGE.text(['Du bist dir nicht sicher und lässt es lieber stehen.']); }
    await close();
  };
  EXTRA.searchHerbs = async function () {
    await page('Kräuter suchen', 'herb', 'Du gehst langsam, den Blick am Boden, und prüfst Blätter und Beeren.');
    const ok = await PAGE.probe({ skill: 'Pflanzenkunde', mod: terrainMod('Pflanzenkunde') });
    ENG.addHours(2);
    if (ok) {
      const near = MAPS.world.herbs.map((h, i) => [h, i]).filter(([h, i]) => !G.herbs[i] && Math.abs(h.x - G.x) <= 10 && Math.abs(h.y - G.y) <= 10);
      if (near.length) { near.forEach(([h]) => ENG.reveal(h.x, h.y, 1)); PAGE.text([`Du entdeckst ${near.length === 1 ? 'eine Stelle' : near.length + ' Stellen'} in der Nähe, an denen Heilkräuter wachsen. Tippe sie auf der Karte an.`]); }
      else { G.inv['Einbeeren'] = (G.inv['Einbeeren'] || 0) + 1; PAGE.fx('Neu im Gepäck: Einbeeren'); }
    } else PAGE.text(['Du findest nichts, was dir weiterhilft.']);
    await close();
  };
  // ---------------- Jagd
  EXTRA.hunt = async function () {
    const c = ENG.tile(MAPS.world, G.x, G.y);
    if ('H#'.includes(c)) { UI.toast('Hier gibt es kein Wild.'); return; }
    await page('Auf der Jagd', 'hunt', 'Du suchst nach frischen Fährten, nach Losung und abgeknabberten Trieben.');
    const ok = await PAGE.probe({ skill: 'Fährtensuchen', mod: terrainMod('Fährtensuchen') });
    ENG.addHours(5);
    if (!ok) { PAGE.text(['Die Spuren sind alt oder führen ins Leere. Mit leeren Händen kehrst du zurück.']); await close(); return; }
    const boar = RNG() < 0.25 && 'TDLbs'.includes(c);
    if (boar) {
      PAGE.text(['Die Spur ist frisch: breite Schalen, aufgewühlte Erde. Ein Keiler. Dein Bruder.']);
      const pick = await PAGE.choose([{ label: 'Die Spur liegen lassen und anderes Wild suchen', v: 0 }, { label: 'Ihn trotzdem jagen', v: 1 }]);
      if (pick.v === 0) { PAGE.text(['Du lässt ihn ziehen. Am Abend fängst du stattdessen zwei Hasen in einer Schlinge.']); G.inv['Wegzehrung'] = (G.inv['Wegzehrung'] || 0) + 1; PAGE.fx('Neu im Gepäck: Wegzehrung'); await close(); return; }
      PAGE.text(['Deine Hand zittert, als du den Speer hebst. Der Odûn sieht dir zu.']);
      PAGE.fx(STORY.fx('b1'), true);
      await close(); return;
    }
    const throwing = R.throwCount() > 0;
    PAGE.text([throwing ? 'Ein Rehbock äst am Waldrand. Du hebst den Wurfspeer.' : 'Du pirschst dich an einen Rehbock heran, den Speer stoßbereit.']);
    const at = throwing ? HERO.kampf['Wurfspeere'][1] - 2 : R.combatVals(R.weapon().tal).at - 4;
    const [w] = await DICE.quick([`${throwing ? 'FK' : 'AT'} ${at}`], 'Jagdwurf', `W20 höchstens ${at}`);
    if (w <= at && w !== 20) { const n = 1 + (RNG() < 0.5 ? 1 : 0); G.inv['Wegzehrung'] = (G.inv['Wegzehrung'] || 0) + n; G.stats.hunts++; PAGE.text(['Getroffen. Du weidest das Tier aus, räucherst das Fleisch am Feuer und packst es ein.']); PAGE.fx(`Neu im Gepäck: ${n}× Wegzehrung`); }
    else PAGE.text(['Das Tier springt davon, bevor du triffst.']);
    await close();
  };
  EXTRA.einsNatur = async function () {
    await page('Eins mit der Natur', 'meditate', 'Du setzt dich auf den Boden, legst die Hände auf die Erde und atmest, bis dein Herz so langsam schlägt wie das eines Keilers im Winterschlaf.');
    const ok = await PAGE.spell({ spell: 'Eins mit der Natur' });
    if (ok) PAGE.text(['Der Wald spricht zu dir. Bis zum nächsten Sonnenaufgang fallen dir Fährten, Wege und Wetter leichter.']);
    ENG.addHours(1);
    await close();
  };
  EXTRA.camp = async function () {
    await page('Nachtlager', 'night', 'Du suchst dir einen geschützten Platz, schlägst Funken aus Feuerstein und Stahl und wickelst dich in die Decke.');
    G.hours = HOURS_PER_DAY - 0.01; ENG.addHours(0.02);
    await close();
  };
  EXTRA.nightfall = function () { G.lastNight = G.day; };

  // ---------------- Begegnungen unterwegs
  const ENC = {
    w: [['wolves', 3], ['bandits', 2], ['peddler', 2], ['deer', 2], ['charcoal', 1]],
    m: [['wisp', 3], ['bog', 3], ['corpse', 1], ['raven', 2]],
    s: [['orcs', 3], ['peddler', 2], ['refugees', 2], ['wolves', 1]],
    o: [['orcs', 4], ['steppewolves', 2], ['goblins', 2]],
    k: [['leech', 3], ['bog', 2], ['nivese', 2], ['wisp', 1]],
    f: [['wolves', 2], ['bear', 1], ['hunter', 2]],
    g: [['wolves', 2], ['hunter', 3], ['bear', 1], ['raven', 1]],
    n: [['wolves', 2], ['bear', 1], ['deer', 2], ['peddler', 1]],
  };
  EXTRA.onStep = function () {
    if (!G || UI.busy() || UI.suspended() || G.map !== 'world') return;
    if ((G.settings && G.settings.noEnc) || UI.settings().noEnc) return;
    const sinceH = (G.day * HOURS_PER_DAY + G.hours) - (G.lastEnc || -999);
    if (sinceH < 30) return;
    const p = G.leg ? 0.012 : 0.03;
    const tileH = STEP_H[ENG.tile(MAPS.world, G.x, G.y)] || 2;
    if (RNG() > p * tileH) return;
    if (ENG.tile(MAPS.world, G.x, G.y) === 'H') return;
    const list = ENC[ENG.region(G.x, G.y)] || ENC.w;
    let tot = list.reduce((s, x) => s + x[1], 0), r = RNG() * tot, k = list[0][0];
    for (const [n, w] of list) { r -= w; if (r <= 0) { k = n; break; } }
    G.lastEnc = G.day * HOURS_PER_DAY + G.hours;
    ENG.stop();
    encounter(k);
  };
  async function fightOrAvoid(text, foes, avoidSkill, avoidMod, pic, win) {
    await page('Unterwegs', pic, text);
    const pick = await PAGE.choose([{ label: 'Dich dem Kampf stellen', v: 1 }, { label: `Ausweichen (${avoidSkill}-Probe${avoidMod ? ' ' + R.modText(avoidMod) : ''})`, v: 0 }]);
    if (pick.v === 0) {
      const ok = await PAGE.probe({ skill: avoidSkill, mod: avoidMod + terrainMod(avoidSkill) });
      if (ok) { PAGE.text(['Du bleibst unbemerkt und lässt die Gefahr hinter dir.']); ENG.addHours(1); await close(); return; }
      PAGE.text(['Zu spät, sie haben dich bemerkt.']);
    }
    const res = await PAGE.fight({ spec: { foes, fleeLe: 6, title: 'Begegnung unterwegs' } });
    if (res.win && win) win();
    if (!res.win) { G.le = Math.max(1, G.le); PAGE.text(['Mit letzter Kraft schleppst du dich davon. Die Gegner lassen von dir ab.']); }
    await close();
  }
  async function encounter(k) {
    try {
      switch (k) {
        case 'wolves': return fightOrAvoid('Graue Schatten zwischen den Stämmen, dann ein Knurren: Wölfe, und sie sind hungrig.', ['Wolf|11|10|5|18|1|1W+3', 'Wolf|11|10|5|18|1|1W+3'], 'Schleichen', 2, 'wolves');
        case 'steppewolves': return fightOrAvoid('Über die Steppe kommen sie in einer Kette, die Zungen hängen ihnen aus dem Maul: Steppenwölfe.', ['Steppenwolf|12|11|5|20|1|1W+3', 'Steppenwolf|12|11|5|20|1|1W+3'], 'Sich verstecken', 2, 'wolves');
        case 'bandits': return fightOrAvoid('Zwei Gestalten treten aus dem Unterholz, Knüppel in den Fäusten. „Dein Beutel oder deine Zähne, Großer.“', ['Wegelagerer|10|11|8|24|1|1W+3', 'Wegelagerer|10|10|8|22|1|1W+2'], 'Schleichen', 4, 'bandits', () => { const s = rint(1, 4); G.silver += s; PAGE.fx(`+${s} Silbertaler aus ihren Beuteln`); });
        case 'orcs': return fightOrAvoid('Du riechst sie, bevor du sie siehst: ranziges Fett und nasses Fell. Eine Streife der Schwarzpelze zieht vorbei.', ['Ork|10|11|8|26|2|1W+3', 'Ork|10|11|8|26|2|1W+3'], 'Sich verstecken', 0, 'orcs', () => { G.inv['Wurfspeer'] = (G.inv['Wurfspeer'] || 0) + 1; PAGE.fx('Neu im Gepäck: Wurfspeer'); });
        case 'goblins': return fightOrAvoid('Kleine, rotpelzige Gestalten huschen durchs Gras. Goblins, drei an der Zahl, mit rostigen Spießen.', ['Goblin|9|9|5|16|1|1W+2', 'Goblin|9|9|5|16|1|1W+2', 'Goblin|9|8|5|15|1|1W+2'], 'Schleichen', 0, 'goblins');
        case 'leech': return fightOrAvoid('Im brackigen Wasser bewegt sich etwas Langes, Glattes: ein Riesenegel, so dick wie dein Arm.', ['Riesenegel|8|8|0|15|0|1W+1'], 'Körperbeherrschung', 2, 'marsh');
        case 'bear': return fightOrAvoid('Ein Braunbär richtet sich vor dir auf, größer als du, und brüllt.', ['Braunbär|8|10|5|40|3|2W+2'], 'Tierkunde', 0, 'bear');
        case 'corpse': return fightOrAvoid('Aus dem schwarzen Wasser hebt sich eine braune, triefende Gestalt mit leeren Augenhöhlen.', [{ name: 'Moorleiche', ini: 8, at: 9, pa: 3, le: 30, rs: 3, tp: '1W+3', img: 'corpse', undead: true }], 'Körperbeherrschung', 0, 'moor');
        case 'wisp': {
          await page('Unterwegs', 'wisp', 'Ein Licht tanzt über dem Moor, freundlich und warm, und es scheint dich zu rufen.');
          const ok = await PAGE.probe({ skill: 'Selbstbeherrschung', mod: 2 });
          if (ok) PAGE.text(['Du reißt den Blick los. Ein Irrlicht. Wer ihm folgt, kommt nie wieder.']);
          else { PAGE.text(['Du folgst ihm, Schritt um Schritt, bis das Wasser dir an die Knie reicht. Dann erlischt es, und du brauchst Stunden zurück auf festen Grund.']); ENG.addHours(6); PAGE.fx(STORY.fx('au-1W6')); }
          return close();
        }
        case 'bog': {
          await page('Unterwegs', 'moor', 'Unter deinem Fuß gibt der Boden nach, und schwarzer Schlamm saugt an deinem Bein.');
          const ok = await PAGE.probe({ skill: 'Körperbeherrschung', mod: terrainMod('Wildnisleben') });
          if (ok) PAGE.text(['Du wirfst dich zur Seite und ziehst das Bein frei.']);
          else { PAGE.text(['Erst nach langem Kampf kommst du frei, triefend und erschöpft.']); PAGE.fx(STORY.fx('au-2W6')); }
          return close();
        }
        case 'peddler': {
          await page('Unterwegs', 'trader', 'Ein Hausierer mit einem Esel kommt dir entgegen. „Wegzehrung, Salbe, Garn! Für dich, Großer, zum halben Preis.“');
          await PAGE.shop({ items: [['Wegzehrung', 1], ['Wolfskrautsalbe', 3], ['Wurfspeer', 3]] });
          PAGE.text(['Der Esel trottet weiter, der Händler pfeift ein Lied.']);
          return close();
        }
        case 'refugees': {
          await page('Unterwegs', 'refugees', 'Eine Familie mit einem Handkarren, alles Hab und Gut darauf. Sie fliehen vor den Orks nach Süden. Die Kinder starren deine Zöpfe an.');
          if (G.inv['Wegzehrung']) {
            const pick = await PAGE.choose([{ label: 'Teilst du deine Wegzehrung?', v: 1 }, { label: 'Gehst du weiter?', v: 0 }]);
            if (pick.v) { STORY.fx('i-:Wegzehrung'); PAGE.text(['Die Mutter nimmt das Bündel mit beiden Händen. Der Vater nickt dir nur zu.']); }
          } else PAGE.text(['Du hast nichts, was du ihnen geben könntest, außer einem Nicken.']);
          return close();
        }
        case 'deer': {
          await page('Unterwegs', 'deer', 'Ein Rudel Rotwild zieht über die Lichtung, ohne dich zu bemerken. Für einen Augenblick ist die Welt ganz still.');
          return close();
        }
        case 'raven': {
          await page('Unterwegs', 'raven', 'Ein Rabe landet vor dir auf einem Stein, legt den Kopf schief und krächzt dreimal.');
          const r = await PAGE.trait({ trait: 'Aberglaube' });
          if (r === 'seized') { PAGE.text(['Ein Unglücksbote! Du machst einen weiten Bogen und verlierst darüber Zeit.']); ENG.addHours(4); }
          else PAGE.text(['Nur ein Vogel. Du gehst weiter.']);
          return close();
        }
        case 'charcoal': {
          await page('Unterwegs', 'kiln', 'Rauch zwischen den Stämmen: ein Köhler bei seinem Meiler. Er teilt Brot und Neuigkeiten mit dir.');
          return close();
        }
        case 'nivese': {
          await page('Unterwegs', 'nivese', 'Ein Nivese mit einem Bündel Felle auf dem Rücken grüßt dich mit erhobener Hand und zeigt dir einen trockenen Pfad durch das Ried.');
          ENG.addHours(-2);
          return close();
        }
        case 'hunter': {
          await page('Unterwegs', 'gjalsk', 'Ein Jäger mit Fellmantel und Speer tritt aus dem Nebel. Er mustert deine Zöpfe, dann grinst er und teilt geräuchertes Hammelfleisch mit dir.');
          G.inv['Wegzehrung'] = (G.inv['Wegzehrung'] || 0) + 1; PAGE.fx('Neu im Gepäck: Wegzehrung');
          return close();
        }
      }
    } catch (e) { console.error(e); }
  }
  EXTRA.encounter = encounter;
})();
