import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, html, num } from './_dom.js';

const { animate, engine, stagger, set, remove, get } = await load();

const tx = (el) => el.style.transform;

test('transformations individuelles composées dans un seul transform', () => {
  const box = html('<div class="t"></div>');
  const el = box.firstChild;
  animate(el, { x: 100, y: '50%', rotate: '1turn', scale: 2, duration: 1000, ease: 'linear' });
  engine.tick(500);
  assert.equal(tx(el), 'translateX(50px) translateY(25%) rotate(0.5turn) scale(1.5)');
  engine.tick(600);
  assert.equal(tx(el), 'translateX(100px) translateY(50%) rotate(1turn) scale(2)');
  box.remove();
});

test('transformation en ligne existante reprise comme point de départ', () => {
  const box = html('<div style="transform: translateX(20px) rotate(10deg)"></div>');
  const el = box.firstChild;
  animate(el, { x: 120, duration: 100, ease: 'linear' });
  engine.tick(50);
  assert.equal(tx(el), 'translateX(70px) rotate(10deg)');
  box.remove();
});

test('CSS, variables CSS, attributs SVG et objets JS', () => {
  const box = html('<div style="opacity: 1; --k: 0px"></div><svg><circle cx="10" r="5"></circle></svg>');
  const el = box.firstChild;
  const circle = box.querySelector('circle');
  const obj = { score: 0 };
  animate(el, { opacity: 0, '--k': '100px', backgroundColor: ['#000000', '#ffffff'], duration: 100, ease: 'linear' });
  animate(circle, { cx: 110, r: [5, 15], duration: 100, ease: 'linear' });
  animate(obj, { score: 1000, duration: 100, ease: 'linear', modifier: Math.round });
  engine.tick(50);
  assert.equal(num(el.style.opacity), 0.5);
  assert.equal(el.style.getPropertyValue('--k'), '50px');
  assert.match(el.style.backgroundColor, /^rgb\((\d+), \1, \1\)$/);
  assert.equal(circle.getAttribute('cx'), '60');
  assert.equal(circle.getAttribute('r'), '10');
  assert.equal(obj.score, 500);
  assert.equal(typeof obj.score, 'number');
  engine.tick(60);
  assert.equal(el.style.opacity, '0');
  assert.equal(el.style.backgroundColor, 'rgb(255, 255, 255)');
  box.remove();
});

test('valeurs de/à, relatives et fonctions (el, i, total)', () => {
  const box = html('<i></i><i></i><i></i>');
  const els = [...box.children];
  els.forEach((e) => (e.style.transform = 'translateX(10px)'));
  const seen = [];
  animate(els, {
    x: '+=90',
    y: (el, i, total) => { seen.push([i, total]); return i * 10; },
    rotate: [45, 90],
    duration: 100,
    ease: 'linear',
  });
  engine.tick(200);
  assert.deepEqual(seen, [[0, 3], [1, 3], [2, 3]]);
  assert.equal(tx(els[0]), 'translateX(100px) rotate(90deg)');
  assert.equal(tx(els[2]), 'translateX(100px) translateY(20px) rotate(90deg)');
  box.remove();
});

test('départ explicite appliqué immédiatement, même avec un délai (pas d’éclair)', () => {
  const box = html('<p></p>');
  const el = box.firstChild;
  animate(el, { opacity: [0, 1], delay: 500, duration: 100 });
  assert.equal(el.style.opacity, '0');
  box.remove();
});

test('paramètres par propriété', () => {
  const o = { a: 0, b: 0 };
  animate(o, { a: { to: 100, duration: 200, ease: 'linear' }, b: { to: 100, delay: 100, duration: 100, ease: 'linear' }, duration: 1000 });
  engine.tick(100);
  assert.equal(o.a, 50);
  assert.equal(o.b, 0);
  engine.tick(50);
  assert.equal(o.a, 75);
  assert.equal(o.b, 50);
});

