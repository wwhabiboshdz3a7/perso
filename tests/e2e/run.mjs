// Tests de bout en bout (Playwright + Chromium).
//   node tests/e2e/run.mjs                      → tout
//   node --test-name-pattern="partage" tests/e2e/run.mjs → un parcours
// Variables : JARVIS_PORT (9147), JARVIS_CAPTURES (dossier des captures),
// JARVIS_NPM (dossier node_modules contenant « peer » et « axe-core », facultatif).

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  playwright, facultatif, ARGS_CHROMIUM, ORIGINE, PORT, CAPTURES, demarrerServeur, demarrerPeerServer, attendre,
  simulerMeteo, bloquerPeerCloud, simulerIA, MICRO_SIMULE, SYNTHESE_SIMULEE,
  ouvrir, pret, stabiliser, etat, geste, cible, commande, reponse, capture, empreintePhoto, encre,
} from './outils.mjs';

if (!playwright) {
  console.error('Playwright est introuvable : installez-le (npm i -D playwright) ou indiquez JARVIS_NPM.');
  process.exit(1);
}

const { chromium } = playwright;
let serveur, navigateur;

before(async () => {
  serveur = await demarrerServeur();
  navigateur = await chromium.launch({ args: ARGS_CHROMIUM });
  console.log(`# captures : ${CAPTURES}`);
});

after(async () => {
  await Promise.race([navigateur?.close(), attendre(15000)]);
  serveur?.kill();
});

async function nouveauContexte(options = {}) {
  const ctx = await navigateur.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR', timezoneId: 'Europe/Paris', ...options });
  // Rendu logiciel (SwiftShader) : délais larges, les vérifications restent strictes.
  ctx.setDefaultTimeout(60000);
  await simulerMeteo(ctx);
  await bloquerPeerCloud(ctx);
  await ctx.addInitScript(SYNTHESE_SIMULEE);
  return ctx;
}

/** Contexte propre à un test, fermé à la fin du test même en cas d'échec. */
async function contexteJetable(t, options) {
  const ctx = await nouveauContexte(options);
  t.after(() => ctx.close().catch(() => {}));
  return ctx;
}

function sansErreur(...pages) {
  const erreurs = pages.flatMap((p) => p.erreurs);
  assert.deepEqual(erreurs, [], `Erreurs dans la console :\n${erreurs.join('\n')}`);
}

// ——— 1. Optique : vraie inférence MediaPipe sur la fausse caméra ————————————

describe('optique (fausse caméra)', () => {
  it('charge le modèle depuis models/ et vendor/, fait tourner la boucle et affiche les FPS', async (t) => {
    const ctx = await contexteJetable(t, { permissions: ['camera'] });
    const requetes = [];
    ctx.on('request', (r) => requetes.push(r.url()));
    const page = await ouvrir(ctx, '/?rapide', { attendrePret: false });
    // Autorisation déjà accordée : l'optique démarre seule.
    await page.waitForFunction(() => window.jarvis?.state().camera.active, null, { timeout: 120000 });
    await page.waitForFunction(() => Number(document.querySelector('#sFps').textContent) > 0, null, { timeout: 60000 });
    await page.waitForFunction(() => window.jarvis.app.camera.stats.fps >= 1 && window.jarvis.app.pipeline.frames.length > 0, null, { timeout: 60000 });
    const st = await etat(page);
    assert.equal(st.camera.active, true);
    assert.ok(st.camera.width >= 320, 'résolution vidéo');
    assert.equal(st.camera.model, 'gestes');
    assert.match(st.camera.delegate, /^(GPU|CPU)$/);
    assert.equal(st.camera.thread, 'worker', 'inférence hors du fil principal');
    assert.equal(st.pose, null, 'aucune main sur la mire de test');
    assert.equal(await page.textContent('#sHands'), '0');
    const locales = requetes.filter((u) => u.startsWith(ORIGINE));
    for (const f of ['/models/gesture_recognizer.task', '/vendor/mediapipe/vision_bundle.js', '/js/app/vision-worker.js', '/vendor/mediapipe/wasm/vision_wasm_internal']) {
      assert.ok(locales.some((u) => u.includes(f)), `ressource locale chargée : ${f}`);
    }
    const externes = requetes.filter((u) => !u.startsWith(ORIGINE) && !/^(blob|data):/.test(u) && !/open-meteo\.com/.test(u));
    assert.deepEqual(externes, [], 'aucune ressource externe (hors météo)');
    // La boucle continue de tourner.
    const n0 = await page.evaluate(() => window.jarvis.app.camera._frames.at(-1));
    await page.waitForFunction((n) => window.jarvis.app.camera._frames.at(-1) > n, n0);
    await capture(page, 'optique-bureau');
    sansErreur(page);
    await ctx.close();
  });
});

