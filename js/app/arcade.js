// Module 04 · Arcade : jeu de cibles en 30 secondes, à la main (pincement ou
// poing sur la cible), à la souris ou au doigt. Pensé pour les démonstrations
// sur un salon : une partie se lance d'un geste, le record reste affiché.

import { $, $$, el, clamp, reducedMotion } from './dom.js';
import { C } from './theme.js';

const LEVELS = {
  facile: { label: 'Facile', spawn: 900, life: 2600, size: [96, 120], decoy: 0 },
  normal: { label: 'Normal', spawn: 680, life: 1900, size: [76, 100], decoy: 0.1 },
  expert: { label: 'Expert', spawn: 480, life: 1350, size: [58, 82], decoy: 0.16 },
};
const DURATION = 30;
const MAX_COMBO = 5;

export class Arcade {
  constructor(app) {
    this.app = app;
    this.arena = $('#arena');
    this.level = 'normal';
    this.running = false;
    this.targets = new Map();
    this.score = 0;
    this.combo = 1;
    this.hits = 0;
    this.misses = 0;
    this._tick = this._tick.bind(this);
    for (const b of $$('[data-level]')) b.addEventListener('click', () => this.setLevel(b.dataset.level));
    $('#btnArcadeStart').addEventListener('click', () => this.start());
    $('#btnArcadeAgain').addEventListener('click', () => this.start());
    this.arena.addEventListener('pointerdown', (e) => {
      // Clic dans le vide pendant une partie : léger malus de série, pas de points perdus.
      if (this.running && e.target === this.arena) this._breakCombo();
    });
    this._renderBest();
    this._renderHud();
  }

  get best() { return this.app.settings.get('arcadeBest') || 0; }

  setLevel(l) {
    if (!LEVELS[l] || this.running) return;
    this.level = l;
    for (const b of $$('[data-level]')) b.setAttribute('aria-pressed', String(b.dataset.level === l));
  }

  async start() {
    if (this.running || this._starting) return;
    this._starting = true;
    this.stop(true);
    $('#arcadeEnd').hidden = true;
    $('#arcadeIntro').hidden = true;
    this.score = 0; this.combo = 1; this.hits = 0; this.misses = 0;
    this._renderHud(DURATION);
    const cd = $('#arcadeCount');
    cd.hidden = false;
    for (const n of ['3', '2', '1']) {
      if (this.app.mode !== 'arcade') { cd.hidden = true; this._starting = false; return; }
      cd.textContent = n;
      cd.classList.remove('is-pop'); void cd.offsetWidth; cd.classList.add('is-pop');
      this.app.sound.play('count');
      await new Promise((r) => setTimeout(r, reducedMotion() ? 300 : 650));
    }
    cd.hidden = true;
    this._starting = false;
    if (this.app.mode !== 'arcade') return;
    this.running = true;
    this.t0 = performance.now();
    this.nextSpawn = 0;
    this.app.sound.play('ok');
    this.app.ui.log('système', `arcade : partie ${LEVELS[this.level].label.toLowerCase()}`);
    document.body.classList.add('is-playing');
    requestAnimationFrame(this._tick);
  }

  /** Arrête la partie en cours (silencieux : sans écran de fin). */
  stop(silent = false) {
    const was = this.running;
    this.running = false;
    document.body.classList.remove('is-playing');
    for (const t of this.targets.values()) t.node.remove();
    this.targets.clear();
    if (was && !silent) this._end();
  }

  _tick(now) {
    if (!this.running) return;
    const elapsed = (now - this.t0) / 1000;
    const left = Math.max(0, DURATION - elapsed);
    const L = LEVELS[this.level];
    // Le rythme s'accélère un peu au fil de la partie.
    const pace = 1 - Math.min(0.35, elapsed / DURATION * 0.35);
    if (now >= this.nextSpawn && this.targets.size < 6) {
      this._spawn(L, now);
      this.nextSpawn = now + L.spawn * pace * (0.75 + Math.random() * 0.5);
    }
    for (const [id, t] of this.targets) {
      const k = (now - t.born) / t.life;
      t.node.style.setProperty('--life', String(clamp(1 - k, 0, 1)));
      if (k >= 1) {
        this.targets.delete(id);
        t.node.classList.add('is-gone');
        setTimeout(() => t.node.remove(), 200);
        if (!t.decoy) { this.misses++; this._breakCombo(); }
      }
    }
    this._renderHud(left);
    if (left <= 0) { this.stop(); return; }
    requestAnimationFrame(this._tick);
  }

