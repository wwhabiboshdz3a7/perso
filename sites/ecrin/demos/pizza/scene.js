// Forno Nero — une margherita en relief, découpée en huit parts.
// Le dessus vient d'une photo prise à la verticale ; le relief (bourrelet de la croûte,
// mozzarella) est sculpté dans la géométrie à partir d'une carte de hauteur.

import * as THREE from 'three';
import { Stage, span, track, clamp, lerp } from '../../assets/js/stage.js';
import { studioEnvironment, threePoint, backdrop, softDisc, Particles, loadTexture, canvasTexture, fbm, seeded } from '../../assets/js/kit.js';

const SLICES = 8;
const RINGS = 72;
const SEGMENTS = 44; // par part
const THICKNESS = 0.035; // épaisseur de la pâte au centre
const RELIEF = 0.2; // hauteur maximale ajoutée par la carte de relief
const FRAME = 1.02; // marge de la photo autour de la pizza
const HERO_SLICE = 1; // la part qui se soulève

const stage = new Stage({ background: '#0a0706', exposure: 1.08 });
if (stage.ok) init();

async function init() {
  const { scene, renderer } = stage;

  // ---------- lumière ----------
  stage.setEnvironment(
    studioEnvironment(renderer, {
      ambient: '#070504',
      panels: [
        { size: [8, 8], color: '#fff3e2', intensity: 3.2, position: [0, 8, 1] },
        { size: [3, 5], color: '#ffb469', intensity: 9, position: [-6, 2, -2] },
        { size: [2, 6], color: '#ffe9d0', intensity: 5, position: [6, 3, 4] },
        { size: [10, 0.5], color: '#ff8a3d', intensity: 2.5, position: [0, 0.4, -7] },
      ],
    }),
    0.85
  );
  const lights = threePoint({
    key: { color: '#fff0dd', intensity: 2.4, position: [3, 7, 5] },
    rim: { color: '#ff9a4d', intensity: 2.6, position: [-6, 2.5, -5] },
    fill: { color: '#ffe7cf', intensity: 0.35, position: [-3, 2, 6] },
  });
  const fire = new THREE.PointLight('#ff7a2e', 0, 14, 1.6);
  fire.position.set(-3.2, 1.4, -2.6);
  stage.add(lights.group, fire);
  stage.add(backdrop({ top: '#0f0907', bottom: '#030202', glow: '#3d1806', glowDirection: [-0.55, 0.0, -1], glowSize: 0.42 }));

  const glow = softDisc({ radius: 4.2, color: '#ff7a2e', opacity: 0.16, additive: true, y: -0.9 });
  stage.add(glow);

  const embers = new Particles({ count: 240, box: [10, 7, 7], center: [0, 1.2, -0.5], color: '#ff8b3d', size: 0.085, speed: [0.05, 0.42, 0], wobble: 0.35, twinkle: 0.7 });
  const flour = new Particles({ count: 320, box: [9, 5, 6], center: [0, 1, 0.5], color: '#fff4e4', size: 0.03, speed: [0.03, -0.03, 0.01], wobble: 0.2, twinkle: 0.3, opacity: 0.5 });
  stage.add(embers.points, flour.points);

  // ---------- textures ----------
  const [albedo, reliefImage] = await Promise.all([
    loadTexture('pizza-albedo.webp'),
    loadImage('pizza-relief.webp'),
  ]);
  const relief = heightSampler(reliefImage, 512);
  const reliefTexture = new THREE.Texture(reliefImage);
  reliefTexture.needsUpdate = true;

  const topMaterial = new THREE.MeshStandardMaterial({ map: albedo, bumpMap: reliefTexture, bumpScale: 0.9, roughness: 0.56, metalness: 0 });
  const crumbMaterial = new THREE.MeshStandardMaterial({ map: crumbTexture(), roughness: 0.92 });
  const underMaterial = new THREE.MeshStandardMaterial({ map: underTexture(), roughness: 0.95 });

  // Hauteur du dessus en un point (x, z) du disque de rayon 1.
  const heightAt = (x, z) => THICKNESS + relief(0.5 + x / (2 * FRAME), 0.5 + z / (2 * FRAME)) * RELIEF;

  // ---------- la pizza : huit parts ----------
  const pizza = new THREE.Group(); // tourne sur elle-même
  const tilt = new THREE.Group(); // s'incline vers la caméra
  tilt.add(pizza);
  stage.add(tilt);
  tilt.scale.setScalar(1.35);

  const slices = [];
  for (let k = 0; k < SLICES; k++) {
    const a0 = (k / SLICES) * Math.PI * 2;
    const a1 = ((k + 1) / SLICES) * Math.PI * 2;
    const group = new THREE.Group();
    group.add(new THREE.Mesh(sliceTop(a0, a1, heightAt), topMaterial));
    group.add(new THREE.Mesh(sliceWalls(a0, a1, heightAt), crumbMaterial));
    group.add(new THREE.Mesh(sliceUnder(a0, a1), underMaterial));
    const mid = (a0 + a1) / 2;
    group.userData = { mid, out: new THREE.Vector3(Math.cos(mid), 0, Math.sin(mid)) };
    pizza.add(group);
    slices.push(group);
  }

  // ---------- basilic ----------
  const leafGeometry = basilLeaf();
  const leafMaterial = new THREE.MeshStandardMaterial({ map: leafTexture(), roughness: 0.42, side: THREE.DoubleSide });
  const rnd = seeded(11);
  const leafSpots = [
    [0.3, 0.5], [0.42, 2.25], [0.5, 3.7], [0.22, 5.1], [0.56, 0.95 + Math.PI], [0.6, 5.75],
  ];
  const leaves = leafSpots.map(([rho, angle], index) => {
    const x = rho * Math.cos(angle);
    const z = rho * Math.sin(angle);
    const mesh = new THREE.Mesh(leafGeometry, leafMaterial);
    const size = 0.17 + rnd() * 0.06;
    mesh.scale.setScalar(size);
    const rest = new THREE.Vector3(x, heightAt(x, z) + 0.018, z);
    const yaw = rnd() * Math.PI * 2;
    mesh.userData = { rest, yaw, seed: rnd() * 10, delay: index * 0.11, lean: (rnd() - 0.5) * 0.3 };
    const owner = slices[Math.floor((((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / ((Math.PI * 2) / SLICES))];
    owner.add(mesh);
    return mesh;
  });

  // ---------- plans de caméra, un par chapitre ----------
  stage.setShots([
    { target: [0, 0.15, 0], radius: 7.4, azimuth: 0, elevation: 14, fov: 30, shift: [0.3, 0.02], portrait: { shift: [0, 0.36], radius: 8.6 } },
    { target: [1.0, 0.1, 0.1], radius: 3.3, azimuth: -34, elevation: 12, fov: 30, shift: [0.42, -0.62], portrait: { shift: [0.1, 0.6], radius: 3.5 } },
    { target: [0, 0, 0], radius: 6.6, azimuth: 0, elevation: 84, fov: 30, shift: [-0.34, 0], portrait: { shift: [0, 0.44], radius: 7.6 } },
    { target: [0.2, 0.35, 0.2], radius: 5.6, azimuth: 28, elevation: 30, fov: 30, shift: [0.36, 0], portrait: { shift: [0, 0.44], radius: 6.4 } },
    { target: [0, 0.2, 0], radius: 8.2, azimuth: 0, elevation: 24, fov: 30, shift: [0, -0.42], portrait: { shift: [0, 0.28], radius: 8.2 } },
  ]);

  // Rotation qui amène la part vedette vers la caméra du 4e chapitre (azimut 28°), un peu de biais.
  const heroYaw = slices[HERO_SLICE].userData.mid - Math.PI / 2 + (28 * Math.PI) / 180 + 0.45;
  let spin = 0;

  stage.onFrame(({ f, time, dt, reduced, height }) => {
    // inclinaison : face caméra au début, à plat ensuite
    tilt.rotation.x = track(f, [0.94, 0.06, 0, 0.1, 0.22]);
    tilt.position.y = track(f, [0.15, 0, 0, 0, 0]) + (reduced ? 0 : Math.sin(time * 0.6) * 0.03);
    spin += dt * (reduced ? 0 : track(f, [0.16, 0.05, 0.1, 0.03, 0.08]));
    // en fin de parcours la part vedette vient se placer face à la caméra
    const face = span(f, 2.2, 3) * (1 - span(f, 3.25, 4));
    const free = spin + f * 0.55;
    pizza.rotation.y = lerp(free, nearestTurn(free, heroYaw), face);

    // le feu monte au troisième chapitre
    const heat = span(f, 1.3, 2) * (1 - span(f, 2.5, 3.2) * 0.6);
    const flicker = reduced ? 0.8 : 0.72 + 0.28 * fbm(time * 2.6, 3.1);
    fire.intensity = (6 + heat * 34) * flicker;
    lights.rim.intensity = 2.2 + heat * 2.4 * flicker;
    embers.material.uniforms.uOpacity.value = 0.3 + heat * 0.7;
    glow.material.opacity = (0.12 + heat * 0.2) * (1 - span(f, 0, 0.6) * 0.3);
    embers.update(time, height);
    flour.update(time, height);

    // les parts s'écartent, l'une se soulève
    const open = span(f, 2.35, 3) * (1 - span(f, 3.3, 3.9));
    slices.forEach((slice, index) => {
      const hero = index === HERO_SLICE;
      const out = slice.userData.out;
      const away = open * (hero ? 0.5 : 0.012);
      slice.position.set(out.x * away, hero ? open * 0.5 : 0, out.z * away);
      // la part vedette pique du nez comme sur une pelle
      slice.rotation.set(0, 0, 0);
      if (hero) slice.rotateOnAxis(tangent.set(-out.z, 0, out.x), open * 0.28);
    });

    // le basilic tombe en tournoyant pendant le chapitre du feu
    leaves.forEach((leaf) => {
      const data = leaf.userData;
      const p = clamp((span(f, 1.15, 2.05) - data.delay) / (1 - 0.66));
      const fall = 1 - Math.pow(1 - p, 3);
      const flutter = (1 - fall) * (reduced ? 0 : 1);
      leaf.visible = p > 0;
      leaf.position.set(
        data.rest.x + Math.sin(time * 1.3 + data.seed) * 0.25 * flutter,
        data.rest.y + (1 - fall) * 2.4,
        data.rest.z + Math.cos(time * 1.1 + data.seed) * 0.25 * flutter
      );
      leaf.rotation.set(
        data.lean + Math.sin(time * 2 + data.seed) * 1.1 * flutter,
        data.yaw + flutter * 3,
        Math.cos(time * 1.7 + data.seed) * 0.9 * flutter
      );
    });
  });

  await stage.start();
}

const tangent = new THREE.Vector3();

// Angle équivalent à `target` (à un tour près) le plus proche de `current`.
function nearestTurn(current, target) {
  const turn = Math.PI * 2;
  return target + Math.round((current - target) / turn) * turn;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

// Lecture bilinéaire d'une image en niveaux de gris : sampler(u, v) → 0…1 (v vers le bas).
function heightSampler(image, size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  const at = (x, y) => data[(clamp(y, 0, size - 1) * size + clamp(x, 0, size - 1)) * 4] / 255;
  return (u, v) => {
    const x = clamp(u) * (size - 1);
    const y = clamp(v) * (size - 1);
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const tx = x - x0, ty = y - y0;
    return lerp(lerp(at(x0, y0), at(x0 + 1, y0), tx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), tx), ty);
  };
}

// Dessus d'une part : grille polaire, hauteur et normales tirées de la carte de relief.
function sliceTop(a0, a1, heightAt) {
  const positions = [], normals = [], uvs = [], indices = [];
  const e = 0.006;
  for (let i = 0; i <= RINGS; i++) {
    const rho = Math.pow(i / RINGS, 0.85); // un peu plus de finesse vers la croûte
    for (let j = 0; j <= SEGMENTS; j++) {
      const angle = lerp(a0, a1, j / SEGMENTS);
      const x = rho * Math.cos(angle), z = rho * Math.sin(angle);
      positions.push(x, heightAt(x, z), z);
      const dx = (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e);
      const dz = (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e);
      const length = Math.hypot(dx, 1, dz);
      normals.push(-dx / length, 1 / length, -dz / length);
      uvs.push(0.5 + x / (2 * FRAME), 0.5 - z / (2 * FRAME));
    }
  }
  const row = SEGMENTS + 1;
  for (let i = 0; i < RINGS; i++) {
    for (let j = 0; j < SEGMENTS; j++) {
      const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  return build(positions, normals, uvs, indices);
}

// Tranches visibles quand la part se détache (deux côtés) + le bord extérieur de la croûte.
function sliceWalls(a0, a1, heightAt) {
  const positions = [], normals = [], uvs = [], indices = [];
  const side = (angle, sign) => {
    const start = positions.length / 3;
    const nx = -Math.sin(angle) * sign, nz = Math.cos(angle) * sign;
    for (let i = 0; i <= RINGS; i++) {
      const rho = Math.pow(i / RINGS, 0.85);
      const x = rho * Math.cos(angle), z = rho * Math.sin(angle);
      const h = heightAt(x, z);
      positions.push(x, h, z, x, 0, z);
      normals.push(nx, 0, nz, nx, 0, nz);
      uvs.push(rho, h / (THICKNESS + RELIEF), rho, 0);
    }
    for (let i = 0; i < RINGS; i++) {
      const a = start + i * 2, b = a + 1, c = a + 2, d = a + 3;
      if (sign > 0) indices.push(a, c, b, c, d, b);
      else indices.push(a, b, c, c, b, d);
    }
  };
  side(a0, -1);
  side(a1, 1);
  // bord extérieur
  const start = positions.length / 3;
  for (let j = 0; j <= SEGMENTS; j++) {
    const angle = lerp(a0, a1, j / SEGMENTS);
    const x = Math.cos(angle), z = Math.sin(angle);
    positions.push(x, heightAt(x, z), z, x * 0.985, 0, z * 0.985);
    normals.push(x, 0.2, z, x, -0.3, z);
    uvs.push(0.97, 0.9, 0.97, 0);
  }
  for (let j = 0; j < SEGMENTS; j++) {
    const a = start + j * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, c, b, c, d, b);
  }
  return build(positions, normals, uvs, indices);
}

function sliceUnder(a0, a1) {
  const positions = [0, 0, 0], normals = [0, -1, 0], uvs = [0.5, 0.5], indices = [];
  for (let j = 0; j <= SEGMENTS; j++) {
    const angle = lerp(a0, a1, j / SEGMENTS);
    const x = Math.cos(angle) * 0.985, z = Math.sin(angle) * 0.985;
    positions.push(x, 0, z);
    normals.push(0, -1, 0);
    uvs.push(0.5 + x / 2, 0.5 + z / 2);
    if (j > 0) indices.push(0, j, j + 1);
  }
  return build(positions, normals, uvs, indices);
}

function build(positions, normals, uvs, indices) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

// Mie : crème, alvéolée dans le bourrelet (u = distance au centre), filet de sauce en surface.
function crumbTexture() {
  return canvasTexture(512, (ctx, size) => {
    const rnd = seeded(5);
    ctx.fillStyle = '#ecd9b4';
    ctx.fillRect(0, 0, size, size);
    for (let n = 0; n < 2600; n++) {
      const u = rnd(), v = rnd();
      ctx.fillStyle = `rgba(${150 + rnd() * 60}, ${110 + rnd() * 50}, ${60 + rnd() * 40}, ${0.05 + rnd() * 0.08})`;
      ctx.fillRect(u * size, v * size, 1 + rnd() * 3, 1 + rnd() * 2);
    }
    // alvéoles de la croûte
    for (let n = 0; n < 150; n++) {
      const u = 0.74 + rnd() * 0.25, v = 0.12 + rnd() * 0.72;
      const w = 5 + rnd() * 20, h = 3 + rnd() * 11;
      ctx.beginPath();
      ctx.ellipse(u * size, (1 - v) * size, w, h, rnd() * 0.6 - 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(118, 78, 40, ${0.35 + rnd() * 0.4})`;
      ctx.fill();
    }
    // sauce puis croûte dorée sur le dessus de la tranche
    const sauce = ctx.createLinearGradient(0, 0, 0, size * 0.2);
    sauce.addColorStop(0, 'rgba(176, 42, 22, 0.95)');
    sauce.addColorStop(1, 'rgba(176, 42, 22, 0)');
    ctx.fillStyle = sauce;
    ctx.fillRect(0, 0, size * 0.76, size * 0.2);
    const crust = ctx.createLinearGradient(0, 0, 0, size * 0.1);
    crust.addColorStop(0, 'rgba(150, 92, 40, 0.9)');
    crust.addColorStop(1, 'rgba(150, 92, 40, 0)');
    ctx.fillStyle = crust;
    ctx.fillRect(size * 0.74, 0, size * 0.26, size * 0.1);
    // dessous bruni
    const base = ctx.createLinearGradient(0, size * 0.9, 0, size);
    base.addColorStop(0, 'rgba(120, 76, 36, 0)');
    base.addColorStop(1, 'rgba(120, 76, 36, 0.85)');
    ctx.fillStyle = base;
    ctx.fillRect(0, size * 0.9, size, size * 0.1);
  });
}

// Dessous : pâte farinée, taches de cuisson.
function underTexture() {
  return canvasTexture(512, (ctx, size) => {
    const rnd = seeded(9);
    ctx.fillStyle = '#d9bd8c';
    ctx.fillRect(0, 0, size, size);
    for (let n = 0; n < 240; n++) {
      const x = rnd() * size, y = rnd() * size, r = 4 + rnd() * 22;
      const spot = ctx.createRadialGradient(x, y, 0, x, y, r);
      const dark = rnd();
      spot.addColorStop(0, `rgba(${70 - dark * 40}, ${44 - dark * 26}, ${20 - dark * 10}, ${0.3 + dark * 0.5})`);
      spot.addColorStop(1, 'rgba(70, 44, 20, 0)');
      ctx.fillStyle = spot;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

// Feuille de basilic : ovale bombé, nervure centrale en creux, pointe relevée.
function basilLeaf() {
  const geometry = new THREE.PlaneGeometry(1, 1, 12, 22);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const u = position.getX(i) * 2; // -1…1 en travers
    const t = position.getY(i) + 0.5; // 0…1 le long
    const width = 0.46 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.82)), 0.75) * (1 - 0.12 * t);
    const x = u * width;
    const z = (t - 0.5) * 1.5;
    const cup = Math.abs(u) * Math.abs(u) * 0.16 * width * 2.2; // bords relevés
    const arch = -Math.pow(t - 0.45, 2) * 0.55 + 0.11; // feuille bombée dans la longueur
    const wrinkle = Math.sin(t * 26 + Math.abs(u) * 3) * 0.012 * Math.abs(u);
    position.setXYZ(i, x, cup + arch + wrinkle, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function leafTexture() {
  return canvasTexture(256, (ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, size, 0);
    gradient.addColorStop(0, '#173d16');
    gradient.addColorStop(0.5, '#2f6f25');
    gradient.addColorStop(1, '#173d16');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(190, 226, 150, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(190, 226, 150, 0.32)';
    for (let n = 1; n < 9; n++) {
      const y = (n / 9) * size;
      ctx.beginPath();
      ctx.moveTo(size / 2, y);
      ctx.quadraticCurveTo(size * 0.72, y - size * 0.03, size * 0.98, y - size * 0.1);
      ctx.moveTo(size / 2, y);
      ctx.quadraticCurveTo(size * 0.28, y - size * 0.03, size * 0.02, y - size * 0.1);
      ctx.stroke();
    }
  });
}
