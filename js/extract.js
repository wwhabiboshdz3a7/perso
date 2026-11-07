// Synapse — moteur d'analyse d'un cours (français), sans IA ni réseau.
// Entrée : texte brut ou Markdown. Sortie : plan, définitions, dates,
// formules, listes, mots-clés et cartes de révision. Module pur (sans DOM).

const STOP = new Set(`a à ai aie ainsi alors au aucun aussi autre autres aux avant avec avoir bon car ce ceci cela celle celles celui ces cet cette ceux chaque ci comme comment dans de des du dedans dehors depuis devrait doit donc dos début elle elles en encore entre est et étaient état été être eu fait faites fois font hors ici il ils je juste la là le les leur leurs lui ma mais me même mes moins mon mot ni nommés notre nous on ont ou où par parce pas peu peut plupart pour pourquoi quand que quel quelle quelles quels qui sa sans se sera ses seulement si sien son sont sous soyez sujet sur ta tandis tellement tels tes ton tous tout toute toutes très tu un une vos votre vous vu ça étions été être d l qu n s c j m t y plus sont aussi elle il lors dont leurs ainsi entre cette selon chez vers après avant depuis pendant grâce partir permet permettent peuvent également nombreux nombreuses certains certaines sous forme deux trois premier première exemple cas connaître déroule objet chaque toujours souvent ensemble partie lieu fin début moment`.split(/\s+/));

const VERBS_DEF = '(?:est|sont|désigne|désignent|correspond à|correspondent à|consiste à|consistent à|se définit comme|se définissent comme|représente|représentent|signifie|signifient|caractérise|regroupe|regroupent)';

// Un « terme » ne contient pas de verbe conjugué (« la phase se déroule », « le bilan s'écrit »).
const NOT_TERM = /(?<![\p{L}'’])(se|s['’]\p{L}+|est|sont|ont|a|peut|peuvent|doit|fait|font|produit|déroule|écrit|montre|montrent|permet)(?![\p{L}])/iu;
// Une définition commence par un déterminant (« est le…, est un…, est l'ensemble… ») et non par un participe.
const DEF_START = /^(le|la|les|l['’]|un|une|des|du|de|d['’]|ce|cette|tout|toute|tous|toutes|celui|celle|ceux|un\s|une\s)/i;

const SMALL = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'à', 'au', 'aux', 'pour', 'sur', 'par', 'un', 'une', 'd', 'l']);

/**
 * Expression développée d'un sigle à partir des mots qui le précèdent :
 * « … adopte la Déclaration des droits de l'homme et du citoyen » + DDHC
 * → « Déclaration des droits de l'homme et du citoyen ».
 */
