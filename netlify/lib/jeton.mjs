// Jetons d'accès signés (HMAC-SHA256) : base64url(charge utile JSON) + "." + base64url(signature).
// Charge utile : { v, o: offre, s: source, r: référence chez le fournisseur, k: empreinte de la clé,
//                  i: instance de licence (Lemon Squeezy), iat, exp }.
// L'empreinte k (16 caractères hexadécimaux du SHA-256 de la clé) sert à révoquer un accès déjà
// émis et à renouveler le jeton sans redemander la clé à l'élève.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const VERSION_JETON = 2;
const b64url = buf => Buffer.from(buf).toString('base64url');

function signer(donnees, secret) {
  return createHmac('sha256', secret).update(donnees).digest();
}

/**
 * Crée un jeton pour une offre donnée.
 * @param {{offre: string, source: string, ref?: string, empreinte?: string, instance?: string}} infos
 * @param {string} secret valeur de TOKEN_SECRET
 * @param {number} dureeSecondes durée de validité
 */
export function creerJeton({ offre, source, ref = '', empreinte = '', instance = '' }, secret, dureeSecondes, maintenant = Date.now()) {
  if (!secret || secret.length < 32) throw new Error('TOKEN_SECRET absent ou trop court (32 caractères minimum).');
  const iat = Math.floor(maintenant / 1000);
  const charge = { v: VERSION_JETON, o: offre, s: source, r: String(ref).slice(0, 64), k: String(empreinte), iat, exp: iat + dureeSecondes };
  if (instance) charge.i = String(instance).slice(0, 64);
  const corps = b64url(JSON.stringify(charge));
  return { jeton: `${corps}.${b64url(signer(corps, secret))}`, charge };
}

/**
 * Vérifie un jeton. Renvoie la charge utile si la signature et la date sont valides, sinon null.
 * `toleranceSecondes` accepte un jeton expiré depuis moins de cette durée (réservé au renouvellement).
 */
export function verifierJeton(jeton, secret, maintenant = Date.now(), { toleranceSecondes = 0 } = {}) {
  if (!secret || typeof jeton !== 'string' || jeton.length > 2048) return null;
  const parties = jeton.split('.');
  if (parties.length !== 2) return null;
  const [corps, sig] = parties;
  let attendu, recu;
  try {
    attendu = signer(corps, secret);
    recu = Buffer.from(sig, 'base64url');
  } catch { return null; }
  if (recu.length !== attendu.length || !timingSafeEqual(recu, attendu)) return null;
  let charge;
  try { charge = JSON.parse(Buffer.from(corps, 'base64url').toString('utf8')); } catch { return null; }
  if (!charge || charge.v !== VERSION_JETON || typeof charge.o !== 'string' || typeof charge.exp !== 'number' || typeof charge.k !== 'string') return null;
  if ((charge.exp + toleranceSecondes) * 1000 <= maintenant) return null;
  return charge;
}

/** Extrait le jeton d'un en-tête « Authorization: Bearer … ». */
export function jetonDepuisRequete(req) {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+([A-Za-z0-9._-]+)$/);
  return m ? m[1] : null;
}
