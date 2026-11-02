// Tests de bout en bout de Nour : Playwright + faux fournisseur compatible OpenAI.
//
//   npm install --no-save playwright && npx playwright install chromium
//   node tests/e2e.cjs            # tous les scénarios
//   node tests/e2e.cjs mémoire    # seulement ceux dont le nom contient « mémoire »
//
// Le script lance lui-même trois serveurs locaux :
//   - le site statique (python3 -m http.server)            port E2E_PORT      (défaut 9301)
//   - le faux fournisseur (tests/mock-openai.mjs)            port E2E_PORT + 1
//   - le site + la fonction Netlify (tests/serveur-local.mjs) port E2E_PORT + 2
// Les captures d'écran vont dans E2E_SHOTS (défaut : dossier temporaire du système).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert/strict');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.E2E_PORT || 9301);
const SHOTS = process.env.E2E_SHOTS || fs.mkdtempSync(path.join(os.tmpdir(), 'nour-captures-'));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'nour-e2e-'));
const BASE = `http://127.0.0.1:${PORT}/`;
const MOCK = `http://127.0.0.1:${PORT + 1}`;
const PROXY = `http://127.0.0.1:${PORT + 2}/`;
const ONLY = process.argv[2] || '';

// Mot de passe d'accès de test « acces-nour-2026 » (empreinte produite par scripts/hash-password.mjs).
const TEST_PASSWORD_HASH = 'pbkdf2-sha256$50000$Jgg6pz6iB4LuqkXNmcjQAw==$vBSPlEXkGX03TOUFka5LiaB09ntapRLp/TGFzYORlGU=';

const children = [];
function launch(cmd, args, env = {}) {
  const child = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  child.stderr.on('data', (d) => { err += d; });
  child.on('exit', (code) => { if (code && !child.stopping) console.error(`${cmd} ${args.join(' ')} s'est arrêté (${code})\n${err}`); });
  children.push(child);
  return child;
}
async function waitFor(url) {
  for (let i = 0; i < 100; i++) {
    try { await fetch(url); return; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  throw new Error(`serveur injoignable : ${url}`);
}
async function startServers() {
  launch('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1']);
  launch(process.execPath, ['tests/mock-openai.mjs', String(PORT + 1)]);
  launch(process.execPath, ['tests/serveur-local.mjs', String(PORT + 2)], {
    PROVIDER_BASE_URL: `${MOCK}/v1`,
    PROVIDER_API_KEY: 'cle-valide',
    ACCESS_PASSWORD_HASH: TEST_PASSWORD_HASH,
    TOKEN_SECRET: 'secret-de-test-tres-long-0123456789abcdef',
    PROVIDER_DEFAULT_MODEL: 'qwen/qwen3-32b',
    RATE_LIMIT_PER_MINUTE: '500',
  });
  await Promise.all([waitFor(BASE), waitFor(`${MOCK}/__mock/reset`), waitFor(PROXY)]);
}
function stopServers() { for (const c of children) { c.stopping = true; c.kill(); } }

const results = [];
const consoleErrors = [];
let expectNetErrors = false;

function track(page, label) {
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const t = m.text();
    if (expectNetErrors && /Failed to load resource|ERR_INTERNET_DISCONNECTED|net::ERR/.test(t)) return;
    consoleErrors.push(`[${label}] ${m.type()}: ${t}`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`[${label}] pageerror: ${e.message}`));
}

async function test(name, fn) {
  if (ONLY && !name.includes(ONLY)) return;
  const t0 = Date.now();
  try {
    await fn();
    results.push(['ok', name, Date.now() - t0]);
    console.log(`ok   ${name} (${Date.now() - t0} ms)`);
  } catch (e) {
    results.push(['FAIL', name, Date.now() - t0, e.message]);
    console.log(`FAIL ${name}\n     ${e.stack.split('\n').slice(0, 4).join('\n     ')}`);
  }
}

async function mockReset() { await fetch(`${MOCK}/__mock/reset`); }
async function mockLast() { return (await fetch(`${MOCK}/__mock/last`)).json(); }

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: opts.mobile ? 2 : 1,
    isMobile: !!opts.mobile,
    hasTouch: !!opts.mobile,
    colorScheme: opts.light ? 'light' : 'dark',
    permissions: ['clipboard-read', 'clipboard-write'],
    acceptDownloads: true,
    serviceWorkers: 'allow',
  });
  const page = await ctx.newPage();
  track(page, opts.label || 'page');
  await page.goto(opts.url || BASE);
  await page.waitForSelector('html.ready');
  return { ctx, page };
}

/** Configure la connexion par l'interface (fournisseur « URL personnalisée »). */
async function configureUI(page, { key = 'cle-valide' } = {}) {
  await page.click('[data-setup-provider="custom"]');
  await page.waitForSelector('#dlg-settings[open]');
  await page.fill('#base-url', `${MOCK}/v1`);
  await page.dispatchEvent('#base-url', 'change');
  await page.fill('#api-key', key);
  await page.dispatchEvent('#api-key', 'change');
  await page.click('[data-test]');
  await page.waitForSelector('[data-status][data-kind="ok"]', { timeout: 5000 });
  await page.click('#dlg-settings .modal-foot [data-close]');
  await page.waitForSelector('#dlg-settings', { state: 'detached' });
}

