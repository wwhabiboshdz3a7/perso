// Écrin — accueil de la galerie : une gemme taillée qui prend la couleur de la démo survolée.

import * as THREE from 'three';
import { Stage, track, damp } from './stage.js';
import { studioEnvironment, threePoint, backdrop, Particles } from './kit.js';

const stage = new Stage({ background: '#08080a', exposure: 1.1 });
if (stage.ok) init();

function init() {
  const { renderer } = stage;

  stage.setEnvironment(
    studioEnvironment(renderer, {
      ambient: '#040405',
      panels: [
        { size: [5, 5], color: '#ffffff', intensity: 6, position: [0, 7, 1] },
        { size: [1.2, 5], color: '#ffe2b8', intensity: 14, position: [-6, 2, 3] },
        { size: [1, 6], color: '#b9d2ff', intensity: 10, position: [6, 1.5, -2] },
        { size: [3, 0.5], color: '#ffd9f0', intensity: 9, position: [2, -4, 5] },
        { size: [0.6, 3], color: '#d7fff3', intensity: 9, position: [-3, -3, -6] },
        { size: [8, 0.4], color: '#ffffff', intensity: 5, position: [0, 0.5, 8] },
      ],
    }),
    1.6
  );
  const lights = threePoint({
    key: { color: '#fff3e0', intensity: 2.2, position: [-4, 6, 5] },
    rim: { color: '#c9a45c', intensity: 3, position: [5, 2, -6] },
    fill: { color: '#ffffff', intensity: 0.3, position: [3, -2, 6] },
  });
  const back = backdrop({ top: '#101014', bottom: '#040405', glow: '#120d06', glowDirection: [0.3, 0.05, -1], glowSize: 0.3 });
  stage.add(lights.group, back);

  const dust = new Particles({ count: 380, box: [12, 8, 8], center: [0, 0, -1], color: '#f1dfb8', size: 0.04, speed: [0.02, 0.05, 0], wobble: 0.3, twinkle: 0.8, opacity: 0.8 });
  stage.add(dust.points);

  // ---------- la gemme ----------
  const gemMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0,
    metalness: 0,
    transmission: 1,
    ior: 2.1,
    thickness: 1.4,
    dispersion: 6,
    attenuationColor: new THREE.Color('#ffffff'),
    attenuationDistance: 12,
    flatShading: true,
    side: THREE.DoubleSide,
    envMapIntensity: 2.2,
  });
  const gem = new THREE.Mesh(brilliantCut(), gemMaterial);
  // Cœur à facettes miroir, vu à travers la pierre : il renvoie la lumière comme les reflets internes d'un diamant.
  const core = new THREE.Mesh(
    gem.geometry,
    new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.04, flatShading: true, side: THREE.DoubleSide, envMapIntensity: 1.5 })
  );
  core.scale.set(0.8, -0.8, 0.8);
  core.position.y = -0.2;
  core.rotation.y = Math.PI / 8;
  gem.add(core);
  const holder = new THREE.Group();
  holder.add(gem);
  holder.rotation.set(0.32, 0, -0.18);
  stage.add(holder);

  // Un anneau fin, comme une monture en suspens autour de la pierre.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.75, 0.012, 12, 160),
    new THREE.MeshStandardMaterial({ color: '#c9a45c', metalness: 1, roughness: 0.25 })
  );
  ring.rotation.x = Math.PI / 2;
  holder.add(ring);

  stage.setShots([
    { target: [0, 0, 0], radius: 7.4, azimuth: 0, elevation: 8, fov: 30, shift: [0.34, 0.02], portrait: { shift: [0, 0.36], radius: 10.5 } },
    { target: [0, 0, 0], radius: 10.5, azimuth: 40, elevation: 18, fov: 30, shift: [0.55, 0.3], portrait: { shift: [0.3, 0.5], radius: 12 } },
  ]);

  // Survol d'une démo : la lumière glisse vers sa couleur.
  const neutral = new THREE.Color('#c9a45c');
  const wanted = neutral.clone();
  const current = neutral.clone();
  const glowBase = new THREE.Color('#120d06');
  for (const row of document.querySelectorAll('[data-accent]')) {
    const tint = new THREE.Color(row.dataset.accent);
    const on = () => wanted.copy(tint);
    const off = () => wanted.copy(neutral);
    row.addEventListener('pointerenter', on);
    row.addEventListener('pointerleave', off);
    row.addEventListener('focusin', on);
    row.addEventListener('focusout', off);
  }

  stage.onFrame(({ f, time, dt, reduced, height }) => {
    gem.rotation.y += dt * (reduced ? 0 : 0.22);
    ring.rotation.z -= dt * (reduced ? 0 : 0.05);
    holder.position.y = reduced ? 0 : Math.sin(time * 0.5) * 0.06;
    holder.scale.setScalar(track(f, [1, 0.8]));
    const k = 1 - Math.exp(-3 * dt);
    current.lerp(wanted, k);
    lights.rim.color.copy(current);
    ring.material.color.copy(current);
    gemMaterial.attenuationColor.copy(current).lerp(white, 0.8);
    core.material.color.copy(current).lerp(white, 0.72);
    back.material.uniforms.uGlow.value.copy(current).multiplyScalar(0.05).lerp(glowBase, 0.5);
    dust.update(time, height);
  });

  stage.start();
}

const white = new THREE.Color('#ffffff');

// Taille brillant simplifiée : table, couronne, rondiste, culasse. Facettes planes.
function brilliantCut() {
  const triangles = [];
  const point = (radius, y, angle) => [radius * Math.cos(angle), y, radius * Math.sin(angle)];
  const add = (a, b, c) => triangles.push(...a, ...b, ...c);
  const STEP = Math.PI / 8;
  const top = [0, 0.44, 0];
  const culet = [0, -1.02, 0];
  const table = [], upper = [], girdle = [], lower = [], pavilion = [];
  for (let i = 0; i < 8; i++) table.push(point(0.62, 0.44, i * 2 * STEP));
  for (let i = 0; i < 8; i++) upper.push(point(0.92, 0.24, (i * 2 + 1) * STEP));
  for (let k = 0; k < 16; k++) {
    girdle.push(point(1.2, 0.03, k * STEP));
    lower.push(point(1.2, -0.03, k * STEP));
  }
  for (let i = 0; i < 8; i++) pavilion.push(point(0.52, -0.6, i * 2 * STEP));

  for (let i = 0; i < 8; i++) {
    const n = (i + 1) % 8;
    const g0 = girdle[i * 2], g1 = girdle[i * 2 + 1], g2 = girdle[(i * 2 + 2) % 16];
    const l0 = lower[i * 2], l1 = lower[i * 2 + 1], l2 = lower[(i * 2 + 2) % 16];
    add(top, table[n], table[i]); // table
    add(table[i], table[n], upper[i]); // étoile
    add(table[i], upper[i], g0); // bézel
    add(g0, upper[i], g1);
    add(g1, upper[i], g2);
    add(upper[i], table[n], g2);
    add(g0, g1, l0); add(l0, g1, l1); // rondiste
    add(g1, g2, l1); add(l1, g2, l2);
    add(l0, l1, pavilion[i]); // culasse
    add(l1, pavilion[n], pavilion[i]);
    add(l1, l2, pavilion[n]);
    add(pavilion[i], pavilion[n], culet);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(triangles, 3));
  geometry.computeVertexNormals();
  return geometry;
}
