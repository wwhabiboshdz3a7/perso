// Progression de l'apprenant : stockée dans localStorage (aucun serveur).
const KEY = 'lumio.progress';

const defaut = () => ({
  version: 1,
  nom: '',
  xp: 0,
  lecons: {},      // { slug: { "3": timestamp } }
  exercices: {},   // { "slug/3": { reussi: true, echecs: 2 } }
  quiz: {},        // { "slug/3": { score: 2, total: 3 } }
  jours: [],       // dates ISO (AAAA-MM-JJ) d'activité
  badges: [],      // identifiants des badges obtenus
  certificats: {}  // { slug: dateISO }
});

let etat = charger();

function charger() {
  try {
    const brut = localStorage.getItem(KEY);
    if (!brut) return defaut();
    const obj = JSON.parse(brut);
    return Object.assign(defaut(), obj);
  } catch { return defaut(); }
}
function sauver() {
  try { localStorage.setItem(KEY, JSON.stringify(etat)); } catch { /* stockage indisponible */ }
}
const aujourdhui = () => new Date().toISOString().slice(0, 10);

export const BADGES = [
  { id: 'premier-pas', e: '🌱', nom: 'Premier pas', desc: 'Première leçon terminée' },
  { id: 'serie-3', e: '🔥', nom: 'Série de 3', desc: '3 jours d\'affilée' },
  { id: 'serie-7', e: '⚡', nom: 'Semaine complète', desc: '7 jours d\'affilée' },
  { id: 'exo-10', e: '🧪', nom: 'Expérimentateur', desc: '10 exercices réussis' },
  { id: 'exo-50', e: '🔬', nom: 'Chercheur', desc: '50 exercices réussis' },
  { id: 'quiz-parfait', e: '🎯', nom: 'Sans faute', desc: 'Un quiz 100 % juste' },
  { id: 'xp-1000', e: '💎', nom: '1000 XP', desc: 'Mille points d\'expérience' },
  { id: 'polyglotte', e: '🌍', nom: 'Polyglotte', desc: '3 parcours commencés' },
  { id: 'parcours', e: '🏆', nom: 'Parcours complet', desc: 'Un parcours terminé à 100 %' },
];

export const progression = {
  get etat() { return etat; },
  get nom() { return etat.nom; },
  set nom(v) { etat.nom = v; sauver(); },

  activite() {
    const j = aujourdhui();
    if (!etat.jours.includes(j)) { etat.jours.push(j); etat.jours.sort(); }
  },
  streak() {
    if (!etat.jours.length) return 0;
    const set = new Set(etat.jours);
    let d = new Date();
    let n = 0;
    // Le streak reste valide si l'activité date d'hier.
    if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
    while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  },
  ajouterXP(n) { etat.xp += n; this.activite(); sauver(); return etat.xp; },

  leconFaite(slug, idx) { return !!(etat.lecons[slug] && etat.lecons[slug][idx]); },
  marquerLecon(slug, idx, nbTotal) {
    const nouveau = !this.leconFaite(slug, idx);
    etat.lecons[slug] = etat.lecons[slug] || {};
    etat.lecons[slug][idx] = Date.now();
    this.activite();
    if (nouveau) etat.xp += 50;
    if (nbTotal && this.nbLecons(slug) >= nbTotal && !etat.certificats[slug]) {
      etat.certificats[slug] = new Date().toISOString();
    }
    sauver();
    return nouveau;
  },
  nbLecons(slug) { return Object.keys(etat.lecons[slug] || {}).length; },
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

  // Calcule les badges nouvellement gagnés et renvoie leur liste.
  verifierBadges(nbParcoursTermines) {
    const gagnes = [];
    const test = (id, cond) => { if (cond && !etat.badges.includes(id)) { etat.badges.push(id); gagnes.push(BADGES.find(b => b.id === id)); } };
    test('premier-pas', this.totalLecons() >= 1);
    test('serie-3', this.streak() >= 3);
    test('serie-7', this.streak() >= 7);
    test('exo-10', this.nbExercices() >= 10);
    test('exo-50', this.nbExercices() >= 50);
    test('quiz-parfait', Object.values(etat.quiz).some(q => q.total > 0 && q.score === q.total));
    test('xp-1000', etat.xp >= 1000);
    test('polyglotte', Object.keys(etat.lecons).length >= 3);
    test('parcours', nbParcoursTermines >= 1 || Object.keys(etat.certificats).length >= 1);
    if (gagnes.length) sauver();
    return gagnes;
  },

  exporter() { return JSON.stringify(etat, null, 2); },
  importer(json) {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object' || !('lecons' in obj)) throw new Error('Fichier de progression invalide');
    etat = Object.assign(defaut(), obj); sauver();
  },
  reinitialiser() { etat = defaut(); sauver(); }
};
