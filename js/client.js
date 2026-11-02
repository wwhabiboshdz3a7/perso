// Client des API compatibles OpenAI : mode « navigateur » (clé locale) ou « serveur » (fonction Netlify).

import { settings } from './settings.js';
import { keystore } from './keystore.js';
import { providerById, normalizeModels } from './providers.js';
import { readSSE } from './sse.js';

export class ApiError extends Error {
  constructor(kind, message, extra = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = extra.status || 0;
    this.detail = extra.detail ? redact(extra.detail) : '';
    this.retryAfter = extra.retryAfter || 0;
  }
}

/** Masque tout ce qui ressemble à une clé dans un texte destiné à l'affichage. */
export function redact(text) {
  return String(text || '')
    .replace(/\b(sk-or-v1|sk-or|sk-proj|sk|gsk|hf|csk|xai|pk|nvapi)[-_][A-Za-z0-9_-]{6,}/g, '$1-••••')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{6,}/gi, 'Bearer ••••')
    .slice(0, 400);
}

const SESSION_KEY = 'nour.session';

export const session = {
  get() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (s && s.token && s.expiresAt > Date.now()) return s;
    } catch { /* ignoré */ }
    return null;
  },
  set(token, expiresAt) { localStorage.setItem(SESSION_KEY, JSON.stringify({ token, expiresAt })); },
  clear() { localStorage.removeItem(SESSION_KEY); },
};

export function connection() {
  const c = settings.get().connection;
  if (c.mode === 'server') {
    const s = session.get();
    return {
      mode: 'server',
      label: 'Serveur sécurisé',
      base: 'api',
      model: c.serverModel || '',
      ready: !!s,
      headers: s ? { Authorization: `Bearer ${s.token}` } : {},
    };
  }
  const provider = providerById(c.provider);
  const base = String(c.baseUrl || provider.baseUrl || '').trim().replace(/\/+$/, '');
  const key = keystore.get(provider.id);
  const headers = {};
  if (key) headers.Authorization = `Bearer ${key}`;
  if (provider.extraHeaders) Object.assign(headers, provider.extraHeaders());
  return {
    mode: 'browser',
    provider,
    label: provider.name,
    base,
    model: c.model || '',
    hasKey: !!key,
    ready: !!base && (!!key || !!provider.keyOptional),
    headers,
  };
}

function parseRetryAfter(header, message) {
  if (header) {
    const n = Number(header);
    if (!Number.isNaN(n)) return Math.ceil(n);
    const d = Date.parse(header);
    if (!Number.isNaN(d)) return Math.max(0, Math.ceil((d - Date.now()) / 1000));
  }
  const m = /try again in\s+(?:(\d+)m)?\s*([\d.]+)\s*s/i.exec(message || '') || /réessayez dans\s+([\d.]+)/i.exec(message || '');
  if (m) {
    if (m.length === 3) return Math.ceil((Number(m[1] || 0) * 60) + Number(m[2] || 0));
    return Math.ceil(Number(m[1]));
  }
  return 0;
}

function kindForStatus(status, mode) {
  if (status === 401 || status === 403) return mode === 'server' ? 'session' : 'auth';
  if (status === 402) return 'payment';
  if (status === 404) return 'notfound';
  if (status === 413) return 'too-large';
  if (status === 429) return 'quota';
  if (status === 400 || status === 422) return 'bad-request';
  if (status >= 500) return 'server';
  return 'http';
}

