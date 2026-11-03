# Journal des versions

Toutes les évolutions notables de Kinetika sont consignées ici. Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet respecte le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

Rien pour l’instant.

## [0.1.0] — 2026-11-02

Première version publique.

### Ajouté

- **Moteur** : une seule boucle `requestAnimationFrame`, échelle de temps globale (`engine.timeScale`), pause quand l’onglet est masqué, lissage des sauts après un blocage, mode manuel avec `engine.tick()` pour les tests, cadence plafonnable (`engine.fps`), `engine.onFrame()`, rappels fautifs isolés (une exception n’arrête que son animation), respect de `prefers-reduced-motion` (`engine.reducedMotion = 'auto'`).
- **`animate()`** : sélecteurs, éléments, listes, tableaux et objets JS ; transformations individuelles composées (`x`, `y`, `rotate`, `scale`…), CSS avec conversion d’unités, couleurs interpolées en OKLab, variables CSS, attributs SVG, propriétés d’objets ; valeurs `[de, à]`, relatives (`+=`, `-=`, `*=`, `/=`), fonctions `(el, i, total)`, keyframes (tableau ou pourcentages), paramètres par propriété ; composition « replace ».
- **Lecture** : `play`, `pause`, `restart`, `reverse`, `seek`, `complete`, `cancel`, `revert`, `progress`, `speed`, boucles, aller-retour, promesse (`await animate(…)`), rappels `onBegin`, `onUpdate`, `onLoop`, `onComplete`, `onPause`.
- **Easings** : familles classiques en `in`, `out`, `inOut`, `outIn`, `Back` et `Elastic` paramétrables, `cubicBezier()`, `steps()`, `spring()` avec durée calculée, chaînes paramétrées et alias anime.js, GSAP et CSS.
- **`timeline()`** : positions `<`, `<<`, `+=`, `-=`, libellés, timelines imbriquées, `call()`, `set()`, `seek()` sur un libellé.
- **`stagger()`** : `from` (premier, dernier, centre, index, aléatoire à graine), grilles, axes, easing, départ, inversion.
- **Texte** : `splitText()` accessible (lignes, mots, lettres, masques, `revert()`, `refresh()`), `scramble()`, `typewriter()`, `odometer()`. Les morceaux sont masqués aux lecteurs d’écran ; le texte complet reste lisible via `aria-label` (titres, liens, boutons) ou une copie masquée visuellement (éléments génériques).
- **Défilement** : `onScroll()` avec déclenchement à l’entrée, actions `sync`, progression liée (`scrub`) et lissée, vitesse de défilement.
- **SVG** : `drawable()` (tracé des contours) et `motionPath()` (position et angle le long d’un chemin).
- **Utilitaires** : `clamp`, `lerp`, `mapRange`, `round`, `snap`, `wrap`, aléatoire à graine, `get`, `set`, `remove`.
- Builds ESM, ESM minifié, UMD minifié (global `kinetika`) et CommonJS ; types TypeScript écrits à la main.
- Site de documentation : accueil en typographie cinétique, galerie de 34 exemples, bac à sable, référence de l’API, visualiseurs d’easings et de stagger, page de migration.

[Non publié]: https://github.com/wwhabiboshdz3a7/kinetika/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/wwhabiboshdz3a7/kinetika/releases/tag/v0.1.0
