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
  - `ton.js`: Geraeusche und Ambiente per Web Audio, keine Dateien. Importiert nur `konstanten.js` und `zustand.js`.
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
  `undo`, `moveTo(gebaeude,x,y)`, `jam(gebaeude)`, `isOpen(k)`, `los` und `findPath`.
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
- Die Welt ist deterministisch (`WORLD_SEED`). Spielstand lokal in `localStorage`,
  Schluessel `montagmorgen2-v1` (der Name bleibt, sonst gingen Staende verloren).
  Format Version 2 (`v:2`): enthaelt auch Ware auf Baendern, in Sortierern,
  Verteilern, Kreuzungen, Maschinen und in der Annahme. Version 1 laedt weiterhin.
  Neue Felder so ergaenzen, dass aeltere Staende ohne sie laden.
- Beim Verlassen der Seite speichert das Spiel. Tests, die neu laden, brauchen
  deshalb einen frischen Browser-Kontext oder muessen das beruecksichtigen.
- Baender (`logik.js`): `updBelts` arbeitet jede Kette vom Ende her ab (`beltOrder`),
  neu berechnet bei `ui.orderDirty`. Wer `ui.topoDirty` setzt, setzt auch `ui.orderDirty`.
- Einmuendung im Reissverschluss (`rival` in `logik.js`): Ein Bandfeld nimmt kein zweites
  Stueck aus derselben Richtung, solange ein anderes Band fertig an ihm wartet.
- Ziele und Freischaltungen (M3): `GOALS` und `OPEN` in `konstanten.js`. `st.ph` ist das laufende
  Ziel, `goals()` in `logik.js` schaltet weiter. `isOpen(k)` in `zustand.js` sagt, ob ein Bauteil
  frei ist. Gesperrt wird nur in der Bedienung (Leiste, Tasten, Planer), nicht in `build()`,
  damit `__G` und Tests frei bauen koennen. Spielstaende ohne `ph` laden mit allem frei.
- Verbesserungen wirken ueber `stR()` (Umkreis der Stationen) und `bspd()` (Bandtempo) aus
  `zustand.js`. Die Annahme zaehlt fest `AUTO_RATE`, ihre fruehere Verbesserung wird beim
  Laden alter Staende erstattet. Sie soll der Engpass bleiben, der zu Maschinen fuehrt.
- Baender geben den Ueberschuss an Fortschritt ans naechste Feld weiter. So haengt der
  Durchsatz nicht an der Bildrate.
- Wege um Zelte (E-004): `los()` und `findPath()` in `welt.js`, `wayTo()` in `logik.js`.
  Figuren gehen geradeaus, solange kein Zelt im Weg ist, sonst ueber Feldmitten aussen herum.
  Maschinen und Baender sind kein Hindernis. Der Weg haengt als `path` an der Figur.
- Meldungen ueber der Karte: `toast(text)` aus `zustand.js`, laeuft auch im Menue weiter.
- Spielende (`finish()` in `logik.js`): Wiese, Tuete, Stationen und Annahme leer und seit drei
  Sekunden keine Bewegung (`ui.busyT`, gesetzt bei Bandtransport, laufender Maschine, Verkauf).
  Reste in der Anlage werden zu ihrem Wert gutgeschrieben und stehen in `st.rest`.
- Menge und Wertung (M4): `N_ITEMS` in `konstanten.js`, Leerkaesten anteilig. Zum Ausprobieren
  `?items=16000` an die Adresse haengen. Der Spielstand merkt sich die Menge (`n`) und laedt
  nicht, wenn sie nicht zur Wiese passt. `MEDALS` haelt die Zeitgrenzen der Wertung.
- Preise: `price(k)` in `bauen.js`. Stationen werden je Stueck 12 % teurer, Maschinen je weiterer
  derselben Art um den Faktor `MORE`. Der Abriss erstattet immer den gezahlten Preis (`b.paid`).
