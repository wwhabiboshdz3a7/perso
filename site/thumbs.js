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

// Cadence des vignettes : 30 images/s suffisent à une miniature et divisent le travail par deux.
const THUMB_FPS = 30;
const live = new WeakMap(); // iframe → { engine, visible, scroll }

/** Moteur Kinetika de la vignette (même origine, via l'import map de l'exemple). */
async function engineOf(frame) {
  try {
    const mod = await new frame.contentWindow.Function("return import('kinetika')")();
    return mod && mod.engine ? mod.engine : null;
  } catch (e) {
    return null;
  }
}

/** Lecture ou pause d'une vignette chargée : seules celles qui sont à l'écran tournent. */
function setVisible(frame, visible) {
  const st = live.get(frame);
  if (!st) return;
  st.visible = visible;
  if (st.engine) { if (visible) st.engine.resume(); else st.engine.pause(); }
  if (visible && st.scroll) st.scroll();
}

/** Active les vignettes d'un conteneur : chargement paresseux, mise à l'échelle, pause hors écran, déchargement. */
export function activateThumbs(container) {
  const cards = [...container.querySelectorAll('.ex-card')];
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) e.target.style.setProperty('--s', String(e.contentRect.width / W));
  });
  const timers = new WeakMap();
  const shown = new WeakMap();
  // chargement un peu avant l'arrivée à l'écran, déchargement après un moment hors écran
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const frame = e.target.querySelector('iframe');
      clearTimeout(timers.get(frame));
      if (e.isIntersecting) {
        if (!frame.getAttribute('src')) {
          frame.src = frame.dataset.src;
          frame.addEventListener('load', () => onLoad(frame, e.target.dataset.id, () => shown.get(frame)), { once: true });
        }
      } else if (frame.getAttribute('src')) {
        timers.set(frame, setTimeout(() => {
          frame.removeAttribute('src');
          frame.parentNode.classList.remove('is-ready');
          live.delete(frame);
        }, 2500));
      }
    }
  }, { rootMargin: '150px 0px' });
  // lecture seulement quand la vignette est réellement visible
  const play = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const frame = e.target.querySelector('iframe');
      shown.set(frame, e.isIntersecting);
      setVisible(frame, e.isIntersecting);
    }
  });
  for (const c of cards) {
    ro.observe(c.querySelector('.ex-card__view'));
    io.observe(c);
    play.observe(c);
  }
}

async function onLoad(frame, id, isShown) {
  if (!frame.getAttribute('src')) return;
  frame.parentNode.classList.add('is-ready');
  const st = { engine: null, visible: !!isShown(), scroll: null };
  live.set(frame, st);
  const ex = byId[id];
  // Les exemples de défilement sont parcourus automatiquement dans leur vignette,
  // sauf en mouvement réduit (la vignette reste immobile).
  if (ex && ex.scroll && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let t0 = performance.now();
    let last = 0;
    let running = false;
    const step = (t) => {
      const w = frame.contentWindow;
      if (live.get(frame) !== st || !st.visible || !w || !w.document || !w.document.documentElement) { running = false; return; }
      requestAnimationFrame(step);
      if (t - last < 1000 / THUMB_FPS - 2) return;
      last = t;
      const max = w.document.documentElement.scrollHeight - w.innerHeight;
      const p = ((t - t0) / 9000) % 2;
      const k = p < 1 ? p : 2 - p;
      w.scrollTo(0, max * (0.5 - Math.cos(k * Math.PI) / 2));
    };
    st.scroll = () => {
      if (running) return;
      running = true;
      requestAnimationFrame(step);
    };
    t0 = performance.now();
  }
  const engine = await engineOf(frame);
  if (live.get(frame) !== st) return;
  st.engine = engine;
  if (engine) engine.fps = THUMB_FPS;
  setVisible(frame, st.visible);
}

export function mountThumbs(container, ids, root = '') {
  container.innerHTML = ids.map((id) => byId[id]).filter(Boolean).map((ex) => cardHTML(ex, root)).join('');
  activateThumbs(container);
}
