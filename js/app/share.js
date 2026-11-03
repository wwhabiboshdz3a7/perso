// Partage de photos à la main.
// Émetteur : viser → poing (attraper) → la photo est « dans la main » et part
// en pré-envoi vers les appareils reliés. Récepteur : ouvrir la main devant sa
// caméra (lâcher) → l'émetteur confirme → la photo atterrit. Lancer = envoi
// direct dans une direction.

import { $, reducedMotion } from './dom.js';
import { resizeToJpeg } from './images.js';
import {
  encodePacket, decodePacket, chunkify, Assembler, sha256Hex, makeTransferId, CHUNK_SIZE, formatBytes,
  validThumb, validDim, sniffImage,
} from '../core/protocol.js';

const CARRY_TIMEOUT = 90_000;
const INCOMING_TIMEOUT = 120_000;
const GRANT_TIMEOUT = 12_000;          // confirmation de l'émetteur après un lâcher
const MAX_SIZE = 60 * 1024 * 1024;
// Limites par appareil relié (sur 10 minutes glissantes).
const QUOTA_WINDOW = 10 * 60_000;
const QUOTA_COUNT = 40;
const QUOTA_BYTES = 400 * 1024 * 1024;
const MAX_PENDING_PER_PEER = 3;
const DIR_WORD = { right: 'vers la droite', left: 'vers la gauche', up: 'vers le haut', down: 'vers le bas' };

const cleanText = (v, fallback, max = 80) => {
  const s = typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim() : '';
  return (s || fallback).slice(0, max);
};

export class Share {
  constructor(app) {
    this.app = app;
    this.carry = null;          // photo tenue par cet appareil
    this.incoming = new Map();  // photos annoncées par les autres appareils
    this.quotas = new Map();
    this.lastSent = null;
    this.lastReceived = null;
    this.carryTimeout = CARRY_TIMEOUT;
    this.carryEl = $('#carry');
    this.carryImg = $('#carryImg');
    this.carryRing = $('#carryRing');
    this._bind();
  }

  _bind() {
    const link = this.app.link;
    link.on('ctrl', ({ from, msg, peer }) => this._onCtrl(from, msg, peer));
    link.on('bin', ({ from, buf }) => this._onBin(from, buf));
    link.on('change', ({ key, state, isNew, name }) => {
      if (state === 'open' && isNew && this.carry?.prepared && !this.carry.thrown && !this.carry.claimedBy) this._offerTo(key);
      if (state === 'gone') this._peerGone(key, name);
    });
    $('#btnCarrySend').addEventListener('click', () => this.throwCarry('right'));
    $('#btnCarryDrop').addEventListener('click', () => this.putBack());
    $('#btnReceive').addEventListener('click', () => this.receiveHere());
  }

  get role() { return this.app.settings.get('role'); }

  // ——— Émetteur ———————————————————————————————————————————————

  _newCarry(rec, extra = {}) {
    const tid = makeTransferId();
    this.carry = { tid, photoId: rec.id, name: rec.name, startedAt: Date.now(), prepared: null, progress: new Map(), claimedBy: null, offered: new Set(), targets: null, ...extra };
    this.app.gallery.markGrabbed(rec.id, true);
    this._showCarryBar(rec);
    clearTimeout(this._carryTimer);
    this._carryTimer = setTimeout(() => { if (this.carry?.tid === tid && !this.carry.claimedBy) this.putBack('Délai dépassé : photo reposée.'); }, this.carryTimeout);
    return tid;
  }

  /** Préparation (redimensionnement, empreinte, vignette) ; false si la photo est illisible. */
  async _prepareCarry(tid, rec) {
    try {
      const prepared = await this._prepare(rec);
      if (this.carry?.tid !== tid) return false;
      this.carry.prepared = prepared;
      return true;
    } catch (err) {
      if (!/illisible/i.test(err?.message || '')) console.warn('[jarvis] préparation :', err);
      if (this.carry?.tid === tid) {
        this.app.ui.toast('Envoi impossible', `« ${rec.name} » est illisible : elle ne peut pas être partagée.`, { kind: 'error' });
        this.app.ui.log('liaison', `photo illisible, non partagée : ${rec.name}`);
        this._endCarry();
      }
      return false;
    }
  }

