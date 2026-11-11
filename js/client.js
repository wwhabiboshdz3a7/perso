// Client des API compatibles OpenAI : mode « navigateur » (clé locale) ou « serveur » (fonction Netlify).

import { settings } from './settings.js';
import { keystore } from './keystore.js';
import { PROVIDERS, providerById, normalizeModels } from './providers.js';
import { readSSE } from './sse.js';

export class ApiError extends Error {
  constructor(kind, message, extra = {}) {
    super(redact(message, extra.secrets));
    this.name = 'ApiError';
    this.kind = kind;
    this.status = extra.status || 0;
    this.detail = extra.detail ? redact(extra.detail, extra.secrets) : '';
    this.retryAfter = extra.retryAfter || 0;
  }
}

/** Toutes les clés connues de ce navigateur (coffre ouvert), pour les masquer dans les textes. */
export function knownSecrets() {
  const out = [];
  try {
    for (const p of PROVIDERS) { const k = keystore.get(p.id); if (k) out.push(k); }
    const s = session.get();
    if (s) out.push(s.token);
  } catch { /* coffre indisponible */ }
  return out;
}

/**
 * Masque tout ce qui ressemble à une clé dans un texte destiné à l'affichage ou à l'export :
 * les valeurs exactes connues (`secrets`), puis les formats de clés usuels.
 */
export function redact(text, secrets = []) {
  let s = String(text || '');
  for (const k of secrets || []) {
    const v = String(k || '').trim();
    if (v.length >= 6) s = s.split(v).join('••••');
  }
  return s
    .replace(/\b(sk-or-v1|sk-or|sk-proj|sk-ant|sk|gsk|hf|csk|xai|pk|nvapi|tgp_v1|fw)[-_][A-Za-z0-9_-]{6,}/g, '$1-••••')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{6,}/gi, 'Bearer ••••')
    .slice(0, 400);
}

/* ---------- Événements et état de la connexion ---------- */
export const clientEvents = new EventTarget();

// Dernier refus de clé, mémorisé par connexion : la pastille de statut passe à « Clé refusée »
// jusqu'au prochain appel réussi.
const AUTH_FAIL = 'nour.authFail';
export function connectionSignature(conn = connection()) {
  return conn.mode === 'server' ? 'server' : `${conn.provider.id}|${conn.base}`;
}
export const authState = {
  failed(conn = connection()) {
    try { return localStorage.getItem(AUTH_FAIL) === connectionSignature(conn); } catch { return false; }
  },
  fail(conn) {
    try { localStorage.setItem(AUTH_FAIL, connectionSignature(conn)); } catch { /* ignoré */ }
    clientEvents.dispatchEvent(new Event('status'));
  },
  ok(conn) {
    let had = false;
    try { had = localStorage.getItem(AUTH_FAIL) !== null; localStorage.removeItem(AUTH_FAIL); } catch { /* ignoré */ }
    if (had) clientEvents.dispatchEvent(new Event('status'));
    void conn;
  },
};

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
      secrets: s ? [s.token] : [],
    };
  }
  return browserConnection({ providerId: c.provider, baseUrl: c.baseUrl, model: c.model || '', key: keystore.get(providerById(c.provider).id) });
}

/**
 * Connexion « navigateur » construite à partir de valeurs données : sert aussi à tester
 * un fournisseur dans l'assistant de connexion avant d'enregistrer quoi que ce soit.
 */
