// Boîte de dialogue des réglages, calibration des seuils et cerveau IA.

import { $, $$, el } from './dom.js';
import { PROVIDERS } from './ai.js';
import { DEFAULTS } from './store.js';
import { db } from './db.js';

const FORMAT = {
  sensitivity: (v) => `${(+v).toFixed(2).replace('.', ',')}×`,
  smoothing: (v) => `${Math.round(v * 100)} %`,
  pinchOn: (v) => (+v).toFixed(2).replace('.', ','),
  debounce: (v) => `${v} ms`,
  swipeSpeed: (v) => (+v).toFixed(2).replace('.', ','),
  rate: (v) => `${(+v).toFixed(2).replace('.', ',')}×`,
  volume: (v) => `${Math.round(v * 100)} %`,
};

export class SettingsUI {
  constructor(app) {
    this.app = app;
    this.dialog = $('#dlgSettings');
    this.form = $('#settingsForm');
    this._providers();
    this._tabs();
    this._fields();
    this._buttons();
    app.bus.on('voices', (v) => this._voices(v));
    this._voices(app.assistant.voices);
  }

  open(tab) {
    this.app.assistant.ensureVoices();
    this._load();
    if (tab) this._select($(`#tab${tab}`));
    this.app.openDialog(this.dialog);
    requestAnimationFrame(() => this._tabEdges?.());
  }

  _providers() {
    const sel = $('#aiProvider');
    for (const [k, p] of Object.entries(PROVIDERS)) sel.append(el('option', { value: k, text: p.label }));
  }

  _voices(list = []) {
    const sel = $('#voiceSelect');
    const keep = this.app.settings.get('voice');
    sel.textContent = '';
    sel.append(el('option', { value: '', text: 'Voix française par défaut' }));
    for (const v of list) sel.append(el('option', { value: v.name, text: `${v.name} (${v.lang})`, selected: v.name === keep }));
    if (!('speechSynthesis' in window)) sel.disabled = true;
  }

  _tabs() {
    const tabs = $$('[role="tab"]', this.dialog);
    // Onglets plus larges que l'écran : fondu sur le bord qui défile encore.
    const bar = $('.tabs', this.dialog);
    this._tabEdges = () => {
      const max = bar.scrollWidth - bar.clientWidth;
      bar.classList.toggle('is-scrollable', max > 2);
      bar.classList.toggle('is-start', bar.scrollLeft <= 2);
      bar.classList.toggle('is-end', bar.scrollLeft >= max - 2);
    };
    bar.addEventListener('scroll', this._tabEdges, { passive: true });
    window.addEventListener('resize', this._tabEdges);
    tabs.forEach((t) => {
      t.addEventListener('click', () => this._select(t));
      t.addEventListener('keydown', (e) => {
        const i = tabs.indexOf(t);
        const j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
        if (j >= 0) { e.preventDefault(); this._select(tabs[j]); tabs[j].focus(); }
      });
    });
  }

