// Accueil : chaque démonstration est réalisée avec Kinetika.
import {
  animate, timeline, stagger, splitText, scramble, typewriter, odometer, onScroll,
  drawable, motionPath, spring, engine, utils, easeNames,
} from '../dist/kinetika.esm.js';
import { mountThumbs } from './thumbs.js';
import { examples } from '../exemples/catalogue.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = engine.prefersReducedMotion;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ——— Ouverture : le mot-titre ——— */
const word = $('.hero__word');
const split = splitText(word, { chars: true, words: false });
word.classList.add('is-split');
const chars = split.chars;

const intro = timeline({ defaults: { ease: 'outElastic(1, .45)' } });
intro
  .add(chars, {
    y: (el, i) => [i % 2 ? '-0.85em' : '0.85em', 0],
    rotateX: (el, i) => [i % 2 ? 95 : -95, 0],
    opacity: { to: [0, 1], duration: 500, ease: 'outQuad' },
    '--w': [40, 100],
    duration: 1900,
    delay: stagger(80, { from: 'center' }),
  })
  .add(chars, { '--g': [800, 300, 800], duration: 1200, ease: 'inOutSine', delay: stagger(60) }, '-=1300');

// Respiration continue : chaque lettre a sa propre phase
intro.then(() => {
  if (reduced) return;
  chars.forEach((c, i) => {
    animate(c, { '--w': [100, i % 2 ? 140 : 62], duration: 2600, ease: 'inOutSine', loop: true, alternate: true, delay: i * 170 });
  });
});

// Les lettres prennent du poids près du pointeur
if (!reduced && fine) {
  const hero = $('.hero');
  let px = null;
  let queued = false;
  const update = () => {
    queued = false;
    for (const c of chars) {
      const r = c.getBoundingClientRect();
      const d = px === null ? Infinity : Math.abs(px - (r.left + r.width / 2));
      const g = px === null ? 800 : utils.mapRange(utils.clamp(d / (innerWidth * 0.22)), 0, 1, 950, 260);
      animate(c, { '--g': g, duration: 700, ease: 'outQuad' });
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  hero.addEventListener('pointermove', (e) => { px = e.clientX; queue(); });
  hero.addEventListener('pointerleave', () => { px = null; queue(); });
}

/* ——— Règle : une tête de lecture qui change d'easing à chaque passage ——— */
const ruler = $('.ruler');
const head = $('.ruler__head');
const tRead = $('.ruler__t');
const eRead = $('.ruler__e');
const rulerEases = ['outElastic(1, .45)', 'inOutExpo', 'outBounce', 'spring(1, 90, 9)', 'inOutBack(1.7)', 'steps(8)', 'outCirc'];
let ri = 0;
const runRuler = () => {
  const ease = rulerEases[ri++ % rulerEases.length];
  eRead.textContent = ease;
  animate(head, {
    left: ['0%', '100%'],
    duration: 2400,
    ease,
    onUpdate: (a) => { tRead.textContent = `t = ${String(Math.round(a.currentTime)).padStart(4, '0')} ms`; },
    onComplete: () => { if (!reduced) setTimeout(runRuler, 700); },
  });
};
if (ruler) runRuler();

/* ——— Bandeau : vitesse et inclinaison suivent le défilement ——— */
const words = ['animate', 'timeline', 'stagger', 'spring', 'splitText', 'onScroll', 'drawable', 'motionPath', 'scramble', 'odometer'];
const bands = $$('.ticker__band').map((band, bi) => {
  const track = $('.ticker__track', band);
  const list = bi ? [...words].reverse() : words;
  const unit = `<span class="ticker__unit">${list.map((w, k) => (k % 3 === 1 ? `<em>${w}</em>` : w)).join(' <i>✦</i> ')} <i>✦</i></span>`;
  track.innerHTML = unit;
  const uw = track.firstChild.getBoundingClientRect().width || 1000;
  track.innerHTML = unit.repeat(Math.ceil((innerWidth * 1.4) / uw) + 1);
  return { band, track, uw, x: -uw * (bi ? 0.5 : 0), dir: bi ? 1 : -1, rot: bi ? 1.5 : -2 };
});
const pageScroll = onScroll();
let tickerVisible = true;
new IntersectionObserver((e) => { tickerVisible = e[0].isIntersecting; }).observe($('.ticker'));
if (!reduced) {
  engine.onFrame((dt) => {
    if (!tickerVisible) return;
    const v = utils.clamp(pageScroll.velocity, -4000, 4000);
    const skew = utils.clamp(v * 0.006, -14, 14);
    for (const b of bands) {
      b.x += b.dir * (60 + Math.abs(v) * 0.35) * (dt / 1000) * (v < 0 ? -1 : 1);
      b.x = utils.wrap(b.x, -b.uw, 0);
      b.track.style.transform = `translateX(${b.x.toFixed(1)}px) skewX(${(skew * b.dir).toFixed(2)}deg)`;
    }
  });
}

/* ——— 01 animate() ——— */
const animStage = $('.stage-anim');
let shapes = null;
const buildShapes = () => {
  if (shapes) shapes.revert();
  shapes = animate('.forme', {
    x: (el) => [0, el.parentNode.clientWidth - el.offsetWidth],
    rotate: '1turn',
    borderRadius: ['4px', '50%'],
    backgroundColor: ['#ff5b2b', '#d9ff42'],
    delay: stagger(140),
    duration: 1600,
    ease: 'inOutExpo',
    loop: true,
    alternate: true,
    autoplay: onScroll({ target: animStage, sync: 'resume pause resume pause' }),
  });
};
buildShapes();
let resizeTimer = 0;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(buildShapes, 200); });