- Doppelband (E-015): `widen(x,y)` in `bauen.js` gibt einem Bandfeld eine zweite Spur, sie haengt als `b`
  (`item`, `prog`, `from`) am Feld. Gleiches Tempo, doppelte Menge. `tryPush` nimmt die freie Spur (`pref` bevorzugt
  die zweite, damit Ware ihre Spur haelt), `mvLane` in `logik.js` bewegt jede Spur einzeln. Kostet `WIDE_COST` Aufpreis,
  der Abriss erstattet beides. Im Spielstand steht die zweite Spur als siebtes Element des Bandeintrags.
  Wer Bandware zaehlt oder leert, muss `t.b` mitnehmen. Werkzeug `wide` wirkt nur auf vorhandene Baender.
- Weiterreichen zwischen Kleinteilen (`pushOut` in `logik.js`): Ein Sortierer gibt an einen benachbarten
  Sortierer oder Verteiler nur geradeaus weiter, Verteiler und Sortierer in eine Kreuzung ebenfalls nur geradeaus. Sitzt ein Stueck laenger als zwei Sekunden fest, ist jeder Nachbar recht.
- Ueberlauf am Sortierer (seit Version 31): Ist der Auswurf voll, laeuft die eigene Sorte nur weiter, wenn `drains(b)` in `logik.js` auf dem Weiterweg
  einen Abnehmer findet (Annahme oder Maschine mit passendem Rezept). Sonst wartet sie. Das Ergebnis liegt in `drainC` und gilt, bis `beltOrder()` neu laeuft.
  Grund: Tills Zeltkette stand dauerhaft, weil uebergelaufene Planen in einem Sortierer ohne Weiterweg steckten.
- Kurve am Verteiler oder Sortierer: Hat er keinen geraden Ausgang, gibt er auch auf ein Band direkt daneben ab,
  das quer wegfuehrt (`sideOuts`, `straightOut` in `logik.js`). `topo()` zeichnet dem Band dafuer einen Zulauf.
- Sorten am Sortierer: `sorts()` in `zustand.js`. Rohware immer, mit freier Dosenpresse auch Dosenballen, mit freier PET-Presse auch PET-Ballen,
  damit sich Ballen von Pressen draussen aus dem gemischten Band holen lassen.
- `beltSwap(k,x,y)` setzt Verteiler oder Sortierer direkt auf ein Bandfeld, wie `crossOver`.
- Zelte als Sperrmuell (E-019): Der Abbautrupp (`ab`) ist eine Station mit anderem Ziel, `isSt(b)` in `zustand.js` gilt fuer beide.
  Seine zwei Arbeiter (`h.ab`) suchen mit `nearTent()` das naechste Zelt auf der ganzen Wiese (`abR()` ist seit Version 28 unbegrenzt, von Till nach T-014 so gewuenscht), bauen es in `TENT_TIME` ab (`setTentGone`)
  und bringen `TENT_LOAD` als Ladung zurueck. Sorten 8 (Planen) und 9 (Gestaenge) sind Rohware (`JUNK`), 10 und 11 ihre Ballen
  aus `pl` und `sc`. `st.tl` und `st.tt` (Zelte uebrig, gesamt) setzt `goals()` in jedem Schritt. Die Partie endet erst bei `st.tl===0`.
  Die Sorten sind nicht mehr fortlaufend: `sorts()` liefert die waehlbaren, `nextSort(f)` die naechste. Arrays ueber Sorten haben zwoelf Plaetze.
  Der Testspieler kennt die Kette nicht und baut Zelte von Hand ab, sobald Geld uebrig ist.
- Boden nach Zeltabbau: `buildGround(R)` wuerfelt ausserhalb des Rechtecks nur und zeichnet nicht (`inR`), `grassNear` merkt sich die Halme am Weg.
  Die Zufallsfolge muss dabei gleich bleiben, sonst passt der Ausschnitt nicht zum Rest.
- Abriss verliert keine Ware: `unloadTo()` legt alles, was ein Bauteil traegt, in die
  Tuete der Spielfigur.
- Auslieferung ohne gemischte Dateien: `VERSION` in `konstanten.js` und die
  Importtabelle in `index.html` tragen dieselbe Nummer (`?v=N` an jedem Modul).
  Bei jedem Pull Request mit Spielcode beide um eins erhoehen. Der Rauchtest prueft,
  dass sie zusammenpassen und kein Modul fehlt. Das Menue zeigt die Version an.
