import { injectCSS, loop, clamp } from '../core.js';

injectCSS('marquees', `
.mq { position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden; }
.mq__band { position: absolute; left: -20vw; width: 140vw; padding: .12em 0; overflow: hidden; white-space: nowrap; }
.mq__track { display: inline-flex; will-change: transform; }
.mq__unit { display: inline-flex; align-items: center; font-family: var(--f-display); font-weight: 900; text-transform: uppercase; line-height: 1;
  letter-spacing: -.02em; font-variation-settings: "wdth" 130; padding-right: .3em; }
.mq__unit i { font-style: normal; display: inline-block; margin: 0 .25em; font-size: .6em; }
.mq__unit em { font-family: var(--f-serif); font-weight: 300; font-style: italic; text-transform: none; letter-spacing: -.02em; margin-right: .3em; }
.mq__band.b1 { background: var(--fx); color: var(--ink); }
.mq__band.b2 { background: var(--ink); color: transparent; -webkit-text-stroke: 1.5px var(--paper); border-block: 1px solid var(--line); }
.mq__band.b2 em { color: var(--paper); -webkit-text-stroke: 0; }
.mq__band.b3 { background: var(--paper); color: var(--ink); }
.mq__band.b4 { background: var(--hot); color: var(--ink); }
.mq__hint { position: absolute; left: 50%; bottom: 13vh; transform: translateX(-50%); color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; z-index: 3; }
`);

export function createMarquees(root, words, { fs, bands = 4 }) {
  const defs = [
    { c: 'b1', rot: -7, dir: 1, y: -0.24 }, { c: 'b2', rot: 5, dir: -1, y: -0.06 },
    { c: 'b3', rot: -3, dir: 1, y: 0.12 }, { c: 'b4', rot: 9, dir: -1, y: 0.3 }
  ].slice(0, bands);
  const list = defs.map((d, i) => {
    const band = document.createElement('div');
    band.className = 'mq__band ' + d.c;
    band.style.top = `calc(50% + ${d.y * 100}vh - ${fs * 0.62}px)`;
    band.style.transform = `rotate(${d.rot}deg)`;
    const unit = `<span class="mq__unit" style="font-size:${fs}px">${words[i % words.length]}<i>✦</i><em>${words[(i + 1) % words.length].toLowerCase()}</em><i>✦</i></span>`;
    band.innerHTML = `<div class="mq__track">${unit.repeat(2)}</div>`;
    root.appendChild(band);
    const track = band.firstChild;
    const uw = track.firstChild.getBoundingClientRect().width || 1;
    const need = Math.ceil((innerWidth * 1.5) / uw) + 1;
    track.innerHTML = unit.repeat(need + 1);
    return { band, track, uw, dir: d.dir, x: -Math.random() * uw, rot: d.rot };
  });
  return {
    update(dt, vel, base = 1) {
      const skew = clamp(vel * 0.012, -18, 18);
      for (const b of list) {
        b.x += (b.dir * (90 * base) + b.dir * vel * 2.2) * dt;
        b.x = ((b.x % b.uw) - b.uw) % b.uw;
        b.track.style.transform = `translate3d(${b.x.toFixed(1)}px,0,0) skewX(${(-skew * b.dir).toFixed(2)}deg)`;
        b.band.style.transform = `rotate(${(b.rot + skew * 0.12).toFixed(2)}deg)`;
      }
    }
  };
}

export function mount(stage, o) {
  stage.innerHTML = `<div class="mq"></div><p class="mq__hint mono">${o.touch ? 'Glissez' : 'Molette ou glisser'} pour accélérer</p>`;
  const root = stage.querySelector('.mq');
  const fs = Math.min(innerHeight * 0.13, innerWidth * 0.11);
  const words = [o.text.toUpperCase(), 'Vitesse', 'Rythme', 'Élan'];
  const mq = createMarquees(root, words, { fs });
  let vel = 0, target = 0, lastY = null;
  const onWheel = (e) => { target += e.deltaY * 3; };
  const onDown = (e) => { lastY = e.clientX + e.clientY; };
  const onMove = (e) => { if (lastY == null) return; const v = e.clientX + e.clientY; target += (v - lastY) * 8; lastY = v; };
  const onUp = () => { lastY = null; };
  stage.addEventListener('wheel', onWheel, { passive: true });
  stage.addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp);
  const step = (t, dt) => {
    if (o.thumb) target += Math.sin(t * 1.3) > 0.6 ? 120 : 0;
    target *= Math.pow(0.04, dt);
    vel += (clamp(target, -1500, 1500) - vel) * Math.min(1, dt * 6);
    mq.update(dt, vel, o.speed);
  };
  step(0, 0.016);
  const lp = o.reduced ? null : loop(stage, step);
  return { destroy: () => { lp && lp.stop(); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); } };
}
