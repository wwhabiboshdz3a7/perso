'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');

const { createApp } = require('../server');

const TOKEN = 'jeton-de-test';
let app;
let port;
let dataDir;

// Requête HTTP brute : permet de choisir l'en-tête Host (sous-domaines).
function request(pathname, { method = 'GET', headers = {}, body, host = 'quai.test' } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: pathname, method, headers: { Host: host, ...headers } },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({ status: res.statusCode, headers: res.headers, buffer, text: buffer.toString('utf8') });
        });
      }
    );
    req.on('error', reject);
    req.end(body);
  });
}

const auth = { Authorization: `Bearer ${TOKEN}` };
const api = (route, options = {}) =>
  request('/_quai/api/' + route, { ...options, headers: { ...auth, ...(options.headers || {}) } });
const json = (res) => JSON.parse(res.text);

async function deployFiles(name, files) {
  const created = await api(`projects/${name}/deploys`, { method: 'POST' });
  assert.equal(created.status, 201);
  const { id } = json(created);
  for (const [rel, content] of Object.entries(files)) {
    const put = await api(`deploys/${id}/files?path=${encodeURIComponent(rel)}`, { method: 'PUT', body: content });
    assert.equal(put.status, 200, put.text);
  }
  const published = await api(`deploys/${id}/publish`, { method: 'POST' });
  assert.equal(published.status, 201, published.text);
  return json(published);
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

test.before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quai-test-'));
  app = createApp({ port: 0, host: '127.0.0.1', dataDir, token: TOKEN, maxUploadMb: 1, keepDeploys: 2, gitAllowFile: true });
  ({ port } = await app.start());
});
test.after(async () => {
  await app.stop();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test('le tableau de bord est servi et l’API exige le jeton', async () => {
  const home = await request('/');
  assert.equal(home.status, 200);
  assert.match(home.text, /<title>Quai<\/title>/);

  assert.equal((await request('/_quai/api/projects')).status, 401);
  assert.equal((await request('/_quai/api/projects', { headers: { Authorization: 'Bearer faux' } })).status, 401);
  assert.equal((await api('projects')).status, 200);
});

test('connexion par cookie, et refus des requêtes venant d’une autre origine', async () => {
  const bad = await request('/_quai/api/login', { method: 'POST', body: JSON.stringify({ token: 'non' }) });
  assert.equal(bad.status, 401);

  const good = await request('/_quai/api/login', { method: 'POST', body: JSON.stringify({ token: TOKEN }) });
  assert.equal(good.status, 200);
  const cookie = good.headers['set-cookie'][0].split(';')[0];
  assert.match(good.headers['set-cookie'][0], /HttpOnly; SameSite=Strict/);

  assert.equal((await request('/_quai/api/projects', { headers: { Cookie: cookie } })).status, 200);

  const foreign = await request('/_quai/api/projects/x/deploys', {
    method: 'POST',
    headers: { Cookie: cookie, Origin: 'http://pirate.quai.test' },
  });
  assert.equal(foreign.status, 403);
  const same = await request('/_quai/api/projects/x/deploys', {
    method: 'POST',
    headers: { Cookie: cookie, Origin: 'http://quai.test' },
  });
  assert.equal(same.status, 201);
});

test('déploiement fichier par fichier, puis service en mode chemin', async () => {
  const result = await deployFiles('vitrine', {
    'index.html': '<h1>Accueil</h1><link rel="stylesheet" href="/style.css">',
    'style.css': 'body{color:red}',
    'contact.html': '<h1>Contact</h1>',
    'blog/index.html': '<h1>Blog</h1>',
    '404.html': '<h1>Perdu</h1>',
    'node_modules/pkg/index.js': 'ignoré',
  });
  assert.equal(result.project.url, 'http://quai.test/vitrine/');
  assert.equal(result.deploy.files, 5);
  assert.equal(result.project.warning, null);

  const noSlash = await request('/vitrine');
  assert.equal(noSlash.status, 301);
  assert.equal(noSlash.headers.location, '/vitrine/');

  const home = await request('/vitrine/');
  assert.equal(home.status, 200);
  assert.match(home.headers['content-type'], /text\/html/);
  assert.match(home.text, /Accueil/);

  assert.match((await request('/vitrine/contact')).text, /Contact/);
  assert.equal((await request('/vitrine/blog')).headers.location, '/vitrine/blog/');
  assert.match((await request('/vitrine/blog/')).text, /Blog/);
  assert.match((await request('/vitrine/style.css')).headers['content-type'], /text\/css/);

  const missing = await request('/vitrine/nulle-part');
  assert.equal(missing.status, 404);
  assert.match(missing.text, /Perdu/);

  assert.equal((await request('/vitrine/node_modules/pkg/index.js')).status, 404);
  assert.equal((await request('/vitrine/', { method: 'POST' })).status, 405);
});

test('les chemins absolus d’un site en mode chemin sont rattrapés par le Referer', async () => {
  const css = await request('/style.css', { headers: { Referer: 'http://quai.test/vitrine/' } });
  assert.equal(css.status, 307);
  assert.equal(css.headers.location, '/vitrine/style.css');

  const home = await request('/', { headers: { Referer: 'http://quai.test/vitrine/contact' } });
  assert.equal(home.headers.location, '/vitrine/');

  // Un Referer externe ou une double barre oblique ne doit rien rediriger ailleurs.
  assert.equal((await request('/style.css', { headers: { Referer: 'http://ailleurs.test/vitrine/' } })).status, 404);
  const tricky = await request('//pirate.test/x', { headers: { Referer: 'http://quai.test/vitrine/' } });
  assert.equal(tricky.headers.location, '/vitrine/pirate.test/x');
});

test('sous-domaines : *.localhost et BASE_DOMAIN', async () => {
  const sub = await request('/', { host: `vitrine.localhost:${port}` });
  assert.equal(sub.status, 200);
  assert.match(sub.text, /Accueil/);
  assert.equal((await request('/blog', { host: `vitrine.localhost:${port}` })).headers.location, '/blog/');
  assert.equal((await request('/', { host: `inconnu.localhost:${port}` })).status, 404);

  const moved = await request('/vitrine/contact?x=1', { host: `localhost:${port}` });
  assert.equal(moved.status, 302);
  assert.equal(moved.headers.location, `http://vitrine.localhost:${port}/contact?x=1`);

  const list = json(await api('projects', { host: `localhost:${port}`, headers: { 'X-Forwarded-Proto': 'https' } }));
  assert.equal(list.projects.find((p) => p.name === 'vitrine').url, `https://vitrine.localhost:${port}/`);
});

test('les tentatives de sortie du dossier sont refusées', async () => {
  const { id } = json(await api('projects/attaque/deploys', { method: 'POST' }));
  for (const bad of ['../evil.txt', 'a/../../evil.txt', '..\\evil.txt', '']) {
    const put = await api(`deploys/${id}/files?path=${encodeURIComponent(bad)}`, { method: 'PUT', body: 'x' });
    assert.equal(put.status, 400, bad);
  }
  const abs = await api(`deploys/${id}/files?path=${encodeURIComponent('/etc/passwd')}`, { method: 'PUT', body: 'x' });
  assert.equal(abs.status, 200); // rangé dans le site, sous etc/passwd
  await api(`deploys/${id}`, { method: 'DELETE' });
  assert.equal(fs.existsSync(path.join(dataDir, 'evil.txt')), false);
  assert.equal(fs.existsSync(path.join(dataDir, 'tmp', 'evil.txt')), false);

  for (const url of ['/vitrine/..%2f..%2fproject.json', '/vitrine/%2e%2e/%2e%2e/project.json', '/vitrine/..%5c..%5cproject.json']) {
    const res = await request(url);
    assert.equal(res.status, 404, url);
    assert.doesNotMatch(res.text, /hookSecret/);
  }
  assert.equal((await request('/vitrine/%E0%A4%A')).status, 400);
  assert.equal((await api('projects/Pas_Valide/deploys', { method: 'POST' })).status, 400);
});

test('déploiement par zip : dossier racine retiré, entrées dangereuses écartées', async () => {
  const zip = makeZip([
    { name: 'mon-site/' },
    { name: 'mon-site/index.html', data: '<h1>Depuis un zip</h1>' },
    { name: 'mon-site/img/logo.svg', data: '<svg xmlns="http://www.w3.org/2000/svg"/>', store: true },
    { name: 'mon-site/lien', data: '/etc/passwd', mode: 0o120777 },
    { name: 'mon-site/__MACOSX/._index.html', data: 'bruit' },
  ]);
  const res = await api('projects/zippe/zip', { method: 'POST', body: zip });
  assert.equal(res.status, 201, res.text);
  assert.equal(json(res).deploy.files, 2);
  assert.match((await request('/zippe/')).text, /Depuis un zip/);
  assert.equal((await request('/zippe/img/logo.svg')).headers['content-type'], 'image/svg+xml');
  assert.equal((await request('/zippe/lien')).status, 404);

  const evil = makeZip([{ name: '../../evil.txt', data: 'x' }, { name: 'index.html', data: 'ok' }]);
  assert.equal((await api('projects/zippe2/zip', { method: 'POST', body: evil })).status, 400);
  assert.equal(fs.existsSync(path.join(dataDir, 'evil.txt')), false);
  assert.equal(app.store.get('zippe2'), null);

  assert.equal((await api('projects/zippe2/zip', { method: 'POST', body: 'pas un zip du tout, vraiment pas' })).status, 400);
});

test('limite de taille : envoi direct et bombe zip', async () => {
  const big = Buffer.alloc(1024 * 1024 + 10, 97);
  const { id } = json(await api('projects/gros/deploys', { method: 'POST' }));
  assert.equal((await api(`deploys/${id}/files?path=a.txt`, { method: 'PUT', body: big })).status, 413);

  const bomb = makeZip([{ name: 'index.html', data: Buffer.alloc(3 * 1024 * 1024, 0) }]);
  assert.ok(bomb.length < 1024 * 1024);
  assert.equal((await api('projects/bombe/zip', { method: 'POST', body: bomb })).status, 413);
  assert.equal(app.store.get('bombe'), null);
});

test('cache, Range et gzip', async () => {
  await deployFiles('media', { 'index.html': 'x'.repeat(5000), 'clip.bin': '0123456789' });

  const first = await request('/media/');
  assert.ok(first.headers.etag);
  const cached = await request('/media/', { headers: { 'If-None-Match': first.headers.etag } });
  assert.equal(cached.status, 304);

  const part = await request('/media/clip.bin', { headers: { Range: 'bytes=2-5' } });
  assert.equal(part.status, 206);
  assert.equal(part.text, '2345');
  assert.equal(part.headers['content-range'], 'bytes 2-5/10');
  assert.equal((await request('/media/clip.bin', { headers: { Range: 'bytes=-3' } })).text, '789');
  assert.equal((await request('/media/clip.bin', { headers: { Range: 'bytes=50-' } })).status, 416);

  const zipped = await request('/media/', { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(zipped.headers['content-encoding'], 'gzip');
  assert.equal(zlib.gunzipSync(zipped.buffer).toString(), 'x'.repeat(5000));

  const head = await request('/media/clip.bin', { method: 'HEAD' });
  assert.equal(head.headers['content-length'], '10');
  assert.equal(head.buffer.length, 0);
});

test('mode SPA via _redirects, et avertissement sans index.html', async () => {
  await deployFiles('appli', { 'index.html': '<div id="app">SPA</div>', '_redirects': '/*   /index.html   200\n' });
  const deep = await request('/appli/compte/reglages');
  assert.equal(deep.status, 200);
  assert.match(deep.text, /SPA/);

  const bare = await deployFiles('sans-index', { 'notes.txt': 'bonjour' });
  assert.match(bare.project.warning, /index\.html/);
  assert.equal((await request('/sans-index/')).status, 404);
  assert.equal((await request('/sans-index/notes.txt')).text, 'bonjour');
});

test('nouvelle version, historique limité, retour en arrière, suppression', async () => {
  const v1 = await deployFiles('versions', { 'index.html': 'v1' });
  const v2 = await deployFiles('versions', { 'index.html': 'v2' });
  assert.equal(v2.project.url, v1.project.url);
  assert.equal((await request('/versions/')).text, 'v2');

  const back = await api('projects/versions/rollback', { method: 'POST', body: JSON.stringify({ deploy: v1.deploy.id }) });
  assert.equal(back.status, 200);
  assert.equal((await request('/versions/')).text, 'v1');

  // keepDeploys = 2 : la version en ligne (v1) est conservée même si elle est ancienne.
  await deployFiles('versions', { 'index.html': 'v3' });
  const v4 = await deployFiles('versions', { 'index.html': 'v4' });
  assert.equal(v4.project.deploys.length, 2);
  const onDisk = fs.readdirSync(path.join(dataDir, 'projects', 'versions', 'deploys'));
  assert.equal(onDisk.length, 2);
  assert.equal((await api('projects/versions/rollback', { method: 'POST', body: JSON.stringify({ deploy: v1.deploy.id }) })).status, 404);

  assert.equal((await api('projects/versions', { method: 'DELETE' })).status, 200);
  assert.equal((await request('/versions/')).status, 404);
  assert.equal(fs.existsSync(path.join(dataDir, 'projects', 'versions')), false);
  assert.equal((await api('projects/versions', { method: 'DELETE' })).status, 404);
});

test('import Git, redéploiement et webhook', async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'quai-repo-'));
  const run = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
  run('init', '-q', '-b', 'main');
  run('config', 'user.email', 'test@example.com');
  run('config', 'user.name', 'Test');
  run('config', 'commit.gpgsign', 'false');
  fs.mkdirSync(path.join(repo, 'site'));
  fs.writeFileSync(path.join(repo, 'site', 'index.html'), 'git v1');
  fs.symlinkSync('/etc/passwd', path.join(repo, 'site', 'secret'));
  fs.writeFileSync(path.join(repo, 'README.md'), 'hors du site');
  run('add', '-A');
  run('commit', '-q', '-m', 'v1');

  assert.equal((await api('projects/depot/git', { method: 'POST', body: JSON.stringify({ url: 'ext::sh -c id' }) })).status, 400);
  assert.equal((await api('projects/depot/git', { method: 'POST', body: JSON.stringify({ url: 'https://example.com/x', branch: '--upload-pack=x' }) })).status, 400);

  const url = 'file://' + repo;
  const res = await api('projects/depot/git', { method: 'POST', body: JSON.stringify({ url, branch: 'main', dir: 'site' }) });
  assert.equal(res.status, 201, res.text);
  const { project } = json(res);
  assert.equal(project.git.dir, 'site');
  assert.equal((await request('/depot/')).text, 'git v1');
  assert.equal((await request('/depot/secret')).status, 404);
  assert.equal((await request('/depot/README.md')).status, 404);

  fs.writeFileSync(path.join(repo, 'site', 'index.html'), 'git v2');
  run('commit', '-q', '-am', 'v2');
  assert.equal((await api('projects/depot/redeploy', { method: 'POST' })).status, 201);
  assert.equal((await request('/depot/')).text, 'git v2');

  fs.writeFileSync(path.join(repo, 'site', 'index.html'), 'git v3');
  run('commit', '-q', '-am', 'v3');
  assert.equal((await request('/_quai/hook/depot/mauvais-secret', { method: 'POST' })).status, 404);
  const hookPath = new URL(project.hookUrl).pathname;
  assert.equal((await request(hookPath, { method: 'POST', body: '{}' })).status, 202);
  for (let i = 0; i < 50 && (await request('/depot/')).text !== 'git v3'; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal((await request('/depot/')).text, 'git v3');
  fs.rmSync(repo, { recursive: true, force: true });
});

test('les projets survivent à un redémarrage', async () => {
  await app.stop();
  app = createApp({ port: 0, host: '127.0.0.1', dataDir, token: TOKEN, maxUploadMb: 1, keepDeploys: 2, gitAllowFile: true });
  ({ port } = await app.start());
  assert.match((await request('/vitrine/')).text, /Accueil/);
  assert.equal(fs.readdirSync(path.join(dataDir, 'tmp')).length, 0);
});
