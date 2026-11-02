// Curseur aérien : l'index pilote un pointeur sur toute l'interface.
// Pincement bref = clic, pincement maintenu = glisser (curseurs, défilement).

import { $, clamp } from './dom.js';

const INTERACTIVE = '[data-air], button:not([disabled]), a[href], input:not([type="hidden"]), select, textarea, [role="tab"], [role="radio"], .photo__btn';

export class AirCursor {
  constructor(app) {
    this.app = app;
    this.el = $('#airCursor');
    this.press = $('#acPress');
    this.label = $('#acLabel');
    this.screen = null;       // position écran courante {x, y}
    this.visible = false;
    this.hoverEl = null;
    this.pressing = null;     // {el, x, y, t, range}
    this.handId = null;
    this.smooth = null;
  }

  /** Mise à jour à chaque image traitée. */
  update(result) {
    const p = result.primary;
    if (!p) {
      this.hide();
      return;
    }
    this.handId = p.id;
    let s = this.app.mapToScreen(p.pointer);
    // Aimantation légère vers le centre de la cible survolée.
    if (this.app.settings.get('magnet') && this.hoverEl && !this.pressing && this.hoverEl.matches('button, [data-air], .photo__btn, a')) {
      const r = this.hoverEl.getBoundingClientRect();
      if (r.width < 420 && r.height < 300) {
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        s = { x: s.x + (cx - s.x) * 0.22, y: s.y + (cy - s.y) * 0.22 };
      }
    }
    this.screen = s;
    this.el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
    if (!this.visible) { this.visible = true; this.el.classList.add('is-on'); }
    this.el.classList.toggle('is-pinch', p.pinching);
    this.el.classList.toggle('is-fist', p.pose === 'fist');
    this._hover(s);
    if (this.pressing) this._drag(s);
  }

  hide() {
    if (this.pressing) this._cancel();
    if (this.visible) { this.visible = false; this.el.classList.remove('is-on'); }
    this._setHover(null);
    this.screen = null;
  }

  _hover(s) {
    const under = document.elementFromPoint(s.x, s.y);
    let target = under ? under.closest(INTERACTIVE) : null;
    if (target && target.closest('[inert]')) target = null;
    if (target && target.tagName === 'INPUT' && target.closest('label.btn')) target = target.closest('label.btn');
    this._setHover(target);
  }

  _setHover(target) {
    if (target === this.hoverEl) return;
    this.hoverEl?.classList.remove('air-hover');
    this.hoverEl = target;
    if (target) {
      target.classList.add('air-hover');
      this.app.sound.play('hover');
      const txt = target.getAttribute('aria-label') || target.dataset.airLabel || target.textContent || '';
      this.label.textContent = txt.trim().replace(/\s+/g, ' ').slice(0, 28);
    }
    this.el.classList.toggle('is-hover', !!target);
    this.app.bus.emit('air:hover', target);
  }

  /** Évènements du moteur concernant la main principale. */
  onEvent(ev) {
    if (ev.hand !== this.handId && ev.type !== 'twohand:start') return;
    if (ev.type === 'pinchstart') this._start();
    else if (ev.type === 'pinchend') this._end(ev);
    else if (ev.type === 'twohand:start') this._cancel();
  }

  _start() {
    if (!this.screen) return;
    const target = this.hoverEl;
    this.app.sound.play('pinch');
    this.press.style.strokeDashoffset = '0';
    const range = target && target.matches('input[type="range"]') ? target : target?.querySelector?.('input[type="range"]');
    this.pressing = { el: target, x: this.screen.x, y: this.screen.y, t: performance.now(), range: range || null, scroll: this._scrollable(target) };
    if (target) target.classList.add('air-press');
    if (this.pressing.scroll) this.pressing.scrollStart = this.pressing.scroll.scrollTop;
  }

  _scrollable(el) {
    let n = el || (this.screen ? document.elementFromPoint(this.screen.x, this.screen.y) : null);
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 4) return n;
      n = n.parentElement;
    }
    return null;
  }

  _drag(s) {
    const pr = this.pressing;
    if (pr.range) {
      const r = pr.range.getBoundingClientRect();
      const k = clamp((s.x - r.left) / r.width, 0, 1);
      const min = +pr.range.min || 0, max = +pr.range.max || 100, step = +pr.range.step || 1;
      const v = Math.round((min + k * (max - min)) / step) * step;
      if (String(v) !== pr.range.value) {
        pr.range.value = String(clamp(v, min, max));
        pr.range.dispatchEvent(new Event('input', { bubbles: true }));
        pr.moved = true;
      }
    } else if (pr.scroll && Math.abs(s.y - pr.y) > 24) {
      pr.scroll.scrollTop = pr.scrollStart - (s.y - pr.y) * 1.4;
      pr.moved = true;
    }
  }

  _end(ev) {
    const pr = this.pressing;
    this.press.style.strokeDashoffset = '';
    if (!pr) return;
    this.pressing = null;
    pr.el?.classList.remove('air-press');
    if (pr.range && pr.moved) {
      pr.range.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    if (pr.moved) return;
    const short = (ev.duration ?? 0) < 900;
    const still = (ev.moved ?? 0) < 0.06;
    if (!short || !still || !pr.el) return;
    this.click(pr.el);
  }

  _cancel() {
    if (!this.pressing) return;
    this.pressing.el?.classList.remove('air-press');
    this.pressing = null;
    this.press.style.strokeDashoffset = '';
  }

  click(el) {
    this.app.sound.play('click');
    if (el.matches('input[type="text"], input[type="url"], input[type="number"], input[type="password"], textarea, select')) {
      el.focus();
      return;
    }
    if (el.matches('label') && el.querySelector('input[type="file"]')) {
      el.querySelector('input[type="file"]').click();
      return;
    }
    el.focus?.({ preventScroll: true });
    el.click();
    this.app.bus.emit('air:click', el);
  }

  /** Le curseur doit rester au-dessus d'une boîte de dialogue modale. */
  attachTo(container) {
    (container || document.body).append(this.el);
  }
}
