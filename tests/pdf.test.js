import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linesOf, pagesToText } from '../js/pdf.js';

const item = (str, x, y, size = 11, width = str.length * size * 0.5) => ({ str, transform: [size, 0, 0, size, x, y], width, height: size });

test('lignes reconstruites de gauche à droite, de haut en bas', () => {
  const l = linesOf([item('monde', 120, 700), item('Bonjour', 50, 700.6), item('Seconde ligne', 50, 680)]);
  assert.deepEqual(l.map((x) => x.text), ['Bonjour monde', 'Seconde ligne']);
});

test('titres, en-têtes répétés, numéros de page, coupures et listes', () => {
  const p1 = [
    { text: 'Lycée Exemple · SVT', size: 8 }, { text: 'La cellule', size: 26 }, { text: 'Les organites', size: 17 },
    { text: 'Le noyau est l’organite qui contient l’informa-', size: 11 }, { text: 'tion génétique.', size: 11 },
    { text: 'Les trois principes :', size: 11 }, { text: 'Tout être vivant est fait de cellules', size: 11 }, { text: 'Toute cellule provient d’une cellule', size: 11 },
    { text: '1', size: 8 },
  ];
  const p2 = [{ text: 'Lycée Exemple · SVT', size: 8 }, { text: 'Histoire', size: 17 }, { text: 'En 1665, Robert Hooke observe le liège.', size: 11 }, { text: '2', size: 8 }];
  const t = pagesToText([p1, p2]);
  assert.ok(!/Lycée Exemple/.test(t), 'en-tête retiré');
  assert.ok(!/^\d$/m.test(t), 'numéros de page retirés');
  assert.match(t, /^# La cellule$/m);
  assert.match(t, /^## Les organites$/m);
  assert.match(t, /l’information génétique\./);
  assert.match(t, /^- Tout être vivant est fait de cellules$/m);
  assert.match(t, /^- Toute cellule provient d’une cellule$/m);
  assert.match(t, /^## Histoire$/m);
});
