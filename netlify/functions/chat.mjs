// Fonction Netlify (Functions v2) : proxy sécurisé vers un fournisseur compatible OpenAI.
// La clé API reste côté serveur ; l'accès est protégé par mot de passe (jeton signé HMAC)
// et limité en débit.
//
// Variables d'environnement :
//   PROVIDER_BASE_URL      ex. https://api.groq.com/openai/v1
//   PROVIDER_API_KEY       clé du fournisseur (facultative pour un serveur local)
//   ACCESS_PASSWORD_HASH   empreinte du mot de passe (node scripts/hash-password.mjs)
//   TOKEN_SECRET           secret aléatoire d'au moins 32 caractères
// Facultatives :
//   PROVIDER_DEFAULT_MODEL modèle utilisé si l'interface n'en précise pas
//   ALLOWED_MODELS         liste de modèles autorisés, séparés par des virgules
//   RATE_LIMIT_PER_MINUTE  requêtes par minute et par adresse IP (défaut 30)
//   TOKEN_TTL_HOURS        durée de validité d'une session (défaut 12)
//
// /api/status (public, sans secret) indique seulement si la fonction est déployée et complète :
// l'interface s'en sert pour proposer directement « Se connecter avec le mot de passe ».
//
// Révocation : les jetons sont signés avec une clé dérivée de TOKEN_SECRET ET de l'empreinte du
// mot de passe. Changer le mot de passe (ACCESS_PASSWORD_HASH) ou TOKEN_SECRET déconnecte donc
// immédiatement tous les appareils.

import { createHmac, timingSafeEqual, pbkdf2Sync, randomBytes } from 'node:crypto';

export const config = {
  path: ['/api/chat', '/api/models', '/api/login', '/api/session', '/api/status'],
};

const MAX_BODY = 6 * 1024 * 1024;
const LOGIN_LIMIT = 8; // tentatives par fenêtre de 10 minutes
const ALLOWED_FIELDS = ['model', 'messages', 'temperature', 'top_p', 'max_tokens', 'max_completion_tokens', 'stop', 'presence_penalty', 'frequency_penalty', 'seed', 'stream', 'stream_options', 'response_format'];

function env(name, fallback = '') {
  const fromNetlify = globalThis.Netlify && globalThis.Netlify.env && typeof globalThis.Netlify.env.get === 'function'
    ? globalThis.Netlify.env.get(name)
    : undefined;
  const v = fromNetlify ?? process.env[name];
  if (v === undefined || v === null) return fallback;
  // Valeur collée avec ses guillemets (import d'un bloc .env) : on les retire.
  const s = String(v).trim().replace(/^(['"])([\s\S]*)\1$/, '$2');
  return s === '' ? fallback : s;
}

/* ---------- Réponses ---------- */
const BASE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...BASE_HEADERS, ...headers },
  });
}

function fail(status, message, code, headers = {}) {
  return json(status, { error: { message, code } }, headers);
}

/** Retire de tout texte ce qui ressemble à une clé (y compris la clé configurée). */
export function redact(text) {
  let s = String(text || '');
  const key = env('PROVIDER_API_KEY');
  if (key && key.length >= 6) s = s.split(key).join('••••');
  return s
    .replace(/\b(sk-or-v1|sk-or|sk-proj|sk|gsk|hf|csk|xai|nvapi)[-_][A-Za-z0-9_-]{6,}/g, '$1-••••')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{6,}/gi, 'Bearer ••••')
    .slice(0, 500);
}

/* ---------- Limitation de débit (mémoire de l'instance) ---------- */
const buckets = new Map();

export function rateLimit(key, limit, windowMs, now = Date.now()) {
  let b = buckets.get(key);
  if (!b || b.reset <= now) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
  }
  if (b.count > limit) return { ok: false, retryAfter: Math.max(1, Math.ceil((b.reset - now) / 1000)) };
  return { ok: true, remaining: limit - b.count };
}

export function resetRateLimits() { buckets.clear(); }

