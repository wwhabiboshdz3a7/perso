// Page d'effet isolé : habillage, réglages, rejouer, mode vignette (?thumb).
import { EFFECTS, bySlug } from './registry.js';
import { RM, TOUCH, SMALL, debounce, enableGyro, fontsReady } from '../core.js';

const clean = (s) => String(s || '').replace(/'/g, '’').replace(/[<>&"`]/g, '').slice(0, 48);

const COLORS = ['#c6ff3d', '#ff4d24', '#7b61ff', '#ffb000', '#eeeae1'];
const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/></svg>';

export async function boot(slug) {
  const meta = bySlug(slug);
  const params = new URLSearchParams(location.search);
  const thumb = params.has('thumb');
  document.body.classList.toggle('thumb', thumb);
  if (meta.tone === 'light') document.body.classList.add('light');
  const stage = document.getElementById('stage');
  const [mod] = await Promise.all([
    import(`../fx/${slug}.js`),
    fontsReady(['900 40px Anybody', '400 40px "Roboto Flex"', '400 40px Recursive', 'italic 300 40px Fraunces', '800 40px "Big Shoulders Display"'])
  ]);

  const o = {
    text: clean(params.get('t')) || meta.text,
    speed: 1,
    color: meta.color,
    mode: meta.modes ? meta.modes[0] : null,
    thumb, reduced: RM, small: SMALL() || thumb, touch: TOUCH
  };
  stage.style.setProperty('--fx', o.color);
  document.documentElement.style.setProperty('--fx-c', o.color);

  let inst = null;
  const mount = () => {
    if (inst && inst.destroy) inst.destroy();
    stage.innerHTML = '';
    inst = mod.mount(stage, o) || {};
  };
  mount();
  enableGyro();

  if (thumb) {
    // Vignette : rejoue périodiquement les effets à entrée unique.
    if (mod.loopEvery) setInterval(() => { if (!document.hidden) (inst.replay ? inst.replay() : mount()); }, mod.loopEvery * 1000);
    return;
  }

  // ——— Habillage ———
  const i = EFFECTS.indexOf(meta);
  const prev = EFFECTS[(i - 1 + EFFECTS.length) % EFFECTS.length];
  const next = EFFECTS[(i + 1) % EFFECTS.length];
  const bar = document.createElement('header');
  bar.className = 'lab-bar';
  bar.innerHTML = `<a class="lab-back" href="../">← Lab</a>
    <div class="lab-title"><b>${meta.n}</b><h1>${meta.name}</h1></div>
    <span class="tag">${meta.technique}</span>`;
  const panel = document.createElement('div');
  panel.className = 'lab-panel';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Réglages de l’effet');
  panel.innerHTML = `
    <label><span>Texte</span><input type="text" maxlength="48" value="${o.text.replace(/"/g, '&quot;')}" aria-label="Texte de l’effet"></label>
    <label><span>Vitesse</span><input type="range" min="0.25" max="2.5" step="0.05" value="1" aria-label="Vitesse"></label>
    <div class="swatches" role="group" aria-label="Couleur">${COLORS.map((c) => `<button type="button" style="background:${c}" data-c="${c}" aria-label="Couleur ${c}" aria-pressed="${c === o.color}"></button>`).join('')}</div>
    ${meta.modes ? `<div class="seg" role="group" aria-label="Mode">${meta.modes.map((m, k) => `<button type="button" data-m="${m}" aria-pressed="${k === 0}">${m}</button>`).join('')}</div>` : ''}
    <button class="replay" type="button">${ICON}Rejouer</button>`;
  const nav = `<a class="lab-nav prev" href="../${prev.slug}/" aria-label="Effet précédent : ${prev.name}">←</a><a class="lab-nav next" href="../${next.slug}/" aria-label="Effet suivant : ${next.name}">→</a>`;
  document.body.append(bar, panel);
  document.body.insertAdjacentHTML('beforeend', nav + '<div class="grain" aria-hidden="true"></div>');

  const txt = panel.querySelector('input[type="text"]');
  txt.addEventListener('input', debounce(() => { o.text = clean(txt.value.trim()) || meta.text; mount(); }, 350));
  panel.querySelector('input[type="range"]').addEventListener('input', (e) => {
    o.speed = parseFloat(e.target.value);
    if (inst.speed) inst.speed(o.speed);
  });
  panel.querySelectorAll('.swatches button').forEach((b) => b.addEventListener('click', () => {
    panel.querySelectorAll('.swatches button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    o.color = b.dataset.c;
    stage.style.setProperty('--fx', o.color);
    document.documentElement.style.setProperty('--fx-c', o.color);
    if (inst.color) inst.color(o.color); else mount();
  }));
  panel.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
    panel.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    o.mode = b.dataset.m;
    if (inst.mode) inst.mode(o.mode); else mount();
  }));
  panel.querySelector('.replay').addEventListener('click', () => (inst.replay ? inst.replay() : mount()));
  addEventListener('keydown', (e) => { if (e.key === 'r' && document.activeElement !== txt) (inst.replay ? inst.replay() : mount()); });
  addEventListener('resize', debounce(() => { if (!inst.resize) mount(); else inst.resize(); }, 250));

  // Curseur
  if (!TOUCH) {
    const cur = document.createElement('div');
    cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);
    const qx = gsap.quickTo(cur, 'x', { duration: .25, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: .25, ease: 'power3' });
    addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); });
    document.querySelectorAll('a,button,input').forEach((el) => {
      el.addEventListener('pointerenter', () => cur.classList.add('is-big'));
      el.addEventListener('pointerleave', () => cur.classList.remove('is-big'));
    });
  }
}
