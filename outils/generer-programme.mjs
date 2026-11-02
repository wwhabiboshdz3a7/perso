// Met à jour, dans public/index.html, le programme détaillé et les chiffres clés à partir du catalogue.
// Usage : node outils/generer-programme.mjs [--verifier]
// --verifier : n'écrit rien, échoue si la page n'est pas à jour (utilisé par les tests).
// Le programme est écrit en HTML statique pour être lisible sans JavaScript et indexable.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { modules, bonus, fichiers, totalLecons, NOMS_OFFRES } from '../public/cours/content/catalogue.js';
import contenuBonus from '../prive/modules/bonus.mjs';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = path.join(racine, 'public', 'index.html');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = n => 'M' + String(n).padStart(2, '0');

export function htmlProgramme() {
  const ligne = m => {
    const vedette = m.id === 'm6';
    const etiquette = `<span class="etiquette e-${m.offre}">${m.offre === 'gratuit' ? 'Gratuit' : 'Offre ' + esc(NOMS_OFFRES[m.offre])}</span>`;
    return `          <li class="prog-mod${vedette ? ' vedette' : ''}"><details${m.numero === 0 ? ' open' : ''}><summary><span class="prog-num">${num(m.numero)}</span><span class="prog-titre">${esc(m.titre)}${vedette ? ' <span class="etiquette e-vedette">Le plus complet</span>' : ''}</span><span class="prog-meta">${etiquette}<span>${m.lecons.length} leçons</span></span></summary>
            <div class="prog-corps"><p>${esc(m.accroche)}</p><ol class="prog-lecons">${m.lecons.map(l => `<li>${esc(l)}</li>`).join('')}</ol></div></details></li>`;
  };
  const b = `          <li class="prog-mod bonus"><details><summary><span class="prog-num">+</span><span class="prog-titre">${esc(bonus.titre)}</span><span class="prog-meta"><span class="etiquette e-${bonus.offre}">Offre ${esc(NOMS_OFFRES[bonus.offre])}</span><span>${contenuBonus.prompts.length} prompts</span></span></summary>
            <div class="prog-corps"><p>${esc(bonus.accroche)}</p><ol class="prog-lecons">${bonus.sections.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div></details></li>`;
  return `<!-- programme:debut -->\n        <ol class="prog">\n${modules.map(ligne).join('\n')}\n${b}\n        </ol>\n        <!-- programme:fin -->`;
}

export function htmlChiffres() {
  const gratuits = modules.filter(m => m.offre === 'gratuit').length;
  const workflows = Object.keys(fichiers).filter(f => f.startsWith('n8n/')).length;
  const items = [
    [modules.length, 'modules'],
    [totalLecons, 'leçons avec exercices et quiz'],
    [contenuBonus.prompts.length, 'prompts métiers'],
    [workflows, 'workflows n8n à importer'],
    [gratuits, 'modules gratuits']
  ];
  return `<!-- stats:debut -->\n      <ul class="chiffres" aria-label="La formation en chiffres">\n${items.map(([v, l]) => `        <li><b>${v}</b><span>${l}</span></li>`).join('\n')}\n      </ul>\n      <!-- stats:fin -->`;
}

export function mettreAJour(html) {
  return html
    .replace(/<!-- programme:debut -->[\s\S]*?<!-- programme:fin -->/, htmlProgramme())
    .replace(/<!-- stats:debut -->[\s\S]*?<!-- stats:fin -->/, htmlChiffres());
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const avant = await readFile(page, 'utf8');
  const apres = mettreAJour(avant);
  if (process.argv.includes('--verifier')) {
    if (avant !== apres) { console.error('public/index.html n\'est pas à jour : lancez node outils/generer-programme.mjs'); process.exit(1); }
    console.log('Programme à jour.');
  } else {
    await writeFile(page, apres);
    console.log(avant === apres ? 'Programme déjà à jour.' : 'Programme et chiffres mis à jour dans public/index.html.');
  }
}
