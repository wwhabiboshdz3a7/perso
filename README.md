# Prospecteur NEXORA

Outil de prospection pour l'agence NEXORA. Vous choisissez une zone sur une carte et des catégories de commerces. L'outil liste les établissements qui ont des avis Google mais pas de vrai site web, avec leur numéro de téléphone, sur une carte et dans une liste prête pour les appels.

- **Google Maps (Places API New)** : avis, note, téléphone, site. La clé reste sur le serveur, dans une fonction Netlify protégée par mot de passe.
- **OpenStreetMap (gratuit, sans clé)** : établissements sans site renseigné, sans les avis. Vous pouvez ensuite vérifier les meilleurs candidats sur Google.
- **Démonstration** : données fictives, aucune requête envoyée. Pratique pour découvrir l'outil.

Le site est statique (HTML, CSS, JavaScript sans compilation) et se publie tel quel sur Netlify, avec une seule fonction serveur : `netlify/functions/places.mjs`.

---

## Fonctionnalités

**Zone**
- Recherche de ville, de quartier ou d'adresse. Les quartiers de Toulouse et les communes de la métropole sont proposés hors ligne ; les autres lieux sont cherchés en ligne avec Nominatim (OpenStreetMap).
- Trois formes de zone : cercle avec rayon réglable (de 0,3 à 15 km), rectangle tracé au doigt ou à la souris, ou vue actuelle de la carte.
- Carte Leaflet avec fond OpenStreetMap, en clair ou en sombre. Bouton « Me localiser ».

**Catégories**
- 50 catégories en français, reliées aux types Google Places et aux étiquettes OpenStreetMap : restaurant, café, boulangerie, coiffeur, barbier, institut de beauté, garage, carrosserie, plombier, électricien, fleuriste, dentiste, avocat, agence immobilière, salle de sport, boutique de vêtements, opticien, pressing, auto-école, traiteur, etc.
- Sélections rapides : Classique commerces, Artisans, Beauté, Restauration, Auto. Sélection multiple et filtre texte.

**Recherche Google, avec les coûts maîtrisés**
- **Estimation avant lancement** : nombre de cellules × catégories, nombre probable de requêtes, fourchette, prix, partie déjà en cache (gratuite) et requêtes offertes restantes ce mois-ci.
- **Plafond de requêtes** réglable pour chaque recherche (150 par défaut). Arrivée au plafond, la recherche s'arrête proprement : relancez-la et ce qui a déjà été vu est repris depuis le cache.
- **Quadrillage** : la zone est découpée en cellules (1, 2, 3 ou 5 km). Chaque cellule est interrogée par catégorie avec `locationRestriction` (rectangle), `includedType` et le texte de la catégorie.
- **Pagination** : jusqu'à 3 pages de 20, soit 60 résultats, la limite de Text Search.
- **Subdivision adaptative** : une cellule qui atteint 60 résultats est coupée en 4, jusqu'à 5 niveaux.
- **Dédoublonnage** par identifiant de lieu. Seuls les établissements en activité (`OPERATIONAL`) sont gardés.
- **Cache local (IndexedDB)** de 30 jours : relancer une recherche sur la même zone ne coûte rien.
- **Côté serveur** : plafond quotidien (`MAX_REQUESTS_PER_DAY`, 400 par défaut) et limitation de débit (90 requêtes par minute et par adresse IP, 8 essais de mot de passe par quart d'heure).

**Statut du site** (les deux premiers sont vos cibles)

| Statut | Signification |
|---|---|
| **Aucun site** | Google n'a pas de `websiteUri`. |
| **Réseaux/annuaire seulement** | Le lien mène vers Facebook, Instagram, TikTok, Linktree, PagesJaunes, Tripadvisor, TheFork, Uber Eats, Deliveroo, Planity, Treatwell, Doctolib, Google Sites, un ancien site `business.site`, etc. |
| **A un site** | Vrai domaine. Un site sur un hébergement gratuit (Wix, Jimdo, WordPress.com…) est signalé « Site gratuit ». |

**Score d'opportunité (0 à 100)**
Il combine l'absence de site (42 %), le nombre d'avis (33 %, sur une échelle logarithmique), la note (15 %) et la présence d'un téléphone (10 %).
- Chaud : 75 et plus. Tiède : de 50 à 74. Froid : moins de 50.
- Moins de 5 avis : le score est plafonné à 55. Un vrai site le plafonne à 40.
- Sur la carte, les marqueurs sont colorés par niveau et leur taille dépend du nombre d'avis.

**Liste exploitable**
- Le tableau affiche le nom, la catégorie, la note, le nombre d'avis, le téléphone (un lien d'appel `tel:`), l'adresse, le lien Google Maps, le statut du site, le score et le suivi.
- Filtres : statut du site, nombre d'avis minimum, note minimum, avec téléphone, catégorie, texte. Tri par score, avis, note ou nom.
- Survoler une ligne met le marqueur en évidence, et cliquer sur un marqueur ouvre la fiche.
- Sur téléphone, le tableau devient une liste de cartes. Une barre d'onglets est en bas de l'écran et la carte vient juste après le choix de la zone.

