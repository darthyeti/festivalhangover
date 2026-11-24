// Testspieler: spielt eine ganze Partie automatisch ueber den Testzugang __G und misst den Verlauf.
// Aufruf: node tests/bot.js [--stations 2] [--belt 0] [--range 2] [--minutes 240] [--json]
// Er dient dem Balancing (M4): Wie lange dauert jedes Ziel, wo staut es, wie lang ist die Partie.
// Der Testspieler baut eine feste Anlage (siehe plan() unten) und entscheidet alle 0,5 Spielsekunden.
// Er denkt nicht nach und zoegert nicht. Ein Mensch ist langsamer, die Zeiten sind eine Untergrenze.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i < 0 ? def : Number(process.argv[i + 1]); };
const CFG = { stations: arg('stations', 2), belt: arg('belt', 0), range: arg('range', 2), minutes: arg('minutes', 240), items: arg('items', 0), double: process.argv.includes('--double') };

function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': p.endsWith('.js') ? 'text/javascript' : 'text/html' });
      res.end(fs.readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// Laeuft im Browser. Alles, was der Testspieler tut, geht ueber dieselben Funktionen wie die Bedienung.
function play(cfg) {
  const G = window.__G, T = G.T, MW = G.MW, MH = G.MH, st = G.st, P = st.player;
  const log = [], samples = [], goalAt = [];
  const note = txt => log.push({ t: Math.round(st.t), txt });
  const idx = (x, y) => y * MW + x;
  const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  const dirty = (x, y) => G.cells[idx(x, y)].length > 0;
  const free = (x, y) => inMap(x, y) && !G.grid[idx(x, y)] && !G.blocked[idx(x, y)] && !dirty(x, y);
  const row = (y, x0, x1) => { const r = []; for (let x = x0; x <= x1; x++) r.push([x, y]); return r; };
  const col = (x, y0, y1) => { const r = []; for (let y = y0; y <= y1; y++) r.push([x, y]); return r; };
  const rect = (x, y, w, h) => { const r = []; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) r.push([x + i, y + j]); return r; };
  const belts = (tiles, d) => tiles.forEach(t => G.setBelt(t[0], t[1], d));
  const stationPrice = () => Math.round(1500 * Math.pow(1.12, G.blds.filter(b => b.k === 'station').length) / 10) * 10;
  const radius = () => 8 + 3 * st.up.range;
  const sorter = (x, y, d, filter) => { G.demolish(x, y); G.setRot(d); const b = G.build('sort', x, y); if (b) b.filter = filter; return b; };

  // ---- Bauplan. Hauptband auf Zeile 26 nach Westen in die Annahme, Maschinen darueber und darunter. ----
  const R = 26, X0 = 24; // erste Station am Hauptband
  const projects = [
    { id: 'Station und Hauptband', open: () => G.isOpen('station'),
      tiles: [...row(R, 3, X0), [X0, R - 1], ...rect(X0, R - 3, 2, 2)], cost: () => 23 * 50 + stationPrice(),
      build() { belts(row(R, 3, X0), 2); G.setBelt(X0, R - 1, 1); const b = G.build('station', X0, R - 3); if (b) stations.push({ b, stub: [X0, R - 1], trunk: 0 }); return !!b; } },
    { id: 'Dosenpresse', open: () => G.isOpen('pd'),
      tiles: [[20, 25], ...rect(20, 23, 2, 2), [20, 22], [20, 21], ...row(21, 4, 19), ...col(3, 21, 25)], cost: () => 500 + 4000 + 24 * 50,
      build() { sorter(20, R, 3, 0); G.setBelt(20, 25, 3); const b = G.build('pd', 20, 23); belts([[20, 22]], 3); belts(row(21, 4, 20), 2); belts(col(3, 21, 24), 1); G.setBelt(3, 25, 2); return !!b; } },
    { id: 'PET-Presse', open: () => G.isOpen('pp'),
      tiles: [[16, 25], ...rect(16, 23, 2, 2), ...row(23, 4, 15)], cost: () => 500 + 4000 + 13 * 50,
      build() { sorter(16, R, 3, 1); G.setBelt(16, 25, 3); const b = G.build('pp', 16, 23); belts(row(23, 4, 15), 2); return !!b; } },
    { id: 'Kistenpacker', open: () => G.isOpen('kp'),
      tiles: [[13, 27], ...rect(13, 28, 2, 2), [11, 27], [11, 28], [12, 28], [13, 30], [13, 31], ...row(31, 4, 12), ...col(3, 27, 31)], cost: () => 1000 + 6000 + 20 * 50,
      build() { sorter(13, R, 1, 2); sorter(11, R, 1, 3); G.setBelt(13, 27, 1); const b = G.build('kp', 13, 28); G.setBelt(11, 27, 1); belts([[11, 28], [12, 28]], 0);
        G.setBelt(13, 30, 1); belts(row(31, 4, 13), 2); belts(col(3, 28, 31), 3); G.setBelt(3, 27, 2); return !!b; } },
    { id: 'Palettierer', open: () => G.isOpen('pal'),
      tiles: [[9, 20], [10, 20], [10, 22]], cost: () => 15000 + 300 + 50,
      build() { G.demolish(10, 21); G.demolish(9, 21); G.demolish(10, 23); const b = G.build('pal', 9, 20); G.build('split', 10, 23); G.setBelt(10, 22, 3); return !!b; } },
    // Ausbau (--double): zweite Dosenpresse und zweite PET-Presse unter dem Hauptband, sobald die Baender schneller sind
    { id: 'Zweite Pressen', open: () => cfg.double && st.up.belt >= 1 && projects.slice(0, 4).every(p => p.done),
      tiles: [[21, 27], ...rect(21, 28, 2, 2), [21, 30], [18, 27], ...rect(18, 28, 2, 2), [18, 30], ...row(31, 14, 21)], cost: () => 2 * 6500 + 12 * 50,
      build() { sorter(21, R, 1, 0); sorter(18, R, 1, 1); G.setBelt(21, 27, 1); G.setBelt(18, 27, 1); const a = G.build('pd', 21, 28), b = G.build('pp', 18, 28);
        G.setBelt(21, 30, 1); G.setBelt(18, 30, 1); belts(row(31, 14, 21), 2); return !!a && !!b; } },
    // Zwei weitere Hauptbaender im Norden und Sueden, verbunden ueber Spalte 23
    { id: 'Hauptband Nord', open: () => wantTrunk(1), tiles: col(23, 9, 25), cost: () => 17 * 50, build() { belts(col(23, 9, 25), 1); trunks[1].end = 23; return true; } },
    { id: 'Hauptband Süd', open: () => wantTrunk(2), tiles: col(23, 27, 43), cost: () => 17 * 50, build() { belts(col(23, 27, 43), 3); trunks[2].end = 23; return true; } },
  ];
  const trunks = [{ y: R, end: X0 }, { y: 9, end: 0 }, { y: 43, end: 0 }];
  const stations = [];
  // Reihenfolge der Kaeufe ausserhalb des Bauplans. Verbesserungen: 0 Tuete, 1 Schuhe, 2 Sammler, 3 Umkreis, 4 Bandtempo.
  const wishes = [];
  wishes.push({ up: 0 }, { up: 1 });
  for (let i = 1; i < cfg.stations; i++) wishes.push({ station: true });
  for (let i = 0; i < cfg.range; i++) wishes.push({ up: 3 });
  for (let i = 0; i < cfg.belt; i++) wishes.push({ up: 4 });
  wishes.push({ up: 0 }, { up: 1 }, { up: 0 });

  // ---- Stationen: Plaetze am Hauptband suchen ----
  const count = (cx, cy, r) => { let n = 0; for (let y = Math.max(0, cy - r); y <= Math.min(MH - 1, cy + r); y++) for (let x = Math.max(0, cx - r); x <= Math.min(MW - 1, cx + r); x++) if (Math.hypot(x - cx, y - cy) <= r) n += G.cells[idx(x, y)].length; return n; };
  function sites() {
    const out = [], r = radius();
    trunks.forEach((tr, ti) => { if (!tr.end) return;
      for (let x = X0; x <= Math.min(MW - 3, tr.end + 12); x++) for (const up of [true, false]) {
        const sy = up ? tr.y - 3 : tr.y + 2, stub = [x, up ? tr.y - 1 : tr.y + 1], foot = rect(x, sy, 2, 2);
        if (sy < 0 || sy + 1 >= MH) continue;
        if ([...foot, stub].some(t => G.blocked[idx(t[0], t[1])] || G.grid[idx(t[0], t[1])])) continue;
        if (stations.some(s => s.site && Math.hypot(s.site.x - x, s.site.sy - sy) < r * 0.8) || stations.some(s => s.b && Math.hypot(s.b.x - x, s.b.y - sy) < r * 0.8 && !s.b.empty)) continue;
        const n = count(x + 1, sy + 1, r); if (n > 0) out.push({ ti, x, sy, stub, dir: up ? 1 : 3, n, ext: Math.max(0, x - tr.end) });
      } });
    return out.sort((a, b) => (b.n - b.ext * 6) - (a.n - a.ext * 6));
  }
  let bestMid = 9999;
  const wantTrunk = ti => stations.length > 0 && trunks[ti].end === 0 && bestMid < 150;
  const siteTiles = s => [...rect(s.x, s.sy, 2, 2), s.stub, ...row(trunks[s.ti].y, trunks[s.ti].end + 1, s.x)];
  function settle(s) { // Station s auf ihren ausgesuchten Platz setzen
    const q = s.site, tr = trunks[q.ti];
    const ext = row(tr.y, tr.end + 1, q.x); if (st.money < (ext.length + 1) * 50) return false;
    if (s.b) { G.demolish(s.stub[0], s.stub[1]); if (!G.moveTo(s.b, q.x, q.sy)) { G.setBelt(s.stub[0], s.stub[1], s.dir); return false; } }
    else { if (st.money < stationPrice() + (ext.length + 1) * 50) return false; s.b = G.build('station', q.x, q.sy); if (!s.b) return false; }
    belts(ext, 2); if (ext.length) tr.end = q.x; G.setBelt(q.stub[0], q.stub[1], q.dir);
    s.stub = q.stub; s.dir = q.dir; s.site = null; s.moves = (s.moves || 0) + 1; moves++; s.rest = st.t + 8; s.b.empty = false; return true;
  }
  let moves = 0;

  // ---- Spielfigur ----
  const cap = () => 25 + 10 * st.up.bag;
  let job = null, handTime = 0, waitTime = 0;
  function nearestDirty(tiles) { let best = null, bd = 1e9; for (const t of tiles) { if (!dirty(t[0], t[1])) continue; const it = G.cells[idx(t[0], t[1])][0], d = Math.hypot(it.x - P.x, it.y - P.y); if (d < bd) { bd = d; best = it; } } return best; }
  function nearestAny() { const px = (P.x / T) | 0, py = (P.y / T) | 0; let best = null, bd = 1e9;
    for (let r = 0; r < Math.max(MW, MH); r++) { if (best && r * T > bd + T) break;
      for (let y = py - r; y <= py + r; y++) for (let x = px - r; x <= px + r; x++) { if (!inMap(x, y) || Math.max(Math.abs(x - px), Math.abs(y - py)) !== r) continue;
        for (const it of G.cells[idx(x, y)]) { const d = Math.hypot(it.x - P.x, it.y - P.y); if (d < bd) { bd = d; best = it; } } } }
    return best; }
  function deposit() { let tx = (G.AUTO.x + 2) * T + 24, ty = (G.AUTO.y + 1.5) * T, bd = Math.hypot(tx - P.x, ty - P.y) + (G.AUTO.q.length >= 30 ? 400 : 0);
    for (const s of stations) { if (!s.b || s.b.buf.length > 15) continue; const x = (s.b.x + 1) * T, y = (s.b.y + 1) * T + 40, d = Math.hypot(x - P.x, y - P.y); if (d < bd) { bd = d; tx = x; ty = y; } }
    P.tx = tx; P.ty = ty; }
  function tents(tiles) { for (const t of tiles) if (G.blocked[idx(t[0], t[1])] && !G.grid[idx(t[0], t[1])]) { if (st.money < 500) return false; G.demolish(t[0], t[1]); tentsGone++; } return true; }
  let tentsGone = 0;

  // ---- Hauptschleife ----
  const limit = cfg.minutes * 60; let lastSample = -1, autoFull = 0, ticks = 0, stIdle = 0, stFull = 0;
  while (!st.done && st.t < limit) {
    G.step(0.5); ticks++;
    while (goalAt.length < st.ph) { goalAt.push(st.t); note('Ziel ' + goalAt.length + ' erreicht'); }
    if (G.AUTO.q.length >= 40) autoFull++;
    for (const s of stations) { if (!s.b) continue; if (s.b.empty && !s.b.buf.length) stIdle++; else if (s.b.buf.length >= 30) stFull++; }

    // 0. Zelte (E-019): Der Testspieler kennt die Zeltkette nicht. Er baut die Zelte von Hand ab, sobald Geld uebrig ist, damit die Partie endet.
    if (st.ph >= 5 && (st.money >= 150000 || st.left.reduce((a, b) => a + b, 0) === 0 && st.money >= 500)) { const f = G.foot.find(q => !q.o.gone); if (f) { G.demolish(f.x / T | 0, f.y / T | 0); if (f.o.gone) tentsGone++; else f.skip = (f.skip || 0) + 1; } }
    // 1. Bauplan: erstes offenes Projekt, dessen Bauteile frei sind
    const proj = projects.find(p => !p.done && p.open());
    if (proj && tents(proj.tiles) && proj.tiles.every(t => free(t[0], t[1])) && st.money >= proj.cost()) {
      if (proj.build()) { proj.done = true; note('Gebaut: ' + proj.id); } else { proj.done = true; note('FEHLER beim Bau: ' + proj.id); }
    }
    // 2. Wuensche (Verbesserungen, weitere Stationen), nur wenn kein bezahlbares Projekt wartet
    const reserve = proj ? proj.cost() : 0, w = wishes[0];
    if (w && stations.length) {
      if (w.up != null) { const lvl = Object.values(st.up)[w.up]; const m0 = st.money; if (st.money >= reserve * 0.5 + 1 && G.buyUp(w.up) ) { wishes.shift(); note('Verbesserung ' + Object.keys(st.up)[w.up] + ' Stufe ' + (lvl + 1) + ' für ' + ((m0 - st.money) / 100).toFixed(2) + ' €'); } else if (lvl >= [6, 5, 5, 3, 4][w.up]) wishes.shift(); }
      else if (w.station && st.money >= stationPrice() + 600 + reserve * 0.5) { stations.push({ b: null, stub: null }); wishes.shift(); }
    }
    // 3. Stationen ohne Arbeit bekommen einen neuen Platz
    let need = null;
    for (const s of stations) {
      const idle = !s.b || (s.b.empty && !s.b.buf.length && st.t > (s.rest || 0)); // nach dem Versetzen brauchen die Sammler ein paar Sekunden, bis sie Arbeit melden
      if (idle && !s.site) { const c = sites(); bestMid = Math.max(0, ...c.filter(q => q.ti === 0).map(q => q.n)); if (c.length) s.site = c[0]; }
      if (s.site) { const tiles = siteTiles(s.site);
        if (tents(tiles) && tiles.every(t => free(t[0], t[1]) || (G.grid[idx(t[0], t[1])] && G.grid[idx(t[0], t[1])].k === 'belt'))) { if (settle(s)) note(s.moves > 1 ? 'Station versetzt' : 'Station gebaut'); }
        else if (!need) need = tiles; }
    }
    // 4. Spielfigur: Tuete leeren, sonst Bauplatz saeubern, sonst frei sammeln
    if (P.bag.length >= cap()) { deposit(); if (Math.hypot(P.tx - P.x, P.ty - P.y) < 6) waitTime += 0.5; }
    else { const tiles = need || (proj ? proj.tiles : null); let it = tiles ? nearestDirty(tiles) : null;
      if (!it && P.bag.length && tiles && stations.length === 0) { deposit(); it = null; }
      else { if (!it) it = nearestAny(); if (it) { P.tx = it.x; P.ty = it.y; } else if (P.bag.length) deposit(); } }
    handTime += 0.5;

    if (Math.floor(st.t / 300) > lastSample) { lastSample = Math.floor(st.t / 300); const left = st.left.reduce((a, b) => a + b, 0);
      samples.push({ min: lastSample * 5, sauber: +(100 * (st.total - left) / st.total).toFixed(1), geld: +(st.money / 100).toFixed(0), eingenommen: +(st.earned / 100).toFixed(0), stationen: stations.filter(s => s.b).length, ziel: st.ph + 1 }); }
  }
  const left = st.left.reduce((a, b) => a + b, 0);
  return { total: st.total, fertig: st.done, minuten: +(st.t / 60).toFixed(1), sauber: +(100 * (st.total - left) / st.total).toFixed(1), eingenommen: +(st.earned / 100).toFixed(2), geld: +(st.money / 100).toFixed(2),
    ziele: goalAt.map(t => +(t / 60).toFixed(1)), verkauft: st.sold, up: st.up, versetzt: moves, zelte: tentsGone,
    annahmeVoll: +(100 * autoFull / ticks).toFixed(0), stationOhneArbeit: +(100 * stIdle / Math.max(1, ticks)).toFixed(0), stationVoll: +(100 * stFull / Math.max(1, ticks)).toFixed(0),
    offen: projects.filter(p => !p.done).map(p => p.id), samples, log };
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/` + (CFG.items ? '?items=' + CFG.items : ''));
  await page.waitForFunction(() => window.__G && window.__G.st, null, { timeout: 10000 });
  const t0 = Date.now();
  const r = await page.evaluate(play, CFG);
  await browser.close(); server.close();
  if (process.argv.includes('--json')) { console.log(JSON.stringify(r)); return; }
  console.log(`Testspieler: ${r.total} Stück, ${CFG.stations} Stationen, Umkreis bis Stufe ${CFG.range}, Bandtempo bis Stufe ${CFG.belt}${CFG.double ? ', doppelte Pressen' : ''}  (Rechenzeit ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  console.log(r.fertig ? `Wiese sauber nach ${r.minuten} Minuten` : `Nicht fertig nach ${r.minuten} Minuten, ${r.sauber} % sauber`);
  console.log('Ziele erreicht nach Minuten: ' + r.ziele.join(' | '));
  console.log(`Eingenommen ${r.eingenommen} €, übrig ${r.geld} €, Paletten ${r.verkauft[7]}, Ballen ${r.verkauft[4]}+${r.verkauft[5]}, volle Kästen ${r.verkauft[6]}, roh ${r.verkauft.slice(0, 4).join('/')}`);
  console.log(`Stationen versetzt: ${r.versetzt}, Zelte abgebaut: ${r.zelte}, Annahme voll: ${r.annahmeVoll} % der Zeit, Station ohne Arbeit: ${r.stationOhneArbeit} %, Station voll: ${r.stationVoll} % (je Station gezählt)`);
  if (r.offen.length) console.log('Nicht gebaut: ' + r.offen.join(', '));
  console.log('Verlauf alle 5 Minuten:');
  for (const s of r.samples) console.log(`  ${String(s.min).padStart(3)} min  ${String(s.sauber).padStart(5)} % sauber  Ziel ${s.ziel}  ${String(s.geld).padStart(6)} € Kasse  ${s.stationen} Stationen`);
  console.log('Ereignisse:');
  for (const e of r.log) console.log(`  ${String(Math.floor(e.t / 60)).padStart(3)}:${String(e.t % 60).padStart(2, '0')}  ${e.txt}`);
  if (errors.length) console.log('Fehler im Browser: ' + errors.join(' | '));
})().catch(e => { console.error(e); process.exit(1); });