/* ——— 02 timeline() : storyboard ——— */
const sbTitle = splitText('.sb-card__title', { chars: true, mask: 'chars' });
const sb = timeline({
  defaults: { ease: 'outExpo', duration: 700 },
  loop: true,
  loopDelay: 1400,
  autoplay: onScroll({ target: '.storyboard', sync: 'resume pause resume pause' }),
});
sb.add('.sb-card', { scale: [0.8, 1], opacity: [0, 1] })
  .add(sbTitle.chars, { y: ['110%', 0], delay: stagger(40) }, '-=400')
  .label('barre')
  .add('.sb-card__bar i', { scaleX: [0, 1], duration: 900 }, '<<+=150')
  .add('.sb-card__dots i', { scale: [0, 1], delay: stagger(60) }, 'barre')
  .add('.sb-card__badge', { rotate: [-30, -6], scale: [0, 1], ease: 'outBack(2)' }, '+=50');

const tracksEl = $('.sb__tracks');
const names = ['carte', 'lettres', 'barre', 'points', 'badge'];
const D = sb.iterationDuration;
const pct = (t) => `${(t / D) * 100}%`;
tracksEl.innerHTML = `<div class="sb__ruler">${[0, 0.25, 0.5, 0.75, 1].map((k) => `<span style="left:${k * 100}%">${Math.round(D * k)}</span>`).join('')}</div>`
  + sb.children.map((c, i) => `<div class="sb__track"><span style="left:${pct(c.start)};width:${pct(c.end - c.start)}">${names[i]}</span></div>`).join('')
  + Object.entries(sb.labels).map(([n, t]) => `<span class="sb__label" style="left:calc(16px + (100% - 32px) * ${t / D})">◆ ${n}</span>`).join('')
  + '<i class="sb__head"></i>';
const sbHead = $('.sb__head', tracksEl);
const sbBars = $$('.sb__track span', tracksEl);
const sbRange = $('.sb__scrub input');
const sbTime = $('.sb__time');
const sbPlay = $('[data-sb="play"]');
const kids = sb.children;
const paintStoryboard = () => {
  const local = Math.min(D, Math.max(0, sb.progress * D));
  sbHead.style.left = `calc(16px + (100% - 32px) * ${local / D})`;
  sbBars.forEach((b, i) => b.classList.toggle('is-on', local >= kids[i].start && local <= kids[i].end));
  sbRange.value = String(Math.round((local / D) * 1000));
  sbTime.textContent = `${Math.round(local)} ms`;
};
engine.onFrame(paintStoryboard);
sbRange.addEventListener('input', () => {
  sb.pause();
  sbPlay.textContent = 'Lecture';
  sb.progress = sbRange.valueAsNumber / 1000;
  paintStoryboard();
});
sbPlay.addEventListener('click', () => {
  if (sb.paused) { sb.play(); sbPlay.textContent = 'Pause'; } else { sb.pause(); sbPlay.textContent = 'Lecture'; }
});
$('[data-sb="reverse"]').addEventListener('click', () => { sb.reverse(); sbPlay.textContent = 'Pause'; });
paintStoryboard();

