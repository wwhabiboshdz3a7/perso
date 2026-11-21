# Quai pour Mac

Une petite application qui tourne sur ton Mac : tu y déposes un `.zip` ou un dossier, elle l'envoie
dans ton dépôt GitHub et te donne un lien public `https://<compte>.github.io/<depot>/<projet>/`.
Plus besoin de Netlify : c'est GitHub Pages qui héberge.

## Installer

Dans l'application **Terminal**, colle cette ligne puis appuie sur Entrée :

```bash
curl -fsSL https://raw.githubusercontent.com/wwhabiboshdz3a7/perso/main/quai/mac/install.sh | bash
```

Aucun mot de passe administrateur n'est demandé. Le script :

- copie Quai dans `~/Library/Application Support/Quai/` ;
- utilise le Node.js du Mac (version 18 ou plus), ou en télécharge une copie privée depuis
  nodejs.org en vérifiant sa somme SHA-256 ;
- installe un service de fond qui démarre avec ta session (macOS peut afficher une notification
  « élément d'arrière-plan ajouté » : c'est lui) ;
- crée l'application **Quai** dans le dossier `Applications` de ton dossier personnel ;
- ouvre <http://localhost:4747>.

Pour **mettre à jour**, relance la même commande.

## Créer le jeton GitHub

À la première ouverture, Quai demande le dépôt (`proprietaire/depot`) et un jeton d'accès. Sur
<https://github.com/settings/tokens>, crée au choix :

- un jeton **classic** avec les portées `repo` et `workflow` ;
- ou un jeton **fin** (fine-grained) limité à ce dépôt, avec **Contents**, **Actions**, **Pages** et
  **Workflows** en lecture et écriture.

Colle-le dans Quai : il est rangé dans le Trousseau du Mac et n'est jamais renvoyé à la page ni
écrit dans un journal. Si la commande `gh` est déjà connectée sur ce Mac, le bouton « Utiliser ma
connexion GitHub existante » évite de créer un jeton.

Quai vérifie ensuite que le dépôt contient le fichier `.github/workflows/quai-pages.yml` et que
GitHub Pages est activé. Si ce n'est pas le cas, le bouton « Activer GitHub Pages » s'en charge
(ou, à la main : Settings → Pages → Source : **GitHub Actions**).

## Utiliser

1. Ouvre **Quai** (Spotlight, ou <http://localhost:4747>).
2. Dépose un `.zip` ou un dossier, ou choisis-le avec les boutons.
3. Vérifie le nom du projet (il apparaît dans le lien), puis « Mettre en ligne ».
4. Une à deux minutes plus tard, le lien s'affiche : « Copier le lien » ou « Ouvrir ».

Publier sous un nom qui existe déjà crée une **nouvelle version** : le lien ne change pas, et seuls
les fichiers modifiés sont renvoyés. « Mes projets » liste les sites en ligne, avec « Nouvelle
version » et « Supprimer ».

Chaque projet est une branche du dépôt qui porte son nom. Sont écartés d'office : `.git`, `.github`,
`node_modules`, `__MACOSX`, `.DS_Store`, `Thumbs.db` et les liens symboliques.

## Désinstaller

```bash
bash "$HOME/Library/Application Support/Quai/quai/mac/uninstall.sh"
```

Le service, l'application, les fichiers et les journaux sont retirés, et **le jeton est effacé du
Trousseau**. Pour le garder (réinstallation prévue), ajoute `--garder-jeton`. Les sites déjà publiés
restent en ligne ; le jeton lui-même se révoque sur <https://github.com/settings/tokens>.

## Limites

- Le projet doit avoir un `index.html` à sa racine, sinon GitHub ne le met pas en ligne (Quai
  prévient).
- 300 Mo par projet, 95 Mo par fichier, 20 000 fichiers. Pas d'archives chiffrées ni au format zip64.
- Les fichiers partent un par un : un premier envoi de plusieurs milliers de fichiers est long, et
  GitHub impose parfois des pauses (Quai attend puis reprend tout seul).
- Sites statiques uniquement : pas de fonctions serveur ni de formulaires Netlify. Les chemins
  absolus (`/style.css`) sont corrigés dans le HTML et le CSS, pas dans le JavaScript.
- Les noms `main`, `gh-pages` et celui de la branche par défaut sont réservés.
- Avec un compte GitHub gratuit, GitHub Pages demande un dépôt public : tout ce que tu publies est
  visible de tous.
- Le Mac doit être allumé et connecté à internet pendant l'envoi ; ensuite, les sites vivent chez
  GitHub.

## Sous le capot

- `server.js` : serveur local sans dépendance, à l'écoute sur `127.0.0.1` uniquement. Il refuse
  toute requête dont l'en-tête `Host` n'est pas `localhost:4747` ou `127.0.0.1:4747`, exige
  l'en-tête `X-Quai: 1` sur l'API et n'envoie aucun en-tête CORS : un autre site web ne peut pas
  s'en servir.
- `github.js` : envoi par l'API Git de GitHub (un blob par fichier, un arbre, un commit, la
  branche), lancement du workflow `quai-pages.yml`, suivi de l'exécution puis du lien.
- `secrets.js` : Trousseau via `/usr/bin/security` sur macOS ; ailleurs `~/.quai/config.json` en
  mode 600.
- Journal du service : `~/Library/Logs/Quai/quai.log`.
- Lancer à la main : `node quai/mac/server.js`. Variables : `QUAI_MAC_PORT`, `QUAI_GITHUB_API`,
  `QUAI_PAGES_ORIGIN`, `QUAI_MAC_CONFIG_DIR`. Tests : `cd quai && npm test`.
