import { describe, expect, it } from 'vitest';

import {
  AUSWAHL,
  FAHRZEUGE,
  fahrzeugNachId,
  INDIVIDUELL_ID,
  istEditierbar,
  REFERENZ_FAHRZEUG,
} from './fahrzeuge';

describe('Fahrzeugauswahl', () => {
  it('stellt die freie Eingabe an den Anfang der Liste', () => {
    expect(AUSWAHL[0].id).toBe(INDIVIDUELL_ID);
    expect(AUSWAHL).toHaveLength(FAHRZEUGE.length + 1);
  });

  it('gibt nur die freie Eingabe zum Bearbeiten frei', () => {
    expect(istEditierbar(INDIVIDUELL_ID)).toBe(true);
    for (const f of FAHRZEUGE) {
      expect(istEditierbar(f.id), f.id).toBe(false);
    }
  });

  it('findet jeden Eintrag über seine Id', () => {
    for (const f of AUSWAHL) {
      expect(fahrzeugNachId(f.id)).toBe(f);
    }
    expect(fahrzeugNachId('gibt-es-nicht')).toBeUndefined();
  });

  it('vergibt eindeutige Ids', () => {
    expect(new Set(AUSWAHL.map((f) => f.id)).size).toBe(AUSWAHL.length);
  });
});

describe('Katalogeinträge', () => {
  it('hält jedes belegte Seitenprofil in sich schlüssig', () => {
    for (const f of AUSWAHL) {
      if (!f.seitenprofil) continue;

      const { haubenLaenge, scheibenLaenge, dachLaenge, haubenHoehe } = f.seitenprofil;
      const bisHeckkante = haubenLaenge + scheibenLaenge + dachLaenge;

      // Hinter dem Dach bleibt der Heckueberhang — er darf nicht negativ werden.
      expect(bisHeckkante, `${f.id}: Profil länger als das Fahrzeug`).toBeLessThanOrEqual(f.laenge);
      expect(haubenHoehe, `${f.id}: Haube höher als das Fahrzeug`).toBeLessThan(f.hoehe);
    }
  });

  it('führt keine Maße ohne Quellenstufe', () => {
    for (const f of AUSWAHL) {
      expect(['A', 'B', 'C', 'D'], `${f.id}`).toContain(f.quellenstufe);
      if (f.seitenprofil) {
        expect(['A', 'B', 'C', 'D'], `${f.id}: Seitenprofil`).toContain(
          f.seitenprofil.quellenstufe,
        );
      }
    }
  });

  it('erfindet kein Seitenprofil für recherchierte Fahrzeuge', () => {
    // Diese vier Maße stehen in keinem Datenblatt. Sie zu schätzen ließe das Tor
    // freier aussehen, als es ist — deshalb bleiben sie leer, und die Prüfung
    // rechnet mit einem Quader über die volle Höhe. Wird eines am Fahrzeug
    // nachgemessen, schlägt dieser Test fehl; dann sind Wert, Quellenstufe und
    // der Hinweis in der Oberfläche gemeinsam nachzuziehen.
    const mitProfil = FAHRZEUGE.filter((f) => f.seitenprofil !== undefined);

    expect(mitProfil.map((f) => f.id)).toEqual([]);
  });

  it('hält jedes belegte Maß im plausiblen Bereich', () => {
    for (const f of AUSWAHL) {
      expect(f.laenge, `${f.id}: Länge`).toBeGreaterThan(3);
      expect(f.laenge, `${f.id}: Länge`).toBeLessThan(8);
      expect(f.hoehe, `${f.id}: Höhe`).toBeGreaterThan(1.3);
      expect(f.hoehe, `${f.id}: Höhe`).toBeLessThan(3.2);

      if (f.breiteOhneSpiegel !== undefined && f.breiteMitSpiegeln !== undefined) {
        expect(f.breiteMitSpiegeln, `${f.id}: Spiegel verschmälern nicht`).toBeGreaterThan(
          f.breiteOhneSpiegel,
        );
      }
      if (f.hoeheHeckOffen !== undefined) {
        expect(f.hoeheHeckOffen, `${f.id}: Heckklappe`).toBeGreaterThan(f.hoehe);
      }
      if (f.ladelaenge !== undefined) {
        expect(f.ladelaenge, `${f.id}: Ladelänge`).toBeLessThan(f.laenge);
      }
    }
  });
});

describe('Referenzfahrzeug', () => {
  it('ist der Caddy Maxi mit Herstellerdatenblatt', () => {
    expect(REFERENZ_FAHRZEUG.id).toBe('vw-caddy-sb-maxi');
    expect(REFERENZ_FAHRZEUG.quellenstufe).toBe('A');
  });

  it('führt die Breite mit und ohne Spiegel', () => {
    expect(REFERENZ_FAHRZEUG.breiteOhneSpiegel).toBeCloseTo(1.855, 3);
    expect(REFERENZ_FAHRZEUG.breiteMitSpiegeln).toBeCloseTo(2.1, 2);
  });

  it('passt mit ausgeklappten Spiegeln durch die schmalste Stelle der Einfahrt', () => {
    // Schmalste Stelle 2,24 m, bestimmt von den Schwenkarmen.
    const rest = 2.24 - REFERENZ_FAHRZEUG.breiteMitSpiegeln!;

    expect(rest).toBeGreaterThan(0);
    expect(rest).toBeCloseTo(0.14, 2);
  });
});
