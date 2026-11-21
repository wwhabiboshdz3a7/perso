// Écrin — boîte à outils partagée par les démos : éclairage de studio, fonds, matières,
// particules, bruit, chargement de modèles.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ---------- éclairage ----------

// Environnement de studio (boîtes à lumière) pour les reflets des matières PBR.
// Chaque panneau : { size: [l, h], color, intensity, position: [x, y, z] }.
export function studioEnvironment(renderer, options = {}) {
  const {
    ambient = '#050505',
    panels = [
      { size: [7, 7], color: '#ffffff', intensity: 5, position: [0, 7, 0] },
      { size: [3, 6], color: '#fff0dc', intensity: 9, position: [-6, 2.5, 3.5] },
      { size: [1.4, 7], color: '#cfdcff', intensity: 5, position: [6, 2, -3] },
      { size: [9, 0.6], color: '#ffffff', intensity: 3, position: [0, 0.6, 7] },
    ],
  } = options;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(ambient);
  const disposables = [];
  for (const panel of panels) {
    const geometry = new THREE.PlaneGeometry(panel.size[0], panel.size[1]);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(panel.color).multiplyScalar(panel.intensity),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.fromArray(panel.position);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    disposables.push(geometry, material);
  }
  const generator = new THREE.PMREMGenerator(renderer);
  const texture = generator.fromScene(scene, 0.035).texture;
  generator.dispose();
  for (const item of disposables) item.dispose();
  return texture;
}

// Trois lumières directes : principale, contre-jour, débouchage. Renvoie { key, rim, fill, group }.
export function threePoint(options = {}) {
  const {
    key = { color: '#fff1e0', intensity: 2.6, position: [-4, 6, 5] },
    rim = { color: '#bcd0ff', intensity: 2.2, position: [5, 3, -6] },
    fill = { color: '#ffffff', intensity: 0.5, position: [4, 1, 6] },
  } = options;
  const group = new THREE.Group();
  const make = (spec) => {
    const light = new THREE.DirectionalLight(spec.color, spec.intensity);
    light.position.fromArray(spec.position);
    group.add(light);
    return light;
  };
  return { key: make(key), rim: make(rim), fill: make(fill), group };
}

// ---------- fonds ----------

// Grande sphère dégradée derrière la scène : halo doux autour d'une direction + vignette.
export function backdrop(options = {}) {
  const { top = '#17130f', bottom = '#050404', glow = '#3a2a1a', glowDirection = [0, 0.15, -1], glowSize = 0.55, radius = 80 } = options;
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(top) },
      uBottom: { value: new THREE.Color(bottom) },
      uGlow: { value: new THREE.Color(glow) },
      uDirection: { value: new THREE.Vector3(...glowDirection).normalize() },
      uSize: { value: glowSize },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uGlow; uniform vec3 uDirection; uniform float uSize;
      varying vec3 vDirection;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec3 d = normalize(vDirection);
        vec3 color = mix(uBottom, uTop, smoothstep(-0.6, 0.8, d.y));
        float halo = smoothstep(1.0 - uSize, 1.0, dot(d, uDirection));
        color += uGlow * halo * halo;
        color += (hash(gl_FragCoord.xy) - 0.5) / 255.0; // tramage : évite les bandes dans les dégradés sombres
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), material);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}

// Disque à bord fondu posé au sol : ombre de contact (blending normal, couleur sombre)
// ou flaque de lumière (additive: true).
export function softDisc(options = {}) {
  const { radius = 2, color = '#000000', opacity = 0.6, additive = false, y = 0, falloff = 1.6 } = options;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const d = Math.hypot(i - size / 2 + 0.5, j - size / 2 + 0.5) / (size / 2);
      const a = Math.pow(Math.max(0, 1 - d), falloff);
      const o = (j * size + i) * 4;
      image.data[o] = image.data[o + 1] = image.data[o + 2] = 255;
      image.data[o + 3] = Math.round(a * 255);
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color,
    opacity,
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: !additive,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.renderOrder = -1;
  return mesh;
}

// ---------- matières ----------

export const materials = {
  gold: (o = {}) => new THREE.MeshStandardMaterial({ color: '#d8a94a', metalness: 1, roughness: 0.22, ...o }),
  roseGold: (o = {}) => new THREE.MeshStandardMaterial({ color: '#d99a7c', metalness: 1, roughness: 0.2, ...o }),
  steel: (o = {}) => new THREE.MeshStandardMaterial({ color: '#c9ccd1', metalness: 1, roughness: 0.18, ...o }),
  brushed: (o = {}) => new THREE.MeshStandardMaterial({ color: '#b9bcc2', metalness: 1, roughness: 0.42, ...o }),
  blackMetal: (o = {}) => new THREE.MeshStandardMaterial({ color: '#16171a', metalness: 1, roughness: 0.35, ...o }),
  ceramic: (o = {}) => new THREE.MeshPhysicalMaterial({ color: '#f4efe6', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, ...o }),
  lacquer: (o = {}) => new THREE.MeshPhysicalMaterial({ color: '#0c0c0e', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, ...o }),
  matte: (o = {}) => new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.9, metalness: 0, ...o }),
  // Verre réfringent : coûteux (une passe de rendu en plus), à réserver à un ou deux objets.
  glass: (o = {}) =>
    new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.03,
      metalness: 0,
      transmission: 1,
      thickness: 0.6,
      ior: 1.5,
      attenuationColor: new THREE.Color('#ffffff'),
      attenuationDistance: 4,
      ...o,
    }),
  // Verre « léger » sans passe de réfraction : transparent, reflets seulement.
  thinGlass: (o = {}) =>
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, depthWrite: false, ...o }),
};

