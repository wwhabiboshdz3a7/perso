# JARVIS — interface HUD pilotée à la main et à la voix

Interface « style Jarvis » pour NEXORA : on attrape une photo à l’écran d’un appareil en fermant le poing, on ouvre la main devant un autre appareil, et elle y atterrit. Autour de cette fonction phare : curseur aérien, galerie gestuelle, dessin dans l’air, hologramme 3D, commandes vocales en français et HUD complet.

Site **100 % statique** (aucune commande de build), publiable tel quel sur Netlify. Tout le suivi des mains tourne dans le navigateur : la caméra n’est jamais envoyée, seule la photo choisie part, en pair-à-pair.

---

## Fonctionnalités

| Module | Ce qu’il fait |
|---|---|
| **Partage à la main** (fonction phare) | Viser une photo avec l’index → **poing** = attraper (la photo se réduit dans la main, particules, anneau de progression) → **main ouverte** devant l’autre appareil = lâcher (animation d’atterrissage). **Lancer** : poing qui s’ouvre en plein mouvement = envoi direct vers l’appareil situé dans cette direction. Ouvrir la main sur l’appareil émetteur repose la photo. Pré-envoi dès l’attrapé (atterrissage instantané), découpage en morceaux de 48 Ko avec progression, image redimensionnée (2560 px max, JPEG), **empreinte SHA-256 vérifiée** à l’arrivée. |
| **Liaison entre appareils** | Réseau : WebRTC via PeerJS, appairage par **QR code** ou **code court** (6 caractères, ex. `K7P-2QX`). Locale : `BroadcastChannel` entre fenêtres/onglets du même navigateur. Rôle de chaque appareil : émetteur, récepteur ou les deux ; direction de lancer par appareil. Téléphone ↔ ordinateur. |
| **Curseur aérien** | L’index pilote un curseur sur toute l’interface (aimantation douce sur les boutons). Pincement bref = clic, pincement maintenu = glisser (curseurs de réglage, défilement). |
| **Galerie gestuelle** | Photos de l’utilisateur (sélecteur ou glisser-déposer, stockées en IndexedDB) + 6 visuels de démonstration générés en canvas. Visionneuse : swipe ← → pour naviguer, deux mains qui pincent pour zoomer/pivoter, pouce levé = favori. |
| **Dessin dans l’air** | Index levé = dessiner, pincement = couleur suivante, poing = gomme, deux index levés = tout effacer, export PNG vers la galerie. Souris et doigt aussi. |
| **Hologramme 3D** | Three.js : globe filaire avec 15 villes reliées à Toulouse et un satellite, ou réacteur à anneaux. Rotation en pinçant, zoom à deux mains, swipe pour lancer la rotation. |
| **Commandes vocales** | Web Speech API en `fr-FR`, mot d’éveil « Jarvis » (ou geste *I love you* pour écouter sans mot d’éveil), réponses parlées en voix française. Repli clavier (Firefox) : la barre de commande accepte les mêmes phrases. |
| **Cerveau IA** (facultatif) | Questions libres via n’importe quelle API compatible OpenAI : Groq, OpenRouter, Mistral, Hugging Face, Ollama ou LM Studio en local, ou point d’accès personnalisé. Clé saisie dans les réglages, gardée uniquement dans ce navigateur. |
| **Captures** | Geste *victoire* (ou « prends une capture ») : compte à rebours, photo webcam avec cadre HUD, ajoutée à la galerie. |
| **HUD** | Démarrage court et passable (Échap), horloge, météo (Open-Meteo), capteurs (images/s, mains, latence, geste et score du modèle), journal, minuteries, notifications, sons synthétisés en WebAudio (aucun fichier), squelette des mains en miroir sur l’aperçu et en fantôme plein écran, veille. |
| **Accueil, tutoriel, calibration** | Explication avant toute demande de caméra ou de micro, tutoriel animé de chaque geste (mains en SVG), calibration du pincement et du poing, main dominante, miroir, sensibilité, lissage, anti-rebond. Page [confidentialité](confidentialite.html). |
| **Mode simulation** | Banc qui rejoue des gestes synthétiques ou **enregistrés depuis la vraie caméra** (« Enregistrer un geste », export/import JSON) à travers le **même pipeline** que la caméra. **Main virtuelle** : la souris devient une main (clic bref = pincement, clic maintenu = poing, relâcher = main ouverte). |

### Gestes

| Geste | Effet |
|---|---|
| Index levé | Curseur aérien · dessiner |
| Pincement pouce-index | Clic · maintenu : glisser · dessin : couleur suivante |
| Poing (main ouverte → poing) | Attraper la photo visée · dessin : gomme |
| Main ouverte (poing → main ouverte) | Lâcher la photo ici · sur l’émetteur : la reposer |
| Poing qui s’ouvre en mouvement | Lancer la photo dans cette direction |
| Swipe main ouverte | Photo suivante / précédente · faire tourner l’hologramme |
| Deux mains qui pincent | Zoom (écartement) et rotation (angle) |
| Pouce levé | Favori |
| Victoire | Capture webcam |
| I love you | JARVIS écoute sans mot d’éveil |
| Deux index levés | Effacer le dessin |

