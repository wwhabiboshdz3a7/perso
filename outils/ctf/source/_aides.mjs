// Aides pour écrire les défis (côté auteur uniquement : ce dossier n'est jamais publié en ligne).
import { Buffer } from 'node:buffer';

// Marque un contenu à masquer dans le fichier publié (il ne sera lisible qu'une fois affiché par l'application).
export const cache = t => ({ __cache: t });

export const decaler = (s, n) => s.replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + ((n % 26) + 26)) % 26 + b); });
export const rot13 = s => decaler(s, 13);
export const b64 = s => Buffer.from(s, 'utf8').toString('base64');
export const hex = s => Buffer.from(s, 'utf8').toString('hex');
export function b32(s) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = 0, val = 0, out = '';
  for (const x of Buffer.from(s, 'utf8')) { val = (val << 8) | x; bits += 8; while (bits >= 5) { out += A[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits) out += A[(val << (5 - bits)) & 31];
  while (out.length % 8) out += '=';
  return out;
}
export function vigenere(t, cle) { const k = cle.toUpperCase(); let j = 0; return t.replace(/[a-z]/gi, c => decaler(c, k.charCodeAt(j++ % k.length) - 65)); }
export const xorHex = (t, k) => [...Buffer.from(t, 'utf8')].map(x => (x ^ k).toString(16).padStart(2, '0')).join(' ');
const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
export const morse = t => t.toUpperCase().split(' ').map(m => [...m].map(c => MORSE[c]).join(' ')).join(' / ');
export function substitution(t, alphabet) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return t.replace(/[A-Z]/g, c => alphabet[A.indexOf(c)]);
}
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const code = (lang, s) => `<pre><code class="language-${lang}">${esc(s.trim())}</code></pre>`;
