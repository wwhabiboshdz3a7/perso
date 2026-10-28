(() => {
  const M = window.MOTION;

  /* ---------- Bruit simplex 3D (implémentation compacte) ---------- */
  const noise = (() => {
    const grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    const p = new Uint8Array(256); for (let i = 0; i < 256; i++) p[i] = i;
    let seed = 1337; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    const perm = new Uint8Array(512), permMod = new Uint8Array(512);
    for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; permMod[i] = perm[i] % 12; }
    const F3 = 1 / 3, G3 = 1 / 6;
    const dot = (g, x, y, z) => g[0] * x + g[1] * y + g[2] * z;
    return (xin, yin, zin) => {
      const s = (xin + yin + zin) * F3; const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
      const t = (i + j + k) * G3; const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
      let i1, j1, k1, i2, j2, k2;
      if (x0 >= y0) { if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; } }
      else { if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } }
      const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3, x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3, x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
      const ii = i & 255, jj = j & 255, kk = k & 255;
      let n = 0, t0 = .6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 > 0) { t0 *= t0; n += t0 * t0 * dot(grad3[permMod[ii + perm[jj + perm[kk]]]], x0, y0, z0); }
      let t1 = .6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 > 0) { t1 *= t1; n += t1 * t1 * dot(grad3[permMod[ii + i1 + perm[jj + j1 + perm[kk + k1]]]], x1, y1, z1); }
      let t2 = .6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 > 0) { t2 *= t2; n += t2 * t2 * dot(grad3[permMod[ii + i2 + perm[jj + j2 + perm[kk + k2]]]], x2, y2, z2); }
      let t3 = .6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 > 0) { t3 *= t3; n += t3 * t3 * dot(grad3[permMod[ii + 1 + perm[jj + 1 + perm[kk + 1]]]], x3, y3, z3); }
      return 32 * n;
    };
  })();

  const BG = [15, 31, 23];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* ---------- Système de particules sur champ ---------- */
  function flowSystem(canvas, opts) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return null;
    const o = Object.assign({ count: 1200, freq: 0.0022, curl: 2.2, speed: 1.4, colors: ['#9fc5a5', '#e9dcc4'], fade: 0.08, width: 1.1, dpr: M.dpr, pointer: null, bg: BG }, opts);
    const A = M.hexToRgb(o.colors[0]), B = M.hexToRgb(o.colors[1]);
    let w = 0, h = 0, parts = null;
    const spawn = (i) => { parts[i * 4] = Math.random() * w; parts[i * 4 + 1] = Math.random() * h; parts[i * 4 + 2] = parts[i * 4]; parts[i * 4 + 3] = parts[i * 4 + 1]; };
    const reset = () => { parts = new Float32Array(o.count * 4); for (let i = 0; i < o.count; i++) spawn(i); ctx.fillStyle = rgba(o.bg, 1); ctx.fillRect(0, 0, w, h); };
    M.fit(canvas, (cw, ch) => { w = cw; h = ch; reset(); }, o.dpr);
    let time = Math.random() * 100;
    const step = (dt, steps = 1) => {
      if (!parts) return;
      time += dt * 0.12;
      ctx.fillStyle = rgba(o.bg, o.fade); ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = o.width * o.dpr; ctx.lineCap = 'round';
      const px = o.pointer ? o.pointer.px * o.dpr : -1e4, py = o.pointer ? o.pointer.py * o.dpr : -1e4;
      const NB = 12; const buckets = o._buckets || (o._buckets = Array.from({ length: NB }, () => new Float32Array(o.count * 4)));
      const fill = new Int32Array(NB);
      for (let s = 0; s < steps; s++) for (let i = 0; i < o.count; i++) {
        const k = i * 4; let x = parts[k], y = parts[k + 1];
        let ang = noise(x * o.freq, y * o.freq, time) * Math.PI * o.curl;
        const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy, R = 180 * o.dpr;
        if (d2 < R * R) { const d = Math.sqrt(d2) + 1e-3; const f = 1 - d / R; ang += f * Math.PI * 0.5 * Math.sign(Math.sin(ang)); x += (dx / d) * f * 1.5 * o.dpr; y += (dy / d) * f * 1.5 * o.dpr; }
        const sp = o.speed * o.dpr * (1 + (i % 7) * .08);
        const nx = x + Math.cos(ang) * sp, ny = y + Math.sin(ang) * sp;
        const b = i % NB; const bi = fill[b]++ * 4; const arr = buckets[b]; arr[bi] = x; arr[bi + 1] = y; arr[bi + 2] = nx; arr[bi + 3] = ny;
        if (nx < 0 || nx > w || ny < 0 || ny > h || Math.random() < 0.002) spawn(i); else { parts[k] = nx; parts[k + 1] = ny; }
      }
      // Un seul tracé par teinte : 12 appels de dessin au lieu de plusieurs centaines.
      for (let b = 0; b < NB; b++) {
        const arr = buckets[b], n = fill[b]; if (!n) continue;
        ctx.strokeStyle = rgba(M.lerpRgb(A, B, b / (NB - 1)), 0.55); ctx.beginPath();
        for (let j = 0; j < n; j++) { const q = j * 4; ctx.moveTo(arr[q], arr[q + 1]); ctx.lineTo(arr[q + 2], arr[q + 3]); }
        ctx.stroke();
      }
    };
    return { step, reset, set(k, v) { o[k] = v; } };
  }

  /* ---------- Hero ---------- */
  const wrap = document.getElementById('hero-canvas'); const heroCanvas = wrap.querySelector('canvas');
  const ptr = M.pointer();
  const hero = flowSystem(heroCanvas, { count: M.mobile ? 500 : 1600, pointer: ptr, dpr: Math.min(M.dpr, 1.5) });
  if (!hero) M.fallback(wrap.closest('.hero'));
  else if (M.reduced) { for (let i = 0; i < 140; i++) hero.step(1 / 60); }
  else M.loop(heroCanvas, (t, dt) => { ptr.update(); hero.step(dt); });

  /* ---------- Bandes entre sections ---------- */
  document.querySelectorAll('[data-band]').forEach(c => {
    const sys = flowSystem(c, { count: M.mobile ? 220 : 500, freq: 0.004, curl: 1.4, speed: 1.8, fade: 0.05, width: 1, dpr: 1 });
    if (!sys) return;
    if (M.reduced) { for (let i = 0; i < 160; i++) sys.step(1 / 60); } else M.loop(c, (t, dt) => sys.step(dt));
  });

  /* ---------- Panneau de paramètres ---------- */
  const fc = document.getElementById('formula-canvas');
  const panel = document.getElementById('params');
  if (fc && panel) {
    const sys = flowSystem(fc, { count: 700, freq: 0.004, curl: 2, speed: 1.5, fade: 0.06, dpr: 1 });
    const loop = sys && !M.reduced ? M.loop(fc, (t, dt) => sys.step(dt)) : null;
    if (sys && M.reduced) for (let i = 0; i < 160; i++) sys.step(1 / 60);
    M.params(panel, [
      { key: 'freq', label: 'Fréquence du bruit (taille des méandres)', min: 0.001, max: 0.012, step: 0.0005, value: 0.004 },
      { key: 'curl', label: 'Enroulement (tours par unité)', min: 0.5, max: 6, step: 0.1, value: 2 },
      { key: 'speed', label: 'Vitesse du courant', min: 0.3, max: 4, step: 0.1, value: 1.5 },
    ], (s, key) => { if (!sys) return; sys.set('freq', s.freq); sys.set('curl', s.curl); sys.set('speed', s.speed); hero && hero.set('freq', s.freq * 0.55); hero && hero.set('curl', s.curl); hero && hero.set('speed', s.speed); if (M.reduced) { sys.reset(); for (let i = 0; i < 160; i++) sys.step(1 / 60); } });
  }

  /* ---------- Vignettes : lignes de courant statiques ---------- */
  document.querySelectorAll('[data-flow]').forEach(tile => {
    const [freq, curl, c1, c2] = tile.dataset.flow.split(','); const cv = tile.querySelector('canvas');
    M.lazyTile(tile, (w, h) => {
      cv.width = Math.round(w); cv.height = Math.round(h); const ctx = cv.getContext('2d'); if (!ctx) return;
      ctx.fillStyle = '#142a1f'; ctx.fillRect(0, 0, cv.width, cv.height);
      const A = M.hexToRgb(c1), B = M.hexToRgb(c2); const z = Math.random() * 10;
      ctx.lineWidth = 1; ctx.lineCap = 'round';
      const n = 260;
      for (let i = 0; i < n; i++) {
        let x = Math.random() * cv.width, y = Math.random() * cv.height;
        ctx.strokeStyle = rgba(M.lerpRgb(A, B, i / n), 0.5); ctx.beginPath(); ctx.moveTo(x, y);
        for (let s = 0; s < 90; s++) { const a = noise(x * freq, y * freq, z) * Math.PI * curl; x += Math.cos(a) * 2; y += Math.sin(a) * 2; ctx.lineTo(x, y); }
        ctx.stroke();
      }
    });
  });
})();
