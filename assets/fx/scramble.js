import { injectCSS, clamp } from '../core.js';

export const loopEvery = 7;

injectCSS('scramble', `
.scr { width: min(1200px, 92vw); font-family: var(--f-mono); font-variation-settings: "MONO" 1, "CASL" 0; }
.scr__log { color: var(--mute); font-size: clamp(12px, 1.2vw, 15px); line-height: 1.7; min-height: 6.8em; white-space: pre; overflow: hidden; }
.scr__log b { color: var(--fx); font-weight: 400; }
.scr__big { margin: .2em 0 0; font-weight: 800; text-transform: uppercase; line-height: .95; color: var(--paper);
  font-variation-settings: "MONO" 1, "wght" 800; letter-spacing: -.03em; word-break: break-word; }
.scr__big .hl { color: var(--fx); }
.scr__cur { display: inline-block; width: .55em; height: .9em; background: var(--fx); vertical-align: -.08em; margin-left: .06em; animation: blink 1s steps(1) infinite; }
.scr__bar { margin-top: 3vh; height: 3px; background: rgba(238,234,225,.12); }
.scr__bar i { display: block; height: 100%; width: 0; background: var(--fx); }
@keyframes blink { 50% { opacity: 0; } }
`);

const CHARS = '!<>-_\\/[]{}—=+*^?#01ABCDEF';

export function mount(stage, o) {
  stage.innerHTML = `<div class="scr"><div class="scr__log"></div><h2 class="scr__big"><span class="scr__txt"></span><span class="scr__cur"></span></h2><div class="scr__bar"><i></i></div></div>`;
  const log = stage.querySelector('.scr__log'), big = stage.querySelector('.scr__big'), txt = stage.querySelector('.scr__txt'), bar = stage.querySelector('.scr__bar i');
  const len = [...o.text].length;
  big.style.fontSize = clamp((Math.min(1200, innerWidth * 0.92)) / (Math.min(len, 14) * 0.62), 28, innerHeight * 0.3) + 'px';
  let tl;
  const lines = [
    '> connexion au flux typographique…',
    '> paquets reçus : 2 048 · perte : 0 %',
    '> clé de déchiffrement : <b>OK</b>',
    '> décodage du message en cours'
  ];
  const build = () => {
    tl && tl.kill();
    log.innerHTML = ''; txt.textContent = ''; gsap.set(bar, { width: 0 });
    tl = gsap.timeline();
    lines.forEach((l, i) => {
      tl.call(() => { log.insertAdjacentHTML('beforeend', `<div>${l}</div>`); }, null, i * 0.32);
    });
    tl.to(txt, { duration: 2.4, scrambleText: { text: o.text, chars: CHARS, revealDelay: 0.5, speed: 0.6, newClass: 'hl', tweenLength: false } }, 1.2)
      .to(bar, { width: '100%', duration: 2.4, ease: 'power2.inOut' }, 1.2)
      .call(() => log.insertAdjacentHTML('beforeend', '<div><b>> message intégral. fin de transmission.</b></div>'));
    tl.timeScale(o.speed);
    if (o.reduced) { tl.progress(1); txt.textContent = o.text; }
  };
  build();
  return { replay: build, speed: (s) => tl.timeScale(s), destroy: () => tl && tl.kill() };
}
