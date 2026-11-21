// Atelier 31 — vue éclatée d'un train roulant : jante et pneu, écrous, disque ventilé rainuré,
// étrier, plaquettes, moyeu. Tout est modelé ici (aucun fichier 3D). Un curseur écarte les pièces
// le long de l'axe ; chaque pièce se touche pour afficher ce qu'on y contrôle, quand elle se
// remplace et son prix indicatif. La fiche fonctionne aussi sans WebGL.

import * as THREE from 'three';
import { studioEnvironment, softDisc, canvasTexture } from '../../assets/premium/kit.js';

const root = document.querySelector('[data-xp]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const step = (a, b, v) => smooth(clamp((v - a) / (b - a)));

const PARTS = [
  {
    id: 'roue', n: '01', name: 'Jante alliage et pneu', open: 0,
    check: 'Profondeur des sculptures (témoin légal à 1,6 mm, nous alertons dès 3 mm), usure irrégulière, hernies, voile de la jante, pression.',
    change: 'Pneus tous les 30 000 à 50 000 km, ou à 6 ans. Toujours par paire sur un même essieu.',
    price: 'Dès 90 € le pneu', note: 'Fourni, monté, équilibré. Redressage de jante : 90 €.',
    pick: 'pneus', cta: 'Chiffrer mes pneus',
  },
  {
    id: 'ecrous', n: '02', name: 'Écrous de roue', open: 50,
    check: 'Filetage, portée conique, présence de l’antivol. Serrage en étoile à la clé dynamométrique : 120 N·m.',
    change: 'Dès qu’un filetage est marqué ou qu’un écrou a été forcé. Resserrage de contrôle offert après 50 km.',
    price: '4 € pièce', note: 'Jeu de quatre antivols : 49 €.',
    pick: 'revision', cta: 'Contrôlés à chaque révision',
  },
  {
    id: 'disque', n: '03', name: 'Disque ventilé rainuré', open: 100,
    check: 'Épaisseur mesurée au palmer (cote minimale gravée sur la tranche), voile, fissures, lèvre d’usure, traces de surchauffe.',
    change: 'Un jeu de disques pour deux jeux de plaquettes environ : 60 000 à 80 000 km. Toujours par paire.',
    price: 'Dès 235 €', note: 'Les deux disques avant et leurs plaquettes, posés.',
    pick: 'freins-av', cta: 'Chiffrer mes freins avant',
  },
  {
    id: 'etrier', n: '04', name: 'Étrier de frein', open: 100,
    check: 'Coulissement, étanchéité des pistons, soufflets, flexible, teinte du liquide de frein.',
    change: 'Rarement : on le remet en état (joints, pistons) s’il grippe. Le liquide de frein, lui, se purge tous les deux ans.',
    price: '79 € la purge', note: 'Réfection d’un étrier : 160 €.',
    pick: 'freins-av', cta: 'Chiffrer mes freins avant',
  },
  {
    id: 'plaquettes', n: '05', name: 'Plaquettes', open: 100,
    check: 'Épaisseur de garniture restante, usure en biais, glaçage, témoin d’usure et son câblage.',
    change: 'Sous 3 mm de garniture : 25 000 à 40 000 km à l’avant, davantage si vous roulez surtout sur route.',
    price: 'Dès 95 €', note: 'Le jeu avant posé, si les disques sont encore dans la cote.',
    pick: 'freins-av', cta: 'Chiffrer mes freins avant',
  },
  {
    id: 'moyeu', n: '06', name: 'Moyeu et roulement', open: 100,
    check: 'Jeu du roulement, grondement en virage, état des goujons, capteur ABS, soufflet de transmission.',
    change: 'Seulement s’il prend du jeu ou devient bruyant, souvent après 150 000 km.',
    price: 'De 190 à 340 €', note: 'Par roue, roulement fourni et posé.',
    pick: 'revision', cta: 'Le faire contrôler en révision',
  },
];
const byId = Object.fromEntries(PARTS.map((part) => [part.id, part]));

// ---------- état partagé entre la fiche et la scène ----------
const state = { target: 0, selected: null, touched: false, wake() {} };

if (root) {
  setupPanel();
  const canvas = root.querySelector('[data-xp-canvas]');
  try {
    start3d(canvas);
  } catch (error) {
    console.info('[atelier 31] 3D indisponible, image de secours affichée.', error);
    root.classList.add('no-3d');
  }
}

// ---------- la fiche : liste des pièces, étapes, curseur ----------
function setupPanel() {
  const fiche = root.querySelector('[data-fiche]');
  const buttons = [...root.querySelectorAll('[data-part]')];
  const steps = [...root.querySelectorAll('[data-xp-step]')];
  const range = root.querySelector('[data-xp-range]');
  const out = root.querySelector('[data-xp-out]');

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const row = (label, text, extra) => {
    const wrap = el('div', extra);
    wrap.append(el('dt', '', label), el('dd', '', text));
    return wrap;
  };

  function renderFiche() {
    const part = byId[state.selected];
    fiche.replaceChildren();
    const kicker = el('p', 'fiche__k lbl');
    if (!part) {
      kicker.append(el('span', '', 'Train avant gauche'), el('span', '', '6 pièces'));
      const text = el('p', 'fiche__intro', 'Écartez les pièces avec le curseur, faites tourner l’ensemble, puis touchez une pièce ou choisissez-la dans la liste : sa fiche s’affiche ici.');
      const rows = el('dl', 'fiche__rows');
      rows.append(row('À chaque visite', 'Les six pièces sont contrôlées, mesurées et photographiées.'), row('Vous recevez', 'Le relevé : épaisseurs, usure, couple de serrage.'));
      fiche.append(kicker, el('h3', '', 'Touchez une pièce'), text, rows);
      return;
    }
    kicker.append(el('span', '', `Pièce ${part.n} / 06`), el('span', '', 'Fiche de contrôle'));
    const rows = el('dl', 'fiche__rows');
    const price = row('Prix indicatif', part.price, 'is-price');
    price.lastChild.append(el('small', '', part.note));
    rows.append(row('On vérifie', part.check), row('On remplace', part.change), price);
    const foot = el('div', 'fiche__foot');
    const cta = el('a', 'btn btn--sig', part.cta);
    cta.href = '#devis';
    cta.dataset.pick = part.pick;
    const all = el('button', 'btn btn--wire', 'Tout afficher');
    all.type = 'button';
    all.addEventListener('click', () => select(null));
    foot.append(cta, all);
    fiche.append(kicker, el('h3', '', part.name), rows, foot);
  }

  function select(id, fromScene = false) {
    state.selected = id && id !== state.selected ? id : id === state.selected && fromScene ? id : id === state.selected ? null : id;
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.part === state.selected));
    const part = byId[state.selected];
    // une pièce cachée par la roue : on ouvre l'ensemble pour la montrer
    if (part && !fromScene && state.target < part.open) setExplode(part.open);
    renderFiche();
    state.onSelect?.();
    state.wake();
  }

  function setExplode(value) {
    state.target = clamp(Number(value) || 0, 0, 100);
    range.value = String(Math.round(state.target));
    out.textContent = `${Math.round(state.target)} %`;
    const current = state.target < 25 ? 0 : state.target < 75 ? 50 : 100;
    for (const button of steps) button.setAttribute('aria-pressed', String(Number(button.dataset.xpStep) === current));
    state.wake();
  }

  for (const button of buttons) button.addEventListener('click', () => { state.touched = true; select(button.dataset.part); });
  for (const button of steps) button.addEventListener('click', () => { state.touched = true; setExplode(button.dataset.xpStep); });
  range.addEventListener('input', () => { state.touched = true; setExplode(range.value); });
  state.select = select;
  state.setExplode = setExplode;
  renderFiche();
  setExplode(0);
}

