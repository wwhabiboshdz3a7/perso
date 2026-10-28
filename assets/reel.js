// Showreel : quinze scènes empilées, pilotées par le défilement et le pointeur.
import { RM, TOUCH, SMALL, DPR, clamp, lerp, loop, fitText, fontsReady, virtualPointer, enableGyro, resizeCanvas, hasWebGL, FONTS, debounce } from './core.js';
import { mount as mountVariable } from './fx/variable.js';
import { mount as mountCylindre } from './fx/cylindre.js';
import { mount as mountRessorts } from './fx/ressorts.js';
import { mount as mountLiquide } from './fx/liquide.js';
import { createSwarm } from './fx/particules.js';
import { createMarquees } from './fx/marquees.js';
import { blobField } from './fx/masque.js';
import { odometer } from './fx/odometre.js';
import { createPile } from './fx/gravite.js';
import { lorenzRenderer } from './fx/lorenz.js';
import { createBoard } from './fx/splitflap.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ACID = '#c6ff3d', HOT = '#ff4d24';
const sections = $$('.sc');
const vh = () => innerHeight;
const small = SMALL();
let lenis = null;
let velocity = 0; // vitesse de défilement lissée (px / image)

sections.forEach((s, i) => { s.style.setProperty('--len', s.dataset.len || 1); s.style.zIndex = i + 1; });

// Déclencheur de la phase « contenu » d'une scène (quand elle couvre l'écran).
const contentST = (sec, opts) => ScrollTrigger.create({
  trigger: sec, start: 'top top', end: () => '+=' + (parseFloat(sec.dataset.len) || 1) * vh(), ...opts
});
const contentTL = (sec, extra = {}) => gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + (parseFloat(sec.dataset.len) || 1) * vh(), scrub: 0.6, ...extra } });

/* ———————————————————— Lissage + transitions ———————————————————— */
function setupScroll() {
  if (RM) return;
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => { lenis.raf(t * 1000); velocity = lerp(velocity, lenis.velocity || 0, 0.15); });
  gsap.ticker.lagSmoothing(0);
  window.motionLab = { lenis };

  const clips = {
    clip: ['inset(16% 9% 0% 9% round 48px)', 'inset(0% 0% 0% 0% round 0px)'],
    circle: ['circle(12% at 50% 100%)', 'circle(150% at 50% 50%)'],
    wipe: ['polygon(0% 55%, 100% 0%, 100% 100%, 0% 100%)', 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)']
  };
  sections.forEach((sec, i) => {
    const pin = $('.sc__pin', sec);
    const shade = document.createElement('div'); shade.className = 'sc__shade'; pin.appendChild(shade);
    if (i > 0) {
      const c = clips[sec.dataset.in] || clips.clip;
      gsap.fromTo(pin, { clipPath: c[0] }, { clipPath: c[1], ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true } });
    }
    const next = sections[i + 1];
    if (next) {
      gsap.timeline({ scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true } })
        .to(pin, { scale: 0.86, rotation: i % 2 ? 1.5 : -1.5, yPercent: -4, ease: 'power1.in' }, 0)
        .to(shade, { opacity: 0.75, ease: 'none' }, 0);
    }
  });
}

