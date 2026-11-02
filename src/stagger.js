// stagger() : répartit une valeur (délai, décalage, rotation…) sur une liste de cibles.
import { isArr, isStr, isNum, isFn } from './utils.js';
import { parseEase } from './easings.js';
import { createRandom } from './utils.js';

function splitUnit(v) {
  if (isNum(v)) return [v, ''];
  const m = String(v).trim().match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  return m ? [parseFloat(m[1]), m[2]] : [parseFloat(v) || 0, ''];
}

/**
 * stagger(100) → 0, 100, 200…
 * stagger([0, 360]) → valeurs réparties de 0 à 360
 * stagger(50, { from: 'center', grid: [10, 6], axis: 'x', ease: 'inQuad', start: 200, reversed: true })
 * stagger(30, { from: 'random', seed: 7 })
 */
export function stagger(value, opts = {}) {
  const { from = 'first', grid, axis, start = 0, reversed = false, seed } = opts;
  const ease = opts.ease ? (isFn(opts.ease) ? opts.ease : parseEase(opts.ease)) : null;
  const isRange = isArr(value);
  const [v0, unit0] = isRange ? splitUnit(value[0]) : splitUnit(value);
  const [v1, unit1] = isRange ? splitUnit(value[1]) : [0, ''];
  const unit = unit0 || unit1;
  const [s0, sUnit] = splitUnit(start);
  let cache = null;

  const compute = (total) => {
    const distances = [];
    let fromIndex;
    if (from === 'first') fromIndex = 0;
    else if (from === 'last') fromIndex = total - 1;
    else if (from === 'center') fromIndex = (total - 1) / 2;
    else if (from === 'random') fromIndex = 0;
    else fromIndex = Math.max(0, Math.min(total - 1, +from || 0));

    if (from === 'random') {
      const rng = createRandom(seed ?? 1);
      const order = rng.shuffle([...Array(total).keys()]);
      order.forEach((idx, rank) => { distances[idx] = rank; });
    } else if (grid && grid.length === 2) {
      const [cols, rows] = grid;
      const fx = from === 'center' ? (cols - 1) / 2 : fromIndex % cols;
      const fy = from === 'center' ? (rows - 1) / 2 : Math.floor(fromIndex / cols);
      for (let i = 0; i < total; i++) {
        const x = i % cols;
        const y = Math.floor(i / cols);
        const dx = fx - x;
        const dy = fy - y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (axis === 'x') d = -dx;
        if (axis === 'y') d = -dy;
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
    if (!cache || cache.total !== total) cache = { total, ...compute(total) };
    const d = cache.out[index] ?? 0;
    let v;
    if (isRange) v = cache.max > 0 ? v0 + ((v1 - v0) * d) / cache.max : v0;
    else v = d * v0;
    v += s0;
    const u = unit || sUnit;
    return u ? `${Math.round(v * 1000) / 1000}${u}` : v;
  };
  fn.isStagger = true;
  return fn;
}

export { isStr };
