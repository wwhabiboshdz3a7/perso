// Notifications, journal des commandes et pastilles d'état.

import { $, el, icon, fmtTime } from './dom.js';

const TOAST_ICONS = { info: 'sparkle', ok: 'check', warn: 'help', error: 'close' };

export class UI {
  constructor(app) {
    this.app = app;
    this.toastsEl = $('#toasts');
    this.logEl = $('#log');
    this.maxLog = 80;
    $('#btnLogClear').addEventListener('click', () => { this.logEl.textContent = ''; });
  }

  /**
   * Notification éphémère.
   * @param {string} title @param {string} [text] @param {{kind?:string, ms?:number, sound?:string|false}} [o]
   */
  toast(title, text = '', o = {}) {
    const kind = o.kind || 'info';
    const node = el('div', { class: 'toast', dataset: { kind } },
      icon(TOAST_ICONS[kind] || 'sparkle'),
      el('div', {}, el('strong', { text: title }), text ? el('span', { text }) : null));
    this.toastsEl.append(node);
    while (this.toastsEl.children.length > 4) this.toastsEl.firstElementChild.remove();
    const ms = o.ms ?? (kind === 'error' ? 6500 : 4200);
    setTimeout(() => {
      node.classList.add('is-out');
      setTimeout(() => node.remove(), 320);
    }, ms);
    if (o.sound !== false) this.app.sound?.play(o.sound || (kind === 'error' ? 'error' : 'notify'));
    return node;
  }

  /** Entrée du journal. kind : geste, voix, liaison, système, erreur… */
  log(kind, text) {
    const li = el('li', { dataset: { kind } },
      el('time', { text: fmtTime(new Date()) }),
      el('span', { class: 'tag', text: kind }),
      el('span', { text }));
    this.logEl.prepend(li);
    while (this.logEl.children.length > this.maxLog) this.logEl.lastElementChild.remove();
  }

  chip(id, state, value) {
    const c = $(`#chip${id}`);
    if (!c) return;
    c.dataset.state = state;
    if (value !== undefined) {
      const v = $(`#chip${id}Val`);
      if (v) v.textContent = value;
      c.title = `${c.querySelector('.chip__label')?.textContent || ''} : ${value}`;
    }
  }
}
