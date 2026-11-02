// Galerie : filtres par catégorie, recherche, vignettes vivantes.
import { animate, stagger, splitText, engine } from '../dist/kinetika.esm.js';
import { examples, categories } from '../exemples/catalogue.js';
import { cardHTML, activateThumbs } from './thumbs.js';

const grid = document.getElementById('grid');
const filters = document.getElementById('filters');
const q = document.getElementById('q');
const count = document.getElementById('count');
const empty = document.getElementById('empty');

document.querySelectorAll('.js-total').forEach((el) => { el.textContent = examples.length; });

grid.innerHTML = examples.map((ex) => cardHTML(ex, '../')).join('');
const cards = [...grid.querySelectorAll('.ex-card')];
activateThumbs(grid);

const SHOWREEL = 'showreel';
const groups = [['', 'Tout', examples.length], [SHOWREEL, 'Showreel', examples.filter((e) => e.showreel).length],
  ...categories.map((c) => [c, c, examples.filter((e) => e.cat === c).length])];
filters.innerHTML = groups.map(([v, label, n]) => `<button class="pill" type="button" data-cat="${v}" aria-pressed="false">${label} <small>${n}</small></button>`).join('');

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const params = new URLSearchParams(location.search);
let cat = params.get('cat') || '';
if (!groups.some(([v]) => v === cat)) cat = '';
q.value = params.get('q') || '';

function apply(animateIn) {
  const term = norm(q.value.trim());
  let shown = 0;
  const visible = [];
  examples.forEach((ex, i) => {
    const inCat = !cat || (cat === SHOWREEL ? ex.showreel : ex.cat === cat);
    const hay = norm(`${ex.title} ${ex.desc} ${ex.cat} ${ex.api.join(' ')}`);
    const ok = inCat && (!term || term.split(/\s+/).every((w) => hay.includes(w)));
    cards[i].hidden = !ok;
    if (ok) { shown++; visible.push(cards[i]); }
  });
  filters.querySelectorAll('.pill').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
  count.textContent = `${shown} exemple${shown > 1 ? 's' : ''}${cat ? ` · ${cat === SHOWREEL ? 'showreel' : cat}` : ''}`;
  empty.hidden = shown > 0;
  if (animateIn && visible.length) {
    animate(visible.slice(0, 12), { y: [24, 0], opacity: [0, 1], duration: 700, delay: stagger(45), ease: 'outExpo' });
  }
  const url = new URL(location.href);
  if (cat) url.searchParams.set('cat', cat); else url.searchParams.delete('cat');
  if (q.value.trim()) url.searchParams.set('q', q.value.trim()); else url.searchParams.delete('q');
  history.replaceState(null, '', url);
}

filters.addEventListener('click', (e) => {
  const b = e.target.closest('.pill');
  if (!b) return;
  cat = b.dataset.cat;
  apply(true);
});
let t = 0;
q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => apply(false), 120); });
apply(false);

// Titre : entrée lettre par lettre
const title = document.querySelector('.js-title');
if (title && !engine.prefersReducedMotion) {
  const split = splitText(title, { chars: true, words: true });
  animate(split.chars, { y: ['0.6em', '0em'], opacity: [0, 1], rotate: [8, 0], duration: 900, delay: stagger(22), ease: 'outExpo' });
}
animate(cards.filter((c) => !c.hidden).slice(0, 6), { y: [40, 0], opacity: [0, 1], duration: 900, delay: stagger(70, { start: 200 }), ease: 'outExpo' });
