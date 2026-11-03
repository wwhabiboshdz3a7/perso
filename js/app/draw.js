// Dessin dans l'air : index levé = dessiner, pincement = couleur suivante,
// poing = gomme, deux index levés = tout effacer. Souris et doigt aussi.

import { $, el, fitCanvas } from './dom.js';

export const PALETTE = [
  ['Cyan', '#6ee7ff'], ['Ambre', '#ffb547'], ['Magenta', '#ff6bd5'], ['Vert', '#6effc1'], ['Blanc', '#f2fbff'], ['Rouge', '#ff6b78'],
];

export class Draw {
  constructor(app) {
    this.app = app;
    this.canvas = $('#drawCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.wrap = $('#drawWrap');
    this.brush = $('#drawBrush');
    this.strokes = [];
    this.current = null;
    this.layer = document.createElement('canvas'); // traits terminés
    this.layerCtx = this.layer.getContext('2d');
    this._raf = 0;
    this.colorIndex = 0;
    this.size = 8;
    this.eraser = false;
    this.active = false;
    this._buildPalette();
    this._bind();
    new ResizeObserver(() => this.active && this.redraw()).observe(this.wrap);
  }

  get color() { return PALETTE[this.colorIndex][1]; }

  _buildPalette() {
    const box = $('#swatches');
    PALETTE.forEach(([name, c], i) => {
      const b = el('button', { type: 'button', class: 'swatch', role: 'radio', 'aria-checked': String(i === 0), 'aria-label': name, style: { '--c': c }, 'data-air': '' });
      b.addEventListener('click', () => this.setColor(i));
      box.append(b);
    });
  }

  setColor(i) {
    this.colorIndex = (i + PALETTE.length) % PALETTE.length;
    [...$('#swatches').children].forEach((b, k) => b.setAttribute('aria-checked', String(k === this.colorIndex)));
    this.setEraser(false);
    this.brush.style.borderColor = this.color;
  }

  setEraser(on) {
    this.eraser = on;
    $('#btnEraser').setAttribute('aria-pressed', String(on));
    this.brush.classList.toggle('is-eraser', on);
  }

  _bind() {
    const size = $('#brushSize');
    const upd = () => { this.size = +size.value; size.style.setProperty('--p', `${((size.value - size.min) / (size.max - size.min)) * 100}%`); };
    size.addEventListener('input', upd);
    upd();
    $('#btnEraser').addEventListener('click', () => this.setEraser(!this.eraser));
    $('#btnClear').addEventListener('click', () => this.clear());
    $('#btnExport').addEventListener('click', () => this.export());
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      if (this.app.mouseHand?.enabled && e.pointerType === 'mouse') return;
      c.setPointerCapture(e.pointerId);
      this._begin(this._local(e.clientX, e.clientY), this.eraser);
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.current || this.current.src !== 'pointer') return;
      for (const ev of e.getCoalescedEvents ? e.getCoalescedEvents() : [e]) this._add(this._local(ev.clientX, ev.clientY));
    });
    const end = () => { if (this.current?.src === 'pointer') this._end(); };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    window.addEventListener('keydown', (e) => {
      if (!this.active || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
      if (e.target.closest?.('input, textarea')) return;
      e.preventDefault();
      this.strokes.pop();
      this.redraw();
    });
  }

  _local(x, y) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (x - r.left) / r.width, y: (y - r.top) / r.height };
  }

  _inside(s) {
    if (!s) return false;
    const r = this.canvas.getBoundingClientRect();
    if (s.x < r.left || s.x > r.right || s.y < r.top || s.y > r.bottom) return false;
    const under = document.elementFromPoint(s.x, s.y);
    return !!under && (under === this.canvas || under.closest('#drawWrap') === this.wrap) && !under.closest('button, input, label');
  }

  _begin(p, eraser, src = 'pointer') {
    this.current = { color: this.color, size: eraser ? Math.max(28, this.size * 3) : this.size, eraser, points: [p], src };
    this.strokes.push(this.current);
    this._schedule();
  }

  _add(p) {
    const s = this.current;
    if (!s) return;
    const last = s.points[s.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 0.0015) return;
    s.points.push(p);
    this._schedule();
  }

  _end() {
    const s = this.current;
    if (!s) return;
    if (s.points.length === 1) s.points.push({ ...s.points[0], x: s.points[0].x + 0.0005 });
    this.current = null;
    this._drawStroke(this.layerCtx, s, this._dims());
    this._compose();
  }

  _dims() {
    return { w: this.canvas.width, h: this.canvas.height, dpr: Math.min(2, window.devicePixelRatio || 1) };
  }

  /** Recomposition au plus une fois par image affichée. */
  _schedule() {
    if (!this._raf) this._raf = requestAnimationFrame(() => { this._raf = 0; this._compose(); });
  }

  /** Reconstruit le calque des traits terminés (redimensionnement, annulation, effacement). */
  redraw() {
    const { w, h } = fitCanvas(this.canvas);
    if (this.layer.width !== w || this.layer.height !== h) { this.layer.width = w; this.layer.height = h; }
    this.layerCtx.clearRect(0, 0, w, h);
    const d = this._dims();
    for (const s of this.strokes) if (s !== this.current) this._drawStroke(this.layerCtx, s, d);
    this._compose();
  }

  /** Calque des traits terminés + trait en cours (gomme comprise). */
  _compose() {
    const { w, h } = this._dims();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(this.layer, 0, 0);
    if (this.current) this._drawStroke(ctx, this.current, this._dims());
  }

  _path(s, w, h) {
    const pts = s.points;
    const path = new Path2D();
    const P = (p) => [p.x * w, p.y * h];
    let [x0, y0] = P(pts[0]);
    path.moveTo(x0, y0);
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = P(pts[i]);
      path.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      x0 = x1; y0 = y1;
    }
    path.lineTo(x0, y0);
    return path;
  }

  /**
   * Trait néon : halo en couches translucides (pas de shadowBlur, coûteux à
   * chaque image) puis cœur clair.
   */
  _drawStroke(ctx, s, { w, h, dpr }) {
    if (s.points.length < 2) return;
    const path = this._path(s, w, h);
    const lw = s.size * dpr;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (s.eraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = lw;
      ctx.stroke(path);
    } else {
      ctx.strokeStyle = s.color;
      for (const [k, a] of [[3.2, 0.07], [2.1, 0.13], [1.45, 0.28]]) {
        ctx.globalAlpha = a;
        ctx.lineWidth = lw * k;
        ctx.stroke(path);
      }
      ctx.globalAlpha = 1;
      ctx.lineWidth = lw;
      ctx.stroke(path);
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = Math.max(1, lw * 0.35);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke(path);
    }
    ctx.restore();
  }

  clear(silent) {
    this.strokes = [];
    this.current = null;
    this.redraw();
    if (!silent) {
      this.app.sound.play('swipe');
      this.app.ui.log('dessin', 'ardoise effacée');
      const r = this.canvas.getBoundingClientRect();
      this.app.fx.ring(r.left + r.width / 2, r.top + r.height / 2, { r0: 20, r1: Math.max(r.width, r.height) * 0.6, color: '#6ee7ff', dur: 0.6 });
    }
  }

  isEmpty() {
    return !this.strokes.some((s) => !s.eraser && s.points.length > 1);
  }

  async export() {
    if (this.isEmpty()) { this.app.ui.toast('Ardoise vide', 'Dessinez quelque chose avant d’exporter.', { kind: 'warn' }); return null; }
    const { w, h } = fitCanvas(this.canvas);
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const o = out.getContext('2d');
    o.fillStyle = '#03080c';
    o.fillRect(0, 0, w, h);
    o.drawImage(this.canvas, 0, 0);
    const blob = await new Promise((r) => out.toBlob(r, 'image/png'));
    const t = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const rec = await this.app.gallery.add(blob, { name: `Dessin ${t}`, source: 'dessin', width: w, height: h });
    this.app.ui.toast('Dessin ajouté à la galerie', rec.name, { kind: 'ok' });
    this.app.ui.log('dessin', `exporté (${w}×${h} PNG)`);
    return rec;
  }

  start() { this.active = true; this.redraw(); }
  stop() { this.active = false; this._endGesture(); this.brush.classList.remove('is-on'); }

  _endGesture() {
    if (this.current && this.current.src === 'air') this._end();
  }

  /** À chaque image : tracé continu selon la pose de la main principale. */
  onFrame(result) {
    if (!this.active) return;
    const p = result.primary;
    const s = this.app.cursor.screen;
    // Deux index levés : geste « tout effacer » en cours, on ne trace pas.
    const twoIndex = result.hands.filter((h) => h.pose === 'point').length >= 2;
    if (!p || !s || twoIndex) { this._endGesture(); this.brush.classList.remove('is-on'); return; }
    const inside = this._inside(s);
    const r = this.wrap.getBoundingClientRect();
    this.brush.classList.toggle('is-on', inside);
    const eraserPose = p.pose === 'fist';
    const sz = eraserPose || this.eraser ? Math.max(28, this.size * 3) : Math.max(10, this.size);
    this.brush.style.width = this.brush.style.height = `${sz}px`;
    this.brush.style.margin = `${-sz / 2}px 0 0 ${-sz / 2}px`;
    this.brush.style.transform = `translate(${s.x - r.left}px, ${s.y - r.top}px)`;
    this.brush.classList.toggle('is-eraser', eraserPose || this.eraser);
    const drawing = inside && (p.pose === 'point' || eraserPose);
    if (!drawing) { this._endGesture(); return; }
    const pt = this._local(s.x, s.y);
    const wantEraser = eraserPose || this.eraser;
    if (!this.current || this.current.src !== 'air' || this.current.eraser !== wantEraser) {
      this._endGesture();
      this._begin(pt, wantEraser, 'air');
    } else {
      this._add(pt);
    }
  }

  onGesture(ev) {
    if (ev.type === 'gesture' && ev.name === 'Two_Index') {
      this.clear();
      this.app.ui.toast('Ardoise effacée', 'Deux index levés.', { sound: false });
      return true;
    }
    if (ev.type === 'pinchstart' && this._inside(this.app.cursor.screen)) {
      this._endGesture();
      this.setColor(this.colorIndex + 1);
      this.app.sound.play('pinch');
      const s = this.app.cursor.screen;
      this.app.fx.ring(s.x, s.y, { r0: 6, r1: 50, color: this.color, dur: 0.4 });
      this.app.ui.log('dessin', `couleur : ${PALETTE[this.colorIndex][0].toLowerCase()}`);
      return true;
    }
    if (ev.type === 'pinchend' && this._inside(this.app.cursor.screen)) return true;
    if (ev.type === 'grab' || ev.type === 'release') return true; // le poing sert de gomme ici
    return false;
  }
}
