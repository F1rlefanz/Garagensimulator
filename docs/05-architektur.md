# Architektur und Entscheidungen

## Eine Implementierung, drei Ansichten

Das Modell existiert **genau einmal**. Entwicklungsserver, veröffentlichte Seite
und geteilte Vorschau sind dasselbe Programm, nur anders ausgeliefert:

| Ansicht | Herkunft | Befehl |
| --- | --- | --- |
| Entwicklungsserver | `src/` direkt | `npm run dev` |
| Veröffentlichte Seite | `dist/` über GitHub Pages | automatisch bei Push auf `main` |
| Geteilte Vorschau | `dist-einzeldatei/index.html` | `npm run build:einzeldatei` |

`scripts/einzeldatei.mjs` bettet CSS, JavaScript und Schriften in eine einzige
HTML-Datei ein. Der Grund ist keine Bequemlichkeit: Eine nachgebaute Vorschau
hätte eine zweite Kinematik enthalten — und damit eine zweite Wahrheit über die
Maße. Ein Wächter im Skript bricht ab, sobald noch ein Verweis auf eine
ausgelagerte Datei übrig ist.

## Schichten

| Ebene | Ort | Aufgabe |
| --- | --- | --- |
| Domäne | `src/domain/` | Messwerte und Fahrzeugdaten, keine Berechnung, keine UI |
| Berechnung | `src/lib/` | Kinematik und Parkgeometrie, rein funktional, ohne React |
| Darstellung | `src/ui/`, `src/App.tsx` | SVG-Zeichnung, Eingaben, Befunde |

`src/lib/` kennt weder React noch SVG und liefert reine Koordinaten. Der
3D-Renderer wird später dieselben Funktionen aufrufen wie die heutige
2D-Ansicht; die Tests stellen sicher, dass beide dieselben Zahlen sehen.

**Regel:** Messwerte stehen ausschließlich in `src/domain/`. `DEFAULT_CONFIG`
leitet sich vollständig daraus ab und enthält keine Zahlenliterale. Wer eine
Zahl in `lib/` oder in der Ansicht einträgt, erzeugt eine zweite Wahrheit.

Dasselbe gilt für Geometrie: Die Fahrzeugkontur liegt in
`src/lib/fahrzeuggeometrie.ts` und wird von Zeichnung **und**
Kollisionsprüfung verwendet. Vorher gab es zwei Fassungen davon — die Ansicht
zeigte etwas anderes an, als gerechnet wurde.

## Ablageort auf dem Entwicklungsrechner

**`%USERPROFILE%\Code\TypeScript\Garagensimulator`**

Das Projekt ist zu 100 % TypeScript — Anwendungscode, Kinematik, Domänenmodell,
Tests und Build-Konfiguration. Die 3D-Erweiterung mit Three.js ändert daran
nichts. Existiert kein Ordner `TypeScript`, ist auszuweichen auf `JavaScript` →
`Web` / `Frontend`.

```powershell
cd $env:USERPROFILE\Code\TypeScript
git clone https://github.com/F1rlefanz/Garagensimulator.git
cd Garagensimulator
npm ci
npm run dev
```

## „Virtuelle Umgebung"

Node.js kennt kein `venv`. Die Isolation entsteht durch das projektlokale
`node_modules/` plus die gepinnten Versionen in `package-lock.json` — beides
wirkt bereits pro Projektordner. Ergänzt wurden `.nvmrc` (Node 22) und
`engines.node`. `npm ci` installiert exakt den Stand aus dem Lockfile und ist
der richtige Befehl auf einem frischen Rechner.

## Technologiewahl

