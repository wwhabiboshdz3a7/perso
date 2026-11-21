// LAME — « Essaie ta coupe » : un buste de mannequin en argile mate, sculpté à la volée.
// Tout est procédural : la tête, le cou et chaque volume de cheveux sont des champs de distance
// (formes simples fondues entre elles) que l'on transforme en maillage au chargement.
// Les cheveux ras — tondu, fondu du dégradé, barbe de trois jours — sont peints dans la matière.

import * as THREE from 'three';
import { studioEnvironment, softDisc, fbm, seeded } from '../../assets/premium/kit.js';

const canvas = document.querySelector('[data-buste]');
const root = canvas ? canvas.closest('[data-essai]') : null;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
const pause = () => new Promise((resolve) => setTimeout(resolve, 0));

const CLAY = '#d9c6a8';
const HAIR = '#1b1917';

// ---------- formes de base ----------
function ell(x, y, z, cx, cy, cz, rx, ry, rz) {
  const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
  const k0 = Math.sqrt(px * px + py * py + pz * pz);
  if (k0 < 1e-5) return -Math.min(rx, ry, rz);
  const qx = px / rx, qy = py / ry, qz = pz / rz;
  return (k0 * (k0 - 1)) / Math.sqrt(qx * qx + qy * qy + qz * qz);
}
// segment à rayon variable (cou, arête du nez)
function cone(x, y, z, ax, ay, az, bx, by, bz, ra, rb) {
  const pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
  const t = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz));
  const dx = pax - bax * t, dy = pay - bay * t, dz = paz - baz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * t);
}

// ---------- la tête ----------
// Repère : y vers le haut, visage vers +z. Menton à −1,1 ; sommet du crâne à 1,26.
// `skull` : crâne, visage, mâchoire et cou, sans les détails — c'est la surface sur laquelle
// poussent les cheveux et la barbe.
function skull(ax, y, z) {
  let d = ell(ax, y, z, 0, 0.42, -0.12, 0.76, 0.84, 0.92);
  d = smin(d, ell(ax, y, z, 0, -0.22, 0.2, 0.6, 0.86, 0.58), 0.22);
  d = smin(d, ell(ax, y, z, 0, -0.66, 0.06, 0.5, 0.36, 0.5), 0.2);
  d = smin(d, Math.hypot(ax, y + 0.88, z - 0.44) - 0.22, 0.2);
  d = smin(d, cone(ax, y, z, 0, -0.5, -0.3, 0, -2.2, -0.52, 0.4, 0.45), 0.18);
  return d;
}
function head(ax, y, z) {
  let d = skull(ax, y, z);
  if (y < -1.2) {
    d = smin(d, ell(ax, y, z, 0, -2.52, -0.5, 1.28, 0.56, 0.68), 0.5); // épaules
    d = Math.max(d, -2.62 - y); // coupe nette à la base
  } else if (d < 0.45) {
    d = smin(d, ell(ax, y, z, 0, 0.2, 0.62, 0.48, 0.1, 0.2), 0.12); // arcade
    d = smax(d, 0.15 - Math.hypot(ax - 0.27, y - 0.04, z - 0.84), 0.1); // orbites
    d = smin(d, cone(ax, y, z, 0, 0.12, 0.72, 0, -0.3, 0.9, 0.062, 0.108), 0.07); // nez
    d = smin(d, ell(ax, y, z, 0, -0.64, 0.66, 0.2, 0.075, 0.1), 0.1); // bouche, à peine
    const ex = ax - (0.74 - 0.32 * (z + 0.1));
    d = smin(d, ell(ex, y, z, 0, -0.1, -0.1, 0.05, 0.3, 0.17), 0.045); // oreille
  }
  return d;
}

