// Courbes d'accélération. Toutes prennent t ∈ [0, 1] et renvoient la progression.
import { isFn, isStr, isNum } from './utils.js';

const PI = Math.PI;
const HALF_PI = PI / 2;
const TAU = PI * 2;

// Versions « in » de base ; out / inOut / outIn en sont dérivées.
const power = (p = 2) => (t) => t ** p;
const baseIn = {
  Quad: () => power(2),
  Cubic: () => power(3),
  Quart: () => power(4),
  Quint: () => power(5),
  Sine: () => (t) => 1 - Math.cos(t * HALF_PI),
  Expo: () => (t) => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
  Circ: () => (t) => 1 - Math.sqrt(Math.max(0, 1 - t * t)),
  Back: (overshoot = 1.70158) => (t) => (overshoot + 1) * t * t * t - overshoot * t * t,
  Elastic: (amplitude = 1, period = 0.3) => {
    const a = Math.max(1, amplitude);
    const p = Math.max(0.05, period);
    const s = (p / TAU) * Math.asin(1 / a);
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      const u = t - 1;
      return -(a * 2 ** (10 * u) * Math.sin(((u - s) * TAU) / p));
    };
  },
  Bounce: () => (t) => 1 - bounceOut(1 - t),
};

function bounceOut(t) {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) { t -= 1.5 / d; return n * t * t + 0.75; }
  if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + 0.9375; }
  t -= 2.625 / d;
  return n * t * t + 0.984375;
}

const toOut = (f) => (t) => 1 - f(1 - t);
const toInOut = (f) => (t) => (t < 0.5 ? f(t * 2) / 2 : 1 - f(2 - t * 2) / 2);
const toOutIn = (f) => (t) => (t < 0.5 ? (1 - f(1 - t * 2)) / 2 : f(t * 2 - 1) / 2 + 0.5);

const variants = { in: (f) => f, out: toOut, inOut: toInOut, outIn: toOutIn };

export const linear = (t) => t;

/**
 * Familles exposées : eases.outQuad(t), eases.outElastic.with(1, .4)(t)…
 * Chaque entrée est une fonction d'easing prête à l'emploi, avec `.with(...params)`.
 */
export const eases = {};
const register = (name, make) => {
  const fn = make();
  fn.with = (...args) => (args.length ? make(...args) : fn);
  eases[name] = fn;
};
register('linear', () => linear);
for (const fam of Object.keys(baseIn)) {
  for (const v of Object.keys(variants)) {
    register(v + fam, (...args) => variants[v](baseIn[fam](...args)));
  }
}
// Puissances génériques : out = outQuad, out.with(3) = outCubic.
for (const v of Object.keys(variants)) {
  register(v, (p = 2) => variants[v](power(p)));
}

/**
 * Courbe de Bézier cubique façon CSS : cubicBezier(x1, y1, x2, y2).
 * Résolution de x(t) = x par Newton-Raphson, puis dichotomie en secours.
 */
export function cubicBezier(x1 = 0.25, y1 = 0.1, x2 = 0.25, y2 = 1) {
  x1 = Math.min(1, Math.max(0, x1));
  x2 = Math.min(1, Math.max(0, x2));
  if (x1 === y1 && x2 === y2) return linear;
  // Coefficients polynomiaux : B(t) = ((a t + b) t + c) t
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  const solve = (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-7) return t;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-7) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solve(x)));
}

/** Escalier : steps(5) ou steps(5, 'start'). */
export function steps(count = 10, jump = 'end') {
  const n = Math.max(1, Math.round(count));
  return jump === 'start'
    ? (t) => (t >= 1 ? 1 : Math.min(1, Math.ceil(t * n) / n))
    : (t) => (t >= 1 ? 1 : Math.floor(t * n) / n);
}

const springCache = new Map();

/**
 * Ressort physique amorti. La durée nécessaire pour se stabiliser est calculée
 * et exposée dans `.duration` (ms) : elle sert de durée par défaut à l'animation.
 */
