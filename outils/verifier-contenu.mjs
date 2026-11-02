// Vérification du contenu de la formation : structure des leçons, cohérence avec le catalogue,
// exercices (les exemples de réponse doivent valider leurs propres critères), bonus, workflows n8n,
// et absence de contenu payant dans le dossier publié.
// Usage : node outils/verifier-contenu.mjs   (utilisé aussi par tests/contenu.test.mjs)
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { modules, fichiers } from '../public/cours/content/catalogue.js';

export const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dossierPublic = path.join(racine, 'public');
const texte = html => String(html || '')
  .replace(/<br\s*\/?>|<\/(p|li|h\d|pre|tr)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&')
  .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();

/** Charge le contenu d'un module (gratuit dans public/, payant dans prive/). */
export async function chargerContenu(id) {
  const m = modules.find(x => x.id === id);
  const fichier = m && m.offre === 'gratuit'
    ? path.join(dossierPublic, 'cours', 'content', `${id}.js`)
    : path.join(racine, 'prive', 'modules', `${id}.mjs`);
  return (await import(pathToFileURL(fichier).href)).default;
}

function testerCritere(c, t) {
  if (c.minMots) return t.trim().split(/\s+/).filter(Boolean).length >= c.minMots;
  return new RegExp(c.motif, c.drapeaux || 'i').test(t);
}

/** Vérifie une leçon ; renvoie la liste des problèmes. */
export function verifierLecon(l, ou) {
  const e = [];
  const err = m => e.push(`${ou} : ${m}`);
  if (!l.titre) err('titre manquant');
  if (texte(l.theorie).split(/\s+/).length < 250) err('théorie trop courte (moins de 250 mots)');
  if (!Array.isArray(l.objectifs) || l.objectifs.length < 2) err('objectifs manquants');
  if (!Array.isArray(l.pas) || l.pas.length < 3) err('pas-à-pas manquant (3 étapes minimum)');
  (l.pas || []).forEach((p, i) => { if (!p.t || !p.d) err(`étape ${i + 1} incomplète`); });
  const x = l.exercice;
  if (!x) err('exercice ou checklist manquant');
  else if (x.type === 'texte') {
    if (!x.enonce || !Array.isArray(x.criteres) || x.criteres.length < 2) err('exercice texte sans critères');
    for (const c of x.criteres || []) {
      if (!c.label) err('critère sans libellé');
      if (c.motif !== undefined) { try { new RegExp(c.motif, c.drapeaux || 'i'); } catch (ex) { err(`critère invalide « ${c.label} » : ${ex.message}`); } }
    }
    if (!x.solution) err('exercice texte sans exemple de réponse');
    else {
      const sol = texte(x.solution);
      for (const c of x.criteres || []) if (!testerCritere(c, sol)) err(`l'exemple de réponse ne valide pas le critère « ${c.label} »`);
    }
  } else if (x.type === 'qcm') {
    const bonnes = Array.isArray(x.bonne) ? x.bonne : [x.bonne];
    if (!Array.isArray(x.options) || x.options.length < 3) err('QCM : options insuffisantes');
    if (bonnes.some(b => !Number.isInteger(b) || b < 0 || b >= (x.options || []).length)) err('QCM : bonne réponse hors limites');
  } else if (x.type === 'checklist') {
    if (!Array.isArray(x.items) || x.items.length < 4) err('checklist trop courte');
  } else err(`type d'exercice inconnu : ${x.type}`);
  if (!Array.isArray(l.quiz) || l.quiz.length < 3) err('quiz de moins de 3 questions');
  (l.quiz || []).forEach((q, i) => {
    if (!q.q || !Array.isArray(q.options) || q.options.length < 3) err(`quiz ${i + 1} incomplet`);
    if (!Number.isInteger(q.bonne) || q.bonne < 0 || q.bonne >= (q.options || []).length) err(`quiz ${i + 1} : bonne réponse hors limites`);
    if (!q.explication) err(`quiz ${i + 1} sans explication`);
  });
  const s = l.script;
  if (!s || !s.duree || !s.accroche || !Array.isArray(s.plan) || s.plan.length < 3 || !s.cta) err('script vidéo incomplet');
  for (const src of l.sources || []) if (!/^https:\/\//.test(src.url) || !src.titre) err(`source invalide : ${src.url}`);
  for (const f of l.fichiers || []) if (!fichiers[f]) err(`fichier non déclaré dans le catalogue : ${f}`);
  return e;
}

/** Vérifie un workflow n8n exporté ; renvoie la liste des problèmes. */
export function verifierWorkflow(wf, nom) {
  const e = [];
  const err = m => e.push(`${nom} : ${m}`);
  if (!wf.name || !Array.isArray(wf.nodes) || typeof wf.connections !== 'object') { err('structure n8n invalide'); return e; }
  const noms = new Set(), ids = new Set();
  for (const n of wf.nodes) {
    if (noms.has(n.name)) err(`nom de nœud dupliqué : ${n.name}`);
    if (ids.has(n.id)) err(`identifiant dupliqué : ${n.id}`);
    noms.add(n.name); ids.add(n.id);
    if (!/^n8n-nodes-base\.[a-zA-Z]+$/.test(n.type)) err(`type inattendu : ${n.type}`);
    if (typeof n.typeVersion !== 'number' || !Array.isArray(n.position) || n.position.length !== 2) err(`nœud mal formé : ${n.name}`);
    if (n.type === 'n8n-nodes-base.code') {
      try { new (Object.getPrototypeOf(async function () {}).constructor)('$', '$input', '$json', n.parameters.jsCode); }
      catch (ex) { err(`code invalide dans « ${n.name} » : ${ex.message}`); }
    }
    const brut = JSON.stringify(n.parameters);
    if (/sk-ant-|xi-api-key"\s*:\s*"[^"]+"|Bearer [A-Za-z0-9]{20,}/.test(brut)) err(`secret en clair dans « ${n.name} »`);
  }
  for (const [de, c] of Object.entries(wf.connections)) {
    if (!noms.has(de)) err(`connexion depuis un nœud absent : ${de}`);
    for (const sortie of c.main || []) for (const lien of sortie) if (!noms.has(lien.node)) err(`connexion vers un nœud absent : ${lien.node}`);
  }
  const cibles = new Set(Object.values(wf.connections).flatMap(c => (c.main || []).flat().map(l => l.node)));
  for (const n of wf.nodes) if (!/stickyNote|Trigger|webhook/.test(n.type) && !cibles.has(n.name)) err(`nœud non relié : ${n.name}`);
  return e;
}

async function fichiersRecursifs(dossier) {
  const sortie = [];
  for (const nom of await readdir(dossier)) {
    const p = path.join(dossier, nom);
    if ((await stat(p)).isDirectory()) sortie.push(...await fichiersRecursifs(p));
    else sortie.push(p);
  }
  return sortie;
}

/** Le dossier publié ne doit contenir aucun contenu payant. */
export async function verifierDossierPublie() {
  const e = [];
  const publics = await fichiersRecursifs(dossierPublic);
  const textes = [];
  for (const f of publics) {
    if (/\.(woff2|png|jpe?g|webp|ico)$/i.test(f)) continue;
    textes.push([path.relative(racine, f), await readFile(f, 'utf8')]);
  }
  for (const [f] of textes) if (/prive|\.mjs$|n8n\/0\d-/.test(f) && !f.endsWith('.js')) e.push(`fichier suspect dans public/ : ${f}`);
  // Extraits caractéristiques de chaque leçon payante et des bonus.
  const extraits = [];
  for (const m of modules.filter(x => x.offre !== 'gratuit')) {
    const d = await chargerContenu(m.id);
    d.lecons.forEach((l, i) => {
      const t = texte(l.theorie);
      extraits.push([`${m.id}/${i + 1}`, t.slice(Math.floor(t.length / 2), Math.floor(t.length / 2) + 60)]);
      if (l.script?.accroche) extraits.push([`${m.id}/${i + 1} (script)`, l.script.accroche.slice(0, 60)]);
    });
  }
  const bonus = (await import(pathToFileURL(path.join(racine, 'prive', 'modules', 'bonus.mjs')).href)).default;
  bonus.prompts.slice(0, 112).forEach(p => extraits.push([`prompt ${p.id}`, p.prompt.slice(0, 70)]));
  for (const nomWf of Object.keys(fichiers)) {
    const wf = JSON.parse(await readFile(path.join(racine, 'prive', nomWf), 'utf8'));
    const codeNoeud = wf.nodes.find(n => n.type === 'n8n-nodes-base.code');
    if (codeNoeud) extraits.push([nomWf, codeNoeud.parameters.jsCode.slice(0, 80)]);
  }
  // Le mini-guide de l'aimant n'est servi qu'avec un jeton (fonction guide) : aucun passage dans public/.
  const guide = await readFile(path.join(racine, 'prive', 'guide', '7-services.html'), 'utf8');
  for (const m of guide.matchAll(/<(?:dd|p class="attention")>([^<]{40,})</g)) extraits.push(['mini-guide', m[1].slice(0, 60)]);
  for (const [ou, extrait] of extraits) {
    if (extrait.length < 30) continue;
    for (const [f, contenu] of textes) if (contenu.includes(extrait)) e.push(`contenu payant (${ou}) trouvé dans ${f}`);
  }
  return { erreurs: e, extraits: extraits.length, fichiers: textes.length };
}

/** Lance toutes les vérifications. */
export async function verifierTout() {
  const erreurs = [];
  let lecons = 0;
  for (const m of modules) {
    let d;
    try { d = await chargerContenu(m.id); } catch (ex) { erreurs.push(`${m.id} : chargement impossible (${ex.message})`); continue; }
    if (d.lecons.length !== m.lecons.length) erreurs.push(`${m.id} : ${d.lecons.length} leçons, ${m.lecons.length} au catalogue`);
    d.lecons.forEach((l, i) => {
      lecons++;
      if (m.lecons[i] !== l.titre) erreurs.push(`${m.id}/${i + 1} : titre « ${l.titre} » différent du catalogue « ${m.lecons[i]} »`);
      erreurs.push(...verifierLecon(l, `${m.id}/${i + 1}`));
    });
  }
  const bonus = (await import(pathToFileURL(path.join(racine, 'prive', 'modules', 'bonus.mjs')).href)).default;
  if (bonus.prompts.length < 100) erreurs.push(`bonus : ${bonus.prompts.length} prompts (100 minimum)`);
  const idsPrompts = new Set(bonus.prompts.map(p => p.id));
  if (idsPrompts.size !== bonus.prompts.length) erreurs.push('bonus : identifiants de prompts dupliqués');
  for (const p of bonus.prompts) if (!p.metier || !p.titre || !p.objectif || p.prompt.length < 120) erreurs.push(`bonus : prompt incomplet ${p.id}`);
  if (bonus.modeles.length < 8) erreurs.push('bonus : moins de 8 modèles');
  for (const c of bonus.checklists) if (c.items.length < 5) erreurs.push(`bonus : checklist courte « ${c.titre} »`);
  let workflows = 0;
  for (const nom of Object.keys(fichiers)) {
    let wf;
    try { wf = JSON.parse(await readFile(path.join(racine, 'prive', nom), 'utf8')); }
    catch (ex) { erreurs.push(`${nom} : JSON invalide (${ex.message})`); continue; }
    workflows++;
    erreurs.push(...verifierWorkflow(wf, nom));
  }
  const publie = await verifierDossierPublie();
  erreurs.push(...publie.erreurs);
  return { erreurs, lecons, prompts: bonus.prompts.length, workflows, extraits: publie.extraits, fichiersPublics: publie.fichiers };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const r = await verifierTout();
  console.log(`${r.lecons} leçons, ${r.prompts} prompts, ${r.workflows} workflows n8n, ${r.extraits} extraits payants recherchés dans ${r.fichiersPublics} fichiers publiés.`);
  if (r.erreurs.length) { console.error(r.erreurs.map(x => '  ✗ ' + x).join('\n')); console.error(`${r.erreurs.length} problème(s).`); process.exit(1); }
  console.log('Contenu vérifié : aucun problème.');
}
