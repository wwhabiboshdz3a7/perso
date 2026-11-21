// Maison Lune — des macarons entièrement procéduraux.
// Deux coques tournées (LatheGeometry) dont la collerette est bosselée par un bruit, une ganache
// entre les deux. Un macaron vedette, plus détaillé, s'ouvre sur son cœur de framboise ;
// les autres (InstancedMesh) lévitent, se rassemblent en pyramide, puis remplissent un coffret.

import * as THREE from 'three';
import { Stage, span, track, clamp, lerp, smooth, smoother } from '../../assets/js/stage.js';
import { studioEnvironment, threePoint, backdrop, softDisc, Particles, materials, fbm, seeded } from '../../assets/js/kit.js';

// Un macaron de rayon 1 : collerette, dôme, ganache.
const FOOT = 0.14;
const DOME = 0.33;
const GAP = 0.17;
const RIM = 0.975;
const THICK = 2 * (FOOT + DOME) + GAP;
const S = 0.5; // échelle dans la scène : un macaron fait 1 de diamètre

const FLAVORS = [
  { shell: '#ee9db0', ganache: '#fde9e0' }, // framboise
  { shell: '#b7cb88', ganache: '#92ad5e' }, // pistache
  { shell: '#f5e28a', ganache: '#fff3b8' }, // citron
  { shell: '#c8b2e6', ganache: '#9478c6' }, // lavande
  { shell: '#dca56e', ganache: '#b46c2e' }, // caramel
  { shell: '#f5e9d0', ganache: '#fffaf0' }, // vanille
];

// La pyramide : six rangs de macarons posés sur la tranche contre un cône.
const RINGS = [13, 11, 9, 7, 5, 3];
const PLATE_Y = -5.8;
const BOX = new THREE.Vector3(0, -2.6, 0);
const BOX_YAW = 0.32;

const Y_AXIS = new THREE.Vector3(0, 1, 0);

const stage = new Stage({ background: '#f6efe6', exposure: 1.0 });
if (stage.ok) init();

