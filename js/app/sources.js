// Sources simulées : rejoueur de séquences (synthétiques ou enregistrées) et
// main virtuelle pilotée à la souris. Elles alimentent le même pipeline que
// la caméra, au même format.

import { renderHand, blendPoses, resolvePose, mediapipeLabel, POSE_MODEL_CATEGORY } from '../core/handpose.js';

/** Rejoue une séquence d'images ({t, width, height, hands}) en temps réel. */
export class SequencePlayer {
  constructor(onFrame) {
    this.onFrame = onFrame;
    this.playing = null;
  }

  /**
   * @param {{frames:Array}} seq
   * @param {{tailMs?:number, speed?:number}} [o]
   * @returns {Promise<void>} résolue à la fin de la lecture
   */
  play(seq, o = {}) {
    this.stop();
    const frames = seq.frames || [];
    if (!frames.length) return Promise.resolve();
    const tail = o.tailMs ?? 500;
    const speed = o.speed ?? 1;
    const t0 = frames[0].t;
    const duration = (frames[frames.length - 1].t - t0) / speed;
    const start = performance.now() + 16;
    let i = 0;
    let lastEmit = 0;
    const width = frames[0].width || 1280, height = frames[0].height || 720;
    return new Promise((resolve) => {
      const state = { resolve, raf: 0, stopped: false };
      this.playing = state;
      const tick = () => {
        if (state.stopped) return;
        const now = performance.now();
        // On émet chaque image dont l'heure est passée (aucune n'est sautée).
        while (i < frames.length && start + (frames[i].t - t0) / speed <= now) {
          const f = frames[i++];
          lastEmit = start + (f.t - t0) / speed;
          this.onFrame({ ...f, t: lastEmit, source: 'simulation' });
        }
        if (i >= frames.length) {
          // Images vides pour que le moteur constate la disparition des mains.
          if (now - lastEmit >= 33) {
            lastEmit = now;
            this.onFrame({ t: now, width, height, hands: [], source: 'simulation' });
          }
          if (now >= start + duration + tail) {
            this.playing = null;
            resolve();
            return;
          }
        }
        state.raf = requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);
    });
  }

  get active() { return !!this.playing; }

  stop() {
    if (!this.playing) return;
    this.playing.stopped = true;
    cancelAnimationFrame(this.playing.raf);
    const r = this.playing.resolve;
    this.playing = null;
    r();
  }
}

/**
 * Main virtuelle : la souris (ou le doigt) devient une main.
 *   déplacement = index pointé · clic bref = pincement · appui maintenu = poing
 *   relâcher après un appui maintenu = main ouverte (lâcher)
 */
export class MouseHand {
  constructor({ onFrame, toCamera, mirror, isActive }) {
    this.onFrame = onFrame;
    this.toCamera = toCamera; // (sx, sy) écran → coordonnées d'affichage caméra
    this.mirror = mirror;
    this.isActive = isActive;
    this.enabled = false;
    this.pos = null;
    this.down = false;
    this.downAt = 0;
    this.pose = 'point';
    this.from = 'point';
    this.blendStart = 0;
    this.pinchUntil = 0;
    this.openUntil = 0;
    this.inside = false;
    this.suppressClick = false;
    this._tick = this._tick.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onDown = this._onDown.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onLeave = this._onLeave.bind(this);
    this._onClick = this._onClick.bind(this);
  }

  enable(on) {
    if (on === this.enabled) return;
    this.enabled = on;
    const opts = { capture: true, passive: true };
    if (on) {
      window.addEventListener('pointermove', this._onMove, opts);
      window.addEventListener('pointerdown', this._onDown, opts);
      window.addEventListener('pointerup', this._onUp, opts);
      window.addEventListener('pointercancel', this._onUp, opts);
      document.documentElement.addEventListener('pointerleave', this._onLeave, opts);
      window.addEventListener('click', this._onClick, true);
      this._raf = requestAnimationFrame(this._tick);
    } else {
      window.removeEventListener('pointermove', this._onMove, opts);
      window.removeEventListener('pointerdown', this._onDown, opts);
      window.removeEventListener('pointerup', this._onUp, opts);
      window.removeEventListener('pointercancel', this._onUp, opts);
      document.documentElement.removeEventListener('pointerleave', this._onLeave, opts);
      window.removeEventListener('click', this._onClick, true);
      cancelAnimationFrame(this._raf);
      this.pos = null;
    }
  }

