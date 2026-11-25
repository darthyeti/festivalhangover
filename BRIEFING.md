# Montagmorgen: Briefing für die Übergabe an die Entwicklung

Stand: 18.11.2026. Verfasst im Chat als Übergabe an den Lead-Dev in Claude Code.
Arbeitstitel: **Montagmorgen**. Grundlage ist der spielbare Prototyp `index.html` (im Chat „Montagmorgen 2").

## 1. Worum es geht

Ein Inkrementell-Spiel mit Fabrikbau. Montagmorgen nach einem Festival: Ein riesiger Campingplatz ist übersät mit Pfandgut. Der Spieler fängt allein mit einer Tüte an und endet mit einer Anlage aus Förderbändern, Sortierern und Pressen, die sich über die ganze Wiese zieht. Am Ende steht eine leere, grüne Wiese.

Vorbilder für das Gefühl: Moon Sweepers und Find The Needle (winzig anfangen, absurd skalieren, Fabrik bauen). Unser eigener Dreh: 2D-Draufsicht, deutsches Pfandsystem, kurze abgeschlossene Partie statt Endlosspiel.

**Was Till daran wichtig ist**

- Automatisierung ist die Belohnung der späten Phase, nicht nur „+1 pro Sekunde".
- Die Anlage steht auf der Wiese selbst. Gebaut wird nur auf gesäubertem Boden.
- Verhältnisse zwischen Maschinen soll der Spieler austüfteln. Lehre aus dem ersten Prototyp: Versteckte Zahlen waren zu undurchsichtig. Rezepte und Zeiten sind deshalb sichtbar, das Rätsel liegt im Rechnen und im Layout.
- Ansprechende Grafik mit Detail und Animation, von Anfang an.
- Tablet auf der Couch ist ein Haupteinsatz, getestet wird am Desktop.

## 2. Was der Prototyp heute kann

Eine einzelne Datei, Vanilla JS, Canvas 2D, keine Abhängigkeiten, kein Build.

- Karte 80 x 52 Felder zu je 32 px, Kamera mit Verschieben, Zoom und Übersichtskarte
- 12.000 Stück Pfandgut (Dosen, PET, Glas) plus 390 Leerkästen (seit Version 11, vorher 8.000 und 260, Entscheidung E-013), verteilt um rund 100 Zeltlager und entlang der Wege
- Spielfigur: läuft zum Zeigerziel, sammelt im Umkreis, begrenzte Tüte, gibt an Annahme oder Sammelstation ab
- Bauen im Raster: Band (ziehen), Verteiler, Sortierer, Sammelstation, vier Maschinen, Abriss mit voller Erstattung
- Leergutannahme als fester Verkaufspunkt mit vier Verbesserungen
- Speichern in `localStorage`, automatisch alle 15 Sekunden und beim Verlassen der Seite
- Endbildschirm, wenn alles eingesammelt und verarbeitet ist

## 3. Spielregeln, wie sie im Code stehen

Diese Regeln sind der Kern. Bitte nur bewusst ändern.

**Bauen**

- Ein Feld ist bebaubar, wenn dort kein Stück liegt, kein Zelt steht und nichts gebaut ist.
- Zelte und Pavillons sind Hindernisse. Das Abriss-Werkzeug baut sie für 5 € je Stück ab, ohne Erstattung und ohne Material (Entscheidung E-005, Preis ist ein Startwert).
- Zelte als Sperrmüll (seit Version 26, Entscheidung E-019, Stufe 1): Am Ende müssen alle 225 Zelte und Pavillons weg, sonst endet die Partie nicht. Der Abbautrupp (300 €, jeder weitere 20 % teurer, frei ab Ziel 6) hat zwei Arbeiter und keinen Umkreis: Sie laufen über die ganze Wiese, nahe Zelte zuerst (seit Version 28, vorher anderthalbfacher Umkreis einer Station). Ein Abbau dauert 6 Sekunden, ein Zelt gibt 3 Planen und 2 Gestänge, ein Pavillon 2 Planen und 4 Gestänge. Planenpresse (6 Planen, 5 s, Ballen 4 €) und Schrottpresse (8 Gestänge, 6 s, Bündel 6 €) kosten je 400 €. Rohe Planen (5 Cent) und Gestänge (10 Cent) nimmt die Annahme in die Warteschlange, sie bringen fast nichts und kosten Zeit. Alle Zahlen sind Startwerte.
- Verteiler und Sortierer lassen sich direkt auf ein Bandfeld setzen. Das Band wird dabei erstattet, ein Stück darauf bleibt erhalten.
- Abriss erstattet den gezahlten Preis vollständig. Das soll Ausprobieren billig machen.
- Was ein abgerissenes Bauteil gerade trägt, landet in der Tüte der Spielfigur, auch über ihr Fassungsvermögen hinaus (seit M2).

**Bänder**

- Ein Feld trägt höchstens ein Stück. Tempo 3 Felder pro Sekunde, also bis 3 Stück pro Sekunde. Die Verbesserung „Schnellere Bänder“ hebt das in zwei Stufen auf bis zu 6 (seit Version 18, Entscheidung E-015).
- Ein Band gibt an das Feld in seiner Richtung ab. Seitliches Einmünden in ein anderes Band ist erlaubt, frontal nicht. Warten an einer Einmündung zwei Bänder, kommen sie abwechselnd dran (Reißverschluss).

**Ein- und Ausgänge**

- Ein Band, das in ein Gebäude hineinzeigt, ist ein Eingang.
- Ein angrenzendes Band, das vom Gebäude wegzeigt, ist ein Ausgang. Bei mehreren Ausgängen wird reihum verteilt.
- Maschinen nehmen nur Sorten aus ihrem Rezept. Kommt etwas anderes an, staut sich das Band. Das ist Absicht.

**Sortierer und Verteiler (je 1 Feld)**

- Verteiler: nimmt von jeder Seite an und verteilt reihum auf alle wegführenden Bänder.
- Sortierer: wirft seine eingestellte Sorte in Pfeilrichtung aus, alles andere geht über die übrigen Ausgänge weiter.
- Überlauf: Ist der Auswurf voll, läuft auch die eigene Sorte weiter, aber nur, wenn der Weiterweg irgendwo ankommt, wo sie abgenommen wird (Annahme oder passende Maschine). Sonst wartet sie, bis der Auswurf frei ist (seit Version 31, mit Till am 24.11.2026 abgestimmt).
- Überlauf: Ist der Auswurf länger als 0,5 Sekunden blockiert, läuft auch die eigene Sorte weiter. Ohne diese Regel blockieren überschüssige Leerkästen jede Linie.
- Sortierer und Verteiler dürfen direkt aneinander stehen und reichen dann ohne Band weiter, aber nie zurück in die Richtung, aus der das Stück kam.

**Kreuzung (1 Feld, Entscheidung E-007)**

- Zwei Bänder queren sich, ohne sich zu mischen. Jede Achse hat einen Platz, ein Stück fährt geradeaus weiter und biegt nie ab.
- Preis 4 €. Auf ein vorhandenes Bandfeld gesetzt, ersetzt sie es (das Band wird erstattet).
- Der Bandplaner setzt Kreuzungen selbst, aber nur auf geraden Bandfeldern ohne seitlichen Zulauf und nur rechtwinklig. Der Schalter "Kreuzen" stellt das ab.

**Sammelstation (2 x 2)**

- Drei Sammler (mit Verbesserung bis acht) räumen einen Umkreis von 8 Feldern (mit Verbesserung bis 17).
- Lager 30 Stück, Abgabe so schnell, wie ein Band trägt.
- Ist der Umkreis leer, zeigt sie das Warnzeichen. Das Infofeld nennt, wie viel im Umkreis noch liegt. Der Spieler setzt sie um.
- Sammler und Spielfigur gehen um Zelte herum, durch Maschinen und über Bänder laufen sie weiter (E-004).
- Die Spielfigur kann ihre Tüte auch an einer Station abgeben.

**Annahme (2 x 3, fest am linken Rand)**

- Rohware wird mit 1,5 Stück pro Sekunde gezählt, Warteschlange 40. Nicht verbesserbar (seit M3).
- Verarbeitete Ware (Ballen, volle Kästen, Paletten) wird sofort bezahlt.
- Der Engpass der Annahme ist der Grund, überhaupt Maschinen zu bauen.

**Spielende (seit Version 10)**

- Das Spiel endet, wenn die Wiese leer ist, Tüte, Stationen und Annahme leer sind und sich drei Sekunden lang nichts mehr bewegt.
- Was dann noch auf Bändern oder in Maschinen liegt, wird zu seinem Wert gutgeschrieben. Der Endbildschirm nennt die Reste.

**Ziele und Freischaltungen (seit M3)**

- Acht Ziele nacheinander. Jedes erreichte Ziel schaltet Bauteile frei:
  1. 6 € von Hand einnehmen: Band, Sammelstation
  2. 40 Stück per Band anliefern: Sortierer, Dosenpresse (dazu Verbesserungen Sammler und Umkreis)
  3. 3 Dosenballen verkaufen: PET-Presse, Verteiler, Kreuzung (dazu Verbesserung Bandtempo)
  4. 3 PET-Ballen verkaufen: Kistenpacker
  5. 3 volle Kästen verkaufen: Palettierer
  6. 1 Palette verkaufen
  7. 10 Paletten verkaufen
  8. Wiese besenrein: Pfand und Zelte, mit Zeitwertung: Gold bis 38 Minuten, Silber bis 45, Bronze bis 60 (seit Version 25, Entscheidung E-017). Die Zeiten stammen aus Partien ohne Zeltkette und müssen nach den ersten Partien mit Version 26 neu eingestellt werden.
- Laufen, Abriss und Drehen sind von Anfang an da.

## 4. Zahlen

**Sorten und Werte**

| Sorte | Wert | Herkunft |
|---|---|---|
| Dose | 0,25 € | Wiese (45 %) |
| PET-Flasche | 0,25 € | Wiese (30 %) |
| Glasflasche | 0,08 € | Wiese (25 %) |
| Leerkasten | 1,50 € | Wiese (390 Stück) |
| Dosenballen | 4,50 € | Dosenpresse |
| PET-Ballen | 3,00 € | PET-Presse |
| Voller Kasten | 4,65 € | Kistenpacker |
| Palette | 67,50 € | Palettierer |

Verarbeitete Ware ist das 1,5-Fache ihrer Zutaten wert.

**Rezepte**

| Maschine | Zutaten | Ergebnis | Dauer | Preis |
|---|---|---|---|---|
| Dosenpresse | 12 Dosen | 1 Dosenballen | 6 s | 40 € |
| PET-Presse | 8 PET | 1 PET-Ballen | 8 s | 40 € |
| Kistenpacker | 20 Glas + 1 Leerkasten | 1 voller Kasten | 10 s | 60 € |
| Palettierer | 8 Dosenballen + 3 PET-Ballen | 1 Palette | 24 s | 150 € |

Gewolltes Verhältnis: 2 Dosenpressen und 1 PET-Presse lasten genau 1 Palettierer aus.

**Übrige Preise**

Band 0,50 € je Feld, Verteiler 3 €, Sortierer 5 €, Sammelstation 15 € (jede weitere 12 % teurer).

**Verbesserungen**

Größere Tüte (25, je Stufe +10), Laufschuhe (110 px/s, je Stufe +18), mehr Sammler (je Stufe +1 pro Station, bis 8), größerer Umkreis (8, 11, 14, 17 Felder), schnellere Bänder (3 bis 6 Stück pro Sekunde in zwei Stufen zu 60 und 150 €).

Seit Version 18 (Entscheidung E-015): Jede weitere Maschine derselben Art kostet 20 % mehr als die vorige (Dosenpresse 40, 48, 57,60, 69,10 €). Vorher war es das 1,5-Fache (E-014), das hat Pressen vor Ort bei den Stationen bestraft. Bandstufen über der zweiten werden beim Laden erstattet. Seit Version 19 gibt es das Doppelband: Ein vorhandenes Bandfeld bekommt für 1 € Aufpreis eine zweite Spur und trägt bei gleichem Tempo doppelt so viel (frei ab Ziel 3). Sortierer, Verteiler und Kreuzungen bleiben einspurig. Der Abriss erstattet weiter den gezahlten Preis.

**Messwerte (20.11.2026, per `__G.step`)**

- Eine Sammelstation liefert in dichtem Gebiet rund 3 Stück pro Sekunde, also ein volles Band, und hat ihren Umkreis von 8 Feldern (rund 450 Stück) nach knapp 3 Minuten leer.
- Mehr Sammler bringen bei Bandtempo 3 nichts, die Abgabe ist durch das Band begrenzt.
- Ein volles Band mit gemischter Ware (3 Stück pro Sekunde) wird von je einer Dosenpresse, PET-Presse und einem Kistenpacker vollständig verarbeitet. Übrig bleiben nur überzählige Leerkästen. Die PET-Presse ist dabei zu 87 % ausgelastet und wird als erste zu klein.

Alle Zahlen sind geschätzt und nicht ausbalanciert.

## 5. Aufbau des Codes

Die Datei ist in sieben kommentierte Abschnitte gegliedert:

1. **Konstanten:** Kartengröße, Sorten `TY`, Gebäudetypen `BT` mit Rezepten, Verbesserungen `UPS`
2. **Zustand:** `st` (Geld, Spielfigur, Zähler), `grid` (Feld auf Band oder Gebäude), `belts`, `blds`, `items`, `cells` (Stücke je Feld), `blocked` (Zelte)
3. **Welt:** `genWorld()` erzeugt Lager, Hindernisse und Stücke aus festen Zufallssamen, dazu die räumliche Suche `near()`
4. **Logik:** `tryPush`, `accept`, `pushOut`, `updBelts`, `updBld`, `updStation`, `updHelper`, `updPlayer`, `update`
5. **Bauen:** `build`, `setBelt`, `demolish`, `topo` (Zuläufe je Band für die Darstellung), `save`, `load`
6. **Grafik:** vorgerenderte Ebenen für Boden und Stücke, Sprites, Zeichenfunktionen je Gebäude, Oberfläche
7. **Eingabe und Schleife:** Zeigerereignisse, Zweifingergeste, Tastatur, `frame`

**Wichtige Eigenschaften**

- Die Logik zeichnet nichts. `window.__G.step(sekunden)` spult ohne Bild vor, `__G.build`, `__G.setBelt`, `__G.clear` erlauben Tests per Skript. So wurde der Prototyp im Headless-Browser geprüft.
- Die Welt ist deterministisch. Der Spielstand speichert nur, welche Stücke weg sind, als Bitfeld.
- Die Oberfläche arbeitet in einem logischen Raster von 1280 x 800 und wird als Ganzes skaliert.
- Boden und Stücke liegen auf zwei großen Offscreen-Canvas (Faktor 1,25). Beim Aufsammeln wird nur das betroffene Rechteck neu gezeichnet.
- Alle Grafiken entstehen per Code, es gibt keine Bilddateien.

## 6. Bekannte Schwächen

Geordnet nach Dringlichkeit für eine Alpha.

1. **Zweifingerbedienung ungetestet.** Verschieben und Zoomen per Touch wurde nie auf einem echten Tablet geprüft.
2. **Stücke auf Bändern werden nicht gespeichert.** Auch Lager der Sammler-Bollerwagen gehen beim Neuladen verloren.
3. **Bänder haben Lücken unter Last.** Die Felder werden in Bau-Reihenfolge abgearbeitet. Ein volles Band rückt deshalb nicht dicht auf. Sauber wäre eine Abarbeitung vom Ende der Kette her.
4. **Figuren laufen durch alles hindurch.** Weder Spielfigur noch Sammler weichen Zelten oder Gebäuden aus.
5. **Leistung auf Tablets unbekannt.** Die zwei Offscreen-Ebenen sind zusammen rund 13 Megapixel groß.
6. **Kein Rückgängig, kein Verschieben** von Gebäuden, kein Kopieren von Aufbauten.
7. **Keine Freischaltungen.** Alle Gebäude sind von Anfang an kaufbar, es gibt keine Führung durch die Phasen außer fünf Hinweistexten.
8. **Balancing ist geraten.** Partielänge, Preise und Sammlertempo sind ungeprüft.
9. **Kein Ton.**
10. **Leerkästen sind immer im Überschuss** (Verhältnis auf der Wiese etwa 1 zu 7, gebraucht wird 1 zu 20). Das ist derzeit nur durch die Überlaufregel entschärft.

## 7. Leitplanken

- Vanilla JS, keine Frameworks, kein Build-Schritt, statische Auslieferung über GitHub Pages
- Canvas 2D beibehalten
- Die Trennung von Logik und Grafik erhalten, ebenso den Testzugang `__G`
- Texte auf Deutsch, im Spiel keine Gedankenstriche als Satzzeichen
- Tablet und Desktop gleichwertig behandeln, Zielgrößen ab 1180 x 820
- Spielstand bleibt lokal im Browser

**Empfehlung zur Struktur:** Die Datei hat rund 530 sehr dichte Zeilen und wird als Einzeldatei schnell unhandlich. Sinnvoll ist eine Aufteilung in ES-Module ohne Build (`konstanten.js`, `welt.js`, `logik.js`, `bauen.js`, `grafik.js`, `eingabe.js`), die GitHub Pages direkt ausliefert. Das ist eine Entscheidung für Till, weil er bisher Einzeldateien bevorzugt hat.

## 8. Vorschlag für den Weg zur Alpha

**Wann die Alpha fertig ist:** Eine vollständige Partie von 45 bis 60 Minuten lässt sich auf dem Tablet ohne Abbruch, ohne Datenverlust und ohne Erklärung von außen durchspielen.

| Meilenstein | Inhalt | Abnahme |
|---|---|---|
| M0 Übernahme | Repo anlegen, `index.html` läuft unverändert auf GitHub Pages, Aufteilung in Module ohne Verhaltensänderung, ein Skripttest über `__G` | Spiel verhält sich wie der Prototyp |
| M1 Bedienung | Touch auf echtem Gerät, Rückgängig für den letzten Bauschritt, Gebäude verschieben, klare Rückmeldung bei Stau und bei verbotenen Feldern | Till baut eine Linie auf dem Tablet ohne Fehlgriffe |
| M2 Verlässlichkeit | Bänder rücken dicht auf, vollständiger Spielstand mit Versionsnummer, Leistungsmessung und Abhilfe auf dem Tablet | Neuladen mitten im Betrieb verliert nichts |
| M3 Progression | Gebäude schalten sich nach und nach frei, Ziele je Phase, Wegfindung um Hindernisse | Ein neuer Spieler findet ohne Hilfe bis zur ersten Presse |
| M4 Balancing | Partielänge und Preise per Simulation über `__G.step` einstellen, Leerkasten-Verhältnis klären | Partie dauert 45 bis 60 Minuten |
| M5 Feinschliff | Ton, Grafikdurchgang für Gebäude, Endbildschirm mit Auswertung | Abnahme der Alpha |

### Ton (seit Version 29, Entscheidung E-020)

Geräusche und Ambiente entstehen per Code im Browser, ohne Dateien: Aufsammeln, Verkauf, Presse, Bauen, Abriss, Zeltabbau, Ziel, Warnton bei neuem Stau, dazu ein eigener Klang je Bauteilart beim Antippen. Ambiente: einzelne Windböen und Vögel, dazwischen Stille. Brummen der Anlage und durchgehendes Windrauschen sind gestrichen (Versionen 32 und 33), Till empfand sie als störend. Lautstärke in vier Stufen im Menü, getrennt für Geräusche und Ambiente. Musik folgt später als Datei mit freier Lizenz. Die Klänge sind vom Lead Dev nur gemessen, nicht gehört, und werden nach Tills Urteil nachgestellt.

### Gewinnwertung (seit Version 37, Entscheidung E-021)

Neben der Zeit wertet das Spiel am Ende den Gewinn, also das Geld in der Kasse: Bronze ab 1.000 €, Silber ab 1.750 €, Gold ab 2.500 €. Hintergrund: Mit wachsender Übung blieb immer wieder Geld übrig, höhere Preise oder neue Bauteile halfen nur kurz. Die Wertung macht das übrige Geld zum Ziel. Tills Partien bis dahin: 100 bis 500 € oder rund 2.100 € übrig. Die Grenzen sind Startwerte.

### Grafikdurchgang (seit Version 34, Entscheidung E-020)

- Zeltabbau: Das Zelt sackt in 0,7 Sekunden zusammen, die Plane bleibt kurz liegen, Staub steigt auf.
- Tageslicht: Die Partie beginnt in kühlem Morgenlicht mit warmer Sonne von links und ist nach 22 Minuten taghell.
- Saubere Wiese: Wo ein Feld und seine Nachbarn leer sind, wird das Gras heller und Blumen kommen.
- Seit Version 35: Startbildschirm mit Titel, Endbildschirm mit Medaille, Konfetti und Bestzeit, Lüfter und Dampf an den Maschinen. Ein Lkw als Kulisse an der Annahme (Version 35 und 36) wurde mit Version 38 wieder entfernt, Till verstand seinen Sinn nicht. Das Spiel heißt jetzt auch im Spiel Festivalhangover.

## 9. Ideen für nach der Alpha

Nicht beauftragt, nur festgehalten.

- Zurückgelassene Zelte und Pavillons als Sperrmüll mit eigener Kette: umgesetzt mit Version 26 (E-019). Campingstühle bleiben Kulisse.
- Unterführung oder Brücke für sich kreuzende Bänder
- Eigener LKW und Rampe als Ersatz für die Annahme im späten Spiel
- Nächstes, größeres Festival als Wiedereinstieg mit dauerhaften Vorteilen
- Isometrische Darstellung im Stil von Nachschubfront

## 10. Offene Entscheidungen für Till

1. Einzeldatei behalten oder in Module aufteilen?
2. Bleibt es bei einer festen Karte, oder soll jede Partie eine neue Wiese erzeugen?
3. Soll die Spielfigur Hindernissen ausweichen müssen, oder bleibt Durchlaufen als bewusste Vereinfachung?
4. Endgültiger Name
