import { injectCSS, bigSize } from '../core.js';

export const loopEvery = 5.5;

injectCSS('split', `
.sp { width: 100%; padding: 0 5vw; text-align: center; }
.sp__t { margin: 0; font-family: var(--f-display); font-weight: 900; text-transform: uppercase; line-height: .88;
  letter-spacing: -.03em; color: var(--fx); font-variation-settings: "wdth" 118, "wght" 900; perspective: 800px; }
.sp__t .c { display: inline-block; transform-origin: 50% 100%; }
.sp__m { margin-top: 3vh; color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; }
.sp__m i { color: var(--paper); font-style: normal; }
`);

export function mount(stage, o) {
  stage.innerHTML = '<div class="sp"><h2 class="sp__t"></h2><p class="sp__m mono"></p></div>';
  const h = stage.querySelector('.sp__t'), m = stage.querySelector('.sp__m');
  h.textContent = o.text;
  h.style.fontSize = bigSize(o.text, stage.clientWidth, stage.clientHeight) + 'px';
  let split = null, tl = null;

  const build = () => {
    if (tl) tl.kill();
    if (split) split.revert();
    split = SplitText.create(h, { type: 'lines,words,chars', charsClass: 'c', mask: o.mode === 'lignes' ? 'lines' : (o.mode === 'mots' ? 'words' : null) });
    const recipe = {
      lettres: ['elastic.out(1, 0.32)', 'stagger 0.045 · from center'],
      mots: ['elastic.out(1.1, 0.45)', 'stagger 0.09 · masque par mot'],
      lignes: ['expo.out', 'stagger 0.14 · masque par ligne']
    }[o.mode || 'lettres'];
    m.innerHTML = `<i>${o.mode || 'lettres'}</i> · ${recipe[0]} · ${recipe[1]}`;
    tl = gsap.timeline({ defaults: { overwrite: true } });
    if (o.mode === 'mots') {
      tl.from(split.words, { yPercent: 110, rotate: 12, duration: 1.4, ease: recipe[0], stagger: 0.09 });
    } else if (o.mode === 'lignes') {
      tl.from(split.lines, { yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: 0.14 })
        .from(split.chars, { fontVariationSettings: '"wdth" 50, "wght" 200', duration: 1.2, ease: 'power3.out', stagger: 0.01 }, 0.2);
    } else {
      tl.from(split.chars, {
        y: () => gsap.utils.random(-1, 1) > 0 ? '1.1em' : '-1.1em', rotationX: -100, scaleY: 1.7, opacity: 0,
        fontVariationSettings: '"wdth" 50, "wght" 100',
        duration: 1.7, ease: recipe[0], stagger: { each: 0.045, from: 'center' }
      });
    }
    tl.timeScale(o.speed);
    if (o.reduced) tl.progress(1);
  };
  build();

  return {
    replay: build,
    mode: build,
    speed: (s) => tl && tl.timeScale(s),
    destroy: () => { tl && tl.kill(); split && split.revert(); }
  };
}
