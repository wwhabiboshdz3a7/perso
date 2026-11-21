'use strict';
// Quai pour Mac — publie un site statique sur GitHub Pages depuis une page locale.
// Aucune dépendance : `node server.js` suffit. Le serveur n'écoute que sur 127.0.0.1.
//
// Variables : QUAI_MAC_PORT (défaut 4747), QUAI_GITHUB_API, QUAI_PAGES_ORIGIN (faux GitHub pour
//             les tests), QUAI_MAC_CONFIG_DIR (défaut ~/.quai).

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const { pipeline } = require('node:stream/promises');

const { HttpError, IGNORED, byteLimiter, cleanRelPath } = require('../lib/store');
const { extractZip } = require('../lib/zip');
const { createGitHub, slugify, WORKFLOW_PATH } = require('./github');
const { createSecrets } = require('./secrets');

const MB = 1024 * 1024;
const HOST = '127.0.0.1';
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const TOKEN_RE = /^[A-Za-z0-9_][A-Za-z0-9_.~+/=-]{7,511}$/;
const RESERVED = new Set(['main', 'gh-pages']);
const UPLOAD_TTL_MS = 60 * 60 * 1000;
const TOKENS_URL = 'https://github.com/settings/tokens';

// Jamais envoyés. « .github » en plus de la liste commune : un site déposé ne doit pas pouvoir
// installer de workflow (du code exécuté par GitHub) dans le dépôt.
const isIgnored = (segs) => segs.some((s) => IGNORED.has(s) || s === '.github' || s.toLowerCase() === '.git');

function assertRepo(repo) {
  const ok = typeof repo === 'string' && repo.length <= 140 && REPO_RE.test(repo);
  if (!ok || repo.split('/').some((part) => part === '.' || part === '..')) {
    throw new HttpError(400, 'Nom de dépôt invalide : il doit ressembler à « proprietaire/depot ».');
  }
}

function assertProjectName(name, defaultBranch) {
  if (typeof name !== 'string' || !NAME_RE.test(name)) {
    throw new HttpError(
      400,
      'Nom de projet invalide : lettres minuscules, chiffres et tirets uniquement (63 caractères max).'
    );
  }
  if (RESERVED.has(name) || name === defaultBranch || name === slugify(defaultBranch || '')) {
    throw new HttpError(400, `Le nom « ${name} » est réservé : choisis-en un autre.`);
  }
}

// Un zip ou un dossier contient souvent un unique dossier racine : on le retire.
function stripCommonRoot(paths) {
  let list = paths.map((segs) => segs.slice());
  for (let i = 0; i < 8 && list.length; i++) {
    const first = list[0][0];
    if (!list.every((segs) => segs.length > 1 && segs[0] === first)) break;
    list = list.map((segs) => segs.slice(1));
  }
  return list;
}

