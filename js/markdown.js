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
    .then(() => { katexState = 'ready'; mathWaiters.forEach((fn) => fn()); })
    .catch(() => { katexState = 'error'; });
  document.head.append(css, js);
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
  } else if (katexState === 'idle') {
    loadKatex();
  }
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

const marked = new Marked({ gfm: true, breaks: true, async: false });
marked.use({
  extensions: [blockMath, inlineMath],
  renderer: {
    code({ text, lang }) {
      const l = String(lang || '').trim().split(/\s+/)[0].replace(/[^\w+#.-]/g, '').slice(0, 24);
      let body;
      const known = l && hljs.getLanguage(l);
      if (known) {
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
});

const PURIFY = {
  USE_PROFILES: { html: true, mathMl: true, svg: true },
  ADD_ATTR: ['target', 'data-copy-code', 'data-display'],
  FORBID_TAGS: ['style', 'form', 'textarea', 'select', 'option', 'iframe', 'frame', 'object', 'embed', 'link', 'meta', 'base', 'video', 'audio', 'source', 'foreignobject', 'use'],
  FORBID_ATTR: ['srcset', 'action', 'formaction', 'xlink:href', 'ping'],
  ALLOW_DATA_ATTR: false,
};

export function sanitize(dirty) {
  return DOMPurify.sanitize(dirty, PURIFY);
}

/** Sépare un éventuel bloc <think>…</think> (modèles de raisonnement) de la réponse. */
export function splitThink(content) {
  const m = /^\s*<think>([\s\S]*?)(<\/think>|$)/.exec(content || '');
  if (!m) return { reasoning: '', answer: content || '', open: false };
  return { reasoning: m[1].trim(), answer: content.slice(m[0].length).replace(/^\s+/, ''), open: !m[2] };
}

export function renderMarkdown(md) {
  let out = '';
  try {
    out = marked.parse(String(md || ''));
  } catch {
    out = `<p>${esc(md)}</p>`;
  }
  out = out.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  return sanitize(out);
}

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
