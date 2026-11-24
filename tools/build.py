#!/usr/bin/env python3
"""Baut das Spiel als eine einzige HTML-Datei (index.html) mit allen Skripten und Grafiken.

Aufruf im Hauptordner:  python3 tools/build.py
Ergebnis:               index.html (fuer GitHub Pages) und dist/game_check.js (zum Pruefen mit node --check)
"""
import base64, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Grafiken (CC0), siehe assets/LIZENZEN.md
ASSETS = {
    'ow': 'assets/zelda-overworld.png',
    'kr': 'assets/kenney-roguelike-sheet.png',
    'kc': 'assets/kenney-roguelike-chars.png',
}
ORDER = ['util.js', 'assets.js', 'art.js', 'worlddata.js', 'book.js', 'rules.js', 'engine.js', 'story.js', 'villages.js',
         'combat.js', 'audio.js', 'tts.js', 'extras.js', 'pics.js', 'mapview.js', 'ui.js', 'mech_auto.js', 'mech.js', 'mech2.js', 'mech3.js', 'main.js']


def assets_js():
    out = ['// Grafiken (CC0): ArMM1998 "Zelda-like tilesets and sprites"; Kenney "Roguelike pack", "Roguelike Characters pack"',
           'const SHEETS = {']
    for k, p in ASSETS.items():
        data = open(os.path.join(ROOT, p), 'rb').read()
        out.append(f"  {k}: 'data:image/png;base64,{base64.b64encode(data).decode()}',")
    out.append('};')
    return '\n'.join(out) + '\n'


def build():
    html = open(os.path.join(ROOT, 'src', 'index.html'), encoding='utf-8').read()
    parts = []
    for f in ORDER:
        if f == 'assets.js':
            parts.append(assets_js())
            continue
        p = os.path.join(ROOT, 'src', f)
        if not os.path.exists(p):
            print('fehlt (übersprungen):', f)
            continue
        parts.append(f'// ===== {f} =====\n' + open(p, encoding='utf-8').read())
    js = '\n'.join(parts)
    html = html.replace('<!--SCRIPTS-->', '<script>\n' + js + '\n</script>')
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    for target in (os.path.join(ROOT, 'index.html'), os.path.join(ROOT, 'dist', 'haut-des-odun.html')):
        open(target, 'w', encoding='utf-8').write(html)
    open(os.path.join(ROOT, 'dist', 'game_check.js'), 'w', encoding='utf-8').write(js)
    print('gebaut: index.html', round(len(html.encode('utf-8')) / 1024), 'KB')


if __name__ == '__main__':
    build()
