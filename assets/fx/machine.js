import { injectCSS, clamp } from '../core.js';

export const loopEvery = 0;

injectCSS('machine', `
.tw { width: min(1300px, 90vw); }
.tw__k { color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 3vh; display: flex; gap: 2em; }
.tw__k b { color: var(--fx); font-weight: 400; }
.tw__t { margin: 0; font-family: var(--f-serif); font-weight: 300; line-height: 1.02; letter-spacing: -.03em; color: var(--paper);
  font-variation-settings: "opsz" 144, "SOFT" 50, "WONK" 1; min-height: 2.1em; }
.tw__t .bad { color: var(--hot); text-decoration: underline wavy var(--hot) 2px; text-underline-offset: .12em; }
.tw__t .sel { background: var(--fx); color: var(--ink); }
.tw__c { display: inline-block; width: .06em; height: .95em; margin-left: .04em; vertical-align: -.12em; background: var(--fx); animation: twb 1s steps(1) infinite; }
.tw__c.on { animation: none; }
@keyframes twb { 50% { opacity: 0; } }
`);

export function mount(stage, o) {
  stage.innerHTML = `<div class="tw"><div class="tw__k mono"><span>frappe <b class="tw__n">0</b></span><span>corrections <b class="tw__e">0</b></span></div><h2 class="tw__t"><span class="tw__s"></span><span class="tw__c"></span></h2></div>`;
  const t = stage.querySelector('.tw__t'), s = stage.querySelector('.tw__s'), cur = stage.querySelector('.tw__c');
  const nEl = stage.querySelector('.tw__n'), eEl = stage.querySelector('.tw__e');
  const text = o.text;
  t.style.fontSize = clamp((Math.min(1300, innerWidth * 0.9) * 2.1) / (Math.max(8, [...text].length) * 0.5), 32, innerHeight * 0.22) + 'px';
  if (o.reduced) { s.textContent = text; return {}; }
  let gen = 0;
  const wait = (ms, g) => new Promise((r) => setTimeout(() => r(g === gen), ms / o.speed));
  const run = async () => {
    const g = ++gen;
    let typed = '', bad = '', n = 0, e = 0;
    const render = (sel = false) => { s.innerHTML = sel ? `<span class="sel">${typed}</span>` : `${typed}${bad ? `<span class="bad">${bad}</span>` : ''}`; nEl.textContent = n; eEl.textContent = e; };
    render();
    if (!(await wait(700, g))) return;
    const chars = [...text];
    const words = text.split(' ');
    const typoWord = Math.max(1, Math.floor(words.length * 0.55));
    const typoAt = words.slice(0, typoWord).join(' ').length + 1;
    for (let i = 0; i < chars.length; i++) {
      if (i === typoAt && chars.length > 6) {
        const wrong = (chars.slice(i, i + 4).reverse().join('') || 'xz').replace(/\s/g, 'e');
        for (const w of wrong) { bad += w; n++; cur.classList.add('on'); render(); if (!(await wait(70 + Math.random() * 60, g))) return; }
        cur.classList.remove('on');
        if (!(await wait(650, g))) return;
        while (bad.length) { bad = bad.slice(0, -1); render(); if (!(await wait(60, g))) return; }
        e++; render();
        if (!(await wait(250, g))) return;
      }
      typed += chars[i]; n++; cur.classList.add('on'); render();
      const c = chars[i];
      const d = /[.,;:!?]/.test(c) ? 380 : c === ' ' ? 120 : 45 + Math.random() * 90;
      if (!(await wait(d, g))) return;
    }
    cur.classList.remove('on');
    if (!(await wait(2200, g))) return;
    render(true);
    if (!(await wait(700, g))) return;
    typed = ''; render();
    if (!(await wait(500, g))) return;
    run();
  };
  run();
  return { replay: run, destroy: () => { gen++; } };
}
