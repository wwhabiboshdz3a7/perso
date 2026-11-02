// GET /.netlify/functions/content?module=m4          → contenu JSON d'un module payant
// GET /.netlify/functions/content?fichier=n8n/…json  → fichier téléchargeable (workflow n8n)
// En-tête requis : Authorization: Bearer <jeton renvoyé par /access>
// Un jeton révoqué (REVOKED_KEYS, prive/revocations.txt) ou issu d'un code retiré est refusé (401).
import { verifierJeton, jetonDepuisRequete } from '../lib/jeton.mjs';
import { chargerModule, lireFichier, envAcces } from '../lib/contenu.mjs';
import { motifRetrait } from '../lib/revocation.mjs';
import { json, lireEnv } from '../lib/http.mjs';
import { trouverModule, offrePermet, NOMS_OFFRES } from '../../public/cours/content/catalogue.js';

export default async function content(req) {
  if (req.method !== 'GET') return json(405, { erreur: 'Méthode non autorisée.' }, { Allow: 'GET' });
  const env = envAcces(lireEnv());
  const url = new URL(req.url);
  const idModule = url.searchParams.get('module');
  const nomFichier = url.searchParams.get('fichier');

  const charge = verifierJeton(jetonDepuisRequete(req), env.TOKEN_SECRET);
  if (!charge) return json(401, { erreur: 'Accès non autorisé ou expiré. Saisissez à nouveau votre code.', code: 'expire' }, { 'WWW-Authenticate': 'Bearer' });
  if (motifRetrait(charge, env)) return json(401, { erreur: 'Cet accès a été désactivé (remboursement ou code retiré). Une question ? Écrivez au support.', code: 'revoque' }, { 'WWW-Authenticate': 'Bearer' });

  try {
    if (nomFichier) {
      const f = await lireFichier(nomFichier);
      if (!f) return json(404, { erreur: 'Fichier introuvable.' });
      const requise = trouverModule(f.module).offre;
      if (!offrePermet(charge.o, requise)) return json(403, { erreur: `Ce fichier fait partie de l'offre ${NOMS_OFFRES[requise]}.`, offreRequise: requise });
      return new Response(f.contenu, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${f.nom.split('/').pop()}"`,
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex'
        }
      });
    }

    if (!idModule) return json(400, { erreur: 'Paramètre « module » manquant.' });
    const meta = trouverModule(idModule);
    if (!meta) return json(404, { erreur: 'Module inconnu.' });
    if (meta.offre === 'gratuit') return json(400, { erreur: 'Ce module est gratuit et servi directement par le site.' });
    if (!offrePermet(charge.o, meta.offre)) return json(403, { erreur: `Ce module fait partie de l'offre ${NOMS_OFFRES[meta.offre]}.`, offreRequise: meta.offre });
    const donnees = await chargerModule(idModule);
    if (!donnees) return json(404, { erreur: 'Contenu indisponible.' });
    return json(200, { id: idModule, offre: meta.offre, ...donnees });
  } catch (e) {
    console.error('content', e);
    return json(500, { erreur: 'Erreur interne.' });
  }
}
