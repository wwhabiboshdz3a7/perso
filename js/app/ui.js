// Notifications, journal des commandes et pastilles d'état.

import { $, el, icon, fmtTime } from './dom.js';

const TOAST_ICONS = { info: 'sparkle', ok: 'check', warn: 'help', error: 'close', ask: 'link' };

export class UI {
  constructor(app) {
    this.app = app;
    this.toastsEl = $('#toasts');
    this.logEl = $('#log');
    this.maxLog = 80;
    $('#btnLogClear').addEventListener('click', () => { this.logEl.textContent = ''; });
  }

  /**
   * Notification éphémère. Une notification identique déjà affichée est
   * prolongée plutôt que répétée (ni doublon, ni son à chaque fois).
   * @param {string} title @param {string} [text]
   * @param {{kind?:string, ms?:number, sound?:string|false, action?:{label:string, run:Function}}} [o]
   */
  toast(title, text = '', o = {}) {
    const kind = o.kind || 'info';
    const key = `${kind}|${title}|${text}`;
    const same = [...this.toastsEl.children].find((n) => n.dataset.key === key && !n.classList.contains('is-out'));
    const ms = o.ms ?? (kind === 'error' ? 6500 : o.action ? 7000 : 4200);
    if (same && !o.action) {
      clearTimeout(same._t);
      same._t = setTimeout(() => this._out(same), ms);
      return same;
    }
    const body = el('div', {}, el('strong', { text: title }), text ? el('span', { text }) : null);
    const node = el('div', { class: 'toast', dataset: { kind, key } }, icon(TOAST_ICONS[kind] || 'sparkle'), body);
    if (o.action) {
      const btn = el('button', { type: 'button', class: 'btn btn--xs toast__btn', 'data-air': '' }, o.action.label);
      btn.addEventListener('click', () => { this._out(node); o.action.run(); });
      body.append(el('div', { class: 'toast__actions' }, btn));
    }
    this.toastsEl.append(node);
    this._trim();
    node._t = setTimeout(() => this._out(node), ms);
    if (o.sound !== false) this.app.sound?.play(o.sound || (kind === 'error' ? 'error' : 'notify'));
    return node;
  }

  /**
   * Question non bloquante (deux boutons, utilisables au curseur aérien).
   * @returns {Promise<boolean>} true = accepté ; false = refusé ou sans réponse.
   */
  ask(title, text, { yes = 'Accepter', no = 'Refuser', ms = 30000 } = {}) {
    return new Promise((resolve) => {
      let done = false;
      const ok = el('button', { type: 'button', class: 'btn btn--primary btn--xs toast__btn', 'data-air': '' }, yes);
      const ko = el('button', { type: 'button', class: 'btn btn--xs toast__btn', 'data-air': '' }, no);
      const node = el('div', { class: 'toast toast--ask', role: 'alertdialog', 'aria-label': title, dataset: { kind: 'ask' } },
        icon('link'),
        el('div', {}, el('strong', { text: title }), el('span', { text }), el('div', { class: 'toast__actions' }, ok, ko)));
      const finish = (v) => {
        if (done) return;
        done = true;
        clearTimeout(node._t);
        this._out(node);
        resolve(v);
      };
      ok.addEventListener('click', () => finish(true));
      ko.addEventListener('click', () => finish(false));
      this.toastsEl.append(node);
      this._trim();
      node._t = setTimeout(() => finish(false), ms);
      this.app.sound?.play('notify');
    });
  }

  _trim() {
    // Les questions en attente ne sont jamais écartées par les notifications.
    const plain = [...this.toastsEl.children].filter((n) => n.dataset.kind !== 'ask');
    while (plain.length > 4) plain.shift().remove();
  }

  _out(node) {
    if (!node.isConnected || node.classList.contains('is-out')) return;
    node.classList.add('is-out');
    setTimeout(() => node.remove(), 320);
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
