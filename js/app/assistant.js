// Assistant vocal : reconnaissance (Web Speech API, fr-FR), mot d'éveil
// « Jarvis », exécution des commandes, réponses parlées, cerveau IA facultatif.
// Repli clavier : la barre de commande accepte les mêmes phrases.

import { $ } from './dom.js';
import { parseCommand, COMMAND_HELP } from '../core/commands.js';
import { Brain, forSpeech } from './ai.js';
import { spokenDuration } from './timers.js';

const AWAIT_MS = 7000;

export class Assistant {
  constructor(app) {
    this.app = app;
    this.brain = new Brain(app.settings);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.SR = SR || null;
    this.rec = null;
    this.listening = false;
    this.wanted = false;
    this.awaitUntil = 0;
    this.voices = [];
    this.youEl = $('#asstYou q');
    this.jarvisEl = $('#asstJarvis q');
    this._bindUi();
    this._renderState();
    this.renderBrain();
  }

  get supported() { return !!this.SR; }

  /** Liste des voix chargée à la première utilisation (coûteux au démarrage sur certains systèmes). */
  ensureVoices() {
    if (this._voicesInit || !('speechSynthesis' in window)) return;
    this._voicesInit = true;
    speechSynthesis.addEventListener?.('voiceschanged', () => this._loadVoices());
    this._loadVoices();
  }

  _loadVoices() {
    this.voices = speechSynthesis.getVoices().filter((v) => /^fr/i.test(v.lang));
    this.app.bus.emit('voices', this.voices);
  }

  voice() {
    const want = this.app.settings.get('voice');
    return this.voices.find((v) => v.name === want)
      || this.voices.find((v) => /fr-FR/i.test(v.lang) && /(Thomas|Henri|Paul|Google)/i.test(v.name))
      || this.voices.find((v) => /fr-FR/i.test(v.lang))
      || this.voices[0] || null;
  }