// ---------- lignes de coupe (les mêmes fonctions existent en GLSL plus bas) ----------
const ZC = -0.12; // axe vertical du crâne
const azimuth = (x, z) => Math.abs(Math.atan2(x, z - ZC)); // 0 = face, π = nuque
// hauteur de la ligne d'implantation selon l'azimut : front, tempe, patte, tour d'oreille, nuque
const hairline = (a) => 0.8 - 0.95 * ss(0.6, 1.05, a) + 0.45 * ss(1.22, 1.45, a) - 0.85 * ss(1.72, 2.3, a);
const sideOf = (a) => ss(0.55, 1.1, a);
const levelOf = (a, h0, side, drop, min) => Math.max(h0 + min, side - drop * ss(1.6, 2.6, a));

// Chaque coupe : la teinte peinte sur le crâne [densité, hauteur du fondu sur les côtés, chute vers
// la nuque, marge au-dessus de l'implantation, largeur du fondu], l'angle sous lequel on la montre,
// et le volume de cheveux (champ de distance), s'il y en a un.
const CUTS = {
  degrade: {
    tint: [1, 0.5, 0.55, 0.1, 0.55],
    view: -0.95,
    field(x, y, z, s) {
      const a = azimuth(x, z), h0 = hairline(a), side = sideOf(a);
      const level = levelOf(a, h0, 0.5, 0.55, 0.1);
      const grow = lerp(1, ss(level - 0.1, level + 0.34, y), side);
      const top = ss(0.5, 1.05, y);
      const quiff = ss(0.15, 0.7, z) * ss(0.62, 1, y) * (1 - ss(0.3, 0.64, Math.abs(x)));
      const t = 0.075 + 0.075 * top + 0.11 * quiff + 0.011 * Math.sin((x + 0.22 * z) * 46) * top;
      return Math.max(s - (t * grow - 0.045 * (1 - grow)), (h0 - y) * 0.8);
    },
  },
  crop: {
    tint: [1, 0.86, 0.42, 0.1, 0.44],
    view: -0.55,
    field(x, y, z, s) {
      const a = azimuth(x, z), h0 = hairline(a), side = sideOf(a);
      const fringe = 1 - ss(0.32, 0.72, a);
      const level = levelOf(a, h0, 0.86, 0.42, 0.1);
      const grow = lerp(1, ss(level - 0.08, level + 0.12, y), side);
      const chop = (fbm(x * 5.2 + 3, y * 5.2, z * 5.2, 3) - 0.5) * 0.085;
      const t = 0.125 + chop + 0.035 * fringe * ss(1, 0.62, y);
      return Math.max(s - (t * grow - 0.045 * (1 - grow)), (h0 - 0.2 * fringe - y) * 0.8);
    },
  },
  pompadour: {
    tint: [1, -9, 0, 0.16, 0.16],
    view: -1.15,
    field(x, y, z, s) {
      const ax = Math.abs(x), a = azimuth(x, z), h0 = hairline(a), side = sideOf(a);
      const level = levelOf(a, h0, 0.6, 0.3, 0.12);
      const grow = lerp(1, ss(level - 0.06, level + 0.26, y), side);
      const mid = 1 - ss(0.22, 0.8, ax);
      const front = Math.pow(ss(-0.6, 0.66, z), 1.6);
      const t = 0.1 + 0.34 * front * mid * ss(0.55, 1, y);
      let d = Math.max(s - (t * grow - 0.045 * (1 - grow)), (h0 - y) * 0.8);
      d = smin(d, ell(ax, y, z, 0, 1.36, 0.5, 0.46, 0.27, 0.4), 0.22); // le rouleau au-dessus du front
      return d - 0.012 * Math.sin(x * 44) * ss(0.7, 1, y); // sillons du peigne
    },
  },
  tondu: { tint: [0.8, -9, 0, 0.09, 0.09], view: -0.7, field: null },
};