export function expandAcronym(before, abbr) {
  const words = before.trim().split(/\s+/).slice(-12);
  const letters = abbr.toLowerCase();
  const initial = (w) => strip(w.replace(/^[ldjmnst]['’]/i, ''))[0] || '';
  let partial = '';
  for (let i = 0; i < words.length; i++) {
    if (initial(words[i]) !== letters[0] || SMALL.has(strip(words[i]))) continue;
    const sig = words.slice(i).filter((w) => !SMALL.has(strip(w.replace(/^[ldjmnst]['’]/i, ''))));
    let k = 0;
    for (const w of sig) if (k < letters.length && initial(w) === letters[k]) k++;
    const phrase = words.slice(i).join(' ').replace(/[,;:]$/, '').replace(/^[ldjmnst]['’]/i, '').trim();
    if (k === letters.length && sig.length <= letters.length + 2) return phrase;
    // Sigles techniques (« adénosine triphosphate (ATP) ») : début et deux lettres au moins.
    if (k >= 2 && sig.length <= letters.length && (i === 0 || SMALL.has(strip(words[i - 1])) || /^[ldjmnst]['’]/i.test(words[i]))) partial ||= phrase;
  }
  return partial;
}

/** Nettoie le Markdown léger d'une ligne. */
const clean = (s) => String(s || '')
  .replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1')
  .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:!?]|$)/g, '$1$2').replace(/`([^`]+)`/g, '$1')
  .replace(/\s+/g, ' ').trim();

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const endDot = (s) => (/[.!?…]$/.test(s) ? s : `${s}.`);
const strip = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Découpe en phrases (en gardant abréviations et nombres décimaux). */
export function sentences(text) {
  return String(text)
    .replace(/\b(av|apr|J\.-C|etc|env|cf|ex|M|Mme|Dr|p|vol|n°)\./g, '$1§')
    .split(/(?<=[.!?…])\s+(?=[«"A-ZÀÂÉÈÊÎÔÛÇ0-9])/)
    .map((s) => s.replace(/§/g, '.').trim())
    .filter((s) => s.length > 2);
}

function isHeading(line, next) {
  const l = line.trim();
  if (/^#{1,4}\s+\S/.test(l)) return true;
  if (l.length > 90 || l.length < 3 || /[.;,]$/.test(l)) return false;
  if (/^([IVX]+|[0-9]+|[A-H])[.)]\s+\S/.test(l) && !/:\s*\S/.test(l)) return true;
  if (/^[A-ZÀÂÉÈÊÎÔÛÇ0-9 '’-]{4,}$/.test(l) && /[A-Z]{3}/.test(l)) return true;
  // Ligne courte sans ponctuation finale suivie d'un paragraphe.
  return !!next && next.trim().length > 60 && !/^[-*•]/.test(l) && !/:/.test(l) && l.split(' ').length <= 9 && /^[A-ZÀÂÉÈÊÎÔÛÇ]/.test(l);
}

const headingText = (l) => clean(l.replace(/^#{1,4}\s+/, '').replace(/^([IVX]+|[0-9]+|[A-H])[.)]\s+/, '')).replace(/:$/, '');

/**
 * Analyse un cours.
 * @param {string} raw
 * @returns {{title:string, sections:object[], definitions:object[], dates:object[], formulas:object[], lists:object[], acronyms:object[], keywords:{term:string, score:number}[], stats:object}}
 */
export function analyze(raw) {
  const text = String(raw || '').replace(/\r\n?/g, '\n').replace(/\t/g, ' ');
  const lines = text.split('\n');
  const sections = [];
  let current = null;
  let title = '';
  const push = (heading, level) => { current = { heading, level, paras: [], bullets: [], blocks: [] }; sections.push(current); };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const next = lines.slice(i + 1).find((l) => l.trim());
    if (isHeading(line, next)) {
      const level = (line.match(/^(#{1,4})\s/) || [, '##'])[1].length;
      const h = headingText(line);
      if (!title && (level === 1 || sections.length === 0) && !sections.some((s) => s.paras.length || s.bullets.length)) {
        if (level === 1 || !current) { title = h; if (level === 1) continue; }
      }
      push(h, level === 1 ? 2 : level);
      continue;
    }
    if (!current) push('', 2);
    if (/^\s*([-*•–]|\d+[.)])\s+/.test(line)) {
      const b = clean(line.replace(/^\s*([-*•–]|\d+[.)])\s+/, ''));
      current.bullets.push(b);
      const last = current.blocks[current.blocks.length - 1];
      if (last?.type === 'list') last.items.push(b);
      else current.blocks.push({ type: 'list', intro: last?.type === 'p' ? last.text : '', items: [b] });
    } else {
      const p = clean(line);
      current.paras.push(p);
      current.blocks.push({ type: 'p', text: p });
    }
  }
  if (!title) title = sections.find((s) => s.heading)?.heading || 'Mon cours';

  const definitions = [], dates = [], formulas = [], lists = [], acronyms = [];
  const seenTerms = new Set();
  const addDef = (term, def, section, source) => {
    term = clean(term).replace(/^(?:(?:les|le|la|une|un|des)\s+|l['’]\s*)/i, '').replace(/[«»"]/g, '').trim();
    def = clean(def).replace(/^[:,\s-]+/, '').trim();
    const key = strip(term);
    if (term.length < 2 || term.length > 60 || def.length < 8 || term.split(' ').length > 7 || seenTerms.has(key)) return;
    if (/^(il|elle|ils|elles|on|ce|cela|ceci|cette|celui|celle|qui|que|c|nous|vous|son|sa|ses|leur|leurs)$/i.test(term.split(' ')[0])) return;
    seenTerms.add(key);
    definitions.push({ term: cap(term), def: endDot(cap(def)), section, source });
  };

  for (const sec of sections) {
    const where = sec.heading;
    // Listes à puces, introduites par la phrase qui les précède (« … : ») ou par le titre.
    for (const blk of sec.blocks) {
      if (blk.type !== 'list' || blk.items.length < 2) continue;
      const intro = /:\s*$/.test(blk.intro) ? blk.intro : (where || blk.intro || 'cette notion');
      const label = intro.replace(/\s*:\s*$/, '');
      const items = blk.items.map((b) => b.replace(/\s*:\s.*$/, '').replace(/[.;]$/, '')).filter((b) => b.length < 80);
      if (items.length >= 2 && items.length <= 9) { lists.push({ label: cap(label), items, section: where }); blk.listed = true; }
    }
    // Puces « terme : définition ».
    for (const b of sec.bullets) {
      const m = b.match(/^([^:]{2,60}?)\s*[:–—]\s+(.{8,})$/);
      if (m) addDef(m[1], m[2], where, b);
    }
    for (const para of [...sec.paras, ...sec.bullets]) {
      for (const s of sentences(para)) {
        let m;
        if ((m = s.match(/^([^:]{2,60}?)\s*:\s+(.{8,})$/)) && !/\d{3,4}/.test(m[1]) && !NOT_TERM.test(m[1])) addDef(m[1], m[2], where, s);
        else if ((m = s.match(/^On (?:appelle|nomme|désigne par)\s+(.{2,60}?)\s*,?\s+(l['’]ensemble|le|la|les|un|une|des|ce|toute?)\s+(.{8,})$/i))) addDef(m[1], `${m[2]} ${m[3]}`, where, s);
        else if ((m = s.match(new RegExp(`^(?:(?:Les|Le|La|L['’]|Une|Un)\\s*)?([A-ZÀÂÉÈÊÎÔÛÇa-zàâéèêîôûç0-9'’ -]{2,50}?)(?:\\s*\\([^)]{1,40}\\))?\\s*,?\\s+${VERBS_DEF}\\s+(.{8,})$`)))) {
          if (m[1].split(' ').length <= 6 && DEF_START.test(m[2]) && !NOT_TERM.test(m[1])) addDef(m[1], m[2], where, s);
        } else if ((m = s.match(/^(.{2,50}?),\s*c['’]est\s+(.{8,})$/i))) addDef(m[1], m[2], where, s);

        // Sigles : « ADN (acide désoxyribonucléique) » ou « acide désoxyribonucléique (ADN) ».
        for (const a of s.matchAll(/\b([A-Z][A-Z0-9]{1,7})\s*\(([^)]{6,60})\)/g)) if (!/^\d/.test(a[2])) acronyms.push({ abbr: a[1], full: a[2].trim(), section: where });
        for (const a of s.matchAll(/\(([A-Z][A-Z0-9]{1,7})\)/g)) {
          const full = expandAcronym(s.slice(0, a.index), a[1]);
          if (full) acronyms.push({ abbr: a[1], full, section: where });
        }

        // Dates (années de 3 ou 4 chiffres, « av. J.-C. » compris).
        const y = s.match(/\b(?:en|depuis|dès|vers|le|du|au|à partir de|entre)?\s*((?:\d{1,2}(?:er)?\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+)?(\d{3,4}))(\s*av\.?\s*J\.?-?C\.?)?\b/i);
        if (y && +y[2] >= 300 && +y[2] <= 2100 && !/\b\d{3,4}\s*(?:km|m|kg|g|°|%|euros?|€|habitants|mètres|litres)/i.test(s)) {
          const year = +y[2] * (y[3] ? -1 : 1);
          dates.push({ year, label: y[1].trim() + (y[3] ? ' av. J.-C.' : ''), text: endDot(s), section: where });
        }
        // Équations de réaction (« … → … »).
        if (s.includes('→') && s.length < 200) {
          const eq = s.split(/:\s+/).pop().trim().replace(/[.]$/, '');
          if (/→/.test(eq) && eq.length < 90) formulas.push({ formula: eq, context: endDot(s), section: where, arrow: true });
        }
        // Formules : une égalité avec des symboles.
        if (/[A-Za-zΔ][A-Za-z0-9₀-₉²³ΔΣπ]*\s*=\s*[^=]{1,60}/.test(s) && /[=]/.test(s) && !/https?:/.test(s) && s.length < 160) {
          const f = s.match(/([A-Za-zΔ][^=:]{0,30}?=\s*[^,;]{1,60})/);
          if (f) formulas.push({ formula: f[1].trim().replace(/[.]$/, ''), context: endDot(s), section: where });
        }
      }
    }
  }

  // Mots-clés : fréquence pondérée (termes définis, majuscules, titres).
  const freq = new Map();
  const add = (w, k = 1) => freq.set(w, (freq.get(w) || 0) + k);
  const all = sections.flatMap((s) => [...s.paras, ...s.bullets]).join(' ');
  for (const w of all.match(/[A-Za-zÀ-ÖØ-öø-ÿ'’-]{4,}/g) || []) {
    const n = w.toLowerCase().replace(/^[ldjmnst]['’]/, '');
    if (n.length < 4 || STOP.has(n)) continue;
    add(n, /^[A-ZÀ-Ö]/.test(w) && !/^[A-ZÀ-Ö][a-zà-ÿ]+$/.test(w) ? 2 : 1);
  }
  for (const s of sections) for (const w of (s.heading.match(/[A-Za-zÀ-ÖØ-öø-ÿ'’-]{4,}/g) || [])) { const n = w.toLowerCase(); if (!STOP.has(n)) add(n, 2); }
  for (const d of definitions) add(d.term.toLowerCase(), 4);
  const keywords = [...freq.entries()]
    .filter(([w, n]) => n >= 2 && !/^\d/.test(w))
    .sort((a, b) => b[1] - a[1]).slice(0, 14)
    .map(([term, score]) => ({ term, score }));

  // Une phrase déjà retenue comme définition n'est pas répétée comme date.
  const defSources = new Set(definitions.map((d) => endDot(d.source)));
  for (let i = dates.length - 1; i >= 0; i--) if (defSources.has(dates[i].text)) dates.splice(i, 1);
  dates.sort((a, b) => a.year - b.year);
  const uniq = (arr, key) => { const seen = new Set(); return arr.filter((x) => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; }); };
  const words = all.split(/\s+/).filter(Boolean).length;

  return {
    title,
    sections: sections.filter((s) => s.heading || s.paras.length || s.bullets.length),
    definitions,
    dates: uniq(dates, (d) => d.text),
    formulas: uniq(formulas, (f) => f.formula),
    lists,
    acronyms: uniq(acronyms, (a) => a.abbr),
    keywords,
    stats: { words, minutes: Math.max(1, Math.round(words / 200)) },
  };
}

/** Phrase importante de chaque section, pour les cartes « texte à trous ». */
function clozeCandidates(a) {
  const terms = [...a.definitions.map((d) => d.term), ...a.keywords.slice(0, 10).map((k) => k.term)];
  const out = [];
  const sources = new Set(a.definitions.map((d) => d.source));
  for (const sec of a.sections) {
    for (const p of sec.paras) {
      for (const s of sentences(p)) {
        if (s.length < 40 || s.length > 220 || /:\s*$/.test(s) || sources.has(s)) continue;
        const t = terms.find((t) => t.length > 3 && new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(s));
        if (t) out.push({ s, t, section: sec.heading });
      }
    }
  }
  return out;
}

let uid = 0;
const id = (p) => `${p}${(++uid).toString(36)}`;

/**
 * Cartes de révision tirées de l'analyse.
 * @returns {{id:string, kind:string, q:string, a:string, section:string}[]}
 */
export function makeCards(a) {
  const cards = [];
  for (const d of a.definitions) cards.push({ id: id('d'), kind: 'définition', q: `Qu’est-ce que : ${d.term} ?`, a: d.def, section: d.section });
  for (const ac of a.acronyms) cards.push({ id: id('s'), kind: 'sigle', q: `Que signifie ${ac.abbr} ?`, a: cap(ac.full), section: ac.section });
  for (const d of a.dates) cards.push({ id: id('t'), kind: 'date', q: `Que s’est-il passé en ${d.label} ?`, a: d.text, section: d.section });
  for (const f of a.formulas) {
    const [lhs] = f.formula.split(f.arrow ? '→' : '=');
    cards.push({ id: id('f'), kind: 'formule', q: f.arrow ? `Complétez l’équation : ${lhs.trim()} → ?` : `Complétez la formule : ${lhs.trim()} = ?`, a: f.formula, section: f.section });
  }
  for (const l of a.lists) cards.push({ id: id('l'), kind: 'liste', q: `${l.label.replace(/[.:]$/, '')} : citez les ${l.items.length} éléments.`, a: l.items.map((x, i) => `${i + 1}. ${x}`).join('\n'), section: l.section });
  const used = new Set(cards.map((c) => c.a));
  for (const c of clozeCandidates(a).slice(0, 12)) {
    if (used.has(c.s)) continue;
    const re = new RegExp(`\\b${c.t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const hit = c.s.match(re)[0];
    cards.push({ id: id('c'), kind: 'texte à trous', q: c.s.replace(re, '_____'), a: hit, section: c.section, full: c.s });
    used.add(c.s);
  }
  return cards;
}

/** QCM à partir des définitions (leurres : les autres définitions). */
export function makeQuiz(a, rnd = Math.random) {
  const defs = a.definitions;
  if (defs.length < 3) return [];
  const shuffle = (arr) => { const x = [...arr]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  return shuffle(defs).map((d) => {
    const wrong = shuffle(defs.filter((o) => o !== d)).slice(0, 3);
    const options = shuffle([d, ...wrong]);
    return { q: `Quelle est la définition de « ${d.term} » ?`, options: options.map((o) => o.def), answer: options.indexOf(d), term: d.term };
  });
}
