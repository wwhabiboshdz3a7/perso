# NEXORA — site vitrine

Site one-page statique de l'agence digitale NEXORA (Toulouse · France · Algérie).
HTML, CSS et JavaScript natifs : aucun build, aucune dépendance JavaScript externe.

## Structure

```
.
├── index.html                    page unique (sections reliées par ancres)
├── mentions-legales.html
├── politique-confidentialite.html
├── merci.html                    page affichée après l'envoi du formulaire
├── 404.html
├── assets/
│   ├── css/style.css             feuille de style unique (variables en tête)
│   ├── js/main.js                menu mobile, apparitions au défilement, vidéo du hero
│   ├── hero.mp4                  vidéo de fond du hero (sans son)
│   ├── img/hero-poster.jpg       image affichée avant la vidéo / sans animation
│   └── og.png                    image de partage (1200 × 630)
├── favicon.svg
├── site.webmanifest
├── robots.txt
├── sitemap.xml
└── netlify.toml                  publication, en-têtes de sécurité, redirections
```

Sections de `index.html` : hero, services (4 pôles), secteurs, méthode, tarifs,
avis, ADN / mission, FAQ, appel à l'action, contact.

## Charte

- Couleurs (variables CSS dans `:root`) : `--void #07030F`, `--purple #7C3AED`,
  `--iris #A78BFA`, `--mauve #C084FC`, `--dusk #E879F9`, `--gold #FBBF24`,
  `--mist #C4B5FD`, `--fog #7C6FA0`.
- Typographie : une seule famille, **Lexend** (Google Fonts), graisses 300 à 800.
  Tailles définies par une échelle `clamp()` (`--fs-*`).
- Animations discrètes, désactivées si l'utilisateur a demandé à réduire les animations.

## Formulaire de contact

Le formulaire utilise **Netlify Forms** (`data-netlify="true"`, champ anti-spam
`bot-field`). Les messages apparaissent dans l'interface Netlify, rubrique *Forms* ;
activez-y une notification e-mail vers `nexora.pro.web@gmail.com`.

## Avant la mise en ligne

- Compléter les mentions entre crochets dans `mentions-legales.html` et
  `politique-confidentialite.html`.
- Remplacer les avis de la section « Ce que nos clients en disent » par de vrais
  témoignages (avec l'accord des clients).
- Vérifier le nom de domaine (`https://www.nexora-agence.fr`) dans `index.html`,
  `sitemap.xml` et `robots.txt`.
- WhatsApp / appel : boutons prêts en commentaire dans la section contact,
  à activer avec le bon numéro.

## Aperçu local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Déploiement sur Netlify

- **Depuis Git** : connecter le dépôt ; `netlify.toml` publie la racine (`publish = "."`).
- **Glisser-déposer** : déposer le dossier du site sur https://app.netlify.com/drop.
- **CLI** : `netlify deploy --dir=. --prod`.
