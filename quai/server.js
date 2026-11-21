'use strict';
// Quai — mini-plateforme de déploiement de sites statiques.
// Aucune dépendance : `node server.js` suffit.

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { pipeline } = require('node:stream/promises');

const { Store, HttpError, NAME_RE, assertName, byteLimiter } = require('./lib/store');
const { serveSite, sendNotFound, encodePath } = require('./lib/static');
const { extractZip } = require('./lib/zip');
const git = require('./lib/git');

const MB = 1024 * 1024;
const SESSION_COOKIE = 'quai_session';
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_MAX_FAILURES = 20;

function createApp(options = {}) {
  const env = options.env || {};
  const config = {
    port: Number(options.port ?? env.PORT ?? 8080),
    host: options.host ?? env.HOST ?? '0.0.0.0',
    dataDir: path.resolve(options.dataDir ?? env.DATA_DIR ?? path.join(__dirname, 'data')),
    token: options.token ?? env.QUAI_TOKEN ?? '',
    baseDomain: String(options.baseDomain ?? env.BASE_DOMAIN ?? '')
      .trim()
      .toLowerCase()
      .replace(/^\.+|\.+$/g, ''),
    maxUploadBytes: Number(options.maxUploadMb ?? env.MAX_UPLOAD_MB ?? 200) * MB,
    keepDeploys: Number(options.keepDeploys ?? env.KEEP_DEPLOYS ?? 5),
    gitAllowFile: Boolean(options.gitAllowFile), // tests uniquement
  };

  const store = new Store(config.dataDir, {
    keepDeploys: config.keepDeploys,
    maxDeployBytes: config.maxUploadBytes,
  });
  const dashboard = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
  const loginFailures = new Map();
  let sessionValue = '';

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

  function redirect(res, status, location) {
    res.writeHead(status, { Location: location, 'Cache-Control': 'no-store' });
    res.end();
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

  function parseHost(header) {
    const raw = String(header || '').toLowerCase();
    const match = /^(\[[^\]]+\]|[^:]+)(?::(\d+))?$/.exec(raw);
    if (!match) return null;
    return { hostname: match[1], port: match[2] || '', raw };
  }

  function scheme(req) {
    const forwarded = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    return forwarded === 'https' || forwarded === 'http' ? forwarded : 'http';
  }

  // Domaine servant de base aux sous-domaines pour cet hôte, sinon null (mode chemin).
  function subdomainBase(hostname) {
    if (config.baseDomain) return config.baseDomain;
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) return 'localhost';
    return null;
  }

  // undefined : hôte principal. null : sous-domaine invalide. Sinon, nom du projet.
  function projectFromHost(hostname) {
    const base = subdomainBase(hostname);
    if (!base || !hostname.endsWith('.' + base)) return undefined;
    const sub = hostname.slice(0, -(base.length + 1));
    return NAME_RE.test(sub) ? sub : null;
  }

  function siteUrl(req, host, name) {
    const base = subdomainBase(host.hostname);
    const port = host.port ? ':' + host.port : '';
    if (base) return `${scheme(req)}://${name}.${base}${port}/`;
    return `${scheme(req)}://${host.raw}/${name}/`;
  }

  // ---------- authentification ----------

  function safeEqual(a, b) {
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
  }

  function cookies(req) {
    const out = {};
    for (const part of String(req.headers.cookie || '').split(';')) {
      const i = part.indexOf('=');
      if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
    return out;
  }

  function hasBearer(req) {
    const header = String(req.headers.authorization || '');
    return header.startsWith('Bearer ') && safeEqual(header.slice(7).trim(), config.token);
  }

  function hasSession(req) {
    const value = cookies(req)[SESSION_COOKIE];
    return Boolean(value) && safeEqual(value, sessionValue);
  }

  // Les requêtes authentifiées par cookie doivent venir du tableau de bord lui-même,
  // pas d'un site hébergé sur un sous-domaine voisin.
  function assertSameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return;
    let originHost;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = '';
    }
    if (originHost !== String(req.headers.host || '').toLowerCase()) {
      throw new HttpError(403, 'Origine de la requête refusée.');
    }
  }

  function loginThrottled(ip) {
    const entry = loginFailures.get(ip);
    if (!entry) return false;
    if (Date.now() > entry.resetAt) {
      loginFailures.delete(ip);
      return false;
    }
    return entry.count >= LOGIN_MAX_FAILURES;
  }

  function recordLoginFailure(ip) {
    const entry = loginFailures.get(ip);
    if (entry && Date.now() <= entry.resetAt) entry.count += 1;
    else loginFailures.set(ip, { count: 1, resetAt: Date.now() + LOGIN_WINDOW_MS });
  }

  // ---------- déploiements ----------

  function projectView(req, host, project) {
    const current = project.deploys.find((d) => d.id === project.current) || null;
    return {
      name: project.name,
      url: siteUrl(req, host, project.name),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      current: project.current,
      deploys: project.deploys,
      warning:
        current && !current.hasIndex ? "Pas de fichier index.html à la racine du projet." : null,
      git: project.git
        ? { url: git.maskUrl(project.git.url), branch: project.git.branch, dir: project.git.dir }
        : null,
      hookUrl: project.git
        ? `${scheme(req)}://${host.raw}/_quai/hook/${project.name}/${project.hookSecret}`
        : null,
    };
  }

  async function deployFromGit(name, source) {
    const id = await store.createStaging(name);
    const cloneDir = path.join(store.tmpDir, id + '-clone');
    try {
      await git.clone(source, cloneDir);
      const from = source.dir ? path.join(cloneDir, ...source.dir.split('/')) : cloneDir;
      const st = await fsp.lstat(from).catch(() => null);
      if (!st || !st.isDirectory()) {
        throw new HttpError(400, `Dossier « ${source.dir} » introuvable dans le dépôt.`);
      }
      await store.importDir(id, from);
      return await store.publish(id, { source: 'git', git: source });
    } catch (err) {
      await store.discard(id);
      throw err;
    } finally {
      await fsp.rm(cloneDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  async function deployFromZip(name, req) {
    const id = await store.createStaging(name);
    const zipFile = path.join(store.tmpDir, id + '.zip');
    try {
      let received = 0;
      const limiter = byteLimiter((n) => (received += n) <= config.maxUploadBytes);
      await pipeline(req, limiter, fs.createWriteStream(zipFile));
      await extractZip(zipFile, {
        maxBytes: config.maxUploadBytes,
        maxFiles: store.maxFiles,
        onEntry: (entry, content) => store.writeBuffer(id, entry, content),
      });
      return await store.publish(id, { source: 'zip' });
    } catch (err) {
      await store.discard(id);
      throw err.status ? err : new HttpError(400, "L'envoi de l'archive a échoué.");
    } finally {
      await fsp.rm(zipFile, { force: true }).catch(() => {});
    }
  }

  function assertBodyFits(req) {
    const length = Number(req.headers['content-length']);
    if (Number.isFinite(length) && length > config.maxUploadBytes) {
      throw new HttpError(
        413,
        `Envoi trop volumineux (limite : ${Math.round(config.maxUploadBytes / MB)} Mo).`
      );
    }
  }

  // ---------- API du tableau de bord ----------

  async function handleApi(req, res, parts, query, host) {
    const method = req.method;
    const ip = req.socket.remoteAddress || '';

    if (parts[0] === 'login' && method === 'POST') {
      if (loginThrottled(ip)) throw new HttpError(429, 'Trop de tentatives. Réessaie dans quelques minutes.');
      const body = await readJson(req);
      if (!safeEqual(body.token || '', config.token)) {
        recordLoginFailure(ip);
        throw new HttpError(401, 'Jeton incorrect.');
      }
      const secure = scheme(req) === 'https' ? '; Secure' : '';
      return sendJson(res, 200, { ok: true }, {
        'Set-Cookie': `${SESSION_COOKIE}=${sessionValue}; Path=/_quai; HttpOnly; SameSite=Strict; Max-Age=2592000${secure}`,
      });
    }

    const bearer = hasBearer(req);
    if (!bearer && !hasSession(req)) throw new HttpError(401, 'Connexion requise.');
    if (!bearer && method !== 'GET') assertSameOrigin(req);

    if (parts[0] === 'logout' && method === 'POST') {
      return sendJson(res, 200, { ok: true }, {
        'Set-Cookie': `${SESSION_COOKIE}=; Path=/_quai; HttpOnly; SameSite=Strict; Max-Age=0`,
      });
    }

    if (parts[0] === 'projects' && parts.length === 1 && method === 'GET') {
      return sendJson(res, 200, {
        projects: store.list().map((p) => projectView(req, host, p)),
        maxUploadMb: Math.round(config.maxUploadBytes / MB),
        mode: subdomainBase(host.hostname) ? 'subdomain' : 'path',
      });
    }

    if (parts[0] === 'projects' && parts.length >= 2) {
      const name = parts[1];
      const action = parts[2];
      const deployed = (result) =>
        sendJson(res, 201, { project: projectView(req, host, result.project), deploy: result.deploy });

      if (parts.length === 2 && method === 'DELETE') {
        await store.remove(name);
        return sendJson(res, 200, { ok: true });
      }
      if (parts.length === 3 && method === 'POST') {
        if (action === 'deploys') {
          return sendJson(res, 201, { id: await store.createStaging(name) });
        }
        if (action === 'zip') {
          assertName(name);
          assertBodyFits(req);
          return deployed(await deployFromZip(name, req));
        }
        if (action === 'git') {
          assertName(name);
          const source = git.normalizeGit(await readJson(req), { allowFile: config.gitAllowFile });
          return deployed(await deployFromGit(name, source));
        }
        if (action === 'redeploy') {
          const project = store.get(name);
          if (!project) throw new HttpError(404, 'Projet introuvable.');
          if (!project.git) throw new HttpError(400, "Ce projet n'est pas relié à un dépôt Git.");
          return deployed(await deployFromGit(name, project.git));
        }
        if (action === 'rollback') {
          const body = await readJson(req);
          const project = await store.rollback(name, String(body.deploy || ''));
          return sendJson(res, 200, { project: projectView(req, host, project) });
        }
      }
    }

    if (parts[0] === 'deploys' && parts.length >= 2) {
      const id = parts[1];
      if (parts[2] === 'files' && parts.length === 3 && method === 'PUT') {
        assertBodyFits(req);
        const stored = await store.writeStream(id, query.get('path') || '', req);
        return sendJson(res, 200, { ok: true, stored });
      }
      if (parts[2] === 'publish' && parts.length === 3 && method === 'POST') {
        const result = await store.publish(id, { source: 'upload' });
        return sendJson(res, 201, {
          project: projectView(req, host, result.project),
          deploy: result.deploy,
        });
      }
      if (parts.length === 2 && method === 'DELETE') {
        await store.discard(id);
        return sendJson(res, 200, { ok: true });
      }
    }

    throw new HttpError(404, 'Route inconnue.');
  }

  // Webhook : un POST sur l'URL secrète du projet relance un déploiement depuis Git.
  function handleHook(req, res, parts) {
    req.resume();
    const project = store.get(parts[0] || '');
    if (!project || !project.git || !safeEqual(parts[1] || '', project.hookSecret)) {
      throw new HttpError(404, 'Webhook inconnu.');
    }
    deployFromGit(project.name, project.git).catch((err) => {
      console.error(`[quai] webhook ${project.name} : ${err.message}`);
    });
    return sendJson(res, 202, { ok: true });
  }

  async function handlePlatform(req, res, segs, query, host) {
    const [, area, ...parts] = segs;
    if (area === 'api') return handleApi(req, res, parts, query, host);
    if (area === 'hook' && req.method === 'POST') return handleHook(req, res, parts);
    if (area === 'health') return sendJson(res, 200, { ok: true });
    if (!area) return redirect(res, 302, '/');
    throw new HttpError(404, 'Route inconnue.');
  }

  // ---------- sites ----------

  function handleSite(req, res, name, target) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }
    const site = store.siteRoot(name);
    if (!site) return sendNotFound(req, res, "Aucun site n'est publié à cette adresse.");
    return serveSite(req, res, site, target);
  }

  // En mode chemin, un site qui demande « /style.css » vise en réalité « /projet/style.css » :
  // on retrouve le projet grâce à l'en-tête Referer.
  function projectFromReferer(req, host) {
    const referer = req.headers.referer;
    if (!referer) return null;
    try {
      const url = new URL(referer);
      if (url.host !== host.raw) return null;
      const first = decodeURIComponent(url.pathname.split('/')[1] || '');
      return store.projects.has(first) ? first : null;
    } catch {
      return null;
    }
  }

  async function handle(req, res) {
    if (!req.url.startsWith('/')) throw new HttpError(400, 'Requête invalide.');
    const host = parseHost(req.headers.host);
    if (!host) throw new HttpError(400, 'En-tête Host manquant.');

    const mark = req.url.indexOf('?');
    const rawPath = mark === -1 ? req.url : req.url.slice(0, mark);
    const search = mark === -1 ? '' : req.url.slice(mark);
    let pathname;
    try {
      pathname = decodeURIComponent(rawPath);
    } catch {
      throw new HttpError(400, 'URL invalide.');
    }
    const segs = pathname.split('/').filter(Boolean);
    const trailingSlash = pathname.endsWith('/');

    const hosted = projectFromHost(host.hostname);
    if (hosted === null) return sendNotFound(req, res, "Aucun site n'est publié à cette adresse.");
    if (hosted !== undefined) {
      return handleSite(req, res, hosted, { segs, trailingSlash, search, basePath: '' });
    }

    if (segs[0] === '_quai') {
      return handlePlatform(req, res, segs, new URLSearchParams(search), host);
    }

    const first = segs[0];
    if (first && store.projects.has(first)) {
      const rest = segs.slice(1);
      const tail = encodePath(rest) + (rest.length && trailingSlash ? '/' : '');
      if (subdomainBase(host.hostname)) {
        return redirect(res, 302, siteUrl(req, host, first) + tail.slice(1) + search);
      }
      if (!rest.length && !trailingSlash) return redirect(res, 301, `/${first}/${search}`);
      return handleSite(req, res, first, {
        segs: rest,
        trailingSlash,
        search,
        basePath: '/' + first,
      });
    }

    const referring = projectFromReferer(req, host);
    if (referring) {
      const tail = segs.length ? encodePath(segs) + (trailingSlash ? '/' : '') : '/';
      return redirect(res, 307, `/${referring}${tail}${search}`);
    }

    if (!segs.length) {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        return res.end();
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': dashboard.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'same-origin',
      });
      return res.end(req.method === 'HEAD' ? undefined : dashboard);
    }
    return sendNotFound(req, res, "Aucun projet ne porte ce nom.");
  }

  function fail(req, res, err) {
    const status = err.status || 500;
    if (status >= 500) console.error('[quai]', err);
    if (res.headersSent) return res.destroy();
    const message = status >= 500 ? 'Erreur interne du serveur.' : err.message;
    // Corps non lu (envoi refusé) : on ferme la connexion après la réponse.
    const headers = req.complete ? {} : { Connection: 'close' };
    sendJson(res, status, { error: message }, headers);
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((err) => fail(req, res, err));
  });
  server.requestTimeout = 30 * 60 * 1000; // gros envois sur connexion lente

  let sweeper = null;

  async function start() {
    await store.init();
    let generated = false;
    if (!config.token) {
      const tokenFile = path.join(config.dataDir, 'token');
      try {
        config.token = (await fsp.readFile(tokenFile, 'utf8')).trim();
      } catch {
        // premier démarrage
      }
      if (!config.token) {
        config.token = crypto.randomBytes(24).toString('base64url');
        await fsp.writeFile(tokenFile, config.token + '\n', { mode: 0o600 });
        generated = true;
      }
    }
    sessionValue = crypto.createHmac('sha256', config.token).update('quai-session-v1').digest('hex');
    sweeper = setInterval(() => store.sweepStagings().catch(() => {}), 10 * 60 * 1000);
    sweeper.unref();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(config.port, config.host, resolve);
    });
    return { port: server.address().port, generated };
  }

  async function stop() {
    clearInterval(sweeper);
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }

  return { server, store, config, start, stop };
}

module.exports = { createApp };

if (require.main === module) {
  const app = createApp({ env: process.env });
  app
    .start()
    .then(({ port, generated }) => {
      console.log(`\n  Quai est en ligne : http://localhost:${port}`);
      console.log(`  Données          : ${app.config.dataDir}`);
      if (app.config.baseDomain) console.log(`  Sous-domaines    : *.${app.config.baseDomain}`);
      if (generated) {
        console.log(`\n  Jeton d'accès (à garder secret) : ${app.config.token}`);
        console.log(`  Il est enregistré dans ${path.join(app.config.dataDir, 'token')}\n`);
      } else if (!process.env.QUAI_TOKEN) {
        console.log(`  Jeton d'accès    : dans ${path.join(app.config.dataDir, 'token')}\n`);
      } else {
        console.log('');
      }
    })
    .catch((err) => {
      console.error('Démarrage impossible :', err.message);
      process.exit(1);
    });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => app.stop().then(() => process.exit(0)));
  }
}
