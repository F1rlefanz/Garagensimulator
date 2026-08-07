import { useEffect, useMemo, useRef, useState } from 'react';

import {
  calculateKinematics,
  DEFAULT_CONFIG,
  GarageConfig,
  hoehenreserve,
  maximalerOeffnungswinkel,
  maximalerUeberstand,
  nutzbareTiefe,
} from './lib/kinematics';
import {
  fahrzeugFront,
  fahrzeugKontur,
  liegtInnerhalb,
  maximalerParkabstand,
} from './lib/fahrzeuggeometrie';
import {
  AUSWAHL,
  Fahrzeug,
  fahrzeugNachId,
  INDIVIDUELL,
  istEditierbar,
  Massfeld,
  pruefhoehe,
  REFERENZ_FAHRZEUG,
  Seitenprofil,
} from './domain/fahrzeuge';
import { m, pruefeGeometrie } from './domain/garage';
import { pruefeGarage, URTEIL_LABEL } from './lib/garagenpruefung';
import { filtereAuswahl } from './lib/fahrzeugfilter';
import { Befunde } from './ui/Befunde';
import { EingabenFahrzeug, EingabenGarage } from './ui/Eingaben';
import { Garagenbefund } from './ui/Garagenbefund';
import { Riss } from './ui/Riss';
import { Seitenpanel, StatusLeiste } from './ui/Seitenpanel';

const GRAD_PRO_SEKUNDE = 34;

/** Zahl im deutschen Format, ohne „-0,00“. */
function zahl(v: number, stellen = 3): string {
  const bereinigt = Math.abs(v) < 0.5 * 10 ** -stellen ? 0 : v;
  return bereinigt.toFixed(stellen).replace('.', ',');
}

/**
 * Beleg für ein Maß, das gerade in der Oberfläche eingetippt wurde.
 *
 * Stufe D ist hier keine Abwertung, sondern die Wahrheit: Eine Zahl aus einem
 * Eingabefeld ist durch nichts gedeckt außer der Absicht dessen, der sie
 * eingetippt hat.
 */
const EINGEGEBEN = {
  quellenstufe: 'D' as const,
  quelle: 'in der Oberfläche eingegeben',
  abgerufenAm: '—',
};

