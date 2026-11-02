import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './_dom.js';

const { stagger } = await load();
const run = (fn, n) => Array.from({ length: n }, (_, i) => fn(null, i, n));

test('valeur simple et départ décalé', () => {
  assert.deepEqual(run(stagger(100), 4), [0, 100, 200, 300]);
  assert.deepEqual(run(stagger(50, { start: 200 }), 3), [200, 250, 300]);
});

test('from : last, center, index', () => {
  assert.deepEqual(run(stagger(10, { from: 'last' }), 4), [30, 20, 10, 0]);
  assert.deepEqual(run(stagger(10, { from: 'center' }), 4), [15, 5, 5, 15]);
  assert.deepEqual(run(stagger(10, { from: 2 }), 5), [20, 10, 0, 10, 20]);
});

test('plage [min, max] et unités', () => {
  assert.deepEqual(run(stagger([0, 90]), 4), [0, 30, 60, 90]);
  assert.deepEqual(run(stagger('0.5rem'), 3), ['0rem', '0.5rem', '1rem']);
  assert.deepEqual(run(stagger(['-10deg', '10deg']), 3), ['-10deg', '0deg', '10deg']);
});

test('grille : distance euclidienne depuis le centre et axes signés', () => {
  const g = run(stagger(100, { grid: [3, 3], from: 'center' }), 9);
  assert.equal(g[4], 0);
  assert.equal(g[1], 100);
  assert.ok(Math.abs(g[0] - 141.421) < 0.01);
  const ax = run(stagger(10, { grid: [3, 1], from: 'center', axis: 'x' }), 3);
  assert.deepEqual(ax, [-10, 0, 10]);
});

test('ease et reversed', () => {
  const e = run(stagger(100, { ease: 'inQuad' }), 3);
  assert.deepEqual(e, [0, 50, 200]);
  assert.deepEqual(run(stagger(10, { reversed: true }), 3), [20, 10, 0]);
});

test('aléatoire à graine : reproductible et différent selon la graine', () => {
  const a = run(stagger(10, { from: 'random', seed: 42 }), 6);
  const b = run(stagger(10, { from: 'random', seed: 42 }), 6);
  const c = run(stagger(10, { from: 'random', seed: 7 }), 6);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.deepEqual([...a].sort((x, y) => x - y), [0, 10, 20, 30, 40, 50]);
});