// ---------- la scène ----------
function start3d(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  scene.environment = studioEnvironment(renderer, {
    ambient: '#30333a',
    panels: [
      { size: [10, 10], color: '#ffffff', intensity: 3.2, position: [0, 9, 2] },
      { size: [4, 7], color: '#fff4e6', intensity: 6, position: [-7, 2.5, 4] },
      { size: [2, 8], color: '#dfe8ff', intensity: 5, position: [7, 2, -2] },
      { size: [10, 1.2], color: '#ffffff', intensity: 3, position: [0, -1, 8] },
    ],
  });
  scene.environmentIntensity = 1.0;
  const key = new THREE.DirectionalLight('#ffffff', 2.4);
  key.position.set(3, 6, 6);
  const rim = new THREE.DirectionalLight('#ffd9c2', 1.6);
  rim.position.set(-6, 3, -4);
  scene.add(key, rim);

  // rig : rotation à la main ; assembly : l'axe de roue (Y local, côté extérieur vers +Y) couché sur X
  const rig = new THREE.Group();
  const assembly = new THREE.Group();
  assembly.rotation.z = -Math.PI / 2;
  const shadow = softDisc({ radius: 1, color: '#101214', opacity: 0.3, y: -1.06 });
  rig.add(assembly, shadow);
  scene.add(rig);

  const parts = buildParts();
  for (const part of Object.values(parts)) assembly.add(part.group);

  // ---------- repères numérotés par-dessus le canvas ----------
  const marksRoot = root.querySelector('[data-xp-marks]');
  const marks = PARTS.map((info) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mark is-off';
    button.setAttribute('aria-label', `${info.name} : afficher la fiche`);
    const number = document.createElement('b');
    number.textContent = info.n;
    const label = document.createElement('span');
    label.textContent = info.name;
    button.append(number, label);
    button.addEventListener('click', () => { state.touched = true; state.select(info.id, true); });
    marksRoot.append(button);
    return { info, button, part: parts[info.id] };
  });
  state.onSelect = () => {
    for (const mark of marks) mark.button.classList.toggle('is-on', mark.info.id === state.selected);
  };

  // ---------- rotation, sélection ----------
  let yaw = -0.62, yawHome = -0.62, pitch = 0.2, dragging = false, moved = false, lastX = 0, lastY = 0, downX = 0, downY = 0, grabbed = false;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function partAt(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(assembly, true)[0];
    for (let node = hit?.object; node; node = node.parent) if (node.userData.part) return node.userData.part;
    return null;
  }
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = false;
    lastX = downX = event.clientX;
    lastY = downY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    wake();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) {
      if (event.pointerType === 'mouse') canvas.style.cursor = partAt(event) ? 'pointer' : '';
      return;
    }
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) moved = true;
    if (moved) {
      grabbed = true;
      yaw += (event.clientX - lastX) * 0.008;
      pitch = clamp(pitch + (event.clientY - lastY) * 0.005, -0.2, 0.8);
    }
    lastX = event.clientX;
    lastY = event.clientY;
    wake();
  });
  canvas.addEventListener('pointerup', (event) => {
    if (dragging && !moved) {
      const id = partAt(event);
      state.touched = true;
      if (id) state.select(id, true);
    }
    dragging = false;
  });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') yaw -= 0.16;
    else if (event.key === 'ArrowRight') yaw += 0.16;
    else if (event.key === 'ArrowUp') state.setExplode(state.target + 10);
    else if (event.key === 'ArrowDown') state.setExplode(state.target - 10);
    else return;
    grabbed = true;
    state.touched = true;
    event.preventDefault();
    wake();
  });

  // ---------- rendu : seulement à l'écran, et seulement quand quelque chose bouge ----------
  let visible = false, opened = false, awakeUntil = 0, last = performance.now(), time = 0, t = 0, distance = 9, width = 1, height = 1;
  function wake() { awakeUntil = performance.now() + 1800; }
  state.wake = wake;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    yawHome = camera.aspect < 1.05 ? -1.02 : -0.62;
    if (!grabbed) yaw = yawHome;
    wake();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (!visible) return;
    wake();
    // première apparition : l'ensemble s'ouvre tout seul pour montrer de quoi il s'agit
    if (!opened && entries[0].intersectionRatio > 0.35) {
      opened = true;
      if (!state.touched) setTimeout(() => { if (!state.touched) state.setExplode(100); }, reduced ? 0 : 500);
    }
  }, { threshold: [0, 0.35, 0.6] }).observe(canvas);

  const anchor = new THREE.Vector3();
  const tan = Math.tan((camera.fov * Math.PI) / 360);

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const goal = state.target / 100;
    const fading = Object.values(parts).some((part) => Math.abs(part.fade - part.fadeGoal()) > 0.002);
    const opening = Math.abs(goal - t) > 0.0005;
    const idle = !grabbed && !reduced; // léger balancement tant qu'on n'a pas pris la main
    if (!visible || (!opening && !fading && !idle && now > awakeUntil)) return;
    time += dt;

    t = reduced ? goal : Math.abs(goal - t) < 0.0005 ? goal : lerp(t, goal, 1 - Math.exp(-3.4 * dt));
    const s1 = step(0, 0.5, t), s2 = step(0.5, 1, t);
    const o = { nuts: 1.75 * s1 + 0.55 * s2, wheel: 1.1 * s1 + 0.4 * s2, disc: 0.6 * s2, pads: 0.28 * s2, lift: 0.5 * s2, hub: -0.5 * s2 };
    parts.ecrous.group.position.y = o.nuts;
    for (const nut of parts.ecrous.nuts) nut.rotation.y = s1 * TAU * 3;
    parts.roue.group.position.y = o.wheel;
    parts.disque.group.position.y = o.disc;
    parts.etrier.group.position.set(CALIPER_DIR.x * o.lift, 0, CALIPER_DIR.z * o.lift);
    parts.plaquettes.outer.position.y = o.pads;
    parts.plaquettes.inner.position.y = -o.pads;
    parts.moyeu.group.position.y = o.hub;

    for (const part of Object.values(parts)) {
      const wanted = part.fadeGoal();
      part.fade = reduced ? wanted : lerp(part.fade, wanted, 1 - Math.exp(-7 * dt));
      part.applyFade();
    }

    // cadrage : on garde tout l'ensemble dans l'image, quel que soit l'écartement
    const min = -0.62 + o.hub, max = Math.max(0.22 + o.wheel, 0.15 + o.nuts);
    const half = (max - min) / 2;
    assembly.position.x = -(min + max) / 2;
    shadow.scale.set(half + 0.75, 1.15, 1);
    if (idle) yaw = yawHome + Math.sin(time * 0.42) * 0.16;
    rig.rotation.y = yaw;
    const cos = Math.abs(Math.cos(yaw)), sin = Math.abs(Math.sin(yaw));
    const halfW = half * cos + 1.02 * sin + 0.12, halfH = 1.16, depth = half * sin + 1.02 * cos;
    const wanted = Math.max(halfH / tan, halfW / (tan * camera.aspect)) + depth * 0.55;
    distance = reduced ? wanted : lerp(distance, wanted, 1 - Math.exp(-4 * dt));
    camera.position.set(0, Math.sin(pitch) * distance, Math.cos(pitch) * distance);
    camera.lookAt(0, -0.02, 0);
    renderer.render(scene, camera);

    // repères : position à l'écran de chaque pièce
    for (const mark of marks) {
      const show = t * 100 >= mark.info.open - 22;
      mark.part.anchor.getWorldPosition(anchor).project(camera);
      const x = (anchor.x * 0.5 + 0.5) * width, y = (-anchor.y * 0.5 + 0.5) * height;
      mark.button.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      mark.button.classList.toggle('is-off', !show || x < 16 || x > width - 16 || y < 16 || y > height - 16);
      mark.button.classList.toggle('is-flip', x > width * 0.62);
      mark.button.tabIndex = show ? 0 : -1;
    }
  }
  resize();
  requestAnimationFrame(frame);
  root.classList.add('is-ready');
}

