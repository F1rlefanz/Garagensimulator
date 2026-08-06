# Messwerte

**Stand: Nachmessung vom 06.08.2026 samt Klarstellungen desselben Tages.**
Diese Werte ersetzen die Tabelle aus Abschnitt 3 des Handoff-Dokuments
vollständig.

Maschinenlesbar liegen dieselben Werte in
[`src/domain/garage.ts`](../src/domain/garage.ts) — **dort** wird geändert,
dieses Dokument wird mitgezogen. Kein anderer Teil des Codes darf Messwerte als
Literal enthalten.

## Zur Messgenauigkeit

An Drehpunkten wurde jeweils zur Achsmitte gemessen. Die Garage ist an mehreren
Stellen nicht rechtwinklig, einige Bezugskanten sind nicht eindeutig bestimmbar,
und gemessen wurde allein. Abweichungen im Bereich von **ein bis zwei
Zentimetern sind deshalb Messunsicherheit, nicht Modellfehler**.
`pruefeGeometrie()` warnt erst oberhalb von 1,5 cm und stuft erst oberhalb von
5 cm als echten Widerspruch ein.

## Bezugssystem

2D-Vertikalschnitt, Blick auf die Seitenwand:

- Ursprung `(0,0)` = **Torschließebene** auf Straßenniveau, in der Ebene des
  geschlossenen Tors
- `+x` = in die Garage hinein, Richtung Rückwand
- `+y` = nach oben
- `θ` = Toröffnungswinkel, `0°` = geschlossen (Torblatt senkrecht)

Ein negatives `x` liegt also **vor** der Garage, auf dem Vorplatz.

### Zwei Höhenbezüge

Das ist der Kern des Modells und die Auflösung des lange offenen Widerspruchs:

| Bezug | Lage | Worauf er sich bezieht |
| --- | --- | --- |
| **Torschließebene** | `y = 0` | Torblatt, Schwenkarm, Festlager (`y_A` bis zur Eisenschwelle) |
| **Garagenboden** | `y = 0,124 m` | lichte Höhe, Garagenhöhe, Laufschiene — und das Fahrzeug steht darauf |

