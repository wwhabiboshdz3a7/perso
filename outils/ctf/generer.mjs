// Génère l'arène publiée à partir des sources des défis (outils/ctf/source, jamais publiées) :
//  - content/ctf/index.js : index léger (titres, accroches, points) pour l'arène et la recherche ;
//  - content/ctf/defis/<id>.json : un fichier par défi, chargé à l'ouverture du défi.
// Les flags deviennent des empreintes SHA-256, les cibles des cartes des ensembles de cellules geohash hachées.
// Le writeup lisible après abandon a ses flags masqués ; le writeup complet est chiffré (AES-GCM, clé dérivée
// du flag) et ne s'ouvre qu'avec le bon flag. Indices et contenus sensibles sont masqués.
// Contrôles : aucun flag (ni son contenu) en clair dans un fichier publié, aucune coordonnée d'interface ou
// d'indice dans une zone acceptée.
// Usage : node outils/ctf/generer.mjs
import { writeFile, readFile, readdir, stat, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as S from '../../app/ctf/securite.js';
import { lireCoordonnees } from '../../app/ctf/coords.js';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '../..');
const ORDRE = ['geoint', 'exif', 'osm', 'osint', 'inverse', 'crypto', 'stegano', 'web', 'forensique'];
const DOSSIER = path.join(RACINE, 'content/ctf/defis');
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
const devoiler = v => Array.isArray(v) ? v.map(devoiler) : v && typeof v === 'object' ? ('__cache' in v ? v.__cache : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, devoiler(x)]))) : v;
// fichiers du site utilisés par un défi (images, jeux de données) : ils contiennent légitimement sa réponse
const fichiersDe = d => {
  const l = new Set();
  const f = v => { if (Array.isArray(v)) v.forEach(f); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { if (['src', 'calque'].includes(k) && typeof x === 'string') l.add(x); f(x); }); };
  f(devoiler(d.ressources || [])); if (d.calque) l.add(d.calque);
  return l;
};

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
    // writeup complet chiffré avec le flag ; version « abandon » sans le flag exact
    pub.wf = await S.chiffrerPourFlags(d.id, JSON.stringify(wu), d.flags || []);
    const formes = (d.flags || []).flatMap(f => [f, S.normaliserFlag(f)]);
    const a = S.masquerFlags(wu.html, formes), b = S.masquerFlags(wu.retenir, formes);
    wu.html = a.html; wu.retenir = b.html; wu.masque = a.n + b.n > 0;
    const reste = (wu.html + ' ' + wu.retenir).match(/LUMIO\{(?!…\}|\.\.\.\})[^}<]{1,80}\}/g) || [];
    for (const r of reste) if (await S.verifierFlag(pub, r)) erreurs.push(`${ou} le writeup « abandon » contient encore un flag accepté : ${r}`);
    for (const f of d.flags || []) { const t = await S.ouvrirAvecFlag(d.id, pub.wf, f); if (!t || JSON.parse(t.texte).html !== d.writeup) erreurs.push(`${ou} le writeup chiffré ne s'ouvre pas avec ${f}`); }
    if (await S.ouvrirAvecFlag(d.id, pub.wf, 'LUMIO{faux}')) erreurs.push(`${ou} le writeup chiffré s'ouvre avec un faux flag`);
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
    const v2 = await S.verifierPosition(pub, c.points[0].lat, c.points[0].lon + 360);
    if (!v2 || v2.anneau !== 0) erreurs.push(`${ou} la cible n'est pas acceptée sur une copie du monde (longitude + 360)`);
    const loin = await S.verifierPosition(pub, -c.points[0].lat, c.points[0].lon + 120);
    if (loin) erreurs.push(`${ou} un point très éloigné est accepté`);
    solutions[d.id] = { type: 'carte', lat: c.points[0].lat, lon: c.points[0].lon, faux: c.faux || { lat: c.points[0].lat + 3, lon: c.points[0].lon + 3 } };
  } else erreurs.push(`${ou} validation inconnue`);
  pub.wu = S.masquer(JSON.stringify(wu), d.id);
  publics.push(pub);
}

