// Séquences de gestes synthétiques : images-clés (pose + position) interpolées
// puis échantillonnées au format MediaPipe. Utilisées par le mode simulation,
// les tests unitaires et les tests de bout en bout.

import { renderHand, blendPoses, resolvePose, POSE_MODEL_CATEGORY, mediapipeLabel } from './handpose.js';

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Compose une séquence.
 * @param {{fps?:number, width?:number, height?:number, mirror?:boolean, model?:boolean,
 *          hands: Array<{side?:'Right'|'Left', keys: Array<{t:number, pose?:string, x?:number, y?:number,
 *          size?:number, roll?:number, anchor?:string, visible?:boolean, ease?:boolean}>}>}} spec
 *   Les positions x, y des images-clés sont en coordonnées d'AFFICHAGE (0..1) :
 *   la conversion vers l'image caméra brute (miroir) est faite ici.
 * @returns {{fps:number,width:number,height:number,duration:number,frames:Array}}
 */
export function compose(spec) {
  const fps = spec.fps ?? 30;
  const width = spec.width ?? 1280;
  const height = spec.height ?? 720;
  const aspect = width / height;
  const mirror = spec.mirror ?? true;
  const model = spec.model ?? true;
  const duration = Math.max(...spec.hands.map((h) => h.keys[h.keys.length - 1].t));
  const frames = [];
  const step = 1000 / fps;
  for (let t = 0; t <= duration + 1e-6; t += step) {
    const hands = [];
    for (const h of spec.hands) {
      const s = sampleKeys(h.keys, t);
      if (!s) continue;
      const side = h.side ?? 'Right';
      const landmarks = renderHand(s.pose, {
        x: mirror ? 1 - s.x : s.x,
        y: s.y,
        size: s.size,
        roll: mirror ? -s.roll : s.roll,
        side,
        aspect,
        anchor: s.anchor,
      });
      const hand = { landmarks, handedness: mediapipeLabel(side), handednessScore: 0.98 };
      if (model) {
        const cat = s.weight > 0.75 || s.weight < 0.25 ? POSE_MODEL_CATEGORY[s.dominantPose] || 'None' : 'None';
        hand.gestures = [{ categoryName: cat, score: cat === 'None' ? 0.5 : 0.9 }];
      }
      hands.push(hand);
    }
    frames.push({ t: Math.round(t), width, height, hands });
  }
  return { fps, width, height, duration, frames };
}

function sampleKeys(keys, t) {
  if (t < keys[0].t) return null;
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  if (a.visible === false) return null;
  const pa = withDefaults(a, keys, i);
  if (!b || b.visible === false) {
    if (!b && t > a.t) return null; // après la dernière image-clé : main absente
    return finalize(pa, pa, 0);
  }
  const pb = withDefaults(b, keys, i + 1);
  const raw = (t - a.t) / Math.max(1, b.t - a.t);
  const k = a.ease === false ? raw : ease(raw);
  return finalize(pa, pb, k);
}

function withDefaults(k, keys, idx) {
  // Les champs absents héritent de l'image-clé précédente.
  const out = { pose: 'open', x: 0.5, y: 0.5, size: 0.2, roll: 0, anchor: 'index' };
  for (let j = 0; j <= idx; j++) Object.assign(out, strip(keys[j]));
  return out;
}

function strip(k) {
  const o = {};
  for (const key of ['pose', 'x', 'y', 'size', 'roll', 'anchor']) if (k[key] !== undefined) o[key] = k[key];
  return o;
}

function finalize(a, b, k) {
  const lerp = (u, v) => u + (v - u) * k;
  const pose = a.pose === b.pose ? resolvePose(a.pose) : blendPoses(a.pose, b.pose, k);
  return {
    pose,
    dominantPose: k < 0.5 ? a.pose : b.pose,
    weight: a.pose === b.pose ? 1 : k,
    x: lerp(a.x, b.x),
    y: lerp(a.y, b.y),
    size: lerp(a.size, b.size),
    roll: lerp(a.roll, b.roll),
    anchor: k < 0.5 ? a.anchor : b.anchor,
  };
}

