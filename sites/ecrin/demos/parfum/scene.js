// Sévane — « Nuit d'Ambre » : un flacon de verre taillé à pans coupés, son jus ambré, son capot doré.
// Le capot se soulève au chapitre du cœur, une brume s'épanouit ; les notes (tête, cœur, fond)
// gravitent tour à tour autour du flacon, de l'épaule vers le socle : la pyramide olfactive.

import * as THREE from 'three';
import { Stage, span, track, clamp, lerp, smooth, smoother } from '../../assets/js/stage.js';
import { studioEnvironment, threePoint, backdrop, softDisc, materials, Particles, canvasTexture, seeded } from '../../assets/js/kit.js';

// ---------- cotes du flacon (unités de scène) ----------
const BODY = { w: 0.82, d: 0.4, c: 0.17, shoulder: 1.92, neck: 2.12, top: 2.36 };
const LIQUID = { bottom: 0.34, top: 1.68 };
const CAP_REST = 2.218; // hauteur du pied du capot fermé
const NOZZLE = new THREE.Vector3(0, 2.76, 0); // d'où part la brume
const PLATE = { w: 0.58, h: 0.31, y: 0.98 };

const stage = new Stage({ background: '#0b0709', exposure: 1.06 });
if (stage.ok) init();

async function init() {
  const { scene, renderer } = stage;

  // ---------- lumière ----------
  stage.setEnvironment(
    studioEnvironment(renderer, {
      ambient: '#070405',
      panels: [
        { size: [8, 8], color: '#fff1e2', intensity: 2.4, position: [0, 9, 2] },
        { size: [1.5, 9], color: '#ffe8cc', intensity: 11, position: [-7, 3, 2.5] },
        { size: [1.1, 8], color: '#ffd9b0', intensity: 8, position: [7, 3.5, -1] },
        { size: [7, 3], color: '#ff9a48', intensity: 2.6, position: [0, 1.6, -8] },
        { size: [4, 1.2], color: '#f0c0cf', intensity: 2.2, position: [3, 0.6, 7] },
        // bande basse, devant : son reflet glisse sur la grande face du verre quand le flacon tourne
        { size: [0.32, 5], color: '#fff2e2', intensity: 9, position: [-1.15, -1.3, 8] },
      ],
    }),
    1
  );
  const lights = threePoint({
    key: { color: '#fff0de', intensity: 2.2, position: [-4, 6, 5] },
    rim: { color: '#ffae5e', intensity: 2.6, position: [5, 3, -6] },
    fill: { color: '#f3d9e0', intensity: 0.35, position: [4, 1.5, 6] },
  });
  stage.add(lights.group);
  const back = backdrop({ top: '#160b11', bottom: '#040203', glow: '#3a1a10', glowDirection: [0.25, 0.08, -1], glowSize: 0.5 });
  stage.add(back);

  // ---------- socle ----------
  const plinth = new THREE.Mesh(
    lathe([[0, 0], [1.46, 0], [1.5, -0.006], [1.525, -0.025], [1.53, -0.06], [1.53, -0.2], [1.5, -0.24], [0, -0.24]], 96),
    new THREE.MeshStandardMaterial({ color: '#0d0608', roughness: 0.82, metalness: 0, envMapIntensity: 0.5, side: THREE.DoubleSide })
  );
  stage.add(plinth);
  const shadow = softDisc({ radius: 1.35, color: '#000000', opacity: 0.6, y: 0.004, falloff: 1.3 });
  shadow.scale.set(1, 0.62, 1);
  const pool = softDisc({ radius: 1.4, color: '#ff9a3c', opacity: 0.13, additive: true, y: 0.006, falloff: 2.2 });
  stage.add(shadow, pool);

  // ---------- le flacon ----------
  const bottle = new THREE.Group();
  bottle.position.y = 0.004;
  stage.add(bottle);

  // verre : rectangle à pans coupés, épaules marquées, col (le seul matériau à transmission de la scène)
  const { w, d, c } = BODY;
  const glass = new THREE.Mesh(
    faceted([
      [0, w - 0.07, d - 0.07, c - 0.02],
      [0.08, w, d, c],
      [BODY.shoulder, w, d, c],
      [BODY.shoulder + 0.07, w - 0.07, d - 0.06, c - 0.02],
      [BODY.neck, 0.27, 0.27, 0.158],
      [BODY.top, 0.22, 0.22, 0.129],
    ]),
    materials.glass({ thickness: 0.85, ior: 1.52, roughness: 0.025, attenuationColor: new THREE.Color('#ffe6c4'), attenuationDistance: 2.6, envMapIntensity: 1.25, specularIntensity: 1 })
  );
  bottle.add(glass);

  // jus : volume intérieur, lumineux comme un ambre éclairé à contre-jour
  const juice = new THREE.ShaderMaterial({
    uniforms: {
      uGlow: { value: 1 },
      uDeep: { value: new THREE.Color('#3a0d03') },
      uMid: { value: new THREE.Color('#a8480c') },
      uBright: { value: new THREE.Color('#f7a33a') },
      uRange: { value: new THREE.Vector2(LIQUID.bottom, LIQUID.top) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal; varying vec3 vView; varying vec3 vLocal;
      void main() {
        vLocal = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uGlow; uniform vec3 uDeep; uniform vec3 uMid; uniform vec3 uBright; uniform vec2 uRange;
      varying vec3 vNormal; varying vec3 vView; varying vec3 vLocal;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float h = clamp((vLocal.y - uRange.x) / (uRange.y - uRange.x), 0.0, 1.0);
        float side = smoothstep(0.12, 0.7, abs(vLocal.x));
        vec3 color = mix(uDeep, uMid, pow(facing, 1.6) * mix(1.0, 0.55, h));
        // cœur lumineux en bas, comme un ambre éclairé par derrière
        float core = pow(facing, 4.0) * (1.0 - side * 0.9) * pow(1.0 - h, 1.4);
        color += uBright * core * 0.85;
        // reflet oblique d'une boîte à lumière à travers le jus
        float streak = smoothstep(0.1, 0.0, abs(vLocal.x * 0.9 + vLocal.y * 0.28 - 0.08)) * pow(facing, 3.0);
        color += uBright * streak * 0.16;
        color *= mix(1.0, 0.42, side * side);
        color += uBright * smoothstep(0.95, 1.0, h) * 0.2; // ménisque
        gl_FragColor = vec4(color * uGlow, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const liquid = new THREE.Mesh(
    faceted([
      [LIQUID.bottom, w - 0.26, d - 0.24, c - 0.07],
      [LIQUID.bottom + 0.1, w - 0.135, d - 0.125, c - 0.03],
      [LIQUID.top, w - 0.135, d - 0.125, c - 0.03],
    ]),
    juice
  );
  bottle.add(liquid);

  // tube plongeur, visible dans la chambre d'air au-dessus du jus
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, BODY.neck - LIQUID.top + 0.2, 10), new THREE.MeshStandardMaterial({ color: '#e9d8bd', roughness: 0.35 }));
  tube.position.y = (BODY.neck + LIQUID.top) / 2 + 0.1;
  bottle.add(tube);

  // bague dorée et pompe
  const gold = materials.gold({ color: '#d9a658', roughness: 0.2, side: THREE.DoubleSide });
  const goldSatin = materials.gold({ color: '#cf9a4c', roughness: 0.36, side: THREE.DoubleSide });
  const collarGeometry = lathe(
    [
      [0.2, BODY.neck], [0.315, BODY.neck], [0.325, BODY.neck + 0.008], [0.33, BODY.neck + 0.02], [0.33, BODY.neck + 0.04], [0.33, BODY.neck + 0.06],
      [0.33, BODY.neck + 0.08], [0.325, BODY.neck + 0.092], [0.31, BODY.neck + 0.098], [0.29, BODY.neck + 0.1], [0.28, BODY.neck + 0.104], [0.276, BODY.neck + 0.115],
      [0.276, 2.4], [0.27, 2.415], [0.255, 2.422], [0.06, 2.422],
    ],
    180
  );
  flute(collarGeometry, { from: BODY.neck + 0.012, to: BODY.neck + 0.088, count: 60, depth: 0.007, min: 0.32 });
  const collar = new THREE.Mesh(collarGeometry, gold);
  const pump = new THREE.Mesh(
    lathe([[0, 2.42], [0.05, 2.42], [0.05, 2.5], [0.118, 2.5], [0.13, 2.506], [0.134, 2.52], [0.134, 2.72], [0.13, 2.736], [0.118, 2.742], [0, 2.742]], 48),
    goldSatin
  );
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 16), materials.blackMetal());
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.set(0, 2.64, 0.134);
  bottle.add(collar, pump, nozzle);

  // capot : cylindre à godrons, cabochon ambré
  const cap = new THREE.Group();
  const sidePoints = [];
  for (let i = 0; i <= 14; i++) sidePoints.push([0.345, 0.03 + (i / 14) * 0.66]);
  const capGeometry = lathe(
    [
      [0, 0.61], [0.27, 0.61], [0.284, 0.6], [0.288, 0.585], [0.288, 0.012], [0.292, 0.003], [0.3, 0], [0.33, 0], [0.341, 0.006], [0.345, 0.018],
      ...sidePoints,
      [0.345, 0.702], [0.34, 0.722], [0.326, 0.736], [0.305, 0.742], [0.262, 0.742], [0.25, 0.737], [0.244, 0.726], [0.24, 0.716], [0, 0.716],
    ],
    240
  );
  flute(capGeometry, { from: 0.075, to: 0.645, count: 30, depth: 0.017, min: 0.34 });
  cap.add(new THREE.Mesh(capGeometry, gold));
  const cabochon = new THREE.Mesh(
    new THREE.SphereGeometry(0.238, 48, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color: '#56200a', emissive: '#6a2606', emissiveIntensity: 0.55, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4 })
  );
  cabochon.scale.y = 0.2;
  cabochon.position.y = 0.716;
  cap.add(cabochon);
  cap.position.y = CAP_REST;
  bottle.add(cap);

  // plaque gravée
  await Promise.all([document.fonts.load('400 64px "Bodoni"'), document.fonts.load('italic 400 64px "Bodoni"'), document.fonts.load('600 30px "Manrope"')]).catch(() => {});
  const plateTexture = plateEngraving();
  plateTexture.repeat.set(1 / PLATE.w, 1 / PLATE.h);
  plateTexture.offset.set(0.5, 0.5);
  const plate = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedRect(PLATE.w, PLATE.h, 0.018), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 6 }),
    // « transparent » pour être dessinée après le verre : sinon son image se dédouble dans la réfraction
    [
      new THREE.MeshStandardMaterial({ color: '#f1c684', metalness: 0.72, roughness: 0.4, map: plateTexture, bumpMap: plateTexture, bumpScale: 1.2, envMapIntensity: 1.3, transparent: true }),
      materials.gold({ color: '#d9a658', roughness: 0.24, transparent: true }),
    ]
  );
  plate.position.set(0, PLATE.y, BODY.d + 0.005);
  bottle.add(plate);

  // ---------- poussières dorées, brume ----------
  const dust = new Particles({ count: 280, box: [10, 7, 8], center: [0, 2.2, 0], color: '#ffcf8a', size: 0.05, speed: [0.02, 0.05, 0.01], wobble: 0.3, twinkle: 0.7, opacity: 0.8 });
  stage.add(dust.points);
  const mist = makeMist(620);
  mist.points.position.copy(NOZZLE);
  bottle.add(mist.points);

  // ---------- les notes ----------
  const rnd = seeded(23);

  // tête : baies roses et zestes de bergamote, autour des épaules et du capot
  const berries = new Swarm(
    new THREE.IcosahedronGeometry(1, 2),
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2, emissive: '#3a0812', emissiveIntensity: 0.5 }),
    30, rnd,
    { radius: [1.15, 2.0], y: [1.5, 3.3], size: [0.035, 0.07], speed: [0.1, 0.24], colors: ['#e0566f', '#c93d5c', '#ee8394', '#b4324f'] }
  );
  const zests = new Swarm(
    ribbon({ turns: 1.35, height: 0.5, r0: 0.3, r1: 0.22, width: 0.26, segments: 40, twist: 0.5 }),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5, side: THREE.DoubleSide, emissive: '#2a2c06', emissiveIntensity: 0.6 }),
    13, rnd,
    { radius: [1.2, 2.05], y: [1.4, 3.2], size: [0.22, 0.36], speed: [0.08, 0.2], colors: ['#d9d66a', '#c6cf58', '#ecdf7c', '#b9c653'], tumble: 0.5 }
  );

  // cœur : pétales de rose de mai, quelques pétales d'iris, sur toute la hauteur
  const petals = new Swarm(
    petalGeometry(),
    new THREE.MeshStandardMaterial({ map: petalTexture(), roughness: 0.58, side: THREE.DoubleSide, emissive: '#3c1217', emissiveIntensity: 0.45 }),
    40, rnd,
    { radius: [1.2, 2.3], y: [0.5, 4.3], size: [0.2, 0.38], speed: [0.07, 0.2], colors: ['#f2a9b8', '#f7cfcd', '#e48aa2', '#fbe3da', '#c3aee6', '#ae97dc'], tumble: 0.8 }
  );

  // fond : éclats d'ambre près du socle, volutes de santal
  const shards = new Swarm(
    shardGeometry(rnd),
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true, emissive: '#8a3406', emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, flatShading: true, envMapIntensity: 2 }),
    18, rnd,
    { radius: [1.18, 2.2], y: [0.16, 1.5], size: [0.06, 0.16], speed: [0.03, 0.09], colors: ['#ffffff', '#ffe2b0', '#ffc98a', '#fff0d0'], tumble: 0.25, stretch: 0.5 }
  );
  const wisps = makeWisps(rnd);
  stage.add(berries.mesh, zests.mesh, petals.mesh, shards.mesh, wisps.group);

  // ---------- plans de caméra, un par chapitre ----------
  stage.setShots([
    { target: [0, 1.45, 0], radius: 9.2, azimuth: -20, elevation: 7, fov: 30, shift: [0.4, 0], portrait: { target: [0, 1.5, 0], radius: 11, shift: [0, 0.36] } },
    { target: [0, 2.4, 0], radius: 6.4, azimuth: 30, elevation: 15, fov: 30, shift: [-0.38, 0], portrait: { target: [0, 2.55, 0], radius: 7.2, shift: [0, 0.42] } },
    { target: [0, 2.2, 0], radius: 10.2, azimuth: -10, elevation: 3, fov: 30, shift: [0.38, 0], portrait: { target: [0, 2.5, 0], radius: 11.4, shift: [0, 0.36] } },
    { target: [0, 0.83, 0], radius: 6.4, azimuth: 22, elevation: 8, fov: 30, shift: [-0.54, 0], portrait: { target: [0, 1.57, 0], radius: 7.6, shift: [0, 0.44] } },
    { target: [0, 1.5, 0], radius: 12, azimuth: 0, elevation: 9, fov: 30, shift: [0, -0.36], portrait: { target: [0, 1.5, 0], radius: 11.5, shift: [0, 0.38] } },
  ]);

  const glowColors = ['#3a1a10', '#33200f', '#3a1524', '#4a1f08', '#3a1a10'].map((hex) => new THREE.Color(hex));
  const rimColors = ['#ffae5e', '#ffd48a', '#ff9fb0', '#ff8a38', '#ffb768'].map((hex) => new THREE.Color(hex));
  let drift = 0; // temps « vivant » : figé si l'utilisateur réduit les animations

  // Les notes s'effacent avant d'atteindre le texte : on mesure où se trouve celui de chaque
  // chapitre à l'écran (-1…1). Paysage : bord intérieur de la colonne ; portrait : haut du bloc.
  const blocks = stage.chapters.map((chapter) => ({
    inner: chapter.querySelector('.chapter__inner'),
    side: chapter.classList.contains('chapter--center') ? 0 : chapter.classList.contains('chapter--right') ? 1 : -1,
    edge: 0,
    top: -0.1,
  }));
  const measure = () => {
    for (const block of blocks) {
      const rect = block.inner.getBoundingClientRect();
      block.edge = ((block.side > 0 ? rect.left : rect.right) / window.innerWidth) * 2 - 1;
      block.top = 1 - ((window.innerHeight * 0.91 - rect.height) / window.innerHeight) * 2;
    }
  };
  measure();
  window.addEventListener('resize', measure, { passive: true });
  document.fonts.ready.then(measure);
  const fade = (a, b, x) => smooth(clamp((x - a) / (b - a)));
  const view = { f: 0, portrait: false };
  const guard = (x, y) => {
    let keep = 1;
    blocks.forEach((block, index) => {
      const weight = 1 - fade(0.4, 0.62, Math.abs(view.f - index)); // le texte de ce chapitre est-il à l'écran ?
      if (weight <= 0) return;
      let clear = 1;
      if (view.portrait) clear = fade(block.top + 0.03, block.top + 0.2, y);
      else if (block.side > 0) clear = 1 - fade(block.edge - 0.2, block.edge - 0.05, x);
      else if (block.side < 0) clear = fade(block.edge + 0.05, block.edge + 0.2, x);
      keep *= 1 - weight * (1 - clear);
    });
    return keep;
  };

  stage.onFrame(({ f, dt, reduced, height, portrait }) => {
    if (!reduced) drift += dt;
    const pixels = height * stage.pixelRatio;

    // le flacon pivote un peu d'un chapitre à l'autre
    bottle.rotation.y = track(f, [-0.2, 0.42, -0.06, 0.18, 0]) + Math.sin(drift * 0.22) * 0.04;

    // le capot se soulève (cœur), reste en l'air (fond), se repose (découvrir)
    const lift = span(f, 1.42, 2.0) * (1 - span(f, 3.3, 3.9));
    cap.position.set(lift * 0.3, CAP_REST + lift * 1.12 + Math.sin(drift * 0.7) * 0.03 * lift, lift * 0.1);
    cap.rotation.set(lift * 0.1, lift * 1.9, -lift * 0.2);

    // la brume s'épanouit puis se dissipe
    mist.material.uniforms.uBloom.value = clamp((f - 1.58) / 0.62);
    mist.material.uniforms.uFade.value = 1 - span(f, 2.4, 3.0);
    mist.material.uniforms.uTime.value = drift;
    mist.material.uniforms.uScale.value = pixels;
    mist.points.visible = f > 1.55 && f < 3.02;

    // la pyramide : tête, cœur, fond
    const head = span(f, 0.45, 0.95) * (1 - span(f, 1.38, 1.9));
    const heart = span(f, 1.55, 2.05) * (1 - span(f, 2.45, 2.95));
    const base = span(f, 2.5, 3.0) * (1 - span(f, 3.4, 3.92));
    stage.camera.updateMatrixWorld();
    view.f = f;
    view.portrait = portrait;
    berries.update(head, f, drift, stage.camera, guard);
    zests.update(head, f, drift, stage.camera, guard);
    petals.update(heart, f, drift, stage.camera, guard);
    shards.update(base, f, drift, stage.camera, guard);
    wisps.update(base, f, drift);

    // lumière : plus rosée au cœur, plus chaude et plus dense au fond
    trackColor(back.material.uniforms.uGlow.value, f, glowColors);
    trackColor(lights.rim.color, f, rimColors);
    lights.rim.intensity = track(f, [2.6, 2.2, 2.8, 3.4, 2.6]);
    lights.key.intensity = track(f, [2.2, 2.4, 2.0, 1.5, 2.3]);
    juice.uniforms.uGlow.value = track(f, [1, 0.95, 1.12, 1.35, 1.05]) * (1 + Math.sin(drift * 0.9) * 0.025);
    pool.material.opacity = track(f, [0.1, 0.08, 0.12, 0.2, 0.12]);
    dust.material.uniforms.uOpacity.value = track(f, [0.8, 0.55, 0.5, 0.75, 1]);
    dust.update(drift, pixels);
  });

  await stage.start();
}

