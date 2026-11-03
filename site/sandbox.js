// Bac à sable : éditeur CodeMirror, aperçu en direct, exemples chargeables, partage par lien.
// L'aperçu tourne dans une iframe sandbox="allow-scripts" (origine opaque) et ses boucles sont
// gardées : un code partagé ne peut pas toucher la page, une boucle infinie ne gèle pas l'onglet.
import { examples, categories, byId } from '../exemples/catalogue.js';
import { toast, copyText } from './site.js';
import { buildDoc, previewAssets, syntaxError, encode, decode, LIB_URL, BASE } from './sandbox-doc.js';

const CM = window.CodeMirror;
const $ = (id) => document.getElementById(id);
const els = {
  select: $('ex'), prev: $('prev'), next: $('next'), run: $('run'), auto: $('auto'), share: $('share'), reset: $('reset'),
  download: $('download'), open: $('open'), notice: $('notice'), trust: $('trust'), frame: $('frame'), editor: $('editor'),
  log: $('clog'), count: $('ccount'), clear: $('cclear'), status: $('status'),
  draft: $('draft'), draftAge: $('draft-age'), draftRestore: $('draft-restore'), draftDrop: $('draft-drop'),
};
const tabs = [...document.querySelectorAll('.play__tabs [role="tab"]')];

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
  let res;
  try {
    res = await fetch(`${BASE}${id}.html`);
  } catch (e) {
    throw new Error('Exemple indisponible : vérifiez votre connexion, puis réessayez.');
  }
  if (!res.ok) throw new Error(`Exemple indisponible (erreur ${res.status}) : réessayez plus tard.`);
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

function setStatus(text) {
  els.status.textContent = text;
  els.status.hidden = !text;
}

// Code partagé pas encore approuvé : rien ne s'exécute, ni ici ni en plein écran.
function setPending(on) {
  pendingTrust = on;
  els.notice.hidden = !on;
  for (const b of [els.open, els.download]) {
    b.disabled = on;
    if (on) b.title = 'Lancez d’abord le code partagé'; else b.removeAttribute('title');
  }
}

let runId = 0;
async function run(force) {
  if (pendingTrust && !force) return;
  if (pendingTrust) setPending(false);
  const code = current();
  if (!force) {
    // relance automatique : seulement pour un code qui se lit en entier
    const err = syntaxError(code.js);
    if (err) { setStatus(`Relance en attente : le code est incomplet (${err})`); return; }
  }
  setStatus('');
  const id = ++runId;
  const assets = await previewAssets();
  if (id !== runId) return;
  clearConsole();
  els.frame.srcdoc = buildDoc(code, assets);
}

// —— Relance automatique ——
let timer = 0;
cm.on('changes', () => {
  if (silent) return;
  saveDraft();
  if (!els.auto.checked || pendingTrust) return;
  clearTimeout(timer);
  timer = setTimeout(() => run(false), 700);
});
els.auto.addEventListener('change', () => { pref.set('auto', els.auto.checked); if (els.auto.checked) run(false); });
els.run.addEventListener('click', () => run(true));
els.trust.addEventListener('click', () => run(true));
addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(true); }
});

