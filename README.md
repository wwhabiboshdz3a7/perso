# Synapse — vos cours deviennent des fiches de révision

Collez un cours, glissez-déposez un **PDF** (ou un fichier `.txt` / `.md`) : en une seconde, Synapse en tire **une fiche de révision mise en page**, **une carte mentale animée**, **des cartes à retourner avec répétition espacée**, **un quiz à choix multiples** et **une frise chronologique**. Sans IA, sans compte, sans serveur : l'analyse se fait dans le navigateur, et rien n'en sort.

Site **100 % statique** (HTML, CSS et JavaScript natifs, aucune dépendance, aucun build), publiable tel quel sur Netlify.

## Ce que fait Synapse

| Vue | Contenu |
|---|---|
| **Import PDF** | Glisser-déposer n’importe où dans la page, ou bouton Importer. PDF.js (servi localement, chargé seulement à la demande) extrait le texte ; Synapse reconstruit lignes, paragraphes, titres (d’après la taille des caractères) et listes, retire en-têtes, pieds et numéros de page, recolle les mots coupés. Jusqu’à 120 pages ; un PDF scanné (image sans texte) est signalé. |
| **Analyse animée** | Le cours défile sous un scanner (pour un PDF, **la vraie première page**, les suivantes en éventail derrière) ; les notions trouvées **s’envolent** du document vers les compteurs : parties, définitions, dates, formules, listes, sigles, cartes. |
| **Écouter la fiche** | Lecture à voix haute (voix française du système), passage lu surligné et suivi automatiquement ; formules prononcées (« fois », « au carré », « égale »). |
| **Fiche** | Papier mis en page : « l'essentiel en un coup d'œil » (mots-clés pondérés), puis, partie par partie, définitions encadrées, formules, listes numérotées, dates en pastilles, idées clés avec les mots importants surlignés, et un bloc « Je vérifie que j'ai compris ». Impression propre en A4 (bouton Imprimer, PDF possible). |
| **Carte mentale** | Titre au centre, une branche colorée par partie, les notions en feuilles. Tracé animé, zoom à la molette ou au pincement, déplacement, définition au survol ou au toucher. |
| **Cartes** | Cartes 3D recto/verso, inclinées sous la souris avec un reflet, (définitions, sigles, dates, formules, listes, textes à trous). Retourner : clic, Espace ; répondre : ← / →, boutons, ou glisser la carte. **Répétition espacée** (boîtes de Leitner : J+1, J+3, J+7, J+16), une carte ratée revient dans la session, série de jours, répartition par boîte, confettis en fin de session réussie. |
| **Quiz** | QCM à quatre réponses ; les leurres sont les autres définitions du cours. Correction immédiate et score. |
| **Frise** | Dates du cours dans l'ordre chronologique, espacées selon les années (av. J.-C. compris). |
| **Partage par lien** | Le cours est compressé (deflate) **dans l'adresse elle-même** : le destinataire ouvre le lien et retrouve la fiche, sans serveur ni compte. |
| **Export Anki** | Fichier CSV (recto ; verso ; type) importable dans Anki. |
| **Mes fiches** | Bibliothèque locale (localStorage) : progression, cartes à revoir, anneau de maîtrise. |

Trois cours d'exemple sont fournis (Révolution française, photosynthèse, mouvement et énergie).

## Comment l'analyse fonctionne (sans IA)

`js/extract.js` lit le plan (titres Markdown, numérotations, lignes courtes en tête de paragraphe), puis reconnaît :

- **définitions** : « X : … », « X est / désigne / correspond à / consiste à … », « On appelle X … », « X, c'est … » — avec des garde-fous (pas de verbe conjugué dans le terme, une définition commence par un déterminant) ;
- **dates** : années de 3 ou 4 chiffres, jour et mois facultatifs, « av. J.-C. » ;
- **formules** (« P = m × g ») et **équations** (« … → … ») ;
- **listes** à puces avec leur phrase d'introduction ;
- **sigles** développés : « Déclaration des droits de l'homme et du citoyen (DDHC) » ;
- **mots-clés** : fréquence pondérée (termes définis, titres, sigles), mots vides exclus.

Le résultat est meilleur avec un cours structuré (titres, une idée par phrase, définitions explicites), comme une fiche écrite à la main.

## Structure

```
index.html          Application (une page)
css/app.css         Interface sombre « aurore », fiche papier, cartes 3D, impression
js/app.js           Écrans, onglets, cartes, quiz, frise, partage, export, bibliothèque
js/extract.js       Moteur d'analyse (pur, testé)
js/mindmap.js       Carte mentale SVG (tracé animé, zoom, déplacement)
js/pdf.js           Import PDF : lignes, titres, listes, en-têtes retirés (fonctions pures testées)
js/store.js         Bibliothèque locale, répétition espacée, compression du lien de partage
js/samples.js       Cours d'exemple
tests/              Tests du moteur (node --test)
vendor/pdfjs/       PDF.js 4.10.38 (Mozilla, licence Apache 2.0)
netlify.toml        Publication « . », en-têtes de sécurité (CSP)
```

## Lancer, tester, publier

```bash
python3 -m http.server 9141   # puis http://localhost:9141
npm test                      # tests du moteur d'analyse et de l'import PDF
```

Netlify : nouveau site → « Import from Git » → ce dépôt, branche `synapse`, dossier de publication `/`, aucune commande de build.

## Confidentialité

Aucune requête réseau hormis les polices (Google Fonts). Un PDF importé est lu dans le navigateur et n’est envoyé nulle part. Les cours et la progression restent dans le `localStorage` du navigateur ; un lien de partage contient le texte du cours, à ne partager qu'avec qui doit le lire.
