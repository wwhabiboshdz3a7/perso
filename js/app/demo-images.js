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
      // Gaz calculé au pixel (bruit fractal déformé) sur une grille réduite,
      // agrandie ensuite : filaments, couloirs de poussière, cœur lumineux.
      const r = rng(11);
      const W = 400, H = 250;
      const n1 = valueNoise(3), n2 = valueNoise(7), n3 = valueNoise(13);
      const img = new ImageData(W, H);
      const d = img.data;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const u = x / W * 4.2, v = y / H * 2.6;
          const wx = u + 1.6 * n1(u * 0.9, v * 0.9), wy = v + 1.6 * n2(u * 0.9 + 4.1, v * 0.9 + 1.7);
          const gas = n3(wx, wy);
          const dx = (x / W - 0.56) * 1.6, dy = (y / H - 0.47) * 1.05;
          const core = Math.exp(-(dx * dx + dy * dy) * 5.2);
          const dust = Math.max(0, n1(wx * 2.2 + 9, wy * 2.2) - 0.5) * 2.4;
          let k = Math.max(0, gas - 0.36) * 2.6 * (0.35 + core * 1.25);
          k *= 1 - Math.min(0.85, dust);
          const m = Math.min(1, n2(wx * 1.3, wy * 1.3) * 1.25);
          // Magenta et violet en périphérie, cyan et ambre vers le cœur.
          const R = 255 * k * (0.95 * m + 0.25 * core) + 200 * core * core * 0.42;
          const G = 255 * k * (0.28 + 0.62 * core * (1 - m * 0.4)) + 235 * core * core * 0.5;
          const B = 255 * k * (0.75 + 0.35 * (1 - m)) + 255 * core * core * 0.62;
          const i = (y * W + x) * 4;
          d[i] = Math.min(255, 4 + R); d[i + 1] = Math.min(255, 5 + G); d[i + 2] = Math.min(255, 14 + B); d[i + 3] = 255;
        }
      }
      const small = makeCanvas(W, H);
      small.getContext('2d').putImageData(img, 0, 0);
      ctx.fillStyle = '#02040a'; ctx.fillRect(0, 0, w, h);
      stars(ctx, w, h, 700, r);
      ctx.globalCompositeOperation = 'lighter';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(small, 0, 0, w, h);
      // Étoiles brillantes avec aigrettes de diffraction.
      for (let k = 0; k < 9; k++) {
        const x = r() * w, y = r() * h, L = 14 + r() * 40, c = r() < 0.5 ? '200,235,255' : '255,220,180';
        const g = ctx.createRadialGradient(x, y, 0, x, y, L * 0.5);
        g.addColorStop(0, `rgba(${c},0.95)`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.fillRect(x - L, y - L, L * 2, L * 2);
        ctx.strokeStyle = `rgba(${c},0.55)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      stars(ctx, w, h, 160, r, '230,244,255');
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
      // Rideaux de lumière (verts à la base, violets au sommet) striés de
      // rayons, montagnes en ombre chinoise et reflet dans un lac.
      const r = rng(5);
      const horizon = 0.72;
      const lake = Math.round(h * horizon);
      const sky = ctx.createLinearGradient(0, 0, 0, lake);
      sky.addColorStop(0, '#020711'); sky.addColorStop(0.75, '#061d27'); sky.addColorStop(1, '#0b3036');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, lake);
      const water = ctx.createLinearGradient(0, lake, 0, h);
      water.addColorStop(0, '#07232a'); water.addColorStop(1, '#01070b');
      ctx.fillStyle = water; ctx.fillRect(0, lake, w, h - lake);
      stars(ctx, w, lake * 0.95, 650, r);
      const W = 800, H = 450;
      const nA = valueNoise(21), nB = valueNoise(22), nC = valueNoise(23);
      const img = new ImageData(W, H);
      const d = img.data;
      const curtains = [
        { base: 0.52, amp: 0.07, height: 0.3, f: 1.7, ph: 0.3, k: 1 },
        { base: 0.43, amp: 0.06, height: 0.22, f: 2.6, ph: 2.1, k: 0.65 },
        { base: 0.62, amp: 0.04, height: 0.16, f: 1.2, ph: 4.4, k: 0.5 },
      ];
      const rows = Math.floor(H * horizon);
      for (let x = 0; x < W; x++) {
        const u = x / W;
        for (const c of curtains) {
          const yb = c.base + c.amp * Math.sin(u * Math.PI * c.f + c.ph) + 0.12 * (nC(u * 3.2 + c.ph, c.ph * 2) - 0.5);
          const rays = 0.4 + 0.6 * Math.pow(nB(u * 46 + c.ph * 7, c.ph), 1.8);
          const body = Math.max(0, nA(u * 3 + c.ph * 3, 1.3) - 0.2) * 1.7;
          const I = c.k * rays * body;
          if (I < 0.01) continue;
          for (let y = 0; y < rows; y++) {
            const v = y / H;
            // Bord inférieur lumineux et net, voile qui s'estompe vers le haut.
            const a = v <= yb ? Math.exp(-(yb - v) / c.height) : Math.exp(-(((v - yb) / 0.014) ** 2));
            const e = a * I;
            if (e < 0.004) continue;
            const t = Math.min(1, Math.max(0, (yb - v) / (c.height * 1.5)));
            const i = (y * W + x) * 4;
            d[i] += 255 * e * (0.2 + 0.8 * t * t);
            d[i + 1] += 255 * e * (1 - 0.7 * t);
            d[i + 2] += 255 * e * (0.55 + 0.45 * t);
            d[i + 3] = 255;
          }
        }
      }
      const layer = makeCanvas(W, H);
      layer.getContext('2d').putImageData(img, 0, 0);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, w, lake); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(layer, 0, 0, w, h);
      ctx.globalAlpha = 0.45;
      ctx.drawImage(layer, 0, 0, w, h);
      ctx.restore();
      // Relief des montagnes (gardé pour le reflet).
      const ridge = [];
      for (let x = 0; x <= w; x += 8) {
        ridge.push([x, lake - Math.pow(Math.abs(Math.sin(x * 0.0036 + 0.6)), 1.5) * 150 - Math.abs(Math.sin(x * 0.015)) * 22 - (nC(x * 0.01, 3) - 0.5) * 40]);
      }
      // Lac : reflet inversé, atténué et ondulé, puis le reflet des montagnes.
      ctx.save();
      ctx.beginPath(); ctx.rect(0, lake, w, h - lake); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      for (let y = 0; y < h - lake; y += 2) {
        const sy = ((lake - y) / h) * H;
        const off = Math.sin(y * 0.42) * 5;
        ctx.globalAlpha = 0.55 * (1 - y / (h - lake)) ** 1.3;
        ctx.drawImage(layer, 0, sy, W, 1, off - 6, lake + y, w + 12, 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = '#01070b';
      ctx.beginPath(); ctx.moveTo(0, lake);
      for (const [x, y] of ridge) ctx.lineTo(x, lake + (lake - y) * 0.9);
      ctx.lineTo(w, lake); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#010509';
      ctx.beginPath(); ctx.moveTo(0, lake + 1);
      for (const [x, y] of ridge) ctx.lineTo(x, y);
      ctx.lineTo(w, lake + 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(110,255,200,0.16)';
      ctx.fillRect(0, lake, w, 1);
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
