// Maison Aurèle — une montre trois aiguilles entièrement procédurale.
// Elle est construite à plat, axe vertical (cadran vers +Y, midi vers −Z, couronne vers +X),
// en couches indépendantes : glace, lunette, aiguilles, cadran, ponts, rouage, platine, masse
// oscillante, carrure, fond. Au chapitre du mouvement, chaque couche glisse le long de l'axe.
// Unité : le rayon du boîtier (1 = 19,5 mm).

import * as THREE from 'three';
import { Stage, span, track, clamp, lerp, smooth } from '../../assets/js/stage.js';
import { studioEnvironment, threePoint, backdrop, materials, Particles, canvasTexture, seeded } from '../../assets/js/kit.js';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const DIAL_R = 0.845;
const INK = '#efe6d2';

const stage = new Stage({ background: '#07090d', exposure: 1.02 });
if (stage.ok) init();

async function init() {
  const { renderer } = stage;
  await fontsReady();

  // ---------- lumière : studio de nuit, une boîte chaude pour l'or ----------
  stage.setEnvironment(
    studioEnvironment(renderer, {
      ambient: '#080a10',
      panels: [
        { size: [9, 9], color: '#e6eeff', intensity: 3.0, position: [0, 8, 2] },
        { size: [2.6, 7], color: '#ffe2b4', intensity: 9, position: [-7, 2.5, 3] },
        { size: [1.6, 8], color: '#a9c4ff', intensity: 6, position: [7, 2, -2.5] },
        { size: [10, 0.7], color: '#ffffff', intensity: 3.2, position: [0, 0.4, 8] },
        { size: [5, 2], color: '#6f8fd0', intensity: 2.2, position: [0, -6, -3] },
        { size: [14, 9], color: '#c9d4ea', intensity: 0.5, position: [0, 1, 11] },
      ],
    }),
    0.95
  );
  const lights = threePoint({
    key: { color: '#fff3e2', intensity: 2.5, position: [-3.5, 6, 5.5] },
    rim: { color: '#9dbcff', intensity: 2.4, position: [5.5, 3, -6] },
    fill: { color: '#dfe8ff', intensity: 0.45, position: [4, -1, 6] },
  });
  const lamp = new THREE.PointLight('#ffd49a', 0, 12, 1.5); // réchauffe le mouvement ouvert
  lamp.position.set(-2.4, 0.6, 3.2);
  stage.add(lights.group, lamp);
  stage.add(backdrop({ top: '#0a0e17', bottom: '#030405', glow: '#09111f', glowDirection: [0.35, 0.05, -1], glowSize: 0.42 }));

  const dust = new Particles({ count: 150, box: [10, 7, 6], center: [0, 0, -0.5], color: '#cfdcf5', size: 0.034, speed: [0.012, 0.022, 0], wobble: 0.22, twinkle: 0.55, opacity: 0.55 });
  stage.add(dust.points);

  // ---------- matières ----------
  const STEEL = new THREE.Color('#cdd0d6');
  const ROSE = new THREE.Color('#f4c9a8');
  const CHAMPAGNE = new THREE.Color('#e6c787');
  const brushing = brushedTexture();
  const polished = materials.steel({ roughness: 0.1 });
  const satin = materials.brushed({ roughness: 0.4, roughnessMap: brushing, bumpMap: brushing, bumpScale: 0.35 });
  const lugSteel = materials.steel({ roughness: 0.24 });
  const gilt = materials.gold({ color: CHAMPAGNE.clone(), roughness: 0.16, side: THREE.DoubleSide });
  const brass = materials.gold({ color: '#cfa856', roughness: 0.3 });
  const rhodium = materials.steel({ color: '#d4d6da', roughness: 0.24 });
  const blued = materials.steel({ color: '#2743b0', roughness: 0.2 });
  const ruby = new THREE.MeshPhysicalMaterial({ color: '#c0143f', emissive: '#3a0412', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04 });
  const dark = new THREE.MeshStandardMaterial({ color: '#0a0c10', roughness: 0.7 });

  // ---------- assemblage ----------
  const pose = new THREE.Group(); // orientation de la montre dans le plan de caméra
  pose.rotation.order = 'ZYX';
  const watch = new THREE.Group(); // tourne autour de son propre axe
  pose.add(watch);
  stage.add(pose);

  const layers = [];
  const layer = (lift, order) => {
    const group = new THREE.Group();
    group.userData = { lift, order };
    watch.add(group);
    layers.push(group);
    return group;
  };
  // lift : déplacement le long de l'axe quand la montre est ouverte ; order : 0 = part en premier
  const crystalL = layer(1.62, 0);
  const bezelL = layer(1.4, 0.15);
  const handsL = layer(1.02, 0.35);
  const dialL = layer(0.67, 0.55);
  const bridgesL = layer(0.02, 0.9);
  const trainL = layer(-0.33, 1);
  const plateL = layer(-0.65, 0.9);
  const rotorL = layer(-1.08, 0.6);
  const caseL = layer(-1.63, 0.3);
  const backL = layer(-2.13, 0);

  // ---------- glace saphir ----------
  const dome = [[0, 0.226], [0.874, 0.226], [0.874, 0.247]];
  for (let i = 1; i <= 12; i++) {
    const r = 0.874 * (1 - i / 12);
    dome.push([r, 0.247 + 0.046 * (1 - (r / 0.874) ** 2), 1]);
  }
  // reflets seuls, ajoutés à l'image : la glace ne voile pas le cadran
  const sapphire = materials.thinGlass({ color: '#000000', opacity: 1, blending: THREE.AdditiveBlending, specularColor: new THREE.Color('#b9ccff'), specularIntensity: 1, ior: 1.77, roughness: 0.03, clearcoat: 0 });
  const crystal = new THREE.Mesh(revolve(dome, 96), sapphire);
  crystal.renderOrder = 6;
  // chant de la glace et voile très léger : ils la rendent lisible une fois sortie de la lunette
  const crystalEdge = new THREE.Mesh(
    revolve([[0.874, 0.226], [0.874, 0.247], [0.852, 0.2493]], 96),
    new THREE.MeshStandardMaterial({ color: '#cfe1ff', roughness: 0.12, metalness: 0, transparent: true, opacity: 0.42, depthWrite: false })
  );
  crystalEdge.renderOrder = 7;
  const crystalVeil = new THREE.Mesh(revolve(dome.slice(2), 64), new THREE.MeshBasicMaterial({ color: '#8fb4ff', transparent: true, opacity: 0, depthWrite: false }));
  crystalVeil.renderOrder = 5;
  crystalL.add(crystal, crystalEdge, crystalVeil);

  // ---------- lunette et réhaut ----------
  bezelL.add(
    new THREE.Mesh(
      revolve([[0.976, 0.151], [0.976, 0.186, 1], [0.965, 0.221, 1], [0.94, 0.243, 1], [0.905, 0.251, 1], [0.875, 0.248], [0.868, 0.239], [0.848, 0.108], [0.872, 0.108], [0.872, 0.151]], 128, true),
      polished
    )
  );

  // ---------- carrure, cornes, couronne ----------
  caseL.add(
    new THREE.Mesh(
      revolve([[0.875, -0.215], [0.935, -0.215], [0.962, -0.196], [0.988, -0.11, 1], [1.0, -0.02, 1], [0.996, 0.07, 1], [0.977, 0.15], [0.875, 0.15]], 128, true),
      satin
    )
  );
  const lug = lugGeometry();
  const strapShape = strapGeometry();
  const leather = leatherMaterial();
  for (const side of [0, Math.PI]) {
    const pair = new THREE.Group();
    pair.rotation.y = side;
    for (const x of [-0.585, 0.585]) {
      const mesh = new THREE.Mesh(lug, lugSteel);
      mesh.position.x = x;
      mesh.scale.x = Math.sign(x); // la face extérieure, effilée, est du côté +X de la géométrie
      pair.add(mesh);
    }
    const strap = new THREE.Mesh(strapShape, leather);
    pair.add(strap);
    caseL.add(pair);
  }
  const crown = new THREE.Group();
  crown.position.set(0, -0.03, 0);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.08, 32), polished);
  stem.rotation.z = Math.PI / 2;
  stem.position.x = 1.0;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.094, 0.014, 40), polished);
  cap.rotation.z = -Math.PI / 2;
  cap.position.x = 1.176;
  crown.add(stem, new THREE.Mesh(crownGeometry(), polished), cap);
  caseL.add(crown);

  // ---------- fond saphir ----------
  backL.add(new THREE.Mesh(revolve([[0.6, -0.262], [0.905, -0.262], [0.936, -0.243], [0.936, -0.2165], [0.6, -0.2165]], 128, true), polished));
  const backGlass = new THREE.Mesh(new THREE.CircleGeometry(0.6, 64).rotateX(-Math.PI / 2), materials.thinGlass({ opacity: 0.12, side: THREE.DoubleSide }));
  backGlass.position.y = -0.25;
  backGlass.renderOrder = 5;
  backL.add(backGlass);

  // ---------- cadran ----------
  const dialBody = new THREE.Mesh(new THREE.CylinderGeometry(DIAL_R, DIAL_R, 0.02, 96), brass);
  dialBody.position.y = 0.09;
  const dialFace = new THREE.Mesh(
    new THREE.CircleGeometry(DIAL_R, 128).rotateX(-Math.PI / 2),
    new THREE.MeshPhysicalMaterial({
      map: dialTexture(),
      metalness: 0.92,
      roughness: 0.4,
      anisotropy: 0.85,
      anisotropyMap: sunburstMap(),
      clearcoat: 0.7,
      clearcoatRoughness: 0.08,
    })
  );
  dialFace.position.y = 0.1004;
  const print = new THREE.Mesh(
    new THREE.CircleGeometry(DIAL_R, 96).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: dialPrint(), transparent: true, depthWrite: false, roughness: 0.55, metalness: 0 })
  );
  print.position.y = 0.1012;
  print.renderOrder = 1;
  dialL.add(dialBody, dialFace, print);

  // index appliqués : douze heures, double bâton à midi
  const baton = new THREE.ExtrudeGeometry(rectShape(0.042, 0.19), { depth: 0.014, bevelEnabled: true, bevelThickness: 0.009, bevelSize: 0.009, bevelSegments: 1 }).rotateX(-Math.PI / 2).translate(0, 0.009, 0);
  const indices = new THREE.InstancedMesh(baton, gilt, 13);
  const dummy = new THREE.Object3D();
  let count = 0;
  for (let hour = 0; hour < 12; hour++) {
    const angle = hour * 30 * DEG;
    for (const offset of hour === 0 ? [-0.036, 0.036] : [0]) {
      dummy.position.set(Math.sin(angle) * 0.63 + Math.cos(angle) * offset, 0.1, -Math.cos(angle) * 0.63 + Math.sin(angle) * offset);
      dummy.rotation.set(0, -angle, 0);
      dummy.updateMatrix();
      indices.setMatrixAt(count++, dummy.matrix);
    }
  }
  dialL.add(indices);

  // ---------- aiguilles ----------
  const hourHand = handGroup(dauphine(0.47, 0.104, 0.1, 0.018), 0.052, 0.15, gilt);
  const minuteHand = handGroup(dauphine(0.71, 0.078, 0.11, 0.016), 0.042, 0.172, gilt);
  const secondHand = new THREE.Group();
  const needle = new THREE.Mesh(secondGeometry(), gilt);
  needle.position.y = 0.194;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.016, 24), polished);
  pin.position.y = 0.207;
  secondHand.add(needle, pin);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 16), polished);
  post.position.y = 0.15;
  handsL.add(hourHand, minuteHand, secondHand, post);

  // ombres portées des aiguilles sur le cadran (elles s'effacent quand les aiguilles se lèvent)
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#000208', transparent: true, opacity: 0.26, depthWrite: false });
  const shadows = [dauphine(0.47, 0.11, 0.1, 0), dauphine(0.71, 0.084, 0.11, 0), secondGeometry(1.5)].map((geometry, index) => {
    const mesh = new THREE.Mesh(geometry, shadowMaterial);
    mesh.position.set(0.008 + index * 0.004, 0.1024, 0.01 + index * 0.005);
    mesh.renderOrder = 2;
    dialL.add(mesh);
    return mesh;
  });

  // ---------- calibre AU-01 ----------
  // platine perlée
  const perlage = perlageTexture();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.83, 0.83, 0.05, 96), materials.steel({ color: '#d0d2d6', roughness: 0.34, map: perlage, bumpMap: perlage, bumpScale: 0.5 }));
  plate.position.y = -0.045;
  plateL.add(plate);

  // rouage : barillet → centre → moyenne → secondes → échappement, dentures engrenées
  const PITCH = 0.03;
  const radiusOf = (teeth) => (teeth * PITCH) / TAU;
  const train = [
    { teeth: 57, spokes: 0 }, // barillet
    { teeth: 42, spokes: 5, x: 0, y: 0, phase: 0, ratio: 1 }, // roue de centre, sur l'axe des aiguilles
    { teeth: 34, spokes: 5 }, // roue moyenne
    { teeth: 27, spokes: 4 }, // roue de secondes
    { teeth: 16, spokes: 3 }, // roue d'échappement
  ];
  // Pose `wheel` en prise avec `driver`, dans la direction `degrees` (plan : x vers 3 h, y vers 12 h),
  // et cale sa denture pour que les dents tombent dans les creux.
  const engage = (driver, wheel, degrees) => {
    const theta = degrees * DEG;
    const distance = radiusOf(driver.teeth) + radiusOf(wheel.teeth);
    wheel.x = driver.x + Math.cos(theta) * distance;
    wheel.y = driver.y + Math.sin(theta) * distance;
    wheel.ratio = -(driver.ratio * driver.teeth) / wheel.teeth;
    const a = ((theta - driver.phase) * driver.teeth) / TAU;
    wheel.phase = theta + Math.PI - ((0.5 - a) * TAU) / wheel.teeth;
  };
  engage(train[1], train[0], 150);
  engage(train[1], train[2], 20);
  engage(train[2], train[3], -75);
  engage(train[3], train[4], -130);
  const arbor = new THREE.CylinderGeometry(0.012, 0.012, 0.07, 10);
  train.forEach((wheel, index) => {
    const group = new THREE.Group();
    group.position.set(wheel.x, 0, -wheel.y);
    const gear = new THREE.Mesh(gearGeometry({ teeth: wheel.teeth, pitch: PITCH, spokes: wheel.spokes, thickness: 0.014 }), index === 0 ? rhodium : brass);
    gear.position.y = -0.012;
    group.add(gear);
    const r = radiusOf(wheel.teeth);
    if (index === 0) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.035, r - 0.035, 0.03, 64), materials.steel({ color: '#cfd1d5', roughness: 0.3, map: perlage }));
      drum.position.y = 0.017;
      group.add(drum);
    } else {
      const pinion = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(0.034, r * 0.4), Math.min(0.034, r * 0.4), 0.018, 12), polished);
      pinion.position.y = 0.011;
      group.add(pinion);
    }
    const axle = new THREE.Mesh(arbor, polished);
    axle.position.y = 0.012;
    group.add(axle);
    wheel.group = group;
    trainL.add(group);
  });

  // balancier et spiral
  const BALANCE = { x: -0.12, y: -0.5 };
  const balance = new THREE.Group();
  balance.position.set(BALANCE.x, 0, -BALANCE.y);
  const rim = new THREE.Mesh(revolve([[0.168, -0.01], [0.2, -0.01], [0.2, 0.014], [0.168, 0.014]], 64, true), brass);
  balance.add(rim);
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.012, 0.026), brass);
    arm.rotation.y = (i * TAU) / 3;
    arm.position.set(Math.cos((i * TAU) / 3) * 0.085, 0.002, -Math.sin((i * TAU) / 3) * 0.085);
    balance.add(arm);
  }
  for (let i = 0; i < 6; i++) {
    const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.014, 8), gilt);
    weight.rotation.z = Math.PI / 2;
    weight.rotation.y = (i * TAU) / 6 + 0.5;
    weight.position.set(Math.cos((i * TAU) / 6 + 0.5) * 0.205, 0.002, -Math.sin((i * TAU) / 6 + 0.5) * 0.205);
    balance.add(weight);
  }
  const balanceHub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16), polished);
  balanceHub.position.y = 0.006;
  balance.add(balanceHub);
  const hairspring = new THREE.Mesh(spiralGeometry(), blued);
  hairspring.position.set(BALANCE.x, 0.022, -BALANCE.y);
  const staff = new THREE.Mesh(arbor, polished);
  staff.position.set(BALANCE.x, 0.012, -BALANCE.y);
  trainL.add(balance, hairspring, staff);

  // ponts : un doigt par mobile, côtes de Genève, angles polis
  const stripes = stripesTexture();
  const bridgeMaterial = materials.steel({ color: '#d8dade', roughness: 0.3, map: stripes, bumpMap: stripes, bumpScale: 0.25 });
  const bridgeOptions = { depth: 0.016, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.006, bevelSegments: 2, curveSegments: 20 };
  const polar = (radius, degrees) => ({ x: Math.cos(degrees * DEG) * radius, y: Math.sin(degrees * DEG) * radius });
  const fingers = [
    { foot: polar(0.725, 76), tip: train[1], footRadius: 0.095, tipRadius: 0.062 },
    { foot: polar(0.725, 24), tip: train[2], footRadius: 0.085, tipRadius: 0.055 },
    { foot: polar(0.735, -12), tip: train[3], footRadius: 0.08, tipRadius: 0.05 },
    { foot: polar(0.735, -58), tip: train[4], footRadius: 0.075, tipRadius: 0.046 },
    { foot: polar(0.715, 219), tip: BALANCE, footRadius: 0.11, tipRadius: 0.062 },
  ];
  const screwSpots = [];
  const jewelSpots = [];
  for (const finger of fingers) {
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(capsuleShape(finger.foot, finger.tip, finger.footRadius, finger.tipRadius), bridgeOptions).rotateX(-Math.PI / 2), bridgeMaterial);
    mesh.position.y = 0.041;
    bridgesL.add(mesh);
    screwSpots.push(finger.foot);
    jewelSpots.push(finger.tip);
  }
  // pont de barillet : un large arc, surmonté du rochet
  const barrelBridge = new THREE.Shape();
  barrelBridge.absarc(0, 0, 0.79, 116 * DEG, 190 * DEG, false);
  barrelBridge.absarc(0, 0, 0.36, 190 * DEG, 116 * DEG, true);
  barrelBridge.closePath();
  const barrelMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(barrelBridge, bridgeOptions).rotateX(-Math.PI / 2), bridgeMaterial);
  barrelMesh.position.y = 0.041;
  bridgesL.add(barrelMesh);
  screwSpots.push(polar(0.72, 122), polar(0.72, 184), polar(0.43, 124));
  const ratchet = new THREE.Mesh(gearGeometry({ teeth: 30, pitch: 0.029, spokes: 0, thickness: 0.01, depth: 0.014 }), polished);
  ratchet.position.set(train[0].x, 0.062, -train[0].y);
  bridgesL.add(ratchet);
  screwSpots.push({ x: train[0].x, y: train[0].y, lift: 0.005 });

  // vis bleuies et rubis en chaton
  const screws = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.027, 0.03, 0.012, 20), blued, screwSpots.length);
  const slots = new THREE.InstancedMesh(new THREE.BoxGeometry(0.052, 0.004, 0.007), dark, screwSpots.length);
  const rnd = seeded(7);
  screwSpots.forEach((spot, index) => {
    dummy.position.set(spot.x, 0.068 + (spot.lift || 0), -spot.y);
    dummy.rotation.set(0, rnd() * Math.PI, 0);
    dummy.updateMatrix();
    screws.setMatrixAt(index, dummy.matrix);
    dummy.position.y += 0.0055;
    dummy.updateMatrix();
    slots.setMatrixAt(index, dummy.matrix);
  });
  const chatons = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.036, 0.036, 0.006, 24), gilt, jewelSpots.length);
  const jewels = new THREE.InstancedMesh(new THREE.SphereGeometry(0.024, 16, 10).scale(1, 0.4, 1), ruby, jewelSpots.length);
  jewelSpots.forEach((spot, index) => {
    dummy.position.set(spot.x, 0.064, -spot.y);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    chatons.setMatrixAt(index, dummy.matrix);
    dummy.position.y += 0.003;
    dummy.updateMatrix();
    jewels.setMatrixAt(index, dummy.matrix);
  });
  bridgesL.add(screws, slots, chatons, jewels);
  const engraving = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.7).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: bridgePrint(), transparent: true, depthWrite: false, metalness: 0.7, roughness: 0.35 })
  );
  engraving.position.y = 0.0632;
  engraving.renderOrder = 1;
  bridgesL.add(engraving);

  // masse oscillante en or
  const rotor = new THREE.Group();
  const rotorGold = materials.gold({ color: '#d2a95a', roughness: 0.24, map: stripes });
  const rotorRim = new THREE.Shape();
  rotorRim.absarc(0, 0, 0.795, Math.PI, TAU, false);
  rotorRim.absarc(0, 0, 0.63, TAU, Math.PI, true);
  rotorRim.closePath();
  const rimMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(rotorRim, { depth: 0.038, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 48 }).rotateX(-Math.PI / 2), rotorGold);
  rimMesh.position.y = -0.129;
  const web = new THREE.Shape();
  web.absarc(0, 0, 0.64, Math.PI, TAU, false);
  web.closePath();
  for (const [a0, a1] of [[196, 262], [278, 344]]) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.54, a0 * DEG, a1 * DEG, false);
    hole.absarc(0, 0, 0.24, a1 * DEG, a0 * DEG, true);
    hole.closePath();
    web.holes.push(hole);
  }
  const webMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(web, { depth: 0.014, bevelEnabled: false, curveSegments: 48 }).rotateX(-Math.PI / 2), rotorGold);
  webMesh.position.y = -0.104;
  const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.022, 40), rotorGold);
  rotorHub.position.y = -0.097;
  const bearing = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 32), polished);
  bearing.position.y = -0.097;
  const rotorPrint = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.7).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: rotorText(), transparent: true, depthWrite: false, metalness: 0.4, roughness: 0.5 })
  );
  rotorPrint.position.y = -0.0842;
  rotorPrint.renderOrder = 1;
  rotor.add(rimMesh, webMesh, rotorHub, bearing, rotorPrint);
  rotorL.add(rotor);

  // ---------- plans de caméra, un par chapitre ----------
  stage.setShots([
    { target: [0, 0, 0], radius: 7.6, azimuth: 0, elevation: 4, fov: 30, shift: [0.38, 0.0], portrait: { shift: [0, 0.36], radius: 10.6 } },
    { target: [0.1, -0.05, 0.1], radius: 5.8, azimuth: 0, elevation: 12, fov: 30, shift: [-0.4, -0.04], portrait: { shift: [0, 0.42], radius: 7.6 } },
    { target: [0, 0, 0], radius: 6, azimuth: -6, elevation: 2, fov: 30, shift: [0.38, -0.04], portrait: { shift: [0, 0.4], radius: 8.4 } },
    { target: [0, 0, 0], radius: 9.1, azimuth: 30, elevation: 21, fov: 30, shift: [-0.36, 0], portrait: { shift: [0, 0.38], radius: 13 } },
    { target: [0, 0, 0], radius: 9.4, azimuth: 0, elevation: 10, fov: 30, shift: [0, -0.46], portrait: { shift: [0, 0.3], radius: 10.6 } },
  ]);

  // orientation de la montre, une valeur par chapitre (radians)
  const TILT = [1.3, 0.5, 1.5, 0.24, 1.02]; // 0 = à plat, π/2 = face à la caméra
  const TURN = [-0.42, -0.72, -0.12, 0, 0.36];
  const ROLL = [-0.1, 0.02, 0, -0.16, 0.08];
  const ROLL_PORTRAIT = [-0.06, 0.02, 0, -0.08, 0.05];

  const started = new Date();
  let idle = 0;
  const metal = new THREE.Color();

  stage.onFrame(({ f, time, dt, reduced, height, portrait, pointer }) => {
    const clock = reduced ? 0 : time;

    pose.rotation.set(track(f, TILT), track(f, TURN), track(f, portrait ? ROLL_PORTRAIT : ROLL));
    pose.position.y = reduced ? 0 : Math.sin(time * 0.55) * 0.025;

    // ----- vue éclatée -----
    const open = span(f, 2.3, 2.95) * (1 - span(f, 3.15, 3.82));
    for (const group of layers) {
      const { lift, order } = group.userData;
      group.position.y = lift * smooth(clamp(open * 1.4 - order * 0.4));
    }
    // la pile tourne lentement sur elle-même, et avec le défilement
    idle = reduced ? 0 : wrap(idle + dt * 0.14 * open);
    watch.rotation.y = open * (idle + (f - 3) * 0.9);
    // les trois aiguilles se séparent à leur tour
    const fan = smooth(clamp(open * 1.6 - 0.6));
    minuteHand.position.y = fan * 0.09;
    secondHand.position.y = fan * 0.18;
    shadowMaterial.opacity = 0.26 * (1 - clamp(open * 6));
    crystalVeil.material.opacity = open * 0.07;
    crystalVeil.visible = open > 0.01;

    // ----- heure réelle, trotteuse continue -----
    const now = reduced ? started : new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    hourHand.rotation.y = -(hours / 12) * TAU;
    minuteHand.rotation.y = -(minutes / 60) * TAU;
    secondHand.rotation.y = -(seconds / 60) * TAU;
    shadows[0].rotation.y = hourHand.rotation.y;
    shadows[1].rotation.y = minuteHand.rotation.y;
    shadows[2].rotation.y = secondHand.rotation.y;

    // ----- le calibre vit : rouage, balancier à 4 Hz, masse oscillante -----
    const wind = clock * 0.34 + f * 0.9;
    for (const wheel of train) wheel.group.rotation.y = wheel.phase + wind * wheel.ratio;
    ratchet.rotation.y = -wind * 0.2;
    const swing = reduced ? 0.6 : Math.sin(clock * TAU * 4) * 1.25;
    balance.rotation.y = swing;
    hairspring.rotation.y = swing * 0.5;
    hairspring.scale.setScalar(1 - swing * 0.035);
    hairspring.scale.y = 1;
    rotor.rotation.y = 0.5 + f * 1.6 + (reduced ? 0 : Math.sin(clock * 0.7) * 0.7);

    // ----- acier → or rose au chapitre du boîtier, puis retour -----
    const rose = span(f, 0.42, 0.9) * (1 - span(f, 1.3, 1.85));
    metal.lerpColors(STEEL, ROSE, rose);
    polished.color.copy(metal);
    lugSteel.color.copy(metal);
    satin.color.copy(metal);
    gilt.color.lerpColors(CHAMPAGNE, ROSE, rose * 0.8);

    // ----- lumière : la clé tourne d'un chapitre à l'autre, le soleillage la suit -----
    const sweep = track(f, [-0.55, 0.65, -0.25, 0.5, -0.3]) + pointer.x * 0.3;
    lights.key.position.set(Math.sin(sweep) * 6.5, 6 + pointer.y, Math.cos(sweep) * 6.5);
    lights.key.intensity = track(f, [2.5, 3.4, 2.2, 2.6, 2.4]);
    lights.rim.intensity = track(f, [2.4, 3.2, 1.6, 2.8, 2.4]);
    lamp.intensity = open * 16;
    stage.scene.environmentIntensity = track(f, [0.95, 1.5, 1.0, 1.15, 0.95]);
    dust.material.uniforms.uOpacity.value = 0.4 + open * 0.3;
    dust.update(clock, height);
  });

  await stage.start();
}