**Fiche prospect**
- Gros bouton d'appel, bouton SMS (pour les portables) et liens Google Maps, site ou réseau, et OpenStreetMap.
- **Script d'appel, email et SMS personnalisés** avec le nom, la catégorie, le nombre d'avis, la note et la ville (« vous avez 87 avis Google avec une note de 4,8 sur 5… »), et un bouton Copier. L'offre NEXORA Starter (500 à 800 €) est mentionnée. Le prénom, l'agence, l'offre et le prix se règlent dans Réglages → Votre profil.
- Réponses aux objections courantes.

**Mini CRM local**
- Statuts : à appeler, appelé, rappeler le… (avec date et heure), intéressé, devis envoyé, client, pas intéressé, **ne plus contacter**. Ce dernier masque l'établissement de toutes les recherches suivantes.
- Pour chaque fiche : notes, interlocuteur et historique. Un rappel du jour est signalé par un bandeau « Appeler maintenant ».
- **Session d'appels** : les fiches s'enchaînent avec des boutons d'issue rapides (pas de réponse, à rappeler demain, intéressé, pas intéressé).
- « Ajouter les chauds à ma liste » ajoute d'un clic tous les prospects chauds affichés.
- **Export CSV compatible Excel français** (séparateur « ; », UTF-8 avec BOM, virgule décimale, protection contre les formules), sous forme de liste d'appel complète ou de suivi sans contenu Google.
- **Export et import JSON** du CRM, pour changer de navigateur ou garder une sauvegarde.

---

## Démarrer en local (sans clé)

```bash
python3 -m http.server 9741
# puis ouvrir http://localhost:9741
```

En local, la fonction serveur n'existe pas : utilisez « Essayer avec des données de démonstration » ou la source **OpenStreetMap**. Pour tester la fonction Google en local, utilisez Netlify CLI (`npx -p netlify-cli netlify dev`) avec un fichier `.env` qui contient les variables ci-dessous. Ce fichier est exclu de Git.

---

## Mise en ligne sur Netlify

1. Netlify → **Add new site → Import an existing project**, choisissez le dépôt et la branche `prospects`.
2. Laissez la commande de build vide. Le dossier de publication est `.`, comme indiqué dans `netlify.toml`.
3. Netlify installe la dépendance `@netlify/blobs` (compteur quotidien partagé) et publie la fonction `/api/places`.
4. Ajoutez les variables d'environnement (voir plus bas), puis **redéployez** : une variable ajoutée n'est prise en compte qu'au déploiement suivant.

### Obtenir la clé Google Places

