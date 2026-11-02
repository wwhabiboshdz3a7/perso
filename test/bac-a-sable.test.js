import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { protectLoops, syntaxError, buildDoc, GUARD } from '../site/sandbox-doc.js';

// Exécute du code instrumenté avec une garde qui s'arrête après `max` tours.
function runGuarded(code, max = 1000) {
  let turns = 0;
  const ctx = { [GUARD]: () => { if (++turns > max) throw new RangeError('boucle interrompue'); return true; }, out: [] };
  vm.runInNewContext(protectLoops(code), ctx);
  return { turns, out: ctx.out };
}

test('bac à sable : les boucles infinies sont interrompues (for, while, do…while, for…of)', () => {
  for (const code of [
    'let i = 0; while (i < 3) {}',
    'for (;;) {}',
    'for (let i = 0; i >= 0; i++) {}',
    'do { } while (true);',
    'const a = [1]; for (const x of a) { a.push(x); }',
    'while (true) out.push(1)',
    'label: for (let i = 0; ; i++) { if (i < 0) break label; }',
  ]) {
    assert.throws(() => runGuarded(code), /boucle interrompue/, code);
  }
});

test('bac à sable : le code instrumenté garde son sens et ses numéros de ligne', () => {
  const code = [
    'const s = "for (;;) {}"; // for (;;)',
    'const t = `while (x) ${ [1, 2].map((v) => v * 2).join("") }`;',
    'const r = /while\\(/g; let n = 0;',
    'for (let i = 0, j = 10; i < j; i++, j--) n++;',
    'let k = 0; while (k < 4) k++;',
    'const o = { for: 1, while: 2 }; o.while = 3;',
    'for (const key in o) out.push(key);',
    'out.push(s, t, r.source, n, k, o.while);',
  ].join('\n');
  const guarded = protectLoops(code);
  assert.equal(guarded.split('\n').length, code.split('\n').length);
  assert.match(guarded, /const s = "for \(;;\) \{\}";/);
  const { out } = runGuarded(code);
  assert.deepEqual(out, ['for', 'while', 'for (;;) {}', 'while (x) 24', 'while\\(', 5, 4, 3]);
});

test('bac à sable : contrôle de syntaxe avant la relance automatique', () => {
  assert.equal(syntaxError("import { animate } from 'kinetika';\nanimate('.a', { x: 10 });"), null);
  assert.equal(syntaxError("import {\n  animate,\n  stagger,\n} from 'kinetika';\nawait animate({ v: 0 }, { v: 1 });"), null);
  assert.notEqual(syntaxError('let i = 0;\nwhile (i < 3) {'), null);
  assert.notEqual(syntaxError('animate(".a", { x: 10 '), null);
});

test('bac à sable : document d’aperçu (garde, pont console, scripts du HTML protégés)', () => {
  const doc = buildDoc({ js: 'for (;;) {}', html: '<script>while (true) {}</script><p>ok</p>', css: 'p { color: red }' }, { lib: 'data:text/javascript,' });
  assert.match(doc, /"kinetika": "data:text\/javascript,"/);
  assert.match(doc, new RegExp(`for \\(;${GUARD}\\(1,1\\);\\)`));
  assert.match(doc, new RegExp(`while \\(${GUARD}\\(1,1\\)&&\\(true\\)\\)`));
  assert.match(doc, /parent\.postMessage/);
  const plain = buildDoc({ js: 'for (;;) {}', html: '', css: '' }, { protect: false, bridge: false });
  assert.doesNotMatch(plain, new RegExp(GUARD));
  assert.doesNotMatch(plain, /postMessage/);
});
