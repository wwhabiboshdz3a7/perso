// Clos Séraphin — une bouteille de champagne et sa flûte, posées sur un bloc de craie.
// Tout est procédural : la bouteille, la coiffe, le muselet et le bouchon sont des formes de
// révolution ; l'étiquette est dessinée dans un canvas. Au fil du défilement la bouteille se
// dénude et se couche pour le remuage, se rhabille, puis le bouchon saute et la flûte se remplit.

import * as THREE from 'three';
import { Stage, span, track, clamp, lerp, smooth, smoother } from '../../assets/js/stage.js';
import { studioEnvironment, threePoint, backdrop, softDisc, materials, Particles, canvasTexture, fbm, seeded } from '../../assets/js/kit.js';

const DEG = Math.PI / 180;
const TURN = Math.PI * 2;

// ---------- cotes (1 unité ≈ 10 cm) ----------
const BODY_R = 0.44; // rayon du fût
const MOUTH = 2.9; // hauteur du buvant de la bouteille
const CENTER = 1.45; // la bouteille bascule autour de ce point
const FLUTE_AT = [0.88, 0, 0.46];
const BOWL_Y0 = 1.04; // bas de la paraison de la flûte
const BOWL_Y1 = 2.38; // buvant de la flûte
const WINE_Y0 = 1.084;
const WINE_FULL = 1.99;
const CORK_REST = [-0.98, 0.185, 0.66]; // là où le bouchon retombe sur la craie

const stage = new Stage({ background: '#07100c', exposure: 1.05 });
if (stage.ok) init();

