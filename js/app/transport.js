// Liaison entre appareils.
//  • Locale : BroadcastChannel (fenêtres et onglets du même navigateur).
//  • Réseau : WebRTC via PeerJS (appairage par code court ou QR code).
// Les deux transports présentent la même interface au gestionnaire de partage.

import { $, el, Emitter } from './dom.js';
import { makeCode, normalizeCode, formatCode, PEER_PREFIX, validControl } from '../core/protocol.js';
import { qrcode } from '../../vendor/qrcode/qrcode.mjs';

const CHANNEL = 'jarvis-liaison-v1';
const randomId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// Battement entre appareils reliés par le réseau : un appareil fermé, en
// veille ou hors de portée est retiré après un silence prolongé.
export const HEARTBEAT_MS = 5000;
export const SILENCE_MS = 15000;
const OPEN_TIMEOUT_MS = 15000;      // première connexion au serveur de signalisation
const CONNECT_TIMEOUT_MS = 20000;   // ouverture du canal direct vers l'autre appareil
const APPROVAL_TIMEOUT_MS = 45000;  // attente de l'accord de l'autre appareil
const ICE_GRACE_MS = 6000;          // coupure réseau passagère tolérée
const MAX_CONNS = 8;

/** Erreurs de signalisation (serveur PeerJS) : regroupées, jamais en rafale. */
const SIGNAL_ERRORS = new Set(['network', 'server-error', 'socket-error', 'socket-closed', 'disconnected']);
const ERROR_FR = {
  'browser-incompatible': 'Ce navigateur ne prend pas en charge les connexions directes (WebRTC).',
  'invalid-id': 'Identifiant de liaison refusé par le serveur.',
  'invalid-key': 'Clé refusée par le serveur PeerJS : vérifiez les réglages de liaison.',
  'ssl-unavailable': 'Le serveur PeerJS exige une connexion chiffrée (wss).',
  'server-error': 'Le serveur de liaison ne répond pas.',
  'socket-error': 'Connexion au serveur de liaison perdue.',
  'socket-closed': 'Connexion au serveur de liaison fermée.',
  network: 'Serveur de liaison injoignable.',
  webrtc: 'La connexion directe entre les appareils a échoué (pare-feu ou réseau restrictif).',
  'negotiation-failed': 'La négociation avec l’autre appareil a échoué.',
  'connection-closed': 'Connexion avec l’autre appareil fermée.',
  'unavailable-id': 'Ce code est déjà utilisé par un autre appareil.',
  'peer-unavailable': 'Appareil introuvable : vérifiez le code et que l’autre appareil est en ligne.',
};
export const errorFr = (type) => ERROR_FR[type] || 'Incident de liaison réseau.';
const UNREACHABLE = 'Serveur de liaison injoignable. Vérifiez la connexion, ou le serveur PeerJS dans les réglages.';

class LocalTransport extends Emitter {
  constructor(getHello) {
    super();
    this.kind = 'local';
    this.id = randomId();
    this.getHello = getHello;
    this.peers = new Map();
    this.ch = null;
  }

  start() {
    if (this.ch || typeof BroadcastChannel === 'undefined') return;
    this.ch = new BroadcastChannel(CHANNEL);
    this.ch.onmessage = (e) => this._onMessage(e.data);
    this._hello(null, true);
    this._ping = setInterval(() => { this._hello(null, false); this._expire(); }, 2500);
  }

  stop() {
    if (!this.ch) return;
    try { this.ch.postMessage({ from: this.id, to: null, kind: 'bye' }); } catch { /* fermeture */ }
    clearInterval(this._ping);
    this.ch.close();
    this.ch = null;
    for (const id of [...this.peers.keys()]) this._drop(id, 'bye');
  }

  _hello(to, ask) {
    this.ch?.postMessage({ from: this.id, to, kind: 'hello', ask, hello: this.getHello() });
  }

  _expire() {
    const now = Date.now();
    for (const [id, p] of this.peers) if (now - p.seen > 8000) this._drop(id, 'silence');
  }

  _drop(id, reason) {
    if (!this.peers.has(id)) return;
    this.peers.delete(id);
    this.emit('peer', { id, state: 'gone', reason, wasOpen: true, silent: reason === 'silence' });
  }

