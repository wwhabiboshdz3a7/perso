// Générateur de mains synthétiques : produit les 21 points d'une main au format
// MediaPipe (coordonnées normalisées de l'image caméra brute) à partir d'une
// pose (angles de flexion des doigts) et d'une position. Sert au mode
// simulation, aux tests et aux schémas du tutoriel.

const FINGER_DEF = {
  index: { mcp: [0.34, -0.93, 0], len: [0.43, 0.26, 0.21], angle: 0.04, spread: 0.1 },
  middle: { mcp: [0.09, -1.0, 0], len: [0.48, 0.3, 0.23], angle: 0, spread: 0 },
  ring: { mcp: [-0.14, -0.94, 0], len: [0.45, 0.28, 0.22], angle: 0, spread: -0.08 },
  pinky: { mcp: [-0.35, -0.81, 0], len: [0.35, 0.21, 0.19], angle: -0.04, spread: -0.2 },
};
const FINGER_ORDER = ['index', 'middle', 'ring', 'pinky'];
const THUMB_CMC = [0.28, -0.18, -0.04];

const STRAIGHT = [0.04, 0.04, 0.03];
const CURLED = [1.5, 1.62, 1.05];
const THUMB_OPEN = [0.95, -0.78, -0.06];
const THUMB_FOLD = [0.0, -0.55, -0.36];

/** Bibliothèque de poses (repère local : main droite, paume face caméra, doigts vers le haut). */
export const POSES = {
  open: { fingers: { index: STRAIGHT, middle: STRAIGHT, ring: STRAIGHT, pinky: STRAIGHT }, spread: 1.1, thumb: THUMB_OPEN },
  fist: { fingers: { index: CURLED, middle: CURLED, ring: CURLED, pinky: [1.45, 1.55, 1.0] }, spread: 0.6, thumb: THUMB_FOLD },
  point: { fingers: { index: STRAIGHT, middle: CURLED, ring: CURLED, pinky: CURLED }, spread: 0.8, thumb: [0.06, -0.62, -0.32] },
  pinch: { fingers: { index: [0.55, 0.5, 0.35], middle: [0.15, 0.15, 0.1], ring: [0.18, 0.18, 0.1], pinky: [0.2, 0.2, 0.12] }, spread: 1.0, thumb: 'pinch' },
  victory: { fingers: { index: STRAIGHT, middle: STRAIGHT, ring: CURLED, pinky: CURLED }, spread: 1.7, thumb: [-0.08, -0.6, -0.33] },
  thumb_up: { fingers: { index: CURLED, middle: CURLED, ring: CURLED, pinky: [1.45, 1.55, 1.0] }, spread: 0.6, thumb: [1.08, -0.52, -0.1], roll: -Math.PI / 2 },
  thumb_down: { fingers: { index: CURLED, middle: CURLED, ring: CURLED, pinky: [1.45, 1.55, 1.0] }, spread: 0.6, thumb: [1.08, -0.52, -0.1], roll: Math.PI / 2 },
  iloveyou: { fingers: { index: STRAIGHT, middle: CURLED, ring: CURLED, pinky: STRAIGHT }, spread: 1.3, thumb: THUMB_OPEN },
};

/** Catégorie que le modèle MediaPipe renverrait pour chaque pose. */
export const POSE_MODEL_CATEGORY = {
  open: 'Open_Palm', fist: 'Closed_Fist', point: 'Pointing_Up', pinch: 'None',
  victory: 'Victory', thumb_up: 'Thumb_Up', thumb_down: 'Thumb_Down', iloveyou: 'ILoveYou',
};

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function fingerChain(name, flex, spreadAmount) {
  const def = FINGER_DEF[name];
  const theta = def.angle + def.spread * spreadAmount;
  const d0 = [Math.sin(theta), -Math.cos(theta), 0];
  const toward = [0, 0, -1]; // les doigts se replient vers la caméra
  const pts = [def.mcp];
  let phi = 0;
  let cur = def.mcp;
  for (let s = 0; s < 3; s++) {
    phi += flex[s];
    const d = add(scale3(d0, Math.cos(phi)), scale3(toward, Math.sin(phi)));
    cur = add(cur, scale3(d, def.len[s]));
    pts.push(cur);
  }
  return pts;
}

