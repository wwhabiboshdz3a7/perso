// Révocation des accès déjà émis (remboursement, code partagé, litige).
// REVOKED_KEYS (variable d'environnement) et prive/revocations.txt acceptent, séparés par des
// virgules ou des retours à la ligne :
//   - la clé elle-même : code LEV-…, clé de licence Gumroad ou Lemon Squeezy, session Stripe cs_… ;
//   - ou une référence de vente : « gumroad:<sale_id> », « lemonsqueezy:<n° de commande> », « stripe:cs_… ».
// Un code retiré de ACCESS_CODE_HASHES (ou de prive/codes-acces.txt) est aussi coupé aussitôt.
import { empreinteCle, codeToujoursActif } from './verificateurs.mjs';

const SOURCES = ['code', 'gumroad', 'lemonsqueezy', 'stripe'];
let cache = { brut: null, ensemble: null };

/** Ensemble des révocations : « k:<empreinte> » pour une clé, « source:référence » pour une vente. */
export function lireRevocations(brut) {
  const texte = String(brut || '');
  if (cache.brut === texte) return cache.ensemble;
  const ensemble = new Set();
  for (const morceau of texte.split(/[\n,;]+/)) {
    const t = morceau.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf(':');
    const source = i > 0 ? t.slice(0, i).toLowerCase() : '';
    if (SOURCES.includes(source) && t.slice(i + 1).trim()) ensemble.add(`${source}:${t.slice(i + 1).trim()}`);
    else ensemble.add('k:' + empreinteCle(t));
  }
  cache = { brut: texte, ensemble };
  return ensemble;
}

/**
 * Motif de retrait d'un accès, ou null s'il est toujours valable.
 * @param {{s: string, r?: string, k: string, o: string}} charge charge utile du jeton (ou équivalent)
 * @param {object} env variables complétées par envAcces()
 */
export function motifRetrait(charge, env) {
  const rev = lireRevocations(env.REVOKED_KEYS);
  if (rev.has('k:' + charge.k)) return 'revoque';
  if (charge.r && rev.has(`${charge.s}:${charge.r}`)) return 'revoque';
  if (charge.s === 'code' && !codeToujoursActif(charge.k, charge.o, env)) return 'code-retire';
  return null;
}
