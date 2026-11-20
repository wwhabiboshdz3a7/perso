# Quai

Ta plateforme de déploiement : tu déposes un projet, tu récupères un lien. Deux modes.

| Mode | Liens | Ce qu'il faut |
|---|---|---|
| **GitHub Pages** (recommandé) | Publics, `https://compte.github.io/depot/projet/` | Rien à faire tourner : GitHub héberge |
| **Serveur perso** | `http://projet.localhost:8080/` ou ton adresse | Une machine allumée avec Node |

## Mode GitHub Pages

Le fichier `.github/workflows/quai-pages.yml` lance `quai/pages/build.js`, qui assemble en un seul
site :

- chaque **branche** du dépôt contenant un `index.html` (à la racine, ou dans le dossier `publish`
  de son `netlify.toml`), publiée sous le nom de la branche ;
- chaque **dossier ou `.zip`** déposé dans `sites/` sur la branche principale.

Il génère aussi la page d'accueil qui liste les liens. La publication se déclenche :

| Événement | Délai |
|---|---|
| Dépôt dans `sites/` (push sur la branche principale) | 1 à 2 minutes |
| Création ou suppression d'une branche | 1 à 2 minutes |
| Modification d'une branche existante | 10 minutes au plus (vérification périodique) |
| Bouton « Run workflow » dans l'onglet Actions | immédiat |

Ce que fait l'assemblage pour qu'un site prévu pour Netlify marche sous `/depot/projet/` :

- les chemins absolus (`href="/style.css"`, `url(/img.png)`) sont préfixés dans le HTML et le CSS.
  Le JavaScript n'est jamais modifié : un chemin absolu construit en JS restera cassé ;
- les chemins masqués dans `netlify.toml` (redirection `404` forcée) ne sont pas publiés, ni le
  dossier `netlify/`, ni les fichiers cachés ;
- les fonctions serveur et formulaires Netlify ne peuvent pas tourner sur GitHub Pages : les projets
  concernés sont signalés sur la page d'accueil.

Activation, une seule fois : Settings → Pages → Source → **GitHub Actions**. Le dépôt doit être
public (ou le compte payant). Pour tester l'assemblage en local :

```bash
node quai/pages/build.js --out _site
```

## Mode serveur perso

Un seul serveur Node, aucune dépendance, aucune base de données.

- **Dépôt direct** : glisser-déposer d'un dossier ou d'un zip dans l'interface.
- **Lien automatique** : `http://mon-projet.localhost:8080/` en local, `https://ton-adresse/mon-projet/` en ligne.
- **Nouvelles versions** : même lien, historique des 5 dernières versions, retour en arrière en un clic.
- **Git** : import d'une branche d'un dépôt, et webhook pour redéployer à chaque push.
- **Terminal** : `node cli.js ./mon-dossier`.

Quai sert des sites **statiques** (HTML, CSS, JS, images). Il ne lance pas de commande de build
et n'exécute pas de code serveur.

## Démarrer

Il faut Node 18.17 ou plus récent.

```bash
cd quai
```

```bash
node server.js
```

Ouvre http://localhost:8080. Au premier démarrage, le serveur affiche un **jeton d'accès** dans le
terminal (il est aussi enregistré dans `data/token`) : c'est le mot de passe de l'interface.

## Utiliser

### Depuis l'interface

1. Dépose un dossier ou un `.zip` (ou utilise les boutons).
2. Choisis le nom du projet : il apparaît dans le lien.
3. Clique sur « Mettre en ligne ». Le lien s'affiche, prêt à copier.

Pour publier une nouvelle version, clique sur « Nouvelle version » sur la carte du projet, ou
redépose le projet avec le même nom. Sur téléphone, le choix d'un dossier n'est souvent pas
possible : envoie un `.zip`.

Sont ignorés à l'envoi : `.git`, `node_modules`, `__MACOSX`, `.DS_Store`, `Thumbs.db`. Si le zip
ou le dossier contient un unique dossier racine, il est retiré automatiquement.

### Depuis le terminal

```bash
node cli.js ./mon-dossier mon-projet
```

Le nom est optionnel (par défaut : le nom du dossier). Pour viser un serveur distant :

```bash
QUAI_URL=https://ton-adresse QUAI_TOKEN=ton-jeton node cli.js ./mon-dossier
```

### Depuis Git

Dans l'interface, ouvre « Importer depuis un dépôt Git » : URL `https://`, branche, et dossier à
publier si le site n'est pas à la racine. Par exemple, pour ce dépôt, chaque branche est un site :
URL du dépôt + branche `motion-lab`.

