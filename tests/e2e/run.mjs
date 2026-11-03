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

/** Vérifie que deux éléments visibles ne se superposent pas à l'écran. */
async function sansChevauchement(page, a, b) {
  const [ra, rb] = await page.evaluate(([x, y]) => [x, y].map((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom) };
  }), [a, b]);
  for (const [s, r] of [[a, ra], [b, rb]]) assert.ok(r.r > r.l && r.b > r.t, `${s} affiché`);
  const separes = ra.r <= rb.l || rb.r <= ra.l || ra.b <= rb.t || rb.b <= ra.t;
  assert.ok(separes, `${a} (${JSON.stringify(ra)}) chevauche ${b} (${JSON.stringify(rb)})`);
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
    // Machine de test chargée : le délai « photo reposée » ne doit pas
    // interrompre un parcours qui attend le rendu logiciel.
    for (const p of [A, B]) await p.evaluate(() => { window.jarvis.app.share.carryTimeout = 600000; });
    await stabiliser(A);
  });

  after(() => ctx?.close());

  it('attraper sur A (poing), lâcher sur B (main ouverte) : la photo arrive intacte', async () => {
    const avantB = (await etat(B)).photos;
    const cibleA = await cible(A, '.photo:nth-child(2) .photo__btn');
    const nomVise = await A.textContent('.photo:nth-child(2) .photo__name');
    await A.bringToFront();
    const lecture = geste(A, 'attraper', cibleA);
    await A.waitForFunction(() => window.jarvis.state().carry);
    assert.equal((await etat(A)).carry.name, nomVise, 'la photo visée est attrapée');
    await lecture;
    await A.waitForFunction(() => window.jarvis.state().carry?.prepared);
    // B voit la photo « en approche » et reçoit les données à l'avance.
    await B.waitForSelector('#incoming:not([hidden])');
    await B.waitForFunction(() => [...window.jarvis.app.share.incoming.values()].some((i) => i.ready));

    await B.bringToFront();
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
    await A.bringToFront();
    await geste(A, 'attraper', cibleA);
    await A.waitForFunction(() => window.jarvis.state().carry?.prepared);
    await geste(A, 'lancer', { dir: 'right' });
    await B.waitForFunction((n) => window.jarvis.state().photos === n + 1, avantB);
    await A.waitForFunction(() => window.jarvis.state().carry === null);
    const envoi = (await etat(A)).lastSent;
    const recu = (await etat(B)).lastReceived;
    assert.equal(recu.hash, envoi.hash);
    assert.match(await A.textContent('#log'), /photo lancée vers la droite → Poste B/);
    assert.doesNotMatch(await A.textContent('#log'), /\b(right|left)\b/, 'journal en français');
    sansErreur(A, B);
  });

  it('ouvrir la main sur l’appareil émetteur repose la photo', async () => {
    const cibleA = await cible(A, '.photo:nth-child(4) .photo__btn');
    await A.bringToFront();
    await geste(A, 'attraper', cibleA);
    await A.waitForFunction(() => window.jarvis.state().carry?.prepared);
    await B.waitForFunction(() => window.jarvis.state().incoming > 0);
    // Captures prises ici, hors du parcours de transfert chronométré.
    await capture(A, 'partage-A-en-main');
    await B.bringToFront();
    await capture(B, 'partage-B-en-approche');
    await A.bringToFront();
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

  it('deux récepteurs lâchent en même temps : un seul reçoit la photo', async () => {
    // Troisième fenêtre : elle ne joue aucun geste (lâcher déclenché
    // directement), inutile d'attendre que son affichage soit fluide.
    const C = await ouvrir(ctx, '/?rapide', { attendrePret: false });
    try {
      await pret(C);
      await C.evaluate(() => window.jarvis.app.settings.set({ deviceName: 'Poste C' }));
      await A.waitForFunction(() => window.jarvis.state().peers.length >= 2);
      await C.waitForFunction(() => window.jarvis.state().peers.length >= 2);
      const avant = { B: (await etat(B)).photos, C: (await etat(C)).photos };
      await A.bringToFront();
      await geste(A, 'attraper', await cible(A, '.photo:nth-child(2) .photo__btn'));
      await A.waitForFunction(() => window.jarvis.state().carry?.prepared);
      for (const P of [B, C]) await P.waitForFunction(() => [...window.jarvis.app.share.incoming.values()].some((i) => i.ready));
      // Les deux appareils réclament la photo dans la même seconde.
      await Promise.all([B.evaluate(() => window.jarvis.app.share.release()), C.evaluate(() => window.jarvis.app.share.release())]);
      await A.waitForFunction(() => window.jarvis.state().lastSent && window.jarvis.state().carry === null);
      await attendre(2500);
      const gains = { B: (await etat(B)).photos - avant.B, C: (await etat(C)).photos - avant.C };
      assert.equal(gains.B + gains.C, 1, `une seule réception (${JSON.stringify(gains)})`);
      const perdant = gains.B ? C : B;
      assert.equal((await etat(perdant)).incoming, 0, 'l’autre appareil n’attend plus la photo');
      assert.match(await perdant.textContent('#toasts'), /déjà récupérée/);
      sansErreur(A, B, C);
    } finally {
      await C.close();
      await A.waitForFunction(() => window.jarvis.state().peers.length === 1);
    }
  });

  it('réception validée : fichier non image, vignette piégée et dimensions forgées refusés', async () => {
    const requetes = [];
    const ecoute = (r) => { if (/pirate/.test(r.url())) requetes.push(r.url()); };
    ctx.on('request', ecoute);
    const avant = (await etat(A)).photos;
    // B se comporte en pair malveillant : il annonce, envoie et « lance » un fichier texte.
    await B.evaluate(async () => {
      const P = await import('/js/core/protocol.js');
      const t = window.jarvis.app.link.local;
      const vers = [...t.peers.keys()][0];
      const tid = 'tx-pirate-1';
      const octets = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>');
      t.sendCtrl(vers, { type: 'grab', tid, name: 'pirate', width: 'abc', height: '<b>x</b>', size: octets.length, from: 'Pirate', thumb: 'data:image/png;base64,AAAA"), url("/pirate-css.png' });
      t.sendCtrl(vers, { type: 'file-begin', tid, size: octets.length, chunks: 1, hash: await P.sha256Hex(octets), name: 'pirate', width: 'abc', height: '<b>x</b>', mime: 'image/jpeg' });
      await t.sendBin(vers, P.encodePacket({ t: 'chunk', tid, i: 0, n: 1 }, octets));
      t.sendCtrl(vers, { type: 'file-end', tid });
      t.sendCtrl(vers, { type: 'throw', tid, direction: 'right', from: 'Pirate' });
      setTimeout(() => t.sendCtrl(vers, { type: 'granted', tid }), 200);
    });
    await A.waitForSelector('.toast >> text=Fichier refusé');
    await attendre(800);
    assert.equal((await etat(A)).photos, avant, 'aucun fichier non image dans la galerie');
    assert.equal((await etat(A)).incoming, 0);
    assert.deepEqual(requetes, [], 'la vignette piégée ne déclenche aucune requête');
    ctx.off('request', ecoute);
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
    // La consigne et le relevé restent lisibles : aucun des deux ne recouvre l'autre.
    await page.waitForFunction(() => /15 VILLES/.test(document.querySelector('#holoReadout').textContent));
    await sansChevauchement(page, '#holoHint', '#holoReadout');
    await capture(page, 'hologramme-globe');
    await page.click('[data-holo="reactor"]');
    await attendre(600);
    await capture(page, 'hologramme-reacteur');
    await page.click('[data-holo="globe"]');
    await page.click('#btnHoloReset');
    // Perte du contexte WebGL : message, puis relance.
    await page.evaluate(() => window.jarvis.app.holo.renderer.getContext().getExtension('WEBGL_lose_context').loseContext());
    await page.waitForSelector('.holo-lost:not([hidden])');
    await capture(page, 'hologramme-contexte-perdu');
    await page.click('.holo-lost button');
    await page.waitForFunction(() => !window.jarvis.app.holo.lost && window.jarvis.app.holo.running, null, { timeout: 30000 });
    assert.equal(await page.isHidden('.holo-lost'), true);
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
    // Sans caméra et hors démonstration : pas de fausse photo.
    await commande(page, 'prends une capture');
    await reponse(page, /Activez d’abord la caméra/);
    await attendre(300);
    assert.equal((await etat(page)).photos, avant, 'aucune capture sans caméra');
    // En démonstration (main virtuelle), la capture simulée est permise et nommée comme telle.
    await page.click('#btnMouseHand');
    await commande(page, 'prends une capture');
    await page.waitForFunction((n) => window.jarvis.state().photos === n + 1, avant);
    const vocale = await page.evaluate(() => window.jarvis.app.gallery.photos[0]);
    assert.equal(vocale.source, 'capture');
    assert.match(vocale.name, /^Capture simulée/);
    await page.click('#btnMouseHand');
    // Même chose avec le geste « victoire » (banc de simulation).
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
    assert.match(await page.textContent('#log'), /«\u202fJarvis, ouvre le mode dessin\u202f»/);
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

  it('capteurs et squelette remis à zéro quand plus aucune image n’arrive', async () => {
    await page.evaluate(() => { const app = window.jarvis.app; app.setMode('galerie'); app.gallery.close(); });
    await geste(page, 'pincer', { x: 0.5, y: 0.5 });
    await attendre(2600);
    const st = await page.evaluate(() => ({
      fps: document.querySelector('#sFps').textContent, mains: document.querySelector('#sHands').textContent,
      pose: window.jarvis.state().pose, propre: window.jarvis.app.fx._clean,
    }));
    assert.deepEqual(st, { fps: '0', mains: '0', pose: null, propre: true });
    // Rien d'affiché : calque masqué, ou vide s'il est encore visible.
    const masque = await page.evaluate(() => getComputedStyle(document.querySelector('#fxCanvas')).visibility === 'hidden');
    const reste = masque ? 0 : await encre(page, '#fxCanvas');
    if (reste) {
      const diag = await page.evaluate(async () => {
        const fx = window.jarvis.app.fx;
        let n = 0;
        await new Promise((r) => { const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 400) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
        return { visible: document.visibilityState, raf: n, clean: fx._clean, shown: fx._ghostShown, parts: fx.particles.length, rings: fx.rings.length, result: fx.result?.hands?.length ?? null, taille: [fx.canvas.width, fx.canvas.height], transform: String(fx.ctx.getTransform()) };
      });
      assert.fail(`squelette résiduel (${reste}) : ${JSON.stringify(diag)} ; encre après 400 ms : ${await encre(page, '#fxCanvas')}`);
    }
    sansErreur(page);
  });

  it('import refusé si les horodatages sont aberrants ; lecture interruptible', async () => {
    const json = await page.evaluate(async () => {
      const { swipe } = await import('/js/core/sequences.js');
      const f = swipe('left', { mirror: true }).frames.filter((x) => x.hands.length)[0];
      return JSON.stringify({ name: 'Piégé', frames: [0, 1e9, 2e9].map((t) => ({ ...f, t })) });
    });
    await page.click('#btnSim');
    await page.setInputFiles('#simImport', { name: 'piege.json', mimeType: 'application/json', buffer: Buffer.from(json) });
    await page.waitForSelector('.toast >> text=Un geste dure 60 secondes au plus');
    assert.equal(await page.locator('#simRecs li >> text=Piégé').count(), 0);
    // Lecture longue (8 s) arrêtée par le bouton du banc.
    const lecture = page.evaluate(async () => {
      const { swipe } = await import('/js/core/sequences.js');
      const f = swipe('left', { mirror: true }).frames.filter((x) => x.hands.length)[0];
      const frames = Array.from({ length: 240 }, (_, i) => ({ ...f, t: i * 33 }));
      return window.jarvis.sim.playFrames(frames);
    });
    await page.waitForSelector('#simStop:not([hidden])');
    await page.click('#simStop');
    await lecture;
    assert.equal(await page.evaluate(() => window.jarvis.app.player.active), false);
    assert.equal(await page.isHidden('#simStop'), true);
    assert.equal(await page.evaluate(() => window.jarvis.app.pipeline.override), null, 'caméra et souris retrouvent la main');
    await page.click('#simClose');
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
    // L'état reste stable : pas de boucle de reconnexion, ni de code ou QR inutilisables.
    await attendre(6000);
    assert.equal(await page.evaluate(() => window.jarvis.app.link.net.state), 'error');
    assert.equal(await page.isVisible('#btnNetStart'), true);
    assert.equal(await page.isHidden('#linkCode'), true, 'pas de code ni de QR hors ligne');
    sansErreur(page);
    await ctx.close();
  });

  it('serveur injoignable pour de vrai (port fermé) : un seul essai, « Réessayer » recrée la liaison', async (t) => {
    const ctx = await contexteJetable(t);
    await ctx.addInitScript((port) => {
      if (!sessionStorage.getItem('init')) { localStorage.setItem('jarvis.reglages.v1', JSON.stringify({ peerHost: '127.0.0.1', peerPort: String(port), peerPath: '/', peerSecure: false, welcomed: true })); sessionStorage.setItem('init', '1'); }
    }, PORT + 3);
    const page = await ouvrir(ctx);
    const etats = [];
    await page.exposeFunction('__etat', (e) => etats.push(e));
    await page.evaluate(() => window.jarvis.app.link.net.on('state', (e) => window.__etat(e)));
    await page.click('#btnNetStart');
    await page.waitForSelector('.toast >> text=Liaison réseau indisponible');
    await attendre(8000);
    assert.deepEqual(etats, ['connecting', 'error'], 'aucune reconnexion en boucle');
    assert.equal(await page.isHidden('#linkCode'), true);
    await page.click('#btnNetStart');
    await page.waitForFunction(() => window.jarvis.app.link.net.state === 'error');
    assert.deepEqual(etats, ['connecting', 'error', 'connecting', 'error'], '« Réessayer » relance une tentative');
    const ws = page.erreurs.filter((e) => /WebSocket connection/.test(e));
    assert.ok(ws.length <= 2, `une erreur de connexion par tentative (${ws.length})`);
    sansErreur({ erreurs: page.erreurs.filter((e) => !/WebSocket connection/.test(e)) });
    await ctx.close();
  });

  it('transfert WebRTC réel entre deux navigateurs via un serveur PeerJS local (code + QR)', async (t) => {
    const portPeer = PORT + 1;
    let srv = await demarrerPeerServer(portPeer);
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
      // L'appareil appelé doit accepter la liaison.
      await pc.p.waitForSelector('.toast--ask >> text=Téléphone veut se relier');
      await tel.p.waitForSelector('#peers >> text=en attente d’accord');
      await pc.p.click('.toast--ask >> text=Accepter');
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

      // Serveur de signalisation coupé après l'appairage : une seule notification,
      // la liaison directe continue, retour automatique quand le serveur revient.
      const notes = async () => pc.p.evaluate(() => window.__notes);
      await pc.p.evaluate(() => {
        window.__notes = 0;
        new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (/Serveur de liaison perdu/.test(n.textContent)) window.__notes++; })
          .observe(document.querySelector('#toasts'), { childList: true });
      });
      srv.kill();
      await pc.p.waitForSelector('#linkNetState.is-busy');
      await attendre(9000);
      assert.equal(await notes(), 1, 'une seule notification pendant la coupure');
      assert.ok((await etat(pc.p)).peers.some((x) => x.name === 'Téléphone'), 'la liaison directe continue');
      srv = await demarrerPeerServer(portPeer);
      await pc.p.waitForSelector('#linkNetState.is-ok', { timeout: 60000 });

      // Code inexistant : pas d'entrée fantôme.
      await pc.p.fill('#joinCode', 'ZZZ-ZZZ');
      await pc.p.press('#joinCode', 'Enter');
      await pc.p.waitForSelector('.toast >> text=Appareil introuvable', { timeout: 30000 });
      await pc.p.waitForFunction(() => !document.querySelector('#peers').textContent.includes('Appareil distant'));

      // Téléphone fermé brutalement (sans « au revoir ») : retiré grâce au battement.
      // Détection nominale : liaison ICE coupée + 6 s de grâce (≈ 12 s), au pire
      // silence de 15 s relevé au battement suivant (≤ 20 s). Le délai est lu sur
      // l'horloge de la page : après la fermeture d'un contexte en pleine liaison
      // WebRTC, le pilotage du navigateur peut rester figé plusieurs dizaines de
      // secondes (sans rapport avec l'application).
      await tel.p.evaluate(() => { const l = window.jarvis.app.link; l.net.stop = () => {}; l.local.stop = () => {}; });
      await pc.p.evaluate(() => {
        window.__retrait = { debut: Date.now(), fin: 0 };
        const t = setInterval(() => {
          if (window.jarvis.state().peers.some((x) => x.name === 'Téléphone')) return;
          window.__retrait.fin = Date.now();
          clearInterval(t);
        }, 200);
      });
      await tel.c.close();
      await pc.p.waitForFunction(() => window.__retrait.fin > 0, null, { timeout: 120000 });
      const retrait = await pc.p.evaluate(() => (window.__retrait.fin - window.__retrait.debut) / 1000);
      console.log(`# téléphone fermé retiré en ${retrait.toFixed(1)} s (horloge de la page)`);
      assert.ok(retrait < 60, `téléphone fermé retiré en ${retrait} s`);
      sansErreur({ erreurs: pc.p.erreurs.filter((e) => !/WebSocket connection/.test(e)) });
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

  it('premier lancement : visuels de démonstration prêts en moins de 6 s, un import passe avant eux', async (t) => {
    const ctx = await contexteJetable(t);
    const debut = Date.now();
    const page = await ouvrir(ctx, '/?rapide', { attendrePret: false });
    await page.waitForSelector('#photoGrid .photo--ghost', { state: 'attached', timeout: 30000 });
    // Import lancé pendant la génération : il ne doit pas attendre la fin.
    const png = await page.evaluate(async () => {
      const c = document.createElement('canvas'); c.width = 96; c.height = 64;
      c.getContext('2d').fillRect(0, 0, 20, 20);
      const b = await new Promise((r) => c.toBlob(r, 'image/png'));
      return [...new Uint8Array(await b.arrayBuffer())];
    });
    await page.setInputFiles('#fileInput', { name: 'pendant.png', mimeType: 'image/png', buffer: Buffer.from(png) });
    await page.waitForSelector('#photoGrid .photo__src[data-src="import"]', { state: 'attached', timeout: 30000 });
    const restants = await page.locator('#photoGrid .photo--ghost').count();
    await page.waitForFunction(() => window.jarvis?.app?.gallery?.ready, null, { timeout: 60000 });
    const duree = Date.now() - debut;
    console.log(`# galerie de démonstration prête en ${(duree / 1000).toFixed(1)} s ; visuels encore en préparation à l’arrivée de l’import : ${restants}`);
    assert.ok(restants > 0, 'import terminé avant la fin des visuels de démonstration');
    assert.ok(duree < 6000, `galerie prête en ${duree} ms (attendu < 6 s en rendu logiciel)`);
    assert.equal((await etat(page)).photos, 7);
    sansErreur(page);
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
      if (mode === 'holo') {
        await page.waitForFunction(() => /15 VILLES/.test(document.querySelector('#holoReadout').textContent));
        await sansChevauchement(page, '#holoHint', '#holoReadout');
      }
      await capture(page, `mobile-${mode}`);
    }
    await page.evaluate(() => window.jarvis.app.setMode('galerie'));
    await capture(page, 'mobile-complet', { fullPage: true });
    // Cibles tactiles suffisantes dans la barre de commande et l'en-tête.
    const petites = await page.evaluate(() => [...document.querySelectorAll('.topbar button, .cmdbar button, .mode-tab')]
      .filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect()).filter((r) => r.width < 32 || r.height < 32).length);
    assert.equal(petites, 0, 'cibles tactiles ≥ 32 px');
    // En-tête sur deux lignes au plus : marque, pastilles et boutons, puis les modules.
    const centres = await page.evaluate(() => [...document.querySelectorAll('.brand, .topbar__status, .topbar__actions')].map((n) => { const r = n.getBoundingClientRect(); return r.top + r.height / 2; }));
    assert.ok(Math.max(...centres) - Math.min(...centres) < 16, `marque, pastilles et boutons sur une seule ligne (${centres.map(Math.round)})`);
    // La réponse de JARVIS reste visible : bulle au-dessus de la barre de commande.
    await commande(page, 'quelle heure est-il');
    await page.waitForSelector('#cmdBubble:not([hidden])');
    const bulle = await page.evaluate(() => { const r = document.querySelector('#cmdBubble').getBoundingClientRect(); return { haut: r.top, bas: r.bottom, texte: document.querySelector('#cmdBubble q').textContent }; });
    assert.ok(bulle.haut >= 0 && bulle.bas <= 844, `bulle dans l’écran (${bulle.haut}–${bulle.bas})`);
    assert.match(bulle.texte, /^Il est \d+ heures?/);
    await capture(page, 'mobile-reponse');
    // Réglages : la barre d'onglets garde sa hauteur dans chaque rubrique.
    for (const tab of ['Gestes', 'Camera', 'Voix', 'Liaison', 'General']) {
      await page.evaluate((x) => window.jarvis.app.openSettings(x), tab);
      const h = await page.evaluate(() => document.querySelector('#dlgSettings .tabs').getBoundingClientRect().height);
      assert.ok(h >= 40, `onglets lisibles dans ${tab} (${h} px)`);
    }
    await capture(page, 'mobile-reglages');
    await page.keyboard.press('Escape');
    // Outils de dessin dans l'écran.
    await page.evaluate(() => window.jarvis.app.setMode('dessin'));
    const horsEcran = await page.evaluate(() => [...document.querySelectorAll('.draw-acts .btn')].filter((b) => b.getBoundingClientRect().right > innerWidth).length);
    assert.equal(horsEcran, 0, 'boutons de dessin dans l’écran');
    await page.evaluate(() => window.jarvis.app.setMode('galerie'));
    const conf = await ouvrir(ctx, '/confidentialite.html', { attendrePret: false });
    assert.deepEqual(await conf.evaluate(() => [document.documentElement.scrollWidth, innerWidth]), [390, 390]);
    await capture(conf, 'mobile-confidentialite', { fullPage: true });
    sansErreur(page, conf);
    await ctx.close();
  });

  it('tablette 768 px et fenêtre de 721 px : en-tête sur deux lignes, aucun défilement horizontal', async (t) => {
    for (const [width, height, mobile] of [[768, 1024, true], [721, 900, false]]) {
      const ctx = await contexteJetable(t, { viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
      const page = await ouvrir(ctx);
      for (const mode of ['galerie', 'dessin', 'holo']) {
        await page.evaluate((m) => window.jarvis.app.setMode(m), mode);
        await attendre(500);
        const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
        assert.deepEqual([sw, iw], [width, width], `pas de défilement horizontal (${width} px, ${mode})`);
      }
      const dehors = await page.evaluate(() => [...document.querySelectorAll('.topbar button, .topbar .chip')]
        .filter((b) => b.offsetParent && b.getBoundingClientRect().right > innerWidth).length);
      assert.equal(dehors, 0, `boutons de l’en-tête dans l’écran (${width} px)`);
      await page.waitForFunction(() => /15 VILLES/.test(document.querySelector('#holoReadout').textContent));
      await sansChevauchement(page, '#holoHint', '#holoReadout');
      if (width === 768) await capture(page, 'tablette-holo');
      sansErreur(page);
      await ctx.close();
    }
  });

  it('accessibilité (axe-core) : aucune violation sérieuse, bureau et mobile, dialogues ouverts', async (t) => {
    const axe = facultatif('axe-core');
    if (!axe?.source) { t.skip('module « axe-core » absent (JARVIS_NPM)'); return; }
    const resultats = [];
    const auditer = async (page, nom) => {
      await page.evaluate(axe.source);
      const r = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'], resultTypes: ['violations'] }));
      for (const v of r.violations) if (['serious', 'critical'].includes(v.impact)) resultats.push(`${nom} · ${v.id} : ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    };
    for (const [taille, options] of [['bureau', {}], ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
      const ctx = await contexteJetable(t, options);
      const page = await ouvrir(ctx, '/?rapide');
      await auditer(page, `${taille} galerie`);
      // Journal rempli jusqu'à défiler : il doit rester lisible au clavier.
      const deborde = () => page.evaluate(() => { const l = document.querySelector('#log'); return l.scrollHeight > l.clientHeight + 10; });
      for (let i = 0; i < 15 && !(await deborde()); i++) {
        const n = await page.locator('#log li').count();
        await commande(page, 'quelle heure est-il');
        await page.waitForFunction((k) => document.querySelectorAll('#log li').length > k, n);
      }
      assert.ok(await deborde(), `${taille} : le journal défile`);
      await auditer(page, `${taille} journal rempli`);
      await page.focus('#log');
      await page.keyboard.press('End');
      await page.waitForFunction(() => document.querySelector('#log').scrollTop > 0);
      await page.evaluate(() => window.jarvis.app.setMode('dessin'));
      await auditer(page, `${taille} dessin`);
      await page.evaluate(() => window.jarvis.app.setMode('galerie'));
      await page.evaluate(() => window.jarvis.app.openSettings('Voix'));
      await auditer(page, `${taille} réglages`);
      await page.keyboard.press('Escape');
      await page.evaluate(() => window.jarvis.app.openTutorial());
      await auditer(page, `${taille} tutoriel`);
      await page.keyboard.press('Escape');
      const conf = await ouvrir(ctx, '/confidentialite.html', { attendrePret: false });
      await auditer(conf, `${taille} confidentialité`);
      await ctx.close();
    }
    assert.deepEqual(resultats, []);
  });
});

// ——— 6. Démonstration tactile, plusieurs fenêtres ———————————————————————————

describe('démonstration tactile et fenêtres multiples', () => {
  it('au doigt : appui long sur A = attraper (la photo reste en main), appui long puis relâcher sur B = lâcher', async (t) => {
    const ctx = await contexteJetable(t, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const A = await ouvrir(ctx, '/?demo');
    const B = await ouvrir(ctx, '/?demo');
    await A.waitForFunction(() => window.jarvis.state().peers.length >= 1);
    await B.waitForFunction(() => window.jarvis.state().peers.length >= 1);
    const appuiLong = async (page, x, y, ms) => {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 0; i < Math.ceil(ms / 60); i++) {
        await attendre(60);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (i % 2) * 0.5, y }] });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    };
    const journal = (page) => page.evaluate(() => {
      window.__ev = [];
      window.jarvis.app.pipeline.on('event', ({ ev }) => window.__ev.push(ev.type));
    });
    await journal(A);
    await journal(B);
    await A.bringToFront();
    await stabiliser(A);
    const box = await A.locator('.photo:nth-child(2) .photo__img').boundingBox();
    await appuiLong(A, box.x + box.width / 2, box.y + box.height / 2, 1400);
    await A.waitForFunction(() => window.jarvis.state().carry?.prepared, null, { timeout: 30000 }).catch(async (e) => {
      throw new Error(`${e.message}\névènements A : ${JSON.stringify(await A.evaluate(() => window.__ev))}`);
    });
    await attendre(1000);
    assert.ok((await etat(A)).carry, 'doigt levé : la photo reste en main');
    await B.bringToFront();
    await stabiliser(B);
    await B.waitForFunction(() => [...window.jarvis.app.share.incoming.values()].some((i) => i.ready));
    const avant = (await etat(B)).photos;
    await appuiLong(B, 195, 420, 1000);
    await B.waitForFunction((n) => window.jarvis.state().photos === n + 1, avant, { timeout: 30000 }).catch(async (e) => {
      throw new Error(`${e.message}\névènements B : ${JSON.stringify(await B.evaluate(() => window.__ev))}`);
    });
    await A.waitForFunction(() => window.jarvis.state().carry === null);
    await capture(B, 'tactile-B-atterrie');
    sansErreur(A, B);
  });

  it('réglages : chaque fenêtre garde les siens, rien n’est écrasé', async (t) => {
    const ctx = await contexteJetable(t);
    const A = await ouvrir(ctx);
    const B = await ouvrir(ctx);
    await A.evaluate(() => window.jarvis.app.settings.set({ deviceName: 'Salon', aiProvider: 'groq', aiBase: 'https://api.groq.com/openai/v1' }));
    await B.evaluate(() => window.jarvis.app.settings.set({ deviceName: 'Bureau', volume: 0.3 }));
    // B a reçu le cerveau IA choisi dans A ; A a reçu le volume réglé dans B.
    await B.waitForFunction(() => window.jarvis.app.settings.get('aiProvider') === 'groq');
    await A.waitForFunction(() => window.jarvis.app.settings.get('volume') === 0.3);
    await A.reload();
    await pret(A);
    const a = await A.evaluate(() => ({ nom: window.jarvis.app.settings.get('deviceName'), ia: window.jarvis.app.settings.get('aiProvider'), vol: window.jarvis.app.settings.get('volume') }));
    assert.deepEqual(a, { nom: 'Salon', ia: 'groq', vol: 0.3 });
    assert.equal(await B.evaluate(() => window.jarvis.app.settings.get('deviceName')), 'Bureau');
    sansErreur(A, B);
  });

  it('« Tout réinitialiser » avec une autre fenêtre ouverte : la galerie repart sans blocage', async (t) => {
    const ctx = await contexteJetable(t);
    const A = await ouvrir(ctx);
    const B = await ouvrir(ctx);
    A.on('dialog', (d) => d.accept());
    await A.evaluate(() => window.jarvis.app.openSettings('General'));
    // L'autre fenêtre libère la base et prévient l'utilisateur.
    const avis = B.waitForFunction(() => /JARVIS réinitialisé ailleurs/.test(document.querySelector('#toasts').textContent), null, { timeout: 60000 });
    await Promise.all([A.waitForEvent('load', { timeout: 60000 }), A.click('#btnResetAll')]);
    await avis;
    await pret(A);
    assert.equal((await etat(A)).photos, 6, 'galerie de démonstration régénérée');
    // L'import fonctionne aussitôt dans la fenêtre réinitialisée.
    const png = await A.evaluate(async () => {
      const c = document.createElement('canvas'); c.width = 64; c.height = 48;
      c.getContext('2d').fillRect(0, 0, 10, 10);
      const b = await new Promise((r) => c.toBlob(r, 'image/png'));
      return [...new Uint8Array(await b.arrayBuffer())];
    });
    await A.setInputFiles('#fileInput', { name: 'apres-reset.png', mimeType: 'image/png', buffer: Buffer.from(png) });
    await A.waitForFunction(() => window.jarvis.state().photos === 7, null, { timeout: 15000 });
    sansErreur(A, B);
  });
});
