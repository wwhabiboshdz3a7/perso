'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { readNetlifyConfig, rewriteHtml, rewriteCss, slugify } = require('../pages/build');

const BUILD = path.join(__dirname, '..', 'pages', 'build.js');

test('réécriture des chemins absolus : attributs HTML et url() CSS seulement', () => {
  const html = [
    '<link rel="stylesheet" href="/css/app.css">',
    "<a href='/'>Accueil</a> <a href=\"/#tarifs\">Tarifs</a> <a href=\"contact.html\">Contact</a>",
    '<img src="/img/a.png" srcset="/img/a.png 1x, /img/a@2x.png 2x">',
    '<script src="//cdn.exemple.com/x.js"></script><a href="https://exemple.com/">ext</a>',
    '<form action="/merci.html"><div style="background:url(/fond.png)"></div></form>',
    '<style>.a{background:url("/img/b.png")}</style>',
    '<script>const lien = \'<a href="/intact">x</a>\'; fetch("/api/intact");</script>',
    '<!-- <a href="/commentaire"> -->',
    '<pre>&lt;a href="/exemple-de-cours"&gt;</pre>',
  ].join('\n');
  const out = rewriteHtml(html, '/depot/site');
  assert.match(out, /href="\/depot\/site\/css\/app\.css"/);
  assert.match(out, /href='\/depot\/site\/'/);
  assert.match(out, /href="\/depot\/site\/#tarifs"/);
  assert.match(out, /href="contact\.html"/);
  assert.match(out, /srcset="\/depot\/site\/img\/a\.png 1x, \/depot\/site\/img\/a@2x\.png 2x"/);
  assert.match(out, /src="\/\/cdn\.exemple\.com\/x\.js"/);
  assert.match(out, /action="\/depot\/site\/merci\.html"/);
  assert.match(out, /style="background:url\(\/depot\/site\/fond\.png\)"/);
  assert.match(out, /url\("\/depot\/site\/img\/b\.png"\)/);
  assert.match(out, /href="\/intact"/);
  assert.match(out, /fetch\("\/api\/intact"\)/);
  assert.match(out, /href="\/commentaire"/);
  assert.match(out, /href="\/exemple-de-cours"/);

  assert.equal(rewriteCss('a{background:url(/x.png)} b{background:url(//h/x.png)} @import "/b.css";', '/p'),
    'a{background:url(/p/x.png)} b{background:url(//h/x.png)} @import "/p/b.css";');
});

test('lecture de netlify.toml', () => {
  const config = readNetlifyConfig(`
[build]
  publish = "public"   # dossier publié
  command = ""
[functions]
  directory = "netlify/functions"
[[redirects]]
  from = "/prive/*"
  to = "/404.html"
  status = 404
  force = true
[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
[[redirects]]
  from = "/ancien.html"
  to = "/#nouveau"
  status = 301
  force = true
`);
  assert.deepEqual(config, { publish: 'public', hidden: ['prive'], functions: true });
  assert.deepEqual(readNetlifyConfig('[build]\n  publish = "."\n'), { publish: '', hidden: [], functions: false });
  assert.deepEqual(readNetlifyConfig(null), { publish: '', hidden: [], functions: false });
  assert.equal(slugify('claude/Été_2026 !'), 'claude-ete-2026');
});