// ---------- géométrie ----------
// Tout est construit autour de l'axe Y (côté extérieur de la voiture vers +Y).
const YW = -0.086; // plan médian de la roue
const YC = -0.16; // plan médian du disque
const CALIPER_TURN = Math.atan2(-0.6, -0.8); // l'étrier est en haut, légèrement vers l'avant
const CALIPER_DIR = new THREE.Vector3(Math.cos(CALIPER_TURN), 0, -Math.sin(CALIPER_TURN));
const CLAY = new THREE.Color('#cbc8c1');

const v2 = (r, a) => new THREE.Vector2(r * Math.cos(a), r * Math.sin(a));
const at = (r, a, y) => new THREE.Vector3(r * Math.cos(a), y, -r * Math.sin(a)); // même convention que les formes extrudées

function lathe(points, segments = 96) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

// Forme dessinée dans le plan perpendiculaire à l'axe, épaissie vers +Y à partir de y0.
function extrude(shape, depth, y0, bevel = 0.006, curveSegments = 24) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, steps: 1, curveSegments, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y0, 0);
  return geometry;
}

function sector(r0, r1, a0, a1, n = 18) {
  const points = [];
  for (let i = 0; i <= n; i++) points.push(v2(r1, lerp(a0, a1, i / n)));
  for (let i = n; i >= 0; i--) points.push(v2(r0, lerp(a0, a1, i / n)));
  return new THREE.Shape(points);
}

