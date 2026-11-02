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
    this.redraw();
  }

  _add(p) {
    const s = this.current;
    if (!s) return;
    const last = s.points[s.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 0.0015) return;
    s.points.push(p);
    this._drawStroke(this.ctx, s, this._dims(), s.points.length - 2);
  }

  _end() {
    if (this.current && this.current.points.length === 1) this.current.points.push({ ...this.current.points[0], x: this.current.points[0].x + 0.0005 });
    this.current = null;
    this.redraw();
  }

  _dims() {
    return { w: this.canvas.width, h: this.canvas.height, dpr: Math.min(2, window.devicePixelRatio || 1) };
  }

  redraw() {
    const { w, h } = fitCanvas(this.canvas);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    const d = this._dims();
    for (const s of this.strokes) this._drawStroke(ctx, s, d, 0);
  }

  _drawStroke(ctx, s, { w, h, dpr }, from) {
    const pts = s.points;
    if (pts.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = s.size * dpr;
    if (s.eraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000';
    } else {
      ctx.strokeStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = s.size * 1.6 * dpr;
    }
    ctx.beginPath();
    const P = (p) => [p.x * w, p.y * h];
    const start = Math.max(0, from);
    let [x0, y0] = P(pts[start]);
    if (start === 0) ctx.moveTo(x0, y0);
    else { const [px, py] = P(pts[start - 1] || pts[start]); ctx.moveTo((px + x0) / 2, (py + y0) / 2); }
    for (let i = start + 1; i < pts.length; i++) {
      const [x1, y1] = P(pts[i]);
      ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      x0 = x1; y0 = y1;
    }
    ctx.lineTo(x0, y0);
    ctx.stroke();
    if (!s.eraser) {
      // Cœur lumineux plus fin.
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = Math.max(1, s.size * 0.35) * dpr;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
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
    if (!p || !s) { this._endGesture(); this.brush.classList.remove('is-on'); return; }
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
