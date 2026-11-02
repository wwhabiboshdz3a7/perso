// Construit le pack « Mes photos » publié (assets/ctf/photos/defis.json) à partir de outils/ctf/mes-photos.json,
// qui contient les réponses en clair et n'est jamais publié (règle netlify.toml sur /outils/*).
// Usage : 1. dépose tes images dans assets/ctf/photos/ ; 2. décris tes défis dans outils/ctf/mes-photos.json ;
//         3. node outils/ctf/photos.mjs
import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { genererPack } from '../../app/ctf/packs.js';
import * as S from '../../app/ctf/securite.js';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '../..');
const source = JSON.parse(await readFile(path.join(ICI, 'mes-photos.json'), 'utf8'));
const erreurs = [];
for (const [i, d] of source.defis.entries()) {
  const ou = `défi ${i + 1} (${d.titre || 'sans titre'})`;
  if (!d.titre || !d.briefing) erreurs.push(`${ou} : titre et briefing obligatoires`);
  if (d.image) await access(path.join(RACINE, d.image)).catch(() => erreurs.push(`${ou} : image introuvable ${d.image}`));
  if (d.image && !/^assets\/ctf\/photos\/[\w\-./]+\.(jpe?g|png|webp|gif)$/i.test(d.image)) erreurs.push(`${ou} : l'image doit être dans assets/ctf/photos/`);
  if (d.validation === 'carte' && !(Number.isFinite(d.lat) && Number.isFinite(d.lon) && d.rayon > 0)) erreurs.push(`${ou} : lat, lon et rayon (m) obligatoires`);
  if (d.validation !== 'carte' && !d.flag) erreurs.push(`${ou} : flag obligatoire (ex. LUMIO{reponse})`);
  d.indices = (d.indices || []).slice(0, 3);
  d.categorie = d.categorie || 'geoint';
}
if (erreurs.length) { console.error('ERREURS :\n - ' + erreurs.join('\n - ')); process.exit(1); }

const pack = await genererPack({ titre: source.titre || 'Mes photos', auteur: source.auteur || '', proprietaire: true, defis: source.defis });
pack.id = 'mes-photos';
await writeFile(path.join(RACINE, 'assets/ctf/photos/defis.json'), JSON.stringify(pack, null, 1) + '\n');

// Solutions pour les tests automatiques (restent dans outils/)
const solutions = {};
for (const [i, d] of source.defis.entries()) {
  const id = pack.defis[i].id;
  solutions[id] = d.validation === 'carte' ? { type: 'carte', lat: d.lat, lon: d.lon, faux: { lat: -d.lat, lon: d.lon + 120 } } : { type: 'flag', flags: [S.normaliserFlag(d.flag)] };
}
await writeFile(path.join(ICI, 'solutions-photos.json'), JSON.stringify(solutions, null, 1) + '\n');
console.log(`${pack.defis.length} défi(s) écrit(s) dans assets/ctf/photos/defis.json`);
