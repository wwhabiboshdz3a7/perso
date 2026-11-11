# Nour — assistant personnel

**Nour** (« lumière ») est l'assistant personnel d'Ibrahim, fondateur de l'agence NEXORA : une interface de conversation soignée, en français, qui se branche sur **l'IA open source de votre choix** via une clé API (Groq, OpenRouter, Mistral, Hugging Face, Ollama…).

Application web progressive (PWA) installable, 100 % statique, publiable telle quelle sur Netlify — avec une **fonction serveur facultative** pour garder la clé API hors du navigateur.

**Rien ne tourne sur votre ordinateur** : au premier lancement, l'assistant **« Choisir le cerveau de Nour »** branche Nour sur un modèle open source hébergé dans le cloud (Groq, OpenRouter, Hugging Face…), en quelques minutes. Faire tourner le modèle sur le PC (Ollama, LM Studio) reste possible, rangé dans « Avancé ».

---

## Utiliser un modèle open source dans le cloud

Les modèles **ouverts** (gpt-oss, Llama, Qwen, Kimi, Mistral, DeepSeek, Gemma…) sont hébergés par des fournisseurs cloud qui exposent une API compatible OpenAI. Nour leur envoie le texte de la conversation et affiche la réponse : votre ordinateur ou votre téléphone ne font aucun calcul, et vous n'installez rien.