// ——— Bibliothèque de scénarios ———————————————————————————————————————————

/** Viser une cible (x, y affichage) avec l'index puis fermer le poing, et sortir du champ. */
export function grabAt(x, y, o = {}) {
  const side = o.side ?? 'Right';
  return compose({ ...o, hands: [{ side, keys: [
    { t: 0, pose: 'point', x: x + 0.12, y: Math.min(1.05, y + 0.35), anchor: 'index@point' },
    { t: 500, pose: 'point', x, y },
    { t: 800, pose: 'point', x, y },
    { t: 950, pose: 'fist', x, y },
    { t: 1350, pose: 'fist', x, y },
    { t: 1800, pose: 'fist', x: x + 0.05, y: 1.25 },
    { t: 1850, visible: false },
  ] }] });
}

/** Arriver poing fermé puis ouvrir la main (lâcher). */
export function releaseAt(x, y, o = {}) {
  const side = o.side ?? 'Right';
  return compose({ ...o, hands: [{ side, keys: [
    { t: 0, pose: 'fist', x, y: Math.min(1.1, y + 0.3), anchor: 'palm' },
    { t: 450, pose: 'fist', x, y },
    { t: 750, pose: 'fist', x, y },
    { t: 900, pose: 'open', x, y },
    { t: 1500, pose: 'open', x, y },
    { t: 1550, visible: false },
  ] }] });
}

/** Lancer : poing fermé, mouvement rapide, ouverture en cours de mouvement. */
export function throwToward(dir = 'right', o = {}) {
  const side = o.side ?? 'Right';
  const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
  const x0 = 0.5 - dx * 0.25, y0 = 0.55 - dy * 0.3;
  return compose({ ...o, hands: [{ side, keys: [
    { t: 0, pose: 'fist', x: x0, y: y0, anchor: 'palm' },
    { t: 500, pose: 'fist', x: x0, y: y0 },
    { t: 640, pose: 'fist', x: x0 + dx * 0.22, y: y0 + dy * 0.3, ease: false },
    { t: 760, pose: 'open', x: x0 + dx * 0.42, y: y0 + dy * 0.55, ease: false },
    { t: 1000, pose: 'open', x: x0 + dx * 0.48, y: y0 + dy * 0.62 },
    { t: 1050, visible: false },
  ] }] });
}

/** Swipe main ouverte. */
export function swipe(dir = 'left', o = {}) {
  const side = o.side ?? 'Right';
  const horiz = dir === 'left' || dir === 'right';
  const s = dir === 'left' || dir === 'up' ? -1 : 1;
  const a = { x: horiz ? 0.5 - s * 0.25 : 0.5, y: horiz ? 0.5 : 0.5 - s * 0.22 };
  const b = { x: horiz ? 0.5 + s * 0.25 : 0.5, y: horiz ? 0.5 : 0.5 + s * 0.22 };
  return compose({ ...o, hands: [{ side, keys: [
    { t: 0, pose: 'open', ...a, anchor: 'palm' },
    { t: 400, pose: 'open', ...a },
    { t: 640, pose: 'open', ...b, ease: false },
    { t: 1000, pose: 'open', ...b },
    { t: 1050, visible: false },
  ] }] });
}

/** Pincement bref (clic aérien) sur une cible. */
export function pinchClick(x, y, o = {}) {
  const side = o.side ?? 'Right';
  return compose({ ...o, hands: [{ side, keys: [
    { t: 0, pose: 'point', x: x + 0.1, y: y + 0.2, anchor: 'index@point' },
    { t: 400, pose: 'point', x, y },
    { t: 600, pose: 'point', x, y },
    { t: 680, pose: 'pinch', x, y },
    { t: 860, pose: 'pinch', x, y },
    { t: 940, pose: 'point', x, y },
    { t: 1200, pose: 'point', x, y },
    { t: 1250, visible: false },
  ] }] });
}

