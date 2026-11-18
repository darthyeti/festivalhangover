// Rauchtest: startet das Spiel ohne Bild im Headless-Browser und prueft den Testzugang __G.
// Aufruf: node tests/smoke.js   (braucht Playwright mit Chromium)
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForFunction(() => window.__G && window.__G.st, null, { timeout: 10000 });

  const r = await page.evaluate(() => {
    const G = window.__G;
    const sum = () => G.st.left.reduce((a, b) => a + b, 0);
    const out = { total: G.st.total, leftStart: sum(), map: [G.MW, G.MH, G.T] };
    G.step(30);
    out.tAfterStep = G.st.t;
    out.leftAfterIdle = sum();
    G.clear(0, 0, G.MW - 1, G.MH - 1);
    out.leftAfterClear = sum();
    return out;
  });
  await browser.close();

  const checks = [
    ['keine Fehler in der Konsole', errors.length === 0, errors.join(' | ')],
    ['Karte 80 x 52 Felder zu 32 px', r.map.join('x') === '80x52x32', r.map.join('x')],
    ['8260 Stueck zu Beginn', r.total === 8260 && r.leftStart === 8260, `${r.total}/${r.leftStart}`],
    ['step(30) spult die Zeit vor', r.tAfterStep >= 30, String(r.tAfterStep)],
    ['ohne Eingabe verschwindet nichts', r.leftAfterIdle === 8260, String(r.leftAfterIdle)],
    ['clear() raeumt die ganze Wiese', r.leftAfterClear === 0, String(r.leftAfterClear)],
  ];
  let failed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${ok ? '' : '  -> ' + detail}`);
    if (!ok) failed++;
  }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
