(() => {
  const M = window.MOTION;
  const INK = '#1b1a19', BRASS = '#a8763e', PAPER = '#f6f1e8', PAPER2 = '#ece5d8';

  /* ---------- Formes sources (courbes fermées échantillonnées) ---------- */
  const SHAPES = {
    // Monogramme « H » tracé en une boucle : montant gauche, barre, montant droit, retour par une volute.
    monogram: (t) => {
      const T = t * 2 * Math.PI; const k = 3; // trois lobes de base + modulation
      const r = 1 + .32 * Math.cos(k * T) + .12 * Math.cos(2 * k * T + 1.2);
      const x = r * Math.cos(T) * .9 + .25 * Math.cos(5 * T), y = r * Math.sin(T) * .9 + .18 * Math.sin(4 * T + .5);
      return [x, y];
    },
    heart: (t) => { const T = t * 2 * Math.PI; return [16 * Math.pow(Math.sin(T), 3) / 17, -(13 * Math.cos(T) - 5 * Math.cos(2 * T) - 2 * Math.cos(3 * T) - Math.cos(4 * T)) / 17]; },
    star: (t) => { const T = t * 2 * Math.PI; const r = .62 + .38 * Math.cos(5 * T); return [r * Math.cos(T), r * Math.sin(T)]; },
    square: (t) => { const T = t * 2 * Math.PI; const c = Math.cos(T), s = Math.sin(T); const m = Math.max(Math.abs(c), Math.abs(s)); return [c / m * .85, s / m * .85]; },
    lemniscate: (t) => { const T = t * 2 * Math.PI; const d = 1 + Math.sin(T) ** 2; return [Math.cos(T) / d * 1.1, Math.sin(T) * Math.cos(T) / d * 1.1]; },
  };

  /* ---------- Transformée de Fourier discrète d'une courbe complexe ---------- */
  function dft(points) {
    const N = points.length; const out = [];
    for (let k = 0; k < N; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < N; n++) { const phi = (2 * Math.PI * k * n) / N; re += points[n][0] * Math.cos(phi) + points[n][1] * Math.sin(phi); im += -points[n][0] * Math.sin(phi) + points[n][1] * Math.cos(phi); }
      re /= N; im /= N;
      const freq = k <= N / 2 ? k : k - N; // fréquences signées
      out.push({ re, im, freq, amp: Math.hypot(re, im), phase: Math.atan2(im, re) });
    }
    return out.sort((a, b) => b.amp - a.amp);
  }
  const sample = (shape, N = 180) => Array.from({ length: N }, (_, i) => SHAPES[shape](i / N));
  const cache = {};
  const coeffs = (shape) => cache[shape] || (cache[shape] = dft(sample(shape)));

  /* ---------- Dessin des épicycles à l'instant t (0..2π) ---------- */
  function drawEpicycles(ctx, cs, t, cx, cy, scale, terms, opts = {}) {
    let x = cx, y = cy;
    ctx.lineWidth = opts.lw || 1;
    for (let i = 0; i < Math.min(terms, cs.length); i++) {
      const c = cs[i]; const px = x, py = y; const r = c.amp * scale;
      x += r * Math.cos(c.freq * t + c.phase); y += r * Math.sin(c.freq * t + c.phase);
      if (r > 1.5 && opts.circles !== false) {
        ctx.strokeStyle = opts.circle || 'rgba(27,26,25,.18)'; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = opts.arm || 'rgba(168,118,62,.7)'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      }
    }
    return [x, y];
  }

  /* ---------- Scène animée réutilisable ---------- */
  function scene(canvas, shape, opts) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return null;
    const o = Object.assign({ terms: 60, speed: 1, bg: PAPER, dpr: M.dpr, onProgress: null, pause: 1.2 }, opts);
    let w = 0, h = 0; let cs = coeffs(shape); let trace = []; let t = 0; let hold = 0;
    M.fit(canvas, (cw, ch) => { w = cw; h = ch; trace = []; }, o.dpr);
    const draw = (dt) => {
      if (!w) return;
      if (hold > 0) { hold -= dt; if (hold <= 0) { trace = []; t = 0; } }
      else { t += dt * 0.5 * o.speed; if (t >= Math.PI * 2) { t = Math.PI * 2; hold = o.pause; } }
      ctx.fillStyle = o.bg; ctx.fillRect(0, 0, w, h);
      const scale = Math.min(w, h) * 0.3, cx = w / 2, cy = h / 2;
      const tip = drawEpicycles(ctx, cs, t, cx, cy, scale, o.terms, { lw: o.dpr * 0.8 });
      if (hold <= 0) trace.push(tip);
      if (trace.length > 1) {
        ctx.strokeStyle = INK; ctx.lineWidth = o.dpr * 1.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(trace[0][0], trace[0][1]); for (let i = 1; i < trace.length; i++) ctx.lineTo(trace[i][0], trace[i][1]); ctx.stroke();
      }
      ctx.fillStyle = BRASS; ctx.beginPath(); ctx.arc(tip[0], tip[1], o.dpr * 3.5, 0, Math.PI * 2); ctx.fill();
      if (o.onProgress) o.onProgress(t / (Math.PI * 2));
    };
    /* Rendu statique complet (reduced motion, vignettes). */
    const still = (terms) => {
      if (!w) return;
      ctx.fillStyle = o.bg; ctx.fillRect(0, 0, w, h);
      const scale = Math.min(w, h) * 0.3, cx = w / 2, cy = h / 2; const n = 400;
      ctx.strokeStyle = INK; ctx.lineWidth = o.dpr * 1.8; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const p = drawEpicycles(ctx, cs, (i / n) * Math.PI * 2, cx, cy, scale, terms || o.terms, { circles: false }); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
      drawEpicycles(ctx, cs, Math.PI * 0.7, cx, cy, scale, terms || o.terms, { lw: o.dpr * 0.8 });
    };
    return { draw, still, set(k, v) { o[k] = v; trace = []; t = 0; hold = 0; }, setShape(s) { cs = coeffs(s); trace = []; t = 0; } };
  }

  /* ---------- Hero : texte révélé par la trace ---------- */
  const traced = document.getElementById('traced');
  let words = [];
  if (traced) { const txt = traced.textContent.trim().split(/\s+/); traced.textContent = ''; txt.forEach(wd => { const s = document.createElement('span'); s.className = 'tw'; s.textContent = wd; traced.appendChild(s); traced.appendChild(document.createTextNode(' ')); words.push(s); }); }
  const wrap = document.getElementById('hero-canvas'); const heroCanvas = wrap.querySelector('canvas');
  const hero = scene(heroCanvas, 'monogram', { terms: M.mobile ? 40 : 70, onProgress: (p) => { const n = Math.floor(p * words.length + 0.001); words.forEach((s, i) => s.classList.toggle('is-on', i < n)); } });
  if (!hero) M.fallback(wrap.closest('.hero'));
  else if (M.reduced) { hero.still(); words.forEach(s => s.classList.add('is-on')); }
  else M.loop(heroCanvas, (t, dt) => hero.draw(dt));

  /* ---------- Panneau ---------- */
  const fc = document.getElementById('formula-canvas'); const panel = document.getElementById('params');
  if (fc && panel) {
    const sc = scene(fc, 'monogram', { terms: 12, speed: 1.4, bg: PAPER2, dpr: 1 });
    if (sc) { if (M.reduced) M.lazyTile(fc, () => sc.still()); else M.loop(fc, (t, dt) => sc.draw(dt)); }
    M.params(panel, [
      { key: 'terms', label: 'Nombre de cercles', min: 1, max: 90, step: 1, value: 12 },
      { key: 'speed', label: 'Vitesse de rotation', min: 0.2, max: 4, step: 0.1, value: 1.4 },
    ], (s, key) => { if (!sc) return; sc.set(key, s[key]); if (M.reduced) sc.still(); });
    const actions = document.createElement('div'); actions.className = 'params__actions';
    [['Monogramme', 'monogram'], ['Cœur', 'heart'], ['Étoile', 'star'], ['Carré', 'square']].forEach(([n, k], i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (i ? '' : ' is-active'); b.textContent = n;
      b.addEventListener('click', () => { actions.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active')); b.classList.add('is-active'); sc && sc.setShape(k); if (M.reduced) sc.still(); });
      actions.appendChild(b);
    });
    panel.appendChild(actions);
  }

  /* ---------- Vignettes statiques ---------- */
  document.querySelectorAll('[data-shape]').forEach(tile => {
    const [shape, terms] = tile.dataset.shape.split(','); const cv = tile.querySelector('canvas');
    M.lazyTile(tile, () => { const sc = scene(cv, shape, { terms: +terms, bg: PAPER2, dpr: 1 }); sc && sc.still(+terms); });
  });
})();
