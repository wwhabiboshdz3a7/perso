import { injectCSS, loop, virtualPointer } from '../core.js';

injectCSS('chemin', `
.ch svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ch text { font-family: var(--f-display); font-weight: 900; text-transform: uppercase; font-variation-settings: "wdth" 120; letter-spacing: -.01em; }
.ch .p0 { fill: var(--fx); }
.ch .p1 { fill: none; stroke: var(--paper); stroke-width: 1.2px; }
.ch .p2 { fill: var(--paper); font-family: var(--f-serif); font-style: italic; font-weight: 300; text-transform: none; }
.ch .guide { fill: none; stroke: rgba(238,234,225,.18); stroke-width: 1; stroke-dasharray: 2 8; }
`);

let uid = 0;
export function mount(stage, o) {
  const W = stage.clientWidth, H = stage.clientHeight, id = 'tp' + uid++;
  const defs = [
    { cls: 'p0', fs: Math.min(H * 0.16, W * 0.12), y: 0.5, A: 0.16, f: 1.4, sp: 1, dir: 1 },
    { cls: 'p1', fs: Math.min(H * 0.09, W * 0.07), y: 0.22, A: 0.08, f: 2.2, sp: 0.7, dir: -1 },
    { cls: 'p2', fs: Math.min(H * 0.08, W * 0.06), y: 0.8, A: 0.07, f: 1.8, sp: 1.3, dir: 1 }
  ];
  const unit = o.text + ' — ';
  stage.innerHTML = `<div class="ch"><svg viewBox="0 0 ${W} ${H}" aria-label="${o.text}" role="img"><defs>${defs.map((d, i) => `<path id="${id}${i}"/>`).join('')}</defs>
  ${defs.map((d, i) => `<use href="#${id}${i}" class="guide"/><text class="${d.cls}" font-size="${d.fs}"><textPath href="#${id}${i}"></textPath></text>`).join('')}</svg></div>`;
  const paths = defs.map((d, i) => stage.querySelector('#' + id + i));
  const tps = [...stage.querySelectorAll('textPath')];
  const off = defs.map(() => 0);
  const build = (d, t, px, py) => {
    let s = '';
    const n = 70, cy = H * d.y, A = H * d.A;
    for (let k = 0; k <= n; k++) {
      const x = -W * 0.15 + (k / n) * W * 1.3;
      const u = x / W;
      const bend = Math.exp(-((x - px) ** 2) / (2 * (W * 0.12) ** 2)) * (py - cy) * 0.35;
      const y = cy + A * Math.sin(u * Math.PI * d.f + t * d.sp) + A * 0.4 * Math.sin(u * 9 - t * 1.7) + bend;
      s += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return s;
  };
  defs.forEach((d, i) => paths[i].setAttribute('d', build(d, 0, -1e5, 0)));
  const unitLen = tps.map((tp, i) => {
    tp.textContent = unit;
    const l = tp.getComputedTextLength() || defs[i].fs * unit.length * 0.6;
    tp.textContent = unit.repeat(Math.ceil((W * 2.2) / l) + 2);
    return l;
  });
  const step = (t, dt) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    defs.forEach((d, i) => {
      paths[i].setAttribute('d', build(d, t * o.speed, p.x, p.y));
      off[i] = (off[i] - d.dir * 80 * d.sp * o.speed * dt) % unitLen[i];
      const v = d.dir > 0 ? off[i] : off[i] - unitLen[i];
      tps[i].setAttribute('startOffset', (((v % unitLen[i]) - unitLen[i]) % unitLen[i]).toFixed(1));
    });
  };
  step(0.5, 0);
  if (o.reduced) return {};
  const lp = loop(stage, step);
  return { destroy: () => lp.stop() };
}
