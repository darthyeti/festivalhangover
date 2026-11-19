# Festivalhangover (Arbeitstitel des Spiels: Montagmorgen)

Inkrementell-Spiel mit Fabrikbau: Am Montagmorgen nach einem Festival wird ein
Campingplatz voller Pfandgut leergeraeumt, erst von Hand, spaeter mit Baendern,
Sortierern und Pressen. Auftraggeber und Tester ist Till.

`BRIEFING.md` ist die Uebergabe aus der Prototyp-Phase und die Referenz fuer
Spielregeln, Zahlen, bekannte Schwaechen und Meilensteine (M0 bis M5). Vor
Aenderungen an Regeln oder Zahlen dort nachlesen. Die Regeln in Abschnitt 3 nur
bewusst und nach Freigabe aendern.

## Technik

- Vanilla JS, Canvas 2D, keine Frameworks, kein Build-Schritt. Auslieferung
  statisch ueber GitHub Pages: https://darthyeti.github.io/festivalhangover/
- `index.html` enthaelt nur Canvas und Stil und laedt `js/eingabe.js` als ES-Modul.
- Module in `js/`, in Abhaengigkeitsrichtung:
  - `konstanten.js`: Kartengroesse, Sorten `TY`, Gebaeudetypen `BT` mit Rezepten,
    Verbesserungen `UPS`. Importiert nichts.
  - `zustand.js`: Spielstand `st`, Bedienzustand `ui` (Werkzeug, Drehung, Auswahl),
    Kamera `cam`. Importiert nur `konstanten.js`.
  - `welt.js`: `genWorld()`, Weltdaten (`grid`, `belts`, `blds`, `items`, `cells`,
    `blocked`), raeumliche Suche `near()`.
  - `logik.js`: Spielregeln (Baender, Maschinen, Stationen, Spielfigur), `update(dt)`.
  - `bauen.js`: `build`, `setBelt`, `demolish`, `buyUp`, `save`, `load`.
  - `grafik.js`: Ebenen, Sprites, Zeichnen, Oberflaeche. Mit Abstand das groesste Modul.
  - `eingabe.js`: Einstiegspunkt mit Zeigerereignissen, Tastatur, Spielschleife und `__G`.
- Regeln fuer Module:
  - Importierte Variablen sind schreibgeschuetzt. `st` wird nur in `zustand.js`
    neu zugewiesen (`resetState()`), Weltdaten nur in `welt.js`. Veraenderlicher
    Zustand, den mehrere Module schreiben, gehoert als Feld in ein Objekt wie `ui`.
  - `konstanten.js` und `zustand.js` duerfen nichts aus den anderen Modulen
    importieren. Die uebrigen Module haengen zyklisch voneinander ab und duerfen
    einander deshalb nur innerhalb von Funktionen benutzen, nicht beim Laden.
  - `logik.js` importiert nichts aus `grafik.js`. Logik zeichnet nichts.
- Der Testzugang `window.__G` bleibt erhalten: `__G.step(sekunden)` spult ohne
  Bild vor, dazu `build`, `setBelt`, `demolish`, `buyUp`, `clear`, `setTool`, `setRot`,
  `undo`, `moveTo(gebaeude,x,y)` und `jam(gebaeude)`.
  `planBelt(ax,ay,bx,by)` liefert einen Bandvorschlag, `buildPlan(plan)` baut ihn.
  `__G.ui` gibt den Bedienzustand heraus, `crossOver(x,y)` setzt eine Kreuzung auf ein Band.
- Bandplaner (`bauen.js`): `planEnds()` bestimmt, wo ein Band an einem freien Feld,
  Band oder Gebaeude beginnen oder enden darf (an Gebaeuden nur rechtwinklig),
  `planBelt()` sucht den kuerzesten freien Weg mit den wenigsten Knicken. Die
  Eingabe haelt Start und Vorschlag in `ui.planA` und `ui.plan`.
- Kreuzung (`cross`, 1 Feld): je Achse ein Platz (`it`, `dr`, `wt`), ein Stueck faehrt in
  seiner Richtung geradeaus weiter. `crossOver(x,y)` ersetzt ein Bandfeld durch eine
  Kreuzung. Der Planer quert mit `ui.planCross` nur gerade Baender rechtwinklig
  (`straightBelt`, braucht aktuelles `topo()`), eine Kreuzung zaehlt wie sieben Bandfelder.
- `ui.menu` haelt das Spiel an: Die Schleife ruft `update()` dann nicht auf.
- Zelte abbauen: `welt.js` haelt die Fussabdruecke (`foot`, mit Verweis auf das
  gezeichnete Objekt) und berechnet `blocked` daraus neu (`setTentGone`). Abgebaute
  Zelte tragen `gone` und stehen im Spielstand als Indexliste `tents`. Die Bodenebene
  wird nur im Rechteck um das Zelt neu aufgebaut (`ui.groundDirty`), ein voller
  Neuaufbau dauert rund eine halbe Sekunde.
