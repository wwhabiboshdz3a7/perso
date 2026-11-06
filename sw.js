// Service worker de Nour : met l'interface en cache pour un fonctionnement hors ligne.
// Les appels aux API d'IA ne sont jamais mis en cache.
//
// Stratégies :
//  - page d'accueil (/ ou /index.html), scripts, styles, manifeste : « stale-while-revalidate ».
//    La version en cache est servie immédiatement (démarrage instantané, hors ligne), puis le
//    réseau la met à jour en arrière-plan ; si un fichier a changé, l'interface propose de
//    recharger. Un déploiement n'exige donc pas de modifier VERSION : HTML et JS d'une même
//    visite proviennent toujours du même instantané du cache.
//  - polices, bibliothèques (vendor), icônes : cache d'abord (fichiers stables).
//  - seule une réponse HTML 200 de la page d'accueil remplace la copie hors ligne d'index.html.
// VERSION ne sert qu'à renouveler entièrement le cache (liste SHELL modifiée, par exemple).

const VERSION = 'nour-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './config.js',
  './assets/css/app.css',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/fonts/instrument-sans-latin-wght-normal.woff2',
  './assets/fonts/instrument-sans-latin-ext-wght-normal.woff2',
  './assets/fonts/instrument-sans-latin-wght-italic.woff2',
  './assets/fonts/instrument-serif-latin-400-normal.woff2',
  './assets/fonts/instrument-serif-latin-400-italic.woff2',
  './assets/fonts/jetbrains-mono-latin-wght-normal.woff2',
  './js/app.js',
  './js/attachments.js',
  './js/boot.js',
  './js/bus.js',
  './js/client.js',
  './js/crypto.js',
  './js/db.js',
  './js/exporter.js',
  './js/keystore.js',
  './js/markdown.js',
  './js/memory.js',
  './js/personas.js',
  './js/providers.js',
  './js/server-setup.js',
  './js/settings.js',
  './js/sse.js',
  './js/sync.js',
  './js/templates.js',
  './js/ui/avatar.js',
  './js/ui/connect-wizard.js',
  './js/ui/dialogs.js',
  './js/ui/errors.js',
  './js/ui/model-picker.js',
  './js/ui/panels.js',
  './js/ui/settings-dialog.js',
  './js/ui/thread.js',
  './js/util.js',
  './js/voice.js',
  './vendor/marked/marked.esm.js',
  './vendor/dompurify/purify.es.mjs',
  './vendor/highlight/highlight.min.js',
  // Formules : KaTeX et ses polices principales, pour qu'elles s'affichent aussi hors ligne.
  './vendor/katex/katex.min.js',
  './vendor/katex/katex.min.css',
  './vendor/katex/fonts/KaTeX_Main-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Main-Italic.woff2',
  './vendor/katex/fonts/KaTeX_Main-Bold.woff2',
  './vendor/katex/fonts/KaTeX_Math-Italic.woff2',
  './vendor/katex/fonts/KaTeX_AMS-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size1-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size2-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size3-Regular.woff2',
  './vendor/katex/fonts/KaTeX_Size4-Regular.woff2',
];

const SCOPE = new URL('./', self.registration.scope).pathname;
const SHELL_PAGES = new Set([SCOPE, `${SCOPE}index.html`]);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('nour-') && k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('délai dépassé')), ms));
}

const isHtml = (res) => /^text\/html/i.test(res.headers.get('content-type') || '');

/** Le contenu a-t-il changé ? (ETag si disponible, sinon comparaison du texte) */
async function differs(oldRes, newRes) {
  if (!oldRes) return false;
  const tag = (r) => r.headers.get('etag') || '';
  if (tag(oldRes) && tag(newRes)) return tag(oldRes) !== tag(newRes);
  try { return (await oldRes.clone().text()) !== (await newRes.clone().text()); } catch { return false; }
}

let notified = false;
async function notifyUpdate() {
  if (notified) return;
  notified = true;
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach((c) => c.postMessage({ type: 'update-available' }));
}

/** Sert la copie en cache tout de suite et la rafraîchit depuis le réseau. */
function staleWhileRevalidate(event, cacheKey, { accept = (res) => res.ok && res.type === 'basic' } = {}) {
  const req = event.request;
  const network = (async () => {
    // Une requête de navigation ne peut pas être recopiée avec des options : elle part telle quelle.
    const res = await (req.mode === 'navigate' ? fetch(req) : fetch(req, { cache: 'no-cache' }));
    if (res && accept(res)) {
      const cache = await caches.open(VERSION);
      const old = await cache.match(cacheKey, { ignoreSearch: true });
      if (await differs(old, res)) notifyUpdate();
      await cache.put(cacheKey, res.clone());
    }
    return res;
  })();
  event.waitUntil(network.catch(() => {}));
  return (async () => {
    const cached = await caches.match(cacheKey, { ignoreSearch: true });
    if (cached) return cached;
    try { return await network; } catch { return new Response('', { status: 504, statusText: 'Hors ligne' }); }
  })();
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fournisseurs d'IA, etc.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return;

  if (req.mode === 'navigate') {
    // Page de l'application : copie hors ligne d'index.html, mise à jour en arrière-plan.
    if (SHELL_PAGES.has(url.pathname)) {
      event.respondWith(staleWhileRevalidate(event, `${SCOPE}index.html`, { accept: (res) => res.status === 200 && res.type === 'basic' && isHtml(res) }));
      return;
    }
    // Autres pages (manifeste ouvert dans un onglet, 404…) : réseau seulement, jamais mises en cache.
    event.respondWith((async () => {
      try {
        return await Promise.race([fetch(req), timeout(6000)]);
      } catch {
        const cached = await caches.match(req, { ignoreSearch: true }) || await caches.match(`${SCOPE}index.html`);
        return cached || new Response('<!doctype html><meta charset="utf-8"><title>Hors ligne</title><h1>Hors ligne</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // Code de l'interface : instantané du cache, revalidé en arrière-plan.
  if (/\.(m?js|css|webmanifest)$/.test(url.pathname) && !url.pathname.includes('/vendor/')) {
    event.respondWith(staleWhileRevalidate(event, url.pathname));
    return;
  }

  // Ressources stables (polices, bibliothèques, icônes) : cache d'abord, puis réseau.
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') {
        const cache = await caches.open(VERSION);
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      return new Response('', { status: 504, statusText: 'Hors ligne' });
    }
  })());
});