  _onMessage(m) {
    if (!m || m.from === this.id || (m.to && m.to !== this.id)) return;
    if (m.kind === 'hello') {
      const known = this.peers.get(m.from);
      const info = { id: m.from, seen: Date.now(), hello: m.hello || {} };
      this.peers.set(m.from, info);
      if (!known || JSON.stringify(known.hello) !== JSON.stringify(info.hello)) this.emit('peer', { id: m.from, state: 'open', hello: info.hello });
      if (m.ask) this._hello(m.from, false);
      return;
    }
    if (m.kind === 'bye') { this._drop(m.from, 'bye'); return; }
    if (!this.peers.has(m.from)) return;
    this.peers.get(m.from).seen = Date.now();
    if (m.kind === 'ctrl' && validControl(m.msg)) this.emit('ctrl', { id: m.from, msg: m.msg });
    else if (m.kind === 'bin' && m.buf instanceof ArrayBuffer) this.emit('bin', { id: m.from, buf: m.buf });
  }

  isOpen(id) { return !!this.ch && this.peers.has(id); }
  sendCtrl(id, msg) { this.ch?.postMessage({ from: this.id, to: id, kind: 'ctrl', msg }); }
  async sendBin(id, buf) {
    if (!this.isOpen(id)) throw new Error('Appareil déconnecté');
    this.ch.postMessage({ from: this.id, to: id, kind: 'bin', buf });
  }
  announce() { if (this.ch) this._hello(null, false); }
}

let peerjsPromise = null;
function loadPeerJs() {
  if (window.peerjs?.Peer) return Promise.resolve(window.peerjs.Peer);
  if (!peerjsPromise) {
    peerjsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('../../vendor/peerjs/peerjs.min.js', import.meta.url).href;
      s.async = true;
      s.onload = () => (window.peerjs?.Peer ? resolve(window.peerjs.Peer) : reject(new Error('PeerJS indisponible')));
      s.onerror = () => { peerjsPromise = null; reject(new Error('Chargement de PeerJS impossible')); };
      document.head.append(s);
    });
  }
  return peerjsPromise;
}

/**
 * Liaison réseau. Chaque connexion passe par les états :
 *   sortante : connecting → waiting (accord de l'autre appareil) → open
 *   entrante : connecting → pending (accord demandé ici) → open
 */
class NetTransport extends Emitter {
  constructor(settings, getHello) {
    super();
    this.kind = 'réseau';
    this.settings = settings;
    this.getHello = getHello;
    this.peer = null;
    this.code = null;
    this.conns = new Map();
    this.state = 'off';
    this.approved = new Set(); // appareils acceptés pendant cette session
    this.approve = null;       // (info) => Promise<boolean>, fourni par Link
    this.trouble = null;       // incident de signalisation en cours
    this._retry = 0;
    this._starting = null;
    window.addEventListener?.('online', () => this._reconnectNow());
  }

  options() {
    const s = this.settings.data;
    const o = { debug: 0 };
    if (s.peerHost) {
      o.host = s.peerHost.trim();
      if (s.peerPort) o.port = Number(s.peerPort);
      o.path = s.peerPath || '/';
      o.secure = !!s.peerSecure;
      if (s.peerKey) o.key = s.peerKey;
    }
    if (s.iceServers) {
      try {
        const ice = JSON.parse(s.iceServers);
        if (Array.isArray(ice)) o.config = { iceServers: ice };
      } catch { /* JSON invalide : serveurs par défaut */ }
    }
    return o;
  }

  /** Inscription auprès du serveur de signalisation sous le code donné. */
  async start(code, { persist = true } = {}) {
    if (this.peer && !this.peer.destroyed) {
      if (this.state === 'reconnecting') this._reconnectNow();
      return this._starting || this.code;
    }
    const Peer = await loadPeerJs();
    if (this.peer && !this.peer.destroyed) return this._starting || this.code;
    this.code = code;
    this._setState('connecting');
    const p = new Promise((resolve, reject) => this._open(Peer, code, persist, resolve, reject));
    this._starting = p;
    const clear = () => { if (this._starting === p) this._starting = null; };
    p.then(clear, clear);
    return p;
  }

