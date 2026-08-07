import { Fahrzeug, Fahrzeugmass, pruefhoehe, Quellenstufe } from '../domain/fahrzeuge';
import { GarageConfig, nutzbareTiefe } from './kinematics';

/**
 * Prüft ein Fahrzeug gegen die gemessene Garage — Länge, Höhe, Breite.
 *
 * Bewusst getrennt von der Tor-Kinematik: Das hier ist die statische Frage
 * „passt das Fahrzeug überhaupt hinein", die Kinematik beantwortet die
 * dynamische „schließt das Tor danach noch".
 *
 * Die Vergleichsmatrix rechnete mit anderen Garagenmaßen (5.100 mm Länge,
 * 2.190 mm Höhe, 2.300 mm Breite). Hier gelten ausschließlich die nachgemessenen
 * Werte aus `src/domain/garage.ts`.
 */

/** Ab dieser Reserve gilt eine Achse als sicher, darunter als knapp. */
export const RESERVE_SICHER = 0.15;

export type Urteil = 'sicher' | 'knapp' | 'passt-nicht' | 'nicht-pruefbar';

export interface Achsenbefund {
  readonly achse: 'laenge' | 'hoehe' | 'breite';
  readonly bezeichnung: string;
  /** Verfügbares Maß der Garage. */
  readonly verfuegbar: number;
  /** Benötigtes Maß des Fahrzeugs, `undefined` wenn nicht belegt. */
  readonly benoetigt?: number;
  /** Verfügbar minus benötigt. Negativ heißt: passt nicht. */
  readonly reserve?: number;
  readonly urteil: Urteil;
  readonly anmerkung?: string;
  /** Belastbarkeit des Fahrzeugmaßes, auf dem dieses Urteil beruht. */
  readonly quellenstufe?: Quellenstufe;
  /** Beleg des Fahrzeugmaßes — damit ein knappes Urteil nachprüfbar bleibt. */
  readonly quelle?: string;
  /** Einschränkung, die am Maß selbst vermerkt ist. */
  readonly massBemerkung?: string;
}

export interface Garagenbefund {
  readonly fahrzeug: Fahrzeug;
  readonly achsen: readonly Achsenbefund[];
  /** Das schlechteste Einzelurteil über alle Achsen. */
  readonly urteil: Urteil;
  /** Kleinste belegte Reserve, `undefined` wenn keine Achse prüfbar ist. */
  readonly engsteReserve?: number;
  /** Lässt sich die Heckklappe in der Garage öffnen? `undefined` = unbekannt. */
  readonly heckklappeOeffenbar?: boolean;
  /**
   * Lichte Höhe minus Höhe bei geöffneter Klappe. Negativ heißt: passt nicht.
   * Ein knappes Ja ist hier kein belastbares Ja — beim Referenzfahrzeug geht es
   * um 15 mm, und die Herstellerangaben streuen um 23 mm (OFFEN-12).
   */
  readonly heckklappeReserve?: number;
}

function bewerte(verfuegbar: number, benoetigt: number | undefined): Urteil {
  if (benoetigt === undefined) return 'nicht-pruefbar';
  const reserve = verfuegbar - benoetigt;
  if (reserve < 0) return 'passt-nicht';
  return reserve >= RESERVE_SICHER ? 'sicher' : 'knapp';
}

/** Reihenfolge von gut nach schlecht — bestimmt das Gesamturteil. */
const RANG: Record<Urteil, number> = {
  sicher: 0,
  'nicht-pruefbar': 1,
  knapp: 2,
  'passt-nicht': 3,
};

