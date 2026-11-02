# Kinetika

**Motion, in one line.** Kinetika is a lightweight, dependency-free JavaScript animation library: `animate`, `timeline`, `stagger`, physical springs, kinetic text, scroll and SVG.

[![npm](https://img.shields.io/npm/v/kinetika?color=ff5b2b&label=npm)](https://www.npmjs.com/package/kinetika)
[![gzip size](https://img.shields.io/bundlephobia/minzip/kinetika?color=d9ff42&label=gzip)](https://bundlephobia.com/package/kinetika)
[![MIT license](https://img.shields.io/badge/license-MIT-b6a9ff)](LICENSE)
[![CI](https://github.com/wwhabiboshdz3a7/kinetika/actions/workflows/ci.yml/badge.svg)](https://github.com/wwhabiboshdz3a7/kinetika/actions/workflows/ci.yml)

Designed and built by [wwhabiboshdz3a7](https://github.com/wwhabiboshdz3a7) · [Lire en français](README.md)

```js
import { animate, stagger } from 'kinetika';

animate('.card', {
  x: 240,
  rotate: '1turn',
  backgroundColor: '#ff5b2b',
  delay: stagger(80, { from: 'center' }),
  ease: 'outElastic(1, .5)',
});
```

## Features

- **One engine**: a single `requestAnimationFrame` loop for the whole page, global time scale, pauses when the tab is hidden, lag smoothing after a jank, manual ticking for tests.
- **`animate()`**: selectors, elements, NodeLists, arrays and plain JS objects. Individual transforms (`x`, `y`, `rotate`, `scale`, `skew`…), CSS with unit conversion, colors interpolated in **OKLab**, CSS variables, SVG attributes, object properties.
- **Expressive values**: `[from, to]`, relative (`'+=100'`, `'*=2'`), functions `(el, i, total)`, keyframes (arrays or percentages), per-property parameters.
- **Full playback control**: loops, alternate, reversed, `play` / `pause` / `seek` / `reverse` / `restart`, speed, `progress`, `await animate(…)`, callbacks, `revert()`.
- **Easings**: classic families, tunable `Back` and `Elastic`, `cubicBezier()`, `steps()`, **`spring()` with computed duration**, strings like `'outElastic(1, .5)'`, anime.js, GSAP and CSS aliases.
- **`timeline()`**: positions `'<'`, `'<<'`, `'+=200'`, `'-=100'`, labels, nested timelines, `call()`, `set()`.
- **`stagger()`**: from the first, last, center, an index or random (seeded), on a line or a grid, per axis, with easing.
- **Text**: accessible `splitText()` (lines, words, chars, masks, `revert()`; `aria-label` on headings, a visually hidden copy on generic elements), `scramble()`, `typewriter()`, `odometer()`.
- **Scroll**: `onScroll()` (IntersectionObserver plus smoothed scroll-linked progress), scroll velocity.
- **SVG**: `drawable()` to draw strokes, `motionPath()` to follow a path.
- **Accessible by default**: `prefers-reduced-motion` is honored (animations jump to their end state).
- Hand-written **TypeScript types**; ESM, UMD and CommonJS builds.

## Install

### npm

```sh
npm install kinetika
```

```js
import { animate, timeline, stagger } from 'kinetika';
```

### CDN (jsDelivr, once the package is published)

ES module:

```html
<script type="module">
  import { animate } from 'https://cdn.jsdelivr.net/npm/kinetika@0.1.0/dist/kinetika.esm.min.js';
  animate('.title', { y: [40, 0], opacity: [0, 1] });
</script>
```

Classic script (global `kinetika`):

```html
<script src="https://cdn.jsdelivr.net/npm/kinetika@0.1.0/dist/kinetika.umd.min.js"></script>
<script>
  const { animate, stagger } = kinetika;
</script>
```

### Plain ESM, no tooling

Copy `dist/kinetika.esm.min.js` into your project and import it directly, or map it with an import map:

```html
<script type="importmap">{ "imports": { "kinetika": "./vendor/kinetika.esm.min.js" } }</script>
<script type="module">
  import { animate } from 'kinetika';
</script>
```

### Size

<!-- tailles -->
| File | Raw | gzip |
|---|---|---|
| `dist/kinetika.esm.min.js` | 62.2 kB | **23.9 kB** |
| `dist/kinetika.umd.min.js` | 63.5 kB | 24.2 kB |
| `dist/kinetika.esm.js` (unminified, commented) | 108.0 kB | 31.8 kB |
<!-- /tailles -->

`npm run build` regenerates these files and `dist/sizes.json`. The package is marked side-effect free (`sideEffects: false`), so bundlers keep only what you import.

## Getting started

### Animate

```js
import { animate } from 'kinetika';

const a = animate('.shape', {
  x: [0, 320],                     // from… to…
  rotate: '+=180',                 // relative
  scale: [{ to: 1.4, duration: 200 }, { to: 1, ease: 'outBack(2)' }], // steps
  borderRadius: ['4px', '50%'],
  '--hue': 220,                    // CSS variable
  duration: 1200,
  ease: 'inOutExpo',
  loop: true,
  alternate: true,
});

a.pause();
a.seek(600);
a.progress = 0.25;
a.revert();                        // restores the original values

await animate('.toast', { y: [20, 0], opacity: [0, 1] }); // resolves when done
```

Kinetika animates plain objects too:

```js
const camera = { zoom: 1, angle: 0 };
animate(camera, { zoom: 2.5, angle: 90, onUpdate: () => render(camera) });
```

### Sequence with a timeline

```js
import { timeline, stagger, splitText } from 'kinetika';

const title = splitText('h1', { chars: true });

timeline({ defaults: { duration: 700, ease: 'outExpo' } })
  .add(title.chars, { y: ['110%', '0%'], delay: stagger(30) })
  .add('.subtitle', { opacity: [0, 1] }, '-=400')   // overlaps the end
  .add('.photo', { scale: [1.2, 1] }, '<<')         // starts with the previous one
  .label('bar')
  .add('.bar', { scaleX: [0, 1] }, 'bar+=100')
  .call(() => console.log('done'));
```

| Position | Meaning |
|---|---|
| *(none)* | at the end of the timeline |
| `500` | at 500 ms |
| `'+=200'` / `'-=100'` | after the end / overlapping the end |
| `'<'` / `'<<'` | at the end / at the start of the previous item |
| `'label'`, `'label+=100'` | on a label |

### Springs

```js
import { animate, spring } from 'kinetika';

const soft = spring({ mass: 1, stiffness: 140, damping: 8 });
soft.duration; // duration computed from the physics, in ms
animate('.token', { x: 0, y: 0, ease: soft });
```

### Grid staggering

```js
animate('.cell', {
  scale: [{ to: 0.4 }, { to: 1, ease: 'outElastic(1, .45)' }],
  delay: stagger(40, { grid: [12, 8], from: 'center' }),
});
```

### Scroll

```js
import { animate, timeline, onScroll } from 'kinetika';

// plays on enter, reverses when scrolling back up
animate('.card', {
  y: [80, 0], opacity: [0, 1],
  autoplay: onScroll({ enter: 'top 85%', sync: 'play none none reverse' }),
});

// playhead linked to the scrollbar, smoothed over 0.8 s
timeline({ autoplay: onScroll({ target: '.section', enter: 'top top', leave: 'bottom bottom', scrub: 0.8 }) })
  .add('.title', { x: ['-40%', '0%'] })
  .add('.photo', { scale: [1.3, 1] }, '<<');
```

### Text and SVG

```js
import { splitText, scramble, typewriter, odometer, drawable, motionPath, animate, stagger } from 'kinetika';

const { lines } = splitText('.paragraph', { lines: true, mask: 'lines' });
animate(lines, { y: ['100%', '0%'], delay: stagger(90) });

scramble('.code', { text: 'ACCESS GRANTED' });
typewriter('.tagline', { text: ['the DOM.', 'SVG.', 'your objects.'] });
odometer('.counter', { value: '1,204,860' });

animate(drawable('svg path'), { draw: [0, 1], delay: stagger(80) });
animate('.plane', { ...motionPath('#route'), duration: 4000 });
```

### Engine and reduced motion

```js
import { engine } from 'kinetika';

engine.defaults = { duration: 600, ease: 'outExpo' };
engine.timeScale = 0.25;          // slow everything down while debugging
engine.reducedMotion = 'auto';    // default: follows prefers-reduced-motion

// unit tests: controlled time
engine.manual = true;
engine.tick(500);
```

With reduced motion, every animation jumps straight to its end state: content stays readable and nothing moves. An animation can opt out with `reducedMotion: false`.

## API at a glance

| Function | Purpose |
|---|---|
| `animate(targets, params)` | Animates targets; returns an `Animation`. |
| `timeline(params)` | Sequences animations, timelines and callbacks. |
| `stagger(value, options)` | Distributes a value across targets. |
| `spring()`, `cubicBezier()`, `steps()`, `eases`, `parseEase()` | Easing curves. |
| `splitText()`, `scramble()`, `typewriter()`, `odometer()` | Text. |
| `onScroll(options)` | Scroll. |
| `drawable()`, `motionPath()` | SVG. |
| `engine` | Engine: time scale, reduced motion, manual ticking, `onFrame()`. |
| `utils`, `set`, `get`, `remove`, `clamp`, `lerp`, `mapRange`, `snap`, `wrap`, `random`, `createRandom`… | Utilities. |

The complete reference, with every parameter and its default value, is on the **API** page of the documentation site (generated from `api/donnees.js`; the site is in French). Types live in `types/index.d.ts`.

Target browsers: current Chrome, Edge, Firefox and Safari (ES modules, `IntersectionObserver`; `Intl.Segmenter` is used when available).

## Documentation site

The repository also contains Kinetika’s website, fully static and deployable as is on Netlify:

- **Home page** in kinetic typography, made with Kinetika: a title that drops letter by letter on an elastic ease and then breathes with a variable font, a time ruler that switches easing on every pass, bands that follow the scroll velocity, live demos of every module, and the “by wwhabiboshdz3a7” credit.
- **Gallery** of 34 live, filterable examples, including eleven effects from the kinetic typography showreel rewritten with Kinetika.
- **Playground**: CodeMirror editor (JS, HTML, CSS), live preview, console, example loader, URL sharing (code compressed into the URL; shared code only runs after confirmation), full screen and download.
- **API reference** generated from `api/donnees.js`, with a table of contents and a filter.
- **Visualizers** for easings (curve, animated ball, parameters, copyable code) and stagger (grid, origin by click or keyboard, axis, easing, copyable code).
- **Migration** page: API mapping from anime.js and GSAP.

Run it locally with any static server (`python3 -m http.server 8080`). To deploy on Netlify, import the repository, leave the build command empty and the publish directory set to `.`: everything is already in `netlify.toml`.

## Development

```sh
npm install
npm test          # unit tests (node --test + jsdom)
npm run types     # checks types/index.d.ts
npm run build     # dist/ plus raw and gzip sizes
```

See [CONTRIBUTING.md](CONTRIBUTING.md) (in French) and the [changelog](CHANGELOG.md).

## Publishing

Create the dedicated GitHub repository and push the `kinetika` branch as `main`:

```sh
gh repo create wwhabiboshdz3a7/kinetika --public --description "Lightweight, dependency-free JavaScript animation library"
git push git@github.com:wwhabiboshdz3a7/kinetika.git kinetika:main
```

Then publish to npm:

```sh
npm login
npm publish --dry-run
npm publish --access public       # prepublishOnly runs tests, types and build
git tag v0.1.0 && git push --tags
```

## License

[MIT](LICENSE) © 2026 [wwhabiboshdz3a7](https://github.com/wwhabiboshdz3a7). Entirely original code: the API takes inspiration from great animation libraries without reusing their code.
