// Tests de la fonction Netlify « places » avec un faux Google (fetch simulé).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, resetRateLimits, SEARCH_FIELD_MASK, verifyToken, passwordFingerprint } from '../../netlify/functions/places.mjs';
import { hashPassword } from '../../js/lib/hash.js';
import { createMockGoogle, TEST_KEY } from '../fixtures/mock-google.mjs';

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