/* ——— 03 stagger() : grille ——— */
const dotsEl = $('.dots');
const small = innerWidth < 640;
const cols = small ? 9 : 16;
const rows = small ? 11 : 9;
dotsEl.style.setProperty('--cols', cols);
$('.dots__g').textContent = `${cols}, ${rows}`;
dotsEl.innerHTML = Array.from({ length: cols * rows }, (_, i) => `<button class="dot" type="button" tabindex="${i ? -1 : 0}" aria-label="Lancer une onde depuis le point ${i + 1}"></button>`).join('');
const dots = $$('.dot', dotsEl);
let lastUser = 0;
const wave = (from) => {
  $('.dots__from').textContent = String(from);
  animate(dots, {
    scale: [{ to: 0.3, duration: 220, ease: 'outQuad' }, { to: 1, duration: 1100, ease: 'outElastic(1, .4)' }],
    backgroundColor: [{ to: '#ff5b2b', duration: 160, ease: 'linear' }, { to: '#2a2724', duration: 1300, ease: 'outQuad' }],
    delay: stagger(28, { grid: [cols, rows], from }),
  });
};
dotsEl.addEventListener('click', (e) => {
  const d = e.target.closest('.dot');
  if (!d) return;
  lastUser = performance.now();
  wave(dots.indexOf(d));
});
// grille au clavier : une seule tabulation, flèches pour se déplacer
dotsEl.addEventListener('keydown', (e) => {
  const i = dots.indexOf(document.activeElement);
  if (i < 0) return;
  const move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, Home: -i, End: dots.length - 1 - i }[e.key];
  if (move === undefined) return;
  e.preventDefault();
  const j = utils.clamp(i + move, 0, dots.length - 1);
  dots[i].tabIndex = -1;
  dots[j].tabIndex = 0;
  dots[j].focus();
});
let dotsVisible = false;
onScroll({ target: dotsEl, onEnter: () => { dotsVisible = true; }, onLeave: () => { dotsVisible = false; }, onEnterBack: () => { dotsVisible = true; }, onLeaveBack: () => { dotsVisible = false; } });
if (!reduced) {
  setInterval(() => {
    if (dotsVisible && document.visibilityState === 'visible' && performance.now() - lastUser > 6000) wave(utils.random(0, dots.length - 1) | 0);
  }, 3400);
}

/* ——— 04 spring() ——— */
const sStage = $('.spring__stage');
const ball = $('.spring__ball');
const ring = $('.spring__target');
const params = { mass: 1, stiffness: 120, damping: 8 };
const springPath = $('.spring__path');
const drawSpring = () => {
  const sp = spring(params);
  let d = '';
  for (let k = 0; k <= 120; k++) {
    const v = sp(k / 120);
    const y = 115 - ((utils.clamp(v, -0.25, 1.65) + 0.25) / 1.9) * 110;
    d += `${k ? 'L' : 'M'}${(k / 120) * 300} ${y.toFixed(1)}`;
  }
  springPath.setAttribute('d', d);
  $('.o-dur').textContent = String(sp.duration);
  for (const k of Object.keys(params)) {
    $(`.v-${k}`).textContent = String(params[k]);
    $(`.o-${k}`).textContent = String(params[k]);
  }
  $('.spring__base').setAttribute('d', `M0 ${115 - (1.25 / 1.9) * 110} H300`);
};
$$('.spring__panel input').forEach((inp) => inp.addEventListener('input', () => { params[inp.dataset.k] = inp.valueAsNumber; drawSpring(); }));
drawSpring();
const place = (x, y, instant) => {
  animate(ring, { x, y, opacity: [1, 0], scale: [0.4, 2.4], duration: 700, ease: 'outQuad' });
  if (instant) animate(ball, { x, y, duration: 0 });
  else animate(ball, { x, y, ease: spring(params) });
};
const sRect = () => sStage.getBoundingClientRect();
place(sRect().width * 0.3, sRect().height * 0.5, true);
sStage.addEventListener('pointerdown', (e) => {
  const r = sRect();
  place(e.clientX - r.left, e.clientY - r.top);
  $('.spring__hint').style.opacity = '0';
});
sStage.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  const r = sRect();
  place(utils.random(40, r.width - 40), utils.random(40, r.height - 40));
});

/* ——— 05 texte ——— */
let splitBlock = null;
const playSplit = () => {
  if (splitBlock) splitBlock.revert();
  splitBlock = splitText('.tcard__split', { lines: true, words: true, chars: true, mask: 'lines' });
  timeline()
    .add(splitBlock.lines, { y: ['105%', 0], duration: 900, delay: stagger(120), ease: 'outExpo' })
    .add(splitBlock.chars, { '--g': [250, 760], duration: 600, delay: stagger(9), ease: 'outQuad' }, '-=500');
};
const scrEl = $('.tcard__scr');
const scrTexts = ['SIGNAL', 'BRUIT', 'SENS.'];
let si = 0;
const playScramble = () => scramble(scrEl, { text: scrTexts[si++ % scrTexts.length], duration: 1400, reveal: si % 2 ? 'random' : 'ltr' });
const odo = odometer('.tcard__odo', { from: '0000', duration: 1600, stagger: 90 });
const playOdo = (first) => odo.set(first ? '2026' : String(utils.random(1000, 9999) | 0));
onScroll({ target: '.textgrid', enter: 'top 85%', onEnter: () => { playSplit(); playScramble(); playOdo(true); } });
$('[data-replay="split"]').addEventListener('click', playSplit);
$('[data-replay="scramble"]').addEventListener('click', playScramble);
$('[data-replay="odometer"]').addEventListener('click', () => playOdo(false));
typewriter('.tcard__type', { text: ['Ça bouge.', 'Ça respire.', 'Ça réagit.', 'Ça se lit.'], speed: 14, hold: 1500 });