/** Pincement maintenu et déplacé (glisser). */
export function pinchDrag(x0, y0, x1, y1, o = {}) {
  const side = o.side ?? 'Right';
  return compose({ ...o, hands: [{ side, keys: [
    { t: 0, pose: 'point', x: x0, y: y0 + 0.15, anchor: 'index@point' },
    { t: 350, pose: 'point', x: x0, y: y0 },
    { t: 550, pose: 'point', x: x0, y: y0 },
    { t: 630, pose: 'pinch', x: x0, y: y0 },
    { t: 800, pose: 'pinch', x: x0, y: y0 },
    { t: 1500, pose: 'pinch', x: x1, y: y1 },
    { t: 1650, pose: 'pinch', x: x1, y: y1 },
    { t: 1730, pose: 'point', x: x1, y: y1 },
    { t: 1950, pose: 'point', x: x1, y: y1 },
    { t: 2000, visible: false },
  ] }] });
}

/** Deux mains qui pincent puis s'écartent (zoom) et/ou tournent. */
export function twoHands({ zoom = 1.8, rotate = 0, ...o } = {}) {
  // Distances exprimées en hauteurs d'image (espace isotrope).
  const aspect = (o.width ?? 1280) / (o.height ?? 720);
  const d0 = 0.28;
  const d1 = d0 * zoom;
  const pos = (d, ang, s) => ({ x: 0.5 + (s * Math.cos(ang) * d) / aspect, y: 0.5 + s * Math.sin(ang) * d });
  const mk = (side, s) => ({ side, keys: [
    { t: 0, pose: 'point', ...pos(d0, 0, s), anchor: 'index@point' },
    { t: 300, pose: 'point', ...pos(d0, 0, s) },
    { t: 420, pose: 'pinch', ...pos(d0, 0, s) },
    { t: 650, pose: 'pinch', ...pos(d0, 0, s) },
    { t: 1500, pose: 'pinch', ...pos(d1, rotate, s) },
    { t: 1700, pose: 'pinch', ...pos(d1, rotate, s) },
    { t: 1800, pose: 'open', ...pos(d1, rotate, s) },
    { t: 2000, pose: 'open', ...pos(d1, rotate, s) },
    { t: 2050, visible: false },
  ] });
  return compose({ ...o, hands: [mk('Right', 1), mk('Left', -1)] });
}

/** Maintien d'une pose (pouce levé, victoire, signe « je t’aime »…). */
export function holdPose(pose, o = {}) {
  const side = o.side ?? 'Right';
  const x = o.x ?? 0.5, y = o.y ?? 0.5;
  return compose({ ...o, hands: [{ side, keys: [
    { t: 0, pose: 'open', x, y: y + 0.15, anchor: 'palm' },
    { t: 300, pose: 'open', x, y },
    { t: 450, pose, x, y },
    { t: 1350, pose, x, y },
    { t: 1500, pose: 'open', x, y },
    { t: 1700, pose: 'open', x, y },
    { t: 1750, visible: false },
  ] }] });
}

/** Tracé à l'index le long d'une liste de points (affichage). */
export function drawPath(points, o = {}) {
  const side = o.side ?? 'Right';
  const keys = [{ t: 0, pose: 'point', x: points[0][0], y: points[0][1], anchor: 'index@point' }];
  let t = 350;
  keys.push({ t, pose: 'point', x: points[0][0], y: points[0][1] });
  const seg = o.segmentMs ?? 60;
  for (let i = 1; i < points.length; i++) {
    t += seg;
    keys.push({ t, pose: 'point', x: points[i][0], y: points[i][1], ease: false });
  }
  keys.push({ t: t + 300, pose: 'point' });
  keys.push({ t: t + 350, visible: false });
  return compose({ ...o, hands: [{ side, keys }] });
}

export function circlePoints(cx = 0.5, cy = 0.5, r = 0.18, n = 36, aspect = 16 / 9) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cx + (Math.cos(a) * r) / aspect, cy + Math.sin(a) * r]);
  }
  return pts;
}

/** Deux index levés maintenus. */
export function twoIndex(o = {}) {
  const mk = (side, x) => ({ side, keys: [
    { t: 0, pose: 'open', x, y: 0.6, anchor: 'index@point' },
    { t: 300, pose: 'point', x, y: 0.45 },
    { t: 1400, pose: 'point', x, y: 0.45 },
    { t: 1450, visible: false },
  ] });
  return compose({ ...o, hands: [mk('Right', 0.65), mk('Left', 0.35)] });
}

