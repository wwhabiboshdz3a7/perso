// Mode borne (salons, vitrines, accueil) : après une période sans main ni
// interaction, l'écran d'attraction s'affiche (nom, sous-titre, record de
// l'arcade) ; une main ouverte tenue une seconde relance le module choisi.

export class Kiosk {
  constructor(app) {
    this.app = app;
    this.last = performance.now();
    const poke = () => this.poke();
    for (const t of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']) window.addEventListener(t, poke, { capture: true, passive: true });
    app.pipeline.on('frame', ({ result }) => { if (result?.primary) this.poke(); });
    setInterval(() => this._check(), 1000);
    this.apply();
  }

  get on() { return !!this.app.settings.get('kiosk'); }

  apply() {
    document.body.classList.toggle('is-kiosk', this.on);
    this.poke();
  }

  poke() { this.last = performance.now(); }

  _check() {
    if (!this.on || this.app.sleep.on || this.app.arcade?.running || document.querySelector('dialog[open]')) return;
    const idle = (performance.now() - this.last) / 1000;
    if (idle >= (this.app.settings.get('kioskIdle') || 60)) this.attract();
  }

  /** Écran d'attraction (veille spéciale). */
  attract() {
    this.app.gallery?.close?.();
    this.app.sleep.enter({ attract: true });
  }

  /** Une personne arrive : module de départ, accueil. */
  welcome() {
    const m = this.app.settings.get('kioskStart') || 'arcade';
    if (this.app.moduleOn(m)) this.app.setMode(m);
    const lines = {
      arcade: 'Bienvenue ! Touchez un maximum de cibles en trente secondes. Pincez ou fermez le poing sur une cible.',
      galerie: 'Bienvenue ! Visez une photo avec l’index, fermez le poing pour l’attraper.',
      holo: 'Bienvenue ! Pincez et déplacez la main pour faire tourner l’hologramme.',
      dessin: 'Bienvenue ! Levez l’index pour dessiner dans l’air.',
    };
    this.app.assistant?.say(lines[m] || 'Bienvenue !');
    if (m === 'arcade') setTimeout(() => this.app.arcade?.start(), 2600);
    this.poke();
  }
}
