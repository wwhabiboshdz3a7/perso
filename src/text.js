// Texte : découpage accessible, décodage, machine à écrire, compteur à rouleaux.
import { resolveTargets } from './targets.js';
import { animate } from './animation.js';
import { timeline } from './timeline.js';
import { createRandom, isStr, isArr, hasDOM } from './utils.js';
import { isReduced } from './engine.js';

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const graphemes = (s) => (segmenter ? [...segmenter.segment(s)].map((x) => x.segment) : [...s]);

function span(cls, text) {
  const s = document.createElement('span');
  s.className = cls;
  if (text !== undefined) s.textContent = text;
  return s;
}

function className(opt, fallback) {
  return isStr(opt) ? opt : fallback;
}

// —— Nom accessible ——
// aria-label n'est autorisé que sur les éléments dont le rôle accepte un nom (titres, liens,
// boutons, sections…). Sur un élément générique (p, div, span…), ARIA l'interdit : on ajoute
// alors une copie du texte, masquée visuellement mais lue par les lecteurs d'écran.
const NAMEABLE = /^(H[1-6]|A|BUTTON|LI|NAV|MAIN|ARTICLE|ASIDE|SECTION|FIGURE|FORM|DIALOG|SUMMARY|TD|TH|BLOCKQUOTE)$/;
const UNNAMEABLE_ROLES = new Set(['generic', 'paragraph', 'presentation', 'none', 'code', 'emphasis', 'strong', 'deletion',
  'insertion', 'subscript', 'superscript', 'caption', 'mark', 'time', 'term']);
// user-select: none : la copie masquée n'est pas collée en double avec le texte visible
const SR_STYLE = 'position:absolute;left:0;top:0;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;-webkit-user-select:none;user-select:none';

// Éléments interactifs : ils restent atteignables au clavier et nommés, jamais aria-hidden.
const INTERACTIVE = 'a[href],button,input,select,textarea,summary,iframe,audio[controls],video[controls],[tabindex],[contenteditable]:not([contenteditable="false"])';
const isInteractive = (n) => n.nodeType === 1 && n.matches(INTERACTIVE) && n.getAttribute('tabindex') !== '-1';
const hasInteractive = (n) => isInteractive(n) || [...n.querySelectorAll(INTERACTIVE)].some(isInteractive);

// Découpages et effets en cours, pour revenir à l'état d'origine avant d'en relancer un.
const splits = new WeakMap();
const typers = new WeakMap();
const originals = new WeakMap();

/**
 * Partie visible d'un effet qui réécrit le texte : l'élément lui-même s'il porte un aria-label,
 * sinon un <span aria-hidden> (réutilisé d'un appel à l'autre) à côté de la copie masquée.
 */
function visualHost(el, named, cls) {
  if (named) return el;
  let host = [...el.children].find((c) => c.classList.contains(cls));
  if (!host) {
    host = span(cls, el.textContent);
    host.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    el.appendChild(host);
  }
  return host;
}

/** L'élément peut-il porter un aria-label ? */
export function canBeNamed(el) {
  const role = el.getAttribute('role');
  if (role) return !UNNAMEABLE_ROLES.has(role.trim().split(/\s+/)[0]);
  return NAMEABLE.test(el.tagName.toUpperCase());
}

/** Donne à `el` un nom accessible stable : { named, set(texte), revert() }. */
function accessibleName(el) {
  if (canBeNamed(el)) {
    // un aria-label posé par l'auteur est respecté ; celui posé par Kinetika suit le texte
    const ours = el.hasAttribute('data-kt-label');
    const had = el.hasAttribute('aria-label') && !ours;
    const prev = el.getAttribute('aria-label');
    return {
      named: true,
      set(text) {
        if (had) return;
        el.setAttribute('aria-label', text);
        el.setAttribute('data-kt-label', '');
      },
      revert() {
        el.removeAttribute('data-kt-label');
        if (had) el.setAttribute('aria-label', prev); else el.removeAttribute('aria-label');
      },
    };
  }
  const find = () => [...el.children].find((c) => c.classList.contains('kt-sr'));
  return {
    named: false,
    set(text) {
      let sr = find();
      if (!sr) {
        sr = span('kt-sr', '');
        sr.style.cssText = SR_STYLE;
        el.appendChild(sr);
      }
      sr.textContent = text;
    },
    revert() { const sr = find(); if (sr) sr.remove(); },
  };
}

