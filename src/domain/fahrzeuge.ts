/**
 * Fahrzeug-Datenmodell und Katalog.
 *
 * Umsetzung von Abschnitt 4 des Handoff-Dokuments. Die Maße stammen aus der
 * Vergleichsmatrix „Autokauf" (Blatt „02 Maße & Garage", Stand 05.08.2026) und
 * wurden maschinell übernommen, nicht abgetippt.
 *
 * Datendisziplin — übernommen aus der Methodik der Vergleichsmatrix:
 *
 * - Jedes Fahrzeug trägt eine **Quellenstufe** A bis D. Sie sagt, wie belastbar
 *   die Maße sind, und wird in der Oberfläche angezeigt.
 * - Was dort als „n. v." stand, ist hier `undefined`. Es wurde nichts geschätzt,
 *   um eine Lücke zu füllen.
 * - Das **Seitenprofil** ist optional und für kein Katalogfahrzeug belegt: Es
 *   steht in keinem Datenblatt. Fehlt es, rechnet die Kollisionsprüfung mit
 *   einem Quader über die volle Höhe — die konservative Annahme. Ein erfundenes
 *   Profil würde das Tor freier aussehen lassen, als es ist.
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
  readonly laenge: number;
  /** Höhe ohne Dachreling — die erhöht um bis zu 66 mm. */
  readonly hoehe: number;
  readonly breiteOhneSpiegel?: number;
  readonly breiteMitSpiegeln?: number;
  /**
   * Höhe bei geöffneter Heckklappe. Entscheidet darüber, ob sich der Kofferraum
   * in der Garage überhaupt öffnen lässt.
   */
  readonly hoeheHeckOffen?: number;
  readonly ladelaenge?: number;
  readonly ladebreiteRadkasten?: number;
  readonly innenhoeheLaderaum?: number;

  /** Fehlt bei fast allen — dann rechnet die Prüfung mit einem Quader. */
  readonly seitenprofil?: Seitenprofil;

  readonly quellenstufe: Quellenstufe;
  readonly notiz?: string;
}

/**
 * Freie Eingabe. Der einzige Eintrag, dessen Maße in der Oberfläche verändert
 * werden dürfen.
 */
export const INDIVIDUELL_ID = 'individuell';

export const INDIVIDUELL: Fahrzeug = {
  id: INDIVIDUELL_ID,
  bezeichnung: 'Individuell — freie Eingabe',
  modell: 'Individuell',
  variante: 'freie Eingabe',
  baujahre: '—',
  kategorie: 'hochdachkombi',
  laenge: 4.863,
  hoehe: 1.842,
  breiteOhneSpiegel: 1.855,
  breiteMitSpiegeln: 2.1,
  seitenprofil: {
    haubenLaenge: 1.2,
    haubenHoehe: 0.95,
    dachLaenge: 2.7,
    scheibenLaenge: 0.5,
    quellenstufe: 'D',
  },
  quellenstufe: 'D',
  notiz: 'Alle Maße frei veränderbar. Startwerte vom VW Caddy SB Maxi übernommen.',
};

/**
 * Katalog aus der Vergleichsmatrix, Blatt „02 Maße & Garage".
 *
 * Nicht übernommen wurde der Ford Grand Tourneo Connect der 2. Generation: Für
 * ihn ist weder Länge noch Höhe verifizierbar, und ohne diese beiden Maße lässt
 * sich nichts prüfen.
 */
