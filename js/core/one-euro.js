// Filtre One Euro (Casiez, Roussel, Vogel — CHI 2012).
// Lissage adaptatif : fort quand la main est immobile (supprime le tremblement),
// faible quand elle bouge vite (supprime le retard).

function smoothingFactor(cutoff, dt) {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

export class OneEuroFilter {
  /**
   * @param {{minCutoff?: number, beta?: number, dCutoff?: number}} opts
   *   minCutoff : fréquence de coupure au repos (Hz) — plus bas = plus lisse
   *   beta      : gain de vitesse — plus haut = moins de retard en mouvement
   *   dCutoff   : coupure appliquée à la dérivée
   */
  constructor({ minCutoff = 1.0, beta = 0, dCutoff = 1.0 } = {}) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.reset();
  }

  reset() {
    this.x = null;
    this.dx = 0;
    this.t = null;
  }

  /** @param {number} value @param {number} t temps en secondes */
  filter(value, t) {
    if (this.x === null) {
      this.x = value;
      this.dx = 0;
      this.t = t;
      return value;
    }
    const dt = t - this.t;
    if (!(dt > 0)) return this.x; // horodatage identique ou rétrograde
    this.t = t;
    const rawDx = (value - this.x) / dt;
    const aD = smoothingFactor(this.dCutoff, dt);
    this.dx = aD * rawDx + (1 - aD) * this.dx;
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    const a = smoothingFactor(cutoff, dt);
    this.x = a * value + (1 - a) * this.x;
    return this.x;
  }
}

/** Filtre vectoriel : un filtre One Euro par composante. */
export class OneEuroVector {
  constructor(size, opts) {
    this.opts = opts;
    this.filters = Array.from({ length: size }, () => new OneEuroFilter(opts));
  }

  configure(opts) {
    this.opts = { ...this.opts, ...opts };
    for (const f of this.filters) Object.assign(f, opts);
  }

  reset() {
    for (const f of this.filters) f.reset();
  }

  filter(values, t) {
    const out = new Array(values.length);
    for (let i = 0; i < values.length; i++) out[i] = this.filters[i].filter(values[i], t);
    return out;
  }
}
