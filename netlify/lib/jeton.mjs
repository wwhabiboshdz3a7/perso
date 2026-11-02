// Jetons d'accès signés (HMAC-SHA256) : base64url(charge utile JSON) + "." + base64url(signature).
import { createHmac, timingSafeEqual } from 'node:crypto';

const b64url = buf => Buffer.from(buf).toString('base64url');

function signer(donnees, secret) {
  return createHmac('sha256', secret).update(donnees).digest();
}

/**
 * Crée un jeton pour une offre donnée.
 * @param {{offre: string, source: string, ref?: string}} infos
 * @param {string} secret valeur de TOKEN_SECRET
 * @param {number} dureeSecondes durée de validité
 */
export function creerJeton({ offre, source, ref = '' }, secret, dureeSecondes, maintenant = Date.now()) {
  if (!secret || secret.length < 32) throw new Error('TOKEN_SECRET absent ou trop court (32 caractères minimum).');
  const iat = Math.floor(maintenant / 1000);
  const charge = { v: 1, o: offre, s: source, r: ref, iat, exp: iat + dureeSecondes };
  const corps = b64url(JSON.stringify(charge));
  return { jeton: `${corps}.${b64url(signer(corps, secret))}`, charge };
}

/**
 * Vérifie un jeton. Renvoie la charge utile si la signature et la date sont valides, sinon null.
 */
export function verifierJeton(jeton, secret, maintenant = Date.now()) {
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
  if (!charge || charge.v !== 1 || typeof charge.o !== 'string' || typeof charge.exp !== 'number') return null;
  if (charge.exp * 1000 <= maintenant) return null;
  return charge;
}

/** Extrait le jeton d'un en-tête « Authorization: Bearer … ». */
export function jetonDepuisRequete(req) {
  const h = req.headers.get('authorization') || '';
  const m = h.match(/^Bearer\s+([A-Za-z0-9._-]+)$/);
  return m ? m[1] : null;
}