export const FAHRZEUGE: readonly Fahrzeug[] = [
  {
    id: 'vw-caddy-2k-kurz',
    bezeichnung: 'VW Caddy 2K · kurz',
    modell: 'VW Caddy 2K',
    variante: 'kurz',
    baujahre: '2003–2020',
    kategorie: 'hochdachkombi',
    laenge: 4.406,
    hoehe: 1.823,
    ladelaenge: 1.781,
    ladebreiteRadkasten: 1.172,
    innenhoeheLaderaum: 1.244,
    quellenstufe: 'C',
    notiz:
      'Ladelänge zu kurz; Breite nicht verifizierbar',
  },
  {
    id: 'vw-caddy-2k-maxi',
    bezeichnung: 'VW Caddy 2K · Maxi',
    modell: 'VW Caddy 2K',
    variante: 'Maxi',
    baujahre: '2004–2020',
    kategorie: 'hochdachkombi',
    laenge: 4.876,
    hoehe: 1.886,
    ladelaenge: 2.25,
    ladebreiteRadkasten: 1.172,
    innenhoeheLaderaum: 1.262,
    quellenstufe: 'C',
    notiz:
      'Längste Ladefläche des Katalogs. Eine Anhängerkupplung verlängert das Fahrzeug über ' +
      'das hier geführte Maß hinaus.',
  },
  {
    id: 'vw-caddy-sb-kurz',
    bezeichnung: 'VW Caddy SB · kurz',
    modell: 'VW Caddy SB',
    variante: 'kurz',
    baujahre: '2020+',
    kategorie: 'hochdachkombi',
    laenge: 4.5,
    hoehe: 1.856,
    breiteOhneSpiegel: 1.855,
    breiteMitSpiegeln: 2.1,
    ladelaenge: 1.797,
    ladebreiteRadkasten: 1.23,
    innenhoeheLaderaum: 1.272,
    quellenstufe: 'C',
    notiz:
      'Zu kurz zum Schlafen; über Budget',
  },
  {
    id: 'vw-caddy-sb-maxi',
    bezeichnung: 'VW Caddy SB · Maxi',
    modell: 'VW Caddy SB',
    variante: 'Maxi',
    baujahre: '2020+',
    kategorie: 'hochdachkombi',
    laenge: 4.863,
    hoehe: 1.842,
    breiteOhneSpiegel: 1.855,
    breiteMitSpiegeln: 2.1,
    ladelaenge: 2.15,
    ladebreiteRadkasten: 1.23,
    innenhoeheLaderaum: 1.275,
    hoeheHeckOffen: 2.155,
    quellenstufe: 'A',
    notiz:
      'Höhe per VW-Datenblatt bestätigt (Widerspruch 1800/1860 aufgelöst). Über Budget. ' +
      'Heckklappenhöhe aus Blatt „11 Neuwagen 2026“, dort für den Caddy Life Maxi eHybrid mit ' +
      '1.850 mm Fahrzeughöhe statt 1.842 mm — Variantenzuordnung nicht gesichert.',
  },
  {
    id: 'renault-kangoo-ii-kurz-l1',
    bezeichnung: 'Renault Kangoo II · kurz (L1)',
    modell: 'Renault Kangoo II',
    variante: 'kurz (L1)',
    baujahre: '2007–2021',
    kategorie: 'hochdachkombi',
    laenge: 4.321,
    hoehe: 1.816,
    ladelaenge: 1.753,
    ladebreiteRadkasten: 1.219,
    innenhoeheLaderaum: 1.258,
    quellenstufe: 'C',
    notiz:
      'Ladelänge zu kurz',
  },
  {
    id: 'renault-kangoo-ii-maxi-l2-kastenwagen',
    bezeichnung: 'Renault Kangoo II · Maxi (L2, Kastenwagen)',
    modell: 'Renault Kangoo II',
    variante: 'Maxi (L2, Kastenwagen)',
    baujahre: '2007–2021',
    kategorie: 'hochdachkombi',
    laenge: 4.705,
    hoehe: 1.839,
    ladelaenge: 2.137,
    ladebreiteRadkasten: 1.219,
    innenhoeheLaderaum: 1.258,
    quellenstufe: 'C',
    notiz:
      'Kastenwagen-Datenblatt (vehikit)',
  },
  {
    id: 'renault-grand-kangoo-pkw-langversion',
    bezeichnung: 'Renault Grand Kangoo · PKW-Langversion',
    modell: 'Renault Grand Kangoo',
    variante: 'PKW-Langversion',
    baujahre: '2013–2021',
    kategorie: 'hochdachkombi',
    laenge: 4.688,
    hoehe: 1.802,
    ladelaenge: 2.21,
    ladebreiteRadkasten: 1.144,
    innenhoeheLaderaum: 1.258,
    quellenstufe: 'A',
    notiz:
      'EMPFEHLUNG. Renault-Originalbroschüre 2013: 2.210 mm mit umgeklappter 2. Reihe, bis' +
      '2.850 mm mit Beifahrersitz. Radkastenbreite nur 1144 mm!',
  },
  {
    id: 'renault-kangoo-iii-l1',
    bezeichnung: 'Renault Kangoo III · L1',
    modell: 'Renault Kangoo III',
    variante: 'L1',
    baujahre: '2021+',
    kategorie: 'hochdachkombi',
    laenge: 4.486,
    hoehe: 1.848,
    breiteOhneSpiegel: 1.86,
    breiteMitSpiegeln: 2.159,
    ladelaenge: 1.806,
    ladebreiteRadkasten: 1.248,
    innenhoeheLaderaum: 1.215,
    quellenstufe: 'C',
    notiz:
      'Zu neu/teuer, Ladelänge zu kurz',
  },
  {
    id: 'renault-grand-kangoo-l2-neue-gen',
    bezeichnung: 'Renault Grand Kangoo · L2 neue Gen.',
    modell: 'Renault Grand Kangoo',
    variante: 'L2 neue Gen.',
    baujahre: '2021+',
    kategorie: 'hochdachkombi',
    laenge: 4.91,
    hoehe: 1.854,
    breiteOhneSpiegel: 1.86,
    breiteMitSpiegeln: 2.14,
    ladelaenge: 2.23,
    ladebreiteRadkasten: 1.248,
    innenhoeheLaderaum: 1.215,
    hoeheHeckOffen: 2.071,
    quellenstufe: 'C',
    notiz:
      'NAMENSFALLE: gleicher Name wie die Zielgeneration, aber andere Maße. ' +
      'Heckklappenhöhe aus Blatt „11 Neuwagen 2026“, dort verifiziert, aber bei 1.815 mm ' +
      'Fahrzeughöhe statt 1.854 mm — Variantenzuordnung nicht gesichert.',
  },
  {
    id: 'berlingo-multispace-partner-tepee-b9-m-l1',
    bezeichnung: 'Berlingo Multispace / Partner Tepee · B9 M (L1)',
    modell: 'Berlingo Multispace / Partner Tepee',
    variante: 'B9 M (L1)',
    baujahre: '2008–2018',
    kategorie: 'hochdachkombi',
    laenge: 4.38,
    hoehe: 1.862,
    breiteOhneSpiegel: 1.81,
    breiteMitSpiegeln: 2.112,
    ladelaenge: 1.8,
    ladebreiteRadkasten: 1.25,
    innenhoeheLaderaum: 1.148,
    quellenstufe: 'C',
    notiz:
      'Ladelänge zu kurz',
  },
  {
    id: 'berlingo-multispace-xl-partner-tepee-l2-b9-xl-l2',
    bezeichnung: 'Berlingo Multispace XL / Partner Tepee L2 · B9 XL (L2)',
    modell: 'Berlingo Multispace XL / Partner Tepee L2',
    variante: 'B9 XL (L2)',
    baujahre: '2008–2018',
    kategorie: 'hochdachkombi',
    laenge: 4.63,
    hoehe: 1.867,
    breiteOhneSpiegel: 1.81,
    breiteMitSpiegeln: 2.112,
    ladelaenge: 2.05,
    ladebreiteRadkasten: 1.25,
    innenhoeheLaderaum: 1.148,
    quellenstufe: 'C',
    notiz:
      'Niedrigster Laderaum des Katalogs (1148 mm).',
  },
  {
    id: 'berlingo-rifter-combo-life-proace-city-k9-m-l1',
    bezeichnung: 'Berlingo / Rifter / Combo Life / Proace City · K9 M (L1)',
    modell: 'Berlingo / Rifter / Combo Life / Proace City',
    variante: 'K9 M (L1)',
    baujahre: '2018+',
    kategorie: 'hochdachkombi',
    laenge: 4.403,
    hoehe: 1.874,
    breiteOhneSpiegel: 1.848,
    breiteMitSpiegeln: 2.107,
    ladelaenge: 1.781,
    ladebreiteRadkasten: 1.229,
    innenhoeheLaderaum: 1.185,
    quellenstufe: 'C',
    notiz:
      'Ladelänge zu kurz; Höhenangaben zwischen Quellen um bis zu 80 mm widersprüchlich',
  },
  {
    id: 'berlingo-xl-rifter-long-combo-xl-proace-city-l2-k9-xl-l2',
    bezeichnung: 'Berlingo XL / Rifter Long / Combo XL / Proace City L2 · K9 XL (L2)',
    modell: 'Berlingo XL / Rifter Long / Combo XL / Proace City L2',
    variante: 'K9 XL (L2)',
    baujahre: '2018+',
    kategorie: 'hochdachkombi',
    laenge: 4.753,
    hoehe: 1.88,
    breiteOhneSpiegel: 1.848,
    breiteMitSpiegeln: 2.107,
    ladelaenge: 2.131,
    ladebreiteRadkasten: 1.229,
    innenhoeheLaderaum: 1.185,
    quellenstufe: 'C',
    notiz:
      'Über Budget. Höhere Sicherheitsannahme bei Höhe verwendet.',
  },
  {
    id: 'opel-combo-tour-doblo-basis-standard',
    bezeichnung: 'Opel Combo Tour · Doblo-Basis Standard',
    modell: 'Opel Combo Tour',
    variante: 'Doblo-Basis Standard',
    baujahre: '2012–2018',
    kategorie: 'hochdachkombi',
    laenge: 4.39,
    hoehe: 1.845,
    breiteOhneSpiegel: 1.831,
    breiteMitSpiegeln: 2.119,
    ladelaenge: 1.82,
    ladebreiteRadkasten: 1.23,
    innenhoeheLaderaum: 1.305,
    quellenstufe: 'C',
    notiz:
      'Ladelänge zu kurz',
  },
  {
    id: 'opel-combo-tour-maxi-doblo-basis-l2',
    bezeichnung: 'Opel Combo Tour Maxi · Doblo-Basis L2',
    modell: 'Opel Combo Tour Maxi',
    variante: 'Doblo-Basis L2',
    baujahre: '2012–2018',
    kategorie: 'hochdachkombi',
    laenge: 4.74,
    hoehe: 1.88,
    breiteOhneSpiegel: 1.831,
    breiteMitSpiegeln: 2.119,
    ladelaenge: 2.17,
    ladebreiteRadkasten: 1.23,
    innenhoeheLaderaum: 1.305,
    quellenstufe: 'C',
    notiz:
      'Am deutschen Markt praktisch nicht kaufbar (1 von 24 Angeboten)',
  },
  {
    id: 'fiat-doblo-152-263-standard',
    bezeichnung: 'Fiat Doblo · 152/263 Standard',
    modell: 'Fiat Doblo',
    variante: '152/263 Standard',
    baujahre: '2010–2022',
    kategorie: 'hochdachkombi',
    laenge: 4.406,
    hoehe: 1.845,
    breiteOhneSpiegel: 1.831,
    breiteMitSpiegeln: 2.119,
    ladelaenge: 1.82,
    ladebreiteRadkasten: 1.23,
    innenhoeheLaderaum: 1.305,
    quellenstufe: 'C',
    notiz:
      'Ladelänge zu kurz',
  },
  {
    id: 'fiat-doblo-maxi-152-263-l2',
    bezeichnung: 'Fiat Doblo Maxi · 152/263 L2',
    modell: 'Fiat Doblo Maxi',
    variante: '152/263 L2',
    baujahre: '2010–2022',
    kategorie: 'hochdachkombi',
    laenge: 4.756,
    hoehe: 1.88,
    breiteOhneSpiegel: 1.831,
    breiteMitSpiegeln: 2.119,
    ladelaenge: 2.17,
    ladebreiteRadkasten: 1.23,
    innenhoeheLaderaum: 1.305,
    quellenstufe: 'C',
    notiz:
      'Höchster Laderaum (1305 mm) = beste Kopffreiheit. CNG-Werksversion verfügbar.',
  },
  {
    id: 'mercedes-citan-w415-lang-l2',
    bezeichnung: 'Mercedes Citan W415 · lang (L2)',
    modell: 'Mercedes Citan W415',
    variante: 'lang (L2)',
    baujahre: '2012–2021',
    kategorie: 'hochdachkombi',
    laenge: 4.321,
    hoehe: 1.816,
    ladelaenge: 1.753,
    ladebreiteRadkasten: 1.219,
    innenhoeheLaderaum: 1.258,
    quellenstufe: 'C',
    notiz:
      'Ladelänge zu kurz',
  },
  {
    id: 'mercedes-citan-w415-extralang-l3',
    bezeichnung: 'Mercedes Citan W415 · extralang (L3)',
    modell: 'Mercedes Citan W415',
    variante: 'extralang (L3)',
    baujahre: '2012–2021',
    kategorie: 'hochdachkombi',
    laenge: 4.705,
    hoehe: 1.839,
    ladelaenge: 2.137,
    ladebreiteRadkasten: 1.219,
    innenhoeheLaderaum: 1.258,
    quellenstufe: 'C',
    notiz:
      'Baugleich Kangoo Maxi – in der Prüfung nicht per Mercedes-Datenblatt re-verifizierbar',
  },
  {
    id: 'mercedes-citan-w420-l1',
    bezeichnung: 'Mercedes Citan W420 · L1',
    modell: 'Mercedes Citan W420',
    variante: 'L1',
    baujahre: '2021+',
    kategorie: 'hochdachkombi',
    laenge: 4.498,
    hoehe: 1.838,
    breiteOhneSpiegel: 1.859,
    breiteMitSpiegeln: 2.159,
    ladelaenge: 1.806,
    ladebreiteRadkasten: 1.248,
    innenhoeheLaderaum: 1.256,
    quellenstufe: 'C',
    notiz:
      'Zu neu/teuer',
  },
  {
    id: 'mercedes-citan-w420-l2',
    bezeichnung: 'Mercedes Citan W420 · L2',
    modell: 'Mercedes Citan W420',
    variante: 'L2',
    baujahre: '2021+',
    kategorie: 'hochdachkombi',
    laenge: 4.922,
    hoehe: 1.838,
    ladelaenge: 2.17,
    ladebreiteRadkasten: 1.248,
    innenhoeheLaderaum: 1.256,
    quellenstufe: 'C',
  },
  {
    id: 'nissan-nv200-evalia-pkw',
    bezeichnung: 'Nissan NV200 Evalia · PKW',
    modell: 'Nissan NV200 Evalia',
    variante: 'PKW',
    baujahre: '2009–2019',
    kategorie: 'kleinbus',
    laenge: 4.4,
    hoehe: 1.86,
    breiteOhneSpiegel: 1.695,
    breiteMitSpiegeln: 2.011,
    ladelaenge: 2.04,
    innenhoeheLaderaum: 1.36,
    quellenstufe: 'C',
    notiz:
      'Schmalstes Fahrzeug des Katalogs (2011 mm mit Spiegeln) bei 204 cm Ladelänge.',
  },
  {
    id: 'nissan-townstar-evalia-neu',
    bezeichnung: 'Nissan Townstar Evalia · neu',
    modell: 'Nissan Townstar Evalia',
    variante: 'neu',
    baujahre: '2022+',
    kategorie: 'kleinbus',
    laenge: 4.911,
    hoehe: 1.869,
    breiteOhneSpiegel: 1.86,
    breiteMitSpiegeln: 2.159,
    quellenstufe: 'C',
  },
  {
    id: 'ford-tourneo-connect-2-gen',
    bezeichnung: 'Ford Tourneo Connect · 2. Gen.',
    modell: 'Ford Tourneo Connect',
    variante: '2. Gen.',
    baujahre: '2013–2021',
    kategorie: 'hochdachkombi',
    laenge: 4.418,
    hoehe: 1.833,
    breiteOhneSpiegel: 1.835,
    breiteMitSpiegeln: 2.1,
    ladelaenge: 1.886,
    ladebreiteRadkasten: 1.192,
    innenhoeheLaderaum: 1.211,
    quellenstufe: 'C',
    notiz:
      'Quellen zur Länge uneinheitlich (4418–4515)',
  },
  {
    id: 'ford-grand-tourneo-connect-3-gen-caddy-basis',
    bezeichnung: 'Ford Grand Tourneo Connect · 3. Gen. (Caddy-Basis)',
    modell: 'Ford Grand Tourneo Connect',
    variante: '3. Gen. (Caddy-Basis)',
    baujahre: '2022+',
    kategorie: 'hochdachkombi',
    laenge: 4.853,
    hoehe: 1.835,
    breiteOhneSpiegel: 1.855,
    breiteMitSpiegeln: 2.1,
    ladelaenge: 2.15,
    quellenstufe: 'C',
    notiz:
      'Ladelänge nur per Plattform-Analogie geschätzt. Über Budget.',
  },
  {
    id: 'dacia-dokker-standard',
    bezeichnung: 'Dacia Dokker · Standard',
    modell: 'Dacia Dokker',
    variante: 'Standard',
    baujahre: '2012–2021',
    kategorie: 'hochdachkombi',
    laenge: 4.363,
    hoehe: 1.852,
    breiteOhneSpiegel: 1.751,
    breiteMitSpiegeln: 2.004,
    quellenstufe: 'C',
    notiz:
      'Ladelänge nicht verifizierbar',
  },
  {
    id: 'dacia-lodgy-standard',
    bezeichnung: 'Dacia Lodgy · Standard',
    modell: 'Dacia Lodgy',
    variante: 'Standard',
    baujahre: '2012–2021',
    kategorie: 'minivan',
    laenge: 4.498,
    hoehe: 1.68,
    breiteOhneSpiegel: 1.751,
    breiteMitSpiegeln: 2.004,
    quellenstufe: 'C',
    notiz:
      'Kein Hochdachkombi – zu geringe Kopffreiheit',
  },
  {
    id: 'dacia-duster-gen-i-ii',
    bezeichnung: 'Dacia Duster · Gen I/II',
    modell: 'Dacia Duster',
    variante: 'Gen I/II',
    baujahre: '2010–2023',
    kategorie: 'gelaendewagen',
    laenge: 4.341,
    hoehe: 1.693,
    breiteOhneSpiegel: 1.804,
    breiteMitSpiegeln: 2.052,
    ladelaenge: 1.8,
    quellenstufe: 'C',
    notiz:
      'Plan B: Ladelänge ca. 180 cm, keine Kopffreiheit',
  },
  {
    id: 'dacia-jogger-sleep-pack',
    bezeichnung: 'Dacia Jogger · + Sleep Pack',
    modell: 'Dacia Jogger',
    variante: '+ Sleep Pack',
    baujahre: '2022+',
    kategorie: 'kombi',
    laenge: 4.547,
    hoehe: 1.674,
    breiteOhneSpiegel: 1.784,
    breiteMitSpiegeln: 2.002,
    ladelaenge: 1.9,
    quellenstufe: 'B',
    notiz:
      'Plan B: Sleep Pack nur 190×130 cm = 5 cm zu kurz',
  },
  {
    id: 'vw-caddy-california-referenz-werksausbau',
    bezeichnung: 'VW Caddy California · Referenz Werksausbau',
    modell: 'VW Caddy California',
    variante: 'Referenz Werksausbau',
    baujahre: '2020+',
    kategorie: 'hochdachkombi',
    laenge: 4.853,
    hoehe: 1.842,
    breiteOhneSpiegel: 1.855,
    breiteMitSpiegeln: 2.1,
    ladelaenge: 2.15,
    ladebreiteRadkasten: 1.23,
    innenhoeheLaderaum: 1.275,
    quellenstufe: 'A',
    notiz:
      'Bett 198×107 cm. 35.000–46.000 € – weit über Budget.',
  },
];

/** Auswahlliste für die Oberfläche: freie Eingabe zuerst, dann der Katalog. */
export const AUSWAHL: readonly Fahrzeug[] = [INDIVIDUELL, ...FAHRZEUGE];

/** Referenzfahrzeug: der Caddy Maxi, das einzige mit Herstellerdatenblatt. */
export const REFERENZ_FAHRZEUG: Fahrzeug =
  FAHRZEUGE.find((f) => f.id === 'vw-caddy-sb-maxi') ?? FAHRZEUGE[0];

export function fahrzeugNachId(id: string): Fahrzeug | undefined {
  return AUSWAHL.find((f) => f.id === id);
}

/** Ob die Maße dieses Eintrags in der Oberfläche verändert werden dürfen. */
export function istEditierbar(id: string): boolean {
  return id === INDIVIDUELL_ID;
}
