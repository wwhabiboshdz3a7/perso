#!/usr/bin/env node
// Génère l'empreinte à placer dans la variable d'environnement ACCESS_PASSWORD_HASH,
// ainsi qu'un TOKEN_SECRET aléatoire.
//
//   node scripts/hash-password.mjs "votre mot de passe"
//   node scripts/hash-password.mjs            (le mot de passe est demandé, sans écho)

import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { hashPassword } from '../netlify/functions/chat.mjs';

async function ask(question) {
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    return Buffer.concat(chunks).toString('utf8').trim();
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); };
  const answer = await new Promise((resolve) => rl.question(question, resolve));
  rl.close();
  process.stdout.write('\n');
  return answer;
}

const password = process.argv[2] ?? await ask('Mot de passe d’accès : ');
if (!password || password.length < 10) {
  console.error('Choisissez un mot de passe d’au moins 10 caractères.');
  process.exit(1);
}
console.log('\nÀ copier dans Netlify → Site configuration → Environment variables :\n');
console.log(`ACCESS_PASSWORD_HASH=${hashPassword(password)}`);
console.log(`TOKEN_SECRET=${randomBytes(32).toString('base64url')}`);
