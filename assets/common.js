/* Motion Lab — utilitaires communs : boucle d'animation économe, panneau de paramètres,
   navigation, reveal au scroll, texte mot par mot, boutons magnétiques, curseur. */
window.MOTION = (() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 768px)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* Boucle rAF coupée quand l'onglet est masqué ou le canvas hors écran. */
  function loop(el, fn) {
    let raf = 0, visible = true, running = false, stopped = false, last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      fn(now / 1000, dt);
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      const should = visible && !document.hidden && !stopped;
      if (should && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(tick); }
      else if (!should && running) { running = false; cancelAnimationFrame(raf); }
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0 }).observe(el);
    }
    document.addEventListener('visibilitychange', sync);
    sync();
    return { stop() { stopped = true; sync(); }, start() { stopped = false; sync(); }, once() { fn(performance.now() / 1000, 1 / 60); } };
  }

  /* Ajuste la résolution interne d'un canvas à sa taille CSS (× dpr plafonné). */
  function fit(canvas, cb, maxDpr = dpr) {
    const apply = () => {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width * maxDpr)), h = Math.max(1, Math.round(r.height * maxDpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; cb && cb(w, h, maxDpr); }
    };
    apply();
    if ('ResizeObserver' in window) new ResizeObserver(apply).observe(canvas); else addEventListener('resize', apply);
    return apply;
  }

  /* Pointeur normalisé (-1..1) lissé. */
  function pointer(target = window, smooth = 0.08) {
    const p = { x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0, active: false, update() { p.x += (p.tx - p.x) * smooth; p.y += (p.ty - p.y) * smooth; } };
    const set = (cx, cy) => {
      const r = target === window ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : target.getBoundingClientRect();
      p.px = cx - r.left; p.py = cy - r.top;
      p.tx = (p.px / r.width) * 2 - 1; p.ty = -((p.py / r.height) * 2 - 1); p.active = true;
    };
    addEventListener('pointermove', e => set(e.clientX, e.clientY), { passive: true });
    addEventListener('touchmove', e => { const t = e.touches[0]; if (t) set(t.clientX, t.clientY); }, { passive: true });
    return p;
  }

  /* Panneau de paramètres : defs = [{key,label,min,max,step,value}] ; onChange(state, key). */
  function params(root, defs, onChange) {
    const state = {};
    root.innerHTML = '';
    defs.forEach(d => {
      state[d.key] = d.value;
      const row = document.createElement('div'); row.className = 'params__row';
      const id = 'p-' + d.key + '-' + Math.random().toString(36).slice(2, 7);
      row.innerHTML = `<label for="${id}"><span>${d.label}</span><output>${fmt(d.value)}</output></label>
        <input id="${id}" type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${d.value}">`;
      const input = row.querySelector('input'), out = row.querySelector('output');
      input.addEventListener('input', () => { state[d.key] = parseFloat(input.value); out.textContent = fmt(state[d.key]); onChange && onChange(state, d.key); });
      row._set = v => { input.value = v; state[d.key] = v; out.textContent = fmt(v); };
      root.appendChild(row);
    });
    state.set = (obj) => { Object.entries(obj).forEach(([k, v]) => { const r = [...root.children].find(c => c.querySelector('input') && c.querySelector('input').id.startsWith('p-' + k + '-')); if (r) r._set(v); }); onChange && onChange(state, null); };
    return state;
  }
  const fmt = v => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(3).replace(/\.?0+$/, '') || '0');

  /* Rendu paresseux d'une vignette : dessinée à l'entrée dans l'écran, redessinée seulement
     si sa largeur change nettement (évite les rafales de ResizeObserver). */
  function lazyTile(el, render) {
    let lastW = 0, timer = 0;
    const run = () => { const w = el.getBoundingClientRect().width; if (!w || Math.abs(w - lastW) < w * 0.15) return; lastW = w; render(w, el.getBoundingClientRect().height); };
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { run(); io.disconnect(); if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(run, 250); }).observe(el); } }, { rootMargin: '200px' }) : null;
    if (io) io.observe(el); else run();
  }

  /* Accumulation de densité : remplit un canvas 2D à partir d'un tableau de comptages. */
  function densityToCanvas(canvas, counts, w, h, colorAt, bg) {
    const ctx = canvas.getContext('2d'); const img = ctx.createImageData(w, h); const d = img.data;
    let max = 0; for (let i = 0; i < counts.length; i++) if (counts[i] > max) max = counts[i];
    const lmax = Math.log(1 + max) || 1;
    for (let i = 0; i < w * h; i++) {
      const t = Math.log(1 + counts[i]) / lmax; const c = colorAt(t, i);
      d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  const hexToRgb = (c) => { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; };
  const lerpRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /* Teste la disponibilité de WebGL / WebGL2. */
  function hasWebGL(v2 = false) {
    try { const c = document.createElement('canvas'); return !!(v2 ? c.getContext('webgl2') : (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }
  function fallback(hero) { (hero || document.body).classList.add('no-webgl'); }

  /* Comportements DOM. */
  function init() {
    const header = document.querySelector('.header');
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav');
    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 20);
      addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }
    if (burger && nav) {
      burger.addEventListener('click', () => { const open = nav.classList.toggle('is-open'); burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; });
      nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }));
    }
    /* Mot par mot */
    document.querySelectorAll('[data-words]').forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i); s.textContent = w; el.appendChild(s); el.appendChild(document.createTextNode(' ')); });
    });
    /* Reveal */
    const targets = document.querySelectorAll('[data-reveal], [data-words]');
    if (reduced || !('IntersectionObserver' in window)) targets.forEach(t => t.classList.add('is-in'));
    else {
      const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      targets.forEach(t => io.observe(t));
      setTimeout(() => document.querySelectorAll('.hero [data-reveal], .hero [data-words]').forEach(t => t.classList.add('is-in')), 150);
    }
    /* Boutons magnétiques */
    if (!touch && !reduced) document.querySelectorAll('.btn, [data-magnetic]').forEach(btn => {
      btn.addEventListener('pointermove', e => { const r = btn.getBoundingClientRect(); const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; btn.style.transform = `translate(${x * .25}px, ${y * .35}px)`; });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
    /* Curseur personnalisé */
    if (!touch && !reduced && document.body.dataset.cursor !== 'off') {
      const c = document.createElement('div'); c.className = 'cursor'; document.body.appendChild(c);
      let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
      addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; c.classList.add('is-visible'); }, { passive: true });
      document.addEventListener('mouseleave', () => c.classList.remove('is-visible'));
      document.querySelectorAll('a, button, input[type="range"], .tile').forEach(el => { el.addEventListener('pointerenter', () => c.classList.add('is-hover')); el.addEventListener('pointerleave', () => c.classList.remove('is-hover')); });
      (function follow() { x += (tx - x) * .2; y += (ty - y) * .2; c.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`; requestAnimationFrame(follow); })();
    }
    /* Année du footer */
    document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
    /* Formulaire Netlify : envoi AJAX avec confirmation, repli sur l'envoi classique */
    document.querySelectorAll('form[data-netlify]').forEach(form => {
      form.addEventListener('submit', async e => {
        if (!window.fetch) return;
        e.preventDefault();
        const btn = form.querySelector('[type="submit"]'); if (btn) { btn.disabled = true; btn.textContent = 'Envoi…'; }
        try {
          const body = new URLSearchParams(new FormData(form)).toString();
          const res = await fetch(form.getAttribute('action') || location.pathname, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
          if (!res.ok) throw new Error(res.status);
          form.classList.add('is-sent');
        } catch (err) { if (btn) { btn.disabled = false; btn.textContent = 'Réessayer'; } }
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { reduced, mobile, touch, dpr, loop, fit, pointer, params, hasWebGL, fallback, lazyTile, densityToCanvas, hexToRgb, lerpRgb };
})();