/* ———————————————————— HUD, menu, progression ———————————————————— */
function setupHUD() {
  const num = $('.hud__num'), name = $('.hud__name'), cur = $('.hud__cur'), bar = $('.progress i');
  $('.hud__tot').textContent = String(sections.length).padStart(2, '0');
  let active = -1;
  const list = $('.menu__list');
  list.innerHTML = sections.map((s, i) => `<li><a href="#${s.id}" data-goto="${i}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="t"><span>${s.dataset.name}</span><span aria-hidden="true">${s.dataset.name}</span></span></a></li>`).join('');
  const update = () => {
    const y = scrollY + vh() * 0.5;
    let idx = 0;
    sections.forEach((s, i) => { if (s.offsetTop <= y) idx = i; });
    const max = document.documentElement.scrollHeight - vh();
    bar.style.transform = `scaleX(${clamp(scrollY / Math.max(1, max), 0, 1)})`;
    if (idx !== active) {
      active = idx;
      const n = String(idx + 1).padStart(2, '0');
      num.textContent = n; cur.textContent = n;
      if (RM) name.textContent = sections[idx].dataset.name;
      else {
        gsap.to(name, { duration: 0.6, scrambleText: { text: sections[idx].dataset.name, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', speed: 0.8 }, overwrite: true });
        gsap.fromTo(cur, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
      }
      $$('a', list).forEach((a, i) => a.setAttribute('aria-current', i === idx ? 'true' : 'false'));
    }
  };
  addEventListener('scroll', update, { passive: true });
  update();

  // Menu plein écran
  const menu = $('#menu'), btn = $('.hud__menu');
  let open = false;
  const toggle = (state) => {
    open = state ?? !open;
    btn.setAttribute('aria-expanded', open);
    document.body.classList.toggle('menu-open', open);
    $('.hud__menu-l').textContent = open ? 'Fermer' : 'Menu';
    if (open) {
      menu.hidden = false;
      lenis && lenis.stop();
      if (!RM) {
        gsap.fromTo($('.menu__bg', menu), { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.9, ease: 'expo.inOut' });
        gsap.fromTo($$('.menu__list li, .menu__side > *', menu), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.03, delay: 0.25 });
      }
      $('.menu__list a', menu).focus({ preventScroll: true });
    } else {
      lenis && lenis.start();
      if (RM) { menu.hidden = true; return; }
      gsap.to($('.menu__bg', menu), { clipPath: 'circle(0% at 100% 0%)', duration: 0.6, ease: 'expo.in' });
      gsap.to($$('.menu__list li, .menu__side > *', menu), { opacity: 0, duration: 0.3, onComplete: () => { if (!open) menu.hidden = true; } });
    }
  };
  btn.addEventListener('click', () => toggle());
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { toggle(false); btn.focus(); } });
  const go = (i) => {
    const target = i === 0 ? 0 : sections[i].offsetTop;
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) }); else scrollTo(0, target);
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-goto]');
    if (!a) return;
    e.preventDefault();
    const i = +a.dataset.goto;
    if (open) { toggle(false); setTimeout(() => go(i), 250); } else go(i);
  });
}

function setupCursor() {
  if (TOUCH || RM) return;
  const c = $('.cursor');
  const qx = gsap.quickTo(c, 'x', { duration: 0.2, ease: 'power3' }), qy = gsap.quickTo(c, 'y', { duration: 0.2, ease: 'power3' });
  addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); });
  document.addEventListener('pointerover', (e) => c.classList.toggle('is-big', !!e.target.closest('a, button, .gv__w')));
}

/* ———————————————————— Scènes ———————————————————— */
const S = {};

// 01 — Ouverture : lettres posées qui décollent en 3D
S.s01 = (sec) => {
  const lines = $$('.s1__l', sec);
  const fit = () => {
    const w = sec.clientWidth - 2 * parseFloat(getComputedStyle(sec.querySelector('.s1')).paddingLeft);
    let sizes = lines.map((l) => { l.style.fontVariationSettings = `"wdth" ${small ? Math.min(+l.dataset.w, 100) : l.dataset.w}`; return fitText(l, { width: w, max: vh() * 0.34 }); });
    const total = sizes.reduce((a, b) => a + b * 0.78, 0);
    const room = vh() * (small ? 0.5 : 0.6);
    if (total > room) { const k = room / total; lines.forEach((l, i) => (l.style.fontSize = sizes[i] * k + 'px')); }
  };
  fit();
  const split = SplitText.create(lines, { type: 'chars', charsClass: 'c' });
  const sub = $('.s1__sub', sec), kick = $('.kick', sec);
  const intro = () => {
    if (RM) return;
    gsap.timeline()
      .from(split.chars, { yPercent: 115, rotationX: -95, opacity: 0, duration: 1.6, ease: 'elastic.out(1, 0.55)', stagger: { each: 0.035, from: 'start' } })
      .from(sub, { yPercent: 60, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.7)
      .from(kick.children, { y: -20, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1 }, 0.5);
  };
  if (!RM) {
    const flyers = split.chars.filter((c) => !c.closest('.s1__l--a'));
    const fallers = split.chars.filter((c) => c.closest('.s1__l--a'));
    const tl = contentTL(sec);
    const W = innerWidth;
    tl.to(flyers, {
      x: (i, el) => (el.getBoundingClientRect().left - W / 2) * gsap.utils.random(0.4, 1.6),
      y: () => -vh() * gsap.utils.random(0.2, 0.9),
      z: () => gsap.utils.random(-900, 500),
      rotationX: () => gsap.utils.random(-200, 200), rotationY: () => gsap.utils.random(-200, 200), rotationZ: () => gsap.utils.random(-60, 60),
      opacity: 0, ease: 'power2.in', duration: 1, stagger: { each: 0.02, from: 'random' }
    }, 0.15)
      .to(fallers, { y: () => vh() * gsap.utils.random(0.6, 1), rotation: () => gsap.utils.random(-50, 50), ease: 'power3.in', duration: 0.9, stagger: 0.04 }, 0.35)
      .to(sub, { xPercent: -30, opacity: 0, duration: 0.6 }, 0.1)
      .to(kick, { opacity: 0, duration: 0.3 }, 0);
  }
  return { intro, resize: fit };
};

// 02 — Il bouge : police variable en vagues, accélérée par le défilement
S.s02 = (sec) => {
  const stage = $('.s2__stage', sec);
  const o = { text: 'Il bouge', speed: 1, color: ACID, small, touch: TOUCH, reduced: RM };
  let inst = mountVariable(stage, o);
  const drift = () => {
    if (RM) return;
    $$('.vf__row', stage).forEach((r, i) => gsap.fromTo(r, { xPercent: i % 2 ? -14 : 14 }, { xPercent: i % 2 ? 14 : -14, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } }));
  };
  drift();
  gsap.ticker.add(() => { o.speed = 1 + Math.min(5, Math.abs(velocity) / 6); });
  return { resize: () => { inst.destroy && inst.destroy(); inst = mountVariable(stage, o); drift(); } };
};

