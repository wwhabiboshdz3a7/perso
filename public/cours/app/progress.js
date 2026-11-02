// Progression de l'élève, stockée dans le navigateur (localStorage). Exportable en JSON.
// Tout état lu (stockage ou fichier importé) est validé et normalisé : un fichier abîmé ou
// malveillant ne peut ni bloquer l'espace membre ni injecter de balisage.
const KEY = 'levier.progression';

const nouvelleGraine = () => Math.random().toString(36).slice(2, 12).padEnd(8, '0');
const defaut = () => ({
  version: 1,
  nom: '',
  xp: 0,
  graine: nouvelleGraine(), // ordre d'affichage des réponses des quiz, propre à chaque élève
  lecons: {},      // { m2: { "3": horodatage } }
  exercices: {},   // { "m2/3": { reussi: true, echecs: 2 } }
  quiz: {},        // { "m2/3": { score: 2, total: 3 } }
  checklists: {},  // { "m2/3": [true, false…] } ou { "res/onboarding": [...] }
  jours: [],
  badges: [],
  certificats: {}  // { m2: dateISO, formation: dateISO }
});

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

/* ---------- validation du schéma ---------- */
const estObjet = v => !!v && typeof v === 'object' && !Array.isArray(v);
const entier = (v, min, max) => Number.isFinite(v) ? Math.min(Math.max(Math.round(v), min), max) : null;
const RE_MODULE = /^[a-z0-9-]{1,20}$/;
const RE_INDEX = /^\d{1,3}$/;
const RE_CLE = /^[a-z0-9-]{1,20}\/[a-z0-9-]{1,20}$/;
const RE_JOUR = /^\d{4}-\d{2}-\d{2}$/;
const dateValide = v => typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));
function filtrer(obj, reCle, valeur, max = 500) {
  const res = {};
  if (!estObjet(obj)) return res;
  for (const [k, v] of Object.entries(obj).slice(0, max)) {
    if (!reCle.test(k)) continue;
    const x = valeur(v);
    if (x !== undefined) res[k] = x;
  }
  return res;
}

/** Normalise un état quelconque. Lève une erreur si ce n'est manifestement pas une progression. */
export function normaliser(brut) {
  if (!estObjet(brut) || !estObjet(brut.lecons)) throw new Error('fichier de progression invalide');
  const d = defaut();
  const ids = new Set(BADGES.map(b => b.id));
  return {
    version: 1,
    nom: typeof brut.nom === 'string' ? brut.nom.slice(0, 80) : '',
    xp: entier(brut.xp, 0, 10_000_000) ?? 0,
    graine: typeof brut.graine === 'string' && /^[a-z0-9]{6,32}$/.test(brut.graine) ? brut.graine : d.graine,
    lecons: filtrer(brut.lecons, RE_MODULE, v => {
      const l = filtrer(v, RE_INDEX, t => entier(t, 0, 9e15) ?? undefined, 100);
      return Object.keys(l).length ? l : undefined;
    }, 50),
    exercices: filtrer(brut.exercices, RE_CLE, v => estObjet(v) ? { reussi: v.reussi === true, echecs: entier(v.echecs, 0, 10000) ?? 0 } : undefined),
    quiz: filtrer(brut.quiz, RE_CLE, v => {
      if (!estObjet(v)) return undefined;
      const total = entier(v.total, 1, 100), score = entier(v.score, 0, 100);
      return total && score !== null ? { score: Math.min(score, total), total } : undefined;
    }),
    checklists: filtrer(brut.checklists, RE_CLE, v => Array.isArray(v) ? v.slice(0, 100).map(x => x === true) : undefined),
    jours: Array.isArray(brut.jours) ? [...new Set(brut.jours.filter(j => typeof j === 'string' && RE_JOUR.test(j)))].sort().slice(-2000) : [],
    badges: Array.isArray(brut.badges) ? [...new Set(brut.badges.filter(b => ids.has(b)))] : [],
    certificats: filtrer(brut.certificats, RE_MODULE, v => dateValide(v) ? v : undefined, 50)
  };
}

let etat = charger();

function charger() {
  try {
    const brut = localStorage.getItem(KEY);
    if (!brut) return defaut();
    return normaliser(JSON.parse(brut));
  } catch { return defaut(); } // stockage illisible : on repart d'un état propre plutôt que de bloquer
}
function sauver() {
  try { localStorage.setItem(KEY, JSON.stringify(etat)); } catch { /* stockage indisponible */ }
}
const jourISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const progression = {
  get etat() { return etat; },
  get nom() { return etat.nom; },
  set nom(v) { etat.nom = String(v || '').slice(0, 80); sauver(); },
  get graine() { if (!etat.graine) { etat.graine = nouvelleGraine(); sauver(); } return etat.graine; },

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
  /** Le meilleur score du quiz atteint-il la moitié des questions ? */
  quizReussi(cle) { const q = etat.quiz[cle]; return !!q && q.total > 0 && q.score * 2 >= q.total; },
  scoreQuiz(cle, score, total) {
    const ancien = etat.quiz[cle];
    if (!ancien || score > ancien.score) {
      etat.quiz[cle] = { score, total };
      etat.xp += (score - (ancien ? ancien.score : 0)) * 10;
    }
    this.activite(); sauver();
  },
  /**
   * Leçon réussie au sens du certificat : terminée, exercice réussi (s'il y en a un) et quiz
   * réussi (s'il y en a un). Le marquage manuel seul compte pour la progression, pas pour le certificat.
   */
  leconReussie(mod, idx, lecon = {}) {
    const cle = `${mod}/${idx}`;
    return this.leconFaite(mod, idx) && (!lecon.exercice || this.exercice(cle).reussi) && (!lecon.quiz || this.quizReussi(cle));
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
    let obj;
    try { obj = JSON.parse(json); } catch { throw new Error('ce fichier n\'est pas un JSON lisible'); }
    etat = normaliser(obj); sauver();
  },
  reinitialiser() { etat = defaut(); sauver(); }
};