// —— Brouillon : la dernière modification d'un exemple survit au rechargement ——
const DRAFT = 'kt-sb-brouillon';
let draftTimer = 0;
const same = (a, b) => a.js === b.js && a.html === b.html && a.css === b.css;
function readDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT) || 'null');
    return d && byId[d.id] && d.code ? d : null;
  } catch (e) { return null; }
}
function dropDraft() {
  try { localStorage.removeItem(DRAFT); } catch (e) { /* stockage indisponible */ }
}
function saveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    if (pendingTrust || !currentId) return;
    const code = current();
    if (same(code, original)) { dropDraft(); return; }
    try { localStorage.setItem(DRAFT, JSON.stringify({ id: currentId, code, t: Date.now() })); } catch (e) { /* stockage plein ou indisponible */ }
  }, 400);
}
function offerDraft(id) {
  const d = readDraft();
  els.draft.hidden = true;
  if (!d || d.id !== id || same(d.code, original)) return;
  const min = Math.round((Date.now() - d.t) / 60000);
  els.draftAge.textContent = min < 1 ? 'il y a moins d’une minute' : min < 60 ? `il y a ${min} min` : `le ${new Date(d.t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`;
  els.draft.hidden = false;
}
els.draftRestore.addEventListener('click', () => {
  const d = readDraft();
  els.draft.hidden = true;
  if (!d || d.id !== currentId) return;
  fill(d.code);
  run(true);
  toast('Brouillon rétabli');
});
els.draftDrop.addEventListener('click', () => { dropDraft(); els.draft.hidden = true; });

// —— Navigation entre exemples ——
async function load(id, { push = true, draft = false } = {}) {
  if (!byId[id]) id = examples[0].id;
  try {
    const code = await fetchExample(id);
    currentId = id;
    original = code;
    setPending(false);
    els.select.value = id;
    fill(code);
    document.title = `${byId[id].title} — Bac à sable Kinetika`;
    if (push) {
      const url = new URL(location.href);
      url.hash = '';
      url.searchParams.set('ex', id);
      history.replaceState(null, '', url);
    }
    if (draft) offerDraft(id); else els.draft.hidden = true;
    run(true);
  } catch (err) {
    // le sélecteur revient sur ce qui est réellement affiché
    els.select.value = currentId || SHARED;
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
  dropDraft();
  // un code partagé non approuvé reste en attente : on remplit sans exécuter
  if (!pendingTrust) run(true);
  toast('Code d’origine rétabli');
});

// —— Partage par lien : JSON compressé (deflate) puis base64 « url » dans le fragment ——
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
// Plein écran : une page du site (apercu.html) place le code dans sa propre iframe isolée.
// Le document lui est transmis par message, jamais par l'adresse : un lien ne peut rien y lancer.
let popup = null;
addEventListener('message', async (e) => {
  if (!popup || e.source !== popup || e.origin !== location.origin || !e.data || e.data.__kt !== 'apercu-pret') return;
  if (pendingTrust) return;
  const assets = await previewAssets();
  popup.postMessage({ __kt: 'apercu-code', doc: buildDoc(current(), { ...assets, bridge: false }), title: document.title }, location.origin);
});
els.open.addEventListener('click', () => {
  if (pendingTrust) return;
  popup = window.open(new URL('apercu.html', location.href).href, 'kinetika-apercu');
  if (!popup) { toast('Fenêtre bloquée par le navigateur : autorisez les fenêtres pour ce site.'); return; }
  popup.focus();
});
els.download.addEventListener('click', () => {
  if (pendingTrust) return;
  const blob = new Blob([buildDoc(current(), { lib: LIB_URL, protect: false, bridge: false })], { type: 'text/html' });
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
      els.draft.hidden = true;
      setPending(true);
      setStatus('');
      clearConsole();
      const id = ++runId;
      const assets = await previewAssets();
      if (id === runId && pendingTrust) {
        els.frame.srcdoc = buildDoc({ js: '', html: '<p class="label" style="text-align:center">Aperçu en attente : lancez le code partagé.</p>', css: '' }, { ...assets, protect: false, bridge: false });
      }
      return;
    } catch (err) {
      toast('Lien de partage illisible : exemple par défaut chargé');
    }
  }
  const asked = new URLSearchParams(location.search).get('ex');
  // sans exemple demandé, on reprend celui du dernier brouillon
  const draft = readDraft();
  const id = byId[asked] ? asked : draft ? draft.id : 'premiers-pas';
  load(id, { push: !!asked, draft: true });
}
// un lien de partage collé dans un onglet déjà ouvert ne change que le fragment
addEventListener('hashchange', () => start());
start();
