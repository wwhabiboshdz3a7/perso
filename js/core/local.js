// Cerveau local : ce que l'assistant sait faire sans IA ni réseau.
// Calculs dictés, conversions d'unités, heure d'une alarme, jours restants
// avant une date. Module pur (sans DOM), testé avec node --test.

import { readNumber } from './commands.js';

const strip = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// ——— Calculs ——————————————————————————————————————————————————————

/** Prépare une phrase de calcul : symboles en mots, nombres décimaux à point. */
function mathText(raw) {
  return ' ' + strip(raw)
    .replace(/(\d)[\s  ](?=\d{3}\b)/g, '$1')          // 1 000 → 1000
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/[×✕]/g, ' fois ').replace(/÷/g, ' divise par ')
    .replace(/%/g, ' pour cent ')
    .replace(/\*/g, ' fois ').replace(/\//g, ' divise par ').replace(/\+/g, ' plus ')
    .replace(/\^/g, ' puissance ')
    .replace(/(^|[\d\s)])-(?=\s*[\d(a-z])/g, '$1 moins ')
    .replace(/[(]/g, ' ( ').replace(/[)]/g, ' ) ')
    .replace(/[’'`]/g, ' ')
    .replace(/[^a-z0-9.()\s]/g, ' ')
    .replace(/\s+/g, ' ') + ' ';
}

const MATH_LEAD = /^\s*(?:(?:dis moi |donne moi )?(?:combien (?:font|fait|ca fait|donne|donnent|egale|vaut|valent)|ca fait combien|c est combien|calcule(?:r| moi)?|calculer|fais le calcul|fais le calcul de|resous|quel est le resultat de|resultat de|que font|que fait|combien egale)\s+)/;

const OPS = [
  [/^(plus|et)$/, '+'], [/^moins$/, '-'], [/^(fois|x|multiplie|multiplies)$/, '*'],
  [/^(divise|divises|sur)$/, '/'], [/^(puissance|exposant)$/, '^'], [/^modulo$/, 'mod'],
];

/**
 * Lit un calcul dicté (« combien font 12 fois 8 », « racine carrée de 144 »,
 * « 15 % de 80 », « (3 + 4) × 2 »).
 * @returns {{value:number, expr:string}|null} null si ce n'est pas un calcul.
 */
export function parseMath(raw) {
  let s = mathText(raw);
  const lead = MATH_LEAD.test(s);
  s = s.replace(MATH_LEAD, ' ').replace(/\s(egal|egale|egalent|ca fait|font|fait)\s*$/, ' ');
  s = s.replace(/ (multiplie|multiplies|divise|divises) par /g, ' $1 ')
    .replace(/ au carre /g, ' puissance 2 ').replace(/ au cube /g, ' puissance 3 ')
    .replace(/ (?:la )?racine (?:carree )?(?:de |d )?/g, ' sqrt ')
    .replace(/ pour ?cent (?:de |d )/g, ' pct ')
    .replace(/ pour ?cent /g, ' pctx ');
  const words = s.trim().split(' ').filter(Boolean);
  if (!words.length) return null;
  const toks = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w === '(' || w === ')') { toks.push(w); continue; }
    if (w === 'sqrt') { toks.push('sqrt'); continue; }
    if (w === 'pct') { toks.push('pct'); continue; }
    if (w === 'pctx') { toks.push('pctx'); continue; }
    const op = OPS.find(([re]) => re.test(w));
    // « et » n'est une addition qu'entre deux nombres (« vingt et un » est lu par readNumber).
    if (op && !(w === 'et' && !lead)) { toks.push(op[1]); continue; }
    const n = readNumber(words, i);
    if (n) { toks.push(n.value); i = n.next - 1; continue; }
    if (/^(le|la|les|de|du|des|a|l|d|par|sur|combien|que|quoi|alors)$/.test(w)) continue;
    return null; // mot inconnu : pas un calcul
  }
  const nOps = toks.filter((t) => typeof t === 'string' && t !== '(' && t !== ')').length;
  const nNums = toks.filter((t) => typeof t === 'number').length;
  if (!nNums || (!nOps && !lead) || (!nOps && nNums > 1)) return null;
  const value = evaluate(toks);
  if (value === null || !Number.isFinite(value)) return null;
  return { value, expr: show(toks) };
}

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, mod: 2, pct: 2, '^': 3, neg: 4, sqrt: 4 };
const RIGHT = new Set(['^', 'neg', 'sqrt']);

