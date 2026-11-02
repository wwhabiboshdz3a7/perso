// Bibliothèque de modèles de requêtes, appelés avec « / » dans la zone de saisie.

import { db } from './db.js';
import { uid } from './util.js';
import { norm } from './memory.js';
import { bus } from './bus.js';

export const DEFAULT_TEMPLATES = [
  { cmd: 'resumer', title: 'Résumer', body: 'Résume le texte suivant en 5 points clés, puis donne la phrase à retenir :\n\n{{texte}}' },
  { cmd: 'corriger', title: 'Corriger', body: "Corrige l'orthographe, la grammaire et la ponctuation sans changer le style. Liste ensuite les corrections importantes :\n\n{{texte}}" },
  { cmd: 'traduire', title: 'Traduire', body: 'Traduis en {{langue}} avec un registre naturel, puis signale les tournures délicates :\n\n{{texte}}' },
  { cmd: 'email', title: 'E-mail pro', body: 'Rédige un e-mail professionnel et chaleureux.\nObjet : {{objet}}\nDestinataire : \nPoints à faire passer : \nTon : cordial et direct.' },
  { cmd: 'expliquer', title: 'Expliquer simplement', body: "Explique-moi simplement {{sujet}} : d'abord une analogie, puis un exemple concret, puis les pièges courants." },
  { cmd: 'idees', title: 'Trouver des idées', body: 'Donne-moi 10 idées originales pour {{sujet}}, classées de la plus simple à la plus ambitieuse, avec une ligne d’explication chacune.' },
  { cmd: 'plan', title: "Plan d'action", body: "Construis un plan d'action en étapes datées pour : {{objectif}}.\nAjoute les risques, les indicateurs de réussite et la première action à faire aujourd'hui." },
  { cmd: 'code', title: 'Revue de code', body: 'Relis ce code : bugs, sécurité, lisibilité, performances. Propose ensuite une version corrigée et commentée.\n\n```\n{{code}}\n```' },
  { cmd: 'seo', title: 'Balises SEO', body: 'Propose 3 variantes de balise title (60 caractères max) et de meta description (155 caractères max) pour la page : {{sujet}}.' },
  { cmd: 'script', title: 'Script vidéo courte', body: 'Écris un script de vidéo courte (30 à 45 s) sur {{sujet}} : accroche en 3 secondes, 3 temps forts, appel à l’action, indications de plans et de sons.' },
  { cmd: 'linkedin', title: 'Post LinkedIn', body: 'Écris un post LinkedIn sur {{sujet}} : accroche forte, courte histoire, enseignement, question finale. 1 200 caractères maximum, sans hashtags inutiles.' },
  { cmd: 'devis', title: 'Proposition commerciale', body: 'Prépare une proposition commerciale pour {{client}} : contexte, besoin, solution, livrables, planning et tarif en 3 options.' },
];

const KEY = 'templates';
let list = [];

export const templates = {
  async load() {
    const saved = await db.kvGet(KEY);
    list = Array.isArray(saved) ? saved : DEFAULT_TEMPLATES.map((t) => ({ id: uid('t_'), ...t }));
    return list;
  },
  all() { return list; },
  async save() { await db.kvSet(KEY, list); bus.post({ type: 'templates' }); },
  async upsert(t) {
    const cmd = cleanCmd(t.cmd);
    if (!cmd) throw new Error('Choisissez une commande (lettres et chiffres).');
    if (list.some((x) => x.cmd === cmd && x.id !== t.id)) throw new Error(`La commande /${cmd} existe déjà.`);
    if (typeof t.body !== 'string' || !t.body.trim()) throw new Error('Écrivez le texte de la requête.');
    const item = { id: t.id || uid('t_'), cmd, title: (typeof t.title === 'string' && t.title.trim() ? t.title : cmd).trim().slice(0, 60), body: t.body.slice(0, 20000) };
    list = t.id && list.some((x) => x.id === t.id) ? list.map((x) => (x.id === t.id ? item : x)) : [...list, item];
    await this.save();
    return item;
  },
  async remove(id) { list = list.filter((x) => x.id !== id); await this.save(); },
  async reset() { list = DEFAULT_TEMPLATES.map((t) => ({ id: uid('t_'), ...t })); await this.save(); },
  async replaceAll(items) {
    list = (Array.isArray(items) ? items : []).filter((t) => t && typeof t.cmd === 'string' && typeof t.body === 'string' && t.body).map((t) => ({ id: t.id || uid('t_'), cmd: cleanCmd(t.cmd), title: typeof t.title === 'string' ? t.title : t.cmd, body: t.body }));
    await this.save();
  },
  search(q) {
    const n = norm(q);
    if (!n) return list;
    return list.filter((t) => t.cmd.startsWith(n.replace(/\s+/g, '')) || norm(t.title).includes(n) || norm(t.cmd).includes(n));
  },
};

export function cleanCmd(s) {
  return norm(String(s || '').replace(/^\//, '')).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 24);
}

/**
 * Remplit le modèle ; renvoie le texte et la sélection du premier champ {{…}} à compléter.
 * Un brouillon déjà saisi n'est jamais perdu : il remplace le premier champ du modèle,
 * ou s'ajoute à la suite si le modèle n'en a pas.
 */
export function applyTemplate(t, draft = '') {
  let text = t.body;
  const d = String(draft || '').trim();
  if (d) {
    const first = /\{\{([^}]+)\}\}/.exec(text);
    text = first ? text.slice(0, first.index) + d + text.slice(first.index + first[0].length) : `${text.replace(/\s+$/, '')}\n\n${d}`;
  }
  const m = /\{\{([^}]+)\}\}/.exec(text);
  if (!m) return { text, selStart: text.length, selEnd: text.length };
  return { text, selStart: m.index, selEnd: m.index + m[0].length };
}
