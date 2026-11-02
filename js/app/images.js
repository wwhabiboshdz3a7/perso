// Traitement d'images : dans un Worker (OffscreenCanvas) quand c'est possible,
// sinon sur le fil principal. Décodage, redimensionnement, encodage JPEG et
// visuels de démonstration.

import { renderDemo, DEMO_COUNT } from './demo-images.js';

export { DEMO_COUNT };

let worker = null;
let unavailable = typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined';
let seq = 0;
const pending = new Map();

function getWorker() {
  if (unavailable) return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('./image-worker.js', import.meta.url), { type: 'module', name: 'jarvis-images' });
    } catch {
      unavailable = true;
      return null;
    }
    worker.onmessage = (e) => {
      const m = e.data || {};
      const p = pending.get(m.id);
      if (!p) return;
      if (m.partial) { p.onPartial?.(m); return; }
      pending.delete(m.id);
      if (m.error) p.reject(Object.assign(new Error(m.error), { fromWorker: true }));
      else p.resolve(m);
    };
    worker.onerror = (e) => {
      // Worker de module non pris en charge (ancien navigateur) : repli définitif.
      e.preventDefault?.();
      unavailable = true;
      worker?.terminate();
      worker = null;
      for (const p of pending.values()) p.reject(new Error('worker indisponible'));
      pending.clear();
    };
  }
  return worker;
}

function call(msg, onPartial) {
  const w = getWorker();
  if (!w) return Promise.reject(new Error('worker indisponible'));
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onPartial });
    w.postMessage({ ...msg, id });
  });
}

export async function decodeImage(blob) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch { /* repli */ }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { resolve(img); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });
}

async function resizeHere(blob, max, quality) {
  const img = await decodeImage(blob);
  const w0 = img.width, h0 = img.height;
  const k = Math.min(1, max / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#03080c';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  img.close?.();
  const out = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Encodage impossible'))), 'image/jpeg', quality));
  return { blob: out, width: w, height: h };
}

/** Redimensionne (côté le plus long ≤ max) et encode en JPEG. */
export async function resizeToJpeg(blob, max = 2560, quality = 0.9) {
  try {
    const r = await call({ cmd: 'resize', blob, max, quality });
    return { blob: r.blob, width: r.width, height: r.height };
  } catch (err) {
    if (err.fromWorker) throw new Error('Image illisible');
    return resizeHere(blob, max, quality);
  }
}

/**
 * Génère les visuels de démonstration, transmis un par un (dans l'ordre).
 * @param {(img:{name:string, blob:Blob, width:number, height:number}, index:number) => (void|Promise<void>)} [onImage]
 */
export async function generateDemoImages(onImage) {
  const done = new Set();
  let chain = Promise.resolve();
  const deliver = (img, i) => {
    done.add(i);
    chain = chain.then(() => onImage?.(img, i));
  };
  try {
    await call({ cmd: 'demo' }, (m) => deliver(m.img, m.index));
  } catch {
    try { await document.fonts?.load('600 92px "Chakra Petch"'); } catch { /* police de repli */ }
    for (let i = 0; i < DEMO_COUNT; i++) {
      if (done.has(i)) continue;
      deliver(await renderDemo(i), i);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  await chain;
}
