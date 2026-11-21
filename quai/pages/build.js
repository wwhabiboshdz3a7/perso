#!/usr/bin/env node
'use strict';
// Quai pour GitHub Pages : assemble tous les projets du dépôt en un seul site.
//
//   Sources  : chaque branche qui contient un site (sauf la branche principale),
//              et chaque dossier ou .zip déposé dans sites/ sur la branche principale.
//   Résultat : <sortie>/<projet>/…  +  une page d'accueil qui liste les liens.
//
//   node quai/pages/build.js --out _site     construit le site
//   node quai/pages/build.js --changed       indique si les sources ont changé depuis la mise en ligne
//
// Variables : GITHUB_REPOSITORY (proprietaire/depot), QUAI_MAIN_BRANCH (défaut : main),
//             QUAI_REF_PREFIX (défaut : refs/remotes/origin/), QUAI_BASE (préfixe d'URL).

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');

const { extractZip } = require('../lib/zip');
const { cleanRelPath } = require('../lib/store');
const { renderIndex, renderNotFound } = require('./template');

const MAX_ZIP_BYTES = 500 * 1024 * 1024;
const MAX_ZIP_FILES = 20000;
// Jamais publiés, quel que soit le projet.
const EXCLUDED = new Set(['.git', '.github', '.gitignore', 'node_modules', '__MACOSX', '.DS_Store', 'Thumbs.db']);
// Écartés seulement à la racine d'un projet : configuration et fonctions Netlify.
const EXCLUDED_AT_ROOT = new Set(['netlify', 'netlify.toml']);
const RESERVED = new Set(['index.html', '404.html', 'quai.json']);

const git = (args, options = {}) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], ...options });

function gitOrNull(args) {
  try {
    return git(args);
  } catch {
    return null;
  }
}

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/, '');
}

function context() {
  const repository =
    process.env.GITHUB_REPOSITORY ||
    (gitOrNull(['config', '--get', 'remote.origin.url']) || '')
      .trim()
      .replace(/\.git$/, '')
      .split(/[/:]/)
      .slice(-2)
      .join('/');
  const [owner = 'proprietaire', repo = 'depot'] = repository.split('/');
  const userSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  const base = (process.env.QUAI_BASE ?? (userSite ? '' : '/' + repo)).replace(/\/+$/, '');
  return {
    owner,
    repo,
    base,
    origin: `https://${owner.toLowerCase()}.github.io`,
    mainBranch: process.env.QUAI_MAIN_BRANCH || 'main',
    refPrefix: process.env.QUAI_REF_PREFIX || 'refs/remotes/origin/',
    root: git(['rev-parse', '--show-toplevel']).trim(),
  };
}

function listBranches(ctx) {
  const out = git(['for-each-ref', '--format=%(refname)%09%(objectname)%09%(committerdate:unix)', ctx.refPrefix]);
  const branches = [];
  for (const line of out.split('\n').filter(Boolean)) {
    const [ref, sha, date] = line.split('\t');
    const name = ref.slice(ctx.refPrefix.length);
    if (name === 'HEAD' || name === 'gh-pages') continue;
    branches.push({ name, ref, sha, date: Number(date) * 1000 });
  }
  return branches.sort((a, b) => a.name.localeCompare(b.name));
}

// Empreinte de tout ce qui influence le site : si elle n'a pas changé, inutile de republier.
function fingerprint(ctx) {
  const hash = crypto.createHash('sha256');
  for (const branch of listBranches(ctx)) hash.update(`${branch.name}\0${branch.sha}\n`);
  return hash.digest('hex').slice(0, 32);
}

// Lecture minimale de netlify.toml : dossier publié, chemins masqués, fonctions serveur.
function readNetlifyConfig(text) {
  const config = { publish: '', hidden: [], functions: false };
  if (!text) return config;
  let table = '';
  let redirect = null;
  const flush = () => {
    if (redirect && Number(redirect.status) === 404 && redirect.force === 'true' && redirect.from) {
      const target = redirect.from.replace(/\/\*$/, '').replace(/^\/+|\/+$/g, '');
      if (target && !target.includes('*') && !target.includes(':')) config.hidden.push(target);
    }
    redirect = null;
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const header = /^\[+\s*([^\]\s]+)\s*\]+$/.exec(line);
    if (header) {
      flush();
      table = header[1];
      if (table === 'redirects') redirect = {};
      if (table === 'functions' || table.startsWith('functions.')) config.functions = true;
      continue;
    }
    const pair = /^([A-Za-z0-9_-]+)\s*=\s*(.*)$/.exec(line);
    if (!pair) continue;
    const value = pair[2].replace(/\s+#.*$/, '').replace(/^["']|["']$/g, '');
    if (table === 'build' && pair[1] === 'publish') {
      config.publish = value.replace(/^\.?\/+/, '').replace(/\/+$/, '');
      if (config.publish === '.') config.publish = '';
    }
    if (table === 'build' && pair[1] === 'functions') config.functions = true;
    if (redirect) redirect[pair[1]] = value;
  }
  flush();
  return config;
}

