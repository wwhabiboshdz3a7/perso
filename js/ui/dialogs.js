// Boîtes de dialogue (élément <dialog> natif), confirmations, saisies, notifications et menus.

import { esc, icon, html } from '../util.js';

/**
 * Crée et ouvre une boîte de dialogue modale.
 * body/foot : chaînes HTML (déjà échappées) ; renvoie l'élément <dialog>.
 */
export function openDialog({ id, title, sub = '', body = '', foot = '', size = '', label, onClose, tabs = '' }) {
  const old = document.getElementById(id);
  if (old) { rescueToasts(old); old.remove(); }
  const titleId = `${id}-title`;
  const d = html(`<dialog class="modal ${size}" id="${id}" aria-labelledby="${titleId}">
    <div class="modal-head">
      <h2 id="${titleId}">${esc(title)}${sub ? `<span class="sub">${sub}</span>` : ''}</h2>
      <button class="icon-btn" type="button" data-close aria-label="Fermer">${icon('x')}</button>
    </div>
    ${tabs}
    <div class="modal-body">${body}</div>
    ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
  </dialog>`);
  if (label) d.setAttribute('aria-label', label);
  document.body.appendChild(d);
  const close = () => d.close();
  d.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close();
    else if (e.target === d) {
      // Clic sur le fond (en dehors du cadre)
      const r = d.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) close();
    }
  });
  d.addEventListener('close', () => {
    // Les notifications hébergées par cette fenêtre passent à la suivante (ou au document).
    raiseToasts(d);
    onClose?.(d.returnValue);
    setTimeout(() => { rescueToasts(d); d.remove(); }, 0);
  });
  d.showModal();
  raiseToasts();
  return d;
}

export function confirmDialog(message, { title = 'Confirmer', confirm = 'Confirmer', danger = false, detail = '' } = {}) {
  return new Promise((resolve) => {
    let ok = false;
    const d = openDialog({
      id: 'dlg-confirm', size: 'sm', title,
      body: `<p style="margin:0;line-height:1.6">${esc(message)}</p>${detail ? `<p class="hint" style="margin-top:8px">${esc(detail)}</p>` : ''}`,
      foot: `<button class="btn btn-ghost" type="button" data-close>Annuler</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-ok>${esc(confirm)}</button>`,
      onClose: () => resolve(ok),
    });
    d.querySelector('[data-ok]').addEventListener('click', () => { ok = true; d.close(); });
    d.querySelector('[data-ok]').focus();
  });
}

export function promptDialog({ title, label, value = '', confirm = 'Enregistrer', placeholder = '', maxLength = 200 }) {
  return new Promise((resolve) => {
    let result = null;
    const d = openDialog({
      id: 'dlg-prompt', size: 'sm', title,
      body: `<form class="field" id="prompt-form" style="margin:0"><label for="prompt-input">${esc(label)}</label><input type="text" id="prompt-input" maxlength="${maxLength}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"></form>`,
      foot: `<button class="btn btn-ghost" type="button" data-close>Annuler</button><button class="btn btn-primary" type="submit" form="prompt-form">${esc(confirm)}</button>`,
      onClose: () => resolve(result),
    });
    const input = d.querySelector('#prompt-input');
    input.select();
    d.querySelector('#prompt-form').addEventListener('submit', (e) => {
      e.preventDefault();
      result = input.value.trim();
      d.close();
    });
  });
}

/* ---------- Notifications ----------
   Le conteneur est un « popover » : il passe dans la couche supérieure (top layer), au-dessus
   des fenêtres modales ouvertes. Une fenêtre modale rend inerte tout ce qui est hors d'elle
   (ni clic, ni lecteur d'écran) : le conteneur est donc déplacé dans la fenêtre ouverte la plus
   haute, puis rendu au document à sa fermeture. */
const popoverOK = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

function toastBox() { return document.getElementById('toasts'); }

function isOpenPopover(box) {
  try { return box.matches(':popover-open'); } catch { return false; }
}

/** Fenêtre modale ouverte la plus récente (hors `exclude`, en cours de fermeture). */
function topDialog(exclude) {
  const open = Array.from(document.querySelectorAll('dialog[open]')).filter((d) => d !== exclude);
  return open[open.length - 1] || null;
}

/** Sort le conteneur d'une fenêtre sur le point d'être retirée du document. */
function rescueToasts(dialog) {
  const box = toastBox();
  if (box && dialog.contains(box)) {
    if (popoverOK && isOpenPopover(box)) box.hidePopover();
    document.body.appendChild(box);
    raiseToasts(dialog);
  }
}

