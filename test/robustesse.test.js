import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, html } from './_dom.js';

const { animate, timeline, engine, parseEase, splitText, scramble, typewriter, odometer } = await load();
const { ownerOf } = await import('../src/animation.js');
const flushMicro = () => new Promise((r) => setTimeout(r, 0));

/** Remplace console.error / console.warn le temps d'un test. */
function silence(kind, fn) {
  const orig = console[kind];
  const seen = [];
  console[kind] = (...a) => seen.push(a);
  try { return { result: fn(), seen }; } finally { console[kind] = orig; }
}

test('moteur : une exception dans un rappel n’arrête que son animation', async () => {
  const good = { v: 0 };
  const sane = animate(good, { v: 100, duration: 300, ease: 'linear' });
  let n = 0;
  const bad = animate({ w: 0 }, { w: 1, duration: 300, onUpdate: () => { if (++n > 1) throw new Error('bug utilisateur'); } });
  const rejected = bad.then(() => 'résolue', (e) => e.message);
  const { seen } = silence('error', () => { for (let i = 0; i < 25; i++) engine.tick(16); });
  assert.equal(seen.length, 1, 'l’erreur est signalée une seule fois');
  assert.equal(good.v, 100);
  assert.equal(sane.completed, true);
  assert.equal(bad.paused, true);
  assert.equal(await rejected, 'bug utilisateur');
  // une nouvelle animation fonctionne toujours
  const o = { v: 0 };
  animate(o, { v: 10, duration: 50, ease: 'linear' });
  engine.tick(60);
  assert.equal(o.v, 10);
});

test('moteur : une exception dès le premier rendu (dans animate()) n’échappe pas et n’arrête rien', async () => {
  const good = { v: 0 };
  animate(good, { v: 100, duration: 200, ease: 'linear' });
  const { result: bad, seen } = silence('error', () => animate({ w: 0 }, { w: 1, duration: 300, onUpdate: () => { throw new Error('dès le départ'); } }));
  assert.equal(seen.length, 1, 'l’erreur est signalée');
  assert.equal(bad.paused, true);
  assert.equal(await bad.then(() => 'résolue', (e) => e.message), 'dès le départ');
  for (let i = 0; i < 15; i++) engine.tick(16);
  assert.equal(good.v, 100);
});

test('moteur : une exception dans engine.onFrame retire seulement ce rappel', () => {
  let calls = 0;
  const stop = engine.onFrame(() => { calls++; throw new Error('image'); });
  const o = { v: 0 };
  animate(o, { v: 1, duration: 32, ease: 'linear' });
  silence('error', () => { engine.tick(16); engine.tick(16); engine.tick(16); });
  assert.equal(calls, 1);
  assert.equal(o.v, 1);
  stop();
});

test('cibles : nombres et booléens ignorés comme un sélecteur sans résultat', () => {
  const o = { v: 0 };
  const { seen } = silence('error', () => {
    animate([5, true, o], { v: 10, duration: 32, ease: 'linear' });
    animate(5, { x: 10, duration: 32 });
    engine.tick(16); engine.tick(16); engine.tick(16);
  });
  assert.deepEqual(seen, []);
  assert.equal(o.v, 10);
});

test('composition : la promesse d’une animation entièrement reprise se résout', async () => {
  const o = { v: 0 };
  const first = animate(o, { v: 100, duration: 300 });
  engine.tick(50);
  let done = false;
  first.then(() => { done = true; });
  animate(o, { v: -100, duration: 100 });
  engine.tick(16);
  await flushMicro();
  assert.equal(done, true);
  assert.equal(first.interrupted, true);
  assert.equal(first.completed, false);
  engine.tick(200);
  assert.equal(o.v, -100);
});

test('composition : la propriété appartient à la dernière animation, libérée par revert()', () => {
  const el = html('<i></i>').firstChild;
  const a = animate(el, { x: 10, duration: 100 });
  engine.tick(16);
  assert.equal(ownerOf(el, 'x').anim, a);
  const b = animate(el, { x: 20, duration: 100 });
  engine.tick(16);
  assert.equal(ownerOf(el, 'x').anim, b);
  b.revert();
  assert.equal(ownerOf(el, 'x'), undefined);
  el.parentNode.remove();
});