function evaluate(toks) {
  const out = [], st = [];
  let prevValue = false;
  for (let t of toks) {
    if (typeof t === 'number') { out.push(t); prevValue = true; continue; }
    if (t === 'pctx') { out.push(0.01); out.push('*'); prevValue = true; continue; }
    if (t === '(') { st.push(t); prevValue = false; continue; }
    if (t === ')') {
      while (st.length && st[st.length - 1] !== '(') out.push(st.pop());
      if (!st.length) return null;
      st.pop(); prevValue = true; continue;
    }
    if (t === '-' && !prevValue) t = 'neg';
    if (t === '+' && !prevValue) continue;
    while (st.length) {
      const top = st[st.length - 1];
      if (top === '(') break;
      if (PREC[top] > PREC[t] || (PREC[top] === PREC[t] && !RIGHT.has(t))) out.push(st.pop()); else break;
    }
    st.push(t);
    prevValue = false;
  }
  while (st.length) { const t = st.pop(); if (t === '(') return null; out.push(t); }
  const v = [];
  for (const t of out) {
    if (typeof t === 'number') { v.push(t); continue; }
    if (t === 'neg' || t === 'sqrt') {
      if (!v.length) return null;
      const a = v.pop();
      if (t === 'sqrt' && a < 0) return null;
      v.push(t === 'neg' ? -a : Math.sqrt(a));
      continue;
    }
    if (v.length < 2) return null;
    const b = v.pop(), a = v.pop();
    switch (t) {
      case '+': v.push(a + b); break;
      case '-': v.push(a - b); break;
      case '*': v.push(a * b); break;
      case '/': if (b === 0) return null; v.push(a / b); break;
      case 'mod': if (b === 0) return null; v.push(a % b); break;
      case '^': v.push(a ** b); break;
      case 'pct': v.push((a / 100) * b); break;
      default: return null;
    }
  }
  return v.length === 1 ? v[0] : null;
}

const SHOW = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^', mod: 'mod', pct: '% de', pctx: '%', sqrt: '√' };
function show(toks) {
  return toks.map((t) => (typeof t === 'number' ? formatNumber(t) : SHOW[t] || t)).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')').replace(/√ /g, '√').replace(/ %/g, ' %');
}

/** Nombre au format français, 6 décimales au plus, sans zéros inutiles. */
export function formatNumber(x) {
  if (!Number.isFinite(x)) return String(x);
  const abs = Math.abs(x);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-6)) return x.toExponential(4).replace('.', ',');
  return x.toLocaleString('fr-FR', { maximumFractionDigits: abs < 1 ? 6 : 4 }).replace(/ | /g, ' ');
}

// ——— Conversions ——————————————————————————————————————————————————

