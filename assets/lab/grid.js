// Galerie du lab : vignettes vivantes (iframes chargées seulement à l'écran).
import { EFFECTS } from './registry.js';
import { RM, TOUCH } from '../core.js';

const grid = document.getElementById('grid');
grid.innerHTML = EFFECTS.map((e) => `
  <a class="card" href="${e.slug}/" data-slug="${e.slug}">
    <div class="card__meta"><div><h2>${e.name}</h2><p>${e.technique}</p></div><span class="card__n">${e.n}</span></div>
  </a>`).join('');

const maxLive = TOUCH ? 4 : 10;
const live = new Set();
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    const card = en.target;
    if (en.isIntersecting) {
      if (card.querySelector('iframe')) return;
      if (live.size >= maxLive) { const old = live.values().next().value; old.querySelector('iframe')?.remove(); live.delete(old); }
      const f = document.createElement('iframe');
      f.src = `${card.dataset.slug}/?thumb=1`;
      f.title = 'Aperçu : ' + card.querySelector('h2').textContent;
      f.loading = 'lazy'; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
      card.prepend(f); live.add(card);
    } else {
      const f = card.querySelector('iframe');
      if (f) { f.remove(); live.delete(card); }
    }
  });
}, { rootMargin: '80px 0px' });
grid.querySelectorAll('.card').forEach((c) => io.observe(c));

// Titre : lettres qui s'élargissent en vague à l'arrivée
if (!RM) {
  const h = document.querySelector('.lab-head h1 .w');
  const split = SplitText.create(h, { type: 'chars' });
  gsap.from(split.chars, { yPercent: 100, fontVariationSettings: '"wdth" 50', opacity: 0, duration: 1.4, ease: 'elastic.out(1, .5)', stagger: 0.06 });
  gsap.from('.lab-head h1 em, .lab-head p', { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.4, stagger: 0.1 });
}