async function init() {
  const { renderer } = stage;
  // Rendu « neutre » : garde aux pastels leur clarté, là où le rendu filmique les grise.
  if (THREE.NeutralToneMapping) renderer.toneMapping = THREE.NeutralToneMapping;

  // ---------- lumière : un studio clair, de grandes boîtes à lumière douces ----------
  stage.setEnvironment(
    studioEnvironment(renderer, {
      ambient: '#8f867f',
      panels: [
        { size: [12, 12], color: '#fffaf2', intensity: 2.6, position: [0, 9, 1] },
        { size: [5, 8], color: '#fff3e6', intensity: 3.2, position: [-8, 3, 3] },
        { size: [4, 8], color: '#ffe9ee', intensity: 2.2, position: [8, 2, -2] },
        { size: [12, 3], color: '#fff6ea', intensity: 1.4, position: [0, -1, 9] },
      ],
    }),
    0.9
  );
  const lights = threePoint({
    key: { color: '#fff4e6', intensity: 2.5, position: [-4, 8, 5] },
    rim: { color: '#ffdfe6', intensity: 1.1, position: [6, 3, -6] },
    fill: { color: '#fff6ee', intensity: 0.5, position: [1.5, -1, 6] },
  });
  stage.add(lights.group);

  const sky = backdrop({ top: '#fbf6ee', bottom: '#f0e4d6', glow: '#0c0605', glowDirection: [0.2, 0.25, -1], glowSize: 0.6 });
  stage.add(sky);
  const skyTop = ['#fbf6ee', '#fbf3e6', '#fbf0ee', '#f8f5ea', '#fbf6ee'].map((c) => new THREE.Color(c));
  const skyBottom = ['#f1e5d8', '#f0e1cf', '#f3dedb', '#eae7d6', '#f2e4d9'].map((c) => new THREE.Color(c));

  const dust = new Particles({ count: 260, box: [16, 10, 12], center: [0, 0, -1], color: '#e3a3b1', size: 0.036, speed: [0.03, 0.05, 0.01], wobble: 0.3, twinkle: 0.5, additive: false, opacity: 0.6 });
  stage.add(dust.points);

  // ---------- matières ----------
  const textures = shellTextures();
  const shellSpec = { map: textures.map, bumpMap: textures.bump, bumpScale: 2.2, roughnessMap: textures.rough, roughness: 1, metalness: 0, vertexColors: true };
  const shellMaterial = new THREE.MeshStandardMaterial(shellSpec);
  const ganacheMaterial = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0, vertexColors: true });

  // ---------- les macarons de la ronde (instances) ----------
  const count = RINGS.reduce((a, b) => a + b, 0);
  const pairGeometry = merge([
    shellGeometry({ radial: 32, dome: 7, seed: 3 }).translate(0, GAP / 2, 0),
    shellGeometry({ radial: 32, dome: 7, seed: 8 }).rotateX(Math.PI).rotateY(1.3).translate(0, -GAP / 2, 0),
  ]);
  const shells = new THREE.InstancedMesh(pairGeometry, shellMaterial, count);
  const ganaches = new THREE.InstancedMesh(ganacheBand(32), ganacheMaterial, count);
  shells.frustumCulled = ganaches.frustumCulled = false;
  stage.add(shells, ganaches);

  // ---------- la pyramide : emplacements ----------
  const rnd = seeded(17);
  const slots = [];
  const radii = RINGS.map((n) => (S * 1.02) / Math.tan(Math.PI / n) + (THICK * S) / 2);
  let y = PLATE_Y + 0.57;
  RINGS.forEach((n, k) => {
    const next = radii[k + 1] ?? radii[k] - 0.4;
    const drop = radii[k] - next;
    const alpha = Math.asin(clamp(drop / 0.98, 0, 0.9)); // pente du cône
    for (let i = 0; i < n; i++) {
      const theta = ((i + (k % 2) * 0.5) / n) * Math.PI * 2 + k * 0.21;
      const normal = new THREE.Vector3(Math.cos(theta) * Math.cos(alpha), Math.sin(alpha), Math.sin(theta) * Math.cos(alpha));
      const quaternion = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, normal).multiply(new THREE.Quaternion().setFromAxisAngle(Y_AXIS, rnd() * 6.28));
      // six bandes de couleur qui s'enroulent en spirale autour du cône
      const turn = (((theta / (Math.PI * 2)) % 1) + 1) % 1;
      slots.push({ position: new THREE.Vector3(Math.cos(theta) * radii[k], y, Math.sin(theta) * radii[k]), quaternion, ring: k, flavor: (Math.floor(turn * 6 + 0.5) + k) % 6 });
    }
    if (k < RINGS.length - 1) y += Math.sqrt(0.98 * 0.98 - drop * drop);
  });
  const crownY = y + 0.7;

  // ---------- le coffret ----------
  const box = coffret();
  box.group.position.copy(BOX);
  box.group.rotation.y = BOX_YAW;
  stage.add(box.group);
  const boxQuaternion = new THREE.Quaternion().setFromAxisAngle(Y_AXIS, BOX_YAW);
  const onEdge = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2);
  // rangée du fond puis rangée de devant ; la place vide attend le macaron vedette (framboise)
  const rows = [[0, 1, 2, 3, 4, 5], [5, 2, 0, 1, 3, 4]];
  const boxSlots = [];
  let heroSlot = null;
  rows.forEach((row, r) => {
    row.forEach((flavor, c) => {
      const local = new THREE.Vector3((c - 2.5) * box.pitch, box.floor + S, (r === 0 ? -1 : 1) * box.rowOffset);
      const position = local.applyQuaternion(boxQuaternion).add(BOX);
      const lean = new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.08, rnd() * 6.28, (rnd() - 0.5) * 0.08));
      const quaternion = boxQuaternion.clone().multiply(onEdge).multiply(lean);
      if (r === 1 && c === 2) heroSlot = { position, quaternion };
      else boxSlots.push({ position, quaternion, flavor, column: c });
    });
  });

  // ---------- chaque macaron : parfum, emplacements, rythme ----------
  const freeBox = [...boxSlots];
  const macarons = slots.map((slot) => {
    const spot = freeBox.findIndex((b) => b.flavor === slot.flavor && slot.ring >= 2);
    const inBox = spot >= 0 ? freeBox.splice(spot, 1)[0] : null;
    return {
      slot,
      inBox,
      p: [], // emplacements épars, un par plan de caméra (voir compose)
      q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28)),
      q2: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28)),
      axis: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
      spin: 0.07 + rnd() * 0.16,
      phase: rnd() * 6.28,
      swirl: 0.5 + rnd() * 0.5,
      delayIn: (slot.ring / (RINGS.length - 1)) * 0.42 + rnd() * 0.08,
      delayOut: inBox ? 0.12 + inBox.column * 0.05 + rnd() * 0.05 : rnd() * 0.3,
    };
  });
  const tint = new THREE.Color();
  macarons.forEach((m, i) => {
    const flavor = FLAVORS[m.slot.flavor];
    const shade = 0.94 + rnd() * 0.1; // d'une fournée à l'autre, la teinte varie un peu
    shells.setColorAt(i, tint.set(flavor.shell).multiplyScalar(shade));
    ganaches.setColorAt(i, tint.set(flavor.ganache));
  });

  // ---------- le macaron vedette ----------
  const hero = new THREE.Group();
  hero.scale.setScalar(S);
  const heroShell = new THREE.MeshStandardMaterial({ ...shellSpec, color: FLAVORS[0].shell });
  const heroGanache = new THREE.MeshStandardMaterial({ color: FLAVORS[0].ganache, roughness: 0.4, vertexColors: true });
  const bottom = new THREE.Mesh(shellGeometry({ radial: 96, dome: 22, seed: 5, fine: true, under: 0.95 }).rotateX(Math.PI).translate(0, -GAP / 2, 0), heroShell);
  const filling = new THREE.Mesh(ganacheSwirl(96), heroGanache);
  const berry = raspberry();
  berry.position.y = GAP / 2 - 0.035;
  const lid = new THREE.Group(); // charnière à l'arrière de la coque du dessus
  lid.position.set(0, GAP / 2, -RIM);
  const top = new THREE.Mesh(shellGeometry({ radial: 96, dome: 22, seed: 12, fine: true, under: 1, underTint: [1.3, 2.5, 2.1] }), heroShell);
  top.position.z = RIM;
  lid.add(top);
  hero.add(bottom, filling, berry, lid);
  stage.add(hero);

  const heroQuats = [
    new THREE.Euler(0.6, 0.3, -0.3),
    new THREE.Euler(0.14, 0, 0.03),
    new THREE.Euler(0.04, 0.2, 0),
    new THREE.Euler(0.06, 1.1, -0.04),
  ].map((e) => new THREE.Quaternion().setFromEuler(e));
  // au-dessus du coffret : presque sur la tranche, prêt à prendre sa place
  heroQuats.push(boxQuaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2 + 0.5)).multiply(new THREE.Quaternion().setFromAxisAngle(Y_AXIS, 0.6)));
  const heroSpots = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -0.08, 0),
    new THREE.Vector3(0, crownY, 0),
    heroSlot.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
  ];

  // ---------- présentoir et cône de la pyramide ----------
  const stand = presentoir(radii[0], crownY);
  stand.group.position.y = PLATE_Y;
  stage.add(stand.group);
  const standShadow = softDisc({ radius: 4.6, color: '#8a5e4c', opacity: 0, y: PLATE_Y - 1.52, falloff: 1.4 });
  const boxShadow = softDisc({ radius: 4.2, color: '#8a5e4c', opacity: 0, y: BOX.y - 0.02, falloff: 1.5 });
  boxShadow.position.x = BOX.x;
  boxShadow.position.z = BOX.z;
  boxShadow.scale.set(1.15, 0.8, 1);
  boxShadow.rotation.z = BOX_YAW;
  stage.add(standShadow, boxShadow);

  // ---------- plans de caméra, un par chapitre ----------
  const shots = [
    { target: [0, 0.05, 0], radius: 5.4, azimuth: -8, elevation: 6, fov: 30, shift: [0.34, 0.04], portrait: { shift: [0, 0.36], radius: 6.2 } },
    { target: [0, 0.1, 0], radius: 2.55, azimuth: 24, elevation: 22, fov: 30, shift: [-0.34, 0], portrait: { shift: [0, 0.4], radius: 2.9 } },
    { target: [0, 0.36, 0], radius: 4.4, azimuth: -20, elevation: 28, fov: 30, shift: [0.34, 0], portrait: { shift: [0, 0.36], radius: 4.4 } },
    { target: [0, -3.1, 0], radius: 17.5, azimuth: 26, elevation: 9, fov: 30, shift: [-0.3, 0.02], portrait: { shift: [0, 0.3], radius: 22.5 } },
    { target: [BOX.x, BOX.y + 0.9, BOX.z], radius: 12, azimuth: 14, elevation: 38, fov: 30, shift: [0.3, -0.06], portrait: { shift: [0, 0.34], radius: 14.5, elevation: 46 } },
  ];
  stage.setShots(shots);

  // Les macarons épars sont placés plan par plan, dans le champ de la caméra : jamais derrière
  // le texte, jamais devant le sujet. On recompose si l'écran change de proportions.
  let composed = '';
  const compose = (width, height) => {
    const key = `${Math.round((width / height) * 50)}`;
    if (key === composed) return;
    composed = key;
    const specs = [
      { shot: 0, near: -1.2, far: 20, clear: 0.62, front: 2.1, back: 1.15, zone: (x, y, tall) => (tall ? y > -0.04 && y < 0.86 : x > 0.0) },
      { shot: 1, near: 5.5, far: 22, clear: 0.6, front: 1.2, back: 1.15, zone: (x, y, tall) => (tall ? y > -0.02 && y < 0.86 : x < 0.1) },
      { shot: 2, near: 5, far: 22, clear: 0.9, front: 1.3, back: 1.25, zone: (x, y, tall) => (tall ? y > -0.02 && y < 0.86 : x > -0.08) },
      { shot: 4, near: -2, far: 18, clear: 2.7, front: 1.3, back: 0.8, zone: (x, y, tall) => (tall ? y > -0.02 && y < 0.88 : x > -0.04) },
    ];
    specs.forEach((spec, n) => {
      const points = cloud(viewOf(shots[spec.shot], width, height), { ...spec, count, seed: 41 + n * 13 });
      macarons.forEach((m, i) => (m.p[n] = points[i]));
    });
  };

  // ---------- animation ----------
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), qa = new THREE.Quaternion(), q0 = new THREE.Quaternion(), scale = new THREE.Vector3(S, S, S), matrix = new THREE.Matrix4();
  const target = new THREE.Vector3();

  stage.onFrame(({ f, time, reduced, width, height }) => {
    const t = reduced ? 0 : time;
    compose(width, height);

    // la lumière et le fond changent de teinte d'un chapitre à l'autre
    const i0 = Math.min(Math.floor(clamp(f, 0, 4)), 3);
    const k = smoother(clamp(f, 0, 4) - i0);
    sky.material.uniforms.uTop.value.lerpColors(skyTop[i0], skyTop[i0 + 1], k);
    sky.material.uniforms.uBottom.value.lerpColors(skyBottom[i0], skyBottom[i0 + 1], k);
    lights.key.intensity = track(f, [2.5, 2.9, 2.6, 2.3, 2.5]);
    lights.rim.intensity = track(f, [1.1, 1.6, 1.2, 0.9, 0.8]);
    lights.fill.intensity = track(f, [0.5, 0.5, 2.4, 0.5, 0.6]); // éclaire le dessous de la coque ouverte
    dust.update(t, height);

    // la ronde : épars → pyramide → coffret
    const gather = clamp((f - 2.2) / 0.52);
    const unpack = clamp((f - 3.12) / 0.62);
    const c = clamp(f, 0, 2), c0 = Math.min(Math.floor(c), 1), ck = smoother(c - c0);
    macarons.forEach((m, i) => {
      p.lerpVectors(m.p[c0], m.p[c0 + 1], ck);
      p.y += Math.sin(t * 0.45 + m.phase) * 0.16;
      q.copy(m.q0).multiply(qa.setFromAxisAngle(m.axis, t * m.spin));
      const a = smooth(clamp((gather - m.delayIn) / 0.5));
      if (a > 0) {
        p.lerp(m.slot.position, a);
        p.applyAxisAngle(Y_AXIS, Math.sin(Math.PI * a) * m.swirl); // ils arrivent en tournant autour du cône
        q.slerp(m.slot.quaternion, a);
      }
      const b = smooth(clamp((unpack - m.delayOut) / 0.55));
      if (b > 0) {
        if (m.inBox) {
          target.copy(m.inBox.position);
          qa.copy(m.inBox.quaternion);
        } else {
          target.copy(m.p[3]);
          target.y += Math.sin(t * 0.45 + m.phase) * 0.16;
          qa.copy(m.q2).multiply(q0.setFromAxisAngle(m.axis, t * m.spin));
        }
        p.lerp(target, b);
        p.y += Math.sin(Math.PI * b) * (m.inBox ? 1.6 : 0.6); // une courbe plutôt qu'une ligne droite
        q.slerp(qa, b);
      }
      matrix.compose(p, q, scale);
      shells.setMatrixAt(i, matrix);
      ganaches.setMatrixAt(i, matrix);
    });
    shells.instanceMatrix.needsUpdate = true;
    ganaches.instanceMatrix.needsUpdate = true;

    // le macaron vedette
    const x = clamp(f, 0, 4), i = Math.min(Math.floor(x), 3), u = smoother(x - i);
    hero.position.lerpVectors(heroSpots[i], heroSpots[i + 1], u);
    hero.quaternion.slerpQuaternions(heroQuats[i], heroQuats[i + 1], u);
    const floating = 1 - span(f, 2.2, 2.8) * (1 - span(f, 3.2, 3.8));
    hero.position.y += Math.sin(t * 0.7) * 0.05 * floating;
    hero.rotateOnAxis(Y_AXIS, Math.sin(t * 0.4) * 0.25 * floating);

    // signature : la coque se soulève puis bascule, le cœur apparaît
    const open = span(f, 1.3, 1.78) * (1 - span(f, 2.2, 2.5));
    const rise = smooth(clamp(open / 0.55));
    const swing = smooth(clamp((open - 0.2) / 0.8));
    lid.position.y = GAP / 2 + rise * 0.5;
    lid.rotation.x = -swing * 1.0;
    lid.rotation.z = swing * 0.1;
    berry.visible = rise > 0.02;

    // présentoir, puis coffret
    const standOn = span(f, 2.15, 2.6) * (1 - span(f, 3.1, 3.4));
    stand.setOpacity(standOn);
    standShadow.material.opacity = standOn * 0.2;
    const boxOn = span(f, 3.25, 3.6);
    box.setOpacity(boxOn);
    box.group.position.y = BOX.y - (1 - boxOn) * 0.5;
    boxShadow.material.opacity = boxOn * 0.26;
  });

  await stage.start(box.ready);
}