async function init() {
  const { scene, renderer, camera } = stage;

  // Les polices de l'étiquette doivent être chargées avant de dessiner le canvas.
  await Promise.race([
    Promise.all([
      document.fonts.load('400 120px "Bodoni"', 'CLOS SÉRAPHIN'),
      document.fonts.load('italic 400 90px "Bodoni"', 'Blanc de Blancs CS'),
      document.fonts.load('600 40px "Manrope"', 'CHAMPAGNE'),
    ]).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);

  // ---------- lumière ----------
  stage.setEnvironment(
    studioEnvironment(renderer, {
      ambient: '#040705',
      panels: [
        { size: [8, 8], color: '#f6f1e4', intensity: 2.4, position: [0, 8, 1] },
        { size: [2.2, 9], color: '#fff3dd', intensity: 10, position: [-6.5, 2.6, 3] },
        { size: [0.9, 9], color: '#e6f1e8', intensity: 8, position: [6, 2.6, 1.5] },
        { size: [3.5, 3.5], color: '#fff6e6', intensity: 1.3, position: [1.5, 3.5, 8] },
        { size: [10, 0.7], color: '#cfae6a', intensity: 2.6, position: [0, 0.6, -7] },
      ],
    }),
    0.95
  );
  const lights = threePoint({
    key: { color: '#fff4e2', intensity: 2.3, position: [-3.5, 6, 5] },
    rim: { color: '#ecdcae', intensity: 2.6, position: [5, 3.5, -6] },
    fill: { color: '#cfe3d6', intensity: 0.45, position: [4, 1.5, 6] },
  });
  const candle = new THREE.PointLight('#ffb264', 0, 14, 1.6); // lueur de bougie, pour la cave
  candle.position.set(-1.6, 3.6, 3.2);
  stage.add(lights.group, candle);

  const back = backdrop({ top: '#0a1610', bottom: '#020403', glow: '#1f3f2c', glowDirection: [0, 0.1, -1], glowSize: 0.11 });
  stage.add(back);
  const glowColors = ['#1c3b29', '#243a22', '#38260f', '#3d351a', '#2a3a22'].map((c) => new THREE.Color(c));

  const bubbles = new Particles({ count: 150, box: [9, 8, 6], center: [0.3, 2.6, 0], color: '#ecd391', size: 0.055, speed: [0.01, 0.2, 0], wobble: 0.12, twinkle: 0.6, opacity: 0.4 });
  const dust = new Particles({ count: 260, box: [9, 6, 6], center: [0.2, 1.8, 0.5], color: '#f3efe4', size: 0.026, speed: [0.02, -0.025, 0.01], wobble: 0.2, twinkle: 0.3, opacity: 0.4 });
  stage.add(bubbles.points, dust.points);

  // ---------- textures ----------
  const noise = noiseTexture();
  const dissolve = { alphaMap: noise, alphaTest: 0.004 };
  const dressing = []; // matières qui se dissolvent quand la bouteille est « nue »

  // ---------- le bloc de craie ----------
  const chalk = chalkTexture();
  const block = new THREE.Mesh(
    chalkBlock(1.9),
    new THREE.MeshStandardMaterial({ color: '#b9b6ab', map: chalk, bumpMap: chalk, bumpScale: 3, roughness: 0.97, vertexColors: true })
  );
  block.position.set(0.22, 0, 0.2);
  const chalkColor = new THREE.Color('#b9b6ab');
  stage.add(block);

  const bottleShadow = softDisc({ radius: 0.95, color: '#020403', opacity: 0.7, y: 0.006, falloff: 2 });
  const fluteShadow = softDisc({ radius: 0.6, color: '#020403', opacity: 0.4, y: 0.006, falloff: 2 });
  fluteShadow.position.set(FLUTE_AT[0], 0.006, FLUTE_AT[2]);
  const corkShadow = softDisc({ radius: 0.42, color: '#020403', opacity: 0, y: 0.006, falloff: 2 });
  corkShadow.position.set(CORK_REST[0] + 0.12, 0.007, CORK_REST[2]);
  stage.add(bottleShadow, fluteShadow, corkShadow);

  // ---------- la bouteille ----------
  // root (position) → yaw → tilt (bascule autour du centre) → spin (rotation sur l'axe) → pièces
  const root = new THREE.Group();
  const yaw = new THREE.Group();
  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  tilt.position.y = CENTER;
  spin.position.y = -CENTER;
  root.add(yaw);
  yaw.add(tilt);
  tilt.add(spin);
  stage.add(root);

  const glass = new THREE.MeshPhysicalMaterial({ color: '#0a2115', roughness: 0.07, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 });
  spin.add(new THREE.Mesh(new THREE.LatheGeometry(bottleProfile(), 96, Math.PI), glass));

  // trait de craie du remueur, sur le cul
  const mark = new THREE.Mesh(
    new THREE.LatheGeometry(markProfile(), 6, Math.PI - 0.08, 0.16),
    new THREE.MeshStandardMaterial({ color: '#f1ecdf', roughness: 0.95, side: THREE.DoubleSide })
  );
  spin.add(mark);

  // habillage : étiquette, coiffe (se dissolvent pendant le chapitre du temps)
  const dressed = new THREE.Group();
  spin.add(dressed);

  const labelMaterial = new THREE.MeshStandardMaterial({
    map: canvasTexture(1024, (ctx, size) => drawLabel(ctx, size, false)),
    roughnessMap: canvasTexture(512, (ctx, size) => drawLabel(ctx, size, true), { srgb: false }),
    roughness: 1,
    metalness: 1,
    ...dissolve,
  });
  labelMaterial.metalnessMap = labelMaterial.roughnessMap;
  const labelArc = 2.3;
  const label = new THREE.Mesh(new THREE.CylinderGeometry(BODY_R + 0.0035, BODY_R + 0.0035, 0.8, 56, 1, true, -labelArc / 2, labelArc), labelMaterial);
  label.position.y = 0.8;
  dressed.add(label);
  dressing.push(labelMaterial);

  const foilMaterial = materials.gold({ color: '#ffffff', map: foilTexture(), roughness: 0.36, bumpMap: noise, bumpScale: 0.5, ...dissolve });
  dressed.add(new THREE.Mesh(new THREE.LatheGeometry(foilProfile(), 72, Math.PI), foilMaterial));
  dressing.push(foilMaterial);

  // capsule de tirage : visible seulement quand la bouteille est nue
  const capMaterial = materials.brushed({ color: '#8f918a', roughness: 0.5, ...dissolve });
  const cap = new THREE.Mesh(new THREE.LatheGeometry(capProfile(), 40, Math.PI), capMaterial);
  spin.add(cap);

  // ---------- bouchon, plaque et muselet (s'envolent ensemble) ----------
  const anchor = new THREE.Object3D(); // suit le goulot
  anchor.position.y = MOUTH;
  spin.add(anchor);

  const stopper = new THREE.Group();
  stopper.rotation.order = 'YXZ';
  stage.add(stopper);

  const corkMaterial = new THREE.MeshStandardMaterial({ map: corkTexture(), roughness: 0.92, ...dissolve });
  const wireMaterial = materials.gold({ color: '#d9c48f', roughness: 0.3, ...dissolve });
  const plaqueMaterial = materials.gold({ color: '#d9bd7c', roughness: 0.3, ...dissolve });
  const crestMaterial = materials.gold({ color: '#ffffff', map: crestTexture(), roughness: 0.34, ...dissolve });
  dressing.push(corkMaterial, wireMaterial, plaqueMaterial, crestMaterial);

  stopper.add(new THREE.Mesh(new THREE.LatheGeometry(corkProfile(), 40, Math.PI), corkMaterial));
  stopper.add(new THREE.Mesh(new THREE.LatheGeometry(plaqueProfile(), 40, Math.PI), plaqueMaterial));
  const crest = new THREE.Mesh(new THREE.CircleGeometry(0.1, 36), crestMaterial);
  crest.rotation.x = -Math.PI / 2;
  crest.position.y = 0.2385;
  stopper.add(crest);
  for (let k = 0; k < 4; k++) {
    const leg = new THREE.Mesh(wireLeg(), wireMaterial);
    leg.rotation.y = Math.PI / 4 + (k * Math.PI) / 2;
    stopper.add(leg);
  }
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.162, 0.0075, 6, 56), wireMaterial);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = -0.185;
  stopper.add(belt);
  const eyelet = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0065, 6, 18), wireMaterial);
  eyelet.position.set(0.11, -0.2, 0.15);
  eyelet.rotation.set(0.25, 0.63, 0);
  stopper.add(eyelet);

  // ---------- la flûte ----------
  const flute = new THREE.Group();
  flute.position.fromArray(FLUTE_AT);
  stage.add(flute);

  const fluteGlass = fineGlass();
  const fluteMesh = new THREE.Mesh(new THREE.LatheGeometry(fluteProfile(), 64, Math.PI), fluteGlass);
  fluteMesh.renderOrder = 2;
  flute.add(fluteMesh);

  // le vin : le seul matériau à transmission de la scène
  const wineMaterial = materials.glass({
    color: '#f8e0a4',
    roughness: 0.05,
    thickness: 0.34,
    ior: 1.34,
    attenuationColor: new THREE.Color('#e0a63a'),
    attenuationDistance: 0.55,
    emissive: new THREE.Color('#a8741c'),
    emissiveIntensity: 0.3,
  });
  const wine = new Fill((y) => innerRadius(y) - 0.003, 30, 44);
  const wineMesh = new THREE.Mesh(wine.geometry, wineMaterial);
  const foam = new Fill((y) => innerRadius(y) - 0.004, 6, 44);
  const foamMesh = new THREE.Mesh(foam.geometry, new THREE.MeshStandardMaterial({ color: '#fff7e3', roughness: 0.85, emissive: '#6b5527', emissiveIntensity: 0.35 }));
  flute.add(wineMesh, foamMesh);

  // bulles dans le vin : quelques trains qui montent + la collerette en surface
  const TRAINS = 9, PER_TRAIN = 9, COLLAR = 34;
  const pearl = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshStandardMaterial({ color: '#fff6dc', emissive: '#f3d58c', emissiveIntensity: 1.1, roughness: 0.25 }),
    TRAINS * PER_TRAIN + COLLAR
  );
  pearl.frustumCulled = false;
  flute.add(pearl);
  const rnd = seeded(23);
  const trains = Array.from({ length: TRAINS }, () => ({ angle: rnd() * TURN, rho: 0.12 + rnd() * 0.72, speed: 0.22 + rnd() * 0.2, seed: rnd() * 10 }));
  const collar = Array.from({ length: COLLAR }, (_, i) => ({ angle: (i / COLLAR) * TURN + rnd() * 0.12, rho: 0.84 + rnd() * 0.13, size: 0.009 + rnd() * 0.011, seed: rnd() * 10 }));
  const dummy = new THREE.Object3D();

  // ---------- la gerbe ----------
  const sparks = new Burst({ count: 520, color: '#ffd98a', size: 0.1, speed: [1.6, 4.6], spread: 0.5, gravity: 1.7, seed: 4 });
  const spray = new Burst({ count: 110, color: '#fff3d6', size: 0.2, speed: [0.9, 3.2], spread: 0.34, gravity: 1.3, seed: 9, opacity: 0.3 });
  sparks.points.position.set(0, MOUTH + 0.05, 0);
  spray.points.position.set(0, MOUTH + 0.05, 0);
  const flash = softDisc({ radius: 1, color: '#ffe9b8', opacity: 0, additive: true, falloff: 2.4 });
  flash.position.set(0, MOUTH + 0.2, 0);
  flash.renderOrder = 3;
  stage.add(sparks.points, spray.points, flash);

  // ---------- plans de caméra, un par chapitre ----------
  stage.setShots([
    // héros : la bouteille et la flûte sur leur bloc de craie
    { target: [0.3, 1.55, 0.1], radius: 8.8, azimuth: -14, elevation: 6, fov: 30, shift: [0.38, -0.02], portrait: { shift: [0, 0.42], radius: 12.6, target: [0.34, 1.5, 0.1] } },
    // le terroir : l'étiquette de près, la craie au pied
    { target: [0, 0.98, 0], radius: 4.4, azimuth: 24, elevation: 3, fov: 30, shift: [-0.42, 0], portrait: { shift: [0, 0.4], radius: 5.6, target: [0, 0.78, 0] } },
    // le temps : bouteille nue, couchée, vue par le cul
    { target: [0, CENTER + 1.1, 0], radius: 6.9, azimuth: 4, elevation: 4, fov: 30, shift: [0.36, 0], portrait: { shift: [0, 0.4], radius: 10.4 } },
    // l'instant : le bouchon part, la flûte se remplit
    { target: [0.3, 2.2, 0.1], radius: 11.6, azimuth: -19, elevation: 3, fov: 30, shift: [-0.36, 0.04], portrait: { shift: [0, 0.36], radius: 14.4, target: [0.1, 2.1, 0.1] } },
    // l'invitation : tout est servi
    { target: [0.3, 1.42, 0.1], radius: 11.2, azimuth: 15, elevation: 10, fov: 30, shift: [0, -0.3], portrait: { shift: [0, 0.4], radius: 12.4 } },
  ]);

  const focus = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let remuage = 0;
  let lastLevel = -1, lastFoam = -1;

  stage.onFrame(({ f, time, dt, reduced, height }) => {
    const t = reduced ? 0 : time;

    // ----- la bouteille se couche et se dénude (chapitre du temps) -----
    const lying = span(f, 1.3, 1.95) * (1 - span(f, 2.05, 2.5));
    const bare = span(f, 1.38, 1.82) * (1 - span(f, 2.12, 2.46));
    root.position.y = lying * (1.1 + (reduced ? 0 : Math.sin(time * 0.7) * 0.03));
    yaw.rotation.y = lying * -36 * DEG;
    tilt.rotation.z = lying * 117 * DEG;

    // rotation sur l'axe : l'étiquette suit la caméra ; couchée, la bouteille tourne par quarts de tour
    const facing = track(f, [-0.06, 0.3, 0.3, -0.5, 0.14]) + (reduced ? 0 : Math.sin(time * 0.3) * 0.05);
    if (lying > 0.995 && !reduced) remuage += dt;
    const beat = remuage / 2.8;
    const turned = 1.25 + (Math.floor(beat) + smooth(clamp((beat % 1) / 0.26))) * (Math.PI / 2);
    spin.rotation.y = lerp(nearestTurn(turned, facing), turned, lying);

    glass.roughness = lerp(0.07, 0.24, bare);
    glass.clearcoat = lerp(1, 0.55, bare);
    glass.clearcoatRoughness = lerp(0.03, 0.3, bare);
    const cut = lerp(0.004, 1, bare);
    for (const material of dressing) material.alphaTest = cut;
    dressed.visible = stopper.visible = bare < 0.998;
    capMaterial.alphaTest = lerp(1, 0.004, bare);
    cap.visible = bare > 0.002;
    bottleShadow.material.opacity = 0.7 * (1 - span(lying, 0, 0.45));
    block.material.color.copy(chalkColor).multiplyScalar(1 - lying * 0.86); // le bloc s'efface dans l'ombre de la cave

    // ----- le bouchon saute -----
    anchor.position.y = MOUTH + span(f, 2.46, 2.6) * 0.03;
    const p = clamp((f - 2.6) / 0.72);
    if (p <= 0) {
      anchor.updateWorldMatrix(true, false);
      stopper.position.setFromMatrixPosition(anchor.matrixWorld);
      stopper.quaternion.setFromRotationMatrix(anchor.matrixWorld);
    } else {
      // trajectoire balistique jusqu'au bloc de craie, en tournoyant
      const settle = smooth(clamp((f - 3.32) / 0.25));
      stopper.position.set(
        CORK_REST[0] * Math.pow(p, 0.9) - settle * 0.1,
        MOUTH + 0.03 + 7.58 * p - (7.58 + MOUTH + 0.03 - CORK_REST[1]) * p * p,
        CORK_REST[2] * p
      );
      stopper.rotation.set(TURN * 1.5 * p + settle * 0.9, lerp(spin.rotation.y, 0.5, p), (TURN * 2 + Math.PI / 2 + 0.13) * Math.pow(p, 0.92));
    }
    corkShadow.material.opacity = span(p, 0.82, 1) * 0.5;

    const pop = clamp((f - 2.6) / 1.15);
    sparks.update(pop, t, height);
    spray.update(clamp((f - 2.6) / 0.7), t, height);
    const burst = clamp((f - 2.6) / 0.45);
    flash.visible = burst > 0 && burst < 1;
    flash.material.opacity = Math.min(1, burst * 14) * (1 - burst) * (1 - burst) * 0.55;
    flash.scale.setScalar(0.5 + burst * 1.5);
    flash.quaternion.copy(camera.quaternion);

    // ----- la flûte -----
    const shown = clamp(1 - span(f, 0.3, 0.75) + span(f, 2.45, 2.72));
    flute.visible = shown > 0.01;
    fluteGlass.userData.fade.value = shown;
    fluteShadow.material.opacity = 0.4 * shown;

    // le service : le vin monte, la mousse gonfle puis retombe
    const fill = span(f, 2.7, 3.26);
    const level = lerp(WINE_Y0, WINE_FULL, fill);
    const head = 0.012 * span(fill, 0.1, 0.4) + 0.15 * span(f, 2.76, 3.08) * (1 - span(f, 3.22, 3.72));
    const served = fill > 0.012;
    wineMesh.visible = foamMesh.visible = pearl.visible = served;
    if (served) {
      if (Math.abs(level - lastLevel) > 1e-4 || Math.abs(head - lastFoam) > 1e-4) {
        wine.set(WINE_Y0, level);
        foam.set(level - 0.002, level + head);
        lastLevel = level;
        lastFoam = head;
      }
      const depth = level - WINE_Y0;
      let n = 0;
      for (const train of trains) {
        for (let j = 0; j < PER_TRAIN; j++) {
          const phase = (t * train.speed + j / PER_TRAIN + train.seed) % 1;
          const y = WINE_Y0 + 0.02 + phase * (depth - 0.03);
          const r = Math.max(0, innerRadius(y) - 0.022) * train.rho;
          const a = train.angle + Math.sin(phase * 9 + train.seed) * 0.12;
          dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
          dummy.scale.setScalar(depth > 0.08 ? lerp(0.005, 0.013, phase) : 0);
          dummy.updateMatrix();
          pearl.setMatrixAt(n++, dummy.matrix);
        }
      }
      const rim = innerRadius(level + head) - 0.006;
      for (const bead of collar) {
        const a = bead.angle + t * 0.05;
        const r = rim * bead.rho;
        dummy.position.set(Math.cos(a) * r, level + head + 0.002 + Math.sin(t * 1.3 + bead.seed) * 0.002, Math.sin(a) * r);
        dummy.scale.setScalar(bead.size * span(fill, 0.08, 0.3));
        dummy.updateMatrix();
        pearl.setMatrixAt(n++, dummy.matrix);
      }
      pearl.instanceMatrix.needsUpdate = true;
    }

    // ----- lumière et atmosphère -----
    const flicker = reduced ? 0.85 : 0.72 + 0.28 * fbm(time * 2.2, 5.3);
    lights.key.intensity = track(f, [2.3, 2.7, 1.1, 2.3, 2.6]);
    lights.rim.intensity = track(f, [2.6, 1.6, 1.0, 3.2, 3.0]);
    lights.fill.intensity = track(f, [0.45, 0.6, 0.15, 0.45, 0.6]);
    candle.intensity = lying * 42 * flicker;
    scene.environmentIntensity = track(f, [0.95, 0.9, 0.5, 1.0, 1.08]);

    // le halo du fond reste derrière le sujet, quelle que soit la caméra
    focus.set(0.35, 1.9 + lying * 0.7, 0);
    back.material.uniforms.uDirection.value.copy(tmp.copy(focus).sub(camera.position).normalize());
    colorTrack(back.material.uniforms.uGlow.value, f, glowColors);

    bubbles.material.uniforms.uOpacity.value = track(f, [0.3, 0.18, 0.1, 0.75, 0.6]);
    dust.material.uniforms.uOpacity.value = track(f, [0.25, 0.5, 0.55, 0.15, 0.15]);
    bubbles.update(t, height);
    dust.update(t, height);
  });

  await stage.start();
}