async function errorFromResponse(res, conn) {
  let text = '';
  try { text = await res.text(); } catch { /* corps illisible */ }
  let message = '';
  let code = '';
  try {
    const j = JSON.parse(text);
    const e = j.error ?? j;
    message = typeof e === 'string' ? e : (e.message || j.message || j.detail || '');
    code = (e && e.code) || j.code || '';
    if (typeof message !== 'string') message = JSON.stringify(message);
  } catch {
    message = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  let kind = kindForStatus(res.status, conn.mode);
  // Le proxy distingue l'absence de session de l'erreur du fournisseur.
  if (conn.mode === 'server' && (res.status === 401 || res.status === 403) && code !== 'session') kind = code === 'upstream_auth' ? 'auth' : 'session';
  if (conn.mode === 'server' && res.status === 404 && code !== 'upstream') kind = 'no-server';
  if (/context|too long|maximum.*tokens|reduce the length/i.test(message) && (res.status === 400 || res.status === 413)) kind = 'context';
  return new ApiError(kind, message || `Erreur ${res.status}`, {
    status: res.status,
    detail: message,
    retryAfter: parseRetryAfter(res.headers.get('retry-after'), message),
  });
}

function checkReady(conn, { needModel = true } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ApiError('offline', 'Hors ligne');
  if (conn.mode === 'server') {
    if (!conn.ready) throw new ApiError('session', 'Session requise');
  } else {
    if (keystore.isLocked()) throw new ApiError('locked', 'Coffre verrouillé');
    if (!conn.base) throw new ApiError('nobase', 'URL manquante');
    if (!conn.hasKey && !conn.provider.keyOptional) throw new ApiError('nokey', 'Clé manquante');
  }
  if (needModel && !conn.model && conn.mode !== 'server') throw new ApiError('nomodel', 'Aucun modèle');
}

async function doFetch(url, init, conn) {
  try {
    return await fetch(url, init);
  } catch (e) {
    if (e && e.name === 'AbortError') throw e;
    throw new ApiError(navigator.onLine === false ? 'offline' : 'network', 'Connexion impossible', { detail: conn.base });
  }
}

export async function listModels() {
  const conn = connection();
  checkReady(conn, { needModel: false });
  const url = conn.mode === 'server' ? 'api/models' : `${conn.base}/models`;
  const res = await doFetch(url, { headers: { ...conn.headers, Accept: 'application/json' } }, conn);
  if (!res.ok) throw await errorFromResponse(res, conn);
  let json;
  try { json = await res.json(); } catch { throw new ApiError('bad-response', 'Réponse illisible'); }
  return normalizeModels(json);
}

/**
 * Envoie une requête de complétion en streaming.
 * onDelta reçoit l'état cumulé { content, reasoning } à chaque morceau.
 */
export async function streamChat({ messages, model, temperature, maxTokens, signal, onDelta }) {
  const conn = connection();
  const useModel = model || conn.model;
  checkReady({ ...conn, model: useModel });
  const body = { model: useModel, messages, stream: true };
  if (typeof temperature === 'number' && !Number.isNaN(temperature)) body.temperature = temperature;
  const max = Number(maxTokens);
  if (max > 0) body.max_tokens = Math.round(max);

  const url = conn.mode === 'server' ? 'api/chat' : `${conn.base}/chat/completions`;
  const res = await doFetch(url, {
    method: 'POST',
    headers: { ...conn.headers, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  }, conn);
  if (!res.ok) throw await errorFromResponse(res, conn);

  const out = { content: '', reasoning: '', finish: null, usage: null, model: null };
  const type = res.headers.get('content-type') || '';
  if (!type.includes('event-stream')) {
    let j;
    try { j = await res.json(); } catch { throw new ApiError('bad-response', 'Réponse illisible'); }
    if (j.error) throw new ApiError('stream', j.error.message || 'Erreur du fournisseur', { detail: j.error.message });
    const msg = (j.choices && j.choices[0] && (j.choices[0].message || j.choices[0].delta)) || {};
    out.content = msg.content || '';
    out.reasoning = msg.reasoning_content || msg.reasoning || '';
    out.usage = j.usage || null;
    out.model = j.model || null;
    out.finish = j.choices?.[0]?.finish_reason || 'stop';
    onDelta?.(out);
    return out;
  }

  await readSSE(res.body, (json) => {
    if (json.error) {
      const e = json.error;
      const status = Number(e.code) || Number(e.status) || 0;
      const kind = status ? kindForStatus(status, 'browser') : 'stream';
      throw new ApiError(kind, e.message || 'Erreur du fournisseur', { status, detail: e.message || '', retryAfter: parseRetryAfter('', e.message) });
    }
    if (json.model) out.model = json.model;
    if (json.usage) out.usage = json.usage;
    const ch = json.choices && json.choices[0];
    if (!ch) return;
    const d = ch.delta || ch.message || {};
    let changed = false;
    if (typeof d.content === 'string' && d.content) { out.content += d.content; changed = true; }
    const r = d.reasoning_content ?? d.reasoning;
    if (typeof r === 'string' && r) { out.reasoning += r; changed = true; }
    if (ch.finish_reason) out.finish = ch.finish_reason;
    if (changed) onDelta?.(out);
  }, { signal });

  if (signal && signal.aborted) throw new DOMException('Génération interrompue', 'AbortError');
  return out;
}

/** Connexion au proxy serveur (mot de passe → jeton signé). */
export async function serverLogin(password) {
  let res;
  try {
    res = await fetch('api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  } catch {
    throw new ApiError('network', 'Serveur injoignable');
  }
  if (res.status === 404) throw new ApiError('no-server', 'Fonction absente');
  if (res.status === 401) throw new ApiError('bad-password', 'Mot de passe incorrect');
  if (res.status === 429) throw new ApiError('quota', 'Trop de tentatives', { retryAfter: parseRetryAfter(res.headers.get('retry-after'), '') });
  if (!res.ok) throw new ApiError('server', `Erreur ${res.status}`, { status: res.status });
  const j = await res.json();
  session.set(j.token, j.expiresAt);
  return j;
}
