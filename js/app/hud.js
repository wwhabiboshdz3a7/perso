// Affichage HUD : squelette sur l'aperçu optique, panneau capteurs, calque
// plein écran (squelette fantôme, particules, ondes).

import { $, fitCanvas, reducedMotion } from './dom.js';
import { HAND_CONNECTIONS, POSE_LABELS } from '../core/hand.js';

const TIPS = [4, 8, 12, 16, 20];
const COLORS = ['#6ee7ff', '#ffb547'];

function drawHand(ctx, pts, map, o) {
  // Halo obtenu par un trait large et translucide : bien plus léger qu'un
  // shadowBlur, qui coûte cher à chaque image sur les appareils modestes.
  const color = o.color;
  const alpha = o.alpha ?? 1;
  const width = o.width ?? 2;
  const bones = new Path2D();
  for (const [a, b] of HAND_CONNECTIONS) {
    const A = map(pts[a]), B = map(pts[b]);
    bones.moveTo(A.x, A.y);
    bones.lineTo(B.x, B.y);
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  if (o.glow) {
    ctx.globalAlpha = alpha * 0.22;
    ctx.lineWidth = width + o.glow * 0.9;
    ctx.stroke(bones);
  }
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.stroke(bones);
  const r = o.joint ?? 2.6;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 21; i++) {
    const P = map(pts[i]);
    ctx.beginPath();
    ctx.arc(P.x, P.y, TIPS.includes(i) ? r * 1.5 : r, 0, Math.PI * 2);
    ctx.fillStyle = TIPS.includes(i) ? (i === 8 ? '#ffb547' : color) : '#03080c';
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export class HUD {
  constructor(app) {
    this.app = app;
    this.canvas = $('#opticCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.video = $('#camVideo');
    this.fpsHist = new Array(48).fill(0);
    this.el = {
      fps: $('#sFps'), hands: $('#sHands'), handsIcons: [...$('#sHandsIcons').children], latency: $('#sLatency'),
      pose: $('#sPose'), model: $('#sModel'), pinch: $('#sPinch'), source: $('#sensSource'), spark: $('#sFpsSpark'),
      tag: $('#opticTag'), meta: $('#optMeta'), optic: $('#optic'),
    };
    this.sparkCtx = this.el.spark.getContext('2d');
    this._lastSensors = 0;
    this.last = null;
  }

  /** Transformation « object-fit: cover » de l'image vers le canevas. */
  _coverMap(fw, fh, cw, ch) {
    const s = Math.max(cw / fw, ch / fh);
    const ox = (cw - fw * s) / 2, oy = (ch - fh * s) / 2;
    return (p) => ({ x: ox + p.x * fw * s, y: oy + p.y * fh * s });
  }

  drawOptic(frame, result) {
    const { w, h, dpr } = fitCanvas(this.canvas);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    const fw = frame?.width || 1280, fh = frame?.height || 720;
    const map = this._coverMap(fw, fh, w, h);
    const simulated = !this.app.camera?.active || this.app.pipeline.override;

    if (simulated) {
      // Image de synthèse : grille de profondeur discrète.
      ctx.save();
      ctx.strokeStyle = 'rgba(110,231,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath(); ctx.moveTo((w * i) / 8, 0); ctx.lineTo((w * i) / 8, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, (h * i) / 6); ctx.lineTo(w, (h * i) / 6); ctx.stroke();
      }
      ctx.restore();
    }

    // Zone active (correspond à l'écran entier pour le curseur).
    const reg = this.app.region();
    const a = map({ x: reg.x0, y: reg.y0 }), b = map({ x: reg.x1, y: reg.y1 });
    ctx.save();
    ctx.setLineDash([4 * dpr, 5 * dpr]);
    ctx.strokeStyle = 'rgba(255,181,71,0.35)';
    ctx.lineWidth = dpr;
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.restore();

    if (!result) return;
    result.hands.forEach((hand, i) => {
      const color = hand.primary ? COLORS[0] : COLORS[1];
      drawHand(ctx, hand.landmarks, map, { color, width: 2 * dpr, joint: 2.2 * dpr, glow: 10 * dpr });
      const wrist = map(hand.landmarks[0]);
      ctx.save();
      ctx.font = `${10 * dpr}px "JetBrains Mono", monospace`;
      ctx.fillStyle = color;
      ctx.fillText(`${hand.side === 'Right' ? 'D' : 'G'} · ${(POSE_LABELS[hand.pose] || hand.pose).toUpperCase()}`, wrist.x + 8 * dpr, wrist.y + 14 * dpr);
      ctx.restore();
      if (hand.pinching) {
        const p4 = map(hand.landmarks[4]), p8 = map(hand.landmarks[8]);
        ctx.save();
        ctx.strokeStyle = '#ffb547';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath(); ctx.arc((p4.x + p8.x) / 2, (p4.y + p8.y) / 2, 9 * dpr, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      void i;
    });
  }

  updateSensors(result, frame) {
    const now = performance.now();
    if (now - this._lastSensors < 120) return;
    this._lastSensors = now;
    const cam = this.app.camera;
    const pipe = this.app.pipeline;
    const fps = pipe.fps;
    this.el.fps.textContent = String(fps);
    this.fpsHist.push(fps);
    this.fpsHist.shift();
    this._spark();
    const n = result ? result.hands.length : 0;
    this.el.hands.textContent = String(n);
    this.el.handsIcons.forEach((icon, i) => icon.classList.toggle('on', i < n));
    const src = frame?.source || 'camera';
    // Source simulée sans caméra : l'aperçu montre la main, les boutons passent en haut.
    this.el.optic.classList.toggle('is-sim', src !== 'camera' && !cam?.active && n > 0);
    if (src === 'camera' && cam?.active) {
      this.el.latency.textContent = cam.stats.latency ? cam.stats.latency.toFixed(1).replace('.', ',') : '—';
      this.el.source.textContent = `caméra · ${cam.stats.delegate}`;
      this.el.tag.textContent = `${cam.stats.width}×${cam.stats.height} · ${cam.stats.delegate} · ${cam.stats.model}`;
    } else {
      this.el.latency.textContent = '0,1';
      this.el.source.textContent = src === 'souris' ? 'main virtuelle' : 'simulation';
      this.el.tag.textContent = src === 'souris' ? 'main virtuelle · souris' : 'banc de simulation';
    }
    const p = result?.primary;
    if (p) {
      this.el.pose.textContent = POSE_LABELS[p.pose] || p.pose;
      this.el.model.textContent = p.model && p.model.name && p.model.name !== 'None' ? `modèle : ${p.model.name} ${(p.model.score * 100).toFixed(0)} %` : 'géométrie';
      const v = Math.max(0, Math.min(1, 1 - (p.pinchRatio - 0.05) / 0.9));
      this.el.pinch.style.width = `${(v * 100).toFixed(0)}%`;
    } else {
      this.el.pose.textContent = '—';
      this.el.model.textContent = '';
      this.el.pinch.style.width = '0%';
    }
  }

  _spark() {
    const c = this.sparkCtx, W = this.el.spark.width, H = this.el.spark.height;
    c.clearRect(0, 0, W, H);
    const max = Math.max(30, ...this.fpsHist);
    c.beginPath();
    this.fpsHist.forEach((v, i) => {
      const x = (i / (this.fpsHist.length - 1)) * W;
      const y = H - 2 - (v / max) * (H - 4);
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    });
    c.strokeStyle = '#6ee7ff';
    c.lineWidth = 1.2;
    c.stroke();
  }
}

/** Calque plein écran : squelette fantôme, particules, ondes de choc. */
export class FX {
  constructor(app) {
    this.app = app;
    this.canvas = $('#fxCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.rings = [];
    this.result = null;
    this.resultAt = 0;
    this._loop = this._loop.bind(this);
    this._dirty = true;
    requestAnimationFrame(this._loop);
  }

  setResult(result) {
    this.result = result;
    this.resultAt = performance.now();
    this._dirty = true;
  }

  burst(x, y, o = {}) {
    if (reducedMotion()) return;
    const n = o.count ?? 42;
    const color = o.color ?? '#6ee7ff';
    const inward = o.inward ?? false;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (o.speed ?? 260) * (0.4 + Math.random() * 0.8);
      const dist = inward ? (o.radius ?? 140) * (0.6 + Math.random() * 0.6) : 0;
      this.particles.push({
        x: x + Math.cos(a) * dist, y: y + Math.sin(a) * dist,
        vx: inward ? -Math.cos(a) * sp : Math.cos(a) * sp,
        vy: inward ? -Math.sin(a) * sp : Math.sin(a) * sp,
        life: 0, max: (o.life ?? 0.7) * (0.6 + Math.random() * 0.6), color, size: 1 + Math.random() * 2.2,
      });
    }
    this._dirty = true;
  }

  ring(x, y, o = {}) {
    if (reducedMotion()) return;
    this.rings.push({ x, y, r0: o.r0 ?? 10, r1: o.r1 ?? 160, t: 0, dur: o.dur ?? 0.7, color: o.color ?? '#6ee7ff', width: o.width ?? 2 });
    this._dirty = true;
  }

  _loop(now) {
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, (now - (this._t || now)) / 1000);
    this._t = now;
    const ghostOn = this.app.settings.get('ghost') && this.result && this.result.hands.length && now - this.resultAt < 400;
    if (!this._dirty && !ghostOn && !this.particles.length && !this.rings.length) return;
    this._dirty = false;
    const { w, h, dpr } = fitCanvas(this.canvas, 1.5);
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    if (ghostOn) {
      const map = (p) => {
        const s = this.app.mapToScreen(p);
        return { x: s.x * dpr, y: s.y * dpr };
      };
      for (const hand of this.result.hands) {
        drawHand(ctx, hand.landmarks, map, { color: hand.primary ? '#6ee7ff' : '#ffb547', alpha: 0.22, width: 2.5 * dpr, joint: 3 * dpr, glow: 14 * dpr });
      }
    }

    if (this.rings.length) {
      this.rings = this.rings.filter((r) => (r.t += dt) < r.dur);
      for (const r of this.rings) {
        const k = r.t / r.dur;
        const e = 1 - Math.pow(1 - k, 3);
        ctx.beginPath();
        ctx.arc(r.x * dpr, r.y * dpr, (r.r0 + (r.r1 - r.r0) * e) * dpr, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = 1 - k;
        ctx.lineWidth = r.width * dpr * (1 - k * 0.5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (this.particles.length) {
      ctx.globalCompositeOperation = 'lighter';
      this.particles = this.particles.filter((p) => (p.life += dt) < p.max);
      for (const p of this.particles) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.94; p.vy *= 0.94;
        const k = 1 - p.life / p.max;
        ctx.globalAlpha = k;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x * dpr, p.y * dpr, p.size * dpr, p.size * dpr);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}
