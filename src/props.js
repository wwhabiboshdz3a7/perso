// Lecture et écriture des propriétés : transformations, CSS, variables, attributs, objets.
import { isEl, isSVG, toKebab, toCamel, hasDOM, fmt } from './utils.js';

// Transformations individuelles, dans l'ordre d'application.
export const TRANSFORMS = {
  perspective: { fn: 'perspective', unit: 'px', base: null },
  x: { fn: 'translateX', unit: 'px', base: 0 },
  y: { fn: 'translateY', unit: 'px', base: 0 },
  z: { fn: 'translateZ', unit: 'px', base: 0 },
  rotateX: { fn: 'rotateX', unit: 'deg', base: 0 },
  rotateY: { fn: 'rotateY', unit: 'deg', base: 0 },
  rotate: { fn: 'rotate', unit: 'deg', base: 0 },
  rotateZ: { fn: 'rotateZ', unit: 'deg', base: 0 },
  skew: { fn: 'skew', unit: 'deg', base: 0 },
  skewX: { fn: 'skewX', unit: 'deg', base: 0 },
  skewY: { fn: 'skewY', unit: 'deg', base: 0 },
  scale: { fn: 'scale', unit: '', base: 1 },
  scaleX: { fn: 'scaleX', unit: '', base: 1 },
  scaleY: { fn: 'scaleY', unit: '', base: 1 },
  scaleZ: { fn: 'scaleZ', unit: '', base: 1 },
};
const ALIASES = { translateX: 'x', translateY: 'y', translateZ: 'z' };
const ORDER = Object.keys(TRANSFORMS);
const FN_TO_KEY = Object.fromEntries(Object.entries(TRANSFORMS).map(([k, v]) => [v.fn.toLowerCase(), k]));

// Propriétés CSS sans unité.
const UNITLESS = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex', 'flexGrow', 'flexShrink', 'order', 'zoom',
  'fillOpacity', 'strokeOpacity', 'stopOpacity', 'floodOpacity', 'strokeMiterlimit', 'columnCount', 'orphans', 'widows', 'aspectRatio', 'scale']);

export function normalizeProp(prop) {
  return ALIASES[prop] || prop;
}

/** Détermine comment animer `prop` sur `target`. */
export function propKind(target, prop) {
  if (!isEl(target)) return 'prop';
  if (TRANSFORMS[prop]) return 'transform';
  if (prop.startsWith('--')) return 'var';
  if (isSVG(target)) {
    const attr = prop.includes('-') ? prop : toKebab(prop);
    if (target.hasAttribute(prop) || target.hasAttribute(attr) || SVG_ATTRS.has(prop)) {
      // les attributs de présentation présents en style inline restent du CSS
      if (!target.style[toCamel(prop)]) return 'attr';
    }
  }
  if (toCamel(prop) in target.style) return 'css';
  if (target.hasAttribute && target.hasAttribute(prop)) return 'attr';
  return 'prop';
}

const SVG_ATTRS = new Set(['d', 'points', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'x2', 'y1', 'y2', 'viewBox', 'offset', 'stdDeviation', 'baseFrequency', 'scale', 'pathLength', 'width', 'height', 'fx', 'fy', 'dx', 'dy']);

export function defaultUnit(kind, prop) {
  if (kind === 'transform') return TRANSFORMS[prop].unit;
  if (kind === 'css') return UNITLESS.has(toCamel(prop)) ? '' : 'px';
  return '';
}

// —— Registre des transformations par élément ——
const store = new WeakMap();
const dirty = new Set();

/** Analyse la transformation en ligne d'un élément pour en reprendre les composantes. */
function readInlineTransform(el) {
  const out = { rest: '' };
  const src = el.style.transform;
  if (!src || src === 'none') return out;
  const rest = [];
  src.replace(/([a-zA-Z0-9]+)\(([^)]*)\)/g, (all, fn, args) => {
    const name = fn.toLowerCase();
    const parts = args.split(',').map((s) => s.trim());
    if (name === 'translate' || name === 'translate3d') {
      out.x = parts[0] || '0px'; if (parts[1]) out.y = parts[1]; if (parts[2]) out.z = parts[2];
    } else if (name === 'scale' && parts.length > 1) {
      out.scaleX = parts[0]; out.scaleY = parts[1];
    } else if (name === 'skew' && parts.length > 1) {
      out.skewX = parts[0]; out.skewY = parts[1];
    } else if (FN_TO_KEY[name] && parts.length === 1) {
      out[FN_TO_KEY[name]] = parts[0];
    } else rest.push(all);
    return all;
  });
  out.rest = rest.join(' ');
  return out;
}

