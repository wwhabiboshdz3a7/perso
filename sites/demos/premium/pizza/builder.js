// Forno Nero — « Compose ta pizza » : une margherita en 3D sur laquelle les garnitures
// choisies viennent se poser. On la fait tourner au doigt ou à la souris.
// Le dessus vient d'une photo prise à la verticale ; le relief est sculpté dans la géométrie.

import * as THREE from 'three';
import { studioEnvironment, softDisc, loadTexture, canvasTexture, seeded } from '../../assets/premium/kit.js';

const canvas = document.querySelector('[data-builder]');
const FRAME = 1.02; // marge de la photo autour de la pizza
const THICKNESS = 0.035;
const RELIEF = 0.2;
const BASE_PRICE = 13;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas) start().catch((error) => {
  console.error('[forno nero] 3D indisponible', error);
  canvas.closest('.builder')?.classList.add('no-3d');
});

async function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  scene.environment = studioEnvironment(renderer, {
    ambient: '#0b0806',
    panels: [
      { size: [8, 8], color: '#fff3e2', intensity: 3.6, position: [0, 8, 1] },
      { size: [3, 5], color: '#ffb469', intensity: 8, position: [-6, 2, -2] },
      { size: [2, 6], color: '#ffe9d0', intensity: 5, position: [6, 3, 4] },
    ],
  });
  scene.environmentIntensity = 0.9;
  const key = new THREE.DirectionalLight('#fff0dd', 2.6);
  key.position.set(3, 7, 5);
  const rim = new THREE.DirectionalLight('#ff9a4d', 2.2);
  rim.position.set(-6, 2.5, -5);
  scene.add(key, rim, softDisc({ radius: 2.6, color: '#000000', opacity: 0.55, y: -0.02 }));

  const [albedo, reliefImage] = await Promise.all([loadTexture('pizza-albedo.webp'), loadImage('pizza-relief.webp')]);
  const relief = heightSampler(reliefImage, 512);
  const reliefTexture = new THREE.Texture(reliefImage);
  reliefTexture.needsUpdate = true;
  const heightAt = (x, z) => THICKNESS + relief(0.5 + x / (2 * FRAME), 0.5 + z / (2 * FRAME)) * RELIEF;

  const pizza = new THREE.Group();
  pizza.add(new THREE.Mesh(topGeometry(heightAt), new THREE.MeshStandardMaterial({ map: albedo, bumpMap: reliefTexture, bumpScale: 0.9, roughness: 0.56 })));
  pizza.add(new THREE.Mesh(rimGeometry(heightAt), new THREE.MeshStandardMaterial({ color: '#b98548', roughness: 0.9 })));
  scene.add(pizza);

  // ---------- garnitures ----------
  const rnd = seeded(21);
  const spots = (count, min, max, gap) => {
    const list = [];
    for (let tries = 0; list.length < count && tries < 4000; tries++) {
      const rho = Math.sqrt(lerp(min * min, max * max, rnd()));
      const angle = rnd() * Math.PI * 2;
      const x = rho * Math.cos(angle), z = rho * Math.sin(angle);
      if (list.every((p) => Math.hypot(p.x - x, p.z - z) > gap)) list.push({ x, z, y: heightAt(x, z), turn: rnd() * Math.PI * 2, seed: rnd() });
    }
    return list;
  };

  const toppings = {
    basilic: makeTopping(basilLeaf(), new THREE.MeshStandardMaterial({ map: leafTexture(), roughness: 0.42, side: THREE.DoubleSide }), spots(7, 0.1, 0.66, 0.3), 0.2, 0.02),
    olives: makeTopping(new THREE.TorusGeometry(0.5, 0.26, 10, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#17131a', roughness: 0.22 }), spots(11, 0.12, 0.7, 0.22), 0.07, 0.02),
    champignons: makeTopping(mushroomSlice(), new THREE.MeshStandardMaterial({ color: '#e6d6bd', roughness: 0.75, side: THREE.DoubleSide }), spots(10, 0.1, 0.68, 0.24), 0.15, 0.014),
    tomates: makeTopping(new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#d7261c', roughness: 0.25, clearcoat: 0.8 }), spots(9, 0.14, 0.68, 0.26), 0.12, 0.004),
    nduja: makeTopping(new THREE.SphereGeometry(0.5, 12, 8).scale(1, 0.55, 1), new THREE.MeshStandardMaterial({ color: '#b3311a', roughness: 0.6 }), spots(12, 0.1, 0.7, 0.2), 0.085, 0.012),
    roquette: makeTopping(rocketLeaf(), new THREE.MeshStandardMaterial({ color: '#3e7a2c', roughness: 0.5, side: THREE.DoubleSide }), spots(16, 0.05, 0.7, 0.12), 0.24, 0.05),
  };

  function makeTopping(geometry, material, places, size, lift) {
    const mesh = new THREE.InstancedMesh(geometry, material, places.length);
    mesh.visible = false;
    mesh.frustumCulled = false;
    pizza.add(mesh);
    return { mesh, places, size, lift, amount: 0, wanted: 0 };
  }

  const dummy = new THREE.Object3D();
  function placeTopping(topping, time) {
    const { mesh, places, size, lift, amount } = topping;
    mesh.visible = amount > 0.001;
    if (!mesh.visible) return;
    places.forEach((place, index) => {
      // chaque morceau tombe à son tour, puis se pose
      const p = clamp(amount * (1 + places.length * 0.08) - index * 0.08);
      const fall = 1 - Math.pow(1 - p, 3);
      const flutter = (1 - fall) * (reduced ? 0 : 1);
      dummy.position.set(place.x, place.y + lift + (1 - fall) * 2.2, place.z);
      dummy.rotation.set(flutter * Math.sin(time * 2 + place.seed * 9) * 1.2, place.turn + flutter * 3, flutter * Math.cos(time * 1.7 + place.seed * 7));
      dummy.scale.setScalar(size * (0.85 + place.seed * 0.3) * (p > 0 ? 1 : 0));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- interface : cases à cocher → garnitures + prix ----------
  const total = document.querySelector('[data-total]');
  const summary = document.querySelector('[data-summary]');
  const inputs = [...document.querySelectorAll('[data-topping]')];
  const euros = (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  function refresh() {
    let price = BASE_PRICE;
    const chosen = [];
    for (const input of inputs) {
      const topping = toppings[input.dataset.topping];
      if (topping) topping.wanted = input.checked ? 1 : 0;
      if (input.checked) {
        price += Number(input.dataset.price) || 0;
        chosen.push(input.dataset.label || input.dataset.topping);
      }
    }
    if (total) total.textContent = euros(price);
    if (summary) summary.textContent = chosen.length ? 'Margherita + ' + chosen.join(', ') : 'Margherita, telle quelle';
    wake();
  }
  inputs.forEach((input) => input.addEventListener('change', refresh));

  // ---------- rotation au doigt / à la souris ----------
  let yaw = 0.6, pitch = 0.92, velocity = reduced ? 0 : 0.25, dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    wake();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    yaw += dx * 0.01;
    pitch = clamp(pitch + (event.clientY - lastY) * 0.006, 0.35, 1.45);
    velocity = dx * 0.6;
    lastX = event.clientX;
    lastY = event.clientY;
    wake();
  });
  const release = () => { dragging = false; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') yaw -= 0.2;
    else if (event.key === 'ArrowRight') yaw += 0.2;
    else return;
    event.preventDefault();
    wake();
  });

  // ---------- rendu : seulement quand la section est à l'écran et que quelque chose bouge ----------
  let visible = false, awakeUntil = 0, last = performance.now(), time = 0;
  function wake() { awakeUntil = performance.now() + 2500; }
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

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const moving = Object.values(toppings).some((t) => Math.abs(t.wanted - t.amount) > 0.001);
    if (!visible || (reduced && !moving && now > awakeUntil)) return;
    time += dt;
    if (!dragging) {
      yaw += velocity * dt;
      velocity = lerp(velocity, reduced ? 0 : 0.25, 1 - Math.exp(-1.5 * dt));
    }
    for (const topping of Object.values(toppings)) {
      topping.amount = clamp(topping.amount + Math.sign(topping.wanted - topping.amount) * dt * (reduced ? 10 : 0.9));
      placeTopping(topping, time);
    }
    const narrow = camera.aspect < 1 ? 1.25 : 1;
    const distance = 4.4 * narrow;
    camera.position.set(0, Math.sin(pitch) * distance, Math.cos(pitch) * distance);
    camera.lookAt(0, 0.05, 0);
    pizza.rotation.y = yaw;
    renderer.render(scene, camera);
  }
  resize();
  refresh();
  requestAnimationFrame(frame);
  canvas.closest('.builder')?.classList.add('is-ready');
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

// Lecture bilinéaire d'une image en niveaux de gris : sampler(u, v) → 0…1.
function heightSampler(image, size) {
  const sheet = document.createElement('canvas');
  sheet.width = sheet.height = size;
  const context = sheet.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  const at = (x, y) => data[(clamp(y, 0, size - 1) * size + clamp(x, 0, size - 1)) * 4] / 255;
  return (u, v) => {
    const x = clamp(u) * (size - 1), y = clamp(v) * (size - 1);
    const x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0;
    return lerp(lerp(at(x0, y0), at(x0 + 1, y0), tx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), tx), ty);
  };
}

function build(positions, normals, uvs, indices) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

// Dessus : grille polaire, hauteur et normales tirées de la carte de relief.
function topGeometry(heightAt) {
  const RINGS = 80, SEGMENTS = 220, e = 0.006;
  const positions = [], normals = [], uvs = [], indices = [];
  for (let i = 0; i <= RINGS; i++) {
    const rho = Math.pow(i / RINGS, 0.85);
    for (let j = 0; j <= SEGMENTS; j++) {
      const angle = (j / SEGMENTS) * Math.PI * 2;
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

// Bord extérieur de la croûte et dessous.
function rimGeometry(heightAt) {
  const SEGMENTS = 220;
  const positions = [0, 0, 0], normals = [0, -1, 0], uvs = [0, 0], indices = [];
  for (let j = 0; j <= SEGMENTS; j++) {
    const angle = (j / SEGMENTS) * Math.PI * 2;
    const x = Math.cos(angle), z = Math.sin(angle);
    positions.push(x, heightAt(x, z), z, x * 0.985, 0, z * 0.985);
    normals.push(x, 0.2, z, x, -0.4, z);
    uvs.push(0, 0, 0, 0);
    if (j > 0) {
      const a = 1 + (j - 1) * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, c, b, c, d, b, 0, b, d);
    }
  }
  return build(positions, normals, uvs, indices);
}

function basilLeaf() {
  const geometry = new THREE.PlaneGeometry(1, 1, 10, 18);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const u = position.getX(i) * 2, t = position.getY(i) + 0.5;
    const width = 0.46 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.82)), 0.75) * (1 - 0.12 * t);
    position.setXYZ(i, u * width, Math.abs(u) * Math.abs(u) * 0.16 * width * 2.2 - Math.pow(t - 0.45, 2) * 0.55 + 0.11, (t - 0.5) * 1.5);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function rocketLeaf() {
  const geometry = new THREE.PlaneGeometry(1, 1, 6, 14);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const u = position.getX(i) * 2, t = position.getY(i) + 0.5;
    const lobes = 0.1 + 0.16 * Math.abs(Math.sin(t * Math.PI * 3.2)) * Math.sin(Math.PI * t);
    position.setXYZ(i, u * lobes, Math.sin(t * Math.PI) * 0.18 + Math.sin(t * 9) * 0.03, (t - 0.5) * 1.6);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// Lamelle de champignon : un chapeau et un pied, à plat.
function mushroomSlice() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.16, -0.5);
  shape.lineTo(0.16, -0.5);
  shape.lineTo(0.14, 0);
  shape.bezierCurveTo(0.62, 0.02, 0.6, 0.5, 0, 0.5);
  shape.bezierCurveTo(-0.6, 0.5, -0.62, 0.02, -0.14, 0);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 10).rotateX(-Math.PI / 2);
}

function leafTexture() {
  return canvasTexture(256, (ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, size, 0);
    gradient.addColorStop(0, '#173d16');
    gradient.addColorStop(0.5, '#2f6f25');
    gradient.addColorStop(1, '#173d16');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(190, 226, 150, 0.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(190, 226, 150, 0.3)';
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