  _open(Peer, code, persist, resolve, reject) {
    const peer = new Peer(PEER_PREFIX + code.toLowerCase(), this.options());
    this.peer = peer;
    let opened = false;
    // Échec avant la première ouverture : le pair est détruit (pas de
    // reconnexion en boucle) et l'état « hors ligne » reste stable.
    const fail = (message) => {
      clearTimeout(openTimer);
      if (this.peer === peer) this.peer = null;
      try { peer.destroy(); } catch { /* déjà détruit */ }
      this._setState('error');
      reject(new Error(message));
    };
    const openTimer = setTimeout(() => { if (!opened && this.peer === peer) fail(UNREACHABLE); }, OPEN_TIMEOUT_MS);
    peer.on('open', () => {
      if (this.peer !== peer) return;
      clearTimeout(openTimer);
      clearTimeout(this._reconnectTimer);
      opened = true;
      this._retry = 0;
      const recovered = !!this.trouble;
      this.trouble = null;
      this._setState('ready');
      if (!this._hb) this._hb = setInterval(() => this._heartbeat(), HEARTBEAT_MS);
      if (recovered) this.emit('recovered');
      if (persist) this.settings.set({ peerCode: code });
      resolve(code);
    });
    peer.on('connection', (conn) => { if (this.peer === peer) this._incoming(conn); });
    peer.on('disconnected', () => {
      // Perte du serveur APRÈS ouverture : les liaisons directes continuent,
      // on retente l'inscription avec un délai croissant.
      if (this.peer !== peer || peer.destroyed || !opened) return;
      this._setState('reconnecting');
      this._scheduleReconnect();
    });
    peer.on('error', (err) => {
      if (this.peer !== peer) return;
      const type = err?.type || 'error';
      if (type === 'unavailable-id' && !opened) {
        // Code déjà pris (autre onglet ?) : nouveau code pour cette session.
        clearTimeout(openTimer);
        this.peer = null;
        try { peer.destroy(); } catch { /* rien */ }
        this.start(makeCode(), { persist: false }).then(resolve, reject);
        return;
      }
      if (type === 'peer-unavailable') { this._unavailable(err); return; }
      if (!opened) { fail(SIGNAL_ERRORS.has(type) ? UNREACHABLE : `Liaison impossible : ${errorFr(type)}`); return; }
      if (SIGNAL_ERRORS.has(type)) { this._signalTrouble(type); return; }
      this.emit('error', { type, message: errorFr(type) });
    });
  }

  _signalTrouble(type) {
    if (this.trouble) return;
    this.trouble = { type, since: Date.now() };
    this.emit('trouble', { type, message: errorFr(type) });
  }

  _scheduleReconnect() {
    clearTimeout(this._reconnectTimer);
    // 2 s, 4 s, 8 s… jusqu'à une minute, avec un peu d'aléa.
    const delay = Math.min(60000, 2000 * 2 ** Math.min(this._retry, 5)) * (0.85 + Math.random() * 0.3);
    this._retry++;
    this.nextRetryAt = Date.now() + delay;
    this._reconnectTimer = setTimeout(() => this._reconnectNow(), delay);
  }

  _reconnectNow() {
    clearTimeout(this._reconnectTimer);
    const p = this.peer;
    if (!p || p.destroyed || !p.disconnected) return;
    if (navigator.onLine === false) { this._scheduleReconnect(); return; }
    try { p.reconnect(); } catch { this._scheduleReconnect(); }
  }

  /** « Appareil introuvable » : la connexion sortante visée est abandonnée. */
  _unavailable(err) {
    const m = String(err?.message || '').match(/peer\s+(\S+)\s*$/i);
    const target = m ? m[1] : null;
    let found = false;
    for (const [id, c] of [...this.conns]) {
      if (c.outgoing && c.status !== 'open' && (!target || id === target)) { this._drop(id, 'unavailable'); found = true; }
    }
    if (!found && !target) this.emit('error', { type: 'peer-unavailable', message: errorFr('peer-unavailable') });
  }

  connect(code, { silent = false } = {}) {
    if (!this.peer || this.peer.destroyed || this.state !== 'ready') throw new Error('Liaison réseau inactive');
    const target = PEER_PREFIX + code.toLowerCase();
    if (target === this.peer.id) throw new Error('C’est le code de cet appareil.');
    if (this.conns.has(target)) return false;
    if (this.conns.size >= MAX_CONNS) throw new Error('Trop d’appareils reliés.');
    const conn = this.peer.connect(target, { serialization: 'raw', reliable: true, metadata: { hello: this.getHello() } });
    const c = this._track(conn, true);
    c.silent = silent;
    this.emit('peer', { id: target, state: 'connecting', hello: {} });
    c.timer = setTimeout(() => { if (c.status !== 'open') this._drop(target, 'timeout'); }, CONNECT_TIMEOUT_MS);
    return true;
  }

