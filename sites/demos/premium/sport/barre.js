// FORGE — calculateur de barre.
// 1) Le calcul (max × pourcentage → charge par côté → disques) vit dans la page et marche sans WebGL.
// 2) La scène 3D montre la barre olympique sur ses supports : les disques glissent sur les manchons
//    dans l'ordre où on les monte, puis le collier se referme. On tourne autour au doigt.

import * as THREE from 'three';
import { studioEnvironment, softDisc, canvasTexture, Particles } from '../../assets/premium/kit.js';

const BAR_KG = 20;
const STEP = 2.5; // plus petit disque
const PLATES = [
  { kg: 25, label: '25', color: '#d6202b', ink: '#ffffff', radius: 0.225, width: 0.058, w: 44, h: 120 },
  { kg: 20, label: '20', color: '#1d5fd6', ink: '#ffffff', radius: 0.225, width: 0.05, w: 40, h: 120 },
  { kg: 15, label: '15', color: '#f4c20d', ink: '#0a0a0a', radius: 0.225, width: 0.041, w: 36, h: 120 },
  { kg: 10, label: '10', color: '#1c9a48', ink: '#ffffff', radius: 0.225, width: 0.031, w: 32, h: 120 },
  { kg: 5, label: '5', color: '#ecebe6', ink: '#0a0a0a', radius: 0.115, width: 0.024, w: 30, h: 72 },
  { kg: 2.5, label: '2,5', color: '#2b2b2e', ink: '#ffffff', radius: 0.095, width: 0.019, w: 30, h: 58 },
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const fr = (value, digits = 1) => value.toLocaleString('fr-FR', { maximumFractionDigits: digits });
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Règle : (cible − 20 kg de barre) ÷ 2, arrondi aux 2,5 kg inférieurs par côté, puis disques du plus lourd au plus léger.
function loadFor(target) {
  const units = Math.max(0, Math.floor((target - BAR_KG) / 2 / STEP + 1e-9));
  const perSide = units * STEP;
  const plates = [];
  let rest = perSide;
  for (const plate of PLATES) {
    while (rest >= plate.kg - 1e-9) {
      plates.push(plate);
      rest -= plate.kg;
    }
  }
  return { perSide, total: BAR_KG + perSide * 2, plates };
}

const root = document.querySelector('[data-calc]');
const watchers = [];
let current = loadFor(80);

if (root) {
  initInterface();
  const canvas = root.querySelector('[data-bar]');
  if (canvas) {
    start(canvas).catch((error) => {
      console.error('[forge] 3D indisponible', error);
      root.classList.add('no-3d');
    });
  }
}

// ---------- interface : max, séance, pourcentage → charge ----------
function initInterface() {
  const $ = (selector) => root.querySelector(selector);
  const rmInput = $('[data-rm]');
  const pctInput = $('input[data-pct]');
  const sessions = [...root.querySelectorAll('[data-session]')];
  const state = { rm: 100, pct: 80, sets: 5, reps: 5 };

  function refresh() {
    const target = (state.rm * state.pct) / 100;
    current = loadFor(target);
    const { perSide, total, plates } = current;
    $('[data-load]').textContent = fr(total);
    $('[data-total]').textContent = fr(total);
    $('[data-side]').textContent = `${fr(perSide)} kg`;
    $('[data-side-tag]').textContent = `${fr(perSide)} kg`;
    $('[data-pct-out]').textContent = `${fr(state.pct)} %`;
    $('[data-formula]').textContent = `20 (barre) + 2 × ${fr(perSide)} = ${fr(total)} kg`;

    const list = $('[data-plates]');
    list.replaceChildren();
    if (!plates.length) {
      const empty = document.createElement('li');
      empty.className = 'plates__empty';
      empty.textContent = 'Barre à vide';
      list.append(empty);
    }
    for (const plate of plates) {
      const item = document.createElement('li');
      item.textContent = plate.label;
      item.setAttribute('aria-label', `${plate.label} kilos`);
      item.style.cssText = `--w:${plate.w}px;--h:${plate.h}px;--c:${plate.color};--k:${plate.ink}`;
      list.append(item);
    }

    const gap = target - total;
    let note;
    if (target < BAR_KG) note = `Cible : ${fr(target)} kg. La barre seule en pèse 20 : travaille à vide, ou demande la barre technique de 10 kg.`;
    else if (gap > 0.01) note = `Cible exacte : ${fr(target, 2)} kg → on charge ${fr(total)} kg (${fr(gap, 2)} kg de moins, jamais au-dessus).`;
    else note = `Cible exacte : ${fr(target)} kg, ça tombe juste.`;
    $('[data-note]').textContent = note;

    $('[data-volume]').textContent = state.sets
      ? `${state.sets} série${state.sets > 1 ? 's' : ''} × ${state.reps} rép. × ${fr(total)} kg = ${fr(state.sets * state.reps * total)} kg soulevés`
      : '';
    const detail = plates.length ? plates.map((p) => p.label).join(' + ') : 'aucun disque';
    $('[data-spoken]').textContent = `Barre chargée à ${fr(total)} kilos. Par côté : ${fr(perSide)} kilos, soit ${detail}.`;
    for (const watch of watchers) watch(current);
  }

  function setRm(value, write) {
    if (!Number.isFinite(value)) return;
    state.rm = clamp(Math.round(value * 2) / 2, 20, 300);
    if (write) rmInput.value = String(state.rm);
    refresh();
  }
  rmInput.addEventListener('input', () => setRm(parseFloat(rmInput.value.replace(',', '.')), false));
  rmInput.addEventListener('change', () => { rmInput.value = String(state.rm); });
  for (const button of root.querySelectorAll('[data-rm-step]')) {
    button.addEventListener('click', () => setRm(state.rm + Number(button.dataset.rmStep), true));
  }

  function setPct(pct, session) {
    state.pct = pct;
    state.sets = session ? Number(session.dataset.sets) : 0;
    state.reps = session ? Number(session.dataset.reps) : 0;
    sessions.forEach((item) => item.setAttribute('aria-pressed', String(item === session)));
    pctInput.value = String(pct);
    refresh();
  }
  sessions.forEach((button) => button.addEventListener('click', () => setPct(Number(button.dataset.pct), button)));
  pctInput.addEventListener('input', () => setPct(Number(pctInput.value), null));

  // estimation du max (Epley)
  const estKg = $('[data-est-kg]'), estReps = $('[data-est-reps]'), estOut = $('[data-est-out]');
  const estimate = () => {
    const kg = parseFloat(estKg.value), reps = clamp(Math.round(parseFloat(estReps.value)), 1, 12);
    if (!Number.isFinite(kg) || !Number.isFinite(reps)) return NaN;
    return reps === 1 ? kg : kg * (1 + reps / 30);
  };
  const showEstimate = () => {
    const value = estimate();
    estOut.textContent = Number.isFinite(value) ? `Max estimé : ${fr(Math.round(value * 2) / 2)} kg` : 'Indique une charge et un nombre de répétitions.';
  };
  estKg.addEventListener('input', showEstimate);
  estReps.addEventListener('input', showEstimate);
  $('[data-est-use]').addEventListener('click', () => {
    const value = estimate();
    if (Number.isFinite(value)) setRm(value, true);
  });

  showEstimate();
  refresh();
}

// ---------- géométrie : solides de révolution autour de l'axe de la barre (x), arêtes vives ----------
// points : [[axe, rayon], …] parcourus dans le sens horaire (la matière à droite du trajet).
function revolve(points, segments = 48) {
  const positions = [], normals = [], uvs = [], indices = [];
  for (let s = 0; s < points.length - 1; s++) {
    const [a0, r0] = points[s], [a1, r1] = points[s + 1];
    const da = a1 - a0, dr = r1 - r0, length = Math.hypot(da, dr);
    if (length < 1e-7) continue;
    const na = -dr / length, nr = da / length;
    const base = positions.length / 3;
    for (let j = 0; j <= segments; j++) {
      const angle = (j / segments) * Math.PI * 2, c = Math.cos(angle), sn = Math.sin(angle);
      positions.push(a0, r0 * c, r0 * sn, a1, r1 * c, r1 * sn);
      normals.push(na, nr * c, nr * sn, na, nr * c, nr * sn);
      uvs.push(j / segments, a0, j / segments, a1);
      if (j < segments) {
        const a = base + j * 2, b = a + 1, c2 = a + 2, d = a + 3;
        indices.push(a, c2, b, b, c2, d);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

// Texte posé sur un cercle (0 = en haut), pour les marquages des disques.
function arcText(ctx, text, cx, cy, radius, angle, size) {
  ctx.font = `900 ${size}px "Big Shoulders", Impact, "Arial Narrow", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const widths = [...text].map((ch) => ctx.measureText(ch).width + size * 0.05);
  const total = widths.reduce((a, b) => a + b, 0);
  let at = angle - total / radius / 2;
  [...text].forEach((ch, i) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(at + widths[i] / radius / 2);
    ctx.fillText(ch, 0, -radius);
    ctx.restore();
    at += widths[i] / radius;
  });
}

const HOLE = 0.0256;

function plateParts(spec) {
  const big = spec.radius > 0.2;
  const R = spec.radius, h = spec.width / 2;
  const hubR = big ? 0.082 : 0.04, hubH = h * 0.94, webH = h * (big ? 0.6 : 0.7);
  const lip = big ? 0.036 : 0.016, slope = big ? 0.009 : 0.005, bevel = Math.min(0.005, h * 0.4);
  const inner = big ? hubR - 0.003 : HOLE;
  const body = revolve([
    [-hubH, inner], [-hubH, hubR], [-webH, hubR + slope], [-webH, R - lip - slope], [-h, R - lip], [-h, R - bevel], [-h + bevel, R],
    [h - bevel, R], [h, R - bevel], [h, R - lip], [webH, R - lip - slope], [webH, hubR + slope], [hubH, hubR], [hubH, inner], [-hubH, inner],
  ], 56);
  const hub = big ? revolve([[-hubH - 0.0015, HOLE], [-hubH - 0.0015, hubR - 0.002], [hubH + 0.0015, hubR - 0.002], [hubH + 0.0015, HOLE], [-hubH - 0.0015, HOLE]], 40) : null;
  const ringIn = hubR + slope + 0.002, ringOut = R - lip - slope - 0.002;
  const mark = canvasTexture(512, (ctx, size) => {
    const c = size / 2, scale = c / ringOut, mid = ((ringIn + ringOut) / 2) * scale, band = (ringOut - ringIn) * scale;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = spec.ink;
    const text = `${spec.label} KG`;
    arcText(ctx, text, c, c, mid, 0, band * (big ? 0.62 : 0.8));
    arcText(ctx, text, c, c, mid, Math.PI, band * (big ? 0.62 : 0.8));
    if (big) {
      arcText(ctx, 'FORGE', c, c, mid, Math.PI / 2, band * 0.36);
      arcText(ctx, 'FORGE', c, c, mid, -Math.PI / 2, band * 0.36);
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = 3;
      for (const r of [ringIn * scale + 6, ringOut * scale - 6]) {
        ctx.beginPath();
        ctx.arc(c, c, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });
  const ring = new THREE.RingGeometry(ringIn, ringOut, 48);
  return {
    body, hub, ring, webH,
    rubber: new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.62, metalness: 0.02 }),
    markMaterial: new THREE.MeshStandardMaterial({ map: mark, transparent: true, depthWrite: false, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }),
  };
}

async function start(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  try {
    await Promise.race([document.fonts.load('900 64px "Big Shoulders"'), new Promise((done) => setTimeout(done, 1500))]);
  } catch { /* la police de secours fera l'affaire */ }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.05, 40);
  scene.environment = studioEnvironment(renderer, {
    ambient: '#070806',
    panels: [
      { size: [9, 5], color: '#ffffff', intensity: 4.2, position: [0, 7, 2] },
      { size: [3, 6], color: '#c6f432', intensity: 7, position: [-6, 2.5, -4] },
      { size: [2, 6], color: '#eaffb0', intensity: 4, position: [7, 2, -2] },
      { size: [10, 0.8], color: '#ffffff', intensity: 3, position: [0, 0.8, 7] },
    ],
  });
  const key = new THREE.DirectionalLight('#ffffff', 2.4);
  key.position.set(2, 5, 6);
  const rim = new THREE.DirectionalLight('#c6f432', 2.6);
  rim.position.set(-4, 2.5, -6);
  scene.add(key, rim);

  // ----- sol : flaque de lumière, tracé de plateforme, ombres de contact -----
  const BAR_Y = 0.3;
  const pool = softDisc({ radius: 2.4, color: '#2a3317', opacity: 1, additive: true, y: 0, falloff: 1.4 });
  pool.scale.set(1, 0.5, 1);
  scene.add(pool);
  const lineMaterial = new THREE.MeshBasicMaterial({ color: '#c6f432', transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false });
  const addLine = (w, d, x, z) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.002, z);
    scene.add(mesh);
  };
  addLine(2.9, 0.012, 0, 0.62); addLine(2.9, 0.012, 0, -0.62); addLine(0.012, 1.24, 1.45, 0); addLine(0.012, 1.24, -1.45, 0);
  addLine(0.012, 1.24, 0.6, 0); addLine(0.012, 1.24, -0.6, 0);

  // ----- la barre -----
  const steel = new THREE.MeshStandardMaterial({ color: '#cfd2d6', metalness: 1, roughness: 0.2 });
  const knurlMap = canvasTexture(64, (ctx, size) => {
    ctx.fillStyle = '#777';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    for (let i = -size; i < size * 2; i += 16) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + size, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + size, 0); ctx.lineTo(i, size); ctx.stroke();
    }
  }, { srgb: false, repeat: true });
  knurlMap.repeat.set(14, 160);
  const knurl = new THREE.MeshStandardMaterial({ color: '#8e9197', metalness: 1, roughness: 0.52, bumpMap: knurlMap, bumpScale: 1.5 });
  const bar = new THREE.Group();
  bar.position.y = BAR_Y;
  scene.add(bar);
  bar.add(new THREE.Mesh(revolve([[-0.66, 0.0138], [0.66, 0.0138]], 28), steel));
  for (const [from, to] of [[-0.06, 0.06], [0.2, 0.445], [0.465, 0.61], [-0.445, -0.2], [-0.61, -0.465]]) {
    bar.add(new THREE.Mesh(revolve([[from, 0.0143], [to, 0.0143]], 28), knurl));
  }
  const SLEEVE_START = 0.69, SLEEVE_END = 1.105;
  const sleeveGeometry = revolve([[0.655, 0.013], [0.655, 0.038], [0.657, 0.04], [0.688, 0.04], [SLEEVE_START, 0.038], [SLEEVE_START, 0.025], [1.1, 0.025], [SLEEVE_END, 0.021], [SLEEVE_END, 0]], 40);
  const capMap = canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = '#c6f432';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#0a0a0a';
    ctx.font = '900 96px "Big Shoulders", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('20', size / 2, size / 2 + 4);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0a0a0a';
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 22, 0, Math.PI * 2); ctx.stroke();
  });
  const capGeometry = new THREE.CircleGeometry(0.0205, 32).rotateY(Math.PI / 2);
  const capMaterial = new THREE.MeshStandardMaterial({ map: capMap, roughness: 0.5 });

  // ----- colliers, disques : un groupe par côté (le gauche est le droit retourné) -----
  const collarGeometry = revolve([[-0.02, HOLE], [-0.02, 0.046], [-0.017, 0.049], [0.017, 0.049], [0.02, 0.046], [0.02, HOLE], [-0.02, HOLE]], 40);
  const collarMaterial = new THREE.MeshStandardMaterial({ color: '#17181a', metalness: 0.85, roughness: 0.38 });
  const leverMaterial = new THREE.MeshStandardMaterial({ color: '#c6f432', roughness: 0.45 });
  const sides = [0, Math.PI].map((turn) => {
    const group = new THREE.Group();
    group.rotation.y = turn;
    bar.add(group);
    group.add(new THREE.Mesh(sleeveGeometry, steel));
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.x = SLEEVE_END + 0.0006;
    group.add(cap);
    const collar = new THREE.Group();
    collar.add(new THREE.Mesh(collarGeometry, collarMaterial));
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.018, 0.06), leverMaterial);
    lever.position.set(0, 0.056, 0.012);
    collar.add(lever);
    group.add(collar);
    const shadow = softDisc({ radius: 0.34, color: '#000000', opacity: 0.85, y: 0.004 - BAR_Y, falloff: 1.3 });
    shadow.visible = false;
    group.add(shadow);
    return { group, collar, shadow };
  });

  // ----- supports -----
  const powder = new THREE.MeshStandardMaterial({ color: '#1b1c1e', metalness: 0.15, roughness: 0.6 });
  for (const x of [-0.52, 0.52]) {
    const stand = new THREE.Group();
    stand.position.x = x;
    const box = (w, hh, d, y, z = 0, material = powder) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), material);
      mesh.position.set(0, y, z);
      stand.add(mesh);
    };
    box(0.16, 0.012, 0.4, 0.006);
    box(0.05, 0.248, 0.05, 0.136);
    box(0.075, 0.022, 0.11, 0.271);
    box(0.076, 0.004, 0.07, 0.284, 0, leverMaterial);
    box(0.075, 0.056, 0.016, 0.31, 0.047);
    box(0.075, 0.056, 0.016, 0.31, -0.047);
    scene.add(stand);
    const under = softDisc({ radius: 0.3, color: '#000000', opacity: 0.7, y: 0.003 });
    under.position.x = x;
    under.scale.set(0.7, 1, 1);
    scene.add(under);
  }

  // ----- poussière de magnésie -----
  const dust = reduced ? null : new Particles({ count: 110, box: [3.4, 1.1, 1.8], center: [0, 0.5, 0], color: '#eef7cf', size: 0.03, speed: [0.03, 0.035, 0], wobble: 0.06, opacity: 0.55 });
  if (dust) scene.add(dust.points);

  // ----- chargement : les disques glissent, le collier referme -----
  const parts = new Map();
  const partsFor = (spec) => parts.get(spec) || parts.set(spec, plateParts(spec)).get(spec);
  const GAP = 0.0015, EXIT = SLEEVE_END + 0.5;
  let stack = [], ghosts = [], clock = 0;
  const collarTween = { x: SLEEVE_START + 0.02, from: SLEEVE_START + 0.02, to: SLEEVE_START + 0.02, t0: 0, dur: 0.001, then: null };

  function makePlate(spec) {
    const p = partsFor(spec);
    const meshes = sides.map(({ group }) => {
      const plate = new THREE.Group();
      plate.add(new THREE.Mesh(p.body, p.rubber));
      if (p.hub) plate.add(new THREE.Mesh(p.hub, steel));
      for (const dir of [1, -1]) {
        const mark = new THREE.Mesh(p.ring, p.markMaterial);
        mark.rotation.y = (dir * Math.PI) / 2;
        mark.position.x = dir * (p.webH + 0.0008);
        plate.add(mark);
      }
      plate.visible = false;
      group.add(plate);
      return plate;
    });
    return { spec, meshes, x: EXIT, from: EXIT, to: EXIT, t0: 0, dur: 0.5, spin: Math.random() * 6 };
  }

  function setLoad({ plates }) {
    let keep = 0;
    while (keep < stack.length && keep < plates.length && stack[keep].spec === plates[keep]) keep++;
    if (keep === stack.length && keep === plates.length) return;
    const quick = reduced ? 0 : 1;
    let t = clock;
    // le collier s'écarte
    Object.assign(collarTween, { from: collarTween.x, to: SLEEVE_END + 0.2, t0: t, dur: 0.28 * quick });
    t += 0.14 * quick;
    const leaving = stack.splice(keep).reverse();
    leaving.forEach((plate, i) => {
      Object.assign(plate, { from: plate.x, to: EXIT + 0.1, t0: t + i * 0.08 * quick, dur: 0.4 * quick, leaving: true });
      ghosts.push(plate);
    });
    if (leaving.length) t += (leaving.length * 0.08 + 0.3) * quick;
    let x = SLEEVE_START + stack.reduce((sum, plate) => sum + plate.spec.width + GAP, 0);
    plates.slice(keep).forEach((spec, i) => {
      const plate = makePlate(spec);
      Object.assign(plate, { to: x + spec.width / 2, t0: t + i * 0.16 * quick, dur: 0.6 * quick });
      x += spec.width + GAP;
      stack.push(plate);
    });
    t += ((plates.length - keep) * 0.16 + 0.45) * quick;
    collarTween.then = { to: x + 0.021, t0: t, dur: 0.45 * quick };
    wake(4000);
  }

  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const easeIn = (k) => k * k * k;
  function stepTween(item, ease) {
    if (clock < item.t0) return false;
    const k = item.dur > 0 ? clamp((clock - item.t0) / item.dur) : 1;
    item.x = lerp(item.from, item.to, ease(k));
    return k >= 1;
  }

  function animate() {
    let busy = false;
    for (const plate of stack) {
      const done = stepTween(plate, easeOut);
      const shown = clock >= plate.t0;
      busy ||= !done;
      for (const mesh of plate.meshes) {
        mesh.visible = shown;
        mesh.position.x = plate.x;
        mesh.rotation.x = plate.spin + (plate.to - plate.x) * 5;
      }
    }
    ghosts = ghosts.filter((plate) => {
      const done = stepTween(plate, easeIn);
      for (const mesh of plate.meshes) {
        mesh.position.x = plate.x;
        mesh.rotation.x = plate.spin + (plate.x - plate.from) * 5;
        if (done) mesh.removeFromParent();
      }
      busy = true;
      return !done;
    });
    const collarDone = stepTween(collarTween, collarTween.then ? easeIn : easeOut);
    if (collarDone && collarTween.then) {
      Object.assign(collarTween, { from: collarTween.x, ...collarTween.then, then: null });
      busy = true;
    } else if (!collarDone) busy = true;
    const settled = stack.filter((plate) => clock >= plate.t0);
    const end = settled.length ? Math.max(...settled.map((plate) => plate.x + plate.spec.width / 2)) : SLEEVE_START;
    for (const side of sides) {
      side.collar.position.x = collarTween.x;
      side.collar.visible = collarTween.x < SLEEVE_END - 0.02;
      side.shadow.visible = settled.length > 0;
      const width = Math.max(0.06, end - SLEEVE_START);
      side.shadow.position.x = SLEEVE_START + width / 2;
      side.shadow.scale.set(0.35 + width * 1.6, 1, 1);
    }
    return busy;
  }

  // ----- caméra : on tourne autour de la barre (ou d'un manchon, en zoom) -----
  const DEFAULTS = { full: { yaw: 0.34, pitch: 0.2 }, side: { yaw: 1.0, pitch: 0.24 } };
  const viewButton = root.querySelector('[data-view]');
  let view = 'full', focus = 0, yaw = DEFAULTS.full.yaw, yawGoal = yaw, pitch = DEFAULTS.full.pitch, pitchGoal = pitch, distance = 4;
  let dragging = false, touched = false, lastX = 0, lastY = 0;
  function setView(next, snap) {
    view = next;
    yawGoal = DEFAULTS[next].yaw;
    pitchGoal = DEFAULTS[next].pitch;
    if (snap) { focus = next === 'side' ? 1 : 0; yaw = yawGoal; pitch = pitchGoal; }
    if (viewButton) {
      viewButton.setAttribute('aria-pressed', String(next === 'side'));
      viewButton.textContent = next === 'side' ? 'Voir toute la barre' : 'Zoom sur un côté';
    }
    wake();
  }
  viewButton?.addEventListener('click', () => setView(view === 'side' ? 'full' : 'side'));

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true; touched = true;
    lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    wake();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    yawGoal = yaw = yaw - (event.clientX - lastX) * 0.008;
    pitchGoal = pitch = clamp(pitch + (event.clientY - lastY) * 0.005, 0.04, 1.1);
    lastX = event.clientX; lastY = event.clientY;
    wake();
  });
  const release = () => { dragging = false; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') yawGoal += 0.25;
    else if (event.key === 'ArrowRight') yawGoal -= 0.25;
    else if (event.key === 'ArrowUp') pitchGoal = clamp(pitchGoal + 0.12, 0.04, 1.1);
    else if (event.key === 'ArrowDown') pitchGoal = clamp(pitchGoal - 0.12, 0.04, 1.1);
    else return;
    touched = true;
    event.preventDefault();
    wake();
  });

  // ----- rendu : seulement à l'écran ; si l'utilisateur réduit les animations, seulement quand ça change -----
  let visible = false, awakeUntil = 0, last = performance.now(), sized = false;
  function wake(ms = 2500) { awakeUntil = Math.max(awakeUntil, performance.now() + ms); }
  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (!sized) { sized = true; setView(camera.aspect < 1.25 ? 'side' : 'full', true); }
    wake();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) wake(); }).observe(canvas);

  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!visible) return;
    if (reduced && now > awakeUntil) return;
    clock += dt;
    animate();
    const ease = reduced ? 1 : 1 - Math.exp(-5 * dt);
    focus = lerp(focus, view === 'side' ? 1 : 0, ease);
    yaw = lerp(yaw, yawGoal, ease);
    pitch = lerp(pitch, pitchGoal, ease);
    const sway = reduced || dragging || touched ? 0 : Math.sin(clock * 0.45) * 0.1;
    const angle = yaw + sway;
    const half = lerp(1.16, 0.31, focus);
    const halfW = half * Math.abs(Math.cos(angle)) + 0.26 * Math.abs(Math.sin(angle)) + 0.05;
    const halfH = lerp(0.33, 0.3, focus);
    const wanted = Math.max(halfW / (tanHalf * camera.aspect), halfH / tanHalf) * 1.06 + half * Math.abs(Math.sin(angle)) * 0.75 + 0.2;
    distance = lerp(distance, wanted, reduced ? 1 : 1 - Math.exp(-6 * dt));
    const tx = lerp(0, 0.875, focus), ty = lerp(0.255, 0.27, focus);
    camera.position.set(tx + Math.sin(angle) * Math.cos(pitch) * distance, ty + Math.sin(pitch) * distance, Math.cos(angle) * Math.cos(pitch) * distance);
    camera.lookAt(tx, ty, 0);
    if (dust) dust.update(clock, canvas.height);
    renderer.render(scene, camera);
  }

  watchers.push(setLoad);
  resize();
  setLoad(current);
  requestAnimationFrame(frame);
  root.classList.add('is-ready');
}
