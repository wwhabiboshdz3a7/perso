// Clinique Lumen — « Un implant, pièce par pièce ».
// Une coupe stylisée de la gencive et de l'os, deux dents voisines, et les trois pièces de
// l'implant (vis en titane, pilier, couronne en céramique) qui se mettent en place au fil
// d'un curseur. Tout est construit ici, sans modèle à télécharger.

import * as THREE from 'three';
import { studioEnvironment, softDisc, canvasTexture, seeded } from '../../assets/premium/kit.js';

const canvas = document.querySelector('[data-implant]');
const lab = canvas?.closest('.lab');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (x) => x * x * (3 - 2 * x);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (a, b, x) => ease(seg(x, a, b));

// ---------- le déroulé : T va de 0 (pièces séparées) à 3 (couronne posée) ----------
const state = { T: 0, target: 0, speed: 0.42, scrubbing: false, onChange: null };
const stepButtons = [...document.querySelectorAll('[data-step]')];
const stepPanels = [...document.querySelectorAll('[data-step-panel]')];
const scrub = document.querySelector('[data-scrub]');
const scrubTime = document.querySelector('[data-scrub-time]');
const stepOf = (T) => (T <= 1.001 ? 1 : T <= 2.001 ? 2 : 3);
let shownStep = 0;

function timeLabel(T) {
  if (T < 0.03) return 'Avant la pose';
  if (T <= 1.001) return 'Jour 1';
  if (T <= 2.001) return `Mois ${Math.min(4, 1 + Math.floor((T - 1) * 3.2))}`;
  return T < 2.97 ? 'Mois 4 à 6' : 'Terminé';
}
function syncUi() {
  const step = stepOf(state.T);
  if (step !== shownStep) {
    shownStep = step;
    stepButtons.forEach((button) => {
      const on = Number(button.dataset.step) === step;
      button.classList.toggle('is-on', on);
      button.setAttribute('aria-selected', String(on));
      button.tabIndex = on ? 0 : -1;
    });
    stepPanels.forEach((panel) => (panel.hidden = Number(panel.dataset.stepPanel) !== step));
  }
  if (scrub) {
    if (!state.scrubbing) scrub.value = String(Math.round(state.T * 100));
    scrub.style.setProperty('--fill', `${(state.T / 3) * 100}%`);
    scrub.setAttribute('aria-valuetext', `${timeLabel(state.T)}, étape ${step} sur 3`);
  }
  if (scrubTime) scrubTime.textContent = timeLabel(state.T);
}
function goTo(target, speed = 0.42) {
  state.target = clamp(target, 0, 3);
  state.speed = speed;
  if (reduced || !state.onChange) {
    state.T = state.target; // sans animation (ou sans 3D) : on saute à l'état demandé
    syncUi();
  }
  state.onChange?.();
}
stepButtons.forEach((button, index) => {
  button.addEventListener('click', () => goTo(Number(button.dataset.step)));
  button.addEventListener('keydown', (event) => {
    const move = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!move) return;
    event.preventDefault();
    const next = stepButtons[(index + move + stepButtons.length) % stepButtons.length];
    next.focus();
    next.click();
  });
});
scrub?.addEventListener('input', () => {
  state.scrubbing = true;
  goTo(Number(scrub.value) / 100, 6);
});
for (const type of ['change', 'pointerup', 'blur']) scrub?.addEventListener(type, () => { state.scrubbing = false; });
document.querySelector('[data-play]')?.addEventListener('click', () => {
  if (state.T > 2.9) state.T = 0;
  goTo(3, 0.36);
});
syncUi();

if (canvas) {
  try {
    start();
  } catch (error) {
    console.info('[lumen] 3D indisponible, schéma affiché à la place.', error);
    state.onChange = null;
    lab?.classList.add('no-3d');
  }
}

