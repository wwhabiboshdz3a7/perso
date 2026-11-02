# Nour — assistant personnel

**Nour** (« lumière ») est l'assistant personnel d'Ibrahim, fondateur de l'agence NEXORA : une interface de conversation soignée, en français, qui se branche sur **l'IA open source de votre choix** via une clé API (Groq, OpenRouter, Mistral, Hugging Face, Ollama…).

Application web progressive (PWA) installable, 100 % statique, publiable telle quelle sur Netlify — avec une **fonction serveur facultative** pour garder la clé API hors du navigateur.

---

## Fonctionnalités

**Conversation**
- Réponses en streaming (SSE) avec bouton **Arrêter** (ou Échap), **Régénérer** (les versions précédentes restent consultables : ‹ 1/2 ›), **Modifier** un message et repartir de là, **Copier**, **Lire à voix haute**.
- Rendu Markdown sûr : titres, listes, tableaux, citations, blocs de code colorés avec bouton « Copier », formules mathématiques (KaTeX, `$…$`, `$$…$$`, `\(…\)`, `\[…\]`).
- Modèles « qui réfléchissent » (DeepSeek R1, Qwen 3, gpt-oss…) : le raisonnement (`reasoning_content` ou balises `<think>`) est rangé dans un bloc « Réflexion » repliable.
- Pièces jointes : fichiers texte et code (contenu injecté dans le message), images (envoyées en data URL aux modèles « vision », redimensionnées à 1 600 px). Glisser-déposer et collage acceptés.
- Dictée vocale (Web Speech API, fr-FR) et lecture (speechSynthesis, voix et vitesse réglables).

**Organisation**
- Conversations enregistrées localement (IndexedDB) : barre latérale groupée par date, recherche plein texte, renommage, épingles, suppression.
- Export / import : JSON complet (conversations, mémoire, bibliothèque, réglages — **jamais les clés**) et Markdown lisible.
- Bibliothèque de **modèles de requêtes** appelés avec `/` (`/resumer`, `/email`, `/plan`, `/script`, `/seo`…), modifiables, avec champs `{{à compléter}}`.

**Personnalité et mémoire**
- Nom, avatar (5 glyphes lumineux, initiale ou image), ton (chaleureux, professionnel, direct, pédagogue, enjoué, concis).
- Six modes prêts à l'emploi, chacun avec son invite système modifiable : assistant perso, coach business, développeur, rédacteur web & SEO, scripts vidéo, professeur de langues.
- **Mémoire** : faits sur l'utilisateur, visibles, modifiables, activables un par un, injectés dans l'invite système. Le bouton **« Proposer des souvenirs »** demande au modèle d'extraire des faits de la conversation ; chacun est validé (ou reformulé) individuellement.

**Confort**
- Température, longueur maximale, limite de contexte (les plus anciens échanges sont retirés au-delà), estimation des jetons en direct.
- Thème clair / sombre / système, police de lecture sans ou serif, trois tailles de texte.
- Raccourcis clavier (`Ctrl/⌘ + /` pour la liste), responsive jusqu'à 390 px, accessibilité AA, `prefers-reduced-motion` respecté.
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

### Ollama et LM Studio (modèles sur votre ordinateur)

Le navigateur doit être autorisé à appeler le serveur local (CORS) :

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
| `PROVIDER_API_KEY` | clé du fournisseur (facultative pour un serveur sans clé) |
| `ACCESS_PASSWORD_HASH` | empreinte du mot de passe d'accès (voir ci-dessous) |
| `TOKEN_SECRET` | secret aléatoire de 32 caractères minimum (signature des jetons) |
| `PROVIDER_DEFAULT_MODEL` | *facultatif* — modèle utilisé si l'interface n'en choisit pas |
| `ALLOWED_MODELS` | *facultatif* — liste blanche, séparée par des virgules |
| `RATE_LIMIT_PER_MINUTE` | *facultatif* — requêtes par minute et par IP (défaut 30) |
| `TOKEN_TTL_HOURS` | *facultatif* — durée d'une session (défaut 12) |

Générer l'empreinte et le secret :

```bash
node scripts/hash-password.mjs "votre mot de passe d'accès"
# → ACCESS_PASSWORD_HASH=pbkdf2-sha256$210000$…   TOKEN_SECRET=…
```

Puis dans Nour : **Réglages → Connexion → Serveur sécurisé**, saisissez le mot de passe et choisissez un modèle (ou laissez vide pour `PROVIDER_DEFAULT_MODEL`).

> La limitation de débit intégrée est conservée en mémoire par instance de fonction : simple et efficace contre les abus courants. Pour une limite stricte et globale, ajoutez une règle de *rate limiting* Netlify (configuration `rateLimit` de la fonction ou règle de trafic du site).

---

## Déploiement sur Netlify

