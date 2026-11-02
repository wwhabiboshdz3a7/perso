import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, html } from './_dom.js';

const { splitText, scramble, typewriter, odometer, engine, animate, stagger } = await load();
const flushMicro = () => new Promise((r) => setTimeout(r, 0));

test('splitText : mots et lettres, accessibilité, revert()', () => {
  const box = html('<h1 id="t">Bonjour le monde</h1>');
  const el = box.firstChild;
  const before = el.innerHTML;
  const s = splitText(el, { chars: true, words: true });
  assert.equal(s.words.length, 3);
  assert.equal(s.chars.length, 14);
  assert.equal(el.getAttribute('aria-label'), 'Bonjour le monde');
  assert.ok(s.words.every((w) => w.getAttribute('aria-hidden') === 'true'));
  assert.equal(el.textContent, 'Bonjour le monde');
  assert.ok(s.chars.every((c) => c.classList.contains('kt-char')));
  s.revert();
  assert.equal(el.innerHTML, before);
  assert.equal(el.hasAttribute('aria-label'), false);
  box.remove();
});

test('splitText : graphèmes (accents composés, émojis) et éléments imbriqués', () => {
  const box = html('<p>Été <em>déjà</em> 👋🏽</p>');
  const el = box.firstChild;
  const s = splitText(el, { chars: true });
  assert.deepEqual(s.chars.map((c) => c.textContent), ['É', 't', 'é', 'd', 'é', 'j', 'à', '👋🏽']);
  assert.ok(el.querySelector('em .kt-word'), 'l’élément em est conservé');
  s.revert();
  assert.equal(el.innerHTML, 'Été <em>déjà</em> 👋🏽');
  box.remove();
});

test('splitText : lignes et masques', () => {
  const box = html('<p>Une ligne<br>Deux lignes</p>');
  const el = box.firstChild;
  const s = splitText(el, { lines: true, words: true, chars: false, mask: 'lines' });
  assert.equal(s.lines.length, 2);
  assert.equal(s.masks.length, 2);
  assert.equal(s.lines[0].textContent, 'Une ligne');
  assert.equal(s.masks[0].style.overflow, 'clip');
  assert.equal(s.chars.length, 0);
  s.revert();
  box.remove();
});

test('splitText : lignes mesurées sur les mots, même dans un élément en ligne', () => {
  // jsdom ne calcule pas la mise en page : on simule les positions verticales.
  const tops = { un: 0, deux: 4, trois: 40, quatre: 41 };
  const proto = window.HTMLElement.prototype;
  const original = proto.getBoundingClientRect;
  proto.getBoundingClientRect = function () {
    const key = this.textContent.trim();
    const top = key in tops ? tops[key] : -6; // un <em> en ligne commence plus haut que ses mots
    return { top, height: 30, left: 0, width: 10, right: 10, bottom: top + 30, x: 0, y: top };
  };
  try {
    const box = html('<p>un <em>deux</em> trois quatre</p>');
    const s = splitText(box.firstChild, { lines: true, words: true, chars: false });
    assert.deepEqual(s.lines.map((l) => l.textContent.trim()), ['un deux', 'trois quatre']);
    s.revert();
    box.remove();
  } finally {
    proto.getBoundingClientRect = original;
  }
});

test('splitText + stagger dans une animation', () => {
  const box = html('<h2>ABC</h2>');
  const s = splitText(box.firstChild, { chars: true });
  animate(s.chars, { y: [20, 0], delay: stagger(100), duration: 100, ease: 'linear' });
  assert.ok(s.chars.every((c) => c.style.transform === 'translateY(20px)'));
  engine.tick(150);
  assert.equal(s.chars[0].style.transform, '');
  assert.equal(s.chars[1].style.transform, 'translateY(10px)');
  engine.tick(300);
  box.remove();
});

test('scramble : texte final garanti et nom accessible stable', async () => {
  const box = html('<p>xxxx</p>');
  const el = box.firstChild;
  const a = scramble(el, { text: 'SENS', duration: 400 });
  assert.equal(el.getAttribute('aria-label'), 'SENS');
  engine.tick(200);
  assert.equal(el.textContent.length, 4);
  engine.tick(300);
  assert.equal(el.textContent, 'SENS');
  await a;
  box.remove();
});

test('typewriter : frappe progressive puis curseur', async () => {
  const box = html('<p></p>');
  const el = box.firstChild;
  const tl = typewriter(el, { text: 'Salut', speed: 10 });
  await flushMicro();
  engine.tick(250);
  assert.ok(el.textContent.startsWith('Sa'), el.textContent);
  engine.tick(400);
  assert.equal(el.firstChild.data, 'Salut');
  assert.ok(el.querySelector('.kt-caret'));
  assert.equal(el.getAttribute('aria-label'), 'Salut');
  tl.blink.pause();
  box.remove();
});

test('odometer : rouleaux par chiffre, séparateurs conservés, état final', async () => {
  const box = html('<div></div>');
  const el = box.firstChild;
  const od = odometer(el, { value: '12,5', duration: 100, stagger: 0, autoplay: false });
  assert.equal(el.getAttribute('aria-label'), '00,0');
  const wins = el.querySelectorAll('.kt-odo-win');
  assert.equal(wins.length, 3);
  assert.equal(el.querySelector('.kt-odo-sep').textContent, ',');
  od.set('12,5', { autoplay: false });
  assert.equal(el.getAttribute('aria-label'), '12,5');
  od.animation.complete();
  const strips = [...el.querySelectorAll('.kt-odo-strip')];
  // chiffre 5 sur une bande de 20 (1 tour) : ≥ 10 + 5
  const pos = strips.map((s) => parseFloat(s.style.transform.match(/-?[\d.]+/)[0]));
  assert.ok(pos.every((p) => p < 0));
  const tl = od.set('47,0', { duration: 50 });
  await flushMicro();
  engine.tick(200);
  assert.ok(tl.completed);
  assert.equal(od.value, '47,0');
  box.remove();
});

test('mouvement réduit : effets texte directement à l’état final', () => {
  engine.reducedMotion = true;
  const box = html('<p>abc</p><p></p>');
  const [p1] = box.children;
  scramble(p1, { text: 'FIN' });
  assert.equal(p1.textContent, 'FIN');
  engine.reducedMotion = 'auto';
  box.remove();
});

test('typewriter en boucle : en mouvement réduit, la première phrase reste affichée', async () => {
  engine.reducedMotion = true;
  const box = html('<p></p>');
  const el = box.firstChild;
  typewriter(el, { text: ['Un', 'Deux'] });
  await flushMicro();
  assert.equal(el.firstChild.data, 'Un');
  engine.reducedMotion = 'auto';
  box.remove();
});
