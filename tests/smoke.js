// Rauchtest: startet das Spiel im Headless-Browser und prueft es ueber den Testzugang __G.
// Aufruf: node tests/smoke.js   (braucht Playwright mit Chromium)
// ES-Module laden nicht von file://, deshalb liefert der Test das Repo ueber einen lokalen Server aus.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };

function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => window.__G && window.__G.st, null, { timeout: 10000 });

  const r = await page.evaluate(() => {
    const G = window.__G;
    const sum = () => G.st.left.reduce((a, b) => a + b, 0);
    const out = { total: G.st.total, leftStart: sum(), map: [G.MW, G.MH, G.T] };
    G.step(30);
    out.tAfterStep = G.st.t;
    out.leftAfterIdle = sum();

    // Kleine Anlage im Hof: Sammelstation, drei Felder Band nach links in die Annahme.
    G.st.money = 100000;
    out.station = !!G.build('station', 6, 25);
    out.belts = [[5, 25, 2], [4, 25, 2], [3, 25, 2]].every(b => G.setBelt(...b));
    out.blockedBuild = G.build('pd', 0, 0) === null && G.setBelt(-1, 5, 0) === false;
    const before = sum();
    G.step(300);
    out.collected = before - sum();
    out.earned = G.st.earned;
    out.soldRaw = G.st.sold.slice(0, 4).reduce((a, b) => a + b, 0);

    // Abriss erstattet voll.
    const m0 = G.st.money;
    G.demolish(3, 25);
    out.refund = G.st.money - m0;

    G.clear(0, 0, G.MW - 1, G.MH - 1);
    out.leftAfterClear = sum();
    return out;
  });
  await browser.close();
  server.close();

  const checks = [
    ['keine Fehler in der Konsole', errors.length === 0, errors.join(' | ')],
    ['Karte 80 x 52 Felder zu 32 px', r.map.join('x') === '80x52x32', r.map.join('x')],
    ['8260 Stueck zu Beginn', r.total === 8260 && r.leftStart === 8260, `${r.total}/${r.leftStart}`],
    ['step(30) spult die Zeit vor', r.tAfterStep >= 30, String(r.tAfterStep)],
    ['ohne Eingabe verschwindet nichts', r.leftAfterIdle === 8260, String(r.leftAfterIdle)],
    ['Sammelstation und Band lassen sich bauen', r.station && r.belts, `${r.station}/${r.belts}`],
    ['Bauen auf belegtem Feld und ausserhalb wird abgelehnt', r.blockedBuild, String(r.blockedBuild)],
    ['Sammler raeumen den Umkreis', r.collected > 0, String(r.collected)],
    ['Annahme zaehlt und bezahlt Rohware', r.soldRaw > 0 && r.earned > 0, `${r.soldRaw} Stueck, ${r.earned} Cent`],
    ['Abriss eines Bandfelds erstattet 50 Cent', r.refund === 50, String(r.refund)],
    ['clear() raeumt die ganze Wiese', r.leftAfterClear === 0, String(r.leftAfterClear)],
  ];
  let failed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${ok ? '' : '  -> ' + detail}`);
    if (!ok) failed++;
  }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