// ---------- utilitaires ----------

const wrap = (angle) => ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

// Les textes du cadran sont dessinés avec les polices du site : on les attend, sans bloquer.
function fontsReady() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  const wanted = ['500 48px "Cormorant"', 'italic 400 32px "Cormorant"', '600 14px "Manrope"'];
  const loading = Promise.all(wanted.map((font) => document.fonts.load(font, 'Aurèle'))).catch(() => {});
  return Promise.race([loading, new Promise((resolve) => setTimeout(resolve, 2500))]);
}

// Solide de révolution autour de Y, arêtes vives par défaut. `points` : [rayon, hauteur, lisse?],
// parcourus dans le sens trigonométrique (rayon à droite, hauteur en haut) pour des normales sortantes.
function revolve(points, segments = 96, closed = false) {
  const pts = closed ? [...points, points[0]] : points;
  const count = pts.length - 1;
  const normals2 = [];
  const lengths = [0];
  for (let k = 0; k < count; k++) {
    const dr = pts[k + 1][0] - pts[k][0];
    const dy = pts[k + 1][1] - pts[k][1];
    const length = Math.hypot(dr, dy) || 1e-6;
    normals2.push([dy / length, -dr / length]);
    lengths.push(lengths[k] + length);
  }
  const total = lengths[count];
  const normalAt = (k, end) => {
    if (!pts[k + end][2]) return normals2[k];
    let other = end ? k + 1 : k - 1;
    if (other < 0) other = closed ? count - 1 : k;
    if (other >= count) other = closed ? 0 : k;
    const x = normals2[k][0] + normals2[other][0];
    const y = normals2[k][1] + normals2[other][1];
    const length = Math.hypot(x, y) || 1;
    return [x / length, y / length];
  };
  const positions = [], normals = [], uvs = [], indices = [];
  const row = segments + 1;
  for (let k = 0; k < count; k++) {
    for (let end = 0; end < 2; end++) {
      const [r, y] = pts[k + end];
      const [nr, ny] = normalAt(k, end);
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * TAU;
        const c = Math.cos(angle), s = Math.sin(angle);
        positions.push(r * c, y, r * s);
        normals.push(nr * c, ny, nr * s);
        uvs.push(j / segments, lengths[k + end] / total);
      }
    }
    const base = k * 2 * row;
    for (let j = 0; j < segments; j++) {
      const a = base + j, b = a + 1, c = a + row, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

function rectShape(width, length) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -length / 2);
  shape.lineTo(width / 2, -length / 2);
  shape.lineTo(width / 2, length / 2);
  shape.lineTo(-width / 2, length / 2);
  shape.closePath();
  return shape;
}

