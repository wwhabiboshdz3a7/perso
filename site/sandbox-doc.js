// Bac à sable : document d'aperçu, garde contre les boucles infinies, contrôle de syntaxe, partage.
// Le code de l'aperçu s'exécute dans une iframe sandbox="allow-scripts" (origine opaque) :
// il n'a accès ni à la page du site, ni à son stockage.

export const LIB_URL = new URL('../dist/kinetika.esm.js', import.meta.url).href;
const LIB_MIN_URL = new URL('../dist/kinetika.esm.min.js', import.meta.url).href;
export const BASE = new URL('../exemples/', import.meta.url).href;
export const GUARD = '__ktBoucle';

// —— Librairie pour l'aperçu ——
// Une iframe d'origine opaque ne peut charger un module d'une autre origine qu'avec CORS.
// On passe donc la librairie en URL data: (aucune requête), avec repli sur l'adresse du site.
let libPromise = null;
export function libForPreview() {
  if (!libPromise) {
    libPromise = fetch(LIB_MIN_URL)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => {
        const bytes = new TextEncoder().encode(text);
        return `data:text/javascript;base64,${toB64(bytes, false)}`;
      })
      .catch(() => LIB_URL);
  }
  return libPromise;
}

// —— Garde contre les boucles infinies ——
// Chaque for / while / do…while reçoit un appel __ktBoucle(id, ligne) à chaque tour.
// Une boucle qui tourne plus d'une seconde sans que la page reprenne la main lève une erreur.
const RUNTIME = `(() => {
  const LIMIT = 1000;
  let epoch = 0, queued = false;
  const seen = Object.create(null), start = Object.create(null), last = Object.create(null);
  const tick = () => { epoch++; queued = false; };
  Object.defineProperty(self, '${GUARD}', { value(id, line) {
    const t = performance.now();
    if (!queued) { queued = true; setTimeout(tick, 0); }
    if (seen[id] !== epoch || t - last[id] > 100) { seen[id] = epoch; start[id] = t; }
    last[id] = t;
    if (t - start[id] > LIMIT) {
      start[id] = t;
      throw new RangeError('Boucle interrompue ligne ' + line + ' : elle tournait depuis plus d’une seconde sans rendre la main (boucle infinie ?).');
    }
    return true;
  } });
})();`;

const REGEX_AFTER = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);

/** Découpe grossière en jetons (chaînes, gabarits, expressions régulières et commentaires ignorés). */
function tokenize(src) {
  const toks = [];
  const n = src.length;
  let i = 0;
  const prevAllowsRegex = () => {
    const p = toks[toks.length - 1];
    if (!p) return true;
    if (p.type === 'name') return REGEX_AFTER.has(p.value);
    if (p.type === 'punct') return !(p.value === ')' || p.value === ']');
    return false;
  };
  const skipString = (k, q) => {
    k++;
    while (k < n && src[k] !== q && src[k] !== '\n') k += src[k] === '\\' ? 2 : 1;
    return k + 1;
  };
  const skipTemplate = (k) => {
    k++;
    while (k < n) {
      const c = src[k];
      if (c === '\\') { k += 2; continue; }
      if (c === '`') return k + 1;
      if (c === '$' && src[k + 1] === '{') {
        k += 2;
        let depth = 1;
        while (k < n && depth) {
          const d = src[k];
          if (d === '{') depth++;
          else if (d === '}') depth--;
          else if (d === '"' || d === "'") { k = skipString(k, d); continue; }
          else if (d === '`') { k = skipTemplate(k); continue; }
          k++;
        }
        continue;
      }
      k++;
    }
    return k;
  };
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === '"' || c === "'") { const s = i; i = skipString(i, c); toks.push({ type: 'str', start: s, end: i }); continue; }
    if (c === '`') { const s = i; i = skipTemplate(i); toks.push({ type: 'str', start: s, end: i }); continue; }
    if (c === '/' && prevAllowsRegex()) {
      const s = i;
      i++;
      let inClass = false;
      while (i < n && src[i] !== '\n') {
        const d = src[i];
        if (d === '\\') { i += 2; continue; }
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) break;
        i++;
      }
      i++;
      while (i < n && /[a-z]/i.test(src[i])) i++;
      toks.push({ type: 'regex', start: s, end: i });
      continue;
    }
    if (/[A-Za-z_$À-￿]/.test(c)) {
      const s = i;
      while (i < n && /[\w$À-￿]/.test(src[i])) i++;
      toks.push({ type: 'name', value: src.slice(s, i), start: s, end: i });
      continue;
    }
    if (/\d/.test(c) || (c === '.' && /\d/.test(src[i + 1]))) {
      const s = i;
      while (i < n && /[\w.]/.test(src[i])) i++;
      toks.push({ type: 'num', start: s, end: i });
      continue;
    }
    if (c === '?' && src[i + 1] === '.' && !/\d/.test(src[i + 2])) { toks.push({ type: 'punct', value: '?.', start: i, end: i + 2 }); i += 2; continue; }
    toks.push({ type: 'punct', value: c, start: i, end: i + 1 });
    i++;
  }
  return toks;
}