/**
 * Découpe le texte d'un élément en lignes, mots et/ou caractères.
 * splitText('h1', { chars: true, words: true, lines: true, mask: 'lines' })
 * Les morceaux sont aria-hidden ; l'élément garde son texte lisible : aria-label sur un titre,
 * un lien ou un bouton, copie masquée visuellement (.kt-sr) sur un élément générique.
 */
export function splitText(target, opts = {}) {
  const el = resolveTargets(target)[0];
  const wantChars = opts.chars ?? (opts.words === undefined && opts.lines === undefined);
  const wantWords = opts.words ?? true;
  const wantLines = !!opts.lines;
  const mask = opts.mask === true ? (wantLines ? 'lines' : wantWords ? 'words' : 'chars') : opts.mask;
  const cls = {
    char: className(opts.chars, 'kt-char'),
    word: className(opts.words, 'kt-word'),
    line: className(opts.lines, 'kt-line'),
    mask: opts.maskClass || 'kt-mask',
  };
  const result = { el, chars: [], words: [], lines: [], masks: [], revert, refresh };
  if (!el) return result;
  // déjà découpé : on rétablit l'original avant de redécouper (pas de morceaux dans les morceaux)
  const previous = splits.get(el);
  if (previous) previous.revert();

  const original = el.innerHTML;
  const name = accessibleName(el);
  const text = el.textContent.replace(/\s+/g, ' ').trim();

  function wrapMask(node, kind) {
    const m = span(cls.mask);
    m.style.display = kind === 'lines' ? 'block' : 'inline-block';
    m.style.overflow = 'clip';
    m.style.verticalAlign = 'top';
    // laisse respirer les jambages sans afficher ce qui sort du masque
    m.style.paddingBlock = '0.08em';
    m.style.marginBlock = '-0.08em';
    node.replaceWith(m);
    m.appendChild(node);
    result.masks.push(m);
    return m;
  }

  function splitTextNode(node, frag) {
    const parts = node.textContent.split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); continue; }
      const word = span(cls.word);
      word.style.display = 'inline-block';
      word.style.whiteSpace = 'nowrap';
      word.setAttribute('aria-hidden', 'true');
      if (wantChars) {
        for (const g of graphemes(part)) {
          const c = span(cls.char, g);
          c.style.display = 'inline-block';
          word.appendChild(c);
          result.chars.push(c);
        }
      } else word.textContent = part;
      frag.appendChild(word);
      result.words.push(word);
    }
  }

  function walk(parent) {
    const kids = [...parent.childNodes];
    for (const node of kids) {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        splitTextNode(node, frag);
        node.replaceWith(frag);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        if (isInteractive(node)) {
          // lien, bouton… : il garde son nom (ses morceaux sont aria-hidden) et reste focalisable
          const label = node.textContent.replace(/\s+/g, ' ').trim();
          if (label && !node.hasAttribute('aria-label') && !node.hasAttribute('aria-labelledby')) node.setAttribute('aria-label', label);
          walk(node);
        } else {
          walk(node);
          if (!node.hasAttribute('aria-hidden') && !hasInteractive(node)) node.setAttribute('aria-hidden', 'true');
        }
      }
    }
  }

  function build() {
    el.innerHTML = original;
    result.chars.length = 0; result.words.length = 0; result.lines.length = 0; result.masks.length = 0;
    walk(el);
    if (wantLines) groupLines();
    if (mask === 'chars') result.chars.forEach((c) => wrapMask(c, 'chars'));
    if (mask === 'words') result.words.forEach((w) => wrapMask(w, 'words'));
    if (mask === 'lines') result.lines.forEach((l) => wrapMask(l, 'lines'));
    if (text) name.set(text);
  }

  function groupLines() {
    // Regroupement au niveau des mots : un <em> ou un <a> de plusieurs mots qui passe à la
    // ligne est coupé en deux, sa chaîne d'ancêtres étant recréée (cloneNode) dans la ligne suivante.
    const words = new Set(result.words);
    const withWords = new Set();
    for (const w of result.words) for (let p = w.parentNode; p && p !== el; p = p.parentNode) withWords.add(p);
    const leaves = [];
    const collect = (parent) => {
      for (const n of [...parent.childNodes]) {
        if (n.nodeType === 1 && !words.has(n) && n.tagName !== 'BR' && withWords.has(n)) collect(n);
        else if (n.nodeType === 1 || n.nodeType === 3) leaves.push(n);
      }
    };
    collect(el);
    // On ne change de ligne que si le mot descend de plus de la moitié de sa hauteur.
    const rows = [];
    let current = null;
    let lastTop = null;
    for (const leaf of leaves) {
      if (leaf.nodeType === 1 && leaf.tagName === 'BR') { current = null; lastTop = null; continue; }
      if (words.has(leaf)) {
        const r = leaf.getBoundingClientRect();
        if (current && lastTop !== null && r.top - lastTop > Math.max(2, r.height * 0.5)) current = null;
        lastTop = r.top;
      }
      if (!current) { current = []; rows.push(current); }
      current.push(leaf);
    }
    const blank = (n) => n.nodeType === 3 && !n.textContent.trim();
    const cloned = new Set();
    for (const row of rows) {
      // les espaces en bord de ligne sont retirés
      while (row.length && blank(row[0])) row.shift().remove();
      while (row.length && blank(row[row.length - 1])) row.pop().remove();
      if (!row.length) continue;
      const line = span(cls.line);
      line.style.display = 'block';
      let chain = [];
      for (const leaf of row) {
        const anc = [];
        for (let p = leaf.parentNode; p && p !== el; p = p.parentNode) anc.unshift(p);
        let k = 0;
        while (k < chain.length && k < anc.length && chain[k].orig === anc[k]) k++;
        chain = chain.slice(0, k);
        for (let j = k; j < anc.length; j++) {
          const orig = anc[j];
          const copy = orig.cloneNode(false);
          if (cloned.has(orig)) {
            // suite d'un élément commencé sur la ligne précédente : un seul arrêt clavier, un seul id
            copy.removeAttribute('id');
            if (isInteractive(orig)) { copy.setAttribute('tabindex', '-1'); copy.setAttribute('aria-hidden', 'true'); }
          }
          cloned.add(orig);
          (j === 0 ? line : chain[j - 1].copy).appendChild(copy);
          chain.push({ orig, copy });
        }
        (chain.length ? chain[chain.length - 1].copy : line).appendChild(leaf);
      }
      if (!hasInteractive(line)) line.setAttribute('aria-hidden', 'true');
      result.lines.push(line);
    }
    el.textContent = '';
    for (const line of result.lines) el.appendChild(line);
  }

  function revert() {
    if (splits.get(el) !== result) return result;
    el.innerHTML = original;
    name.revert();
    el.removeAttribute('data-kt-split');
    splits.delete(el);
    result.chars.length = 0; result.words.length = 0; result.lines.length = 0; result.masks.length = 0;
    return result;
  }

  /** Recalcule le découpage (utile pour les lignes après un redimensionnement). */
  function refresh() {
    if (splits.get(el) !== result) return result;
    build();
    return result;
  }

  splits.set(el, result);
  el.setAttribute('data-kt-split', '');
  build();
  return result;
}

