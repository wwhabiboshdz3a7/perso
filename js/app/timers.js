// Minuteries (plusieurs à la fois), avec anneau de progression et alarme.

import { $, el, icon } from './dom.js';

export function formatDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function spokenDuration(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.round(sec % 60);
  const parts = [];
  if (h) parts.push(`${h} heure${h > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} minute${m > 1 ? 's' : ''}`);
  if (s) parts.push(`${s} seconde${s > 1 ? 's' : ''}`);
  return parts.join(' et ') || '0 seconde';
}

export class Timers {
  constructor(app) {
    this.app = app;
    this.list = [];
    this.ul = $('#timers');
    setInterval(() => this._tick(), 250);
  }

  add(seconds, label = '') {
    const t = { id: Math.random().toString(36).slice(2), total: seconds, endsAt: Date.now() + seconds * 1000, label, done: false };
    this.list.push(t);
    this.render();
    this.app.ui.log('voix', `minuterie ${spokenDuration(seconds)}${label ? ` (${label})` : ''}`);
    return t;
  }

  clear() {
    const n = this.list.length;
    this.list = [];
    this.render();
    return n;
  }

  remove(id) {
    this.list = this.list.filter((t) => t.id !== id);
    this.render();
  }

  render() {
    this.ul.textContent = '';
    for (const t of this.list) {
      const left = Math.max(0, (t.endsAt - Date.now()) / 1000);
      const li = el('li', { class: `timer${t.done ? ' is-done' : ''}`, dataset: { id: t.id } });
      li.innerHTML = '<svg class="timer__ring" viewBox="0 0 38 38" aria-hidden="true"><circle class="t-track" cx="19" cy="19" r="16"/><circle class="t-prog" cx="19" cy="19" r="16"/></svg>';
      li.append(
        el('div', {}, el('div', { class: 'timer__left', text: t.done ? 'Terminé' : formatDuration(left) }), el('div', { class: 'timer__label', text: t.label || spokenDuration(t.total) })),
        el('button', { type: 'button', class: 'icon-btn icon-btn--sm', 'aria-label': `Supprimer la minuterie ${t.label || spokenDuration(t.total)}`, onclick: () => this.remove(t.id), 'data-air': '' }, icon('close')),
      );
      this.ul.append(li);
    }
    $('#timersEmpty').hidden = this.list.length > 0;
    $('#timersCount').textContent = String(this.list.length);
    this._tick(true);
  }

  _tick(force) {
    if (!this.list.length) return;
    const now = Date.now();
    for (const t of this.list) {
      const left = Math.max(0, (t.endsAt - now) / 1000);
      const li = this.ul.querySelector(`[data-id="${t.id}"]`);
      if (li) {
        li.querySelector('.t-prog').style.strokeDashoffset = String(100.53 * (1 - left / t.total));
        if (!t.done) li.querySelector('.timer__left').textContent = formatDuration(left);
      }
      if (!t.done && left <= 0) {
        t.done = true;
        this.app.sound.play('alarm');
        const what = t.label ? `La minuterie « ${t.label} »` : `La minuterie de ${spokenDuration(t.total)}`;
        this.app.ui.toast('Minuterie terminée', t.label || spokenDuration(t.total), { kind: 'warn', sound: false, ms: 8000 });
        this.app.assistant?.say(`${what} est terminée.`);
        setTimeout(() => this.remove(t.id), 10000);
        this.render();
      }
    }
    void force;
  }
}
