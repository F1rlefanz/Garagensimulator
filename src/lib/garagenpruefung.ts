import { Fahrzeug } from '../domain/fahrzeuge';
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

  const achsen: Achsenbefund[] = [
    {
      achse: 'laenge',
      bezeichnung: 'Länge',
      verfuegbar: nutzbareTiefe(config),
      benoetigt: fahrzeug.laenge,
      reserve: nutzbareTiefe(config) - fahrzeug.laenge,
      urteil: bewerte(nutzbareTiefe(config), fahrzeug.laenge),
      anmerkung: 'Rohbaulänge abzüglich Federzone und Dämmung. Ohne Anhängerkupplung.',
    },
    {
      achse: 'hoehe',
      bezeichnung: 'Höhe',
      verfuegbar: config.CLEAR_HEIGHT,
      benoetigt: fahrzeug.hoehe,
      reserve: config.CLEAR_HEIGHT - fahrzeug.hoehe,
      urteil: bewerte(config.CLEAR_HEIGHT, fahrzeug.hoehe),
      anmerkung: 'Lichte Höhe unter der Laufschiene. Dachreling erhöht um bis zu 66 mm.',
    },
    {
      achse: 'breite',
      bezeichnung: 'Breite',
      verfuegbar: breiteEinfahrt,
      benoetigt: breite,
      reserve: breite === undefined ? undefined : breiteEinfahrt - breite,
      urteil: bewerte(breiteEinfahrt, breite),
      anmerkung:
        fahrzeug.breiteMitSpiegeln !== undefined
          ? 'Mit ausgeklappten Spiegeln. Schmalste Stelle wird von den Schwenkarmen bestimmt.'
          : 'Breite mit Spiegeln nicht belegt — ohne Spiegel geprüft, also zu günstig.',
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
        : fahrzeug.hoeheHeckOffen <= config.CLEAR_HEIGHT,
  };
}

export const URTEIL_LABEL: Record<Urteil, string> = {
  sicher: 'passt sicher',
  knapp: 'passt knapp',
  'passt-nicht': 'passt nicht',
  'nicht-pruefbar': 'nicht prüfbar',
};