// 03 — Il respire : lignes qui entrent en prenant du poids
S.s03 = (sec) => {
  const ls = $$('.s3__l', sec), rows = $$('.s3__row', sec);
  const fit = () => {
    const avail = $('.s3__lines', sec).clientWidth - (small ? 40 : 70);
    let widest = 0;
    ls.forEach((l) => { l.style.fontSize = '100px'; l.style.fontWeight = 900; l.style.display = 'inline-block'; widest = Math.max(widest, l.getBoundingClientRect().width); l.style.display = ''; l.style.fontWeight = ''; });
    const fs = Math.min(vh() * (small ? 0.1 : 0.135), (avail * 100) / widest);
    ls.forEach((l) => (l.style.fontSize = fs + 'px'));
  };
  fit();
  if (RM) { rows.forEach((r) => r.style.setProperty('--rule', 1)); return { resize: fit }; }
  const tl = contentTL(sec);
  ls.forEach((l, i) => {
    tl.fromTo(l, { yPercent: 108, fontWeight: 100, letterSpacing: '0.08em' }, { yPercent: 0, fontWeight: 850, letterSpacing: '-0.005em', duration: 0.8, ease: 'power3.out' }, i * 0.6)
      .fromTo(rows[i], { '--rule': 0 }, { '--rule': 1, duration: 0.8, ease: 'power2.inOut' }, i * 0.6 + 0.1);
  });
  tl.to(ls, { fontWeight: 120, letterSpacing: '0.04em', duration: 0.6, ease: 'power2.inOut' }, '+=0.3')
    .to(ls, { yPercent: -108, duration: 0.7, ease: 'power3.in', stagger: 0.07 }, '+=0.15')
    .to(rows, { '--rule': 0, duration: 0.5, stagger: 0.05 }, '<');
  return { resize: fit };
};

