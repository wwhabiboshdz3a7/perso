import { injectCSS, loop, virtualPointer, fitText, hexToRgb, resizeCanvas } from '../core.js';

injectCSS('masque', `
.mk { position: absolute; inset: 0; }
.mk canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.mk__cover { position: absolute; inset: 0; background: #000; mix-blend-mode: multiply; display: grid; place-items: center; }
.mk__t { margin: 0; padding: 0 3vw; text-align: center; color: #fff; font-family: var(--f-display); font-weight: 900; text-transform: uppercase;
  line-height: .82; letter-spacing: -.04em; font-variation-settings: "wdth" 150; will-change: transform; }
.mk__cap { position: absolute; left: 50%; bottom: 14vh; transform: translateX(-50%); color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
`);

// Blobs de couleur qui dérivent : la « vidéo » vue à travers les lettres.
export function blobField(cv, getColors, opts = {}) {
  const g = cv.getContext('2d');
  const blobs = Array.from({ length: opts.count || 7 }, (_, i) => ({ a: Math.random() * 6.28, b: Math.random() * 6.28, s: 0.3 + Math.random() * 0.5, r: 0.35 + Math.random() * 0.35, k: i }));
  return (t, px, py) => {
    resizeCanvas(cv, 0.5);
    const w = cv.width, h = cv.height;
    const cols = getColors();
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = cols.base; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    blobs.forEach((b, i) => {
      let x = w * (0.5 + 0.42 * Math.sin(t * b.s + b.a)), y = h * (0.5 + 0.42 * Math.cos(t * b.s * 0.8 + b.b));
      if (i === 0 && px != null) { x = px * 0.5; y = py * 0.5; }
      const R = Math.max(w, h) * b.r;
      const c = cols.list[i % cols.list.length];
      const gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, `rgba(${c},.95)`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    // fines rayures qui défilent, pour la matière
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(0,0,0,.12)';
    const off = (t * 40) % 8;
    for (let y = -8 + off; y < h; y += 8) g.fillRect(0, y, w, 2);
  };
}

export function mount(stage, o) {
  stage.innerHTML = `<div class="mk"><canvas></canvas><div class="mk__cover"><h2 class="mk__t"></h2></div></div><p class="mk__cap mono">texte = fenêtre · ${'mix-blend-mode: multiply'}</p>`;
  const cv = stage.querySelector('canvas'), t0 = stage.querySelector('.mk__t');
  t0.textContent = o.text;
  fitText(t0, { width: stage.clientWidth * 0.92, max: stage.clientHeight * 0.6 });
  t0.style.whiteSpace = [...o.text].length > 14 ? 'normal' : 'nowrap';
  if ([...o.text].length > 14) t0.style.fontSize = parseFloat(t0.style.fontSize) * 1.8 + 'px';
  const colors = () => ({ base: '#120a1c', list: [hexToRgb(o.color).join(','), '255,77,36', '123,97,255', '255,176,0', '238,234,225', hexToRgb(o.color).join(',')] });
  const draw = blobField(cv, colors);
  const step = (t) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    draw(t * o.speed, p.x, p.y);
    t0.style.transform = `scale(${1 + Math.sin(t * 0.8 * o.speed) * 0.04}) translateY(${Math.sin(t * 0.5) * 6}px)`;
  };
  step(1);
  if (o.reduced) return { color: () => step(1) };
  const lp = loop(stage, step);
  return { color: () => {}, destroy: () => lp.stop() };
}
