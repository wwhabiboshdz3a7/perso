// Fournisseurs compatibles OpenAI (/v1/chat/completions, /v1/models) et familles de modèles ouverts.

// Mention prudente : les offres gratuites changent souvent.
const CHECK = 'au moment de l’écriture, à vérifier sur le site du fournisseur';

// Champs de l'assistant de connexion :
//   cloud / local : catégorie ; what : présentation ; price : { kind: 'free' | 'credits' | 'paid', label, note } ;
//   keyUrl : page de création de clé ; steps : marche à suivre ; suggest : modèles ouverts conseillés
//   (motifs, pas identifiants exacts : ils sont confirmés dans la liste en direct) ; keyPrefix : format de clé.
export const PROVIDERS = [
  {
    id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', cloud: true,
    keyUrl: 'https://console.groq.com/keys', blurb: 'Très rapide, offre gratuite', tag: 'Rapide',
    keyHint: 'Commence généralement par « gsk_ ».', keyPrefix: /^gsk_/,
    pitch: 'Ultra-rapide · offre gratuite',
    what: 'Des puces conçues pour l’inférence : les réponses arrivent presque instantanément. Groq héberge uniquement des modèles ouverts (gpt-oss, Llama, Qwen, Kimi…).',
    price: { kind: 'free', label: 'Gratuit (limité)', note: `Offre gratuite avec des limites de requêtes par minute et par jour (${CHECK}).` },
    steps: 'Créez un compte (Google ou e-mail), puis « Create API Key ». Copiez la clé tout de suite : elle ne s’affiche qu’une fois.',
    suggest: [
      { re: /gpt-oss-120b/i, label: 'gpt-oss 120B', why: 'Le plus polyvalent, raisonne bien' },
      { re: /llama-3\.3-70b/i, label: 'Llama 3.3 70B', why: 'Fiable et fluide en français' },
      { re: /kimi-k2/i, label: 'Kimi K2', why: 'Très long contexte, rédaction' },
      { re: /qwen-?3-32b/i, label: 'Qwen3 32B', why: 'Excellent en code' },
      { re: /gpt-oss-20b/i, label: 'gpt-oss 20B', why: 'Le plus rapide' },
    ],
  },
  {
    id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', cloud: true,
    keyUrl: 'https://openrouter.ai/settings/keys', blurb: 'Des centaines de modèles, dont des gratuits', tag: 'Gratuits',
    keyHint: 'Commence généralement par « sk-or- ».', keyPrefix: /^sk-or-/, freeFilter: true, freeDefault: true,
    pitch: 'Une clé, des centaines de modèles',
    what: 'Une seule clé pour des centaines de modèles servis par de nombreux hébergeurs. Les modèles dont l’identifiant finit par « :free » sont gratuits.',
    price: { kind: 'free', label: 'Modèles gratuits', note: `Les modèles « :free » sont gratuits avec un quota quotidien limité, relevé après un premier achat de crédits (${CHECK}).` },
    steps: 'Créez un compte, puis « Create Key ». Aucun moyen de paiement n’est nécessaire pour les modèles « :free ».',
    extraHeaders: () => ({ 'HTTP-Referer': location.origin, 'X-Title': 'Nour' }),
    suggest: [
      { re: /gpt-oss-120b/i, label: 'gpt-oss 120B', why: 'Polyvalent, raisonne bien' },
      { re: /llama-3\.3-70b-instruct/i, label: 'Llama 3.3 70B', why: 'Fiable en français' },
      { re: /deepseek-(chat-v3|v3)/i, label: 'DeepSeek V3', why: 'Généraliste très solide' },
      { re: /qwen3-235b|qwen3-coder/i, label: 'Qwen3 (grand modèle)', why: 'Code et analyse' },
      { re: /kimi-k2/i, label: 'Kimi K2', why: 'Long contexte' },
      { re: /mistral-small/i, label: 'Mistral Small', why: 'Natif en français' },
    ],
  },
  {
    id: 'huggingface', name: 'Hugging Face', baseUrl: 'https://router.huggingface.co/v1', cloud: true,
    keyUrl: 'https://huggingface.co/settings/tokens/new?tokenType=fineGrained', blurb: 'Inference Providers (jeton « fine-grained »)',
    keyHint: 'Jeton « hf_… » (type fine-grained) avec la permission « Make calls to Inference Providers ».', keyPrefix: /^hf_/,
    pitch: 'Le grand hub des modèles ouverts',
    what: 'La maison des modèles ouverts. « Inference Providers » donne accès, avec un seul jeton, aux modèles hébergés par plusieurs partenaires.',
    price: { kind: 'credits', label: 'Crédits offerts', note: `Un petit crédit mensuel gratuit est inclus, puis paiement à l’usage (${CHECK}).` },
    steps: 'Créez un jeton « Fine-grained » et cochez « Make calls to Inference Providers ».',
    suggest: [
      { re: /gpt-oss-120b/i, label: 'gpt-oss 120B', why: 'Polyvalent, raisonne bien' },
      { re: /llama-3\.3-70b/i, label: 'Llama 3.3 70B', why: 'Fiable en français' },
      { re: /qwen3-235b|qwen3-coder|qwen3-32b/i, label: 'Qwen3', why: 'Code et analyse' },
      { re: /deepseek-v3/i, label: 'DeepSeek V3', why: 'Généraliste très solide' },
      { re: /kimi-k2/i, label: 'Kimi K2', why: 'Long contexte' },
    ],
  },
  {
    id: 'cerebras', name: 'Cerebras', baseUrl: 'https://api.cerebras.ai/v1', cloud: true,
    // Pas d'adresse stable pour la page des clés (elle dépend de l'organisation) : la console.
    keyUrl: 'https://cloud.cerebras.ai/', keyLabel: 'Ouvrir la console Cerebras', blurb: 'Inférence ultra-rapide', tag: 'Rapide', keyPrefix: /^csk-/,
    keyHint: 'Commence généralement par « csk- ».',
    pitch: 'Parmi les plus rapides au monde',
    what: 'Des puces géantes (« wafer-scale ») qui comptent parmi les inférences les plus rapides du marché, sur des modèles ouverts (gpt-oss, Llama, Qwen).',
    price: { kind: 'free', label: 'Gratuit (limité)', note: `Offre gratuite avec des quotas journaliers (${CHECK}).` },
    steps: 'Créez un compte sur cloud.cerebras.ai, puis ouvrez la rubrique « API Keys » du menu de gauche et « Generate API key ».',
    suggest: [
      { re: /gpt-oss-120b/i, label: 'gpt-oss 120B', why: 'Polyvalent, très rapide ici' },
      { re: /llama-?3\.3-70b/i, label: 'Llama 3.3 70B', why: 'Fiable en français' },
      { re: /qwen-?3-(235b|32b)/i, label: 'Qwen3', why: 'Code et analyse' },
      { re: /llama-?4-scout/i, label: 'Llama 4 Scout', why: 'Léger et rapide' },
    ],
  },
  {
    id: 'together', name: 'Together AI', baseUrl: 'https://api.together.xyz/v1', cloud: true,
    keyUrl: 'https://api.together.ai/settings/api-keys', blurb: 'Grand catalogue de modèles ouverts', keyPrefix: /^tgp_/,
    pitch: 'Grand catalogue, versions « Turbo »',
    what: 'Un très grand catalogue de modèles ouverts, avec des versions « Turbo » optimisées pour la vitesse.',
    price: { kind: 'paid', label: 'Payant (bas coût)', note: `Paiement à l’usage ; quelques modèles marqués « Free » ont existé (${CHECK}).` },
    steps: 'Créez un compte, puis copiez la clé depuis « Settings → API Keys ».',
    suggest: [
      { re: /gpt-oss-120b/i, label: 'gpt-oss 120B', why: 'Polyvalent, raisonne bien' },
      { re: /llama-3\.3-70b-instruct-turbo/i, label: 'Llama 3.3 70B Turbo', why: 'Rapide, fiable' },
      { re: /qwen3-235b/i, label: 'Qwen3 235B', why: 'Code et analyse' },
      { re: /deepseek-v3/i, label: 'DeepSeek V3', why: 'Généraliste très solide' },
      { re: /kimi-k2/i, label: 'Kimi K2', why: 'Long contexte' },
    ],
  },
  {
    id: 'mistral', name: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', cloud: true,
    keyUrl: 'https://console.mistral.ai/api-keys', blurb: 'La Plateforme, modèles français', tag: 'FR',
    pitch: 'Modèles français à poids ouverts',
    what: 'La Plateforme de Mistral AI (Paris). Ses modèles à poids ouverts — Mistral Small, Nemo, Magistral Small, Devstral, Pixtral — sont natifs en français.',
    price: { kind: 'free', label: 'Essai gratuit', note: `Une offre d’essai gratuite à limites réduites existait (${CHECK}), sinon paiement à l’usage.` },
    steps: 'Créez un compte sur console.mistral.ai, choisissez une offre, puis « Create new key ». Si le test signale un blocage CORS, utilisez le serveur Netlify.',
    suggest: [
      { re: /mistral-small/i, label: 'Mistral Small', why: 'Poids ouverts, natif en français' },
      { re: /magistral-small/i, label: 'Magistral Small', why: 'Raisonnement, poids ouverts' },
      { re: /devstral-small/i, label: 'Devstral Small', why: 'Code, poids ouverts' },
      { re: /open-mistral-nemo|mistral-nemo/i, label: 'Mistral Nemo', why: 'Léger, poids ouverts' },
      { re: /pixtral-12b/i, label: 'Pixtral 12B', why: 'Comprend les images' },
    ],
  },
  {
    id: 'deepinfra', name: 'DeepInfra', baseUrl: 'https://api.deepinfra.com/v1/openai', cloud: true,
    keyUrl: 'https://deepinfra.com/dash/api_keys', blurb: 'Modèles ouverts à bas coût',
    pitch: 'Modèles ouverts à petit prix',
    what: 'Un hébergeur de modèles ouverts facturé au jeton, avec des tarifs parmi les plus bas.',
    price: { kind: 'paid', label: 'Payant (bas coût)', note: `Paiement à l’usage, quelques centimes par million de jetons sur les petits modèles (${CHECK}).` },
    steps: 'Créez un compte, ajoutez un moyen de paiement si demandé, puis « New API Key ».',
    suggest: [
      { re: /gpt-oss-120b/i, label: 'gpt-oss 120B', why: 'Polyvalent, raisonne bien' },
      { re: /llama-3\.3-70b-instruct/i, label: 'Llama 3.3 70B', why: 'Fiable en français' },
      { re: /qwen3-235b/i, label: 'Qwen3 235B', why: 'Code et analyse' },
      { re: /deepseek-v3/i, label: 'DeepSeek V3', why: 'Généraliste très solide' },
      { re: /kimi-k2/i, label: 'Kimi K2', why: 'Long contexte' },
    ],
  },
  {
    id: 'ollama', name: 'Ollama', baseUrl: 'http://localhost:11434/v1', local: true, keyOptional: true,
    keyUrl: 'https://ollama.com/download', blurb: 'Sur votre ordinateur, hors ligne', tag: 'Local',
    pitch: 'Sur cet ordinateur, hors ligne',
    what: 'Fait tourner un modèle ouvert directement sur cet ordinateur. Il faut le télécharger (plusieurs Go) et une machine assez puissante.',
    steps: 'Installez Ollama, puis téléchargez un modèle, par exemple « ollama pull qwen3:8b ».',
    suggest: [
      { re: /qwen3/i, label: 'Qwen3', why: 'Bon compromis taille / qualité' },
      { re: /gemma3|gemma-3/i, label: 'Gemma 3', why: 'Léger' },
      { re: /llama3/i, label: 'Llama 3', why: 'Polyvalent' },
      { re: /gpt-oss/i, label: 'gpt-oss', why: 'Raisonnement (machine puissante)' },
    ],
  },
  {
    id: 'lmstudio', name: 'LM Studio', baseUrl: 'http://localhost:1234/v1', local: true, keyOptional: true,
    keyUrl: 'https://lmstudio.ai/', blurb: 'Serveur local avec interface', tag: 'Local',
    pitch: 'Application locale avec interface',
    what: 'Une application de bureau pour télécharger des modèles ouverts et les servir localement, avec une interface graphique.',
    steps: 'Installez LM Studio, téléchargez un modèle, puis démarrez le serveur dans l’onglet « Developer ».',
    suggest: [
      { re: /qwen3/i, label: 'Qwen3', why: 'Bon compromis taille / qualité' },
      { re: /gemma-?3/i, label: 'Gemma 3', why: 'Léger' },
      { re: /llama/i, label: 'Llama', why: 'Polyvalent' },
    ],
  },
  {
    id: 'custom', name: 'URL personnalisée', baseUrl: '', keyOptional: true, custom: true,
    blurb: 'Tout serveur compatible OpenAI (vLLM, llama.cpp…)',
    pitch: 'vLLM, llama.cpp, GPU cloud…',
    what: 'N’importe quel serveur compatible OpenAI : votre propre modèle sur un GPU cloud (vLLM sur RunPod, Modal, Hugging Face Inference Endpoints…) ou un llama.cpp maison.',
    steps: 'Indiquez l’adresse de l’API (elle finit généralement par /v1) et la clé si le serveur en demande une.',
    suggest: [
      { re: /gpt-oss-120b/i, label: 'gpt-oss 120B', why: 'Polyvalent' },
      { re: /llama-3\.3-70b/i, label: 'Llama 3.3 70B', why: 'Fiable en français' },
      { re: /qwen/i, label: 'Qwen', why: 'Code et analyse' },
      { re: /mistral/i, label: 'Mistral', why: 'Natif en français' },
    ],
  },
];

