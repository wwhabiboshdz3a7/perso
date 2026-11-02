import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, html, num } from './_dom.js';

const { animate, engine } = await load();
const { parseValue, interpolate, unify, applyRelative } = await import('../src/values.js');
const { parseColor, rgbToOklab, oklabToRgb } = await import('../src/color.js');

test('analyse des nombres, unités et opérateurs relatifs', () => {
  assert.deepEqual(parseValue('12.5px'), { type: 'num', n: 12.5, unit: 'px' });
  assert.deepEqual(parseValue(-3), { type: 'num', n: -3, unit: '' });
  const r = parseValue('+=100');
  assert.equal(r.op, '+');
  assert.deepEqual(applyRelative(parseValue('50px'), r), { type: 'num', n: 150, unit: 'px' });
  assert.equal(applyRelative(parseValue('10'), parseValue('*=2.5')).n, 25);
  assert.equal(applyRelative(parseValue('10deg'), parseValue('-=30')).n, -20);
});

test('lecture des couleurs hex, rgb, hsl et noms', () => {
  assert.deepEqual(parseColor('#f00'), [255, 0, 0, 1]);
  assert.deepEqual(parseColor('#00ff0080').slice(0, 3), [0, 255, 0]);
  assert.ok(Math.abs(parseColor('#00ff0080')[3] - 0.502) < 0.01);
  assert.deepEqual(parseColor('rgb(10, 20, 30)'), [10, 20, 30, 1]);
  assert.deepEqual(parseColor('rgb(10 20 30 / 50%)'), [10, 20, 30, 0.5]);
  const h = parseColor('hsl(120, 100%, 50%)').map(Math.round);
  assert.deepEqual(h, [0, 255, 0, 1]);
  assert.deepEqual(parseColor('transparent'), [0, 0, 0, 0]);
  assert.deepEqual(parseColor('white'), [255, 255, 255, 1]);
});

test('aller-retour OKLab sans perte visible', () => {
  for (const c of [[255, 0, 0], [12, 200, 90], [240, 238, 229], [0, 0, 0]]) {
    const back = oklabToRgb(rgbToOklab(c)).map(Math.round);
    assert.deepEqual(back, c);
  }
  // le blanc a une luminance OKLab de 1
  assert.ok(Math.abs(rgbToOklab([255, 255, 255])[0] - 1) < 1e-3);
});

test('interpolation de couleurs en OKLab (pas de gris boueux)', () => {
  const from = parseValue('#ff0000');
  const to = parseValue('#00ff00');
  const mid = interpolate(from, to, 0.5);
  const [r, g] = parseColor(mid);
  // en sRGB naïf on obtiendrait rgb(128, 128, 0) ; OKLab garde plus de luminosité
  assert.ok(r > 150 && g > 120, mid);
  assert.equal(interpolate(from, to, 0), 'rgb(255, 0, 0)');
  assert.equal(interpolate(from, to, 1), 'rgb(0, 255, 0)');
  // vers transparent : la teinte est conservée (alpha prémultiplié)
  const fade = parseColor(interpolate(parseValue('rgba(255, 0, 0, 1)'), parseValue('rgba(255, 0, 0, 0)'), 0.5));
  assert.equal(fade[0], 255);
  assert.ok(Math.abs(fade[3] - 0.5) < 0.01);
});

test('chaînes complexes : chaque nombre et couleur est interpolé', () => {
  const a = parseValue('inset(0% 100% 0% 0%)');
  const b = parseValue('inset(0% 0% 0% 0%)');
  assert.equal(interpolate(a, b, 0.25), 'inset(0% 75% 0% 0%)');
  const s1 = parseValue('0px 0px 0px #000000');
  const s2 = parseValue('10px 20px 30px #ffffff');
  assert.match(interpolate(s1, s2, 0.5), /^5px 10px 15px rgb\(\d+, \d+, \d+\)$/);
  const p1 = parseValue('M0 0 L10 10');
  const p2 = parseValue('M10 20 L30 40');
  assert.equal(interpolate(p1, p2, 0.5), 'M5 10 L20 25');
  const f1 = parseValue('"wght" 100, "wdth" 50');
  const f2 = parseValue('"wght" 900, "wdth" 150');
  assert.equal(interpolate(f1, f2, 0.5), '"wght" 500, "wdth" 100');
});

test('unités : conversion des angles et adoption de l’unité de départ', () => {
  const [f, t] = unify(parseValue('1turn'), parseValue('90deg'), {});
  assert.equal(f.n, 360);
  assert.equal(t.unit, 'deg');
  const [f2, t2] = unify(parseValue('20px'), parseValue(100), {});
  assert.equal(t2.unit, 'px');
  assert.equal(f2.n, 20);
  const [f3] = unify(parseValue('0'), parseValue('50%'), {});
  assert.equal(f3.unit, '%');
});

test('unités CSS : em et rem convertis en px', () => {
  const box = html('<div id="u" style="font-size: 20px; width: 40px"></div>');
  const el = box.querySelector('#u');
  const a = animate(el, { width: '4em', duration: 100, ease: 'linear' });
  engine.tick(50);
  // 40px → 80px (4em à 20px) : à mi-chemin 60px
  assert.equal(num(el.style.width), 3);
  assert.match(el.style.width, /em$/);
  engine.tick(60);
  assert.equal(el.style.width, '4em');
  a.revert();
  assert.equal(el.style.width, '40px');
  box.remove();
});

test('valeurs discrètes : bascule à mi-parcours', () => {
  assert.equal(interpolate(parseValue('block'), parseValue('none'), 0.4), 'block');
  assert.equal(interpolate(parseValue('block'), parseValue('none'), 0.6), 'none');
});
