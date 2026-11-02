// Construit les fichiers de dist/ avec esbuild et affiche leur taille (brute et gzip).
import { build, transform } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const banner = `/*! Kinetika v${pkg.version} | MIT © 2026 wwhabiboshdz3a7 | https://github.com/wwhabiboshdz3a7/kinetika */`;
const entry = join(root, 'src/index.js');
const out = (f) => join(root, 'dist', f);
mkdirSync(join(root, 'dist'), { recursive: true });

const common = { entryPoints: [entry], bundle: true, target: 'es2019', legalComments: 'none', write: false, logLevel: 'silent' };

const esm = await build({ ...common, format: 'esm' });
writeFileSync(out('kinetika.esm.js'), `${banner}\n${esm.outputFiles[0].text}`);

const esmMin = await build({ ...common, format: 'esm', minify: true });
writeFileSync(out('kinetika.esm.min.js'), `${banner}\n${esmMin.outputFiles[0].text}`);

const cjs = await build({ ...common, format: 'cjs' });
writeFileSync(out('kinetika.cjs'), `${banner}\n${cjs.outputFiles[0].text}`);

// UMD : AMD, CommonJS, ou variable globale `kinetika`
const iife = await build({ ...common, format: 'iife', globalName: '__kinetika' });
const umdSrc = `(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.kinetika = factory();
})(typeof self !== 'undefined' ? self : this, function () {
${iife.outputFiles[0].text}
return __kinetika;
});`;
const umd = await transform(umdSrc, { minify: true, target: 'es2019', legalComments: 'none' });
writeFileSync(out('kinetika.umd.min.js'), `${banner}\n${umd.code}`);

const files = ['kinetika.esm.js', 'kinetika.esm.min.js', 'kinetika.umd.min.js', 'kinetika.cjs'];
// ko = 1 000 octets (comme kB en anglais)
const kb = (n, dec = '.') => `${(n / 1000).toFixed(1).replace('.', dec)}`;
const sizes = Object.fromEntries(files.map((f) => {
  const buf = readFileSync(out(f));
  return [f, { rawBytes: buf.length, gzipBytes: gzipSync(buf, { level: 9 }).length }];
}));
console.table(files.map((f) => ({ fichier: f, brut: `${kb(sizes[f].rawBytes)} ko`, gzip: `${kb(sizes[f].gzipBytes)} ko` })));
writeFileSync(out('sizes.json'), JSON.stringify(Object.fromEntries(files.map((f) => [f, {
  raw: `${kb(sizes[f].rawBytes)} ko`, gzip: `${kb(sizes[f].gzipBytes)} ko`, ...sizes[f],
}])), null, 2) + '\n');

// Tableaux des tailles des README, entre <!-- tailles --> et <!-- /tailles -->
const tables = {
  'README.md': { dec: ',', unit: 'ko', head: '| Fichier | Brut | gzip |', esm: '(non minifié, commenté)' },
  'README.en.md': { dec: '.', unit: 'kB', head: '| File | Raw | gzip |', esm: '(unminified, commented)' },
};
for (const [file, t] of Object.entries(tables)) {
  const path = join(root, file);
  const src = readFileSync(path, 'utf8');
  const v = (f, k) => `${kb(sizes[f][k], t.dec)} ${t.unit}`;
  const table = [
    t.head,
    '|---|---|---|',
    `| \`dist/kinetika.esm.min.js\` | ${v('kinetika.esm.min.js', 'rawBytes')} | **${v('kinetika.esm.min.js', 'gzipBytes')}** |`,
    `| \`dist/kinetika.umd.min.js\` | ${v('kinetika.umd.min.js', 'rawBytes')} | ${v('kinetika.umd.min.js', 'gzipBytes')} |`,
    `| \`dist/kinetika.esm.js\` ${t.esm} | ${v('kinetika.esm.js', 'rawBytes')} | ${v('kinetika.esm.js', 'gzipBytes')} |`,
  ].join('\n');
  const next = src.replace(/<!-- tailles -->[\s\S]*?<!-- \/tailles -->/, `<!-- tailles -->\n${table}\n<!-- /tailles -->`);
  if (next !== src) writeFileSync(path, next);
}

// Valeur affichée sur l'accueil avant la lecture de sizes.json
const home = join(root, 'index.html');
const html = readFileSync(home, 'utf8');
const g = String(Math.round(sizes['kinetika.esm.min.js'].gzipBytes / 1000));
const nextHtml = html.replace(/(<span class="stats__n" data-odo=")\d+(">)\d+(<\/span><span class="stats__u">ko gzip)/, `$1${g}$2${g}$3`);
if (nextHtml !== html) writeFileSync(home, nextHtml);
