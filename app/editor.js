// Éditeur de code : CodeMirror 5 (servi localement depuis vendor/) avec repli sur un textarea.
const MODES = {
  javascript: 'javascript', js: 'javascript', python: 'python', html: 'htmlmixed', css: 'css',
  c: 'text/x-csrc', cpp: 'text/x-c++src', bash: 'shell', shell: 'shell', sql: 'text/x-sql', json: { name: 'javascript', json: true }
};

export function creerEditeur(conteneur, { langage = 'javascript', valeur = '', onRun = null, lectureSeule = false } = {}) {
  conteneur.classList.add('editor-wrap');
  const theme = () => document.documentElement.dataset.theme === 'dark' ? 'material-darker' : 'default';
  if (window.CodeMirror) {
    const cm = window.CodeMirror(conteneur, {
      value: valeur, mode: MODES[langage] || 'javascript', theme: theme(), lineNumbers: true,
      indentUnit: langage === 'python' ? 4 : 2, tabSize: langage === 'python' ? 4 : 2, indentWithTabs: false,
      lineWrapping: true, readOnly: lectureSeule, viewportMargin: 50,
      extraKeys: {
        'Ctrl-Enter': () => onRun && onRun(), 'Cmd-Enter': () => onRun && onRun(),
        Tab: c => { if (c.somethingSelected()) c.indentSelection('add'); else c.replaceSelection(' '.repeat(c.getOption('indentUnit')), 'end'); },
        Esc: c => c.getInputField().blur()
      }
    });
    const obs = new MutationObserver(() => cm.setOption('theme', theme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return { get: () => cm.getValue(), set: v => cm.setValue(v), focus: () => cm.focus(), cm, refresh: () => cm.refresh() };
  }
  const ta = document.createElement('textarea');
  ta.className = 'fallback'; ta.value = valeur; ta.spellcheck = false; ta.readOnly = lectureSeule;
  ta.setAttribute('aria-label', 'Éditeur de code');
  ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onRun) onRun(); });
  conteneur.appendChild(ta);
  return { get: () => ta.value, set: v => { ta.value = v; }, focus: () => ta.focus(), refresh() {} };
}

// Coloration statique d'un bloc <pre><code> (lecture seule) via CodeMirror.runMode si disponible.
export function colorer(root = document) {
  if (!window.CodeMirror || !window.CodeMirror.runMode) return;
  root.querySelectorAll('pre > code[class*="language-"]').forEach(code => {
    if (code.dataset.colore) return;
    const lang = (code.className.match(/language-([\w+]+)/) || [])[1];
    const mode = MODES[lang === 'c++' ? 'cpp' : lang];
    if (!mode) return;
    const txt = code.textContent;
    code.innerHTML = '';
    window.CodeMirror.runMode(txt, mode, code);
    code.classList.add('cm-s-' + (document.documentElement.dataset.theme === 'dark' ? 'material-darker' : 'default'));
    code.dataset.colore = '1';
  });
}
