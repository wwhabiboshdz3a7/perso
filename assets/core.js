// Outils partagés : détection, boucles économes, pointeur unifié, mesure du texte.

export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const TOUCH = matchMedia('(hover: none), (pointer: coarse)').matches;
export const SMALL = () => innerWidth < 760;
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);

let glCache = null;
export function hasWebGL() {
  if (glCache !== null) return glCache;
  try {
    const c = document.createElement('canvas');
    glCache = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { glCache = false; }
  return glCache;
}

export const FONTS = {
  display: '"Anybody", "Arial Narrow", sans-serif',
  serif: '"Fraunces", Georgia, serif',
  mono: '"Recursive", ui-monospace, monospace',
  flex: '"Roboto Flex", system-ui, sans-serif',
  tall: '"Big Shoulders Display", Impact, sans-serif'
};

// Attend les polices utilisées dans les canvas (sans bloquer plus d'1,5 s).
export function fontsReady(list = []) {
  const loads = list.map((f) => document.fonts.load(f).catch(() => null));
  const all = Promise.all(loads).then(() => document.fonts.ready);
  return Promise.race([all, new Promise((r) => setTimeout(r, 4000))]);
}

// Boucle rAF suspendue hors écran et quand l'onglet est masqué.
export function loop(el, fn, { margin = '120px' } = {}) {
  let visible = true, raf = 0, last = 0, t = 0, alive = true;
  const tick = (now) => {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now; t += dt;
    fn(t, dt);
    schedule();
  };
  const schedule = () => {
    if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
    if (visible) { last = 0; schedule(); }
  }, { rootMargin: margin });
  io.observe(el);
  const onVis = () => { last = 0; schedule(); };
  document.addEventListener('visibilitychange', onVis);
  schedule();
  return {
    get visible() { return visible; },
    stop() { alive = false; io.disconnect(); document.removeEventListener('visibilitychange', onVis); cancelAnimationFrame(raf); }
  };
}

// Pointeur unifié : souris, toucher, gyroscope ou auto-animation.
export const pointer = {
  x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0,
  nx: 0, ny: 0, active: false, source: TOUCH ? 'auto' : 'mouse', down: false
};
let lastMove = 0;
function setPointer(x, y) {
  pointer.vx = x - pointer.x; pointer.vy = y - pointer.y;
  pointer.x = x; pointer.y = y;
  pointer.nx = (x / innerWidth) * 2 - 1; pointer.ny = (y / innerHeight) * 2 - 1;
  pointer.active = true; lastMove = performance.now();
}
addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') pointer.source = 'mouse'; else pointer.source = 'touch'; setPointer(e.clientX, e.clientY); }, { passive: true });
addEventListener('pointerdown', (e) => { pointer.down = true; setPointer(e.clientX, e.clientY); }, { passive: true });
addEventListener('pointerup', () => { pointer.down = false; }, { passive: true });
addEventListener('pointerleave', () => { pointer.active = false; });

let gyro = null;
function onOrient(e) {
  if (e.gamma == null) return;
  gyro = { gx: clamp(e.gamma / 35, -1, 1), gy: clamp((e.beta - 40) / 35, -1, 1) };
}
export function enableGyro() {
  if (!TOUCH) return;
  const D = window.DeviceOrientationEvent;
  if (!D) return;
  const add = () => addEventListener('deviceorientation', onOrient, { passive: true });
  if (typeof D.requestPermission === 'function') {
    const ask = () => { D.requestPermission().then((s) => { if (s === 'granted') add(); }).catch(() => {}); removeEventListener('touchend', ask); };
    addEventListener('touchend', ask, { once: true });
  } else add();
}

// Position virtuelle : vraie souris si active récemment, sinon gyroscope ou trajectoire de Lissajous.
export function virtualPointer(t, rect) {
  const w = rect ? rect.width : innerWidth, h = rect ? rect.height : innerHeight;
  const ox = rect ? rect.left : 0, oy = rect ? rect.top : 0;
  const recent = performance.now() - lastMove < 2500;
  if (pointer.active && recent) return { x: pointer.x - ox, y: pointer.y - oy, real: true };
  if (gyro) return { x: w / 2 + gyro.gx * w * 0.4, y: h / 2 + gyro.gy * h * 0.35, real: false };
  return { x: w / 2 + Math.sin(t * 0.7) * w * 0.32, y: h / 2 + Math.sin(t * 1.1 + 1) * h * 0.22, real: false };
}

// Ajuste la taille de police pour que le texte remplisse une largeur.
export function fitText(el, { width, max = 9999, min = 12, ratio = 1 } = {}) {
  const w = (width || el.parentElement.clientWidth) * ratio;
  const prev = el.style.display, pw = el.style.width;
  el.style.display = 'inline-block';
  el.style.width = 'max-content';
  el.style.fontSize = '100px';
  el.style.whiteSpace = 'nowrap';
  const nat = el.getBoundingClientRect().width || 1;
  el.style.display = prev; el.style.width = pw;
  const size = clamp((100 * w) / nat, min, max);
  el.style.fontSize = size + 'px';
  return size;
}

// Découpe manuelle en caractères (garde les espaces), utile hors SplitText.
export function chars(el, text, cls = 'ch') {
  el.textContent = '';
  const out = [];
  for (const c of text) {
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = c === ' ' ? ' ' : c;
    el.appendChild(s);
    out.push(s);
  }
  return out;
}

// Échantillonne les pixels d'un texte rendu sur canvas → liste de points.
export function sampleText(text, { width, height, font, step = 6, align = 'center', lines = null }) {
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff';
  g.textAlign = align; g.textBaseline = 'middle';
  const rows = lines || [text];
  let size = height / (rows.length * 1.05);
  g.font = font.replace('{s}', size);
  let widest = Math.max(...rows.map((r) => g.measureText(r).width));
  if (widest > width * 0.92) { size *= (width * 0.92) / widest; g.font = font.replace('{s}', size); }
  rows.forEach((r, i) => g.fillText(r, width / 2, height / 2 + (i - (rows.length - 1) / 2) * size * 1.0));
  const d = g.getImageData(0, 0, width, height).data;
  const pts = [];
  for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
    if (d[(y * width + x) * 4 + 3] > 128) pts.push(x, y);
  }
  return pts;
}

export function cssVar(name, el = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function resizeCanvas(cv, dpr = DPR) {
  const r = cv.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; return true; }
  return false;
}

export function debounce(fn, ms = 150) {
  let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); };
}

// Injecte une feuille de style propre à un module, une seule fois.
export function injectCSS(id, text) {
  if (document.getElementById('css-' + id)) return;
  const s = document.createElement('style');
  s.id = 'css-' + id; s.textContent = text;
  document.head.appendChild(s);
}

// Nombre de lignes et taille de police pour qu'un texte remplisse l'écran.
export function bigSize(text, w, h, { maxVw = 0.26, ratio = 0.62, maxRows = 3, lh = 0.9 } = {}) {
  const len = [...text].length;
  const rows = clamp(len <= 9 ? 1 : len <= 20 ? 2 : 3, 1, maxRows);
  const perLine = Math.ceil(len / rows) + 1;
  const longest = Math.max(...text.split(/\s+/).map((x) => [...x].length));
  return Math.min(w * maxVw, (w * 0.9) / (perLine * ratio), (w * 0.9) / ((longest + 0.5) * ratio * 1.12), (h * 0.72) / (rows * lh));
}

export const getGyro = () => gyro;

// Échappe un texte saisi avant insertion en HTML.
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
