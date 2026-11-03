// Galerie : photos locales (IndexedDB), grille, visionneuse gestuelle
// (swipe, zoom/rotation à deux mains, pouce levé = favori).

import { $, el, icon, clamp, reducedMotion } from './dom.js';
import { db } from './db.js';
import { generateDemoImages, DEMO_COUNT, decodeImage, resizeToJpeg } from './images.js';
import { formatBytes } from '../core/protocol.js';

const SRC_LABEL = { démo: 'démo', import: 'importée', capture: 'capture', dessin: 'dessin', reçue: 'reçue' };

export class Gallery {
  constructor(app) {
    this.app = app;
    this.photos = [];
    this.urls = new Map();
    this.filter = 'all';
    this.viewerId = null;
    this.view = { scale: 1, rot: 0, tx: 0, ty: 0 };
    this.base = null;
    this.gridEl = $('#photoGrid');
    this.viewerEl = $('#viewer');
    this.viewerImg = $('#viewerImg');
    this.statsEl = $('#galStats');
    this._bind();
  }

  async init() {
    let list = [];
    try {
      list = await db.all('photos');
    } catch (err) {
      // Stockage indisponible (navigation privée stricte, ou base bloquée par
      // une autre fenêtre en cours de réinitialisation) : galerie en mémoire.
      this.storageError = true;
      console.info('[jarvis] IndexedDB indisponible :', err?.message || err);
      this.app.ui.toast('Stockage local indisponible', err?.blocked
        ? 'Une autre fenêtre JARVIS bloque la base de données : fermez-la, puis rechargez cette page.'
        : 'Les photos ne seront pas conservées après la fermeture de la page.', { kind: 'warn', ms: 9000 });
    }
    const seeded = this.storageError ? false : await db.meta('seeded').catch(() => false);
    if (!list.length && !seeded) {
      // Premier lancement : visuels de démonstration, affichés au fil de l'eau.
      this.seeding = DEMO_COUNT;
      this.render();
      const t0 = Date.now();
      await generateDemoImages(async (d, i) => {
        const rec = await this._record(d.blob, { name: d.name, source: 'démo', width: d.width, height: d.height, createdAt: t0 - i * 60000 });
        this.photos.push(rec);
        this.seeding = DEMO_COUNT - i - 1;
        this.render();
      });
      this.seeding = 0;
      if (!this.storageError) await db.meta('seeded', true).catch(() => {});
      list = this.photos;
    }
    this.photos = list.sort((a, b) => b.createdAt - a.createdAt);
    this.render();
    this.ready = true;
  }