function makePart(id) {
  const group = new THREE.Group();
  group.userData.part = id;
  const entries = [];
  const part = {
    id, group, fade: 0, anchor: new THREE.Object3D(),
    // matière enregistrée : elle pâlit quand une autre pièce est sélectionnée
    mat(material) {
      entries.push({ material, color: material.color.clone(), metalness: material.metalness, roughness: material.roughness, clearcoat: material.clearcoat || 0 });
      return material;
    },
    fadeGoal: () => (state.selected && state.selected !== id ? 1 : 0),
    applyFade() {
      if (part.fade === part.applied) return;
      part.applied = part.fade;
      const f = part.fade;
      for (const entry of entries) {
        entry.material.color.copy(entry.color).lerp(CLAY, f * 0.9);
        entry.material.metalness = entry.metalness * (1 - f * 0.92);
        entry.material.roughness = lerp(entry.roughness, 0.92, f);
        if (entry.clearcoat) entry.material.clearcoat = entry.clearcoat * (1 - f);
      }
    },
  };
  group.add(part.anchor);
  return part;
}

function mesh(part, geometry, material, parent = part.group) {
  const object = new THREE.Mesh(geometry, material);
  parent.add(object);
  return object;
}

function buildParts() {
  return { moyeu: buildHub(), disque: buildDisc(), plaquettes: buildPads(), etrier: buildCaliper(), roue: buildWheel(), ecrous: buildNuts() };
}