| Baustein | Wahl | Grund |
| --- | --- | --- |
| Sprache | TypeScript | Maße und Koordinaten sollen typisiert sein |
| Build | Vite | schneller Dev-Server, Three.js-tauglich |
| UI | React 19 | aus dem Prototyp übernommen |
| Styling | eine CSS-Datei mit Custom Properties | Tailwind entfernt — die Gestaltung als Bauzeichnung lebt von Token, nicht von Utility-Klassen |
| 2D-Grafik | SVG | Bemaßungen und Text sind hier erheblich einfacher als auf Canvas |
| Tests | Vitest | teilt die Vite-Konfiguration |
| Schriften | Big Shoulders, IBM Plex Mono, Instrument Sans | alle OFL, eingebettet unter `src/fonts/` — keine externe CDN, die Seite lädt vollständig aus sich selbst |
| 3D (später) | Three.js | im Handoff-Dokument so vorgesehen |

## Gestaltung

Die Oberfläche ist als Bauzeichnung angelegt: Blattrahmen, Schriftkopf,
10-cm-Raster, echte Bemaßungsketten mit Endstrichen. Die Farben stammen aus der
Legende der Handzeichnung — rot für das Garagentor, grün für die Befestigung des
Festlagers, blau für Dämmung und Federung. Die Neutralen haben einen Blaustich,
damit das Blatt nach Bauzeichnung aussieht und nicht nach Büropapier.

Hell und dunkel sind über `prefers-color-scheme` beide gestaltet; die Zeichnung
bezieht ihre Farben aus denselben Custom Properties wie der Rest der Seite.

## Veröffentlichung

`.github/workflows/pages.yml` baut bei jedem Push auf `main` und veröffentlicht
über GitHub Pages — aber erst nach Typprüfung und Tests. Was nicht grün ist,
geht nicht online. `.github/workflows/ci.yml` prüft jeden Pull Request.

Beide Workflows haben einen `concurrency`-Block: Überholte Läufe brechen ab,
statt sich in der Warteschlange zu stapeln.

## Datenschutz

Das Repository ist öffentlich. Vor der Umstellung wurde geprüft:

- **Keine Zugangsdaten**, auch nicht in der Historie. Der einzige Treffer war ein
  Platzhalter `GEMINI_API_KEY="MY_GEMINI_API_KEY"` aus der AI-Studio-Vorlage.
- **Kein Klarname.** Das Handoff-Dokument trug den Namen des Verfassers in den
  Office-Metadaten und wurde entfernt — sein Inhalt steht ohnehin vollständig in
  [`01-handoff.md`](01-handoff.md). Der lokale Windows-Pfad ist durch
  `%USERPROFILE%` ersetzt. Als Commit-Adresse dient GitHubs `noreply`-Adresse.
- **Keine Standortdaten.** Die Fotos enthalten keine EXIF- oder GPS-Daten. Die
  Außenaufnahme wurde auf das Tor beschnitten, sodass Straße, Nachbargebäude und
  parkende Fahrzeuge nicht mehr im Bild sind.
- Beides wurde **auch aus der Git-Historie** entfernt, nicht nur aus dem
  aktuellen Stand — sonst bliebe der alte Blob über seine Commit-Adresse
  abrufbar.

`.gitignore` sperrt `.env`, Schlüsseldateien und Zertifikate.

Was bewusst öffentlich ist: die Maße der Garage und die Innenaufnahmen der
Tormechanik. Ohne sie ist das Projekt nicht nachvollziehbar.

## Was beim Aufräumen entfernt wurde

Ausgangsstand war ein Export aus Google AI Studio.

- `src/App2.tsx` — Kopie von `App.tsx`; der doppelte Default-Export ließ die
  Typprüfung fehlschlagen
- acht Wegwerf-Skripte (`check.cjs`, `fix_*.cjs`, `rewrite.cjs`, `test*.cjs`)
  samt ihrer Textablagen (`depth.txt` und weitere)
- `metadata.json`, `.env.example`, `assets/.aistudio/` — AI-Studio-Metadaten
- zwölf ungenutzte Abhängigkeiten, zuletzt Tailwind CSS
- die eigenständig nachgebaute Vorschau: Sie enthielt eine zweite Kinematik in
  handgeschriebenem JavaScript. Ersetzt durch `npm run build:einzeldatei`
