import { injectCSS, clamp } from '../core.js';

export const loopEvery = 8;

injectCSS('surlignage', `
.hl { width: min(1300px, 88vw); }
.hl__p { margin: 0; font-family: var(--f-flex); font-weight: 650; line-height: 1.08; letter-spacing: -.035em; color: var(--ink); font-variation-settings: "wdth" 90, "opsz" 144; }
.hl__p .w { color: rgba(10,10,11,.13); transition: none; }
.hl__p .k { background: linear-gradient(var(--fx), var(--fx)) no-repeat 0 85% / 0% 70%; padding: 0 .06em; margin: 0 -.06em; }
.hl__p .k.hot { background-image: linear-gradient(var(--hot), var(--hot)); }
.hl__bar { margin-top: 4vh; height: 2px; background: rgba(10,10,11,.12); }
.hl__bar i { display: block; height: 100%; width: 0; background: var(--ink); }
`);

export function mount(stage, o) {
  const tail = ' — et la lecture devient un mouvement. Le regard avance, la couleur suit, le sens arrive au rythme exact où on le lit.';
  stage.innerHTML = `<div class="hl"><p class="hl__p"></p><div class="hl__bar"><i></i></div></div>`;
  const p = stage.querySelector('.hl__p'), bar = stage.querySelector('.hl__bar i');
  p.textContent = o.text + tail;
  const len = p.textContent.length;
  p.style.fontSize = clamp(Math.sqrt((innerWidth * 0.88 * innerHeight * 0.55) / (len * 0.5)), 22, 120) + 'px';
  const split = SplitText.create(p, { type: 'words', wordsClass: 'w' });
  const keys = split.words.filter((w, i) => w.textContent.replace(/[^\p{L}]/gu, '').length > 6 && i % 3 === 0);
  keys.forEach((k, i) => { k.classList.add('k'); if (i % 2) k.classList.add('hot'); });
  let tl;
  const build = () => {
    tl && tl.kill();
    gsap.set(split.words, { color: 'rgba(10,10,11,.13)' });
    gsap.set(keys, { backgroundSize: '0% 70%' });
    gsap.set(bar, { width: 0 });
    tl = gsap.timeline();
    const per = 4.8 / split.words.length;
    split.words.forEach((w, i) => {
      tl.to(w, { color: '#0a0a0b', duration: 0.25, ease: 'none' }, i * per);
      if (keys.includes(w)) tl.to(w, { backgroundSize: '100% 70%', duration: 0.5, ease: 'power3.out' }, i * per + 0.1);
    });
    tl.to(bar, { width: '100%', duration: tl.duration(), ease: 'none' }, 0);
    tl.timeScale(o.speed);
    if (o.reduced) tl.progress(1);
  };
  build();
  return { replay: build, speed: (s) => tl.timeScale(s), destroy: () => { tl && tl.kill(); split.revert(); } };
}