export const providerById = (id) => PROVIDERS.find((p) => p.id === id) || PROVIDERS[PROVIDERS.length - 1];
export const CLOUD_PROVIDERS = PROVIDERS.filter((p) => p.cloud);
export const LOCAL_PROVIDERS = PROVIDERS.filter((p) => !p.cloud);

/** Familles de modèles ouverts : servent à suggérer et filtrer, sans figer d'identifiants. */
// L'ordre compte : la première famille reconnue l'emporte. DeepSeek passe avant Llama et Qwen
// (« deepseek-r1-distill-llama-70b » est un modèle DeepSeek) ; « nemotron » n'est pas Mistral.
export const FAMILIES = [
  { id: 'gpt-oss', label: 'gpt-oss', re: /gpt-oss/i, note: 'OpenAI, poids ouverts — raisonnement solide' },
  { id: 'deepseek', label: 'DeepSeek', re: /deepseek/i, note: 'Raisonnement et code' },
  { id: 'llama', label: 'Llama', re: /llama/i, note: 'Meta — polyvalent' },
  { id: 'qwen', label: 'Qwen', re: /qwen|qwq/i, note: 'Alibaba — excellent en code et en français' },
  { id: 'mistral', label: 'Mistral', re: /mistral|mixtral|ministral|magistral|devstral|codestral|pixtral|\bnemo\b(?!tron)/i, note: 'Mistral AI — natif en français' },
  { id: 'gemma', label: 'Gemma', re: /gemma/i, note: 'Google — léger, bon en local' },
  { id: 'kimi', label: 'Kimi', re: /kimi|moonshot/i, note: 'Moonshot — long contexte' },
  { id: 'glm', label: 'GLM', re: /glm/i, note: 'Zhipu — agents et code' },
  { id: 'phi', label: 'Phi', re: /\bphi[-\d]/i, note: 'Microsoft — compact' },
];