function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 60);
  scene.environment = studioEnvironment(renderer, {
    ambient: '#a9bccf',
    panels: [
      { size: [10, 10], color: '#ffffff', intensity: 2.6, position: [0, 9, 3] },
      { size: [4, 7], color: '#fff6ea', intensity: 4.2, position: [-7, 3, 5] },
      { size: [3, 7], color: '#d9ecff', intensity: 3.4, position: [7, 2, 2] },
      { size: [10, 2], color: '#ffffff', intensity: 1.6, position: [0, -1, 9] },
    ],
  });
  scene.environmentIntensity = 0.95;
  const key = new THREE.DirectionalLight('#ffffff', 1.9);
  key.position.set(-3.5, 6, 7);
  const fill = new THREE.DirectionalLight('#cfe6ff', 0.7);
  fill.position.set(5, 1.5, 4);
  scene.add(key, fill, softDisc({ radius: 3, color: '#0f2540', opacity: 0.2, y: -1.82 }));

  const pivot = new THREE.Group(); // tourne autour du centre du bloc
  const model = new THREE.Group();
  model.position.x = -0.13;
  pivot.add(model);
  scene.add(pivot);

  // ---------- matières ----------
  const gum = new THREE.MeshPhysicalMaterial({ color: '#f3a4ab', roughness: 0.74, sheen: 0.5, sheenColor: new THREE.Color('#ffd9dc'), sheenRoughness: 0.6 });
  const gumCut = new THREE.MeshStandardMaterial({ color: '#ec929b', roughness: 0.9 });
  const cortical = new THREE.MeshStandardMaterial({ color: '#f7ecd8', roughness: 0.9 });
  const spongy = new THREE.MeshStandardMaterial({ map: boneTexture(), roughness: 0.95 });
  const enamel = new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.3, clearcoat: 0.55, clearcoatRoughness: 0.25 });
  // céramique : un peu translucide sans passe de réfraction — légère transparence, vernis net
  const ceramic = new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.93, emissive: '#fff6e6', emissiveIntensity: 0.06 });
  const dentin = new THREE.MeshStandardMaterial({ color: '#ecd9b6', roughness: 0.7 });
  const titanium = new THREE.MeshStandardMaterial({ color: '#aab0b9', metalness: 1, roughness: 0.4 });
  const polished = new THREE.MeshStandardMaterial({ color: '#d9dde3', metalness: 1, roughness: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2b3340', metalness: 0.6, roughness: 0.5 });

  // ---------- gencive et os, en coupe ----------
  const gumTop = (x) => 0.235 + 0.13 * [0.52, -0.515, 1.66, -1.33].reduce((sum, c) => sum + Math.exp(-(((x - c) / 0.17) ** 2)), 0);
  const contour = gumContour(-1.72, 1.98, -1.62, gumTop);
  model.add(new THREE.Mesh(blockGeometry(contour, 1.05, 0.34, 0.13), gum));
  model.add(new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(contour)), gumCut));
  const flat = (shape, material, z) => {
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 16), material);
    mesh.position.z = z;
    model.add(mesh);
    return mesh;
  };
  flat(roundedRect(-1.62, -1.5, 1.88, 0.0, 0.32, 0.07), cortical, 0.004);
  flat(roundedRect(-1.53, -1.41, 1.79, -0.09, 0.25, 0.05), spongy, 0.008);
  // le logement de l'implant, puis la zone où l'os se soude au titane
  flat(taperShape(0.19, 0.15, 0.0, -0.99), new THREE.MeshStandardMaterial({ color: '#cdb08a', roughness: 1 }), 0.012);
  flat(taperShape(0.14, 0.17, 0.235, 0.0, false), new THREE.MeshStandardMaterial({ color: '#d77985', roughness: 1 }), 0.012);
  const band = flat(taperShape(0.32, 0.25, -0.03, -1.08), new THREE.MeshBasicMaterial({ color: '#17c3a2', transparent: true, opacity: 0, toneMapped: false }), 0.016);

  // ---------- dents voisines ----------
  const molar = { halfW: 0.5, halfD: 0.47, wall: 0.56, cusps: [[0.24, 0.23, 0.17], [-0.24, 0.23, 0.16], [0.25, -0.23, 0.15], [-0.24, -0.22, 0.15]] };
  const premolar = { halfW: 0.37, halfD: 0.43, wall: 0.58, cusps: [[0, 0.21, 0.2], [0, -0.2, 0.14]] };
  {
    const left = new THREE.Group();
    left.position.set(-0.9, 0.2, 0);
    left.add(new THREE.Mesh(crownGeometry(premolar), enamel));
    const root = new THREE.Mesh(lathe([[0.72, 0.06], [0.66, -0.2], [0.5, -0.6], [0.3, -1.0], [0.12, -1.3], [0, -1.36]]), dentin);
    root.scale.set(premolar.halfW, 1, premolar.halfD);
    left.add(root);
    const right = new THREE.Group();
    right.position.set(1.06, 0.2, 0);
    right.add(new THREE.Mesh(crownGeometry({ ...molar, halfW: 0.52 }), enamel));
    const trunk = new THREE.Mesh(lathe([[0.73, 0.06], [0.7, -0.14], [0.6, -0.36], [0.3, -0.5], [0, -0.52]]), dentin);
    trunk.scale.set(0.52, 1, 0.47);
    right.add(trunk);
    for (const side of [-1, 1]) {
      const prong = new THREE.Mesh(lathe([[0.19, 0], [0.18, -0.4], [0.13, -0.8], [0.06, -1.1], [0, -1.16]]), dentin);
      prong.position.set(side * 0.24, -0.22, 0);
      prong.rotation.z = side * 0.09;
      prong.scale.z = 1.6;
      right.add(prong);
    }
    model.add(left, right);
  }

  // ---------- les trois pièces ----------
  const screw = new THREE.Group();
  screw.add(new THREE.Mesh(screwGeometry(), titanium));
  const socket = new THREE.Mesh(new THREE.CircleGeometry(0.09, 6).rotateX(-Math.PI / 2), dark);
  socket.position.y = 0.002;
  screw.add(socket);

  const abutment = new THREE.Group();
  abutment.add(new THREE.Mesh(lathe([[0.085, -0.22], [0.095, -0.02], [0.19, 0], [0.2, 0.02], [0.255, 0.16], [0.265, 0.2], [0.25, 0.235], [0.2, 0.26], [0.172, 0.3], [0.128, 0.62], [0.105, 0.655], [0, 0.66]], 48), polished));

  const cap = new THREE.Group(); // vis de cicatrisation
  cap.add(new THREE.Mesh(lathe([[0.19, 0], [0.235, 0.05], [0.24, 0.2], [0.226, 0.27], [0.17, 0.305], [0, 0.315]], 48), polished));
  const capSocket = new THREE.Mesh(new THREE.CircleGeometry(0.075, 6).rotateX(-Math.PI / 2), dark);
  capSocket.position.y = 0.317;
  cap.add(capSocket);

  const crown = new THREE.Mesh(crownGeometry(molar), ceramic);
  crown.renderOrder = 2;
  model.add(screw, abutment, cap, crown);

  // ---------- étiquettes ----------
  const labels = [...(lab?.querySelectorAll('[data-label]') || [])].map((element) => ({ element, name: element.dataset.label, shown: -1 }));
  const anchor = new THREE.Vector3();
  function placeLabel(label, x, y, z, mode, opacity) {
    if (!label) return;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    anchor.set(x, y, z);
    model.localToWorld(anchor).project(camera);
    let px = (anchor.x * 0.5 + 0.5) * width, py = (-anchor.y * 0.5 + 0.5) * height;
    const w = label.element.offsetWidth, h = label.element.offsetHeight;
    if (mode === 'left') px -= w + 10;
    else if (mode === 'top') { px -= w / 2; py -= h + 12; }
    else px += 10;
    if (mode !== 'top') py -= h / 2;
    px = clamp(px, 8, width - w - 8);
    py = clamp(py, 8, height - h - 8);
    label.element.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
    if (opacity !== label.shown) {
      label.shown = opacity;
      label.element.style.opacity = String(opacity);
    }
  }

  // ---------- mise en place des pièces selon T ----------
  let stackTop = 4;
  function pose(T, time) {
    const pA = ease(seg(T, 0, 1));
    const capIn = ease(seg(T, 1.02, 1.3)), capOut = ease(seg(T, 2.0, 2.2));
    const abIn = ease(seg(T, 2.16, 2.58));
    const crIn = ease(seg(T, 2.5, 2.98));
    const bob = (phase, free) => (reduced ? 0 : Math.sin(time * 1.3 + phase) * 0.03 * free);

    screw.position.y = 1.45 * (1 - pA) + bob(0, 1 - pA);
    screw.rotation.y = (1 - pA) * Math.PI * 5;

    cap.visible = capIn > 0.001 && capOut < 0.999;
    cap.position.y = 0.7 * (1 - capIn) + 1.1 * capOut;
    cap.rotation.y = (1 - capIn) * Math.PI * 2;
    cap.scale.setScalar(Math.max(0.001, Math.min(1, capIn * 1.6) * (1 - capOut)));

    const abutmentLift = lerp(lerp(1.85, 1.1, pA), 0, abIn);
    abutment.position.y = abutmentLift + bob(1.7, 1 - abIn);
    abutment.rotation.y = (1 - abIn) * Math.PI * 3;

    const crownLift = lerp(lerp(2.45, 1.75, pA), 0, crIn);
    crown.position.y = 0.2 + crownLift + bob(3.1, 1 - crIn) + Math.sin(seg(T, 2.9, 3) * Math.PI) * -0.015;

    const healed = ease(seg(T, 1.12, 1.9));
    band.material.opacity = healed * (T < 2.05 && !reduced ? 0.72 + 0.2 * Math.sin(time * 2.4) : 0.6) * lerp(1, 0.55, seg(T, 2, 2.4));
    band.visible = healed > 0.01;
    band.scale.y = lerp(0.2, 1, healed);

    stackTop = 0.2 + crownLift + 0.86;
    placeLabel(labels.find((l) => l.name === 'crown'), 0, crown.position.y + 0.84, 0, 'top', 1);
    placeLabel(labels.find((l) => l.name === 'abutment'), 0.24, abutment.position.y + 0.36, 0.1, 'right', T < 2.7 ? 1 : 0);
    placeLabel(labels.find((l) => l.name === 'screw'), 0.22, screw.position.y - 0.42, 0.18, 'right', healed > 0.2 && T < 2.3 ? 0 : 1);
    placeLabel(labels.find((l) => l.name === 'bone'), 0.3, -0.62, 0.05, 'right', healed > 0.2 && T < 2.3 ? 1 : 0);
  }

  // ---------- rotation au doigt, à la souris, au clavier ----------
  const YAW_MAX = 1.15; // la coupe reste toujours visible
  let yaw = -0.38, pitch = 0.1, velocity = 0, dragging = false, lastX = 0, lastY = 0, idle = 1;
  const touched = () => lab?.classList.add('is-touched');
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    touched();
    wake();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    yaw = clamp(yaw + dx * 0.009, -YAW_MAX, YAW_MAX);
    pitch = clamp(pitch + (event.clientY - lastY) * 0.005, -0.12, 0.7);
    velocity = dx * 0.5;
    lastX = event.clientX;
    lastY = event.clientY;
    wake();
  });
  const release = () => { dragging = false; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') yaw = Math.max(-YAW_MAX, yaw - 0.2);
    else if (event.key === 'ArrowRight') yaw = Math.min(YAW_MAX, yaw + 0.2);
    else return;
    event.preventDefault();
    touched();
    wake();
  });

  // ---------- rendu : seulement à l'écran, et seulement si quelque chose bouge ----------
  let visible = false, awakeUntil = 0, last = performance.now(), time = 0, distance = 13, targetY = 1;
  function wake() { awakeUntil = performance.now() + 2500; }
  state.onChange = wake;
  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    wake();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) wake(); }).observe(canvas);

  let first = true;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const moving = Math.abs(state.target - state.T) > 0.0005;
    if (!visible || (reduced && !moving && now > awakeUntil)) return;
    time += dt;

    if (moving) {
      const stepSize = state.speed * dt * (reduced ? 20 : 1);
      state.T += clamp(state.target - state.T, -stepSize, stepSize);
      syncUi();
    }
    if (!dragging) {
      yaw = clamp(yaw + velocity * dt * 0.02, -YAW_MAX, YAW_MAX);
      velocity *= Math.exp(-4 * dt);
    }
    idle = lerp(idle, dragging || now < awakeUntil - 500 ? 0 : 1, 1 - Math.exp(-2 * dt));
    pivot.rotation.y = yaw + (reduced ? 0 : Math.sin(time * 0.5) * 0.16 * idle);

    pose(state.T, time);

    // cadrage : la caméra recule tant que les pièces flottent, se rapproche quand tout est en place
    const bottom = -1.9, top = stackTop + 0.42;
    const halfH = (top - bottom) / 2, halfW = 2.25;
    const wantDistance = (Math.max(halfH, halfW / camera.aspect) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.03;
    const wantY = (top + bottom) / 2;
    const k = first ? 1 : 1 - Math.exp(-3.2 * dt);
    first = false;
    distance = lerp(distance, wantDistance, k);
    targetY = lerp(targetY, wantY, k);
    camera.position.set(0, targetY + Math.sin(pitch) * distance, Math.cos(pitch) * distance);
    camera.lookAt(0, targetY, 0);
    camera.updateMatrixWorld();
    pose(state.T, time); // étiquettes replacées avec la caméra à jour
    renderer.render(scene, camera);
  }
  resize();
  requestAnimationFrame(frame);
  lab?.classList.add('is-ready');
}

