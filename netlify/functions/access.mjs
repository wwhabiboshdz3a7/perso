// POST /.netlify/functions/access  { "cle": "…", "jeton": "…" (facultatif) }
// Réponse : { valide: true, jeton, offre, source, emis, expire } ou { valide: false, erreur, motif? }.
// Vérifie un code d'accès ou une clé de licence et renvoie un jeton signé (HMAC, TOKEN_SECRET).
// Avec le jeton précédent du même appareil, c'est un renouvellement : la clé est revérifiée chez le
// fournisseur (remboursement, licence désactivée, révocation) sans consommer de nouvelle activation.
import { creerJeton, verifierJeton } from '../lib/jeton.mjs';
import { verifierCle, empreinteCle, ErreurFournisseur, RefusCle } from '../lib/verificateurs.mjs';
import { motifRetrait } from '../lib/revocation.mjs';
import { json, lireEnv, ipClient } from '../lib/http.mjs';
import { envAcces } from '../lib/contenu.mjs';

// Limitation simple par instance : au plus MAX_ESSAIS échecs par IP sur la fenêtre.
const FENETRE_MS = 10 * 60 * 1000;
const MAX_ESSAIS = 10;
const echecs = new Map();
// Un jeton expiré depuis moins de 180 jours suffit à prouver que l'appareil a déjà été activé.
const TOLERANCE_RENOUVELLEMENT_S = 180 * 86400;

function bloque(ip, maintenant) {
  const e = echecs.get(ip);
  if (!e || maintenant - e.debut > FENETRE_MS) return false;
  return e.n >= MAX_ESSAIS;
}
function noterEchec(ip, maintenant) {
  const e = echecs.get(ip);
  if (!e || maintenant - e.debut > FENETRE_MS) echecs.set(ip, { debut: maintenant, n: 1 });
  else e.n++;
  if (echecs.size > 5000) echecs.clear();
}

export function reinitialiserLimites() { echecs.clear(); }

/** Durée de validité d'un jeton, en jours (30 par défaut ; renouvelé automatiquement par l'espace membre). */
export const dureeJetonJours = env => Math.min(Math.max(parseInt(env.TOKEN_TTL_DAYS || '30', 10) || 30, 1), 365);

const REFUS_REVOQUE = 'Cet accès a été désactivé (remboursement ou code retiré). Une question ? Écrivez au support.';

export default async function access(req, context) {
  if (req.method !== 'POST') return json(405, { erreur: 'Méthode non autorisée.' }, { Allow: 'POST' });
  const env = envAcces(lireEnv());
  const secret = env.TOKEN_SECRET;
  if (!secret || secret.length < 32) return json(500, { erreur: 'Configuration serveur incomplète (TOKEN_SECRET).' });

  const ip = ipClient(req, context);
  const maintenant = Date.now();
  if (bloque(ip, maintenant)) return json(429, { erreur: 'Trop d\'essais. Réessayez dans quelques minutes.' }, { 'Retry-After': '600' });

  let cle = '', ancien = '';
  try {
    const type = req.headers.get('content-type') || '';
    if (type.includes('application/json')) { const d = await req.json(); cle = d?.cle; ancien = d?.jeton; }
    else { const p = new URLSearchParams(await req.text()); cle = p.get('cle'); ancien = p.get('jeton'); }
  } catch { return json(400, { erreur: 'Requête illisible.' }); }
  cle = typeof cle === 'string' ? cle.trim() : '';
  if (!cle) return json(400, { erreur: 'Saisissez votre code d\'accès ou votre clé de licence.' });
  const empreinte = empreinteCle(cle);

  // Renouvellement : jeton précédent signé par ce serveur, pour cette même clé.
  const precedent = typeof ancien === 'string' && ancien ? verifierJeton(ancien, secret, maintenant, { toleranceSecondes: TOLERANCE_RENOUVELLEMENT_S }) : null;
  const renouvellement = !!precedent && precedent.k === empreinte;

  let resultat;
  try {
    resultat = await verifierCle(cle, env, globalThis.fetch, { renouvellement, instance: renouvellement ? precedent.i || '' : '' });
  } catch (e) {
    if (e instanceof RefusCle) return json(200, { valide: false, erreur: e.message, motif: e.motif });
    if (e instanceof ErreurFournisseur) return json(502, { erreur: 'Le service de vérification des licences ne répond pas. Réessayez dans un instant.' });
    console.error('access', e);
    return json(500, { erreur: 'Erreur interne.' });
  }
  if (!resultat) {
    if (!renouvellement) noterEchec(ip, maintenant);
    // Réponse 200 : la requête a abouti, la clé est simplement refusée (le navigateur ne journalise pas d'erreur réseau).
    return json(200, { valide: false, erreur: renouvellement ? REFUS_REVOQUE : 'Code ou clé de licence non reconnu. Vérifiez la saisie (copiez-collez depuis l\'email de confirmation).', motif: renouvellement ? 'revoque' : 'inconnu' });
  }
  if (motifRetrait({ s: resultat.source, r: resultat.ref, k: empreinte, o: resultat.offre }, env)) {
    return json(200, { valide: false, erreur: REFUS_REVOQUE, motif: 'revoque' });
  }

  const { jeton, charge } = creerJeton({ ...resultat, empreinte }, secret, dureeJetonJours(env) * 86400, maintenant);
  return json(200, { valide: true, jeton, offre: charge.o, source: charge.s, emis: charge.iat, expire: charge.exp, renouvele: renouvellement });
}
