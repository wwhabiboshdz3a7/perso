// Moteur : une seule boucle requestAnimationFrame pour toutes les animations.
import { hasDOM } from './utils.js';
import { flush } from './props.js';

const raf = hasDOM && typeof requestAnimationFrame === 'function' ? requestAnimationFrame.bind(window) : null;
const caf = hasDOM && typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame.bind(window) : null;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const active = [];
let frameId = null;
let last = 0;
let elapsed = 0;
let hidden = false;
let reducedQuery = null;

const state = {
  timeScale: 1,
  manual: !raf,
  pauseOnHidden: true,
  lagSmoothing: { threshold: 250, adjusted: 33 },
  reducedMotion: 'auto',
  defaults: {
    duration: 1000,
    delay: 0,
    ease: 'outQuad',
    loop: 0,
    loopDelay: 0,
    alternate: false,
    reversed: false,
    autoplay: true,
    speed: 1,
    composition: 'replace',
  },
};

let inFrame = false;

function frame(t) {
  frameId = null;
  let dt = t - last;
  last = t;
  const lag = state.lagSmoothing;
  if (lag && dt > lag.threshold) dt = lag.adjusted;
  if (dt < 0) dt = 0;
  // pendant l'image, wake() ne programme rien : c'est la fin de l'image qui s'en charge
  inFrame = true;
  try {
    step(dt);
  } finally {
    inFrame = false;
  }
  if (frameId === null && active.length && !state.manual && !state.paused && !(hidden && state.pauseOnHidden)) frameId = raf(frame);
}

function step(dt) {
  const scaled = dt * state.timeScale;
  elapsed += scaled;
  // copie : une animation peut se retirer (ou en ajouter une autre) pendant son tick
  const list = active.slice();
  for (const t of list) {
    if (t._engineActive) t._tick(scaled);
  }
  flush();
}

function wake() {
  if (inFrame || frameId !== null || state.paused || state.manual || !raf || (hidden && state.pauseOnHidden)) return;
  last = now();
  frameId = raf(frame);
}

function sleep() {
  if (frameId !== null && caf) caf(frameId);
  frameId = null;
}

if (hasDOM && typeof document.addEventListener === 'function') {
  document.addEventListener('visibilitychange', () => {
    hidden = document.visibilityState === 'hidden';
    if (hidden && state.pauseOnHidden) sleep();
    else if (!hidden && active.length) wake();
  });
}

export const engine = {
  /** Échelle de temps globale (0.5 = tout au ralenti). */
  get timeScale() { return state.timeScale; },
  set timeScale(v) { state.timeScale = Math.max(0, +v || 0); },
  /** Mode manuel : pas de requestAnimationFrame, on avance avec engine.tick(ms). */
  get manual() { return state.manual; },
  set manual(v) {
    state.manual = !!v || !raf;
    if (state.manual) sleep(); else if (active.length) wake();
  },
  /** Met le moteur en pause quand l'onglet est masqué (par défaut). */
  get pauseOnHidden() { return state.pauseOnHidden; },
  set pauseOnHidden(v) { state.pauseOnHidden = !!v; },
  /** Lissage des sauts : au-delà de `threshold` ms entre deux images, on avance de `adjusted` ms. */
  get lagSmoothing() { return state.lagSmoothing; },
  set lagSmoothing(v) { state.lagSmoothing = v ? { threshold: 250, adjusted: 33, ...v } : null; },
  /** 'auto' (préférence système), true (toujours réduire) ou false (jamais). */
  get reducedMotion() { return state.reducedMotion; },
  set reducedMotion(v) { state.reducedMotion = v === 'auto' ? 'auto' : !!v; },
  /** Le mouvement réduit est-il actuellement en vigueur ? */
  get prefersReducedMotion() { return isReduced(); },
  /** Paramètres par défaut de toutes les animations. */
  get defaults() { return state.defaults; },
  set defaults(v) { Object.assign(state.defaults, v); },
  /** Temps écoulé du moteur (ms, échelle comprise). */
  get time() { return elapsed; },
  /** Nombre d'éléments actifs dans la boucle. */
  get activeCount() { return active.length; },
  /** Avance toutes les animations de `ms` millisecondes (tests, rendu image par image). */
  tick(ms = 1000 / 60) { step(Math.max(0, ms)); },
  /**
   * Appelle `callback(deltaMs, tempsMs)` à chaque image, dans la même boucle que les animations.
   * Renvoie une fonction qui arrête l'appel.
   */
  onFrame(callback) {
    const t = { _engineActive: false, _tick: (dt) => callback(dt, elapsed) };
    addActive(t);
    return () => removeActive(t);
  },
  /** Met toute la boucle en pause / la relance. */
  pause() { state.paused = true; sleep(); },
  resume() { state.paused = false; if (active.length) wake(); },
};

export function isReduced() {
  const r = state.reducedMotion;
  if (r !== 'auto') return r;
  if (!hasDOM || typeof matchMedia !== 'function') return false;
  reducedQuery = reducedQuery || matchMedia('(prefers-reduced-motion: reduce)');
  return reducedQuery.matches;
}

export function addActive(t) {
  if (t._engineActive) return;
  t._engineActive = true;
  active.push(t);
  if (!state.paused) wake();
}

export function removeActive(t) {
  if (!t._engineActive) return;
  t._engineActive = false;
  const i = active.indexOf(t);
  if (i > -1) active.splice(i, 1);
}

export function activeList() {
  return active;
}