  _incoming(conn) {
    const id = conn.peer;
    if (typeof id !== 'string' || !id.startsWith(PEER_PREFIX)) { conn.close(); return; }
    // Le même appareil qui se reconnecte remplace l'ancienne connexion.
    if (this.conns.has(id)) this._drop(id, 'replaced', { silent: true });
    if (this.conns.size >= MAX_CONNS) { conn.close(); return; }
    const c = this._track(conn, false);
    const h = conn.metadata?.hello;
    c.hello = h && typeof h === 'object' ? h : {};
    c.timer = setTimeout(() => { if (c.status === 'connecting') this._drop(id, 'timeout', { silent: true }); }, CONNECT_TIMEOUT_MS);
  }

  _track(conn, outgoing) {
    const id = conn.peer;
    const c = { id, conn, outgoing, status: 'connecting', seen: Date.now(), hello: {}, timer: 0, iceTimer: 0, everOpen: false };
    this.conns.set(id, c);
    conn.on('open', () => this._onOpen(c));
    conn.on('data', (data) => this._onData(c, data));
    const gone = () => { if (this.conns.get(id) === c) this._drop(id, c.status === 'open' ? 'closed' : 'unavailable'); };
    conn.on('close', gone);
    conn.on('error', gone);
    conn.on('iceStateChanged', (s) => {
      if (this.conns.get(id) !== c) return;
      clearTimeout(c.iceTimer);
      if (s === 'failed' || s === 'closed') this._drop(id, 'lost');
      else if (s === 'disconnected') c.iceTimer = setTimeout(() => { if (this.conns.get(id) === c) this._drop(id, 'lost'); }, ICE_GRACE_MS);
    });
    return c;
  }

  async _onOpen(c) {
    if (this.conns.get(c.id) !== c) return;
    if (c.conn.dataChannel) c.conn.dataChannel.bufferedAmountLowThreshold = 1 << 20;
    c.seen = Date.now();
    clearTimeout(c.timer);
    if (c.outgoing) {
      // On se présente, puis on attend que l'autre appareil accepte (son « hello »).
      c.status = 'waiting';
      this._send(c, { type: 'hello', hello: this.getHello() });
      this.emit('peer', { id: c.id, state: 'waiting', hello: {} });
      c.timer = setTimeout(() => { if (c.status !== 'open') this._drop(c.id, 'timeout'); }, APPROVAL_TIMEOUT_MS);
      return;
    }
    if (this.approved.has(c.id)) { this._accept(c); return; }
    c.status = 'pending';
    this.emit('peer', { id: c.id, state: 'pending', hello: c.hello });
    let ok = false;
    try { ok = this.approve ? await this.approve({ id: c.id, name: String(c.hello.name || '').slice(0, 40) }) : true; } catch { ok = false; }
    if (this.conns.get(c.id) !== c) return;
    if (ok) {
      this.approved.add(c.id);
      this._accept(c);
    } else {
      this._send(c, { type: 'bye', reason: 'refused' });
      setTimeout(() => this._drop(c.id, 'refused', { silent: true }), 400);
    }
  }

  _accept(c) {
    c.status = 'open';
    c.everOpen = true;
    c.seen = Date.now();
    clearTimeout(c.timer);
    this._send(c, { type: 'hello', hello: this.getHello() });
    this.emit('peer', { id: c.id, state: 'open', hello: c.hello });
  }