// ============================================================ outils

function nearestTurn(current, target) {
  return target + Math.round((current - target) / TURN) * TURN;
}

function colorTrack(out, f, colors) {
  const last = colors.length - 1;
  const x = clamp(f, 0, last);
  const i = Math.min(Math.floor(x), last);
  return out.copy(colors[i]).lerp(colors[Math.min(i + 1, last)], smoother(x - i));
}

const v2 = (pairs) => pairs.map(([x, y]) => new THREE.Vector2(x, y));
const splined = (pairs, count) => new THREE.SplineCurve(v2(pairs)).getPoints(count);

// ============================================================ profils de révolution

// Rayon extérieur de la bouteille entre le talon et la bague.
function bottleRadius(y) {
  if (y <= 1.34) return BODY_R;
  if (y <= 2.08) return lerp(BODY_R, 0.166, smooth(Math.pow((y - 1.34) / 0.74, 0.92)));
  return lerp(0.166, 0.148, clamp((y - 2.08) / 0.62));
}

const PUNT = [[0, 0.33], [0.07, 0.322], [0.15, 0.285], [0.23, 0.2], [0.3, 0.1], [0.345, 0.036], [0.378, 0.008], [0.402, 0], [0.422, 0.007], [0.435, 0.028], [BODY_R, 0.07]];

