// Vérification d'un code d'accès ou d'une clé de licence.
// Sources possibles : code interne (hachage SHA-256 dans ACCESS_CODE_HASHES), licence Gumroad,
// licence Lemon Squeezy, session de paiement Stripe (lien de paiement).
import { createHash, timingSafeEqual } from 'node:crypto';
import { RANGS } from '../../public/cours/content/catalogue.js';

const OFFRES_PAYANTES = ['essentiel', 'pro', 'vip'];
const DELAI_RESEAU_MS = 8000;

/** Normalise un code saisi : majuscules, sans espaces. */
export const normaliserCode = s => String(s || '').trim().toUpperCase().replace(/\s+/g, '');
export const hacherCode = s => createHash('sha256').update(normaliserCode(s), 'utf8').digest('hex');

/**
 * Lit une liste « offre:valeur » séparée par des virgules, points-virgules ou retours à la ligne.
 * Une valeur sans préfixe reçoit l'offre par défaut.
 */
export function lireCorrespondances(brut, offreParDefaut = 'pro') {
  const liste = [];
  for (const morceau of String(brut || '').split(/[\n,;]+/)) {
    const t = morceau.trim();
    if (!t) continue;
    const i = t.indexOf(':');
    let offre = offreParDefaut, valeur = t;
    if (i > 0 && OFFRES_PAYANTES.includes(t.slice(0, i).trim().toLowerCase())) {
      offre = t.slice(0, i).trim().toLowerCase();
      valeur = t.slice(i + 1).trim();
    }
    if (valeur) liste.push({ offre, valeur });
  }
  return liste;
}

/** Garde l'offre la plus élevée si plusieurs correspondances. */
const meilleure = offres => offres.sort((a, b) => RANGS[b] - RANGS[a])[0] || null;

function egaliteSure(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

async function requete(fetchImpl, url, options) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), DELAI_RESEAU_MS);
  try {
    const rep = await fetchImpl(url, { ...options, signal: ctrl.signal });
    let corps = null;
    try { corps = await rep.json(); } catch { corps = null; }
    return { statut: rep.status, corps };
  } finally { clearTimeout(t); }
}

export class ErreurFournisseur extends Error {}

/* ---------- 1. Code interne ---------- */
export function verifierCodeInterne(cle, env) {
  const liste = lireCorrespondances(env.ACCESS_CODE_HASHES, 'pro');
  if (!liste.length) return null;
  const h = hacherCode(cle);
  const trouvees = liste.filter(x => egaliteSure(x.valeur.toLowerCase(), h)).map(x => x.offre);
  const offre = meilleure(trouvees);
  return offre ? { offre, source: 'code', ref: h.slice(0, 12) } : null;
}

/* ---------- 2. Gumroad ---------- */
// API : POST https://api.gumroad.com/v2/licenses/verify (product_id, license_key, increment_uses_count)
export const formatGumroad = cle => /^[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/i.test(cle);

export async function verifierGumroad(cle, env, fetchImpl) {
  const produits = lireCorrespondances(env.GUMROAD_PRODUCT_IDS, 'pro');
  if (!produits.length) return null;
  let erreurReseau = false;
  for (const { offre, valeur: productId } of produits) {
    let r;
    try {
      r = await requete(fetchImpl, 'https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({ product_id: productId, license_key: cle.trim(), increment_uses_count: 'false' }).toString()
      });
    } catch { erreurReseau = true; continue; }
    if (r.statut >= 500) { erreurReseau = true; continue; }
    const c = r.corps;
    if (!c || c.success !== true || !c.purchase) continue;
    const p = c.purchase;
    if (p.refunded || p.chargebacked || p.disputed) continue;
    if (p.subscription_cancelled_at || p.subscription_failed_at) continue;
    if (p.product_id && p.product_id !== productId) continue;
    return { offre, source: 'gumroad', ref: String(p.sale_id || p.id || '').slice(0, 24) };
  }
  if (erreurReseau) throw new ErreurFournisseur('Gumroad injoignable');
  return null;
}

