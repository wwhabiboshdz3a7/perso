// animate(cibles, paramètres) : pistes par cible et par propriété, keyframes, composition.
import { isFn, isArr, isObj, isNum, isUndef, clamp, isEl } from './utils.js';
import { engine } from './engine.js';
import { parseEase, linear } from './easings.js';
import { parseValue, applyRelative, unify, interpolate, isCustom } from './values.js';
import { propKind, normalizeProp, readValue, writeValue, captureOriginal, restoreOriginal, defaultUnit, flush } from './props.js';
import { resolveTargets, targetId } from './targets.js';
import { Playable, SCROLL } from './playable.js';

// Paramètres qui ne sont pas des propriétés à animer.
export const RESERVED = new Set(['duration', 'delay', 'ease', 'loop', 'loopDelay', 'alternate', 'reversed', 'autoplay', 'speed',
  'keyframes', 'composition', 'modifier', 'onBegin', 'onUpdate', 'onLoop', 'onComplete', 'onPause', 'reducedMotion', 'attr', 'id', 'defaults', 'playbackEase']);

// Propriétaire courant de chaque (cible, propriété), pour la composition « replace ».
const owners = new Map();
// Dernière valeur écrite par cible et propriété : évite les écritures DOM inutiles.
const written = new WeakMap();

const resolveEase = (e) => parseEase(e) || (isFn(e) ? e : null);

/** Évalue une valeur fonction (el, i, total) → valeur. */
function fnValue(v, target, i, total) {
  return isFn(v) && !v.isSpring && !isCustom(v) ? v(target, i, total) : v;
}