export function pruefeGarage(
  fahrzeug: Fahrzeug,
  config: GarageConfig,
  breiteEinfahrt: number,
): Garagenbefund {
  // Breite: maßgeblich ist die Breite mit ausgeklappten Spiegeln, weil das
  // Fahrzeug in dieser Stellung durch die Einfahrt fährt.
  const breite = fahrzeug.breiteMitSpiegeln ?? fahrzeug.breiteOhneSpiegel;
  // Höhe: mit Dachreling, wo sie belegt ist — in der Einfahrt steht das
  // Fahrzeug, das gebaut wurde, nicht die relingfreie Tabellenzeile.
  const hoehe = pruefhoehe(fahrzeug);
  const mitReling = hoehe === fahrzeug.hoeheMitDachreling;

  /** Beleg eines Maßes in den Befund übernehmen. */
  const beleg = (mass?: Fahrzeugmass) => ({
    quellenstufe: mass?.quellenstufe,
    quelle: mass?.quelle,
    massBemerkung: mass?.bemerkung,
  });

  const achsen: Achsenbefund[] = [
    {
      achse: 'laenge',
      bezeichnung: 'Länge',
      verfuegbar: nutzbareTiefe(config),
      benoetigt: fahrzeug.laenge.wert,
      reserve: nutzbareTiefe(config) - fahrzeug.laenge.wert,
      urteil: bewerte(nutzbareTiefe(config), fahrzeug.laenge.wert),
      anmerkung: 'Rohbaulänge abzüglich Federzone und Dämmung. Ohne Anhängerkupplung.',
      ...beleg(fahrzeug.laenge),
    },
    {
      achse: 'hoehe',
      bezeichnung: 'Höhe',
      verfuegbar: config.CLEAR_HEIGHT,
      benoetigt: hoehe.wert,
      reserve: config.CLEAR_HEIGHT - hoehe.wert,
      urteil: bewerte(config.CLEAR_HEIGHT, hoehe.wert),
      anmerkung: mitReling
        ? 'Lichte Höhe unter der Laufschiene. Geprüft mit Dachreling, weil sie belegt ist.'
        : fahrzeug.hoeheMitDachreling === undefined
          ? 'Lichte Höhe unter der Laufschiene. Höhe ohne Dachreling — für dieses Fahrzeug ist kein Relingmaß belegt.'
          : 'Lichte Höhe unter der Laufschiene.',
      ...beleg(hoehe),
    },
    {
      achse: 'breite',
      bezeichnung: 'Breite',
      verfuegbar: breiteEinfahrt,
      benoetigt: breite?.wert,
      reserve: breite === undefined ? undefined : breiteEinfahrt - breite.wert,
      urteil: bewerte(breiteEinfahrt, breite?.wert),
      anmerkung:
        fahrzeug.breiteMitSpiegeln !== undefined
          ? 'Mit ausgeklappten Spiegeln. Schmalste Stelle wird von den Schwenkarmen bestimmt.'
          : breite !== undefined
            ? 'Breite mit Spiegeln nicht belegt — ohne Spiegel geprüft, also zu günstig.'
            : 'Keine Breitenangabe belegt.',
      ...beleg(breite),
    },
  ];

  const belegteReserven = achsen
    .map((a) => a.reserve)
    .filter((r): r is number => r !== undefined);

  return {
    fahrzeug,
    achsen,
    urteil: achsen.reduce<Urteil>(
      (schlechtestes, a) => (RANG[a.urteil] > RANG[schlechtestes] ? a.urteil : schlechtestes),
      'sicher',
    ),
    engsteReserve: belegteReserven.length ? Math.min(...belegteReserven) : undefined,
    heckklappeOeffenbar:
      fahrzeug.hoeheHeckOffen === undefined
        ? undefined
        : fahrzeug.hoeheHeckOffen.wert <= config.CLEAR_HEIGHT,
    heckklappeReserve:
      fahrzeug.hoeheHeckOffen === undefined
        ? undefined
        : config.CLEAR_HEIGHT - fahrzeug.hoeheHeckOffen.wert,
  };
}

export const URTEIL_LABEL: Record<Urteil, string> = {
  sicher: 'passt sicher',
  knapp: 'passt knapp',
  'passt-nicht': 'passt nicht',
  'nicht-pruefbar': 'nicht prüfbar',
};
