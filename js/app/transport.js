// Liaison entre appareils.
//  • Locale : BroadcastChannel (fenêtres et onglets du même navigateur).
//  • Réseau : WebRTC via PeerJS (appairage par code court ou QR code).
// Les deux transports présentent la même interface au gestionnaire de partage.

import { $, el, Emitter, escapeHtml } from './dom.js';
import { makeCode, normalizeCode, formatCode, PEER_PREFIX, validControl } from '../core/protocol.js';
import { qrcode } from '../../vendor/qrcode/qrcode.mjs';

const CHANNEL = 'jarvis-liaison-v1';
const randomId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

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
    for (const id of [...this.peers.keys()]) this._drop(id);
  }

  _hello(to, ask) {
    this.ch?.postMessage({ from: this.id, to, kind: 'hello', ask, hello: this.getHello() });
  }

  _expire() {
    const now = Date.now();
    for (const [id, p] of this.peers) if (now - p.seen > 8000) this._drop(id);
  }

  _drop(id) {
    if (!this.peers.has(id)) return;
    this.peers.delete(id);
    this.emit('peer', { id, state: 'gone' });
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
    if (m.kind === 'bye') { this._drop(m.from); return; }
    if (!this.peers.has(m.from)) return;
    this.peers.get(m.from).seen = Date.now();
    if (m.kind === 'ctrl' && validControl(m.msg)) this.emit('ctrl', { id: m.from, msg: m.msg });
    else if (m.kind === 'bin' && m.buf instanceof ArrayBuffer) this.emit('bin', { id: m.from, buf: m.buf });
  }

  sendCtrl(id, msg) { this.ch?.postMessage({ from: this.id, to: id, kind: 'ctrl', msg }); }
  async sendBin(id, buf) { this.ch?.postMessage({ from: this.id, to: id, kind: 'bin', buf }); }
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

  async start(code, { persist = true } = {}) {
    if (this.peer && !this.peer.destroyed) return this.code;
    const Peer = await loadPeerJs();
    this.code = code;
    this._setState('connecting');
    return new Promise((resolve, reject) => {
      const peer = new Peer(PEER_PREFIX + code.toLowerCase(), this.options());
      this.peer = peer;
      let opened = false;
      peer.on('open', () => {
        opened = true;
        this._setState('ready');
        if (persist) this.settings.set({ peerCode: code });
        resolve(code);
      });
      peer.on('connection', (conn) => this._setup(conn));
      peer.on('disconnected', () => {
        if (peer.destroyed) return;
        this._setState('reconnecting');
        setTimeout(() => { if (!peer.destroyed && peer.disconnected) peer.reconnect(); }, 2000);
      });
      peer.on('error', (err) => {
        const type = err?.type || 'error';
        if (type === 'unavailable-id' && !opened) {
          // Code déjà pris (autre onglet ?) : nouveau code pour cette session.
          peer.destroy();
          this.peer = null;
          this.start(makeCode(), { persist: false }).then(resolve, reject);
          return;
        }
        if (type === 'peer-unavailable') {
          this.emit('error', { type, message: 'Appareil introuvable : vérifiez le code et que l’autre appareil est en ligne.' });
          return;
        }
        if (!opened) {
          this._setState('error');
          reject(new Error(type === 'network' || type === 'server-error' || type === 'socket-error'
            ? 'Serveur de liaison injoignable. Vérifiez la connexion ou le serveur PeerJS dans les réglages.'
            : `Liaison impossible (${type}).`));
          return;
        }
        this.emit('error', { type, message: `Liaison : ${type}` });
      });
    });
  }

  connect(code) {
    if (!this.peer || this.peer.destroyed) throw new Error('Liaison réseau inactive');
    const target = PEER_PREFIX + code.toLowerCase();
    if (target === this.peer.id) throw new Error('C’est le code de cet appareil.');
    if (this.conns.has(target)) return;
    const conn = this.peer.connect(target, { serialization: 'raw', reliable: true, metadata: { hello: this.getHello() } });
    this._setup(conn, true);
  }

  _setup(conn, outgoing = false) {
    const id = conn.peer;
    this.conns.set(id, conn);
    this.emit('peer', { id, state: 'connecting', hello: conn.metadata?.hello || {} });
    conn.on('open', () => {
      if (conn.dataChannel) conn.dataChannel.bufferedAmountLowThreshold = 1 << 20;
      this.emit('peer', { id, state: 'open', hello: conn.metadata?.hello || {} });
      conn.send(JSON.stringify({ type: 'hello', hello: this.getHello() }));
    });
    conn.on('data', (data) => {
      if (typeof data === 'string') {
        let msg;
        try { msg = JSON.parse(data); } catch { return; }
        if (!validControl(msg)) return;
        if (msg.type === 'hello') { this.emit('peer', { id, state: 'open', hello: msg.hello || {} }); return; }
        this.emit('ctrl', { id, msg });
      } else if (data instanceof ArrayBuffer) {
        this.emit('bin', { id, buf: data });
      } else if (data?.buffer instanceof ArrayBuffer) {
        this.emit('bin', { id, buf: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) });
      } else if (data instanceof Blob) {
        data.arrayBuffer().then((buf) => this.emit('bin', { id, buf }));
      }
    });
    const gone = () => {
      if (this.conns.get(id) !== conn) return;
      this.conns.delete(id);
      this.emit('peer', { id, state: 'gone' });
    };
    conn.on('close', gone);
    conn.on('error', gone);
    void outgoing;
  }

  sendCtrl(id, msg) {
    const s = JSON.stringify(msg);
    const targets = id ? [this.conns.get(id)] : [...this.conns.values()];
    for (const c of targets) if (c?.open) c.send(s);
  }

  async sendBin(id, buf) {
    const c = this.conns.get(id);
    if (!c?.open) throw new Error('Appareil déconnecté');
    const dc = c.dataChannel;
    // Contre-pression : on attend que le tampon d'envoi se vide.
    while (dc && dc.bufferedAmount > 4 * (1 << 20)) {
      await new Promise((r) => {
        const t = setTimeout(r, 200);
        dc.addEventListener('bufferedamountlow', () => { clearTimeout(t); r(); }, { once: true });
      });
      if (!c.open) throw new Error('Appareil déconnecté');
    }
    c.send(buf);
  }

  announce() {
    this.sendCtrl(null, { type: 'hello', hello: this.getHello() });
  }

  _setState(s) {
    this.state = s;
    this.emit('state', s);
  }

  stop() {
    for (const c of this.conns.values()) c.close();
    this.conns.clear();
    this.peer?.destroy();
    this.peer = null;
    this._setState('off');
  }
}

