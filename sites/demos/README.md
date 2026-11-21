# Démos — deux formules, tous les métiers

Le catalogue de démonstration : une page d'accueil, et deux familles de sites complets pour des
entreprises fictives.

| Formule | Dossier | Contenu |
|---|---|---|
| **Éco** | `eco/demos/<métier>/` | 23 sites vitrines, chacun avec sa fonction métier (réservation, devis, commande…) |
| **Premium** | `premium/<métier>/` | Le même métier avec un film piloté par le défilement, un module 3D interactif et un assistant |

## Premium

Chaque démo Premium assemble les mêmes briques (`assets/premium/`) avec sa propre identité :

- `film.js` : séquences d'images (`media/<plan>/f-001.webp…`) que l'on fait avancer en défilant.
- `chat.js` : assistant à réponses préparées, configuré dans la page (`<script id="chat">`).
- un module 3D propre au métier (Three.js, servi avec le site dans `assets/vendor/three/`).
- `ui.js`, `premium.css`, `kit.js`, `stage.js` : apparitions, formulaires de démonstration, éclairage et matières 3D.

Les photos et vidéos ont été générées avec Higgsfield (images GPT Image, vidéos Kling 3.0) puis
converties : boucles `.mp4` légères pour l'ambiance, suites d'images `.webp` pour le film.

## Éco

Les 23 démos viennent de la branche `demos-toulouse`. Ici, chaque démo a une photo d'ouverture
dédiée (`hero.webp`) hébergée avec le site, un lien vers sa version Premium quand elle existe, et
un retour vers le catalogue. Les autres photos restent chargées depuis Unsplash.

## Voir en local

```bash
python3 -m http.server 8400 --directory sites/demos
```

Tout est statique et en chemins relatifs : le dossier se publie tel quel sur GitHub Pages.
Les entreprises, adresses, prix et avis sont inventés ; les formulaires n'envoient rien.
