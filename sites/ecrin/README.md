# Écrin

Galerie de démos de sites premium construits autour d'un objet en 3D temps réel (Three.js),
avec une caméra pilotée par le défilement. En ligne : https://ecrin-demos-3d.netlify.app

| Démo | Dossier | Moment signature |
|---|---|---|
| Forno Nero, pizzeria | `demos/pizza/` | la pizza reçoit son basilic, une part se détache |
| Maison Aurèle, horlogerie | `demos/montre/` | vue éclatée jusqu'au mouvement |
| Sévane, parfumerie | `demos/parfum/` | le capot se lève, les notes gravitent |
| Maison Lune, pâtisserie | `demos/macaron/` | un macaron s'ouvre, la pyramide se compose |
| Clos Séraphin, champagne | `demos/champagne/` | le bouchon saute, la flûte se remplit |
| Noir Velours, torréfacteur | `demos/cafe/` | tourbillon de grains, plongée sur la crema |

## Organisation

- `assets/js/stage.js` : moteur commun (rendu, chapitres, plans de caméra, adaptation de la définition).
- `assets/js/kit.js` : éclairage de studio, fonds, matières, particules, bruit.
- `assets/css/ecrin.css` : mise en page et typographie communes ; chaque démo règle sa palette dans son propre CSS.
- `assets/vendor/three/` : Three.js r180 (licence MIT), servi avec le site. Polices : Cormorant Garamond,
  Manrope, Fraunces, Bodoni Moda (licence OFL).
- `assets/img/` : photographies générées par IA (Higgsfield).

Tout est statique et en chemins relatifs : le dossier se publie tel quel (Netlify, GitHub Pages…).
Pour le voir en local :

```bash
python3 -m http.server 8200 --directory sites/ecrin
```

## Ajouter une démo

Copier un dossier de `demos/`, puis adapter `index.html` (textes, chapitres `data-chapter`),
le CSS (variables de couleur et police) et `scene.js` (objet 3D, un plan de caméra par chapitre).
Ajouter ensuite la ligne correspondante dans `index.html` à la racine.

Les maisons présentées sont fictives ; les formulaires n'envoient rien.