/** innerHTML d'origine d'un élément, mémorisé au premier effet qui le réécrit. */
function rememberOriginal(el) {
  if (!originals.has(el)) originals.set(el, el.innerHTML);
  return originals.get(el);
}

function restoreOriginal(el) {
  if (originals.has(el)) {
    el.innerHTML = originals.get(el);
    originals.delete(el);
  }
}

const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFGHKXZ';

/**
 * Décodage : le texte apparaît à travers des glyphes aléatoires.
 * Renvoie une animation (utilisable dans une timeline).
 */
export function scramble(target, opts = {}) {
  const els = resolveTargets(target);
  const chars = opts.chars || GLYPHS;
  const rng = createRandom(opts.seed ?? 7);
  const fps = opts.fps ?? 24;
  const names = [];
  const states = els.map((el) => {
    rememberOriginal(el);
    const name = accessibleName(el);
    names.push(name);
    const host = visualHost(el, name.named, 'kt-scramble');
    const finalText = graphemes(opts.text ?? host.textContent);
    const from = graphemes(host.textContent);
    name.set(finalText.join(''));
    // seuil de révélation de chaque caractère, de gauche à droite ou dans le désordre
    const n = finalText.length || 1;
    const order = opts.reveal === 'random' ? rng.shuffle([...Array(n).keys()]) : [...Array(n).keys()];
    const thresholds = [];
    order.forEach((idx, rank) => { thresholds[idx] = 0.2 + 0.8 * (rank / n); });
    return { el: host, finalText, from, thresholds, last: -1 };
  });
  const proxy = { p: 0 };
  const glyph = () => chars[Math.floor(rng() * chars.length)];
  const anim = animate(proxy, {
    p: [0, 1],
    duration: opts.duration ?? 1600,
    delay: opts.delay ?? 0,
    ease: opts.ease ?? 'linear',
    autoplay: opts.autoplay,
    loop: opts.loop,
    reducedMotion: opts.reducedMotion,
    onBegin: opts.onBegin,
    onComplete: (a) => {
      for (const st of states) st.el.textContent = st.finalText.join('');
      if (opts.onComplete) opts.onComplete(a);
    },
    onUpdate: (a) => {
      const p = proxy.p;
      const frame = Math.floor((a.currentTime / 1000) * fps);
      for (const st of states) {
        if (frame === st.last && p > 0 && p < 1) continue;
        st.last = frame;
        let out = '';
        st.finalText.forEach((ch, i) => {
          if (/\s/.test(ch)) { out += ch; return; }
          if (p >= 1 || p >= st.thresholds[i]) out += ch;
          else if (p <= 0) out += st.from[i] ?? '';
          else out += glyph();
        });
        st.el.textContent = out;
      }
      if (opts.onUpdate) opts.onUpdate(a);
    },
  });
  // revert() : arrêt et retour au contenu d'origine (texte, balises, nom accessible)
  const baseRevert = anim.revert.bind(anim);
  anim.revert = () => {
    baseRevert();
    els.forEach((el, i) => { restoreOriginal(el); names[i].revert(); });
    return anim;
  };
  return anim;
}