// ---------- animation ----------

const _color = new THREE.Color();
function trackColor(out, f, colors) {
  const last = colors.length - 1;
  const x = clamp(f, 0, last);
  const i = Math.min(Math.floor(x), last);
  const j = Math.min(i + 1, last);
  out.copy(_color.lerpColors(colors[i], colors[j], smoother(x - i)));
}

// Essaim d'objets instanciés en orbite autour du flacon. update(présence 0…1, f, temps).
class Swarm {
  constructor(geometry, material, count, rnd, spec) {
    this.mesh = new THREE.InstancedMesh(geometry, material, count);
    this.mesh.frustumCulled = false;
    const pick = (range) => lerp(range[0], range[1], rnd());
    const color = new THREE.Color();
    this.items = [];
    for (let i = 0; i < count; i++) {
      this.items.push({
        radius: pick(spec.radius),
        y: pick(spec.y),
        phase: (i / count + rnd() * 0.06) * Math.PI * 2,
        speed: pick(spec.speed) * (rnd() < 0.82 ? 1 : -0.6),
        size: pick(spec.size),
        stretch: 1 + (spec.stretch || 0) * (rnd() - 0.3),
        axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
        turn: rnd() * Math.PI * 2,
        spin: (0.25 + rnd() * 0.75) * (spec.tumble ?? 0.4) * (rnd() < 0.5 ? -1 : 1),
        delay: rnd(),
        bob: 0.4 + rnd() * 0.6,
      });
      this.mesh.setColorAt(i, color.set(spec.colors[Math.floor(rnd() * spec.colors.length)]));
    }
    this.mesh.instanceColor.needsUpdate = true;
    this.mesh.visible = false;
    this._m = new THREE.Matrix4();
    this._p = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
  }

