// Visualiseur de stagger : valeurs par point, origine au clic, code à copier.
import { animate, stagger, engine } from '../dist/kinetika.esm.js';
import { highlight } from './highlight.js';

const $ = (id) => document.getElementById(id);
const S = { mode: 'grid', cols: 12, rows: 7, count: 18, each: 50, from: 'center', index: 0, axis: '', ease: '', start: 0, seed: 1, reversed: false };
const EASES = ['', 'inQuad', 'outQuad', 'inOutQuad', 'inCubic', 'outCubic', 'inExpo', 'outExpo', 'inOutSine'];
const grid = $('st-grid');
let dots = [];
let values = [];
let focusIndex = 0;

function seg(box, items, key, onPick) {
  box.innerHTML = items.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${S[key] === v}">${l}</button>`).join('');
  box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    S[key] = b.dataset.v;
    onPick?.();
    sync();
  });
}
const pressed = (box, v) => box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));

seg($('st-from'), [['first', 'first'], ['center', 'center'], ['last', 'last'], ['random', 'random'], ['index', 'index']], 'from');
seg($('st-axis'), [['', 'aucun'], ['x', 'x'], ['y', 'y']], 'axis');
$('st-mode').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  S.mode = b.dataset.v;
  if (S.mode === 'line' && S.axis) S.axis = '';
  build();
});
$('st-ease').innerHTML = EASES.map((e) => `<option value="${e}">${e || 'aucun (linéaire)'}</option>`).join('');

function range(id, key, out, suffix = '') {
  const el = $(id);
  el.addEventListener('input', () => {
    S[key] = +el.value;
    if (out) $(out).textContent = el.value + suffix;
    if (key === 'cols' || key === 'rows' || key === 'count') build(); else sync();
  });
}

function dims() {
  const box = $('st-dims');
  box.innerHTML = S.mode === 'grid'
    ? `<div class="ctl__group"><div class="ctl__head"><label class="label" for="st-cols">Colonnes</label><output id="st-cols-o">${S.cols}</output></div><input type="range" id="st-cols" min="2" max="20" value="${S.cols}"></div>
       <div class="ctl__group"><div class="ctl__head"><label class="label" for="st-rows">Lignes</label><output id="st-rows-o">${S.rows}</output></div><input type="range" id="st-rows" min="1" max="14" value="${S.rows}"></div>`
    : `<div class="ctl__group"><div class="ctl__head"><label class="label" for="st-count">Éléments</label><output id="st-count-o">${S.count}</output></div><input type="range" id="st-count" min="3" max="40" value="${S.count}"></div>`;
  if (S.mode === 'grid') { range('st-cols', 'cols', 'st-cols-o'); range('st-rows', 'rows', 'st-rows-o'); } else range('st-count', 'count', 'st-count-o');
}

function total() { return S.mode === 'grid' ? S.cols * S.rows : S.count; }

function build() {
  const n = total();
  const cols = S.mode === 'grid' ? S.cols : Math.min(S.count, 20);
  grid.style.setProperty('--cols', cols);
  grid.innerHTML = Array.from({ length: n }, (_, i) => `<button class="st-dot" type="button" tabindex="-1" data-i="${i}"><i></i><span></span></button>`).join('');
  dots = [...grid.children];
  if (S.index >= n) S.index = 0;
  focusIndex = Math.min(focusIndex, n - 1);
  dots[focusIndex].tabIndex = 0;
  pressed($('st-mode'), S.mode);
  dims();
  sync();
}

function options() {
  const o = {};
  if (S.from === 'index') o.from = S.index;
  else if (S.from !== 'first') o.from = S.from;
  if (S.mode === 'grid') o.grid = [S.cols, S.rows];
  if (S.mode === 'grid' && S.axis) o.axis = S.axis;
  if (S.ease) o.ease = S.ease;
  if (S.start) o.start = S.start;
  if (S.reversed) o.reversed = true;
  if (S.from === 'random') o.seed = S.seed;
  return o;
}

function codeFor(o) {
  const parts = Object.entries(o).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : typeof v === 'string' ? `'${v}'` : v}`);
  const opt = parts.length ? `, { ${parts.join(', ')} }` : '';
  return `import { animate, stagger } from 'kinetika';

animate('.point', {
  scale: [{ to: 1.6, duration: 220 }, { to: 1, ease: 'outElastic(1, .5)' }],
  delay: stagger(${S.each}${opt}),
});`;
}

function sync() {
  const n = total();
  const o = options();
  const fn = stagger(S.each, o);
  values = dots.map((d, i) => fn(d, i, n));
  const min = Math.min(...values);
  const max = Math.max(...values);
  dots.forEach((d, i) => {
    const v = values[i];
    const h = max > min ? (v - min) / (max - min) : 0;
    d.style.setProperty('--h', h.toFixed(3));
    d.querySelector('span').textContent = Math.round(v);
    d.classList.toggle('is-from', S.from === 'index' && i === S.index);
    d.setAttribute('aria-label', `Point ${i + 1} : ${Math.round(v)} ms${S.from === 'index' && i === S.index ? ', origine' : ''}`);
  });
  $('st-stats').textContent = `${n} éléments · de ${Math.round(min)} à ${Math.round(max)} ms`;
  pressed($('st-from'), S.from);
  pressed($('st-axis'), S.axis);
  $('st-axis-g').hidden = S.mode !== 'grid';
  $('st-seed-g').style.visibility = S.from === 'random' ? 'visible' : 'hidden';
  const code = codeFor(o);
  const el = $('st-code');
  el.textContent = code;
  el.innerHTML = highlight(code, 'js');
  play();
}

let timer = 0;
function play() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const min = Math.min(...values);
    const inner = dots.map((d) => d.querySelector('i'));
    animate(inner, {
      scale: [{ to: 1.6, duration: 220, ease: 'outQuad' }, { to: 1, duration: 700, ease: 'outElastic(1, .5)' }],
      delay: (el, i) => values[i] - min,
    });
  }, 120);
}

// Choix de l'origine : clic, ou clavier (flèches + Entrée)
grid.addEventListener('click', (e) => {
  const d = e.target.closest('.st-dot');
  if (!d) return;
  S.index = +d.dataset.i;
  S.from = 'index';
  setFocus(S.index, false);
  sync();
});
function setFocus(i, move = true) {
  dots[focusIndex].tabIndex = -1;
  focusIndex = i;
  dots[i].tabIndex = 0;
  if (move) dots[i].focus();
}
grid.addEventListener('keydown', (e) => {
  const cols = S.mode === 'grid' ? S.cols : Math.min(S.count, 20);
  const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
  if (e.key in moves) {
    e.preventDefault();
    const j = focusIndex + moves[e.key];
    if (j >= 0 && j < dots.length) setFocus(j);
  } else if (e.key === 'Home') { e.preventDefault(); setFocus(0); } else if (e.key === 'End') { e.preventDefault(); setFocus(dots.length - 1); }
});

range('st-each', 'each', 'st-each-o');
range('st-start', 'start', 'st-start-o');
range('st-seed', 'seed', 'st-seed-o');
$('st-ease').addEventListener('change', (e) => { S.ease = e.target.value; sync(); });
$('st-rev').addEventListener('change', (e) => { S.reversed = e.target.checked; sync(); });
$('st-values').addEventListener('change', (e) => grid.classList.toggle('show-values', e.target.checked));
$('st-play').addEventListener('click', play);
build();

// Une vague de bienvenue qui part du centre, puis d'un coin
if (!engine.prefersReducedMotion) setTimeout(play, 500);