// ——— 2. Partage entre deux pages (BroadcastChannel) ————————————————————————

describe('partage à la main entre deux appareils (simulation, liaison locale)', () => {
  let ctx, A, B;

  before(async () => {
    ctx = await nouveauContexte();
    A = await ouvrir(ctx);
    B = await ouvrir(ctx);
    await A.evaluate(() => window.jarvis.app.settings.set({ deviceName: 'Poste A' }));
    await B.evaluate(() => window.jarvis.app.settings.set({ deviceName: 'Poste B' }));
    await A.waitForFunction(() => window.jarvis.state().peers.some((p) => p.name === 'Poste B'));
    await B.waitForFunction(() => window.jarvis.state().peers.some((p) => p.name === 'Poste A'));
    await stabiliser(A);
  });

  after(() => ctx?.close());

  it('attraper sur A (poing), lâcher sur B (main ouverte) : la photo arrive intacte', async () => {
    const avantB = (await etat(B)).photos;
    const cibleA = await cible(A, '.photo:nth-child(2) .photo__btn');
    const nomVise = await A.textContent('.photo:nth-child(2) .photo__name');
    const lecture = geste(A, 'attraper', cibleA);
    await A.waitForFunction(() => window.jarvis.state().carry);
    assert.equal((await etat(A)).carry.name, nomVise, 'la photo visée est attrapée');
    await lecture;
    await A.waitForFunction(() => window.jarvis.state().carry?.prepared);
    await capture(A, 'partage-A-en-main');
    // B voit la photo « en approche » et reçoit les données à l'avance.
    await B.waitForSelector('#incoming:not([hidden])');
    await B.waitForFunction(() => [...window.jarvis.app.share.incoming.values()].some((i) => i.ready));
    await capture(B, 'partage-B-en-approche');

    await geste(B, 'lacher');
    await B.waitForFunction(() => window.jarvis.state().lastReceived);
    await A.waitForFunction(() => window.jarvis.state().lastSent);
    const envoi = (await etat(A)).lastSent;
    const recu = (await etat(B)).lastReceived;
    assert.equal(envoi.verified, true, 'A confirme l’empreinte renvoyée par B');
    assert.equal(recu.hash, envoi.hash, 'empreintes SHA-256 identiques');
    assert.equal(recu.width, envoi.width);
    assert.equal(recu.height, envoi.height);
    assert.equal(envoi.to, 'Poste B');
    // Vérification indépendante sur l'image stockée par B.
    const stockee = await empreintePhoto(B, recu.id);
    assert.equal(stockee.hash, envoi.hash, 'octets stockés identiques aux octets envoyés');
    assert.deepEqual([stockee.width, stockee.height], [envoi.width, envoi.height], 'dimensions décodées identiques');
    assert.equal(stockee.source, 'reçue');
    await B.waitForFunction((n) => window.jarvis.state().photos === n + 1, avantB);
    await attendre(1500);
    await capture(B, 'partage-B-atterrie');
    assert.equal((await etat(A)).carry, null, 'A ne tient plus la photo');
    assert.equal(await A.locator('.photo.is-grabbed').count(), 0);
    sansErreur(A, B);
  });

  it('lancer : poing qui s’ouvre en mouvement, la photo part directement vers B', async () => {
    const avantB = (await etat(B)).photos;
    const cibleA = await cible(A, '.photo:nth-child(3) .photo__btn');
    await geste(A, 'attraper', cibleA);
    await A.waitForFunction(() => window.jarvis.state().carry?.prepared);
    await geste(A, 'lancer', { dir: 'right' });
    await B.waitForFunction((n) => window.jarvis.state().photos === n + 1, avantB);
    await A.waitForFunction(() => window.jarvis.state().carry === null);
    const envoi = (await etat(A)).lastSent;
    const recu = (await etat(B)).lastReceived;
    assert.equal(recu.hash, envoi.hash);
    assert.match(await A.textContent('#log'), /photo lancée \(right\) vers Poste B/);
    sansErreur(A, B);
  });

  it('ouvrir la main sur l’appareil émetteur repose la photo', async () => {
    const cibleA = await cible(A, '.photo:nth-child(4) .photo__btn');
    await geste(A, 'attraper', cibleA);
    await A.waitForFunction(() => window.jarvis.state().carry?.prepared);
    await B.waitForFunction(() => window.jarvis.state().incoming > 0);
    await geste(A, 'lacher');
    await A.waitForFunction(() => window.jarvis.state().carry === null);
    await B.waitForFunction(() => window.jarvis.state().incoming === 0);
    assert.equal(await B.isHidden('#incoming'), true, 'B n’attend plus de photo');
    sansErreur(A, B);
  });

  it('bouton « Envoyer » et commande vocale « envoie la photo » (repli sans geste)', async () => {
    const avantB = (await etat(B)).photos;
    await A.click('.photo:nth-child(1) .photo__btn');
    await A.waitForSelector('#viewer:not([hidden])');
    await commande(A, 'Jarvis, envoie la photo');
    await reponse(A, /Photo envoyée/);
    await B.waitForFunction((n) => window.jarvis.state().photos === n + 1, avantB);
    await A.keyboard.press('Escape');
    sansErreur(A, B);
  });
});

