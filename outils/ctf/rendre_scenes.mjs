// Rend les scènes illustrées (SVG dessinés dans outils/ctf/scenes/) en images JPEG ou PNG
// dans assets/ctf/scenes/. Le site ne publie que les images : les indices ne se lisent pas dans un code source.
// Dépendance d'auteur : Playwright (npm i -D playwright && npx playwright install chromium).
// Usage : node outils/ctf/rendre_scenes.mjs [filtre]   (ex. « geo- » pour ne rendre que la géolocalisation)
import { writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import zlib from 'node:zlib';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.resolve(ICI, '../../assets/ctf/scenes');
const filtre = process.argv[2] || '';

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { console.error('Playwright est introuvable : npm i -D playwright (ou NODE_PATH vers une installation globale).'); process.exit(1); }

const scenes = [];
for (const m of ['geoint', 'osint', 'inverse']) scenes.push(...(await import(path.join(ICI, 'scenes', m + '.mjs'))).default);

// Ajoute des blocs texte (tEXt) à un PNG, juste après l'en-tête IHDR.
function pngAvecTextes(png, textes) {
  const blocs = textes.map(([cle, val]) => {
    const donnees = Buffer.concat([Buffer.from(cle, 'latin1'), Buffer.from([0]), Buffer.from(val, 'latin1')]);
    const type = Buffer.from('tEXt', 'latin1');
    const lg = Buffer.alloc(4); lg.writeUInt32BE(donnees.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([type, donnees])) >>> 0);
    return Buffer.concat([lg, type, donnees, crc]);
  });
  const finIHDR = 8 + 8 + png.readUInt32BE(8) + 4;
  return Buffer.concat([png.subarray(0, finIHDR), ...blocs, png.subarray(finIHDR)]);
}

await mkdir(SORTIE, { recursive: true });
const navigateur = await chromium.launch();
const page = await navigateur.newPage();
let n = 0;
for (const s of scenes) {
  for (const v of [{ suffixe: '', ...s }, ...(s.variantes || []).map(x => ({ ...s, ...x }))]) {
    const nom = s.nom + (v.suffixe || '');
    if (filtre && !nom.includes(filtre)) continue;
    const l = v.l, h = v.h;
    const contenu = typeof v.svg === 'function' ? v.svg() : v.svg;
    await page.setViewportSize({ width: l, height: h });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff}svg{display:block}</style></head><body>${contenu}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const clip = v.cadre ? { x: v.cadre[0], y: v.cadre[1], width: v.cadre[2], height: v.cadre[3] } : undefined;
    const fmt = v.format || 'jpg';
    let octets = await page.screenshot({ type: fmt === 'png' ? 'png' : 'jpeg', quality: fmt === 'png' ? undefined : (v.qualite || 86), clip });
    if (v.miroir) {
      // variante retournée horizontalement (pour les défis de vérification)
      await page.setContent(`<!doctype html><html><body style="margin:0"><img id="i" src="data:image/${fmt === 'png' ? 'png' : 'jpeg'};base64,${octets.toString('base64')}" style="display:block;transform:scaleX(-1)"></body></html>`);
      await page.waitForFunction(() => document.getElementById('i').complete);
      const t = await page.evaluate(() => { const i = document.getElementById('i'); return [i.naturalWidth, i.naturalHeight]; });
      await page.setViewportSize({ width: t[0], height: t[1] });
      octets = await page.screenshot({ type: fmt === 'png' ? 'png' : 'jpeg', quality: fmt === 'png' ? undefined : (v.qualite || 86) });
    }
    if (fmt === 'png' && v.textesPNG) octets = pngAvecTextes(octets, v.textesPNG);
    await writeFile(path.join(SORTIE, `${nom}.${fmt}`), octets);
    console.log(`✓ ${nom}.${fmt} (${(octets.length / 1024).toFixed(0)} Ko)`);
    n++;
    if (v.miniature) {
      // vignette légère pour les cartes de l'arène (480 px de large)
      const lm = 480, hm = Math.round(480 * (v.cadre ? v.cadre[3] / v.cadre[2] : h / l));
      await page.setViewportSize({ width: lm, height: hm });
      await page.setContent(`<!doctype html><html><body style="margin:0"><img id="i" src="data:image/${fmt === 'png' ? 'png' : 'jpeg'};base64,${octets.toString('base64')}" style="display:block;width:${lm}px;height:${hm}px;object-fit:cover"></body></html>`);
      await page.waitForFunction(() => document.getElementById('i').complete);
      const mini = await page.screenshot({ type: 'jpeg', quality: 74 });
      await mkdir(path.join(SORTIE, 'mini'), { recursive: true });
      await writeFile(path.join(SORTIE, 'mini', `${nom}.jpg`), mini);
    }
  }
}
await navigateur.close();
console.log(`${n} image(s) rendue(s) dans assets/ctf/scenes/`);