  async _record(blob, meta) {
    const thumb = await this._thumb(blob);
    const rec = {
      id: meta.id || `ph-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: meta.name || 'Photo',
      blob,
      thumb,
      type: blob.type || 'image/jpeg',
      size: blob.size,
      width: Number.isInteger(meta.width) && meta.width > 0 ? meta.width : 0,
      height: Number.isInteger(meta.height) && meta.height > 0 ? meta.height : 0,
      createdAt: meta.createdAt || Date.now(),
      favorite: !!meta.favorite,
      source: meta.source || 'import',
      from: meta.from || '',
      hash: meta.hash || '',
    };
    if (!rec.width || !rec.height) {
      const img = await decodeImage(blob);
      rec.width = img.width; rec.height = img.height;
      img.close?.();
    }
    if (!this.storageError) {
      try { await db.put('photos', rec); } catch (err) { console.warn('[jarvis] enregistrement photo :', err); }
    }
    return rec;
  }

  async _thumb(blob) {
    try {
      const { blob: t } = await resizeToJpeg(blob, 520, 0.82);
      return t;
    } catch { return blob; }
  }

  /** Ajoute une photo (blob) à la galerie et l'affiche avec une animation. */
  async add(blob, meta = {}) {
    const rec = await this._record(blob, meta);
    this.photos.unshift(rec);
    this.render(rec.id);
    this.app.bus.emit('gallery:change', { added: rec });
    return rec;
  }

  async importFiles(files) {
    const images = [...files].filter((f) => f.type.startsWith('image/'));
    if (!images.length) { this.app.ui.toast('Aucune image', 'Seules les images peuvent être importées.', { kind: 'warn' }); return; }
    let n = 0;
    for (const f of images) {
      try {
        const { blob, width, height } = await resizeToJpeg(f, 3200, 0.92);
        await this.add(blob, { name: f.name.replace(/\.[a-z0-9]+$/i, ''), source: 'import', width, height });
        n++;
      } catch {
        this.app.ui.toast('Image ignorée', `${f.name} n’a pas pu être lue.`, { kind: 'warn' });
      }
    }
    if (n) {
      this.app.ui.toast(n > 1 ? `${n} photos importées` : 'Photo importée', 'Elles restent sur cet appareil.', { kind: 'ok' });
      this.app.ui.log('galerie', `${n} photo(s) importée(s)`);
    }
  }

  get(id) { return this.photos.find((p) => p.id === id) || null; }

  visible() {
    return this.filter === 'fav' ? this.photos.filter((p) => p.favorite) : this.photos;
  }

  url(rec, kind = 'thumb') {
    const key = `${rec.id}:${kind}`;
    if (!this.urls.has(key)) this.urls.set(key, URL.createObjectURL(kind === 'thumb' ? rec.thumb || rec.blob : rec.blob));
    return this.urls.get(key);
  }

  _revoke(id) {
    for (const k of [...this.urls.keys()]) if (k.startsWith(`${id}:`)) { URL.revokeObjectURL(this.urls.get(k)); this.urls.delete(k); }
  }

  render(newId) {
    const list = this.visible();
    this.gridEl.textContent = '';
    if (!list.length && !this.seeding) {
      this.gridEl.append(el('li', { class: 'grid-empty' }, this.filter === 'fav'
        ? 'Aucun favori pour l’instant. Ouvrez une photo et levez le pouce.'
        : 'Aucune photo. Importez-en, faites une capture (geste victoire) ou recevez-en une.'));
    }
    for (const rec of list) {
      const li = el('li', { class: `photo${rec.favorite ? ' is-fav' : ''}${rec.id === newId ? ' is-new' : ''}`, dataset: { id: rec.id } });
      const img = el('img', { src: this.url(rec), alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' });
      const btn = el('button', { type: 'button', class: 'photo__btn', 'aria-label': `${rec.name}, ${rec.width} × ${rec.height}${rec.favorite ? ', favori' : ''}. Ouvrir`, dataset: { airLabel: 'Viser · poing = attraper' } },
        el('span', { class: 'photo__img' }, img),
        el('span', { class: 'photo__meta' }, el('span', { class: 'photo__name', text: rec.name }), el('span', { class: 'photo__dims', text: `${rec.width}×${rec.height}` })));
      btn.addEventListener('click', () => this.open(rec.id));
      const actions = el('div', { class: 'photo__actions' },
        el('button', { type: 'button', class: 'photo__act', 'aria-label': `Envoyer ${rec.name} à l’appareil relié`, onclick: () => this.app.share.sendPhoto(rec.id) }, icon('send')),
        el('button', { type: 'button', class: 'photo__act', 'aria-label': `${rec.favorite ? 'Retirer des' : 'Ajouter aux'} favoris : ${rec.name}`, onclick: () => this.toggleFav(rec.id) }, icon('star')));
      li.append(
        btn,
        el('span', { class: 'photo__src', dataset: { src: rec.source }, text: SRC_LABEL[rec.source] || rec.source }),
        el('span', { class: 'photo__fav', 'aria-hidden': 'true' }, icon('star')),
        actions,
        el('span', { class: 'photo__lock', 'aria-hidden': 'true' }, el('i'), el('i'), el('i'), el('i'), el('span', { text: 'Cible verrouillée' })),
      );
      this.gridEl.append(li);
    }
    for (let i = 0; i < (this.filter === 'all' ? this.seeding || 0 : 0); i++) {
      this.gridEl.append(el('li', { class: 'photo photo--ghost', 'aria-hidden': 'true' }, el('span', { class: 'photo__scan' })));
    }
    const favs = this.photos.filter((p) => p.favorite).length;
    this.statsEl.textContent = `${this.photos.length} photo${this.photos.length > 1 ? 's' : ''} · ${favs} favori${favs > 1 ? 's' : ''}`;
    if (this.app.share?.carry) this.markGrabbed(this.app.share.carry.photoId, true);
  }

  cardEl(id) {
    return this.gridEl.querySelector(`.photo[data-id="${CSS.escape(id)}"]`);
  }

  markGrabbed(id, on) {
    const c = this.cardEl(id);
    if (c) c.classList.toggle('is-grabbed', on);
  }

  /** Photo visée par le curseur aérien (ou ouverte dans la visionneuse). */
  photoUnderCursor() {
    if (this.viewerId) return this.viewerId;
    const t = this.app.cursor.hoverEl;
    const card = t?.closest?.('.photo');
    return card ? card.dataset.id : null;
  }

  async toggleFav(id, force) {
    const rec = this.get(id);
    if (!rec) return;
    rec.favorite = force ?? !rec.favorite;
    await db.put('photos', rec).catch(() => {});
    this.render();
    if (this.viewerId === id) this._viewerMeta();
    this.app.sound.play(rec.favorite ? 'ok' : 'click');
    this.app.ui.log('galerie', `${rec.name} ${rec.favorite ? 'ajoutée aux' : 'retirée des'} favoris`);
    return rec.favorite;
  }

  /** Suppression annulable quelques secondes (bouton « Annuler » de la notification). */
  async remove(id) {
    const rec = this.get(id);
    if (!rec) return;
    if (this.app.share?.carry?.photoId === id) this.app.share.putBack(null, { quiet: true });
    const list = this.visible();
    const index = list.findIndex((p) => p.id === id);
    this.photos = this.photos.filter((p) => p.id !== id);
    await db.delete('photos', id).catch(() => {});
    this._revoke(id);
    if (this.viewerId === id) {
      const rest = this.visible();
      if (rest.length) this.open(rest[Math.min(index, rest.length - 1)].id); else this.close();
    }
    this.render();
    this.app.ui.log('galerie', `photo supprimée : ${rec.name}`);
    this.app.ui.toast('Photo supprimée', rec.name, { sound: 'click', ms: 7000, action: { label: 'Annuler', run: () => this.restore(rec) } });
  }

  async restore(rec) {
    if (this.get(rec.id)) return;
    if (!this.storageError) await db.put('photos', rec).catch(() => {});
    this.photos.push(rec);
    this.photos.sort((a, b) => b.createdAt - a.createdAt);
    this.render(rec.id);
    this.app.ui.log('galerie', `photo restaurée : ${rec.name}`);
  }

  async clearAll() {
    for (const p of this.photos) this._revoke(p.id);
    this.photos = [];
    await db.clear('photos').catch(() => {});
    this.close();
    this.render();
  }

  // ——— Visionneuse ———————————————————————————————————————————

  open(id) {
    const rec = this.get(id);
    if (!rec) return;
    this.viewerId = id;
    this.view = { scale: 1, rot: 0, tx: 0, ty: 0 };
    this.viewerImg.src = this.url(rec, 'full');
    this.viewerImg.alt = rec.name;
    this._viewerMeta();
    this._apply(false);
    this.viewerEl.hidden = false;
    $('#viewerClose').focus({ preventScroll: true });
    this.app.bus.emit('viewer', { open: true, id });
  }

  close() {
    if (!this.viewerId) return;
    const id = this.viewerId;
    this.viewerId = null;
    this.viewerEl.hidden = true;
    this.app.bus.emit('viewer', { open: false });
    this.cardEl(id)?.querySelector('.photo__btn')?.focus({ preventScroll: true });
  }

  _viewerMeta() {
    const rec = this.get(this.viewerId);
    if (!rec) return;
    $('#viewerTitle').textContent = rec.name;
    const d = new Date(rec.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    $('#viewerSub').textContent = `${rec.width} × ${rec.height} · ${formatBytes(rec.size)} · ${SRC_LABEL[rec.source] || rec.source}${rec.from ? ` de ${rec.from}` : ''} · ${d}`;
    const fav = $('#viewerFav');
    fav.setAttribute('aria-pressed', String(rec.favorite));
    fav.setAttribute('aria-label', rec.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris');
  }

  step(dir) {
    const list = this.visible();
    if (!list.length) return;
    if (!this.viewerId) { this.open(list[0].id); return; }
    const i = list.findIndex((p) => p.id === this.viewerId);
    const next = list[(i + dir + list.length) % list.length];
    if (!next || next.id === this.viewerId) return;
    const img = this.viewerImg;
    if (!reducedMotion()) {
      img.classList.add('is-anim');
      img.style.opacity = '0';
      img.style.transform = `translateX(${dir * -60}px) scale(.96)`;
      setTimeout(() => {
        this.open(next.id);
        img.style.transform = `translateX(${dir * 60}px) scale(.96)`;
        requestAnimationFrame(() => requestAnimationFrame(() => { img.style.opacity = '1'; this._apply(true); }));
        setTimeout(() => img.classList.remove('is-anim'), 460);
      }, 160);
    } else {
      this.open(next.id);
    }
    this.app.sound.play('swipe');
  }

  _apply(anim) {
    const v = this.view;
    this.viewerImg.classList.toggle('is-anim', !!anim);
    this.viewerImg.style.transform = `translate(${v.tx}px, ${v.ty}px) rotate(${v.rot}rad) scale(${v.scale})`;
    const deg = Math.round((v.rot * 180) / Math.PI);
    $('#viewerReadout').textContent = v.scale !== 1 || v.rot !== 0 ? `ZOOM ${v.scale.toFixed(2).replace('.', ',')}× · ROT ${deg}°` : '';
  }

  zoomBy(f) {
    this.view.scale = clamp(this.view.scale * f, 0.4, 6);
    this._apply(true);
  }

  resetView() {
    this.view = { scale: 1, rot: 0, tx: 0, ty: 0 };
    this._apply(true);
  }

  /** Évènements de gestes pertinents pour la galerie. */
  onGesture(ev) {
    if (this.viewerId) {
      if (ev.type === 'swipe' && (ev.direction === 'left' || ev.direction === 'right')) {
        this.step(ev.direction === 'left' ? 1 : -1);
        return true;
      }
      if (ev.type === 'twohand:start') { this.base = { ...this.view }; return true; }
      if (ev.type === 'twohand:update' && this.base) {
        this.view.scale = clamp(this.base.scale * ev.scale, 0.4, 6);
        this.view.rot = this.base.rot + ev.rotation;
        this._apply(false);
        return true;
      }
      if (ev.type === 'twohand:end') { this.base = null; return true; }
      if (ev.type === 'gesture' && ev.name === 'Thumb_Up') {
        this.toggleFav(this.viewerId, true).then(() => {
          const r = $('#viewerFav').getBoundingClientRect();
          this.app.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { color: '#ffb547', count: 36 });
          this.app.ui.toast('Ajoutée aux favoris', this.get(this.viewerId)?.name || '', { kind: 'ok', sound: false });
        });
        return true;
      }
      if (ev.type === 'pinchmove' && this.view.scale > 1.05 && this._panFrom) {
        const s = this.app.mapToScreen({ x: ev.x, y: ev.y });
        this.view.tx = this._panFrom.tx + (s.x - this._panFrom.x);
        this.view.ty = this._panFrom.ty + (s.y - this._panFrom.y);
        this._apply(false);
      }
      if (ev.type === 'pinchstart' && this.view.scale > 1.05) {
        const s = this.app.mapToScreen({ x: ev.x, y: ev.y });
        this._panFrom = { x: s.x, y: s.y, tx: this.view.tx, ty: this.view.ty };
      }
      if (ev.type === 'pinchend') this._panFrom = null;
    } else if (ev.type === 'swipe' && (ev.direction === 'up' || ev.direction === 'down')) {
      $('.grid-wrap').scrollBy({ top: ev.direction === 'up' ? 320 : -320, behavior: reducedMotion() ? 'auto' : 'smooth' });
      return true;
    } else if (ev.type === 'gesture' && ev.name === 'Thumb_Up') {
      const id = this.photoUnderCursor();
      if (id) { this.toggleFav(id, true); return true; }
    }
    return false;
  }

  _bind() {
    $('#fileInput').addEventListener('change', (e) => { this.importFiles(e.target.files); e.target.value = ''; });
    for (const b of document.querySelectorAll('[data-filter]')) {
      b.addEventListener('click', () => {
        this.filter = b.dataset.filter;
        for (const o of document.querySelectorAll('[data-filter]')) o.setAttribute('aria-pressed', String(o === b));
        this.render();
      });
    }
    $('#viewerClose').addEventListener('click', () => this.close());
    $('#viewerPrev').addEventListener('click', () => this.step(-1));
    $('#viewerNext').addEventListener('click', () => this.step(1));
    $('#viewerFav').addEventListener('click', () => this.toggleFav(this.viewerId));
    $('#viewerSend').addEventListener('click', () => this.app.share.sendPhoto(this.viewerId));
    $('#viewerDelete').addEventListener('click', () => this.remove(this.viewerId));
    this.viewerEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { this.step(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { this.step(-1); e.preventDefault(); }
      else if (e.key === 'Escape') { this.close(); e.preventDefault(); }
      else if (e.key === '+' || e.key === '=') this.zoomBy(1.2);
      else if (e.key === '-') this.zoomBy(1 / 1.2);
      else if (e.key === '0') this.resetView();
    });
    const stage = $('#viewerStage');
    stage.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
    stage.addEventListener('dblclick', () => this.resetView());
    let drag = null;
    stage.addEventListener('pointerdown', (e) => { if (this.view.scale <= 1.02) return; drag = { x: e.clientX, y: e.clientY, tx: this.view.tx, ty: this.view.ty }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', (e) => { if (!drag) return; this.view.tx = drag.tx + e.clientX - drag.x; this.view.ty = drag.ty + e.clientY - drag.y; this._apply(false); });
    stage.addEventListener('pointerup', () => { drag = null; });
    // Swipe tactile dans la visionneuse.
    let touch = null;
    stage.addEventListener('touchstart', (e) => { if (e.touches.length === 1 && this.view.scale <= 1.02) touch = { x: e.touches[0].clientX, t: performance.now() }; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (!touch) return;
      const dx = e.changedTouches[0].clientX - touch.x;
      if (Math.abs(dx) > 60 && performance.now() - touch.t < 600) this.step(dx < 0 ? 1 : -1);
      touch = null;
    });

    // Glisser-déposer de fichiers sur la scène.
    const stageEl = $('#stage');
    let depth = 0;
    stageEl.addEventListener('dragenter', (e) => { if (e.dataTransfer?.types?.includes('Files')) { depth++; stageEl.classList.add('is-dragover'); } });
    stageEl.addEventListener('dragover', (e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
    stageEl.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) stageEl.classList.remove('is-dragover'); });
    stageEl.addEventListener('drop', (e) => {
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      depth = 0;
      stageEl.classList.remove('is-dragover');
      this.app.setMode('galerie');
      this.importFiles(e.dataTransfer.files);
    });

    // Verrouillage visuel de la cible survolée par le curseur aérien.
    this.app.bus.on('air:hover', (target) => {
      for (const c of this.gridEl.querySelectorAll('.photo.is-target')) c.classList.remove('is-target');
      const card = target?.closest?.('.photo');
      if (card) card.classList.add('is-target');
    });
  }
}
