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
  certificats: {}, // { slug: dateISO }
  ctf: ctfDefaut()  // arène CTF : défis résolus, indices achetés, abandons, classement
});
const ctfDefaut = () => ({
  pseudo: '',
  resolus: {},   // { id: { points, xp, date, duree, indices, essais, anneau } }
  abandons: {},  // { id: date }
  indices: {},   // { id: [index des indices achetés] }
  ouverts: {},   // { id: timestamp de première ouverture }
  essais: {},    // { id: nombre de mauvaises réponses }
  archives: [],  // parties précédentes : { pseudo, points, flags, temps, date }
  amis: []       // cartes de score importées : { pseudo, points, flags, temps, date, ami: true }
});

// (aides déclarées avant le premier chargement, qui les utilise)
const fini = (v, max, min = 0) => { const n = +v; return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; };
const cleOk = k => /^[\w-]{1,100}$/.test(k);
const objet = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};

let etat = charger();

function charger() {
  try {
    const brut = localStorage.getItem(KEY);
    if (!brut) return defaut();
    const obj = JSON.parse(brut);
    return normaliser(Object.assign(defaut(), obj));
  } catch { return defaut(); }
}
// Une progression importée vient d'un fichier : chaque champ de l'arène est contrôlé (types, bornes).
export function normaliserCarte(c) {
  return { pseudo: String((c && c.pseudo) || 'Anonyme').slice(0, 32), points: Math.round(fini(c && c.points, 1e6)), flags: Math.round(fini(c && c.flags, 1e4)), temps: Math.round(fini(c && c.temps, 1e9)), date: String((c && c.date) || '').slice(0, 40) };
}
function normaliser(e) {
  const c = objet(e.ctf), n = ctfDefaut();
  n.pseudo = String(c.pseudo || '').slice(0, 32);
  for (const [id, r] of Object.entries(objet(c.resolus))) if (cleOk(id) && r && typeof r === 'object') {
    n.resolus[id] = { points: Math.round(fini(r.points, 10000)), xp: Math.round(fini(r.xp, 5000)), date: String(r.date || '').slice(0, 40), duree: Math.round(fini(r.duree, 1e8)), indices: Math.round(fini(r.indices, 3)), essais: Math.round(fini(r.essais, 1e6)), anneau: r.anneau === null || r.anneau === undefined ? null : Math.round(fini(r.anneau, 10)), carte: !!r.carte, abandon: !!r.abandon };
    if (typeof r.k === 'string' && /^[A-Za-z0-9+/=]{40,48}$/.test(r.k)) n.resolus[id].k = r.k;
  }
  for (const [id, v] of Object.entries(objet(c.abandons))) if (cleOk(id)) n.abandons[id] = String(v || '1').slice(0, 40);
  for (const [id, v] of Object.entries(objet(c.indices))) if (cleOk(id) && Array.isArray(v)) n.indices[id] = [...new Set(v.map(x => Math.round(fini(x, 2))))].sort();
  for (const [id, v] of Object.entries(objet(c.ouverts))) if (cleOk(id)) n.ouverts[id] = fini(v, 1e14);
  for (const [id, v] of Object.entries(objet(c.essais))) if (cleOk(id)) n.essais[id] = Math.round(fini(v, 1e6));
  n.archives = (Array.isArray(c.archives) ? c.archives : []).slice(0, 200).map(normaliserCarte);
  n.amis = (Array.isArray(c.amis) ? c.amis : []).slice(0, 500).map(a => ({ ...normaliserCarte(a), ami: true }));
  e.ctf = n;
  if (!Array.isArray(e.badges)) e.badges = [];
  e.badges = e.badges.filter(b => typeof b === 'string');
  return e;
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
  { id: 'ctf-premier', e: '🚩', nom: 'Premier flag', desc: 'Un défi CTF résolu', ctf: true },
  { id: 'ctf-10', e: '🗝️', nom: 'Chasseur de flags', desc: '10 défis CTF résolus', ctf: true },
  { id: 'ctf-25', e: '🛰️', nom: 'Analyste', desc: '25 défis CTF résolus', ctf: true },
  { id: 'ctf-autonome', e: '🧠', nom: 'Autonome', desc: '5 défis résolus sans indice', ctf: true },
  { id: 'ctf-oeil', e: '🎯', nom: 'Œil de lynx', desc: 'Plein score du premier coup sur une géolocalisation', ctf: true },
  { id: 'ctf-touche-a-tout', e: '🧭', nom: 'Touche-à-tout', desc: 'Un défi dans chaque catégorie', ctf: true },
  { id: 'ctf-geoint', e: '🗺️', nom: 'Géolocalisateur', desc: 'Toute la catégorie géolocalisation', ctf: true },
  { id: 'ctf-crypto', e: '🔐', nom: 'Cryptanalyste', desc: 'Toute la catégorie crypto', ctf: true },
  { id: 'ctf-osint', e: '🔎', nom: 'Enquêteur', desc: 'Toute la catégorie OSINT', ctf: true },
  { id: 'ctf-1000', e: '🏅', nom: '1000 points CTF', desc: 'Mille points dans l\'arène', ctf: true },
  { id: 'ctf-tout', e: '👑', nom: 'Maître de l\'arène', desc: 'Tous les défis de l\'arène résolus', ctf: true },
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
    // Badges de l'arène CTF : seuls comptent les défis officiels (et ceux du propriétaire du site)
    // résolus sans avoir lu le writeup avant ; un pack créé soi-même ne rapporte aucun badge.
    const r = this.ctfMerites(), ids = Object.keys(r);
    test('ctf-premier', ids.length >= 1);
    test('ctf-10', ids.length >= 10);
    test('ctf-25', ids.length >= 25);
    test('ctf-autonome', ids.filter(id => !r[id].indices).length >= 5);
    test('ctf-oeil', ids.some(id => r[id].anneau === 0 && r[id].essais === 0 && r[id].carte && !r[id].indices));
    test('ctf-1000', this.ctfPoints() >= 1000);
    const cx = this.contexteCTF;
    if (cx) {
      const fini = cat => (cx.categories[cat] || []).length > 0 && cx.categories[cat].every(id => r[id]);
      test('ctf-touche-a-tout', Object.keys(cx.categories).every(cat => cx.categories[cat].some(id => r[id])));
      test('ctf-geoint', fini('geoint'));
      test('ctf-crypto', fini('crypto'));
      test('ctf-osint', fini('osint'));
      test('ctf-tout', cx.tous.length > 0 && cx.tous.every(id => r[id]));
    }
    if (gagnes.length) sauver();
    return gagnes;
  },

  /* ----- arène CTF ----- */
  contexteCTF: null,
  get ctf() { return etat.ctf; },
  // résolutions qui comptent pour le score et les badges : hors packs d'amis (identifiants « p-… ») et hors abandons
  ctfMerites() { return Object.fromEntries(Object.entries(etat.ctf.resolus).filter(([id, x]) => !id.startsWith('p-') && !x.abandon)); },
  ctfPoints() { return Object.values(this.ctfMerites()).reduce((a, x) => a + (x.points || 0), 0); },
  ctfTemps() { return Object.values(this.ctfMerites()).reduce((a, x) => a + (x.duree || 0), 0); },
  ctfResolu(id) { return etat.ctf.resolus[id] || null; },
  ctfAbandonne(id) { return !!etat.ctf.abandons[id]; },
  ctfOuvrir(id) {
    if (!etat.ctf.ouverts[id] && !etat.ctf.resolus[id]) { etat.ctf.ouverts[id] = Date.now(); sauver(); }
  },
  ctfIndices(id) { return etat.ctf.indices[id] || []; },
  ctfAcheterIndice(id, n) {
    const l = etat.ctf.indices[id] = etat.ctf.indices[id] || [];
    if (!l.includes(n)) { l.push(n); l.sort(); sauver(); }
  },
  ctfEssais(id) { return etat.ctf.essais[id] || 0; },
  ctfMauvaiseReponse(id) { etat.ctf.essais[id] = (etat.ctf.essais[id] || 0) + 1; this.activite(); sauver(); return etat.ctf.essais[id]; },
  ctfAbandonner(id) {
    if (!etat.ctf.abandons[id] && !etat.ctf.resolus[id]) { etat.ctf.abandons[id] = new Date().toISOString(); sauver(); }
  },
  // Enregistre une réussite. Un défi abandonné peut être résolu ensuite, mais ne rapporte plus de points.
  ctfResoudre(id, { points, anneau = null, carte = false }) {
    if (etat.ctf.resolus[id]) return null;
    const abandon = !!etat.ctf.abandons[id];
    const pts = abandon ? 0 : Math.max(0, Math.round(points));
    const xp = Math.round(pts / 2);
    const debut = etat.ctf.ouverts[id] || Date.now();
    etat.ctf.resolus[id] = { points: pts, xp, date: new Date().toISOString(), duree: Math.max(1, Math.round((Date.now() - debut) / 1000)), indices: this.ctfIndices(id).length, essais: this.ctfEssais(id), anneau, carte, abandon };
    etat.xp += xp;
    this.activite(); sauver();
    return etat.ctf.resolus[id];
  },
  ctfCle(id, cle) { if (etat.ctf.resolus[id] && typeof cle === 'string') { etat.ctf.resolus[id].k = cle; sauver(); } },
  // Oublie tout ce qui concerne ces défis (pack supprimé).
  ctfOublier(ids) {
    for (const id of ids) for (const k of ['resolus', 'abandons', 'indices', 'ouverts', 'essais']) delete etat.ctf[k][id];
    sauver();
  },
  ctfPseudo(v) { if (v !== undefined) { etat.ctf.pseudo = String(v).slice(0, 32); sauver(); } return etat.ctf.pseudo; },
  ctfCarteScore() {
    return { format: 'lumio-ctf-score', version: 1, pseudo: etat.ctf.pseudo || etat.nom || 'Anonyme', points: this.ctfPoints(), flags: Object.keys(this.ctfMerites()).length, temps: this.ctfTemps(), date: new Date().toISOString() };
  },
  ctfAjouterAmi(carte) {
    if (!carte || carte.format !== 'lumio-ctf-score') throw new Error('Ce fichier n\'est pas une carte de score Lumio CTF');
    for (const k of ['points', 'flags', 'temps']) if (carte[k] !== undefined && !Number.isFinite(+carte[k])) throw new Error(`valeur « ${k} » invalide`);
    const e = { ...normaliserCarte(carte), ami: true };
    etat.ctf.amis = etat.ctf.amis.filter(a => a.pseudo !== e.pseudo);
    etat.ctf.amis.push(e); sauver();
    return e;
  },
  ctfRetirerAmi(pseudo) { etat.ctf.amis = etat.ctf.amis.filter(a => a.pseudo !== pseudo); sauver(); },
  // Archive la partie en cours dans le classement local et repart de zéro (les XP déjà gagnés restent).
  ctfNouvellePartie() {
    const c = this.ctfCarteScore();
    if (c.flags) etat.ctf.archives.push({ pseudo: c.pseudo, points: c.points, flags: c.flags, temps: c.temps, date: c.date });
    etat.ctf = Object.assign(ctfDefaut(), { pseudo: etat.ctf.pseudo, archives: etat.ctf.archives, amis: etat.ctf.amis });
    sauver();
  },

  exporter() { return JSON.stringify(etat, null, 2); },
  importer(json) {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object' || !('lecons' in obj)) throw new Error('Fichier de progression invalide');
    etat = normaliser(Object.assign(defaut(), obj)); sauver();
  },
  reinitialiser() { etat = defaut(); sauver(); }
};
