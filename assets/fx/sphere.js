import { injectCSS, loop, virtualPointer, lerp } from '../core.js';

injectCSS('sphere', `
.sph { position: absolute; inset: 0; }
.sph span { position: absolute; left: 50%; top: 50%; font-family: var(--f-display); font-weight: 800; line-height: 1; text-transform: uppercase;
  font-variation-settings: "wdth" 110; will-change: transform, opacity; }
.sph__core { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); margin: 0; font-family: var(--f-serif); font-style: italic;
  font-weight: 300; color: var(--paper); white-space: nowrap; font-variation-settings: "opsz" 144, "SOFT" 100; letter-spacing: -.02em; z-index: 80; text-shadow: 0 0 40px #0a0a0b, 0 0 12px #0a0a0b; }
`);

export function mount(stage, o) {
  const W = stage.clientWidth, H = stage.clientHeight;
  const R = Math.min(W, H) * 0.38;
  const N = o.small ? 110 : 180;
  const src = [...(o.text.toUpperCase().replace(/\s+/g, '') || 'O')];
  stage.innerHTML = `<div class="sph"></div><h2 class="sph__core">${o.text}</h2>`;
  const box = stage.querySelector('.sph');
  stage.querySelector('.sph__core').style.fontSize = Math.min(R * 0.5, (R * 1.5) / Math.max(3, [...o.text].length * 0.5)) + 'px';
  const fs = R * 0.11;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), th = i * golden;
    const s = document.createElement('span');
    s.textContent = src[i % src.length];
    s.style.fontSize = fs + 'px';
    s.style.marginLeft = s.style.marginTop = -fs / 2 + 'px';
    box.appendChild(s);
    pts.push({ s, x: Math.cos(th) * r, y, z: Math.sin(th) * r });
  }
  const fx = () => getComputedStyle(stage).getPropertyValue('--fx').trim();
  let col = fx();
  let ay = 0, ax = 0.3, tx = 0.3, vy = 0.35;
  const step = (t, dt) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    tx = ((p.y / H) - 0.5) * 1.6;
    vy = lerp(vy, 0.25 + ((p.x / W) - 0.5) * 2.2, 0.05);
    ay += dt * vy * o.speed; ax = lerp(ax, tx, 0.05);
    const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    const breathe = 1 + Math.sin(t * 1.4) * 0.04;
    for (const q of pts) {
      const x1 = q.x * cy + q.z * sy, z1 = -q.x * sy + q.z * cy;
      const y2 = q.y * cx - z1 * sx, z2 = q.y * sx + z1 * cx;
      const persp = 2.6 / (2.6 - z2);
      const X = x1 * R * persp * breathe, Y = y2 * R * persp * breathe;
      q.s.style.transform = `translate3d(${X.toFixed(1)}px,${Y.toFixed(1)}px,0) scale(${(persp * 0.9).toFixed(3)})`;
      q.s.style.opacity = (0.15 + 0.85 * ((z2 + 1) / 2) ** 1.5).toFixed(2);
      q.s.style.color = z2 > 0.1 ? col : '#eeeae1';
      q.s.style.zIndex = Math.round((z2 + 1) * 50);
    }
  };
  step(0.3, 0);
  if (o.reduced) return {};
  const lp = loop(stage, step);
  return { color: () => { col = fx(); }, destroy: () => lp.stop() };
}