1. Ouvrez la [console Google Cloud](https://console.cloud.google.com/) et créez un projet, par exemple « nexora-prospecteur ».
2. **Facturation** : associez un compte de facturation, obligatoire même pour rester dans les requêtes offertes. Créez au passage une **alerte budgétaire** (Facturation → Budgets et alertes), par exemple à 10 €.
3. **API et services → Bibliothèque** : activez **« Places API (New) »**. C'est bien la nouvelle API, pas « Places API » tout court.
4. **API et services → Identifiants → Créer des identifiants → Clé API.**
5. **Restreignez la clé** dans « Restrictions relatives aux API » : cochez seulement **Places API (New)**. Une restriction par site web (référent HTTP) ne fonctionne pas ici, car la clé est utilisée par le serveur Netlify et non par le navigateur. Les adresses IP de Netlify changent : n'ajoutez pas de restriction par IP.
6. Recommandé : dans **API et services → Places API (New) → Quotas**, baissez la limite de requêtes par jour, par exemple à 500. C'est une deuxième sécurité, en plus du plafond de la fonction.

### Variables Netlify

Site configuration → Environment variables :

| Variable | Obligatoire | Rôle |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | oui | Clé Google, jamais envoyée au navigateur. |
| `ACCESS_PASSWORD_HASH` | oui | Empreinte PBKDF2 du mot de passe d'accès (voir ci-dessous). |
| `TOKEN_SECRET` | oui | Secret aléatoire (64 caractères hexadécimaux) qui signe les jetons de session (HMAC-SHA256). |
| `MAX_REQUESTS_PER_DAY` | non | Plafond quotidien de requêtes Google pour tout le site (400 par défaut). |
| `TOKEN_TTL_HOURS` | non | Durée d'une session en heures (12 par défaut, 720 au maximum). |

### Créer le mot de passe d'accès

Pour que personne d'autre ne consomme votre quota, la fonction exige un mot de passe :

1. Ouvrez le site (en ligne, ou en local sur `localhost`) → onglet **Réglages → Créer le mot de passe d'accès**.
2. Choisissez un mot de passe solide : 12 caractères ou plus, en mélangeant lettres, chiffres et symboles. Le calcul se fait **dans votre navigateur** : le mot de passe n'est envoyé nulle part.
3. Copiez `ACCESS_PASSWORD_HASH` et `TOKEN_SECRET` dans Netlify, puis redéployez.
4. Connectez-vous avec ce mot de passe : Réglages → Connexion, ou directement au premier lancement d'une recherche.

Vous pouvez aussi passer par la ligne de commande (Node 20 ou plus) :

```bash
node -e "import('./js/lib/hash.js').then(async (m) => { console.log(await m.hashPassword(process.argv[1])); console.log(m.randomSecret(32)); })" 'Votre-Mot-De-Passe-Solide'
```

Changer le mot de passe déconnecte toutes les sessions ouvertes. Changer `TOKEN_SECRET` a le même effet.

---

## Coûts

**Grille utilisée par l'outil** (consultée en novembre 2026, à revérifier sur la [page officielle des tarifs Google Maps Platform](https://developers.google.com/maps/billing-and-pricing/pricing)) :
- Le téléphone, le site, la note et le nombre d'avis relèvent du niveau **Text Search Enterprise**.
- Ce niveau coûte **35 $ les 1 000 requêtes** au premier palier, après **1 000 requêtes offertes par mois** pour ce niveau.
- Le prix baisse ensuite par paliers de volume.

Le prix par requête et le nombre de requêtes offertes se modifient dans Réglages si Google change sa grille.

**Ce qui compte pour une requête**
- Chaque page de 20 résultats compte pour une requête, avec au plus 3 pages par cellule et par catégorie, avant subdivision.
- Les cellules déjà en cache (moins de 30 jours) ne coûtent rien.
- « Vérifier avec Google » (mode OpenStreetMap) coûte 1 requête par établissement, avec 20 établissements au plus par lot.
- « Actualiser depuis Google » sur une fiche coûte 1 requête de type Place Details.

**Ordres de grandeur** (cellules de 2 km, avant cache, estimation de l'outil) :

| Zone | Catégories | Requêtes probables | Prix indicatif hors requêtes offertes |
|---|---|---|---|
| Cercle de 1,5 km (centre de Toulouse) | 6 | environ 46 (de 24 à 72) | environ 1,60 $ |
| Cercle de 3 km | 6 | environ 100 | environ 3,60 $ |
| Cercle de 5 km | 10 | environ 475 | environ 16,60 $ |

En centre-ville dense, les cellules saturées sont redécoupées, ce qui ajoute des requêtes. Le plafond par recherche borne toujours la dépense. Avec les 1 000 requêtes offertes chaque mois, un usage de prospection régulier reste souvent gratuit. Le compteur « Ce mois » en haut de l'écran ne compte que les recherches faites depuis ce navigateur. La console Google Cloud fait foi.

---

## Mode gratuit OpenStreetMap

- La source **OpenStreetMap** interroge l'API Overpass, gratuite et sans clé. Elle cherche les établissements nommés des catégories choisies (étiquettes `amenity`, `shop`, `craft`, `office`, etc.) dans la zone, et récupère leur téléphone quand il est renseigné.
- Un établissement sans étiquette `website`, `contact:website` ni `url` est classé « Aucun site ». Un établissement qui n'a qu'un lien Facebook ou Instagram est classé « Réseaux seulement ».
- Il n'y a pas d'avis dans OpenStreetMap : le score utilise une valeur neutre. Filtrez, puis utilisez **« Vérifier avec Google »**. L'outil retrouve alors chaque établissement sur Google (nom et position à 350 m près) pour récupérer ses avis, sa note et son site, avec une requête par établissement.
- Les serveurs Overpass publics peuvent refuser une zone trop grande ou des requêtes trop rapprochées. Si c'est le cas, réduisez la zone ou patientez une minute.
- Les données sont © contributeurs OpenStreetMap, sous licence ODbL : l'attribution est affichée.

---

## Données, conditions de Google et RGPD

> Repères généraux, pas un avis juridique. En cas de doute, vérifiez les textes à jour (CNIL, conditions de Google Maps Platform) ou demandez à un professionnel.

**Conditions de Google Maps Platform**
- Les données Google sont affichées sur une carte qui n'est pas une carte Google (fond OpenStreetMap). L'interface affiche donc la mention **« Google Maps »** sur la carte, au-dessus de la liste et dans chaque fiche, comme le demandent les règles d'attribution de Google pour ce cas.
- **Conservation** : les identifiants de lieux (place ID) peuvent être gardés. Le reste du contenu Google (nom, adresse, téléphone, note…) est effacé automatiquement de ce navigateur au bout de **30 jours**.
- Le CRM ne garde durablement que l'identifiant et **vos propres informations** : statut, notes, rappel, interlocuteur. Une fiche expirée peut être actualisée par 1 requête.
- **Export** : les conditions de Google encadrent la copie et la conservation de leur contenu hors de l'application. Lisez-les avant d'exporter la liste d'appel complète, et supprimez les fichiers dont vous n'avez plus besoin. L'export « suivi sans contenu Google » ne contient que les identifiants, les liens Google Maps et votre suivi.

**Prospection B2B en France (RGPD)**
- **Base légale** : contacter un professionnel pour une offre liée à son activité repose en général sur l'**intérêt légitime**. Les coordonnées d'un artisan ou d'un entrepreneur individuel restent des données personnelles.
- **Information** : dès le premier contact, dites qui vous êtes et d'où viennent ses coordonnées (fiche publique Google ou OpenStreetMap), et indiquez qu'il peut s'opposer à tout moment.
- **Droit d'opposition** : utilisez le statut « Ne plus contacter » et respectez-le sans délai. Les modèles d'email et de SMS contiennent une mention STOP.
- **Email** : vers une adresse professionnelle, un message en rapport avec l'activité du destinataire est en général admis sans consentement préalable, si vous vous identifiez et offrez un moyen simple de refuser.
- **Téléphone** : l'encadrement du démarchage des consommateurs se durcit (Bloctel, évolution vers un consentement préalable). Il vise surtout les particuliers. Vérifiez les règles en vigueur si votre interlocuteur peut être considéré comme tel.
- **Durée** : ne gardez pas indéfiniment un prospect qui ne donne pas suite. La CNIL recommande en général 3 ans au plus après le dernier contact.

---

## Tests

```bash
npm test                     # tests unitaires (node:test), sans réseau
NODE_PATH=$(npm root -g) node tests/smoke.cjs /tmp/captures   # test de fumée Playwright + captures
```

- **Tests unitaires** (`tests/unit/`) : fonction Netlify appelée avec un faux Google (`tests/fixtures/mock-google.mjs`). Ils couvrent :
  - le mot de passe, les jetons signés, expirés ou falsifiés, la limitation des essais et le plafond quotidien ;
  - la pagination jusqu'à 60 résultats et le masque de champs, l'abandon du type refusé par Google et les entrées invalides ;
  - la correspondance OpenStreetMap → Google, la classification des sites, le quadrillage et la subdivision, l'estimation, le score, le CSV et la requête Overpass ;
  - l'orchestration complète : subdivision des cellules saturées, dédoublonnage, plafond et cache.
- **Test de fumée** (`tests/smoke.cjs`) : écrans principaux en 1440 et 390 px. La vraie fonction Netlify est branchée sur le faux Google ; Overpass, Nominatim et les tuiles sont simulés. Le test couvre :
  - l'estimation, la connexion, la recherche, l'attribution et la fiche ;
  - le CRM, l'export CSV et la session d'appels ;
  - le mode OpenStreetMap, la vérification Google et le générateur d'empreinte ;
  - la mise en page mobile (aucun défilement horizontal) et l'absence d'erreur dans la console.

Il demande Playwright (`npm i -g playwright && npx playwright install chromium`).

---

## Structure

```
index.html                  interface (recherche, mes prospects, réglages)
css/app.css                 identité NEXORA (nuit violette, accents or), responsive, mouvement réduit
js/app.js                   interface : carte, résultats, fiche, CRM, export, réglages
js/ui/map.js                carte Leaflet : zones, tracé du rectangle, marqueurs, attribution
js/lib/                     modules partagés navigateur / fonction / tests
  categories.js             catégories FR ↔ types Places ↔ étiquettes OSM
  geo.js                    zones, quadrillage, subdivision, estimation du coût
  search.js                 orchestration (cache, plafond, subdivision, vérification Google)
  website.js                classement « aucun site / réseaux-annuaire / site »
  score.js                  score d'opportunité
  osm.js                    requête et lecture Overpass
  store.js                  IndexedDB : cache 30 jours et CRM
  templates.js              scripts d'appel, emails, SMS, objections
  api.js, csv.js, format.js, hash.js, places-data.js, demo.js
netlify/functions/places.mjs   passerelle Google Places (clé côté serveur, mot de passe, quotas)
vendor/                     Leaflet 1.9.4 et police Lexend, hébergés avec le site
tests/                      tests unitaires, faux Google, test de fumée
```

## Limites connues

- Text Search renvoie au plus 60 résultats par requête. La subdivision contourne cette limite, mais une catégorie très dense dans une petite cellule peut rester incomplète au-delà de 5 niveaux de découpage.
- Le compteur de requêtes du mois est local au navigateur.
- La limitation de débit de la fonction est tenue en mémoire de l'instance Netlify. Le plafond quotidien est partagé grâce à Netlify Blobs, avec un repli en mémoire si ce service est indisponible.
- La correspondance OpenStreetMap → Google repose sur le nom et la position : un établissement renommé ou mal placé peut ne pas être retrouvé.
- Le CRM vit dans le navigateur : exportez-le régulièrement en JSON.