function bottleProfile() {
  const points = splined(PUNT, 34);
  for (let y = 0.16; y < 1.34; y += 0.118) points.push(new THREE.Vector2(BODY_R, y));
  for (let i = 0; i <= 34; i++) {
    const y = lerp(1.34, 2.08, i / 34);
    points.push(new THREE.Vector2(bottleRadius(y), y));
  }
  for (let i = 1; i <= 5; i++) {
    const y = lerp(2.08, 2.7, i / 5);
    points.push(new THREE.Vector2(bottleRadius(y), y));
  }
  // bague et buvant, puis l'intérieur du goulot
  points.push(...v2([[0.151, 2.706], [0.166, 2.714], [0.179, 2.732], [0.184, 2.765], [0.179, 2.797], [0.167, 2.813], [0.16, 2.824], [0.16, 2.862], [0.156, 2.886], [0.145, 2.898], [0.125, MOUTH], [0.109, MOUTH], [0.104, 2.885], [0.104, 2.5]]));
  return points;
}

function markProfile() {
  const points = splined(PUNT, 20).map((point) => new THREE.Vector2(point.x + 0.003, point.y - 0.004));
  points[0].x = 0.02;
  points.push(new THREE.Vector2(BODY_R + 0.004, 0.16), new THREE.Vector2(BODY_R + 0.004, 0.42));
  return points;
}

