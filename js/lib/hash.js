// Générateur d'empreinte de mot de passe (dans le navigateur, rien n'est envoyé).
// Format compris par la fonction Netlify : pbkdf2_sha256$<itérations>$<sel>$<empreinte> (base64url).

export const ITERATIONS = 210000;

export function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function hashPassword(password, { iterations = ITERATIONS, salt, crypto = globalThis.crypto } = {}) {
  const s = salt || crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: s, iterations }, key, 256);
  return `pbkdf2_sha256$${iterations}$${b64url(s)}$${b64url(new Uint8Array(bits))}`;
}

export function randomSecret(bytes = 32, crypto = globalThis.crypto) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Robustesse indicative : longueur et variété. */
export function passwordStrength(pw) {
  const len = pw.length;
  let kinds = 0;
  if (/[a-z]/.test(pw)) kinds++;
  if (/[A-Z]/.test(pw)) kinds++;
  if (/\d/.test(pw)) kinds++;
  if (/[^A-Za-z0-9]/.test(pw)) kinds++;
  if (len >= 16 || (len >= 12 && kinds >= 3)) return { level: 'fort', ok: true };
  if (len >= 10 && kinds >= 2) return { level: 'moyen', ok: true };
  return { level: 'faible', ok: false };
}
