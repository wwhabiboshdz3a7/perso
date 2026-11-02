// Tests dans un vrai navigateur (Chromium via Playwright) : mise en page réelle, site et bac à sable.
// npm run test:navigateur  (une fois : npx playwright install chromium)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { serve } from '../../scripts/serve.mjs';

let server;
let browser;
let BASE;

before(async () => {
  server = await serve({ port: 0 });
  BASE = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  server?.close();
});

/** Page vierge avec la librairie (UMD) chargée. */
async function blank(width = 1000) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  await page.goto(`${BASE}dist/sizes.json`);
  await page.setContent('<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>body{margin:0;font:20px/28px serif}</style></head><body></body></html>');
  await page.addScriptTag({ url: `${BASE}dist/kinetika.umd.min.js` });
  return page;
}

test('splitText : lignes justes avec un élément en ligne de plusieurs mots qui passe à la ligne', async () => {
  const page = await blank();
  const cases = await page.evaluate(() => {
    const K = window.kinetika;
    const html = {
      em: 'Un texte assez long pour tenir sur plusieurs lignes, avec un <em>passage en italique un peu long</em> au milieu de la phrase, puis la fin.',
      lien: 'Un texte assez long pour tenir sur plusieurs lignes, avec <a href="#x">un lien cliquable assez long</a> au milieu de la phrase, puis la fin.',
      imbrique: 'Début <strong>d’un passage <em>imbriqué sur</em> plusieurs mots qui</strong> continue encore un peu plus loin que prévu.',
    };
    const out = [];
    for (const [name, h] of Object.entries(html)) {
      for (const w of [600, 300, 180]) {
        const host = document.createElement('div');
        host.style.width = `${w}px`;
        host.innerHTML = `<p style="margin:0">${h}</p>`;
        document.body.append(host);
        const p = host.firstChild;
        const before = Math.round(p.getBoundingClientRect().height / 28);
        const s = K.splitText(p, { lines: true, words: true, chars: true });
        const heights = s.lines.map((l) => Math.round(l.getBoundingClientRect().height / 28));
        const after = Math.round(p.getBoundingClientRect().height / 28);
        out.push({ name, w, before, after, lines: s.lines.length, heights, text: s.lines.map((l) => l.textContent).join(' ') === p.querySelector('.kt-sr').textContent });
        s.revert();
        host.remove();
      }
    }
    return out;
  });
  for (const c of cases) {
    const label = `${c.name} à ${c.w}px`;
    assert.equal(c.after, c.before, `${label} : hauteur du paragraphe inchangée`);
    assert.equal(c.lines, c.before, `${label} : une .kt-line par ligne visuelle`);
    assert.ok(c.heights.every((h) => h === 1), `${label} : chaque ligne mesure une ligne (${c.heights})`);
    assert.ok(c.text, `${label} : texte complet et dans l’ordre`);
  }
  await page.close();
});

test('splitText : un lien découpé reste focalisable et n’est jamais sous aria-hidden', async () => {
  const page = await blank(300);
  const r = await page.evaluate(() => {
    document.body.innerHTML = '<p style="width:200px">Voir <a href="#x">la documentation complète du projet</a> ici</p>';
    window.kinetika.splitText('p', { lines: true, words: true });
    const links = [...document.querySelectorAll('a[href]')];
    const tabbable = links.filter((a) => a.tabIndex >= 0);
    return {
      parts: links.length,
      tabbable: tabbable.length,
      hiddenTabbable: tabbable.filter((a) => a.closest('[aria-hidden="true"]')).length,
      label: tabbable[0]?.getAttribute('aria-label'),
    };
  });
  assert.ok(r.parts >= 2, 'le lien est réparti sur plusieurs lignes');
  assert.equal(r.tabbable, 1, 'un seul arrêt clavier');
  assert.equal(r.hiddenTabbable, 0);
  assert.equal(r.label, 'la documentation complète du projet');
  await page.close();
});

