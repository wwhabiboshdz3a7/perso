// Préréglages facultatifs de Nour, à modifier avant de publier le site.
// Laissez une valeur vide ('') ou null pour ne rien imposer : l'assistant de connexion
// « Choisir le cerveau de Nour » s'occupe du reste. Aucune clé ni mot de passe ici :
// ce fichier est public.
window.NOUR_CONFIG = {
  // Fournisseur cloud proposé d'office : 'groq', 'openrouter', 'huggingface', 'cerebras',
  // 'together', 'mistral' ou 'deepinfra'.
  provider: 'groq',

  // Modèle choisi après le test de connexion, s'il existe chez ce fournisseur
  // (sinon Nour prend le meilleur modèle ouvert disponible). Ex. 'openai/gpt-oss-120b'.
  model: '',

  // Modèle demandé au serveur Netlify (vide = PROVIDER_DEFAULT_MODEL du serveur).
  serverModel: '',

  // Chemin mis en avant à l'accueil : 'cloud' (clé dans ce navigateur) ou 'server'
  // (fonction Netlify protégée par mot de passe). Le serveur est de toute façon détecté.
  path: 'cloud',

  // OpenRouter : n'afficher d'abord que les modèles gratuits (« :free »).
  freeOnly: true,
};