// ——— 3. Galerie, curseur aérien, dessin, hologramme, voix (une seule page) ———

describe('interface en simulation', () => {
  let ctx, page, requetesIA;

  before(async () => {
    ctx = await nouveauContexte();
    await ctx.addInitScript(MICRO_SIMULE);
    requetesIA = await simulerIA(ctx);
    page = await ouvrir(ctx);
  });

  after(() => ctx?.close());

  it('curseur aérien : pincement bref = clic sur un onglet', async () => {
    await geste(page, 'pincer', await cible(page, '[data-mode="holo"]'));
    await page.waitForFunction(() => window.jarvis.state().mode === 'holo');
    await geste(page, 'pincer', await cible(page, '[data-mode="galerie"]'));
    await page.waitForFunction(() => window.jarvis.state().mode === 'galerie');
    assert.match(await page.textContent('#log'), /module : hologramme/);
  });

  it('curseur aérien : pincement maintenu = glisser un curseur de réglage', async () => {
    await page.click('[data-mode="dessin"]');
    const avant = Number(await page.inputValue('#brushSize'));
    const box = await page.locator('#brushSize').boundingBox();
    const [d, f] = await page.evaluate(([b]) => [
      window.jarvis.sim.fromScreen(b.x + b.width * 0.15, b.y + b.height / 2),
      window.jarvis.sim.fromScreen(b.x + b.width * 0.9, b.y + b.height / 2),
    ], [box]);
    await geste(page, 'glisser', { x: d.x, y: d.y, x1: f.x, y1: f.y });
    const apres = Number(await page.inputValue('#brushSize'));
    assert.ok(apres > avant + 10, `épaisseur augmentée (${avant} → ${apres})`);
    assert.equal(await page.evaluate(() => window.jarvis.app.draw.size), apres, 'la valeur est appliquée');
    await page.evaluate(() => { const r = document.querySelector('#brushSize'); r.value = '8'; r.dispatchEvent(new Event('input')); });
  });

  it('dessin dans l’air : tracer, changer de couleur, gommer, tout effacer, exporter', async () => {
    const c = await cible(page, '#drawCanvas');
    await geste(page, 'cercle', { ...c, r: 0.14 });
    const encreCercle = await encre(page, '#drawCanvas');
    assert.ok(encreCercle > 0.003, `le cercle est tracé (${encreCercle})`);
    await capture(page, 'dessin-cercle');
    const couleur0 = await page.evaluate(() => window.jarvis.app.draw.colorIndex);
    await geste(page, 'pincer', { x: c.x + 0.12, y: c.y - 0.1 });
    assert.equal(await page.evaluate(() => window.jarvis.app.draw.colorIndex), couleur0 + 1, 'pincement = couleur suivante');
    await geste(page, 'cercle', { ...c, r: 0.08 });
    await geste(page, 'gomme');
    assert.ok(await page.evaluate(() => window.jarvis.app.draw.strokes.some((s) => s.eraser)), 'le poing gomme');
    const avant = (await etat(page)).photos;
    await page.click('#btnExport');
    await page.waitForFunction((n) => window.jarvis.state().photos === n + 1, avant);
    assert.equal(await page.evaluate(() => window.jarvis.app.gallery.photos[0].source), 'dessin');
    await geste(page, 'deux-index');
    assert.equal(await page.evaluate(() => window.jarvis.app.draw.strokes.length), 0, 'deux index = ardoise effacée');
    assert.ok((await encre(page, '#drawCanvas')) < 0.0005);
    sansErreur(page);
  });

  it('galerie gestuelle : swipe, zoom et rotation à deux mains, pouce levé = favori', async () => {
    await page.click('[data-mode="galerie"]');
    await page.click('.photo:nth-child(2) .photo__btn');
    await page.waitForSelector('#viewer:not([hidden])');
    const premiere = (await etat(page)).viewer;
    await geste(page, 'swipe-gauche');
    await page.waitForFunction((id) => window.jarvis.state().viewer !== id, premiere);
    const seconde = (await etat(page)).viewer;
    await geste(page, 'swipe-droite');
    await page.waitForFunction((id) => window.jarvis.state().viewer === id, premiere);
    assert.notEqual(premiere, seconde);
    await geste(page, 'zoom', { zoom: 2 });
    const vue = await page.evaluate(() => window.jarvis.app.gallery.view);
    assert.ok(vue.scale > 1.5, `zoom à deux mains (${vue.scale.toFixed(2)})`);
    await geste(page, 'rotation', { rotate: 0.6 });
    const vue2 = await page.evaluate(() => window.jarvis.app.gallery.view);
    assert.ok(Math.abs(vue2.rot) > 0.3, `rotation à deux mains (${vue2.rot.toFixed(2)} rad)`);
    assert.match(await page.textContent('#viewerReadout'), /ZOOM .* ROT/);
    await capture(page, 'galerie-visionneuse');
    await geste(page, 'pouce-leve');
    await page.waitForFunction((id) => window.jarvis.app.gallery.get(id).favorite, premiere);
    assert.equal(await page.getAttribute('#viewerFav', 'aria-pressed'), 'true');
    await page.keyboard.press('Escape');
    await page.click('[data-filter="fav"]');
    assert.equal(await page.locator('#photoGrid .photo').count(), 1, 'filtre des favoris');
    await page.click('[data-filter="all"]');
    sansErreur(page);
  });

  it('import de photos (sélecteur de fichiers), stockées en IndexedDB', async () => {
    const png = await page.evaluate(async () => {
      const c = document.createElement('canvas'); c.width = 900; c.height = 600;
      const g = c.getContext('2d'); g.fillStyle = '#123'; g.fillRect(0, 0, 900, 600); g.fillStyle = '#6ee7ff'; g.fillRect(100, 100, 300, 200);
      const b = await new Promise((r) => c.toBlob(r, 'image/png'));
      return [...new Uint8Array(await b.arrayBuffer())];
    });
    const avant = (await etat(page)).photos;
    await page.setInputFiles('#fileInput', { name: 'ma-photo.png', mimeType: 'image/png', buffer: Buffer.from(png) });
    await page.waitForFunction((n) => window.jarvis.state().photos === n + 1, avant);
    const enBase = await page.evaluate(() => new Promise((res) => {
      const r = indexedDB.open('jarvis');
      r.onsuccess = () => { const t = r.result.transaction('photos').objectStore('photos').getAll(); t.onsuccess = () => res(t.result.map((p) => p.name)); };
      r.onerror = () => res([]);
    }));
    assert.ok(enBase.includes('ma-photo'), 'photo enregistrée dans IndexedDB');
    sansErreur(page);
  });

  it('hologramme 3D : rendu WebGL, rotation à la main, zoom à deux mains', async () => {
    await page.click('[data-mode="holo"]');
    await page.waitForFunction(() => window.jarvis.app.holo.ready && window.jarvis.app.holo.running);
    await attendre(800);
    const yaw0 = await page.evaluate(() => window.jarvis.app.holo.yaw);
    const c = await cible(page, '#holoCanvas');
    await geste(page, 'glisser', { x: c.x - 0.12, y: c.y, x1: c.x + 0.12, y1: c.y });
    const yaw1 = await page.evaluate(() => window.jarvis.app.holo.yaw);
    assert.ok(Math.abs(yaw1 - yaw0) > 0.4, `rotation (${yaw0.toFixed(2)} → ${yaw1.toFixed(2)})`);
    await geste(page, 'zoom', { zoom: 1.6 });
    assert.ok(await page.evaluate(() => window.jarvis.app.holo.zoom) > 1.3, 'zoom à deux mains');
    const labels = await page.locator('.holo-label').count();
    assert.ok(labels >= 15, 'étiquettes des villes');
    await capture(page, 'hologramme-globe');
    await page.click('[data-holo="reactor"]');
    await attendre(600);
    await capture(page, 'hologramme-reacteur');
    await page.click('[data-holo="globe"]');
    await page.click('#btnHoloReset');
    sansErreur(page);
  });

  it('commandes au clavier (repli de la voix) : heure, météo, minuterie, modes, aide', async () => {
    await commande(page, 'Quelle heure est-il ?');
    await reponse(page, /^Il est \d+ heures? \d\d\.$/);
    const dit = await page.evaluate(() => window.__dites.at(-1));
    assert.match(dit.text, /^Il est/, 'réponse prononcée');
    assert.equal(dit.lang, 'fr-FR');
    assert.equal(dit.voice, 'Thomas', 'voix française de France choisie');
    await commande(page, 'météo à Toulouse');
    const meteo = await reponse(page, /À Toulouse.*degrés/);
    assert.match(meteo, /À Toulouse, 17 degrés, partiellement nuageux/);
    await commande(page, 'Quel temps fait-il à Lyon ?');
    assert.match(await reponse(page, /À Lyon.*degrés/), /21 degrés, ciel dégagé/);
    await commande(page, 'météo à Zzyzx');
    await reponse(page, /Je ne trouve pas la ville/);
    assert.match(await page.textContent('#weatherTemp'), /17°/, 'le widget garde la ville par défaut');
    await commande(page, 'minuterie de 5 minutes');
    await reponse(page, /Minuterie de 5 minutes lancée/);
    assert.equal(await page.locator('#timers li').count(), 1);
    assert.match(await page.textContent('#timers'), /4:5\d|5:00/);
    await commande(page, 'annule la minuterie');
    await reponse(page, /Minuterie annulée/);
    await commande(page, 'mode dessin');
    await page.waitForFunction(() => window.jarvis.state().mode === 'dessin');
    await commande(page, 'ouvre la galerie');
    await page.waitForFunction(() => window.jarvis.state().mode === 'galerie');
    await commande(page, 'aide');
    await reponse(page, /Je peux ouvrir la galerie/);
    await commande(page, 'blablabla incompréhensible');
    await reponse(page, /Je n’ai pas compris/);
    sansErreur(page);
  });

  it('« prends une capture » ajoute une photo avec cadre HUD ; « mode veille » puis réveil', async () => {
    const avant = (await etat(page)).photos;
    await commande(page, 'prends une capture');
    await page.waitForFunction((n) => window.jarvis.state().photos === n + 1, avant);
    assert.equal(await page.evaluate(() => window.jarvis.app.gallery.photos[0].source), 'capture');
    // Même chose avec le geste « victoire ».
    await geste(page, 'victoire');
    await page.waitForFunction((n) => window.jarvis.state().photos === n + 2, avant);
    const cap = await page.evaluate(() => window.jarvis.app.gallery.photos[0]);
    assert.equal(cap.source, 'capture');
    assert.deepEqual([cap.width, cap.height], [1280, 720], 'image de synthèse sans caméra');
    await commande(page, 'mode veille');
    await page.waitForFunction(() => window.jarvis.state().sleeping);
    assert.equal(await page.isVisible('#sleep'), true);
    await attendre(900);
    await capture(page, 'veille');
    await page.click('#btnWake');
    await page.waitForFunction(() => !window.jarvis.state().sleeping);
    sansErreur(page);
  });

  it('voix : mot d’éveil « Jarvis » (reconnaissance simulée)', async () => {
    await page.click('#btnMic');
    await page.waitForFunction(() => window.__micro && window.jarvis.app.assistant.listening);
    assert.match(await page.textContent('#chipMicVal'), /Jarvis/);
    // Sans mot d'éveil : ignoré.
    await page.evaluate(() => window.__dire('ouvre le mode dessin'));
    await attendre(300);
    assert.equal((await etat(page)).mode, 'galerie');
    // Avec le mot d'éveil : exécuté.
    await page.evaluate(() => window.__dire('Jarvis, ouvre le mode dessin'));
    await page.waitForFunction(() => window.jarvis.state().mode === 'dessin');
    // Mot d'éveil seul, puis la commande dans la foulée.
    await page.evaluate(() => window.__dire('Jarvis'));
    await reponse(page, /^Oui/);
    await page.evaluate(() => window.__dire('ouvre la galerie'));
    await page.waitForFunction(() => window.jarvis.state().mode === 'galerie');
    assert.match(await page.textContent('#log'), /« Jarvis, ouvre le mode dessin »/);
    await page.click('#btnMic');
    await page.waitForFunction(() => !window.jarvis.app.assistant.listening);
    sansErreur(page);
  });

  it('cerveau IA (point d’accès compatible OpenAI simulé) pour les questions libres', async () => {
    await page.evaluate(() => {
      const app = window.jarvis.app;
      app.settings.set({ aiProvider: 'custom', aiBase: 'https://ia.exemple.test/v1', aiModel: 'modele-test' });
      app.settings.aiKey = 'cle-de-test';
      app.assistant.renderBrain();
    });
    assert.equal(await page.textContent('#asstBrain'), 'cerveau IA');
    await commande(page, 'Quelle est la capitale de l’Australie ?');
    const r = await reponse(page, /Canberra/);
    assert.ok(!r.includes('**'), 'markdown retiré de la réponse affichée');
    assert.equal((await page.evaluate(() => window.__dites.at(-1).text)).includes('**'), false, 'ni de la réponse lue');
    assert.equal(requetesIA.length, 1);
    assert.equal(requetesIA[0].auth, 'Bearer cle-de-test');
    assert.equal(requetesIA[0].corps.model, 'modele-test');
    assert.equal(requetesIA[0].corps.messages[0].role, 'system');
    assert.match(requetesIA[0].corps.messages[0].content, /JARVIS/);
    const cle = await page.evaluate(() => JSON.parse(localStorage.getItem('jarvis.reglages.v1')).aiKey);
    assert.equal(cle, undefined, 'la clé n’est pas stockée avec les réglages');
    await page.evaluate(() => { window.jarvis.app.settings.forgetAiKey(); window.jarvis.app.settings.set({ aiProvider: 'off' }); window.jarvis.app.assistant.renderBrain(); });
    sansErreur(page);
  });

  it('repli clavier quand la reconnaissance vocale est absente (Firefox)', async () => {
    await page.evaluate(() => { window.jarvis.app.assistant.SR = null; });
    await page.click('#btnMic');
    await page.waitForSelector('.toast >> text=Reconnaissance vocale indisponible');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'cmdInput');
    sansErreur(page);
  });

  it('geste enregistré : import JSON, rejeu à travers le même pipeline, export', async () => {
    // Un « enregistrement » au format produit par le bouton « Enregistrer un geste ».
    const json = await page.evaluate(async () => {
      const { swipe } = await import('/js/core/sequences.js');
      const seq = swipe('left', { mirror: true });
      return JSON.stringify({ format: 'jarvis-geste', version: 1, name: 'Swipe enregistré', frames: seq.frames.map((f) => ({ t: f.t, width: f.width, height: f.height, hands: f.hands })) });
    });
    await page.click('.photo:nth-child(2) .photo__btn');
    const avant = (await etat(page)).viewer;
    await page.click('#btnSim');
    await page.setInputFiles('#simImport', { name: 'swipe.json', mimeType: 'application/json', buffer: Buffer.from(json) });
    await page.waitForSelector('#simRecs li >> text=Swipe enregistré');
    await page.click('#simRecs li button[aria-label^="Rejouer"]');
    await page.waitForFunction((id) => window.jarvis.state().viewer !== id, avant);
    assert.match(await page.textContent('#log'), /swipe ←/);
    const [telechargement] = await Promise.all([page.waitForEvent('download'), page.click('#simRecs li button[aria-label^="Exporter"]')]);
    assert.match(telechargement.suggestedFilename(), /swipe-enregistr.*\.json$/);
    await page.setInputFiles('#simImport', { name: 'faux.json', mimeType: 'application/json', buffer: Buffer.from('{"frames": 3}') });
    await page.waitForSelector('.toast >> text=Import impossible');
    await page.click('#simClose');
    await page.click('#viewerClose');
    sansErreur(page);
  });

  it('main virtuelle (souris) : clic maintenu = poing qui attrape, relâcher = reposer', async () => {
    // Point de départ connu : galerie affichée, visionneuse et banc fermés.
    await page.evaluate(() => { const app = window.jarvis.app; app.setMode('galerie'); app.gallery.close(); app.openSim(false); });
    await page.click('#btnMouseHand');
    const box = await page.locator('.photo:nth-child(3) .photo__btn').boundingBox();
    await page.mouse.move(box.x + box.width / 2 - 30, box.y + box.height / 2 + 20);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    await attendre(400);
    await page.waitForSelector('.photo.is-target');
    await page.mouse.down();
    await page.waitForFunction(() => window.jarvis.state().carry);
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 5 });
    await attendre(200);
    await capture(page, 'main-virtuelle-attraper');
    // Journal des images et évènements après le relâchement (diagnostic en cas d'échec).
    await page.evaluate(() => {
      window.__apres = [];
      window.jarvis.app.pipeline.on('frame', ({ frame, result }) => {
        if (window.__apres.length < 40) window.__apres.push(`${Math.round(frame.t)} ${frame.source} ${result.primary?.pose || '-'} ${result.events.map((e) => e.type).join(',')}`);
      });
    });
    await page.mouse.up();
    await page.waitForFunction(() => window.jarvis.state().carry === null).catch(async (e) => {
      const diag = await page.evaluate(() => ({ main: { after: window.jarvis.app.mouseHand.after, pose: window.jarvis.app.mouseHand.pose }, images: window.__apres }));
      throw new Error(`${e.message}\n${JSON.stringify(diag, null, 1)}`);
    });
    await page.click('#btnMouseHand');
    sansErreur(page);
  });
});