// ---------- réécriture des chemins absolus ----------
// Sur GitHub Pages un projet vit sous /depot/projet/ : « /style.css » doit devenir
// « /depot/projet/style.css ». On ne touche qu'aux attributs HTML et aux url() CSS,
// jamais au JavaScript.

function rewriteCss(css, prefix) {
  return css
    .replace(/(url\(\s*["']?)\/(?!\/)/gi, `$1${prefix}/`)
    .replace(/(@import\s+["'])\/(?!\/)/gi, `$1${prefix}/`);
}

function rewriteTag(tag, prefix) {
  return tag
    .replace(/(\s(?:href|src|action|formaction|poster|data-src|data-href)\s*=\s*["'])\/(?!\/)/gi, `$1${prefix}/`)
    .replace(/(\ssrcset\s*=\s*)(["'])([^"']*)\2/gi, (_m, attr, quote, value) =>
      attr + quote + value.replace(/(^|,)(\s*)\/(?!\/)/g, `$1$2${prefix}/`) + quote
    )
    .replace(/(\sstyle\s*=\s*)(["'])([^"']*)\2/gi, (_m, attr, quote, value) =>
      attr + quote + rewriteCss(value, prefix) + quote
    );
}

function rewriteHtml(html, prefix) {
  const pattern = /(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)|(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)|<!--[\s\S]*?-->|<[a-zA-Z][^<>]*>/gi;
  return html.replace(pattern, (match, scriptOpen, scriptBody, scriptClose, styleOpen, styleBody, styleClose) => {
    if (scriptOpen !== undefined) return rewriteTag(scriptOpen, prefix) + scriptBody + scriptClose;
    if (styleOpen !== undefined) return styleOpen + rewriteCss(styleBody, prefix) + styleClose;
    if (match.startsWith('<!--')) return match;
    return rewriteTag(match, prefix);
  });
}

// ---------- préparation d'un dossier de projet ----------

async function walk(dir, visit, prefix = '') {
  for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = prefix + entry.name;
    if (entry.isSymbolicLink() || EXCLUDED.has(entry.name) || (!prefix && EXCLUDED_AT_ROOT.has(entry.name))) {
      await fsp.rm(full, { recursive: true, force: true });
    } else if (entry.isDirectory()) {
      await walk(full, visit, rel + '/');
    } else if (entry.isFile()) {
      await visit(full, rel);
    } else {
      await fsp.rm(full, { force: true });
    }
  }
}

// Nettoie le dossier, réécrit les chemins, et renvoie ce qu'on a appris sur le projet.
async function finalize(dir, prefix, hidden = []) {
  for (const target of hidden) {
    const segs = target.split('/');
    if (segs.some((s) => s === '..' || s === '.' || !s)) continue;
    await fsp.rm(path.join(dir, ...segs), { recursive: true, force: true });
  }
  const info = { files: 0, bytes: 0, rewritten: 0, forms: false, functionCalls: false };
  await walk(dir, async (file, rel) => {
    const ext = path.extname(rel).toLowerCase();
    if (ext === '.html' || ext === '.htm' || ext === '.css') {
      const before = await fsp.readFile(file, 'utf8');
      const after = ext === '.css' ? rewriteCss(before, prefix) : rewriteHtml(before, prefix);
      if (after !== before) {
        await fsp.writeFile(file, after);
        info.rewritten += 1;
      }
      if (ext !== '.css' && /\sdata-netlify\s*=|\snetlify-honeypot\s*=|<form\b[^>]*\snetlify[\s>]/i.test(before)) {
        info.forms = true;
      }
      if (before.includes('/.netlify/functions/')) info.functionCalls = true;
    } else if ((ext === '.js' || ext === '.mjs') && !info.functionCalls) {
      const stat = await fsp.stat(file);
      if (stat.size < 2 * 1024 * 1024 && (await fsp.readFile(file, 'utf8')).includes('/.netlify/functions/')) {
        info.functionCalls = true;
      }
    }
    info.files += 1;
    info.bytes += (await fsp.stat(file)).size;
  });
  return info;
}

const hasIndex = (dir) => fs.existsSync(path.join(dir, 'index.html'));

function notesFor(info, functions) {
  const notes = [];
  if (functions || info.functionCalls) {
    notes.push('Ce projet utilise des fonctions serveur Netlify : elles ne tournent pas ici.');
  }
  if (info.forms) notes.push('Les formulaires Netlify de ce projet ne sont pas traités ici.');
  return notes;
}

// ---------- sources ----------

async function buildBranch(ctx, branch, out, taken) {
  const config = readNetlifyConfig(gitOrNull(['show', `${branch.ref}:netlify.toml`]));
  const tree = config.publish ? `${branch.ref}:${config.publish}` : branch.ref;
  const indexPath = config.publish ? `${config.publish}/index.html` : 'index.html';
  if (gitOrNull(['cat-file', '-e', `${branch.ref}:${indexPath}`]) === null) {
    return { skipped: `branche ${branch.name} : pas de ${indexPath}` };
  }
  const slug = slugify(branch.name);
  if (!slug || RESERVED.has(slug) || taken.has(slug)) {
    return { skipped: `branche ${branch.name} : le nom « ${slug} » est déjà pris` };
  }
  const dest = path.join(out, slug);
  await fsp.mkdir(dest, { recursive: true });
  const piped = spawnSync('bash', ['-c', 'set -o pipefail; git archive --format=tar "$QUAI_TREE" | tar -x -C "$QUAI_DEST"'], {
    cwd: ctx.root,
    env: { ...process.env, QUAI_TREE: tree, QUAI_DEST: dest },
    encoding: 'utf8',
  });
  if (piped.status !== 0) {
    await fsp.rm(dest, { recursive: true, force: true });
    return { skipped: `branche ${branch.name} : extraction impossible (${(piped.stderr || '').trim().split('\n').pop()})` };
  }
  const info = await finalize(dest, `${ctx.base}/${slug}`, config.hidden);
  return {
    project: {
      slug,
      source: 'branche',
      label: `branche ${branch.name}`,
      updatedAt: branch.date,
      files: info.files,
      bytes: info.bytes,
      notes: notesFor(info, config.functions),
    },
  };
}

async function copyTree(src, dest) {
  await fsp.mkdir(dest, { recursive: true });
  for (const entry of await fsp.readdir(src, { withFileTypes: true })) {
    if (EXCLUDED.has(entry.name) || entry.isSymbolicLink()) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyTree(from, to);
    else if (entry.isFile()) await fsp.copyFile(from, to);
  }
}

// Un zip ou un dossier contient souvent un unique dossier racine : on le retire.
async function hoist(dir) {
  for (let i = 0; i < 8 && !hasIndex(dir); i++) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    if (entries.length !== 1 || !entries[0].isDirectory()) break;
    const inner = path.join(dir, entries[0].name);
    const temp = dir + '.hoist';
    await fsp.rename(inner, temp);
    await fsp.rm(dir, { recursive: true, force: true });
    await fsp.rename(temp, dir);
  }
}

function lastChange(ctx, relPath) {
  const stamp = gitOrNull(['-C', ctx.root, 'log', '-1', '--format=%ct', '--', relPath]);
  return stamp && stamp.trim() ? Number(stamp.trim()) * 1000 : Date.now();
}

async function buildDropped(ctx, out, taken) {
  const results = [];
  const sitesDir = path.join(ctx.root, 'sites');
  if (!fs.existsSync(sitesDir)) return results;
  const entries = (await fsp.readdir(sitesDir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const isZip = entry.isFile() && /\.zip$/i.test(entry.name);
    if (!isZip && !entry.isDirectory()) continue;
    const slug = slugify(isZip ? entry.name.replace(/\.zip$/i, '') : entry.name);
    const label = `sites/${entry.name}`;
    if (!slug || RESERVED.has(slug) || taken.has(slug)) {
      results.push({ skipped: `${label} : le nom « ${slug} » est déjà pris ou invalide` });
      continue;
    }
    const dest = path.join(out, slug);
    try {
      if (isZip) {
        await fsp.mkdir(dest, { recursive: true });
        await extractZip(path.join(sitesDir, entry.name), {
          maxBytes: MAX_ZIP_BYTES,
          maxFiles: MAX_ZIP_FILES,
          onEntry: async (name, content) => {
            const segs = cleanRelPath(name);
            if (segs.some((s) => EXCLUDED.has(s))) return;
            const file = path.join(dest, ...segs);
            await fsp.mkdir(path.dirname(file), { recursive: true });
            await fsp.writeFile(file, content);
          },
        });
      } else {
        await copyTree(path.join(sitesDir, entry.name), dest);
      }
      await hoist(dest);
      if (!hasIndex(dest)) throw new Error("pas d'index.html à la racine");
    } catch (err) {
      await fsp.rm(dest, { recursive: true, force: true });
      results.push({ skipped: `${label} : ${err.message}` });
      continue;
    }
    taken.add(slug);
    const info = await finalize(dest, `${ctx.base}/${slug}`);
    results.push({
      project: {
        slug,
        source: isZip ? 'zip' : 'dossier',
        label: isZip ? 'zip déposé' : 'dossier déposé',
        updatedAt: lastChange(ctx, `sites/${entry.name}`),
        files: info.files,
        bytes: info.bytes,
        notes: notesFor(info, false),
      },
    });
  }
  return results;
}

// ---------- commandes ----------

async function build(out) {
  const ctx = context();
  out = path.resolve(out);
  await fsp.rm(out, { recursive: true, force: true });
  await fsp.mkdir(out, { recursive: true });

  const projects = [];
  const skipped = [];
  const taken = new Set();
  const collect = (result) => {
    if (result.skipped) skipped.push(result.skipped);
    else {
      taken.add(result.project.slug);
      projects.push(result.project);
    }
  };

  // Les projets déposés dans sites/ passent en premier : en cas de même nom, ils l'emportent.
  for (const result of await buildDropped(ctx, out, taken)) collect(result);
  for (const branch of listBranches(ctx)) {
    if (branch.name === ctx.mainBranch) continue;
    collect(await buildBranch(ctx, branch, out, taken));
  }

  const siteUrl = `${ctx.origin}${ctx.base}/`;
  for (const project of projects) project.url = `${siteUrl}${project.slug}/`;
  projects.sort((a, b) => b.updatedAt - a.updatedAt);

  const manifest = {
    generatedAt: Date.now(),
    fingerprint: fingerprint(ctx),
    url: siteUrl,
    repository: `${ctx.owner}/${ctx.repo}`,
    projects,
    skipped,
  };
  const uploadUrl = `https://github.com/${ctx.owner}/${ctx.repo}/upload/${ctx.mainBranch}/sites`;
  await fsp.writeFile(path.join(out, 'quai.json'), JSON.stringify(manifest, null, 2));
  await fsp.writeFile(path.join(out, 'index.html'), renderIndex(manifest, { uploadUrl }));
  await fsp.writeFile(path.join(out, '404.html'), renderNotFound(manifest));

  for (const project of projects) {
    console.log(`  ${project.url}  (${project.label}, ${project.files} fichiers)`);
    for (const note of project.notes) console.log(`      remarque : ${note}`);
  }
  for (const reason of skipped) console.log(`  ignoré — ${reason}`);
  console.log(`\n${projects.length} projet(s) prêts dans ${out}`);
  return manifest;
}

async function changed() {
  const ctx = context();
  const current = fingerprint(ctx);
  let deployed = null;
  try {
    const response = await fetch(`${ctx.origin}${ctx.base}/quai.json?t=${Date.now()}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) deployed = (await response.json()).fingerprint;
  } catch {
    // site pas encore en ligne, ou réseau indisponible : on reconstruit
  }
  const result = deployed !== current;
  console.log(result ? 'Les sources ont changé : publication nécessaire.' : 'Rien de nouveau depuis la dernière publication.');
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${result}\n`);
}

module.exports = { build, readNetlifyConfig, rewriteHtml, rewriteCss, slugify };

if (require.main === module) {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf('--out');
  const out = outIndex !== -1 && args[outIndex + 1] ? args[outIndex + 1] : '_site';
  const run = args.includes('--changed') ? changed() : build(out);
  run.catch((err) => {
    console.error(`Échec : ${err.message}`);
    process.exit(1);
  });
}
