// Vérifie que chaque parcours se charge et compte modules, leçons, exercices et quiz,
// puis contrôle l'arène CTF (défis, catégories, fichiers référencés, pack « Mes photos »).
// Usage : node outils/stats.mjs
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parcours } from '../content/index.js';
import { CATEGORIES, DIFFICULTES } from '../content/ctf/categories.js';
import { ouvrir, wfValide } from '../app/ctf/securite.js';
import { normaliserPack } from '../app/ctf/packs.js';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let totaux = { modules: 0, lecons: 0, exercices: 0, questions: 0, mots: 0 };
const types = {};
const erreurs = [];
for (const p of parcours) {
  const mod = await p.charger();
  const d = mod.default;
  let lecons = 0, exercices = 0, questions = 0, mots = 0;
  d.modules.forEach((m, mi) => m.lecons.forEach((l, li) => {
    lecons++;
    if (!l.titre || !l.theorie) erreurs.push(`${p.slug} m${mi + 1} l${li + 1} : titre ou théorie manquant`);
    mots += l.theorie.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (l.exercice) {
      exercices++;
      types[l.exercice.type] = (types[l.exercice.type] || 0) + 1;
      if (l.exercice.type === 'code' && (!l.exercice.tests || !l.exercice.tests.length)) erreurs.push(`${p.slug} ${l.titre} : exercice code sans tests`);
      if (l.exercice.type === 'code' && !l.exercice.solution) erreurs.push(`${p.slug} ${l.titre} : exercice sans solution`);
    }
    if (l.quiz) {
      questions += l.quiz.length;
      l.quiz.forEach(q => { if (q.bonne === undefined || q.bonne >= q.options.length) erreurs.push(`${p.slug} ${l.titre} : quiz invalide`); });
    }
  }));
  console.log(`${p.slug.padEnd(10)} ${String(d.modules.length).padStart(2)} modules  ${String(lecons).padStart(3)} leçons  ${String(exercices).padStart(3)} exercices  ${String(questions).padStart(3)} questions  ~${mots} mots`);
  totaux.modules += d.modules.length; totaux.lecons += lecons; totaux.exercices += exercices; totaux.questions += questions; totaux.mots += mots;
}
console.log('-'.repeat(80));
console.log(`TOTAL      ${totaux.modules} modules  ${totaux.lecons} leçons  ${totaux.exercices} exercices  ${totaux.questions} questions de quiz  ~${totaux.mots} mots de théorie`);
console.log('Types d\'exercices :', types);

/* ---------- arène CTF ---------- */
const { default: index } = await import('../content/ctf/index.js');
const defis = [];
for (const e of index.defis) {
  const d = JSON.parse(await readFile(path.join(RACINE, 'content/ctf/defis', e.id + '.json'), 'utf8').catch(() => 'null'));
  if (!d) { erreurs.push(`CTF ${e.id} : fichier content/ctf/defis/${e.id}.json introuvable`); continue; }
  for (const k of ['categorie', 'titre', 'points', 'validation']) if (d[k] !== e[k]) erreurs.push(`CTF ${e.id} : index et fichier du défi divergent (${k})`);
  defis.push(d);
}
console.log('\nArène CTF');
console.log('-'.repeat(80));
const fichiers = new Set();
const collecter = v => {
  if (Array.isArray(v)) return v.forEach(collecter);
  if (v && typeof v === 'object') return Object.entries(v).forEach(([k, x]) => { if (['src', 'miniature', 'image', 'calque'].includes(k) && typeof x === 'string' && x.startsWith('assets/')) fichiers.add(x); collecter(x); });
};
for (const c of CATEGORIES) {
  const l = defis.filter(d => d.categorie === c.id);
  const parDiff = Object.keys(DIFFICULTES).map(k => l.filter(d => String(d.difficulte) === k).length).join('/');
  console.log(`${c.court.padEnd(11)} ${String(l.length).padStart(2)} défis  ${String(l.reduce((a, d) => a + d.points, 0)).padStart(5)} pts  difficultés ${parDiff}  ${l.filter(d => d.validation === 'carte').length} sur carte`);
  if (!l.length) erreurs.push(`CTF : catégorie ${c.id} vide`);
}
for (const d of defis) {
  if (d.validation === 'flag' && !(d.h || []).length) erreurs.push(`CTF ${d.id} : aucune empreinte de flag`);
  if (d.validation === 'flag' && !wfValide(d.wf)) erreurs.push(`CTF ${d.id} : writeup chiffré absent ou mal formé`);
  if (d.validation === 'carte' && !(d.zones || []).length) erreurs.push(`CTF ${d.id} : aucune zone acceptée`);
  if (!d.wu || !(d.indices || []).length) erreurs.push(`CTF ${d.id} : writeup ou indices manquants`);
  collecter(ouvrir(d.ressources || [], d.id));
  if (d.calque) fichiers.add(d.calque);
  if (d.miniature) fichiers.add(d.miniature);
}
const photos = JSON.parse(await readFile(path.join(RACINE, 'assets/ctf/photos/defis.json'), 'utf8'));
const persos = normaliserPack(photos, 'photos');
persos.forEach(d => collecter(d.ressources));
for (const f of fichiers) await access(path.join(RACINE, f)).catch(() => erreurs.push(`CTF : fichier introuvable ${f}`));
console.log('-'.repeat(80));
console.log(`TOTAL      ${defis.length} défis officiels · ${defis.reduce((a, d) => a + d.points, 0)} points · ${defis.filter(d => d.validation === 'carte').length} géolocalisations sur carte · ${fichiers.size} fichiers référencés, tous présents`);
console.log(`Mes photos : ${persos.length} défi(s) dans assets/ctf/photos/defis.json${persos.length ? '' : ' (catégorie masquée tant qu\'il est vide : voir outils/ctf/mes-photos.exemple.json)'}`);
if (defis.length < 40) erreurs.push('CTF : moins de 40 défis');

if (erreurs.length) { console.log('ERREURS :'); erreurs.forEach(e => console.log(' -', e)); process.exit(1); }
console.log('Tous les parcours et tous les défis se chargent correctement.');
