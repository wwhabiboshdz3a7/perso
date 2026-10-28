import { injectCSS, loop, virtualPointer, lerp } from '../core.js';

injectCSS('tunnel', `
.tun { position: absolute; inset: 0; perspective: 600px; overflow: hidden; background: radial-gradient(circle at 50% 50%, #000 0, #000 12%, transparent 60%); }
.tun__rig { position: absolute; left: 50%; top: 50%; transform-style: preserve-3d; }
.tun__ring { position: absolute; left: 0; top: 0; transform-style: preserve-3d; }
.tun__ring span { position: absolute; left: 0; top: 0; text-align: center; font-family: var(--f-display); font-weight: 900; line-height: 1;
  text-transform: uppercase; font-variation-settings: "wdth" 130; }
.tun__ring.a span { color: var(--fx); }
.tun__ring.b span { color: transparent; -webkit-text-stroke: 1.2px var(--paper); }
.tun__core { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-family: var(--f-serif); font-style: italic; font-weight: 300;
  font-size: clamp(22px, 3vw, 44px); color: var(--paper); white-space: nowrap; z-index: 2; mix-blend-mode: difference; }
`);

export function mount(stage, o) {
  const W = stage.clientWidth, H = stage.clientHeight;
  const R = Math.max(W, H) * 0.36;
  const unit = o.text.toUpperCase() + ' — ';
  const per = Math.max(18, Math.min(40, [...unit].length * 2));
  const glyphs = [...unit.repeat(Math.ceil(per / [...unit].length))].slice(0, per);
  const n = glyphs.length;
  const cw = (2 * Math.PI * R) / n;
  const fs = cw * 1.25;
  const COUNT = 14, D = 260, DEPTH = COUNT * D;
  stage.innerHTML = `<div class="tun"><div class="tun__rig"></div></div><div class="tun__core">${o.text}</div>`;
  const tun = stage.querySelector('.tun'), rig = stage.querySelector('.tun__rig');
  const rings = [];
  for (let i = 0; i < COUNT; i++) {
    const ring = document.createElement('div');
    ring.className = 'tun__ring ' + (i % 2 ? 'b' : 'a');
    glyphs.forEach((c, j) => {
      const s = document.createElement('span');
      s.textContent = c;
      s.style.cssText = `width:${cw}px;margin-left:${-cw / 2}px;margin-top:${-fs / 2}px;font-size:${fs}px;transform:rotate(${(j / n) * 360}deg) translateY(${-R}px)`;
      ring.appendChild(s);
    });
    rig.appendChild(ring);
    rings.push({ el: ring, z: -i * D, spin: i % 2 ? 1 : -1 });
  }
  let ox = 50, oy = 50, travel = 0;
  const step = (t, dt) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    ox = lerp(ox, 50 + ((p.x / W) - 0.5) * -40, 0.05);
    oy = lerp(oy, 50 + ((p.y / H) - 0.5) * -40, 0.05);
    tun.style.perspectiveOrigin = `${ox}% ${oy}%`;
    travel = dt * 420 * o.speed;
    for (const r of rings) {
      r.z += travel;
      if (r.z > 500) r.z -= DEPTH;
      const depth = (r.z + DEPTH) / (DEPTH + 500);
      const op = Math.min(1, depth * 1.6) * (r.z > 200 ? Math.max(0, 1 - (r.z - 200) / 300) : 1);
      r.el.style.transform = `translateZ(${r.z}px) rotate(${t * 14 * r.spin + r.z * 0.04}deg)`;
      r.el.style.opacity = op.toFixed(3);
    }
  };
  step(0, 0);
  if (o.reduced) return {};
  const lp = loop(stage, step);
  return { destroy: () => lp.stop() };
}