  _inViewport(e) {
    return e.clientX >= 0 && e.clientY >= 0 && e.clientX <= window.innerWidth && e.clientY <= window.innerHeight;
  }

  _onMove(e) {
    if (!this._inViewport(e)) { this.inside = false; return; }
    this.inside = true;
    this.pos = { x: e.clientX, y: e.clientY };
  }

  _onDown(e) {
    if (e.button !== 0 || this._isUi(e.target)) return;
    this.down = true;
    this.downAt = performance.now();
    this.pos = { x: e.clientX, y: e.clientY };
    this.inside = true;
  }

  _onUp(e) {
    if (!this.down) return;
    this.down = false;
    const held = performance.now() - this.downAt;
    if (!this._inViewport(e)) { this.inside = false; this.pos = null; return; } // la main « sort » fermée
    if (held < 230) this.pinchUntil = performance.now() + 160; // clic bref = pincement
    else this.openUntil = performance.now() + 450; // fin d'appui long : la main s'ouvre (lâcher)
    this.suppressClick = true;
  }

  _onLeave() {
    if (!this.down) { this.inside = false; }
  }

  _onClick(e) {
    // Le clic natif est remplacé par le clic aérien (évite le double déclenchement).
    if (this.suppressClick && e.isTrusted && e.detail > 0) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.suppressClick = false;
  }

  _isUi(target) {
    // Les commandes du banc de simulation et la saisie restent des clics normaux.
    return !!target?.closest?.('#simPanel, #cmdForm, .cmdbar__tools, dialog, input, textarea, select');
  }

  _desiredPose(now) {
    if (now < this.pinchUntil) return 'pinch';
    if (now < this.openUntil) return 'open';
    if (this.down && now - this.downAt >= 230) return 'fist';
    return 'point';
  }

  _tick() {
    if (!this.enabled) return;
    this._raf = requestAnimationFrame(this._tick);
    if (!this.isActive()) return;
    const now = performance.now();
    // Cadence d'une caméra (30 images/s), pas celle de l'écran.
    if (now - (this._last || 0) < 31) return;
    this._last = now;
    if (!this.pos || !this.inside) {
      // Quelques images vides suffisent pour que le moteur constate l'absence de main.
      if (now - (this._goneAt ??= now) < 1000) this.onFrame({ t: now, width: 1280, height: 720, hands: [], source: 'souris' });
      return;
    }
    this._goneAt = null;
    const want = this._desiredPose(now);
    if (want !== this.pose) { this.from = this._currentBlend(now); this.pose = want; this.blendStart = now; }
    const pose = this._currentBlend(now);
    const p = this.toCamera(this.pos.x, this.pos.y);
    const mirror = this.mirror();
    const landmarks = renderHand(pose, {
      x: mirror ? 1 - p.x : p.x,
      y: p.y,
      size: 0.2,
      side: 'Right',
      aspect: 1280 / 720,
      anchor: 'index@point',
    });
    const cat = now - this.blendStart > 120 ? POSE_MODEL_CATEGORY[this.pose] : 'None';
    this.onFrame({
      t: now, width: 1280, height: 720, source: 'souris',
      hands: [{ landmarks, handedness: mediapipeLabel('Right'), handednessScore: 0.99, gestures: [{ categoryName: cat || 'None', score: cat && cat !== 'None' ? 0.9 : 0.5 }] }],
    });
  }

  _currentBlend(now) {
    const k = Math.min(1, (now - this.blendStart) / 110);
    if (k >= 1 || !this.from) return resolvePose(this.pose);
    return blendPoses(this.from, this.pose, k);
  }
}

/** Enregistre les images brutes de la caméra pour les rejouer plus tard. */
export class Recorder {
  constructor() { this.frames = null; this.t0 = 0; }
  get recording() { return !!this.frames; }
  start() { this.frames = []; this.t0 = 0; }
  push(frame) {
    if (!this.frames) return;
    if (!this.t0) this.t0 = frame.t;
    if (this.frames.length > 30 * 30) return; // 30 s maximum
    this.frames.push({
      t: Math.round(frame.t - this.t0),
      width: frame.width,
      height: frame.height,
      hands: frame.hands.map((h) => ({
        handedness: h.handedness,
        gestures: h.gestures,
        landmarks: h.landmarks.map((p) => ({ x: +p.x.toFixed(5), y: +p.y.toFixed(5), z: +(p.z || 0).toFixed(5) })),
      })),
    });
  }
  stop() {
    const frames = this.frames || [];
    this.frames = null;
    return frames;
  }
}