// 04 — Décodage : mots déchiffrés au défilement, pluie de glyphes
S.s04 = (sec) => {
  const words = $$('.s4__w', sec), log = $('.s4__log', sec), cv = $('.s4__rain', sec);
  const G = '01#%&*+=<>/\\[]{}ABCDEFXYZ$@';
  const rnd = () => G[(Math.random() * G.length) | 0];
  const state = words.map(() => -1);
  const paint = (w, p) => {
    const t = w.dataset.t, n = t.length, k = Math.floor(clamp(p, 0, 1) * n + 0.0001);
    let h = t.slice(0, k);
    if (k < n) h += '<span class="x">' + Array.from({ length: n - k }, rnd).join('') + '</span>';
    w.innerHTML = h;
  };
  const lines = ['> canal ouvert · 48 kHz', '> bruit de fond : −42 dB', '> trame typographique détectée', '> clé : <b>OK</b>', '> déchiffrement en cours…', '> <b>message intégral</b>'];
  let prog = 0;
  if (RM) { words.forEach((w) => (w.textContent = w.dataset.t)); log.innerHTML = lines.map((l) => `<div>${l}</div>`).join(''); }
  else {
    contentST(sec, { onUpdate: (s) => { prog = s.progress; } });
    words.forEach((w) => paint(w, 0));
  }
  const g = cv.getContext('2d');
  let drops = [];
  let shown = -1;
  loop($('.sc__pin', sec), (t, dt) => {
    if (!RM) {
      words.forEach((w, j) => {
        const p = (prog - 0.05 - j * 0.27) / 0.26;
        const q = clamp(p, 0, 1);
        if (q < 1 || state[j] !== 1) { paint(w, q); state[j] = q; }
      });
      const n = Math.floor(clamp(prog * 1.3, 0, 1) * lines.length);
      if (n !== shown) { shown = n; log.innerHTML = lines.slice(0, n).map((l) => `<div>${l}</div>`).join(''); }
    }
    if (resizeCanvas(cv, 1)) drops = [];
    const W = cv.width, H = cv.height, cs = small ? 14 : 18;
    if (!drops.length) drops = Array.from({ length: Math.ceil(W / cs) }, () => ({ y: Math.random() * H, s: 40 + Math.random() * 160 }));
    g.fillStyle = 'rgba(10,10,11,.18)'; g.fillRect(0, 0, W, H);
    g.font = `500 ${cs}px ${FONTS.mono}`;
    drops.forEach((d, i) => {
      d.y += d.s * dt * (1 + Math.abs(velocity) * 0.05);
      if (d.y > H + 20) { d.y = -20; d.s = 40 + Math.random() * 160; }
      g.fillStyle = Math.random() < 0.04 ? ACID : '#3b3b42';
      g.fillText(rnd(), i * cs, d.y);
    });
  });
};

// 05 — Élan : bandes croisées sensibles à la vitesse
S.s05 = (sec) => {
  const root = $('.s5', sec);
  let mq;
  const build = () => {
    root.innerHTML = '';
    const fs = Math.min(vh() * 0.12, innerWidth * (small ? 0.14 : 0.1));
    mq = createMarquees(root, ['Mouvement', 'Vitesse', 'Rythme', 'Élan'], { fs });
  };
  build();
  root.style.setProperty('--fx', ACID);
  loop($('.sc__pin', sec), (t, dt) => mq.update(RM ? 0 : dt, velocity * 28, 1));
  return { resize: build };
};

// 06 — Lecture : mots qui s'allument au fil du défilement
S.s06 = (sec) => {
  const p = $('.s6__p', sec);
  const size = () => {
    const len = p.textContent.length;
    const w = Math.min(1400, sec.clientWidth - 2 * 24), h = vh() * 0.62;
    p.style.fontSize = clamp(Math.sqrt((w * h) / (len * 0.52)), 24, 140) + 'px';
  };
  size();
  const split = SplitText.create(p, { type: 'words', wordsClass: 'w' });
  const keyWords = ['traverse,', 'regard', 'tempo,', 'orchestre.'];
  const keys = split.words.filter((w) => keyWords.includes(w.textContent.trim()));
  keys.forEach((k, i) => { k.classList.add('k'); if (i % 2) k.classList.add('hot'); });
  if (RM) { gsap.set(split.words, { color: '#0a0a0b' }); gsap.set(keys, { backgroundSize: '100% 72%' }); return { resize: size }; }
  const tl = contentTL(sec);
  split.words.forEach((w, i) => {
    tl.to(w, { color: '#0a0a0b', duration: 0.3 }, i * 0.1);
    if (keys.includes(w)) tl.to(w, { backgroundSize: '100% 72%', duration: 0.4, ease: 'power3.out' }, i * 0.1 + 0.1);
  });
  tl.to({}, { duration: 0.6 });
  return { resize: size };
};

