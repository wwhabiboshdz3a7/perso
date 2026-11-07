import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMath, parseConvert, parseClock, parseDaysUntil, nextOccurrence, formatNumber } from '../../js/core/local.js';
import { parseCommand, setWakeWord, extractWake, parseShortcuts, commandCore, normalize } from '../../js/core/commands.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('calculs dictés', () => {
  assert.equal(parseMath('combien font 12 fois 8').value, 96);
  assert.equal(parseMath('racine carrée de 144').value, 12);
  assert.equal(parseMath('15 % de 80').value, 12);
  assert.equal(parseMath('(3 + 4) × 2').value, 14);
  assert.equal(parseMath('2 + 3 * 4').value, 14);
  assert.equal(parseMath('combien font vingt et un plus deux').value, 23);
  assert.equal(parseMath('calcule 2 puissance 10').value, 1024);
  assert.equal(parseMath('7 au carré').value, 49);
  assert.equal(parseMath('combien font -3 + 5').value, 2);
  close(parseMath('10 divisé par 4').value, 2.5);
  close(parseMath('1,5 fois 2').value, 3);
});

test('pas un calcul', () => {
  for (const s of ['ouvre la galerie', 'minuterie de 5 minutes', '2', 'photo suivante', 'mode 3d', 'combien font 3 divisé par 0']) {
    assert.equal(parseMath(s), null, s);
  }
});

test('conversions', () => {
  close(parseConvert('convertis 10 km en miles').result, 6.2137119, 1e-6);
  assert.equal(parseConvert('30 degrés en fahrenheit').result, 86);
  close(parseConvert('combien de livres dans 2 kilos').result, 4.4092452, 1e-6);
  close(parseConvert('100 mph en km/h').result, 160.9344, 1e-6);
  assert.equal(parseConvert('2 heures en minutes').result, 120);
  assert.equal(parseConvert('ouvre la galerie'), null);
  assert.equal(parseConvert('10 km en kilos'), null);
});

test('heure d’une alarme', () => {
  assert.deepEqual(parseClock(normalize('réveille-moi à 7h30')), { h: 7, m: 30 });
  assert.deepEqual(parseClock(normalize('alarme à 18 heures')), { h: 18, m: 0 });
  assert.deepEqual(parseClock(normalize('à midi')), { h: 12, m: 0 });
  assert.deepEqual(parseClock(normalize('à 7 heures et demie')), { h: 7, m: 30 });
  assert.deepEqual(parseClock(normalize('à 8 heures moins le quart')), { h: 7, m: 45 });
  assert.deepEqual(parseClock(normalize('à 6 heures du soir')), { h: 18, m: 0 });
  assert.equal(parseClock(normalize('à 25 heures')), null);
  const now = new Date(2026, 10, 7, 13, 0);
  assert.equal(nextOccurrence({ h: 7, m: 30 }, now).getDate(), 8);
  assert.equal(nextOccurrence({ h: 18, m: 0 }, now).getDate(), 7);
});

test('jours restants', () => {
  const now = new Date(2026, 10, 7, 9);
  assert.equal(parseDaysUntil(normalize('combien de jours avant Noël'), now).days, 48);
  assert.equal(parseDaysUntil(normalize('combien de jours jusqu’au 1er janvier'), now).days, 55);
  assert.equal(parseDaysUntil(normalize('combien de jours avant Pâques'), now).date.getMonth(), 2); // 28 mars 2027
  assert.equal(parseDaysUntil(normalize('quel temps fait-il'), now), null);
});

test('intentions locales', () => {
  const i = (s) => parseCommand(s).intent;
  assert.equal(i('Jarvis, combien font 12 fois 8 ?'), 'calc');
  assert.equal(i('note : acheter du pain'), 'note-add');
  assert.equal(parseCommand('note : acheter du pain').params.text, 'acheter du pain');
  assert.equal(i('lis mes notes'), 'note-list');
  assert.equal(i('efface mes notes'), 'note-clear');
  assert.equal(i('réveille-moi à 7 h 30'), 'alarm');
  assert.equal(i('rappelle-moi dans 10 minutes'), 'timer');
  assert.equal(i('lance le chrono'), 'chrono-start');
  assert.equal(i('arrête le chrono'), 'chrono-stop');
  assert.equal(i('pile ou face'), 'coin');
  assert.equal(parseCommand('lance trois dés').params.count, 3);
  assert.equal(i('raconte-moi une blague'), 'joke');
  assert.equal(i('thème rouge'), 'theme');
  assert.equal(parseCommand('change de thème').params.theme, 'next');
  assert.equal(parseCommand('appelle-toi Friday').params.name, 'Friday');
  assert.equal(parseCommand('lance le jeu').params.mode, 'arcade');
  assert.equal(parseCommand('cherche la tour Eiffel sur YouTube').params.on, 'youtube');
  assert.equal(i('rapport'), 'status');
  // Les commandes existantes ne changent pas.
  assert.equal(i('quelle heure est-il'), 'time');
  assert.equal(i('minuterie de 5 minutes'), 'timer');
  assert.equal(i('pourquoi le ciel est bleu ?'), 'unknown');
  assert.equal(i('ouvre la galerie'), 'open-mode');
});

test('mot d’éveil personnalisé', () => {
  setWakeWord('Friday');
  assert.deepEqual(extractWake('Friday, ouvre la galerie'), { woke: true, rest: 'ouvre la galerie' });
  assert.equal(extractWake('jarvis rapport').woke, true); // « Jarvis » reste reconnu
  setWakeWord('Hélène');
  assert.equal(extractWake('helene, quelle heure').woke, true);
  assert.equal(extractWake('Hélène quelle heure').rest, 'quelle heure');
  setWakeWord('JARVIS');
  assert.equal(extractWake('helene, quelle heure').woke, false);
});

test('raccourcis personnels', () => {
  const sc = parseShortcuts('mode présentation = plein écran ; affiche l’hologramme ; "C’est parti."\nligne invalide\n= rien');
  assert.equal(sc.length, 1);
  assert.equal(sc[0].key, 'mode presentation');
  assert.equal(sc[0].actions.length, 3);
  assert.equal(commandCore('Jarvis, mode présentation s’il te plaît'), 'mode presentation');
});

test('format des nombres', () => {
  assert.equal(formatNumber(1234.5), '1 234,5');
  assert.equal(formatNumber(0.125), '0,125');
});
