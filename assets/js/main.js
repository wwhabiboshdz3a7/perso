/* NEXORA — scripts du site (aucune dépendance) */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var header = document.querySelector('.header');
    var menuBtn = document.querySelector('.menu-btn');
    var menu = document.getElementById('menu-mobile');
    var main = document.querySelector('main');
    var footer = document.querySelector('.footer');

    /* ---------- En-tête : état au défilement ---------- */
    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-scrolled', window.scrollY > 24);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---------- Menu mobile accessible ---------- */
    if (menuBtn && menu) {
      var label = menuBtn.querySelector('.sr-only');
      var setOpen = function (open, restoreFocus) {
        menuBtn.setAttribute('aria-expanded', String(open));
        if (label) label.textContent = open ? 'Fermer le menu' : 'Ouvrir le menu';
        menu.classList.toggle('is-open', open);
        document.body.classList.toggle('menu-open', open);
        [main, footer].forEach(function (el) {
          if (!el) return;
          if (open) el.setAttribute('inert', '');
          else el.removeAttribute('inert');
        });
        if (open) {
          var first = menu.querySelector('a');
          if (first) setTimeout(function () { first.focus(); }, 60);
        } else if (restoreFocus) {
          menuBtn.focus();
        }
      };
      setOpen(false);
      menuBtn.addEventListener('click', function () {
        setOpen(menuBtn.getAttribute('aria-expanded') !== 'true', true);
      });
      menu.addEventListener('click', function (e) {
        if (e.target.closest('a')) setOpen(false, false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false, true);
        if (e.key === 'Tab' && menu.classList.contains('is-open')) {
          var items = [menuBtn].concat(Array.prototype.slice.call(menu.querySelectorAll('a')));
          var firstEl = items[0], lastEl = items[items.length - 1];
          if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
          else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
        }
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 980 && menu.classList.contains('is-open')) setOpen(false, false);
      });
    }

    /* ---------- Apparitions au défilement ---------- */
    var revealables = document.querySelectorAll('.reveal, .steps');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      revealables.forEach(function (el) { io.observe(el); });
    }

    /* ---------- Lien actif dans la navigation ---------- */
    var navLinks = document.querySelectorAll('.nav__link[href^="#"]');
    if (navLinks.length && 'IntersectionObserver' in window) {
      var byId = {};
      navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var link = byId[entry.target.id];
          navLinks.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
          if (link) {
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'true');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      document.querySelectorAll('main > section').forEach(function (section) { spy.observe(section); });
    }

    /* ---------- Vidéo du hero : économie d'énergie ---------- */
    var video = document.querySelector('.hero__media video');
    if (video) {
      var saveData = navigator.connection && navigator.connection.saveData;
      if (reduceMotion || saveData) {
        video.removeAttribute('autoplay');
        video.pause();
        video.remove();
      } else if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var p = video.play();
              if (p && p.catch) p.catch(function () {});
            } else {
              video.pause();
            }
          });
        }).observe(video);
      }
    }

    /* ---------- Formule choisie : préremplit le budget ---------- */
    var budget = document.getElementById('f-budget');
    document.querySelectorAll('[data-plan]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!budget) return;
        var plan = btn.getAttribute('data-plan');
        Array.prototype.forEach.call(budget.options, function (opt) {
          if (opt.text.indexOf(plan) === 0) budget.value = opt.value || opt.text;
        });
      });
    });

    /* ---------- Une seule question FAQ ouverte à la fois ---------- */
    var faqItems = document.querySelectorAll('.faq details');
    faqItems.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        faqItems.forEach(function (other) { if (other !== d) other.open = false; });
      });
    });

    /* ---------- Année du pied de page ---------- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  });
})();