  _onData(c, data) {
    if (this.conns.get(c.id) !== c) return;
    c.seen = Date.now();
    if (typeof data === 'string') {
      if (data.length > 400_000) return;
      let msg;
      try { msg = JSON.parse(data); } catch { return; }
      if (!validControl(msg)) return;
      if (msg.type === 'ping') { this._send(c, { type: 'pong' }); return; }
      if (msg.type === 'pong') return;
      if (msg.type === 'bye') { this._drop(c.id, msg.reason === 'refused' ? 'refused' : 'bye'); return; }
      if (msg.type === 'hello') {
        c.hello = msg.hello && typeof msg.hello === 'object' ? msg.hello : {};
        if (c.outgoing && c.status === 'waiting') {
          // Réponse de l'autre appareil : il a accepté la liaison.
          c.status = 'open';
          c.everOpen = true;
          clearTimeout(c.timer);
          this.approved.add(c.id);
        }
        if (c.status === 'open') this.emit('peer', { id: c.id, state: 'open', hello: c.hello });
        return;
      }
      if (c.status === 'open') this.emit('ctrl', { id: c.id, msg });
      return;
    }
    if (c.status !== 'open') return;
    if (data instanceof ArrayBuffer) {
      this.emit('bin', { id: c.id, buf: data });
    } else if (data?.buffer instanceof ArrayBuffer) {
      this.emit('bin', { id: c.id, buf: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) });
    } else if (data instanceof Blob) {
      data.arrayBuffer().then((buf) => this.emit('bin', { id: c.id, buf }));
    }
  }

  _drop(id, reason, { silent = false } = {}) {
    const c = this.conns.get(id);
    if (!c) return;
    this.conns.delete(id);
    clearTimeout(c.timer);
    clearTimeout(c.iceTimer);
    try { c.conn.close(); } catch { /* déjà fermée */ }
    this.emit('peer', { id, state: 'gone', reason, silent: silent || c.silent, wasOpen: c.everOpen, outgoing: c.outgoing, name: c.hello?.name });
  }

  /** Battement : ping régulier ; un appareil muet trop longtemps est retiré. */
  _heartbeat() {
    const now = Date.now();
    for (const c of [...this.conns.values()]) {
      if (c.status !== 'open') continue;
      if (now - c.seen > SILENCE_MS) { this._drop(c.id, 'silence'); continue; }
      this._send(c, { type: 'ping' });
    }
  }

  _send(c, msg) {
    try { if (c.conn.open) c.conn.send(JSON.stringify(msg)); } catch { /* canal fermé */ }
  }

  isOpen(id) { return this.conns.get(id)?.status === 'open'; }

  sendCtrl(id, msg) {
    const targets = id ? [this.conns.get(id)] : [...this.conns.values()];
    for (const c of targets) if (c?.status === 'open') this._send(c, msg);
  }

  async sendBin(id, buf) {
    const c = this.conns.get(id);
    if (c?.status !== 'open' || !c.conn.open) throw new Error('Appareil déconnecté');
    const dc = c.conn.dataChannel;
    // Contre-pression : on attend que le tampon d'envoi se vide.
    while (dc && dc.bufferedAmount > 4 * (1 << 20)) {
      await new Promise((r) => {
        const t = setTimeout(r, 200);
        dc.addEventListener('bufferedamountlow', () => { clearTimeout(t); r(); }, { once: true });
      });
      if (this.conns.get(id) !== c || !c.conn.open) throw new Error('Appareil déconnecté');
    }
    c.conn.send(buf);
  }

  announce() {
    this.sendCtrl(null, { type: 'hello', hello: this.getHello() });
  }

  _setState(s) {
    this.state = s;
    this.emit('state', s);
  }

  /** Arrêt complet : « au revoir » aux appareils reliés, pair détruit. */
  stop() {
    clearTimeout(this._reconnectTimer);
    clearInterval(this._hb);
    this._hb = 0;
    for (const c of [...this.conns.values()]) {
      this._send(c, { type: 'bye' });
      this._drop(c.id, 'bye', { silent: true });
    }
    const p = this.peer;
    this.peer = null;
    this.trouble = null;
    this._retry = 0;
    try { p?.destroy(); } catch { /* rien */ }
    if (this.state !== 'off') this._setState('off');
  }
}

const VIA_LABEL = { local: 'fenêtre', réseau: 'réseau' };
const STATE_LABEL = { connecting: 'connexion…', waiting: 'en attente d’accord', pending: 'demande à accepter' };
const DROP_LABEL = { unavailable: 'introuvable', timeout: 'délai dépassé', refused: 'refusée' };

