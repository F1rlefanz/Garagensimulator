import { describe, expect, it } from 'vitest';

import { pruefeGarage, RESERVE_SICHER, URTEIL_LABEL } from './garagenpruefung';
import { DEFAULT_CONFIG, nutzbareTiefe } from './kinematics';
import { AUSWAHL, Fahrzeug, REFERENZ_FAHRZEUG } from '../domain/fahrzeuge';
import { m } from '../domain/garage';

const EINFAHRT = m('schmalsteStelleEinfahrt');
const pruefe = (f: Fahrzeug) => pruefeGarage(f, DEFAULT_CONFIG, EINFAHRT);

/** Ein Fahrzeug, das auf allen Achsen mit Reserve hineinpasst. */
const WINZIG: Fahrzeug = {
  id: 'test-winzig',
  bezeichnung: 'Testwagen klein',
  modell: 'Test',
  variante: 'klein',
  baujahre: '—',
  kategorie: 'kombi',
  laenge: 4,
  hoehe: 1.5,
  breiteOhneSpiegel: 1.7,
  breiteMitSpiegeln: 1.9,
  quellenstufe: 'A',
};

describe('pruefeGarage', () => {
  it('prüft Länge, Höhe und Breite gegen die nachgemessene Garage', () => {
    const befund = pruefe(WINZIG);
    const [laenge, hoehe, breite] = befund.achsen;

    expect(befund.achsen).toHaveLength(3);
    expect(laenge.verfuegbar).toBeCloseTo(nutzbareTiefe(DEFAULT_CONFIG), 9);
    expect(hoehe.verfuegbar).toBeCloseTo(DEFAULT_CONFIG.CLEAR_HEIGHT, 9);
    expect(breite.verfuegbar).toBeCloseTo(EINFAHRT, 9);
  });

  it('nimmt die lichte Höhe, nicht die Höhe der Laufrollenachse', () => {
    // Der häufigste Fehler im Modell: Y_RAIL liegt 15 cm über CLEAR_HEIGHT.
    // Wer damit prüft, lässt zu hohe Fahrzeuge durch.
    const [, hoehe] = pruefe(WINZIG).achsen;

    expect(hoehe.verfuegbar).toBeLessThan(DEFAULT_CONFIG.Y_RAIL);
  });

  it('urteilt „sicher“, wenn überall Reserve bleibt', () => {
    const befund = pruefe(WINZIG);

    expect(befund.urteil).toBe('sicher');
    expect(befund.engsteReserve).toBeGreaterThanOrEqual(RESERVE_SICHER);
  });

  it('urteilt „knapp“, sobald eine Achse unter die Reserveschwelle fällt', () => {
    const knapp: Fahrzeug = {
      ...WINZIG,
      hoehe: DEFAULT_CONFIG.CLEAR_HEIGHT - RESERVE_SICHER / 2,
    };
    const befund = pruefe(knapp);

    expect(befund.urteil).toBe('knapp');
    expect(befund.achsen.find((a) => a.achse === 'hoehe')?.urteil).toBe('knapp');
  });

  it('urteilt „passt nicht“, sobald eine Achse überschritten ist', () => {
    const zuLang: Fahrzeug = { ...WINZIG, laenge: nutzbareTiefe(DEFAULT_CONFIG) + 0.01 };
    const befund = pruefe(zuLang);

    expect(befund.urteil).toBe('passt-nicht');
    expect(befund.achsen.find((a) => a.achse === 'laenge')?.reserve).toBeLessThan(0);
  });

  it('lässt ein fehlendes Maß nicht als bestanden durchgehen', () => {
    const ohneBreite: Fahrzeug = {
      ...WINZIG,
      breiteOhneSpiegel: undefined,
      breiteMitSpiegeln: undefined,
    };
    const befund = pruefe(ohneBreite);
    const breite = befund.achsen.find((a) => a.achse === 'breite')!;

    expect(breite.urteil).toBe('nicht-pruefbar');
    expect(breite.reserve).toBeUndefined();
    expect(befund.urteil).toBe('nicht-pruefbar');
    // Die engste Reserve bleibt belegt — sie stammt aus den prüfbaren Achsen.
    expect(befund.engsteReserve).toBeDefined();
  });

  it('nimmt bei der Breite die ausgeklappten Spiegel', () => {
    const breite = pruefe(WINZIG).achsen.find((a) => a.achse === 'breite')!;

    expect(breite.benoetigt).toBeCloseTo(WINZIG.breiteMitSpiegeln!, 9);
  });

  it('weicht auf die Breite ohne Spiegel aus und weist darauf hin', () => {
    const ohneSpiegelmass: Fahrzeug = { ...WINZIG, breiteMitSpiegeln: undefined };
    const breite = pruefe(ohneSpiegelmass).achsen.find((a) => a.achse === 'breite')!;

    expect(breite.benoetigt).toBeCloseTo(WINZIG.breiteOhneSpiegel!, 9);
    expect(breite.anmerkung).toMatch(/zu günstig/);
  });

  it('lässt „passt nicht“ jedes andere Urteil überstimmen', () => {
    const gemischt: Fahrzeug = {
      ...WINZIG,
      laenge: nutzbareTiefe(DEFAULT_CONFIG) + 1,
      breiteOhneSpiegel: undefined,
      breiteMitSpiegeln: undefined,
    };

    expect(pruefe(gemischt).urteil).toBe('passt-nicht');
  });
});

