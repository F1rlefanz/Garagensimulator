import { GarageConfig } from '../lib/kinematics';
import {
  AUSWAHL,
  Fahrzeug,
  istEditierbar,
  KATEGORIE_LABEL,
  Seitenprofil,
  STUFE_LABEL,
} from '../domain/fahrzeuge';
import { MESSWERTE, MesswertSchluessel } from '../domain/garage';

/**
 * Eingabefelder für Garage, Tor und Fahrzeug.
 *
 * Jedes Garagenfeld ist an einen Messwert aus `src/domain/garage.ts` gebunden
 * und zeigt dessen Symbol und Vertrauensgrad. Die Beschriftungen stammen aus dem
 * Domänenmodell — hier wird nichts doppelt gepflegt.
 */

/** Zahl im deutschen Format. */
function kommaZahl(v: number, stellen: number): string {
  return v.toFixed(stellen).replace('.', ',');
}

/** Kurzbeschriftung fürs Formular — die Langfassung steht als Tooltip. */
const KURZ: Partial<Record<MesswertSchluessel, string>> = {
  gesamtlaengeGarage: 'Rohbaulänge innen',
  federwegTiefe: 'Tiefe der Federzone',
  styroporDicke: 'Styropor-Dämmung',
  schmalsteStelleEinfahrt: 'Schmalste Stelle Einfahrt',
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
        {KURZ[schluessel] ?? schluessel}
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

/** Eine Zeile mit einem Maß aus dem Katalog, das nicht editierbar ist. */
function Katalogzeile({ label, wert, einheit = 'm' }: { label: string; wert?: number; einheit?: string }) {
  return (
    <div className="feld">
      <label>{label}</label>
      <div className="abgeleitet-wert">
        {wert === undefined ? 'nicht belegt' : `${kommaZahl(wert, 3)} ${einheit}`}
      </div>
    </div>
  );
}

interface EingabenProps {
  config: GarageConfig;
  fahrzeug: Fahrzeug;
  fahrzeugId: string;
  seitenprofil?: Seitenprofil;
  abstandRueckwand: number;
  maxAbstand: number;
  einfahrtBreite: number;
  onConfig: (key: keyof GarageConfig, wert: number) => void;
  onFahrzeug: (id: string) => void;
  onProfil: (feld: keyof Omit<Seitenprofil, 'quellenstufe'>, wert: number) => void;
  onAbstand: (wert: number) => void;
  onZuruecksetzen: () => void;
}

export function Eingaben({
  config,
  fahrzeug,
  fahrzeugId,
  seitenprofil,
  abstandRueckwand,
  maxAbstand,
  einfahrtBreite,
  onConfig,
  onFahrzeug,
  onProfil,
  onAbstand,
  onZuruecksetzen,
}: EingabenProps) {
  const editierbar = istEditierbar(fahrzeugId);

  // Nach Kategorie gruppieren, damit die Liste mit 30 Einträgen lesbar bleibt.
  const gruppen = new Map<string, Fahrzeug[]>();
  for (const f of AUSWAHL) {
    const schluessel = f.id === fahrzeugId && !editierbar ? f.kategorie : f.kategorie;
    const label = istEditierbar(f.id) ? 'Freie Eingabe' : KATEGORIE_LABEL[schluessel];
    if (!gruppen.has(label)) gruppen.set(label, []);
    gruppen.get(label)!.push(f);
  }

  const profilFelder: Array<[string, keyof Omit<Seitenprofil, 'quellenstufe'>]> = [
    ['Motorhaube Länge', 'haubenLaenge'],
    ['Motorhaube Höhe (Front)', 'haubenHoehe'],
    ['Windschutzscheibe waagerecht', 'scheibenLaenge'],
    ['Dachlänge', 'dachLaenge'],
  ];

  return (
    <section>
      <h2 className="block-titel">Eingaben</h2>
      <p className="block-hinweis">
        Alle Längen in Metern. Die Garagenmaße stammen aus{' '}
        <code>src/domain/garage.ts</code>, die Fahrzeugmaße aus dem Katalog in{' '}
        <code>src/domain/fahrzeuge.ts</code>. Änderungen hier gelten nur für die
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
        <Katalogzeile label="Schmalste Stelle der Einfahrt" wert={einfahrtBreite} />
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
            {[...gruppen].map(([label, liste]) => (
              <optgroup label={label} key={label}>
                {liste.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.bezeichnung}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="feld">
          <label htmlFor="feld-CAR_LENGTH">
            Fahrzeuglänge
            <span className="symbol">{fahrzeug.baujahre}</span>
          </label>
          <input
            id="feld-CAR_LENGTH"
            type="number"
            step={0.001}
            value={config.CAR_LENGTH}
            readOnly={!editierbar}
            onChange={(e) => onConfig('CAR_LENGTH', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="feld">
          <label htmlFor="feld-CAR_HEIGHT">
            Fahrzeughöhe
            <span className="symbol">ohne Dachreling</span>
          </label>
          <input
            id="feld-CAR_HEIGHT"
            type="number"
            step={0.001}
            value={config.CAR_HEIGHT}
            readOnly={!editierbar}
            onChange={(e) => onConfig('CAR_HEIGHT', parseFloat(e.target.value) || 0)}
          />
        </div>

        <Katalogzeile label="Breite ohne Spiegel" wert={fahrzeug.breiteOhneSpiegel} />
        <Katalogzeile label="Breite mit Spiegeln" wert={fahrzeug.breiteMitSpiegeln} />
        <Katalogzeile label="Höhe bei offener Heckklappe" wert={fahrzeug.hoeheHeckOffen} />
        <Katalogzeile label="Ladelänge" wert={fahrzeug.ladelaenge} />
        <Katalogzeile label="Innenhöhe Laderaum" wert={fahrzeug.innenhoeheLaderaum} />

        <div className="feld">
          <label htmlFor="feld-abstand">
            Abstand zur Rückwand
            <span className="symbol">
              {kommaZahl(abstandRueckwand, 2)} von max. {kommaZahl(maxAbstand, 2)} m
            </span>
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
          Quellenstufe {fahrzeug.quellenstufe} — {STUFE_LABEL[fahrzeug.quellenstufe]}.
          {fahrzeug.notiz ? ` ${fahrzeug.notiz}` : ''}
        </p>
      </div>

      <div className="gruppe">
        <h3 className="gruppe-titel">Seitenprofil</h3>
        {seitenprofil ? (
          <>
            {profilFelder.map(([label, feld]) => (
              <div className="feld" key={feld}>
                <label htmlFor={`profil-${feld}`}>{label}</label>
                <input
                  id={`profil-${feld}`}
                  type="number"
                  step={0.01}
                  value={seitenprofil[feld]}
                  readOnly={!editierbar}
                  onChange={(e) => onProfil(feld, parseFloat(e.target.value) || 0)}
                />
              </div>
            ))}
            <p className="block-hinweis" style={{ marginTop: 'var(--sp-2)' }}>
              Quellenstufe {seitenprofil.quellenstufe} — {STUFE_LABEL[seitenprofil.quellenstufe]}.
              Diese vier Maße stehen in keinem Datenblatt und bestimmen die
              Kollisionsprüfung unmittelbar.
            </p>
          </>
        ) : (
          <p className="block-hinweis">
            Für dieses Fahrzeug ist kein Seitenprofil belegt — es steht in keinem
            Datenblatt. Die Kollisionsprüfung rechnet deshalb mit einem Quader über
            die volle Fahrzeughöhe. Das ist die konservative Annahme: Die tatsächliche
            Front fällt flacher ab, das Tor hat in Wirklichkeit also mehr Luft.
          </p>
        )}
      </div>

      <button type="button" className="sekundaer" onClick={onZuruecksetzen}>
        Alles zurücksetzen
      </button>
    </section>
  );
}
