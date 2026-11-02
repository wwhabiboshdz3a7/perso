// Gestion de l'accès payant côté navigateur : saisie d'un code ou d'une clé de licence,
// conservation du jeton signé et chargement du contenu protégé via les fonctions Netlify.
const CLE_STOCKAGE = 'levier.acces';
const URL_ACCES = '/.netlify/functions/access';
const URL_CONTENU = '/.netlify/functions/content';

function lire() {
  try { return JSON.parse(localStorage.getItem(CLE_STOCKAGE) || 'null'); } catch { return null; }
}
function ecrire(v) {
  try { v ? localStorage.setItem(CLE_STOCKAGE, JSON.stringify(v)) : localStorage.removeItem(CLE_STOCKAGE); } catch { /* stockage indisponible */ }
}

/** Accès en cours : { jeton, offre, expire } ou null si absent/expiré. */
export function accesActuel() {
  const a = lire();
  if (!a || !a.jeton || !a.offre) return null;
  if (a.expire && a.expire * 1000 < Date.now()) { ecrire(null); return null; }
  return a;
}
export const offreActuelle = () => accesActuel()?.offre || 'gratuit';
export function oublierAcces() { ecrire(null); }

export class ErreurAcces extends Error {
  constructor(message, statut, offreRequise) { super(message); this.statut = statut; this.offreRequise = offreRequise; }
}

/** Vérifie une clé auprès de la fonction `access` et mémorise le jeton obtenu. */
export async function activerCle(cle) {
  let rep;
  try {
    rep = await fetch(URL_ACCES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cle }) });
  } catch {
    throw new ErreurAcces('Connexion impossible. Vérifiez votre réseau et réessayez.', 0);
  }
  let d = {};
  try { d = await rep.json(); } catch { /* réponse non JSON */ }
  if (!rep.ok) throw new ErreurAcces(d.erreur || `Vérification impossible (erreur ${rep.status}).`, rep.status);
  const acces = { jeton: d.jeton, offre: d.offre, expire: d.expire, source: d.source, active: Date.now() };
  ecrire(acces);
  return acces;
}

async function appelProtege(query) {
  const a = accesActuel();
  if (!a) throw new ErreurAcces('Accès requis.', 401);
  let rep;
  try {
    rep = await fetch(`${URL_CONTENU}?${query}`, { headers: { Authorization: `Bearer ${a.jeton}` } });
  } catch {
    throw new ErreurAcces('Connexion impossible : le contenu n\'a pas pu être chargé.', 0);
  }
  if (rep.status === 401) { ecrire(null); throw new ErreurAcces('Votre accès a expiré. Saisissez à nouveau votre code.', 401); }
  if (!rep.ok) {
    let d = {};
    try { d = await rep.json(); } catch { /* */ }
    throw new ErreurAcces(d.erreur || `Erreur ${rep.status}`, rep.status, d.offreRequise);
  }
  return rep;
}

/** Contenu d'un module payant (JSON). */
export async function chargerModuleProtege(id) {
  return (await appelProtege('module=' + encodeURIComponent(id))).json();
}

/** Télécharge un fichier protégé (workflow n8n…) et déclenche l'enregistrement. */
export async function telechargerFichier(nom) {
  const rep = await appelProtege('fichier=' + encodeURIComponent(nom));
  const blob = await rep.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nom.split('/').pop();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
