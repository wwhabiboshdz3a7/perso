// Analyse des commandes vocales (ou tapées) en français : mot d'éveil,
// intentions, durées (« cinq minutes et demie »), ville pour la météo.
// Module pur, sans DOM.

import { parseMath, parseConvert, parseClock, parseDaysUntil } from './local.js';

const WAKE_RE = /(^|[\s,.;:!?«"'(])(d?jarv[iy]s+e?|jarvice|jarvi|jervis|gervais|jarwis|charvis)(?=$|[\s,.;:!?»"')-])[\s,.;:!?»"')-]*/i;
let customWake = null;

const ACCENTS = { a: 'aàâä', e: 'eéèêë', i: 'iîï', o: 'oôö', u: 'uùûü', c: 'cç', y: 'yÿ' };

/**
 * Nom de l'assistant utilisé comme mot d'éveil, en plus de « Jarvis »
 * (qui reste toujours reconnu). Accents et casse indifférents.
 */
export function setWakeWord(name) {
  const base = String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 -]/g, '').trim();
  if (!base || /^d?jarvis$/.test(base) || base.length < 2) { customWake = null; return; }
  const body = [...base].map((ch) => (ch === ' ' || ch === '-' ? '[\\s-]?' : ACCENTS[ch] ? `[${ACCENTS[ch]}]` : ch)).join('');
  customWake = new RegExp(`(^|[\\s,.;:!?«"'(])(${body})(?=$|[\\s,.;:!?»"')-])[\\s,.;:!?»"')-]*`, 'i');
}

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

/** Détecte le mot d'éveil « Jarvis » (et ses transcriptions approximatives). */
export function extractWake(text) {
  const raw = String(text || '');
  const m = (customWake && raw.match(customWake)) || raw.match(WAKE_RE);
  if (!m) return { woke: false, rest: raw.trim() };
  const before = raw.slice(0, m.index + m[1].length);
  const after = raw.slice(m.index + m[0].length);
  // Ce qui précède le mot d'éveil (« dis jarvis », « ok jarvis ») est ignoré.
  void before;
  return { woke: true, rest: after.trim() };
}

const UNITS = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
  cent: 100, cents: 100, mille: 1000, million: 1e6, millions: 1e6,
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
    else if (v === 1e6) { total += (current || 1) * 1e6; current = 0; }
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
    .replace(/ (une |un )?demi minute /g, ' 30 secondes ')
    // « 30s », « 5min », « 2h » : nombre collé à son unité.
    .replace(/ (\d+(?:\.\d+)?)(h|hr|min|mins|mn|s|sec|secs|secondes?|minutes?|heures?) /g, ' $1 $2 ')
    // « un million d'heures » : « d » entre le nombre et l'unité.
    .replace(/ (d|de) (heures?|minutes?|secondes?) /g, ' $2 ');
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
      // « 1 minute 30 », « 2 heures 15 » : unité inférieure implicite.
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
  ['arcade', /\b(arcade|jeu de cibles|jeu|jouer|joue|partie|cibles)\b/],
];

const has = (n, re) => re.test(n);

// Formules de demande qui précèdent une commande (« tu peux prendre une capture »).
const POLITE_START = /^(?:(?:est ce que |est ce qu )?(?:tu peux|tu pourrais|peux tu|pourrais tu|pouvez vous|pourriez vous|vous pouvez|veux tu|voudrais tu|tu veux bien|tu voudrais bien|je veux que tu|je voudrais que tu|j aimerais que tu|merci de|s il te plait|s il vous plait|stp|svp|vas y|allez|ok|okay|alors|bon|eh|dis|dites)\s+)+/;
const POLITE_END = /(?:\s+(?:s il te plait|s il vous plait|stp|svp|merci|jarvis|maintenant|vite))+$/;
// Questions ouvertes : elles vont au cerveau IA, sauf les quelques formes
// reconnues plus bas (heure, date, météo, aide, présentation).
const QUESTION = /^(comment|pourquoi|qu est ce|est ce que|est ce qu|c est quoi|ce serait quoi|que signifie|que veut dire|explique|raconte|qui |quand |combien|ou |d ou |quel est|quelle est|quels sont|quelles sont|quel serait|quelle serait|sais tu|connais tu|parle moi|dis moi (pourquoi|comment|qui|quand|ce que|si|combien|ou)|a quel|a quelle|a qui|de quel|de quelle|en quelle|en quel|depuis quand|jusqu a quand|tu sais|t sais|me donner|m expliquer|m aider|aide moi a|j ai besoin|je cherche|je voudrais savoir|j aimerais savoir|je me demande)\b/;

