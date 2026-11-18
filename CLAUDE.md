# Festivalhangover

Stand: Projektstart, der Prototyp wird extern gebaut und kommt noch ins Repo.
Diese Datei beschreibt die Arbeitsweise, nicht den Code. Sobald der Prototyp da ist,
Tech-Stack, Build- und Testbefehle hier ergaenzen.

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
