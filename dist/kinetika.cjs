/*! Kinetika v0.1.0 | MIT © 2026 wwhabiboshdz3a7 | https://github.com/wwhabiboshdz3a7/kinetika */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.js
var index_exports = {};
__export(index_exports, {
  Animation: () => Animation,
  ScrollObserver: () => ScrollObserver,
  Timeline: () => Timeline,
  animate: () => animate,
  clamp: () => clamp2,
  createRandom: () => createRandom2,
  cubicBezier: () => cubicBezier,
  drawable: () => drawable,
  easeNames: () => easeNames,
  eases: () => eases,
  engine: () => engine,
  get: () => get,
  lerp: () => lerp2,
  linear: () => linear,
  mapRange: () => mapRange2,
  motionPath: () => motionPath,
  odometer: () => odometer,
  onScroll: () => onScroll,
  parseEase: () => parseEase,
  random: () => random2,
  remove: () => remove,
  round: () => round2,
  scramble: () => scramble,
  set: () => set,
  shuffle: () => shuffle2,
  snap: () => snap2,
  splitText: () => splitText,
  spring: () => spring,
  stagger: () => stagger,
  steps: () => steps,
  timeline: () => timeline,
  typewriter: () => typewriter,
  utils: () => utils,
  version: () => version,
  wrap: () => wrap2
});
module.exports = __toCommonJS(index_exports);

// src/utils.js
var utils_exports = {};
__export(utils_exports, {
  clamp: () => clamp,
  createRandom: () => createRandom,
  fmt: () => fmt,
  hasDOM: () => hasDOM,
  isArr: () => isArr,
  isEl: () => isEl,
  isFn: () => isFn,
  isNum: () => isNum,
  isObj: () => isObj,
  isSVG: () => isSVG,
  isStr: () => isStr,
  isUndef: () => isUndef,
  lerp: () => lerp,
  mapRange: () => mapRange,
  random: () => random,
  round: () => round,
  seed: () => seed,
  shuffle: () => shuffle,
  snap: () => snap,
  toCamel: () => toCamel,
  toKebab: () => toKebab,
  wrap: () => wrap
});
var isArr = Array.isArray;
var isFn = (v) => typeof v === "function";
var isStr = (v) => typeof v === "string";
var isNum = (v) => typeof v === "number" && !Number.isNaN(v);
var isObj = (v) => v !== null && typeof v === "object";
var isUndef = (v) => v === void 0;
var hasDOM = typeof window !== "undefined" && typeof document !== "undefined";
var isEl = (v) => hasDOM && v != null && typeof v === "object" && v.nodeType === 1;
var isSVG = (v) => isEl(v) && typeof SVGElement !== "undefined" && v instanceof SVGElement;
function clamp(v, min = 0, max = 1) {
  return v < min ? min : v > max ? max : v;
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function mapRange(v, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  return outMin + (v - inMin) / (inMax - inMin) * (outMax - outMin);
}
function round(v, decimals = 0) {
  const p = 10 ** decimals;
  return Math.round(v * p) / p;
}
function snap(v, increment) {
  if (isArr(increment)) {
    let best = increment[0];
    let d = Infinity;
    for (const c of increment) {
      const dc = Math.abs(c - v);
      if (dc < d) {
        d = dc;
        best = c;
      }
    }
    return best;
  }
  if (!increment) return v;
  return Math.round(v / increment) * increment;
}
function wrap(v, min, max) {
  const r = max - min;
  if (r === 0) return min;
  return ((v - min) % r + r) % r + min;
}
function createRandom(seed2 = Date.now()) {
  let s = (Math.floor(seed2) ^ 2654435769) >>> 0;
  if (s === 0) s = 1831565813;
  const next2 = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    let z = s;
    z = Math.imul(z ^ z >>> 15, 739982445) >>> 0;
    z = Math.imul(z ^ z >>> 12, 695872825) >>> 0;
    return ((z ^ z >>> 15) >>> 0) / 4294967296;
  };
  const random3 = (min, max, decimals) => {
    const r = next2();
    if (isUndef(min)) return r;
    if (isUndef(max)) {
      max = min;
      min = 0;
    }
    const v = min + r * (max - min);
    return isUndef(decimals) ? v : round(v, decimals);
  };
  random3.int = (min, max) => Math.floor(random3(min, max + 1));
  random3.pick = (list) => list[Math.floor(next2() * list.length)];
  random3.shuffle = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(next2() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return random3;
}
var globalRandom = createRandom(Date.now());
function random(min, max, decimals) {
  return globalRandom(min, max, decimals);
}
function seed(n) {
  globalRandom = createRandom(n);
  return globalRandom;
}
function shuffle(list, rng = globalRandom) {
  return rng.shuffle ? rng.shuffle(list) : createRandom(rng).shuffle(list);
}
function toKebab(s) {
  if (s.startsWith("--")) return s;
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}
function toCamel(s) {
  if (s.startsWith("--")) return s;
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
function fmt(n) {
  if (!Number.isFinite(n)) return 0;
  const r = Math.round(n * 1e4) / 1e4;
  return r === 0 ? 0 : r;
}

// src/props.js
var TRANSFORMS = {
  perspective: { fn: "perspective", unit: "px", base: null },
  x: { fn: "translateX", unit: "px", base: 0 },
  y: { fn: "translateY", unit: "px", base: 0 },
  z: { fn: "translateZ", unit: "px", base: 0 },
  rotateX: { fn: "rotateX", unit: "deg", base: 0 },
  rotateY: { fn: "rotateY", unit: "deg", base: 0 },
  rotate: { fn: "rotate", unit: "deg", base: 0 },
  rotateZ: { fn: "rotateZ", unit: "deg", base: 0 },
  skew: { fn: "skew", unit: "deg", base: 0 },
  skewX: { fn: "skewX", unit: "deg", base: 0 },
  skewY: { fn: "skewY", unit: "deg", base: 0 },
  scale: { fn: "scale", unit: "", base: 1 },
  scaleX: { fn: "scaleX", unit: "", base: 1 },
  scaleY: { fn: "scaleY", unit: "", base: 1 },
  scaleZ: { fn: "scaleZ", unit: "", base: 1 }
};
var ALIASES = { translateX: "x", translateY: "y", translateZ: "z" };
var ORDER = Object.keys(TRANSFORMS);
var FN_TO_KEY = Object.fromEntries(Object.entries(TRANSFORMS).map(([k, v]) => [v.fn.toLowerCase(), k]));
var UNITLESS = /* @__PURE__ */ new Set([
  "opacity",
  "zIndex",
  "fontWeight",
  "lineHeight",
  "flex",
  "flexGrow",
  "flexShrink",
  "order",
  "zoom",
  "fillOpacity",
  "strokeOpacity",
  "stopOpacity",
  "floodOpacity",
  "strokeMiterlimit",
  "columnCount",
  "orphans",
  "widows",
  "aspectRatio",
  "scale"
]);
function normalizeProp(prop) {
  return ALIASES[prop] || prop;
}
function propKind(target, prop) {
  if (!isEl(target)) return "prop";
  if (TRANSFORMS[prop]) return "transform";
  if (prop.startsWith("--")) return "var";
  if (isSVG(target)) {
    const attr = prop.includes("-") ? prop : toKebab(prop);
    if (target.hasAttribute(prop) || target.hasAttribute(attr) || SVG_ATTRS.has(prop)) {
      if (!target.style[toCamel(prop)]) return "attr";
    }
  }
  if (toCamel(prop) in target.style) return "css";
  if (target.hasAttribute && target.hasAttribute(prop)) return "attr";
  return "prop";
}
var SVG_ATTRS = /* @__PURE__ */ new Set(["d", "points", "cx", "cy", "r", "rx", "ry", "x1", "x2", "y1", "y2", "viewBox", "offset", "stdDeviation", "baseFrequency", "scale", "pathLength", "width", "height", "fx", "fy", "dx", "dy"]);
function defaultUnit(kind, prop) {
  if (kind === "transform") return TRANSFORMS[prop].unit;
  if (kind === "css") return UNITLESS.has(toCamel(prop)) ? "" : "px";
  return "";
}
var store = /* @__PURE__ */ new WeakMap();
var dirty = /* @__PURE__ */ new Set();
function readInlineTransform(el) {
  const out = { rest: "" };
  const src = el.style.transform;
  if (!src || src === "none") return out;
  const rest = [];
  src.replace(/([a-zA-Z0-9]+)\(([^)]*)\)/g, (all, fn, args) => {
    const name = fn.toLowerCase();
    const parts = args.split(",").map((s) => s.trim());
    if (name === "translate" || name === "translate3d") {
      out.x = parts[0] || "0px";
      if (parts[1]) out.y = parts[1];
      if (parts[2]) out.z = parts[2];
    } else if (name === "scale" && parts.length > 1) {
      out.scaleX = parts[0];
      out.scaleY = parts[1];
    } else if (name === "skew" && parts.length > 1) {
      out.skewX = parts[0];
      out.skewY = parts[1];
    } else if (FN_TO_KEY[name] && parts.length === 1) {
      out[FN_TO_KEY[name]] = parts[0];
    } else rest.push(all);
    return all;
  });
  out.rest = rest.join(" ");
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
function getTransform(el, key) {
  const s = tstate(el);
  if (s.values[key] !== void 0) return s.values[key];
  const base = TRANSFORMS[key].base;
  return base === null ? "" : base + TRANSFORMS[key].unit;
}
function setTransform(el, key, value) {
  const s = tstate(el);
  s.values[key] = typeof value === "number" ? value + TRANSFORMS[key].unit : value;
  dirty.add(el);
}
function composeTransform(el) {
  const s = store.get(el);
  if (!s) return;
  const v = s.values;
  let out = v.rest ? v.rest + " " : "";
  for (const key of ORDER) {
    if (v[key] === void 0) continue;
    const val = String(v[key]);
    const t = TRANSFORMS[key];
    if (t.base !== null && parseFloat(val) === t.base && key !== "perspective") continue;
    out += `${t.fn}(${val}) `;
  }
  out = out.trim();
  el.style.transform = out || (s.original && !Object.keys(v).some((k) => k !== "rest" && v[k] !== void 0) ? s.original : "");
}
function flush() {
  if (!dirty.size) return;
  for (const el of dirty) composeTransform(el);
  dirty.clear();
}
function restoreTransform(el, keys) {
  const s = store.get(el);
  if (!s) return;
  for (const k of keys) delete s.values[k];
  const left = Object.keys(s.values).filter((k) => k !== "rest" && s.values[k] !== void 0);
  if (!left.length) {
    el.style.transform = s.original || "";
    store.delete(el);
    dirty.delete(el);
  } else dirty.add(el);
}
function readValue(target, prop, kind) {
  switch (kind) {
    case "transform":
      return getTransform(target, prop);
    case "var": {
      const inline = target.style.getPropertyValue(prop);
      if (inline) return inline.trim();
      return hasDOM ? getComputedStyle(target).getPropertyValue(prop).trim() : "";
    }
    case "css": {
      const camel = toCamel(prop);
      const inline = target.style[camel];
      if (inline && inline !== "auto") return inline;
      if (!hasDOM) return "";
      const v = getComputedStyle(target).getPropertyValue(toKebab(prop));
      return v === void 0 ? "" : v;
    }
    case "attr": {
      const v = target.getAttribute(prop);
      return v === null ? target.getAttribute(toKebab(prop)) || "" : v;
    }
    default: {
      const v = target[prop];
      return v === void 0 || v === null ? 0 : v;
    }
  }
}
function writeValue(target, prop, kind, value) {
  switch (kind) {
    case "transform":
      setTransform(target, prop, value);
      break;
    case "var":
      target.style.setProperty(prop, String(value));
      break;
    case "css":
      target.style.setProperty(toKebab(prop), String(value));
      break;
    case "attr":
      target.setAttribute(target.hasAttribute(prop) || !prop.match(/[A-Z]/) ? prop : toKebab(prop), String(value));
      break;
    default:
      target[prop] = value;
  }
}
function captureOriginal(target, prop, kind) {
  switch (kind) {
    case "transform":
      tstate(target);
      return null;
    case "var":
    case "css":
      return target.style.getPropertyValue(kind === "var" ? prop : toKebab(prop));
    case "attr":
      return target.getAttribute(prop);
    default:
      return target[prop];
  }
}
function restoreOriginal(target, prop, kind, original) {
  switch (kind) {
    case "transform":
      restoreTransform(target, [prop]);
      break;
    case "var":
    case "css": {
      const k = kind === "var" ? prop : toKebab(prop);
      if (original) target.style.setProperty(k, original);
      else target.style.removeProperty(k);
      if (target.getAttribute("style") === "") target.removeAttribute("style");
      break;
    }
    case "attr":
      if (original === null) target.removeAttribute(prop);
      else target.setAttribute(prop, original);
      break;
    default:
      target[prop] = original;
  }
}

// src/engine.js
var raf = hasDOM && typeof requestAnimationFrame === "function" ? requestAnimationFrame.bind(window) : null;
var caf = hasDOM && typeof cancelAnimationFrame === "function" ? cancelAnimationFrame.bind(window) : null;
var now = () => typeof performance !== "undefined" ? performance.now() : Date.now();
var active = [];
var frameId = null;
var last = 0;
var elapsed = 0;
var hidden = false;
var reducedQuery = null;
var state = {
  timeScale: 1,
  manual: !raf,
  pauseOnHidden: true,
  lagSmoothing: { threshold: 250, adjusted: 33 },
  reducedMotion: "auto",
  defaults: {
    duration: 1e3,
    delay: 0,
    ease: "outQuad",
    loop: 0,
    loopDelay: 0,
    alternate: false,
    reversed: false,
    autoplay: true,
    speed: 1,
    composition: "replace"
  }
};
function frame(t) {
  frameId = null;
  let dt = t - last;
  last = t;
  const lag = state.lagSmoothing;
  if (lag && dt > lag.threshold) dt = lag.adjusted;
  if (dt < 0) dt = 0;
  step(dt);
  if (active.length && !state.manual && !state.paused && !(hidden && state.pauseOnHidden)) frameId = raf(frame);
}
function step(dt) {
  const scaled = dt * state.timeScale;
  elapsed += scaled;
  const list = active.slice();
  for (const t of list) {
    if (t._engineActive) t._tick(scaled);
  }
  flush();
}
function wake() {
  if (frameId !== null || state.paused || state.manual || !raf || hidden && state.pauseOnHidden) return;
  last = now();
  frameId = raf(frame);
}
function sleep() {
  if (frameId !== null && caf) caf(frameId);
  frameId = null;
}
if (hasDOM && typeof document.addEventListener === "function") {
  document.addEventListener("visibilitychange", () => {
    hidden = document.visibilityState === "hidden";
    if (hidden && state.pauseOnHidden) sleep();
    else if (!hidden && active.length) wake();
  });
}
var engine = {
  /** Échelle de temps globale (0.5 = tout au ralenti). */
  get timeScale() {
    return state.timeScale;
  },
  set timeScale(v) {
    state.timeScale = Math.max(0, +v || 0);
  },
  /** Mode manuel : pas de requestAnimationFrame, on avance avec engine.tick(ms). */
  get manual() {
    return state.manual;
  },
  set manual(v) {
    state.manual = !!v || !raf;
    if (state.manual) sleep();
    else if (active.length) wake();
  },
  /** Met le moteur en pause quand l'onglet est masqué (par défaut). */
  get pauseOnHidden() {
    return state.pauseOnHidden;
  },
  set pauseOnHidden(v) {
    state.pauseOnHidden = !!v;
  },
  /** Lissage des sauts : au-delà de `threshold` ms entre deux images, on avance de `adjusted` ms. */
  get lagSmoothing() {
    return state.lagSmoothing;
  },
  set lagSmoothing(v) {
    state.lagSmoothing = v ? { threshold: 250, adjusted: 33, ...v } : null;
  },
  /** 'auto' (préférence système), true (toujours réduire) ou false (jamais). */
  get reducedMotion() {
    return state.reducedMotion;
  },
  set reducedMotion(v) {
    state.reducedMotion = v === "auto" ? "auto" : !!v;
  },
  /** Le mouvement réduit est-il actuellement en vigueur ? */
  get prefersReducedMotion() {
    return isReduced();
  },
  /** Paramètres par défaut de toutes les animations. */
  get defaults() {
    return state.defaults;
  },
  set defaults(v) {
    Object.assign(state.defaults, v);
  },
  /** Temps écoulé du moteur (ms, échelle comprise). */
  get time() {
    return elapsed;
  },
  /** Nombre d'éléments actifs dans la boucle. */
  get activeCount() {
    return active.length;
  },
  /** Avance toutes les animations de `ms` millisecondes (tests, rendu image par image). */
  tick(ms = 1e3 / 60) {
    step(Math.max(0, ms));
  },
  /** Met toute la boucle en pause / la relance. */
  pause() {
    state.paused = true;
    sleep();
  },
  resume() {
    state.paused = false;
    if (active.length) wake();
  }
};
function isReduced() {
  const r = state.reducedMotion;
  if (r !== "auto") return r;
  if (!hasDOM || typeof matchMedia !== "function") return false;
  reducedQuery = reducedQuery || matchMedia("(prefers-reduced-motion: reduce)");
  return reducedQuery.matches;
}
function addActive(t) {
  if (t._engineActive) return;
  t._engineActive = true;
  active.push(t);
  if (!state.paused) wake();
}
function removeActive(t) {
  if (!t._engineActive) return;
  t._engineActive = false;
  const i = active.indexOf(t);
  if (i > -1) active.splice(i, 1);
}
function activeList() {
  return active;
}

// src/easings.js
var PI = Math.PI;
var HALF_PI = PI / 2;
var TAU = PI * 2;
var power = (p = 2) => (t) => t ** p;
var baseIn = {
  Quad: () => power(2),
  Cubic: () => power(3),
  Quart: () => power(4),
  Quint: () => power(5),
  Sine: () => (t) => 1 - Math.cos(t * HALF_PI),
  Expo: () => (t) => t <= 0 ? 0 : 2 ** (10 * t - 10),
  Circ: () => (t) => 1 - Math.sqrt(Math.max(0, 1 - t * t)),
  Back: (overshoot = 1.70158) => (t) => (overshoot + 1) * t * t * t - overshoot * t * t,
  Elastic: (amplitude = 1, period = 0.3) => {
    const a = Math.max(1, amplitude);
    const p = Math.max(0.05, period);
    const s = p / TAU * Math.asin(1 / a);
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      const u = t - 1;
      return -(a * 2 ** (10 * u) * Math.sin((u - s) * TAU / p));
    };
  },
  Bounce: () => (t) => 1 - bounceOut(1 - t)
};
function bounceOut(t) {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) {
    t -= 1.5 / d;
    return n * t * t + 0.75;
  }
  if (t < 2.5 / d) {
    t -= 2.25 / d;
    return n * t * t + 0.9375;
  }
  t -= 2.625 / d;
  return n * t * t + 0.984375;
}
var toOut = (f) => (t) => 1 - f(1 - t);
var toInOut = (f) => (t) => t < 0.5 ? f(t * 2) / 2 : 1 - f(2 - t * 2) / 2;
var toOutIn = (f) => (t) => t < 0.5 ? (1 - f(1 - t * 2)) / 2 : f(t * 2 - 1) / 2 + 0.5;
var variants = { in: (f) => f, out: toOut, inOut: toInOut, outIn: toOutIn };
var linear = (t) => t;
var eases = {};
var register = (name, make) => {
  const fn = make();
  fn.with = (...args) => args.length ? make(...args) : fn;
  eases[name] = fn;
};
register("linear", () => linear);
for (const fam of Object.keys(baseIn)) {
  for (const v of Object.keys(variants)) {
    register(v + fam, (...args) => variants[v](baseIn[fam](...args)));
  }
}
for (const v of Object.keys(variants)) {
  register(v, (p = 2) => variants[v](power(p)));
}
function cubicBezier(x1 = 0.25, y1 = 0.1, x2 = 0.25, y2 = 1) {
  x1 = Math.min(1, Math.max(0, x1));
  x2 = Math.min(1, Math.max(0, x2));
  if (x1 === y1 && x2 === y2) return linear;
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
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (x) => x <= 0 ? 0 : x >= 1 ? 1 : sy(solve(x));
}
function steps(count = 10, jump = "end") {
  const n = Math.max(1, Math.round(count));
  return jump === "start" ? (t) => t >= 1 ? 1 : Math.min(1, Math.ceil(t * n) / n) : (t) => t >= 1 ? 1 : Math.floor(t * n) / n;
}
var springCache = /* @__PURE__ */ new Map();
function spring({ mass = 1, stiffness = 100, damping = 10, velocity = 0 } = {}) {
  const m = Math.max(0.01, mass);
  const k = Math.max(0.01, stiffness);
  const c = Math.max(0, damping);
  const key = `${m}|${k}|${c}|${velocity}`;
  if (springCache.has(key)) return springCache.get(key);
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
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
  const eps = 8e-4;
  const step2 = 1 / 240;
  let last2 = 0;
  for (let t = 0; t < 30; t += step2) {
    if (Math.abs(disp(t)) > eps) last2 = t;
    else if (t - last2 > 1) break;
  }
  const settle = Math.max(step2, last2 + step2);
  const fn = (t) => t <= 0 ? 0 : t >= 1 ? 1 : 1 + disp(t * settle);
  fn.duration = Math.round(settle * 1e3);
  fn.isSpring = true;
  fn.params = { mass: m, stiffness: k, damping: c, velocity };
  springCache.set(key, fn);
  return fn;
}
var cssKeywords = {
  ease: cubicBezier(0.25, 0.1, 0.25, 1),
  "ease-in": cubicBezier(0.42, 0, 1, 1),
  "ease-out": cubicBezier(0, 0, 0.58, 1),
  "ease-in-out": cubicBezier(0.42, 0, 0.58, 1)
};
var gsapPower = { power1: "Quad", power2: "Cubic", power3: "Quart", power4: "Quint", quad: "Quad", cubic: "Cubic", quart: "Quart", quint: "Quint", strong: "Quint", sine: "Sine", expo: "Expo", circ: "Circ", back: "Back", elastic: "Elastic", bounce: "Bounce" };
var parseCache = /* @__PURE__ */ new Map();
function parseArgs(s) {
  return s.split(",").map((x) => x.trim()).filter(Boolean).map(Number);
}
function parseEase(ease) {
  if (isFn(ease)) return ease;
  if (!isStr(ease) || !ease.trim()) return null;
  if (parseCache.has(ease)) return parseCache.get(ease);
  const raw = ease.trim();
  let fn = null;
  const m = raw.match(/^([\w.-]+)\s*(?:\(([^)]*)\))?$/);
  if (m) {
    let name = m[1];
    const args = m[2] !== void 0 ? parseArgs(m[2]) : [];
    if (cssKeywords[name]) fn = cssKeywords[name];
    else if (name === "linear") fn = linear;
    else if (name === "cubicBezier" || name === "cubic-bezier") fn = cubicBezier(...args);
    else if (name === "steps") fn = steps(args[0], (m[2] || "").includes("start") ? "start" : "end");
    else if (name === "spring") fn = spring({ mass: args[0], stiffness: args[1], damping: args[2], velocity: args[3] });
    else {
      const g = name.match(/^(\w+)\.(in|out|inOut)$/);
      if (g && gsapPower[g[1]]) name = g[2] + gsapPower[g[1]];
      const a = name.match(/^ease(In|Out|InOut|OutIn)(\w+)$/);
      if (a) name = a[1][0].toLowerCase() + a[1].slice(1) + a[2];
      if (gsapPower[name] && !eases[name]) name = "out" + gsapPower[name];
      const base = eases[name];
      if (base) fn = args.length ? base.with(...args) : base;
    }
  }
  if (fn) parseCache.set(ease, fn);
  return fn;
}
var easeNames = Object.keys(eases);

