# Lumio — plateforme de formation

Lumio est une plateforme de formation web, en français, entièrement statique : aucun serveur, aucune étape de build, aucune inscription. Elle s'ouvre dans un navigateur et se publie telle quelle sur Netlify (ou n'importe quel hébergement de fichiers).

## Parcours

**Programmation & informatique** — Python, JavaScript, HTML, CSS, C, C++, Cybersécurité, IA & machine learning (4 modules × 4 leçons chacun, du débutant au projet final), Git & ligne de commande (2 modules).

**Cyber, enquête & CTF** — Méthodo OSINT (4 modules × 4 leçons : méthodologie, géolocalisation, cartes et OpenStreetMap, éthique, cadre légal et outils) et l'**arène CTF** (54 défis, voir plus bas).

**Création de contenu avec l'IA** — Vidéo IA & création de contenu (5 modules × 4 leçons) : images, vidéo, voix et lipsync, formats courts, publicité, UGC, montage, droit et éthique.

**Business digital** — Créer son business digital (1 module) : site, SEO local, Google Business Profile, publicité Google/Meta, automatisation et création d'entreprise en France.

Au total : 44 modules, 176 leçons, 176 exercices, 528 questions de quiz, et 54 défis CTF.

## Fonctionnalités

- Théorie illustrée d'exemples commentés, mini-quiz corrigé avec explications sur chaque leçon.
- Éditeur de code intégré (CodeMirror) avec coloration par langage.
- Exécution dans le navigateur : JavaScript (Worker isolé avec délai maximal), Python (Pyodide, chargé à la demande), HTML et CSS (aperçu en direct).
- Vérification automatique des exercices par des tests qui expliquent ce qui manque ; solution commentée disponible après deux essais.
- Pour C et C++ : exercices « sortie attendue » avec comparaison à la solution et question de vérification, textes à trous, commandes de compilation locale.
- Pour la cybersécurité : labs défensifs (analyse d'en-têtes HTTP, hachage et chiffrement avec Web Crypto, détection d'injections, journaux, mini-CTF).
- Pour l'IA : algorithmes codés en Python pur (régression, descente de gradient, k-NN, perceptron, k-means, arbres, régression logistique) et notions LLM, prompting, RAG, agents.
- Pour l'OSINT : exercices de code vérifiés (variantes de pseudo, plaques algériennes, heure solaire vers heure légale, DMS et distance haversine), requêtes Overpass à trous, rédactions évaluées (plan d'enquête, journal, rapport d'audit).
- Progression locale (localStorage) : leçons terminées, XP, série quotidienne, badges ; page profil avec export/import JSON (arène CTF comprise) ; certificat imprimable par parcours terminé.
- Recherche globale (leçons et défis), glossaire, mode sombre/clair, tailles de texte, raccourcis clavier, interface responsive.

## Arène CTF (`#/ctf`)

54 défis, du grand débutant à l'intermédiaire, en 9 catégories. Chacun a un briefing scénarisé, des ressources, 1 à 3 indices payants en points, des points selon la difficulté, une validation, puis un **writeup** (solution expliquée pas à pas) débloqué après réussite ou abandon.

