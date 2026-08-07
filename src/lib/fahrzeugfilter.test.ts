import { describe, expect, it } from 'vitest';

import { bleibtSichtbar, filtereAuswahl, KEIN_FILTER } from './fahrzeugfilter';
import { DEFAULT_CONFIG, nutzbareTiefe } from './kinematics';
import { AUSWAHL, Fahrzeug, Fahrzeugmass, INDIVIDUELL_ID } from '../domain/fahrzeuge';
import { m } from '../domain/garage';

const EINFAHRT = m('schmalsteStelleEinfahrt');

const testmass = (wert: number): Fahrzeugmass => ({
  wert,
  quellenstufe: 'A',
  quelle: 'Testfixture',
  abgerufenAm: '2026-08-07',
});

const BASIS: Fahrzeug = {
  id: 'test-basis',
  bezeichnung: 'Testwagen',
  modell: 'Test',
  variante: 'basis',
  baujahre: '2022+',
  kategorie: 'kombi',
  laenge: testmass(4),
  hoehe: testmass(1.5),
  breiteOhneSpiegel: testmass(1.7),
  breiteMitSpiegeln: testmass(1.9),
};

const sichtbar = (f: Fahrzeug, filter = KEIN_FILTER, gewaehlt = 'irgendwas-anderes') =>
  bleibtSichtbar(f, filter, gewaehlt, DEFAULT_CONFIG, EINFAHRT);

describe('Fahrzeugfilter', () => {
  it('lässt ohne Filter alles stehen', () => {
    expect(filtereAuswahl(AUSWAHL, KEIN_FILTER, 'egal', DEFAULT_CONFIG, EINFAHRT)).toHaveLength(
      AUSWAHL.length,
    );
  });

  it('blendet aus, was nachweislich nicht hineinpasst', () => {
    const zuLang: Fahrzeug = { ...BASIS, laenge: testmass(nutzbareTiefe(DEFAULT_CONFIG) + 0.5) };

    expect(sichtbar(zuLang, { nurPassende: true, nurNeue: false })).toBe(false);
    expect(sichtbar(BASIS, { nurPassende: true, nurNeue: false })).toBe(true);
  });

  it('blendet eine unbelegte Achse NICHT aus', () => {
    // Bewusste Festlegung: Der Filter entfernt nur, was nachweislich nicht
    // passt. Ein Fahrzeug ohne Breitenangabe verschwinden zu lassen, würde die
    // Lücke unsichtbar machen — die Richtung, in die dieses Projekt nie geht.
    const ohneBreite: Fahrzeug = {
      ...BASIS,
      breiteOhneSpiegel: undefined,
      breiteMitSpiegeln: undefined,
    };

    expect(sichtbar(ohneBreite, { nurPassende: true, nurNeue: false })).toBe(true);
  });

  it('blendet nach Marktstatus aus', () => {
    // Der Marktstatus wird aus baujahre abgeleitet: Produktionsende 2018 ist
    // „Gebrauchtmarkt", nicht „neu bestellbar".
    const alt: Fahrzeug = { ...BASIS, id: 'test-alt', baujahre: '2010–2018' };

    expect(sichtbar(alt, { nurPassende: false, nurNeue: true })).toBe(false);
    expect(sichtbar(BASIS, { nurPassende: false, nurNeue: true })).toBe(true);
  });

  it('hält das gewählte Fahrzeug und die freie Eingabe immer sichtbar', () => {
    const alt: Fahrzeug = { ...BASIS, id: 'test-alt', baujahre: '2005–2012' };
    const scharf = { nurPassende: true, nurNeue: true };

    expect(bleibtSichtbar(alt, scharf, 'test-alt', DEFAULT_CONFIG, EINFAHRT)).toBe(true);
    const frei = AUSWAHL.find((f) => f.id === INDIVIDUELL_ID)!;
    expect(bleibtSichtbar(frei, scharf, 'egal', DEFAULT_CONFIG, EINFAHRT)).toBe(true);
  });

  it('lässt mit beiden Filtern nie mehr Einträge übrig als mit einem', () => {
    const zaehle = (nurPassende: boolean, nurNeue: boolean) =>
      filtereAuswahl(AUSWAHL, { nurPassende, nurNeue }, 'egal', DEFAULT_CONFIG, EINFAHRT).length;

    expect(zaehle(true, true)).toBeLessThanOrEqual(zaehle(true, false));
    expect(zaehle(true, true)).toBeLessThanOrEqual(zaehle(false, true));
    expect(zaehle(false, true)).toBeLessThanOrEqual(zaehle(false, false));
  });
});
