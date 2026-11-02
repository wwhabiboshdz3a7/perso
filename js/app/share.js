// Partage de photos à la main.
// Émetteur : viser → poing (attraper) → la photo est « dans la main » et part
// en pré-envoi vers les appareils reliés. Récepteur : ouvrir la main devant sa
// caméra (lâcher) → la photo atterrit. Lancer = envoi direct dans une direction.

import { $, reducedMotion } from './dom.js';
import { resizeToJpeg } from './images.js';
import {
  encodePacket, decodePacket, chunkify, Assembler, sha256Hex, makeTransferId, CHUNK_SIZE, formatBytes,
} from '../core/protocol.js';

const CARRY_TIMEOUT = 90_000;
const INCOMING_TIMEOUT = 120_000;

export class Share {
  constructor(app) {
    this.app = app;
    this.carry = null;          // photo tenue par cet appareil
    this.incoming = new Map();  // photos annoncées par les autres appareils
    this.pendingLand = null;    // main ouverte avant la fin du transfert
    this.lastSent = null;
    this.lastReceived = null;
    this.carryEl = $('#carry');
    this.carryImg = $('#carryImg');
    this.carryRing = $('#carryRing');
    this._bind();
  }

  _bind() {
    const link = this.app.link;
    link.on('ctrl', ({ from, msg, peer }) => this._onCtrl(from, msg, peer));
    link.on('bin', ({ from, buf }) => this._onBin(from, buf));
    link.on('change', ({ key, state, isNew }) => {
      if (state === 'open' && isNew && this.carry?.prepared) this._offerTo(key);
      if (state === 'gone') this._peerGone(key);
    });
    $('#btnCarrySend').addEventListener('click', () => this.throwCarry('right'));
    $('#btnCarryDrop').addEventListener('click', () => this.putBack());
    $('#btnReceive').addEventListener('click', () => this.receiveHere());
  }

  get role() { return this.app.settings.get('role'); }

  // ——— Émetteur ———————————————————————————————————————————————

  /** Geste « attraper » (poing) à l'endroit du curseur. */
  async grab(ev) {
    if (this.carry) return false;
    const id = this.app.gallery.photoUnderCursor();
    if (!id) return false;
    if (this.role === 'receiver') {
      this.app.ui.toast('Mode récepteur', 'Cet appareil ne fait que recevoir. Changez le rôle dans les réglages.', { kind: 'warn' });
      return false;
    }
    const rec = this.app.gallery.get(id);
    if (!rec) return false;
    const tid = makeTransferId();
    this.carry = { tid, photoId: id, name: rec.name, startedAt: Date.now(), prepared: null, progress: new Map(), claimedBy: null, offered: new Set() };
    this.app.sound.play('grab');
    this.app.ui.log('geste', `photo attrapée : ${rec.name}`);
    const screen = this.app.cursor.screen || this.app.mapToScreen({ x: ev.x, y: ev.y });
    this._flyIntoHand(id, screen);
    this.app.gallery.markGrabbed(id, true);
    this._showCarryBar(rec);
    this.app.fx.burst(screen.x, screen.y, { color: '#ffb547', count: 48, inward: true, radius: 120, speed: 300, life: 0.5 });
    this.app.fx.ring(screen.x, screen.y, { r0: 140, r1: 20, color: '#ffb547', dur: 0.45 });
    clearTimeout(this._carryTimer);
    this._carryTimer = setTimeout(() => { if (this.carry?.tid === tid) this.putBack('Délai dépassé : photo reposée.'); }, CARRY_TIMEOUT);

    try {
      const prepared = await this._prepare(rec);
      if (this.carry?.tid !== tid) return true;
      this.carry.prepared = prepared;
      for (const p of this.app.link.list()) this._offerTo(p.key);
      if (this.carry.pendingThrow) this.throwCarry(this.carry.pendingThrow);
    } catch (err) {
      console.warn('[jarvis] préparation :', err);
      this.app.ui.toast('Préparation impossible', 'La photo n’a pas pu être préparée pour l’envoi.', { kind: 'error' });
      this._endCarry();
    }
    return true;
  }