// ----- jante à dix branches jumelées et pneu taille basse -----
function buildWheel() {
  const part = makePart('roue');
  // pneu : flanc, bande de roulement à trois rainures, flanc
  const flank = new THREE.SplineCurve([[0.7, -0.265], [0.74, -0.302], [0.82, -0.326], [0.9, -0.318], [0.955, -0.285], [0.986, -0.24], [0.999, -0.2]].map(([r, y]) => new THREE.Vector2(r, y))).getPoints(18);
  const profile = flank.map((p) => [p.x, p.y]);
  for (const g of [-0.115, 0, 0.115]) profile.push([1, g - 0.024], [0.972, g - 0.013], [0.972, g + 0.013], [1, g + 0.024]);
  for (const p of [...flank].reverse()) profile.push([p.x, -p.y]);
  const rubberBump = canvasTexture(512, (ctx, size) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    // sculptures : lamelles obliques sur la bande de roulement
    ctx.strokeStyle = '#1c1c1c';
    ctx.lineWidth = 7;
    for (let x = -size; x < size * 2; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, size * 0.37);
      ctx.lineTo(x + 46, size * 0.5);
      ctx.lineTo(x, size * 0.63);
      ctx.stroke();
    }
    // flancs : filets et marquages
    ctx.strokeStyle = '#b4b4b4';
    ctx.lineWidth = 3;
    for (const y of [0.1, 0.24, 0.76, 0.9]) { ctx.beginPath(); ctx.moveTo(0, size * y); ctx.lineTo(size, size * y); ctx.stroke(); }
    ctx.fillStyle = '#c8c8c8';
    for (const y of [0.15, 0.81]) for (let x = 20; x < size; x += 128) { ctx.fillRect(x, size * y, 58, 14); ctx.fillRect(x + 66, size * y, 12, 14); }
  }, { srgb: false, repeat: true });
  rubberBump.repeat.set(10, 1);
  const rubber = part.mat(new THREE.MeshStandardMaterial({ color: '#17181a', roughness: 0.86, metalness: 0, bumpMap: rubberBump, bumpScale: 2.2, side: THREE.DoubleSide }));
  mesh(part, lathe(profile.map(([r, y]) => [r, y + YW]), 128), rubber);

  // voile de la jante : un disque percé de fenêtres, puis galbé vers l'extérieur
  const alloy = part.mat(new THREE.MeshStandardMaterial({ color: '#3d4046', roughness: 0.3, metalness: 1 }));
  const face = new THREE.Shape();
  face.absarc(0, 0, 0.67, 0, TAU, false);
  const HALF = 0.022, n = 9;
  const windowPath = (a, b, ri, ro) => {
    const off = (r) => Math.asin(HALF / r);
    const points = [];
    for (let i = 0; i <= n; i++) { const r = lerp(ri, ro, i / n); points.push(v2(r, a + off(r))); }
    for (let i = 1; i < n; i++) points.push(v2(ro, lerp(a + off(ro), b - off(ro), i / n)));
    for (let i = n; i >= 0; i--) { const r = lerp(ri, ro, i / n); points.push(v2(r, b - off(r))); }
    for (let i = n - 1; i > 0; i--) points.push(v2(ri, lerp(a + off(ri), b - off(ri), i / n)));
    return new THREE.Path(points);
  };
  const TWIN = 0.14; // demi-écart entre deux branches jumelles
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU;
    face.holes.push(windowPath(a + TWIN, a + TAU / 5 - TWIN, 0.25, 0.618)); // grande fenêtre
    face.holes.push(windowPath(a - TWIN, a + TWIN, 0.33, 0.618)); // fente entre jumelles
    const hole = new THREE.Path();
    hole.absarc(0.115 * Math.cos(a + TAU / 10), 0.115 * Math.sin(a + TAU / 10), 0.03, 0, TAU, true);
    face.holes.push(hole);
  }
  const bore = new THREE.Path();
  bore.absarc(0, 0, 0.064, 0, TAU, true);
  face.holes.push(bore);
  const faceGeometry = extrude(face, 0.045, 0.022, 0.008, 48);
  const position = faceGeometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const r = Math.hypot(position.getX(i), position.getZ(i));
    position.setY(i, position.getY(i) + 0.135 * step(0.19, 0.66, r));
  }
  faceGeometry.computeVertexNormals();
  mesh(part, faceGeometry, alloy);

  // jante : le tonneau, avec ses deux rebords
  const barrel = [[0.664, 0.25], [0.7, 0.276], [0.734, 0.298], [0.744, 0.286], [0.722, 0.262], [0.7, 0.245], [0.675, 0.2], [0.66, 0.08], [0.645, -0.04], [0.655, -0.18], [0.69, -0.245], [0.722, -0.262], [0.744, -0.286], [0.734, -0.3], [0.704, -0.29]];
  const barrelMaterial = part.mat(new THREE.MeshStandardMaterial({ color: '#34373c', roughness: 0.38, metalness: 1, side: THREE.DoubleSide }));
  mesh(part, lathe(barrel.map(([r, y]) => [r, y + YW]), 96), barrelMaterial);

  // cache-moyeu
  const capTop = canvasTexture(128, (ctx, size) => {
    ctx.fillStyle = '#15171a';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#ff5a1f';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.36, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = 12;
    for (const dx of [-16, 8]) { ctx.beginPath(); ctx.moveTo(size / 2 + dx - 10, size * 0.66); ctx.lineTo(size / 2 + dx + 16, size * 0.34); ctx.stroke(); }
  });
  const capSide = part.mat(new THREE.MeshStandardMaterial({ color: '#1b1d20', roughness: 0.4, metalness: 0.8 }));
  const cap = mesh(part, new THREE.CylinderGeometry(0.056, 0.062, 0.02, 40), [capSide, part.mat(new THREE.MeshStandardMaterial({ map: capTop, roughness: 0.35, metalness: 0.4 })), capSide]);
  cap.position.y = 0.082;
  part.anchor.position.set(-0.985, YW + 0.12, 0);
  return part;
}