/** Fusionne les deux transports en une seule liste d'appareils reliés. */
export class Link extends Emitter {
  constructor(app) {
    super();
    this.app = app;
    this.peers = new Map(); // clé « local:id » ou « réseau:id »
    const hello = () => ({ name: app.settings.get('deviceName'), role: app.settings.get('role'), v: 1 });
    this.local = new LocalTransport(hello);
    this.net = new NetTransport(app.settings, hello);
    this.net.approve = (info) => this._approve(info);
    for (const t of [this.local, this.net]) {
      t.on('peer', (e) => this._peer(t, e));
      t.on('ctrl', ({ id, msg }) => this.emit('ctrl', { from: `${t.kind}:${id}`, msg, peer: this.peers.get(`${t.kind}:${id}`) }));
      t.on('bin', ({ id, buf }) => this.emit('bin', { from: `${t.kind}:${id}`, buf }));
    }
    this.net.on('state', (s) => this._renderNet(s));
    this.net.on('error', (e) => app.ui.toast('Liaison', e.message, { kind: 'warn' }));
    // Serveur de signalisation perdu après l'appairage : une seule notification,
    // l'état reste ensuite affiché dans le panneau Liaison et la pastille.
    this.net.on('trouble', () => {
      app.ui.log('liaison', 'serveur de liaison injoignable : nouvelles tentatives automatiques');
      app.ui.toast('Serveur de liaison perdu', this.list().some((p) => p.via === 'réseau')
        ? 'Les appareils déjà reliés restent connectés. Reconnexion automatique en cours.'
        : 'Reconnexion automatique en cours.', { kind: 'warn' });
    });
    this.net.on('recovered', () => app.ui.log('liaison', 'serveur de liaison retrouvé'));
    this._bindUi();
  }

