import { injectCSS, loop, virtualPointer, resizeCanvas, FONTS, DPR } from '../core.js';

injectCSS('vague', `
.vg__cap { position: absolute; left: 50%; bottom: 14vh; transform: translateX(-50%); color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; z-index: 2; background: var(--ink); padding: 0 .6em; }
`);

export function waveRenderer(cv, { cell = 44 } = {}) {
  const g = cv.getContext('2d');
  return (t, { text, color, px = -1e4, py = -1e4, amp = 1 }) => {
    resizeCanvas(cv);
    const W = cv.width, H = cv.height, c = cell * DPR;
    const cols = Math.ceil(W / c) + 1, rows = Math.ceil(H / c) + 1;
    const glyphs = [...text.toUpperCase().replace(/\s+/g, '·')];
    g.fillStyle = '#0a0a0b'; g.fillRect(0, 0, W, H);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const cx = W / 2, cy = H / 2, ppx = px * DPR, ppy = py * DPR;
    const buckets = [[], [], []];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const X = x * c + (y % 2) * c * 0.5, Y = y * c;
      const d1 = Math.hypot(X - cx, Y - cy) / c, d2 = Math.hypot(X - ppx, Y - ppy) / c;
      const w = Math.sin(d1 * 0.55 - t * 2.6) * 0.6 + Math.sin(d2 * 0.7 - t * 3.4) * 0.4 * Math.exp(-d2 * 0.04) + Math.sin(x * 0.2 + y * 0.15 + t) * 0.2;
      const v = Math.max(0, Math.min(1, 0.5 + 0.5 * w * amp));
      const ch = glyphs[(x + y * 3) % glyphs.length];
      buckets[v > 0.72 ? 2 : v > 0.38 ? 1 : 0].push(ch, X, Y + Math.sin(d1 * 0.55 - t * 2.6) * c * 0.25, 0.25 + v * 1.1);
    }
    const draw = (arr, col, wght) => {
      g.fillStyle = col; g.font = `${wght} ${c}px ${FONTS.display}`;
      for (let i = 0; i < arr.length; i += 4) {
        const s = arr[i + 3];
        g.setTransform(s, 0, 0, s, arr[i + 1], arr[i + 2]);
        g.fillText(arr[i], 0, 0);
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
    };
    draw(buckets[0], '#232327', 300); draw(buckets[1], '#eeeae1', 600); draw(buckets[2], color, 900);
  };
}

export function mount(stage, o) {
  stage.innerHTML = `<canvas class="fill" role="img" aria-label="${o.text}"></canvas><p class="vg__cap mono">${o.text} · interférence de deux ondes</p>`;
  const cv = stage.querySelector('canvas');
  const draw = waveRenderer(cv, { cell: o.small ? 30 : 44 });
  const step = (t) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    draw(t * o.speed, { text: o.text, color: o.color, px: p.x, py: p.y });
  };
  step(1.2);
  if (o.reduced) return {};
  const lp = loop(stage, step);
  return { destroy: () => lp.stop() };
}