// Corne : profil dessiné de côté (z vers l'extérieur, y vers le haut), extrudé dans l'épaisseur.
function lugGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0.72, 0.132);
  shape.lineTo(0.96, 0.124);
  shape.quadraticCurveTo(1.2, 0.09, 1.33, -0.12);
  shape.quadraticCurveTo(1.37, -0.2, 1.31, -0.232);
  shape.quadraticCurveTo(1.05, -0.212, 0.72, -0.212);
  shape.closePath();
  const thickness = 0.15, bevel = 0.014;
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 16 })
    .translate(0, 0, -(thickness - bevel * 2) / 2)
    .rotateY(-Math.PI / 2);
  // la corne s'affine vers sa pointe : large à la carrure, la face intérieure reste droite
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const factor = lerp(1.32, 0.74, smooth(clamp((position.getZ(i) - 0.8) / 0.52)));
    position.setX(i, -thickness / 2 + (position.getX(i) + thickness / 2) * factor);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// Couronne cannelée, axe le long de X.
function crownGeometry() {
  const flutes = 26, steps = flutes * 8;
  const shape = new THREE.Shape();
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * TAU;
    const radius = 0.1 + 0.014 * Math.pow(0.5 + 0.5 * Math.cos(angle * flutes), 0.55);
    if (i === 0) shape.moveTo(radius, 0);
    else shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  return new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.01, bevelSegments: 2, curveSegments: 4 })
    .rotateY(Math.PI / 2)
    .translate(1.055, 0, 0);
}

