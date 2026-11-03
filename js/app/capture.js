// Capture : photo webcam avec cadre HUD (geste « victoire » ou commande vocale).

import { $, sleep, reducedMotion } from './dom.js';
import { simulatedFeed } from './demo-images.js';

export class Capture {
  constructor(app) {
    this.app = app;
    this.busy = false;
    this.countEl = $('#countdown');
  }

  /**
   * Sans caméra, une « capture » n'a de sens qu'en démonstration (flux simulé,
   * clairement marqué comme tel) : ailleurs, on demande d'activer la caméra.
   */
  available() {
    const app = this.app;
    return !!(app.camera?.active || app.mouseHand?.enabled || app.player?.active || app.pipeline?.override === 'simulation');
  }

  /** @param {{countdown?:boolean, via?:string}} [o] via : « geste victoire », « commande vocale »… */
  async take({ countdown = true, via = 'geste victoire' } = {}) {
    if (this.busy) return null;
    if (!this.available()) {
      this.app.ui.toast('Caméra inactive', 'Activez d’abord la caméra (panneau Optique) pour prendre une capture.', { kind: 'warn' });
      return null;
    }
    this.busy = true;
    try {
      if (countdown && !reducedMotion()) {
        for (const n of [3, 2, 1]) {
          this.countEl.textContent = String(n);
          this.countEl.classList.remove('is-on');
          void this.countEl.offsetWidth;
          this.countEl.classList.add('is-on');
          this.app.sound.play('count');
          await sleep(650);
        }
      }
      this.countEl.classList.remove('is-on');
      const canvas = this._compose(via);
      this.app.sound.play('shutter');
      const flash = document.createElement('div');
      flash.className = 'flash';
      document.body.append(flash);
      setTimeout(() => flash.remove(), 600);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
      const t = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const simulated = !this._live;
      const rec = await this.app.gallery.add(blob, { name: `${simulated ? 'Capture simulée' : 'Capture'} ${t}`, source: 'capture', width: canvas.width, height: canvas.height });
      this.app.ui.toast('Capture enregistrée', `${rec.name} · ${canvas.width}×${canvas.height}`, { kind: 'ok', sound: false });
      this.app.ui.log('capture', rec.name);
      return rec;
    } finally {
      this.busy = false;
    }
  }

  _compose(via) {
    const video = $('#camVideo');
    const live = !!(this.app.camera?.active && video.videoWidth);
    this._live = live;
    const w = live ? video.videoWidth : 1280;
    const h = live ? video.videoHeight : 720;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (live) {
      ctx.save();
      if (this.app.settings.get('mirror')) { ctx.translate(w, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(simulatedFeed(w, h), 0, 0);
    }
    this._hud(ctx, w, h, via);
    return c;
  }

  _hud(ctx, w, h, via = 'geste victoire') {
    const u = Math.max(1, Math.round(Math.min(w, h) / 360));
    const cyan = '#6ee7ff', amber = '#ffb547';
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,10,16,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = cyan; ctx.lineWidth = 2 * u; ctx.shadowColor = cyan; ctx.shadowBlur = 8 * u;
    const m = 24 * u, L = 46 * u;
    const corner = (x, y, dx, dy) => { ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y); ctx.lineTo(x + dx * L, y); ctx.stroke(); };
    corner(m, m, 1, 1); corner(w - m, m, -1, 1); corner(m, h - m, 1, -1);
    ctx.strokeStyle = amber; ctx.shadowColor = amber; corner(w - m, h - m, -1, -1);
    ctx.strokeStyle = 'rgba(110,231,255,0.75)'; ctx.shadowColor = cyan; ctx.lineWidth = 1.2 * u;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.11;
    ctx.beginPath(); ctx.arc(cx, cy, R, -0.3, Math.PI * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 1.55); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - R * 1.5, cy); ctx.lineTo(cx - R * 0.6, cy); ctx.moveTo(cx + R * 0.6, cy); ctx.lineTo(cx + R * 1.5, cy);
    ctx.moveTo(cx, cy - R * 1.5); ctx.lineTo(cx, cy - R * 0.6); ctx.moveTo(cx, cy + R * 0.6); ctx.lineTo(cx, cy + R * 1.5);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = cyan;
    ctx.font = `600 ${15 * u}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';
    // Titre en haut à droite : en vignette, le coin haut gauche porte le badge « capture ».
    ctx.textAlign = 'right';
    ctx.fillText(`J.A.R.V.I.S  //  CAPTURE ${this._live ? 'OPTIQUE' : 'SIMULÉE'}`, w - m - 8 * u, m + 10 * u);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(226,248,255,0.85)';
    ctx.font = `400 ${12 * u}px "JetBrains Mono", monospace`;
    const d = new Date();
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${d.toLocaleDateString('fr-FR')}  ${d.toLocaleTimeString('fr-FR')}  ·  NEXORA`, m + 8 * u, h - m - 8 * u);
    ctx.textAlign = 'right';
    const hands = this.app.pipeline.lastResult?.hands.length ?? 0;
    ctx.fillStyle = amber;
    ctx.fillText(`MAINS ${hands}  ·  ${String(via).toUpperCase()}  ·  ${w}×${h}`, w - m - 8 * u, h - m - 8 * u);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < h; y += 3 * u) ctx.fillRect(0, y, w, u * 0.6);
    ctx.globalAlpha = 1;
  }
}
