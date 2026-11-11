// Tests de la fonction Netlify « places » avec un faux Google (fetch simulé).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, resetRateLimits, SEARCH_FIELD_MASK, verifyToken, passwordFingerprint } from '../../netlify/functions/places.mjs';
import { hashPassword } from '../../js/lib/hash.js';
import { createMockGoogle, TEST_KEY } from '../fixtures/mock-google.mjs';
import { PlacesApi } from '../../js/lib/api.js';

const PASSWORD = 'Prospects-Toulouse-2026';
const HASH = await hashPassword(PASSWORD, { iterations: 20000 });
const SECRET = 'a'.repeat(64);
const ENV = { GOOGLE_PLACES_API_KEY: TEST_KEY, ACCESS_PASSWORD_HASH: HASH, TOKEN_SECRET: SECRET, MAX_REQUESTS_PER_DAY: '1000' };

// Cellules autour du centre de Toulouse
const CENTER_CELL = { south: 43.596, west: 1.433, north: 43.613, east: 1.456 };
const SMALL_CELL = { south: 43.6035, west: 1.4425, north: 43.6055, east: 1.4455 };

function post(body, token, headers = {}) {
  return new Request('https://prospecteur.test/api/places', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: JSON.stringify(body),
  });
}

async function call(body, { token, env = ENV, google = createMockGoogle(), now, ip = '1.2.3.4' } = {}) {
  const res = await handle(post(body, token), { env, fetch: google.fetch, now, ip, quotaStore: null });
  return { res, data: await res.json(), google };
}

async function login(env = ENV) {
  const { data } = await call({ action: 'login', password: PASSWORD }, { env });
  assert.ok(data.token, 'jeton attendu');
  return data.token;
}

beforeEach(() => resetRateLimits());

test('statut : configuration manquante signalée sans secret', async () => {
  const res = await handle(new Request('https://x.test/api/places'), { env: {}, quotaStore: null });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.ready, false);
  assert.deepEqual(data.missing.sort(), ['ACCESS_PASSWORD_HASH', 'GOOGLE_PLACES_API_KEY', 'TOKEN_SECRET']);
  assert.ok(!JSON.stringify(data).includes(TEST_KEY));
});

test('connexion : mauvais mot de passe refusé, bon mot de passe → jeton signé', async () => {
  const bad = await call({ action: 'login', password: 'nope' });
  assert.equal(bad.res.status, 401);
  const ok = await call({ action: 'login', password: PASSWORD });
  assert.equal(ok.res.status, 200);
  const session = verifyToken(ok.data.token, SECRET, { now: Date.now(), fingerprint: passwordFingerprint(HASH) });
  assert.ok(session && session.exp > Date.now());
});

test('connexion : limitation des tentatives par IP', async () => {
  for (let i = 0; i < 8; i++) await call({ action: 'login', password: 'faux' });
  const { res } = await call({ action: 'login', password: PASSWORD });
  assert.equal(res.status, 429);
});

test('connexion : échecs partagés entre instances (Netlify Blobs), sans IP en clair', async () => {
  // faux magasin Netlify Blobs, commun à toutes les « instances » de la fonction
  const data = new Map();
  const blobs = {
    async get(k) { return data.has(k) ? JSON.parse(data.get(k)) : null; },
    async setJSON(k, v) { data.set(k, JSON.stringify(v)); },
    async delete(k) { data.delete(k); },
  };
  const attempt = (password, ip) => handle(post({ action: 'login', password }), { env: ENV, quotaStore: blobs, ip });
  for (let i = 0; i < 7; i++) assert.equal((await attempt('faux', '5.6.7.8')).status, 401);
  // une nouvelle instance (mémoire vide) voit toujours les échecs précédents
  resetRateLimits();
  assert.equal((await attempt('faux', '5.6.7.8')).status, 401);
  resetRateLimits();
  assert.equal((await attempt(PASSWORD, '5.6.7.8')).status, 429, 'bloqué même avec le bon mot de passe');
  assert.ok([...data.keys()].every((k) => !k.includes('5.6.7.8')), 'adresse IP stockée sous forme d\'empreinte');
  // une autre adresse n'est pas bloquée, et une connexion réussie efface ses échecs
  resetRateLimits();
  assert.equal((await attempt('faux', '9.8.7.6')).status, 401);
  assert.equal((await attempt(PASSWORD, '9.8.7.6')).status, 200);
  // plafond global : une attaque répartie sur de nombreuses adresses finit bloquée
  resetRateLimits();
  data.clear();
  for (let i = 0; i < 40; i++) await attempt('faux', `10.0.0.${i}`);
  assert.equal((await attempt(PASSWORD, '10.0.1.1')).status, 429);
});

