import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, toIso, pinchRatio, handScale } from '../../js/core/hand.js';
import { renderHand, POSES } from '../../js/core/handpose.js';

const expectations = {
  open: 'open', fist: 'fist', point: 'point', victory: 'victory',
  thumb_up: 'thumb_up', thumb_down: 'thumb_down', iloveyou: 'iloveyou',
};

for (const [pose, expected] of Object.entries(expectations)) {
  test(`classification géométrique : ${pose}`, () => {
    for (const side of ['Right', 'Left']) {
      for (const size of [0.12, 0.2, 0.32]) {
        for (const roll of [0, 0.35, -0.35]) {
          for (const aspect of [4 / 3, 16 / 9]) {
            const lm = renderHand(pose, { x: 0.5, y: 0.5, size, roll, side, aspect });
            const c = classify(toIso(lm, aspect, true));
            assert.equal(c.pose, expected, `${pose} ${side} taille ${size} roulis ${roll}`);
          }
        }
      }
    }
  });
}

test('pincement : rapport pouce-index faible, indépendant de la taille', () => {
  const r = [0.1, 0.2, 0.35].map((size) => {
    const iso = toIso(renderHand('pinch', { x: 0.5, y: 0.5, size, aspect: 16 / 9 }), 16 / 9, true);
    return pinchRatio(iso);
  });
  for (const v of r) assert.ok(v < 0.15, `rapport ${v}`);
  assert.ok(Math.max(...r) - Math.min(...r) < 0.02);
  const open = toIso(renderHand('open', { x: 0.5, y: 0.5, size: 0.2, aspect: 16 / 9 }), 16 / 9, true);
  assert.ok(pinchRatio(open) > 0.8);
});

test("le rapport d'aspect est corrigé (distances isotropes)", () => {
  const a = toIso(renderHand('open', { x: 0.5, y: 0.5, size: 0.2, aspect: 4 / 3 }), 4 / 3, true);
  const b = toIso(renderHand('open', { x: 0.5, y: 0.5, size: 0.2, aspect: 16 / 9 }), 16 / 9, true);
  assert.ok(Math.abs(handScale(a) - handScale(b)) < 1e-9);
});

test('toutes les poses de la bibliothèque produisent 21 points finis', () => {
  for (const name of Object.keys(POSES)) {
    const lm = renderHand(name, { x: 0.4, y: 0.6 });
    assert.equal(lm.length, 21);
    for (const p of lm) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
  }
});
