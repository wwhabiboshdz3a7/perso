// Envoi d'emails transactionnels par l'API d'un prestataire (Brevo ou Resend), sans dépendance.
// Variables : EMAIL_FOURNISSEUR (brevo | resend), EMAIL_API_KEY, EMAIL_EXPEDITEUR (« Nom <adresse> »).
import { requete } from './verificateurs.mjs';

export class ErreurEmail extends Error {}

/** Adresse email plausible (contrôle de forme seulement). */
export const emailValide = e => typeof e === 'string' && e.length <= 200 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(e);

/** « Levier <acces@domaine.fr> » → { nom: 'Levier', adresse: 'acces@domaine.fr' } */
export function lireExpediteur(brut) {
  const t = String(brut || '').trim();
  const m = t.match(/^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/);
  if (m) return { nom: m[1].replace(/^"|"$/g, '').trim(), adresse: m[2] };
  return /^[^\s@<>]+@[^\s@<>]+$/.test(t) ? { nom: '', adresse: t } : null;
}

/** L'envoi d'emails est-il configuré ? */
export function emailConfigure(env) {
  return ['brevo', 'resend'].includes(String(env.EMAIL_FOURNISSEUR || '').toLowerCase()) && !!String(env.EMAIL_API_KEY || '').trim() && !!lireExpediteur(env.EMAIL_EXPEDITEUR);
}

/** Envoie un email. Lève ErreurEmail en cas d'échec. */
export async function envoyerEmail({ a, sujet, texte, html }, env, fetchImpl = fetch) {
  if (!emailConfigure(env)) throw new ErreurEmail('Envoi d\'emails non configuré');
  const fournisseur = env.EMAIL_FOURNISSEUR.toLowerCase();
  const cle = env.EMAIL_API_KEY.trim();
  const { nom, adresse } = lireExpediteur(env.EMAIL_EXPEDITEUR);
  let r;
  try {
    if (fournisseur === 'brevo') {
      // https://developers.brevo.com/reference/sendtransacemail
      r = await requete(fetchImpl, 'https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': cle, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ sender: { name: nom || undefined, email: adresse }, to: [{ email: a }], subject: sujet, textContent: texte, htmlContent: html })
      });
    } else {
      // https://resend.com/docs/api-reference/emails/send-email
      r = await requete(fetchImpl, 'https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: nom ? `${nom} <${adresse}>` : adresse, to: [a], subject: sujet, text: texte, html })
      });
    }
  } catch { throw new ErreurEmail(`${fournisseur} injoignable`); }
  if (r.statut < 200 || r.statut >= 300) throw new ErreurEmail(`${fournisseur} : réponse ${r.statut}`);
  return r.corps;
}
