// Réglages persistants (localStorage). La clé d'API peut être limitée à la
// session (sessionStorage) si l'utilisateur ne souhaite pas la mémoriser.

import { Emitter } from './dom.js';

const KEY = 'jarvis.reglages.v1';
const AI_KEY_LOCAL = 'jarvis.cle-ia';
const AI_KEY_SESSION = 'jarvis.cle-ia.session';

function guessDevice() {
  const ua = navigator.userAgent || '';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Téléphone Android' : 'Tablette Android';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'PC Windows';
  if (/Linux/.test(ua)) return 'Ordinateur Linux';
  return 'Cet appareil';
}

export const DEFAULTS = Object.freeze({
  userName: 'Ibrahim',
  deviceName: '',
  dominant: 'Right',
  sensitivity: 1.1,
  smoothing: 0.6,
  pinchOn: 0.28,
  debounce: 90,
  swipeSpeed: 1.25,
  ghost: true,
  magnet: true,
  facing: 'user',
  quality: 'auto',
  model: 'gesture',
  delegate: 'GPU',
  mirror: true,
  bgVideo: true,
  wake: true,
  speak: true,
  voice: '',
  rate: 1.0,
  city: 'Toulouse',
  aiProvider: 'off',
  aiBase: '',
  aiModel: '',
  aiRemember: true,
  aiSystem: '',
  role: 'both',
  localLink: true,
  autoAccept: true,
  peerHost: '',
  peerPort: '',
  peerPath: '',
  peerKey: '',
  peerSecure: true,
  iceServers: '',
  sound: true,
  volume: 0.5,
  motion: 'auto',
  bootSeq: true,
  tutoSeen: false,
  welcomed: false,
  peerCode: '',
});

function safeGet(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}
function safeSet(storage, key, value) {
  try {
    if (value === null || value === undefined || value === '') storage.removeItem(key);
    else storage.setItem(key, value);
  } catch { /* stockage indisponible (navigation privée stricte) */ }
}

export class Settings extends Emitter {
  constructor() {
    super();
    let saved = {};
    try { saved = JSON.parse(safeGet(localStorage, KEY) || '{}') || {}; } catch { saved = {}; }
    this.data = { ...DEFAULTS, ...saved };
    if (!this.data.deviceName) this.data.deviceName = guessDevice();
  }

  get(k) { return this.data[k]; }

  set(patch) {
    const changed = {};
    for (const [k, v] of Object.entries(patch)) {
      if (!(k in DEFAULTS)) continue;
      if (this.data[k] !== v) { this.data[k] = v; changed[k] = v; }
    }
    if (Object.keys(changed).length) {
      this.save();
      this.emit('change', changed);
    }
    return changed;
  }

  save() {
    safeSet(localStorage, KEY, JSON.stringify(this.data));
  }

  /** Clé d'API : jamais dans l'objet de réglages exporté. */
  get aiKey() {
    return safeGet(sessionStorage, AI_KEY_SESSION) || safeGet(localStorage, AI_KEY_LOCAL) || '';
  }

  set aiKey(value) {
    const v = (value || '').trim();
    if (this.data.aiRemember) {
      safeSet(localStorage, AI_KEY_LOCAL, v);
      safeSet(sessionStorage, AI_KEY_SESSION, '');
    } else {
      safeSet(sessionStorage, AI_KEY_SESSION, v);
      safeSet(localStorage, AI_KEY_LOCAL, '');
    }
    this.emit('change', { aiKey: !!v });
  }

  forgetAiKey() {
    safeSet(localStorage, AI_KEY_LOCAL, '');
    safeSet(sessionStorage, AI_KEY_SESSION, '');
    this.emit('change', { aiKey: false });
  }

  reset() {
    try { localStorage.removeItem(KEY); } catch { /* rien */ }
    this.forgetAiKey();
    this.data = { ...DEFAULTS, deviceName: guessDevice() };
    this.emit('change', { ...this.data });
  }

  /** Paramètres du moteur de gestes dérivés des réglages. */
  engineOptions() {
    const s = this.data.smoothing;
    return {
      mirror: this.data.mirror,
      dominant: this.data.dominant,
      pinchOn: this.data.pinchOn,
      pinchOff: Math.min(0.75, this.data.pinchOn + 0.14),
      poseDebounceMs: this.data.debounce,
      swipeSpeed: this.data.swipeSpeed,
      throwSpeed: this.data.swipeSpeed * 1.12,
      smoothing: { minCutoff: 3.2 - 2.6 * s, beta: 10 - 6 * s, dCutoff: 1 },
    };
  }
}