### Commandes vocales (exemples)

« Jarvis, ouvre la galerie » · « mode dessin » · « affiche l’hologramme » · « envoie la photo » · « quelle heure est-il ? » · « météo à Toulouse » · « minuterie de 5 minutes » · « annule la minuterie » · « prends une capture » · « photo suivante » · « efface tout » · « mode veille » / « réveille-toi » · « coupe le son » · « aide ». Toute autre question part au cerveau IA s’il est configuré.

---

## Structure

```
index.html                 Application (HUD, modules, dialogues)
confidentialite.html       Ce qui est traité, où, et ce qui sort de l’appareil
netlify.toml               Publication « . », en-têtes (CSP, Permissions-Policy, cache)
manifest.webmanifest       Installation en application
css/jarvis.css             Identité visuelle (cyan/ambre, crochets, grilles, scanlines)
assets/icon.svg
js/core/                   Cœur pur, sans DOM, testé avec node --test
  one-euro.js              Filtre One Euro (lissage)
  hand.js                  Géométrie de la main : ratios des doigts, pincement normalisé, poses
  gestures.js              Moteur de gestes (pincement à hystérésis, attraper/lâcher/lancer,
                           swipe, deux mains, gestes du modèle, anti-rebond, seuils réglables)
  handpose.js              Mains synthétiques au format MediaPipe (21 points)
  sequences.js             Séquences de gestes interpolées + catalogue de scénarios
  protocol.js              Paquets binaires, découpage/réassemblage, SHA-256, codes de liaison
  commands.js              Analyse des commandes vocales (mot d’éveil, durées, villes…)
js/app/                    Interface
  main.js                  Assemblage, routage des gestes, modes, caméra, simulation
  tracker.js               Caméra + MediaPipe (GPU avec repli CPU, mode léger 640×480)
  vision-worker.js         Inférence MediaPipe dans un worker (repli sur le fil principal)
  pipeline.js              Bus unique caméra / simulation / main virtuelle → moteur
  sources.js               Rejoueur de séquences, main virtuelle (souris), enregistreur
  cursor.js                Curseur aérien
  share.js · transport.js  Partage à la main · liaisons BroadcastChannel et PeerJS
  gallery.js · images.js   Galerie IndexedDB · traitement d’images hors du fil principal
  image-worker.js          Worker (OffscreenCanvas) : JPEG, visuels de démonstration
  draw.js · holo.js        Dessin dans l’air · hologramme Three.js
  assistant.js · ai.js     Voix, commandes, cerveau IA compatible OpenAI
  hud.js · ui.js · sound.js · weather.js · timers.js · capture.js · sleep.js
  tutorial.js · settings-ui.js · store.js · db.js · dom.js · demo-images.js
models/                    gesture_recognizer.task, hand_landmarker.task (auto-hébergés)
vendor/                    MediaPipe Tasks Vision 1.1.1 (ESM + IIFE pour le worker, wasm), Three.js r186, PeerJS 1.5.5,
                           qrcode-generator 2.0.4, polices Chakra Petch et JetBrains Mono
tests/unit/                Tests du cœur (node --test)
tests/e2e/                 Tests de bout en bout Playwright (fausse caméra, deux pages…)
```

---

## Déploiement sur Netlify

1. **Add new site → Import an existing project**, choisir ce dépôt et la branche `jarvis`.
2. Build command : *(vide)* · Publish directory : `.` (déjà indiqué dans `netlify.toml`).
3. Déployer. Le site est servi en **HTTPS**, obligatoire pour la caméra et le micro.

Ou en glisser-déposer : déposer le dossier du projet sur <https://app.netlify.com/drop>.

`netlify.toml` fixe une politique de sécurité stricte (scripts du site uniquement, `wasm-unsafe-eval` pour MediaPipe, caméra et micro limités au site, pas d’intégration en iframe) et met en cache les modèles et les bibliothèques une semaine.

Le site fonctionne aussi depuis n’importe quel hébergement statique HTTPS. En local : `python3 -m http.server 9120` puis <http://localhost:9120> (localhost est considéré comme sûr pour la caméra).

---

## Configuration

Tout se règle dans l’interface (⚙ Réglages) : rien n’est à modifier dans le code.

- **Gestes** : main dominante, sensibilité du curseur, lissage, seuil de pincement, anti-rebond, vitesse de swipe/lancer, squelette plein écran, aimantation, calibration (10 s devant la caméra).
- **Caméra** : frontale/arrière, qualité (auto, 1280×720, légère 640×480), modèle (points + gestes, ou points seuls), calcul GPU (repli CPU automatique, et bascule si le GPU s’avère plus lent que le processeur), miroir, vidéo en fond.
- **Voix & IA** : mot d’éveil, réponses parlées, voix, débit, ville par défaut, prénom ; cerveau IA (fournisseur, adresse `…/v1`, modèle, clé, mémorisation de la clé, personnalité).
- **Liaison** : rôle de l’appareil, liaison locale entre fenêtres, acceptation automatique des photos lancées, **serveur de signalisation PeerJS** (hôte, port, chemin, clé, wss) et **serveurs ICE** (JSON, par exemple un relais TURN pour les réseaux d’entreprise).

