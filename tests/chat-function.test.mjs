// Tests unitaires de la fonction Netlify avec un fournisseur simulé.
//   node --test tests/*.test.mjs

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startMock } from './mock-openai.mjs';
import handler, { hashPassword, verifyPassword, signToken, verifyToken, rateLimit, resetRateLimits, redact } from '../netlify/functions/chat.mjs';

let mock;
const PASSWORD = 'mot de passe solide';
const ctx = { ip: '203.0.113.7' };

function req(path, init = {}) {
  return new Request(`https://nour.example${path}`, init);
}

async function login(password = PASSWORD) {
  const res = await handler(req('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }), ctx);
  return res;
}

before(async () => {
  mock = await startMock();
  process.env.PROVIDER_BASE_URL = mock.url;
  process.env.PROVIDER_API_KEY = 'cle-valide';
  process.env.ACCESS_PASSWORD_HASH = hashPassword(PASSWORD, 20000);
  process.env.TOKEN_SECRET = 'x'.repeat(48);
  process.env.PROVIDER_DEFAULT_MODEL = 'qwen/qwen3-32b';
  delete process.env.ALLOWED_MODELS;
  delete process.env.RATE_LIMIT_PER_MINUTE;
});

after(async () => { await mock.close(); });
beforeEach(() => { resetRateLimits(); process.env.PROVIDER_API_KEY = 'cle-valide'; });

test('empreinte de mot de passe : vérification juste et fausse', () => {
  const h = hashPassword('abc-123-xyz', 20000);
  assert.match(h, /^pbkdf2-sha256\$20000\$/);
  assert.equal(verifyPassword('abc-123-xyz', h), true);
  assert.equal(verifyPassword('abc-123-xyZ', h), false);
  assert.equal(verifyPassword('abc', 'format-inconnu'), false);
});

test('jeton signé : valide, falsifié, expiré', () => {
  const { token } = signToken('s'.repeat(40), 60000, 1000);
  assert.ok(verifyToken('s'.repeat(40), token, 2000));
  assert.equal(verifyToken('t'.repeat(40), token, 2000), null);
  assert.equal(verifyToken('s'.repeat(40), `${token.split('.')[0]}.AAAA`, 2000), null);
  assert.equal(verifyToken('s'.repeat(40), token, 1000 + 60001), null);
});

test('configuration manquante : erreur explicite sans divulguer de valeur', async () => {
  const saved = process.env.TOKEN_SECRET;
  process.env.TOKEN_SECRET = 'court';
  const res = await login();
  assert.equal(res.status, 500);
  const j = await res.json();
  assert.equal(j.error.code, 'config');
  assert.match(j.error.message, /TOKEN_SECRET/);
  assert.doesNotMatch(j.error.message, /court/);
  process.env.TOKEN_SECRET = saved;
});

test('connexion : mot de passe faux refusé, juste accepté', async () => {
  const bad = await login('pas le bon');
  assert.equal(bad.status, 401);
  assert.equal((await bad.json()).error.code, 'bad_password');
  const ok = await login();
  assert.equal(ok.status, 200);
  const j = await ok.json();
  assert.ok(j.token && j.expiresAt > Date.now());
});

test('connexion : trop de tentatives → 429 avec Retry-After', async () => {
  for (let i = 0; i < 8; i++) await login('faux');
  const res = await login('faux');
  assert.equal(res.status, 429);
  assert.ok(Number(res.headers.get('retry-after')) > 0);
});

test('API protégée : sans jeton ou jeton invalide → 401 session', async () => {
  const none = await handler(req('/api/models'), ctx);
  assert.equal(none.status, 401);
  assert.equal((await none.json()).error.code, 'session');
  const forged = await handler(req('/api/models', { headers: { Authorization: 'Bearer abc.def' } }), ctx);
  assert.equal(forged.status, 401);
});

test('modèles : relais de la liste du fournisseur', async () => {
  const { token } = await (await login()).json();
  const res = await handler(req('/api/models', { headers: { Authorization: `Bearer ${token}` } }), ctx);
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.ok(j.data.some((m) => m.id === 'qwen/qwen3-32b'));
});

test('chat : le flux SSE est relayé morceau par morceau, clé ajoutée côté serveur', async () => {
  const { token } = await (await login()).json();
  const res = await handler(req('/api/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Salut' }], stream: true, temperature: 0.5, cle_pirate: 'x' }),
  }), ctx);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/event-stream/);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let chunks = 0;
  let text = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks += 1;
    text += dec.decode(value, { stream: true });
  }
  assert.ok(chunks > 3, `plusieurs morceaux attendus, reçu ${chunks}`);
  assert.match(text, /data: \[DONE\]/);
  const content = text.split('\n').filter((l) => l.startsWith('data: {')).map((l) => JSON.parse(l.slice(6)).choices?.[0]?.delta?.content || '').join('');
  assert.match(content, /Vous avez écrit : « Salut »/);
  const last = mock.state.requests[mock.state.requests.length - 1];
  assert.equal(last.model, 'qwen/qwen3-32b', 'modèle par défaut appliqué');
  assert.equal(last.cle_pirate, undefined, 'champs inconnus filtrés');
  assert.equal(last.temperature, 0.5);
});

