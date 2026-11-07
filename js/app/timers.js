// Minuteries (plusieurs à la fois), alarmes à heure fixe, chronomètre,
// avec anneau de progression et sonnerie.

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
    this.chrono = { running: false, startedAt: 0, acc: 0 };
    $('#chronoToggle').addEventListener('click', () => (this.chrono.running ? this.chronoStop() : this.chronoStart()));
    $('#chronoReset').addEventListener('click', () => this.chronoReset());
    setInterval(() => this._tick(), 250);
    this._chronoLoop = this._chronoLoop.bind(this);
    this._chronoRender();
  }

  // ——— Chronomètre ———————————————————————————————————————————————

  chronoElapsed() { return this.chrono.acc + (this.chrono.running ? performance.now() - this.chrono.startedAt : 0); }

  chronoStart() {
    if (this.chrono.running) return false;
    this.chrono.running = true;
    this.chrono.startedAt = performance.now();
    this.app.sound.play('ok');
    requestAnimationFrame(this._chronoLoop);
    this._chronoRender();
    return true;
  }

  chronoStop() {
    if (!this.chrono.running) return false;
    this.chrono.acc = this.chronoElapsed();
    this.chrono.running = false;
    this.app.sound.play('click');
    this._chronoRender();
    return true;
  }

  chronoReset() {
    this.chrono = { running: false, startedAt: 0, acc: 0 };
    this._chronoRender();
  }

  _chronoLoop() {
    this._chronoRender();
    if (this.chrono.running) requestAnimationFrame(this._chronoLoop);
  }

  _chronoRender() {
    const ms = this.chronoElapsed();
    const s = Math.floor(ms / 1000);
    $('#chronoTime').textContent = `${formatDuration(s)},${Math.floor((ms % 1000) / 100)}`;
    const btn = $('#chronoToggle');
    btn.setAttribute('aria-pressed', String(this.chrono.running));
    btn.querySelector('span').textContent = this.chrono.running ? 'Pause' : ms ? 'Reprendre' : 'Démarrer';
    $('#chronoReset').disabled = !ms;
    $('#chrono').classList.toggle('is-running', this.chrono.running);
  }

  // ——— Minuteries et alarmes —————————————————————————————————————

  /** Alarme à une date précise (aujourd'hui ou demain). */
  addAt(date, label = '') {
    const seconds = Math.max(1, Math.round((date.getTime() - Date.now()) / 1000));
    const hhmm = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    const t = this.add(seconds, label || `Alarme ${hhmm}`);
    t.alarm = hhmm;
    this.render();
    return t;
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
        el('div', {}, el('div', { class: 'timer__left', text: t.done ? 'Terminé' : t.alarm && left > 3600 ? `à ${t.alarm}` : formatDuration(left) }), el('div', { class: 'timer__label', text: t.label || spokenDuration(t.total) })),
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
        if (!t.done) li.querySelector('.timer__left').textContent = t.alarm && left > 3600 ? `à ${t.alarm}` : formatDuration(left);
      }
      if (!t.done && left <= 0) {
        t.done = true;
        this.app.sound.play('alarm');
        const what = t.alarm ? `Il est ${t.alarm.replace(':', ' heures ')}.${t.label && !t.label.startsWith('Alarme') ? ` C’est l’heure : ${t.label}.` : ''}`
          : `${t.label ? `La minuterie « ${t.label} »` : `La minuterie de ${spokenDuration(t.total)}`} est terminée.`;
        this.app.ui.toast(t.alarm ? 'Alarme' : 'Minuterie terminée', t.label || spokenDuration(t.total), { kind: 'warn', sound: false, ms: 8000 });
        this.app.assistant?.say(what);
        setTimeout(() => this.remove(t.id), 10000);
        this.render();
      }
    }
    void force;
  }
}
