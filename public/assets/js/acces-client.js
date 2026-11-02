// Gestion de l'accès payant côté navigateur : saisie d'un code ou d'une clé de licence,
// conservation du jeton signé, renouvellement silencieux et chargement du contenu protégé.
// Le jeton est court (30 jours par défaut) : il est renouvelé en arrière-plan au plus une fois
// par semaine d'utilisation, ce qui revérifie l'achat (remboursement, révocation).
const CLE_STOCKAGE = 'levier.acces';
const URL_ACCES = '/.netlify/functions/access';
const URL_CONTENU = '/.netlify/functions/content';
const URL_RECUPERER = '/.netlify/functions/recuperer';
const RANGS = { essentiel: 1, pro: 2, vip: 3 };
const RENOUVELER_APRES_S = 7 * 86400;

function lire() {
  try { return JSON.parse(localStorage.getItem(CLE_STOCKAGE) || 'null'); } catch { return null; }
}
function ecrire(v) {
  try { v ? localStorage.setItem(CLE_STOCKAGE, JSON.stringify(v)) : localStorage.removeItem(CLE_STOCKAGE); } catch { /* stockage indisponible */ }
}
const expire = a => typeof a.expire === 'number' && a.expire * 1000 <= Date.now();

/** Accès mémorisé : { jeton, offre, expire, emis, cle } ou null. Un jeton expiré est gardé s'il peut être renouvelé. */
export function accesActuel() {
  const a = lire();
  if (!a) return null;
  if (typeof a !== 'object' || typeof a.jeton !== 'string' || !RANGS[a.offre]) { ecrire(null); return null; }
  if (expire(a) && typeof a.cle !== 'string') { ecrire(null); return null; }
  return a;
}
export const offreActuelle = () => accesActuel()?.offre || 'gratuit';
/** Clé saisie sur cet appareil (pour l'afficher, la copier ou la télécharger). */
export const cleActuelle = () => { const a = accesActuel(); return typeof a?.cle === 'string' ? a.cle : ''; };
export function oublierAcces() { ecrire(null); }

export class ErreurAcces extends Error {
  constructor(message, statut, offreRequise, code) { super(message); this.statut = statut; this.offreRequise = offreRequise; this.code = code; }
}

