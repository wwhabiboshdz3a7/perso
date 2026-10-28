# Motion Lab — sites vitrines animés par les mathématiques

Une collection de dix sites vitrines complets, en français, dont chaque animation est pilotée par une formule : attracteurs étranges, champs de vecteurs, épicycles de Fourier, réaction-diffusion, superformule, fractales, boids, automates cellulaires. Le public visé : un client qui veut refaire son site avec un effet mémorable, sans sacrifier la lisibilité ni la performance.

Tout est en HTML, CSS et JavaScript sans étape de build. Le dossier racine se publie tel quel sur Netlify (`netlify.toml` fourni, publication du dossier `.`).

## Structure

```
index.html              Page galerie : une vignette vivante (canvas) par site
assets/base.css         Socle commun : grille, composants, micro-interactions
assets/common.js        Boucle d'animation économe, panneau de paramètres, reveal, curseur…
assets/hub.js           Miniatures de la galerie
vendor/                 three.js 0.170.0 (module ES), chargé en local via import map
sites/<slug>/           Un site par concept (index.html + script dédié)
netlify.toml            Configuration de publication
```

## Les sites

| Slug | Entreprise fictive | Secteur | Mathématiques | Technique |
|---|---|---|---|---|
| `lorenz` | Strange Studio | Agence de design | Système de Lorenz (σ, ρ, β), couleur par vitesse, rotation liée au scroll | Three.js, points + traînées |
| `aizawa` | Maison Ophélia | Parfumerie | Attracteurs d'Aizawa, Thomas et Halvorsen, morphing entre systèmes | Three.js, mélange additif |
| `clifford` | Anouk Ferrand | Photographe | Attracteurs de Clifford et De Jong en accumulation de densité, coefficients qui dérivent et suivent la souris | Canvas 2D, ImageData |
| `flowfield` | Atelier Rive | Paysagistes | Champ de vecteurs tiré d'un bruit simplex 3D, bandes de courant entre sections | Canvas 2D |
| `fourier` | Maison Hélion | Horlogerie | Série de Fourier discrète, épicycles qui tracent un monogramme et révèlent le texte | Canvas 2D |
| `grayscott` | Osmose Laboratoire | Cosmétique | Réaction-diffusion de Gray-Scott, ping-pong de textures flottantes, pointeur qui dépose du réactif | WebGL2 |
| `superformule` | Orbe Joaillerie | Joaillerie | Superformule de Gielis en 3D (produit sphérique), morphing, courbe de Lissajous | Three.js, matériau physique, environnement PMREM |
| `julia` | Itéra Conseil | Conseil data | Ensemble de Julia, c = 0,7885·e^{iθ} animé, zoom qui respire, palette par cosinus | GLSL |
| `boids` | Nuée | Événementiel | Boids de Reynolds (séparation, alignement, cohésion), attirés par le curseur | Canvas 2D, grille spatiale |
| `vie` | Cellule | Coworking | Jeu de la vie de Conway et variantes B/S, dessin à la souris | Canvas 2D |

Chaque site comprend : un hero plein écran animé, une navigation, une section concept, une offre, une section « La formule » (l'équation en une phrase et un panneau de paramètres interactifs qui agit sur l'animation), une galerie générée, des tarifs ou un process, un formulaire de contact prêt pour Netlify Forms, un pied de page.

## Règles communes

- Responsive mobile, polices de 16 px minimum, contrastes AA.
- `prefers-reduced-motion` respecté : rendu statique à la place des boucles.
- Repli CSS (dégradés) si WebGL n'est pas disponible.
- Nombre de particules réduit sur petit écran, `devicePixelRatio` plafonné à 2.
- Boucles `requestAnimationFrame` suspendues quand l'onglet est masqué ou le canvas hors écran.
- Aucune image de banque : toutes les visuels sont calculés au chargement.

## Publier

Sur Netlify : « Import from Git », branche `motion-lab`, dossier de publication `/`, aucune commande de build. Les formulaires (`data-netlify="true"`) sont détectés automatiquement au déploiement.

## Développer en local

```
python3 -m http.server 8000
```

puis ouvrir `http://localhost:8000/`. Les modules ES exigent un serveur HTTP (pas d'ouverture directe du fichier).