test('valeurs relatives : l’écart est converti dans l’unité de départ', () => {
  const box = html('<div style="font-size:16px"><i></i><b></b><u></u></div>');
  const [i, b, u] = box.firstChild.children;
  i.style.transform = 'rotate(90deg)';
  animate(i, { rotate: '-=1turn', duration: 100, ease: 'linear' });
  b.style.transform = 'rotate(0.5turn)';
  animate(b, { rotate: '+=90', duration: 100, ease: 'linear' });
  u.style.transform = 'translateX(10px)';
  animate(u, { x: '+=2rem', duration: 100, ease: 'linear' });
  const o = { v: 10 };
  animate(o, { v: '*=3', duration: 100, ease: 'linear' });
  engine.tick(120);
  assert.equal(i.style.transform, 'rotate(-270deg)');
  assert.equal(b.style.transform, 'rotate(0.75turn)');
  assert.equal(u.style.transform, 'translateX(42px)');
  assert.equal(o.v, 30);
  box.remove();
});

test('couleurs : les 148 noms CSS sont interpolés (rebeccapurple, darkorange)', () => {
  const el = html('<p></p>').firstChild;
  const a = animate(el, { color: ['red', 'rebeccapurple'], duration: 100, ease: 'linear', autoplay: false });
  a.seek(50);
  const mid = el.style.color;
  assert.notEqual(mid, 'rgb(255, 0, 0)');
  assert.notEqual(mid, 'rebeccapurple');
  assert.match(mid, /^rgb\(\d+, \d+, \d+\)$/);
  a.seek(100);
  assert.equal(el.style.color, 'rgb(102, 51, 153)');
  const c = animate(el, { backgroundColor: ['white', 'darkorange'], duration: 100, ease: 'linear', autoplay: false });
  c.seek(100);
  assert.equal(el.style.backgroundColor, 'rgb(255, 140, 0)');
  el.parentNode.remove();
});

test('timeline : libellés contenant « - » ou « + », décalages, libellé inconnu', () => {
  const tl = timeline({ autoplay: false });
  tl.add({ a: 0 }, { a: 1, duration: 1000 });
  tl.label('intro-fin', 300).label('étape+1', 400);
  const starts = (pos) => { const before = new Set(tl.children.map((c) => c.animation)); tl.add({ b: 0 }, { b: 1, duration: 10 }, pos); return tl.children.find((c) => !before.has(c.animation)).start; };
  assert.equal(starts('intro-fin'), 300);
  assert.equal(starts('intro-fin+=50'), 350);
  assert.equal(starts('intro-fin-=100'), 200);
  assert.equal(starts('étape+1'), 400);
  const { result, seen } = silence('warn', () => starts('inconnu'));
  assert.equal(result, 1000, 'un libellé inconnu place l’enfant en fin de timeline');
  assert.equal(seen.length, 1);
  tl.seek(500);
  silence('warn', () => tl.seek('nulle-part'));
  assert.equal(tl.currentTime, 500, 'seek() vers un libellé inconnu ne bouge pas');
  tl.seek('intro-fin');
  assert.equal(tl.currentTime, 300);
});

test('easings : paramètres invalides → valeurs par défaut, jamais NaN', () => {
  const s = parseEase('spring(a, b)');
  assert.ok(Number.isFinite(s(0.5)));
  assert.equal(s.duration, parseEase('spring()').duration);
  assert.ok(Number.isFinite(parseEase('outElastic(x, .5)')(0.5)));
  const o = { v: 0 };
  animate(o, { v: 100, ease: 'spring(a, b)' });
  engine.tick(200);
  assert.ok(Number.isFinite(o.v));
});

