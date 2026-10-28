import { injectCSS, clamp } from '../core.js';

injectCSS('zoom', `
.zm { position: absolute; inset: 0; overflow: hidden; }
.zm__layer { position: absolute; inset: 0; display: grid; place-items: center; will-change: transform; }
.zm__in { will-change: transform; }
.zm__w { margin: 0; white-space: nowrap; font-family: var(--f-display); font-weight: 560; text-transform: uppercase; line-height: 1;
  letter-spacing: -.02em; font-variation-settings: "wdth" 150; }
.zm__o { display: inline-block; width: .74em; height: .74em; vertical-align: -.005em; margin: 0 .03em; }
.zm__o circle { fill: none; stroke: currentColor; }
.zm__cap { position: absolute; left: 50%; bottom: 14vh; transform: translateX(-50%); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; z-index: 5; color: var(--mute); mix-blend-mode: difference; }
`);

const SW = 0.13; // épaisseur du O en fraction de sa taille

export function mount(stage, o) {
  const W = stage.clientWidth, H = stage.clientHeight;
  stage.innerHTML = `<div class="zm"></div><p class="zm__cap mono">échelle exponentielle · clip-path: circle()</p>`;
  const root = stage.querySelector('.zm');
  const fx = o.color;
  const themes = [
    { bg: '#0a0a0b', fg: '#eeeae1', ring: fx },
    { bg: fx, fg: '#0a0a0b', ring: '#0a0a0b' },
    { bg: '#eeeae1', fg: '#0a0a0b', ring: '#ff4d24' },
    { bg: '#ff4d24', fg: '#0a0a0b', ring: '#eeeae1' }
  ];
  const words = [o.text, 'Horizon', 'Écho', 'Boucle', 'Monde'];
  let idx = 0;

  const layer = (k) => {
    const word = words[k % words.length];
    const th = themes[k % themes.length];
    const el = document.createElement('div');
    el.className = 'zm__layer';
    el.style.background = th.bg; el.style.color = th.fg;
    const chars = [...word];
    let at = chars.findIndex((c) => /[oOôÔòÒ0]/.test(c));
    let insert = false;
    if (at < 0) { at = Math.floor(chars.length / 2); insert = true; }
    const ring = `<svg class="zm__o" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${50 - SW * 50}" stroke-width="${SW * 100}" style="color:${th.ring}"/></svg>`;
    const before = chars.slice(0, at).join(''), after = chars.slice(insert ? at : at + 1).join('');
    el.innerHTML = `<div class="zm__in"><h2 class="zm__w" aria-label="${word}">${before}${ring}${after}</h2></div>`;
    const h = el.querySelector('.zm__w');
    root.appendChild(el);
    h.style.fontSize = '100px';
    const nat = h.getBoundingClientRect().width || 1;
    const fs = clamp((W * 0.86 * 100) / nat, 24, H * 0.5);
    h.style.fontSize = fs + 'px';
    return { el, inner: el.querySelector('.zm__in'), h, svg: el.querySelector('.zm__o') };
  };

  let cur = layer(idx), tween = null, alive = true;
  const cycle = () => {
    if (!alive) return;
    const nxt = layer(idx + 1);
    const r = cur.svg.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + r.height / 2;
    const rad = (r.width / 2) * (1 - SW * 2) * 0.98;
    const bw = nxt.h.getBoundingClientRect().width;
    const k0 = (rad * 1.5) / bw;
    const S = 1 / k0;
    const diag = Math.hypot(W, H);
    gsap.set(cur.el, { transformOrigin: `${cx}px ${cy}px` });
    const prox = { p: 0 };
    const apply = () => {
      const p = prox.p;
      const z = Math.pow(S, p);
      const e = p * p * (3 - 2 * p);
      const tx = (W / 2 - cx) * e, ty = (H / 2 - cy) * e;
      cur.el.style.transform = `translate(${tx}px,${ty}px) scale(${z})`;
      const ox = cx + tx, oy = cy + ty;
      const cr = Math.max(rad * z, rad * z + (diag - rad * z) * Math.pow(p, 6));
      nxt.el.style.clipPath = `circle(${cr.toFixed(1)}px at ${ox.toFixed(1)}px ${oy.toFixed(1)}px)`;
      nxt.inner.style.transform = `translate(${(ox - W / 2).toFixed(1)}px,${(oy - H / 2).toFixed(1)}px) scale(${(k0 * z).toFixed(4)})`;
    };
    apply();
    tween = gsap.to(prox, {
      p: 1, duration: 2.6, delay: 0.9, ease: 'power2.inOut', onUpdate: apply,
      onComplete: () => {
        cur.el.remove();
        nxt.el.style.clipPath = ''; nxt.inner.style.transform = '';
        cur = nxt; idx++;
        cycle();
      }
    });
    tween.timeScale(o.speed);
  };
  if (o.reduced) return {};
  cycle();
  return { speed: (s) => tween && tween.timeScale(s), destroy: () => { alive = false; tween && tween.kill(); } };
}