function foilProfile() {
  const points = [new THREE.Vector2(bottleRadius(1.7) + 0.001, 1.698)];
  for (let i = 0; i <= 44; i++) {
    const y = lerp(1.7, 2.7, i / 44);
    points.push(new THREE.Vector2(bottleRadius(y) + 0.0055, y));
  }
  points.push(new THREE.Vector2(0.15, 2.704));
  return points;
}

function capProfile() {
  return v2([[0.186, 2.758], [0.197, 2.762], [0.19, 2.775], [0.191, 2.82], [0.189, 2.88], [0.18, 2.902], [0.158, 2.914], [0.1, 2.918], [0, 2.918]]);
}

// Bouchon en champignon ; l'origine est au niveau du buvant.
function corkProfile() {
  return splined([[0, -0.46], [0.07, -0.46], [0.118, -0.452], [0.132, -0.42], [0.13, -0.36], [0.118, -0.2], [0.105, -0.04], [0.104, 0], [0.13, 0.004], [0.158, 0.022], [0.168, 0.07], [0.167, 0.12], [0.158, 0.17], [0.138, 0.205], [0.1, 0.222], [0, 0.224]], 60);
}

function plaqueProfile() {
  return v2([[0.16, 0.168], [0.158, 0.19], [0.15, 0.215], [0.132, 0.231], [0.105, 0.2375], [0, 0.238]]);
}

// Une patte du muselet : de la plaque à la ceinture, sous la bague.
function wireLeg() {
  const path = new THREE.CatmullRomCurve3(
    [[0.118, 0.236], [0.15, 0.222], [0.167, 0.19], [0.176, 0.12], [0.178, 0.04], [0.186, -0.04], [0.19, -0.105], [0.186, -0.15], [0.17, -0.18], [0.162, -0.186]].map(([r, y]) => new THREE.Vector3(r, y, 0))
  );
  return new THREE.TubeGeometry(path, 40, 0.0072, 6);
}

// ----- la flûte -----
function bowlShape(t) {
  const x = clamp(t);
  return x <= 0.6 ? Math.pow(Math.sin((x / 0.6) * Math.PI * 0.5), 0.8) : 1 - 0.13 * Math.pow((x - 0.6) / 0.4, 1.7);
}
const outerRadius = (y) => 0.036 + 0.226 * bowlShape((y - BOWL_Y0) / (BOWL_Y1 - BOWL_Y0));
const innerRadius = (y) => 0.25 * bowlShape((y - 1.075) / (BOWL_Y1 - 1.075));

function fluteProfile() {
  const points = splined([[0, 0.004], [0.2, 0.001], [0.31, 0], [0.34, 0.004], [0.348, 0.014], [0.338, 0.024], [0.25, 0.034], [0.14, 0.052], [0.07, 0.085], [0.042, 0.14], [0.034, 0.22], [0.03, 0.45], [0.03, 0.8], [0.033, 0.96], [0.036, BOWL_Y0]], 70);
  for (let i = 1; i <= 44; i++) {
    const y = lerp(BOWL_Y0, BOWL_Y1, i / 44);
    points.push(new THREE.Vector2(outerRadius(y), y));
  }
  points.push(new THREE.Vector2(outerRadius(BOWL_Y1) - 0.004, BOWL_Y1 + 0.005), new THREE.Vector2(innerRadius(BOWL_Y1) + 0.003, BOWL_Y1 + 0.005));
  for (let i = 0; i <= 44; i++) {
    const y = lerp(BOWL_Y1, 1.075, i / 44);
    points.push(new THREE.Vector2(innerRadius(y), y));
  }
  return points;
}