/** Configure directement le stockage (plus rapide) puis recharge. */
async function configureFast(page, { key = 'cle-valide', model = 'openai/gpt-oss-120b' } = {}) {
  await page.evaluate(({ MOCK, key, model }) => {
    const s = JSON.parse(localStorage.getItem('nour.settings') || '{}');
    s.onboarded = true;
    s.connection = { ...(s.connection || {}), mode: 'browser', provider: 'custom', baseUrl: `${MOCK}/v1`, model };
    localStorage.setItem('nour.settings', JSON.stringify(s));
    localStorage.setItem('nour.keys', JSON.stringify({ custom: key }));
  }, { MOCK, key, model });
  await page.reload();
  await page.waitForSelector('html.ready');
}

async function sendMessage(page, text) {
  await page.fill('#composer-input', text);
  await page.press('#composer-input', 'Enter');
}

async function waitDone(page) {
  await page.waitForFunction(() => !document.querySelector('.msg.streaming') && document.querySelector('#send-btn:not(.is-stop)'), null, { timeout: 15000 });
}

async function lastAssistantText(page) {
  return page.locator('.msg-assistant').last().locator('[data-content]').innerText();
}

async function setKey(page, key) {
  await page.click('#conn-status');
  await page.waitForSelector('#dlg-settings[open]');
  await page.fill('#api-key', key);
  await page.dispatchEvent('#api-key', 'change');
  await page.click('#dlg-settings .modal-foot [data-close]');
  await page.waitForSelector('#dlg-settings', { state: 'detached' });
}

async function noHorizontalScroll(page) {
  const r = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, win: window.innerWidth, thread: document.querySelector('#thread').scrollWidth, threadW: document.querySelector('#thread').clientWidth }));
  assert.ok(r.doc <= r.win + 1, `défilement horizontal du document : ${r.doc} > ${r.win}`);
  assert.ok(r.thread <= r.threadW + 1, `défilement horizontal du fil : ${r.thread} > ${r.threadW}`);
}