const UNITS = [
  // [motif, identifiant, famille, facteur vers l'unité de base, nom au singulier, au pluriel]
  [/^(km|kilometres?)$/, 'km', 'len', 1000, 'kilomètre', 'kilomètres'],
  [/^(m|metres?)$/, 'm', 'len', 1, 'mètre', 'mètres'],
  [/^(cm|centimetres?)$/, 'cm', 'len', 0.01, 'centimètre', 'centimètres'],
  [/^(mm|millimetres?)$/, 'mm', 'len', 0.001, 'millimètre', 'millimètres'],
  [/^(miles?|mi)$/, 'mi', 'len', 1609.344, 'mile', 'miles'],
  [/^(pieds?|feet|foot|ft)$/, 'ft', 'len', 0.3048, 'pied', 'pieds'],
  [/^(pouces?|inch|inches|in)$/, 'in', 'len', 0.0254, 'pouce', 'pouces'],
  [/^(yards?|yd)$/, 'yd', 'len', 0.9144, 'yard', 'yards'],
  [/^(kg|kilos?|kilogrammes?)$/, 'kg', 'mass', 1, 'kilogramme', 'kilogrammes'],
  [/^(g|grammes?)$/, 'g', 'mass', 0.001, 'gramme', 'grammes'],
  [/^(tonnes?|t)$/, 't', 'mass', 1000, 'tonne', 'tonnes'],
  [/^(livres?|lbs?|pounds?)$/, 'lb', 'mass', 0.45359237, 'livre', 'livres'],
  [/^(onces?|oz)$/, 'oz', 'mass', 0.028349523125, 'once', 'onces'],
  [/^(litres?|l)$/, 'l', 'vol', 1, 'litre', 'litres'],
  [/^(ml|millilitres?)$/, 'ml', 'vol', 0.001, 'millilitre', 'millilitres'],
  [/^(cl|centilitres?)$/, 'cl', 'vol', 0.01, 'centilitre', 'centilitres'],
  [/^(gallons?|gal)$/, 'gal', 'vol', 3.785411784, 'gallon', 'gallons'],
  [/^(tasses?|cups?)$/, 'cup', 'vol', 0.2365882365, 'tasse', 'tasses'],
  [/^(celsius|c|degres celsius|degres)$/, 'C', 'temp', null, 'degré Celsius', 'degrés Celsius'],
  [/^(fahrenheit|f|degres fahrenheit)$/, 'F', 'temp', null, 'degré Fahrenheit', 'degrés Fahrenheit'],
  [/^(kelvins?|k)$/, 'K', 'temp', null, 'kelvin', 'kelvins'],
  [/^(km h|kmh|kilometres heure|kilometres par heure|kilometres a l heure)$/, 'kmh', 'speed', 1 / 3.6, 'kilomètre par heure', 'kilomètres par heure'],
  [/^(mph|miles par heure|miles heure|miles a l heure)$/, 'mph', 'speed', 0.44704, 'mile par heure', 'miles par heure'],
  [/^(noeuds?)$/, 'kn', 'speed', 0.514444, 'nœud', 'nœuds'],
  [/^(m s|metres par seconde|metres seconde)$/, 'ms', 'speed', 1, 'mètre par seconde', 'mètres par seconde'],
  [/^(heures?)$/, 'h', 'time', 3600, 'heure', 'heures'],
  [/^(minutes?)$/, 'min', 'time', 60, 'minute', 'minutes'],
  [/^(secondes?)$/, 's', 'time', 1, 'seconde', 'secondes'],
  [/^(jours?)$/, 'd', 'time', 86400, 'jour', 'jours'],
  [/^(semaines?)$/, 'wk', 'time', 604800, 'semaine', 'semaines'],
  [/^(octets?|o)$/, 'B', 'data', 1, 'octet', 'octets'],
  [/^(ko|kilo octets?|kilooctets?)$/, 'kB', 'data', 1e3, 'kilooctet', 'kilooctets'],
  [/^(mo|mega octets?|megaoctets?)$/, 'MB', 'data', 1e6, 'mégaoctet', 'mégaoctets'],
  [/^(go|giga octets?|gigaoctets?)$/, 'GB', 'data', 1e9, 'gigaoctet', 'gigaoctets'],
  [/^(to|tera octets?|teraoctets?)$/, 'TB', 'data', 1e12, 'téraoctet', 'téraoctets'],
];

function unitAt(words, i) {
  // Unités de 1 à 4 mots (« miles par heure », « degrés Celsius »), la plus longue d'abord.
  for (let len = 4; len >= 1; len--) {
    if (i + len > words.length) continue;
    const s = words.slice(i, i + len).join(' ');
    const u = UNITS.find(([re]) => re.test(s));
    if (u) return { u, next: i + len };
  }
  return null;
}

function toBase(u, v) {
  if (u[2] !== 'temp') return v * u[3];
  return u[1] === 'C' ? v : u[1] === 'F' ? (v - 32) * (5 / 9) : v - 273.15;
}
function fromBase(u, v) {
  if (u[2] !== 'temp') return v / u[3];
  return u[1] === 'C' ? v : u[1] === 'F' ? v * (9 / 5) + 32 : v + 273.15;
}

/**
 * « convertis 10 km en miles », « 30 degrés en fahrenheit »,
 * « combien de livres dans 2 kilos ».
 * @returns {{value:number, from:object, to:object, result:number, sentence:string}|null}
 */
