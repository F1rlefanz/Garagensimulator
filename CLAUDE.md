# Hinweise für Claude Code

## Worum es geht

2D-Kinematiksimulation eines vorstehenden Garagen-Schwingtors mit
Übertotpunkt-Hebelmechanik. Zweck ist die Frage, ob ein bestimmtes Fahrzeug in
die Bestandsgarage passt und das Tor danach noch schließt. Langfristig soll
daraus ein 3D-Modell werden. Fachliche Quelle ist `docs/01-handoff.md`.

Projektsprache ist **Deutsch**: Dokumentation, Kommentare, Bezeichner der Domäne
und UI-Texte. Etablierte englische Fachbegriffe (`config`, `angle`, React-API)
bleiben englisch. Die bestehende `GarageConfig` ist aus dem Prototyp englisch —
nicht umbenennen, nur weil es auffällt.

## Harte Regeln

1. **Messwerte stehen ausschließlich in `src/domain/`.** `garage.ts` für Garage
   und Tor, `fahrzeuge.ts` für Fahrzeuge. `DEFAULT_CONFIG` in
   `src/lib/kinematics.ts` leitet sich daraus ab und enthält keine
   Zahlenliterale. Auch `App.tsx` nicht. Eine Zahl an zweiter Stelle ist ein
   Fehler, kein Stil.

2. **Keine Maße erfinden.** Fehlt ein Wert, bleibt er `undefined` oder trägt
   `'geschaetzt'`. Ein plausibel aussehendes Maß, das wie ein gemessenes wirkt,
   führt hier direkt zu einer falschen Einpark-Aussage. Abgeleitete Größen sind
   erlaubt, wenn die Herleitung im Code steht und der zulässige Bereich mit
   dokumentiert ist (Vorbild: `BODENVERSATZ`).
   Widersprüche werden in `docs/03-offene-fragen.md` festgehalten und von
   `pruefeGeometrie()` gemeldet, nicht stillschweigend geglättet.

3. **`src/lib/` bleibt frei von React und SVG.** Die Kinematik muss später vom
   3D-Renderer genauso aufrufbar sein wie heute von der 2D-Ansicht.

4. **Vor dem Abschluss `npm run check`** — Typprüfung, Tests und Build.

## Messgenauigkeit

Die Maße wurden allein aufgenommen, an Drehpunkten zur Achsmitte, in einer
Garage, die an mehreren Stellen nicht rechtwinklig ist. **Abweichungen von ein
bis zwei Zentimetern sind Messunsicherheit, kein Modellfehler.**
`pruefeGeometrie()` warnt deshalb erst ab 1,5 cm und stuft erst ab 5 cm als
Widerspruch ein. Diese Schwellen nicht ohne Anlass verschärfen.

## Zwei Höhenbezüge — der häufigste Fehler

Das Modell führt **zwei Nullpunkte**, und sie dürfen nie vermengt werden:

- **Torschließebene** (`y = 0`): Straßenniveau, hier schließt die Torunterkante.
  Bezug für Torblatt, Schwenkarm und `y_A` (bis zur Eisenschwelle gemessen).
- **Garagenboden** (`y = BODENVERSATZ`, 12,4 cm darüber): Eisenschwelle plus
  Rampe. Bezug für lichte Höhe, Garagenhöhe und Laufschiene — und das Fahrzeug
  steht darauf.

Wer beide gleichsetzt, bekommt die Laufrolle nicht in ihre Schiene und hält
Torhöhe und Garagenhöhe fälschlich für identisch. `Y_RAIL` (Rollenachse) und
`CLEAR_HEIGHT` (lichte Höhe) **nicht zusammenlegen**.

## Bekannte Abweichungen in den Messwerten

Stand nach der Nachmessung vom 06.08.2026. **Kein harter Widerspruch mehr** —
`pruefeGeometrie()` meldet nur noch Warnungen. Ausführlich in
`docs/03-offene-fragen.md`:

- **OFFEN-02:** Der Bodenversatz von 12,4 cm ist abgeleitet, nicht gemessen
  (zulässig 9,3 … 15,5 cm).
- **OFFEN-05:** Garagenhöhe 2,370 m gemessen, 2,397 m aus den Schichten. Die
  2,7 cm bleiben bewusst als Spielraum stehen — bei einer Kaufentscheidung ist
  die konservative Annahme die richtige.
- **OFFEN-07:** Torblatthöhe 2,370 m durchgehend, 2,358 m als Summe.
- **OFFEN-01:** Schwenkarm 1,100 m gemessen, 1,075 m nötig. Als Messtoleranz
  akzeptiert; die Kinematik rechnet mit dem abgeleiteten Wert.

