'use strict';
// Tests de Quai pour Mac (quai/mac) contre un faux GitHub local.
// Le jeton est rangé dans un dossier temporaire : ni Trousseau, ni vrai dossier personnel.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const { createApp } = require('../mac/server');

const TOKEN = 'ghp_jetonDeTestValide0123456789';
const READ_ONLY_TOKEN = 'ghp_jetonEnLectureSeule0123456';
const GH_TOKEN = 'gho_jetonDeLaCommandeGh01234567';

// ---------- faux GitHub ----------
// Juste ce qu'il faut de l'API (sous /api) et du site GitHub Pages (sous /pages).

const sha1 = (text) => crypto.createHash('sha1').update(text).digest('hex');
const gitBlobSha = (buffer) =>
  crypto.createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
const slugOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function createFakeGitHub() {
  const fake = { port: 0 };

  fake.reset = () => {
    fake.tokens = new Map([
      [TOKEN, { login: 'alice', push: true }],
      [READ_ONLY_TOKEN, { login: 'bob', push: false }],
      [GH_TOKEN, { login: 'alice-gh', push: true }],
    ]);
    fake.defaultBranch = 'main';
    fake.workflowPresent = true;
    fake.pages = 'workflow'; // null (désactivé) | 'legacy' | 'workflow'
    fake.pagesWritable = true;
    fake.blobs = new Map(); // sha → Buffer
    fake.trees = new Map(); // sha → Map(chemin → sha du blob)
    fake.commits = new Map(); // sha → { tree, parents, message, date }
    fake.refs = new Map(); // branche → sha du commit
    fake.runs = [];
    fake.dispatches = [];
    fake.log = []; // { method, path, body }
    fake.faults = []; // pannes à injecter : { when(entry), times, status, headers, body }
    fake.runConclusion = 'success';
    fake.hold = null; // promesse : le faux GitHub ne répond qu'une fois qu'elle est tenue
    fake.frozen = false; // true : les exécutions réussissent mais le site ne change plus
    fake.dropped = []; // projets déposés dans sites/ (hors branches)
    fake.deployed = null; // { manifest, sites: Map(slug → Map(chemin → Buffer)) }
    fake.ticks = Math.floor(Date.now() / 1000) * 1000;
    // Branche principale : un commit avec un fichier.
    const readme = fake.addBlob(Buffer.from('# depot\n'));
    fake.refs.set('main', fake.addCommit(fake.addTree(new Map([['README.md', readme]])), [], 'Premier commit'));
  };

  fake.now = () => (fake.ticks += 1000);
  fake.addBlob = (buffer) => {
    const sha = gitBlobSha(buffer);
    fake.blobs.set(sha, buffer);
    return sha;
  };
  fake.addTree = (entries) => {
    const sha = sha1('tree' + JSON.stringify([...entries].sort()));
    fake.trees.set(sha, entries);
    return sha;
  };
  fake.addCommit = (tree, parents, message) => {
    const date = new Date(fake.now()).toISOString().replace('.000Z', 'Z');
    const sha = sha1('commit' + JSON.stringify([tree, parents, message, date]));
    fake.commits.set(sha, { tree, parents, message, date });
    return sha;
  };
  // Fichiers d'une branche, sous forme { chemin: contenu }.
  fake.files = (branch) => {
    const out = {};
    for (const [file, sha] of fake.trees.get(fake.commits.get(fake.refs.get(branch)).tree)) {
      out[file] = fake.blobs.get(sha).toString('utf8');
    }
    return out;
  };
  fake.count = (method, suffix) => fake.log.filter((e) => e.method === method && e.path.endsWith(suffix)).length;

  // Ce que fait le workflow quai-pages.yml : chaque branche avec un index.html devient un site.
  fake.deploy = () => {
    if (fake.pages !== 'workflow' || fake.frozen) return;
    const projects = [...fake.dropped];
    const skipped = [];
    const sites = new Map();
    for (const [name, sha] of fake.refs) {
      if (name === fake.defaultBranch) continue;
      const commit = fake.commits.get(sha);
      const tree = fake.trees.get(commit.tree);
      if (!tree.has('index.html')) {
        skipped.push(`branche ${name} : pas de index.html`);
        continue;
      }
      const files = new Map([...tree].map(([file, blob]) => [file, fake.blobs.get(blob)]));
      sites.set(slugOf(name), files);
      projects.push({
        slug: slugOf(name),
        source: 'branche',
        label: `branche ${name}`,
        updatedAt: Date.parse(commit.date),
        files: files.size,
        bytes: [...files.values()].reduce((sum, b) => sum + b.length, 0),
        notes: [],
        url: `http://127.0.0.1:${fake.port}/pages/r/${slugOf(name)}/`,
      });
    }
    fake.deployed = { manifest: { generatedAt: fake.now(), repository: 'o/r', projects, skipped }, sites };
  };

  function send(res, status, body, headers = {}) {
    const payload = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
    res.writeHead(status, { 'Content-Type': typeof body === 'string' ? 'text/html' : 'application/json', ...headers });
    res.end(payload);
  }

  function api(req, res, route, query, body) {
    const account = fake.tokens.get(String(req.headers.authorization || '').replace(/^Bearer /, ''));
    if (!account) return send(res, 401, { message: 'Bad credentials' });
    if (route === '/user') return send(res, 200, { login: account.login });

    if (!route.startsWith('/repos/o/r')) return send(res, 404, { message: 'Not Found' });
    const rest = route.slice('/repos/o/r'.length);
    const method = req.method;
    const refName = (prefix) => decodeURIComponent(rest.slice(prefix.length));

    if (rest === '' && method === 'GET') {
      return send(res, 200, {
        full_name: 'o/r',
        default_branch: fake.defaultBranch,
        private: false,
        permissions: { pull: true, push: account.push, admin: account.push },
      });
    }

    if (rest === '/pages') {
      if (method === 'GET') {
        return fake.pages ? send(res, 200, { build_type: fake.pages }) : send(res, 404, { message: 'Not Found' });
      }
      if (!fake.pagesWritable) return send(res, 403, { message: 'Resource not accessible by personal access token' });
      if (method === 'POST') {
        if (fake.pages) return send(res, 409, { message: 'GitHub Pages is already enabled.' });
        fake.pages = body.build_type;
        return send(res, 201, { build_type: fake.pages });
      }
      if (method === 'PUT') {
        fake.pages = body.build_type;
        return send(res, 204);
      }
    }

    if (rest === '/contents/.github/workflows/quai-pages.yml' && method === 'GET') {
      return fake.workflowPresent && query.get('ref') === fake.defaultBranch
        ? send(res, 200, { name: 'quai-pages.yml', type: 'file' })
        : send(res, 404, { message: 'Not Found' });
    }

    if (rest === '/branches' && method === 'GET') {
      const page = Number(query.get('page') || 1);
      const per = Number(query.get('per_page') || 30);
      const all = [...fake.refs].map(([name, sha]) => ({ name, commit: { sha } }));
      return send(res, 200, all.slice((page - 1) * per, page * per));
    }

    if (rest.startsWith('/git/ref/heads/') && method === 'GET') {
      const sha = fake.refs.get(refName('/git/ref/heads/'));
      return sha ? send(res, 200, { object: { sha, type: 'commit' } }) : send(res, 404, { message: 'Not Found' });
    }
    if (rest.startsWith('/git/trees/') && method === 'GET') {
      const id = rest.slice('/git/trees/'.length);
      const tree = fake.trees.get(fake.commits.has(id) ? fake.commits.get(id).tree : id);
      if (!tree) return send(res, 404, { message: 'Not Found' });
      return send(res, 200, { tree: [...tree].map(([file, sha]) => ({ path: file, type: 'blob', sha })), truncated: false });
    }
    if (rest === '/git/blobs' && method === 'POST') {
      assert.equal(body.encoding, 'base64');
      return send(res, 201, { sha: fake.addBlob(Buffer.from(body.content, 'base64')) });
    }
    if (rest === '/git/trees' && method === 'POST') {
      const entries = new Map(body.base_tree ? fake.trees.get(body.base_tree) : []);
      for (const entry of body.tree) {
        if (entry.type !== 'blob' || entry.mode !== '100644' || !fake.blobs.has(entry.sha)) {
          return send(res, 422, { message: 'tree.sha is not a valid blob' });
        }
        entries.set(entry.path, entry.sha);
      }
      return send(res, 201, { sha: fake.addTree(entries) });
    }
    if (rest === '/git/commits' && method === 'POST') {
      if (!fake.trees.has(body.tree) || body.parents.some((p) => !fake.commits.has(p))) {
        return send(res, 422, { message: 'Invalid tree or parent' });
      }
      const sha = fake.addCommit(body.tree, body.parents, body.message);
      return send(res, 201, { sha, committer: { date: fake.commits.get(sha).date } });
    }
    if (rest === '/git/refs' && method === 'POST') {
      const name = body.ref.replace(/^refs\/heads\//, '');
      if (fake.refs.has(name)) return send(res, 422, { message: 'Reference already exists' });
      if (!fake.commits.has(body.sha)) return send(res, 422, { message: 'Object does not exist' });
      fake.refs.set(name, body.sha);
      return send(res, 201, { ref: body.ref });
    }
    if (rest.startsWith('/git/refs/heads/')) {
      const name = refName('/git/refs/heads/');
      if (!fake.refs.has(name)) return send(res, 422, { message: 'Reference does not exist' });
      if (method === 'PATCH') {
        fake.refs.set(name, body.sha);
        return send(res, 200, { ref: `refs/heads/${name}` });
      }
      if (method === 'DELETE') {
        fake.refs.delete(name);
        return send(res, 204);
      }
    }

    if (rest === '/actions/workflows/quai-pages.yml/dispatches' && method === 'POST') {
      if (!fake.workflowPresent) return send(res, 404, { message: 'Not Found' });
      fake.dispatches.push(body);
      const id = 1000 + fake.runs.length + 1;
      fake.runs.push({
        id, event: 'workflow_dispatch', head_branch: body.ref, status: 'queued', conclusion: null,
        html_url: `https://github.test/o/r/actions/runs/${id}`,
      });
      return send(res, 204);
    }
    if (rest === '/actions/workflows/quai-pages.yml/runs' && method === 'GET') {
      const runs = fake.runs.filter((run) => run.head_branch === query.get('branch')).reverse();
      return send(res, 200, { total_count: runs.length, workflow_runs: runs });
    }
    if (rest.startsWith('/actions/runs/') && method === 'GET') {
      const run = fake.runs.find((r) => String(r.id) === rest.slice('/actions/runs/'.length));
      if (!run) return send(res, 404, { message: 'Not Found' });
      // Chaque interrogation fait avancer l'exécution : en attente → en cours → terminée.
      if (run.status === 'queued') run.status = 'in_progress';
      else if (run.status === 'in_progress') {
        run.status = 'completed';
        run.conclusion = fake.runConclusion;
        if (run.conclusion === 'success') fake.deploy();
      }
      return send(res, 200, run);
    }
    return send(res, 404, { message: 'Not Found' });
  }

  function pages(req, res, route) {
    assert.equal(req.headers.authorization, undefined, 'aucun jeton ne doit partir vers le site public');
    if (!fake.deployed) return send(res, 404, 'introuvable');
    if (route === '/r/quai.json') return send(res, 200, fake.deployed.manifest);
    const match = /^\/r\/([^/]+)\/$/.exec(route);
    const site = match && fake.deployed.sites.get(match[1]);
    return site ? send(res, 200, site.get('index.html').toString('utf8')) : send(res, 404, 'introuvable');
  }

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
      if (fake.hold) await fake.hold;
      const url = new URL(req.url, 'http://faux');
      const text = Buffer.concat(chunks).toString('utf8');
      const body = text ? JSON.parse(text) : {};
      const entry = { method: req.method, path: url.pathname, body };
      fake.log.push(entry);
      const fault = fake.faults.find((f) => f.times > 0 && f.when(entry));
      if (fault) {
        fault.times -= 1;
        return send(res, fault.status, fault.body || { message: 'panne' }, fault.headers || {});
      }
      try {
        if (url.pathname.startsWith('/api/')) return api(req, res, url.pathname.slice(4), url.searchParams, body);
        if (url.pathname.startsWith('/pages/')) return pages(req, res, url.pathname.slice(6));
        return send(res, 404, { message: 'Not Found' });
      } catch (err) {
        return send(res, 500, { message: String(err && err.message) });
      }
    });
  });

  fake.start = () =>
    new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        fake.port = server.address().port;
        fake.apiBase = `http://127.0.0.1:${fake.port}/api`;
        fake.pagesOrigin = `http://127.0.0.1:${fake.port}/pages`;
        resolve();
      });
    });
  fake.stop = () => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  };
  fake.reset();
  return fake;
}

