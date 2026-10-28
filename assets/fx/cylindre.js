import { injectCSS, loop, virtualPointer, lerp } from '../core.js';

injectCSS('cylindre', `
.cyl { position: absolute; inset: 0; perspective: 1900px; perspective-origin: 50% 50%; }
.cyl__rig { position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; }
.cyl__ring { position: absolute; left: 0; top: 0; transform-style: preserve-3d; }
.cyl__ring span { position: absolute; left: 0; top: 0; text-align: center; font-family: var(--f-display); font-weight: 900;
  font-variation-settings: "wdth" 100; line-height: 1; text-transform: uppercase; backface-visibility: visible; }
.cyl__ring.o span { color: transparent; -webkit-text-stroke: 1.5px var(--paper); }
.cyl__ring.f span { color: var(--fx); }
`);

export function mount(stage, o) {
  const W = stage.clientWidth, H = stage.clientHeight;
  const unit = (o.text.toUpperCase() + ' • ');
  const ul = [...unit].length;
  const Rt = Math.min(W * 0.3, 440);
  let k = Math.max(1, Math.round((2 * Math.PI * Rt) / (0.62 * Math.min(H * 0.12, W * 0.1) * ul)));
  const N = k * ul;
  let cw = (2 * Math.PI * Rt) / N;
  let fs = Math.min(cw / 0.62, H * 0.13);
  cw = fs * 0.62;
  const R = (N * cw) / (2 * Math.PI);
  const rows = [{ cls: 'o', dir: 1 }, { cls: 'f', dir: -1 }, { cls: '', dir: 1 }, { cls: 'o', dir: -1 }, { cls: 'f', dir: 1 }];
  const nRows = H > W * 0.9 ? 5 : 3;
  const used = rows.slice(0, nRows);
  stage.innerHTML = '<div class="cyl"><div class="cyl__rig"></div></div>';
  const rig = stage.querySelector('.cyl__rig');
  const rings = used.map((r, ri) => {
    const ring = document.createElement('div');
    ring.className = 'cyl__ring ' + r.cls;
    const y = (ri - (nRows - 1) / 2) * fs * 1.02;
    const glyphs = [...unit.repeat(k)];
    const spans = glyphs.map((c, i) => {
      const s = document.createElement('span');
      s.textContent = c;
      const a = (i / N) * 360;
      s.style.cssText = `width:${cw}px;margin-left:${-cw / 2}px;margin-top:${-fs / 2 + y}px;font-size:${fs}px;transform:rotateY(${a}deg) translateZ(${R}px)`;
      ring.appendChild(s);
      return { s, a: (a * Math.PI) / 180 };
    });
    rig.appendChild(ring);
    return { ring, spans, dir: r.dir, off: ri * 17 };
  });

  let rx = -8, ry = 0, rot = 0;
  const step = (t, dt) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    rx = lerp(rx, ((p.y / H) - 0.5) * -30 - 6, 0.06);
    ry = lerp(ry, ((p.x / W) - 0.5) * 30, 0.06);
    rot += dt * 18 * o.speed;
    rig.style.transform = `rotateX(${rx}deg) rotateZ(${ry * 0.15}deg)`;
    for (const r of rings) {
      const ang = (rot + (o.extRot || 0)) * r.dir + r.off + ry;
      r.ring.style.transform = `rotateY(${ang}deg)`;
      const rad = (ang * Math.PI) / 180;
      for (const g of r.spans) {
        const c = Math.cos(g.a + rad);
        g.s.style.opacity = (0.18 + 0.82 * Math.max(0, c)).toFixed(2);
      }
    }
  };
  if (o.reduced) { step(0.5, 0); return {}; }
  const lp = loop(stage, step);
  return { destroy: () => lp.stop() };
}
