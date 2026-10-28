import * as THREE from 'three';
const M = window.MOTION;

/* ---------- Les trois attracteurs (normalisés dans un rayon ≈ 1) ---------- */
const SYSTEMS = {
  aizawa: {
    name: 'Aizawa', dt: 0.01, scale: 0.6, speedRef: 4.5,
    f(p, o) { const a = .95, b = .7, c = .6, d = 3.5, e = .25, f = .1; const [x, y, z] = p;
      o[0] = (z - b) * x - d * y; o[1] = d * x + (z - b) * y; o[2] = c + a * z - z * z * z / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x; },
    seed: () => [(Math.random() - .5) * 2, (Math.random() - .5) * 2, Math.random() * 1.5],
    text: 'Aizawa\ndx/dt = (z − b)·x − d·y\ndy/dt = d·x + (z − b)·y\ndz/dt = c + a·z − z³/3 − (x² + y²)(1 + e·z) + f·z·x³',
  },
  thomas: {
    name: 'Thomas', dt: 0.05, scale: 0.26, speedRef: 1.2,
    f(p, o) { const b = .208186; o[0] = Math.sin(p[1]) - b * p[0]; o[1] = Math.sin(p[2]) - b * p[1]; o[2] = Math.sin(p[0]) - b * p[2]; },
    seed: () => [(Math.random() - .5) * 4, (Math.random() - .5) * 4, (Math.random() - .5) * 4],
    text: 'Thomas\ndx/dt = sin(y) − b·x\ndy/dt = sin(z) − b·y\ndz/dt = sin(x) − b·z',
  },
  halvorsen: {
    name: 'Halvorsen', dt: 0.004, scale: 0.1, speedRef: 60,
    f(p, o) { const a = 1.89; const [x, y, z] = p; o[0] = -a * x - 4 * y - 4 * z - y * y; o[1] = -a * y - 4 * z - 4 * x - z * z; o[2] = -a * z - 4 * x - 4 * y - x * x; },
    seed: () => [(Math.random() - .5) * 2 - 1, (Math.random() - .5) * 2, (Math.random() - .5) * 2 + 1],
    text: 'Halvorsen\ndx/dt = −a·x − 4y − 4z − y²\ndy/dt = −a·y − 4z − 4x − z²\ndz/dt = −a·z − 4x − 4y − x²',
  },
};
const S = { speed: 1, halo: 1, density: 1 };
let current = 'aizawa';

/* ---------- Rendu 2D : projection accumulée en densité (vignettes + cartes parfums) ---------- */
function draw2D(canvas, key, c1, c2, iters = 60000) {
  const sys = SYSTEMS[key]; const w = canvas.width, h = canvas.height;
  const counts = new Float32Array(w * h);
  const p = sys.seed(), o = [0, 0, 0]; const r = Math.min(w, h) * .42; const cx = w / 2, cy = h / 2;
  const ang = 0.9, ca = Math.cos(ang), sa = Math.sin(ang);
  const off = key === 'aizawa' ? 0.55 : 0;
  for (let i = 0; i < iters; i++) {
    sys.f(p, o); p[0] += o[0] * sys.dt; p[1] += o[1] * sys.dt; p[2] += o[2] * sys.dt;
    if (i < 800) continue;
    const x = p[0] * sys.scale, y = p[1] * sys.scale, z = (p[2] - off) * sys.scale;
    const yy = y * ca - z * sa;
    const px = (cx + x * r) | 0, py = (cy - yy * r) | 0;
    if (px >= 0 && px < w && py >= 0 && py < h) counts[py * w + px] += 1;
  }
  const bg = [20, 16, 8], A = M.hexToRgb(c1), B = M.hexToRgb(c2);
  M.densityToCanvas(canvas, counts, w, h, (t, i) => {
    const x = i % w, y = (i / w) | 0; const v = 1 - Math.hypot(x - cx, y - cy) / (Math.max(w, h) * .8);
    const base = [bg[0] + 18 * v, bg[1] + 14 * v, bg[2] + 8 * v];
    if (t <= 0) return base;
    const c = t < .5 ? M.lerpRgb(base, A, t * 2) : M.lerpRgb(A, B, (t - .5) * 2);
    return c;
  });
}
const renderTile = (el, key, c1, c2) => M.lazyTile(el, (w, h) => { const c = el.querySelector('canvas'); c.width = Math.round(w) || 400; c.height = Math.round(h) || 400; draw2D(c, key, c1, c2); });
document.querySelectorAll('[data-art]').forEach(t => { const [k, c1, c2] = t.dataset.art.split(','); renderTile(t, k, c1, c2); });
document.querySelectorAll('.parfum').forEach(t => renderTile(t, t.dataset.attractor, '#d4af5f', '#e8c7b8'));

