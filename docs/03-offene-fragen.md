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
| [OFFEN-06](#offen-06) | Fahrzeug-Seitenprofil für kein Fahrzeug belegt | offen |
| [OFFEN-10](#offen-10) | Heckklappenhöhe nur für zwei Fahrzeuge, Variante unsicher | offen |
| [OFFEN-11](#offen-11) | Vergleichsmatrix rechnete mit anderen Garagenmaßen | erledigt im Code, Matrix veraltet |

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

**Das Fahrzeug-Seitenprofil steht in keinem Datenblatt — für kein einziges
Fahrzeug des Katalogs.** Schwere: offen.

Die Außenmaße des VW Caddy SB Maxi stammen aus dem Herstellerdatenblatt
(Quellenstufe A):

| Maß | Wert |
| --- | --- |
| Länge | 4,863 m |
| Höhe (ohne Dachreling) | 1,842 m |
| Breite ohne Spiegel | 1,855 m |
| Breite mit Spiegeln | 2,10 m — nur gerundet belegt |

**Haubenlänge, Haubenhöhe, Dachlänge und Scheibenlänge dagegen nicht.** Früher
standen dafür Zahlen aus dem Prototyp im Code, ohne Quelle. Sie sind entfernt:
`seitenprofil` ist jetzt optional und bei **allen** Katalogfahrzeugen leer. Fehlt
es, rechnet `fahrzeugKontur()` mit einem **Quader über die volle Höhe**.

Das ist die konservative Richtung. Ein geschätztes Profil mit flach abfallender
Front ließe das Tor freier aussehen, als es ist — genau dort, wo es beim
Rückwärtseinparken kritisch wird. Der Quader kann höchstens eine Kollision
melden, die in Wahrheit keine ist; er kann keine übersehen.
`src/domain/fahrzeuge.test.ts` hält fest, dass kein Katalogfahrzeug ein Profil
trägt — wird eines nachgemessen, schlägt der Test fehl.

**Nachzumessen am Fahrzeug**, bevor eine Kaufentscheidung auf die
Kollisionsprüfung gestützt wird: Höhe der Haubenvorderkante über der Fahrbahn,
waagerechter Abstand von der Fahrzeugfront bis zum Fuß der Windschutzscheibe,
waagerechte Erstreckung der Scheibe, waagerechte Dachlänge.

Zur Breite: Mit ausgeklappten Spiegeln bleiben an der schmalsten Stelle der
Einfahrt (2,24 m, bestimmt von den Schwenkarmen) rund **14 cm** übrig, also 7 cm
je Seite. Das ist knapp, aber machbar — angeklappt deutlich entspannter.

---

## OFFEN-10

**Die Höhe bei geöffneter Heckklappe ist nur für zwei Fahrzeuge belegt — und
dort mit unsicherer Variantenzuordnung.** Schwere: offen.

Dieses Maß fehlte dem Modell bis zur Übernahme der Vergleichsmatrix vollständig.
Es ist das erste, das beim Caddy wirklich eng wird:

| Fahrzeug | Höhe Heck offen | lichte Höhe | Rest |
| --- | --- | --- | --- |
| VW Caddy SB Maxi | 2,155 m | 2,170 m | **15 mm** |
| Renault Grand Kangoo L2 (neue Gen.) | 2,071 m | 2,170 m | 99 mm |

15 mm liegen **innerhalb der Messunsicherheit** dieses Modells — die Schwelle
für ein Messrauschen liegt bei ebenfalls 15 mm. `pruefeGarage()` meldet
`heckklappeOeffenbar: true`, aber daraus lässt sich kein belastbares „passt"
ableiten. Vor einem Kauf ist am Fahrzeug zu messen, und zwar bei geöffneter
Klappe im Endanschlag.

Erschwerend: Der Wert für den Caddy stammt aus Blatt „11 Neuwagen 2026" der
Vergleichsmatrix und ist dort dem *Caddy Life Maxi eHybrid* mit **1.850 mm**
Fahrzeughöhe zugeordnet, nicht den hier geführten 1.842 mm. Die 8 mm Differenz
deuten auf eine andere Variante. Der Wert steht deshalb mit dieser Einschränkung
als `notiz` am Fahrzeug.

Für alle übrigen 28 Katalogfahrzeuge ist das Maß **nicht belegt**. Es wurde
nichts abgeleitet und nichts geschätzt.

---

## OFFEN-11

**Die Vergleichsmatrix rechnete mit anderen Garagenmaßen als den
nachgemessenen.** Schwere: im Code erledigt, in der Tabelle veraltet.

Blatt „02 Maße & Garage" der Matrix führte eine Spalte `GARAGEN-URTEIL`. Sie
beruhte auf Annahmen, die vor der Nachmessung vom 06.08.2026 entstanden sind:

| Größe | Annahme der Matrix | nachgemessen | Differenz |
| --- | --- | --- | --- |
| nutzbare Länge | 5.100 mm | 5.220 mm | +120 mm großzügiger |
| Durchfahrtshöhe | 2.190 mm | 2.170 mm | **−20 mm knapper** |
| Einfahrtsbreite | 2.300 mm | 2.240 mm | **−60 mm knapper** |

Zwei der drei Achsen sind in Wirklichkeit **enger** als angenommen, besonders
die Breite. Jedes Urteil aus dieser Spalte ist damit hinfällig.

Deshalb wurde die Spalte **nicht** übernommen. `src/lib/garagenpruefung.ts`
rechnet die Urteile aus `src/domain/garage.ts` neu — aus derselben Quelle wie
die Zeichnung. Übernommen wurden aus der Matrix ausschließlich die
**Fahrzeugmaße** samt ihrer Quellenstufe.

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
