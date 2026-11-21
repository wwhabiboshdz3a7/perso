// Les Terrasses du Canal — maquette interactive du bâtiment A.
// Un volume procédural de six niveaux posé sur un plan de masse dessiné : chaque lot est un bloc
// que l'on survole, touche ou parcourt au clavier. L'état (sélection, filtres, jour / soir) vit
// dans programme.js ; ce fichier n'en est que la vue en trois dimensions.

import * as THREE from 'three';
import { softDisc } from '../../assets/premium/kit.js';
import { LOTS, STATUS, state, subscribe, matches, selectLot, hoverLot, stepLot, euros } from './programme.js';

const canvas = document.querySelector('[data-maquette]');
const stage = canvas?.closest('[data-stage]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- gabarit de l'immeuble (mètres) ----------
const H = 3.1; // d'un plancher au suivant
const SLAB = 0.34; // épaisseur des dalles
const BACK = -6; // façade arrière
const LIP = 0.28; // débord des nez de dalle
// front : nu de la façade côté canal ; edge : bord de la terrasse (ou du jardin au rez-de-chaussée)
const LEVELS = [
  { x0: -15, x1: 15, front: 6, edge: 11.5 },
  { x0: -15, x1: 15, front: 6, edge: 7.9 },
  { x0: -15, x1: 15, front: 6, edge: 7.9 },
  { x0: -15, x1: 15, front: 3.6, edge: 7.9 },
  { x0: -15, x1: 13, front: 1.2, edge: 3.6 },
  { x0: -11, x1: 9, front: -1.4, edge: 1.2 },
];
const CENTER = { x: 0, z: -3 };
const RADIUS = 35;
const SUN = new THREE.Vector3(0.8, -1.5, -0.9).normalize(); // sens de la lumière du jour
const QUAY_TREES = [-22, -11, 0, 11, 22].map((x) => ({ x, z: 16.6 }));
const GARDEN_TREES = [{ x: -10, z: -11.5 }, { x: -2.5, z: -14 }, { x: 5.5, z: -10.5 }, { x: 12, z: -13.5 }];
const LAMPS = [-17.5, -10.5, -3.5, 3.5, 10.5, 17.5].map((x) => ({ x, z: 13.4 }));

const color = (hex) => new THREE.Color(hex);
const INK = color('#17332a'), PAPER = color('#f3efe7'), ACCENT = color('#c8553d');
const C = {
  concrete: color('#ebe5d8'), wood: color('#b98a5c'), woodPale: color('#cfa77c'), rail: color('#30463f'),
  planter: color('#dcd4c4'), deck: color('#d2bd9d'), hedge: color('#6a8f66'), bark: color('#cfc5b2'),
  ghost: color('#f4f0e7'), ghostLine: color('#e0d9ca'),
  greens: ['#5f8a55', '#7fa468', '#44704d', '#9db87c', '#6d9a6a'].map(color),
  canopy: ['#6f9463', '#86a874', '#5c8558'].map(color),
  olive: color('#93a88e'),
  blooms: ['#f1e9da', '#e7b3a2', '#d98a6d'].map(color),
};
const BASE = { dispo: color('#dd9c82'), option: color('#e8c56e'), vendu: color('#cdc8bb') };

if (canvas) {
  start().catch((error) => {
    console.error('[terrasses du canal] maquette 3D indisponible', error);
    canvas.closest('.maq')?.classList.add('no-3d');
  });
}

// ---------- assemblage de géométries : boîtes et feuillages fusionnés, couleur par sommet ----------
const UNIT = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
const BLOBS = [0, 1].map((detail) => {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  geometry.computeVertexNormals(); // facettes franches : feuillage de maquette
  return geometry;
});
const matrix = new THREE.Matrix4(), normalMatrix = new THREE.Matrix3(), vector = new THREE.Vector3();
const position = new THREE.Vector3(), scale = new THREE.Vector3(), quaternion = new THREE.Quaternion(), euler = new THREE.Euler();
const WHITE = color('#ffffff');

class Batch {
  constructor() { this.positions = []; this.normals = []; this.colors = []; }
  add(geometry, tint) {
    const p = geometry.attributes.position, n = geometry.attributes.normal;
    normalMatrix.getNormalMatrix(matrix);
    for (let i = 0; i < p.count; i++) {
      vector.fromBufferAttribute(p, i).applyMatrix4(matrix);
      this.positions.push(vector.x, vector.y, vector.z);
      vector.fromBufferAttribute(n, i).applyMatrix3(normalMatrix).normalize();
      this.normals.push(vector.x, vector.y, vector.z);
      this.colors.push(tint.r, tint.g, tint.b);
    }
    return this;
  }
  // boîte donnée par son centre
  box(w, h, d, x, y, z, tint = WHITE) {
    matrix.compose(position.set(x, y, z), quaternion.identity(), scale.set(w, h, d));
    return this.add(UNIT, tint);
  }
  // boîte donnée par ses bornes
  span(x0, x1, y0, y1, z0, z1, tint = WHITE) {
    return this.box(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, tint);
  }
  blob(r, x, y, z, tint, squash = 1, detail = 0, turn = 0) {
    matrix.compose(position.set(x, y, z), quaternion.setFromEuler(euler.set(turn * 2.1, turn * 5.3, turn * 3.7)), scale.set(r, r * squash, r));
    return this.add(BLOBS[detail], tint);
  }
  get empty() { return this.positions.length === 0; }
  geometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    return geometry;
  }
  mesh(material) { return new THREE.Mesh(this.geometry(), material); }
}

