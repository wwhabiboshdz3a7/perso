/* ==========================================================================
   Socle JS commun : apparition au défilement, menu mobile, toasts,
   stockage local, envoi de formulaire Netlify, utilitaires.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Utilitaires de base ---------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const euro = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtDate = (d, opts) => new Intl.DateTimeFormat('fr-FR', opts || { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const uid = (prefix) => (prefix || '') + Math.random().toString(36).slice(2, 6).toUpperCase() + Date.now().toString(36).slice(-3).toUpperCase();

  /* ---------- Stockage local protégé ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* stockage indisponible */ }
    },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  };

  /* ---------- Toasts ---------- */
  function toast(msg, type) {
    let zone = $('.toast-zone');
    if (!zone) { zone = document.createElement('div'); zone.className = 'toast-zone'; zone.setAttribute('aria-live', 'polite'); document.body.appendChild(zone); }
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    zone.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; setTimeout(() => el.remove(), 400); }, 3200);
  }

  /* ---------- Apparition au défilement ---------- */
  function initReveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) { items.forEach((i) => i.classList.add('is-visible')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((i, idx) => { i.style.transitionDelay = (i.dataset.delay || Math.min(idx % 4 * 80, 240)) + 'ms'; io.observe(i); });
  }

  /* ---------- Menu mobile ---------- */
  function initBurger() {
    const btn = $('[data-burger]');
    const nav = $('[data-nav]');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
      document.body.classList.toggle('nav-open', !open);
    });
    $$('a', nav).forEach((a) => a.addEventListener('click', () => { btn.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); document.body.classList.remove('nav-open'); }));
  }

  /* ---------- Images : repli visuel si la ressource ne charge pas ---------- */
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG') { const wrap = t.closest('.ph') || t.parentElement; if (wrap) wrap.classList.add('img-broken'); }
  }, true);

  /* ---------- Modales ---------- */
  function openModal(id) { const m = typeof id === 'string' ? $(id) : id; if (!m) return; m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; const f = $('[data-autofocus]', m) || $('button, input, select', m); if (f) f.focus(); }
  function closeModal(m) { if (!m) return; m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  function initModals() {
    $$('[data-open-modal]').forEach((b) => b.addEventListener('click', () => openModal(b.dataset.openModal)));
    $$('.modal').forEach((m) => {
      m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close-modal]')) closeModal(m); });
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.modal.open').forEach(closeModal); });
  }

  /* ---------- Validation + envoi Netlify Forms ---------- */
  function setError(input, msg) {
    const field = input.closest('.field');
    if (!field) return;
    let err = $('.error-msg', field);
    if (!err) { err = document.createElement('p'); err.className = 'error-msg'; field.appendChild(err); }
    err.textContent = msg || '';
    field.classList.toggle('has-error', !!msg);
  }
  function validate(form) {
    let ok = true;
    $$('[required]', form).forEach((input) => {
      if (input.closest('.honey')) return;
      let msg = '';
      const v = input.value.trim();
      if (!v) msg = 'Ce champ est obligatoire.';
      else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Adresse e-mail invalide.';
      else if (input.type === 'tel' && !/^(\+33|0)[1-9](?:[ .-]?\d{2}){4}$/.test(v)) msg = 'Numéro invalide (ex. 06 12 34 56 78).';
      else if (input.minLength > 0 && v.length < input.minLength) msg = `Au moins ${input.minLength} caractères.`;
      setError(input, msg);
      if (msg) ok = false;
    });
    return ok;
  }
  function sendNetlify(form, extra) {
    const data = new FormData(form);
    Object.entries(extra || {}).forEach(([k, v]) => data.set(k, typeof v === 'string' ? v : JSON.stringify(v)));
    if (!data.get('form-name') && form.getAttribute('name')) data.set('form-name', form.getAttribute('name'));
    // En local, le serveur statique n'accepte pas POST : on résout quoi qu'il arrive (le site publié sur Netlify reçoit bien l'envoi).
    return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() })
      .then((r) => r.ok).catch(() => false);
  }
  function initLiveValidation() {
    document.addEventListener('input', (e) => { if (e.target.closest('.field.has-error')) setError(e.target, ''); });
  }

  /* ---------- Divers ---------- */
  function initYear() { $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); }); }
  function initDemoBadge() {
    if ($('.demo-badge') || location.pathname.split('/').filter(Boolean).length < 2) return;
    const a = document.createElement('a');
    a.className = 'demo-badge'; a.href = '../../'; a.innerHTML = 'Démo <span>— entreprise fictive · retour aux démos</span>';
    document.body.appendChild(a);
  }
  function initHeaderScroll() {
    const h = $('[data-header]'); if (!h) return;
    const onScroll = () => h.classList.toggle('scrolled', window.scrollY > 24);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  /* Accordéon FAQ simple basé sur <details> : un seul ouvert à la fois */
  function initFaq() {
    $$('[data-faq]').forEach((wrap) => {
      $$('details', wrap).forEach((d) => d.addEventListener('toggle', () => { if (d.open) $$('details', wrap).forEach((o) => { if (o !== d) o.open = false; }); }));
    });
  }

  window.Demo = { $, $$, euro, pad, isoDate, fmtDate, cap, uid, store, toast, openModal, closeModal, validate, setError, sendNetlify };

  document.addEventListener('DOMContentLoaded', () => {
    initReveal(); initBurger(); initModals(); initLiveValidation(); initYear(); initDemoBadge(); initHeaderScroll(); initFaq();
  });
})();
