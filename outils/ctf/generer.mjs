// Génère content/ctf/defis.js (publié) à partir des sources des défis (outils/ctf/source, jamais publiées).
// Les flags deviennent des empreintes SHA-256, les cibles des cartes des ensembles de cellules geohash hachées,
// les writeups, indices et contenus sensibles sont masqués. Vérifie ensuite qu'aucun secret ne fuit.
// Usage : node outils/ctf/generer.mjs
import { writeFile, readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as S from '../../app/ctf/securite.js';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '../..');
const ORDRE = ['geoint', 'exif', 'osm', 'osint', 'inverse', 'crypto', 'stegano', 'web', 'forensique'];
const erreurs = [];

const defis = [];
for (const c of ORDRE) {
  const m = await import(path.join(ICI, 'source', c + '.mjs')).catch(e => { if (e.code === 'ERR_MODULE_NOT_FOUND') return { default: [] }; throw e; });
  defis.push(...m.default);
}

function masquerProfond(v, id) {
  if (Array.isArray(v)) return v.map(x => masquerProfond(x, id));
  if (v && typeof v === 'object') {
    if ('__cache' in v) return typeof v.__cache === 'string' ? { '~': S.masquer(v.__cache, id) } : { '~': S.masquer(JSON.stringify(v.__cache), id), j: 1 };
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, masquerProfond(x, id)]));
  }
  return v;
}

const ids = new Set(), publics = [], solutions = {};
for (const d of defis) {
  const ou = `[${d.id}]`;
  if (!/^[a-z0-9-]+$/.test(d.id || '')) erreurs.push(`${ou} identifiant invalide`);
  if (ids.has(d.id)) erreurs.push(`${ou} identifiant en double`);
  ids.add(d.id);
  for (const k of ['categorie', 'titre', 'accroche', 'briefing', 'writeup', 'validation']) if (!d[k]) erreurs.push(`${ou} champ « ${k} » manquant`);
  if (!ORDRE.includes(d.categorie)) erreurs.push(`${ou} catégorie inconnue`);
  if (![1, 2, 3].includes(d.difficulte)) erreurs.push(`${ou} difficulté invalide`);
  if (!d.indices || d.indices.length < 1 || d.indices.length > 3) erreurs.push(`${ou} il faut 1 à 3 indices`);
  const pub = {
    id: d.id, categorie: d.categorie, titre: d.titre, accroche: d.accroche, difficulte: d.difficulte, points: d.points,
    briefing: d.briefing, ressources: masquerProfond(d.ressources || [], d.id), outils: d.outils || [],
    indices: (d.indices || []).map(i => ({ cout: i.cout, texte: { '~': S.masquer(i.texte, d.id) } })),
    validation: d.validation
  };
  if (d.format) pub.format = d.format;
  // vignette de la carte de l'arène : celle de la première image de scène du défi, si elle existe
  const img0 = (d.ressources || []).find(r => (r.type === 'scene' || r.type === 'image') && typeof r.src === 'string' && r.src.startsWith('assets/ctf/scenes/'));
  const mini = d.miniature || (img0 && ['geoint', 'inverse'].includes(d.categorie) && 'assets/ctf/scenes/mini/' + path.basename(img0.src).replace(/\.\w+$/, '.jpg'));
  if (mini && await stat(path.join(RACINE, mini)).catch(() => null)) pub.miniature = mini;
  const wu = { html: d.writeup, retenir: d.retenir || '' };
  if (d.validation === 'flag') {
    if (!d.flags || !d.flags.length) erreurs.push(`${ou} aucun flag`);
    for (const f of d.flags || []) if (!/^LUMIO\{[^{}]+\}$/.test(f)) erreurs.push(`${ou} flag mal formé : ${f}`);
    pub.h = [...new Set(await Promise.all((d.flags || []).map(f => S.empreinteFlag(d.id, f))))];
    for (const f of d.flags || []) if (!await S.verifierFlag(pub, f)) erreurs.push(`${ou} le flag ${f} ne se vérifie pas`);
    if (await S.verifierFlag(pub, 'LUMIO{faux}')) erreurs.push(`${ou} un faux flag est accepté`);
    solutions[d.id] = { type: 'flag', flags: d.flags };
  } else if (d.validation === 'carte') {
    const c = d.cible;
    if (!c || !c.points || !c.anneaux) { erreurs.push(`${ou} cible manquante`); continue; }
    pub.zones = await S.construireZones(d.id, c.points, c.anneaux);
    pub.vue = d.vue || [30, 10, 2];
    pub.fond = d.fond || 'osm';
    if (d.calque) pub.calque = d.calque;
    wu.lieu = c.lieu; wu.cible = { lat: c.points[0].lat, lon: c.points[0].lon, r: c.anneaux[0].r };
    const v = await S.verifierPosition(pub, c.points[0].lat, c.points[0].lon);
    if (!v || v.anneau !== 0) erreurs.push(`${ou} la cible n'est pas acceptée par ses propres zones`);
    const loin = await S.verifierPosition(pub, -c.points[0].lat, c.points[0].lon + 120);
    if (loin) erreurs.push(`${ou} un point très éloigné est accepté`);
    solutions[d.id] = { type: 'carte', lat: c.points[0].lat, lon: c.points[0].lon, faux: c.faux || { lat: c.points[0].lat + 3, lon: c.points[0].lon + 3 } };
  } else erreurs.push(`${ou} validation inconnue`);
  pub.wu = S.masquer(JSON.stringify(wu), d.id);
  publics.push(pub);
}