// Barbes : [densité peinte, douceur du bord] et volume éventuel.
const BEARDS = {
  rase: { tint: [0, 0.02], field: null },
  trois: { tint: [0.6, 0.035], field: null },
  pleine: {
    tint: [1, 0.012],
    field(x, y, z, s) {
      if (z < ZC - 0.3 || y > 0.1 || y < -1.5) return 0.3;
      const a = azimuth(x, z);
      const yc = -0.48 + 0.4 * ss(0.35, 1.2, a);
      const yn = -1.18 + 0.25 * ss(0.9, 1.5, a);
      const am = 1.28 + 0.25 * ss(-0.35, -0.6, y);
      const chin = ss(-0.5, -1, y) * (1 - ss(0.3, 0.95, a));
      const grow = ss(yc + 0.02, yc - 0.2, y) * ss(am + 0.02, am - 0.3, a);
      const t = 0.075 + 0.11 * chin + 0.01 * Math.sin(y * 40 + Math.abs(x) * 9);
      const mouth = 1 - Math.hypot(x / 0.2, (y + 0.66) / 0.06);
      return Math.max(s - (t * grow - 0.045 * (1 - grow)), yn - y, mouth * 0.05);
    },
  },
};

// Les mêmes lignes côté matière : la teinte des cheveux ras est calculée au pixel.
const GLSL_HEAD = /* glsl */ `
  uniform vec3 uHair; uniform vec4 uScalp; uniform float uFade; uniform vec2 uBeard;
  varying vec3 vP;
  float lameHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float lameNoise(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(lameHash(i), lameHash(i + vec3(1, 0, 0)), f.x), mix(lameHash(i + vec3(0, 1, 0)), lameHash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(lameHash(i + vec3(0, 0, 1)), lameHash(i + vec3(1, 0, 1)), f.x), mix(lameHash(i + vec3(0, 1, 1)), lameHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float lameLine(float a) { return 0.8 - 0.95 * smoothstep(0.6, 1.05, a) + 0.45 * smoothstep(1.22, 1.45, a) - 0.85 * smoothstep(1.72, 2.3, a); }
  float lameTint(vec3 p) {
    float a = abs(atan(p.x, p.z + 0.12));
    float h0 = lameLine(a);
    float aa = clamp(fwidth(p.y) * 1.5, 0.004, 0.03);
    float side = smoothstep(0.55, 1.1, a);
    float level = max(h0 + uScalp.w, uScalp.y - uScalp.z * smoothstep(1.6, 2.6, a));
    float ramp = smoothstep(max(h0, level - uFade), level, p.y);
    float scalp = uScalp.x * smoothstep(h0 - aa, h0 + aa, p.y) * mix(1.0, ramp, side);
    float e = uBeard.y;
    float yc = -0.48 + 0.4 * smoothstep(0.35, 1.2, a);
    float yn = -1.18 + 0.25 * smoothstep(0.9, 1.5, a);
    float am = 1.28 + 0.25 * (1.0 - smoothstep(-0.6, -0.35, p.y));
    float mouth = length(vec2(p.x / 0.2, (p.y + 0.66) / 0.06));
    float beard = uBeard.x * (1.0 - smoothstep(yc - e, yc + e, p.y)) * smoothstep(yn - e, yn + e, p.y)
      * (1.0 - smoothstep(am - e * 2.0, am + e * 2.0, a)) * smoothstep(1.0 - e * 4.0, 1.0 + e * 4.0, mouth);
    float m = max(scalp, beard);
    float grain = lameNoise(p * 58.0);
    return clamp(m + (grain - 0.5) * 1.5 * m * (1.0 - m), 0.0, 1.0);
  }`;

