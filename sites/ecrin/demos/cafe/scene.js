// Noir Velours — une tasse à espresso en céramique noire mate, sa crema tigrée,
// et trois cents grains qui tombent en pluie, s'enroulent en tornade puis plongent dans la tasse.
// Tout est procédural : profils tournés (LatheGeometry), grains en InstancedMesh, textures canvas.

import * as THREE from 'three';
import { Stage, span, track, clamp, lerp, smooth } from '../../assets/js/stage.js';
import { studioEnvironment, threePoint, backdrop, softDisc, materials, Particles, canvasTexture, fbm, seeded } from '../../assets/js/kit.js';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

const CUP_Y = 0.115; // la tasse repose dans le creux de la soucoupe
const COFFEE_Y = CUP_Y + 1.02; // niveau du café
const FLYING = 320; // grains en vol
const RAIN = 110; // dont ceux de la pluie du début
const RESTING = 40; // grains posés sur la table
const LANDING = 13; // grains qui tombent au premier plan du deuxième chapitre
const SET_TURN = 83; // le service pivote pour ce chapitre : cuillère de profil, anse à droite
const RAIN_HEIGHT = 6.4;
const TAMPER = [3.25, -1.75]; // position du tamper sur la table (x, z)
const HERO_AZIMUTH = -16;
const CLOSE_AZIMUTH = -115;
// Pour un azimut de caméra donné : direction « vers la caméra » et « vers la droite de l'écran », en (x, z).
const HERO_RIGHT = [Math.cos(HERO_AZIMUTH * DEG), -Math.sin(HERO_AZIMUTH * DEG)];
const CLOSE_VIEW = [Math.sin(CLOSE_AZIMUTH * DEG), Math.cos(CLOSE_AZIMUTH * DEG)];
const CLOSE_RIGHT = [Math.cos(CLOSE_AZIMUTH * DEG), -Math.sin(CLOSE_AZIMUTH * DEG)];
const PLUNGE_AZIMUTH = -35;
const PLUNGE_RIGHT = [Math.cos(PLUNGE_AZIMUTH * DEG), -Math.sin(PLUNGE_AZIMUTH * DEG)];

const stage = new Stage({ background: '#0c0806', exposure: 1.06 });
if (stage.ok) init();