async function appelAcces(corps) {
  let rep;
  try {
    rep = await fetch(URL_ACCES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  } catch {
    throw new ErreurAcces('Connexion impossible. Vérifiez votre réseau et réessayez.', 0);
  }
  let d = {};
  try { d = await rep.json(); } catch { /* réponse non JSON */ }
  if (!rep.ok) throw new ErreurAcces(d.erreur || `Vérification impossible (erreur ${rep.status}).`, rep.status);
  if (d.valide !== true || !d.jeton) throw new ErreurAcces(d.erreur || 'Code ou clé de licence non reconnu.', 401, undefined, d.motif || 'inconnu');
  return d;
}
function memoriser(d, cle) {
  const a = { jeton: d.jeton, offre: d.offre, source: d.source, emis: d.emis, expire: d.expire, cle, active: Date.now() };
  ecrire(a);
  return a;
}

/**
 * Vérifie une clé auprès de la fonction `access` et mémorise le jeton obtenu.
 * Si un accès supérieur est déjà actif sur cet appareil, il est conservé (pas de rétrogradation) :
 * le résultat porte alors `conserve: true` et `offreSaisie`.
 */
export async function activerCle(cleBrute) {
  const cle = String(cleBrute || '').trim();
  const actuel = accesActuel();
  const memeCle = !!actuel && actuel.cle === cle;
  const d = await appelAcces(memeCle ? { cle, jeton: actuel.jeton } : { cle });
  if (actuel && !memeCle && !expire(actuel) && RANGS[actuel.offre] > RANGS[d.offre]) {
    return { ...actuel, conserve: true, offreSaisie: d.offre };
  }
  return memoriser(d, cle);
}

let renouvellement = null;
/** Renouvelle le jeton si nécessaire (expiré, ou émis il y a plus d'une semaine). */
async function renouveler(a, force = false) {
  if (typeof a.cle !== 'string' || !a.cle) {
    if (expire(a)) { ecrire(null); throw new ErreurAcces('Votre accès a expiré. Saisissez à nouveau votre code.', 401); }
    return a;
  }
  if (!force && !expire(a) && typeof a.emis === 'number' && Date.now() / 1000 - a.emis < RENOUVELER_APRES_S) return a;
  renouvellement ??= (async () => {
    try {
      return memoriser(await appelAcces({ cle: a.cle, jeton: a.jeton }), a.cle);
    } catch (e) {
      if (e.statut === 401) { ecrire(null); throw e; } // clé refusée : accès retiré de l'appareil
      if (!expire(a)) return a;                          // réseau ou fournisseur indisponible : jeton encore valable
      throw e;
    } finally { renouvellement = null; }
  })();
  return renouvellement;
}

async function appelProtege(query) {
  let a = accesActuel();
  if (!a) throw new ErreurAcces('Accès requis.', 401);
  a = await renouveler(a);
  for (let essai = 0; ; essai++) {
    let rep;
    try {
      rep = await fetch(`${URL_CONTENU}?${query}`, { headers: { Authorization: `Bearer ${a.jeton}` } });
    } catch {
      throw new ErreurAcces('Connexion impossible : le contenu n\'a pas pu être chargé. Vérifiez votre réseau et réessayez.', 0);
    }
    if (rep.status === 401) {
      let d = {};
      try { d = await rep.json(); } catch { /* */ }
      if (essai === 0 && a.cle && d.code !== 'revoque') { a = await renouveler(a, true); continue; }
      ecrire(null);
      throw new ErreurAcces(d.code === 'revoque' && d.erreur ? d.erreur : 'Votre accès a expiré. Saisissez à nouveau votre code.', 401, undefined, d.code);
    }
    if (!rep.ok) {
      let d = {};
      try { d = await rep.json(); } catch { /* */ }
      throw new ErreurAcces(d.erreur || `Le contenu n'a pas pu être chargé (erreur ${rep.status}). Réessayez dans un instant.`, rep.status, d.offreRequise);
    }
    return rep;
  }
}

/** Contenu d'un module payant (JSON). */
export async function chargerModuleProtege(id) {
  return (await appelProtege('module=' + encodeURIComponent(id))).json();
}

function enregistrer(blob, nom) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Télécharge un fichier protégé (workflow n8n…) et déclenche l'enregistrement. */
export async function telechargerFichier(nom) {
  const rep = await appelProtege('fichier=' + encodeURIComponent(nom));
  enregistrer(await rep.blob(), nom.split('/').pop());
}

/** Enregistre la clé dans un fichier texte, pour la retrouver sur un autre appareil. */
export function telechargerCle(cle, nomProduit = 'Levier') {
  const texte = [
    `Votre clé d'accès à la formation ${nomProduit}`,
    '',
    cle,
    '',
    `À saisir dans l'espace membre, page « Mon accès » : ${location.origin}/cours/#/acces`,
    'Elle sert sur tous vos appareils. Conservez ce fichier et ne le partagez pas.'
  ].join('\n');
  const slug = nomProduit.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'formation';
  enregistrer(new Blob([texte + '\n'], { type: 'text/plain;charset=utf-8' }), `cle-acces-${slug}.txt`);
}

/**
 * Demande l'envoi du lien d'activation d'un achat Stripe à l'adresse utilisée pour le paiement.
 * Renvoie { ok, message } ou { ok: false, indisponible, erreur }.
 */
export async function recupererParEmail(email) {
  let rep;
  try {
    rep = await fetch(URL_RECUPERER, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
  } catch {
    throw new ErreurAcces('Connexion impossible. Vérifiez votre réseau et réessayez.', 0);
  }
  let d = {};
  try { d = await rep.json(); } catch { /* */ }
  if (rep.status === 404) return { ok: false, indisponible: true };
  if (!rep.ok) throw new ErreurAcces(d.erreur || `Demande impossible (erreur ${rep.status}).`, rep.status);
  return d;
}

/**
 * Branche un formulaire « clé perdue » (champ email + zone de message .form-msg).
 * `support` : adresse email de support, proposée si la récupération automatique n'est pas activée.
 */
export function brancherRecuperation(form, support = '') {
  if (!form) return;
  const champ = form.querySelector('input[type=email]'), msg = form.querySelector('.form-msg'), btn = form.querySelector('button[type=submit]');
  const aide = 'Écrivez au support en indiquant l\'adresse email utilisée pour l\'achat' + (support ? ` : ${support}.` : '.');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = champ.value.trim();
    msg.className = 'form-msg';
    champ.removeAttribute('aria-invalid');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      msg.textContent = 'Indiquez l\'adresse email utilisée lors du paiement.'; msg.classList.add('ko');
      champ.setAttribute('aria-invalid', 'true'); champ.focus(); return;
    }
    btn.disabled = true; msg.textContent = 'Envoi…';
    try {
      const d = await recupererParEmail(email);
      if (d.ok) { msg.textContent = d.message || 'Demande envoyée : regardez votre boîte de réception.'; msg.classList.add('ok'); }
      else { msg.textContent = d.indisponible ? `La récupération automatique n'est pas activée sur ce site. ${aide}` : (d.erreur || aide); msg.classList.add('ko'); }
    } catch (err) {
      msg.textContent = err.message; msg.classList.add('ko');
    } finally { btn.disabled = false; }
  });
}
