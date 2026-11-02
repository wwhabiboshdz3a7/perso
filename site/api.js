// Référence de l'API : rendu à partir de api/donnees.js, sommaire, filtre et section active.
import { sections } from '../api/donnees.js';
import { highlightAll } from './highlight.js';
import { scrollableCode } from './site.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// `code` et **gras** dans les textes
const md = (s) => esc(s || '').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

function table(rows) {
  const [head, ...body] = rows;
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function params(rows) {
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">Nom</th><th scope="col">Type</th><th scope="col">Défaut</th><th scope="col">Description</th></tr></thead>
<tbody>${rows.map(([n, t, d, desc]) => `<tr><td><code>${esc(n)}</code></td><td class="ty">${esc(t)}</td><td>${d ? md(d.startsWith('\'') || /^[\d.{[-]/.test(d) || d === 'true' || d === 'false' ? `\`${d}\`` : d) : ''}</td><td>${md(desc)}</td></tr>`).join('')}</tbody></table></div>`;
}

function item(it) {
  const parts = [`<h3 id="${it.id}"><a href="#${it.id}">${esc(it.name)}</a>${it.ret ? ` <span class="ret">→ ${esc(it.ret)}</span>` : ''}</h3>`];
  if (it.desc) parts.push(`<p>${md(it.desc)}</p>`);
  if (it.list) parts.push(`<ul>${it.list.map((l) => `<li>${md(l)}</li>`).join('')}</ul>`);
  if (it.params) parts.push(params(it.params));
  if (it.table) parts.push(table(it.table));
  if (it.code) parts.push(`<div class="code"><div class="code__bar"><span class="label">exemple</span><button class="copy" type="button" data-copy="${esc(it.code)}"><span class="copy__l">Copier</span></button></div><pre><code data-lang="js">${esc(it.code)}</code></pre></div>`);
  return `<article class="api-item" data-search="${esc(`${it.name} ${it.desc || ''} ${(it.params || []).map((p) => p.join(' ')).join(' ')} ${(it.list || []).join(' ')}`.toLowerCase())}">${parts.join('\n')}</article>`;
}

const main = document.getElementById('api-main');
const toc = document.getElementById('api-toc');
main.insertAdjacentHTML('beforeend', sections.map((s) => `<section class="api-sec" id="${s.id}" aria-labelledby="h-${s.id}">
  <header><p class="label">${esc(s.items.length)} entrée${s.items.length > 1 ? 's' : ''}</p><h2 id="h-${s.id}">${esc(s.title)}</h2><p>${md(s.intro)}</p></header>
  ${s.items.map(item).join('\n')}
</section>`).join('\n') + '<p class="api__noresult" id="api-none" hidden>Rien ne correspond à ce filtre.</p>');
toc.innerHTML = sections.map((s) => `<li><a href="#${s.id}" data-sec="${s.id}">${esc(s.title)}</a><ul>${s.items.map((it) => `<li><a href="#${it.id}">${esc(it.name.replace(/\(.*$/, '()').replace(/ ·.*$/, ''))}</a></li>`).join('')}</ul></li>`).join('');
highlightAll(main);
scrollableCode(main);

// Filtre plein texte (sans accents)
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const q = document.getElementById('api-q');
const none = document.getElementById('api-none');
q.addEventListener('input', () => {
  const words = norm(q.value.trim()).split(/\s+/).filter(Boolean);
  let shown = 0;
  main.querySelectorAll('.api-sec').forEach((sec) => {
    let inSec = 0;
    sec.querySelectorAll('.api-item').forEach((it) => {
      const ok = !words.length || words.every((w) => norm(it.dataset.search + ' ' + sec.id).includes(w));
      it.hidden = !ok;
      if (ok) inSec++;
    });
    sec.hidden = inSec === 0;
    shown += inSec;
  });
  none.hidden = shown > 0;
});

// Section active dans le sommaire
const links = new Map([...toc.querySelectorAll('a[data-sec]')].map((a) => [a.dataset.sec, a]));
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    links.forEach((a) => a.classList.remove('is-active'));
    links.get(e.target.id)?.classList.add('is-active');
  }
}, { rootMargin: '-20% 0px -70% 0px' });
main.querySelectorAll('.api-sec').forEach((s) => io.observe(s));

// Ancre demandée dans l'URL : le contenu vient d'être généré, on s'y rend
if (location.hash) {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) requestAnimationFrame(() => target.scrollIntoView());
}