`src/domain/garage.test.ts` hält fest, welche Befunde aktuell gemeldet werden.
Wird durch Nachmessen einer geklärt, schlägt der Test fehl — dann sind Messwert,
Dokumentation und Test **gemeinsam** nachzuziehen. Den Test nicht einfach
anpassen, ohne die Dokumentation mitzuführen.

## Fahrzeuge

`src/domain/fahrzeuge.ts` führt einen festen Katalog (30 Einträge aus der
Vergleichsmatrix „Autokauf") plus den Eintrag `INDIVIDUELL`. Nur letzterer ist in
der UI editierbar — Katalogmaße sind gesperrt.

Jedes Fahrzeug trägt eine **Quellenstufe** A–D aus der Systematik der Matrix:
A Herstellerdatenblatt, B Fachredaktion mit eigener Messung, C Portaldaten,
D Forum. Sie wird angezeigt und nicht hochgestuft.

Optionale Felder sind `undefined`, wenn das Maß nicht belegt ist — nie ein
Ersatzwert. `pruefeGarage()` in `src/lib/garagenpruefung.ts` meldet solche Achsen
als `nicht-pruefbar`, statt sie zu bestehen.

Das `seitenprofil` ist **optional und bei keinem Katalogfahrzeug gesetzt** — es
steht in keinem Datenblatt. Ohne Profil rechnet `fahrzeugKontur()` mit einem
Quader über die volle Höhe. Diese Richtung ist Absicht: Ein geschätztes Profil
ließe das Tor freier aussehen, als es ist. Kein Profil erfinden, auch nicht
„nur für die Zeichnung".

Die Spalte `GARAGEN-URTEIL` der Matrix ist **nicht** übernommen: Sie rechnete mit
5.100 / 2.190 / 2.300 mm statt der nachgemessenen 5.220 / 2.170 / 2.240 mm.
Urteile kommen aus `garagenpruefung.ts`, nicht aus der Tabelle.

## Abgeleitet, nicht gesetzt

Der maximale Öffnungswinkel (87,7°) folgt aus der Mechanik und wird von
`maximalerOeffnungswinkel()` berechnet. Er darf nirgends als Konstante
auftauchen — der frühere Prototyp hatte 87° fest verdrahtet.

## Bezugssystem

Ursprung `(0,0)` in der Torschließebene auf Straßenniveau (siehe oben, zwei
Höhenbezüge), `+x` in die Garage hinein, `+y` nach oben. Negatives `x` liegt vor
der Garage auf dem Vorplatz. `θ = 0°` heißt geschlossen.

Punkte: `A` Festlager an der Zarge, `P` Anlenkpunkt am Torblatt, `T` Laufrolle
in der Deckenschiene, `O` Toroberkante, `B` Torunterkante, `F` Federpunkt am
Schwenkarm hinter `A`.

## Aufbau

```
src/domain/     Messwerte und Fahrzeugdaten, keine Berechnung, keine UI
src/lib/        Kinematik, Fahrzeuggeometrie, Garagenprüfung — rein funktional
src/ui/         Riss, Eingaben, Befunde, Garagenbefund, Seitenpanel
src/App.tsx     Zusammensetzung
scripts/        Build zur eigenständigen HTML-Datei
docs/           Handoff, Messwerte, offene Fragen, Roadmap, Architektur
```

**Eine Implementierung, drei Ansichten.** Entwicklungsserver, GitHub Pages und
die geteilte Vorschau sind dasselbe Programm. Keine zweite Fassung der Kinematik
anlegen, auch nicht „nur schnell zum Zeigen" — `npm run build:einzeldatei`
erzeugt die eigenständige Datei aus dem echten Build.

Dasselbe gilt für Geometrie: Die Fahrzeugkontur liegt in
`src/lib/fahrzeuggeometrie.ts` und wird von Zeichnung **und** Kollisionsprüfung
verwendet.

## Befehle

```bash
npm ci            # Abhängigkeiten exakt aus dem Lockfile
npm run dev       # Entwicklungsserver, Port 3000
npm test          # Vitest
npm run lint      # tsc --noEmit
npm run check     # lint + test + build
npm run build:einzeldatei   # eigenstaendige HTML-Datei nach dist-einzeldatei/
```

## Öffentliches Repository

Das Repository ist öffentlich. Vor jedem Commit gilt: keine Klarnamen, keine
lokalen Pfade, keine Zugangsdaten, keine Fotos mit Straßen- oder Nachbarschafts-
kontext. Details in `docs/05-architektur.md`, Abschnitt Datenschutz.
