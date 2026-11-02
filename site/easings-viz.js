// Visualiseur d'easings : courbe, balle, paramètres, code à copier.
import { animate, eases, cubicBezier, steps, spring, linear, utils } from '../dist/kinetika.esm.js';
import { highlight } from './highlight.js';
import { scrollableCode } from './site.js';

const $ = (id) => document.getElementById(id);
const FAMILIES = ['Quad', 'Cubic', 'Quart', 'Quint', 'Sine', 'Expo', 'Circ', 'Back', 'Elastic', 'Bounce'];
const VARIANTS = ['in', 'out', 'inOut', 'outIn'];
const SPECIAL = { linear: 'Linéaire', bezier: 'Bézier cubique', steps: 'Escalier (steps)', spring: 'Ressort (spring)' };
const fmt = (n) => String(+n.toFixed(2)).replace(/^0\./, '.').replace(/^-0\./, '-.');

// État courant
const state = {
  fam: 'Quad', variant: 'out', duration: 1000,
  back: 1.70158, amp: 1, period: 0.3,
  bezier: [0.16, 1, 0.3, 1], steps: 6, jump: 'end',
  spring: { mass: 1, stiffness: 100, damping: 10, velocity: 0 },
};

// —— Courbe courante : fonction, chaîne et code ——
function current() {
  const { fam, variant } = state;
  if (fam === 'linear') return { fn: linear, label: 'linear', ease: "'linear'" };
  if (fam === 'bezier') {
    const [a, b, c, d] = state.bezier;
    const s = `cubicBezier(${fmt(a)}, ${fmt(b)}, ${fmt(c)}, ${fmt(d)})`;
    return { fn: cubicBezier(a, b, c, d), label: s, ease: `'${s}'` };
  }
  if (fam === 'steps') {
    const s = `steps(${state.steps}${state.jump === 'start' ? ', start' : ''})`;
    return { fn: steps(state.steps, state.jump), label: s, ease: `'${s}'` };
  }
  if (fam === 'spring') {
    const p = state.spring;
    const fn = spring(p);
    return { fn, label: `spring(${p.mass}, ${p.stiffness}, ${p.damping}${p.velocity ? `, ${p.velocity}` : ''})`, spring: true,
      ease: `spring({ mass: ${p.mass}, stiffness: ${p.stiffness}, damping: ${p.damping}, velocity: ${p.velocity} })` };
  }
  const name = variant + fam;
  let args = [];
  if (fam === 'Back' && Math.abs(state.back - 1.70158) > 1e-3) args = [state.back];
  if (fam === 'Elastic' && (state.amp !== 1 || state.period !== 0.3)) args = [state.amp, state.period];
  const label = args.length ? `${name}(${args.map(fmt).join(', ')})` : name;
  return { fn: args.length ? eases[name].with(...args) : eases[name], label, ease: `'${label}'` };
}

// —— Graphique ——
const W = 600, H = 375, PAD = { l: 44, r: 20, t: 22, b: 30 };
let range = [0, 1];
const X = (t) => PAD.l + t * (W - PAD.l - PAD.r);
const Y = (v) => PAD.t + (1 - (v - range[0]) / (range[1] - range[0])) * (H - PAD.t - PAD.b);
const sample = (fn, n = 240) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));

function drawGraph(fn) {
  const vals = sample(fn);
  range = [Math.min(0, ...vals) - 0.08, Math.max(1, ...vals) + 0.08];
  const grid = [0, 0.25, 0.5, 0.75, 1];
  $('ez-grid').innerHTML = grid.map((g) => `<line x1="${X(0)}" x2="${X(1)}" y1="${Y(g)}" y2="${Y(g)}"/><text x="${PAD.l - 10}" y="${Y(g) + 4}" text-anchor="end">${g}</text>`).join('')
    + grid.map((g) => `<line x1="${X(g)}" x2="${X(g)}" y1="${Y(range[0])}" y2="${Y(range[1])}"/>`).join('')
    + `<line class="axis" x1="${X(0)}" x2="${X(1)}" y1="${Y(0)}" y2="${Y(0)}"/><line class="axis" x1="${X(0)}" x2="${X(0)}" y1="${Y(range[0])}" y2="${Y(range[1])}"/>`
    + `<text x="${X(1)}" y="${H - 8}" text-anchor="end">temps →</text>`;
  $('ez-ref').setAttribute('d', `M${X(0)} ${Y(0)} L${X(1)} ${Y(1)}`);
  $('ez-curve').setAttribute('d', vals.map((v, i) => `${i ? 'L' : 'M'}${X(i / (vals.length - 1)).toFixed(1)} ${Y(v).toFixed(1)}`).join(' '));
}