// ---------- composition ----------

const DEG = Math.PI / 180;

// La caméra d'un plan, telle que le moteur la placera pour un écran donné.
function viewOf(shot, width, height) {
  const aspect = width / height;
  const tall = height > width * 1.05;
  const s = tall && shot.portrait ? { ...shot, ...shot.portrait } : shot;
  const radius = s.radius * (tall ? clamp(1.9 - aspect * 1.6, 1, 1.9) : 1);
  const azimuth = s.azimuth * DEG, elevation = s.elevation * DEG;
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(
    s.target[0] + radius * Math.cos(elevation) * Math.sin(azimuth),
    s.target[1] + radius * Math.sin(elevation),
    s.target[2] + radius * Math.cos(elevation) * Math.cos(azimuth)
  );
  camera.lookAt(s.target[0], s.target[1], s.target[2]);
  camera.updateMatrixWorld();
  return { matrix: camera.matrixWorld, radius, tan: Math.tan((s.fov * DEG) / 2), aspect, shift: s.shift, tall };
}

// Sème `count` macarons dans le champ d'une caméra. `zone(x, y, tall)` dit si un point de l'écran
// (-1…1) est libre ; `clear` est le rayon du sujet à dégager, plus largement devant que derrière.
function cloud(view, { count, seed, near, far, clear, front, back, zone }) {
  const rnd = seeded(seed);
  const points = [];
  const subject = clear / (view.radius * view.tan);
  let tries = 0;
  while (points.length < count) {
    tries++;
    const d = view.radius + near + Math.pow(rnd(), 0.6) * (far - near);
    const x = rnd() * 3 - 1.5, y = rnd() * 3 - 1.5; // un tiers reste hors champ : la composition respire
    const loose = tries > 6000;
    if (!zone(x, y, view.tall) && tries < 12000) continue;
    const own = S / (d * view.tan);
    const away = Math.hypot((x - view.shift[0]) * view.aspect, y - view.shift[1]);
    if (!loose && away < subject * (d < view.radius + 0.7 ? front : back) + own) continue;
    const p = new THREE.Vector3((x - view.shift[0]) * d * view.tan * view.aspect, (y - view.shift[1]) * d * view.tan, -d).applyMatrix4(view.matrix);
    if (!loose && points.some((o) => o.distanceTo(p) < 2)) continue;
    p.depth = d;
    points.push(p);
  }
  return points.sort((a, b) => a.depth - b.depth);
}

