# Offene Fragen und Widersprüche in den Messwerten

**Stand: nach der Nachmessung vom 06.08.2026, den Klarstellungen desselben Tages
und der Fahrzeugdaten-Recherche vom 06.08.2026.**

**In der Garagengeometrie gibt es keinen harten Widerspruch mehr.** Der lange
offene Punkt OFFEN-02 hat sich als Verwechslung zweier Höhenbezüge
herausgestellt, nicht als Messfehler. Was dort bleibt, sind vier Abweichungen im
Bereich der Messunsicherheit und zwei ungemessene Größen.

**Der unsicherere Teil sind die Fahrzeugdaten.** OFFEN-12 bis OFFEN-41 halten
fest, wo Herstellerangaben einander widersprechen oder ein Katalogeintrag zwei
verschiedene Fahrzeuge vermischt.

`pruefeGeometrie()` in [`src/domain/garage.ts`](../src/domain/garage.ts) meldet
die Befunde zur Garagengeometrie zur Laufzeit; `src/domain/garage.test.ts` hält
den Stand fest. Wird
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
| [OFFEN-10](#offen-10) | Heckklappenhöhe nur für wenige Fahrzeuge belegt | offen |
| [OFFEN-11](#offen-11) | Vergleichsmatrix rechnete mit anderen Garagenmaßen | erledigt im Code, Matrix veraltet |
| [OFFEN-12](#offen-12) | Caddy SB Maxi: 2.178 mm gegen 2.155 mm Heckklappenhöhe | offen |
| [OFFEN-13](#offen-13) | Caddy SB Maxi: 4.863 m gegen 4.853 m Fahrzeuglänge | Warnung |
| [OFFEN-14](#offen-14) | Caddy SB: Pkw- und Cargo-Maße im selben Eintrag | offen |
| [OFFEN-15](#offen-15) | Caddy 2K: Dachreling ohne eigenes Höhenfeld | offen |
| [OFFEN-16](#offen-16) | Caddy California: Innenmaße gelten ohne Ausbau | offen |
| [OFFEN-17](#offen-17) | Grand Kangoo neue Gen.: Pkw- und Rapid-Maße vermischt | offen |
| [OFFEN-18](#offen-18) | Grand Kangoo neue Gen.: 2.140 mm gegen 2.159 mm Spiegelbreite | offen, konservativ entschieden |
| [OFFEN-19](#offen-19) | Kangoo III L1: Gesamthöhe mit Antenne 29 mm höher | offen |
| [OFFEN-20](#offen-20) | Kangoo II: Baujahresspanne und Karosserieform | offen |
| [OFFEN-21](#offen-21) | Grand Kangoo 2013: Dachreling serienmäßig | offen, konservativ entschieden |
| [OFFEN-22](#offen-22) | Berlingo B9 M: Höhenspanne 1.801–1.862 mm | offen |
| [OFFEN-23](#offen-23) | Berlingo B9 XL: als Pkw in Deutschland nicht belegt | offen |
| [OFFEN-24](#offen-24) | Berlingo K9: Fahrzeughöhe je Marke verschieden | offen, konservativ entschieden |
| [OFFEN-25](#offen-25) | Berlingo-Gruppe: Pkw oder Kastenwagen im Katalog | offen, fachliche Entscheidung |
| [OFFEN-26](#offen-26) | Combo Tour / Doblò: 16 mm Längendifferenz | Warnung |
| [OFFEN-27](#offen-27) | Combo Tour / Doblò: zwei Spiegelbreiten für dasselbe Auto | offen |
| [OFFEN-28](#offen-28) | Combo Tour / Doblò: was misst Opels „Laderaumbreite"? | offen, konservativ entschieden |
| [OFFEN-29](#offen-29) | Combo Tour: Höhe mit Dachgepäckträger bis 47 mm mehr | offen |
| [OFFEN-30](#offen-30) | Citan W420: vier Herstellerwerte für dieselbe Höhe | offen |
| [OFFEN-31](#offen-31) | Citan W415: 2.138 mm gegen 2.145 mm Spiegelbreite | offen |
| [OFFEN-32](#offen-32) | Citan W420: Breite zwischen den Radkästen | Warnung |
| [OFFEN-33](#offen-33) | Townstar Kombi L2: drei Ungereimtheiten bei Nissan | offen |
| [OFFEN-34](#offen-34) | NV200 Evalia: Nissan nennt keine Innenmaße | offen |
| [OFFEN-35](#offen-35) | Tourneo Connect 2. Gen.: Facelift im selben Eintrag | offen |
| [OFFEN-36](#offen-36) | Grand Tourneo Connect 3. Gen.: Ausstattung und Ladelänge | offen |
| [OFFEN-37](#offen-37) | Dacia Duster: ein Eintrag für zwei Generationen | offen |
| [OFFEN-38](#offen-38) | Dacia Jogger: Spiegelbreite und falsch beschriftete Zeile | offen |
| [OFFEN-39](#offen-39) | Dacia Lodgy: Höhe mit Dachreling nicht beziffert | offen |
| [OFFEN-40](#offen-40) | Dacia Dokker: Pkw oder Express | offen |
| [OFFEN-41](#offen-41) | Kangoo II: Herkunft der Bestandswerte 1.258 mm | korrigiert, Nachprüfung offen |

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

**Die Höhe bei geöffneter Heckklappe ist nur für einen kleinen Teil des Katalogs
belegt.** Schwere: offen.

Dieses Maß fehlte dem Modell bis zur Übernahme der Vergleichsmatrix vollständig.
Die Recherche vom 06.08.2026 hat es für mehrere Fahrzeuge aus
Herstellerunterlagen nachgetragen. Es bleibt das Maß, das beim Caddy als erstes
eng wird:

| Fahrzeug | Höhe Heck offen | Rest zu 2,170 m | Stufe |
| --- | --- | --- | --- |
| VW Caddy SB Maxi | 2,155 / 2,178 m | 15 mm bzw. −8 mm | A, strittig |
| VW Caddy SB kurz | 2,155 m (Pkw) | 15 mm | A |
| VW Caddy SB kurz, als Cargo gelesen | 2,184 m | −14 mm | A |
| Renault Grand Kangoo L2 (neue Gen.) | 2,071 m | 99 mm | A |
| Dacia Lodgy | 2,015 m | 155 mm | A |
| VW Caddy 2K Maxi | 2,18 m | −10 mm | D, Forum |

15 mm liegen **innerhalb der Messunsicherheit** dieses Modells — die Schwelle
für ein Messrauschen liegt bei ebenfalls 15 mm. Wo `pruefeGarage()` auf dieser
Achse `heckklappeOeffenbar: true` meldet, lässt sich daraus kein belastbares
„passt" ableiten. Vor einem Kauf ist am Fahrzeug zu messen, und zwar bei
geöffneter Klappe im Endanschlag. Der Wert für den Caddy 2K Maxi stammt aus
einem Forum und ist nur als Warnhinweis zu führen, nicht als Urteil.

Die frühere Vermutung, der Caddy-Wert gehöre zu einer anderen **Ausstattungs-
variante**, hat sich nicht bestätigt. Volkswagen nennt beide Werte für dasselbe
Fahrzeug in verschiedenen Ausgaben derselben Datentabelle; die Frage ist damit
eine des **Modellstands**, nicht der Variante. Sie wird in
[OFFEN-12](#offen-12) geführt. Welche Karosserie die beiden SB-Einträge
überhaupt beschreiben — Pkw oder Cargo —, steht in
[OFFEN-14](#offen-14) offen; davon hängt auf dieser Achse das Urteil ab.

Für einen Teil der übrigen Fahrzeuge ist das Maß **konstruktiv nicht vorhanden**:
Kangoo II kurz und Maxi, Kangoo III L1, Grand Kangoo Pkw 2013, beide Doblò,
Citan W415 extralang und Dokker haben zweiflügelige Hecktüren. Renault trägt die
Zeile für den Grand Kangoo ausdrücklich mit einem Strich ein — ein belastbares
Negativergebnis, kein Rechercheausfall. Für alle weiteren Einträge bleibt das
Maß **unbelegt**. Es wurde nichts abgeleitet und nichts geschätzt.

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

## Zur Fahrzeugdaten-Recherche vom 06.08.2026

Die folgenden Punkte stammen aus einer Recherche über alle 30 Katalogfahrzeuge
am **06.08.2026**. Grundlage waren Herstellerdatenblätter, Preislisten und
Maßzeichnungen; jede einzelne Behauptung wurde anschließend **adversarial
gegengeprüft** — eine zweite Recherche hat versucht, sie zu widerlegen, und nur
was das überstanden hat, ist übernommen worden.

**36 Behauptungen sind dabei gekippt.** Davon betrafen **21 die Verwechslung von
Kastenwagen- und Pkw-Karosserie** und **8 die Wahl des Werts ohne Dachreling,
obwohl die Reling in der betreffenden Ausstattung serienmäßig ist**. Beide
Fehlerarten zeigen in dieselbe Richtung: Sie lassen das Tor freier aussehen, als
es ist. Das sind damit die ersten beiden Prüffragen für jede weitere
Fahrzeugrecherche.

Die Punkte OFFEN-12 bis OFFEN-41 betreffen `src/domain/fahrzeuge.ts`, nicht die
Garagengeometrie. `pruefeGeometrie()` meldet sie nicht; sie stehen hier, weil
sie in ein Garagenurteil eingehen.

---

## OFFEN-12

**Caddy SB Maxi: Volkswagen nennt zwei Höhen bei geöffneter Heckklappe —
2.178 mm und 2.155 mm.** Schwere: offen.

| Quelle | Wert | Stufe |
| --- | --- | --- |
| VW, „Caddy – Technische Daten", Stand 03/2025, sechs Ausstattungstabellen | 2.178 mm | A |
| VW, Technische-Daten-Tabelle Modelljahr 2026, Reiter Maxi | 2.155 mm | A |
| kofferraum-check.de, Typ SB Maxi | 2,16 m | C |

Bei 2,170 m lichter Höhe entscheiden diese 23 mm über das Urteil: Mit 2.155 mm
bleiben **15 mm Reserve**, mit 2.178 mm sind es **8 mm Überschreitung**. Die
Streuung ist also größer als die Reserve.

**Die Entscheidung des Projektinhabers:** Die beiden Zahlen werden **nicht** als
Widerspruch behandelt, sondern als **zwei Modellstände** — 2.178 mm für den
Stand vor der Modellpflege, 2.155 mm für das Modelljahr 2026. Der Katalog führt
dafür zwei getrennte Einträge.

**Das ist eine plausible Deutung, die VW nirgends ausspricht.** Volkswagen
beschreibt die Modellpflege als Änderung an der Front (Schürze, Stoßfänger,
12,9-Zoll-Display) und erwähnt die Heckklappe nicht. Die Deutung fügt sich in
die Zahlen ein, sie ist aber hineingelesen und nicht belegt.

Der **Konsistenzeinwand der Gegenprüfung** bleibt davon unberührt: Der Abstand
zwischen Dachhöhe und Heckklappenhöhe beträgt bei kurzem Pkw, Cargo und Cargo
Maxi einheitlich **322 bis 328 mm**, beim Pkw-Maxi mit 2.178 mm dagegen
**342 mm**. Rechnet man mit dem einheitlichen Abstand, kommen für den Pkw-Maxi
rund 2.158 mm heraus, also praktisch die 2.155. Dazu passt die einzige
VW-unabhängige Angabe (2,16 m). Unter dieser Lesart wären die 2.178 mm kein
früherer Modellstand, sondern schlicht falsch.

**Zur Klärung nötig:** eigene Messung an einem Caddy SB Maxi mit Heckklappe —
Oberkante der voll geöffneten Klappe im Endanschlag über der Standfläche. Nur
diese Messung entscheidet die Frage endgültig; die Deutung als zwei Modellstände
ersetzt sie nicht.

---

## OFFEN-13

**Caddy SB Maxi: 4.863 mm gegen 4.853 mm Fahrzeuglänge.**
Schwere: Warnung, 10 mm.

VW Nutzfahrzeuge Österreich führt beide Zahlen in derselben Tabelle: **4.863 mm**
für 1.5 TSI, TSI DSG und 1.5 TSI eHybrid, **4.853 mm** für 2.0 TDI und TDI DSG.
Dieselbe Aufteilung gilt beim Caddy California Maxi. VW Deutschland nennt
ausnahmslos 4.853 mm, für das Modelljahr 2026 4.851 mm. Beide Angaben sind
Stufe A und haben die Gegenprüfung bestanden. Ob es eine echte antriebsbedingte
Längendifferenz ist oder ein Datenpflegeunterschied zwischen den
Landesgesellschaften, ließ sich nicht klären.

Für das Garagenurteil ist der Unterschied folgenlos — bei 5,220 m nutzbarer
Tiefe bleiben in beiden Fällen rund 36 cm. Entscheidend ist nur, dass die
**Motorisierung am Wert mitgeführt** wird: Sonst trägt der Caddy Maxi den
Benziner- und der California den Dieselwert, und der California sieht 10 mm
kürzer aus, ohne es konstruktiv zu sein.

---

## OFFEN-14

**Caddy SB kurz und Maxi: Der Eintrag beschreibt zwei verschiedene Fahrzeuge.**
Schwere: offen.

Länge, Breite und Spiegelbreite stammen vom Pkw, sämtliche Laderaummaße dagegen
vom Kastenwagen Caddy Cargo:

| Maß (kurz / Maxi) | Pkw | Cargo |
| --- | --- | --- |
| Ladelänge | 1.913 / 2.265 mm | 1.797 / 2.150 mm |
| zwischen den Radkästen | 1.185 mm | 1.230 mm |
| Laderaumhöhe | 1.200 / 1.211 mm | 1.259 / 1.264 mm |
| Höhe Heck offen | 2.155 / 2.178 mm | 2.184 / 2.187 mm |

Solange nicht entschieden ist, welche Karosserie gemeint ist, beschreibt der
Eintrag ein Fahrzeug, das es nicht gibt. Auf der Heckklappenachse entscheidet
die Frage sogar das Urteil: Als Pkw gelesen bleiben beim kurzen Radstand 15 mm
Reserve, als Cargo sind es 14 mm Überschreitung.

Zusätzlich ungeklärt ist die Höhe ohne Dachreling — VW Deutschland nennt in der
Maßzeichnung 1.800 mm, VW Österreich 1.818 mm.

**Zur Klärung nötig:** die Entscheidung, ob der Katalog an dieser Stelle den Pkw
oder den Cargo abbilden soll. Das ist keine Recherchefrage; beide Zahlensätze
sind je für sich sauber belegt.

---

## OFFEN-15

**Caddy 2K: Der Dachrelingaufschlag hat kein eigenes Feld.** Schwere: offen.

Die VW-Preisliste MY2016 führt zwei Höhen:

| Radstand | H3, ohne Reling | H4, mit Reling |
| --- | --- | --- |
| kurz | 1.822 mm | 1.858 mm |
| Maxi | 1.831 mm | 1.868 mm |

Der Katalog hat nur ein Höhenfeld und trägt dort den Wert ohne Reling. Ein Caddy
2K Maxi mit Dachreling ist damit **37 mm höher als eingetragen**. VW selbst
weist darauf hin, dass Höhenmaße je nach Ausstattung um bis zu ±50 mm
abweichen können.

**Zur Klärung nötig:** entweder ein zweites Feld für die Höhe mit Reling oder
je Relingvariante ein eigener Eintrag. Bei einem konkreten Fahrzeug ist zu
prüfen, ob eine Reling montiert ist.

---

## OFFEN-16

**Caddy California: Die Innenmaße gelten für die leere Karosserie.**
Schwere: offen.

Die belegten Werte — 2.265 mm Gepäckraumbodenlänge, 1.185 mm zwischen den
Radkästen, 1.211 mm Laderaumhöhe — beschreiben die Karosserie **ohne Ausbau**.
Der California hat ab Werk Bettmodul, Küchenblock und Schubladen verbaut; VW
veröffentlicht dazu nur die Liegefläche und kein Ladelängenmaß. Für die
Nutzwertfrage sind die eingetragenen Zahlen damit zu großzügig.

Für die Garage wichtiger: Bei einem **Aufstelldach oder Dachträger** gilt keiner
der Höhenwerte mehr. Ein solches Fahrzeug ist gegen die Torblattbahn neu zu
prüfen, nicht gegen den Katalogwert.

---

## OFFEN-17

**Grand Kangoo neue Generation: Der Eintrag mischt Pkw und Kastenwagen.**
Schwere: offen.

Durch `hoeheHeckOffen` 2,071 m — eine Heckklappe hat nur der Pkw — und die
renault.de-Maße ist der Eintrag eindeutig als **Pkw** definiert. Eingetragen
sind aber Höhe 1.854 mm sowie Ladelänge 2.230 mm, Radkastenbreite 1.248 mm und
Laderaumhöhe 1.215 mm — allesamt Werte des **Kastenwagens** Grand Kangoo Rapid
L2. Für den Pkw nennen renault.de und renault.at übereinstimmend 1.815 mm.

Die Mischung ist auch in sich unstimmig: Mit 1.854 und 2.071 m ergäbe sich ein
Überstand der offenen Klappe von 217 mm statt der tatsächlichen 256 mm.

**Zur Klärung nötig:** Aufteilung in zwei Einträge — Pkw mit 1,815 / 2,071 m,
Rapid L2 mit 1,854 m und ohne Heckklappenmaß. Bis dahin sind die drei
Laderaumfelder und die Höhe nicht belegt.

---

## OFFEN-18

**Grand Kangoo neue Generation: 2.140 mm gegen 2.159 mm Breite mit Spiegeln.**
Schwere: offen, konservativ entschieden.

| Quelle | Wert |
| --- | --- |
| renault.de, Pkw-Variante: „Breite über alles (inklusive Außenspiegel)" | 2.140 mm |
| renault.at, dieselbe Pkw-Variante (gleiche Höhe 1.815, gleiche Klappenhöhe 2.071) | 2.159 mm |
| Renault-Deutschland-Preisliste vom 26.07.2024, L1 und L2 | 2.159 mm |

Drei offizielle Renault-Quellen, 19 mm Unterschied, nicht auflösbar. Übernommen
ist der konservative Wert 2,159 m. **Beide Zahlen stehen hier ausdrücklich** und
nicht nur die größere: Bei 2,240 m schmalster Einfahrt geht es um 81 mm gegen
100 mm Restspiel, und der kleinere Wert ließe die Einfahrt entspannter aussehen,
als sie belegt ist.

---

## OFFEN-19

**Kangoo III L1: Die Gesamthöhe mit Antenne liegt 29 mm höher.**
Schwere: offen.

Die Renault-Preisliste vom 26.07.2024 nennt neben „Gesamthöhe unbeladen 1.864"
auch „Gesamthöhe mit Antenne 1.893". Eine Antenne hat jedes ausgelieferte
Fahrzeug. Kein Fahrzeugkatalog rechnet sie in die Höhe ein, und ein einzelner
Eintrag darf hier nicht abweichen — eingetragen sind deshalb 1,864 m.

Bei einem Schwingtor, dessen Blatt über das Dach fegt, sind 29 mm trotzdem
relevant. **Zur Klärung nötig:** die Frage gegen die berechnete Torblattbahn
stellen, nicht gegen die lichte Höhe.

---

## OFFEN-20

**Kangoo-II-Einträge: Baujahresspanne und Karosserieform.** Schwere: offen.

Die Spanne 2007–2021 überspannt das Facelift 2013. Der Vorfacelift-Express ist
4.213 mm lang, 4.282 mm bleibt damit die konservative Obergrenze.

Der Eintrag `renault-kangoo-ii-kurz-l1` ist zudem nachweislich ein
**Kastenwagen** — die Radkastenbreite beträgt 1.218/1.219 mm gegen 1.121 mm beim
Pkw — und sollte auch so heißen. Die kurze Pkw-Variante erreicht laut Broschüre
4.304 mm, weil der hintere Überhang 732 statt 710 mm misst.

---

## OFFEN-21

**Grand Kangoo 2013: Die Dachreling ist keine Option.**
Schwere: offen, konservativ entschieden.

Die Renault-Broschüre nennt „Höhe unbeladen / mit Dachreling 1.802 bzw.
1.861/1.866". Die Ausstattungsseite derselben Broschüre führt die Dachreling
unter dem Sondermodell Paris, und die Ausstattung Luxe baut auf Paris auf — dort
ist sie **serienmäßig**. Ein realer Gebrauchtwagen aus 2013 bis 2021 trägt sie
mit hoher Wahrscheinlichkeit.

Übernommen ist deshalb 1,866 m. Sauberer wäre eine Aufteilung in zwei Einträge
mit und ohne Reling.

---

## OFFEN-22

**Berlingo B9 M: Höhenspanne 1.801 bis 1.862 mm ohne Erklärung.**
Schwere: offen.

Die deutsche Citroën-Preisliste (Stand 01.08.2016) nennt die Höhe nur als Spanne
und sagt nicht, wodurch die 61 mm entstehen. Der ADAC-Autokatalog führt nur den
unteren Wert, automobiledimension nur den oberen.

Die Citroën-UK-Broschüre löst es anders auf als vermutet: „4380/1810/1852" und
in der zweiten Spalte „4380/1810/1852/1862*" mit der Fußnote „*XTR models". Der
obere Rand gehört danach zur höhergelegten Ausstattungslinie **XTR** und nicht
zur Dachreling. Der britische Standardwert wäre 1.852 mm — den nennt keine
deutsche Quelle. Woher die 1.801 mm stammen, bleibt offen.

Der Bestandswert 1,862 m bleibt stehen, weil er die konservative Obergrenze ist.

---

## OFFEN-23

**Berlingo B9 XL: Gibt es dieses Fahrzeug als Pkw in Deutschland?**
Schwere: offen.

Die deutsche Citroën-Preisliste Multispace führt überhaupt keine XL-Version, der
ADAC-Autokatalog hat keinen XL-Eintrag für die Pkw-Variante. Belegt ist allein
die Länge 4.630 mm, und auch die ausschließlich als Kastenwagen L2; cars-data
nennt für den Multispace eine Längenspanne bis 4.628 mm. Höhe (Bestand 1,867 m)
und beide Breiten sind für diese Variante durch keine Quelle gedeckt.

Wendet man Regel 2 des Projekts streng an, müssten Höhe und beide Breiten auf
`undefined` — dann wäre dieser Eintrag als einziges Fahrzeug auf der
Breitenachse nicht prüfbar. **Zur Klärung nötig:** der Nachweis, dass die lange
B9-Variante in Deutschland als Pkw angeboten wurde. Vor einer Kaufentscheidung
auf diesem Eintrag ist das zu klären.

---

## OFFEN-24

**Berlingo K9: Die Fahrzeughöhe hängt von der Marke ab.**
Schwere: offen, konservativ entschieden.

Für dieselbe Plattform nennen die Hersteller:

| Quelle | Wert |
| --- | --- |
| Toyota, Preisliste Proace City Verso 09/2022 | 1.880 mit / 1.812 ohne Dachreling |
| Citroën, Berlingo M (ADAC-Autokatalog, Herstellerangabe) | 1.844 mm |
| Opel, Combo Life | 1.841 mm |

Für die XL-Version stehen 1.849 mm (ADAC-Autokatalog, Stufe C) gegen 1.880 mm
(Toyota-Preisliste, Citroën-Maßzeichnung, Opel-Datenblatt, Stellantis-
Pressemappe zum Rifter Long) — drei A-Belege gegen eine C-Zahl, die zudem 31 mm
in die unsichere Richtung zeigt.

Ein Eintrag, der vier Marken abdeckt, kann nicht den niedrigsten Markenwert
tragen. Die Bestandswerte 1,874 / 1,880 m bleiben deshalb stehen.

---

## OFFEN-25

**Berlingo / Rifter / Combo Life / Proace City: Welche Karosserie soll der
Katalog abbilden?** Schwere: offen, fachliche Entscheidung.

Die Bestandswerte 1.781/2.131 mm Ladelänge und 1.229 mm zwischen den Radkästen
sind exakt die **Kastenwagen**-Werte der Citroën-Preisliste, während die vier
Einträge die **Pkw**-Varianten beschreiben. Für den Pkw nennt die
Toyota-Preisliste 1.880 bzw. 2.230 mm hinter der ersten Sitzreihe, 1.195 mm
zwischen den Radkästen und 1.126 mm maximale Laderaumhöhe.

Beide Zahlensätze sind je für sich korrekt belegt. Es ist eine fachliche
Entscheidung, keine Recherchefrage — und bis sie getroffen ist, bleiben die
zwölf betroffenen Felder unbelegt. Für die B9-Generation gibt es überdies keine
Pkw-Gegenwerte.

---

## OFFEN-26

**Combo Tour / Doblò: 16 mm Längendifferenz zwischen zwei Herstellern.**
Schwere: Warnung, 16 mm.

Opel gibt für den Combo Tour 4.390 mm (kurz) und 4.740 mm (lang) an, Fiat für
die identische Karosserie 4.406 und 4.756 mm — bei identischem Radstand
(2.755/3.105 mm) und identischen Spurweiten. Fiats Angabe geht rechnerisch auf
(`2.755 + 911 + 740 = 4.406`), Opel veröffentlicht keine Überhänge. Dass die
Differenz bei beiden Radständen exakt gleich groß ist, spricht für eine
systematische Stoßfänger- oder Konventionsdifferenz, nicht für einen Fehler.

Konservativ sind 4,406 bzw. 4,756 m.

---

## OFFEN-27

**Combo Tour / Doblò: zwei Spiegelbreiten für dasselbe Auto.** Schwere: offen.

Opel nennt 2.119 mm (Betriebsanleitung MY13, für alle sechs Aufbauspalten
identisch), der ADAC-Autokatalog für den baugleichen Fiat 2.125 mm. Eine
Fiat-Primärquelle für dieses Maß existiert nicht — die Stellantis-Preisliste
01/2021 und das FCA-Datenblatt 02/2015 wurden per Volltextsuche geprüft.

Bei 2,240 m schmalster Einfahrtstelle geht es um 51 mm gegen 45 mm Restspiel.
Vier baugleiche Katalogeinträge mit zwei verschiedenen Spiegelbreiten zu führen
ist nicht haltbar. Die Gegenprüfung empfiehlt einheitlich 2,125 m; übernommen
wurde bislang nur die Korrektur bei den beiden Fiat-Einträgen.

**Zur Klärung nötig:** entweder eine Fiat-Primärquelle oder die einheitliche
Übernahme des konservativen Werts für alle vier Einträge.

---

## OFFEN-28

**Combo Tour / Doblò: Was misst Opels Zeile „Laderaumbreite"?**
Schwere: offen, konservativ entschieden.

Opel nennt für Lieferwagen und Combi 1.230 mm, für den Combo Tour 1.195 mm. Der
FCA-Block „Kombi mit kurzem Radstand (M1-Zulassung)" führt dagegen „Innenbreite
1120, Außenbreite 1195" — Opels 1.195 mm ist dort exakt die **Außenbreite**.
Beim Maxi lautet derselbe FCA-Block „Innenbreite 1191, Außenbreite 1261", Opels
Zahl ist wieder 1.195 mm und liegt jetzt nahe der **Innenbreite**. Dieselbe
Opel-Zahl kann nicht in beiden Fällen dasselbe Maß sein.

Übernommen sind die FCA-Innenbreiten 1,120 / 1,191 m als konservative Werte für
den engsten Punkt. Für die Garagenfrage ist das ohne Bedeutung, für die
Nutzwertbewertung nicht.

---

## OFFEN-29

**Combo Tour: Höhe mit Dachgepäckträger bis 47 mm höher.** Schwere: offen.

Die Opel-Betriebsanleitung nennt „1845 / 1895" bzw. „1880 / 1927" mit der
Fußnote „Ausführungen mit Dachgepäckträger"; das FCA-Datenblatt bestätigt für
die Personenversion „1845–1895" bzw. „1880–1927" mit dem Zusatz „Mit Opt. 357
(Dachreling)". Passend dazu führt der ADAC-Autokatalog den Fiat Doblò Kombi
pauschal mit 1.895 mm.

Die Katalogwerte gelten nur ohne Träger. **Zur Klärung nötig:** an einem
konkreten Fahrzeug prüfen, ob ein Träger montiert ist — es geht um bis zu 47 mm.

---

## OFFEN-30

**Citan W420: vier Herstellerwerte für dieselbe Höhe.** Schwere: offen.

| Quelle | L1 | L2 |
| --- | --- | --- |
| Mercedes-Broschüre, Preisstand 08/2023 | 1.832 mm | 1.852 mm |
| dieselbe Broschüre, Preisstand 08/2024 und 01/2026 | 1.910 mm | 1.916 mm |
| ADAC-Autokatalog | 1.819 mm | 1.830 mm |

Crew Van L2: 1.918 mm. Spannweite **9,1 cm** auf genau der Achse, die über die
Durchfahrt entscheidet. Die Ausgabe 01/2026 hat den Laderaumhöhen-Fehler der
Ausgabe 08/2024 korrigiert und ist an dieser Stelle in sich schlüssig — die
Deutung „Setzfehler" trägt daher nicht. Übernommen sind die höheren Werte
1,910 / 1,916 m.

Beide Maßblätter zeigen über dem Höhenmaß ein zweites Maß (1.900 bzw. 1.916 in
der Skizze); ob das die Höhe inklusive Dachantenne ist, beschriftet keine
Quelle.

**Zur Klärung nötig:** eine deutsche Mercedes-Angabe oder eine eigene Messung.
Ob die angehobenen Höhen mit dem schwenkenden Torblatt kollidieren, entscheidet
sich an der berechneten Torblattbahn, nicht an der lichten Höhe.

---

## OFFEN-31

**Citan W415: 2.138 mm gegen 2.145 mm Breite mit ausgeklappten Spiegeln.**
Schwere: offen.

Die Werksbroschüre vom 15.09.2017 nennt 2.138 mm, der ADAC hat im Autotest
AT5072 am Citan Kombi 109 CDI lang 2.145 mm **gemessen**. Bei 2,240 m schmalster
Einfahrt bleiben 102 gegen 95 mm — die Differenz ist nicht belanglos.

Eingetragen ist 2,138 m, obwohl die Recherche den ADAC-Wert selbst für „den für
eine Kaufentscheidung richtigen" hält. **Diese Inkonsistenz ist aufzulösen**;
konsequent zur sonstigen Linie des Projekts wäre der konservative Wert
2,145 m.

---

## OFFEN-32

**Citan W420: drei Werte für die Breite zwischen den Radkästen.**
Schwere: Warnung.

1.248 mm (Broschüre 08/2023, Tabelle und Skizze) gegen 1.260 mm (Broschüren
08/2024 **und** 01/2026) gegen 1.240 mm (parkers.co.uk). Der eingetragene Wert
dürfte überholt sein. Für die Garagenfrage ohne Bedeutung, hier nur der
Vollständigkeit halber festgehalten.

Nebenbefund zur Quellengüte: Das L2-Maßblatt der Ausgabe 2023 nennt in der Zeile
„Max. width" fälschlich 1.248 statt 1.524 mm — Tabelle und Skizze sind dort
beide fehlerhaft.

---

## OFFEN-33

**Nissan Townstar Kombi L2: drei Ungereimtheiten in Nissans eigenen Tabellen.**
Schwere: offen.

- **Höhe.** Die Maßtabelle nennt für L1 **und** L2 identisch 1.838 mm (mit
  Dachreling 1.860), die Seite „Beladung und Platz" für den Kombi L2 dagegen
  1.869 mm „ohne Dachreling"; nissan.at nennt für beide Längen 1.860 mm. Trifft
  1.838 zu und kommt der Relingaufschlag von 22 mm dazu, läge ein
  Reling-Fahrzeug bei rund 1,891 m — höher als der eingetragene konservative
  Wert.
- **Ladelänge.** Kombi L1 1.020 mm gegen Kombi L2 2.230 mm bei nur 422 mm
  Längenunterschied ist als dieselbe Messgröße arithmetisch unmöglich; 2.230 mm
  ist zugleich exakt der Kastenwagen-L2-Wert. Das Feld bleibt unbelegt.
- **Radkastenbreite.** 1.190 mm beim Kombi L2 gegen 1.248 mm bei Kombi L1 und
  Kastenwagen — und 1.190 mm ist zugleich die angegebene Öffnungsbreite der
  Heckklappe.

---

## OFFEN-34

**Nissan NV200 Evalia: Innenmaße nennt Nissan nicht.** Schwere: offen.

Der offizielle Evalia-Prospekt (Juni 2011) führt „Laderaumbreite zw. den
Radkästen", „Laderaumhöhe, maximal" und „Laderaumlänge, maximal" ausdrücklich
mit **„k. A."**. Die Bestandswerte 2,040 m und 1,360 m stammen erkennbar vom
NV200-Kastenwagen — andere Bodenwanne, keine Verkleidung, keine Rücksitze.

Als einzige Alternative existiert eine Ausbau-Hobbyseite (Stufe D), die ihre
Zahlen nicht als eigene Messung ausweist. Ohne eigenes Nachmessen bleibt hier
nichts Belastbares.

---

## OFFEN-35

**Ford Tourneo Connect 2. Generation: Facelift im selben Eintrag.**
Schwere: offen.

Der Eintrag deckt 2013 bis 2021 ab. Das Facelift ab 2018 misst laut ADAC
4.462 / 1.845 / 1.854 mm gegen 4.418 / 1.835 / 1.852 mm davor.

Ungeklärt bleibt außerdem, ob die 1.852 mm eine Dachreling enthalten: Der
ADAC-Autotest des Grand Tourneo Connect derselben Generation weist „Dachreling:
Serie" aus und nennt 1.840 mm — exakt Fords Wert für den Grand 7-Sitzer.

---

## OFFEN-36

**Ford Grand Tourneo Connect 3. Generation: Ausstattung und Ladelänge.**
Schwere: offen.

Fords Preisliste führt „Länge ohne Anhängevorrichtung" mit 4.501/4.854 mm für
TITANIUM und 4.515/4.868 mm für ACTIVE sowie „Höhe max. (EU-Norm)" mit 1.833 mm
(TITANIUM) gegen 1.835 mm (ACTIVE). Ein ACTIVE kostet also 14 mm zusätzliche
Garagentiefe — das ist ein Ausstattungsunterschied, keine Dachrelingfrage.

Bei der Ladelänge stehen 2.238 mm (Ford-Preisliste, „am Boden bis 1. Sitzreihe")
gegen 2.113 mm („luggage compartment length", transitcenter.uk) — 125 mm,
vermutlich unterschiedliche Messdefinitionen.

Der Längenunterschied zum VW Caddy Life Maxi (4.863 mm) ist **kein** Datenfehler,
sondern eine echte Differenz zwischen den Schwestermodellen.

---

## OFFEN-37

**Dacia Duster: ein Eintrag für zwei Generationen.** Schwere: offen.

| Generation | Länge | Breite ohne Spiegel | mit Spiegeln | Höhe mit Reling |
| --- | --- | --- | --- | --- |
| I | 4.315 mm | 1.822 mm | 2.000 mm | 1.695 mm |
| II | 4.341 mm | 1.804 mm | 2.052 mm | 1.687 mm |

Generation I ist ohne Spiegel 18 mm **breiter**, mit Spiegeln aber 52 mm
schmaler. Der Eintrag trägt jetzt eine **Hüllkurve** beider Generationen
(4,341 / 1,822 / 2,052 / 1,695 m). Das beschreibt kein real existierendes
Fahrzeug und ist ausschließlich als konservative Prüfgrenze zu lesen. Sauberer
wäre eine Aufteilung in zwei Einträge.

Die Höhe bei geöffneter Heckklappe ist nur für Generation II belegt (2.020 mm);
die Gen-I-Preisliste führt das Maß nicht, und Gen I ist mit Reling 8 mm höher.
Das Feld bleibt deshalb leer.

---

## OFFEN-38

**Dacia Jogger: Spiegelbreite und eine falsch beschriftete Herstellerzeile.**
Schwere: offen.

Die Dacia-Preislisten vom 16.06.2022 und 01.01.2023 nennen „Breite inkl.
Außenspiegel 2.007", das technische Datenblatt auf dacia.de „Breite über alles
(inklusive Außenspiegel) 2012", der ADAC misst 2.005 mm — zwei Herstellerangaben
derselben Stufe zum selben Wagen. Übernommen ist der konservative Wert 2,012 m.

Zweitens führt dacia.de eine Zeile „Höhe mit geöffneter Laderaumklappe,
unbeladen = 1674" — identisch mit der Dachhöhe inklusive Dachreling und für eine
geöffnete Klappe physikalisch unmöglich. Entweder ist die Zeile falsch
beschriftet oder der Wert falsch; **auflösbar nur durch Nachmessen**. Das Feld
bleibt bis dahin leer.

Drittens: Der ab 2025 überarbeitete Jogger wird in der österreichischen
Preisliste mit 1.853 mm Breite geführt, gegen 1.784 mm für 2022 bis 2024. Den
Katalogeintrag betrifft das nicht, bei einem Neuwagenkauf wäre es entscheidend.

---

## OFFEN-39

**Dacia Lodgy: Höhe mit Dachreling nicht beziffert.** Schwere: offen.

Die Preisliste nennt „H Höhe, unbeladen 1.714" und keinen Wert mit Reling. Die
Dachreling ist beim Stepway (Titan-Look) und bei Prestige (Matt-Chrom-Look)
serienmäßig. Für diese Ausstattungen liegt die reale Höhe über 1,714 m — um wie
viel, ist unbekannt und wird **nicht geschätzt**.

---

## OFFEN-40

**Dacia Dokker: Pkw oder Express?** Schwere: offen.

| Variante | Höhe | mit Dachreling |
| --- | --- | --- |
| Dokker Pkw (Dacia-Presse-Service) | 1.814 mm | 1.852 mm |
| Dokker Express (Dacia-Presse-Service) | 1.809 mm | 1.847 mm |
| Dokker Express (Maßskizze) | 1.804 mm | 1.846 mm |

Welche Variante der Eintrag „Dokker, Standard" meint, entscheidet über rund
einen Zentimeter Höhe — und über die Ladelänge: Pkw 1,57 m mit umgelegter Bank
gegen Express 1.856/1.901 mm, mit ausgebautem Beifahrersitz 3.110 mm.

Zusätzlich offen: Die Radkastenbreite beträgt 1.130 mm mit und 1.170 mm ohne
Verkleidung; welcher Wert für die Serienverkleidung des Pkw gilt, ist nicht
belegt. Eine Laderaumhöhe nennt für den Pkw weder Dacia noch der ADAC.

---

## OFFEN-41

**Kangoo II: Herkunft der Bestandswerte 1.258 mm.**
Schwere: korrigiert, Nachprüfung offen.

Die Bestandslängen 4.321 und 4.705 mm sind nachweislich Maße des **Mercedes
Citan W415** — der Katalog hatte die badge-engineerte Schwester als Kangoo
geführt. Der bei allen drei Kangoo-II-Einträgen identische Wert 1.258 mm für die
Laderaumhöhe passt ins selbe Muster: Beim Citan gilt er für alle drei Längen.
Renault nennt durchgängig 1.129 mm.

Die Korrektur ist erfolgt. **Zur Klärung nötig:** beim nächsten Durchgang durch
`src/domain/fahrzeuge.ts` prüfen, ob weitere Werte aus derselben kontaminierten
Quelle stammen. Ein Wert, der bei mehreren Einträgen exakt gleich ist, obwohl
die Fahrzeuge sich unterscheiden, ist das verlässlichste Anzeichen dafür.

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