/* ---------- contrôles anti-fuite ---------- */
const sansAccent = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// secrets « exacts » (flags) et « mots » (contenu du flag d'au moins 6 caractères, quel que soit le séparateur)
const secrets = [];
for (const d of defis) {
  const publicsOk = new Set((d.motsPublics || []).map(sansAccent));
  for (const f of d.flags || []) {
    secrets.push({ d, exact: f });
    const inner = sansAccent(f.slice(6, -1));
    if (inner.replace(/[^a-z0-9]/g, '').length >= 6 && !publicsOk.has(inner)) secrets.push({ d, mot: inner, long: inner.length >= 10 });
  }
  for (const s of d.sensibles || []) secrets.push({ d, mot: sansAccent(s), long: true });
  if (d.cible && !d.cible.dansLesDonnees) for (const p of d.cible.points) secrets.push({ d, exact: p.lat.toFixed(4) }, { d, exact: p.lon.toFixed(4) });
}
const motif = m => new RegExp('(^|[^a-z0-9])' + m.split(/[^a-z0-9]+/).filter(Boolean).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s_\\-.\'’]*') + '($|[^a-z0-9])');
for (const s of secrets) if (s.mot) s.re = motif(s.mot);
// donneesDefi : fichier d'un défi publié (ses ressources contiennent la réponse) : seuls les flags exacts
// et le contenu long des flags y sont interdits.
function fuite(texte, ou, { donneesDefi = false, fichier = null } = {}) {
  const bas = texte.toLowerCase(), plat = sansAccent(texte);
  for (const s of secrets) {
    if (fichier && fichiersDe(s.d).has(fichier)) continue;
    if (s.exact && bas.includes(s.exact.toLowerCase())) erreurs.push(`FUITE : « ${s.exact} » (${s.d.id}) apparaît dans ${ou}`);
    if (s.re && (!donneesDefi || s.long) && s.re.test(plat)) erreurs.push(`FUITE : la réponse de ${s.d.id} (« ${s.mot} ») apparaît dans ${ou}`);
  }
}
// coordonnées présentes dans un texte (décimales ou DMS) : vérifiées contre toutes les zones acceptées
function coordonnees(texte) {
  const res = [];
  for (const m of texte.matchAll(/(-?\d{1,2}\.\d{2,})\s*[,;]?\s+(-?\d{1,3}\.\d{2,})|(-?\d{1,2}\.\d{2,}),(-?\d{1,3}\.\d{2,})/g)) res.push({ lat: +(m[1] || m[3]), lon: +(m[2] || m[4]), brut: m[0] });
  for (const m of texte.matchAll(/\d{1,3}\s*°[^<>\n]{0,24}?[NS][^<>\n]{0,6}?\d{1,3}\s*°[^<>\n]{0,24}?[EOW]/g)) { const p = lireCoordonnees(m[0].replace(/\\(["'])/g, '$1')); if (p) res.push({ ...p, brut: m[0] }); }
  return res.filter(p => Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180);
}
const cartes = publics.filter(p => p.validation === 'carte');
async function zonesTouchees(texte, ou, { strict = false, fichier = null, seul = null } = {}) {
  for (const p of coordonnees(texte)) for (const z of seul ? [seul] : cartes) {
    if (fichier && fichiersDe(defis.find(x => x.id === z.id)).has(fichier)) continue;
    const v = await S.verifierPosition(z, p.lat, p.lon);
    if (v && (v.part > 0 || strict)) erreurs.push(`COORDONNÉES : « ${p.brut} » dans ${ou} tombe dans une zone acceptée de ${z.id} (${Math.round(v.part * 100)} % des points)`);
  }
}
// un indice ne doit pas donner une position acceptée par son propre défi
for (const d of defis) if (d.validation === 'carte') {
  const pub = publics.find(p => p.id === d.id);
  for (const [n, i] of (d.indices || []).entries()) await zonesTouchees(i.texte, `l'indice ${n + 1} de ${d.id}`, { seul: pub });
}

// mots-clés de recherche : mots (sans accents) du briefing absents du titre et de l'accroche
const motsDe = t => String(t).replace(/<[^>]+>/g, ' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().match(/[a-z0-9][a-z0-9-]{4,}/g) || [];
const VIDES = new Set(['dossier', 'cette', 'dans', 'pour', 'avec', 'mais', 'elle', 'leur', 'sont', 'quel', 'quelle', 'toute', 'toutes', 'aussi', 'comme', 'entre', 'depuis', 'apres', 'avant', 'encore', 'chaque', 'votre', 'notre', 'trouve', 'donne', 'place', 'lumio']);
const index = publics.map(p => {
  const deja = new Set(motsDe(p.titre + ' ' + p.accroche));
  const mots = [...new Set(motsDe(p.briefing))].filter(m => !deja.has(m) && !VIDES.has(m)).slice(0, 40).join(' ');
  return { id: p.id, categorie: p.categorie, titre: p.titre, accroche: p.accroche, difficulte: p.difficulte, points: p.points, validation: p.validation, ...(p.miniature ? { miniature: p.miniature } : {}), mots };
});
const sortieIndex = `// Fichier généré par outils/ctf/generer.mjs à partir des sources des défis : ne pas modifier à la main.
// Index léger de l'arène ; le contenu de chaque défi est dans content/ctf/defis/<id>.json (sans aucune solution en clair).
export default {
  version: 2,
  defis: [
${index.map(p => '    ' + JSON.stringify(p)).join(',\n')}
  ]
};
`;
const fichiersDefis = publics.map(p => [`content/ctf/defis/${p.id}.json`, JSON.stringify(p) + '\n']);
fuite(sortieIndex, 'content/ctf/index.js');
for (const [f, t] of fichiersDefis) fuite(t, f, { donneesDefi: true });

async function parcourir(dossier) {
  for (const n of await readdir(dossier)) {
    const p = path.join(dossier, n), rel = path.relative(RACINE, p).split(path.sep).join('/');
    if (/^(outils|vendor|\.git|node_modules|content\/ctf\/defis)(\/|$)/.test(rel) || rel === 'content/ctf/index.js' || rel === 'content/ctf/defis.js') continue;
    if ((await stat(p)).isDirectory()) await parcourir(p);
    else if (/\.(js|mjs|css|html|svg|json|geojson|txt|log|md|toml|csv|xml)$/i.test(n)) {
      const texte = await readFile(p, 'utf8');
      fuite(texte, rel, { fichier: rel });
      if (!/\.geojson$/i.test(n) && rel !== 'assets/ctf/photos/defis.json') await zonesTouchees(texte, rel, { strict: rel.startsWith('app/') || rel === 'index.html', fichier: rel });
    }
  }
}
await parcourir(RACINE);

if (erreurs.length) { console.error('ERREURS :\n - ' + [...new Set(erreurs)].join('\n - ')); process.exit(1); }
await rm(DOSSIER, { recursive: true, force: true });
await mkdir(DOSSIER, { recursive: true });
for (const [f, t] of fichiersDefis) await writeFile(path.join(RACINE, f), t);
await writeFile(path.join(RACINE, 'content/ctf/index.js'), sortieIndex);
await rm(path.join(RACINE, 'content/ctf/defis.js'), { force: true });
await writeFile(path.join(ICI, 'solutions.json'), JSON.stringify(solutions, null, 1) + '\n');
const parCat = Object.fromEntries(ORDRE.map(c => [c, publics.filter(p => p.categorie === c).length]));
const poids = fichiersDefis.map(([, t]) => Buffer.byteLength(t));
console.log(`${publics.length} défis générés`, parCat);
console.log(`content/ctf/index.js : ${(Buffer.byteLength(sortieIndex) / 1024).toFixed(1)} Ko · défis : ${(poids.reduce((a, b) => a + b, 0) / poids.length / 1024).toFixed(1)} Ko en moyenne (max ${(Math.max(...poids) / 1024).toFixed(0)} Ko) · aucune fuite détectée.`);