// ================= géométries =================

function indexed(positions, indices, colors) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (colors) geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function lathe(profile, segments = 40) {
  const points = profile.map(([r, y]) => new THREE.Vector2(r, y));
  if (points[0].y > points[points.length - 1].y) points.reverse(); // du bas vers le haut : faces tournées vers l'extérieur
  return new THREE.LatheGeometry(points, segments);
}

// Couronne d'une molaire (ou prémolaire) : paroi bombée, épaule arrondie, cuspides et sillons.
function crownGeometry({ halfW, halfD, wall, cusps }) {
  const SEG = 88, WALL = 22, CAP = 30, ROWS = WALL + CAP;
  const positions = [], colors = [], indices = [];
  const neck = new THREE.Color('#f1dfc2'), body = new THREE.Color('#fbf6ea'), tip = new THREE.Color('#f3f6f6'), tint = new THREE.Color();
  const squircle = (a) => Math.pow(Math.pow(Math.abs(Math.cos(a)), 3.4) + Math.pow(Math.abs(Math.sin(a)), 3.4), -1 / 3.4);
  const shoulder = 0.1;
  const relief = (x, z) => {
    let h = 0;
    for (const [cx, cz, ch] of cusps) h += ch * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * 0.145 ** 2));
    h -= 0.055 * Math.exp(-((z / 0.05) ** 2)); // sillon principal
    if (cusps.length > 2) h -= 0.05 * Math.exp(-((x / 0.05) ** 2));
    return h;
  };
  for (let i = 0; i <= ROWS; i++) {
    let rr, y, blend = 0;
    if (i <= WALL) {
      const v = i / WALL;
      rr = v < 0.45 ? 0.74 + 0.26 * Math.sin((v / 0.45) * Math.PI * 0.5) : 1 - 0.07 * ((v - 0.45) / 0.55) ** 2;
      y = v * wall;
    } else {
      const a = (i - WALL) / CAP;
      if (a < 0.28) {
        const q = (a / 0.28) * Math.PI * 0.5;
        rr = 0.93 - 0.15 * (1 - Math.cos(q));
        y = wall + shoulder * Math.sin(q);
      } else {
        const b = (a - 0.28) / 0.72;
        rr = 0.78 * (1 - b);
        y = wall + shoulder;
        blend = smooth(0, 0.3, b);
      }
    }
    for (let j = 0; j < SEG; j++) {
      const angle = (j / SEG) * Math.PI * 2, s = squircle(angle);
      const x = Math.cos(angle) * s * rr * halfW, z = Math.sin(angle) * s * rr * halfD;
      const top = blend ? relief(x, z) * blend : 0;
      positions.push(x, y + top, z);
      const height = (y + top) / (wall + shoulder + 0.18);
      tint.copy(neck).lerp(body, smooth(0, 0.35, height)).lerp(tip, smooth(0.7, 1.05, height));
      colors.push(tint.r, tint.g, tint.b);
    }
  }
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < SEG; j++) {
      const a = i * SEG + j, b = i * SEG + ((j + 1) % SEG), c = a + SEG, d = b + SEG;
      indices.push(a, c, b, b, c, d);
    }
  }
  // dessous : un disque un peu en retrait, avec ses propres sommets pour garder un bord net
  const base = positions.length / 3;
  for (let j = 0; j < SEG; j++) {
    positions.push(positions[j * 3], 0, positions[j * 3 + 2]);
    colors.push(neck.r * 0.8, neck.g * 0.8, neck.b * 0.8);
  }
  positions.push(0, 0.05, 0);
  colors.push(neck.r * 0.7, neck.g * 0.7, neck.b * 0.7);
  for (let j = 0; j < SEG; j++) indices.push(base + j, base + ((j + 1) % SEG), base + SEG);
  return indexed(positions, indices, colors);
}

