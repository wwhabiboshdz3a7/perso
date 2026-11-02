// Service worker de Nour : met l'interface en cache pour un fonctionnement hors ligne.
// Les appels aux API d'IA ne sont jamais mis en cache.

const VERSION = 'nour-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
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
  './js/client.js',
  './js/crypto.js',
  './js/db.js',
  './js/exporter.js',
  './js/keystore.js',
  './js/markdown.js',
  './js/memory.js',
  './js/personas.js',
  './js/providers.js',
  './js/settings.js',
  './js/sse.js',
  './js/templates.js',
  './js/ui/avatar.js',
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
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)));
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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fournisseurs d'IA, etc.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return;

  // Pages : réseau d'abord (version fraîche), cache en secours.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await Promise.race([fetch(req), timeout(4000)]);
        if (res && res.ok) {
          const cache = await caches.open(VERSION);
          cache.put('./index.html', res.clone());
        }
        return res;
      } catch {
        const cached = await caches.match('./index.html');
        return cached || new Response('<h1>Hors ligne</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // Ressources statiques : cache d'abord, puis réseau (et mise en cache de KaTeX, polices, etc.).
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
