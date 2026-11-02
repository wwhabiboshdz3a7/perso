// SVG : tracé progressif des contours et déplacement le long d'un chemin.
import { resolveTargets } from './targets.js';
import { customValue } from './values.js';
import { isSVG, clamp } from './utils.js';

function lengthOf(el) {
  if (typeof el.getTotalLength === 'function') {
    try {
      const l = el.getTotalLength();
      if (l > 0) return l;
    } catch (e) { /* élément non rendu */ }
  }
  // repli : longueur normalisée via l'attribut pathLength
  el.setAttribute('pathLength', '1');
  return 1;
}

class Drawable {
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
    // un tiret de longueur nulle laisse un point avec les bouts arrondis : on le masque
    this.el.style.strokeOpacity = visible <= L * 0.0005 ? '0' : this._opacity;
  }
  /** Fin de la portion tracée (0 → 1). Accepte aussi « début fin » en chaîne. */
  get draw() { return this._e; }
  set draw(v) {
    if (typeof v === 'string' && v.trim().includes(' ')) {
      const [a, b] = v.trim().split(/\s+/).map(Number);
      this._s = a || 0;
      this._e = b ?? 1;
    } else this._e = +v;
    this._apply();
  }
  /** Début de la portion tracée (0 → 1). */
  get drawStart() { return this._s; }
  set drawStart(v) { this._s = +v; this._apply(); }
  /** Restaure le style d'origine. */
  revert() {
    this.el.style.strokeDasharray = '';
    this.el.style.strokeDashoffset = '';
    this.el.style.strokeOpacity = this._opacity;
  }
}

/**
 * Prépare des formes SVG pour animer leur tracé :
 * animate(drawable('path'), { draw: [0, 1] }) ou { drawStart: [0, 1] } pour effacer.
 */
export function drawable(targets) {
  return resolveTargets(targets).filter((el) => isSVG(el)).map((el) => new Drawable(el));
}

/**
 * Valeurs x, y et angle le long d'un chemin : animate('.point', { ...motionPath('#route') }).
 * Cible SVG : coordonnées du chemin. Cible HTML : son centre est placé sur le chemin.
 */
export function motionPath(path, opts = {}) {
  const p = resolveTargets(path)[0];
  const offset = opts.rotateOffset ?? 0;
  const start = opts.start ?? 0;
  const end = opts.end ?? 1;
  const at = (t) => {
    if (!p || typeof p.getPointAtLength !== 'function') return { x: 0, y: 0 };
    const L = p.getTotalLength();
    return p.getPointAtLength(clamp(start + (end - start) * t) * L);
  };
  const toLocal = (pt, el) => {
    if (!el || isSVG(el) || typeof p.getScreenCTM !== 'function') return pt;
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
  const angle = (t, el) => {
    const a = toLocal(at(Math.max(0, t - 0.002)), el);
    const b = toLocal(at(Math.min(1, t + 0.002)), el);
    return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + offset;
  };
  const out = {
    x: customValue((t, el) => toLocal(at(t), el).x, 'px'),
    y: customValue((t, el) => toLocal(at(t), el).y, 'px'),
  };
  if (opts.rotate !== false) out.rotate = customValue((t, el) => angle(t, el), 'deg');
  return out;
}
