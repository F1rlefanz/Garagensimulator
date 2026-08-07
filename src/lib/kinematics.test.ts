import { describe, expect, it } from 'vitest';

import { pruefhoehe, REFERENZ_FAHRZEUG } from '../domain/fahrzeuge';

import {
  calculateKinematics,
  DEFAULT_CONFIG,
  maximalerOeffnungswinkel,
  maximalerUeberstand,
  schwenkarmLaenge,
} from './kinematics';
import { TORBLATT_HOEHE_SUMME } from '../domain/garage';

const MAX_WINKEL = maximalerOeffnungswinkel(DEFAULT_CONFIG);

/** Öffnungswinkel in 1°-Schritten bis kurz unter den mechanischen Anschlag. */
const WINKEL = Array.from({ length: Math.floor(MAX_WINKEL) + 1 }, (_, i) => i);

describe('calculateKinematics', () => {
  it('liefert über den gesamten Öffnungsweg eine lösbare Kinematik', () => {
    for (const winkel of WINKEL) {
      expect(calculateKinematics(winkel, DEFAULT_CONFIG).isValid, `bei ${winkel}°`).toBe(true);
    }
  });

  it('hält die Schwenkarmlänge |AP| konstant', () => {
    const laengen = WINKEL.map((winkel) => {
      const k = calculateKinematics(winkel, DEFAULT_CONFIG);
      return Math.hypot(k.xP - k.xA, k.yP - k.yA);
    });

    for (const laenge of laengen) {
      expect(laenge).toBeCloseTo(schwenkarmLaenge(DEFAULT_CONFIG), 9);
    }
  });

  it('hält das Torblatt starr — |O..B| bleibt die Gesamthöhe des Torblatts', () => {
    for (const winkel of WINKEL) {
      const k = calculateKinematics(winkel, DEFAULT_CONFIG);
      expect(Math.hypot(k.xTop - k.xB, k.yTop - k.yB), `bei ${winkel}°`).toBeCloseTo(
        TORBLATT_HOEHE_SUMME,
        9,
      );
    }
  });

  it('führt die Laufrolle T auf konstanter Achshöhe', () => {
    for (const winkel of WINKEL) {
      expect(calculateKinematics(winkel, DEFAULT_CONFIG).yT).toBeCloseTo(DEFAULT_CONFIG.Y_RAIL, 9);
    }
  });

  it('setzt das geschlossene Tor in die Torebene x = 0, Unterkante auf dem Boden', () => {
    const k = calculateKinematics(0, DEFAULT_CONFIG);

    expect(k.xP).toBeCloseTo(0, 9);
    expect(k.xB).toBeCloseTo(0, 9);
    expect(k.xTop).toBeCloseTo(0, 9);
    // Die Rollenachse ist genau so abgeleitet, dass B bei geschlossenem Tor
    // den Boden berührt — der Grund, warum das Modell nicht mit der lichten
    // Höhe von 2,17 m rechnet (siehe OFFEN-02).
    expect(k.yB).toBeCloseTo(0, 9);
  });

  it('fährt die Laufrolle T beim Öffnen stetig in die Garage hinein', () => {
    let vorherigesXT = calculateKinematics(0, DEFAULT_CONFIG).xT;

    for (const winkel of WINKEL.slice(1)) {
      const k = calculateKinematics(winkel, DEFAULT_CONFIG);
      expect(k.xT, `bei ${winkel}°`).toBeGreaterThan(vorherigesXT);
      vorherigesXT = k.xT;
    }

    expect(calculateKinematics(MAX_WINKEL, DEFAULT_CONFIG).xT).toBeGreaterThan(0);
  });

  it('bleibt mit der Laufrolle innerhalb der Laufschiene', () => {
    // Unabhängige Gegenprobe: Der Weg der Rolle muss in die gemessene
    // Schienenlänge passen, sonst stimmt eines der beiden Maße nicht.
    const maxXT = calculateKinematics(MAX_WINKEL, DEFAULT_CONFIG).xT;

    expect(maxXT).toBeLessThanOrEqual(DEFAULT_CONFIG.RAIL_LENGTH);
  });

  it('schwenkt die Torunterkante auf den Vorplatz und wieder zurück', () => {
    // Kennzeichen des vorstehenden Schwingtors: B verlässt die Garage (x < 0),
    // erreicht bei mittlerer Öffnung den größten Überstand und wandert danach
    // wieder zurück, während sich das Torblatt in die Waagerechte legt.
    const xB = WINKEL.map((winkel) => calculateKinematics(winkel, DEFAULT_CONFIG).xB);
    const scheitel = xB.indexOf(Math.min(...xB));

    expect(scheitel).toBeGreaterThan(0);
    expect(scheitel).toBeLessThan(WINKEL.length - 1);

    // Genau ein Scheitelpunkt: davor streng fallend, danach streng steigend.
    for (let i = 1; i <= scheitel; i++) {
      expect(xB[i], `vor dem Scheitel, bei ${i}°`).toBeLessThan(xB[i - 1]);
    }
    for (let i = scheitel + 1; i < xB.length; i++) {
      expect(xB[i], `nach dem Scheitel, bei ${i}°`).toBeGreaterThan(xB[i - 1]);
    }

    expect(xB[xB.length - 1]).toBeLessThan(0);
  });

  it('bestimmt den maximalen Überstand des Tors auf den Vorplatz', () => {
    // Maßgeblich für den benötigten Freiraum vor der Garage.
    const { winkelGrad, ueberstand, hoehe } = maximalerUeberstand(DEFAULT_CONFIG);

    expect(winkelGrad).toBeCloseTo(59.4, 1);
    expect(ueberstand).toBeCloseTo(1.148, 3);
    expect(hoehe).toBeCloseTo(1.141, 3);
  });

  it('hebt die Torunterkante über den gesamten Öffnungsweg an', () => {
    let vorherigesYB = calculateKinematics(0, DEFAULT_CONFIG).yB;

    for (const winkel of WINKEL.slice(1)) {
      const k = calculateKinematics(winkel, DEFAULT_CONFIG);
      expect(k.yB, `bei ${winkel}°`).toBeGreaterThan(vorherigesYB);
      vorherigesYB = k.yB;
    }
  });

  it('meldet eine unmögliche Kinematik, statt still weiterzurechnen', () => {
    expect(calculateKinematics(MAX_WINKEL + 1, DEFAULT_CONFIG).isValid).toBe(false);
  });
});

