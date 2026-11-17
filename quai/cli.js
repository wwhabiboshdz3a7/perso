#!/usr/bin/env node
'use strict';
// Déploie un dossier (ou un .zip) sur Quai depuis le terminal.
//
//   node cli.js <dossier|archive.zip> [nom-du-projet]
//
// Variables : QUAI_URL (défaut http://localhost:8080) et QUAI_TOKEN
// (à défaut, le jeton est lu dans ./data/token à côté de ce script).

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const IGNORED = new Set(['.git', 'node_modules', '__MACOSX', '.DS_Store', 'Thumbs.db']);

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/, '');
}

async function walk(dir, prefix, out) {
  for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, prefix + entry.name + '/', out);
    else if (entry.isFile()) out.push({ rel: prefix + entry.name, full });
  }
  return out;
}

async function main() {
  const [source, nameArg] = process.argv.slice(2);
  if (!source || source === '-h' || source === '--help') {
    console.log('Usage : node cli.js <dossier|archive.zip> [nom-du-projet]');
    process.exit(source ? 0 : 1);
  }
  const base = (process.env.QUAI_URL || 'http://localhost:8080').replace(/\/+$/, '');
  let token = process.env.QUAI_TOKEN;
  if (!token) {
    try {
      token = fs.readFileSync(path.join(__dirname, 'data', 'token'), 'utf8').trim();
    } catch {
      throw new Error('Jeton introuvable : définis la variable QUAI_TOKEN.');
    }
  }

  const absolute = path.resolve(source);
  const stat = await fsp.stat(absolute).catch(() => null);
  if (!stat) throw new Error(`Introuvable : ${source}`);
  const name = nameArg || slugify(path.basename(absolute).replace(/\.zip$/i, ''));
  if (!name) throw new Error('Impossible de deviner un nom de projet : passe-le en second argument.');

  async function call(route, options = {}) {
    const response = await fetch(`${base}/_quai/api/${route}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Erreur ${response.status}`);
    return data;
  }

  let result;
  if (stat.isFile()) {
    if (!/\.zip$/i.test(absolute)) throw new Error('Donne un dossier ou une archive .zip.');
    result = await call(`projects/${name}/zip`, {
      method: 'POST',
      body: await fsp.readFile(absolute),
      headers: { 'Content-Type': 'application/zip' },
    });
  } else {
    const files = await walk(absolute, '', []);
    if (!files.length) throw new Error('Ce dossier est vide.');
    const { id } = await call(`projects/${name}/deploys`, { method: 'POST' });
    const queue = files.slice();
    let done = 0;
    const worker = async () => {
      while (queue.length) {
        const file = queue.shift();
        await call(`deploys/${id}/files?path=${encodeURIComponent(file.rel)}`, {
          method: 'PUT',
          body: await fsp.readFile(file.full),
          headers: { 'Content-Type': 'application/octet-stream' },
        });
        done += 1;
        process.stdout.write(`\r  Envoi ${done}/${files.length}`);
      }
    };
    try {
      await Promise.all(Array.from({ length: 6 }, worker));
    } catch (err) {
      await call(`deploys/${id}`, { method: 'DELETE' }).catch(() => {});
      throw err;
    }
    process.stdout.write('\n');
    result = await call(`deploys/${id}/publish`, { method: 'POST' });
  }

  console.log(`  En ligne : ${result.project.url}`);
  if (result.project.warning) console.log(`  Attention : ${result.project.warning}`);
}

main().catch((err) => {
  console.error(`\n  Échec : ${err.message}`);
  process.exit(1);
});
