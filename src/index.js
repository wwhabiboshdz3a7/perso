/*!
 * Kinetika — librairie d'animation JavaScript
 * https://github.com/wwhabiboshdz3a7/kinetika · MIT © 2026 wwhabiboshdz3a7
 */
import { engine, activeList } from './engine.js';
import { animate, set, Animation } from './animation.js';
import { timeline, Timeline } from './timeline.js';
import { stagger } from './stagger.js';
import { eases, cubicBezier, steps, spring, linear, parseEase, easeNames } from './easings.js';
import { splitText, scramble, typewriter, odometer } from './text.js';
import { onScroll, ScrollObserver } from './scroll.js';
import { drawable, motionPath } from './svg.js';
import { resolveTargets } from './targets.js';
import { propKind, normalizeProp, readValue } from './props.js';
import * as u from './utils.js';

/** Arrête les animations en cours sur ces cibles (et seulement ces propriétés si précisées). */
export function remove(targets, props) {
  const list = resolveTargets(targets);
  const names = props ? [].concat(props).map(normalizeProp) : null;
  for (const p of activeList().slice()) {
    if (!p._removeTargets) continue;
    const left = p._removeTargets(list, names);
    if (left === 0) p.cancel();
  }
  return list;
}

/** Lit la valeur actuelle d'une propriété (avec conversion d'unité facultative). */
export function get(target, prop, unit) {
  const el = resolveTargets(target)[0];
  if (!el) return undefined;
  const p = normalizeProp(prop);
  const v = readValue(el, p, propKind(el, p));
  if (!unit) return v;
  const n = parseFloat(v);
  return Number.isNaN(n) ? v : `${n}${unit}`;
}

export const utils = {
  clamp: u.clamp,
  lerp: u.lerp,
  mapRange: u.mapRange,
  round: u.round,
  snap: u.snap,
  wrap: u.wrap,
  random: u.random,
  seed: u.seed,
  createRandom: u.createRandom,
  shuffle: u.shuffle,
  get,
  set,
  remove,
  $: resolveTargets,
};

export const version = '0.1.0';

export {
  engine,
  animate,
  set,
  timeline,
  stagger,
  eases,
  cubicBezier,
  steps,
  spring,
  linear,
  parseEase,
  easeNames,
  splitText,
  scramble,
  typewriter,
  odometer,
  onScroll,
  drawable,
  motionPath,
  Animation,
  Timeline,
  ScrollObserver,
};

export const { clamp, lerp, mapRange, round, snap, wrap, random, createRandom, shuffle } = u;