// src/color.js
var NAMED = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 1],
  white: [255, 255, 255, 1],
  red: [255, 0, 0, 1],
  green: [0, 128, 0, 1],
  lime: [0, 255, 0, 1],
  blue: [0, 0, 255, 1],
  yellow: [255, 255, 0, 1],
  cyan: [0, 255, 255, 1],
  aqua: [0, 255, 255, 1],
  magenta: [255, 0, 255, 1],
  fuchsia: [255, 0, 255, 1],
  orange: [255, 165, 0, 1],
  purple: [128, 0, 128, 1],
  pink: [255, 192, 203, 1],
  gray: [128, 128, 128, 1],
  grey: [128, 128, 128, 1],
  silver: [192, 192, 192, 1],
  navy: [0, 0, 128, 1],
  teal: [0, 128, 128, 1],
  maroon: [128, 0, 0, 1],
  olive: [128, 128, 0, 1],
  gold: [255, 215, 0, 1],
  coral: [255, 127, 80, 1],
  tomato: [255, 99, 71, 1],
  crimson: [220, 20, 60, 1],
  indigo: [75, 0, 130, 1],
  violet: [238, 130, 238, 1],
  hotpink: [255, 105, 180, 1],
  turquoise: [64, 224, 208, 1],
  salmon: [250, 128, 114, 1],
  chocolate: [210, 105, 30, 1]
};
var COLOR_RE = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)/gi;
var NAMED_RE = new RegExp(`^(${Object.keys(NAMED).join("|")})$`, "i");
function isColor(s) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t) || /^(rgba?|hsla?)\(/i.test(t) || NAMED_RE.test(t);
}
function hslToRgb(h, s, l) {
  h = (h % 360 + 360) % 360;
  s = clamp(s, 0, 1);
  l = clamp(l, 0, 1);
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
function num(part, scale) {
  part = part.trim();
  if (part.endsWith("%")) return parseFloat(part) / 100 * scale;
  return parseFloat(part);
}
function angle(part) {
  part = part.trim();
  const v = parseFloat(part);
  if (part.endsWith("turn")) return v * 360;
  if (part.endsWith("rad")) return v * 180 / Math.PI;
  if (part.endsWith("grad")) return v * 0.9;
  return v;
}
var probe = null;
function parseColor(input) {
  if (typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  if (s[0] === "#") {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return null;
    if (h.length === 6) return [n >> 16 & 255, n >> 8 & 255, n & 255, 1];
    return [n >>> 24 & 255, n >> 16 & 255, n >> 8 & 255, (n & 255) / 255];
  }
  const fm = s.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (fm) {
    const body = fm[2].replace(/\s*\/\s*/, ",").replace(/,/g, " ").trim().split(/\s+/);
    const alpha = body[3] !== void 0 ? clamp(num(body[3], 1)) : 1;
    if (fm[1].startsWith("rgb")) {
      return [clamp(num(body[0], 255), 0, 255), clamp(num(body[1], 255), 0, 255), clamp(num(body[2], 255), 0, 255), alpha];
    }
    const [r, g, b] = hslToRgb(angle(body[0]), num(body[1], 1) / (body[1].includes("%") ? 1 : 100), num(body[2], 1) / (body[2].includes("%") ? 1 : 100));
    return [r, g, b, alpha];
  }
  if (NAMED[s]) return [...NAMED[s]];
  if (hasDOM && /^[a-z]+$/.test(s)) {
    probe = probe || document.createElement("i");
    probe.style.color = "";
    probe.style.color = s;
    if (!probe.style.color) return null;
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c && c.startsWith("rgb") ? parseColor(c) : null;
  }
  return null;
}
var toLin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
var fromLin = (c) => 255 * (c <= 31308e-7 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function rgbToOklab([r, g, b]) {
  const lr = toLin(r), lg = toLin(g), lb = toLin(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}
function oklabToRgb([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    clamp(fromLin(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), 0, 255),
    clamp(fromLin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), 0, 255),
    clamp(fromLin(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s), 0, 255)
  ];
}
function colorValue(rgba) {
  const lab = rgbToOklab(rgba);
  const a = rgba[3];
  return { type: "color", rgba, a, pm: [lab[0] * a, lab[1] * a, lab[2] * a] };
}
function mixColor(from, to, t) {
  const a = clamp(from.a + (to.a - from.a) * t, 0, 1);
  if (a <= 0) return "rgba(0, 0, 0, 0)";
  const pm = [0, 1, 2].map((i) => from.pm[i] + (to.pm[i] - from.pm[i]) * t);
  const [r, g, b] = oklabToRgb([pm[0] / a, pm[1] / a, pm[2] / a]);
  return formatRgb(r, g, b, a);
}
function formatRgb(r, g, b, a = 1) {
  const R = Math.round(r), G = Math.round(g), B = Math.round(b);
  return a >= 1 ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${Math.round(a * 1e3) / 1e3})`;
}
function colorToString(c) {
  return formatRgb(c.rgba[0], c.rgba[1], c.rgba[2], c.rgba[3]);
}

// src/values.js
var CUSTOM = /* @__PURE__ */ Symbol.for("kinetika.custom");
var NUM_UNIT_RE = /^([+\-*/]=)?\s*(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*([a-z%]*)$/i;
var TOKEN_RE = /-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?[a-z%]*/gi;
var numValue = (n, unit = "") => ({ type: "num", n, unit });
function parseValue(raw) {
  if (raw && raw[CUSTOM]) return { type: "custom", get: raw[CUSTOM], unit: raw.unit || "" };
  if (isNum(raw)) return numValue(raw, "");
  if (typeof raw === "boolean") return { type: "raw", s: raw };
  if (!isStr(raw)) return { type: "raw", s: raw };
  const s = raw.trim();
  const m = s.match(NUM_UNIT_RE);
  if (m) {
    const v = numValue(parseFloat(m[2]), m[3] || "");
    if (m[1]) v.op = m[1][0];
    return v;
  }
  if (isColor(s)) {
    const c = parseColor(s);
    if (c) return colorValue(c);
  }
  return parseComplex(s);
}
function parseComplex(s) {
  const tokens = [];
  const strings = [];
  let last2 = 0;
  const marks = [];
  s.replace(COLOR_RE, (m, idx) => {
    marks.push({ idx, len: m.length, kind: "color", text: m });
    return m;
  });
  const inColor = (i) => marks.some((c) => i >= c.idx && i < c.idx + c.len);
  s.replace(TOKEN_RE, (m, idx) => {
    if (inColor(idx)) return m;
    const prev = s[idx - 1];
    if (prev && /[#_]/.test(prev)) return m;
    marks.push({ idx, len: m.length, kind: "num", text: m });
    return m;
  });
  marks.sort((a, b) => a.idx - b.idx);
  for (const mk of marks) {
    strings.push(s.slice(last2, mk.idx));
    if (mk.kind === "color") tokens.push(colorValue(parseColor(mk.text)));
    else {
      const mm = mk.text.match(/^(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)$/i);
      tokens.push(numValue(parseFloat(mm[1]), mm[2] || ""));
    }
    last2 = mk.idx + mk.len;
  }
  strings.push(s.slice(last2));
  if (!tokens.length) return { type: "raw", s };
  return { type: "complex", strings, tokens, s };
}
function applyRelative(from, to) {
  if (!to.op || from.type !== "num") return to;
  const n = to.op === "+" ? from.n + to.n : to.op === "-" ? from.n - to.n : to.op === "*" ? from.n * to.n : from.n / (to.n || 1);
  return numValue(n, to.unit || from.unit);
}
var ANGLE = { deg: 1, rad: 180 / Math.PI, turn: 360, grad: 0.9 };
var VERTICAL = /^(height|top|bottom|y|translateY|marginTop|marginBottom|paddingTop|paddingBottom|minHeight|maxHeight|rowGap|borderTopWidth|borderBottomWidth)$/;
function parentOf(el) {
  return el && el.parentElement || (hasDOM ? document.documentElement : null);
}
function fontSizeOf(el) {
  if (!hasDOM || !el) return 16;
  return parseFloat(getComputedStyle(el).fontSize) || 16;
}
function pxPer(unit, el, prop, isTransform) {
  switch (unit) {
    case "":
    case "px":
      return 1;
    case "em":
      return fontSizeOf(prop === "fontSize" ? parentOf(el) : el);
    case "rem":
      return fontSizeOf(hasDOM ? document.documentElement : null);
    case "vw":
      return hasDOM ? innerWidth / 100 : 1;
    case "vh":
      return hasDOM ? innerHeight / 100 : 1;
    case "vmin":
      return hasDOM ? Math.min(innerWidth, innerHeight) / 100 : 1;
    case "vmax":
      return hasDOM ? Math.max(innerWidth, innerHeight) / 100 : 1;
    case "%": {
      if (!isEl(el)) return 1;
      const vertical = VERTICAL.test(prop);
      if (isTransform) {
        const r2 = el.getBoundingClientRect();
        return (vertical ? el.offsetHeight || r2.height : el.offsetWidth || r2.width) / 100 || 1;
      }
      if (prop === "fontSize") return fontSizeOf(parentOf(el)) / 100;
      const p = parentOf(el);
      const r = p ? p.getBoundingClientRect() : null;
      return (r ? vertical ? r.height : r.width : 100) / 100 || 1;
    }
    default:
      return measure(unit, el, prop);
  }
}
function measure(unit, el, prop) {
  if (!isEl(el)) return 1;
  const p = parentOf(el);
  const probe2 = document.createElement(el.tagName === "svg" ? "div" : el.tagName);
  probe2.style.position = "absolute";
  probe2.style.visibility = "hidden";
  probe2.style.width = "100" + unit;
  p.appendChild(probe2);
  const w = probe2.getBoundingClientRect().width;
  probe2.remove();
  return w ? w / 100 : 1;
}
function convertUnit(v, unit, el, prop, isTransform = false) {
  if (v.type !== "num" || v.unit === unit || !unit) return v;
  if (v.n === 0 || !v.unit) return numValue(v.n, unit);
  if (ANGLE[v.unit] && ANGLE[unit]) return numValue(v.n * ANGLE[v.unit] / ANGLE[unit], unit);
  const px = v.n * pxPer(v.unit, el, prop, isTransform);
  return numValue(px / pxPer(unit, el, prop, isTransform), unit);
}
function unify(from, to, ctx) {
  if (from.type === "num" && to.type === "num") {
    if (to.unit && from.unit !== to.unit) from = convertUnit(from, to.unit, ctx.el, ctx.prop, ctx.isTransform);
    else if (!to.unit && from.unit) to = numValue(to.n, from.unit);
    else if (!to.unit && !from.unit && ctx.defaultUnit) {
      from = numValue(from.n, ctx.defaultUnit);
      to = numValue(to.n, ctx.defaultUnit);
    }
    return [from, to];
  }
  if (from.type === "complex" && to.type === "num" && from.tokens.length === 1 && from.tokens[0].type === "num") {
    return unify(from.tokens[0], to, ctx);
  }
  if (from.type === "raw" && to.type === "num" && (from.s === "" || from.s === "auto" || from.s === "none" || from.s == null)) {
    return [numValue(0, to.unit || ctx.defaultUnit || ""), to.unit ? to : numValue(to.n, ctx.defaultUnit || "")];
  }
  if (from.type === "raw" && to.type === "color" && (from.s === "" || from.s === "none")) {
    return [colorValue([to.rgba[0], to.rgba[1], to.rgba[2], 0]), to];
  }
  if (to.type === "complex" && from.type !== "complex") {
    if (from.type === "raw" && (from.s === "" || from.s === "none" || from.s == null)) {
      return [{ ...to, tokens: to.tokens.map((t) => t.type === "num" ? numValue(0, t.unit) : colorValue([t.rgba[0], t.rgba[1], t.rgba[2], 0])) }, to];
    }
  }
  if (from.type === "complex" && to.type === "complex") {
    const same = from.tokens.length === to.tokens.length && from.tokens.every((t, i) => t.type === to.tokens[i].type);
    if (same) {
      const tokens = from.tokens.map((t, i) => t.type === "num" && to.tokens[i].type === "num" && to.tokens[i].unit && t.unit !== to.tokens[i].unit && t.n === 0 ? numValue(0, to.tokens[i].unit) : t);
      return [{ ...from, tokens }, to];
    }
  }
  return [from, to];
}
function serialize(v, asNumber) {
  switch (v.type) {
    case "num":
      return asNumber && !v.unit ? fmt(v.n) : fmt(v.n) + v.unit;
    case "color":
      return colorToString(v);
    case "complex":
      return v.strings.reduce((acc, str, i) => acc + str + (i < v.tokens.length ? serialize(v.tokens[i]) : ""), "");
    default:
      return v.s;
  }
}
function interpolate(from, to, t, asNumber, modifier, target) {
  if (to.type === "custom") {
    const v2 = to.get(t, target);
    return isNum(v2) ? fmt(modifier ? modifier(v2) : v2) + to.unit : v2;
  }
  if (from.type === "num" && to.type === "num") {
    let n = from.n + (to.n - from.n) * t;
    if (modifier) n = modifier(n);
    const unit = to.unit || from.unit;
    return asNumber && !unit ? n : fmt(n) + unit;
  }
  if (from.type === "color" && to.type === "color") return mixColor(from, to, t);
  if (from.type === "complex" && to.type === "complex" && from.tokens.length === to.tokens.length) {
    let out = "";
    for (let i = 0; i < to.strings.length; i++) {
      out += to.strings[i];
      if (i < to.tokens.length) {
        const a = from.tokens[i], b = to.tokens[i];
        if (a.type === "num" && b.type === "num") {
          let n = a.n + (b.n - a.n) * t;
          if (modifier) n = modifier(n);
          out += fmt(n) + (b.unit || a.unit);
        } else if (a.type === "color" && b.type === "color") out += mixColor(a, b, t);
        else out += serialize(t < 1 ? a : b);
      }
    }
    return out;
  }
  const v = t < 0.5 ? from : to;
  return v.type === "raw" ? v.s : serialize(v, asNumber);
}
function customValue(get2, unit = "") {
  return { [CUSTOM]: get2, unit };
}
var isCustom = (v) => isObj(v) && !!v[CUSTOM];

// src/targets.js
var ids = /* @__PURE__ */ new WeakMap();
var next = 0;
function targetId(t) {
  if (!isObj(t) && typeof t !== "function") return String(t);
  let id = ids.get(t);
  if (!id) {
    id = ++next;
    ids.set(t, id);
  }
  return id;
}
function isListLike(v) {
  if (!v || isStr(v) || typeof v !== "object") return false;
  if (isArr(v)) return true;
  if (hasDOM && (v instanceof NodeList || v instanceof HTMLCollection)) return true;
  return typeof v.length === "number" && v.nodeType === void 0 && v !== globalThis && typeof v[Symbol.iterator] === "function";
}
function resolveTargets(input, root = hasDOM ? document : null) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const visit = (v) => {
    if (v == null || v === false) return;
    if (isStr(v)) {
      if (!root) return;
      try {
        root.querySelectorAll(v).forEach(add);
      } catch (e) {
      }
      return;
    }
    if (isListLike(v)) {
      for (const x of v) visit(x);
      return;
    }
    add(v);
  };
  const add = (v) => {
    if (seen.has(v)) return;
    seen.add(v);
    out.push(v);
  };
  visit(input);
  return out;
}

// src/playable.js
var SCROLL = /* @__PURE__ */ Symbol.for("kinetika.scroll");
var uid = 0;
function loopsOf(loop) {
  if (loop === true || loop === Infinity || loop === -1) return Infinity;
  if (isNum(loop) && loop > 0) return Math.floor(loop) + 1;
  return 1;
}
var Playable = class {
  constructor(params = {}) {
    var _a, _b, _c, _d, _e, _f;
    const d = engine.defaults;
    this.id = (_a = params.id) != null ? _a : `kt-${++uid}`;
    this._params = params;
    this._delay = 0;
    this._iterDur = 0;
    this._loops = loopsOf((_b = params.loop) != null ? _b : d.loop);
    this._loopDelay = Math.max(0, +((_c = params.loopDelay) != null ? _c : d.loopDelay) || 0);
    this._alternate = !!((_d = params.alternate) != null ? _d : d.alternate);
    this._speed = +((_e = params.speed) != null ? _e : d.speed) || 1;
    this._dir = ((_f = params.reversed) != null ? _f : d.reversed) ? -1 : 1;
    this._time = 0;
    this._paused = true;
    this._began = false;
    this._completed = false;
    this._cancelled = false;
    this._iter = -1;
    this._lastIt = -1;
    this._rendered = false;
    this._parent = null;
    this._allowReduce = params.reducedMotion !== false;
    this._cb = {
      onBegin: params.onBegin,
      onUpdate: params.onUpdate,
      onLoop: params.onLoop,
      onComplete: params.onComplete,
      onPause: params.onPause
    };
    this._promise = null;
    this._resolve = null;
  }
  // —— Durées ——
  /** Durée d'une itération (ms). */
  get iterationDuration() {
    return this._iterDur;
  }
  /** Durée totale (délai et boucles compris). Infinity si la boucle est infinie. */
  get duration() {
    return this._total();
  }
  _total() {
    if (this._loops === Infinity) return Infinity;
    return this._delay + this._loops * this._iterDur + (this._loops - 1) * this._loopDelay;
  }
  // —— État ——
  get paused() {
    return this._paused;
  }
  get began() {
    return this._began;
  }
  get completed() {
    return this._completed;
  }
  get reversed() {
    return this._dir < 0;
  }
  get currentTime() {
    return this._time;
  }
  set currentTime(t) {
    this.seek(t);
  }
  get iteration() {
    return Math.max(0, this._iter);
  }
  get speed() {
    return this._speed;
  }
  set speed(v) {
    this._speed = Math.max(0, +v || 0);
  }
  /** Progression totale entre 0 et 1 (celle de l'itération en cours si la boucle est infinie). */
  get progress() {
    const total = this._total();
    if (total === Infinity) {
      const cycle = this._iterDur + this._loopDelay;
      if (!cycle) return 0;
      const local = Math.max(0, this._time - this._delay);
      return clamp(local % cycle / (this._iterDur || 1));
    }
    return total ? clamp(this._time / total) : this._completed ? 1 : 0;
  }
  set progress(p) {
    const total = this._total();
    this.seek(total === Infinity ? this._delay + clamp(p) * this._iterDur : clamp(p) * total);
  }
  // —— Contrôle ——
  _root() {
    let r = this;
    while (r._parent) r = r._parent;
    return r;
  }
  _reduced() {
    return this._allowReduce && isReduced();
  }
  play() {
    if (this._parent || this._cancelled) return this;
    if (this._completed) {
      this._completed = false;
      this._began = false;
      this._iter = -1;
      this._lastIt = -1;
      this._time = this._dir > 0 ? 0 : this._total();
      if (this._time === Infinity) this._time = this._delay + this._iterDur;
      this._resetChildren();
      this._resetPromise();
    }
    if (this._dir < 0 && this._time <= 0 && !this._began) {
      const total = this._total();
      this._time = total === Infinity ? this._delay + this._iterDur : total;
    }
    this._paused = false;
    if (this._reduced() && !this._scroll) {
      this._jumpToEnd();
      return this;
    }
    addActive(this);
    this._render(this._time);
    flush();
    return this;
  }
  resume() {
    return this.play();
  }
  pause() {
    if (this._paused) return this;
    this._paused = true;
    removeActive(this);
    this._fire("onPause");
    return this;
  }
  restart() {
    if (this._parent) return this;
    this._completed = true;
    this._paused = true;
    return this.play();
  }
  /** Inverse le sens de lecture et relance. */
  reverse() {
    this._dir *= -1;
    if (this._completed) {
      this._completed = false;
      this._resetPromise();
    }
    if (this._parent) return this;
    this._paused = true;
    removeActive(this);
    const total = this._total();
    if (this._dir < 0 && this._time <= 0) this._time = total === Infinity ? this._delay + this._iterDur : total;
    if (this._dir > 0 && this._time >= total) this._time = 0;
    return this.play();
  }
  /** Place la tête de lecture (ms, ou nom de libellé pour une timeline). */
  seek(time) {
    var _a;
    if (typeof time === "string" && this._labels) time = ((_a = this._labels[time]) != null ? _a : 0) + this._delay;
    const total = this._total();
    const t = clamp(+time || 0, 0, total);
    this._time = t;
    this._render(t, { seek: true });
    flush();
    if (!this._parent && total !== Infinity) {
      if (this._dir > 0 && t >= total || this._dir < 0 && t <= 0) this._finish();
      else if (this._completed) {
        this._completed = false;
        this._resetPromise();
      }
    }
    return this;
  }
  /** Saute à l'état final et termine. */
  complete() {
    if (this._parent) return this;
    this._jumpToEnd();
    return this;
  }
  /** Arrête sans restaurer les valeurs. */
  cancel() {
    this.pause();
    this._cancelled = true;
    return this;
  }
  /** Arrête et restaure les valeurs d'origine des cibles. */
  revert() {
    this.cancel();
    this._revertContent();
    flush();
    this._cancelled = false;
    this._completed = false;
    this._began = false;
    this._rendered = false;
    this._time = 0;
    this._iter = -1;
    this._lastIt = -1;
    return this;
  }
  /** Promesse résolue à la fin : `await animate(...)` ou `.then(() => …)`. */
  then(onFulfilled, onRejected) {
    if (!this._promise) {
      this._promise = new Promise((res) => {
        this._resolve = res;
      });
      if (this._completed) this._resolve();
    }
    return this._promise.then(onFulfilled, onRejected);
  }
  // —— Interne ——
  _resetPromise() {
    this._promise = null;
    this._resolve = null;
  }
  _resetChildren() {
  }
  _fire(name) {
    const cb = this._cb[name];
    if (isFn(cb)) cb(this);
  }
  _jumpToEnd() {
    removeActive(this);
    const total = this._total();
    if (total === Infinity) {
      this._time = this._delay + this._iterDur;
      this._renderState(0, this._iterDur, false, {});
    } else {
      this._time = this._dir > 0 ? total : 0;
      this._render(this._time);
    }
    flush();
    this._finish();
  }
  _finish() {
    this._paused = true;
    removeActive(this);
    if (this._completed) return;
    this._completed = true;
    this._fire("onComplete");
    if (this._resolve) this._resolve();
    else if (!this._promise) this._promise = Promise.resolve();
  }
  _tick(dt) {
    if (this._paused) return;
    const total = this._total();
    this._time += dt * this._speed * this._dir;
    let done = false;
    if (this._dir > 0 && this._time >= total) {
      this._time = total;
      done = true;
    } else if (this._dir < 0 && this._time <= 0) {
      this._time = 0;
      done = true;
    }
    this._render(this._time);
    if (done) this._finish();
  }
  /** Rendu piloté par une timeline parente (temps local, éventuellement hors bornes). */
  _renderFromParent(t, opts = {}) {
    const total = this._total();
    const before = t < 0;
    const ct = clamp(t, 0, total);
    const prev = this._time;
    if (before && !this._began && this._rendered && !opts.seek) return;
    this._time = ct;
    this._render(ct, { ...opts, before });
    if (total !== Infinity && ct >= total && (prev < total || !this._completed) && !before) {
      this._completed = true;
      this._fire("onComplete");
      if (this._resolve) this._resolve();
    } else if (ct < total && this._completed) {
      this._completed = false;
      this._resetPromise();
    }
  }
  _render(t, opts = {}) {
    const total = this._total();
    const delay = this._delay;
    const iterDur = this._iterDur;
    const before = opts.before || t < delay || t === 0 && delay > 0;
    let iter = 0;
    let it = 0;
    if (!before) {
      if (t >= total) {
        iter = this._loops - 1;
        it = iterDur;
      } else if (iterDur > 0) {
        const cycle = iterDur + this._loopDelay;
        const local = t - delay;
        iter = Math.min(this._loops - 1, Math.floor(local / cycle));
        it = Math.min(iterDur, local - iter * cycle);
      } else {
        it = 0;
      }
      if (this._alternate && iter % 2 === 1) it = iterDur - it;
    }
    this._renderState(iter, it, before, opts);
  }
  _renderState(iter, it, before, opts) {
    const prevIter = this._iter;
    const prevIt = this._lastIt;
    if (before) {
      if (this._began && !opts.seek && this._parent) this._began = false;
      this._renderContent(0, { ...opts, before: true, iter, prevIter, prevIt });
      this._lastIt = -1;
      this._rendered = true;
      return;
    }
    if (!this._began) {
      this._began = true;
      this._fire("onBegin");
    }
    if (prevIter !== -1 && iter !== prevIter) this._fire("onLoop");
    this._iter = iter;
    this._renderContent(it, { ...opts, before: false, iter, prevIter, prevIt });
    this._lastIt = it;
    this._rendered = true;
    this._fire("onUpdate");
  }
  _renderContent() {
  }
  _revertContent() {
  }
};
function isPlayable(v) {
  return v instanceof Playable;
}

// src/animation.js
var RESERVED = /* @__PURE__ */ new Set([
  "duration",
  "delay",
  "ease",
  "loop",
  "loopDelay",
  "alternate",
  "reversed",
  "autoplay",
  "speed",
  "keyframes",
  "composition",
  "modifier",
  "onBegin",
  "onUpdate",
  "onLoop",
  "onComplete",
  "onPause",
  "reducedMotion",
  "attr",
  "id",
  "defaults",
  "playbackEase"
]);
var owners = /* @__PURE__ */ new Map();
var written = /* @__PURE__ */ new WeakMap();
var resolveEase = (e) => parseEase(e) || (isFn(e) ? e : null);
function fnValue(v, target, i, total) {
  return isFn(v) && !v.isSpring && !isCustom(v) ? v(target, i, total) : v;
}
var Track = class {
  constructor(anim, target, prop, kind, opts) {
    this.anim = anim;
    this.target = target;
    this.prop = prop;
    this.kind = kind;
    this.key = targetId(target) + "|" + prop;
    this.segs = opts.segs;
    this.hasFrom = this.segs.length > 0 && this.segs[0].fromRaw !== void 0;
    this.modifier = opts.modifier;
    this.composition = opts.composition;
    this.start = this.segs.length ? this.segs[0].start : 0;
    this.end = this.segs.reduce((m, s) => Math.max(m, s.start + s.dur), 0);
    this.original = captureOriginal(target, prop, kind);
    this.asNumber = kind === "prop" && typeof this.original === "number";
    this.resolved = false;
    this.overridden = false;
    this.removed = false;
    this.isFirst = true;
    this.prev = null;
    this.absZero = 0;
    this._state = null;
  }
  resolve() {
    if (this.resolved) return;
    const ctx = { el: this.target, prop: this.prop, isTransform: this.kind === "transform", defaultUnit: defaultUnit(this.kind, this.prop) };
    let base;
    if (this.hasFrom) {
      base = null;
    } else if (this.prev) {
      this.prev.resolve();
      base = parseValue(this.prev.valueAt(this.absZero + this.start - this.prev.absZero));
    } else {
      base = parseValue(readValue(this.target, this.prop, this.kind));
    }
    let from = base;
    for (const s of this.segs) {
      if (s.fromRaw !== void 0) {
        from = parseValue(s.fromRaw);
        if (from.op) from = applyRelative(parseValue(readValue(this.target, this.prop, this.kind)), from);
      }
      let to = parseValue(s.toRaw);
      to = applyRelative(from, to);
      const [f, t] = unify(from, to, ctx);
      s.from = f;
      s.to = t;
      from = t;
    }
    this.resolved = true;
  }
  /** Valeur (sérialisée) au temps de contenu t de l'animation. */
  valueAt(t) {
    this.resolve();
    if (!this.segs.length) return readValue(this.target, this.prop, this.kind);
    if (t < this.start) {
      const s0 = this.segs[0];
      return interpolate(s0.from, s0.to, 0, this.asNumber, this.modifier, this.target);
    }
    let seg = this.segs[0];
    for (const s of this.segs) {
      if (s.start <= t) seg = s;
      else break;
    }
    const p = seg.dur > 0 ? clamp((t - seg.start) / seg.dur) : 1;
    return interpolate(seg.from, seg.to, seg.ease(p), this.asNumber, this.modifier, this.target);
  }
  claim() {
    if (this.composition === "none") return;
    this.overridden = false;
    const cur = owners.get(this.key);
    if (cur && cur !== this && cur.composition !== "none") {
      const rootA = cur.anim._root();
      const rootB = this.anim._root();
      if (rootA !== rootB) cur.overridden = true;
    }
    owners.set(this.key, this);
  }
  release() {
    if (owners.get(this.key) === this) owners.delete(this.key);
  }
  render(t, before) {
    if (this.removed) return;
    if (before || t < this.start) {
      const was2 = this._state;
      this._state = "before";
      if (this.overridden) return;
      if ((was2 === "active" || was2 === "done") && this.resolved) {
        this.write(this.valueAt(-1));
        return;
      }
      if (!this.isFirst || !(this.hasFrom || this.resolved)) return;
      this.write(this.valueAt(-1));
      return;
    }
    const was = this._state;
    this._state = t >= this.end ? "done" : "active";
    if (was !== "active" && was !== "done") this.claim();
    else if (was === "done" && this._state === "active") this.claim();
    if (this.overridden) return;
    this.write(this.valueAt(t));
  }
  write(v) {
    const t = this.target;
    let m = written.get(t);
    if (!m) {
      m = /* @__PURE__ */ new Map();
      written.set(t, m);
    }
    if (m.get(this.prop) === v) return;
    m.set(this.prop, v);
    writeValue(t, this.prop, this.kind, v);
  }
  revert() {
    this.release();
    const m = written.get(this.target);
    if (m) m.delete(this.prop);
    this.resolved = false;
    this._state = null;
    restoreOriginal(this.target, this.prop, this.kind, this.original);
  }
};
var isStep = (v) => isObj(v) && !isArr(v) && !isCustom(v) && ("to" in v || "value" in v || "from" in v);
function toSteps(value, ctx, local) {
  const ev = (v) => fnValue(v, ctx.target, ctx.i, ctx.total);
  if (isStep(value) && !local.nested) {
    const o = { ...local, nested: true };
    if (!isUndef(value.duration)) {
      o.duration = +ev(value.duration);
      o.durExplicit = true;
    }
    if (!isUndef(value.delay)) o.delay = +ev(value.delay);
    if (!isUndef(value.ease)) {
      o.ease = resolveEase(ev(value.ease)) || o.ease;
      if (!o.durExplicit && o.ease.isSpring) o.duration = o.ease.duration;
    }
    if (value.modifier) o.modifier = value.modifier;
    const to = "to" in value ? ev(value.to) : "value" in value ? ev(value.value) : void 0;
    const from = "from" in value ? ev(value.from) : void 0;
    let steps2;
    if (to === void 0) steps2 = [{ toCurrent: true }];
    else steps2 = toSteps(to, ctx, o).steps;
    if (from !== void 0) steps2[0] = { ...steps2[0], from };
    return { steps: steps2, local: o };
  }
  if (isArr(value)) {
    if (value.length && value.every(isStep)) {
      return { steps: value.map((k) => ({
        to: ev("to" in k ? k.to : k.value),
        from: "from" in k ? ev(k.from) : void 0,
        duration: isUndef(k.duration) ? void 0 : +ev(k.duration),
        delay: isUndef(k.delay) ? 0 : +ev(k.delay),
        ease: isUndef(k.ease) ? void 0 : resolveEase(ev(k.ease))
      })), local };
    }
    const vals = value.map(ev);
    if (vals.length === 1) return { steps: [{ to: vals[0] }], local };
    return { steps: vals.slice(1).map((v, k) => k === 0 ? { to: v, from: vals[0] } : { to: v }), local };
  }
  return { steps: [{ to: value }], local };
}
function stepsToSegs(steps2, local, target, prop, kind) {
  const n = steps2.length;
  let t = local.delay;
  return steps2.map((st) => {
    var _a;
    t += st.delay || 0;
    const dur = Math.max(0, (_a = st.duration) != null ? _a : local.duration / n);
    const seg = {
      start: t,
      dur,
      ease: st.ease || local.ease,
      toRaw: st.toCurrent ? readValue(target, prop, kind) : st.to,
      fromRaw: st.from
    };
    t += dur;
    return seg;
  });
}
function keyframesToProps(keyframes, duration) {
  const props = {};
  if (isArr(keyframes)) {
    const n = keyframes.length;
    const durs = keyframes.map((kf) => isUndef(kf.duration) ? duration / n : +kf.duration);
    const names2 = /* @__PURE__ */ new Set();
    keyframes.forEach((kf) => Object.keys(kf).forEach((k) => {
      if (!RESERVED.has(k)) names2.add(k);
    }));
    for (const name of names2) {
      const steps2 = [];
      let wait = 0;
      keyframes.forEach((kf, idx) => {
        if (!(name in kf)) {
          wait += durs[idx];
          return;
        }
        let to = kf[name];
        let from;
        if (isArr(to) && to.length === 2) {
          from = to[0];
          to = to[1];
        }
        steps2.push({ to, from, duration: durs[idx], delay: wait, ease: kf.ease });
        wait = 0;
      });
      props[name] = steps2;
    }
    return props;
  }
  const stops = Object.keys(keyframes).map((k) => ({ pct: k === "from" ? 0 : k === "to" ? 100 : parseFloat(k), kf: keyframes[k] })).filter((st) => !Number.isNaN(st.pct)).sort((x, y) => x.pct - y.pct);
  const names = /* @__PURE__ */ new Set();
  stops.forEach((st) => Object.keys(st.kf).forEach((k) => {
    if (!RESERVED.has(k)) names.add(k);
  }));
  for (const name of names) {
    const steps2 = [];
    let prevPct = 0;
    let prevEase;
    let from;
    let wait = 0;
    for (const st of stops) {
      if (!(name in st.kf)) continue;
      if (st.pct === 0) {
        from = st.kf[name];
        prevEase = st.kf.ease;
        continue;
      }
      steps2.push({ to: st.kf[name], duration: (st.pct - prevPct) / 100 * duration, delay: wait, ease: prevEase });
      prevPct = st.pct;
      prevEase = st.kf.ease;
    }
    if (!steps2.length) steps2.push({ to: from, duration: 0 });
    if (from !== void 0) steps2[0].from = from;
    props[name] = steps2;
  }
  return props;
}
var Animation = class extends Playable {
  constructor(targets, params = {}, inherited = {}) {
    var _a, _b, _c;
    const p = { ...inherited, ...params };
    super(p);
    const d = engine.defaults;
    this.targets = resolveTargets(targets);
    this._tracks = [];
    this._composition = (_a = p.composition) != null ? _a : d.composition;
    const list = this.targets;
    const total = list.length;
    const props = {};
    for (const k of Object.keys(params)) if (!RESERVED.has(k)) props[k] = params[k];
    const baseDur = p.duration;
    let kfProps = null;
    if (p.keyframes) kfProps = keyframesToProps(p.keyframes, isNum(baseDur) ? baseDur : d.duration);
    const attrProps = isObj(p.attr) ? p.attr : null;
    list.forEach((target, i) => {
      var _a2, _b2;
      const ctx = { target, i, total };
      const ease = resolveEase(fnValue((_a2 = p.ease) != null ? _a2 : d.ease, target, i, total)) || resolveEase(d.ease) || linear;
      let dur = fnValue(baseDur, target, i, total);
      const durExplicit = !isUndef(dur);
      if (!durExplicit) dur = ease.isSpring ? ease.duration : d.duration;
      const delay = +fnValue((_b2 = p.delay) != null ? _b2 : d.delay, target, i, total) || 0;
      const base = { duration: +dur, durExplicit, delay, ease, modifier: p.modifier };
      const add = (rawProp, value, forcedKind, isKf) => {
        const prop = normalizeProp(rawProp);
        const kind = forcedKind || propKind(target, prop);
        if (!isEl(target) && kind !== "prop") return;
        const v = fnValue(value, target, i, total);
        const { steps: steps2, local } = isKf ? { steps: v.map((st) => ({ ...st, to: fnValue(st.to, target, i, total), from: fnValue(st.from, target, i, total), ease: resolveEase(st.ease) })), local: base } : toSteps(v, ctx, base);
        const segs = stepsToSegs(steps2, local, target, prop, kind);
        this._tracks.push(new Track(this, target, prop, kind, { segs, modifier: local.modifier, composition: this._composition }));
      };
      for (const k of Object.keys(props)) add(k, props[k]);
      if (kfProps) for (const k of Object.keys(kfProps)) add(k, kfProps[k], null, true);
      if (attrProps) for (const k of Object.keys(attrProps)) add(k, attrProps[k], "attr");
    });
    const starts = this._tracks.map((t) => t.start);
    const minStart = starts.length ? Math.min(...starts) : Math.max(0, +fnValue((_b = p.delay) != null ? _b : 0, null, 0, 1) || 0);
    this._delay = Math.max(0, minStart);
    for (const tr of this._tracks) {
      for (const s of tr.segs) s.start -= this._delay;
      tr.start -= this._delay;
      tr.end -= this._delay;
    }
    this._iterDur = this._tracks.reduce((m, t) => Math.max(m, t.end), 0);
    if (!this._tracks.length && isNum(baseDur)) this._iterDur = baseDur;
    if (this._dir < 0) this._time = this._total() === Infinity ? this._delay + this._iterDur : this._total();
    const auto = (_c = p.autoplay) != null ? _c : d.autoplay;
    if (auto && auto[SCROLL]) {
      this._scroll = auto;
      auto.link(this);
    } else if (auto && !inherited.__child) {
      this.play();
    }
  }
  _renderContent(it, opts) {
    const before = opts.before;
    for (const tr of this._tracks) tr.render(it, before);
  }
  _revertContent() {
    for (let k = this._tracks.length - 1; k >= 0; k--) this._tracks[k].revert();
  }
  /** Toutes les pistes (utilisé par les timelines et remove()). */
  _allTracks(out = [], offset = 0) {
    for (const t of this._tracks) {
      t.absZero = offset + this._delay;
      out.push(t);
    }
    return out;
  }
  _resetChildren() {
    for (const t of this._tracks) t._state = null;
  }
  /** Retire des cibles (et éventuellement certaines propriétés) de l'animation. */
  _removeTargets(targets, props) {
    let left = 0;
    for (const t of this._tracks) {
      if (targets.includes(t.target) && (!props || props.includes(t.prop))) t.removed = true;
      if (!t.removed) left++;
    }
    return left;
  }
};
function animate(targets, params) {
  return new Animation(targets, params);
}
function set(targets, props) {
  const a = new Animation(targets, { ...props, duration: 0, delay: 0, ease: "linear", autoplay: false, reducedMotion: false });
  a.seek(0);
  a.seek(a.duration);
  flush();
  return a;
}

// src/timeline.js
var EPS = 1e-9;
var Timeline = class extends Playable {
  constructor(params = {}) {
    var _a;
    super(params);
    this._defaults = { ...params.defaults || {} };
    this._children = [];
    this._calls = [];
    this._labels = {};
    this._last = null;
    this._delay = Math.max(0, +params.delay || 0);
    this._linkDirty = true;
    const auto = (_a = params.autoplay) != null ? _a : engine.defaults.autoplay;
    if (auto && auto[SCROLL]) {
      this._scroll = auto;
      auto.link(this);
    } else if (auto && !params.__child) {
      this._paused = false;
      this._pendingPlay = true;
      queueMicrotask(() => {
        if (this._pendingPlay && !this._parent && !this._cancelled) {
          this._pendingPlay = false;
          this._paused = true;
          this.play();
        }
      });
    }
  }
  /** Libellés { nom: temps } */
  get labels() {
    return { ...this._labels };
  }
  /** Calcule une position : nombre, '<', '<<', '+=200', '-=100', 'libellé', 'libellé+=100', '<<+=50'. */
  _position(pos) {
    const end = this._iterDur;
    if (pos === void 0 || pos === null || pos === "") return end;
    if (isNum(pos)) return Math.max(0, pos);
    if (isFn(pos)) return this._position(pos(this));
    if (!isStr(pos)) return end;
    const s = pos.trim();
    const m = s.match(/^(<<|<|[^+\-*]*?)?\s*(?:([+-])=\s*(-?\d*\.?\d+))?$/);
    if (!m) return end;
    const anchor = m[1] || "";
    const off = m[2] ? (m[2] === "+" ? 1 : -1) * parseFloat(m[3]) : 0;
    let base;
    if (anchor === "<") base = this._last ? this._last.end : 0;
    else if (anchor === "<<") base = this._last ? this._last.start : 0;
    else if (anchor === "") base = end;
    else if (/^-?\d*\.?\d+$/.test(anchor)) base = parseFloat(anchor);
    else if (anchor in this._labels) base = this._labels[anchor];
    else base = end;
    return Math.max(0, base + off);
  }
  _insert(child, start) {
    child._parent = this;
    this._children.push({ child, start });
    this._children.sort((a, b) => a.start - b.start);
    const total = child._total();
    const len = total === Infinity ? child._delay + child._iterDur : total;
    this._last = { start, end: start + len };
    this._recompute();
    for (let p = this; p; p = p._parent) p._linkDirty = true;
    this._prerender(child, start);
    return this;
  }
  _recompute() {
    let d = 0;
    for (const { child, start } of this._children) {
      const total = child._total();
      d = Math.max(d, start + (total === Infinity ? child._delay + child._iterDur : total));
    }
    for (const c of this._calls) d = Math.max(d, c.time);
    this._iterDur = d;
    if (this._parent) this._parent._recompute();
  }
  // Rendu immédiat de l'état de départ d'un enfant (évite un éclair avant la première image).
  _prerender(child, start) {
    const root = this._root();
    if (root._time > 0 || root._began) return;
    root._link();
    child._renderFromParent(-1 - start);
    flush();
  }
  /**
   * add(cibles, paramètres, position) · add(animation | timeline, position) · add(fonction, position)
   */
  add(a, b, c) {
    if (isPlayable(a)) {
      const pos2 = this._position(b);
      if (a._parent && a._parent !== this) a._parent._detach(a);
      removeActive(a);
      a._paused = true;
      a._pendingPlay = false;
      a._time = 0;
      a._began = false;
      a._completed = false;
      a._iter = -1;
      return this._insert(a, pos2);
    }
    if (isFn(a) && (b === void 0 || isNum(b) || isStr(b))) return this.call(a, b);
    const pos = this._position(c);
    const child = new Animation(a, b || {}, { ...this._defaults, __child: true });
    return this._insert(child, pos);
  }
  _detach(child) {
    this._children = this._children.filter((x) => x.child !== child);
    child._parent = null;
    this._recompute();
    this._linkDirty = true;
  }
  /** Valeurs instantanées à une position. */
  set(targets, props, position) {
    return this.add(targets, { ...props, duration: 0, ease: "linear" }, position);
  }
  /** Appelle une fonction quand la tête de lecture passe la position. */
  call(fn, position) {
    const time = this._position(position);
    this._calls.push({ fn, time });
    this._calls.sort((x, y) => x.time - y.time);
    this._last = { start: time, end: time };
    this._recompute();
    return this;
  }
  /** Pose un libellé réutilisable comme position. */
  label(name, position) {
    this._labels[name] = this._position(position);
    return this;
  }
  play() {
    this._pendingPlay = false;
    return super.play();
  }
  pause() {
    if (this._pendingPlay) {
      this._pendingPlay = false;
      this._paused = true;
      return this;
    }
    return super.pause();
  }
  // Relie les pistes successives d'une même cible et propriété (départ = valeur précédente).
  _link() {
    if (!this._linkDirty) return;
    const tracks = [];
    this._allTracks(tracks, 0);
    const groups = /* @__PURE__ */ new Map();
    for (const t of tracks) {
      let g = groups.get(t.key);
      if (!g) {
        g = [];
        groups.set(t.key, g);
      }
      g.push(t);
    }
    for (const g of groups.values()) {
      g.sort((x, y) => x.absZero + x.start - (y.absZero + y.start));
      g.forEach((t, i) => {
        t.isFirst = i === 0;
        t.prev = i === 0 ? null : g[i - 1];
      });
    }
    this._linkDirty = false;
    const clear = (tl) => {
      tl._linkDirty = false;
      tl._children.forEach((c) => c.child._children && clear(c.child));
    };
    clear(this);
  }
  _allTracks(out = [], offset = 0) {
    const base = offset + this._delay;
    for (const { child, start } of this._children) child._allTracks(out, base + start);
    return out;
  }
  _renderContent(it, opts) {
    if (!this._parent) this._link();
    const before = opts.before;
    const kids = this._children;
    for (let pass = 0; pass < 2; pass++) {
      for (let n = 0; n < kids.length; n++) {
        const entry = pass === 0 ? kids[kids.length - 1 - n] : kids[n];
        const { child, start } = entry;
        const local = before ? -1 - start : it - start;
        const isBefore = local < 0;
        if (pass === 0 !== isBefore) continue;
        const key = isBefore ? "b" : local >= child._total() ? "a" : "x";
        if (key !== "x" && entry.key === key && !opts.seek) continue;
        entry.key = key;
        child._renderFromParent(local, opts);
      }
    }
    if (!before && this._calls.length) this._fireCalls(it, opts);
  }
  _fireCalls(it, opts) {
    const { iter, prevIter } = opts;
    let prevIt = opts.prevIt;
    const D = this._iterDur;
    const alt = this._alternate;
    const startOf = (k) => alt && k % 2 === 1 ? D : 0;
    const endOf = (k) => alt && k % 2 === 1 ? 0 : D;
    const cross = (a, b, inclusiveStart) => {
      if (a === b) return;
      if (b > a) {
        for (const c of this._calls) if ((inclusiveStart ? c.time >= a : c.time > a) && c.time <= b) c.fn(this);
      } else {
        for (let k = this._calls.length - 1; k >= 0; k--) {
          const c = this._calls[k];
          if (c.time >= b && (inclusiveStart ? c.time <= a : c.time < a)) c.fn(this);
        }
      }
    };
    if (prevIter === -1 || prevIt === -1) {
      cross(startOf(iter) - (alt && iter % 2 === 1 ? -EPS : EPS), it, false);
      return;
    }
    if (iter === prevIter) {
      cross(prevIt, it, false);
      return;
    }
    if (iter > prevIter) {
      cross(prevIt, endOf(prevIter), false);
      cross(startOf(iter) - (alt ? 0 : EPS), it, false);
    } else {
      cross(prevIt, startOf(prevIter), false);
      cross(endOf(iter) + (alt ? 0 : EPS), it, false);
    }
  }
  _resetChildren() {
    for (const e of this._children) {
      e.key = void 0;
      e.child._began = false;
      e.child._completed = false;
      e.child._iter = -1;
      e.child._lastIt = -1;
      e.child._resetChildren();
    }
  }
  _revertContent() {
    for (let k = this._children.length - 1; k >= 0; k--) {
      const c = this._children[k].child;
      c._revertContent();
      c._rendered = false;
      c._began = false;
      this._children[k].key = void 0;
    }
  }
  _removeTargets(targets, props) {
    let left = 0;
    for (const { child } of this._children) left += child._removeTargets(targets, props);
    return left;
  }
};
function timeline(params) {
  return new Timeline(params);
}

// src/stagger.js
function splitUnit(v) {
  if (isNum(v)) return [v, ""];
  const m = String(v).trim().match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  return m ? [parseFloat(m[1]), m[2]] : [parseFloat(v) || 0, ""];
}
function stagger(value, opts = {}) {
  const { from = "first", grid, axis, start = 0, reversed = false, seed: seed2 } = opts;
  const ease = opts.ease ? isFn(opts.ease) ? opts.ease : parseEase(opts.ease) : null;
  const isRange = isArr(value);
  const [v0, unit0] = isRange ? splitUnit(value[0]) : splitUnit(value);
  const [v1, unit1] = isRange ? splitUnit(value[1]) : [0, ""];
  const unit = unit0 || unit1;
  const [s0, sUnit] = splitUnit(start);
  let cache = null;
  const compute = (total) => {
    const distances = [];
    let fromIndex;
    if (from === "first") fromIndex = 0;
    else if (from === "last") fromIndex = total - 1;
    else if (from === "center") fromIndex = (total - 1) / 2;
    else if (from === "random") fromIndex = 0;
    else fromIndex = Math.max(0, Math.min(total - 1, +from || 0));
    if (from === "random") {
      const rng = createRandom(seed2 != null ? seed2 : 1);
      const order = rng.shuffle([...Array(total).keys()]);
      order.forEach((idx, rank) => {
        distances[idx] = rank;
      });
    } else if (grid && grid.length === 2) {
      const [cols, rows] = grid;
      const fx = from === "center" ? (cols - 1) / 2 : fromIndex % cols;
      const fy = from === "center" ? (rows - 1) / 2 : Math.floor(fromIndex / cols);
      for (let i = 0; i < total; i++) {
        const x = i % cols;
        const y = Math.floor(i / cols);
        const dx = fx - x;
        const dy = fy - y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (axis === "x") d = -dx;
        if (axis === "y") d = -dy;
        distances.push(d);
      }
    } else {
      for (let i = 0; i < total; i++) distances.push(Math.abs(fromIndex - i));
    }
    const max = Math.max(...distances.map(Math.abs), 0);
    let out = distances;
    if (ease && max > 0) out = distances.map((d) => Math.sign(d) * ease(Math.abs(d) / max) * max);
    if (reversed) out = out.map((d) => max - d);
    return { out, max };
  };
  const fn = (target, index, total = 1) => {
    var _a;
    if (!cache || cache.total !== total) cache = { total, ...compute(total) };
    const d = (_a = cache.out[index]) != null ? _a : 0;
    let v;
    if (isRange) v = cache.max > 0 ? v0 + (v1 - v0) * d / cache.max : v0;
    else v = d * v0;
    v += s0;
    const u = unit || sUnit;
    return u ? `${Math.round(v * 1e3) / 1e3}${u}` : v;
  };
  fn.isStagger = true;
  return fn;
}

// src/text.js
var segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(void 0, { granularity: "grapheme" }) : null;
var graphemes = (s) => segmenter ? [...segmenter.segment(s)].map((x) => x.segment) : [...s];
function span(cls, text) {
  const s = document.createElement("span");
  s.className = cls;
  if (text !== void 0) s.textContent = text;
  return s;
}
function className(opt, fallback) {
  return isStr(opt) ? opt : fallback;
}
function splitText(target, opts = {}) {
  var _a, _b;
  const el = resolveTargets(target)[0];
  const wantChars = (_a = opts.chars) != null ? _a : opts.words === void 0 && opts.lines === void 0;
  const wantWords = (_b = opts.words) != null ? _b : true;
  const wantLines = !!opts.lines;
  const mask = opts.mask === true ? wantLines ? "lines" : wantWords ? "words" : "chars" : opts.mask;
  const cls = {
    char: className(opts.chars, "kt-char"),
    word: className(opts.words, "kt-word"),
    line: className(opts.lines, "kt-line"),
    mask: opts.maskClass || "kt-mask"
  };
  const result = { el, chars: [], words: [], lines: [], masks: [], revert, refresh };
  if (!el) return result;
  const original = el.innerHTML;
  const hadLabel = el.hasAttribute("aria-label");
  const label = el.getAttribute("aria-label");
  const text = el.textContent.replace(/\s+/g, " ").trim();
  function wrapMask(node, kind) {
    const m = span(cls.mask);
    m.style.display = kind === "lines" ? "block" : "inline-block";
    m.style.overflow = "clip";
    m.style.verticalAlign = "top";
    m.style.paddingBlock = "0.08em";
    m.style.marginBlock = "-0.08em";
    node.replaceWith(m);
    m.appendChild(node);
    result.masks.push(m);
    return m;
  }
  function splitTextNode(node, frag) {
    const parts = node.textContent.split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(" "));
        continue;
      }
      const word = span(cls.word);
      word.style.display = "inline-block";
      word.setAttribute("aria-hidden", "true");
      if (wantChars) {
        for (const g of graphemes(part)) {
          const c = span(cls.char, g);
          c.style.display = "inline-block";
          word.appendChild(c);
          result.chars.push(c);
        }
      } else word.textContent = part;
      frag.appendChild(word);
      result.words.push(word);
    }
  }
  function walk(parent) {
    const kids = [...parent.childNodes];
    for (const node of kids) {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        splitTextNode(node, frag);
        node.replaceWith(frag);
      } else if (node.nodeType === 1 && node.tagName !== "BR") {
        walk(node);
        if (!node.hasAttribute("aria-hidden")) node.setAttribute("aria-hidden", "true");
      }
    }
  }
  function build() {
    el.innerHTML = original;
    result.chars.length = 0;
    result.words.length = 0;
    result.lines.length = 0;
    result.masks.length = 0;
    walk(el);
    if (wantLines) groupLines();
    if (mask === "chars") result.chars.forEach((c) => wrapMask(c, "chars"));
    if (mask === "words") result.words.forEach((w) => wrapMask(w, "words"));
    if (mask === "lines") result.lines.forEach((l) => wrapMask(l, "lines"));
    if (!wantWords && wantChars) {
      for (const w of result.words) {
        w.style.whiteSpace = "nowrap";
      }
    }
    if (!hadLabel && text) el.setAttribute("aria-label", text);
  }
  function groupLines() {
    var _a2;
    const top = [...el.childNodes];
    const rows = [];
    let current = null;
    let lastTop = null;
    for (const node of top) {
      let y = lastTop;
      if (node.nodeType === 1) {
        const r = node.getBoundingClientRect();
        y = (_a2 = node.offsetTop) != null ? _a2 : r.top;
        if (node.tagName === "BR") {
          current = null;
          lastTop = null;
          continue;
        }
      }
      if (!current || y !== null && lastTop !== null && Math.abs(y - lastTop) > 2) {
        current = [];
        rows.push(current);
      }
      current.push(node);
      if (node.nodeType === 1) lastTop = y;
    }
    for (const row of rows) {
      while (row.length && row[0].nodeType === 3 && !row[0].textContent.trim()) row.shift().remove();
      while (row.length && row[row.length - 1].nodeType === 3 && !row[row.length - 1].textContent.trim()) row.pop().remove();
      if (!row.length) continue;
      const line = span(cls.line);
      line.style.display = "block";
      line.setAttribute("aria-hidden", "true");
      row[0].before(line);
      for (const n of row) line.appendChild(n);
      result.lines.push(line);
    }
    el.querySelectorAll(":scope > br").forEach((b) => b.remove());
  }
  function revert() {
    el.innerHTML = original;
    if (!hadLabel) el.removeAttribute("aria-label");
    else el.setAttribute("aria-label", label);
    result.chars.length = 0;
    result.words.length = 0;
    result.lines.length = 0;
    result.masks.length = 0;
    return result;
  }
  function refresh() {
    build();
    return result;
  }
  build();
  return result;
}
var GLYPHS = "!<>-_\\/[]{}\u2014=+*^?#01ABCDEFGHKXZ";
function scramble(target, opts = {}) {
  var _a, _b, _c, _d, _e;
  const els = resolveTargets(target);
  const chars = opts.chars || GLYPHS;
  const rng = createRandom((_a = opts.seed) != null ? _a : 7);
  const fps = (_b = opts.fps) != null ? _b : 24;
  const states = els.map((el) => {
    var _a2;
    const finalText = graphemes((_a2 = opts.text) != null ? _a2 : el.textContent);
    const from = graphemes(el.textContent);
    if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", finalText.join(""));
    const n = finalText.length || 1;
    const order = opts.reveal === "random" ? rng.shuffle([...Array(n).keys()]) : [...Array(n).keys()];
    const thresholds = [];
    order.forEach((idx, rank) => {
      thresholds[idx] = 0.2 + 0.8 * (rank / n);
    });
    return { el, finalText, from, thresholds, last: -1 };
  });
  const proxy = { p: 0 };
  const glyph = () => chars[Math.floor(rng() * chars.length)];
  return animate(proxy, {
    p: [0, 1],
    duration: (_c = opts.duration) != null ? _c : 1600,
    delay: (_d = opts.delay) != null ? _d : 0,
    ease: (_e = opts.ease) != null ? _e : "linear",
    autoplay: opts.autoplay,
    loop: opts.loop,
    reducedMotion: opts.reducedMotion,
    onBegin: opts.onBegin,
    onComplete: (a) => {
      for (const st of states) st.el.textContent = st.finalText.join("");
      if (opts.onComplete) opts.onComplete(a);
    },
    onUpdate: (a) => {
      const p = proxy.p;
      const frame2 = Math.floor(a.currentTime / 1e3 * fps);
      for (const st of states) {
        if (frame2 === st.last && p > 0 && p < 1) continue;
        st.last = frame2;
        let out = "";
        st.finalText.forEach((ch, i) => {
          var _a2;
          if (/\s/.test(ch)) {
            out += ch;
            return;
          }
          if (p >= 1 || p >= st.thresholds[i]) out += ch;
          else if (p <= 0) out += (_a2 = st.from[i]) != null ? _a2 : "";
          else out += glyph();
        });
        st.el.textContent = out;
      }
      if (opts.onUpdate) opts.onUpdate(a);
    }
  });
}
function typewriter(target, opts = {}) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const el = resolveTargets(target)[0];
  if (!el) return animate({}, { duration: 0 });
  const texts = isArr(opts.text) ? opts.text : [(_a = opts.text) != null ? _a : el.textContent];
  const cps = (_b = opts.speed) != null ? _b : 22;
  const textNode = document.createTextNode("");
  const caret = opts.cursor === false ? null : span("kt-caret", (_c = opts.cursorChar) != null ? _c : "\u258D");
  el.textContent = "";
  el.appendChild(textNode);
  if (caret) {
    caret.setAttribute("aria-hidden", "true");
    caret.style.marginLeft = "0.05em";
    el.appendChild(caret);
  }
  if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", texts.join(" "));
  let blink = null;
  if (caret) blink = animate(caret, { opacity: [1, 0, 1], duration: 1060, ease: "steps(1)", loop: true });
  const typeOne = (str, erase) => {
    const g = graphemes(str);
    const proxy = { n: erase ? g.length : 0 };
    return animate(proxy, {
      n: erase ? [g.length, 0] : [0, g.length],
      duration: Math.max(1, g.length / (erase ? cps * 2.4 : cps) * 1e3),
      ease: "linear",
      autoplay: false,
      onUpdate: () => {
        textNode.data = g.slice(0, Math.round(proxy.n)).join("");
      }
    });
  };
  if (texts.length === 1) {
    const a = typeOne(texts[0], false);
    const tl2 = timeline({ delay: (_d = opts.delay) != null ? _d : 0, autoplay: (_e = opts.autoplay) != null ? _e : true, loop: opts.loop, onComplete: opts.onComplete, reducedMotion: opts.reducedMotion });
    tl2.add(a);
    tl2.caret = caret;
    tl2.blink = blink;
    return tl2;
  }
  const tl = timeline({ delay: (_f = opts.delay) != null ? _f : 0, autoplay: (_g = opts.autoplay) != null ? _g : true, loop: (_h = opts.loop) != null ? _h : true, onComplete: opts.onComplete, reducedMotion: opts.reducedMotion });
  texts.forEach((t) => {
    var _a2, _b2;
    tl.add(typeOne(t, false));
    tl.add(typeOne(t, true), `+=${(_a2 = opts.hold) != null ? _a2 : 1400}`);
    tl.call(() => {
    }, `+=${(_b2 = opts.gap) != null ? _b2 : 300}`);
  });
  tl.caret = caret;
  tl.blink = blink;
  return tl;
}
function odometer(target, opts = {}) {
  var _a, _b, _c;
  const el = resolveTargets(target)[0];
  const turns = (_a = opts.turns) != null ? _a : 1;
  const N = 10 * (turns + 1);
  const cols = [];
  let current = String((_b = opts.from) != null ? _b : "");
  const row = hasDOM ? span("kt-odometer") : null;
  if (el && row) {
    row.style.display = "inline-flex";
    row.style.fontVariantNumeric = "tabular-nums";
    row.setAttribute("aria-hidden", "true");
    el.textContent = "";
    el.appendChild(row);
  }
  const layout = (str) => {
    const s = [...str];
    if (cols.length === s.length && cols.every((c, i) => c.digit === /\d/.test(s[i]))) return;
    row.textContent = "";
    cols.length = 0;
    s.forEach((ch) => {
      if (/\d/.test(ch)) {
        const win = span("kt-odo-win");
        win.style.cssText = "display:inline-block;height:1.1em;line-height:1.1em;overflow:hidden;vertical-align:top";
        const strip = span("kt-odo-strip");
        strip.style.cssText = "display:flex;flex-direction:column";
        for (let k = 0; k < N; k++) {
          const d = span("", String(k % 10));
          d.style.cssText = "display:block;height:1.1em;text-align:center";
          strip.appendChild(d);
        }
        win.appendChild(strip);
        row.appendChild(win);
        strip.style.transform = `translateY(${-100 * +ch / N}%)`;
        cols.push({ digit: true, strip, pos: +ch });
      } else {
        const st = span("kt-odo-sep", ch);
        st.style.cssText = "display:inline-block;line-height:1.1em";
        row.appendChild(st);
        cols.push({ digit: false });
      }
    });
  };
  const api = {
    get value() {
      return current;
    },
    animation: null,
    set(value, o = {}) {
      var _a2, _b2, _c2, _d, _e, _f, _g, _h;
      const str = String(value);
      if (!el) return null;
      layout(str);
      el.setAttribute("aria-label", str);
      const tl = timeline({ autoplay: (_a2 = o.autoplay) != null ? _a2 : true, reducedMotion: (_b2 = o.reducedMotion) != null ? _b2 : opts.reducedMotion });
      const s = [...str];
      const duration = (_d = (_c2 = o.duration) != null ? _c2 : opts.duration) != null ? _d : 1800;
      const ease = (_f = (_e = o.ease) != null ? _e : opts.ease) != null ? _f : "inOutExpo";
      const each = (_h = (_g = o.stagger) != null ? _g : opts.stagger) != null ? _h : 80;
      s.forEach((ch, i) => {
        const c = cols[i];
        if (!c.digit) return;
        const target2 = +ch + 10 * (1 + (s.length - i) % turns);
        const fromPos = c.pos % 10;
        tl.add(c.strip, { y: [`${-100 * fromPos / N}%`, `${-100 * target2 / N}%`], duration, ease }, (s.length - 1 - i) * each);
        c.pos = target2;
      });
      current = str;
      api.animation = tl;
      return tl;
    },
    revert() {
      if (el) el.textContent = current;
      if (el) el.removeAttribute("aria-label");
    }
  };
  if (el && opts.value !== void 0) {
    layout(String((_c = opts.from) != null ? _c : String(opts.value).replace(/\d/g, "0")));
    api.set(opts.value, { autoplay: opts.autoplay });
  }
  return api;
}

// src/scroll.js
function edge(spec, size) {
  if (isNum(spec)) return spec;
  const m = String(spec).trim().match(/^([a-z]+|-?\d*\.?\d+%?(?:px)?)?\s*(?:([+-])=\s*(-?\d*\.?\d+)(%|px)?)?$/i);
  if (!m) return 0;
  const word = (m[1] || "top").toLowerCase();
  let v;
  if (word === "top" || word === "left" || word === "start") v = 0;
  else if (word === "center" || word === "middle") v = size / 2;
  else if (word === "bottom" || word === "right" || word === "end") v = size;
  else if (word.endsWith("%")) v = parseFloat(word) / 100 * size;
  else v = parseFloat(word) || 0;
  if (m[2]) {
    const off = parseFloat(m[3]) * (m[4] === "%" ? size / 100 : 1);
    v += m[2] === "+" ? off : -off;
  }
  return v;
}
function pair(spec, fallback) {
  const s = isStr(spec) ? spec.trim() : fallback;
  const parts = s.split(/\s+(?![+-]=)/);
  return [parts[0] || "top", parts[1] || parts[0] || "top"];
}
var ACTIONS = {
  play: (p) => {
    if (p.reversed) p.reverse();
    else if (!p.completed) p.play();
  },
  resume: (p) => {
    if (!p.completed) p.play();
  },
  pause: (p) => p.pause(),
  reverse: (p) => {
    if (!p.reversed) p.reverse();
    else p.play();
  },
  restart: (p) => p.restart(),
  reset: (p) => {
    p.pause();
    p.seek(0);
  },
  complete: (p) => p.complete(),
  none: () => {
  }
};
var uid2 = 0;
var ScrollObserver = class {
  constructor(opts = {}) {
    this[SCROLL] = true;
    this.id = `scroll-${++uid2}`;
    this.opts = opts;
    this.axis = opts.axis === "x" ? "x" : "y";
    this.enter = pair(opts.enter, "top bottom");
    this.leave = pair(opts.leave, "bottom top");
    this.scrub = opts.scrub === true ? 0 : isNum(opts.scrub) ? Math.max(0, opts.scrub) : null;
    const sync = (opts.sync || "play none none none").split(/\s+/);
    this.actions = [0, 1, 2, 3].map((i) => ACTIONS[sync[i]] || ACTIONS.none);
    this.progress = 0;
    this.rawProgress = 0;
    this.velocity = 0;
    this.direction = 1;
    this.isActive = false;
    this.linked = null;
    this._start = 0;
    this._end = 1;
    this._pos = 0;
    this._lastPos = null;
    this._lastTime = 0;
    this._inView = true;
    this._ready = false;
    this._engineActive = false;
    this._onScroll = () => this._update();
    this._onResize = () => {
      this.refresh();
    };
    queueMicrotask(() => {
      if (!this._ready && !this._killed) this._setup();
    });
  }
  /** Lie une animation ou une timeline (appelé par autoplay: onScroll(...)). */
  link(playable) {
    this.linked = playable;
    if (!this.opts.target && playable.targets) {
      const el = playable.targets.find((t) => isEl(t));
      if (el) this._target = el;
    }
    return this;
  }
  get target() {
    return this._target;
  }
  _setup() {
    if (this._ready || !hasDOM) return;
    this._ready = true;
    const c = this.opts.container ? resolveTargets(this.opts.container)[0] : null;
    this._container = c || window;
    if (this.opts.target) this._target = resolveTargets(this.opts.target)[0];
    if (!this._target) {
      this._target = document.documentElement;
      if (!this.opts.enter) this.enter = ["top", "top"];
      if (!this.opts.leave) this.leave = ["bottom", "bottom"];
    }
    const lp = this.linked;
    if (lp && lp._allowReduce !== false && isReduced()) {
      lp.complete();
      this._reducedDone = true;
    } else if (lp && this.scrub === null) {
      lp._render(lp._time, { before: true });
      flush();
    }
    this._container.addEventListener("scroll", this._onScroll, { passive: true });
    window.addEventListener("resize", this._onResize, { passive: true });
    window.addEventListener("load", this._onResize, { once: true });
    if (typeof IntersectionObserver === "function" && this._target !== document.documentElement) {
      this._io = new IntersectionObserver((entries) => {
        for (const e of entries) this._inView = e.isIntersecting;
        this._update(true);
      }, { root: this._container === window ? null : this._container, rootMargin: "25% 0px 25% 0px" });
      this._io.observe(this._target);
    }
    this.refresh();
  }
  _scrollPos() {
    const c = this._container;
    if (c === window) return this.axis === "y" ? window.scrollY || document.documentElement.scrollTop : window.scrollX;
    return this.axis === "y" ? c.scrollTop : c.scrollLeft;
  }
  /** Recalcule les positions de début et de fin (après un changement de mise en page). */
  refresh() {
    if (!this._ready || !this._target) return this;
    const y = this.axis === "y";
    const c = this._container;
    const cSize = c === window ? y ? innerHeight : innerWidth : y ? c.clientHeight : c.clientWidth;
    const cRect = c === window ? { top: 0, left: 0 } : c.getBoundingClientRect();
    const r = this._target.getBoundingClientRect();
    const pos = this._scrollPos();
    const tStart = (y ? r.top - cRect.top : r.left - cRect.left) + pos;
    const tSize = y ? r.height : r.width;
    this._start = tStart + edge(this.enter[0], tSize) - edge(this.enter[1], cSize);
    this._end = tStart + edge(this.leave[0], tSize) - edge(this.leave[1], cSize);
    if (this._end <= this._start) this._end = this._start + 1;
    this._update(true);
    return this;
  }
  _update(force) {
    var _a;
    if (!this._ready || this._killed) return;
    if (!this._inView && !force) return;
    const pos = this._scrollPos();
    const now2 = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this._lastPos !== null) {
      const dt = Math.max(1, now2 - this._lastTime);
      const v = (pos - this._lastPos) / dt * 1e3;
      this.velocity = this.velocity * 0.6 + v * 0.4;
      if (pos !== this._lastPos) this.direction = pos > this._lastPos ? 1 : -1;
    }
    const prevPos = (_a = this._lastPos) != null ? _a : pos;
    this._lastPos = pos;
    this._lastTime = now2;
    const raw = clamp((pos - this._start) / (this._end - this._start));
    this._crossings(prevPos, pos, this._firstDone !== true);
    this._firstDone = true;
    this.rawProgress = raw;
    if (this.scrub === 0 || this._reducedDone || this.scrub !== null && isReduced()) {
      this.progress = raw;
      this._apply();
    } else if (this.scrub !== null) {
      addActive(this);
    } else {
      this.progress = raw;
      this._emit();
    }
    if (Math.abs(this.velocity) > 0.5) addActive(this);
  }
  _crossings(prev, pos, initial) {
    const s = this._start, e = this._end;
    const fire = (i, name) => {
      if (this.linked && this.scrub === null && !this._reducedDone) this.actions[i](this.linked);
      const cb = this.opts[name];
      if (isFn(cb)) cb(this);
    };
    if (initial) {
      if (pos >= s) {
        this.isActive = pos < e;
        fire(0, "onEnter");
        if (pos >= e) fire(1, "onLeave");
      }
      return;
    }
    if (prev < s && pos >= s) {
      this.isActive = true;
      fire(0, "onEnter");
    }
    if (prev < e && pos >= e) {
      this.isActive = false;
      fire(1, "onLeave");
    }
    if (prev >= e && pos < e) {
      this.isActive = true;
      fire(2, "onEnterBack");
    }
    if (prev >= s && pos < s) {
      this.isActive = false;
      fire(3, "onLeaveBack");
    }
  }
  _apply() {
    const lp = this.linked;
    if (lp && this.scrub !== null && !this._reducedDone) {
      lp.progress = this.progress;
    }
    this._emit();
  }
  _emit() {
    const cb = this.opts.onUpdate;
    if (isFn(cb)) cb(this);
  }
  // Lissage de la progression et amortissement de la vitesse, image par image.
  _tick(dt) {
    let busy = false;
    if (this.scrub !== null && this.scrub > 0) {
      const target = this.rawProgress;
      const k = 1 - Math.exp(-dt / (this.scrub * 1e3 / 3));
      const next2 = this.progress + (target - this.progress) * k;
      if (Math.abs(target - next2) < 5e-4) this.progress = target;
      else {
        this.progress = next2;
        busy = true;
      }
      this._apply();
    }
    if (performance.now() - this._lastTime > 60) {
      this.velocity *= Math.exp(-dt / 140);
      if (Math.abs(this.velocity) < 0.5) this.velocity = 0;
      if (this.scrub === null) this._emit();
    }
    if (Math.abs(this.velocity) > 0) busy = true;
    if (!busy) removeActive(this);
  }
  /** Retire les écouteurs ; l'animation liée reste dans son état actuel. */
  revert() {
    this._killed = true;
    removeActive(this);
    if (this._container) this._container.removeEventListener("scroll", this._onScroll);
    if (hasDOM) {
      window.removeEventListener("resize", this._onResize);
      window.removeEventListener("load", this._onResize);
    }
    if (this._io) this._io.disconnect();
    return this;
  }
};
function onScroll(opts) {
  return new ScrollObserver(opts);
}

// src/svg.js
function lengthOf(el) {
  if (typeof el.getTotalLength === "function") {
    try {
      const l = el.getTotalLength();
      if (l > 0) return l;
    } catch (e) {
    }
  }
  el.setAttribute("pathLength", "1");
  return 1;
}
var Drawable = class {
  constructor(el) {
    this.el = el;
    this.len = lengthOf(el);
    this._s = 0;
    this._e = 1;
    this._opacity = el.style.strokeOpacity;
  }
  _apply() {
    const L = this.len;
    const s = clamp(Math.min(this._s, this._e));
    const e = clamp(Math.max(this._s, this._e));
    const visible = (e - s) * L;
    this.el.style.strokeDasharray = `${visible} ${L + 1}`;
    this.el.style.strokeDashoffset = `${-s * L}`;
    this.el.style.strokeOpacity = visible <= L * 5e-4 ? "0" : this._opacity;
  }
  /** Fin de la portion tracée (0 → 1). Accepte aussi « début fin » en chaîne. */
  get draw() {
    return this._e;
  }
  set draw(v) {
    if (typeof v === "string" && v.trim().includes(" ")) {
      const [a, b] = v.trim().split(/\s+/).map(Number);
      this._s = a || 0;
      this._e = b != null ? b : 1;
    } else this._e = +v;
    this._apply();
  }
  /** Début de la portion tracée (0 → 1). */
  get drawStart() {
    return this._s;
  }
  set drawStart(v) {
    this._s = +v;
    this._apply();
  }
  /** Restaure le style d'origine. */
  revert() {
    this.el.style.strokeDasharray = "";
    this.el.style.strokeDashoffset = "";
    this.el.style.strokeOpacity = this._opacity;
  }
};
function drawable(targets) {
  return resolveTargets(targets).filter((el) => isSVG(el)).map((el) => new Drawable(el));
}
function motionPath(path, opts = {}) {
  var _a, _b, _c;
  const p = resolveTargets(path)[0];
  const offset = (_a = opts.rotateOffset) != null ? _a : 0;
  const start = (_b = opts.start) != null ? _b : 0;
  const end = (_c = opts.end) != null ? _c : 1;
  const at = (t) => {
    if (!p || typeof p.getPointAtLength !== "function") return { x: 0, y: 0 };
    const L = p.getTotalLength();
    return p.getPointAtLength(clamp(start + (end - start) * t) * L);
  };
  const toLocal = (pt, el) => {
    if (!el || isSVG(el) || typeof p.getScreenCTM !== "function") return pt;
    const m = p.getScreenCTM();
    if (!m) return pt;
    const sx = m.a * pt.x + m.c * pt.y + m.e;
    const sy = m.b * pt.x + m.d * pt.y + m.f;
    const parent = el.offsetParent || document.body;
    const pr = parent.getBoundingClientRect();
    const ox = pr.left + el.offsetLeft + el.offsetWidth / 2 - (parent === document.body ? 0 : parent.scrollLeft);
    const oy = pr.top + el.offsetTop + el.offsetHeight / 2 - (parent === document.body ? 0 : parent.scrollTop);
    return { x: sx - ox, y: sy - oy };
  };
  const angle2 = (t, el) => {
    const a = toLocal(at(Math.max(0, t - 2e-3)), el);
    const b = toLocal(at(Math.min(1, t + 2e-3)), el);
    return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + offset;
  };
  const out = {
    x: customValue((t, el) => toLocal(at(t), el).x, "px"),
    y: customValue((t, el) => toLocal(at(t), el).y, "px")
  };
  if (opts.rotate !== false) out.rotate = customValue((t, el) => angle2(t, el), "deg");
  return out;
}

// src/index.js
function remove(targets, props) {
  const list = resolveTargets(targets);
  const names = props ? [].concat(props).map(normalizeProp) : null;
  for (const p of activeList().slice()) {
    if (!p._removeTargets) continue;
    const left = p._removeTargets(list, names);
    if (left === 0) p.cancel();
  }
  return list;
}
function get(target, prop, unit) {
  const el = resolveTargets(target)[0];
  if (!el) return void 0;
  const p = normalizeProp(prop);
  const v = readValue(el, p, propKind(el, p));
  if (!unit) return v;
  const n = parseFloat(v);
  return Number.isNaN(n) ? v : `${n}${unit}`;
}
var utils = {
  clamp,
  lerp,
  mapRange,
  round,
  snap,
  wrap,
  random,
  seed,
  createRandom,
  shuffle,
  get,
  set,
  remove,
  $: resolveTargets
};
var version = "0.1.0";
var { clamp: clamp2, lerp: lerp2, mapRange: mapRange2, round: round2, snap: snap2, wrap: wrap2, random: random2, createRandom: createRandom2, shuffle: shuffle2 } = utils_exports;
