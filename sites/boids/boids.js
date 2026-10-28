(() => {
  const M = window.MOTION;

  /* ---------- Volée de boids (grille spatiale pour rester fluide) ---------- */
  function flock(canvas, opts) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return null;
    const o = Object.assign({ count: 300, sep: 1.4, ali: 1.0, coh: 0.8, radius: 60, maxSpeed: 2.6, pointer: null, attract: 0.6, bg: '#f4f6fb', color: '#1c2340', accent: '#ff4d6d', dpr: M.dpr, trail: false, size: 1 }, opts);
    let w = 0, h = 0; const B = [];
    const spawn = () => { B.length = 0; for (let i = 0; i < o.count; i++) B.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, k: Math.random() }); };
    M.fit(canvas, (cw, ch) => { w = cw; h = ch; spawn(); ctx.fillStyle = o.bg; ctx.fillRect(0, 0, w, h); }, o.dpr);
    const grid = new Map();
    const step = (dt) => {
      if (!w) return;
      const R = o.radius * o.dpr, R2 = R * R, cell = R; grid.clear();
      for (const b of B) { const key = ((b.x / cell) | 0) + ',' + ((b.y / cell) | 0); let a = grid.get(key); if (!a) grid.set(key, a = []); a.push(b); }
      const px = o.pointer ? o.pointer.px * o.dpr : null, py = o.pointer ? o.pointer.py * o.dpr : null;
      const max = o.maxSpeed * o.dpr;
      for (const b of B) {
        let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
        const gx = (b.x / cell) | 0, gy = (b.y / cell) | 0;
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = grid.get((gx + i) + ',' + (gy + j)); if (!a) continue; for (const q of a) { if (q === b) continue; const dx = q.x - b.x, dy = q.y - b.y, d2 = dx * dx + dy * dy; if (d2 < R2) { n++; ax += q.vx; ay += q.vy; cx += q.x; cy += q.y; if (d2 < R2 * .12) { const inv = 1 / (d2 + 1); sx -= dx * inv; sy -= dy * inv; } } } }
        if (n) { b.vx += (ax / n - b.vx) * .06 * o.ali + (cx / n - b.x) * .0025 * o.coh + sx * 14 * o.sep * o.dpr; b.vy += (ay / n - b.vy) * .06 * o.ali + (cy / n - b.y) * .0025 * o.coh + sy * 14 * o.sep * o.dpr; }
        if (px !== null && o.pointer.active) { const dx = px - b.x, dy = py - b.y; const d = Math.hypot(dx, dy) + 1; b.vx += dx / d * .08 * o.attract; b.vy += dy / d * .08 * o.attract; }
        else { b.vx += (w / 2 - b.x) * .0003; b.vy += (h / 2 - b.y) * .0003; }
        b.vx += (Math.random() - .5) * .1; b.vy += (Math.random() - .5) * .1;
        const sp = Math.hypot(b.vx, b.vy) || 1; const lim = max * (.8 + b.k * .4); if (sp > lim) { b.vx = b.vx / sp * lim; b.vy = b.vy / sp * lim; } else if (sp < max * .4) { b.vx = b.vx / sp * max * .4; b.vy = b.vy / sp * max * .4; }
        b.x += b.vx * dt * 60; b.y += b.vy * dt * 60;
        const m = 20 * o.dpr; if (b.x < -m) b.x = w + m; if (b.x > w + m) b.x = -m; if (b.y < -m) b.y = h + m; if (b.y > h + m) b.y = -m;
      }
      ctx.fillStyle = o.trail ? o.bg.replace(')', ',.3)').replace('rgb(', 'rgba(') : o.bg;
      if (o.trail && o.bg.startsWith('#')) { const c = M.hexToRgb(o.bg); ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},.35)`; }
      ctx.fillRect(0, 0, w, h);
      const s = 5 * o.dpr * o.size;
      for (let i = 0; i < B.length; i++) { const b = B[i]; const a = Math.atan2(b.vy, b.vx); ctx.fillStyle = i % 9 ? o.color : o.accent; ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * s * 1.4, b.y + Math.sin(a) * s * 1.4); ctx.lineTo(b.x + Math.cos(a + 2.4) * s, b.y + Math.sin(a + 2.4) * s); ctx.lineTo(b.x + Math.cos(a - 2.4) * s, b.y + Math.sin(a - 2.4) * s); ctx.closePath(); ctx.fill(); }
    };
    return { step, set(k, v) { o[k] = v; } };
  }

  /* ---------- Hero ---------- */
  const wrap = document.getElementById('hero-canvas'); const heroCanvas = wrap.querySelector('canvas');
  const ptr = M.pointer();
  const hero = flock(heroCanvas, { count: M.mobile ? 140 : 420, pointer: ptr, dpr: Math.min(M.dpr, 1.5) });
  if (!hero) M.fallback(wrap.closest('.hero'));
  else if (M.reduced) { for (let i = 0; i < 120; i++) hero.step(1 / 60); }
  else M.loop(heroCanvas, (t, dt) => { ptr.update(); hero.step(Math.min(dt, .033)); });
  // Le curseur n'attire que s'il est sur le hero.
  addEventListener('pointermove', e => { ptr.active = e.clientY < innerHeight && scrollY < innerHeight * .8; }, { passive: true });

  /* ---------- Panneau ---------- */
  const fc = document.getElementById('formula-canvas'); const panel = document.getElementById('params');
  if (fc && panel) {
    const sim = flock(fc, { count: 180, dpr: 1, bg: '#ffffff' });
    if (sim) { if (M.reduced) { for (let i = 0; i < 120; i++) sim.step(1 / 60); } else M.loop(fc, (t, dt) => sim.step(Math.min(dt, .033))); }
    M.params(panel, [
      { key: 'sep', label: 's — séparation', min: 0, max: 3, step: 0.1, value: 1.4 },
      { key: 'ali', label: 'a — alignement', min: 0, max: 3, step: 0.1, value: 1 },
      { key: 'coh', label: 'c — cohésion', min: 0, max: 3, step: 0.1, value: 0.8 },
      { key: 'radius', label: 'Rayon de vision (px)', min: 15, max: 160, step: 1, value: 60 },
    ], (s, key) => { [sim, hero].forEach(x => x && x.set(key, s[key])); });
  }

  /* ---------- Vignettes : traces de déplacements ---------- */
  document.querySelectorAll('[data-trace]').forEach(tile => {
    const cv = tile.querySelector('canvas'); const seed = +tile.dataset.trace;
    M.lazyTile(tile, (w, h) => {
      cv.width = Math.round(w); cv.height = Math.round(h); const ctx = cv.getContext('2d'); if (!ctx) return;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
      const sim = flock(cv, { count: 60 + seed * 10, dpr: 1, bg: 'rgba(255,255,255,0)', radius: 30 + seed * 8, coh: .5 + seed * .2, trail: true, size: .6 });
      // On laisse la trace s'accumuler : fond transparent, puis on dessine en semi-opacité.
      if (!sim) return;
      ctx.globalAlpha = 1;
      for (let i = 0; i < 160; i++) { ctx.globalAlpha = .08 + (i / 160) * .3; sim.step(1 / 60); }
      ctx.globalAlpha = 1;
    });
  });
})();
