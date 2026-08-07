import { Fahrzeug, istEditierbar, marktstatus } from '../domain/fahrzeuge';
import { GarageConfig } from './kinematics';
import { pruefeGarage } from './garagenpruefung';

/**
 * Filter für die Fahrzeugauswahl.
 *
 * Mit einem wachsenden Katalog ist die ungefilterte Liste nicht mehr benutzbar.
 * Die Logik liegt hier und nicht in der Komponente, damit sie prüfbar ist —
 * ein Filter, der versehentlich das falsche Fahrzeug ausblendet, fällt in der
 * Oberfläche niemandem auf.
 */

export interface Fahrzeugfilter {
  /** Einträge ausblenden, die nachweislich nicht hineinpassen. */
  readonly nurPassende: boolean;
  /** Nur Modelle, die 2026 als Neuwagen bestellbar sind. */
  readonly nurNeue: boolean;
}

export const KEIN_FILTER: Fahrzeugfilter = { nurPassende: false, nurNeue: false };

/**
 * Ob ein Eintrag sichtbar bleibt.
 *
 * Zwei Einträge bleiben immer sichtbar: die freie Eingabe und das gerade
 * gewählte Fahrzeug — sonst stünde die Auswahl leer da, sobald ein Filter das
 * ausgewählte Fahrzeug ausschließt.
 *
 * **`nicht-pruefbar` wird bewusst NICHT ausgeblendet.** Der Filter entfernt
 * nur, was nachweislich nicht passt. Ein Fahrzeug, über dessen Breite nichts
 * bekannt ist, verschwinden zu lassen, würde die Lücke unsichtbar machen —
 * dieselbe Richtung, in die dieses Projekt sonst nie geht.
 */
export function bleibtSichtbar(
  fahrzeug: Fahrzeug,
  filter: Fahrzeugfilter,
  gewaehlteId: string,
  config: GarageConfig,
  breiteEinfahrt: number,
): boolean {
  if (fahrzeug.id === gewaehlteId || istEditierbar(fahrzeug.id)) return true;
  if (filter.nurNeue && marktstatus(fahrzeug) !== 'neu') return false;
  if (filter.nurPassende) {
    return pruefeGarage(fahrzeug, config, breiteEinfahrt).urteil !== 'passt-nicht';
  }
  return true;
}

/** Die gefilterte Auswahlliste in unveränderter Reihenfolge. */
export function filtereAuswahl(
  auswahl: readonly Fahrzeug[],
  filter: Fahrzeugfilter,
  gewaehlteId: string,
  config: GarageConfig,
  breiteEinfahrt: number,
): readonly Fahrzeug[] {
  return auswahl.filter((f) => bleibtSichtbar(f, filter, gewaehlteId, config, breiteEinfahrt));
}
