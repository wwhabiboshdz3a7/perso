// Progression de l'élève, stockée dans le navigateur (localStorage). Exportable en JSON.
const KEY = 'levier.progression';

const defaut = () => ({
  version: 1,
  nom: '',
  xp: 0,
  lecons: {},      // { m2: { "3": horodatage } }
  exercices: {},   // { "m2/3": { reussi: true, echecs: 2 } }
  quiz: {},        // { "m2/3": { score: 2, total: 3 } }
  checklists: {},  // { "m2/3": [true, false…] } ou { "res/onboarding": [...] }
  jours: [],
  badges: [],
  certificats: {}  // { m2: dateISO, formation: dateISO }
});

let etat = charger();

function charger() {
  try {
    const brut = localStorage.getItem(KEY);
    return brut ? Object.assign(defaut(), JSON.parse(brut)) : defaut();
  } catch { return defaut(); }
}
function sauver() {
  try { localStorage.setItem(KEY, JSON.stringify(etat)); } catch { /* stockage indisponible */ }
}
const jourISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const BADGES = [
  { id: 'premier-pas', nom: 'Premier pas', desc: 'Première leçon terminée' },
  { id: 'serie-3', nom: 'Régularité', desc: '3 jours d\'affilée' },
  { id: 'serie-7', nom: 'Semaine complète', desc: '7 jours d\'affilée' },
  { id: 'quiz-parfait', nom: 'Sans faute', desc: 'Un quiz 100 % juste' },
  { id: 'exercices-10', nom: 'Praticien', desc: '10 exercices validés' },
  { id: 'module', nom: 'Module bouclé', desc: 'Un module terminé à 100 %' },
  { id: 'xp-1000', nom: '1 000 XP', desc: 'Mille points d\'expérience' },
  { id: 'formation', nom: 'Diplômé', desc: 'Toute la formation terminée' }
];

export const progression = {
  get etat() { return etat; },
  get nom() { return etat.nom; },
  set nom(v) { etat.nom = String(v || '').slice(0, 80); sauver(); },

  activite() {
    const j = jourISO(new Date());
    if (!etat.jours.includes(j)) { etat.jours.push(j); etat.jours.sort(); }
  },
  serie() {
    const set = new Set(etat.jours);
    const d = new Date();
    if (!set.has(jourISO(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (set.has(jourISO(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  },

  leconFaite(mod, idx) { return !!etat.lecons[mod]?.[idx]; },
  marquerLecon(mod, idx, total) {
    const nouveau = !this.leconFaite(mod, idx);
    etat.lecons[mod] = etat.lecons[mod] || {};
    etat.lecons[mod][idx] = Date.now();
    if (nouveau) etat.xp += 50;
    if (total && this.nbLecons(mod) >= total && !etat.certificats[mod]) etat.certificats[mod] = new Date().toISOString();
    this.activite(); sauver();
    return nouveau;
  },
  nbLecons(mod) { return Object.keys(etat.lecons[mod] || {}).length; },
  totalLecons() { return Object.values(etat.lecons).reduce((a, o) => a + Object.keys(o).length, 0); },

  exercice(cle) { return etat.exercices[cle] || { reussi: false, echecs: 0 }; },
  echecExercice(cle) {
    const e = etat.exercices[cle] = etat.exercices[cle] || { reussi: false, echecs: 0 };
    e.echecs++; sauver(); return e;
  },
  reussiteExercice(cle, xp = 30) {
    const e = etat.exercices[cle] = etat.exercices[cle] || { reussi: false, echecs: 0 };
    const nouveau = !e.reussi;
    e.reussi = true;
    if (nouveau) etat.xp += xp;
    this.activite(); sauver();
    return nouveau;
  },
  nbExercices() { return Object.values(etat.exercices).filter(e => e.reussi).length; },

  quiz(cle) { return etat.quiz[cle]; },
  scoreQuiz(cle, score, total) {
    const ancien = etat.quiz[cle];
    if (!ancien || score > ancien.score) {
      etat.quiz[cle] = { score, total };
      etat.xp += (score - (ancien ? ancien.score : 0)) * 10;
    }
    this.activite(); sauver();
  },

  checklist(cle, n) {
    const l = etat.checklists[cle] || [];
    return Array.from({ length: n }, (_, i) => !!l[i]);
  },
  cocher(cle, i, valeur, n) {
    const l = this.checklist(cle, n);
    l[i] = !!valeur;
    etat.checklists[cle] = l;
    sauver();
    return l;
  },

  certifierFormation() {
    if (!etat.certificats.formation) { etat.certificats.formation = new Date().toISOString(); sauver(); }
  },

  verifierBadges() {
    const gagnes = [];
    const test = (id, cond) => { if (cond && !etat.badges.includes(id)) { etat.badges.push(id); gagnes.push(BADGES.find(b => b.id === id)); } };
    test('premier-pas', this.totalLecons() >= 1);
    test('serie-3', this.serie() >= 3);
    test('serie-7', this.serie() >= 7);
    test('quiz-parfait', Object.values(etat.quiz).some(q => q.total > 0 && q.score === q.total));
    test('exercices-10', this.nbExercices() >= 10);
    test('module', Object.keys(etat.certificats).some(k => k !== 'formation'));
    test('xp-1000', etat.xp >= 1000);
    test('formation', !!etat.certificats.formation);
    if (gagnes.length) sauver();
    return gagnes;
  },

  exporter() { return JSON.stringify(etat, null, 2); },
  importer(json) {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object' || !('lecons' in obj)) throw new Error('fichier de progression invalide');
    etat = Object.assign(defaut(), obj); sauver();
  },
  reinitialiser() { etat = defaut(); sauver(); }
};