/** Place les notifications au premier plan, dans la fenêtre modale active s'il y en a une. */
export function raiseToasts(exclude = null) {
  const box = toastBox();
  if (!box) return;
  const host = topDialog(exclude) || document.body;
  try {
    if (box.parentElement !== host) {
      if (popoverOK && isOpenPopover(box)) box.hidePopover();
      host.appendChild(box);
    } else if (!box.children.length || isOpenPopover(box)) {
      return; // déjà au bon endroit
    }
    if (popoverOK && box.children.length && !isOpenPopover(box)) box.showPopover();
  } catch { /* popover indisponible */ }
}

function syncToastBox() {
  const box = toastBox();
  if (!box || !popoverOK) return;
  try {
    if (!box.children.length && isOpenPopover(box)) box.hidePopover();
  } catch { /* ignoré */ }
}

export function toast(message, { kind = 'info', action = null, timeout = 4200 } = {}) {
  const box = toastBox();
  const ico = kind === 'error' ? 'alert' : kind === 'ok' ? 'check' : 'info';
  const t = html(`<div class="toast" data-kind="${kind}" role="${kind === 'error' ? 'alert' : 'status'}">${icon(ico)}<span>${esc(message)}</span></div>`);
  const remove = () => { t.remove(); syncToastBox(); };
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = action.label;
    b.addEventListener('click', () => { remove(); action.fn(); });
    t.appendChild(b);
  }
  box.appendChild(t);
  while (box.children.length > 3) box.firstElementChild.remove();
  raiseToasts();
  if (timeout) setTimeout(remove, timeout);
  return t;
}

/* ---------- Menus contextuels ---------- */
let openMenuState = null;

export function closeMenus() {
  if (!openMenuState) return;
  const { menu, button, floating } = openMenuState;
  button?.setAttribute('aria-expanded', 'false');
  if (floating) menu.remove(); else menu.hidden = true;
  openMenuState = null;
}

const ITEM = '[role="menuitem"]:not([hidden]):not(:disabled)';

/** Ouvre un menu existant (élément [role=menu]) sous son bouton. */
export function toggleMenu(button, menu) {
  if (openMenuState && openMenuState.menu === menu) { closeMenus(); return; }
  closeMenus();
  menu.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  openMenuState = { menu, button, floating: false };
  // Le premier élément actif reçoit le focus (les actions indisponibles sont ignorées).
  menu.querySelector(ITEM)?.focus();
}

/** Menu flottant construit à la volée : items = [{ label, icon, danger, onSelect }]. */
export function floatingMenu(button, items) {
  if (openMenuState && openMenuState.button === button) { closeMenus(); return; }
  closeMenus();
  const menu = html(`<div class="menu floating" role="menu"></div>`);
  for (const it of items) {
    if (it.sep) { menu.appendChild(document.createElement('hr')); continue; }
    const b = html(`<button type="button" role="menuitem" class="${it.danger ? 'danger' : ''}">${icon(it.icon || 'dots')}<span>${esc(it.label)}</span></button>`);
    b.addEventListener('click', () => { closeMenus(); it.onSelect(); });
    menu.appendChild(b);
  }
  document.body.appendChild(menu);
  const r = button.getBoundingClientRect();
  const mw = 230;
  const mh = menu.offsetHeight;
  let left = Math.min(r.right - mw, window.innerWidth - mw - 8);
  left = Math.max(8, left);
  let top = r.bottom + 6;
  if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  button.setAttribute('aria-expanded', 'true');
  openMenuState = { menu, button, floating: true };
  menu.querySelector('button')?.focus();
}

document.addEventListener('click', (e) => {
  if (!openMenuState) return;
  if (openMenuState.menu.contains(e.target) || openMenuState.button.contains(e.target)) return;
  closeMenus();
});
document.addEventListener('keydown', (e) => {
  if (!openMenuState) return;
  const items = Array.from(openMenuState.menu.querySelectorAll(ITEM));
  const i = items.indexOf(document.activeElement);
  if (e.key === 'Escape') { const b = openMenuState.button; closeMenus(); b?.focus(); e.stopPropagation(); e.preventDefault(); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[i <= 0 ? items.length - 1 : i - 1]?.focus(); }
  else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus(); }
  else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus(); }
  else if (e.key === 'Tab') closeMenus();
}, true);
window.addEventListener('resize', () => closeMenus());
