import { injectCSS, clamp } from '../core.js';

injectCSS('odometre', `
.od { text-align: center; }
.od__row { display: inline-flex; align-items: flex-start; font-family: var(--f-display); font-weight: 900; line-height: 1; letter-spacing: -.04em;
  font-variation-settings: "wdth" 60; color: var(--fx); font-variant-numeric: tabular-nums; }
.od__win { display: inline-block; height: 1em; overflow: hidden; position: relative; }
.od__strip { display: flex; flex-direction: column; will-change: transform; }
.od__strip span { display: block; height: 1em; text-align: center; }
.od__static { display: inline-block; }
.od__lab { margin-top: 2vh; display: flex; justify-content: center; gap: 3vw; color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; }
.od__lab b { color: var(--paper); font-weight: 400; }
`);

export function odometer(el, initial, { turns = 2 } = {}) {
  const cols = [];
  const set = (str, animate = true, opts = {}) => {
    const s = [...str];
    if (cols.length !== s.length || cols.some((c, i) => c.digit !== /\d/.test(s[i]))) {
      el.innerHTML = ''; cols.length = 0;
      s.forEach((ch) => {
        if (/\d/.test(ch)) {
          const w = document.createElement('span'); w.className = 'od__win';
          const strip = document.createElement('span'); strip.className = 'od__strip';
          strip.innerHTML = Array.from({ length: 10 * (turns + 1) }, (_, k) => `<span>${k % 10}</span>`).join('');
          w.appendChild(strip); el.appendChild(w);
          cols.push({ digit: true, strip, pos: +ch });
          gsap.set(strip, { yPercent: (-100 * +ch) / (10 * (turns + 1)) });
        } else {
          const st = document.createElement('span'); st.className = 'od__static'; st.textContent = ch;
          el.appendChild(st); cols.push({ digit: false });
        }
      });
      el.setAttribute('aria-label', str);
      if (!animate) return null;
    }
    const tl = gsap.timeline();
    const N = 10 * (turns + 1);
    s.forEach((ch, i) => {
      const c = cols[i];
      if (!c.digit) return;
      const target = +ch + 10 * (1 + ((s.length - i) % turns));
      const from = c.pos % 10;
      gsap.set(c.strip, { yPercent: (-100 * from) / N });
      tl.to(c.strip, { yPercent: (-100 * target) / N, duration: opts.duration || 1.8, ease: opts.ease || 'expo.inOut' }, (s.length - 1 - i) * (opts.stagger ?? 0.09));
      c.pos = target;
    });
    if (!animate) tl.progress(1);
    return tl;
  };
  set(initial, false);
  return { set };
}

export function mount(stage, o) {
  stage.innerHTML = `<div class="od"><div class="od__row"></div><div class="od__lab mono"><span>valeur <b class="v"></b></span><span>rouleaux <b class="n"></b></span><span>expo.inOut</span></div></div>`;
  const row = stage.querySelector('.od__row');
  const base = o.text.replace(/[^\d\s.,:%+\-/]/g, '') || '2026';
  const len = [...base].length;
  row.style.fontSize = clamp((innerWidth * 0.9) / (len * 0.52), 60, innerHeight * 0.55) + 'px';
  const od = odometer(row, base.replace(/\d/g, '0'));
  stage.querySelector('.n').textContent = (base.match(/\d/g) || []).length;
  const vals = [base];
  for (let k = 0; k < 3; k++) vals.push(base.replace(/\d/g, () => String((Math.random() * 10) | 0)));
  let i = 0, tl = null, timer = null, alive = true;
  const next = () => {
    if (!alive) return;
    const v = vals[i % vals.length]; i++;
    stage.querySelector('.v').textContent = v;
    tl = od.set(v, !o.reduced);
    if (tl) tl.timeScale(o.speed);
    if (!o.reduced) timer = setTimeout(next, (3200 / o.speed));
  };
  timer = setTimeout(next, 300);
  return { replay: () => { clearTimeout(timer); i = 0; next(); }, speed: (s) => tl && tl.timeScale(s), destroy: () => { alive = false; clearTimeout(timer); tl && tl.kill(); } };
}
