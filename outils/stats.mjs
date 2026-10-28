// Vérifie que chaque parcours se charge et compte modules, leçons, exercices et quiz.
// Usage : node outils/stats.mjs
import { parcours } from '../content/index.js';

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
if (erreurs.length) { console.log('ERREURS :'); erreurs.forEach(e => console.log(' -', e)); process.exit(1); }
console.log('Tous les parcours se chargent correctement.');