export default function App() {
  // Nur die Garagen- und Tormaße. Die Fahrzeugmaße stehen NICHT hier, sondern
  // am Fahrzeug — sonst urteilt die Prüfung über ein anderes Fahrzeug als das
  // gezeichnete, und genau das ist lange unbemerkt passiert.
  const [basisConfig, setBasisConfig] = useState<GarageConfig>(DEFAULT_CONFIG);
  const [individuell, setIndividuell] = useState<Fahrzeug>(INDIVIDUELL);
  const [fahrzeugId, setFahrzeugId] = useState(REFERENZ_FAHRZEUG.id);
  const [seitenprofil, setSeitenprofil] = useState<Seitenprofil | undefined>(
    REFERENZ_FAHRZEUG.seitenprofil,
  );
  const [winkel, setWinkel] = useState(0);
  const [laeuft, setLaeuft] = useState(false);
  const [abstandRueckwand, setAbstandRueckwand] = useState(0);
  const [zeigeFahrzeug, setZeigeFahrzeug] = useState(true);
  const [zeigeKonstruktion, setZeigeKonstruktion] = useState(true);
  const [rueckwaerts, setRueckwaerts] = useState(true);
  const [panelOffen, setPanelOffen] = useState(false);
  const [nurPassende, setNurPassende] = useState(false);
  const [nurNeue, setNurNeue] = useState(false);

  // Für die freie Eingabe gilt der bearbeitete Stand, nicht der Katalogeintrag
  // mit seinen Startwerten.
  const fahrzeug = istEditierbar(fahrzeugId)
    ? individuell
    : (fahrzeugNachId(fahrzeugId) ?? REFERENZ_FAHRZEUG);

  // Die Fahrzeugmaße der Szene werden aus dem Fahrzeug abgeleitet, nicht
  // parallel gepflegt. Damit zeichnen Riss und Kollisionsprüfung dasselbe
  // Fahrzeug, über das pruefeGarage() urteilt.
  const config: GarageConfig = useMemo(
    () => ({
      ...basisConfig,
      CAR_LENGTH: fahrzeug.laenge.wert,
      CAR_HEIGHT: pruefhoehe(fahrzeug).wert,
    }),
    [basisConfig, fahrzeug],
  );

  // Der Schwenkarm begrenzt den Öffnungsweg — kein fest gesetzter Wert.
  const maxWinkel = maximalerOeffnungswinkel(config);
  const scheitel = useMemo(() => maximalerUeberstand(config), [config]);
  const befunde = useMemo(() => pruefeGeometrie(), []);

  const maxAbstand = maximalerParkabstand(config);
  const kontur = fahrzeugKontur(config, {
    rueckwaerts,
    abstandRueckwand: Math.min(abstandRueckwand, maxAbstand),
    seitenprofil,
  });

  const einfahrtBreite = m('schmalsteStelleEinfahrt');
  const garagenbefund = pruefeGarage(fahrzeug, config, einfahrtBreite);

  // Gefilterte Auswahlliste. Die Logik liegt in src/lib/fahrzeugfilter.ts,
  // damit sie prüfbar ist.
  const auswahl = useMemo(
    () => filtereAuswahl(AUSWAHL, { nurPassende, nurNeue }, fahrzeugId, config, einfahrtBreite),
    [fahrzeugId, nurNeue, nurPassende, config, einfahrtBreite],
  );

  const k = calculateKinematics(Math.min(winkel, maxWinkel), config);
  // Geprüft wird bislang nur die Torunterkante B gegen die Fahrzeugkontur —
  // Torblatt und Schwenkarme fehlen noch, siehe docs/04-roadmap.md.
  //
  // Die Prüfung hängt NICHT am Schalter „Fahrzeug einblenden": Der blendet die
  // Zeichnung aus, nicht das Fahrzeug aus der Garage. Vorher meldete die Kachel
  // bei ausgeblendetem Fahrzeug grün „keine Kollision", während die
  // Torunterkante durch die Kontur fuhr.
  const kollision = liegtInnerhalb(k.xB, k.yB, kontur);

  const letzterRahmen = useRef(0);
  const richtung = useRef(1);

  useEffect(() => {
    if (!laeuft) return;
    let handle = 0;
    letzterRahmen.current = 0;

    const rahmen = (t: number) => {
      const dt = letzterRahmen.current ? Math.min((t - letzterRahmen.current) / 1000, 0.1) : 0;
      letzterRahmen.current = t;
      setWinkel((vorher) => {
        let neu = vorher + richtung.current * dt * GRAD_PRO_SEKUNDE;
        if (neu >= maxWinkel) {
          neu = maxWinkel;
          richtung.current = -1;
        }
        if (neu <= 0) {
          neu = 0;
          richtung.current = 1;
        }
        return neu;
      });
      handle = requestAnimationFrame(rahmen);
    };

    handle = requestAnimationFrame(rahmen);
    return () => cancelAnimationFrame(handle);
  }, [laeuft, maxWinkel]);

  /**
   * Eingaben aus den Formularfeldern.
   *
   * Länge und Höhe gehören zum Fahrzeug, alles Übrige zur Garage. Die beiden
   * Fahrzeugfelder sind nur für die freie Eingabe entsperrt; bei einem
   * Katalogfahrzeug läuft der Aufruf ins Leere, statt still eine zweite
   * Wahrheit anzulegen.
   */
  const handleConfig = (key: keyof GarageConfig, wert: number) => {
    if (key === 'CAR_LENGTH' || key === 'CAR_HEIGHT') {
      if (!istEditierbar(fahrzeugId)) return;
      handleIndividuellMass(key === 'CAR_LENGTH' ? 'laenge' : 'hoehe', wert);
      return;
    }
    setBasisConfig((vorher) => ({ ...vorher, [key]: wert }));
  };

  /** Ein einzelnes Maß der freien Eingabe setzen. */
  const handleIndividuellMass = (feld: Massfeld, wert: number) =>
    setIndividuell((vorher) => ({
      ...vorher,
      // Die Höhe der freien Eingabe ist die geprüfte Höhe. Ein zusätzliches
      // Relingmaß würde sie stillschweigend überstimmen.
      ...(feld === 'hoehe' ? { hoeheMitDachreling: undefined } : {}),
      [feld]: { wert, ...EINGEGEBEN },
    }));

  // Katalogfahrzeuge sind fest hinterlegt und gesperrt. Nur 'Individuell'
  // bleibt frei editierbar.
  const handleFahrzeug = (id: string) => {
    setFahrzeugId(id);
    const f = fahrzeugNachId(id);
    if (!f) return;
    setSeitenprofil(f.seitenprofil);
  };

  const handleProfil = (feld: keyof Omit<Seitenprofil, 'quellenstufe'>, wert: number) =>
    setSeitenprofil((vorher) => (vorher ? { ...vorher, [feld]: wert } : vorher));

  const anhalten = () => {
    setLaeuft(false);
    letzterRahmen.current = 0;
  };

  const reserve = hoehenreserve(config);
  const ablesungen: Array<[string, string, string, string?]> = [
    ['Torunterkante x', zahl(k.xB, 3), 'm'],
    ['Torunterkante y', zahl(k.yB, 3), 'm'],
    ['Überstand Vorplatz', zahl(Math.max(0, -k.xB), 3), 'm'],
    ['Laufrolle x', zahl(k.xT, 3), 'm'],
    ['Höhenreserve', zahl(reserve, 3), 'm', reserve < 0 ? 'schlecht' : 'gut'],
    ['Nutzbare Tiefe', zahl(nutzbareTiefe(config), 3), 'm'],
  ];

  return (
    <>
      <div className="blatt">
        <div className="innenrahmen">
          <header className="schriftkopf">
            <div>
              <p className="eyebrow">Bestandsgarage · Schnitt A–A · Seitenansicht</p>
              <h1>
                Vorstehendes
                <br />
                Schwingtor
              </h1>
            </div>
            <div className="kopf-daten">
              <span>Maße</span>
              <b>Nachmessung 06.08.2026</b>
              <span>Bezug</span>
              <b>(0,0) = Torschließebene</b>
              <span>Modell</span>
              <b>2D-Kinematik, θ = 0° zu</b>
              <span>Fahrzeug</span>
              <b>{fahrzeug.bezeichnung}</b>
            </div>
          </header>

          <div className="arbeitsflaeche">
            <div className="zone-links">
              <EingabenGarage
                config={config}
                einfahrtBreite={einfahrtBreite}
                onConfig={handleConfig}
                onZuruecksetzen={() => {
                  setBasisConfig(DEFAULT_CONFIG);
                  setIndividuell(INDIVIDUELL);
                  handleFahrzeug(REFERENZ_FAHRZEUG.id);
                  setAbstandRueckwand(0);
                  setWinkel(0);
                  anhalten();
                }}
              />
            </div>

            <div className="zone-mitte">
              <div className="zeichnung-rahmen">
                <Riss
                  config={config}
                  winkelGrad={winkel}
                  maxWinkel={maxWinkel}
                  fahrzeug={fahrzeug}
                  zeigeFahrzeug={zeigeFahrzeug}
                  zeigeKonstruktion={zeigeKonstruktion}
                  rueckwaerts={rueckwaerts}
                  fahrzeugKontur={kontur as Array<[number, number]>}
                  kollision={kollision}
                />
              </div>

              <div className="bedienung">
                <div className="scrubber">
                  <div className="scrubber-kopf">
                    <span>Toröffnung θ</span>
                    <span>
                      <b>{zahl(Math.min(winkel, maxWinkel), 1)}°</b> von {zahl(maxWinkel, 1)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxWinkel}
                    step={0.1}
                    value={Math.min(winkel, maxWinkel)}
                    aria-label="Toröffnungswinkel in Grad"
                    onChange={(e) => {
                      anhalten();
                      setWinkel(parseFloat(e.target.value));
                    }}
                  />
                </div>

                <button type="button" onClick={() => setLaeuft((v) => !v)}>
                  {laeuft ? 'Anhalten' : 'Abspielen'}
                </button>
                <button
                  type="button"
                  className="sekundaer"
                  onClick={() => {
                    anhalten();
                    setWinkel(scheitel.winkelGrad);
                  }}
                >
                  Scheitel {zahl(scheitel.winkelGrad, 1)}°
                </button>

                <div className="schalter">
                  <label>
                    <input type="checkbox" checked={zeigeFahrzeug} onChange={(e) => setZeigeFahrzeug(e.target.checked)} />
                    Fahrzeug einblenden
                  </label>
                  <label>
                    <input type="checkbox" checked={rueckwaerts} onChange={(e) => setRueckwaerts(e.target.checked)} />
                    Rückwärts eingeparkt
                  </label>
                  <label>
                    <input type="checkbox" checked={zeigeKonstruktion} onChange={(e) => setZeigeKonstruktion(e.target.checked)} />
                    Konstruktionslinien
                  </label>
                </div>
              </div>

              <section className="ablesungen">
                {ablesungen.map(([label, wert, einheit, zustand]) => (
                  <div className={`kachel${label === 'Überstand Vorplatz' ? ' betont' : ''}`} key={label}>
                    <div className="kachel-label">{label}</div>
                    <div className={`kachel-wert${zustand ? ' ' + zustand : ''}`}>
                      {wert}
                      <span className="einheit">{einheit}</span>
                    </div>
                  </div>
                ))}
                <div className="kachel">
                  <div className="kachel-label">Kollision Tor ↔ Fahrzeug</div>
                  <div className={`kachel-wert ${kollision ? 'schlecht' : 'gut'}`}>
                    {kollision ? 'Ja' : 'Nein'}
                  </div>
                  <div className="kachel-fussnote">
                    geprüft wird nur die Torunterkante
                    {zeigeFahrzeug ? '' : ' · Fahrzeug nur ausgeblendet'}
                  </div>
                </div>
                <div className="kachel">
                  <div className="kachel-label">Passt in die Garage</div>
                  <div
                    className={`kachel-wert ${
                      garagenbefund.urteil === 'sicher'
                        ? 'gut'
                        : garagenbefund.urteil === 'passt-nicht'
                          ? 'schlecht'
                          : ''
                    }`}
                  >
                    {URTEIL_LABEL[garagenbefund.urteil]}
                  </div>
                  <div className="kachel-fussnote">
                    {garagenbefund.engsteReserve === undefined
                      ? 'keine Achse belegt'
                      : `engste Achse ${zahl(garagenbefund.engsteReserve * 100, 1)} cm`}
                  </div>
                </div>
              </section>
            </div>

            <div className="zone-rechts">
              <EingabenFahrzeug
                config={config}
                fahrzeug={fahrzeug}
                fahrzeugId={fahrzeugId}
                seitenprofil={seitenprofil}
                abstandRueckwand={Math.min(abstandRueckwand, maxAbstand)}
                maxAbstand={maxAbstand}
                auswahl={auswahl}
                nurPassende={nurPassende}
                nurNeue={nurNeue}
                onConfig={handleConfig}
                onFahrzeug={handleFahrzeug}
                onProfil={handleProfil}
                onAbstand={setAbstandRueckwand}
                onNurPassende={setNurPassende}
                onNurNeue={setNurNeue}
                onIndividuellMass={handleIndividuellMass}
              />
            </div>
          </div>

          <footer className="fuss">
            <span>
              Fahrzeugfront bei x = {zahl(fahrzeugFront(config, Math.min(abstandRueckwand, maxAbstand)), 3)} m ·
              Federzone endet bei {zahl(config.SPRING_DEPTH, 3)} m
            </span>
            <span>
              <a href="https://github.com/F1rlefanz/Garagensimulator">github.com/F1rlefanz/Garagensimulator</a>
            </span>
          </footer>
        </div>
      </div>

      <StatusLeiste
        fehler={befunde.filter((b) => b.schwere === 'fehler').length}
        warnungen={befunde.filter((b) => b.schwere === 'warnung').length}
        urteil={URTEIL_LABEL[garagenbefund.urteil]}
        urteilZustand={
          garagenbefund.urteil === 'sicher'
            ? 'gut'
            : garagenbefund.urteil === 'passt-nicht'
              ? 'schlecht'
              : 'neutral'
        }
        offen={panelOffen}
        onOeffnen={() => setPanelOffen((v) => !v)}
      />

      <Seitenpanel offen={panelOffen} onSchliessen={() => setPanelOffen(false)}>
        <Befunde befunde={befunde} />
        <Garagenbefund
          befund={garagenbefund}
          fahrzeug={fahrzeug}
          lichteHoehe={config.CLEAR_HEIGHT}
        />
      </Seitenpanel>
    </>
  );
}
