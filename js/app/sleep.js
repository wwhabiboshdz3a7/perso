// Mode veille : interface atténuée, suivi ralenti. Réveil par la voix,
// une main ouverte tenue une seconde, une touche ou un clic.

import { $ } from './dom.js';

export class SleepMode {
  constructor(app) {
    this.app = app;
    this.el = $('#sleep');
    this.on = false;
    this.openSince = null;
    $('#btnWake').addEventListener('click', () => this.exit());
    $('#btnSleep').addEventListener('click', () => this.enter());
    window.addEventListener('keydown', (e) => { if (this.on && !e.repeat) { e.preventDefault(); this.exit(); } }, true);
  }

  /** @param {{attract?: boolean}} [o] attract : écran d'attraction du mode borne. */
  enter({ attract = false } = {}) {
    if (this.on) return;
    this.on = true;
    this.attract = attract;
    this.el.classList.toggle('is-attract', attract);
    const name = this.app.assistantName || 'JARVIS';
    $('#sleepTitle').textContent = attract ? name : 'Veille';
    $('#sleepTag').textContent = attract ? (this.app.settings.get('assistantTagline') || '') : '';
    $('#sleepTag').hidden = !attract;
    const best = this.app.settings.get('arcadeBest') || 0;
    $('#sleepRecord').textContent = attract && best ? `Record à battre : ${best} points` : '';
    $('#sleepRecord').hidden = !(attract && best);
    $('#sleepHint').hidden = attract;
    $('#sleepAttract').hidden = !attract;
    $('#btnWake').textContent = attract ? 'Commencer' : 'Réveiller';
    this.el.hidden = false;
    this.app.camera?.setThrottle(300);
    this.app.sound.play('sleep');
    this.app.ui.log('système', attract ? 'mode borne : écran d’attraction' : 'mise en veille');
    document.body.classList.add('is-sleeping');
    $('#btnWake').focus({ preventScroll: true });
  }

  exit() {
    if (!this.on) return;
    this.on = false;
    this.el.hidden = true;
    this.app.camera?.setThrottle(0);
    this.app.sound.play('wake');
    this.app.ui.log('système', 'réveil');
    document.body.classList.remove('is-sleeping');
    this.openSince = null;
    if (this.attract) { this.attract = false; this.app.kiosk?.welcome(); }
  }

  onFrame(result) {
    if (!this.on) return;
    const p = result.primary;
    if (p && p.pose === 'open') {
      this.openSince ??= performance.now();
      if (performance.now() - this.openSince > 1000) {
        const attract = this.attract;
        this.exit();
        if (!attract) this.app.assistant?.say(`De retour, ${this.app.settings.get('userName') || ''}.`.replace(' ,', ','));
      }
    } else {
      this.openSince = null;
    }
  }
}