Au premier lancement (ou à tout moment : **Réglages → Connexion → Ouvrir l'assistant**, ou la pastille « Non connecté » en bas de la barre latérale), l'assistant propose trois chemins. En tête, une carte animée montre où réfléchit le cerveau (vous → Nour → cloud, serveur Netlify ou cet ordinateur) : le chemin conseillé s'allume, et celui que vous survolez ou atteignez au clavier prend le relais.

| | Cloud open source (recommandé) | Mon serveur Netlify | Local (avancé) |
|---|---|---|---|
| Mise en route | 3 minutes : une clé | 10 minutes : variables Netlify | installer, télécharger un modèle |
| Où est la clé | dans ce navigateur (chiffrable) | sur Netlify, jamais dans le navigateur | aucune |
| Votre ordinateur | ne calcule rien | ne calcule rien | fait tout le calcul |
| Sur le téléphone | oui (clé à saisir) | oui, avec un mot de passe | non |

### En 3 minutes avec Groq (ou OpenRouter)

1. Ouvrez Nour → **Cloud open source**. Groq est présélectionné.
2. **Ouvrir la page des clés** (console.groq.com/keys) → *Create API Key* → copiez la clé (elle ne s'affiche qu'une fois).
3. Collez-la dans Nour → **Tester la connexion**.
4. Nour mesure le temps de réponse, charge la liste **en direct** des modèles, ne garde que les modèles à poids ouverts (les versions propriétaires vendues sous un nom de famille ouverte, comme Qwen Max ou Mistral Medium, sont écartées) et présélectionne un modèle conseillé (gpt-oss 120B, Llama 3.3 70B, Kimi K2, Qwen3…).
5. Facultatif : **Essai en direct → Faire parler Nour**. Le modèle choisi se présente en une phrase, avec le délai avant le premier mot et sa vitesse (jetons par seconde). Rien n'est enregistré.
6. **Utiliser Groq · …**. C'est prêt.

Avec **OpenRouter** : même chemin ; la case « Modèles gratuits uniquement » (cochée d'office) ne montre que les modèles `:free`.

| Fournisseur | Ce que c'est | Coût* | Clé |
|---|---|---|---|
| Groq | puces dédiées à l'inférence, réponses quasi instantanées | offre gratuite avec limites par minute et par jour | console.groq.com/keys |
| OpenRouter | une clé pour des centaines de modèles | modèles `:free` gratuits avec quota quotidien | openrouter.ai/settings/keys |
| Hugging Face | le hub des modèles ouverts (Inference Providers) | petit crédit mensuel offert, puis à l'usage | jeton *fine-grained* « Make calls to Inference Providers » |
| Cerebras | parmi les inférences les plus rapides | offre gratuite avec quotas journaliers | cloud.cerebras.ai → API Keys |
| Together AI | grand catalogue, versions « Turbo » | payant à l'usage (bas coût) | api.together.ai/settings/api-keys |
| Mistral | modèles français à poids ouverts | offre d'essai, puis à l'usage | console.mistral.ai/api-keys |
| DeepInfra | modèles ouverts à petit prix | payant à l'usage | deepinfra.com/dash/api_keys |

\* Au moment de l'écriture : les offres gratuites changent souvent, vérifiez-les sur le site du fournisseur.

**Ce que dit le test de connexion** (rien n'est enregistré avant « Utiliser… ») :

| Message | Cause | Que faire |
|---|---|---|
| Clé refusée (401/403) | clé incomplète, révoquée ou d'un autre fournisseur | en recréer une ; Nour signale aussi une clé collée chez le mauvais fournisseur (`gsk_`, `sk-or-`, `hf_`, `csk-`) et propose de basculer |
| Quota atteint (429) | la clé fonctionne, la limite gratuite est atteinte | patienter (délai indiqué) ou changer de fournisseur |
| Crédit insuffisant (402) | modèle payant sans crédit | choisir un modèle gratuit ou ajouter du crédit |
| Appels directs refusés (CORS) | le fournisseur répond mais refuse les appels depuis un navigateur | passer par le serveur Netlify (bouton proposé) |
| Fournisseur injoignable | réseau, bloqueur de publicités, VPN, pare-feu | vérifier la connexion |

Pour distinguer CORS et réseau, Nour refait une requête « opaque » (`mode: 'no-cors'`) : si le serveur répond à celle-ci mais pas à la vraie, c'est un blocage CORS.

### Ensuite : le mode serveur Netlify (clé cachée, idéal sur téléphone)

La clé reste dans les variables d'environnement Netlify ; vous vous connectez depuis n'importe quel appareil avec un mot de passe. Tout se prépare **dans l'application**, sans ligne de commande :

1. Publiez le site sur Netlify (voir [Déploiement](#déploiement-sur-netlify)).
2. Dans Nour → **Mon serveur Netlify** : choisissez le fournisseur du serveur (et éventuellement son modèle par défaut), tapez un mot de passe d'accès ou cliquez **Proposer** (cinq mots tirés au hasard et un nombre, environ 50 bits d'entropie), puis **Générer les variables**. L'empreinte PBKDF2 (`ACCESS_PASSWORD_HASH`) et le secret de signature (`TOKEN_SECRET`) sont calculés dans le navigateur (Web Crypto) : rien n'est envoyé, le mot de passe n'est stocké nulle part. Si vous changez de mot de passe après la génération, Nour retire l'ancienne empreinte, bloque la copie et demande **Recalculer l'empreinte** : impossible de copier une empreinte qui ne correspond plus au mot de passe noté.
3. Copiez chaque variable (boutons *Nom* / *Valeur*) dans *Project configuration → Environment variables* — ou **Copier le bloc .env** pour *Import from a .env file* si l'option est proposée (les valeurs sont entre apostrophes ; la fonction les accepte avec ou sans). Remplacez ensuite `collez-votre-cle-ici` par votre vraie clé dans `PROVIDER_API_KEY`, directement sur Netlify.
4. Redéployez (*Deploys → Trigger deploy*). Nour interroge `/api/status` : dès que la fonction est complète, l'accueil affiche **« Votre serveur Nour est prêt sur ce site — Se connecter »** et met la carte du serveur en avant. S'il manque une variable, l'assistant la nomme ; une clé absente ou laissée sur le texte d'exemple compte comme manquante. Après connexion, si le fournisseur refuse la clé, l'état du serveur passe à « clé refusée » et « Utiliser mon serveur » reste bloqué avec la marche à suivre.

Sur le téléphone : ouvrez le site, **Se connecter avec le mot de passe**, puis « Ajouter à l'écran d'accueil ».

### Prérégler le fournisseur et le modèle (`config.js`)

`config.js` (public, sans aucun secret) est lu avant l'application :

```js
window.NOUR_CONFIG = {
  provider: 'groq',               // fournisseur cloud présélectionné
  model: 'openai/gpt-oss-120b',   // choisi après le test s'il existe chez ce fournisseur
  serverModel: '',                // modèle demandé au serveur Netlify (vide = PROVIDER_DEFAULT_MODEL)
  path: 'cloud',                  // chemin mis en avant à l'accueil : 'cloud' ou 'server'
  freeOnly: true,                 // OpenRouter : modèles gratuits d'abord
};
```

Avec `path: 'server'`, la carte « Mon serveur Netlify » passe en premier avec le badge « Recommandé ». Un serveur détecté et prêt sur le site prend de toute façon la vedette, quel que soit ce réglage.

### Avancé : héberger votre propre modèle ouvert sur un GPU cloud

Pour un modèle précis (fine-tuné, non proposé par les API mutualisées) ou des données qui ne doivent passer que par votre infrastructure, louez un GPU et servez le modèle avec un serveur compatible OpenAI, typiquement **vLLM** :

```bash
vllm serve Qwen/Qwen3-8B --api-key "une-cle-longue-et-aleatoire"
# → https://…/v1/chat/completions et /v1/models
```

- **Hugging Face Inference Endpoints** : déployez un modèle du Hub sur un GPU (moteurs vLLM ou TGI) ; l’adresse ressemble à `https://<nom>.<région>….endpoints.huggingface.cloud/v1`, la clé est votre jeton Hugging Face. Facturation à l'heure de GPU allumé, avec mise en veille automatique possible.
- **RunPod** : modèle *Serverless vLLM* (point d'accès compatible OpenAI du type `https://api.runpod.ai/v2/<id>/openai/v1`, clé API RunPod), facturé à la seconde de calcul ; ou un *Pod* GPU facturé à l'heure.
- **Modal** : une fonction Python qui lance `vllm serve` derrière `@modal.web_server` (adresse du type `https://<espace>--<app>….modal.run/v1`), facturée à la seconde, avec un crédit gratuit mensuel au moment de l'écriture.

Branchez ensuite l'adresse dans **Avancé → URL personnalisée**, ou mieux, comme `PROVIDER_BASE_URL` du mode serveur (la clé reste cachée et le CORS n'est plus un sujet).

**Coûts, prudemment** : un GPU de 24 à 48 Go (assez pour un modèle de 8 à 32 milliards de paramètres, quantifié) se loue de l'ordre de quelques dizaines de centimes à quelques euros de l'heure selon l'hébergeur et le moment ; un GPU oublié allumé coûte vite plus cher qu'une API mutualisée. Activez l'arrêt automatique, et pour un usage personnel, préférez Groq, OpenRouter ou Hugging Face, bien moins chers à l'usage.

---

## Fonctionnalités

**Conversation**
- Réponses en streaming (SSE) avec bouton **Arrêter** (ou Échap ; un double-clic sur Envoyer n'arrête pas la réponse), **Régénérer** (les versions précédentes restent consultables : ‹ 1/2 ›), **Modifier** un message et repartir de là, **Copier**, **Lire à voix haute**.
- Rendu incrémental pendant le streaming : seuls les blocs encore ouverts sont recalculés, le code n'est coloré qu'une fois son bloc fermé ; les longues conversations n'affichent que les 40 derniers messages (« Afficher les messages précédents »).
- Une réponse coupée (flux fermé sans `[DONE]` ni `finish_reason`, longueur maximale atteinte) est signalée « réponse incomplète », avec **Continuer** et **Réessayer**. Un fournisseur muet déclenche une erreur claire après un délai d'inactivité réglable (60 s par défaut, 3 min pour le premier mot d'un modèle local).
- Rendu Markdown sûr : titres, listes, tableaux (alignement des colonnes respecté), citations, blocs de code colorés avec bouton « Copier », formules mathématiques (KaTeX, `$…$`, `$$…$$`, `\(…\)`, `\[…\]`).
- Modèles « qui réfléchissent » (DeepSeek R1, Qwen 3, gpt-oss…) : le raisonnement (`reasoning_content` ou balises `<think>`) est rangé dans un bloc « Réflexion » repliable.
- Pièces jointes : fichiers texte et code (contenu injecté dans le message), images (envoyées en data URL aux modèles « vision », redimensionnées à 1 600 px). Glisser-déposer et collage acceptés.
- Dictée vocale (Web Speech API, fr-FR) et lecture (speechSynthesis, voix et vitesse réglables).

**Organisation**
- Conversations enregistrées localement (IndexedDB) : barre latérale groupée par date, recherche plein texte, renommage, épingles, suppression.
- Export / import : JSON complet (conversations, mémoire, bibliothèque, réglages — **jamais les clés**, et les messages d'erreur repassent au masquage) et Markdown lisible. Les deux formats se réimportent : un fichier `.md` exporté recrée ses conversations (rôles, titres, modes) ; à l'import d'un JSON, la restauration des réglages (profil, assistant, préférences) est proposée, la connexion n'étant jamais modifiée. Les données importées sont validées (textes, images en base64 vérifiées en entier).
- Plusieurs onglets ouverts : chaque écriture est signalée aux autres onglets (BroadcastChannel) et porte un numéro de révision ; deux onglets qui écrivent la même conversation voient leurs messages fusionnés, et une conversation supprimée ailleurs n'est jamais recréée.
- Bibliothèque de **requêtes enregistrées** appelées avec `/` (`/resumer`, `/email`, `/plan`, `/script`, `/seo`…), modifiables, avec champs `{{à compléter}}` ; un brouillon déjà saisi est placé dans le premier champ au lieu d'être écrasé.

**Personnalité et mémoire**
- Nom, avatar (5 glyphes lumineux, initiale ou image), ton (chaleureux, professionnel, direct, pédagogue, enjoué, concis).
- Six modes prêts à l'emploi, chacun avec son invite système modifiable : assistant perso, coach business, développeur, rédacteur web & SEO, scripts vidéo, professeur de langues.
- **Mémoire** : faits sur l'utilisateur, visibles, modifiables, activables un par un, injectés dans l'invite système. Le bouton **« Proposer des souvenirs »** demande au modèle d'extraire des faits de la conversation ; chacun est validé (ou reformulé) individuellement.

**Confort**
- Température, longueur maximale, limite de contexte (les plus anciens échanges sont retirés au-delà), estimation des jetons en direct.
- Thème clair / sombre / système, police de lecture sans ou serif, trois tailles de texte.
- Raccourcis clavier (`Ctrl/⌘ + /` pour la liste), responsive jusqu'à 390 px, accessibilité AA, `prefers-reduced-motion` respecté, textes arabes ou hébreux affichés de droite à gauche (`dir="auto"` sur la saisie, les bulles et chaque bloc de réponse).
- PWA installable ; le service worker met l'interface en cache : **les conversations restent consultables hors ligne**.

---

## Fournisseurs

Tout serveur compatible OpenAI (`/v1/chat/completions` en streaming, `/v1/models`) fonctionne. Préréglages inclus :

| Fournisseur | URL de base | Clé |
|---|---|---|
| Groq | `https://api.groq.com/openai/v1` | console.groq.com/keys |
| OpenRouter | `https://openrouter.ai/api/v1` | openrouter.ai/settings/keys — filtre « modèles gratuits » |
| Together AI | `https://api.together.xyz/v1` | api.together.ai/settings/api-keys |
| Mistral (La Plateforme) | `https://api.mistral.ai/v1` | console.mistral.ai/api-keys |
| Hugging Face (Inference Providers) | `https://router.huggingface.co/v1` | huggingface.co/settings/tokens (jeton *fine-grained*) |
| DeepInfra | `https://api.deepinfra.com/v1/openai` | deepinfra.com/dash/api_keys |
| Cerebras | `https://api.cerebras.ai/v1` | cloud.cerebras.ai |
| Ollama (local) | `http://localhost:11434/v1` | aucune |
| LM Studio (local) | `http://localhost:1234/v1` | aucune |
| URL personnalisée | la vôtre (vLLM, llama.cpp…) | selon le serveur |

La liste des modèles est **récupérée en direct** chez le fournisseur (« Tester et charger les modèles »). Les familles ouvertes (gpt-oss, Llama, Qwen, Mistral, DeepSeek, Gemma, Kimi, GLM, Phi) servent de filtres et de suggestion automatique, sans figer d'identifiants qui changent souvent. Un identifiant peut aussi être saisi à la main.

### Ollama et LM Studio (modèles sur votre ordinateur — avancé)

Le modèle tourne alors sur le PC : machine puissante, plusieurs Go à télécharger, et Nour ne répond que sur cet appareil. Le navigateur doit être autorisé à appeler le serveur local (CORS) :

- **Ollama** : lancez `OLLAMA_ORIGINS="https://votre-site.netlify.app" ollama serve`.
  macOS (application) : `launchctl setenv OLLAMA_ORIGINS "https://votre-site.netlify.app"` puis relancez Ollama. Windows : variable d'environnement système `OLLAMA_ORIGINS`, puis relancez Ollama.
- **LM Studio** : onglet *Developer* → démarrer le serveur → activer **Enable CORS**.

Chrome peut aussi demander l'autorisation d'accéder au **réseau local** : acceptez-la.

---

## Deux modes de connexion

### 1. Clé locale (par défaut)

La clé est stockée dans le navigateur (localStorage de ce site) et envoyée **uniquement** au fournisseur choisi.

- Option : **chiffrer les clés avec une phrase secrète** (AES-GCM 256 bits, clé dérivée par PBKDF2-SHA-256, 310 000 itérations). La phrase est demandée à chaque ouverture ; elle n'est jamais stockée.
- Limite : une extension malveillante ou une faille sur le domaine pourrait lire la clé. À éviter sur un ordinateur partagé.
- Certains fournisseurs refusent les appels directs depuis un navigateur (CORS) : utilisez alors le mode serveur.

### 2. Serveur sécurisé (fonction Netlify)

La clé reste dans les variables d'environnement Netlify. Le navigateur appelle `/api/chat`, protégé par mot de passe : la fonction délivre un **jeton signé HMAC** (12 h par défaut), vérifie chaque requête, filtre les paramètres, applique une **limitation de débit** par adresse IP et relaie le streaming SSE tel quel.

| Variable | Rôle |
|---|---|
| `PROVIDER_BASE_URL` | URL compatible OpenAI, ex. `https://api.groq.com/openai/v1` |
| `PROVIDER_API_KEY` | clé du fournisseur. Obligatoire vers une adresse publique (absente ou laissée sur `collez-votre-cle-ici`, le serveur n'est pas annoncé prêt) ; facultative vers une adresse locale ou privée ; `aucune` pour un serveur compatible OpenAI sans authentification |
| `ACCESS_PASSWORD_HASH` | empreinte du mot de passe d'accès (voir ci-dessous) |
| `TOKEN_SECRET` | secret aléatoire de 32 caractères minimum (signature des jetons) |
| `PROVIDER_DEFAULT_MODEL` | *facultatif* — modèle utilisé si l'interface n'en choisit pas |
| `ALLOWED_MODELS` | *facultatif* — liste blanche, séparée par des virgules |
| `RATE_LIMIT_PER_MINUTE` | *facultatif* — requêtes par minute et par IP (défaut 30) |
| `TOKEN_TTL_HOURS` | *facultatif* — durée d'une session (défaut 12) |

Générer l'empreinte et le secret : directement dans Nour (**Mon serveur Netlify → Générer les variables**, voir plus haut), ou en ligne de commande :

```bash
node scripts/hash-password.mjs "votre mot de passe d'accès"
# → ACCESS_PASSWORD_HASH=pbkdf2-sha256$210000$…   TOKEN_SECRET=…
```

Puis dans Nour : l'accueil détecte le serveur et propose **Se connecter avec le mot de passe** (ou **Réglages → Connexion → Serveur sécurisé**). Choisissez un modèle, ou laissez vide pour `PROVIDER_DEFAULT_MODEL`.

`/api/status` est public et ne renvoie que des booléens et des noms de variables (`configured`, `missing`, `hasDefaultModel`), jamais de valeur. Sur un hébergement sans fonction, le fichier statique `api/status` répond `{"function": false}` (la fonction Netlify, prioritaire sur les fichiers statiques, le remplace une fois déployée).

**Révocation des sessions.** La clé de signature des jetons est dérivée de `TOKEN_SECRET` *et* de `ACCESS_PASSWORD_HASH` : changer le mot de passe d'accès (nouvelle empreinte) ou `TOKEN_SECRET`, puis redéployer, **déconnecte immédiatement tous les appareils**. « Se déconnecter » dans Nour n'efface que le jeton de l'appareil en cours. Un jeton refusé par le serveur est oublié et le formulaire de connexion réapparaît.

**Durée des réponses.** Une fonction Netlify a une durée d'exécution limitée (de l'ordre de quelques dizaines de secondes selon l'offre, davantage pour le streaming mais pas illimitée). Une très longue génération (modèle de raisonnement, réponse de plusieurs milliers de mots) peut donc être coupée : Nour l'indique (« réponse incomplète ») et propose **Continuer**. Pour ces usages, préférez le mode « Clé locale », qui appelle le fournisseur directement depuis le navigateur.

> La limitation de débit intégrée est conservée en mémoire par instance de fonction : simple et efficace contre les abus courants. Pour une limite stricte et globale, ajoutez une règle de *rate limiting* Netlify (configuration `rateLimit` de la fonction ou règle de trafic du site).

---

## Déploiement sur Netlify

1. Dans Netlify, ajoutez un nouveau projet importé depuis Git (*Add new project → Import an existing project*) → ce dépôt, branche `assistant`.
2. Build command : *(vide)* · Publish directory : `.` · Functions directory : `netlify/functions` (déjà définis dans `netlify.toml`).
3. *(Mode serveur uniquement)* Dans les **variables d'environnement du projet** (*Project configuration → Environment variables*) : ajoutez les variables ci-dessus (générées par l'assistant), puis redéployez.
4. Ouvrez le site : l'assistant « Choisir le cerveau de Nour » vous guide (clé cloud ou connexion au serveur). C'est prêt. Sur mobile, « Ajouter à l'écran d'accueil » installe l'application.

`netlify.toml` fixe aussi les en-têtes de sécurité (CSP stricte avec `connect-src 'self' https: http://localhost:* http://127.0.0.1:*` pour joindre les fournisseurs et les serveurs locaux, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: no-referrer`) et masque `tests/`, `scripts/` et `netlify/`.

Mises à jour : le service worker sert la page, les scripts et les styles depuis son cache (démarrage instantané, hors ligne), puis les revalide en arrière-plan à chaque visite (*stale-while-revalidate*). Un déploiement n'exige donc aucune étape manuelle : HTML et JS d'une même visite viennent toujours du même instantané, et dès qu'un fichier a changé, les visiteurs voient « Une nouvelle version de Nour est disponible — Recharger ». `VERSION` dans `sw.js` ne sert qu'à renouveler entièrement le cache (par exemple si la liste des fichiers pré-cachés change). Seule une réponse HTML 200 de la page d'accueil remplace la copie hors ligne d'`index.html`.

---

## Sécurité

- Le Markdown est converti par **marked** puis systématiquement nettoyé par **DOMPurify** ; le HTML brut écrit par le modèle est affiché comme du texte (seules quelques balises de mise en forme sans attribut sont conservées).
- Liens : uniquement `http(s)`, `mailto`, `tel` et ancres, ouverts avec `rel="noopener noreferrer nofollow"`.
- **Les images distantes ne sont jamais chargées automatiquement** (elles apparaissent comme des liens) : pas de pixel espion ni d'exfiltration par URL d'image.
- CSP sans script en ligne ni `eval` ; toutes les bibliothèques sont servies depuis le site (`vendor/`).
- La clé n'apparaît jamais dans la console, les messages d'erreur, les exports ni les journaux de la fonction : les valeurs exactes des clés enregistrées (quel que soit leur format) et les formats usuels (`sk-…`, `gsk_…`, `hf_…`, `Bearer …`) sont masqués, y compris quand le fournisseur recopie la clé dans sa réponse d'erreur.

---

## Structure

```
.
├── index.html                  interface (sprite d'icônes, structure, CSP de secours)
├── config.js                   préréglages facultatifs (fournisseur, modèle), sans secret
├── api/status                  réponse statique « pas de fonction » (remplacée par la fonction sur Netlify)
├── manifest.webmanifest        PWA
├── sw.js                       service worker (interface en cache, API jamais en cache)
├── 404.html
├── netlify.toml                publication, fonction, en-têtes de sécurité
├── assets/
│   ├── css/app.css             identité visuelle (jetons clair/sombre), mise en page, composants
│   ├── fonts/                  Instrument Sans & Serif, JetBrains Mono, Source Serif 4 (SIL OFL)
│   └── icons/                  favicon SVG, icônes PWA, icône masquable
├── js/
│   ├── boot.js                 thème appliqué avant le premier rendu
│   ├── app.js                  orchestration : envoi, streaming, versions, édition, raccourcis…
│   ├── client.js               appels compatibles OpenAI (navigateur ou proxy), erreurs typées
│   ├── sse.js                  analyseur Server-Sent Events
│   ├── markdown.js             marked + highlight.js + KaTeX + DOMPurify
│   ├── providers.js            fournisseurs (cloud, local), offres, modèles conseillés, familles, normalisation
│   ├── server-setup.js         générateur du mode serveur (empreinte PBKDF2, TOKEN_SECRET) en Web Crypto
│   ├── personas.js             modes, tons, construction de l'invite système
│   ├── memory.js               mémoire et extraction de souvenirs
│   ├── templates.js            bibliothèque « / »
│   ├── attachments.js          fichiers texte/code et images
│   ├── voice.js                dictée et lecture
│   ├── exporter.js             export/import JSON & Markdown, estimation des jetons
│   ├── keystore.js, crypto.js  coffre des clés (clair ou AES-GCM/PBKDF2)
│   ├── db.js, settings.js      IndexedDB (écritures atomiques avec révision), réglages
│   ├── bus.js, sync.js         synchronisation entre onglets (BroadcastChannel, fusion)
│   └── ui/                     assistant de connexion (connect-wizard.js), dialogues, réglages, panneaux, fil, sélecteur de modèle, erreurs
├── vendor/                     marked 18.1.2, DOMPurify 3.4.17, highlight.js 11.12.0, KaTeX 0.19.1 (+ licences)
├── netlify/functions/chat.mjs  proxy sécurisé (Functions v2, streaming)
├── scripts/hash-password.mjs   empreinte du mot de passe + TOKEN_SECRET
└── tests/
    ├── mock-openai.mjs         faux serveur compatible OpenAI (streaming, erreurs 401/429/500)
    ├── serveur-local.mjs       site + fonction sur /api/* avec les en-têtes de production
    ├── chat-function.test.mjs  tests unitaires de la fonction (amont simulé)
    ├── sse.test.mjs            tests de l'analyseur SSE
    ├── sync.test.mjs           tests de la fusion entre onglets
    ├── markdown-import.test.mjs tests de l'import Markdown
    ├── connexion-cloud.test.mjs générateur face à la fonction, /api/status, catalogue cloud, modèles conseillés
    └── e2e.cjs                 tests de bout en bout Playwright (desktop 1440 px + mobile 390 px)
```

---

## Développer et tester en local

Aucune dépendance pour le site ni pour la fonction (Node 20+ pour les outils ; Playwright uniquement pour les tests de bout en bout).

```bash
# Site seul (mode « clé locale »)
python3 -m http.server 8000            # → http://localhost:8000

# Faux fournisseur, sans clé ni réseau : URL personnalisée http://127.0.0.1:9302/v1, clé « cle-valide »
node tests/mock-openai.mjs 9302
#   messages spéciaux : « markdown », « xss », « lent », « raisonne », « think », « erreur-flux »
#   clés spéciales : « cle-quota » (429), « cle-panne » (500), toute autre clé → 401

# Site + fonction serveur, comme sur Netlify
PROVIDER_BASE_URL=http://127.0.0.1:9302/v1 PROVIDER_API_KEY=cle-valide \
ACCESS_PASSWORD_HASH='…' TOKEN_SECRET='…' node tests/serveur-local.mjs 9303

# Tests unitaires (fonction Netlify, assistant de connexion, analyseur SSE, fusion entre onglets, import Markdown)
node --test tests/*.test.mjs
```

### Tests de bout en bout (Playwright)

Les API d'IA ne sont jamais appelées : le script démarre lui-même le site, le faux fournisseur et la fonction serveur, puis pilote Chromium.

```bash
npm install --no-save playwright && npx playwright install chromium
node tests/e2e.cjs              # 39 scénarios, captures d'écran dans un dossier temporaire
node tests/e2e.cjs cerveau      # seulement l'assistant « Choisir le cerveau de Nour »
node tests/e2e.cjs mémoire      # filtre sur le nom du scénario
E2E_PORT=9400 E2E_SHOTS=./captures node tests/e2e.cjs   # autres ports / dossier de captures
```

Scénarios couverts : assistant « Choisir le cerveau » (Groq simulé par interception réseau : clé d'un autre fournisseur, 401, 429, CORS réel, réseau coupé, modèle conseillé, essai en direct, discussion ; générateur du mode serveur dont l'empreinte est vérifiée par la vraie fonction puis utilisée par un serveur lancé avec ces valeurs, empreinte périmée après un changement de mot de passe ; clé du serveur laissée sur le texte d'exemple puis refusée par le fournisseur ; serveur mis en avant ; `config.js` (`provider`, `model`, `path`) ; mobile 390 px, liste complète des modèles comprise), configuration du fournisseur, envoi et rendu progressif, arrêt, régénération et versions, modification d'un message, persistance après rechargement, recherche, épingles / renommage / suppression, Markdown + code + KaTeX, charge XSS neutralisée, raisonnement, mémoire et souvenirs proposés, pièces jointes (texte et image), export / import, messages d'erreur (clé refusée, quota, panne, modèle inconnu, flux coupé), coffre chiffré, voix (API simulées), modèles « / », réglages, hors ligne via le service worker (et copie hors ligne qui reste la page de l'application), KaTeX rechargé après un échec, mode serveur (mot de passe faux puis juste, flux relayé, session refusée, fonction non configurée), longue réponse (rendu incrémental, fil réactif), flux coupé sans fin, délai d'attente, clé sans préfixe masquée, plusieurs onglets, ancre malformée, double-clic, collage texte + image, notifications au-dessus des fenêtres et de la zone de saisie, mobile 390 px sans défilement horizontal, thème clair. Le script échoue aussi à la moindre erreur dans la console.

---

## Raccourcis clavier

| Action | Raccourci |
|---|---|
| Envoyer / nouvelle ligne | Entrée / Maj + Entrée (réglable) |
| Nouvelle conversation | Ctrl/⌘ + Maj + O |
| Rechercher | Ctrl/⌘ + K |
| Barre latérale | Ctrl/⌘ + B |
| Réglages / Mémoire | Ctrl/⌘ + , / Ctrl/⌘ + Maj + M |
| Copier la dernière réponse | Ctrl/⌘ + Maj + Y |
| Exporter la conversation | Ctrl/⌘ + Maj + E |
| Arrêter la génération | Échap |
| Modifier le dernier message | ↑ (zone de saisie vide) |
| Requêtes enregistrées | `/` en début de message |
| Aide | Ctrl/⌘ + / |

---

## Licences des composants

- [marked](https://github.com/markedjs/marked) — MIT · [DOMPurify](https://github.com/cure53/DOMPurify) — Apache 2.0 / MPL 2.0 · [highlight.js](https://highlightjs.org/) — BSD-3 · [KaTeX](https://katex.org/) — MIT (licences dans `vendor/`).
- Polices Instrument Sans, Instrument Serif, JetBrains Mono, Source Serif 4 — SIL Open Font License (licences dans `assets/fonts/`).
