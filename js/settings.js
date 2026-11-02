// Réglages persistants (localStorage) — jamais la clé API ici.

const KEY = 'nour.settings';

export const DEFAULTS = {
  version: 1,
  onboarded: false,
  connection: {
    mode: 'browser', // 'browser' | 'server'
    provider: 'groq',
    baseUrl: '',
    model: '',
    serverModel: '',
    freeOnly: false,
    showAll: false,
  },
  assistant: {
    name: 'Nour',
    avatar: { type: 'glyph', value: 'arche' },
    tone: 'chaleureux',
    defaultPersona: 'perso',
    promptOverrides: {},
    customInstructions: '',
  },
  profile: {
    name: 'Ibrahim',
    about: "Fondateur de l'agence digitale NEXORA (Toulouse · France · Algérie) : sites web, films et publicités, automatisations.",
  },
  prefs: {
    theme: 'system', // 'system' | 'light' | 'dark'
    readingFont: 'sans', // 'sans' | 'serif'
    textSize: 'm',
    enterToSend: true,
    temperature: 0.7,
    maxTokens: '',
    contextTokens: 16000,
    voiceURI: '',
    speechRate: 1,
    useMemory: true,
    idleTimeout: 60,
  },
};

function merge(base, extra) {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return extra === undefined ? base : extra;
  const out = { ...base };
  if (extra && typeof extra === 'object') {
    for (const k of Object.keys(extra)) {
      out[k] = (k in base && typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k]))
        ? merge(base[k], extra[k])
        : extra[k];
    }
  }
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return merge(DEFAULTS, raw ? JSON.parse(raw) : {});
  } catch {
    return structuredClone(DEFAULTS);
  }
}

const listeners = new Set();
let state = load();

export const settings = {
  get() { return state; },
  /** Met à jour une section : settings.set('prefs', { theme: 'dark' }) */
  set(section, patch) {
    state = { ...state, [section]: typeof patch === 'object' && !Array.isArray(patch) && patch !== null ? { ...state[section], ...patch } : patch };
    this.save();
    listeners.forEach((fn) => fn(state, section));
  },
  /** Relit le stockage (réglages modifiés dans un autre onglet). */
  reload() {
    state = load();
    listeners.forEach((fn) => fn(state, '*'));
  },
  replace(next) {
    state = merge(DEFAULTS, next);
    this.save();
    listeners.forEach((fn) => fn(state, '*'));
  },
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota ou mode privé */ }
  },
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  reset() {
    state = structuredClone(DEFAULTS);
    this.save();
    listeners.forEach((fn) => fn(state, '*'));
  },
};