// ----- cinq écrous borgnes -----
function buildNuts() {
  const part = makePart('ecrous');
  const chrome = part.mat(new THREE.MeshStandardMaterial({ color: '#d9dbde', roughness: 0.2, metalness: 1 }));
  const body = new THREE.CylinderGeometry(0.029, 0.034, 0.07, 6);
  const dome = new THREE.SphereGeometry(0.027, 16, 8, 0, TAU, 0, Math.PI / 2);
  part.nuts = [];
  for (let k = 0; k < 5; k++) {
    const nut = new THREE.Group();
    nut.position.copy(at(0.115, (k / 5) * TAU + TAU / 10, 0.11));
    mesh(part, body, chrome, nut);
    mesh(part, dome, chrome, nut).position.y = 0.035;
    part.group.add(nut);
    part.nuts.push(nut);
  }
  part.anchor.position.copy(at(0.115, TAU / 2, 0.16));
  return part;
}

// ----- disque ventilé rainuré -----
function buildDisc() {
  const part = makePart('disque');
  const RI = 0.275, RO = 0.52;
  const iron = part.mat(new THREE.MeshStandardMaterial({ color: '#8f9296', roughness: 0.48, metalness: 1, side: THREE.DoubleSide }));
  const plate = (y0, y1) => lathe([[RI, y0], [RO, y0], [RO, y1], [RI, y1], [RI, y0]]);
  mesh(part, plate(YC + 0.0175, YC + 0.0425), iron);
  mesh(part, plate(YC - 0.0425, YC - 0.0175), iron);

  // pistes de freinage : métal brossé en cercles, rainures sombres
  const track = canvasTexture(1024, (ctx, size) => {
    const c = size / 2;
    ctx.fillStyle = '#b9bcc0';
    ctx.fillRect(0, 0, size, size);
    let seed = 7;
    const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 620; i++) {
      const light = rnd() > 0.5;
      ctx.strokeStyle = `rgba(${light ? '255,255,255' : '40,42,46'},${0.05 + rnd() * 0.16})`;
      ctx.lineWidth = 0.6 + rnd() * 1.8;
      ctx.beginPath();
      ctx.arc(c, c, c * (0.5 + rnd() * 0.5), 0, TAU);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(60,62,66,0.5)';
    ctx.lineWidth = 7;
    for (const r of [0.985, 0.545]) { ctx.beginPath(); ctx.arc(c, c, c * r, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = '#1d1e20';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * c * 0.6, c + Math.sin(a) * c * 0.6);
      ctx.lineTo(c + Math.cos(a + 0.3) * c * 0.94, c + Math.sin(a + 0.3) * c * 0.94);
      ctx.stroke();
    }
  });
  const trackMaterial = part.mat(new THREE.MeshStandardMaterial({ map: track, bumpMap: track, bumpScale: 1.2, roughness: 0.34, metalness: 1 }));
  const ring = new THREE.RingGeometry(RI, RO, 96, 1);
  mesh(part, ring, trackMaterial).rotation.x = -Math.PI / 2;
  part.group.children.at(-1).position.y = YC + 0.0432;
  mesh(part, ring, trackMaterial).rotation.x = Math.PI / 2;
  part.group.children.at(-1).position.y = YC - 0.0432;

  // ailettes de ventilation entre les deux pistes
  const vaneMaterial = part.mat(new THREE.MeshStandardMaterial({ color: '#4a4c50', roughness: 0.75, metalness: 0.7 }));
  const vanes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.215, 0.036, 0.013), vaneMaterial, 40);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    dummy.position.copy(at(0.4, a, YC));
    dummy.rotation.set(0, a + 0.32, 0);
    dummy.updateMatrix();
    vanes.setMatrixAt(i, dummy.matrix);
  }
  part.group.add(vanes);

  // bol du disque, peint en noir, avec ses cinq passages de goujons
  const bowl = part.mat(new THREE.MeshStandardMaterial({ color: '#1a1b1e', roughness: 0.5, metalness: 0.55, side: THREE.DoubleSide }));
  mesh(part, lathe([[0.066, 0], [0.226, 0], [0.226, YC + 0.02], [0.285, YC + 0.02], [0.285, YC + 0.04], [0.242, YC + 0.048], [0.242, 0.002], [0.228, 0.014], [0.066, 0.014], [0.066, 0]]), bowl);
  const dark = new THREE.MeshBasicMaterial({ color: '#050506' });
  const hole = new THREE.CircleGeometry(0.026, 20);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU + TAU / 10;
    const front = mesh(part, hole, dark);
    front.position.copy(at(0.115, a, 0.0146));
    front.rotation.x = -Math.PI / 2;
    const back = mesh(part, hole, dark);
    back.position.copy(at(0.115, a, -0.0006));
    back.rotation.x = Math.PI / 2;
  }
  part.anchor.position.set(0.5, YC + 0.05, 0.1);
  return part;
}