const HELP_RE = /^(aide|aide moi|a l aide|de l aide|help|les commandes|commandes|liste des commandes|quelles commandes|quelles sont les commandes|que sais tu faire|qu est ce que tu sais faire|tu sais faire quoi|que peux tu faire|qu est ce que tu peux faire|tu peux faire quoi|que fais tu)$/;
const TIME_RE = /^(?:dis moi |donne moi |me dire |me donner )?(?:quelle heure(?: est il| il est| c est| est il maintenant)?|il est quelle heure|l heure|tu as l heure|t as l heure|vous avez l heure)(?: maintenant| exactement| actuellement| ici)?$/;
const DATE_RE = /^(?:dis moi |donne moi |me dire |me donner )?(?:quel jour(?: sommes nous| on est| est on| est il| nous sommes| est ce| on est aujourd hui)?|on est quel jour|on est le combien|nous sommes le combien|quelle (?:est la )?date(?: on est| sommes nous| d aujourd hui| du jour)?|la date(?: d aujourd hui| du jour)?|date du jour|c est quel jour)(?: aujourd hui| exactement)?$/;
const WHO_RE = /^(qui es tu|tu es qui|qui etes vous|presente toi|comment tu t appelles|comment t appelles tu|quel est ton nom|c est quoi ton nom|ton nom)$/;
const WEATHER_WORDS = /\b(meteo|quel temps|fait il (chaud|froid|beau)|va t il pleuvoir|pleut il|il pleut|previsions? meteo|previsions)\b/;
// « température » seul est ambigu (« température du soleil ») : forme stricte.
const WEATHER_TEMP = /(^(la )?temperature$|\btemperature (a|en|au|aux|sur|de|dehors|exterieure|actuelle|aujourd hui|ce matin|ce soir|demain|maintenant|ici)\b|\bquelle temperature (fait il|il fait)\b)/;
const WEATHER_QUESTION = /^(quel temps|quelle (est la )?meteo|quelle meteo|comment est la meteo|la meteo|quelle (est la )?temperature( a| en| au| sur| de| dehors| exterieure| actuelle| aujourd hui| ce matin| ce soir| demain| maintenant| ici|$)|quelle temperature (fait il|il fait)|va t il pleuvoir|est ce qu il (va )?pleu|est ce qu il fait (beau|chaud|froid)|il fait (beau|chaud|froid)|fait il (beau|chaud|froid)|quelles sont les previsions|il pleut)/;
const MAX_TIMER_S = 24 * 3600;

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

  // Noyau de la phrase, sans les formules de politesse autour.
  const core = n.replace(POLITE_START, '').replace(POLITE_END, '').trim() || n;
  const question = QUESTION.test(core) || QUESTION.test(n) || /\?\s*$/.test(String(text));

  if (HELP_RE.test(core) || HELP_RE.test(n)) return out('help');
  if (TIME_RE.test(core)) return out('time');
  if (DATE_RE.test(core)) return out('date');
  if (WHO_RE.test(core)) return out('who');

  const local = localIntent(core, text, n);
  if (local) return out(local[0], local[1] || {});

  if (question) {
    // Seules les questions météo explicites restent locales.
    if (WEATHER_QUESTION.test(core) || (WEATHER_WORDS.test(core) && !/^(comment|pourquoi|qu est ce|explique|c est quoi)\b/.test(core) && extractCity(text))) {
      return out('weather', { city: extractCity(text) });
    }
    return out('unknown');
  }

  if (/^(reveille toi|reveillez vous|reveil|debout|sors de (la )?veille|reprends|reprenons|on reprend|je suis la|reactive toi|c est reparti)$/.test(core)) return out('wake');
  if (has(core, /\b(mode veille|mets toi en veille|passe en veille|va dormir|eteins toi|mise en veille)\b/) || /^(veille|en veille|dors|repos|au repos)$/.test(core)) return out('sleep');

  const timerWord = /\b(minuterie|minuteur|timer|compte a rebours|chrono|chronometre|rappelle moi dans|alarme dans|sonne dans)\b/;
  if (has(core, /\b(annule|arrete|stop|supprime|coupe|efface)\b/) && has(core, /\b(minuterie|minuteur|minuteries|timer|compte a rebours|alarme)\b/)) return out('timer-cancel');
  const dur = parseDuration(text);
  const implicit = dur > 0 && /^(rappelle moi|previens moi|avertis moi|reveille moi|sonne|bipe)\b/.test(core) && has(core, /\b(dans|pendant)\b/);
  if (has(core, timerWord) || implicit) {
    if (dur > 0) {
      const m = String(text).match(/\bpour ((?:le |la |les |l['’]|du |des |de la |mon |ma |mes |ton |ta |tes )?([\p{L}][\p{L} '’-]{1,30}))[\s?!.…]*$/iu);
      const label = m && !parseDuration(m[2]) ? m[2].trim() : '';
      const purpose = label ? m[1].trim() : '';
      return out('timer', { seconds: dur, label, purpose, tooLong: dur > MAX_TIMER_S });
    }
    if (has(core, timerWord)) return out('timer', { seconds: 0 });
  }

  if (WEATHER_WORDS.test(core) || WEATHER_TEMP.test(core)) return out('weather', { city: extractCity(text) });

  const sendWords = /\b(envoie|envoyer|envoi|partage|partager|transfere|transferer|balance|lance|lancer)\b/;
  if (!has(core, sendWords) && (/^(prends?|prendre|fais|faire|lance|declenche)( moi| nous)? (une |un |la |le )?(capture|photo|cliche|selfie)\b/.test(core)
    || /^(capture|une capture|selfie|cheese|photographie moi|immortalise( moi| ca| ce moment)?|photo)$/.test(core))) {
    return out('capture');
  }
  if ((has(core, sendWords) && has(core, /\b(photo|image|cliche|celle ci)\b/))
    || /^(envoie|envoie la|envoie le|envoie ca|partage la|partage ca|transfere la)$/.test(core)) {
    return out('send-photo');
  }

  if (/^(la |une )?(photo|image) suivante$|^(la )?(prochaine|suivante?)( photo| image)?$/.test(core) || has(core, /^(passe a la|va a la|montre la) (photo |image )?suivante\b/)) return out('next');
  if (/^(la |une )?(photo|image) precedente$|^(la )?precedente?( photo| image)?$/.test(core) || has(core, /^(reviens a la|retourne a la|va a la|montre la) (photo |image )?precedente\b/)) return out('prev');
  if (/^(favori|favoris|en favori|coup de coeur)$/.test(core) || /^(mets?|ajoute|garde|marque|passe)\b.*\bfavoris?\b/.test(core)) return out('favorite');

  if (/^(efface tout|efface le dessin|nouveau dessin|nettoie( l ardoise| le dessin| tout)?|table rase|vide le dessin|efface l ardoise|on efface tout)\b/.test(core)) return out('clear-drawing');
  if (/^(enregistre|sauvegarde|exporte|garde|range)\b/.test(core) && has(core, /\b(dessin|tableau|croquis)\b/)) return out('export-drawing');

  if (has(core, /\bplein ecran\b/)) return out(has(core, /\b(quitte|sors|sortir|ferme|enleve)\b/) ? 'fullscreen-exit' : 'fullscreen');
  if (/^(coupe le son|coupe les sons|silence|mode muet|muet|mode silencieux|sans le son|en silence)\b/.test(core)) return out('mute');
  if (/^(active le son|remets le son|remets les sons|reactive le son|avec le son|rallume le son)\b/.test(core)) return out('unmute');
  if (has(core, /\bcamera\b/)) {
    if (/^(coupe|eteins|desactive|arrete|stop|ferme)\b/.test(core)) return out('camera-off');
    if (/^(active|allume|demarre|lance|ouvre|mets|rallume)\b/.test(core)) return out('camera-on');
  }
  if (/^(mode |lance |ouvre |active |demarre )?(la |une )?(simulation|demo|demonstration)( sans camera)?$/.test(core)) return out('simulation');
  if (/^(ferme|quitte|sors)\b/.test(core) && has(core, /\b(visionneuse|photo|image)\b/)) return out('close-viewer');

  const verb = /^(ouvre|ouvrir|affiche|afficher|montre|montre moi|montrer|lance|va|aller|passe|mode|active|demarre|bascule|retourne|reviens)\b/;
  for (const [mode, re] of MODE_WORDS) {
    if (has(core, re) && (verb.test(core) || core.split(' ').length <= 3)) return out('open-mode', { mode });
  }

  if (/^(bonjour|salut|hello|coucou|bonsoir|hey|yo)\b/.test(core) && core.split(' ').length <= 4) return out('hello');
  if (/^(merci|merci beaucoup|super merci|parfait merci|merci bien)$/.test(n)) return out('thanks');
  if (/^(stop|tais toi|chut|arrete de parler|ca suffit)$/.test(n)) return out('stop');

  return out('unknown');
}

