import { calculateKinematics, GarageConfig, maximalerUeberstand } from '../lib/kinematics';
import { Fahrzeug } from '../domain/fahrzeuge';

/**
 * Vertikalschnitt der Garage als Bauzeichnung.
 *
 * Rein darstellend: Jede Zahl kommt aus `config` bzw. aus `calculateKinematics`.
 * Hier steht kein einziges Maß.
 */

const PPM = 185; // Pixel pro Meter, für beide Achsen gleich
const X0 = 1.55; // Weltkoordinate des linken Blattrands
const Y0 = 2.72; // Weltkoordinate des oberen Blattrands
const BREITE = 1500;
const HOEHE = 645;

/*
 * Schriftgrößen in viewBox-Einheiten. Sie skalieren mit der Zeichnung: Der Riss
 * steht seit dem Dreispalter in einer rund 950 px breiten Mittelspalte statt
 * über die volle Blattbreite, wird also auf etwa 62 % verkleinert. Die Bemaßung
 * ist deshalb um ein knappes Sechstel größer angelegt als im ersten Entwurf,
 * damit sie dort noch entzifferbar bleibt.
 */
const SCHRIFT_BEMASSUNG = 14.5;
const SCHRIFT_BESCHRIFTUNG = 13;
const SCHRIFT_KLEIN = 12.5;
const SCHRIFT_PUNKT = 17;

const mx = (x: number) => (x + X0) * PPM;
const my = (y: number) => (Y0 - y) * PPM;
const kommaZahl = (v: number, stellen = 2) => v.toFixed(stellen).replace('.', ',');

interface RissProps {
  config: GarageConfig;
  winkelGrad: number;
  maxWinkel: number;
  fahrzeug: Fahrzeug;
  zeigeFahrzeug: boolean;
  zeigeKonstruktion: boolean;
  rueckwaerts: boolean;
  /** Seitenkontur des Fahrzeugs in Weltkoordinaten — dieselbe wie in der Kollisionsprüfung. */
  fahrzeugKontur: Array<[number, number]>;
  kollision: boolean;
}

/** Bemaßungskette mit Endstrichen, waagerecht oder senkrecht. */
function Mass({
  achse,
  fest,
  von,
  bis,
  text,
  farbe,
}: {
  achse: 'x' | 'y';
  fest: number;
  von: number;
  bis: number;
  text: string;
  farbe: string;
}) {
  const s = 0.035;
  const a: Array<[number, number]> =
    achse === 'x'
      ? [
          [von, fest],
          [bis, fest],
        ]
      : [
          [fest, von],
          [fest, bis],
        ];
  const mitteX = achse === 'x' ? (von + bis) / 2 : fest;
  const mitteY = achse === 'x' ? fest : (von + bis) / 2;

  return (
    <g stroke={farbe} strokeWidth={1} fill={farbe}>
      <line x1={mx(a[0][0])} y1={my(a[0][1])} x2={mx(a[1][0])} y2={my(a[1][1])} />
      {a.map(([px, py], i) =>
        achse === 'x' ? (
          <line key={i} x1={mx(px)} y1={my(py - s)} x2={mx(px)} y2={my(py + s)} />
        ) : (
          <line key={i} x1={mx(px - s)} y1={my(py)} x2={mx(px + s)} y2={my(py)} />
        ),
      )}
      <text
        x={mx(mitteX)}
        y={my(mitteY)}
        fontFamily="PlexMono, monospace"
        fontSize={SCHRIFT_BEMASSUNG}
        textAnchor="middle"
        dy={-6}
        stroke="none"
        transform={achse === 'y' ? `rotate(-90 ${mx(mitteX)} ${my(mitteY)})` : undefined}
      >
        {text}
      </text>
    </g>
  );
}