// ---------- du champ au maillage : « surface nets » ----------
// Un sommet par cellule traversée par la surface (au barycentre des arêtes coupées),
// une facette par arête de grille qui change de signe.
function surfaceNets(values, dims, min, cell) {
  const [nx, ny, nz] = dims;
  const slab = nx * ny;
  const cells = new Int32Array(nx * ny * nz).fill(-1);
  const positions = [];
  const offsets = [0, 1, nx, nx + 1, slab, slab + 1, slab + nx, slab + nx + 1];
  const corner = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const base = i + nx * j + slab * k;
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          v[c] = values[base + offsets[c]];
          if (v[c] < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const [p, q] of edges) {
          if ((v[p] < 0) === (v[q] < 0)) continue;
          const t = v[p] / (v[p] - v[q]);
          sx += corner[p][0] + t * (corner[q][0] - corner[p][0]);
          sy += corner[p][1] + t * (corner[q][1] - corner[p][1]);
          sz += corner[p][2] + t * (corner[q][2] - corner[p][2]);
          n++;
        }
        cells[base] = positions.length / 3;
        positions.push(min[0] + (i + sx / n) * cell, min[1] + (j + sy / n) * cell, min[2] + (k + sz / n) * cell);
      }
    }
  }
  const indices = [];
  const quad = (a, b, c, d) => { if (a >= 0 && b >= 0 && c >= 0 && d >= 0) indices.push(a, b, c, a, c, d); };
  for (let k = 1; k < nz - 1; k++) {
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const base = i + nx * j + slab * k;
        const inside = values[base] < 0;
        if (inside !== values[base + 1] < 0) quad(cells[base - nx - slab], cells[base - slab], cells[base], cells[base - nx]);
        if (inside !== values[base + nx] < 0) quad(cells[base - 1 - slab], cells[base - slab], cells[base], cells[base - 1]);
        if (inside !== values[base + slab] < 0) quad(cells[base - 1 - nx], cells[base - nx], cells[base], cells[base - 1]);
      }
    }
  }
  return { positions, indices };
}