/* ---------- Mot de passe ---------- */
// Format : pbkdf2-sha256$<itérations>$<sel base64>$<empreinte base64>
export function hashPassword(password, iterations = 210000) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(String(password), salt, iterations, 32, 'sha256');
  return `pbkdf2-sha256$${iterations}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const parts = String(stored || '').trim().split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 10000 || iterations > 5000000) return false;
  const salt = Buffer.from(parts[2], 'base64');
  const expected = Buffer.from(parts[3], 'base64');
  if (!expected.length) return false;
  const actual = pbkdf2Sync(String(password || ''), salt, iterations, expected.length, 'sha256');
  return timingSafeEqual(actual, expected);
}

/* ---------- Jetons signés ---------- */
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const fromB64url = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/** Clé de signature : liée au secret et, si fourni, à l'empreinte du mot de passe (révocation). */
function signingKey(secret, binding) {
  return binding ? createHmac('sha256', secret).update(`nour-session\n${binding}`).digest() : secret;
}

export function signToken(secret, ttlMs, now = Date.now(), binding = '') {
  const payload = { v: 1, iat: now, exp: now + ttlMs, n: b64url(randomBytes(9)) };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac('sha256', signingKey(secret, binding)).update(body).digest());
  return { token: `${body}.${sig}`, expiresAt: payload.exp };
}

export function verifyToken(secret, token, now = Date.now(), binding = '') {
  if (!token || typeof token !== 'string' || token.length > 512) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', signingKey(secret, binding)).update(body).digest();
  const given = fromB64url(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString('utf8'));
    if (!payload || typeof payload.exp !== 'number' || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ---------- Utilitaires ---------- */
function clientIp(req, context) {
  return (context && context.ip)
    || req.headers.get('x-nf-client-connection-ip')
    || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || 'inconnue';
}

/** Variables manquantes ou invalides (noms seuls, jamais de valeur). */
export function missingVariables() {
  const missing = [];
  if (!env('PROVIDER_BASE_URL')) missing.push('PROVIDER_BASE_URL');
  if (!/^pbkdf2-sha256\$\d+\$[^$]+\$[^$]+$/.test(env('ACCESS_PASSWORD_HASH'))) missing.push('ACCESS_PASSWORD_HASH');
  if (env('TOKEN_SECRET').length < 32) missing.push('TOKEN_SECRET');
  return missing;
}

function missingConfig() {
  return missingVariables().map((n) => (n === 'TOKEN_SECRET' ? 'TOKEN_SECRET (32 caractères minimum)' : n));
}

function upstreamUrl(path) {
  return `${env('PROVIDER_BASE_URL').replace(/\/+$/, '')}${path}`;
}

function upstreamHeaders(extra = {}) {
  const h = { ...extra };
  const key = env('PROVIDER_API_KEY');
  if (key) h.Authorization = `Bearer ${key}`;
  return h;
}

async function relayError(res) {
  let message = '';
  try {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      const e = j.error ?? j;
      message = typeof e === 'string' ? e : (e.message || j.message || j.detail || '');
    } catch {
      message = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  } catch { /* corps illisible */ }
  const headers = {};
  const ra = res.headers.get('retry-after');
  if (ra) headers['Retry-After'] = ra;
  const status = res.status;
  if (status === 401 || status === 403) return fail(status, redact(message) || 'Clé refusée par le fournisseur', 'upstream_auth', headers);
  if (status >= 500) return fail(502, redact(message) || `Erreur ${status} du fournisseur`, 'upstream', headers);
  return fail(status, redact(message) || `Erreur ${status} du fournisseur`, 'upstream', headers);
}

function cleanBody(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Corps de requête invalide.' };
  const out = {};
  for (const k of ALLOWED_FIELDS) if (input[k] !== undefined) out[k] = input[k];
  if (!Array.isArray(out.messages) || !out.messages.length || out.messages.length > 300) return { error: 'Liste de messages invalide.' };
  for (const m of out.messages) {
    if (!m || typeof m !== 'object' || !['system', 'user', 'assistant'].includes(m.role)) return { error: 'Message invalide.' };
    if (typeof m.content !== 'string' && !Array.isArray(m.content)) return { error: 'Contenu de message invalide.' };
  }
  if (!out.model) out.model = env('PROVIDER_DEFAULT_MODEL');
  if (!out.model) return { error: 'Aucun modèle indiqué (définissez PROVIDER_DEFAULT_MODEL ou choisissez un modèle).' };
  const allowed = env('ALLOWED_MODELS').split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.length && !allowed.includes(out.model)) return { error: `Modèle non autorisé sur ce serveur : ${String(out.model).slice(0, 80)}` };
  if (out.stream === undefined) out.stream = true;
  return { body: out };
}

/* ---------- Point d'entrée ---------- */
export default async function handler(req, context) {
  const url = new URL(req.url);
  const route = url.pathname.replace(/\/+$/, '').split('/').pop();
  const ip = clientIp(req, context);

  // État public : la fonction est-elle là et complète ? (aucun secret, aucune valeur)
  if (route === 'status') {
    if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405, 'Méthode non autorisée.', 'method', { Allow: 'GET' });
    const vars = missingVariables();
    return json(200, { service: 'nour', function: true, configured: !vars.length, missing: vars, hasDefaultModel: !!env('PROVIDER_DEFAULT_MODEL') });
  }

  const missing = missingConfig();
  if (missing.length) return fail(500, `Fonction non configurée : variable(s) manquante(s) ${missing.join(', ')}.`, 'config');
  const secret = env('TOKEN_SECRET');

  if (route === 'login') {
    if (req.method !== 'POST') return fail(405, 'Méthode non autorisée.', 'method', { Allow: 'POST' });
    const rl = rateLimit(`login:${ip}`, LOGIN_LIMIT, 10 * 60 * 1000);
    if (!rl.ok) return fail(429, 'Trop de tentatives. Réessayez plus tard.', 'rate_limit', { 'Retry-After': String(rl.retryAfter) });
    let data;
    try { data = await req.json(); } catch { return fail(400, 'Requête invalide.', 'bad_request'); }
    if (!verifyPassword(data && data.password, env('ACCESS_PASSWORD_HASH'))) {
      return fail(401, 'Mot de passe incorrect.', 'bad_password');
    }
    const ttl = Math.min(Math.max(Number(env('TOKEN_TTL_HOURS', '12')) || 12, 0.1), 24 * 30) * 3600 * 1000;
    const { token, expiresAt } = signToken(secret, ttl, Date.now(), env('ACCESS_PASSWORD_HASH'));
    return json(200, { token, expiresAt });
  }

  const auth = req.headers.get('authorization') || '';
  // Le nom du schéma d'authentification est insensible à la casse (RFC 9110).
  const m = /^bearer\s+(.+)$/i.exec(auth.trim());
  const token = m ? m[1].trim() : '';
  const session = verifyToken(secret, token, Date.now(), env('ACCESS_PASSWORD_HASH'));
  if (!session) return fail(401, 'Session absente ou expirée : reconnectez-vous.', 'session');

  const perMinute = Math.max(1, Number(env('RATE_LIMIT_PER_MINUTE', '30')) || 30);
  const rl = rateLimit(`api:${ip}`, perMinute, 60 * 1000);
  if (!rl.ok) return fail(429, 'Limite de requêtes atteinte sur ce serveur.', 'rate_limit', { 'Retry-After': String(rl.retryAfter) });

  if (route === 'session') return json(200, { ok: true, expiresAt: session.exp });

  if (route === 'models') {
    if (req.method !== 'GET') return fail(405, 'Méthode non autorisée.', 'method', { Allow: 'GET' });
    let res;
    try {
      res = await fetch(upstreamUrl('/models'), { headers: upstreamHeaders({ Accept: 'application/json' }) });
    } catch {
      return fail(502, 'Fournisseur injoignable depuis le serveur.', 'upstream');
    }
    if (!res.ok) return relayError(res);
    const text = await res.text();
    return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...BASE_HEADERS } });
  }

  if (route === 'chat') {
    if (req.method !== 'POST') return fail(405, 'Méthode non autorisée.', 'method', { Allow: 'POST' });
    const len = Number(req.headers.get('content-length') || 0);
    if (len > MAX_BODY) return fail(413, 'Requête trop volumineuse.', 'too_large');
    let raw;
    try { raw = await req.text(); } catch { return fail(400, 'Requête illisible.', 'bad_request'); }
    if (raw.length > MAX_BODY) return fail(413, 'Requête trop volumineuse.', 'too_large');
    let input;
    try { input = JSON.parse(raw); } catch { return fail(400, 'JSON invalide.', 'bad_request'); }
    const { body, error } = cleanBody(input);
    if (error) return fail(400, error, 'bad_request');

    let res;
    try {
      res = await fetch(upstreamUrl('/chat/completions'), {
        method: 'POST',
        headers: upstreamHeaders({ 'Content-Type': 'application/json', Accept: body.stream ? 'text/event-stream' : 'application/json' }),
        body: JSON.stringify(body),
        signal: req.signal,
      });
    } catch {
      return fail(502, 'Fournisseur injoignable depuis le serveur.', 'upstream');
    }
    if (!res.ok) return relayError(res);
    const type = res.headers.get('content-type') || (body.stream ? 'text/event-stream' : 'application/json');
    return new Response(res.body, {
      status: 200,
      headers: { 'Content-Type': type, ...BASE_HEADERS, 'X-Accel-Buffering': 'no' },
    });
  }

  return fail(404, 'Route inconnue.', 'not_found');
}
