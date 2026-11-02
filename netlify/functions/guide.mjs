// Mini-guide de l'aimant à prospects, remis contre une adresse email.
// POST /.netlify/functions/guide  { email, consentement: "oui", prenom? }
//   → { ok: true, jeton, envoye } : le jeton (signé, valable un an) ouvre le guide sur /merci/ ;
//     si l'envoi d'emails est configuré (EMAIL_*), le lien du guide est aussi envoyé à cette adresse.
// GET  /.netlify/functions/guide?g=<jeton>  → { ok: true, html } (le guide, servi depuis prive/guide/).
// Le guide n'est donc pas dans le dossier publié : /merci/ ne l'affiche qu'avec un jeton.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { json, lireEnv, ipClient } from '../lib/http.mjs';
import { creerJeton, verifierJeton } from '../lib/jeton.mjs';
import { dossierPrive } from '../lib/contenu.mjs';
import { envoyerEmail, emailConfigure, lireExpediteur, emailValide, ErreurEmail } from '../lib/email.mjs';

const DUREE_S = 365 * 86400;
const FENETRE_MS = 10 * 60 * 1000;
const MAX_PAR_IP = 20;
const compteurs = new Map();
export function reinitialiserLimitesGuide() { compteurs.clear(); }
function limite(ip, maintenant) {
  const e = compteurs.get(ip);
  if (!e || maintenant - e.debut > FENETRE_MS) { compteurs.set(ip, { debut: maintenant, n: 1 }); return false; }
  e.n++;
  if (compteurs.size > 5000) compteurs.clear();
  return e.n > MAX_PAR_IP;
}

// Secret dérivé : un jeton de guide ne peut jamais servir de jeton d'accès à la formation, et inversement.
const secretGuide = secret => createHash('sha256').update(`${secret}|guide`).digest('hex');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let cacheGuide = null;
async function lireGuide() {
  cacheGuide ??= await readFile(path.join(dossierPrive(), 'guide', '7-services.html'), 'utf8');
  return cacheGuide;
}

export function emailGuide(lien, prenom, nomProduit) {
  const bonjour = prenom ? `Bonjour ${prenom},` : 'Bonjour,';
  const sujet = `Votre mini-guide : 7 services IA à proposer ce mois-ci · ${nomProduit}`;
  const texte = [
    bonjour, '',
    'Merci pour votre inscription. Voici votre mini-guide « 7 services IA à proposer ce mois-ci » :',
    lien, '',
    'Pour chaque service : à qui le proposer, le livrable, les outils, la façon de le livrer et le point de vigilance.',
    'Les modules 0 et 1 de la formation sont en accès libre dans l\'espace membre.', '',
    'Vous recevrez dans les prochains jours cinq conseils pratiques, puis environ un email par semaine. Vous pouvez vous désinscrire à tout moment, en un clic, depuis chaque email.', '',
    nomProduit
  ].join('\n');
  const html = `<p>${esc(bonjour)}</p><p>Merci pour votre inscription. Voici votre mini-guide :</p><p><a href="${esc(lien)}"><b>Ouvrir le mini-guide « 7 services IA à proposer ce mois-ci »</b></a></p>`
    + '<p>Pour chaque service : à qui le proposer, le livrable, les outils, la façon de le livrer et le point de vigilance. Les modules 0 et 1 de la formation sont en accès libre dans l\'espace membre.</p>'
    + '<p>Vous recevrez dans les prochains jours cinq conseils pratiques, puis environ un email par semaine. Vous pouvez vous désinscrire à tout moment, en un clic, depuis chaque email.</p>'
    + `<p>${esc(nomProduit)}</p>`;
  return { sujet, texte, html };
}

export default async function guide(req, context) {
  const env = lireEnv();
  const secret = env.TOKEN_SECRET;
  if (!secret || secret.length < 32) return json(500, { erreur: 'Configuration serveur incomplète (TOKEN_SECRET).' });

  if (req.method === 'GET') {
    const g = new URL(req.url).searchParams.get('g') || '';
    const charge = verifierJeton(g, secretGuide(secret));
    if (!charge || charge.o !== 'guide') return json(200, { ok: false, erreur: 'Lien du guide invalide ou expiré : inscrivez-vous à nouveau sur la page de la formation.' });
    try { return json(200, { ok: true, html: await lireGuide() }); }
    catch (e) { console.error('guide', e); return json(500, { erreur: 'Le guide est momentanément indisponible.' }); }
  }
  if (req.method !== 'POST') return json(405, { erreur: 'Méthode non autorisée.' }, { Allow: 'GET, POST' });

  let d = {};
  try {
    const type = req.headers.get('content-type') || '';
    d = type.includes('application/json') ? await req.json() : Object.fromEntries(new URLSearchParams(await req.text()));
  } catch { return json(400, { erreur: 'Requête illisible.' }); }
  const email = typeof d?.email === 'string' ? d.email.trim() : '';
  const prenom = typeof d?.prenom === 'string' ? d.prenom.trim().slice(0, 60) : '';
  if (d?.['bot-field']) return json(200, { ok: false, erreur: 'Envoi refusé.' });
  if (!emailValide(email)) return json(200, { ok: false, erreur: 'Indiquez une adresse email valide.' });
  if (d?.consentement !== 'oui') return json(200, { ok: false, erreur: 'Cochez la case pour confirmer votre accord.' });
  const maintenant = Date.now();
  if (limite('ip:' + ipClient(req, context), maintenant)) return json(429, { erreur: 'Trop de demandes. Réessayez dans quelques minutes.' }, { 'Retry-After': '600' });

  const empreinte = createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16);
  const { jeton } = creerJeton({ offre: 'guide', source: 'aimant', empreinte }, secretGuide(secret), DUREE_S, maintenant);
  let envoye = false;
  if (emailConfigure(env)) {
    const site = String(env.SITE_URL || env.URL || new URL(req.url).origin).replace(/\/+$/, '');
    const nomProduit = String(env.NOM_PRODUIT || lireExpediteur(env.EMAIL_EXPEDITEUR)?.nom || 'Levier');
    try {
      await envoyerEmail({ a: email, ...emailGuide(`${site}/merci/?g=${jeton}`, prenom, nomProduit) }, env, globalThis.fetch);
      envoye = true;
    } catch (e) { console.error('guide', e instanceof ErreurEmail ? e.message : e); }
  }
  return json(200, { ok: true, jeton, envoye });
}
