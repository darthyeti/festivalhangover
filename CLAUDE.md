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
  statisch ueber GitHub Pages.
- Das ganze Spiel liegt derzeit in `index.html` (rund 530 dichte Zeilen, sieben
  kommentierte Abschnitte: Konstanten, Zustand, Welt, Logik, Bauen, Grafik, Eingabe).
- Logik und Grafik sind getrennt und bleiben es. Der Testzugang `window.__G`
  bleibt erhalten: `__G.step(sekunden)` spult ohne Bild vor, dazu `build`,
  `setBelt`, `demolish`, `buyUp`, `clear`.
- Die Welt ist deterministisch (feste Zufallssamen). Spielstand lokal in
  `localStorage`, Schluessel `montagmorgen2-v1`.
- Alle Grafiken entstehen per Code, es gibt keine Bilddateien.
- Texte im Spiel auf Deutsch, keine Gedankenstriche als Satzzeichen.
- Tablet und Desktop gleichwertig, Zielgroesse ab 1180 x 820.

## Befehle

- Starten: `index.html` im Browser oeffnen, kein Server noetig.
- Rauchtest: `node tests/smoke.js` (Playwright mit Chromium). Vor jedem Commit
  an Spielcode ausfuehren.

## Git

- `main` ist geschuetzt: kein direkter Push, Aenderungen nur per Pull Request,
  gemergt wird per Squash.

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
