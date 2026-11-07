// JARVIS — point d'entrée : assemble les sources, le moteur de gestes, les
// modules (galerie et partage, dessin, hologramme, voix) et l'interface.

import { $, $$, Emitter, clamp, isMobile, reducedMotion, sleep, el, icon } from './dom.js';
import { Settings } from './store.js';
import { Sound } from './sound.js';
import { UI } from './ui.js';
import { GestureEngine } from '../core/gestures.js';
import { SCENARIOS, sequenceProblem, MAX_SEQUENCE_S } from '../core/sequences.js';
import { POSE_LABELS, GESTURE_LABELS } from '../core/hand.js';
import { Pipeline, EMPTY_RESULT } from './pipeline.js';
import { CameraSource } from './tracker.js';
import { SequencePlayer, MouseHand, Recorder } from './sources.js';
import { HUD, FX } from './hud.js';
import { AirCursor } from './cursor.js';
import { Gallery } from './gallery.js';
import { Link } from './transport.js';
import { Share } from './share.js';
import { Draw } from './draw.js';
import { Holo } from './holo.js';
import { Assistant } from './assistant.js';
import { Weather } from './weather.js';
import { Timers } from './timers.js';
import { Capture } from './capture.js';
import { SleepMode } from './sleep.js';
import { Tutorial } from './tutorial.js';
import { SettingsUI } from './settings-ui.js';
import { Notes } from './notes.js';
import { Arcade } from './arcade.js';
import { applyTheme } from './theme.js';
import { setWakeWord } from '../core/commands.js';
import { db } from './db.js';

const ENGINE_KEYS = ['mirror', 'dominant', 'pinchOn', 'debounce', 'swipeSpeed', 'smoothing'];

const CAMERA_KEYS = ['facing', 'quality', 'model', 'delegate'];
const DIR_FR = { left: '←', right: '→', up: '↑', down: '↓' };
const MODE_KEYS = { dessin: 'showDraw', holo: 'showHolo', arcade: 'showArcade' };
const PANEL_KEYS = { showSensors: '.panel--sensors', showLog: '.panel--log', showClock: '.panel--clock', showLink: '.panel--link', showTimers: '.panel--timers', showNotes: '.panel--notes' };
const MODE_NAMES = { galerie: 'galerie', dessin: 'dessin', holo: 'hologramme', arcade: 'arcade' };

class App {
  constructor() {
    this.bus = new Emitter();
    this.settings = new Settings();
    this.sound = new Sound(this.settings);
    this.ui = new UI(this);
    this.engine = new GestureEngine(this.settings.engineOptions());
    this.pipeline = new Pipeline(this.engine);
    this.mode = 'galerie';
    this.camera = new CameraSource({ video: $('#camVideo'), onFrame: (f) => this.pipeline.push(f), onStatus: (s) => this._camStatus(s) });
    this.player = new SequencePlayer((f) => this.pipeline.push(f));
    this.recorder = new Recorder();
    this.mouseHand = new MouseHand({
      onFrame: (f) => this.pipeline.push(f),
      toCamera: (x, y) => this.mapFromScreen(x, y),
      mirror: () => this.settings.get('mirror'),
      isActive: () => !this.player.active,
      grabbedSince: (t) => !!this.share?.carry && this.share.carry.startedAt >= t - 50,
    });
    this.hud = new HUD(this);
    this.fx = new FX(this);
    this.cursor = new AirCursor(this);
    this.gallery = new Gallery(this);
    this.link = new Link(this);
    this.share = new Share(this);
    this.draw = new Draw(this);
    this.holo = new Holo(this);
    this.weather = new Weather(this);
    this.timers = new Timers(this);
    this.notes = new Notes(this);
    this.capture = new Capture(this);
    this.sleep = new SleepMode(this);
    this.assistant = new Assistant(this);
    this.tutorial = new Tutorial(this);
    this.settingsUI = new SettingsUI(this);
    this.arcade = new Arcade(this);
    applyTheme(this.settings.get('theme'));
    this._applyIdentity();
    this._applyModules();
    this._wire();
  }

  // ——— Correspondance caméra ↔ écran ————————————————————————————

  /** Zone de l'image caméra qui couvre tout l'écran (selon la sensibilité). */
  region() {
    const s = this.settings.get('sensitivity') || 1;
    const w = Math.min(1, 0.8 / s), h = Math.min(1, 0.74 / s);
    const y0 = clamp(0.47 - h / 2, 0, 1 - h);
    return { x0: 0.5 - w / 2, x1: 0.5 + w / 2, y0, y1: y0 + h };
  }

