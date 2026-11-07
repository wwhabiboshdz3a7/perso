// Test de fumée Playwright : écrans principaux avec réponses simulées
// (fonction Netlify réelle + faux Google, faux Overpass, faux Nominatim, tuiles factices).
// Usage : node tests/smoke.cjs [dossier-captures]
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 9741;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = process.argv[2] || path.join(ROOT, 'tests', 'shots');
const PASSWORD = 'Prospects-Toulouse-2026!';
const TILES = fs.readdirSync(path.join(__dirname, 'fixtures', 'tiles')).map((f) => fs.readFileSync(path.join(__dirname, 'fixtures', 'tiles', f)));

let failures = 0;
function check(cond, label) {
  if (cond) console.log(`  ok  ${label}`);
  else { failures++; console.log(`  ÉCHEC  ${label}`); }
}

async function waitServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`${BASE}/index.html`); if (r.ok) return; } catch { /* attente */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Serveur local injoignable');
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  try {
    await waitServer();
    const fn = await import(path.join(ROOT, 'netlify/functions/places.mjs'));
    const { hashPassword } = await import(path.join(ROOT, 'js/lib/hash.js'));
    const { createMockGoogle, TEST_KEY } = await import(path.join(ROOT, 'tests/fixtures/mock-google.mjs'));
    const google = createMockGoogle();
    const env = { GOOGLE_PLACES_API_KEY: TEST_KEY, ACCESS_PASSWORD_HASH: await hashPassword(PASSWORD, { iterations: 20000 }), TOKEN_SECRET: 'c'.repeat(64), MAX_REQUESTS_PER_DAY: '5000' };

    // Faux Overpass : les lieux fictifs du jeu de test, en éléments OSM
    const OSM_TAGS = { restaurant: { amenity: 'restaurant' }, boulangerie: { shop: 'bakery' }, coiffeur: { shop: 'hairdresser' }, barbier: { shop: 'hairdresser', hairdresser: 'barber' }, institut: { shop: 'beauty' }, garage: { shop: 'car_repair' } };
    const overpass = {
      elements: google.dataset.filter((p) => OSM_TAGS[p.cat] && p.status === 'OPERATIONAL').slice(0, 900).map((p, i) => ({
        type: 'node', id: 1000 + i, lat: p.lat, lon: p.lng,
        tags: { name: p.name, ...OSM_TAGS[p.cat], ...(i % 3 ? { phone: `+33 ${p.phone.slice(1) || '5 36 49 00 00'}` } : {}), ...(i % 4 === 0 ? { website: 'https://exemple-fictif.fr' } : {}), ...(i % 7 === 0 ? { 'contact:facebook': 'https://facebook.com/fictif' } : {}), 'addr:city': 'Toulouse', 'addr:postcode': '31000', 'addr:street': 'Rue Fictive', 'addr:housenumber': String(i % 90 + 1) },
      })),
    };

    const browser = await chromium.launch();
    const errors = [];

    async function setup(context) {
      await context.route('https://tile.openstreetmap.org/**', (route) => {
        const m = route.request().url().match(/\/(\d+)\/(\d+)\/(\d+)\.png/);
        const i = m ? (Number(m[2]) * 7 + Number(m[3]) * 13) % TILES.length : 0;
        route.fulfill({ status: 200, contentType: 'image/png', body: TILES[i], headers: { 'Access-Control-Allow-Origin': '*' } });
      });
      await context.route('https://nominatim.openstreetmap.org/**', (route) => route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify([{ display_name: 'Place Wilson, Toulouse, Haute-Garonne, France', name: 'Place Wilson', lat: '43.6052', lon: '1.4478', boundingbox: ['43.6040', '43.6064', '1.4460', '1.4496'] }]),
      }));
      await context.route(/overpass/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(overpass) }));
      await context.route(`${BASE}/api/places`, async (route) => {
        const req = route.request();
        const headers = await req.allHeaders();
        const request = new Request(`${BASE}/api/places`, { method: req.method(), headers, body: req.method() === 'POST' ? req.postData() : undefined });
        const res = await fn.handle(request, { env, fetch: google.fetch, quotaStore: null, ip: '127.0.0.1' });
        route.fulfill({ status: res.status, contentType: 'application/json', body: await res.text() });
      });
    }

    function watch(page, label) {
      page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${label}] ${m.text()}`); });
      page.on('pageerror', (e) => errors.push(`[${label}] ${e.message}`));
    }

    // ------------------------------------------------------------------ 1440
    console.log('Bureau 1440 × 900');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, locale: 'fr-FR', colorScheme: 'dark' });
    await setup(ctx);
    const page = await ctx.newPage();
    watch(page, '1440');
    await page.goto(BASE);
    await page.waitForSelector('html[data-ready="true"]');
    await page.waitForTimeout(600);
    check(await page.locator('#estimate').innerText().then((t) => /requêtes/.test(t)), 'estimation du coût affichée avant lancement');
    await page.screenshot({ path: path.join(SHOTS, '01-accueil-1440.png') });

    // Recherche de lieu (Nominatim simulé)
    await page.fill('#place-q', 'Place Wilson');
    await page.press('#place-q', 'Enter');
    await page.waitForTimeout(400);
    check((await page.locator('#zone-info').innerText()).includes('Place Wilson'), 'recherche de lieu en ligne (Nominatim)');

    // Quartier rapide + recherche Google avec connexion
    await page.click('#quick-places button:has-text("Capitole")');
    await page.click('#run');
    await page.waitForSelector('#login-dialog[open]');
    await page.fill('#ld-pw', 'mauvais');
    await page.click('#ld-ok');
    await page.waitForFunction(() => document.querySelector('#ld-msg').textContent.length > 0);
    check((await page.locator('#ld-msg').innerText()).includes('incorrect'), 'mauvais mot de passe refusé');
    await page.fill('#ld-pw', PASSWORD);
    await page.click('#ld-ok');
    await page.waitForSelector('#progress:not([hidden])');
    await page.waitForSelector('#progress', { state: 'hidden', timeout: 60000 });
    await page.waitForTimeout(500);
    const total = Number((await page.locator('#kpi-total').innerText()).replace(/\D/g, ''));
    const rows = await page.locator('#results-body tr').count();
    check(total > 30, `recherche Google simulée : ${total} établissements`);
    check(rows > 10, `tableau rempli (${rows} lignes)`);
    check(await page.locator('#data-attribution .google-attr').count() === 1, 'attribution « Google Maps » affichée');
    check((await page.locator('.leaflet-control-attribution').innerText()).includes('Google Maps'), 'attribution Google sur la carte');
    check(await page.locator('#results-body .badge--site').count() === 0, 'filtre par défaut : pas de « A un site »');
    await page.screenshot({ path: path.join(SHOTS, '02-resultats-google-1440.png') });
    await page.locator('.results').screenshot({ path: path.join(SHOTS, '03-tableau-1440.png') });

    // Fiche prospect
    await page.locator('#results-body tr').first().locator('.r-name-btn').click();
    await page.waitForSelector('#drawer[open]');
    check((await page.locator('#d-text').innerText()).includes('NEXORA'), 'script d\'appel personnalisé');
    await page.click('label.status-opt:has-text("Intéressé")');
    await page.fill('#d-notes', 'Rappeler après le service de midi, intéressé par la réservation en ligne.');
    await page.waitForTimeout(500);
    await page.click('#d-tab-email');
    check((await page.locator('#d-subject').innerText()).length > 10, 'email personnalisé (objet)');
    await page.screenshot({ path: path.join(SHOTS, '04-fiche-1440.png') });
    await page.click('#d-close');

    // Ajouter les chauds + CRM
    await page.click('#add-hot');
    await page.waitForTimeout(300);
    await page.click('#tab-crm');
    await page.waitForSelector('#crm-list .crm-card');
    const cards = await page.locator('#crm-list .crm-card').count();
    check(cards > 1, `CRM : ${cards} prospects suivis`);
    await page.screenshot({ path: path.join(SHOTS, '05-crm-1440.png') });

    // Export CSV (liste d'appel complète)
    await page.click('#tab-search');
    await page.click('#export-btn');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-export="csv-full"]')]);
    const csv = fs.readFileSync(await dl.path(), 'utf8');
    check(csv.charCodeAt(0) === 0xfeff && csv.split('\r\n')[0].includes('Nom;Catégorie;Note'), 'CSV Excel : BOM + séparateur « ; »');

    // Session d'appels
    await page.click('#session-btn');
    await page.waitForSelector('#drawer[open] .d-session');
    await page.click('[data-outcome="noanswer"]');
    await page.waitForTimeout(300);
    check((await page.locator('.d-session').innerText()).includes('2 /'), 'session d\'appels : passage au suivant');
    await page.keyboard.press('Escape');

    // Mode OpenStreetMap
    await page.click('label.seg__opt:has-text("OpenStreetMap")');
    await page.click('#run');
    await page.waitForSelector('#progress', { state: 'hidden', timeout: 30000 });
    await page.waitForTimeout(400);
    check(await page.locator('#verify-btn').isVisible(), 'mode OSM : bouton « Vérifier avec Google »');
    check(Number((await page.locator('#kpi-total').innerText()).replace(/\D/g, '')) > 10, 'mode OSM : résultats');
    await page.click('#verify-btn');
    await page.click('dialog.modal[open] button[value="yes"]');
    await page.waitForSelector('#progress', { state: 'hidden', timeout: 30000 });
    await page.waitForTimeout(300);
    check((await page.locator('#results-body').innerText()).includes('vérifié Google'), 'vérification OSM → Google');
    await page.screenshot({ path: path.join(SHOTS, '06-osm-1440.png') });

    // Réglages + générateur d'empreinte
    await page.click('#tab-settings');
    await page.fill('#gen-pw', 'Un-Mot-De-Passe-Solide-42');
    await page.fill('#gen-pw2', 'Un-Mot-De-Passe-Solide-42');
    await page.click('#gen-form button[type="submit"]');
    await page.waitForSelector('#gen-out:not([hidden])');
    const hash = await page.locator('#gen-hash').innerText();
    check(/^pbkdf2_sha256\$210000\$/.test(hash) && await fn.verifyPassword('Un-Mot-De-Passe-Solide-42', hash), 'empreinte générée dans le navigateur, reconnue par la fonction');
    await page.screenshot({ path: path.join(SHOTS, '07-reglages-1440.png'), fullPage: true });
    await ctx.close();

    // ------------------------------------------------------------------ 390
    console.log('Mobile 390 × 844');
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fr-FR', colorScheme: 'dark' });
    await setup(m);
    const mp = await m.newPage();
    watch(mp, '390');
    await mp.goto(BASE);
    await mp.waitForSelector('html[data-ready="true"]');
    await mp.waitForTimeout(500);
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow <= 0, `pas de défilement horizontal (écart ${overflow}px)`);
    await mp.screenshot({ path: path.join(SHOTS, '08-accueil-390.png') });
    await mp.click('#demo-btn');
    await mp.waitForTimeout(900);
    const overflow2 = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow2 <= 0, `résultats sans défilement horizontal (écart ${overflow2}px)`);
    await mp.locator('#results').scrollIntoViewIfNeeded();
    await mp.screenshot({ path: path.join(SHOTS, '09-resultats-390.png') });
    await mp.locator('#results-body tr').first().locator('.r-name-btn').click();
    await mp.waitForSelector('#drawer[open]');
    await mp.waitForTimeout(400);
    await mp.screenshot({ path: path.join(SHOTS, '10-fiche-390.png') });
    await mp.keyboard.press('Escape');
    await mp.click('#tab-crm');
    await mp.waitForTimeout(300);
    await mp.screenshot({ path: path.join(SHOTS, '11-crm-390.png') });
    await m.close();

    await browser.close();
    check(errors.length === 0, `aucune erreur console${errors.length ? ` :\n    ${errors.join('\n    ')}` : ''}`);
  } finally {
    server.kill();
  }
  console.log(failures ? `\n${failures} échec(s)` : '\nTout est vert.');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
