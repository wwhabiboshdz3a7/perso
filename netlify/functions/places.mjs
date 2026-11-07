// Fonction Netlify « places » : passerelle vers Google Places API (New).
//
// - La clé GOOGLE_PLACES_API_KEY reste côté serveur, jamais envoyée au navigateur.
// - Accès protégé par mot de passe : empreinte PBKDF2 (ACCESS_PASSWORD_HASH) et jeton
//   signé HMAC-SHA256 (TOKEN_SECRET) à durée limitée.
// - Limitation de débit par adresse IP et plafond quotidien de requêtes Google
//   (MAX_REQUESTS_PER_DAY, compteur partagé via Netlify Blobs quand il est disponible).
//   La limite par minute (RATE_LIMIT_PER_MINUTE, 90 par défaut) est communiquée au client,
//   qui la respecte de lui-même.
//
// Actions (POST JSON sur /api/places) :
//   status  → configuration présente ou non (aucun secret renvoyé)
//   login   → { password } → { token, exp }
//   search  → Text Search paginé sur une cellule rectangulaire pour une catégorie
//   match   → retrouve sur Google un établissement venu d'OpenStreetMap (nom + position)
//   details → actualise un lieu par son identifiant Google

import { createHash, createHmac, pbkdf2, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { classifyWebsite } from '../../js/lib/website.js';
import { validBbox, bboxSizeKm, haversineKm, MAX_PAGES, MAX_RESULTS_PER_QUERY } from '../../js/lib/geo.js';
import { nameSimilarity } from '../../js/lib/format.js';

const pbkdf2Async = promisify(pbkdf2);

export const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
export const DETAILS_URL = 'https://places.googleapis.com/v1/places/';
export const PLACE_FIELDS = [
  'id', 'displayName', 'formattedAddress', 'location', 'nationalPhoneNumber', 'internationalPhoneNumber',
  'websiteUri', 'rating', 'userRatingCount', 'googleMapsUri', 'primaryType', 'primaryTypeDisplayName', 'businessStatus',
];
export const SEARCH_FIELD_MASK = [...PLACE_FIELDS.map((f) => `places.${f}`), 'nextPageToken'].join(',');
export const DETAILS_FIELD_MASK = PLACE_FIELDS.join(',');

const MAX_BODY = 8000;
const MAX_CELL_KM = 60;
const MAX_ITERATIONS = 2_000_000;

// ---------------------------------------------------------------------------
// Réponses
// ---------------------------------------------------------------------------

function json(status, data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

function fail(status, error, message, extra = {}, headers = {}) {
  return json(status, { error, message, ...extra }, headers);
}

// ---------------------------------------------------------------------------
// Mot de passe et jetons
// ---------------------------------------------------------------------------

/** Format : pbkdf2_sha256$<itérations>$<sel base64url>$<empreinte base64url> */
export function parsePasswordHash(s) {
  const m = /^pbkdf2_sha256\$(\d{4,7})\$([A-Za-z0-9_-]{16,})\$([A-Za-z0-9_-]{32,})$/.exec(String(s || '').trim());
  if (!m) return null;
  const iterations = Number(m[1]);
  if (iterations < 10_000 || iterations > MAX_ITERATIONS) return null;
  return { iterations, salt: Buffer.from(m[2], 'base64url'), hash: Buffer.from(m[3], 'base64url') };
}

export async function verifyPassword(password, stored) {
  const h = parsePasswordHash(stored);
  if (!h || typeof password !== 'string' || !password || password.length > 512) return false;
  const derived = await pbkdf2Async(password.normalize('NFC'), h.salt, h.iterations, h.hash.length, 'sha256');
  return derived.length === h.hash.length && timingSafeEqual(derived, h.hash);
}

/** Empreinte courte du mot de passe configuré : changer le mot de passe invalide les jetons existants. */
export function passwordFingerprint(stored) {
  return createHash('sha256').update(String(stored || '').trim()).digest('base64url').slice(0, 12);
}

export function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token, secret, { now, fingerprint }) {
  if (typeof token !== 'string' || token.length > 600 || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = createHmac('sha256', secret).update(parts[0]).digest();
  const got = Buffer.from(parts[1], 'base64url');
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  let p;
  try { p = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); } catch { return null; }
  if (!p || p.v !== 1 || !Number.isFinite(p.exp) || p.exp <= now || p.fp !== fingerprint) return null;
  return p;
}

// ---------------------------------------------------------------------------
// Limitation de débit (mémoire de l'instance) et plafond quotidien
// ---------------------------------------------------------------------------

const buckets = new Map();

export function rateLimit(key, limit, windowMs, now) {
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - arr[0])) / 1000)) };
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k);
  }
  return { ok: true };
}