// ——— 4. Liaison réseau (PeerJS) ————————————————————————————————————————————

describe('liaison réseau PeerJS', () => {
  it('serveur cloud injoignable : état « hors ligne » propre, sans exception', async (t) => {
    const ctx = await contexteJetable(t);
    const page = await ouvrir(ctx);
    await page.click('#btnNetStart');
    await page.waitForSelector('.toast >> text=Liaison réseau indisponible');
    assert.equal(await page.isVisible('#btnNetStart'), true, 'bouton « Réessayer » proposé');
    assert.match(await page.textContent('#btnNetStart'), /Réessayer/);
    sansErreur(page);
    await ctx.close();
  });

  it('transfert WebRTC réel entre deux navigateurs via un serveur PeerJS local (code + QR)', async (t) => {
    const portPeer = PORT + 1;
    const srv = await demarrerPeerServer(portPeer);
    if (!srv) { t.skip('module « peer » absent (JARVIS_NPM)'); return; }
    const reglages = { peerHost: '127.0.0.1', peerPort: String(portPeer), peerPath: '/', peerSecure: false, iceServers: '[]', welcomed: true };
    const ouvrirAppareil = async (nom) => {
      const c = await nouveauContexte();
      await c.addInitScript(([r, n]) => {
        if (!sessionStorage.getItem('init')) { localStorage.setItem('jarvis.reglages.v1', JSON.stringify({ ...r, deviceName: n })); sessionStorage.setItem('init', '1'); }
      }, [reglages, nom]);
      return { c, p: await ouvrir(c) };
    };
    const tel = await ouvrirAppareil('Téléphone');
    const pc = await ouvrirAppareil('Ordinateur');
    try {
      await pc.p.click('#btnNetStart');
      await pc.p.waitForSelector('#linkNetState.is-ok');
      const code = (await pc.p.textContent('#linkCodeVal')).trim();
      assert.match(code, /^[A-Z2-9]{3}-[A-Z2-9]{3}$/);
      assert.ok(await pc.p.locator('#qrBox svg path').count(), 'QR code affiché');
      await pc.p.click('#qrBox');
      assert.match(await pc.p.textContent('#qrUrl'), /\?lien=[A-Z2-9]{6}$/);
      await capture(pc.p, 'liaison-qr');
      await pc.p.keyboard.press('Escape');
      await tel.p.click('#btnNetStart');
      await tel.p.waitForSelector('#linkNetState.is-ok');
      await tel.p.fill('#joinCode', code.toLowerCase());
      await tel.p.press('#joinCode', 'Enter');
      await pc.p.waitForFunction(() => window.jarvis.state().peers.some((x) => x.name === 'Téléphone' && x.via === 'réseau'));
      await tel.p.waitForFunction(() => window.jarvis.state().peers.some((x) => x.name === 'Ordinateur'));
      const avant = (await etat(pc.p)).photos;
      await geste(tel.p, 'attraper', await cible(tel.p, '.photo:nth-child(1) .photo__btn'));
      await tel.p.waitForFunction(() => window.jarvis.state().carry?.prepared);
      await pc.p.waitForFunction(() => [...window.jarvis.app.share.incoming.values()].some((i) => i.ready), null, { timeout: 60000 });
      await geste(pc.p, 'lacher');
      await pc.p.waitForFunction((n) => window.jarvis.state().photos === n + 1, avant);
      await tel.p.waitForFunction(() => window.jarvis.state().lastSent?.verified);
      assert.equal((await etat(pc.p)).lastReceived.hash, (await etat(tel.p)).lastSent.hash);
      sansErreur(tel.p, pc.p);
    } finally {
      await tel.c.close();
      await pc.c.close();
      srv.kill();
    }
  });
});

