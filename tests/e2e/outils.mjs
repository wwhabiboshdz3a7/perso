// Outils communs aux tests de bout en bout : serveur, navigateur, pages
// instrumentées (erreurs console), simulateurs de services externes.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
export const RACINE = path.resolve(ICI, '../..');
export const PORT = Number(process.env.JARVIS_PORT || 9147);
export const ORIGINE = `http://127.0.0.1:${PORT}`;
export const CAPTURES = process.env.JARVIS_CAPTURES || path.join(tmpdir(), 'jarvis-captures');
mkdirSync(CAPTURES, { recursive: true });

const require = createRequire(import.meta.url);

/** Charge un module npm facultatif (Playwright, serveur PeerJS, axe-core). */
export function facultatif(nom) {
  const dossiers = [process.env.JARVIS_NPM, path.join(RACINE, 'node_modules')].filter(Boolean);
  for (const d of dossiers) {
    try { return require(require.resolve(nom, { paths: [d] })); } catch { /* suivant */ }
  }
  try { return require(nom); } catch { return null; }
}

export const playwright = facultatif('playwright');

export const ARGS_CHROMIUM = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  '--autoplay-policy=no-user-gesture-required',
  '--disable-features=WebRtcHideLocalIpsWithMdns',
];

export async function demarrerServeur() {
  const occupe = await fetch(`${ORIGINE}/netlify.toml`).then(() => true, () => false);
  if (occupe) throw new Error(`Le port ${PORT} est déjà utilisé (autre série de tests ?) : choisissez-en un autre avec JARVIS_PORT.`);
  const proc = spawn('python3', [path.join(ICI, 'serveur.py'), RACINE, String(PORT)], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    if (proc.exitCode !== null) break;
    try {
      const r = await fetch(`${ORIGINE}/netlify.toml`);
      if (r.ok) return proc;
    } catch { /* pas encore prêt */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error(`Serveur de test injoignable sur le port ${PORT}`);
}

export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

// ——— Services externes simulés (bloqués dans l'environnement de test) ———

export const METEO = { temperature_2m: 17.4, apparent_temperature: 16.1, relative_humidity_2m: 61, weather_code: 2, wind_speed_10m: 12.3, is_day: 1 };

/** Open-Meteo : géocodage + conditions actuelles. */
export async function simulerMeteo(contexte) {
  await contexte.route(/open-meteo\.com/, (route) => {
    const url = new URL(route.request().url());
    if (url.hostname.startsWith('geocoding')) {
      const nom = (url.searchParams.get('name') || '').toLowerCase();
      const villes = {
        toulouse: { name: 'Toulouse', latitude: 43.6047, longitude: 1.4442, country: 'France', admin1: 'Occitanie' },
        lyon: { name: 'Lyon', latitude: 45.764, longitude: 4.8357, country: 'France', admin1: 'Auvergne-Rhône-Alpes' },
      };
      return route.fulfill({ json: villes[nom] ? { results: [villes[nom]] } : {} });
    }
    const chaud = url.searchParams.get('latitude')?.startsWith('45');
    return route.fulfill({ json: { current: chaud ? { ...METEO, temperature_2m: 21.2, weather_code: 0 } : METEO } });
  });
}

/** Serveur cloud PeerJS injoignable (comme dans cet environnement). */
export async function bloquerPeerCloud(contexte) {
  await contexte.route(/peerjs\.com/, (route) => route.abort('connectionrefused'));
  await contexte.routeWebSocket(/peerjs\.com/, (ws) => ws.close({ code: 1006, reason: 'bloqué' }));
}

/** Point d'accès compatible OpenAI simulé ; renvoie la liste des requêtes reçues. */
export async function simulerIA(contexte, base = 'https://ia.exemple.test/v1') {
  const requetes = [];
  await contexte.route(`${base}/chat/completions`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST' } });
    const corps = JSON.parse(req.postData() || '{}');
    requetes.push({ auth: req.headers().authorization, corps });
    const question = corps.messages?.at(-1)?.content || '';
    const reponse = /australie/i.test(question) ? 'La capitale de l’Australie est **Canberra**, pas Sydney.' : 'Systèmes opérationnels.';
    return route.fulfill({ headers: { 'access-control-allow-origin': '*' }, json: { choices: [{ message: { role: 'assistant', content: reponse } }] } });
  });
  return requetes;
}

/** Micro simulé : remplace la reconnaissance vocale du navigateur. */
export const MICRO_SIMULE = () => {
  class FausseReconnaissance {
    start() { window.__micro = this; setTimeout(() => this.onstart?.(), 10); }
    stop() { setTimeout(() => this.onend?.(), 10); }
    abort() { this.stop(); }
  }
  window.SpeechRecognition = FausseReconnaissance;
  window.webkitSpeechRecognition = FausseReconnaissance;
  window.__dire = (texte) => {
    const resultat = Object.assign([{ transcript: texte, confidence: 0.95 }], { isFinal: true });
    window.__micro?.onresult?.({ resultIndex: 0, results: [resultat] });
  };
};

/**
 * Synthèse vocale simulée : enregistre les phrases prononcées. (Le Chromium de
 * test sous Linux, sans speech-dispatcher, bloque plusieurs secondes sur la
 * vraie API ; on vérifie ici ce que JARVIS demande de dire, et dans quelle langue.)
 */
export const SYNTHESE_SIMULEE = () => {
  const dites = [];
  window.__dites = dites;
  const voix = [
    { name: 'Daniel', lang: 'en-GB', localService: true, default: true },
    { name: 'Amélie', lang: 'fr-CA', localService: true, default: false },
    { name: 'Thomas', lang: 'fr-FR', localService: true, default: false },
  ];
  class Enonce {
    constructor(text) { Object.assign(this, { text, lang: '', voice: null, rate: 1, pitch: 1, volume: 1 }); }
  }
  const synthese = {
    speaking: false, pending: false, paused: false,
    getVoices: () => voix,
    speak(u) {
      dites.push({ text: u.text, lang: u.lang, voice: u.voice?.name || null });
      setTimeout(() => { u.onstart?.(); setTimeout(() => u.onend?.(), 30); }, 5);
    },
    cancel() {}, pause() {}, resume() {}, addEventListener() {}, removeEventListener() {},
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synthese, configurable: true });
  window.SpeechSynthesisUtterance = Enonce;
};

