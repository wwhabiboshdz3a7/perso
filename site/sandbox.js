// Bac à sable : éditeur CodeMirror, aperçu en direct, exemples chargeables, partage par lien.
import { examples, categories, byId } from '../exemples/catalogue.js';
import { toast, copyText } from './site.js';

const CM = window.CodeMirror;
const $ = (id) => document.getElementById(id);
const els = {
  select: $('ex'), prev: $('prev'), next: $('next'), run: $('run'), auto: $('auto'), share: $('share'), reset: $('reset'),
  download: $('download'), open: $('open'), notice: $('notice'), trust: $('trust'), frame: $('frame'), editor: $('editor'),
  log: $('clog'), count: $('ccount'), clear: $('cclear'),
};
const tabs = [...document.querySelectorAll('.play__tabs [role="tab"]')];

const LIB = new URL('../dist/kinetika.esm.js', import.meta.url).href;
const BASE = new URL('../exemples/', import.meta.url).href;
const SHARED = '__partage';
const LABELS = { js: 'Code JavaScript', html: 'Code HTML', css: 'Code CSS' };
const MODES = { js: 'javascript', html: 'htmlmixed', css: 'css' };

// —— Préférences (facultatives : le stockage peut être indisponible) ——
const pref = {
  get(k, d) { try { const v = localStorage.getItem(`kt-sb-${k}`); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(`kt-sb-${k}`, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
};
els.auto.checked = pref.get('auto', true);

// —— Liste des exemples ——
els.select.innerHTML = `<option value="${SHARED}" hidden>— Code partagé —</option>` + categories.map((c) => `<optgroup label="${c}">${
  examples.filter((e) => e.cat === c).map((e) => `<option value="${e.id}">${e.title}</option>`).join('')}</optgroup>`).join('');

// —— Éditeur : un seul CodeMirror, trois documents ——
let escaped = false;
const docs = { js: CM.Doc('', MODES.js), html: CM.Doc('', MODES.html), css: CM.Doc('', MODES.css) };
let lang = 'js';
const cm = CM(els.editor, {
  value: docs.js,
  theme: 'kt',
  lineNumbers: true,
  tabSize: 2,
  indentUnit: 2,
  matchBrackets: true,
  autoCloseBrackets: true,
  styleActiveLine: true,
  inputStyle: 'contenteditable',
  lineWrapping: matchMedia('(max-width: 700px)').matches,
  spellcheck: false,
  extraKeys: {
    'Ctrl-Enter': () => run(true),
    'Cmd-Enter': () => run(true),
    'Ctrl-/': 'toggleComment',
    'Cmd-/': 'toggleComment',
    // Échap puis Tab : on rend la main au navigateur pour quitter l'éditeur au clavier
    Esc: () => { escaped = true; },
    Tab: (ed) => {
      if (escaped) { escaped = false; return CM.Pass; }
      if (ed.somethingSelected()) ed.indentSelection('add');
      else ed.replaceSelection('  ', 'end');
      return undefined;
    },
    'Shift-Tab': (ed) => {
      if (escaped) { escaped = false; return CM.Pass; }
      ed.indentSelection('subtract');
      return undefined;
    },
  },
});
cm.on('keydown', (ed, e) => { if (e.key !== 'Escape' && e.key !== 'Tab') escaped = false; });
const input = cm.getInputField();
input.setAttribute('role', 'textbox');
input.setAttribute('aria-label', LABELS.js);
input.setAttribute('aria-multiline', 'true');

function setTab(next, focus) {
  lang = next;
  tabs.forEach((t) => {
    const on = t.dataset.lang === next;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    if (on && focus) t.focus();
  });
  els.editor.setAttribute('aria-labelledby', `tab-${next}`);
  cm.swapDoc(docs[next]);
  input.setAttribute('aria-label', LABELS[next]);
  pref.set('tab', next);
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => setTab(t.dataset.lang));
  t.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k !== 'ArrowRight' && k !== 'ArrowLeft' && k !== 'Home' && k !== 'End') return;
    e.preventDefault();
    const j = k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : (i + (k === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    setTab(tabs[j].dataset.lang, true);
  });
});

// —— Lecture d'un exemple ——
const pick = (text, re) => ((text.match(re) || [])[1] || '').replace(/^\n+|\s+$/g, '');
async function fetchExample(id) {
  const res = await fetch(`${BASE}${id}.html`);
  if (!res.ok) throw new Error(`Exemple introuvable : ${id}`);
  const text = await res.text();
  return {
    css: pick(text, /<style data-ex>([\s\S]*?)<\/style>/),
    html: pick(text, /<!--ex-->([\s\S]*?)<!--\/ex-->/),
    js: pick(text, /<script type="module" data-ex>([\s\S]*?)<\/script>/),
  };
}

const current = () => ({ js: docs.js.getValue(), html: docs.html.getValue(), css: docs.css.getValue() });
let original = { js: '', html: '', css: '' };
let currentId = null;
let pendingTrust = false;

let silent = false;
function fill(code) {
  silent = true;
  for (const k of ['js', 'html', 'css']) {
    docs[k].setValue(code[k] || '');
    docs[k].clearHistory();
  }
  silent = false;
  cm.refresh();
}

// —— Aperçu ——
// Pont console : les messages et erreurs de l'aperçu remontent dans le panneau.
const BRIDGE = `(() => {
  const fmt = (v) => { if (v instanceof Error) return v.message; if (typeof v === 'object') { try { return JSON.stringify(v); } catch (e) { return String(v); } } return String(v); };
  const send = (type, args) => { try { parent.postMessage({ __kt: 1, type, text: args.map(fmt).join(' ') }, '*'); } catch (e) {} };
  for (const k of ['log', 'info', 'warn', 'error']) { const o = console[k].bind(console); console[k] = (...a) => { send(k, a); o(...a); }; }
  addEventListener('error', (e) => send('error', [e.message + (e.lineno ? ' (ligne ' + e.lineno + ')' : '')]));
  addEventListener('unhandledrejection', (e) => send('error', ['Promesse rejetée : ' + fmt(e.reason)]));
})();`;

