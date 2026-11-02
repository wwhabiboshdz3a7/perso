// Couleurs : lecture (hex, rgb, hsl, quelques noms) et interpolation perceptuelle en OKLab.
import { hasDOM, clamp } from './utils.js';

const NAMED = {
  transparent: [0, 0, 0, 0], black: [0, 0, 0, 1], white: [255, 255, 255, 1], red: [255, 0, 0, 1],
  green: [0, 128, 0, 1], lime: [0, 255, 0, 1], blue: [0, 0, 255, 1], yellow: [255, 255, 0, 1],
  cyan: [0, 255, 255, 1], aqua: [0, 255, 255, 1], magenta: [255, 0, 255, 1], fuchsia: [255, 0, 255, 1],
  orange: [255, 165, 0, 1], purple: [128, 0, 128, 1], pink: [255, 192, 203, 1], gray: [128, 128, 128, 1],
  grey: [128, 128, 128, 1], silver: [192, 192, 192, 1], navy: [0, 0, 128, 1], teal: [0, 128, 128, 1],
  maroon: [128, 0, 0, 1], olive: [128, 128, 0, 1], gold: [255, 215, 0, 1], coral: [255, 127, 80, 1],
  tomato: [255, 99, 71, 1], crimson: [220, 20, 60, 1], indigo: [75, 0, 130, 1], violet: [238, 130, 238, 1],
  hotpink: [255, 105, 180, 1], turquoise: [64, 224, 208, 1], salmon: [250, 128, 114, 1], chocolate: [210, 105, 30, 1],
};

export const COLOR_RE = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)/gi;
const NAMED_RE = new RegExp(`^(${Object.keys(NAMED).join('|')})$`, 'i');

export function isColor(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t) || /^(rgba?|hsla?)\(/i.test(t) || NAMED_RE.test(t);
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

function num(part, scale) {
  part = part.trim();
  if (part.endsWith('%')) return (parseFloat(part) / 100) * scale;
  return parseFloat(part);
}

function angle(part) {
  part = part.trim();
  const v = parseFloat(part);
  if (part.endsWith('turn')) return v * 360;
  if (part.endsWith('rad')) return (v * 180) / Math.PI;
  if (part.endsWith('grad')) return v * 0.9;
  return v;
}

let probe = null;

/** Renvoie [r, g, b, a] (0-255, alpha 0-1) ou null. */
export function parseColor(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (s[0] === '#') {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return null;
    if (h.length === 6) return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
    return [(n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, (n & 255) / 255];
  }
  const fm = s.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (fm) {
    const body = fm[2].replace(/\s*\/\s*/, ',').replace(/,/g, ' ').trim().split(/\s+/);
    const alpha = body[3] !== undefined ? clamp(num(body[3], 1)) : 1;
    if (fm[1].startsWith('rgb')) {
      return [clamp(num(body[0], 255), 0, 255), clamp(num(body[1], 255), 0, 255), clamp(num(body[2], 255), 0, 255), alpha];
    }
    const [r, g, b] = hslToRgb(angle(body[0]), num(body[1], 1) / (body[1].includes('%') ? 1 : 100), num(body[2], 1) / (body[2].includes('%') ? 1 : 100));
    return [r, g, b, alpha];
  }
  if (NAMED[s]) return [...NAMED[s]];
  // Autres noms CSS : on laisse le navigateur trancher.
  if (hasDOM && /^[a-z]+$/.test(s)) {
    probe = probe || document.createElement('i');
    probe.style.color = '';
    probe.style.color = s;
    if (!probe.style.color) return null;
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c && c.startsWith('rgb') ? parseColor(c) : null;
  }
  return null;
}

// sRGB ↔ linéaire
const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const fromLin = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

/** [r, g, b] (0-255) → [L, a, b] OKLab */
export function rgbToOklab([r, g, b]) {
  const lr = toLin(r), lg = toLin(g), lb = toLin(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** [L, a, b] OKLab → [r, g, b] (0-255, bornés) */
export function oklabToRgb([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    clamp(fromLin(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), 0, 255),
    clamp(fromLin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), 0, 255),
    clamp(fromLin(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s), 0, 255),
  ];
}

/** Prépare une couleur pour l'interpolation : OKLab prémultiplié par l'alpha. */
export function colorValue(rgba) {
  const lab = rgbToOklab(rgba);
  const a = rgba[3];
  return { type: 'color', rgba, a, pm: [lab[0] * a, lab[1] * a, lab[2] * a] };
}

/** Mélange deux couleurs préparées, t peut dépasser [0, 1] (easings élastiques). */
export function mixColor(from, to, t) {
  const a = clamp(from.a + (to.a - from.a) * t, 0, 1);
  if (a <= 0) return 'rgba(0, 0, 0, 0)';
  const pm = [0, 1, 2].map((i) => from.pm[i] + (to.pm[i] - from.pm[i]) * t);
  const [r, g, b] = oklabToRgb([pm[0] / a, pm[1] / a, pm[2] / a]);
  return formatRgb(r, g, b, a);
}

export function formatRgb(r, g, b, a = 1) {
  const R = Math.round(r), G = Math.round(g), B = Math.round(b);
  return a >= 1 ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${Math.round(a * 1000) / 1000})`;
}

export function colorToString(c) {
  return formatRgb(c.rgba[0], c.rgba[1], c.rgba[2], c.rgba[3]);
}
