// Chiffrement local de la clé API : AES-GCM 256 bits, clé dérivée par PBKDF2-SHA-256.

const ITERATIONS = 310000;
const enc = new TextEncoder();
const dec = new TextDecoder();

export const cryptoAvailable = () => !!(globalThis.crypto && crypto.subtle && window.isSecureContext);

function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function fromB64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export async function deriveKey(passphrase, salt, iterations = ITERATIONS) {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Chiffre `plaintext` avec une clé déjà dérivée. */
export async function sealWithKey(key, salt, iterations, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  return { v: 1, alg: 'AES-GCM', kdf: 'PBKDF2-SHA256', iter: iterations, salt: toB64(salt), iv: toB64(iv), data: toB64(data) };
}

/** Chiffre avec une phrase secrète ; renvoie l'enveloppe et la clé dérivée (gardée en mémoire). */
export async function seal(passphrase, plaintext) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt, ITERATIONS);
  const box = await sealWithKey(key, salt, ITERATIONS, plaintext);
  return { box, key, salt, iterations: ITERATIONS };
}

/** Déchiffre une enveloppe ; lève une erreur si la phrase secrète est fausse. */
export async function open(box, passphrase) {
  const salt = fromB64(box.salt);
  const iterations = box.iter || ITERATIONS;
  const key = await deriveKey(passphrase, salt, iterations);
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, key, fromB64(box.data));
    return { plaintext: dec.decode(plain), key, salt, iterations };
  } catch {
    const err = new Error('Phrase secrète incorrecte.');
    err.code = 'bad-passphrase';
    throw err;
  }
}