// Fabrique un zip en mémoire (entrées « deflate » ou « stored »).
function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}
function makeZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const data = Buffer.from(entry.data || '');
    const stored = entry.store ? data : zlib.deflateRawSync(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(entry.store ? 0 : 8, 8);
    local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(stored.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(entry.store ? 0 : 8, 10);
    central.writeUInt32LE(crc32(data), 16);
    central.writeUInt32LE(stored.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(((entry.mode || 0o100644) << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, stored);
    centrals.push(central, name);
    offset += 30 + name.length + stored.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

// ---------- tests ----------

const fake = createFakeGitHub();
let tmp;
let current = null; // application du test en cours

// Démarre Quai pour Mac branché sur le faux GitHub, avec un dossier de configuration jetable.
async function startApp(overrides = {}) {
  const configDir = fs.mkdtempSync(path.join(tmp, 'config-'));
  const waits = [];
  const app = createApp({
    port: 0,
    configDir,
    tokenStore: 'file',
    gh: false,
    defaultRepo: 'o/r',
    apiBase: fake.apiBase,
    pagesOrigin: fake.pagesOrigin,
    // Les attentes (nouveaux essais, interrogations espacées) sont notées, pas subies.
    sleep: (ms) => {
      waits.push(ms);
      return new Promise((resolve) => setImmediate(resolve));
    },
    ...overrides,
  });
  const { port } = await app.start();

  function raw(pathname, { method = 'GET', headers = {}, body } = {}) {
    return new Promise((resolve, reject) => {
      const all = { Host: `127.0.0.1:${port}`, ...headers };
      for (const key of Object.keys(all)) if (all[key] === null) delete all[key];
      const req = http.request({ host: '127.0.0.1', port, path: pathname, method, headers: all }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          // Quoi qu'il arrive, aucun jeton ne revient vers le navigateur.
          for (const secret of [TOKEN, READ_ONLY_TOKEN, GH_TOKEN]) {
            assert.ok(!text.includes(secret), `le jeton apparaît dans la réponse de ${method} ${pathname}`);
          }
          let data = null;
          try {
            data = JSON.parse(text);
          } catch {
            // pas du JSON
          }
          resolve({ status: res.statusCode, headers: res.headers, text, data });
        });
      });
      req.on('error', reject);
      req.end(body);
    });
  }
  const call = (route, options = {}) =>
    raw('/api/' + route, { ...options, headers: { 'X-Quai': '1', ...(options.headers || {}) } });
  const post = (route, data) => call(route, { method: 'POST', body: JSON.stringify(data || {}) });

  async function connect(token = TOKEN, repo = 'o/r') {
    const res = await post('connect', { repo, token });
    assert.equal(res.status, 200, res.text);
    return res.data;
  }
  async function waitJob(id) {
    for (let i = 0; i < 2000; i++) {
      const res = await call(`jobs/${id}`);
      assert.equal(res.status, 200, res.text);
      if (res.data.job.state !== 'running') return res.data.job;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    throw new Error('la publication ne se termine pas');
  }
  async function newUpload(name) {
    const created = await post('uploads', { name });
    assert.equal(created.status, 201, created.text);
    return created.data.id;
  }
  async function launch(id) {
    const started = await post(`uploads/${id}/publish`);
    assert.equal(started.status, 202, started.text);
    return waitJob(started.data.job.id);
  }
  async function publishZip(name, entries) {
    const id = await newUpload(name);
    const put = await call(`uploads/${id}/zip`, { method: 'PUT', body: makeZip(entries) });
    assert.equal(put.status, 200, put.text);
    return launch(id);
  }
  async function publishFiles(name, files) {
    const id = await newUpload(name);
    for (const [rel, content] of Object.entries(files)) {
      const put = await call(`uploads/${id}/files?path=${encodeURIComponent(rel)}`, { method: 'PUT', body: content });
      assert.equal(put.status, 200, put.text);
    }
    return launch(id);
  }

  current = { app, port, configDir, waits, raw, call, post, connect, waitJob, newUpload, launch, publishZip, publishFiles };
  return current;
}

const SITE = [
  { name: 'mon-site/index.html', data: '<h1>Bonjour</h1>' },
  { name: 'mon-site/css/style.css', data: 'body { color: teal; }' },
  { name: 'mon-site/img/logo.svg', data: '<svg/>', store: true },
];

test.before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quai-mac-test-'));
  await fake.start();
});
test.beforeEach(() => fake.reset());
test.afterEach(async () => {
  if (current) await current.app.stop();
  current = null;
});
test.after(async () => {
  await fake.stop();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('mac : la page est servie, sans en-tête CORS, avec une politique de contenu stricte', async () => {
  const { raw } = await startApp();
  const home = await raw('/');
  assert.equal(home.status, 200);
  assert.match(home.text, /<title>Quai pour Mac<\/title>/);
  assert.match(home.headers['content-security-policy'], /default-src 'none'/);
  assert.equal(home.headers['x-frame-options'], 'DENY');
  assert.equal(home.headers['access-control-allow-origin'], undefined);
  assert.equal((await raw('/inconnu')).status, 404);
});

test('mac : le serveur n’écoute que sur 127.0.0.1', async () => {
  const { app } = await startApp();
  assert.equal(app.server.address().address, '127.0.0.1');
});

test('mac : requêtes refusées si Host, X-Quai ou Origin ne conviennent pas', async () => {
  const { raw, call, port } = await startApp();

  // Anti DNS-rebinding : seul localhost:<port> ou 127.0.0.1:<port> est accepté comme Host.
  for (const host of ['evil.example', `evil.example:${port}`, `127.0.0.1:${port + 1}`, 'localhost', `127.0.0.1.evil.example:${port}`]) {
    assert.equal((await raw('/', { headers: { Host: host } })).status, 403, host);
    assert.equal((await call('state', { headers: { Host: host } })).status, 403, host);
  }
  assert.equal((await raw('/', { headers: { Host: `localhost:${port}` } })).status, 200);
  assert.equal((await call('state', { headers: { Host: `localhost:${port}` } })).status, 200);

  // L'API exige l'en-tête X-Quai : un formulaire ou une image d'un autre site ne peut pas l'ajouter.
  assert.equal((await raw('/api/state')).status, 403);
  assert.equal((await raw('/api/state', { headers: { 'X-Quai': '0' } })).status, 403);
  assert.equal((await raw('/api/connect', { method: 'POST', body: '{}' })).status, 403);

  // Origin, s'il est présent, doit être celui de la page.
  const origin = (value, host) => call('state', { headers: { Origin: value, ...(host ? { Host: host } : {}) } });
  assert.equal((await origin('https://evil.example')).status, 403);
  assert.equal((await origin('null')).status, 403);
  assert.equal((await origin(`http://localhost:${port}`)).status, 403, 'origine différente de Host');
  assert.equal((await origin(`https://127.0.0.1:${port}`)).status, 403);
  assert.equal((await origin(`http://127.0.0.1:${port}`)).status, 200);
  assert.equal((await origin(`http://localhost:${port}`, `localhost:${port}`)).status, 200);
  assert.equal((await call('state', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);

  // Jamais d'en-tête CORS, y compris sur une requête préliminaire.
  const preflight = await raw('/api/state', {
    method: 'OPTIONS',
    headers: { Origin: 'https://evil.example', 'Access-Control-Request-Headers': 'x-quai' },
  });
  assert.equal(preflight.status, 403);
  for (const res of [preflight, await call('state')]) {
    for (const name of Object.keys(res.headers)) assert.ok(!name.startsWith('access-control-'), name);
  }
});

test('mac : connexion — jeton invalide, dépôt inconnu, jeton sans écriture, saisies invalides', async () => {
  const { call, post, configDir } = await startApp();

  const before = (await call('state')).data;
  assert.equal(before.connected, false);
  assert.equal(before.repo, 'o/r');
  assert.equal(before.ghAvailable, false);

  const bad = await post('connect', { repo: 'o/r', token: 'ghp_jetonInconnuDeGitHub000000' });
  assert.equal(bad.status, 401);
  assert.match(bad.data.error, /refusé le jeton/);

  const missing = await post('connect', { repo: 'o/absent', token: TOKEN });
  assert.equal(missing.status, 404);
  assert.match(missing.data.error, /Dépôt « o\/absent » introuvable/);

  const readOnly = await post('connect', { repo: 'o/r', token: READ_ONLY_TOKEN });
  assert.equal(readOnly.status, 403);
  assert.match(readOnly.data.error, /ne permet pas d'écrire/);

  for (const repo of ['', 'sans-barre', 'o/r/x', '../..', 'o/..', 'o/r?x=1', 'o r/x', 'https://github.com/o/r']) {
    const res = await post('connect', { repo, token: TOKEN });
    assert.equal(res.status, 400, repo);
    assert.match(res.data.error, /Nom de dépôt invalide/);
  }
  for (const token of ['', 'court', 'avec espace dedans 123', 'ligne\ncoupee12345', '-commence-par-un-tiret']) {
    assert.equal((await post('connect', { repo: 'o/r', token })).status, 400, JSON.stringify(token));
  }

  // Rien n'a été enregistré, et aucune de ces tentatives n'a ouvert de session.
  assert.equal(fs.existsSync(path.join(configDir, 'config.json')), false);
  assert.equal((await call('state')).data.connected, false);
  assert.equal((await call('projects')).status, 401);
});

test('mac : connexion réussie — jeton rangé en mode 600, jamais renvoyé', async () => {
  const { call, connect, configDir } = await startApp();
  const state = await connect();
  assert.equal(state.connected, true);
  assert.equal(state.login, 'alice');
  assert.equal(state.repo, 'o/r');
  assert.equal(state.defaultBranch, 'main');
  assert.equal(state.siteUrl, `${fake.pagesOrigin}/r/`);
  assert.deepEqual(
    { workflow: state.checks.workflow, pages: state.checks.pages },
    { workflow: true, pages: 'active' }
  );
  assert.equal(JSON.stringify(state).includes(TOKEN), false);

  const file = path.join(configDir, 'config.json');
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { token: TOKEN, repo: 'o/r' });

  // Un redémarrage retrouve la connexion ; la déconnexion efface le jeton.
  const again = (await call('state')).data;
  assert.equal(again.connected, true);
  assert.equal(again.login, 'alice');
  const out = await call('disconnect', { method: 'POST' });
  assert.equal(out.data.connected, false);
  assert.equal(out.data.repo, 'o/r');
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { repo: 'o/r' });
});

test('mac : « Utiliser ma connexion GitHub existante » passe par gh auth token', async () => {
  const gh = path.join(tmp, 'gh');
  fs.writeFileSync(gh, `#!/bin/sh\n[ "$1" = auth ] && [ "$2" = token ] && [ $# -eq 2 ] && echo ${GH_TOKEN}\n`, { mode: 0o755 });
  const { call, post, configDir } = await startApp({ gh });
  assert.equal((await call('state')).data.ghAvailable, true);
  const res = await post('connect', { repo: 'o/r', useGh: true });
  assert.equal(res.status, 200, res.text);
  assert.equal(res.data.login, 'alice-gh');
  assert.equal(JSON.parse(fs.readFileSync(path.join(configDir, 'config.json'), 'utf8')).token, GH_TOKEN);

  // Sans gh connecté : refus clair.
  await current.app.stop();
  const without = await startApp({ gh: path.join(tmp, 'gh-absent') });
  assert.equal((await without.call('state')).data.ghAvailable, false);
  const refused = await without.post('connect', { repo: 'o/r', useGh: true });
  assert.equal(refused.status, 400);
  assert.match(refused.data.error, /gh n'est pas connectée/);
});

test('mac : activation de GitHub Pages (création, passage en mode workflow, droits insuffisants)', async () => {
  fake.pages = null;
  const { call, post, connect } = await startApp();
  const state = await connect();
  assert.equal(state.checks.pages, 'absent');

  // Tant que Pages n'est pas activé, la publication est refusée avec une consigne claire.
  const refused = await post('uploads', { name: 'mon-site' });
  assert.equal(refused.status, 409);
  assert.match(refused.data.error, /Activer GitHub Pages/);

  const enabled = await post('pages/enable');
  assert.equal(enabled.status, 200, enabled.text);
  assert.equal(enabled.data.checks.pages, 'active');
  assert.equal(fake.pages, 'workflow');
  const creation = fake.log.find((e) => e.method === 'POST' && e.path === '/api/repos/o/r/pages');
  assert.deepEqual(creation.body, { build_type: 'workflow' });
  assert.deepEqual(fake.dispatches, [{ ref: 'main' }], 'les projets existants sont publiés aussitôt');
  assert.equal((await post('uploads', { name: 'mon-site' })).status, 201);

  // Pages déjà activé mais avec une autre source : PUT.
  fake.pages = 'legacy';
  assert.equal((await call('state')).data.checks.pages, 'legacy');
  assert.equal((await post('pages/enable')).data.checks.pages, 'active');
  const update = fake.log.find((e) => e.method === 'PUT' && e.path === '/api/repos/o/r/pages');
  assert.deepEqual(update.body, { build_type: 'workflow' });
  assert.equal(fake.pages, 'workflow');

  // Jeton sans droit sur Pages : message et lien vers le réglage à faire à la main.
  fake.pages = null;
  fake.pagesWritable = false;
  const denied = await post('pages/enable');
  assert.equal(denied.status, 403);
  assert.match(denied.data.error, /le jeton n'a pas les droits nécessaires/);
  assert.match(denied.data.hint, /Source : GitHub Actions/);
  assert.equal(denied.data.settingsUrl, 'https://github.com/o/r/settings/pages');
  assert.equal((await call('state')).data.checks.pages, 'absent');
});

test('mac : workflow absent de la branche par défaut — signalé, publication refusée', async () => {
  fake.workflowPresent = false;
  const { post, connect } = await startApp();
  const state = await connect();
  assert.equal(state.checks.workflow, false);
  const refused = await post('uploads', { name: 'mon-site' });
  assert.equal(refused.status, 409);
  assert.match(refused.data.error, /quai-pages\.yml est absent de la branche main/);
});

test('mac : publication d’un zip — dossier racine retiré, fichiers ignorés, arbre, commit, branche, lien', async () => {
  const { connect, publishZip } = await startApp();
  await connect();
  const job = await publishZip('mon-site', [
    ...SITE,
    { name: 'mon-site/', data: '' },
    { name: 'mon-site/.DS_Store', data: 'x' },
    { name: 'mon-site/Thumbs.db', data: 'x' },
    { name: 'mon-site/.git/config', data: '[core]' },
    { name: 'mon-site/node_modules/lib/index.js', data: 'x' },
    { name: 'mon-site/.github/workflows/pirate.yml', data: 'on: push' },
    { name: '__MACOSX/mon-site/._index.html', data: 'x' },
    { name: 'mon-site/lien', data: '/etc/passwd', mode: 0o120777 },
  ]);

  assert.equal(job.state, 'done', JSON.stringify(job.error));
  assert.equal(job.step, 'online');
  assert.equal(job.url, `${fake.pagesOrigin}/r/mon-site/`);
  assert.equal(job.files, 3);
  assert.equal(job.sent, 3);
  assert.equal(job.ignored, 6);
  assert.equal(job.newVersion, false);
  assert.deepEqual(job.warnings, []);
  assert.equal(job.run.status, 'completed');

  // La branche porte exactement le site, sans dossier racine ni fichiers parasites.
  assert.deepEqual(fake.files('mon-site'), {
    'index.html': '<h1>Bonjour</h1>',
    'css/style.css': 'body { color: teal; }',
    'img/logo.svg': '<svg/>',
  });
  const commit = fake.commits.get(fake.refs.get('mon-site'));
  assert.deepEqual(commit.parents, []);
  assert.equal(commit.message, 'Publication de mon-site via Quai');
  const created = fake.log.find((e) => e.method === 'POST' && e.path === '/api/repos/o/r/git/refs');
  assert.equal(created.body.ref, 'refs/heads/mon-site');
  assert.equal(fake.count('POST', '/git/blobs'), 3);

  // La publication est lancée sur la branche par défaut, et le site répond.
  assert.deepEqual(fake.dispatches, [{ ref: 'main' }]);
  assert.equal(fake.deployed.sites.get('mon-site').get('index.html').toString(), '<h1>Bonjour</h1>');
});

test('mac : nouvelle version d’un projet existant — le commit a pour parent l’ancienne tête', async () => {
  const { call, connect, publishZip } = await startApp();
  await connect();
  await publishZip('mon-site', SITE);
  const firstHead = fake.refs.get('mon-site');
  const blobsBefore = fake.count('POST', '/git/blobs');

  const listed = (await call('projects')).data;
  assert.ok(listed.branches.includes('mon-site'));

  const job = await publishZip('mon-site', [
    { name: 'index.html', data: '<h1>Version 2</h1>' },
    { name: 'css/style.css', data: 'body { color: teal; }' }, // inchangé : pas renvoyé
    { name: 'nouveau.txt', data: 'bonjour' },
  ]);
  assert.equal(job.state, 'done', JSON.stringify(job.error));
  assert.equal(job.newVersion, true);
  assert.equal(job.reused, 1);
  assert.equal(fake.count('POST', '/git/blobs') - blobsBefore, 2);

  const head = fake.refs.get('mon-site');
  assert.notEqual(head, firstHead);
  assert.deepEqual(fake.commits.get(head).parents, [firstHead]);
  const patch = fake.log.find((e) => e.method === 'PATCH' && e.path === '/api/repos/o/r/git/refs/heads/mon-site');
  assert.deepEqual(patch.body, { sha: head, force: false });
  // L'arbre est complet : l'ancien fichier img/logo.svg a disparu.
  assert.deepEqual(fake.files('mon-site'), {
    'index.html': '<h1>Version 2</h1>',
    'css/style.css': 'body { color: teal; }',
    'nouveau.txt': 'bonjour',
  });
  assert.equal(job.url, `${fake.pagesOrigin}/r/mon-site/`, 'le lien ne change pas');
  assert.equal(fake.deployed.sites.get('mon-site').get('index.html').toString(), '<h1>Version 2</h1>');
});

test('mac : publication d’un dossier, fichier par fichier', async () => {
  const { call, connect, newUpload, launch } = await startApp();
  await connect();
  const id = await newUpload('dossier-test');
  const put = (rel, body) => call(`uploads/${id}/files?path=${encodeURIComponent(rel)}`, { method: 'PUT', body });

  assert.deepEqual((await put('site/index.html', '<p>dossier</p>')).data, { ok: true, stored: true });
  assert.deepEqual((await put('site/a/b/c.txt', 'profond')).data, { ok: true, stored: true });
  assert.deepEqual((await put('site/vide.txt', '')).data, { ok: true, stored: true });
  assert.deepEqual((await put('site/.DS_Store', 'x')).data, { ok: true, stored: false });
  assert.deepEqual((await put('site/node_modules/x.js', 'x')).data, { ok: true, stored: false });
  for (const hostile of ['../evasion.txt', 'site/../../evasion.txt', '', 'a\u0000b']) {
    assert.equal((await put(hostile, 'x')).status, 400, JSON.stringify(hostile));
  }

  const job = await launch(id);
  assert.equal(job.state, 'done', JSON.stringify(job.error));
  assert.deepEqual(fake.files('dossier-test'), {
    'index.html': '<p>dossier</p>',
    'a/b/c.txt': 'profond',
    'vide.txt': '',
  });
  assert.equal((await call(`uploads/${id}`, { method: 'DELETE' })).status, 404, 'le dépôt est consommé');
});

test('mac : noms réservés ou invalides refusés', async () => {
  fake.defaultBranch = 'principal';
  fake.refs.set('principal', fake.refs.get('main'));
  const { call, post, connect } = await startApp();
  await connect();
  for (const name of ['main', 'gh-pages', 'principal']) {
    const res = await post('uploads', { name });
    assert.equal(res.status, 400, name);
    assert.match(res.data.error, /réservé/);
    assert.equal((await call(`projects/${name}`, { method: 'DELETE' })).status, 400, name);
  }
  for (const name of ['', 'Majuscules', '-tiret', 'tiret-', 'a/b', 'a b', 'é', 'x'.repeat(64), '..', null, 42]) {
    const res = await post('uploads', { name });
    assert.equal(res.status, 400, String(name));
    assert.match(res.data.error, /Nom de projet invalide/);
  }
  assert.equal(fake.refs.size, 2, 'aucune branche créée');
});

test('mac : zip hostile (../) refusé avant tout envoi', async () => {
  const { connect, publishZip } = await startApp();
  await connect();
  for (const name of ['../evasion.txt', 'site/../../evasion.txt', '..\\evasion.txt']) {
    const job = await publishZip('piege', [{ name: 'index.html', data: 'ok' }, { name, data: 'x' }]);
    assert.equal(job.state, 'error', name);
    assert.equal(job.error.step, 'read');
    assert.match(job.error.message, /chemin de fichier invalide/);
  }
  assert.equal(fake.count('POST', '/git/blobs'), 0);
  assert.equal(fake.refs.has('piege'), false);

  // Un chemin absolu est ramené à l'intérieur du projet.
  const job = await publishZip('absolu', [{ name: '/index.html', data: 'ok' }, { name: '/etc/passwd', data: 'x' }]);
  assert.equal(job.state, 'done', JSON.stringify(job.error));
  assert.deepEqual(Object.keys(fake.files('absolu')).sort(), ['etc/passwd', 'index.html']);
});

test('mac : archive illisible, vide ou sans fichier utile — échec propre', async () => {
  const { call, connect, newUpload, launch, publishZip, post } = await startApp();
  await connect();

  const id = await newUpload('illisible');
  await call(`uploads/${id}/zip`, { method: 'PUT', body: Buffer.from('ceci n’est pas une archive zip, vraiment pas') });
  const unreadable = await launch(id);
  assert.equal(unreadable.state, 'error');
  assert.equal(unreadable.error.step, 'read');
  assert.match(unreadable.error.message, /Archive zip illisible/);

  const useless = await publishZip('inutile', [{ name: '.DS_Store', data: 'x' }, { name: '__MACOSX/._a', data: 'x' }]);
  assert.equal(useless.state, 'error');
  assert.match(useless.error.message, /Aucun fichier à publier/);

  const empty = await newUpload('vide');
  const refused = await post(`uploads/${empty}/publish`);
  assert.equal(refused.status, 400);
  assert.match(refused.data.error, /Aucun fichier à publier/);

  const clash = await publishZip('conflit', [{ name: 'index.html', data: 'x' }, { name: 'a', data: 'x' }, { name: 'a/b.txt', data: 'x' }]);
  assert.equal(clash.state, 'error');
  assert.match(clash.error.message, /à la fois un fichier et un dossier/);
  assert.equal(fake.count('POST', '/git/blobs'), 0);
});

test('mac : pas d’index.html — avertissement sans blocage, puis explication claire', async () => {
  const { connect, publishZip } = await startApp();
  await connect();
  const job = await publishZip('sans-index', [{ name: 'page.html', data: '<p>seule</p>' }]);
  assert.match(job.warnings[0], /Pas de fichier index\.html/);
  // Les fichiers sont bien envoyés ; GitHub ne publie pas la branche, et Quai le dit.
  assert.deepEqual(fake.files('sans-index'), { 'page.html': '<p>seule</p>' });
  assert.equal(job.state, 'error');
  assert.equal(job.error.step, 'online');
  assert.match(job.error.message, /n'a pas publié ce projet \(pas de index\.html\)/);
  assert.equal(job.error.late, false);
});

test('mac : limites de taille et de nombre de fichiers', async () => {
  const { call, connect, newUpload, publishZip } = await startApp({
    limits: { totalBytes: 2000, fileBytes: 1000, files: 3 },
  });
  await connect();

  const big = await publishZip('gros-fichier', [{ name: 'index.html', data: 'x' }, { name: 'video.mp4', data: 'v'.repeat(1001) }]);
  assert.equal(big.state, 'error');
  assert.match(big.error.message, /« video\.mp4 » dépasse/);

  const heavy = await publishZip('trop-lourd', [
    { name: 'index.html', data: 'x' }, { name: 'a.bin', data: 'a'.repeat(900) },
    { name: 'b.bin', data: 'b'.repeat(900) }, { name: 'c.bin', data: 'c'.repeat(900) },
  ]);
  assert.equal(heavy.state, 'error');
  assert.match(heavy.error.message, /Projet trop volumineux/);

  const many = await publishZip('trop-nombreux', ['a', 'b', 'c', 'd'].map((n) => ({ name: `${n}.txt`, data: n })));
  assert.equal(many.state, 'error');
  assert.match(many.error.message, /Trop de fichiers/);

  // Les fichiers ignorés ne comptent pas.
  const fine = await publishZip('juste-bien', [
    { name: 'index.html', data: 'x' }, { name: 'a.txt', data: 'a' }, { name: 'b.txt', data: 'b' },
    { name: 'node_modules/gros.js', data: 'n'.repeat(1900) }, { name: '.DS_Store', data: 'x' },
  ]);
  assert.equal(fine.state, 'done', JSON.stringify(fine.error));

  // Dossier envoyé fichier par fichier : mêmes limites.
  const id = await newUpload('dossier-limite');
  const put = (rel, body) => call(`uploads/${id}/files?path=${rel}`, { method: 'PUT', body });
  const tooBig = await put('enorme.bin', 'e'.repeat(1001));
  assert.equal(tooBig.status, 413);
  assert.match(tooBig.data.error, /« enorme\.bin » dépasse/);
  assert.equal((await put('a.bin', 'a'.repeat(1000))).status, 200);
  assert.equal((await put('b.bin', 'b'.repeat(1000))).status, 200);
  assert.match((await put('c.bin', 'c')).data.error, /Projet trop volumineux/);
  assert.equal(fake.count('POST', '/git/blobs'), 3, 'seul le projet valide a été envoyé');
});

test('mac : GitHub freine ou tombe en panne pendant l’envoi — nouvel essai après attente', async () => {
  const { connect, publishZip, waits } = await startApp();
  await connect();
  const blob = (e) => e.method === 'POST' && e.path.endsWith('/git/blobs');
  fake.faults.push(
    { when: blob, times: 1, status: 403, headers: { 'retry-after': '7' }, body: { message: 'You have exceeded a secondary rate limit.' } },
    { when: blob, times: 1, status: 429, body: { message: 'Too many requests' } },
    { when: blob, times: 2, status: 502, body: { message: 'Bad Gateway' } },
    { when: (e) => e.method === 'POST' && e.path.endsWith('/git/trees'), times: 1, status: 500 },
  );
  const job = await publishZip('mon-site', SITE);
  assert.equal(job.state, 'done', JSON.stringify(job.error));
  assert.equal(fake.count('POST', '/git/blobs'), 3 + 4);
  assert.ok(waits.includes(7000), 'l’attente demandée par GitHub (Retry-After) est respectée');
  assert.ok(waits.some((ms) => ms === 60000 || ms === 120000), 'sans indication, au moins une minute d’attente');
  assert.deepEqual(Object.keys(fake.files('mon-site')).sort(), ['css/style.css', 'img/logo.svg', 'index.html']);
});

test('mac : GitHub répond 401 — échec propre, reconnexion demandée', async () => {
  const { call, post, connect, publishZip } = await startApp();
  await connect();

  // Jeton refusé pendant l'envoi des fichiers.
  fake.faults.push({ when: (e) => e.path.endsWith('/git/blobs'), times: Infinity, status: 401, body: { message: 'Bad credentials' } });
  const job = await publishZip('mon-site', SITE);
  assert.equal(job.state, 'error');
  assert.equal(job.error.step, 'upload');
  assert.equal(job.error.reconnect, true);
  assert.match(job.error.message, /refusé le jeton d'accès/);
  assert.equal(fake.refs.has('mon-site'), false);

  // Jeton révoqué : chaque action répond 401 avec un message clair, et l'état le signale.
  fake.tokens.delete(TOKEN);
  const refused = await post('uploads', { name: 'mon-site' });
  assert.equal(refused.status, 401);
  assert.match(refused.data.error, /refusé le jeton d'accès/);
  const state = (await call('state')).data;
  assert.equal(state.connected, false);
  assert.match(state.problem, /incorrect, expiré ou révoqué/);
  assert.equal((await call('projects')).status, 401);
});

test('mac : GitHub répond 404 ou 403 au lancement de la publication — étape et raison indiquées', async () => {
  const { connect, publishZip } = await startApp();
  await connect();
  const dispatch = (e) => e.path.endsWith('/dispatches');

  fake.faults.push({ when: dispatch, times: 1, status: 404, body: { message: 'Not Found' } });
  const missing = await publishZip('mon-site', SITE);
  assert.equal(missing.state, 'error');
  assert.equal(missing.error.step, 'publish');
  assert.match(missing.error.message, /quai-pages\.yml est introuvable sur la branche main/);
  assert.equal(fake.refs.has('mon-site'), true, 'les fichiers sont déjà chez GitHub');

  fake.faults.push({ when: dispatch, times: 1, status: 403, body: { message: 'Resource not accessible by personal access token' } });
  const denied = await publishZip('mon-site', SITE);
  assert.equal(denied.error.step, 'publish');
  assert.match(denied.error.message, /n'a pas le droit de déclencher les Actions/);

  // Dépôt devenu inaccessible pendant l'envoi.
  fake.faults.push({ when: (e) => e.path.endsWith('/git/commits'), times: 1, status: 404, body: { message: 'Not Found' } });
  const gone = await publishZip('mon-site', SITE);
  assert.equal(gone.error.step, 'upload');
  assert.match(gone.error.message, /le dépôt ou la branche n'existe pas, ou le jeton n'y a pas accès/);
});

test('mac : exécution du workflow en échec, ou lien qui ne répond pas — signalé à la bonne étape', async () => {
  const { connect, publishZip, waits } = await startApp();
  await connect();

  fake.runConclusion = 'failure';
  const failed = await publishZip('mon-site', SITE);
  assert.equal(failed.state, 'error');
  assert.equal(failed.error.step, 'publish');
  assert.match(failed.error.message, /La publication a échoué chez GitHub/);
  assert.equal(failed.error.runUrl, 'https://github.test/o/r/actions/runs/1001');

  fake.runConclusion = 'success';
  fake.frozen = true;
  waits.length = 0;
  const late = await publishZip('mon-site', SITE);
  assert.equal(late.state, 'error');
  assert.equal(late.error.step, 'online');
  assert.match(late.error.message, /le lien ne répond pas encore/);
  assert.equal(late.error.late, true);
  assert.equal(late.url, `${fake.pagesOrigin}/r/mon-site/`);
  // Attente d'environ quatre minutes, par interrogations espacées.
  const waited = waits.filter((ms) => ms === 4000).length * 4000;
  assert.ok(waited >= 4 * 60 * 1000 && waited <= 5 * 60 * 1000, `attente de ${waited} ms`);
});

test('mac : une exécution annulée est remplacée par la suivante', async () => {
  const { connect, publishZip } = await startApp();
  await connect();
  // La première exécution est annulée (GitHub n'en garde qu'une en attente) ; une autre prend le relais.
  fake.runConclusion = 'cancelled';
  let relayed = false;
  fake.faults.push({
    times: Infinity,
    // Ne provoque aucune panne : ajoute l'exécution de relais une fois la première annulée.
    when: (e) => {
      const first = fake.runs[0];
      if (!relayed && first && first.status === 'completed' && e.path.endsWith('/runs')) {
        relayed = true;
        fake.runConclusion = 'success';
        fake.runs.push({
          id: 2000, event: 'workflow_dispatch', head_branch: 'main', status: 'queued', conclusion: null,
          html_url: 'https://github.test/o/r/actions/runs/2000',
        });
      }
      return false;
    },
  });
  const job = await publishZip('mon-site', SITE);
  assert.equal(job.state, 'done', JSON.stringify(job.error));
  assert.equal(job.run.url, 'https://github.test/o/r/actions/runs/2000');
});

test('mac : mes projets — liste, publication en attente, suppression', async () => {
  const { call, connect, publishZip } = await startApp();
  await connect();
  assert.deepEqual((await call('projects')).data.projects, []);

  await publishZip('premier', SITE);
  await publishZip('second', [{ name: 'index.html', data: 'deux' }]);
  // Branches créées ailleurs : une avec un nom hors format, une pas encore publiée, une sans index.html.
  const tree = fake.addTree(new Map([['index.html', fake.addBlob(Buffer.from('ailleurs'))]]));
  fake.refs.set('claude/essai', fake.addCommit(tree, [], 'ailleurs'));
  fake.deploy();
  fake.refs.set('toute-neuve', fake.addCommit(tree, [], 'neuve'));
  fake.deployed.manifest.skipped.push('branche brouillon : pas de index.html');
  fake.refs.set('brouillon', fake.refs.get('main'));
  fake.deployed.manifest.projects.push({ slug: 'depose', source: 'zip', label: 'zip déposé', updatedAt: 5, files: 2, bytes: 10, notes: ['Une remarque'] });

  const { projects, branches, siteUrl } = (await call('projects')).data;
  assert.equal(siteUrl, `${fake.pagesOrigin}/r/`);
  const byName = Object.fromEntries(projects.map((p) => [p.name, p]));
  assert.deepEqual(Object.keys(byName).sort(), ['claude-essai', 'depose', 'premier', 'second', 'toute-neuve']);
  assert.equal(projects[0].name, 'toute-neuve', 'en attente : en tête de liste');
  assert.deepEqual(
    { online: byName['toute-neuve'].online, managed: byName['toute-neuve'].managed },
    { online: false, managed: true }
  );
  assert.equal(byName.premier.url, `${fake.pagesOrigin}/r/premier/`);
  assert.equal(byName.premier.online, true);
  assert.equal(byName.premier.managed, true);
  assert.equal(byName.premier.files, 3);
  assert.equal(byName.premier.updatedAt, Date.parse(fake.commits.get(fake.refs.get('premier')).date));
  assert.equal(byName['claude-essai'].managed, false, 'branche au nom hors format : lien seulement');
  assert.equal(byName.depose.managed, false);
  assert.deepEqual(byName.depose.notes, ['Une remarque']);
  assert.deepEqual(branches.sort(), ['brouillon', 'premier', 'second', 'toute-neuve']);

  // Suppression : la branche disparaît, la publication est relancée, la liste suit aussitôt.
  const dispatchesBefore = fake.dispatches.length;
  const removed = await call('projects/premier', { method: 'DELETE' });
  assert.equal(removed.status, 200, removed.text);
  assert.deepEqual(removed.data, { ok: true, republishing: true });
  assert.equal(fake.refs.has('premier'), false);
  assert.equal(fake.count('DELETE', '/git/refs/heads/premier'), 1);
  assert.equal(fake.dispatches.length, dispatchesBefore + 1);
  assert.deepEqual(fake.dispatches.at(-1), { ref: 'main' });
  const after = (await call('projects')).data.projects.map((p) => p.name);
  assert.ok(!after.includes('premier'));

  assert.equal((await call('projects/premier', { method: 'DELETE' })).status, 404);
  assert.equal((await call('projects/claude%2Fessai', { method: 'DELETE' })).status, 404);
  assert.equal(fake.refs.has('claude/essai'), true);
  assert.equal(fake.refs.has('main'), true);
});

test('mac : un nom déjà pris par un projet déposé dans sites/ est refusé', async () => {
  const { connect, publishZip } = await startApp();
  await connect();
  fake.dropped.push({ slug: 'vitrine', source: 'dossier', label: 'dossier déposé', updatedAt: 1, files: 1, bytes: 1, notes: [] });
  fake.deploy();
  const job = await publishZip('vitrine', SITE);
  assert.equal(job.state, 'error');
  assert.equal(job.error.step, 'read');
  assert.match(job.error.message, /déjà pris par un projet déposé dans le dossier sites\//);
  assert.equal(fake.refs.has('vitrine'), false);
});

test('mac : une seule publication à la fois, et le suivi d’une tâche inconnue répond 404', async () => {
  const { call, post, connect, newUpload, waitJob } = await startApp();
  await connect();
  const first = await newUpload('un');
  const second = await newUpload('deux');
  for (const id of [first, second]) {
    await call(`uploads/${id}/zip`, { method: 'PUT', body: makeZip(SITE) });
  }
  // GitHub ne répond pas tout de suite : la première publication reste en cours.
  let release;
  fake.hold = new Promise((resolve) => (release = resolve));
  const started = await post(`uploads/${first}/publish`);
  assert.equal(started.status, 202);
  assert.equal(started.data.job.state, 'running');
  assert.equal((await call('state')).data.activeJob, started.data.job.id);
  const busy = await post(`uploads/${second}/publish`);
  assert.equal(busy.status, 409);
  assert.match(busy.data.error, /déjà en cours/);
  fake.hold = null;
  release();
  assert.equal((await waitJob(started.data.job.id)).state, 'done');
  assert.equal((await call('state')).data.activeJob, null);
  assert.equal((await post(`uploads/${second}/publish`)).status, 202);
  assert.equal((await call('jobs/inconnue')).status, 404);
  assert.equal((await call('uploads/inconnu/publish', { method: 'POST' })).status, 404);
});