const VIA_LABEL = { local: 'fenêtre', réseau: 'réseau' };

/** Fusionne les deux transports en une seule liste d'appareils reliés. */
export class Link extends Emitter {
  constructor(app) {
    super();
    this.app = app;
    this.peers = new Map(); // clé « local:id » ou « réseau:id »
    const hello = () => ({ name: app.settings.get('deviceName'), role: app.settings.get('role'), v: 1 });
    this.local = new LocalTransport(hello);
    this.net = new NetTransport(app.settings, hello);
    for (const t of [this.local, this.net]) {
      t.on('peer', ({ id, state, hello: h }) => this._peer(t, id, state, h));
      t.on('ctrl', ({ id, msg }) => this.emit('ctrl', { from: `${t.kind}:${id}`, msg, peer: this.peers.get(`${t.kind}:${id}`) }));
      t.on('bin', ({ id, buf }) => this.emit('bin', { from: `${t.kind}:${id}`, buf }));
    }
    this.net.on('state', (s) => this._renderNet(s));
    this.net.on('error', (e) => app.ui.toast('Liaison', e.message, { kind: 'warn' }));
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
  }

  _peer(t, id, state, hello = {}) {
    const key = `${t.kind}:${id}`;
    const prev = this.peers.get(key);
    if (state === 'gone') {
      if (!prev) return;
      this.peers.delete(key);
      this.app.ui.log('liaison', `${prev.name} s’est déconnecté`);
      this.emit('change', { key, state });
    } else {
      const p = prev || { key, via: t.kind, position: 'auto', since: Date.now() };
      p.name = String(hello.name || prev?.name || (t.kind === 'local' ? 'Autre fenêtre' : 'Appareil distant')).slice(0, 40);
      p.role = hello.role || prev?.role || 'both';
      p.state = state;
      this.peers.set(key, p);
      if (!prev && state === 'open') {
        this.app.ui.log('liaison', `${p.name} relié (${VIA_LABEL[t.kind]})`);
        if (t.kind === 'réseau') this.app.ui.toast('Appareil relié', p.name, { kind: 'ok' });
      } else if (prev && prev.state !== 'open' && state === 'open') {
        this.app.ui.log('liaison', `${p.name} relié (${VIA_LABEL[t.kind]})`);
        this.app.ui.toast('Appareil relié', p.name, { kind: 'ok' });
      }
      this.emit('change', { key, state, isNew: !prev || prev.state !== 'open' });
    }
    this.render();
  }

