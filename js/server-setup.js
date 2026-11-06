// Préparation du mode serveur, entièrement dans le navigateur (Web Crypto) :
// empreinte du mot de passe d'accès et secret de signature, au format attendu par
// netlify/functions/chat.mjs. Rien n'est envoyé : les valeurs sont à copier dans Netlify.
// Module sans DOM : il est aussi importé par les tests Node.

import { CLOUD_PROVIDERS } from './providers.js';

export const HASH_ITERATIONS = 210000; // identique à scripts/hash-password.mjs
export const MIN_PASSWORD = 10;

const enc = new TextEncoder();

function webcrypto() {
  const c = globalThis.crypto;
  if (!c || !c.subtle || typeof c.getRandomValues !== 'function') {
    const err = new Error('Le chiffrement du navigateur n’est disponible qu’en HTTPS (ou sur localhost).');
    err.code = 'no-crypto';
    throw err;
  }
  return c;
}

export function setupAvailable() {
  try { webcrypto(); return globalThis.isSecureContext !== false; } catch { return false; }
}

function toB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
const toB64url = (bytes) => toB64(bytes).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

/**
 * Empreinte « pbkdf2-sha256$<itérations>$<sel base64>$<empreinte base64> » (PBKDF2-SHA-256,
 * 32 octets), vérifiable par verifyPassword() de la fonction Netlify.
 */
export async function hashAccessPassword(password, { iterations = HASH_ITERATIONS, salt = null } = {}) {
  const c = webcrypto();
  const s = salt || c.getRandomValues(new Uint8Array(16));
  const base = await c.subtle.importKey('raw', enc.encode(String(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await c.subtle.deriveBits({ name: 'PBKDF2', salt: s, iterations, hash: 'SHA-256' }, base, 256);
  return `pbkdf2-sha256$${iterations}$${toB64(s)}$${toB64(new Uint8Array(bits))}`;
}

/** Secret de signature des jetons : 32 octets aléatoires en base64url (43 caractères). */
export function randomTokenSecret(bytes = 32) {
  return toB64url(webcrypto().getRandomValues(new Uint8Array(bytes)));
}

/** Entier aléatoire uniforme dans [0, n). */
function randomInt(n) {
  const c = webcrypto();
  const limit = Math.floor(0x100000000 / n) * n;
  const a = new Uint32Array(1);
  do c.getRandomValues(a); while (a[0] >= limit);
  return a[0] % n;
}

const WORDS = [
  'aube', 'ambre', 'atlas', 'azur', 'balise', 'boussole', 'braise', 'cedre', 'comete', 'corail',
  'cristal', 'dune', 'eclat', 'escale', 'etoile', 'falaise', 'flamme', 'fleuve', 'galaxie', 'givre',
  'horizon', 'jasmin', 'lagune', 'lanterne', 'lumiere', 'lune', 'marbre', 'medina', 'meteore', 'mirage',
  'nacre', 'nuage', 'oasis', 'olivier', 'onyx', 'opale', 'orage', 'orbite', 'palmier', 'phare',
  'plume', 'prisme', 'quartz', 'rivage', 'saphir', 'sirocco', 'soleil', 'source', 'tempete', 'zellige',
];

/** Phrase de passe facile à retenir : quatre mots, un nombre (≈ 29 bits d'entropie + mots). */
export function generatePassphrase(words = 4) {
  const parts = [];
  for (let i = 0; i < words; i++) {
    const w = WORDS[randomInt(WORDS.length)];
    parts.push(i === 0 ? w[0].toUpperCase() + w.slice(1) : w);
  }
  return `${parts.join('-')}-${10 + randomInt(90)}`;
}

/** Appréciation simple d'un mot de passe : { ok, level: 0..3, text } */
export function passwordStrength(pw) {
  const s = String(pw || '');
  if (!s) return { ok: false, level: 0, text: '' };
  if (s.length < MIN_PASSWORD) return { ok: false, level: 0, text: `Au moins ${MIN_PASSWORD} caractères.` };
  let variety = 0;
  if (/[a-z]/.test(s)) variety++;
  if (/[A-Z]/.test(s)) variety++;
  if (/\d/.test(s)) variety++;
  if (/[^A-Za-z0-9]/.test(s)) variety++;
  const common = /^(.)\1+$|password|motdepasse|azerty|qwerty|123456|nour|nexora/i.test(s);
  if (common) return { ok: true, level: 1, text: 'Accepté, mais trop facile à deviner.' };
  if (s.length >= 16 || (s.length >= 12 && variety >= 3)) return { ok: true, level: 3, text: 'Solide.' };
  return { ok: true, level: 2, text: 'Correct. Plus long, il serait plus sûr.' };
}

/** Variables d'environnement à ajouter dans Netlify (valeurs non secrètes uniquement + générées). */
export function serverVariables({ providerId = 'groq', hash = '', secret = '', model = '' } = {}) {
  const p = CLOUD_PROVIDERS.find((x) => x.id === providerId) || CLOUD_PROVIDERS[0];
  return [
    { name: 'PROVIDER_BASE_URL', value: p.baseUrl, note: `Adresse de l’API ${p.name}.` },
    { name: 'PROVIDER_API_KEY', value: '', secret: true, note: `Votre clé ${p.name} : collez-la directement dans Netlify, jamais ici.` },
    { name: 'ACCESS_PASSWORD_HASH', value: hash, secret: true, note: 'Empreinte du mot de passe (le mot de passe lui-même n’est stocké nulle part).' },
    { name: 'TOKEN_SECRET', value: secret, secret: true, note: 'Secret de signature des sessions.' },
    { name: 'PROVIDER_DEFAULT_MODEL', value: model, optional: true, note: 'Facultatif : modèle utilisé par défaut.' },
  ];
}

/** Bloc au format .env (valeurs entre apostrophes : « $ » n'y est jamais interprété). */
export function envBlock(vars) {
  return vars
    .filter((v) => !v.optional || v.value)
    .map((v) => `${v.name}='${v.value || (v.name === 'PROVIDER_API_KEY' ? 'collez-votre-cle-ici' : '')}'`)
    .join('\n');
}