/* ---------- 3. Lemon Squeezy ---------- */
// API : POST https://api.lemonsqueezy.com/v1/licenses/validate (license_key) — sans clé d'API.
export const formatLemonSqueezy = cle => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cle);

export async function verifierLemonSqueezy(cle, env, fetchImpl) {
  const boutique = String(env.LEMONSQUEEZY_STORE_ID || '').trim();
  const correspondances = lireCorrespondances(env.LEMONSQUEEZY_PRODUITS, 'pro');
  if (!boutique || !correspondances.length) return null;
  let r;
  try {
    r = await requete(fetchImpl, 'https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ license_key: cle.trim() }).toString()
    });
  } catch { throw new ErreurFournisseur('Lemon Squeezy injoignable'); }
  if (r.statut >= 500) throw new ErreurFournisseur('Lemon Squeezy indisponible');
  const c = r.corps;
  if (!c || c.valid !== true || !c.meta || !c.license_key) return null;
  if (String(c.meta.store_id) !== boutique) return null;
  if (!['active', 'inactive'].includes(c.license_key.status)) return null;
  const ids = [String(c.meta.variant_id ?? ''), String(c.meta.product_id ?? '')];
  const offre = meilleure(correspondances.filter(x => ids.includes(x.valeur)).map(x => x.offre));
  return offre ? { offre, source: 'lemonsqueezy', ref: String(c.meta.order_id || '').slice(0, 24) } : null;
}

/* ---------- 4. Stripe (session issue d'un lien de paiement) ---------- */
// API : GET https://api.stripe.com/v1/checkout/sessions/{id} avec la clé secrète (lecture seule conseillée).
export const formatStripe = cle => /^cs_(live|test)_[A-Za-z0-9]{10,}$/.test(cle);

export async function verifierStripe(cle, env, fetchImpl) {
  const secret = String(env.STRIPE_SECRET_KEY || '').trim();
  const liens = lireCorrespondances(env.STRIPE_LIENS, 'pro');
  if (!secret || !liens.length) return null;
  let r;
  try {
    r = await requete(fetchImpl, `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(cle.trim())}`, {
      method: 'GET', headers: { Authorization: `Bearer ${secret}` }
    });
  } catch { throw new ErreurFournisseur('Stripe injoignable'); }
  if (r.statut >= 500) throw new ErreurFournisseur('Stripe indisponible');
  const s = r.corps;
  if (r.statut !== 200 || !s || s.object !== 'checkout.session') return null;
  if (s.status !== 'complete' || !['paid', 'no_payment_required'].includes(s.payment_status)) return null;
  const offre = meilleure(liens.filter(x => x.valeur === s.payment_link || x.valeur === s.metadata?.offre).map(x => x.offre));
  return offre ? { offre, source: 'stripe', ref: String(s.id).slice(-16) } : null;
}

/**
 * Vérifie une clé saisie en essayant les sources configurées, dans l'ordre le plus économique.
 * Renvoie { offre, source, ref } ou null. Lève ErreurFournisseur si un fournisseur est injoignable
 * et qu'aucune autre source n'a validé la clé.
 */
export async function verifierCle(cleBrute, env, fetchImpl = fetch) {
  const cle = String(cleBrute || '').trim();
  if (!cle || cle.length > 200) return null;
  const interne = verifierCodeInterne(cle, env);
  if (interne) return interne;
  let panne = null;
  const essais = [];
  if (formatStripe(cle)) essais.push(verifierStripe);
  if (formatLemonSqueezy(cle)) essais.push(verifierLemonSqueezy);
  if (formatGumroad(cle)) essais.push(verifierGumroad);
  for (const essai of essais) {
    try {
      const r = await essai(cle, env, fetchImpl);
      if (r) return r;
    } catch (e) {
      if (e instanceof ErreurFournisseur) panne = e; else throw e;
    }
  }
  if (panne) throw panne;
  return null;
}
