// timeline() : enchaîne et superpose animations, timelines imbriquées et rappels.
import { isFn, isNum, isStr, clamp } from './utils.js';
import { Playable, SCROLL, isPlayable } from './playable.js';
import { Animation } from './animation.js';
import { engine, removeActive } from './engine.js';
import { flush } from './props.js';

const EPS = 1e-9;

export class Timeline extends Playable {
  constructor(params = {}) {
    super(params);
    this._defaults = { ...(params.defaults || {}) };
    this._children = [];
    this._calls = [];
    this._labels = {};
    this._last = null;
    this._delay = Math.max(0, +params.delay || 0);
    this._linkDirty = true;
    const auto = params.autoplay ?? engine.defaults.autoplay;
    if (auto && auto[SCROLL]) {
      this._scroll = auto;
      auto.link(this);
    } else if (auto && !params.__child) {
      // lecture au prochain tick : les enfants sont ajoutés juste après la création
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
  get labels() { return { ...this._labels }; }

  /** Enfants dans l'ordre chronologique : { animation, start, end } (ms). */
  get children() {
    return this._children.map(({ child, start }) => {
      const total = child._total();
      return { animation: child, start, end: start + (total === Infinity ? child._delay + child._iterDur : total) };
    });
  }

  /** Calcule une position : nombre, '<', '<<', '+=200', '-=100', 'libellé', 'libellé+=100', '<<+=50'. */
  _position(pos) {
    const end = this._iterDur;
    if (pos === undefined || pos === null || pos === '') return end;
    if (isNum(pos)) return Math.max(0, pos);
    if (isFn(pos)) return this._position(pos(this));
    if (!isStr(pos)) return end;
    const s = pos.trim();
    const labels = this._labels;
    const has = (k) => Object.prototype.hasOwnProperty.call(labels, k);
    // un libellé exact l'emporte : 'intro-fin', 'étape+1'…
    if (has(s)) return Math.max(0, labels[s]);
    let anchor = s;
    let off = 0;
    // décalage relatif en fin de chaîne : '+=200', '<-=50', 'intro-fin+=100'
    const idx = Math.max(s.lastIndexOf('+='), s.lastIndexOf('-='));
    if (idx >= 0) {
      const amount = s.slice(idx + 2).trim();
      if (amount !== '' && Number.isFinite(+amount)) {
        anchor = s.slice(0, idx).trim();
        off = (s[idx] === '+' ? 1 : -1) * +amount;
      }
    }
    let base;
    if (anchor === '<') base = this._last ? this._last.end : 0;
    else if (anchor === '<<') base = this._last ? this._last.start : 0;
    else if (anchor === '') base = end;
    else if (Number.isFinite(+anchor)) base = +anchor;
    else if (has(anchor)) base = labels[anchor];
    else {
      if (typeof console !== 'undefined') console.warn(`Kinetika : position ou libellé inconnu « ${pos} », ajout en fin de timeline.`);
      base = end;
    }
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
      const pos = this._position(b);
      if (a._parent && a._parent !== this) a._parent._detach(a);
      removeActive(a);
      a._paused = true;
      a._pendingPlay = false;
      a._time = 0;
      a._began = false;
      a._completed = false;
      a._iter = -1;
      return this._insert(a, pos);
    }
    if (isFn(a) && (b === undefined || isNum(b) || isStr(b))) return this.call(a, b);
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
    return this.add(targets, { ...props, duration: 0, ease: 'linear' }, position);
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
    if (this._pendingPlay) { this._pendingPlay = false; this._paused = true; return this; }
    return super.pause();
  }

  // Relie les pistes successives d'une même cible et propriété (départ = valeur précédente).
  _link() {
    if (!this._linkDirty) return;
    const tracks = [];
    this._allTracks(tracks, 0);
    // regroupement par cible puis par propriété
    const byTarget = new Map();
    const groups = [];
    for (const t of tracks) {
      let props = byTarget.get(t.target);
      if (!props) { props = new Map(); byTarget.set(t.target, props); }
      let g = props.get(t.prop);
      if (!g) { g = []; props.set(t.prop, g); groups.push(g); }
      g.push(t);
    }
    for (const g of groups) {
      g.sort((x, y) => (x.absZero + x.start) - (y.absZero + y.start));
      g.forEach((t, i) => {
        t.isFirst = i === 0;
        t.prev = i === 0 ? null : g[i - 1];
      });
    }
    this._linkDirty = false;
    const clear = (tl) => { tl._linkDirty = false; tl._children.forEach((c) => c.child._children && clear(c.child)); };
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
    // deux passes : d'abord les enfants pas encore commencés (états de départ),
    // puis les autres dans l'ordre chronologique, pour que l'état réel l'emporte
    const kids = this._children;
    for (let pass = 0; pass < 2; pass++) {
      // les états de départ sont rendus du plus tardif au plus précoce : le premier l'emporte
      for (let n = 0; n < kids.length; n++) {
        const entry = pass === 0 ? kids[kids.length - 1 - n] : kids[n];
        const { child, start } = entry;
        const local = before ? -1 - start : it - start;
        const isBefore = local < 0;
        if ((pass === 0) !== isBefore) continue;
        const key = isBefore ? 'b' : local >= child._total() ? 'a' : 'x';
        if (key !== 'x' && entry.key === key && !opts.seek) continue;
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
    const startOf = (k) => (alt && k % 2 === 1 ? D : 0);
    const endOf = (k) => (alt && k % 2 === 1 ? 0 : D);
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
      // premier rendu (ou retour après le début) : on part du début de l'itération
      cross(startOf(iter) - (alt && iter % 2 === 1 ? -EPS : EPS), it, false);
      return;
    }
    if (iter === prevIter) { cross(prevIt, it, false); return; }
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
      e.key = undefined;
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
      this._children[k].key = undefined;
    }
  }

  _removeTargets(targets, props) {
    let left = 0;
    for (const { child } of this._children) left += child._removeTargets(targets, props);
    return left;
  }
}

/** Crée une timeline : timeline({ defaults: { duration: 600, ease: 'outExpo' }, loop: 1 }). */
export function timeline(params) {
  return new Timeline(params);
}

export { clamp };
