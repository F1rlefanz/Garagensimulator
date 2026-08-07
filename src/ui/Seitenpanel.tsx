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
  /** Das Element, von dem aus geöffnet wurde — dorthin geht der Fokus zurück. */
  const ausloeser = useRef<HTMLElement | null>(null);

  // Die Schließfunktion hinter einem Ref: Sie kommt als Inline-Funktion herein
  // und wäre als Abhängigkeit bei jedem Render neu. Während die Toranimation
  // läuft, sind das rund 60 Renders je Sekunde — der Effekt lief in jedem Frame
  // und zog den Fokus zurück auf den Container, sodass der Schließen-Knopf per
  // Tastatur nicht erreichbar war.
  const schliessen = useRef(onSchliessen);
  schliessen.current = onSchliessen;

  // Esc schließt — sonst ist das Panel auf der Tastatur eine Sackgasse.
  useEffect(() => {
    if (!offen) return;
    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') schliessen.current();
    };
    document.addEventListener('keydown', taste);
    return () => document.removeEventListener('keydown', taste);
  }, [offen]);

  // Fokus genau einmal je Übergang: beim Öffnen ins Panel, beim Schließen
  // zurück auf den Auslöser. Ohne die Rückgabe fällt der Fokus auf den Body,
  // und die Stelle in der Bedienreihenfolge ist verloren.
  useEffect(() => {
    if (offen) {
      ausloeser.current = document.activeElement as HTMLElement | null;
      panel.current?.focus();
    } else {
      ausloeser.current?.focus();
      ausloeser.current = null;
    }
  }, [offen]);

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
