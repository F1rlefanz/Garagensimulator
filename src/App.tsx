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
  fahrzeugNachId,
  istEditierbar,
  pruefhoehe,
  REFERENZ_FAHRZEUG,
  Seitenprofil,
} from './domain/fahrzeuge';
import { m, pruefeGeometrie } from './domain/garage';
import { pruefeGarage, URTEIL_LABEL } from './lib/garagenpruefung';
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

export default function App() {
  const [config, setConfig] = useState<GarageConfig>(DEFAULT_CONFIG);
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

  const fahrzeug = fahrzeugNachId(fahrzeugId) ?? REFERENZ_FAHRZEUG;

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

  // Gefilterte Auswahlliste. Das gerade gewählte Fahrzeug bleibt immer drin —
  // sonst stünde die Auswahl leer da, sobald ein Filter es ausschließt.
  const auswahl = useMemo(
    () =>
      AUSWAHL.filter((f) => {
        if (f.id === fahrzeugId || istEditierbar(f.id)) return true;
        if (nurNeue && f.marktstatus !== 'neu') return false;
        if (nurPassende && pruefeGarage(f, config, einfahrtBreite).urteil === 'passt-nicht') {
          return false;
        }
        return true;
      }),
    [fahrzeugId, nurNeue, nurPassende, config, einfahrtBreite],
  );

  const k = calculateKinematics(Math.min(winkel, maxWinkel), config);
  // Geprüft wird bislang nur die Torunterkante B gegen die Fahrzeugkontur —
  // Torblatt und Schwenkarme fehlen noch, siehe docs/04-roadmap.md.
  const kollision = zeigeFahrzeug && liegtInnerhalb(k.xB, k.yB, kontur);

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

  const handleConfig = (key: keyof GarageConfig, wert: number) =>
    setConfig((vorher) => ({ ...vorher, [key]: wert }));

  // Katalogfahrzeuge sind fest hinterlegt: Auswahl setzt die Maße, die Felder
  // werden gesperrt. Nur 'Individuell' bleibt frei editierbar.
  const handleFahrzeug = (id: string) => {
    setFahrzeugId(id);
    const f = fahrzeugNachId(id);
    if (!f) return;
    setConfig((vorher) => ({
      ...vorher,
      CAR_LENGTH: f.laenge.wert,
      CAR_HEIGHT: pruefhoehe(f).wert,
    }));
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
                  setConfig(DEFAULT_CONFIG);
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
                  <div className="kachel-fussnote">geprüft wird nur die Torunterkante</div>
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
