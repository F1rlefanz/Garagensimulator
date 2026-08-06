import { ReactNode, useEffect, useRef } from 'react';

/**
 * Eingeklapptes Seitenmenü für die Befunde.
 *
 * Die Befunde sind Hintergrundwissen: Sie sollen jederzeit erreichbar sein, aber
 * nicht dauerhaft Platz von Riss und Eingaben nehmen. Sichtbar bleibt nur eine
 * schmale Statusleiste, die das Ergebnis in zwei Zahlen zusammenfasst und beim
 * Anklicken das Panel öffnet.
 */

interface StatusLeisteProps {
  fehler: number;
  warnungen: number;
  urteil: string;
  urteilZustand: 'gut' | 'schlecht' | 'neutral';
  offen: boolean;
  onOeffnen: () => void;
}

export function StatusLeiste({
  fehler,
  warnungen,
  urteil,
  urteilZustand,
  offen,
  onOeffnen,
}: StatusLeisteProps) {
  const zustand = fehler > 0 ? 'schlecht' : warnungen > 0 ? 'warnung' : 'gut';

  return (
    <button
      type="button"
      className="status-leiste"
      aria-expanded={offen}
      aria-controls="seitenpanel"
      onClick={onOeffnen}
    >
      <span className="status-marke">Befunde</span>
      <span className={`status-wert ${zustand}`}>
        {fehler} Fehler · {warnungen} Warnungen
      </span>
      <span className="status-trenner" aria-hidden="true">
        |
      </span>
      <span className="status-marke">Urteil</span>
      <span className={`status-wert ${urteilZustand}`}>{urteil}</span>
      <span className="status-pfeil" aria-hidden="true">
        ‹
      </span>
    </button>
  );
}

interface SeitenpanelProps {
  offen: boolean;
  onSchliessen: () => void;
  children: ReactNode;
}

export function Seitenpanel({ offen, onSchliessen, children }: SeitenpanelProps) {
  const panel = useRef<HTMLDivElement>(null);

  // Esc schließt — sonst ist das Panel auf der Tastatur eine Sackgasse.
  useEffect(() => {
    if (!offen) return;
    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSchliessen();
    };
    document.addEventListener('keydown', taste);
    panel.current?.focus();
    return () => document.removeEventListener('keydown', taste);
  }, [offen, onSchliessen]);

  return (
    <>
      <div
        className={`panel-schleier${offen ? ' offen' : ''}`}
        onClick={onSchliessen}
        aria-hidden="true"
      />
      <div
        id="seitenpanel"
        className={`seitenpanel${offen ? ' offen' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-label="Prüfergebnisse"
        aria-hidden={!offen}
        tabIndex={-1}
        ref={panel}
      >
        <div className="panel-kopf">
          <h2>Prüfergebnisse</h2>
          <button type="button" className="sekundaer panel-schliessen" onClick={onSchliessen}>
            Schließen
          </button>
        </div>
        <div className="panel-inhalt">{children}</div>
      </div>
    </>
  );
}
