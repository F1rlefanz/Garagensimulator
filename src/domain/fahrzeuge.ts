/**
 * Fahrzeug-Datenmodell und Katalog.
 *
 * Umsetzung von Abschnitt 4 des Handoff-Dokuments. Ursprung der Maße war die
 * Vergleichsmatrix „Autokauf" (Blatt „02 Maße & Garage", Stand 05.08.2026).
 * Am 06.08.2026 wurde der gesamte Katalog gegen Herstellerdatenblätter geprüft;
 * die Befunde stehen in `docs/03-offene-fragen.md`, OFFEN-12 bis OFFEN-41.
 *
 * Datendisziplin:
 *
 * - **Jedes Maß trägt seinen eigenen Beleg** — Quellenstufe, URL und Abrufdatum
 *   stehen am Wert, nicht am Fahrzeug. Vorbild ist `interface Messwert` in
 *   `garage.ts`. Ein Eintrag kann eine herstellerbelegte Länge und eine aus dem
 *   Forum geschätzte Heckklappenhöhe tragen; eine gemeinsame Stufe für beide
 *   wäre in einem der beiden Fälle gelogen.
 * - Was nicht belegt ist, ist `undefined`. Es wurde nichts geschätzt, um eine
 *   Lücke zu füllen. `pruefeGarage()` meldet solche Achsen als
 *   `nicht-pruefbar`, statt sie zu bestehen.
 * - **`hoehe` ist immer die Höhe ohne Dachreling.** Wo die Reling serienmäßig
 *   ist, steht ihr Maß in `hoeheMitDachreling`, und `pruefhoehe()` liefert den
 *   größeren der beiden. Vorher stand im Katalog teils der eine, teils der
 *   andere Wert — dieselbe Spalte mit zwei Bedeutungen.
 * - Das **Seitenprofil** ist für kein Katalogfahrzeug belegt: Es steht in keinem
 *   Datenblatt. Fehlt es, rechnet die Kollisionsprüfung mit einem Quader über
 *   die volle Höhe — die konservative Annahme. Ein erfundenes Profil würde das
 *   Tor freier aussehen lassen, als es ist.
 *
 * **Nicht übernommen wurde die Urteilsspalte der Matrix.** Sie rechnete mit
 * 5.100 mm Länge, 2.190 mm Höhe und 2.300 mm Breite — die Nachmessung vom
 * 06.08.2026 ergab 5.220 / 2.170 / 2.240 mm, zwei davon enger. Ihre Urteile
 * sind damit hinfällig; `src/lib/garagenpruefung.ts` rechnet sie aus
 * `src/domain/garage.ts` neu. Auch in `notiz` steht deshalb kein Garagenurteil.
 * Siehe `docs/03-offene-fragen.md`, OFFEN-11.
 */

/** Belastbarkeit einer Angabe, Systematik aus der Vergleichsmatrix. */
export type Quellenstufe =
  /** Herstellerdatenblatt, amtliche Statistik. Als Fakt zitierbar. */
  | 'A'
  /** Fachredaktion mit eigener Messung (ADAC, AUTO BILD). Fakt mit Quelle. */
  | 'B'
  /** Portal- oder Händlerdaten. Marktindikation, keine technische Wahrheit. */
  | 'C'
  /** Forum, Einzelerfahrung. Nur Hypothese, nie als Fakt behandeln. */
  | 'D';

export const STUFE_LABEL: Record<Quellenstufe, string> = {
  A: 'Herstellerangabe',
  B: 'Fachredaktion, eigene Messung',
  C: 'Portaldaten — keine technische Wahrheit',
  D: 'Forum — nur Hypothese',
};

/** Reihenfolge für Vergleiche: A ist am belastbarsten. */
const STUFEN_RANG: Record<Quellenstufe, number> = { A: 0, B: 1, C: 2, D: 3 };

/**
 * Ein einzelnes Fahrzeugmaß samt Beleg. Alle Längen in **Metern**.
 *
 * Der Beleg steht am Maß und nicht am Fahrzeug, weil die Maße eines Fahrzeugs
 * aus unterschiedlich guten Quellen stammen. Ohne `quelle` und `abgerufenAm`
 * ist ein recherchierter Wert nach einem halben Jahr nicht mehr nachprüfbar.
 */
export interface Fahrzeugmass {
  /** Wert in Metern. */
  readonly wert: number;
  readonly quellenstufe: Quellenstufe;
  /** URL des Belegs, oder die Bezeichnung des Dokuments, wenn es keine gibt. */
  readonly quelle: string;
  /** Abrufdatum im Format JJJJ-MM-TT. */
  readonly abgerufenAm: string;
  /**
   * Variante, Motorisierung, Messkonvention, verbleibende Unsicherheit. Steht
   * eine zweite Herstellerangabe im Raum, gehört sie hierher — nicht nur die
   * übernommene Zahl.
   */
  readonly bemerkung?: string;
}

/**
 * Wie weit ein Modell 2026 noch als Kaufoption zählt. Herleitung und Stichtage
 * in `docs/06-marktrelevanz.md` — die Stufen hängen an Abgasnorm und
 * Assistenzpflicht, nicht am Alter.
 *
 * Der Status beschreibt die **jüngsten** Fahrzeuge einer Baureihe. Wer ein
 * frühes Baujahr kauft, muss die Stichtage gegen das konkrete Fahrzeug prüfen.
 */
export type Marktstatus =
  /** Baureihe läuft 2026 noch. Ob sie in Deutschland angeboten wird, sagt das
   *  nicht — siehe OFFEN-44. */
  | 'neu'
  /** Baureihe lief bis mindestens 2022 — junge Gebrauchte mit Euro 6d am Markt. */
  | 'jung-gebraucht'
  /** Produktion zwischen 2016 und 2021 beendet. Euro 6 sicher, Assistenz lückenhaft. */
  | 'gebraucht'
  /** Produktion vor 2016 beendet. Euro 5 möglich — nicht mehr Teil der Kaufentscheidung. */
  | 'veraltet';

/**
 * Die Beschriftungen sagen bewusst nichts über die **Bestellbarkeit**: Der
 * Status kennt nur die Baureihe, nicht den deutschen Markt. Ein Modell kann
 * laufen und hier trotzdem nicht angeboten werden — siehe OFFEN-44.
 */
export const MARKTSTATUS_LABEL: Record<Marktstatus, string> = {
  neu: 'laufende Baureihe',
  'jung-gebraucht': 'junger Gebrauchter',
  gebraucht: 'Gebrauchtmarkt',
  veraltet: 'veraltet',
};

/**
 * Marktstatus aus der Baujahresangabe.
 *
 * Abgeleitet und nicht am Eintrag gepflegt: Sonst müsste beim Ändern von
 * `baujahre` jemand daran denken, den Status nachzuziehen — und täte es
 * irgendwann nicht. Eine laufende Baureihe endet auf `+`.
 */
export function marktstatus(f: Fahrzeug): Marktstatus {
  if (/\+\s*$/.test(f.baujahre)) return 'neu';
  const jahre = f.baujahre.match(/\d{4}/g);
  if (!jahre) return 'gebraucht';
  const ende = Number(jahre[jahre.length - 1]);
  if (ende >= 2026) return 'neu';
  if (ende >= 2022) return 'jung-gebraucht';
  if (ende >= 2016) return 'gebraucht';
  return 'veraltet';
}

export type Fahrzeugkategorie =
  | 'hochdachkombi'
  | 'minivan'
  | 'kleinbus'
  | 'transporter'
  | 'camper'
  | 'kombi'
  | 'gelaendewagen';

export const KATEGORIE_LABEL: Record<Fahrzeugkategorie, string> = {
  hochdachkombi: 'Hochdachkombi',
  minivan: 'Minivan',
  kleinbus: 'Kleinbus',
  transporter: 'Transporter',
  camper: 'Camper',
  kombi: 'Kombi',
  gelaendewagen: 'Geländewagen',
};

/**
 * Seitenprofil für die Kollisionsprüfung. Alle Längen in Metern, gemessen ab
 * der Fahrzeugfront (x = 0) bzw. ab Aufstandsfläche (y = 0).
 *
 * Diese Maße stehen in keinem Datenblatt. Wo sie fehlen, wird konservativ mit
 * einem Quader gerechnet.
 */
export interface Seitenprofil {
  /** Länge der Motorhaube von der Front bis zum Fuß der Windschutzscheibe. */
  readonly haubenLaenge: number;
  /** Höhe der Vorderkante der Motorhaube. */
  readonly haubenHoehe: number;
  /** Horizontale Länge des Dachs von der A-Säule bis zur Heckkante. */
  readonly dachLaenge: number;
  /** Waagerechte Erstreckung der Windschutzscheibe. */
  readonly scheibenLaenge: number;
  /** Woher die Werte stammen. */
  readonly quellenstufe: Quellenstufe;
}

export interface Fahrzeug {
  readonly id: string;
  /** Anzeigename im Auswahlmenü. */
  readonly bezeichnung: string;
  readonly modell: string;
  readonly variante: string;
  readonly baujahre: string;
  readonly kategorie: Fahrzeugkategorie;

  /** Gesamtlänge inkl. Stoßfänger, ohne Anhängerkupplung. */
  readonly laenge: Fahrzeugmass;
  /** Höhe **ohne** Dachreling. Für die Prüfung `pruefhoehe()` verwenden. */
  readonly hoehe: Fahrzeugmass;
  /** Höhe mit Dachreling, wo die Reling serienmäßig oder belegt ist. */
  readonly hoeheMitDachreling?: Fahrzeugmass;
  readonly breiteOhneSpiegel?: Fahrzeugmass;
  readonly breiteMitSpiegeln?: Fahrzeugmass;
  /**
   * Höhe bei geöffneter Heckklappe. Entscheidet darüber, ob sich der Kofferraum
   * in der Garage überhaupt öffnen lässt. Fehlt bei Fahrzeugen mit Flügeltüren
   * — dort gibt es das Maß nicht, das ist kein Rechercheausfall.
   */
  readonly hoeheHeckOffen?: Fahrzeugmass;
  readonly ladelaenge?: Fahrzeugmass;
  readonly ladebreiteRadkasten?: Fahrzeugmass;
  readonly innenhoeheLaderaum?: Fahrzeugmass;

  /** Fehlt bei allen Katalogfahrzeugen — dann rechnet die Prüfung mit einem Quader. */
  readonly seitenprofil?: Seitenprofil;

  readonly notiz?: string;
}

/** Die Maßfelder eines Fahrzeugs, für Anzeige und Durchlauf. */
export type Massfeld =
  | 'laenge'
  | 'hoehe'
  | 'hoeheMitDachreling'
  | 'breiteOhneSpiegel'
  | 'breiteMitSpiegeln'
  | 'hoeheHeckOffen'
  | 'ladelaenge'
  | 'ladebreiteRadkasten'
  | 'innenhoeheLaderaum';

export const MASSFELDER: readonly Massfeld[] = [
  'laenge',
  'hoehe',
  'hoeheMitDachreling',
  'breiteOhneSpiegel',
  'breiteMitSpiegeln',
  'hoeheHeckOffen',
  'ladelaenge',
  'ladebreiteRadkasten',
  'innenhoeheLaderaum',
];

export const MASSFELD_LABEL: Record<Massfeld, string> = {
  laenge: 'Länge',
  hoehe: 'Höhe ohne Dachreling',
  hoeheMitDachreling: 'Höhe mit Dachreling',
  breiteOhneSpiegel: 'Breite ohne Spiegel',
  breiteMitSpiegeln: 'Breite mit Spiegeln',
  hoeheHeckOffen: 'Höhe bei offener Heckklappe',
  ladelaenge: 'Ladelänge',
  ladebreiteRadkasten: 'Breite zwischen den Radkästen',
  innenhoeheLaderaum: 'Innenhöhe Laderaum',
};

/**
 * Die Höhe, gegen die geprüft werden muss.
 *
 * Ist eine Dachreling belegt, gilt sie: In der Einfahrt steht das Fahrzeug, das
 * tatsächlich gebaut wurde, nicht die relingfreie Tabellenzeile. Der größere
 * Wert gewinnt, damit ein versehentlich zu klein eingetragenes Relingmaß die
 * Prüfung nicht großzügiger macht.
 */
export function pruefhoehe(f: Fahrzeug): Fahrzeugmass {
  const mitReling = f.hoeheMitDachreling;
  return mitReling && mitReling.wert > f.hoehe.wert ? mitReling : f.hoehe;
}

/** Alle belegten Maße eines Fahrzeugs, in fester Reihenfolge. */
export function belegteMasse(f: Fahrzeug): Array<[Massfeld, Fahrzeugmass]> {
  return MASSFELDER.flatMap((feld) => {
    const m = f[feld];
    return m ? [[feld, m] as [Massfeld, Fahrzeugmass]] : [];
  });
}

/**
 * Schwächste Quellenstufe aller belegten Maße.
 *
 * Das ist die ehrliche Aussage über einen Eintrag: Ein Fahrzeug mit vier
 * Herstellermaßen und einem Forenwert ist kein Fahrzeug der Stufe A.
 */
export function schwaechsteQuellenstufe(f: Fahrzeug): Quellenstufe {
  return belegteMasse(f).reduce<Quellenstufe>(
    (schlechteste, [, m]) =>
      STUFEN_RANG[m.quellenstufe] > STUFEN_RANG[schlechteste] ? m.quellenstufe : schlechteste,
    'A',
  );
}

/**
 * Freie Eingabe. Der einzige Eintrag, dessen Maße in der Oberfläche verändert
 * werden dürfen — und der einzige mit einem Seitenprofil, das niemand belegt
 * hat. Er steht ausdrücklich als Spielwiese da, nicht als Datensatz.
 */
export const INDIVIDUELL_ID = 'individuell';

/** Beleg für die Startwerte der freien Eingabe. */
const FREIE_EINGABE = {
  quellenstufe: 'D' as const,
  quelle: 'Startwerte vom VW Caddy SB Maxi, in der Oberfläche frei veränderbar',
  abgerufenAm: '2026-08-06',
};

export const INDIVIDUELL: Fahrzeug = {
  id: INDIVIDUELL_ID,
  bezeichnung: 'Individuell — freie Eingabe',
  modell: 'Individuell',
  variante: 'freie Eingabe',
  baujahre: '—',
  kategorie: 'hochdachkombi',
  laenge: { wert: 4.853, ...FREIE_EINGABE },
  hoehe: { wert: 1.8, ...FREIE_EINGABE },
  breiteOhneSpiegel: { wert: 1.855, ...FREIE_EINGABE },
  breiteMitSpiegeln: { wert: 2.1, ...FREIE_EINGABE },
  seitenprofil: {
    haubenLaenge: 1.2,
    haubenHoehe: 0.95,
    dachLaenge: 2.7,
    scheibenLaenge: 0.5,
    quellenstufe: 'D',
  },
  notiz: 'Alle Maße frei veränderbar. Startwerte vom VW Caddy SB Maxi übernommen.',
};

/**
 * Katalog, geprüft gegen Herstellerdatenblätter am 06.08.2026.
 *
 * Nicht übernommen wurde der Ford Grand Tourneo Connect der 2. Generation: Für
 * ihn ist weder Länge noch Höhe verifizierbar, und ohne diese beiden Maße lässt
 * sich nichts prüfen.
 *
 * Der Marktstatus steht nicht am Eintrag: `marktstatus(f)` leitet ihn aus
 * `baujahre` ab und beschreibt die jüngsten Fahrzeuge einer Baureihe — siehe
 * `docs/06-marktrelevanz.md`. Eine laufende Baureihe endet auf `+`.
 */