// Verre fin : le matériau « thinGlass » du kit, avec un alpha qui suit les reflets et le
// contre-jour (bords et éclats bien lisibles, parois presque invisibles), et un fondu global.
function fineGlass() {
  const material = materials.thinGlass({ color: '#131c17', opacity: 0.14, side: THREE.DoubleSide, envMapIntensity: 1.5 });
  material.userData.fade = { value: 1 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFade = material.userData.fade;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFade;')
      .replace(
        '#include <opaque_fragment>',
        `float glassRim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0);
         float glassShine = min(max(outgoingLight.r, max(outgoingLight.g, outgoingLight.b)), 1.0);
         diffuseColor.a = clamp((0.06 + 0.55 * glassRim + 0.95 * glassShine) * uFade, 0.0, 1.0);
         #include <opaque_fragment>`
      );
  };
  return material;
}

// Volume de révolution entre deux hauteurs le long d'un profil intérieur : le vin, la mousse.
class Fill {
  constructor(radiusAt, rows, segments) {
    this.radiusAt = radiusAt;
    this.rows = rows;
    this.segments = segments;
    const ring = segments + 1;
    const count = (rows + 2) * ring + 1;
    this.positions = new Float32Array(count * 3);
    this.normals = new Float32Array(count * 3);
    const indices = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * ring + j, b = a + 1, c = a + ring, d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    const top = (rows + 1) * ring, centre = count - 1;
    for (let j = 0; j < segments; j++) indices.push(top + j, centre, top + j + 1);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(this.normals, 3));
    this.geometry.setIndex(indices);
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.7, 0), 1.2);
  }

  set(y0, y1) {
    const { rows, segments, positions, normals, radiusAt } = this;
    const ring = segments + 1;
    const e = 0.004;
    let o = 0;
    for (let i = 0; i <= rows + 1; i++) {
      const cap = i === rows + 1; // dernier anneau : la surface, normale vers le haut
      const y = cap ? y1 : lerp(y0, y1, i / rows);
      const r = Math.max(radiusAt(y), 0.0006);
      const slope = (radiusAt(y + e) - radiusAt(y - e)) / (2 * e);
      const length = Math.hypot(1, slope);
      for (let j = 0; j <= segments; j++) {
        const a = (j / segments) * TURN;
        const cos = Math.cos(a), sin = Math.sin(a);
        positions[o] = cos * r;
        positions[o + 1] = y;
        positions[o + 2] = sin * r;
        normals[o] = cap ? 0 : cos / length;
        normals[o + 1] = cap ? 1 : -slope / length;
        normals[o + 2] = cap ? 0 : sin / length;
        o += 3;
      }
    }
    positions[o] = 0;
    positions[o + 1] = y1;
    positions[o + 2] = 0;
    normals[o] = 0;
    normals[o + 1] = 1;
    normals[o + 2] = 0;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
  }
}