  init() {
    if (this.app.settings.get('localLink')) this.local.start();
    this.render();
    const params = new URLSearchParams(location.search);
    const join = normalizeCode(params.get('lien') || '');
    if (join) {
      this.startNet().then(() => this.join(join)).catch(() => {});
      params.delete('lien');
      const q = params.toString();
      history.replaceState(null, '', location.pathname + (q ? `?${q}` : '') + location.hash);
    }
    this.app.settings.on('change', (c) => {
      if ('localLink' in c) { if (c.localLink) this.local.start(); else this.local.stop(); this.render(); }
      if ('deviceName' in c && document.activeElement !== $('#deviceName')) $('#deviceName').value = c.deviceName;
      if ('deviceName' in c || 'role' in c) { this.local.announce(); this.net.announce(); this.render(); }
    });
    // Fenêtre fermée ou rechargée : les autres appareils sont prévenus tout de suite.
    window.addEventListener('pagehide', () => {
      this.app.share?.onPageHide?.();
      this.local.stop();
      this._netWasOn = this.net.state !== 'off';
      this.net.stop();
    });
    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      if (this.app.settings.get('localLink')) this.local.start();
      if (this._netWasOn) this.startNet().catch(() => {});
    });
  }

  _peer(t, { id, state, hello = {}, reason, silent, wasOpen, outgoing }) {
    const key = `${t.kind}:${id}`;
    const prev = this.peers.get(key);
    if (state === 'gone') {
      if (!prev) return;
      this.peers.delete(key);
      const who = prev.name;
      if (prev.state === 'open' || wasOpen) {
        if (reason === 'silence' || reason === 'lost') {
          this.app.ui.log('liaison', `${who} ne répond plus : liaison retirée`);
          if (!silent) this.app.ui.toast('Appareil injoignable', `${who} ne répond plus (fermé ou en veille).`, { kind: 'warn' });
        } else {
          this.app.ui.log('liaison', `${who} s’est déconnecté`);
        }
      } else {
        const msg = {
          unavailable: 'Appareil introuvable : vérifiez le code et que l’autre appareil est en ligne.',
          timeout: outgoing ? 'Pas de réponse : l’autre appareil n’a pas accepté la liaison à temps.' : 'La demande de liaison a expiré.',
          refused: 'L’autre appareil a refusé la liaison.',
        }[reason];
        if (msg && !silent) this.app.ui.toast(reason === 'refused' ? 'Liaison refusée' : 'Liaison impossible', msg, { kind: 'warn' });
        this.app.ui.log('liaison', `liaison avec ${who} abandonnée${DROP_LABEL[reason] ? ` (${DROP_LABEL[reason]})` : ''}`);
      }
      this.emit('change', { key, state, name: who, reason });
    } else {
      const p = prev || { key, via: t.kind, position: 'auto', since: Date.now() };
      p.name = String(hello.name || prev?.name || (t.kind === 'local' ? 'Autre fenêtre' : 'Appareil distant')).slice(0, 40);
      p.role = ['both', 'sender', 'receiver'].includes(hello.role) ? hello.role : prev?.role || 'both';
      p.state = state;
      this.peers.set(key, p);
      const isNew = state === 'open' && (!prev || prev.state !== 'open');
      if (isNew) {
        this.app.ui.log('liaison', `${p.name} relié (${VIA_LABEL[t.kind]})`);
        if (t.kind === 'réseau') this.app.ui.toast('Appareil relié', p.name, { kind: 'ok' });
      }
      this.emit('change', { key, state, isNew });
    }
    this.render();
  }

  /** Nouvelle connexion réseau entrante : l'utilisateur décide. */
  _approve({ name }) {
    const who = name || 'Un appareil';
    this.app.ui.log('liaison', `${who} demande à se relier`);
    return this.app.ui.ask('Demande de liaison', `${who} veut se relier à cet appareil pour échanger des photos.`, { yes: 'Accepter', no: 'Refuser', ms: APPROVAL_TIMEOUT_MS - 5000 });
  }

  list() {
    return [...this.peers.values()].filter((p) => p.state === 'open');
  }

  _split(key) {
    const [kind, ...rest] = key.split(':');
    return [kind === 'local' ? this.local : this.net, rest.join(':')];
  }

  isOpen(key) {
    const [t, id] = this._split(key);
    return t.isOpen(id);
  }

  send(key, msg) {
    if (key) {
      const [t, id] = this._split(key);
      t.sendCtrl(id, msg);
    } else {
      for (const p of this.list()) this.send(p.key, msg);
    }
  }

  async sendBin(key, buf) {
    const [t, id] = this._split(key);
    return t.sendBin(id, buf);
  }

  async startNet() {
    if (this.net.state === 'ready') return this.net.code;
    const code = normalizeCode(this.app.settings.get('peerCode')) || makeCode();
    this._renderNet('connecting');
    try {
      return await this.net.start(code);
    } catch (err) {
      this._renderNet('error');
      this.app.ui.toast('Liaison réseau indisponible', err.message, { kind: 'warn' });
      throw err;
    }
  }

  /** Nouveau code d'appairage : l'ancien (et son QR) ne permet plus de se relier. */
  async newCode() {
    const wasOn = this.net.state !== 'off';
    const hadPeers = this.list().some((p) => p.via === 'réseau');
    this.net.stop();
    this.net.approved.clear();
    this.app.settings.set({ peerCode: makeCode() });
    this.app.ui.log('liaison', 'nouveau code de liaison');
    if (wasOn) await this.startNet().catch(() => {});
    if (this.net.state === 'ready') {
      this.app.ui.toast('Nouveau code de liaison', `${formatCode(this.net.code)} · ${hadPeers ? 'les appareils reliés par le réseau doivent se relier de nouveau.' : 'l’ancien code ne fonctionne plus.'}`, { kind: 'ok' });
    }
  }

  join(input) {
    const code = normalizeCode(input);
    if (!code) { this.app.ui.toast('Code invalide', 'Six caractères, par exemple K7P-2QX.', { kind: 'warn' }); return false; }
    try {
      if (this.net.connect(code) === false) { this.app.ui.toast('Déjà en cours', 'Cet appareil est déjà relié, ou la demande attend une réponse.', { sound: false }); return false; }
      this.app.ui.log('liaison', `connexion à ${formatCode(code)}…`);
      return true;
    } catch (err) {
      this.app.ui.toast('Liaison', err.message, { kind: 'warn' });
      return false;
    }
  }

  joinUrl(code) {
    const u = new URL(location.href);
    u.search = `?lien=${code}`;
    u.hash = '';
    return u.toString();
  }

  // ——— Interface ————————————————————————————————————————————————

  _bindUi() {
    $('#btnNetStart').addEventListener('click', () => this.startNet().catch(() => {}));
    $('#btnNewCode').addEventListener('click', () => this.newCode());
    $('#joinForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#joinCode');
      if (this.join(input.value)) input.value = '';
    });
    const nameInput = $('#deviceName');
    nameInput.value = this.app.settings.get('deviceName');
    nameInput.addEventListener('change', () => {
      const v = nameInput.value.trim().slice(0, 32) || 'Cet appareil';
      nameInput.value = v;
      this.app.settings.set({ deviceName: v });
    });
    $('#qrBox').addEventListener('click', () => this.showQr());
    $('#qrClose').addEventListener('click', () => $('#dlgQr').close());
  }

  _qrSvg(text) {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n} ${n}" role="img" aria-label="QR code de liaison" shape-rendering="crispEdges"><path fill="#03080c" d="${d}"/></svg>`;
  }

  showQr() {
    const code = this.net.code;
    if (!code || this.net.state !== 'ready') return;
    const url = this.joinUrl(code);
    $('#qrBig').innerHTML = this._qrSvg(url);
    $('#qrCode').textContent = formatCode(code);
    $('#qrUrl').textContent = url;
    this.app.openDialog($('#dlgQr'));
  }

  _renderNet(state = this.net.state) {
    const box = $('#linkCode');
    const startBtn = $('#btnNetStart');
    const form = $('#joinForm');
    const st = $('#linkNetState');
    if (state === 'off') {
      box.hidden = true; form.hidden = true; st.hidden = true; startBtn.hidden = false;
      startBtn.lastChild.textContent = 'Relier un autre appareil';
      this.render();
      return;
    }
    startBtn.hidden = state !== 'error';
    if (state === 'error') startBtn.lastChild.textContent = 'Réessayer la liaison réseau';
    // Code et QR seulement quand l'appareil est réellement joignable.
    const ready = state === 'ready';
    box.hidden = !ready;
    form.hidden = !ready;
    const code = this.net.code;
    if (ready && code && this._qrFor !== code) {
      this._qrFor = code;
      $('#linkCodeVal').textContent = formatCode(code);
      $('#qrBox').innerHTML = this._qrSvg(this.joinUrl(code));
    }
    if (!ready && $('#dlgQr').open) $('#dlgQr').close();
    const linked = this.list().some((p) => p.via === 'réseau');
    const labels = {
      connecting: 'connexion au serveur de liaison…',
      ready: 'en ligne · prêt à relier',
      reconnecting: linked ? 'serveur perdu · appareils reliés toujours actifs · reconnexion…' : 'serveur de liaison perdu · reconnexion…',
      error: 'hors ligne · serveur de liaison injoignable',
    };
    st.hidden = false;
    st.textContent = labels[state] || state;
    st.classList.toggle('is-ok', ready);
    st.classList.toggle('is-err', state === 'error');
    st.classList.toggle('is-busy', state === 'connecting' || state === 'reconnecting');
    this.render();
  }

  render() {
    const list = [...this.peers.values()];
    const ul = $('#peers');
    ul.textContent = '';
    const openCount = this.list().length;
    for (const p of list) {
      const extra = p.state !== 'open' ? ` · ${STATE_LABEL[p.state] || p.state}` : p.role === 'receiver' ? ' · récepteur' : p.role === 'sender' ? ' · émetteur' : '';
      const li = el('li', { class: 'peer', dataset: { state: p.state } },
        el('span', { class: 'peer__dot', 'aria-hidden': 'true' }),
        el('span', { class: 'peer__name', title: p.name }, p.name, ' ', el('span', { class: 'peer__via', text: `· ${VIA_LABEL[p.via]}${extra}` })));
      if (openCount > 1 && p.state === 'open') {
        const sel = el('select', { 'aria-label': `Direction de lancer vers ${p.name}` },
          ...[['auto', 'tous'], ['left', '← gauche'], ['right', 'droite →'], ['up', '↑ haut']].map(([v, t]) => el('option', { value: v, selected: p.position === v, text: t })));
        sel.addEventListener('change', () => { p.position = sel.value; });
        li.append(sel);
      } else {
        li.append(el('span'));
      }
      ul.append(li);
    }
    const localCount = list.filter((p) => p.via === 'local' && p.state === 'open').length;
    $('#linkLocalCount').textContent = this.app.settings.get('localLink') ? String(localCount) : 'désactivée';
    $('#linkLocal').classList.toggle('is-on', localCount > 0);
    const roles = { both: 'émetteur · récepteur', sender: 'émetteur', receiver: 'récepteur' };
    $('#linkRole').textContent = roles[this.app.settings.get('role')] || '';
    const ns = this.net.state;
    const busy = ns === 'connecting' || ns === 'reconnecting';
    const chipState = openCount ? (ns === 'reconnecting' ? 'busy' : 'on') : busy ? 'busy' : ns === 'error' ? 'error' : 'off';
    const chipText = openCount ? `${openCount} relié${openCount > 1 ? 's' : ''}` : ns === 'ready' ? 'en ligne' : ns === 'error' ? 'hors ligne' : busy ? 'connexion' : 'aucun';
    this.app.ui.chip('Link', chipState, chipText);
  }
}
