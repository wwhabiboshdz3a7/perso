# Guide de lancement : vendre Levier

Ce guide s'adresse au propriétaire de la formation. Il couvre le choix de la plateforme de vente, la stratégie de prix, un plan de lancement sur 30 jours, un plan de contenus TikTok et Reels produits avec la chaîne vidéo du module 6, une séquence de 5 emails et les publicités. Règle d'or, valable partout : **aucune promesse de revenus, aucun faux témoignage, aucune fausse urgence**. C'est la loi (pratiques commerciales trompeuses), ce sont les règles publicitaires de Meta, TikTok et Google, et c'est la seule façon de durer.

---

## 1. Où vendre

Les tarifs et conditions ci-dessous sont indicatifs (novembre 2026) : vérifiez-les sur le site de chaque plateforme avant de choisir.

| Option | Coût indicatif | TVA | Compatible avec l'espace membre Levier | Pour qui |
|---|---|---|---|---|
| **Votre site + Stripe (Payment Links)** | Commission de paiement seulement (de l'ordre de 1,5 % + 0,25 € par carte européenne) | **À votre charge** (vous êtes le vendeur ; Stripe Tax peut calculer) | Oui : activation en un clic après paiement (`session_id`) | Le meilleur rapport coût/contrôle, si vous gérez la TVA ou êtes en franchise et vendez surtout en France |
| **Lemon Squeezy** | Commission plus élevée (de l'ordre de 5 % + frais fixes) | **Gérée** (revendeur officiel : la TVA de chaque pays est collectée pour vous) | Oui : clés de licence | Ventes dans toute l'Europe sans gérer la TVA de chaque pays |
| **Gumroad** | Commission plus élevée (de l'ordre de 10 % + frais fixes sur les ventes directes) | **Gérée** pour les ventes (revendeur officiel) | Oui : clés de licence | Démarrage très rapide, audience de créateurs |
| **Systeme.io** | Abonnement (offre gratuite limitée) ; pas de commission sur les ventes selon l'offre | À votre charge | Indirectement : envoyez un code d'accès par email après la vente (automatisation) | Si vous voulez tunnel de vente, emailing et paiement au même endroit |
| **Podia** | Abonnement, avec ou sans commission selon l'offre | À votre charge (à vérifier selon l'offre) | Indirectement, comme Systeme.io | Si vous voulez aussi y héberger des cours vidéo |

**Recommandation pour démarrer** : votre site + **Stripe Payment Links** pour les ventes en France, ou **Lemon Squeezy** dès que vous vendez beaucoup hors de France (le gain de temps sur la TVA compense la commission). Dans les deux cas, l'accès est automatique.

**Avec Systeme.io ou Podia** : générez des codes à l'avance (`node outils/generer-codes.mjs pro 200 --fichier`), placez-les dans un tableur, et créez une automatisation (Make, Zapier ou n8n) : « nouvelle vente » → prendre le premier code libre → l'envoyer par email → marquer le code comme utilisé.

**Dans tous les cas** :
- Case d'acceptation des CGV et de renonciation au droit de rétractation **avant** le paiement, et confirmation dans l'email (voir README).
- Factures : la plateforme émet un reçu ; en tant que vendeur direct (Stripe), émettez aussi vos factures avec votre logiciel de facturation (facture électronique : réception obligatoire depuis septembre 2026, émission en septembre 2027 pour les petites entreprises).
- Un achat test complet par offre avant l'ouverture.

---

## 2. Stratégie de prix

**La grille** (modifiable dans `config.js`) :

| Offre | Prix de départ suggéré | Rôle |
|---|---|---|
| Essentiel | 97 € | Porte d'entrée : maîtriser Claude et vendre ses premières prestations |
| Pro | 197 € | **L'offre à mettre en avant** : tout le programme, Claude Code, API, chaîne vidéo |
| VIP | 497 € | Ancre haute et accompagnement réel (2 séances, revue d'offre, questions par email) |

**Principes**
- Le Pro doit être le choix évident : l'écart Essentiel → Pro (100 €) donne accès aux trois modules les plus « rentables » (Claude Code, automatisations, vidéo).
- Le VIP n'est vendable que si vous livrez réellement l'accompagnement : limitez le nombre de places **réellement** disponibles (par exemple 10 par mois) et dites-le seulement si c'est vrai.
- **Prix de lancement honnête** : un tarif réduit pendant 7 jours pour l'ouverture, avec une date de fin réelle et un prix qui augmente vraiment ensuite. Pas de compte à rebours qui se relance, pas de « dernières places » inventées. Un prix barré ne peut afficher que le prix réellement pratiqué auparavant (le plus bas des 30 derniers jours).
- **Mises à jour** : chaque révision trimestrielle est un argument (et une occasion d'augmenter le prix pour les nouveaux clients, jamais pour les anciens).
- **Entreprises** : proposez une offre équipe sur devis (codes VIP ou Pro en lot, atelier en visio), facturée hors taxes avec votre logiciel.
- **Paiement en plusieurs fois** : possible avec certains prestataires (selon le pays et l'offre) ; ne l'activez que si vous comprenez les frais et les risques d'impayé.

---

## 3. Plan de lancement sur 30 jours

### Semaine 1 : préparer (J1 à J7)
- J1 : compléter `config.js` (checklist du README), photo, liens, mentions légales ; relecture juridique des CGV demandée.
- J2 : déploiement Netlify, domaine, variables d'environnement, formulaires détectés.
- J3 : paiement configuré (Stripe ou Lemon Squeezy), **achat test** sur chaque offre, activation vérifiée.
- J4 : outil d'emailing branché sur le formulaire « aimant » (double opt-in), séquence de 5 emails chargée (section 5).
- J5 : chaîne vidéo du module 6 installée pour votre propre compte (workflow n8n 06, voix, modèle de montage).
- J6 : 10 premières vidéos produites (section 4), calendrier de publication rempli.
- J7 : relecture complète de la page de vente sur téléphone, liens, fautes, chargement.

### Semaine 2 : créer l'audience (J8 à J14)
- Une vidéo par jour sur TikTok, Reels et Shorts, avec un appel à l'action unique : « le mini-guide gratuit est dans ma bio ».
- Trois publications LinkedIn dans la semaine (votre expérience réelle chez NEXORA : un projet, une erreur évitée, une démonstration).
- Un message personnel à 30 personnes de votre réseau qui pourraient être intéressées, sans automatisation.
- Objectif : des inscriptions au mini-guide, pas des ventes.

### Semaine 3 : pré-lancement (J15 à J21)
- Continuer le rythme vidéo ; ajouter des vidéos « coulisses » de la formation (une leçon, un exercice, un workflow).
- Un **live** ou un atelier gratuit de 45 minutes (« Monter une vidéo automatisée de A à Z avec Claude »), annoncé aux inscrits ; enregistrez-le (avec l'accord des participants si leur image apparaît).
- Ouvrir la **liste d'attente** (laisser `lienPaiement` vide le temps du pré-lancement) et annoncer la date d'ouverture.
- Recueillir les questions : elles complètent votre FAQ.

### Semaine 4 : ouverture (J22 à J30)
- J22 : ouverture (liens de paiement renseignés), email à la liste d'attente puis à tous les inscrits.
- J23 à J28 : un contenu par jour qui répond à une objection (temps, technique, prix, « est-ce officiel ? », « vais-je gagner de l'argent ? »).
- J29 : rappel de la fin réelle du tarif de lancement.
- J30 : fin du tarif de lancement ; bilan (visites, inscriptions, ventes, questions), premiers retours d'élèves demandés.

**Après le lancement** : accompagnez les premiers élèves, demandez des avis **réels** à J+30 (avec accord écrit de publication) et ajoutez-les seulement alors dans `config.js`.

---

## 4. Plan de contenus TikTok et Reels (avec la chaîne vidéo du module 6)

**Configuration du workflow n8n 06 pour votre compte**
- `marque` : Levier · `niche` : utiliser Claude pour vendre des services et automatiser la vidéo
- `public` : indépendants, freelances, gérants de TPE, créateurs francophones
- `ton` : direct, concret, une idée par vidéo, aucune promesse de revenu
- `piliers` : démonstration ; erreur courante ; avant/après ; coulisses ; question de la communauté
- Voix : votre propre voix clonée, ou une voix ElevenLabs sous licence commerciale ; mieux encore, alternez avec des vidéos face caméra.

**Règles de production**
- 30 à 45 secondes, sous-titres, une seule idée, un seul appel à l'action.
- Montrez de **vrais écrans** (Claude, n8n, HyperFrames) : c'est plus crédible et presque gratuit.
- Étiquette « contenu généré par IA » activée dès qu'un plan réaliste est généré.
- Aucun chiffre de revenu, aucune capture de « paiements reçus ».

**30 idées prêtes à scripter**

Les accroches tutoient : c'est l'usage sur TikTok et Reels, face caméra. Le site, l'espace membre et les emails, eux, vouvoient.

| # | Pilier | Accroche |
|---|---|---|
| 1 | Démonstration | « Je réponds à 20 avis Google en une minute. Regarde. » |
| 2 | Démonstration | « Cette vidéo a été montée sans logiciel de montage. » |
| 3 | Erreur | « Tu utilises Claude comme Google. Voilà ce que tu rates. » |
| 4 | Avant/après | « Le même prompt, version débutant et version pro. » |
| 5 | Coulisses | « Comment je produis 5 vidéos en une matinée. » |
| 6 | Question | « Faut-il payer Claude pour commencer ? Réponse honnête. » |
| 7 | Démonstration | « Un devis brouillon en 30 secondes à partir d'un message client. » |
| 8 | Erreur | « Le piège quand tu laisses une IA calculer tes prix. » |
| 9 | Avant/après | « Une fiche Google avant et après 15 minutes de travail. » |
| 10 | Démonstration | « Les Projets Claude : un espace par client. » |
| 11 | Question | « Est-ce légal de vendre des vidéos faites avec l'IA ? » |
| 12 | Coulisses | « La voix de cette vidéo n'est pas enregistrée. Voilà comment. » |
| 13 | Erreur | « Ne clone jamais la voix de quelqu'un sans ça. » |
| 14 | Démonstration | « Mettre un site en ligne à partir d'un Artifact. » |
| 15 | Avant/après | « Un texte de site creux, réécrit en concret. » |
| 16 | Démonstration | « Les sous-titres de cette vidéo viennent d'un horodatage, pas d'une transcription. » |
| 17 | Question | « Micro-entreprise ou SASU pour vendre des services IA ? » |
| 18 | Erreur | « La phrase qui fait fuir tes prospects dans ton premier email. » |
| 19 | Démonstration | « Un chatbot qui répond uniquement avec les infos de l'entreprise. » |
| 20 | Coulisses | « Mon plan de prospection d'une rue commerçante. » |
| 21 | Avant/après | « Une proposition commerciale de 6 pages réduite à 2. » |
| 22 | Démonstration | « Claude Code me monte une vidéo en HTML. » |
| 23 | Question | « L'AI Act, ça change quoi pour un freelance ? En 40 secondes. » |
| 24 | Erreur | « Pourquoi tes vidéos IA décrochent à 3 secondes. » |
| 25 | Démonstration | « La veille de la semaine, dans ma boîte mail, chaque lundi. » |
| 26 | Avant/après | « Une accroche plate, et la même avec une mécanique. » |
| 27 | Coulisses | « Combien coûte vraiment une vidéo automatisée (calcul détaillé). » |
| 28 | Question | « Facture électronique 2026-2027 : ce que doit faire un indépendant. » |
| 29 | Démonstration | « 112 prompts classés par métier : je t'en montre trois. » |
| 30 | Coulisses | « Ce que j'ai appris en accompagnant plus de 150 projets. » |

**Rythme** : une vidéo par jour pendant le lancement, puis trois à cinq par semaine. Chaque lundi, le workflow propose les scripts ; vous en validez trois à cinq. Chaque mois, analysez les statistiques avec le prompt de la leçon 8 du module 6 et ajustez les piliers.

---

## 5. Séquence de 5 emails (inscrits au mini-guide)

Chaque email : expéditeur identifiable, lien de désinscription, une seule action demandée. Remplacez les crochets. Le rythme (J0, J+2, J+4, J+6, J+8, puis environ un email par semaine) est celui annoncé dans la case de consentement du formulaire : si vous le changez, changez aussi ce texte dans `public/index.html` et dans la politique de confidentialité. Comme le site, les emails vouvoient.

Le premier email est envoyé automatiquement par le site si l'envoi d'emails est configuré (variables `EMAIL_*`, fonction `guide`) : il contient le lien personnel du mini-guide. Programmez les quatre suivants dans votre outil d'emailing, à partir de l'export des inscrits du formulaire « aimant » (Netlify Forms).

### Email 1 (immédiat) : « Votre mini-guide (et par où commencer) »
> Bonjour [prénom],
>
> Merci pour votre inscription. Votre mini-guide « 7 services IA à proposer ce mois-ci » est ici : [lien personnel du guide, /merci/?g=…]. Gardez cet email : le lien reste valable un an.
>
> Mon conseil : ne lisez pas les sept. Choisissez **un** service, celui qui ressemble le plus à ce que vous savez déjà faire, puis ouvrez le module 0 de la formation (en accès libre) : le plan d'action sur 30 jours vous mène jusqu'à votre première proposition.
>
> → [Commencer le module 0]
>
> Je suis Ibrahim, fondateur de l'agence NEXORA. Dans les prochains jours, je vous envoie quatre emails courts et concrets.
>
> Ibrahim

### Email 2 (J+2) : « L'erreur que je vois chez presque tout le monde »
> Bonjour [prénom],
>
> On utilise souvent Claude comme un moteur de recherche : une question, une réponse, on recommence. Résultat : des réponses moyennes, et l'impression que « l'IA, c'est surfait ».
>
> Ce qui change tout : donner un contexte durable. Un Projet par client, avec ses documents et ses règles. Les réponses deviennent spécifiques, dans le bon ton, réutilisables.
>
> La leçon complète est dans le module 1, en accès libre : [lien leçon Projets].
>
> Ibrahim

### Email 3 (J+4) : « Une vidéo sans logiciel de montage »
> Bonjour [prénom],
>
> Cette semaine, je vous montre [ou : je vous ai montré] une vidéo montée entièrement par le code : le script vient de Claude, la voix d'ElevenLabs, les sous-titres d'un horodatage, et le montage d'une page HTML rendue en MP4.
>
> C'est le cœur du module 6 de la formation : une chaîne qui produit les scripts, les voix, les sous-titres et le plan de montage de la semaine, que vous pouvez vendre à des commerces ou utiliser pour votre propre chaîne.
>
> → [Voir le programme du module 6]
>
> Ibrahim

### Email 4 (J+6) : « Vous vous posez sûrement ces trois questions »
> Bonjour [prénom],
>
> **« Je ne suis pas technique. »** Les modules 0 à 3, 7 et 8 ne demandent aucune compétence technique. Les autres avancent pas à pas, avec des fichiers prêts à l'emploi.
>
> **« Est-ce que je vais gagner de l'argent ? »** Honnêtement, je ne peux pas vous le promettre, et personne ne devrait. La formation vous donne la méthode, les modèles et les outils ; le reste dépend de votre travail et de votre marché.
>
> **« C'est une formation officielle ? »** Non : elle est indépendante, non affiliée à Anthropic. C'est aussi ce qui me permet de vous parler des limites de l'outil.
>
> → [Lire la FAQ complète]
>
> Ibrahim

### Email 5 (J+8) : « La formation complète est ouverte »
> Bonjour [prénom],
>
> La formation complète est ouverte : 9 modules, 61 leçons avec exercices corrigés, 112 prompts métiers, 6 workflows n8n, la chaîne vidéo automatisée, et les volets vente et légal pour travailler en règle en France.
>
> [Si c'est vrai :] Le tarif de lancement est valable jusqu'au [date réelle], ensuite le prix passe à [prix].
>
> → [Choisir mon offre]
>
> [Si la garantie est active :] Vous avez [14] jours pour changer d'avis : un email suffit, je vous rembourse.
>
> Ibrahim
>
> *PS : si ce n'est pas le bon moment, aucun problème. Vous continuerez à recevoir mes conseils environ une fois par semaine, et vous pouvez vous désinscrire en un clic.*

---

## 6. Publicités

**Avant toute dépense**
- Page de vente terminée, achat test réussi, au moins 10 vidéos organiques publiées (vous saurez quelles accroches fonctionnent).
- **Mesure et cookies** : le site n'utilise aujourd'hui aucun traceur. Ajouter le pixel Meta, TikTok ou une balise Google impose un **bandeau de consentement** conforme aux recommandations de la CNIL (refuser aussi simple qu'accepter) et la mise à jour de la politique de confidentialité. Alternative sans traceur : liens avec paramètres UTM et suivi des inscriptions dans l'outil d'emailing.

**Règles publicitaires**
- Meta, TikTok et Google refusent les publicités qui promettent des revenus ou un enrichissement rapide, et sanctionnent les comptes qui insistent. Vendez une **compétence** et un **résultat de travail** (« monter une vidéo automatisée », « répondre à 20 avis en une minute »), jamais un revenu.
- Pas de faux témoignages, pas d'avatars présentés comme de vrais clients, étiquette IA sur les contenus réalistes générés.
- La page d'arrivée doit tenir la promesse de la publicité (même offre, même prix).

**Structure conseillée**
1. **Campagne d'inscriptions** (objectif : prospects) vers le mini-guide gratuit : c'est la moins chère et elle alimente la séquence d'emails. Budget de test : 10 à 20 € par jour pendant 7 jours, 3 à 5 vidéos différentes (vos meilleures accroches organiques).
2. **Reciblage** des inscrits et visiteurs (si traceurs consentis) vers l'offre Pro pendant la semaine d'ouverture.
3. **Recherche Google** (plus tard) sur des requêtes d'intention : « formation Claude », « formation automatisation vidéo IA », « formation n8n IA ».

**Créations publicitaires** : produisez-les avec la chaîne du module 6 (format 9:16, sous-titres, 20 à 30 secondes, démonstration réelle à l'écran). Testez une seule variable à la fois (l'accroche d'abord). Coupez une publicité après une dépense égale à environ deux à trois fois le coût d'une inscription visé sans résultat.

**Indicateurs à suivre chaque semaine** : coût par inscription, taux d'ouverture et de clic des emails, taux de conversion des inscrits en acheteurs, remboursements, questions reçues. Décidez sur ces chiffres, pas sur les vues.
