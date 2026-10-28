import { injectCSS, loop, virtualPointer, sampleText, resizeCanvas, DPR, FONTS } from '../core.js';

injectCSS('particules', `
.pt__cap { position: absolute; left: 50%; bottom: 14vh; transform: translateX(-50%); color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; z-index: 2; }
`);

// Moteur réutilisable : points échantillonnés, ressorts, explosion, morphing.
export function createSwarm(cv, { small = false } = {}) {
  const g = cv.getContext('2d');
  let P = [], W = 0, H = 0;
  const api = {
    get count() { return P.length; },
    setTarget(text, { font = `900 {s}px ${FONTS.display}`, lines = null, step } = {}) {
      resizeCanvas(cv);
      W = cv.width; H = cv.height;
      const st = step || Math.max(3, Math.round(Math.sqrt((W * H) / (small ? 22000 : 60000))));
      const pts = sampleText(text, { width: W, height: Math.round(H * 0.8), font, step: st, lines });
      const n = pts.length / 2;
      const oy = H * 0.1;
      const next = [];
      for (let i = 0; i < n; i++) {
        const q = P[i] || { x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0 };
        q.hx = pts[i * 2]; q.hy = pts[i * 2 + 1] + oy; q.r = st * 0.3; q.free = 0;
        next.push(q);
      }
      // mélange pour un morphing plus organique
      for (let i = next.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const a = next[i].hx, b = next[i].hy; next[i].hx = next[j].hx; next[i].hy = next[j].hy; next[j].hx = a; next[j].hy = b; }
      P = next;
      return st;
    },
    explode(power = 1) {
      for (const q of P) {
        const a = Math.atan2(q.y - H / 2, q.x - W / 2) + (Math.random() - 0.5) * 1.2;
        const s = (300 + Math.random() * 1400) * power * DPR;
        q.vx += Math.cos(a) * s; q.vy += Math.sin(a) * s - 200; q.free = 1;
      }
    },
    gather() { for (const q of P) q.free = 0; },
    // spread : 0 = texte formé, 1 = nuage dispersé (pour le scrub)
    step(dt, { px = -1e4, py = -1e4, spread = -1, color = '#c6ff3d', alt = '#eeeae1', t = 0 } = {}) {
      g.clearRect(0, 0, W, H);
      const pr = 90 * DPR;
      const pathA = new Path2D(), pathB = new Path2D();
      for (let i = 0; i < P.length; i++) {
        const q = P[i];
        if (spread >= 0) {
          const a = i * 2.399 + t * 0.2, d = (0.25 + ((i * 7919) % 1000) / 1000) * Math.max(W, H) * 0.7;
          const sx = W / 2 + Math.cos(a) * d + Math.sin(t + i) * 20, sy = H / 2 + Math.sin(a) * d * 0.7;
          const e = spread * spread * (3 - 2 * spread);
          const tx = q.hx + (sx - q.hx) * e, ty = q.hy + (sy - q.hy) * e;
          q.vx += ((tx - q.x) * 40 - q.vx * 9) * dt; q.vy += ((ty - q.y) * 40 - q.vy * 9) * dt;
        } else if (q.free) {
          q.vx *= 1 - 1.4 * dt; q.vy = q.vy * (1 - 1.4 * dt) + 120 * dt;
          q.vx += Math.sin(q.y * 0.01 + t) * 60 * dt; q.vy += Math.cos(q.x * 0.01 + t) * 60 * dt;
        } else {
          q.vx += ((q.hx - q.x) * 26 - q.vx * 7.5) * dt; q.vy += ((q.hy - q.y) * 26 - q.vy * 7.5) * dt;
        }
        const dx = q.x - px, dy = q.y - py, d2 = dx * dx + dy * dy;
        if (d2 < pr * pr) { const d = Math.sqrt(d2) || 1, f = (1 - d / pr) * 5000 * DPR; q.vx += (dx / d) * f * dt; q.vy += (dy / d) * f * dt; }
        q.x += q.vx * dt; q.y += q.vy * dt;
        const sp = Math.abs(q.vx) + Math.abs(q.vy);
        const s = q.r * 2;
        (sp > 160 ? pathB : pathA).rect(q.x - q.r, q.y - q.r, s, s);
      }
      g.fillStyle = color; g.fill(pathA);
      g.fillStyle = alt; g.fill(pathB);
    }
  };
  return api;
}

export function mount(stage, o) {
  stage.innerHTML = `<canvas class="fill" aria-label="${o.text}" role="img"></canvas><p class="pt__cap mono">pixels échantillonnés → particules</p>`;
  const cv = stage.querySelector('canvas');
  const sw = createSwarm(cv, { small: o.small });
  const st = sw.setTarget(o.text.toUpperCase());
  stage.querySelector('.pt__cap').textContent = `${sw.count} particules · pas de ${st}px · ressort + bruit`;
  let clock = 0, phase = 0;
  const step = (t, dt) => {
    clock += dt * o.speed;
    const cyc = clock % 5;
    if (cyc < 2.4 && phase !== 0) { phase = 0; sw.gather(); }
    else if (cyc >= 2.4 && phase === 0) { phase = 1; sw.explode(1); }
    const p = virtualPointer(t, stage.getBoundingClientRect());
    sw.step(dt, { px: p.x * DPR, py: p.y * DPR, color: o.color, t });
  };
  if (o.reduced) { for (let i = 0; i < 200; i++) sw.step(0.016, { color: o.color }); return {}; }
  const lp = loop(stage, step);
  return { replay: () => { clock = 2.39; phase = 0; }, destroy: () => lp.stop() };
}