  /** Geste « attraper » (poing) à l'endroit du curseur. */
  async grab(ev) {
    if (this.carry) return false;
    // Une photo arrive d'un autre appareil : le poing la « tient », il n'attrape rien ici.
    if (this.hasIncoming()) return false;
    const id = this.app.gallery.photoUnderCursor();
    if (!id) return false;
    if (this.role === 'receiver') {
      this.app.ui.toast('Mode récepteur', 'Cet appareil ne fait que recevoir. Changez le rôle dans les réglages.', { kind: 'warn' });
      return false;
    }
    const rec = this.app.gallery.get(id);
    if (!rec) return false;
    const tid = this._newCarry(rec);
    this.app.sound.play('grab');
    this.app.ui.log('geste', `photo attrapée : ${rec.name}`);
    const screen = this.app.cursor.screen || this.app.mapToScreen({ x: ev.x, y: ev.y });
    this._flyIntoHand(id, screen);
    this.app.fx.burst(screen.x, screen.y, { color: '#ffb547', count: 48, inward: true, radius: 120, speed: 300, life: 0.5 });
    this.app.fx.ring(screen.x, screen.y, { r0: 140, r1: 20, color: '#ffb547', dur: 0.45 });
    if (!(await this._prepareCarry(tid, rec))) return true;
    for (const p of this.app.link.list()) this._offerTo(p.key);
    if (this.carry.pendingThrow) this.throwCarry(this.carry.pendingThrow);
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
        if (this.carry?.tid !== tid || this.carry.cancelled) return;
        await this.app.link.sendBin(key, encodePacket({ t: 'chunk', tid, i, n: chunks.length }, chunks[i]));
        if (this.carry?.tid === tid) {
          this.carry.progress.set(key, (i + 1) / chunks.length);
          this._renderCarryProgress();
        }
        if (i % 4 === 3) await new Promise((r) => setTimeout(r, 0));
      }
      this.app.link.send(key, { type: 'file-end', tid });
    } catch (err) {
      // Appareil parti pendant l'envoi : la liaison le signale déjà.
      if (!/déconnecté/.test(err?.message || '')) console.warn('[jarvis] envoi :', err);
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
  putBack(reason, { quiet = false } = {}) {
    if (!this.carry) return;
    const c = this.carry;
    c.cancelled = true;
    this.app.link.send(null, { type: 'cancel', tid: c.tid });
    const card = this.app.gallery.cardEl(c.photoId);
    if (!quiet) {
      if (card && this.app.cursor.screen && !reducedMotion()) this._flyBack(card);
      this.app.sound.play('release');
    }
    this.app.ui.log('geste', reason || `photo reposée : ${c.name}`);
    if (reason) this.app.ui.toast('Photo reposée', reason, { kind: 'warn', sound: false });
    this._endCarry();
  }

  /** Lancer : envoi direct aux appareils situés dans la direction du geste. */
  throwCarry(direction = 'right') {
    const c = this.carry;
    if (!c || c.thrown || c.claimedBy) return;
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
    c.targets = new Set(targets.map((t) => t.key));
    for (const t of targets) {
      this._offerTo(t.key);
      this.app.link.send(t.key, { type: 'throw', tid: c.tid, direction, from: this.app.settings.get('deviceName') });
    }
    const names = targets.map((t) => t.name).join(', ');
    this.app.sound.play('throw');
    this.app.ui.log('geste', `photo lancée ${DIR_WORD[direction] || ''} → ${names}`.replace(/\s+/g, ' '));
    this._flyAway(direction);
    $('#carryTitle').textContent = 'Photo lancée';
    $('#carryHint').textContent = `En route vers ${names}…`;
  }

  /**
   * Bouton « Envoyer » ou commande vocale. Si une autre photo est déjà en
   * main, elle est reposée et c'est la photo demandée qui part.
   * @returns {Promise<boolean>} true si l'envoi est lancé
   */
  async sendPhoto(id) {
    const gal = this.app.gallery;
    const photoId = id || this.carry?.photoId || gal.viewerId || gal.visible()[0]?.id;
    if (this.carry) {
      if (photoId === this.carry.photoId) {
        if (this.carry.thrown || this.carry.claimedBy) return true;
        this.throwCarry('right');
        return !!this.carry?.thrown || !!this.carry?.pendingThrow;
      }
      if (this.carry.thrown || this.carry.claimedBy) {
        this.app.ui.toast('Envoi en cours', 'Attendez que la photo précédente soit arrivée.', { kind: 'warn' });
        return false;
      }
      this.putBack(null, { quiet: true });
    }
    if (!photoId) { this.app.ui.toast('Aucune photo', 'La galerie est vide.', { kind: 'warn' }); return false; }
    if (!this.app.link.list().some((p) => p.role !== 'sender')) {
      this.app.ui.toast('Aucun appareil relié', 'Ouvrez JARVIS sur un autre appareil puis reliez-le (panneau Liaison).', { kind: 'warn' });
      $('#btnNetStart')?.focus();
      return false;
    }
    if (this.role === 'receiver') {
      this.app.ui.toast('Mode récepteur', 'Cet appareil ne fait que recevoir. Changez le rôle dans les réglages.', { kind: 'warn' });
      return false;
    }
    const rec = gal.get(photoId);
    if (!rec) return false;
    const tid = this._newCarry(rec, { viaButton: true });
    if (!(await this._prepareCarry(tid, rec))) return false;
    this.throwCarry('right');
    return this.carry?.tid === tid && !!this.carry.thrown;
  }

  /** Un récepteur a ouvert la main : le premier qui réclame la photo l'obtient. */
  _onClaim(from, tid) {
    const c = this.carry;
    const peer = this.app.link.peers.get(from);
    if (!c || c.tid !== tid || c.cancelled) { this.app.link.send(from, { type: 'denied', tid, by: '' }); return; }
    if (c.claimedBy && c.claimedBy !== from) {
      this.app.link.send(from, { type: 'denied', tid, by: this.app.link.peers.get(c.claimedBy)?.name || '' });
      return;
    }
    if (c.claimedBy === from) { this.app.link.send(from, { type: 'granted', tid }); return; }
    c.claimedBy = from;
    this.app.link.send(from, { type: 'granted', tid });
    for (const p of this.app.link.list()) if (p.key !== from) this.app.link.send(p.key, { type: 'taken', tid, by: peer?.name || '' });
    this.app.ui.log('liaison', `photo lâchée sur ${peer?.name || 'un appareil'}`);
    if (!c.thrown) this._teleport();
    $('#carryTitle').textContent = 'Photo lâchée';
    $('#carryHint').textContent = `Atterrissage sur ${peer?.name || 'l’autre appareil'}…`;
    clearTimeout(this._claimTimer);
    this._claimTimer = setTimeout(() => { if (this.carry?.tid === tid) this._endCarry(); }, 15000);
  }

  _onReceived(from, msg) {
    const c = this.carry;
    if (!c || c.tid !== msg.tid || (c.claimedBy && c.claimedBy !== from)) return;
    const peer = this.app.link.peers.get(from);
    const ok = !!c.prepared && msg.hash === c.prepared.hash;
    c.delivered = true;
    this.lastSent = { tid: c.tid, hash: c.prepared?.hash, width: c.prepared?.width, height: c.prepared?.height, size: c.prepared?.size, to: peer?.name, verified: ok };
    this.app.ui.toast('Photo livrée', `${c.name} → ${peer?.name || 'appareil relié'}${ok ? ' · intégrité vérifiée' : ''}`, { kind: 'ok', sound: 'ok' });
    this.app.ui.log('liaison', `livrée à ${peer?.name || '?'} (${formatBytes(c.prepared?.size || 0)}, SHA-256 ${ok ? 'identique' : 'différent'})`);
    clearTimeout(this._claimTimer);
    this._endCarry();
  }

  /** Appareil parti (fermé, en veille, déconnecté). */
  _peerGone(key, name = 'L’appareil') {
    for (const [tid, inc] of this.incoming) if (inc.from === key) { clearTimeout(inc.claimTimer); this.incoming.delete(tid); }
    this._renderIncoming();
    const c = this.carry;
    if (!c || c.delivered) return;
    c.offered.delete(key);
    c.progress.delete(key);
    c.targets?.delete(key);
    if (c.claimedBy === key) {
      this.putBack(`${name} s’est déconnecté avant la fin de l’envoi : la photo est restée ici.`);
    } else if (c.thrown && !c.claimedBy && c.targets && c.targets.size === 0) {
      this.putBack(`${name} ne répond plus : la photo est restée ici.`);
    }
  }

  /** Fenêtre fermée ou rechargée : la photo tenue est annulée chez les autres. */
  onPageHide() {
    if (this.carry && !this.carry.delivered) this.app.link.send(null, { type: 'cancel', tid: this.carry.tid });
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
      ? 'Ouvrez la main devant l’autre appareil, ou lancez-la. Ouvrir la main ici la repose.'
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

  _quota(from) {
    const now = Date.now();
    let q = this.quotas.get(from);
    if (!q || now - q.since > QUOTA_WINDOW) { q = { since: now, count: 0, bytes: 0, warned: false }; this.quotas.set(from, q); }
    return q;
  }

  /** Limite le nombre et le volume de photos acceptés d'un même appareil. */
  _allow(from, { count = 0, bytes = 0 } = {}) {
    const q = this._quota(from);
    if (q.count + count > QUOTA_COUNT || q.bytes + bytes > QUOTA_BYTES) {
      if (!q.warned) {
        q.warned = true;
        const name = this.app.link.peers.get(from)?.name || 'un appareil relié';
        this.app.ui.log('liaison', `trop de photos reçues de ${name} : réception suspendue quelques minutes`);
        this.app.ui.toast('Réception suspendue', `Trop de photos envoyées par ${name} en peu de temps.`, { kind: 'warn' });
      }
      return false;
    }
    q.count += count;
    q.bytes += bytes;
    return true;
  }

  _onCtrl(from, msg, peer) {
    switch (msg.type) {
      case 'grab': {
        if (this.role === 'sender') return;
        const inc = this._incoming(from, msg.tid);
        if (!inc) return;
        Object.assign(inc, {
          name: cleanText(msg.name, 'Photo'),
          width: validDim(msg.width),
          height: validDim(msg.height),
          fromName: cleanText(msg.from, peer?.name || 'Appareil', 40),
          announced: true,
        });
        if (validThumb(msg.thumb)) inc.thumb = msg.thumb;
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
        if (!inc || inc.asm) return;
        const { chunks, size } = msg;
        const valid = Number.isInteger(size) && size > 0 && size <= MAX_SIZE
          && Number.isInteger(chunks) && chunks === Math.ceil(size / CHUNK_SIZE)
          && typeof msg.hash === 'string' && /^[0-9a-f]{64}$/.test(msg.hash);
        if (!valid || !this._allow(from, { bytes: size })) { this._discard(msg.tid); return; }
        inc.asm = new Assembler({ size, chunks });
        Object.assign(inc, { hash: msg.hash, name: inc.name || cleanText(msg.name, 'Photo') });
        try {
          for (const [i, data] of inc.early || []) inc.asm.add(i, data);
        } catch { this._discard(msg.tid); return; }
        inc.early = null;
        this._checkComplete(msg.tid);
        break;
      }
      case 'file-end':
        if (this.incoming.get(msg.tid)?.from === from) this._checkComplete(msg.tid);
        break;
      case 'throw': {
        if (this.role === 'sender') return;
        const inc = this._incoming(from, msg.tid);
        if (!inc) return;
        inc.thrown = DIR_WORD[msg.direction] ? msg.direction : 'right';
        inc.fromName = cleanText(msg.from, inc.fromName || peer?.name || 'Appareil', 40);
        if (this.app.settings.get('autoAccept')) this._claim(msg.tid, { thrown: true });
        else this._renderIncoming();
        break;
      }
      case 'cancel': {
        const inc = this.incoming.get(msg.tid);
        if (inc && inc.from === from) {
          clearTimeout(inc.claimTimer);
          this.incoming.delete(msg.tid);
          if (!inc.landed) this.app.ui.log('liaison', `${inc.fromName || 'L’appareil'} a reposé la photo`);
          this._renderIncoming();
        }
        break;
      }
      case 'taken': {
        const inc = this.incoming.get(msg.tid);
        if (inc && inc.from === from) {
          this._discard(msg.tid);
          this.app.ui.toast('Photo déjà récupérée', msg.by ? `Lâchée sur ${cleanText(msg.by, '', 40)}.` : '', { sound: false });
        }
        break;
      }
      case 'granted': {
        const inc = this.incoming.get(msg.tid);
        if (!inc || inc.from !== from || !inc.claimed) return;
        inc.granted = true;
        clearTimeout(inc.claimTimer);
        if (inc.ready) this._land(msg.tid);
        else this._renderIncoming();
        break;
      }
      case 'denied': {
        const inc = this.incoming.get(msg.tid);
        if (!inc || inc.from !== from) return;
        this._discard(msg.tid);
        const by = cleanText(msg.by, '', 40);
        this.app.ui.toast('Photo déjà récupérée', by ? `${by} l’a attrapée en premier.` : 'L’autre appareil ne la propose plus.', { kind: 'warn', sound: false });
        break;
      }
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

  /** Entrée « photo en approche » ; null si l'annonce est refusée. */
  _incoming(from, tid) {
    let inc = this.incoming.get(tid);
    if (inc) return inc.from === from ? inc : null;
    let pending = 0;
    for (const i of this.incoming.values()) if (i.from === from) pending++;
    if (pending >= MAX_PENDING_PER_PEER || !this._allow(from, { count: 1 })) return null;
    inc = { tid, from, at: Date.now(), asm: null, early: [], earlyBytes: 0, ready: false, claimed: false, granted: false };
    this.incoming.set(tid, inc);
    setTimeout(() => { if (this.incoming.get(tid) === inc && !inc.claimed) { this.incoming.delete(tid); this._renderIncoming(); } }, INCOMING_TIMEOUT);
    return inc;
  }

  _discard(tid) {
    const inc = this.incoming.get(tid);
    if (!inc) return;
    clearTimeout(inc.claimTimer);
    this.incoming.delete(tid);
    this._renderIncoming();
  }

  _onBin(from, buf) {
    let pkt;
    try { pkt = decodePacket(buf); } catch { return; }
    const h = pkt.header;
    if (h?.t !== 'chunk' || typeof h.tid !== 'string') return;
    const inc = this.incoming.get(h.tid);
    if (!inc || inc.from !== from || inc.ready) return;
    const len = pkt.payload.byteLength;
    if (len > CHUNK_SIZE) { this._discard(h.tid); return; }
    try {
      if (!inc.asm) {
        // Morceaux arrivés avant l'annonce du fichier : tampon borné.
        if (inc.early.length < 4000 && inc.earlyBytes + len <= MAX_SIZE) { inc.early.push([h.i, pkt.payload]); inc.earlyBytes += len; }
        return;
      }
      if (inc.asm.bytes + len > inc.asm.size) throw new Error('trop d’octets');
      inc.asm.add(h.i, pkt.payload);
    } catch { this._discard(h.tid); return; }
    this._renderIncomingProgress(inc);
    this._checkComplete(h.tid);
  }

  async _checkComplete(tid) {
    const inc = this.incoming.get(tid);
    if (!inc?.asm || !inc.asm.complete || inc.ready || inc.verifying) return;
    inc.verifying = true;
    let bytes;
    try { bytes = inc.asm.assemble(); } catch { bytes = null; }
    const hash = bytes ? await sha256Hex(bytes) : '';
    if (!bytes || hash !== inc.hash) {
      this._reject(tid, 'Transfert corrompu', 'L’empreinte de la photo ne correspond pas : elle a été ignorée.');
      return;
    }
    // Seules de vraies images, décodables, sont acceptées ; leurs dimensions
    // viennent du décodage, jamais de l'annonce réseau.
    const type = sniffImage(bytes);
    const dims = type ? await this._decodeDims(new Blob([bytes], { type })) : null;
    if (this.incoming.get(tid) !== inc) return;
    inc.verifying = false;
    if (!dims) {
      this._reject(tid, 'Fichier refusé', `${inc.fromName || 'L’appareil relié'} a envoyé un fichier qui n’est pas une image valide.`);
      return;
    }
    Object.assign(inc, { bytes, type, receivedHash: hash, width: dims.width, height: dims.height, ready: true });
    this._renderIncomingProgress(inc);
    if (inc.claimed && inc.granted) this._land(tid);
  }

  async _decodeDims(blob) {
    try {
      const bmp = await createImageBitmap(blob);
      const d = { width: bmp.width, height: bmp.height };
      bmp.close?.();
      return validDim(d.width) && validDim(d.height) ? d : null;
    } catch {
      return null;
    }
  }

  _reject(tid, title, text) {
    const inc = this.incoming.get(tid);
    this._discard(tid);
    this.app.ui.toast(title, text, { kind: 'error' });
    this.app.ui.log('liaison', `${title.toLowerCase()} : ${inc?.name || 'photo'}`);
  }

  /** Photo la plus récente en attente (non réclamée). */
  _latestIncoming() {
    let best = null;
    for (const inc of this.incoming.values()) if (!inc.claimed && inc.announced && (!best || inc.at > best.at)) best = inc;
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

  /** Lâcher ici : on réclame la photo, l'atterrissage attend l'accord de l'émetteur. */
  _claim(tid, o = {}) {
    const inc = this.incoming.get(tid);
    if (!inc || inc.claimed) return;
    inc.claimed = true;
    inc.landAt = o.at || null;
    this.app.link.send(inc.from, { type: 'claim', tid });
    this.app.ui.log('geste', `photo lâchée ici : ${inc.name || 'photo'}`);
    clearTimeout(inc.claimTimer);
    inc.claimTimer = setTimeout(() => {
      if (this.incoming.get(tid) !== inc || inc.granted) return;
      this._discard(tid);
      this.app.ui.toast('Pas de confirmation', `${inc.fromName || 'L’appareil émetteur'} ne répond pas : la photo n’a pas été reçue.`, { kind: 'warn' });
    }, GRANT_TIMEOUT);
    this._renderIncoming();
  }

  async _land(tid) {
    const inc = this.incoming.get(tid);
    if (!inc || !inc.ready || !inc.granted || inc.landed) return;
    inc.landed = true;
    clearTimeout(inc.claimTimer);
    this.incoming.delete(tid);
    this._renderIncoming();
    const blob = new Blob([inc.bytes], { type: inc.type || 'image/jpeg' });
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
    // Vignette validée à la réception (data:image/… en base64 uniquement).
    $('#incomingThumb').style.backgroundImage = inc.thumb ? `url("${inc.thumb}")` : '';
    $('#incomingFrom').textContent = inc.claimed ? `Réception de ${inc.fromName || 'l’appareil relié'}` : `${inc.thrown ? 'Photo lancée' : 'Photo en approche'} · ${inc.fromName || 'appareil relié'}`;
    box.querySelector('.incoming__title').textContent = inc.claimed
      ? (inc.granted ? 'Atterrissage dès la fin du transfert…' : 'Confirmation de l’envoi…')
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
    const s = 76 / Math.max(r.width, r.height, 1);
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
    if (!r.width || !r.height) return;
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
    const ratio = inc.width && inc.height ? inc.width / inc.height : 4 / 3;
    const w = Math.max(40, Math.min(maxW, maxH * ratio)), h = w / ratio;
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
    const ts = slot && slot.width ? Math.max(slot.width / w, slot.height / h) : 200 / w;
    await img.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${tx - cx}px, ${ty - cy}px) scale(${ts})`, opacity: 0.35 },
    ], { duration: 520, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }).finished.catch(() => {});
    img.remove();
    URL.revokeObjectURL(url);
  }
}