test('limite par minute : annoncée au client, appliquée par IP, respectée par le client', async () => {
  const env = { ...ENV, RATE_LIMIT_PER_MINUTE: '12' };
  const { data: st } = await call({ action: 'status' }, { env });
  assert.equal(st.perMinute, 12);
  const token = await login(env);
  const google = createMockGoogle();
  const statuses = [];
  for (let i = 0; i < 13; i++) {
    const { res } = await call({ action: 'search', cell: SMALL_CELL, category: { query: 'restaurant', type: 'restaurant' } }, { token, env, google });
    statuses.push(res.status);
  }
  assert.deepEqual(statuses.slice(0, 12), Array(12).fill(200));
  assert.equal(statuses[12], 429, '13e appel de la minute refusé');
  const other = await call({ action: 'search', cell: SMALL_CELL, category: { query: 'restaurant', type: 'restaurant' } }, { token, env, google, ip: '5.6.7.8' });
  assert.equal(other.res.status, 200, 'une autre IP n\'est pas concernée');

  // Côté navigateur : le client adopte la limite annoncée et patiente au lieu d'être refusé.
  resetRateLimits();
  let t = 1_000_000;
  const client = new PlacesApi({
    endpoint: 'https://prospecteur.test/api/places',
    now: () => t,
    fetchImpl: (url, init) => handle(new Request(url, init), { env, fetch: google.fetch, ip: '9.9.9.9', quotaStore: null }),
  });
  await client.login(PASSWORD);
  assert.equal(client.perMinute, 12);
  const waits = [];
  const ctrl = new AbortController();
  client.onWait = (ms) => { waits.push(ms); ctrl.abort(); };
  for (let i = 0; i < 7; i++) await client.search({ cell: SMALL_CELL, category: { query: 'restaurant', type: 'restaurant' }, maxPages: 1 });
  await assert.rejects(client.search({ cell: SMALL_CELL, category: { query: 'restaurant', type: 'restaurant' }, maxPages: 1 }, { signal: ctrl.signal }), { name: 'AbortError' });
  assert.equal(waits.length, 1, 'pause annoncée avant de dépasser la limite (marge de 5)');
  assert.ok(waits[0] > 59_000 && waits[0] <= 60_100);
  t += 61_000;
  const after = await client.search({ cell: SMALL_CELL, category: { query: 'restaurant', type: 'restaurant' }, maxPages: 1 });
  assert.ok(after.ok, 'la fenêtre glissante libère des places');
});

test('recherche : refusée sans jeton, avec jeton falsifié ou expiré', async () => {
  const google = createMockGoogle();
  assert.equal((await call({ action: 'search', cell: SMALL_CELL, category: { query: 'restaurant', type: 'restaurant' } }, { google })).res.status, 401);
  const token = await login();
  const [body, sig] = token.split('.');
  const forged = `${Buffer.from(JSON.stringify({ v: 1, exp: Date.now() + 1e9, fp: passwordFingerprint(HASH) })).toString('base64url')}.${sig}`;
  assert.equal((await call({ action: 'search', cell: SMALL_CELL, category: { query: 'restaurant' } }, { token: forged, google })).res.status, 401);
  const later = () => Date.now() + 13 * 3600_000;
  assert.equal((await call({ action: 'search', cell: SMALL_CELL, category: { query: 'restaurant' } }, { token, google, now: later })).res.status, 401);
  assert.ok(body);
  assert.equal(google.calls.length, 0, 'aucun appel Google sans session valide');
});

