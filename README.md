# Die Haut des Odûn

Ein Solo-Abenteuer für **Das Schwarze Auge 4.1** als Spiel fürs Handy, direkt im Browser.
Du bist Yurrgold, Sohn des Dundoch, oder Gjalla, Dundochs Tochter: ein junger Gjalsker, der zur Sommersonnenwende
in Lyrgach seine Visionsqueste bestehen will. Der Weg führt durch Weiden, das Svellttal und die Wildnis des Nordens.

**▶ Jetzt spielen:** https://thilomat.github.io/Zeichen-des-Od-n/

Am besten auf dem Handy öffnen und über „Zum Home-Bildschirm“ wie eine App ablegen.

## So wird gespielt

- **Laufen:** auf die Karte tippen, dein Held läuft hin. Dörfer kannst du betreten und darin herumlaufen.
- **Buch:** Die Abschnitte erscheinen als Buchseite. Unten wählst du, wie es weitergeht.
- **Proben und Kämpfe:** auf den Würfel tippen. Die Regeln folgen DSA 4.1 (Eigenschafts- und Talentproben, Attacke und Parade).
- **Menü:** Musik, Klänge, automatisches Würfeln, Kurzregeln, Vorlesen und ein neues Spiel.
- Der Spielstand wird im Browser gespeichert.

## Vorlesen

Auf jeder Buchseite gibt es oben den Knopf **🔊**. Er liest die Seite vor, ein zweiter Tipp (■) hält an.
Im **Menü → Vorlesen** kannst du einstellen:

- **Neue Abschnitte automatisch vorlesen** (an oder aus)
- **Stimme:**
  - **Handy:** die eingebaute Stimme deines Geräts. Sie ist sofort da, klingt aber je nach Gerät unterschiedlich gut.
  - **Thorsten:** eine freie deutsche Männerstimme (Piper). Sie wird einmalig geladen (etwa 90 MB, am besten im WLAN),
    bleibt danach im Browser gespeichert und rechnet direkt auf deinem Gerät.
- **Tempo** und **Probe hören**

## Für Entwickler

Das Spiel ist eine einzige Datei `index.html`, gebaut aus den Skripten in `src/`:

```
python3 tools/build.py
```

| Ordner | Inhalt |
|---|---|
| `src/` | Quelltext: Regeln, Karte, Dörfer, Kampf, Buch, Musik, Vorlesen |
| `assets/` | Grafikbögen (CC0) |
| `vendor/` | Bausteine für die Thorsten-Stimme, siehe `vendor/LIZENZEN.md` |
| `tools/` | Bauskript |
| `test/bot.py` | spielt das Abenteuer automatisch durch (Playwright) |

GitHub Pages veröffentlicht die Seite aus dem Zweig `gh-pages`. Nach Änderungen an `main` also auch dorthin schieben:
`git push origin main main:gh-pages`

## Mitwirkende und Lizenzen

- Abenteuer: „Die Haut des Odûn“, Spielbuch von Claude (Anthropic) für Thilo, 2026. Inoffizielles Fan-Werk, nicht kommerziell.
- Grafik: ArMM1998 und Kenney (CC0), siehe `assets/LIZENZEN.md`. Tiere, Moor und Gebirge selbst gezeichnet.
- Musik und Klänge werden im Browser erzeugt.
- Vorlesen: Thorsten-Voice von Thorsten Müller (CC0), Piper, espeak-ng (GPL-3.0) und ONNX Runtime Web (MIT), siehe `vendor/LIZENZEN.md`.

Das Schwarze Auge, Aventurien und Dere sind eingetragene Marken der Significant Fantasy Medienrechte GbR.
Dieses Spiel steht in keiner Verbindung zu Ulisses Spiele.
