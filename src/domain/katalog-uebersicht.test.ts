import { describe, it } from 'vitest';

import { DEFAULT_CONFIG, nutzbareTiefe } from '../lib/kinematics';
import { pruefeGarage, URTEIL_LABEL } from '../lib/garagenpruefung';
import { m } from './garage';
import { FAHRZEUGE, MARKTSTATUS_LABEL, pruefhoehe, schwaechsteQuellenstufe } from './fahrzeuge';

/**
 * Kein Test, sondern ein Werkzeug: druckt den Katalog samt Urteil je Eintrag.
 * Für die Sichtprüfung nach einer Katalogänderung — dann lässt sich in einem
 * Blick erkennen, ob ein Fahrzeug plötzlich das Urteil wechselt.
 *
 *     KATALOG_UEBERSICHT=1 npx vitest run src/domain/katalog-uebersicht.test.ts
 *
 * Standardmäßig still, damit `npm test` lesbar bleibt.
 */
describe('Katalogübersicht', () => {
  it.runIf(process.env.KATALOG_UEBERSICHT === '1')('druckt den Stand', () => {
    const einfahrt = m('schmalsteStelleEinfahrt');
    const zahl = (v?: number) => (v === undefined ? '  —  ' : v.toFixed(3));

    const nachStatus = new Map<string, number>();
    for (const f of FAHRZEUGE) {
      nachStatus.set(f.marktstatus, (nachStatus.get(f.marktstatus) ?? 0) + 1);
    }

    console.log(`\n${FAHRZEUGE.length} Katalogeinträge`);
    console.log(
      'Marktstatus: ' +
        [...nachStatus].map(([s, n]) => `${MARKTSTATUS_LABEL[s as never]} ${n}`).join(' · '),
    );
    console.log(
      `Garage: ${nutzbareTiefe(DEFAULT_CONFIG).toFixed(3)} tief · ` +
        `${DEFAULT_CONFIG.CLEAR_HEIGHT.toFixed(3)} hoch · ${einfahrt.toFixed(3)} breit\n`,
    );
    console.log(
      'id'.padEnd(44) +
        'Status'.padEnd(16) +
        'Länge  Höhe   Breite Heck   Q Urteil',
    );

    for (const f of FAHRZEUGE) {
      const b = pruefeGarage(f, DEFAULT_CONFIG, einfahrt);
      const heck =
        f.hoeheHeckOffen === undefined
          ? '  —  '
          : `${zahl(f.hoeheHeckOffen.wert)}${b.heckklappeOeffenbar ? '' : '!'}`;
      console.log(
        f.id.padEnd(44) +
          f.marktstatus.padEnd(16) +
          zahl(f.laenge.wert).padEnd(7) +
          zahl(pruefhoehe(f).wert).padEnd(7) +
          zahl(f.breiteMitSpiegeln?.wert ?? f.breiteOhneSpiegel?.wert).padEnd(7) +
          heck.padEnd(7) +
          schwaechsteQuellenstufe(f) +
          ' ' +
          URTEIL_LABEL[b.urteil],
      );
    }
  });
});
