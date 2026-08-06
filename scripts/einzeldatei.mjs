/**
 * Baut aus dem Vite-Ergebnis eine einzige, in sich geschlossene HTML-Datei:
 * CSS, JavaScript und Schriften werden eingebettet.
 *
 * Zweck: Die Vorschau, die geteilt wird, soll dieselbe Anwendung sein wie der
 * Entwicklungsserver und die veröffentlichte Seite. Ohne diesen Schritt gäbe es
 * eine zweite, nachgebaute Fassung — und damit eine zweite Wahrheit über die
 * Kinematik.
 *
 * Aufruf über `npm run build:einzeldatei`, Ergebnis in `dist-einzeldatei/`.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const QUELLE = 'dist';
const ZIEL = 'dist-einzeldatei';

const MIME = {
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

/** Ersetzt url(...)-Verweise auf Dateien in assets/ durch data:-URIs. */
async function schriftenEinbetten(css, assetsVerzeichnis) {
  const verweise = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)];
  let ergebnis = css;

  for (const [ganz, pfad] of verweise) {
    const name = basename(pfad.split('?')[0]);
    const endung = extname(name);
    const mime = MIME[endung];
    if (!mime) continue;

    try {
      const inhalt = await readFile(join(assetsVerzeichnis, name));
      const daten = `data:${mime};base64,${inhalt.toString('base64')}`;
      ergebnis = ergebnis.replaceAll(ganz, `url(${daten})`);
    } catch {
      // Verweis zeigt nicht auf eine gebaute Datei — unverändert lassen.
    }
  }
  return ergebnis;
}

const html = await readFile(join(QUELLE, 'index.html'), 'utf8');
const assets = join(QUELLE, 'assets');
const dateien = await readdir(assets);

const cssDatei = dateien.find((f) => f.endsWith('.css'));
const jsDatei = dateien.find((f) => f.endsWith('.js'));
if (!cssDatei || !jsDatei) {
  throw new Error(`Erwartet je eine .css- und .js-Datei in ${assets}, gefunden: ${dateien.join(', ')}`);
}

const css = await schriftenEinbetten(await readFile(join(assets, cssDatei), 'utf8'), assets);
const js = await readFile(join(assets, jsDatei), 'utf8');

// Ersatztext immer über eine Funktion liefern: Als String würde `replace` darin
// enthaltene $-Sequenzen ($&, $`, $') als Rückverweise deuten und Teile des
// Dokuments duplizieren. In einem minifizierten Bündel kommen die vor.
const einzeln = html
  .replace(new RegExp(`<link[^>]*href="[^"]*${cssDatei}"[^>]*>`), () => `<style>\n${css}\n</style>`)
  .replace(
    new RegExp(`<script[^>]*src="[^"]*${jsDatei}"[^>]*></script>`),
    // Kein </script> im Bündel lassen, sonst bricht der Parser das Element auf.
    () => `<script type="module">\n${js.replaceAll('</script', '<\\/script')}\n</script>`,
  );

// Wächter: Verweise auf ausgelagerte Dateien machen die Vorschau unbrauchbar.
const uebrig = [...einzeln.matchAll(/(?:src|href)="[^"]*assets\/[^"]*"|url\(\/assets\/[^)]*\)/g)];
if (uebrig.length > 0) {
  throw new Error(`Nicht eigenständig — offene Verweise: ${uebrig.map((m) => m[0]).join(', ')}`);
}

await mkdir(ZIEL, { recursive: true });
await writeFile(join(ZIEL, 'index.html'), einzeln);

const groesse = Buffer.byteLength(einzeln) / 1024 / 1024;
console.log(`${ZIEL}/index.html — ${groesse.toFixed(2)} MB, eigenständig`);
