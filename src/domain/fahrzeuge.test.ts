import { describe, expect, it } from 'vitest';

import {
  AUSWAHL,
  belegteMasse,
  FAHRZEUGE,
  fahrzeugNachId,
  INDIVIDUELL_ID,
  istEditierbar,
  pruefhoehe,
  REFERENZ_FAHRZEUG,
  schwaechsteQuellenstufe,
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

describe('Belege', () => {
  it('führt kein Maß ohne Quellenstufe, Quelle und Abrufdatum', () => {
    // Ein recherchierter Wert ohne Beleg ist nach einem halben Jahr nicht mehr
    // nachprüfbar und damit wertlos — genau der Zustand, den das Datenmodell
    // ausschließen soll.
    for (const f of AUSWAHL) {
      for (const [feld, mass] of belegteMasse(f)) {
        expect(['A', 'B', 'C', 'D'], `${f.id}/${feld}: Quellenstufe`).toContain(mass.quellenstufe);
        expect(mass.quelle.trim().length, `${f.id}/${feld}: Quelle leer`).toBeGreaterThan(0);
        expect(mass.abgerufenAm, `${f.id}/${feld}: Abrufdatum`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      if (f.seitenprofil) {
        expect(['A', 'B', 'C', 'D'], `${f.id}: Seitenprofil`).toContain(
          f.seitenprofil.quellenstufe,
        );
      }
    }
  });

  it('meldet als Quellenstufe eines Eintrags die schwächste seiner Maße', () => {
    for (const f of AUSWAHL) {
      const stufen = belegteMasse(f).map(([, m]) => m.quellenstufe);
      const schwaechste = schwaechsteQuellenstufe(f);

      expect(stufen, `${f.id}`).toContain(schwaechste);
      for (const s of stufen) {
        expect(s.localeCompare(schwaechste), `${f.id}: ${s} schlechter als ${schwaechste}`)
          .toBeLessThanOrEqual(0);
      }
    }
  });
});

describe('Katalogeinträge', () => {
  it('hält jedes belegte Seitenprofil in sich schlüssig', () => {
    for (const f of AUSWAHL) {
      if (!f.seitenprofil) continue;

      const { haubenLaenge, scheibenLaenge, dachLaenge, haubenHoehe } = f.seitenprofil;
      const bisHeckkante = haubenLaenge + scheibenLaenge + dachLaenge;

      // Hinter dem Dach bleibt der Heckueberhang — er darf nicht negativ werden.
      expect(bisHeckkante, `${f.id}: Profil länger als das Fahrzeug`).toBeLessThanOrEqual(
        f.laenge.wert,
      );
      expect(haubenHoehe, `${f.id}: Haube höher als das Fahrzeug`).toBeLessThan(f.hoehe.wert);
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
      expect(f.laenge.wert, `${f.id}: Länge`).toBeGreaterThan(3);
      expect(f.laenge.wert, `${f.id}: Länge`).toBeLessThan(8);
      expect(f.hoehe.wert, `${f.id}: Höhe`).toBeGreaterThan(1.3);
      expect(f.hoehe.wert, `${f.id}: Höhe`).toBeLessThan(3.2);

      if (f.breiteOhneSpiegel !== undefined && f.breiteMitSpiegeln !== undefined) {
        expect(f.breiteMitSpiegeln.wert, `${f.id}: Spiegel verschmälern nicht`).toBeGreaterThan(
          f.breiteOhneSpiegel.wert,
        );
      }
      if (f.hoeheHeckOffen !== undefined) {
        expect(f.hoeheHeckOffen.wert, `${f.id}: Heckklappe`).toBeGreaterThan(pruefhoehe(f).wert);
      }
      if (f.ladelaenge !== undefined) {
        expect(f.ladelaenge.wert, `${f.id}: Ladelänge`).toBeLessThan(f.laenge.wert);
      }
    }
  });

  it('führt die Dachreling nie im Feld für die Höhe ohne Reling', () => {
    // Die häufigste Verwechslung der Recherche vom 06.08.2026: ein Wert mit
    // Dachreling im Feld `hoehe`. Das Relingmaß muss größer sein, sonst ist
    // eines der beiden falsch zugeordnet.
    for (const f of AUSWAHL) {
      if (!f.hoeheMitDachreling) continue;

      expect(
        f.hoeheMitDachreling.wert,
        `${f.id}: Höhe mit Reling nicht größer als ohne`,
      ).toBeGreaterThan(f.hoehe.wert);
      expect(pruefhoehe(f).wert, `${f.id}: geprüft wird die Höhe mit Reling`).toBe(
        f.hoeheMitDachreling.wert,
      );
    }
  });
});

describe('Referenzfahrzeug', () => {
  it('ist der Caddy Maxi im Modellstand 2026', () => {
    // Das ist der Wagen, um den es bei der Kaufentscheidung geht. Der Stand vor
    // der Modellpflege steht als eigener Eintrag daneben — die beiden
    // unterscheiden sich in der Heckklappenhöhe, siehe OFFEN-12.
    expect(REFERENZ_FAHRZEUG.id).toBe('vw-caddy-sb-maxi-mopf');
    expect(REFERENZ_FAHRZEUG.laenge.quellenstufe).toBe('A');
  });

  it('führt die Breite mit und ohne Spiegel', () => {
    expect(REFERENZ_FAHRZEUG.breiteOhneSpiegel?.wert).toBeCloseTo(1.855, 3);
    expect(REFERENZ_FAHRZEUG.breiteMitSpiegeln?.wert).toBeCloseTo(2.1, 2);
  });

  it('passt mit ausgeklappten Spiegeln durch die schmalste Stelle der Einfahrt', () => {
    // Schmalste Stelle 2,24 m, bestimmt von den Schwenkarmen.
    const rest = 2.24 - REFERENZ_FAHRZEUG.breiteMitSpiegeln!.wert;

    expect(rest).toBeGreaterThan(0);
    expect(rest).toBeCloseTo(0.14, 2);
  });

  it('führt beide Modellstände des Caddy Maxi mit unterschiedlicher Heckklappenhöhe', () => {
    // Kern der Entscheidung vom 06.08.2026: Die beiden VW-Werte 2.178 und
    // 2.155 mm sind kein Widerspruch, sondern zwei Modellstände. Fällt einer
    // der beiden Einträge weg oder gleichen sich die Werte an, ist die
    // Entscheidung hinfällig und OFFEN-12 neu zu bewerten.
    const vorher = fahrzeugNachId('vw-caddy-sb-maxi');
    const nachher = fahrzeugNachId('vw-caddy-sb-maxi-mopf');

    expect(vorher?.hoeheHeckOffen?.wert).toBeCloseTo(2.178, 3);
    expect(nachher?.hoeheHeckOffen?.wert).toBeCloseTo(2.155, 3);
  });
});
