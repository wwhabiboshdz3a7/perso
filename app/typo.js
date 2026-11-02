// Typographie française à l'affichage : espace fine insécable devant ; ! ? » et après «, espace insécable
// devant les deux-points. Seuls les nœuds de texte sont modifiés, jamais le code, les champs ni les éditeurs.
const IGNORER = new Set(['CODE', 'PRE', 'KBD', 'SAMP', 'TEXTAREA', 'SCRIPT', 'STYLE', 'INPUT', 'SELECT', 'OPTION', 'svg', 'SVG', 'IFRAME']);
const A_TRAITER = / [;:!?»]|« /;

function ignore(n, racine) {
  for (let p = n.parentNode; p && p !== racine.parentNode; p = p.parentNode) {
    if (IGNORER.has(p.nodeName)) return true;
    if (p.classList && (p.classList.contains('CodeMirror') || p.classList.contains('no-typo'))) return true;
  }
  return false;
}

export function typographier(racine) {
  if (!racine || typeof document === 'undefined') return;
  const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  const aModifier = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) if (A_TRAITER.test(n.nodeValue) && !ignore(n, racine)) aModifier.push(n);
  for (const n of aModifier) n.nodeValue = n.nodeValue.replace(/ ([;!?»])/g, ' $1').replace(/ :/g, ' :').replace(/« /g, '« ');
}
