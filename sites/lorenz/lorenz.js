import * as THREE from 'three';

const M = window.MOTION;
const P = { sigma: 10, rho: 28, beta: 8 / 3 };

/* ---------- Intégrateur commun ---------- */
function lorenz(p, s, dt) {
  const dx = s.sigma * (p[1] - p[0]);
  const dy = p[0] * (s.rho - p[2]) - p[1];
  const dz = p[0] * p[1] - s.beta * p[2];
  p[0] += dx * dt; p[1] += dy * dt; p[2] += dz * dt;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/* ---------- Rendu 2D (panneau formule + vignettes) ---------- */
function draw2D(canvas, s, c1, c2, steps = 9000, animate = false) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-2').trim() || '#0e1019';
  ctx.fillRect(0, 0, w, h);
  const p = [0.1, 0, 0]; const dt = 0.006;
  for (let i = 0; i < 300; i++) lorenz(p, s, dt);
  const scale = Math.min(w, h) / 58;
  const cx = w / 2, cy = h * 0.56;
  ctx.lineWidth = Math.max(1, w / 700); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
  let px = cx + p[0] * scale, py = cy + (p[2] - 25) * scale * -1;
  for (let i = 0; i < steps; i++) {
    const v = lorenz(p, s, dt);
    const t = Math.min(1, v / 120);
    const x = cx + p[0] * scale, y = cy - (p[2] - 25) * scale;
    ctx.strokeStyle = mix(c1, c2, t, 0.28 + t * 0.5);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    px = x; py = y;
    if (!isFinite(x)) break;
  }
  ctx.globalCompositeOperation = 'source-over';
}
function hex(c) { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
function mix(a, b, t, alpha) { const A = hex(a), B = hex(b); return `rgba(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')},${alpha})`; }

/* ---------- Panneau de paramètres ---------- */
const fc = document.getElementById('formula-canvas');
const redraw2D = () => fc && draw2D(fc, P, '#7df9ff', '#ff5c35');
const panel = document.getElementById('params');
if (panel) {
  const state = M.params(panel, [
    { key: 'sigma', label: 'σ — vitesse de couplage', min: 2, max: 20, step: 0.1, value: P.sigma },
    { key: 'rho', label: 'ρ — énergie injectée', min: 5, max: 60, step: 0.5, value: P.rho },
    { key: 'beta', label: 'β — amortissement', min: 0.5, max: 6, step: 0.05, value: P.beta },
  ], (s) => { P.sigma = s.sigma; P.rho = s.rho; P.beta = s.beta; redraw2D(); });
  const actions = document.createElement('div'); actions.className = 'params__actions';
  [['Classique', 10, 28, 2.667], ['Calme', 10, 14, 2.667], ['Torsadé', 14, 45, 4], ['Déchaîné', 18, 60, 1.2]].forEach(([n, a, b, c]) => {
    const btn = document.createElement('button'); btn.className = 'chip'; btn.type = 'button'; btn.textContent = n;
    btn.addEventListener('click', () => { actions.querySelectorAll('.chip').forEach(x => x.classList.remove('is-active')); btn.classList.add('is-active'); state.set({ sigma: a, rho: b, beta: c }); });
    actions.appendChild(btn);
  });
  panel.appendChild(actions);
}
redraw2D();

/* ---------- Vignettes de la galerie ---------- */
document.querySelectorAll('[data-lorenz]').forEach(tile => {
  const [a, b, c, c1, c2] = tile.dataset.lorenz.split(',');
  const canvas = tile.querySelector('canvas');
  M.lazyTile(tile, (w, h) => { canvas.width = Math.round(w * 1.5) || 400; canvas.height = Math.round(h * 1.5) || 400; draw2D(canvas, { sigma: +a, rho: +b, beta: +c }, c1, c2, 7000); });
});

/* ---------- Hero Three.js ---------- */
setTimeout(() => {

const wrap = document.getElementById('hero-canvas');
const canvas = wrap.querySelector('canvas');
if (!M.hasWebGL()) { M.fallback(wrap.closest('.hero')); }
else {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { M.fallback(wrap.closest('.hero')); }
  if (renderer) {
    renderer.setPixelRatio(M.dpr);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
    camera.position.set(0, 0, 92);
    const group = new THREE.Group(); scene.add(group);

    const N = M.mobile ? 900 : 2600, K = 18;
    const pos = new Float32Array(N * 3); const vel = new Float32Array(N);
    const hist = new Float32Array(N * K * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - .5) * 30; pos[i * 3 + 1] = (Math.random() - .5) * 30; pos[i * 3 + 2] = Math.random() * 40 + 5;
      for (let k = 0; k < K; k++) { hist.set(pos.subarray(i * 3, i * 3 + 3), (i * K + k) * 3); }
    }
    const cA = new THREE.Color('#7df9ff'), cB = new THREE.Color('#ff5c35'), tmp = new THREE.Color();

    // Traînées : LineSegments
    const segCount = N * (K - 1);
    const linePos = new Float32Array(segCount * 2 * 3), lineCol = new Float32Array(segCount * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3).setUsage(THREE.DynamicDrawUsage));
    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false });
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    // Têtes : Points avec sprite doux
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    const ptCol = new Float32Array(N * 3);
    ptGeo.setAttribute('color', new THREE.BufferAttribute(ptCol, 3).setUsage(THREE.DynamicDrawUsage));
    const ptMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      uniforms: { uSize: { value: 2.2 * M.dpr } },
      vertexShader: `varying vec3 vC; uniform float uSize; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = uSize * (160.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); if(d > .5) discard; float a = smoothstep(.5, .05, d); gl_FragColor = vec4(vC, a); }`,
    });
    group.add(new THREE.Points(ptGeo, ptMat));

    const resize = () => { const r = wrap.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); camera.position.z = r.width < 760 ? 130 : 100; };
    resize(); addEventListener('resize', resize);

    const ptr = M.pointer();
    const p = [0, 0, 0];
    let head = 0; let scrollRot = 0; let autoRot = 0;
    addEventListener('scroll', () => { scrollRot = scrollY * 0.0012; }, { passive: true });

    const step = (t, dt) => {
      ptr.update();
      const sub = M.reduced ? 0 : 2;
      const h = 0.0045;
      for (let s = 0; s < sub; s++) {
        head = (head + 1) % K;
        for (let i = 0; i < N; i++) {
          p[0] = pos[i * 3]; p[1] = pos[i * 3 + 1]; p[2] = pos[i * 3 + 2];
          const v = lorenz(p, P, h);
          if (!isFinite(p[0]) || Math.abs(p[0]) > 400) { p[0] = (Math.random() - .5) * 2; p[1] = (Math.random() - .5) * 2; p[2] = 20; }
          pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2]; vel[i] = v;
          hist.set(p, (i * K + head) * 3);
        }
      }
      // Couleurs + segments
      for (let i = 0; i < N; i++) {
        const tt = Math.min(1, vel[i] / 140);
        tmp.copy(cA).lerp(cB, tt);
        ptCol[i * 3] = tmp.r; ptCol[i * 3 + 1] = tmp.g; ptCol[i * 3 + 2] = tmp.b;
        for (let k = 0; k < K - 1; k++) {
          const a = (head - k + K) % K, b = (head - k - 1 + K) % K;
          const si = (i * (K - 1) + k) * 6;
          const fade = 1 - k / (K - 1);
          linePos[si] = hist[(i * K + a) * 3]; linePos[si + 1] = hist[(i * K + a) * 3 + 1]; linePos[si + 2] = hist[(i * K + a) * 3 + 2];
          linePos[si + 3] = hist[(i * K + b) * 3]; linePos[si + 4] = hist[(i * K + b) * 3 + 1]; linePos[si + 5] = hist[(i * K + b) * 3 + 2];
          const f = fade * fade * .9;
          lineCol[si] = tmp.r * f; lineCol[si + 1] = tmp.g * f; lineCol[si + 2] = tmp.b * f;
          lineCol[si + 3] = tmp.r * f * .8; lineCol[si + 4] = tmp.g * f * .8; lineCol[si + 5] = tmp.b * f * .8;
        }
      }
      lineGeo.attributes.position.needsUpdate = true; lineGeo.attributes.color.needsUpdate = true;
      ptGeo.attributes.position.needsUpdate = true; ptGeo.attributes.color.needsUpdate = true;
      autoRot += dt * 0.12;
      group.rotation.y = autoRot + scrollRot + ptr.x * 0.25;
      group.rotation.x = -0.35 + ptr.y * 0.18 + scrollRot * 0.4;
      group.position.set(innerWidth > 760 ? 22 : 0, -26, 0);
      renderer.render(scene, camera);
    };
    M.loop(canvas, step);
  }
}

}, 320);
