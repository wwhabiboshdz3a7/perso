import { injectCSS, loop, virtualPointer, resizeCanvas, FONTS, DPR } from '../core.js';

injectCSS('fibonacci', `
.fb__eq { position: absolute; left: var(--gutter); bottom: 110px; z-index: 2; color: var(--mute); font-size: 13px; line-height: 1.9; letter-spacing: .04em; }
.fb__eq b { color: var(--paper); font-weight: 400; }
@media (max-width: 760px) { .fb__eq { bottom: 96px; font-size: 11px; } }
`);

const GOLD = Math.PI * (3 - Math.sqrt(5));
const FIB = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610]);

export function spiralRenderer(cv, { count = 520 } = {}) {
  const g = cv.getContext('2d');
  return (t, { text, color, delta = 0, bloom = 1, spin = 0 }) => {
    resizeCanvas(cv);
    const W = cv.width, H = cv.height;
    const R = Math.hypot(W, H) * 0.5;
    const c = R / Math.sqrt(count);
    g.fillStyle = '#0a0a0b'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const glyphs = [...text.toUpperCase().replace(/\s+/g, '')];
    const ang = GOLD + delta;
    const visible = Math.floor(count * bloom);
    for (let i = 1; i < visible; i++) {
      const a = i * ang + spin, r = c * Math.sqrt(i);
      const x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r;
      const fib = FIB.has(i);
      const s = (fib ? 2.2 : 1) * (9 + Math.sqrt(i) * 1.7) * DPR * (cv.width / DPR > 700 ? 1 : 0.7);
      const edge = Math.min(1, (visible - i) / 40);
      g.setTransform(Math.cos(a + Math.PI / 2), Math.sin(a + Math.PI / 2), -Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2), x, y);
      g.font = `${fib ? 900 : 600} ${s}px ${FONTS.display}`;
      g.globalAlpha = edge * (fib ? 1 : 0.35 + 0.65 * (i / count));
      g.fillStyle = fib ? color : '#eeeae1';
      g.fillText(glyphs[i % glyphs.length], 0, 0);
    }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
  };
}

export function mount(stage, o) {
  stage.innerHTML = `<canvas class="fill" role="img" aria-label="${o.text}"></canvas><div class="fb__eq mono"><div><b>θ</b> = n × 137,508°</div><div><b>r</b> = c × √n</div><div>écart à l’angle d’or <b class="d">0,000°</b></div><div>en couleur : les rangs de Fibonacci</div></div>`;
  const cv = stage.querySelector('canvas'), dEl = stage.querySelector('.d');
  const draw = spiralRenderer(cv, { count: o.small ? 360 : 560 });
  let bloom = 0, spin = 0, f = 0;
  const step = (t, dt) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    bloom = Math.min(1, bloom + dt * 0.35 * o.speed);
    spin += dt * 0.12 * o.speed;
    const delta = ((p.x / stage.clientWidth) - 0.5) * 0.02 * (p.real ? 1 : Math.sin(t * 0.3));
    if (f++ % 6 === 0) dEl.textContent = ((delta * 180) / Math.PI).toFixed(3).replace('.', ',') + '°';
    draw(t, { text: o.text, color: o.color, delta, bloom: 0.02 + bloom * 0.98 * (1 - Math.pow(1 - bloom, 3)), spin });
  };
  if (o.reduced) { bloom = 1; draw(0, { text: o.text, color: o.color, bloom: 1 }); return {}; }
  const lp = loop(stage, step);
  return { replay: () => { bloom = 0; }, destroy: () => lp.stop() };
}