test('assemblage complet : branches, sites/ et zip', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'quai-pages-'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'quai-out-'));
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: 'pipe', encoding: 'utf8' });
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    fs.writeFileSync(path.join(repo, file), content);
  };
  const commit = (message) => {
    git('add', '-A');
    git('commit', '-q', '-m', message);
  };
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  git('config', 'commit.gpgsign', 'false');

  // Branche principale : le dossier sites/
  write('README.md', 'dépôt');
  write('sites/LISEZMOI.md', 'aide');
  write('sites/Mon Dossier/index.html', '<link href="/a.css" rel="stylesheet"><h1>Dossier</h1>');
  write('sites/Mon Dossier/a.css', 'body{}');
  write('sites/vide/notes.txt', 'pas de page');
  const zipSource = fs.mkdtempSync(path.join(os.tmpdir(), 'quai-zip-'));
  fs.mkdirSync(path.join(zipSource, 'racine', 'img'), { recursive: true });
  fs.writeFileSync(path.join(zipSource, 'racine', 'index.html'), '<h1>Zip</h1><img src="/img/x.svg">');
  fs.writeFileSync(path.join(zipSource, 'racine', 'img', 'x.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  fs.mkdirSync(path.join(repo, 'sites'), { recursive: true });
  execFileSync('zip', ['-qr', path.join(repo, 'sites', 'archive.zip'), 'racine'], { cwd: zipSource });
  commit('main');

  // Branche avec site à la racine, chemins absolus et dossier masqué
  git('checkout', '-q', '--orphan', 'vitrine');
  git('rm', '-rfq', '.');
  write('index.html', '<a href="/contact.html">Contact</a><form netlify action="/ok"></form>');
  write('contact.html', '<h1>Contact</h1>');
  write('prive/secret.txt', 'caché');
  write('netlify/functions/api.mjs', 'export default () => {}');
  write('netlify.toml', '[build]\n  publish = "."\n[[redirects]]\n  from = "/prive/*"\n  to = "/404.html"\n  status = 404\n  force = true\n');
  fs.symlinkSync('/etc/passwd', path.join(repo, 'lien'));
  commit('vitrine');

  // Branche dont le site est dans un sous-dossier
  git('checkout', '-q', '--orphan', 'feature/app');
  git('rm', '-rfq', '.');
  write('public/index.html', '<h1>App</h1><script>fetch("/.netlify/functions/api")</script>');
  write('brouillon.txt', 'hors publication');
  write('netlify.toml', '[build]\n  publish = "public"\n');
  commit('app');

  // Branche sans site, et branche dont le nom entre en conflit avec un dossier déposé
  git('checkout', '-q', '--orphan', 'sans-site');
  git('rm', '-rfq', '.');
  write('README.md', 'rien à publier');
  commit('sans site');
  git('checkout', '-q', '--orphan', 'archive');
  git('rm', '-rfq', '.');
  write('index.html', 'branche archive');
  commit('archive');
  git('checkout', '-q', 'main');

  const log = execFileSync('node', [BUILD, '--out', out], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_REPOSITORY: 'Moi/depot', QUAI_REF_PREFIX: 'refs/heads/', QUAI_MAIN_BRANCH: 'main' },
  });
  const read = (file) => fs.readFileSync(path.join(out, file), 'utf8');
  const exists = (file) => fs.existsSync(path.join(out, file));
  const manifest = JSON.parse(read('quai.json'));
  const bySlug = Object.fromEntries(manifest.projects.map((p) => [p.slug, p]));

  assert.deepEqual(Object.keys(bySlug).sort(), ['archive', 'feature-app', 'mon-dossier', 'vitrine']);
  assert.equal(manifest.url, 'https://moi.github.io/depot/');
  assert.equal(bySlug.vitrine.url, 'https://moi.github.io/depot/vitrine/');

  // vitrine : chemins réécrits, dossier masqué, fonctions et liens symboliques écartés
  assert.match(read('vitrine/index.html'), /href="\/depot\/vitrine\/contact\.html"/);
  assert.equal(exists('vitrine/prive'), false);
  assert.equal(exists('vitrine/netlify'), false);
  assert.equal(exists('vitrine/netlify.toml'), false);
  assert.equal(exists('vitrine/lien'), false);
  assert.equal(bySlug.vitrine.notes.length, 1);
  assert.match(bySlug.vitrine.notes[0], /formulaires/);

  // feature/app : seul le dossier publié sort, et l'appel de fonction est signalé
  assert.equal(exists('feature-app/index.html'), true);
  assert.equal(exists('feature-app/brouillon.txt'), false);
  assert.match(bySlug['feature-app'].notes[0], /fonctions serveur/);

  // sites/ : dossier, zip avec dossier racine retiré ; le zip l'emporte sur la branche du même nom
  assert.match(read('mon-dossier/index.html'), /href="\/depot\/mon-dossier\/a\.css"/);
  assert.match(read('archive/index.html'), /<h1>Zip<\/h1><img src="\/depot\/archive\/img\/x\.svg">/);
  assert.equal(bySlug.archive.source, 'zip');
  assert.equal(exists('archive/img/x.svg'), true);

  assert.equal(exists('vide'), false);
  assert.equal(exists('sans-site'), false);
  assert.equal(exists('main'), false);
  assert.equal(manifest.skipped.length, 3);
  assert.match(manifest.skipped.join('\n'), /sites\/vide/);
  assert.match(manifest.skipped.join('\n'), /branche archive/);
  assert.match(manifest.skipped.join('\n'), /branche sans-site/);

  assert.match(read('index.html'), /https:\/\/moi\.github\.io\/depot\/vitrine\//);
  assert.match(read('index.html'), /https:\/\/github\.com\/Moi\/depot\/upload\/main\/sites/);
  assert.match(read('404.html'), /"path":"\/depot\/vitrine\/"/);
  assert.match(log, /4 projet\(s\)/);

  // L'empreinte change quand une branche bouge, et seulement dans ce cas.
  const again = execFileSync('node', [BUILD, '--out', out], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_REPOSITORY: 'Moi/depot', QUAI_REF_PREFIX: 'refs/heads/' },
  });
  assert.ok(again);
  assert.equal(JSON.parse(read('quai.json')).fingerprint, manifest.fingerprint);
  write('sites/nouveau/index.html', 'nouveau');
  commit('nouveau site');
  execFileSync('node', [BUILD, '--out', out], {
    cwd: repo,
    env: { ...process.env, GITHUB_REPOSITORY: 'Moi/depot', QUAI_REF_PREFIX: 'refs/heads/' },
  });
  const updated = JSON.parse(read('quai.json'));
  assert.notEqual(updated.fingerprint, manifest.fingerprint);
  assert.equal(updated.projects.length, 5);

  for (const dir of [repo, out, zipSource]) fs.rmSync(dir, { recursive: true, force: true });
});