// Amorce de bracelet : section rembordée balayée le long d'une courbe qui plonge vers l'arrière.
function strapGeometry() {
  const curve = new THREE.CatmullRomCurve3(
    [[0.985, -0.118], [1.2, -0.124], [1.5, -0.2], [1.85, -0.42], [2.15, -0.8], [2.35, -1.3], [2.42, -1.85], [2.36, -2.4]].map(([z, y]) => new THREE.Vector3(0, y, z)),
    false,
    'centripetal'
  );
  const N = 60, M = 36;
  const positions = [], uvs = [], colors = [], indices = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const p = curve.getPointAt(s);
    const t = curve.getTangentAt(s);
    const ny = t.z, nz = -t.y;
    const width = lerp(1.0, 0.86, smooth(s));
    const thickness = lerp(0.15, 0.085, clamp(s * 1.5));
    const shade = 1 - smooth(clamp((s - 0.4) / 0.6)) * 0.7;
    const alpha = 1 - smooth(clamp((s - 0.52) / 0.44));
    for (let j = 0; j < M; j++) {
      const angle = (j / M) * TAU;
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const sx = Math.sign(ca) * Math.pow(Math.abs(ca), 0.24) * (width / 2);
      const sn = Math.sign(sa) * Math.pow(Math.abs(sa), 0.8) * (thickness / 2);
      positions.push(sx, p.y + ny * sn, p.z + nz * sn);
      uvs.push(sx / width + 0.5, s);
      colors.push(shade, shade, shade, alpha);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      const a = i * M + j, b = i * M + ((j + 1) % M), c = a + M, d = b + M;
      indices.push(a, b, c, b, d, c);
    }
  }
  // bout coupé net
  const end = curve.getPointAt(1);
  positions.push(0, end.y, end.z);
  uvs.push(0.5, 1);
  colors.push(0, 0, 0, 0);
  const center = (N + 1) * M;
  for (let j = 0; j < M; j++) indices.push(center, N * M + ((j + 1) % M), N * M + j);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Aiguille dauphine : losange à deux pans, pointe vers midi (−Z).