async function init() {
  const { renderer } = stage;

  // ---------- lumière ----------
  stage.setEnvironment(
    studioEnvironment(renderer, {
      ambient: '#070403',
      panels: [
        { size: [8, 8], color: '#fff1e2', intensity: 3.0, position: [0, 8, 1] },
        { size: [3, 6], color: '#ffb48c', intensity: 9, position: [-6, 2.6, -2] },
        { size: [1.6, 7], color: '#ffe8d2', intensity: 6, position: [6, 3, 3.5] },
        { size: [10, 0.6], color: '#ff9468', intensity: 2.6, position: [0, 0.5, -7] },
        { size: [5, 1.4], color: '#ffeedd', intensity: 1.6, position: [-1, 2.5, 8] },
      ],
    }),
    0.9
  );
  const lights = threePoint({
    key: { color: '#fff0df', intensity: 2.3, position: [3.5, 7, 5] },
    rim: { color: '#ffae84', intensity: 3.0, position: [-5.5, 3, -6] },
    fill: { color: '#ffe6d2', intensity: 0.35, position: [-4, 2, 6] },
  });
  const heat = new THREE.PointLight('#ff8a55', 0, 16, 1.7); // la chauffe du tambour
  heat.position.set(-2.8, 1.5, -2.6);
  stage.add(lights.group, heat);
  const sky = backdrop({ top: '#150c08', bottom: '#040202', glow: '#40190c', glowDirection: [0.12, 0.1, -1], glowSize: 0.46 });
  stage.add(sky);

  // ---------- la table ----------
  const table = new THREE.Mesh(
    new THREE.CircleGeometry(12, 72),
    new THREE.MeshStandardMaterial({ map: tableTexture(), alphaMap: fadeTexture(), roughness: 0.74, metalness: 0, envMapIntensity: 0.45, transparent: true, depthWrite: false })
  );
  table.rotation.x = -Math.PI / 2;
  table.renderOrder = -3;
  const pool = softDisc({ radius: 5.2, color: '#c8683c', opacity: 0.1, additive: true, y: 0.002 });
  const shadow = softDisc({ radius: 2.7, color: '#000000', opacity: 0.85, y: 0.004, falloff: 1.25 });
  const tamperShadow = softDisc({ radius: 1.1, color: '#000000', opacity: 0.8, y: 0.004, falloff: 1.2 });
  tamperShadow.position.set(TAMPER[0], 0.004, TAMPER[1]);
  stage.add(table, pool, shadow, tamperShadow);

  // ---------- la tasse et sa soucoupe ----------
  const ceramic = materials.matte({ color: '#17120f', roughness: 0.56 });
  const glaze = materials.lacquer({ color: '#0d0a09', roughness: 0.2, clearcoatRoughness: 0.08 });
  const copper = materials.roseGold({ color: '#e0946c', roughness: 0.16 });

  const set = new THREE.Group();
  stage.add(set);

  const saucerPoints = [
    [0, 0.035], [0.6, 0.035], [0.64, 0], [0.8, 0], [0.84, 0.035], [1.15, 0.1], [1.45, 0.21], [1.59, 0.275],
    [1.625, 0.3], [1.6, 0.325], [1.38, 0.262], [1.05, 0.18], [0.74, 0.135], [0.66, 0.14], [0.6, 0.115], [0.3, 0.11], [0, 0.11],
  ];
  set.add(new THREE.Mesh(new THREE.LatheGeometry(profile(saucerPoints, 4), 72), ceramic));
  // filet de cuivre incrusté dans l'aile de la soucoupe
  const fillet = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.013, 8, 96), copper);
  fillet.rotation.x = Math.PI / 2;
  fillet.position.y = 0.264;
  set.add(fillet);

  const cup = new THREE.Group();
  cup.position.y = CUP_Y;
  cup.rotation.y = -24 * DEG; // l'anse part vers la droite, un peu vers la caméra
  set.add(cup);
  const cupPoints = [
    [0, 0.03], [0.34, 0.03], [0.38, 0], [0.47, 0], [0.5, 0.035], [0.535, 0.09], [0.64, 0.2], [0.73, 0.38], [0.775, 0.62], [0.79, 0.9], [0.795, 1.08],
    [0.79, 1.135], [0.76, 1.15], [0.73, 1.135],
    [0.722, 1.06], [0.715, 0.9], [0.7, 0.64], [0.655, 0.42], [0.55, 0.26], [0.36, 0.16], [0.16, 0.13], [0, 0.125],
  ];
  const cupProfile = profile(cupPoints, 4);
  let lip = 0;
  cupProfile.forEach((point, index) => { if (point.y > cupProfile[lip].y) lip = index; });
  cup.add(new THREE.Mesh(new THREE.LatheGeometry(cupProfile.slice(0, lip + 1), 72), ceramic)); // extérieur mat
  cup.add(new THREE.Mesh(new THREE.LatheGeometry(cupProfile.slice(lip), 72), glaze)); // intérieur émaillé

  const handleCurve = new THREE.CatmullRomCurve3(
    [[0.75, 0.99], [0.98, 1.03], [1.2, 0.9], [1.23, 0.66], [1.05, 0.44], [0.67, 0.34]].map(([x, y]) => new THREE.Vector3(x, y, 0))
  );
  const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 44, 0.06, 12), ceramic);
  handle.scale.z = 1.55;
  cup.add(handle);

  // ---------- le café ----------
  const cremaUniforms = { uSpin: { value: 0 }, uTwist: { value: 0.6 } };
  const cremaMaterial = new THREE.MeshStandardMaterial({ map: cremaTexture(768), roughness: 0.34, metalness: 0, envMapIntensity: 0.7 });
  cremaMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uSpin = cremaUniforms.uSpin;
    shader.uniforms.uTwist = cremaUniforms.uTwist;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uSpin;\nuniform float uTwist;')
      .replace(
        '#include <map_fragment>',
        /* glsl */ `
        // la crema tourne, plus vite au centre qu'au bord : les marbrures s'enroulent en spirale
        vec2 cremaP = vMapUv - 0.5;
        float cremaR = clamp(length(cremaP) * 2.0, 0.0, 1.0);
        float cremaA = uSpin + uTwist * pow(1.0 - cremaR, 1.5);
        float cremaS = sin(cremaA), cremaC = cos(cremaA);
        vec4 sampledDiffuseColor = texture2D(map, vec2(cremaC * cremaP.x - cremaS * cremaP.y, cremaS * cremaP.x + cremaC * cremaP.y) + 0.5);
        diffuseColor *= sampledDiffuseColor;`
      );
  };
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.724, 96), cremaMaterial);
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = COFFEE_Y;
  set.add(coffee);

  // ---------- cuillère et tamper en cuivre poli ----------
  const spoon = makeSpoon(copper);
  const spoonAngle = 122 * DEG; // sur l'aile de la soucoupe, devant à gauche
  spoon.position.set(Math.cos(spoonAngle) * 1.1, 0.345, Math.sin(spoonAngle) * 1.1);
  spoon.rotation.set(0, -(spoonAngle + Math.PI / 2), 0);
  spoon.rotateZ(-0.03);
  set.add(spoon);

  const tamper = makeTamper(copper);
  tamper.position.set(TAMPER[0], 0, TAMPER[1]);
  stage.add(tamper);

  // ---------- vapeur ----------
  const steamMap = steamTexture();
  const rnd = seeded(23);
  const steam = Array.from({ length: 16 }, (_, index) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: steamMap, color: '#ffe9da', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    sprite.userData = { phase: (index + rnd() * 0.6) / 16, seed: rnd() * TAU, seed2: rnd() * TAU, speed: 0.75 + rnd() * 0.5, side: rnd() - 0.5 };
    stage.add(sprite);
    return sprite;
  });

  const dust = new Particles({ count: 190, box: [11, 6, 8], center: [0, 2.6, 0], color: '#f0b490', size: 0.05, speed: [0.03, 0.06, 0.01], wobble: 0.3, twinkle: 0.6, opacity: 0.55 });
  stage.add(dust.points);

  // ---------- les grains ----------
  const beanGeometry = makeBean();
  const beanMaterial = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.4, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.28 });
  const tint = new THREE.Color();
  const beanTint = () => tint.setHSL(0.036 + rnd() * 0.018, 0.6, 0.06 + rnd() * 0.042);
  const dummy = new THREE.Object3D();

  // posés sur la table, autour de la soucoupe
  const resting = new THREE.InstancedMesh(beanGeometry, beanMaterial, RESTING);
  for (let i = 0; i < RESTING; i++) {
    // ni sous le tamper, ni sous le texte du premier et du quatrième chapitre
    let x, z;
    do {
      const angle = rnd() * TAU, radius = lerp(1.95, 4.6, Math.pow(rnd(), 1.5));
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius * 0.92;
    } while (
      Math.hypot(x - TAMPER[0], z - TAMPER[1]) < 0.95 ||
      x * HERO_RIGHT[0] + z * HERO_RIGHT[1] < -1.75 ||
      x * PLUNGE_RIGHT[0] + z * PLUNGE_RIGHT[1] > 2.25
    );
    placeAtRest(dummy, x, z, rnd);
    resting.setMatrixAt(i, dummy.matrix);
    resting.setColorAt(i, beanTint());
  }
  stage.add(resting);

  // une poignée tombe au premier plan quand on arrive au chapitre « origine »
  const landing = new THREE.InstancedMesh(beanGeometry, beanMaterial, LANDING);
  landing.frustumCulled = false;
  const landed = [];
  for (let i = 0; i < LANDING; i++) {
    const toward = 1.95 + rnd() * 0.95, across = -2.6 + rnd() * 3.5;
    const up = rnd() < 0.62;
    landed.push({
      x: toward * CLOSE_VIEW[0] + across * CLOSE_RIGHT[0],
      z: toward * CLOSE_VIEW[1] + across * CLOSE_RIGHT[1],
      y: up ? 0.083 : 0.036,
      rx: up ? (rnd() - 0.5) * 0.3 : Math.PI + (rnd() - 0.5) * 0.2,
      ry: rnd() * TAU,
      rz: (rnd() - 0.5) * 0.5,
      size: 0.9 + rnd() * 0.25,
      delay: rnd(),
      spin: 2 + rnd() * 4,
    });
    landing.setColorAt(i, beanTint());
  }
  stage.add(landing);

  // en vol : pluie → tornade → plongeon
  const beans = new THREE.InstancedMesh(beanGeometry, beanMaterial, FLYING);
  beans.frustumCulled = false;
  const flock = [];
  for (let i = 0; i < FLYING; i++) {
    // la pluie évite le tamper et les zones où se pose le texte des deux premiers chapitres
    let rainAngle, rainRadius, x, z;
    do {
      rainAngle = rnd() * TAU;
      rainRadius = Math.sqrt(lerp(2.15 * 2.15, 5.3 * 5.3, rnd()));
      x = Math.cos(rainAngle) * rainRadius;
      z = Math.sin(rainAngle) * rainRadius;
    } while (
      Math.hypot(x - TAMPER[0], z - TAMPER[1]) < 0.95 ||
      x * HERO_RIGHT[0] + z * HERO_RIGHT[1] < -1.6 ||
      x * CLOSE_RIGHT[0] + z * CLOSE_RIGHT[1] > 2.1 ||
      x * CLOSE_VIEW[0] + z * CLOSE_VIEW[1] > 2.4
    );
    // tornade : un entonnoir de sept bras en hélice, étroit en bas, évasé en haut
    const height = 0.3 + Math.pow(rnd(), 1.15) * 4.4;
    const arm = Math.floor(rnd() * 7);
    const vortexAngle = (arm / 7) * TAU + height * 1.25 + (rnd() - 0.5) * 0.5;
    const vortexRadius = 1.92 + height * height * 0.058 + (rnd() - 0.5) * 0.3;
    flock.push({
      rainAngle,
      rainRadius,
      fall: 0.16 + rnd() * 0.2, // vitesse de chute
      offset: rnd(),
      height,
      vortexRadius,
      turn: (((vortexAngle - rainAngle) % TAU) + TAU) % TAU, // toujours dans le sens de la rotation
      join: rnd(),
      dive: clamp(0.25 + (height / 4.7) * 0.5 + (rnd() - 0.5) * 0.5), // les grains du bas plongent d'abord
      seed: rnd(),
      seed2: rnd(),
      rx: rnd() * TAU, ry: rnd() * TAU, rz: rnd() * TAU,
      sx: (rnd() - 0.5) * 2.4, sy: (rnd() - 0.5) * 2.4,
      size: 0.88 + rnd() * 0.3,
    });
    beans.setColorAt(i, beanTint());
  }
  stage.add(beans);

  // ---------- plans de caméra, un par chapitre ----------
  stage.setShots([
    { target: [0, 1.45, 0], radius: 8.7, azimuth: HERO_AZIMUTH, elevation: 13, fov: 30, shift: [0.3, 0], portrait: { shift: [0, 0.5], radius: 11.6, target: [0, 1.3, 0] } },
    { target: [0, 0.8, 0], radius: 5.8, azimuth: CLOSE_AZIMUTH, elevation: 6, fov: 30, shift: [-0.48, -0.06], portrait: { shift: [0, 0.48], radius: 8.4 } },
    { target: [0, 2.25, 0], radius: 13.6, azimuth: 10, elevation: 6, fov: 30, shift: [0.29, 0], portrait: { shift: [0, 0.36], radius: 14.5, fov: 38 } },
    { target: [0, 1.1, 0], radius: 6, azimuth: PLUNGE_AZIMUTH, elevation: 79, fov: 30, shift: [-0.37, 0], portrait: { shift: [0, 0.48], radius: 11 } },
    { target: [0, 1.1, 0], radius: 8.8, azimuth: 24, elevation: 21, fov: 30, shift: [0, -0.36], portrait: { shift: [0, 0.34], radius: 10.4 } },
  ]);

  let clock = 0; // temps animé : figé si l'utilisateur réduit les animations
  let swirl = 0; // rotation accumulée de la tornade
  let tumble = 0; // culbute des grains
  let spin = 0; // rotation de la crema
  let settled = false;

  stage.onFrame(({ f, dt, reduced, height, shot }) => {
    const live = reduced ? 0 : 1;
    clock += dt * live;
    sky.rotation.y = shot.azimuth * DEG * 0.85; // le halo du fond reste derrière la tasse quand la caméra tourne

    // --- les grains ---
    const gather = span(f, 1.1, 1.9); // la tornade se forme
    const joining = clamp((f - 1.18) / 0.74);
    const diving = clamp((f - 2.25) / 0.55); // elle plonge dans la tasse
    const encore = span(f, 3.45, 4); // une pluie légère revient à la fin
    const again = f > 3.2;
    swirl += dt * live * 0.5 * gather * (1 + 1.5 * diving);
    tumble += dt * live * (0.3 + gather * 0.9);
    const turned = swirl + (f - 1.1) * 1.15 * gather; // le défilement fait aussi tourner la tornade
    beans.visible = f < 2.82 || again;
    if (beans.visible) {
      for (let i = 0; i < FLYING; i++) {
        const b = flock[i];
        const w = again ? 0 : smooth(clamp((joining - b.join * 0.45) / 0.55));
        const c = again ? 0 : clamp((diving - b.dive * 0.52) / 0.48);
        // pluie
        const drop = (b.offset + (clock * b.fall) / RAIN_HEIGHT) % 1;
        const rainY = RAIN_HEIGHT * (1 - drop);
        const edge = smooth(clamp(rainY / 0.5)) * smooth(clamp(((again ? 3.2 : RAIN_HEIGHT) - rainY) / 0.9));
        const shown = again ? (i < 72 ? encore : 0) : i < RAIN ? 1 : 0;
        let scale = lerp(edge * shown, 1, w);
        // tornade
        let radius = lerp(b.rainRadius, b.vortexRadius, w);
        let y = lerp(rainY, b.height + Math.sin(clock * 0.7 + b.seed * TAU) * 0.12, w);
        let angle = b.rainAngle + w * b.turn + (again ? 0 : turned);
        // plongeon : on monte au-dessus du bord en se resserrant, puis on pique dans le café
        if (c > 0) {
          const inward = smooth(clamp(c / 0.82));
          radius = lerp(radius, 0.1 + b.seed * 0.42, inward);
          y = lerp(y, 1.75 + b.seed2 * 0.5, smooth(clamp(c / 0.62))) - smooth(clamp((c - 0.55) / 0.45)) * (0.65 + b.seed2 * 0.5);
          angle += inward * inward * (4.2 + b.seed * 2.6);
          scale *= 1 - smooth(clamp((c - 0.84) / 0.16));
        }
        dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        dummy.rotation.set(b.rx + tumble * b.sx, b.ry + tumble * b.sy - angle, b.rz);
        dummy.scale.setScalar(scale * b.size);
        dummy.updateMatrix();
        beans.setMatrixAt(i, dummy.matrix);
      }
      beans.instanceMatrix.needsUpdate = true;
    }

    // --- les grains qui se posent au premier plan ---
    if (f < 1.4 || !settled) {
      settled = f >= 1.4;
      for (let i = 0; i < LANDING; i++) {
        const b = landed[i];
        const p = clamp(((f - 0.22) / 0.62 - b.delay * 0.4) / 0.6);
        const air = 1 - p * p; // chute accélérée, puis le grain se pose
        dummy.position.set(b.x, b.y + air * 4.6, b.z);
        dummy.rotation.set(b.rx + air * b.spin, b.ry + air * 2.2, b.rz + air * b.spin * 0.6, 'YXZ');
        dummy.scale.setScalar(b.size * smooth(clamp(p * 6)));
        dummy.updateMatrix();
        landing.setMatrixAt(i, dummy.matrix);
      }
      landing.instanceMatrix.needsUpdate = true;
      dummy.rotation.order = 'XYZ';
    }

    // le service pivote sur lui-même pour le chapitre « origine »
    set.rotation.y = -track(f, [0, SET_TURN, 0, 0, 0]) * DEG;

    // --- la crema ---
    spin += dt * live * track(f, [0.1, 0.08, 0.2, 0.42, 0.14]);
    cremaUniforms.uSpin.value = spin + f * 0.5;
    cremaUniforms.uTwist.value = 0.5 + span(f, 2.4, 3.15) * 2.7 - span(f, 3.45, 4) * 1.3 + Math.sin(clock * 0.21) * 0.22;

    // --- la vapeur ---
    const vapour = track(f, [1, 0.55, 0.3, 0.38, 1]);
    for (const sprite of steam) {
      const d = sprite.userData;
      const u = (d.phase + clock * 0.062 * d.speed) % 1;
      const sway = Math.sin(u * 5.2 + d.seed + clock * 0.25) * 0.3 * u;
      sprite.position.set(sway + d.side * 0.35 * u + 0.12 * u * u, COFFEE_Y + 0.08 + u * 2.9, Math.cos(u * 4.1 + d.seed2) * 0.22 * u);
      const size = 0.5 + u * 1.5;
      sprite.scale.set(size, size * 1.45, 1);
      sprite.material.rotation = d.seed + u * 1.6 * (d.side > 0 ? 1 : -1);
      sprite.material.opacity = vapour * 0.2 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 1.4);
    }

    // --- la lumière ---
    const roast = span(f, 1.3, 2) * (1 - span(f, 2.4, 2.95)); // la chauffe monte pendant la torréfaction
    const flicker = reduced ? 0.85 : 0.8 + 0.2 * fbm(clock * 1.7, 5.3);
    heat.intensity = (5 + roast * 30 + span(f, 3.4, 4) * 7) * flicker;
    lights.rim.intensity = 3.0 + roast * 1.6;
    lights.key.intensity = 2.3 + span(f, 2.5, 3) * (1 - span(f, 3.3, 3.9)) * 0.7;
    pool.material.opacity = 0.09 + roast * 0.12;
    dust.material.uniforms.uOpacity.value = 0.4 + roast * 0.45;
    dust.update(clock, height);
  });

  await stage.start();
}

