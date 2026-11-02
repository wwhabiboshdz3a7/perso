// Réponses JSON homogènes pour les fonctions.
export function json(statut, donnees, entetes = {}) {
  return new Response(JSON.stringify(donnees), {
    status: statut,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
      'X-Content-Type-Options': 'nosniff',
      ...entetes
    }
  });
}

/** Lit les variables d'environnement (Netlify.env si disponible, sinon process.env). */
export function lireEnv() {
  const env = { ...process.env };
  try {
    if (globalThis.Netlify?.env?.toObject) Object.assign(env, globalThis.Netlify.env.toObject());
  } catch { /* hors Netlify */ }
  return env;
}

/** Adresse IP du client, pour la limitation du nombre d'essais. */
export function ipClient(req, context) {
  return context?.ip || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'inconnue';
}
