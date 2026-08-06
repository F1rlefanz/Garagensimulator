# Offene Fragen und Widersprüche in den Messwerten

**Stand: nach der Nachmessung vom 06.08.2026 und den Klarstellungen desselben
Tages.**

**Es gibt keinen harten Widerspruch mehr.** Der lange offene Punkt OFFEN-02 hat
sich als Verwechslung zweier Höhenbezüge herausgestellt, nicht als Messfehler.
Was bleibt, sind vier Abweichungen im Bereich der Messunsicherheit und zwei
ungemessene Größen.

`pruefeGeometrie()` in [`src/domain/garage.ts`](../src/domain/garage.ts) meldet
die Befunde zur Laufzeit; `src/domain/garage.test.ts` hält den Stand fest. Wird
ein Punkt durch Nachmessen geklärt, schlägt der Test fehl und erinnert daran,
Messwerte, dieses Dokument und den Test gemeinsam nachzuziehen.

## Übersicht

| ID | Befund | Schwere |
| --- | --- | --- |
| [OFFEN-02](#offen-02) | Bodenversatz abgeleitet, nicht gemessen | Warnung |
| [OFFEN-05](#offen-05) | Garagenhöhe: Schichten ≠ Gesamtmaß, 27 mm | Warnung |
| [OFFEN-07](#offen-07) | Torblatthöhe: Summe ≠ Gesamtmaß, 12 mm | Warnung |
| [OFFEN-01](#offen-01) | Schwenkarmlänge weicht um 2,5 cm ab | Warnung, akzeptiert |
| [OFFEN-08](#offen-08) | Tiefenversatz des Festlagers nicht gemessen | offen |
| [OFFEN-06](#offen-06) | Fahrzeug-Seitenprofil ohne Quelle | offen |

---

## OFFEN-02

**Der Garagenboden liegt über der Torschließebene — um wie viel, ist abgeleitet
und nicht gemessen.** Schwere: Warnung.

### Was der Widerspruch war

Drei Messketten führten auf unvereinbare Höhen für die Laufrollenachse:

| Weg | Rechnung | Ergebnis |
| --- | --- | --- |
| über die Teilstrecken des Torblatts | `D_PB + D_TP` = `0,085 + 2,240` | 2,325 m |
| über die Gesamthöhe des Torblatts | `L_tor − D_TO` = `2,370 − 0,033` | 2,337 m |
| über den Schwenkarm | `y_A − R + D_TP` = `1,160 − 1,100 + 2,240` | 2,300 m |
| über die Laufschiene | `h_licht … h_licht + h_schiene` | 2,170 … 2,232 m |

Die ersten drei stimmen auf 3,7 cm überein. Die vierte lag rund 10 cm darunter.

### Die Auflösung

Es waren nie vier Ketten auf einer Skala, sondern **zwei Skalen**:

- **Torblatt und Mechanik** wurden ab Straßenniveau gemessen — dort schließt die
  Torunterkante, und `y_A` wurde ausdrücklich bis zur **Eisenschwelle** im Boden
  aufgenommen.
- **Die Raummaße** (lichte Höhe, Garagenhöhe, Laufschiene) wurden ab dem
  **Garagenboden** gemessen. Hinter der Eisenschwelle steigt eine Rampe an.

Damit die Rolle in ihrer Schiene läuft, muss der Garagenboden zwischen **9,3 cm
und 15,5 cm** über der Torschließebene liegen. Das Modell setzt **12,4 cm** an —
den Wert, der die Rolle mittig ins Profil legt.

### Und damit löst sich auch der zweite Stein des Anstoßes

Torblatt 2,37 m und Garagenhöhe 2,37 m sahen aus wie ein unmögliches Zusammentreffen:
Wie kann das Tor exakt so hoch sein wie die Garage, wenn über der Laufschiene noch
16,5 cm Luft bis zur Decke sind?

Antwort: Es sind zwei verschiedene Spannen von zwei verschiedenen Nullpunkten.
Über der Torschließebene gerechnet liegt die Decke bei **2,52 m**, die
Toroberkante bei 2,37 m — dazwischen bleiben **rund 15 cm**. Kein Zufall und
kein Widerspruch, sondern genau der Bodenversatz.

**Nachzumessen (eine Messung, und der Punkt ist erledigt):** Höhenunterschied
zwischen der Torschließebene (Straßenniveau bzw. Eisenschwelle) und dem
Garagenboden an der Stelle, an der die 2,17 m aufgenommen wurden. Am einfachsten
mit einer waagerecht aufgelegten Latte und einem Zollstock.

**Erwartung:** 10 bis 16 cm, am wahrscheinlichsten rund 12 cm. Kommt deutlich
weniger heraus, stimmt etwas anderes nicht — dann ist der Befund wieder offen.

---

## OFFEN-05

**Garagenhöhe: 2,370 m gemessen, 2,397 m aus den Schichten.**
Schwere: Warnung, 27 mm.

`h_licht + h_schiene + d_decke` = `2,170 + 0,062 + 0,165` = `2,397 m`.

Die Schichtkette gilt als die verlässlichere: Jede der drei Strecken ist kurz
und gut zugänglich, alle drei wurden mehrfach bestätigt. Das durchgehende
Gesamtmaß wurde vom Messenden selbst als „circa" angegeben.

**Bewusst so belassen.** Die 2,7 cm werden als Spielraum mitgeführt, nicht
weggerechnet — bei einer Kaufentscheidung ist die konservative Annahme die
richtige.

---

## OFFEN-07

**Torblatthöhe: 2,370 m durchgehend gemessen, 2,358 m als Summe der
Teilstrecken.** Schwere: Warnung, 12 mm.

`D_TO + D_TP + D_PB` = `0,033 + 2,240 + 0,085` = `2,358 m`.

Beim Gesamtmaß dürfte die Falz- oder Dichtungskante mitgemessen worden sein,
beim Anlenkpunkt dagegen zur Bolzenachse. Für die Kinematik zählen die
Teilstrecken, weil nur sie die Lage von P und T festlegen; das Gesamtmaß dient
als Gegenprobe.

---

## OFFEN-01

**Gemessene Schwenkarmlänge 1,100 m, geometrisch nötig 1,075 m.**
Schwere: Warnung — als Messtoleranz akzeptiert.

Bei geschlossenem Tor liegt P in der Torebene auf Höhe `D_PB = 0,085 m`. Der
Abstand zum Festlager `A = (0; 1,160)` beträgt damit zwingend `1,075 m`.

2,5 cm an einem beweglichen Hebel mit zwei Bolzenachsen, allein gemessen — das
ist im Rahmen. Ein Teil steckt vermutlich in `x_A` (siehe
[OFFEN-08](#offen-08)). Die Kinematik rechnet mit der abgeleiteten Länge; mit
dem gemessenen Wert stünde das „geschlossene" Tor 23 cm aus der Torebene heraus.

**Kein Handlungsbedarf.** In der ersten Messrunde waren es 70,5 cm Abweichung.

---

## OFFEN-08

**Der Tiefenversatz `x_A` des Festlagers ist nicht gemessen.**
Schwere: offen.

Das Modell nimmt `x_A = 0` an. Nach Einschätzung vor Ort dürften es zwei bis
drei Zentimeter sein. Der Einfluss ist klein, geht aber direkt in
[OFFEN-01](#offen-01) ein: Bei `x_A = 0,03 m` verschiebt sich die abgeleitete
Armlänge nur um 0,4 mm — die 2,5 cm erklärt das also nicht.

**Nachzumessen, wenn es ohnehin passt:** Waagerechter Abstand der Achse des
Lagerbolzens von der Ebene des geschlossenen Torblatts.

---

## OFFEN-06

**Das Fahrzeug-Seitenprofil steht in keinem Datenblatt.**
Schwere: offen — und der empfindlichste verbliebene Punkt.

Die Außenmaße des VW Caddy Maxi sind recherchiert und über zwei Quellen
abgeglichen:

| Maß | Wert | Stand |
| --- | --- | --- |
| Länge | 4,851 m | recherchiert |
| Höhe | 1,829 m | recherchiert |
| Breite ohne Spiegel | 1,855 m | recherchiert |
| Breite mit Spiegeln | 2,10 m | recherchiert, nur gerundet belegt |
| Radstand | 2,968 m | recherchiert |

**Haubenlänge, Haubenhöhe und Dachlänge dagegen nicht.** Sie stammen aus dem
Prototyp, ohne Quelle, und bestimmen die Kollisionsprüfung unmittelbar — gerade
beim Rückwärtseinparken, wo die flach abfallende Front der kritische Bereich
ist. In der UI sind sie deshalb als geschätzt gekennzeichnet.

**Nachzumessen am Fahrzeug**, bevor eine Kaufentscheidung darauf gestützt wird:
Höhe der Haubenvorderkante über der Fahrbahn, waagerechter Abstand von der
Fahrzeugfront bis zum Fuß der Windschutzscheibe, waagerechte Dachlänge.

Zur Breite: Mit ausgeklappten Spiegeln bleiben an der schmalsten Stelle der
Einfahrt (2,24 m, bestimmt von den Schwenkarmen) rund **14 cm** übrig, also 7 cm
je Seite. Das ist knapp, aber machbar — angeklappt deutlich entspannter.

---

## Erledigt

- **OFFEN-03** — Handoff-Formel mit einer dritten Länge (2,32 m): durch die
  Nachmessung ersetzt, das Modell rechnet durchgängig über P.
- **OFFEN-04** — Styropor-Dämmung: geklärt. Die 5,37 m Gesamtlänge gehen bis
  zur Rohbauwand, die 3 cm Dämmung sind **nicht** enthalten und werden zusätzlich
  abgezogen. Nutzbar bleiben `5,37 − 0,12 − 0,03 = 5,22 m`.
- **OFFEN-09** — Federgeometrie: geklärt. Der Federpunkt F sitzt am Schwenkarm
  auf derselben Achse wie A und P, ragt aber über den Lagerbolzen hinaus. Genau
  diese Anordnung erzeugt die Übertotpunkt-Wirkung.