// Implant : col lisse, corps conique, filet hélicoïdal, bout arrondi. Sommet en y = 0.
function screwGeometry() {
  const SEG = 64, ROWS = 250, LENGTH = 1, RADIUS = 0.2, PITCH = 0.088, DEPTH = 0.045;
  const positions = [], indices = [];
  for (let i = 0; i <= ROWS; i++) {
    const s = i / ROWS;
    let core = RADIUS * (s < 0.12 ? 1.08 : lerp(1.08, 0.94, smooth(0.12, 0.2, s)) - 0.3 * Math.pow(seg(s, 0.2, 1), 1.5));
    if (s < 0.02) core *= 0.9 + 0.1 * Math.sqrt(s / 0.02);
    if (s > 0.93) core *= Math.max(0.08, Math.sqrt(1 - ((s - 0.93) / 0.07) ** 2));
    const mask = smooth(0.13, 0.2, s) * (1 - smooth(0.86, 0.96, s));
    for (let j = 0; j < SEG; j++) {
      const turn = j / SEG;
      const phase = (((s * LENGTH) / PITCH + turn) % 1 + 1) % 1;
      const r = core + DEPTH * mask * Math.pow(1 - Math.abs(2 * phase - 1), 1.25);
      positions.push(r * Math.cos(turn * Math.PI * 2), -s * LENGTH, r * Math.sin(turn * Math.PI * 2));
    }
  }
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < SEG; j++) {
      const a = i * SEG + j, b = i * SEG + ((j + 1) % SEG), c = a + SEG, d = b + SEG;
      indices.push(a, b, c, b, d, c);
    }
  }
  const tip = positions.length / 3;
  positions.push(0, -LENGTH - 0.004, 0);
  for (let j = 0; j < SEG; j++) indices.push(ROWS * SEG + j, ROWS * SEG + ((j + 1) % SEG), tip);
  const top = positions.length / 3; // dessus, sommets séparés
  for (let j = 0; j < SEG; j++) positions.push(positions[j * 3], 0, positions[j * 3 + 2]);
  positions.push(0, 0, 0);
  for (let j = 0; j < SEG; j++) indices.push(top + j, top + SEG, top + ((j + 1) % SEG));
  return indexed(positions, indices);
}

