import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand, parseDuration, extractWake, extractCity, readNumber, normalize } from '../../js/core/commands.js';

const intent = (s) => parseCommand(s).intent;

test('mot d’éveil et transcriptions approximatives', () => {
  for (const s of ['Jarvis, ouvre la galerie', 'jarvis ouvre la galerie', 'OK Jarvis : ouvre la galerie', 'Gervais ouvre la galerie', 'Jarvice, ouvre la galerie']) {
    const w = extractWake(s);
    assert.equal(w.woke, true, s);
    assert.equal(normalize(w.rest), 'ouvre la galerie', s);
  }
  assert.equal(extractWake('ouvre la galerie').woke, false);
  assert.equal(parseCommand('Jarvis').intent, 'wake-only');
});

test('nombres en lettres', () => {
  const n = (s) => readNumber(normalize(s).split(' '), 0).value;
  assert.equal(n('cinq'), 5);
  assert.equal(n('vingt et une'), 21);
  assert.equal(n('soixante dix'), 70);
  assert.equal(n('quatre-vingt-dix'), 90);
  assert.equal(n('quatre vingt douze'), 92);
  assert.equal(n('deux cent cinquante'), 250);
  assert.equal(n('12'), 12);
});

test('durées', () => {
  assert.equal(parseDuration('minuterie de 5 minutes'), 300);
  assert.equal(parseDuration('minuterie de cinq minutes'), 300);
  assert.equal(parseDuration('1 minute 30'), 90);
  assert.equal(parseDuration('deux minutes et demie'), 150);
  assert.equal(parseDuration('compte à rebours de 45 secondes'), 45);
  assert.equal(parseDuration('une demi-heure'), 1800);
  assert.equal(parseDuration('un quart d’heure'), 900);
  assert.equal(parseDuration('une heure et quart'), 4500);
  assert.equal(parseDuration('2 h 15'), 8100);
  assert.equal(parseDuration('quatre-vingt-dix secondes'), 90);
  assert.equal(parseDuration('1,5 minute'), 90);
  assert.equal(parseDuration('ouvre la galerie'), 0);
});

test('intentions principales du brief', () => {
  assert.deepEqual(parseCommand('Jarvis, ouvre la galerie').params, { mode: 'galerie' });
  assert.equal(intent('ouvre la galerie'), 'open-mode');
  assert.deepEqual(parseCommand('mode dessin').params, { mode: 'dessin' });
  assert.deepEqual(parseCommand('affiche l’hologramme').params, { mode: 'holo' });
  assert.equal(intent('envoie la photo'), 'send-photo');
  assert.equal(intent('Jarvis, envoie-la'), 'send-photo');
  assert.equal(intent('quelle heure est-il ?'), 'time');
  assert.equal(intent('Jarvis quelle heure est-il'), 'time');
  assert.equal(intent('on est quel jour ?'), 'date');
  const w = parseCommand('météo à Toulouse');
  assert.equal(w.intent, 'weather');
  assert.equal(w.params.city, 'Toulouse');
  const t = parseCommand('Jarvis, minuterie de 5 minutes');
  assert.equal(t.intent, 'timer');
  assert.equal(t.params.seconds, 300);
  assert.equal(intent('mets un minuteur de trois minutes pour les pâtes'), 'timer');
  assert.equal(parseCommand('mets un minuteur de trois minutes pour les pâtes').params.label, 'pâtes');
  assert.equal(intent('rappelle-moi dans dix minutes'), 'timer');
  assert.equal(intent('annule la minuterie'), 'timer-cancel');
  assert.equal(intent('prends une capture'), 'capture');
  assert.equal(intent('prends une photo'), 'capture');
  assert.equal(intent('mode veille'), 'sleep');
  assert.equal(intent('Jarvis, réveille-toi'), 'wake');
});

test('autres intentions', () => {
  assert.equal(intent('photo suivante'), 'next');
  assert.equal(intent('précédente'), 'prev');
  assert.equal(intent('ajoute aux favoris'), 'favorite');
  assert.equal(intent('efface tout'), 'clear-drawing');
  assert.equal(intent('enregistre le dessin'), 'export-drawing');
  assert.equal(intent('plein écran'), 'fullscreen');
  assert.equal(intent('coupe le son'), 'mute');
  assert.equal(intent('active le son'), 'unmute');
  assert.equal(intent('que sais-tu faire ?'), 'help');
  assert.equal(intent('bonjour'), 'hello');
  assert.equal(intent('merci'), 'thanks');
  assert.equal(intent('qui es-tu ?'), 'who');
  assert.equal(intent('coupe la caméra'), 'camera-off');
  assert.deepEqual(parseCommand('ouvre les réglages').params, { mode: 'reglages' });
  assert.deepEqual(parseCommand('connecter un appareil').params, { mode: 'liaison' });
});

test('les questions libres ne sont pas détournées vers une commande', () => {
  for (const q of [
    'quelle est la taille de la terre et de la lune comparée au soleil',
    "qu'est-ce qui s'est passé avant la révolution française",
    "j'aime le jazz, que me conseilles-tu d'écouter",
    'explique-moi la relativité générale simplement',
    'lance la musique de mon enfance et raconte une histoire',
  ]) {
    assert.equal(intent(q), 'unknown', q);
  }
});

test('ville de la météo : accents, tirets, mots de temps', () => {
  assert.equal(extractCity('quel temps fait-il à Saint-Étienne ?'), 'Saint-Étienne');
  assert.equal(extractCity('météo de paris demain'), 'Paris');
  assert.equal(extractCity('météo à aix en provence'), 'Aix en Provence');
  assert.equal(extractCity('la météo aujourd’hui'), null);
  assert.equal(parseCommand('quel temps fait-il ?').params.city, null);
});