export function Riss({
  config,
  winkelGrad,
  maxWinkel,
  fahrzeug,
  zeigeFahrzeug,
  zeigeKonstruktion,
  fahrzeugKontur,
  kollision,
}: RissProps) {
  const k = calculateKinematics(Math.min(winkelGrad, maxWinkel), config);
  const boden = config.FLOOR_OFFSET;
  const tiefe = config.DEPTH_G;
  const decke = config.GARAGE_HEIGHT;
  const schieneUK = boden + config.CLEAR_HEIGHT;
  const schieneOK = schieneUK + config.RAIL_PROFILE;
  const anschlag = tiefe - config.STYROFOAM_THICKNESS;
  const scheitel = maximalerUeberstand(config);
  const kScheitel = calculateKinematics(scheitel.winkelGrad, config);

  // Federpunkt: sitzt am Schwenkarm hinter dem Lagerbolzen, auf derselben Achse.
  const dx = k.xA - k.xP;
  const dy = k.yA - k.yP;
  const norm = Math.hypot(dx, dy) || 1;
  const xF = k.xA + (dx / norm) * config.D_AF;
  const yF = k.yA + (dy / norm) * config.D_AF;
  const xAnker = config.SPRING_DEPTH / 2;

  const bahnPunkte: string[] = [];
  for (let a = 0; a <= maxWinkel; a += 0.5) {
    const p = calculateKinematics(a, config);
    if (p.isValid) bahnPunkte.push(`${mx(p.xB)},${my(p.yB)}`);
  }

  const punkte: Array<[string, number, number, string, 'start' | 'middle' | 'end', number, number]> = [
    ['A', k.xA, k.yA, 'var(--lager)', 'start', 13, 5],
    ['P', k.xP, k.yP, 'var(--tinte)', 'end', -11, -9],
    ['T', k.xT, k.yT, 'var(--tor)', 'middle', 0, -13],
    ['B', k.xB, k.yB, 'var(--tor)', 'end', -11, 19],
    ['O', k.xTop, k.yTop, 'var(--tor)', 'start', 12, -7],
    ['F', xF, yF, 'var(--feder)', 'start', 12, 14],
  ];

  return (
    <svg
      viewBox={`0 0 ${BREITE} ${HOEHE}`}
      role="img"
      aria-label={`Vertikalschnitt der Garage, Tor bei ${kommaZahl(winkelGrad, 1)} Grad geöffnet`}
    >
      <defs>
        <pattern id="raster10" width={0.1 * PPM} height={0.1 * PPM} patternUnits="userSpaceOnUse">
          <path
            d={`M ${0.1 * PPM} 0 L 0 0 0 ${0.1 * PPM}`}
            fill="none"
            stroke="var(--riss-fein)"
            strokeWidth={0.5}
          />
        </pattern>
        <pattern
          id="raster100"
          width={PPM}
          height={PPM}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${mx(0) % PPM} ${my(0) % PPM})`}
        >
          <rect width={PPM} height={PPM} fill="url(#raster10)" />
          <path
            d={`M ${PPM} 0 L 0 0 0 ${PPM}`}
            fill="none"
            stroke="var(--riss)"
            strokeWidth={0.6}
            opacity={0.55}
          />
        </pattern>
        <pattern
          id="schraffur"
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={8} stroke="var(--feder)" strokeWidth={1.6} opacity={0.55} />
        </pattern>
      </defs>

      <rect width={BREITE} height={HOEHE} fill="url(#raster100)" opacity={0.85} />

      {/* Baukörper. Der Boden liegt vor dem Tor auf y = 0 und steigt hinter der
          Eisenschwelle über die Rampe auf den Garagenboden. */}
      <polyline
        points={(
          [
            [-X0 + 0.05, 0],
            [0, 0],
            [config.SPRING_DEPTH, boden],
            [tiefe, boden],
            [tiefe, decke],
            [0, decke],
            [0, schieneUK],
          ] as Array<[number, number]>
        )
          .map(([x, y]) => `${mx(x)},${my(y)}`)
          .join(' ')}
        fill="none"
        stroke="var(--tinte)"
        strokeWidth={2.4}
      />
      <text x={mx(-1.45)} y={my(decke - 0.14)} fill="var(--gedaempft)" fontFamily="PlexMono, monospace" fontSize={SCHRIFT_BESCHRIFTUNG} letterSpacing="0.14em">
        VORPLATZ
      </text>
      <text x={mx(config.SPRING_DEPTH + 0.08)} y={my(boden)} dy={15} fill="var(--gedaempft)" fontFamily="PlexMono, monospace" fontSize={SCHRIFT_KLEIN}>
        GARAGENBODEN +{kommaZahl(boden * 100, 1)} CM
      </text>

      {/* Sturz über der Toröffnung */}
      <rect x={mx(0)} y={my(decke)} width={3} height={my(schieneUK) - my(decke)} fill="var(--tinte)" opacity={0.55} />

      {/* Federzone: die vorderen Zentimeter sind kein Stellplatz */}
      <rect
        x={mx(0)}
        y={my(schieneUK)}
        width={mx(config.SPRING_DEPTH) - mx(0)}
        height={my(0) - my(schieneUK)}
        fill="url(#schraffur)"
        opacity={0.5}
      />
      {/* Styropor an der Rückwand */}
      <rect
        x={mx(anschlag)}
        y={my(decke)}
        width={mx(tiefe) - mx(anschlag)}
        height={my(boden) - my(decke)}
        fill="url(#schraffur)"
        opacity={0.5}
      />

      {/* Laufschiene als Profil, nicht als Linie */}
      <rect
        x={mx(0)}
        y={my(schieneOK)}
        width={mx(config.RAIL_LENGTH) - mx(0)}
        height={my(schieneUK) - my(schieneOK)}
        fill="var(--lager)"
        opacity={0.3}
      />
      <line x1={mx(0)} y1={my(schieneOK)} x2={mx(config.RAIL_LENGTH)} y2={my(schieneOK)} stroke="var(--lager)" strokeWidth={1.4} />
      <line x1={mx(0)} y1={my(schieneUK)} x2={mx(config.RAIL_LENGTH)} y2={my(schieneUK)} stroke="var(--lager)" strokeWidth={1.4} />
      <text x={mx(config.RAIL_LENGTH + 0.07)} y={my(schieneUK + 0.02)} fill="var(--lager)" fontFamily="PlexMono, monospace" fontSize={SCHRIFT_BESCHRIFTUNG}>
        LAUFSCHIENE L={kommaZahl(config.RAIL_LENGTH)}
      </text>

      {/* Lichte Durchfahrtshöhe */}
      <line x1={mx(0)} y1={my(schieneUK)} x2={mx(tiefe)} y2={my(schieneUK)} stroke="var(--bahn)" strokeWidth={1} strokeDasharray="7 5" opacity={0.75} />

      {/* Fahrzeug — steht auf dem Garagenboden, liegt hinter der Mechanik */}
      {zeigeFahrzeug && (
        <>
          <polygon
            points={fahrzeugKontur.map(([x, y]) => `${mx(x)},${my(y)}`).join(' ')}
            fill={kollision ? 'var(--tor)' : 'var(--gedaempft)'}
            fillOpacity={kollision ? 0.16 : 0.08}
            stroke={kollision ? 'var(--tor)' : 'var(--gedaempft)'}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
          <text
            x={mx(fahrzeugKontur[0][0] + config.CAR_LENGTH / 2)}
            y={my(boden + 0.22)}
            fill="var(--gedaempft)"
            fontFamily="PlexMono, monospace"
            fontSize={SCHRIFT_BESCHRIFTUNG}
            textAnchor="middle"
            letterSpacing="0.05em"
          >
            {fahrzeug.bezeichnung.toUpperCase()} · {kommaZahl(config.CAR_LENGTH, 3)} ×{' '}
            {kommaZahl(config.CAR_HEIGHT, 3)}
          </text>
        </>
      )}

      {zeigeKonstruktion && (
        <>
          {/* Kreis, auf dem der Anlenkpunkt P läuft */}
          <circle
            cx={mx(k.xA)}
            cy={my(k.yA)}
            r={k.rArm * PPM}
            fill="none"
            stroke="var(--gedaempft)"
            strokeWidth={1}
            strokeDasharray="3 5"
            opacity={0.4}
          />
          {/* Bahn der Torunterkante über den gesamten Öffnungsweg */}
          <polyline points={bahnPunkte.join(' ')} fill="none" stroke="var(--bahn)" strokeWidth={1.6} strokeDasharray="4 4" opacity={0.9} />
          {/* Torblatt in der Scheitelstellung als Geisterlinie */}
          <line x1={mx(kScheitel.xTop)} y1={my(kScheitel.yTop)} x2={mx(kScheitel.xB)} y2={my(kScheitel.yB)} stroke="var(--tor)" strokeWidth={3} opacity={0.22} />
          <circle cx={mx(kScheitel.xB)} cy={my(kScheitel.yB)} r={4} fill="none" stroke="var(--bahn)" strokeWidth={1.6} />
          <Mass achse="x" fest={-0.2} von={kScheitel.xB} bis={0} text={`GRÖSSTER ÜBERSTAND ${kommaZahl(scheitel.ueberstand, 3)}`} farbe="var(--bahn)" />
        </>
      )}

      {/* Federung: von F am Schwenkarm zur Verankerung im Boden */}
      <line x1={mx(xF)} y1={my(yF)} x2={mx(xAnker)} y2={my(boden / 2)} stroke="var(--feder)" strokeWidth={2.2} opacity={0.85} />
      <rect x={mx(xAnker) - 7} y={my(boden / 2) - 3} width={14} height={6} fill="var(--feder)" />

      {/* Schwenkarm und Festlager */}
      <line x1={mx(k.xA)} y1={my(k.yA)} x2={mx(k.xP)} y2={my(k.yP)} stroke="var(--tinte)" strokeWidth={4} strokeLinecap="round" />
      <rect x={mx(k.xA) - 6} y={my(k.yA) - 26} width={14} height={52} fill="var(--lager)" opacity={0.8} />

      {/* Torblatt */}
      <line x1={mx(k.xTop)} y1={my(k.yTop)} x2={mx(k.xB)} y2={my(k.yB)} stroke="var(--tor)" strokeWidth={8} />

      {punkte.map(([name, px, py, farbe, anchor, ddx, ddy]) => (
        <g key={name}>
          <circle cx={mx(px)} cy={my(py)} r={5.5} fill={farbe} />
          <circle cx={mx(px)} cy={my(py)} r={5.5} fill="none" stroke="var(--blatt-2)" strokeWidth={1.4} />
          <text x={mx(px)} y={my(py)} dx={ddx} dy={ddy} fill={farbe} fontFamily="PlexMono, monospace" fontSize={SCHRIFT_PUNKT} fontWeight={700} textAnchor={anchor}>
            {name}
          </text>
        </g>
      ))}

      {/* Bemaßung. Senkrechte Ketten rechts der Rückwand, damit der
          Schwenkbereich des Tors auf dem Vorplatz frei bleibt. */}
      <Mass achse="x" fest={-0.62} von={0} bis={tiefe} text={`ROHBAULÄNGE ${kommaZahl(tiefe)}`} farbe="var(--tinte)" />
      <Mass achse="x" fest={-0.4} von={config.SPRING_DEPTH} bis={anschlag} text={`NUTZBAR ${kommaZahl(anschlag - config.SPRING_DEPTH)}`} farbe="var(--gedaempft)" />
      <Mass achse="y" fest={tiefe + 0.32} von={0} bis={boden} text={`BODENVERSATZ ${kommaZahl(boden * 100, 1)} CM`} farbe="var(--feder)" />
      <Mass achse="y" fest={tiefe + 0.64} von={boden} bis={schieneUK} text={`LICHTE HÖHE ${kommaZahl(config.CLEAR_HEIGHT)}`} farbe="var(--bahn)" />
      <Mass achse="y" fest={tiefe + 0.96} von={boden} bis={decke} text={`GARAGENHÖHE ${kommaZahl(decke - boden)}`} farbe="var(--tinte)" />
      <Mass achse="y" fest={-0.75} von={0} bis={config.D_PB + config.D_TP + config.D_TTOP} text={`TORHÖHE ${kommaZahl(config.D_PB + config.D_TP + config.D_TTOP, 3)}`} farbe="var(--tor)" />
    </svg>
  );
}
