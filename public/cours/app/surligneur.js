// Coloration syntaxique des blocs <pre><code class="language-xxx"> (CodeMirror runmode, servi localement).
const MODES = {
  js: 'javascript', javascript: 'javascript', ts: 'text/typescript', typescript: 'text/typescript',
  json: 'application/json', python: 'python', py: 'python', bash: 'shell', shell: 'shell', sh: 'shell',
  html: 'htmlmixed', xml: 'xml', css: 'css', markdown: 'markdown', md: 'markdown', yaml: 'yaml', yml: 'yaml'
};

export function colorer(racine = document) {
  const CM = window.CodeMirror;
  if (!CM || !CM.runMode) return;
  racine.querySelectorAll('pre > code[class*="language-"]').forEach(code => {
    if (code.dataset.colore) return;
    const lang = (code.className.match(/language-([\w+-]+)/) || [])[1];
    const mode = MODES[lang];
    code.dataset.colore = '1';
    if (!mode) return;
    const texte = code.textContent;
    try {
      code.textContent = '';
      CM.runMode(texte, mode, code);
    } catch {
      code.textContent = texte;
    }
  });
}
