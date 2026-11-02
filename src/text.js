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

/**
 * Découpe le texte d'un élément en lignes, mots et/ou caractères.
 * splitText('h1', { chars: true, words: true, lines: true, mask: 'lines' })
 * L'élément garde son nom accessible (aria-label), les morceaux sont aria-hidden.
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

  const original = el.innerHTML;
  const hadLabel = el.hasAttribute('aria-label');
  const label = el.getAttribute('aria-label');
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
        walk(node);
        if (!node.hasAttribute('aria-hidden')) node.setAttribute('aria-hidden', 'true');
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
    if (!hadLabel && text) el.setAttribute('aria-label', text);
  }

  function groupLines() {
    // regroupe les nœuds de premier niveau selon leur position verticale
    const top = [...el.childNodes];
    const rows = [];
    let current = null;
    let lastTop = null;
    for (const node of top) {
      let y = lastTop;
      if (node.nodeType === 1) {
        const r = node.getBoundingClientRect();
        y = node.offsetTop ?? r.top;
        if (node.tagName === 'BR') { current = null; lastTop = null; continue; }
      }
      if (!current || (y !== null && lastTop !== null && Math.abs(y - lastTop) > 2)) {
        current = [];
        rows.push(current);
      }
      current.push(node);
      if (node.nodeType === 1) lastTop = y;
    }
    for (const row of rows) {
      // les espaces en bord de ligne sont retirés
      while (row.length && row[0].nodeType === 3 && !row[0].textContent.trim()) row.shift().remove();
      while (row.length && row[row.length - 1].nodeType === 3 && !row[row.length - 1].textContent.trim()) row.pop().remove();
      if (!row.length) continue;
      const line = span(cls.line);
      line.style.display = 'block';
      line.setAttribute('aria-hidden', 'true');
      row[0].before(line);
      for (const n of row) line.appendChild(n);
      result.lines.push(line);
    }
    // supprime les <br> restants (les lignes sont des blocs)
    el.querySelectorAll(':scope > br').forEach((b) => b.remove());
  }

  function revert() {
    el.innerHTML = original;
    if (!hadLabel) el.removeAttribute('aria-label');
    else el.setAttribute('aria-label', label);
    result.chars.length = 0; result.words.length = 0; result.lines.length = 0; result.masks.length = 0;
    return result;
  }

  /** Recalcule le découpage (utile pour les lignes après un redimensionnement). */
  function refresh() {
    build();
    return result;
  }

  build();
  return result;
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
  const states = els.map((el) => {
    const finalText = graphemes(opts.text ?? el.textContent);
    const from = graphemes(el.textContent);
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', finalText.join(''));
    // seuil de révélation de chaque caractère, de gauche à droite ou dans le désordre
    const n = finalText.length || 1;
    const order = opts.reveal === 'random' ? rng.shuffle([...Array(n).keys()]) : [...Array(n).keys()];
    const thresholds = [];
    order.forEach((idx, rank) => { thresholds[idx] = 0.2 + 0.8 * (rank / n); });
    return { el, finalText, from, thresholds, last: -1 };
  });
  const proxy = { p: 0 };
  const glyph = () => chars[Math.floor(rng() * chars.length)];
  return animate(proxy, {
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
}

/**
 * Machine à écrire. `text` peut être une liste : chaque phrase est tapée puis effacée.
 * Renvoie une animation (ou une timeline pour une liste).
 */
export function typewriter(target, opts = {}) {
  const el = resolveTargets(target)[0];
  if (!el) return animate({}, { duration: 0 });
  const texts = isArr(opts.text) ? opts.text : [opts.text ?? el.textContent];
  const cps = opts.speed ?? 22;
  const textNode = document.createTextNode('');
  const caret = opts.cursor === false ? null : span('kt-caret', opts.cursorChar ?? '▍');
  el.textContent = '';
  el.appendChild(textNode);
  if (caret) {
    caret.setAttribute('aria-hidden', 'true');
    caret.style.marginLeft = '0.05em';
    el.appendChild(caret);
  }
  if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', texts.join(' '));
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

  if (texts.length === 1) {
    const a = typeOne(texts[0], false);
    const tl = timeline({ delay: opts.delay ?? 0, autoplay: opts.autoplay ?? true, loop: opts.loop, onComplete: opts.onComplete, reducedMotion: opts.reducedMotion });
    tl.add(a);
    tl.caret = caret; tl.blink = blink;
    return tl;
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
  tl.caret = caret; tl.blink = blink;
  return tl;
}

/**
 * Compteur à rouleaux. odometer('.prix', { value: 1290 }) puis .set(4500).
 */
export function odometer(target, opts = {}) {
  const el = resolveTargets(target)[0];
  const turns = opts.turns ?? 1;
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
      el.setAttribute('aria-label', str);
      const tl = timeline({ autoplay: o.autoplay ?? true, reducedMotion: o.reducedMotion ?? opts.reducedMotion });
      const s = [...str];
      const duration = o.duration ?? opts.duration ?? 1800;
      const ease = o.ease ?? opts.ease ?? 'inOutExpo';
      const each = o.stagger ?? opts.stagger ?? 80;
      s.forEach((ch, i) => {
        const c = cols[i];
        if (!c.digit) return;
        const target = +ch + 10 * (1 + ((s.length - i) % turns));
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
      if (el) el.removeAttribute('aria-label');
    },
  };
  if (el && (opts.value !== undefined || opts.from !== undefined)) {
    // état affiché d'emblée : `from`, ou la valeur avec des zéros
    current = String(opts.from ?? String(opts.value).replace(/\d/g, '0'));
    layout(current);
    el.setAttribute('aria-label', current);
    if (opts.value !== undefined && opts.autoplay !== false) api.set(opts.value);
  }
  return api;
}