// 07 — Rotation : cylindre 3D entraîné par le défilement
S.s07 = (sec) => {
  const stage = $('.s7__stage', sec);
  const o = { text: 'Tourne autour', speed: 0.35, color: HOT, small, touch: TOUCH, reduced: RM, extRot: 0 };
  stage.style.setProperty('--fx', HOT);
  let inst = mountCylindre(stage, o);
  if (!RM) ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onUpdate: (s) => { o.extRot = s.progress * 640; } });
  return { resize: () => { inst.destroy && inst.destroy(); inst = mountCylindre(stage, o); } };
};

// 08 — Il réagit : lettres-ressorts
S.s08 = (sec) => {
  const stage = $('.s8__stage', sec);
  const o = { text: 'Il réagit', speed: 1, mode: 'repousser', color: ACID, small, touch: TOUCH, reduced: RM };
  if (TOUCH) $('.s8__hint', sec).textContent = 'Touchez ou inclinez : chaque lettre est un ressort.';
  let inst = mountRessorts(stage, o);
  return { resize: () => { inst.destroy && inst.destroy(); inst = mountRessorts(stage, o); } };
};

// 09 — Poussière : DÉFAIT → nuage → REFAIT
S.s09 = (sec) => {
  const cv = $('.s9__cv', sec);
  const sw = createSwarm(cv, { small });
  const font = `900 {s}px ${FONTS.display}`;
  let word = 'DÉFAIT', prog = 0;
  sw.setTarget(word, { font });
  if (RM) { for (let i = 0; i < 240; i++) sw.step(0.016, { color: ACID }); return { resize: () => { sw.setTarget(word, { font }); for (let i = 0; i < 240; i++) sw.step(0.016, { color: ACID }); } }; }
  contentST(sec, { onUpdate: (s) => { prog = s.progress; } });
  loop($('.sc__pin', sec), (t, dt) => {
    const want = prog >= 0.5 ? 'REFAIT' : 'DÉFAIT';
    if (want !== word) { word = want; sw.setTarget(word, { font }); }
    const spread = Math.pow(Math.sin(Math.PI * clamp((prog - 0.08) / 0.84, 0, 1)), 1.2);
    const p = virtualPointer(t, cv.getBoundingClientRect());
    sw.step(dt, { px: p.x * DPR, py: p.y * DPR, spread: prog > 0.02 ? spread : -1, color: prog >= 0.5 ? ACID : '#eeeae1', alt: prog >= 0.5 ? '#eeeae1' : ACID, t });
  });
  return { resize: () => sw.setTarget(word, { font }) };
};

// 10 — Trouble : shader liquide
S.s10 = (sec) => {
  const stage = $('.s10__stage', sec);
  const o = { text: 'Trouble', speed: 1, color: HOT, small, touch: TOUCH, reduced: RM, extVel: 0 };
  stage.style.setProperty('--fx', HOT);
  let inst = mountLiquide(stage, o);
  gsap.ticker.add(() => { o.extVel = Math.min(1, Math.abs(velocity) / 30); });
  return { resize: () => { inst.destroy && inst.destroy(); inst = mountLiquide(stage, o); } };
};

// 11 — Lumière : les lettres comme fenêtres, puis plongée dans le I
S.s11 = (sec) => {
  const cv = $('.s11__cv', sec), h = $('.s11__t', sec);
  const draw = blobField(cv, () => ({ base: '#140b22', list: ['198,255,61', '255,77,36', '123,97,255', '255,176,0', '238,234,225', '198,255,61'] }), { count: 7 });
  let split, origin = [0, 0], iw = 1, zoom = 1;
  const fit = () => {
    if (split) split.revert();
    fitText(h, { width: sec.clientWidth * 0.94, max: vh() * 0.5 });
    split = SplitText.create(h, { type: 'chars' });
    const I = split.chars.find((c) => c.textContent === 'I') || split.chars[Math.floor(split.chars.length / 2)];
    const hr = h.getBoundingClientRect(), ir = I.getBoundingClientRect();
    origin = [ir.left - hr.left + ir.width / 2, ir.top - hr.top + ir.height * 0.55];
    iw = ir.width * 0.5;
    h.style.transformOrigin = `${origin[0]}px ${origin[1]}px`;
  };
  fit();
  if (!RM) contentST(sec, { onUpdate: (s) => {
    const p = clamp((s.progress - 0.35) / 0.65, 0, 1);
    const S = (Math.hypot(innerWidth, vh()) * 1.3) / iw;
    zoom = Math.pow(S, p * p);
    h.style.transform = `scale(${zoom})`;
  } });
  loop($('.sc__pin', sec), (t) => {
    const p = virtualPointer(t, cv.getBoundingClientRect());
    draw(t, p.x, p.y);
  });
  return { resize: fit };
};

