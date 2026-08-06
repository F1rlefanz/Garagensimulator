/**
 * Single Source of Truth für alle vor Ort aufgenommenen Garagen- und Tormaße.
 *
 * Stand: Nachmessung vom 06.08.2026 samt Klarstellungen desselben Tages.
 * Aufbereitet in: docs/02-messwerte.md
 *
 * An Drehpunkten wurde zur Achsmitte gemessen. Die Garage ist an mehreren
 * Stellen nicht rechtwinklig, und einige Maße lassen sich allein schwer
 * aufnehmen — Abweichungen im Bereich von ein bis zwei Zentimetern sind
 * deshalb Messunsicherheit, nicht Modellfehler.
 *
 * ZWEI HÖHENBEZÜGE, das ist der Kern des Modells:
 *
 *   Torschliessebene  y = 0        Straßenniveau, hier schließt die Torunterkante.
 *                                  Alle Maße am Torblatt und an der Mechanik
 *                                  beziehen sich hierauf (auch y_A, gemessen bis
 *                                  zur Eisenschwelle).
 *   Garagenboden      y = BODENVERSATZ
 *                                  Hinter der Eisenschwelle steigt eine Rampe an.
 *                                  Alle Raummaße (lichte Höhe, Garagenhöhe,
 *                                  Laufschiene) beziehen sich hierauf. Hier steht
 *                                  auch das Fahrzeug.
 *
 * Werden die beiden verwechselt, sieht das Tor 12 cm zu hoch aus und die
 * Laufrolle passt nicht in ihre Schiene — genau das war der lange offene
 * Widerspruch OFFEN-02.
 *
 * WICHTIG: Messwerte werden ausschließlich hier gepflegt. Weder Kinematik noch
 * UI dürfen eigene Zahlen halten — sie leiten alles aus diesem Modul ab.
 */

/** Vertrauensgrad eines Messwerts. */
export type Vertrauen =
  /** Vor Ort gemessen. */
  | 'gemessen'
  /** Aus anderen Messwerten berechnet. */
  | 'abgeleitet'
  /** Angenommen/geschätzt — muss noch nachgemessen werden. */
  | 'geschaetzt'
  /** Gemessen, steht aber im Widerspruch zu anderen Messwerten. */
  | 'widerspruechlich';

/** Worauf sich eine Höhenangabe bezieht. */
export type Hoehenbezug = 'torschliessebene' | 'garagenboden' | 'ohne';

export interface Messwert {
  /** Wert in Metern. */
  readonly wert: number;
  /** Symbol aus der Zeichnung bzw. dem Handoff-Dokument (z. B. `y_A`). */
  readonly symbol: string;
  readonly beschreibung: string;
  readonly vertrauen: Vertrauen;
  /** Nullpunkt einer Höhenangabe. Längen und Breiten stehen auf `'ohne'`. */
  readonly bezug: Hoehenbezug;
  /** Verweis auf docs/03-offene-fragen.md, falls strittig oder ungemessen. */
  readonly offeneFrage?: string;
}