function createApp(options = {}) {
  const env = options.env || {};
  const limits = { totalBytes: 300 * MB, fileBytes: 95 * MB, files: 20000, ...(options.limits || {}) };
  const config = {
    port: Number(options.port ?? env.QUAI_MAC_PORT ?? 4747),
    configDir: path.resolve(options.configDir ?? env.QUAI_MAC_CONFIG_DIR ?? path.join(os.homedir(), '.quai')),
    tokenStore: options.tokenStore ?? (process.platform === 'darwin' ? 'keychain' : 'file'),
    defaultRepo: options.defaultRepo ?? 'wwhabiboshdz3a7/perso',
    gh: options.gh, // chemin de la commande gh ; false pour ne pas la chercher
  };

  let stopped = false;
  const baseSleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms).unref()));
  const sleep = (ms) => (stopped ? Promise.reject(new HttpError(503, "Quai s'arrête.")) : baseSleep(ms));

  const github = createGitHub({
    apiBase: options.apiBase ?? env.QUAI_GITHUB_API,
    pagesOrigin: options.pagesOrigin ?? env.QUAI_PAGES_ORIGIN,
    timing: options.timing,
    sleep,
  });
  const secrets = createSecrets({ kind: config.tokenStore, configDir: config.configDir });
  const page = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));

  let port = 0; // port réellement écouté
  let tmpRoot = '';
  let session = null; // { token, repo, login, defaultBranch, workflow, pages, client }
  let activeJob = null;
  const jobs = new Map();
  const uploads = new Map();
  const newId = () => crypto.randomBytes(9).toString('base64url');

  // ---------- utilitaires HTTP ----------

  function sendJson(res, status, data, headers = {}) {
    const body = Buffer.from(JSON.stringify(data));
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    });
    res.end(body);
  }

  async function readJson(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 64 * 1024) throw new HttpError(413, 'Requête trop volumineuse.');
      chunks.push(chunk);
    }
    if (!size) return {};
    try {
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      return data && typeof data === 'object' ? data : {};
    } catch {
      throw new HttpError(400, 'JSON invalide.');
    }
  }

  // Écrit le corps de la requête dans un fichier, sans dépasser ce que accept(n) autorise.
  async function receive(req, dest, accept) {
    try {
      await pipeline(req, byteLimiter(accept), fs.createWriteStream(dest, { mode: 0o600 }));
    } catch (err) {
      await fsp.rm(dest, { force: true }).catch(() => {});
      throw err instanceof HttpError ? err : new HttpError(400, "L'envoi du fichier a échoué.");
    }
  }

  // ---------- garde-fous ----------

  // Anti « DNS rebinding » : un site malveillant peut faire pointer son propre nom de domaine
  // vers 127.0.0.1, mais l'en-tête Host porte alors ce nom-là.
  function assertHost(req) {
    const host = String(req.headers.host || '').toLowerCase();
    if (host !== `localhost:${port}` && host !== `${HOST}:${port}`) throw new HttpError(403, 'Hôte refusé.');
  }

  // L'API n'est utilisable que par la page de Quai : un autre site ne peut ni ajouter l'en-tête
  // X-Quai (aucun en-tête CORS n'est jamais envoyé), ni se présenter avec notre origine.
  function assertApiCaller(req) {
    if (req.headers['x-quai'] !== '1') throw new HttpError(403, 'Requête refusée (en-tête X-Quai manquant).');
    const origin = req.headers.origin;
    if (origin !== undefined && origin !== `http://${String(req.headers.host).toLowerCase()}`) {
      throw new HttpError(403, 'Origine de la requête refusée.');
    }
    const site = req.headers['sec-fetch-site'];
    if (site !== undefined && site !== 'same-origin' && site !== 'none') {
      throw new HttpError(403, 'Origine de la requête refusée.');
    }
  }

  // ---------- connexion à GitHub ----------

  function findGh() {
    if (config.gh === false) return null;
    if (typeof config.gh === 'string') return config.gh;
    const dirs = String(process.env.PATH || '').split(path.delimiter).filter(Boolean);
    dirs.push('/opt/homebrew/bin', '/usr/local/bin');
    for (const dir of dirs) {
      const candidate = path.join(dir, 'gh');
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch {
        // pas ici
      }
    }
    return null;
  }

  // Jeton de la commande gh (connexion GitHub existante), ou null.
  function ghToken() {
    const bin = findGh();
    if (!bin) return Promise.resolve(null);
    return new Promise((resolve) => {
      execFile(bin, ['auth', 'token'], { timeout: 8000, maxBuffer: 64 * 1024, windowsHide: true }, (err, stdout) => {
        const token = err ? '' : String(stdout || '').trim();
        resolve(TOKEN_RE.test(token) ? token : null);
      });
    });
  }

  let ghCheck = { at: 0, available: false };
  async function ghAvailable() {
    if (Date.now() - ghCheck.at > 30000) ghCheck = { at: Date.now(), available: Boolean(await ghToken()) };
    return ghCheck.available;
  }

  function openSession(token, info) {
    session = {
      token,
      repo: info.fullName,
      login: info.login,
      defaultBranch: info.defaultBranch,
      workflow: info.workflow,
      pages: info.pages,
      client: info.client,
    };
    return session;
  }

  // Session à partir du jeton enregistré, ou null. `fresh` revérifie tout auprès de GitHub.
  async function loadSession({ fresh = false } = {}) {
    if (session && !fresh) return session;
    const [token, repo] = await Promise.all([secrets.getToken(), secrets.getRepo()]);
    if (!token || !TOKEN_RE.test(token) || !repo || !REPO_RE.test(repo)) {
      session = null;
      return null;
    }
    try {
      return openSession(token, await github.inspect(token, repo));
    } catch (err) {
      session = null;
      throw err;
    }
  }

  async function requireSession(opts) {
    const current = await loadSession(opts);
    if (!current) throw new HttpError(401, 'Connexion à GitHub requise : ouvre les réglages.');
    return current;
  }

  function assertReady(current) {
    if (current.workflow === false) {
      throw new HttpError(
        409,
        `Publication impossible : le fichier ${WORKFLOW_PATH} est absent de la branche ${current.defaultBranch} du dépôt.`
      );
    }
    if (current.pages === 'absent' || current.pages === 'legacy') {
      throw new HttpError(409, "GitHub Pages n'est pas encore activé pour ce dépôt : clique sur « Activer GitHub Pages ».");
    }
  }

  async function stateView() {
    const running = activeJob && activeJob.state === 'running' ? activeJob.id : null;
    const view = {
      connected: false,
      repo: (await secrets.getRepo()) || config.defaultRepo,
      ghAvailable: await ghAvailable(),
      storage: secrets.kind === 'keychain' ? 'trousseau' : 'fichier',
      tokensUrl: TOKENS_URL,
      limits: { totalBytes: limits.totalBytes, fileBytes: limits.fileBytes, files: limits.files },
      activeJob: running,
      problem: null,
    };
    let current;
    try {
      // Pendant une publication, on garde la session en cours plutôt que de tout revérifier.
      current = await loadSession({ fresh: !running });
    } catch (err) {
      if (!(err instanceof HttpError)) throw err;
      view.problem = err.message;
      return view;
    }
    if (!current) return view;
    return {
      ...view,
      connected: true,
      login: current.login,
      repo: current.repo,
      repoUrl: current.client.webUrl,
      defaultBranch: current.defaultBranch,
      siteUrl: current.client.siteBase + '/',
      checks: {
        workflow: current.workflow,
        workflowPath: WORKFLOW_PATH,
        pages: current.pages,
        pagesSettingsUrl: current.client.pagesSettingsUrl,
      },
    };
  }

  async function connect(body) {
    const repo = String(body.repo || '').trim();
    assertRepo(repo);
    let token;
    if (body.useGh === true) {
      token = await ghToken();
      if (!token) {
        throw new HttpError(400, "La commande gh n'est pas connectée à GitHub. Colle plutôt un jeton d'accès.");
      }
    } else {
      token = typeof body.token === 'string' ? body.token.trim() : '';
      if (!TOKEN_RE.test(token)) {
        throw new HttpError(400, "Ce jeton n'a pas la forme d'un jeton GitHub. Copie-le en entier, sans espace.");
      }
    }
    const info = await github.inspect(token, repo);
    if (!info.canPush) {
      throw new HttpError(403, `Ce jeton ne permet pas d'écrire dans le dépôt « ${info.fullName} ».`);
    }
    await secrets.setToken(token);
    await secrets.setRepo(info.fullName);
    openSession(token, info);
  }

  // ---------- projets ----------

  async function listProjects(current) {
    const repo = current.client;
    const [manifest, branches] = await Promise.all([repo.manifest(), repo.branches()]);
    const branchBySlug = new Map();
    for (const name of branches) {
      if (name === current.defaultBranch || name === 'gh-pages') continue;
      const slug = slugify(name);
      if (slug && !branchBySlug.has(slug)) branchBySlug.set(slug, name);
    }
    const manageable = (slug) => branchBySlug.get(slug) === slug && NAME_RE.test(slug) && !RESERVED.has(slug);
    const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
    const count = (value) => (Number.isFinite(value) && value >= 0 ? value : null);

    const projects = [];
    const listed = new Set();
    for (const entry of manifest ? manifest.projects : []) {
      if (!entry || typeof entry.slug !== 'string' || slugify(entry.slug) !== entry.slug) continue;
      const fromBranch = entry.source === 'branche';
      // Branche supprimée : le projet disparaîtra du site à la prochaine publication.
      if (fromBranch && !branchBySlug.has(entry.slug)) continue;
      listed.add(entry.slug);
      projects.push({
        name: entry.slug,
        url: repo.siteUrl(entry.slug),
        online: true,
        managed: fromBranch && manageable(entry.slug),
        origin: text(entry.label, 80),
        updatedAt: count(entry.updatedAt),
        files: count(entry.files),
        bytes: count(entry.bytes),
        notes: (Array.isArray(entry.notes) ? entry.notes : []).map((note) => text(note, 300)).filter(Boolean).slice(0, 5),
      });
    }
    // Branches que le site ne connaît pas encore : publication en cours. Celles que la dernière
    // publication a écartées (pas d'index.html) ne sont pas des sites : elles ne sont pas listées.
    const skipped = manifest && Array.isArray(manifest.skipped) ? manifest.skipped.filter((s) => typeof s === 'string') : [];
    for (const [slug, branch] of branchBySlug) {
      if (listed.has(slug) || !manageable(slug)) continue;
      if (skipped.some((line) => line.startsWith(`branche ${branch} : `))) continue;
      projects.push({
        name: slug, url: repo.siteUrl(slug), online: false, managed: true,
        origin: '', updatedAt: null, files: null, bytes: null, notes: [],
      });
    }
    projects.sort((a, b) => Number(a.online) - Number(b.online) || (b.updatedAt || 0) - (a.updatedAt || 0));
    return {
      projects,
      // Noms déjà pris par une branche : publier sous l'un d'eux crée une nouvelle version.
      branches: [...branchBySlug.values()].filter((name) => NAME_RE.test(name)),
      siteUrl: repo.siteBase + '/',
    };
  }

  async function removeProject(name) {
    const current = await requireSession();
    assertProjectName(name, current.defaultBranch);
    if (activeJob && activeJob.state === 'running' && activeJob.name === name) {
      throw new HttpError(409, 'Ce projet est en cours de publication : attends la fin avant de le supprimer.');
    }
    const repo = current.client;
    if (!(await repo.head(name))) throw new HttpError(404, 'Projet introuvable.');
    await repo.deleteBranch(name);
    // Le site est reconstruit sans ce projet. Si le lancement échoue, la vérification
    // périodique du workflow (toutes les dix minutes) s'en chargera.
    let republishing = true;
    try {
      await repo.dispatch(current.defaultBranch);
    } catch (err) {
      if (!(err instanceof HttpError)) throw err;
      republishing = false;
    }
    return { ok: true, republishing };
  }

  async function enablePages() {
    const current = await requireSession();
    const repo = current.client;
    try {
      await repo.enablePages();
    } catch (err) {
      if (!(err instanceof HttpError) || err.upstream === 401) throw err;
      // À défaut de droits : la page de réglage où le faire à la main.
      const refused = new HttpError(err.status, err.message);
      refused.details = {
        settingsUrl: repo.pagesSettingsUrl,
        hint: 'Ouvre Settings → Pages et choisis « Source : GitHub Actions ».',
      };
      throw refused;
    }
    current.pages = 'active';
    // Publie tout de suite les projets déjà présents dans le dépôt.
    await repo.dispatch(current.defaultBranch).catch(() => {});
  }

  // ---------- dépôt d'un projet (zip, ou fichiers d'un dossier un par un) ----------

  async function sweepUploads() {
    for (const upload of [...uploads.values()]) {
      if (Date.now() - upload.createdAt > UPLOAD_TTL_MS) await discardUpload(upload);
    }
  }

  async function discardUpload(upload) {
    uploads.delete(upload.id);
    await fsp.rm(upload.dir, { recursive: true, force: true }).catch(() => {});
  }

  async function createUpload(name) {
    const current = await requireSession({ fresh: !(activeJob && activeJob.state === 'running') });
    assertProjectName(name, current.defaultBranch);
    assertReady(current);
    await sweepUploads();
    if (uploads.size >= 5) throw new HttpError(429, 'Trop de dépôts en attente. Recharge la page, puis réessaie.');
    const id = newId();
    const dir = path.join(tmpRoot, id);
    await fsp.mkdir(dir, { mode: 0o700 });
    uploads.set(id, { id, name, dir, files: new Map(), zip: null, bytes: 0, serial: 0, createdAt: Date.now() });
    return id;
  }

  function getUpload(id) {
    const upload = uploads.get(id);
    if (!upload) throw new HttpError(404, 'Dépôt introuvable ou expiré. Recommence.');
    return upload;
  }

  const fileTooBig = (name) =>
    new HttpError(413, `Le fichier « ${name} » dépasse ${Math.round(limits.fileBytes / MB)} Mo, la taille maximale d'un fichier sur GitHub.`);
  const siteTooBig = () =>
    new HttpError(413, `Projet trop volumineux : la limite est de ${Math.round(limits.totalBytes / MB)} Mo.`);
  const tooManyFiles = () =>
    new HttpError(413, `Trop de fichiers dans ce projet : la limite est de ${limits.files.toLocaleString('fr-FR')}.`);

  async function addUploadFile(upload, relPath, req) {
    const segs = cleanRelPath(relPath);
    const rel = segs.join('/');
    if (upload.zip) throw new HttpError(400, 'Ce dépôt contient déjà une archive.');
    if (isIgnored(segs)) {
      req.resume();
      return false;
    }
    const length = Number(req.headers['content-length']);
    if (Number.isFinite(length) && length > limits.fileBytes) throw fileTooBig(rel);
    if (Number.isFinite(length) && upload.bytes + length > limits.totalBytes) throw siteTooBig();
    if (!upload.files.has(rel) && upload.files.size >= limits.files) throw tooManyFiles();

    const file = path.join(upload.dir, 'f' + upload.serial++);
    let size = 0;
    try {
      await receive(req, file, (n) => {
        size += n;
        upload.bytes += n;
        return size <= limits.fileBytes && upload.bytes <= limits.totalBytes;
      });
    } catch (err) {
      upload.bytes -= size;
      if (err.status === 413) throw size > limits.fileBytes ? fileTooBig(rel) : siteTooBig();
      throw err;
    }
    const previous = upload.files.get(rel);
    if (previous) upload.bytes -= previous.size;
    upload.files.set(rel, { file, size });
    return true;
  }

  async function addUploadZip(upload, req) {
    if (upload.files.size || upload.zip) throw new HttpError(400, 'Ce dépôt contient déjà des fichiers.');
    const tooBig = () =>
      new HttpError(413, `Archive trop volumineuse : la limite est de ${Math.round(limits.totalBytes / MB)} Mo.`);
    const length = Number(req.headers['content-length']);
    if (Number.isFinite(length) && length > limits.totalBytes) throw tooBig();
    const file = path.join(upload.dir, 'archive.zip');
    let size = 0;
    try {
      await receive(req, file, (n) => (size += n) <= limits.totalBytes);
    } catch (err) {
      throw err.status === 413 ? tooBig() : err;
    }
    upload.zip = file;
  }

  // Étape « lecture » : la liste finale des fichiers à envoyer.
  async function collect(upload) {
    let entries = upload.files;
    let ignored = 0;
    if (upload.zip) {
      entries = new Map();
      let bytes = 0;
      let serial = 0;
      await extractZip(upload.zip, {
        // Garde-fous contre les archives piégées ; les vraies limites sont appliquées
        // ci-dessous, sur les seuls fichiers gardés.
        maxBytes: limits.totalBytes * 2,
        maxFiles: 0xffff,
        onEntry: async (entryName, content) => {
          let segs;
          try {
            segs = cleanRelPath(entryName);
          } catch {
            const shown = String(entryName).replace(/[^\x20-\x7e -￿]/g, '?').slice(0, 80);
            throw new HttpError(400, `Archive refusée : elle contient un chemin de fichier invalide (« ${shown} »).`);
          }
          if (isIgnored(segs)) {
            ignored += 1;
            return;
          }
          const rel = segs.join('/');
          if (content.length > limits.fileBytes) throw fileTooBig(rel);
          const previous = entries.get(rel);
          bytes += content.length - (previous ? previous.size : 0);
          if (bytes > limits.totalBytes) throw siteTooBig();
          if (!previous && entries.size >= limits.files) throw tooManyFiles();
          const file = path.join(upload.dir, 'z' + serial++);
          await fsp.writeFile(file, content, { mode: 0o600 });
          entries.set(rel, { file, size: content.length });
        },
      });
      await fsp.rm(upload.zip, { force: true }).catch(() => {});
    }
    if (!entries.size) throw new HttpError(400, 'Aucun fichier à publier dans ce projet.');

    const stored = [...entries.values()];
    const paths = stripCommonRoot([...entries.keys()].map((rel) => rel.split('/')));
    const files = new Map();
    paths.forEach((segs, index) => {
      const { file, size } = stored[index];
      files.set(segs.join('/'), { path: segs.join('/'), size, read: () => fsp.readFile(file) });
    });
    // Git ne sait pas ranger « a » et « a/b » dans le même projet.
    for (const rel of files.keys()) {
      const segs = rel.split('/');
      for (let depth = 1; depth < segs.length; depth++) {
        if (files.has(segs.slice(0, depth).join('/'))) {
          throw new HttpError(400, `Le projet contient à la fois un fichier et un dossier nommés « ${segs.slice(0, depth).join('/')} ».`);
        }
      }
    }
    const list = [...files.values()];
    return {
      files: list,
      bytes: list.reduce((sum, file) => sum + file.size, 0),
      ignored,
      hasIndex: files.has('index.html'),
    };
  }

  // ---------- publication ----------

  function jobView(job) {
    return {
      id: job.id,
      name: job.name,
      state: job.state, // 'running' | 'done' | 'error'
      step: job.step, // 'read' | 'upload' | 'publish' | 'online'
      files: job.files,
      bytes: job.bytes,
      ignored: job.ignored,
      sent: job.sent,
      reused: job.reused,
      newVersion: job.newVersion,
      warnings: job.warnings,
      note: job.note,
      run: job.run,
      url: job.url,
      error: job.error,
    };
  }

  async function runJob(job, upload, current) {
    const repo = current.client;
    try {
      const site = await collect(upload);
      job.files = site.files.length;
      job.bytes = site.bytes;
      job.ignored = site.ignored;
      if (!site.hasIndex) {
        job.warnings.push("Pas de fichier index.html à la racine du projet : sans lui, GitHub ne le mettra pas en ligne.");
      }
      // Un projet déposé dans sites/ (branche principale) garde la priorité sur une branche du même nom.
      const manifest = await repo.manifest();
      const twin = manifest && manifest.projects.find((p) => p && p.slug === job.name && p.source !== 'branche');
      if (twin) {
        throw new HttpError(409, `Le nom « ${job.name} » est déjà pris par un projet déposé dans le dossier sites/ du dépôt. Choisis un autre nom.`);
      }

      job.step = 'upload';
      const pushed = await github.pushSite(repo, {
        branch: job.name,
        files: site.files,
        message: `Publication de ${job.name} via Quai`,
        onProgress: ({ existed, done, reused }) => {
          job.newVersion = existed;
          job.sent = done;
          job.reused = reused;
          job.note = '';
        },
        onWait: (ms) => {
          job.note = `GitHub demande une pause : l'envoi reprend dans ${Math.max(1, Math.round(ms / 1000))} s.`;
        },
      });
      job.note = '';

      job.step = 'publish';
      const before = await github.triggerPublication(repo, current.defaultBranch);
      const run = await github.followRun(repo, current.defaultBranch, before, {
        onStatus: (status) => {
          job.run = status;
        },
      });

      job.step = 'online';
      await github.waitOnline(repo, {
        slug: job.name,
        branch: job.name,
        since: pushed.date,
        built: run.conclusion === 'success',
      });
      job.state = 'done';
    } catch (err) {
      const known = err instanceof HttpError;
      if (!known) console.error('[quai-mac]', err);
      if (known && err.upstream === 401) session = null;
      job.error = {
        step: job.step,
        message: known ? err.message : 'Erreur inattendue dans Quai. Relance la publication.',
        runUrl: (known && err.runUrl) || null,
        reconnect: Boolean(known && err.status === 401),
        // Lien simplement en retard : il vaut la peine de le réessayer plus tard.
        late: Boolean(known && err.status === 504),
      };
      job.state = 'error';
    } finally {
      job.note = '';
      await fsp.rm(upload.dir, { recursive: true, force: true }).catch(() => {});
    }
  }

  async function publishUpload(upload) {
    if (activeJob && activeJob.state === 'running') {
      throw new HttpError(409, 'Une publication est déjà en cours : attends qu’elle se termine.');
    }
    if (!upload.zip && !upload.files.size) throw new HttpError(400, 'Aucun fichier à publier dans ce projet.');
    const current = await requireSession();
    uploads.delete(upload.id); // le dossier temporaire appartient désormais à la tâche
    const job = {
      id: newId(), name: upload.name, state: 'running', step: 'read',
      files: 0, bytes: 0, ignored: 0, sent: 0, reused: 0, newVersion: false,
      warnings: [], note: '', run: null, url: current.client.siteUrl(upload.name), error: null,
    };
    jobs.set(job.id, job);
    for (const id of [...jobs.keys()].slice(0, -20)) jobs.delete(id);
    activeJob = job;
    job.finished = runJob(job, upload, current);
    return job;
  }

  // ---------- routes ----------

  async function handleApi(req, res, parts, query) {
    const method = req.method;
    const route = parts.join('/');

    if (route === 'ping' && method === 'GET') return sendJson(res, 200, { ok: true, app: 'quai-mac' });
    if (route === 'state' && method === 'GET') return sendJson(res, 200, await stateView());

    if (route === 'connect' && method === 'POST') {
      await connect(await readJson(req));
      return sendJson(res, 200, await stateView());
    }
    if (route === 'disconnect' && method === 'POST') {
      if (activeJob && activeJob.state === 'running') {
        throw new HttpError(409, 'Une publication est en cours : attends qu’elle se termine.');
      }
      await secrets.clearToken();
      session = null;
      return sendJson(res, 200, await stateView());
    }
    if (route === 'pages/enable' && method === 'POST') {
      await enablePages();
      return sendJson(res, 200, await stateView());
    }

    if (route === 'projects' && method === 'GET') {
      return sendJson(res, 200, await listProjects(await requireSession()));
    }
    if (parts[0] === 'projects' && parts.length === 2 && method === 'DELETE') {
      return sendJson(res, 200, await removeProject(parts[1]));
    }

    if (route === 'uploads' && method === 'POST') {
      const body = await readJson(req);
      return sendJson(res, 201, { id: await createUpload(body.name) });
    }
    if (parts[0] === 'uploads' && parts.length >= 2) {
      const upload = getUpload(parts[1]);
      if (parts[2] === 'files' && parts.length === 3 && method === 'PUT') {
        const stored = await addUploadFile(upload, query.get('path') || '', req);
        return sendJson(res, 200, { ok: true, stored });
      }
      if (parts[2] === 'zip' && parts.length === 3 && method === 'PUT') {
        await addUploadZip(upload, req);
        return sendJson(res, 200, { ok: true });
      }
      if (parts[2] === 'publish' && parts.length === 3 && method === 'POST') {
        return sendJson(res, 202, { job: jobView(await publishUpload(upload)) });
      }
      if (parts.length === 2 && method === 'DELETE') {
        await discardUpload(upload);
        return sendJson(res, 200, { ok: true });
      }
    }

    if (parts[0] === 'jobs' && parts.length === 2 && method === 'GET') {
      const job = jobs.get(parts[1]);
      if (!job) throw new HttpError(404, 'Publication introuvable.');
      return sendJson(res, 200, { job: jobView(job) });
    }

    throw new HttpError(404, 'Route inconnue.');
  }

  async function handle(req, res) {
    assertHost(req);
    if (!req.url.startsWith('/')) throw new HttpError(400, 'Requête invalide.');
    const mark = req.url.indexOf('?');
    const rawPath = mark === -1 ? req.url : req.url.slice(0, mark);
    let pathname;
    try {
      pathname = decodeURIComponent(rawPath);
    } catch {
      throw new HttpError(400, 'URL invalide.');
    }
    const segs = pathname.split('/').filter(Boolean);

    if (segs[0] === 'api') {
      assertApiCaller(req);
      return handleApi(req, res, segs.slice(1), new URLSearchParams(mark === -1 ? '' : req.url.slice(mark)));
    }
    if (!segs.length || pathname === '/index.html') {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        return res.end();
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': page.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Content-Security-Policy':
          "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; " +
          "connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      });
      return res.end(req.method === 'HEAD' ? undefined : page);
    }
    throw new HttpError(404, 'Page introuvable.');
  }

  function fail(req, res, err) {
    const known = err instanceof HttpError;
    if (!known) console.error('[quai-mac]', err);
    if (res.headersSent) return res.destroy();
    // Corps non lu (envoi refusé) : on ferme la connexion après la réponse.
    const headers = req.complete ? {} : { Connection: 'close' };
    const body = { error: known ? err.message : 'Erreur interne de Quai.', ...(known && err.details ? err.details : {}) };
    sendJson(res, known ? err.status : 500, body, headers);
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((err) => fail(req, res, err));
  });
  server.requestTimeout = 30 * 60 * 1000;

  async function start() {
    tmpRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'quai-mac-'));
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(config.port, HOST, resolve);
    });
    port = server.address().port;
    return { port };
  }

  async function stop() {
    stopped = true;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    if (activeJob) await activeJob.finished.catch(() => {});
    if (tmpRoot) await fsp.rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
  }

  return { server, config, secrets, start, stop, jobs };
}

module.exports = { createApp };

if (require.main === module) {
  const app = createApp({ env: process.env });
  app
    .start()
    .then(({ port }) => {
      console.log(`Quai pour Mac est prêt : http://localhost:${port}`);
    })
    .catch((err) => {
      const busy = err && err.code === 'EADDRINUSE';
      console.error(
        busy
          ? `Démarrage impossible : le port ${app.config.port} est déjà utilisé (Quai tourne peut-être déjà).`
          : `Démarrage impossible : ${err.message}`
      );
      process.exit(1);
    });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => app.stop().then(() => process.exit(0)));
  }
}
