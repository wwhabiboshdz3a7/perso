'use strict';
// Import d'un site depuis un dépôt Git (clone superficiel d'une branche).

const { execFile } = require('node:child_process');
const { HttpError } = require('./store');

const BRANCH_RE = /^[A-Za-z0-9_][A-Za-z0-9_./-]{0,200}$/;

// Masque un éventuel jeton d'accès contenu dans l'URL (https://jeton@github.com/...).
const maskUrl = (text) => String(text).replace(/\/\/[^@/\s]+@/g, '//***@');

function normalizeGit(input, { allowFile = false } = {}) {
  const url = String((input && input.url) || '').trim();
  const branch = String((input && input.branch) || '').trim();
  const dir = String((input && input.dir) || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new HttpError(400, 'URL du dépôt invalide.');
  }
  const allowed = parsed.protocol === 'https:' || (allowFile && parsed.protocol === 'file:');
  if (!allowed) throw new HttpError(400, "L'URL du dépôt doit commencer par https://");
  if (branch && !BRANCH_RE.test(branch)) throw new HttpError(400, 'Nom de branche invalide.');
  if (dir && dir.split('/').some((s) => s === '..' || s === '.' || s === '')) {
    throw new HttpError(400, 'Dossier de publication invalide.');
  }
  return { url, branch, dir };
}

function clone(git, dest) {
  const args = ['clone', '--depth', '1', '--single-branch', '--no-tags'];
  if (git.branch) args.push('--branch', git.branch);
  args.push('--', git.url, dest);
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      args,
      { timeout: 120000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } },
      (err, _stdout, stderr) => {
        if (!err) return resolve();
        if (err.code === 'ENOENT') {
          return reject(new HttpError(500, "git n'est pas installé sur le serveur."));
        }
        const lines = maskUrl(stderr || '').trim().split('\n');
        reject(new HttpError(400, 'Clonage impossible : ' + (lines.pop() || 'erreur git')));
      }
    );
  });
}

module.exports = { normalizeGit, clone, maskUrl };
