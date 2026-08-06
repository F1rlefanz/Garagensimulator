import { GarageConfig } from '../lib/kinematics';
import { AUSWAHL, DATENSTAND_LABEL, Fahrzeug, istEditierbar } from '../domain/fahrzeuge';
import { MESSWERTE, MesswertSchluessel } from '../domain/garage';

/**
 * Eingabefelder für Garage, Tor und Fahrzeug.
 *
 * Jedes Feld ist an einen Messwert aus `src/domain/garage.ts` gebunden und zeigt
 * dessen Symbol und Vertrauensgrad. Die Beschriftungen stammen aus dem
 * Domänenmodell — hier wird nichts doppelt gepflegt.
 */

interface FeldProps {
  schluessel: MesswertSchluessel;
  configKey: keyof GarageConfig;
  config: GarageConfig;
  schritt?: number;
  onChange: (key: keyof GarageConfig, wert: number) => void;
}

function Feld({ schluessel, configKey, config, schritt = 0.005, onChange }: FeldProps) {
  const mw = MESSWERTE[schluessel];
  const marke =
    mw.vertrauen === 'widerspruechlich' ? (
      <span className="marke strittig" title={mw.beschreibung}>strittig</span>
    ) : mw.vertrauen === 'geschaetzt' ? (
      <span className="marke offen" title={mw.beschreibung}>ungemessen</span>
    ) : null;

  return (
    <div className="feld">
      <label htmlFor={`feld-${configKey}`}>
        {kurzName(schluessel)}
        <span className="symbol">{mw.symbol}</span>
        {marke}
      </label>
      <input
        id={`feld-${configKey}`}
        type="number"
        step={schritt}
        value={config[configKey]}
        onChange={(e) => onChange(configKey, parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

/** Kurzbeschriftung fürs Formular — die Langfassung steht als Tooltip am Messwert. */
const KURZ: Partial<Record<MesswertSchluessel, string>> = {
  gesamtlaengeGarage: 'Rohbaulänge innen',
  federwegTiefe: 'Tiefe der Federzone',
  styroporDicke: 'Styropor-Dämmung',
  garagenhoehe: 'Innenhöhe Boden–Decke',
  lichteHoehe: 'Lichte Durchfahrtshöhe',
  laufschieneProfilhoehe: 'Bauhöhe Schienenprofil',
  laufschienenLaenge: 'Nutzbare Schienenlänge',
  rolleZuAnlenkpunkt: 'Anlenkpunkt P → Rolle T',
  anlenkpunktZuUnterkante: 'Unterkante B → Anlenkpunkt P',
  rolleZuOberkante: 'Oberkante O → Rolle T',
  lagerbolzenHoehe: 'Höhe Festlager A',
  lagerbolzenTiefe: 'Tiefenversatz Festlager A',
  lagerbolzenZuFederpunkt: 'Lagerbolzen A → Federpunkt F',
};

function kurzName(schluessel: MesswertSchluessel): string {
  return KURZ[schluessel] ?? schluessel;
}

/** Zahl im deutschen Format. */
function kommaZahl(v: number, stellen: number): string {
  return v.toFixed(stellen).replace('.', ',');
}

interface EingabenProps {
  config: GarageConfig;
  fahrzeug: Fahrzeug;
  fahrzeugId: string;
  abstandRueckwand: number;
  maxAbstand: number;
  onConfig: (key: keyof GarageConfig, wert: number) => void;
  onFahrzeug: (id: string) => void;
  onAbstand: (wert: number) => void;
  onZuruecksetzen: () => void;
}

export function Eingaben({
  config,
  fahrzeug,
  fahrzeugId,
  abstandRueckwand,
  maxAbstand,
  onConfig,
  onFahrzeug,
  onAbstand,
  onZuruecksetzen,
}: EingabenProps) {
  const editierbar = istEditierbar(fahrzeugId);

  const fahrzeugFelder: Array<[string, keyof GarageConfig]> = [
    ['Fahrzeuglänge', 'CAR_LENGTH'],
    ['Fahrzeughöhe', 'CAR_HEIGHT'],
    ['Motorhaube Länge', 'CAR_HOOD_LENGTH'],
    ['Motorhaube Höhe (Front)', 'CAR_HOOD_HEIGHT'],
    ['Dachlänge', 'CAR_ROOF_LENGTH'],
  ];

  return (
    <section>
      <h2 className="block-titel">Eingaben</h2>
      <p className="block-hinweis">
        Alle Längen in Metern. Die Ausgangswerte stammen aus{' '}
        <code>src/domain/garage.ts</code>; Änderungen hier gelten nur für die
        laufende Sitzung.
      </p>

      <div className="gruppe">
        <h3 className="gruppe-titel">Garage</h3>
        <Feld schluessel="gesamtlaengeGarage" configKey="DEPTH_G" config={config} schritt={0.01} onChange={onConfig} />
        <Feld schluessel="federwegTiefe" configKey="SPRING_DEPTH" config={config} onChange={onConfig} />
        <Feld schluessel="styroporDicke" configKey="STYROFOAM_THICKNESS" config={config} onChange={onConfig} />
        <div className="feld">
          <label htmlFor="feld-FLOOR_OFFSET">
            Garagenboden über Torschließebene
            <span className="marke offen" title="Aus der Zwangsbedingung abgeleitet, nicht gemessen">abgeleitet</span>
          </label>
          <input
            id="feld-FLOOR_OFFSET"
            type="number"
            step={0.005}
            value={config.FLOOR_OFFSET}
            onChange={(e) => onConfig('FLOOR_OFFSET', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="feld">
          <label htmlFor="feld-GARAGE_HEIGHT">
            Decke über Torschließebene
            <span className="symbol">
              = Garagenboden + {kommaZahl(config.GARAGE_HEIGHT - config.FLOOR_OFFSET, 2)} m
            </span>
          </label>
          <input
            id="feld-GARAGE_HEIGHT"
            type="number"
            step={0.01}
            value={config.GARAGE_HEIGHT}
            onChange={(e) => onConfig('GARAGE_HEIGHT', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="gruppe">
        <h3 className="gruppe-titel">Laufschiene</h3>
        <Feld schluessel="lichteHoehe" configKey="CLEAR_HEIGHT" config={config} schritt={0.01} onChange={onConfig} />
        <Feld schluessel="laufschieneProfilhoehe" configKey="RAIL_PROFILE" config={config} schritt={0.001} onChange={onConfig} />
        <Feld schluessel="laufschienenLaenge" configKey="RAIL_LENGTH" config={config} schritt={0.01} onChange={onConfig} />
      </div>

      <div className="gruppe">
        <h3 className="gruppe-titel">Torblatt und Mechanik</h3>
        <Feld schluessel="rolleZuAnlenkpunkt" configKey="D_TP" config={config} schritt={0.01} onChange={onConfig} />
        <Feld schluessel="anlenkpunktZuUnterkante" configKey="D_PB" config={config} schritt={0.001} onChange={onConfig} />
        <Feld schluessel="rolleZuOberkante" configKey="D_TTOP" config={config} schritt={0.001} onChange={onConfig} />
        <Feld schluessel="lagerbolzenHoehe" configKey="Y_A" config={config} schritt={0.01} onChange={onConfig} />
        <Feld schluessel="lagerbolzenTiefe" configKey="X_A" config={config} onChange={onConfig} />
        <Feld schluessel="lagerbolzenZuFederpunkt" configKey="D_AF" config={config} schritt={0.001} onChange={onConfig} />
        <div className="feld">
          <label htmlFor="feld-Y_RAIL">
            Höhe der Laufrollenachse
            <span className="marke offen" title="Aus dem Torblatt abgeleitet">abgeleitet</span>
          </label>
          <input
            id="feld-Y_RAIL"
            type="number"
            step={0.005}
            value={config.Y_RAIL}
            onChange={(e) => onConfig('Y_RAIL', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="gruppe">
        <h3 className="gruppe-titel">Fahrzeug</h3>
        <div className="feld">
          <label htmlFor="fahrzeug-auswahl">Modell</label>
          <select id="fahrzeug-auswahl" value={fahrzeugId} onChange={(e) => onFahrzeug(e.target.value)}>
            {AUSWAHL.map((f) => (
              <option key={f.id} value={f.id}>
                {f.bezeichnung}
              </option>
            ))}
          </select>
        </div>

        {fahrzeugFelder.map(([label, key]) => (
          <div className="feld" key={key}>
            <label htmlFor={`feld-${key}`}>{label}</label>
            <input
              id={`feld-${key}`}
              type="number"
              step={0.001}
              value={config[key]}
              readOnly={!editierbar}
              onChange={(e) => onConfig(key, parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}

        <div className="feld">
          <label htmlFor="feld-abstand">
            Abstand zur Rückwand
            <span className="symbol">{kommaZahl(abstandRueckwand, 2)} von max. {kommaZahl(maxAbstand, 2)} m</span>
          </label>
          <input
            id="feld-abstand"
            type="range"
            min={0}
            max={maxAbstand}
            step={0.01}
            value={abstandRueckwand}
            onChange={(e) => onAbstand(parseFloat(e.target.value))}
          />
        </div>

        <p className="block-hinweis" style={{ marginTop: 'var(--sp-2)' }}>
          {editierbar
            ? 'Freie Eingabe — alle Fahrzeugmaße sind veränderbar.'
            : `Außenmaße ${DATENSTAND_LABEL[fahrzeug.datenstand]}, Seitenprofil ${DATENSTAND_LABEL[fahrzeug.profilDatenstand]}. Für eigene Maße „Individuell" wählen.`}
          {fahrzeug.breiteMitSpiegeln !== undefined && (
            <>
              {' '}
              Breite {kommaZahl(fahrzeug.breiteOhneSpiegel ?? 0, 3)} m ohne,{' '}
              {kommaZahl(fahrzeug.breiteMitSpiegeln, 2)} m mit Spiegeln — die schmalste Stelle der
              Einfahrt misst {kommaZahl(MESSWERTE.schmalsteStelleEinfahrt.wert, 2)} m, es bleiben{' '}
              {kommaZahl(
                (MESSWERTE.schmalsteStelleEinfahrt.wert - fahrzeug.breiteMitSpiegeln) * 100,
                1,
              )}{' '}
              cm.
            </>
          )}
        </p>
      </div>

      <button type="button" className="sekundaer" onClick={onZuruecksetzen}>
        Messwerte zurücksetzen
      </button>
    </section>
  );
}
