// onScroll() : déclenchement à l'entrée dans l'écran ou progression liée au défilement.
import { clamp, hasDOM, isFn, isEl, isStr, isNum } from './utils.js';
import { resolveTargets } from './targets.js';
import { addActive, removeActive, isReduced } from './engine.js';
import { SCROLL } from './playable.js';
import { flush } from './props.js';

// « top », « center », « bottom », « 30% », « 120px », avec décalage « top+=100 »
function edge(spec, size) {
  if (isNum(spec)) return spec;
  const m = String(spec).trim().match(/^([a-z]+|-?\d*\.?\d+%?(?:px)?)?\s*(?:([+-])=\s*(-?\d*\.?\d+)(%|px)?)?$/i);
  if (!m) return 0;
  const word = (m[1] || 'top').toLowerCase();
  let v;
  if (word === 'top' || word === 'left' || word === 'start') v = 0;
  else if (word === 'center' || word === 'middle') v = size / 2;
  else if (word === 'bottom' || word === 'right' || word === 'end') v = size;
  else if (word.endsWith('%')) v = (parseFloat(word) / 100) * size;
  else v = parseFloat(word) || 0;
  if (m[2]) {
    const off = parseFloat(m[3]) * (m[4] === '%' ? size / 100 : 1);
    v += m[2] === '+' ? off : -off;
  }
  return v;
}

function pair(spec, fallback) {
  const s = isStr(spec) ? spec.trim() : fallback;
  const parts = s.split(/\s+(?![+-]=)/);
  return [parts[0] || 'top', parts[1] || parts[0] || 'top'];
}

const ACTIONS = {
  play: (p) => { if (p.reversed) p.reverse(); else if (!p.completed) p.play(); },
  resume: (p) => { if (!p.completed) p.play(); },
  pause: (p) => p.pause(),
  reverse: (p) => { if (!p.reversed) p.reverse(); else p.play(); },
  restart: (p) => p.restart(),
  reset: (p) => { p.pause(); p.seek(0); },
  complete: (p) => p.complete(),
  none: () => {},
};

let uid = 0;

export class ScrollObserver {
  constructor(opts = {}) {
    this[SCROLL] = true;
    this.id = `scroll-${++uid}`;
    this.opts = opts;
    this.axis = opts.axis === 'x' ? 'x' : 'y';
    this.enter = pair(opts.enter, 'top bottom');
    this.leave = pair(opts.leave, 'bottom top');
    this.scrub = opts.scrub === true ? 0 : isNum(opts.scrub) ? Math.max(0, opts.scrub) : null;
    const sync = (opts.sync || 'play none none none').split(/\s+/);
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
    this._onResize = () => { this.refresh(); };
    // sans animation liée, on démarre au prochain micro-tick (les cibles existent déjà)
    queueMicrotask(() => { if (!this._ready && !this._killed) this._setup(); });
  }

  /** Lie une animation ou une timeline (appelé par autoplay: onScroll(...)). */
  link(playable) {
    this.linked = playable;
    if (!this.opts.target && playable.targets) {
      const el = playable.targets.find((t) => isEl(t));
      if (el) this._target = el;
    }
    // la mise en place attend le micro-tick : les enfants d'une timeline sont ajoutés d'ici là
    return this;
  }

  get target() { return this._target; }

  _setup() {
    if (this._ready || !hasDOM) return;
    this._ready = true;
    const c = this.opts.container ? resolveTargets(this.opts.container)[0] : null;
    this._container = c || window;
    if (this.opts.target) this._target = resolveTargets(this.opts.target)[0];
    if (!this._target) {
      // progression de toute la page
      this._target = document.documentElement;
      if (!this.opts.enter) this.enter = ['top', 'top'];
      if (!this.opts.leave) this.leave = ['bottom', 'bottom'];
    }
    const lp = this.linked;
    if (lp && lp._allowReduce !== false && isReduced()) {
      lp.complete();
      this._reducedDone = true;
    } else if (lp && this.scrub === null) {
      // état de départ affiché sans lancer l'animation
      lp._render(lp._time, { before: true });
      flush();
    }
    this._container.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('load', this._onResize, { once: true });
    if (typeof IntersectionObserver === 'function' && this._target !== document.documentElement) {
      this._io = new IntersectionObserver((entries) => {
        for (const e of entries) this._inView = e.isIntersecting;
        this._update(true);
      }, { root: this._container === window ? null : this._container, rootMargin: '25% 0px 25% 0px' });
      this._io.observe(this._target);
    }
    this.refresh();
  }

  _scrollPos() {
    const c = this._container;
    if (c === window) return this.axis === 'y' ? window.scrollY || document.documentElement.scrollTop : window.scrollX;
    return this.axis === 'y' ? c.scrollTop : c.scrollLeft;
  }

  /** Recalcule les positions de début et de fin (après un changement de mise en page). */
  refresh() {
    if (!this._ready || !this._target) return this;
    const y = this.axis === 'y';
    const c = this._container;
    const cSize = c === window ? (y ? innerHeight : innerWidth) : (y ? c.clientHeight : c.clientWidth);
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
    if (!this._ready || this._killed) return;
    if (!this._inView && !force) return;
    const pos = this._scrollPos();
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (this._lastPos !== null) {
      const dt = Math.max(1, now - this._lastTime);
      const v = ((pos - this._lastPos) / dt) * 1000;
      this.velocity = this.velocity * 0.6 + v * 0.4;
      if (pos !== this._lastPos) this.direction = pos > this._lastPos ? 1 : -1;
    }
    const prevPos = this._lastPos ?? pos;
    this._lastPos = pos;
    this._lastTime = now;
    const raw = clamp((pos - this._start) / (this._end - this._start));
    this._crossings(prevPos, pos, this._firstDone !== true);
    this._firstDone = true;
    this.rawProgress = raw;
    if (this.scrub === 0 || this._reducedDone || (this.scrub !== null && isReduced())) {
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
      if (pos >= s) { this.isActive = pos < e; fire(0, 'onEnter'); if (pos >= e) fire(1, 'onLeave'); }
      return;
    }
    if (prev < s && pos >= s) { this.isActive = true; fire(0, 'onEnter'); }
    if (prev < e && pos >= e) { this.isActive = false; fire(1, 'onLeave'); }
    if (prev >= e && pos < e) { this.isActive = true; fire(2, 'onEnterBack'); }
    if (prev >= s && pos < s) { this.isActive = false; fire(3, 'onLeaveBack'); }
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
      const k = 1 - Math.exp(-dt / ((this.scrub * 1000) / 3));
      const next = this.progress + (target - this.progress) * k;
      if (Math.abs(target - next) < 0.0005) this.progress = target;
      else { this.progress = next; busy = true; }
      this._apply();
    }
    // la vitesse retombe quand on ne défile plus
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
    if (this._container) this._container.removeEventListener('scroll', this._onScroll);
    if (hasDOM) {
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('load', this._onResize);
    }
    if (this._io) this._io.disconnect();
    return this;
  }
}

/**
 * onScroll({ target, enter: 'top bottom', leave: 'bottom top', scrub: true | 0.6, sync: 'play none none reverse' })
 * À utiliser seul (callbacks) ou comme autoplay d'une animation : animate('.x', { y: 0, autoplay: onScroll() }).
 */
export function onScroll(opts) {
  return new ScrollObserver(opts);
}