test('recherche : pagination jusqu\'à 60 résultats, saturation, masque de champs, en activité seulement', async () => {
  const token = await login();
  const { res, data, google } = await call({ action: 'search', cell: CENTER_CELL, category: { query: 'restaurant', type: 'restaurant' }, maxPages: 3 }, { token });
  assert.equal(res.status, 200);
  assert.equal(data.pages, 3);
  assert.equal(data.requests, 3);
  assert.equal(data.saturated, true);
  assert.ok(data.places.length <= 60 && data.places.length >= 50);
  assert.equal(data.places.length + data.closed, 60);
  assert.ok(data.places.every((p) => !p.businessStatus || p.businessStatus === 'OPERATIONAL'));
  // en-têtes et corps envoyés à Google
  const first = google.calls[0];
  assert.equal(first.headers['X-Goog-FieldMask'], SEARCH_FIELD_MASK);
  assert.ok(SEARCH_FIELD_MASK.includes('nextPageToken') && SEARCH_FIELD_MASK.includes('places.websiteUri'));
  assert.equal(first.body.includedType, 'restaurant');
  assert.equal(first.body.strictTypeFiltering, true);
  assert.deepEqual(first.body.locationRestriction.rectangle.low, { latitude: CENTER_CELL.south, longitude: CENTER_CELL.west });
  assert.equal(google.calls[1].body.pageToken, 'page:20');
  assert.equal(google.calls[2].body.pageToken, 'page:40');
  // la clé ne fuit jamais vers le navigateur
  assert.ok(!JSON.stringify(data).includes(TEST_KEY));
});

test('recherche : petite cellule → une page, pas de saturation, sites classés', async () => {
  const token = await login();
  const { data } = await call({ action: 'search', cell: CENTER_CELL, category: { query: 'plombier', type: 'plumber' } }, { token });
  assert.equal(data.saturated, false);
  assert.ok(data.pages >= 1);
  for (const p of data.places) {
    assert.ok(['none', 'social', 'site'].includes(p.website.status));
    if (p.websiteUri.includes('facebook')) assert.equal(p.website.status, 'social');
    if (!p.websiteUri) assert.equal(p.website.status, 'none');
  }
});

test('recherche : maxPages bride la pagination', async () => {
  const token = await login();
  const { data } = await call({ action: 'search', cell: CENTER_CELL, category: { query: 'restaurant', type: 'restaurant' }, maxPages: 1 }, { token });
  assert.equal(data.pages, 1);
  assert.equal(data.hasMore, true);
  assert.equal(data.saturated, true);
});

test('recherche : type refusé par Google → relance sur le texte seul', async () => {
  const token = await login();
  const google = createMockGoogle({ failTypes: ['bakery'] });
  const { data } = await call({ action: 'search', cell: CENTER_CELL, category: { query: 'boulangerie pâtisserie', type: 'bakery' } }, { token, google });
  assert.equal(data.typeDropped, true);
  assert.ok(data.places.length > 0);
  assert.equal(google.calls[1].body.includedType, undefined);
});

test('recherche : entrées invalides refusées', async () => {
  const token = await login();
  const huge = { south: 40, west: -2, north: 48, east: 6 };
  assert.equal((await call({ action: 'search', cell: huge, category: { query: 'restaurant' } }, { token })).res.status, 400);
  assert.equal((await call({ action: 'search', cell: SMALL_CELL, category: { query: 'x', type: 'DROP TABLE' } }, { token })).res.status, 400);
});

test('plafond quotidien de requêtes Google', async () => {
  const env = { ...ENV, MAX_REQUESTS_PER_DAY: '4' };
  const token = await login(env);
  const first = await call({ action: 'search', cell: CENTER_CELL, category: { query: 'restaurant', type: 'restaurant' } }, { token, env });
  assert.equal(first.data.usedToday, 3);
  const second = await call({ action: 'search', cell: CENTER_CELL, category: { query: 'restaurant', type: 'restaurant' } }, { token, env });
  assert.equal(second.res.status, 429);
  assert.equal(second.data.error, 'daily');
});

test('clé Google refusée → message explicite', async () => {
  const env = { ...ENV, GOOGLE_PLACES_API_KEY: 'mauvaise' };
  const token = await login(env);
  const { res, data } = await call({ action: 'search', cell: SMALL_CELL, category: { query: 'restaurant' } }, { token, env });
  assert.equal(res.status, 502);
  assert.match(data.message, /Places API \(New\)/);
});

test('correspondance OSM → Google et actualisation par identifiant', async () => {
  const token = await login();
  const google = createMockGoogle();
  const target = google.dataset.find((p) => p.status === 'OPERATIONAL' && p.cat === 'garage');
  const m = await call({ action: 'match', name: target.name, lat: target.lat + 0.0003, lng: target.lng }, { token, google });
  assert.equal(m.res.status, 200);
  assert.equal(m.data.place?.name, target.name);
  assert.ok(m.data.distanceM < 100);
  const d = await call({ action: 'details', id: target.id }, { token, google });
  assert.equal(d.data.place.id, target.id);
  assert.equal(d.data.place.reviews, target.reviews);
});
