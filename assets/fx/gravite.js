import { injectCSS, loop, getGyro, clamp, esc } from '../core.js';

export const loopEvery = 8;

injectCSS('gravite', `
.gv { position: absolute; inset: 0; overflow: hidden; }
.gv__w { position: absolute; left: 0; top: 0; padding: .06em .32em .1em; border-radius: 99px; font-family: var(--f-display); font-weight: 900; text-transform: uppercase;
  line-height: 1; letter-spacing: -.02em; font-variation-settings: "wdth" 115; white-space: nowrap; cursor: grab; will-change: transform; touch-action: none; }
.gv__w.gv-s0 { background: var(--ink); color: var(--paper); }
.gv__w.gv-s1 { background: var(--fx); color: var(--ink); }
.gv__w.gv-s2 { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
.gv__w.gv-s3 { background: var(--hot); color: var(--ink); }
.gv__w.gv-s4 { background: transparent; color: var(--ink); font-family: var(--f-serif); font-style: italic; font-weight: 300; text-transform: none; }
.gv__w.grab { cursor: grabbing; }
.gv__hint { position: absolute; left: var(--gutter); top: 84px; color: #55524b; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; }
`);

// Moteur de boîtes : gravité, rebonds, empilement, saisie au pointeur.
export function createPile(root, words, { fs, styles = 5, floorPad = 0, onSettle } = {}) {
  const els = words.map((w, i) => {
    const el = document.createElement('div');
    el.className = 'gv__w gv-s' + (i % styles);
    el.textContent = w;
    el.style.fontSize = fs + 'px';
    root.appendChild(el);
    return el;
  });
  let W = root.clientWidth, H = root.clientHeight;
  const bodies = els.map((el) => ({ el, w: el.offsetWidth, h: el.offsetHeight, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, t0: 0, live: false }));
  const reset = () => {
    W = root.clientWidth; H = root.clientHeight;
    bodies.forEach((b, i) => {
      b.x = clamp(((i * 0.618) % 1) * (W - b.w), 0, Math.max(0, W - b.w)); b.y = -b.h - 40 - i * 30; b.vx = (Math.random() - 0.5) * 200; b.vy = 0;
      b.a = (Math.random() - 0.5) * 30; b.va = 0; b.t0 = i * 0.14; b.live = false;
      b.el.style.transform = `translate3d(${b.x}px,${b.y}px,0)`;
    });
  };
  reset();
  let grab = null, gx = 0, gy = 0, lastX = 0, lastY = 0, clock = 0;
  const down = (e) => {
    const b = bodies.find((q) => q.el === e.target.closest('.gv__w'));
    if (!b) return;
    grab = b; b.el.classList.add('grab');
    const r = root.getBoundingClientRect();
    gx = e.clientX - r.left - b.x; gy = e.clientY - r.top - b.y; lastX = e.clientX; lastY = e.clientY;
  };
  const move = (e) => {
    if (!grab) return;
    const r = root.getBoundingClientRect();
    grab.vx = (e.clientX - lastX) * 60; grab.vy = (e.clientY - lastY) * 60;
    lastX = e.clientX; lastY = e.clientY;
    grab.x = e.clientX - r.left - gx; grab.y = e.clientY - r.top - gy;
  };
  const up = () => { if (grab) grab.el.classList.remove('grab'); grab = null; };
  root.addEventListener('pointerdown', down);
  addEventListener('pointermove', move); addEventListener('pointerup', up);
  return {
    reset() { clock = 0; reset(); },
    step(dt, { speed = 1, gravity = null } = {}) {
      clock += dt;
      const gyr = getGyro();
      const G = 2600 * speed;
      const gxv = gravity ? gravity[0] : gyr ? gyr.gx * G * 0.6 : 0;
      const gyv = gravity ? gravity[1] : G;
      const sub = 3, h = dt / sub;
      const floor = H - floorPad;
      for (let s = 0; s < sub; s++) {
        for (const b of bodies) {
          if (!b.live) { if (clock >= b.t0) b.live = true; else continue; }
          if (b === grab) continue;
          b.vy += gyv * h; b.vx += gxv * h;
          b.x += b.vx * h; b.y += b.vy * h;
          if (b.y + b.h > floor) { b.y = floor - b.h; b.vy *= -0.32; b.vx *= 0.9; b.va += b.vx * 0.002; if (Math.abs(b.vy) < 30) b.vy = 0; }
          if (b.x < 0) { b.x = 0; b.vx *= -0.5; }
          if (b.x + b.w > W) { b.x = W - b.w; b.vx *= -0.5; }
        }
        for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
          const A = bodies[i], B = bodies[j];
          if (!A.live || !B.live) continue;
          const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
          const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
          if (ox <= 0 || oy <= 0) continue;
          const ia = A === grab ? 0 : 1, ib = B === grab ? 0 : 1, sum = ia + ib || 1;
          if (oy < ox) {
            const dir = A.y < B.y ? -1 : 1;
            A.y += dir * oy * (ia / sum); B.y -= dir * oy * (ib / sum);
            const rv = B.vy - A.vy;
            const imp = rv * 0.6;
            if (ia) A.vy += imp * (ib ? 0.5 : 1); if (ib) B.vy -= imp * (ia ? 0.5 : 1);
            const fr = (B.vx - A.vx) * 0.08;
            if (ia) A.vx += fr; if (ib) B.vx -= fr;
            const top = dir < 0 ? A : B, bot = dir < 0 ? B : A;
            const off = (top.x + top.w / 2) - (bot.x + bot.w / 2);
            top.va += off * 0.0006;
          } else {
            const dir = A.x < B.x ? -1 : 1;
            A.x += dir * ox * (ia / sum); B.x -= dir * ox * (ib / sum);
            const rv = B.vx - A.vx; const imp = rv * 0.6;
            if (ia) A.vx += imp * 0.5; if (ib) B.vx -= imp * 0.5;
          }
        }
      }
      for (const b of bodies) {
        b.va += -b.a * 8 * dt; b.va *= Math.pow(0.04, dt); b.a += b.va * 60 * dt;
        if (b.y + b.h >= floor - 1 && b !== grab) b.a *= Math.pow(0.02, dt);
        b.el.style.transform = `translate3d(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px,0) rotate(${clamp(b.a, -12, 12).toFixed(2)}deg)`;
      }
    },
    settleStatic() {
      W = root.clientWidth; H = root.clientHeight;
      let x = 0, y = H - floorPad;
      const rows = []; let row = [];
      bodies.forEach((b) => { if (x + b.w > W && row.length) { rows.push(row); row = []; x = 0; } row.push(b); x += b.w + 6; });
      if (row.length) rows.push(row);
      rows.forEach((r) => { const rh = Math.max(...r.map((b) => b.h)); y -= rh; let xx = 0; r.forEach((b) => { b.x = xx; b.y = y + rh - b.h; xx += b.w + 6; b.el.style.transform = `translate3d(${b.x}px,${b.y}px,0)`; }); });
    },
    destroy() { root.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up); }
  };
}

export function mount(stage, o) {
  stage.innerHTML = `<div class="gv" role="img" aria-label="${esc(o.text)}"></div><p class="gv__hint mono">${o.touch ? 'Inclinez · attrapez un mot' : 'Attrapez un mot, lancez-le'}</p>`;
  const root = stage.querySelector('.gv');
  let words = o.text.split(/\s+/).filter(Boolean);
  if (words.length < 8) words = words.concat(['gravité', 'rebond', 'chute', 'poids', 'masse', 'pile', 'élan', 'sol']).slice(0, Math.max(10, words.length));
  const fs = clamp(Math.min(innerWidth, 1600) * 0.058, 28, 110);
  const pile = createPile(root, words, { fs, floorPad: o.thumb ? 0 : 96 });
  if (o.reduced) { pile.settleStatic(); return { destroy: pile.destroy }; }
  const lp = loop(stage, (t, dt) => pile.step(dt, { speed: o.speed }));
  return { replay: () => pile.reset(), destroy: () => { lp.stop(); pile.destroy(); } };
}
