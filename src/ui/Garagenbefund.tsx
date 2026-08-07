import { Fahrzeug } from '../domain/fahrzeuge';
import { Garagenbefund as GaragenbefundDaten, URTEIL_LABEL } from '../lib/garagenpruefung';

/**
 * Statische Passgenauigkeitsprüfung — unabhängig von der Torbewegung.
 *
 * Die Urteile stammen vollständig aus `pruefeGarage()`; hier wird nur gesetzt.
 * Eine nicht belegte Achse erscheint als „nicht prüfbar“ und nicht als bestanden.
 */

/** Zahl im deutschen Format, ohne „-0,00“. */
function zahl(v: number, stellen = 3): string {
  const bereinigt = Math.abs(v) < 0.5 * 10 ** -stellen ? 0 : v;
  return bereinigt.toFixed(stellen).replace('.', ',');
}

interface Props {
  befund: GaragenbefundDaten;
  fahrzeug: Fahrzeug;
  lichteHoehe: number;
}

export function Garagenbefund({ befund, fahrzeug, lichteHoehe }: Props) {
  return (
    <section>
      <h2 className="block-titel">Passt es hinein?</h2>
      <p className="block-hinweis">
        Statische Prüfung gegen die nachgemessene Garage — unabhängig von der
        Torbewegung. Die Vergleichsmatrix rechnete mit 5,10 m Länge, 2,19 m Höhe
        und 2,30 m Breite; hier gelten die tatsächlich gemessenen Werte.
      </p>

      {befund.achsen.map((a) => (
        <div
          className={`befund ${
            a.urteil === 'passt-nicht' ? 'fehler' : a.urteil === 'knapp' ? 'warnung' : 'geloest'
          }`}
          key={a.achse}
        >
          <div className="befund-kopf">
            <span>{a.bezeichnung}</span>
            <span>·</span>
            <span>{URTEIL_LABEL[a.urteil]}</span>
            {a.reserve !== undefined && (
              <>
                <span>·</span>
                <span>{zahl(a.reserve * 100, 1)} cm Reserve</span>
              </>
            )}
            {a.quellenstufe && (
              <>
                <span>·</span>
                <span title={a.quelle}>Quelle {a.quellenstufe}</span>
              </>
            )}
          </div>
          <p>
            Verfügbar {zahl(a.verfuegbar, 3)} m
            {a.benoetigt === undefined
              ? ', Fahrzeugmaß nicht belegt'
              : `, benötigt ${zahl(a.benoetigt, 3)} m`}
            . {a.anmerkung}
            {a.massBemerkung ? ` ${a.massBemerkung}` : ''}
          </p>
        </div>
      ))}

      {befund.heckklappeOeffenbar !== undefined && (
        <div className={`befund ${befund.heckklappeOeffenbar ? 'geloest' : 'fehler'}`}>
          <div className="befund-kopf">
            <span>Heckklappe</span>
            <span>·</span>
            <span>
              {befund.heckklappeOeffenbar ? 'lässt sich öffnen' : 'lässt sich nicht öffnen'}
            </span>
          </div>
          <p>
            Bei geöffneter Heckklappe braucht das Fahrzeug{' '}
            {zahl(fahrzeug.hoeheHeckOffen?.wert ?? 0, 3)} m, verfügbar sind{' '}
            {zahl(lichteHoehe, 3)} m unter der Laufschiene.
          </p>
        </div>
      )}
    </section>
  );
}
