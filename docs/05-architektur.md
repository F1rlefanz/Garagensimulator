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

### Zwei getrennte Fragen, zwei Module

| Frage | Modul | Art |
| --- | --- | --- |
| Passt das Fahrzeug überhaupt hinein? | `garagenpruefung.ts` | statisch: Länge, Höhe, Breite |
| Schließt das Tor danach noch? | `kinematics.ts` + `fahrzeuggeometrie.ts` | dynamisch: Kontur gegen Torbahn |

Die Trennung ist keine Ästhetik. Die erste Frage lässt sich für den ganzen
Katalog beantworten, die zweite nur dort, wo ein Seitenprofil vorliegt — und das
liegt nirgends vor ([OFFEN-06](03-offene-fragen.md#offen-06)).

### Fehlende Maße bleiben fehlend

`undefined` wird nicht durch einen plausiblen Wert ersetzt. `pruefeGarage()`
kennt dafür das Urteil `nicht-pruefbar`, und `fahrzeugKontur()` fällt ohne
Seitenprofil auf einen Quader über die volle Höhe zurück. Beides zeigt in
dieselbe Richtung: lieber ein Fahrzeug zu Unrecht ablehnen als eines zu Unrecht
durchwinken.

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

`.github/workflows/pages.yml` baut bei jedem Push auf `main` und legt das
Ergebnis im Branch `gh-pages` ab — aber erst nach Typprüfung und Tests. Was
nicht grün ist, geht nicht online. `.github/workflows/ci.yml` prüft jeden Pull
Request. Beide Workflows haben einen `concurrency`-Block, damit überholte Läufe
abbrechen statt sich zu stapeln.

**Warum über einen Branch und nicht über `actions/deploy-pages`:** Der gebaute
Stand liegt als fertiges Artefakt im Branch und lässt sich zur Not von Hand
befüllen, ohne dass unser Workflow läuft. Eine **bereits veröffentlichte** Seite
bleibt außerdem erreichbar, wenn gerade kein Runner frei ist — ausgeliefert wird
statisch, ohne Actions.

**Was der Branch dagegen nicht löst:** Eine *neue* Veröffentlichung braucht
trotzdem einen Runner. GitHub startet dafür einen eigenen Workflow
`pages build and deployment`, den wir nicht kontrollieren. Beim Einrichten am
06.08.2026 blieb dessen `build`-Job 15 Minuten mit leerem `runner_name` in der
Warteschlange und wurde abgebrochen — während unser eigener `Pages`-Workflow im
selben Zeitraum problemlos Runner bekam. Die Umstellung auf den Branch hat die
Abhängigkeit vom Runner also nicht beseitigt, sondern nur verschoben.

Wer sie ganz loswerden will, muss den umgekehrten Weg gehen: *Settings → Pages →
Source: GitHub Actions* und im eigenen Workflow `actions/upload-pages-artifact`
plus `actions/deploy-pages` verwenden. Dann läuft alles in dem Workflow, der
nachweislich Runner bekommt — um den Preis, dass es kein von Hand befüllbares
Artefakt mehr gibt.

Der Branch lässt sich zur Not von Hand befüllen, ganz ohne Actions:

```bash
npm run build -- --base=/Garagensimulator/
touch dist/.nojekyll
# Inhalt von dist/ als Wurzel in den Branch gh-pages legen und pushen
```

Einmalige Einstellung im Repository: *Settings → Pages → Source: Deploy from a
branch → `gh-pages` / `(root)`*.

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
