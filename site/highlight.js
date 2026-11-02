// Coloration syntaxique légère pour les blocs de code statiques (JS, HTML, CSS).
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const JS_KEYWORDS = 'import|from|export|default|const|let|var|function|return|if|else|for|of|in|new|await|async|true|false|null|undefined|this|class|extends|while|do|switch|case|break|continue|try|catch|finally|throw|typeof|instanceof|delete|void|yield';
const JS_RE = new RegExp([
  '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)', // 1 commentaire
  "('(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"|`(?:\\\\.|[^`\\\\])*`)", // 2 chaîne
  `\\b(${JS_KEYWORDS})\\b`, // 3 mot-clé
  '(\\b\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b|\\.\\d+\\b)', // 4 nombre
  '([A-Za-z_$][\\w$]*)(?=\\s*\\()', // 5 appel
  '([A-Za-z_$][\\w$]*)(?=\\s*:(?!:))', // 6 clé
  '(=>|[{}()[\\];,.])', // 7 ponctuation
].join('|'), 'g');

export function highlightJS(src) {
  let out = '';
  let last = 0;
  src.replace(JS_RE, (m, c, s, k, n, f, p, o, idx) => {
    out += esc(src.slice(last, idx));
    const cls = c ? 't-c' : s ? 't-s' : k ? 't-k' : n ? 't-n' : f ? 't-f' : p ? 't-p' : 't-o';
    out += `<span class="${cls}">${esc(m)}</span>`;
    last = idx + m.length;
    return m;
  });
  return out + esc(src.slice(last));
}

export function highlightHTML(src) {
  return esc(src)
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="t-c">$1</span>')
    .replace(/(&lt;\/?)([a-z][\w-]*)([^&]*?)(\/?&gt;)/gi, (m, open, tag, attrs, close) => {
      const a = attrs.replace(/([\w-:@]+)(=)("[^"]*"|'[^']*')/g, '<span class="t-a">$1</span>$2<span class="t-s">$3</span>');
      return `<span class="t-o">${open}</span><span class="t-t">${tag}</span>${a}<span class="t-o">${close}</span>`;
    });
}

export function highlightCSS(src) {
  return esc(src)
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="t-c">$1</span>')
    .replace(/([\w-]+)(\s*:)(?![^{]*\{)/g, '<span class="t-p">$1</span>$2')
    .replace(/(#[0-9a-f]{3,8}\b|-?\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|deg|ms|s)?\b)/gi, '<span class="t-n">$1</span>');
}

export function highlight(src, lang = 'js') {
  if (lang === 'html') return highlightHTML(src);
  if (lang === 'css') return highlightCSS(src);
  if (lang === 'sh' || lang === 'text') return esc(src);
  return highlightJS(src);
}

/** Colore tous les <pre><code data-lang> de la page. */
export function highlightAll(root = document) {
  root.querySelectorAll('pre > code[data-lang]').forEach((el) => {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    el.innerHTML = highlight(el.textContent.replace(/^\n/, '').replace(/\s+$/, ''), el.dataset.lang);
  });
}