// ---------- géométries ----------

// Une coque : dessous plat, collerette bosselée, dôme. Base en y = 0, sommet en y = FOOT + DOME.
function shellGeometry({ radial = 32, dome = 8, seed = 1, fine = false, under = 0.7, underTint = [1, 1, 1] } = {}) {
  // profil : [rayon, hauteur, v de texture, ombrage, part de collerette]
  const profile = [
    [0, 0.022, 0, under, 0],
    [0.45, 0.017, 0.05, under, 0],
    [0.86, 0.002, 0.1, under * 0.86, 0.15],
    [0.915, 0.004, 0.13, 0.66, 0.7],
    [0.966, 0.03, 0.18, 0.86, 1],
    [0.986, 0.07, 0.25, 0.98, 1],
    [0.972, 0.108, 0.31, 0.9, 1],
    [0.95, 0.134, 0.355, 0.66, 0.6],
  ];
  if (fine) {
    profile.splice(5, 0, [0.98, 0.05, 0.215, 0.94, 1]);
    profile.splice(7, 0, [0.982, 0.09, 0.28, 0.95, 1]);
  }
  for (let k = 0; k <= dome; k++) {
    const t = (k / dome) * (Math.PI / 2);
    const r = k === dome ? 0 : RIM * Math.pow(Math.cos(t), 0.84);
    const y = FOOT + DOME * Math.pow(Math.sin(t), 0.94);
    profile.push([r, y, 0.38 + 0.62 * (k / dome), lerp(0.78, 1, smooth(clamp((k / dome) * 3.2))), k === 0 ? 0.3 : 0]);
  }
  const geometry = new THREE.LatheGeometry(profile.map((point) => new THREE.Vector2(point[0], point[1])), radial);
  const count = profile.length;
  const position = geometry.attributes.position, uv = geometry.attributes.uv;
  const colors = new Float32Array(position.count * 3);
  const F = fine ? 19 : 6;
  for (let i = 0; i <= radial; i++) {
    const phi = (i / radial) * Math.PI * 2;
    const sin = Math.sin(phi), cos = Math.cos(phi);
    for (let j = 0; j < count; j++) {
      const index = i * count + j;
      const [r, y, v, shade, weight] = profile[j];
      let radius = r, height = y, tone = shade;
      if (weight > 0) {
        // la collerette : bourrelet irrégulier, plus ou moins sorti, plus ou moins haut
        const n = fbm(sin * F + seed * 7.3, cos * F + 11, y * 4 + seed, 3) - 0.5;
        const m = fbm(sin * F * 1.7 + 40, cos * F * 1.7 + seed * 3.1, y * 3, 2) - 0.5;
        radius = r * (1 + weight * n * 0.048);
        height = y + weight * m * 0.024;
        tone = shade * (1 + weight * n * 0.4);
      }
      position.setXYZ(index, radius * sin, height, radius * cos);
      uv.setY(index, v);
      const inside = j < 3 ? 1 : 0; // le dessous de la coque, plus pâle que la croûte
      for (let c = 0; c < 3; c++) colors[index * 3 + c] = Math.min(1, tone) * (inside ? underTint[c] : 1);
    }
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  smoothLathe(geometry, count, radial);
  return geometry;
}

// Ganache des macarons de la ronde : seule la tranche se voit.
function ganacheBand(radial) {
  const h = GAP / 2 + 0.03;
  const profile = [[0.8, -h, 0.42], [0.87, -h * 0.72, 0.62], [0.9, -h * 0.34, 0.92], [0.908, 0, 1], [0.9, h * 0.34, 0.95], [0.87, h * 0.72, 0.68], [0.8, h, 0.46]];
  const geometry = new THREE.LatheGeometry(profile.map((point) => new THREE.Vector2(point[0], point[1])), radial);
  paint(geometry, profile.length, radial, (j) => profile[j][2]);
  return geometry;
}

// Ganache du macaron vedette : la tranche, puis un dessus poché en spirale avec un creux au centre.
function ganacheSwirl(radial) {
  const h = GAP / 2 + 0.03;
  const profile = [[0.8, -h, 0.42], [0.87, -h * 0.72, 0.62], [0.9, -h * 0.34, 0.92], [0.908, 0, 1], [0.902, h * 0.3, 0.97], [0.885, h * 0.62, 0.9], [0.86, h * 0.84, 0.86]];
  const side = profile.length;
  const steps = 40;
  for (let k = 1; k <= steps; k++) profile.push([0.86 * (1 - k / steps), GAP / 2 + 0.006, 1]);
  const count = profile.length;
  const geometry = new THREE.LatheGeometry(profile.map((point) => new THREE.Vector2(point[0], point[1])), radial);
  const position = geometry.attributes.position;
  const shades = [];
  for (let i = 0; i <= radial; i++) {
    const phi = (i / radial) * Math.PI * 2;
    for (let j = 0; j < count; j++) {
      const [r, y, shade] = profile[j];
      let height = y, tone = shade;
      if (j >= side) {
        // cordon de poche à douille : une spirale d'Archimède, en relief
        const coil = 0.5 + 0.5 * Math.cos(((r / 0.15) * Math.PI * 2) - phi);
        const ridge = Math.pow(coil, 0.7);
        const well = smooth(clamp(1 - r / 0.34));
        const edge = smooth(clamp((0.86 - r) / 0.08));
        height = y + ridge * 0.042 * edge * (1 - well) - well * 0.045;
        tone = (0.7 + 0.3 * ridge) * (1 - well * 0.25);
      }
      position.setY(i * count + j, height);
      shades.push(tone);
    }
  }
  paint(geometry, count, radial, (j, i) => shades[i * count + j]);
  smoothLathe(geometry, count, radial);
  return geometry;
}

function paint(geometry, count, radial, shade) {
  const colors = new Float32Array((radial + 1) * count * 3);
  for (let i = 0; i <= radial; i++) {
    for (let j = 0; j < count; j++) {
      const o = (i * count + j) * 3;
      colors[o] = colors[o + 1] = colors[o + 2] = shade(j, i);
    }
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

// Recalcule les normales d'une surface de révolution déformée, sans couture ni pincement au pôle.
function smoothLathe(geometry, count, radial) {
  geometry.computeVertexNormals();
  const normal = geometry.attributes.normal, position = geometry.attributes.position;
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let j = 0; j < count; j++) {
    const first = j, last = radial * count + j;
    a.fromBufferAttribute(normal, first).add(b.fromBufferAttribute(normal, last)).normalize();
    normal.setXYZ(first, a.x, a.y, a.z);
    normal.setXYZ(last, a.x, a.y, a.z);
  }
  for (const j of [0, count - 1]) {
    if (Math.hypot(position.getX(j), position.getZ(j)) > 1e-6) continue;
    a.set(0, 0, 0);
    for (let i = 0; i <= radial; i++) a.add(b.fromBufferAttribute(normal, i * count + j));
    a.normalize();
    for (let i = 0; i <= radial; i++) normal.setXYZ(i * count + j, a.x, a.y, a.z);
  }
}

function merge(geometries) {
  const names = ['position', 'normal', 'uv', 'color'];
  const arrays = Object.fromEntries(names.map((name) => [name, []]));
  const indices = [];
  let offset = 0;
  for (const geometry of geometries) {
    for (const name of names) arrays[name].push(...geometry.attributes[name].array);
    for (const index of geometry.index.array) indices.push(index + offset);
    offset += geometry.attributes.position.count;
  }
  const merged = new THREE.BufferGeometry();
  for (const name of names) merged.setAttribute(name, new THREE.Float32BufferAttribute(arrays[name], name === 'uv' ? 2 : 3));
  merged.setIndex(indices);
  return merged;
}

// Une framboise : des drupéoles serrées sur un cône arrondi.
function raspberry() {
  const group = new THREE.Group();
  const rnd = seeded(29);
  const n = 96, H = 0.34, R = 0.27;
  const material = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), material, n);
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(), color = new THREE.Color();
  for (let k = 0; k < n; k++) {
    const v = (k + 0.5) / n; // 0 : la pointe, 1 : la base
    const rho = k === 0 ? 0 : R * Math.pow(Math.sin(Math.PI * (0.07 + 0.5 * Math.pow(v, 0.8))), 0.8);
    const theta = k * 2.39996 + rnd() * 0.2;
    position.set(Math.cos(theta) * rho, 0.045 + H * (1 - Math.pow(v, 1.15)), Math.sin(theta) * rho);
    const size = 0.046 + rnd() * 0.012;
    scale.set(size, size * 0.96, size);
    quaternion.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3));
    mesh.setMatrixAt(k, matrix.compose(position, quaternion, scale));
    mesh.setColorAt(k, color.set('#bd123a').offsetHSL((rnd() - 0.5) * 0.02, 0, (rnd() - 0.5) * 0.07));
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: '#6a0a20', roughness: 0.6 }));
  core.scale.set(R * 0.93, H * 0.56, R * 0.93);
  core.position.y = H * 0.5;
  group.add(mesh, core);
  return group;
}

