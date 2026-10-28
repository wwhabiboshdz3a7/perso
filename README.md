# NEXORA — site de l’agence

Site statique multi-pages (HTML, CSS, JavaScript), sans étape de build. Publiable tel quel sur Netlify.

## Structure

```
.
├── index.html                      Accueil
├── services/
│   ├── index.html                  Vue d’ensemble des quatre pôles
│   ├── web.html                    NEXORA Web (sites, SEO)
│   ├── films.html                  NEXORA Films (vidéo)
│   ├── ads.html                    NEXORA Ads (publicité, réseaux)
│   └── admin.html                  NEXORA Admin (création d’entreprise)
├── tarifs.html                     Offres, comparatif, options, simulateur
├── realisations.html               Exemples de projets, filtres par secteur
├── a-propos.html                   Histoire, équipe, engagements
├── contact.html                    Formulaire Netlify, carte
├── merci.html                      Confirmation après envoi du formulaire
├── mentions-legales.html
├── politique-confidentialite.html
├── 404.html
├── assets/
│   ├── css/style.css               Feuille de style commune
│   ├── js/main.js                  Menu, animations, filtres, simulateur
│   └── og.png                      Image de partage (réseaux sociaux)
├── favicon.svg · site.webmanifest
├── robots.txt · sitemap.xml
└── netlify.toml                    Publication, en-têtes de sécurité, redirections
```

## Déploiement sur Netlify

1. Nouveau site → « Import from Git » → ce dépôt, branche `nexora-v2`.
2. Dossier de publication : `.` (déjà indiqué dans `netlify.toml`). Aucune commande de build.
3. Dans Netlify → *Forms*, vérifier que le formulaire `contact` est détecté et activer les notifications par e-mail.

Aperçu local : `python3 -m http.server 8000` puis http://localhost:8000.

## Où modifier

- **Textes et contenus** : directement dans chaque fichier HTML. L’en-tête (`<header>`) et le pied de page (`<footer>`) sont copiés dans chaque page : une modification de menu doit être reportée dans tous les fichiers.
- **Couleurs, polices, espacements** : variables en tête de `assets/css/style.css` (`--accent`, `--paper`, `--ink`…).
- **Tarifs** : `tarifs.html` (cartes, tableau comparatif, options) et `index.html` (section offres). Le simulateur lit les attributs `data-min` / `data-max` des cases de `tarifs.html`.
- **Adresse du site** : remplacer `https://www.nexora-agence.fr` dans les balises `canonical`, `og:url`, les données structurées JSON-LD, `sitemap.xml` et `robots.txt`.
- **Mentions légales** : compléter les champs entre crochets (`[SIRET]`, adresse, etc.) dans `mentions-legales.html` et `politique-confidentialite.html`.
- **Photos** : images Unsplash chargées par URL ; remplacer par vos propres photos dans `assets/` quand elles sont disponibles.
