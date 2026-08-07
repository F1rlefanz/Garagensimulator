# Roadmap

Langfristiges Ziel ist ein dreidimensionales Modell der Garage samt Tor-Kinematik
und Einpark-Animation. Der Weg dorthin läuft bewusst über ein belastbares
2D-Modell: Die gesamte Kinematik des Schwingtors spielt sich in der
Seitenansicht ab, und jeder Fehler, der dort ungeklärt bleibt, wird in 3D nur
teurer zu finden.

## Phase 0 — Grundeinrichtung ✅

- Projektstruktur, Toolchain, Tests, Dokumentation
- Messwerte als Single Source of Truth in `src/domain/garage.ts`
- Bekannte Widersprüche erfasst und zur Laufzeit gemeldet

## Phase 1 — Messwerte klären

Nachmessung vom 06.08.2026 eingearbeitet. Siehe
[`03-offene-fragen.md`](03-offene-fragen.md).

- [x] OFFEN-01: Festlager und Schwenkarm neu eingemessen — Abweichung von
      70,5 cm auf 2,5 cm reduziert, damit im Rahmen der Messunsicherheit
- [x] Rollenachse und lichte Höhe im Modell getrennt (`Y_RAIL` / `CLEAR_HEIGHT`)
- [x] OFFEN-05: Garagenhöhe eingemessen (2,37 m), Schienenprofil und
      Deckenabstand ergänzt
- [x] OFFEN-02 aufgelöst: Es war kein Messfehler, sondern zwei Höhenbezüge —
      Torblatt ab Straßenniveau, Raummaße ab Garagenboden. Kein harter
      Widerspruch mehr im Modell
- [x] OFFEN-04 geklärt: Die Styropor-Dämmung ist in den 5,37 m **nicht**
      enthalten; nutzbar bleiben 5,22 m
- [x] OFFEN-09 geklärt: Der Federpunkt sitzt am Schwenkarm hinter dem
      Lagerbolzen, auf derselben Achse
- [ ] Bodenversatz direkt nachmessen (derzeit abgeleitet: 12,4 cm)
- [ ] OFFEN-08: Tiefenversatz `x_A` des Festlagers einmessen

## Phase 2 — 2D-Modell schärfen

- [ ] Kollisionsprüfung vom einzelnen Punkt B auf das gesamte Torblatt und die
      Schwenkarme erweitern — derzeit prüft `App.tsx` nur die Unterkante gegen
      die Fahrzeugkontur; Torblatt und Hebel können das Fahrzeug schon vorher
      berühren
- [ ] Kleinsten Abstand über den gesamten Öffnungsweg ausgeben statt nur
      „Kollision ja/nein" — die Reserve in Zentimetern ist die eigentliche Antwort
- [x] Fahrzeughöhe gegen die lichte Durchfahrtshöhe (2,17 m) prüfen —
      `src/lib/garagenpruefung.ts` prüft Länge, Höhe und Breite mit eigenem
      Urteil je Achse