/**
 * Machine à écrire. `text` peut être une liste : chaque phrase est tapée puis effacée.
 * Renvoie une animation (ou une timeline pour une liste).
 */
export function typewriter(target, opts = {}) {
  const el = resolveTargets(target)[0];
  if (!el) return animate({}, { duration: 0 });
  // une machine à écrire déjà active sur cet élément est d'abord arrêtée et annulée
  const running = typers.get(el);
  if (running) running.revert();
  const original = el.innerHTML;
  const texts = isArr(opts.text) ? opts.text : [opts.text ?? el.textContent];
  const cps = opts.speed ?? 22;
  const textNode = document.createTextNode('');
  const caret = opts.cursor === false ? null : span('kt-caret', opts.cursorChar ?? '▍');
  el.textContent = '';
  const name = accessibleName(el);
  // élément générique : le texte tapé vit dans un <span aria-hidden>, la phrase complète dans .kt-sr
  const host = name.named ? el : span('kt-type');
  if (host !== el) {
    host.setAttribute('aria-hidden', 'true');
    el.appendChild(host);
  }
  host.appendChild(textNode);
  if (caret) {
    caret.setAttribute('aria-hidden', 'true');
    caret.style.marginLeft = '0.05em';
    host.appendChild(caret);
  }
  name.set(texts.join(' '));
  let blink = null;
  // clignotement : visible, masqué, visible (état final lisible en mouvement réduit)
  if (caret) blink = animate(caret, { opacity: [1, 0, 1], duration: 1060, ease: 'steps(1)', loop: true });

  const typeOne = (str, erase) => {
    const g = graphemes(str);
    const proxy = { n: erase ? g.length : 0 };
    return animate(proxy, {
      n: erase ? [g.length, 0] : [0, g.length],
      duration: Math.max(1, (g.length / (erase ? cps * 2.4 : cps)) * 1000),
      ease: 'linear',
      autoplay: false,
      onUpdate: () => { textNode.data = g.slice(0, Math.round(proxy.n)).join(''); },
    });
  };

  // revert() : arrêt du curseur et retour au contenu d'origine
  const finish = (tl) => {
    tl.caret = caret;
    tl.blink = blink;
    const baseRevert = tl.revert.bind(tl);
    tl.revert = () => {
      baseRevert();
      if (blink) blink.revert();
      if (typers.get(el) === tl) {
        el.innerHTML = original;
        name.revert();
        typers.delete(el);
      }
      return tl;
    };
    typers.set(el, tl);
    return tl;
  };

  if (texts.length === 1) {
    const a = typeOne(texts[0], false);
    const tl = timeline({ delay: opts.delay ?? 0, autoplay: opts.autoplay ?? true, loop: opts.loop, onComplete: opts.onComplete, reducedMotion: opts.reducedMotion });
    tl.add(a);
    return finish(tl);
  }
  const tl = timeline({
    delay: opts.delay ?? 0,
    autoplay: opts.autoplay ?? true,
    loop: opts.loop ?? true,
    reducedMotion: opts.reducedMotion,
    onComplete: (a) => {
      // en mouvement réduit, on laisse la première phrase lisible plutôt qu'un texte effacé
      if (isReduced() && opts.reducedMotion !== false) textNode.data = texts[0];
      if (opts.onComplete) opts.onComplete(a);
    },
  });
  texts.forEach((t) => {
    tl.add(typeOne(t, false));
    tl.add(typeOne(t, true), `+=${opts.hold ?? 1400}`);
    tl.call(() => {}, `+=${opts.gap ?? 300}`);
  });
  return finish(tl);
}