test('keyframes : tableau de valeurs, tableau d’étapes et pourcentages', () => {
  const o = { v: 0, w: 0, z: 0 };
  animate(o, { v: [0, 100, 50], duration: 200, ease: 'linear' });
  engine.tick(100);
  assert.equal(o.v, 100);
  engine.tick(50);
  assert.equal(o.v, 75);
  engine.tick(100);
  assert.equal(o.v, 50);

  animate(o, { w: [{ to: 10, duration: 100 }, { to: 30, duration: 300 }], ease: 'linear' });
  engine.tick(100);
  assert.equal(o.w, 10);
  engine.tick(150);
  assert.equal(o.w, 20);

  const k = { x: 0, y: 0 };
  animate(k, { keyframes: [{ x: 100 }, { y: 50 }, { x: 0, y: 0 }], duration: 300, ease: 'linear' });
  engine.tick(100);
  assert.deepEqual(k, { x: 100, y: 0 });
  engine.tick(100);
  assert.deepEqual(k, { x: 100, y: 50 });
  engine.tick(50);
  assert.deepEqual(k, { x: 50, y: 25 });

  const pc = { s: 0 };
  animate(pc, { keyframes: { '0%': { s: 0 }, '25%': { s: 100 }, '100%': { s: 0 } }, duration: 400, ease: 'linear' });
  engine.tick(100);
  assert.equal(pc.s, 100);
  engine.tick(150);
  assert.equal(pc.s, 50);
});

test('callbacks et ordre : onBegin, onUpdate, onLoop, onComplete', () => {
  const log = [];
  const o = { v: 0 };
  animate(o, {
    v: 1, duration: 100, loop: 1, delay: 50,
    onBegin: () => log.push('begin'),
    onLoop: () => log.push('loop'),
    onComplete: () => log.push('complete'),
    onUpdate: () => { if (!log.includes('update')) log.push('update'); },
  });
  engine.tick(30);
  assert.deepEqual(log, []);
  engine.tick(40);
  assert.deepEqual(log, ['begin', 'update']);
  engine.tick(100);
  assert.deepEqual(log, ['begin', 'update', 'loop']);
  engine.tick(100);
  assert.deepEqual(log, ['begin', 'update', 'loop', 'complete']);
});

test('loop, alternate et reversed', () => {
  const o = { v: 0 };
  const a = animate(o, { v: 100, duration: 100, loop: 2, alternate: true, ease: 'linear' });
  assert.equal(a.duration, 300);
  engine.tick(150);
  assert.equal(o.v, 50);
  engine.tick(30);
  assert.equal(o.v, 20);
  engine.tick(200);
  assert.equal(o.v, 100);
  assert.ok(a.completed);

  const r = { v: 0 };
  animate(r, { v: [0, 100], duration: 100, reversed: true, ease: 'linear' });
  assert.equal(r.v, 100);
  engine.tick(25);
  assert.equal(r.v, 75);
});

test('boucle infinie : la durée totale est infinie, la progression est celle de l’itération', () => {
  const o = { v: 0 };
  const a = animate(o, { v: 100, duration: 100, loop: true, ease: 'linear' });
  assert.equal(a.duration, Infinity);
  engine.tick(1050);
  assert.equal(o.v, 50);
  assert.ok(Math.abs(a.progress - 0.5) < 1e-9);
  a.pause();
});

test('contrôles : pause, play, seek, progress, speed, reverse, restart', () => {
  const o = { v: 0 };
  const a = animate(o, { v: 100, duration: 1000, ease: 'linear' });
  engine.tick(200);
  a.pause();
  engine.tick(500);
  assert.equal(o.v, 20);
  a.seek(600);
  assert.equal(o.v, 60);
  a.progress = 0.25;
  assert.equal(o.v, 25);
  a.speed = 2;
  a.play();
  engine.tick(100);
  assert.equal(o.v, 45);
  a.reverse();
  engine.tick(100);
  assert.equal(o.v, 25);
  // restart() repart du début dans le sens courant (ici à rebours : depuis la fin)
  a.restart();
  assert.equal(a.reversed, true);
  assert.equal(o.v, 100);
  a.reverse();
  a.restart();
  assert.equal(o.v, 0);
  a.cancel();
});

test('promesse : then() et await à la fin', async () => {
  const o = { v: 0 };
  const a = animate(o, { v: 1, duration: 100 });
  let done = false;
  a.then(() => { done = true; });
  engine.tick(50);
  await Promise.resolve();
  assert.equal(done, false);
  engine.tick(60);
  await a;
  assert.equal(done, true);
});

test('revert() restaure les valeurs d’origine', () => {
  const box = html('<div style="opacity: .5; color: red"></div>');
  const el = box.firstChild;
  const a = animate(el, { opacity: 1, x: 200, color: '#00f', duration: 100 });
  engine.tick(200);
  assert.equal(el.style.opacity, '1');
  a.revert();
  assert.equal(el.style.opacity, '0.5');
  assert.equal(el.style.color, 'red');
  assert.equal(el.style.transform, '');
  box.remove();
});

