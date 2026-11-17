'use strict';
// Stockage des projets : un dossier par projet, un sous-dossier par déploiement.
//
//   data/projects/<nom>/project.json
//   data/projects/<nom>/deploys/<id>/...fichiers du site
//   data/tmp/<id>/...                  (déploiement en cours d'envoi)

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { pipeline } = require('node:stream/promises');
const { Transform } = require('node:stream');

const NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED = new Set(['www']);
const IGNORED = new Set(['.git', 'node_modules', '__MACOSX', '.DS_Store', 'Thumbs.db']);
const STAGING_TTL_MS = 60 * 60 * 1000;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function assertName(name) {
  if (typeof name !== 'string' || !NAME_RE.test(name) || RESERVED.has(name)) {
    throw new HttpError(
      400,
      'Nom de projet invalide : lettres minuscules, chiffres et tirets uniquement (63 caractères max).'
    );
  }
}

// Transforme un chemin envoyé par le client en segments sûrs, relatifs au site.
function cleanRelPath(input) {
  const bad = () => new HttpError(400, 'Chemin de fichier invalide.');
  // eslint-disable-next-line no-control-regex
  if (typeof input !== 'string' || !input || input.length > 1024 || /[\x00-\x1f]/.test(input)) {
    throw bad();
  }
  const segs = input
    .replace(/\\/g, '/')
    .split('/')
    .filter((s) => s !== '' && s !== '.');
  if (!segs.length || segs.length > 32) throw bad();
  for (const s of segs) {
    if (s === '..' || s.length > 255) throw bad();
  }
  return segs;
}

const isIgnored = (segs) => segs.some((s) => IGNORED.has(s));

function newId() {
  return Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
}

// Coupe le flux dès que accept(n) refuse les n octets suivants.
function byteLimiter(accept) {
  return new Transform({
    transform(chunk, _enc, cb) {
      if (!accept(chunk.length)) return cb(new HttpError(413, 'Envoi trop volumineux.'));
      cb(null, chunk);
    },
  });
}

async function walkStats(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walkStats(full);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += (await fsp.stat(full)).size;
    }
  }
  return { files, bytes };
}

// Un fichier _redirects « /*  /index.html  200 » (convention Netlify) active le mode SPA.
async function detectSpa(root) {
  try {
    const st = await fsp.stat(path.join(root, '_redirects'));
    if (!st.isFile() || st.size > 64 * 1024) return false;
    const text = await fsp.readFile(path.join(root, '_redirects'), 'utf8');
    return /^\s*\/\*\s+\/index\.html\s+200\b/m.test(text);
  } catch {
    return false;
  }
}

class Store {
  constructor(dataDir, { keepDeploys = 5, maxDeployBytes = 200 * 1024 * 1024, maxFiles = 20000 } = {}) {
    this.dataDir = path.resolve(dataDir);
    this.projectsDir = path.join(this.dataDir, 'projects');
    this.tmpDir = path.join(this.dataDir, 'tmp');
    this.keepDeploys = Math.max(1, keepDeploys);
    this.maxDeployBytes = maxDeployBytes;
    this.maxFiles = maxFiles;
    this.projects = new Map();
    this.stagings = new Map();
    this.lock = Promise.resolve();
  }

  async init() {
    await fsp.mkdir(this.projectsDir, { recursive: true });
    await fsp.rm(this.tmpDir, { recursive: true, force: true });
    await fsp.mkdir(this.tmpDir, { recursive: true });
    for (const name of await fsp.readdir(this.projectsDir)) {
      try {
        const file = path.join(this.projectsDir, name, 'project.json');
        const project = JSON.parse(await fsp.readFile(file, 'utf8'));
        if (project.name === name && NAME_RE.test(name)) this.projects.set(name, project);
      } catch {
        // dossier incomplet : ignoré
      }
    }
  }

