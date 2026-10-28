import { injectCSS, loop, virtualPointer, resizeCanvas, FONTS, DPR } from '../core.js';

injectCSS('kaleido', `
.kd__label { position: absolute; z-index: 3; left: 50%; top: 50%; transform: translate(-50%, -50%); margin: 0; padding: .1em .35em; background: var(--ink);
  font-family: var(--f-serif); font-style: italic; font-weight: 300; font-size: clamp(28px, 5vw, 80px); color: var(--paper); white-space: nowrap; border-radius: 99px;
  font-variation-settings: "opsz" 144, "SOFT" 100; }
.kd__cap { position: absolute; left: 50%; bottom: 14vh; transform: translateX(-50%); color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; z-index: 3; }
`);

export function kaleidoRenderer(cv, opts = {}) {
  const g = cv.getContext('2d');
  const pat = document.createElement('canvas');
  const pg = pat.getContext('2d');
  return (t, { text, color, segs = 10, spin = 0, zoom = 1 }) => {
    resizeCanvas(cv, Math.min(DPR, 1.5));
    const W = cv.width, H = cv.height, R = Math.hypot(W, H) / 2;
    const pw = Math.ceil(R), ph = Math.ceil(R * 0.8);
    if (pat.width !== pw || pat.height !== ph) { pat.width = pw; pat.height = ph; }
    pg.fillStyle = '#0a0a0b'; pg.fillRect(0, 0, pw, ph);
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const fs = (ph / rows) * (r % 2 ? 0.9 : 1.25);
      pg.font = `${r % 2 ? 'italic 300' : '900'} ${fs}px ${r % 2 ? FONTS.serif : FONTS.display}`;
      pg.fillStyle = r % 3 === 0 ? color : r % 3 === 1 ? '#eeeae1' : '#ff4d24';
      const word = (r % 2 ? text.toLowerCase() : text.toUpperCase()) + '  ';
      const ww = pg.measureText(word).width || 1;
      const off = ((t * (60 + r * 25) * (r % 2 ? -1 : 1)) % ww + ww) % ww;
      for (let x = -off - ww; x < pw + ww; x += ww) pg.fillText(word, x, (r + 0.85) * (ph / rows));
    }
    g.fillStyle = '#0a0a0b'; g.fillRect(0, 0, W, H);
    const a = (Math.PI * 2) / segs;
    g.save();
    g.translate(W / 2, H / 2);
    g.rotate(spin);
    g.scale(zoom, zoom);
    for (let i = 0; i < segs; i++) {
      g.save();
      g.rotate(i * a);
      if (i % 2) g.scale(1, -1);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(R * 1.05, 0); g.arc(0, 0, R * 1.05, 0, a + 0.004); g.closePath(); g.clip();
      g.rotate(a / 2 + Math.sin(t * 0.3) * 0.2);
      g.drawImage(pat, -pw * 0.1, -ph / 2);
      g.restore();
    }
    g.restore();
  };
}

export function mount(stage, o) {
  stage.innerHTML = `<canvas class="fill" role="img" aria-label="${o.text}"></canvas><h2 class="kd__label">${o.text}</h2><p class="kd__cap mono">symétrie d’ordre <span>10</span> · miroir alterné</p>`;
  const cv = stage.querySelector('canvas'), segEl = stage.querySelector('.kd__cap span');
  const draw = kaleidoRenderer(cv);
  let segs = 10, spin = 0;
  const step = (t, dt) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    const s = 2 * Math.round(3 + (p.x / stage.clientWidth) * 6);
    if (s !== segs) { segs = s; segEl.textContent = s; }
    spin += dt * 0.15 * o.speed * (1 + (p.y / stage.clientHeight - 0.5));
    draw(t * o.speed, { text: o.text, color: o.color, segs, spin, zoom: 1 + Math.sin(t * 0.4) * 0.15 });
  };
  step(1, 0.016);
  if (o.reduced) return {};
  const lp = loop(stage, step);
  return { destroy: () => lp.stop() };
}