// ——— 5. Accueil, tutoriel, réglages, confidentialité, mobile, accessibilité ———

describe('accueil, mobile et accessibilité', () => {
  it('premier lancement : démarrage passable, accueil, tutoriel, démonstration', async (t) => {
    const ctx = await contexteJetable(t);
    const page = await ouvrir(ctx, '/', { attendrePret: false });
    await page.waitForSelector('#boot .boot__log li');
    await capture(page, 'demarrage');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#welcome:not([hidden])', { timeout: 120000 });
    await capture(page, 'accueil-bureau');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'welcomeStart', 'focus sur l’action principale');
    await page.click('#welcomeTuto');
    await page.waitForSelector('#dlgTuto[open]');
    assert.ok(await page.locator('#gestureCards li').count() >= 8, 'cartes de gestes');
    await attendre(500);
    await capture(page, 'tutoriel');
    await page.click('#tutoDone');
    await page.click('#welcomeDemo');
    await page.waitForFunction(() => document.body.classList.contains('is-mousehand'));
    assert.equal(await page.isVisible('#simPanel'), true, 'banc de simulation ouvert');
    await pret(page);
    await capture(page, 'demo-banc');
    sansErreur(page);
    await ctx.close();
  });

  it('réglages : onglets au clavier, calibration indisponible sans caméra, réinitialisation', async (t) => {
    const ctx = await contexteJetable(t);
    const page = await ouvrir(ctx);
    await page.click('#btnSettings');
    await page.waitForSelector('#dlgSettings[open]');
    await page.focus('#tabGestes');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.getAttribute('#tabCamera', 'aria-selected'), 'true');
    assert.equal(await page.isVisible('#setCamera'), true);
    await page.keyboard.press('ArrowRight');
    await page.selectOption('#aiProvider', 'groq');
    assert.equal(await page.inputValue('[name="aiBase"]'), 'https://api.groq.com/openai/v1');
    await capture(page, 'reglages-voix');
    await page.selectOption('#aiProvider', 'off');
    await page.click('#tabGestes');
    const avant = await page.evaluate(() => window.jarvis.app.engine.opts.pinchOn);
    await page.locator('[name="pinchOn"]').fill('0.33');
    await page.waitForFunction(() => Math.abs(window.jarvis.app.engine.opts.pinchOn - 0.33) < 1e-6);
    assert.notEqual(avant, 0.33, 'seuil de pincement appliqué au moteur');
    await page.keyboard.press('Escape');
    sansErreur(page);
    await ctx.close();
  });

  it('confidentialité : page claire et lisible', async (t) => {
    const ctx = await contexteJetable(t);
    const page = await ouvrir(ctx, '/confidentialite.html', { attendrePret: false });
    assert.match(await page.title(), /^Confidentialité/);
    assert.match(await page.textContent('h1'), /votre appareil/);
    assert.match(await page.textContent('body'), /Aucune image de la caméra n’est envoyée/);
    assert.match(await page.textContent('body'), /Seule la photo que vous attrapez part/);
    sansErreur(page);
    await ctx.close();
  });

  it('mobile 390 px : aucun défilement horizontal, mode léger 640×480, captures', async (t) => {
    const ctx = await contexteJetable(t, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['camera'] });
    const accueil = await ouvrir(ctx, '/', { attendrePret: false });
    await accueil.keyboard.press('Escape').catch(() => {});
    await accueil.waitForSelector('#welcome:not([hidden])', { timeout: 120000 });
    assert.deepEqual(await accueil.evaluate(() => [document.documentElement.scrollWidth, innerWidth]), [390, 390]);
    await capture(accueil, 'mobile-accueil', { fullPage: true });
    await accueil.close();

    const page = await ouvrir(ctx, '/?rapide', { attendrePret: false });
    await pret(page);
    await page.waitForFunction(() => window.jarvis.state().camera.active, null, { timeout: 120000 });
    const st = await etat(page);
    assert.deepEqual([st.camera.width, st.camera.height], [640, 480], 'mode léger sur mobile');
    // Le rendu logiciel partage le même processus que l'inférence : on espace
    // les analyses pour des captures nettes (l'aperçu caméra reste affiché).
    await page.evaluate(() => window.jarvis.app.camera.setThrottle(4000));
    await stabiliser(page);
    for (const mode of ['galerie', 'dessin', 'holo']) {
      await page.evaluate((m) => window.jarvis.app.setMode(m), mode);
      await attendre(700);
      const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      assert.equal(sw, iw, `pas de défilement horizontal (${mode})`);
      await capture(page, `mobile-${mode}`);
    }
    await page.evaluate(() => window.jarvis.app.setMode('galerie'));
    await capture(page, 'mobile-complet', { fullPage: true });
    // Cibles tactiles suffisantes dans la barre de commande et l'en-tête.
    const petites = await page.evaluate(() => [...document.querySelectorAll('.topbar button, .cmdbar button, .mode-tab')]
      .filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect()).filter((r) => r.width < 32 || r.height < 32).length);
    assert.equal(petites, 0, 'cibles tactiles ≥ 32 px');
    const conf = await ouvrir(ctx, '/confidentialite.html', { attendrePret: false });
    assert.deepEqual(await conf.evaluate(() => [document.documentElement.scrollWidth, innerWidth]), [390, 390]);
    await capture(conf, 'mobile-confidentialite', { fullPage: true });
    sansErreur(page, conf);
    await ctx.close();
  });

  it('accessibilité (axe-core) : aucune violation sérieuse', async (t) => {
    const axe = facultatif('axe-core');
    if (!axe?.source) { t.skip('module « axe-core » absent (JARVIS_NPM)'); return; }
    const ctx = await contexteJetable(t);
    const resultats = [];
    for (const chemin of ['/?rapide', '/confidentialite.html']) {
      const page = await ouvrir(ctx, chemin, { attendrePret: chemin !== '/confidentialite.html' });
      await page.evaluate(axe.source);
      const r = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'], resultTypes: ['violations'] }));
      for (const v of r.violations) if (['serious', 'critical'].includes(v.impact)) resultats.push(`${chemin} · ${v.id} : ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    }
    assert.deepEqual(resultats, []);
    await ctx.close();
  });
});