export function resetRateLimits() {
  buckets.clear();
  memoryDaily.clear();
}

const memoryDaily = new Map();

async function defaultQuotaStore() {
  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore({ name: 'prospecteur-quota', consistency: 'strong' });
  } catch {
    return null;
  }
}

function dayKey(now) {
  return `jour-${new Date(now).toISOString().slice(0, 10)}`;
}

async function readDaily(store, key) {
  if (store) {
    try {
      const v = await store.get(key, { type: 'json' });
      return Number(v?.count) || 0;
    } catch { /* repli mémoire */ }
  }
  return memoryDaily.get(key) || 0;
}

async function addDaily(store, key, n) {
  const next = (await readDaily(store, key)) + n;
  memoryDaily.set(key, next);
  if (store) {
    try { await store.setJSON(key, { count: next }); } catch { /* repli mémoire */ }
  }
  return next;
}

// ---------------------------------------------------------------------------
// Google Places
// ---------------------------------------------------------------------------

export class GoogleError extends Error {
  constructor(httpStatus, message, status) {
    super(message || `Erreur Google ${httpStatus}`);
    this.httpStatus = httpStatus;
    this.googleStatus = status || '';
  }
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

export function normalizePlace(p) {
  const website = classifyWebsite(p.websiteUri);
  return {
    id: String(p.id || ''),
    source: 'google',
    name: p.displayName?.text || '',
    address: p.formattedAddress || '',
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    phone: p.nationalPhoneNumber || '',
    phoneIntl: p.internationalPhoneNumber || '',
    websiteUri: p.websiteUri || '',
    website,
    rating: Number.isFinite(p.rating) ? p.rating : null,
    reviews: Number.isFinite(p.userRatingCount) ? p.userRatingCount : 0,
    mapsUrl: p.googleMapsUri || (p.id ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(p.id)}` : ''),
    type: p.primaryType || '',
    typeLabel: p.primaryTypeDisplayName?.text || '',
    businessStatus: p.businessStatus || '',
  };
}

/** Écarte les établissements fermés (définitivement ou temporairement). */
export function isActive(p) {
  return !p.businessStatus || p.businessStatus === 'OPERATIONAL';
}

/**
 * Text Search paginé (20 résultats par page, 3 pages au plus = 60 résultats).
 * Si Google refuse le type demandé, la recherche est relancée une fois sur le texte seul.
 */
export async function textSearch({ key, request, maxPages = MAX_PAGES, fetchImpl }) {
  let req = { ...request };
  let pageToken;
  let pages = 0;
  let calls = 0;
  let typeDropped = false;
  const raw = [];
  while (pages < maxPages) {
    const payload = pageToken ? { ...req, pageToken } : req;
    const res = await fetchImpl(SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': SEARCH_FIELD_MASK },
      body: JSON.stringify(payload),
    });
    calls++;
    if (!res.ok) {
      const err = await safeJson(res);
      const msg = err?.error?.message || '';
      if (res.status === 400 && pages === 0 && req.includedType && !typeDropped && /type/i.test(msg)) {
        const { includedType, strictTypeFiltering, ...rest } = req;
        req = rest;
        typeDropped = true;
        continue;
      }
      // Échec sur une page suivante : on garde les pages déjà obtenues (et facturées).
      if (pages > 0) break;
      throw new GoogleError(res.status, msg, err?.error?.status);
    }
    const data = (await safeJson(res)) || {};
    pages++;
    if (Array.isArray(data.places)) raw.push(...data.places);
    pageToken = data.nextPageToken || undefined;
    if (!pageToken) break;
  }
  return {
    raw,
    pages,
    calls,
    typeDropped,
    hasMore: Boolean(pageToken),
    saturated: Boolean(pageToken) || raw.length >= MAX_RESULTS_PER_QUERY,
  };
}

function googleMessage(e) {
  switch (e.httpStatus) {
    case 400: return `Requête refusée par Google : ${e.message}`;
    case 401:
    case 403: return 'Clé Google refusée : vérifiez que « Places API (New) » est activée sur le projet, que la facturation est active et que les restrictions de la clé autorisent cette API.';
    case 429: return 'Quota Google atteint (limite par minute ou par jour du projet). Réessayez plus tard ou relevez le quota dans la console Google Cloud.';
    default: return `Google ne répond pas correctement (${e.httpStatus}). Réessayez dans un instant.`;
  }
}

// ---------------------------------------------------------------------------
// Validation des entrées
// ---------------------------------------------------------------------------

function readCell(c) {
  if (!c || typeof c !== 'object') return null;
  const cell = { south: Number(c.south), west: Number(c.west), north: Number(c.north), east: Number(c.east) };
  if (!validBbox(cell)) return null;
  const { w, h } = bboxSizeKm(cell);
  if (w > MAX_CELL_KM || h > MAX_CELL_KM) return null;
  return cell;
}

function readCategory(c) {
  if (!c || typeof c !== 'object') return null;
  const query = typeof c.query === 'string' ? c.query.trim() : '';
  const type = typeof c.type === 'string' ? c.type.trim() : '';
  if (query.length < 2 || query.length > 80) return null;
  if (type && !/^[a-z_]{2,40}$/.test(type)) return null;
  return { query, type };
}

// ---------------------------------------------------------------------------
// Gestionnaire
// ---------------------------------------------------------------------------

export function configState(env) {
  const missing = [];
  if (!env.GOOGLE_PLACES_API_KEY) missing.push('GOOGLE_PLACES_API_KEY');
  if (!parsePasswordHash(env.ACCESS_PASSWORD_HASH)) missing.push('ACCESS_PASSWORD_HASH');
  if (!env.TOKEN_SECRET || String(env.TOKEN_SECRET).length < 32) missing.push('TOKEN_SECRET');
  return { ready: missing.length === 0, missing };
}

function clientIp(req, ctx) {
  return ctx.ip
    || req.headers.get('x-nf-client-connection-ip')
    || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || 'inconnue';
}

/**
 * @param {Request} req
 * @param {{env?:object, fetch?:Function, now?:()=>number, ip?:string, quotaStore?:object|null}} ctx
 */
export async function handle(req, ctx = {}) {
  const env = ctx.env || process.env;
  const fetchImpl = ctx.fetch || globalThis.fetch;
  const now = ctx.now ? ctx.now() : Date.now();
  const ip = clientIp(req, ctx);
  const config = configState(env);
  const dailyLimit = Math.max(1, Number(env.MAX_REQUESTS_PER_DAY) || 400);
  const perMinute = Math.min(600, Math.max(10, Number(env.RATE_LIMIT_PER_MINUTE) || 90));

  if (req.method === 'GET') {
    return json(200, { ok: true, ready: config.ready, missing: config.missing, dailyLimit, perMinute });
  }
  if (req.method !== 'POST') return fail(405, 'method', 'Méthode non autorisée.', {}, { Allow: 'GET, POST' });

  const text = await req.text();
  if (text.length > MAX_BODY) return fail(413, 'body', 'Requête trop volumineuse.');
  let body;
  try { body = JSON.parse(text || '{}'); } catch { return fail(400, 'body', 'JSON invalide.'); }
  const action = body?.action;

  if (action === 'status') {
    return json(200, { ok: true, ready: config.ready, missing: config.missing, dailyLimit, perMinute });
  }

  if (action === 'login') {
    const rl = rateLimit(`login:${ip}`, 8, 15 * 60_000, now);
    if (!rl.ok) return fail(429, 'rate', `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfter / 60)} min.`, {}, { 'Retry-After': String(rl.retryAfter) });
    if (config.missing.includes('ACCESS_PASSWORD_HASH') || config.missing.includes('TOKEN_SECRET')) {
      return fail(503, 'config', 'Accès non configuré : définissez ACCESS_PASSWORD_HASH et TOKEN_SECRET dans les variables Netlify.', { missing: config.missing });
    }
    const ok = await verifyPassword(body.password, env.ACCESS_PASSWORD_HASH);
    if (!ok) return fail(401, 'password', 'Mot de passe incorrect.');
    const ttlH = Math.min(24 * 30, Math.max(1, Number(env.TOKEN_TTL_HOURS) || 12));
    const exp = now + ttlH * 3600_000;
    const token = signToken({ v: 1, iat: now, exp, fp: passwordFingerprint(env.ACCESS_PASSWORD_HASH) }, env.TOKEN_SECRET);
    return json(200, { ok: true, token, exp, ready: config.ready, missing: config.missing, perMinute });
  }

  if (!['search', 'match', 'details'].includes(action)) return fail(400, 'action', 'Action inconnue.');

  // Tout ce qui suit consomme le quota Google : jeton obligatoire.
  if (config.missing.includes('ACCESS_PASSWORD_HASH') || config.missing.includes('TOKEN_SECRET')) {
    return fail(503, 'config', 'Accès non configuré : définissez ACCESS_PASSWORD_HASH et TOKEN_SECRET dans les variables Netlify.', { missing: config.missing });
  }
  const auth = req.headers.get('authorization') || '';
  const token = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim();
  const session = verifyToken(token, env.TOKEN_SECRET, { now, fingerprint: passwordFingerprint(env.ACCESS_PASSWORD_HASH) });
  if (!session) return fail(401, 'token', 'Session expirée ou invalide : reconnectez-vous.');
  if (!env.GOOGLE_PLACES_API_KEY) {
    return fail(503, 'config', 'Clé Google absente : définissez GOOGLE_PLACES_API_KEY dans les variables Netlify.', { missing: config.missing });
  }

  const rl = rateLimit(`api:${ip}`, perMinute, 60_000, now);
  if (!rl.ok) return fail(429, 'rate', 'Trop de requêtes en une minute : la recherche reprendra dans un instant.', { retryAfter: rl.retryAfter }, { 'Retry-After': String(rl.retryAfter) });

  const store = ctx.quotaStore !== undefined ? ctx.quotaStore : await defaultQuotaStore();
  const dKey = dayKey(now);
  const maxPages = action === 'search' ? Math.min(MAX_PAGES, Math.max(1, Math.floor(Number(body.maxPages) || MAX_PAGES))) : 1;
  const used = await readDaily(store, dKey);
  if (used + maxPages > dailyLimit) {
    return fail(429, 'daily', `Plafond quotidien atteint (${dailyLimit} requêtes Google par jour, réglable avec MAX_REQUESTS_PER_DAY).`, { used, dailyLimit });
  }

  const key = env.GOOGLE_PLACES_API_KEY;
  try {
    if (action === 'search') {
      const cell = readCell(body.cell);
      const category = readCategory(body.category);
      if (!cell || !category) return fail(400, 'input', 'Cellule ou catégorie invalide.');
      const request = {
        textQuery: category.query,
        languageCode: 'fr',
        regionCode: 'FR',
        pageSize: 20,
        locationRestriction: {
          rectangle: {
            low: { latitude: cell.south, longitude: cell.west },
            high: { latitude: cell.north, longitude: cell.east },
          },
        },
      };
      if (category.type) {
        request.includedType = category.type;
        request.strictTypeFiltering = true;
      }
      const r = await textSearch({ key, request, maxPages, fetchImpl });
      const usedNow = await addDaily(store, dKey, r.pages);
      const all = r.raw.map(normalizePlace).filter((p) => p.id);
      const places = all.filter(isActive);
      return json(200, {
        ok: true,
        places,
        pages: r.pages,
        requests: r.pages,
        saturated: r.saturated,
        hasMore: r.hasMore,
        typeDropped: r.typeDropped,
        closed: all.length - places.length,
        usedToday: usedNow,
        dailyLimit,
      });
    }

    if (action === 'match') {
      const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      const city = typeof body.city === 'string' ? body.city.trim().slice(0, 60) : '';
      if (name.length < 2 || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return fail(400, 'input', 'Nom ou position invalide.');
      }
      const request = {
        textQuery: city ? `${name} ${city}` : name,
        languageCode: 'fr',
        regionCode: 'FR',
        pageSize: 5,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 300 } },
      };
      const r = await textSearch({ key, request, maxPages: 1, fetchImpl });
      const usedNow = await addDaily(store, dKey, r.pages);
      const best = r.raw.map(normalizePlace)
        .filter((p) => p.id && Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p) => ({ p, d: haversineKm({ lat, lng }, { lat: p.lat, lng: p.lng }) * 1000, s: nameSimilarity(name, p.name) }))
        .filter((x) => (x.d <= 350 && x.s >= 0.5) || (x.d <= 80 && x.s >= 0.25))
        .sort((a, b) => (b.s - a.s) || (a.d - b.d))[0];
      return json(200, {
        ok: true,
        place: best ? best.p : null,
        distanceM: best ? Math.round(best.d) : null,
        similarity: best ? Math.round(best.s * 100) / 100 : null,
        requests: r.pages,
        usedToday: usedNow,
        dailyLimit,
      });
    }

    // details
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!/^[A-Za-z0-9_-]{10,300}$/.test(id)) return fail(400, 'input', 'Identifiant de lieu invalide.');
    const res = await fetchImpl(`${DETAILS_URL}${encodeURIComponent(id)}?languageCode=fr&regionCode=FR`, {
      method: 'GET',
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': DETAILS_FIELD_MASK },
    });
    if (!res.ok) {
      const err = await safeJson(res);
      if (res.status === 404) return fail(404, 'notfound', 'Ce lieu n\'existe plus sur Google.');
      throw new GoogleError(res.status, err?.error?.message, err?.error?.status);
    }
    const usedNow = await addDaily(store, dKey, 1);
    const place = normalizePlace((await safeJson(res)) || {});
    return json(200, { ok: true, place, requests: 1, usedToday: usedNow, dailyLimit });
  } catch (e) {
    if (e instanceof GoogleError) {
      return fail(e.httpStatus === 429 ? 429 : 502, 'google', googleMessage(e), { googleStatus: e.httpStatus });
    }
    return fail(502, 'network', 'Impossible de joindre Google Places pour le moment.');
  }
}

export default async (req, context) => handle(req, { ip: context?.ip });

export const config = { path: '/api/places' };
