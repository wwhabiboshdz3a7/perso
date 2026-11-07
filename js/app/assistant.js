// Assistant vocal : reconnaissance (Web Speech API, fr-FR), mot d'éveil
// « Jarvis », exécution des commandes, réponses parlées, cerveau IA facultatif.
// Repli clavier : la barre de commande accepte les mêmes phrases.

import { $ } from './dom.js';
import { parseCommand, COMMAND_HELP, commandCore, parseShortcuts } from '../core/commands.js';
import { formatNumber, nextOccurrence, JOKES, QUOTES, pick } from '../core/local.js';
import { THEMES } from './theme.js';
import { Brain, forSpeech } from './ai.js';
import { spokenDuration } from './timers.js';

const AWAIT_MS = 7000;

const SITES = {
  youtube: 'https://www.youtube.com', google: 'https://www.google.com', gmail: 'https://mail.google.com',
  maps: 'https://www.google.com/maps', 'google maps': 'https://www.google.com/maps', wikipedia: 'https://fr.wikipedia.org',
  github: 'https://github.com', linkedin: 'https://www.linkedin.com', instagram: 'https://www.instagram.com',
  tiktok: 'https://www.tiktok.com', netflix: 'https://www.netflix.com', spotify: 'https://open.spotify.com',
  deepl: 'https://www.deepl.com/translator', 'google traduction': 'https://translate.google.com', traducteur: 'https://translate.google.com',
  calendrier: 'https://calendar.google.com', agenda: 'https://calendar.google.com',
};
const SEARCH = {
  google: ['Google', 'https://www.google.com/search?q='], youtube: ['YouTube', 'https://www.youtube.com/results?search_query='],
  wikipedia: ['Wikipédia', 'https://fr.wikipedia.org/w/index.php?search='], 'wikipédia': ['Wikipédia', 'https://fr.wikipedia.org/w/index.php?search='],
  maps: ['Google Maps', 'https://www.google.com/maps/search/'], 'google maps': ['Google Maps', 'https://www.google.com/maps/search/'],
  github: ['GitHub', 'https://github.com/search?q='],
};
const MODULE_LABEL = { dessin: 'Le dessin', holo: 'L’hologramme', arcade: 'L’arcade' };

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
    // Indication courte sur téléphone : la barre y est trop étroite pour l'exemple.
    const input = $('#cmdInput');
    const full = input.placeholder;
    const narrow = matchMedia('(max-width: 560px)');
    const fit = () => { input.placeholder = narrow.matches ? 'Commande ou question' : full; };
    narrow.addEventListener?.('change', fit);
    fit();
  }

  renderBrain() {
    $('#asstBrain').textContent = this.brain.enabled ? 'cerveau IA' : 'local';
    $('#asstBrain').title = this.brain.label;
  }

  _renderState() {
    const chipState = !this.supported ? 'off' : this.listening ? (Date.now() < this.awaitUntil ? 'active' : 'on') : 'off';
    const label = !this.supported ? 'clavier' : this.listening ? (this.app.settings.get('wake') ? `« ${this.app.assistantName || 'Jarvis'} »` : 'écoute') : 'coupée';
    this.app.ui.chip('Mic', chipState, label);
    $('#btnMic').setAttribute('aria-pressed', String(this.listening));
    $('#btnMic').setAttribute('aria-label', this.listening ? 'Arrêter l’écoute vocale' : 'Activer l’écoute vocale');
    document.body.classList.toggle('is-listening', this.listening && (Date.now() < this.awaitUntil || !this.app.settings.get('wake')));
  }

  renderState() { this._renderState(); }

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

  /** Geste « je t’aime » (ILoveYou) : écoute immédiate sans mot d'éveil. */
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

  /** Rapport d'état (« rapport », « diagnostic »), sans IA. */
  async _status() {
    const app = this.app;
    const parts = [];
    parts.push(app.camera.active ? 'Optique en ligne' : app.player?.active ? 'Simulation en cours' : 'Caméra coupée');
    const peers = app.link.list().length;
    parts.push(peers ? `${peers} appareil${peers > 1 ? 's' : ''} relié${peers > 1 ? 's' : ''}` : 'aucun appareil relié');
    const timers = app.timers.list.filter((t) => !t.done).length;
    if (timers) parts.push(`${timers} minuterie${timers > 1 ? 's' : ''} en cours`);
    if (app.timers.chrono.running) parts.push('chrono lancé');
    const notes = app.notes.list.filter((n) => !n.done).length;
    if (notes) parts.push(`${notes} note${notes > 1 ? 's' : ''} au mémo`);
    const b = await navigator.getBattery?.().catch(() => null);
    if (b) parts.push(`batterie ${Math.round(b.level * 100)} %${b.charging ? ' en charge' : ''}`);
    parts.push(this.brain.enabled ? 'cerveau IA branché' : 'cerveau local');
    return `${parts.join(', ')}. Tous les systèmes répondent.`;
  }

  /**
   * Téléphone et tablette : le panneau Assistant est loin sous la scène ; la
   * réponse s'affiche aussi dans une bulle au-dessus de la barre de commande.
   */
  _bubble(text) {
    const b = $('#cmdBubble');
    if (!b) return;
    if (!this._narrow) {
      this._narrow = matchMedia('(max-width: 1080px)');
      b.addEventListener('click', () => this._hideBubble());
    }
    if (!this._narrow.matches) return;
    b.querySelector('q').textContent = text;
    b.hidden = false;
    document.documentElement.style.setProperty('--bubble-h', `${b.offsetHeight + 8}px`);
    clearTimeout(this._bubbleT);
    this._bubbleT = setTimeout(() => this._hideBubble(), Math.min(15000, 4500 + text.length * 50));
  }

  _hideBubble() {
    clearTimeout(this._bubbleT);
    const b = $('#cmdBubble');
    if (b) b.hidden = true;
    document.documentElement.style.setProperty('--bubble-h', '0px');
  }

  reply(text, { speak = true } = {}) {
    if (speak && text) this.lastReply = text;
    this.jarvisEl.textContent = text;
    this._bubble(text);
    if (speak && this.app.settings.get('speak') && 'speechSynthesis' in window) {
      this.ensureVoices();
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(forSpeech(text));
        u.lang = 'fr-FR';
        const v = this.voice();
        if (v) u.voice = v;
        u.rate = this.app.settings.get('rate') || 1;
        u.pitch = this.app.settings.get('pitch') || 0.92;
        u.onstart = () => document.body.classList.add('is-speaking');
        u.onend = u.onerror = () => document.body.classList.remove('is-speaking');
        speechSynthesis.speak(u);
      } catch { /* synthèse indisponible */ }
    }
  }

  /** Question libre transmise au cerveau IA (réponse affichée et lue en texte brut). */
  async _askBrain(question) {
    this.reply('Réflexion…', { speak: false });
    document.body.classList.add('is-thinking');
    try {
      const answer = forSpeech(await this.brain.ask(question));
      this.reply(answer);
      this.app.ui.log('ia', answer.slice(0, 120));
    } catch (err) {
      this.reply(err.message || 'Le cerveau IA ne répond pas.');
    } finally {
      document.body.classList.remove('is-thinking');
    }
  }

  /** Ouvre un site ; si le navigateur bloque la fenêtre (commande vocale), propose un bouton. */
  _open(url, label) {
    let w = null;
    try { w = window.open(url, '_blank'); } catch { w = null; }
    if (w) { try { w.opener = null; } catch { /* autre origine */ } return true; }
    this.app.ui.toast(label, 'Le navigateur a bloqué l’ouverture automatique.', { action: { label: 'Ouvrir', run: () => window.open(url, '_blank', 'noopener') }, ms: 12000 });
    return false;
  }

  /** Raccourci personnel correspondant à la phrase, s'il y en a un. */
  _shortcut(text) {
    const core = commandCore(text);
    if (!core) return null;
    return parseShortcuts(this.app.settings.get('customCommands')).find((s) => s.key === core) || null;
  }

  async _runShortcut(sc, depth, source) {
    this.app.ui.log('voix', `raccourci « ${sc.phrase} » (${sc.actions.length} action${sc.actions.length > 1 ? 's' : ''})`);
    let spoke = false;
    for (const a of sc.actions) {
      const quoted = a.match(/^["«“](.*)["»”]$/s);
      if (quoted) { this.reply(quoted[1].trim()); spoke = true; continue; }
      const url = a.match(/^(?:ouvre|ouvrir|va sur)\s+(https?:\/\/\S+)$/i);
      if (url) { this._open(url[1], `Ouvrir ${url[1]}`); continue; }
      await this.handle(a, { source, depth: depth + 1, quiet: true });
      await new Promise((r) => setTimeout(r, 180));
    }
    if (!spoke && !sc.actions.some((a) => /^["«“]/.test(a))) this.reply(`Raccourci « ${sc.phrase} » exécuté.`, { speak: false });
  }

  /** Exécute une phrase (voix ou clavier). */
  async handle(text, { source = 'clavier', parsed, depth = 0, quiet = false } = {}) {
    const app = this.app;
    if (depth < 3) {
      const sc = this._shortcut(text);
      if (sc) {
        this.youEl.textContent = text;
        await this._runShortcut(sc, depth, source);
        return;
      }
    }
    const cmd = parsed || parseCommand(text);
    const name = app.settings.get('userName');
    if (!quiet) {
      this.youEl.textContent = text;
      app.ui.log('voix', `« ${text} »${source === 'clavier' ? ' (clavier)' : ''}`);
    }
    const p = cmd.params;
    try {
      switch (cmd.intent) {
        case 'empty': return;
        case 'wake-only':
          this.reply(`Oui${name ? `, ${name}` : ''} ?`);
          return;
        case 'help':
          this.reply('Sans IA, je sais calculer, convertir, noter, lancer une minuterie, une alarme ou un chrono, donner l’heure, la météo et les jours restants, chercher sur le web, jouer, et changer de nom ou de thème.');
          app.ui.toast('Commandes', COMMAND_HELP.map(([c]) => c).join(' · '), { ms: 14000, sound: false });
          return;
        case 'open-mode': {
          const m = p.mode;
          if (MODULE_LABEL[m] && !app.moduleOn(m)) { this.reply(`${MODULE_LABEL[m]} est masqué. Réactivez-le dans les réglages, onglet Identité.`); return; }
          if (m === 'galerie' || m === 'dessin' || m === 'holo' || m === 'arcade') {
            app.setMode(m);
            const play = m === 'arcade' && /\b(lance|commence|demarre|jouer|joue|rejoue|nouvelle|partie|go)\b/.test(cmd.normalized);
            this.reply({ galerie: 'Galerie ouverte.', dessin: 'Mode dessin. Levez l’index pour tracer.', holo: 'Projection de l’hologramme.', arcade: play ? 'Partie lancée. Bonne chance.' : 'Arcade ouverte. Dites « lance la partie » quand vous êtes prêt.' }[m]);
            if (play) setTimeout(() => app.arcade.start(), 250);
          } else if (m === 'reglages') { app.openSettings(); this.reply('Voici les réglages.'); }
          else if (m === 'tutoriel') { app.openTutorial(); this.reply('Voici les gestes.'); }
          else if (m === 'liaison') {
            this.reply('Préparation de la liaison. Scannez le QR code avec l’autre appareil.');
            app.link.startNet().then(() => app.link.showQr()).catch(() => {});
          } else if (m === 'confidentialite') { window.open('confidentialite.html', '_blank', 'noopener'); this.reply('Tout est expliqué sur cette page.'); }
          return;
        }
        case 'send-photo': {
          const sent = await app.share.sendPhoto();
          this.reply(sent ? 'Photo envoyée.' : app.link.list().length ? 'Je n’ai pas pu envoyer cette photo.' : 'Aucun appareil n’est relié pour le moment.');
          return;
        }
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
            // Ville inconnue : c'était peut-être une question libre (« température de l'eau »).
            if (err?.code === 'notfound' && p.city && this.brain.enabled) { await this._askBrain(cmd.text || text); return; }
            this.reply(err?.code === 'notfound' ? `Je ne trouve pas la ville « ${city} ».` : 'Le service météo est injoignable pour le moment.');
          }
          return;
        }
        case 'timer':
          if (!p.seconds) { this.reply('Pour combien de temps ? Par exemple : minuterie de cinq minutes.'); return; }
          if (p.tooLong) { this.reply('C’est un peu long : une minuterie dure 24 heures au plus.'); return; }
          app.timers.add(p.seconds, p.label);
          this.reply(`Minuterie de ${spokenDuration(p.seconds)} lancée${p.purpose ? ` pour ${p.purpose}` : ''}.`);
          return;
        case 'timer-cancel': {
          const n = app.timers.clear();
          this.reply(n ? (n > 1 ? `${n} minuteries annulées.` : 'Minuterie annulée.') : 'Aucune minuterie en cours.');
          return;
        }
        case 'capture':
          if (!app.capture.available()) {
            this.reply('Activez d’abord la caméra, dans le panneau Optique, puis redemandez-moi une capture.');
            return;
          }
          this.reply('Souriez.');
          await app.capture.take({ via: source === 'voix' ? 'commande vocale' : 'commande clavier' });
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
          this.reply(`Je suis ${app.assistantName}, l’interface gestuelle et vocale de NEXORA. Je fonctionne dans ce navigateur : vos images restent ici.`);
          return;
        case 'calc':
          this.reply(`${p.expr} = ${formatNumber(p.value)}.`);
          return;
        case 'convert':
          this.reply(p.sentence);
          return;
        case 'note-add': {
          if (!app.notes) return;
          const note = app.notes.add(p.text);
          this.reply(note ? `C’est noté : ${note.text.replace(/[.!?]+$/, '')}.` : 'Que dois-je noter ?');
          if (!app.settings.get('showNotes')) app.ui.toast('Mémo masqué', 'La note est enregistrée ; le panneau Mémo est masqué dans les réglages.', { sound: false });
          return;
        }
        case 'note-list':
          this.reply(app.notes.spoken());
          return;
        case 'note-clear': {
          const n = app.notes.clear();
          this.reply(n ? `Mémo vidé : ${n} note${n > 1 ? 's' : ''} effacée${n > 1 ? 's' : ''}.` : 'Le mémo était déjà vide.');
          return;
        }
        case 'alarm': {
          const at = nextOccurrence(p);
          const t = app.timers.addAt(at, p.label);
          const tomorrow = at.getDate() !== new Date().getDate();
          this.reply(`Alarme réglée à ${p.h} heure${p.h > 1 ? 's' : ''}${p.m ? ` ${String(p.m).padStart(2, '0')}` : ''}${tomorrow ? ', demain' : ''}${p.label ? `, pour ${p.label}` : ''}.`);
          void t;
          return;
        }
        case 'chrono-start':
          this.reply(app.timers.chronoStart() ? 'Chrono lancé.' : 'Le chrono tourne déjà.', { speak: source === 'voix' });
          return;
        case 'chrono-stop': {
          const was = app.timers.chronoStop();
          const s = Math.round(app.timers.chronoElapsed() / 100) / 10;
          this.reply(was ? `Chrono arrêté à ${spokenDuration(Math.floor(s))}${s % 1 ? ` et ${Math.round((s % 1) * 10)} dixième${Math.round((s % 1) * 10) > 1 ? 's' : ''}` : ''}.` : 'Le chrono n’est pas lancé.');
          return;
        }
        case 'chrono-reset':
          app.timers.chronoReset();
          this.reply('Chrono remis à zéro.', { speak: false });
          return;
        case 'chrono-read':
          this.reply(`Chrono : ${spokenDuration(Math.floor(app.timers.chronoElapsed() / 1000))}.`);
          return;
        case 'days-until': {
          const d = p.days;
          this.reply(d === 0 ? `C’est aujourd’hui : ${p.label} !` : d === 1 ? `Plus qu’un jour avant ${p.label}.` : `Il reste ${d} jours avant ${p.label}.`);
          return;
        }
        case 'coin': {
          const r = Math.random() < 0.5 ? 'Pile' : 'Face';
          app.sound.play('click');
          this.reply(`${r} !`);
          return;
        }
        case 'dice': {
          const rolls = Array.from({ length: p.count }, () => 1 + Math.floor(Math.random() * 6));
          const sum = rolls.reduce((a, b) => a + b, 0);
          this.reply(rolls.length === 1 ? `Le dé donne ${rolls[0]}.` : `${rolls.join(', ')} : total ${sum}.`);
          return;
        }
        case 'random': {
          const v = p.min + Math.floor(Math.random() * (p.max - p.min + 1));
          this.reply(`${v}.`);
          return;
        }
        case 'joke':
          this.reply(pick(JOKES.filter((j) => j !== this._lastJoke)) || JOKES[0]);
          this._lastJoke = this.lastReply;
          return;
        case 'quote': {
          const [q, who] = pick(QUOTES);
          this.reply(`« ${q} » ${who}.`);
          return;
        }
        case 'repeat':
          this.reply(this.lastReply || 'Je n’ai encore rien dit.');
          return;
        case 'status':
          this.reply(await this._status());
          return;
        case 'battery': {
          const b = await navigator.getBattery?.().catch(() => null);
          if (!b) { this.reply('Ce navigateur ne donne pas accès à la batterie.'); return; }
          this.reply(`Batterie à ${Math.round(b.level * 100)} pour cent${b.charging ? ', en charge' : ''}.`);
          return;
        }
        case 'volume': {
          const v = Math.max(0, Math.min(1, Math.round(((app.settings.get('volume') || 0) + p.delta) * 20) / 20));
          app.settings.set({ volume: v, sound: v > 0 });
          app.sound.play('click');
          this.reply(`Volume à ${Math.round(v * 100)} pour cent.`, { speak: false });
          return;
        }
        case 'theme': {
          let id = p.theme;
          if (id === 'next') {
            const i = THEMES.findIndex((t) => t.id === app.settings.get('theme'));
            id = THEMES[(i + 1) % THEMES.length].id;
          }
          app.settings.set({ theme: id });
          const label = THEMES.find((t) => t.id === id)?.label.split(' · ')[0] || id;
          this.reply(`Thème ${label} appliqué.`);
          return;
        }
        case 'rename': {
          const nn = p.name.replace(/\s+/g, ' ').slice(0, 20);
          app.settings.set({ assistantName: nn });
          this.reply(`Entendu. Je m’appelle désormais ${nn}. Dites « ${nn} » pour m’appeler.`);
          return;
        }
        case 'open-url':
          this._open(p.url, `Ouvrir ${p.url}`);
          this.reply('J’ouvre le lien.', { speak: false });
          return;
        case 'open-site': {
          const url = SITES[p.site];
          if (!url) { this.reply('Je ne connais pas ce site.'); return; }
          this._open(url, `Ouvrir ${p.site}`);
          this.reply(`J’ouvre ${p.site.charAt(0).toUpperCase() + p.site.slice(1)}.`, { speak: false });
          return;
        }
        case 'search': {
          const [label, base] = SEARCH[p.on] || SEARCH.google;
          this._open(base + encodeURIComponent(p.q), `Rechercher « ${p.q} » sur ${label}`);
          this.reply(`Je cherche « ${p.q} » sur ${label}.`, { speak: false });
          return;
        }
        case 'stop':
          speechSynthesis?.cancel?.();
          return;
        default:
          if (this.brain.enabled) {
            await this._askBrain(cmd.text || text);
          } else {
            this.reply('Je n’ai pas compris. Dites « aide » pour la liste des commandes, ajoutez un raccourci dans les réglages, ou branchez un cerveau IA pour les questions libres.');
          }
      }
    } catch (err) {
      console.warn('[jarvis] commande :', err);
      this.reply('Une erreur est survenue.');
    }
  }
}
