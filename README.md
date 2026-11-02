# Kinetika

**Le mouvement, en une ligne.** Kinetika est une librairie d’animation JavaScript légère et sans dépendance : `animate`, `timeline`, `stagger`, ressorts physiques, texte cinétique, défilement et SVG.

[![npm](https://img.shields.io/npm/v/kinetika?color=ff5b2b&label=npm)](https://www.npmjs.com/package/kinetika)
[![taille gzip](https://img.shields.io/bundlephobia/minzip/kinetika?color=d9ff42&label=gzip)](https://bundlephobia.com/package/kinetika)
[![licence MIT](https://img.shields.io/badge/licence-MIT-b6a9ff)](LICENSE)
[![CI](https://github.com/wwhabiboshdz3a7/kinetika/actions/workflows/ci.yml/badge.svg)](https://github.com/wwhabiboshdz3a7/kinetika/actions/workflows/ci.yml)

Conçue et développée par [wwhabiboshdz3a7](https://github.com/wwhabiboshdz3a7) · [Read in English](README.en.md)

```js
import { animate, stagger } from 'kinetika';

animate('.carte', {
  x: 240,
  rotate: '1turn',
  backgroundColor: '#ff5b2b',
  delay: stagger(80, { from: 'center' }),
  ease: 'outElastic(1, .5)',
});
```

## Fonctionnalités

- **Un seul moteur** : une boucle `requestAnimationFrame` pour toute la page, échelle de temps globale, pause quand l’onglet est masqué, lissage des sauts après un blocage, tick manuel pour les tests.
- **`animate()`** : sélecteurs, éléments, listes, tableaux et objets JS. Transformations individuelles (`x`, `y`, `rotate`, `scale`, `skew`…), CSS avec conversion d’unités, couleurs interpolées en **OKLab**, variables CSS, attributs SVG, propriétés d’objets.
- **Valeurs expressives** : `[de, à]`, relatives (`'+=100'`, `'*=2'`), fonctions `(el, i, total)`, keyframes (tableau ou pourcentages), paramètres par propriété.
- **Lecture complète** : boucles, aller-retour, sens inverse, `play` / `pause` / `seek` / `reverse` / `restart`, vitesse, `progress`, `await animate(…)`, rappels, `revert()`.
- **Easings** : familles classiques, `Back` et `Elastic` paramétrables, `cubicBezier()`, `steps()`, **`spring()` à durée calculée**, chaînes comme `'outElastic(1, .5)'`, alias anime.js, GSAP et CSS.
- **`timeline()`** : positions `'<'`, `'<<'`, `'+=200'`, `'-=100'`, libellés, timelines imbriquées, `call()`, `set()`.
- **`stagger()`** : depuis le premier, le dernier, le centre, un index ou au hasard (à graine), en ligne ou en grille, par axe, avec easing.
- **Texte** : `splitText()` accessible (lignes, mots, lettres, masques, `revert()` ; `aria-label` sur les titres, copie masquée sur les éléments génériques), `scramble()`, `typewriter()`, `odometer()`.
- **Défilement** : `onScroll()` (IntersectionObserver et progression liée au défilement, lissée), vitesse de défilement.
- **SVG** : `drawable()` pour tracer les contours, `motionPath()` pour suivre un chemin.
- **Accessible par défaut** : `prefers-reduced-motion` est respecté (les animations sautent à leur état final).
- **Types TypeScript** écrits à la main ; builds ESM, UMD et CommonJS.

## Installation

### npm

```sh
npm install kinetika
```

```js
import { animate, timeline, stagger } from 'kinetika';
```

### CDN (jsDelivr, une fois le paquet publié)

Module ES :

```html
<script type="module">
  import { animate } from 'https://cdn.jsdelivr.net/npm/kinetika@0.1.0/dist/kinetika.esm.min.js';
  animate('.titre', { y: [40, 0], opacity: [0, 1] });
</script>
```

Script classique (variable globale `kinetika`) :

```html
<script src="https://cdn.jsdelivr.net/npm/kinetika@0.1.0/dist/kinetika.umd.min.js"></script>
<script>
  const { animate, stagger } = kinetika;
</script>
```

### ESM direct, sans outil

Copiez `dist/kinetika.esm.min.js` dans votre projet et importez-le directement, ou déclarez-le dans une *import map* :

```html
<script type="importmap">{ "imports": { "kinetika": "./vendor/kinetika.esm.min.js" } }</script>
<script type="module">
  import { animate } from 'kinetika';
</script>
```

### Taille

| Fichier | Brut | gzip |
|---|---|---|
| `dist/kinetika.esm.min.js` | 54,5 ko | **20,5 ko** |
| `dist/kinetika.umd.min.js` | 55,7 ko | 20,9 ko |
| `dist/kinetika.esm.js` (non minifié, commenté) | 95,5 ko | 27,7 ko |

`npm run build` régénère ces fichiers et `dist/sizes.json`. Le paquet est déclaré sans effet de bord (`sideEffects: false`) : un bundler ne garde que ce que vous importez.

## Prise en main

### Animer

```js
import { animate } from 'kinetika';

const a = animate('.forme', {
  x: [0, 320],                     // de… à…
  rotate: '+=180',                 // relatif
  scale: [{ to: 1.4, duration: 200 }, { to: 1, ease: 'outBack(2)' }], // étapes
  borderRadius: ['4px', '50%'],
  '--teinte': 220,                 // variable CSS
  duration: 1200,
  ease: 'inOutExpo',
  loop: true,
  alternate: true,
});

a.pause();
a.seek(600);
a.progress = 0.25;
a.revert();                        // restaure les valeurs d’origine

await animate('.toast', { y: [20, 0], opacity: [0, 1] }); // promesse résolue à la fin
```

Kinetika anime aussi de simples objets :

```js
const camera = { zoom: 1, angle: 0 };
animate(camera, { zoom: 2.5, angle: 90, onUpdate: () => rendre(camera) });
```

### Enchaîner avec une timeline

```js
import { timeline, stagger, splitText } from 'kinetika';

const titre = splitText('h1', { chars: true });

timeline({ defaults: { duration: 700, ease: 'outExpo' } })
  .add(titre.chars, { y: ['110%', '0%'], delay: stagger(30) })
  .add('.sous-titre', { opacity: [0, 1] }, '-=400')   // chevauche la fin
  .add('.photo', { scale: [1.2, 1] }, '<<')           // part en même temps que la précédente
  .label('barre')
  .add('.barre', { scaleX: [0, 1] }, 'barre+=100')
  .call(() => console.log('fini'));
```

| Position | Signification |
|---|---|
| *(rien)* | à la fin de la timeline |
| `500` | à 500 ms |
| `'+=200'` / `'-=100'` | après la fin / en chevauchant la fin |
| `'<'` / `'<<'` | à la fin / au début de l’élément précédent |
| `'libellé'`, `'libellé+=100'` | sur un libellé |

### Ressorts

```js
import { animate, spring } from 'kinetika';

const souple = spring({ mass: 1, stiffness: 140, damping: 8 });
souple.duration; // durée calculée par la physique, en ms
animate('.jeton', { x: 0, y: 0, ease: souple });
```

### Grilles en stagger

```js
animate('.case', {
  scale: [{ to: 0.4 }, { to: 1, ease: 'outElastic(1, .45)' }],
  delay: stagger(40, { grid: [12, 8], from: 'center' }),
});
```

### Défilement

```js
import { animate, timeline, onScroll } from 'kinetika';

// déclenché à l’entrée, rejoué à rebours en remontant
animate('.carte', {
  y: [80, 0], opacity: [0, 1],
  autoplay: onScroll({ enter: 'top 85%', sync: 'play none none reverse' }),
});

// tête de lecture liée à la barre de défilement, lissée sur 0,8 s
timeline({ autoplay: onScroll({ target: '.section', enter: 'top top', leave: 'bottom bottom', scrub: 0.8 }) })
  .add('.titre', { x: ['-40%', '0%'] })
  .add('.photo', { scale: [1.3, 1] }, '<<');
```

### Texte et SVG

```js
import { splitText, scramble, typewriter, odometer, drawable, motionPath, animate, stagger } from 'kinetika';

const { lines } = splitText('.paragraphe', { lines: true, mask: 'lines' });
animate(lines, { y: ['100%', '0%'], delay: stagger(90) });

scramble('.code', { text: 'ACCÈS AUTORISÉ' });
typewriter('.slogan', { text: ['le DOM.', 'le SVG.', 'vos objets.'] });
odometer('.compteur', { value: '1 204 860' });

animate(drawable('svg path'), { draw: [0, 1], delay: stagger(80) });
animate('.avion', { ...motionPath('#route'), duration: 4000 });
```

### Moteur et mouvement réduit

```js
import { engine } from 'kinetika';

engine.defaults = { duration: 600, ease: 'outExpo' };
engine.timeScale = 0.25;          // tout au ralenti pour déboguer
engine.reducedMotion = 'auto';    // par défaut : suit prefers-reduced-motion

// tests unitaires : temps maîtrisé
engine.manual = true;
engine.tick(500);
```

En mouvement réduit, chaque animation saute directement à son état final : le contenu reste lisible et rien ne bouge. Une animation peut s’en exempter avec `reducedMotion: false`.

## API en bref

| Fonction | Rôle |
|---|---|
| `animate(cibles, paramètres)` | Anime des cibles ; renvoie une `Animation`. |
| `timeline(paramètres)` | Enchaîne animations, timelines et rappels. |
| `stagger(valeur, options)` | Répartit une valeur sur une liste de cibles. |
| `spring()`, `cubicBezier()`, `steps()`, `eases`, `parseEase()` | Courbes d’accélération. |
| `splitText()`, `scramble()`, `typewriter()`, `odometer()` | Texte. |
| `onScroll(options)` | Défilement. |
| `drawable()`, `motionPath()` | SVG. |
| `engine` | Moteur : échelle de temps, mouvement réduit, tick manuel, `onFrame()`. |
| `utils`, `set`, `get`, `remove`, `clamp`, `lerp`, `mapRange`, `snap`, `wrap`, `random`, `createRandom`… | Utilitaires. |

La référence complète, avec tous les paramètres et leurs valeurs par défaut, est sur la page **API** du site de documentation (générée depuis `api/donnees.js`). Les types sont dans `types/index.d.ts`.

Navigateurs visés : versions récentes de Chrome, Edge, Firefox et Safari (modules ES, `IntersectionObserver` ; `Intl.Segmenter` est utilisé s’il est disponible).

## Le site de documentation

Le dépôt contient aussi le site de Kinetika, statique, publiable tel quel sur Netlify :

- **Accueil** en typographie cinétique réalisé avec Kinetika : titre qui tombe lettre par lettre en élastique puis respire en police variable, règle de temps qui change d’easing à chaque passage, bandeaux qui suivent la vitesse de défilement, démonstrations vivantes de chaque module, crédit « par wwhabiboshdz3a7 ».
- **Galerie** de 34 exemples vivants et filtrables, dont onze effets du showreel de typographie cinétique réécrits avec Kinetika (split élastique, décodage, cylindre 3D, marquees selon la vitesse de défilement, odomètre, grille en stagger, lettres-ressorts, police variable, tracé SVG, motion path, scrub au défilement).
- **Bac à sable** : éditeur CodeMirror (JS, HTML, CSS), aperçu en direct, console, chargement des exemples, partage par lien (code compressé dans l’URL ; un code partagé n’est lancé qu’après confirmation), plein écran et téléchargement.
- **Référence de l’API** générée depuis `api/donnees.js`, avec sommaire et filtre.
- **Visualiseurs** d’easings (courbe, balle animée, paramètres, code à copier) et de stagger (grille, origine au clic ou au clavier, axe, easing, code à copier).
- **Migration** : correspondances d’API depuis anime.js et GSAP.

Le site charge la librairie depuis `dist/`. Il est en français, accessible (contrastes AA, navigation au clavier, `prefers-reduced-motion`) et pensé pour le mobile.

### Lancer le site en local

```sh
python3 -m http.server 8080
# puis http://localhost:8080
```

N’importe quel serveur statique convient ; les modules ES ne se chargent pas depuis `file://`.

### Déployer sur Netlify

1. Sur Netlify : *Add new site* → *Import an existing project* → choisissez le dépôt `kinetika`.
2. Laissez la commande de build vide et le dossier de publication à `.` : tout est déjà dans `netlify.toml`.
3. Déployez. Aucune variable d’environnement n’est nécessaire.

### Configuration

`netlify.toml` fixe le dossier publié (`.`, sans commande de build) et ajoute des en-têtes : CORS ouvert sur `dist/` (pour charger la librairie depuis un autre site), cache long des polices, `nosniff` et une politique de référent stricte. Les seuls réglages côté code sont dans `exemples/catalogue.js` (liste des exemples, catégories, vignettes de l’accueil) et `api/donnees.js` (référence de l’API).

### Structure du dépôt

```
src/                 Librairie (modules ES, zéro dépendance)
  engine.js          Boucle unique, échelle de temps, mouvement réduit
  animation.js       animate(), pistes, keyframes, composition
  playable.js        Lecture commune (boucles, sens, promesse, rappels)
  timeline.js        timeline(), positions, libellés, imbrication
  values.js, color.js, props.js   Valeurs, unités, couleurs OKLab, écriture
  easings.js, stagger.js, text.js, scroll.js, svg.js, utils.js
dist/                Builds (ESM, ESM minifié, UMD minifié, CommonJS) et tailles
types/index.d.ts     Types TypeScript
test/                Tests node --test (jsdom) et vérification des types
scripts/build.mjs    Build esbuild
index.html           Accueil du site
exemples/            Galerie : index, 34 exemples autonomes, catalogue.js
bac-a-sable/         Bac à sable
api/                 Référence de l’API (index.html et donnees.js)
easings/, stagger/   Visualiseurs
migration/           Venir d’anime.js ou de GSAP
site/                Styles, scripts et polices du site
vendor/codemirror/   CodeMirror 5 (MIT), éditeur du bac à sable
```

Polices du site (licence SIL OFL, dans `site/fonts/`) : Anybody, Bricolage Grotesque, Fraunces et JetBrains Mono.

## Développement

```sh
npm install
npm test          # tests unitaires : easings, interpolation, keyframes, timeline, stagger, lecture, texte, défilement, SVG
npm run types     # vérifie types/index.d.ts
npm run build     # dist/ et tailles brutes et gzip
```

Voir [CONTRIBUTING.md](CONTRIBUTING.md) et le [journal des versions](CHANGELOG.md).

## Publier

### Créer le dépôt dédié sur GitHub

Le code vit dans la branche `kinetika` du dépôt personnel. Pour lui donner son propre dépôt :

```sh
# 1. créer le dépôt vide (ou depuis github.com/new, sans README ni licence)
gh repo create wwhabiboshdz3a7/kinetika --public \
  --description "Librairie d’animation JavaScript légère et sans dépendance"

# 2. y pousser la branche kinetika comme branche principale
git push git@github.com:wwhabiboshdz3a7/kinetika.git kinetika:main
```

Ajoutez ensuite l’adresse du site Netlify dans la description du dépôt et quelques sujets (`animation`, `javascript`, `timeline`, `spring`, `svg`). La CI (GitHub Actions) lance tests, types et build à chaque push.

### Publier sur npm

```sh
npm login                         # compte npm de wwhabiboshdz3a7
npm publish --dry-run             # vérifie le contenu du paquet (dist, src, types, README, LICENSE, CHANGELOG)
npm publish --access public       # prepublishOnly lance tests, types et build
git tag v0.1.0 && git push --tags
```

Pour les versions suivantes : mettez à jour `CHANGELOG.md` et la constante `version` de `src/index.js`, puis `npm version patch|minor|major` et `npm publish`. Quelques minutes après la publication, jsDelivr sert le paquet (`https://cdn.jsdelivr.net/npm/kinetika@0.1.0/…`) et les badges npm et bundlephobia s’activent. Le nom `kinetika` était libre sur npm lors de la vérification (novembre 2026).

## Licence

[MIT](LICENSE) © 2026 [wwhabiboshdz3a7](https://github.com/wwhabiboshdz3a7). Code entièrement original : l’API s’inspire des bonnes librairies d’animation, sans en reprendre le code.