// 12 — Chiffres : compteurs qui roulent
S.s12 = (sec) => {
  const items = $$('.s12__n', sec).map((el, i) => ({ el, v: el.dataset.v, rest: i === 3 ? '999' : '000', od: odometer(el, i === 3 ? '999' : '000'), on: false }));
  if (RM) { items.forEach((it) => it.od.set(it.v, false)); return {}; }
  contentST(sec, { onUpdate: (s) => {
    items.forEach((it, j) => {
      const want = s.progress > 0.06 + j * 0.16;
      if (want !== it.on) { it.on = want; it.od.set(want ? it.v : it.rest, true, { duration: want ? 1.6 : 0.8 }); }
    });
  } });
  return {};
};

// 13 — Gravité : des mots qui tombent et s'empilent
S.s13 = (sec) => {
  const root = $('.s13', sec);
  root.style.setProperty('--fx', ACID);
  if (TOUCH) $('.s13__hint', sec).textContent = 'Inclinez le téléphone, attrapez un mot.';
  const words = ['Tout', 'ce', 'qui', 'monte', 'finit', 'par', 'retomber,', 'même', 'les', 'mots.', 'Surtout', 'les', 'mots.'];
  let pile;
  const build = () => {
    if (pile) pile.destroy();
    root.innerHTML = '';
    const fs = clamp(Math.min(innerWidth, 1600) * (small ? 0.085 : 0.062), 26, 110);
    pile = createPile(root, words, { fs, styles: 5 });
    if (RM) pile.settleStatic();
  };
  build();
  if (RM) return { resize: build };
  let started = false;
  ScrollTrigger.create({ trigger: sec, start: 'top 30%', onEnter: () => { if (!started) { started = true; pile.reset(); } }, onLeaveBack: () => { started = false; } });
  loop(root, (t, dt) => { if (started) pile.step(dt); });
  return { resize: () => { build(); if (started) pile.reset(); } };
};

// 14 — Chaos : lettres sur l'attracteur de Lorenz
S.s14 = (sec) => {
  const cv = $('.s14__cv', sec);
  const draw = lorenzRenderer(cv, { trail: small ? 380 : 620 });
  let prog = 0;
  if (!RM) ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onUpdate: (s) => { prog = s.progress; } });
  const frame = (t) => {
    const p = virtualPointer(t, cv.getBoundingClientRect());
    const narrow = innerWidth < 760;
    draw(t, { text: 'Chaos·forme·', color: HOT, rotY: t * 0.15 + prog * 4 + (p.x / innerWidth - 0.5) * 0.8, rotX: (p.y / vh() - 0.5) * 0.6, steps: 3, scale: narrow ? 0.8 : 1, cx: narrow ? 0.5 : 0.36, cy: narrow ? 0.36 : 0.5 });
  };
  if (RM) { frame(2); return {}; }
  loop($('.sc__pin', sec), frame);
  return {};
};

