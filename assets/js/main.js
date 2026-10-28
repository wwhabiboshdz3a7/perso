/* NEXORA — scripts communs (aucune dépendance) */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Menu mobile ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- Lien de navigation courant ---- */
  var path = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.nav a').forEach(function (a) {
    var href = a.getAttribute('href').replace(/index\.html$/, '');
    if (href === path || (href !== '/' && path.indexOf(href) === 0)) {
      a.setAttribute('aria-current', 'page');
    }
  });

  /* ---- Révélation au scroll ---- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Compteurs ---- */
  var counters = document.querySelectorAll('[data-count]');
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---- Filtres des réalisations ---- */
  var filters = document.querySelector('[data-filters]');
  if (filters) {
    var items = document.querySelectorAll('[data-sector]');
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      filters.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      var f = btn.getAttribute('data-filter');
      var shown = 0;
      items.forEach(function (it) {
        var match = f === 'all' || it.getAttribute('data-sector') === f;
        it.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });
      var status = document.getElementById('filter-status');
      if (status) status.textContent = shown + ' projet' + (shown > 1 ? 's' : '') + ' affiché' + (shown > 1 ? 's' : '');
    });
  }

  /* ---- Simulateur de budget ---- */
  var sim = document.getElementById('simulateur');
  if (sim) {
    var totalEl = sim.querySelector('[data-sim-total]');
    var listEl = sim.querySelector('[data-sim-list]');
    var detailEl = sim.querySelector('[data-sim-detail]');
    var ctaEl = sim.querySelector('[data-sim-cta]');
    var fmt = function (n) { return n.toLocaleString('fr-FR') + ' €'; };
    function compute() {
      var min = 0, max = 0, lines = [];
      sim.querySelectorAll('input:checked').forEach(function (input) {
        var lo = parseInt(input.getAttribute('data-min'), 10) || 0;
        var hi = parseInt(input.getAttribute('data-max'), 10) || lo;
        if (!lo && !hi) return;
        min += lo; max += hi;
        lines.push({ label: input.getAttribute('data-label'), lo: lo, hi: hi });
      });
      totalEl.textContent = min === max ? fmt(min) : fmt(min) + ' – ' + fmt(max);
      listEl.innerHTML = '';
      lines.forEach(function (l) {
        var li = document.createElement('li');
        var a = document.createElement('span'); a.textContent = l.label;
        var b = document.createElement('span'); b.textContent = l.lo === l.hi ? fmt(l.lo) : fmt(l.lo) + ' – ' + fmt(l.hi);
        li.appendChild(a); li.appendChild(b); listEl.appendChild(li);
      });
      if (detailEl) {
        var monthly = Math.round(max / 3);
        detailEl.textContent = lines.length
          ? 'Estimation hors taxes, à affiner ensemble. Possible en 3 fois sans frais : jusqu’à ' + fmt(monthly) + ' par mois.'
          : 'Sélectionnez un point de départ pour obtenir une estimation.';
      }
      if (ctaEl) {
        var labels = lines.map(function (l) { return l.label; }).join(', ');
        ctaEl.setAttribute('href', '/contact.html?projet=' + encodeURIComponent(labels));
      }
    }
    sim.addEventListener('change', compute);
    compute();
  }

  /* ---- Pré-remplissage du formulaire de contact ---- */
  var form = document.querySelector('form[name="contact"]');
  if (form) {
    var params = new URLSearchParams(location.search);
    var projet = params.get('projet');
    var offre = params.get('offre');
    var msg = form.querySelector('textarea[name="message"]');
    if (msg && (projet || offre) && !msg.value) {
      msg.value = 'Bonjour, je souhaite un devis pour : ' + (offre || projet) + '.\n\n';
    }
    var secteur = params.get('secteur');
    var sel = form.querySelector('select[name="secteur"]');
    if (secteur && sel) sel.value = secteur;
  }

  /* ---- Année du pied de page ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
