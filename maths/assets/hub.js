/* Page galerie : fond de hero + une miniature vivante par site. */
(() => {
  const M = window.MOTION;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* ---------- Mini bruit (value noise lissé) pour le champ de vecteurs ---------- */
  const vnoise = (() => {
    const g = new Float32Array(256 * 256); for (let i = 0; i < g.length; i++) g[i] = Math.random();
    const sm = t => t * t * (3 - 2 * t);
    return (x, y) => { const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255, xf = sm(x - Math.floor(x)), yf = sm(y - Math.floor(y)); const a = g[yi * 256 + xi], b = g[yi * 256 + ((xi + 1) & 255)], c = g[((yi + 1) & 255) * 256 + xi], d = g[((yi + 1) & 255) * 256 + ((xi + 1) & 255)]; return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf; };
  })();

  /* ---------- Les sites ---------- */
  const SITES = [
    { slug: 'lorenz', num: '01', title: 'Strange Studio', kind: 'Agence de design', math: "dx/dt = σ(y − x) · Lorenz", desc: 'Un papillon de particules qui tourne avec le scroll, couleur selon la vitesse.', tag: 'Three.js', viz: lorenz },
    { slug: 'aizawa', num: '02', title: 'Maison Ophélia', kind: 'Parfumerie', math: 'Aizawa · Thomas · Halvorsen', desc: 'Trois attracteurs, un par parfum, qui se métamorphosent l\'un dans l\'autre.', tag: 'Three.js', viz: thomas },
    { slug: 'clifford', num: '03', title: 'Anouk Ferrand', kind: 'Photographe', math: "x′ = sin(a·y) + c·cos(a·x)", desc: 'Des millions de points accumulés comme de la lumière sur du papier.', tag: 'Canvas 2D', viz: clifford },
    { slug: 'flowfield', num: '04', title: 'Atelier Rive', kind: 'Paysagistes', math: 'θ = 2π · bruit(x, y, t)', desc: 'Un champ de vecteurs tiré du bruit, des lignes qui coulent entre les sections.', tag: 'Canvas 2D', viz: flow },
    { slug: 'fourier', num: '05', title: 'Maison Hélion', kind: 'Horlogerie', math: 'z(t) = Σ cₖ · e^{ikt}', desc: 'Des cercles emboîtés qui dessinent un monogramme et révèlent le texte.', tag: 'Canvas 2D', viz: fourier },
    { slug: 'grayscott', num: '06', title: 'Osmose Laboratoire', kind: 'Cosmétique', math: '∂v/∂t = Dᵥ∇²v + uv² − (f+k)v', desc: 'Une réaction-diffusion calculée sur le GPU, qui réagit au pointeur.', tag: 'WebGL2', viz: grayscott },
    { slug: 'superformule', num: '07', title: 'Orbe Joaillerie', kind: 'Joaillerie', math: 'r(φ) = [|cos(mφ/4)|ⁿ² + |sin(mφ/4)|ⁿ³]^(−1/n₁)', desc: 'Des bijoux en or générés par la superformule, autour d\'une courbe de Lissajous.', tag: 'Three.js', viz: superformula },
    { slug: 'julia', num: '08', title: 'Itéra Conseil', kind: 'Conseil data', math: 'z → z² + c · c = 0,7885·e^{iθ}', desc: 'Un ensemble de Julia en zoom continu, palette par cosinus.', tag: 'GLSL', viz: julia },
    { slug: 'boids', num: '09', title: 'Nuée', kind: 'Événementiel', math: 'séparation + alignement + cohésion', desc: 'Une volée d\'oiseaux qui suit votre curseur et se pose sur les titres.', tag: 'Canvas 2D', viz: boids },
    { slug: 'vie', num: '10', title: 'Cellule', kind: 'Coworking', math: 'B3 / S23 · Conway', desc: 'Un automate cellulaire qui respire derrière une communauté qui grandit.', tag: 'Canvas 2D', viz: life },
  ];

  const grid = document.getElementById('grid');
  SITES.forEach((s, i) => {
    const el = document.createElement('article'); el.className = 'site'; el.setAttribute('data-reveal', ''); el.style.setProperty('--d', (i % 3) * 0.1 + 's');
    el.innerHTML = `<div class="site__viz"><span class="site__num">${s.num}</span><span class="site__tag">${s.tag}</span><canvas aria-hidden="true"></canvas></div>
      <div class="site__body"><h3>${s.title}<span>${s.kind}</span></h3><p>${s.desc}</p><div class="site__math">${s.math}</div><span class="site__cta">Ouvrir le site</span></div>
      <a class="site__link" href="sites/${s.slug}/" aria-label="Ouvrir ${s.title} — ${s.kind}"></a>`;
    grid.appendChild(el);
    const canvas = el.querySelector('canvas');
    M.lazyTile(el, (w, h) => { canvas.width = Math.round(w); canvas.height = Math.round(h * 10 / 16); const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return; const step = s.viz(ctx, canvas.width, canvas.height); if (M.reduced) { for (let k = 0; k < 90; k++) step(1 / 60, k); } else M.loop(canvas, (t, dt) => step(dt)); });
  });

  /* ---------- 01 Lorenz : projection 2D avec rotation ---------- */
  function lorenz(ctx, w, h) {
    const N = 160, K = 14; const pts = []; for (let i = 0; i < N; i++) pts.push({ p: [(Math.random() - .5) * 20, (Math.random() - .5) * 20, Math.random() * 40], h: [] });
    let a = 0; ctx.fillStyle = '#07080f'; ctx.fillRect(0, 0, w, h);
    return (dt) => {
      a += dt * .4; ctx.fillStyle = 'rgba(7,8,15,.35)'; ctx.fillRect(0, 0, w, h);
      const ca = Math.cos(a), sa = Math.sin(a); const sc = Math.min(w, h) / 55;
      ctx.lineWidth = 1.2; ctx.globalCompositeOperation = 'lighter';
      for (const q of pts) {
        const p = q.p; for (let s = 0; s < 3; s++) { const dx = 10 * (p[1] - p[0]), dy = p[0] * (28 - p[2]) - p[1], dz = p[0] * p[1] - 8 / 3 * p[2]; p[0] += dx * .004; p[1] += dy * .004; p[2] += dz * .004; }
        const v = Math.hypot(10 * (p[1] - p[0]), p[0] * (28 - p[2]) - p[1]); const t = Math.min(1, v / 150);
        const x = p[0] * ca - p[1] * sa, z = p[2] - 25; q.h.push([w / 2 + x * sc, h / 2 - z * sc]); if (q.h.length > K) q.h.shift();
        ctx.strokeStyle = `rgba(${Math.round(125 + 130 * t)},${Math.round(249 - 157 * t)},${Math.round(255 - 202 * t)},.7)`; ctx.beginPath(); q.h.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    };
  }

  /* ---------- 02 Thomas : nuage de points doré ---------- */
  function thomas(ctx, w, h) {
    const N = 900; const P = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) P[i] = (Math.random() - .5) * 6;
    let a = 0; const b = .208186;
    return (dt) => {
      a += dt * .3; ctx.fillStyle = 'rgba(11,8,6,.25)'; ctx.fillRect(0, 0, w, h); const sc = Math.min(w, h) / 9; const ca = Math.cos(a), sa = Math.sin(a);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < N; i++) {
        let x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
        for (let s = 0; s < 2; s++) { const dx = Math.sin(y) - b * x, dy = Math.sin(z) - b * y, dz = Math.sin(x) - b * z; x += dx * .06; y += dy * .06; z += dz * .06; }
        P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        const rx = x * ca - z * sa, rz = x * sa + z * ca; const d = 1 + rz / 8;
        ctx.fillStyle = i % 3 ? 'rgba(212,175,95,.6)' : 'rgba(232,199,184,.7)'; ctx.fillRect(w / 2 + rx * sc * d, h / 2 + y * sc * d, 1.5, 1.5);
      }
      ctx.globalCompositeOperation = 'source-over';
    };
  }

  /* ---------- 03 Clifford : accumulation vivante basse résolution ---------- */
  function clifford(ctx, w, h) {
    const sw = Math.round(w / 2), sh = Math.round(h / 2); const counts = new Float32Array(sw * sh); const img = ctx.createImageData(sw, sh); const off = document.createElement('canvas'); off.width = sw; off.height = sh; const octx = off.getContext('2d');
    let t = 0;
    return (dt) => {
      t += dt; const a = -1.4 + Math.sin(t * .3) * .3, b = 1.6 + Math.cos(t * .2) * .3, c = 1 + Math.sin(t * .17) * .4, d = .7;
      for (let i = 0; i < counts.length; i++) counts[i] *= .88;
      let x = .1, y = .1; const r = Math.min(sw, sh) * .22;
      for (let i = 0; i < 12000; i++) { const nx = Math.sin(a * y) + c * Math.cos(a * x); y = Math.sin(b * x) + d * Math.cos(b * y); x = nx; const px = (sw / 2 + x * r) | 0, py = (sh / 2 + y * r) | 0; if (px >= 0 && px < sw && py >= 0 && py < sh) counts[py * sw + px] += 1; }
      const D = img.data; for (let i = 0; i < counts.length; i++) { const v = Math.min(1, Math.log(1 + counts[i]) / 2.2); const c = v < .55 ? M.lerpRgb([243, 239, 231], [181, 65, 45], v / .55) : M.lerpRgb([181, 65, 45], [23, 20, 18], (v - .55) / .45); D[i * 4] = c[0]; D[i * 4 + 1] = c[1]; D[i * 4 + 2] = c[2]; D[i * 4 + 3] = 255; }
      octx.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, w, h);
    };
  }

  /* ---------- 04 Champ de vecteurs ---------- */
  function flow(ctx, w, h) {
    const N = 320; const P = new Float32Array(N * 2); for (let i = 0; i < N * 2; i++) P[i] = Math.random() * (i % 2 ? h : w);
    ctx.fillStyle = '#0f1f17'; ctx.fillRect(0, 0, w, h); let t = 0;
    return (dt) => {
      t += dt * .15; ctx.fillStyle = 'rgba(15,31,23,.08)'; ctx.fillRect(0, 0, w, h); ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(159,197,165,.6)'; ctx.beginPath();
      for (let i = 0; i < N; i++) { let x = P[i * 2], y = P[i * 2 + 1]; const ang = vnoise(x * .012 + t, y * .012) * Math.PI * 4; const nx = x + Math.cos(ang) * 1.4, ny = y + Math.sin(ang) * 1.4; ctx.moveTo(x, y); ctx.lineTo(nx, ny); if (nx < 0 || nx > w || ny < 0 || ny > h || Math.random() < .003) { P[i * 2] = Math.random() * w; P[i * 2 + 1] = Math.random() * h; } else { P[i * 2] = nx; P[i * 2 + 1] = ny; } }
      ctx.stroke();
    };
  }

  /* ---------- 05 Fourier : épicycles qui dessinent un cœur ---------- */
  function fourier(ctx, w, h) {
    const N = 120; const pts = []; for (let i = 0; i < N; i++) { const T = i / N * Math.PI * 2; pts.push([16 * Math.sin(T) ** 3 / 17, -(13 * Math.cos(T) - 5 * Math.cos(2 * T) - 2 * Math.cos(3 * T) - Math.cos(4 * T)) / 17]); }
    const cs = []; for (let k = 0; k < N; k++) { let re = 0, im = 0; for (let n = 0; n < N; n++) { const phi = 2 * Math.PI * k * n / N; re += pts[n][0] * Math.cos(phi) + pts[n][1] * Math.sin(phi); im += -pts[n][0] * Math.sin(phi) + pts[n][1] * Math.cos(phi); } cs.push({ amp: Math.hypot(re, im) / N, ph: Math.atan2(im, re), f: k <= N / 2 ? k : k - N }); }
    cs.sort((a, b) => b.amp - a.amp); const TERMS = 18; let t = 0; let trace = [];
    return (dt) => {
      t += dt * .6; if (t > Math.PI * 2) { t = 0; trace = []; }
      ctx.fillStyle = '#f6f1e8'; ctx.fillRect(0, 0, w, h); const sc = Math.min(w, h) * .36; let x = w / 2, y = h / 2 + sc * .1;
      ctx.lineWidth = 1;
      for (let i = 0; i < TERMS; i++) { const c = cs[i]; const px = x, py = y; const r = c.amp * sc; x += r * Math.cos(c.f * t + c.ph); y += r * Math.sin(c.f * t + c.ph); if (r > 1) { ctx.strokeStyle = 'rgba(27,26,25,.18)'; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = 'rgba(168,118,62,.8)'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke(); } }
      trace.push([x, y]); ctx.strokeStyle = '#1b1a19'; ctx.lineWidth = 2; ctx.beginPath(); trace.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      ctx.fillStyle = '#a8763e'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    };
  }

  /* ---------- 06 Gray-Scott sur CPU, petite grille ---------- */
  function grayscott(ctx, w, h) {
    const gw = 96, gh = 60; let U = new Float32Array(gw * gh).fill(1), V = new Float32Array(gw * gh), U2 = new Float32Array(gw * gh), V2 = new Float32Array(gw * gh);
    for (let k = 0; k < 10; k++) { const cx = Math.floor(Math.random() * gw), cy = Math.floor(Math.random() * gh); for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { const i = ((cy + y + gh) % gh) * gw + ((cx + x + gw) % gw); V[i] = .5; } }
    const img = ctx.createImageData(gw, gh); const off = document.createElement('canvas'); off.width = gw; off.height = gh; const octx = off.getContext('2d');
    const f = .0545, k = .062;
    return (dt) => {
      for (let s = 0; s < 8; s++) {
        for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
          const i = y * gw + x; const l = y * gw + ((x + gw - 1) % gw), r = y * gw + ((x + 1) % gw), u = ((y + gh - 1) % gh) * gw + x, d = ((y + 1) % gh) * gw + x;
          const lu = U[l] + U[r] + U[u] + U[d] - 4 * U[i], lv = V[l] + V[r] + V[u] + V[d] - 4 * V[i]; const uvv = U[i] * V[i] * V[i];
          U2[i] = U[i] + (.21 * lu - uvv + f * (1 - U[i])); V2[i] = V[i] + (.105 * lv + uvv - (f + k) * V[i]);
        }
        [U, U2] = [U2, U]; [V, V2] = [V2, V];
      }
      const D = img.data; for (let i = 0; i < gw * gh; i++) { const v = Math.min(1, V[i] * 2.4); D[i * 4] = 11 + (184 - 11) * v; D[i * 4 + 1] = 26 + (242 - 26) * v; D[i * 4 + 2] = 28 + (214 - 28) * v; D[i * 4 + 3] = 255; }
      octx.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, w, h);
    };
  }

  /* ---------- 07 Superformule 2D en morphing ---------- */
  function superformula(ctx, w, h) {
    let t = 0; const sf = (phi, m, n1, n2, n3) => Math.pow(Math.pow(Math.abs(Math.cos(m * phi / 4)), n2) + Math.pow(Math.abs(Math.sin(m * phi / 4)), n3), -1 / n1);
    return (dt) => {
      t += dt; ctx.fillStyle = '#101014'; ctx.fillRect(0, 0, w, h);
      const m = 3 + 5 * (0.5 + 0.5 * Math.sin(t * .35)), n1 = .3 + 1.2 * (0.5 + 0.5 * Math.cos(t * .27)), n2 = .3 + 2.5 * (0.5 + 0.5 * Math.sin(t * .41 + 1)), n3 = .3 + 2.5 * (0.5 + 0.5 * Math.cos(t * .23 + 2));
      let mx = 0; const pts = []; for (let i = 0; i <= 240; i++) { const phi = i / 240 * Math.PI * 2; const r = sf(phi, m, n1, n2, n3); mx = Math.max(mx, r); pts.push([phi, r]); }
      const R = Math.min(w, h) * .4 / (mx || 1);
      for (let k = 6; k >= 1; k--) { ctx.beginPath(); pts.forEach(([phi, r], i) => { const rr = r * R * k / 6; const x = w / 2 + rr * Math.cos(phi + t * .2), y = h / 2 + rr * Math.sin(phi + t * .2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.strokeStyle = k === 6 ? '#e8d5b5' : `rgba(139,124,246,${.2 + k / 8})`; ctx.lineWidth = k === 6 ? 1.8 : 1; ctx.stroke(); }
    };
  }

  /* ---------- 08 Julia sur CPU, basse résolution ---------- */
  function julia(ctx, w, h) {
    const gw = 128, gh = 80; const img = ctx.createImageData(gw, gh); const off = document.createElement('canvas'); off.width = gw; off.height = gh; const octx = off.getContext('2d');
    let th = 2.45; const IT = 48;
    const pal = (t) => [Math.round(255 * (.41 + .38 * Math.cos(6.283 * (.62 * t + .38)))), Math.round(255 * (.49 + .51 * Math.cos(6.283 * (.83 * t + .17)))), Math.round(255 * (.56 + .44 * Math.cos(6.283 * (1.74 * t + .88))))];
    return (dt) => {
      th += dt * .06; const cx = .7885 * Math.cos(th), cy = .7885 * Math.sin(th); const D = img.data;
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
        let zx = (x / gw - .5) * 3.2, zy = (y / gh - .5) * 2; let n = 0;
        while (n < IT && zx * zx + zy * zy < 16) { const nx = zx * zx - zy * zy + cx; zy = 2 * zx * zy + cy; zx = nx; n++; }
        const i = (y * gw + x) * 4; if (n >= IT) { D[i] = 217; D[i + 1] = 242; D[i + 2] = 153; } else { const t = Math.sqrt(n / IT); const c = pal(t); const s = Math.min(1, t / .3); D[i] = c[0] * s; D[i + 1] = c[1] * s; D[i + 2] = c[2] * s; } D[i + 3] = 255;
      }
      octx.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, w, h);
    };
  }

  /* ---------- 09 Boids ---------- */
  function boids(ctx, w, h) {
    const N = 70; const B = []; for (let i = 0; i < N; i++) B.push({ x: Math.random() * w, y: Math.random() * h, vx: Math.random() - .5, vy: Math.random() - .5 });
    return (dt) => {
      ctx.fillStyle = '#f4f6fb'; ctx.fillRect(0, 0, w, h);
      for (const b of B) {
        let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
        for (const o of B) { if (o === b) continue; const dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy; if (d2 < 2500) { n++; ax += o.vx; ay += o.vy; cx += o.x; cy += o.y; if (d2 < 400) { sx -= dx / (d2 + 1) * 20; sy -= dy / (d2 + 1) * 20; } } }
        if (n) { b.vx += (ax / n - b.vx) * .05 + (cx / n - b.x) * .002 + sx * .02; b.vy += (ay / n - b.vy) * .05 + (cy / n - b.y) * .002 + sy * .02; }
        b.vx += ((w / 2 - b.x) * .0004); b.vy += ((h / 2 - b.y) * .0004);
        const sp = Math.hypot(b.vx, b.vy) || 1; const max = 2.2; if (sp > max) { b.vx = b.vx / sp * max; b.vy = b.vy / sp * max; }
        b.x += b.vx; b.y += b.vy; if (b.x < 0) b.x += w; if (b.x > w) b.x -= w; if (b.y < 0) b.y += h; if (b.y > h) b.y -= h;
        const a = Math.atan2(b.vy, b.vx); ctx.fillStyle = '#1c2340'; ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * 6, b.y + Math.sin(a) * 6); ctx.lineTo(b.x + Math.cos(a + 2.5) * 4, b.y + Math.sin(a + 2.5) * 4); ctx.lineTo(b.x + Math.cos(a - 2.5) * 4, b.y + Math.sin(a - 2.5) * 4); ctx.closePath(); ctx.fill();
      }
    };
  }

  /* ---------- 10 Jeu de la vie ---------- */
  function life(ctx, w, h) {
    const gw = 64, gh = 40; let G = new Uint8Array(gw * gh), G2 = new Uint8Array(gw * gh); for (let i = 0; i < G.length; i++) G[i] = Math.random() < .3 ? 1 : 0;
    let acc = 0; const age = new Float32Array(gw * gh);
    return (dt) => {
      acc += dt; if (acc > .12) { acc = 0; for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx || dy) n += G[((y + dy + gh) % gh) * gw + ((x + dx + gw) % gw)]; } const i = y * gw + x; G2[i] = (G[i] && (n === 2 || n === 3)) || (!G[i] && n === 3) ? 1 : 0; } [G, G2] = [G2, G]; if (Math.random() < .05) { const i = Math.floor(Math.random() * G.length); G[i] = 1; } }
      ctx.fillStyle = '#0e0f12'; ctx.fillRect(0, 0, w, h); const cw = w / gw, ch = h / gh;
      for (let i = 0; i < G.length; i++) { age[i] = G[i] ? Math.min(1, age[i] + dt * 3) : Math.max(0, age[i] - dt * 2); if (age[i] > 0) { const x = (i % gw) * cw, y = Math.floor(i / gw) * ch; ctx.fillStyle = `rgba(255,204,0,${age[i]})`; ctx.beginPath(); ctx.roundRect(x + 1, y + 1, cw - 2, ch - 2, 2); ctx.fill(); } }
    };
  }

  /* ---------- Hero : rubans de Lorenz en 2D, rotation liée au scroll ---------- */
  const wrap = document.getElementById('hero-canvas'); const canvas = wrap.querySelector('canvas'); const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) M.fallback(wrap.closest('.hero'));
  else {
    let w = 0, h = 0; M.fit(canvas, (cw, ch) => { w = cw; h = ch; ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, w, h); }, Math.min(M.dpr, 1.5));
    const N = M.mobile ? 160 : 360, K = 16; const pts = []; for (let i = 0; i < N; i++) pts.push({ p: [(Math.random() - .5) * 30, (Math.random() - .5) * 30, Math.random() * 45], h: [] });
    const ptr = M.pointer(); let ang = 0, sc = 0; addEventListener('scroll', () => { sc = scrollY * .0015; }, { passive: true });
    const frame = (t, dt) => {
      if (!w) return; ptr.update(); ang += dt * .15;
      ctx.fillStyle = 'rgba(10,10,12,.3)'; ctx.fillRect(0, 0, w, h);
      const A = ang + sc + ptr.x * .4, ca = Math.cos(A), sa = Math.sin(A), tilt = 1.1 + ptr.y * .2, ct = Math.cos(tilt), st = Math.sin(tilt);
      const scale = Math.min(w, h) / (M.mobile ? 62 : 52); const cx = w * (M.mobile ? .5 : .72), cy = h * .5;
      ctx.lineWidth = .8 * Math.min(M.dpr, 1.5); ctx.globalCompositeOperation = 'lighter';
      for (const q of pts) {
        const p = q.p; for (let s = 0; s < 2; s++) { const dx = 10 * (p[1] - p[0]), dy = p[0] * (28 - p[2]) - p[1], dz = p[0] * p[1] - 8 / 3 * p[2]; p[0] += dx * .0045; p[1] += dy * .0045; p[2] += dz * .0045; }
        const v = Math.hypot(10 * (p[1] - p[0]), p[0] * (28 - p[2]) - p[1], p[0] * p[1] - 8 / 3 * p[2]); const tt = Math.min(1, v / 160);
        const x = p[0] * ca - p[1] * sa, yy = p[0] * sa + p[1] * ca, z = p[2] - 25; const y2 = yy * st + z * ct; const depth = 1 + (yy * ct - z * st) / 90;
        q.h.push([cx + x * scale * depth, cy - y2 * scale * depth]); if (q.h.length > K) q.h.shift();
        ctx.strokeStyle = `rgba(${Math.round(143 + 112 * tt)},${Math.round(211 - 89 * tt)},${Math.round(255 - 186 * tt)},${.12 + tt * .3})`;
        ctx.beginPath(); q.h.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    if (M.reduced) { for (let i = 0; i < 120; i++) frame(0, 1 / 60); } else M.loop(canvas, frame);
  }
})();