const THEME_WORDS = [
  ['arc', /\b(arc|cyan|bleu cyan|d origine|par defaut|classique)\b/],
  ['mark', /\b(mark|rouge|iron man)\b/],
  ['matrix', /\b(matrice|matrix|vert)\b/],
  ['nexora', /\b(nexora|violet)\b/],
  ['glace', /\b(glace|blanc|givre)\b/],
  ['solaire', /\b(solaire|orange|soleil)\b/],
];

/**
 * Intentions traitées localement, sans IA : calcul, conversion, mémo, alarme,
 * chrono, hasard, blagues, citations, jours restants, recherche web, thème,
 * changement de nom, état des systèmes. Testées avant les questions ouvertes.
 */
function localIntent(core, text, n) {
  // Mémo
  const noteAdd = core.match(/^(?:note|notes|prends? note|prendre note|ajoute au memo|memo|retiens|souviens toi|rappelle toi|n oublie pas)(?: que| de| d| bien)?\s+(.{2,})$/)
    || core.match(/^ajoute (.{2,}?) (?:a|au|dans) (?:ma liste|la liste|mon memo|le memo|mes notes|ma liste de courses|la liste de courses)$/);
  if (noteAdd && !/^(mes notes|les notes|le memo|mon memo)$/.test(noteAdd[1])) {
    const raw = String(text).replace(/^\s*(?:(?:est-ce que |)(?:tu peux |peux-tu |s'il te pla[iî]t |stp |ok |dis |)\s*)?(?:note|notes|prends? note|prendre note|ajoute au m[ée]mo|m[ée]mo|retiens|souviens-toi|souviens toi|rappelle-toi|rappelle toi|n['’ ]oublie pas)\s*(?:que |qu['’]|de |d['’]|bien |:\s*)?/i, '').replace(/^ajoute\s+/i, '').replace(/\s+(?:à|a|au|dans)\s+(?:ma liste|la liste|mon m[ée]mo|le m[ée]mo|mes notes|ma liste de courses|la liste de courses)\s*[.!]?$/i, '').trim();
    return ['note-add', { text: raw || noteAdd[1] }];
  }
  if (/^(lis|lire|relis|affiche|montre|donne moi|dis moi|quelles sont|c est quoi)( moi)? (mes|les) notes$|^(mes notes|mon memo|le memo|qu est ce que j ai note|qu ai je note|ma liste|ma liste de courses)$/.test(core)) return ['note-list'];
  if (/^(efface|supprime|vide|oublie|nettoie)( toutes)? (mes|les) notes$|^(vide|efface|supprime) (le|mon) memo$|^(vide|efface) (ma|la) liste( de courses)?$/.test(core)) return ['note-clear'];

  // Chronomètre (sans durée : sinon c'est une minuterie)
  if (/\b(chrono|chronometre)\b/.test(core) && !parseDuration(text)) {
    if (/^(arrete|stop|stoppe|pause|mets en pause|fige|met en pause)\b/.test(core) || /\b(stop|arrete)$/.test(core)) return ['chrono-stop'];
    if (/^(remets? a zero|reinitialise|raz|efface|remise a zero|annule)\b/.test(core)) return ['chrono-reset'];
    if (/^(combien|ou en est|temps du)\b/.test(core)) return ['chrono-read'];
    return ['chrono-start'];
  }

  // Alarme à une heure précise
  if (/^(reveille moi|alarme|mets une alarme|mets un reveil|programme une alarme|programme un reveil|reveil|rappelle moi|previens moi|sonne)\b/.test(core) && /\b(a|vers|pour) (midi|minuit|\d|[a-z]+ heure|[a-z]+ h\b|\d+h)/.test(core) && !/\bdans\b/.test(core)) {
    const at = parseClock(core);
    if (at) {
      const m = String(text).match(/\b(?:pour|de)\s+((?!\d)[\p{L}][\p{L} '’-]{1,40})[\s?!.…]*$/iu);
      return ['alarm', { ...at, label: m && !parseClock(normalize(` a ${m[1]}`)) ? m[1].trim() : '' }];
    }
  }

  // Jours restants
  const until = parseDaysUntil(core);
  if (until) return ['days-until', until];

  // Conversion puis calcul
  const conv = parseConvert(text);
  if (conv) return ['convert', conv];
  if (!/\b(minuterie|minuteur|timer|alarme|meteo|photo|dessin|galerie)\b/.test(core)) {
    const math = parseMath(text);
    if (math) return ['calc', math];
  }

  // Hasard
  if (/^(pile ou face|lance une piece|tire a pile ou face|fais un pile ou face|joue a pile ou face)$/.test(core)) return ['coin'];
  const dice = core.match(/^(?:lance|jette|tire|roule)(?: moi)? (un|une|deux|trois|quatre|cinq|six|\d+) des?$/);
  if (dice) return ['dice', { count: Math.min(10, Math.max(1, readNumber([dice[1]], 0)?.value || 1)) }];
  const rnd = core.match(/(?:nombre|chiffre)(?: au hasard| aleatoire)? entre (.+?) et (.+)$/);
  if (rnd) {
    const a = readNumber(rnd[1].split(' '), 0), b = readNumber(rnd[2].split(' '), 0);
    if (a && b) return ['random', { min: Math.min(a.value, b.value), max: Math.max(a.value, b.value) }];
  }
  if (/^(choisis|donne moi|tire) un nombre( au hasard)?$/.test(core)) return ['random', { min: 1, max: 100 }];

  // Petites réponses
  if (/^(raconte|dis|fais|donne)( moi| nous)? une (autre )?blague$|^(une )?(autre )?blague$|^fais moi rire$/.test(core)) return ['joke'];
  if (/^(donne|dis|lis)( moi)? une citation$|^(une )?citation$|^motive moi$|^(un peu de |de la )?motivation$|^inspire moi$/.test(core)) return ['quote'];
  if (/^(repete|repete ca|tu peux repeter|redis|redis le|pardon|quoi|hein)$/.test(core)) return ['repeat'];

  // État des systèmes, batterie
  if (/^(rapport|etat des systemes|etat du systeme|diagnostic|statut|status|bilan|rapport d etat|fais un diagnostic|fais le point)$/.test(core)) return ['status'];
  if (/\b(batterie|autonomie)\b/.test(core) && core.split(' ').length <= 6) return ['battery'];

  // Volume
  if (/^(monte|augmente|plus fort)( le son| le volume)?$|^(monte|augmente) (le son|le volume)$/.test(core)) return ['volume', { delta: 0.2 }];
  if (/^(baisse|diminue|moins fort)( le son| le volume)?$|^(baisse|diminue) (le son|le volume)$/.test(core)) return ['volume', { delta: -0.2 }];

  // Thème et nom
  if (/\b(theme|couleurs?|style|habillage|skin)\b/.test(core) || /^(passe|mets toi|mode) en (rouge|vert|violet|blanc|orange|cyan)$/.test(core)) {
    const hit = THEME_WORDS.find(([, re]) => re.test(core));
    if (hit) return ['theme', { theme: hit[0] }];
    if (/^(change|changer|autre|suivant|change de|prochain)\b/.test(core) || /theme suivant/.test(core)) return ['theme', { theme: 'next' }];
  }
  const rename = String(text).match(/(?:appelle[- ]toi|tu t['’ ]appelles(?: maintenant| desormais| dorenavant)?|change(?:r)? (?:ton|de) nom (?:en|pour)|ton nom (?:est|sera)(?: maintenant| desormais)?|je vais t['’ ]appeler|je t['’ ]appelle(?: maintenant)?)\s+([\p{L}][\p{L}0-9 -]{0,18})\s*[.!]?$/iu);
  if (rename) return ['rename', { name: rename[1].trim() }];

  // Recherche et sites
  const url = String(text).match(/\b(?:ouvre|va sur|affiche|lance)\s+(https?:\/\/\S+)/i);
  if (url) return ['open-url', { url: url[1] }];
  const site = core.match(/^(?:ouvre|va sur|lance|affiche)( le site)? (youtube|google|gmail|google maps|maps|wikipedia|github|linkedin|instagram|tiktok|netflix|spotify|deepl|google traduction|traducteur|calendrier|agenda)$/);
  if (site) return ['open-site', { site: site[2] }];
  const search = String(text).match(/^\s*(?:(?:jarvis|ok|dis)[, ]+)?(?:cherche|recherche|trouve|google)(?:[- ]moi)?\s+(.+?)(?:\s+sur\s+(youtube|google|wikip[ée]dia|maps|google maps|github))?\s*[?.!]?$/i);
  if (search && search[1] && !/^(une? |la |le )?(photo|image|minuterie)$/i.test(search[1])) return ['search', { q: search[1].trim(), on: (search[2] || 'google').toLowerCase() }];
  void n;
  return null;
}

/** Phrase réduite à son noyau (sans mot d'éveil ni formules de politesse). */
export function commandCore(input) {
  const n = normalize(extractWake(input).rest);
  return n.replace(POLITE_START, '').replace(POLITE_END, '').trim() || n;
}

/**
 * Raccourcis personnels : « phrase = commande ; commande ; "texte dit" ».
 * @returns {{phrase:string, key:string, actions:string[]}[]}
 */
export function parseShortcuts(text) {
  const out = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i < 1) continue;
    const phrase = line.slice(0, i).trim();
    const key = normalize(phrase);
    const actions = line.slice(i + 1).split(';').map((a) => a.trim()).filter(Boolean);
    if (key && actions.length) out.push({ phrase, key, actions });
  }
  return out;
}

/** Liste lisible des commandes (aide). */
export const COMMAND_HELP = [
  ['« Jarvis, ouvre la galerie »', 'affiche la galerie et le partage'],
  ['« mode dessin »', 'dessin dans l’air'],
  ['« affiche l’hologramme »', 'globe holographique'],
  ['« envoie la photo »', 'envoie la photo ouverte à l’appareil relié'],
  ['« quelle heure est-il ? »', 'heure et date'],
  ['« météo à Toulouse »', 'météo actuelle (Open-Meteo)'],
  ['« minuterie de 5 minutes »', 'minuterie (plusieurs possibles)'],
  ['« annule la minuterie »', 'supprime les minuteries'],
  ['« prends une capture »', 'photo webcam avec cadre HUD'],
  ['« photo suivante » / « précédente »', 'navigation dans la galerie'],
  ['« efface tout »', 'efface le dessin'],
  ['« mode veille » / « réveille-toi »', 'mise en veille'],
  ['« coupe le son »', 'sons et voix désactivés'],
  ['« combien font 12 fois 8 »', 'calcul, sans IA'],
  ['« convertis 10 km en miles »', 'conversions d’unités'],
  ['« note : acheter du pain »', 'mémo (« lis mes notes »)'],
  ['« réveille-moi à 7 h 30 »', 'alarme à une heure précise'],
  ['« lance le chrono »', 'chronomètre'],
  ['« pile ou face » · « lance un dé »', 'hasard'],
  ['« raconte une blague »', 'blagues et citations'],
  ['« combien de jours avant Noël »', 'jours restants'],
  ['« cherche la tour Eiffel sur YouTube »', 'recherche web'],
  ['« thème rouge » · « appelle-toi Friday »', 'personnalisation'],
  ['« lance le jeu »', 'arcade (jeu de cibles)'],
  ['« rapport »', 'état des systèmes'],
];
