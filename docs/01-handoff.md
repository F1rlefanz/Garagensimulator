# Handoff — Garagenmodell

Vollständiges Transkript des übergebenen Handoff-Dokuments. Der Text ist
inhaltlich unverändert übernommen; ergänzt wurden nur Formatierung und Verweise
auf die Bilddateien in `docs/bilder/`.

Die Word-Datei selbst liegt nicht im Repository: Sie trug den Namen des
Verfassers in ihren Metadaten und hätte in einem öffentlichen Repository nichts
verloren. Inhalt und Bilder sind hier vollständig erhalten.

Dieses Dokument ist die **fachliche Quelle** des Projekts. Es wird nicht
fortgeschrieben — neue Erkenntnisse gehören in `02-messwerte.md`,
`03-offene-fragen.md` und `04-roadmap.md`.

---

## Zusammenfassung

Das Handoff-Dokument fasst alle Schritte, Messwerte, mathematischen Herleitungen
und Code-Stände zusammen, die im Laufe der vorangegangenen Chat-Sitzung zur
Analyse der Garagentor-Kinematik und der Einpark-Passgenauigkeit erarbeitet
wurden.

## 1. Projektziel & Problemstellung

- **Ziel:** Präzise kinematische und geometrische Prüfung, ob ein Fahrzeug trotz
  der Schwenkbewegung des Garagentors sicher in die Bestandsgarage passt und das
  Tor vollständig geschlossen werden kann.
- **Kernfrage:** Wie verhält sich die Trajektorie des Garagentors beim
  Öffnen/Schließen und wie viel Puffer verbleibt in Länge, Höhe und Breite?

## 2. Chronologie der Modellentwicklung

- **Erste Passgenauigkeitsanalyse:** Erhebung der Raum-Grundmaße. Feststellung,
  dass Rückwärtseinparken aufgrund der flach abfallenden Frontpartie deutliche
  Platzvorteile bietet.
- **Korrektur der Tor-Kinematik:** Ursprünglich wurde ein Sektionaltor bzw. nach
  innen schwenkendes Tor vermutet. Anhand der bereitgestellten Detailfotos der
  Hebelmechanik wurde der tatsächliche Mechanismus als **vorstehendes Schwingtor
  mit Übertotpunkt-Hebelmechanik** identifiziert.
- **Exakte Trajektorienberechnung:** Die Unterkante des Tors schwenkt beim Öffnen
  nach außen auf den Vorplatz. Im Garageninneren verbleibt dadurch die Torfläche
  auf Linie zur Oberkante des Tors, aufliegend auf den Deckenlaufschienen. Die
  lichte Durchfahrts- und Innenraumhöhe beträgt 2,17 m.

### Bildmaterial

| Datei | Inhalt |
| --- | --- |
| [`bilder/01-schema-2d-schnitt.png`](bilder/01-schema-2d-schnitt.png) | 2D-Schemaskizze des Vertikalschnitts mit Benennung aller Punkte |
| [`bilder/02-innenansicht-laufschiene.png`](bilder/02-innenansicht-laufschiene.png) | Innenansicht: Deckenlaufschiene und Federstange an der Seitenwand |
| [`bilder/03-tor-geschlossen-innen.png`](bilder/03-tor-geschlossen-innen.png) | Geschlossenes Tor von innen, Zarge und Laufschienen sichtbar |
| [`bilder/04-schwenkarm-detail.png`](bilder/04-schwenkarm-detail.png) | Detail des Schwenkarms bei geöffnetem Tor, mit Ausgleichsfeder |
| [`bilder/05-tor-offen-aussen.png`](bilder/05-tor-offen-aussen.png) | Geöffnetes Tor von außen — das Torblatt steht als Vordach vor |
| [`bilder/06-schwenkarm-festlager.png`](bilder/06-schwenkarm-festlager.png) | Festlager des Schwenkarms an der Zarge, Federstange |

> Die Schemaskizze wurde am 06.08.2026 überarbeitet und um den **Federpunkt**
> sowie die **Verankerung der Federung im Boden** ergänzt. Die aktualisierte
> Fassung liegt noch nicht als Datei im Repository — sie ersetzt
> `bilder/01-schema-2d-schnitt.png`, sobald sie vorliegt.

## 3. Übersicht aller bislang gemessenen Garagen-Werte

