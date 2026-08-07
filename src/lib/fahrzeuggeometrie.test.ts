import { describe, expect, it } from 'vitest';

import {
  fahrzeugFront,
  fahrzeugKontur,
  liegtInnerhalb,
  maximalerParkabstand,
  Parkstellung,
  rueckwandAnschlag,
} from './fahrzeuggeometrie';
import { calculateKinematics, DEFAULT_CONFIG, maximalerOeffnungswinkel } from './kinematics';
import { INDIVIDUELL, REFERENZ_FAHRZEUG } from '../domain/fahrzeuge';

/** Ohne belegtes Seitenprofil — der Regelfall im Katalog. */
const QUADER: Parkstellung = {
  rueckwaerts: true,
  abstandRueckwand: 0,
};

/**
 * Mit Seitenprofil. Nur der Eintrag `Individuell` führt eines, deshalb steht es
 * hier stellvertretend für alle Fahrzeuge, an denen einmal nachgemessen wird.
 */
const PROFIL = INDIVIDUELL.seitenprofil!;
const MIT_PROFIL: Parkstellung = { ...QUADER, seitenprofil: PROFIL };

describe('Parkgeometrie', () => {
  it('nimmt die Dämmungsoberfläche als Anschlag, nicht die Rohbauwand', () => {
    expect(rueckwandAnschlag(DEFAULT_CONFIG)).toBeCloseTo(5.34, 6);
  });

  it('lässt die Fahrzeugfront nicht in die Federzone geraten', () => {
    const front = fahrzeugFront(DEFAULT_CONFIG, maximalerParkabstand(DEFAULT_CONFIG));

    expect(front).toBeGreaterThanOrEqual(DEFAULT_CONFIG.SPRING_DEPTH - 1e-9);
  });

  it('stellt das Fahrzeug angelehnt an die Dämmung ganz nach hinten', () => {
    const front = fahrzeugFront(DEFAULT_CONFIG, 0);

    expect(front + DEFAULT_CONFIG.CAR_LENGTH).toBeCloseTo(rueckwandAnschlag(DEFAULT_CONFIG), 6);
    expect(front).toBeCloseTo(rueckwandAnschlag(DEFAULT_CONFIG) - REFERENZ_FAHRZEUG.laenge.wert, 9);
  });
});

describe('fahrzeugKontur', () => {
  it('stellt das Fahrzeug auf den Garagenboden, nicht auf die Torschließebene', () => {
    for (const stellung of [QUADER, MIT_PROFIL]) {
      const kontur = fahrzeugKontur(DEFAULT_CONFIG, stellung);
      const tiefsterPunkt = Math.min(...kontur.map(([, y]) => y));

      expect(tiefsterPunkt).toBeCloseTo(DEFAULT_CONFIG.FLOOR_OFFSET, 9);
    }
  });

  it('erreicht die Fahrzeughöhe über dem Garagenboden', () => {
    for (const stellung of [QUADER, MIT_PROFIL]) {
      const kontur = fahrzeugKontur(DEFAULT_CONFIG, stellung);
      const hoechsterPunkt = Math.max(...kontur.map(([, y]) => y));

      expect(hoechsterPunkt - DEFAULT_CONFIG.FLOOR_OFFSET).toBeCloseTo(
        DEFAULT_CONFIG.CAR_HEIGHT,
        9,
      );
    }
  });

  it('rechnet ohne Seitenprofil mit einem Quader über die volle Höhe', () => {
    // Konservativ: Ein geschätztes Profil würde das Tor freier aussehen lassen.
    const kontur = fahrzeugKontur(DEFAULT_CONFIG, QUADER);
    const x = fahrzeugFront(DEFAULT_CONFIG, 0);
    const b = DEFAULT_CONFIG.FLOOR_OFFSET;
    const { CAR_LENGTH: L, CAR_HEIGHT: H } = DEFAULT_CONFIG;

    expect(kontur).toEqual([
      [x, b],
      [x, b + H],
      [x + L, b + H],
      [x + L, b],
    ]);

    // Die Parkrichtung ändert an einem Quader nichts.
    expect(fahrzeugKontur(DEFAULT_CONFIG, { ...QUADER, rueckwaerts: false })).toEqual(kontur);
  });

  it('dreht die flache Front je nach Parkrichtung zum Tor', () => {
    const rueckwaerts = fahrzeugKontur(DEFAULT_CONFIG, MIT_PROFIL);
    const vorwaerts = fahrzeugKontur(DEFAULT_CONFIG, { ...MIT_PROFIL, rueckwaerts: false });
    const b = DEFAULT_CONFIG.FLOOR_OFFSET;

    // Zweiter Stützpunkt ist jeweils die zum Tor zeigende Kante.
    expect(rueckwaerts[1][1] - b).toBeCloseTo(PROFIL.haubenHoehe - 0.2, 9);
    expect(vorwaerts[1][1] - b).toBeCloseTo(DEFAULT_CONFIG.CAR_HEIGHT - 0.2, 9);
  });
});

describe('Kollisionsprüfung', () => {
  const kontur = fahrzeugKontur(DEFAULT_CONFIG, QUADER);

  it('erkennt Punkte innerhalb und außerhalb der Kontur', () => {
    const mitte = fahrzeugFront(DEFAULT_CONFIG, 0) + DEFAULT_CONFIG.CAR_LENGTH / 2;

    expect(liegtInnerhalb(mitte, DEFAULT_CONFIG.FLOOR_OFFSET + 1, kontur)).toBe(true);
    expect(liegtInnerhalb(-1, 1, kontur)).toBe(false);
    expect(liegtInnerhalb(mitte, DEFAULT_CONFIG.FLOOR_OFFSET - 0.05, kontur)).toBe(false);
  });

  it('lässt das Tor über den gesamten Öffnungsweg frei', () => {
    // Rückwärts eingeparkt und ganz hinten an der Dämmung: Die Torunterkante
    // darf das Fahrzeug an keiner Stelle berühren. Geprüft am Quader, also am
    // ungünstigsten Fall.
    const maxWinkel = maximalerOeffnungswinkel(DEFAULT_CONFIG);

    for (let a = 0; a <= maxWinkel; a += 0.5) {
      const k = calculateKinematics(a, DEFAULT_CONFIG);
      expect(liegtInnerhalb(k.xB, k.yB, kontur), `Kollision bei ${a.toFixed(1)}°`).toBe(false);
    }
  });
});
