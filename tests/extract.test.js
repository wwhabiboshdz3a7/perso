import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, makeCards, makeQuiz, expandAcronym } from '../js/extract.js';
import { SAMPLES } from '../js/samples.js';

const get = (id) => analyze(SAMPLES.find((s) => s.id === id).text);

test('plan, titre et définitions', () => {
  const a = get('revolution');
  assert.equal(a.title, 'La Révolution française (1789-1799)');
  assert.equal(a.sections.filter((s) => s.heading).length, 4);
  const terms = a.definitions.map((d) => d.term);
  for (const t of ['Tiers état', 'États généraux', 'Monarchie constitutionnelle', 'Sans-culottes', 'Terreur', 'Directoire']) assert.ok(terms.includes(t), t);
});

test('pas de fausses définitions', () => {
  const terms = get('photosynthese').definitions.map((d) => d.term.toLowerCase());
  assert.ok(terms.includes('photosynthèse'), 'mot accentué reconnu');
  assert.ok(!terms.some((t) => /glucose|bilan|phase photochimique/.test(t)), terms.join(', '));
});

test('dates triées, sans doublon avec les définitions', () => {
  const d = get('revolution').dates;
  assert.ok(d.length >= 10);
  assert.deepEqual(d.map((x) => x.year), [...d.map((x) => x.year)].sort((x, y) => x - y));
  assert.ok(d.some((x) => x.label === '14 juillet 1789'));
  assert.ok(!d.some((x) => /^Le Directoire est/.test(x.text)));
});

test('formules, équations, listes et sigles', () => {
  const m = get('mecanique');
  assert.deepEqual(m.formulas.map((f) => f.formula), ['v = d / t', 'P = m × g', 'Ec = ½ × m × v²', 'Epp = m × g × h', 'Em = Ec + Epp']);
  assert.equal(m.lists[0].items.length, 5);
  const p = get('photosynthese');
  assert.match(p.formulas[0].formula, /→/);
  assert.equal(p.acronyms.find((x) => x.abbr === 'ATP').full, 'adénosine triphosphate');
  assert.equal(get('revolution').acronyms[0].full, 'Déclaration des droits de l\'homme et du citoyen');
  assert.equal(expandAcronym('Les unités du Système international', 'SI'), 'Système international');
});

test('cartes et quiz', () => {
  const a = get('revolution');
  const cards = makeCards(a);
  assert.ok(cards.length >= 15);
  assert.ok(cards.every((c) => c.q && c.a));
  const quiz = makeQuiz(a, () => 0.42);
  assert.equal(quiz.length, a.definitions.length);
  for (const q of quiz) { assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4); assert.ok(q.options[q.answer]); }
});

test('texte libre sans structure', () => {
  const a = analyze('La mitochondrie est l’organite qui produit l’énergie de la cellule. Le noyau contient l’ADN. En 1953, Watson et Crick décrivent la double hélice.');
  assert.ok(a.definitions.length >= 1);
  assert.equal(a.dates[0].year, 1953);
});