test('moteur : une exception dans un rappel n’arrête pas les autres animations', async () => {
  const page = await blank();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const r = await page.evaluate(async () => {
    const K = window.kinetika;
    const good = { v: 0 };
    K.animate(good, { v: 100, duration: 400, ease: 'linear' });
    let n = 0;
    K.animate({ w: 0 }, { w: 1, duration: 300, onUpdate: () => { if (++n > 2) throw new Error('bug'); } });
    await new Promise((res) => setTimeout(res, 800));
    const fresh = { v: 0 };
    K.animate(fresh, { v: 10, duration: 100, ease: 'linear' });
    await new Promise((res) => setTimeout(res, 400));
    return { good: good.v, fresh: fresh.v };
  });
  assert.deepEqual(r, { good: 100, fresh: 10 });
  assert.deepEqual(errors, ['bug']);
  await page.close();
});

test('site : menu mobile à 390 px, liens visibles et cliquables', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(BASE);
  await page.evaluate(() => scrollTo(0, 500));
  await page.click('.burger');
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => {
    const nav = document.getElementById('nav');
    const links = [...nav.querySelectorAll('a')];
    const hit = links.filter((a) => { const q = a.getBoundingClientRect(); const el = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return el && a.contains(el); });
    return { height: nav.getBoundingClientRect().height, viewport: innerHeight, links: links.length, hit: hit.length };
  });
  assert.ok(r.height > r.viewport - 100, `le panneau couvre l’écran (${r.height} px)`);
  assert.equal(r.hit, r.links);
  await Promise.all([page.waitForURL(/\/api\/$/), page.click('#nav a[href$="api/"]')]);
  await page.close();
});

test('accueil : le titre reste visible si la librairie ne se charge pas', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/dist/kinetika.esm.js', (route) => route.abort());
  await page.goto(BASE);
  await page.waitForTimeout(2300);
  const opacity = await page.$eval('.hero__word', (h) => getComputedStyle(h).opacity);
  assert.equal(opacity, '1');
  await page.close();
});

test('bac à sable : aperçu isolé, code partagé non exécuté par « Réinitialiser », boucle infinie interrompue', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  await page.goto(`${BASE}bac-a-sable/?ex=premiers-pas`);
  await page.waitForFunction(() => document.querySelector('.CodeMirror')?.CodeMirror?.getValue().length > 0);
  assert.equal(await page.$eval('#frame', (f) => f.getAttribute('sandbox')), 'allow-scripts');

  // lien partagé qui tente d'écrire dans la page parente
  await page.evaluate(() => document.querySelector('.CodeMirror').CodeMirror.setValue("parent.document.title = 'piraté';"));
  await page.click('#share');
  await page.waitForFunction(() => location.hash.startsWith('#code='));
  const link = page.url();
  const victim = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  await victim.goto(link);
  await victim.waitForSelector('#notice:not([hidden])');
  assert.equal(await victim.$eval('#open', (b) => b.disabled), true);
  await victim.click('#reset');
  await victim.click('#trust');
  await victim.waitForTimeout(800);
  assert.notEqual(await victim.title(), 'piraté');
  await victim.close();

  // boucle infinie tapée avec la relance automatique
  await page.goto(`${BASE}bac-a-sable/?ex=premiers-pas`);
  await page.waitForFunction(() => document.querySelector('.CodeMirror')?.CodeMirror?.getValue().length > 0);
  await page.evaluate(() => { const cm = document.querySelector('.CodeMirror').CodeMirror; cm.setValue('let i = 0;\nwhile (i < 3) {}\n'); });
  await page.waitForFunction(() => [...document.querySelectorAll('#clog li')].some((li) => /Boucle interrompue/.test(li.textContent)), null, { timeout: 6000 });
  assert.equal(await page.evaluate(() => 1 + 1), 2, 'la page répond');
  await page.close();
});