(async () => {
  await startServers();
  const browser = await chromium.launch();

  await test('accueil sans configuration : fournisseurs proposés, zéro erreur', async () => {
    const { ctx, page } = await newPage(browser, { label: 'accueil' });
    assert.equal(await page.locator('.provider-card').count(), 10);
    await page.screenshot({ path: `${SHOTS}/01-accueil-desktop.png` });
    await ctx.close();
  });

  await test('configuration du fournisseur par l’interface et premier échange', async () => {
    await mockReset();
    const { ctx, page } = await newPage(browser, { label: 'config' });
    await configureUI(page);
    const model = await page.locator('#model-chip-label').innerText();
    assert.equal(model, 'gpt-oss-120b', 'modèle suggéré automatiquement');
    assert.equal(await page.locator('#conn-status').getAttribute('data-state'), 'ok');
    await page.waitForSelector('.suggestion');
    await page.screenshot({ path: `${SHOTS}/02-accueil-configure-desktop.png` });
    await sendMessage(page, 'Bonjour Nour');
    await waitDone(page);
    assert.match(await lastAssistantText(page), /Vous avez écrit : « Bonjour Nour »/);
    const last = await mockLast();
    assert.equal(last.model, 'openai/gpt-oss-120b');
    assert.equal(last.stream, true);
    assert.equal(last.temperature, 0.7);
    assert.match(await page.locator('#token-est').innerText(), /≈ \d+ jetons/);
    assert.equal(last.messages[0].role, 'system');
    assert.match(last.messages[0].content, /Nour/);
    assert.match(last.messages[0].content, /Ibrahim/);
    assert.equal(await page.locator('.conv-item').count(), 1);
    assert.equal(await page.locator('#conv-title').innerText(), 'Bonjour Nour');
    await ctx.close();
  });

  await test('rendu progressif, arrêt, régénération, versions', async () => {
    const { ctx, page } = await newPage(browser, { label: 'stream' });
    await configureFast(page);
    await sendMessage(page, 'Réponds lent');
    await page.waitForSelector('.msg.streaming .md');
    const lengths = [];
    for (let i = 0; i < 6; i++) {
      lengths.push((await page.locator('.msg.streaming .md').innerText().catch(() => '')).length);
      await page.waitForTimeout(250);
    }
    assert.ok(lengths[5] > lengths[0] && lengths[3] > lengths[1], `texte croissant attendu : ${lengths}`);
    assert.equal(await page.locator('#send-btn').getAttribute('aria-label'), 'Arrêter la génération');
    await page.click('#send-btn');
    await waitDone(page);
    const stopped = await lastAssistantText(page);
    assert.match(await page.locator('.msg-assistant').last().locator('[data-state]').innerText(), /interrompu/);
    assert.ok(!/mot80/.test(stopped), 'la génération doit être interrompue');
    // Échap arrête aussi
    await page.click('[data-act="regenerate"]');
    await page.waitForSelector('.msg.streaming .md');
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await waitDone(page);
    assert.match(await page.locator('.pager').innerText(), /2\/2/);
    await page.click('[data-act="prev"]');
    assert.match(await page.locator('.pager').innerText(), /1\/2/);
    await ctx.close();
  });

  await test('régénérer et modifier un message puis repartir de là', async () => {
    await mockReset();
    const { ctx, page } = await newPage(browser, { label: 'edit' });
    await configureFast(page);
    await sendMessage(page, 'Premier message');
    await waitDone(page);
    await sendMessage(page, 'Deuxième message');
    await waitDone(page);
    const before = await lastAssistantText(page);
    await page.click('.msg-assistant.is-last [data-act="regenerate"]');
    await waitDone(page);
    const after = await lastAssistantText(page);
    assert.notEqual(before, after);
    assert.match(await page.locator('.pager').innerText(), /2\/2/);
    // Modifier le premier message : la suite est remplacée
    await page.locator('.msg-user').first().hover();
    await page.locator('.msg-user').first().locator('[data-act="edit"]').click();
    await page.fill('.edit-box textarea', 'Premier message modifié');
    await page.click('[data-edit="send"]');
    await waitDone(page);
    assert.equal(await page.locator('.msg').count(), 2);
    assert.match(await lastAssistantText(page), /Premier message modifié/);
    const last = await mockLast();
    assert.equal(last.messages.filter((m) => m.role !== 'system').length, 1);
    // Flèche haut dans la zone vide : modifier le dernier message
    await page.focus('#composer-input');
    await page.keyboard.press('ArrowUp');
    await page.waitForSelector('.edit-box textarea');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.edit-box', { state: 'detached' });
    await ctx.close();
  });

  await test('persistance après rechargement et recherche', async () => {
    const { ctx, page } = await newPage(browser, { label: 'persist' });
    await configureFast(page);
    await sendMessage(page, 'Note sur les flamants roses');
    await waitDone(page);
    const url = page.url();
    assert.match(url, /#\/c\//);
    await page.reload();
    await page.waitForSelector('html.ready');
    await page.waitForSelector('.msg-assistant');
    assert.match(await page.locator('.msg-user .bubble').first().innerText(), /flamants roses/);
    assert.equal(await page.locator('.conv-item a[aria-current="page"]').count(), 1);
    await page.click('[data-action="new-chat"]');
    await page.waitForSelector('.welcome');
    await page.keyboard.press('Control+K');
    await page.waitForSelector('#search-input:focus');
    await page.keyboard.type('flamants');
    await page.waitForSelector('.conv-item mark');
    await page.keyboard.press('Enter');
    await page.waitForSelector('.msg-user');
    await ctx.close();
  });

  await test('barre latérale : épingler, renommer, supprimer, masquer', async () => {
    const { ctx, page } = await newPage(browser, { label: 'barre' });
    await configureFast(page);
    await sendMessage(page, 'Plan marketing');
    await waitDone(page);
    await page.click('[data-action="new-chat"]');
    await sendMessage(page, 'Liste de courses');
    await waitDone(page);
    const itemMenu = async (title, label) => {
      const item = page.locator('.conv-item', { hasText: title });
      await item.hover();
      await item.locator('.item-menu-btn').click();
      await page.click(`.menu.floating [role="menuitem"]:has-text("${label}")`);
    };
    // Épingler : la conversation passe en tête, dans « Épinglées »
    await itemMenu('Plan marketing', 'Épingler');
    await page.waitForSelector('.toast >> text=Conversation épinglée');
    assert.match(await page.locator('.conv-group').first().textContent(), /Épinglées/);
    assert.match(await page.locator('.conv-item').first().innerText(), /Plan marketing/);
    assert.equal(await page.locator('.conv-item').first().locator('svg.pin').count(), 1);
    // Renommer
    await itemMenu('Plan marketing', 'Renommer');
    await page.waitForSelector('#prompt-input');
    await page.fill('#prompt-input', 'Stratégie NEXORA 2027');
    await page.press('#prompt-input', 'Enter');
    await page.waitForSelector('.conv-item >> text=Stratégie NEXORA 2027');
    // Persistance de l'épingle et du titre
    await page.reload();
    await page.waitForSelector('html.ready');
    assert.match(await page.locator('.conv-item').first().innerText(), /Stratégie NEXORA 2027/);
    assert.equal(await page.locator('.conv-item').first().locator('svg.pin').count(), 1);
    // Supprimer (avec confirmation)
    await itemMenu('Liste de courses', 'Supprimer');
    await page.click('#dlg-confirm [data-ok]');
    await page.waitForSelector('.conv-item >> text=Liste de courses', { state: 'detached' });
    assert.equal(await page.locator('.conv-item').count(), 1);
    // Masquer / afficher la barre latérale au clavier : un seul bouton visible à la fois
    assert.equal(await page.locator('#sidebar-toggle').isVisible(), false);
    await page.keyboard.press('Control+B');
    await page.waitForFunction(() => document.querySelector('#app').dataset.sidebar === 'closed');
    assert.equal(await page.locator('#sidebar-toggle').isVisible(), true);
    await page.focus('#sidebar-toggle');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('#app').dataset.sidebar === 'open');
    assert.equal(await page.evaluate(() => document.activeElement.closest('.sidebar-top') !== null), true, 'le focus suit le bouton de la barre latérale');
    await ctx.close();
  });

  await test('Markdown, code coloré, copie, tableau, KaTeX', async () => {
    const { ctx, page } = await newPage(browser, { label: 'markdown' });
    await configureFast(page);
    await sendMessage(page, 'Montre du markdown');
    await waitDone(page);
    const md = page.locator('.msg-assistant').last().locator('.md');
    assert.equal(await md.locator('h2').count(), 1);
    assert.equal(await md.locator('.table-wrap table tbody tr').count(), 2);
    assert.ok(await md.locator('pre code.hljs .hljs-keyword').count() > 0, 'coloration attendue');
    assert.match(await md.locator('.code-lang').innerText(), /js/);
    await page.waitForSelector('.md .katex-display', { timeout: 5000 });
    assert.ok(await md.locator('.katex').count() >= 2);
    await md.locator('.code-copy').click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(clip, /function salut/);
    assert.match(await md.locator('.code-copy').innerText(), /Copié/);
    await page.locator('.msg-assistant').last().locator('[data-act="copy"]').click();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /## Plan en trois temps/);
    await page.evaluate(() => { document.querySelector('#thread').scrollTop = 0; });
    await page.screenshot({ path: `${SHOTS}/03-markdown-desktop.png` });
    await noHorizontalScroll(page);
    await ctx.close();
  });

  await test('charge XSS neutralisée', async () => {
    const { ctx, page } = await newPage(browser, { label: 'xss' });
    await configureFast(page);
    await sendMessage(page, 'test xss');
    await waitDone(page);
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const md = [...document.querySelectorAll('.msg-assistant .md')].pop();
      return {
        xss: window.__xss,
        scripts: md.querySelectorAll('script').length,
        iframes: md.querySelectorAll('iframe').length,
        handlers: [...md.querySelectorAll('*')].filter((e) => [...e.attributes].some((a) => a.name.startsWith('on'))).length,
        jsLinks: [...md.querySelectorAll('a')].filter((a) => /^javascript:/i.test(a.getAttribute('href') || '')).length,
        imgs: md.querySelectorAll('img').length,
        imgLink: !!md.querySelector('a.img-link[href^="https://tracker"]'),
        safeLink: md.querySelector('a[href="https://example.org"]')?.getAttribute('rel'),
        bold: md.querySelectorAll('b').length,
        text: md.innerText,
      };
    });
    assert.equal(r.xss, undefined);
    assert.equal(r.scripts, 0);
    assert.equal(r.iframes, 0);
    assert.equal(r.handlers, 0);
    assert.equal(r.jsLinks, 0);
    assert.equal(r.imgs, 0, 'aucune image distante chargée');
    assert.ok(r.imgLink, 'image distante affichée comme lien');
    assert.match(r.safeLink, /noopener/);
    assert.equal(r.bold, 1);
    assert.match(r.text, /<img src=x onerror/);
    await ctx.close();
  });

  await test('raisonnement : reasoning_content et balises <think>', async () => {
    const { ctx, page } = await newPage(browser, { label: 'reasoning' });
    await configureFast(page);
    await sendMessage(page, 'raisonne un peu');
    await waitDone(page);
    const msg = page.locator('.msg-assistant').last();
    assert.match(await msg.locator('details.reasoning summary').innerText(), /Réflexion · \d+ mots/);
    assert.match(await msg.locator('[data-content] > .md').innerText(), /42/);
    await sendMessage(page, 'think');
    await waitDone(page);
    const m2 = page.locator('.msg-assistant').last();
    assert.match(await m2.locator('[data-content] > .md').innerText(), /^Voici la réponse finale/);
    await m2.locator('details.reasoning summary').click();
    assert.match(await m2.locator('details.reasoning .md').innerText(), /Réflexion cachée/);
    const last = await mockLast();
    const prev = last.messages.find((m) => m.role === 'assistant');
    assert.doesNotMatch(prev.content, /<think>/);
    await ctx.close();
  });

  await test('mémoire : ajout manuel, injection, propositions validées une par une', async () => {
    await mockReset();
    const { ctx, page } = await newPage(browser, { label: 'memoire' });
    await configureFast(page);
    await page.click('[data-action="open-memory"]');
    await page.fill('#mem-new', 'Aime le café serré le matin.');
    await page.press('#mem-new', 'Enter');
    await page.waitForSelector('#dlg-memory .row-item');
    await page.screenshot({ path: `${SHOTS}/06-memoire-desktop.png` });
    await page.click('#dlg-memory .modal-foot [data-close]');
    assert.equal(await page.locator('#memory-count').innerText(), '1');
    await sendMessage(page, 'Que sais-tu de moi ?');
    await waitDone(page);
    const last = await mockLast();
    assert.match(last.messages[0].content, /Aime le café serré/);
    // Propositions
    await page.click('#conv-menu-btn');
    await page.click('[data-action="suggest-memories"]');
    await page.waitForSelector('#dlg-review [data-keep]');
    assert.equal(await page.locator('#dlg-review .row-item').count(), 3);
    await page.screenshot({ path: `${SHOTS}/07-souvenirs-desktop.png` });
    await page.locator('#dlg-review .row-item').nth(0).locator('[data-keep]').click();
    await page.locator('#dlg-review .row-item').nth(1).locator('[data-skip]').click();
    await page.locator('#dlg-review .row-item').nth(2).locator('input').fill('Prépare une offre web pour les restaurants toulousains.');
    await page.locator('#dlg-review .row-item').nth(2).locator('[data-keep]').click();
    assert.equal(await page.locator('#dlg-review .accepted').count(), 2);
    await page.click('#dlg-review .modal-foot [data-close]');
    assert.equal(await page.locator('#memory-count').innerText(), '3');
    await page.click('[data-action="open-memory"]');
    const texts = await page.locator('#dlg-memory [data-text]').evaluateAll((els) => els.map((e) => e.value));
    assert.ok(texts.includes('Prépare une offre web pour les restaurants toulousains.'));
    assert.ok(!texts.some((t) => /réponses courtes/.test(t)), 'souvenir ignoré non enregistré');
    // Désactiver un souvenir : il n'est plus envoyé
    await page.locator('#dlg-memory [data-toggle]').first().uncheck();
    await page.click('#dlg-memory .modal-foot [data-close]');
    await sendMessage(page, 'Encore');
    await waitDone(page);
    const l2 = await mockLast();
    assert.doesNotMatch(l2.messages[0].content, /café serré/);
    assert.match(l2.messages[0].content, /NEXORA à Toulouse/);
    await ctx.close();
  });

  await test('pièces jointes : fichier texte et image', async () => {
    await mockReset();
    const { ctx, page } = await newPage(browser, { label: 'pj' });
    await configureFast(page, { model: 'meta-llama/llama-4-scout' });
    await page.setInputFiles('#file-input', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('Ligne 1 : budget 1200 €\nLigne 2 : livraison en mars\n```\nbloc\n```') });
    await page.waitForSelector('.chip-att');
    assert.match(await page.locator('.chip-att').innerText(), /notes\.txt/);
    await sendMessage(page, 'Analyse ce fichier');
    await waitDone(page);
    assert.match(await lastAssistantText(page), /J'ai lu le fichier « notes\.txt »/);
    const last = await mockLast();
    const u = last.messages[last.messages.length - 1];
    assert.match(u.content, /budget 1200 €/);
    assert.match(u.content, /````/, 'clôture de bloc allongée');
    assert.equal(await page.locator('.msg-user .att-file').count(), 1);
    const png = fs.readFileSync(path.join(ROOT, 'assets/icons/icon-192.png'));
    await page.setInputFiles('#file-input', { name: 'logo.png', mimeType: 'image/png', buffer: png });
    await page.waitForSelector('.chip-att img');
    await sendMessage(page, 'Décris cette image');
    await waitDone(page);
    assert.match(await lastAssistantText(page), /reçu 1 image/);
    const l2 = await mockLast();
    const u2 = l2.messages[l2.messages.length - 1];
    assert.ok(Array.isArray(u2.content));
    assert.match(u2.content[1].image_url.url, /^data:image\/png;base64,/);
    assert.equal(await page.locator('.msg-user .att-thumb img').count(), 1);
    // Fichier non pris en charge
    await page.setInputFiles('#file-input', { name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
    await page.waitForSelector('.toast[data-kind="error"]');
    await ctx.close();
  });

  await test('export JSON / Markdown, suppression, import', async () => {
    const { ctx, page } = await newPage(browser, { label: 'export' });
    await configureFast(page);
    await sendMessage(page, 'Conversation à sauvegarder');
    await waitDone(page);
    await page.click('[data-action="new-chat"]');
    await sendMessage(page, 'Seconde conversation');
    await waitDone(page);
    await page.click('#conv-menu-btn');
    const [dlMd] = await Promise.all([page.waitForEvent('download'), page.click('[data-action="export-md"]')]);
    const mdPath = path.join(TMP, 'export-test.md');
    await dlMd.saveAs(mdPath);
    const md = fs.readFileSync(mdPath, 'utf8');
    assert.match(md, /^# Seconde conversation/);
    assert.match(md, /### Ibrahim/);
    await page.click('[data-action="open-settings"]');
    await page.click('#tab-donnees');
    const [dlJson] = await Promise.all([page.waitForEvent('download'), page.click('[data-export="json"]')]);
    const jsonPath = path.join(TMP, 'export-test.json');
    await dlJson.saveAs(jsonPath);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    assert.equal(data.format, 'nour-export');
    assert.equal(data.conversations.length, 2);
    assert.doesNotMatch(JSON.stringify(data), /cle-valide/, 'la clé ne doit jamais être exportée');
    await page.click('[data-wipe]');
    await page.click('#dlg-confirm [data-ok]');
    await page.waitForSelector('.conv-empty');
    assert.equal(await page.locator('.conv-item').count(), 0);
    await page.setInputFiles('[data-import-file]', jsonPath);
    await page.waitForSelector('.toast >> text=Import terminé');
    assert.equal(await page.locator('.conv-item').count(), 2);
    await page.click('#dlg-settings .modal-foot [data-close]');
    await page.locator('.conv-item a').first().click();
    await page.waitForSelector('.msg-assistant');
    // Import d'un fichier invalide
    await page.click('[data-action="open-settings"]');
    await page.click('#tab-donnees');
    await page.setInputFiles('[data-import-file]', { name: 'faux.json', mimeType: 'application/json', buffer: Buffer.from('{"rien":1}') });
    await page.waitForSelector('.toast[data-kind="error"]');
    await ctx.close();
  });

  await test('messages d’erreur clairs : clé refusée, quota, panne, modèle, flux', async () => {
    expectNetErrors = true;
    const { ctx, page } = await newPage(browser, { label: 'erreurs' });
    await configureFast(page, { key: 'mauvaise-cle' });
    await sendMessage(page, 'Salut');
    await waitDone(page);
    let card = page.locator('.err-card').last();
    assert.match(await card.innerText(), /Clé API refusée/);
    assert.doesNotMatch(await card.innerText(), /mauvaise-cle/);
    assert.equal(await card.locator('[data-act="settings"]').count(), 1);
    await page.screenshot({ path: `${SHOTS}/08-erreur-cle-desktop.png` });
    await setKey(page, 'cle-quota');
    await page.click('.err-card [data-act="retry"]');
    await waitDone(page);
    card = page.locator('.err-card').last();
    assert.match(await card.innerText(), /Limite atteinte/);
    assert.match(await card.innerText(), /Réessayez dans 12 s/);
    await setKey(page, 'cle-panne');
    await page.click('.err-card [data-act="retry"]');
    await waitDone(page);
    assert.match(await page.locator('.err-card').last().innerText(), /Le fournisseur rencontre un problème/);
    await setKey(page, 'cle-valide');
    await page.click('.err-card [data-act="retry"]');
    await waitDone(page);
    assert.equal(await page.locator('.err-card').count(), 0);
    await sendMessage(page, 'erreur-flux');
    await waitDone(page);
    assert.match(await page.locator('.err-card').last().innerText(), /problème|interrompue/);
    // Modèle inexistant
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('nour.settings')); s.connection.model = 'modele-inexistant'; localStorage.setItem('nour.settings', JSON.stringify(s)); });
    await page.reload();
    await page.waitForSelector('html.ready');
    await sendMessage(page, 'Salut');
    await waitDone(page);
    assert.match(await page.locator('.err-card').last().innerText(), /Modèle ou adresse introuvable/);
    // Serveur injoignable
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('nour.settings')); s.connection.model = 'x'; s.connection.baseUrl = 'http://127.0.0.1:9399/v1'; localStorage.setItem('nour.settings', JSON.stringify(s)); });
    await page.reload();
    await page.waitForSelector('html.ready');
    await sendMessage(page, 'Salut');
    await waitDone(page);
    assert.match(await page.locator('.err-card').last().innerText(), /Connexion impossible/);
    await ctx.close();
    expectNetErrors = false;
  });

  await test('chiffrement de la clé par phrase secrète', async () => {
    const { ctx, page } = await newPage(browser, { label: 'crypto' });
    await configureFast(page);
    await page.click('#conn-status');
    await page.check('[data-enc-toggle]');
    await page.fill('#pass-1', 'phrase très secrète');
    await page.fill('#pass-2', 'phrase très secrète');
    await page.click('[data-enc-go]');
    await page.waitForSelector('[data-lock]');
    const stored = await page.evaluate(() => ({ plain: localStorage.getItem('nour.keys'), enc: localStorage.getItem('nour.keys.enc') }));
    assert.equal(stored.plain, null);
    assert.doesNotMatch(stored.enc, /cle-valide/);
    await page.click('#dlg-settings .modal-foot [data-close]');
    await page.reload();
    await page.waitForSelector('#dlg-unlock[open]');
    assert.equal(await page.locator('#conn-status').getAttribute('data-state'), 'locked');
    await page.fill('#unlock-pass', 'mauvaise phrase');
    await page.press('#unlock-pass', 'Enter');
    await page.waitForSelector('#dlg-unlock [data-err]:has-text("incorrecte")');
    await page.fill('#unlock-pass', 'phrase très secrète');
    await page.press('#unlock-pass', 'Enter');
    await page.waitForSelector('#dlg-unlock', { state: 'detached' });
    assert.equal(await page.locator('#conn-status').getAttribute('data-state'), 'ok');
    await sendMessage(page, 'Message après déverrouillage');
    await waitDone(page);
    assert.match(await lastAssistantText(page), /après déverrouillage/);
    await ctx.close();
  });


  await test('voix : dictée et lecture à voix haute (API du navigateur simulées)', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    await ctx.addInitScript(() => {
      class FakeRec {
        start() {
          setTimeout(() => {
            const r = [{ transcript: 'Bonjour depuis la dictée' }]; r.isFinal = true;
            this.onresult && this.onresult({ resultIndex: 0, results: [r] });
            setTimeout(() => this.onend && this.onend(), 60);
          }, 120);
        }
        stop() { this.onend && this.onend(); }
      }
      window.SpeechRecognition = FakeRec; window.webkitSpeechRecognition = FakeRec;
      window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
        speak(u) { window.__spoken = (window.__spoken || '') + u.text + ' '; setTimeout(() => u.onend && u.onend(), 30); },
        cancel() {}, getVoices() { return [{ voiceURI: 'fr-test', name: 'Amélie', lang: 'fr-FR' }]; }, addEventListener() {},
      } });
    });
    const page = await ctx.newPage();
    track(page, 'voix');
    await page.goto(BASE);
    await page.waitForSelector('html.ready');
    await configureFast(page);
    await page.click('#mic-btn');
    await page.waitForFunction(() => document.querySelector('#composer-input').value.includes('Bonjour depuis la dictée'));
    await page.waitForFunction(() => document.querySelector('#mic-btn').getAttribute('aria-pressed') === 'false');
    await page.press('#composer-input', 'Enter');
    await waitDone(page);
    await page.locator('.msg-assistant').last().locator('[data-act="speak"]').click();
    await page.waitForFunction(() => (window.__spoken || '').includes('Vous avez écrit'));
    await page.waitForFunction(() => document.querySelector('.msg-assistant [data-act="speak"]').getAttribute('aria-pressed') === 'false');
    await ctx.close();
  });

  await test('modèles de requêtes « / », bibliothèque, raccourcis, thème', async () => {
    const { ctx, page } = await newPage(browser, { label: 'slash' });
    await configureFast(page);
    await page.focus('#composer-input');
    await page.keyboard.type('/res');
    await page.waitForSelector('#slash .slash-item');
    assert.match(await page.locator('#slash .slash-item').first().innerText(), /\/resumer/);
    await page.screenshot({ path: `${SHOTS}/09-slash-desktop.png` });
    await page.keyboard.press('Enter');
    const v = await page.inputValue('#composer-input');
    assert.match(v, /^Résume le texte suivant/);
    const sel = await page.evaluate(() => { const t = document.querySelector('#composer-input'); return t.value.slice(t.selectionStart, t.selectionEnd); });
    assert.equal(sel, '{{texte}}');
    await page.fill('#composer-input', '');
    // Nouveau modèle dans la bibliothèque
    await page.click('[data-action="open-library"]');
    await page.click('#dlg-library [data-new]');
    await page.fill('#tpl-cmd', 'Compte Rendu');
    await page.fill('#tpl-title', 'Compte rendu');
    await page.fill('#tpl-body', 'Fais un compte rendu de : {{notes}}');
    await page.click('[data-tpl-form] button[type="submit"]');
    await page.waitForSelector('#dlg-library code:has-text("/compte-rendu")');
    await page.screenshot({ path: `${SHOTS}/10-bibliotheque-desktop.png` });
    await page.click('#dlg-library .modal-foot [data-close]');
    await page.focus('#composer-input');
    await page.keyboard.type('/compte');
    await page.waitForSelector('#slash .slash-item');
    await page.keyboard.press('Tab');
    assert.match(await page.inputValue('#composer-input'), /^Fais un compte rendu/);
    // Raccourcis
    await page.keyboard.press('Control+/');
    await page.waitForSelector('#dlg-shortcuts[open]');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#dlg-shortcuts', { state: 'detached' });
    await page.keyboard.press('Control+B');
    assert.equal(await page.getAttribute('#app', 'data-sidebar'), 'closed');
    await page.keyboard.press('Control+B');
    assert.equal(await page.getAttribute('#app', 'data-sidebar'), 'open');
    const theme = await page.getAttribute('html', 'data-theme');
    await page.click('#theme-btn');
    assert.notEqual(await page.getAttribute('html', 'data-theme'), theme);
    await page.keyboard.press('Control+,');
    await page.waitForSelector('#dlg-settings[open]');
    await page.keyboard.press('Escape');
    await ctx.close();
  });

  await test('réglages : personnalité, ton, invite système, préférences', async () => {
    await mockReset();
    const { ctx, page } = await newPage(browser, { label: 'perso' });
    await configureFast(page);
    await page.click('[data-action="open-settings"]');
    await page.click('#tab-assistant');
    await page.fill('#as-name', 'Lumen');
    await page.selectOption('#as-tone', 'direct');
    await page.click('[data-av="2"]');
    await page.screenshot({ path: `${SHOTS}/11-reglages-assistant-desktop.png` });
    await page.selectOption('#pr-pick', 'dev');
    await page.fill('#pr-text', 'Tu es {nom}, expert en Rust pour {prenom}.');
    await page.click('#tab-preferences');
    await page.screenshot({ path: `${SHOTS}/12-reglages-preferences-desktop.png` });
    await page.fill('#pf-max', '256');
    await page.dispatchEvent('#pf-max', 'change');
    await page.click('#dlg-settings .modal-foot [data-close]');
    assert.match(await page.locator('.welcome .eyebrow').innerText(), /Lumen/i);
    await page.selectOption('#persona-select', 'dev');
    await sendMessage(page, 'Bonjour');
    await waitDone(page);
    const last = await mockLast();
    assert.match(last.messages[0].content, /Tu es Lumen, expert en Rust pour Ibrahim/);
    assert.match(last.messages[0].content, /Ton direct/);
    assert.equal(last.max_tokens, 256);
    assert.match(await page.locator('.msg-assistant .who').innerText(), /Lumen/);
    await ctx.close();
  });

  await test('hors ligne grâce au service worker', async () => {
    const { ctx, page } = await newPage(browser, { label: 'offline', sw: true });
    await configureFast(page);
    await sendMessage(page, 'À relire hors ligne');
    await waitDone(page);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null || true);
    await page.reload();
    await page.waitForSelector('html.ready');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.waitForTimeout(500);
    expectNetErrors = true;
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector('html.ready');
    await page.waitForSelector('.msg-assistant');
    assert.match(await page.locator('.msg-user .bubble').first().innerText(), /relire hors ligne/);
    assert.equal(await page.locator('#offline-bar').isVisible(), true);
    await page.screenshot({ path: `${SHOTS}/13-hors-ligne-desktop.png` });
    await sendMessage(page, 'Envoi hors ligne');
    await waitDone(page);
    assert.match(await page.locator('.err-card').last().innerText(), /hors ligne/i);
    await ctx.setOffline(false);
    expectNetErrors = false;
    await ctx.close();
  });

  await test('mode serveur (fonction Netlify) : mot de passe faux puis juste, discussion relayée', async () => {
    await mockReset();
    expectNetErrors = true;
    const { ctx, page } = await newPage(browser, { label: 'proxy', url: PROXY });
    const csp = await page.evaluate(async () => (await fetch('/')).headers.get('content-security-policy'));
    assert.match(csp, /frame-ancestors 'none'/);
    await page.click('[data-setup-server]');
    await page.waitForSelector('#srv-pass');
    await page.fill('#srv-pass', 'faux mot de passe');
    await page.click('[data-login-form] button[type="submit"]');
    await page.waitForSelector('[data-status][data-kind="error"]');
    assert.match(await page.locator('[data-status]').innerText(), /Mot de passe incorrect/);
    await page.fill('#srv-pass', 'acces-nour-2026');
    await page.click('[data-login-form] button[type="submit"]');
    await page.waitForSelector('[data-logout]');
    await page.waitForSelector('#dlg-settings .model-opt');
    await page.screenshot({ path: `${SHOTS}/14-mode-serveur-desktop.png` });
    await page.click('#dlg-settings .modal-foot [data-close]');
    assert.equal(await page.locator('#conn-status').getAttribute('data-state'), 'ok');
    const keys = await page.evaluate(() => localStorage.getItem('nour.keys'));
    assert.equal(keys, null, 'aucune clé dans le navigateur en mode serveur');
    await sendMessage(page, 'Bonjour par le proxy');
    await waitDone(page);
    assert.match(await lastAssistantText(page), /Bonjour par le proxy/);
    const last = await mockLast();
    assert.equal(last.model, 'qwen/qwen3-32b', 'modèle par défaut du serveur');
    // Session expirée
    await page.evaluate(() => localStorage.setItem('nour.session', JSON.stringify({ token: 'faux.jeton', expiresAt: Date.now() + 99999 })));
    await sendMessage(page, 'Encore');
    await waitDone(page);
    assert.match(await page.locator('.err-card').last().innerText(), /Session expirée/);
    expectNetErrors = false;
    await ctx.close();
  });

  await test('mobile 390 px : tiroir, échange, pas de défilement horizontal', async () => {
    const { ctx, page } = await newPage(browser, { label: 'mobile', mobile: true });
    await page.screenshot({ path: `${SHOTS}/20-accueil-mobile.png` });
    await configureFast(page);
    await page.screenshot({ path: `${SHOTS}/21-accueil-configure-mobile.png` });
    await noHorizontalScroll(page);
    await sendMessage(page, 'Montre du markdown');
    await waitDone(page);
    await noHorizontalScroll(page);
    await page.evaluate(() => { document.querySelector('#thread').scrollTop = 0; });
    await page.screenshot({ path: `${SHOTS}/22-markdown-mobile.png` });
    await page.evaluate(() => { const t = document.querySelector('#thread'); t.scrollTop = t.scrollHeight; });
    await page.screenshot({ path: `${SHOTS}/23-markdown-bas-mobile.png` });
    await page.click('#sidebar-toggle');
    await page.waitForFunction(() => document.querySelector('#app').dataset.sidebar === 'open-mobile');
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${SHOTS}/24-tiroir-mobile.png` });
    assert.equal(await page.locator('.conv-item').count(), 1);
    await page.click('.scrim', { position: { x: 370, y: 400 } });
    await page.waitForFunction(() => document.querySelector('#app').dataset.sidebar === 'closed');
    await page.click('#model-chip');
    await page.waitForSelector('#dlg-model[open]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/25-modele-mobile.png` });
    await page.click('#dlg-model .modal-foot [data-close]');
    await page.click('#conv-menu-btn');
    await page.click('[data-action="open-shortcuts"]');
    await page.keyboard.press('Escape');
    await page.click('[data-action="new-chat"] >> visible=true');
    await page.waitForSelector('.welcome');
    await page.click('#sidebar-toggle');
    await page.click('#sidebar [data-action="open-settings"]');
    await page.waitForSelector('#dlg-settings[open]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/26-reglages-mobile.png` });
    await noHorizontalScroll(page);
    await ctx.close();
  });

  await test('thème clair : captures', async () => {
    const { ctx, page } = await newPage(browser, { label: 'clair', light: true });
    await configureFast(page);
    await page.screenshot({ path: `${SHOTS}/30-accueil-clair-desktop.png` });
    await sendMessage(page, 'Montre du markdown');
    await waitDone(page);
    await page.waitForSelector('.katex');
    await page.evaluate(() => { document.querySelector('#thread').scrollTop = 0; });
    await page.screenshot({ path: `${SHOTS}/31-markdown-clair-desktop.png` });
    await ctx.close();
    const m = await newPage(browser, { label: 'clair-mobile', light: true, mobile: true });
    await configureFast(m.page);
    await sendMessage(m.page, 'raisonne');
    await waitDone(m.page);
    await m.page.screenshot({ path: `${SHOTS}/32-clair-mobile.png` });
    await m.ctx.close();
  });

  await browser.close();
  stopServers();
  console.log('\n— Résumé —');
  const fails = results.filter((r) => r[0] !== 'ok');
  console.log(`${results.length - fails.length}/${results.length} scénarios réussis`);
  fails.forEach((f) => console.log(`FAIL ${f[1]} : ${f[3]}`));
  console.log(`Erreurs console : ${consoleErrors.length}`);
  console.log(`Captures : ${SHOTS}`);
  consoleErrors.forEach((e) => console.log('  ' + e));
  process.exit(fails.length || consoleErrors.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  stopServers();
  process.exit(1);
});
process.on('SIGINT', () => { stopServers(); process.exit(130); });