// ----- deux plaquettes : support acier et garniture rainurée -----
function buildPads() {
  const part = makePart('plaquettes');
  const steel = part.mat(new THREE.MeshStandardMaterial({ color: '#50545a', roughness: 0.5, metalness: 0.9 }));
  const lining = part.mat(new THREE.MeshStandardMaterial({ color: '#3b342c', roughness: 1, metalness: 0 }));
  const turn = new THREE.Group();
  turn.rotation.y = CALIPER_TURN;
  part.group.add(turn);
  const pad = (side) => {
    const group = new THREE.Group();
    const back = extrude(sector(0.335, 0.518, -0.38, 0.38), 0.011, 0, 0.002);
    const liningA = extrude(sector(0.347, 0.51, -0.355, -0.012), 0.03, 0, 0.002);
    const liningB = extrude(sector(0.347, 0.51, 0.012, 0.355), 0.03, 0, 0.002);
    // côté extérieur : la garniture regarde le disque (vers -Y), le support est derrière elle
    mesh(part, back, steel, group).position.y = side > 0 ? YC + 0.077 : YC - 0.088;
    mesh(part, liningA, lining, group).position.y = side > 0 ? YC + 0.046 : YC - 0.076;
    mesh(part, liningB, lining, group).position.y = side > 0 ? YC + 0.046 : YC - 0.076;
    turn.add(group);
    return group;
  };
  part.outer = pad(1);
  part.inner = pad(-1);
  part.outer.add(part.anchor);
  part.anchor.position.set(0.36, YC + 0.1, 0);
  return part;
}

// ----- étrier fixe peint en orange -----
function buildCaliper() {
  const part = makePart('etrier');
  const paint = part.mat(new THREE.MeshPhysicalMaterial({ color: '#ff5a1f', roughness: 0.4, metalness: 0.1, clearcoat: 0.7, clearcoatRoughness: 0.18 }));
  const steel = part.mat(new THREE.MeshStandardMaterial({ color: '#c3c6ca', roughness: 0.3, metalness: 1 }));
  const turn = new THREE.Group();
  turn.rotation.y = CALIPER_TURN;
  part.group.add(turn);
  const outline = (rIn, rOut, half) => {
    const points = [], n = 16;
    for (let i = 0; i <= n; i++) points.push(v2(rOut, lerp(-half, half, i / n)));
    points.push(v2(rOut - 0.05, half + 0.075), v2(rIn + 0.055, half + 0.075));
    for (let i = n; i >= 0; i--) points.push(v2(rIn, lerp(-half, half, i / n)));
    points.push(v2(rIn + 0.055, -half - 0.075), v2(rOut - 0.05, -half - 0.075));
    return new THREE.Shape(points);
  };
  const body = outline(0.335, 0.6, 0.46);
  mesh(part, extrude(body, 0.062, YC + 0.1, 0.011), paint, turn);
  mesh(part, extrude(body, 0.062, YC - 0.162, 0.011), paint, turn);
  // ponts au-dessus de la tranche du disque, ouverts au centre sur les plaquettes
  for (const [a0, a1] of [[0.27, 0.54], [-0.54, -0.27], [-0.05, 0.05]]) mesh(part, extrude(sector(0.537, 0.6, a0, a1, 8), 0.2, YC - 0.1, 0.006), paint, turn);
  // logements de pistons
  const boss = new THREE.CylinderGeometry(0.056, 0.06, 0.022, 28);
  for (const side of [1, -1]) for (const a of [-0.29, 0.29]) mesh(part, boss, paint, turn).position.copy(at(0.455, a, YC + side * 0.181));
  // axes de maintien des plaquettes, vis de purge
  const pin = new THREE.CylinderGeometry(0.008, 0.008, 0.2, 10);
  for (const a of [-0.16, 0.16]) mesh(part, pin, steel, turn).position.copy(at(0.558, a, YC));
  const bleed = mesh(part, new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8), steel, turn);
  bleed.position.copy(at(0.6, 0.38, YC - 0.12));
  bleed.rotation.z = -Math.PI / 2;
  bleed.rotation.y = -0.38;
  // marquage
  const logo = canvasTexture(256, (ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 118px "Archivo", "Arial Black", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A31', size / 2, size / 2 + 6);
  });
  const sign = mesh(part, new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: logo, transparent: true, alphaTest: 0.4 }), turn);
  sign.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  sign.position.copy(at(0.47, 0, YC + 0.1745));
  part.sign = sign;
  turn.add(part.anchor);
  part.anchor.position.copy(at(0.62, 0, YC + 0.12));
  return part;
}

