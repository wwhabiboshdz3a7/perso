// Valeurs animables : nombres avec unité, couleurs, chaînes complexes, valeurs relatives.
import { isNum, isStr, isObj, fmt, hasDOM, isEl } from './utils.js';
import { isColor, parseColor, colorValue, mixColor, colorToString, COLOR_RE } from './color.js';

export const CUSTOM = Symbol.for('kinetika.custom');

const NUM_UNIT_RE = /^([+\-*/]=)?\s*(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*([a-z%]*)$/i;
const TOKEN_RE = /-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?[a-z%]*/gi;

/** Valeur numérique : { type: 'num', n, unit } */
export const numValue = (n, unit = '') => ({ type: 'num', n, unit });

/**
 * Analyse brute d'une valeur saisie. Renvoie un objet valeur, avec éventuellement
 * un opérateur relatif (`op`) à appliquer plus tard sur la valeur de départ.
 */
export function parseValue(raw) {
  if (raw && raw[CUSTOM]) return { type: 'custom', get: raw[CUSTOM], unit: raw.unit || '' };
  if (isNum(raw)) return numValue(raw, '');
  if (typeof raw === 'boolean') return { type: 'raw', s: raw };
  if (!isStr(raw)) return { type: 'raw', s: raw };
  const s = raw.trim();
  const m = s.match(NUM_UNIT_RE);
  if (m) {
    const v = numValue(parseFloat(m[2]), m[3] || '');
    if (m[1]) v.op = m[1][0];
    return v;
  }
  if (isColor(s)) {
    const c = parseColor(s);
    if (c) return colorValue(c);
  }
  return parseComplex(s);
}

/** Chaîne contenant des nombres et des couleurs : on interpole chaque jeton. */
export function parseComplex(s) {
  const tokens = [];
  const strings = [];
  let last = 0;
  // On repère d'abord les couleurs, puis les nombres dans le reste.
  const marks = [];
  s.replace(COLOR_RE, (m, idx) => { marks.push({ idx, len: m.length, kind: 'color', text: m }); return m; });
  const inColor = (i) => marks.some((c) => i >= c.idx && i < c.idx + c.len);
  s.replace(TOKEN_RE, (m, idx) => {
    if (inColor(idx)) return m;
    // un nombre dans un identifiant (#grad1, var_2) n'est pas animable
    const prev = s[idx - 1];
    if (prev && /[#_]/.test(prev)) return m;
    marks.push({ idx, len: m.length, kind: 'num', text: m });
    return m;
  });
  marks.sort((a, b) => a.idx - b.idx);
  for (const mk of marks) {
    strings.push(s.slice(last, mk.idx));
    if (mk.kind === 'color') tokens.push(colorValue(parseColor(mk.text)));
    else {
      const mm = mk.text.match(/^(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)$/i);
      tokens.push(numValue(parseFloat(mm[1]), mm[2] || ''));
    }
    last = mk.idx + mk.len;
  }
  strings.push(s.slice(last));
  if (!tokens.length) return { type: 'raw', s };
  return { type: 'complex', strings, tokens, s };
}

/**
 * Applique un opérateur relatif (+=, -=, *=, /=) à partir de la valeur de départ.
 * Pour + et -, l'écart est d'abord converti dans l'unité de départ : rotate 90deg puis
 * '-=1turn' donne -270deg ; x 10px puis '+=2rem' donne 42px. Un écart sans unité prend
 * l'unité par défaut de la propriété (deg pour rotate, px pour x ou width).
 * Pour * et /, le nombre est un facteur sans unité.
 */
export function applyRelative(from, to, ctx = {}) {
  if (!to.op) return to;
  if (from.type === 'complex' && from.tokens.length === 1 && from.tokens[0].type === 'num' && !from.strings.join('').trim()) from = from.tokens[0];
  if (from.type !== 'num') return { ...to, op: undefined };
  if (to.op === '*' || to.op === '/') {
    const n = to.op === '*' ? from.n * to.n : from.n / (to.n || 1);
    return numValue(n, from.unit || to.unit);
  }
  let delta = to;
  const fromUnit = from.unit;
  const toUnit = to.unit || (fromUnit ? ctx.defaultUnit || '' : '');
  if (fromUnit && toUnit && toUnit !== fromUnit) {
    delta = convertUnit(numValue(to.n, toUnit), fromUnit, ctx.el, ctx.prop, ctx.isTransform);
  }
  const n = to.op === '+' ? from.n + delta.n : from.n - delta.n;
  return numValue(n, fromUnit || to.unit);
}

// —— Unités ——

const ANGLE = { deg: 1, rad: 180 / Math.PI, turn: 360, grad: 0.9 };
const VERTICAL = /^(height|top|bottom|y|translateY|marginTop|marginBottom|paddingTop|paddingBottom|minHeight|maxHeight|rowGap|borderTopWidth|borderBottomWidth)$/;

function parentOf(el) {
  return (el && el.parentElement) || (hasDOM ? document.documentElement : null);
}

function fontSizeOf(el) {
  if (!hasDOM || !el) return 16;
  return parseFloat(getComputedStyle(el).fontSize) || 16;
}

/** Nombre de pixels représentés par une unité, pour une propriété et un élément donnés. */
function pxPer(unit, el, prop, isTransform) {
  switch (unit) {
    case '':
    case 'px': return 1;
    case 'em': return fontSizeOf(prop === 'fontSize' ? parentOf(el) : el);
    case 'rem': return fontSizeOf(hasDOM ? document.documentElement : null);
    case 'vw': return hasDOM ? innerWidth / 100 : 1;
    case 'vh': return hasDOM ? innerHeight / 100 : 1;
    case 'vmin': return hasDOM ? Math.min(innerWidth, innerHeight) / 100 : 1;
    case 'vmax': return hasDOM ? Math.max(innerWidth, innerHeight) / 100 : 1;
    case '%': {
      if (!isEl(el)) return 1;
      const vertical = VERTICAL.test(prop);
      if (isTransform) {
        const r = el.getBoundingClientRect();
        return (vertical ? (el.offsetHeight || r.height) : (el.offsetWidth || r.width)) / 100 || 1;
      }
      if (prop === 'fontSize') return fontSizeOf(parentOf(el)) / 100;
      const p = parentOf(el);
      const r = p ? p.getBoundingClientRect() : null;
      return (r ? (vertical ? r.height : r.width) : 100) / 100 || 1;
    }
    default: return measure(unit, el, prop);
  }
}

// Mesure de secours : un élément témoin dans le même parent.
function measure(unit, el, prop) {
  if (!isEl(el)) return 1;
  const p = parentOf(el);
  const probe = document.createElement(el.tagName === 'svg' ? 'div' : el.tagName);
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.width = '100' + unit;
  p.appendChild(probe);
  const w = probe.getBoundingClientRect().width;
  probe.remove();
  return w ? w / 100 : 1;
}

/** Convertit une valeur numérique vers l'unité voulue. */
export function convertUnit(v, unit, el, prop, isTransform = false) {
  if (v.type !== 'num' || v.unit === unit || !unit) return v;
  if (v.n === 0 || !v.unit) return numValue(v.n, unit);
  if (ANGLE[v.unit] && ANGLE[unit]) return numValue((v.n * ANGLE[v.unit]) / ANGLE[unit], unit);
  const px = v.n * pxPer(v.unit, el, prop, isTransform);
  return numValue(px / pxPer(unit, el, prop, isTransform), unit);
}

/** Met deux valeurs sur la même forme (unités, types) avant interpolation. */
export function unify(from, to, ctx) {
  if (from.type === 'num' && to.type === 'num') {
    if (to.unit && from.unit !== to.unit) from = convertUnit(from, to.unit, ctx.el, ctx.prop, ctx.isTransform);
    else if (!to.unit && from.unit) to = numValue(to.n, from.unit);
    else if (!to.unit && !from.unit && ctx.defaultUnit) {
      from = numValue(from.n, ctx.defaultUnit);
      to = numValue(to.n, ctx.defaultUnit);
    }
    return [from, to];
  }
  if (from.type === 'complex' && to.type === 'num' && from.tokens.length === 1 && from.tokens[0].type === 'num') {
    return unify(from.tokens[0], to, ctx);
  }
  if (from.type === 'raw' && to.type === 'num' && (from.s === '' || from.s === 'auto' || from.s === 'none' || from.s == null)) {
    return [numValue(0, to.unit || ctx.defaultUnit || ''), to.unit ? to : numValue(to.n, ctx.defaultUnit || '')];
  }
  if (from.type === 'raw' && to.type === 'color' && (from.s === '' || from.s === 'none')) {
    return [colorValue([to.rgba[0], to.rgba[1], to.rgba[2], 0]), to];
  }
  if (to.type === 'complex' && from.type !== 'complex') {
    // départ « vide » : on part de zéro sur chaque jeton du gabarit d'arrivée
    if (from.type === 'raw' && (from.s === '' || from.s === 'none' || from.s == null)) {
      return [{ ...to, tokens: to.tokens.map((t) => (t.type === 'num' ? numValue(0, t.unit) : colorValue([t.rgba[0], t.rgba[1], t.rgba[2], 0]))) }, to];
    }
  }
  if (from.type === 'complex' && to.type === 'complex') {
    const same = from.tokens.length === to.tokens.length && from.tokens.every((t, i) => t.type === to.tokens[i].type);
    if (same) {
      const tokens = from.tokens.map((t, i) => (t.type === 'num' && to.tokens[i].type === 'num' && to.tokens[i].unit && t.unit !== to.tokens[i].unit && t.n === 0 ? numValue(0, to.tokens[i].unit) : t));
      return [{ ...from, tokens }, to];
    }
  }
  return [from, to];
}

/** Sérialise une valeur pour l'écriture dans le DOM ou un objet. */
export function serialize(v, asNumber) {
  switch (v.type) {
    case 'num': return asNumber && !v.unit ? fmt(v.n) : fmt(v.n) + v.unit;
    case 'color': return colorToString(v);
    case 'complex': return v.strings.reduce((acc, str, i) => acc + str + (i < v.tokens.length ? serialize(v.tokens[i]) : ''), '');
    default: return v.s;
  }
}

/** Interpole de `from` à `to` pour une progression t (déjà passée par l'easing). */
export function interpolate(from, to, t, asNumber, modifier, target) {
  if (to.type === 'custom') {
    const v = to.get(t, target);
    return isNum(v) ? fmt(modifier ? modifier(v) : v) + to.unit : v;
  }
  if (from.type === 'num' && to.type === 'num') {
    let n = from.n + (to.n - from.n) * t;
    if (modifier) n = modifier(n);
    const unit = to.unit || from.unit;
    return asNumber && !unit ? n : fmt(n) + unit;
  }
  if (from.type === 'color' && to.type === 'color') return mixColor(from, to, t);
  if (from.type === 'complex' && to.type === 'complex' && from.tokens.length === to.tokens.length) {
    let out = '';
    for (let i = 0; i < to.strings.length; i++) {
      out += to.strings[i];
      if (i < to.tokens.length) {
        const a = from.tokens[i], b = to.tokens[i];
        if (a.type === 'num' && b.type === 'num') {
          let n = a.n + (b.n - a.n) * t;
          if (modifier) n = modifier(n);
          out += fmt(n) + (b.unit || a.unit);
        } else if (a.type === 'color' && b.type === 'color') out += mixColor(a, b, t);
        else out += serialize(t < 1 ? a : b);
      }
    }
    return out;
  }
  // Valeurs non interpolables : bascule à mi-parcours, comme en CSS.
  const v = t < 0.5 ? from : to;
  return v.type === 'raw' ? v.s : serialize(v, asNumber);
}

/** Valeur personnalisée calculée à partir de la progression (chemins SVG…). */
export function customValue(get, unit = '') {
  return { [CUSTOM]: get, unit };
}

export const isCustom = (v) => isObj(v) && !!v[CUSTOM];
