// Sons de l'interface, entièrement synthétisés (WebAudio) — aucun fichier.

export class Sound {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.master = null;
    this.last = new Map();
  }

  /** Le contexte audio ne peut démarrer qu'après une interaction. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      this.master.connect(comp).connect(this.ctx.destination);
    } catch { this.ctx = null; }
  }

  volume() {
    return this.settings.get('sound') ? this.settings.get('volume') * 0.6 : 0;
  }

  updateVolume() {
    if (this.master) this.master.gain.setTargetAtTime(this.volume(), this.ctx.currentTime, 0.05);
  }

  _ok(name, minGap = 40) {
    if (!this.ctx || this.ctx.state !== 'running' || !this.volume()) return false;
    const now = performance.now();
    if (now - (this.last.get(name) || 0) < minGap) return false;
    this.last.set(name, now);
    return true;
  }

  _tone({ type = 'sine', f0 = 880, f1 = f0, dur = 0.12, gain = 0.25, delay = 0, attack = 0.005, q, filter }) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (filter) {
      const bq = c.createBiquadFilter();
      bq.type = filter;
      bq.frequency.value = f0 * 2;
      if (q) bq.Q.value = q;
      node.connect(bq);
      node = bq;
    }
    node.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _noise({ dur = 0.25, gain = 0.15, f0 = 800, f1 = 4000, delay = 0, type = 'bandpass', q = 1.2 }) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const bq = c.createBiquadFilter();
    bq.type = type;
    bq.Q.value = q;
    bq.frequency.setValueAtTime(f0, t);
    bq.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bq).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  play(name) {
    if (!this._ok(name, name === 'hover' ? 70 : 40)) return;
    switch (name) {
      case 'boot':
        this._tone({ type: 'sine', f0: 110, f1: 440, dur: 1.1, gain: 0.18, attack: 0.3 });
        this._tone({ type: 'triangle', f0: 660, f1: 1320, dur: 0.5, gain: 0.08, delay: 0.7 });
        this._tone({ type: 'sine', f0: 1760, dur: 0.35, gain: 0.06, delay: 1.0 });
        break;
      case 'hover':
        this._tone({ type: 'sine', f0: 2400, dur: 0.03, gain: 0.035 });
        break;
      case 'click':
        this._tone({ type: 'square', f0: 1400, f1: 900, dur: 0.05, gain: 0.06, filter: 'lowpass' });
        break;
      case 'pinch':
        this._tone({ type: 'triangle', f0: 1200, f1: 1600, dur: 0.06, gain: 0.08 });
        break;
      case 'grab':
        this._noise({ dur: 0.28, gain: 0.16, f0: 3000, f1: 400 });
        this._tone({ type: 'sine', f0: 520, f1: 180, dur: 0.3, gain: 0.18 });
        break;
      case 'release':
        this._tone({ type: 'sine', f0: 300, f1: 900, dur: 0.25, gain: 0.14 });
        break;
      case 'throw':
        this._noise({ dur: 0.45, gain: 0.2, f0: 400, f1: 5000 });
        break;
      case 'land':
        this._tone({ type: 'sine', f0: 140, f1: 60, dur: 0.4, gain: 0.3 });
        this._tone({ type: 'triangle', f0: 880, dur: 0.3, gain: 0.08, delay: 0.05 });
        this._tone({ type: 'sine', f0: 1320, dur: 0.5, gain: 0.07, delay: 0.12 });
        break;
      case 'swipe':
        this._noise({ dur: 0.22, gain: 0.1, f0: 1200, f1: 3500, q: 2 });
        break;
      case 'notify':
        this._tone({ type: 'sine', f0: 990, dur: 0.12, gain: 0.1 });
        this._tone({ type: 'sine', f0: 1480, dur: 0.18, gain: 0.08, delay: 0.09 });
        break;
      case 'ok':
        this._tone({ type: 'triangle', f0: 660, dur: 0.1, gain: 0.1 });
        this._tone({ type: 'triangle', f0: 990, dur: 0.16, gain: 0.1, delay: 0.08 });
        break;
      case 'error':
        this._tone({ type: 'sawtooth', f0: 180, f1: 120, dur: 0.25, gain: 0.08, filter: 'lowpass' });
        break;
      case 'shutter':
        this._noise({ dur: 0.08, gain: 0.25, f0: 6000, f1: 2000, type: 'highpass' });
        this._noise({ dur: 0.1, gain: 0.2, f0: 4000, f1: 1500, type: 'highpass', delay: 0.07 });
        break;
      case 'listen':
        this._tone({ type: 'sine', f0: 700, f1: 1100, dur: 0.14, gain: 0.1 });
        break;
      case 'unlisten':
        this._tone({ type: 'sine', f0: 1100, f1: 700, dur: 0.14, gain: 0.08 });
        break;
      case 'alarm':
        for (let i = 0; i < 4; i++) {
          this._tone({ type: 'square', f0: 880, dur: 0.12, gain: 0.08, delay: i * 0.28, filter: 'lowpass' });
          this._tone({ type: 'square', f0: 1320, dur: 0.12, gain: 0.06, delay: i * 0.28 + 0.13, filter: 'lowpass' });
        }
        break;
      case 'sleep':
        this._tone({ type: 'sine', f0: 660, f1: 110, dur: 0.9, gain: 0.12 });
        break;
      case 'wake':
        this._tone({ type: 'sine', f0: 220, f1: 880, dur: 0.6, gain: 0.12 });
        break;
      case 'count':
        this._tone({ type: 'sine', f0: 1000, dur: 0.08, gain: 0.1 });
        break;
      default:
        break;
    }
  }
}