export function parseConvert(raw) {
  const s = strip(raw).replace(/(\d),(\d)/g, '$1.$2').replace(/[’'`/]/g, ' ').replace(/°/g, ' degres ').replace(/[^a-z0-9.\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = s.split(' ');
  const verb = /^(convertis|convertir|converti|conversion|convertit|transforme|combien|ca fait|ca donne|donne moi|dis moi)/.test(s);
  // Forme 1 : <nombre> <unité> en|vers|=… <unité>
  for (let i = 0; i < words.length; i++) {
    const n = readNumber(words, i);
    if (!n) continue;
    const a = unitAt(words, n.next);
    if (!a) continue;
    let j = a.next;
    while (j < words.length && /^(en|vers|dans|a|font|fait|ca|combien|de|d)$/.test(words[j])) j++;
    const b = unitAt(words, j);
    if (!b || b.u[2] !== a.u[2] || b.u[1] === a.u[1]) continue;
    if (!verb && !/\b(en|vers)\b/.test(words.slice(a.next, j).join(' '))) continue;
    return result(n.value, a.u, b.u);
  }
  // Forme 2 : combien de <unité> dans|font|pour <nombre> <unité>
  const m = s.match(/^combien (?:de |d )?(.+?) (?:dans|font|fait|pour|en|y a t il dans|il y a dans) (.+)$/);
  if (m) {
    const tw = m[1].split(' '), rest = m[2].split(' ');
    const b = unitAt(tw, 0);
    const n = readNumber(rest, 0);
    if (b && n) {
      const a = unitAt(rest, n.next);
      if (a && a.u[2] === b.u[2] && a.u[1] !== b.u[1]) return result(n.value, a.u, b.u);
    }
  }
  return null;
}

function result(value, from, to) {
  const r = fromBase(to, toBase(from, value));
  const name = (u, v) => (Math.abs(v) >= 2 ? u[5] : u[4]);
  const sentence = `${formatNumber(value)} ${name(from, value)} font ${formatNumber(r)} ${name(to, r)}.`;
  return { value, from: { id: from[1] }, to: { id: to[1] }, result: r, sentence };
}

// ——— Heure d'une alarme ————————————————————————————————————————————

/**
 * Heure contenue dans une phrase normalisée : « à 7 heures 30 », « à 18 h »,
 * « à midi », « à 7 heures et demie », « à 8 heures moins le quart ».
 * @returns {{h:number, m:number}|null}
 */
export function parseClock(n) {
  const s = ` ${n} `;
  if (/ (a )?midi et demi /.test(s)) return { h: 12, m: 30 };
  if (/ (a )?minuit et demi /.test(s)) return { h: 0, m: 30 };
  if (/ (a )?midi /.test(s)) return { h: 12, m: 0 };
  if (/ (a )?minuit /.test(s)) return { h: 0, m: 0 };
  const words = s.trim().split(' ');
  for (let i = 0; i < words.length; i++) {
    if (words[i] !== 'a' && words[i] !== 'pour' && words[i] !== 'vers') continue;
    let k = i + 1;
    let h = null;
    const hm = /^(\d{1,2})h(\d{2})?$/.exec(words[k] || '');
    if (hm) { h = +hm[1]; k++; if (hm[2]) return valid(h, +hm[2]); }
    else {
      const n = readNumber(words, k);
      if (!n) continue;
      h = n.value; k = n.next;
      if (!/^(heures?|h)$/.test(words[k] || '')) continue;
      k++;
    }
    let m = 0;
    if (words[k] === 'et' && /^demie?$/.test(words[k + 1] || '')) m = 30;
    else if (words[k] === 'et' && words[k + 1] === 'quart') m = 15;
    else if (words[k] === 'moins' && words[k + 1] === 'le' && words[k + 2] === 'quart') { m = 45; h -= 1; }
    else if (words[k] === 'moins' && readNumber(words, k + 1)) { m = 60 - readNumber(words, k + 1).value; h -= 1; }
    else {
      const mm = readNumber(words, k);
      if (mm && mm.value < 60) m = mm.value;
    }
    if (/\b(du soir|de l apres midi|cet apres midi|ce soir)\b/.test(n) && h < 12) h += 12;
    return valid(h < 0 ? h + 24 : h, m);
  }
  return null;
}

const valid = (h, m) => (Number.isInteger(h) && h >= 0 && h < 24 && Number.isInteger(m) && m >= 0 && m < 60 ? { h, m } : null);

/** Prochaine occurrence de h:m après `now` (aujourd'hui ou demain). */
export function nextOccurrence({ h, m }, now = new Date()) {
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

// ——— Jours restants avant une date ————————————————————————————————

const MONTHS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

function easter(y) {
  // Algorithme de Meeus (calendrier grégorien).
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month - 1, day];
}

const EVENTS = [
  [/\bnoel\b/, 'Noël', () => [11, 25]],
  [/\b(nouvel an|jour de l an|reveillon|nouvelle annee)\b/, 'le Nouvel An', () => [0, 1]],
  [/\bhalloween\b/, 'Halloween', () => [9, 31]],
  [/\b(saint valentin|st valentin)\b/, 'la Saint-Valentin', () => [1, 14]],
  [/\b(fete nationale)\b/, 'la fête nationale', () => [6, 14]],
  [/\b(fete du travail)\b/, 'la fête du Travail', () => [4, 1]],
  [/\bpaques\b/, 'Pâques', (y) => easter(y)],
];

/**
 * « combien de jours avant Noël », « jusqu'au 14 juillet », « d'ici le 3 mars 2027 ».
 * @returns {{days:number, label:string, date:Date}|null}
 */
export function parseDaysUntil(n, now = new Date()) {
  if (!/\b(combien de (jours|temps)|jours? (avant|jusqu)|dans combien de jours|il reste combien de jours|reste t il)\b/.test(n)) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const at = (y, [mo, d]) => new Date(y, mo, d);
  for (const [re, label, md] of EVENTS) {
    if (!re.test(n)) continue;
    let d = at(today.getFullYear(), md(today.getFullYear()));
    if (d < today) d = at(today.getFullYear() + 1, md(today.getFullYear() + 1));
    return { days: Math.round((d - today) / 864e5), label, date: d };
  }
  const words = n.split(' ');
  for (let i = 0; i < words.length; i++) {
    const day = /^(1er|premier)$/.test(words[i]) ? { value: 1, next: i + 1 } : readNumber(words, i);
    if (!day || day.value < 1 || day.value > 31) continue;
    const mo = MONTHS.indexOf(words[day.next]);
    if (mo < 0) continue;
    const yTok = readNumber(words, day.next + 1);
    let d = new Date(yTok && yTok.value > 1900 ? yTok.value : today.getFullYear(), mo, day.value);
    if (d.getMonth() !== mo) return null;
    if (d < today && !(yTok && yTok.value > 1900)) d = new Date(today.getFullYear() + 1, mo, day.value);
    const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) });
    return { days: Math.round((d - today) / 864e5), label: `le ${label}`, date: d };
  }
  return null;
}