Chaque projet Git reçoit une **URL de webhook** secrète. Ajoute-la dans GitHub
(Settings → Webhooks → Add webhook, méthode POST) pour que chaque push redéploie le projet.

Pour un dépôt privé, l'URL doit contenir un jeton d'accès (`https://JETON@github.com/toi/depot`).
Ce jeton est alors stocké en clair dans `data/` : utilise un jeton en lecture seule.

## Les liens

| Situation | Forme du lien |
|---|---|
| En local (`localhost`) | `http://projet.localhost:8080/` |
| `BASE_DOMAIN` défini | `http://projet.<BASE_DOMAIN>/` |
| Sinon (IP, tunnel…) | `http://adresse/projet/` |

Les sous-domaines sont la forme la plus fiable : chaque site vit à sa propre racine, exactement
comme sur Netlify. En mode chemin (`/projet/`), un site qui utilise des chemins absolus
(`/style.css`) fonctionne quand même : Quai retrouve le bon projet grâce à l'en-tête `Referer`.
Ça couvre les cas courants, mais un site qui désactive le `Referer` devra passer en chemins relatifs.

Comme Netlify : `index.html` par dossier, `/contact` sert `contact.html`, `404.html` personnalisé,
et un fichier `_redirects` contenant `/*  /index.html  200` active le mode application monopage.

## Le rendre accessible depuis Internet, gratuitement

Quai est un programme : il lui faut une machine allumée. Deux façons de faire sans payer.
Je n'ai pas pu les tester depuis l'environnement où Quai a été écrit ; les commandes sont celles
des outils concernés.

**1. Ton ordinateur + un tunnel.** Lance Quai, puis dans un second terminal :

```bash
cloudflared tunnel --url http://localhost:8080
```

`cloudflared` (gratuit, sans compte pour ce mode) affiche une adresse `https://….trycloudflare.com`.
Tes projets sont à `https://….trycloudflare.com/projet/`. Limites : l'adresse change à chaque
relance du tunnel, et les sites ne répondent que tant que ton ordinateur est allumé.

**2. Une machine toujours allumée** (petit serveur, Raspberry Pi, VPS gratuit) avec Docker :

```bash
docker compose up -d
```

```bash
docker compose exec quai cat /data/token
```

Sans nom de domaine, tu peux quand même avoir un sous-domaine par projet grâce au service DNS
gratuit sslip.io : si l'IP publique du serveur est `203.0.113.10`, définis
`BASE_DOMAIN=203.0.113.10.sslip.io` (et expose le port 80). Les projets répondent alors sur
`http://projet.203.0.113.10.sslip.io/`. Quai ne gère pas le HTTPS lui-même : pour du `https://`,
place-le derrière un tunnel ou un proxy (Caddy, par exemple).

## Configuration

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `8080` | Port d'écoute |
| `HOST` | `0.0.0.0` | Interface d'écoute (`127.0.0.1` pour rester local) |
| `DATA_DIR` | `./data` | Dossier où sont rangés les projets et le jeton |
| `QUAI_TOKEN` | généré | Jeton d'accès à l'interface et à l'API |
| `BASE_DOMAIN` | — | Domaine de base pour donner un sous-domaine à chaque projet |
| `MAX_UPLOAD_MB` | `200` | Taille maximale d'un projet |
| `KEEP_DEPLOYS` | `5` | Nombre de versions conservées par projet |

## Sécurité

- Les sites publiés sont publics : toute personne qui a le lien peut les voir.
- L'interface et l'API exigent le jeton. Garde-le secret, et choisis-le long si tu le définis toi-même.
- En mode chemin, tous les sites partagent la même adresse que l'interface : un script présent dans
  un site publié pourrait agir sur l'interface pendant que tu y es connecté. Ne publie que du code
  auquel tu fais confiance, ou utilise le mode sous-domaine, qui isole chaque site.
- Les chemins envoyés sont vérifiés (pas de sortie du dossier du projet), les liens symboliques sont
  ignorés, et la taille décompressée des zips est plafonnée.

## Tests

```bash
npm test
```

## Organisation du code

| Fichier | Rôle |
|---|---|
| `server.js` | Routage, API, authentification |
| `lib/store.js` | Projets, versions, écriture sur disque |
| `lib/static.js` | Service des fichiers d'un site |
| `lib/zip.js` | Lecture des archives zip |
| `lib/git.js` | Import depuis Git |
| `public/index.html` | Interface |
| `cli.js` | Déploiement depuis le terminal |
| `pages/build.js` | Assemblage du site pour GitHub Pages |
| `pages/template.js` | Page d'accueil et page 404 générées |
