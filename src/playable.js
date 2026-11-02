// Base commune des animations et des timelines : temps, boucles, sens, rappels, promesse.
import { clamp, isFn, isNum } from './utils.js';
import { engine, addActive, removeActive, isReduced } from './engine.js';
import { flush } from './props.js';

export const SCROLL = Symbol.for('kinetika.scroll');

let uid = 0;

function loopsOf(loop) {
  if (loop === true || loop === Infinity || loop === -1) return Infinity;
  if (isNum(loop) && loop > 0) return Math.floor(loop) + 1;
  return 1;
}

export class Playable {
  constructor(params = {}) {
    const d = engine.defaults;
    this.id = params.id ?? `kt-${++uid}`;
    this._params = params;
    this._delay = 0;
    this._iterDur = 0;
    this._loops = loopsOf(params.loop ?? d.loop);
    this._loopDelay = Math.max(0, +(params.loopDelay ?? d.loopDelay) || 0);
    this._alternate = !!(params.alternate ?? d.alternate);
    this._speed = +(params.speed ?? d.speed) || 1;
    this._dir = (params.reversed ?? d.reversed) ? -1 : 1;
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
      onBegin: params.onBegin, onUpdate: params.onUpdate, onLoop: params.onLoop,
      onComplete: params.onComplete, onPause: params.onPause,
    };
    this._promise = null;
    this._resolve = null;
  }

  // —— Durées ——
  /** Durée d'une itération (ms). */
  get iterationDuration() { return this._iterDur; }
  /** Durée totale (délai et boucles compris). Infinity si la boucle est infinie. */
  get duration() { return this._total(); }
  _total() {
    if (this._loops === Infinity) return Infinity;
    return this._delay + this._loops * this._iterDur + (this._loops - 1) * this._loopDelay;
  }

  // —— État ——
  get paused() { return this._paused; }
  get began() { return this._began; }
  get completed() { return this._completed; }
  get reversed() { return this._dir < 0; }
  get currentTime() { return this._time; }
  set currentTime(t) { this.seek(t); }
  get iteration() { return Math.max(0, this._iter); }
  get speed() { return this._speed; }
  set speed(v) { this._speed = Math.max(0, +v || 0); }

  /** Progression totale entre 0 et 1 (celle de l'itération en cours si la boucle est infinie). */
  get progress() {
    const total = this._total();
    if (total === Infinity) {
      const cycle = this._iterDur + this._loopDelay;
      if (!cycle) return 0;
      const local = Math.max(0, this._time - this._delay);
      return clamp((local % cycle) / (this._iterDur || 1));
    }
    return total ? clamp(this._time / total) : (this._completed ? 1 : 0);
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

  resume() { return this.play(); }

  pause() {
    if (this._paused) return this;
    this._paused = true;
    removeActive(this);
    this._fire('onPause');
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
    if (typeof time === 'string' && this._labels) time = (this._labels[time] ?? 0) + this._delay;
    const total = this._total();
    const t = clamp(+time || 0, 0, total);
    this._time = t;
    this._render(t, { seek: true });
    flush();
    if (!this._parent && total !== Infinity) {
      if ((this._dir > 0 && t >= total) || (this._dir < 0 && t <= 0)) this._finish();
      else if (this._completed) { this._completed = false; this._resetPromise(); }
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
      this._promise = new Promise((res) => { this._resolve = res; });
      if (this._completed) this._resolve();
    }
    return this._promise.then(onFulfilled, onRejected);
  }

  // —— Interne ——
  _resetPromise() {
    this._promise = null;
    this._resolve = null;
  }

  _resetChildren() {}

  _fire(name) {
    const cb = this._cb[name];
    if (isFn(cb)) cb(this);
  }

  _jumpToEnd() {
    removeActive(this);
    const total = this._total();
    if (total === Infinity) {
      // boucle infinie : on affiche la fin de la première itération
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
    this._fire('onComplete');
    if (this._resolve) this._resolve();
    else if (!this._promise) this._promise = Promise.resolve();
  }

  _tick(dt) {
    if (this._paused) return;
    const total = this._total();
    this._time += dt * this._speed * this._dir;
    let done = false;
    if (this._dir > 0 && this._time >= total) { this._time = total; done = true; }
    else if (this._dir < 0 && this._time <= 0) { this._time = 0; done = true; }
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
      this._fire('onComplete');
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
    const before = opts.before || t < delay || (t === 0 && delay > 0);
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
      this._fire('onBegin');
    }
    if (prevIter !== -1 && iter !== prevIter) this._fire('onLoop');
    this._iter = iter;
    this._renderContent(it, { ...opts, before: false, iter, prevIter, prevIt });
    this._lastIt = it;
    this._rendered = true;
    this._fire('onUpdate');
  }

  _renderContent() {}
  _revertContent() {}
}

export function isPlayable(v) {
  return v instanceof Playable;
}