// —— Aperçus animés, pilotés par un seul objet (t linéaire de 0 à 1) ——
const els = { dot: $('ez-dot'), gx: $('ez-gx'), gy: $('ez-gy'), ball: $('ez-ball'), bar: $('ez-bar'), sc: $('ez-scale'), rot: $('ez-rot'), op: $('ez-op'), t: $('ez-t'), to: $('ez-t-o') };
const lane = els.ball.parentElement;
let cur = current();
const driver = { t: 0 };
let player = null;
let playing = true;

function render() {
  const t = driver.t;
  const v = cur.fn(t);
  els.dot.setAttribute('cx', X(t));
  els.dot.setAttribute('cy', Y(v));
  els.gx.setAttribute('x1', X(t)); els.gx.setAttribute('x2', X(t)); els.gx.setAttribute('y1', Y(0)); els.gx.setAttribute('y2', Y(v));
  els.gy.setAttribute('x1', X(0)); els.gy.setAttribute('x2', X(t)); els.gy.setAttribute('y1', Y(v)); els.gy.setAttribute('y2', Y(v));
  const span = lane.clientWidth - 20 - 28 - 90;
  utils.set(els.ball, { x: v * span });
  utils.set(els.bar, { scaleX: v });
  utils.set(els.sc, { scale: 0.3 + 0.7 * v });
  utils.set(els.rot, { rotate: v * 180 });
  utils.set(els.op, { opacity: utils.clamp(v) });
  els.t.value = String(t);
  els.to.textContent = t.toFixed(2);
}

function duration() {
  return cur.spring ? cur.fn.duration : state.duration;
}

function restart() {
  if (player) player.cancel();
  driver.t = 0;
  player = animate(driver, {
    t: [0, 1], duration: duration(), ease: 'linear', loop: true, loopDelay: 700, onUpdate: render,
    autoplay: playing,
  });
  render();
}

function update(replay = true) {
  cur = current();
  drawGraph(cur.fn);
  $('ez-title').textContent = cur.label;
  $('ez-dur').textContent = cur.spring ? `durée calculée : ${cur.fn.duration} ms` : `${state.duration} ms`;
  $('ez-dur-group').hidden = !!cur.spring;
  const imp = cur.spring ? 'import { animate, spring } from \'kinetika\';' : 'import { animate } from \'kinetika\';';
  const code = `${imp}

animate('.balle', {
  x: 320,${cur.spring ? `\n  // durée calculée par la physique : ${cur.fn.duration} ms` : `\n  duration: ${state.duration},`}
  ease: ${cur.ease},
});`;
  const el = $('ez-code');
  el.textContent = code;
  el.innerHTML = highlight(code, 'js');
  scrollableCode();
  markMini();
  if (replay) restart(); else render();
}

// —— Contrôles ——
const famSel = $('ez-fam');
famSel.innerHTML = `<option value="linear">${SPECIAL.linear}</option>${FAMILIES.map((f) => `<option value="${f}">${f}</option>`).join('')}`
  + ['bezier', 'steps', 'spring'].map((k) => `<option value="${k}">${SPECIAL[k]}</option>`).join('');
const varBox = $('ez-var');
varBox.innerHTML = VARIANTS.map((v) => `<button type="button" data-v="${v}" aria-pressed="false">${v}</button>`).join('');

function slider(key, label, min, max, step, value, onInput, unit = '') {
  const id = `ez-p-${key}`;
  return { html: `<div class="ctl__group"><div class="ctl__head"><label class="label" for="${id}">${label}</label><output for="${id}" id="${id}-o">${value}${unit}</output></div>