// ---------- géométries ----------

// Pose un grain à plat sur la table, sillon vers le haut ou vers le bas.
function placeAtRest(dummy, x, z, rnd) {
  const up = rnd() < 0.62;
  dummy.position.set(x, up ? 0.083 : 0.036, z);
  dummy.rotation.set(up ? (rnd() - 0.5) * 0.3 : Math.PI + (rnd() - 0.5) * 0.2, rnd() * TAU, (rnd() - 0.5) * 0.5, 'YXZ');
  dummy.scale.setScalar(0.9 + rnd() * 0.25);
  dummy.updateMatrix();
  dummy.rotation.order = 'XYZ';
}

// Profil lissé (r, y) à faire tourner autour de l'axe : passe par tous les points donnés.
function profile(points, samples = 5) {
  const curve = new THREE.CatmullRomCurve3(points.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, 'centripetal');
  return curve.getPoints(points.length * samples).map((point) => new THREE.Vector2(Math.max(point.x, 0), point.y));
}

// Grain de café : dôme d'un côté, face plus plate de l'autre, fendue d'un sillon légèrement en S.
// Le maillage est resserré autour du sillon ; il est assombri par la couleur des sommets.
function makeBean() {
  const ring = [0, 10, 24, 46, 75, 110, 145, 180, 215, 250, 285, 314, 336, 350];
  const around = ring.length;
  const along = 8;
  const positions = [], colors = [], indices = [];
  for (let i = 0; i <= along; i++) {
    const phi = (i / along) * Math.PI;
    const z = -Math.cos(phi), girth = Math.sin(phi);
    for (let j = 0; j < around; j++) {
      const theta = ring[j] * DEG;
      const lipSide = j === 1 || j === around - 1;
      let x = girth * Math.sin(theta);
      let y = girth * Math.cos(theta);
      if (y > 0) y *= 0.4;
      const taper = Math.pow(girth, 0.7);
      y -= (j === 0 ? 0.32 : lipSide ? 0.03 : 0) * taper;
      if (j === 0 || lipSide) x += 0.09 * Math.sin(z * Math.PI) * girth;
      positions.push(x * 0.105, y * 0.085, z * 0.15);
      const shade = j === 0 ? 0.22 : lipSide ? 0.82 : 1;
      colors.push(shade, shade, shade);
    }
  }
  for (let i = 0; i < along; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * around + j, b = i * around + ((j + 1) % around), c = a + around, d = b + around;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Petite cuillère : cuilleron ovale et manche plat légèrement cambré. Axe x, cuilleron à gauche.
function makeSpoon(material) {
  const group = new THREE.Group();
  const shell = material.clone();
  shell.side = THREE.DoubleSide;
  const bowlGeometry = new THREE.SphereGeometry(1, 28, 10, 0, TAU, Math.PI / 2, Math.PI / 2);
  const bowlPosition = bowlGeometry.attributes.position;
  for (let i = 0; i < bowlPosition.count; i++) {
    const x = bowlPosition.getX(i);
    bowlPosition.setZ(i, bowlPosition.getZ(i) * (1 - 0.16 * x)); // un peu plus étroit vers le manche
  }
  bowlGeometry.computeVertexNormals();
  const bowl = new THREE.Mesh(bowlGeometry, shell);
  bowl.scale.set(0.29, 0.1, 0.19);
  bowl.position.set(-0.74, 0, 0);
  group.add(bowl);

  const length = 1.56;
  const shaft = new THREE.LatheGeometry(
    profile([[0, 0], [0.02, 0.004], [0.03, 0.03], [0.028, 0.5], [0.031, 1.0], [0.042, 1.36], [0.047, 1.48], [0.035, 1.54], [0, length]], 3),
    12
  );
  shaft.rotateZ(-Math.PI / 2); // l'axe du manche passe de y à x
  const position = shaft.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const t = position.getX(i) / length;
    position.setXYZ(i, position.getX(i) - 0.49, position.getY(i) * 0.5 + 0.06 * Math.sin(Math.PI * t) - 0.01, position.getZ(i) * 1.5);
  }
  shaft.computeVertexNormals();
  group.add(new THREE.Mesh(shaft, material));
  return group;
}

// Tamper : semelle de cuivre poli, manche tourné en bois sombre verni.
function makeTamper(copper) {
  const group = new THREE.Group();
  const base = profile(
    [[0, 0], [0.56, 0], [0.585, 0.008], [0.6, 0.03], [0.6, 0.2], [0.585, 0.228], [0.55, 0.24], [0.34, 0.262], [0.2, 0.3], [0.155, 0.37], [0.15, 0.46]],
    5
  );
  group.add(new THREE.Mesh(new THREE.LatheGeometry(base, 64), copper));
  const wood = materials.lacquer({ color: '#1d0d07', roughness: 0.24, clearcoatRoughness: 0.1 });
  const grip = profile(
    [[0.15, 0.44], [0.2, 0.47], [0.245, 0.58], [0.215, 0.82], [0.2, 0.98], [0.26, 1.17], [0.325, 1.33], [0.31, 1.47], [0.2, 1.57], [0, 1.6]],
    5
  );
  group.add(new THREE.Mesh(new THREE.LatheGeometry(grip, 48), wood));
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, 8, 48), copper);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.465;
  group.add(collar);
  return group;
}

