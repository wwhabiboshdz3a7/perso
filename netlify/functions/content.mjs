// GET /.netlify/functions/content?module=m4          → contenu JSON d'un module payant
// GET /.netlify/functions/content?fichier=n8n/…json  → fichier téléchargeable (workflow n8n)
// En-tête requis : Authorization: Bearer <jeton renvoyé par /access>
import { verifierJeton, jetonDepuisRequete } from '../lib/jeton.mjs';
import { chargerModule, lireFichier } from '../lib/contenu.mjs';
import { json, lireEnv } from '../lib/http.mjs';
import { trouverModule, offrePermet, NOMS_OFFRES } from '../../public/cours/content/catalogue.js';

export default async function content(req) {
  if (req.method !== 'GET') return json(405, { erreur: 'Méthode non autorisée.' }, { Allow: 'GET' });
  const env = lireEnv();
  const url = new URL(req.url);
  const idModule = url.searchParams.get('module');
  const nomFichier = url.searchParams.get('fichier');

  const charge = verifierJeton(jetonDepuisRequete(req), env.TOKEN_SECRET);
  if (!charge) return json(401, { erreur: 'Accès non autorisé ou expiré. Saisissez à nouveau votre code.' }, { 'WWW-Authenticate': 'Bearer' });

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