/** Instrumente les boucles d'un code JavaScript sans changer ses numéros de ligne. */
export function protectLoops(src) {
  const toks = tokenize(src);
  const ins = [];
  let id = 0;
  const lineAt = (pos) => {
    let l = 1;
    for (let k = 0; k < pos; k++) if (src.charCodeAt(k) === 10) l++;
    return l;
  };
  const isP = (t, v) => t && t.type === 'punct' && t.value === v;
  const OPEN = { '(': ')', '[': ']', '{': '}' };
  const closeOf = (k) => {
    let depth = 0;
    for (let j = k; j < toks.length; j++) {
      const t = toks[j];
      if (t.type !== 'punct') continue;
      if (OPEN[t.value]) depth++;
      else if (t.value === ')' || t.value === ']' || t.value === '}') { depth--; if (!depth) return j; }
    }
    return -1;
  };
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.type !== 'name' || (t.value !== 'for' && t.value !== 'while')) continue;
    const prev = toks[k - 1];
    if (isP(prev, '.') || isP(prev, '?.')) continue;
    const open = k + 1;
    if (!isP(toks[open], '(')) continue;
    const close = closeOf(open);
    if (close < 0) continue;
    const call = `${GUARD}(${++id},${lineAt(t.start)})`;
    if (t.value === 'while') {
      ins.push([toks[open].end, `${call}&&(`], [toks[close].start, ')']);
      continue;
    }
    // for : point-virgules au premier niveau de l'en-tête
    const semis = [];
    let depth = 0;
    for (let j = open + 1; j < close; j++) {
      const u = toks[j];
      if (u.type !== 'punct') continue;
      if (OPEN[u.value]) depth++;
      else if (u.value === ')' || u.value === ']' || u.value === '}') depth--;
      else if (u.value === ';' && depth === 0) semis.push(j);
    }
    if (semis.length >= 2) {
      const [a, b] = semis;
      if (b === a + 1) ins.push([toks[a].end, call]);
      else ins.push([toks[a].end, `${call}&&(`], [toks[b].start, ')']);
    } else if (isP(toks[close + 1], '{')) {
      // for…of / for…in : garde au début du corps
      ins.push([toks[close + 1].end, `${call};`]);
    }
  }
  if (!ins.length) return src;
  ins.sort((x, y) => x[0] - y[0]);
  let out = '';
  let at = 0;
  for (const [pos, text] of ins) {
    out += src.slice(at, pos) + text;
    at = pos;
  }
  return out + src.slice(at);
}

/**
 * Le code se lit-il ? (aucune exécution : la fonction est seulement compilée).
 * Renvoie null si oui, sinon le message d'erreur.
 */