// ---------- textures ----------

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Crema : marbrures « tigrées » noisette sur fond brun-roux, plus claires au centre,
// liseré de mousse au bord. Le vrillage en spirale est ajouté en direct dans le shader.
function cremaTexture(size) {
  const stops = [
    [0.0, [26, 9, 3]],
    [0.28, [74, 28, 9]],
    [0.52, [124, 58, 19]],
    [0.76, [172, 98, 40]],
    [1.0, [212, 150, 80]],
  ];
  const ramp = (t) => {
    for (let k = 1; k < stops.length; k++) {
      if (t <= stops[k][0]) return mix(stops[k - 1][1], stops[k][1], (t - stops[k - 1][0]) / (stops[k][0] - stops[k - 1][0]));
    }
    return stops[stops.length - 1][1];
  };
  return canvasTexture(size, (ctx) => {
    const image = ctx.createImageData(size, size);
    const data = image.data;
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const u = ((i + 0.5) / size) * 2 - 1, v = ((j + 0.5) / size) * 2 - 1;
        const r = Math.hypot(u, v);
        const o = (j * size + i) * 4;
        if (r > 1.02) { data[o] = 20; data[o + 1] = 8; data[o + 2] = 3; data[o + 3] = 255; continue; }
        // déformation du domaine : les veines ondulent
        const w1 = fbm(u * 2.1 + 11.3, v * 2.1 + 3.7, 0.5, 3) - 0.5;
        const w2 = fbm(u * 2.1 - 7.1, v * 2.1 + 19.4, 4.2, 3) - 0.5;
        const x = u + w1 * 0.62, y = v + w2 * 0.62;
        const radius = Math.hypot(x, y), angle = Math.atan2(y, x);
        const veins = Math.sin(angle * 3 + radius * 10.5 + w1 * 7);
        // tigrures : fines rayures sombres là où l'onde s'annule
        const tiger = Math.pow(Math.abs(Math.sin(angle * 4 - radius * 15 + w2 * 9 + w1 * 4)), 0.55);
        const grain = fbm(x * 11, y * 11, 7.7, 3) - 0.5;
        let t = 0.2 + tiger * 0.42 + veins * 0.15 + grain * 0.5;
        t += 0.12 * Math.exp(-(r * r) / 0.09); // cœur plus clair, là où le jet est tombé
        t -= 0.16 * smooth(clamp((r - 0.45) / 0.5)); // bord plus roux
        t += 0.3 * Math.exp(-Math.pow((r - 0.955) / 0.022, 2)); // liseré de mousse
        t -= 0.9 * smooth(clamp((r - 0.975) / 0.03)); // ombre contre la paroi
        const color = ramp(clamp(t));
        data[o] = color[0]; data[o + 1] = color[1]; data[o + 2] = color[2]; data[o + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    // quelques bulles fines
    const rnd = seeded(41);
    for (let n = 0; n < 70; n++) {
      const angle = rnd() * TAU, radius = Math.sqrt(rnd()) * 0.9;
      const x = (0.5 + Math.cos(angle) * radius * 0.5) * size, y = (0.5 + Math.sin(angle) * radius * 0.5) * size;
      const bubble = 0.8 + rnd() * 1.8;
      ctx.beginPath();
      ctx.arc(x, y, bubble, 0, TAU);
      ctx.fillStyle = `rgba(70, 30, 10, ${0.25 + rnd() * 0.3})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - bubble * 0.3, y - bubble * 0.3, bubble * 0.4, 0, TAU);
      ctx.fillStyle = 'rgba(255, 236, 200, 0.5)';
      ctx.fill();
    }
  });
}

// Bouffée de vapeur : quelques taches douces superposées.
function steamTexture() {
  return canvasTexture(256, (ctx, size) => {
    const rnd = seeded(3);
    for (let n = 0; n < 16; n++) {
      const x = size / 2 + (rnd() - 0.5) * size * 0.36;
      const y = size / 2 + (rnd() - 0.5) * size * 0.46;
      const radius = size * (0.12 + rnd() * 0.16);
      const blob = ctx.createRadialGradient(x, y, 0, x, y, radius);
      blob.addColorStop(0, 'rgba(255, 255, 255, 0.13)');
      blob.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = blob;
      ctx.fillRect(0, 0, size, size);
    }
  });
}

// Table : noyer très sombre, fil du bois à peine visible.
function tableTexture() {
  return canvasTexture(1024, (ctx, size) => {
    const rnd = seeded(17);
    ctx.fillStyle = '#170d09';
    ctx.fillRect(0, 0, size, size);
    for (let n = 0; n < 1500; n++) {
      const y = rnd() * size, x = rnd() * size, length = 60 + rnd() * 420;
      const light = rnd() < 0.5;
      ctx.strokeStyle = light ? `rgba(120, 66, 38, ${0.03 + rnd() * 0.07})` : `rgba(0, 0, 0, ${0.08 + rnd() * 0.2})`;
      ctx.lineWidth = 0.6 + rnd() * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + length * 0.33, y + (rnd() - 0.5) * 7, x + length * 0.66, y + (rnd() - 0.5) * 7, x + length, y + (rnd() - 0.5) * 5);
      ctx.stroke();
    }
  });
}

// Fondu circulaire : la table se perd dans le noir avant son bord.
function fadeTexture() {
  return canvasTexture(
    256,
    (ctx, size) => {
      const fade = ctx.createRadialGradient(size / 2, size / 2, size * 0.16, size / 2, size / 2, size * 0.5);
      fade.addColorStop(0, '#ffffff');
      fade.addColorStop(0.55, '#5a5a5a');
      fade.addColorStop(1, '#000000');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, size, size);
    },
    { srgb: false }
  );
}
