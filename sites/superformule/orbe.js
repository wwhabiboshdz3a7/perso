import * as THREE from 'three';
const M = window.MOTION;

/* ---------- Superformule de Gielis ---------- */
function sf(phi, p) {
  const t1 = Math.pow(Math.abs(Math.cos(p.m * phi / 4) / p.a), p.n2);
  const t2 = Math.pow(Math.abs(Math.sin(p.m * phi / 4) / p.b), p.n3);
  const r = Math.pow(t1 + t2, -1 / p.n1);
  return isFinite(r) ? r : 0;
}
const PRESETS = [
  { name: 'Orbe', m: 6, a: 1, b: 1, n1: 3, n2: 1.6, n3: 1.6, m2: 4, n12: 3, n22: 1.6, n32: 1.6 },
  { name: 'Étoile', m: 5, a: 1, b: 1, n1: 1, n2: 1.7, n3: 1.7, m2: 5, n12: 0.5, n22: 1.7, n32: 1.7 },
  { name: 'Corolle', m: 8, a: 1, b: 1, n1: 2, n2: 4, n3: 4, m2: 6, n12: 1, n22: 1, n32: 1 },
  { name: 'Galet', m: 2, a: 1, b: 1, n1: 2, n2: 1.2, n3: 1.6, m2: 3, n12: 1.5, n22: 1, n32: 1.3 },
];

/* ---------- Tracés 2D (SVG) ---------- */
function path2D(p, R = 100, n = 360) {
  let d = ''; for (let i = 0; i <= n; i++) { const phi = (i / n) * Math.PI * 2; const r = sf(phi, p) * R; d += (i ? 'L' : 'M') + (r * Math.cos(phi)).toFixed(1) + ' ' + (r * Math.sin(phi)).toFixed(1); }
  return d + 'Z';
}
const normR = (p) => { let mx = 0; for (let i = 0; i < 360; i++) mx = Math.max(mx, sf(i / 360 * Math.PI * 2, p)); return mx || 1; };
document.querySelectorAll('svg[data-sf]').forEach(svg => {
  const [m, a, b, n1, n2, n3] = svg.dataset.sf.split(',').map(Number); const p = { m, a, b, n1, n2, n3 }; const R = 90 / normR(p);
  svg.innerHTML = `<path d="${path2D(p, R)}" fill="none" stroke="#e8d5b5" stroke-width="1.5"/><path d="${path2D(p, R * .62)}" fill="none" stroke="#8b7cf6" stroke-width="1" opacity=".8"/><path d="${path2D(p, R * .3)}" fill="#e8d5b5" opacity=".9"/>`;
});
document.querySelectorAll('.tile[data-art]').forEach(tile => {
  const [m, a, b, n1, n2, n3, col] = tile.dataset.art.split(','); const p = { m: +m, a: +a, b: +b, n1: +n1, n2: +n2, n3: +n3 }; const R = 88 / normR(p);
  let layers = ''; for (let i = 6; i >= 1; i--) layers += `<path d="${path2D(p, R * i / 6)}" fill="none" stroke="${col}" stroke-width="${i === 6 ? 1.6 : .7}" opacity="${.25 + i / 8}"/>`;
  tile.insertAdjacentHTML('afterbegin', `<svg viewBox="-110 -110 220 220" aria-hidden="true"><rect x="-110" y="-110" width="220" height="220" fill="#17171d"/>${layers}</svg>`);
});