export const MESSWERTE = {
  // ---------------------------------------------------------------- Garage
  gesamtlaengeGarage: {
    wert: 5.37,
    symbol: 'L_gesamt',
    beschreibung:
      'Innenlänge von der Rückwand (Rohbau, ohne Dämmung) bis zur Außenmauer der Torseite.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },
  federwegTiefe: {
    wert: 0.12,
    symbol: 'd_feder',
    beschreibung:
      'Tiefe, die die Federung an der Torseite belegt. Steht als Stellfläche nicht zur Verfügung.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },
  styroporDicke: {
    wert: 0.03,
    symbol: 'd_styro',
    beschreibung:
      'Dämmung an der Rückwand, an ihrer dicksten Stelle. In L_gesamt NICHT enthalten und ' +
      'deshalb zusätzlich abzuziehen. Wirkt als Anschlag beim Rückwärtseinparken.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },
  schmalsteStelleEinfahrt: {
    wert: 2.24,
    symbol: 'b_min',
    beschreibung:
      'Schmalste Stelle der Einfahrt. Bestimmt wird sie nicht von der Zarge, sondern von ' +
      'den beidseitigen Schwenkarmen. Maßgeblich für die Fahrzeugbreite, erst im 3D-Modell wirksam.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },
  garagenhoehe: {
    wert: 2.37,
    symbol: 'h_garage',
    beschreibung:
      'Garagenboden bis Decke, in einem Zug gemessen. Die Schichtkette aus lichter Höhe, ' +
      'Schienenprofil und Deckenabstand ergibt 2,397 m.',
    vertrauen: 'widerspruechlich',
    bezug: 'garagenboden',
    offeneFrage: 'OFFEN-05',
  },

  // ----------------------------------------------------------- Laufschiene
  lichteHoehe: {
    wert: 2.17,
    symbol: 'h_licht',
    beschreibung:
      'Garagenboden bis Unterkante des Schienenprofils — die lichte Durchfahrtshöhe. ' +
      'Bezugspunkt bestätigt: gemessen wurde zur Schienenunterkante, nicht zum Sturz.',
    vertrauen: 'gemessen',
    bezug: 'garagenboden',
  },
  laufschieneProfilhoehe: {
    wert: 0.062,
    symbol: 'h_schiene',
    beschreibung: 'Bauhöhe des Schienenprofils, Unterkante bis Oberkante.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },
  laufschieneZuDecke: {
    wert: 0.165,
    symbol: 'd_decke',
    beschreibung: 'Oberkante Laufschiene bis Garagendecke. Mehrfach bestätigt.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },
  laufschienenLaenge: {
    wert: 2.3,
    symbol: 'L_schiene',
    beschreibung:
      'Nutzbare Länge der Laufschiene, vom torseitigen Anfang bis zur Mitte der Laufachse ' +
      'in der Endstellung. Begrenzt den Weg der Laufrolle nach innen.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },

  // -------------------------------------------------------------- Torblatt
  torblattHoehe: {
    wert: 2.37,
    symbol: 'L_tor',
    beschreibung:
      'Gesamthöhe des Torblatts, Unterkante bis Oberkante, in einem Zug gemessen. ' +
      'Die Summe der Teilstrecken ergibt 2,358 m.',
    vertrauen: 'widerspruechlich',
    bezug: 'ohne',
    offeneFrage: 'OFFEN-07',
  },
  rolleZuAnlenkpunkt: {
    wert: 2.24,
    symbol: 'D_TP',
    beschreibung: 'Anlenkpunkt P bis Achse der Laufrolle T, auf dem Torblatt.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },
  anlenkpunktZuUnterkante: {
    wert: 0.085,
    symbol: 'D_PB',
    beschreibung: 'Torunterkante B bis Anlenkpunkt P.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },
  rolleZuOberkante: {
    wert: 0.033,
    symbol: 'D_TO',
    beschreibung: 'Toroberkante O bis Achsmitte der Laufrolle T.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },

  // -------------------------------------------------------------- Mechanik
  lagerbolzenHoehe: {
    wert: 1.16,
    symbol: 'y_A',
    beschreibung:
      'Achse des Lagerbolzens im Festlager A bis zur Eisenschwelle im Boden. ' +
      'Bezug ist damit die Torschließebene, nicht der Garagenboden.',
    vertrauen: 'gemessen',
    bezug: 'torschliessebene',
  },
  lagerbolzenTiefe: {
    wert: 0.0,
    symbol: 'x_A',
    beschreibung:
      'Horizontaler Versatz des Festlagers A gegenüber der Torebene. Nicht gemessen; ' +
      'nach Einschätzung vor Ort zwei bis drei Zentimeter. Angesetzt wird 0.',
    vertrauen: 'geschaetzt',
    bezug: 'ohne',
    offeneFrage: 'OFFEN-08',
  },
  schwenkarmLaenge: {
    wert: 1.1,
    symbol: 'R',
    beschreibung: 'Achsmitte Lagerbolzen A bis Achsmitte Anlenkpunkt P.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
    offeneFrage: 'OFFEN-01',
  },
  lagerbolzenZuFederpunkt: {
    wert: 0.178,
    symbol: 'D_AF',
    beschreibung:
      'Achse Lagerbolzen A bis Achse Federpunkt F. F sitzt am Schwenkarm auf derselben ' +
      'Achse wie A und P, ragt aber über den Lagerbolzen hinaus — daher die ' +
      'Übertotpunkt-Wirkung. Die Federung ist von F aus im Boden verankert.',
    vertrauen: 'gemessen',
    bezug: 'ohne',
  },
} as const satisfies Record<string, Messwert>;

export type MesswertSchluessel = keyof typeof MESSWERTE;

/** Kurzform: nur der Zahlenwert eines Messwerts. */
export function m(schluessel: MesswertSchluessel): number {
  return MESSWERTE[schluessel].wert;
}

/** Gesamthöhe des Torblatts als Summe der drei Teilstrecken: 0,033 + 2,240 + 0,085. */
export const TORBLATT_HOEHE_SUMME =
  m('rolleZuOberkante') + m('rolleZuAnlenkpunkt') + m('anlenkpunktZuUnterkante');

/**
 * Höhe der Laufrollenachse über der Torschließebene.
 *
 * Abgeleitet über die einzige geometrische Gewissheit: Bei geschlossenem Tor
 * steht das Torblatt senkrecht und seine Unterkante liegt auf der Schließebene.
 * Damit liegt die Rollenachse genau `D_PB + D_TP` darüber.
 */
export const ROLLENACHSE_HOEHE = m('anlenkpunktZuUnterkante') + m('rolleZuAnlenkpunkt');

/** Dieselbe Höhe, unabhängig über den Schwenkarm hergeleitet. Dient dem Abgleich. */
export const ROLLENACHSE_HOEHE_UEBER_ARM =
  m('lagerbolzenHoehe') - m('schwenkarmLaenge') + m('rolleZuAnlenkpunkt');

/**
 * Schwenkarmlänge, wie sie sich zwingend aus der geschlossenen Torstellung
 * ergibt: Bei θ = 0 liegt P senkrecht unter T in der Torebene, auf Höhe `D_PB`.
 * Nur mit dieser Länge schließt das Tor bündig, deshalb rechnet die Kinematik
 * damit und nicht mit dem gemessenen R.
 */
export const SCHWENKARM_LAENGE_ABGELEITET = Math.hypot(
  m('lagerbolzenTiefe'),
  m('anlenkpunktZuUnterkante') - m('lagerbolzenHoehe'),
);

/** Oberkante des Schienenprofils, über dem Garagenboden. */
export const LAUFSCHIENE_OBERKANTE = m('lichteHoehe') + m('laufschieneProfilhoehe');

/** Garagenhöhe, aufsummiert aus lichter Höhe, Schienenprofil und Deckenabstand. */
export const GARAGENHOEHE_AUS_SCHICHTEN = LAUFSCHIENE_OBERKANTE + m('laufschieneZuDecke');

/**
 * Höhe des Garagenbodens über der Torschließebene — Eisenschwelle plus die
 * dahinter ansteigende Rampe.
 *
 * Nicht gemessen, sondern aus der Zwangsbedingung abgeleitet: Die Laufrolle muss
 * im Schienenprofil laufen. Angesetzt wird die Profilmitte, also der Wert, der
 * die Rolle mittig in die Schiene legt. Der zulässige Bereich ergibt sich aus
 * Profilunterkante und -oberkante (siehe `BODENVERSATZ_MIN`/`_MAX`).
 *
 * Dieser Versatz löst den langen Widerspruch OFFEN-02 auf: Torblatt und
 * Mechanik wurden ab Straßenniveau gemessen, die Raummaße ab Garagenboden.
 */
/** Auf Millimeter gerundet — Gleitkommareste haben in einer Maßangabe nichts verloren. */
const aufMillimeter = (wert: number) => Math.round(wert * 1000) / 1000;

export const BODENVERSATZ_MIN = aufMillimeter(ROLLENACHSE_HOEHE - LAUFSCHIENE_OBERKANTE);
export const BODENVERSATZ_MAX = aufMillimeter(ROLLENACHSE_HOEHE - m('lichteHoehe'));
export const BODENVERSATZ = aufMillimeter(
  ROLLENACHSE_HOEHE - (m('lichteHoehe') + m('laufschieneProfilhoehe') / 2),
);

/** Garagendecke über der Torschließebene — für die Darstellung des Schnitts. */
export const DECKE_UEBER_TOREBENE = BODENVERSATZ + GARAGENHOEHE_AUS_SCHICHTEN;

/** Luft zwischen Toroberkante und Decke bei geschlossenem Tor. */
export const LUFT_TOR_ZU_DECKE = DECKE_UEBER_TOREBENE - m('torblattHoehe');

/** Tatsächlich zum Parken nutzbare Tiefe: Rohbaulänge minus Federzone minus Dämmung. */
export const NUTZBARE_TIEFE =
  m('gesamtlaengeGarage') - m('federwegTiefe') - m('styroporDicke');

/**
 * Toleranzschwellen. Der Messende hat die Unsicherheit selbst benannt: schiefe
 * Wände, schwer bestimmbare Bezugskanten, allein gemessen. Alles unterhalb von
 * 1,5 cm gilt deshalb als Messrauschen, oberhalb von 5 cm als echter
 * Widerspruch.
 */
const TOLERANZ_RAUSCHEN = 0.015;
const TOLERANZ_WIDERSPRUCH = 0.05;

export interface Befund {
  readonly id: string;
  readonly schwere: 'fehler' | 'warnung';
  readonly text: string;
}

/**
 * Prüft die Messwerte auf geometrische Konsistenz.
 *
 * Bewusst als Laufzeitprüfung und nicht nur als Testfall: Sobald in der UI
 * Werte verändert oder nachgemessen werden, sollen Widersprüche sofort sichtbar
 * werden, statt still ein unmögliches Modell zu rechnen.
 */
export function pruefeGeometrie(): Befund[] {
  const befunde: Befund[] = [];

  // OFFEN-02: Der Bodenversatz ist abgeleitet, nicht gemessen.
  if (BODENVERSATZ_MIN > 0) {
    befunde.push({
      id: 'OFFEN-02',
      schwere: 'warnung',
      text:
        `Der Garagenboden liegt um ${(BODENVERSATZ * 100).toFixed(1)} cm über der ` +
        'Torschließebene — abgeleitet, nicht gemessen. Der Wert legt die Laufrolle mittig ' +
        `in ihr Schienenprofil; zulässig ist alles zwischen ${(BODENVERSATZ_MIN * 100).toFixed(1)} ` +
        `und ${(BODENVERSATZ_MAX * 100).toFixed(1)} cm. Nachmessen: Höhenunterschied zwischen ` +
        'der Torschließebene und dem Garagenboden an der Stelle, an der die 2,17 m ' +
        'aufgenommen wurden.',
    });
  }

  // Gegenprobe: Torblatt und Schwenkarm müssen dieselbe Rollenachse ergeben.
  const rollenachseAbweichung = Math.abs(ROLLENACHSE_HOEHE - ROLLENACHSE_HOEHE_UEBER_ARM);
  if (rollenachseAbweichung > TOLERANZ_WIDERSPRUCH) {
    befunde.push({
      id: 'OFFEN-02',
      schwere: 'fehler',
      text:
        `Torblatt (${ROLLENACHSE_HOEHE.toFixed(3)} m) und Schwenkarm ` +
        `(${ROLLENACHSE_HOEHE_UEBER_ARM.toFixed(3)} m) ergeben unterschiedliche Höhen für die ` +
        'Laufrollenachse. Die beiden Messketten müssen zusammenpassen.',
    });
  }

  // OFFEN-01: Deckt sich die gemessene Schwenkarmlänge mit der geschlossenen Stellung?
  const armAbweichung = Math.abs(m('schwenkarmLaenge') - SCHWENKARM_LAENGE_ABGELEITET);
  if (armAbweichung > TOLERANZ_RAUSCHEN) {
    befunde.push({
      id: 'OFFEN-01',
      schwere: armAbweichung > TOLERANZ_WIDERSPRUCH ? 'fehler' : 'warnung',
      text:
        `Gemessene Schwenkarmlänge R = ${m('schwenkarmLaenge').toFixed(3)} m, aus der ` +
        `geschlossenen Torstellung folgt ${SCHWENKARM_LAENGE_ABGELEITET.toFixed(3)} m ` +
        `(Abweichung ${(armAbweichung * 100).toFixed(1)} cm). Als Messtoleranz akzeptiert; ` +
        'die Kinematik rechnet mit dem abgeleiteten Wert, damit das Tor bündig schließt.',
    });
  }

  // OFFEN-07: Summe der Teilstrecken gegen das durchgehend gemessene Gesamtmaß.
  const torblattAbweichung = Math.abs(m('torblattHoehe') - TORBLATT_HOEHE_SUMME);
  if (torblattAbweichung > 0.01) {
    befunde.push({
      id: 'OFFEN-07',
      schwere: torblattAbweichung > TOLERANZ_WIDERSPRUCH ? 'fehler' : 'warnung',
      text:
        `Torblatthöhe durchgehend gemessen ${m('torblattHoehe').toFixed(3)} m, als Summe der ` +
        `Teilstrecken ${TORBLATT_HOEHE_SUMME.toFixed(3)} m ` +
        `(Abweichung ${(torblattAbweichung * 1000).toFixed(0)} mm). Als Messtoleranz akzeptiert.`,
    });
  }

  // OFFEN-05: Schichtweise aufsummierte Garagenhöhe gegen das Gesamtmaß.
  const hoeheAbweichung = Math.abs(m('garagenhoehe') - GARAGENHOEHE_AUS_SCHICHTEN);
  if (hoeheAbweichung > TOLERANZ_RAUSCHEN) {
    befunde.push({
      id: 'OFFEN-05',
      schwere: hoeheAbweichung > TOLERANZ_WIDERSPRUCH ? 'fehler' : 'warnung',
      text:
        `Garagenhöhe gemessen ${m('garagenhoehe').toFixed(3)} m, aus lichter Höhe + ` +
        `Schienenprofil + Deckenabstand ergeben sich ${GARAGENHOEHE_AUS_SCHICHTEN.toFixed(3)} m ` +
        `(Abweichung ${(hoeheAbweichung * 1000).toFixed(0)} mm). Bewusst als Spielraum ` +
        'stehen gelassen — die Schichtkette gilt als die verlässlichere.',
    });
  }

  return befunde;
}