function tstate(el) {
  let s = store.get(el);
  if (!s) {
    s = { values: readInlineTransform(el), original: el.style.transform, owners: 0 };
    store.set(el, s);
  }
  return s;
}

export function getTransform(el, key) {
  const s = tstate(el);
  if (s.values[key] !== undefined) return s.values[key];
  const base = TRANSFORMS[key].base;
  return base === null ? '' : base + TRANSFORMS[key].unit;
}

export function setTransform(el, key, value) {
  const s = tstate(el);
  s.values[key] = typeof value === 'number' ? value + TRANSFORMS[key].unit : value;
  dirty.add(el);
}

export function clearTransform(el, key) {
  const s = store.get(el);
  if (!s) return;
  delete s.values[key];
  dirty.add(el);
}

function composeTransform(el) {
  const s = store.get(el);
  if (!s) return;
  const v = s.values;
  let out = v.rest ? v.rest + ' ' : '';
  for (const key of ORDER) {
    if (v[key] === undefined) continue;
    const val = String(v[key]);
    const t = TRANSFORMS[key];
    // les valeurs neutres sont omises pour garder un style lisible
    if (t.base !== null && parseFloat(val) === t.base && key !== 'perspective') continue;
    out += `${t.fn}(${val}) `;
  }
  out = out.trim();
  el.style.transform = out || (s.original && !Object.keys(v).some((k) => k !== 'rest' && v[k] !== undefined) ? s.original : '');
}

/** Écrit les transformations accumulées pendant l'image en cours. */
export function flush() {
  if (!dirty.size) return;
  for (const el of dirty) composeTransform(el);
  dirty.clear();
}

/** Restaure la transformation d'origine si plus aucune composante n'est animée. */
export function restoreTransform(el, keys) {
  const s = store.get(el);
  if (!s) return;
  for (const k of keys) delete s.values[k];
  const left = Object.keys(s.values).filter((k) => k !== 'rest' && s.values[k] !== undefined);
  if (!left.length) {
    el.style.transform = s.original || '';
    store.delete(el);
    dirty.delete(el);
  } else dirty.add(el);
}

// —— Lecture / écriture génériques ——

export function readValue(target, prop, kind) {
  switch (kind) {
    case 'transform': return getTransform(target, prop);
    case 'var': {
      const inline = target.style.getPropertyValue(prop);
      if (inline) return inline.trim();
      return hasDOM ? getComputedStyle(target).getPropertyValue(prop).trim() : '';
    }
    case 'css': {
      const camel = toCamel(prop);
      const inline = target.style[camel];
      if (inline && inline !== 'auto') return inline;
      if (!hasDOM) return '';
      const v = getComputedStyle(target).getPropertyValue(toKebab(prop));
      return v === undefined ? '' : v;
    }
    case 'attr': {
      const v = target.getAttribute(prop);
      return v === null ? target.getAttribute(toKebab(prop)) || '' : v;
    }
    default: {
      const v = target[prop];
      return v === undefined || v === null ? 0 : v;
    }
  }
}

export function writeValue(target, prop, kind, value) {
  switch (kind) {
    case 'transform': setTransform(target, prop, value); break;
    case 'var': target.style.setProperty(prop, String(value)); break;
    case 'css': target.style.setProperty(toKebab(prop), String(value)); break;
    case 'attr': target.setAttribute(target.hasAttribute(prop) || !prop.match(/[A-Z]/) ? prop : toKebab(prop), String(value)); break;
    default: target[prop] = value;
  }
}

/** Capture la valeur d'origine (en ligne) pour pouvoir la restaurer avec revert(). */
export function captureOriginal(target, prop, kind) {
  switch (kind) {
    case 'transform': tstate(target); return null;
    case 'var':
    case 'css': return target.style.getPropertyValue(kind === 'var' ? prop : toKebab(prop));
    case 'attr': return target.getAttribute(prop);
    default: return target[prop];
  }
}

export function restoreOriginal(target, prop, kind, original) {
  switch (kind) {
    case 'transform': restoreTransform(target, [prop]); break;
    case 'var':
    case 'css': {
      const k = kind === 'var' ? prop : toKebab(prop);
      if (original) target.style.setProperty(k, original);
      else target.style.removeProperty(k);
      if (target.getAttribute('style') === '') target.removeAttribute('style');
      break;
    }
    case 'attr':
      if (original === null) target.removeAttribute(prop);
      else target.setAttribute(prop, original);
      break;
    default: target[prop] = original;
  }
}

export { fmt };