// ---------- particules ----------

// Poussières, braises, bulles… Points flous qui dérivent dans une boîte et rebouclent.
//   new Particles({ count, box: [l, h, p], center: [x, y, z], color, size, speed: [vx, vy, vz], wobble, additive })
//   scene.add(p.points) ; p.update(time) à chaque image ; p.material.uniforms.uOpacity.value pour fondre.
export class Particles {
  constructor(options = {}) {
    const {
      count = 400,
      box = [8, 5, 8],
      center = [0, 1.5, 0],
      color = '#ffffff',
      size = 0.05,
      speed = [0, 0.08, 0],
      wobble = 0.15,
      additive = true,
      opacity = 1,
      twinkle = 0.5,
    } = options;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = Math.random();
      positions[i * 3 + 1] = Math.random();
      positions[i * 3 + 2] = Math.random();
      seeds[i * 4] = Math.random();
      seeds[i * 4 + 1] = Math.random();
      seeds[i * 4 + 2] = Math.random();
      seeds[i * 4 + 3] = 0.35 + Math.random() * 0.65;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uBox: { value: new THREE.Vector3(...box) },
        uCenter: { value: new THREE.Vector3(...center) },
        uSpeed: { value: new THREE.Vector3(...speed) },
        uColor: { value: new THREE.Color(color) },
        uSize: { value: size },
        uWobble: { value: wobble },
        uOpacity: { value: opacity },
        uTwinkle: { value: twinkle },
        uScale: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform float uTime; uniform vec3 uBox; uniform vec3 uCenter; uniform vec3 uSpeed;
        uniform float uSize; uniform float uWobble; uniform float uTwinkle; uniform float uScale;
        varying float vAlpha;
        void main() {
          vec3 p = fract(position + uSpeed * uTime * aSeed.w / uBox) - 0.5;
          p *= uBox;
          p.x += sin(uTime * (0.4 + aSeed.x) + aSeed.y * 6.283) * uWobble;
          p.z += cos(uTime * (0.3 + aSeed.z) + aSeed.x * 6.283) * uWobble;
          p += uCenter;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * aSeed.w * uScale / -mv.z;
          // fondu aux bords de la boîte pour masquer le rebouclage
          vec3 edge = 1.0 - smoothstep(0.35, 0.5, abs(p - uCenter) / uBox);
          float blink = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * (1.0 + aSeed.y * 2.0) + aSeed.z * 6.283));
          vAlpha = edge.x * edge.y * edge.z * blink;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uOpacity;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor, a * a * vAlpha * uOpacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
  }

  // `height` : hauteur du rendu en pixels (state.height × pixelRatio), pour une taille stable.
  update(time, height = 900) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uScale.value = height;
  }
}

// ---------- bruit ----------

function hash3(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

// Bruit de valeur 3D lissé, 0…1.
export function noise3(x, y = 0, z = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const mix = (a, b, t) => a + (b - a) * t;
  return mix(
    mix(mix(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), mix(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
    mix(mix(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), mix(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v),
    w
  );
}

// Bruit fractal (plusieurs octaves), 0…1.
export function fbm(x, y = 0, z = 0, octaves = 4) {
  let sum = 0, amplitude = 0.5, total = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise3(x, y, z) * amplitude;
    total += amplitude;
    x *= 2.03; y *= 2.03; z *= 2.03;
    amplitude *= 0.5;
  }
  return sum / total;
}

// Générateur pseudo-aléatoire reproductible : const rnd = seeded(7); rnd() → 0…1
export function seeded(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------- textures et modèles ----------

// Texture dessinée dans un canvas 2D : canvasTexture(512, (ctx, size) => { … }).
export function canvasTexture(size, draw, { srgb = true, repeat = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  if (repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

export function loadTexture(url, { srgb = true } = {}) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

// Charge un modèle .glb et renvoie sa scène (THREE.Group).
export async function loadModel(url) {
  const gltf = await new GLTFLoader().loadAsync(url);
  return gltf.scene;
}

// Libère géométries, matières et textures d'un objet retiré de la scène.
export function dispose(object) {
  object.traverse((node) => {
    if (node.geometry) node.geometry.dispose();
    const list = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
    for (const material of list) {
      for (const value of Object.values(material)) if (value && value.isTexture) value.dispose();
      material.dispose();
    }
  });
}