Dazwischen liegen die Eisenschwelle und die dahinter ansteigende Rampe. Wer die
beiden Bezüge verwechselt, sieht das Tor 12 cm zu hoch und bekommt die Laufrolle
nicht in ihre Schiene — genau das war [OFFEN-02](03-offene-fragen.md#offen-02).

## Punkte der Kinematik

| Punkt | Bedeutung |
| --- | --- |
| `A` | Festlager des Schwenkarms an der Zarge (ortsfest) |
| `P` | Anlenkpunkt des Schwenkarms am Torblatt (auf dem Kreis um `A`) |
| `T` | Achse der Laufrolle in der Deckenlaufschiene (fährt waagerecht) |
| `O` | Toroberkante |
| `B` | Torunterkante |
| `F` | Federpunkt am Schwenkarm, hinter `A` auf derselben Achse; von dort im Boden verankert |

## Garage

| Größe | Symbol | Wert | Vertrauen | Anmerkung |
| --- | --- | --- | --- | --- |
| Gesamtlänge innen | `L_gesamt` | 5,370 m | gemessen | Rückwand **Rohbau** bis Außenmauer Torseite |
| Tiefe des Federwegs | `d_feder` | 0,120 m | gemessen | an der Torseite, keine Stellfläche |
| Styropor-Dämmung Rückwand | `d_styro` | 0,030 m | gemessen | dickste Stelle; in `L_gesamt` **nicht** enthalten |
| Schmalste Stelle der Einfahrt | `b_min` | 2,240 m | gemessen | bestimmt von den **Schwenkarmen**, nicht von der Zarge |
| Innenhöhe Boden–Decke | `h_garage` | 2,370 m | **widersprüchlich** | ab Garagenboden, siehe [OFFEN-05](03-offene-fragen.md#offen-05) |

## Laufschiene

Alle Höhen ab Garagenboden.

| Größe | Symbol | Wert | Vertrauen | Anmerkung |
| --- | --- | --- | --- | --- |
| Lichte Durchfahrtshöhe | `h_licht` | 2,170 m | gemessen | bis Unterkante Schienenprofil — Bezugspunkt bestätigt |
| Bauhöhe des Schienenprofils | `h_schiene` | 0,062 m | gemessen | Unterkante bis Oberkante |
| Schienenoberkante bis Decke | `d_decke` | 0,165 m | gemessen | mehrfach bestätigt |
| Nutzbare Schienenlänge | `L_schiene` | 2,300 m | gemessen | torseitiger Anfang bis Mitte Laufachse in der Endstellung |

## Torblatt

| Größe | Symbol | Wert | Vertrauen | Anmerkung |
| --- | --- | --- | --- | --- |
| Gesamthöhe Torblatt | `L_tor` | 2,370 m | **widersprüchlich** | durchgehend gemessen, siehe [OFFEN-07](03-offene-fragen.md#offen-07) |
| Anlenkpunkt P → Rollenachse T | `D_TP` | 2,240 m | gemessen | |
| Torunterkante B → Anlenkpunkt P | `D_PB` | 0,085 m | gemessen | |
| Toroberkante O → Rollenachse T | `D_TO` | 0,033 m | gemessen | |

## Mechanik

| Größe | Symbol | Wert | Vertrauen | Anmerkung |
| --- | --- | --- | --- | --- |
| Höhe Festlager A | `y_A` | 1,160 m | gemessen | Achse Lagerbolzen bis **Eisenschwelle** — Bezug ist die Torschließebene |
| Tiefenversatz Festlager A | `x_A` | 0,000 m | **geschätzt** | nicht gemessen, siehe [OFFEN-08](03-offene-fragen.md#offen-08) |
| Schwenkarmlänge | `R` | 1,100 m | gemessen | Achsmitte A bis Achsmitte P, siehe [OFFEN-01](03-offene-fragen.md#offen-01) |
| Lagerbolzen A → Federpunkt F | `D_AF` | 0,178 m | gemessen | F sitzt am Arm, hinter A, auf derselben Achse |

## Abgeleitete Größen

Nicht gemessen, sondern im Code berechnet — nie von Hand nachpflegen.

| Größe | Wert | Herkunft |
| --- | --- | --- |
| **Bodenversatz Torschließebene → Garagenboden** | **0,124 m** | legt die Rolle mittig ins Schienenprofil; zulässig 0,093 … 0,155 m |
| Höhe der Laufrollenachse | 2,325 m | `D_PB + D_TP`, ab Torschließebene |
| Rollenachse über den Schwenkarm | 2,300 m | `y_A − R + D_TP`; unabhängige Gegenprobe, 2,5 cm Abweichung |
| Torblatthöhe als Summe | 2,358 m | `D_TO + D_TP + D_PB`; durchgehend gemessen wurden 2,370 m |
| Wirksame Schwenkarmlänge | 1,075 m | `y_A − D_PB`; damit schließt das Tor bündig |
| Schienenoberkante | 2,232 m | `h_licht + h_schiene`, ab Garagenboden |
| Garagenhöhe aus Schichten | 2,397 m | `h_licht + h_schiene + d_decke`; gemessen wurden 2,370 m |
| Decke über Torschließebene | 2,521 m | Bodenversatz + Garagenhöhe aus Schichten |
| **Luft zwischen Toroberkante und Decke** | **0,151 m** | löst den scheinbaren Gleichstand 2,37 = 2,37 auf |
| **Nutzbare Tiefe** | **5,220 m** | `L_gesamt − d_feder − d_styro` |
| **Größter Öffnungswinkel** | **87,70°** | Anschlag, wenn der Schwenkarm senkrecht über A steht |
| **Größter Überstand der Torunterkante** | **1,148 m bei 59,4°** | auf 1,141 m Höhe |
| Größter Weg der Laufrolle nach innen | 2,238 m | passt in die 2,300 m Schienenlänge ✓ |
| Höhenreserve VW Caddy Maxi | 0,328 m | `h_licht − Fahrzeughöhe` (2,170 − 1,842) |
| Reserve bei geöffneter Heckklappe | 0,015 m | `h_licht − h_heckOffen` (2,170 − 2,155), siehe [OFFEN-10](03-offene-fragen.md#offen-10) |

Drei dieser Größen sind betrieblich wichtig:

**Der Öffnungsweg ist mechanisch auf 87,7° begrenzt.** Nicht durch einen
gesetzten Wert, sondern durch den Schwenkarm: Sobald P senkrecht über A steht,
ist der Kreis um A ausgereizt. Das Tor wird also nie ganz waagerecht.

**Der Überstand auf den Vorplatz ist nicht monoton.** Er erreicht bei 59,4° sein
Maximum von 1,148 m (auf 1,14 m Höhe) und geht danach auf 8,5 cm bei
vollständiger Öffnung zurück. Maßgeblich für den Freiraum vor der Garage ist
also nicht die Endstellung, sondern der Durchgang bei rund 60°.

**Die Toroberkante hat 15 cm Luft bis zur Decke.** Dass Torblatt und Garage
beide mit 2,37 m gemessen wurden, ist kein Zufall und kein Widerspruch — es sind
zwei verschiedene Spannen von zwei verschiedenen Nullpunkten.

Zwei unabhängige Gegenproben stützen das Modell: Der maximale Rollenweg
(2,238 m) passt in die getrennt gemessene Schienenlänge (2,300 m), und die
Rollenachse ergibt sich über Torblatt und Schwenkarm auf 2,5 cm gleich.

## Trajektorie der Eckpunkte

Alle Werte ab Torschließebene.

| θ | B (Unterkante) | T (Rollenachse) | O (Oberkante) |
| --- | --- | --- | --- |
| 0° | (0,000 / 0,000) | (0,000 / 2,325) | (0,000 / 2,358) |
| 30° | (−0,788 / 0,311) | (0,375 / 2,325) | (0,391 / 2,354) |
| 59,4° | (−1,148 / 1,141) | (0,853 / 2,325) | (0,882 / 2,342) |
| 80° | (−0,828 / 1,921) | (1,462 / 2,325) | (1,495 / 2,331) |
| 87,7° | (−0,085 / 2,232) | (2,238 / 2,325) | (2,271 / 2,326) |

## Fahrzeuge

Gepflegt in [`src/domain/fahrzeuge.ts`](../src/domain/fahrzeuge.ts): 30
Katalogeinträge plus die freie Eingabe `Individuell`. Die Maße stammen aus der
Vergleichsmatrix „Autokauf", Blatt „02 Maße & Garage" (Stand 05.08.2026), und
wurden maschinell übernommen, nicht abgetippt.

Jedes Fahrzeug trägt eine **Quellenstufe** aus der Systematik der Matrix:

| Stufe | Bedeutung | Belastbarkeit |
| --- | --- | --- |
| A | Herstellerdatenblatt, amtliche Statistik | als Fakt zitierbar |
| B | Fachredaktion mit eigener Messung (ADAC, AUTO BILD) | Fakt mit Quelle |
| C | Portal- oder Händlerdaten | Marktindikation, keine technische Wahrheit |
| D | Forum, Einzelerfahrung | nur Hypothese |

Was in der Matrix als „n. v." stand, ist hier `undefined`. Es wurde **nichts**
geschätzt, um eine Lücke zu füllen; `pruefeGarage()` meldet solche Achsen als
*nicht prüfbar* statt sie stillschweigend zu bestehen.

Nicht übernommen wurde der Ford Grand Tourneo Connect der 2. Generation — für
ihn ist weder Länge noch Höhe verifizierbar.

Ebenfalls **nicht** übernommen wurde die Spalte `GARAGEN-URTEIL` der Matrix: Sie
rechnete mit anderen Garagenmaßen als den nachgemessenen, zwei davon zu
großzügig. Die Urteile werden in `src/lib/garagenpruefung.ts` neu berechnet,
siehe [OFFEN-11](03-offene-fragen.md#offen-11).

Das **Seitenprofil**, das die Kollisionsprüfung bestimmt, ist für kein Fahrzeug
belegt. Ohne Profil rechnet die Prüfung mit einem Quader über die volle Höhe —
die konservative Annahme, siehe [OFFEN-06](03-offene-fragen.md#offen-06).

## Was noch fehlt

- **Bodenversatz direkt gemessen** — der eine Wert, der
  [OFFEN-02](03-offene-fragen.md#offen-02) endgültig schließt.
- Tiefenversatz `x_A` des Festlagers gegenüber der Torebene.
- Seitenprofil des Fahrzeugs, am Fahrzeug abgenommen
  ([OFFEN-06](03-offene-fragen.md#offen-06)).
- Höhe bei geöffneter Heckklappe, am Fahrzeug gemessen — beim Caddy bleiben
  rechnerisch nur 15 mm ([OFFEN-10](03-offene-fragen.md#offen-10)).
- Breite des Torblatts und der Schwenkarme — für das 3D-Modell zwingend.