<input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`, id, onInput, unit };
}

function buildParams() {
  const box = $('ez-params');
  const list = [];
  const f = state.fam;
  if (f === 'Back') list.push(slider('back', 'Dépassement', 0, 4, 0.05, +state.back.toFixed(2), (v) => { state.back = v; }));
  if (f === 'Elastic') {
    list.push(slider('amp', 'Amplitude', 1, 3, 0.05, state.amp, (v) => { state.amp = v; }));
    list.push(slider('period', 'Période', 0.1, 1, 0.01, state.period, (v) => { state.period = v; }));
  }
  if (f === 'bezier') ['x1', 'y1', 'x2', 'y2'].forEach((k, i) => list.push(slider(k, k, i % 2 ? -0.6 : 0, i % 2 ? 1.6 : 1, 0.01, state.bezier[i], (v) => { state.bezier[i] = v; })));
  if (f === 'steps') list.push(slider('steps', 'Marches', 1, 16, 1, state.steps, (v) => { state.steps = v; }));
  if (f === 'spring') {
    const s = state.spring;
    list.push(slider('mass', 'Masse (mass)', 0.1, 5, 0.1, s.mass, (v) => { s.mass = v; }));
    list.push(slider('stiffness', 'Raideur (stiffness)', 10, 400, 5, s.stiffness, (v) => { s.stiffness = v; }));
    list.push(slider('damping', 'Amortissement (damping)', 0, 40, 0.5, s.damping, (v) => { s.damping = v; }));
    list.push(slider('velocity', 'Vitesse initiale (velocity)', -20, 20, 1, s.velocity, (v) => { s.velocity = v; }));
  }
  box.innerHTML = list.map((s) => s.html).join('')
    + (f === 'steps' ? `<div class="ctl__group"><span class="label" id="ez-jump-l">Saut</span><div class="seg" id="ez-jump" role="group" aria-labelledby="ez-jump-l">${['end', 'start'].map((j) => `<button type="button" data-j="${j}" aria-pressed="${state.jump === j}">${j}</button>`).join('')}</div></div>` : '');
  box.hidden = !list.length;
  for (const s of list) {
    const input = $(s.id);
    input.addEventListener('input', () => {
      s.onInput(+input.value);
      $(`${s.id}-o`).textContent = `${input.value}${s.unit}`;
      update();
    });
  }
  const jump = $('ez-jump');
  if (jump) jump.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    state.jump = b.dataset.j;
    jump.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    update();
  });
  $('ez-var-group').hidden = !FAMILIES.includes(f);
  varBox.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === state.variant)));
  famSel.value = f;
}

famSel.addEventListener('change', () => { state.fam = famSel.value; buildParams(); update(); });
varBox.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.variant = b.dataset.v;
  buildParams();
  update();
});
$('ez-duration').addEventListener('input', (e) => {
  state.duration = +e.target.value;
  $('ez-duration-o').textContent = `${state.duration} ms`;
  update();
});
// Position manuelle : la lecture se met en pause et suit le curseur
els.t.addEventListener('input', () => {
  if (playing) togglePlay();
  driver.t = +els.t.value;
  render();
});
const playBtn = $('ez-play');
function togglePlay() {
  playing = !playing;
  playBtn.textContent = playing ? 'Pause' : 'Lecture';
  if (playing) player.play(); else player.pause();
}
playBtn.addEventListener('click', togglePlay);
$('ez-replay').addEventListener('click', () => { if (!playing) togglePlay(); restart(); });

// —— Toutes les courbes, en miniatures ——
const mini = (fn) => {
  const vals = sample(fn, 80);
  const lo = Math.min(0, ...vals), hi = Math.max(1, ...vals);
  const x = (t) => 4 + t * 92;
  const y = (v) => 4 + (1 - (v - lo) / (hi - lo)) * 58;
  return `<svg viewBox="0 0 100 66" aria-hidden="true"><path class="base" d="M4 ${y(0)}H96"/><path d="${vals.map((v, i) => `${i ? 'L' : 'M'}${x(i / 80).toFixed(1)} ${y(v).toFixed(1)}`).join('')}"/></svg>`;
};
const presets = [
  { key: 'linear', label: 'linear', set: () => { state.fam = 'linear'; } },
  { key: 'bz-doux', label: 'cubicBezier(.16, 1, .3, 1)', set: () => { state.fam = 'bezier'; state.bezier = [0.16, 1, 0.3, 1]; } },
  { key: 'bz-css', label: 'cubicBezier(.42, 0, .58, 1)', set: () => { state.fam = 'bezier'; state.bezier = [0.42, 0, 0.58, 1]; } },
  { key: 'steps', label: 'steps(6)', set: () => { state.fam = 'steps'; state.steps = 6; state.jump = 'end'; } },
  { key: 'sp-souple', label: 'spring(1, 100, 10)', set: () => { state.fam = 'spring'; state.spring = { mass: 1, stiffness: 100, damping: 10, velocity: 0 }; } },
  { key: 'sp-vif', label: 'spring(1, 220, 7)', set: () => { state.fam = 'spring'; state.spring = { mass: 1, stiffness: 220, damping: 7, velocity: 0 }; } },
  { key: 'sp-lourd', label: 'spring(3, 120, 22)', set: () => { state.fam = 'spring'; state.spring = { mass: 3, stiffness: 120, damping: 22, velocity: 0 }; } },
];
const fnOf = { 'bz-doux': cubicBezier(0.16, 1, 0.3, 1), 'bz-css': cubicBezier(0.42, 0, 0.58, 1), steps: steps(6), 'sp-souple': spring({}), 'sp-vif': spring({ stiffness: 220, damping: 7 }), 'sp-lourd': spring({ mass: 3, stiffness: 120, damping: 22 }), linear };
$('ez-all').className = 'ez-groups';
$('ez-all').innerHTML = FAMILIES.map((f) => `<div class="ez-group"><p class="label">${f}</p><div class="ez-all">${VARIANTS.map((v) => `<button class="ez-mini" type="button" data-fam="${f}" data-v="${v}" aria-pressed="false">${mini(eases[v + f])}<span>${v + f}</span></button>`).join('')}</div></div>`).join('')
  + `<div class="ez-group ez-group--wide"><p class="label">Linéaire, Bézier, escaliers, ressorts</p><div class="ez-all">${presets.map((p) => `<button class="ez-mini" type="button" data-preset="${p.key}" aria-pressed="false">${mini(fnOf[p.key])}<span>${p.label}</span></button>`).join('')}</div></div>`;
function markMini() {
  document.querySelectorAll('.ez-mini').forEach((b) => {
    const on = b.dataset.fam ? b.dataset.fam === state.fam && b.dataset.v === state.variant && cur.label === b.dataset.v + b.dataset.fam
      : cur.label.replace(/\s/g, '') === b.textContent.replace(/\s/g, '').replace(/(^|[(,])0\./g, '$1.');
    b.setAttribute('aria-pressed', String(on));
  });
}
$('ez-all').addEventListener('click', (e) => {
  const b = e.target.closest('.ez-mini');
  if (!b) return;
  if (b.dataset.fam) {
    state.fam = b.dataset.fam;
    state.variant = b.dataset.v;
    state.back = 1.70158; state.amp = 1; state.period = 0.3;
  } else presets.find((p) => p.key === b.dataset.preset).set();
  buildParams();
  update();
  document.querySelector('.ez-stage').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
});

// Lien direct : #outElastic, #spring…
const fromHash = decodeURIComponent(location.hash.slice(1));
const m = fromHash.match(/^(in|out|inOut|outIn)([A-Z]\w+)$/);
if (m && FAMILIES.includes(m[2])) { state.variant = m[1]; state.fam = m[2]; }
else if (['linear', 'bezier', 'steps', 'spring'].includes(fromHash)) state.fam = fromHash;
buildParams();
update();
addEventListener('resize', render);