/* ---------- Switcher ---------- */
function select(key) {
  if (!SYSTEMS[key]) return;
  current = key;
  document.querySelectorAll('[data-attractor]').forEach(el => el.classList.toggle('is-active', el.dataset.attractor === key));
  const ft = document.getElementById('formula-text'); if (ft) ft.textContent = SYSTEMS[key].text;
  if (hero) hero.morphTo(key);
}
document.querySelectorAll('.switcher [data-attractor]').forEach(b => b.addEventListener('click', () => select(b.dataset.attractor)));
document.querySelectorAll('.parfum').forEach(b => { b.addEventListener('click', () => select(b.dataset.attractor)); b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(b.dataset.attractor); } }); });

/* ---------- Paramètres ---------- */
const panel = document.getElementById('params');
if (panel) M.params(panel, [
  { key: 'speed', label: 'Vitesse d\'intégration', min: 0.2, max: 3, step: 0.05, value: 1 },
  { key: 'halo', label: 'Taille du halo', min: 0.3, max: 3, step: 0.05, value: 1 },
  { key: 'density', label: 'Densité des points', min: 0.2, max: 1, step: 0.05, value: 1 },
], s => Object.assign(S, s));

/* ---------- Hero Three.js ---------- */
let hero = null;
setTimeout(() => {

const wrap = document.getElementById('hero-canvas'); const canvas = wrap.querySelector('canvas');
if (!M.hasWebGL()) M.fallback(wrap.closest('.hero'));
else {
  let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false }); } catch (e) { M.fallback(wrap.closest('.hero')); }
  if (renderer) {
    renderer.setPixelRatio(M.dpr);
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(38, 1, .1, 50); camera.position.z = 4.2;
    const group = new THREE.Group(); scene.add(group);
    const N = M.mobile ? 7000 : 20000;
    const live = new Float32Array(N * 3), from = new Float32Array(N * 3), shown = new Float32Array(N * 3), speed = new Float32Array(N);
    let sys = SYSTEMS[current]; let morph = 1;
    const seedAll = (s) => { for (let i = 0; i < N; i++) { const q = s.seed(); live[i * 3] = q[0]; live[i * 3 + 1] = q[1]; live[i * 3 + 2] = q[2]; } };
    seedAll(sys);
    const o = [0, 0, 0], p = [0, 0, 0];
    // Pré-chauffe pour que les points soient déjà sur l'attracteur
    const warm = (s, steps) => { for (let i = 0; i < N; i++) { p[0] = live[i * 3]; p[1] = live[i * 3 + 1]; p[2] = live[i * 3 + 2]; for (let k = 0; k < steps; k++) { s.f(p, o); p[0] += o[0] * s.dt; p[1] += o[1] * s.dt; p[2] += o[2] * s.dt; } live[i * 3] = p[0]; live[i * 3 + 1] = p[1]; live[i * 3 + 2] = p[2]; } };
    warm(sys, 1200);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(shown, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1).setUsage(THREE.DynamicDrawUsage));
    const mk = (size, alpha, soft) => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uSize: { value: size * M.dpr }, uAlpha: { value: alpha }, uSoft: { value: soft }, uA: { value: new THREE.Color('#d4af5f') }, uB: { value: new THREE.Color('#e8c7b8') }, uC: { value: new THREE.Color('#5b3a8a') }, uDensity: { value: 1 } },
      vertexShader: `attribute float aSpeed; varying float vS; varying float vHide; uniform float uSize; uniform float uDensity; void main(){ vS = aSpeed; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = uSize * (3.2 / -mv.z); gl_Position = projectionMatrix * mv; vHide = step(uDensity, fract(sin(float(gl_VertexID)*12.9898)*43758.5453)); }`,
      fragmentShader: `varying float vS; varying float vHide; uniform float uAlpha; uniform float uSoft; uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; void main(){ if(vHide > .5) discard; float d = length(gl_PointCoord - .5); if(d > .5) discard; float a = pow(smoothstep(.5, 0., d), uSoft) * uAlpha; vec3 c = mix(uC, uA, smoothstep(0., .5, vS)); c = mix(c, uB, smoothstep(.5, 1., vS)); gl_FragColor = vec4(c, a); }`,
    });
    const matHalo = mk(10, .09, 1.2), matCore = mk(2.8, .85, .5);
    group.add(new THREE.Points(geo, matHalo)); group.add(new THREE.Points(geo, matCore));
    const resize = () => { const r = wrap.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); camera.position.z = r.width < 760 ? 5.6 : 4.2; };
    resize(); addEventListener('resize', resize);
    const ptr = M.pointer(); let rot = 0; let scrollRot = 0;
    addEventListener('scroll', () => { scrollRot = scrollY * 0.001; }, { passive: true });
    hero = {
      morphTo(key) { from.set(shown); sys = SYSTEMS[key]; seedAll(sys); warm(sys, 1200); morph = 0; },
    };
    M.loop(canvas, (t, dt) => {
      ptr.update();
      const steps = M.reduced ? 0 : 1; const h = sys.dt * S.speed;
      for (let i = 0; i < N; i++) {
        p[0] = live[i * 3]; p[1] = live[i * 3 + 1]; p[2] = live[i * 3 + 2];
        for (let k = 0; k < steps; k++) { sys.f(p, o); p[0] += o[0] * h; p[1] += o[1] * h; p[2] += o[2] * h; }
        if (!isFinite(p[0]) || Math.abs(p[0]) > 1e3) { const q = sys.seed(); p[0] = q[0]; p[1] = q[1]; p[2] = q[2]; }
        live[i * 3] = p[0]; live[i * 3 + 1] = p[1]; live[i * 3 + 2] = p[2];
        sys.f(p, o); speed[i] = Math.min(1, Math.hypot(o[0], o[1], o[2]) / sys.speedRef);
        const off = sys === SYSTEMS.aizawa ? 0.55 : 0;
        const tx = p[0] * sys.scale, ty = p[1] * sys.scale, tz = (p[2] - off) * sys.scale;
        if (morph >= 1) { shown[i * 3] = tx; shown[i * 3 + 1] = ty; shown[i * 3 + 2] = tz; }
        else { const e = morph * morph * (3 - 2 * morph); shown[i * 3] = from[i * 3] + (tx - from[i * 3]) * e; shown[i * 3 + 1] = from[i * 3 + 1] + (ty - from[i * 3 + 1]) * e; shown[i * 3 + 2] = from[i * 3 + 2] + (tz - from[i * 3 + 2]) * e; }
      }
      if (morph < 1) morph = Math.min(1, morph + dt / 1.8);
      geo.attributes.position.needsUpdate = true; geo.attributes.aSpeed.needsUpdate = true;
      matHalo.uniforms.uSize.value = 9 * M.dpr * S.halo; matCore.uniforms.uSize.value = 2.4 * M.dpr * Math.sqrt(S.halo);
      matHalo.uniforms.uDensity.value = matCore.uniforms.uDensity.value = S.density;
      rot += dt * 0.15;
      group.rotation.y = rot + scrollRot + ptr.x * .3; group.rotation.x = -0.5 + ptr.y * .2;
      group.position.y = 0.15;
      renderer.render(scene, camera);
    });
  }
}

}, 320);
