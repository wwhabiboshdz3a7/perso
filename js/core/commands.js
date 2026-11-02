// Analyse des commandes vocales (ou tapées) en français : mot d'éveil,
// intentions, durées (« cinq minutes et demie »), ville pour la météo.
// Module pur, sans DOM.

const WAKE_RE = /(^|[\s,.;:!?«"'(])(d?jarv[iy]s+e?|jarvice|jarvi|jervis|gervais|jarwis|charvis)(?=$|[\s,.;:!?»"')-])[\s,.;:!?»"')-]*/i;

/** Minuscules, sans accents, ponctuation remplacée par des espaces. */
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d)\s*h\s*(\d{2})\b/g, '$1 heures $2')
    .replace(/[’'`]/g, ' ')
    .replace(/\.(?!\d)/g, ' ')
    .replace(/[^a-z0-9.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Détecte le mot d'éveil « Jarvis » (et ses transcriptions approximatives). */
export function extractWake(text) {
  const raw = String(text || '');
  const m = raw.match(WAKE_RE);
  if (!m) return { woke: false, rest: raw.trim() };
  const before = raw.slice(0, m.index + m[1].length);
  const after = raw.slice(m.index + m[0].length);
  // Ce qui précède le mot d'éveil (« dis jarvis », « ok jarvis ») est ignoré.
  void before;
  return { woke: true, rest: after.trim() };
}

const UNITS = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
  cent: 100, cents: 100, mille: 1000,
};

function isNumberToken(tok) {
  return tok in UNITS || /^\d+(\.\d+)?$/.test(tok);
}

/**
 * Lit un nombre à partir de tokens[i] (chiffres ou lettres).
 * @returns {{value:number, next:number}|null}
 */
export function readNumber(tokens, i) {
  const t0 = tokens[i];
  if (t0 === undefined) return null;
  if (/^\d+(\.\d+)?$/.test(t0)) return { value: parseFloat(t0), next: i + 1 };
  if (!(t0 in UNITS)) return null;
  let total = 0, current = 0, j = i, prev = null;
  while (j < tokens.length) {
    const tok = tokens[j];
    if (tok === 'et' && prev !== null && tokens[j + 1] in UNITS && tokens[j + 1] !== 'mille') { j++; continue; }
    if (!(tok in UNITS)) break;
    const v = UNITS[tok];
    if (v === 100) current = (current || 1) * 100;
    else if (v === 1000) { total += (current || 1) * 1000; current = 0; }
    else if (v === 20 && prev === 'quatre') current = current - 4 + 80;
    else current += v;
    prev = tok;
    j++;
  }
  return { value: total + current, next: j };
}

const UNIT_SECONDS = [
  [/^(heures?|h|hr)$/, 3600],
  [/^(minutes?|min|mins|mn|mn)$/, 60],
  [/^(secondes?|sec|secs|s)$/, 1],
];

function unitOf(tok) {
  if (!tok) return 0;
  for (const [re, s] of UNIT_SECONDS) if (re.test(tok)) return s;
  return 0;
}

/** Durée en secondes contenue dans une phrase normalisée, ou 0. */
export function parseDuration(text) {
  let s = ' ' + normalize(text) + ' ';
  s = s
    .replace(/ (une |un )?demi heure /g, ' 30 minutes ')
    .replace(/ (un )?quart d heure /g, ' 15 minutes ')
    .replace(/ trois quarts? d heure /g, ' 45 minutes ')
    .replace(/ (une |un )?demi minute /g, ' 30 secondes ');
  const tokens = s.trim().split(' ');
  let total = 0, lastUnit = 0, found = false;
  for (let i = 0; i < tokens.length; i++) {
    const n = readNumber(tokens, i);
    if (!n) continue;
    const u = unitOf(tokens[n.next]);
    if (u) {
      total += n.value * u;
      lastUnit = u;
      found = true;
      i = n.next;
      if (tokens[i + 1] === 'et' && /^demie?$/.test(tokens[i + 2] || '')) { total += u / 2; i += 2; }
      else if (tokens[i + 1] === 'et' && tokens[i + 2] === 'quart') { total += u / 4; i += 2; }
    } else if (lastUnit > 1) {
      // « 1 minute 30 », « 2 heures 15 » : unité inférieure implicite.
      total += n.value * (lastUnit === 3600 ? 60 : 1);
      i = n.next - 1;
    } else {
      i = n.next - 1;
    }
  }
  return found ? Math.round(total) : 0;
}

const TRAILING_TIME = /\s+(aujourd['’ ]?hui|demain|ce soir|ce matin|maintenant|en ce moment|actuellement|cette semaine|stp|s'il te plait|s'il te plaît|svp|s'il vous plaît|s'il vous plait)$/i;

/** Extrait la ville d'une demande météo (casse et accents conservés). */
export function extractCity(raw) {
  let s = String(raw || '').trim().replace(/[?!.…]+$/g, '').trim();
  for (let k = 0; k < 3; k++) s = s.replace(TRAILING_TIME, '').trim();
  const m = s.match(/(?:^|\s)(?:à|a|sur|pour|de|du|en|au)\s+((?:[\p{L}'’-]+\s?){1,4})$/iu);
  if (!m) return null;
  const city = m[1].trim();
  const n = normalize(city);
  if (!n || /^(la|le|les|l|demain|aujourd hui|il|ici|chez moi|maintenant|quel|quoi|ma ville)$/.test(n)) return null;
  return city
    .split(/(\s+|-)/)
    .map((w) => (/^(sur|sous|de|la|le|les|en|du|des|et|l|d)$/i.test(w) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('')
    .replace(/^./, (c) => c.toUpperCase());
}

const MODE_WORDS = [
  ['galerie', /\b(galerie|album|photos|mes photos|mes images|bibliotheque)\b/],
  ['dessin', /\b(dessin|dessiner|dessine|peinture|peindre|tableau|ardoise)\b/],
  ['holo', /\b(hologramme|holo|globe|3d|reacteur|planete|terre)\b/],
  ['reglages', /\b(reglages?|parametres?|configuration|options|calibration|calibrer)\b/],
  ['tutoriel', /\b(tutoriel|tuto|didacticiel|apprendre les gestes|liste des gestes|gestes)\b/],
  ['liaison', /\b(appairage|liaison|appairer|connecte|connecter|relier|associer)\b/],
  ['confidentialite', /\b(confidentialite|vie privee|donnees personnelles)\b/],
];

const has = (n, re) => re.test(n);

/**
 * Analyse une commande.
 * @returns {{intent:string, params:object, text:string, normalized:string, woke:boolean}}
 */
export function parseCommand(input) {
  const { woke, rest } = extractWake(input);
  const text = rest;
  const n = normalize(text);
  const out = (intent, params = {}) => ({ intent, params, text, normalized: n, woke });

  if (!n) return out(woke ? 'wake-only' : 'empty');

  if (has(n, /\b(aide|que sais tu faire|qu est ce que tu sais faire|quelles commandes|liste des commandes|tu sais faire quoi|que peux tu faire)\b/)) return out('help');
  if (has(n, /\b(reveille toi|reveil|debout|sors de (la )?veille|reprends|je suis la|reactive toi)\b/)) return out('wake');
  if (has(n, /\b(mode veille|en veille|mets toi en veille|va dormir|eteins toi|mise en veille)\b/) || /^(veille|dors|repos|au repos)$/.test(n)) return out('sleep');

  const timerWord = /\b(minuterie|minuteur|timer|compte a rebours|chrono|chronometre|rappelle moi dans|alarme dans|sonne dans)\b/;
  if (has(n, /\b(annule|arrete|stop|supprime|coupe|efface)\b/) && has(n, /\b(minuterie|minuteur|minuteries|timer|compte a rebours|alarme)\b/)) return out('timer-cancel');
  const dur = parseDuration(text);
  if (has(n, timerWord) || (dur && has(n, /\b(dans|pendant|pour)\b/) && !has(n, /\bmeteo\b/))) {
    if (dur > 0) {
      const label = (text.match(/\bpour (?:le |la |les |l')?([\p{L} '-]{2,30})$/iu) || [])[1] || '';
      return out('timer', { seconds: dur, label: label.trim() });
    }
    if (has(n, timerWord)) return out('timer', { seconds: 0 });
  }

  if (has(n, /\b(meteo|quel temps|temperature|fait il (chaud|froid|beau)|va t il pleuvoir|pleut il|il pleut|previsions?)\b/)) {
    return out('weather', { city: extractCity(text) });
  }
  if (has(n, /\b(quelle heure|l heure|il est quelle heure|heure est il|donne moi l heure)\b/)) return out('time');
  if (has(n, /\b(quel jour|quelle date|on est le combien|date du jour|la date|quel jour sommes nous|on est quel jour)\b/)) return out('date');

  if (has(n, /\b(prends?|prendre|fais|faire) (une |un )?(capture|photo|cliche|selfie)\b/) || has(n, /\b(capture|selfie|cheese|photographie moi|immortalise)\b/)) {
    if (!has(n, /\b(envoie|envoyer|partage|transfere)\b/)) return out('capture');
  }
  if ((has(n, /\b(envoie|envoyer|envoi|partage|partager|transfere|transferer|balance|lance|lancer)\b/) && has(n, /\b(photo|image|cliche|celle ci)\b/))
    || /^(envoie|envoie la|envoie le|envoie ca|partage la|partage ca|transfere la)$/.test(n)) {
    return out('send-photo');
  }

  if (has(n, /\b(photo suivante|image suivante|prochaine photo|prochaine image)\b/) || /^(la )?suivante?$/.test(n)) return out('next');
  if (has(n, /\b(photo precedente|image precedente)\b/) || /^(la )?precedente?$/.test(n)) return out('prev');
  if (has(n, /\b(favori|favoris|coup de coeur|ajoute aux favoris|mets en favori|mets la en favori)\b/)) return out('favorite');

  if (has(n, /\b(efface tout|efface le dessin|nouveau dessin|nettoie|table rase|vide le dessin|efface l ardoise)\b/)) return out('clear-drawing');
  if (has(n, /\b(enregistre|sauvegarde|exporte|garde)\b/) && has(n, /\b(dessin|tableau|croquis)\b/)) return out('export-drawing');

  if (has(n, /\bplein ecran\b/)) return out(has(n, /\b(quitte|sors|sortir|ferme)\b/) ? 'fullscreen-exit' : 'fullscreen');
  if (has(n, /\b(coupe le son|silence|mode muet|muet|sans le son)\b/)) return out('mute');
  if (has(n, /\b(active le son|remets le son|reactive le son|avec le son)\b/)) return out('unmute');
  if (has(n, /\b(camera)\b/)) {
    if (has(n, /\b(coupe|eteins|desactive|arrete|stop)\b/)) return out('camera-off');
    if (has(n, /\b(active|allume|demarre|lance|ouvre)\b/)) return out('camera-on');
  }
  if (has(n, /\b(mode (simulation|demo|demonstration)|simulation|demonstration)\b/)) return out('simulation');
  if (has(n, /\b(ferme|quitte|sors)\b/) && has(n, /\b(visionneuse|photo|image)\b/)) return out('close-viewer');

  const verb = /\b(ouvre|ouvrir|affiche|afficher|montre|montrer|lance|va|aller|passe|mode|active|demarre|bascule|retourne|reviens)\b/;
  for (const [mode, re] of MODE_WORDS) {
    if (has(n, re) && (has(n, verb) || n.split(' ').length <= 3)) return out('open-mode', { mode });
  }

  if (has(n, /^(bonjour|salut|hello|coucou|bonsoir|hey|yo)\b/)) return out('hello');
  if (has(n, /^(merci|merci beaucoup|super merci|parfait merci)\b/)) return out('thanks');
  if (has(n, /\b(qui es tu|tu es qui|presente toi|comment tu t appelles|ton nom)\b/)) return out('who');
  if (has(n, /^(stop|tais toi|chut|arrete de parler|ca suffit)$/)) return out('stop');

  return out('unknown');
}

/** Liste lisible des commandes (aide). */
export const COMMAND_HELP = [
  ['« Jarvis, ouvre la galerie »', 'affiche la galerie et le partage'],
  ['« mode dessin »', 'dessin dans l’air'],
  ['« affiche l’hologramme »', 'globe holographique'],
  ['« envoie la photo »', 'envoie la photo ouverte à l’appareil relié'],
  ['« quelle heure est-il ? »', 'heure et date'],
  ['« météo à Toulouse »', 'météo actuelle (Open-Meteo)'],
  ['« minuterie de 5 minutes »', 'minuterie (plusieurs possibles)'],
  ['« annule la minuterie »', 'supprime les minuteries'],
  ['« prends une capture »', 'photo webcam avec cadre HUD'],
  ['« photo suivante » / « précédente »', 'navigation dans la galerie'],
  ['« efface tout »', 'efface le dessin'],
  ['« mode veille » / « réveille-toi »', 'mise en veille'],
  ['« coupe le son »', 'sons et voix désactivés'],
];
