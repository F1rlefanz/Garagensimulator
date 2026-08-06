import { Befund } from '../domain/garage';

/**
 * Meldungen aus `pruefeGeometrie()`.
 *
 * Die Texte kommen vollständig aus dem Domänenmodell — hier wird nichts
 * nachformuliert, sonst driften Laufzeitmeldung und Anzeige auseinander.
 */

const SCHWERE_LABEL: Record<Befund['schwere'], string> = {
  fehler: 'Fehler',
  warnung: 'Warnung',
};

export function Befunde({ befunde }: { befunde: readonly Befund[] }) {
  const fehler = befunde.filter((b) => b.schwere === 'fehler').length;

  return (
    <section>
      <h2 className="block-titel">Befunde</h2>
      <p className="block-hinweis">
        Geometrische Gegenproben, die das Modell bei jeder Änderung selbst rechnet.
        Nicht geglättet: Ein zurechtgebogener Messwert würde eine falsche
        Einpark-Aussage nur besser aussehen lassen.
      </p>

      {befunde.length === 0 && (
        <div className="befund geloest">
          <div className="befund-kopf">
            <span>Alles stimmig</span>
          </div>
          <p>Keine der Gegenproben schlägt an.</p>
        </div>
      )}

      {fehler === 0 && befunde.length > 0 && (
        <div className="befund geloest">
          <div className="befund-kopf">
            <span>Kein harter Widerspruch</span>
          </div>
          <p>
            Alle Abweichungen liegen im Bereich der Messunsicherheit. Sie werden
            unten genannt, damit sie sichtbar bleiben, nicht weil das Modell
            unbrauchbar wäre.
          </p>
        </div>
      )}

      {befunde.map((b) => (
        <div className={`befund ${b.schwere}`} key={b.id + b.text.slice(0, 24)}>
          <div className="befund-kopf">
            <span>{b.id}</span>
            <span>·</span>
            <span>{SCHWERE_LABEL[b.schwere]}</span>
          </div>
          <p>{b.text}</p>
        </div>
      ))}
    </section>
  );
}
