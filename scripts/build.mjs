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
const kb = (n) => `${(n / 1024).toFixed(1)} ko`;
const rows = files.map((f) => {
  const buf = readFileSync(out(f));
  return { fichier: f, brut: kb(buf.length), gzip: kb(gzipSync(buf, { level: 9 }).length) };
});
console.table(rows);
writeFileSync(out('sizes.json'), JSON.stringify(Object.fromEntries(rows.map((r) => [r.fichier, { raw: r.brut, gzip: r.gzip }])), null, 2) + '\n');
