// Vignettes vivantes des exemples : iframes chargées quand elles sont visibles.
import { byId } from '../exemples/catalogue.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const W = 960;
const H = 640;

export function cardHTML(ex, root) {
  return `<article class="ex-card" data-id="${ex.id}">
  <div class="ex-card__view" aria-hidden="true"><iframe tabindex="-1" title="Aperçu de l’exemple ${esc(ex.title)}" data-src="${root}exemples/${ex.id}.html?vignette" width="${W}" height="${H}"></iframe><span class="ex-card__ph mono">${esc(ex.cat)}</span></div>
  <div class="ex-card__meta">
    <p class="label">${esc(ex.cat)}${ex.showreel ? ' <b>· showreel</b>' : ''}</p>
    <h3><a class="ex-card__link" href="${root}bac-a-sable/?ex=${ex.id}">${esc(ex.title)}</a></h3>
    <p class="ex-card__desc">${esc(ex.desc)}</p>
    <p class="ex-card__api mono">${ex.api.map(esc).join(' · ')}</p>
  </div>
  <a class="ex-card__full mono" href="${root}exemples/${ex.id}.html">Plein écran <span aria-hidden="true">↗</span></a>
</article>`;
}

/** Active les vignettes d'un conteneur : chargement paresseux, mise à l'échelle, déchargement. */
export function activateThumbs(container) {
  const cards = [...container.querySelectorAll('.ex-card')];
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) e.target.style.setProperty('--s', String(e.contentRect.width / W));
  });
  const timers = new WeakMap();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const frame = e.target.querySelector('iframe');
      clearTimeout(timers.get(frame));
      if (e.isIntersecting) {
        if (!frame.getAttribute('src')) {
          frame.src = frame.dataset.src;
          frame.addEventListener('load', () => onLoad(frame, e.target.dataset.id), { once: true });
        }
      } else if (frame.getAttribute('src')) {
        // hors écran depuis un moment : on libère le processeur
        timers.set(frame, setTimeout(() => { frame.removeAttribute('src'); frame.parentNode.classList.remove('is-ready'); }, 2500));
      }
    }
  }, { rootMargin: '150px 0px' });
  for (const c of cards) {
    ro.observe(c.querySelector('.ex-card__view'));
    io.observe(c);
  }
}

// Les exemples de défilement sont parcourus automatiquement dans leur vignette.
function onLoad(frame, id) {
  if (!frame.getAttribute('src')) return;
  frame.parentNode.classList.add('is-ready');
  const ex = byId[id];
  if (!ex || !ex.scroll) return;
  let t0 = performance.now();
  const step = (t) => {
    const w = frame.contentWindow;
    if (!frame.getAttribute('src') || !w || !w.document || !w.document.documentElement) return;
    const max = w.document.documentElement.scrollHeight - w.innerHeight;
    const p = ((t - t0) / 9000) % 2;
    const k = p < 1 ? p : 2 - p;
    w.scrollTo(0, max * (0.5 - Math.cos(k * Math.PI) / 2));
    requestAnimationFrame(step);
  };
  t0 = performance.now();
  requestAnimationFrame(step);
}

export function mountThumbs(container, ids, root = '') {
  container.innerHTML = ids.map((id) => byId[id]).filter(Boolean).map((ex) => cardHTML(ex, root)).join('');
  activateThumbs(container);
}
