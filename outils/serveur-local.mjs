// Serveur de développement : sert public/ comme Netlify, émule /.netlify/functions/* et Netlify Forms.
// Usage : TOKEN_SECRET=… ACCESS_CODE_HASHES=… node outils/serveur-local.mjs [--port 9540]
// Les variables peuvent aussi être placées dans un fichier .env à la racine (non versionné).
// LEVIER_SIMULATION=chemin/module.mjs : remplace les appels aux fournisseurs (Stripe, Gumroad,
// Lemon Squeezy, emails) par la fonction `fetch` exportée par ce module (tests de bout en bout).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(racine, 'public');
const i = process.argv.indexOf('--port');
const port = Number(i > 0 ? process.argv[i + 1] : process.env.PORT || 9540);

// Chargement facultatif d'un fichier .env (CLE=valeur par ligne).
const fichierEnv = path.join(racine, '.env');
if (existsSync(fichierEnv)) {
  for (const ligne of readFileSync(fichierEnv, 'utf8').split('\n')) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.pdf': 'application/pdf'
};

export const formulaires = [];

if (process.env.LEVIER_SIMULATION) {
  const simulation = await import(pathToFileURL(path.resolve(racine, process.env.LEVIER_SIMULATION)).href);
  const fetchReel = globalThis.fetch;
  globalThis.fetch = (url, options) => /^https:\/\/api\./.test(String(url)) ? simulation.fetch(String(url), options) : fetchReel(url, options);
  console.log('Fournisseurs simulés :', process.env.LEVIER_SIMULATION, '(emails envoyés : /__emails)');
}

// En-têtes déclarés dans netlify.toml ([[headers]]), appliqués comme en production (dont la CSP).
const reglesEntetes = [];
try {
  const toml = readFileSync(path.join(racine, 'netlify.toml'), 'utf8');
  for (const bloc of toml.split('[[headers]]').slice(1)) {
    const motif = (bloc.match(/for\s*=\s*"([^"]+)"/) || [])[1];
    if (!motif) continue;
    const valeurs = {};
    for (const m of bloc.matchAll(/^\s*([A-Za-z-]+)\s*=\s*"([^"]*)"\s*$/gm)) if (m[1] !== 'for') valeurs[m[1]] = m[2];
    reglesEntetes.push({ prefixe: motif.replace(/\*$/, ''), valeurs });
  }
} catch { /* netlify.toml absent */ }
const entetesPour = chemin => Object.assign({}, ...reglesEntetes.filter(r => chemin.startsWith(r.prefixe)).map(r => r.valeurs));

async function fonction(nom, req, res, corps) {
  const fichier = path.join(racine, 'netlify', 'functions', `${nom}.mjs`);
  if (!/^[a-z0-9-]+$/.test(nom) || !existsSync(fichier)) { res.writeHead(404); return res.end('Fonction introuvable'); }
  const mod = await import(pathToFileURL(fichier).href);
  const url = `http://localhost:${port}${req.url}`;
  const requete = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : corps });
  const reponse = await mod.default(requete, { ip: req.socket.remoteAddress });
  const entetes = Object.fromEntries(reponse.headers.entries());
  res.writeHead(reponse.status, entetes);
  res.end(Buffer.from(await reponse.arrayBuffer()));
}

async function fichierStatique(urlPath, res) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  let complet = path.normalize(path.join(publicDir, p));
  if (!complet.startsWith(publicDir)) { res.writeHead(403); return res.end(); }
  try {
    let s = await stat(complet);
    if (s.isDirectory()) {
      if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
      complet = path.join(complet, 'index.html');
      s = await stat(complet);
    }
    const type = TYPES[path.extname(complet).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { ...entetesPour(p), 'Content-Type': type, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(await readFile(complet));
  } catch {
    const page404 = path.join(publicDir, '404.html');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(existsSync(page404) ? await readFile(page404) : 'Introuvable');
  }
}

const serveur = http.createServer(async (req, res) => {
  const morceaux = [];
  for await (const m of req) morceaux.push(m);
  const corps = Buffer.concat(morceaux);
  try {
    const m = req.url.match(/^\/\.netlify\/functions\/([^/?#]+)/);
    if (m) return await fonction(m[1], req, res, corps);
    if (req.method === 'POST') {
      // Émulation de Netlify Forms : enregistre la soumission et répond 200.
      const donnees = Object.fromEntries(new URLSearchParams(corps.toString('utf8')));
      if (!donnees['form-name']) { res.writeHead(404); return res.end('Formulaire inconnu'); }
      if (donnees['bot-field']) { res.writeHead(200); return res.end('ok'); }
      formulaires.push({ ...donnees, recu: new Date().toISOString() });
      console.log('[formulaire]', donnees['form-name'], donnees.email || '');
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('ok');
    }
    if (req.url === '/__formulaires') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(formulaires)); }
    if (req.url === '/__emails') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(globalThis.__levierEmails || [])); }
    return await fichierStatique(req.url, res);
  } catch (e) {
    console.error(e);
    res.writeHead(500); res.end('Erreur serveur locale');
  }
});

serveur.listen(port, () => {
  console.log(`Serveur local : http://localhost:${port}  (fonctions : /.netlify/functions/access, /content)`);
  if (!process.env.TOKEN_SECRET) console.log('Attention : TOKEN_SECRET non défini, la fonction access répondra 500.');
});
