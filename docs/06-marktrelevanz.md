# Marktrelevanz — welche Modelle noch in Frage kommen

Stand 07.08.2026. Dieses Dokument beantwortet eine Frage, die vor jeder
Recherche steht: **Welche Fahrzeuge lohnt es überhaupt zu erfassen, und ab
wann ist ein Modell veraltet?**

Ohne diese Grenze wächst der Katalog ins Beliebige. Mit ihr lässt sich
begründen, warum ein Modell fehlt.

## Die Grenze hängt am Fahrzeug, nicht am Modell

Ein Katalogeintrag beschreibt eine Baureihe über mehrere Jahre. Der VW Caddy 2K
lief von 2003 bis 2020 — ein Wagen von 2004 und einer von 2019 sind dasselbe
Modell und trotzdem zwei völlig verschiedene Kaufentscheidungen.

**`marktstatus(f)` beschreibt deshalb die jüngsten Fahrzeuge dieser Baureihe,
die am Markt zu finden sind** — abgeleitet aus `baujahre` und nicht am Eintrag
gepflegt, damit der Status beim Ändern der Baujahre nicht stehenbleibt. Wer ein
frühes Baujahr kauft, muss die Stichtage unten selbst gegen das konkrete
Fahrzeug prüfen.

## Die vier Stichtage, an denen sich alles entscheidet

Keine Faustregeln, sondern Daten, an denen sich der Wert eines Fahrzeugs
objektiv ändert:

| Datum | Was gilt ab dann für Neuzulassungen |
| --- | --- |
| 01.09.2015 | **Euro 6** ist Pflicht. Davor: Euro 5 oder älter. |
| 01.09.2019 | **Euro 6d-TEMP** ist Pflicht (Messung im realen Fahrbetrieb, RDE). |
| 01.01.2021 | **Euro 6d** bzw. Euro 6d-ISC-FCM ist Pflicht. |
| 07.07.2024 | **GSR2** gilt für alle Neuzulassungen: Notbremsassistent, Spurhalte-assistent, Müdigkeitswarner und weitere sind serienmäßig. Für neue Fahrzeug-typen schon seit 06.07.2022. |

Der wichtigste davon ist **September 2015**: Ein Diesel ohne Euro 6 ist bei
jeder künftigen Verschärfung städtischer Zufahrtsregeln das erste Fahrzeug, das
ausgesperrt wird. Für einen Wagen, der 2026 gekauft und acht bis zehn Jahre
gefahren werden soll, ist das kein theoretisches Risiko.

Der zweitwichtigste ist **Juli 2022**: Fahrzeugtypen mit einer Typgenehmigung
davor haben die GSR2-Assistenten nicht — auch dann nicht, wenn das einzelne
Fahrzeug später gebaut wurde.

## Die vier Stufen

| Stufe | Bedeutung | Kriterium |
| --- | --- | --- |
| `neu` | Baureihe läuft 2026 noch | `baujahre` endet auf `+` |
| `jung-gebraucht` | Baureihe lief bis mindestens 2022 | Junge Fahrzeuge mit Euro 6d am Markt, teils mit GSR2 |
| `gebraucht` | Produktion zwischen 2016 und 2021 beendet | Euro 6 durchgängig, Assistenz lückenhaft |
| `veraltet` | Produktion vor 2016 beendet | Euro 5 möglich, keine Assistenzpflicht |

**`veraltet` heißt nicht „unbrauchbar", sondern „nicht mehr Teil der
Kaufentscheidung".** Ein solches Fahrzeug kommt nur noch als Preis-Sonderfall in
Frage, und dafür ist dieses Werkzeug nicht gebaut.

