// Comportements communes à toutes les pages du site.
import { animate, engine } from '../dist/kinetika.esm.js';
import { highlightAll } from './highlight.js';

// Menu mobile
const burger = document.querySelector('.burger');
const nav = document.getElementById('nav');
if (burger && nav) {
  const setOpen = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    if (open) {
      animate(nav.querySelectorAll('a'), { y: [24, 0], opacity: [0, 1], duration: 600, delay: (el, i) => i * 45, ease: 'outExpo' });
    }
  };
  burger.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setOpen(false); burger.focus(); }
  });
  matchMedia('(min-width: 981px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

highlightAll();

// Les blocs de code qui défilent horizontalement doivent être atteignables au clavier.
export function scrollableCode(root = document) {
  root.querySelectorAll('pre').forEach((pre) => {
    if (pre.scrollWidth > pre.clientWidth + 1) {
      pre.tabIndex = 0;
      if (!pre.hasAttribute('aria-label')) pre.setAttribute('aria-label', 'Bloc de code (défilement horizontal)');
    } else if (pre.getAttribute('aria-label') === 'Bloc de code (défilement horizontal)') {
      pre.removeAttribute('tabindex');
      pre.removeAttribute('aria-label');
    }
  });
}
let scrollTimer = 0;
addEventListener('resize', () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(() => scrollableCode(), 150); });
addEventListener('load', () => scrollableCode());
document.fonts?.ready.then(() => scrollableCode());

// Notification brève
let toastEl = null;
let toastTimer = 0;
export function toast(message) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  animate(toastEl, { opacity: 1, y: [16, 0], duration: 500, ease: 'outBack(1.6)' });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => animate(toastEl, { opacity: 0, y: 10, duration: 400, ease: 'inQuad' }), 1800);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }
}

// Boutons « copier » : data-copy="texte" ou data-copy-target="#id"
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy], [data-copy-target]');
  if (!btn) return;
  const text = btn.dataset.copy ?? document.querySelector(btn.dataset.copyTarget)?.textContent ?? '';
  const ok = await copyText(text.trim());
  btn.classList.add('is-ok');
  const label = btn.querySelector('.copy__l');
  const prev = label ? label.textContent : null;
  if (label) label.textContent = ok ? 'Copié' : 'Échec';
  toast(ok ? 'Copié dans le presse-papiers' : 'Copie impossible : sélectionnez le texte à la main');
  setTimeout(() => { btn.classList.remove('is-ok'); if (label) label.textContent = prev; }, 1600);
});

export { engine };
