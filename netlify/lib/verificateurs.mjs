// Vérification d'un code d'accès ou d'une clé de licence.
// Sources possibles : code interne (hachage SHA-256 dans ACCESS_CODE_HASHES), licence Gumroad,
// licence Lemon Squeezy, session de paiement Stripe (lien de paiement).
// Chaque vérification renvoie { offre, source, ref, instance? } ou null (clé inconnue), et lève
// RefusCle pour un refus explicite (achat remboursé, limite d'appareils atteinte).
import { createHash, timingSafeEqual } from 'node:crypto';
import { RANGS } from '../../public/cours/content/catalogue.js';
import { LONGUEUR_REF_MAX } from './jeton.mjs';

const OFFRES_PAYANTES = ['essentiel', 'pro', 'vip'];
const DELAI_RESEAU_MS = 8000;

/** Normalise un code saisi : majuscules, sans espaces. */
export const normaliserCode = s => String(s || '').trim().toUpperCase().replace(/\s+/g, '');
export const hacherCode = s => createHash('sha256').update(normaliserCode(s), 'utf8').digest('hex');
/** Empreinte courte d'une clé (code, licence, session Stripe), stockée dans le jeton. */
export const empreinteCle = s => hacherCode(s).slice(0, 16);

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

export async function requete(fetchImpl, url, options) {
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

/** Refus explicite d'une clé reconnue : le message est montré à l'élève. */
export class RefusCle extends Error {
  constructor(motif, message) { super(message); this.motif = motif; }
}
const refusRembourse = () => new RefusCle('rembourse', 'Cet achat a été remboursé ou contesté : l\'accès correspondant n\'est plus actif. Une question ? Écrivez au support.');
const refusLimite = max => new RefusCle('limite', `Cette licence est déjà activée sur le nombre maximal d'appareils${max ? ` (${max})` : ''}. Utilisez un appareil déjà activé ou écrivez au support.`);

/** Nombre maximal d'activations d'une licence Gumroad (nouveaux appareils ou navigateurs). */
export const maxActivations = env => Math.min(Math.max(parseInt(env.LICENCE_MAX_ACTIVATIONS || '5', 10) || 5, 1), 100);

/* ---------- 1. Code interne ---------- */
export function verifierCodeInterne(cle, env) {
  const liste = lireCorrespondances(env.ACCESS_CODE_HASHES, 'pro');
  if (!liste.length) return null;
  const h = hacherCode(cle);
  const trouvees = liste.filter(x => egaliteSure(x.valeur.toLowerCase(), h)).map(x => x.offre);
  const offre = meilleure(trouvees);
  return offre ? { offre, source: 'code', ref: h.slice(0, 16) } : null;
}

/**
 * Le code dont l'empreinte est donnée est-il toujours actif, pour au moins cette offre ?
 * Sert à couper immédiatement un code retiré de ACCESS_CODE_HASHES (ou de prive/codes-acces.txt).
 */
export function codeToujoursActif(empreinte, offre, env) {
  if (!/^[0-9a-f]{16}$/.test(String(empreinte))) return false;
  return lireCorrespondances(env.ACCESS_CODE_HASHES, 'pro')
    .some(x => x.valeur.toLowerCase().startsWith(empreinte) && (RANGS[x.offre] ?? -1) >= (RANGS[offre] ?? 99));
}

/* ---------- 2. Gumroad ---------- */
// API : POST https://api.gumroad.com/v2/licenses/verify (product_id, license_key, increment_uses_count)
// Une nouvelle activation incrémente le compteur `uses` ; au-delà de LICENCE_MAX_ACTIVATIONS, refus.
// Un renouvellement (appareil déjà activé, prouvé par son jeton) ne l'incrémente pas.
export const formatGumroad = cle => /^[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/i.test(cle);

export async function verifierGumroad(cle, env, fetchImpl, { renouvellement = false } = {}) {
  const produits = lireCorrespondances(env.GUMROAD_PRODUCT_IDS, 'pro');
  if (!produits.length) return null;
  let erreurReseau = false;
  for (const { offre, valeur: productId } of produits) {
    let r;
    try {
      r = await requete(fetchImpl, 'https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({ product_id: productId, license_key: cle.trim(), increment_uses_count: renouvellement ? 'false' : 'true' }).toString()
      });
    } catch { erreurReseau = true; continue; }
    if (r.statut >= 500) { erreurReseau = true; continue; }
    const c = r.corps;
    if (!c || c.success !== true || !c.purchase) continue;
    const p = c.purchase;
    if (p.product_id && p.product_id !== productId) continue;
    if (p.refunded || p.chargebacked || p.disputed) throw refusRembourse();
    if (p.subscription_cancelled_at || p.subscription_failed_at || p.subscription_ended_at) continue;
    if (!renouvellement) {
      const max = maxActivations(env);
      if (typeof c.uses === 'number' && c.uses > max) throw refusLimite(max);
    }
    return { offre, source: 'gumroad', ref: String(p.sale_id || p.id || '').slice(0, LONGUEUR_REF_MAX) };
  }
  if (erreurReseau) throw new ErreurFournisseur('Gumroad injoignable');
  return null;
}

/* ---------- 3. Lemon Squeezy ---------- */
// API de licences (sans clé d'API) :
// - nouvel appareil : POST /v1/licenses/activate (license_key, instance_name), qui applique la
//   limite d'activations réglée sur le produit ;
// - renouvellement : POST /v1/licenses/validate (license_key, instance_id) de l'appareil déjà activé.
export const formatLemonSqueezy = cle => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cle);

