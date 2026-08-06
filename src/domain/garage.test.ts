import { describe, expect, it } from 'vitest';

import {
  BODENVERSATZ,
  BODENVERSATZ_MAX,
  BODENVERSATZ_MIN,
  DECKE_UEBER_TOREBENE,
  GARAGENHOEHE_AUS_SCHICHTEN,
  LAUFSCHIENE_OBERKANTE,
  LUFT_TOR_ZU_DECKE,
  m,
  NUTZBARE_TIEFE,
  pruefeGeometrie,
  ROLLENACHSE_HOEHE,
  ROLLENACHSE_HOEHE_UEBER_ARM,
  SCHWENKARM_LAENGE_ABGELEITET,
  TORBLATT_HOEHE_SUMME,
} from './garage';

describe('abgeleitete Größen', () => {
  it('summiert die Teilstrecken des Torblatts', () => {
    expect(TORBLATT_HOEHE_SUMME).toBeCloseTo(2.358, 6);
  });

  it('leitet die Rollenachse aus dem Torblatt ab — Unterkante auf der Schließebene', () => {
    expect(ROLLENACHSE_HOEHE).toBeCloseTo(2.325, 6);
  });

  it('bestätigt dieselbe Rollenachse unabhängig über den Schwenkarm', () => {
    // Zwei getrennte Messketten, 2,5 cm auseinander — innerhalb der benannten
    // Messunsicherheit. Genau diese Übereinstimmung trägt den Bodenversatz.
    expect(ROLLENACHSE_HOEHE_UEBER_ARM).toBeCloseTo(2.3, 6);
    expect(Math.abs(ROLLENACHSE_HOEHE - ROLLENACHSE_HOEHE_UEBER_ARM)).toBeLessThan(0.03);
  });

  it('leitet die Schwenkarmlänge aus der geschlossenen Torstellung ab', () => {
    expect(SCHWENKARM_LAENGE_ABGELEITET).toBeCloseTo(1.075, 6);
  });

  it('summiert die Garagenhöhe aus lichter Höhe, Schienenprofil und Deckenabstand', () => {
    expect(LAUFSCHIENE_OBERKANTE).toBeCloseTo(2.232, 6);
    expect(GARAGENHOEHE_AUS_SCHICHTEN).toBeCloseTo(2.397, 6);
  });

  it('zieht Federzone und Dämmung von der Rohbaulänge ab', () => {
    expect(NUTZBARE_TIEFE).toBeCloseTo(5.22, 6);
  });
});

describe('Bodenversatz', () => {
  /**
   * Der Kern des Modells: Torblatt und Mechanik wurden ab Straßenniveau
   * gemessen, die Raummaße ab Garagenboden. Dazwischen liegen Eisenschwelle
   * und Rampe.
   */
  it('legt die Laufrolle mittig in ihr Schienenprofil', () => {
    expect(BODENVERSATZ).toBeCloseTo(0.124, 3);
  });

  it('grenzt den zulässigen Bereich über die Profilkanten ein', () => {
    expect(BODENVERSATZ_MIN).toBeCloseTo(0.093, 3);
    expect(BODENVERSATZ_MAX).toBeCloseTo(0.155, 3);
    expect(BODENVERSATZ).toBeGreaterThan(BODENVERSATZ_MIN);
    expect(BODENVERSATZ).toBeLessThan(BODENVERSATZ_MAX);
  });

  it('hält die Laufrollenachse innerhalb des Schienenprofils', () => {
    const profilUnterkante = BODENVERSATZ + m('lichteHoehe');
    const profilOberkante = BODENVERSATZ + LAUFSCHIENE_OBERKANTE;

    expect(ROLLENACHSE_HOEHE).toBeGreaterThanOrEqual(profilUnterkante);
    expect(ROLLENACHSE_HOEHE).toBeLessThanOrEqual(profilOberkante);
  });

  it('löst den Gleichstand von Torhöhe und Garagenhöhe auf', () => {
    // Beide Male wurden 2,37 m gemessen — aber ab verschiedenen Nullpunkten.
    // Über der Schließebene gerechnet liegt die Decke deutlich höher als das Tor.
    expect(m('torblattHoehe')).toBeCloseTo(m('garagenhoehe'), 6);
    expect(DECKE_UEBER_TOREBENE).toBeCloseTo(2.521, 3);
    expect(LUFT_TOR_ZU_DECKE).toBeCloseTo(0.151, 3);
    expect(LUFT_TOR_ZU_DECKE).toBeGreaterThan(0);
  });
});

describe('pruefeGeometrie', () => {
  /**
   * Register der bekannten Messwert-Abweichungen aus docs/03-offene-fragen.md.
   * Wird nachgemessen und eine aufgelöst, schlägt der Test fehl — dann sind
   * Messwerte, Dokumentation und dieser Test gemeinsam nachzuziehen.
   */
  it('meldet genau die derzeit offenen Punkte', () => {
    const ids = pruefeGeometrie()
      .map((b) => b.id)
      .sort();

    expect(ids).toEqual(['OFFEN-01', 'OFFEN-02', 'OFFEN-05', 'OFFEN-07']);
  });

  it('meldet keinen harten Widerspruch mehr', () => {
    expect(pruefeGeometrie().filter((b) => b.schwere === 'fehler')).toEqual([]);
  });
});