// Gerbe pilotée par le défilement : chaque point suit une trajectoire balistique en fonction
// de la progression uP (0 → 1), ce qui la rend réversible.
class Burst {
  constructor({ count, color, size, speed, spread, gravity, seed, opacity = 1 }) {
    const rnd = seeded(seed);
    const positions = new Float32Array(count * 3);
    const velocity = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const cone = Math.pow(rnd(), 0.7) * spread; // angle par rapport à la verticale
      const around = rnd() * TURN;
      const v = lerp(speed[0], speed[1], Math.pow(rnd(), 1.4));
      velocity[i * 3] = Math.sin(cone) * Math.cos(around) * v - 0.25 * v * 0.3;
      velocity[i * 3 + 1] = Math.cos(cone) * v;
      velocity[i * 3 + 2] = Math.sin(cone) * Math.sin(around) * v;
      seeds[i * 4] = rnd();
      seeds[i * 4 + 1] = rnd();
      seeds[i * 4 + 2] = rnd();
      seeds[i * 4 + 3] = 0.35 + rnd() * 0.65;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocity, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uP: { value: 0 },
        uTime: { value: 0 },
        uScale: { value: 900 },
        uSize: { value: size },
        uGravity: { value: gravity },
        uOpacity: { value: opacity },
        uColor: { value: new THREE.Color(color) },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aVelocity; attribute vec4 aSeed;
        uniform float uP; uniform float uTime; uniform float uScale; uniform float uSize; uniform float uGravity;
        varying float vAlpha;
        void main() {
          float life = clamp((uP - aSeed.x * 0.28) / 0.72, 0.0, 1.0); // départs échelonnés
          float t = life * 1.5;
          vec3 p = aVelocity * t * (1.0 - 0.22 * life) + vec3(0.0, -uGravity, 0.0) * t * t;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * aSeed.w * (1.0 - 0.45 * life) * uScale / -mv.z;
          float blink = 0.7 + 0.3 * sin(uTime * (3.0 + aSeed.y * 5.0) + aSeed.z * 6.283);
          vAlpha = smoothstep(0.0, 0.05, life) * pow(1.0 - life, 1.2) * blink;
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

  update(progress, time, height) {
    this.points.visible = progress > 0 && progress < 1;
    this.material.uniforms.uP.value = progress;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uScale.value = height;
  }
}

// ============================================================ le bloc de craie

function chalkBlock(radius) {
  // du bas vers le haut, pour que les faces regardent vers l'extérieur
  const profile = [[0, 0], [0.3, 0], [0.55, 0], [0.76, 0], [0.9, 0], [0.962, 0], [0.985, -0.008], [0.997, -0.03], [1, -0.08], [0.998, -0.26], [1.003, -0.5], [0.998, -0.85], [1.003, -1.3], [1, -2.3]].reverse();
  const TOP_ROWS = 6; // rangs dont les UV sont projetés à plat
  // contour : un polygone irrégulier, comme un bloc dégrossi à la scie
  const rnd = seeded(41);
  const FACES = 9;
  const faces = Array.from({ length: FACES }, (_, k) => ({ angle: ((k + (rnd() - 0.5) * 0.55) / FACES) * TURN, reach: 0.9 + rnd() * 0.1 }));
  const outline = (angle) => {
    let reach = 2;
    for (const face of faces) {
      const c = Math.cos(angle - face.angle);
      if (c > 0.05) reach = Math.min(reach, face.reach / c);
    }
    return reach;
  };
  const geometry = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r * radius, y)), 180, Math.PI);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const row = profile.length - 1 - (i % profile.length); // 0 = centre du dessus
    let x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const r = Math.hypot(x, z);
    if (r > 0.01) {
      const k = outline(Math.atan2(z, x));
      x *= k;
      z *= k;
      if (row >= TOP_ROWS) {
        // faces légèrement gauches, éclats sur l'arête
        const big = fbm(x * 0.9 + 7, y * 1.3, z * 0.9 + 3) - 0.5;
        const small = fbm(x * 5 + 1, y * 5, z * 5 + 9) - 0.5;
        const push = big * 0.1 + small * 0.035;
        x += (x / r) * push;
        z += (z / r) * push;
        if (row <= 8) y -= Math.max(0, small) * 0.05;
      }
    }
    position.setXYZ(i, x, y, z);
    if (row < TOP_ROWS) uv.setXY(i, 0.5 + x * 0.27, 0.5 + z * 0.27);
    else uv.setXY(i, uv.getX(i) * 5, 0.2 + y * 0.42);
    const shade = lerp(1, 0.02, smooth(clamp((-y - 0.03) / 1.05)));
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function chalkTexture() {
  return canvasTexture(
    512,
    (ctx, size) => {
      const rnd = seeded(31);
      ctx.fillStyle = '#c9c4b3';
      ctx.fillRect(0, 0, size, size);
      for (let n = 0; n < 260; n++) {
        const x = rnd() * size, y = rnd() * size, r = 14 + rnd() * 70;
        const blot = ctx.createRadialGradient(x, y, 0, x, y, r);
        const light = rnd() > 0.5;
        blot.addColorStop(0, light ? `rgba(238, 233, 220, ${0.08 + rnd() * 0.14})` : `rgba(120, 116, 100, ${0.06 + rnd() * 0.12})`);
        blot.addColorStop(1, 'rgba(180, 175, 160, 0)');
        ctx.fillStyle = blot;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // traces d'outil
      for (let n = 0; n < 150; n++) {
        const x = rnd() * size, y = rnd() * size, l = 12 + rnd() * 60, a = -0.5 + rnd() * 0.4;
        ctx.strokeStyle = rnd() > 0.4 ? `rgba(96, 92, 80, ${0.08 + rnd() * 0.18})` : `rgba(244, 240, 228, ${0.1 + rnd() * 0.2})`;
        ctx.lineWidth = 0.6 + rnd() * 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.stroke();
      }
      // piqûres
      for (let n = 0; n < 1500; n++) {
        ctx.fillStyle = `rgba(${70 + rnd() * 40}, ${68 + rnd() * 40}, ${58 + rnd() * 40}, ${0.1 + rnd() * 0.3})`;
        ctx.beginPath();
        ctx.arc(rnd() * size, rnd() * size, 0.4 + rnd() * 1.5, 0, TURN);
        ctx.fill();
      }
    },
    { repeat: true }
  );
}

// ============================================================ textures dessinées

// Nuage en niveaux de gris : sert de relief (froissé de la coiffe) et de carte de dissolution.
function noiseTexture() {
  return canvasTexture(
    256,
    (ctx, size) => {
      const image = ctx.createImageData(size, size);
      for (let j = 0; j < size; j++) {
        for (let i = 0; i < size; i++) {
          const n = fbm((i / size) * 7, (j / size) * 7, 2.5, 4);
          const value = Math.round((0.06 + 0.88 * clamp((n - 0.27) / 0.46)) * 255);
          const o = (j * size + i) * 4;
          image.data[o] = image.data[o + 1] = image.data[o + 2] = value;
          image.data[o + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0);
    },
    { srgb: false, repeat: true }
  );
}

// Texte centré avec interlettrage (indépendant de ctx.letterSpacing, pas encore universel).
function spaced(ctx, text, cx, y, gap) {
  const widths = [...text].map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, w) => sum + w, 0) + gap * (widths.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  [...text].forEach((char, index) => {
    ctx.fillText(char, x, y);
    x += widths[index] + gap;
  });
  return total;
}

// L'étiquette. Deux passes : couleurs, puis rugosité (vert) / métal (bleu) pour la dorure à chaud.
function drawLabel(ctx, size, orm) {
  const W = 1300, H = 1024, cx = W / 2;
  const paper = orm ? 'rgb(0, 205, 0)' : '#efe8d6';
  const ink = orm ? 'rgb(0, 150, 0)' : '#13271c';
  const gold = orm ? 'rgb(0, 82, 178)' : '#c7a45c';
  ctx.save();
  ctx.scale(size / W, size / H);
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);
  if (!orm) {
    // grain du papier
    const rnd = seeded(3);
    for (let n = 0; n < 5000; n++) {
      ctx.fillStyle = rnd() > 0.5 ? `rgba(255, 255, 255, ${rnd() * 0.16})` : `rgba(120, 104, 70, ${rnd() * 0.07})`;
      ctx.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 9, 1.4);
    }
    const shade = ctx.createLinearGradient(0, 0, W, 0);
    shade.addColorStop(0, 'rgba(90, 76, 44, 0.16)');
    shade.addColorStop(0.2, 'rgba(90, 76, 44, 0)');
    shade.addColorStop(0.8, 'rgba(90, 76, 44, 0)');
    shade.addColorStop(1, 'rgba(90, 76, 44, 0.16)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.textBaseline = 'alphabetic';

  // filets
  ctx.strokeStyle = gold;
  ctx.lineWidth = 6;
  ctx.strokeRect(38, 38, W - 76, H - 76);
  ctx.lineWidth = 1.6;
  ctx.strokeRect(54, 54, W - 108, H - 108);

  // médaillon au monogramme
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(cx, 208, 92, 0, TURN);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, 208, 80, 0, TURN);
  ctx.stroke();
  ctx.fillStyle = gold;
  ctx.font = 'italic 400 104px "Bodoni", "Cormorant", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CS', cx - 2, 243);
  ctx.fillStyle = ink;
  ctx.font = '600 21px "Manrope", system-ui, sans-serif';
  spaced(ctx, 'MAISON FONDÉE', cx - 300, 215, 8);
  spaced(ctx, 'EN 1887', cx + 300, 215, 8);
  ctx.fillStyle = gold;
  ctx.fillRect(cx - 176, 207, 60, 1.8);
  ctx.fillRect(cx + 116, 207, 60, 1.8);

  // le nom
  ctx.fillStyle = ink;
  let px = 132;
  ctx.font = `400 ${px}px "Bodoni", "Cormorant", Georgia, serif`;
  const natural = [...'CLOS SÉRAPHIN'].reduce((sum, char) => sum + ctx.measureText(char).width + 12, 0);
  px = Math.min(px, (px * 900) / natural);
  ctx.font = `500 ${px}px "Bodoni", "Cormorant", Georgia, serif`;
  spaced(ctx, 'CLOS SÉRAPHIN', cx, 478, 12);

  // filet et losange
  ctx.fillStyle = gold;
  ctx.fillRect(cx - 250, 548, 222, 2);
  ctx.fillRect(cx + 28, 548, 222, 2);
  ctx.save();
  ctx.translate(cx, 549);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-8, -8, 16, 16);
  ctx.restore();

  ctx.fillStyle = ink;
  ctx.font = '600 44px "Manrope", system-ui, sans-serif';
  spaced(ctx, 'CHAMPAGNE', cx, 640, 26);

  ctx.fillStyle = gold;
  ctx.font = 'italic 400 80px "Bodoni", "Cormorant", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Blanc de Blancs', cx, 762);

  ctx.fillStyle = ink;
  ctx.font = '600 25px "Manrope", system-ui, sans-serif';
  spaced(ctx, 'BRUT  ·  CÔTE DES BLANCS', cx, 836, 10);
  ctx.globalAlpha = orm ? 1 : 0.78;
  ctx.font = '500 16px "Manrope", system-ui, sans-serif';
  spaced(ctx, 'ÉLABORÉ PAR CLOS SÉRAPHIN À CHANTECRAIE, FRANCE  ·  75 CL  ·  12 % VOL.', cx, 926, 3.4);
  ctx.restore();
}