/** Poing qui balaie une zone (gomme). */
export function fistPath(points, o = {}) {
  const side = o.side ?? 'Right';
  const keys = [{ t: 0, pose: 'fist', x: points[0][0], y: points[0][1], anchor: 'palm' }];
  let t = 400;
  keys.push({ t, pose: 'fist', x: points[0][0], y: points[0][1] });
  for (let i = 1; i < points.length; i++) {
    t += 70;
    keys.push({ t, pose: 'fist', x: points[i][0], y: points[i][1], ease: false });
  }
  keys.push({ t: t + 300, pose: 'fist' });
  keys.push({ t: t + 350, visible: false });
  return compose({ ...o, hands: [{ side, keys }] });
}

/** Catalogue utilisé par le banc de simulation (paramètres par défaut). */
export const SCENARIOS = {
  attraper: { label: 'Attraper', build: (p = {}) => grabAt(p.x ?? 0.5, p.y ?? 0.45, p) },
  lacher: { label: 'Lâcher', build: (p = {}) => releaseAt(p.x ?? 0.5, p.y ?? 0.5, p) },
  lancer: { label: 'Lancer →', build: (p = {}) => throwToward(p.dir ?? 'right', p) },
  'swipe-gauche': { label: 'Swipe ←', build: (p = {}) => swipe('left', p) },
  'swipe-droite': { label: 'Swipe →', build: (p = {}) => swipe('right', p) },
  pincer: { label: 'Pincer (clic)', build: (p = {}) => pinchClick(p.x ?? 0.5, p.y ?? 0.5, p) },
  glisser: { label: 'Glisser', build: (p = {}) => pinchDrag(p.x ?? 0.35, p.y ?? 0.5, p.x1 ?? 0.65, p.y1 ?? 0.5, p) },
  zoom: { label: 'Zoom 2 mains', build: (p = {}) => twoHands({ zoom: p.zoom ?? 1.8, rotate: p.rotate ?? 0, ...p }) },
  rotation: { label: 'Rotation 2 mains', build: (p = {}) => twoHands({ zoom: 1, rotate: p.rotate ?? 0.6, ...p }) },
  'pouce-leve': { label: 'Pouce levé', build: (p = {}) => holdPose('thumb_up', p) },
  victoire: { label: 'Victoire', build: (p = {}) => holdPose('victory', p) },
  iloveyou: { label: 'Signe « je t’aime »', build: (p = {}) => holdPose('iloveyou', p) },
  cercle: { label: 'Dessiner un cercle', build: (p = {}) => drawPath(circlePoints(p.x ?? 0.5, p.y ?? 0.5, p.r ?? 0.18), p) },
  'deux-index': { label: 'Deux index', build: (p = {}) => twoIndex(p) },
  gomme: { label: 'Gommer', build: (p = {}) => fistPath([[0.4, 0.4], [0.6, 0.45], [0.4, 0.55], [0.6, 0.6]], p) },
};

/** Durée maximale d'un geste enregistré ou importé (secondes). */
export const MAX_SEQUENCE_S = 60;

/** Geste enregistré ou importé : raison du refus, ou null s'il est jouable. */
export function sequenceProblem(frames) {
  if (!Array.isArray(frames) || frames.length < 3 || frames.length > 5000) return 'format';
  let prev = -Infinity;
  for (const f of frames) {
    if (!f || !Number.isFinite(f.t) || !Array.isArray(f.hands) || f.hands.length > 2) return 'format';
    if (f.t < prev) return 'temps';
    prev = f.t;
    for (const h of f.hands) {
      if (!Array.isArray(h?.landmarks) || h.landmarks.length !== 21) return 'format';
      if (!h.landmarks.every((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y) && Math.abs(p.x) < 10 && Math.abs(p.y) < 10)) return 'format';
    }
  }
  if (frames.at(-1).t - frames[0].t > MAX_SEQUENCE_S * 1000) return 'durée';
  return null;
}
