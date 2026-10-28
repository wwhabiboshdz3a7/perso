# Motion Lab — typographie cinétique

Un site de démonstration consacré au texte en mouvement : un showreel immersif piloté par le défilement, un lab de vingt-cinq effets isolés et réglables, et, en section secondaire, le Labo maths (dix sites vitrines animés par des équations).

Tout est en HTML, CSS et JavaScript, sans étape de build. Le dossier racine se publie tel quel sur Netlify (`netlify.toml` fourni, publication du dossier `.`).

## Structure

```
index.html                  Showreel : 15 scènes plein écran enchaînées au défilement
assets/kinetic.css          Socle commun : couleurs, polices, grain, curseur, composants
assets/reel.css, reel.js    Mise en scène du showreel (scènes empilées, transitions, HUD, menu)
assets/core.js              Outils : boucles suspendues hors écran, pointeur/gyroscope, mesure du texte
assets/fx/<effet>.js        Un module par effet (réutilisé par le lab et par le showreel)
assets/lab/                 Catalogue des effets, page d'effet (réglages, rejouer), galerie
lab/index.html              Galerie : vignettes vivantes de chaque effet
lab/<effet>/index.html      Un effet plein écran, texte / vitesse / couleur réglables
maths/                      Labo maths : hub + 10 sites (maths/sites/<slug>/)
vendor/gsap/                GSAP 3.13 et plugins (ScrollTrigger, SplitText, ScrambleText…)
vendor/lenis/               Lenis (défilement lissé)
vendor/three.module.min.js  three.js 0.170 pour le Labo maths
```

## Le showreel

Un manifeste en quinze mouvements — « Le texte n'est plus posé. Il bouge, il respire, il réagit. » Chaque scène reste collée à l'écran pendant que la suivante la recouvre (clip-path en carte, en cercle ou en diagonale), avec compteur de scène, barre de progression et menu plein écran.

| # | Scène | Effet |
|---|---|---|
| 01 | Ouverture | Split lettre par lettre en élastique, puis les lettres décollent en 3D au défilement |
| 02 | Il bouge | Roboto Flex : graisse, chasse et inclinaison en vagues, accélérées par la vitesse de défilement |
| 03 | Il respire | Rideau de lignes qui entrent en prenant du poids (police variable), puis relâchent |
| 04 | Décodage | Mots déchiffrés au défilement, journal de terminal, pluie de glyphes |
| 05 | Élan | Marquees croisés qui accélèrent et se penchent avec la vitesse de défilement |
| 06 | Lecture | Paragraphe colorié mot à mot, surlignage des mots clés (bascule en clair) |
| 07 | Rotation | Cylindre de lettres en 3D CSS entraîné par le défilement |
| 08 | Il réagit | Lettres-ressorts repoussées par le pointeur (gyroscope ou auto-animation sur mobile) |
| 09 | Poussière | Texte échantillonné en particules : DÉFAIT se disperse et se reforme en REFAIT |
| 10 | Trouble | Shader WebGL : ondulation, séparation RGB, tranches de glitch |
| 11 | Lumière | Texte-fenêtre sur un fond animé, puis plongée dans le I jusqu'à remplir l'écran |
| 12 | Chiffres | Compteurs géants façon odomètre |
| 13 | Gravité | Mots qui tombent, rebondissent, s'empilent et se lancent à la souris |
| 14 | Chaos | Lettres posées sur l'attracteur de Lorenz, lien vers le Labo maths |
| 15 | Motion | Zoom infini à travers le O, tableau split-flap et machine à écrire |

## Le lab

Vingt-cinq effets plein écran, chacun avec le nom de sa technique, un bouton « Rejouer » (ou touche R), un champ pour taper son propre texte, la vitesse et la couleur (et un mode pour certains) : split élastique, décodage, cylindre, tunnel, sphère de lettres, ressorts, police variable, masque vivant, particules, liquide & glitch, marquees croisés, texte sur chemin, contour SVG, machine à écrire, zoom infini, kaléidoscope, rideau de lignes, odomètre, gravité, surlignage, ASCII, split-flap, vague, lettres de Lorenz, spirale dorée. La galerie affiche des vignettes vivantes, chargées seulement quand elles sont visibles. Le texte peut aussi être passé dans l'URL : `lab/split/?t=Bonjour`.

## Le Labo maths

La collection précédente, déplacée dans `maths/` : dix sites vitrines dont l'animation est pilotée par une formule (Lorenz, Aizawa, Clifford, champ de vecteurs, Fourier, Gray-Scott, superformule, Julia, boids, jeu de la vie).

## Principes

- Animations sur `transform`, `opacity`, canvas ou WebGL ; boucles suspendues hors écran et quand l'onglet est masqué ; `devicePixelRatio` plafonné.
- Mobile : moins de particules, pointeur remplacé par le gyroscope ou une trajectoire automatique.
- `prefers-reduced-motion` : pas de défilement lissé ni de scène collée, chaque scène est affichée dans son état final lisible.
- Sans WebGL : la scène « Trouble » et l'effet « Liquide » passent sur une version CSS.
- Polices Google variables : Anybody, Roboto Flex, Fraunces, Recursive, Big Shoulders Display.

## Développer en local

```
python3 -m http.server 8000
```

puis ouvrir `http://localhost:8000/`. Les modules ES exigent un serveur HTTP.