export function syntaxError(js) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  const code = js
    .replace(/^\s*import\s+(?:[\w*{}\s,$]+\s+from\s+)?['"][^'"\n]+['"]\s*;?/gm, blank)
    .replace(/\bimport\.meta\b/g, '({})')
    .replace(/^(\s*)export\s+default\s+/gm, '$1void ')
    .replace(/^(\s*)export\s+(?=(?:const|let|var|function|class|async)\b)/gm, '$1');
  try {
    // eslint-disable-next-line no-new-func
    new Function(`return async () => {"use strict";\n${code}\n}`);
    return null;
  } catch (e) {
    return e && e.message ? e.message : String(e);
  }
}

// —— Pont console : messages et erreurs de l'aperçu remontent dans le panneau ——
const BRIDGE = `(() => {
  const fmt = (v) => { if (v instanceof Error) return v.message; if (typeof v === 'object' && v !== null) { try { return JSON.stringify(v); } catch (e) { return String(v); } } return String(v); };
  const send = (type, args) => { try { parent.postMessage({ __kt: 1, type, text: args.map(fmt).join(' ') }, '*'); } catch (e) {} };
  for (const k of ['log', 'info', 'warn', 'error']) { const o = console[k].bind(console); console[k] = (...a) => { send(k, a); o(...a); }; }
  // numéro de ligne rapporté au code JS de l'éditeur (le document commence par l'en-tête de l'aperçu)
  const OFFSET = __KT_OFFSET__;
  const where = (n) => (n > OFFSET ? ' (JS, ligne ' + (n - OFFSET) + ')' : ' (ligne ' + n + ' du document)');
  addEventListener('error', (e) => send('error', [e.message + (e.lineno && !/ligne [0-9]/.test(e.message) ? where(e.lineno) : '')]));
  addEventListener('unhandledrejection', (e) => send('error', ['Promesse rejetée : ' + fmt(e.reason)]));
})();`;

const guardTag = (s, tag) => s.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);
const protectInline = (html) => html.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, code, c) => (/\bsrc\s*=/i.test(a) ? m : a + protectLoops(code) + c));

/**
 * Document HTML de l'aperçu.
 * options.lib : URL de la librairie ; options.protect : instrumenter les boucles ;
 * options.bridge : relayer la console vers la page parente.
 */
export function buildDoc({ js, html, css }, { lib = LIB_URL, protect = true, bridge = true } = {}) {
  const script = protect ? protectLoops(js) : js;
  const body = protect ? protectInline(html) : html;
  const doc = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aperçu — Kinetika</title>
<base href="${BASE}">
<link rel="stylesheet" href="_base.css">
<script type="importmap">{ "imports": { "kinetika": "${lib}" } }<\/script>
${bridge ? `<script>${BRIDGE}<\/script>\n` : ''}${protect ? `<script>${RUNTIME}<\/script>\n` : ''}<style>
${guardTag(css, 'style')}
</style>
</head>
<body>
${body}
<script type="module">
${guardTag(script, 'script')}
<\/script>
</body>
</html>
`;
  const before = doc.slice(0, doc.lastIndexOf('<script type="module">'));
  return doc.replace('__KT_OFFSET__', String(before.split('\n').length));
}

// —— Partage par lien : JSON compressé (deflate) puis base64 « url » dans le fragment ——
export function toB64(bytes, url = true) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const b = btoa(s);
  return url ? b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b;
}
function fromB64(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
export async function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'function') {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return `z${toB64(new Uint8Array(await new Response(stream).arrayBuffer()))}`;
  }
  return `u${toB64(bytes)}`;
}
export async function decode(str) {
  const kind = str[0];
  let bytes = fromB64(str.slice(1));
  if (kind === 'z') {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  } else if (kind !== 'u') throw new Error('format inconnu');
  const obj = JSON.parse(new TextDecoder().decode(bytes));
  return { js: String(obj.js || ''), html: String(obj.html || ''), css: String(obj.css || '') };
}
