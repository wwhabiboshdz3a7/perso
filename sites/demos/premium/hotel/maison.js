// Cour Sainte-Anne — « la maison en coupe » : une maquette procédurale de l'hôtel particulier,
// ouverte comme une maison de poupée. On la tourne au doigt ; chaque chambre se choisit en la touchant :
// elle s'éclaire, sa coupe passe au turquoise, et la fiche (sejour.js) donne surface, vue, prix et
// disponibilité aux dates choisies. Les chambres prises se hachurent.

import * as THREE from 'three';
import { studioEnvironment, softDisc, canvasTexture, seeded } from '../../assets/premium/kit.js';
import { ROOMS, onSejour, selectRoom } from './sejour.js';

const canvas = document.querySelector('[data-maison]');
const section = canvas?.closest('.maison');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- cotes de la maison (en mètres, à peu près) ----------
const X0 = -6, X1 = 6, XS = 2.5; // corps de logis de X0 à XS, cage d'escalier de XS à X1
const D = 3.4; // profondeur (la maison est coupée à son faîtage : z = 0)
const T = 0.22, SL = 0.2, CLAD = 0.08, LIN = 0.025; // murs, dalles, parement de brique, enduit
const Y1 = 3.0, Y2 = 5.9, Y3 = 8.4, RISE = 1.4; // planchers, haut du mur arrière, pente du toit
const WZ = 6.2, YW = 5.5, WRISE = 1.1; // aile : longueur, haut du mur, pente
const PIVOT_Z = 1.6;


// ---------- géométrie : tout est fusionné par matière ----------
class Build {
  constructor() { this.buckets = new Map(); }
  bucket(material) {
    let b = this.buckets.get(material);
    if (!b) this.buckets.set(material, (b = { p: [], n: [], u: [], i: [] }));
    return b;
  }
  face(material, points, hint) {
    const [a, b] = points, d = points[points.length - 1];
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const length = Math.hypot(...n) || 1;
    n = n.map((v) => v / length);
    let list = points;
    if (n[0] * hint[0] + n[1] * hint[1] + n[2] * hint[2] < 0) { list = [points[0], ...points.slice(1).reverse()]; n = n.map((v) => -v); }
    const k = this.bucket(material), base = k.p.length / 3;
    const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
    for (const v of list) {
      k.p.push(v[0], v[1], v[2]);
      k.n.push(n[0], n[1], n[2]);
      if (ax >= ay && ax >= az) k.u.push(v[2], v[1]); else if (ay >= az) k.u.push(v[0], v[2]); else k.u.push(v[0], v[1]);
    }
    for (let i = 1; i < list.length - 1; i++) k.i.push(base, base + i, base + i + 1);
  }
  box(material, xa, xb, ya, yb, za, zb) {
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), y0 = Math.min(ya, yb), y1 = Math.max(ya, yb), z0 = Math.min(za, zb), z1 = Math.max(za, zb);
    this.face(material, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0]);
    this.face(material, [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0]);
    this.face(material, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0]);
    this.face(material, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0]);
    this.face(material, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]);
    this.face(material, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1]);
  }
  // Polygone convexe (p, q) extrudé le long d'un axe : 'x' → (p, q) = (z, y) ; 'z' → (p, q) = (x, y).
  prism(material, axis, a0, a1, pts) {
    const P = axis === 'x' ? (p, q, a) => [a, q, p] : (p, q, a) => [p, q, a];
    const along = axis === 'x' ? [1, 0, 0] : [0, 0, 1];
    this.face(material, pts.map(([p, q]) => P(p, q, a0)), along.map((v) => -v));
    this.face(material, pts.map(([p, q]) => P(p, q, a1)), along);
    const cp = pts.reduce((s, v) => s + v[0], 0) / pts.length, cq = pts.reduce((s, v) => s + v[1], 0) / pts.length;
    pts.forEach((s, i) => {
      const e = pts[(i + 1) % pts.length];
      const out = P((s[0] + e[0]) / 2 - cp, (s[1] + e[1]) / 2 - cq, 0);
      this.face(material, [P(s[0], s[1], a0), P(e[0], e[1], a0), P(e[0], e[1], a1), P(s[0], s[1], a1)], out);
    });
  }
  // Géométrie three.js quelconque (cylindre, sphère…), placée par une matrice.
  add(material, geometry, matrix) {
    const k = this.bucket(material), base = k.p.length / 3;
    const g = geometry.clone().applyMatrix4(matrix);
    const pos = g.attributes.position, nor = g.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      k.p.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      k.n.push(nor.getX(i), nor.getY(i), nor.getZ(i));
      k.u.push(pos.getX(i), pos.getY(i));
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) k.i.push(base + g.index.getX(i));
    else for (let i = 0; i < pos.count; i++) k.i.push(base + i);
    g.dispose();
  }
  cyl(material, x, z, ya, yb, r0, r1 = r0, segments = 18) {
    this.add(material, new THREE.CylinderGeometry(r1, r0, yb - ya, segments), new THREE.Matrix4().makeTranslation(x, (ya + yb) / 2, z));
  }
  ball(material, x, y, z, r, sy = 1) {
    this.add(material, new THREE.IcosahedronGeometry(r, 2), new THREE.Matrix4().makeScale(1, sy, 1).setPosition(x, y, z));
  }
  finish(parent) {
    for (const [material, k] of this.buckets) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(k.p, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(k.n, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(k.u, 2));
      geometry.setIndex(k.i);
      parent.add(new THREE.Mesh(geometry, material));
    }
  }
}

