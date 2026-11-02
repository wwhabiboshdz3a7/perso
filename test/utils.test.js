import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './_dom.js';

const { utils, clamp, lerp, mapRange, round, snap, wrap, createRandom } = await load();

test('outils numériques', () => {
  assert.equal(clamp(5, 0, 3), 3);
  assert.equal(clamp(-1), 0);
  assert.equal(lerp(10, 20, 0.25), 12.5);
  assert.equal(mapRange(5, 0, 10, 100, 200), 150);
  assert.equal(round(3.14159, 2), 3.14);
  assert.equal(snap(13, 5), 15);
  assert.equal(snap(13, [0, 10, 12, 20]), 12);
  assert.equal(wrap(370, 0, 360), 10);
  assert.equal(wrap(-10, 0, 360), 350);
  assert.equal(utils.clamp, clamp);
});

test('aléatoire à graine', () => {
  const r1 = createRandom(123);
  const r2 = createRandom(123);
  const s1 = Array.from({ length: 5 }, () => r1());
  const s2 = Array.from({ length: 5 }, () => r2());
  assert.deepEqual(s1, s2);
  assert.ok(s1.every((v) => v >= 0 && v < 1));
  const r = createRandom(9);
  for (let i = 0; i < 200; i++) {
    const v = r(10, 20, 1);
    assert.ok(v >= 10 && v <= 20);
    assert.equal(Math.round(v * 10) / 10, v);
  }
  utils.seed(5);
  const a = utils.random(0, 100);
  utils.seed(5);
  assert.equal(utils.random(0, 100), a);
  assert.deepEqual(createRandom(1).shuffle([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
});
