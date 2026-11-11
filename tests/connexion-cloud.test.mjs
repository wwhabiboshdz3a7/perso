// Tests unitaires de l'assistant « Choisir le cerveau de Nour » :
// générateur du mode serveur (Web Crypto) face à la vraie fonction Netlify, route /api/status,
// catalogue des fournisseurs cloud et choix du modèle conseillé.
//   node --test tests/*.test.mjs

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import handler, { verifyPassword, resetRateLimits, missingVariables, isLocalUrl } from '../netlify/functions/chat.mjs';
import { hashAccessPassword, randomTokenSecret, generatePassphrase, passwordStrength, passphraseBits, PASSPHRASE_WORDS, serverVariables, envBlock } from '../js/server-setup.js';
import { CLOUD_PROVIDERS, providerById, normalizeModels, recommendedModels, pickDefaultModel, openModels, isOpenWeights, keyOwner, cleanKey } from '../js/providers.js';
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
  assert.ok(PASSPHRASE_WORDS >= 256, `liste de ${PASSPHRASE_WORDS} mots`);
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const p = generatePassphrase();
    seen.add(p);
    assert.match(p, /^[A-Z][a-z]+(-[a-z]+){4}-\d{3}$/);
    // Cinq mots d'au moins 8 bits et un nombre de 100 à 999 : 49 bits ou plus.
    assert.ok(passphraseBits(p) >= 49, `${p} : ${passphraseBits(p)} bits`);
    assert.equal(passwordStrength(p).level, 3);
  }
  assert.equal(seen.size, 40, 'phrases toutes différentes');
  assert.equal(passwordStrength('court').ok, false);
  assert.equal(passwordStrength('azerty123456').level, 1);
  assert.equal(passwordStrength('Un mot de passe très long').level, 3);
});

test('robustesse : une phrase de mots courants est notée sur son entropie réelle, pas sa longueur', () => {
  // L'ancienne phrase proposée (4 mots d'une liste de 50 et un nombre à 2 chiffres) faisait 28 caractères.
  const old = 'Horizon-ambre-dune-escale-72';
  assert.ok(passphraseBits(old) < 44, `${passphraseBits(old)} bits`);
  assert.equal(passwordStrength(old).level, 2, 'plus « Solide »');
  assert.match(passwordStrength(old).text, /ajoutez un mot/);
  assert.equal(passphraseBits('Mon-chat-Felix-2019'), null, 'mots hors liste : estimation générale');
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
  assert.deepEqual(j, { service: 'nour', function: true, configured: false, missing: ['PROVIDER_BASE_URL', 'PROVIDER_API_KEY', 'ACCESS_PASSWORD_HASH', 'TOKEN_SECRET'], hasDefaultModel: false });

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
  process.env.PROVIDER_API_KEY = 'gsk_une_vraie_cle';
  process.env.ACCESS_PASSWORD_HASH = 'mon mot de passe en clair';
  process.env.TOKEN_SECRET = 'y'.repeat(40);
  assert.deepEqual(missingVariables(), ['ACCESS_PASSWORD_HASH']);
});

test('/api/status : clé du fournisseur absente ou laissée sur le texte d’exemple → pas « prêt »', async () => {
  process.env.PROVIDER_BASE_URL = 'https://api.groq.com/openai/v1';
  process.env.ACCESS_PASSWORD_HASH = await hashAccessPassword('mot de passe du serveur', { iterations: 20000 });
  process.env.TOKEN_SECRET = 'y'.repeat(40);
  // Bloc .env importé tel quel : la clé vaut encore « collez-votre-cle-ici » (avec ses apostrophes).
  process.env.PROVIDER_API_KEY = "'collez-votre-cle-ici'";
  let j = await (await call('/api/status')).json();
  assert.equal(j.configured, false);
  assert.deepEqual(j.missing, ['PROVIDER_API_KEY']);
  const login = await call('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'mot de passe du serveur' }) });
  assert.equal(login.status, 500);
  assert.match((await login.json()).error.message, /PROVIDER_API_KEY/);
  // Absente, vers un fournisseur cloud : manquante.
  delete process.env.PROVIDER_API_KEY;
  assert.deepEqual(missingVariables(), ['PROVIDER_API_KEY']);
  // Absente, vers un serveur local ou privé : acceptée.
  process.env.PROVIDER_BASE_URL = 'http://127.0.0.1:11434/v1';
  assert.deepEqual(missingVariables(), []);
  // Serveur sans authentification assumé : « aucune ».
  process.env.PROVIDER_BASE_URL = 'https://mon-vllm.exemple/v1';
  process.env.PROVIDER_API_KEY = 'aucune';
  assert.deepEqual(missingVariables(), []);
  j = await (await call('/api/status')).json();
  assert.equal(j.configured, true);
  for (const [url, local] of [['http://localhost:1234/v1', true], ['http://192.168.1.20:8000/v1', true], ['http://10.0.0.5/v1', true], ['https://api.groq.com/openai/v1', false], ['https://10.example.com/v1', false], ['pas une url', false]]) {
    assert.equal(isLocalUrl(url), local, url);
  }
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

test('modèles ouverts : les modèles propriétaires d’une famille ouverte sont écartés', () => {
  const ids = ['qwen/qwen-max', 'qwen/qwen-plus', 'qwen/qwen3-max', 'qwen/qwen3-coder-plus', 'mistral-medium-latest', 'mistral-large-latest', 'codestral-latest', 'moonshot-v1-8k',
    'qwen/qwen3-235b-a22b', 'qwen/qwen3-coder', 'mistral-small-latest', 'moonshotai/kimi-k2-instruct', 'openai/gpt-oss-120b'];
  const models = normalizeModels({ data: ids.map((id) => ({ id })) });
  const open = openModels(models).map((m) => m.id);
  assert.deepEqual(open.sort(), ['moonshotai/kimi-k2-instruct', 'mistral-small-latest', 'openai/gpt-oss-120b', 'qwen/qwen3-235b-a22b', 'qwen/qwen3-coder'].sort());
  assert.equal(isOpenWeights(models.find((m) => m.id === 'qwen/qwen-max')), false);
  // Les conseils non plus : « Qwen3 (grand modèle) » ne doit pas tomber sur qwen3-coder-plus.
  const or = recommendedModels(providerById('openrouter'), normalizeModels({ data: [{ id: 'qwen/qwen3-coder-plus' }] }));
  assert.deepEqual(or, []);
});

test('clés : nettoyage et fournisseur reconnu au préfixe', () => {
  assert.equal(cleanKey('  Bearer "gsk_abc123"\n'), 'gsk_abc123');
  assert.equal(keyOwner('gsk_abc')?.id, 'groq');
  assert.equal(keyOwner('sk-or-v1-abc')?.id, 'openrouter');
  assert.equal(keyOwner('hf_abc')?.id, 'huggingface');
  assert.equal(keyOwner('csk-abc')?.id, 'cerebras');
  assert.equal(keyOwner('Ab12Cd34Ef56Gh78Ij90Kl12Mn34Op56'), null);
});