describe('maximalerOeffnungswinkel', () => {
  it('begrenzt den Öffnungsweg dort, wo der Schwenkarm senkrecht über A steht', () => {
    expect(MAX_WINKEL).toBeCloseTo(87.7, 1);

    const k = calculateKinematics(MAX_WINKEL, DEFAULT_CONFIG);
    expect(k.xP).toBeCloseTo(DEFAULT_CONFIG.X_A, 6);
    expect(k.yP - k.yA).toBeCloseTo(schwenkarmLaenge(DEFAULT_CONFIG), 6);
  });

  it('deckelt bei 90°, wenn der Arm den ganzen Viertelkreis zulässt', () => {
    // Rein rechnerische Geometrie: Festlager oberhalb der Rollenachse. Prüft,
    // dass die Funktion sauber deckelt, statt acos außerhalb von [-1,1]
    // aufzurufen und NaN zurückzugeben.
    const langerArm = { ...DEFAULT_CONFIG, Y_A: 2.4 };

    expect(maximalerOeffnungswinkel(langerArm)).toBe(90);
  });

  it('gibt 0° zurück, wenn der Arm die geschlossene Stellung nicht verlassen kann', () => {
    const blockiert = { ...DEFAULT_CONFIG, Y_A: 0.0 };

    expect(maximalerOeffnungswinkel(blockiert)).toBe(0);
  });
});

describe('Fahrzeugmaße in DEFAULT_CONFIG', () => {
  it('nimmt die Höhe MIT Dachreling, nicht die relingfreie', () => {
    // Ohne diese Zusicherung bleibt eine Änderung von pruefhoehe(f).wert auf
    // f.hoehe.wert unbemerkt: Alle Tests, die CAR_HEIGHT anfassen, messen die
    // Kontur gegen CAR_HEIGHT selbst und sind damit tautologisch. Die Folge
    // wäre ein 2,9 cm zu niedriges Fahrzeug in Zeichnung und Kollisionsprüfung.
    expect(DEFAULT_CONFIG.CAR_HEIGHT).toBeCloseTo(pruefhoehe(REFERENZ_FAHRZEUG).wert, 9);
    expect(REFERENZ_FAHRZEUG.hoeheMitDachreling).toBeDefined();
    expect(DEFAULT_CONFIG.CAR_HEIGHT).toBeGreaterThan(REFERENZ_FAHRZEUG.hoehe.wert);
  });

  it('nimmt die Länge des Referenzfahrzeugs', () => {
    expect(DEFAULT_CONFIG.CAR_LENGTH).toBeCloseTo(REFERENZ_FAHRZEUG.laenge.wert, 9);
  });
});
