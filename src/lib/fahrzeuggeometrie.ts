import { GarageConfig } from './kinematics';

/**
 * Seitenkontur des geparkten Fahrzeugs und die Kollisionsprüfung dagegen.
 *
 * Bewusst hier und nicht in der Ansicht: Zeichnung und Prüfung müssen dieselbe
 * Kontur verwenden, sonst zeigt die Ansicht etwas anderes an, als gerechnet
 * wird. Wie die übrige `lib/` frei von React und SVG.
 */

export type Punkt = readonly [number, number];

export interface Parkstellung {
  /** Rückwärts eingeparkt: die flach abfallende Front zeigt zum Tor. */
  readonly rueckwaerts: boolean;
  /** Abstand des zum Anschlag zeigenden Endes zur Styropor-Oberfläche. */
  readonly abstandRueckwand: number;
  /** Waagerechte Erstreckung der Windschutzscheibe. */
  readonly scheibenLaenge: number;
}

/** Anschlagfläche hinten: Oberfläche der Dämmung, nicht die Rohbauwand. */
export function rueckwandAnschlag(config: GarageConfig): number {
  return config.DEPTH_G - config.STYROFOAM_THICKNESS;
}

/** Größter Abstand zur Rückwand, bei dem die Front noch hinter der Federzone bleibt. */
export function maximalerParkabstand(config: GarageConfig): number {
  return Math.max(0, rueckwandAnschlag(config) - config.CAR_LENGTH - config.SPRING_DEPTH);
}

/** x-Koordinate der Fahrzeugfront. */
export function fahrzeugFront(config: GarageConfig, abstandRueckwand: number): number {
  return rueckwandAnschlag(config) - config.CAR_LENGTH - abstandRueckwand;
}

/**
 * Seitenkontur in Weltkoordinaten. Das Fahrzeug steht auf dem Garagenboden,
 * also `FLOOR_OFFSET` über der Ebene, in der das Tor schließt.
 */
export function fahrzeugKontur(config: GarageConfig, stellung: Parkstellung): Punkt[] {
  const x = fahrzeugFront(config, stellung.abstandRueckwand);
  const b = config.FLOOR_OFFSET;
  const { CAR_LENGTH: L, CAR_HEIGHT: H, CAR_HOOD_LENGTH: hl, CAR_HOOD_HEIGHT: hh, CAR_ROOF_LENGTH: rl } = config;
  const ws = stellung.scheibenLaenge;

  if (stellung.rueckwaerts) {
    return [
      [x, b],
      [x, b + hh - 0.2],
      [x + 0.1, b + hh],
      [x + hl, b + hh + 0.1],
      [x + hl + ws, b + H],
      [x + hl + ws + rl, b + H],
      [x + L, b + H - 0.2],
      [x + L, b],
    ];
  }

  // Vorwärts eingeparkt: das hohe, senkrechte Heck zeigt zum Tor.
  return [
    [x, b],
    [x, b + H - 0.2],
    [x + L - (hl + ws + rl), b + H],
    [x + L - (hl + ws), b + H],
    [x + L - hl, b + hh + 0.1],
    [x + L - 0.1, b + hh],
    [x + L, b + hh - 0.2],
    [x + L, b],
  ];
}

/** Strahlenwurf nach rechts — zählt die Schnitte mit der Kontur. */
export function liegtInnerhalb(px: number, py: number, polygon: readonly Punkt[]): boolean {
  let innen = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      innen = !innen;
    }
  }
  return innen;
}
