import { describe, expect, it } from 'vitest';

import {
  AUSWAHL,
  belegteMasse,
  FAHRZEUGE,
  fahrzeugNachId,
  INDIVIDUELL_ID,
  istEditierbar,
  marktstatus,
  pruefhoehe,
  REFERENZ_FAHRZEUG,
  schwaechsteQuellenstufe,
} from './fahrzeuge';
import { m } from './garage';

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
        // Nicht nur groesser als das Dach: Eine geoeffnete Heckklappe ragt
        // deutlich darueber hinaus. Die blosse Ungleichung liesse den gesamten
        // entscheidungskritischen Bereich um 2,17 m zu — ein Zifferndreher
        // 2,180 auf 2,108 bliebe unbemerkt und kippte das Urteil.
        expect(
          f.hoeheHeckOffen.wert - pruefhoehe(f).wert,
          `${f.id}: Heckklappe kaum über dem Dach`,
        ).toBeGreaterThan(0.15);
      }
      if (f.ladelaenge !== undefined) {
        expect(f.ladelaenge.wert, `${f.id}: Ladelänge`).toBeLessThan(f.laenge.wert);
      }
    }
  });

  it('behauptet nirgends in der Bemerkung, hoehe sei die Höhe mit Reling', () => {
    // Der Test unten greift nur, wo hoeheMitDachreling gesetzt ist — genau die
    // Einträge, bei denen die Invariante ohnehin gilt. Die Lücke war real: Der
    // Dacia Jogger trug den Relingwert im Feld hoehe und sagte das in der
    // Bemerkung sogar dazu. Wer das wieder tut, muss das Relingmaß setzen.
    for (const f of AUSWAHL) {
      if (f.hoeheMitDachreling) continue;
      expect(f.hoehe.bemerkung ?? '', `${f.id}: Relingwert im Feld hoehe`).not.toMatch(
        /mit Dachreling/i,
      );
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

describe('Marktstatus', () => {
  const mitBaujahren = (baujahre: string) => marktstatus({ ...FAHRZEUGE[0], baujahre });

  it('leitet den Status aus der Baujahresangabe ab', () => {
    // Die Stichtage stehen in docs/06-marktrelevanz.md und hängen an Abgasnorm
    // und Assistenzpflicht, nicht am Alter.
    expect(mitBaujahren('2020+')).toBe('neu');
    expect(mitBaujahren('2026')).toBe('neu');
    expect(mitBaujahren('2013–2025')).toBe('jung-gebraucht');
    expect(mitBaujahren('2012–2022')).toBe('jung-gebraucht');
    expect(mitBaujahren('2003–2020')).toBe('gebraucht');
    expect(mitBaujahren('2008–2016')).toBe('gebraucht');
    expect(mitBaujahren('2005–2012')).toBe('veraltet');
  });

  it('beschreibt die jüngsten Fahrzeuge einer Baureihe, nicht die ältesten', () => {
    // Ein Caddy 2K von 2004 und einer von 2019 sind dasselbe Modell und zwei
    // völlig verschiedene Kaufentscheidungen. Der Status meint den jüngeren.
    expect(mitBaujahren('2003–2020')).toBe('gebraucht');
  });

  it('vergibt für jeden Katalogeintrag einen Status', () => {
    for (const f of AUSWAHL) {
      expect(
        ['neu', 'jung-gebraucht', 'gebraucht', 'veraltet'],
        `${f.id}: baujahre „${f.baujahre}"`,
      ).toContain(marktstatus(f));
    }
  });

  it('führt keinen veralteten Eintrag im Katalog', () => {
    // docs/06-marktrelevanz.md: Baureihen, deren Produktion vor 2016 endete,
    // werden nicht neu aufgenommen. Schlägt das an, ist entweder ein zu altes
    // Fahrzeug hereingerutscht oder eine Baujahresangabe falsch geschrieben.
    const veraltet = FAHRZEUGE.filter((f) => marktstatus(f) === 'veraltet');

    expect(veraltet.map((f) => `${f.id} (${f.baujahre})`)).toEqual([]);
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
    // Die Einfahrtsbreite kommt aus dem Domänenmodell, nicht als Literal —
    // sonst behauptet dieser Test nach einer Nachmessung weiter 14 cm Rest.
    const rest = m('schmalsteStelleEinfahrt') - REFERENZ_FAHRZEUG.breiteMitSpiegeln!.wert;

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