  async _prepare(rec) {
    const { blob, width, height } = await resizeToJpeg(rec.blob, 2560, 0.9);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const hash = await sha256Hex(bytes);
    const { blob: tb } = await resizeToJpeg(rec.thumb || rec.blob, 200, 0.7);
    const thumb = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(tb); });
    return { bytes, hash, width, height, size: bytes.byteLength, name: rec.name, mime: 'image/jpeg', thumb };
  }

  /** Annonce la photo tenue à un appareil et lui pré-envoie les données. */
  async _offerTo(key) {
    const c = this.carry;
    if (!c?.prepared || c.offered.has(key)) return;
    const peer = this.app.link.peers.get(key);
    if (peer && peer.role === 'sender') return;
    c.offered.add(key);
    const p = c.prepared;
    const from = this.app.settings.get('deviceName');
    this.app.link.send(key, { type: 'grab', tid: c.tid, name: p.name, width: p.width, height: p.height, size: p.size, thumb: p.thumb, from });
    await this._stream(key, c.tid, p);
  }

  async _stream(key, tid, p) {
    const chunks = chunkify(p.bytes, CHUNK_SIZE);
    this.app.link.send(key, { type: 'file-begin', tid, size: p.size, chunks: chunks.length, hash: p.hash, name: p.name, width: p.width, height: p.height, mime: p.mime });
    try {
      for (let i = 0; i < chunks.length; i++) {
        if (this.carry?.tid === tid && this.carry.cancelled) return;
        await this.app.link.sendBin(key, encodePacket({ t: 'chunk', tid, i, n: chunks.length }, chunks[i]));
        if (this.carry?.tid === tid) {
          this.carry.progress.set(key, (i + 1) / chunks.length);
          this._renderCarryProgress();
        }
        if (i % 4 === 3) await new Promise((r) => setTimeout(r, 0));
      }
      this.app.link.send(key, { type: 'file-end', tid });
    } catch (err) {
      console.warn('[jarvis] envoi :', err);
    }
  }

  _renderCarryProgress() {
    if (!this.carry) return;
    const vals = [...this.carry.progress.values()];
    const p = vals.length ? Math.max(...vals) : 0;
    $('#carryProg').style.width = `${(p * 100).toFixed(0)}%`;
    this.carryRing.style.strokeDashoffset = String(351.86 * (1 - p));
  }

  /** Main ouverte sur CET appareil alors qu'il tient la photo : on la repose. */
  putBack(reason) {
    if (!this.carry) return;
    const c = this.carry;
    c.cancelled = true;
    this.app.link.send(null, { type: 'cancel', tid: c.tid });
    const card = this.app.gallery.cardEl(c.photoId);
    if (card && this.app.cursor.screen && !reducedMotion()) this._flyBack(card);
    this.app.sound.play('release');
    this.app.ui.log('geste', reason || `photo reposée : ${c.name}`);
    if (reason) this.app.ui.toast('Photo reposée', reason, { kind: 'warn', sound: false });
    this._endCarry();
  }

  /** Lancer : envoi direct aux appareils situés dans la direction du geste. */
  throwCarry(direction = 'right') {
    const c = this.carry;
    if (!c) return;
    const peers = this.app.link.list().filter((p) => p.role !== 'sender');
    if (!peers.length) {
      this.app.ui.toast('Aucun appareil relié', 'Reliez un appareil (panneau Liaison) pour y lancer la photo.', { kind: 'warn' });
      this.putBack();
      return;
    }
    if (!c.prepared) { c.pendingThrow = direction; return; }
    let targets = peers.filter((p) => p.position === direction);
    if (!targets.length) targets = peers.length === 1 ? peers : peers.filter((p) => p.position === 'auto');
    if (!targets.length) targets = peers;
    c.thrown = true;
    for (const t of targets) {
      this._offerTo(t.key);
      this.app.link.send(t.key, { type: 'throw', tid: c.tid, direction, from: this.app.settings.get('deviceName') });
    }
    this.app.sound.play('throw');
    this.app.ui.log('geste', `photo lancée (${direction}) vers ${targets.map((t) => t.name).join(', ')}`);
    this._flyAway(direction);
    $('#carryTitle').textContent = 'Photo lancée';
    $('#carryHint').textContent = `En route vers ${targets.map((t) => t.name).join(', ')}…`;
  }

  /** Bouton « Envoyer » ou commande vocale. */
  async sendPhoto(id) {
    const gal = this.app.gallery;
    if (this.carry) { this.throwCarry('right'); return; }
    const photoId = id || gal.viewerId || gal.visible()[0]?.id;
    if (!photoId) { this.app.ui.toast('Aucune photo', 'La galerie est vide.', { kind: 'warn' }); return; }
    if (!this.app.link.list().length) {
      this.app.ui.toast('Aucun appareil relié', 'Ouvrez JARVIS sur un autre appareil puis reliez-le (panneau Liaison).', { kind: 'warn' });
      $('#btnNetStart')?.focus();
      return;
    }
    const rec = gal.get(photoId);
    const tid = makeTransferId();
    this.carry = { tid, photoId, name: rec.name, startedAt: Date.now(), prepared: null, progress: new Map(), offered: new Set(), viaButton: true };
    gal.markGrabbed(photoId, true);
    this._showCarryBar(rec);
    this.carry.prepared = await this._prepare(rec);
    if (this.carry?.tid !== tid) return;
    this.throwCarry('right');
  }

  _onClaim(from, tid) {
    const c = this.carry;
    if (!c || c.tid !== tid || c.claimedBy) return;
    c.claimedBy = from;
    const peer = this.app.link.peers.get(from);
    for (const p of this.app.link.list()) if (p.key !== from) this.app.link.send(p.key, { type: 'taken', tid, by: peer?.name || '' });
    this.app.ui.log('liaison', `photo lâchée sur ${peer?.name || 'un appareil'}`);
    this._teleport();
    $('#carryTitle').textContent = 'Photo lâchée';
    $('#carryHint').textContent = `Atterrissage sur ${peer?.name || 'l’autre appareil'}…`;
    this._claimTimer = setTimeout(() => this._endCarry(), 15000);
  }

  _onReceived(from, msg) {
    const c = this.carry;
    const peer = this.app.link.peers.get(from);
    const ok = c && c.prepared && msg.hash === c.prepared.hash;
    if (c && c.tid === msg.tid) {
      this.lastSent = { tid: c.tid, hash: c.prepared?.hash, width: c.prepared?.width, height: c.prepared?.height, size: c.prepared?.size, to: peer?.name, verified: ok };
      this.app.ui.toast('Photo livrée', `${c.name} → ${peer?.name || 'appareil relié'}${ok ? ' · intégrité vérifiée' : ''}`, { kind: 'ok', sound: 'ok' });
      this.app.ui.log('liaison', `livrée à ${peer?.name || '?'} (${formatBytes(c.prepared?.size || 0)}, SHA-256 ${ok ? 'identique' : 'différent'})`);
      clearTimeout(this._claimTimer);
      this._endCarry();
    }
  }

  _peerGone(key) {
    for (const [tid, inc] of this.incoming) if (inc.from === key) { this.incoming.delete(tid); }
    this._renderIncoming();
  }

  _endCarry() {
    const c = this.carry;
    if (!c) return;
    clearTimeout(this._carryTimer);
    this.app.gallery.markGrabbed(c.photoId, false);
    this.carry = null;
    this.carryEl.classList.remove('is-on');
    this.carryEl.style.opacity = '';
    $('#carryBar').hidden = true;
    this.carryRing.style.strokeDashoffset = '';
  }

  _showCarryBar(rec) {
    const bar = $('#carryBar');
    const url = this.app.gallery.url(rec);
    $('#carryThumb').style.backgroundImage = `url("${url}")`;
    this.carryImg.style.backgroundImage = `url("${url}")`;
    $('#carryTitle').textContent = `En main : ${rec.name}`;
    const peers = this.app.link.list().length;
    $('#carryHint').textContent = peers
      ? `Ouvrez la main devant l’autre appareil, ou lancez-la. Ouvrir la main ici la repose.`
      : 'Aucun appareil relié pour l’instant : reliez-en un, ou ouvrez la main pour la reposer.';
    $('#carryProg').style.width = '0%';
    bar.hidden = false;
  }

  /** Suivi de la main à chaque image (position de la photo tenue). */
  onFrame() {
    if (!this.carry || this.carry.thrown || this.carry.claimedBy) return;
    const s = this.app.cursor.screen;
    if (s) {
      this.carryEl.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) scale(1)`;
      this.carryEl.classList.add('is-on');
    } else {
      this.carryEl.classList.remove('is-on');
    }
  }

  // ——— Récepteur ———————————————————————————————————————————————

  _onCtrl(from, msg, peer) {
    switch (msg.type) {
      case 'grab': {
        if (this.role === 'sender') return;
        const inc = this._incoming(from, msg.tid);
        Object.assign(inc, { name: String(msg.name || 'Photo').slice(0, 80), width: msg.width, height: msg.height, size: msg.size, fromName: msg.from || peer?.name || 'Appareil', announced: true });
        if (typeof msg.thumb === 'string' && msg.thumb.startsWith('data:image/') && msg.thumb.length < 200_000) inc.thumb = msg.thumb;
        if (!inc.toasted) {
          inc.toasted = true;
          this.app.sound.play('notify');
          this.app.ui.log('liaison', `${inc.fromName} tient une photo : ${inc.name}`);
        }
        this._renderIncoming();
        break;
      }
      case 'file-begin': {
        if (this.role === 'sender') return;
        const inc = this._incoming(from, msg.tid);
        if (!Number.isInteger(msg.chunks) || msg.chunks < 1 || msg.chunks > 4000 || !(msg.size > 0) || msg.size > 60 * 1024 * 1024) return;
        inc.asm = new Assembler({ size: msg.size, chunks: msg.chunks });
        Object.assign(inc, { hash: String(msg.hash || ''), name: inc.name || String(msg.name || 'Photo').slice(0, 80), width: msg.width, height: msg.height, mime: 'image/jpeg' });
        for (const [i, data] of inc.early || []) inc.asm.add(i, data);
        inc.early = null;
        this._checkComplete(msg.tid);
        break;
      }
      case 'file-end':
        this._checkComplete(msg.tid);
        break;
      case 'throw': {
        if (this.role === 'sender') return;
        const inc = this._incoming(from, msg.tid);
        inc.thrown = msg.direction || 'right';
        inc.fromName = msg.from || inc.fromName || peer?.name;
        if (this.app.settings.get('autoAccept')) this._claim(msg.tid, { thrown: true });
        else this._renderIncoming();
        break;
      }
      case 'cancel':
        if (this.incoming.has(msg.tid)) {
          const inc = this.incoming.get(msg.tid);
          this.incoming.delete(msg.tid);
          if (!inc.claimed) this.app.ui.log('liaison', `${inc.fromName || 'L’appareil'} a reposé la photo`);
          this._renderIncoming();
        }
        break;
      case 'taken':
        if (this.incoming.has(msg.tid)) {
          this.incoming.delete(msg.tid);
          this._renderIncoming();
          this.app.ui.toast('Photo récupérée ailleurs', msg.by ? `Lâchée sur ${String(msg.by).slice(0, 40)}.` : '', { sound: false });
        }
        break;
      case 'claim':
        this._onClaim(from, msg.tid);
        break;
      case 'received':
        this._onReceived(from, msg);
        break;
      default:
        break;
    }
  }

  _incoming(from, tid) {
    let inc = this.incoming.get(tid);
    if (!inc) {
      inc = { tid, from, at: Date.now(), asm: null, early: [], ready: false, claimed: false };
      this.incoming.set(tid, inc);
      setTimeout(() => { if (this.incoming.get(tid) === inc && !inc.claimed) { this.incoming.delete(tid); this._renderIncoming(); } }, INCOMING_TIMEOUT);
    }
    return inc;
  }

  _onBin(from, buf) {
    let pkt;
    try { pkt = decodePacket(buf); } catch { return; }
    const h = pkt.header;
    if (h.t !== 'chunk' || typeof h.tid !== 'string') return;
    const inc = this.incoming.get(h.tid);
    if (!inc || inc.from !== from) return;
    try {
      if (!inc.asm) { if (inc.early.length < 4000) inc.early.push([h.i, pkt.payload]); return; }
      inc.asm.add(h.i, pkt.payload);
    } catch { return; }
    this._renderIncomingProgress(inc);
    this._checkComplete(h.tid);
  }

  async _checkComplete(tid) {
    const inc = this.incoming.get(tid);
    if (!inc?.asm || !inc.asm.complete || inc.ready || inc.verifying) return;
    inc.verifying = true;
    const bytes = inc.asm.assemble();
    const hash = await sha256Hex(bytes);
    inc.verifying = false;
    if (inc.hash && hash !== inc.hash) {
      this.app.ui.toast('Transfert corrompu', 'L’empreinte de la photo ne correspond pas : elle a été ignorée.', { kind: 'error' });
      this.incoming.delete(tid);
      this._renderIncoming();
      return;
    }
    inc.bytes = bytes;
    inc.receivedHash = hash;
    inc.ready = true;
    this._renderIncomingProgress(inc);
    if (inc.claimed) this._land(tid);
  }

  /** Photo la plus récente en attente (non réclamée). */
  _latestIncoming() {
    let best = null;
    for (const inc of this.incoming.values()) if (!inc.claimed && inc.announced !== false && (!best || inc.at > best.at)) best = inc;
    return best;
  }

  hasIncoming() { return !!this._latestIncoming(); }

  /** Geste « lâcher » (poing → main ouverte) sur cet appareil. */
  release(ev) {
    if (this.carry && !this.carry.thrown && !this.carry.claimedBy) {
      if (ev?.thrown) this.throwCarry(ev.direction);
      else this.putBack();
      return true;
    }
    const inc = this._latestIncoming();
    if (inc) {
      this._claim(inc.tid, { at: this.app.cursor.screen || (ev ? this.app.mapToScreen({ x: ev.x, y: ev.y }) : null) });
      return true;
    }
    return false;
  }

  receiveHere() {
    const inc = this._latestIncoming();
    if (inc) this._claim(inc.tid, {});
  }

  _claim(tid, o = {}) {
    const inc = this.incoming.get(tid);
    if (!inc || inc.claimed) return;
    inc.claimed = true;
    inc.landAt = o.at || null;
    this.app.link.send(inc.from, { type: 'claim', tid });
    this.app.ui.log('geste', `photo lâchée ici : ${inc.name || 'photo'}`);
    if (!inc.ready) {
      $('#incomingFrom').textContent = 'Réception en cours';
      this._renderIncoming();
    } else {
      this._land(tid);
    }
  }

  async _land(tid) {
    const inc = this.incoming.get(tid);
    if (!inc || !inc.ready || inc.landed) return;
    inc.landed = true;
    this.incoming.delete(tid);
    this._renderIncoming();
    const blob = new Blob([inc.bytes], { type: 'image/jpeg' });
    const fromName = inc.fromName || this.app.link.peers.get(inc.from)?.name || 'appareil relié';
    this.app.link.send(inc.from, { type: 'received', tid, hash: inc.receivedHash });
    if (this.app.mode !== 'galerie') this.app.setMode('galerie');
    this.app.gallery.close();
    // La photo est enregistrée tout de suite ; sa vignette n'apparaît qu'à la
    // fin de l'animation d'atterrissage.
    const landing = this._landingAnimation(blob, inc);
    const gal = this.app.gallery;
    const rec = await gal.add(blob, { name: inc.name || 'Photo reçue', source: 'reçue', from: fromName, width: inc.width, height: inc.height, hash: inc.receivedHash });
    gal.cardEl(rec.id)?.classList.add('is-arriving');
    inc.recId = rec.id;
    this.lastReceived = { tid, id: rec.id, hash: inc.receivedHash, width: rec.width, height: rec.height, size: blob.size, from: fromName };
    this.app.ui.log('liaison', `photo reçue de ${fromName} (${rec.width}×${rec.height}, ${formatBytes(blob.size)})`);
    this.app.bus.emit('share:received', this.lastReceived);
    await landing;
    const card = gal.cardEl(rec.id);
    if (card?.classList.contains('is-arriving')) {
      card.classList.remove('is-arriving', 'is-new');
      void card.offsetWidth;
      card.classList.add('is-new');
    }
    this.app.ui.toast('Photo reçue', `${rec.name} · de ${fromName}`, { kind: 'ok', sound: false });
  }

  _renderIncoming() {
    const box = $('#incoming');
    const inc = this._latestIncoming() || [...this.incoming.values()].find((i) => i.claimed && !i.landed);
    if (!inc) { box.hidden = true; return; }
    box.hidden = false;
    $('#incomingThumb').style.backgroundImage = inc.thumb ? `url("${inc.thumb}")` : '';
    $('#incomingFrom').textContent = inc.claimed ? `Réception de ${inc.fromName || 'l’appareil relié'}` : `${inc.thrown ? 'Photo lancée' : 'Photo en approche'} · ${inc.fromName || 'appareil relié'}`;
    box.querySelector('.incoming__title').textContent = inc.claimed
      ? 'Atterrissage dès la fin du transfert…'
      : 'Ouvrez la main devant la caméra pour la lâcher ici';
    $('#btnReceive').hidden = inc.claimed;
    this._renderIncomingProgress(inc);
  }

  _renderIncomingProgress(inc) {
    const p = inc.asm ? inc.asm.progress : 0;
    $('#incomingProg').style.width = `${(p * 100).toFixed(0)}%`;
  }

  // ——— Animations ———————————————————————————————————————————————

  _flyIntoHand(id, to) {
    const card = this.app.gallery.cardEl(id);
    const img = card?.querySelector('img');
    if (!img || reducedMotion()) return;
    const r = img.getBoundingClientRect();
    const ghost = img.cloneNode();
    Object.assign(ghost.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, objectFit: 'cover', zIndex: 86, pointerEvents: 'none', boxShadow: '0 0 0 2px #ffb547, 0 0 40px rgba(255,181,71,.5)' });
    document.body.append(ghost);
    const dx = to.x - (r.left + r.width / 2), dy = to.y - (r.top + r.height / 2);
    const s = 76 / Math.max(r.width, r.height);
    ghost.animate([
      { transform: 'translate(0,0) scale(1)', borderRadius: '0%', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, borderRadius: '50%', opacity: 0.9 },
    ], { duration: 420, easing: 'cubic-bezier(.5,0,.2,1)' }).onfinish = () => ghost.remove();
    this.carryEl.style.transform = `translate3d(${to.x}px, ${to.y}px, 0)`;
    setTimeout(() => this.carryEl.classList.add('is-on'), 300);
  }

  _flyBack(card) {
    const img = card.querySelector('img');
    const from = this.app.cursor.screen;
    if (!img || !from) return;
    const r = img.getBoundingClientRect();
    const ghost = img.cloneNode();
    Object.assign(ghost.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, objectFit: 'cover', zIndex: 86, pointerEvents: 'none' });
    document.body.append(ghost);
    const dx = from.x - (r.left + r.width / 2), dy = from.y - (r.top + r.height / 2);
    const s = 76 / Math.max(r.width, r.height);
    ghost.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, borderRadius: '50%' },
      { transform: 'translate(0,0) scale(1)', borderRadius: '0%' },
    ], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => ghost.remove();
  }

  _flyAway(direction) {
    const el = this.carryEl;
    const s = this.app.cursor.screen || { x: innerWidth / 2, y: innerHeight / 2 };
    const d = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] }[direction] || [1, 0];
    const tx = s.x + d[0] * innerWidth, ty = s.y + d[1] * innerHeight;
    this.app.fx.burst(s.x, s.y, { color: '#ffb547', count: 30, speed: 420 });
    if (reducedMotion()) { el.classList.remove('is-on'); return; }
    el.animate([
      { transform: `translate3d(${s.x}px, ${s.y}px, 0) scale(1)`, opacity: 1 },
      { transform: `translate3d(${tx}px, ${ty}px, 0) scale(.6)`, opacity: 0 },
    ], { duration: 520, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).onfinish = () => { el.classList.remove('is-on'); el.getAnimations().forEach((a) => a.cancel()); };
  }

  _teleport() {
    const s = this.app.cursor.screen;
    const el = this.carryEl;
    if (s) {
      this.app.fx.burst(s.x, s.y, { color: '#6ee7ff', count: 60, speed: 380 });
      this.app.fx.ring(s.x, s.y, { r0: 20, r1: 200, color: '#6ee7ff' });
    }
    el.classList.remove('is-on');
    this.app.sound.play('throw');
  }

  async _landingAnimation(blob, inc) {
    const url = URL.createObjectURL(blob);
    const stage = $('#stage').getBoundingClientRect();
    const cx = stage.left + stage.width / 2, cy = stage.top + stage.height / 2;
    let start = inc.landAt;
    if (inc.thrown) {
      const from = { right: [-1, 0], left: [1, 0], up: [0, 1], down: [0, -1] }[inc.thrown] || [-1, 0];
      start = { x: cx + from[0] * (stage.width / 2 + 200), y: cy + from[1] * (stage.height / 2 + 200) };
    }
    start = start || { x: cx, y: cy };
    this.app.sound.play('land');
    if (reducedMotion()) { URL.revokeObjectURL(url); return; }
    const maxW = Math.min(stage.width * 0.62, 760), maxH = stage.height * 0.62;
    const ratio = (inc.width || 4) / (inc.height || 3);
    const w = Math.min(maxW, maxH * ratio), h = w / ratio;
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    Object.assign(img.style, { position: 'fixed', left: `${cx - w / 2}px`, top: `${cy - h / 2}px`, width: `${w}px`, height: `${h}px`, objectFit: 'cover', zIndex: 86, pointerEvents: 'none', boxShadow: '0 0 0 1px rgba(110,231,255,.8), 0 0 80px rgba(110,231,255,.35)' });
    document.body.append(img);
    const dx = start.x - cx, dy = start.y - cy;
    await img.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(.12) rotate(-8deg)`, opacity: 0, filter: 'brightness(3)' },
      { transform: 'translate(0,0) scale(1.04) rotate(0)', opacity: 1, filter: 'brightness(1.4)', offset: 0.7 },
      { transform: 'translate(0,0) scale(1)', opacity: 1, filter: 'brightness(1)' },
    ], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' }).finished.catch(() => {});
    this.app.fx.ring(cx, cy, { r0: Math.max(w, h) * 0.4, r1: Math.max(w, h) * 0.9, color: '#6ee7ff', dur: 0.8, width: 3 });
    this.app.fx.burst(cx, cy, { color: '#6ee7ff', count: 70, speed: 520 });
    await new Promise((r) => setTimeout(r, 700));
    // Vol final vers la vignette (si elle est déjà en place), sinon vers le haut de la grille.
    const slot = inc.recId ? this.app.gallery.cardEl(inc.recId)?.querySelector('.photo__img')?.getBoundingClientRect() : null;
    const grid = $('#photoGrid').getBoundingClientRect();
    const tx = slot ? slot.left + slot.width / 2 : grid.left + 100;
    const ty = slot ? slot.top + slot.height / 2 : grid.top + 70;
    const ts = slot ? Math.max(slot.width / w, slot.height / h) : 200 / w;
    await img.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${tx - cx}px, ${ty - cy}px) scale(${ts})`, opacity: 0.35 },
    ], { duration: 520, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }).finished.catch(() => {});
    img.remove();
    URL.revokeObjectURL(url);
  }
}