export function spring({ mass, stiffness, damping, velocity } = {}) {
  // paramètre absent ou invalide (NaN, texte) : valeur par défaut
  const num = (v, d) => (v !== null && v !== '' && Number.isFinite(+v) ? +v : d);
  const m = Math.max(0.01, num(mass, 1));
  const k = Math.max(0.01, num(stiffness, 100));
  const c = Math.max(0, num(damping, 10));
  velocity = num(velocity, 0);
  const key = `${m}|${k}|${c}|${velocity}`;
  if (springCache.has(key)) return springCache.get(key);

  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  // d(t) = écart à la cible, d(0) = -1, d'(0) = velocity (vers la cible si positive)
  let disp;
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const A = -1;
    const B = (velocity + zeta * w0 * A) / wd;
    disp = (t) => Math.exp(-zeta * w0 * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
  } else if (zeta === 1) {
    const A = -1;
    const B = velocity + w0 * A;
    disp = (t) => (A + B * t) * Math.exp(-w0 * t);
  } else {
    const r = Math.sqrt(zeta * zeta - 1);
    const r1 = -w0 * (zeta - r);
    const r2 = -w0 * (zeta + r);
    const C2 = (velocity + r1) / (r2 - r1);
    const C1 = -1 - C2;
    disp = (t) => C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t);
  }

  // Durée de stabilisation : dernier instant où l'écart dépasse le seuil.
  const eps = 0.0008;
  const step = 1 / 240;
  let last = 0;
  for (let t = 0; t < 30; t += step) {
    if (Math.abs(disp(t)) > eps) last = t;
    else if (t - last > 1) break;
  }
  const settle = Math.max(step, last + step);
  const fn = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + disp(t * settle));
  fn.duration = Math.round(settle * 1000);
  fn.isSpring = true;
  fn.params = { mass: m, stiffness: k, damping: c, velocity };
  springCache.set(key, fn);
  return fn;
}

// Alias pratiques (mots-clés CSS, habitudes d'anime.js et de GSAP).
const cssKeywords = {
  ease: cubicBezier(0.25, 0.1, 0.25, 1),
  'ease-in': cubicBezier(0.42, 0, 1, 1),
  'ease-out': cubicBezier(0, 0, 0.58, 1),
  'ease-in-out': cubicBezier(0.42, 0, 0.58, 1),
};
const gsapPower = { power1: 'Quad', power2: 'Cubic', power3: 'Quart', power4: 'Quint', quad: 'Quad', cubic: 'Cubic', quart: 'Quart', quint: 'Quint', strong: 'Quint', sine: 'Sine', expo: 'Expo', circ: 'Circ', back: 'Back', elastic: 'Elastic', bounce: 'Bounce' };

const parseCache = new Map();

// Arguments numériques ; un argument illisible devient undefined (valeur par défaut).
function parseArgs(s) {
  return s.split(',').map((x) => x.trim()).filter(Boolean).map((x) => (Number.isFinite(+x) ? +x : undefined));
}

/**
 * Transforme une valeur d'easing (nom, chaîne paramétrée, fonction) en fonction.
 * 'outElastic(1, .5)', 'cubicBezier(.2,.8,.2,1)', 'steps(4)', 'spring(1, 120, 12)',
 * 'easeOutExpo' (anime.js), 'power3.out' (GSAP), 'ease-in-out' (CSS).
 */
export function parseEase(ease) {
  if (isFn(ease)) return ease;
  if (!isStr(ease) || !ease.trim()) return null;
  if (parseCache.has(ease)) return parseCache.get(ease);
  const raw = ease.trim();
  let fn = null;
  const m = raw.match(/^([\w.-]+)\s*(?:\(([^)]*)\))?$/);
  if (m) {
    let name = m[1];
    const args = m[2] !== undefined ? parseArgs(m[2]) : [];
    if (cssKeywords[name]) fn = cssKeywords[name];
    else if (name === 'linear') fn = linear;
    else if (name === 'cubicBezier' || name === 'cubic-bezier') fn = cubicBezier(...args);
    else if (name === 'steps') fn = steps(args[0], (m[2] || '').includes('start') ? 'start' : 'end');
    else if (name === 'spring') fn = spring({ mass: args[0], stiffness: args[1], damping: args[2], velocity: args[3] });
    else {
      // GSAP : power2.out, back.inOut(2), elastic.out(1, .3)
      const g = name.match(/^(\w+)\.(in|out|inOut)$/);
      if (g && gsapPower[g[1]]) name = g[2] + gsapPower[g[1]];
      // anime.js v3 : easeOutQuad, easeInOutElastic
      const a = name.match(/^ease(In|Out|InOut|OutIn)(\w+)$/);
      if (a) name = a[1][0].toLowerCase() + a[1].slice(1) + a[2];
      if (gsapPower[name] && !eases[name]) name = 'out' + gsapPower[name];
      const base = eases[name];
      if (base) fn = args.length ? base.with(...args) : base;
    }
  }
  if (fn) parseCache.set(ease, fn);
  return fn;
}

/** Liste des noms disponibles (pour la documentation et le visualiseur). */
export const easeNames = Object.keys(eases);
