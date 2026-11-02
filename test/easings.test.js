import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './_dom.js';

const { eases, parseEase, cubicBezier, steps, spring, easeNames } = await load();
const close = (a, b, eps = 1e-4) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('bornes : toutes les courbes valent 0 au début et 1 à la fin', () => {
  for (const name of easeNames) {
    const f = eases[name];
    close(f(0), 0, 1e-3);
    close(f(1), 1, 1e-3);
  }
});

test('valeurs connues des familles classiques', () => {
  close(eases.linear(0.3), 0.3);
  close(eases.inQuad(0.5), 0.25);
  close(eases.outQuad(0.5), 0.75);
  close(eases.inOutQuad(0.25), 0.125);
  close(eases.inCubic(0.5), 0.125);
  close(eases.outCubic(0.5), 0.875);
  close(eases.inQuart(0.5), 0.0625);
  close(eases.inQuint(0.5), 0.03125);
  close(eases.inSine(0.5), 1 - Math.cos(Math.PI / 4));
  close(eases.outSine(0.5), Math.sin(Math.PI / 4));
  close(eases.inExpo(0.5), 2 ** -5);
  close(eases.inCirc(0.5), 1 - Math.sqrt(0.75));
  close(eases.inOutCubic(0.5), 0.5);
  close(eases.outBounce(0.5), 0.765625);
  close(eases.inBack(0.5), (2.70158 * 0.125) - 1.70158 * 0.25);
});

test('back dépasse, elastic oscille', () => {
  assert.ok(eases.outBack(0.8) > 1);
  assert.ok(eases.inBack(0.2) < 0);
  const values = Array.from({ length: 50 }, (_, i) => eases.outElastic(i / 49));
  assert.ok(values.some((v) => v > 1));
});

test('paramètres : outElastic(1, .5) et inOutBack(3) en chaîne', () => {
  const e = parseEase('outElastic(1, .5)');
  close(e(0.5), 0.96875);
  const b = parseEase('inOutBack(3)');
  assert.ok(b(0.1) < eases.inOutBack(0.1));
  close(parseEase('out(3)')(0.5), eases.outCubic(0.5));
  close(parseEase('in(2)')(0.5), 0.25);
});

test('alias anime.js, GSAP et CSS', () => {
  close(parseEase('easeOutQuad')(0.5), 0.75);
  close(parseEase('power2.out')(0.5), eases.outCubic(0.5));
  close(parseEase('expo.inOut')(0.3), eases.inOutExpo(0.3));
  close(parseEase('ease-in-out')(0.5), 0.5);
  assert.equal(parseEase('nimportequoi'), null);
});

test('cubicBezier', () => {
  const css = cubicBezier(0.42, 0, 0.58, 1);
  close(css(0.5), 0.5);
  close(cubicBezier(0, 0, 1, 1)(0.37), 0.37);
  const e = cubicBezier(0.16, 1, 0.3, 1);
  assert.ok(e(0.2) > 0.6);
  close(parseEase('cubicBezier(.42, 0, .58, 1)')(0.5), 0.5);
});

test('steps', () => {
  const s = steps(4);
  assert.equal(s(0.1), 0);
  assert.equal(s(0.3), 0.25);
  assert.equal(s(0.99), 0.75);
  assert.equal(s(1), 1);
  assert.equal(steps(4, 'start')(0.1), 0.25);
  assert.equal(parseEase('steps(2)')(0.6), 0.5);
});

test('spring : durée calculée, stabilisation sur 1, dépassement si peu amorti', () => {
  const sp = spring({ mass: 1, stiffness: 100, damping: 10 });
  assert.ok(sp.duration > 500 && sp.duration < 2500, `durée ${sp.duration}`);
  close(sp(1), 1);
  assert.ok(Array.from({ length: 100 }, (_, i) => sp(i / 99)).some((v) => v > 1.05));
  const stiff = spring({ stiffness: 400, damping: 40 });
  assert.ok(stiff.duration < sp.duration);
  assert.ok(Array.from({ length: 100 }, (_, i) => stiff(i / 99)).every((v) => v <= 1.001));
  assert.equal(spring({ mass: 1, stiffness: 100, damping: 10 }), sp, 'mise en cache');
  assert.ok(parseEase('spring(1, 100, 10, 0)').isSpring);
});

test('fonction personnalisée acceptée telle quelle', () => {
  const f = (t) => t * t * t;
  assert.equal(parseEase(f), f);
});
