// Géométrie de la main : indices des 21 points MediaPipe, mesures et
// classification géométrique des poses. Aucun accès au DOM.

export const LM = Object.freeze({
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
});

export const FINGERS = Object.freeze({
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
});

/** Paires de points reliés (squelette). */
export const HAND_CONNECTIONS = Object.freeze([
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]);

/** Libellés français des poses. */
export const POSE_LABELS = Object.freeze({
  none: '—',
  unknown: 'indéterminé',
  open: 'main ouverte',
  fist: 'poing',
  point: 'index pointé',
  pinch: 'pincement',
  victory: 'victoire',
  thumb_up: 'pouce levé',
  thumb_down: 'pouce baissé',
  iloveyou: 'I love you',
});

/** Catégories du modèle MediaPipe → poses internes. */
export const MODEL_TO_POSE = Object.freeze({
  Open_Palm: 'open',
  Closed_Fist: 'fist',
  Pointing_Up: 'point',
  Victory: 'victory',
  Thumb_Up: 'thumb_up',
  Thumb_Down: 'thumb_down',
  ILoveYou: 'iloveyou',
});

export const POSE_TO_GESTURE = Object.freeze({
  open: 'Open_Palm',
  fist: 'Closed_Fist',
  point: 'Pointing_Up',
  victory: 'Victory',
  thumb_up: 'Thumb_Up',
  thumb_down: 'Thumb_Down',
  iloveyou: 'ILoveYou',
});

export function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function dist2d(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z || 0) + (b.z || 0)) / 2 };
}

/**
 * Convertit des points normalisés (0..1 en x et y, image caméra brute) vers un
 * espace isotrope « affichage » : x multiplié par le rapport largeur/hauteur
 * (sinon les distances seraient déformées), miroir appliqué si demandé.
 */
export function toIso(landmarks, aspect, mirror) {
  return landmarks.map((p) => ({
    x: (mirror ? 1 - p.x : p.x) * aspect,
    y: p.y,
    z: (p.z || 0) * aspect,
  }));
}

/** Repasse de l'espace isotrope vers des coordonnées d'affichage 0..1. */
export function fromIso(p, aspect) {
  return { x: p.x / aspect, y: p.y };
}

export function palmCenter(p) {
  const ids = [0, 5, 9, 13, 17];
  let x = 0, y = 0, z = 0;
  for (const i of ids) { x += p[i].x; y += p[i].y; z += p[i].z || 0; }
  return { x: x / 5, y: y / 5, z: z / 5 };
}

/** Taille de référence de la main (longueur moyenne de la paume). */
export function handScale(p) {
  return (dist(p[0], p[5]) + dist(p[0], p[9]) + dist(p[0], p[17])) / 3 || 1e-6;
}

/** Rapport d'extension d'un doigt : distance poignet→bout / poignet→base. */
export function fingerRatio(p, finger) {
  const [mcp, , , tip] = FINGERS[finger];
  return dist(p[0], p[tip]) / (dist(p[0], p[mcp]) || 1e-6);
}

export function pinchRatio(p, scale = handScale(p)) {
  return dist(p[LM.THUMB_TIP], p[LM.INDEX_TIP]) / scale;
}

/**
 * Classification géométrique. Seuils exprimés en proportions de la main, donc
 * indépendants de la distance à la caméra.
 */
export function classify(p, th = {}) {
  const extRatio = th.extRatio ?? 1.42;
  const curlRatio = th.curlRatio ?? 1.22;
  const thumbExt = th.thumbExt ?? 0.72;
  const scale = handScale(p);
  const palm = palmCenter(p);

  const fingers = {};
  let ext = 0, curl = 0;
  for (const name of Object.keys(FINGERS)) {
    const r = fingerRatio(p, name);
    const state = r > extRatio ? 'ext' : r < curlRatio ? 'curl' : 'mid';
    fingers[name] = state;
    if (state === 'ext') ext++;
    else if (state === 'curl') curl++;
  }
  const thumbOut = dist(p[LM.THUMB_TIP], p[LM.MIDDLE_MCP]) / scale;
  const thumbTipBeyondIp =
    dist(p[LM.THUMB_TIP], p[LM.PINKY_MCP]) > dist(p[LM.THUMB_IP], p[LM.PINKY_MCP]);
  fingers.thumb = thumbOut > thumbExt && thumbTipBeyondIp ? 'ext' : 'fold';

  const pr = pinchRatio(p, scale);

  let pose = 'unknown';
  const f = fingers;
  if (curl >= 4 || (curl === 3 && ext === 0)) {
    if (f.thumb === 'ext') {
      // Direction du pouce : vers le haut ou vers le bas de l'image.
      const dy = p[LM.THUMB_TIP].y - p[LM.THUMB_MCP].y;
      const len = dist2d(p[LM.THUMB_TIP], p[LM.THUMB_MCP]) || 1e-6;
      if (dy / len < -0.6) pose = 'thumb_up';
      else if (dy / len > 0.6) pose = 'thumb_down';
      else pose = 'fist';
    } else {
      pose = 'fist';
    }
  } else if (ext >= 4 || (ext === 3 && f.thumb === 'ext' && curl === 0)) {
    pose = 'open';
  } else if (f.index === 'ext' && f.middle === 'ext' && f.ring !== 'ext' && f.pinky !== 'ext') {
    pose = 'victory';
  } else if (f.index === 'ext' && f.pinky === 'ext' && f.middle === 'curl' && f.ring === 'curl') {
    pose = f.thumb === 'ext' ? 'iloveyou' : 'unknown';
  } else if (f.index === 'ext' && f.middle !== 'ext' && f.ring !== 'ext' && f.pinky !== 'ext') {
    pose = 'point';
  }

  return { pose, fingers, scale, palm, pinchRatio: pr, thumbOut };
}