  _spawn(L, now) {
    const r = this.arena.getBoundingClientRect();
    if (r.width < 80 || r.height < 80) return;
    const size = Math.round(L.size[0] + Math.random() * (L.size[1] - L.size[0]));
    const decoy = Math.random() < L.decoy;
    const gold = !decoy && Math.random() < 0.12;
    // Position libre, sans chevaucher les cibles déjà présentes.
    let x = 0, y = 0;
    for (let tries = 0; tries < 12; tries++) {
      x = size / 2 + Math.random() * (r.width - size);
      y = size / 2 + Math.random() * (r.height - size);
      if ([...this.targets.values()].every((t) => Math.hypot(t.x - x, t.y - y) > (t.size + size) / 2 + 8)) break;
    }
    const id = Math.random().toString(36).slice(2, 9);
    const kind = decoy ? 'decoy' : gold ? 'gold' : 'normal';
    const label = decoy ? 'Leurre : ne pas toucher' : gold ? 'Cible dorée, 30 points' : 'Cible, 10 points';
    const node = el('button', {
      type: 'button', class: `target target--${kind}`, 'data-air': '', 'aria-label': label,
      style: { left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` },
    }, el('i'), el('i'), el('b', { text: decoy ? '✕' : gold ? '×3' : '' }));
    node.addEventListener('click', (e) => { e.stopPropagation(); this.hit(id); });
    this.arena.append(node);
    this.targets.set(id, { node, x, y, size, born: now, life: L.life * (gold ? 0.8 : 1), decoy, gold });
  }

  /** Touche une cible (clic, pincement aérien ou poing). */
  hit(id) {
    const t = this.targets.get(id);
    if (!t || !this.running) return false;
    this.targets.delete(id);
    const r = t.node.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    t.node.classList.add('is-hit');
    setTimeout(() => t.node.remove(), 260);
    if (t.decoy) {
      this.score = Math.max(0, this.score - 20);
      this._breakCombo();
      this.app.sound.play('error');
      this._float(cx, cy, '−20', 'bad');
      this.app.fx.ring(cx, cy, { r0: 10, r1: 90, color: '#ff6b78', dur: 0.4 });
      return true;
    }
    const pts = (t.gold ? 30 : 10) * this.combo;
    this.score += pts;
    this.hits++;
    this.combo = Math.min(MAX_COMBO, this.combo + (this.hits % 3 === 0 ? 1 : 0));
    this.app.sound.play(t.gold ? 'land' : 'pinch');
    this._float(cx, cy, `+${pts}`, t.gold ? 'gold' : '');
    this.app.fx.burst(cx, cy, { color: t.gold ? C.accent : C.primary, count: t.gold ? 46 : 26, speed: 340 });
    this.app.fx.ring(cx, cy, { r0: 10, r1: t.size, color: t.gold ? C.accent : C.primary, dur: 0.45 });
    this._renderHud();
    return true;
  }

  _breakCombo() {
    if (this.combo > 1) this.app.sound.play('swipe');
    this.combo = 1;
    this._renderHud();
  }

  _float(x, y, text, cls) {
    const a = this.arena.getBoundingClientRect();
    const n = el('span', { class: `arena__float ${cls ? `is-${cls}` : ''}`, text, style: { left: `${x - a.left}px`, top: `${y - a.top}px` }, 'aria-hidden': 'true' });
    this.arena.append(n);
    setTimeout(() => n.remove(), 900);
  }

  _renderHud(left) {
    $('#arcScore').textContent = String(this.score);
    $('#arcCombo').textContent = `×${this.combo}`;
    if (left !== undefined) {
      $('#arcTime').textContent = String(Math.ceil(left));
      $('#arcTimeBar').style.transform = `scaleX(${left / DURATION})`;
    }
  }

  _renderBest() { $('#arcBest').textContent = String(this.best); }

  _end() {
    const total = this.hits + this.misses;
    const acc = total ? Math.round((this.hits / total) * 100) : 0;
    const record = this.score > this.best;
    if (record) this.app.settings.set({ arcadeBest: this.score });
    this._renderBest();
    $('#arcEndScore').textContent = String(this.score);
    $('#arcEndInfo').textContent = `${this.hits} cible${this.hits > 1 ? 's' : ''} touchée${this.hits > 1 ? 's' : ''} · précision ${acc} % · niveau ${LEVELS[this.level].label.toLowerCase()}`;
    $('#arcEndTitle').textContent = record ? 'Nouveau record !' : 'Partie terminée';
    $('#arcadeEnd').hidden = false;
    this.app.sound.play(record ? 'land' : 'notify');
    if (record) {
      const r = this.arena.getBoundingClientRect();
      this.app.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { color: C.accent, count: 90, speed: 520 });
    }
    this.app.assistant?.say(record ? `Nouveau record : ${this.score} points !` : `${this.score} points. Précision ${acc} pour cent.`);
    this.app.ui.log('système', `arcade : ${this.score} points${record ? ' (record)' : ''}`);
    $('#btnArcadeAgain').focus({ preventScroll: true });
  }

  /** Mode quitté : la partie s'arrête sans écran de fin. */
  leave() {
    this.stop(true);
    $('#arcadeCount').hidden = true;
    $('#arcadeEnd').hidden = true;
    $('#arcadeIntro').hidden = false;
  }

  /** Poing fermé sur une cible : elle est touchée (en plus du pincement). */
  onGesture(ev) {
    if (!this.running || ev.type !== 'grab') return false;
    const s = this.app.cursor.screen;
    if (!s) return false;
    const node = document.elementFromPoint(s.x, s.y)?.closest('.target');
    const entry = node && [...this.targets.entries()].find(([, t]) => t.node === node);
    return entry ? this.hit(entry[0]) : false;
  }
}