// Contour de la coupe (sens trigonométrique) : coins bas arrondis, dessus festonné autour des dents.
function gumContour(x0, x1, bottom, top) {
  const points = [];
  const arc = (cx, cy, r, from, to, n) => {
    for (let i = 0; i <= n; i++) {
      const a = lerp(from, to, i / n);
      points.push(new THREE.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)));
    }
  };
  const R = 0.42, r = 0.16;
  arc(x0 + R, bottom + R, R, Math.PI, Math.PI * 1.5, 9);
  arc(x1 - R, bottom + R, R, Math.PI * 1.5, Math.PI * 2, 9);
  arc(x1 - r, top(x1 - r) - r, r, 0, Math.PI / 2, 5);
  const N = 96;
  for (let i = 1; i < N; i++) {
    const x = lerp(x1 - r, x0 + r, i / N);
    points.push(new THREE.Vector2(x, top(x)));
  }
  arc(x0 + r, top(x0 + r) - r, r, Math.PI / 2, Math.PI, 5);
  return points;
}

// Volume derrière la coupe : le contour est tiré vers l'arrière, avec un arrondi au fond.
function blockGeometry(contour, depth, round, centerX) {
  const N = contour.length, K = 8;
  const rings = [{ z: 0, inset: 0 }, { z: -(depth - round), inset: 0 }];
  for (let k = 1; k <= K; k++) {
    const a = (k / K) * Math.PI * 0.5;
    rings.push({ z: -(depth - round) - round * Math.sin(a), inset: round * (1 - Math.cos(a)) });
  }
  const positions = [], indices = [];
  for (const ring of rings) {
    for (const p of contour) {
      const cx = clamp(p.x, centerX - 1.05, centerX + 1.05), dx = cx - p.x, dy = -0.66 - p.y, length = Math.hypot(dx, dy) || 1;
      positions.push(p.x + (dx / length) * ring.inset, p.y + (dy / length) * ring.inset, ring.z);
    }
  }
  for (let r = 0; r < rings.length - 1; r++) {
    for (let j = 0; j < N; j++) {
      const a = r * N + j, b = r * N + ((j + 1) % N), c = a + N, d = b + N;
      indices.push(a, c, b, b, c, d);
    }
  }
  const last = (rings.length - 1) * N;
  const back = contour.map((_, j) => new THREE.Vector2(positions[(last + j) * 3], positions[(last + j) * 3 + 1]));
  for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(back, [])) indices.push(last + a, last + c, last + b);
  return indexed(positions, indices);
}