async function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  try { await Promise.race([document.fonts.load('600 40px "JetBrains Mono"'), new Promise((resolve) => setTimeout(resolve, 1200))]); } catch { /* police de secours */ }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 8, 400);
  const hemi = new THREE.HemisphereLight('#ffffff', '#d9ccb6', 1.5);
  const sun = new THREE.DirectionalLight('#fff0da', 1.85);
  sun.position.copy(SUN).multiplyScalar(-80);
  const fill = new THREE.DirectionalLight('#dfe8ff', 0.5);
  fill.position.set(40, 25, -50);
  scene.add(hemi, sun, fill);
  const DAY = { sky: color('#ffffff'), ground: color('#d9ccb6'), sun: color('#fff0da') };
  const NIGHT = { sky: color('#8fa3cc'), ground: color('#22383a'), sun: color('#9fb4e4') };

  // ---------- matières ----------
  const matte = new THREE.MeshLambertMaterial({ vertexColors: true });
  const glassDark = new THREE.MeshLambertMaterial({ color: '#5d7c75' });
  const glassLit = ['#ffc980', '#ffe0ae'].map((glow) => new THREE.MeshLambertMaterial({ color: '#5d7c75', emissive: glow, emissiveIntensity: 0 }));
  const glassPale = new THREE.MeshLambertMaterial({ color: '#b9c7c0' });
  const glassPaleLit = new THREE.MeshLambertMaterial({ color: '#b9c7c0', emissive: '#ffd596', emissiveIntensity: 0 });
  const railGlass = new THREE.MeshLambertMaterial({ color: '#d5e4dd', transparent: true, opacity: 0.34, depthWrite: false });
  const lampMaterial = new THREE.MeshBasicMaterial({ color: '#d8d0c0' });
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: INK, transparent: true, opacity: 0.15, depthWrite: false,
    stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc, stencilZPass: THREE.ReplaceStencilOp, // chaque pixel d'ombre une seule fois
  });
  const brick = brickTexture();
  const tinted = []; // traits et étiquettes : encre le jour, papier le soir

  // ---------- plan de masse ----------
  const disc = new THREE.Mesh(new THREE.CircleGeometry(RADIUS, 96).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: groundTexture() }));
  disc.position.set(CENTER.x, 0, CENTER.z);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(RADIUS, RADIUS, 1, 96, 1, true), new THREE.MeshLambertMaterial({ color: '#ddd5c5' }));
  base.position.set(CENTER.x, -0.5, CENTER.z);
  const contact = softDisc({ radius: RADIUS * 1.22, color: '#17332a', opacity: 0.2, y: -1 });
  contact.position.x = CENTER.x; contact.position.z = CENTER.z;
  scene.add(disc, base, contact);

  // ---------- structure : dalles, refends, hall, toiture ----------
  const frame = new Batch(), shadow = new Batch(), context = new Batch();
  const frameLit = new Batch(), contextDark = new Batch(), contextLit = new Batch();
  const slab = (x0, x1, y, z1, thick = SLAB) => {
    frame.span(x0 - LIP, x1 + LIP, y - thick / 2, y + thick / 2, BACK - LIP, z1 + LIP, C.concrete);
    shadow.span(x0 - LIP, x1 + LIP, y - thick / 2, y + thick / 2, BACK - LIP, z1 + LIP);
  };
  frame.span(-15 - LIP, 15 + LIP, 0, SLAB / 2, BACK - LIP, 6 + LIP, C.concrete); // soubassement
  for (let k = 1; k <= 5; k++) slab(Math.min(LEVELS[k - 1].x0, LEVELS[k].x0), Math.max(LEVELS[k - 1].x1, LEVELS[k].x1), k * H, LEVELS[k].edge);
  slab(-11.9, 9.9, 6 * H - 0.03, 0.4, 0.28); // casquette de l'attique
  LEVELS.forEach((level, k) => shadow.span(level.x0, level.x1, k * H, (k + 1) * H, BACK, level.front));
  // hall d'entrée, entre les deux jardins du rez-de-chaussée
  frame.span(-4, 0, SLAB / 2, H - SLAB / 2, BACK, 5.6, C.concrete);
  frame.span(-4.4, 0.4, 2.62, 2.74, 5.6, 7.4, C.concrete);
  for (let i = 0; i < 6; i++) frame.box(0.1, H - SLAB - 0.2, 0.1, -3.75 + i * 0.22, H / 2, 5.7, C.wood);
  frameLit.box(2.2, 2.3, 0.1, -1.25, SLAB / 2 + 1.2, 5.64);
  // édicule technique et panneaux en toiture
  frame.span(-2, 2, 6 * H + 0.1, 6 * H + 1.2, -5, -2.4, C.concrete);
  for (let i = 0; i < 5; i++) frame.box(2.2, 0.08, 1.2, -9.6 + i * 2.5, 6 * H + 0.3, -4.2, C.rail);

  // ---------- les lots ----------
  const lots = [];
  const picks = [];
  const rnd = mulberry(11);
  for (const data of LOTS) {
    const k = data.level, level = LEVELS[k];
    const y0 = k * H + SLAB / 2, y1 = (k + 1) * H - SLAB / 2;
    const w = data.x1 - data.x0, h = y1 - y0, d = level.front - BACK;
    const geometry = new THREE.BoxGeometry(w, h, d);
    worldUV(geometry, w, h, d, 2.4);
    const material = new THREE.MeshLambertMaterial({ map: brick, color: BASE[data.status].clone() });
    const body = new THREE.Mesh(geometry, material);
    body.position.set((data.x0 + data.x1) / 2, (y0 + y1) / 2, (level.front + BACK) / 2);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0 }));
    edges.position.copy(body.position);
    edges.scale.setScalar(1.004);

    const parts = { matte: new Batch(), dark: new Batch(), litA: new Batch(), litB: new Batch(), rail: new Batch() };
    decorate(data, k, parts, rnd);
    const details = new THREE.Group();
    for (const [batch, mat] of [[parts.matte, matte], [parts.dark, glassDark], [parts.litA, glassLit[0]], [parts.litB, glassLit[1]], [parts.rail, railGlass]]) {
      if (!batch.empty) details.add(batch.mesh(mat));
    }
    scene.add(body, edges, details);

    // volumes de visée : l'appartement et sa terrasse (jamais dessinés)
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(terraceSpan(data, k)[1] - terraceSpan(data, k)[0], k === 0 ? 1.2 : 1.6, level.edge - level.front));
    terrace.position.set((terraceSpan(data, k)[0] + terraceSpan(data, k)[1]) / 2, y0 + (k === 0 ? 0.6 : 0.8), (level.front + level.edge) / 2);
    for (const pick of [body, terrace]) {
      pick.userData.lot = data.id;
      pick.updateMatrixWorld(true);
      picks.push(pick);
    }
    lots.push({ data, body, edges, details, material, opacity: 1, edge: 0, anchor: new THREE.Vector3(body.position.x, y1 + 0.35, level.front + 0.2) });
    // refend clair entre deux lots voisins
    if (data.x1 !== level.x1) frame.span(data.x1 - 0.16, data.x1 + 0.16, y0, y1, level.front - 0.3, level.front + LIP, C.concrete);
    if (k === 0 && data.x1 === -4) frame.span(-4.16, -3.84, y0, y1, 5.6, 6 + LIP, C.concrete);
  }

  // ---------- contexte : bâtiment B, platanes du quai, jardin, lampadaires ----------
  context.span(-15, 9, 0, 4 * H, -30, -19, C.ghost);
  shadow.span(-15, 9, 0, 4 * H, -30, -19);
  for (let k = 1; k <= 4; k++) context.span(-15.2, 9.2, k * H - 0.1, k * H + 0.1, -30.2, -18.8, C.ghostLine);
  const rb = mulberry(5);
  for (let k = 0; k < 4; k++) {
    for (let i = 0; i < 7; i++) (rb() < 0.5 ? contextLit : contextDark).box(1.9, 1.9, 0.1, -13 + i * 3.35, k * H + 1.45, -18.96);
    for (let i = 0; i < 3; i++) contextDark.box(0.1, 1.8, 1.3, 9.04, k * H + 1.45, -27.5 + i * 3.4);
  }
  // le toit-terrasse partagé : bacs de potager, pergola, grande table
  const roofB = 4 * H + 0.1;
  context.span(-14.6, 8.6, roofB, roofB + 0.5, -29.6, -29.3, C.ghostLine).span(-14.6, 8.6, roofB, roofB + 0.5, -19.7, -19.4, C.ghostLine);
  for (let i = 0; i < 6; i++) {
    const x = -12 + i * 2.6, z = i % 2 ? -26.8 : -22.6;
    context.box(1.9, 0.6, 3.2, x, roofB + 0.3, z, C.wood);
    for (let j = 0; j < 5; j++) context.blob(0.42 + rb() * 0.2, x + (rb() - 0.5) * 0.9, roofB + 0.8, z - 1.2 + j * 0.6, C.greens[(i + j) % 5], 0.8, 0, rb());
  }
  for (const [x, z] of [[4, -28], [8, -28], [4, -23], [8, -23]]) context.box(0.14, 2.4, 0.14, x, roofB + 1.2, z, C.woodPale);
  for (let i = 0; i < 6; i++) context.box(4.6, 0.1, 0.14, 6, roofB + 2.45, -28 + i, C.woodPale);
  context.box(2.6, 0.08, 1, 6, roofB + 0.78, -25.5, C.woodPale);

  const tree = (spot, size, seed) => {
    context.box(0.4 * size, 4.2 * size, 0.4 * size, spot.x, 2.1 * size, spot.z, C.bark);
    for (let i = 0; i < 3; i++) {
      const r = (1.5 + seed() * 0.5) * size, x = spot.x + (seed() - 0.5) * 1.6 * size, y = (4.6 + seed() * 1.3) * size, z = spot.z + (seed() - 0.5) * 1.6 * size;
      context.blob(r, x, y, z, C.canopy[i], 0.82, 1, seed());
      matrix.compose(position.set(x, y, z), quaternion.identity(), scale.set(r, r * 0.82, r));
      shadow.add(BLOBS[0], WHITE);
    }
  };
  QUAY_TREES.forEach((spot) => tree(spot, 0.9, rb));
  GARDEN_TREES.forEach((spot) => tree(spot, 0.8, rb));
  const lampHeads = new Batch();
  for (const lamp of LAMPS) {
    context.box(0.1, 3.4, 0.1, lamp.x, 1.7, lamp.z, C.rail);
    lampHeads.box(0.5, 0.14, 0.26, lamp.x, 3.45, lamp.z + 0.14);
  }

  // l'ombre portée : les volumes aplatis sur le sol, le long de la lumière
  const flat = shadow.positions;
  for (let i = 0; i < flat.length; i += 3) {
    const y = flat[i + 1];
    flat[i] -= (SUN.x / SUN.y) * y;
    flat[i + 2] -= (SUN.z / SUN.y) * y;
    flat[i + 1] = 0.07;
  }
  const shadowMesh = shadow.mesh(shadowMaterial);
  shadowMesh.renderOrder = 1;
  const glows = softDisc({ radius: 4.2, color: '#ffd9a0', opacity: 0, additive: true, y: 0.1 });
  const glowGroup = new THREE.Group();
  for (const lamp of LAMPS) {
    const glow = glows.clone();
    glow.position.set(lamp.x, 0.1, lamp.z + 0.3);
    glowGroup.add(glow);
  }
  scene.add(frame.mesh(matte), frameLit.mesh(glassLit[0]), context.mesh(matte), contextDark.mesh(glassPale), contextLit.mesh(glassPaleLit), lampHeads.mesh(lampMaterial), shadowMesh, glowGroup);

  // ---------- cotes : l'échelle des niveaux et les repères ----------
  const lines = [];
  const ruleX = 17.8, ruleZ = 8.6;
  lines.push(ruleX, 0, ruleZ, ruleX, 6 * H, ruleZ);
  for (let k = 0; k <= 6; k++) lines.push(ruleX - 0.45, k * H, ruleZ, ruleX + 0.45, k * H, ruleZ);
  const rule = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lines, 3)), new THREE.LineBasicMaterial({ color: INK }));
  tinted.push(rule.material);
  scene.add(rule);
  ['RDC', 'R+1', 'R+2', 'R+3', 'R+4', 'R+5'].forEach((text, k) => scene.add(label(text, ruleX + 2.1, k * H + H / 2, ruleZ, 0.95)));
  scene.add(label('18,60 m', ruleX + 1.2, 6 * H + 1.1, ruleZ, 0.95));
  scene.add(label('BÂT. B · TOIT-TERRASSE PARTAGÉ', -3, 4 * H + 4.6, -24.5, 0.95));

  function label(text, x, y, z, height) {
    const sheet = document.createElement('canvas');
    const ctx = sheet.getContext('2d');
    const font = '600 56px "JetBrains Mono", ui-monospace, monospace';
    ctx.font = font;
    sheet.width = Math.ceil(ctx.measureText(text).width) + 24;
    sheet.height = 80;
    ctx.font = font;
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 12, 42);
    const texture = new THREE.CanvasTexture(sheet);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, color: INK, transparent: true, depthWrite: false });
    tinted.push(material);
    const sprite = new THREE.Sprite(material);
    sprite.scale.set((height * sheet.width) / sheet.height, height, 1);
    sprite.position.set(x, y, z);
    return sprite;
  }

  // ---------- caméra en orbite : la lumière reste fixe, l'immeuble semble tourner ----------
  const target = new THREE.Vector3(1, 6.6, 0);
  let yaw = -0.62, pitch = 0.46, velocity = 0, dragging = false, moved = 0, lastX = 0, lastY = 0, touched = false, clock = 0;
  const pointer = new THREE.Vector2(), raycaster = new THREE.Raycaster();
  const pin = stage.querySelector('[data-pin]'), tip = stage.querySelector('[data-tip]');
  const projected = new THREE.Vector3();

  function pickAt(event) {
    const box = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(picks, false)[0];
    return hit ? hit.object.userData.lot : null;
  }
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true; touched = true; moved = 0;
    lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    wake();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (dragging) {
      const dx = event.clientX - lastX, dy = event.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      yaw -= dx * 0.008;
      pitch = clamp(pitch + dy * 0.005, 0.16, 1.2);
      velocity = -dx * 0.5;
      lastX = event.clientX; lastY = event.clientY;
      wake();
    } else if (event.pointerType === 'mouse') {
      const id = pickAt(event);
      hoverLot(id);
      canvas.style.cursor = id ? 'pointer' : 'grab';
      if (id && tip) {
        const lot = LOTS.find((item) => item.id === id), box = stage.getBoundingClientRect();
        tip.textContent = `${lot.id} · T${lot.rooms} · ${lot.area} m² · ${euros(lot.price)} · ${STATUS[lot.status].label}`;
        tip.hidden = false;
        tip.style.transform = `translate(${clamp(event.clientX - box.left + 16, 8, box.width - tip.offsetWidth - 8)}px, ${event.clientY - box.top + 18}px)`;
      } else if (tip) tip.hidden = true;
    }
  });
  canvas.addEventListener('pointerup', (event) => {
    if (dragging && moved < 7) {
      const id = pickAt(event);
      if (id) selectLot(id);
      velocity = 0;
    }
    dragging = false;
  });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('pointerleave', () => { hoverLot(null); if (tip) tip.hidden = true; });
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') yaw -= 0.18;
    else if (event.key === 'ArrowRight') yaw += 0.18;
    else if (event.key === 'ArrowUp') stepLot(1);
    else if (event.key === 'ArrowDown') stepLot(-1);
    else return;
    touched = true;
    event.preventDefault();
    wake();
  });

  // ---------- rendu : seulement à l'écran, et seulement quand quelque chose change ----------
  let visible = false, awakeUntil = 0, last = performance.now(), nightAmount = 0;
  const scratch = new THREE.Color();
  function wake() { awakeUntil = performance.now() + 1800; }
  subscribe(wake);
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

  function frame_(now) {
    requestAnimationFrame(frame_);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const idle = !touched && !reduced; // tant qu'on n'y a pas touché, la maquette oscille doucement
    if (!visible || (!idle && now > awakeUntil)) return;
    clock += dt;
    const ease = reduced ? 1 : 1 - Math.exp(-9 * dt);

    if (!dragging) {
      yaw += velocity * dt * 0.02;
      velocity = lerp(velocity, 0, 1 - Math.exp(-4 * dt));
      if (Math.abs(velocity) > 0.5) wake();
    }
    const sway = idle ? Math.sin(clock * 0.35) * 0.16 : 0;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max((camera.aspect > 1.15 ? 28 : 19.5) / (tanHalf * camera.aspect), 15 / tanHalf);
    const angle = yaw + sway;
    camera.position.set(target.x + Math.sin(angle) * Math.cos(pitch) * distance, target.y + Math.sin(pitch) * distance, target.z + Math.cos(angle) * Math.cos(pitch) * distance);
    camera.lookAt(target);

    // jour / soir
    nightAmount = reduced ? Number(state.night) : lerp(nightAmount, Number(state.night), 1 - Math.exp(-3.2 * dt));
    if (Math.abs(nightAmount - Number(state.night)) > 0.004) wake();
    const n = nightAmount;
    hemi.color.lerpColors(DAY.sky, NIGHT.sky, n);
    hemi.groundColor.lerpColors(DAY.ground, NIGHT.ground, n);
    hemi.intensity = lerp(1.5, 0.95, n);
    sun.color.lerpColors(DAY.sun, NIGHT.sun, n);
    sun.intensity = lerp(1.85, 0.4, n);
    fill.intensity = lerp(0.5, 0.12, n);
    glassLit[0].emissiveIntensity = n * 1.25;
    glassLit[1].emissiveIntensity = n * 1.05;
    glassPaleLit.emissiveIntensity = n * 0.8;
    shadowMaterial.opacity = 0.15 * (1 - n);
    glows.material.opacity = 0.5 * n;
    lampMaterial.color.set('#d8d0c0').lerp(scratch.set('#ffe7b8'), n);
    for (const material of tinted) material.color.lerpColors(INK, PAPER, n);

    // les lots : couleur de statut, surbrillance, estompage
    for (const lot of lots) {
      const selected = state.selected === lot.data.id, hovered = state.hover === lot.data.id;
      const on = matches(lot.data) || selected || hovered;
      scratch.copy(BASE[lot.data.status]);
      if (selected) scratch.copy(ACCENT);
      else if (hovered) scratch.lerp(ACCENT, 0.5);
      lot.material.color.lerp(scratch, ease);
      lot.material.emissive.copy(lot.material.color).multiplyScalar(n * (selected || hovered ? 0.5 : 0.16));
      lot.opacity = lerp(lot.opacity, on ? 1 : 0.1, ease);
      lot.edge = lerp(lot.edge, selected || hovered ? 1 : on ? 0 : 0.3, ease);
      if (Math.abs(lot.opacity - (on ? 1 : 0.1)) > 0.01) wake();
      const ghost = lot.opacity < 0.985;
      if (lot.material.transparent !== ghost) {
        lot.material.transparent = ghost;
        lot.material.depthWrite = !ghost;
        lot.material.needsUpdate = true;
      }
      lot.material.opacity = ghost ? lot.opacity : 1;
      lot.details.visible = lot.opacity > 0.5;
      lot.edges.material.opacity = lot.edge;
      lot.edges.visible = lot.edge > 0.02;
      lot.edges.material.color.lerpColors(INK, PAPER, selected || hovered ? n : n * 0.6);
    }

    renderer.render(scene, camera);

    // l'étiquette du lot sélectionné suit son bloc
    const chosen = lots.find((lot) => lot.data.id === state.selected);
    if (pin) {
      if (chosen) {
        projected.copy(chosen.anchor).project(camera);
        pin.hidden = false;
        pin.textContent = `${chosen.data.id} · T${chosen.data.rooms}`;
        pin.style.transform = `translate(${((projected.x + 1) / 2) * canvas.clientWidth}px, ${((1 - projected.y) / 2) * canvas.clientHeight - 22}px) translate(-50%, -100%)`;
      } else pin.hidden = true;
    }
  }
  resize();
  requestAnimationFrame(frame_);
  canvas.closest('.maq')?.classList.add('is-ready');
}