// ——— Petites réponses hors ligne ——————————————————————————————————

export const JOKES = [
  'Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon, ils tombent dans le bateau.',
  'Que dit un informaticien quand il s’ennuie ? Je me fichier.',
  'Pourquoi les poissons détestent l’ordinateur ? À cause du net.',
  'Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-peint de Noël.',
  'Que fait une fraise sur un cheval ? Tagada, tagada.',
  'Pourquoi le livre de maths est-il triste ? Parce qu’il a trop de problèmes.',
  'Quel est le comble pour un électricien ? De ne pas être au courant.',
  'Qu’est-ce qu’un crocodile qui surveille la pharmacie ? Un Lacoste-garde.',
  'Pourquoi les développeurs confondent Halloween et Noël ? Parce que 31 en octal égale 25 en décimal.',
  'Quel est le sport préféré des insectes ? Le cricket.',
  'Un robot entre dans un café. Le serveur lui dit : on ne sert pas les robots ici. Il répond : un jour, vous le ferez.',
  'Pourquoi mon assistant ne joue jamais aux cartes ? Parce qu’il a trop de mémoire vive pour bluffer.',
];

export const QUOTES = [
  ['On ne voit bien qu’avec le cœur. L’essentiel est invisible pour les yeux.', 'Antoine de Saint-Exupéry'],
  ['Le succès, c’est d’aller d’échec en échec sans perdre son enthousiasme.', 'attribué à Winston Churchill'],
  ['La simplicité est la sophistication suprême.', 'attribué à Léonard de Vinci'],
  ['Ce n’est pas parce que les choses sont difficiles que nous n’osons pas, c’est parce que nous n’osons pas qu’elles sont difficiles.', 'Sénèque'],
  ['Il faut toujours viser la lune, car même en cas d’échec, on atterrit dans les étoiles.', 'attribué à Oscar Wilde'],
  ['Le génie, c’est un pour cent d’inspiration et quatre-vingt-dix-neuf pour cent de transpiration.', 'Thomas Edison'],
  ['Choisissez un travail que vous aimez, et vous n’aurez pas à travailler un seul jour de votre vie.', 'attribué à Confucius'],
  ['La meilleure façon de prédire l’avenir, c’est de le créer.', 'attribué à Peter Drucker'],
  ['Rien n’est plus puissant qu’une idée dont l’heure est venue.', 'Victor Hugo'],
  ['L’imagination est plus importante que le savoir.', 'Albert Einstein'],
];

/** Élément au hasard (générateur injectable pour les tests). */
export const pick = (list, rnd = Math.random) => list[Math.floor(rnd() * list.length)];