// Ordre de préférence pour la suggestion automatique (motifs, pas identifiants exacts).
const PREFERRED = [/gpt-oss-120b/i, /llama-3\.3-70b/i, /qwen3[^/]*235b/i, /qwen3[^/]*(32b|30b)/i, /deepseek-(v3|chat)/i, /mistral-(small|medium|large)/i, /llama-4/i, /gemma-3/i, /qwen/i, /llama/i, /mistral/i];

const NON_CHAT = /embed|whisper|tts|rerank|guard|moderation|transcri|speech|audio|playai|orpheus|stable-diffusion|sdxl|flux|image-gen|dall-e|clip|bge-|e5-|nomic|bert/i;

export function familyOf(id) {
  const f = FAMILIES.find((fam) => fam.re.test(id));
  return f ? f.id : null;
}

export function normalizeModels(json) {
  const list = Array.isArray(json) ? json : (json && (json.data || json.models)) || [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const m = typeof raw === 'string' ? { id: raw } : raw;
    if (!m || !m.id || seen.has(m.id)) continue;
    seen.add(m.id);
    const id = String(m.id);
    const pricing = m.pricing || null;
    const free = /:free$/i.test(id) || !!(pricing && Number(pricing.prompt) === 0 && Number(pricing.completion) === 0);
    const modalities = (m.architecture && m.architecture.input_modalities) || m.input_modalities || [];
    const vision = (Array.isArray(modalities) && modalities.includes('image'))
      || /vision|[-_/]vl\b|-vl-|pixtral|llava|gemma-3|llama-4|scout|maverick|qwen2\.5-vl|qwen3-vl|minicpm-v/i.test(id);
    const type = m.type ? String(m.type).toLowerCase() : '';
    const chat = !NON_CHAT.test(id) && (!type || ['chat', 'language', 'code', 'text'].includes(type));
    out.push({
      id,
      name: m.name || m.display_name || '',
      context: m.context_length || m.context_window || m.max_context_length || null,
      free, vision, chat,
      family: familyOf(id),
    });
  }
  out.sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));
  return out;
}

