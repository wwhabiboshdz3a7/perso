// Aides de rédaction du contenu (produisent des données JSON-sérialisables).
// Copie identique : prive/modules/_outils.mjs (le contenu payant ne dépend pas du dossier public).
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Bloc de code pour la théorie, échappé et prêt pour la coloration. */
export const code = (lang, src) => `<pre><code class="language-${lang}">${escHtml(String(src).replace(/^\n/, '').replace(/\n\s*$/, ''))}</code></pre>`;
/** Encadré : type = info | warn | ok | legal. */
export const encart = (type, titre, html) => `<div class="callout ${type}"><b>${titre}</b>${html}</div>`;
/** Tableau HTML simple. */
export const tableau = (entetes, lignes) => `<table><thead><tr>${entetes.map(e => `<th>${e}</th>`).join('')}</tr></thead><tbody>${lignes.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
/** Étape du pas-à-pas. */
export const pas = (t, d) => ({ t, d });
/** Question de quiz (bonne = index de la bonne réponse). */
export const q = (question, options, bonne, explication) => ({ q: question, options, bonne, explication });
/** Critère de validation par expression régulière. */
export const crit = (label, re) => ({ label, motif: re.source, drapeaux: re.flags.replace('g', '') });
/** Critère de longueur minimale. */
export const mots = n => ({ label: `Au moins ${n} mots`, minMots: n });
/** Script vidéo de la leçon. */
export const script = (duree, accroche, plan, cta, demo = '') => ({ duree, accroche, plan, cta, ...(demo ? { demo } : {}) });
export const esc = escHtml;