class Track {
  constructor(anim, target, prop, kind, opts) {
    this.anim = anim;
    this.target = target;
    this.prop = prop;
    this.kind = kind;
    this.key = targetId(target) + '|' + prop;
    this.segs = opts.segs;
    this.hasFrom = this.segs.length > 0 && this.segs[0].fromRaw !== undefined;
    this.modifier = opts.modifier;
    this.composition = opts.composition;
    this.start = this.segs.length ? this.segs[0].start : 0;
    this.end = this.segs.reduce((m, s) => Math.max(m, s.start + s.dur), 0);
    this.original = captureOriginal(target, prop, kind);
    this.asNumber = kind === 'prop' && typeof this.original === 'number';
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
    const ctx = { el: this.target, prop: this.prop, isTransform: this.kind === 'transform', defaultUnit: defaultUnit(this.kind, this.prop) };
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
      if (s.fromRaw !== undefined) {
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
    for (const s of this.segs) { if (s.start <= t) seg = s; else break; }
    const p = seg.dur > 0 ? clamp((t - seg.start) / seg.dur) : 1;
    return interpolate(seg.from, seg.to, seg.ease(p), this.asNumber, this.modifier, this.target);
  }

  claim() {
    if (this.composition === 'none') return;
    this.overridden = false;
    const cur = owners.get(this.key);
    if (cur && cur !== this && cur.composition !== 'none') {
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
      const was = this._state;
      this._state = 'before';
      if (this.overridden) return;
      // retour en arrière avant le départ : on rétablit l'état initial de la piste
      if ((was === 'active' || was === 'done') && this.resolved) { this.write(this.valueAt(-1)); return; }
      if (!this.isFirst || !(this.hasFrom || this.resolved)) return;
      this.write(this.valueAt(-1));
      return;
    }
    const was = this._state;
    this._state = t >= this.end ? 'done' : 'active';
    if (was !== 'active' && was !== 'done') this.claim();
    else if (was === 'done' && this._state === 'active') this.claim();
    if (this.overridden) return;
    this.write(this.valueAt(t));
  }

  write(v) {
    const t = this.target;
    let m = written.get(t);
    if (!m) { m = new Map(); written.set(t, m); }
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
}

const isStep = (v) => isObj(v) && !isArr(v) && !isCustom(v) && ('to' in v || 'value' in v || 'from' in v);

/**
 * Convertit la valeur d'une propriété en étapes { to, from?, duration?, delay?, ease? }.
 * Formes acceptées : valeur, [de, à], [a, b, c…] (keyframes), [{ to, duration }…],
 * { to, from, duration, delay, ease, modifier }.
 */
function toSteps(value, ctx, local) {
  const ev = (v) => fnValue(v, ctx.target, ctx.i, ctx.total);
  if (isStep(value) && !local.nested) {
    const o = { ...local, nested: true };
    if (!isUndef(value.duration)) { o.duration = +ev(value.duration); o.durExplicit = true; }
    if (!isUndef(value.delay)) o.delay = +ev(value.delay);
    if (!isUndef(value.ease)) {
      o.ease = resolveEase(ev(value.ease)) || o.ease;
      if (!o.durExplicit && o.ease.isSpring) o.duration = o.ease.duration;
    }
    if (value.modifier) o.modifier = value.modifier;
    const to = 'to' in value ? ev(value.to) : 'value' in value ? ev(value.value) : undefined;
    const from = 'from' in value ? ev(value.from) : undefined;
    let steps;
    if (to === undefined) steps = [{ toCurrent: true }];
    else steps = toSteps(to, ctx, o).steps;
    if (from !== undefined) steps[0] = { ...steps[0], from };
    return { steps, local: o };
  }
  if (isArr(value)) {
    if (value.length && value.every(isStep)) {
      return { steps: value.map((k) => ({
        to: ev('to' in k ? k.to : k.value),
        from: 'from' in k ? ev(k.from) : undefined,
        duration: isUndef(k.duration) ? undefined : +ev(k.duration),
        delay: isUndef(k.delay) ? 0 : +ev(k.delay),
        ease: isUndef(k.ease) ? undefined : resolveEase(ev(k.ease)),
      })), local };
    }
    const vals = value.map(ev);
    if (vals.length === 1) return { steps: [{ to: vals[0] }], local };
    return { steps: vals.slice(1).map((v, k) => (k === 0 ? { to: v, from: vals[0] } : { to: v })), local };
  }
  return { steps: [{ to: value }], local };
}

function stepsToSegs(steps, local, target, prop, kind) {
  const n = steps.length;
  let t = local.delay;
  return steps.map((st) => {
    t += st.delay || 0;
    const dur = Math.max(0, st.duration ?? local.duration / n);
    const seg = {
      start: t,
      dur,
      ease: st.ease || local.ease,
      toRaw: st.toCurrent ? readValue(target, prop, kind) : st.to,
      fromRaw: st.from,
    };
    t += dur;
    return seg;
  });
}

/** Keyframes au niveau de l'animation → étapes par propriété. */
function keyframesToProps(keyframes, duration) {
  const props = {};
  if (isArr(keyframes)) {
    const n = keyframes.length;
    const durs = keyframes.map((kf) => (isUndef(kf.duration) ? duration / n : +kf.duration));
    const names = new Set();
    keyframes.forEach((kf) => Object.keys(kf).forEach((k) => { if (!RESERVED.has(k)) names.add(k); }));
    for (const name of names) {
      const steps = [];
      let wait = 0;
      keyframes.forEach((kf, idx) => {
        if (!(name in kf)) { wait += durs[idx]; return; }
        let to = kf[name];
        let from;
        if (isArr(to) && to.length === 2) { from = to[0]; to = to[1]; }
        steps.push({ to, from, duration: durs[idx], delay: wait, ease: kf.ease });
        wait = 0;
      });
      props[name] = steps;
    }
    return props;
  }
  const stops = Object.keys(keyframes)
    .map((k) => ({ pct: k === 'from' ? 0 : k === 'to' ? 100 : parseFloat(k), kf: keyframes[k] }))
    .filter((st) => !Number.isNaN(st.pct))
    .sort((x, y) => x.pct - y.pct);
  const names = new Set();
  stops.forEach((st) => Object.keys(st.kf).forEach((k) => { if (!RESERVED.has(k)) names.add(k); }));
  for (const name of names) {
    const steps = [];
    let prevPct = 0;
    let prevEase;
    let from;
    let wait = 0;
    for (const st of stops) {
      if (!(name in st.kf)) continue;
      if (st.pct === 0) { from = st.kf[name]; prevEase = st.kf.ease; continue; }
      steps.push({ to: st.kf[name], duration: ((st.pct - prevPct) / 100) * duration, delay: wait, ease: prevEase });
      prevPct = st.pct;
      prevEase = st.kf.ease;
    }
    if (!steps.length) steps.push({ to: from, duration: 0 });
    if (from !== undefined) steps[0].from = from;
    props[name] = steps;
  }
  return props;
}

export class Animation extends Playable {
  constructor(targets, params = {}, inherited = {}) {
    const p = { ...inherited, ...params };
    super(p);
    const d = engine.defaults;
    this.targets = resolveTargets(targets);
    this._tracks = [];
    this._composition = p.composition ?? d.composition;
    const list = this.targets;
    const total = list.length;
    const props = {};
    for (const k of Object.keys(params)) if (!RESERVED.has(k)) props[k] = params[k];

    const baseDur = p.duration;
    let kfProps = null;
    if (p.keyframes) kfProps = keyframesToProps(p.keyframes, isNum(baseDur) ? baseDur : d.duration);
    const attrProps = isObj(p.attr) ? p.attr : null;

    list.forEach((target, i) => {
      const ctx = { target, i, total };
      const ease = resolveEase(fnValue(p.ease ?? d.ease, target, i, total)) || resolveEase(d.ease) || linear;
      let dur = fnValue(baseDur, target, i, total);
      const durExplicit = !isUndef(dur);
      if (!durExplicit) dur = ease.isSpring ? ease.duration : d.duration;
      const delay = +fnValue(p.delay ?? d.delay, target, i, total) || 0;
      const base = { duration: +dur, durExplicit, delay, ease, modifier: p.modifier };
      const add = (rawProp, value, forcedKind, isKf) => {
        const prop = normalizeProp(rawProp);
        const kind = forcedKind || propKind(target, prop);
        if (!isEl(target) && kind !== 'prop') return;
        const v = fnValue(value, target, i, total);
        const { steps, local } = isKf ? { steps: v.map((st) => ({ ...st, to: fnValue(st.to, target, i, total), from: fnValue(st.from, target, i, total), ease: resolveEase(st.ease) })), local: base } : toSteps(v, ctx, base);
        const segs = stepsToSegs(steps, local, target, prop, kind);
        this._tracks.push(new Track(this, target, prop, kind, { segs, modifier: local.modifier, composition: this._composition }));
      };
      for (const k of Object.keys(props)) add(k, props[k]);
      if (kfProps) for (const k of Object.keys(kfProps)) add(k, kfProps[k], null, true);
      if (attrProps) for (const k of Object.keys(attrProps)) add(k, attrProps[k], 'attr');
    });

    // Délai commun sorti de l'itération : il ne se rejoue pas à chaque boucle.
    const starts = this._tracks.map((t) => t.start);
    const minStart = starts.length ? Math.min(...starts) : Math.max(0, +fnValue(p.delay ?? 0, null, 0, 1) || 0);
    this._delay = Math.max(0, minStart);
    for (const tr of this._tracks) {
      for (const s of tr.segs) s.start -= this._delay;
      tr.start -= this._delay;
      tr.end -= this._delay;
    }
    this._iterDur = this._tracks.reduce((m, t) => Math.max(m, t.end), 0);
    if (!this._tracks.length && isNum(baseDur)) this._iterDur = baseDur;
    if (this._dir < 0) this._time = this._total() === Infinity ? this._delay + this._iterDur : this._total();

    const auto = p.autoplay ?? d.autoplay;
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
}

/** Anime des cibles : animate('.carte', { x: 200, rotate: '1turn', duration: 800 }). */
export function animate(targets, params) {
  return new Animation(targets, params);
}

/** Applique des valeurs immédiatement, sans animation. */
export function set(targets, props) {
  const a = new Animation(targets, { ...props, duration: 0, delay: 0, ease: 'linear', autoplay: false, reducedMotion: false });
  a.seek(0);
  a.seek(a.duration);
  flush();
  return a;
}

export { owners as _owners, Track };