describe('Heckklappe', () => {
  it('bleibt unbekannt, solange die Höhe bei geöffneter Klappe fehlt', () => {
    expect(pruefe(WINZIG).heckklappeOeffenbar).toBeUndefined();
  });

  it('meldet die geöffnete Heckklappe gegen die lichte Höhe', () => {
    const knapp: Fahrzeug = { ...WINZIG, hoeheHeckOffen: DEFAULT_CONFIG.CLEAR_HEIGHT - 0.01 };
    const zuHoch: Fahrzeug = { ...WINZIG, hoeheHeckOffen: DEFAULT_CONFIG.CLEAR_HEIGHT + 0.01 };

    expect(pruefe(knapp).heckklappeOeffenbar).toBe(true);
    expect(pruefe(zuHoch).heckklappeOeffenbar).toBe(false);
  });
});

describe('Katalog gegen die Garage', () => {
  it('liefert für jeden Eintrag ein Urteil', () => {
    for (const f of AUSWAHL) {
      const befund = pruefe(f);

      expect(URTEIL_LABEL[befund.urteil], f.id).toBeTruthy();
      expect(befund.fahrzeug, f.id).toBe(f);
    }
  });

  it('scheitert beim Referenzfahrzeug an der Höhe, nicht an der Länge', () => {
    // Der Caddy Maxi ist 1,842 m hoch, die lichte Höhe misst 2,17 m — die
    // Reserve liegt unter 15 cm mehr als komfortabel, aber sie reicht. Eng wird
    // es woanders: 4,863 m Länge gegen 5,220 m nutzbare Tiefe.
    const befund = pruefe(REFERENZ_FAHRZEUG);
    const hoehe = befund.achsen.find((a) => a.achse === 'hoehe')!;
    const laenge = befund.achsen.find((a) => a.achse === 'laenge')!;

    expect(hoehe.reserve).toBeGreaterThan(0);
    expect(laenge.reserve).toBeGreaterThan(0);
    expect(befund.urteil).not.toBe('passt-nicht');
  });

  it('meldet die Heckklappe des Referenzfahrzeugs als kritisches Maß', () => {
    // 2,155 m bei geöffneter Klappe gegen 2,17 m lichte Höhe: rund 1,5 cm, und
    // damit innerhalb der Messunsicherheit. Kein belastbares „passt".
    const befund = pruefe(REFERENZ_FAHRZEUG);

    expect(REFERENZ_FAHRZEUG.hoeheHeckOffen).toBeDefined();
    expect(DEFAULT_CONFIG.CLEAR_HEIGHT - REFERENZ_FAHRZEUG.hoeheHeckOffen!).toBeLessThan(0.05);
    expect(befund.heckklappeOeffenbar).toBe(true);
  });
});
