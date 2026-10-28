import { injectCSS, loop, virtualPointer, resizeCanvas, FONTS, DPR } from '../core.js';

injectCSS('ascii', `
.as__cap { position: absolute; left: 50%; bottom: 14vh; transform: translateX(-50%); color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; z-index: 2; background: var(--ink); padding: 0 .6em; }
`);

const RAMP = ' .,:;-=+*iclx%#&$@';

export function asciiRenderer(cv, { cell = 12 } = {}) {
  const g = cv.getContext('2d');
  const src = document.createElement('canvas');
  const sg = src.getContext('2d', { willReadFrequently: true });
  let cols = 0, rows = 0, data = null, lastText = '';
  const prep = (text) => {
    const W = cv.width / DPR, H = cv.height / DPR;
    cols = Math.max(20, Math.floor(W / cell)); rows = Math.max(10, Math.floor(H / (cell * 1.7)));
    src.width = cols; src.height = rows;
    sg.fillStyle = '#000'; sg.fillRect(0, 0, cols, rows);
    sg.fillStyle = '#fff'; sg.textAlign = 'center'; sg.textBaseline = 'middle';
    let fs = rows * 0.8;
    sg.font = `900 ${fs}px ${FONTS.display}`;
    sg.save();
    const w = sg.measureText(text).width;
    const sx = Math.min(1, (cols * 0.92) / (w * 1.7));
    sg.translate(cols / 2, rows / 2); sg.scale(sx * 1.7, sx); sg.fillText(text, 0, rows * 0.04);
    sg.restore();
    data = sg.getImageData(0, 0, cols, rows).data;
    lastText = text;
  };
  return (t, { text, color, px = -1e4, py = -1e4 }) => {
    const changed = resizeCanvas(cv);
    if (changed || text !== lastText) prep(text);
    const W = cv.width, H = cv.height;
    const cw = W / cols, ch = H / rows;
    g.fillStyle = '#0a0a0b'; g.fillRect(0, 0, W, H);
    g.font = `500 ${ch * 0.92}px ${FONTS.mono}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const pcx = (px * DPR) / cw, pcy = (py * DPR) / ch;
    const dim = [], hot = [], mid = [];
    for (let y = 0; y < rows; y++) {
      const shift = Math.round(Math.sin(y * 0.35 + t * 2.2) * 2 + Math.sin(y * 0.08 - t) * 1.5);
      for (let x = 0; x < cols; x++) {
        const sx = Math.min(cols - 1, Math.max(0, x + shift));
        let v = data[(y * cols + sx) * 4] / 255;
        const dx = x - pcx, dy = (y - pcy) * 1.7, d = Math.sqrt(dx * dx + dy * dy);
        const ring = Math.max(0, 1 - Math.abs(d - ((t * 18) % 40)) / 2.5) * Math.max(0, 1 - d / 40);
        const plasma = 0.18 * (0.5 + 0.5 * Math.sin(x * 0.12 + t * 1.3) * Math.cos(y * 0.21 - t * 0.9));
        const near = Math.max(0, 1 - d / 9);
        const b = Math.min(1, Math.max(v, plasma) + ring * 0.6 + near * 0.5);
        if (b < 0.06) continue;
        const c = RAMP[Math.min(RAMP.length - 1, Math.floor(b * (RAMP.length - 1)))];
        (v > 0.5 ? hot : (ring > 0.2 || near > 0.3) ? mid : dim).push(c, x, y);
      }
    }
    const flush = (arr, col) => { g.fillStyle = col; for (let i = 0; i < arr.length; i += 3) g.fillText(arr[i], (arr[i + 1] + 0.5) * cw, (arr[i + 2] + 0.5) * ch); };
    flush(dim, '#3a3a40'); flush(mid, '#eeeae1'); flush(hot, color);
  };
}

export function mount(stage, o) {
  stage.innerHTML = `<canvas class="fill" role="img" aria-label="${o.text}"></canvas><p class="as__cap mono">luminance → « ${RAMP.trim()} »</p>`;
  const cv = stage.querySelector('canvas');
  const draw = asciiRenderer(cv, { cell: o.small ? 9 : 12 });
  const step = (t) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    draw(t * o.speed, { text: o.text.toUpperCase(), color: o.color, px: p.x, py: p.y });
  };
  step(1);
  if (o.reduced) return {};
  const lp = loop(stage, step);
  return { destroy: () => lp.stop() };
}