// Normales tirées du champ lui-même (plus lisses que celles des facettes), sens des facettes
// corrigé d'après elles, et suppression de ce qui reste caché à l'intérieur de la tête.
function toGeometry({ positions, indices }, field, hidden) {
  const count = positions.length / 3;
  const normals = new Float32Array(count * 3);
  const keep = new Uint8Array(count);
  const e = 0.012;
  for (let n = 0; n < count; n++) {
    const x = positions[n * 3], y = positions[n * 3 + 1], z = positions[n * 3 + 2];
    const gx = field(x + e, y, z) - field(x - e, y, z);
    const gy = field(x, y + e, z) - field(x, y - e, z);
    const gz = field(x, y, z + e) - field(x, y, z - e);
    const length = Math.hypot(gx, gy, gz) || 1;
    normals[n * 3] = gx / length;
    normals[n * 3 + 1] = gy / length;
    normals[n * 3 + 2] = gz / length;
    keep[n] = hidden && hidden(x, y, z) ? 0 : 1;
  }
  const faces = [];
  for (let f = 0; f < indices.length; f += 3) {
    const a = indices[f];
    let b = indices[f + 1], c = indices[f + 2];
    if (!keep[a] && !keep[b] && !keep[c]) continue;
    const ux = positions[b * 3] - positions[a * 3], uy = positions[b * 3 + 1] - positions[a * 3 + 1], uz = positions[b * 3 + 2] - positions[a * 3 + 2];
    const vx = positions[c * 3] - positions[a * 3], vy = positions[c * 3 + 1] - positions[a * 3 + 1], vz = positions[c * 3 + 2] - positions[a * 3 + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const facing = nx * (normals[a * 3] + normals[b * 3] + normals[c * 3]) + ny * (normals[a * 3 + 1] + normals[b * 3 + 1] + normals[c * 3 + 1]) + nz * (normals[a * 3 + 2] + normals[b * 3 + 2] + normals[c * 3 + 2]);
    if (facing < 0) [b, c] = [c, b];
    faces.push(a, b, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setIndex(faces);
  return geometry;
}

// ---------- démarrage ----------
if (canvas && root) {
  const fail = (error) => {
    console.warn('[lame] buste 3D indisponible :', error && error.message ? error.message : error);
    root.classList.add('no-3d');
  };
  // On ne sculpte qu'à l'approche de la section : rien n'est calculé si l'on ne descend pas jusque-là.
  if ('IntersectionObserver' in window) {
    const watcher = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watcher.disconnect();
      start().catch(fail);
    }, { rootMargin: '120% 0px' });
    watcher.observe(root);
  } else {
    start().catch(fail);
  }
}

async function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  scene.environment = studioEnvironment(renderer, {
    ambient: '#1a1d1b',
    panels: [
      { size: [9, 9], color: '#fff6e8', intensity: 2.6, position: [0, 9, 2] },
      { size: [4, 7], color: '#ffe8cf', intensity: 5, position: [-7, 3, 4] },
      { size: [3, 7], color: '#d6e6dc', intensity: 3.2, position: [7, 2, -3] },
      { size: [8, 2], color: '#ffffff', intensity: 1.6, position: [0, -2, 7] },
    ],
  });
  scene.environmentIntensity = 0.75;
  const key = new THREE.DirectionalLight('#fff1dd', 2.3);
  key.position.set(-3.5, 5, 6);
  const rim = new THREE.DirectionalLight('#cfe6d8', 1.7);
  rim.position.set(5, 2.5, -6);
  scene.add(key, rim);

  // ----- grille commune : la tête y est échantillonnée une fois, les cheveux la réutilisent -----
  const CELL = 0.035;
  const dims = [83, 136, 75];
  const min = [-((dims[0] - 1) / 2) * CELL, -2.76, -1.32];
  const [nx, ny, nz] = dims;
  const total = nx * ny * nz;
  const skullGrid = new Float32Array(total);
  const headGrid = new Float32Array(total);
  const half = (nx + 1) >> 1;
  for (let k = 0; k < nz; k++) {
    const z = min[2] + k * CELL;
    for (let j = 0; j < ny; j++) {
      const y = min[1] + j * CELL;
      const row = nx * (j + ny * k);
      for (let i = 0; i < half; i++) {
        const ax = Math.abs(min[0] + i * CELL);
        const s = skull(ax, y, z);
        const h = s > 1.2 && y > -1.2 ? s : head(ax, y, z);
        skullGrid[row + i] = skullGrid[row + nx - 1 - i] = s;
        headGrid[row + i] = headGrid[row + nx - 1 - i] = h;
      }
    }
    if (k % 12 === 11) await pause();
  }

  const bust = new THREE.Group();
  scene.add(bust);

  // ----- la tête : argile claire, cheveux ras peints dans la matière -----
  const tint = {
    uHair: { value: new THREE.Color(HAIR) },
    uScalp: { value: new THREE.Vector4(0, -9, 0, 0.1) },
    uFade: { value: 0.1 },
    uBeard: { value: new THREE.Vector2(0, 0.02) },
  };
  const clay = new THREE.MeshStandardMaterial({ color: CLAY, roughness: 0.86, metalness: 0 });
  clay.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, tint);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvP = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL_HEAD)
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, uHair, lameTint(vP));');
  };
  const headField = (x, y, z) => head(Math.abs(x), y, z);
  bust.add(new THREE.Mesh(toGeometry(surfaceNets(headGrid, dims, min, CELL), headField), clay));
  await pause();

  // socle et ombre de contact
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 64), new THREE.MeshStandardMaterial({ color: '#0f0e0d', roughness: 0.5 }));
  plinth.scale.set(1.16, 1, 0.66);
  plinth.position.set(0, -2.68, -0.5);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.03, 64), new THREE.MeshStandardMaterial({ color: '#9b1c1c', roughness: 0.6 }));
  ring.scale.set(1.2, 1, 0.7);
  ring.position.set(0, -2.755, -0.5);
  const shadow = softDisc({ radius: 2.4, color: '#000000', opacity: 0.5, y: -2.77 });
  shadow.position.z = -0.5;
  bust.add(plinth, ring);
  scene.add(shadow);

  // ----- volumes de cheveux et de barbe : construits à la demande, gardés ensuite -----
  const hairMaterial = new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.62, metalness: 0, side: THREE.DoubleSide });
  const volumes = new Map();
  function volume(kind, name) {
    const id = kind + ':' + name;
    if (volumes.has(id)) return volumes.get(id);
    const style = (kind === 'cut' ? CUTS : BEARDS)[name];
    let entry = null;
    if (style && style.field) {
      const values = new Float32Array(total).fill(1);
      for (let k = 0; k < nz; k++) {
        const z = min[2] + k * CELL;
        for (let j = 0; j < ny; j++) {
          const y = min[1] + j * CELL;
          if (y < -1.6) continue;
          const row = nx * (j + ny * k);
          for (let i = 0; i < half; i++) {
            const s = skullGrid[row + i];
            if (s > 0.9) continue;
            values[row + i] = values[row + nx - 1 - i] = style.field(Math.abs(min[0] + i * CELL), y, z, s);
          }
        }
      }
      const field = (x, y, z) => style.field(x, y, z, skull(Math.abs(x), y, z));
      const geometry = toGeometry(surfaceNets(values, dims, min, CELL), field, (x, y, z) => skull(Math.abs(x), y, z) < -0.022);
      const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 99);
      const material = hairMaterial.clone();
      material.clippingPlanes = [plane];
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      bust.add(mesh);
      entry = { mesh, plane };
    }
    volumes.set(id, entry);
    return entry;
  }

  // ----- état : coupe et barbe choisies, transitions -----
  const cutInputs = [...root.querySelectorAll('input[name="look-coupe"]')];
  const beardInputs = [...root.querySelectorAll('input[name="look-barbe"]')];
  const chosen = (inputs, fallback) => (inputs.find((input) => input.checked) || {}).value || fallback;
  const WIPE = { cut: [-0.75, 1.95], beard: [-1.55, 0.1] };
  const layers = {
    cut: { name: null, from: null, progress: 1, tintFrom: [0, -9, 0, 0.1, 0.1], tintTo: [0, -9, 0, 0.1, 0.1] },
    beard: { name: null, from: null, progress: 1, tintFrom: [0, 0.02], tintTo: [0, 0.02] },
  };
  const tintNow = (layer) => layer.tintFrom.map((value, n) => {
    const target = layer.tintTo[n];
    // les hauteurs « hors jeu » (−9) ne s'interpolent pas : on saute à la moitié du passage
    if (value < -5 || target < -5) return layer.progress < 0.5 ? value : target;
    return lerp(value, target, ss(0, 1, layer.progress));
  });
  function choose(kind, name, instant) {
    const layer = layers[kind];
    const table = kind === 'cut' ? CUTS : BEARDS;
    if (!table[name] || layer.name === name) return;
    const previous = layer.from && layer.progress < 1 ? volume(kind, layer.from) : null;
    if (previous) previous.mesh.visible = false;
    layer.tintFrom = tintNow(layer);
    layer.from = layer.name;
    layer.name = name;
    layer.tintTo = table[name].tint;
    layer.progress = instant || reduced ? 1 : 0;
    volume(kind, name);
    if (kind === 'cut' && !instant && !reduced) turnTo(table[name].view);
    if (kind === 'beard' && !instant && !reduced) turnTo(-0.5);
    wake();
  }
  function applyLayer(kind, dt) {
    const layer = layers[kind];
    if (layer.progress < 1) layer.progress = Math.min(1, layer.progress + dt / 0.75);
    const [low, high] = WIPE[kind];
    const line = lerp(low, high, ss(0, 1, layer.progress));
    const current = volume(kind, layer.name);
    const previous = layer.from ? volume(kind, layer.from) : null;
    if (previous) {
      previous.mesh.visible = layer.progress < 1;
      previous.plane.normal.set(0, 1, 0); // l'ancienne coupe ne subsiste qu'au-dessus de la ligne
      previous.plane.constant = -line;
    }
    if (current) {
      current.mesh.visible = true;
      current.plane.normal.set(0, -1, 0); // la nouvelle apparaît en dessous
      current.plane.constant = layer.progress < 1 ? line : 99;
    }
    const values = tintNow(layer);
    if (kind === 'cut') {
      tint.uScalp.value.set(values[0], values[1], values[2], values[3]);
      tint.uFade.value = values[4];
    } else {
      tint.uBeard.value.set(values[0], values[1]);
    }
  }

  // ----- rotation : au doigt, à la souris, au clavier, ou par les boutons Face / Profil / Nuque -----
  let yaw = -0.5, target = -0.5, pitch = 0.1, velocity = 0, dragging = false, lastX = 0, lastY = 0, idle = 0;
  function turnTo(angle) {
    // on prend le plus court chemin
    const turns = Math.round((yaw - angle) / (Math.PI * 2));
    target = angle + turns * Math.PI * 2;
    velocity = 0;
    idle = 0;
    wake();
  }
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    root.classList.add('is-touched');
    wake();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    yaw += dx * 0.011;
    target = yaw;
    pitch = clamp(pitch + (event.clientY - lastY) * 0.005, -0.12, 0.5);
    velocity = dx * 0.5;
    lastX = event.clientX;
    lastY = event.clientY;
    idle = 0;
    wake();
  });
  const release = () => { dragging = false; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') turnTo(target - 0.35);
    else if (event.key === 'ArrowRight') turnTo(target + 0.35);
    else return;
    event.preventDefault();
    root.classList.add('is-touched');
  });
  const views = { face: 0, profil: -Math.PI / 2, nuque: Math.PI };
  for (const button of root.querySelectorAll('[data-view]')) {
    button.addEventListener('click', () => {
      if (reduced) { yaw = target = views[button.dataset.view] || 0; wake(); } else turnTo(views[button.dataset.view] || 0);
    });
  }

  cutInputs.forEach((input) => input.addEventListener('change', () => choose('cut', chosen(cutInputs, 'degrade'))));
  beardInputs.forEach((input) => input.addEventListener('change', () => choose('beard', chosen(beardInputs, 'rase'))));

  // ----- rendu : seulement à l'écran, et seulement quand quelque chose bouge -----
  let visible = false, awakeUntil = 0, last = performance.now(), time = 0;
  function wake() { awakeUntil = performance.now() + 1600; }
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
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) { last = performance.now(); wake(); } }).observe(canvas);

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const busy = layers.cut.progress < 1 || layers.beard.progress < 1 || dragging || Math.abs(target - yaw) > 0.002 || Math.abs(velocity) > 0.01;
    if (!visible || (reduced && !busy && now > awakeUntil)) return;
    time += dt;
    idle += dt;
    if (!dragging) {
      if (Math.abs(velocity) > 0.01) {
        yaw += velocity * dt;
        target = yaw;
        velocity *= Math.exp(-3.2 * dt);
      } else {
        yaw += (target - yaw) * (1 - Math.exp(-4.2 * dt));
      }
    }
    applyLayer('cut', dt);
    applyLayer('beard', dt);
    // au repos, la tête se balance à peine : assez pour lire le volume, jamais un manège
    const sway = reduced ? 0 : Math.sin(time * 0.55) * 0.13 * ss(1.5, 4, idle);
    const fovY = THREE.MathUtils.degToRad(camera.fov) / 2;
    const distance = Math.max(2.5 / Math.tan(fovY), 1.5 / (Math.tan(fovY) * camera.aspect));
    camera.position.set(0, -0.42 + Math.sin(pitch) * distance, Math.cos(pitch) * distance - 0.3);
    camera.lookAt(0, -0.42, -0.3);
    bust.rotation.y = yaw + sway;
    renderer.render(scene, camera);
  }

  resize();
  choose('cut', chosen(cutInputs, 'degrade'), true);
  choose('beard', chosen(beardInputs, 'rase'), true);
  requestAnimationFrame(frame);
  root.classList.add('is-ready');

  // les autres volumes se préparent pendant les temps morts : le premier clic est immédiat
  const rnd = seeded(4);
  const rest = [...Object.keys(CUTS).map((name) => ['cut', name]), ...Object.keys(BEARDS).map((name) => ['beard', name])];
  for (const [kind, name] of rest) {
    await new Promise((resolve) => setTimeout(resolve, 260 + rnd() * 80));
    volume(kind, name);
  }
}