// Présentoir en porcelaine, filet doré, et le cône qui porte la pyramide.
function presentoir(baseRadius, crownY) {
  const group = new THREE.Group();
  const plate = baseRadius + 0.72;
  const profile = [
    [0, -1.5], [1.25, -1.5], [1.31, -1.45], [1.2, -1.37], [0.55, -1.25], [0.27, -1.06], [0.2, -0.72], [0.26, -0.42],
    [0.62, -0.24], [1.8, -0.14], [plate - 0.14, -0.1], [plate - 0.02, -0.06], [plate, 0], [plate - 0.04, 0.035], [plate - 0.12, 0.03], [plate - 0.2, 0], [0, 0],
  ];
  const porcelain = materials.ceramic({ color: '#fbf5ec', roughness: 0.3 });
  const gold = materials.gold({ color: '#d2a55a', roughness: 0.28 });
  const cream = new THREE.MeshStandardMaterial({ color: '#f6dfd6', roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile.map((point) => new THREE.Vector2(point[0], point[1])), 72), porcelain);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(plate - 0.005, 0.022, 8, 96), gold);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.012;
  const foot = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.02, 8, 72), gold);
  foot.rotation.x = Math.PI / 2;
  foot.position.y = -1.44;
  const height = crownY - PLATE_Y - 0.5;
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.06, baseRadius - (THICK * S) / 2 + 0.12, height, 48, 1, true), cream);
  cone.position.y = height / 2;
  group.add(body, rim, foot, cone);
  const list = [porcelain, gold, cream];
  return { group, setOpacity: (value) => fade(group, list, value) };
}