| Parameter / Messgröße | Messwert | Exakte Beschreibung & kinematische Funktion |
| --- | --- | --- |
| Innentiefe Brutto | 5,275 m | Gesamte Innentiefe von der Garagenrückwand bis zur geschlossenen Torebene. |
| Innentiefe Nutzbar (L_wand) | 5,240 m | Tatsächliche Nutztiefe abzüglich der 3 cm Styropor-Dämmung an der Rückwand. |
| Lichte Höhe (y_schiene) | 2,170 m | Abstand Garagenboden bis Unterkante Deckenlaufschiene (konstant). |
| Durchfahrtbreite | 2,260 m | Lichte Breite der Toröffnung zwischen den Zargen. |
| Lagerbolzen-Höhe (y_A) | 1,140 m | Vertikale Höhe des festen Drehpunktes A des Schwenkarms an der Zarge. |
| Schwenkarm-Länge (R) | 1,905 m | Mittenabstand des Hebels vom Lagerbolzen A bis Anlenkpunkt P am Torblatt. |
| Abstand Rolle zu Anlenkpunkt (D_TP) | 2,230 m | Strecke auf dem Torblatt von der Laufrolle T hinab zum Anlenkpunkt P. |
| Abstand Anlenkpunkt zu Unterkante (D_PB) | 0,090 m | Überstand des Torblatts vom Anlenkpunkt P hinab zur Unterkante B. |
| Abstand Rolle zu Oberkante (D_TO) | 0,035 m | Überstand der Laufrolle T hinauf zur oberen Torkante O. |
| Gesamthöhe Torblatt (L) | 2,355 m | Summe: 2,230 m + 0,090 m + 0,035 m = 2,355 m. |

> **Diese Tabelle ist überholt.** Sie wurde durch die Nachmessung vom
> 06.08.2026 vollständig ersetzt — unter anderem beträgt die Schwenkarmlänge
> nicht 1,905 m, sondern 1,100 m. Der gültige Stand steht in
> [`02-messwerte.md`](02-messwerte.md).

## 4. Passgenauigkeit: Fahrzeugmodelle vs. Garage

Erstellen einer Liste aller Fahrzeuge der Kategorie (Klein-)Bus, Minivan,
Transporter, Camper, Hochdachkombi. Beschaffung aller Werte der Außenmaße der
Fahrzeuge so detailliert wie möglich. Dann Erstellen von 2- beziehungsweise
später dann dreidimensionalen Modellen der Fahrzeuge, zum Einmessen für die
Animation im Garagenmodell.

## 5. Kinematische Formeln (2D)

Das Bezugssystem hat den Ursprung (0,0) auf dem Garagenboden in der Torebene
(x nach innen, y nach oben):

- Festlager an der Zarge: `A = (0; 1,14)`
- Laufrolle in der Deckenlaufschiene: `T(θ) = (x_T; 2,17)`
- Anlenkpunkt des Hebels am Torblatt:
  `P(θ) = (x_T − 2,23 · sin θ; 2,17 − 2,23 · cos θ)`
- Zwangsbedingung (Pythagoras am Schwenkarm):
  `(x_P − 0)² + (y_P − 1,14)² = 1,905²`
- Unterkante des Torblatts (B):
  `x_B = x_T − 2,32 · sin θ` und `y_B = 2,17 − 2,32 · cos θ`

> Achtung: Die Zwangsbedingung mit R = 1,905 m ist mit den übrigen Maßen nicht
> erfüllbar — siehe [`OFFEN-01`](03-offene-fragen.md#offen-01).

## 6. Roadmap für die 3D-Erweiterung (Three.js / WebGL)

- **3D-Raumbox & Geometrie:** Transparente Wände, Zargen, Deckenlaufschienen und
  Bodenmarkierungen.
- **Kinematische 3D-Hierarchie:** Kopplung der Schwenkarme an beiden Seitenwänden
  und Synchronisation der Decken-Führungsschlitten.
- **Interaktives Einpark- & Animations-Modul:**
  - Freie Positionierung des 3D-Fahrzeugs (X, Y, Z) inklusive Ein- und
    Ausklappen der Außenspiegel.
  - Synchrone Timeline-Animation von Torbewegung und Einparkvorgang.
- **3D Collision Detection:** Echtzeit-Abstandsmessung (Raycasting/AABB) zwischen
  Torblatt/Hebelarmen und der Karosserie mit visueller Kollisionswarnung.