function roundedRect(x0, y0, x1, y1, bottomRadius, topRadius) {
  const shape = new THREE.Shape();
  shape.moveTo(x0 + bottomRadius, y0);
  shape.lineTo(x1 - bottomRadius, y0);
  shape.absarc(x1 - bottomRadius, y0 + bottomRadius, bottomRadius, -Math.PI / 2, 0, false);
  shape.lineTo(x1, y1 - topRadius);
  shape.absarc(x1 - topRadius, y1 - topRadius, topRadius, 0, Math.PI / 2, false);
  shape.lineTo(x0 + topRadius, y1);
  shape.absarc(x0 + topRadius, y1 - topRadius, topRadius, Math.PI / 2, Math.PI, false);
  shape.lineTo(x0, y0 + bottomRadius);
  shape.absarc(x0 + bottomRadius, y0 + bottomRadius, bottomRadius, Math.PI, Math.PI * 1.5, false);
  return shape;
}

// Fuseau vertical (logement de l'implant) : demi-largeur `top` en haut, `bottom` en bas, bout arrondi.
function taperShape(top, bottom, yTop, yBottom, rounded = true) {
  const shape = new THREE.Shape();
  shape.moveTo(-top, yTop);
  shape.lineTo(-bottom, yBottom);
  if (rounded) shape.absarc(0, yBottom, bottom, Math.PI, Math.PI * 2, false);
  else shape.lineTo(bottom, yBottom);
  shape.lineTo(top, yTop);
  shape.closePath();
  return shape;
}

// Os spongieux : fond crème, petites alvéoles.
function boneTexture() {
  const rnd = seeded(11);
  const texture = canvasTexture(512, (ctx, size) => {
    ctx.fillStyle = '#edd9b9';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 520; i++) {
      const x = rnd() * size, y = rnd() * size, rx = 5 + rnd() * 11, ry = 4 + rnd() * 8;
      ctx.fillStyle = `rgba(205, 170, 124, ${0.3 + rnd() * 0.4})`;
      for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
        ctx.beginPath();
        ctx.ellipse(x + ox, y + oy, rx, ry, rnd() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, { repeat: true });
  texture.repeat.set(0.75, 0.75);
  return texture;
}
