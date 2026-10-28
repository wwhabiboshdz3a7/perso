import { injectCSS, loop, virtualPointer, fitText } from '../core.js';

injectCSS('variable', `
.vf { width: 100%; text-align: center; }
.vf__row { margin: 0; font-family: var(--f-flex); line-height: .86; text-transform: uppercase; white-space: nowrap; color: var(--paper); }
.vf__row:nth-child(2n) { color: var(--fx); }
.vf__row:nth-child(3n) { color: transparent; -webkit-text-stroke: 1.5px var(--paper); }
.vf__row .c { display: inline-block; }
.vf__axes { position: absolute; left: var(--gutter); bottom: 110px; font-size: 12px; color: var(--mute); line-height: 1.8; letter-spacing: .08em; }
.vf__axes b { display: inline-block; width: 4.5em; color: var(--paper); font-weight: 400; }
@media (max-width: 760px) { .vf__axes { bottom: 90px; } }
`);

export function mount(stage, o) {
  const W = stage.clientWidth, H = stage.clientHeight;
  const rows = H > W ? 6 : 4;
  stage.innerHTML = `<div class="vf">${Array.from({ length: rows }, () => '<h2 class="vf__row"></h2>').join('')}</div><div class="vf__axes mono"></div>`;
  const rowEls = [...stage.querySelectorAll('.vf__row')];
  const axes = stage.querySelector('.vf__axes');
  const grid = rowEls.map((r) => {
    r.textContent = o.text;
    r.style.fontVariationSettings = '"wght" 1000, "wdth" 151';
    return r;
  });
  const size = Math.min(fitText(grid[0], { width: W * 0.96 }), (H * 0.92) / (rows * 0.86));
  const cells = grid.map((r, ri) => {
    r.style.fontSize = size + 'px';
    r.style.fontVariationSettings = '';
    const split = SplitText.create(r, { type: 'chars', charsClass: 'c' });
    return split.chars.map((el, i) => ({ el, i, ri }));
  }).flat();

  let cache = [];
  const measure = () => { cache = cells.map((c) => { const b = c.el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }); };
  measure();
  let frame = 0, ph = 0, last = 0;
  const step = (t) => {
    ph += Math.max(0, Math.min(0.05, t - last)) * o.speed; last = t;
    const p = virtualPointer(t, null);
    if (frame++ % 10 === 0) measure();
    const T = (ph || t) * 1.6;
    let sample = null;
    cells.forEach((c, k) => {
      const [cx, cy] = cache[k];
      const d = Math.hypot(cx - p.x, cy - p.y);
      const near = Math.max(0, 1 - d / (size * 2.2));
      const w = 0.5 + 0.5 * Math.sin(T + c.i * 0.55 + c.ri * 0.9);
      const wd = 0.5 + 0.5 * Math.sin(T * 0.8 - c.i * 0.4 + c.ri * 1.3);
      const wght = 100 + 900 * Math.max(w, near);
      const wdth = 25 + 126 * (wd * (1 - near * 0.6));
      const slnt = -10 * (0.5 + 0.5 * Math.sin(T * 0.6 + c.i * 0.3));
      c.el.style.fontVariationSettings = `"wght" ${wght.toFixed(0)}, "wdth" ${wdth.toFixed(0)}, "slnt" ${slnt.toFixed(1)}, "GRAD" ${(near * 150).toFixed(0)}`;
      if (k === 0) sample = [wght, wdth, slnt];
    });
    if (sample && frame % 4 === 0) axes.innerHTML = `<div><b>wght</b>${sample[0].toFixed(0)}</div><div><b>wdth</b>${sample[1].toFixed(0)}</div><div><b>slnt</b>${sample[2].toFixed(1)}</div><div><b>font</b>Roboto Flex</div>`;
  };
  step(0.8);
  if (o.reduced) return {};
  const lp = loop(stage, step);
  return { destroy: () => lp.stop() };
}
