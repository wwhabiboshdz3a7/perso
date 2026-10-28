import { injectCSS, loop, virtualPointer, bigSize } from '../core.js';

injectCSS('ressorts', `
.rs { margin: 0; padding: 0 4vw; text-align: center; font-family: var(--f-display); font-weight: 900; line-height: .9; text-transform: uppercase;
  letter-spacing: -.02em; color: var(--paper); font-variation-settings: "wdth" 100; }
.rs .c { display: inline-block; will-change: transform; }
.rs .c.hot { color: var(--fx); }
.rs__hint { position: absolute; left: 50%; bottom: 14vh; transform: translateX(-50%); color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
`);

export function mount(stage, o) {
  stage.innerHTML = `<h2 class="rs"></h2><p class="rs__hint mono">${o.touch ? 'Inclinez ou touchez' : 'Passez la souris'} · ${o.mode === 'aimanter' ? 'les lettres s’aimantent' : 'les lettres s’écartent'}</p>`;
  const h = stage.querySelector('.rs');
  h.textContent = o.text;
  h.style.fontSize = bigSize(o.text, stage.clientWidth, stage.clientHeight, { maxVw: 0.24 }) + 'px';
  const split = SplitText.create(h, { type: 'words,chars', charsClass: 'c' });
  let items = [];
  const measure = () => {
    const sr = stage.getBoundingClientRect();
    items = split.chars.map((el, i) => {
      const r = el.getBoundingClientRect();
      const prev = items[i];
      return { el, cx: r.left - sr.left + r.width / 2, cy: r.top - sr.top + r.height / 2, x: prev ? prev.x : 0, y: prev ? prev.y : 0, vx: 0, vy: 0, r: 0, vr: 0 };
    });
  };
  measure();
  const fs = parseFloat(h.style.fontSize);
  const step = (t, dt) => {
    const sr = stage.getBoundingClientRect();
    const p = virtualPointer(t, sr);
    const rad = fs * 1.6;
    const k = 120 * o.speed, damp = 9;
    const attract = o.mode === 'aimanter';
    for (const it of items) {
      const dx = it.cx + it.x - p.x, dy = it.cy + it.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      let fx = -k * it.x - damp * it.vx, fy = -k * it.y - damp * it.vy;
      let near = 0;
      if (d < rad) {
        near = 1 - d / rad;
        const f = near * near * 9000 * o.speed;
        if (attract) { fx -= (dx / d) * f * 0.55; fy -= (dy / d) * f * 0.55; }
        else { fx += (dx / d) * f; fy += (dy / d) * f; }
      }
      it.vx += fx * dt; it.vy += fy * dt;
      it.x += it.vx * dt; it.y += it.vy * dt;
      it.vr += (-80 * it.r - 8 * it.vr + it.vx * 0.9) * dt; it.r += it.vr * dt;
      const sc = 1 + near * (attract ? -0.25 : 0.35);
      it.el.style.transform = `translate3d(${it.x.toFixed(1)}px,${it.y.toFixed(1)}px,0) rotate(${it.r.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
      it.el.classList.toggle('hot', near > 0.25);
    }
  };
  if (o.reduced) return { destroy: () => split.revert() };
  const lp = loop(stage, step);
  return { destroy: () => { lp.stop(); split.revert(); } };
}