// Emprise de la terrasse d'un lot : celles des angles et de l'attique débordent du logement.
function terraceSpan(lot, k) {
  if (k === 5) return [-15, 13];
  if (k === 4 && lot.x1 === 13) return [lot.x0, 15];
  return [lot.x0, lot.x1];
}

// Tout ce qui habille un lot : baies, garde-corps, claustras, jardinières, mobilier, jardin.
function decorate(lot, k, parts, rnd) {
  const level = LEVELS[k];
  const y0 = k * H + SLAB / 2, y1 = (k + 1) * H - SLAB / 2, h = y1 - y0;
  const f = level.front, e = level.edge, w = lot.x1 - lot.x0;
  const leftEnd = lot.x0 === level.x0, rightEnd = lot.x1 === level.x1;
  const pane = () => (rnd() < 0.34 ? parts.dark : rnd() < 0.5 ? parts.litA : parts.litB);
  const { matte, rail } = parts;

  // baies vitrées sur le canal, fenêtres à l'arrière et en pignon
  const bays = Math.max(1, Math.round((w - 1) / 3.7));
  for (let i = 0; i < bays; i++) pane().box(Math.min(2.3, w / bays - 1.3), h - 0.4, 0.1, lot.x0 + (w * (i + 0.5)) / bays, y0 + (h - 0.4) / 2 + 0.03, f + 0.03);
  const rear = Math.max(1, Math.round(w / 4.2));
  for (let i = 0; i < rear; i++) pane().box(1.3, 1.5, 0.1, lot.x0 + (w * (i + 0.5)) / rear, y0 + 1.65, BACK - 0.03);
  const depth = f - BACK;
  for (const [end, x] of [[leftEnd, lot.x0 - 0.03], [rightEnd, lot.x1 + 0.03]]) {
    if (!end) continue;
    const count = k === 5 ? 2 : Math.max(2, Math.round(depth / 4));
    for (let i = 0; i < count; i++) pane().box(0.1, k === 5 ? h - 0.4 : 1.9, k === 5 ? 1.8 : 0.95, x, y0 + (k === 5 ? (h - 0.4) / 2 + 0.03 : 1.35), BACK + (depth * (i + 0.5)) / count);
  }

  const greenery = (x, y, z, length, along = 'x') => {
    const count = Math.max(2, Math.round(length / 0.46));
    for (let i = 0; i < count; i++) {
      const t = -length / 2 + (length * (i + 0.5)) / count, r = 0.27 + rnd() * 0.2;
      const px = along === 'x' ? x + t : x + (rnd() - 0.5) * 0.12, pz = along === 'x' ? z + (rnd() - 0.5) * 0.12 : z + t;
      matte.blob(r, px, y + r * 0.55, pz, C.greens[Math.floor(rnd() * 5)], 0.85, 0, rnd());
      if (rnd() < 0.2) matte.blob(0.2 + rnd() * 0.08, px + 0.05, y + r * 1.1 + 0.08, pz, C.blooms[Math.floor(rnd() * 3)], 0.8, 0, rnd());
    }
  };

  if (k === 0) {
    // rez-de-jardin : terrasse en bois, haies, un ou deux arbres
    matte.span(lot.x0 + 0.4, lot.x1 - 0.4, 0.02, 0.14, f + 0.1, f + 3, C.deck);
    matte.span(lot.x0 + 0.2, lot.x1 - 0.2, 0, 1.05, e - 0.55, e, C.hedge);
    for (const x of [lot.x0 + 0.3, lot.x1 - 0.3]) matte.span(x - 0.28, x + 0.28, 0, 1.05, f + 0.3, e - 0.5, C.hedge);
    const trees = w > 12 ? 2 : 1;
    for (let i = 0; i < trees; i++) {
      const x = lot.x0 + (w * (i + 0.6)) / (trees + 0.3), z = f + 3.9;
      matte.box(0.16, 1.9, 0.16, x, 0.95, z, C.bark);
      matte.blob(1.15, x, 2.5, z, C.olive, 0.85, 1, rnd()).blob(0.8, x + 0.6, 2.9, z - 0.3, C.greens[3], 0.85, 1, rnd());
    }
    matte.box(1.5, 0.06, 0.8, lot.x0 + w * 0.3, 0.86, f + 1.6, C.woodPale);
    for (const dx of [-0.5, 0.5]) matte.box(0.4, 0.42, 0.4, lot.x0 + w * 0.3 + dx, 0.35, f + 2.4, C.woodPale);
    return;
  }

  // garde-corps : montants, main courante, remplissage vitré
  const fence = (xa, za, xb, zb) => {
    const length = Math.hypot(xb - xa, zb - za), alongX = Math.abs(xb - xa) > Math.abs(zb - za);
    const cx = (xa + xb) / 2, cz = (za + zb) / 2;
    matte.box(alongX ? length : 0.07, 0.07, alongX ? 0.07 : length, cx, y0 + 1.05, cz, C.rail);
    rail.box(alongX ? length : 0.03, 0.9, alongX ? 0.03 : length, cx, y0 + 0.55, cz);
    const posts = Math.max(2, Math.round(length / 1.7) + 1);
    for (let i = 0; i < posts; i++) matte.box(0.06, 1.05, 0.06, lerp(xa, xb, i / (posts - 1)), y0 + 0.525, lerp(za, zb, i / (posts - 1)), C.rail);
  };
  const [tx0, tx1] = terraceSpan(lot, k);
  fence(tx0 + 0.1, e - 0.1, tx1 - 0.1, e - 0.1);
  if (tx0 === -15) fence(-14.9, k === 5 ? BACK + 0.1 : f, -14.9, e - 0.1);
  if (tx1 === 15 || (k === 5 && tx1 === 13)) fence(tx1 - 0.1, k >= 4 ? BACK + 0.1 : f, tx1 - 0.1, e - 0.1);
  if (k === 5) fence(-14.9, BACK + 0.1, -11, BACK + 0.1), fence(9, BACK + 0.1, 12.9, BACK + 0.1);
  if (k === 4 && tx1 === 15) fence(13, BACK + 0.1, 14.9, BACK + 0.1);

  // claustra en bois entre deux terrasses voisines
  if (!rightEnd) {
    const count = Math.floor((e - f - 0.5) / 0.26);
    for (let i = 0; i < count; i++) matte.box(0.08, 1.9, 0.13, lot.x1 - 0.22, y0 + 0.95, f + 0.3 + i * 0.26, C.wood);
  }
  // loggias des deux premiers étages : un pan de claustra toute hauteur, comme sur la façade réelle
  if (k <= 2) {
    const start = rnd() < 0.5 ? lot.x0 + 0.5 : lot.x1 - 2.6;
    for (let i = 0; i < 9; i++) matte.box(0.11, h, 0.09, start + i * 0.24, y0 + h / 2, e - 0.2, i % 2 ? C.wood : C.woodPale);
  }

  // jardinières le long du garde-corps
  const span = tx1 - tx0, boxes = Math.max(1, Math.round(span / 5.2));
  for (let i = 0; i < boxes; i++) {
    const room = span / boxes, length = room * (0.42 + rnd() * 0.26), x = tx0 + room * i + length / 2 + 0.5 + rnd() * (room - length - 1);
    matte.box(length, 0.55, 0.5, x, y0 + 0.275, e - 0.48, C.planter);
    greenery(x, y0 + 0.55, e - 0.48, length - 0.2);
    for (let j = 0; j < 3; j++) if (rnd() < 0.55) matte.blob(0.2, x + (rnd() - 0.5) * length * 0.8, y0 + 0.2 - j * 0.3, e + 0.14, C.greens[1 + (j % 3)], 1.2, 0, rnd());
  }
  if (k >= 3) {
    // grandes terrasses : un olivier en pot, une table, une pergola
    const x = tx0 + span * (0.2 + rnd() * 0.2), z = f + (e - f) * 0.5;
    matte.box(0.6, 0.6, 0.6, x, y0 + 0.3, z, C.planter).box(0.09, 1, 0.09, x, y0 + 1.1, z, C.bark);
    matte.blob(0.85, x, y0 + 1.9, z, C.olive, 0.85, 1, rnd());
    const table = tx0 + span * (0.55 + rnd() * 0.15);
    matte.box(1.7, 0.06, 0.8, table, y0 + 0.74, z, C.woodPale);
    for (const dx of [-0.55, 0.55]) for (const dz of [-0.65, 0.65]) matte.box(0.38, 0.42, 0.38, table + dx, y0 + 0.21, z + dz, C.woodPale);
    if (k !== 4) {
      const p0 = table - 1.6, p1 = table + 1.6, pz = Math.min(e - 0.7, f + 2.6);
      for (const px of [p0, p1]) matte.box(0.1, 2.3, 0.1, px, y0 + 1.15, pz, C.wood);
      for (let i = 0; i < 7; i++) matte.box(0.08, 0.1, pz - f, p0 + (i * (p1 - p0)) / 6, y0 + 2.35, (f + pz) / 2, C.wood);
    }
  }
  if (k === 5) {
    // attique : jardinières sur les terrasses latérales
    for (const x of [-14.5, 12.5]) {
      matte.box(0.5, 0.55, 5, x, y0 + 0.275, -2.6, C.planter);
      greenery(x, y0 + 0.55, -2.6, 4.8, 'z');
    }
    matte.box(0.6, 0.6, 0.6, 10.8, y0 + 0.3, -4, C.planter).box(0.09, 1, 0.09, 10.8, y0 + 1.1, -4, C.bark).blob(0.9, 10.8, y0 + 1.95, -4, C.olive, 0.85, 1, rnd());
  }
}