  list() {
    return [...this.peers.values()].filter((p) => p.state === 'open');
  }

  send(key, msg) {
    if (key) {
      const [kind, ...rest] = key.split(':');
      const id = rest.join(':');
      (kind === 'local' ? this.local : this.net).sendCtrl(id, msg);
    } else {
      for (const p of this.list()) this.send(p.key, msg);
    }
  }

  async sendBin(key, buf) {
    const [kind, ...rest] = key.split(':');
    const id = rest.join(':');
    return (kind === 'local' ? this.local : this.net).sendBin(id, buf);
  }

  async startNet() {
    if (this.net.state === 'ready') return this.net.code;
    const code = normalizeCode(this.app.settings.get('peerCode')) || makeCode();
    this._renderNet('connecting', code);
    try {
      return await this.net.start(code);
    } catch (err) {
      this._renderNet('error');
      this.app.ui.toast('Liaison réseau indisponible', err.message, { kind: 'warn' });
      throw err;
    }
  }

  join(input) {
    const code = normalizeCode(input);
    if (!code) { this.app.ui.toast('Code invalide', 'Six caractères, par exemple K7P-2QX.', { kind: 'warn' }); return false; }
    try {
      this.net.connect(code);
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
    if (!code) return;
    const url = this.joinUrl(code);
    $('#qrBig').innerHTML = this._qrSvg(url);
    $('#qrCode').textContent = formatCode(code);
    $('#qrUrl').textContent = url;
    this.app.openDialog($('#dlgQr'));
  }

  _renderNet(state, code = this.net.code) {
    const box = $('#linkCode');
    const startBtn = $('#btnNetStart');
    const form = $('#joinForm');
    const st = $('#linkNetState');
    if (state === 'off') { box.hidden = true; form.hidden = true; startBtn.hidden = false; return; }
    startBtn.hidden = state !== 'error';
    if (state === 'error') startBtn.lastChild.textContent = 'Réessayer la liaison réseau';
    box.hidden = state === 'error';
    form.hidden = state !== 'ready';
    if (code) {
      $('#linkCodeVal').textContent = formatCode(code);
      $('#qrBox').innerHTML = this._qrSvg(this.joinUrl(code));
    }
    const labels = { connecting: 'connexion au serveur…', ready: 'en ligne · prêt à relier', reconnecting: 'reconnexion…', error: 'hors ligne' };
    st.textContent = labels[state] || state;
    st.classList.toggle('is-ok', state === 'ready');
    st.classList.toggle('is-err', state === 'error');
    this.render();
  }

  render() {
    const list = [...this.peers.values()];
    const ul = $('#peers');
    ul.textContent = '';
    const openCount = this.list().length;
    for (const p of list) {
      const li = el('li', { class: 'peer', dataset: { state: p.state } },
        el('span', { class: 'peer__dot', 'aria-hidden': 'true' }),
        el('span', { class: 'peer__name', title: p.name }, p.name, ' ', el('span', { class: 'peer__via', text: `· ${VIA_LABEL[p.via]}${p.role === 'receiver' ? ' · récepteur' : p.role === 'sender' ? ' · émetteur' : ''}` })));
      if (openCount > 1) {
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
    this.app.ui.chip('Link', openCount ? 'on' : this.net.state === 'connecting' ? 'busy' : 'off', String(openCount));
    void escapeHtml;
  }
}