**`neu` heißt nicht „in Deutschland bestellbar".** Der Status kennt nur die
Baureihe, nicht den Markt. Der Renault Trafic als Personenvariante etwa läuft
und steht in einer aktuellen Schweizer Preisliste — Renault Deutschland führt
ihn nicht. Siehe [OFFEN-44](03-offene-fragen.md#offen-44).

## Was daraus für die Recherche folgt

1. **Erfasst werden Baureihen mit Status `neu`, `jung-gebraucht` oder
   `gebraucht`.** Baureihen, deren Produktion vor 2016 endete, werden nicht neu
   aufgenommen.
2. **Bereits erfasste Einträge bleiben**, auch wenn ihre frühen Baujahre unter
   die Grenze fallen — sie zu entfernen würde bestehende Vergleiche entwerten.
   Ihr `marktstatus` sagt, woran man ist.
3. **Der Katalog bildet Baureihen ab, nicht Einzelfahrzeuge.** Zu einem
   konkreten Angebot gehört immer die Prüfung von Erstzulassung, Abgasnorm und
   Ausstattung — der Katalog kann das nicht abnehmen.

## Welche Fahrzeugklasse diese Garage überhaupt zulässt

Stand 07.08.2026. Die Marktsichtung über 94 Modellvarianten hat die Frage
aufgeworfen, die anschließende Recherche gegen Herstellerdatenblätter hat sie
beantwortet. **Die Zahlen unten stehen im Katalog und sind belegt**, nicht
geschätzt.

**Die Garage begrenzt über die Breite, nicht über die Länge.**

| Achse | Maß | Wie oft sie das Ausschlusskriterium ist |
| --- | --- | --- |
| Breite mit Spiegeln | 2,240 m | bei den Kleinbussen fast immer |
| Nutzbare Tiefe | 5,220 m | bei allen Langversionen |
| Lichte Höhe | 2,170 m | **kein einziges Fahrzeug** — das höchste im Katalog misst 2,06 m |

### Hochdachkombis: passen alle

Der längste (Mercedes T-Klasse lang, 4,922 m) hat 30 cm Reserve, die breitesten
(Mercedes- und Renault-Plattform, 2,159 m) noch 8 cm. Hier entscheidet nicht die
Garage, sondern der Bedarf.

### Kleinbusse: genau zwei Familien

Von 44 erfassten Kleinbus-Varianten passen **elf**, und sie verteilen sich auf
nur zwei Plattformen:

| Fahrzeug | Länge | Breite mit Spiegeln |
| --- | --- | --- |
| VW ID. Buzz, kurzer Radstand | 4,712 m | 2,212 m |
| VW ID. Buzz, langer Radstand | 4,962 m | 2,212 m |
| Opel Zafira Life S / M | 4,609 / 4,959 m | 2,204 m |
| Peugeot Traveller Compact / Standard | 4,606 / 4,956 m | 2,204 m |
| Citroën SpaceTourer XS / M | 4,609 / 4,959 m | 2,204 m |
| Toyota Proace Verso Compact / Medium | 4,609 / 4,959 m | 2,204 m |
| Fiat Ulysse L2 | 4,981 m | 2,204 m |

**Alle langen Varianten dieser Familien scheitern**, und zwar an der Tiefe:
5,308 bis 5,331 m gegen 5,220 m.

### Was an der Breite scheitert

| Fahrzeug | Breite mit Spiegeln | über der Engstelle |
| --- | --- | --- |
| Mercedes Vito Tourer | 2,244 m | 4 mm |
| Mercedes V-Klasse, Marco Polo, EQV, VLE | 2,248–2,249 m | 8–9 mm |
| VW Multivan T7, California T7 | 2,252 m | 12 mm |
| Kia PV5 Passenger | 2,255 m | **15 mm** |
| Ford Tourneo Custom V710, VW Caravelle T7 | 2,275 m | 35 mm |
| Hyundai Staria, Ford Tourneo Custom V362 | 2,290 m | 50 mm |
| VW Caravelle und California T6.1 | 2,297 m | 57 mm |
| Renault Trafic, Nissan Primastar | 2,312 m | 72 mm |

**Der knappste Fall ist der Kia PV5** — 15 Millimeter, und ausgerechnet bei ihm
stammt die Spiegelbreite nur aus dem ADAC-Katalog, nicht vom Hersteller. Länge
und Höhe sind völlig unkritisch. Siehe
[OFFEN-45](03-offene-fragen.md#offen-45).

### Der Grenzfall, der keiner ist: die Mercedes-Gruppe

Die V-Klasse liegt mit **9 Millimetern** über der Engstelle — das klang nach
Messunsicherheit. Mercedes nennt in derselben Tabelle aber einen zweiten Wert:

- Breite über die Außenspiegel, **ausgeklappt**: 2,249 m → 9 mm zu breit
- Breite über die Außenspiegel, **angeklappt**: 2,057 m → **18 cm Luft**
- Schwenkhöhe der Heckklappe: 2,153 m → **1,7 cm** unter der Laufschiene

Damit ist es keine Frage der Messgenauigkeit, sondern eine Bedienfrage: Die
V-Klasse kompakt (4,895 m) und lang (5,140 m) passen — mit angeklappten
Spiegeln. Die extralange (5,370 m) scheitert an der Tiefe und bleibt draußen.

Das Urteil im Werkzeug lautet trotzdem „passt nicht", weil es gegen die
ausgeklappte Breite rechnet. Das ist die konservative Richtung und bleibt so;
die Bemerkung am Maß nennt beide Zahlen.

### Minivans

Passen alle mühelos, taugen für den Zweck aber kaum: Bei gleicher Außenlänge
bleibt nach Bodenaufbau und Dachkonstruktion deutlich weniger Innenhöhe, und das
Heck ist abgeschrägt statt senkrecht. Die Karosserieform, nicht die Länge, ist
hier die entscheidende Größe. Das Segment ist zudem praktisch tot — mit dem VW
Touran verschwindet 2026 der letzte klassische Kompaktvan eines deutschen
Herstellers ohne Nachfolger.

**Ein Hinweis zur Höhe, weil er wiederholt falsch gerechnet wurde:**
`lichteHoehe` ist in `src/domain/garage.ts` ausdrücklich vom **Garagenboden**
bis zur Unterkante des Schienenprofils definiert — also ab der Ebene, auf der
das Fahrzeug steht. Die 12,4 cm Bodenversatz dürfen **nicht** aufgeschlagen
werden. Ein 1,99 m hoher Camper hat 18 cm Luft, nicht 5,6 cm.

## Warum nicht einfach „zehn Jahre alt"

Eine reine Altersgrenze wäre bequem und falsch. Ein Fiat Doblò von 2021 und ein
Fiat Doblò von 2013 trennen acht Jahre, aber zwischen ihnen liegen zwei
Abgasnormen und die halbe Assistenzentwicklung. Umgekehrt ist ein Mercedes
Citan W415 von 2020 zwar sechs Jahre alt, hat aber die Typgenehmigung von 2012
— an Assistenz fehlt ihm alles, was seit 2022 selbstverständlich ist.

Das Alter ist ein Nebeneffekt. Die Stichtage sind die Sache selbst.

## Quellen

- Euro-Norm-Stichtage: [kfz-auskunft.de, Schadstoffklassen](https://www.kfz-auskunft.de/umwelt/schadstoffklassen.php),
  [mobile.de, Abgasnormen](https://www.mobile.de/magazin/artikel/abgasnormen-bedeutung-aussage-auswirkungen-29600),
  [kfz-euroimport.de zu Euro 6d-ISC-FCM ab 01.01.2021](https://www.kfz-euroimport.de/aktuelles/abgasnorm-euro-6d-isc-fcm-ist-pflicht-bei-pkw-erstzulassung-ab-01012021)
- GSR2 (Verordnung EU 2019/2144):
  [Deutscher Verkehrssicherheitsrat](https://www.dvr.de/presse/pressemitteilungen/fahrerassistenzsysteme-europaweit-verpflichtend-fuer-neue-fahrzeugtypen),
  [meinauto.de zur Pflicht ab Juli 2024](https://www.meinauto.de/news/eu-verordnung-diese-assistenzsysteme-sind-ab-2024-pflicht)

Abgerufen am 07.08.2026.
