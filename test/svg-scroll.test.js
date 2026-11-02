import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, html } from './_dom.js';

const { drawable, motionPath, animate, onScroll, engine } = await load();
const flushMicro = () => new Promise((r) => setTimeout(r, 0));

test('drawable : tracé progressif via stroke-dasharray', () => {
  const box = html('<svg><path d="M0 0 L100 0" /></svg>');
  const path = box.querySelector('path');
  path.getTotalLength = () => 100;
  const [d] = drawable(path);
  animate(d, { draw: [0, 1], duration: 100, ease: 'linear' });
  assert.equal(path.style.strokeOpacity, '0');
  engine.tick(50);
  assert.equal(path.style.strokeDasharray, '50 101');
  assert.equal(path.style.strokeOpacity, '');
  engine.tick(60);
  assert.equal(path.style.strokeDasharray, '100 101');
  d.drawStart = 0.25;
  assert.equal(path.style.strokeDashoffset, '-25');
  d.revert();
  assert.equal(path.style.strokeDasharray, '');
  box.remove();
});

test('motionPath : x, y et angle le long du chemin (cible SVG)', () => {
  const box = html('<svg><path id="route" d="M0 0 L100 100" /><circle /></svg>');
  const path = box.querySelector('#route');
  path.getTotalLength = () => 100;
  path.getPointAtLength = (l) => ({ x: l, y: l });
  const dot = box.querySelector('circle');
  animate(dot, { ...motionPath(path), duration: 100, ease: 'linear' });
  engine.tick(50);
  assert.equal(dot.style.transform, 'translateX(50px) translateY(50px) rotate(45deg)');
  engine.tick(60);
  box.remove();
});

test('onScroll : progression liée au défilement (scrub) et déclenchement', async () => {
  const box = html('<section id="zone"></section>');
  const zone = box.firstChild;
  // jsdom n'a pas de mise en page : on simule les positions
  let scrollY = 0;
  Object.defineProperty(window, 'scrollY', { get: () => scrollY, configurable: true });
  zone.getBoundingClientRect = () => ({ top: 1000 - scrollY, left: 0, height: 500, width: 100 });
  const o = { v: 0 };
  animate(o, { v: 100, ease: 'linear', autoplay: onScroll({ target: zone, scrub: true }) });
  const events = [];
  const trig = { t: 0 };
  animate(trig, { t: 1, duration: 100, autoplay: onScroll({ target: zone, enter: 'top center', onEnter: () => events.push('enter') }) });
  await flushMicro();
  // début : haut de la zone (1000) au bas de l'écran (768) → 232 ; fin : bas de la zone au haut de l'écran → 1500
  assert.equal(o.v, 0);
  scrollY = 232 + (1500 - 232) / 2;
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(Math.round(o.v), 50);
  assert.deepEqual(events, ['enter']);
  engine.tick(200);
  assert.equal(trig.t, 1);
  scrollY = 5000;
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(o.v, 100);
  box.remove();
});