  _bindUi() {
    $('#cmdForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#cmdInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.app.sound.unlock();
      this.handle(text, { source: 'clavier' });
    });
    $('#btnMic').addEventListener('click', () => this.toggle());
  }

  renderBrain() {
    $('#asstBrain').textContent = this.brain.enabled ? 'cerveau IA' : 'local';
    $('#asstBrain').title = this.brain.label;
  }

  _renderState() {
    const chipState = !this.supported ? 'off' : this.listening ? (Date.now() < this.awaitUntil ? 'active' : 'on') : 'off';
    const label = !this.supported ? 'clavier' : this.listening ? (this.app.settings.get('wake') ? '« Jarvis »' : 'écoute') : 'coupée';
    this.app.ui.chip('Mic', chipState, label);
    $('#btnMic').setAttribute('aria-pressed', String(this.listening));
    $('#btnMic').setAttribute('aria-label', this.listening ? 'Arrêter l’écoute vocale' : 'Activer l’écoute vocale');
    document.body.classList.toggle('is-listening', this.listening && (Date.now() < this.awaitUntil || !this.app.settings.get('wake')));
  }

  toggle() {
    if (this.wanted) this.stop(); else this.start();
  }

  start() {
    this.app.sound.unlock();
    if (!this.SR) {
      this.app.ui.toast('Reconnaissance vocale indisponible', 'Ce navigateur ne la propose pas (Firefox par exemple). Tapez vos commandes dans la barre du bas.', { kind: 'warn' });
      $('#cmdInput').focus();
      return;
    }
    this.wanted = true;
    this._spawn();
  }

  _spawn() {
    if (this.rec) return;
    const rec = new this.SR();
    rec.lang = 'fr-FR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => { this.listening = true; this._renderState(); this.app.sound.play('listen'); };
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r[0].transcript.trim();
        if (r.isFinal) this._final(txt);
        else interim += txt + ' ';
      }
      if (interim) this.youEl.textContent = `${interim.trim()}…`;
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.wanted = false;
        this.app.ui.toast('Micro refusé', 'Autorisez le micro pour ce site, ou tapez vos commandes.', { kind: 'warn' });
      } else if (e.error === 'network') {
        this.wanted = false;
        this.app.ui.toast('Reconnaissance vocale hors ligne', 'Le service de reconnaissance du navigateur est injoignable. Le clavier fonctionne.', { kind: 'warn' });
      } else if (e.error === 'audio-capture') {
        this.wanted = false;
        this.app.ui.toast('Aucun micro', 'Aucun micro n’a été trouvé.', { kind: 'warn' });
      }
    };
    rec.onend = () => {
      this.rec = null;
      this.listening = false;
      this._renderState();
      if (this.wanted) setTimeout(() => this.wanted && this._spawn(), 300); // Chrome s'arrête après un silence
      else this.app.sound.play('unlisten');
    };
    this.rec = rec;
    try { rec.start(); } catch { this.rec = null; }
  }

  stop() {
    this.wanted = false;
    this.awaitUntil = 0;
    try { this.rec?.stop(); } catch { /* déjà arrêtée */ }
    this._renderState();
  }

  /** Geste « I love you » : écoute immédiate sans mot d'éveil. */
  attention() {
    if (!this.wanted) this.start();
    this.awaitUntil = Date.now() + AWAIT_MS;
    this._renderState();
    this.reply('Je vous écoute.', { speak: false });
    this.app.sound.play('listen');
    setTimeout(() => this._renderState(), AWAIT_MS + 50);
  }

  _final(text) {
    if (!text) return;
    const parsed = parseCommand(text);
    const wakeMode = this.app.settings.get('wake');
    if (wakeMode && !parsed.woke && Date.now() > this.awaitUntil) {
      // Hors mot d'éveil : on n'exécute rien (sauf réveil depuis la veille).
      if (this.app.sleep.on && parsed.intent === 'wake') this.handle(text, { source: 'voix', parsed });
      return;
    }
    this.awaitUntil = 0;
    if (parsed.intent === 'wake-only') {
      this.awaitUntil = Date.now() + AWAIT_MS;
      this._renderState();
      this.youEl.textContent = text;
      if (this.app.sleep.on) { this.handle(text, { source: 'voix', parsed: { ...parsed, intent: 'wake' } }); return; }
      this.reply(`Oui${this.app.settings.get('userName') ? `, ${this.app.settings.get('userName')}` : ''} ?`);
      setTimeout(() => this._renderState(), AWAIT_MS + 50);
      return;
    }
    this._renderState();
    this.handle(text, { source: 'voix', parsed });
  }

  say(text) { this.reply(text); }

  reply(text, { speak = true } = {}) {
    this.jarvisEl.textContent = text;
    if (speak && this.app.settings.get('speak') && 'speechSynthesis' in window) {
      this.ensureVoices();
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(forSpeech(text));
        u.lang = 'fr-FR';
        const v = this.voice();
        if (v) u.voice = v;
        u.rate = this.app.settings.get('rate') || 1;
        u.pitch = 0.92;
        u.onstart = () => document.body.classList.add('is-speaking');
        u.onend = u.onerror = () => document.body.classList.remove('is-speaking');
        speechSynthesis.speak(u);
      } catch { /* synthèse indisponible */ }
    }
  }

  /** Exécute une phrase (voix ou clavier). */
  async handle(text, { source = 'clavier', parsed } = {}) {
    const cmd = parsed || parseCommand(text);
    const app = this.app;
    const name = app.settings.get('userName');
    this.youEl.textContent = text;
    app.ui.log('voix', `« ${text} »${source === 'clavier' ? ' (clavier)' : ''}`);
    const p = cmd.params;
    try {
      switch (cmd.intent) {
        case 'empty': return;
        case 'wake-only':
          this.reply(`Oui${name ? `, ${name}` : ''} ?`);
          return;
        case 'help':
          this.reply('Je peux ouvrir la galerie, le dessin ou l’hologramme, envoyer une photo, donner l’heure et la météo, lancer une minuterie, prendre une capture ou me mettre en veille.');
          app.ui.toast('Commandes', COMMAND_HELP.slice(0, 7).map(([c]) => c).join(' · '), { ms: 9000, sound: false });
          return;
        case 'open-mode': {
          const m = p.mode;
          if (m === 'galerie' || m === 'dessin' || m === 'holo') {
            app.setMode(m);
            this.reply({ galerie: 'Galerie ouverte.', dessin: 'Mode dessin. Levez l’index pour tracer.', holo: 'Projection de l’hologramme.' }[m]);
          } else if (m === 'reglages') { app.openSettings(); this.reply('Voici les réglages.'); }
          else if (m === 'tutoriel') { app.openTutorial(); this.reply('Voici les gestes.'); }
          else if (m === 'liaison') {
            this.reply('Préparation de la liaison. Scannez le QR code avec l’autre appareil.');
            app.link.startNet().then(() => app.link.showQr()).catch(() => {});
          } else if (m === 'confidentialite') { window.open('confidentialite.html', '_blank', 'noopener'); this.reply('Tout est expliqué sur cette page.'); }
          return;
        }
        case 'send-photo':
          await app.share.sendPhoto();
          this.reply(app.link.list().length ? 'Photo envoyée.' : 'Aucun appareil n’est relié pour le moment.');
          return;
        case 'time': {
          const d = new Date();
          this.reply(`Il est ${d.getHours()} heure${d.getHours() > 1 ? 's' : ''} ${String(d.getMinutes()).padStart(2, '0')}.`);
          return;
        }
        case 'date': {
          const d = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          this.reply(`Nous sommes le ${d}.`);
          return;
        }
        case 'weather': {
          const city = p.city || app.settings.get('city') || 'Toulouse';
          this.reply(`Je consulte la météo à ${city}…`, { speak: false });
          try {
            const w = await app.weather.current(city);
            if (!p.city || w.place.name.toLowerCase() === (app.settings.get('city') || '').toLowerCase()) app.weather.renderWidget(w);
            this.reply(app.weather.sentence(w));
          } catch (err) {
            this.reply(err?.code === 'notfound' ? `Je ne trouve pas la ville « ${city} ».` : 'Le service météo est injoignable pour le moment.');
          }
          return;
        }
        case 'timer':
          if (!p.seconds) { this.reply('Pour combien de temps ? Par exemple : minuterie de cinq minutes.'); return; }
          app.timers.add(p.seconds, p.label);
          this.reply(`Minuterie de ${spokenDuration(p.seconds)} lancée${p.label ? ` pour ${p.label}` : ''}.`);
          return;
        case 'timer-cancel': {
          const n = app.timers.clear();
          this.reply(n ? (n > 1 ? `${n} minuteries annulées.` : 'Minuterie annulée.') : 'Aucune minuterie en cours.');
          return;
        }
        case 'capture':
          this.reply('Souriez.');
          await app.capture.take();
          return;
        case 'sleep':
          this.reply('Je me mets en veille.');
          app.sleep.enter();
          return;
        case 'wake':
          app.sleep.exit();
          this.reply(`De retour${name ? `, ${name}` : ''}. Tous les systèmes sont opérationnels.`);
          return;
        case 'next':
        case 'prev':
          app.setMode('galerie');
          app.gallery.step(cmd.intent === 'next' ? 1 : -1);
          this.reply(cmd.intent === 'next' ? 'Photo suivante.' : 'Photo précédente.', { speak: false });
          return;
        case 'favorite': {
          const id = app.gallery.viewerId || app.gallery.photoUnderCursor();
          if (!id) { this.reply('Ouvrez d’abord une photo.'); return; }
          const on = await app.gallery.toggleFav(id, true);
          this.reply(on ? 'Ajoutée aux favoris.' : 'Retirée des favoris.');
          return;
        }
        case 'clear-drawing':
          app.draw.clear();
          this.reply('Ardoise effacée.', { speak: false });
          return;
        case 'export-drawing': {
          const rec = await app.draw.export();
          if (rec) this.reply('Dessin enregistré dans la galerie.');
          return;
        }
        case 'close-viewer':
          app.gallery.close();
          return;
        case 'fullscreen':
          document.documentElement.requestFullscreen?.().catch(() => {});
          return;
        case 'fullscreen-exit':
          if (document.fullscreenElement) document.exitFullscreen?.();
          return;
        case 'mute':
          this.reply('Mode silencieux.', { speak: false });
          app.settings.set({ sound: false, speak: false });
          speechSynthesis?.cancel?.();
          return;
        case 'unmute':
          app.settings.set({ sound: true, speak: true });
          this.reply('Son réactivé.');
          return;
        case 'camera-on':
          app.startCamera();
          this.reply('Activation de l’optique.', { speak: false });
          return;
        case 'camera-off':
          app.stopCamera();
          this.reply('Caméra coupée.');
          return;
        case 'simulation':
          app.startDemo();
          this.reply('Banc de simulation ouvert.');
          return;
        case 'hello':
          this.reply(`Bonjour${name ? ` ${name}` : ''}. Tous les systèmes sont opérationnels.`);
          return;
        case 'thanks':
          this.reply('À votre service.');
          return;
        case 'who':
          this.reply('Je suis JARVIS, l’interface gestuelle et vocale de NEXORA. Je fonctionne dans ce navigateur : vos images restent ici.');
          return;
        case 'stop':
          speechSynthesis?.cancel?.();
          return;
        default:
          if (this.brain.enabled) {
            this.reply('Réflexion…', { speak: false });
            document.body.classList.add('is-thinking');
            try {
              const answer = await this.brain.ask(cmd.text || text);
              this.reply(answer);
              app.ui.log('ia', forSpeech(answer).slice(0, 120));
            } catch (err) {
              this.reply(err.message || 'Le cerveau IA ne répond pas.');
            } finally {
              document.body.classList.remove('is-thinking');
            }
          } else {
            this.reply('Je n’ai pas compris. Dites « aide » pour la liste des commandes, ou branchez un cerveau IA dans les réglages pour les questions libres.');
          }
      }
    } catch (err) {
      console.warn('[jarvis] commande :', err);
      this.reply('Une erreur est survenue.');
    }
  }
}
