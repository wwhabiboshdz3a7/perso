# Contribuer à Kinetika

Merci de votre intérêt ! Les contributions sont les bienvenues : signalements de bugs, idées, documentation, exemples et code.

## Avant de commencer

- Pour un bug, ouvrez un ticket avec un exemple minimal (le bac à sable du site de documentation permet de partager un lien vers du code qui reproduit le problème).
- Pour une nouvelle fonctionnalité, ouvrez d’abord un ticket pour en discuter : Kinetika veut rester petite, lisible et sans dépendance.

## Installer le projet

```sh
git clone https://github.com/wwhabiboshdz3a7/kinetika.git
cd kinetika
npm install
npm test          # tests unitaires (node --test + jsdom)
npm run types     # vérification des types TypeScript
npm run build     # régénère dist/ et affiche les tailles
python3 -m http.server 8080   # puis http://localhost:8080 pour le site
```

Node 18 ou plus récent est nécessaire.

## Organisation

| Dossier | Contenu |
|---|---|
| `src/` | Code de la librairie (modules ES, aucune dépendance). |
| `test/` | Tests `node --test` ; `test/types.ts` vérifie les types. |
| `types/` | Déclarations TypeScript écrites à la main. |
| `dist/` | Builds générés par `npm run build` (committés). |
| `exemples/` | Exemples de la galerie, une page autonome par exemple, et leur catalogue. |
| `api/donnees.js` | Données de la référence de l’API. |
| `site/` | Styles et scripts du site de documentation. |

## Règles du code

- Code original, en JavaScript moderne (modules ES), sans dépendance à l’exécution.
- Commentaires sobres, en français.
- Toute nouvelle fonctionnalité vient avec des tests, une entrée dans `types/index.d.ts`, dans `api/donnees.js` et, si possible, un exemple.
- Les animations respectent `prefers-reduced-motion` (le moteur s’en charge par défaut : ne le contournez pas sans raison).
- `npm test`, `npm run types` et `npm run build` doivent passer avant toute demande de fusion ; committez les fichiers de `dist/` régénérés.

## Ajouter un exemple

1. Créez `exemples/mon-exemple.html` en partant d’un exemple existant : le CSS dans `<style data-ex>`, le HTML entre `<!--ex-->` et `<!--/ex-->`, le JavaScript dans `<script type="module" data-ex>` (c’est ce que le bac à sable charge).
2. Déclarez-le dans `exemples/catalogue.js` (titre, catégorie, fonctions utilisées, description).
3. Vérifiez-le en plein écran, en vignette, à 390 px de large et avec le mouvement réduit activé, sans erreur dans la console.

## Messages de commit

En français, à l’impératif ou au nominatif, courts et précis : « Timeline : position relative à un libellé », « Corrige le découpage en lignes des éléments imbriqués ».

## Licence

En contribuant, vous acceptez que votre contribution soit publiée sous la licence MIT du projet.
