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
  constructor({ onFrame, toCamera, mirror, isActive, grabbedSince }) {
    this.onFrame = onFrame;
    // Au doigt : si l'appui long vient d'attraper une photo, lever le doigt
    // fait sortir la main fermée (la photo reste en main, comme un poing qui
    // quitte le champ de la caméra) ; sinon la main s'ouvre (lâcher).
    this.grabbedSince = grabbedSince || (() => false);
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
    // Pose brève après le relâchement (pincement ou main ouverte) : elle dure
    // un temps minimal ET un nombre minimal d'images, pour que le moteur la
    // voie même si le navigateur ralentit (onglet chargé, rendu logiciel).
    this.after = null;
    this.inside = false;
    this.suppressClick = false;
    this._tick = this._tick.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onDown = this._onDown.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onLeave = this._onLeave.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onMenu = this._onMenu.bind(this);
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
      window.addEventListener('contextmenu', this._onMenu, true);
      this._raf = requestAnimationFrame(this._tick);
    } else {
      window.removeEventListener('pointermove', this._onMove, opts);
      window.removeEventListener('pointerdown', this._onDown, opts);
      window.removeEventListener('pointerup', this._onUp, opts);
      window.removeEventListener('pointercancel', this._onUp, opts);
      document.documentElement.removeEventListener('pointerleave', this._onLeave, opts);
      window.removeEventListener('click', this._onClick, true);
      window.removeEventListener('contextmenu', this._onMenu, true);
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
    this.lifted = false;
    this.downAt = performance.now();
    this.downEpoch = Date.now();
    this.after = null;
    this.pos = { x: e.clientX, y: e.clientY };
    this.inside = true;
  }

  _onUp(e) {
    if (!this.down) return;
    this.down = false;
    const held = performance.now() - this.downAt;
    if (!this._inViewport(e)) { this.inside = false; this.pos = null; return; } // la main « sort » fermée
    const touch = e.pointerType !== 'mouse';
    if (touch && held >= 230 && this.grabbedSince(this.downEpoch)) {
      this.inside = false; this.pos = null; this.after = null; this.suppressClick = true;
      return;
    }
    const now = performance.now();
    if (held < 230) this.after = { pose: 'pinch', until: now + 160, frames: 4 }; // clic bref = pincement
    else this.after = { pose: 'open', until: now + 450, frames: 8 }; // fin d'appui long : la main s'ouvre (lâcher)
    // Doigt levé : la main reste visible le temps de la pose finale, puis disparaît.
    this.lifted = touch;
    this.suppressClick = true;
  }

  _onLeave(e) {
    // Les écrans tactiles émettent « pointerleave » juste après « pointerup » :
    // la pose finale (main qui s'ouvre) doit d'abord être vue par le moteur.
    if (e?.pointerType && e.pointerType !== 'mouse') return;
    if (!this.down && !this._holding(performance.now())) this.inside = false;
  }

  _holding(now) {
    const a = this.after;
    return !!a && (now < a.until || a.frames > 0);
  }

  _onClick(e) {
    // Le clic natif est remplacé par le clic aérien (évite le double déclenchement).
    if (this.suppressClick && e.isTrusted && e.detail > 0) {
      e.preventDefault();
      e.stopPropagation();
    }
    this.suppressClick = false;
  }

  _onMenu(e) {
    // Appui long au doigt = poing, pas le menu contextuel du navigateur.
    if (this.down) e.preventDefault();
  }

  _isUi(target) {
    // Les commandes du banc de simulation et la saisie restent des clics normaux.
    return !!target?.closest?.('#simPanel, #cmdForm, .cmdbar__tools, dialog, input, textarea, select');
  }

  _desiredPose(now) {
    const a = this.after;
    if (a && (now < a.until || a.frames > 0)) return a.pose;
    this.after = null;
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
    if (this.lifted && !this.down && !this._holding(now)) {
      // Fin de la pose qui suit le doigt levé : la main quitte le champ.
      this.lifted = false;
      this.after = null;
      this.pos = null;
    }
    if (!this.pos || (!this.inside && !this._holding(now))) {
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
    const settled = now - this.blendStart > 120;
    const cat = settled ? POSE_MODEL_CATEGORY[this.pose] : 'None';
    if (settled && this.after?.pose === this.pose) this.after.frames--;
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