  mapToScreen(p) {
    const r = this.region();
    return {
      x: clamp((p.x - r.x0) / (r.x1 - r.x0), 0, 1) * window.innerWidth,
      y: clamp((p.y - r.y0) / (r.y1 - r.y0), 0, 1) * window.innerHeight,
    };
  }

  mapFromScreen(sx, sy) {
    const r = this.region();
    return { x: r.x0 + (sx / window.innerWidth) * (r.x1 - r.x0), y: r.y0 + (sy / window.innerHeight) * (r.y1 - r.y0) };
  }

  // ——— Câblage ————————————————————————————————————————————————

  _wire() {
    this.pipeline.on('frame', ({ frame, result }) => {
      if (frame.source === 'camera') this.recorder.push(frame);
      // Dessin de l'aperçu : une fois par image affichée, même si plusieurs
      // images de suivi arrivent entre deux rafraîchissements.
      this._visual = { frame, result };
      if (!this._visualRaf) this._visualRaf = requestAnimationFrame(() => this._drawVisual());
      this.fx.setResult(result);
      if (this.sleep.on) { this.sleep.onFrame(result); return; }
      this.cursor.update(result);
      this.share.onFrame();
      if (this.mode === 'dessin') this.draw.onFrame(result);
      else if (this.mode === 'holo') this.holo.onFrame(result);
    });
    this.pipeline.on('raw', (frame) => { if (frame.source === 'camera') this.recorder.push(frame); });
    this.pipeline.on('idle', () => {
      this.fx.setResult(null);
      if (!this.sleep.on) this.cursor.update(EMPTY_RESULT);
      this._visual = { frame: this.pipeline.lastFrame, result: null };
      if (!this._visualRaf) this._visualRaf = requestAnimationFrame(() => this._drawVisual());
    });
    this.pipeline.on('event', ({ ev, result }) => this.route(ev, result));

    for (const b of $$('.mode-tab')) b.addEventListener('click', () => this.setMode(b.dataset.mode));
    $('#btnSettings').addEventListener('click', () => this.openSettings());
    $('#btnTuto').addEventListener('click', () => this.openTutorial());
    $('#btnCamStart').addEventListener('click', () => this.startCamera());
    $('#btnDemo').addEventListener('click', () => this.startDemo());
    $('#btnCamToggle').addEventListener('click', () => (this.camera.active ? this.stopCamera() : this.startCamera()));
    $('#btnRecord').addEventListener('click', () => this.toggleRecording());
    $('#btnSim').addEventListener('click', () => this.openSim(!$('#simPanel').hidden ? false : true));
    $('#simClose').addEventListener('click', () => this.openSim(false));
    $('#btnMouseHand').addEventListener('click', () => this.setMouseHand(!this.mouseHand.enabled));
    $('#simImport').addEventListener('change', (e) => { this.importSequence(e.target.files[0]); e.target.value = ''; });
    $('#simStop').addEventListener('click', () => this.stopPlayback());
    this._buildSim();

    this.settings.on('change', (c) => this._onSettings(c));
    document.documentElement.dataset.motion = this.settings.get('motion');
    document.body.classList.toggle('is-mirrored', this.settings.get('mirror'));

    const unlock = () => this.sound.unlock();
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });

    window.addEventListener('keydown', (e) => this._keys(e));
    // Réinitialisation lancée depuis une autre fenêtre : la base a été libérée.
    window.addEventListener('jarvis:db-reset', () => {
      this.ui.toast('JARVIS réinitialisé ailleurs', 'Une autre fenêtre a tout réinitialisé. Rechargez cette page pour repartir de zéro.', {
        kind: 'warn', ms: 15000, action: { label: 'Recharger', run: () => location.reload() },
      });
    });
    window.addEventListener('resize', () => this.hud.drawOptic(this.pipeline.lastFrame, this.pipeline.lastResult));
    setInterval(() => this._watchPerf(), 1000);
  }

  _drawVisual() {
    this._visualRaf = 0;
    const { frame, result } = this._visual;
    this.hud.drawOptic(frame, result);
    this.hud.updateSensors(result, frame);
  }

  _onSettings(c) {
    const keys = Object.keys(c);
    if (keys.some((k) => ENGINE_KEYS.includes(k))) this.engine.configure(this.settings.engineOptions());
    if ('mirror' in c) document.body.classList.toggle('is-mirrored', c.mirror);
    if ('bgVideo' in c) document.body.classList.toggle('has-bgvideo', c.bgVideo && this.camera.active);
    if ('sound' in c || 'volume' in c) this.sound.updateVolume();
    if ('delegate' in c) this.camera._preferCpu = false;
    if ('motion' in c) document.documentElement.dataset.motion = c.motion;
    if ('userName' in c) $('#welcomeName').textContent = c.userName ? ` ${c.userName}` : '';
    if ('theme' in c) applyTheme(c.theme);
    if ('assistantName' in c || 'assistantTagline' in c) this._applyIdentity();
    if (keys.some((k) => k.startsWith('show'))) this._applyModules();
    if (keys.some((k) => CAMERA_KEYS.includes(k)) && this.camera.active) {
      clearTimeout(this._restartT);
      this._restartT = setTimeout(() => { this.stopCamera(true); this.startCamera({ silent: true }); }, 400);
    }
  }

  _keys(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable]') || document.querySelector('dialog[open]')) return;
    if (!$('#welcome').hidden || !document.body.classList.contains('is-ready')) return;
    if (e.key === '1') this.setMode('galerie');
    else if (e.key === '2') this.setMode('dessin');
    else if (e.key === '3') this.setMode('holo');
    else if (e.key === '4') this.setMode('arcade');
    else if (e.key === '/') { e.preventDefault(); $('#cmdInput').focus(); }
    else if (e.key === 'Escape') { if (this.player.active) this.stopPlayback(); else if (!$('#simPanel').hidden) this.openSim(false); else if (this.gallery.viewerId) this.gallery.close(); }
    else return;
  }

  /** Routage des évènements du moteur de gestes. */
  route(ev, result) {
    const isPrimary = ev.hand !== null && ev.hand === result.primary?.id;
    this._logEvent(ev);
    if (this.sleep.on) return;
    if (ev.type === 'gesture') {
      if (ev.name === 'ILoveYou') { this.assistant.attention(); return; }
      if (ev.name === 'Victory' && this.mode !== 'dessin' && !this.share.carry && !this.capture.busy) { this.capture.take(); return; }
    }
    if (ev.type === 'release' && this.share.release(ev)) return;
    if (ev.type === 'throw') return; // traité via release.thrown
    let consumed = false;
    if (this.mode === 'galerie') {
      if (ev.type === 'grab' && isPrimary) { this.share.grab(ev); consumed = true; }
      else consumed = this.gallery.onGesture(ev);
    } else if (this.mode === 'dessin') {
      consumed = this.draw.onGesture(ev);
    } else if (this.mode === 'holo') {
      consumed = this.holo.onGesture(ev);
    } else if (this.mode === 'arcade') {
      consumed = this.arcade.onGesture(ev);
    }
    if (ev.type === 'swipe' && consumed) this.sound.play('swipe');
    if ((!consumed && isPrimary) || ev.type === 'twohand:start') this.cursor.onEvent(ev);
  }

  _logEvent(ev) {
    let text = null;
    switch (ev.type) {
      case 'grab': text = 'attraper (poing)'; break;
      case 'release': text = ev.thrown ? `lancer ${DIR_FR[ev.direction] || ''}` : 'lâcher (main ouverte)'; break;
      case 'swipe': text = `swipe ${DIR_FR[ev.direction]}`; break;
      case 'gesture': if (!['Open_Palm', 'Closed_Fist', 'Pointing_Up'].includes(ev.name)) text = `geste : ${GESTURE_LABELS[ev.name] || ev.name}`; break;
      case 'twohand:start': text = 'deux mains : manipulation'; break;
      case 'twohand:end': text = `deux mains : ×${ev.scale.toFixed(2).replace('.', ',')} · ${Math.round((ev.rotation * 180) / Math.PI)}°`; break;
      default: break;
    }
    if (text) this.ui.log('geste', text);
  }

  // ——— Modes ————————————————————————————————————————————————————

  /** Module affiché (non masqué dans les réglages › Identité). */
  moduleOn(m) { return !MODE_KEYS[m] || this.settings.get(MODE_KEYS[m]) !== false; }

  setMode(m) {
    if (!['galerie', 'dessin', 'holo', 'arcade'].includes(m) || !this.moduleOn(m)) return;
    if (m === this.mode) return;
    const prev = this.mode;
    if (prev === 'holo') this.holo.stop();
    if (prev === 'dessin') this.draw.stop();
    if (prev === 'arcade') this.arcade.leave();
    this.mode = m;
    for (const v of $$('[data-view]')) v.hidden = v.dataset.view !== m;
    for (const b of $$('.mode-tab')) b.setAttribute('aria-pressed', String(b.dataset.mode === m));
    if (m !== 'galerie') this.gallery.close();
    if (m === 'holo') this.holo.start();
    if (m === 'dessin') this.draw.start();
    this.sound.play('click');
    this.ui.log('système', `module : ${MODE_NAMES[m]}`);
    this.bus.emit('mode', m);
  }

  get assistantName() { return (this.settings.get('assistantName') || '').trim() || 'JARVIS'; }

  /** Nom et sous-titre de l'assistant partout dans l'interface. */
  _applyIdentity() {
    const name = this.assistantName;
    const tag = (this.settings.get('assistantTagline') || '').trim();
    for (const n of $$('[data-ai-name]')) n.textContent = name;
    const sub = $('#brandSub');
    sub.textContent = tag;
    sub.hidden = !tag;
    document.title = `${name} — ${tag || 'Interface gestuelle et vocale'}`;
    $('#boot')?.setAttribute('aria-label', `Démarrage de ${name}`);
    $('.brand')?.setAttribute('aria-label', `${name}, accueil`);
    const h1 = $('#app > h1');
    if (h1) h1.textContent = `${name}, interface gestuelle et vocale`;
    setWakeWord(name);
    this.assistant?.renderState();
  }

  /** Modules et panneaux masqués ou affichés (réglages › Identité). */
  _applyModules() {
    for (const [k, sel] of Object.entries(PANEL_KEYS)) { const p = $(sel); if (p) p.hidden = this.settings.get(k) === false; }
    for (const [m, k] of Object.entries(MODE_KEYS)) { const b = $(`.mode-tab[data-mode="${m}"]`); if (b) b.hidden = this.settings.get(k) === false; }
    if (!this.moduleOn(this.mode)) this.setMode('galerie');
  }

  openDialog(dlg) {
    if (!dlg.open) dlg.showModal();
    this.cursor.attachTo(dlg);
    dlg.addEventListener('close', () => this.cursor.attachTo(document.body), { once: true });
  }

  openSettings(tab) { this.settingsUI.open(tab); }
  openTutorial() { this.tutorial.open(); }

  // ——— Caméra ———————————————————————————————————————————————————

  async startCamera({ silent = false } = {}) {
    if (this.camera.active || this._camStarting) return;
    this._camStarting = true;
    this.sound.unlock();
    const q = this.settings.get('quality');
    const quality = q === 'auto' ? (isMobile() || this._forceLight ? 'light' : 'high') : q;
    this._quality = quality;
    $('#opticIdle').hidden = false;
    $('#btnCamStart').disabled = true;
    this.ui.chip('Cam', 'busy', 'démarrage');
    try {
      const stream = await this.camera.start({
        facing: this.settings.get('facing'),
        quality,
        model: this.settings.get('model'),
        delegate: this.settings.get('delegate'),
        restart: silent,
      });
      const bg = $('#bgVideo');
      bg.srcObject = stream;
      bg.play().catch(() => {});
      document.body.classList.add('cam-on');
      document.body.classList.toggle('has-bgvideo', this.settings.get('bgVideo'));
      if (this.mouseHand.enabled) this.setMouseHand(false);
      $('#btnCamToggle').hidden = false;
      $('#btnRecord').hidden = false;
      $('#btnCamToggle').lastChild.textContent = 'Couper';
      const st = this.camera.stats;
      this.ui.chip('Cam', 'on', `${st.width}×${st.height}`);
      $('#optMeta').textContent = `${st.delegate} · ${st.model}`;
      if (!silent) this.ui.toast('Optique en ligne', `Suivi des deux mains actif (${st.delegate === 'GPU' ? 'processeur graphique' : 'processeur'}).`, { kind: 'ok', sound: 'ok' });
      this.ui.log('système', `caméra ${st.width}×${st.height}, modèle ${st.model}, ${st.delegate}`);
      this.settings.set({ welcomed: true });
    } catch (err) {
      console.warn('[jarvis] caméra :', err);
      const messages = {
        NotAllowedError: 'Accès à la caméra refusé. Autorisez-le dans la barre d’adresse, ou essayez la démonstration.',
        NotFoundError: 'Aucune caméra détectée sur cet appareil.',
        NotReadableError: 'La caméra est utilisée par une autre application.',
        OverconstrainedError: 'Cette caméra ne propose pas la résolution demandée.',
        SecurityError: 'La caméra exige une connexion sécurisée (HTTPS).',
        NotSupportedError: 'Ce navigateur ne permet pas d’utiliser la caméra ici (HTTPS requis).',
        AbortError: 'La caméra n’a pas pu démarrer. Fermez les autres applications qui l’utilisent, puis réessayez.',
        TypeError: 'Caméra inaccessible : ouvrez la page en HTTPS dans un navigateur récent.',
      };
      const msg = messages[err?.name]
        || (err?.fr ? err.message : /Téléchargement|Failed to fetch|NetworkError|network/i.test(err?.message || '')
          ? 'Le modèle optique n’a pas pu être téléchargé. Vérifiez la connexion, puis réessayez.'
          : 'Caméra inaccessible sur ce navigateur. Essayez un navigateur récent (Chrome, Edge, Safari) en HTTPS, ou la démonstration.');
      this.camera.stop();
      $('#opticMsg').textContent = 'Caméra indisponible';
      $('#opticProgress').hidden = true;
      this.ui.chip('Cam', 'error', 'erreur');
      this.ui.toast('Caméra indisponible', msg, { kind: 'error' });
    } finally {
      this._camStarting = false;
      $('#btnCamStart').disabled = false;
    }
  }

  stopCamera(silent) {
    this.camera.stop();
    $('#bgVideo').srcObject = null;
    document.body.classList.remove('cam-on', 'has-bgvideo');
    $('#opticIdle').hidden = false;
    $('#opticMsg').textContent = 'Caméra coupée';
    $('#optMeta').textContent = 'hors ligne';
    $('#btnCamToggle').lastChild.textContent = 'Activer';
    $('#btnRecord').hidden = true;
    this.ui.chip('Cam', 'off', 'éteinte');
    if (this.recorder.recording) this.toggleRecording();
    if (!silent) this.ui.log('système', 'caméra coupée');
  }

  _camStatus(s) {
    const msg = $('#opticMsg'), prog = $('#opticProgress');
    if (s.phase === 'camera') { msg.textContent = s.message; prog.hidden = true; }
    else if (s.phase === 'download') {
      msg.textContent = s.message;
      prog.hidden = false;
      const pct = Math.round((s.progress || 0) * 100);
      $('#opticBar').style.width = `${pct}%`;
      $('#opticPct').textContent = `${pct} %`;
    } else if (s.phase === 'running') {
      $('#opticIdle').hidden = true;
      prog.hidden = true;
    } else if (s.phase === 'notice') {
      this.ui.log('système', s.message);
    } else if (s.phase === 'delegate') {
      $('#optMeta').textContent = `${s.delegate} · ${this.camera.stats.model}`;
      this.ui.log('système', s.message);
    }
  }

  /** Suivi trop lent en haute définition : bascule automatique en mode léger. */
  _watchPerf() {
    if (!this.camera.active || this.settings.get('quality') !== 'auto' || this._quality !== 'high') { this._slow = 0; return; }
    const fps = this.camera.stats.fps;
    this._slow = fps && fps < 12 ? (this._slow || 0) + 1 : 0;
    if (this._slow < 6) return;
    this._slow = 0;
    this._forceLight = true;
    this.ui.toast('Mode léger activé', 'Le suivi était trop lent : passage en 640×480.', { kind: 'warn' });
    this.stopCamera(true);
    this.startCamera({ silent: true });
  }

  // ——— Simulation ————————————————————————————————————————————————

  startDemo() {
    this.hideWelcome();
    this.setMouseHand(true);
    if (matchMedia('(pointer: coarse)').matches) {
      // Écran tactile : le banc couvrirait l'écran, il reste à portée (bouton fiole).
      this.ui.toast('Démonstration', 'Votre doigt est l’index. Toucher bref = pincement. Appui long sur une photo = l’attraper : elle reste en main quand le doigt se lève. Sur l’autre appareil, appui long puis relâcher = ouvrir la main pour la lâcher.', { ms: 11000 });
      return;
    }
    this.openSim(true);
    this.ui.toast('Démonstration', 'Main virtuelle : la souris est votre index. Clic bref = pincement, clic maintenu = poing, relâcher = ouvrir la main. Ouvrez une 2e fenêtre pour tester le partage.', { ms: 9000 });
  }

  setMouseHand(on) {
    this.mouseHand.enable(on);
    $('#btnMouseHand').setAttribute('aria-pressed', String(on));
    document.body.classList.toggle('is-mousehand', on);
    if (!this.player.active) this.pipeline.setOverride(on ? 'souris' : null);
    if (on) this.ui.log('système', 'main virtuelle activée');
  }

  openSim(on) {
    $('#simPanel').hidden = !on;
    $('#btnSim').setAttribute('aria-expanded', String(on));
    if (on) this.renderRecordings();
  }

  _buildSim() {
    const grid = $('#simScenarios');
    for (const [name, sc] of Object.entries(SCENARIOS)) {
      const b = el('button', { type: 'button', class: 'btn btn--xs', dataset: { scenario: name } }, icon('play'), sc.label);
      b.addEventListener('click', () => this.playScenario(name));
      grid.append(b);
    }
  }

  /** Paramètres par défaut d'un scénario selon l'écran (cible visée). */
  _defaultParams(name) {
    const center = (sel) => {
      const n = typeof sel === 'string' ? $(sel) : sel;
      if (!n) return null;
      const r = n.getBoundingClientRect();
      if (!r.width) return null;
      return this.mapFromScreen(r.left + r.width / 2, r.top + r.height / 2);
    };
    const stage = center('#stage') || { x: 0.5, y: 0.5 };
    if (name === 'attraper') {
      const target = this.cursor.hoverEl?.closest?.('.photo') || $('.photo:not(.is-grabbed)');
      return { ...(this.gallery.viewerId ? center('#viewerImg') : center(target)) || stage };
    }
    if (name === 'pincer') return center($('.photo .photo__btn')) || stage;
    if (name === 'cercle' && this.mode === 'dessin') return { ...(center('#drawCanvas') || stage), r: 0.16 };
    return stage;
  }

  async playScenario(name, params = {}) {
    const sc = SCENARIOS[name];
    if (!sc) throw new Error(`Scénario inconnu : ${name}`);
    const p = { ...this._defaultParams(name), ...params, mirror: this.settings.get('mirror') };
    this.ui.log('simulation', sc.label);
    return this.playSequence(sc.build(p));
  }

  async playSequence(seq) {
    if (sequenceProblem(seq?.frames)) {
      this.ui.toast('Lecture impossible', 'Ce geste enregistré est invalide ou trop long.', { kind: 'error' });
      return;
    }
    this.pipeline.setOverride('simulation');
    document.body.classList.add('is-simulating');
    $('#simStop').hidden = false;
    try {
      await this.player.play(seq);
    } finally {
      if (!this.player.active) {
        document.body.classList.remove('is-simulating');
        $('#simStop').hidden = true;
        this.pipeline.setOverride(this.mouseHand.enabled ? 'souris' : null);
        this.fx.setResult(null);
      }
    }
  }

  stopPlayback() {
    if (!this.player.active) return;
    this.player.stop();
    this.ui.log('simulation', 'lecture arrêtée');
  }

  async toggleRecording() {
    const btn = $('#btnRecord');
    if (!this.recorder.recording) {
      this.recorder.start();
      btn.setAttribute('aria-pressed', 'true');
      btn.lastChild.textContent = 'Arrêter';
      document.body.classList.add('is-recording');
      this.ui.toast('Enregistrement du geste', 'Faites votre geste devant la caméra, puis arrêtez.', { sound: 'listen' });
      return;
    }
    const frames = this.recorder.stop();
    btn.setAttribute('aria-pressed', 'false');
    btn.lastChild.textContent = 'Enregistrer un geste';
    document.body.classList.remove('is-recording');
    if (frames.length < 5) { this.ui.toast('Geste trop court', 'Aucune image utile enregistrée.', { kind: 'warn' }); return; }
    const all = await db.all('sequences').catch(() => []);
    const dur = (frames[frames.length - 1].t / 1000).toFixed(1).replace('.', ',');
    const rec = { id: `seq-${Date.now().toString(36)}`, name: `Geste ${all.length + 1} · ${dur} s`, frames, createdAt: Date.now() };
    await db.put('sequences', rec).catch(() => {});
    this.ui.toast('Geste enregistré', `${rec.name} (${frames.length} images) — rejouable dans le banc de simulation.`, { kind: 'ok' });
    this.renderRecordings();
  }

  async renderRecordings() {
    const ul = $('#simRecs');
    const list = (await db.all('sequences').catch(() => [])).sort((a, b) => b.createdAt - a.createdAt);
    ul.textContent = '';
    if (!list.length) {
      ul.append(el('li', { class: 'empty' }, 'Aucun. Activez la caméra puis « Enregistrer un geste ».'));
      return;
    }
    for (const s of list) {
      const li = el('li', {}, el('span', { text: s.name }),
        el('button', { type: 'button', class: 'icon-btn icon-btn--sm', 'aria-label': `Rejouer ${s.name}`, onclick: () => this.playSequence({ frames: s.frames }) }, icon('play')),
        el('button', { type: 'button', class: 'icon-btn icon-btn--sm', 'aria-label': `Exporter ${s.name} en JSON`, onclick: () => this.exportSequence(s) }, icon('download')),
        el('button', { type: 'button', class: 'icon-btn icon-btn--sm', 'aria-label': `Supprimer ${s.name}`, onclick: async () => { await db.delete('sequences', s.id); this.renderRecordings(); } }, icon('trash')));
      ul.append(li);
    }
  }

  exportSequence(s) {
    const blob = new Blob([JSON.stringify({ format: 'jarvis-geste', version: 1, name: s.name, frames: s.frames })], { type: 'application/json' });
    // Nom de fichier en ASCII : certains systèmes refusent les accents et
    // remplacent alors le nom par « download ».
    const base = s.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'geste';
    const a = el('a', { href: URL.createObjectURL(blob), download: `${base}.json` });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  async importSequence(file) {
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('taille');
      const data = JSON.parse(await file.text());
      const frames = Array.isArray(data) ? data : data?.frames;
      const why = sequenceProblem(frames);
      if (why) throw new Error(why);
      const rec = { id: `seq-${Date.now().toString(36)}`, name: String(data.name || file.name).slice(0, 60), frames, createdAt: Date.now() };
      await db.put('sequences', rec);
      this.ui.toast('Geste importé', rec.name, { kind: 'ok' });
      this.renderRecordings();
    } catch (err) {
      const detail = err?.message === 'durée' ? `Un geste dure ${MAX_SEQUENCE_S} secondes au plus.`
        : err?.message === 'temps' ? 'Les horodatages (t) doivent être croissants.'
          : 'Ce fichier n’est pas un geste JARVIS valide.';
      this.ui.toast('Import impossible', detail, { kind: 'error' });
    }
  }

  // ——— Démarrage ——————————————————————————————————————————————————

  async boot() {
    const params = new URLSearchParams(location.search);
    const fast = params.has('rapide') || params.has('demo') || !this.settings.get('bootSeq') || reducedMotion();
    $('#welcomeName').textContent = this.settings.get('userName') ? ` ${this.settings.get('userName')}` : '';
    this._clock();
    const galleryReady = this.gallery.init().catch((err) => console.warn('[jarvis] galerie :', err));
    this.link.init();
    this.weather.start();
    if (!fast) await this._bootSequence();
    await Promise.race([galleryReady, sleep(fast ? 4000 : 1500)]);
    $('#boot').classList.add('is-done');
    document.body.classList.remove('is-booting');
    document.body.classList.add('is-ready');
    setTimeout(() => $('#boot').remove(), 700);
    if (params.has('demo')) { this.showApp(); this.startDemo(); }
    else if (params.has('rapide') || this.settings.get('welcomed')) {
      this.showApp();
      this._autoCamera();
    } else {
      this.showWelcome();
    }
    this._exposeApi();
  }

  async _bootSequence() {
    const ticks = $('.b-ticks');
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r1 = 112, r2 = i % 6 ? 116 : 122;
      ticks.insertAdjacentHTML('beforeend', `<line x1="${120 + Math.cos(a) * r1}" y1="${120 + Math.sin(a) * r1}" x2="${120 + Math.cos(a) * r2}" y2="${120 + Math.sin(a) * r2}"/>`);
    }
    const log = $('#bootLog');
    const lines = [
      [`Noyau ${this.assistantName}`, 'v1.1'],
      ['Moteur de gestes · 2 × 21 points', 'OK'],
      ['Optique · modèle embarqué', 'PRÊT'],
      ['Liaison · locale + WebRTC', 'PRÊT'],
      ['Voix · fr-FR', this.assistant.supported ? 'OK' : 'CLAVIER'],
    ];
    let skipped = false;
    const skip = () => { skipped = true; };
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); };
    $('#bootSkip').addEventListener('click', skip, { once: true });
    window.addEventListener('keydown', onKey);
    for (const [a, b] of lines) {
      if (skipped) break;
      log.append(el('li', {}, el('span', { text: a }), el('span', { text: b })));
      for (let t = 0; t < 34 && !skipped; t++) await sleep(10);
    }
    if (!skipped) {
      const name = this.settings.get('userName');
      log.append(el('li', {}, el('span', { text: `Bonjour${name ? `, ${name}` : ''}.` }), el('span', { text: '' })));
      for (let t = 0; t < 50 && !skipped; t++) await sleep(10);
    }
    window.removeEventListener('keydown', onKey);
  }

  showApp() {
    $('#welcome').hidden = true;
    $('#app').inert = false;
  }

  showWelcome() {
    const w = $('#welcome');
    w.hidden = false;
    $('#welcomeStart').addEventListener('click', () => { this.hideWelcome(); this.startCamera(); });
    $('#welcomeDemo').addEventListener('click', () => this.startDemo());
    $('#welcomeTuto').addEventListener('click', () => this.openTutorial());
    $('#welcomeStart').focus();
  }

  hideWelcome() {
    this.settings.set({ welcomed: true });
    this.showApp();
  }

  async _autoCamera() {
    try {
      const st = await navigator.permissions?.query({ name: 'camera' });
      if (st?.state === 'granted') this.startCamera();
    } catch { /* API des permissions indisponible */ }
  }

  _clock() {
    const time = $('#clockTime'), sec = $('#clockSec'), date = $('#clockDate'), ring = $('#clockSecRing');
    const ticks = [];
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, major = i % 5 === 0;
      const r1 = major ? 44 : 45.5, r2 = 48.5;
      ticks.push(`<line${major ? ' class="major"' : ''} x1="${(50 + Math.cos(a) * r1).toFixed(2)}" y1="${(50 + Math.sin(a) * r1).toFixed(2)}" x2="${(50 + Math.cos(a) * r2).toFixed(2)}" y2="${(50 + Math.sin(a) * r2).toFixed(2)}"/>`);
    }
    $('#clockTicks').innerHTML = ticks.join('');
    $('#clockZone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone?.replace('_', ' ') || '';
    const tick = () => {
      const d = new Date();
      time.textContent = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      time.dateTime = d.toISOString();
      sec.textContent = String(d.getSeconds()).padStart(2, '0');
      date.textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      ring.style.strokeDashoffset = String(251.33 * (1 - d.getSeconds() / 60));
    };
    tick();
    setInterval(tick, 1000);
  }

  /** Console de développement et de tests : window.jarvis. */
  _exposeApi() {
    const app = this;
    window.jarvis = {
      version: '1.0.0',
      app,
      sim: {
        scenarios: Object.keys(SCENARIOS),
        play: (name, params) => app.playScenario(name, params),
        playFrames: (frames) => app.playSequence({ frames }),
        fromScreen: (x, y) => app.mapFromScreen(x, y),
        centerOf(selector) {
          const n = typeof selector === 'string' ? document.querySelector(selector) : selector;
          const r = n.getBoundingClientRect();
          return app.mapFromScreen(r.left + r.width / 2, r.top + r.height / 2);
        },
      },
      command: (text) => app.assistant.handle(text, { source: 'clavier' }),
      state: () => ({
        mode: app.mode,
        photos: app.gallery.photos.length,
        peers: app.link.list().map((p) => ({ name: p.name, via: p.via })),
        carry: app.share.carry ? { name: app.share.carry.name, prepared: !!app.share.carry.prepared } : null,
        incoming: app.share.incoming.size,
        lastSent: app.share.lastSent,
        lastReceived: app.share.lastReceived,
        fps: app.pipeline.fps,
        camera: { active: app.camera.active, ...app.camera.stats },
        pose: app.pipeline.lastResult?.primary ? POSE_LABELS[app.pipeline.lastResult.primary.pose] : null,
        viewer: app.gallery.viewerId,
        sleeping: app.sleep.on,
      }),
    };
  }
}

const app = new App();
app.boot();