- Rueckgaengig (`bauen.js`): Jede Aenderung am Aufbau meldet sich ueber `rec()`.
  Eine Zeigergeste klammert ihre Aenderungen mit `stepBegin()` und `stepEnd()` zu
  einem Schritt. Neue Bauaktionen muessen `rec()` aufrufen, sonst fehlen sie im Stapel.
  Der Stapel liegt in `ui.undo`, fasst 40 Schritte und wird nicht gespeichert.
- Stauanzeige: `jam(b)` in `logik.js` liefert den Grund als Text oder einen leeren
  String und aendert nichts am Zustand. Die Grafik zeichnet daraus das Warnzeichen.
- Die Welt ist deterministisch (feste Zufallssamen). Spielstand lokal in
  `localStorage`, Schluessel `montagmorgen2-v1`.
- Alle Grafiken entstehen per Code, es gibt keine Bilddateien.
- Texte im Spiel auf Deutsch, keine Gedankenstriche als Satzzeichen.
- Tablet und Desktop gleichwertig, Zielgroesse ab 1180 x 820.
- Der Code ist sehr dicht geschrieben (lange Zeilen, kurze Namen). Beim Aendern
  den Stil der Umgebung beibehalten, nicht nebenbei umformatieren.

## Befehle

- Starten: ES-Module laden nicht per Doppelklick von der Festplatte. Lokal
  `python3 -m http.server 8000` im Repo-Wurzelverzeichnis starten und
  `http://localhost:8000/` oeffnen, oder die Pages-Adresse nutzen.
- Rauchtest: `node tests/smoke.js` (Playwright mit Chromium, startet selbst einen
  Server). Vor jedem Commit an Spielcode ausfuehren.
- Bei Umbauten ohne gewollte Verhaltensaenderung zusaetzlich alt gegen neu
  vergleichen: `Math.random` und `requestAnimationFrame` per Init-Skript
  festlegen, dieselben Eingaben abspielen, Zustand und Canvas-Bild vergleichen.

## Git

- `main` ist geschuetzt: kein direkter Push, Aenderungen nur per Pull Request,
  gemergt wird per Squash.
- Till hat am 18.11.2026 dauerhaft freigegeben, dass der Lead Dev Pull Requests
  selbst anlegt und per Squash mergt. Voraussetzung: Rauchtest gruen und der Stand
  ist geprueft. Entscheidungen mit Tragweite laufen weiterhin vorher ueber das Board.
- Nach dem Merge loescht GitHub den Arbeitsbranch. Fuer die naechste Aufgabe den
  Branch frisch von `origin/main` aufsetzen.

## Rollen und Modelle

- Die Hauptsession ist Lead Dev und laeuft auf Fable 5.2.
- Subagenten laufen ausschliesslich auf Sonnet. Das ist in `.claude/settings.json`
  ueber `CLAUDE_CODE_SUBAGENT_MODEL` gesetzt. Zusaetzlich bei jedem Agent-Aufruf
  `model: "sonnet"` angeben.
- Keine Agenten vom Typ `fork` starten: ein Fork erbt immer das Modell der Hauptsession.

## Kontext

- Auto-Compact soll bei etwa 60 % Fuellgrad greifen (`autoCompactWindow` in
  `.claude/settings.json`). Wichtige Zwischenstaende deshalb im Entwickler-Board
  oder im Repo festhalten, nicht nur im Chat.

## Entwickler-Board

- Das Board ist ein Artifact auf claude.ai. Dort werden Entscheidungen gepitcht
  und Tests bereitgestellt. Link: siehe unten.
- Entscheidungen mit Tragweite (Architektur, Stack, Scope) erst im Board pitchen
  und die Freigabe abwarten, bevor sie umgesetzt werden.
- Zu jeder Entscheidung gehoeren: Optionen, Empfehlung, Risiken.

Board: https://claude.ai/artifact/H2FAjzrJ3EDxAqYzoPM1c5

Die Quelle der Board-Seite liegt in `board/index.html`. Inhalte (Status, Entscheidungen,
Tests) stehen in der Datenbank des Artifacts, nicht im HTML: Collections `decisions`
(IDs E-001 ...), `tests` (IDs T-001 ...) und das Dokument `meta/status`.

## Kommunikation

- Sprache: Deutsch.
- Keine Em-Dashes.
- Unkluge Entscheidungen nicht bestaetigen, sondern begruendet widersprechen.
- Recherche nur mit serioesen Quellen.
