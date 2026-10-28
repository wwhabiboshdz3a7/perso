import { injectCSS, loop, virtualPointer, resizeCanvas, FONTS, DPR, hexToRgb } from '../core.js';

injectCSS('lorenz', `
.lz__eq { position: absolute; left: var(--gutter); bottom: 110px; z-index: 2; color: var(--mute); font-size: 13px; line-height: 1.9; letter-spacing: .04em; }
.lz__eq b { color: var(--paper); font-weight: 400; }
@media (max-width: 760px) { .lz__eq { bottom: 96px; font-size: 11px; } }
`);

export function lorenzRenderer(cv, { trail = 640, every = 4 } = {}) {
  const g = cv.getContext('2d');
  const pts = [];
  let x = 0.1, y = 0, z = 0, cnt = 0;
  const S = 10, R = 28, B = 8 / 3;
  const adv = (n) => {
    for (let i = 0; i < n; i++) {
      const h = 0.006;
      const dx = S * (y - x), dy = x * (R - z) - y, dz = x * y - B * z;
      x += dx * h; y += dy * h; z += dz * h;
      pts.push([x, y, z - 25]); cnt++;
      if (pts.length > trail) pts.shift();
    }
  };
  adv(trail);
  return (t, { text, color, rotY = 0, rotX = 0, steps = 3, scale = 1, cx: ox = 0.5, cy: oy = 0.5 }) => {
    resizeCanvas(cv);
    adv(steps);
    const W = cv.width, H = cv.height, k = (Math.min(W, H) / 62) * scale;
    g.fillStyle = 'rgba(10,10,11,1)'; g.fillRect(0, 0, W, H);
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    const proj = pts.map(([a, b, c]) => {
      const x1 = a * cy + b * sy, z1 = -a * sy + b * cy;
      const y2 = c * cx - z1 * sx, z2 = c * sx + z1 * cx;
      const p = 90 / (90 - z2);
      return [W * ox + x1 * k * p, H * oy - y2 * k * p, z2, p];
    });
    g.lineWidth = DPR; g.strokeStyle = 'rgba(238,234,225,.14)';
    g.beginPath(); proj.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke();
    const glyphs = [...text.toUpperCase().replace(/\s+/g, '·')];
    const rgb = hexToRgb(color).join(',');
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = proj.length, list = [];
    for (let i = 0; i < n; i++) { const a = cnt - n + i; if (a % every === 0) list.push([proj[i], a / every, i / n]); }
    list.sort((a, b) => a[0][2] - b[0][2]);
    for (const [q, j, age] of list) {
      const s = (10 + age * 26) * DPR * q[3] * scale;
      g.font = `${age > 0.9 ? 900 : 700} ${s}px ${FONTS.display}`;
      g.fillStyle = age > 0.85 ? `rgba(${rgb},1)` : `rgba(238,234,225,${(0.15 + age * 0.85).toFixed(2)})`;
      g.fillText(glyphs[j % glyphs.length], q[0], q[1]);
    }
  };
}

export function mount(stage, o) {
  stage.innerHTML = `<canvas class="fill" role="img" aria-label="${o.text}"></canvas><div class="lz__eq mono"><div><b>dx/dt</b> = σ(y − x)</div><div><b>dy/dt</b> = x(ρ − z) − y</div><div><b>dz/dt</b> = xy − βz</div><div>σ = 10 · ρ = 28 · β = 8/3</div></div>`;
  const cv = stage.querySelector('canvas');
  const draw = lorenzRenderer(cv, { trail: o.small ? 420 : 640 });
  let ry = 0;
  const step = (t, dt) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    ry += dt * 0.25 * o.speed;
    draw(t, { text: o.text, color: o.color, rotY: ry + (p.x / stage.clientWidth - 0.5) * 1.5, rotX: (p.y / stage.clientHeight - 0.5) * 0.8, steps: Math.max(1, Math.round(3 * o.speed)) });
  };
  step(0, 0);
  if (o.reduced) return {};
  const lp = loop(stage, step);
  return { destroy: () => lp.stop() };
}
