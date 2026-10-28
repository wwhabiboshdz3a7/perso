(() => {
  const M = window.MOTION;
  const PAPER = [243, 239, 231], RUST = [181, 65, 45], INK = [23, 20, 18];

  /* ---------- Les deux applications ---------- */
  const MAPS = {
    clifford: (x, y, a, b, c, d) => [Math.sin(a * y) + c * Math.cos(a * x), Math.sin(b * x) + d * Math.cos(b * y)],
    dejong: (x, y, a, b, c, d) => [Math.sin(a * y) - Math.cos(b * x), Math.sin(c * x) - Math.cos(d * y)],
  };
  const TEXT = {
    clifford: 'x′ = sin(a·y) + c·cos(a·x)\ny′ = sin(b·x) + d·cos(b·y)',
    dejong: 'x′ = sin(a·y) − cos(b·x)\ny′ = sin(c·x) − cos(d·y)',
  };

  /* Table de couleurs papier → rouille → encre (256 entrées). */
  const LUT = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255; const c = t < .55 ? M.lerpRgb(PAPER, RUST, t / .55) : M.lerpRgb(RUST, INK, (t - .55) / .45);
    LUT[i * 3] = c[0]; LUT[i * 3 + 1] = c[1]; LUT[i * 3 + 2] = c[2];
  }

  /* Accumule `iters` points dans counts (taille w×h). */
  function accumulate(counts, w, h, map, a, b, c, d, iters, zoom = 0.235) {
    let x = Math.random() * .2, y = Math.random() * .2;
    const sx = w * zoom, sy = h * zoom * (w / h), cx = w / 2, cy = h / 2;
    for (let i = 0; i < iters; i++) {
      const r = map(x, y, a, b, c, d); x = r[0]; y = r[1];
      const px = (cx + x * sx) | 0, py = (cy + y * sy) | 0;
      if (px >= 0 && px < w && py >= 0 && py < h) counts[py * w + px] += 1;
    }
  }

  /* Convertit les comptages en pixels via la table de couleurs. */
  function paint(ctx, img, counts, w, h, gain) {
    const d = img.data;
    for (let i = 0, n = w * h; i < n; i++) {
      const v = counts[i]; const t = v > 0 ? Math.min(255, (Math.log(1 + v * gain) * 64) | 0) : 0;
      const j = t * 3, k = i * 4; d[k] = LUT[j]; d[k + 1] = LUT[j + 1]; d[k + 2] = LUT[j + 2]; d[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  /* Rendu statique (panneau + vignettes). */
  function renderStatic(canvas, kind, a, b, c, d, iters = 400000) {
    const w = canvas.width, h = canvas.height; const counts = new Float32Array(w * h);
    accumulate(counts, w, h, MAPS[kind], a, b, c, d, iters, kind === 'dejong' ? 0.2 : 0.235);
    const ctx = canvas.getContext('2d'); paint(ctx, ctx.createImageData(w, h), counts, w, h, 1.2 * (300000 / iters));
  }

  /* ---------- Panneau de paramètres ---------- */
  const P = { kind: 'clifford', a: -1.4, b: 1.6, c: 1.0, d: 0.7 };
  const fc = document.getElementById('formula-canvas');
  const redraw = () => { if (!fc) return; const r = fc.getBoundingClientRect(); fc.width = Math.round(r.width) || 600; fc.height = Math.round(r.width * .75) || 450; renderStatic(fc, P.kind, P.a, P.b, P.c, P.d, 250000); };
  const panel = document.getElementById('params');
  if (panel) {
    const state = M.params(panel, [
      { key: 'a', label: 'a', min: -3, max: 3, step: 0.01, value: P.a },
      { key: 'b', label: 'b', min: -3, max: 3, step: 0.01, value: P.b },
      { key: 'c', label: 'c', min: -3, max: 3, step: 0.01, value: P.c },
      { key: 'd', label: 'd', min: -3, max: 3, step: 0.01, value: P.d },
    ], s => { Object.assign(P, { a: s.a, b: s.b, c: s.c, d: s.d }); redraw(); });
    const actions = document.createElement('div'); actions.className = 'params__actions';
    const presets = [['Clifford', 'clifford', -1.4, 1.6, 1.0, 0.7], ['Clifford II', 'clifford', 1.7, 1.7, 0.6, 1.2], ['De Jong', 'dejong', 1.4, -2.3, 2.4, -2.1], ['De Jong II', 'dejong', -2.0, -2.0, -1.2, 2.0]];
    presets.forEach(([n, k, a, b, c, d], i) => {
      const btn = document.createElement('button'); btn.className = 'chip' + (i === 0 ? ' is-active' : ''); btn.type = 'button'; btn.textContent = n;
      btn.addEventListener('click', () => { actions.querySelectorAll('.chip').forEach(x => x.classList.remove('is-active')); btn.classList.add('is-active'); P.kind = k; document.getElementById('formula-text').textContent = TEXT[k]; state.set({ a, b, c, d }); });
      actions.appendChild(btn);
    });
    panel.appendChild(actions);
    M.lazyTile(fc, redraw);
  }

  /* ---------- Vignettes ---------- */
  document.querySelectorAll('[data-att]').forEach(tile => {
    const [k, a, b, c, d] = tile.dataset.att.split(','); const cv = tile.querySelector('canvas');
    M.lazyTile(tile, (w, h) => { cv.width = Math.round(w) || 400; cv.height = Math.round(h) || 400; renderStatic(cv, k, +a, +b, +c, +d, 300000); });
  });

  /* ---------- Hero : accumulation vivante ---------- */
  const wrap = document.getElementById('hero-canvas'); const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) { M.fallback(wrap.closest('.hero')); return; }
  let w = 0, h = 0, counts, img;
  const scale = M.mobile ? 0.5 : 0.62;
  M.fit(canvas, (cw, ch) => { w = cw; h = ch; counts = new Float32Array(w * h); img = ctx.createImageData(w, h); }, scale);
  const ptr = M.pointer();
  const base = { a: -1.4, b: 1.6, c: 1.0, d: 0.7 };
  const iters = M.mobile ? 30000 : 70000;
  let time = 0;
  const frame = (t, dt) => {
    if (!counts) return;
    ptr.update(); time += dt;
    const a = base.a + Math.sin(time * .13) * .35 + ptr.x * .2;
    const b = base.b + Math.cos(time * .09) * .3 - ptr.y * .2;
    const c = base.c + Math.sin(time * .07 + 1) * .4 + ptr.y * .15;
    const d = base.d + Math.cos(time * .11 + 2) * .3 + ptr.x * .1;
    const decay = M.reduced ? 1 : 0.9;
    for (let i = 0, n = w * h; i < n; i++) counts[i] *= decay;
    accumulate(counts, w, h, MAPS.clifford, a, b, c, d, iters, w > h ? 0.21 : 0.3);
    paint(ctx, img, counts, w, h, 0.5);
  };
  if (M.reduced) { M.fit(canvas, null, scale); counts = new Float32Array(w * h); img = ctx.createImageData(w, h); accumulate(counts, w, h, MAPS.clifford, base.a, base.b, base.c, base.d, 600000, w > h ? 0.21 : 0.3); paint(ctx, img, counts, w, h, 0.08); }
  else M.loop(canvas, frame);
})();