test('composition « replace » : la nouvelle animation reprend la propriété', () => {
  const o = { v: 0 };
  const a = animate(o, { v: 100, duration: 1000, ease: 'linear' });
  engine.tick(500);
  const b = animate(o, { v: 0, duration: 100, ease: 'linear' });
  engine.tick(50);
  assert.equal(o.v, 25);
  engine.tick(100);
  assert.equal(o.v, 0);
  engine.tick(200);
  assert.equal(o.v, 0, 'l’ancienne animation n’écrit plus');
  assert.ok(b.completed);
  a.cancel();
});

test('stagger appliqué au délai et aux valeurs', () => {
  const list = [{ v: 0 }, { v: 0 }, { v: 0 }];
  animate(list, { v: stagger(10, { start: 10 }), delay: stagger(100), duration: 100, ease: 'linear' });
  engine.tick(150);
  assert.deepEqual(list.map((o) => o.v), [10, 10, 0]);
  engine.tick(200);
  assert.deepEqual(list.map((o) => o.v), [10, 20, 30]);
});

test('ressort : la durée par défaut vient de la physique', () => {
  const o = { v: 0 };
  const a = animate(o, { v: 1, ease: 'spring(1, 170, 26)' });
  assert.ok(a.duration > 200 && a.duration < 1500, String(a.duration));
  a.complete();
  assert.equal(o.v, 1);
});

test('set(), get() et remove()', () => {
  const box = html('<div></div>');
  const el = box.firstChild;
  set(el, { x: 40, opacity: 0.3 });
  assert.equal(el.style.transform, 'translateX(40px)');
  assert.equal(el.style.opacity, '0.3');
  assert.equal(get(el, 'x'), '40px');
  const a = animate(el, { x: 400, duration: 1000 });
  engine.tick(10);
  remove(el);
  assert.ok(a.paused);
  box.remove();
});

test('mouvement réduit : saut immédiat à l’état final', async () => {
  const o = { v: 0 };
  engine.reducedMotion = true;
  let completed = false;
  const a = animate(o, { v: 100, duration: 2000, onComplete: () => (completed = true) });
  assert.equal(o.v, 100);
  assert.ok(completed && a.completed);
  const inf = { r: 0 };
  animate(inf, { r: [0, 360], duration: 500, loop: true });
  assert.equal(inf.r, 360);
  const essential = { p: 0 };
  animate(essential, { p: 1, duration: 100, reducedMotion: false, ease: 'linear' });
  assert.equal(essential.p, 0);
  engine.reducedMotion = 'auto';
  globalThis.__reduced = true;
  const b = { v: 0 };
  animate(b, { v: 5, duration: 900 });
  assert.equal(b.v, 5, 'préférence système respectée en mode auto');
  globalThis.__reduced = false;
  engine.tick(200);
  await a;
});

test('échelle de temps globale', () => {
  const o = { v: 0 };
  engine.timeScale = 0.5;
  animate(o, { v: 100, duration: 100, ease: 'linear' });
  engine.tick(100);
  assert.equal(o.v, 50);
  engine.timeScale = 1;
  engine.tick(100);
  assert.equal(o.v, 100);
});

test('engine.onFrame : rappel à chaque image, arrêt possible', () => {
  const deltas = [];
  const stop = engine.onFrame((dt) => deltas.push(dt));
  engine.tick(16);
  engine.tick(20);
  stop();
  engine.tick(16);
  assert.deepEqual(deltas, [16, 20]);
});

test('ease : fonction (t) => v ou fonction (el, i) qui choisit une courbe par cible', () => {
  const o = { v: 0 };
  animate(o, { v: 100, duration: 100, ease: (t) => t * t });
  engine.tick(50);
  assert.equal(o.v, 25);
  const list = [{ v: 0 }, { v: 0 }];
  animate(list, { v: 100, duration: 100, ease: (el, i) => (i ? 'linear' : 'inQuad') });
  engine.tick(50);
  assert.deepEqual(list.map((x) => x.v), [25, 50]);
  const q = { v: 0 };
  animate(q, { v: { to: 100, ease: (t) => t * t * t }, duration: 100 });
  engine.tick(50);
  assert.equal(q.v, 12.5);
});

test('composition : une animation entièrement reprise quitte la boucle', () => {
  const o = { v: 0 };
  const a = animate(o, { v: 100, duration: 1000 });
  engine.tick(10);
  animate(o, { v: 0, duration: 100 });
  assert.ok(a.paused);
});
