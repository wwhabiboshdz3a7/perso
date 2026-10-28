import { injectCSS } from '../core.js';

export const loopEvery = 7;

injectCSS('contour', `
.ct svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ct text { font-family: var(--f-display); font-weight: 900; text-transform: uppercase; font-variation-settings: "wdth" 150; }
.ct .meas { visibility: hidden; }
.ct .ln { fill: transparent; stroke: var(--paper); stroke-width: 1.6; stroke-linejoin: round; }
.ct .echo { fill: none; stroke: var(--fx); stroke-width: 1; opacity: 0; }
.ct__cap { position: absolute; left: 50%; bottom: 14vh; transform: translateX(-50%); color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
`);

const NS = 'http://www.w3.org/2000/svg';

export function mount(stage, o) {
  const W = stage.clientWidth, H = stage.clientHeight;
  const txt = o.text.toUpperCase();
  stage.innerHTML = `<div class="ct"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.text}"><g class="echoes"></g><g class="main"></g><text class="meas"></text></svg></div><p class="ct__cap mono">stroke-dashoffset → fill · échos décalés</p>`;
  const svg = stage.querySelector('svg'), meas = svg.querySelector('.meas'), main = svg.querySelector('.main'), echoes = svg.querySelector('.echoes');
  let fs = 200;
  meas.setAttribute('font-size', fs); meas.textContent = txt;
  const w0 = meas.getComputedTextLength() || txt.length * fs * 0.8;
  fs = Math.min(fs * (W * 0.88) / w0, H * 0.42);
  meas.setAttribute('font-size', fs);
  const total = meas.getComputedTextLength() || txt.length * fs * 0.8;
  const x0 = (W - total) / 2, y0 = H / 2 + fs * 0.34;
  const chars = [...txt];
  const xs = chars.map((c, i) => { try { return meas.getStartPositionOfChar(i).x; } catch (e) { return (i * total) / chars.length; } });
  const dash = fs * 9;
  const make = (cls, dy) => chars.map((c, i) => {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('class', cls); t.setAttribute('font-size', fs);
    t.setAttribute('x', x0 + xs[i]); t.setAttribute('y', y0 + dy);
    t.textContent = c;
    return t;
  });
  const letters = make('ln', 0); letters.forEach((t) => main.appendChild(t));
  const echoSets = [1, 2, 3].map(() => { const g = document.createElementNS(NS, 'g'); make('echo', 0).forEach((t) => g.appendChild(t)); echoes.appendChild(g); return g; });
  const fx = getComputedStyle(stage).getPropertyValue('--fx').trim();
  let tl;
  const build = () => {
    tl && tl.kill();
    gsap.set(letters, { strokeDasharray: dash, strokeDashoffset: dash, fill: 'rgba(0,0,0,0)', stroke: '#eeeae1' });
    gsap.set(echoSets, { y: 0, opacity: 0 });
    tl = gsap.timeline();
    tl.to(letters, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', stagger: 0.12 })
      .to(letters, { fill: o.color, stroke: o.color, duration: 0.6, ease: 'power2.out', stagger: 0.06 }, '-=0.6')
      .to(echoSets, { opacity: (i) => 0.7 - i * 0.2, y: (i) => fs * 0.22 * (i + 1), duration: 1, ease: 'expo.out', stagger: 0.08 }, '-=0.3')
      .to(echoSets, { y: (i) => -fs * 0.22 * (i + 1), duration: 1.4, ease: 'expo.inOut', stagger: 0.06 }, '+=0.5');
    tl.timeScale(o.speed);
    if (o.reduced) tl.progress(1);
  };
  build();
  void fx;
  return { replay: build, color: build, speed: (s) => tl.timeScale(s), destroy: () => tl && tl.kill() };
}
