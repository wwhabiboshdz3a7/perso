// Rendu Markdown sûr : marked → HTML, coloration highlight.js, formules KaTeX (chargé à la demande),
// puis nettoyage systématique par DOMPurify. Le HTML brut écrit par le modèle est affiché comme du texte.

import { Marked } from '../vendor/marked/marked.esm.js';
import DOMPurify from '../vendor/dompurify/purify.es.mjs';
import hljs from '../vendor/highlight/highlight.min.js';
import { esc, icon } from './util.js';

/* ---------- KaTeX à la demande ---------- */
let katexState = 'idle';
const mathWaiters = new Set();

export function onMathReady(fn) { mathWaiters.add(fn); return () => mathWaiters.delete(fn); }

function loadKatex() {
  if (katexState !== 'idle') return;
  katexState = 'loading';
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'vendor/katex/katex.min.css';
  const js = document.createElement('script');
  js.src = 'vendor/katex/katex.min.js';
  const ready = (el) => new Promise((resolve, reject) => { el.onload = resolve; el.onerror = reject; });
  Promise.all([ready(css), ready(js)])
    .then(() => {
      katexState = 'ready';
      cache.clear();
      mathWaiters.forEach((fn) => fn());
    })
    .catch(() => {
      // Échec (souvent hors ligne) : on retire les éléments et on réessaiera plus tard.
      css.remove();
      js.remove();
      katexState = 'idle';
      retryAt = Date.now() + 15000;
    });
  document.head.append(css, js);
}

let retryAt = 0;
function maybeLoadKatex() {
  // Après un échec, on attend le retour du réseau (événement « online ») ou quelques secondes.
  if (katexState !== 'idle' || Date.now() < retryAt) return;
  loadKatex();
}
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    retryAt = 0;
    if (katexState === 'idle' && document.querySelector('.math-pending')) loadKatex();
  });
}

function renderMath(tex, display) {
  const k = window.katex;
  if (k && katexState === 'ready') {
    try {
      return k.renderToString(tex, {
        displayMode: display, throwOnError: false, output: 'htmlAndMathml',
        trust: false, strict: 'ignore', maxSize: 40, maxExpand: 400,
      });
    } catch {
      /* repli texte ci-dessous */
    }
  } else {
    maybeLoadKatex();
  }
  pendingMath = true;
  const raw = display ? `$$${tex}$$` : `$${tex}$`;
  return display
    ? `<div class="math-pending" data-display="1">${esc(raw)}</div>`
    : `<span class="math-pending">${esc(raw)}</span>`;
}

