/**
 * Fahrzeug-Datenmodell und Katalog.
 *
 * Umsetzung von Abschnitt 4 des Handoff-Dokuments: Liste aller Fahrzeuge der
 * Kategorien (Klein-)Bus, Minivan, Transporter, Camper und Hochdachkombi mit
 * möglichst detaillierten Außenmaßen, als Grundlage für 2D- und später
 * 3D-Modelle.
 *
 * Datendisziplin: Jedes Maß trägt seinen Datenstand. Was nicht belegt ist,
 * bleibt `undefined` oder wird als `'geschaetzt'` gekennzeichnet — ein
 * plausibel aussehendes, aber erfundenes Maß führt hier direkt zu einer
 * falschen Einpark-Aussage.
 *
 * Die Katalogeinträge sind fest hinterlegt und in der UI nicht editierbar.
 * Wer eigene Maße durchspielen will, wählt `INDIVIDUELL`.
 */

export type Fahrzeugkategorie =
  | 'hochdachkombi'
  | 'minivan'
  | 'kleinbus'
  | 'transporter'
  | 'camper';

export const KATEGORIE_LABEL: Record<Fahrzeugkategorie, string> = {
  hochdachkombi: 'Hochdachkombi',
  minivan: 'Minivan',
  kleinbus: 'Kleinbus',
  transporter: 'Transporter',
  camper: 'Camper',
};

export type Datenstand =
  /** Aus offiziellen Herstellerunterlagen übernommen. */
  | 'herstellerangabe'
  /** Aus Fachquellen recherchiert und über mindestens zwei Quellen abgeglichen. */
  | 'recherchiert'
  /** Selbst am Fahrzeug gemessen. */
  | 'gemessen'
  /** Näherung ohne Quelle — vor jeder Bewertung zu verifizieren. */
  | 'geschaetzt';

export const DATENSTAND_LABEL: Record<Datenstand, string> = {
  herstellerangabe: 'Herstellerangabe',
  recherchiert: 'recherchiert',
  gemessen: 'gemessen',
  geschaetzt: 'geschätzt',
};

/**
 * Seitenprofil für die 2D-Kollisionsprüfung. Alle Längen in Metern, gemessen ab
 * der Fahrzeugfront (x = 0) bzw. ab Fahrbahnoberkante (y = 0).
 *
 * Diese Maße stehen in keinem Datenblatt. Sie sind der empfindlichste Teil des
 * Modells: Beim Rückwärtseinparken entscheidet die flach abfallende Frontpartie
 * darüber, wie weit das schwenkende Torblatt kommt.
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
}

export interface Fahrzeug {
  readonly id: string;
  /** Anzeigename im Auswahlmenü. */
  readonly bezeichnung: string;
  readonly hersteller: string;
  readonly modell: string;
  /** Modelljahr oder Baureihe. */
  readonly baujahr: string;
  readonly kategorie: Fahrzeugkategorie;

  /** Gesamtlänge inkl. Stoßfänger. */
  readonly laenge: number;
  /** Höhe ohne Dachlast, bei Serienbereifung. */
  readonly hoehe: number;
  /** Breite ohne Außenspiegel. */
  readonly breiteOhneSpiegel?: number;
  /** Breite mit ausgeklappten Außenspiegeln. */
  readonly breiteMitSpiegeln?: number;
  /** Breite mit angeklappten Außenspiegeln. */
  readonly breiteSpiegelAngeklappt?: number;
  readonly radstand?: number;

  readonly seitenprofil: Seitenprofil;

  /** Datenstand der Außenmaße. */
  readonly datenstand: Datenstand;
  /** Datenstand des Seitenprofils — in aller Regel schlechter als der der Außenmaße. */
  readonly profilDatenstand: Datenstand;
  readonly quelle?: string;
  readonly notiz?: string;
}

/**
 * Freie Eingabe. Der einzige Eintrag, dessen Maße in der UI verändert werden
 * dürfen; die Startwerte entsprechen dem Referenzfahrzeug.
 */
export const INDIVIDUELL_ID = 'individuell';

export const INDIVIDUELL: Fahrzeug = {
  id: INDIVIDUELL_ID,
  bezeichnung: 'Individuell',
  hersteller: '—',
  modell: 'Freie Eingabe',
  baujahr: '—',
  kategorie: 'hochdachkombi',
  laenge: 4.851,
  hoehe: 1.829,
  breiteOhneSpiegel: 1.855,
  breiteMitSpiegeln: 2.1,
  seitenprofil: {
    haubenLaenge: 1.2,
    haubenHoehe: 0.95,
    dachLaenge: 2.7,
    scheibenLaenge: 0.5,
  },
  datenstand: 'geschaetzt',
  profilDatenstand: 'geschaetzt',
  notiz: 'Alle Maße frei veränderbar. Startwerte vom VW Caddy Maxi übernommen.',
};

/**
 * Fest hinterlegter Katalog. Wächst Fahrzeug für Fahrzeug — siehe
 * docs/04-roadmap.md, Phase 3.
 */
export const FAHRZEUGE: readonly Fahrzeug[] = [
  {
    id: 'vw-caddy-maxi-2026',
    bezeichnung: 'VW Caddy Maxi (2026)',
    hersteller: 'Volkswagen',
    modell: 'Caddy Maxi',
    baujahr: '2026',
    kategorie: 'hochdachkombi',
    laenge: 4.851,
    hoehe: 1.829,
    breiteOhneSpiegel: 1.855,
    breiteMitSpiegeln: 2.1,
    radstand: 2.968,
    seitenprofil: {
      haubenLaenge: 1.2,
      haubenHoehe: 0.95,
      dachLaenge: 2.7,
      scheibenLaenge: 0.5,
    },
    datenstand: 'recherchiert',
    profilDatenstand: 'geschaetzt',
    quelle:
      'Außenmaße über MeinAuto.de (Caddy Maxi 2026) und auto-data.net (Caddy Maxi V) ' +
      'abgeglichen, Stand 08/2026. Breite mit Spiegeln nur auf 2,10 m gerundet belegt.',
    notiz:
      'Das Seitenprofil (Haubenlänge, Haubenhöhe, Dachlänge) steht in keinem Datenblatt ' +
      'und stammt aus dem Prototyp. Es bestimmt die Kollisionsprüfung und ist am Fahrzeug ' +
      'nachzumessen, bevor eine Kaufentscheidung darauf gestützt wird.',
  },
];

/** Auswahlliste für die UI: freie Eingabe zuerst, dann der Katalog. */
export const AUSWAHL: readonly Fahrzeug[] = [INDIVIDUELL, ...FAHRZEUGE];

export const REFERENZ_FAHRZEUG: Fahrzeug = FAHRZEUGE[0];

export function fahrzeugNachId(id: string): Fahrzeug | undefined {
  return AUSWAHL.find((f) => f.id === id);
}

/** Ob die Maße dieses Eintrags in der UI verändert werden dürfen. */
export function istEditierbar(id: string): boolean {
  return id === INDIVIDUELL_ID;
}