  // Sérialise les opérations qui modifient un project.json.
  exclusive(fn) {
    const run = this.lock.then(fn);
    this.lock = run.catch(() => {});
    return run;
  }

  list() {
    return [...this.projects.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(name) {
    return this.projects.get(name) || null;
  }

  // Dossier du déploiement en ligne pour un projet, ou null.
  siteRoot(name) {
    const project = this.projects.get(name);
    if (!project || !project.current) return null;
    const deploy = project.deploys.find((d) => d.id === project.current);
    if (!deploy) return null;
    return { dir: path.join(this.projectsDir, name, 'deploys', deploy.id), deploy };
  }

  async createStaging(name) {
    assertName(name);
    if (this.stagings.size >= 50) throw new HttpError(429, 'Trop de déploiements en cours.');
    const id = newId();
    const dir = path.join(this.tmpDir, id);
    await fsp.mkdir(dir);
    this.stagings.set(id, { id, name, dir, bytes: 0, files: 0, createdAt: Date.now() });
    return id;
  }

  staging(id) {
    const staging = this.stagings.get(id);
    if (!staging) throw new HttpError(404, 'Déploiement introuvable ou expiré.');
    return staging;
  }

  // Chemin de destination dans le déploiement en cours, ou null si le fichier est ignoré.
  async destFor(staging, relPath) {
    const segs = cleanRelPath(relPath);
    if (isIgnored(segs)) return null;
    if (staging.files >= this.maxFiles) throw new HttpError(413, 'Trop de fichiers dans ce projet.');
    const dest = path.join(staging.dir, ...segs);
    if (!path.resolve(dest).startsWith(staging.dir + path.sep)) {
      throw new HttpError(400, 'Chemin de fichier invalide.');
    }
    try {
      await fsp.mkdir(path.dirname(dest), { recursive: true });
    } catch {
      throw new HttpError(400, 'Chemin de fichier invalide.');
    }
    return dest;
  }

  async writeStream(id, relPath, readable) {
    const staging = this.staging(id);
    const dest = await this.destFor(staging, relPath);
    if (!dest) {
      readable.resume();
      return false;
    }
    // Le compteur avance au fil de l'eau pour que les envois simultanés partagent le même plafond.
    const limiter = byteLimiter((n) => {
      staging.bytes += n;
      return staging.bytes <= this.maxDeployBytes;
    });
    try {
      await pipeline(readable, limiter, fs.createWriteStream(dest));
    } catch (err) {
      await fsp.rm(dest, { force: true }).catch(() => {});
      throw err.status ? err : new HttpError(400, "L'envoi du fichier a échoué.");
    }
    staging.files += 1;
    return true;
  }

  async writeBuffer(id, relPath, buffer) {
    const staging = this.staging(id);
    if (staging.bytes + buffer.length > this.maxDeployBytes) {
      throw new HttpError(413, 'Projet trop volumineux.');
    }
    const dest = await this.destFor(staging, relPath);
    if (!dest) return false;
    try {
      await fsp.writeFile(dest, buffer);
    } catch {
      throw new HttpError(400, 'Chemin de fichier invalide.');
    }
    staging.bytes += buffer.length;
    staging.files += 1;
    return true;
  }

  // Copie un dossier local (clone git) dans le déploiement en cours, sans liens symboliques.
  async importDir(id, srcDir, prefix = '') {
    for (const entry of await fsp.readdir(srcDir, { withFileTypes: true })) {
      if (IGNORED.has(entry.name)) continue;
      const src = path.join(srcDir, entry.name);
      const rel = prefix + entry.name;
      if (entry.isDirectory()) {
        await this.importDir(id, src, rel + '/');
      } else if (entry.isFile()) {
        const staging = this.staging(id);
        const size = (await fsp.stat(src)).size;
        if (staging.bytes + size > this.maxDeployBytes) {
          throw new HttpError(413, 'Projet trop volumineux.');
        }
        const dest = await this.destFor(staging, rel);
        if (!dest) continue;
        await fsp.copyFile(src, dest);
        staging.bytes += size;
        staging.files += 1;
      }
    }
  }

  async discard(id) {
    const staging = this.stagings.get(id);
    if (!staging) return;
    this.stagings.delete(id);
    await fsp.rm(staging.dir, { recursive: true, force: true }).catch(() => {});
  }

  async sweepStagings(now = Date.now()) {
    for (const staging of [...this.stagings.values()]) {
      if (now - staging.createdAt > STAGING_TTL_MS) await this.discard(staging.id);
    }
  }

  publish(id, meta = {}) {
    return this.exclusive(async () => {
      const staging = this.staging(id);
      this.stagings.delete(id);
      try {
        // Un zip ou un dossier contient souvent un unique dossier racine : on le retire.
        let root = staging.dir;
        for (let i = 0; i < 8; i++) {
          const entries = await fsp.readdir(root, { withFileTypes: true });
          if (entries.length !== 1 || !entries[0].isDirectory()) break;
          root = path.join(root, entries[0].name);
        }
        const stats = await walkStats(root);
        if (!stats.files) throw new HttpError(400, 'Aucun fichier à publier.');

        const hasIndex = await fsp
          .stat(path.join(root, 'index.html'))
          .then((st) => st.isFile())
          .catch(() => false);
        const spa = await detectSpa(root);

        const now = Date.now();
        const projectDir = path.join(this.projectsDir, staging.name);
        await fsp.mkdir(path.join(projectDir, 'deploys'), { recursive: true });
        await fsp.rename(root, path.join(projectDir, 'deploys', staging.id));

        const existing = this.projects.get(staging.name);
        const project = existing
          ? structuredClone(existing)
          : {
              name: staging.name,
              createdAt: now,
              deploys: [],
              git: null,
              hookSecret: crypto.randomBytes(18).toString('base64url'),
            };
        const deploy = {
          id: staging.id,
          createdAt: now,
          files: stats.files,
          bytes: stats.bytes,
          source: meta.source || 'upload',
          hasIndex,
          spa,
        };
        project.deploys.unshift(deploy);
        project.current = deploy.id;
        project.updatedAt = now;
        if (meta.git) project.git = meta.git;

        const kept = [];
        const dropped = [];
        for (const d of project.deploys) {
          (kept.length < this.keepDeploys || d.id === project.current ? kept : dropped).push(d);
        }
        project.deploys = kept;

        await this.save(project);
        this.projects.set(project.name, project);
        for (const d of dropped) {
          await fsp
            .rm(path.join(projectDir, 'deploys', d.id), { recursive: true, force: true })
            .catch(() => {});
        }
        return { project, deploy };
      } finally {
        await fsp.rm(staging.dir, { recursive: true, force: true }).catch(() => {});
      }
    });
  }

  rollback(name, deployId) {
    return this.exclusive(async () => {
      const existing = this.projects.get(name);
      if (!existing) throw new HttpError(404, 'Projet introuvable.');
      if (!existing.deploys.some((d) => d.id === deployId)) {
        throw new HttpError(404, 'Version introuvable.');
      }
      const project = structuredClone(existing);
      project.current = deployId;
      project.updatedAt = Date.now();
      await this.save(project);
      this.projects.set(name, project);
      return project;
    });
  }

  remove(name) {
    return this.exclusive(async () => {
      if (!this.projects.has(name)) throw new HttpError(404, 'Projet introuvable.');
      this.projects.delete(name);
      await fsp.rm(path.join(this.projectsDir, name), { recursive: true, force: true });
    });
  }

  async save(project) {
    const file = path.join(this.projectsDir, project.name, 'project.json');
    await fsp.writeFile(file + '.tmp', JSON.stringify(project, null, 2));
    await fsp.rename(file + '.tmp', file);
  }
}

module.exports = { Store, HttpError, NAME_RE, IGNORED, assertName, byteLimiter };
