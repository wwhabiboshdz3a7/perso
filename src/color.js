// Couleurs : lecture (hex, rgb, hsl, noms CSS) et interpolation perceptuelle en OKLab.
import { clamp } from './utils.js';

// Les 148 couleurs nommées de CSS (nom, valeur hexadécimale), décodées au chargement.
const NAMED_SRC =
  'aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc ' +
  'bisque ffe4c4 black 000000 blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a ' +
  'burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 chocolate d2691e coral ff7f50 cornflowerblue 6495ed ' +
  'cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b darkcyan 008b8b darkgoldenrod b8860b ' +
  'darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b darkmagenta 8b008b ' +
  'darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 darksalmon e9967a ' +
  'darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f darkturquoise 00ced1 ' +
  'darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 dimgrey 696969 dodgerblue 1e90ff ' +
  'firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff ' +
  'gold ffd700 goldenrod daa520 gray 808080 green 008000 greenyellow adff2f grey 808080 honeydew f0fff0 ' +
  'hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa ' +
  'lavenderblush fff0f5 lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 ' +
  'lightcyan e0ffff lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 ' +
  'lightpink ffb6c1 lightsalmon ffa07a lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 ' +
  'lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 limegreen 32cd32 linen faf0e6 ' +
  'magenta ff00ff maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd mediumorchid ba55d3 ' +
  'mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a ' +
  'mediumturquoise 48d1cc mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 ' +
  'moccasin ffe4b5 navajowhite ffdead navy 000080 oldlace fdf5e6 olive 808000 olivedrab 6b8e23 ' +
  'orange ffa500 orangered ff4500 orchid da70d6 palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee ' +
  'palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 peru cd853f pink ffc0cb plum dda0dd ' +
  'powderblue b0e0e6 purple 800080 rebeccapurple 663399 red ff0000 rosybrown bc8f8f royalblue 4169e1 ' +
  'saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 seashell fff5ee sienna a0522d ' +
  'silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 snow fffafa ' +
  'springgreen 00ff7f steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 ' +
  'violet ee82ee wheat f5deb3 white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32';
const NAMED = { transparent: [0, 0, 0, 0] };
{
  const parts = NAMED_SRC.split(' ');
  for (let i = 0; i < parts.length; i += 2) {
    const n = parseInt(parts[i + 1], 16);
    NAMED[parts[i]] = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
}

export const COLOR_RE = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)/gi;

export function isColor(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t) || /^(rgba?|hsla?)\(/i.test(t) || Object.prototype.hasOwnProperty.call(NAMED, t.toLowerCase());
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
  if (Object.prototype.hasOwnProperty.call(NAMED, s)) return [...NAMED[s]];
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
