// « Cerveau IA » facultatif : n'importe quel point d'accès compatible avec
// l'API Chat Completions d'OpenAI (Groq, OpenRouter, Mistral, Ollama…).
// La clé est conservée dans ce navigateur et n'est envoyée qu'à ce point d'accès.

export const PROVIDERS = {
  off: { label: 'Désactivé (réponses locales seulement)', base: '', model: '' },
  groq: { label: 'Groq', base: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  openrouter: { label: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: 'meta-llama/llama-3.3-70b-instruct:free' },
  mistral: { label: 'Mistral AI', base: 'https://api.mistral.ai/v1', model: 'mistral-small-latest' },
  huggingface: { label: 'Hugging Face (routeur)', base: 'https://router.huggingface.co/v1', model: 'meta-llama/Llama-3.3-70B-Instruct' },
  ollama: { label: 'Ollama (local)', base: 'http://localhost:11434/v1', model: 'llama3.2' },
  lmstudio: { label: 'LM Studio (local)', base: 'http://localhost:1234/v1', model: 'local-model' },
  custom: { label: 'Autre point d’accès compatible OpenAI', base: '', model: '' },
};

export function defaultSystemPrompt(name, assistant = 'JARVIS') {
  return `Tu es ${assistant || 'JARVIS'}, l’assistant personnel de ${name || 'l’utilisateur'}, fondateur de l’agence NEXORA. `
    + 'Réponds toujours en français, avec un ton posé, précis et une pointe d’humour pince-sans-rire. '
    + 'Tes réponses sont lues à voix haute : une à trois phrases courtes, sans liste, sans markdown, sans émoji.';
}

/** Nettoie une réponse pour la synthèse vocale. */
export function forSpeech(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#`>|]/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export class Brain {
  constructor(settings) {
    this.settings = settings;
    this.history = [];
  }

  config() {
    const s = this.settings.data;
    const p = PROVIDERS[s.aiProvider] || PROVIDERS.off;
    return {
      provider: s.aiProvider,
      base: (s.aiBase || p.base || '').replace(/\/+$/, ''),
      model: s.aiModel || p.model,
      key: this.settings.aiKey,
      system: s.aiSystem || defaultSystemPrompt(s.userName, s.assistantName),
    };
  }

  get enabled() {
    const c = this.config();
    return c.provider !== 'off' && !!c.base && !!c.model;
  }

  get label() {
    const c = this.config();
    if (!this.enabled) return 'local';
    return `${(PROVIDERS[c.provider] || PROVIDERS.custom).label} · ${c.model}`;
  }

  async ask(text, { remember = true } = {}) {
    const c = this.config();
    if (!this.enabled) throw new Error('Aucun cerveau IA configuré.');
    const messages = [{ role: 'system', content: c.system }, ...this.history.slice(-8), { role: 'user', content: text }];
    const headers = { 'Content-Type': 'application/json' };
    if (c.key) headers.Authorization = `Bearer ${c.key}`;
    if (c.provider === 'openrouter') { headers['HTTP-Referer'] = location.origin; headers['X-Title'] = 'JARVIS'; }
    let res;
    try {
      res = await fetch(`${c.base}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: c.model, messages, temperature: 0.6, max_tokens: 320, stream: false }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      throw new Error(err?.name === 'TimeoutError' ? 'Le cerveau IA met trop de temps à répondre.' : 'Point d’accès injoignable (réseau ou CORS).');
    }
    if (!res.ok) {
      const msg = { 401: 'Clé API refusée.', 403: 'Accès refusé par le fournisseur.', 404: 'Adresse ou modèle introuvable.', 429: 'Quota du fournisseur atteint, réessayez plus tard.' }[res.status];
      throw new Error(msg || `Erreur du fournisseur (${res.status}).`);
    }
    const data = await res.json().catch(() => null);
    const answer = data?.choices?.[0]?.message?.content;
    if (!answer) throw new Error('Réponse vide du cerveau IA.');
    if (remember) {
      this.history.push({ role: 'user', content: text }, { role: 'assistant', content: answer });
      this.history = this.history.slice(-12);
    }
    return answer.trim();
  }

  async test() {
    return this.ask('Réponds simplement « Systèmes opérationnels. »', { remember: false });
  }
}