// Une « cellule » : une pièce vue en coupe, avec son repère (u = largeur, v = profondeur, y = hauteur).
// frame 'main' : face ouverte vers +z ; frame 'wing' : face ouverte vers -x.
function makeCell(B, { frame, a0, a1, y0, cBack, cFront = cBack, extStart = false, extEnd = false }) {
  const ua = a0 + T / 2 + (extStart ? CLAD : 0);
  const W = a1 - a0 - T - (extStart ? CLAD : 0) - (extEnd ? CLAD : 0);
  const Dp = (frame === 'main' ? D : X1 - XS) - T;
  const main = frame === 'main';
  return {
    frame, y0, W, Dp, cBack, cFront, extStart, extEnd, ua,
    ceil: (v) => cFront + ((cBack - cFront) * v) / Dp,
    box(m, u0, u1, ya, yb, v0, v1) {
      if (main) B.box(m, ua + u0, ua + u1, y0 + ya, y0 + yb, -v0, -v1);
      else B.box(m, XS + v0, XS + v1, y0 + ya, y0 + yb, ua + u0, ua + u1);
    },
    prism(m, u0, u1, pts) {
      if (main) B.prism(m, 'x', ua + u0, ua + u1, pts.map(([v, y]) => [-v, y0 + y]));
      else B.prism(m, 'z', ua + u0, ua + u1, pts.map(([v, y]) => [XS + v, y0 + y]));
    },
    pt: (u, y, v) => (main ? new THREE.Vector3(ua + u, y0 + y, -v) : new THREE.Vector3(XS + v, y0 + y, ua + u)),
    cyl(m, u, v, ya, yb, r0, r1 = r0, segments = 18) { const p = this.pt(u, 0, v); B.cyl(m, p.x, p.z, y0 + ya, y0 + yb, r0, r1, segments); },
    // mur le long de u, percé d'ouvertures [{ u0, u1, ya, yb }]
    wall(m, us, ue, ya, yb, v0, v1, openings = []) {
      let u = us;
      for (const o of [...openings].sort((p, q) => p.u0 - q.u0)) {
        if (o.u0 > u) this.box(m, u, o.u0, ya, yb, v0, v1);
        if (o.ya > ya) this.box(m, o.u0, o.u1, ya, o.ya, v0, v1);
        if (o.yb < yb) this.box(m, o.u0, o.u1, o.yb, yb, v0, v1);
        u = o.u1;
      }
      if (u < ue) this.box(m, u, ue, ya, yb, v0, v1);
    },
  };
}