/**
 * Compteur à rouleaux. odometer('.prix', { value: 1290 }) puis .set(4500).
 */
export function odometer(target, opts = {}) {
  const el = resolveTargets(target)[0];
  // tours complets ajoutés par chiffre (0 : le rouleau va directement au chiffre)
  const turns = Math.max(0, Math.floor(+(opts.turns ?? 1) || 0));
  const N = 10 * (turns + 1);
  const cols = [];
  let current = String(opts.from ?? '');
  const row = hasDOM ? span('kt-odometer') : null;
  if (el && row) {
    row.style.display = 'inline-flex';
    row.style.fontVariantNumeric = 'tabular-nums';
    row.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    el.appendChild(row);
  }
  // nom accessible : aria-label sur un titre, copie masquée sur un élément générique
  const name = el && row ? accessibleName(el) : null;

  const layout = (str) => {
    const s = [...str];
    if (cols.length === s.length && cols.every((c, i) => c.digit === /\d/.test(s[i]))) return;
    row.textContent = '';
    cols.length = 0;
    s.forEach((ch) => {
      if (/\d/.test(ch)) {
        const win = span('kt-odo-win');
        win.style.cssText = 'display:inline-block;height:1.1em;line-height:1.1em;overflow:hidden;vertical-align:top';
        const strip = span('kt-odo-strip');
        strip.style.cssText = 'display:flex;flex-direction:column';
        for (let k = 0; k < N; k++) {
          const d = span('', String(k % 10));
          d.style.cssText = 'display:block;height:1.1em;text-align:center';
          strip.appendChild(d);
        }
        win.appendChild(strip);
        row.appendChild(win);
        strip.style.transform = `translateY(${(-100 * +ch) / N}%)`;
        cols.push({ digit: true, strip, pos: +ch });
      } else {
        const st = span('kt-odo-sep', ch);
        st.style.cssText = 'display:inline-block;line-height:1.1em';
        row.appendChild(st);
        cols.push({ digit: false });
      }
    });
  };

  const api = {
    get value() { return current; },
    animation: null,
    set(value, o = {}) {
      const str = String(value);
      if (!el) return null;
      layout(str);
      name.set(str);
      const tl = timeline({ autoplay: o.autoplay ?? true, reducedMotion: o.reducedMotion ?? opts.reducedMotion });
      const s = [...str];
      const duration = o.duration ?? opts.duration ?? 1800;
      const ease = o.ease ?? opts.ease ?? 'inOutExpo';
      const each = o.stagger ?? opts.stagger ?? 80;
      s.forEach((ch, i) => {
        const c = cols[i];
        if (!c.digit) return;
        const target = +ch + (turns ? 10 * (1 + ((s.length - i) % turns)) : 0);
        const fromPos = c.pos % 10;
        tl.add(c.strip, { y: [`${(-100 * fromPos) / N}%`, `${(-100 * target) / N}%`], duration, ease }, (s.length - 1 - i) * each);
        c.pos = target;
      });
      current = str;
      api.animation = tl;
      return tl;
    },
    revert() {
      if (el) el.textContent = current;
      if (name) name.revert();
    },
  };
  if (el && (opts.value !== undefined || opts.from !== undefined)) {
    // état affiché d'emblée : `from`, ou la valeur avec des zéros
    current = String(opts.from ?? String(opts.value).replace(/\d/g, '0'));
    layout(current);
    name.set(current);
    if (opts.value !== undefined && opts.autoplay !== false) api.set(opts.value);
  }
  return api;
}
