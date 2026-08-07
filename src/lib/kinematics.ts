import { BODENVERSATZ, DECKE_UEBER_TOREBENE, m, NUTZBARE_TIEFE, ROLLENACHSE_HOEHE } from '../domain/garage';
import { pruefhoehe, REFERENZ_FAHRZEUG } from '../domain/fahrzeuge';

export interface GarageConfig {
  X_A: number;
  Y_A: number;
  /**
   * Höhe der Laufrollenachse über dem Boden — die Bahn, auf der T fährt.
   * NICHT die lichte Durchfahrtshöhe; dafür gibt es `CLEAR_HEIGHT`.
   */
  Y_RAIL: number;
  /**
   * Lichte Durchfahrtshöhe unter der Laufschiene, gemessen ab Garagenboden.
   * Begrenzt die Fahrzeughöhe.
   */
  CLEAR_HEIGHT: number;
  /**
   * Höhe des Garagenbodens über der Torschließebene — Eisenschwelle plus Rampe.
   * Das Fahrzeug steht darauf, das Tor schließt darunter auf y = 0.
   */
  FLOOR_OFFSET: number;
  /** Nutzbare Länge der Laufschiene. Begrenzt den Weg der Laufrolle nach innen. */
  RAIL_LENGTH: number;
  /** Bauhöhe des Schienenprofils. Nur für die Darstellung. */
  RAIL_PROFILE: number;
  /** Abstand Lagerbolzen A bis Federpunkt F, auf der Armachse hinter A. */
  D_AF: number;
  /**
   * Tiefe der Federzone unmittelbar hinter der Torebene. Kein Stellplatz —
   * die Fahrzeugfront darf nicht davor geraten.
   */
  SPRING_DEPTH: number;
  D_TP: number;
  D_PB: number;
  D_TTOP: number;
  DEPTH_G: number;
  GARAGE_HEIGHT: number;
  CAR_LENGTH: number;
  CAR_HEIGHT: number;
  STYROFOAM_THICKNESS: number;
}

/**
 * Ausgangskonfiguration. Sämtliche Zahlen stammen aus `src/domain/garage.ts`
 * bzw. `src/domain/fahrzeuge.ts` — hier stehen bewusst keine Literale, damit es
 * nur eine Stelle gibt, an der nachgemessene Werte gepflegt werden.
 */
export const DEFAULT_CONFIG: GarageConfig = {
  X_A: m('lagerbolzenTiefe'),
  Y_A: m('lagerbolzenHoehe'),
  Y_RAIL: ROLLENACHSE_HOEHE,
  CLEAR_HEIGHT: m('lichteHoehe'),
  FLOOR_OFFSET: BODENVERSATZ,
  RAIL_LENGTH: m('laufschienenLaenge'),
  RAIL_PROFILE: m('laufschieneProfilhoehe'),
  D_AF: m('lagerbolzenZuFederpunkt'),
  SPRING_DEPTH: m('federwegTiefe'),
  D_TP: m('rolleZuAnlenkpunkt'),
  D_PB: m('anlenkpunktZuUnterkante'),
  D_TTOP: m('rolleZuOberkante'),
  // Lage der Rückwand (Rohbau), gemessen ab der Torebene. Die nutzbare Tiefe
  // ergibt sich daraus abzüglich Federzone und Dämmung — nicht umgekehrt.
  DEPTH_G: m('gesamtlaengeGarage'),
  // Decke über der Torschließebene, nicht über dem Garagenboden.
  GARAGE_HEIGHT: DECKE_UEBER_TOREBENE,
  CAR_LENGTH: REFERENZ_FAHRZEUG.laenge.wert,
  // Mit Dachreling, wo belegt: Das Torblatt fegt ueber das reale Dach.
  CAR_HEIGHT: pruefhoehe(REFERENZ_FAHRZEUG).wert,
  STYROFOAM_THICKNESS: m('styroporDicke'),
};

/** Zum Parken tatsächlich verfügbare Tiefe: Rohbaulänge minus Federzone minus Dämmung. */
export function nutzbareTiefe(config: GarageConfig): number {
  return config.DEPTH_G - config.SPRING_DEPTH - config.STYROFOAM_THICKNESS;
}

/** Höhenreserve des Fahrzeugs unter der Laufschiene. Negativ heißt: passt nicht. */
export function hoehenreserve(config: GarageConfig): number {
  return config.CLEAR_HEIGHT - config.CAR_HEIGHT;
}

export { NUTZBARE_TIEFE };

export interface KinematicState {
  xT: number; yT: number;
  xP: number; yP: number;
  xB: number; yB: number;
  xTop: number; yTop: number;
  xA: number; yA: number;
  rArm: number;
  isValid: boolean;
}