function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  let visible = false, awakeUntil = 0, last = performance.now(), time = 0, width = 1, height = 1, interacted = false;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 140);
  scene.environment = studioEnvironment(renderer, {
    ambient: '#8d8479',
    panels: [
      { size: [14, 14], color: '#fff6ea', intensity: 2.2, position: [0, 12, 2] },
      { size: [8, 8], color: '#ffe6c9', intensity: 2.4, position: [-10, 5, 8] },
      { size: [6, 8], color: '#dfeaf5', intensity: 1.6, position: [10, 4, 4] },
    ],
  });
  const hemi = new THREE.HemisphereLight('#ffffff', '#d9c6ae', 0.9);
  const key = new THREE.DirectionalLight('#fff2df', 2.2);
  key.position.set(-7, 10, 12);
  const side = new THREE.DirectionalLight('#ffe9d2', 0.7);
  side.position.set(9, 5, 5);
  scene.add(hemi, key, side);

  const turn = new THREE.Group(); // tourne autour de la verticale
  const model = new THREE.Group();
  model.position.z = -PIVOT_Z;
  turn.add(model);
  scene.add(turn);
  const shadow = softDisc({ radius: 13.5, color: '#3b2a1e', opacity: 0.34, y: -0.5, falloff: 2.1 });
  turn.add(shadow);

  // ---------- matières ----------
  const std = (color, roughness = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const brickMap = brickTexture();
  const M = {
    brick: std('#ffffff', 0.92, { map: brickMap }),
    poche: std('#2a211b', 0.9),
    base: std('#f3ebde', 0.95),
    paving: std('#ffffff', 0.95, { map: pavingTexture() }),
    stone: std('#eadfcd', 0.9),
    cream: std('#f1e7d6', 0.95, { emissive: '#ffbf7a', emissiveIntensity: 0 }),
    oak: std('#ffffff', 0.7, { map: plankTexture() }),
    tomette: std('#d39f84', 0.8),
    roof: std('#a8634b', 0.9),
    tile: std('#ffffff', 0.85),
    shutter: std('#9eb4b6', 0.75),
    door: std('#2f4a3f', 0.6),
    linen: std('#f1e9da', 0.95),
    white: std('#fcf9f3', 0.6),
    wood: std('#b08a62', 0.7),
    dark: std('#4a3d33', 0.6),
    zellige: std('#57b7ad', 0.22),
    olive: std('#8d9a74', 0.95),
    sofa: std('#8f9d7c', 0.95),
    trunk: std('#6f5d4c', 0.9),
    pot: std('#c27b58', 0.85),
    glass: std('#bcd6d8', 0.15, { emissive: '#ffcf8f', emissiveIntensity: 0.15 }),
    lampCommon: std('#fff3dc', 0.6, { emissive: '#ffc98a', emissiveIntensity: 0.4 }),
  };
  const B = new Build();

  // ---------- socle, cour, bassin ----------
  B.box(M.base, -7.1, 7.1, -0.5, -0.02, -D - 1.3, WZ + 1.7);
  B.box(M.paving, -7.1, 7.1, -0.02, 0, -D - 1.3, WZ + 1.7);
  const pool = { x0: -4.9, x1: 0.9, z0: 2.5, z1: 4.75 };
  B.box(M.stone, pool.x0 - 0.26, pool.x1 + 0.26, 0, 0.09, pool.z0 - 0.26, pool.z0);
  B.box(M.stone, pool.x0 - 0.26, pool.x1 + 0.26, 0, 0.09, pool.z1, pool.z1 + 0.26);
  B.box(M.stone, pool.x0 - 0.26, pool.x0, 0, 0.09, pool.z0, pool.z1);
  B.box(M.stone, pool.x1, pool.x1 + 0.26, 0, 0.09, pool.z0, pool.z1);
  const water = waterMaterial(pool.x1 - pool.x0, pool.z1 - pool.z0);
  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(pool.x1 - pool.x0, pool.z1 - pool.z0).rotateX(-Math.PI / 2), water);
  waterMesh.position.set((pool.x0 + pool.x1) / 2, 0.06, (pool.z0 + pool.z1) / 2);
  model.add(waterMesh);

  // transats, table en pierre du petit-déjeuner, oliviers en pot
  for (const x of [-4.5, -3.45]) {
    B.box(M.wood, x - 0.33, x + 0.33, 0.12, 0.2, 5.3, 7.15);
    B.box(M.linen, x - 0.3, x + 0.3, 0.2, 0.3, 5.9, 7.12);
    B.prism(M.linen, 'x', x - 0.3, x + 0.3, [[5.9, 0.2], [5.9, 0.3], [5.32, 0.62], [5.32, 0.52]]);
  }
  B.box(M.stone, -1.3, 0.5, 0.7, 0.8, 5.65, 6.5);
  B.box(M.stone, -1.1, -0.9, 0, 0.7, 5.8, 6.35);
  B.box(M.stone, 0.1, 0.3, 0, 0.7, 5.8, 6.35);
  for (const [x, z] of [[-0.95, 5.35], [0.1, 5.35], [-0.95, 6.8], [0.1, 6.8]]) B.cyl(M.wood, x, z, 0, 0.44, 0.17);
  for (const [x, z] of [[-0.85, 5.95], [0.05, 6.2]]) B.cyl(M.white, x, z, 0.8, 0.83, 0.13);
  B.cyl(M.pot, -0.4, 6.07, 0.8, 0.95, 0.07, 0.09);
  const tree = (x, z, s = 1) => {
    B.cyl(M.pot, x, z, 0, 0.5 * s, 0.26 * s, 0.38 * s);
    B.cyl(M.trunk, x, z, 0.5 * s, 1.55 * s, 0.07 * s, 0.05 * s, 8);
    B.ball(M.olive, x, 2.05 * s, z, 0.72 * s, 0.85);
    B.ball(M.olive, x + 0.42 * s, 1.8 * s, z + 0.2 * s, 0.48 * s);
    B.ball(M.olive, x - 0.4 * s, 1.9 * s, z - 0.22 * s, 0.5 * s);
  };
  tree(-5.75, 1.15);
  tree(1.55, 1.25, 0.9);
  tree(1.45, 7.0, 1.05);
  for (const x of [-3.2, -1.2]) { B.cyl(M.pot, x, 0.75, 0, 0.36, 0.2, 0.27); B.ball(M.olive, x, 0.66, 0.75, 0.33); }

  // ---------- pièces ----------
  const cells = {};
  const rooms = []; // les cinq chambres, avec leurs matières propres

  function buildCell(id, spec, { shell = M.cream, floor = M.oak, glass = M.glass, upper = true, windows = [], door = null } = {}) {
    const c = makeCell(B, spec);
    cells[id] = c;
    const { W, Dp, cBack, cFront } = c;
    const profile = [[0, 0], [Dp, 0], [Dp, cBack], [0, cFront]];
    if (upper) c.box(M.poche, -T / 2, W + T / 2, -SL, -LIN, 0, Dp);
    c.box(floor, -T / 2, W + T / 2, -LIN, 0, 0, Dp);
    c.prism(M.poche, -T / 2, 0, profile);
    c.prism(M.poche, W, W + T / 2, profile);
    const outside = [[0, -SL], [Dp + T, -SL], [Dp + T, cBack], [0, cFront]];
    if (c.extStart) c.prism(M.brick, -T / 2 - CLAD, -T / 2, outside);
    if (c.extEnd) c.prism(M.brick, W + T / 2, W + T / 2 + CLAD, outside);
    c.prism(shell, 0, LIN, profile);
    c.prism(shell, W - LIN, W, profile);
    c.prism(shell, LIN, W - LIN, [[0, cFront - 0.02], [Dp, cBack - 0.02], [Dp, cBack], [0, cFront]]);
    const holes = door ? [...windows, door] : windows;
    c.wall(M.brick, -T / 2 - (c.extStart ? CLAD : 0), W + T / 2 + (c.extEnd ? CLAD : 0), -SL, cBack, Dp, Dp + T, holes);
    c.wall(shell, LIN, W - LIN, 0, cBack - 0.02, Dp - LIN, Dp, holes);
    for (const o of windows) dressWindow(c, o, glass);
    if (door) dressDoor(c, door);
    return c;
  }

  function dressWindow(c, o, glass, fake = false) {
    const vo = c.Dp + T, f = 0.09, um = (o.u0 + o.u1) / 2, w = (o.u1 - o.u0) / 2;
    if (fake) c.box(glass, o.u0, o.u1, o.ya, o.yb, vo, vo + 0.02);
    else c.box(glass, o.u0, o.u1, o.ya, o.yb, c.Dp + T * 0.45, c.Dp + T * 0.55);
    c.box(M.stone, o.u0 - f, o.u1 + f, o.yb, o.yb + f * 1.7, vo - 0.02, vo + 0.05);
    c.box(M.stone, o.u0 - f - 0.04, o.u1 + f + 0.04, o.ya - f, o.ya, vo - 0.02, vo + 0.09);
    c.box(M.stone, o.u0 - f, o.u0, o.ya, o.yb, vo - 0.02, vo + 0.04);
    c.box(M.stone, o.u1, o.u1 + f, o.ya, o.yb, vo - 0.02, vo + 0.04);
    const g0 = fake ? vo + 0.02 : c.Dp + T * 0.38, g1 = fake ? vo + 0.035 : c.Dp + T * 0.62;
    c.box(M.white, um - 0.025, um + 0.025, o.ya, o.yb, g0, g1);
    for (const k of [1 / 3, 2 / 3]) { const y = lerp(o.ya, o.yb, k); c.box(M.white, o.u0, o.u1, y - 0.018, y + 0.018, g0, g1); }
    c.box(M.shutter, o.u0 - f - w, o.u0 - f - 0.02, o.ya, o.yb, vo, vo + 0.05);
    c.box(M.shutter, o.u1 + f + 0.02, o.u1 + f + w, o.ya, o.yb, vo, vo + 0.05);
    if (!fake) {
      c.box(M.linen, o.u0 - 0.24, o.u0 - 0.02, Math.max(0.04, o.ya - 0.5), o.yb + 0.12, c.Dp - 0.1, c.Dp - 0.04);
      c.box(M.linen, o.u1 + 0.02, o.u1 + 0.24, Math.max(0.04, o.ya - 0.5), o.yb + 0.12, c.Dp - 0.1, c.Dp - 0.04);
    }
  }
  function dressDoor(c, o) {
    const vo = c.Dp + T, f = 0.2;
    c.box(M.stone, o.u0 - f, o.u0, 0, o.yb, vo - 0.02, vo + 0.07);
    c.box(M.stone, o.u1, o.u1 + f, 0, o.yb, vo - 0.02, vo + 0.07);
    c.box(M.stone, o.u0 - f - 0.05, o.u1 + f + 0.05, o.yb, o.yb + 0.3, vo - 0.02, vo + 0.1);
    c.box(M.stone, (o.u0 + o.u1) / 2 - 0.16, (o.u0 + o.u1) / 2 + 0.16, o.yb + 0.3, o.yb + 0.52, vo - 0.02, vo + 0.12);
    c.box(M.door, o.u0 - 0.02, o.u0 + 0.05, 0, o.yb - 0.05, c.Dp - 0.95, c.Dp + 0.05);
    c.box(M.door, o.u1 - 0.05, o.u1 + 0.02, 0, o.yb - 0.05, c.Dp - 0.95, c.Dp + 0.05);
  }

  // mobilier
  const bed = (c, ub, width, accent, head = M.linen) => {
    const v1 = c.Dp - LIN - 0.01, L = 2.0, h = width / 2;
    c.box(M.wood, ub - h, ub + h, 0.06, 0.3, v1 - L, v1);
    c.box(M.white, ub - h + 0.03, ub + h - 0.03, 0.3, 0.52, v1 - L + 0.03, v1 - 0.1);
    c.box(accent, ub - h - 0.02, ub + h + 0.02, 0.28, 0.545, v1 - L + 0.015, v1 - L + 0.66);
    c.box(M.linen, ub - h + 0.1, ub - 0.05, 0.52, 0.65, v1 - 0.64, v1 - 0.16);
    c.box(M.linen, ub + 0.05, ub + h - 0.1, 0.52, 0.65, v1 - 0.64, v1 - 0.16);
    c.box(head, ub - h - 0.06, ub + h + 0.06, 0.06, 1.22, v1 - 0.1, v1);
  };
  const bedside = (c, u, lamp) => {
    const v1 = c.Dp - LIN - 0.03;
    c.box(M.wood, u - 0.19, u + 0.19, 0, 0.46, v1 - 0.38, v1);
    c.cyl(M.dark, u, v1 - 0.19, 0.46, 0.68, 0.02);
    c.cyl(lamp, u, v1 - 0.19, 0.66, 0.86, 0.13, 0.08);
  };
  const bath = (c, atEnd, zone, tub = true) => {
    const { W, Dp } = c, u0 = atEnd ? W - zone : 0, u1 = atEnd ? W : zone, wall = atEnd ? u0 : u1, h = Math.min(2.2, c.cBack - 0.2);
    c.box(M.linen, wall - 0.04, wall + 0.04, 0, h, 1.0, Dp - LIN);
    c.box(M.zellige, u0 + (atEnd ? 0.04 : LIN), u1 - (atEnd ? LIN : 0.04), 0, 0.014, 1.0, Dp - LIN);
    const ta = u0 + 0.12, tb = u1 - 0.12;
    if (tub) {
      c.box(M.white, ta, tb, 0, 0.56, Dp - 0.92, Dp - 0.1);
      c.box(M.zellige, ta + 0.07, tb - 0.07, 0.56, 0.565, Dp - 0.85, Dp - 0.17);
    } else {
      c.box(M.white, ta, tb, 0, 0.08, Dp - 1.0, Dp - 0.1);
      c.box(M.glass, ta, tb, 0.08, 1.9, Dp - 1.02, Dp - 1.0);
    }
    const side = atEnd ? u1 - LIN : u0 + LIN, dir = atEnd ? -1 : 1;
    c.box(M.wood, side, side + dir * 0.42, 0.5, 0.8, 1.12, 1.78);
    c.box(M.white, side, side + dir * 0.46, 0.8, 0.88, 1.08, 1.82);
    c.box(M.glass, side, side + dir * 0.02, 1.15, 1.85, 1.2, 1.7);
  };
  const armchair = (c, u, v, m) => {
    c.box(m, u - 0.32, u + 0.32, 0.1, 0.4, v - 0.3, v + 0.3);
    c.box(m, u - 0.32, u + 0.32, 0.4, 0.82, v + 0.2, v + 0.34);
    c.box(m, u - 0.38, u - 0.3, 0.1, 0.58, v - 0.3, v + 0.34);
    c.box(m, u + 0.3, u + 0.38, 0.1, 0.58, v - 0.3, v + 0.34);
  };
  const roundTable = (c, u, v, r, h, top = M.stone) => { c.cyl(M.dark, u, v, 0, h - 0.04, 0.035); c.cyl(top, u, v, h - 0.04, h, r); };
  const rug = (c, u0, u1, v0, v1, m) => c.box(m, u0, u1, 0, 0.016, v0, v1);

  // rez-de-chaussée : porche, salon, cuisine de l'aile
  const H0 = Y1 - SL - 0.03, H1 = Y2 - SL - Y1;
  const porch = buildCell('porche', { frame: 'main', a0: X0, a1: -3.4, y0: 0.03, cBack: H0, extStart: true }, { floor: M.stone, upper: false, door: { u0: 0.3, u1: 2.0, ya: 0, yb: 2.45 } });
  porch.box(M.wood, 0.1, 0.5, 0, 0.42, 0.5, 1.7);
  porch.cyl(M.dark, 1.15, 1.4, H0 - 0.5, H0 - 0.02, 0.012);
  porch.cyl(M.lampCommon, 1.15, 1.4, H0 - 0.8, H0 - 0.5, 0.1, 0.13, 6);
  const salon = buildCell('salon', { frame: 'main', a0: -3.4, a1: XS, y0: 0.03, cBack: H0 }, { floor: M.tomette, upper: false, windows: [{ u0: 0.55, u1: 1.45, ya: 0.45, yb: 2.3 }, { u0: 4.2, u1: 5.1, ya: 0.45, yb: 2.3 }] });
  salon.box(M.stone, 2.3, 3.4, 0, 1.25, salon.Dp - 0.3, salon.Dp - LIN);
  salon.box(M.dark, 2.55, 3.15, 0, 0.8, salon.Dp - 0.32, salon.Dp - 0.29);
  salon.box(M.glass, 2.45, 3.25, 1.45, 2.3, salon.Dp - 0.06, salon.Dp - LIN);
  salon.box(M.sofa, 1.9, 3.8, 0.1, 0.42, 1.55, 2.25);
  salon.box(M.sofa, 1.9, 3.8, 0.42, 0.8, 1.55, 1.72);
  rug(salon, 1.6, 4.1, 1.5, 3.0, M.linen);
  salon.box(M.wood, 0.5, 4.9, 0.72, 0.78, 0.35, 1.05);
  for (const u of [0.65, 4.75]) salon.box(M.wood, u - 0.05, u + 0.05, 0, 0.72, 0.45, 0.95);
  for (let i = 0; i < 5; i++) { salon.cyl(M.dark, 1.0 + i * 0.85, 0.2, 0, 0.44, 0.15); salon.cyl(M.white, 1.0 + i * 0.85, 0.62, 0.78, 0.8, 0.12); }
  for (const u of [1.6, 3.8]) { salon.cyl(M.dark, u, 0.7, H0 - 0.7, H0 - 0.02, 0.012); salon.cyl(M.lampCommon, u, 0.7, H0 - 0.95, H0 - 0.7, 0.2, 0.06); }
  salon.box(M.wood, LIN, 0.34, 0, 2.1, 1.3, 2.9);
  const DW = X1 - XS - T;
  const kitchen = buildCell('cuisine', { frame: 'wing', a0: 0, a1: WZ, y0: 0.03, cBack: H0, extEnd: true }, { floor: M.tomette, upper: false, windows: [{ u0: 0.9, u1: 1.7, ya: 1.1, yb: 2.25 }, { u0: 3.9, u1: 4.7, ya: 1.1, yb: 2.25 }] });
  kitchen.box(M.wood, 0.3, 5.6, 0, 0.88, DW - 0.62, DW - LIN);
  kitchen.box(M.stone, 0.26, 5.64, 0.88, 0.94, DW - 0.66, DW - LIN);
  for (const y of [1.55, 1.95]) kitchen.box(M.wood, 2.0, 3.6, y, y + 0.04, DW - 0.28, DW - LIN);
  for (let i = 0; i < 5; i++) kitchen.cyl(i % 2 ? M.pot : M.white, 2.2 + i * 0.3, DW - 0.15, 1.59, 1.75, 0.07);
  kitchen.box(M.wood, 1.7, 4.2, 0.82, 0.9, 1.0, 1.75);
  kitchen.box(M.linen, 1.8, 4.1, 0, 0.82, 1.08, 1.67);
  for (let i = 0; i < 3; i++) kitchen.cyl(M.dark, 2.15 + i * 0.8, 0.7, 0, 0.6, 0.15);
  for (const u of [2.4, 3.5]) { kitchen.cyl(M.dark, u, 1.38, H0 - 0.6, H0 - 0.02, 0.012); kitchen.cyl(M.lampCommon, u, 1.38, H0 - 0.82, H0 - 0.6, 0.16, 0.05); }

  // les cinq chambres
  const roomSpecs = {
    pastel: { spec: { frame: 'main', a0: X0, a1: -1.9, y0: Y1, cBack: H1, extStart: true }, windows: [{ u0: 2.85, u1: 3.6, ya: 0.5, yb: 2.25 }, { u0: 0.3, u1: 0.85, ya: 1.25, yb: 2.05 }],
      furnish(c, m) { bath(c, false, 1.15, false); bed(c, 1.98, 1.4, m.accent); bedside(c, 1.08 + 0.02, m.lamp); rug(c, 1.3, 3.3, 0.35, 1.25, m.accentSoft); armchair(c, 3.2, 1.2, M.linen); } },
    violette: { spec: { frame: 'main', a0: -1.9, a1: XS, y0: Y1, cBack: H1 }, windows: [{ u0: 0.2, u1: 0.95, ya: 0.5, yb: 2.25 }, { u0: 3.3, u1: 3.85, ya: 1.25, yb: 2.05 }],
      furnish(c, m) { bath(c, true, 1.3, true); bed(c, 1.92, 1.6, m.accent); bedside(c, 0.9, m.lamp); rug(c, 0.5, 2.7, 0.3, 1.25, m.accentSoft); armchair(c, 0.6, 1.0, m.accent); roundTable(c, 1.35, 0.75, 0.24, 0.5); } },
    olivier: { spec: { frame: 'wing', a0: 0, a1: WZ, y0: Y1, cBack: YW - Y1, cFront: YW - Y1 + WRISE, extEnd: true }, windows: [{ u0: 0.45, u1: 1.15, ya: 0.6, yb: 2.1 }, { u0: 1.5, u1: 2.2, ya: 0.6, yb: 2.1 }, { u0: 4.95, u1: 5.5, ya: 1.2, yb: 2.0 }],
      furnish(c, m) { bath(c, true, 1.4, true); bed(c, 3.4, 1.8, m.accent); bedside(c, 2.28, m.lamp); bedside(c, 4.32 - 0.02, m.lamp); c.box(m.accent, 0.3, 2.3, 0.08, 0.42, c.Dp - 0.8, c.Dp - 0.1); c.box(M.linen, 0.4, 0.9, 0.42, 0.56, c.Dp - 0.6, c.Dp - 0.14); rug(c, 0.5, 4.3, 0.4, 1.3, m.accentSoft); roundTable(c, 1.3, 1.5, 0.3, 0.55, M.wood); } },
    toits: { spec: { frame: 'main', a0: X0, a1: -2.3, y0: Y2, cBack: Y3 - Y2, cFront: Y3 - Y2 + RISE, extStart: true }, windows: [{ u0: 2.6, u1: 3.25, ya: 0.75, yb: 2.0 }],
      furnish(c, m) { bath(c, false, 1.05, false); bed(c, 1.85, 1.4, m.accent); bedside(c, 2.76, m.lamp); rug(c, 1.2, 3.1, 0.35, 1.2, m.accentSoft); c.box(M.wood, 2.5, 3.3, 0, 0.72, 0.3, 0.75); c.cyl(M.dark, 2.9, 0.1, 0, 0.42, 0.14); } },
    suite: { spec: { frame: 'main', a0: -2.3, a1: XS, y0: Y2, cBack: Y3 - Y2, cFront: Y3 - Y2 + RISE }, windows: [{ u0: 2.2, u1: 3.05, ya: 0.3, yb: 2.1 }],
      furnish(c, m) { bath(c, true, 1.3, true); bed(c, 1.12, 1.8, m.accent); bedside(c, 0.0 + 0.2 - 0.02, m.lamp); rug(c, 0.4, 3.1, 0.25, 1.15, m.accentSoft); armchair(c, 2.75, 1.35, M.sofa); roundTable(c, 2.1, 0.9, 0.3, 0.6); c.cyl(M.white, 2.1, 0.9, 0.6, 0.66, 0.06); c.box(M.sofa, 0.3, 1.9, 0.08, 0.4, 0.35, 0.85); } },
  };
  for (const info of ROOMS) {
    const def = roomSpecs[info.id];
    const accent = new THREE.Color(info.accent);
    const mats = {
      shell: std('#f1e7d6', 0.95, { emissive: '#ffb968', emissiveIntensity: 0 }),
      glass: std('#bcd6d8', 0.15, { emissive: '#ffcf8f', emissiveIntensity: 0.1 }),
      lamp: std('#fff3dc', 0.6, { emissive: '#ffc37a', emissiveIntensity: 0.3 }),
      accent: std(accent, 0.9),
      accentSoft: std(accent.clone().lerp(new THREE.Color('#efe6da'), 0.55), 0.95),
    };
    const c = buildCell(info.id, def.spec, { shell: mats.shell, glass: mats.glass, windows: def.windows });
    def.furnish(c, mats);

    // cadre turquoise sur la coupe, hachures « complet », volume cliquable
    const F = new Build();
    const frameMaterial = new THREE.MeshBasicMaterial({ color: '#1f9d97', transparent: true, opacity: 0, toneMapped: false });
    const fc = makeCell(F, def.spec);
    const top = c.cFront, thick = def.spec.cFront !== undefined ? 0.16 : SL;
    fc.box(frameMaterial, -T / 2, 0, -SL, top + thick, -0.035, 0.03);
    fc.box(frameMaterial, c.W, c.W + T / 2, -SL, top + thick, -0.035, 0.03);
    fc.box(frameMaterial, 0, c.W, -SL, 0, -0.035, 0.03);
    fc.box(frameMaterial, 0, c.W, top, top + thick, -0.035, 0.03);
    const frameGroup = new THREE.Group();
    F.finish(frameGroup);
    model.add(frameGroup);

    const hatch = new THREE.Mesh(new THREE.PlaneGeometry(c.W, top), new THREE.MeshBasicMaterial({ map: hatchTexture(), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    const uv = hatch.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * c.W * 1.6, uv.getY(i) * top * 1.6);
    hatch.position.copy(c.pt(c.W / 2, top / 2, -0.05));
    if (c.frame === 'wing') hatch.rotation.y = -Math.PI / 2;
    hatch.renderOrder = 3;
    model.add(hatch);

    const pick = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
    const lo = c.pt(0, 0, 0), hi = c.pt(c.W, c.cBack, c.Dp);
    pick.position.copy(lo).add(hi).multiplyScalar(0.5);
    pick.scale.set(Math.abs(hi.x - lo.x), Math.abs(hi.y - lo.y), Math.abs(hi.z - lo.z));
    pick.visible = false;
    pick.userData.id = info.id;
    model.add(pick);

    rooms.push({
      id: info.id, info, cell: c, mats, frameMaterial, frameGroup, hatch, pick,
      anchor: c.pt(c.W / 2, c.cFront * 0.56, 0), lightAt: c.pt(c.W / 2, c.cBack - 0.5, c.Dp * 0.45),
      normal: c.frame === 'main' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(-1, 0, 0),
      sel: 0, off: 0, hover: 0, wantSel: 0, wantOff: 0,
    });
  }

  // cage d'escalier (fermée), corniches, toits
  B.box(M.brick, XS, X1, -SL, Y3, -D, 0);
  B.prism(M.brick, 'x', XS, X1, [[-D, Y3], [0, Y3], [0, Y3 + RISE]]);
  const tower = makeCell(B, { frame: 'main', a0: XS - T / 2, a1: X1 + T / 2, y0: 0, cBack: Y3 });
  for (const [ya, yb] of [[0.5, 2.3], [Y1 + 0.5, Y1 + 2.25], [Y2 + 0.75, Y2 + 2.0]]) dressWindow(tower, { u0: 1.3, u1: 2.15, ya, yb }, M.glass, true);
  const towerSide = makeCell(B, { frame: 'wing', a0: -D - T / 2, a1: T / 2, y0: 0, cBack: Y3 });
  for (const [ya, yb] of [[Y1 + 0.5, Y1 + 2.25], [Y2 + 0.75, Y2 + 2.0]]) dressWindow(towerSide, { u0: 1.2, u1: 2.0, ya, yb }, M.glass, true);
  for (const y of [Y1 - 0.14, Y2 - 0.14]) B.box(M.stone, X0 - 0.03, X1 + 0.03, y, y + 0.1, -D - 0.05, -D);
  B.box(M.stone, X0 - 0.06, X1 + 0.06, Y3 - 0.42, Y3 - 0.2, -D - 0.1, -D);
  B.box(M.stone, X1, X1 + 0.05, Y1 - 0.14, Y1 - 0.04, -D, WZ);

  const tiles = [];
  { // toit du corps de logis : une seule pente, du faîtage (la coupe) vers la rue
    const front = Y2 + (Y3 - Y2) + RISE, slope = -RISE / (D - T), vE = D + 0.42, yE = front + slope * vE;
    B.prism(M.roof, 'x', X0 - 0.3, X1 + 0.3, [[0, front], [-vE, yE], [-vE, yE + 0.16], [0, front + 0.16]]);
    for (let x = X0 - 0.3 + 0.17; x < X1 + 0.3; x += 0.34) tiles.push([new THREE.Vector3(x, front + 0.17, 0), new THREE.Vector3(x, yE + 0.17, -vE - 0.06)]);
  }
  { // toit de l'aile
    const front = Y1 + YW - Y1 + WRISE, slope = -WRISE / DW, vE = X1 - XS + 0.38, yE = front + slope * vE;
    B.prism(M.roof, 'z', 0, WZ + 0.3, [[XS, front], [XS + vE, yE], [XS + vE, yE + 0.16], [XS, front + 0.16]]);
    for (let z = 0.17; z < WZ + 0.3; z += 0.34) tiles.push([new THREE.Vector3(XS, front + 0.17, z), new THREE.Vector3(XS + vE + 0.06, yE + 0.17, z)]);
  }
  const tileMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.17, 1, 7, 1, true, 0, Math.PI), M.tile, tiles.length);
  const rnd = seeded(7), matrix = new THREE.Matrix4(), tint = new THREE.Color();
  tiles.forEach(([a, b], i) => {
    const s = b.clone().sub(a), length = s.length();
    s.normalize();
    const n = Math.abs(s.z) > Math.abs(s.x) ? new THREE.Vector3(0, -s.z, s.y) : new THREE.Vector3(-s.y, s.x, 0);
    if (n.y < 0) n.negate();
    matrix.makeBasis(n, s, n.clone().cross(s)).scale(new THREE.Vector3(1, length, 1)).setPosition(a.clone().add(b).multiplyScalar(0.5));
    tileMesh.setMatrixAt(i, matrix);
    tileMesh.setColorAt(i, tint.setHSL(0.045 + rnd() * 0.02, 0.5, 0.6 + rnd() * 0.1));
  });
  tileMesh.material.side = THREE.DoubleSide;
  model.add(tileMesh);
  B.finish(model);

  // lumières propres à la maquette : la chambre choisie, le bassin le soir
  const roomLight = new THREE.PointLight('#ffd09a', 0, 4.4, 1.6);
  const poolLight = new THREE.PointLight('#4fdccd', 0, 9, 1.4);
  poolLight.position.set((pool.x0 + pool.x1) / 2, 0.9, (pool.z0 + pool.z1) / 2);
  model.add(roomLight, poolLight);

  // ---------- pastilles numérotées (de vrais boutons, au-dessus du canvas) ----------
  const pins = document.querySelector('[data-pins]');
  for (const room of rooms) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pin';
    button.setAttribute('aria-label', `Chambre ${room.info.n}, ${room.info.name}`);
    const label = document.createElement('span');
    label.textContent = room.info.n;
    const name = document.createElement('i');
    name.textContent = room.info.name;
    label.append(name);
    button.append(label);
    button.addEventListener('click', () => { selectRoom(room.id); interacted = true; wake(); });
    pins?.append(button);
    room.pin = button;
  }

  let selected = null;
  onSejour((state) => {
    for (const room of rooms) {
      const status = state.status[room.id];
      room.wantSel = state.room === room.id ? 1 : 0;
      room.wantOff = status.free ? 0 : 1;
      room.pin.classList.toggle('is-on', state.room === room.id);
      room.pin.classList.toggle('is-off', !status.free);
      room.pin.setAttribute('aria-pressed', String(state.room === room.id));
      room.pin.setAttribute('aria-label', `Chambre ${room.info.n}, ${room.info.name}, ${status.label}`);
      if (state.room === room.id) selected = room;
    }
    if (selected) roomLight.position.copy(selected.lightAt);
    wake();
  });

  // ---------- matin / soir ----------
  let mood = 0, wantMood = 0;
  for (const button of document.querySelectorAll('[data-mood]')) {
    button.addEventListener('click', () => {
      wantMood = button.dataset.mood === 'soir' ? 1 : 0;
      section.classList.toggle('is-night', wantMood === 1);
      for (const other of document.querySelectorAll('[data-mood]')) {
        other.classList.toggle('is-on', other === button);
        other.setAttribute('aria-pressed', String(other === button));
      }
      wake();
    });
  }
  const dayKey = new THREE.Color('#fff2df'), nightKey = new THREE.Color('#8ea4d8'), daySky = new THREE.Color('#ffffff'), nightSky = new THREE.Color('#6d83ba');
  const shellDay = new THREE.Color('#f1e7d6'), shellOff = new THREE.Color('#cfc4b6');

  // ---------- rotation, sélection ----------
  const YAW0 = 0.5;
  let yaw = YAW0, pitch = 0.36, velocity = 0, dragging = false, moved = 0, lastX = 0, lastY = 0;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const picks = rooms.map((room) => room.pick);
  function roomAt(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    scene.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(picks, false)[0];
    return hit ? rooms.find((room) => room.id === hit.object.userData.id) : null;
  }
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true; moved = 0; lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    wake();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) {
      if (event.pointerType === 'mouse') {
        const over = roomAt(event);
        for (const room of rooms) room.wantHover = room === over ? 1 : 0;
        canvas.classList.toggle('is-over', Boolean(over));
        wake();
      }
      return;
    }
    const dx = event.clientX - lastX, dy = event.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 6) interacted = true;
    yaw += dx * 0.008;
    pitch = clamp(pitch + dy * 0.004, 0.12, 0.95);
    velocity = dx * 0.5;
    lastX = event.clientX; lastY = event.clientY;
    wake();
  });
  canvas.addEventListener('pointerup', (event) => {
    if (dragging && moved <= 6) {
      const room = roomAt(event);
      if (room) { selectRoom(room.id); interacted = true; }
    }
    dragging = false;
  });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('pointerleave', () => { for (const room of rooms) room.wantHover = 0; canvas.classList.remove('is-over'); });
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') yaw -= 0.18;
    else if (event.key === 'ArrowRight') yaw += 0.18;
    else if (event.key === 'ArrowUp') pitch = clamp(pitch + 0.08, 0.12, 0.95);
    else if (event.key === 'ArrowDown') pitch = clamp(pitch - 0.08, 0.12, 0.95);
    else return;
    interacted = true;
    event.preventDefault();
    wake();
  });

  // ---------- rendu : seulement à l'écran ; en mouvement réduit, seulement quand quelque chose change ----------
  function wake() { awakeUntil = performance.now() + 2200; }
  function resize() {
    width = canvas.clientWidth; height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    const aspect = width / height, half = Math.max(7.5, 10.1 / aspect);
    camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half;
    camera.updateProjectionMatrix();
    wake();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) wake(); }).observe(canvas);

  const projected = new THREE.Vector3(), facing = new THREE.Vector3(), viewDir = new THREE.Vector3();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!visible || (reduced && now > awakeUntil)) return;
    time += dt;
    const ease = 1 - Math.exp(-(reduced ? 40 : 7) * dt);
    mood = lerp(mood, wantMood, 1 - Math.exp(-(reduced ? 40 : 3) * dt));
    if (!dragging) { yaw += velocity * dt; velocity *= Math.exp(-3 * dt); }
    const sway = interacted || reduced ? 0 : Math.sin(time * 0.4) * 0.2;
    turn.rotation.y = yaw + sway;
    viewDir.set(0, Math.sin(pitch), Math.cos(pitch));
    camera.position.copy(viewDir).multiplyScalar(60);
    camera.position.y += 2.9;
    camera.lookAt(0, 2.9, 0);

    // ambiance
    key.intensity = lerp(2.2, 0.3, mood); key.color.copy(dayKey).lerp(nightKey, mood);
    side.intensity = lerp(0.7, 0.08, mood);
    hemi.intensity = lerp(0.9, 0.2, mood); hemi.color.copy(daySky).lerp(nightSky, mood);
    scene.environmentIntensity = lerp(0.75, 0.1, mood);
    M.glass.emissiveIntensity = lerp(0.12, 1.5, mood);
    M.cream.emissiveIntensity = lerp(0, 0.34, mood);
    M.lampCommon.emissiveIntensity = lerp(0.3, 2.2, mood);
    shadow.material.opacity = lerp(0.34, 0, mood);
    water.uniforms.uTime.value = reduced ? 2 : time;
    water.uniforms.uGlow.value = lerp(0.0, 1.0, mood);
    poolLight.intensity = mood * 14;

    let light = 0;
    for (const room of rooms) {
      room.sel = lerp(room.sel, room.wantSel, ease);
      room.off = lerp(room.off, room.wantOff, ease);
      room.hover = lerp(room.hover, room.wantHover || 0, ease);
      const m = room.mats;
      m.shell.color.copy(shellDay).lerp(shellOff, room.off * (1 - room.sel * 0.5));
      m.shell.emissiveIntensity = room.sel * lerp(0.3, 0.55, mood) + room.hover * 0.08 + mood * 0.04;
      m.glass.emissiveIntensity = 0.1 + room.sel * 1.6 + mood * 0.25;
      m.lamp.emissiveIntensity = 0.3 + room.sel * 2.4 + mood * 0.9 * (1 - room.off);
      room.frameMaterial.opacity = clamp(room.sel + room.hover * 0.4);
      room.frameGroup.visible = room.frameMaterial.opacity > 0.01;
      room.hatch.material.opacity = room.off * 0.85;
      room.hatch.visible = room.off > 0.01;
      light = Math.max(light, room.sel);

      // pastille : position à l'écran, atténuée quand la pièce nous tourne le dos
      projected.copy(room.anchor);
      model.localToWorld(projected).project(camera);
      room.pin.style.transform = `translate(${((projected.x + 1) / 2) * width}px, ${((1 - projected.y) / 2) * height}px)`;
      facing.copy(room.normal).applyAxisAngle(THREE.Object3D.DEFAULT_UP, turn.rotation.y);
      room.pin.classList.toggle('is-away', facing.dot(viewDir) < 0.05);
    }
    roomLight.intensity = light * lerp(5, 11, mood);
    turn.updateMatrixWorld();
    renderer.render(scene, camera);
  }
  resize();
  turn.updateMatrixWorld(true);
  requestAnimationFrame(frame);
  section?.classList.add('is-ready');
}

