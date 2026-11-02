// POST /.netlify/functions/access  { "cle": "…" }
// Vérifie un code d'accès ou une clé de licence et renvoie un jeton signé (HMAC, TOKEN_SECRET).
import { creerJeton } from '../lib/jeton.mjs';
import { verifierCle, ErreurFournisseur } from '../lib/verificateurs.mjs';
import { json, lireEnv, ipClient } from '../lib/http.mjs';
import { codesDepuisFichier } from '../lib/contenu.mjs';

// Limitation simple par instance : au plus MAX_ESSAIS échecs par IP sur la fenêtre.
const FENETRE_MS = 10 * 60 * 1000;
const MAX_ESSAIS = 10;
const echecs = new Map();

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

export default async function access(req, context) {
  if (req.method !== 'POST') return json(405, { erreur: 'Méthode non autorisée.' }, { Allow: 'POST' });
  const env = lireEnv();
  const secret = env.TOKEN_SECRET;
  if (!secret || secret.length < 32) return json(500, { erreur: 'Configuration serveur incomplète (TOKEN_SECRET).' });

  const ip = ipClient(req, context);
  const maintenant = Date.now();
  if (bloque(ip, maintenant)) return json(429, { erreur: 'Trop d\'essais. Réessayez dans quelques minutes.' }, { 'Retry-After': '600' });

  let cle = '';
  try {
    const type = req.headers.get('content-type') || '';
    if (type.includes('application/json')) cle = (await req.json())?.cle;
    else cle = new URLSearchParams(await req.text()).get('cle');
  } catch { return json(400, { erreur: 'Requête illisible.' }); }
  cle = typeof cle === 'string' ? cle.trim() : '';
  if (!cle) return json(400, { erreur: 'Saisissez votre code d\'accès ou votre clé de licence.' });

  let resultat;
  try {
    const envCodes = { ...env, ACCESS_CODE_HASHES: [env.ACCESS_CODE_HASHES, codesDepuisFichier()].filter(Boolean).join('\n') };
    resultat = await verifierCle(cle, envCodes, globalThis.fetch);
  } catch (e) {
    if (e instanceof ErreurFournisseur) return json(502, { erreur: 'Le service de vérification des licences ne répond pas. Réessayez dans un instant.' });
    console.error('access', e);
    return json(500, { erreur: 'Erreur interne.' });
  }
  if (!resultat) {
    noterEchec(ip, maintenant);
    return json(401, { erreur: 'Code ou clé de licence non reconnu. Vérifiez la saisie (copiez-collez depuis l\'email de confirmation).' });
  }

  const jours = Math.min(Math.max(parseInt(env.TOKEN_TTL_DAYS || '180', 10) || 180, 1), 730);
  const { jeton, charge } = creerJeton(resultat, secret, jours * 86400, maintenant);
  return json(200, { jeton, offre: charge.o, source: charge.s, expire: charge.exp });
}
