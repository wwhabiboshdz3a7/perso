// POST /.netlify/functions/recuperer  { "email": "…" }
// Récupération en libre-service d'un achat Stripe : retrouve les sessions de paiement payées avec
// cette adresse (liens de paiement de STRIPE_LIENS) et envoie à cette même adresse le lien
// d'activation /merci/achat.html?session_id=cs_…  La réponse est identique qu'un achat existe ou non.
// Variables : STRIPE_SECRET_KEY, STRIPE_LIENS, EMAIL_FOURNISSEUR, EMAIL_API_KEY, EMAIL_EXPEDITEUR,
// SITE_URL (facultatif : sinon l'adresse du site Netlify).
import { json, lireEnv, ipClient } from '../lib/http.mjs';
import { lireCorrespondances, requete } from '../lib/verificateurs.mjs';
import { envoyerEmail, emailConfigure, lireExpediteur, emailValide, ErreurEmail } from '../lib/email.mjs';
import { NOMS_OFFRES } from '../../public/cours/content/catalogue.js';

const FENETRE_MS = 15 * 60 * 1000;
const MAX_PAR_IP = 5;
const MAX_PAR_EMAIL = 3;
const compteurs = new Map();
function limite(cle, max, maintenant) {
  const e = compteurs.get(cle);
  if (!e || maintenant - e.debut > FENETRE_MS) { compteurs.set(cle, { debut: maintenant, n: 1 }); return false; }
  e.n++;
  if (compteurs.size > 5000) compteurs.clear();
  return e.n > max;
}
export function reinitialiserLimitesRecuperation() { compteurs.clear(); }

const MESSAGE = 'Si un achat correspond à cette adresse, vous recevrez dans quelques minutes un email avec votre lien d\'activation. Pensez à regarder dans les indésirables.';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Sessions Checkout payées pour cet email, issues des liens de paiement de la formation. */
export async function sessionsPayees(email, env, fetchImpl) {
  const liens = lireCorrespondances(env.STRIPE_LIENS, 'pro');
  const variantes = [...new Set([email, email.toLowerCase()])];
  const trouvees = new Map();
  for (const v of variantes) {
    const q = new URLSearchParams({ 'customer_details[email]': v, status: 'complete', limit: '20' });
    const r = await requete(fetchImpl, `https://api.stripe.com/v1/checkout/sessions?${q}`, { method: 'GET', headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY.trim()}` } });
    if (r.statut !== 200 || !Array.isArray(r.corps?.data)) throw new Error(`Stripe : réponse ${r.statut}`);
    for (const s of r.corps.data) {
      if (s.status !== 'complete' || !['paid', 'no_payment_required'].includes(s.payment_status)) continue;
      const lien = liens.find(x => x.valeur === s.payment_link);
      if (lien) trouvees.set(s.id, { id: s.id, offre: lien.offre, cree: s.created });
    }
  }
  return [...trouvees.values()].sort((a, b) => b.cree - a.cree);
}

export function emailActivation(sessions, site, nomProduit) {
  const date = t => new Date(t * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const liens = sessions.map(s => ({ ...s, url: `${site}/merci/achat.html?session_id=${encodeURIComponent(s.id)}` }));
  const sujet = `Votre lien d'activation · ${nomProduit}`;
  const texte = [
    'Bonjour,',
    '',
    `Vous avez demandé à retrouver votre accès à la formation ${nomProduit}. Ouvrez le lien ci-dessous sur l'appareil à activer :`,
    '',
    ...liens.map(l => `Offre ${NOMS_OFFRES[l.offre]} (achat du ${date(l.cree)}) :\n${l.url}\nVotre clé : ${l.id}\n`),
    'Conservez cet email : le même lien et la même clé servent sur tous vos appareils.',
    'Vous n\'êtes pas à l\'origine de cette demande ? Ignorez simplement ce message.',
    '',
    nomProduit
  ].join('\n');
  const html = `<p>Bonjour,</p><p>Vous avez demandé à retrouver votre accès à la formation ${esc(nomProduit)}. Ouvrez le lien ci-dessous sur l'appareil à activer :</p>`
    + liens.map(l => `<p><a href="${esc(l.url)}">Activer mon accès ${esc(NOMS_OFFRES[l.offre])}</a> (achat du ${esc(date(l.cree))})<br>Votre clé : <code>${esc(l.id)}</code></p>`).join('')
    + '<p>Conservez cet email : le même lien et la même clé servent sur tous vos appareils.</p><p>Vous n\'êtes pas à l\'origine de cette demande ? Ignorez simplement ce message.</p>'
    + `<p>${esc(nomProduit)}</p>`;
  return { sujet, texte, html };
}

export default async function recuperer(req, context) {
  if (req.method !== 'POST') return json(405, { erreur: 'Méthode non autorisée.' }, { Allow: 'POST' });
  const env = lireEnv();
  if (!String(env.STRIPE_SECRET_KEY || '').trim() || !lireCorrespondances(env.STRIPE_LIENS).length || !emailConfigure(env)) {
    return json(200, { ok: false, indisponible: true, erreur: 'La récupération automatique n\'est pas activée sur ce site : écrivez au support en indiquant l\'adresse email utilisée pour l\'achat.' });
  }
  let email = '';
  try {
    const type = req.headers.get('content-type') || '';
    email = type.includes('application/json') ? (await req.json())?.email : new URLSearchParams(await req.text()).get('email');
  } catch { return json(400, { erreur: 'Requête illisible.' }); }
  email = typeof email === 'string' ? email.trim() : '';
  if (!emailValide(email)) return json(200, { ok: false, erreur: 'Indiquez l\'adresse email utilisée lors du paiement.' });

  const maintenant = Date.now();
  if (limite('ip:' + ipClient(req, context), MAX_PAR_IP, maintenant) || limite('email:' + email.toLowerCase(), MAX_PAR_EMAIL, maintenant)) {
    return json(429, { erreur: 'Trop de demandes. Réessayez dans un quart d\'heure.' }, { 'Retry-After': '900' });
  }

  try {
    const sessions = await sessionsPayees(email, env, globalThis.fetch);
    if (sessions.length) {
      const site = String(env.SITE_URL || env.URL || new URL(req.url).origin).replace(/\/+$/, '');
      const nomProduit = String(env.NOM_PRODUIT || lireExpediteur(env.EMAIL_EXPEDITEUR)?.nom || 'Levier');
      await envoyerEmail({ a: email, ...emailActivation(sessions.slice(0, 5), site, nomProduit) }, env, globalThis.fetch);
    }
  } catch (e) {
    // Même réponse dans tous les cas (pas d'indice sur l'existence d'un achat) ; l'erreur est journalisée.
    console.error('recuperer', e instanceof ErreurEmail ? e.message : e);
  }
  return json(200, { ok: true, message: MESSAGE });
}