// ---------- textures ----------
function brickTexture() {
  const texture = canvasTexture(512, (ctx, size) => {
    const rnd = seeded(3), rows = 20, h = size / rows, w = size / 5;
    ctx.fillStyle = '#ecdccc';
    ctx.fillRect(0, 0, size, size);
    for (let r = 0; r < rows; r++) {
      for (let i = -1; i < 6; i++) {
        const x = i * w + (r % 2 ? w / 2 : 0);
        ctx.fillStyle = `hsl(${13 + rnd() * 8}, ${42 + rnd() * 14}%, ${60 + rnd() * 9}%)`;
        ctx.fillRect(x + 1.5, r * h + 1.5, w - 3, h - 3);
      }
    }
  }, { repeat: true });
  texture.repeat.set(0.5, 0.5);
  return texture;
}
function pavingTexture() {
  const texture = canvasTexture(512, (ctx, size) => {
    const rnd = seeded(11), n = 4, s = size / n;
    ctx.fillStyle = '#cdbfa9';
    ctx.fillRect(0, 0, size, size);
    for (let j = 0; j < n; j++) for (let i = -1; i < n + 1; i++) {
      ctx.fillStyle = `hsl(${34 + rnd() * 6}, ${24 + rnd() * 8}%, ${82 + rnd() * 6}%)`;
      ctx.fillRect(i * s + (j % 2 ? s / 2 : 0) + 2, j * s + 2, s - 4, s - 4);
    }
  }, { repeat: true });
  texture.repeat.set(0.5, 0.5);
  return texture;
}
function plankTexture() {
  const texture = canvasTexture(256, (ctx, size) => {
    const rnd = seeded(5), n = 8, s = size / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `hsl(${30 + rnd() * 5}, ${36 + rnd() * 8}%, ${66 + rnd() * 8}%)`;
      ctx.fillRect(0, i * s, size, s - 1.5);
      ctx.fillStyle = 'rgba(90, 60, 35, 0.35)';
      ctx.fillRect(0, i * s + s - 1.5, size, 1.5);
      ctx.fillRect(Math.floor(rnd() * size), i * s, 1.5, s);
    }
  }, { repeat: true });
  texture.repeat.set(0.6, 0.6);
  return texture;
}
let hatchShared = null;
function hatchTexture() {
  if (hatchShared) return hatchShared;
  hatchShared = canvasTexture(128, (ctx, size) => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'rgba(214, 203, 190, 0.5)';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#231c17';
    ctx.lineWidth = 7;
    for (let i = -1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(i * 64 - 8, size + 8); ctx.lineTo(i * 64 + size + 8, -8); ctx.stroke(); }
  }, { repeat: true });
  return hatchShared;
}