// 15 — Motion : plongée dans le O, puis le tableau final
S.s15 = (sec) => {
  const layer = $('.s15__word', sec), h = $('.s15__w', sec), ring = $('.s15__o', sec), finalEl = $('.s15__final', sec);
  const boardBox = $('.s15__board', sec), typed = $('.s15__typed', sec);
  const cols = small ? 11 : 15;
  const cw = Math.min((innerWidth * 0.86) / (cols * 1.08), (vh() * 0.32) / (3 * 1.45 * 1.12));
  const board = createBoard(boardBox, { cols, rows: 3, cw });
  board.setInstant(['', '', '']);
  const msgs = small ? ['ENTREZ DANS', 'LE LAB', '25 EFFETS'] : ['ENTREZ DANS LE', 'LAB TYPO', '25 EFFETS · 15 SC'];
  const sentence = 'Le texte n’est plus posé. Il bouge, il respire, il réagit.';
  let geo = null;
  const measure = () => {
    layer.style.transform = '';
    h.style.fontSize = '100px';
    const nat = h.getBoundingClientRect().width || 1;
    h.style.fontSize = Math.min((innerWidth * 0.84 * 100) / nat, vh() * 0.42) + 'px';
    const r = ring.getBoundingClientRect(), lr = layer.getBoundingClientRect();
    const cx = r.left - lr.left + r.width / 2, cy = r.top - lr.top + r.height / 2;
    const rad = (r.width / 2) * (1 - 0.13 * 2) * 0.96;
    const hole = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${rad}px, #000 ${rad + 1}px)`;
    layer.style.webkitMaskImage = hole; layer.style.maskImage = hole;
    layer.style.transformOrigin = `${cx}px ${cy}px`;
    geo = { cx, cy, rad, S: (Math.hypot(innerWidth, vh()) * 0.62) / rad };
  };
  measure();
  let revealed = false, typing = 0;
  const type = async () => {
    const id = ++typing;
    let s = '';
    for (const ch of sentence) {
      if (id !== typing) return;
      s += ch; typed.textContent = s;
      await new Promise((r) => setTimeout(r, /[.,]/.test(ch) ? 260 : 32 + Math.random() * 40));
    }
  };
  const reveal = () => {
    if (revealed) return; revealed = true;
    board.show(msgs, 1.2);
    type();
  };
  $('.s15__top', sec).addEventListener('click', () => { if (lenis) lenis.scrollTo(0, { duration: 3.2, easing: (x) => 1 - Math.pow(1 - x, 4) }); else scrollTo(0, 0); });
  if (RM) { board.setInstant(msgs); typed.textContent = sentence; return { resize: measure }; }
  contentST(sec, { onUpdate: (s) => {
    const p = clamp((s.progress - 0.1) / 0.75, 0, 1);
    const e = p * p * (3 - 2 * p);
    const z = Math.pow(geo.S, Math.pow(p, 1.6));
    const tx = (innerWidth / 2 - geo.cx) * e, ty = (vh() / 2 - geo.cy) * e;
    layer.style.transform = `translate(${tx}px,${ty}px) scale(${z})`;
    layer.style.visibility = p >= 1 ? 'hidden' : 'visible';
    finalEl.style.transform = `scale(${0.7 + 0.3 * e})`;
    if (p > 0.85) reveal();
  } });
  return { resize: measure };
};

/* ———————————————————— Démarrage ———————————————————— */
async function boot() {
  const loader = $('.loader');
  const n = $('.loader__n'), lbar = $('.loader__bar i');
  const counter = { v: 0 };
  let countTween = null;
  if (!RM) countTween = gsap.to(counter, { v: 92, duration: 1.4, ease: 'power2.out', onUpdate: () => { n.textContent = String(Math.round(counter.v)).padStart(3, '0'); lbar.style.transform = `scaleX(${counter.v / 100})`; } });

  await fontsReady(['900 40px Anybody', '400 40px "Roboto Flex"', '800 40px Recursive', 'italic 300 40px Fraunces', '800 40px "Big Shoulders Display"', '560 40px Anybody']);
  if (!hasWebGL()) document.documentElement.classList.add('no-webgl');
  enableGyro();
  setupScroll();
  const inst = {};
  sections.forEach((sec) => { const f = S[sec.id]; if (f) { try { inst[sec.id] = f(sec) || {}; } catch (err) { console.warn('Scène ' + sec.id, err); } } });
  setupHUD();
  setupCursor();
  ScrollTrigger.refresh();

  let lastW = innerWidth;
  addEventListener('resize', debounce(() => {
    if (Math.abs(innerWidth - lastW) < 2) return;
    lastW = innerWidth;
    Object.values(inst).forEach((s) => s.resize && s.resize());
    ScrollTrigger.refresh();
  }, 300));

  if (RM) return;
  countTween && countTween.kill();
  gsap.timeline()
    .to(counter, { v: 100, duration: 0.35, ease: 'power2.out', onUpdate: () => { n.textContent = String(Math.round(counter.v)).padStart(3, '0'); lbar.style.transform = `scaleX(${counter.v / 100})`; } })
    .to('.loader__word', { yPercent: -40, opacity: 0, duration: 0.6, ease: 'expo.in' })
    .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '-=0.2')
    .add(() => inst.s01 && inst.s01.intro && inst.s01.intro(), '-=0.55')
    .set(loader, { display: 'none' });
}

boot();