  // `guard(x, y)` : 0…1 selon la position à l'écran (-1…1), pour s'effacer à l'approche du texte.
  update(presence, f, time, camera, guard) {
    this.mesh.visible = presence > 0.001;
    if (!this.mesh.visible) return;
    this.items.forEach((item, index) => {
      let v = smooth(clamp(presence * 1.7 - item.delay * 0.7));
      const angle = item.phase + item.speed * time + f * 0.7 * Math.sign(item.speed);
      const radius = item.radius * lerp(0.82, 1, v);
      this._p.set(Math.cos(angle) * radius, item.y + Math.sin(time * item.bob + item.phase) * 0.07 - (1 - v) * 0.35, Math.sin(angle) * radius);
      if (guard) {
        this._s.copy(this._p).project(camera);
        v *= guard(this._s.x, this._s.y);
      }
      this._q.setFromAxisAngle(item.axis, item.turn + item.spin * time + f * 1.6 * item.spin);
      const size = item.size * v;
      this._s.set(size, size * item.stretch, size);
      this.mesh.setMatrixAt(index, this._m.compose(this._p, this._q, this._s));
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// Brume : un bouquet de points flous qui jaillit de la pompe et s'ouvre en corolle.
function makeMist(count) {
  const rnd = seeded(77);
  const positions = new Float32Array(count * 3);
  const directions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const polar = (0.08 + Math.pow(rnd(), 0.8) * 0.92) * 1.15; // angle depuis la verticale
    const around = rnd() * Math.PI * 2;
    directions[i * 3] = Math.sin(polar) * Math.cos(around);
    directions[i * 3 + 1] = Math.cos(polar);
    directions[i * 3 + 2] = Math.sin(polar) * Math.sin(around);
    seeds[i * 4] = rnd();
    seeds[i * 4 + 1] = rnd();
    seeds[i * 4 + 2] = rnd();
    seeds[i * 4 + 3] = rnd();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aDirection', new THREE.BufferAttribute(directions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uBloom: { value: 0 },
      uFade: { value: 1 },
      uTime: { value: 0 },
      uScale: { value: 900 },
      uWarm: { value: new THREE.Color('#ffb060') },
      uPale: { value: new THREE.Color('#ffe9d2') },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aDirection; attribute vec4 aSeed;
      uniform float uBloom; uniform float uTime; uniform float uScale;
      varying float vAlpha; varying float vMix; varying float vSoft;
      void main() {
        float b = clamp((uBloom - aSeed.x * 0.4) / 0.6, 0.0, 1.0);
        float e = 1.0 - pow(1.0 - b, 2.6);
        float swirl = e * (0.8 + aSeed.y * 1.6) + uTime * 0.1 * (0.4 + aSeed.z);
        vec3 dir = aDirection;
        float c = cos(swirl), s = sin(swirl);
        dir.xz = mat2(c, -s, s, c) * dir.xz;
        float puff = step(0.62, aSeed.w); // gros flocons diffus ou fines gouttelettes
        float reach = mix(0.5, 2.3, aSeed.z) * mix(1.0, 0.72, puff);
        vec3 p = dir * reach * e;
        p.y += e * e * (0.25 + aSeed.y * 0.7);
        p.x += sin(uTime * 0.45 + aSeed.x * 6.283) * 0.06 * e;
        p.z += cos(uTime * 0.38 + aSeed.y * 6.283) * 0.06 * e;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float size = mix(0.07 + aSeed.y * 0.07, 0.75 + aSeed.x * 0.6, puff) * (0.35 + e * 0.85);
        gl_PointSize = min(size * uScale / -mv.z, 220.0);
        float twinkle = 0.75 + 0.25 * sin(uTime * (1.0 + aSeed.x * 2.0) + aSeed.z * 6.283);
        vAlpha = smoothstep(0.0, 0.12, b) * (1.0 - 0.5 * e) * mix(0.95 * twinkle, 0.13, puff);
        vMix = aSeed.x;
        vSoft = puff;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uWarm; uniform vec3 uPale; uniform float uFade;
      varying float vAlpha; varying float vMix; varying float vSoft;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a = mix(a * a, a * a * a, 1.0 - vSoft);
        gl_FragColor = vec4(mix(uWarm, uPale, vMix), a * vAlpha * uFade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { points, material };
}

// Volutes : rubans de fumée dorée qui montent du socle.
function makeWisps(rnd) {
  const geometry = ribbon({ turns: 1.6, height: 2.6, r0: 0.12, r1: 0.42, width: 0.34, segments: 90, twist: 2.4 });
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color('#ffc988') } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; uniform float uTime; uniform vec3 uColor;
      varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
      void main() {
        float along = pow(sin(3.14159 * vUv.x), 1.3) * smoothstep(0.0, 0.25, vUv.x);
        float across = 1.0 - pow(abs(vUv.y * 2.0 - 1.0), 2.0);
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float sheen = 0.3 + 0.9 * pow(1.0 - facing, 1.6);
        float flow = 0.7 + 0.3 * sin(vUv.x * 14.0 - uTime * 0.8);
        gl_FragColor = vec4(uColor, along * across * sheen * flow * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const group = new THREE.Group();
  const items = [];
  for (let i = 0; i < 6; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    // réparties à gauche et derrière le flacon vu du plan « fond » : jamais sous le texte
    const item = { mesh, phase: 1.75 + (i / 5) * 2.9 + rnd() * 0.2, radius: 1.15 + rnd() * 0.6, scale: 0.7 + rnd() * 0.5, spin: 0.12 + rnd() * 0.2, delay: rnd() };
    items.push(item);
    group.add(mesh);
  }
  group.visible = false;
  return {
    group,
    update(presence, f, time) {
      group.visible = presence > 0.001;
      if (!group.visible) return;
      material.uniforms.uOpacity.value = presence * 0.5;
      material.uniforms.uTime.value = time;
      for (const item of items) {
        const v = smooth(clamp(presence * 1.6 - item.delay * 0.6));
        const angle = item.phase + Math.sin(time * 0.1 + item.phase) * 0.08;
        const tall = item.scale * lerp(0.35, 1, v);
        item.mesh.position.set(Math.cos(angle) * item.radius, 0.05 + tall * 1.3, Math.sin(angle) * item.radius); // le ruban est centré sur sa hauteur (2,6)
        item.mesh.rotation.y = item.phase * 2 + time * item.spin + f * 1.2;
        item.mesh.scale.set(item.scale, tall, item.scale);
      }
    },
  };
}

// ---------- géométries ----------

// Anneau octogonal (rectangle à pans coupés) : demi-largeur w, demi-profondeur d, pan coupé c.
function octagon(y, w, d, c) {
  return [
    [w - c, d], [w, d - c], [w, -(d - c)], [w - c, -d], [-(w - c), -d], [-w, -(d - c)], [-w, d - c], [-(w - c), d],
  ].map(([x, z]) => new THREE.Vector3(x, y, z));
}

// Volume à facettes franches bâti sur une pile d'anneaux [y, w, d, c] ; fermé en haut et en bas.
function faceted(rows) {
  const rings = rows.map((row) => octagon(...row));
  const positions = [];
  const triangle = (a, b, c) => positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  for (let i = 0; i < rings.length - 1; i++) {
    for (let k = 0; k < 8; k++) {
      const a = rings[i][k], b = rings[i][(k + 1) % 8], c = rings[i + 1][k], d = rings[i + 1][(k + 1) % 8];
      triangle(a, b, d);
      triangle(a, d, c);
    }
  }
  const bottom = rings[0], top = rings[rings.length - 1];
  const low = new THREE.Vector3(0, bottom[0].y, 0), high = new THREE.Vector3(0, top[0].y, 0);
  for (let k = 0; k < 8; k++) {
    triangle(low, bottom[(k + 1) % 8], bottom[k]);
    triangle(high, top[k], top[(k + 1) % 8]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals(); // non indexée : une normale par facette
  return geometry;
}

function lathe(points, segments = 96) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

// Godrons : creuse des cannelures verticales dans la paroi extérieure d'une pièce tournée.
function flute(geometry, { from, to, count, depth, min }) {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const r = Math.hypot(x, z);
    if (r < min || y < from || y > to) continue;
    const edge = smooth(clamp((y - from) / 0.03)) * smooth(clamp((to - y) / 0.03));
    const groove = Math.pow(0.5 - 0.5 * Math.cos(Math.atan2(z, x) * count), 0.7);
    const k = (r - depth * edge * groove) / r;
    position.setXYZ(i, x * k, y, z * k);
  }
  geometry.computeVertexNormals();
  // recolle les normales de la couture (premier et dernier méridien)
  const normal = geometry.attributes.normal;
  const rows = geometry.parameters.points.length;
  const lastColumn = geometry.parameters.segments * rows;
  for (let j = 0; j < rows; j++) {
    const nx = normal.getX(j) + normal.getX(lastColumn + j);
    const ny = normal.getY(j) + normal.getY(lastColumn + j);
    const nz = normal.getZ(j) + normal.getZ(lastColumn + j);
    const length = Math.hypot(nx, ny, nz) || 1;
    normal.setXYZ(j, nx / length, ny / length, nz / length);
    normal.setXYZ(lastColumn + j, nx / length, ny / length, nz / length);
  }
}

function roundedRect(width, height, radius) {
  const x = -width / 2, y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

// Ruban enroulé en hélice : zestes (court, opaque) et volutes (long, lumineux).
function ribbon({ turns, height, r0, r1, width, segments, twist }) {
  const positions = [], uvs = [], indices = [];
  const radial = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * Math.PI * 2;
    const r = lerp(r0, r1, t);
    radial.set(Math.cos(angle), 0, Math.sin(angle));
    const lean = 0.5 + twist * t;
    side.copy(radial).multiplyScalar(Math.cos(lean)).addScaledVector(up, Math.sin(lean));
    const half = (width / 2) * Math.pow(Math.sin(Math.PI * clamp(t * 0.94 + 0.03)), 0.6);
    const cx = radial.x * r, cy = (t - 0.5) * height, cz = radial.z * r;
    positions.push(cx - side.x * half, cy - side.y * half, cz - side.z * half, cx + side.x * half, cy + side.y * half, cz + side.z * half);
    uvs.push(t, 0, t, 1);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Pétale : large et rond au sommet, étroit à l'onglet, creusé en cuiller, bord retroussé.
function petalGeometry() {
  const geometry = new THREE.PlaneGeometry(1, 1, 10, 14);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const u = position.getX(i) * 2; // -1…1 en travers
    const t = position.getY(i) + 0.5; // 0…1 de l'onglet au bord
    const width = 0.52 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6) * 0.96), 0.7);
    const x = u * width;
    const cup = u * u * width * 0.55;
    const curl = Math.pow(t, 2.4) * 0.3 - Math.sin(t * Math.PI) * 0.12;
    const ruffle = Math.sin(u * 4.2 + t * 6) * 0.025 * t * t;
    position.setXYZ(i, x, (t - 0.5) * 1.1, cup + curl + ruffle);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// Éclat d'ambre : polyèdre irrégulier, facettes franches.
function shardGeometry(rnd) {
  const geometry = new THREE.IcosahedronGeometry(1, 0); // déjà non indexée : une normale par facette
  const position = geometry.attributes.position;
  const moved = new Map();
  for (let i = 0; i < position.count; i++) {
    const key = [position.getX(i), position.getY(i), position.getZ(i)].map((n) => n.toFixed(3)).join(',');
    if (!moved.has(key)) moved.set(key, [0.62 + rnd() * 0.6, 0.8 + rnd() * 0.5]);
    const [k, ky] = moved.get(key);
    position.setXYZ(i, position.getX(i) * k, position.getY(i) * k * ky, position.getZ(i) * k);
  }
  // une teinte par facette, du brun profond au miel : l'éclat paraît traversé de lumière
  const colors = new Float32Array(position.count * 3);
  const deep = new THREE.Color('#5e2106'), honey = new THREE.Color('#ffae3d'), tint = new THREE.Color();
  for (let face = 0; face < position.count / 3; face++) {
    tint.lerpColors(deep, honey, Math.pow(rnd(), 1.3));
    for (let corner = 0; corner < 3; corner++) tint.toArray(colors, (face * 3 + corner) * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// ---------- textures ----------

function petalTexture() {
  return canvasTexture(256, (ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, size); // haut du canvas = bord du pétale
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.55, '#fbeeee');
    gradient.addColorStop(0.85, '#f6e2c4');
    gradient.addColorStop(1, '#e9d09a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(150, 60, 90, 0.16)';
    ctx.lineWidth = 1.2;
    for (let n = -9; n <= 9; n++) {
      ctx.beginPath();
      ctx.moveTo(size / 2 + n * 3, size);
      ctx.quadraticCurveTo(size / 2 + n * 12, size * 0.5, size / 2 + n * 15, 0);
      ctx.stroke();
    }
  });
}

// Plaque : fond clair (laisse passer l'or), gravure sombre. Sert de couleur et de relief.
function plateEngraving() {
  return canvasTexture(1024, (ctx, size) => {
    const height = (size * PLATE.h) / PLATE.w;
    ctx.scale(1, size / height);
    ctx.fillStyle = '#f6ecdc';
    ctx.fillRect(0, 0, size, height);
    const rnd = seeded(3);
    for (let n = 0; n < 500; n++) {
      ctx.fillStyle = `rgba(${rnd() < 0.5 ? '255,255,255' : '120,84,40'}, ${0.04 + rnd() * 0.06})`;
      ctx.fillRect(0, rnd() * height, size, 1);
    }
    const ink = 'rgba(52, 26, 8, 0.92)';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, size - 60, height - 60);
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = '22px'; } catch { /* espacement non pris en charge */ }
    ctx.font = '400 62px "Bodoni", "Didot", Georgia, serif';
    ctx.fillText('SÉVANE', size / 2 + 11, 132);
    ctx.fillRect(size / 2 - 60, 166, 120, 3);
    try { ctx.letterSpacing = '0px'; } catch { /* idem */ }
    let px = 180;
    do {
      px -= 4;
      ctx.font = `italic 400 ${px}px "Bodoni", "Didot", Georgia, serif`;
    } while (ctx.measureText('Nuit d’Ambre').width > size - 190 && px > 80);
    ctx.fillText('Nuit d’Ambre', size / 2, 350);
    try { ctx.letterSpacing = '10px'; } catch { /* idem */ }
    ctx.font = '600 30px "Manrope", system-ui, sans-serif';
    ctx.fillText('EXTRAIT DE PARFUM · 100 ML', size / 2 + 5, 462);
  });
}