// Les faces d'une boîte reçoivent des coordonnées de texture à l'échelle du monde : les assises
// de brique gardent la même hauteur sur tous les lots.
function worldUV(geometry, w, h, d, tile) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const face = Math.floor(i / 4);
    const [su, sv] = face < 2 ? [d, h] : face < 4 ? [w, d] : [w, h];
    uv.setXY(i, (uv.getX(i) * su) / tile, (uv.getY(i) * sv) / tile);
  }
}

function brickTexture() {
  const size = 256, rows = 8, sheet = document.createElement('canvas');
  sheet.width = sheet.height = size;
  const ctx = sheet.getContext('2d'), rnd = mulberry(3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  for (let row = 0; row < rows; row++) {
    for (let i = -1; i < 4; i++) {
      const v = Math.round(222 + rnd() * 30);
      ctx.fillStyle = `rgb(${v}, ${Math.round(v * 0.975)}, ${Math.round(v * 0.95)})`;
      ctx.fillRect(i * 64 + (row % 2) * 32 + 1.5, row * (size / rows) + 1.5, 61, size / rows - 3);
    }
  }
  const texture = new THREE.CanvasTexture(sheet);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

// Le plan de masse, dessiné comme une planche d'architecte : canal, quai, jardins, cotes, nord.
function groundTexture() {
  const size = 2048, sheet = document.createElement('canvas');
  sheet.width = sheet.height = size;
  const ctx = sheet.getContext('2d');
  const s = size / (2 * RADIUS);
  const X = (x) => (x - CENTER.x + RADIUS) * s, Z = (z) => (z - CENTER.z + RADIUS) * s;
  const rect = (x0, z0, x1, z1) => ctx.fillRect(X(x0), Z(z0), (x1 - x0) * s, (z1 - z0) * s);
  const line = (x0, z0, x1, z1) => { ctx.beginPath(); ctx.moveTo(X(x0), Z(z0)); ctx.lineTo(X(x1), Z(z1)); ctx.stroke(); };
  const ink = (alpha) => `rgba(23, 51, 42, ${alpha})`;
  const text = (label, x, z, px = 24, align = 'center', alpha = 0.6) => {
    ctx.font = `600 ${px}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.fillStyle = ink(alpha);
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(px * 0.18)}px`;
    ctx.fillText(label, X(x), Z(z));
  };

  ctx.fillStyle = '#f2ede2';
  ctx.fillRect(0, 0, size, size);
  ctx.lineWidth = 1;
  ctx.strokeStyle = ink(0.07);
  for (let v = -40; v <= 40; v += 5) { line(v, -40, v, 40); line(-40, v, 40, v); }

  // canal
  ctx.fillStyle = '#a9c9be';
  rect(-40, 18.6, 40, 27);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([26, 34]);
  for (let i = 0; i < 6; i++) { ctx.lineDashOffset = i * 23; line(-40, 19.8 + i * 1.3, 40, 19.8 + i * 1.3); }
  ctx.setLineDash([]);
  ctx.strokeStyle = ink(0.5);
  ctx.lineWidth = 3;
  line(-40, 18.6, 40, 18.6); line(-40, 27, 40, 27);
  text('CANAL DU MIDI', 0, 23, 34, 'center', 0.55);
  ctx.fillStyle = '#ece6d9';
  rect(-40, 27, 40, 40);

  // quai et chemin de halage
  ctx.fillStyle = '#f8f5ee';
  rect(-40, 12.9, 40, 18.6);
  ctx.strokeStyle = ink(0.28);
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 14]);
  line(-40, 14.6, 40, 14.6);
  ctx.setLineDash([]);
  text('QUAI DES BATELIERS · PISTE CYCLABLE', 23, 13.75, 17, 'center', 0.5);

  // jardins du rez-de-chaussée, cœur d'îlot, allée du hall
  ctx.fillStyle = '#cddbbd';
  rect(-15.3, 6.2, 15.3, 11.6);
  rect(-15.3, -19, 15.3, -6.4);
  ctx.fillStyle = '#f8f5ee';
  rect(-4, 6.2, 0, 12.9);
  rect(-2.6, -19, -1.4, -6.4);
  rect(-15.3, -13.2, 15.3, -12.2);
  text('JARDIN', 8.5, -16.6, 20, 'center', 0.45);
  ctx.strokeStyle = ink(0.35);
  ctx.lineWidth = 2;
  ctx.strokeRect(X(-15.3), Z(-19), 30.6 * s, 12.6 * s);
  ctx.strokeRect(X(-15.3), Z(6.2), 30.6 * s, 5.4 * s);

  // rue arrière, rampe du parking
  ctx.fillStyle = '#e7e0d1';
  rect(-40, -40, 40, -32.2);
  ctx.strokeStyle = ink(0.4);
  line(-40, -32.2, 40, -32.2);
  text('ALLÉE DES MARINIERS', 0, -34.6, 20, 'center', 0.5);
  ctx.fillStyle = '#e4dccb';
  rect(17, -6, 22.5, 4);
  ctx.strokeStyle = ink(0.3);
  ctx.lineWidth = 1.5;
  for (let z = -5.5; z < 4; z += 0.7) line(17, z, 22.5, z);
  ctx.strokeRect(X(17), Z(-6), 5.5 * s, 10 * s);
  text('PARKING', 19.75, 5.3, 17, 'center', 0.55);

  // arbres en plan
  ctx.strokeStyle = ink(0.32);
  ctx.lineWidth = 2;
  for (const spot of [...QUAY_TREES, ...GARDEN_TREES]) {
    ctx.beginPath(); ctx.arc(X(spot.x), Z(spot.z), 2.1 * s, 0, Math.PI * 2); ctx.stroke();
    line(spot.x - 0.5, spot.z, spot.x + 0.5, spot.z); line(spot.x, spot.z - 0.5, spot.x, spot.z + 0.5);
  }

  // cote de façade
  ctx.strokeStyle = ink(0.75);
  ctx.lineWidth = 2;
  line(-15, 12.25, 15, 12.25);
  for (const x of [-15, 15]) line(x, 11.8, x, 12.7);
  ctx.fillStyle = '#f2ede2';
  rect(-3.4, 11.85, 3.4, 12.65);
  text('30,00 m', 0, 12.27, 19, 'center', 0.85);

  // échelle graphique
  ctx.fillStyle = ink(0.8);
  rect(17.5, 9.2, 22.5, 9.6);
  ctx.strokeStyle = ink(0.8);
  ctx.strokeRect(X(22.5), Z(9.2), 5 * s, 0.4 * s);
  text('0', 17.5, 8.3, 17, 'center', 0.8); text('5', 22.5, 8.3, 17, 'center', 0.8); text('10 m', 27.5, 8.3, 17, 'center', 0.8);

  // nord (la façade sur le canal regarde le sud-ouest)
  const nx = -24, nz = -13;
  ctx.strokeStyle = ink(0.7);
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(X(nx), Z(nz), 2.4 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = ink(0.8);
  ctx.beginPath();
  ctx.moveTo(X(nx - 1.55), Z(nz - 1.55)); ctx.lineTo(X(nx + 1.1), Z(nz + 0.2)); ctx.lineTo(X(nx + 0.2), Z(nz + 1.1));
  ctx.closePath(); ctx.fill();
  text('N', nx - 2.7, nz - 2.7, 24, 'center', 0.85);

  // bord gradué du plateau
  ctx.strokeStyle = ink(0.45);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(size / 2, size / 2, (RADIUS - 0.7) * s, 0, Math.PI * 2); ctx.stroke();
  for (let a = 0; a < 72; a++) {
    const angle = (a / 72) * Math.PI * 2, r0 = (RADIUS - 0.7) * s, r1 = (RADIUS - (a % 6 ? 1.2 : 1.9)) * s;
    ctx.beginPath();
    ctx.moveTo(size / 2 + Math.cos(angle) * r0, size / 2 + Math.sin(angle) * r0);
    ctx.lineTo(size / 2 + Math.cos(angle) * r1, size / 2 + Math.sin(angle) * r1);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(sheet);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// générateur reproductible
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