test('splitText : un second découpage rétablit d’abord l’original', () => {
  const box = html('<p>Bonjour le <em>monde</em> entier</p>');
  const el = box.firstChild;
  const before = el.innerHTML;
  const a = splitText(el, { chars: true });
  const b = splitText(el, { chars: true });
  assert.equal(a.chars.length, 0, 'le premier découpage a été annulé');
  assert.equal(b.chars.length, 20);
  assert.equal(el.querySelectorAll('.kt-sr').length, 1);
  assert.ok(el.hasAttribute('data-kt-split'));
  b.revert();
  assert.equal(el.innerHTML, before);
  assert.equal(el.hasAttribute('data-kt-split'), false);
  box.remove();
});

test('splitText : un lien reste focalisable, nommé, et jamais sous aria-hidden', () => {
  const box = html('<p>Voir <a href="#x">la doc complète</a> ici</p>');
  const el = box.firstChild;
  const s = splitText(el, { words: true, chars: true, lines: true });
  const a = el.querySelector('a[href]');
  assert.equal(a.getAttribute('aria-label'), 'la doc complète');
  assert.equal(a.closest('[aria-hidden="true"]'), null);
  assert.ok(a.querySelector('.kt-word[aria-hidden="true"]'));
  assert.equal(s.lines.length, 1);
  s.revert();
  assert.equal(el.innerHTML, 'Voir <a href="#x">la doc complète</a> ici');
  box.remove();
});

test('splitText : lignes, les éléments en ligne sont conservés dans la ligne', () => {
  const box = html('<p>Un <strong>texte <em>très</em> fort</strong> ici</p>');
  const el = box.firstChild;
  const s = splitText(el, { lines: true, words: true, chars: false });
  assert.equal(s.lines.length, 1);
  const line = s.lines[0];
  assert.equal(line.querySelector('strong em .kt-word').textContent, 'très');
  assert.equal(line.textContent, 'Un texte très fort ici');
  s.revert();
  box.remove();
});

test('copie masquée .kt-sr : non sélectionnable (pas de texte collé en double)', () => {
  const box = html('<p>Bonjour</p>');
  splitText(box.firstChild, { chars: true });
  const sr = box.querySelector('.kt-sr');
  assert.match(sr.getAttribute('style'), /user-select:\s*none/);
  box.remove();
});

test('typewriter.revert() : contenu d’origine rétabli, curseur arrêté', async () => {
  const box = html('<p>Bonjour <em>à tous</em></p>');
  const el = box.firstChild;
  const tw = typewriter(el, { text: 'Salut' });
  await flushMicro();
  for (let i = 0; i < 40; i++) engine.tick(16);
  assert.equal(tw.blink.paused, false);
  tw.revert();
  assert.equal(el.innerHTML, 'Bonjour <em>à tous</em>');
  assert.equal(tw.blink.paused, true);
  // une seconde machine à écrire sur le même élément arrête la première
  const t1 = typewriter(el, { text: 'Un' });
  const t2 = typewriter(el, { text: 'Deux' });
  assert.equal(t1.blink.paused, true);
  t2.revert();
  assert.equal(el.innerHTML, 'Bonjour <em>à tous</em>');
  box.remove();
});

test('scramble.revert() : balises et nom accessible d’origine rétablis', () => {
  const box = html('<p>Bon<b>jour</b></p><h2>Titre</h2>');
  const [p, h2] = box.children;
  const s = scramble([p, h2], { text: 'Au revoir', duration: 100 });
  for (let i = 0; i < 10; i++) engine.tick(16);
  s.revert();
  assert.equal(p.innerHTML, 'Bon<b>jour</b>');
  assert.equal(h2.innerHTML, 'Titre');
  assert.equal(h2.hasAttribute('aria-label'), false);
  box.remove();
});

test('odometer : turns 0 va directement au chiffre, sans NaN', () => {
  const box = html('<span></span>');
  const o = odometer(box.firstChild, { value: 42, turns: 0, autoplay: false });
  const tl = o.set(57);
  tl.seek(tl.duration);
  const t = [...box.querySelectorAll('.kt-odo-strip')].map((s) => s.style.transform);
  assert.deepEqual(t, ['translateY(-50%)', 'translateY(-70%)']);
  box.remove();
});
