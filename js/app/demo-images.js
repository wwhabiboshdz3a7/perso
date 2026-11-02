// Visuels de démonstration générés en canvas (aucune image externe).
// Module sans DOM obligatoire : utilisable dans un Worker (OffscreenCanvas)
// comme sur le fil principal.

/** Canevas hors écran si possible, sinon élément <canvas>. */
export function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/** Encode un canevas (OffscreenCanvas ou <canvas>) en Blob. */
export function encodeCanvas(canvas, type = 'image/jpeg', quality = 0.9) {
  if (canvas.convertToBlob) return canvas.convertToBlob({ type, quality });
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Encodage impossible'))), type, quality));
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function valueNoise(seed) {
  const r = rng(seed);
  const N = 256;
  const perm = new Uint8Array(N * 2);
  const vals = new Float32Array(N);
  for (let i = 0; i < N; i++) { perm[i] = i; vals[i] = r(); }
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < N; i++) perm[N + i] = perm[i];
  const fade = (t) => t * t * (3 - 2 * t);
  const at = (x, y) => vals[perm[(perm[x & 255] + y) & 511]];
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = fade(x - xi), yf = fade(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  return (x, y) => {
    let v = 0, amp = 0.5, f = 1;
    for (let o = 0; o < 5; o++) { v += n2(x * f, y * f) * amp; amp *= 0.5; f *= 2.03; }
    return v;
  };
}

function stars(ctx, w, h, n, r, color = '255,255,255') {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, s = r() < 0.04 ? 1.6 + r() * 1.4 : 0.4 + r() * 0.9;
    ctx.fillStyle = `rgba(${color},${0.3 + r() * 0.7})`;
    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  }
}