function rank(m) {
  const i = PREFERRED.findIndex((re) => re.test(m.id));
  return (m.chat ? 0 : 1000) + (i === -1 ? (m.family ? 100 : 200) : i);
}

/** Meilleure suggestion dans une liste (premier modèle de discussion ouvert). */
export function suggestModel(models, { freeOnly = false } = {}) {
  const pool = models.filter((m) => m.chat && (!freeOnly || m.free));
  return (pool[0] || models[0] || null)?.id || '';
}

export function localCorsHelp(provider) {
  const origin = String(location.origin).replace(/[&<>"']/g, '');
  if (provider.id === 'ollama') {
    return `Ollama doit autoriser l'origine de ce site. Lancez <code>OLLAMA_ORIGINS="${origin}" ollama serve</code> (macOS : <code>launchctl setenv OLLAMA_ORIGINS "${origin}"</code> puis relancez Ollama ; Windows : variable d'environnement <code>OLLAMA_ORIGINS</code>). Le navigateur peut aussi demander l'autorisation d'accéder au réseau local.`;
  }
  if (provider.id === 'lmstudio') {
    return `Dans LM Studio : onglet <b>Developer</b> → démarrez le serveur, puis activez <b>Enable CORS</b> dans ses réglages. Le navigateur peut demander l'autorisation d'accéder au réseau local.`;
  }
  return '';
}

/* ---------- Assistant de connexion ---------- */

// Modèles propriétaires vendus sous le nom d'une famille ouverte (API seulement, poids non publiés) :
// Qwen Max / Plus / Turbo / Flash / Long, Qwen3 Max, Qwen VL Max / Plus, Qwen3 Coder Plus / Flash,
// Mistral Medium et Large « latest », Magistral et Devstral Medium, Codestral, Saba, Ministral 3B,
// Moonshot v1, GLM-4 Plus / Air / Flash / Long.
export const CLOSED_WEIGHTS = /\bqwen(?:[-_.]?\d+(?:\.\d+)?)?[-_](?:max|plus|turbo|flash|long)\b|qwen[-_]?vl[-_](?:max|plus)|qwen3[-_]coder[-_](?:plus|flash)|mistral[-_]medium|mistral[-_]large[-_]latest|magistral[-_]medium|devstral[-_]medium|codestral|mistral[-_]saba|ministral[-_]3b|moonshot[-_]v1|kimi[-_]latest|glm[-_]4[-_](?:plus|air|airx|flash|flashx|long)\b/i;

/** Le modèle appartient-il à une famille ouverte et ses poids sont-ils publiés ? */
export function isOpenWeights(m) {
  return !!(m && m.family && !CLOSED_WEIGHTS.test(m.id));
}

/** Modèles « ouverts » d'une liste : modèles de discussion à poids ouverts. */
export function openModels(models, { freeOnly = false } = {}) {
  return (models || []).filter((m) => m.chat && isOpenWeights(m) && (!freeOnly || m.free));
}

/**
 * Modèles conseillés réellement disponibles : chaque suggestion du fournisseur est rapprochée
 * de la liste en direct (variante gratuite d'abord quand `freeOnly`).
 */
export function recommendedModels(provider, models, { freeOnly = false, max = 5 } = {}) {
  const out = [];
  const used = new Set();
  const chat = (models || []).filter((m) => m.chat && !CLOSED_WEIGHTS.test(m.id));
  for (const s of provider.suggest || []) {
    const matches = chat.filter((m) => s.re.test(m.id) && !used.has(m.id) && (!freeOnly || m.free));
    if (!matches.length) continue;
    // Le plus court d'abord (« llama-3.3-70b-instruct » plutôt qu'une variante exotique).
    matches.sort((a, b) => Number(b.free) - Number(a.free) || a.id.length - b.id.length);
    const m = matches[0];
    used.add(m.id);
    out.push({ ...s, model: m });
    if (out.length >= max) break;
  }
  return out;
}

/** Modèle choisi d'office après un test réussi : préférence du propriétaire, puis conseils. */
export function pickDefaultModel(provider, models, { preferred = '', freeOnly = false } = {}) {
  if (preferred && models.some((m) => m.id === preferred)) return preferred;
  const reco = recommendedModels(provider, models, { freeOnly, max: 1 });
  if (reco.length) return reco[0].model.id;
  return suggestModel(models, { freeOnly });
}

/** Nettoie une clé collée : espaces, guillemets, « Bearer », retours à la ligne. */
export function cleanKey(raw) {
  return String(raw || '').trim().replace(/^bearer\s+/i, '').replace(/^["'`]+|["'`]+$/g, '').replace(/\s+/g, '');
}

/** La clé semble-t-elle appartenir à un autre fournisseur ? Renvoie ce fournisseur, sinon null. */
export function keyOwner(key) {
  const k = cleanKey(key);
  if (!k) return null;
  return CLOUD_PROVIDERS.find((p) => p.keyPrefix && p.keyPrefix.test(k)) || null;
}

/** Aperçu des suggestions avant le test (libellés seulement). */
export function suggestionLabels(provider, n = 4) {
  return (provider.suggest || []).slice(0, n).map((s) => s.label);
}
