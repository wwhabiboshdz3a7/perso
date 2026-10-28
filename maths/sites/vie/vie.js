(() => {
  const M = window.MOTION;

  /* ---------- Automate cellulaire générique (règle B/S) ---------- */
  function automaton(canvas, opts) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return null;
    const o = Object.assign({ cell: 14, rate: 8, birth: [3], survive: [2, 3], density: 0.28, bg: '#0e0f12', color: [255, 204, 0], dim: [74, 209, 255], dpr: 1, pointer: null, onStats: null, seed: null }, opts);
    let W = 0, H = 0, gw = 0, gh = 0, G, G2, age; let acc = 0, gen = 0;
    const B = new Uint8Array(9), S = new Uint8Array(9);
    const setRule = (b, s) => { B.fill(0); S.fill(0); b.forEach(n => B[n] = 1); s.forEach(n => S[n] = 1); };
    setRule(o.birth, o.survive);
    const reset = () => {
      gw = Math.max(8, Math.floor(W / (o.cell * o.dpr))); gh = Math.max(8, Math.floor(H / (o.cell * o.dpr)));
      G = new Uint8Array(gw * gh); G2 = new Uint8Array(gw * gh); age = new Float32Array(gw * gh); gen = 0;
      if (o.seed) o.seed(G, gw, gh); else for (let i = 0; i < G.length; i++) G[i] = Math.random() < o.density ? 1 : 0;
    };
    M.fit(canvas, (cw, ch) => { W = cw; H = ch; reset(); }, o.dpr);
    const generation = () => {
      let alive = 0;
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += G[((y + dy + gh) % gh) * gw + ((x + dx + gw) % gw)];
        const i = y * gw + x; G2[i] = G[i] ? S[n] : B[n]; alive += G2[i];
      }
      [G, G2] = [G2, G]; gen++;
      return alive;
    };
    let alive = 0;
    const step = (dt) => {
      if (!gw) return;
      acc += dt * o.rate; while (acc >= 1) { acc -= 1; alive = generation(); if (o.onStats) o.onStats(gen, alive); }
      ctx.fillStyle = o.bg; ctx.fillRect(0, 0, W, H);
      const cs = W / gw, ch = H / gh; const pad = Math.max(1, cs * .12);
      for (let i = 0; i < G.length; i++) {
        age[i] = G[i] ? Math.min(1, age[i] + dt * 4) : Math.max(0, age[i] - dt * 1.5);
        const a = age[i]; if (a <= 0) continue;
        const x = (i % gw) * cs, y = ((i / gw) | 0) * ch; const c = G[i] ? o.color : o.dim;
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${G[i] ? .35 + .65 * a : a * .5})`;
        const r = Math.min(3, cs * .2); ctx.beginPath(); ctx.roundRect(x + pad, y + pad, cs - pad * 2, ch - pad * 2, r); ctx.fill();
      }
    };
    const paint = (clientX, clientY) => { const r = canvas.getBoundingClientRect(); const x = Math.floor((clientX - r.left) / r.width * gw), y = Math.floor((clientY - r.top) / r.height * gh); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = ((y + dy + gh) % gh) * gw + ((x + dx + gw) % gw); if (Math.random() < .7) { G[i] = 1; age[i] = 1; } } };
    return { step, reset, paint, setRule, set(k, v) { o[k] = v; }, gens: () => gen };
  }

  /* ---------- Motifs connus ---------- */
  const PATTERNS = {
    glider: ['.#.', '..#', '###'],
    lwss: ['.#..#', '#....', '#...#', '####.'],
    rpent: ['.##', '##.', '.#.'],
    pulsar: ['..###...###..', '.............', '#....#.#....#', '#....#.#....#', '#....#.#....#', '..###...###..', '.............', '..###...###..', '#....#.#....#', '#....#.#....#', '#....#.#....#', '.............', '..###...###..'],
    gun: ['........................#...........', '......................#.#...........', '............##......##............##', '...........#...#....##............##', '##........#.....#...##..............', '##........#...#.##....#.#...........', '..........#.....#.......#...........', '...........#...#....................', '............##......................'],
  };
  const stamp = (pattern, ox, oy) => (G, gw, gh) => { pattern.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') G[((oy + y) % gh) * gw + ((ox + x) % gw)] = 1; })); };

  /* ---------- Hero ---------- */
  const wrap = document.getElementById('hero-canvas'); const heroCanvas = wrap.querySelector('canvas');
  const genEl = document.getElementById('gen'), aliveEl = document.getElementById('alive');
  const hero = automaton(heroCanvas, { cell: M.mobile ? 16 : 18, rate: 6, density: .22, dpr: Math.min(M.dpr, 1.5), onStats: (g, a) => { if (genEl) genEl.textContent = g; if (aliveEl) aliveEl.textContent = a; } });
  if (!hero) M.fallback(wrap.closest('.hero'));
  else {
    addEventListener('pointermove', e => { if (scrollY < innerHeight * .8 && e.clientY < innerHeight) hero.paint(e.clientX, e.clientY); }, { passive: true });
    if (M.reduced) { for (let i = 0; i < 30; i++) hero.step(1 / 6); } else M.loop(heroCanvas, (t, dt) => hero.step(Math.min(dt, .05)));
    // Réensemencement si la grille se fige.
    setInterval(() => { if (!document.hidden && Math.random() < .5) hero.paint(Math.random() * innerWidth, Math.random() * innerHeight); }, 1500);
  }

  /* ---------- Panneau interactif ---------- */
  const fc = document.getElementById('formula-canvas'); const panel = document.getElementById('params');
  if (fc && panel) {
    const sim = automaton(fc, { cell: 12, rate: 8, density: .25, bg: '#16181d' });
    if (sim) {
      let down = false;
      fc.addEventListener('pointerdown', e => { down = true; sim.paint(e.clientX, e.clientY); });
      fc.addEventListener('pointermove', e => { if (down) sim.paint(e.clientX, e.clientY); });
      addEventListener('pointerup', () => { down = false; });
      if (M.reduced) { for (let i = 0; i < 30; i++) sim.step(1 / 8); } else M.loop(fc, (t, dt) => sim.step(Math.min(dt, .05)));
    }
    M.params(panel, [
      { key: 'rate', label: 'Générations par seconde', min: 1, max: 30, step: 1, value: 8 },
      { key: 'density', label: 'Densité initiale', min: 0.05, max: 0.6, step: 0.01, value: 0.25 },
    ], (s, key) => { if (!sim) return; sim.set(key, s[key]); if (key === 'density') sim.reset(); });
    const actions = document.createElement('div'); actions.className = 'params__actions';
    [['B3/S23 — Vie', [3], [2, 3]], ['B36/S23 — HighLife', [3, 6], [2, 3]], ['B3678/S34678 — Jour & nuit', [3, 6, 7, 8], [3, 4, 6, 7, 8]], ['B2/S — Graines', [2], []]].forEach(([n, b, s], i) => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'chip' + (i ? '' : ' is-active'); btn.textContent = n;
      btn.addEventListener('click', () => { actions.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active')); btn.classList.add('is-active'); if (sim) { sim.setRule(b, s); sim.reset(); } });
      actions.appendChild(btn);
    });
    const reseed = document.createElement('button'); reseed.type = 'button'; reseed.className = 'chip'; reseed.textContent = 'Réensemencer'; reseed.addEventListener('click', () => sim && sim.reset()); actions.appendChild(reseed);
    panel.appendChild(actions);
  }

  /* ---------- Vignettes : motifs célèbres ---------- */
  document.querySelectorAll('[data-life]').forEach(tile => {
    const cv = tile.querySelector('canvas'); const key = tile.dataset.life;
    M.lazyTile(tile, () => {
      const pattern = PATTERNS[key];
      const sim = automaton(cv, { cell: key === 'gun' ? 7 : 10, rate: key === 'random' ? 6 : 5, density: .3, bg: '#16181d', seed: pattern ? (G, gw, gh) => stamp(pattern, Math.max(0, Math.floor(gw / 2 - pattern[0].length / 2)), Math.max(0, Math.floor(gh / 2 - pattern.length / 2)))(G, gw, gh) : null });
      if (!sim) return;
      if (M.reduced) { for (let i = 0; i < 4; i++) sim.step(1 / 5); } else M.loop(cv, (t, dt) => sim.step(Math.min(dt, .05)));
    });
  });
})();
