// Worker d'images : redimensionnement/encodage JPEG et génération des
// visuels de démonstration, hors du fil principal (l'interface et le suivi
// des mains restent fluides pendant la préparation d'une photo).

import { renderDemo, DEMO_COUNT } from './demo-images.js';

let fontReady = null;
function loadFont() {
  if (!fontReady) {
    fontReady = (async () => {
      if (typeof FontFace === 'undefined' || !self.fonts) return;
      const url = new URL('../../vendor/fonts/chakra-petch-latin-600-normal.woff2', import.meta.url);
      const face = new FontFace('Chakra Petch', `url("${url}")`, { weight: '600' });
      self.fonts.add(await face.load());
    })().catch(() => { /* police de repli */ });
  }
  return fontReady;
}

// Les redimensionnements (import, vignette, envoi) passent avant le visuel de
// démonstration suivant : un import fait au premier lancement n'attend pas la
// fin de la génération.
let urgent = 0;
const waiters = [];
function urgentDone() {
  if (--urgent === 0) for (const w of waiters.splice(0)) w();
}
function whenIdle() {
  return urgent ? new Promise((r) => waiters.push(r)) : Promise.resolve();
}

async function resize({ blob, max, quality }) {
  const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const width = Math.max(1, Math.round(bmp.width * k));
  const height = Math.max(1, Math.round(bmp.height * k));
  const c = new OffscreenCanvas(width, height);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#03080c';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const out = await c.convertToBlob({ type: 'image/jpeg', quality });
  return { blob: out, width, height };
}

self.onmessage = async (e) => {
  const msg = e.data || {};
  try {
    if (msg.cmd === 'resize') {
      urgent++;
      try {
        self.postMessage({ id: msg.id, ...(await resize(msg)) });
      } finally { urgentDone(); }
    } else if (msg.cmd === 'demo') {
      await loadFont();
      for (let i = 0; i < DEMO_COUNT; i++) {
        await whenIdle();
        self.postMessage({ id: msg.id, partial: true, index: i, img: await renderDemo(i) });
      }
      self.postMessage({ id: msg.id, done: true });
    } else if (msg.cmd === 'ping') {
      self.postMessage({ id: msg.id, ok: true });
    }
  } catch (err) {
    self.postMessage({ id: msg.id, error: String(err?.message || err) });
  }
};