test('chat : erreur du fournisseur relayée sans divulguer la clé', async () => {
  const { token } = await (await login()).json();
  process.env.PROVIDER_API_KEY = 'mauvaise-cle-secrete';
  const res = await handler(req('/api/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen/qwen3-32b', messages: [{ role: 'user', content: 'Salut' }] }),
  }), ctx);
  assert.equal(res.status, 401);
  const j = await res.json();
  assert.equal(j.error.code, 'upstream_auth');
  assert.doesNotMatch(JSON.stringify(j), /mauvaise-cle-secrete/);
});

test('chat : quota du fournisseur → 429 et Retry-After relayé', async () => {
  const { token } = await (await login()).json();
  process.env.PROVIDER_API_KEY = 'cle-quota';
  const res = await handler(req('/api/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Salut' }] }),
  }), ctx);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '12');
});

test('chat : panne du fournisseur → 502', async () => {
  const { token } = await (await login()).json();
  process.env.PROVIDER_API_KEY = 'cle-panne';
  const res = await handler(req('/api/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Salut' }] }),
  }), ctx);
  assert.equal(res.status, 502);
});

test('chat : corps invalide et modèle non autorisé refusés', async () => {
  const { token } = await (await login()).json();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const r1 = await handler(req('/api/chat', { method: 'POST', headers, body: '{pas du json' }), ctx);
  assert.equal(r1.status, 400);
  const r2 = await handler(req('/api/chat', { method: 'POST', headers, body: JSON.stringify({ messages: [{ role: 'hacker', content: 'x' }] }) }), ctx);
  assert.equal(r2.status, 400);
  process.env.ALLOWED_MODELS = 'qwen/qwen3-32b';
  const r3 = await handler(req('/api/chat', { method: 'POST', headers, body: JSON.stringify({ model: 'autre/modele', messages: [{ role: 'user', content: 'x' }] }) }), ctx);
  assert.equal(r3.status, 400);
  delete process.env.ALLOWED_MODELS;
});

test('limitation de débit par adresse IP', async () => {
  process.env.RATE_LIMIT_PER_MINUTE = '3';
  const { token } = await (await login()).json();
  const call = () => handler(req('/api/session', { headers: { Authorization: `Bearer ${token}` } }), { ip: '198.51.100.9' });
  assert.equal((await call()).status, 200);
  assert.equal((await call()).status, 200);
  assert.equal((await call()).status, 200);
  const blocked = await call();
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) >= 1);
  delete process.env.RATE_LIMIT_PER_MINUTE;
});

test('rateLimit : la fenêtre se réinitialise', () => {
  resetRateLimits();
  assert.equal(rateLimit('k', 1, 1000, 0).ok, true);
  assert.equal(rateLimit('k', 1, 1000, 10).ok, false);
  assert.equal(rateLimit('k', 1, 1000, 1001).ok, true);
});

test('révocation : changer le mot de passe invalide les sessions existantes', async () => {
  const { token } = await (await login()).json();
  const call = () => handler(req('/api/session', { headers: { Authorization: `Bearer ${token}` } }), ctx);
  assert.equal((await call()).status, 200);
  const saved = process.env.ACCESS_PASSWORD_HASH;
  process.env.ACCESS_PASSWORD_HASH = hashPassword('nouveau mot de passe', 20000);
  const res = await call();
  assert.equal(res.status, 401);
  assert.equal((await res.json()).error.code, 'session');
  process.env.ACCESS_PASSWORD_HASH = saved;
  assert.equal((await call()).status, 200, 'le jeton redevient valable avec l’ancienne empreinte');
});

test('jeton lié : un jeton signé sans liaison est refusé quand la liaison est exigée', () => {
  const { token } = signToken('s'.repeat(40), 60000, 1000);
  assert.equal(verifyToken('s'.repeat(40), token, 2000, 'empreinte'), null);
  const bound = signToken('s'.repeat(40), 60000, 1000, 'empreinte').token;
  assert.ok(verifyToken('s'.repeat(40), bound, 2000, 'empreinte'));
  assert.equal(verifyToken('s'.repeat(40), bound, 2000, 'autre'), null);
});

test('redact masque les clés', () => {
  process.env.PROVIDER_API_KEY = 'ma-cle-tres-secrete';
  assert.doesNotMatch(redact('erreur avec ma-cle-tres-secrete dedans'), /tres-secrete/);
  assert.doesNotMatch(redact('Bearer gsk_abcdefghijklmnop'), /abcdefghijkl/);
});
