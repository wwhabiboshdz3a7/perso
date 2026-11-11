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
    // Le refus du mauvais mot de passe (401) est attendu : le navigateur le journalise quand même.
    let expected401 = 0;

    // Chaque contexte simule un appareil distinct (adresse IP propre pour la limitation de débit).
    async function setup(context, ip) {
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
        const res = await fn.handle(request, { env, fetch: google.fetch, quotaStore: null, ip });
        route.fulfill({ status: res.status, contentType: 'application/json', body: await res.text() });
      });
    }

    const tileZoom = (page) => page.evaluate(() => {
      const zs = [...document.querySelectorAll('#map img.leaflet-tile')].map((i) => Number((i.src.match(/\/(\d+)\/\d+\/\d+\.png/) || [])[1])).filter(Number.isFinite);
      return zs.length ? Math.max(...zs) : 0;
    });

    function watch(page, label) {
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        if (expected401 > 0 && /status of 401/.test(m.text())) { expected401--; return; }
        errors.push(`[${label}] ${m.text()}`);
      });
      page.on('pageerror', (e) => errors.push(`[${label}] ${e.message}`));
    }

    // ------------------------------------------------------------------ 1440
    console.log('Bureau 1440 × 900');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, locale: 'fr-FR', colorScheme: 'dark' });
    await setup(ctx, '203.0.113.10');
    const page = await ctx.newPage();
    watch(page, '1440');
    await page.goto(BASE);
    await page.waitForSelector('html[data-ready="true"]');
    await page.waitForTimeout(600);
    check(await page.locator('#estimate').innerText().then((t) => /requêtes|req\./.test(t)), 'estimation du coût affichée avant lancement');
    const runBox = await page.locator('#run').boundingBox();
    check(runBox && runBox.y > 0 && runBox.y + runBox.height <= 900, `bouton « Lancer » visible au premier écran (bas à ${Math.round(runBox.y + runBox.height)} px)`);
    check(/plafond/.test(await page.locator('#runbar-est').innerText()), 'pied collant : estimation résumée et pire cas (plafond)');
    check(await page.locator('#kpis').isHidden(), 'premier regard : pas de compteurs à zéro avant la recherche');
    check(await page.locator('.nx-scan').count() === 1, 'balayage de la zone affiché au repos');
    await page.screenshot({ path: path.join(SHOTS, '01-accueil-1440.png') });

    // Recherche de lieu (Nominatim simulé)
    await page.fill('#place-q', 'Place Wilson');
    await page.press('#place-q', 'Enter');
    await page.waitForTimeout(400);
    check((await page.locator('#zone-info').innerText()).includes('Place Wilson'), 'recherche de lieu en ligne (Nominatim)');

    // Quartier rapide + recherche Google avec connexion
    await page.click('#quick-places button:has-text("Capitole")');
    await page.waitForTimeout(400);
    const estText = await page.locator('#estimate').innerText();
    const estProbable = Number((estText.match(/≈\s*([\d\s\u202f]+)\s*requêtes/) || [])[1]?.replace(/\D/g, '') || NaN);
    // vue éloignée volontairement : la carte doit se recadrer sur les résultats
    await page.click('.leaflet-control-zoom-out');
    await page.waitForTimeout(350);
    await page.click('.leaflet-control-zoom-out');
    await page.waitForTimeout(500);
    const zoomBefore = await tileZoom(page);
    await page.click('#run');
    await page.waitForSelector('#login-dialog[open]');
    await page.fill('#ld-pw', 'mauvais');
    expected401 = 1;
    await page.click('#ld-ok');
    await page.waitForFunction(() => document.querySelector('#ld-msg').textContent.length > 0);
    check((await page.locator('#ld-msg').innerText()).includes('incorrect'), 'mauvais mot de passe refusé');
    await page.fill('#ld-pw', PASSWORD);
    await page.click('#ld-ok');
    await page.waitForSelector('#progress:not([hidden])');
    await page.waitForSelector('#progress', { state: 'hidden', timeout: 60000 });
    await page.waitForTimeout(900);
    const zoomAfter = await tileZoom(page);
    check(zoomAfter > zoomBefore, `carte recadrée sur les résultats (zoom ${zoomBefore} → ${zoomAfter})`);
    const total = Number((await page.locator('#kpi-total').innerText()).replace(/\D/g, ''));
    const rows = await page.locator('#results-body tr').count();
    check(total > 30, `recherche Google simulée : ${total} établissements`);
    check(rows > 10, `tableau rempli (${rows} lignes)`);
    check(await page.locator('#data-attribution .google-attr').count() === 1, 'attribution « Google Maps » affichée');
    check((await page.locator('.leaflet-control-attribution').innerText()).includes('Google Maps'), 'attribution Google sur la carte');
    check(await page.locator('#results-body .badge--site').count() === 0, 'filtre par défaut : pas de « A un site »');
    const realReq = Number((await page.locator('#kpi-cost').innerText()).replace(/\D/g, ''));
    check(Number.isFinite(estProbable) && realReq <= estProbable * 2 && realReq >= estProbable / 2, `estimation réaliste : ≈ ${estProbable} annoncées, ${realReq} consommées`);
    const clusters = await page.locator('.nx-cluster').count();
    const ranks = await page.locator('.nx-rank').count();
    check(clusters > 0 && clusters < 60 && ranks === 10, `carte lisible : ${clusters} grappes et 10 meilleurs numérotés (${ranks})`);
    check(await page.locator('.nx-scan').count() === 0, 'balayage retiré une fois les résultats affichés');
    await page.waitForTimeout(2500); // laisser le message de fin disparaître
    await page.screenshot({ path: path.join(SHOTS, '02-resultats-google-1440.png') });
    await page.locator('#results-title').scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, document.querySelector('#results').getBoundingClientRect().top - 84));
    await page.waitForTimeout(200);
    const rowH = await page.locator('#results-body tr').first().evaluate((tr) => tr.getBoundingClientRect().height);
    check(rowH <= 64, `tableau compact (lignes de ${Math.round(rowH)} px)`);
    const tblOver = await page.locator('.table-wrap').evaluate((w) => w.scrollWidth - w.clientWidth);
    check(tblOver <= 0, `tableau sans débordement horizontal (écart ${tblOver} px)`);
    await page.screenshot({ path: path.join(SHOTS, '03-tableau-1440.png') });

    // Fiche prospect
    await page.locator('#results-body tr').first().locator('.r-name-btn').click();
    await page.waitForSelector('#drawer[open]');
    check((await page.locator('#d-text').innerText()).includes('NEXORA'), 'script d\'appel personnalisé');
    await page.click('label.status-opt:has-text("Intéressé")');
    await page.fill('#d-notes', 'Rappeler après le service de midi, intéressé par la réservation en ligne.');
    await page.waitForTimeout(500);
    await page.click('#d-tab-email');
    check((await page.locator('#d-subject').innerText()).length > 10, 'email personnalisé (objet)');
    const closeBox = await page.locator('#d-close').boundingBox();
    check(closeBox && closeBox.y >= 0 && closeBox.y < 40, 'fiche : bouton Fermer toujours visible après défilement');
    await page.screenshot({ path: path.join(SHOTS, '04-fiche-1440.png') });
    await page.click('#d-close');

    // Ajouter les chauds + CRM
    await page.click('#add-hot');
    await page.waitForTimeout(300);
    await page.click('#tab-crm');
    await page.waitForSelector('#crm-list .crm-card');
    const cards = await page.locator('#crm-list .crm-card').count();
    check(cards > 1, `CRM : ${cards} fiches affichées`);
    check(await page.locator('#crm-more').isVisible(), 'CRM : affichage par pages (« Afficher plus »)');
    await page.screenshot({ path: path.join(SHOTS, '05-crm-1440.png') });

    // Export CSV (liste d'appel complète)
    await page.click('#tab-search');
    await page.click('#export-btn');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-export="csv-full"]')]);
    const csv = fs.readFileSync(await dl.path(), 'utf8');
    check(csv.charCodeAt(0) === 0xfeff && csv.split('\r\n')[0].includes('Nom;Catégorie;Note'), 'CSV Excel : BOM + séparateur « ; »');

    // Session d'appels : la fiche suivante repart du haut (nom et compteur visibles)
    await page.click('#session-btn');
    await page.waitForSelector('#drawer[open] .d-session');
    await page.evaluate(() => { document.querySelector('#drawer-body').scrollTop = 400; });
    await page.waitForTimeout(150);
    await page.click('[data-outcome="noanswer"]');
    await page.waitForTimeout(400);
    check((await page.locator('.d-session').innerText()).includes('2 /'), 'session d\'appels : passage au suivant');
    const sess = await page.evaluate(() => ({
      title: document.querySelector('#drawer-title').getBoundingClientRect().top,
      bar: document.querySelector('.d-session').getBoundingClientRect().top,
      scroll: document.querySelector('#drawer-body').scrollTop,
    }));
    check(sess.title > 0 && sess.bar >= 0 && sess.scroll === 0, `session : fiche suivante en haut (titre à ${Math.round(sess.title)} px, défilement ${sess.scroll})`);
    await page.evaluate(() => { document.querySelector('#drawer-body').scrollTop = 900; });
    await page.waitForTimeout(150);
    const stuck = await page.evaluate(() => ({ title: document.querySelector('#drawer-title').getBoundingClientRect().top, bar: document.querySelector('.d-session').getBoundingClientRect().top }));
    check(stuck.title > 0 && stuck.bar >= 0, 'session : nom et compteur restent visibles en défilant');
    await page.screenshot({ path: path.join(SHOTS, '04b-session-1440.png') });
    await page.keyboard.press('Escape');

    // « Ne plus contacter » : annulable tout de suite, consultable et réversible ensuite
    await page.locator('#results-body tr').nth(2).locator('.r-name-btn').click();
    await page.waitForSelector('#drawer[open]');
    const opposedName = await page.locator('#drawer-title').innerText();
    await page.click('label.status-opt:has-text("Ne plus contacter")');
    await page.waitForSelector('#toast.is-on .toast__btn');
    check((await page.locator('#toast .toast__btn').innerText()).includes('Annuler'), 'opposition : bouton « Annuler » proposé');
    await page.click('#toast .toast__btn');
    await page.waitForTimeout(300);
    check(!(await page.locator('label.status-opt:has-text("Ne plus contacter") input').isChecked()), 'opposition : annulée en un geste');
    await page.click('label.status-opt:has-text("Ne plus contacter")');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.click('#tab-crm');
    await page.waitForSelector('#crm-list .crm-card');
    await page.click('.stage-btn[data-f="opposition"]');
    await page.waitForTimeout(300);
    const oppCards = await page.locator('#crm-list .crm-card').count();
    check(oppCards === 1 && (await page.locator('#crm-list').innerText()).includes(opposedName), `opposition : liste consultable (${oppCards} fiche)`);
    await page.screenshot({ path: path.join(SHOTS, '05b-opposition-1440.png') });
    await page.click('[data-unoppose]');
    await page.waitForTimeout(300);
    check(await page.locator('#crm-list .crm-card').count() === 0, 'opposition : « Réautoriser » rend l\'établissement à nouveau joignable');
    await page.click('#tab-search');

    // Mode OpenStreetMap
    await page.click('label.seg__opt:has-text("OpenStreetMap")');
    await page.click('#run');
    await page.waitForSelector('#progress', { state: 'hidden', timeout: 30000 });
    await page.waitForTimeout(400);
    check(await page.locator('#verify-btn').isVisible() && /meilleurs/.test(await page.locator('#verify-btn').innerText()), 'mode OSM : « Vérifier les meilleurs sur Google » en action principale');
    check(/candidats/.test(await page.locator('#kpi-hot-l').innerText()), 'mode OSM : compteur de candidats à vérifier');
    check(Number((await page.locator('#kpi-total').innerText()).replace(/\D/g, '')) > 10, 'mode OSM : résultats');
    await page.click('#verify-btn');
    await page.click('dialog.modal[open] button[value="yes"]');
    const verified = await page.waitForFunction(() => document.querySelector('#results-body').innerText.includes('vérifié Google') && document.querySelector('#progress').hidden, null, { timeout: 30000 }).then(() => true, () => false);
    await page.waitForTimeout(300);
    check(verified, 'vérification OSM → Google');
    await page.screenshot({ path: path.join(SHOTS, '06-osm-1440.png') });

    // Réglages + générateur d'empreinte
    await page.click('#tab-settings');
    await page.fill('#gen-pw', 'Un-Mot-De-Passe-Solide-42');
    await page.fill('#gen-pw2', 'Un-Mot-De-Passe-Solide-42');
    await page.click('#gen-form button[type="submit"]');
    await page.waitForSelector('#gen-out:not([hidden])');
    const hash = await page.locator('#gen-hash').innerText();
    check(/^pbkdf2_sha256\$210000\$/.test(hash) && await fn.verifyPassword('Un-Mot-De-Passe-Solide-42', hash), 'empreinte générée dans le navigateur, reconnue par la fonction');
    await page.evaluate(() => { const c = document.querySelector('#gen-form').closest('section, .card') || document.querySelector('#gen-form'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 300); });
    await page.waitForTimeout(3500); // laisser le message disparaître
    await page.screenshot({ path: path.join(SHOTS, '07-reglages-1440.png') });
    await ctx.close();

    // ------------------------------------------------- 1440 sans la fonction
    console.log('Bureau 1440 sans fonction serveur (lancement local)');
    const nf = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR', colorScheme: 'dark' });
    await nf.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: TILES[0], headers: { 'Access-Control-Allow-Origin': '*' } }));
    const np = await nf.newPage();
    // le serveur statique répond 501 ou 404 à /api/places : erreurs réseau attendues ici
    np.on('pageerror', (e) => errors.push(`[sans fonction] ${e.message}`));
    await np.goto(BASE);
    await np.waitForSelector('html[data-ready="true"]');
    await np.waitForFunction(() => /absente|indisponible/i.test(document.querySelector('#conn-pill, .pill--conn')?.textContent || ''), null, { timeout: 5000 }).catch(() => {});
    await np.click('#run');
    await np.waitForSelector('dialog.modal[open]');
    check(await np.locator('#login-dialog[open]').count() === 0 && /indisponible/.test(await np.locator('dialog.modal[open]').innerText()), 'sans fonction : pas de mot de passe demandé, choix démo ou OpenStreetMap');
    await np.click('dialog.modal[open] button[value="demo"]');
    await np.waitForTimeout(1200);
    check(Number((await np.locator('#kpi-total').innerText()).replace(/\D/g, '')) > 10, 'sans fonction : la démonstration se lance');
    await nf.close();

    // ------------------------------------------------------------------ 390
    console.log('Mobile 390 × 844');
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fr-FR', colorScheme: 'dark' });
    await setup(m, '203.0.113.20');
    const mp = await m.newPage();
    watch(mp, '390');
    await mp.goto(BASE);
    await mp.waitForSelector('html[data-ready="true"]');
    await mp.waitForTimeout(500);
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow <= 0, `pas de défilement horizontal (écart ${overflow}px)`);
    const layout = await mp.evaluate(() => {
      const y = (s) => document.querySelector(s).getBoundingClientRect().top;
      const nav = document.querySelector('.tabs').getBoundingClientRect();
      return { zone: y('.step--zone'), map: y('.map-wrap'), cats: y('.step--cats'), run: y('.step--run'), navBottom: nav.bottom, navTop: nav.top, vh: innerHeight };
    });
    check(layout.zone < layout.map && layout.map < layout.cats && layout.cats < layout.run, 'mobile : zone, carte, catégories puis lancement');
    check(Math.abs(layout.navBottom - layout.vh) < 2 && layout.navTop > layout.vh - 90, 'mobile : navigation en bas de l\'écran');
    const mRun = await mp.locator('#run').boundingBox();
    check(mRun && mRun.y + mRun.height <= layout.navTop + 1, 'mobile : bouton « Rechercher » visible au-dessus de la navigation');
    const sizes = await mp.evaluate(() => {
      const fs = (s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
      const h = (s) => Math.min(...[...document.querySelectorAll(s)].map((e) => e.getBoundingClientRect().height));
      return { legend: fs('.legend'), tab: fs('.tab'), chips: h('#quick-places button'), zoom: h('.leaflet-control-zoom a') };
    });
    check(sizes.legend >= 12 && sizes.tab >= 12, `mobile : textes utiles ≥ 12 px (légende ${sizes.legend}, onglets ${sizes.tab})`);
    check(sizes.chips >= 40 && sizes.zoom >= 40, `mobile : cibles tactiles ≥ 40 px (pastilles ${sizes.chips}, zoom ${sizes.zoom})`);
    await mp.screenshot({ path: path.join(SHOTS, '08-accueil-390.png') });
    await mp.evaluate(() => window.scrollTo(0, document.querySelector('.map-wrap').getBoundingClientRect().top + scrollY - 70));
    await mp.waitForTimeout(300);
    await mp.screenshot({ path: path.join(SHOTS, '08b-carte-390.png') });
    await mp.click('#empty-demo');
    await mp.waitForTimeout(1200);
    const overflow2 = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow2 <= 0, `résultats sans défilement horizontal (écart ${overflow2}px)`);
    await mp.evaluate(() => window.scrollTo(0, document.querySelector('#results').getBoundingClientRect().top + scrollY - 66));
    await mp.waitForTimeout(3500); // laisser le message de démonstration disparaître
    const firstGap = await mp.evaluate(() => document.querySelector('#results-body tr').getBoundingClientRect().top - document.querySelector('#results').getBoundingClientRect().top);
    check(firstGap < 420, `mobile : premier prospect à ${Math.round(firstGap)} px du haut des résultats`);
    await mp.screenshot({ path: path.join(SHOTS, '09-resultats-390.png') });
    await mp.click('#filters-toggle');
    await mp.waitForTimeout(200);
    const fSizes = await mp.evaluate(() => ({
      check: document.querySelector('#filters label.check').getBoundingClientRect().height,
      chip: Math.min(...[...document.querySelectorAll('#filters .chip')].map((e) => e.getBoundingClientRect().height)),
    }));
    check(fSizes.check >= 40 && fSizes.chip >= 40, `mobile : filtres dépliables, cibles ≥ 40 px (case ${Math.round(fSizes.check)}, pastilles ${Math.round(fSizes.chip)})`);
    await mp.screenshot({ path: path.join(SHOTS, '09d-filtres-390.png') });
    await mp.click('#filters-toggle');
    // bascule Carte / Liste
    await mp.click('#show-map');
    await mp.waitForTimeout(700);
    const mapTop = await mp.evaluate(() => document.querySelector('.map-wrap').getBoundingClientRect().top);
    check(mapTop >= 0 && mapTop < 120, `mobile : « Carte » amène la carte à l'écran (${Math.round(mapTop)} px)`);
    await mp.screenshot({ path: path.join(SHOTS, '09c-carte-resultats-390.png') });
    await mp.click('#map-to-list');
    await mp.waitForTimeout(700);
    await mp.evaluate(() => window.scrollTo(0, document.querySelector('#results-body').getBoundingClientRect().top + scrollY - 66));
    await mp.waitForTimeout(200);
    await mp.screenshot({ path: path.join(SHOTS, '09b-liste-390.png') });
    await mp.locator('#results-body tr').first().locator('.r-name-btn').click();
    await mp.waitForSelector('#drawer[open]');
    await mp.waitForTimeout(400);
    await mp.screenshot({ path: path.join(SHOTS, '10-fiche-390.png') });
    await mp.click('label.status-opt:has-text("Intéressé")');
    await mp.waitForTimeout(200);
    await mp.keyboard.press('Escape');
    await mp.click('#add-hot');
    await mp.waitForTimeout(300);
    await mp.click('#tab-crm');
    await mp.waitForSelector('#crm-list .crm-card');
    await mp.waitForTimeout(3500);
    check(await mp.evaluate(() => scrollY) === 0, 'changement d\'onglet : retour en haut de page');
    await mp.screenshot({ path: path.join(SHOTS, '11-crm-390.png') });

    // Recherche Google sur téléphone : progression visible, puis résultats affichés
    await mp.click('#tab-search');
    await mp.click('#run');
    await mp.waitForSelector('#login-dialog[open]');
    await mp.fill('#ld-pw', PASSWORD);
    await mp.click('#ld-ok');
    await mp.waitForSelector('#progress:not([hidden])');
    const prog = await mp.evaluate(() => {
      const r = document.querySelector('#progress').getBoundingClientRect();
      const nav = document.querySelector('.tabs').getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { top: r.top, bottom: r.bottom, navTop: nav.top, onTop: Boolean(hit?.closest('#progress')) };
    });
    check(prog.top >= 0 && prog.bottom <= prog.navTop && prog.onTop, 'mobile : progression visible (non recouverte) au-dessus de la navigation');
    await mp.screenshot({ path: path.join(SHOTS, '12-progression-390.png') });
    await mp.waitForSelector('#progress', { state: 'hidden', timeout: 60000 });
    await mp.waitForTimeout(1200);
    const resTop = await mp.evaluate(() => document.querySelector('#results').getBoundingClientRect().top);
    check(resTop < 200, `mobile : résultats affichés après la recherche (haut à ${Math.round(resTop)} px)`);
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