| Catégorie | Défis | Contenu |
|---|---|---|
| Géolocalisation (GEOINT) | 10 | Scènes illustrées à indices réels : Capitole, Pont-Neuf et Cité de l'espace à Toulouse, Abbesses à Paris, Carcassonne, Maqam Echahid à Alger, Kabylie (tifinagh), Le Cap (soleil au nord, conduite à gauche), Montréal (ARRÊT), cadran solaire (heure légale) |
| Métadonnées & EXIF | 5 | Vrais JPEG avec EXIF (appareil, GPS, date, auteur, miniature différente de l'image) et inspecteur EXIF intégré |
| OpenStreetMap & Overpass | 5 | Île fictive de Saint-Lumin-sur-Mer (GeoJSON aux tags OSM réels), éditeur Overpass QL local ou en ligne (overpass-api.de), lien overpass-turbo |
| OSINT (personnage fictif) | 5 | Faux réseaux sociaux, blog, archive du Web, pseudo réutilisé, reflet dans des lunettes, fuite sur un site de partage, avec bandeau éthique et légal |
| Image inversée & vérification | 5 | Résultats Google Lens, Yandex, Bing et TinEye simulés : première publication, image retournée, recadrage, photomontage, image générée |
| Crypto débutant | 8 | César, ROT13, Base64/32, hexadécimal, Morse, Vigenère, XOR, substitution, avec une boîte à outils à recettes enchaînables |
| Stéganographie | 5 | `strings`, texte presque invisible, LSB, ZIP collé après la fin d'un JPEG, message dans le spectrogramme d'un WAV |
| Web débutant | 6 | Mini-sites vulnérables simulés dans une iframe isolée : code source, robots.txt, en-têtes, cookie modifiable, champ caché, JavaScript obscurci |
| Forensique & terminal | 5 | Journaux (IP de l'attaquant, chronologie), signatures de fichiers, terminal Linux simulé (`ls cd cat grep file strings base64 head tail find`) |

**Aucun flag ni aucune coordonnée cible en clair dans le site publié.** Les flags (format `LUMIO{...}` ; casse, accents et espaces normalisés) sont vérifiés par empreinte SHA-256 (Web Crypto). Un clic sur la carte est converti en geohash, dont l'empreinte est comparée à l'ensemble des cellules acceptées (cible et voisines, avec des anneaux de distance pour un score dégressif). Writeups et indices sont stockés masqués et révélés par l'application.

Autour des défis :

- carte Leaflet (servie localement) sur tuiles OpenStreetMap avec attribution, et repli automatique sur un fond Natural Earth simplifié si les tuiles ne chargent pas ;
- établi d'analyse : boîte à outils, inspecteur EXIF, hex & signatures, labo image, spectrogramme (aussi utilisable sur ses propres fichiers, sans rien envoyer) ;
- **classement local** (pseudo, points, temps, parties archivées, cartes de score à échanger), badges CTF, progression par catégorie ;
- **packs de défis** JSON à créer et partager entre amis (flags et cibles exportés sous forme d'empreintes) ;
- charte éthique (RGPD, Code pénal art. 323-1 et suivants).

## Ajouter ses propres photos de défis

1. Dépose tes images dans `assets/ctf/photos/` (de préférence tes propres photos ; retire les métadonnées GPS si tu ne veux pas les donner : `exiftool -all= photo.jpg`).
2. Décris tes défis dans `outils/ctf/mes-photos.json` (réponses en clair : ce fichier n'est jamais publié). Pour une géolocalisation : `validation: "carte"`, `lat`, `lon`, `rayon` (mètres, plein score), `lieu`, `vue` ; pour un flag : `validation: "flag"` et `flag: "LUMIO{...}"`. Champs communs : `titre`, `accroche`, `briefing`, `image`, `alt`, `difficulte` (1 à 3), `points`, `indices` (`[{ "cout": 20, "texte": "…" }]`, 3 au plus), `writeup`.
3. Lance `node outils/ctf/photos.mjs` : il écrit `assets/ctf/photos/defis.json` (empreintes uniquement) et la catégorie « Mes photos » apparaît dans l'arène.

Sans Node : dans l'arène, onglet **Packs**, coche « Pack Mes photos du propriétaire », crée les défis avec le formulaire, puis « Générer le pack » télécharge un `defis.json` à placer dans `assets/ctf/photos/`.

## Structure

```
index.html            page unique (SPA, routage par hash : #/parcours/python, #/cours/python/3, #/ctf, #/ctf/geo-capitole, #/ctf/classement…)
404.html              page d'erreur (servie notamment pour /outils/*)
app/                  application : app.js (vues, routage), runner.js, editor.js, progress.js (XP, badges, arène), style.css
app/ctf/              arène : ctf.js (vues), securite.js (empreintes, geohash, masquage), carte.js (Leaflet + repli), packs.js,
                      commun.js, ctf.css, outils/ (boîte à outils, EXIF, hex, labo image, spectrogramme, Overpass, terminal,
                      navigateur web simulé, recherche inversée simulée)
content/              un module JavaScript par parcours (python.js, …, osint.js), index.js (registre), glossaire.js, _outils.js
content/ctf/          categories.js et defis.js (généré, sans aucune solution en clair)
assets/ctf/           scenes/ (images des défis), fichiers/ (JPEG EXIF, PNG LSB, WAV, PDF…), donnees/ (GeoJSON), photos/
vendor/               CodeMirror 5, Pyodide, Leaflet 1.9.4, topojson-client, world-atlas (fond hors ligne), avec leurs licences
outils/               jamais publié (404 forcé par netlify.toml) :
  stats.mjs                 vérifie parcours et défis (chargement, comptes, fichiers référencés)
  ctf/source/*.mjs          sources des défis (flags, cibles, writeups en clair)
  ctf/generer.mjs           produit content/ctf/defis.js et solutions.json, et vérifie qu'aucun secret ne fuit
  ctf/scenes/               scènes de géolocalisation et de vérification dessinées en SVG
  ctf/rendre_scenes.mjs     rend les scènes en JPEG/PNG (Playwright)
  ctf/generer_fichiers.py   fichiers EXIF, stéganographie et son (Pillow, piexif, numpy)
  ctf/generer_donnees.mjs   jeu de données OSM fictif de Saint-Lumin-sur-Mer
  ctf/photos.mjs            pack « Mes photos » à partir de ctf/mes-photos.json
netlify.toml          publication (dossier racine), en-têtes, 404 forcé sur /outils/*
```

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
node outils/stats.mjs   # vérification des parcours et des défis
```

## Modifier les défis

```bash
node outils/ctf/generer.mjs                                       # après toute modification de outils/ctf/source/*.mjs
NODE_PATH=$(npm root -g) node outils/ctf/rendre_scenes.mjs geo-   # après modification d'une scène (Playwright requis)
python3 outils/ctf/generer_fichiers.py                            # fichiers binaires (pip install pillow piexif numpy)
node outils/ctf/generer_donnees.mjs                               # données OSM fictives
```

Le générateur refuse de produire `defis.js` si un flag est mal formé, si une cible n'est pas acceptée par ses propres zones, ou si un flag ou une coordonnée cible apparaît en clair dans un fichier publié.

## Déploiement sur Netlify

Aucune commande de build : publier le dossier racine (`publish = "."` dans `netlify.toml`). Ce fichier configure les en-têtes de sécurité, le cache des bibliothèques et des images, et renvoie une **404 forcée sur `/outils/*`** : les sources des défis et les solutions ne sont jamais accessibles en ligne.

En ligne, l'arène utilise les tuiles `tile.openstreetmap.org` (attribution « © contributeurs OpenStreetMap ») et, à la demande, `overpass-api.de` ; tout le reste (bibliothèques, fond de carte de secours, images, outils) est servi localement. Sans réseau, les défis restent résolubles (fond simplifié, saisie de coordonnées, jeu de données local).

## Ajouter une leçon

Chaque fichier de `content/` exporte un objet `{ description, intro, modules: [{ titre, niveau, lecons: [{ titre, theorie, exercice, quiz }] }] }`. Un exercice a un `type` (`code`, `sortie`, `trous`, `qcm`, `texte`) ; les exercices `code` déclarent un `langage` et une liste de `tests` construits avec les aides de `content/_outils.js`.

## Éthique

Tous les personnages, sites, fuites et serveurs de l'arène sont fictifs et simulés dans la page. Les techniques enseignées ne s'appliquent jamais à une personne réelle sans base légale ni consentement (RGPD), et jamais à un système sans autorisation écrite (Code pénal, articles 323-1 et suivants). Voir la charte : `#/ctf/charte`.

## Licence

Contenu et code publiés pour un usage pédagogique. Bibliothèques tierces : voir les fichiers `LICENSE` de `vendor/`. Données cartographiques © contributeurs OpenStreetMap (ODbL) ; fond de secours Natural Earth (domaine public).