const sortie = `// Fichier généré par outils/ctf/generer.mjs à partir des sources des défis : ne pas modifier à la main.
// Aucun flag ni aucune coordonnée cible n'y figure en clair (empreintes SHA-256, cellules geohash hachées, contenus masqués).
export default {
  version: 1,
  defis: [
${publics.map(p => '    ' + JSON.stringify(p)).join(',\n')}
  ]
};
`;

// Contrôle anti-fuite : aucun flag (ni son contenu s'il est assez long) ne doit apparaître dans les fichiers publiés.
const secrets = [];
for (const d of defis) for (const f of d.flags || []) { secrets.push(f, f.toLowerCase()); const inner = f.slice(6, -1); if (inner.length >= 10) secrets.push(inner); }
// (sauf si la cible est un objet parmi d'autres dans un jeu de données fourni : trouver lequel est le défi)
for (const d of defis) if (d.cible && !d.cible.dansLesDonnees) for (const p of d.cible.points) { secrets.push(p.lat.toFixed(4), p.lon.toFixed(4)); }
const fuite = (texte, ou) => { for (const s of secrets) if (texte.toLowerCase().includes(s.toLowerCase())) erreurs.push(`FUITE : « ${s} » apparaît dans ${ou}`); };
fuite(sortie, 'content/ctf/defis.js');
async function parcourir(dossier) {
  for (const n of await readdir(dossier)) {
    const p = path.join(dossier, n), rel = path.relative(RACINE, p);
    if (/^(outils|vendor|\.git|node_modules)(\/|$)/.test(rel) || rel === 'content/ctf/defis.js') continue;
    if ((await stat(p)).isDirectory()) await parcourir(p);
    else if (/\.(js|mjs|css|html|svg|json|geojson|txt|log|md|toml)$/i.test(n)) fuite(await readFile(p, 'utf8'), rel);
  }
}
await parcourir(RACINE);

if (erreurs.length) { console.error('ERREURS :\n - ' + erreurs.join('\n - ')); process.exit(1); }
await writeFile(path.join(RACINE, 'content/ctf/defis.js'), sortie);
await writeFile(path.join(ICI, 'solutions.json'), JSON.stringify(solutions, null, 1) + '\n');
const parCat = Object.fromEntries(ORDRE.map(c => [c, publics.filter(p => p.categorie === c).length]));
console.log(`${publics.length} défis générés`, parCat);
console.log(`content/ctf/defis.js : ${(Buffer.byteLength(sortie) / 1024).toFixed(0)} Ko · aucune fuite détectée.`);
