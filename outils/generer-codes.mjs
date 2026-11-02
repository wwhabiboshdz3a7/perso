// Génère des codes d'accès et la valeur à coller dans la variable ACCESS_CODE_HASHES.
// Usage : node outils/generer-codes.mjs <offre> [nombre] [--fichier]   (offre : essentiel | pro | vip)
//         --fichier ajoute les hachages à prive/codes-acces.txt (au lieu de la variable d'environnement)
//         node outils/generer-codes.mjs --hacher <code> <offre>
// Gardez la liste des codes en clair hors du dépôt (gestionnaire de mots de passe, tableur privé).
import { randomBytes } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { hacherCode } from '../netlify/lib/verificateurs.mjs';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O ni 1/I
const OFFRES = ['essentiel', 'pro', 'vip'];

function nouveauCode() {
  const octets = randomBytes(15);
  let s = '';
  for (const o of octets) s += ALPHABET[o % ALPHABET.length];
  return `LEV-${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10, 15)}`;
}

const versFichier = process.argv.includes('--fichier');
const args = process.argv.slice(2).filter(a => a !== '--fichier');
if (args[0] === '--hacher') {
  const [, code, offre = 'pro'] = args;
  if (!code) { console.error('Usage : --hacher <code> <offre>'); process.exit(1); }
  console.log(`${offre}:${hacherCode(code)}`);
  process.exit(0);
}

const offre = (args[0] || '').toLowerCase();
const nombre = Math.min(Math.max(parseInt(args[1] || '1', 10) || 1, 1), 500);
if (!OFFRES.includes(offre)) {
  console.error('Usage : node outils/generer-codes.mjs <essentiel|pro|vip> [nombre]');
  process.exit(1);
}
const lignes = [];
console.log(`Codes ${offre} (à transmettre aux acheteurs) :`);
for (let i = 0; i < nombre; i++) {
  const c = nouveauCode();
  console.log('  ' + c);
  lignes.push(`${offre}:${hacherCode(c)}`);
}
if (versFichier) {
  appendFileSync(new URL('../prive/codes-acces.txt', import.meta.url), lignes.join('\n') + '\n');
  console.log(`\n${lignes.length} hachage(s) ajouté(s) à prive/codes-acces.txt (à committer).`);
} else {
  console.log('\nÀ ajouter à ACCESS_CODE_HASHES (séparateur : virgule) :');
  console.log(lignes.join(','));
}
