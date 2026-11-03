// Bus d'images : une seule entrée pour toutes les sources (caméra,
// simulation, main virtuelle), un seul moteur de gestes, des abonnés.

import { Emitter } from './dom.js';

const PRIORITY = { camera: 1, souris: 2, simulation: 3 };

export class Pipeline extends Emitter {
  constructor(engine) {
    super();
    this.engine = engine;
    this.override = null;
    this.lastResult = null;
    this.lastFrame = null;
    this.frames = [];
    this.fps = 0;
    this.engineMs = 0; // temps moyen du moteur de gestes par image
    this.paused = false;
  }

  /** Une source prioritaire (simulation, main virtuelle) masque les autres. */
  setOverride(source) {
    if (this.override === source) return;
    this.override = source;
    this.engine.reset();
    this.emit('override', source);
  }

  push(frame) {
    const src = frame.source || 'camera';
    if (this.override && PRIORITY[src] < PRIORITY[this.override]) {
      this.emit('raw', frame); // aperçu seulement
      return;
    }
    if (this.paused) return;
    const t0 = performance.now();
    const result = this.engine.update(frame);
    const cost = performance.now() - t0;
    this.engineMs = this.engineMs ? this.engineMs * 0.9 + cost * 0.1 : cost;
    this.lastFrame = frame;
    this.lastResult = result;
    const now = performance.now();
    this.frames.push(now);
    while (this.frames.length && now - this.frames[0] > 1000) this.frames.shift();
    this.fps = this.frames.length;
    this.emit('frame', { frame, result });
    for (const ev of result.events) this.emit('event', { ev, result, frame });
  }
}
