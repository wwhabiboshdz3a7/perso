# perso

Projets web personnels. Chaque branche est un site autonome, publiable tel quel sur Netlify (dossier racine).

| Branche | Contenu |
|---|---|
| `motion-lab` | Sites vitrines « motion » : animations pilotées par des maths (attracteurs étranges, champs de vecteurs, épicycles de Fourier, réaction-diffusion, shaders). |
| `demos-toulouse` | Démos de sites pour commerces toulousains (restaurant, coiffeur, garage, etc.), chacune avec sa fonctionnalité métier (réservation, prise de RDV, devis…). |
| `academy` | Plateforme de formation au code (C, Python, HTML/CSS, JS, C++, cyber, IA) et à la vidéo IA, du débutant à l'avancé, avec éditeur intégré. |
| `nexora-v2` | Refonte complète du site de l'agence NEXORA. |

## Plan d'attaque commercial (branche `claude/upbeat-curie-ofztql`)

`index.html` à la racine : présentation HTML de 22 diapositives (inventaire des projets, ce qui se vend, offre de niche « Lumio Enquête », logique et grille de prix, techniques de vente, réseaux sociaux, plan sur 90 jours). Navigation au clavier (← →, O pour la vue d'ensemble, F pour le plein écran), lecture empilée sur mobile, export PDF par l'impression du navigateur.

## Publier sur Netlify

1. Nouveau site → « Import from Git » → ce dépôt.
2. Choisir la branche voulue, dossier de publication : `/` (ou celui indiqué dans le `netlify.toml` de la branche).
3. Aucune commande de build nécessaire.
