import asyncio, sys, random, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Aufruf: python3 test/bot.py 1 2 3   (Zufallswerte fuer die Laeufe)
from playwright.async_api import async_playwright
STEP = r"""
(seed) => {
  const vis = s => { const e = document.querySelector(s); return e && !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none'; };
  const rnd = () => { window.__r = (window.__r * 1103515245 + 12345) % 2147483648; return window.__r / 2147483648; };
  if (window.__r === undefined) window.__r = seed;
  const pick = list => list[Math.floor(rnd() * list.length)];
  if (typeof G === 'undefined' || !G) return 'nogame';
  if (vis('#dice')) {
    const bs = [...document.querySelectorAll('#dicebtns button')].filter(b => !/AsP vorher|Zeichen des Od/.test(b.textContent));
    if (bs.length) { pick(bs).click(); return 'dicebtn'; }
    document.querySelector('#dicebox').click(); return 'roll';
  }
  if (vis('#combat')) {
    const bs = [...document.querySelectorAll('#cbacts button')].filter(b => !b.disabled);
    if (!bs.length) return 'cwait';
    const pref = bs.filter(b => /Angriff|Weiter|Wurfspeer werfen|Wurf \(/.test(b.textContent));
    (pref.length && rnd() < 0.8 ? pick(pref) : pick(bs)).click(); return 'combat';
  }
  if (vis('#panel')) {
    const buy = [...document.querySelectorAll('#panel .itm button')].filter(b => !b.disabled && /Kaufen/.test(b.textContent));
    if (buy.length && rnd() < 0.3) { pick(buy).click(); return 'buy'; }
    document.querySelector('#panel header button').click(); return 'closepanel';
  }
  if (vis('#sheet')) {
    const bs = [...document.querySelectorAll('#sheet .choices button')].filter(b => !b.disabled);
    if (!bs.length) return 'swait';
    const b = pick(bs);
    if (/Selbst laufen/.test(b.textContent)) { bs[0].click(); return 'travel'; }
    b.click(); return 'choice:' + b.textContent.slice(0, 40);
  }
  if (G.target) { ENG.teleport(G.target); STORY.checkArrival(true); return 'tele:' + G.target; }
  if (G.hubOpts) { UI.showSheet(); return 'hub'; }
  return 'idle';
}
"""
async def run(seed, maxsteps=6000):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.add_init_script("localStorage.setItem('odun_settings', JSON.stringify({music:false,sound:false,autoDice:true}));")
        await pg.goto('file://' + os.path.join(ROOT, 'index.html'))
        await pg.wait_for_timeout(1200)
        await pg.click('#btnNew'); await pg.wait_for_timeout(200)
        await pg.click('text=Aufbrechen'); await pg.wait_for_timeout(800)
        secs = []; idle = 0; last = None
        for i in range(maxsteps):
            r = await pg.evaluate(STEP, seed)
            sec = await pg.evaluate("() => (typeof G !== 'undefined' && G) ? String(G.sec) : null")
            if sec != last:
                secs.append(sec); last = sec
                print(sec, end=' ', flush=True)
            ended = await pg.evaluate("() => { const h = document.querySelector('#panel h2'); return h && h.textContent === 'Abenteuerbericht' && !document.querySelector('#panel').classList.contains('hidden'); }")
            if ended: break
            if r in ('idle', 'swait', 'cwait'): idle += 1
            else: idle = 0
            if idle > 60: break
            if r.startswith('tele') or r == 'nogame': print(f'[{r}]', end=' ', flush=True)
            await pg.wait_for_timeout(15 if r not in ('swait', 'cwait') else 80)
        st = await pg.evaluate("() => ({day: G.day, odun: G.odun, blut: G.blut, le: G.le, kw: G.kw, silver: G.silver, map: G.map, target: G.target})")
        await b.close()
        return secs, errs, st, ended
async def main():
    seeds = [int(x) for x in sys.argv[1:]] or [1, 2, 3]
    for sd in seeds:
        secs, errs, st, ended = await run(sd)
        print(f'--- Seed {sd}: {len(secs)} Abschnitte, Ende={ended}')
        print('Weg:', ' '.join(secs))
        print('Stand:', st)
        print('Fehler:', errs[:8])
asyncio.run(main())