/** Résout une pose (nom ou objet) en paramètres concrets interpolables. */
export function resolvePose(pose) {
  const p = typeof pose === 'string' ? POSES[pose] : pose;
  if (!p) throw new Error(`Pose inconnue : ${pose}`);
  let thumb = p.thumb;
  if (thumb === 'pinch') {
    const tip = fingerChain('index', p.fingers.index, p.spread)[3];
    thumb = add(tip, [0.03, 0.025, 0.0]);
  }
  return {
    fingers: Object.fromEntries(FINGER_ORDER.map((f) => [f, [...p.fingers[f]]])),
    spread: p.spread,
    thumb: [...thumb],
    roll: p.roll || 0,
  };
}

/** Interpolation entre deux poses (t de 0 à 1). */
export function blendPoses(a, b, t) {
  const A = resolvePose(a), B = resolvePose(b);
  return {
    fingers: Object.fromEntries(FINGER_ORDER.map((f) => [f, lerp3(A.fingers[f], B.fingers[f], t)])),
    spread: lerp(A.spread, B.spread, t),
    thumb: lerp3(A.thumb, B.thumb, t),
    roll: lerp(A.roll, B.roll, t),
  };
}

/** Points locaux (21) d'une pose résolue. */
export function localPoints(pose) {
  const r = pose.fingers && Array.isArray(pose.thumb) ? pose : resolvePose(pose);
  const pts = new Array(21);
  pts[0] = [0, 0, 0];
  const cmc = THUMB_CMC;
  const tip = r.thumb;
  const bend = [0.55, 0.0, -0.45];
  pts[1] = cmc;
  pts[2] = add(lerp3(cmc, tip, 0.36), scale3(bend, 0.12));
  pts[3] = add(lerp3(cmc, tip, 0.68), scale3(bend, 0.07));
  pts[4] = tip;
  FINGER_ORDER.forEach((name, k) => {
    const chain = fingerChain(name, r.fingers[name], r.spread);
    for (let s = 0; s < 4; s++) pts[5 + k * 4 + s] = chain[s];
  });
  return pts;
}

const fixedAnchors = new Map();

function anchorPoint(local, anchor, side) {
  // « index@point » : point fixe dans le repère de la paume (là où serait le bout
  // de l'index en pose « point ») — la paume reste immobile quand la pose change.
  if (typeof anchor === 'string' && anchor.startsWith('index@')) {
    const key = anchor + side;
    if (!fixedAnchors.has(key)) {
      const p = localPoints(anchor.slice(6))[8];
      fixedAnchors.set(key, side === 'Left' ? [-p[0], p[1], p[2]] : p);
    }
    return fixedAnchors.get(key);
  }
  if (anchor === 'index') return local[8];
  if (anchor === 'wrist') return local[0];
  if (anchor === 'pinch') return lerp3(local[4], local[8], 0.5);
  const ids = [0, 5, 9, 13, 17];
  const s = ids.reduce((acc, i) => add(acc, local[i]), [0, 0, 0]);
  return scale3(s, 1 / ids.length);
}

/**
 * Rend une main en coordonnées MediaPipe.
 * @param {string|object} pose
 * @param {{x:number,y:number,size?:number,roll?:number,side?:'Right'|'Left',aspect?:number,anchor?:string,jitter?:number,rng?:()=>number}} o
 *   x, y : position (image caméra brute, 0..1) du point d'ancrage
 *   size : longueur poignet → base du majeur, en hauteur d'image
 */
export function renderHand(pose, o) {
  const r = pose.fingers && Array.isArray(pose.thumb) ? pose : resolvePose(pose);
  const size = o.size ?? 0.2;
  const aspect = o.aspect ?? 4 / 3;
  const side = o.side ?? 'Right';
  const roll = (o.roll ?? 0) + (side === 'Left' ? -r.roll : r.roll);
  const local = localPoints(r).map((p) => (side === 'Left' ? [-p[0], p[1], p[2]] : p));
  const a = anchorPoint(local, o.anchor ?? 'palm', side);
  const c = Math.cos(roll), s = Math.sin(roll);
  const jitter = o.jitter ?? 0;
  const rng = o.rng ?? Math.random;
  return local.map((p) => {
    const lx = (p[0] - a[0]) * size, ly = (p[1] - a[1]) * size, lz = (p[2] - a[2]) * size;
    const rx = lx * c - ly * s;
    const ry = lx * s + ly * c;
    const jx = jitter ? (rng() - 0.5) * jitter : 0;
    const jy = jitter ? (rng() - 0.5) * jitter : 0;
    return {
      x: (o.x * aspect + rx + jx) / aspect,
      y: o.y + ry + jy,
      z: lz / aspect,
    };
  });
}

/** Étiquette de latéralité telle que MediaPipe la donnerait sur une image brute (non miroir). */
export function mediapipeLabel(side) {
  return side === 'Right' ? 'Left' : 'Right';
}