// Eau du bassin : turquoise, avec des reflets qui se déplacent doucement (et qui s'allument le soir).
function waterMaterial(w, d) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uGlow: { value: 0 }, uSize: { value: new THREE.Vector2(w, d) }, uDeep: { value: new THREE.Color('#168a84') }, uPool: { value: new THREE.Color('#2fb4ab') }, uLight: { value: new THREE.Color('#c9fff6') } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uGlow; uniform vec2 uSize; uniform vec3 uDeep; uniform vec3 uPool; uniform vec3 uLight;
      varying vec2 vUv;
      float caustic(vec2 uv, float t) {
        vec2 p = mod(uv * 6.2831853, 6.2831853) - 250.0;
        vec2 i = p; float c = 1.0;
        for (int n = 0; n < 4; n++) {
          float tt = t * (1.0 - 3.5 / float(n + 1));
          i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
        }
        c = 1.17 - pow(c / 4.0, 1.4);
        return pow(abs(c), 8.0);
      }
      void main() {
        vec2 m = vUv * uSize;
        float c = caustic(m * 0.42, uTime * 0.45);
        vec2 e = min(vUv, 1.0 - vUv) * uSize;
        float edge = 1.0 - smoothstep(0.0, 0.9, min(e.x, e.y));
        vec3 color = mix(uDeep, uPool, 0.55 + 0.45 * edge);
        color += uLight * c * (0.55 + 0.5 * uGlow);
        color += uPool * uGlow * (0.35 + 0.5 * edge);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

if (canvas) {
  try { start(); } catch (error) {
    console.error('[cour sainte-anne] maquette indisponible', error);
    section?.classList.add('no-3d');
  }
}