/* ---------- Extensions marked ---------- */
const blockMath = {
  name: 'blockMath',
  level: 'block',
  start(src) {
    const m = src.match(/^ {0,3}(\$\$|\\\[)/m);
    return m ? m.index : undefined;
  },
  tokenizer(src) {
    const m = /^ {0,3}\$\$([\s\S]+?)\$\$[ \t]*(?:\n+|$)/.exec(src) || /^ {0,3}\\\[([\s\S]+?)\\\][ \t]*(?:\n+|$)/.exec(src);
    if (m) return { type: 'blockMath', raw: m[0], text: m[1].trim() };
    return undefined;
  },
  renderer(token) { return renderMath(token.text, true) + '\n'; },
};

const inlineMath = {
  name: 'inlineMath',
  level: 'inline',
  start(src) {
    const m = src.match(/\$|\\\(|\\\[/);
    return m ? m.index : undefined;
  },
  tokenizer(src) {
    let m = /^\$\$((?:\\.|[^$\\])+?)\$\$/.exec(src);
    if (m) return { type: 'inlineMath', raw: m[0], text: m[1].trim(), display: true };
    m = /^\\\[([\s\S]+?)\\\]/.exec(src);
    if (m) return { type: 'inlineMath', raw: m[0], text: m[1].trim(), display: true };
    m = /^\\\(([\s\S]+?)\\\)/.exec(src);
    if (m) return { type: 'inlineMath', raw: m[0], text: m[1].trim(), display: false };
    m = /^\$(?![\s$])((?:\\.|[^\\$\n])+?)(?<![\s\\])\$(?![\d\w])/.exec(src);
    if (m) return { type: 'inlineMath', raw: m[0], text: m[1], display: false };
    return undefined;
  },
  renderer(token) { return renderMath(token.text, token.display); },
};

const SAFE_INLINE_HTML = /^<\/?(br|sub|sup|kbd|mark|u|b|i|em|strong|s|del|small|ins)\s*\/?>$/i;
const SAFE_URL = /^(https?:|mailto:|tel:|#)/i;

function langLabel(lang) {
  return lang ? lang.toLowerCase() : 'texte';
}

/** Un bloc de code clôturé (``` … ```) est-il refermé ? Les blocs indentés le sont toujours. */
function fenceClosed(raw) {
  const m = /^ {0,3}(`{3,}|~{3,})/.exec(raw || '');
  if (!m) return true;
  const lines = String(raw).replace(/\s+$/, '').split('\n');
  if (lines.length < 2) return false;
  const ch = m[1][0] === '`' ? '`' : '~';
  return new RegExp(`^ {0,3}\\${ch}{${m[1].length},}\\s*$`).test(lines[lines.length - 1]);
}

let streamPass = false; // rendu de la fin d'une réponse en cours : pas de coloration des blocs ouverts
let pendingMath = false; // une formule attend KaTeX : le résultat n'est pas mis en cache

const marked = new Marked({ gfm: true, breaks: true, async: false });
marked.use({
  extensions: [blockMath, inlineMath],
  renderer: {
    code({ text, lang, raw }) {
      const l = String(lang || '').trim().split(/\s+/)[0].replace(/[^\w+#.-]/g, '').slice(0, 24);
      let body;
      const known = l && hljs.getLanguage(l);
      if (known && !(streamPass && !fenceClosed(raw))) {
        try { body = hljs.highlight(text, { language: l, ignoreIllegals: true }).value; } catch { body = esc(text); }
      } else {
        body = esc(text);
      }
      const cls = known ? ` class="hljs language-${esc(l)}"` : '';
      return `<div class="code-block"><div class="code-head"><span class="code-lang">${esc(langLabel(l))}</span>`
        + `<button type="button" class="code-copy" data-copy-code="1" aria-label="Copier le code">Copier</button></div>`
        + `<pre><code${cls}>${body}</code></pre></div>\n`;
    },
    html({ text }) {
      const t = String(text).trim();
      if (SAFE_INLINE_HTML.test(t)) return t.replace(/\s+/g, '');
      return esc(text);
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens);
      const url = String(href || '').trim();
      if (!SAFE_URL.test(url)) return inner;
      const t = title ? ` title="${esc(title)}"` : '';
      return `<a href="${esc(url)}"${t} target="_blank" rel="noopener noreferrer nofollow">${inner}</a>`;
    },
    image({ href, text }) {
      const url = String(href || '').trim();
      if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(url)) {
        return `<img src="${esc(url)}" alt="${esc(text || '')}" loading="lazy">`;
      }
      // Les images distantes ne sont jamais chargées automatiquement (vie privée, exfiltration).
      if (!/^https?:/i.test(url)) return esc(text || '');
      return `<a class="img-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow"><span>${esc(text || 'Image')}</span></a>`;
    },
  },
});

/* ---------- Nettoyage ---------- */
const BIDI_TAGS = new Set(['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TD', 'TH', 'DT', 'DD']);
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'input') {
    const type = (node.getAttribute && node.getAttribute('type')) || '';
    if (type !== 'checkbox') node.parentNode && node.parentNode.removeChild(node);
  }
});
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') || '';
    if (!SAFE_URL.test(href)) node.removeAttribute('href');
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
  if (node.tagName === 'IMG') {
    const src = node.getAttribute('src') || '';
    if (!/^(data:image\/|blob:)/i.test(src)) node.remove();
  }
  if (node.tagName === 'INPUT') node.setAttribute('disabled', '');
  if (BIDI_TAGS.has(node.tagName)) node.setAttribute('dir', 'auto');
});

const PURIFY = {
  USE_PROFILES: { html: true, mathMl: true, svg: true },
  ADD_ATTR: ['target', 'data-copy-code', 'data-display'],
  FORBID_TAGS: ['style', 'form', 'textarea', 'select', 'option', 'iframe', 'frame', 'object', 'embed', 'link', 'meta', 'base', 'video', 'audio', 'source', 'foreignobject', 'use'],
  FORBID_ATTR: ['srcset', 'action', 'formaction', 'xlink:href', 'ping'],
  ALLOW_DATA_ATTR: false,
};

// Configuration appliquée une fois pour toutes (évite de la ré-analyser à chaque rendu).
DOMPurify.setConfig(PURIFY);

export function sanitize(dirty) {
  return DOMPurify.sanitize(dirty);
}

/** Sépare un éventuel bloc <think>…</think> (modèles de raisonnement) de la réponse. */
export function splitThink(content) {
  const m = /^\s*<think>([\s\S]*?)(<\/think>|$)/.exec(content || '');
  if (!m) return { reasoning: '', answer: content || '', open: false };
  return { reasoning: m[1].trim(), answer: content.slice(m[0].length).replace(/^\s+/, ''), open: !m[2] };
}

function parse(md) {
  let out = '';
  try {
    out = marked.parse(String(md || ''));
  } catch {
    out = `<p>${esc(md)}</p>`;
  }
  out = out.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  return sanitize(out);
}

/* Cache des rendus : rouvrir une conversation ou rafraîchir le fil ne refait pas le travail. */
const cache = new Map();
const CACHE_MAX = 500;
let cacheChars = 0;
const CACHE_CHARS_MAX = 12_000_000;

export function renderMarkdown(md) {
  const src = String(md || '');
  const hit = cache.get(src);
  if (hit !== undefined) {
    cache.delete(src);
    cache.set(src, hit);
    return hit;
  }
  pendingMath = false;
  const html = parse(src);
  if (!pendingMath && src.length < 400_000) {
    cache.set(src, html);
    cacheChars += src.length + html.length;
    while (cache.size > CACHE_MAX || cacheChars > CACHE_CHARS_MAX) {
      const [k, v] = cache.entries().next().value;
      cache.delete(k);
      cacheChars -= k.length + v.length;
    }
  }
  return html;
}

/* ---------- Rendu incrémental pendant le streaming ----------
   Le texte reçu est découpé en blocs terminés (après une ligne vide, hors bloc de code ou de
   formule) : chaque bloc terminé est rendu une seule fois puis figé ; seul le dernier bloc,
   encore en cours d'écriture, est re-rendu à chaque morceau. Le rendu complet n'a lieu qu'une
   fois, à la fin de la réponse. */
const streams = new WeakMap();

function newScan() { return { pos: 0, splits: [], fence: null, math: false, prevBlank: false }; }

function scan(st, text) {
  for (;;) {
    const nl = text.indexOf('\n', st.pos);
    const end = nl === -1 ? text.length : nl;
    const line = text.slice(st.pos, end);
    // Point de coupe : début d'une ligne non indentée qui suit une ligne vide.
    if (!st.fence && !st.math && st.prevBlank && /^\S/.test(line) && st.pos > (st.splits[st.splits.length - 1] || 0)) st.splits.push(st.pos);
    if (nl === -1) return;
    if (st.fence) {
      if (st.fence.test(line)) st.fence = null;
    } else if (st.math) {
      if (/(\$\$|\\\])\s*$/.test(line)) st.math = false;
    } else {
      const f = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (f) {
        const ch = f[1][0] === '`' ? '`' : '~';
        st.fence = new RegExp(`^ {0,3}\\${ch}{${f[1].length},}\\s*$`);
      } else if (/^ {0,3}(\$\$|\\\[)/.test(line)) {
        const rest = line.replace(/^ {0,3}(\$\$|\\\[)/, '');
        if (!/(\$\$|\\\])\s*$/.test(rest)) st.math = true;
      }
    }
    st.prevBlank = !st.fence && !st.math && line.trim() === '';
    st.pos = nl + 1;
  }
}

function toNodes(htmlStr) {
  const t = document.createElement('template');
  t.innerHTML = htmlStr;
  return t.content;
}

/** Découpe un texte Markdown en blocs indépendants (mêmes coupes que pendant le streaming). */
export function splitBlocks(text) {
  const src = String(text || '');
  const st = newScan();
  scan(st, src);
  const out = [];
  let from = 0;
  for (const p of st.splits) { out.push(src.slice(from, p)); from = p; }
  out.push(src.slice(from));
  return out.filter((b) => b);
}

// Définitions de liens par référence ([x]: url) : elles portent sur tout le document.
const NEEDS_WHOLE = /^ {0,3}\[[^\]\n]+\]:\s/m;

/**
 * Rendu d'une réponse complète. Les longues réponses sont rendues bloc par bloc : chaque bloc
 * est mis en cache, si bien que le rendu final après le streaming réutilise ce qui a déjà été
 * rendu, et qu'une conversation se rouvre sans tout recalculer.
 */
export function renderDocument(md) {
  const src = String(md || '');
  if (src.length < 6000 || NEEDS_WHOLE.test(src)) return renderMarkdown(src);
  return splitBlocks(src).map(renderMarkdown).join('');
}

/** Met à jour `box` (élément .md) avec `text`, en ne re-rendant que la partie encore ouverte. */
export function renderStreaming(box, text) {
  const src = String(text || '');
  let st = streams.get(box);
  if (!st || !src.startsWith(st.frozen) || st.box !== box) {
    box.textContent = '';
    st = { box, frozen: '', marker: document.createComment(''), ...newScan() };
    box.appendChild(st.marker);
    streams.set(box, st);
  }
  scan(st, src);
  // Chaque bloc terminé est rendu (et mis en cache) individuellement, puis figé.
  for (const p of st.splits) {
    if (p <= st.frozen.length) continue;
    const frag = toNodes(renderMarkdown(src.slice(st.frozen.length, p)));
    enhance(frag);
    box.insertBefore(frag, st.marker);
    st.frozen = src.slice(0, p);
  }
  const tail = src.slice(st.frozen.length);
  if (tail === st.tail) return;
  st.tail = tail;
  while (st.marker.nextSibling) st.marker.nextSibling.remove();
  if (!tail.trim()) return;
  streamPass = true;
  let tailHtml;
  try { tailHtml = parse(tail); } finally { streamPass = false; }
  const frag = toNodes(tailHtml);
  enhance(frag);
  box.appendChild(frag);
}

export function resetStreaming(box) { streams.delete(box); }

export const mathPending = () => katexState === 'loading' || katexState === 'idle';

/** Ajoute les icônes aux boutons « Copier » après insertion dans le DOM. */
export function enhance(root) {
  root.querySelectorAll('.code-copy:not([data-ready])').forEach((b) => {
    b.dataset.ready = '1';
    b.innerHTML = `${icon('copy')}<span>Copier</span>`;
  });
  root.querySelectorAll('.img-link:not([data-ready])').forEach((a) => {
    a.dataset.ready = '1';
    a.insertAdjacentHTML('afterbegin', icon('image'));
    a.title = `Image externe (non chargée) : ${a.getAttribute('href')}`;
  });
}