// ----- moyeu, goujons, porte-moyeu, soufflet de transmission -----
function buildHub() {
  const part = makePart('moyeu');
  const zinc = part.mat(new THREE.MeshStandardMaterial({ color: '#7d8187', roughness: 0.42, metalness: 1, side: THREE.DoubleSide }));
  const bright = part.mat(new THREE.MeshStandardMaterial({ color: '#c9ccd0', roughness: 0.3, metalness: 1 }));
  const cast = part.mat(new THREE.MeshStandardMaterial({ color: '#2b2d31', roughness: 0.68, metalness: 0.75 }));
  const boot = part.mat(new THREE.MeshStandardMaterial({ color: '#141516', roughness: 0.8, metalness: 0, side: THREE.DoubleSide }));
  mesh(part, lathe([[0, -0.38], [0.13, -0.38], [0.14, -0.37], [0.14, -0.035], [0.2, -0.03], [0.2, 0], [0.062, 0], [0.062, 0.04], [0.05, 0.052], [0, 0.052]], 64), zinc);
  const stud = new THREE.CylinderGeometry(0.017, 0.017, 0.17, 12);
  for (let k = 0; k < 5; k++) mesh(part, stud, bright).position.copy(at(0.115, (k / 5) * TAU + TAU / 10, 0.07));
  const axleNut = mesh(part, new THREE.CylinderGeometry(0.03, 0.03, 0.022, 6), bright);
  axleNut.position.y = 0.062;

  // porte-moyeu forgé : un anneau autour du roulement, des bras vers la jambe de force, la rotule,
  // la biellette de direction et les deux pattes de l'étrier
  const caliperAngle = Math.atan2(-0.6, -0.8);
  const lobes = [[Math.PI, 0.6, 0.2], [0, 0.48, 0.24], [1.25, 0.42, 0.15], [caliperAngle - 0.5, 0.4, 0.1], [caliperAngle + 0.5, 0.4, 0.1]];
  const points = [];
  for (let i = 0; i < 160; i++) {
    const a = (i / 160) * TAU;
    let r = 0.19;
    for (const [center, length, spread] of lobes) {
      const delta = Math.atan2(Math.sin(a - center), Math.cos(a - center));
      r = Math.max(r, 0.19 + (length - 0.19) * Math.exp(-((delta / spread) ** 2)));
    }
    points.push(v2(r, a));
  }
  mesh(part, extrude(new THREE.Shape(points), 0.06, -0.36, 0.012), cast);
  const bossTop = mesh(part, new THREE.CylinderGeometry(0.075, 0.075, 0.13, 20), cast);
  bossTop.position.copy(at(0.56, Math.PI, -0.33));
  const bossLow = mesh(part, new THREE.CylinderGeometry(0.06, 0.06, 0.11, 20), cast);
  bossLow.position.copy(at(0.45, 0, -0.33));

  // arbre de transmission et son soufflet
  const ribs = [[0.045, -0.62], [0.045, -0.6], [0.075, -0.595]];
  for (let i = 0; i <= 5; i++) {
    const y = -0.585 + i * 0.04;
    ribs.push([0.07 + i * 0.011, y], [0.095 + i * 0.011, y + 0.02]);
  }
  ribs.push([0.125, -0.375]);
  mesh(part, lathe(ribs, 48), boot);
  part.anchor.position.set(0, -0.015, 0.2);
  return part;
}