  _select(tab) {
    if (!tab) return;
    for (const t of $$('[role="tab"]', this.dialog)) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
    }
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    this._tabEdges?.();
  }

  _load() {
    const s = this.app.settings.data;
    for (const input of this.form.elements) {
      const k = input.name;
      if (!k || !(k in DEFAULTS)) continue;
      if (input.type === 'checkbox') input.checked = !!s[k];
      else input.value = s[k] ?? '';
      this._out(input);
    }
    const key = this.form.elements.aiKey;
    key.value = this.app.settings.aiKey;
    if (!s.aiSystem) this.form.elements.aiSystem.placeholder = this.app.assistant.brain.config().system;
    this._brainBadge();
  }

  _out(input) {
    const out = this.form.elements[`${input.name}Out`];
    if (out && FORMAT[input.name]) out.value = FORMAT[input.name](input.value);
    if (input.type === 'range') input.style.setProperty('--p', `${((input.value - input.min) / (input.max - input.min)) * 100}%`);
  }

  _fields() {
    const numeric = new Set(['sensitivity', 'smoothing', 'pinchOn', 'debounce', 'swipeSpeed', 'rate', 'volume']);
    const onChange = (e) => {
      const input = e.target;
      const k = input.name;
      if (k === 'aiKey') { this.app.settings.aiKey = input.value; this._brainBadge(); return; }
      if (!k || !(k in DEFAULTS)) return;
      let v = input.type === 'checkbox' ? input.checked : input.value;
      if (numeric.has(k)) v = +v;
      if (k === 'aiProvider') {
        const p = PROVIDERS[v];
        this.form.elements.aiBase.value = p.base;
        this.form.elements.aiModel.value = p.model;
        this.app.settings.set({ aiBase: p.base, aiModel: p.model });
      }
      if (k === 'aiRemember') {
        const key = this.app.settings.aiKey;
        this.app.settings.set({ aiRemember: v });
        this.app.settings.aiKey = key;
        return;
      }
      this.app.settings.set({ [k]: v });
      this._out(input);
      if (k.startsWith('ai')) this._brainBadge();
    };
    this.form.addEventListener('input', (e) => { if (e.target.type === 'range') onChange(e); else this._out(e.target); });
    this.form.addEventListener('change', onChange);
  }

  _brainBadge() {
    const b = $('#brainBadge');
    const on = this.app.assistant.brain.enabled;
    b.textContent = on ? 'actif' : 'désactivé';
    b.classList.toggle('is-on', on);
    this.app.assistant.renderBrain();
  }

  _buttons() {
    $('#btnAiTest').addEventListener('click', async () => {
      const st = $('#aiStatus');
      st.className = 'brain__status';
      if (!this.app.assistant.brain.enabled) { st.textContent = 'Choisissez d’abord un fournisseur.'; st.classList.add('is-err'); return; }
      st.textContent = 'Test en cours…';
      try {
        const r = await this.app.assistant.brain.test();
        st.textContent = `Réponse : ${r.slice(0, 80)}`;
        st.classList.add('is-ok');
      } catch (err) {
        st.textContent = err.message;
        st.classList.add('is-err');
      }
    });
    $('#btnAiForget').addEventListener('click', () => {
      this.app.settings.forgetAiKey();
      this.form.elements.aiKey.value = '';
      $('#aiStatus').textContent = 'Clé effacée de ce navigateur.';
      this._brainBadge();
    });
    $('#btnReplayTuto').addEventListener('click', () => { this.dialog.close(); this.app.openTutorial(); });
    $('#btnResetPhotos').addEventListener('click', async () => {
      if (!confirm('Supprimer toutes les photos de cet appareil ?')) return;
      await this.app.gallery.clearAll();
      this.app.ui.toast('Photos supprimées', 'La galerie de cet appareil est vide.', { kind: 'ok' });
    });
    $('#btnResetAll').addEventListener('click', async () => {
      if (!confirm('Réinitialiser JARVIS (réglages, photos, gestes enregistrés, clé IA) ?')) return;
      this.app.settings.reset();
      try {
        await db.destroy();
        location.reload();
      } catch (err) {
        if (!err?.blocked) throw err;
        // Une autre fenêtre garde la base ouverte : pas de rechargement sur
        // une suppression en suspens (la galerie resterait bloquée).
        this.dialog.close();
        this.app.ui.toast('Réinitialisation en attente', 'Fermez les autres fenêtres ou onglets JARVIS : la réinitialisation se terminera ensuite.', {
          kind: 'warn', ms: 15000, action: { label: 'Recharger', run: () => location.reload() },
        });
      }
    });
    $('#btnCalib').addEventListener('click', () => this.calibrate());
  }

  /** Calibration : mesure du rapport pouce-index main ouverte, puis pincée. */
  async calibrate() {
    const app = this.app;
    const msg = $('#calibMsg'), bar = $('#calibBar'), btn = $('#btnCalib');
    if (!app.camera.active && !app.pipeline.override) {
      msg.textContent = 'Activez d’abord la caméra (panneau Optique), puis relancez la calibration.';
      return;
    }
    btn.disabled = true;
    const steps = [
      ['open', 'Montrez la main ouverte, paume vers l’écran…'],
      ['pinch', 'Pincez le pouce et l’index, et maintenez…'],
      ['fist', 'Fermez le poing…'],
    ];
    const res = {};
    for (const [k, text] of steps) {
      msg.textContent = text;
      app.sound.play('notify');
      const vals = [];
      let poses = 0, frames = 0;
      const off = app.pipeline.on('frame', ({ result }) => {
        const p = result.primary;
        if (!p) return;
        frames++;
        vals.push(p.pinchRatio);
        if ((k === 'fist' && p.pose === 'fist') || (k === 'open' && p.pose === 'open')) poses++;
      });
      const t0 = performance.now();
      await new Promise((r) => {
        const tick = () => {
          const k2 = (performance.now() - t0) / 3000;
          bar.style.width = `${Math.min(100, ((steps.findIndex((s) => s[0] === k) + k2) / steps.length) * 100)}%`;
          if (k2 >= 1) r(); else requestAnimationFrame(tick);
        };
        tick();
      });
      off();
      vals.sort((a, b) => a - b);
      res[k] = { median: vals.length ? vals[Math.floor(vals.length / 2)] : null, ratio: frames ? poses / frames : 0 };
    }
    btn.disabled = false;
    if (res.open.median === null || res.pinch.median === null) {
      msg.textContent = 'Aucune main détectée. Placez-vous dans un endroit éclairé et réessayez.';
      return;
    }
    const on = Math.min(0.45, Math.max(0.12, res.pinch.median + (res.open.median - res.pinch.median) * 0.28));
    app.settings.set({ pinchOn: +on.toFixed(2) });
    this._load();
    const fistOk = res.fist.ratio > 0.5 ? 'poing bien reconnu' : 'poing peu reconnu : serrez davantage';
    const f2 = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    msg.textContent = `Calibré : seuil de pincement ${f2(on)} (main ouverte ${f2(res.open.median)}, pincée ${f2(res.pinch.median)}) · ${fistOk}.`;
    app.ui.log('système', 'calibration terminée');
  }
}