- [ ] Höhe bei geöffneter Heckklappe für den ganzen Katalog belegen — derzeit
      nur zwei Fahrzeuge, und beim Caddy bleiben 15 mm
      ([OFFEN-10](03-offene-fragen.md#offen-10))
- [ ] Fahrzeug-Seitenprofil aus Stützpunkten statt aus fest verdrahteten
      Polygon-Formeln
- [ ] Vergleichsansicht vorwärts vs. rückwärts eingeparkt
- [x] Federzone als eigenes Element: Sie belegt die vorderen 12 cm der
      Garagentiefe und ist damit der Anschlag beim Vorwärtseinparken
- [ ] Kraftbetrachtung der Übertotpunkt-Federung, sobald
      [OFFEN-09](03-offene-fragen.md#offen-09) geklärt ist
- [x] Veröffentlichung des Builds über GitHub Pages:
      `.github/workflows/pages.yml` baut und deployt, nachdem Typprüfung und
      Tests durchgelaufen sind. **Der deklarierte `push`-Trigger auf `main`
      feuert in diesem Repository nicht** — bislang lief jeder Lauf über
      `workflow_dispatch`. Nach einem Push also `gh workflow run Pages --ref main`
      anstoßen. Bleibt der Job mit leerem `runner_name` stehen und scheitert
      nach exakt 15 Minuten, ist das die Runner-Warteschlange und kein
      Build-Fehler; dann einfach erneut anstoßen.

## Phase 3 — Fahrzeugdatenbank

Umsetzung von Abschnitt 4 des Handoffs. Datenmodell und Auswahlmenü stehen in
[`src/domain/fahrzeuge.ts`](../src/domain/fahrzeuge.ts).

- [x] Auswahlmenü in der UI: `Individuell` plus fester Katalog; Katalogmaße
      gesperrt, nur die freie Eingabe ist editierbar
- [x] Katalog aus der Vergleichsmatrix „Autokauf" befüllt, maschinell
      übernommen statt abgetippt
- [x] Katalog am 06.08.2026 vollständig gegen Herstellerdatenblätter geprüft;
      36 Behauptungen von der Gegenprüfung gekippt, Befunde als OFFEN-12 bis
      OFFEN-41 dokumentiert
- [x] Beleg pro Maß statt pro Fahrzeug: Quellenstufe, Quelle und Abrufdatum
      stehen am einzelnen Wert
- [x] Höhe mit Dachreling als eigenes Feld; `pruefhoehe()` prüft gegen den
      größeren der beiden Werte
- [x] Marktstatus je Eintrag, hergeleitet aus Abgasnorm- und Assistenz-
      stichtagen ([`06-marktrelevanz.md`](06-marktrelevanz.md))
- [x] Breitenangaben ergänzt: Auf der Breitenachse ist nur noch ein einziger
      Eintrag nicht prüfbar ([OFFEN-23](03-offene-fragen.md#offen-23))
- [x] Marktsichtung über 94 Modellvarianten in drei Segmenten: Die Garage
      begrenzt über die Breite, nicht über die Länge
- [x] Ladelänge, Ladebreite zwischen den Radkästen und Innenhöhe des Laderaums
      aufgenommen — für die Frage, ob darin geschlafen werden kann
- [x] Urteil je Achse gegen die **nachgemessene** Garage neu gerechnet; die
      Urteilsspalte der Matrix verworfen ([OFFEN-11](03-offene-fragen.md#offen-11))
- [ ] Seitenprofil nachmessen — es bestimmt die Kollisionsprüfung und ist für
      **kein** Fahrzeug belegt ([OFFEN-06](03-offene-fragen.md#offen-06))
- [ ] Breitenmaße mit angeklappten Spiegeln ergänzen — bei den Kleinbussen ist
      das der Unterschied zwischen „passt" und „passt nicht"
- [ ] Mehrere Fahrzeuge gleichzeitig vergleichen
- [ ] Kleinbusse und Minivans in den Katalog aufnehmen, allen voran ID. Buzz
      und die Stellantis-EMP2-Familie — die einzigen beiden Busfamilien, die
      diese Einfahrt sicher passieren
- [ ] Einfahrt an der schmalsten Stelle nachmessen: Die Mercedes-Gruppe liegt
      4 bis 9 mm über den bisher gemessenen 2,240 m, und die Messung trägt ein
      bis zwei Zentimeter Unsicherheit

Datendisziplin: Jedes **Maß** trägt seinen eigenen Beleg, das Seitenprofil
zusätzlich eine eigene Quellenstufe. Was nicht belegt ist, bleibt `undefined` — ein
geschätztes Maß, das wie ein gemessenes aussieht, ist hier gefährlicher als eine
Lücke. Die Prüfung meldet eine unbelegte Achse als *nicht prüfbar*, statt sie zu
bestehen.

## Phase 4 — Übergang nach 3D

Erst wenn Phase 1 abgeschlossen ist und das 2D-Modell die Realität trifft.

- [ ] Three.js einbinden, 3D-Raumbox mit transparenten Wänden, Zargen,
      Deckenlaufschienen und Bodenmarkierungen
- [ ] Kinematische Hierarchie: Schwenkarme an beiden Seitenwänden gekoppelt,
      Decken-Führungsschlitten synchronisiert
- [ ] Fahrzeug frei in X/Y/Z positionierbar, Außenspiegel ein- und ausklappbar
- [ ] Synchrone Timeline-Animation von Torbewegung und Einparkvorgang
- [ ] Kollisionsprüfung in 3D (Raycasting / AABB) mit Abstandsanzeige

Die 2D-Kinematik aus `src/lib/kinematics.ts` bleibt dabei die Referenz: Das
3D-Modell muss in der Seitenansicht dieselben Zahlen liefern. Die vorhandenen
Tests sind genau dafür gedacht.
