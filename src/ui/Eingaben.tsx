import { GarageConfig } from '../lib/kinematics';
import {
  AUSWAHL,
  belegteMasse,
  Fahrzeug,
  Fahrzeugmass,
  istEditierbar,
  KATEGORIE_LABEL,
  MARKTSTATUS_LABEL,
  marktstatus,
  Massfeld,
  MASSFELD_LABEL,
  MASSFELDER,
  pruefhoehe,
  schwaechsteQuellenstufe,
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
 *
 * Der Riss steht zwischen den beiden Eingabespalten, deshalb sind die Eingaben
 * auf zwei Komponenten verteilt: links alles, was am Bauwerk hängt, rechts
 * alles, was am Fahrzeug hängt. Beide teilen sich die Hilfskomponenten unten.
 */

/**
 * Maße, die unter Länge und Höhe aufgelistet werden. Die Reihenfolge ist die
 * des Domänenmodells, damit Liste und Datei dieselbe Ordnung haben.
 */
const LISTENMASSE: readonly Massfeld[] = MASSFELDER.filter(
  (feld) => feld !== 'laenge' && feld !== 'hoehe' && feld !== 'hoeheMitDachreling',
);

/** Was sich bei der freien Eingabe von Hand setzen lässt. */
const EDITIERBARE_MASSE: readonly Massfeld[] = [
  'breiteOhneSpiegel',
  'breiteMitSpiegeln',
  'hoeheHeckOffen',
];

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

/**
 * Belegmarke am Maß: Quellenstufe als Kürzel, der volle Beleg im Tooltip.
 *
 * Die Stufe steht am einzelnen Maß und nicht am Fahrzeug — ein Eintrag kann
 * eine herstellerbelegte Länge und eine Heckklappenhöhe aus dem Forum tragen.
 */
function Belegmarke({ mass }: { mass: Fahrzeugmass }) {
  const titel = [
    `Quellenstufe ${mass.quellenstufe} — ${STUFE_LABEL[mass.quellenstufe]}`,
    mass.quelle,
    `abgerufen am ${mass.abgerufenAm}`,
    mass.bemerkung,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <span className={`marke stufe stufe-${mass.quellenstufe.toLowerCase()}`} title={titel}>
      {mass.quellenstufe}
    </span>
  );
}

/**
 * Eine nicht editierbare Zeile. Entweder ein belegtes Fahrzeugmaß samt
 * Belegmarke, oder — für Garagenmaße, die keinen Fahrzeugbeleg haben — eine
 * nackte Zahl.
 */
function Katalogzeile({
  label,
  mass,
  wert,
  feldId,
  onChange,
}: {
  label: string;
  mass?: Fahrzeugmass;
  wert?: number;
  feldId?: string;
  /** Gesetzt nur bei der freien Eingabe — dann wird die Zeile zum Eingabefeld. */
  onChange?: (wert: number) => void;
}) {
  const anzeige = mass?.wert ?? wert;

  return (
    <div className="feld">
      <label htmlFor={onChange ? feldId : undefined}>
        {label}
        {mass && <Belegmarke mass={mass} />}
      </label>
      {onChange ? (
        <input
          id={feldId}
          type="number"
          step={0.001}
          value={anzeige ?? ''}
          placeholder="nicht belegt"
          onChange={(e) => {
            const zahl = parseFloat(e.target.value);
            if (!Number.isNaN(zahl)) onChange(zahl);
          }}
        />
      ) : (
        <div className="abgeleitet-wert">
          {anzeige === undefined ? 'nicht belegt' : `${kommaZahl(anzeige, 3)} m`}
        </div>
      )}
    </div>
  );
}

interface EingabenGarageProps {
  config: GarageConfig;
  einfahrtBreite: number;
  onConfig: (key: keyof GarageConfig, wert: number) => void;
  onZuruecksetzen: () => void;
}

/** Linke Spalte: Garage, Laufschiene, Torblatt und Mechanik. */
export function EingabenGarage({
  config,
  einfahrtBreite,
  onConfig,
  onZuruecksetzen,
}: EingabenGarageProps) {
  return (
    <section className="spalte">
      <h2 className="block-titel">Eingaben · Garage</h2>
      <p className="block-hinweis">
        Alle Längen in Metern. Die Maße stammen aus <code>src/domain/garage.ts</code>.
        Änderungen hier gelten nur für die laufende Sitzung.
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

      <button type="button" className="sekundaer" onClick={onZuruecksetzen}>
        Alles zurücksetzen
      </button>
    </section>
  );
}

interface EingabenFahrzeugProps {
  config: GarageConfig;
  fahrzeug: Fahrzeug;
  fahrzeugId: string;
  seitenprofil?: Seitenprofil;
  abstandRueckwand: number;
  maxAbstand: number;
  /** Bereits gefilterte Auswahlliste — die Filterlogik liegt in App.tsx. */
  auswahl: readonly Fahrzeug[];
  nurPassende: boolean;
  nurNeue: boolean;
  onConfig: (key: keyof GarageConfig, wert: number) => void;
  onFahrzeug: (id: string) => void;
  onProfil: (feld: keyof Omit<Seitenprofil, 'quellenstufe'>, wert: number) => void;
  onAbstand: (wert: number) => void;
  onNurPassende: (an: boolean) => void;
  onNurNeue: (an: boolean) => void;
  /** Setzt ein einzelnes Maß der freien Eingabe. */
  onIndividuellMass: (feld: Massfeld, wert: number) => void;
}

/** Rechte Spalte: Modellauswahl, Fahrzeugmaße, Seitenprofil. */
export function EingabenFahrzeug({
  config,
  fahrzeug,
  fahrzeugId,
  seitenprofil,
  abstandRueckwand,
  maxAbstand,
  auswahl,
  nurPassende,
  nurNeue,
  onConfig,
  onFahrzeug,
  onProfil,
  onAbstand,
  onNurPassende,
  onNurNeue,
  onIndividuellMass,
}: EingabenFahrzeugProps) {
  const editierbar = istEditierbar(fahrzeugId);
  // Die Höhe, gegen die tatsächlich geprüft wird — mit Dachreling, wo belegt.
  const hoeheFuerPruefung = pruefhoehe(fahrzeug);
  // Länge und Höhe stehen oben als eigene Felder, alles Übrige wird gelistet.
  // Bei der freien Eingabe werden auch unbelegte Zeilen gezeigt, damit sich das
  // Maß eintragen lässt; beim Katalogfahrzeug nur, was belegt ist — plus die
  // Heckklappenhöhe, deren Fehlen eine Aussage ist.
  const belegt = new Set(belegteMasse(fahrzeug).map(([feld]) => feld));
  const sichtbareMasse = LISTENMASSE.filter(
    (feld) => belegt.has(feld) || editierbar || feld === 'hoeheHeckOffen',
  );

  // Nach Kategorie gruppieren, damit die Liste lesbar bleibt.
  const gruppen = new Map<string, Fahrzeug[]>();
  for (const f of auswahl) {
    const label = istEditierbar(f.id) ? 'Freie Eingabe' : KATEGORIE_LABEL[f.kategorie];
    if (!gruppen.has(label)) gruppen.set(label, []);
    gruppen.get(label)!.push(f);
  }
  const ausgeblendet = AUSWAHL.length - auswahl.length;

  const profilFelder: Array<[string, keyof Omit<Seitenprofil, 'quellenstufe'>]> = [
    ['Motorhaube Länge', 'haubenLaenge'],
    ['Motorhaube Höhe (Front)', 'haubenHoehe'],
    ['Windschutzscheibe waagerecht', 'scheibenLaenge'],
    ['Dachlänge', 'dachLaenge'],
  ];

  return (
    <section className="spalte">
      <h2 className="block-titel">Eingaben · Fahrzeug</h2>
      <p className="block-hinweis">
        Katalogmaße stammen aus <code>src/domain/fahrzeuge.ts</code> und sind
        gesperrt. Frei editierbar ist nur der Eintrag „Individuell“.
      </p>

      <div className="gruppe">
        <h3 className="gruppe-titel">Modell</h3>
        <div className="feld feld-breit">
          <label htmlFor="fahrzeug-auswahl">Modell</label>
          <select id="fahrzeug-auswahl" value={fahrzeugId} onChange={(e) => onFahrzeug(e.target.value)}>
            {[...gruppen].map(([label, liste]) => (
              <optgroup label={label} key={label}>
                {liste.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.bezeichnung}
                    {marktstatus(f) === 'neu' ? '' : ` · ${MARKTSTATUS_LABEL[marktstatus(f)]}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Mit wachsendem Katalog ist die ungefilterte Liste unbrauchbar. Die
            Filter blenden aus, sie löschen nichts — die Zahl der verborgenen
            Einträge steht daneben, damit niemand glaubt, das sei alles. */}
        <div className="schalter schalter-filter">
          <label>
            <input
              type="checkbox"
              checked={nurPassende}
              onChange={(e) => onNurPassende(e.target.checked)}
            />
            Ausblenden, was nachweislich nicht passt
          </label>
          <label>
            <input type="checkbox" checked={nurNeue} onChange={(e) => onNurNeue(e.target.checked)} />
            Nur 2026 neu bestellbare
          </label>
        </div>
        <p className="block-hinweis quellenzeile">
          Einträge ohne belegte Breite bleiben sichtbar — was fehlt, soll fehlen dürfen.{' '}
          {auswahl.length} von {AUSWAHL.length} Einträgen sichtbar
          {ausgeblendet > 0 ? `, ${ausgeblendet} ausgeblendet` : ''}. Der Marktstatus hängt an
          Abgasnorm und Assistenzpflicht, nicht am Alter — siehe{' '}
          <code>docs/06-marktrelevanz.md</code>.
        </p>
      </div>

      <div className="gruppe">
        <h3 className="gruppe-titel">Maße</h3>
        <div className="feld">
          <label htmlFor="feld-CAR_LENGTH">
            Fahrzeuglänge
            <span className="symbol">{fahrzeug.baujahre}</span>
            <Belegmarke mass={fahrzeug.laenge} />
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
            <span className="symbol">
              {fahrzeug.hoeheMitDachreling ? 'mit Dachreling' : 'ohne Dachreling'}
            </span>
            <Belegmarke mass={hoeheFuerPruefung} />
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

        {/* Trägt das Fahrzeug eine Dachreling, steht oben deren Höhe — die
            relingfreie Zeile bleibt daneben sichtbar, sonst sähe es aus, als
            gäbe es sie nicht. */}
        {fahrzeug.hoeheMitDachreling && (
          <Katalogzeile label={MASSFELD_LABEL.hoehe} mass={fahrzeug.hoehe} />
        )}

        {/* Alle übrigen belegten Maße. Was fehlt, fehlt sichtbar — die Zeile
            steht trotzdem da, damit die Lücke nicht unter den Tisch fällt. */}
        {sichtbareMasse.map((feld) => (
          <Katalogzeile
            key={feld}
            label={MASSFELD_LABEL[feld]}
            mass={fahrzeug[feld]}
            feldId={`feld-${feld}`}
            onChange={
              editierbar && EDITIERBARE_MASSE.includes(feld)
                ? (wert) => onIndividuellMass(feld, wert)
                : undefined
            }
          />
        ))}

        <div className="feld feld-breit">
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

        <p className="block-hinweis quellenzeile">
          Schwächste Quellenstufe dieses Eintrags: {schwaechsteQuellenstufe(fahrzeug)} —{' '}
          {STUFE_LABEL[schwaechsteQuellenstufe(fahrzeug)]}. Die Stufe je Maß steht als Kürzel an der
          Zeile, Beleg und Abrufdatum im Tooltip.
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
            <p className="block-hinweis quellenzeile">
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
    </section>
  );
}