export async function verifierLemonSqueezy(cle, env, fetchImpl, { instance = '' } = {}) {
  const boutique = String(env.LEMONSQUEEZY_STORE_ID || '').trim();
  const correspondances = lireCorrespondances(env.LEMONSQUEEZY_PRODUITS, 'pro');
  if (!boutique || !correspondances.length) return null;
  const activation = !instance;
  const params = activation
    ? { license_key: cle.trim(), instance_name: `Espace membre ${new Date().toISOString().slice(0, 10)}` }
    : { license_key: cle.trim(), instance_id: String(instance) };
  let r;
  try {
    r = await requete(fetchImpl, `https://api.lemonsqueezy.com/v1/licenses/${activation ? 'activate' : 'validate'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams(params).toString()
    });
  } catch { throw new ErreurFournisseur('Lemon Squeezy injoignable'); }
  if (r.statut >= 500) throw new ErreurFournisseur('Lemon Squeezy indisponible');
  const c = r.corps;
  if (activation && c && c.activated !== true && /activation limit/i.test(String(c.error || ''))) throw refusLimite(c.license_key?.activation_limit);
  if (!c || !c.meta || !c.license_key) return null;
  if (String(c.meta.store_id) !== boutique) return null;
  const ids = [String(c.meta.variant_id ?? ''), String(c.meta.product_id ?? '')];
  const offre = meilleure(correspondances.filter(x => ids.includes(x.valeur)).map(x => x.offre));
  if (!offre) return null;
  if (c.license_key.status === 'disabled') throw refusRembourse();
  if (activation) {
    if (c.activated !== true || !c.instance?.id) return null;
  } else {
    if (c.valid !== true || c.instance?.id !== String(instance)) return null;
  }
  if (c.license_key.status !== 'active') return null;
  return { offre, source: 'lemonsqueezy', ref: String(c.meta.order_id || '').slice(0, LONGUEUR_REF_MAX), instance: activation ? c.instance.id : String(instance) };
}

/* ---------- 4. Stripe (session issue d'un lien de paiement) ---------- */
// API : GET /v1/checkout/sessions/{id}?expand[]=payment_intent.latest_charge, avec une clé restreinte
// en lecture (Checkout Sessions, PaymentIntents, Charges). Une session Checkout reste « paid » après
// un remboursement : c'est le paiement (latest_charge) qui indique le remboursement ou le litige.
export const formatStripe = cle => /^cs_(live|test)_[A-Za-z0-9]{10,}$/.test(cle);

export async function verifierStripe(cle, env, fetchImpl) {
  const secret = String(env.STRIPE_SECRET_KEY || '').trim();
  const liens = lireCorrespondances(env.STRIPE_LIENS, 'pro');
  if (!secret || !liens.length) return null;
  const lire = async chemin => {
    try {
      const r = await requete(fetchImpl, `https://api.stripe.com/v1/${chemin}`, { method: 'GET', headers: { Authorization: `Bearer ${secret}` } });
      if (r.statut >= 500 || r.statut === 401 || r.statut === 403 || r.statut === 429) throw new ErreurFournisseur(`Stripe : réponse ${r.statut}`);
      return r;
    } catch (e) { throw e instanceof ErreurFournisseur ? e : new ErreurFournisseur('Stripe injoignable'); }
  };
  const r = await lire(`checkout/sessions/${encodeURIComponent(cle.trim())}?expand%5B%5D=payment_intent.latest_charge`);
  const s = r.corps;
  if (r.statut !== 200 || !s || s.object !== 'checkout.session') return null;
  if (s.status !== 'complete' || !['paid', 'no_payment_required'].includes(s.payment_status)) return null;
  const offre = meilleure(liens.filter(x => x.valeur === s.payment_link).map(x => x.offre));
  if (!offre) return null;
  if (s.payment_status === 'paid') {
    if (s.mode && s.mode !== 'payment') return null; // la formation est vendue en paiement unique
    let pi = s.payment_intent;
    if (typeof pi === 'string') {
      const rp = await lire(`payment_intents/${encodeURIComponent(pi)}?expand%5B%5D=latest_charge`);
      pi = rp.statut === 200 ? rp.corps : null;
    }
    if (!pi || pi.object !== 'payment_intent') throw new ErreurFournisseur('Stripe : paiement illisible (droits de la clé restreinte ?)');
    if (pi.status !== 'succeeded') return null;
    const charge = pi.latest_charge;
    if (!charge || typeof charge !== 'object') throw new ErreurFournisseur('Stripe : paiement illisible (droits de la clé restreinte ?)');
    if (charge.refunded || charge.amount_refunded > 0 || charge.disputed) throw refusRembourse();
  }
  return { offre, source: 'stripe', ref: String(s.id).slice(0, LONGUEUR_REF_MAX) };
}

/**
 * Vérifie une clé saisie en essayant les sources configurées, dans l'ordre le plus économique.
 * `options.renouvellement` : l'appareil a déjà été activé (jeton précédent valide pour cette clé) ;
 * `options.instance` : instance de licence Lemon Squeezy de cet appareil.
 * Renvoie { offre, source, ref, instance? } ou null. Lève RefusCle (refus explicite), ou
 * ErreurFournisseur si un fournisseur est injoignable et qu'aucune autre source n'a validé la clé.
 */
export async function verifierCle(cleBrute, env, fetchImpl = fetch, options = {}) {
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
      const r = await essai(cle, env, fetchImpl, options);
      if (r) return r;
    } catch (e) {
      if (e instanceof ErreurFournisseur) panne = e; else throw e;
    }
  }
  if (panne) throw panne;
  return null;
}