export interface UeberstandErgebnis {
  /** Toröffnungswinkel, bei dem die Unterkante am weitesten vorsteht. */
  winkelGrad: number;
  /** Größter Überstand der Torunterkante vor die Torebene, in Metern. */
  ueberstand: number;
  /** Höhe der Torunterkante in diesem Moment. */
  hoehe: number;
}

/**
 * Wirksame Schwenkarmlänge: der Abstand |AP| in der geschlossenen Stellung.
 *
 * Bewusst abgeleitet statt gemessen übernommen — nur mit dieser Länge steht das
 * geschlossene Torblatt bündig in der Torebene. Die Abweichung zum gemessenen R
 * meldet `pruefeGeometrie()` in `src/domain/garage.ts`.
 */
export function schwenkarmLaenge(config: GarageConfig): number {
  return Math.hypot(config.X_A, config.Y_RAIL - config.D_TP - config.Y_A);
}

/**
 * Größter mechanisch erreichbarer Öffnungswinkel.
 *
 * Der Schwenkarm begrenzt die Bewegung: Sobald der Anlenkpunkt P senkrecht über
 * dem Festlager A steht, ist der Kreis um A ausgereizt und das Tor am Anschlag.
 * Darüber hinaus liefert die Zwangsbedingung keine Lösung mehr.
 */
export function maximalerOeffnungswinkel(config: GarageConfig): number {
  const cosGrenze = (config.Y_RAIL - config.Y_A - schwenkarmLaenge(config)) / config.D_TP;

  // Grenze liegt außerhalb des Viertelkreises: das Tor öffnet bis zur Waagerechten.
  if (cosGrenze <= -1) return 90;
  if (cosGrenze >= 1) return 0;

  return Math.min(90, (Math.acos(cosGrenze) * 180) / Math.PI);
}

/**
 * Sucht den Öffnungswinkel mit dem größten Überstand der Torunterkante auf den
 * Vorplatz. Beim vorstehenden Schwingtor schwenkt die Unterkante zunächst nach
 * außen, erreicht bei mittlerer Öffnung einen Scheitelpunkt und wandert danach
 * wieder zurück — dieser Scheitelpunkt bestimmt den nötigen Freiraum vor der
 * Garage.
 *
 * Abgetastet statt analytisch gelöst: Die Zwangsbedingung ist über die Wurzel
 * nicht geschlossen nach dem Extremum auflösbar, und 0,1° Auflösung liegt weit
 * unter der Messgenauigkeit der zugrunde liegenden Maße.
 */
export function maximalerUeberstand(
  config: GarageConfig,
  maxWinkelGrad = 90,
  schrittGrad = 0.1,
): UeberstandErgebnis {
  let beste: UeberstandErgebnis = { winkelGrad: 0, ueberstand: 0, hoehe: 0 };

  for (let winkel = 0; winkel <= maxWinkelGrad; winkel += schrittGrad) {
    const k = calculateKinematics(winkel, config);
    if (!k.isValid) continue;

    const ueberstand = -k.xB;
    if (ueberstand > beste.ueberstand) {
      beste = { winkelGrad: winkel, ueberstand, hoehe: k.yB };
    }
  }

  return beste;
}

export function calculateKinematics(angleDeg: number, config: GarageConfig): KinematicState {
  const rad = (angleDeg * Math.PI) / 180;
  const { X_A, Y_A, Y_RAIL, D_TP, D_PB, D_TTOP } = config;

  // Wirksame Armlänge aus der geschlossenen Stellung: P liegt dann senkrecht
  // unter T in der Torebene.
  const rArm = schwenkarmLaenge(config);

  // Current yP based on angle
  const yP = Y_RAIL - D_TP * Math.cos(rad);

  // Pythagoras to find xP on the circle around A
  const arg = Math.pow(rArm, 2) - Math.pow(yP - Y_A, 2);
  let isValid = true;
  let sqrtArg = 0;
  
  if (arg >= 0) {
    sqrtArg = Math.sqrt(arg);
  } else {
    isValid = false;
  }
  
  // P is generally outwards from A
  const xP = X_A - sqrtArg;
  
  // Calculate T (Laufrolle)
  const xT = xP + D_TP * Math.sin(rad);
  const yT = Y_RAIL;
  
  // Unterkante Tor B (bottom edge)
  const xB = xP - D_PB * Math.sin(rad);
  const yB = yP - D_PB * Math.cos(rad);

  // Oberkante Tor Top
  const xTop = xT + D_TTOP * Math.sin(rad);
  const yTop = yT + D_TTOP * Math.cos(rad);

  return {
    xT, yT: Y_RAIL,
    xP, yP,
    xB, yB,
    xTop, yTop,
    xA: X_A, yA: Y_A,
    rArm,
    isValid
  };
}