export const FAHRZEUGE: readonly Fahrzeug[] = [
  /*
   * Caddy 2K, kurzer Radstand. Die Höhe steht in zwei Feldern: H3 ohne, H4 mit Dachreling
   * (OFFEN-15). Die Höhe bei geöffneter Heckklappe bleibt offen — der einzige Fundwert
   * (Forum, 2,18 m) stammt vom Maxi, nicht vom kurzen Radstand. Für die Ladelänge nennt der
   * Bericht keinen Beleg; der frühere Bestandswert 1,781 m ist deshalb weggefallen. Dieselbe
   * Zahl führt der Bericht als Citroën-Kastenwagenwert, eine Herkunftsprüfung steht aus
   * (OFFEN-41).
   */
  {
    id: 'vw-caddy-2k-kurz',
    bezeichnung: 'VW Caddy 2K · kurz',
    modell: 'VW Caddy 2K',
    variante: 'kurz',
    baujahre: '2003–2020',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.408,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Radstand 2.682 mm, ohne Anhängerkupplung; mit Kupplung 4.506 mm.',
    },
    hoehe: {
      wert: 1.822,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Maß H3, ohne Dachreling. VW weist darauf hin, dass Höhenmaße je nach Ausstattung um ' +
        'bis zu ±50 mm abweichen können. Siehe OFFEN-15.',
    },
    hoeheMitDachreling: {
      wert: 1.858,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Maß H4, mit Dachreling — 36 mm über dem Wert ohne Reling. Siehe OFFEN-15.',
    },
    breiteOhneSpiegel: {
      wert: 1.793,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Aus der Bemaßung der Maßzeichnung in der Preisliste.',
    },
    breiteMitSpiegeln: {
      wert: 2.065,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Spiegel ausgeklappt.',
    },
    ladebreiteRadkasten: {
      wert: 1.12,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Gilt für alle privat verkauften Ausstattungslinien. Die früher geführten 1.168 mm ' +
        'gelten allein für den Flotten-Basistrimm Conceptline und waren 48 mm zu optimistisch.',
    },
    innenhoeheLaderaum: {
      wert: 1.23,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Ausstattung Conceptline; Trendline und die übrigen Linien nennen 1.226 mm.',
    },
    notiz:
      'Kurzer Radstand, zum Schlafen zu kurz. Die Breite ist inzwischen belegt (2,065 m über ' +
      'die Spiegel); für die Ladelänge liegt kein Beleg vor.',
  },
  /*
   * Caddy 2K Maxi. Wie der kurze Radstand: H3 ohne, H4 mit Dachreling (OFFEN-15). Die
   * Heckklappenhöhe ist der einzige Wert der Gruppe aus einem Forum — Stufe D, nur
   * Größenordnung. Ladelänge ohne Beleg und deshalb weggelassen.
   */
  {
    id: 'vw-caddy-2k-maxi',
    bezeichnung: 'VW Caddy 2K · Maxi',
    modell: 'VW Caddy 2K',
    variante: 'Maxi',
    baujahre: '2004–2020',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.878,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Radstand 3.006 mm, ohne Anhängerkupplung.',
    },
    hoehe: {
      wert: 1.831,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Maß H3, ohne Dachreling. VW weist darauf hin, dass Höhenmaße je nach Ausstattung um ' +
        'bis zu ±50 mm abweichen können. Siehe OFFEN-15.',
    },
    hoeheMitDachreling: {
      wert: 1.868,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Maß H4, mit Dachreling — 37 mm über dem Wert ohne Reling. Siehe OFFEN-15.',
    },
    breiteOhneSpiegel: {
      wert: 1.793,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Identisch zum kurzen Radstand.',
    },
    breiteMitSpiegeln: {
      wert: 2.065,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Spiegel ausgeklappt, identisch zum kurzen Radstand.',
    },
    hoeheHeckOffen: {
      wert: 2.18,
      quellenstufe: 'D',
      quelle: 'https://www.caddytalk.de/forum/thread/111-passt-der-vw-caddy-in-de-garage-oder-parkhaus/',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Forenangabe zum Caddy 3 FL Maxi, keine Herstellerangabe und keine ausgewiesene ' +
        'Messung. Der Wert gibt nur die Größenordnung an und taugt für kein Urteil — er ist ' +
        'als Warnhinweis zu lesen, nicht als Maß.',
    },
    ladebreiteRadkasten: {
      wert: 1.12,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Wie beim kurzen Radstand; 1.168 mm gelten nur für den Basistrimm Conceptline.',
    },
    innenhoeheLaderaum: {
      wert: 1.24,
      quellenstufe: 'A',
      quelle: 'https://blog.le-parnass.com/catalogue_pdf/vw_caddy_pricelist201506g.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Ausstattung Conceptline; die übrigen Linien nennen 1.233 mm.',
    },
    notiz:
      'Langer Radstand mit entsprechend langer Ladefläche — ein belegtes Ladelängenmaß liegt ' +
      'allerdings nicht vor. Eine Anhängerkupplung verlängert das Fahrzeug über das hier ' +
      'geführte Maß hinaus.',
  },
  /*
   * Caddy SB, kurzer Radstand — als Pkw geführt. Der Bestand war eine Chimäre aus
   * Pkw-Außenmaßen und Cargo-Innenmaßen (OFFEN-14); die Cargo-Werte sind entfernt, die
   * Laderaummaße stammen jetzt aus der Pkw-Spalte. Die Höhe ist der wunde Punkt: VW nennt
   * für den kurzen Radstand keinen Wert ohne Dachreling.
   */
  {
    id: 'vw-caddy-sb-kurz',
    bezeichnung: 'VW Caddy SB · kurz',
    modell: 'VW Caddy SB',
    variante: 'kurz',
    baujahre: '2020+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.5,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Stand vor der Modellpflege; für das Modelljahr 2026 nennt VW 4.498 mm. Der Bericht ' +
        'führt die 4.500 mm nur im Vergleich zu diesem MY2026-Wert und ohne eigene ' +
        'Quellenzeile. Ob die motorisierungsabhängige Längendifferenz des Maxi (Benziner ' +
        '10 mm länger) auch für den kurzen Radstand gilt, ist nicht ausgewiesen. Siehe OFFEN-13.',
    },
    hoehe: {
      wert: 1.833,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Karosserie. Die Messkonvention ist ungeklärt: Für den Maxi weist dieselbe Quelle ' +
        '1.836 mm mit und 1.800 mm ohne Dachreling aus, was nahelegt, dass die 1.833 mm den ' +
        'Wert mit Reling meinen — ein Wert ohne Reling ist für den kurzen Radstand nirgends ' +
        'belegt und wird hier nicht geschätzt. Der Wert ist damit als konservative Obergrenze ' +
        'zu lesen. Der frühere Bestandswert 1,856 m war der Cargo-Wert mit Antennenfuß und ist ' +
        'entfallen. Siehe OFFEN-14.',
    },
    breiteOhneSpiegel: {
      wert: 1.855,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Von der Tabelle zum Modelljahr 2026 als unverändert bestätigt.',
    },
    breiteMitSpiegeln: {
      wert: 2.1,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Eigene Tabellenzeile „Max. Breite inkl. Außenspiegel", getrennt von 1.931 mm mit ' +
        'angeklappten Spiegeln; vom ADAC zusätzlich selbst gemessen. Der frühere Hinweis „nur ' +
        'gerundet belegt" ist damit überholt.',
    },
    hoeheHeckOffen: {
      wert: 2.155,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Wert der Pkw-Karosserie. Der Kastenwagen Caddy Cargo kommt auf 2.184 mm; dieser Wert ' +
        'steht hier bewusst nicht, weil der Eintrag den Pkw abbildet. Siehe OFFEN-14.',
    },
    ladelaenge: {
      wert: 1.913,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Wert. Der frühere Bestandswert 1,797 m war die Ladelänge des Kastenwagens Caddy ' +
        'Cargo. Der Bericht nennt die Pkw-Zahlen ohne eigene Quellenzeile; Fundstelle ist die ' +
        'VW-Seite „Caddy – Technische Daten". Siehe OFFEN-14.',
    },
    ladebreiteRadkasten: {
      wert: 1.185,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Wert; 1.230 mm gelten für den Kastenwagen Caddy Cargo. Siehe OFFEN-14.',
    },
    innenhoeheLaderaum: {
      wert: 1.2,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Wert; die früher geführten 1,272 m und der Korrekturvorschlag 1,259 m sind beide ' +
        'Cargo-Werte. Siehe OFFEN-14.',
    },
    notiz: 'Zum Schlafen zu kurz; über Budget.',
  },
  /*
   * Caddy SB Maxi vor der Modellpflege — das Referenzfahrzeug des Projekts.
   *
   * Aufteilung gegenüber dem Bestand: VW nennt für den Maxi zwei Heckklappenhöhen, 2.178 mm
   * („Caddy – Technische Daten", Stand 03/2025) und 2.155 mm (Tabelle Modelljahr 2026). Diese
   * beiden Zahlen sind hier auf zwei Modellstände verteilt — dieser Eintrag trägt die 2.178 mm,
   * der Eintrag „Modellpflege 2026" die 2.155 mm. Die Aufteilung ist eine Entscheidung des
   * Projekts, keine Aussage von VW; die Gegenprüfung hält die 2.178 mm für unplausibel.
   * Siehe OFFEN-12. Wie beim kurzen Radstand sind die Cargo-Innenmaße durch Pkw-Werte ersetzt
   * (OFFEN-14).
   */
  {
    id: 'vw-caddy-sb-maxi',
    bezeichnung: 'VW Caddy SB · Maxi',
    modell: 'VW Caddy SB',
    variante: 'Maxi',
    baujahre: '2020–2025',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.863,
      quellenstufe: 'A',
      quelle:
        'Volkswagen Nutzfahrzeuge Österreich, Technische Daten Caddy (Motorisierungstabelle) — die vollständige URL steht nicht im Quellenverzeichnis des Berichts',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Motorisierungsabhängig: 4.863 mm für 1.5 TSI, TSI DSG und 1.5 TSI eHybrid, 4.853 mm ' +
        'für 2.0 TDI und TDI DSG; VW Deutschland nennt einheitlich 4.853 mm. Weil der Eintrag ' +
        'beide Motorisierungen abdeckt, steht hier der größere, konservative Wert. Die URL der ' +
        'Quelle fehlt im Recherchebericht und ist nachzutragen. Siehe OFFEN-13.',
    },
    hoehe: {
      wert: 1.8,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Ohne Dachreling, aus der Maßzeichnung von VW Deutschland. VW Österreich nennt für ' +
        'dieselbe Karosserie 1.818 mm — die konservative Lesart wäre dieser Wert. Der frühere ' +
        'Bestandswert 1,842 m ist entfallen. Siehe OFFEN-14.',
    },
    hoeheMitDachreling: {
      wert: 1.836,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Mit Dachreling — der Wert, den ein real ausgeliefertes Fahrzeug meist trägt.',
    },
    breiteOhneSpiegel: {
      wert: 1.855,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Von der Tabelle zum Modelljahr 2026 als unverändert bestätigt.',
    },
    breiteMitSpiegeln: {
      wert: 2.1,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Eigene Tabellenzeile „Max. Breite inkl. Außenspiegel", getrennt von 1.931 mm mit ' +
        'angeklappten Spiegeln; vom ADAC zusätzlich selbst gemessen.',
    },
    hoeheHeckOffen: {
      wert: 2.178,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Strittiger Wert, für kein Urteil belastbar. VW nennt für den Maxi 2.178 mm („Caddy – ' +
        'Technische Daten", Stand 03/2025, in sechs Ausstattungstabellen) und 2.155 mm in der ' +
        'Tabelle zum Modelljahr 2026. Dass die 2.178 mm den Stand vor der Modellpflege und die ' +
        '2.155 mm den Stand 2026 beschreiben, ist eine Interpretation des Projekts und keine ' +
        'Aussage von VW. Die Gegenprüfung hat gegen die 2.178 mm einen Konsistenzeinwand aus ' +
        'VWs eigenen Zahlen erhoben: Der Abstand von der Dachhöhe zur Heckklappenhöhe beträgt ' +
        'bei allen übrigen Zeilen 322–328 mm, hier dagegen 342 mm; rechnerisch käme man auf ' +
        'rund 2.158 mm, und die einzige VW-unabhängige Angabe (kofferraum-check.de) nennt ' +
        '2,16 m. Siehe OFFEN-12.',
    },
    ladelaenge: {
      wert: 2.265,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Wert. Der frühere Bestandswert 2,150 m war die Ladelänge des Kastenwagens Caddy ' +
        'Cargo Maxi. Siehe OFFEN-14.',
    },
    ladebreiteRadkasten: {
      wert: 1.185,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Pkw-Wert; 1.230 mm gelten für den Kastenwagen. Siehe OFFEN-14.',
    },
    innenhoeheLaderaum: {
      wert: 1.211,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Wert; die früher geführten 1,275 m und der Korrekturvorschlag 1,264 m sind beide ' +
        'Cargo-Maxi-Werte. Siehe OFFEN-14.',
    },
    notiz:
      'Referenzfahrzeug des Projekts und der einzige Eintrag mit durchgängigem ' +
      'Herstellerdatenblatt. Über Budget. Die Höhe bei geöffneter Heckklappe ist der ' +
      'empfindlichste Wert des ganzen Katalogs und mit 2.155 gegen 2.178 mm nicht gesichert ' +
      '(OFFEN-12); klären lässt sie sich nur durch eigenes Messen am Fahrzeug.',
  },
  /*
   * Caddy SB Maxi nach der Modellpflege 2026 — neuer Eintrag, abgetrennt vom Stand 2020–2025.
   *
   * Anlass ist die Heckklappenhöhe: Die 2.155 mm der VW-Tabelle zum Modelljahr 2026 stehen
   * hier, die 2.178 mm der Datenblätter mit Stand 03/2025 im Eintrag davor. Diese Zuordnung
   * ist eine Deutung des Projekts, kein Herstellerbefund (OFFEN-12). Technisch ist es
   * weiterhin der Typ SB: überarbeitete Frontschürze, neuer Stoßfänger, größeres Display — die
   * Karosseriemaße ändern sich um wenige Millimeter. Die Quelle der MY2026-Zahlen ist im
   * Recherchebericht ohne URL geführt.
   */
  {
    id: 'vw-caddy-sb-maxi-mopf',
    bezeichnung: 'VW Caddy SB · Maxi (Modellpflege 2026)',
    modell: 'VW Caddy SB',
    variante: 'Maxi (Modellpflege 2026)',
    baujahre: '2026',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.851,
      quellenstufe: 'A',
      quelle:
        'VW, Technische Daten Caddy, Tabelle zum Modelljahr 2026 (Showroom) — die vollständige URL steht nicht im Quellenverzeichnis des Berichts',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Modellpflegestand 2026; davor 4.853 mm. Die Modellpflege verlängert das Fahrzeug ' +
        'nicht. Ob die motorisierungsabhängige Differenz (VW Österreich: 4.863 mm für die ' +
        'Benziner, 4.853 mm für die Diesel) auch für MY2026 gilt, ist nicht belegt — ein ' +
        'Benziner kann rund 10 mm länger sein. Ein konservativer Wert ist hier deshalb nicht ' +
        'belegbar, es steht die einzige veröffentlichte MY2026-Zahl. Die URL der Quelle fehlt ' +
        'im Bericht. Siehe OFFEN-13.',
    },
    hoehe: {
      wert: 1.8,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Ohne Dachreling, aus der Maßzeichnung von VW Deutschland zum Stand vor der ' +
        'Modellpflege — die MY2026-Tabelle führt nur die Maximalhöhe. Übertragen, weil die ' +
        'Modellpflege ausschließlich die Front betrifft. VW Österreich nennt 1.818 mm. Siehe ' +
        'OFFEN-14.',
    },
    hoeheMitDachreling: {
      wert: 1.829,
      quellenstufe: 'A',
      quelle:
        'VW, Technische Daten Caddy, Tabelle zum Modelljahr 2026 (Showroom) — die vollständige URL steht nicht im Quellenverzeichnis des Berichts',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Zeile „Höhe max." der MY2026-Tabelle, davor 1.836 mm. Der Vorgängerwert ist von VW ' +
        'ausdrücklich als Wert mit Dachreling ausgewiesen, deshalb steht die Zahl hier und ' +
        'nicht im Feld hoehe. Die URL der Quelle fehlt im Bericht.',
    },
    breiteOhneSpiegel: {
      wert: 1.855,
      quellenstufe: 'A',
      quelle:
        'VW, Technische Daten Caddy, Tabelle zum Modelljahr 2026 (Showroom) — die vollständige URL steht nicht im Quellenverzeichnis des Berichts',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Gegenüber dem Stand davor unverändert. Die URL der Quelle fehlt im Bericht.',
    },
    breiteMitSpiegeln: {
      wert: 2.1,
      quellenstufe: 'A',
      quelle:
        'VW, Technische Daten Caddy, Tabelle zum Modelljahr 2026 (Showroom) — die vollständige URL steht nicht im Quellenverzeichnis des Berichts',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Unverändert; neu ausgewiesen sind 1.931 mm mit angeklappten Spiegeln. Die URL der ' +
        'Quelle fehlt im Bericht.',
    },
    hoeheHeckOffen: {
      wert: 2.155,
      quellenstufe: 'A',
      quelle:
        'VW, Technische Daten Caddy, Tabelle zum Modelljahr 2026 (Showroom) — die vollständige URL steht nicht im Quellenverzeichnis des Berichts',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'VW nennt für den Maxi zwei Werte: 2.155 mm in dieser MY2026-Tabelle und 2.178 mm in ' +
        '„Caddy – Technische Daten", Stand 03/2025. Dass die 2.155 mm den Modellpflegestand ' +
        'und die 2.178 mm den Stand davor beschreiben, ist eine Interpretation des Projekts ' +
        'und keine Aussage von VW — die Modellpflege betrifft die Front, nicht das Heck. Für ' +
        'die 2.155 mm spricht der Konsistenzeinwand der Gegenprüfung gegen die 2.178 mm: Der ' +
        'Abstand von der Dachhöhe zur Heckklappenhöhe beträgt bei allen übrigen Zeilen ' +
        '322–328 mm, bei den 2.178 mm dagegen 342 mm; kofferraum-check.de nennt für denselben ' +
        'Typ 2,16 m. Die URL der Quelle fehlt im Bericht. Siehe OFFEN-12.',
    },
    ladelaenge: {
      wert: 2.265,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Wert des Stands vor der Modellpflege; für MY2026 führt der Bericht keine eigenen ' +
        'Innenmaße, und die Modellpflege betrifft ausschließlich die Front. Siehe OFFEN-14.',
    },
    ladebreiteRadkasten: {
      wert: 1.185,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Pkw-Wert des Stands vor der Modellpflege. Siehe OFFEN-14.',
    },
    innenhoeheLaderaum: {
      wert: 1.211,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Pkw-Wert des Stands vor der Modellpflege. Siehe OFFEN-14.',
    },
    notiz:
      'Modellpflege des Typs SB: neue Frontschürze, neuer Stoßfänger, 12,9-Zoll-Display. An ' +
      'der Karosserie ändern sich nur Millimeter, für die Einparkfrage ist die Modellpflege ' +
      'folgenlos. Laut ADAC läuft die Baureihe im Juli 2026 aus. Über Budget.',
  },
  /*
   * Caddy California, Werksausbau auf der Caddy-Maxi-Pkw-Karosserie. Die Höhe steht doppelt:
   * 1.835 mm mit Antennenfuß, aber ohne Dachreling, 1.836 mm mit Reling. Alle Innenmaße
   * beschreiben die leere Karosserie ohne Bettmodul und Küchenblock (OFFEN-16). Die Höhe bei
   * geöffneter Heckklappe fehlt: Die California-Maßzeichnung führt nur die Hecköffnung, und der
   * vom Caddy Maxi übertragene Wert wäre selbst strittig.
   */
  {
    id: 'vw-caddy-california',
    bezeichnung: 'VW Caddy California · Werksausbau',
    modell: 'VW Caddy California',
    variante: 'Werksausbau',
    baujahre: '2020+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.863,
      quellenstufe: 'A',
      quelle:
        'Volkswagen Nutzfahrzeuge Österreich, Technische Daten Caddy California (Motorisierungstabelle) — die vollständige URL steht nicht im Quellenverzeichnis des Berichts',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Motorisierungsabhängig wie beim Caddy Maxi: 4.863 mm für 1.5 TSI, TSI DSG und ' +
        '1.5 TSI eHybrid, 4.853 mm für 2.0 TDI und TDI DSG. Weil der Eintrag beide ' +
        'Motorisierungen abdeckt, steht hier der größere, konservative Wert; der bisherige ' +
        'Bestandswert 4,853 m war der Dieselwert. Der California ist also nicht konstruktiv ' +
        'kürzer als der Caddy Maxi. Die URL der Quelle fehlt im Bericht. Siehe OFFEN-13.',
    },
    hoehe: {
      wert: 1.835,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/download/technische-zeichnungen/caddy-california/Caddy-California.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Maxi-Karosserie, ohne Dachreling, aber einschließlich Antennenfuß. Mit einem ' +
        'Aufstelldach oder Dachträger gilt keiner der beiden Höhenwerte. Siehe OFFEN-16.',
    },
    hoeheMitDachreling: {
      wert: 1.836,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/download/technische-zeichnungen/caddy-california/Caddy-California.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Nur 1 mm über dem Wert mit Antennenfuß.',
    },
    breiteOhneSpiegel: {
      wert: 1.855,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Wert der baugleichen Caddy-Maxi-Pkw-Karosserie — der Bericht führt für den California ' +
        'kein eigenes Breitenmaß. Übertragung, kein California-Datenblattwert.',
    },
    breiteMitSpiegeln: {
      wert: 2.1,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/de/modelle/vorgaengermodelle-und-oldtimer/vorgaengermodelle/caddy/technische-daten/technische-daten-caddy.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Wert der baugleichen Caddy-Maxi-Pkw-Karosserie, Spiegel ausgeklappt; angeklappt ' +
        '1.931 mm. Übertragung, kein California-Datenblattwert.',
    },
    ladelaenge: {
      wert: 2.265,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/download/technische-zeichnungen/caddy-california/Caddy-California.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Gepäckraumbodenlänge der leeren Karosserie. Der California hat ab Werk Bettmodul, ' +
        'Küchenblock und Schubladen verbaut; VW veröffentlicht dafür nur die Liegefläche, kein ' +
        'Ladelängenmaß. Der frühere Bestandswert 2,150 m war der Cargo-Maxi-Wert. Siehe ' +
        'OFFEN-16.',
    },
    ladebreiteRadkasten: {
      wert: 1.185,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/download/technische-zeichnungen/caddy-california/Caddy-California.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Leere Karosserie; 1,230 m war der Cargo-Wert. Der Ausbau verengt den nutzbaren Raum. ' +
        'Siehe OFFEN-16.',
    },
    innenhoeheLaderaum: {
      wert: 1.211,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/download/technische-zeichnungen/caddy-california/Caddy-California.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Leere Karosserie; 1,275 m war der Cargo-Maxi-Wert. Siehe OFFEN-16.',
    },
    notiz:
      'Werksausbau mit Bett 198×107 cm. 35.000–46.000 € — weit über Budget. Die Innenmaße ' +
      'beschreiben die leere Karosserie, nicht den ausgebauten Wagen; bei Aufstelldach oder ' +
      'Dachträger gilt außerdem keiner der Höhenwerte (OFFEN-16).',
  },

  /**
   * Kastenwagen, kein Pkw: Die Breite zwischen den Radkästen von 1.218 mm belegt es
   * (Pkw: 1.121 mm), deshalb trägt der Eintrag jetzt „Rapid“ im Namen. Für die kurze
   * Pkw-Variante ist einzig die Länge 4.304 mm belegt — ein Eintrag mit einem einzigen
   * Maß wäre wertlos und unterbleibt. Siehe OFFEN-20.
   */
  {
    id: 'renault-kangoo-ii-kurz-l1',
    bezeichnung: 'Renault Kangoo II · Rapid L1 (Kastenwagen)',
    modell: 'Renault Kangoo II',
    variante: 'Rapid L1 (Kastenwagen)',
    baujahre: '2007–2021',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.282,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bisher 4,321 m — das war die Länge des baugleich vermarkteten Mercedes Citan W415 ' +
        '(OFFEN-41). Die Baujahresspanne überspannt das Facelift 2013: Der Vorfacelift-Express ' +
        'misst 4.213 mm, 4.282 mm ist damit die konservative Obergrenze (OFFEN-20).',
    },
    hoehe: {
      wert: 1.844,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Kastenwagen, Höhe ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.829,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
    },
    breiteMitSpiegeln: {
      wert: 2.138,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Spiegel ausgeklappt (+309 mm gegenüber der Breite ohne Spiegel).',
    },
    ladelaenge: {
      wert: 1.731,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Maß Z2, Laderaumlänge am Boden.',
    },
    ladebreiteRadkasten: {
      wert: 1.218,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Kastenwagenwert; die Pkw-Variante hat an derselben Stelle 1.121 mm (OFFEN-20).',
    },
    innenhoeheLaderaum: {
      wert: 1.129,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bisher 1.258 mm — ein Mercedes-Citan-Wert, der bei allen drei Kangoo-II-Einträgen ' +
        'identisch stand (OFFEN-41). Renault nennt durchgängig 1.129 mm.',
    },
    notiz:
      'Ladelänge zu kurz. Serienmäßig zweiflügelige, seitlich schwenkende Hecktüren — eine ' +
      'Höhe bei geöffneter Heckklappe existiert konstruktiv nicht und fehlt deshalb, das ist ' +
      'kein Rechercheausfall. Für die kurze Pkw-Variante liegt nur die Länge 4.304 mm vor, ' +
      'deshalb gibt es dafür keinen eigenen Katalogeintrag.',
  },
  /**
   * Sämtliche Maße stammen jetzt aus der Renault-Preisliste statt aus dem
   * vehikit-Kastenwagen-Datenblatt. Die bisherige Länge 4,705 m gehörte zum Mercedes
   * Citan W415 extralang (OFFEN-41).
   */
  {
    id: 'renault-kangoo-ii-maxi-l2-kastenwagen',
    bezeichnung: 'Renault Kangoo II · Maxi (L2, Kastenwagen)',
    modell: 'Renault Kangoo II',
    variante: 'Maxi (L2, Kastenwagen)',
    baujahre: '2007–2021',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.666,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bisher 4,705 m — das war die Länge des Mercedes Citan W415 extralang (OFFEN-41). ' +
        'Die Baujahresspanne überspannt das Facelift 2013 (OFFEN-20).',
    },
    hoehe: {
      wert: 1.836,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Kastenwagen, Höhe ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.829,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
    },
    breiteMitSpiegeln: {
      wert: 2.138,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Spiegel ausgeklappt (+309 mm gegenüber der Breite ohne Spiegel).',
    },
    ladelaenge: {
      wert: 2.115,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Maß Z2, Laderaumlänge am Boden.',
    },
    ladebreiteRadkasten: {
      wert: 1.218,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
    },
    innenhoeheLaderaum: {
      wert: 1.129,
      quellenstufe: 'A',
      quelle:
        'https://renault-ahrens.de/wp-content/uploads/2021/03/renault-nfz_kangoo-rapid_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bisher 1.258 mm aus derselben Citan-Verwechslung wie beim L1 (OFFEN-41).',
    },
    notiz:
      'Kastenwagen mit serienmäßigen Heckflügeltüren — eine Höhe bei geöffneter Heckklappe ' +
      'existiert konstruktiv nicht. Die Maße stammen aus der Renault-Preisliste, nicht mehr ' +
      'aus dem vehikit-Datenblatt.',
  },
  /**
   * Die Dachreling ist hier keine Option: ab Sondermodell Paris und bei Luxe serienmäßig
   * (OFFEN-21). `hoehe` führt deshalb den Wert ohne Reling, `hoeheMitDachreling` den
   * Serienwert dieser Ausstattungen — ein realer Gebrauchtwagen trägt sie mit hoher
   * Wahrscheinlichkeit.
   */
  {
    id: 'renault-grand-kangoo-pkw-langversion',
    bezeichnung: 'Renault Grand Kangoo · PKW-Langversion',
    modell: 'Renault Grand Kangoo',
    variante: 'PKW-Langversion',
    baujahre: '2013–2021',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.688,
      quellenstufe: 'A',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert; die Recherche hat ihn weder korrigiert noch neu belegt, eine URL liegt ' +
        'nicht vor.',
    },
    hoehe: {
      wert: 1.802,
      quellenstufe: 'A',
      quelle:
        'https://www.kadomo.de/files/kadomo_templates/img/aktionen/Renault-Kangoo-Rolli-In/Renault_Kangoo_2013_Broschuere.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Höhe unbeladen ohne Dachreling. Die Reling ist ab Sondermodell Paris und bei Luxe ' +
        'serienmäßig; für diese Fahrzeuge gilt der Wert nicht (OFFEN-21).',
    },
    hoeheMitDachreling: {
      wert: 1.866,
      quellenstufe: 'A',
      quelle:
        'https://www.kadomo.de/files/kadomo_templates/img/aktionen/Renault-Kangoo-Rolli-In/Renault_Kangoo_2013_Broschuere.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Die Broschüre nennt 1.861 bzw. 1.866 mm; eingetragen ist der konservative Wert ' +
        '(OFFEN-21).',
    },
    breiteOhneSpiegel: {
      wert: 1.829,
      quellenstufe: 'A',
      quelle:
        'https://www.kadomo.de/files/kadomo_templates/img/aktionen/Renault-Kangoo-Rolli-In/Renault_Kangoo_2013_Broschuere.pdf',
      abgerufenAm: '2026-08-06',
    },
    breiteMitSpiegeln: {
      wert: 2.138,
      quellenstufe: 'A',
      quelle:
        'https://www.kadomo.de/files/kadomo_templates/img/aktionen/Renault-Kangoo-Rolli-In/Renault_Kangoo_2013_Broschuere.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Spiegel ausgeklappt; der ADAC misst am selben Wagen 2,135 m (Stufe B).',
    },
    ladelaenge: {
      wert: 2.21,
      quellenstufe: 'A',
      quelle:
        'https://www.kadomo.de/files/kadomo_templates/img/aktionen/Renault-Kangoo-Rolli-In/Renault_Kangoo_2013_Broschuere.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Mit umgeklappter zweiter Sitzreihe; mit umgeklapptem Beifahrersitz bis 2.850 mm.',
    },
    ladebreiteRadkasten: {
      wert: 1.144,
      quellenstufe: 'A',
      quelle:
        'https://www.kadomo.de/files/kadomo_templates/img/aktionen/Renault-Kangoo-Rolli-In/Renault_Kangoo_2013_Broschuere.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Pkw-Wert — deutlich schmaler als die 1.218 mm des Kastenwagens.',
    },
    innenhoeheLaderaum: {
      wert: 1.129,
      quellenstufe: 'A',
      quelle:
        'https://www.kadomo.de/files/kadomo_templates/img/aktionen/Renault-Kangoo-Rolli-In/Renault_Kangoo_2013_Broschuere.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bisher 1.258 mm — ein Mercedes-Citan-Wert (OFFEN-41).',
    },
    notiz:
      'EMPFEHLUNG. Renault-Originalbroschüre 2013: 2.210 mm Ladelänge mit umgeklappter zweiter ' +
      'Reihe, bis 2.850 mm mit umgeklapptem Beifahrersitz. Radkastenbreite nur 1.144 mm. Die ' +
      'Broschüre führt die Zeile „Höhe bei geöffneter Heckklappe“ ausdrücklich und trägt für ' +
      'den Grand Kangoo einen Strich ein — das Maß fehlt hier als belastbares Negativergebnis, ' +
      'nicht aus Recherchemangel.',
  },
  /**
   * Höhe und Ladelänge stammen aus der Rapid-Preisliste vom 26.07.2024, beschreiben also
   * den Kastenwagen. Die dort zusätzlich genannte Gesamthöhe mit Antenne (1.893 mm) steht
   * bewusst nur in der Bemerkung — kein Fahrzeugkatalog rechnet Antennen in die Höhe ein
   * (OFFEN-19).
   */
  {
    id: 'renault-kangoo-iii-l1',
    bezeichnung: 'Renault Kangoo III · L1',
    modell: 'Renault Kangoo III',
    variante: 'L1',
    baujahre: '2021+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.486,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert; von der Recherche nicht neu belegt, keine URL vorhanden.',
    },
    hoehe: {
      wert: 1.864,
      quellenstufe: 'A',
      quelle: 'https://novotruck.eu/fileadmin/redaktion/dl-nt/kangoo_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Gesamthöhe unbeladen, Kastenwagen, ohne Antenne. Dieselbe Preisliste nennt 1.893 mm ' +
        'Gesamthöhe mit Antenne; eine Antenne hat jedes ausgelieferte Fahrzeug, und bei einem ' +
        'Schwingtor, das über das Dach fegt, sind die 29 mm relevant (OFFEN-19).',
    },
    breiteOhneSpiegel: {
      wert: 1.86,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert; von der Recherche nicht neu belegt, keine URL vorhanden.',
    },
    breiteMitSpiegeln: {
      wert: 2.159,
      quellenstufe: 'A',
      quelle: 'https://novotruck.eu/fileadmin/redaktion/dl-nt/kangoo_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'In der Preisliste vom 26.07.2024 für L1 und L2 verifiziert.',
    },
    ladelaenge: {
      wert: 1.81,
      quellenstufe: 'A',
      quelle: 'https://novotruck.eu/fileadmin/redaktion/dl-nt/kangoo_preisliste.pdf',
      abgerufenAm: '2026-08-06',
    },
    ladebreiteRadkasten: {
      wert: 1.248,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert; von der Recherche nicht neu belegt, keine URL vorhanden.',
    },
    innenhoeheLaderaum: {
      wert: 1.215,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert; von der Recherche nicht neu belegt, keine URL vorhanden.',
    },
    notiz:
      'Zu neu und zu teuer, Ladelänge zu kurz. Die belegten Maße stammen aus der ' +
      'Rapid-Preisliste, beschreiben also den Kastenwagen mit zweiflügeliger Hecktür — eine ' +
      'Höhe bei geöffneter Heckklappe existiert dort konstruktiv nicht.',
  },
  /**
   * Neu: Pkw-Hälfte der Aufteilung des bisherigen Eintrags „Grand Kangoo L2 neue Gen.“,
   * der Pkw- und Kastenwagenmaße mischte (OFFEN-17). Hier stehen ausschließlich
   * Pkw-Werte; die Laderaummaße des alten Eintrags gehörten zum Rapid L2 und fehlen
   * deshalb.
   */
  {
    id: 'renault-grand-kangoo-l2-pkw',
    bezeichnung: 'Renault Grand Kangoo · L2 Pkw (neue Gen.)',
    modell: 'Renault Grand Kangoo',
    variante: 'L2 Pkw (neue Gen.)',
    baujahre: '2021+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.91,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert; von der Recherche nicht neu belegt, keine URL vorhanden.',
    },
    hoehe: {
      wert: 1.815,
      quellenstufe: 'A',
      quelle: 'Renault Deutschland und Renault Österreich, Technische Daten Grand Kangoo Pkw',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'renault.de und renault.at nennen übereinstimmend 1.815 mm für die Pkw-Variante; die ' +
        'vollständigen URLs stehen nicht im Quellenverzeichnis der Recherche. Die bisher ' +
        'eingetragenen 1.854 mm sind der Wert des Kastenwagens Rapid L2 (OFFEN-17).',
    },
    breiteOhneSpiegel: {
      wert: 1.86,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert; von der Recherche nicht neu belegt, keine URL vorhanden.',
    },
    breiteMitSpiegeln: {
      wert: 2.159,
      quellenstufe: 'A',
      quelle: 'https://novotruck.eu/fileadmin/redaktion/dl-nt/kangoo_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Drei offizielle Renault-Quellen, 19 mm Unterschied, nicht auflösbar: renault.de nennt ' +
        'für dieselbe Pkw-Variante „Breite über alles (inklusive Außenspiegel) 2140“, ' +
        'renault.at und die Renault-Deutschland-Preisliste vom 26.07.2024 dagegen 2.159 mm. ' +
        'Eingetragen ist der konservative Wert 2,159 m (OFFEN-18).',
    },
    hoeheHeckOffen: {
      wert: 2.071,
      quellenstufe: 'A',
      quelle: 'Renault Deutschland und Renault Österreich, Technische Daten Grand Kangoo Pkw',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Nur der Pkw hat eine Heckklappe; von renault.de und renault.at übereinstimmend ' +
        'belegt, die vollständigen URLs fehlen im Quellenverzeichnis. Zusammen mit der ' +
        'richtigen Höhe 1.815 mm ergibt sich ein Überstand der offenen Klappe von 256 mm — ' +
        'mit den früher eingetragenen 1.854 mm wären es fälschlich 217 mm (OFFEN-17).',
    },
    notiz:
      'Aus dem bisherigen Eintrag „L2 neue Gen.“ abgetrennt, der Pkw- und Kastenwagenmaße ' +
      'mischte. Namensfalle: gleicher Name wie die Zielgeneration, aber andere Maße. Die ' +
      'Laderaummaße fehlen bewusst — die bisherigen Werte (2.230 / 1.248 / 1.215 mm) stammen ' +
      'vom Kastenwagen Rapid L2 und gelten hinter dessen Trennwand.',
  },
  /**
   * Neu: Kastenwagen-Hälfte derselben Aufteilung (OFFEN-17). Trägt die Höhe 1.854 mm und
   * die Laderaummaße des alten Mischeintrags, aber kein Heckklappenmaß — Flügeltüren.
   * Die Länge ist der Bestandswert der Pkw-Variante; eine eigene Rapid-L2-Länge nennt die
   * Recherche nicht.
   */
  {
    id: 'renault-grand-kangoo-l2-rapid',
    bezeichnung: 'Renault Grand Kangoo · Rapid L2 (Kastenwagen, neue Gen.)',
    modell: 'Renault Grand Kangoo',
    variante: 'Rapid L2 (Kastenwagen, neue Gen.)',
    baujahre: '2021+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.91,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert des bisherigen Mischeintrags, den die Recherche der Pkw-Variante ' +
        'zuordnet. Eine eigene Länge des Rapid L2 ist nicht belegt; der Wert ist hier als ' +
        'Näherung zu lesen und vor einer Kaufentscheidung nachzuschlagen (OFFEN-17).',
    },
    hoehe: {
      wert: 1.854,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert, von der Recherche als Wert des Kastenwagens Grand Kangoo Rapid L2 ' +
        'identifiziert; eine Primärquelle nennt der Bericht dafür nicht, eine URL liegt nicht ' +
        'vor (OFFEN-17).',
    },
    breiteOhneSpiegel: {
      wert: 1.86,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert; von der Recherche nicht neu belegt, keine URL vorhanden.',
    },
    breiteMitSpiegeln: {
      wert: 2.159,
      quellenstufe: 'A',
      quelle: 'https://novotruck.eu/fileadmin/redaktion/dl-nt/kangoo_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'In der Preisliste vom 26.07.2024 für L1 und L2 verifiziert.',
    },
    ladelaenge: {
      wert: 2.23,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert, laut Recherche hinter der Trennwand des Kastenwagens gemessen; keine ' +
        'Primärquelle und keine URL im Bericht (OFFEN-17).',
    },
    ladebreiteRadkasten: {
      wert: 1.248,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert, laut Recherche Kastenwagen ohne Innenverkleidung; zwischen Pkw und ' +
        'Kasten zeigt die Vorgängergeneration 74 mm Unterschied (OFFEN-17).',
    },
    innenhoeheLaderaum: {
      wert: 1.215,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf“, Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert, laut Recherche hinter der Trennwand des Kastenwagens gemessen; keine ' +
        'Primärquelle und keine URL im Bericht (OFFEN-17).',
    },
    notiz:
      'Aus dem bisherigen Eintrag „L2 neue Gen.“ abgetrennt (OFFEN-17). Kastenwagen mit ' +
      'zweiflügeliger Hecktür — eine Höhe bei geöffneter Heckklappe existiert konstruktiv ' +
      'nicht. Alle Werte außer der Spiegelbreite sind Bestandswerte ohne Primärquelle; dieser ' +
      'Eintrag ist der schwächer belegte der beiden Hälften.',
  },

  /*
   * B9 M: Alle drei Laderaummaße entfallen. Die Bestandswerte stammten aus einer reinen
   * Kastenwagen-Tabelle, und für die Pkw-Variante der B9-Generation gibt es keine Gegenwerte.
   * Die Höhe bleibt beim Bestandswert — die Absenkung auf 1,801 m ist verworfen.
   */
  {
    id: 'berlingo-multispace-partner-tepee-b9-m-l1',
    bezeichnung: 'Berlingo Multispace / Partner Tepee · B9 M (L1)',
    modell: 'Berlingo Multispace / Partner Tepee',
    variante: 'B9 M (L1)',
    baujahre: '2008–2018',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.38,
      quellenstufe: 'C',
      quelle: 'Citroën-UK-Broschüre Berlingo Multispace (Recherchebericht 06.08.2026)',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Broschüre nennt 4380/1810/1852; keine URL im Quellenverzeichnis.',
    },
    hoehe: {
      wert: 1.862,
      quellenstufe: 'C',
      quelle: 'Citroën-Preisliste Berlingo Multispace, Stand 01.08.2016',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert; die Absenkung auf 1,801 m ist verworfen. Die Preisliste nennt nur die ' +
        'Spanne 1.801–1.862 mm, die UK-Broschüre 1.852 mm für die Standardlinie und 1.862 mm ' +
        'nur für XTR. Ob der Wert eine Dachreling einschließt, ist ungeklärt — markenabhängige ' +
        'Höhen, siehe OFFEN-22 und OFFEN-24. Keine URL im Quellenverzeichnis.',
    },
    breiteOhneSpiegel: {
      wert: 1.81,
      quellenstufe: 'C',
      quelle: 'Citroën-UK-Broschüre Berlingo Multispace (Recherchebericht 06.08.2026)',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Keine URL im Quellenverzeichnis.',
    },
    breiteMitSpiegeln: {
      wert: 2.112,
      quellenstufe: 'C',
      quelle: 'Bestandswert des Katalogs, Herkunft nicht dokumentiert',
      abgerufenAm: '2026-08-06',
      bemerkung: 'In der Recherche vom 06.08.2026 nicht geprüft; keine Quelle nachgewiesen.',
    },
    notiz:
      'Laderaummaße sind für die Pkw-Variante der B9-Generation nicht veröffentlicht. Die ' +
      'früheren Zahlen (1.800 / 1.250 / 1.148 mm) stammten aus einer Kastenwagen-Tabelle; die ' +
      'bisherige Aussage „Ladelänge zu kurz“ ist damit nicht mehr belegt (OFFEN-25).',
  },
  /*
   * B9 XL: Der Eintrag mit der dünnsten Datenlage der Gruppe. Belegt ist allein die Länge, und
   * die nur als Kastenwagen L2. Höhe ist ein ungedeckter Bestandswert (Pflichtfeld), beide
   * Breiten entfallen — der Eintrag ist auf der Breitenachse damit nicht prüfbar (OFFEN-23).
   */
  {
    id: 'berlingo-multispace-xl-partner-tepee-l2-b9-xl-l2',
    bezeichnung: 'Berlingo Multispace XL / Partner Tepee L2 · B9 XL (L2)',
    modell: 'Berlingo Multispace XL / Partner Tepee L2',
    variante: 'B9 XL (L2)',
    baujahre: '2008–2018',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.63,
      quellenstufe: 'C',
      quelle: 'Vehikit-Maßtabelle Berlingo / Partner L2 (Recherchebericht 06.08.2026)',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Ausschließlich als Kastenwagen L2 belegt; cars-data nennt für den Multispace eine ' +
        'Spanne bis 4.628 mm. Keine URL im Quellenverzeichnis. Siehe OFFEN-23.',
    },
    hoehe: {
      wert: 1.867,
      quellenstufe: 'C',
      quelle: 'Bestandswert des Katalogs, für die lange B9-Variante durch keine Quelle gedeckt',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Nur beibehalten, weil die Höhe Pflichtfeld ist. Weder die deutsche Citroën-Preisliste ' +
        'Multispace noch der ADAC-Autokatalog führen eine XL-Pkw-Version, die diesen Wert ' +
        'stützen würde (OFFEN-23). Messkonvention mit oder ohne Dachreling ungeklärt; ' +
        'markenabhängige Höhen, siehe OFFEN-22 und OFFEN-24.',
    },
    notiz:
      'Vor einer Kaufentscheidung ist zuerst zu klären, ob es diesen Wagen als Pkw in ' +
      'Deutschland überhaupt gab (OFFEN-23) — belegt ist nur die Länge, und die stammt vom ' +
      'Kastenwagen L2. Die Höhe ist ein ungedeckter Bestandswert, beide Breiten sind ersatzlos ' +
      'entfallen. Auch die frühere Aussage „niedrigster Laderaum des Katalogs (1148 mm)“ ist ' +
      'hinfällig: Sie stützte sich auf einen Kastenwagenwert.',
  },
  /*
   * K9 M: Laderaummaße jetzt aus der Pkw-Preisliste von Toyota statt aus der Citroën-
   * Kastenwagenliste. Der Eintrag deckt vier Marken ab, die Höhe bleibt deshalb beim
   * konservativen Bestandswert (Citroën 1.844, Opel 1.841, Toyota 1.880 mit Dachreling).
   */
  {
    id: 'berlingo-rifter-combo-life-proace-city-k9-m-l1',
    bezeichnung: 'Berlingo / Rifter / Combo Life / Proace City · K9 M (L1)',
    modell: 'Berlingo / Rifter / Combo Life / Proace City',
    variante: 'K9 M (L1)',
    baujahre: '2018+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.403,
      quellenstufe: 'C',
      quelle: 'Bestandswert des Katalogs, Herkunft nicht dokumentiert',
      abgerufenAm: '2026-08-06',
      bemerkung: 'In der Recherche vom 06.08.2026 nicht geprüft.',
    },
    hoehe: {
      wert: 1.874,
      quellenstufe: 'C',
      quelle: 'Bestandswert des Katalogs, Herkunft nicht dokumentiert',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert; die Absenkung auf 1,812 m ist verworfen — das ist ein markenspezifischer ' +
        'Toyota-Wert, der Eintrag deckt aber vier Marken ab: Citroën 1.844, Opel 1.841, Toyota ' +
        '1.880 mit und 1.812 ohne Dachreling. Ob der Wert eine Reling einschließt, ist damit ' +
        'ungeklärt. Markenabhängige Höhen, siehe OFFEN-22 und OFFEN-24.',
    },
    breiteOhneSpiegel: {
      wert: 1.848,
      quellenstufe: 'C',
      quelle: 'Bestandswert des Katalogs, Herkunft nicht dokumentiert',
      abgerufenAm: '2026-08-06',
      bemerkung: 'In der Recherche vom 06.08.2026 nicht geprüft.',
    },
    breiteMitSpiegeln: {
      wert: 2.107,
      quellenstufe: 'C',
      quelle: 'Bestandswert des Katalogs, Herkunft nicht dokumentiert',
      abgerufenAm: '2026-08-06',
      bemerkung: 'In der Recherche vom 06.08.2026 nicht geprüft.',
    },
    ladelaenge: {
      wert: 1.88,
      quellenstufe: 'A',
      quelle: 'Toyota-Preisliste Proace City Verso, Stand 09/2022',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Wert hinter der 1. Sitzreihe; ersetzt den bisherigen Kastenwagenwert 1.781 mm. ' +
        'Gilt für den Toyota Proace City Verso — Berlingo, Rifter und Combo Life können ' +
        'abweichen (OFFEN-25). Zu dieser Preisliste steht keine URL im Quellenverzeichnis.',
    },
    ladebreiteRadkasten: {
      wert: 1.195,
      quellenstufe: 'A',
      quelle: 'Toyota-Preisliste Proace City Verso, Stand 09/2022',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Wert zwischen den Radkästen; ersetzt den Kastenwagenwert 1.229 mm. Gilt für den ' +
        'Proace City Verso, Schwestermodelle können abweichen (OFFEN-25). Keine URL im ' +
        'Quellenverzeichnis.',
    },
    innenhoeheLaderaum: {
      wert: 1.126,
      quellenstufe: 'A',
      quelle: 'Toyota-Preisliste Proace City Verso, Stand 09/2022',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Maximale Laderaumhöhe der Pkw-Variante; ersetzt den Kastenwagenwert 1.185 mm. Gilt ' +
        'für den Proace City Verso, Schwestermodelle können abweichen (OFFEN-25). Keine URL ' +
        'im Quellenverzeichnis.',
    },
    notiz:
      'Laderaumlänge hinter der ersten Sitzreihe nur 1,88 m — für eine durchgehende Liegefläche ' +
      'zu kurz. Die Höhe unterscheidet sich je nach Marke um bis zu 39 mm; eingetragen ist der ' +
      'konservative Wert.',
  },
  /*
   * K9 XL: wie K9 M, nur mit der langen Karosserie. Die Höhe 1,880 m ist bei drei Marken belegt
   * und bleibt gegen die 31 mm niedrigere ADAC-Angabe stehen — 1,849 m zeigt in die unsichere
   * Richtung.
   */
  {
    id: 'berlingo-xl-rifter-long-combo-xl-proace-city-l2-k9-xl-l2',
    bezeichnung: 'Berlingo XL / Rifter Long / Combo XL / Proace City L2 · K9 XL (L2)',
    modell: 'Berlingo XL / Rifter Long / Combo XL / Proace City L2',
    variante: 'K9 XL (L2)',
    baujahre: '2018+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.753,
      quellenstufe: 'C',
      quelle: 'Bestandswert des Katalogs, Herkunft nicht dokumentiert',
      abgerufenAm: '2026-08-06',
      bemerkung: 'In der Recherche vom 06.08.2026 nicht geprüft.',
    },
    hoehe: {
      wert: 1.88,
      quellenstufe: 'C',
      quelle: 'Bestandswert des Katalogs; gestützt durch Toyota-Preisliste, Citroën-Maßzeichnung',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert; die Absenkung auf 1,849 m (Stufe C) ist verworfen — ihr stehen drei ' +
        'Herstellerbelege für 1.880 mm gegenüber (Toyota-Preisliste, Citroën-Maßzeichnung ' +
        '1.796/1.880, Opel-Datenblatt). Die Stufe bleibt trotzdem C, weil ungeklärt ist, ob ' +
        '1.880 mm die Dachreling einschließt. Markenabhängige Höhen, siehe OFFEN-22 und ' +
        'OFFEN-24. Zu den Herstellerbelegen steht keine URL im Quellenverzeichnis.',
    },
    breiteOhneSpiegel: {
      wert: 1.848,
      quellenstufe: 'C',
      quelle: 'Bestandswert des Katalogs, Herkunft nicht dokumentiert',
      abgerufenAm: '2026-08-06',
      bemerkung: 'In der Recherche vom 06.08.2026 nicht geprüft.',
    },
    breiteMitSpiegeln: {
      wert: 2.107,
      quellenstufe: 'C',
      quelle: 'Bestandswert des Katalogs, Herkunft nicht dokumentiert',
      abgerufenAm: '2026-08-06',
      bemerkung: 'In der Recherche vom 06.08.2026 nicht geprüft.',
    },
    ladelaenge: {
      wert: 2.23,
      quellenstufe: 'A',
      quelle: 'Toyota-Preisliste Proace City Verso, Stand 09/2022',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Wert hinter der 1. Sitzreihe; ersetzt den bisherigen Kastenwagenwert 2.131 mm. ' +
        'Gilt für den Toyota Proace City Verso L2 — Berlingo XL, Rifter Long und Combo XL ' +
        'können abweichen (OFFEN-25). Keine URL im Quellenverzeichnis.',
    },
    ladebreiteRadkasten: {
      wert: 1.195,
      quellenstufe: 'A',
      quelle: 'Toyota-Preisliste Proace City Verso, Stand 09/2022',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw-Wert zwischen den Radkästen; ersetzt den Kastenwagenwert 1.229 mm. Gilt für den ' +
        'Proace City Verso, Schwestermodelle können abweichen (OFFEN-25). Keine URL im ' +
        'Quellenverzeichnis.',
    },
    innenhoeheLaderaum: {
      wert: 1.126,
      quellenstufe: 'A',
      quelle: 'Toyota-Preisliste Proace City Verso, Stand 09/2022',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Maximale Laderaumhöhe der Pkw-Variante; ersetzt den Kastenwagenwert 1.185 mm. Gilt ' +
        'für den Proace City Verso, Schwestermodelle können abweichen (OFFEN-25). Keine URL ' +
        'im Quellenverzeichnis.',
    },
    notiz:
      'Über Budget. Bei der Höhe ist bewusst die höhere Annahme eingetragen (1,880 m statt der ' +
      'ADAC-Angabe 1,849 m). Laderaumlänge hinter der ersten Sitzreihe 2,23 m.',
  },

  /*
   * Combo Tour und Doblò sind dieselbe Karosserie. Alle vier Einträge tragen
   * deshalb dieselben Innenmaße (FCA-Block „Kombi M1"), aber jede Marke behält
   * ihre eigene Längenangabe — die 16 mm Differenz sind systematisch, siehe
   * OFFEN-26. Ladelänge fehlt bei den Opel-Einträgen bewusst: Opels Tabelle
   * trägt für Combi und Combo Tour einen Strich ein.
   */
  {
    id: 'opel-combo-tour-doblo-basis-standard',
    bezeichnung: 'Opel Combo Tour · Doblo-Basis Standard',
    modell: 'Opel Combo Tour',
    variante: 'Doblo-Basis Standard',
    baujahre: '2012–2018',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.39,
      quellenstufe: 'A',
      quelle: 'https://www.opel-team-niedersachsen.de/media/files/Combo-D-08-2012-MY13.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Opel-Angabe. Fiat nennt für dieselbe Karosserie und denselben Radstand (2.755 mm) 4.406 m — systematische Konventions- oder Stoßfängerdifferenz, kein Fehler; Opel veröffentlicht keine Überhänge. Siehe OFFEN-26.',
    },
    hoehe: {
      wert: 1.845,
      quellenstufe: 'A',
      quelle: 'https://www.opel-team-niedersachsen.de/media/files/Combo-D-08-2012-MY13.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'ohne Dachgepäckträger und ohne Dachreling; mit Träger 1.895 mm, siehe OFFEN-29',
    },
    hoeheMitDachreling: {
      wert: 1.895,
      quellenstufe: 'A',
      quelle: 'https://www.opel-team-niedersachsen.de/media/files/Combo-D-08-2012-MY13.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Betriebsanleitung: „1845 / 1895", Fußnote „Ausführungen mit Dachgepäckträger". Das FCA-Datenblatt bestätigt für die Personenversion 1.845–1.895 mm mit Opt. 357 (Dachreling). Siehe OFFEN-29.',
    },
    breiteOhneSpiegel: {
      wert: 1.832,
      quellenstufe: 'A',
      quelle: 'https://www.opel-team-niedersachsen.de/media/files/Combo-D-08-2012-MY13.pdf',
      abgerufenAm: '2026-08-06',
    },
    breiteMitSpiegeln: {
      wert: 2.125,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/fiat/doblo/263/221789/',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Opels Betriebsanleitung nennt 2.119 mm, der ADAC für den baugleichen Fiat 2.125 mm. Vier baugleiche Einträge mit zwei Spiegelbreiten wären nicht haltbar; übernommen ist der konservative Wert. Siehe OFFEN-27.',
    },
    ladebreiteRadkasten: {
      wert: 1.12,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'FCA-Block „Kombi mit kurzem Radstand (M1)", Innenbreite. Opels Zeile „Laderaumbreite" (1.195 mm) ist dort die Außenbreite und misst nicht dasselbe. Siehe OFFEN-28.',
    },
    innenhoeheLaderaum: {
      wert: 1.25,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Personenversion (M1); 1.305 mm war der Wert des Kastenwagens',
    },
    notiz:
      'Baugleich mit dem Fiat Doblò. Opel weist für Combi und Combo Tour keine Ladelänge aus — die früher eingetragenen 1.820 mm sind ein Lieferwagenwert; beim baugleichen Fiat bleiben hinter der zweiten Sitzreihe nur 950 mm.',
  },
  {
    id: 'opel-combo-tour-maxi-doblo-basis-l2',
    bezeichnung: 'Opel Combo Tour Maxi · Doblo-Basis L2',
    modell: 'Opel Combo Tour Maxi',
    variante: 'Doblo-Basis L2',
    baujahre: '2012–2018',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.74,
      quellenstufe: 'A',
      quelle: 'https://www.opel-team-niedersachsen.de/media/files/Combo-D-08-2012-MY13.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Opel-Angabe. Fiat nennt für dieselbe Karosserie und denselben Radstand (3.105 mm) 4.756 m; die Differenz ist bei beiden Radständen exakt gleich groß. Siehe OFFEN-26.',
    },
    hoehe: {
      wert: 1.88,
      quellenstufe: 'A',
      quelle: 'https://www.opel-team-niedersachsen.de/media/files/Combo-D-08-2012-MY13.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'ohne Dachgepäckträger und ohne Dachreling; mit Träger 1.927 mm, siehe OFFEN-29',
    },
    hoeheMitDachreling: {
      wert: 1.927,
      quellenstufe: 'A',
      quelle: 'https://www.opel-team-niedersachsen.de/media/files/Combo-D-08-2012-MY13.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Betriebsanleitung: „1880 / 1927", Fußnote „Ausführungen mit Dachgepäckträger"; FCA nennt für die Personenversion 1.880–1.927 mm mit Opt. 357 (Dachreling). Siehe OFFEN-29.',
    },
    breiteOhneSpiegel: {
      wert: 1.832,
      quellenstufe: 'A',
      quelle: 'https://www.opel-team-niedersachsen.de/media/files/Combo-D-08-2012-MY13.pdf',
      abgerufenAm: '2026-08-06',
    },
    breiteMitSpiegeln: {
      wert: 2.125,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/fiat/doblo/263-facelift/308346/',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Opels Betriebsanleitung nennt 2.119 mm, der ADAC für den baugleichen Fiat 2.125 mm. Einheitlich der konservative Wert für alle vier baugleichen Einträge. Siehe OFFEN-27.',
    },
    ladebreiteRadkasten: {
      wert: 1.191,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'FCA-Block „Kombi Maxi (M1)", Innenbreite (Außenbreite 1.261 mm). Opels Zeile „Laderaumbreite" misst nicht dasselbe. Siehe OFFEN-28.',
    },
    innenhoeheLaderaum: {
      wert: 1.25,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Personenversion (M1); 1.305 mm war der Wert des Kastenwagens',
    },
    notiz:
      'Am deutschen Markt praktisch nicht kaufbar (1 von 24 Angeboten). Ladelänge von Opel nicht ausgewiesen — die früher eingetragenen 2.170 mm sind ein Lieferwagenwert.',
  },
  /*
   * Fiat-Seite derselben Karosserie: eigene Längenangabe (16 mm über Opel,
   * rechnerisch schlüssig), identische Innenmaße. Die Ladelängen sind die
   * FCA-M1-Werte hinter der zweiten Sitzreihe — sie sind deutlich kleiner als
   * die früher eingetragenen Kastenwagenwerte.
   */
  {
    id: 'fiat-doblo-152-263-standard',
    bezeichnung: 'Fiat Doblo · 152/263 Standard',
    modell: 'Fiat Doblo',
    variante: '152/263 Standard',
    baujahre: '2010–2022',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.406,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Rechnerisch schlüssig: Radstand 2.755 + Überhänge 911 und 740 mm. Opel nennt für dieselbe Karosserie 4.390 m; beide Marken behalten ihre Angabe, konservativ ist die Fiat-Zahl. Siehe OFFEN-26.',
    },
    hoehe: {
      wert: 1.845,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'ohne Dachreling; FCA führt für die Personenversion die Spanne 1.845–1.895 mm, der obere Rand gilt mit Opt. 357. Siehe OFFEN-29.',
    },
    hoeheMitDachreling: {
      wert: 1.895,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        '„1845–1895**" mit Fußnote „** Mit Opt. 357 (Dachreling)"; die Opel-Betriebsanleitung nennt denselben oberen Wert für Ausführungen mit Dachgepäckträger. Der ADAC führt den Doblò Kombi pauschal mit 1.895 mm. Siehe OFFEN-29.',
    },
    breiteOhneSpiegel: {
      wert: 1.832,
      quellenstufe: 'A',
      quelle:
        'https://www.media.stellantis.com/uploads/de/model-document/fiat_preisliste_doblo_cargo_012021-5ff3325b229ef.pdf',
      abgerufenAm: '2026-08-06',
    },
    breiteMitSpiegeln: {
      wert: 2.125,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/fiat/doblo/263/221789/',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Eine Fiat-Primärquelle für dieses Maß existiert nicht; Opel nennt für die baugleiche Karosserie 2.119 mm. Einheitlich der konservative ADAC-Wert für alle vier Einträge. Siehe OFFEN-27.',
    },
    ladelaenge: {
      wert: 0.95,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'FCA-Block „Kombi M1", hinter der zweiten Sitzreihe gemessen. Die früher eingetragenen 1.820 mm waren der Kastenwagenwert.',
    },
    ladebreiteRadkasten: {
      wert: 1.12,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'FCA-Block „Kombi M1", Innenbreite (Außenbreite 1.195 mm). Siehe OFFEN-28.',
    },
    innenhoeheLaderaum: {
      wert: 1.25,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Personenversion (M1); 1.305 mm war der Wert des Kastenwagens',
    },
    notiz:
      'Die Ladelänge ist knapp — aber aus einem anderen Grund als bisher angenommen: Hinter der zweiten Sitzreihe bleiben 950 mm, nicht die früher eingetragenen 1.820 mm, die zum Kastenwagen gehören.',
  },
  {
    id: 'fiat-doblo-maxi-152-263-l2',
    bezeichnung: 'Fiat Doblo Maxi · 152/263 L2',
    modell: 'Fiat Doblo Maxi',
    variante: '152/263 L2',
    baujahre: '2010–2022',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.756,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Radstand 3.105 mm, identisch zum Opel Combo Tour Maxi, der 4.740 m angibt. Die 16 mm Differenz treten bei beiden Radständen gleich auf; konservativ ist die Fiat-Zahl. Siehe OFFEN-26.',
    },
    hoehe: {
      wert: 1.88,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'ohne Dachreling; FCA führt für die Personenversion die Spanne 1.880–1.927 mm. Siehe OFFEN-29.',
    },
    hoeheMitDachreling: {
      wert: 1.927,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        '„1880–1927**" mit Fußnote „** Mit Opt. 357 (Dachreling)"; die Opel-Betriebsanleitung nennt denselben Wert für Ausführungen mit Dachgepäckträger. Siehe OFFEN-29.',
    },
    breiteOhneSpiegel: {
      wert: 1.832,
      quellenstufe: 'A',
      quelle:
        'https://www.media.stellantis.com/uploads/de/model-document/fiat_preisliste_doblo_cargo_012021-5ff3325b229ef.pdf',
      abgerufenAm: '2026-08-06',
    },
    breiteMitSpiegeln: {
      wert: 2.125,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/fiat/doblo/263-facelift/308346/',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Keine Fiat-Primärquelle; Opel nennt 2.119 mm für die baugleiche Karosserie. Einheitlich der konservative ADAC-Wert für alle vier Einträge. Siehe OFFEN-27.',
    },
    ladelaenge: {
      wert: 1.3,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'FCA-Block „Kombi Maxi M1", hinter der zweiten Sitzreihe gemessen. Die früher eingetragenen 2.170 mm waren der Kastenwagenwert.',
    },
    ladebreiteRadkasten: {
      wert: 1.191,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'FCA-Block „Kombi Maxi M1", Innenbreite (Außenbreite 1.261 mm). Siehe OFFEN-28.',
    },
    innenhoeheLaderaum: {
      wert: 1.25,
      quellenstufe: 'A',
      quelle:
        'https://www.lauer-suewer.com/images/Marken/Fiat-Professional/Technische-Daten/doblo-waren.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Personenversion (M1); 1.305 mm war der Wert des Kastenwagens',
    },
    notiz:
      'Die früher angenommene beste Kopffreiheit ist nicht belegt: Die 1.305 mm Laderaumhöhe gehören zum Kastenwagen, die Personenversion hat 1.250 mm. Längster der vier baugleichen Einträge; CNG-Werksversion verfügbar.',
  },

  /*
   * Citan W415 = Renault Kangoo II unter Mercedes-Zeichen. Die Laengen 4.321 und 4.705 m sind die
   * ECHTEN Citan-Masse — der Fehler lag umgekehrt bei den Kangoo-II-Eintraegen, die diese Zahlen
   * faelschlich uebernommen hatten (OFFEN-41). Beide Eintraege haben serienmaessig zweifluegelige
   * Hecktueren bzw. eine nur optionale Heckklappe, deren Oeffnungshoehe nirgends beziffert ist —
   * hoeheHeckOffen bleibt deshalb leer.
   */
  {
    id: 'mercedes-citan-w415-lang-l2',
    bezeichnung: 'Mercedes Citan W415 · lang (L2)',
    modell: 'Mercedes Citan W415',
    variante: 'lang (L2)',
    baujahre: '2012–2021',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.321,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Werksbroschuere vom 15.09.2017, millimetergenau bestaetigt. Dieselbe Zahl stand faelschlich auch beim Renault Kangoo II kurz — dort ist sie auf 4.282 mm korrigiert, hier bleibt sie, weil es das echte Citan-Mass ist (OFFEN-41).',
    },
    hoehe: {
      wert: 1.816,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    breiteOhneSpiegel: {
      wert: 1.829,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Gemeinsame Frontansicht aller drei Laengen der Baureihe.',
    },
    breiteMitSpiegeln: {
      wert: 2.145,
      quellenstufe: 'B',
      quelle: 'ADAC-Autotest AT5072, Mercedes-Benz Citan Kombi 109 CDI lang',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'ADAC-Eigenmessung an ausgeklappten Spiegeln; die Werksbroschuere vom 15.09.2017 nennt 2.138 mm. Uebernommen ist der konservative Messwert, weil bei 2,240 m schmalster Einfahrt die 7 mm nicht belanglos sind (OFFEN-31). Zu dieser Quelle steht im Quellenverzeichnis des Recherche-Berichts keine URL.',
    },
    ladelaenge: {
      wert: 1.753,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    ladebreiteRadkasten: {
      wert: 1.219,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    innenhoeheLaderaum: {
      wert: 1.258,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Citan-Wert fuer alle drei Laengen. Er stand faelschlich auch bei den Kangoo-II-Eintraegen, wo Renault durchgaengig 1.129 mm nennt (OFFEN-41).',
    },
    notiz:
      'Badge-Engineering des Renault Kangoo II. Ladelaenge fuer den geplanten Zweck zu kurz. Eine verglaste Heckklappe war nur gegen Aufpreis zu haben; ein Oeffnungsmass nennt weder die Werksbroschuere noch eine Preisliste.',
  },
  /*
   * Extralang: die verglaste Heckklappe war laut Fussnote der Werksbroschuere fuer diese Laenge
   * gar nicht bestellbar — hoeheHeckOffen existiert hier konstruktiv nicht, das ist kein
   * Rechercheausfall.
   */
  {
    id: 'mercedes-citan-w415-extralang-l3',
    bezeichnung: 'Mercedes Citan W415 · extralang (L3)',
    modell: 'Mercedes Citan W415',
    variante: 'extralang (L3)',
    baujahre: '2012–2021',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.705,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Werksbroschuere vom 15.09.2017, millimetergenau bestaetigt. Dieselbe Zahl stand faelschlich beim Renault Kangoo II Maxi — dort auf 4.666 mm korrigiert, hier bleibt sie als echtes Citan-Mass (OFFEN-41).',
    },
    hoehe: {
      wert: 1.839,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    breiteOhneSpiegel: {
      wert: 1.829,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Gemeinsame Frontansicht aller drei Laengen der Baureihe.',
    },
    breiteMitSpiegeln: {
      wert: 2.145,
      quellenstufe: 'B',
      quelle: 'ADAC-Autotest AT5072, Mercedes-Benz Citan Kombi 109 CDI lang',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'ADAC-Eigenmessung an ausgeklappten Spiegeln, gemessen an der Laenge lang; die Werksbroschuere nennt fuer alle Laengen 2.138 mm. Uebernommen ist der konservative Messwert (OFFEN-31). Zu dieser Quelle steht im Quellenverzeichnis des Recherche-Berichts keine URL.',
    },
    ladelaenge: {
      wert: 2.137,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    ladebreiteRadkasten: {
      wert: 1.219,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    innenhoeheLaderaum: {
      wert: 1.258,
      quellenstufe: 'A',
      quelle:
        'https://www.rkg.de/fileadmin/user_upload/Neuwagen/Mercedes-NFZ/mercedes-benz_transporter_broschuere_citan_kastenwagen_170915.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Citan-Wert fuer alle drei Laengen; Renault nennt fuer den baugleichen Kangoo II durchgaengig 1.129 mm (OFFEN-41).',
    },
    notiz:
      'Baugleich mit dem Renault Kangoo Maxi. Die frueher vermerkte Einschraenkung, die Masse seien nicht per Mercedes-Datenblatt re-verifizierbar, ist ueberholt: sie sind jetzt an der Werksbroschuere millimetergenau bestaetigt. Die verglaste Heckklappe war laut Fussnote der Werksbroschuere fuer die Laenge extralang nicht bestellbar — es bleiben die zweifluegeligen Hecktueren.',
  },
  /*
   * Citan W420: Die Hoehe springt gegenueber dem Bestand um 7,2 cm nach oben. Vier
   * Herstellerangaben fuer dieselbe Zeile, Spannweite 9,1 cm — genau auf der Achse, die ueber die
   * Durchfahrt entscheidet. Uebernommen sind die uebereinstimmenden Werte der beiden juengsten
   * Broschuerenausgaben (OFFEN-30).
   */
  {
    id: 'mercedes-citan-w420-l1',
    bezeichnung: 'Mercedes Citan W420 · L1',
    modell: 'Mercedes Citan W420',
    variante: 'L1',
    baujahre: '2021+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.498,
      quellenstufe: 'A',
      quelle: 'https://6656052.fs1.hubspotusercontent-na1.net/hubfs/6656052/2024%20Brochures/citan-panel-van.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    hoehe: {
      wert: 1.91,
      quellenstufe: 'A',
      quelle: 'https://www.ciceley.com/wp-content/uploads/2024/01/citan-panel-van-2-compressed-1.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Zeile „Height (unladen)" der Broschuerenausgaben mit Preisstand 08/2024 und 01/2026, die uebereinstimmend 1.910 mm (L1) und 1.916 mm (L2) nennen. Die Angaben streuen um 9,1 cm: ADAC 1.819 mm (L2: 1.830), Broschuere 08/2023 1.832 mm (L2: 1.852), Broschueren 08/2024 und 01/2026 1.910 mm (L2: 1.916). Uebernommen ist der hohe Wert, weil die Ausgabe 01/2026 einen bekannten Fehler der Vorgaengerausgabe korrigiert hat und damit nicht die unzuverlaessige ist. Ob das Mass eine Dachantenne einschliesst, beschriftet keine Quelle (OFFEN-30).',
    },
    breiteOhneSpiegel: {
      wert: 1.859,
      quellenstufe: 'A',
      quelle: 'https://6656052.fs1.hubspotusercontent-na1.net/hubfs/6656052/2024%20Brochures/citan-panel-van.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    breiteMitSpiegeln: {
      wert: 2.159,
      quellenstufe: 'A',
      quelle: 'https://6656052.fs1.hubspotusercontent-na1.net/hubfs/6656052/2024%20Brochures/citan-panel-van.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Spiegel ausgeklappt (+300 mm gegenueber 1.859 mm).',
    },
    ladelaenge: {
      wert: 1.806,
      quellenstufe: 'A',
      quelle: 'https://6656052.fs1.hubspotusercontent-na1.net/hubfs/6656052/2024%20Brochures/citan-panel-van.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    ladebreiteRadkasten: {
      wert: 1.26,
      quellenstufe: 'A',
      quelle: 'https://www.ciceley.com/wp-content/uploads/2024/01/citan-panel-van-2-compressed-1.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Broschuerenausgaben 08/2024 und 01/2026; die Ausgabe 08/2023 nennt 1.248 mm, parkers.co.uk 1.240 mm. Fuer die Garagenfrage ohne Bedeutung, fuer die Vollstaendigkeit dokumentiert (OFFEN-32).',
    },
    innenhoeheLaderaum: {
      wert: 1.256,
      quellenstufe: 'A',
      quelle: 'https://6656052.fs1.hubspotusercontent-na1.net/hubfs/6656052/2024%20Brochures/citan-panel-van.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert an der Ausgabe 08/2023 bestaetigt. Die Ausgabe 08/2024 enthaelt in den Laderaumhoehen einen bekannten Fehler, den die Ausgabe 01/2026 korrigiert hat (OFFEN-30/OFFEN-32).',
    },
    notiz: 'Zu neu und zu teuer fuer die engere Auswahl.',
  },
  {
    id: 'mercedes-citan-w420-l2',
    bezeichnung: 'Mercedes Citan W420 · L2',
    modell: 'Mercedes Citan W420',
    variante: 'L2',
    baujahre: '2021+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.922,
      quellenstufe: 'A',
      quelle: 'https://6656052.fs1.hubspotusercontent-na1.net/hubfs/6656052/2024%20Brochures/citan-panel-van.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    hoehe: {
      wert: 1.916,
      quellenstufe: 'A',
      quelle: 'https://www.ciceley.com/wp-content/uploads/2024/01/citan-panel-van-2-compressed-1.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Zeile „Height (unladen)" der Broschuerenausgaben mit Preisstand 08/2024 und 01/2026, die uebereinstimmend 1.916 mm nennen (Crew Van L2: 1.918 mm). Die Angaben streuen um 9,1 cm: ADAC 1.830 mm (L1: 1.819), Broschuere 08/2023 1.852 mm (L1: 1.832), Broschueren 08/2024 und 01/2026 1.916 mm (L1: 1.910). Uebernommen ist der hohe Wert, weil die Ausgabe 01/2026 einen bekannten Fehler der Vorgaengerausgabe korrigiert hat. Ob das Mass eine Dachantenne einschliesst, beschriftet keine Quelle (OFFEN-30).',
    },
    breiteOhneSpiegel: {
      wert: 1.859,
      quellenstufe: 'A',
      quelle: 'https://6656052.fs1.hubspotusercontent-na1.net/hubfs/6656052/2024%20Brochures/citan-panel-van.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Eigenes L2-Massblatt der Broschuere.',
    },
    breiteMitSpiegeln: {
      wert: 2.159,
      quellenstufe: 'A',
      quelle: 'https://6656052.fs1.hubspotusercontent-na1.net/hubfs/6656052/2024%20Brochures/citan-panel-van.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Spiegel ausgeklappt (+300 mm gegenueber 1.859 mm).',
    },
    ladelaenge: {
      wert: 2.17,
      quellenstufe: 'A',
      quelle: 'https://6656052.fs1.hubspotusercontent-na1.net/hubfs/6656052/2024%20Brochures/citan-panel-van.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert am Originaldokument millimetergenau bestaetigt.',
    },
    ladebreiteRadkasten: {
      wert: 1.26,
      quellenstufe: 'A',
      quelle: 'https://www.ciceley.com/wp-content/uploads/2024/01/citan-panel-van-2-compressed-1.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Broschuerenausgaben 08/2024 und 01/2026; die Ausgabe 08/2023 nennt 1.248 mm, parkers.co.uk 1.240 mm. Nebenbefund: Das L2-Massblatt der Ausgabe 08/2023 fuehrt in der Zeile „Max. width" faelschlich 1.248 statt 1.524 mm, Tabelle und Skizze sind dort beide fehlerhaft (OFFEN-32).',
    },
    innenhoeheLaderaum: {
      wert: 1.256,
      quellenstufe: 'A',
      quelle: 'https://6656052.fs1.hubspotusercontent-na1.net/hubfs/6656052/2024%20Brochures/citan-panel-van.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert an der Ausgabe 08/2023 bestaetigt. Die Ausgabe 08/2024 enthaelt in den Laderaumhoehen einen bekannten Fehler, den die Ausgabe 01/2026 korrigiert hat (OFFEN-30/OFFEN-32).',
    },
    notiz: 'Zu neu und zu teuer fuer die engere Auswahl.',
  },

  /**
   * Nissan NV200 Evalia — die Innenmaße sind gestrichen, nicht vergessen: Nissans Evalia-Prospekt
   * führt Ladelänge und Laderaumhöhe ausdrücklich mit „k. A."; die früheren Werte 2,040 m und
   * 1,360 m stammen vom NV200-Kastenwagen (OFFEN-34). Geblieben ist nur die Radkastenbreite, und
   * die auf Stufe D.
   */
  {
    id: 'nissan-nv200-evalia-pkw',
    bezeichnung: 'Nissan NV200 Evalia · PKW',
    modell: 'Nissan NV200 Evalia',
    variante: 'PKW',
    baujahre: '2009–2019',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.4,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert, in dieser Recherche nicht nachgeprüft; es liegt keine URL vor.',
    },
    hoehe: {
      wert: 1.85,
      quellenstufe: 'A',
      quelle: 'https://media1.autohaus.de/fm/3576/NV200%20Evalia%20E-Brosch%C3%BCre.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Evalia-Prospekt, Pkw-Karosserie. Der frühere Wert 1,860 m war Kastenwagen-Marketing.',
    },
    breiteOhneSpiegel: {
      wert: 1.695,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert, in dieser Recherche nicht nachgeprüft; es liegt keine URL vor.',
    },
    breiteMitSpiegeln: {
      wert: 2.015,
      quellenstufe: 'B',
      quelle:
        'https://assets.adac.de/image/upload/Autodatenbank/Autotest/AT4739_Nissan_Evalia_1_5_dci_110_DPF_Premium/Nissan_Evalia_1_5_dci_110_DPF_Premium.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Eigenmessung des ADAC am Evalia 1.5 dCi 110. Bestandswert war 2,011 m.',
    },
    ladebreiteRadkasten: {
      wert: 1.22,
      quellenstufe: 'D',
      quelle: 'http://www.minicamperumbau.de/welches-auto.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Ausbau-Hobbyseite, die ihre Zahlen nicht als eigene Messung ausweist. Nissan selbst führt die Zeile mit „k. A." (OFFEN-34) — nur als Größenordnung lesen, nicht als Maß.',
    },
    notiz:
      'Sehr schmales Fahrzeug (2.015 mm mit Spiegeln) und dadurch leicht einzufädeln. Zur Ladelänge und zur Laderaumhöhe gibt es keine belastbare Angabe: Der frühere Wert von 204 cm gehörte zum NV200-Kastenwagen.',
  },
  /**
   * Nissan Townstar Evalia — Höhe: Nissan bezeichnet 1.869 mm ausdrücklich als „ohne Dachreling",
   * das angebliche Relingmaß 1.860 mm wäre kleiner und damit unmöglich. Deshalb ist
   * hoeheMitDachreling bewusst NICHT gesetzt (OFFEN-33). Die Ladelänge fehlt, weil Nissans 2.230 mm
   * arithmetisch unmöglich und zugleich der Kastenwagenwert sind.
   */
  {
    id: 'nissan-townstar-evalia-neu',
    bezeichnung: 'Nissan Townstar Evalia · neu',
    modell: 'Nissan Townstar Evalia',
    variante: 'neu',
    baujahre: '2022+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.911,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Wert der Seite „Beladung und Platz"; die Maßtabelle desselben Auftritts nennt 4.910 mm. Der Millimeter ist folgenlos, die Uneinheitlichkeit gehört trotzdem vermerkt.',
    },
    hoehe: {
      wert: 1.869,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Nissan bezeichnet diesen Wert auf „Beladung und Platz" ausdrücklich als „ohne Dachreling". Die Maßtabelle nennt für L1 und L2 einheitlich 1.838 mm (mit Dachreling 1.860), nissan.at für beide Längen 1.860 mm. Ein Relingmaß, das kleiner ist als das Maß ohne Reling, kann nicht stimmen — es ist deshalb nicht aufgenommen (OFFEN-33).',
    },
    breiteOhneSpiegel: {
      wert: 1.86,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert, in dieser Recherche nicht nachgeprüft; es liegt keine URL vor.',
    },
    breiteMitSpiegeln: {
      wert: 2.159,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert, in dieser Recherche nicht nachgeprüft; es liegt keine URL vor.',
    },
    ladebreiteRadkasten: {
      wert: 1.19,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Kombi L2. Nissan nennt für Kombi L1 und für den Kastenwagen 1.248 mm, und 1.190 mm ist zugleich die angegebene Öffnungsbreite der Heckklappe — die Zeile ist möglicherweise vertauscht (OFFEN-33).',
    },
    innenhoeheLaderaum: {
      wert: 1.095,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Kombi L2, für Benziner und Elektroversion gleichermaßen angegeben.',
    },
    notiz:
      'Nachfolger des NV200 Evalia auf Kangoo-III-Plattform. Eine Ladelänge ist nicht angegeben: Nissans 2.230 mm sind der Wert des Kastenwagens L2 und gegen die 1.020 mm des Kombi L1 arithmetisch nicht haltbar.',
  },
  /**
   * Ford Tourneo Connect 2. Generation — der Eintrag deckt 2013–2021 ab und damit Vorfacelift und
   * Facelift ab 2018 mit abweichenden Maßen (OFFEN-35). Die früher hier geführten 1.833 mm Höhe und
   * 2.100 mm Spiegelbreite gehörten zur 3. Generation und sind ersetzt.
   */
  {
    id: 'ford-tourneo-connect-2-gen',
    bezeichnung: 'Ford Tourneo Connect · 2. Gen.',
    modell: 'Ford Tourneo Connect',
    variante: '2. Gen.',
    baujahre: '2013–2021',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.418,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert des Vorfacelift; für das Facelift ab 2018 nennt der ADAC 4.462 mm. Der Eintrag deckt beide Bauzeiträume ab (OFFEN-35).',
    },
    hoehe: {
      wert: 1.852,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Ford-Pressemappe. Für das Facelift ab 2018 nennt der ADAC 1.854 mm. Ob eine Dachreling enthalten ist, ist ungeklärt — beim Grand Tourneo Connect derselben Generation weist der ADAC „Dachreling: Serie" aus und nennt 1.840 mm (OFFEN-35).',
    },
    breiteOhneSpiegel: {
      wert: 1.835,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert des Vorfacelift; für das Facelift ab 2018 nennt der ADAC 1.845 mm (OFFEN-35).',
    },
    breiteMitSpiegeln: {
      wert: 2.137,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Ford-Pressemappe. Der frühere Wert 2,100 m gehört zur 3. Generation.',
    },
    ladelaenge: {
      wert: 1.8,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Ford-Pressemappe, 2-sitzige Konfiguration. Bestandswert war 1,886 m.',
    },
    ladebreiteRadkasten: {
      wert: 1.192,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Wert unverändert, jetzt aus der Ford-Pressemappe belegt statt ohne Quelle.',
    },
    innenhoeheLaderaum: {
      wert: 1.245,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Ford bezeichnet den Wert als „maximal". Bestandswert war 1,211 m.',
    },
    notiz:
      'Kompakter Hochdachkombi mit Schiebetüren. Ein Eintrag für zwei Bauzustände: Das Facelift ab 2018 ist länger, breiter und höher als der Vorfacelift, die Maße sind hier die des Vorfacelift (OFFEN-35). Die frühere Notiz zur Längenspanne 4418–4515 mm vermengte 2. und 3. Generation.',
  },
  /**
   * Ford Grand Tourneo Connect 3. Generation — Länge und Höhe sind Ausstattungsfragen, keine
   * Dachreling-Fragen: ACTIVE 4.868/1.835, TITANIUM 4.854/1.833. Aufgenommen ist jeweils der
   * größere Wert als konservative Annahme (OFFEN-36). Die Quelle ist eine Ford-Preisliste, deren
   * URL in den Recherchedaten fehlt.
   */
  {
    id: 'ford-grand-tourneo-connect-3-gen-caddy-basis',
    bezeichnung: 'Ford Grand Tourneo Connect · 3. Gen. (Caddy-Basis)',
    modell: 'Ford Grand Tourneo Connect',
    variante: '3. Gen. (Caddy-Basis)',
    baujahre: '2022+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.868,
      quellenstufe: 'A',
      quelle: 'Ford-Preisliste Tourneo Connect, Bestellnr. DE22197157DE',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Zeile „Länge ohne Anhängevorrichtung": ACTIVE 4.868 mm, TITANIUM 4.854 mm. Aufgenommen ist der ACTIVE als der ungünstigere Fall — ein ACTIVE kostet 14 mm zusätzliche Garagentiefe (OFFEN-36). Die vollständige URL der Preisliste fehlt in den Recherchedaten und ist nachzutragen.',
    },
    hoehe: {
      wert: 1.835,
      quellenstufe: 'A',
      quelle: 'Ford-Preisliste Tourneo Connect, Bestellnr. DE22197157DE',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Zeile „Höhe max. (EU-Norm)": ACTIVE 1.835 mm, TITANIUM 1.833 mm. Es ist ein Ausstattungsunterschied, keine Frage von Dachreling oder Antenne — die frühere Begründung war falsch (OFFEN-36). Die vollständige URL der Preisliste fehlt in den Recherchedaten.',
    },
    breiteOhneSpiegel: {
      wert: 1.855,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert, in dieser Recherche nicht nachgeprüft; es liegt keine URL vor.',
    },
    breiteMitSpiegeln: {
      wert: 2.1,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert, in dieser Recherche nicht nachgeprüft; es liegt keine URL vor.',
    },
    ladelaenge: {
      wert: 2.238,
      quellenstufe: 'A',
      quelle: 'Ford-Preisliste Tourneo Connect, Bestellnr. DE22197157DE',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Ford: „am Boden bis 1. Sitzreihe". transitcenter.uk nennt 2.113 mm als „luggage compartment length" — vermutlich eine andere Messdefinition (OFFEN-36). Der frühere Wert 2,150 m war eine Plattform-Analogie, die zwischenzeitlich behauptete 2,265 m stammten aus einer Quelle, die Breite und Höhe vertauscht. Die vollständige URL der Preisliste fehlt in den Recherchedaten.',
    },
    notiz:
      'Schwestermodell des VW Caddy Life Maxi auf derselben Plattform, aber nicht maßgleich: Die Längendifferenz zum Caddy (4.863 mm) ist eine echte Differenz zwischen den Schwestermodellen, kein Datenfehler — der frühere Eintrag legte das Gegenteil nahe. Die Ladelänge ist jetzt herstellerbelegt, nicht mehr per Analogie geschätzt. Über Budget.',
  },

  /*
   * Dokker: Der Eintrag ist nicht eindeutig. Dacia führt den Pkw (1,814 m) und den
   * Kastenwagen Dokker Express (1,809 m) getrennt; übernommen sind durchgängig die
   * Pkw-Werte, weil der Eintrag in der Kategorie Hochdachkombi steht (OFFEN-40).
   * Heckflügeltüren statt Klappe — hoeheHeckOffen existiert konstruktiv nicht.
   */
  {
    id: 'dacia-dokker-standard',
    bezeichnung: 'Dacia Dokker · Standard',
    modell: 'Dacia Dokker',
    variante: 'Standard',
    baujahre: '2012–2021',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.363,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert, in der Recherche vom 06.08.2026 nicht gegengeprüft; keine URL.',
    },
    hoehe: {
      wert: 1.814,
      quellenstufe: 'A',
      quelle: 'https://presse.dacia.de/genugsamer-familienfreund-mit-grossem-platzangebot-1/',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw, ohne Dachreling. Der Dokker Express misst 1,809 m (Maßskizze 1,804 m) — welche Variante dieser Eintrag meint, ist offen (OFFEN-40).',
    },
    hoeheMitDachreling: {
      wert: 1.852,
      quellenstufe: 'A',
      quelle: 'https://presse.dacia.de/genugsamer-familienfreund-mit-grossem-platzangebot-1/',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Pkw. Express mit Reling 1,847 m (Maßskizze 1,846 m).',
    },
    breiteOhneSpiegel: {
      wert: 1.751,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert ohne Beleg, keine URL; identisch mit dem Lodgy-Eintrag — Herkunft ungeprüft.',
    },
    breiteMitSpiegeln: {
      wert: 2.004,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert ohne Beleg, keine URL; identisch mit dem Lodgy-Eintrag — Herkunft ungeprüft.',
    },
    ladelaenge: {
      wert: 1.57,
      quellenstufe: 'A',
      quelle: 'https://presse.dacia.de/genugsamer-familienfreund-mit-grossem-platzangebot-1/',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Pkw, Rücksitzbank umgelegt. Der Express nennt 1.856/1.901 mm — andere Karosserie (OFFEN-40).',
    },
    ladebreiteRadkasten: {
      wert: 1.13,
      quellenstufe: 'A',
      quelle: 'https://www.renault-richter.de/wp-content/uploads/2018/06/Brosch_DokkerExpress.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Mit Verkleidung; ohne Verkleidung 1,170 m. Welcher Wert für die Pkw-Serienverkleidung gilt, ist offen (OFFEN-40).',
    },
    notiz:
      'Ladelänge des Pkw ist jetzt belegt: 1,57 m bei umgelegter Rücksitzbank. Eine Laderaumhöhe veröffentlicht weder Dacia noch der ADAC — der frühere Wert 1,271 m gehörte zum Kastenwagen Express. Hinten zwei Flügeltüren, Durchlasshöhe 1.100 mm.',
  },
  /*
   * Lodgy: Die Dachreling ist bei Stepway und Prestige serienmäßig, ein Höhenmaß dafür
   * veröffentlicht Dacia nicht. Es wird bewusst nicht geschätzt — hoeheMitDachreling
   * bleibt leer (OFFEN-39). Die ladelaenge fehlt, weil die Preisliste bei aufrechter
   * Rückbank misst, Dokker und Jogger dagegen maximal — zwei Messbasen im selben Feld.
   */
  {
    id: 'dacia-lodgy-standard',
    bezeichnung: 'Dacia Lodgy · Standard',
    modell: 'Dacia Lodgy',
    variante: 'Standard',
    baujahre: '2012–2021',
    kategorie: 'minivan',
    laenge: {
      wert: 4.498,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert, in der Recherche vom 06.08.2026 nicht gegengeprüft; keine URL.',
    },
    hoehe: {
      wert: 1.714,
      quellenstufe: 'A',
      quelle: 'https://renault-ahrens.de/wp-content/uploads/2021/03/dacia_lodgy_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Unbeladen, ohne Dachreling. Bei Stepway und Prestige ist die Reling serienmäßig; einen Wert dafür nennt die Preisliste nicht, er wird hier nicht geschätzt (OFFEN-39).',
    },
    breiteOhneSpiegel: {
      wert: 1.751,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert ohne Beleg, keine URL; identisch mit dem Dokker-Eintrag — Herkunft ungeprüft.',
    },
    breiteMitSpiegeln: {
      wert: 2.004,
      quellenstufe: 'C',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert ohne Beleg, keine URL; identisch mit dem Dokker-Eintrag — Herkunft ungeprüft.',
    },
    hoeheHeckOffen: {
      wert: 2.015,
      quellenstufe: 'A',
      quelle: 'https://renault-ahrens.de/wp-content/uploads/2021/03/dacia_lodgy_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: '5-Sitzer; der 7-Sitzer misst 2,010 m. Übernommen ist der größere Wert.',
    },
    ladebreiteRadkasten: {
      wert: 1.13,
      quellenstufe: 'A',
      quelle: 'https://renault-ahrens.de/wp-content/uploads/2021/03/dacia_lodgy_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        '7-Sitzer-Wert als sichere Wahl; der 5-Sitzer hat 1,174 m. Welche Variante der Eintrag meint, ist offen.',
    },
    innenhoeheLaderaum: {
      wert: 0.894,
      quellenstufe: 'A',
      quelle: 'https://renault-ahrens.de/wp-content/uploads/2021/03/dacia_lodgy_preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Kofferraumhöhe Z aus der Maßtabelle.',
    },
    notiz:
      'Kein Hochdachkombi — mit 0,894 m Kofferraumhöhe fehlt jede Kopffreiheit. Eine Ladelänge ist bewusst nicht eingetragen: die Preisliste misst bei aufrechter Rückbank (1,180 m), Dokker und Jogger führen im selben Feld die maximale Länge.',
  },
  /*
   * Duster, Generation I: aufgeteilt aus dem früheren Sammeleintrag beider Generationen.
   * Dessen Hüllkurve (4,341 / 1,822 / 2,052 / 1,695) beschrieb kein reales Fahrzeug —
   * Generation I ist ohne Spiegel 18 mm breiter, mit Spiegeln aber 52 mm schmaler als
   * Generation II (OFFEN-37). hoeheHeckOffen ist für Generation I nirgends belegt.
   */
  {
    id: 'dacia-duster-gen-i',
    bezeichnung: 'Dacia Duster · Generation I',
    modell: 'Dacia Duster',
    variante: 'Generation I',
    baujahre: '2010–2017',
    kategorie: 'gelaendewagen',
    laenge: {
      wert: 4.315,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Dacia_Duster_Preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Generation II ist 26 mm länger (4,341 m).',
    },
    hoehe: {
      wert: 1.625,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Dacia_Duster_Preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Ohne Dachreling. In den gängigen Ausstattungen ist die Reling serienmäßig — für ein konkretes Fahrzeug gilt eher hoeheMitDachreling.',
    },
    hoeheMitDachreling: {
      wert: 1.695,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Dacia_Duster_Preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Generation I ist mit Reling 8 mm höher als Generation II (1,687 m).',
    },
    breiteOhneSpiegel: {
      wert: 1.822,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Dacia_Duster_Preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Ohne Spiegel 18 mm breiter als Generation II (OFFEN-37).',
    },
    breiteMitSpiegeln: {
      wert: 2.0,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Dacia_Duster_Preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Mit Spiegeln 52 mm schmaler als Generation II (OFFEN-37).',
    },
    ladelaenge: {
      wert: 1.76,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Dacia_Duster_Preisliste.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Generation II misst 1,792 m.',
    },
    notiz:
      'Plan B: Ladelänge 1,76 m, zum Liegen zu kurz, ohne Kopffreiheit. Weder Preisliste noch die beiden ADAC-Autotests nennen für diese Generation eine Höhe bei geöffneter Heckklappe oder eine Laderaumhöhe.',
  },
  /*
   * Duster, Generation II: zweite Hälfte der Aufteilung (OFFEN-37). Nur hier ist die
   * Höhe bei geöffneter Heckklappe belegt — für Generation I führt die Preisliste das
   * Maß nicht, deshalb steht es dort nicht.
   */
  {
    id: 'dacia-duster-gen-ii',
    bezeichnung: 'Dacia Duster · Generation II',
    modell: 'Dacia Duster',
    variante: 'Generation II',
    baujahre: '2018–2023',
    kategorie: 'gelaendewagen',
    laenge: {
      wert: 4.341,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Preisliste_Duster_16.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Generation I misst 4,315 m.',
    },
    hoehe: {
      wert: 1.626,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Preisliste_Duster_16.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Ohne Dachreling. In den gängigen Ausstattungen ist die Reling serienmäßig — für ein konkretes Fahrzeug gilt eher hoeheMitDachreling.',
    },
    hoeheMitDachreling: {
      wert: 1.687,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Preisliste_Duster_16.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Generation I ist mit Reling 8 mm höher (1,695 m).',
    },
    breiteOhneSpiegel: {
      wert: 1.804,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Preisliste_Duster_16.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Ohne Spiegel 18 mm schmaler als Generation I (OFFEN-37).',
    },
    breiteMitSpiegeln: {
      wert: 2.052,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Preisliste_Duster_16.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Mit Spiegeln 52 mm breiter als Generation I (OFFEN-37).',
    },
    hoeheHeckOffen: {
      wert: 2.02,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Preisliste_Duster_16.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Nur für Generation II belegt; die Quelle führt daneben 2,002 m. Übernommen ist der größere Wert.',
    },
    ladelaenge: {
      wert: 1.792,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Preisliste_Duster_16.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Generation I misst 1,760 m.',
    },
    ladebreiteRadkasten: {
      wert: 0.977,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2019/08/Preisliste_Duster_16.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Nur für Generation II belegt.',
    },
    notiz:
      'Plan B: Ladelänge 1,79 m, ohne Kopffreiheit. Eine Laderaumhöhe führt keine der beiden Preislisten — die kursierenden Forenmessungen (710 und 840 mm) widersprechen sich und sind nicht übernommen.',
  },
  /*
   * Jogger: Bewusste Ausnahme von der Konvention „hoehe ist ohne Dachreling". Die Reling
   * ist laut Preisliste in allen vier Ausstattungslinien serienmäßig, ein relingfreier
   * Jogger war nicht bestellbar — der niedrigere Wert beschreibt kein reales Fahrzeug.
   * hoeheHeckOffen fehlt absichtlich: dacia.de nennt dafür dieselbe Zahl wie für die
   * Dachhöhe, was physikalisch unmöglich ist (OFFEN-38).
   */
  {
    id: 'dacia-jogger-sleep-pack',
    bezeichnung: 'Dacia Jogger · + Sleep Pack',
    modell: 'Dacia Jogger',
    variante: '+ Sleep Pack',
    baujahre: '2022+',
    kategorie: 'kombi',
    laenge: {
      wert: 4.547,
      quellenstufe: 'B',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Bestandswert, in der Recherche vom 06.08.2026 nicht gegengeprüft; keine URL.',
    },
    hoehe: {
      wert: 1.631,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2023/01/230101-Dacia-Jogger.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Höhe ohne Dachreling. Sie beschreibt kein bestellbares Fahrzeug — die Reling ist in allen vier Ausstattungslinien serienmäßig. Geprüft wird deshalb hoeheMitDachreling; dieser Wert steht nur hier, damit das Feld seiner Bedeutung entspricht (OFFEN-38).',
    },
    hoeheMitDachreling: {
      wert: 1.674,
      quellenstufe: 'A',
      quelle: 'https://www.dacia.de/modelle/jogger/technische-daten.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Die real bestellbare Höhe: Dachreling in allen Ausstattungslinien serienmäßig. Warnung: dieselbe Zahl führt dacia.de auch als „Höhe mit geöffneter Laderaumklappe" — für eine geöffnete Klappe physikalisch unmöglich, deshalb bleibt hoeheHeckOffen leer (OFFEN-38).',
    },
    breiteOhneSpiegel: {
      wert: 1.784,
      quellenstufe: 'B',
      quelle: 'Vergleichsmatrix „Autokauf", Blatt 02 Maße & Garage, Stand 05.08.2026',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Bestandswert ohne eigene URL. Gilt für 2022–2024; der ab 2025 überarbeitete Jogger wird mit 1,853 m geführt (OFFEN-38).',
    },
    breiteMitSpiegeln: {
      wert: 2.012,
      quellenstufe: 'A',
      quelle: 'https://www.dacia.de/modelle/jogger/technische-daten.html',
      abgerufenAm: '2026-08-06',
      bemerkung:
        'Die Preislisten 16.06.2022 und 01.01.2023 nennen 2,007 m, der ADAC misst 2,005 m — zwei Herstellerangaben derselben Stufe, übernommen ist der konservative Wert (OFFEN-38).',
    },
    ladelaenge: {
      wert: 1.942,
      quellenstufe: 'A',
      quelle:
        'https://www.sueverkruep.de/dacia/wp-content/uploads/sites/4/2023/01/230101-Dacia-Jogger.pdf',
      abgerufenAm: '2026-08-06',
      bemerkung: 'Der frühere Wert 1,900 m war die Matratzenlänge des Sleep Packs.',
    },
    notiz:
      'Plan B: Die Liegefläche des Sleep Packs misst 190 × 130 cm und ist damit rund 5 cm zu kurz — das ist die Matratze, nicht die Ladelänge des Fahrzeugs (1,942 m). Zu Laderaumbreite und -höhe nennt Dacia nur Durchladehöhe 836 mm und Ladekante 661 mm, beides passt in keines der Felder.',
  },

  /*
   * ------------------------------------------------------------------------
   * Ergänzungen vom 07.08.2026 — Lücken im Segment Hochdachkombi.
   *
   * Aus einer Recherche mit adversarialer Gegenprüfung, die 34 von 97
   * Behauptungen gekippt hat. Nicht aufgenommen wurden dabei:
   * - Mercedes EQT: kein belegter Unterschied in einem Außenmaß gegenüber der
   *   T-Klasse. Ein eigener Eintrag ohne eigenes Maß wäre eine Verdopplung.
   * - Toyota Proace City Verso: Die als „Toyota Deutschland" ausgewiesene
   *   Preisliste ist eine österreichische ohne abrufbare URL, und die Höhen
   *   schlossen die Dachreling ein. Die Zahlen sind gelesen, aber nicht
   *   belastbar zugeordnet — siehe OFFEN-42.
   * ------------------------------------------------------------------------
   */
  /**
   * Fiat Doblò der K9-Generation, kurze Version (Länge 1).
   *
   * In Deutschland gibt es die personenbefördernde Version ausschließlich als "Doblò Kombi" von
   * Fiat Professional: verglast, fünf Sitze, laut Preisliste aber Fahrzeugklasse N1 — also kein
   * M1-Pkw. Ein Doblò mit sieben Sitzen ist für Deutschland nicht belegt.
   *
   * Alle Maße stammen aus derselben offiziellen Preisliste (FCA Germany GmbH, Stand 27.01.2025),
   * Spalte "DOBLÒ KOMBI LÄNGE 1". Kastenwagen-Maße (4.403 mm lang, Höhe mit Worksite-Paket bis
   * 1.860 mm) sind bewusst nicht eingeflossen, ebenso wenig Werte von Berlingo/Rifter/Combo Life.
   */
  {
    id: 'fiat-doblo-k9-kurz',
    bezeichnung: 'Fiat Doblò · Kombi Länge 1 (K9)',
    modell: 'Doblò',
    variante: 'Kombi Länge 1 (L1), fünf Sitze',
    baujahre: '2022+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.406,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Offizielle Fiat-Preisliste "Doblò Kombi", Stand 27.01.2025, Zeile "Länge [mm]". Der ' +
        'Kastenwagen misst 4.403 mm — dieser Wert gilt nur für den verglasten Kombi.',
    },
    hoehe: {
      wert: 1.812,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Die Preisliste nennt eine Spanne von 1.775 bis 1.812 mm (je nach Ausstattung und ' +
        'Beladung); hier steht der obere, konservative Wert. Die Zeile ist nicht als "mit ' +
        'Dachträger" gekennzeichnet — im Gegensatz zur E-Doblò-Preisliste, die ausdrücklich ' +
        '"Höhe (mit Dachträger) 1.844 mm" ausweist. Ein eigener Relingwert für den Kombi fehlt.',
    },
    breiteOhneSpiegel: {
      wert: 1.848,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.107,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite ohne / mit eingeklappten / mit Außenspiegel": 1.848 / 1.921 / 2.107 mm. ' +
        'Hier steht der Wert mit ausgeklappten Spiegeln; angeklappt sind es 1.921 mm.',
    },
    ladelaenge: {
      wert: 1.0,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Laderaumlänge maximal hinter Sitzreihe 2, also bei aufgestellter Rückbank.',
    },
    ladebreiteRadkasten: {
      wert: 1.195,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.2,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Höhe maximal", laut Fußnote abzüglich 50 mm für Dachstreben.',
    },
    notiz:
      'Fahrzeugklasse N1 laut Preisliste, Vertrieb über Fiat Professional — kein M1-Pkw im ' +
      'engeren Sinn, aber die verglaste Personenversion mit fünf Sitzen, nicht der Kastenwagen. ' +
      'Die Preisliste liegt als offizielles FCA-Germany-Dokument vor, ist hier aber über einen ' +
      'Händlerserver abgerufen, weil fiat.de den Direktabruf mit HTTP 403 abweist. Höhe mit ' +
      'geöffneter Heckklappe ist nirgends belegt und fehlt deshalb.',
  },
  /**
   * Fiat Doblò der K9-Generation, lange Version (Länge 2, andernorts Maxi/XL).
   *
   * Ebenfalls nur als "Doblò Kombi" von Fiat Professional belegt, Fahrzeugklasse N1, fünf Sitze.
   * Die im Auftrag vermutete Siebensitzer-Konfiguration ist für Deutschland NICHT belegt — weder
   * in der Preisliste noch in der Stellantis-Pressemitteilung zum Marktstart.
   *
   * Maße wieder ausschließlich aus der Spalte "DOBLÒ KOMBI LÄNGE 2" derselben Preisliste.
   */
  {
    id: 'fiat-doblo-k9-lang',
    bezeichnung: 'Fiat Doblò · Kombi Länge 2 (K9)',
    modell: 'Doblò',
    variante: 'Kombi Länge 2 (L2), fünf Sitze',
    baujahre: '2022+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.756,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Offizielle Fiat-Preisliste "Doblò Kombi", Stand 27.01.2025. Der Kastenwagen L2 misst ' +
        '4.753 mm; die 3 mm Unterschied gehören zum Kombi-Heck und wurden nicht vermengt.',
    },
    hoehe: {
      wert: 1.818,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Die Preisliste nennt für Länge 2 eine Spanne von 1.787 bis 1.818 mm; hier steht der ' +
        'obere, konservative Wert. Kein Hinweis auf Dachträger oder Reling in dieser Zeile; ein ' +
        'belegter Relingwert für den Kombi existiert nicht.',
    },
    breiteOhneSpiegel: {
      wert: 1.848,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.107,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite ohne / mit eingeklappten / mit Außenspiegel": 1.848 / 1.921 / 2.107 mm, ' +
        'für Länge 1 und Länge 2 identisch. Hier der Wert mit ausgeklappten Spiegeln.',
    },
    ladelaenge: {
      wert: 1.35,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Laderaumlänge maximal hinter Sitzreihe 2, also bei aufgestellter Rückbank.',
    },
    ladebreiteRadkasten: {
      wert: 1.195,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.2,
      quellenstufe: 'A',
      quelle:
        'https://www.abz-nutzfahrzeuge.de/fileadmin/inhalte/Modelle_Fiat/Doblo_NEU_Kombi/Doblo_Kombi_2025_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Höhe maximal", laut Fußnote abzüglich 50 mm für Dachstreben.',
    },
    notiz:
      'Fahrzeugklasse N1 laut Preisliste, Vertrieb über Fiat Professional. Sieben Sitze sind für ' +
      'Deutschland nicht belegt; die Preisliste führt für beide Längen fünf Sitze. Mit 4,756 m ' +
      'passt die lange Version rechnerisch in die 5,220 m tiefe Garage, die knappe Achse bleibt ' +
      'die Breite mit ausgeklappten Spiegeln (2,107 m gegen 2,240 m).',
  },

  /*
   * Mercedes T-Klasse W420 — die Pkw-Variante des Citan W420. Der Vergleich Maß für Maß:
   *
   * (a) Die Marktübersicht meldet, die T-Klasse habe mit 4.498 mm NICHT dieselbe Länge wie der
   *     Citan L1. Das ist widerlegt: `mercedes-citan-w420-l1` steht im Katalog mit exakt
   *     4,498 m. Länge (4.498 / 4.922 mm), Breite ohne Spiegel (1.859 mm), Breite mit Spiegeln
   *     (2.159 mm) und Radstand (2.716 / 3.100 mm) sind bei Citan und T-Klasse identisch — es
   *     ist dieselbe Karosserie in denselben zwei Längen.
   *
   * (b) Die einzige Zahl, die auseinandergeht, ist die Höhe — und sie geht zwischen den Quellen
   *     auseinander, nicht zwischen den Karosserien (OFFEN-30). Für die Pkw-Variante nennen
   *     ADAC-Autokatalog und ultimatespecs unabhängig 1.811 mm, die Wikipedia die Spanne
   *     1.811 … 1.832 mm. Die Broschürenwerte 1.910 / 1.916 mm, mit denen der Katalog den Citan
   *     führt, tauchen in keiner Pkw-Quelle auf. OFFEN-30 ist für die T-Klasse damit entschärft,
   *     aber nicht aufgelöst: Kein Mercedes-Dokument war erreichbar, deshalb steht hinter jedem
   *     Maß Stufe C und nicht A.
   *
   * (c) Produktionsende belegt: Der ADAC führt für alle vier Einträge „Baureihenende Mai 2026",
   *     die Wikipedia datiert die Ankündigung auf April 2025 („zweites Quartal 2026"). Die
   *     Baujahre enden deshalb auf 2026 und tragen kein „+".
   *
   * Kein Innenmaß ist eingetragen: Ladelänge, Ladebreite und Laderaumhöhe der Citan-Einträge
   * stammen aus der Kastenwagen-Broschüre und gelten für den verglasten Pkw nicht.
   */
  {
    id: 'mercedes-t-klasse-l1',
    bezeichnung: 'Mercedes T-Klasse W420 · L1',
    modell: 'Mercedes T-Klasse W420',
    variante: 'L1',
    baujahre: '2022–2026',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.498,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/mercedes-benz/t-klasse/420/344759/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Millimetergenau der Wert des Citan W420 L1 — die Marktübersicht irrt, wenn sie hier ' +
        'einen Unterschied meldet. auto-data.net und die Wikipedia nennen dieselben 4.498 mm.',
    },
    hoehe: {
      wert: 1.811,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/mercedes-benz/t-klasse/420/344759/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Spannweite der Quellen: 1.811 mm (ADAC-Autokatalog und ultimatespecs übereinstimmend), ' +
        '1.811 … 1.832 mm (Wikipedia), 1.852 mm (auto-data.net, Einzelmeinung und zugleich der ' +
        'Citan-Broschürenwert 08/2023 für L2). Die 1.910 mm, mit denen der Katalog den Citan L1 ' +
        'führt, nennt keine Pkw-Quelle (OFFEN-30). Ein Wert mit Dachreling ist nirgends beziffert.',
    },
    breiteOhneSpiegel: {
      wert: 1.859,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/mercedes-benz/t-klasse/420/344759/',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Identisch mit dem Citan W420; auto-data.net und ultimatespecs bestätigen.',
    },
    breiteMitSpiegeln: {
      wert: 2.159,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/mercedes-benz/t-klasse/420/344759/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Spiegel ausgeklappt (+300 mm gegenüber 1.859 mm), identisch mit dem Citan W420. Bei ' +
        '2,240 m schmalster Einfahrt bleiben 81 mm — die Breite ist hier die knappe Achse, ' +
        'nicht die umstrittene Höhe.',
    },
    notiz:
      'Pkw-Variante des Citan W420 mit kurzem Radstand (2.716 mm), fünf Sitze. Alle Außenmaße ' +
      'sind mit dem Citan L1 identisch; belegt abweichend ist nur die Höhe, und die ist ein ' +
      'Quellenstreit (OFFEN-30). Innenmaße fehlen bewusst — die Citan-Werte stammen vom ' +
      'Kastenwagen. Produktion im Mai 2026 ausgelaufen.',
  },
  {
    id: 'mercedes-t-klasse-l2',
    bezeichnung: 'Mercedes T-Klasse W420 · L2 (langer Radstand)',
    modell: 'Mercedes T-Klasse W420',
    variante: 'L2 (langer Radstand)',
    baujahre: '2023–2026',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.922,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/mercedes-benz/t-klasse/420/330831/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Millimetergenau der Wert des Citan W420 L2; auto-data.net bestätigt. Übersteigt die ' +
        'nutzbare Garagentiefe von 5,220 m nicht, lässt aber nur 30 cm Rest.',
    },
    hoehe: {
      wert: 1.811,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/mercedes-benz/t-klasse/420/330831/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Der ADAC nennt für die lange T-Klasse dieselbe Höhe wie für die kurze; auto-data.net ' +
        'ebenso (1.811 mm), die Wikipedia die Spanne 1.811 … 1.832 mm für beide Längen. Der ' +
        'Citan L2 steht im Katalog mit 1.916 mm aus der Kastenwagen-Broschüre — kein Pkw-Beleg ' +
        'stützt diesen Wert (OFFEN-30). Ein Wert mit Dachreling ist nirgends beziffert.',
    },
    breiteOhneSpiegel: {
      wert: 1.859,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/mercedes-benz/t-klasse/420/330831/',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Der lange Radstand ändert die Breite nicht; identisch mit L1 und mit dem Citan.',
    },
    breiteMitSpiegeln: {
      wert: 2.159,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/mercedes-benz/t-klasse/420/330831/',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Spiegel ausgeklappt, identisch mit L1 und mit dem Citan W420.',
    },
    notiz:
      'Langer Radstand 3.100 mm, ab November 2023. Optional dritte Sitzreihe mit zwei ' +
      'Einzelsitzen, damit bis zu sieben Plätze; die ADAC-Datenzeile führt fünf Sitze als ' +
      'Basis. Länge und Breite sind mit dem Citan W420 L2 identisch, Innenmaße fehlen bewusst. ' +
      'Produktion im Mai 2026 ausgelaufen.',
  },

  /*
   * Tourneo Connect 3. Generation mit kurzem Radstand (L1) — die Lücke neben dem bereits
   * geführten Grand. Technisch ein VW Caddy SB, aber nicht maßgleich: Ford nennt 4.501 mm
   * (TITANIUM) bzw. 4.515 mm (ACTIVE), VW für den Caddy SB kurz 4.500 mm; die Ladelänge weicht
   * mit 1.886 gegen 1.913 mm deutlicher ab. Breite (1.855 / 2.100 mm) und Höhe (1.833 mm) sind
   * dagegen deckungsgleich. Wie beim Grand sind Länge und Höhe eine Frage der Ausstattungslinie,
   * nicht der Dachreling (OFFEN-36); aufgenommen ist jeweils der ACTIVE als ungünstigerer Fall.
   */
  {
    id: 'ford-tourneo-connect-3-gen-kurz',
    bezeichnung: 'Ford Tourneo Connect · 3. Gen. (kurz)',
    modell: 'Ford Tourneo Connect',
    variante: '3. Gen. (kurz)',
    baujahre: '2022+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.5,
      quellenstufe: 'C',
      quelle: 'automobiledimension.com, Ford Tourneo Connect (2022), Abmessungen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Die Ford-Preisliste mit der Bestellnummer A-DE22197157DE nennt 4.515 mm (ACTIVE) und ' +
        '4.501 mm (TITANIUM), ist aber nicht öffentlich abrufbar — die Gegenprüfung konnte die ' +
        'Zahlen nicht bestätigen und fand stattdessen 4.500 mm bei einem Datenportal. Bis eine ' +
        'abrufbare Ford-Quelle vorliegt, steht der belegbare Wert hier, nicht der günstigere.',
    },
    hoehe: {
      wert: 1.833,
      quellenstufe: 'C',
      quelle: 'automobiledimension.com, Ford Tourneo Connect (2022), Abmessungen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ob eine Dachreling enthalten ist, weist keine der geprüften Quellen aus. Die ' +
        'Ford-Preisliste nennt für die Ausstattung ACTIVE 1.835 mm, für TITANIUM 1.833 mm — ' +
        'ein Ausstattungsunterschied, keine Relingfrage (OFFEN-36).',
    },
    breiteOhneSpiegel: {
      wert: 1.855,
      quellenstufe: 'C',
      quelle: 'automobiledimension.com, Ford Tourneo Connect (2022), Abmessungen',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.1,
      quellenstufe: 'C',
      quelle: 'automobiledimension.com, Ford Tourneo Connect (2022), Abmessungen',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Ausdrücklich als Breite mit ausgeklappten Spiegeln ausgewiesen.',
    },
    notiz:
      'Schwestermodell des VW Caddy SB mit kurzem Radstand. Ladelänge und Laderaumhöhe sind ' +
      'bewusst nicht eingetragen: Die einzigen gefundenen Zahlen stammten vom Caddy ' +
      'beziehungsweise aus dem Eintrag der zweiten Generation und waren für dieses Fahrzeug ' +
      'durch nichts belegt. Zum Schlafen zu kurz.',
  },
  /*
   * Ford Grand Tourneo Connect 2. Generation — die Langversion zum bereits geführten kurzen
   * Radstand derselben Baureihe. Länge, Spiegelbreite und Höhe stammen aus der Ford-Pressemappe
   * und sind unabhängig durch den ADAC-Autotest von 2014 bestätigt (4.818 / 2.140 / 1.840 mm).
   * Die Pressemappe führt zwei Spalten, 5-Sitzer und 7-Sitzer; wo sie sich unterscheiden, ist
   * der größere Wert aufgenommen. Wie beim kurzen Radstand deckt der Eintrag Vorfacelift und
   * Facelift ab 2018 ab, dessen Maße abweichen (OFFEN-35).
   */
  {
    id: 'ford-grand-tourneo-connect-2-gen',
    bezeichnung: 'Ford Grand Tourneo Connect · 2. Gen.',
    modell: 'Ford Grand Tourneo Connect',
    variante: '2. Gen.',
    baujahre: '2013–2021',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.818,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford-Pressemappe, Zeile „Fahrzeuglänge", für 5-Sitzer und 7-Sitzer gleich. Der ADAC-Autotest des 1.6 TDCi Titanium nennt denselben Wert. Für das Facelift ab 2018 liegt kein eigener Wert vor (OFFEN-35).',
    },
    hoehe: {
      wert: 1.845,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford-Pressemappe, Zeile „Fahrzeughöhe": 5-Sitzer 1.845 mm, 7-Sitzer 1.840 mm; aufgenommen ist der größere Wert. Ob eine Dachreling enthalten ist, sagt Ford nicht — der ADAC weist für den getesteten Titanium „Dachreling: Serie" aus und misst 1.840 mm, was zum 7-Sitzer-Wert passt. Ein ausdrücklich relingfreier Wert ist für diese Baureihe nirgends belegt (OFFEN-35).',
    },
    breiteMitSpiegeln: {
      wert: 2.137,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford-Pressemappe, Zeile „Fahrzeugbreite mit Außenspiegel", also ausgeklappt; identisch mit dem kurzen Radstand. Der ADAC nennt gerundet 2.140 mm. Eine Karosseriebreite ohne Spiegel führt die Pressemappe nicht, sie bleibt deshalb offen.',
    },
    ladelaenge: {
      wert: 2.179,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford-Pressemappe, 2-sitzige Konfiguration — dieselbe Messdefinition wie beim kurzen Radstand (1.800 mm). In 5-sitziger Konfiguration nennt Ford 1.305 mm (5-Sitzer) bzw. 1.264 mm (7-Sitzer).',
    },
    ladebreiteRadkasten: {
      wert: 1.149,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford-Pressemappe, für 5-Sitzer und 7-Sitzer gleich. Der kurze Radstand kommt in derselben Tabelle auf 1.192 mm; die Differenz steht so bei Ford und ist hier nicht geglättet.',
    },
    innenhoeheLaderaum: {
      wert: 1.234,
      quellenstufe: 'A',
      quelle:
        'https://cache.pressmailing.net/content/f785728d-5401-4e0e-aa29-029e8e705f03/Ford%20Tourneo%20Grand%20Tourneo%20Connect-Technische%20Daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford-Pressemappe, Zeile „Lade-Innenhöhe maximal", 5-Sitzer; für den 7-Sitzer nennt dieselbe Zeile 1.072 mm. Warum die Innenhöhe von der Sitzzahl abhängt, erklärt Ford nicht — der Wert ist deshalb schwächer abgesichert als Länge, Breite und Höhe, die alle drei unabhängig vom ADAC bestätigt sind.',
    },
    notiz:
      'Langversion des Tourneo Connect der 2. Generation, mit dritter Sitzreihe gegen Aufpreis. Ein Eintrag für zwei Bauzustände: Das Facelift ab 2018 wuchs auch beim kurzen Radstand in allen drei Achsen, für die Langversion liegen dazu keine eigenen Maße vor (OFFEN-35). Passt in die Garage, aber mit nur rund 40 cm Längenreserve.',
  },
  /*
   * Ford Tourneo Courier 2. Generation — der kleinste echte Hochdachkombi am Markt, bisher
   * gar nicht im Katalog. ADAC-Autokatalog führt zwei getrennte Maßsätze: TITANIUM
   * 1.800/1.817 mm, ACTIVE 1.813/1.836 mm. Aufgenommen ist wie beim Tourneo Connect jeweils
   * der größere Wert; die Ausstattungslinie ACTIVE steht höher auf dem Fahrwerk. Ein eigener
   * Eintrag für den E-Tourneo Courier entfällt: Bei ihm unterscheidet sich kein Außenmaß,
   * nur der Kofferraum ist größer.
   */
  {
    id: 'ford-tourneo-courier-2-gen',
    bezeichnung: 'Ford Tourneo Courier · 2. Gen.',
    modell: 'Ford Tourneo Courier',
    variante: '2. Gen.',
    baujahre: '2023+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.337,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/ford/tourneo-courier/2generation/328914/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog (Datenblattdaten, keine eigene Messung), Version 1.0 EcoBoost Titanium. Für ACTIVE und für die Automatikversion nennt derselbe Katalog dieselbe Länge; automobiledimension.com bestätigt 4.337 mm. Ford selbst war am Abrufdatum weder über ford.de noch über media.ford.com erreichbar, deshalb keine Stufe A.',
    },
    hoehe: {
      wert: 1.836,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/ford/tourneo-courier/2generation/328913/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog, Version 1.0 EcoBoost Active. Für TITANIUM nennt derselbe Katalog 1.817 mm, ebenso automobiledimension.com; aufgenommen ist der größere ACTIVE-Wert als konservative Annahme. Ob eine Dachreling enthalten ist, weist der Katalog nicht aus — die 19 mm Differenz sind eher dem höheren Fahrwerk der ACTIVE-Linie zuzuordnen, belegt ist das aber nicht.',
    },
    breiteOhneSpiegel: {
      wert: 1.813,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/ford/tourneo-courier/2generation/328913/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog, Version ACTIVE. TITANIUM 1.800 mm, automobiledimension.com 1.791 mm — die Spanne von 22 mm bleibt ungeklärt, aufgenommen ist der größte Wert.',
    },
    breiteMitSpiegeln: {
      wert: 2.076,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/ford/tourneo-courier/2generation/328913/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ausgeklappte Spiegel. Alle geprüften Quellen (ADAC-Autokatalog für ACTIVE und TITANIUM, automobiledimension.com) nennen übereinstimmend 2.076 mm — das ist der belastbarste Wert des Eintrags und zugleich der für diese Garage entscheidende.',
    },
    notiz:
      'Kleinster echter Hochdachkombi am Markt und mit 2,076 m Spiegelbreite das mit Abstand entspannteste Fahrzeug an der engsten Achse dieser Garage — 16 cm Luft gegenüber den 2,240 m der Einfahrt. Radstand 2.692 mm. Pkw-Version des Transit Courier Kastenwagens; dessen Maße sind hier nicht übernommen. Der E-Tourneo Courier ist außen maßgleich.',
  },
  /*
   * Ford Tourneo Courier 1. Generation. Aufgenommen sind nur Länge und Höhe — bei den Breiten
   * widersprechen sich die Quellen so deutlich, dass jede Übernahme eine Entscheidung statt
   * einer Messung wäre: ADAC-Autokatalog und fordfan.de nennen beide 1.976 mm „ohne Spiegel",
   * was breiter wäre als die 1.800 mm der größeren 2. Generation und damit nicht stimmen kann;
   * Wikipedia führt für den baugleichen Transit Courier 1.796 mm. Für die Spiegelbreite stehen
   * 2.060 mm (fordfan.de) gegen 2.112 mm (ADAC-Autokatalog). Beide Felder bleiben deshalb leer.
   */
  {
    id: 'ford-tourneo-courier-1-gen',
    bezeichnung: 'Ford Tourneo Courier · 1. Gen.',
    modell: 'Ford Tourneo Courier',
    variante: '1. Gen.',
    baujahre: '2014–2023',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.157,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/ford/tourneo-courier/1generation/241590/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog, 1.5 TDCi Titanium (06/14–07/15). fordfan.de und auto-data.net nennen denselben Wert, auto-data.net auch für das Facelift ab 2018. Wikipedia führt für den Transit Courier 4.160 mm.',
    },
    hoehe: {
      wert: 1.726,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/ford/tourneo-courier/1generation/241590/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog, 1.5 TDCi Titanium. fordfan.de und auto-data.net nennen 1.723 mm — 3 mm Unterschied, aufgenommen ist der größere Wert. Ob eine Dachreling enthalten ist, sagt keine der Quellen; ein ausdrücklich relingfreier Wert ist nicht belegt.',
    },
    notiz:
      'Vorgänger der 2. Generation, rund 18 cm kürzer und 11 cm niedriger. Mit 4,157 m Länge das kürzeste Fahrzeug des Katalogs; an der Höhe unkritisch. Die Breite mit ausgeklappten Spiegeln ist bewusst nicht gesetzt: Die Quellen widersprechen sich um 52 mm, und die Karosseriebreite ist ihrerseits strittig — hochgerechnet würde daraus kein Messwert. Radstand 2.489 mm.',
  },

  /**
   * Nissan Townstar Evalia L1 — die kurze Radstandsvariante (4.488 mm), die im Katalog bisher
   * fehlte; der Bestandseintrag 'nissan-townstar-evalia-neu' führt mit 4.911 mm die L2.
   *
   * Zur Höhe (OFFEN-33): Für die L1 lösen sich Nissans Widersprüche weitgehend auf. Die Maßtabelle
   * auf nissan.de nennt 1.838 mm Gesamthöhe und 1.860 mm mit Dachreling; die Seite „Beladung und
   * Platz" nennt für die L1 ebenfalls 1.838 mm und bezeichnet den Wert ausdrücklich als „ohne
   * Dachreling". Damit ist das Paar 1.838/1.860 für die L1 in sich stimmig — anders als bei der L2,
   * wo dieselbe Seite 1.869 mm „ohne Dachreling" nennt. Offen bleibt nur nissan.at mit 1.801 mm.
   *
   * Zur Ladelänge (Pflichtpunkt b): Die 1.020 mm der L1 sind an zweiter Stelle bestätigt
   * (nissan.at, gleiche Zeilenbeschriftung). Der scheinbare Widerspruch zur L2 ist ein
   * Bezugspunktfehler, kein Rechenfehler: 1.020 mm sind „am Boden, ab Rückseite der hinteren
   * Sitzreihe", die 2.230 mm der L2 stehen auf nissan.at in der Zeile „ab Rückseite der
   * Vordersitze". Der vergleichbare L1-Wert dieser Zeile ist 1.885 mm (nissan.at: 1.865 mm) —
   * die Differenz zur L2 passt zum Radstandsunterschied von 384 mm.
   */
  {
    id: 'nissan-townstar-evalia-l1',
    bezeichnung: 'Nissan Townstar Evalia · L1',
    modell: 'Nissan Townstar Evalia',
    variante: 'L1',
    baujahre: '2022+',
    kategorie: 'hochdachkombi',
    laenge: {
      wert: 4.488,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Maßtabelle „Townstar Kombi L1", für Benziner und Elektroversion gleich. Die Seite „Beladung und Platz" desselben Auftritts nennt ebenfalls 4.488 mm — bei der L1 sind die beiden Nissan-Seiten anders als bei der L2 (4.910/4.911 mm) einig.',
    },
    hoehe: {
      wert: 1.838,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Gesamthöhe (mm)" der L1-Maßtabelle. Die Nissan-Seite „Beladung und Platz" nennt für die L1 denselben Wert und bezeichnet ihn ausdrücklich als „ohne Dachreling" — für die L1 ist OFFEN-33 damit weitgehend geklärt. nissan.at nennt in derselben Zeile 1.801 mm; welche der beiden Zahlen die relingfreie Serienhöhe ist, bleibt offen, für die lichte Höhe von 2,170 m ist die Differenz folgenlos.',
    },
    hoeheMitDachreling: {
      wert: 1.86,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Gesamthöhe (mm) mit Dachreling". nissan.at nennt für die L1 denselben Wert, obwohl es bei der Höhe ohne Reling abweicht — das Relingmaß ist damit doppelt belegt. Anders als bei der L2 ist es hier größer als die relingfreie Höhe und deshalb plausibel.',
    },
    breiteOhneSpiegel: {
      wert: 1.86,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Nissan führt Karosserie- und Spiegelbreite in einer gemeinsamen Zeile „Gesamtbreite / Breite inkl. Außenspiegel (mm)". Der Wert kann nur die Karosseriebreite sein; automobiledimension nennt für dasselbe Fahrzeug 1.860 mm ohne und 2.159 mm mit Spiegeln.',
    },
    breiteMitSpiegeln: {
      wert: 2.159,
      quellenstufe: 'C',
      quelle: 'https://www.automobiledimension.com/model/nissan/townstar',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Datenportal, keine eigene Messung; Spiegel ausgeklappt. Der Eintrag ist der L1-Kombi zuzuordnen (4.486 mm Länge, 775 l Kofferraum — Nissan nennt für die L1 4.488 mm und 775 l). Nissan selbst gibt für den Townstar Kombi keine gesonderte Spiegelbreite an. Knappste Achse dieser Garage: 2,240 m minus 2,159 m sind 8 cm Luft, bei einem Portalwert aus zweiter Hand.',
    },
    ladelaenge: {
      wert: 1.02,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Ladelänge am Boden (Rückseite der hinteren Sitzreihe bis zur Heckklappe)". An zweiter Stelle bestätigt: nissan.at nennt in derselben Zeile ebenfalls 1.020 mm. Nicht mit den 2.230 mm der L2 vergleichbar, die ab Rückseite der Vordersitze gemessen sind — der entsprechende L1-Wert lautet 1.885 mm (nissan.at: 1.865 mm).',
    },
    ladebreiteRadkasten: {
      wert: 1.248,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Breite zwischen den Radkästen" im Laderaumblock der L1. nissan.at nennt an derselben Stelle einen anderen Wert; der Widerspruch ist ungeklärt (OFFEN-33). Für die Garagenfrage ohne Bedeutung.',
    },
    innenhoeheLaderaum: {
      wert: 1.111,
      quellenstufe: 'A',
      quelle: 'https://www.nissan.de/fahrzeuge/neuwagen/townstar-combi/abmessungen.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Höhe (mm)" im Laderaumblock der L1, Benziner; die Elektroversion ist mit 1.116 mm angegeben. Der Heckklappenblock nennt zufällig denselben Wert 1.111 mm.',
    },
    notiz:
      'Kurze Radstandsvariante (2.716 mm) des Townstar Kombi, fünfsitzig, 775 l Kofferraum; Nissan Deutschland führt die Pkw-Version schlicht als „Townstar Kombi", der Name Evalia stammt aus dem Bestandskatalog. Als Hochdachkombi eingeordnet, nicht als Kleinbus wie die siebensitzige L2. Für diese Garage unkritisch in Länge und Höhe; entscheidend ist die Spiegelbreite von 2,159 m, die nur aus einem Datenportal stammt.',
  },

  /*
   * ------------------------------------------------------------------------
   * Kleinbusse und grosse Vans, 07.08.2026.
   *
   * Aus einer Recherche mit adversarialer Gegenprüfung: 204 Maße geprüft,
   * 24 zurückgewiesen. Die entscheidende Achse ist hier die Breite über die
   * ausgeklappten Spiegel gegen 2,240 m — die lichte Höhe ist bei keinem
   * einzigen dieser Fahrzeuge das Ausschlusskriterium.
   *
   * Hyundai Staria und Kia PV5 sind am 07.08.2026 nachgetragen worden; ihre
   * Spiegelbreiten stehen bei keinem der beiden Hersteller, sondern nur im
   * ADAC-Katalog (OFFEN-45).
   * ------------------------------------------------------------------------
   */
  {
    id: 'mercedes-v-klasse-kompakt',
    bezeichnung: 'Mercedes-Benz V-Klasse · Kompakt',
    modell: 'V-Klasse',
    variante: 'Kompakt',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.895,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Tabellenblock "Abmessungen", Zeile "Länge" der Kompakt-Tabelle (V 220 d / V 250 d): ' +
        '4.895 mm. Deckungsgleich mit der Betriebsanleitung V447 05/2026, Zeile ' +
        '"Fahrzeuglänge (kompakte Version)".',
    },
    hoehe: {
      wert: 1.901,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Tabellenblock "Abmessungen", Zeile "Höhe": 1.901 mm. Die Zeile nennt keine Dachreling; ' +
        'Mercedes führt auf dieser Seite keinen getrennten Relingwert. Die Betriebsanleitung ' +
        'V447 05/2026 gibt stattdessen eine Spanne "Fahrzeughöhe 1900 mm–1920 mm" an.',
    },
    breiteOhneSpiegel: {
      wert: 1.928,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (ohne Außenspiegel)": 1.928 mm.',
    },
    breiteMitSpiegeln: {
      wert: 2.249,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite (mit Spiegeln)" im Tabellenblock "Abmessungen": 2.249 mm — Spiegel ' +
        'ausgeklappt. Die Betriebsanleitung V447 05/2026 bestätigt den Wert mit ' +
        '"Fahrzeugbreite über Außenspiegel 2249 mm". Dritter Wert derselben Tabelle: ' +
        '"Breite (eingeklappte Außenspiegel) 2.057 mm".',
    },
    hoeheHeckOffen: {
      wert: 2.153,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/services/manuals.html/' +
        'v-klasse-van-2026-05-v447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung V-Klasse V447 05/2026, Tabelle "Schwenkbereich", Zeile ' +
        '"Schwenkhöhe der Heckklappe": 2153 mm (gilt laut Mercedes für alle Längen).',
    },
    notiz:
      'Kein Bett ab Werk; die ebene Liegefläche ist bei der Serien-V-Klasse nicht belegt — ' +
      'Mercedes gibt für sie keine Laderaumlänge an. Wer im Fahrzeug übernachten will, ist ' +
      'beim Marco Polo auf derselben Basis richtig. Zwischen ausgeklappten (2.249 mm) und ' +
      'angeklappten Spiegeln (2.057 mm) liegen 192 mm — an einer 2,24 m schmalen Stelle ist ' +
      'die Spiegelstellung damit der entscheidende Freiheitsgrad.',
  },
  {
    id: 'mercedes-v-klasse-lang',
    bezeichnung: 'Mercedes-Benz V-Klasse · Lang',
    modell: 'V-Klasse',
    variante: 'Lang',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.14,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Tabellenblock "Abmessungen" der Lang-Tabelle, Zeile "Länge": 5.140 mm. Gleichlautend ' +
        'in der Betriebsanleitung V447 05/2026, "Fahrzeuglänge (lange Version)". ' +
        'Radstand 3.200 mm.',
    },
    hoehe: {
      wert: 1.901,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe": 1.901 mm, für die lange Version identisch zur kompakten. Ohne Angabe ' +
        'einer Dachreling; die Betriebsanleitung nennt die Spanne 1900–1920 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.928,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (ohne Außenspiegel)": 1.928 mm.',
    },
    breiteMitSpiegeln: {
      wert: 2.249,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite (mit Spiegeln)" der Lang-Tabelle: 2.249 mm, Spiegel ausgeklappt — ' +
        'über alle drei Längen unverändert. Bestätigt durch die Betriebsanleitung V447 ' +
        '05/2026 ("Fahrzeugbreite über Außenspiegel 2249 mm"). Angeklappt: 2.057 mm.',
    },
    hoeheHeckOffen: {
      wert: 2.153,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/services/manuals.html/' +
        'v-klasse-van-2026-05-v447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung V447 05/2026, Zeile "Schwenkhöhe der Heckklappe": 2153 mm, ' +
        'angegeben unter der Spalte "Alle Modelle".',
    },
    notiz:
      'Die verbreitete Basis für Selbstausbauten und für den Marco Polo. Eine ebene ' +
      'Liegefläche ist ab Werk nicht belegt — Mercedes veröffentlicht für die V-Klasse keine ' +
      'Laderaumlänge, nur Kofferraumvolumina. Für die Einfahrt zählt der Unterschied zwischen ' +
      'ausgeklappten (2.249 mm) und angeklappten Spiegeln (2.057 mm).',
  },
  {
    id: 'mercedes-v-klasse-extralang',
    bezeichnung: 'Mercedes-Benz V-Klasse · Extralang',
    modell: 'V-Klasse',
    variante: 'Extralang',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.37,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Tabellenblock "Abmessungen" der Extralang-Tabelle, Zeile "Länge": 5.370 mm. ' +
        'Betriebsanleitung V447 05/2026: "Fahrzeuglänge (extralange Version) 5370 mm", ' +
        'Radstand 3.430 mm.',
    },
    hoehe: {
      wert: 1.901,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe": 1.901 mm. Ohne Dachreling-Angabe; die Betriebsanleitung nennt für ' +
        'alle Längen die Spanne 1900–1920 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.928,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (ohne Außenspiegel)": 1.928 mm.',
    },
    breiteMitSpiegeln: {
      wert: 2.249,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/v-class/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite (mit Spiegeln)" der Extralang-Tabelle: 2.249 mm, Spiegel ausgeklappt. ' +
        'Zweite Bestätigung: Betriebsanleitung V447 05/2026, "Fahrzeugbreite über ' +
        'Außenspiegel 2249 mm". Angeklappt gibt Mercedes 2.057 mm an.',
    },
    hoeheHeckOffen: {
      wert: 2.153,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/services/manuals.html/' +
        'v-klasse-van-2026-05-v447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung V447 05/2026, "Schwenkhöhe der Heckklappe": 2153 mm; ' +
        '"Schwenkweite der Heckklappe (Aushub)" 1047 mm.',
    },
    notiz:
      'Längste V-Klasse. Zum Übernachten reizvoll, weil hinter der dritten Sitzreihe der ' +
      'meiste Platz bleibt — eine ebene Liegefläche gibt Mercedes aber nicht an. Spiegel ' +
      'ausgeklappt 2.249 mm, angeklappt 2.057 mm.',
  },
  {
    id: 'mercedes-vito-tourer-kompakt',
    bezeichnung: 'Mercedes-Benz Vito Tourer · Kompakt',
    modell: 'Vito Tourer',
    variante: 'Kompakt',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.895,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Tabelle "Alle technischen Daten", Block "Fahrzeugabmessungen", Zeile ' +
        '"Fahrzeuglänge" bei gewählter Variante Kompakt: 4.895 mm.',
    },
    hoehe: {
      wert: 1.89,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Fahrzeughöhe": 1.890 mm, ohne Dachreling-Angabe. Achtung Abweichung: die ' +
        'Betriebsanleitung Vito C447 05/2026 nennt für das "Kombifahrzeug" die Spanne ' +
        '1900 mm–1920 mm, für den Kastenwagen 1905 mm–1930 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.928,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/vans/services/manuals.html/' +
        'vito-transporter-2026-05-c447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung Vito C447 05/2026, Tabelle "Fahrzeugmaße", Zeile ' +
        '"Fahrzeugbreite ohne Außenspiegel": 1928 mm. Die Modellseite des Tourer führt ' +
        'diese Zeile nicht.',
    },
    breiteMitSpiegeln: {
      wert: 2.244,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Fahrzeugbreite" im Block "Fahrzeugabmessungen": 2.244 mm; die direkt darunter ' +
        'stehende Zeile "Fahrzeugbreite bei angeklappten Spiegeln" nennt 2.060 mm — die ' +
        '2.244 mm sind also der ausgeklappte Wert. Widerspruch innerhalb Mercedes: die ' +
        'Betriebsanleitung Vito C447 05/2026 gibt "Fahrzeugbreite über Außenspiegel 2249 mm" ' +
        'an, 5 mm mehr. Beide Werte liegen über 2,240 m.',
    },
    hoeheHeckOffen: {
      wert: 2.153,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/vans/services/manuals.html/' +
        'vito-transporter-2026-05-c447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung Vito C447 05/2026, Tabelle "Schwenkbereich", Zeile ' +
        '"Schwenkhöhe der Heckklappe": 2153 mm. Für Hecktüren statt Heckklappe entfällt ' +
        'die Schwenkhöhe (Zeile "Schwenkweite der Hecktüren" 849 mm).',
    },
    ladelaenge: {
      wert: 2.408,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Max. Laderaumlänge" im Block "Laderaumabmessungen", Variante Kompakt: ' +
        '2.408 mm. Der Wert hängt an der jeweils hinterlegten Sitzkonfiguration.',
    },
    innenhoeheLaderaum: {
      wert: 1.327,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Laderaumhöhe", Variante Kompakt: 1.327 mm.',
    },
    notiz:
      'Personenvariante mit Fenstern und Sitzbänken, nicht der Kastenwagen. Mit 2,41 m ' +
      'maximaler Laderaumlänge lässt sich hier grundsätzlich liegen, sofern die Sitze ' +
      'ausgebaut werden — eine ebene Liegefläche ab Werk gibt Mercedes nicht an. Spiegel ' +
      'ausgeklappt 2.244 mm, angeklappt 2.060 mm; 184 mm Unterschied.',
  },
  {
    id: 'mercedes-vito-tourer-lang',
    bezeichnung: 'Mercedes-Benz Vito Tourer · Lang',
    modell: 'Vito Tourer',
    variante: 'Lang',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.14,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Fahrzeuglänge" bei gewählter Variante Lang: 5.140 mm, Radstand 3.200 mm. ' +
        'Betriebsanleitung Vito C447 05/2026: "Fahrzeuglänge (lange Version) 5140 mm".',
    },
    hoehe: {
      wert: 1.89,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Fahrzeughöhe": 1.890 mm, ohne Dachreling-Angabe. Die Betriebsanleitung ' +
        'Vito C447 05/2026 nennt für Kombifahrzeuge abweichend 1900 mm–1920 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.928,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/vans/services/manuals.html/' +
        'vito-transporter-2026-05-c447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung Vito C447 05/2026, Zeile "Fahrzeugbreite ohne Außenspiegel": ' +
        '1928 mm, angegeben für "Alle Modelle".',
    },
    breiteMitSpiegeln: {
      wert: 2.244,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Fahrzeugbreite": 2.244 mm bei gewählter Variante Lang; Nachbarzeile ' +
        '"Fahrzeugbreite bei angeklappten Spiegeln" 2.060 mm belegt, dass 2.244 mm der ' +
        'ausgeklappte Wert ist. Die Betriebsanleitung Vito C447 05/2026 nennt für dieselbe ' +
        'Baureihe 2249 mm ("Fahrzeugbreite über Außenspiegel") — 5 mm Differenz zwischen ' +
        'zwei Mercedes-Quellen.',
    },
    hoeheHeckOffen: {
      wert: 2.153,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/vans/services/manuals.html/' +
        'vito-transporter-2026-05-c447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung Vito C447 05/2026, "Schwenkhöhe der Heckklappe": 2153 mm, ' +
        'Spalte "Alle Modelle".',
    },
    ladelaenge: {
      wert: 3.678,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Max. Laderaumlänge", Variante Lang: 3.678 mm — der höchste Wert der drei ' +
        'Längen, weil Mercedes je Variante eine andere Sitzkonfiguration hinterlegt.',
    },
    innenhoeheLaderaum: {
      wert: 1.326,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Laderaumhöhe", Variante Lang: 1.326 mm.',
    },
    notiz:
      'Mit 3,68 m maximaler Laderaumlänge und 1,33 m Innenhöhe die praktischste Basis dieser ' +
      'Reihe zum Übernachten — Liegen längs ist bei ausgebauten Sitzen problemlos möglich, ' +
      'ein Bett ab Werk gibt es aber nicht. Spiegel ausgeklappt 2.244 mm, angeklappt ' +
      '2.060 mm.',
  },
  {
    id: 'mercedes-vito-tourer-extralang',
    bezeichnung: 'Mercedes-Benz Vito Tourer · Extralang',
    modell: 'Vito Tourer',
    variante: 'Extralang',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.37,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Fahrzeuglänge" bei gewählter Variante Extralang: 5.370 mm, Radstand ' +
        '3.430 mm. Betriebsanleitung Vito C447 05/2026: "Fahrzeuglänge (extralange ' +
        'Version) 5370 mm".',
    },
    hoehe: {
      wert: 1.89,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Fahrzeughöhe": 1.890 mm, ohne Dachreling. Betriebsanleitung Vito C447 ' +
        '05/2026 für Kombifahrzeuge: 1900 mm–1920 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.928,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/vans/services/manuals.html/' +
        'vito-transporter-2026-05-c447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung Vito C447 05/2026, Zeile "Fahrzeugbreite ohne Außenspiegel": ' +
        '1928 mm.',
    },
    breiteMitSpiegeln: {
      wert: 2.244,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Fahrzeugbreite": 2.244 mm bei gewählter Variante Extralang, ausgeklappte ' +
        'Spiegel (Nachbarzeile "Fahrzeugbreite bei angeklappten Spiegeln": 2.060 mm). ' +
        'Die Betriebsanleitung Vito C447 05/2026 nennt 2249 mm.',
    },
    hoeheHeckOffen: {
      wert: 2.153,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/vans/services/manuals.html/' +
        'vito-transporter-2026-05-c447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Betriebsanleitung Vito C447 05/2026, "Schwenkhöhe der Heckklappe": 2153 mm.',
    },
    ladelaenge: {
      wert: 2.883,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Max. Laderaumlänge", Variante Extralang: 2.883 mm. Auffällig weniger als ' +
        'bei der langen Version (3.678 mm) — Mercedes hinterlegt für Extralang offenbar ' +
        'eine sitzreichere Konfiguration. Wert unverändert übernommen, nicht geglättet.',
    },
    innenhoeheLaderaum: {
      wert: 1.297,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/vans/models/vito/tourer/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Laderaumhöhe", Variante Extralang: 1.297 mm.',
    },
    notiz:
      'Längster Vito Tourer. Zum Übernachten trotz der Außenlänge nicht automatisch besser ' +
      'als die lange Version: Mercedes weist für Extralang nur 2,88 m maximale ' +
      'Laderaumlänge aus. Spiegel ausgeklappt 2.244 mm, angeklappt 2.060 mm.',
  },
  {
    id: 'mercedes-marco-polo',
    bezeichnung: 'Mercedes-Benz Marco Polo · Campingausbau',
    modell: 'Marco Polo',
    variante: 'Campingausbau auf V-Klasse lang',
    baujahre: '2024+',
    kategorie: 'camper',
    laenge: {
      wert: 5.14,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/marco-polo/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Tabellenblock "Abmessungen", Zeile "Länge" (Motorisierungen 220 d / 250 d / 300 d): ' +
        '5.140 mm. Der Marco Polo wird nur auf der langen V-Klasse angeboten.',
    },
    hoehe: {
      wert: 1.99,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/marco-polo/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe": 1.990 mm. Mercedes benennt in dieser Zeile die Dachstellung nicht ' +
        'ausdrücklich; der Wert liegt 89 mm über der baugleichen V-Klasse (1.901 mm) und ' +
        'ist damit die Höhe mit aufgesetztem, geschlossenem Aufstelldach. Die Höhe bei ' +
        'geöffnetem Aufstelldach ist auf der Herstellerseite nicht belegt und hier ' +
        'bewusst nicht geschätzt.',
    },
    breiteOhneSpiegel: {
      wert: 1.928,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/marco-polo/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (ohne Außenspiegel)": 1.928 mm.',
    },
    breiteMitSpiegeln: {
      wert: 2.249,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/marco-polo/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite (mit Spiegeln)" im Tabellenblock "Abmessungen": 2.249 mm, Spiegel ' +
        'ausgeklappt. Dritter Wert derselben Tabelle: "Breite (eingeklappte Außenspiegel) ' +
        '2.057 mm" — für eine 2,24 m schmale Einfahrt der relevante Ausweg.',
    },
    notiz:
      'Hier lässt sich ab Werk liegen: das untere Doppelbett misst laut Mercedes ' +
      '2,03 m × 1,13 m, das Dachbett im Aufstelldach 2,05 m × 1,13 m. Für die Einfahrt ' +
      'zählen zwei Dinge getrennt — die Bauhöhe mit geschlossenem Dach (1.990 mm) und die ' +
      'Spiegelstellung (ausgeklappt 2.249 mm, angeklappt 2.057 mm).',
  },
  {
    id: 'mercedes-eqv-lang',
    bezeichnung: 'Mercedes-Benz EQV · Lang',
    modell: 'EQV',
    variante: 'Lang',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.14,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/eqv/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Tabellenblock "Abmessungen" der Lang-Tabelle (EQV 250 / EQV 300), Zeile "Länge": ' +
        '5.140 mm. Betriebsanleitung EQV E447 07/2025: "Fahrzeuglänge (lange Version) ' +
        '5140 mm".',
    },
    hoehe: {
      wert: 1.933,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/eqv/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Die Modellseite nennt in der Zeile "Höhe" 1.910 mm für den EQV 250 und 1.901 mm ' +
        'für den EQV 300 — die 1.933 mm stehen dort nicht. Sie stammen aus der ' +
        'Betriebsanleitung EQV E447 07/2025: "Fahrzeughöhe (lange Version) 1923 mm oder ' +
        '1926 mm oder 1933 mm". Eingetragen ist der höchste von Mercedes ausgewiesene ' +
        'Wert, die Angaben der Modellseite liegen bis zu 23 mm darunter. Keine ' +
        'Dachreling-Angabe.',
    },
    breiteOhneSpiegel: {
      wert: 1.928,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/eqv/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (ohne Außenspiegel)": 1.928 mm.',
    },
    breiteMitSpiegeln: {
      wert: 2.249,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/eqv/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite (mit Spiegeln)" der Lang-Tabelle: 2.249 mm, Spiegel ausgeklappt. ' +
        'Zweite Mercedes-Quelle: Betriebsanleitung EQV E447 07/2025, "Fahrzeugbreite über ' +
        'Außenspiegel 2249 mm". Angeklappt nennt die Tabelle 2.057 mm.',
    },
    hoeheHeckOffen: {
      wert: 2.222,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/services/manuals.html/' +
        'eqv-van-2025-07-e447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung EQV E447 07/2025, Zeile "Schwenkhöhe der Heckklappe (lange ' +
        'Version)": Mercedes nennt dort ausstattungsabhängig 2210 mm oder 2222 mm. ' +
        'Übernommen ist der höhere der beiden genannten Werte, nicht ein Mittelwert.',
    },
    innenhoeheLaderaum: {
      wert: 1.326,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/services/manuals.html/' +
        'eqv-van-2025-07-e447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung EQV E447 07/2025, Tabelle "Fahrzeugmaße", Zeile "Ladehöhe ' +
        '(lange Version)": 1326 mm. Dieselbe Tabelle führt daneben "Ladehöhe (extralange ' +
        'Version) 1297 mm" — die Zuordnung zur Längenvariante steht dort also ausdrücklich.',
    },
    notiz:
      'Elektrische V-Klasse. Länge und Breite sind mit der Verbrenner-V-Klasse identisch ' +
      '(5.140 mm bzw. 2.249 / 1.928 mm), nur die Höhe fällt größer aus — deshalb als ' +
      'eigener Eintrag geführt. Kein Bett ab Werk, ebene Liegefläche nicht belegt. ' +
      'Spiegel angeklappt 2.057 mm.',
  },
  {
    id: 'mercedes-eqv-extralang',
    bezeichnung: 'Mercedes-Benz EQV · Extralang',
    modell: 'EQV',
    variante: 'Extralang',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.37,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/eqv/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Tabellenblock "Abmessungen" der Extralang-Tabelle, Zeile "Länge": 5.370 mm. ' +
        'Betriebsanleitung EQV E447 07/2025: "Fahrzeuglänge (extralange Version) 5370 mm", ' +
        'Radstand 3.430 mm.',
    },
    hoehe: {
      wert: 1.931,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/eqv/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Die Modellseite nennt in der Zeile "Höhe" 1.911 mm für den EQV 250 und 1.901 mm ' +
        'für den EQV 300; die 1.931 mm stehen dort nicht. Sie stammen aus der ' +
        'Betriebsanleitung EQV E447 07/2025: "Fahrzeughöhe (extralange Version) 1920 mm ' +
        'oder 1923 mm oder 1931 mm". Eingetragen ist der höchste dort genannte Wert. ' +
        'Ohne Dachreling-Angabe.',
    },
    breiteOhneSpiegel: {
      wert: 1.928,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/eqv/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (ohne Außenspiegel)": 1.928 mm.',
    },
    breiteMitSpiegeln: {
      wert: 2.249,
      quellenstufe: 'A',
      quelle: 'https://www.mercedes-benz.de/passengercars/models/van/eqv/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite (mit Spiegeln)" der Extralang-Tabelle: 2.249 mm, Spiegel ' +
        'ausgeklappt; bestätigt durch die Betriebsanleitung EQV E447 07/2025 ' +
        '("Fahrzeugbreite über Außenspiegel 2249 mm"). Angeklappt: 2.057 mm.',
    },
    hoeheHeckOffen: {
      wert: 2.216,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/services/manuals.html/' +
        'eqv-van-2025-07-e447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung EQV E447 07/2025, Zeile "Schwenkhöhe der Heckklappe (extralange ' +
        'Version)": 2205 mm oder 2210 mm oder 2216 mm, ausstattungsabhängig. Übernommen ist ' +
        'der höchste genannte Wert.',
    },
    innenhoeheLaderaum: {
      wert: 1.297,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/services/manuals.html/' +
        'eqv-van-2025-07-e447-mbux/fahrzeugdaten/informationen-zu-fahrzeugmaen',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Betriebsanleitung EQV E447 07/2025, Tabelle "Fahrzeugmaße", Zeile "Ladehöhe ' +
        '(extralange Version)": 1297 mm. Für die lange Version nennt dieselbe Tabelle ' +
        '1326 mm.',
    },
    notiz:
      'Längster EQV. Außenbreite und Länge decken sich exakt mit der extralangen ' +
      'V-Klasse; abweichend ist allein die Höhe. Ebene Liegefläche nicht belegt. ' +
      'Spiegel ausgeklappt 2.249 mm, angeklappt 2.057 mm.',
  },
  {
    id: 'mercedes-vle',
    bezeichnung: 'Mercedes-Benz VLE · 300 elektrisch',
    modell: 'VLE',
    variante: '300 elektrisch',
    baujahre: '2026+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.309,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/models/grand-limousine/vle/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Tabelle "Die technischen Daten des neuen VLE", Spalte "300 elektrisch", Zeile ' +
        '"Länge": 5.309 mm. Mercedes führt auf der Seite bislang nur diese eine Länge.',
    },
    hoehe: {
      wert: 1.943,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/models/grand-limousine/vle/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Höhe": 1.943 mm, ohne Dachreling-Angabe.',
    },
    breiteOhneSpiegel: {
      wert: 1.999,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/models/grand-limousine/vle/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (ohne Außenspiegel)": 1.999 mm — 71 mm mehr als die V-Klasse.',
    },
    breiteMitSpiegeln: {
      wert: 2.248,
      quellenstufe: 'A',
      quelle:
        'https://www.mercedes-benz.de/passengercars/models/grand-limousine/vle/overview.html',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite (mit Spiegeln)": 2.248 mm, Spiegel ausgeklappt — trotz breiterer ' +
        'Karosserie 1 mm schmaler als die V-Klasse. Dritter Wert derselben Tabelle: ' +
        '"Breite (eingeklappte Außenspiegel) 2.092 mm", also 35 mm mehr als bei der ' +
        'V-Klasse.',
    },
    notiz:
      'Der elektrische Nachfolger der V-Klasse, seit März 2026 vorgestellt und bestellbar; ' +
      'die V-Klasse läuft vorerst parallel weiter. Ebene Liegefläche ist nicht belegt. ' +
      'Angeklappte Spiegel bringen hier nur auf 2.092 mm herunter, deutlich weniger ' +
      'Reserve als bei der V-Klasse (2.057 mm).',
  },

  {
    id: 'vw-id-buzz-kurz',
    bezeichnung: 'VW ID. Buzz · kurzer Radstand',
    modell: 'ID. Buzz',
    variante: 'kurzer Radstand',
    baujahre: '2022+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.712,
      quellenstufe: 'A',
      quelle: 'https://www.taxi-heute.de/sites/default/files/public/data-news/die-id-buzz-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Preisliste, Seite 20 „Abmessungen", Maszlinie der Seitenansicht. ' +
        'Mit Anhaengevorrichtung 4,837 m.',
    },
    hoehe: {
      wert: 1.951,
      quellenstufe: 'A',
      quelle:
        'https://www.vwbedrijfswagens.nl/idhub/content/dam/onehub_nfz/importers/nl/downloads/' +
        'prijslijsten-en-brochures/id-buzz/Prijslijst-ID-Buzz.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Die niederlaendische Preisliste nennt in der Zeile „Hoogte max." 1.927 mm — das ist ' +
        'die UNTERE Grenze der Herstellerspanne, welche die deutsche Preisliste MY2023 fuer ' +
        'H3 „Fahrzeughoehe" mit 1.927 bis 1.951 mm je nach Reifengroesse ausweist. ' +
        'Eingetragen ist deshalb die obere Grenze aus der deutschen Preisliste. ' +
        'Ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.985,
      quellenstufe: 'A',
      quelle: 'https://www.taxi-heute.de/sites/default/files/public/data-news/die-id-buzz-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Innere Maszlinie der Frontansicht auf Seite 20 „Abmessungen".',
    },
    breiteMitSpiegeln: {
      wert: 2.212,
      quellenstufe: 'A',
      quelle: 'https://www.taxi-heute.de/sites/default/files/public/data-news/die-id-buzz-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Preisliste „Der neue ID. Buzz", Modelljahr 2023, Seite 20 „Abmessungen": In der ' +
        'Frontansicht stehen zwei Maszlinien uebereinander — innen 1985 ueber die Karosserie, ' +
        'auszen 2212 ueber die ausgeklappten Auszenspiegel. Das PDF ist die VW-Preisliste ' +
        'selbst, gespiegelt auf einem Fachportal.',
    },
    ladelaenge: {
      wert: 2.232,
      quellenstufe: 'A',
      quelle:
        'https://www.vwbedrijfswagens.nl/idhub/content/dam/onehub_nfz/importers/nl/downloads/' +
        'prijslijsten-en-brochures/id-buzz/Prijslijst-ID-Buzz.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Gepaeckraumlaenge bei umgeklappter zweiter Sitzreihe. Deckungsgleich mit der ' +
        'deutschen Preisliste MY2023.',
    },
    ladebreiteRadkasten: {
      wert: 1.204,
      quellenstufe: 'A',
      quelle:
        'https://www.vwbedrijfswagens.nl/idhub/content/dam/onehub_nfz/importers/nl/downloads/' +
        'prijslijsten-en-brochures/id-buzz/Prijslijst-ID-Buzz.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Breedte tussen de wielkasten"; deutsche Preisliste nennt dasselbe Masz.',
    },
    innenhoeheLaderaum: {
      wert: 1.18,
      quellenstufe: 'A',
      quelle: 'https://www.taxi-heute.de/sites/default/files/public/data-news/die-id-buzz-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'VW-Masz H4 „Ladehoehe (5-Sitzer)".',
    },
    notiz:
      'Bei umgeklappter zweiter Sitzreihe entsteht eine 2,232 m lange Ladeflaeche bei 1,18 m ' +
      'Ladehoehe und 1,204 m Breite zwischen den Radkaesten — zum Liegen lang genug. Ein ' +
      'ebenes Liegemasz nennt VW nicht; ein Camper-Modul gibt es nur als Zubehoer. Die ' +
      'Auszenspiegel sind je nach Ausstattung elektrisch anklappbar.',
  },
  {
    id: 'vw-id-buzz-lang',
    bezeichnung: 'VW ID. Buzz · langer Radstand',
    modell: 'ID. Buzz',
    variante: 'langer Radstand (LWB)',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.962,
      quellenstufe: 'A',
      quelle:
        'https://www.vwbedrijfswagens.nl/idhub/content/dam/onehub_nfz/importers/nl/downloads/' +
        'prijslijsten-en-brochures/id-buzz/Prijslijst-ID-Buzz.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Lengte min./max." Spalte „Pro lange wielbasis": 4.962 / 5.087 mm (der groessere ' +
        'Wert mit Anhaengevorrichtung). Bestaetigt durch die VW-Baumaszzeichnung ' +
        '„BAUMASSE ID-BUZZ PEOPLE LWB".',
    },
    hoehe: {
      wert: 1.924,
      quellenstufe: 'A',
      quelle:
        'https://www.vwbedrijfswagens.nl/idhub/content/dam/onehub_nfz/importers/nl/downloads/' +
        'prijslijsten-en-brochures/id-buzz/Prijslijst-ID-Buzz.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Hoogte max.". Ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.985,
      quellenstufe: 'A',
      quelle:
        'https://www.vwbedrijfswagens.nl/idhub/content/dam/onehub_nfz/importers/nl/downloads/' +
        'prijslijsten-en-brochures/id-buzz/Prijslijst-ID-Buzz.pdf',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.212,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/vw-nutzfahrzeuge/' +
        'id-buzz/1generation/335808/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog „VW ID. Buzz lang Pro", Zeile „Breite (inkl. Auszenspiegel)". Der ' +
        'Autokatalog uebernimmt Herstellerangaben, misst nicht selbst — daher C. Der Wert ist ' +
        'identisch mit dem fuer den kurzen Radstand aus der VW-Preisliste belegten; eine ' +
        'VW-eigene Quelle fuer die Langversion wurde nicht gefunden.',
    },
    ladelaenge: {
      wert: 2.482,
      quellenstufe: 'A',
      quelle:
        'https://www.vwbedrijfswagens.nl/idhub/content/dam/onehub_nfz/importers/nl/downloads/' +
        'prijslijsten-en-brochures/id-buzz/Prijslijst-ID-Buzz.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Gepaeckraumlaenge bei umgeklappter zweiter Sitzreihe.',
    },
    ladebreiteRadkasten: {
      wert: 1.204,
      quellenstufe: 'A',
      quelle:
        'https://www.vwbedrijfswagens.nl/idhub/content/dam/onehub_nfz/importers/nl/downloads/' +
        'prijslijsten-en-brochures/id-buzz/Prijslijst-ID-Buzz.pdf',
      abgerufenAm: '2026-08-07',
    },
    notiz:
      'Der lange Radstand streckt den Wagen um 250 mm und die ebene Flaeche hinter der ' +
      'ersten Sitzreihe auf 2,482 m — das ist unter den hier erfassten VW-Bussen die laengste ' +
      'belegte Ladeflaeche unterhalb von 5 m Auszenlaenge. Sechs- und Siebensitzer moeglich.',
  },
  {
    id: 'vw-multivan-t7-kurzer-ueberhang',
    bezeichnung: 'VW Multivan T7 · kurzer Ueberhang',
    modell: 'Multivan T7',
    variante: 'kurzer Ueberhang',
    baujahre: '2021+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.973,
      quellenstufe: 'A',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Abmessungsblatt „Multivan, Business, Life, Style, Edition und Energetic, jeweils ' +
        'mit kurzem/langem Ueberhang": Maszlinie 4973/5173. Mit Anhaengevorrichtung 5,076 m.',
    },
    hoehe: {
      wert: 1.909,
      quellenstufe: 'A',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Die zitierte VW-Seite nennt 1.909 mm; „1907" kommt dort im Rohtext nur in ' +
        'Bild-Hashes vor. Die 1.907 mm stammen aus ADAC/Preisliste (Masz H3). Eingetragen ' +
        'ist der belegte und zugleich konservativere VW-Wert. Mit tiefergelegtem Fahrwerk ' +
        '1.887 mm. Ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.941,
      quellenstufe: 'A',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Innere Maszlinie der Frontansicht im VW-Abmessungsblatt.',
    },
    breiteMitSpiegeln: {
      wert: 2.252,
      quellenstufe: 'C',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Die zitierte VW-Seite fuehrt 2252 NICHT — der eingebettete VW-Datensatz nennt nur ' +
        'die Karosseriebreite. Belegt ist der Wert ueber den ADAC-Autokatalog („T7 Multivan ' +
        '2.0 TDI SCR Life DSG", Laenge 4973, sowie T7 California), Zeile „Breite (inkl. ' +
        'Auszenspiegel)": 2252 mm. Portal statt Hersteller, deshalb Stufe C.',
    },
    ladelaenge: {
      wert: 2.425,
      quellenstufe: 'C',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Masz L1 „Lade-/Gepaeckraumbodenlaenge hinter der 1. Sitzreihe". Auf der ' +
        'zitierten VW-Seite steht 2425 nicht; belegt ist der Wert nur ueber die Wiedergabe ' +
        'der VW-Preislisten-Masztabelle durch Dritte (L1 2.425 kurz / 2.625 lang, L2 ' +
        '1.316/1.516, L3 461/661) — keine Herstellerquelle, deshalb Stufe C.',
    },
    ladebreiteRadkasten: {
      wert: 1.207,
      quellenstufe: 'C',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Masz B2 „Breite zwischen den Radhaeusern"; maximale Breite B1 1,665 m. Auf der ' +
        'zitierten VW-Seite steht 1207 nicht — bestaetigt nur ueber die Wiedergabe der ' +
        'VW-Preisliste durch Dritte, deshalb Stufe C.',
    },
    innenhoeheLaderaum: {
      wert: 1.312,
      quellenstufe: 'C',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Masz H4 „Ladehoehe". Auf der zitierten VW-Seite steht 1312 nicht; bestaetigt ' +
        'nur ueber die Wiedergabe der VW-Preisliste durch Dritte, deshalb Stufe C.',
    },
    notiz:
      'Hinter der ersten Sitzreihe stehen 2,425 m ebener Boden bei 1,312 m Innenhoehe zur ' +
      'Verfuegung — mit Abstand genug zum Liegen, aber nur wenn die einzeln herausnehmbaren ' +
      'Sitze der zweiten und dritten Reihe ausgebaut sind. Der T7 hat nur einen Radstand ' +
      '(3.124 mm); kurz und lang unterscheiden sich allein im hinteren Ueberhang.',
  },
  {
    id: 'vw-multivan-t7-langer-ueberhang',
    bezeichnung: 'VW Multivan T7 · langer Ueberhang',
    modell: 'Multivan T7',
    variante: 'langer Ueberhang',
    baujahre: '2021+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.173,
      quellenstufe: 'A',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Abmessungsblatt, Maszlinie „4973/5173*" mit Fusznote „Werte gelten bei langem ' +
        'Ueberhang". Mit Anhaengevorrichtung 5,276 m. ADAC nennt denselben Wert.',
    },
    hoehe: {
      wert: 1.909,
      quellenstufe: 'A',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Wie beim kurzen Ueberhang: die zitierte VW-Seite nennt 1.909 mm, nicht 1.907 mm — ' +
        'letztere stammen aus ADAC/Preisliste (Masz H3). Mit tiefergelegtem Fahrwerk ' +
        '1.887 mm. Ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.941,
      quellenstufe: 'A',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.252,
      quellenstufe: 'C',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Wie beim kurzen Ueberhang: 2252 steht nicht auf der zitierten VW-Seite. Gedeckt ist ' +
        'der Wert durch den ADAC-Autokatalog („T7 Multivan lang 2.0 TDI SCR DSG"), Zeile ' +
        '„Breite (inkl. Auszenspiegel)" — Portal statt Hersteller, deshalb Stufe C. Die ' +
        'Aussage „scheitert an den Spiegeln" bleibt davon unberuehrt.',
    },
    ladelaenge: {
      wert: 2.625,
      quellenstufe: 'C',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Masz L1 hinter der 1. Sitzreihe bei langem Ueberhang. Hinter der 2. Reihe ' +
        '1,516 m, hinter der 3. Reihe 0,661 m. 2625 steht nicht auf der zitierten VW-Seite; ' +
        'belegt nur ueber eine Preislisten-Wiedergabe Dritter, deshalb Stufe C.',
    },
    ladebreiteRadkasten: {
      wert: 1.207,
      quellenstufe: 'C',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        '1207 steht nicht auf der zitierten VW-Seite; belegt nur ueber die Wiedergabe der ' +
        'VW-Preisliste durch Dritte, deshalb Stufe C.',
    },
    innenhoeheLaderaum: {
      wert: 1.312,
      quellenstufe: 'C',
      quelle: 'https://www.vw-nutzfahrzeuge.at/multivan/multivan/technische-daten/multivan',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Masz H4 „Ladehoehe". 1312 steht nicht auf der zitierten VW-Seite; belegt nur ' +
        'ueber die Wiedergabe der VW-Preisliste durch Dritte, deshalb Stufe C.',
    },
    notiz:
      '2,625 m ebener Boden hinter der ersten Sitzreihe bei 1,312 m Innenhoehe — der ' +
      'groeszte Liegeraum in dieser Gruppe. Die 200 mm Mehrlaenge gegenueber dem kurzen ' +
      'Ueberhang stehen komplett hinter der letzten Sitzreihe zur Verfuegung.',
  },
  {
    id: 'vw-california-t7-beach-camper',
    bezeichnung: 'VW California T7 · Beach Camper (Aufstelldach)',
    modell: 'California (T7, Multivan California)',
    variante: 'Beach Camper',
    baujahre: '2024+',
    kategorie: 'camper',
    laenge: {
      wert: 5.173,
      quellenstufe: 'A',
      quelle:
        'https://www.vw-nutzfahrzeuge.at/california/california/technische-daten/multivan-california',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Der T7-California gibt es nur auf dem langen Ueberhang des Multivan; ADAC nennt ' +
        'fuer „T7 California 2.0 TDI SCR Beach Camper DSG" denselben Wert.',
    },
    hoehe: {
      wert: 1.972,
      quellenstufe: 'A',
      quelle:
        'https://www.vw-nutzfahrzeuge.at/california/california/technische-daten/multivan-california',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Gilt fuer das GESCHLOSSENE Aufstelldach, ohne Dachreling. Dieselbe VW-Seite fuehrt ' +
        'daneben 1.909 mm — das ist die Variante ohne Aufstelldach (Beach Tour). Fuer das ' +
        'aufgestellte Dach nennt VW kein Masz.',
    },
    breiteOhneSpiegel: {
      wert: 1.941,
      quellenstufe: 'A',
      quelle:
        'https://www.vw-nutzfahrzeuge.at/california/california/technische-daten/multivan-california',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.252,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/vw-nutzfahrzeuge/' +
        'transporter/t7/340900/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog „T7 California 2.0 TDI SCR Beach Camper DSG", Zeile „Breite (inkl. ' +
        'Auszenspiegel)". VW selbst nennt fuer den California nur die Karosseriebreite. Der ' +
        'Wert ist identisch mit dem beim Multivan T7 aus VW-Quelle belegten.',
    },
    notiz:
      'Aufstelldach mit oberer Liegeflaeche, unten wird die Sitzbank zum Bett. Konkrete ' +
      'Bettmasze nennt VW auf den ausgewerteten Seiten nicht und werden hier deshalb nicht ' +
      'gefuehrt. Der Beach Camper hat keinen Kuechenblock, dadurch bleibt der Innenraum ' +
      'freier als bei Coast und Ocean.',
  },
  {
    id: 'vw-caravelle-6-1-kurz',
    bezeichnung: 'VW Caravelle 6.1 · kurzer Radstand',
    modell: 'Caravelle 6.1 (T6.1)',
    variante: 'kurzer Radstand',
    baujahre: '2019-2025',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.904,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/caravelle/Caravelle-6-1-Trendline-Comfortline-Eco.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Maszblatt „Caravelle 6.1 Trendline, Trendline EcoProfi und Comfortline, mit ' +
        'kurzem Radstand/mit langem Radstand", Maszlinie „4904/5304*". Mit ' +
        'Anhaengevorrichtung 5,006 m.',
    },
    hoehe: {
      wert: 1.99,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/caravelle/Caravelle-6-1-Trendline-Comfortline-Eco.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Maszlinie „1990/1970**/1990*"; die Fusznote ** weist 1.970 mm dem Comfortline mit ' +
        'kurzem Radstand zu. Ohne Dachreling. Bei verstaerkter Federung/Schlechtwegefahrwerk ' +
        'laut VW ca. +20 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.904,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/caravelle/Caravelle-6-1-Trendline-Comfortline-Eco.pdf',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.297,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/caravelle/Caravelle-6-1-Trendline-Comfortline-Eco.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Frontansicht des VW-Maszblatts, zwei Maszlinien uebereinander: 1904 ueber die ' +
        'Karosserie, 2297 ueber die ausgeklappten Auszenspiegel. Gilt fuer kurzen und langen ' +
        'Radstand gleichermaszen (kein Sternchen-Vorbehalt).',
    },
    notiz:
      'Reiner Personentransporter ohne Campingausbau. Die Sitzbaenke der zweiten und ' +
      'dritten Reihe lassen sich zu einer Liegeflaeche umlegen; ein Liegemasz gibt VW im ' +
      'Maszblatt nicht an. Mit 4,904 m ist der T6.1 die kuerzeste Karosserie in dieser ' +
      'Gruppe, traegt aber die breitesten Spiegel.',
  },
  {
    id: 'vw-caravelle-6-1-lang',
    bezeichnung: 'VW Caravelle 6.1 · langer Radstand',
    modell: 'Caravelle 6.1 (T6.1)',
    variante: 'langer Radstand',
    baujahre: '2019-2025',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.304,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/caravelle/Caravelle-6-1-Trendline-Comfortline-Eco.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Maszlinie „4904/5304*", Fusznote „* Werte gelten fuer langen Radstand". Radstand ' +
        '3.400 statt 3.000 mm. Mit Anhaengevorrichtung 5,406 m.',
    },
    hoehe: {
      wert: 1.99,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/caravelle/Caravelle-6-1-Trendline-Comfortline-Eco.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Maszlinie „1990/1970**/1990*" — der mit * markierte Wert fuer den langen Radstand ' +
        'ist 1.990 mm. Ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.904,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/caravelle/Caravelle-6-1-Trendline-Comfortline-Eco.pdf',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.297,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/caravelle/Caravelle-6-1-Trendline-Comfortline-Eco.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Frontansicht, aeuszere Maszlinie ueber die ausgeklappten Auszenspiegel. Der Wert ' +
        'traegt kein Sternchen und gilt damit fuer beide Radstaende.',
    },
    notiz:
      'Die 400 mm Mehrlaenge gegenueber dem kurzen Radstand stecken im Radstand und ' +
      'verlaengern den Raum hinter der letzten Sitzreihe. Zum Liegen umlegbare Baenke, ohne ' +
      'Campingausbau und ohne von VW genanntes Liegemasz.',
  },
  {
    id: 'vw-california-6-1-coast-ocean',
    bezeichnung: 'VW California 6.1 · Coast/Ocean (Aufstelldach)',
    modell: 'California 6.1 (T6.1)',
    variante: 'Coast / Ocean',
    baujahre: '2019-2025',
    kategorie: 'camper',
    laenge: {
      wert: 4.904,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/california/California-6-1-Coast-Ocean-Edition.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Maszblatt „California 6.1 Coast, Coast Edition, Ocean und Ocean Edition". Mit ' +
        'Anhaengevorrichtung 5,006 m.',
    },
    hoehe: {
      wert: 1.99,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/california/California-6-1-Coast-Ocean-Edition.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Wert gilt fuer das GESCHLOSSENE Aufstelldach — Coast und Ocean haben das ' +
        'Aufstelldach serienmaeszig. Ohne Dachreling. Ein Masz fuer das aufgestellte Dach ' +
        'nennt VW im Maszblatt nicht.',
    },
    breiteOhneSpiegel: {
      wert: 1.904,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/california/California-6-1-Coast-Ocean-Edition.pdf',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.297,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/california/California-6-1-Coast-Ocean-Edition.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Frontansicht des VW-Maszblatts: 1904 ueber die Karosserie, 2297 ueber die ' +
        'ausgeklappten Auszenspiegel — identisch mit Caravelle 6.1 und California 6.1 Beach.',
    },
    notiz:
      'Vollwertiger Campingbus: zwei Schlafplaetze im Aufstelldach, zwei auf der zum Bett ' +
      'umgeklappten Rueckbank, dazu Kueche und Schrank (Ocean zusaetzlich mit ' +
      'Standheizung/Markise). Bettmasze nennt das VW-Maszblatt nicht; die angegebene Hoehe ' +
      'ist die des geschlossenen Dachs, also das Masz fuer die Einfahrt.',
  },
  {
    id: 'vw-california-6-1-beach',
    bezeichnung: 'VW California 6.1 · Beach',
    modell: 'California 6.1 (T6.1)',
    variante: 'Beach Tour / Beach Camper',
    baujahre: '2019-2025',
    kategorie: 'camper',
    laenge: {
      wert: 4.904,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/california/California-6-1-Beach.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Maszblatt „California 6.1 Beach Tour, Beach Tour Edition, Beach Camper und Beach ' +
        'Camper Edition". Mit Anhaengevorrichtung 5,006 m.',
    },
    hoehe: {
      wert: 1.99,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/california/California-6-1-Beach.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Das Maszblatt fuehrt fuer alle vier Beach-Varianten eine Hoehe von 1.990 mm — also ' +
        'auch fuer den Beach Camper mit geschlossenem Aufstelldach. Ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.904,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/california/California-6-1-Beach.pdf',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.297,
      quellenstufe: 'A',
      quelle:
        'https://www.volkswagen-nutzfahrzeuge.de/idhub/content/dam/onehub_nfz/importers/de/' +
        'download/technische-zeichnungen/california/California-6-1-Beach.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Frontansicht des VW-Maszblatts, aeuszere Maszlinie ueber die ausgeklappten ' +
        'Auszenspiegel.',
    },
    notiz:
      'Camper ohne Kuechenblock: der Beach Camper hat das Aufstelldach mit oberem Bett, der ' +
      'Beach Tour ist die Variante ohne Aufstelldach. Unten entsteht das Bett aus der ' +
      'umgeklappten Dreier-Sitzbank. Ohne Kueche bleibt mehr freie Flaeche als bei ' +
      'Coast/Ocean; Liegemasze nennt VW im Maszblatt nicht.',
  },
  {
    id: 'vw-caravelle-t7-kurz',
    bezeichnung: 'VW Caravelle T7 · kurzer Radstand',
    modell: 'Caravelle (T7, Ford-Basis)',
    variante: 'kurzer Radstand',
    baujahre: '2025+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.05,
      quellenstufe: 'A',
      quelle: 'https://www.vw-nutzfahrzeuge.at/caravelle/varianten/technische-daten/caravelle-edition',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Angabe fuer den Caravelle Life mit kurzem Radstand (3.100 mm). ADAC nennt fuer ' +
        '„T7 Caravelle kurz 2.0 TDI Edition Automatik" denselben Wert.',
    },
    hoehe: {
      wert: 1.994,
      quellenstufe: 'A',
      quelle: 'https://www.vw-nutzfahrzeuge.at/caravelle/varianten/technische-daten/caravelle-edition',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Angabe „Hoehe (ohne Dachreling)". Der ADAC-Autokatalog fuehrt fuer dieselbe ' +
        'Baureihe 1.980 mm — 14 mm Unterschied, hier bewusst der hoehere VW-Wert.',
    },
    breiteOhneSpiegel: {
      wert: 2.032,
      quellenstufe: 'A',
      quelle: 'https://www.vw-nutzfahrzeuge.at/caravelle/varianten/technische-daten/caravelle-edition',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'VW-Angabe „Breite (ohne Auszenspiegel)". Entspricht der Karosseriebreite des Ford ' +
        'Transit Custom, mit dem sich der Caravelle T7 die Fertigung teilt.',
    },
    breiteMitSpiegeln: {
      wert: 2.275,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/vw-nutzfahrzeuge/' +
        'transporter/t7/338138/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog, Zeile „Breite (inkl. Auszenspiegel)". VW selbst veroeffentlicht ' +
        'fuer den Caravelle T7 nur die Karosseriebreite — trotz gezielter Suche in ' +
        'VW-Preislisten, Maszblaettern und den Aufbauhersteller-Zeichnungen des ' +
        'CustomizedSolution-Portals wurde keine VW-Zeile mit Spiegelbreite gefunden.',
    },
    notiz:
      'Personentransporter ohne Campingausbau, Nachfolger des Caravelle 6.1, aber technisch ' +
      'ein anderes Fahrzeug: gemeinsame Fertigung mit dem Ford Transit Custom und dessen ' +
      'deutlich breitere Karosserie (2,032 statt 1,904 m). Liegemasze nennt VW nicht.',
  },
  {
    id: 'vw-caravelle-t7-lang',
    bezeichnung: 'VW Caravelle T7 · langer Radstand',
    modell: 'Caravelle (T7, Ford-Basis)',
    variante: 'langer Radstand',
    baujahre: '2025+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.45,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/vw-nutzfahrzeuge/' +
        'transporter/t7/338140/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog „T7 Caravelle lang 2.0 TDI Edition", Radstand 3.500 mm. Eine ' +
        'VW-Seite mit den Maszen der Langversion wurde nicht gefunden.',
    },
    hoehe: {
      wert: 1.99,
      quellenstufe: 'A',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/vw-nutzfahrzeuge/' +
        'transporter/t7/338140/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Der ADAC-Autokatalog nennt 1.980 mm — das ist eine Rundung nach unten. VW selbst ' +
        'fuehrt die Langversion mit 1.990 mm (Frontantrieb) bzw. 1.989 mm (4MOTION); ' +
        'eingetragen ist der VW-Wert 1,990 m als die konservative Richtung. Die zitierte ' +
        'ADAC-Seite gibt diese Zahl nicht her.',
    },
    breiteOhneSpiegel: {
      wert: 2.032,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/vw-nutzfahrzeuge/' +
        'transporter/t7/338140/',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.275,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/vw-nutzfahrzeuge/' +
        'transporter/t7/338140/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog, Zeile „Breite (inkl. Auszenspiegel)"; identisch mit dem kurzen ' +
        'Radstand. Keine VW-Quelle gefunden.',
    },
    notiz:
      'Langversion des Ford-basierten Caravelle. Personentransporter ohne Campingausbau; ' +
      'zum Liegen umlegbare Baenke, ohne von VW genanntes Liegemasz.',
  },

  {
    id: 'opel-zafira-life-s',
    bezeichnung: 'Opel Zafira Life · S',
    modell: 'Zafira Life',
    variante: 'S',
    baujahre: '2019-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.609,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Opel Preisliste Mai 2022 (Schweizer Ausgabe, Händler-Spiegelung), Tabelle "Technische ' +
        'Daten": 4606-4609 mm je Ausführung. Eingetragen ist der obere Rand des Bereichs.',
    },
    hoehe: {
      wert: 1.950,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe ohne erhöhter Zuladung": 1892-1950 mm. Eingetragen ist der obere Rand. ' +
        'Die Quelle macht zur Dachreling keine Angabe.',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite mit ein-/ausgeklappten Spiegeln in mm": 2010/2204. Der zweite ' +
        'Wert gilt ausgeklappt. Mit angeklappten Spiegeln 2,010 m.',
    },
    ladelaenge: {
      wert: 2.811,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Innenlänge mit umgeklapptem Beifahrersitz; setzt ausgebaute Sitzreihen voraus.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.334,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Innenhöhe maximal".',
    },
    notiz:
      'Liegen in Fahrtrichtung: 2,811 m Innenlänge bei umgeklapptem Beifahrersitz — eine ebene ' +
      'Liegefläche weist das Datenblatt nicht aus. Einfahrt: Spiegelbreite 2,204 m, also 36 mm ' +
      'weniger als die schmalste Stelle von 2,240 m.',
  },
  {
    id: 'opel-zafira-life-m',
    bezeichnung: 'Opel Zafira Life · M',
    modell: 'Zafira Life',
    variante: 'M',
    baujahre: '2019-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.959,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Opel Preisliste Mai 2022: 4956-4959 mm. Eingetragen ist der obere Rand. Nach der ' +
        'Modellpflege 2024 führt Stellantis für dieselbe Länge 4981 mm (bei Opel dann als ' +
        '"Zafira Standard") — das steht nicht in der hier zitierten Liste von 2022, sondern ' +
        'in der Fiat-Preisliste Ulysse Serie 3, Stand 01/2026 (siehe Eintrag Fiat Ulysse).',
    },
    hoehe: {
      wert: 1.940,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe ohne erhöhter Zuladung": 1881-1940 mm. Eingetragen ist der obere Rand. ' +
        'Die Quelle macht zur Dachreling keine Angabe.',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite mit ein-/ausgeklappten Spiegeln in mm": 2010/2204. Mit ' +
        'angeklappten Spiegeln 2,010 m.',
    },
    ladelaenge: {
      wert: 3.161,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Innenlänge mit umgeklapptem Beifahrersitz; setzt ausgebaute Sitzreihen voraus.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.337,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Innenhöhe maximal".',
    },
    notiz:
      'Liegen in Fahrtrichtung: 3,161 m Innenlänge bei umgeklapptem Beifahrersitz — reichlich, ' +
      'eine ebene Liegefläche ist aber nicht ausgewiesen. Einfahrt: Spiegelbreite 2,204 m, also ' +
      '36 mm weniger als die schmalste Stelle von 2,240 m.',
  },
  {
    id: 'opel-zafira-life-l',
    bezeichnung: 'Opel Zafira Life · L',
    modell: 'Zafira Life',
    variante: 'L',
    baujahre: '2019-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.309,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Opel Preisliste Mai 2022: 5306-5309 mm. Eingetragen ist der obere Rand. Nach der ' +
        'Modellpflege 2024 führt Stellantis 5331 mm — nicht belegt durch die hier zitierte ' +
        'Liste von 2022, sondern durch die Fiat-Preisliste Ulysse Serie 3, Stand 01/2026 ' +
        '(siehe Eintrag Fiat Ulysse).',
    },
    hoehe: {
      wert: 1.948,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe ohne erhöhter Zuladung": 1877-1948 mm. Eingetragen ist der obere Rand. ' +
        'Die Quelle macht zur Dachreling keine Angabe.',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite mit ein-/ausgeklappten Spiegeln in mm": 2010/2204. Mit ' +
        'angeklappten Spiegeln 2,010 m.',
    },
    ladelaenge: {
      wert: 3.511,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Innenlänge mit umgeklapptem Beifahrersitz; setzt ausgebaute Sitzreihen voraus.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.339,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-franzen.ch/media/files/2022.08._Zafira-Life-Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Innenhöhe maximal".',
    },
    notiz:
      'Liegen in Fahrtrichtung: 3,511 m Innenlänge bei umgeklapptem Beifahrersitz. Einfahrt: ' +
      'Spiegelbreite 2,204 m, also 36 mm weniger als die schmalste Stelle von 2,240 m. Die ' +
      'Außenlänge von 5,309 m liegt über der nutzbaren Tiefe von 5,220 m.',
  },
  {
    id: 'peugeot-traveller-compact',
    bezeichnung: 'Peugeot Traveller · Compact (L1)',
    modell: 'Traveller',
    variante: 'Compact (L1)',
    baujahre: '2016-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.606,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Peugeot Preisliste (österreichische Ausgabe, Händler-Spiegelung), Tabelle ' +
        '"Abmessungen", Spalte Kompakt L1. Die Fußzeile lautet nur "Preisliste Dezember", ' +
        'das Jahr ist im Dokument nicht ausgewiesen. Peugeot führt 4606 mm, wo Toyota für ' +
        'dasselbe Fahrzeug 4609 mm nennt.',
    },
    hoehe: {
      wert: 1.905,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe". Die Quelle macht zur Dachreling keine Angabe. Für die ' +
        'Kompakt-Variante weist die Liste keinen Wert mit erhöhter Nutzlast aus — die ' +
        'Zeile "Höhe mit erhöhter Nutzlast" ist nur in den Spalten L2 und L3 gefüllt.',
    },
    breiteOhneSpiegel: {
      wert: 1.920,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (ohne Außenspiegel)".',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (mit Außenspiegel)", Spiegel ausgeklappt.',
    },
    ladelaenge: {
      wert: 2.811,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Max. Innenlänge bei umgeklapptem Beifahrersitz; Sitzreihen ausgebaut.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.334,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Innenhöhe maximal".',
    },
    notiz:
      'Liegen in Fahrtrichtung: 2,811 m Innenlänge bei umgeklapptem Beifahrersitz — eine ebene ' +
      'Liegefläche weist das Datenblatt nicht aus. Einfahrt: Spiegelbreite 2,204 m, also 36 mm ' +
      'weniger als die schmalste Stelle von 2,240 m.',
  },
  {
    id: 'peugeot-traveller-standard',
    bezeichnung: 'Peugeot Traveller · Standard (L2)',
    modell: 'Traveller',
    variante: 'Standard (L2)',
    baujahre: '2016-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.956,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Peugeot Preisliste, Spalte Standard L2; die Fußzeile lautet nur "Preisliste ' +
        'Dezember", das Jahr ist im Dokument nicht ausgewiesen. Nach der Modellpflege 2024 ' +
        'führt Stellantis für dieselbe Längenvariante 4981 mm — belegt nicht hier, sondern ' +
        'in der Fiat-Preisliste Ulysse Serie 3, Stand 01/2026 (siehe Eintrag Fiat Ulysse).',
    },
    hoehe: {
      wert: 1.890,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe". Die Quelle macht zur Dachreling keine Angabe. Mit erhöhter Nutzlast ' +
        'nennt Peugeot in der Spalte L2 1930 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.920,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (ohne Außenspiegel)".',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (mit Außenspiegel)", Spiegel ausgeklappt.',
    },
    ladelaenge: {
      wert: 3.161,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Max. Innenlänge bei umgeklapptem Beifahrersitz; Sitzreihen ausgebaut.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.337,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Innenhöhe maximal".',
    },
    notiz:
      'Liegen in Fahrtrichtung: 3,161 m Innenlänge bei umgeklapptem Beifahrersitz — reichlich, ' +
      'eine ebene Liegefläche ist aber nicht ausgewiesen. Einfahrt: Spiegelbreite 2,204 m, also ' +
      '36 mm weniger als die schmalste Stelle von 2,240 m.',
  },
  {
    id: 'peugeot-traveller-long',
    bezeichnung: 'Peugeot Traveller · Long (L3)',
    modell: 'Traveller',
    variante: 'Long (L3)',
    baujahre: '2016-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.308,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Peugeot Preisliste, Spalte Lang L3; die Fußzeile lautet nur "Preisliste Dezember", ' +
        'das Jahr ist im Dokument nicht ausgewiesen. Nach der Modellpflege 2024 führt ' +
        'Stellantis für dieselbe Längenvariante 5331 mm — belegt nicht hier, sondern in der ' +
        'Fiat-Preisliste Ulysse Serie 3, Stand 01/2026 (siehe Eintrag Fiat Ulysse).',
    },
    hoehe: {
      wert: 1.890,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe". Die Quelle macht zur Dachreling keine Angabe. Mit erhöhter Nutzlast ' +
        'nennt Peugeot in der Spalte L3 1940 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.920,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (ohne Außenspiegel)".',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite (mit Außenspiegel)", Spiegel ausgeklappt.',
    },
    ladelaenge: {
      wert: 3.511,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Max. Innenlänge bei umgeklapptem Beifahrersitz; Sitzreihen ausgebaut.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.339,
      quellenstufe: 'A',
      quelle: 'https://www.auto-guenther.at/fileadmin/media/download/Preislisten/' +
        'Peugeot_Traveller_Preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Innenhöhe maximal".',
    },
    notiz:
      'Liegen in Fahrtrichtung: 3,511 m Innenlänge bei umgeklapptem Beifahrersitz. Einfahrt: ' +
      'Spiegelbreite 2,204 m, also 36 mm weniger als die schmalste Stelle von 2,240 m. Die ' +
      'Außenlänge von 5,308 m liegt über der nutzbaren Tiefe von 5,220 m.',
  },
  {
    id: 'citroen-spacetourer-xs',
    bezeichnung: 'Citroën SpaceTourer · XS',
    modell: 'SpaceTourer',
    variante: 'XS',
    baujahre: '2016-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.609,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Preisliste der Citroën Deutschland GmbH, Stand 01.04.2021 (Händler-Spiegelung), ' +
        'Maßskizze: 4.609 (XS) / 4.959 (M) / 5.309 (XL). Die österreichische Ausgabe vom ' +
        'März 2020 führt für M 4956 mm — dieselbe Marke, andere Ausgabe.',
    },
    hoehe: {
      wert: 1.950,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Maßskizze nennt nur einen gemeinsamen Bereich für alle drei Längen: 1.877 min. / ' +
        '1.950 max. Eingetragen ist der obere Rand. Die Quelle macht zur Dachreling keine ' +
        'Angabe.',
    },
    breiteOhneSpiegel: {
      wert: 1.920,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Maßskizze, Karosseriebreite.',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Maßskizze, Breite über die ausgeklappten Außenspiegel.',
    },
    ladelaenge: {
      wert: 2.811,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Innenlänge mit umgeklapptem Beifahrersitz; Sitzreihen ausgebaut.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.334,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Innenhöhe maximal".',
    },
    notiz:
      'Liegen in Fahrtrichtung: 2,811 m Innenlänge bei umgeklapptem Beifahrersitz — eine ebene ' +
      'Liegefläche weist das Datenblatt nicht aus. Einfahrt: Spiegelbreite 2,204 m, also 36 mm ' +
      'weniger als die schmalste Stelle von 2,240 m.',
  },
  {
    id: 'citroen-spacetourer-m',
    bezeichnung: 'Citroën SpaceTourer · M',
    modell: 'SpaceTourer',
    variante: 'M',
    baujahre: '2016-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.959,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Preisliste Citroën Deutschland GmbH, Stand 01.04.2021, Maßskizze. Die österreichische ' +
        'Ausgabe vom März 2020 nennt 4956 mm. Nach der Modellpflege 2024 führt Stellantis ' +
        '4981 mm — belegt nicht durch die hier zitierte Liste von 2021, sondern durch die ' +
        'Fiat-Preisliste Ulysse Serie 3, Stand 01/2026 (siehe Eintrag Fiat Ulysse).',
    },
    hoehe: {
      wert: 1.950,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Maßskizze nennt nur einen gemeinsamen Bereich für alle drei Längen: 1.877 min. / ' +
        '1.950 max. Eingetragen ist der obere Rand. Die österreichische Ausgabe führt für M ' +
        'einen Einzelwert von 1890 mm. Die Quelle macht zur Dachreling keine Angabe.',
    },
    breiteOhneSpiegel: {
      wert: 1.920,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Maßskizze, Karosseriebreite.',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Maßskizze, Breite über die ausgeklappten Außenspiegel.',
    },
    ladelaenge: {
      wert: 3.161,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Innenlänge mit umgeklapptem Beifahrersitz; Sitzreihen ausgebaut.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.337,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Innenhöhe maximal".',
    },
    notiz:
      'Liegen in Fahrtrichtung: 3,161 m Innenlänge bei umgeklapptem Beifahrersitz — reichlich, ' +
      'eine ebene Liegefläche ist aber nicht ausgewiesen. Einfahrt: Spiegelbreite 2,204 m, also ' +
      '36 mm weniger als die schmalste Stelle von 2,240 m.',
  },
  {
    id: 'citroen-spacetourer-xl',
    bezeichnung: 'Citroën SpaceTourer · XL',
    modell: 'SpaceTourer',
    variante: 'XL',
    baujahre: '2016-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.309,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Preisliste Citroën Deutschland GmbH, Stand 01.04.2021, Maßskizze. Die österreichische ' +
        'Ausgabe vom März 2020 nennt 5308 mm. Nach der Modellpflege 2024 führt Stellantis ' +
        '5331 mm — belegt nicht durch die hier zitierte Liste von 2021, sondern durch die ' +
        'Fiat-Preisliste Ulysse Serie 3, Stand 01/2026 (siehe Eintrag Fiat Ulysse).',
    },
    hoehe: {
      wert: 1.950,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Maßskizze nennt nur einen gemeinsamen Bereich für alle drei Längen: 1.877 min. / ' +
        '1.950 max. Eingetragen ist der obere Rand. Die Quelle macht zur Dachreling keine ' +
        'Angabe.',
    },
    breiteOhneSpiegel: {
      wert: 1.920,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Maßskizze, Karosseriebreite.',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Maßskizze, Breite über die ausgeklappten Außenspiegel.',
    },
    ladelaenge: {
      wert: 3.511,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Innenlänge mit umgeklapptem Beifahrersitz; Sitzreihen ausgebaut.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
    },
    innenhoeheLaderaum: {
      wert: 1.339,
      quellenstufe: 'A',
      quelle: 'https://www.automobile-rosenkranz.de/dokumente/' +
        'citroen-spacetourer-preise-und-daten.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Innenhöhe maximal".',
    },
    notiz:
      'Liegen in Fahrtrichtung: 3,511 m Innenlänge bei umgeklapptem Beifahrersitz. Einfahrt: ' +
      'Spiegelbreite 2,204 m, also 36 mm weniger als die schmalste Stelle von 2,240 m. Die ' +
      'Außenlänge von 5,309 m liegt über der nutzbaren Tiefe von 5,220 m.',
  },
  {
    id: 'toyota-proace-verso-compact',
    bezeichnung: 'Toyota Proace Verso · Compact (L0)',
    modell: 'Proace Verso',
    variante: 'Compact (L0)',
    baujahre: '2016-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.609,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Toyota Broschüre (österreichische Ausgabe), Tabelle "Außenabmessungen", Spalte ' +
        'Compact (L0). Toyota führt 4609 mm, wo Peugeot für dasselbe Fahrzeug 4606 mm nennt.',
    },
    hoehe: {
      wert: 1.910,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe". Die Quelle macht zur Dachreling keine Angabe. Mit erhöhtem ' +
        'Gesamtgewicht nennt Toyota 1950 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.920,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite ohne Spiegel".',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite mit Spiegel" (ausgeklappt). Die Broschüre führt daneben "Breite mit ' +
        'Spiegel eingeklappt": 2010 mm.',
    },
    ladelaenge: {
      wert: 2.811,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Abschnitt "Innenraumabmessungen (Bus)", maximale Länge bei umgeklapptem ' +
        'Beifahrersitz. Nicht die größeren Laderaumwerte des Kastenwagens Proace.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Bus-Werte, nicht die des Kastenwagens (dort 1258 mm).',
    },
    innenhoeheLaderaum: {
      wert: 1.335,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Bus-Werte, nicht die des Kastenwagens (dort 1397 mm).',
    },
    notiz:
      'Liegen in Fahrtrichtung: 2,811 m Innenlänge bei umgeklapptem Beifahrersitz — eine ebene ' +
      'Liegefläche weist das Datenblatt nicht aus. Einfahrt: Spiegelbreite 2,204 m, also 36 mm ' +
      'weniger als die schmalste Stelle von 2,240 m.',
  },
  {
    id: 'toyota-proace-verso-medium',
    bezeichnung: 'Toyota Proace Verso · Medium (L1)',
    modell: 'Proace Verso',
    variante: 'Medium (L1)',
    baujahre: '2016-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.959,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Toyota Broschüre, Spalte Medium (L1). Peugeot und Citroën (AT) führen für dasselbe ' +
        'Fahrzeug 4956 mm. Nach der Modellpflege 2024 sind es 4981 mm — belegt nicht durch ' +
        'die hier zitierte Broschüre, sondern durch die Fiat-Preisliste Ulysse Serie 3, ' +
        'Stand 01/2026 (siehe Eintrag Fiat Ulysse).',
    },
    hoehe: {
      wert: 1.910,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe" nennt für Medium zwei Werte, 1899/1910 mm; eingetragen ist der obere. ' +
        'Die Quelle macht zur Dachreling keine Angabe. Mit erhöhtem Gesamtgewicht nennt ' +
        'Toyota 1940 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.920,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite ohne Spiegel".',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite mit Spiegel" (ausgeklappt). Daneben "Breite mit Spiegel eingeklappt": ' +
        '2010 mm.',
    },
    ladelaenge: {
      wert: 3.161,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Abschnitt "Innenraumabmessungen (Bus)", maximale Länge bei umgeklapptem ' +
        'Beifahrersitz. Nicht die Laderaumwerte des Kastenwagens Proace.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Bus-Werte, nicht die des Kastenwagens (dort 1258 mm).',
    },
    innenhoeheLaderaum: {
      wert: 1.335,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Bus-Werte, nicht die des Kastenwagens (dort 1397 mm).',
    },
    notiz:
      'Liegen in Fahrtrichtung: 3,161 m Innenlänge bei umgeklapptem Beifahrersitz — reichlich, ' +
      'eine ebene Liegefläche ist aber nicht ausgewiesen. Einfahrt: Spiegelbreite 2,204 m, also ' +
      '36 mm weniger als die schmalste Stelle von 2,240 m.',
  },
  {
    id: 'toyota-proace-verso-long',
    bezeichnung: 'Toyota Proace Verso · Long (L2)',
    modell: 'Proace Verso',
    variante: 'Long (L2)',
    baujahre: '2016-2024',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.309,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Toyota Broschüre, Spalte Lang (L2). Peugeot und Citroën (AT) führen 5308 mm. Nach ' +
        'der Modellpflege 2024 sind es 5331 mm — belegt nicht durch die hier zitierte ' +
        'Broschüre, sondern durch die Fiat-Preisliste Ulysse Serie 3, Stand 01/2026 (siehe ' +
        'Eintrag Fiat Ulysse).',
    },
    hoehe: {
      wert: 1.899,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Höhe". Die Quelle macht zur Dachreling keine Angabe. Mit erhöhtem ' +
        'Gesamtgewicht nennt Toyota 1940 mm.',
    },
    breiteOhneSpiegel: {
      wert: 1.920,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Breite ohne Spiegel".',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite mit Spiegel" (ausgeklappt). Daneben "Breite mit Spiegel eingeklappt": ' +
        '2010 mm.',
    },
    ladelaenge: {
      wert: 3.511,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Abschnitt "Innenraumabmessungen (Bus)", maximale Länge bei umgeklapptem ' +
        'Beifahrersitz. Nicht die Laderaumwerte des Kastenwagens Proace.',
    },
    ladebreiteRadkasten: {
      wert: 1.228,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Bus-Werte, nicht die des Kastenwagens (dort 1258 mm).',
    },
    innenhoeheLaderaum: {
      wert: 1.335,
      quellenstufe: 'A',
      quelle: 'https://localform.toyota.at/pdf/brochures/proace_verso.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Bus-Werte, nicht die des Kastenwagens (dort 1397 mm).',
    },
    notiz:
      'Liegen in Fahrtrichtung: 3,511 m Innenlänge bei umgeklapptem Beifahrersitz. Einfahrt: ' +
      'Spiegelbreite 2,204 m, also 36 mm weniger als die schmalste Stelle von 2,240 m. Die ' +
      'Außenlänge von 5,309 m liegt über der nutzbaren Tiefe von 5,220 m.',
  },
  {
    id: 'fiat-ulysse-l2',
    bezeichnung: 'Fiat Ulysse · L2',
    modell: 'Ulysse',
    variante: 'L2',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.981,
      quellenstufe: 'A',
      quelle: 'https://www.weller-automobile.de/wp-content/uploads/' +
        '2508_Preisliste_Fiat_Ulysse_Serie_3.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Deutsche Fiat-Preisliste Ulysse Serie 3, Stand 01/2026 (Händler-Spiegelung), Tabelle ' +
        '"Abmessungen": 4.981 (L2) / 5.331 (L3). Das ist der Stand nach der Modellpflege 2024; ' +
        'davor führte Stellantis für dieselbe Variante rund 4956-4959 mm.',
    },
    hoehe: {
      wert: 1.910,
      quellenstufe: 'A',
      quelle: 'https://www.weller-automobile.de/wp-content/uploads/' +
        '2508_Preisliste_Fiat_Ulysse_Serie_3.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Höhe". Die Quelle macht zur Dachreling keine Angabe.',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.weller-automobile.de/wp-content/uploads/' +
        '2508_Preisliste_Fiat_Ulysse_Serie_3.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite mit ausgeklappten Außenspiegel". Daneben "Breite mit eingeklappten ' +
        'Außenspiegel": 2.010 mm. Eine Karosseriebreite ohne Spiegel nennt die Liste nicht.',
    },
    notiz:
      'Die Fiat-Preisliste führt keine Innenraummaße, deshalb ist zur Liegelänge aus dieser ' +
      'Quelle nichts belegt. Einfahrt: Spiegelbreite 2,204 m, also 36 mm weniger als die ' +
      'schmalste Stelle von 2,240 m.',
  },
  {
    id: 'fiat-ulysse-l3',
    bezeichnung: 'Fiat Ulysse · L3',
    modell: 'Ulysse',
    variante: 'L3',
    baujahre: '2024+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.331,
      quellenstufe: 'A',
      quelle: 'https://www.weller-automobile.de/wp-content/uploads/' +
        '2508_Preisliste_Fiat_Ulysse_Serie_3.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Deutsche Fiat-Preisliste Ulysse Serie 3, Stand 01/2026, Tabelle "Abmessungen". Stand ' +
        'nach der Modellpflege 2024; davor rund 5306-5309 mm.',
    },
    hoehe: {
      wert: 1.910,
      quellenstufe: 'A',
      quelle: 'https://www.weller-automobile.de/wp-content/uploads/' +
        '2508_Preisliste_Fiat_Ulysse_Serie_3.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile "Höhe". Die Quelle macht zur Dachreling keine Angabe.',
    },
    breiteMitSpiegeln: {
      wert: 2.204,
      quellenstufe: 'A',
      quelle: 'https://www.weller-automobile.de/wp-content/uploads/' +
        '2508_Preisliste_Fiat_Ulysse_Serie_3.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile "Breite mit ausgeklappten Außenspiegel". Daneben "Breite mit eingeklappten ' +
        'Außenspiegel": 2.010 mm. Eine Karosseriebreite ohne Spiegel nennt die Liste nicht.',
    },
    notiz:
      'Die Fiat-Preisliste führt keine Innenraummaße, deshalb ist zur Liegelänge aus dieser ' +
      'Quelle nichts belegt. Einfahrt: Spiegelbreite 2,204 m, also 36 mm weniger als die ' +
      'schmalste Stelle von 2,240 m. Die Außenlänge von 5,331 m liegt über der nutzbaren ' +
      'Tiefe von 5,220 m.',
  },

  {
    id: 'ford-tourneo-custom-v710-l1',
    bezeichnung: 'Ford Tourneo Custom · V710 L1',
    modell: 'Tourneo Custom',
    variante: 'V710 L1 (kurzer Radstand 3100 mm)',
    baujahre: '2023+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.05,
      quellenstufe: 'A',
      quelle:
        'https://www.ford.de/content/dam/guxeu/de/documents/price-list/cars/tourneo-custom/PL-240430-PROKPL_Der_Ford_Tourneo_Custom_Bus_gultig_ab_30-04-2024-Abmessungen.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Fahrzeuggesamtlänge 5050“ der offiziellen Ford-Abmessungstabelle.',
    },
    hoehe: {
      wert: 2.04,
      quellenstufe: 'A',
      quelle:
        'https://www.ford.de/content/dam/guxeu/de/documents/price-list/cars/tourneo-custom/PL-240430-PROKPL_Der_Ford_Tourneo_Custom_Bus_gultig_ab_30-04-2024-Abmessungen.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford nennt eine Spanne „Fahrzeughöhe 1959-2040“ (Dachhöhe durchgehend H1, Spanne aus ' +
        'Bereifung und Beladung, nicht aus Dachvarianten). Hier der konservative obere Wert. ' +
        'Ford weist Dachreling nicht getrennt aus; eine relingfreie Einzelangabe fehlt.',
    },
    breiteOhneSpiegel: {
      wert: 2.032,
      quellenstufe: 'A',
      quelle:
        'https://www.ford.de/content/dam/guxeu/de/documents/price-list/cars/tourneo-custom/PL-240430-PROKPL_Der_Ford_Tourneo_Custom_Bus_gultig_ab_30-04-2024-Abmessungen.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Ohne Türgriffe nennt Ford zusätzlich 1999 mm.',
    },
    breiteMitSpiegeln: {
      wert: 2.275,
      quellenstufe: 'A',
      quelle:
        'https://www.ford.de/content/dam/guxeu/de/documents/price-list/cars/tourneo-custom/PL-240430-PROKPL_Der_Ford_Tourneo_Custom_Bus_gultig_ab_30-04-2024-Abmessungen.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Breite mit Außenspiegeln 2275“. Mit angeklappten Außenspiegeln nennt Ford in ' +
        'derselben Tabelle 2148 mm; die Spiegel sind serienmäßig elektrisch anklappbar.',
    },
    ladelaenge: {
      wert: 2.622,
      quellenstufe: 'A',
      quelle:
        'https://www.ford.de/content/dam/guxeu/de/documents/price-list/cars/tourneo-custom/PL-240430-PROKPL_Der_Ford_Tourneo_Custom_Bus_gultig_ab_30-04-2024-Abmessungen.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Länge Fahrgastraum (hinter der 1. Sitzreihe - am Boden) 2622“. Hinter der ' +
        '2. Sitzreihe nennt Ford 1280-1790 mm.',
    },
    notiz:
      'Zum Übernachten: hinter der ersten Sitzreihe stehen am Boden 2,622 m zur Verfügung, eine ' +
      'ebene Liegefläche in Fahrzeuglängsrichtung ist damit auch für große Personen möglich. Ford ' +
      'belegt keine ebene Liegefläche als Maß, das Fahrzeug ist kein Campingausbau. Die ' +
      'Außenspiegel lassen sich serienmäßig elektrisch auf 2,148 m Gesamtbreite anklappen — das ' +
      'wäre bei diesem Fahrzeug eine tägliche Handlung beim Ein- und Ausfahren.',
  },
  {
    id: 'ford-tourneo-custom-v710-l2',
    bezeichnung: 'Ford Tourneo Custom · V710 L2',
    modell: 'Tourneo Custom',
    variante: 'V710 L2 (langer Radstand 3500 mm)',
    baujahre: '2023+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.45,
      quellenstufe: 'A',
      quelle:
        'https://www.ford.de/content/dam/guxeu/de/documents/price-list/cars/tourneo-custom/PL-240430-PROKPL_Der_Ford_Tourneo_Custom_Bus_gultig_ab_30-04-2024-Abmessungen.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Fahrzeuggesamtlänge 5450“ der offiziellen Ford-Abmessungstabelle.',
    },
    hoehe: {
      wert: 2.031,
      quellenstufe: 'A',
      quelle:
        'https://www.ford.de/content/dam/guxeu/de/documents/price-list/cars/tourneo-custom/PL-240430-PROKPL_Der_Ford_Tourneo_Custom_Bus_gultig_ab_30-04-2024-Abmessungen.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford nennt eine Spanne „Fahrzeughöhe 1963-2031“ (Dachhöhe durchgehend H1). Hier der ' +
        'konservative obere Wert. Dachreling wird von Ford nicht getrennt ausgewiesen, eine ' +
        'relingfreie Einzelangabe fehlt.',
    },
    breiteOhneSpiegel: {
      wert: 2.032,
      quellenstufe: 'A',
      quelle:
        'https://www.ford.de/content/dam/guxeu/de/documents/price-list/cars/tourneo-custom/PL-240430-PROKPL_Der_Ford_Tourneo_Custom_Bus_gultig_ab_30-04-2024-Abmessungen.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Ohne Türgriffe nennt Ford zusätzlich 1999 mm. Identisch zu L1.',
    },
    breiteMitSpiegeln: {
      wert: 2.275,
      quellenstufe: 'A',
      quelle:
        'https://www.ford.de/content/dam/guxeu/de/documents/price-list/cars/tourneo-custom/PL-240430-PROKPL_Der_Ford_Tourneo_Custom_Bus_gultig_ab_30-04-2024-Abmessungen.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Breite mit Außenspiegeln 2275“, identisch zu L1. Mit angeklappten Außenspiegeln ' +
        'nennt Ford 2148 mm.',
    },
    ladelaenge: {
      wert: 3.022,
      quellenstufe: 'A',
      quelle:
        'https://www.ford.de/content/dam/guxeu/de/documents/price-list/cars/tourneo-custom/PL-240430-PROKPL_Der_Ford_Tourneo_Custom_Bus_gultig_ab_30-04-2024-Abmessungen.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Länge Fahrgastraum (hinter der 1. Sitzreihe - am Boden) 3022“. Hinter der ' +
        '2. Sitzreihe nennt Ford 1680-2190 mm.',
    },
    notiz:
      'Zum Übernachten die interessantere der beiden Längen: 3,022 m ebener Boden hinter der ' +
      'ersten Sitzreihe, hinter der zweiten Sitzreihe je nach Sitzposition bis 2,190 m — also ' +
      'ausreichend Liegelänge, ohne die zweite Sitzreihe ausbauen zu müssen. Die Außenspiegel ' +
      'sind serienmäßig elektrisch anklappbar (dann 2,148 m Gesamtbreite).',
  },
  {
    id: 'ford-tourneo-custom-v362-l1',
    bezeichnung: 'Ford Tourneo Custom · V362 L1',
    modell: 'Tourneo Custom',
    variante: 'V362 L1 (kurzer Radstand 2933 mm), Normaldach',
    baujahre: '2018-2023',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.972,
      quellenstufe: 'A',
      quelle:
        'https://www.fordservicecontent.com/Ford_Content/Catalog/owner_information/CG3764deDEU-201911-20191203150840.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford-Betriebsanleitung, Abschnitt „Fahrzeugabmessungen“, Zeile „4.972 Gesamtlänge“ ' +
        '(kurzer Radstand). Deckungsgleich mit der Portalangabe 4972 mm.',
    },
    hoehe: {
      wert: 1.984,
      quellenstufe: 'C',
      quelle: 'https://de.automobiledimension.com/modell/ford/tourneo-custom-l1',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Normaldach. Ford selbst nennt in der Betriebsanleitung nur die Spanne „1.959-2.382 ' +
        'Gesamthöhe ohne Antenne“, die Normaldach und das damals lieferbare Hochdach ' +
        'zusammenfasst und daher als Einzelwert unbrauchbar ist. Der hier gesetzte Wert ist die ' +
        'Portalangabe für das Normaldach und liegt innerhalb der Ford-Spanne. Ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.986,
      quellenstufe: 'C',
      quelle: 'https://de.automobiledimension.com/modell/ford/tourneo-custom-l1',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Die Ford-Betriebsanleitung führt nur die Breite mit Außenspiegeln.',
    },
    breiteMitSpiegeln: {
      wert: 2.29,
      quellenstufe: 'A',
      quelle:
        'https://www.fordservicecontent.com/Ford_Content/Catalog/owner_information/CG3764deDEU-201911-20191203150840.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford-Betriebsanleitung, Zeile „2.290 Gesamtbreite mit Außenspiegeln“. WIDERSPRUCH: ' +
        'Datenportale nennen für dieselbe Baureihe 2272 mm (automobiledimension, ADAC), also ' +
        '18 mm weniger. Hier steht bewusst die Herstellerangabe, weil sie die konservativere ' +
        'ist; beide Werte liegen über der Engstelle. Breite mit ANGEKLAPPTEN Spiegeln ist für ' +
        'diese Baureihe in keiner der gefundenen Quellen beziffert — die Spiegel sind laut ' +
        'Preisliste ab Werk automatisch anklappbar, das Maß nennt Ford aber erst ab V710.',
    },
    notiz:
      'Vorgängerbaureihe des V710, gebaut bis 2023, nur noch gebraucht zu haben. Zum ' +
      'Übernachten: Ford beziffert für diese Baureihe in den ausgewerteten Unterlagen keine ' +
      'Fahrgastraum- oder Liegelänge, deshalb steht hier kein Maß — die Karosserie ist rund ' +
      '8 cm kürzer als beim V710 L1. Die Spiegelbreite ist bei dieser Baureihe nach ' +
      'Herstellerangabe größer als beim Nachfolger, nicht kleiner.',
  },
  {
    id: 'ford-tourneo-custom-v362-l2',
    bezeichnung: 'Ford Tourneo Custom · V362 L2',
    modell: 'Tourneo Custom',
    variante: 'V362 L2 (langer Radstand 3300 mm), Normaldach',
    baujahre: '2018-2023',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.339,
      quellenstufe: 'A',
      quelle:
        'https://www.fordservicecontent.com/Ford_Content/Catalog/owner_information/CG3764deDEU-201911-20191203150840.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford-Betriebsanleitung, Abschnitt „Fahrzeugabmessungen“, Zeile „5.339 Gesamtlänge“ ' +
        '(langer Radstand). Deckungsgleich mit der Portalangabe 5339 mm.',
    },
    hoehe: {
      wert: 1.977,
      quellenstufe: 'C',
      quelle: 'https://de.automobiledimension.com/modell/ford/tourneo-custom-l2',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Normaldach. Ford nennt in der Betriebsanleitung nur die Spanne „1.968-2.373 ' +
        'Gesamthöhe ohne Antenne“, die Normaldach und Hochdach zusammenfasst. Der hier ' +
        'gesetzte Portalwert für das Normaldach liegt innerhalb dieser Spanne. Ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.986,
      quellenstufe: 'C',
      quelle: 'https://de.automobiledimension.com/modell/ford/tourneo-custom-l2',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Identisch zu L1; die Ford-Betriebsanleitung führt nur die Breite mit Spiegeln.',
    },
    breiteMitSpiegeln: {
      wert: 2.29,
      quellenstufe: 'A',
      quelle:
        'https://www.fordservicecontent.com/Ford_Content/Catalog/owner_information/CG3764deDEU-201911-20191203150840.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ford-Betriebsanleitung, Zeile „2.290 Gesamtbreite mit Außenspiegeln“ (identisch für ' +
        'kurzen und langen Radstand). WIDERSPRUCH: Datenportale nennen 2272 mm. Beide Werte ' +
        'liegen über der Engstelle. Ein Maß mit angeklappten Spiegeln ist für diese Baureihe ' +
        'nicht belegt.',
    },
    notiz:
      'Vorgängerbaureihe des V710, gebaut bis 2023, nur noch gebraucht zu haben. Zum ' +
      'Übernachten: keine Fahrgastraum- oder Liegelänge in den ausgewerteten Ford-Unterlagen ' +
      'beziffert, deshalb steht hier kein Maß. Der Radstand ist mit 3300 mm 200 mm kürzer als ' +
      'beim V710 L2, der Innenraum entsprechend knapper.',
  },
  {
    id: 'ford-nugget-v362-l1-aufstelldach',
    bezeichnung: 'Ford Nugget · V362 L1 Aufstelldach',
    modell: 'Nugget',
    variante: 'V362 L1 (Radstand 2933 mm), Aufstelldach',
    baujahre: '2022-2023',
    kategorie: 'camper',
    laenge: {
      wert: 4.972,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/ford/nugget/3generation-facelift/324330/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Deckungsgleich mit der Ford-Betriebsanleitung für den Tourneo Custom V362 L1 ' +
        '(4.972 mm) und mit auto-wiki.org; der Westfalia-Ausbau verändert die Länge nicht.',
    },
    hoehe: {
      wert: 2.06,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/ford/nugget/3generation-facelift/324330/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'AUFSTELLDACH IM GESCHLOSSENEN ZUSTAND. Das Aufstelldach ist die höhenbestimmende ' +
        'Baugruppe und liegt rund 8 cm über dem Normaldach der Personenvariante. Von promobil ' +
        '(„Ford Nugget AD: 497,0/199/206 cm“) und auto-wiki.org unabhängig bestätigt. Ohne ' +
        'Dachreling. Aufgestellt ist die Höhe deutlich größer und nirgends beziffert.',
    },
    breiteOhneSpiegel: {
      wert: 1.986,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/ford/nugget/3generation-facelift/324330/',
      abgerufenAm: '2026-08-07',
    },
    breiteMitSpiegeln: {
      wert: 2.272,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/ford/nugget/3generation-facelift/324330/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Portalwert. Ford selbst nennt für die baugleiche Basis (Tourneo Custom V362) in der ' +
        'Betriebsanleitung 2290 mm — 18 mm mehr. Kein Herstellerdatenblatt für den Nugget ' +
        'gefunden, das die Spiegelbreite ausweist. Breite mit angeklappten Spiegeln nicht belegt.',
    },
    notiz:
      'Campingausbau von Westfalia auf Transit Custom V362, hier mit AUFSTELLDACH (nicht ' +
      'Hochdach). Zum Übernachten ausgelegt: Dachbett im Aufstelldach plus eine aus der ' +
      'Rücksitzbank umbaubare untere Liegefläche. Die konkreten Bettmaße stehen in der aktuellen ' +
      'Ford-Preisliste nur für die Nachfolgebaureihe V710 und werden hier bewusst nicht ' +
      'übernommen. Bauzeitraum laut ADAC 03/2022 bis 07/2023 für die dort gelistete ' +
      'Motorvariante; der Nugget auf V362 wurde insgesamt länger gebaut.',
  },

  /**
   * Renault Trafic Passenger — Renault Deutschland führt den Trafic nur noch als Kastenwagen und
   * Doppelkabine; die Personenvariante steht dort nicht mehr im Programm. Die Maße stammen deshalb
   * aus der Schweizer Preisliste Nr. 19.0 (ab Mai 2026), einem Herstellerdokument.
   * Die Spiegelbreite von 2.312 mm ist der größte publizierte Wert und damit die konservative
   * Annahme; dieselben 1.956 / 2.312 mm führt auch die Preisliste des baugleichen Nissan
   * Primastar.
   */
  {
    id: 'renault-trafic-passenger-l1',
    bezeichnung: 'Renault Trafic Passenger · L1',
    modell: 'Renault Trafic Passenger',
    variante: 'L1',
    baujahre: '2021–2026 (Schweiz)',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.08,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Preisliste Nr. 19.0 (ab Mai 2026), Spalte PASSENGER. Probe: Radstand 3.098 + Überhang vorn 1.014 + Überhang hinten 968 = 5.080 mm.',
    },
    hoehe: {
      wert: 1.973,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Höhe bei Leergewicht". Renault weist für den Passenger keine Dachrelingvariante und keinen zweiten Höhenwert aus, der Wert ist also relingfrei zu lesen.',
    },
    breiteOhneSpiegel: {
      wert: 1.956,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Breite ohne / mit Rückspiegel", erster Wert.',
    },
    breiteMitSpiegeln: {
      wert: 2.312,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Breite ohne / mit Rückspiegel", zweiter Wert, Spiegel ausgeklappt. Ein Maß mit angeklappten Spiegeln veröffentlicht Renault nicht, obwohl die Spiegel elektrisch einklappbar sind.',
    },
    ladelaenge: {
      wert: 2.537,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ladelänge am Boden in der Werksversion mit 2–3 Sitzen. Mit 5–6 Sitzen und umgeklappter zweiter Reihe 2.066 mm, mit 5–6 Sitzen 1.650 mm, mit 8–9 Sitzen und umgeklappter dritter Reihe 1.152 mm, mit 8–9 Sitzen nur 736 mm.',
    },
    ladebreiteRadkasten: {
      wert: 1.23,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Mass zwischen den Radhäusern".',
    },
    innenhoeheLaderaum: {
      wert: 1.3,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Dachhöhe innen". Nissan gibt für das baugleiche Primastar-Kombi 1.369 mm an — beide Häuser messen offenbar unterschiedlich, siehe OFFEN-Hinweis in den Anmerkungen.',
    },
    notiz:
      'Renault Deutschland führt den Trafic nur noch als Kastenwagen und Doppelkabine; die ' +
      'Personenvariante steht dort nicht im Programm, der Beleg stammt aus der Schweizer ' +
      'Preisliste. Zum Übernachten die interessantere der beiden Längen nur bedingt: Eine ' +
      'ebene Fläche von 2.537 mm bei 1.300 mm Innenhöhe entsteht erst in der Werksversion ' +
      'mit 2–3 Sitzen; wer neun Sitze behält, hat hinter der dritten Reihe nur 736 mm. ' +
      'Breitestes Teil des Fahrzeugs sind die ausgeklappten Spiegel mit 2.312 mm gegenüber ' +
      '1.956 mm Karosserie — der Unterschied von 356 mm entscheidet an einer engen ' +
      'Einfahrt, nicht die Karosseriebreite.',
  },
  /**
   * Renault Grand Trafic Passenger — identische Baureihe, 400 mm mehr Radstand. Breite und
   * Spiegelbreite sind unverändert; nur Länge, Ladelänge und die Höhe (1 mm) unterscheiden sich.
   */
  {
    id: 'renault-trafic-passenger-l2',
    bezeichnung: 'Renault Grand Trafic Passenger · L2',
    modell: 'Renault Grand Trafic Passenger',
    variante: 'L2',
    baujahre: '2021–2026 (Schweiz)',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.48,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Preisliste Nr. 19.0 (ab Mai 2026), Spalte GRAND PASSENGER. Probe: Radstand 3.498 + Überhang vorn 1.014 + Überhang hinten 968 = 5.480 mm.',
    },
    hoehe: {
      wert: 1.974,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Höhe bei Leergewicht"; 1 mm über der kurzen Version. Keine Dachrelingvariante ausgewiesen.',
    },
    breiteOhneSpiegel: {
      wert: 1.956,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Breite ohne / mit Rückspiegel", erster Wert.',
    },
    breiteMitSpiegeln: {
      wert: 2.312,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Breite ohne / mit Rückspiegel", zweiter Wert, Spiegel ausgeklappt. Für die lange Version identisch mit der kurzen. Kein Maß mit angeklappten Spiegeln veröffentlicht.',
    },
    ladelaenge: {
      wert: 2.937,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Ladelänge am Boden in der Werksversion mit 2–3 Sitzen. Mit 5–6 Sitzen und umgeklappter zweiter Reihe 2.466 mm, mit 5–6 Sitzen 2.050 mm, mit 8–9 Sitzen und umgeklappter dritter Reihe 1.552 mm, mit 8–9 Sitzen 1.136 mm.',
    },
    ladebreiteRadkasten: {
      wert: 1.23,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Mass zwischen den Radhäusern", gegenüber der kurzen Version unverändert.',
    },
    innenhoeheLaderaum: {
      wert: 1.3,
      quellenstufe: 'A',
      quelle:
        'https://cdn.group.renault.com/ren/ch/renault-new-cars/pricelists/Renault_Neuer_Trafic_Passenger_Spaceclass_PL_d.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Dachhöhe innen", gegenüber der kurzen Version unverändert.',
    },
    notiz:
      'Renault Deutschland führt den Trafic nur noch als Kastenwagen und Doppelkabine; die ' +
      'Personenvariante steht dort nicht im Programm, der Beleg stammt aus der Schweizer ' +
      'Preisliste. Die längste hier belegte Liegefläche im Segment: 2.937 mm eben am Boden ' +
      'in der 2–3-sitzigen Werksversion, 2.466 mm noch mit fünf bis sechs Sitzen und ' +
      'umgeklappter zweiter Reihe — beides reicht bequem zum Ausstrecken, bei 1.300 mm ' +
      'Innenhöhe allerdings nur zum Liegen, nicht zum Stehen. Breitestes Teil bleiben die ' +
      'ausgeklappten Spiegel mit 2.312 mm. Die 400 mm Mehrlänge gegenüber L1 gehen ' +
      'vollständig in den Radstand.',
  },
  /**
   * Nissan Primastar Kombi — baugleich mit dem Renault Trafic Passenger (beide aus Sandouville),
   * die Maße sind aber getrennt belegt: Nissans eigene Preisliste vom 09.07.2026 hat für den Kombi
   * eine eigene Abmessungstabelle, die sich in Innenhöhe und Radkastenmaß von Renaults Angaben
   * unterscheidet. Nicht aus dem Kastenwagen-Prospekt übernehmen — der führt eine eigene Tabelle.
   */
  {
    id: 'nissan-primastar-kombi-l1h1',
    bezeichnung: 'Nissan Primastar Kombi · L1H1',
    modell: 'Nissan Primastar Kombi',
    variante: 'L1H1',
    baujahre: '2022+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.08,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Preisliste Primastar Kombi, Stand 09.07.2026, Abmessungstabelle Spalte L1H1, Zeile „Fahrzeuglänge".',
    },
    hoehe: {
      wert: 2.02,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Nissan gibt für den Kombi keine einzelne Höhe an, sondern die Spanne 1.935–2.020 mm; hier steht bewusst der obere Rand, weil für eine Einfahrtsfrage die ungünstige Annahme die richtige ist. Die Maßzeichnung derselben Preisliste zeigt 1.971 mm. H1-Dach, ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.956,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Fahrzeugbreite / ohne Außenspiegel".',
    },
    breiteMitSpiegeln: {
      wert: 2.312,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Fahrzeugbreite / mit Außenspiegel", Spiegel ausgeklappt; auch in der Maßzeichnung der Preisliste eingetragen. Ein Wert mit angeklappten Spiegeln wird nicht veröffentlicht.',
    },
    ladelaenge: {
      wert: 1.679,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Laderaumlänge am Boden des 6-Sitzers (N1). Der 9-Sitzer kommt hinter der dritten Reihe auf nur 736 mm. Eine 2–3-sitzige Werksversion bietet Nissan für den Kombi nicht an.',
    },
    ladebreiteRadkasten: {
      wert: 1.268,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Laderaumbreite / zwischen Radkästen"; maximale Laderaumbreite 1.662 mm. Renault nennt für den baugleichen Trafic Passenger 1.230 mm.',
    },
    innenhoeheLaderaum: {
      wert: 1.369,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Laderaumhöhe". Renault gibt für den baugleichen Trafic Passenger 1.300 mm „Dachhöhe innen" an — 69 mm Unterschied, vermutlich anderer Bezugspunkt.',
    },
    notiz:
      'Zum Übernachten die schwächere der beiden Primastar-Längen: Selbst als 6-Sitzer bleiben hinter der zweiten Reihe nur 1.679 mm ebene Länge, zum Ausstrecken zu wenig; als 9-Sitzer sind es 736 mm. Innenhöhe 1.369 mm, also Liegen statt Stehen. Für die Einfahrt zählt allein die Breite über die ausgeklappten Spiegel — 2.312 mm gegenüber 1.956 mm Karosserie.',
  },
  /**
   * Nissan Primastar Kombi L2H1 — 400 mm längerer Radstand, sonst identisch. Breite, Höhe,
   * Innenhöhe und Radkastenmaß sind laut Nissan unverändert; nur Länge und Laderaumlänge wachsen.
   */
  {
    id: 'nissan-primastar-kombi-l2h1',
    bezeichnung: 'Nissan Primastar Kombi · L2H1',
    modell: 'Nissan Primastar Kombi',
    variante: 'L2H1',
    baujahre: '2022+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.48,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Preisliste Primastar Kombi, Stand 09.07.2026, Abmessungstabelle Spalte L2H1, Zeile „Fahrzeuglänge"; Radstand 3.498 mm.',
    },
    hoehe: {
      wert: 2.02,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Nissan nennt auch für L2H1 die Spanne 1.935–2.020 mm; hier steht der obere Rand als konservative Annahme. Maßzeichnung 1.971 mm. H1-Dach, ohne Dachreling.',
    },
    breiteOhneSpiegel: {
      wert: 1.956,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Fahrzeugbreite / ohne Außenspiegel", gegenüber L1H1 unverändert.',
    },
    breiteMitSpiegeln: {
      wert: 2.312,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Zeile „Fahrzeugbreite / mit Außenspiegel", Spiegel ausgeklappt, für L2H1 eigens ausgewiesen und identisch mit L1H1. Kein Wert mit angeklappten Spiegeln veröffentlicht.',
    },
    ladelaenge: {
      wert: 2.079,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Laderaumlänge am Boden des 6-Sitzers (N1); der 9-Sitzer kommt hinter der dritten Reihe auf 1.136 mm.',
    },
    ladebreiteRadkasten: {
      wert: 1.268,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Laderaumbreite / zwischen Radkästen"; maximale Laderaumbreite 1.662 mm.',
    },
    innenhoeheLaderaum: {
      wert: 1.369,
      quellenstufe: 'A',
      quelle:
        'https://www-europe.nissan-cdn.net/content/dam/Nissan/de/Pricelists_and_Brochures/Primastar-Kombi/primastar-kombi-preisliste.pdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Zeile „Laderaumhöhe", gegenüber L1H1 unverändert.',
    },
    notiz:
      'Von den vier hier belegten Varianten die einzige Primastar-Version, in der sich liegen lässt: 2.079 mm ebene Länge am Boden als 6-Sitzer, bei 1.369 mm Innenhöhe. Als 9-Sitzer bleiben 1.136 mm. Breitestes Teil sind die ausgeklappten Spiegel mit 2.312 mm gegenüber 1.956 mm Karosserie — die 400 mm Mehrlänge gegenüber L1H1 stecken vollständig im Radstand.',
  },
  /*
   * Hyundai Staria. Die Vorabsichtung hielt ihn für den einzigen Kandidaten, der
   * primär an der Länge scheitert — das trägt nicht: Er reißt beide kritischen Maße,
   * über die Spiegel sogar deutlicher als über die Länge.
   */
  {
    id: 'hyundai-staria',
    bezeichnung: 'Hyundai Staria · Hybrid 9-/7-Sitzer',
    modell: 'Staria',
    variante: 'Hybrid 1.6 T-GDI, 9- oder 7-Sitzer',
    baujahre: '2021+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 5.253,
      quellenstufe: 'A',
      quelle: 'https://dmassets.hyundai.com/is/content/hyundaiautoever/hyundai-staria-preislistepdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Preisliste Hyundai Motor Deutschland, Stand Februar 2026, Seite 19, Tabelle ' +
        '„STARIA Hybrid — Technische Daten, 9- und 7-Sitzer": 5.253 / 1.997 / 1.990 mm, ' +
        'Radstand 3.273 mm. Die Maßskizze auf Seite 20 bestätigt dieselben Zahlen. ' +
        'Stabiler Einstieg: https://www.hyundai.com/de/de/preislisten/staria-9-sitzer.html ' +
        '(302 auf das PDF). Es gibt keine kürzere Karosserie.',
    },
    hoehe: {
      wert: 1.99,
      quellenstufe: 'A',
      quelle: 'https://dmassets.hyundai.com/is/content/hyundaiautoever/hyundai-staria-preislistepdf',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Dieselbe Tabelle, Seite 19. Die Preisliste nennt eine einzige Höhe für alle ' +
        'Ausstattungslinien und unterscheidet nicht nach Dachreling; ein gesonderter Wert ' +
        'mit Reling ist nicht ausgewiesen.',
    },
    breiteOhneSpiegel: {
      wert: 1.997,
      quellenstufe: 'A',
      quelle: 'https://dmassets.hyundai.com/is/content/hyundaiautoever/hyundai-staria-preislistepdf',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Dieselbe Tabelle, Seite 19; die Maßskizze auf Seite 20 bestätigt 1.997 mm.',
    },
    breiteMitSpiegeln: {
      wert: 2.29,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/hyundai/staria/1generation/337602/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog, Datenblatt „Hyundai Staria 1.6 T-GDI HEV Trend Automatik ' +
        '(ab 11/24)", Zeile „Breite mit Außenspiegel: 2290 mm". Identisch in den ' +
        'Datenblättern der Diesel 2.2 CRDi (08/21–11/24) und der Signature-Ausführung. ' +
        'Hyundai selbst weist in der deutschen Preisliste keine Spiegelbreite aus — daher ' +
        'Quellenstufe C statt A. Eine Breite mit angeklappten Spiegeln ist nicht veröffentlicht.',
    },
    notiz:
      'Wird in Deutschland angeboten (Hybrid Trend, Prime, Signature); die Diesel 2.2 CRDi ' +
      'liefen 08/21 bis 11/24 und stehen nicht mehr in der Preisliste. Alle Ausführungen — ' +
      '9- und 7-Sitzer, Diesel wie Hybrid, Front- wie Allradantrieb — tragen identische ' +
      'Außenmaße, eine kurze Version gibt es nicht. Er überschreitet beide kritischen Maße: ' +
      'die Länge um 33 mm, die Spiegelbreite um 50 mm. Über die Spiegel scheitert er also ' +
      'deutlicher als über die Länge.',
  },
  /*
   * Kia PV5 Passenger. Konzeptionell der interessanteste Fund der Kleinbus-Runde:
   * Nutzfahrzeugplattform, flacher Boden, kurz und niedrig genug. Er scheitert an
   * 15 Millimetern Spiegelbreite — und ausgerechnet die Breite mit angeklappten
   * Spiegeln, die hier über ja oder nein entscheiden würde, veröffentlicht Kia nicht.
   */
  {
    id: 'kia-pv5-passenger',
    bezeichnung: 'Kia PV5 · Passenger',
    modell: 'PV5',
    variante: 'Passenger, 5- bis 7-Sitzer',
    baujahre: '2025+',
    kategorie: 'kleinbus',
    laenge: {
      wert: 4.695,
      quellenstufe: 'A',
      quelle: 'https://www.kia.com/de/modelle/pv5-passenger/entdecken/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Abschnitt „Technische Daten", Zeile „Länge, Breite, Höhe (Höhe ohne Antenne): ' +
        '4.695, 1.895, 1.923 (1.899)" mm. In Deutschland nur diese eine Länge — alle 15 im ' +
        'ADAC-Katalog geführten Passenger-Ausführungen tragen dieselben Außenmaße. Die ' +
        'Kürzel L1H1 und L2H1 gehören zum PV5 Cargo, nicht zum Passenger.',
    },
    hoehe: {
      wert: 1.899,
      quellenstufe: 'A',
      quelle: 'https://www.kia.com/de/modelle/pv5-passenger/entdecken/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'Aus derselben Zeile: 1.923 mm mit Dachantenne, 1.899 mm ohne. Hier steht der Wert ' +
        'ohne Antenne. Eine Antenne ist keine Dachreling, deshalb kein Relingfeld; für die ' +
        'Garage ohnehin folgenlos, auch 1,923 m liegen weit unter der lichten Höhe.',
    },
    breiteOhneSpiegel: {
      wert: 1.895,
      quellenstufe: 'A',
      quelle: 'https://www.kia.com/de/modelle/pv5-passenger/entdecken/',
      abgerufenAm: '2026-08-07',
      bemerkung: 'Dieselbe Zeile im Abschnitt „Technische Daten".',
    },
    breiteMitSpiegeln: {
      wert: 2.255,
      quellenstufe: 'C',
      quelle:
        'https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/kia/pv5/1generation/340735/',
      abgerufenAm: '2026-08-07',
      bemerkung:
        'ADAC-Autokatalog, Datenblatt „Kia PV5 Passenger (51,5 kWh) Essential (5-Sitzer)", ' +
        'ab 10/2025, Zeile „Breite mit Außenspiegel: 2255 mm". Identisch in drei weiteren ' +
        'Datenblättern quer über Batteriegrößen, Ausstattungen und Sitzzahlen — kein ' +
        'Streuwert. Kia veröffentlicht den Wert selbst nicht; wo gesucht wurde, steht in ' +
        'der notiz. Eine Breite mit angeklappten Spiegeln ist nirgends veröffentlicht.',
    },
    notiz:
      'Kia gibt die Spiegelbreite in keiner eigenen Quelle heraus. Erfolglos geprüft: die ' +
      'Modellseite samt „Technische Daten", die PV5-Cargo-Seite, die Broschüren-Übersicht ' +
      '(lädt PDF-Links dynamisch nach), der Konfigurator, kia.com/nl und kia.com/uk, die ' +
      'digitale Broschüre und der Presseraum. Diese Suche muss nicht wiederholt werden, ' +
      'solange Kia keine Preisliste als PDF veröffentlicht. Länge und Höhe sind völlig ' +
      'unkritisch; es scheitert allein an 15 mm Spiegelbreite. Die Breite mit angeklappten ' +
      'Spiegeln würde hier über ja oder nein entscheiden und fehlt (OFFEN-45).',
  },
];

/** Auswahlliste für die Oberfläche: freie Eingabe zuerst, dann der Katalog. */
export const AUSWAHL: readonly Fahrzeug[] = [INDIVIDUELL, ...FAHRZEUGE];

/**
 * Referenzfahrzeug: der Caddy Maxi im Modellstand 2026 — das Fahrzeug, um das
 * es bei der Kaufentscheidung geht. Der Stand vor der Modellpflege steht als
 * eigener Eintrag daneben; die beiden unterscheiden sich in der
 * Heckklappenhöhe, und genau die entscheidet hier (OFFEN-12).
 */
export const REFERENZ_FAHRZEUG: Fahrzeug =
  FAHRZEUGE.find((f) => f.id === 'vw-caddy-sb-maxi-mopf') ?? FAHRZEUGE[0];

export function fahrzeugNachId(id: string): Fahrzeug | undefined {
  return AUSWAHL.find((f) => f.id === id);
}

/** Ob die Maße dieses Eintrags in der Oberfläche verändert werden dürfen. */
export function istEditierbar(id: string): boolean {
  return id === INDIVIDUELL_ID;
}
