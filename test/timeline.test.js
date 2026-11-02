import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, html } from './_dom.js';

const { timeline, animate, engine } = await load();
const flushMicro = () => new Promise((r) => setTimeout(r, 0));

test('positions : fin par défaut, nombre, <, <<, +=, -=', () => {
  const o = {};
  const tl = timeline({ autoplay: false, defaults: { duration: 100, ease: 'linear' } });
  tl.add({ a: 0 }, { a: 1 });             // 0 → 100
  tl.add({ b: 0 }, { b: 1 }, '+=50');     // 150 → 250
  tl.add({ c: 0 }, { c: 1 }, '<<');       // 150 → 250
  tl.add({ d: 0 }, { d: 1 }, '<');        // 250 → 350
  tl.add({ e: 0 }, { e: 1 }, '-=20');     // 330 → 430
  tl.add({ f: 0 }, { f: 1 }, 1000);       // 1000 → 1100
  tl.add({ g: 0 }, { g: 1 }, '<<+=10');   // 1010 → 1110
  const starts = tl._children.map((c) => c.start).sort((x, y) => x - y);
  assert.deepEqual(starts, [0, 150, 150, 250, 330, 1000, 1010]);
  assert.equal(tl.duration, 1110);
  void o;
});

test('libellés et seek sur un libellé', () => {
  const p = { x: 0 };
  const tl = timeline({ autoplay: false, defaults: { duration: 100, ease: 'linear' } });
  tl.add(p, { x: 100 }).label('milieu').add(p, { x: 200 }).add(p, { x: 300 }, 'milieu+=300');
  assert.deepEqual(tl.labels, { milieu: 100 });
  tl.seek('milieu');
  assert.equal(p.x, 100);
  tl.seek(150);
  assert.equal(p.x, 150);
  tl.seek(450);
  assert.equal(p.x, 250);
});

test('enchaînement sur une même propriété : départ = valeur précédente, seek avant/arrière', () => {
  const box = html('<div></div>');
  const el = box.firstChild;
  const tl = timeline({ autoplay: false, defaults: { duration: 100, ease: 'linear' } });
  tl.add(el, { x: 100 }).add(el, { x: 0 }).add(el, { x: 300 }, '+=100');
  tl.seek(150);
  assert.equal(el.style.transform, 'translateX(50px)');
  tl.seek(350);
  assert.equal(el.style.transform, 'translateX(150px)');
  tl.seek(50);
  assert.equal(el.style.transform, 'translateX(50px)');
  tl.seek(0);
  assert.equal(el.style.transform, '');
  tl.seek(400);
  assert.equal(el.style.transform, 'translateX(300px)');
  box.remove();
});

test('lecture en temps réel, callbacks call() et set()', async () => {
  const log = [];
  const box = html('<div></div>');
  const el = box.firstChild;
  const o = { v: 0 };
  const tl = timeline({ defaults: { duration: 100, ease: 'linear' }, onComplete: () => log.push('fin') });
  tl.add(o, { v: 100 })
    .call(() => log.push('A'))
    .set(el, { opacity: 0.5 }, 150)
    .add(o, { v: 0 }, 200)
    .call(() => log.push('B'), 250);
  await flushMicro();
  engine.tick(120);
  assert.deepEqual(log, ['A']);
  assert.equal(el.style.opacity, '');
  engine.tick(40);
  assert.equal(el.style.opacity, '0.5');
  engine.tick(100);
  assert.deepEqual(log, ['A', 'B']);
  engine.tick(100);
  assert.deepEqual(log, ['A', 'B', 'fin']);
  assert.equal(o.v, 0);
  // retour arrière : set() est annulé (valeur d'avant rétablie)
  tl.seek(100);
  assert.notEqual(el.style.opacity, '0.5');
  assert.equal(getComputedStyle(el).opacity, '1');
  box.remove();
});

test('timelines imbriquées et animations existantes', () => {
  const o = { a: 0, b: 0 };
  const inner = timeline({ autoplay: false, defaults: { duration: 100, ease: 'linear' } });
  inner.add(o, { a: 100 }).add(o, { b: 100 });
  const solo = animate(o, { a: 50, duration: 100, ease: 'linear', autoplay: false });
  const outer = timeline({ autoplay: false });
  outer.add(inner, 100).add(solo);
  assert.equal(outer.duration, 400);
  outer.seek(150);
  assert.equal(o.a, 50);
  outer.seek(250);
  assert.equal(o.b, 50);
  outer.seek(350);
  assert.equal(o.a, 75);
  outer.seek(0);
  assert.equal(o.a, 0);
});

test('boucle et aller-retour de timeline, reverse()', async () => {
  const o = { v: 0 };
  const loops = [];
  const tl = timeline({ loop: 1, alternate: true, defaults: { ease: 'linear' }, onLoop: () => loops.push(1) });
  tl.add(o, { v: 100, duration: 100 });
  await flushMicro();
  engine.tick(50);
  assert.equal(o.v, 50);
  engine.tick(80);
  assert.equal(o.v, 70);
  assert.equal(loops.length, 1);
  engine.tick(100);
  assert.equal(o.v, 0);
  assert.ok(tl.completed);
  tl.reverse();
  engine.tick(50);
  assert.equal(o.v, 50);
});

test('départ explicite rendu dès l’ajout à une timeline', () => {
  const box = html('<h2></h2>');
  const el = box.firstChild;
  const tl = timeline();
  tl.add(el, { opacity: [0, 1], y: [40, 0], duration: 300 }, 500);
  assert.equal(el.style.opacity, '0');
  assert.equal(el.style.transform, 'translateY(40px)');
  tl.cancel();
  box.remove();
});

test('progress et promesse de timeline', async () => {
  const o = { v: 0 };
  const tl = timeline({ autoplay: false, defaults: { ease: 'linear' } });
  tl.add(o, { v: 100, duration: 200 });
  tl.progress = 0.5;
  assert.equal(o.v, 50);
  let done = false;
  tl.then(() => (done = true));
  tl.play();
  engine.tick(200);
  await Promise.resolve();
  await Promise.resolve();
  assert.ok(done);
});

test('revert() d’une timeline restaure toutes les cibles', () => {
  const box = html('<div style="opacity: .2"></div>');
  const el = box.firstChild;
  const tl = timeline({ autoplay: false });
  tl.add(el, { opacity: 1, duration: 100 }).add(el, { x: 100, duration: 100 });
  tl.seek(200);
  assert.equal(el.style.opacity, '1');
  tl.revert();
  assert.equal(el.style.opacity, '0.2');
  assert.equal(el.style.transform, '');
  box.remove();
});
