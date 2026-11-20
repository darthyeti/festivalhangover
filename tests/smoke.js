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
    ['Versionsnummer in index.html und konstanten.js stimmt ueberein', versionOk, String(version)],
  ];
  let failed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${ok ? '' : '  -> ' + detail}`);
    if (!ok) failed++;
  }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