### Serveur PeerJS personnel (facultatif)

Par défaut, le serveur public `0.peerjs.com` met les appareils en relation (il ne voit jamais les photos). Pour héberger le vôtre :

```bash
npx peer --port 9000 --path /jarvis
```

puis, dans Réglages → Liaison : hôte `votre-domaine`, port `443`, chemin `/jarvis`, wss coché. Pour les réseaux qui bloquent le pair-à-pair, ajoutez un relais TURN dans « Serveurs ICE », par exemple :

```json
[{"urls":"stun:stun.l.google.com:19302"},{"urls":"turn:turn.exemple.fr:3478","username":"…","credential":"…"}]
```

### Cerveau IA

| Fournisseur | Adresse | Remarque |
|---|---|---|
| Groq | `https://api.groq.com/openai/v1` | clé gratuite, très rapide |
| OpenRouter | `https://openrouter.ai/api/v1` | modèles gratuits disponibles |
| Mistral | `https://api.mistral.ai/v1` | |
| Ollama (local) | `http://localhost:11434/v1` | lancer avec `OLLAMA_ORIGINS=*` pour autoriser le site |
| LM Studio (local) | `http://localhost:1234/v1` | activer CORS dans le serveur local |

La clé n’est envoyée qu’au point d’accès choisi ; sans mémorisation, elle disparaît à la fermeture de l’onglet.

---

## Compatibilité

- **Chrome / Edge** (ordinateur et Android) : tout fonctionne, dont la reconnaissance vocale.
- **Safari** (macOS, iOS 16.4+) : gestes, partage, hologramme ; reconnaissance vocale selon la version.
- **Firefox** : gestes, partage, hologramme ; pas de reconnaissance vocale, la barre de commande au clavier prend le relais.
- Sur mobile, la qualité automatique passe en 640×480 ; elle bascule aussi seule en mode léger si le suivi descend sous 12 images/s.
- L’analyse des images tourne dans un worker : l’interface reste fluide même quand le suivi est lent. Si le navigateur ne le permet pas, elle repasse automatiquement sur le fil principal.

---

## Développement et tests

Aucune dépendance n’est nécessaire pour faire tourner le site. Pour les tests :

```bash
npm test                 # tests unitaires du cœur (node --test, séquences de points synthétiques)
npm run test:e2e         # tests de bout en bout (Playwright + Chromium)
```

Les tests de bout en bout démarrent eux-mêmes un serveur local (`tests/e2e/serveur.py`, port 9147, mêmes en-têtes que Netlify) et couvrent :

- **optique** : vraie inférence MediaPipe sur la fausse caméra de Chromium, modèles et WASM chargés depuis `models/` et `vendor/`, boucle d’inférence active, FPS affichés, aucune ressource externe ;
- **partage entre deux pages** (BroadcastChannel) : attraper sur A, lâcher sur B, empreinte SHA-256 et dimensions identiques ; lancer ; reposer ; envoi par bouton et par commande ;
- **curseur aérien, dessin, galerie, hologramme, import** en simulation ;
- **commandes** au clavier, mot d’éveil avec une reconnaissance vocale simulée, réponses parlées en français, cerveau IA simulé, repli sans reconnaissance vocale, main virtuelle à la souris ;
- **liaison réseau** : serveur cloud injoignable (état propre) et transfert WebRTC réel entre deux navigateurs via un serveur PeerJS local ;
- **accueil, tutoriel, réglages, confidentialité, mobile 390 px** (pas de défilement horizontal, mode léger), **accessibilité** (axe-core) et zéro erreur console.

Les services externes (Open-Meteo, serveur cloud PeerJS, API d’IA) sont simulés dans les tests. Variables utiles :

| Variable | Rôle |
|---|---|
| `JARVIS_PORT` | port du serveur de test (défaut 9147) |
| `JARVIS_CAPTURES` | dossier des captures d’écran (défaut : dossier temporaire du système) |
| `JARVIS_NPM` | dossier `node_modules` contenant `playwright`, `peer` et `axe-core` (les deux derniers sont facultatifs : sans eux, les tests correspondants sont ignorés) |

Pour une démonstration sans caméra : ouvrir `/?demo` (main virtuelle + banc de simulation) dans deux fenêtres du même navigateur. Dans la première, maintenez le clic sur une photo (poing : elle est attrapée) ; dans la seconde, maintenez puis relâchez le clic (la main s’ouvre) : la photo y atterrit.

`window.jarvis` expose une petite console : `jarvis.state()`, `jarvis.sim.play('attraper')`, `jarvis.command('météo à Lyon')`…

---

## Licences des composants embarqués

MediaPipe Tasks Vision et ses modèles (Apache 2.0), Three.js (MIT), PeerJS (MIT), qrcode-generator (MIT), Chakra Petch et JetBrains Mono (SIL OFL 1.1). Les textes de licence sont dans chaque dossier de `vendor/`.