function dauphine(length, width, tail, height) {
  const w = width / 2, wide = length * 0.13;
  const A = [0, 0, tail], R = [w, 0, -wide], T = [0, 0, -length], L = [-w, 0, -wide], C = [0, height, -wide];
  const triangles = [R, T, C, A, R, C, T, L, C, L, A, C];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(triangles.flat(), 3));
  geometry.computeVertexNormals();
  return geometry;
}

function handGroup(geometry, hubRadius, y, material) {
  const group = new THREE.Group();
  const blade = new THREE.Mesh(geometry, material);
  blade.position.y = y;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(hubRadius, hubRadius, 0.014, 28), material);
  hub.position.y = y + 0.006;
  group.add(blade, hub);
  return group;
}

// Trotteuse : fine lame effilée et contrepoids rond.
function secondGeometry(fat = 1) {
  const blade = new THREE.Shape();
  blade.moveTo(-0.008 * fat, -0.2);
  blade.lineTo(0.008 * fat, -0.2);
  blade.lineTo(0.0035 * fat, 0.79);
  blade.lineTo(-0.0035 * fat, 0.79);
  blade.closePath();
  const weight = new THREE.Shape();
  weight.absarc(0, -0.2, 0.03, 0, TAU, false);
  const hub = new THREE.Shape();
  hub.absarc(0, 0, 0.032, 0, TAU, false);
  return new THREE.ExtrudeGeometry([blade, weight, hub], { depth: 0.005, bevelEnabled: false, curveSegments: 20 }).rotateX(-Math.PI / 2);
}