function fade(group, list, value) {
  group.visible = value > 0.002;
  for (const material of list) {
    const solid = value > 0.998;
    if (material.transparent === solid) {
      material.transparent = !solid;
      material.needsUpdate = true;
    }
    material.opacity = value;
  }
}

// Le coffret : douze places sur la tranche, deux rangées, couvercle ouvert à l'arrière.
function coffret() {
  const group = new THREE.Group();
  const pitch = THICK * S + 0.03; // d'un macaron au suivant
  const lane = 2 * S + 0.05;
  const wall = 0.05, floor = 0.05, high = 0.62;
  const L = 6 * pitch + 0.1, W = 2 * lane + 0.06;
  const paper = new THREE.MeshStandardMaterial({ color: '#eeb9c4', roughness: 0.62 });
  const lining = new THREE.MeshStandardMaterial({ color: '#fbf2e6', roughness: 0.8 });
  const foil = new THREE.MeshStandardMaterial({ color: '#fbf2e6', roughness: 0.6 });
  const piece = (w, h, d, x, y, z, material, parent = group) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  piece(L + wall * 2, floor, W + wall * 2, 0, floor / 2, 0, paper);
  piece(L, 0.012, W, 0, floor + 0.006, 0, lining);
  piece(L + wall * 2, high, wall, 0, high / 2, -(W + wall) / 2, paper);
  piece(L + wall * 2, high, wall, 0, high / 2, (W + wall) / 2, paper);
  piece(wall, high, W, -(L + wall) / 2, high / 2, 0, paper);
  piece(wall, high, W, (L + wall) / 2, high / 2, 0, paper);
  // doublure : les parois intérieures et la cloison entre les deux rangées
  piece(L, high - 0.03, 0.012, 0, high / 2, -W / 2 + 0.006, lining);
  piece(L, high - 0.03, 0.012, 0, high / 2, W / 2 - 0.006, lining);
  piece(0.012, high - 0.03, W, -L / 2 + 0.006, high / 2, 0, lining);
  piece(0.012, high - 0.03, W, L / 2 - 0.006, high / 2, 0, lining);
  piece(L, high * 0.55, 0.03, 0, floor + high * 0.275, 0, lining);
  // filet doré autour du coffret
  const gilt = materials.gold({ color: '#d2a55a', roughness: 0.3 });
  const OL = L + wall * 2 + 0.006, OW = W + wall * 2 + 0.006, at = high * 0.2;
  piece(OL, 0.018, 0.004, 0, at, OW / 2, gilt);
  piece(OL, 0.018, 0.004, 0, at, -OW / 2, gilt);
  piece(0.004, 0.018, OW, OL / 2, at, 0, gilt);
  piece(0.004, 0.018, OW, -OL / 2, at, 0, gilt);

  // couvercle à charnière, ouvert vers l'arrière ; la marque est dorée à l'intérieur
  const lid = new THREE.Group();
  const LL = L + wall * 2 + 0.06, LW = W + wall * 2 + 0.06, skirt = 0.2;
  lid.position.set(0, high + 0.03, -(W + wall * 2) / 2 - 0.03);
  piece(LL, 0.04, LW, 0, 0.02, LW / 2, paper, lid);
  piece(LL, skirt, 0.04, 0, -skirt / 2 + 0.02, 0.02, paper, lid);
  piece(LL, skirt, 0.04, 0, -skirt / 2 + 0.02, LW - 0.02, paper, lid);
  piece(0.04, skirt, LW, -LL / 2 + 0.02, -skirt / 2 + 0.02, LW / 2, paper, lid);
  piece(0.04, skirt, LW, LL / 2 - 0.02, -skirt / 2 + 0.02, LW / 2, paper, lid);
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(LL - 0.08, LW - 0.08), foil);
  inside.rotation.x = Math.PI / 2;
  inside.position.set(0, -0.002, LW / 2);
  lid.add(inside);
  lid.rotation.x = -(Math.PI / 2 + 0.5);
  group.add(lid);

  const ready = brandTexture((LL - 0.08) / (LW - 0.08)).then((texture) => {
    foil.map = texture;
    foil.needsUpdate = true;
  });
  const list = [paper, lining, foil, gilt];
  return { group, pitch, floor: floor + 0.012, rowOffset: lane / 2 + 0.015, ready, setOpacity: (value) => fade(group, list, value) };
}