- Tasten am PC: `HOT` in `konstanten.js` ordnet 1 bis 0, Q, E, T und X den Werkzeugen zu, `HOTKEY` ist die Umkehrung fuer die Beschriftung der Leiste.
  R dreht, Z macht rueckgaengig, Esc waehlt Laufen, W, A, S, D und die Pfeile bewegen die Kamera.
- Ton (E-020): `sfx(name,x,y,k)` aus `ton.js` spielt ein Geraeusch aus `FX`, mit `name==='sel'` den Klang der Bauteilart `k` aus `SEL`.
  Mit Ort klingt es nur im Bild und von der passenden Seite. `GAP` begrenzt, wie oft dasselbe Geraeusch je Sekunde kommt.
  Der Tonkontext entsteht erst beim ersten Tippen (`wake()`), vorher und im Testspieler ist alles stumm. `amb()` laeuft in der Spielschleife
  (einzelne Windboeen und Voegel, dazwischen Stille. Nichts laeuft durchgehend: Till fand erst das Brummen, dann das Dauerrauschen stoerend). Lautstaerken stehen im Menue und in `localStorage` unter `montagmorgen2-ton`.
  Der Lead Dev kann nicht hoeren: Der Rauchtest rechnet jedes Geraeusch per `OfflineAudioContext` und prueft nur Pegel. Wie es klingt, beurteilt Till.
  Kein `DynamicsCompressor` verwenden, er macht in Chromium kurze Geraeusche um den Faktor vier leiser.
- Alle Grafiken entstehen per Code, es gibt keine Bilddateien.
- Optik: Bauteile haben einen Koerper (Deckflaeche nach oben versetzt, dunklere Vorderwand, Schlagschatten
  nach rechts unten). Maschinen unterscheiden sich durch Farbe und Sichtfenster, nicht durch Aufbauten
  (von Till am 20.11.2026 so gewuenscht).
- Grafikdurchgang (E-020, Version 34): `drawFalls()` laesst abgebaute Zelte zusammenfallen (Eintraege in `ui.falls` aus `setTentGone`).
  `drawLight()` legt in den ersten 22 Minuten kuehles Morgenlicht mit warmer Sonne von links ueber die Karte, als ein einziger Verlauf.
  Saubere Wiese: `fresh` haelt je Feld 0 bis 1 (Feld und Nachbarn leer, kein Weg, kein Hof), `updFresh()` laeuft alle 0,6 Sekunden mit der Minikarte.
  `freshL` ist ein Bild mit einem Pixel je Feld und wird weich hochskaliert ueber den Boden gelegt. Blumen malt `paintFlowers()` einmalig in die Bodenebene,
  `flP` merkt sich die bemalten Felder, `buildGround` loescht die Merker. Blumen je Bild einzeln zu zeichnen war gemessen zu teuer.
- Letzte Stuecke: Liegen hoechstens `LAST_N` Stueck auf der Wiese, markiert `lastItems()` in `grafik.js` sie
  blinkend auf Karte und Minikarte.
- Kamera: `clampCam()` laesst oben und unten Luft ueber den Wiesenrand hinaus, damit Zielanzeige,
  Minikarte und Planleiste keinen Teil der Wiese dauerhaft verdecken.
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
- Testspieler: `node tests/bot.js [--stations 2] [--belt 0] [--range 2] [--items N] [--double] [--minutes 240]`
  spielt eine ganze Partie automatisch (rund eine Minute Rechenzeit) und gibt Zeiten je Ziel,
  Verlauf und Kaeufe aus. Werkzeug fuer das Balancing. Er baut eine feste Anlage, sein Bauplan
  steht in `play()`. Seine Zeiten sind eine Untergrenze, ein Mensch zoegert und plant.
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
Erledigte Eintraege zeigt das Board im Reiter Archiv, die Reiter Entscheidungen und Tests nur Offenes.

## Kommunikation

- Sprache: Deutsch.
- Keine Em-Dashes.
- Unkluge Entscheidungen nicht bestaetigen, sondern begruendet widersprechen.
- Recherche nur mit serioesen Quellen.
