// Mémo : notes dictées ou tapées, gardées dans ce navigateur (localStorage),
// cochables, supprimables, synchronisées entre les fenêtres ouvertes.

import { $, el, icon } from './dom.js';

const KEY = 'jarvis.notes.v1';
const MAX = 200;

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((n) => n && typeof n.text === 'string').slice(0, MAX) : [];
  } catch { return []; }
}

export class Notes {
  constructor(app) {
    this.app = app;
    this.list = load();
    this.ul = $('#notes');
    $('#noteForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#noteInput');
      if (this.add(input.value)) input.value = '';
    });
    $('#btnNotesClear').addEventListener('click', () => {
      if (!this.list.length || !confirm('Effacer toutes les notes du mémo ?')) return;
      this.clear();
    });
    window.addEventListener('storage', (e) => { if (e.key === KEY) { this.list = load(); this.render(); } });
    this.render();
  }

  _save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.list)); } catch { /* stockage plein ou bloqué */ }
  }

  /** Ajoute une note ; renvoie la note créée, ou null si le texte est vide. */
  add(text) {
    const t = String(text || '').trim().replace(/\s+/g, ' ').slice(0, 280);
    if (!t) return null;
    const note = { id: Math.random().toString(36).slice(2, 10), text: t.charAt(0).toUpperCase() + t.slice(1), at: Date.now(), done: false };
    this.list.unshift(note);
    this.list = this.list.slice(0, MAX);
    this._save();
    this.render();
    this.app.ui.log('voix', `mémo : ${note.text}`);
    return note;
  }

  toggle(id) {
    const n = this.list.find((x) => x.id === id);
    if (!n) return;
    n.done = !n.done;
    this._save();
    this.render();
  }

  remove(id) {
    this.list = this.list.filter((x) => x.id !== id);
    this._save();
    this.render();
  }

  clear() {
    const n = this.list.length;
    this.list = [];
    this._save();
    this.render();
    return n;
  }

  /** Phrase lue à voix haute (« lis mes notes »). */
  spoken() {
    const open = this.list.filter((n) => !n.done);
    if (!open.length) return this.list.length ? 'Toutes vos notes sont cochées.' : 'Votre mémo est vide.';
    const items = open.slice(0, 6).map((n) => n.text.replace(/[.!?]+$/, ''));
    const more = open.length > 6 ? `, et ${open.length - 6} autre${open.length - 6 > 1 ? 's' : ''}` : '';
    return `${open.length === 1 ? 'Une note' : `${open.length} notes`} : ${items.join(' ; ')}${more}.`;
  }

  render() {
    this.ul.textContent = '';
    for (const n of this.list) {
      const li = el('li', { class: `note${n.done ? ' is-done' : ''}` });
      const check = el('button', { type: 'button', class: 'note__check', 'aria-pressed': String(n.done), 'aria-label': n.done ? `Décocher « ${n.text} »` : `Cocher « ${n.text} »`, 'data-air': '', onclick: () => this.toggle(n.id) }, icon('check'));
      const del = el('button', { type: 'button', class: 'icon-btn icon-btn--sm', 'aria-label': `Supprimer « ${n.text} »`, 'data-air': '', onclick: () => this.remove(n.id) }, icon('close'));
      li.append(check, el('span', { class: 'note__text', text: n.text }), del);
      this.ul.append(li);
    }
    const open = this.list.filter((n) => !n.done).length;
    $('#notesCount').textContent = String(open);
    $('#notesEmpty').hidden = this.list.length > 0;
    $('#btnNotesClear').hidden = !this.list.length;
  }
}