// ---------- textures ----------

// Intérieur du couvercle : croissant de lune et nom de la maison, dorés à chaud.
async function brandTexture(aspect) {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('400 96px "Cormorant"'), document.fonts.load('600 24px "Manrope"')]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // la police de secours fera l'affaire
  }
  const width = 1024, height = Math.round(width / aspect);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fbf2e6';
  ctx.fillRect(0, 0, width, height);
  const gold = '#a97b34';
  const cx = width / 2, cy = height * 0.33;
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.arc(cx, cy, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fbf2e6';
  ctx.beginPath();
  ctx.arc(cx + 24, cy - 12, 50, 0, Math.PI * 2);
  ctx.fill();
  const spaced = (text, y, font, tracking) => {
    ctx.font = font;
    ctx.fillStyle = gold;
    ctx.textBaseline = 'middle';
    const letters = [...text];
    const total = letters.reduce((sum, letter) => sum + ctx.measureText(letter).width + tracking, -tracking);
    let x = cx - total / 2;
    for (const letter of letters) {
      ctx.fillText(letter, x, y);
      x += ctx.measureText(letter).width + tracking;
    }
  };
  spaced('MAISON LUNE', height * 0.6, '400 88px "Cormorant", Georgia, serif', 22);
  spaced('MACARONS · LYON', height * 0.76, '600 26px "Manrope", sans-serif', 11);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, width - 68, height - 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// Trois textures pour les coques, enroulées autour de l'axe (u) et le long du profil (v) :
// teinte (grain de poudre d'amande, pores de la collerette), relief, et satiné / mat.
function shellTextures() {
  const W = 1024, H = 512;
  const make = (fill) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, W, H);
    return ctx;
  };
  const map = make('#ffffff'), bump = make('#808080'), rough = make('#646464');
  const rnd = seeded(3);
  const Y = (v) => (1 - v) * H;
  const dot = (ctx, x, y, r, style) => {
    ctx.fillStyle = style;
    for (const dx of [-W, 0, W]) {
      if (x + dx + r < 0 || x + dx - r > W) continue;
      ctx.beginPath();
      ctx.arc(x + dx, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const band = (ctx, v0, v1, style) => {
    ctx.fillStyle = style;
    ctx.fillRect(0, Y(v1), W, Y(v0) - Y(v1));
  };

  // dôme : un grain très fin, qui s'efface vers le sommet (où la texture se resserre)
  for (let n = 0; n < 12000; n++) {
    const v = 0.38 + rnd() * 0.62;
    if (v > 0.78 && rnd() < (v - 0.78) / 0.2) continue;
    const x = rnd() * W, y = Y(v);
    const stretch = 1 + (v - 0.38) * 1.6; // compense l'étirement en u près du sommet
    const r = 0.5 + rnd() * 1.1;
    map.fillStyle = `rgba(120, 60, 40, ${0.04 + rnd() * 0.07})`;
    map.fillRect(x, y, r * stretch, r);
    bump.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${0.06 + rnd() * 0.1})` : `rgba(0,0,0,${0.06 + rnd() * 0.1})`;
    bump.fillRect(x, y, (r + 0.6) * stretch, r + 0.6);
  }

  // collerette : mate, criblée de petites bulles
  const v0 = 0.115, v1 = 0.372;
  band(rough, v0, v1, '#f4f4f4');
  band(rough, 0, v0, '#e2e2e2');
  band(map, 0, v0, '#f7ede6');
  band(bump, v0, v1, '#8c8c8c');
  for (let n = 0; n < 3000; n++) {
    const x = rnd() * W, y = Y(v0 + rnd() * (v1 - v0));
    dot(bump, x, y, 1.5 + rnd() * 4, `rgba(255,255,255,${0.25 + rnd() * 0.35})`);
  }
  for (let n = 0; n < 4200; n++) {
    const x = rnd() * W, y = Y(v0 + rnd() * (v1 - v0));
    const r = 1 + Math.pow(rnd(), 2) * 4.5;
    dot(bump, x, y, r, `rgba(0,0,0,${0.4 + rnd() * 0.45})`);
    dot(map, x, y, r * 0.9, `rgba(96, 40, 36, ${0.05 + rnd() * 0.11})`);
    dot(map, x - r * 0.5, y - r * 0.6, r * 0.55, `rgba(255,255,255,${0.12 + rnd() * 0.12})`);
  }
  // un filet d'ombre sous la lèvre du dôme et au ras de la ganache
  const shade = (va, vb, alpha) => {
    const gradient = map.createLinearGradient(0, Y(va), 0, Y(vb));
    gradient.addColorStop(0, 'rgba(70, 25, 25, 0)');
    gradient.addColorStop(0.5, `rgba(70, 25, 25, ${alpha})`);
    gradient.addColorStop(1, 'rgba(70, 25, 25, 0)');
    map.fillStyle = gradient;
    map.fillRect(0, Math.min(Y(va), Y(vb)), W, Math.abs(Y(va) - Y(vb)));
  };
  shade(0.335, 0.4, 0.16);
  shade(0.09, 0.16, 0.18);

  const texture = (ctx, srgb) => {
    const result = new THREE.CanvasTexture(ctx.canvas);
    if (srgb) result.colorSpace = THREE.SRGBColorSpace;
    result.wrapS = THREE.RepeatWrapping;
    result.anisotropy = 8;
    return result;
  };
  return { map: texture(map, true), bump: texture(bump, false), rough: texture(rough, false) };
}
