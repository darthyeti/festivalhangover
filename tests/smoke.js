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
    ['Zelt abbauen kostet 5 Euro und gibt Felder frei', r.tentRemoved, String(r.tentRemoved)],
    ['Ziehen mit dem Abriss baut kein Zelt ab', r.tentDragSafe, String(r.tentDragSafe)],
    ['Rueckgaengig stellt das Zelt wieder her und erstattet', r.tentUndo, String(r.tentUndo)],
    ['Ohne Geld bleibt das Zelt stehen', r.tentNoMoney, String(r.tentNoMoney)],
    ['clear() raeumt die ganze Wiese', r.leftAfterClear === 0, String(r.leftAfterClear)],
  ];
  let failed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`${ok ? 'OK  ' : 'FEHL'} ${name}${ok ? '' : '  -> ' + detail}`);
    if (!ok) failed++;
  }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
