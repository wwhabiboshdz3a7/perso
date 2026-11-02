// Fournisseurs compatibles OpenAI (/v1/chat/completions, /v1/models) et familles de modèles ouverts.

export const PROVIDERS = [
  {
    id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1',
    keyUrl: 'https://console.groq.com/keys', blurb: 'Très rapide, offre gratuite', tag: 'Rapide',
    keyHint: 'Commence généralement par « gsk_ ».',
  },
  {
    id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai/settings/keys', blurb: 'Des centaines de modèles, dont des gratuits', tag: 'Gratuits',
    keyHint: 'Commence généralement par « sk-or- ».', freeFilter: true,
    extraHeaders: () => ({ 'HTTP-Referer': location.origin, 'X-Title': 'Nour' }),
  },
  {
    id: 'together', name: 'Together AI', baseUrl: 'https://api.together.xyz/v1',
    keyUrl: 'https://api.together.ai/settings/api-keys', blurb: 'Grand catalogue de modèles ouverts',
  },
  {
    id: 'mistral', name: 'Mistral', baseUrl: 'https://api.mistral.ai/v1',
    keyUrl: 'https://console.mistral.ai/api-keys', blurb: 'La Plateforme, modèles français', tag: 'FR',
  },
  {
    id: 'huggingface', name: 'Hugging Face', baseUrl: 'https://router.huggingface.co/v1',
    keyUrl: 'https://huggingface.co/settings/tokens', blurb: 'Inference Providers (jeton « fine-grained »)',
    keyHint: 'Jeton « hf_… » avec la permission « Make calls to Inference Providers ».',
  },
  {
    id: 'deepinfra', name: 'DeepInfra', baseUrl: 'https://api.deepinfra.com/v1/openai',
    keyUrl: 'https://deepinfra.com/dash/api_keys', blurb: 'Modèles ouverts à bas coût',
  },
  {
    id: 'cerebras', name: 'Cerebras', baseUrl: 'https://api.cerebras.ai/v1',
    keyUrl: 'https://cloud.cerebras.ai/', blurb: 'Inférence ultra-rapide', tag: 'Rapide',
  },
  {
    id: 'ollama', name: 'Ollama', baseUrl: 'http://localhost:11434/v1', local: true, keyOptional: true,
    keyUrl: 'https://ollama.com/download', blurb: 'Sur votre ordinateur, hors ligne', tag: 'Local',
  },
  {
    id: 'lmstudio', name: 'LM Studio', baseUrl: 'http://localhost:1234/v1', local: true, keyOptional: true,
    keyUrl: 'https://lmstudio.ai/', blurb: 'Serveur local avec interface', tag: 'Local',
  },
  {
    id: 'custom', name: 'URL personnalisée', baseUrl: '', keyOptional: true, custom: true,
    blurb: 'Tout serveur compatible OpenAI (vLLM, llama.cpp…)',
  },
];

export const providerById = (id) => PROVIDERS.find((p) => p.id === id) || PROVIDERS[PROVIDERS.length - 1];

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