const guard = (s, tag) => s.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);
function buildDoc({ js, html, css }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aperçu — Kinetika</title>
<base href="${BASE}">
<link rel="stylesheet" href="_base.css">
<script type="importmap">{ "imports": { "kinetika": "${LIB}" } }<\/script>
<script>${BRIDGE}<\/script>
<style>
${guard(css, 'style')}
</style>
</head>
<body>
${html}
<script type="module">
${guard(js, 'script')}
<\/script>
</body>
</html>
`;
}

function clearConsole() {
  els.log.textContent = '';
  els.count.textContent = '0';
  els.count.classList.remove('has-error');
}
function logLine(type, text) {
  const li = document.createElement('li');
  li.className = type === 'error' ? 'is-error' : type === 'warn' ? 'is-warn' : '';
  li.textContent = text;
  els.log.appendChild(li);
  while (els.log.children.length > 200) els.log.firstElementChild.remove();
  els.log.scrollTop = els.log.scrollHeight;
  els.count.textContent = String(els.log.children.length);
  if (type === 'error') els.count.classList.add('has-error');
}
addEventListener('message', (e) => {
  if (e.source !== els.frame.contentWindow || !e.data || e.data.__kt !== 1) return;
  logLine(e.data.type, e.data.text);
});
els.clear.addEventListener('click', clearConsole);

function run(force) {
  if (pendingTrust && !force) return;
  if (pendingTrust) {
    pendingTrust = false;
    els.notice.hidden = true;
  }
  clearConsole();
  els.frame.srcdoc = buildDoc(current());
}

// —— Relance automatique ——
let timer = 0;
cm.on('changes', () => {
  if (silent || !els.auto.checked || pendingTrust) return;
  clearTimeout(timer);
  timer = setTimeout(() => run(false), 700);
});
els.auto.addEventListener('change', () => { pref.set('auto', els.auto.checked); if (els.auto.checked) run(false); });
els.run.addEventListener('click', () => run(true));
els.trust.addEventListener('click', () => run(true));
addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(true); }
});

// —— Navigation entre exemples ——
async function load(id, { push = true } = {}) {
  if (!byId[id]) id = examples[0].id;
  try {
    const code = await fetchExample(id);
    currentId = id;
    original = code;
    pendingTrust = false;
    els.notice.hidden = true;
    els.select.value = id;
    fill(code);
    document.title = `${byId[id].title} — Bac à sable Kinetika`;
    if (push) {
      const url = new URL(location.href);
      url.hash = '';
      url.searchParams.set('ex', id);
      history.replaceState(null, '', url);
    }
    run(true);
  } catch (err) {
    toast(err.message);
  }
}
els.select.addEventListener('change', () => { if (els.select.value !== SHARED) load(els.select.value); });
const step = (d) => {
  const i = examples.findIndex((e) => e.id === currentId);
  load(examples[(i + d + examples.length) % examples.length].id);
};
els.prev.addEventListener('click', () => step(-1));
els.next.addEventListener('click', () => step(1));
els.reset.addEventListener('click', () => {
  fill(original);
  run(true);
  toast('Code d’origine rétabli');
});

// —— Partage par lien : JSON compressé (deflate) puis base64 « url » dans le fragment ——
const toB64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (str) => {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};
async function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'function') {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return `z${toB64(new Uint8Array(await new Response(stream).arrayBuffer()))}`;
  }
  return `u${toB64(bytes)}`;
}
async function decode(str) {
  const kind = str[0];
  let bytes = fromB64(str.slice(1));
  if (kind === 'z') {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  } else if (kind !== 'u') throw new Error('format inconnu');
  const obj = JSON.parse(new TextDecoder().decode(bytes));
  return { js: String(obj.js || ''), html: String(obj.html || ''), css: String(obj.css || '') };
}

els.share.addEventListener('click', async () => {
  const code = current();
  const hash = await encode({ v: 1, ...code });
  const url = new URL(location.href);
  url.search = '';
  url.hash = `code=${hash}`;
  history.replaceState(null, '', url);
  const ok = await copyText(url.href);
  toast(ok ? 'Lien de partage copié' : 'Lien prêt dans la barre d’adresse');
});

// —— Plein écran et téléchargement ——
els.open.addEventListener('click', () => {
  const blob = new Blob([buildDoc(current())], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
});
els.download.addEventListener('click', () => {
  const blob = new Blob([buildDoc(current())], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kinetika-${currentId || 'bac-a-sable'}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
});

// —— Démarrage ——
setTab(['js', 'html', 'css'].includes(pref.get('tab', 'js')) ? pref.get('tab', 'js') : 'js');
async function start() {
  const m = location.hash.match(/^#code=([\w-]+)$/);
  if (m) {
    try {
      const code = await decode(m[1]);
      original = code;
      currentId = null;
      fill(code);
      els.select.value = SHARED;
      pendingTrust = true;
      els.notice.hidden = false;
      els.frame.srcdoc = buildDoc({ js: '', html: '<p class="label" style="text-align:center">Aperçu en attente : lancez le code partagé.</p>', css: '' });
      return;
    } catch (err) {
      toast('Lien de partage illisible : exemple par défaut chargé');
    }
  }
  const id = new URLSearchParams(location.search).get('ex');
  load(byId[id] ? id : 'premiers-pas', { push: !!id });
}
start();