// Coiffe : or pâle, deux filets verts en bas, petit médaillon de face.
function foilTexture() {
  return canvasTexture(512, (ctx, size) => {
    const rnd = seeded(13);
    ctx.fillStyle = '#d6b877';
    ctx.fillRect(0, 0, size, size);
    for (let n = 0; n < 900; n++) {
      ctx.fillStyle = rnd() > 0.5 ? `rgba(255, 240, 200, ${rnd() * 0.1})` : `rgba(120, 90, 40, ${rnd() * 0.08})`;
      ctx.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 8 + rnd() * 40);
    }
    // bas de la coiffe (v = 0) : en bas du canvas
    ctx.fillStyle = '#16301f';
    ctx.fillRect(0, size * 0.905, size, size * 0.012);
    ctx.fillRect(0, size * 0.94, size, size * 0.03);
    // médaillon, à hauteur du col
    ctx.strokeStyle = '#16301f';
    ctx.lineWidth = 2.5;
    ctx.save();
    ctx.translate(size / 2, size * 0.44);
    ctx.scale(0.62, 1); // le col est étroit : on compense l'étirement
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, TURN);
    ctx.stroke();
    ctx.fillStyle = '#16301f';
    ctx.font = 'italic 400 42px "Bodoni", "Cormorant", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CS', -1, 3);
    ctx.restore();
  });
}

function crestTexture() {
  return canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = '#d9bd7c';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#16301f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.4, 0, TURN);
    ctx.stroke();
    ctx.fillStyle = '#16301f';
    ctx.font = `italic 400 ${size * 0.44}px "Bodoni", "Cormorant", Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CS', size / 2 - 2, size / 2 + 6);
  });
}

function corkTexture() {
  return canvasTexture(256, (ctx, size) => {
    const rnd = seeded(17);
    ctx.fillStyle = '#c8a271';
    ctx.fillRect(0, 0, size, size);
    for (let n = 0; n < 1400; n++) {
      const dark = rnd() > 0.45;
      ctx.fillStyle = dark ? `rgba(92, 60, 28, ${0.1 + rnd() * 0.3})` : `rgba(240, 214, 170, ${0.1 + rnd() * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(rnd() * size, rnd() * size, 1 + rnd() * 4, 0.6 + rnd() * 2, rnd() * 3, 0, TURN);
      ctx.fill();
    }
    // rondelles de liège collées au pied du bouchon (v = 0 en bas)
    ctx.fillStyle = 'rgba(80, 52, 24, 0.5)';
    ctx.fillRect(0, size * 0.8, size, 1.5);
    ctx.fillRect(0, size * 0.9, size, 1.5);
  });
}