// Roue dentée : dents trapézoïdales au pas `pitch`, serge et rayons évidés.
function gearGeometry({ teeth, pitch, spokes = 5, thickness = 0.014, depth = 0.02 }) {
  const radius = (teeth * pitch) / TAU;
  const root = radius - depth * 0.55, tip = radius + depth * 0.45;
  const step = TAU / teeth;
  const shape = new THREE.Shape();
  for (let k = 0; k < teeth; k++) {
    const a = k * step;
    const corners = [[-0.32, root], [-0.15, tip], [0.15, tip], [0.32, root]];
    corners.forEach(([offset, r], index) => {
      const x = Math.cos(a + offset * step) * r, y = Math.sin(a + offset * step) * r;
      if (k === 0 && index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  if (spokes) {
    const inner = Math.max(0.03, radius * 0.24), outer = root - Math.max(0.014, radius * 0.13);
    const half = Math.max(0.008, radius * 0.07); // demi-largeur d'un rayon
    for (let s = 0; s < spokes; s++) {
      const a0 = (s / spokes) * TAU, a1 = ((s + 1) / spokes) * TAU;
      const di = Math.asin(half / inner), dout = Math.asin(half / outer);
      const hole = new THREE.Path();
      hole.absarc(0, 0, outer, a0 + dout, a1 - dout, false);
      hole.absarc(0, 0, inner, a1 - di, a0 + di, true);
      hole.closePath();
      shape.holes.push(hole);
    }
  }
  return new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 10 }).rotateX(-Math.PI / 2);
}

// Pont en doigt : enveloppe de deux cercles (pied vissé, bout empierré).
function capsuleShape(foot, tip, footRadius, tipRadius) {
  const distance = Math.hypot(tip.x - foot.x, tip.y - foot.y);
  const direction = Math.atan2(tip.y - foot.y, tip.x - foot.x);
  const phi = Math.acos((footRadius - tipRadius) / distance);
  const shape = new THREE.Shape();
  shape.absarc(foot.x, foot.y, footRadius, direction + phi, direction + TAU - phi, false);
  shape.absarc(tip.x, tip.y, tipRadius, direction - phi, direction + phi, false);
  shape.closePath();
  return shape;
}

function spiralGeometry() {
  const points = [];
  const turns = 7.5;
  for (let i = 0; i <= 300; i++) {
    const t = i / 300;
    const angle = t * turns * TAU;
    const radius = 0.024 + t * 0.105;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 420, 0.0026, 4, false);
}

// ---------- textures dessinées ----------

// Satinage : fines stries le long de la circonférence (rugosité et léger relief).
function brushedTexture() {
  const texture = canvasTexture(512, (ctx, size) => {
    const rnd = seeded(3);
    ctx.fillStyle = '#b8b8b8';
    ctx.fillRect(0, 0, size, size);
    for (let n = 0; n < 2400; n++) {
      const tone = rnd() < 0.5 ? 255 : 40;
      ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${0.04 + rnd() * 0.12})`;
      ctx.fillRect(rnd() * size, rnd() * size, 60 + rnd() * 300, 1);
    }
  }, { srgb: false, repeat: true });
  texture.repeat.set(3, 1);
  return texture;
}

// Direction du brossage soleil pour le reflet anisotrope : tangentielle autour du centre.
function sunburstMap(size = 256) {
  return canvasTexture(size, (ctx) => {
    const image = ctx.createImageData(size, size);
    const rnd = seeded(21);
    const rays = Array.from({ length: 360 }, () => 0.72 + rnd() * 0.28);
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const u = (i + 0.5) / size - 0.5, v = 0.5 - (j + 0.5) / size;
        const length = Math.hypot(u, v) || 1;
        const o = (j * size + i) * 4;
        const ray = rays[Math.floor(((Math.atan2(v, u) / TAU + 1) % 1) * 360)];
        image.data[o] = 127.5 - (v / length) * 127.5;
        image.data[o + 1] = 127.5 + (u / length) * 127.5;
        image.data[o + 2] = 255 * ray;
        image.data[o + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, { srgb: false });
}

// Fond du cadran : bleu nuit, rayons du brossage, bord plus sombre.
function dialTexture() {
  return canvasTexture(1024, (ctx, size) => {
    const c = size / 2;
    ctx.fillStyle = '#1b3566';
    ctx.fillRect(0, 0, size, size);
    const rnd = seeded(17);
    ctx.lineWidth = 1.4;
    for (let n = 0; n < 2600; n++) {
      const angle = rnd() * TAU;
      const light = rnd() < 0.5;
      ctx.strokeStyle = light ? `rgba(150, 185, 255, ${0.03 + rnd() * 0.06})` : `rgba(0, 4, 14, ${0.05 + rnd() * 0.1})`;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(angle) * 8, c + Math.sin(angle) * 8);
      ctx.lineTo(c + Math.cos(angle) * c, c + Math.sin(angle) * c);
      ctx.stroke();
    }
    const edge = ctx.createRadialGradient(c, c, c * 0.25, c, c, c);
    edge.addColorStop(0, 'rgba(2, 5, 14, 0)');
    edge.addColorStop(0.75, 'rgba(2, 5, 14, 0.28)');
    edge.addColorStop(1, 'rgba(2, 5, 14, 0.72)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, size, size);
  });
}

function spaced(ctx, text, x, y, spacing) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cursor = x - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((ch, index) => {
    ctx.fillText(ch, cursor, y);
    cursor += widths[index] + spacing;
  });
}

// Texte le long d'un cercle. `center` : angle d'horloge en degrés (0 = midi, sens horaire).
function arcText(ctx, text, cx, cy, radius, center, spacing, bottom = false) {
  const chars = [...text];
  const total = (chars.length - 1) * spacing;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  chars.forEach((ch, index) => {
    const angle = (center + (bottom ? 1 : -1) * (total / 2 - index * spacing)) * DEG;
    ctx.save();
    ctx.translate(cx + radius * Math.sin(angle), cy - radius * Math.cos(angle));
    ctx.rotate(angle + (bottom ? Math.PI : 0));
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}

// Décalque du cadran : minuterie chemin de fer, signature, ombre de contact des index.
function dialPrint() {
  return canvasTexture(1024, (ctx, size) => {
    const c = size / 2;
    const unit = c / DIAL_R; // pixels par unité de scène
    // ombre de contact sous les index
    ctx.save();
    ctx.shadowColor = 'rgba(0, 2, 8, 0.75)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(0, 2, 8, 0.4)';
    for (let hour = 0; hour < 12; hour++) {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(hour * 30 * DEG);
      for (const offset of hour === 0 ? [-0.036, 0.036] : [0]) ctx.fillRect((offset - 0.025) * unit, -0.73 * unit, 0.05 * unit, 0.2 * unit);
      ctx.restore();
    }
    ctx.restore();
    // chemin de fer
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    const inner = 0.768 * unit, outer = 0.812 * unit;
    ctx.lineWidth = 1.6;
    for (const radius of [inner, outer]) {
      ctx.beginPath();
      ctx.arc(c, c, radius, 0, TAU);
      ctx.stroke();
    }
    for (let minute = 0; minute < 60; minute++) {
      const angle = minute * 6 * DEG;
      const major = minute % 5 === 0;
      ctx.lineWidth = major ? 4.2 : 1.6;
      ctx.beginPath();
      ctx.moveTo(c + Math.sin(angle) * inner, c - Math.cos(angle) * inner);
      ctx.lineTo(c + Math.sin(angle) * outer, c - Math.cos(angle) * outer);
      ctx.stroke();
    }
    // signature
    ctx.textBaseline = 'alphabetic';
    ctx.font = '500 50px "Cormorant", Georgia, serif';
    spaced(ctx, 'AURÈLE', c, c - 0.27 * unit, 11);
    ctx.font = '600 11.5px "Manrope", system-ui, sans-serif';
    spaced(ctx, 'MANUFACTURE · JURA', c, c - 0.215 * unit, 4.2);
    ctx.font = 'italic 400 33px "Cormorant", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Automatique', c, c + 0.3 * unit);
    ctx.font = '600 11.5px "Manrope", system-ui, sans-serif';
    spaced(ctx, 'CALIBRE AU-01 · 72 HEURES', c, c + 0.355 * unit, 3.6);
  });
}

// Gravures dorées sur le pont de barillet.
function bridgePrint() {
  return canvasTexture(1024, (ctx, size) => {
    const c = size / 2, unit = size / 1.7;
    ctx.fillStyle = '#b08a3c';
    ctx.font = '500 30px "Cormorant", Georgia, serif';
    arcText(ctx, 'MAISON AURÈLE', c, c, 0.7 * unit, -63, 4.1);
    ctx.font = '600 13px "Manrope", system-ui, sans-serif';
    arcText(ctx, 'AU-01 · VINGT-HUIT RUBIS', c, c, 0.645 * unit, -63, 2.35);
  });
}

// Gravure de la masse oscillante, lisible montre posée côté fond.
function rotorText() {
  return canvasTexture(1024, (ctx, size) => {
    const c = size / 2, unit = size / 1.7;
    ctx.fillStyle = 'rgba(58, 38, 8, 0.9)';
    ctx.font = '500 34px "Cormorant", Georgia, serif';
    arcText(ctx, 'MAISON AURÈLE · CALIBRE AU-01 · OR 22 CARATS', c, c, 0.712 * unit, 180, 3.25, true);
  });
}

// Perlage : petits cercles qui se chevauchent (motif répétable).
function perlageTexture() {
  const texture = canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = '#bdbdbd';
    ctx.fillRect(0, 0, size, size);
    const cell = size / 4, radius = cell * 0.72;
    for (let row = -1; row <= 8; row++) {
      for (let col = -1; col <= 5; col++) {
        const x = col * cell + (row % 2 ? cell / 2 : 0), y = row * cell * 0.5;
        const spot = ctx.createRadialGradient(x, y, 0, x, y, radius);
        spot.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        spot.addColorStop(0.55, 'rgba(205, 205, 205, 0.9)');
        spot.addColorStop(0.9, 'rgba(120, 120, 120, 0.95)');
        spot.addColorStop(1, 'rgba(235, 235, 235, 1)');
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
      }
    }
  }, { repeat: true });
  texture.repeat.set(7, 7);
  return texture;
}

// Côtes de Genève : larges bandes ondulées, en biais.
function stripesTexture() {
  const texture = canvasTexture(256, (ctx, size) => {
    const bands = 2, width = size / bands;
    for (let b = 0; b < bands; b++) {
      const gradient = ctx.createLinearGradient(b * width, 0, (b + 1) * width, 0);
      gradient.addColorStop(0, '#8f8f8f');
      gradient.addColorStop(0.12, '#f4f4f4');
      gradient.addColorStop(0.6, '#cfcfcf');
      gradient.addColorStop(1, '#a4a4a4');
      ctx.fillStyle = gradient;
      ctx.fillRect(b * width, 0, width, size);
    }
    const rnd = seeded(13);
    for (let n = 0; n < 500; n++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${rnd() * 0.08})`;
      ctx.fillRect(rnd() * size, 0, 1, size);
    }
  }, { repeat: true });
  texture.repeat.set(3.4, 3.4);
  texture.rotation = 0.6;
  return texture;
}

// Cuir bleu marine : grain, coutures ivoire le long des bords, extrémité qui se fond dans la nuit.
function leatherMaterial() {
  const stitches = (ctx, size, color, widthPx) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = widthPx;
    ctx.lineCap = 'round';
    for (const u of [0.085, 0.915]) {
      for (let v = 0.035; v < 1; v += 0.031) {
        ctx.beginPath();
        ctx.moveTo(u * size, (1 - v) * size);
        ctx.lineTo(u * size + (u < 0.5 ? 1.5 : -1.5), (1 - v - 0.017) * size);
        ctx.stroke();
      }
    }
  };
  const color = canvasTexture(512, (ctx, size) => {
    const rnd = seeded(4);
    ctx.fillStyle = '#0d1524';
    ctx.fillRect(0, 0, size, size);
    for (let n = 0; n < 5200; n++) {
      const light = rnd() < 0.45;
      ctx.fillStyle = light ? `rgba(90, 120, 180, ${0.03 + rnd() * 0.05})` : `rgba(0, 2, 10, ${0.08 + rnd() * 0.16})`;
      ctx.beginPath();
      ctx.ellipse(rnd() * size, rnd() * size, 1 + rnd() * 3.5, 1 + rnd() * 2, rnd() * 3, 0, TAU);
      ctx.fill();
    }
    stitches(ctx, size, '#d8ccb2', 4.5);
  });
  const bump = canvasTexture(512, (ctx, size) => {
    const rnd = seeded(8);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    for (let n = 0; n < 4200; n++) {
      const tone = rnd() < 0.5 ? 20 : 235;
      ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${0.1 + rnd() * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(rnd() * size, rnd() * size, 1 + rnd() * 4, 1 + rnd() * 2.5, rnd() * 3, 0, TAU);
      ctx.fill();
    }
    stitches(ctx, size, '#ffffff', 5);
  }, { srgb: false });
  return new THREE.MeshStandardMaterial({ map: color, bumpMap: bump, bumpScale: 0.6, roughness: 0.66, metalness: 0, vertexColors: true, transparent: true });
}