const SCENES = [
  {
    name: 'Nébuleuse', w: 1600, h: 1000,
    draw(ctx, w, h) {
      const r = rng(11);
      ctx.fillStyle = '#02040a'; ctx.fillRect(0, 0, w, h);
      stars(ctx, w, h, 900, r);
      ctx.globalCompositeOperation = 'lighter';
      const clouds = [['255,90,160', 0.62, 0.45, 520], ['90,170,255', 0.38, 0.55, 600], ['255,180,90', 0.55, 0.38, 300], ['120,255,230', 0.3, 0.35, 260]];
      for (const [c, cx, cy, rad] of clouds) {
        for (let k = 0; k < 26; k++) {
          const x = w * cx + (r() - 0.5) * rad * 1.6, y = h * cy + (r() - 0.5) * rad;
          const gr = rad * (0.3 + r() * 0.5);
          const g = ctx.createRadialGradient(x, y, 0, x, y, gr);
          g.addColorStop(0, `rgba(${c},0.12)`); g.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = g; ctx.fillRect(x - gr, y - gr, gr * 2, gr * 2);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      stars(ctx, w, h, 120, r, '220,240,255');
    },
  },
  {
    name: 'Toulouse, la nuit', w: 1600, h: 1067,
    draw(ctx, w, h) {
      const r = rng(31);
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0b0f2b'); sky.addColorStop(0.55, '#3a1f4d'); sky.addColorStop(0.72, '#c2576b'); sky.addColorStop(1, '#1a0f1f');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      stars(ctx, w, h * 0.5, 260, r);
      ctx.fillStyle = 'rgba(255,230,200,0.9)'; ctx.beginPath(); ctx.arc(w * 0.78, h * 0.2, 46, 0, Math.PI * 2); ctx.fill();
      const base = h * 0.7;
      // Silhouette : toits, clocher-mur (Saint-Sernin stylisé), dôme.
      ctx.fillStyle = '#5a2632';
      ctx.beginPath(); ctx.moveTo(0, base);
      let x = 0;
      while (x < w) { const bw = 40 + r() * 90, bh = 40 + r() * 120; ctx.lineTo(x, base - bh); ctx.lineTo(x + bw, base - bh - r() * 20); x += bw; }
      ctx.lineTo(w, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3d1720';
      const tx = w * 0.42;
      for (let k = 0; k < 5; k++) { const tw = 120 - k * 22; ctx.fillRect(tx - tw / 2, base - 170 - k * 62, tw, 64); }
      ctx.beginPath(); ctx.moveTo(tx - 12, base - 480); ctx.lineTo(tx, base - 560); ctx.lineTo(tx + 12, base - 480); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.66, base - 150, 90, Math.PI, 0); ctx.fillRect(w * 0.66 - 90, base - 150, 180, 150); ctx.fill();
      // Fenêtres.
      for (let k = 0; k < 340; k++) {
        ctx.fillStyle = `rgba(255,${180 + r() * 60},${100 + r() * 60},${0.4 + r() * 0.6})`;
        ctx.fillRect(r() * w, base - r() * 130, 3, 4);
      }
      // Garonne et reflets.
      const river = ctx.createLinearGradient(0, base, 0, h);
      river.addColorStop(0, '#2a1630'); river.addColorStop(1, '#07060d');
      ctx.fillStyle = river; ctx.fillRect(0, base, w, h - base);
      for (let k = 0; k < 220; k++) {
        const y = base + 8 + r() * (h - base - 10), xx = r() * w;
        ctx.fillStyle = `rgba(255,${150 + r() * 80},120,${0.08 + r() * 0.25})`;
        ctx.fillRect(xx, y, 20 + r() * 60, 1.5);
      }
      // Pont aux arches.
      ctx.strokeStyle = '#7a3442'; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(0, base + 30); ctx.lineTo(w, base + 30); ctx.stroke();
      ctx.lineWidth = 6;
      for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(110 + k * 230, base + 110, 80, Math.PI, 0); ctx.stroke(); }
    },
  },
  {
    name: 'Réacteur', w: 1400, h: 1400,
    draw(ctx, w, h) {
      ctx.fillStyle = '#01070b'; ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 9; i++) {
        const rad = 80 + i * 62;
        ctx.strokeStyle = i % 3 === 1 ? 'rgba(255,181,71,0.75)' : 'rgba(110,231,255,0.7)';
        ctx.lineWidth = i % 2 ? 2 : 6;
        ctx.setLineDash(i % 2 ? [] : [rad * 0.3, rad * 0.12]);
        ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 24;
        ctx.beginPath(); ctx.arc(cx, cy, rad, i * 0.4, i * 0.4 + Math.PI * (1.2 + (i % 3) * 0.3)); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (let k = 0; k < 120; k++) {
        const a = (k / 120) * Math.PI * 2, r1 = 600, r2 = k % 10 ? 620 : 650;
        ctx.strokeStyle = 'rgba(110,231,255,0.5)'; ctx.lineWidth = 2; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke();
      }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160);
      g.addColorStop(0, 'rgba(230,252,255,1)'); g.addColorStop(0.3, 'rgba(110,231,255,0.8)'); g.addColorStop(1, 'rgba(110,231,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 160, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0;
    },
  },
  {
    name: 'Aurore boréale', w: 1600, h: 900,
    draw(ctx, w, h) {
      const r = rng(5);
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#010814'); sky.addColorStop(1, '#03222a');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      stars(ctx, w, h * 0.7, 500, r);
      ctx.globalCompositeOperation = 'lighter';
      for (let band = 0; band < 4; band++) {
        const hue = [150, 170, 190, 290][band];
        for (let x = 0; x < w; x += 3) {
          const y = h * (0.28 + band * 0.07) + Math.sin(x * 0.004 + band * 1.7) * 70 + Math.sin(x * 0.011 + band) * 25;
          const len = 160 + Math.sin(x * 0.007 + band * 3) * 90;
          const g = ctx.createLinearGradient(0, y - len, 0, y + 20);
          g.addColorStop(0, `hsla(${hue},100%,60%,0)`); g.addColorStop(0.75, `hsla(${hue},100%,62%,0.09)`); g.addColorStop(1, `hsla(${hue},100%,70%,0)`);
          ctx.fillStyle = g; ctx.fillRect(x, y - len, 3, len + 20);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#010509';
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h * 0.82 - Math.abs(Math.sin(x * 0.006)) * 90 - r() * 14);
      ctx.lineTo(w, h); ctx.fill();
    },
  },
  {
    name: 'Relief topographique', w: 1600, h: 1200,
    draw(ctx, w, h) {
      // Calcul à demi-résolution puis agrandissement (rapide et net).
      const lw = w / 2, lh = h / 2;
      const off = makeCanvas(lw, lh);
      const octx = off.getContext('2d');
      const n = valueNoise(77);
      const levels = 18;
      const img = octx.createImageData(lw, lh);
      const d = img.data;
      for (let y = 0; y < lh; y++) {
        for (let x = 0; x < lw; x++) {
          const v = n(x / 130, y / 130);
          const band = v * levels;
          const f = band - Math.floor(band);
          const line = f < 0.07 || f > 0.93;
          const major = line && Math.round(band) % 5 === 0;
          const i = (y * lw + x) * 4;
          if (line) { d[i] = major ? 255 : 90; d[i + 1] = major ? 181 : 200; d[i + 2] = major ? 71 : 230; }
          else { d[i] = 4 + v * 10; d[i + 1] = 18 + v * 40; d[i + 2] = 26 + v * 50; }
          d[i + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, w, h);
      ctx.strokeStyle = 'rgba(110,231,255,0.12)'; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    },
  },
  {
    name: 'Circuit NEXORA', w: 1600, h: 1000,
    draw(ctx, w, h) {
      const r = rng(2026);
      ctx.fillStyle = '#020a0e'; ctx.fillRect(0, 0, w, h);
      const grid = 40;
      ctx.lineCap = 'round';
      for (let k = 0; k < 140; k++) {
        let x = Math.floor(r() * (w / grid)) * grid, y = Math.floor(r() * (h / grid)) * grid;
        const amber = r() < 0.18;
        ctx.strokeStyle = amber ? 'rgba(255,181,71,0.85)' : 'rgba(110,231,255,0.6)';
        ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 10;
        ctx.lineWidth = r() < 0.2 ? 4 : 2;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < 6; s++) {
          const dir = Math.floor(r() * 4), len = (1 + Math.floor(r() * 4)) * grid;
          if (dir === 0) x += len; else if (dir === 1) x -= len; else if (dir === 2) { x += len; y += len; } else y += len;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#020a0e'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(2,10,14,0.85)'; ctx.fillRect(w / 2 - 260, h / 2 - 90, 520, 180);
      ctx.strokeStyle = 'rgba(110,231,255,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(w / 2 - 260, h / 2 - 90, 520, 180);
      ctx.fillStyle = '#e2f8ff'; ctx.font = '600 92px "Chakra Petch", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('NEXORA', w / 2, h / 2 + 4);
    },
  },
];

export const DEMO_COUNT = SCENES.length;

/** Dessine et encode le visuel de démonstration n° index. */
export async function renderDemo(index) {
  const sc = SCENES[index];
  const c = makeCanvas(sc.w, sc.h);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  sc.draw(ctx, sc.w, sc.h);
  const blob = await encodeCanvas(c, 'image/jpeg', 0.88);
  c.width = c.height = 0;
  return { name: sc.name, blob, width: sc.w, height: sc.h };
}

/** Image de synthèse utilisée pour les captures sans caméra. */
export function simulatedFeed(w, h, t = Date.now()) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.7);
  g.addColorStop(0, '#0d3242'); g.addColorStop(1, '#020609');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(110,231,255,0.12)';
  const off = (t / 40) % 60;
  for (let x = -60; x < w + 60; x += 60) { ctx.beginPath(); ctx.moveTo(x + off, h * 0.55); ctx.lineTo((x + off - w / 2) * 3 + w / 2, h); ctx.stroke(); }
  for (let k = 0; k < 10; k++) { const y = h * 0.55 + Math.pow(k / 10, 2) * h * 0.45; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(110,231,255,0.8)'; ctx.font = `600 ${Math.round(h / 16)}px "Chakra Petch", sans-serif`; ctx.textAlign = 'center';
  ctx.fillText('FLUX SIMULÉ', w / 2, h * 0.42);
  return c;
}
