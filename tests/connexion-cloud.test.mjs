// Tests unitaires de l'assistant « Choisir le cerveau de Nour » :
// générateur du mode serveur (Web Crypto) face à la vraie fonction Netlify, route /api/status,
// catalogue des fournisseurs cloud et choix du modèle conseillé.
//   node --test tests/*.test.mjs

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import handler, { verifyPassword, resetRateLimits, missingVariables } from '../netlify/functions/chat.mjs';
import { hashAccessPassword, randomTokenSecret, generatePassphrase, passwordStrength, serverVariables, envBlock } from '../js/server-setup.js';
import { CLOUD_PROVIDERS, providerById, normalizeModels, recommendedModels, pickDefaultModel, openModels, keyOwner, cleanKey } from '../js/providers.js';
import { MODELS } from './mock-openai.mjs';

const ctx = { ip: '198.51.100.9' };
const call = (path, init) => handler(new Request(`https://nour.example${path}`, init), ctx);
const VARS = ['PROVIDER_BASE_URL', 'PROVIDER_API_KEY', 'ACCESS_PASSWORD_HASH', 'TOKEN_SECRET', 'PROVIDER_DEFAULT_MODEL'];

beforeEach(() => { resetRateLimits(); for (const v of VARS) delete process.env[v]; });

test('générateur : l’empreinte du navigateur est acceptée par la fonction', async () => {
  const hash = await hashAccessPassword('Atlas-lumiere-oasis-42', { iterations: 20000 });
  assert.match(hash, /^pbkdf2-sha256\$20000\$[A-Za-z0-9+/]+=*\$[A-Za-z0-9+/]+=*$/);
  assert.equal(verifyPassword('Atlas-lumiere-oasis-42', hash), true);
  assert.equal(verifyPassword('Atlas-lumiere-oasis-43', hash), false);
  // Deux empreintes du même mot de passe diffèrent (sel aléatoire).
  assert.notEqual(hash, await hashAccessPassword('Atlas-lumiere-oasis-42', { iterations: 20000 }));
});

test('générateur : secret, phrase de passe, robustesse', () => {
  const s = randomTokenSecret();
  assert.match(s, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(s, randomTokenSecret());
  for (let i = 0; i < 20; i++) {
    const p = generatePassphrase();
    assert.match(p, /^[A-Z][a-z]+(-[a-z]+){3}-\d{2}$/);
    assert.equal(passwordStrength(p).ok, true);
  }
  assert.equal(passwordStrength('court').ok, false);
  assert.equal(passwordStrength('azerty123456').level, 1);
  assert.equal(passwordStrength('Un mot de passe très long').level, 3);
});

test('bloc .env : valeurs entre apostrophes, clé jamais remplie', () => {
  const vars = serverVariables({ providerId: 'openrouter', hash: 'pbkdf2-sha256$1$a$b', secret: 'x'.repeat(43) });
  const env = envBlock(vars);
  assert.match(env, /^PROVIDER_BASE_URL='https:\/\/openrouter\.ai\/api\/v1'$/m);
  assert.match(env, /^PROVIDER_API_KEY='collez-votre-cle-ici'$/m);
  assert.match(env, /^ACCESS_PASSWORD_HASH='pbkdf2-sha256\$1\$a\$b'$/m);
  assert.doesNotMatch(env, /PROVIDER_DEFAULT_MODEL/, 'facultative et vide : omise');
});

test('/api/status : fonction absente de configuration, puis prête, sans divulguer de valeur', async () => {
  let res = await call('/api/status');
  assert.equal(res.status, 200);
  let j = await res.json();
  assert.deepEqual(j, { service: 'nour', function: true, configured: false, missing: ['PROVIDER_BASE_URL', 'ACCESS_PASSWORD_HASH', 'TOKEN_SECRET'], hasDefaultModel: false });

  // Valeurs collées avec leurs apostrophes (import d'un bloc .env) : acceptées.
  const hash = await hashAccessPassword('mot de passe du serveur', { iterations: 20000 });
  process.env.PROVIDER_BASE_URL = 'https://api.groq.com/openai/v1';
  process.env.PROVIDER_API_KEY = 'gsk_secret_a_ne_pas_divulguer';
  process.env.ACCESS_PASSWORD_HASH = `'${hash}'`;
  process.env.TOKEN_SECRET = `'${randomTokenSecret()}'`;
  res = await call('/api/status');
  j = await res.json();
  assert.equal(j.configured, true);
  assert.deepEqual(j.missing, []);
  assert.doesNotMatch(JSON.stringify(j), /gsk_|groq|pbkdf2/);
  assert.equal((await call('/api/status', { method: 'POST' })).status, 405);

  const login = await call('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'mot de passe du serveur' }) });
  assert.equal(login.status, 200, 'connexion avec les valeurs générées');
});

test('/api/status : empreinte mal formée signalée comme manquante', () => {
  process.env.PROVIDER_BASE_URL = 'https://api.groq.com/openai/v1';
  process.env.ACCESS_PASSWORD_HASH = 'mon mot de passe en clair';
  process.env.TOKEN_SECRET = 'y'.repeat(40);
  assert.deepEqual(missingVariables(), ['ACCESS_PASSWORD_HASH']);
});

test('catalogue cloud : sept fournisseurs documentés, liens de clé, mention prudente', () => {
  assert.deepEqual(CLOUD_PROVIDERS.map((p) => p.id), ['groq', 'openrouter', 'huggingface', 'cerebras', 'together', 'mistral', 'deepinfra']);
  for (const p of CLOUD_PROVIDERS) {
    assert.match(p.baseUrl, /^https:\/\//, p.id);
    assert.match(p.keyUrl, /^https:\/\//, p.id);
    assert.ok(p.what && p.steps && p.price && p.price.label, p.id);
    assert.match(p.price.note, /à vérifier/, `${p.id} : offre formulée prudemment`);
    assert.ok(p.suggest.length >= 4, p.id);
  }
  assert.equal(providerById('ollama').cloud, undefined);
});

test('modèles conseillés : rapprochés de la liste en direct, gratuits d’abord', () => {
  const models = normalizeModels({ data: MODELS });
  const groq = providerById('groq');
  const reco = recommendedModels(groq, models);
  assert.deepEqual(reco.map((r) => r.model.id), ['openai/gpt-oss-120b', 'meta-llama/llama-3.3-70b-instruct', 'qwen/qwen3-32b']);
  assert.equal(pickDefaultModel(groq, models), 'openai/gpt-oss-120b');
  assert.equal(pickDefaultModel(groq, models, { preferred: 'qwen/qwen3-32b' }), 'qwen/qwen3-32b');
  assert.equal(pickDefaultModel(groq, models, { preferred: 'modele/inexistant' }), 'openai/gpt-oss-120b');
  assert.equal(pickDefaultModel(providerById('openrouter'), models, { freeOnly: true }), 'google/gemma-3-27b-it:free');
  assert.ok(!openModels(models).some((m) => m.id === 'nomic-embed-text'), 'pas de modèle d’embedding');
});

test('clés : nettoyage et fournisseur reconnu au préfixe', () => {
  assert.equal(cleanKey('  Bearer "gsk_abc123"\n'), 'gsk_abc123');
  assert.equal(keyOwner('gsk_abc')?.id, 'groq');
  assert.equal(keyOwner('sk-or-v1-abc')?.id, 'openrouter');
  assert.equal(keyOwner('hf_abc')?.id, 'huggingface');
  assert.equal(keyOwner('csk-abc')?.id, 'cerebras');
  assert.equal(keyOwner('Ab12Cd34Ef56Gh78Ij90Kl12Mn34Op56'), null);
});