// ——— Pages instrumentées ———————————————————————————————————————————

const BRUIT = [
  /Failed to load resource: net::ERR_(FAILED|CONNECTION_REFUSED|TUNNEL_CONNECTION_FAILED|NAME_NOT_RESOLVED)/, // services externes bloqués volontairement
];

/** Ouvre une page en collectant les erreurs (console, exceptions, ressources locales manquantes). */
export async function ouvrir(contexte, chemin = '/?rapide', { attendrePret = true } = {}) {
  const page = await contexte.newPage();
  // Sondage par intervalle plutôt qu'à chaque image : une page dont l'affichage
  // est momentanément figé (rendu logiciel) reste vérifiable.
  const attente = page.waitForFunction.bind(page);
  page.waitForFunction = (fn, arg, opts = {}) => attente(fn, arg, { polling: 200, ...opts });
  page.erreurs = [];
  page.on('console', (m) => {
    const t = m.text();
    // Les avertissements de l'application (« [jarvis] … ») signalent une exception rattrapée.
    if (m.type() === 'warning' && t.startsWith('[jarvis]')) { page.erreurs.push(`avertissement : ${t}`); return; }
    if (m.type() !== 'error') return;
    if (BRUIT.some((re) => re.test(t))) return;
    page.erreurs.push(`console : ${t}`);
  });
  page.on('pageerror', (e) => page.erreurs.push(`exception : ${e.message}`));
  page.on('response', (r) => {
    if (r.url().startsWith(ORIGINE) && r.status() >= 400) page.erreurs.push(`HTTP ${r.status()} : ${r.url()}`);
  });
  await page.goto(ORIGINE + chemin, { waitUntil: 'load' });
  if (attendrePret) {
    await pret(page);
    await stabiliser(page);
  }
  return page;
}

/**
 * Attend que l'affichage tourne de nouveau à un rythme régulier (le rendu
 * logiciel du navigateur de test peut se figer quelques secondes quand une
 * seconde page démarre).
 */
export async function stabiliser(page, timeout = 90000) {
  await page.evaluate((limite) => new Promise((resolve, reject) => {
    const fin = setTimeout(() => reject(new Error('affichage figé')), limite);
    let n = 0;
    let last = performance.now();
    const f = () => {
      const now = performance.now();
      n = now - last < 150 ? n + 1 : 0;
      last = now;
      if (n >= 20) { clearTimeout(fin); resolve(); } else requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }), timeout);
}

/** Application démarrée et galerie chargée (visuels de démo générés). */
export async function pret(page) {
  await page.waitForFunction(() => window.jarvis?.app?.gallery?.ready && document.body.classList.contains('is-ready'), null, { timeout: 120000 });
}

export const etat = (page) => page.evaluate(() => window.jarvis.state());

/** Rejoue un scénario de geste à travers le pipeline (comme la caméra). */
export function geste(page, nom, params = {}) {
  return page.evaluate(([n, p]) => window.jarvis.sim.play(n, p), [nom, params]);
}

/** Centre d'un élément, en coordonnées d'affichage caméra (0..1). */
export function cible(page, selecteur) {
  return page.evaluate((s) => window.jarvis.sim.centerOf(s), selecteur);
}

export async function commande(page, texte) {
  await page.fill('#cmdInput', texte);
  await page.press('#cmdInput', 'Enter');
}

export async function reponse(page, motif, timeout = 15000) {
  const re = motif instanceof RegExp ? motif.source : motif;
  const flags = motif instanceof RegExp ? motif.flags : 'i';
  await page.waitForFunction(([r, f]) => new RegExp(r, f).test(document.querySelector('#asstJarvis q').textContent), [re, flags], { timeout });
  return page.textContent('#asstJarvis q');
}

export async function capture(page, nom, options = {}) {
  const fichier = path.join(CAPTURES, `${nom}.png`);
  await page.screenshot({ path: fichier, timeout: 120000, caret: 'hide', ...options });
  return fichier;
}

/** Empreinte SHA-256 d'un blob de la galerie (calculée dans la page). */
export function empreintePhoto(page, id) {
  return page.evaluate(async (pid) => {
    const rec = window.jarvis.app.gallery.get(pid);
    const buf = await rec.blob.arrayBuffer();
    const h = await crypto.subtle.digest('SHA-256', buf);
    const bmp = await createImageBitmap(rec.blob);
    return { hash: [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join(''), width: bmp.width, height: bmp.height, size: rec.blob.size, source: rec.source };
  }, id);
}

/** Proportion de pixels non transparents d'un canevas 2D. */
export function encre(page, selecteur) {
  return page.evaluate((s) => {
    const c = document.querySelector(s);
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 16) if (d[i] > 20) n++;
    return n / (d.length / 16);
  }, selecteur);
}