/* ——— 06 défilement ——— */
const rng = utils.createRandom(11);
const sws = $$('.sw');
const pctEl = $('.scrub__pct');
const scrub = timeline({
  autoplay: onScroll({ target: '.scrub', enter: 'top top', leave: 'bottom bottom', scrub: 0.6 }),
  defaults: { ease: 'outQuad' },
  onUpdate: (tl) => { pctEl.textContent = `${String(Math.round(tl.progress * 100)).padStart(3, '0')}%`; },
});
scrub
  .add(sws, {
    x: () => [rng(-0.38, 0.38) * innerWidth, 0],
    y: () => [rng(-0.3, 0.3) * innerHeight, 0],
    rotate: () => [rng(-35, 35), 0],
    scale: [0.45, 1],
    opacity: [0.1, 1],
    duration: 1000,
    delay: stagger(160),
  })
  .add('.sw--o', { color: ['rgba(243, 238, 228, 0)', '#f3eee4'], duration: 500 }, '-=200')
  .add('.scrub__words', { scale: [1, 0.9], letterSpacing: ['-0.03em', '0.01em'], duration: 600 }, '<<')
  .add('.scrub__bar i', { scaleX: [0, 1], duration: scrub.iterationDuration + 600, ease: 'linear' }, 0);

/* ——— 07 SVG ——— */
const roadTrail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
roadTrail.setAttribute('d', $('#road').getAttribute('d'));
roadTrail.setAttribute('class', 'svg-trail');
roadTrail.style.cssText = 'fill:none;stroke:#d9ff42;stroke-width:3;stroke-linecap:round';
$('#road').after(roadTrail);
const kDraw = drawable('.svg-k');
const trail = drawable(roadTrail);
const playSvg = () => timeline({ defaults: { ease: 'inOutQuart' } })
  .add(kDraw, { draw: [0, 1], duration: 1400 })
  .add('.svg-dot', { r: [0, 14], duration: 700, ease: 'outBack(2.4)' }, '-=300')
  .add('.svg-arrow', { ...motionPath('#road'), duration: 2600, ease: 'inOutSine' }, '-=200')
  .add(trail, { draw: [0, 1], duration: 2600, ease: 'inOutSine' }, '<<');
let svgTl = null;
onScroll({ target: '.svgdemo', enter: 'top 75%', onEnter: () => { svgTl = playSvg(); } });
$('[data-replay="svg"]').addEventListener('click', () => { if (svgTl) svgTl.cancel(); svgTl = playSvg(); });

/* ——— Chiffres ——— */
const counters = $$('[data-odo]');
const counts = { 1: '0', 2: String(easeNames.length), 3: String(examples.length) };
counters.forEach((el, i) => { if (counts[i]) { el.dataset.odo = counts[i]; el.textContent = counts[i]; } });
fetch(new URL('../dist/sizes.json', import.meta.url))
  .then((r) => (r.ok ? r.json() : null))
  .then((s) => {
    const g = s && s['kinetika.esm.min.js'] && parseFloat(s['kinetika.esm.min.js'].gzip);
    if (g) { counters[0].dataset.odo = String(Math.round(g)); counters[0].textContent = counters[0].dataset.odo; }
  })
  .catch(() => {})
  .finally(() => {
    const odos = counters.map((el) => odometer(el, { from: el.dataset.odo.replace(/\d/g, '0'), duration: 1800, stagger: 120 }));
    onScroll({ target: '.stats', enter: 'top 80%', onEnter: () => odos.forEach((o, k) => setTimeout(() => o.set(counters[k].dataset.odo), k * 140)) });
  });

/* ——— Galerie ——— */
const teaser = $('.teaser');
if (teaser) mountThumbs(teaser, teaser.dataset.ids.split(','), '');
$('.teaser__more a').innerHTML = `Les ${examples.length} exemples <span class="arr" aria-hidden="true">→</span>`;

/* ——— Entrées des titres de section ——— */
$$('.sec__title').forEach((t) => {
  const s = splitText(t, { words: true, chars: false, mask: 'words' });
  animate(s.words, { y: ['105%', 0], duration: 1000, delay: stagger(70), ease: 'outExpo', autoplay: onScroll({ target: t, enter: 'top 88%' }) });
});
