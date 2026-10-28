import { injectCSS, clamp } from '../core.js';

export const loopEvery = 6;

injectCSS('rideau', `
.rd { width: min(1400px, 90vw); position: relative; }
.rd__t { margin: 0; font-family: var(--f-tall); font-weight: 800; text-transform: uppercase; line-height: .98; letter-spacing: -.005em; color: var(--paper); }
.rd__t .ln { padding-bottom: .02em; border-bottom: 1px solid transparent; }
.rd__rule { position: absolute; left: 0; right: 0; height: 1px; background: rgba(238,234,225,.35); transform-origin: 0 50%; }
.rd__idx { position: absolute; right: 100%; margin-right: 1.2vw; font-family: var(--f-mono); font-variation-settings: "MONO" 1; font-size: 12px; color: var(--mute); }
@media (max-width: 760px) { .rd__idx { display: none; } }
`);

export function mount(stage, o) {
  stage.innerHTML = `<div class="rd"><h2 class="rd__t"></h2></div>`;
  const box = stage.querySelector('.rd'), h = stage.querySelector('.rd__t');
  const len = [...o.text].length;
  h.textContent = o.text;
  h.style.fontSize = clamp((Math.min(1400, innerWidth * 0.9) * 3.4) / (len * 0.5 + 6), 40, innerHeight * 0.24) + 'px';
  let split = null, tl = null, rules = [];
  const build = () => {
    tl && tl.kill();
    split && split.revert();
    rules.forEach((r) => r.remove()); rules = [];
    split = SplitText.create(h, { type: 'lines', linesClass: 'ln', mask: 'lines' });
    const br = box.getBoundingClientRect();
    split.lines.forEach((l, i) => {
      if (i % 2) l.style.color = 'var(--fx)';
      const r = l.getBoundingClientRect();
      const rule = document.createElement('div');
      rule.className = 'rd__rule';
      rule.style.top = (r.bottom - br.top) + 'px';
      rule.innerHTML = `<span class="rd__idx" style="top:-${r.height * 0.6}px">${String(i + 1).padStart(2, '0')}</span>`;
      box.appendChild(rule); rules.push(rule);
    });
    tl = gsap.timeline();
    tl.from(rules, { scaleX: 0, duration: 1.1, ease: 'expo.inOut', stagger: 0.08 })
      .from(split.lines, { yPercent: 115, rotate: 3, duration: 1.2, ease: 'expo.out', stagger: 0.12 }, 0.35)
      .from(rules.map((r) => r.firstChild), { opacity: 0, x: -10, duration: 0.5, stagger: 0.08 }, 0.5);
    if (o.thumb) tl.to(split.lines, { yPercent: -115, duration: 0.8, ease: 'expo.in', stagger: 0.07 }, '+=2').to(rules, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.7, ease: 'expo.in', stagger: 0.05 }, '<0.2');
    tl.timeScale(o.speed);
    if (o.reduced) tl.progress(o.thumb ? 0.5 : 1);
  };
  build();
  return { replay: build, speed: (s) => tl.timeScale(s), destroy: () => { tl && tl.kill(); split && split.revert(); } };
}
