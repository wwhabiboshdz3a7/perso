// Vérification des types écrits à la main : ce fichier doit compiler sans erreur (npm run types).
import { animate, timeline, stagger, spring, splitText, onScroll, drawable, motionPath, engine, utils, eases, odometer, typewriter, scramble, cubicBezier } from 'kinetika';

const a = animate('.carte', { x: 200, rotate: '1turn', delay: stagger(80, { from: 'center', grid: [4, 3] }), ease: 'outElastic(1, .5)', loop: true, onComplete: (s) => s.revert() });
a.progress = 0.5;
const tl = timeline({ defaults: { duration: 600, ease: 'outExpo' } })
  .add('.a', { y: [20, 0], opacity: { from: 0 } })
  .add(a, '<<')
  .call(() => {}, '+=200')
  .label('fin');
tl.seek('fin');
const s = spring({ stiffness: 120 });
const d: number = s.duration;
const split = splitText('h1', { lines: true, mask: 'lines' });
animate(split.lines, { y: ['100%', '0%'], autoplay: onScroll({ enter: 'top 80%', sync: 'play none none reverse' }) });
animate(drawable('path'), { draw: [0, 1] });
animate('.avion', { ...motionPath('#route'), duration: 4000 });
engine.timeScale = 0.5;
const stop = engine.onFrame((dt, t) => {});
stop();
const r = utils.createRandom(4);
const n: number = r.int(0, 10) + utils.clamp(2, 0, 1) + eases.outQuad(0.5) + eases.outElastic.with(1, .3)(0.2) + cubicBezier(.2, .8, .2, 1)(0.5);
odometer('.prix', { value: 1290 }).set(4500);
typewriter('.t', { text: ['a', 'b'] }).caret;
scramble('.s', { text: 'ok', autoplay: false });
(async () => { await animate({ v: 0 }, { v: 1 }); })();
const reprise = animate({ v: 0 }, { v: 1 });
const stoppee: boolean = reprise.interrupted;
reprise.catch((e) => console.error(e)).finally(() => {});
void stoppee;
