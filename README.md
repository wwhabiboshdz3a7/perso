# perso

Projets web personnels. Chaque branche est un site autonome, publiable tel quel sur Netlify (dossier racine).

| Branche | Contenu |
|---|---|
| `motion-lab` | Sites vitrines « motion » : animations pilotées par des maths (attracteurs étranges, champs de vecteurs, épicycles de Fourier, réaction-diffusion, shaders). |
| `demos-toulouse` | Démos de sites pour commerces toulousains (restaurant, coiffeur, garage, etc.), chacune avec sa fonctionnalité métier (réservation, prise de RDV, devis…). |
| `academy` | Plateforme de formation au code (C, Python, HTML/CSS, JS, C++, cyber, IA) et à la vidéo IA, du débutant à l'avancé, avec éditeur intégré. |
| `nexora-v2` | Refonte complète du site de l'agence NEXORA. |
| `sites/ecrin` (dossier) | **Écrin** : galerie de démos de sites premium en WebGL/3D (pizzeria, horlogerie, parfumerie, pâtisserie, champagne, torréfacteur). En ligne : https://ecrin-demos-3d.netlify.app |

## Publier sur Netlify

1. Nouveau site → « Import from Git » → ce dépôt.
2. Choisir la branche voulue, dossier de publication : `/` (ou celui indiqué dans le `netlify.toml` de la branche).
3. Aucune commande de build nécessaire.

## Liens publics automatiques (Quai sur GitHub Pages)

Chaque projet du dépôt reçoit un lien public gratuit, accessible depuis n'importe quel appareil :

    https://wwhabiboshdz3a7.github.io/perso/<projet>/

La liste de tous les liens est sur https://wwhabiboshdz3a7.github.io/perso/

Deux façons d'ajouter un projet :

1. **Déposer un dossier ou un `.zip`** dans [`sites/`](sites/) sur la branche `main`
   ([page de dépôt](https://github.com/wwhabiboshdz3a7/perso/upload/main/sites)), puis valider avec
   « Commit changes ». Le lien est en ligne une à deux minutes plus tard.
2. **Créer une branche** qui contient le site : elle est publiée sous son nom
   (`motion-lab` → `…/perso/motion-lab/`). Une branche modifiée est republiée dans les dix minutes.

Le projet doit avoir un `index.html` à sa racine (ou dans le dossier `publish` de son `netlify.toml`).

**Activation, une seule fois :** dans [Settings → Pages](https://github.com/wwhabiboshdz3a7/perso/settings/pages),
choisir **GitHub Actions** dans le menu **Source**.

Limites : GitHub Pages ne sert que des fichiers. Les fonctions serveur et les formulaires Netlify
ne fonctionnent pas sur ces liens ; les projets concernés sont signalés sur la page d'accueil.

Le fonctionnement est décrit dans [`quai/README.md`](quai/README.md).