export function browserConnection({ providerId, baseUrl = '', model = '', key = '' }) {
  const provider = providerById(providerId);
  const base = String(baseUrl || provider.baseUrl || '').trim().replace(/\/+$/, '');
  const headers = {};
  if (key) headers.Authorization = `Bearer ${key}`;
  if (provider.extraHeaders) Object.assign(headers, provider.extraHeaders());
  return {
    mode: 'browser',
    provider,
    label: provider.name,
    base,
    model,
    hasKey: !!key,
    ready: !!base && (!!key || !!provider.keyOptional),
    headers,
    secrets: key ? [key] : [],
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
  if (conn.mode === 'server' && (res.status === 401 || res.status === 403)) kind = code === 'upstream_auth' ? 'auth' : 'session';
  if (conn.mode === 'server' && res.status === 404 && code !== 'upstream') kind = 'no-server';
  if (conn.mode === 'server' && code === 'config') kind = 'config';
  if (/context|too long|maximum.*tokens|reduce the length/i.test(message) && (res.status === 400 || res.status === 413)) kind = 'context';
  if (kind === 'session') {
    // Jeton refusé (expiré, secret ou mot de passe changés) : on l'oublie pour proposer la connexion.
    session.clear();
    clientEvents.dispatchEvent(new Event('status'));
  }
  if (kind === 'auth' && !conn.candidate) authState.fail(conn);
  return new ApiError(kind, message || `Erreur ${res.status}`, {
    status: res.status,
    detail: message,
    retryAfter: parseRetryAfter(res.headers.get('retry-after'), message),
    secrets: conn.secrets,
  });
}

function checkReady(conn, { needModel = true } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ApiError('offline', 'Hors ligne');
  if (conn.mode === 'server') {
    if (!conn.ready) throw new ApiError('session', 'Session requise');
  } else {
    if (keystore.isLocked() && !conn.candidate) throw new ApiError('locked', 'Coffre verrouillé');
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

export async function listModels(conn = connection(), { signal } = {}) {
  checkReady(conn, { needModel: false });
  const url = conn.mode === 'server' ? 'api/models' : `${conn.base}/models`;
  const res = await doFetch(url, { headers: { ...conn.headers, Accept: 'application/json' }, signal }, conn);
  if (!res.ok) throw await errorFromResponse(res, conn);
  let json;
  try { json = await res.json(); } catch { throw new ApiError('bad-response', 'Réponse illisible'); }
  authState.ok(conn);
  return normalizeModels(json);
}

/** Délai d'inactivité : sans aucun octet reçu pendant ce temps, la requête est abandonnée. */
function idleTimeouts(conn) {
  let sec = Number(settings.get().prefs.idleTimeout);
  if (!Number.isFinite(sec) || sec <= 0) sec = 60;
  const idle = Math.min(Math.max(sec, 5), 900) * 1000;
  // Un modèle local peut mettre du temps à se charger en mémoire avant le premier mot.
  const first = conn.mode === 'browser' && conn.provider.local ? Math.max(idle, 180000) : idle;
  return { idle, first };
}

/**
 * Envoie une requête de complétion en streaming.
 * onDelta reçoit l'état cumulé { content, reasoning } à chaque morceau.
 * Le résultat indique `complete` : faux si le flux s'est fermé sans « [DONE] » ni finish_reason.
 */
export async function streamChat({ messages, model, temperature, maxTokens, signal, onDelta, conn: given = null }) {
  // `given` : connexion candidate de l'assistant de connexion (essai avant enregistrement).
  const conn = given || connection();
  const useModel = model || conn.model;
  checkReady({ ...conn, model: useModel });
  const body = { model: useModel, messages, stream: true };
  if (typeof temperature === 'number' && !Number.isNaN(temperature)) body.temperature = temperature;
  const max = Number(maxTokens);
  if (max > 0) body.max_tokens = Math.round(max);

  // Délai d'inactivité combiné à l'arrêt demandé par l'utilisateur.
  const { idle, first } = idleTimeouts(conn);
  const ctl = new AbortController();
  let timedOut = 0;
  let timer = 0;
  const arm = (ms) => { clearTimeout(timer); timer = setTimeout(() => { timedOut = ms; ctl.abort(); }, ms); };
  const onAbort = () => ctl.abort();
  if (signal) { if (signal.aborted) ctl.abort(); else signal.addEventListener('abort', onAbort, { once: true }); }
  const timeoutError = () => new ApiError('timeout', 'Délai dépassé', { detail: `Aucune donnée reçue pendant ${Math.round(timedOut / 1000)} s.` });

  const url = conn.mode === 'server' ? 'api/chat' : `${conn.base}/chat/completions`;
  const out = { content: '', reasoning: '', finish: null, usage: null, model: null, complete: false };
  arm(first);
  try {
    let res;
    try {
      res = await doFetch(url, {
        method: 'POST',
        headers: { ...conn.headers, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(body),
        signal: ctl.signal,
      }, conn);
    } catch (e) {
      if (timedOut) throw timeoutError();
      throw e;
    }
    if (!res.ok) throw await errorFromResponse(res, conn);
    arm(idle);

    const type = res.headers.get('content-type') || '';
    if (!type.includes('event-stream')) {
      let j;
      try { j = await res.json(); } catch { if (timedOut) throw timeoutError(); throw new ApiError('bad-response', 'Réponse illisible'); }
      if (j.error) throw new ApiError('stream', j.error.message || 'Erreur du fournisseur', { detail: j.error.message, secrets: conn.secrets });
      const msg = (j.choices && j.choices[0] && (j.choices[0].message || j.choices[0].delta)) || {};
      out.content = msg.content || '';
      out.reasoning = msg.reasoning_content || msg.reasoning || '';
      out.usage = j.usage || null;
      out.model = j.model || null;
      out.finish = j.choices?.[0]?.finish_reason || 'stop';
      out.complete = true;
      authState.ok(conn);
      onDelta?.(out);
      return out;
    }

    let sse;
    try {
      sse = await readSSE(res.body, (json) => {
        if (json.error) {
          const e = json.error;
          const status = Number(e.code) || Number(e.status) || 0;
          const kind = status ? kindForStatus(status, 'browser') : 'stream';
          throw new ApiError(kind, e.message || 'Erreur du fournisseur', { status, detail: e.message || '', retryAfter: parseRetryAfter('', e.message), secrets: conn.secrets });
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
      }, { signal: ctl.signal, onChunk: () => arm(idle) });
    } catch (e) {
      if (timedOut) throw timeoutError();
      throw e;
    }
    if (timedOut) throw timeoutError();
    if (signal && signal.aborted) throw new DOMException('Génération interrompue', 'AbortError');
    out.complete = !!(sse && sse.done) || !!out.finish;
    if (!out.finish && out.complete) out.finish = 'stop';
    authState.ok(conn);
    return out;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
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
  if (res.status === 429) throw new ApiError('login-limit', 'Trop de tentatives', { status: 429, retryAfter: parseRetryAfter(res.headers.get('retry-after'), '') });
  if (!res.ok) {
    let err = {};
    try { err = (await res.json()).error || {}; } catch { /* corps illisible */ }
    if (err.code === 'config') throw new ApiError('config', 'Fonction non configurée', { status: res.status, detail: err.message || '' });
    throw new ApiError('server', `Erreur ${res.status}`, { status: res.status, detail: err.message || '' });
  }
  let j;
  try { j = await res.json(); } catch { throw new ApiError('bad-response', 'Réponse illisible'); }
  if (!j || !j.token) throw new ApiError('bad-response', 'Réponse illisible');
  session.set(j.token, j.expiresAt);
  clientEvents.dispatchEvent(new Event('status'));
  return j;
}

/* ---------- Assistant de connexion : sondes ---------- */

/**
 * La fonction serveur est-elle déployée sur ce site, et complète ?
 * → { state: 'ready' | 'incomplete' | 'absent' | 'unknown', missing: [] }
 * Sans fonction, le fichier statique api/status répond { function: false } (pas d'erreur 404).
 */
export async function probeServer({ timeout = 6000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch('api/status', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: ctl.signal });
    if (!res.ok) return { state: 'absent', missing: [] };
    let j = null;
    try { j = JSON.parse(await res.text()); } catch { return { state: 'absent', missing: [] }; }
    if (!j || j.service !== 'nour' || !j.function) return { state: 'absent', missing: [] };
    const missing = Array.isArray(j.missing) ? j.missing.map((x) => String(x).replace(/[^A-Z_]/g, '')).filter(Boolean).slice(0, 8) : [];
    return j.configured ? { state: 'ready', missing: [], hasDefault: j.hasDefaultModel !== false } : { state: 'incomplete', missing };
  } catch {
    return { state: 'unknown', missing: [] };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Après un échec réseau : le serveur répond-il quand on ne lit pas la réponse (mode no-cors) ?
 * Oui → il refuse les appels depuis un navigateur (CORS) ; non → réseau, adresse ou blocage.
 */
export async function probeReachable(base, { timeout = 6000 } = {}) {
  if (!base) return false;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    await fetch(`${String(base).replace(/\/+$/, '')}/models`, { mode: 'no-cors', cache: 'no-store', credentials: 'omit', signal: ctl.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}
