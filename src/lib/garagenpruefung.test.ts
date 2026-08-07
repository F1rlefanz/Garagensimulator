import { describe, expect, it } from 'vitest';

import { pruefeGarage, RESERVE_SICHER, URTEIL_LABEL } from './garagenpruefung';
import { DEFAULT_CONFIG, nutzbareTiefe } from './kinematics';
import { AUSWAHL, Fahrzeug, Fahrzeugmass, REFERENZ_FAHRZEUG } from '../domain/fahrzeuge';
import { m } from '../domain/garage';

const EINFAHRT = m('schmalsteStelleEinfahrt');
const pruefe = (f: Fahrzeug) => pruefeGarage(f, DEFAULT_CONFIG, EINFAHRT);

/** Belegtes Testmaß — die Prüfung liest den Beleg mit, also braucht sie einen. */
const testmass = (wert: number): Fahrzeugmass => ({
  wert,
  quellenstufe: 'A',
  quelle: 'Testfixture',
  abgerufenAm: '2026-08-06',
});

/** Ein Fahrzeug, das auf allen Achsen mit Reserve hineinpasst. */
const WINZIG: Fahrzeug = {
  id: 'test-winzig',
  bezeichnung: 'Testwagen klein',
  modell: 'Test',
  variante: 'klein',
  baujahre: '—',
  kategorie: 'kombi',
  laenge: testmass(4),
  hoehe: testmass(1.5),
  breiteOhneSpiegel: testmass(1.7),
  breiteMitSpiegeln: testmass(1.9),
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

  it('reicht je Achse den Beleg des richtigen Maßes durch', () => {
    // Ein knappes Urteil ist nur so belastbar wie die Zahl, auf der es beruht.
    // Jedes Maß bekommt hier eine eigene Stufe, sonst bliebe eine Vertauschung
    // der drei Achsen unsichtbar.
    const bunt: Fahrzeug = {
      ...WINZIG,
      laenge: { ...testmass(4), quellenstufe: 'A', quelle: 'Laengenbeleg', bemerkung: 'zur Länge' },
      hoehe: { ...testmass(1.5), quellenstufe: 'C', quelle: 'Hoehenbeleg' },
      breiteMitSpiegeln: { ...testmass(1.9), quellenstufe: 'D', quelle: 'Breitenbeleg' },
    };
    const [laenge, hoehe, breite] = pruefe(bunt).achsen;

    expect(laenge.quellenstufe).toBe('A');
    expect(laenge.quelle).toBe('Laengenbeleg');
    expect(laenge.massBemerkung).toBe('zur Länge');
    expect(hoehe.quellenstufe).toBe('C');
    expect(hoehe.quelle).toBe('Hoehenbeleg');
    expect(breite.quellenstufe).toBe('D');
    expect(breite.quelle).toBe('Breitenbeleg');
  });

  it('sagt es, wenn für ein Fahrzeug gar kein Relingmaß belegt ist', () => {
    // Der dritte Anmerkungszweig: weder mit Reling geprüft noch stillschweigend
    // ohne — der Leser soll wissen, dass die Angabe schlicht fehlt.
    const hoehe = pruefe(WINZIG).achsen.find((a) => a.achse === 'hoehe')!;

    expect(hoehe.anmerkung).toMatch(/kein Relingmaß belegt/);
  });

  it('urteilt „sicher“, wenn überall Reserve bleibt', () => {
    const befund = pruefe(WINZIG);

    expect(befund.urteil).toBe('sicher');
    expect(befund.engsteReserve).toBeGreaterThanOrEqual(RESERVE_SICHER);
  });

  it('urteilt „knapp“, sobald eine Achse unter die Reserveschwelle fällt', () => {
    const knapp: Fahrzeug = {
      ...WINZIG,
      hoehe: testmass(DEFAULT_CONFIG.CLEAR_HEIGHT - RESERVE_SICHER / 2),
    };
    const befund = pruefe(knapp);

    expect(befund.urteil).toBe('knapp');
    expect(befund.achsen.find((a) => a.achse === 'hoehe')?.urteil).toBe('knapp');
  });

  it('urteilt „passt nicht“, sobald eine Achse überschritten ist', () => {
    const zuLang: Fahrzeug = { ...WINZIG, laenge: testmass(nutzbareTiefe(DEFAULT_CONFIG) + 0.01) };
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

    expect(breite.benoetigt).toBeCloseTo(WINZIG.breiteMitSpiegeln!.wert, 9);
  });

  it('weicht auf die Breite ohne Spiegel aus und weist darauf hin', () => {
    const ohneSpiegelmass: Fahrzeug = { ...WINZIG, breiteMitSpiegeln: undefined };
    const breite = pruefe(ohneSpiegelmass).achsen.find((a) => a.achse === 'breite')!;

    expect(breite.benoetigt).toBeCloseTo(WINZIG.breiteOhneSpiegel!.wert, 9);
    expect(breite.anmerkung).toMatch(/zu günstig/);
  });

  it('prüft die Höhe mit Dachreling, wo sie belegt ist', () => {
    // Die Reling steht bei vielen Fahrzeugen serienmäßig auf dem Dach. Wer
    // gegen die relingfreie Tabellenzeile prüft, prüft ein Fahrzeug, das so
    // nicht in der Einfahrt steht.
    const mitReling: Fahrzeug = { ...WINZIG, hoeheMitDachreling: testmass(1.566) };
    const hoehe = pruefe(mitReling).achsen.find((a) => a.achse === 'hoehe')!;

    expect(hoehe.benoetigt).toBeCloseTo(1.566, 9);
    expect(hoehe.anmerkung).toMatch(/Dachreling/);
  });

  it('lässt „passt nicht“ jedes andere Urteil überstimmen', () => {
    const gemischt: Fahrzeug = {
      ...WINZIG,
      laenge: testmass(nutzbareTiefe(DEFAULT_CONFIG) + 1),
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
    const knapp: Fahrzeug = {
      ...WINZIG,
      hoeheHeckOffen: testmass(DEFAULT_CONFIG.CLEAR_HEIGHT - 0.01),
    };
    const zuHoch: Fahrzeug = {
      ...WINZIG,
      hoeheHeckOffen: testmass(DEFAULT_CONFIG.CLEAR_HEIGHT + 0.01),
    };

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

  it('lässt das Referenzfahrzeug auf Länge und Höhe bestehen', () => {
    // Eng wird es beim Caddy Maxi nicht auf diesen beiden Achsen, sondern bei
    // der Heckklappe und der Breite mit ausgeklappten Spiegeln.
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
    expect(DEFAULT_CONFIG.CLEAR_HEIGHT - REFERENZ_FAHRZEUG.hoeheHeckOffen!.wert).toBeLessThan(0.05);
    expect(befund.heckklappeOeffenbar).toBe(true);
  });

  it('meldet die Heckklappe des Modellstands vor der Modellpflege als überschritten', () => {
    // Derselbe Wagen, anderer Modellstand: 2,178 m gegen 2,170 m lichte Höhe.
    // Genau deshalb stehen die beiden als getrennte Einträge im Katalog.
    const vorher = AUSWAHL.find((f) => f.id === 'vw-caddy-sb-maxi')!;

    expect(pruefe(vorher).heckklappeOeffenbar).toBe(false);
  });
});
