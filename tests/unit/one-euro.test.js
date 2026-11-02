import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OneEuroFilter, OneEuroVector } from '../../js/core/one-euro.js';

test('valeur constante : sortie identique', () => {
  const f = new OneEuroFilter({ minCutoff: 1, beta: 0 });
  for (let i = 0; i < 30; i++) assert.equal(f.filter(0.5, i / 30), 0.5);
});

test('réduit fortement le tremblement au repos', () => {
  const f = new OneEuroFilter({ minCutoff: 1.4, beta: 6 });
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
  const raw = [], out = [];
  for (let i = 0; i < 300; i++) {
    const v = 0.5 + rnd() * 0.02;
    raw.push(v);
    out.push(f.filter(v, i / 30));
  }
  const variance = (a) => { const m = a.reduce((s, x) => s + x, 0) / a.length; return a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length; };
  assert.ok(variance(out.slice(30)) < variance(raw.slice(30)) * 0.35);
});

test('suit un mouvement rapide avec peu de retard grâce à beta', () => {
  const slow = new OneEuroFilter({ minCutoff: 1, beta: 0 });
  const fast = new OneEuroFilter({ minCutoff: 1, beta: 8 });
  let a, b;
  for (let i = 0; i <= 15; i++) { const v = i * 0.05; a = slow.filter(v, i / 30); b = fast.filter(v, i / 30); }
  assert.ok(Math.abs(0.75 - b) < Math.abs(0.75 - a));
  assert.ok(Math.abs(0.75 - b) < 0.1);
});

test('horodatage identique : pas de division par zéro', () => {
  const f = new OneEuroFilter();
  f.filter(1, 1);
  assert.equal(f.filter(2, 1), 1);
  assert.ok(Number.isFinite(f.filter(2, 1.1)));
});

test('filtre vectoriel', () => {
  const v = new OneEuroVector(3, { minCutoff: 1, beta: 0 });
  assert.deepEqual(v.filter([1, 2, 3], 0), [1, 2, 3]);
  const r = v.filter([2, 2, 2], 0.1);
  assert.ok(r[0] > 1 && r[0] < 2 && r[1] === 2 && r[2] < 3);
});