/* ---------- Panneau 2D ---------- */
const fc = document.getElementById('formula-canvas'); const panel = document.getElementById('params');
const P2 = { m: 6, n1: 3, n2: 1.6, n3: 1.6, a: 1, b: 1 };
function draw2D() {
  if (!fc) return; const r = fc.getBoundingClientRect(); fc.width = Math.round(r.width) || 500; fc.height = Math.round(r.height) || 500;
  const ctx = fc.getContext('2d'); if (!ctx) return; const w = fc.width, h = fc.height; ctx.fillStyle = '#17171d'; ctx.fillRect(0, 0, w, h);
  const R = Math.min(w, h) * 0.42 / normR(P2);
  for (let k = 8; k >= 1; k--) {
    ctx.beginPath();
    for (let i = 0; i <= 480; i++) { const phi = i / 480 * Math.PI * 2; const rr = sf(phi, P2) * R * k / 8; const x = w / 2 + rr * Math.cos(phi), y = h / 2 + rr * Math.sin(phi); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.strokeStyle = k === 8 ? '#e8d5b5' : `rgba(139,124,246,${.25 + k / 10})`; ctx.lineWidth = k === 8 ? 2 : 1; ctx.stroke();
  }
}
let hero3D = null;
if (panel) {
  const state = M.params(panel, [
    { key: 'm', label: 'm — nombre de lobes', min: 0, max: 20, step: 1, value: 6 },
    { key: 'n1', label: 'n₁ — rondeur', min: 0.1, max: 10, step: 0.1, value: 3 },
    { key: 'n2', label: 'n₂ — pointes (cos)', min: 0.1, max: 20, step: 0.1, value: 1.6 },
    { key: 'n3', label: 'n₃ — pointes (sin)', min: 0.1, max: 20, step: 0.1, value: 1.6 },
  ], s => { Object.assign(P2, s); draw2D(); if (hero3D) hero3D.custom(P2); });
  const actions = document.createElement('div'); actions.className = 'params__actions';
  PRESETS.forEach((pr, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (i ? '' : ' is-active'); b.textContent = pr.name; b.addEventListener('click', () => { actions.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active')); b.classList.add('is-active'); state.set({ m: pr.m, n1: pr.n1, n2: pr.n2, n3: pr.n3 }); }); actions.appendChild(b); });
  panel.appendChild(actions);
  M.lazyTile(fc, draw2D);
}

/* ---------- Hero 3D ---------- */
const wrap = document.getElementById('hero-canvas'); const canvas = wrap.querySelector('canvas');
if (!M.hasWebGL()) M.fallback(wrap.closest('.hero'));
else {
  let renderer; try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { M.fallback(wrap.closest('.hero')); }
  if (renderer) {
    renderer.setPixelRatio(M.dpr); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100); camera.position.set(0, 0, 7);

    // Environnement procédural : une "salle" de panneaux lumineux, convertie en carte d'environnement PMREM.
    const envScene = new THREE.Scene();
    const panelMat = (c, i) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.BackSide });
    envScene.add(new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), panelMat('#2a2630', 1)));
    const lightPanel = (w, h, c, i, pos, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide })); m.position.set(...pos); m.rotation.set(...rot); envScene.add(m); };
    lightPanel(8, 3, '#fff1d6', 6, [0, 7, 0], [Math.PI / 2, 0, 0]);
    lightPanel(3, 8, '#e8d5b5', 3, [-8, 0, 2], [0, Math.PI / 2, 0]);
    lightPanel(3, 6, '#8b7cf6', 4, [8, 1, -2], [0, -Math.PI / 2, 0]);
    lightPanel(10, 2, '#ffffff', 2, [0, -7, 0], [-Math.PI / 2, 0, 0]);
    const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromScene(envScene, 0.04).texture; scene.environment = envMap;

    // Géométrie paramétrique : grille θ×φ recalculée à chaque image (morphing).
    const SEG = M.mobile ? 72 : 120; const SEGV = Math.round(SEG / 2);
    const count = (SEG + 1) * (SEGV + 1);
    const positions = new Float32Array(count * 3); const idx = [];
    for (let i = 0; i < SEGV; i++) for (let j = 0; j < SEG; j++) { const a = i * (SEG + 1) + j, b = a + SEG + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)); geo.setIndex(idx);
    const mat = new THREE.MeshPhysicalMaterial({ color: '#e8d5b5', metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.2 });
    const mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
    scene.add(new THREE.AmbientLight('#ffffff', 0.15));
    const key = new THREE.DirectionalLight('#fff4e0', 1.4); key.position.set(3, 5, 4); scene.add(key);
    const rim = new THREE.DirectionalLight('#8b7cf6', 2); rim.position.set(-4, -2, -3); scene.add(rim);

    // Courbe de Lissajous 3D autour du bijou (la "chaîne").
    class Lissajous extends THREE.Curve { getPoint(t, o = new THREE.Vector3()) { const T = t * Math.PI * 2; return o.set(2.0 * Math.sin(3 * T + .4), 2.0 * Math.sin(2 * T), 2.0 * Math.sin(5 * T + 1.1)); } }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new Lissajous(), 600, 0.018, 8, true), new THREE.MeshPhysicalMaterial({ color: '#f1ece3', metalness: 1, roughness: 0.3 }));
    scene.add(tube);

    const cur = { ...PRESETS[0] }, from = { ...PRESETS[0] }; let target = PRESETS[0]; let morph = 1;
    const keys = ['m', 'a', 'b', 'n1', 'n2', 'n3', 'm2', 'n12', 'n22', 'n32'];
    const p1 = {}, p2 = {};
    const rebuild = () => {
      Object.assign(p1, { m: cur.m, a: cur.a, b: cur.b, n1: cur.n1, n2: cur.n2, n3: cur.n3 });
      Object.assign(p2, { m: cur.m2, a: cur.a, b: cur.b, n1: cur.n12, n2: cur.n22, n3: cur.n32 });
      let k = 0; let maxR = 0;
      for (let i = 0; i <= SEGV; i++) {
        const phi = -Math.PI / 2 + (i / SEGV) * Math.PI; const r2 = sf(phi, p2);
        for (let j = 0; j <= SEG; j++) {
          const theta = -Math.PI + (j / SEG) * Math.PI * 2; const r1 = sf(theta, p1);
          const x = r1 * Math.cos(theta) * r2 * Math.cos(phi), y = r1 * Math.sin(theta) * r2 * Math.cos(phi), z = r2 * Math.sin(phi);
          positions[k++] = x; positions[k++] = y; positions[k++] = z; maxR = Math.max(maxR, Math.abs(x), Math.abs(y), Math.abs(z));
        }
      }
      const s = 1.55 / (maxR || 1); for (let i = 0; i < positions.length; i++) positions[i] *= s;
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
    };
    rebuild();
    const resize = () => { const r = wrap.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); camera.position.z = r.width < 760 ? 10 : 8.6; mesh.position.x = tube.position.x = r.width < 760 ? 0 : 2.1; mesh.position.y = tube.position.y = r.width < 760 ? 1.2 : 0; };
    resize(); addEventListener('resize', resize);
    hero3D = {
      morphTo(preset) { Object.assign(from, cur); target = preset; morph = 0; },
      custom(p) { this.morphTo({ ...target, m: p.m, n1: p.n1, n2: p.n2, n3: p.n3 }); },
    };
    document.querySelectorAll('.shapes [data-shape]').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('.shapes button').forEach(x => x.classList.remove('is-active')); b.classList.add('is-active'); hero3D.morphTo(PRESETS[+b.dataset.shape]); }));
    const ptr = M.pointer(); let scrollRot = 0; addEventListener('scroll', () => { scrollRot = scrollY * 0.002; }, { passive: true });
    let t0 = 0;
    const frame = (t, dt) => {
      ptr.update(); t0 += dt;
      if (morph < 1) { morph = Math.min(1, morph + dt / 1.6); const e = morph < .5 ? 2 * morph * morph : 1 - Math.pow(-2 * morph + 2, 2) / 2; keys.forEach(k => cur[k] = from[k] + (target[k] - from[k]) * e); rebuild(); }
      mesh.rotation.y = t0 * 0.35 + scrollRot + ptr.x * .4; mesh.rotation.x = Math.sin(t0 * .3) * .25 + ptr.y * .3;
      tube.rotation.y = -t0 * 0.12 + scrollRot * .5; tube.rotation.x = t0 * 0.08;
      renderer.render(scene, camera);
    };
    if (M.reduced) { frame(0, 0); } else M.loop(canvas, frame);
  }
}