1. **Add new site → Import an existing project** → ce dépôt, branche `assistant`.
2. Build command : *(vide)* · Publish directory : `.` · Functions directory : `netlify/functions` (déjà définis dans `netlify.toml`).
3. *(Mode serveur uniquement)* Site configuration → **Environment variables** : ajoutez les variables ci-dessus, puis redéployez.
4. Ouvrez le site, choisissez un fournisseur, collez votre clé (ou connectez-vous au serveur), testez la connexion : c'est prêt. Sur mobile, « Ajouter à l'écran d'accueil » installe l'application.

`netlify.toml` fixe aussi les en-têtes de sécurité (CSP stricte avec `connect-src 'self' https: http://localhost:* http://127.0.0.1:*` pour joindre les fournisseurs et les serveurs locaux, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: no-referrer`) et masque `tests/`, `scripts/` et `netlify/`.

Après une mise à jour du code, augmentez `VERSION` dans `sw.js` : les visiteurs verront « Nouvelle version disponible — Mettre à jour ».

---

## Sécurité

- Le Markdown est converti par **marked** puis systématiquement nettoyé par **DOMPurify** ; le HTML brut écrit par le modèle est affiché comme du texte (seules quelques balises de mise en forme sans attribut sont conservées).
- Liens : uniquement `http(s)`, `mailto`, `tel` et ancres, ouverts avec `rel="noopener noreferrer nofollow"`.
- **Les images distantes ne sont jamais chargées automatiquement** (elles apparaissent comme des liens) : pas de pixel espion ni d'exfiltration par URL d'image.
- CSP sans script en ligne ni `eval` ; toutes les bibliothèques sont servies depuis le site (`vendor/`).
- La clé n'apparaît jamais dans la console, les messages d'erreur (masquage systématique), les exports ni les journaux de la fonction.

---

## Structure

```
.
├── index.html                  interface (sprite d'icônes, structure, CSP de secours)
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
│   ├── providers.js            préréglages fournisseurs, familles de modèles, normalisation
│   ├── personas.js             modes, tons, construction de l'invite système
│   ├── memory.js               mémoire et extraction de souvenirs
│   ├── templates.js            bibliothèque « / »
│   ├── attachments.js          fichiers texte/code et images
│   ├── voice.js                dictée et lecture
│   ├── exporter.js             export/import JSON & Markdown, estimation des jetons
│   ├── keystore.js, crypto.js  coffre des clés (clair ou AES-GCM/PBKDF2)
│   ├── db.js, settings.js      IndexedDB, réglages
│   └── ui/                     dialogues, réglages, panneaux, fil, sélecteur de modèle, erreurs
├── vendor/                     marked 18.1.2, DOMPurify 3.4.17, highlight.js 11.12.0, KaTeX 0.19.1 (+ licences)
├── netlify/functions/chat.mjs  proxy sécurisé (Functions v2, streaming)
├── scripts/hash-password.mjs   empreinte du mot de passe + TOKEN_SECRET
└── tests/
    ├── mock-openai.mjs         faux serveur compatible OpenAI (streaming, erreurs 401/429/500)
    ├── serveur-local.mjs       site + fonction sur /api/* avec les en-têtes de production
    ├── chat-function.test.mjs  tests unitaires de la fonction (amont simulé)
    ├── sse.test.mjs            tests de l'analyseur SSE
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

# Tests unitaires (fonction Netlify, analyseur SSE)
node --test tests/*.test.mjs
```

### Tests de bout en bout (Playwright)

Les API d'IA ne sont jamais appelées : le script démarre lui-même le site, le faux fournisseur et la fonction serveur, puis pilote Chromium.

```bash
npm install --no-save playwright && npx playwright install chromium
node tests/e2e.cjs              # 21 scénarios, captures d'écran dans un dossier temporaire
node tests/e2e.cjs mémoire      # filtre sur le nom du scénario
E2E_PORT=9400 E2E_SHOTS=./captures node tests/e2e.cjs   # autres ports / dossier de captures
```

Scénarios couverts : configuration du fournisseur, envoi et rendu progressif, arrêt, régénération et versions, modification d'un message, persistance après rechargement, recherche, épingles / renommage / suppression, Markdown + code + KaTeX, charge XSS neutralisée, raisonnement, mémoire et souvenirs proposés, pièces jointes (texte et image), export / import, messages d'erreur (clé refusée, quota, panne, modèle inconnu, flux coupé), coffre chiffré, voix (API simulées), modèles « / », réglages, hors ligne via le service worker, mode serveur (mot de passe faux puis juste, flux relayé, session expirée), mobile 390 px sans défilement horizontal, thème clair. Le script échoue aussi à la moindre erreur dans la console.

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
| Modèles de requêtes | `/` en début de message |
| Aide | Ctrl/⌘ + / |

---

## Licences des composants

- [marked](https://github.com/markedjs/marked) — MIT · [DOMPurify](https://github.com/cure53/DOMPurify) — Apache 2.0 / MPL 2.0 · [highlight.js](https://highlightjs.org/) — BSD-3 · [KaTeX](https://katex.org/) — MIT (licences dans `vendor/`).
- Polices Instrument Sans, Instrument Serif, JetBrains Mono, Source Serif 4 — SIL Open Font License (licences dans `assets/fonts/`).
