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
  it('hält das Seitenprofil in sich schlüssig', () => {
    for (const f of AUSWAHL) {
      const { haubenLaenge, scheibenLaenge, dachLaenge } = f.seitenprofil;
      const bisHeckkante = haubenLaenge + scheibenLaenge + dachLaenge;

      // Hinter dem Dach bleibt der Heckueberhang — er darf nicht negativ werden.
      expect(bisHeckkante, `${f.id}: Profil länger als das Fahrzeug`).toBeLessThanOrEqual(f.laenge);
      expect(f.seitenprofil.haubenHoehe, `${f.id}`).toBeLessThan(f.hoehe);
    }
  });

  it('gibt für jedes recherchierte Maß eine Quelle an', () => {
    for (const f of FAHRZEUGE) {
      if (f.datenstand === 'recherchiert' || f.datenstand === 'herstellerangabe') {
        expect(f.quelle, `${f.id} ohne Quellenangabe`).toBeTruthy();
      }
    }
  });

  it('markiert das Seitenprofil als geschätzt, solange es nicht nachgemessen ist', () => {
    // Diese drei Maße stehen in keinem Datenblatt und bestimmen die
    // Kollisionsprüfung. Werden sie am Fahrzeug nachgemessen, schlägt der Test
    // fehl — dann ist auch die Warnung in der UI zu entfernen.
    expect(REFERENZ_FAHRZEUG.profilDatenstand).toBe('geschaetzt');
  });

  it('führt beim Referenzfahrzeug die Breite mit und ohne Spiegel', () => {
    expect(REFERENZ_FAHRZEUG.breiteOhneSpiegel).toBeCloseTo(1.855, 3);
    expect(REFERENZ_FAHRZEUG.breiteMitSpiegeln).toBeCloseTo(2.1, 2);
    expect(REFERENZ_FAHRZEUG.breiteMitSpiegeln!).toBeGreaterThan(
      REFERENZ_FAHRZEUG.breiteOhneSpiegel!,
    );
  });

  it('passt mit ausgeklappten Spiegeln durch die schmalste Stelle der Einfahrt', () => {
    // Schmalste Stelle 2,24 m, bestimmt von den Schwenkarmen.
    const rest = 2.24 - REFERENZ_FAHRZEUG.breiteMitSpiegeln!;

    expect(rest).toBeGreaterThan(0);
    expect(rest).toBeCloseTo(0.14, 2);
  });
});
