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
    G.st.ph = 6; // alle Bauteile frei, die Freischaltung prueft der dritte Durchgang
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

    // Rueckgaengig: Bau, Abriss und Versetzen lassen sich zuruecknehmen, das Geld stimmt danach wieder.
    const cell = (x, y) => G.grid[y * G.MW + x];
    const m1 = G.st.money;
    const press = G.build('pd', 4, 22);
    out.undoBuild = !!press && G.st.money === m1 - 4000 && G.undo() && cell(4, 22) === null && G.st.money === m1;
    const st2 = G.blds.find(b => b.k === 'station');
    G.demolish(st2.x, st2.y);
    const gone = cell(6, 25) === null;
    out.undoDemolish = gone && G.undo() && cell(6, 25) === st2 && cell(7, 26) === st2 && G.st.money === m1;
    out.move = G.moveTo(st2, 6, 22) && cell(6, 22) === st2 && cell(7, 23) === st2 && cell(6, 25) === null && G.st.money === m1;
    out.moveBlocked = G.moveTo(st2, 1, 25) === false && st2.x === 6 && st2.y === 22;
    out.undoMove = G.undo() && st2.x === 6 && st2.y === 25 && cell(6, 22) === null;

    // Stauanzeige: Presse ohne Ausgang meldet sich, mit Ausgangsband nicht mehr.
    const pd = G.build('pd', 4, 22);
    out.jamIdle = G.jam(pd) === '';
    pd.out = 2;
    out.jamNoOut = G.jam(pd).startsWith('Kein Ausgang');
    G.setBelt(6, 22, 0);
    out.jamBlocked = G.jam(pd) === 'Stau am Ausgang';
    pd.out = 0;
    out.jamClear = G.jam(pd) === '';

    // Bandplaner: Vorschlag von Gebaeude zu Gebaeude, rechtwinklig angeschlossen, ein Rueckgaengig-Schritt.
    while (G.undo()) {}
    G.st.money = 100000;
    const sA = G.build('station', 3, 22);
    const pB = G.build('pd', 6, 29);
    const plan = G.planBelt(sA.x, sA.y, pB.x, pB.y);
    const path = plan ? plan.path : [];
    const adj = (t, b) => { const nx = t.x + [1, 0, -1, 0][t.d], ny = t.y + [0, 1, 0, -1][t.d]; return nx >= b.x && nx < b.x + b.w && ny >= b.y && ny < b.y + b.h; };
    const away = (t, b) => { const px = t.x - [1, 0, -1, 0][t.d], py = t.y - [0, 1, 0, -1][t.d]; return px >= b.x && px < b.x + b.w && py >= b.y && py < b.y + b.h; };
    out.planFound = path.length > 0;
    out.planChain = path.every((t, i) => i === path.length - 1 || (t.x + [1, 0, -1, 0][t.d] === path[i + 1].x && t.y + [0, 1, 0, -1][t.d] === path[i + 1].y));
    out.planEnds = path.length > 0 && away(path[0], sA) && adj(path[path.length - 1], pB);
    out.planLen = path.length;
    const turns = path.filter((t, i) => i > 0 && t.d !== path[i - 1].d).length;
    out.planTurns = turns;
    const m2 = G.st.money;
    out.planBuilt = !!plan && G.buildPlan(plan) === 'ok' && G.belts.length === path.length && G.st.money === m2 - plan.cost;
    sA.buf.push(0, 0, 0); // drei Dosen zuerst, sonst haengt es davon ab, was die Sammler als Erstes bringen
    G.step(240);
    out.planFlows = Object.values(pB.buf).some(v => v > 0) || pB.made > 0;
    out.planUndo = G.undo() && G.belts.length === 0 && G.st.money === m2;
    out.planFrontal = (() => { G.setBelt(10, 24, 0); const q = G.planBelt(13, 24, 10, 24); return !q || !(q.path[q.path.length - 1].d === 2 && q.path[q.path.length - 1].y === 24 && q.path[q.path.length - 1].x === 11); })();

    // Kreuzung: zwei Linien queren sich, ohne sich zu mischen.
    while (G.undo()) {}
    G.st.money = 100000;
    const yard = [];
    for (let x = 3; x <= 8; x++) yard.push([x, 23, 0]);          // waagerecht nach rechts, y=23
    yard.forEach(b => G.setBelt(...b));
    for (let y = 22; y <= 24; y++) if (y !== 23) G.setBelt(5, y, 1); // senkrecht nach unten, x=5, Luecke bei y=23
    const mBefore = G.st.money;
    const cx = G.build('cross', 5, 23);                           // belegt: dort liegt schon Band
    out.crossNeedsFree = cx === null;
    G.demolish(5, 23);
    const cr = G.build('cross', 5, 23);
    out.crossBuilt = !!cr && G.st.money === mBefore + 50 - 400;
    G.tryPush(3, 23, 0, 0); G.tryPush(5, 22, 1, 1);               // Dose von links, PET von oben
    G.step(4);
    const at = (x, y) => { const o = G.grid[y * G.MW + x]; return o && o.k === 'belt' ? o.item : -2; };
    out.crossKeepsLines = at(8, 23) === 0 && at(5, 24) === 1;
    out.crossJam = G.jam(cr) === '';
    // Planer: quert das gerade Band bei eingeschaltetem Kreuzen, sonst nicht.
    G.belts.filter(t => t.item >= 0).forEach(t => { t.item = -1; });
    for (let y = 25; y <= 30; y++) G.setBelt(6, y, 1);            // Band quer durch den Hof, x=6, nach unten
    G.ui.planCross = true;
    const pc = G.planBelt(5, 28, 8, 28);
    out.planCrosses = !!pc && pc.crosses === 1 && pc.path.some(t => t.cross && t.x === 6 && t.y === 28) && pc.cost === 3 * 50 + 350;
    G.ui.planCross = false;
    const pn = G.planBelt(5, 28, 8, 28);
    out.planNoCross = !pn || pn.crosses === 0;
    G.ui.planCross = true;
    const m4 = G.st.money, nb = G.belts.length;
    out.planCrossBuilt = !!pc && G.buildPlan(pc) === 'ok' && G.grid[28 * G.MW + 6].k === 'cross' && G.st.money === m4 - pc.cost;
    G.tryPush(6, 25, 2, 1); G.tryPush(5, 28, 0, 0);
    G.step(6);
    out.planCrossFlows = at(6, 30) === 2 && at(8, 28) === 0;
    G.belts.filter(t => t.item >= 0).forEach(t => { t.item = -1; });
    out.planCrossUndo = G.undo() && G.grid[28 * G.MW + 6].k === 'belt' && G.belts.length === nb && G.st.money === m4;
    // Ein Bandfeld mit seitlichem Zulauf laesst sich nicht queren.
    G.setBelt(7, 29, 2);
    const pk = G.planBelt(5, 29, 8, 29);
    out.planNoCorner = !pk || !pk.path.some(t => t.cross && t.x === 6 && t.y === 29);

    // Baender ruecken dicht auf, egal in welcher Reihenfolge sie gebaut wurden.
    const dense = (rev) => {
      while (G.belts.length) G.demolish(G.belts[0].x, G.belts[0].y);
      G.st.player.bag.length = 0;
      const tiles = [[8, 26, 2], [7, 26, 2], [6, 26, 2], [5, 26, 2], [4, 26, 2], [3, 26, 2]];
      if (rev) tiles.reverse();
      tiles.forEach(t => G.setBelt(...t));
      let occ = 0, n = 0;
      for (let i = 0; i < 600; i++) { G.tryPush(8, 26, 4, 2); G.step(1 / 60); if (i > 300) { occ += G.belts.filter(t => t.item >= 0).length; n++; } }
      return occ / n;
    };
    const dA = dense(false), dB = dense(true);
    out.beltDense = dA > 5.9 && dB > 5.9 && Math.abs(dA - dB) < 0.01;
    out.beltDenseDetail = dA.toFixed(2) + '/' + dB.toFixed(2);

    // Reissverschluss: Muendet ein Band seitlich in ein volles Band, kommen beide abwechselnd dran.
    while (G.belts.length) G.demolish(G.belts[0].x, G.belts[0].y);
    [[8, 26, 2], [7, 26, 2], [6, 26, 2], [5, 26, 2], [4, 26, 2], [3, 26, 2], [6, 28, 3], [6, 27, 3]].forEach(t => G.setBelt(...t));
    let zA = 0, zB = 0;
    for (let i = 0; i < 1800; i++) { const a = G.tryPush(8, 26, 0, 2), b = G.tryPush(6, 28, 1, 3); if (i > 600) { if (a) zA++; if (b) zB++; } G.step(1 / 60); }
    out.zipper = zA > 5 && zB > 5 && zA / zB > 0.6 && zA / zB < 1.7;
    out.zipperDetail = zA + '/' + zB;
    while (G.belts.length) G.demolish(G.belts[0].x, G.belts[0].y);
    G.st.player.bag.length = 0; G.AUTO.q.length = 0;
    while (G.belts.length) G.demolish(G.belts[0].x, G.belts[0].y);
    G.st.player.bag.length = 0;

    // Zelte abbauen: kostet 5 Euro, gibt die Felder frei, Rueckgaengig stellt das Zelt wieder her.
    let tent = -1;
    for (let i = 0; i < G.MW * G.MH && tent < 0; i++) if (G.blocked[i]) tent = i;
    const tx = tent % G.MW, ty = (tent / G.MW) | 0;
    const blockedCount = () => G.blocked.reduce((a, b) => a + b, 0);
    const b0 = blockedCount(), m3 = G.st.money;
    G.demolish(tx, ty, true);
    out.tentDragSafe = blockedCount() === b0 && G.st.money === m3;
    G.demolish(tx, ty);
    out.tentRemoved = G.blocked[tent] === 0 && blockedCount() < b0 && G.st.money === m3 - 500;
    out.tentUndo = G.undo() && blockedCount() === b0 && G.st.money === m3;
    G.st.money = 100;
    G.demolish(tx, ty);
    out.tentNoMoney = blockedCount() === b0 && G.st.money === 100;
    G.st.money = 100000;

    G.clear(0, 0, G.MW - 1, G.MH - 1);
    out.leftAfterClear = sum();
    return out;
  });
  // Zweiter Durchgang: Spielstand. Anlage mit Ware an allen Stellen aufbauen, speichern, neu laden, vergleichen.
  // Eigener Browser-Kontext: Beim Verlassen der Seite speichert das Spiel, der erste Durchgang endet mit leerer Wiese.
  const url = page.url();
  await page.close();
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  // Ohne Bildschleife laeuft das Spiel nur ueber __G.step weiter. Sonst vergeht zwischen Speichern und Vergleich echte Zeit.
  await ctx2.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  const page2 = await ctx2.newPage();
  page2.on('pageerror', e => errors.push(e.message));
  page2.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page2.goto(url);
  await page2.waitForFunction(() => window.__G && window.__G.st, null, { timeout: 10000 });
  const carried = () => page2.evaluate(() => {
    const G = window.__G;
    return JSON.stringify({
      belts: G.belts.map(t => [t.x, t.y, t.dir, t.item, Math.round(t.prog * 1000)]),
      blds: G.blds.filter(b => b.k !== 'auto').map(b => [b.k, b.x, b.y, b.item, b.it, b.buf, b.out, b.made, b.t == null ? null : Math.round(b.t * 1000), b.filter, b.dir]),
      auto: [G.AUTO.q, Math.round(G.AUTO.acc * 1000)], bag: G.st.player.bag, money: G.st.money, left: G.st.left,
    });
  });
  const s1 = await page2.evaluate(() => {
    const G = window.__G, o = {};
    G.st.money = 100000;
    for (let x = 3; x <= 8; x++) G.setBelt(x, 23, 0);
    G.crossOver(5, 23);
    G.setRot(1); G.build('sort', 4, 28); G.build('split', 6, 28);
    const pd = G.build('pd', 4, 30) || G.build('pd', 5, 29);
    for (let x = 3; x <= 7; x++) G.setBelt(x, 26, 2);            // laeuft nach links in die Annahme
    G.tryPush(3, 23, 0, 0); G.tryPush(4, 28, 1, 0); G.tryPush(6, 28, 2, 0);
    for (let i = 0; i < 14; i++) G.tryPush(pd.x, pd.y, 0, 0);
    G.tryPush(7, 26, 0, 2); G.step(0.4); G.tryPush(7, 26, 1, 2); G.step(0.4); G.tryPush(7, 26, 2, 2);
    G.step(1.3);
    // Abriss ohne Verlust: Band mit Stueck abreissen, das Stueck landet in der Tuete, Rueckgaengig bringt ein leeres Band.
    const loaded = G.belts.find(t => t.item >= 0 && t.y === 26);
    o.hadLoaded = !!loaded;
    const bag0 = G.st.player.bag.length, lx = loaded.x, ly = loaded.y, kind = loaded.item;
    G.demolish(lx, ly);
    o.toBag = G.st.player.bag.length === bag0 + 1 && G.st.player.bag[bag0] === kind;
    G.undo();
    const back = G.grid[ly * G.MW + lx];
    o.restoredEmpty = !!back && back.k === 'belt' && back.item === -1;
    o.pdRunning = pd.t >= 0 || pd.out > 0;
    G.tryPush(3, 23, 1, 0); G.step(0.1);                          // ein Stueck mitten auf dem Band
    G.save();
    return o;
  });
  const before = await carried();
  await page2.reload();
  await page2.waitForFunction(() => window.__G && window.__G.st, null, { timeout: 10000 });
  const after = await carried();
  const parts = JSON.parse(before);
  const onBelts = parts.belts.filter(t => t[3] >= 0).length;
  const inSmall = parts.blds.filter(b => (b[3] != null && b[3] >= 0) || (b[4] && b[4].some(v => v >= 0))).length;

  // Versionsnummer: index.html und konstanten.js muessen zusammenpassen, jedes Modul steht in der Importtabelle.
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const version = (fs.readFileSync(path.join(ROOT, 'js', 'konstanten.js'), 'utf8').match(/const VERSION=(\d+)/) || [])[1];
  const mods = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
  const versionOk = !!version && html.includes(`src="js/eingabe.js?v=${version}"`) && mods.every(m => html.includes(`"./js/${m}":"./js/${m}?v=${version}"`)) && (html.match(/\?v=/g) || []).length === mods.length + 1;

  // Dritter Durchgang: Ziele, Freischaltungen, neue Verbesserungen, Wege um Zelte (M3).
  const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx3.addInitScript(() => { window.requestAnimationFrame = () => 0; });
  const page3 = await ctx3.newPage();
  page3.on('pageerror', e => errors.push(e.message));
  await page3.goto(url);
  await page3.waitForFunction(() => window.__G && window.__G.st, null, { timeout: 10000 });
  const m3 = await page3.evaluate(() => {
    const G = window.__G, o = {};
    o.startLocked = G.st.ph === 0 && !G.isOpen('belt') && !G.isOpen('pd') && G.isOpen('walk') && G.isOpen('demo');
    G.st.earned = 600; G.step(0.1);
    o.goal1 = G.st.ph === 1 && G.isOpen('belt') && G.isOpen('station') && !G.isOpen('sort') && !!G.ui.toast;
    G.st.viaBelt = 40; G.step(0.1); o.goal2 = G.st.ph === 2 && G.isOpen('sort') && G.isOpen('pd') && !G.isOpen('pp');
    G.st.sold[4] = 3; G.st.sold[5] = 3; G.st.sold[6] = 3; G.st.sold[7] = 1; G.step(0.1);
    o.goalPal = G.st.ph === 6;
    G.st.sold[7] = 10; G.step(0.1);
    o.goalAll = o.goalPal && G.st.ph === 7 && G.isOpen('pal');
    G.st.money = 1e7;

    // Wege um Zelte: Die Spielfigur betritt auf dem Weg hinter ein Zelt kein gesperrtes Feld.
    const B = (x, y) => G.blocked[y * G.MW + x];
    let t = null;
    for (let y = 3; y < G.MH - 3 && !t; y++) for (let x = 12; x < G.MW - 4 && !t; x++) if (B(x, y) && !B(x - 2, y) && !B(x + 3, y) && !B(x - 3, y)) t = [x, y];
    const ax = (t[0] - 2) * 32 + 16, ay = t[1] * 32 + 16, bx = (t[0] + 3) * 32 + 16;
    o.losBlocked = !G.los(ax, ay, bx, ay);
    const pts = G.findPath(ax, ay, bx, ay);
    o.pathFree = pts.length > 1 && pts.every(q => !B((q.x / 32) | 0, (q.y / 32) | 0));
    const pl = G.st.player; pl.x = ax; pl.y = ay; pl.tx = bx; pl.ty = ay; pl.path = null;
    let inTent = 0, steps = 0;
    while (Math.hypot(pl.x - bx, pl.y - ay) > 4 && steps++ < 1800) { G.step(1 / 60); if (B((pl.x / 32) | 0, (pl.y / 32) | 0)) inTent++; }
    o.walkAround = inTent === 0 && steps < 1800;
    o.walkDetail = inTent + ' Schritte im Zelt, ' + steps + ' Schritte';

    // Station: leerer Umkreis meldet sich, die Verbesserung vergroessert ihn.
    G.clear(20, 18, 23, 21);
    let st0 = null, sx, sy;
    for (let y = 18; y < 21 && !st0; y++) for (let x = 20; x < 23 && !st0; x++) { st0 = G.build('station', x, y); sx = x; sy = y; }
    o.stationBuilt = !!st0;
    G.step(3); o.noWarnBusy = G.jam(st0) === '';
    for (let y = 0; y < G.MH; y++) for (let x = 0; x < G.MW; x++) if (Math.hypot(x - sx - 1, y - sy - 1) < 9.6) G.clear(x, y, x, y);
    for (let i = 0; i < 40; i++) { G.step(1); st0.buf.length = 0; }
    o.warnEmpty = st0.empty && G.jam(st0).includes('Umkreis leer');
    G.st.up.range = 2; G.step(6); st0.buf.length = 0;
    o.rangeHelps = !st0.empty && G.jam(st0) !== 'Umkreis leer: versetzen';
    G.demolish(sx, sy);

    // Schnellere Baender: Stufe 2 traegt doppelt so viel.
    const rate = lvl => { G.st.up.belt = lvl; while (G.belts.length) G.demolish(G.belts[0].x, G.belts[0].y);
      for (let x = 8; x >= 4; x--) G.setBelt(x, 30, 2);
      const end = G.belts[G.belts.length - 1]; let c = 0, acc = 0;
      for (let i = 0; i < 1500; i++) { acc = Math.min(1, acc + (3 + 1.5 * lvl) / 60); if (acc >= 0.999999 && G.tryPush(8, 30, 0, 2)) acc -= 1; G.step(1 / 60); if (end.item >= 0) { end.item = -1; if (i >= 300) c++; } }
      return c / 20; };
    const r0 = rate(0), r2 = rate(2), r4 = rate(4);
    o.beltFast = r0 > 2.95 && r0 < 3.05 && r2 > 5.9 && r2 < 6.1 && r4 > 8.4 && r4 < 9.1; o.beltDetail = r0.toFixed(2) + '/' + r2.toFixed(2) + '/' + r4.toFixed(2);
    // Jede weitere Maschine derselben Art kostet das Anderthalbfache, der Abriss erstattet den gezahlten Preis.
    { const m1 = G.st.money, a = G.build('pd', 30, 30) || (G.clear(30, 30, 33, 31), G.build('pd', 30, 30)), m2 = G.st.money; G.clear(32, 30, 33, 31); const b = G.build('pd', 32, 30), m3 = G.st.money;
      const n = G.blds.filter(q => q.k === 'pd').length; o.priceUp = !!a && !!b && (m2 - m3) === Math.round((m1 - m2) * 1.5 / 10) * 10 && m1 - m2 >= 4000; G.demolish(32, 30); o.priceRefund = G.st.money === m2; G.demolish(30, 30); o.priceDetail = [m1 - m2, m2 - m3, n].join('/'); }
    G.st.up.belt = 0;

    // Sortierer direkt auf ein Band setzen: Band wird erstattet, das Stueck darauf bleibt, ein Rueckgaengig-Schritt.
    while (G.belts.length) G.demolish(G.belts[0].x, G.belts[0].y);
    for (let x = 4; x <= 8; x++) G.setBelt(x, 30, 2);
    G.tryPush(6, 30, 1, 2); const ms = G.st.money, nb = G.belts.length; G.setRot(3);
    const sw = G.beltSwap('sort', 6, 30);
    o.swapOk = !!sw && sw.k === 'sort' && sw.item === 1 && sw.dir === 3 && G.st.money === ms - 450 && G.belts.length === nb - 1;
    G.undo(); o.swapUndo = G.belts.length === nb && G.st.money === ms && G.grid[30 * G.MW + 6].k === 'belt';
    o.swapNeedsBelt = G.beltSwap('split', 20, 40) === null;

    // Zwei Sortierer uebereinander, ein Querband muendet seitlich in den oberen: Nichts darf im unteren stranden.
    while (G.belts.length) G.demolish(G.belts[0].x, G.belts[0].y);
    { G.setRot(2); const gs = G.build('sort', 6, 30), ks = G.build('sort', 6, 29); gs.filter = 2; ks.filter = 3;
      G.setBelt(6, 31, 3); G.setBelt(6, 28, 3); G.setBelt(6, 27, 3); for (const y of [29, 30]) { G.setBelt(5, y, 2); G.setBelt(4, y, 2); G.setBelt(7, y, 2); G.setBelt(8, y, 2); }
      const top = G.grid[27 * G.MW + 6]; let got = 0;
      for (let i = 0; i < 6; i++) { G.tryPush(8, 29, 0, 2); for (let k = 0; k < 120; k++) { G.step(1 / 60); if (top.item >= 0 && top.prog >= 1) { top.item = -1; got++; } } }
      o.sortSide = got === 6 && gs.item < 0 && ks.item < 0 && !G.jam(gs);
      gs.item = 0; gs.from = 1; gs.wait = 0; for (let k = 0; k < 360; k++) { G.step(1 / 60); if (top.item >= 0 && top.prog >= 1) { top.item = -1; got++; } }
      o.sortRescue = gs.item < 0 && got === 7; o.sortDetail = got + '/' + gs.item + '/' + ks.item;
      G.demolish(6, 30); G.demolish(6, 29); G.st.player.bag.length = 0; }
    // Kurve am Sortierer: ohne geraden Ausgang geht der Rest auf ein Band daneben, das quer wegfuehrt. Mit geradem Ausgang nicht.
    while (G.belts.length) G.demolish(G.belts[0].x, G.belts[0].y);
    { G.setRot(3); const sb = G.build('sort', 6, 29); sb.filter = 1; G.setBelt(8, 29, 2); G.setBelt(7, 29, 2); G.setBelt(6, 30, 2); G.setBelt(5, 30, 2); G.setBelt(4, 30, 2);
      G.tryPush(8, 29, 0, 2); G.step(4); const at = (x, y) => { const q = G.grid[y * G.MW + x]; return q && q.k === 'belt' ? q.item : -2; };
      G.planBelt(4, 32, 6, 32); // rechnet die Zulaeufe neu, sonst macht das erst das naechste Bild
      o.sortCurve = sb.item < 0 && at(4, 30) === 0 && !G.jam(sb) && G.grid[30 * G.MW + 6].feed.includes(1);
      G.grid[30 * G.MW + 4].item = -1; G.setBelt(5, 29, 2); G.setBelt(4, 29, 2); G.tryPush(8, 29, 0, 2); G.step(4);
      o.sortStraight = at(4, 29) === 0 && at(4, 30) === -1; o.curveDetail = [sb.item, at(4, 30), at(4, 29)].join('/');
      G.demolish(6, 29); G.st.player.bag.length = 0; }

    // Spielende: Wiese leer, aber Reste haengen in der Anlage. Das Spiel endet trotzdem und schreibt sie gut.
    while (G.belts.length) G.demolish(G.belts[0].x, G.belts[0].y);
    G.st.player.bag.length = 0; G.AUTO.q.length = 0;
    const pd = G.build('pd', 6, 28); G.setBelt(5, 28, 0); G.setBelt(4, 28, 0);
    for (let i = 0; i < 5; i++) { G.tryPush(4, 28, 0, 0); G.step(1); }
    G.tryPush(4, 28, 2, 0); G.step(2); // eine Glasflasche bleibt vor der Presse liegen
    o.notDoneYet = !G.st.done;
    G.clear(0, 0, G.MW - 1, G.MH - 1);
    G.tryPush(4, 28, 1, 0); G.step(0.5); // noch in Bewegung: das Ende wartet drei ruhige Sekunden ab
    G.ui.busyT = G.st.t; const m0 = G.st.money; G.step(2); o.waitsBeforeEnd = !G.st.done; G.step(4);
    o.endsWithRest = G.st.done && !!G.st.rest && G.st.rest.n === 7 && G.st.rest.v === 5 * 25 + 8 + 25 && G.st.money - m0 === 158 && pd.buf[0] === 0;
    o.endDetail = JSON.stringify(G.st.rest) + ' ' + (G.st.money - m0);
    G.st.done = false; // der Rest des Durchgangs prueft nur noch den Spielstand

    // Alter Spielstand: ohne Zielstand ist alles frei, die Verbesserung der Annahme wird erstattet.
    G.save();
    const d = JSON.parse(localStorage.getItem('montagmorgen2-v1'));
    o.savedPhase = d.ph === 7 && d.n > 12000;
    delete d.ph; delete d.viaBelt; d.up = { bag: 1, shoe: 0, auto: 2, crew: 0 }; d.money = 1000;
    localStorage.setItem('montagmorgen2-old', JSON.stringify(d));
    d.ph = 2; localStorage.setItem('montagmorgen2-new', JSON.stringify(d));
    return o;
  });
  // Neue Seite im selben Kontext: page3 bleibt offen und ueberschreibt den Stand nicht beim Verlassen.
  const reload = async key => { await page3.evaluate(k => localStorage.setItem('montagmorgen2-v1', localStorage.getItem(k)), key); const pg = await ctx3.newPage(); await pg.goto(url); await pg.waitForFunction(() => window.__G && window.__G.st);
    return pg.evaluate(() => { const G = window.__G; return { ph: G.st.ph, money: G.st.money, up: G.st.up }; }); };
  const oldSave = await reload('montagmorgen2-old');
  const newSave = await reload('montagmorgen2-new');
  await browser.close();
  server.close();

  const checks = [
    ['keine Fehler in der Konsole', errors.length === 0, errors.join(' | ')],
    ['Karte 80 x 52 Felder zu 32 px', r.map.join('x') === '80x52x32', r.map.join('x')],
    ['12390 Stueck zu Beginn', r.total === 12390 && r.leftStart === 12390, `${r.total}/${r.leftStart}`],
    ['step(30) spult die Zeit vor', r.tAfterStep >= 30, String(r.tAfterStep)],
    ['ohne Eingabe verschwindet nichts', r.leftAfterIdle === 12390, String(r.leftAfterIdle)],
    ['Sammelstation und Band lassen sich bauen', r.station && r.belts, `${r.station}/${r.belts}`],
    ['Bauen auf belegtem Feld und ausserhalb wird abgelehnt', r.blockedBuild, String(r.blockedBuild)],
    ['Sammler raeumen den Umkreis', r.collected > 0, String(r.collected)],
    ['Annahme zaehlt und bezahlt Rohware', r.soldRaw > 0 && r.earned > 0, `${r.soldRaw} Stueck, ${r.earned} Cent`],
    ['Abriss eines Bandfelds erstattet 50 Cent', r.refund === 50, String(r.refund)],
    ['Rueckgaengig nimmt einen Bau zurueck und erstattet', r.undoBuild, String(r.undoBuild)],
    ['Rueckgaengig stellt ein abgerissenes Gebaeude wieder her', r.undoDemolish, String(r.undoDemolish)],
    ['Versetzen verschiebt ein Gebaeude kostenlos', r.move, String(r.move)],
    ['Versetzen auf belegte Felder wird abgelehnt', r.moveBlocked, String(r.moveBlocked)],
    ['Rueckgaengig nimmt ein Versetzen zurueck', r.undoMove, String(r.undoMove)],
    ['Stauanzeige: ruhig, kein Ausgang, Stau, wieder ruhig', r.jamIdle && r.jamNoOut && r.jamBlocked && r.jamClear, [r.jamIdle, r.jamNoOut, r.jamBlocked, r.jamClear].join('/')],
    ['Bandplaner findet einen zusammenhaengenden Weg', r.planFound && r.planChain, `${r.planFound}/${r.planChain}, ${r.planLen} Felder`],
    ['Bandplaner schliesst rechtwinklig an Ausgang und Eingang an', r.planEnds, String(r.planEnds)],
    ['Bandplaner nimmt den Weg mit hoechstens zwei Knicken', r.planTurns <= 2, String(r.planTurns)],
    ['Vorschlag bauen kostet 50 Cent je Feld', r.planBuilt, String(r.planBuilt)],
    ['Ueber das geplante Band kommt Ware in der Presse an', r.planFlows, String(r.planFlows)],
    ['Ein Rueckgaengig nimmt die ganze geplante Strecke zurueck', r.planUndo, String(r.planUndo)],
    ['Bandplaner muendet nie frontal in ein Band', r.planFrontal, String(r.planFrontal)],
    ['Kreuzung laesst sich nur auf freiem Feld setzen und kostet 4 Euro', r.crossNeedsFree && r.crossBuilt, `${r.crossNeedsFree}/${r.crossBuilt}`],
    ['Kreuzung haelt beide Linien getrennt', r.crossKeepsLines && r.crossJam, `${r.crossKeepsLines}/${r.crossJam}`],
    ['Planer quert ein gerades Band mit einer Kreuzung', r.planCrosses, String(r.planCrosses)],
    ['Planer quert nicht, wenn Kreuzen ausgeschaltet ist', r.planNoCross, String(r.planNoCross)],
    ['Geplante Kreuzung ersetzt das Bandfeld, Ware laeuft auf beiden Linien', r.planCrossBuilt && r.planCrossFlows, `${r.planCrossBuilt}/${r.planCrossFlows}`],
    ['Rueckgaengig macht aus der Kreuzung wieder das Band', r.planCrossUndo, String(r.planCrossUndo)],
    ['Planer quert kein Band an einem Knick', r.planNoCorner, String(r.planNoCorner)],
    ['Volles Band rueckt dicht auf, unabhaengig von der Baureihenfolge', r.beltDense, r.beltDenseDetail],
    ['Seitlicher Zulauf und Hauptband wechseln sich ab (Reissverschluss)', r.zipper, r.zipperDetail],
    ['Zelt abbauen kostet 5 Euro und gibt Felder frei', r.tentRemoved, String(r.tentRemoved)],
    ['Ziehen mit dem Abriss baut kein Zelt ab', r.tentDragSafe, String(r.tentDragSafe)],
    ['Rueckgaengig stellt das Zelt wieder her und erstattet', r.tentUndo, String(r.tentUndo)],
    ['Ohne Geld bleibt das Zelt stehen', r.tentNoMoney, String(r.tentNoMoney)],
    ['clear() raeumt die ganze Wiese', r.leftAfterClear === 0, String(r.leftAfterClear)],
    ['Abriss legt getragene Ware in die Tuete', s1.hadLoaded && s1.toBag, `${s1.hadLoaded}/${s1.toBag}`],
    ['Rueckgaengig nach Abriss bringt ein leeres Band, nichts verdoppelt sich', s1.restoredEmpty, String(s1.restoredEmpty)],
    ['Testanlage traegt Ware auf Baendern, in Kleinteilen und in der Presse', onBelts >= 2 && inSmall >= 2 && s1.pdRunning, `${onBelts}/${inSmall}/${s1.pdRunning}`],
    ['Neuladen mitten im Betrieb verliert nichts', before === after, (() => { let i = 0; while (i < before.length && before[i] === after[i]) i++; return 'ab Zeichen ' + i + ': vorher ' + before.slice(Math.max(0, i - 60), i + 120) + ' | nachher ' + after.slice(Math.max(0, i - 60), i + 120); })()],
    ['Neues Spiel beginnt mit gesperrten Bauteilen', m3.startLocked, JSON.stringify(m3)],
    ['Ziel 1 schaltet Band und Sammelstation frei und meldet sich', m3.goal1, JSON.stringify(m3)],
    ['Ziel 2 schaltet Sortierer und Dosenpresse frei', m3.goal2, JSON.stringify(m3)],
    ['Nach allen Zielen ist alles frei, das letzte Ziel bleibt stehen', m3.goalAll, JSON.stringify(m3)],
    ['Zelt unterbricht die Sichtlinie, der Weg fuehrt ueber freie Felder', m3.losBlocked && m3.pathFree, `${m3.losBlocked}/${m3.pathFree}`],
    ['Spielfigur laeuft um das Zelt herum', m3.walkAround, m3.walkDetail],
    ['Station mit leerem Umkreis zeigt die Warnung, vorher nicht', m3.stationBuilt && m3.noWarnBusy && m3.warnEmpty, `${m3.stationBuilt}/${m3.noWarnBusy}/${m3.warnEmpty}`],
    ['Groesserer Umkreis gibt der Station wieder Arbeit', m3.rangeHelps, String(m3.rangeHelps)],
    ['Schnellere Baender tragen auf Stufe 2 das Doppelte, auf Stufe 4 das Dreifache', m3.beltFast, m3.beltDetail],
    ['Weitere Maschine derselben Art kostet das Anderthalbfache, Abriss erstattet den gezahlten Preis', m3.priceUp && m3.priceRefund, m3.priceDetail],
    ['Sortierer laesst sich direkt auf ein Band setzen, Band erstattet, Stueck bleibt', m3.swapOk && m3.swapNeedsBelt, `${m3.swapOk}/${m3.swapNeedsBelt}`],
    ['Ein Rueckgaengig macht daraus wieder das Band', m3.swapUndo, String(m3.swapUndo)],
    ['Kurve am Sortierer: Rest geht aufs Band daneben, mit geradem Ausgang geradeaus', m3.sortCurve && m3.sortStraight, `${m3.sortCurve}/${m3.sortStraight} ${m3.curveDetail}`],
    ['Sortierer uebereinander mit seitlichem Zulauf: kein Stueck strandet, Festsitzendes kommt frei', m3.sortSide && m3.sortRescue, `${m3.sortSide}/${m3.sortRescue} ${m3.sortDetail}`],
    ['Spiel endet bei leerer Wiese auch mit Resten in der Anlage und schreibt sie gut', m3.notDoneYet && m3.waitsBeforeEnd && m3.endsWithRest, `${m3.notDoneYet}/${m3.waitsBeforeEnd}/${m3.endDetail}`],
    ['Spielstand merkt sich das Ziel', m3.savedPhase && newSave.ph === 2, `${m3.savedPhase}/${newSave.ph}`],
    ['Alter Spielstand: alles frei, Ausbau der Annahme erstattet', oldSave.ph === 7 && oldSave.money === 2300 && oldSave.up.auto === undefined && oldSave.up.range === 0, JSON.stringify(oldSave)],
    ['Versionsnummer in index.html und konstanten.js stimmt ueberein', versionOk, String(version)],
  ];
  let failed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${ok ? '' : '  -> ' + detail}`);
    if (!ok) failed++;
  }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
