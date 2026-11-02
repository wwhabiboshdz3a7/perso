// Utilitaires mathématiques et petits outils partagés.

export const isArr = Array.isArray;
export const isFn = (v) => typeof v === 'function';
export const isStr = (v) => typeof v === 'string';
export const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
export const isObj = (v) => v !== null && typeof v === 'object';
export const isUndef = (v) => v === undefined;

export const hasDOM = typeof window !== 'undefined' && typeof document !== 'undefined';

export const isEl = (v) => hasDOM && v != null && typeof v === 'object' && v.nodeType === 1;
export const isSVG = (v) => isEl(v) && typeof SVGElement !== 'undefined' && v instanceof SVGElement;

/** Borne une valeur entre min et max. */
export function clamp(v, min = 0, max = 1) {
  return v < min ? min : v > max ? max : v;
}

/** Interpolation linéaire de a vers b. */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Projette v de l'intervalle [inMin, inMax] vers [outMin, outMax]. */
export function mapRange(v, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Arrondit à n décimales. */
export function round(v, decimals = 0) {
  const p = 10 ** decimals;
  return Math.round(v * p) / p;
}

/** Aimante v sur un pas régulier ou sur la valeur la plus proche d'une liste. */
export function snap(v, increment) {
  if (isArr(increment)) {
    let best = increment[0];
    let d = Infinity;
    for (const c of increment) {
      const dc = Math.abs(c - v);
      if (dc < d) { d = dc; best = c; }
    }
    return best;
  }
  if (!increment) return v;
  return Math.round(v / increment) * increment;
}

/** Fait boucler v dans [min, max[. */
export function wrap(v, min, max) {
  const r = max - min;
  if (r === 0) return min;
  return ((((v - min) % r) + r) % r) + min;
}

/**
 * Générateur pseudo-aléatoire à graine (xorshift sur 32 bits, mélange de type « splitmix »).
 * Même graine, même suite : pratique pour des compositions reproductibles.
 */
export function createRandom(seed = Date.now()) {
  let s = (Math.floor(seed) ^ 0x9e3779b9) >>> 0;
  if (s === 0) s = 0x6d2b79f5;
  const next = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), 0x2c1b3c6d) >>> 0;
    z = Math.imul(z ^ (z >>> 12), 0x297a2d39) >>> 0;
    return ((z ^ (z >>> 15)) >>> 0) / 4294967296;
  };
  /** random() → [0, 1[ ; random(max) ; random(min, max, décimales) */
  const random = (min, max, decimals) => {
    const r = next();
    if (isUndef(min)) return r;
    if (isUndef(max)) { max = min; min = 0; }
    const v = min + r * (max - min);
    return isUndef(decimals) ? v : round(v, decimals);
  };
  random.int = (min, max) => Math.floor(random(min, max + 1));
  random.pick = (list) => list[Math.floor(next() * list.length)];
  random.shuffle = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return random;
}

let globalRandom = createRandom(Date.now());

/** Aléatoire global : random(min, max, décimales). Reproductible après seed(n). */
export function random(min, max, decimals) {
  return globalRandom(min, max, decimals);
}

/** Fixe la graine de l'aléatoire global. */
export function seed(n) {
  globalRandom = createRandom(n);
  return globalRandom;
}

/** Mélange une copie du tableau (aléatoire global, ou générateur fourni). */
export function shuffle(list, rng = globalRandom) {
  return rng.shuffle ? rng.shuffle(list) : createRandom(rng).shuffle(list);
}

/** camelCase → kebab-case (propriétés CSS). */
export function toKebab(s) {
  if (s.startsWith('--')) return s;
  return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

/** kebab-case → camelCase. */
export function toCamel(s) {
  if (s.startsWith('--')) return s;
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** Arrondi d'affichage : évite les « 1e-7px » et allège le DOM. */
export function fmt(n) {
  if (!Number.isFinite(n)) return 0;
  const r = Math.round(n * 10000) / 10000;
  return r === 0 ? 0 : r;
}
