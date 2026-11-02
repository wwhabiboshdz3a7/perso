import { code, encart, tableau, pas, q, crit, mots, script } from './_outils.mjs';

export default {
  intro: `<p>Ce module transforme votre maîtrise de Claude en <strong>livrables</strong> : contenus qui se positionnent sur Google, sites en ligne, documents et présentations, analyses de données, réponses clients. À chaque fois, la même logique : un process clair, une vérification humaine, un résultat que vous pouvez facturer.</p>`,
  lecons: [
    {
      titre: 'Rédaction et SEO sans contenu creux',
      objectifs: ['Comprendre la position de Google sur les contenus produits avec l\'IA', 'Appliquer un process de rédaction qui apporte une vraie valeur', 'Livrer un article optimisé pour le référencement local'],
      theorie: `<h2>Ce que Google récompense (et sanctionne)</h2>
<p>Google ne pénalise pas un contenu parce qu'il a été écrit avec l'aide de l'IA : il évalue son <strong>utilité</strong> pour le lecteur. En revanche, ses règles anti-spam visent la <strong>production de contenus en masse</strong> dont le but principal est de manipuler le classement, quelle que soit la méthode utilisée, ainsi que les « pages satellites » (des dizaines de pages quasi identiques qui ne changent que le nom de la ville). Les critères de qualité tournent autour de l'expérience, de l'expertise, de l'autorité et de la fiabilité (souvent abrégés E-E-A-T).</p>
${encart('warn', 'La conséquence pour vous', '<p>Générer 200 articles génériques pour un client est risqué et ne fonctionne pas durablement. Ce qui marche : moins d\'articles, chacun nourri d\'informations que seul votre client possède (son expérience, ses chiffres, ses photos, ses cas réels).</p>')}
<h2>Le process en 6 étapes</h2>
${tableau(['Étape', 'Ce que vous faites', 'Rôle de Claude'], [
  ['1. Intention', 'Tapez la requête cible sur Google : que montrent les premiers résultats ? Quelles questions reviennent ?', 'Synthétiser l\'intention et les questions du lecteur'],
  ['2. Matière unique', 'Interview de 15 minutes du client (questions préparées), photos, chiffres, anecdotes', 'Préparer les questions, transcrire et extraire les éléments uniques'],
  ['3. Plan', 'Validez une structure de titres qui répond à l\'intention', 'Proposer 2 plans, avec les questions couvertes'],
  ['4. Rédaction', 'Fournissez brief, plan, matière unique, ton', 'Rédiger en intégrant la matière unique'],
  ['5. Optimisation', 'Balise title (environ 60 caractères), méta-description (environ 155), liens internes, texte alternatif des images', 'Proposer des variantes et vérifier les éléments'],
  ['6. Vérification', 'Relisez chaque fait, chiffre, prix, mention réglementaire', 'Lister les affirmations à vérifier']
])}
<h2>L'interview qui fait la différence</h2>
${code('markdown', `Tu prépares l'interview d'un artisan pour un article intitulé
« {{sujet}} ». Propose 10 questions qui feront émerger :
- des exemples de chantiers réels (sans données personnelles des clients),
- des erreurs fréquentes que voient ses clients,
- des chiffres concrets (délais, fourchettes de prix pratiquées, durées de vie),
- son avis personnel argumenté.
Questions courtes, une idée par question.`)}
<h2>Le référencement local</h2>
<ul>
  <li>Une page par <strong>prestation</strong> réellement proposée, avec la zone d'intervention, plutôt qu'une page par ville copiée-collée.</li>
  <li>Une fiche <strong>Google Business Profile</strong> complète (catégories, services, photos, posts réguliers, réponses aux avis) : c'est souvent le premier levier pour un commerce local.</li>
  <li>Des informations cohérentes partout : nom, adresse, téléphone identiques sur le site, la fiche et les annuaires.</li>
  <li>Des données structurées de type « LocalBusiness » sur le site (Claude peut les générer en JSON-LD, à valider avec l'outil de test des résultats enrichis de Google).</li>
</ul>
<h2>L'offre que vous pouvez vendre</h2>
<p>« Pack visibilité locale » : 2 à 4 articles par mois issus d'une interview mensuelle, 4 posts Google Business Profile, les réponses aux avis. La valeur ne vient pas du volume mais de la régularité et de la matière unique.</p>`,
      pas: [
        pas('Choisissez une requête', 'Pour un client réel ou fictif : « [prestation] + [ville] ». Analysez les 5 premiers résultats.'),
        pas('Préparez l\'interview', 'Générez les 10 questions avec le prompt de la leçon et ajustez-les.'),
        pas('Récoltez la matière', 'Interviewez le client (ou répondez à sa place pour l\'exercice) et collez les réponses dans son Projet.'),
        pas('Plan puis rédaction', 'Validez un plan, puis faites rédiger en exigeant l\'usage de la matière unique.'),
        pas('Optimisez et vérifiez', 'Title, méta-description, liens internes, JSON-LD, liste des faits à vérifier.')
      ],
      exercice: {
        type: 'texte', titre: 'Le brief d\'un article local',
        enonce: '<p>Rédigez le brief complet d\'un article pour un commerce ou un artisan : <strong>requête cible</strong>, <strong>intention</strong> du lecteur, <strong>matière unique</strong> apportée par le client (au moins deux éléments), <strong>plan</strong> (titres), et <strong>title</strong> et <strong>méta-description</strong> proposés.</p>',
        criteres: [
          mots(90),
          crit('Indique une requête cible', /(requête|mot-clé|mots-clés|recherche)/i),
          crit('Décrit l\'intention du lecteur', /(intention|cherche à|veut savoir|besoin du lecteur|question)/i),
          crit('Prévoit une matière unique (expérience, chiffres, cas)', /(interview|expérience|chiffres?|cas réel|anecdote|photo|chantier|témoign)/i),
          crit('Propose un title et une méta-description', /(title|titre seo)[\s\S]*(méta|meta)/i)
        ],
        solution: '<p>Requête : « rénovation salle de bain Muret ». Intention : un propriétaire veut connaître les étapes, les délais et un ordre de prix avant de demander des devis. Matière unique : 3 chantiers récents décrits par l\'artisan (surface, durée, difficulté rencontrée), sa fourchette de prix habituelle, les 3 erreurs qu\'il voit le plus souvent, photos avant/après avec accord des clients. Plan : Les étapes d\'une rénovation ; Combien de temps ça prend vraiment ; Ce qui fait varier le prix ; 3 erreurs à éviter ; Nos réalisations à Muret ; Demander un devis. Title : « Rénovation de salle de bain à Muret : étapes, délais et prix ». Méta-description : « Étapes, délais réels et ce qui fait varier le prix d\'une rénovation de salle de bain à Muret, avec 3 chantiers récents. Devis gratuit. »</p>',
        explication: 'Brief solide : l\'article apportera une vraie valeur que des contenus génériques n\'ont pas.'
      },
      quiz: [
        q('Google pénalise-t-il un contenu parce qu\'il a été écrit avec l\'IA ?', ['Oui : tout texte détecté comme généré par IA est déclassé d\'office', 'Non, à condition d\'ajouter la mention « texte rédigé avec l\'IA »', 'Oui, sauf si le texte passe un outil de reformulation anti-détection', 'Non : il juge l\'utilité, mais sanctionne le contenu de masse manipulateur'], 3, 'La méthode importe moins que la valeur et l\'intention.'),
        q('Qu\'est-ce qu\'une « page satellite » ?', ['Une version traduite d\'une page, destinée à un autre pays', 'Une page quasi identique dupliquée par requête, par exemple par ville', 'Une page d\'atterrissage dédiée à une campagne publicitaire payante', 'Une sous-page du blog qui reprend un article en version courte'], 1, 'Elles sont visées par les règles anti-spam de Google.'),
        q('Quel est le meilleur moyen de rendre un article unique ?', ['Le rallonger à plus de 3 000 mots pour couvrir tout le sujet', 'Répéter le mot-clé principal dans chaque titre et paragraphe', 'Y intégrer l\'expérience, les chiffres et les cas réels du client', 'Le reformuler avec un outil pour échapper aux détecteurs d\'IA'], 2, 'C\'est la matière unique qui crée la valeur.'),
        q('Premier levier de visibilité pour un commerce local ?', ['Une fiche Google Business Profile complète et active', 'Un blog alimenté de cent articles générés en un mois', 'Une campagne d\'achat de liens sur des annuaires', 'Un compte sur chaque réseau social, même inactif'], 0, 'La fiche locale est souvent décisive pour les recherches de proximité.')
      ],
      script: script('7 min',
        'Deux cents articles générés par IA pour un client : c\'est la meilleure façon de perdre le client et le classement. Voici ce qui marche.',
        ['Ce que Google récompense et sanctionne', 'Le process en 6 étapes', 'L\'interview de 15 minutes qui rend l\'article unique', 'Le référencement local', 'L\'offre « pack visibilité locale »'],
        'Rédigez votre brief d\'article local dans l\'exercice.',
        'Analyse des résultats Google pour une requête locale, puis rédaction dans le Projet client.')
    },
    {
      titre: 'Sites web : de l\'Artifact à la mise en ligne',
      objectifs: ['Concevoir une page complète avec Claude', 'Mettre un site en ligne avec un nom de domaine et HTTPS', 'Livrer un site conforme : mentions légales, formulaire, accessibilité'],
      theorie: `<p>Pour un commerce ou un indépendant, un site d'une à cinq pages, rapide et clair, suffit souvent. Avec Claude, vous pouvez le concevoir en quelques heures. Ce qui fait la différence avec un amateur : la mise en ligne propre et la conformité.</p>
<h2>De la conversation au fichier</h2>
<ol>
  <li><strong>Brief</strong> dans le Projet du client : objectif du site, cible, pages, contenus fournis (textes, photos, horaires, avis), couleurs et polices.</li>
  <li><strong>Structure</strong> validée (sections de la page d'accueil, puis pages secondaires).</li>
  <li><strong>Artifact HTML</strong> : demandez « un seul fichier HTML avec le CSS intégré, sans dépendance externe, responsive, accessible (contrastes, textes alternatifs, navigation au clavier) ».</li>
  <li><strong>Itérations ciblées</strong> sur mobile d'abord.</li>
  <li><strong>Export</strong> du fichier, renommé <code>index.html</code>, dans un dossier avec les images optimisées.</li>
</ol>
<h2>La mise en ligne</h2>
${tableau(['Étape', 'Comment'], [
  ['Hébergement', 'Netlify (glisser-déposer du dossier sur la page « Drop »), ou un hébergeur équivalent. Gratuit pour un petit site statique.'],
  ['Nom de domaine', 'Acheté chez un registraire (OVHcloud, Gandi, etc.) <strong>au nom du client</strong>, puis relié à l\'hébergeur via les DNS.'],
  ['HTTPS', 'Certificat automatique chez la plupart des hébergeurs modernes, une fois le domaine relié.'],
  ['Formulaire', 'Formulaire de contact géré par l\'hébergeur (par exemple Netlify Forms) ou un service tiers, avec une case d\'information RGPD.'],
  ['Suivi', 'Google Search Console (indexation), lien depuis la fiche Google Business Profile.']
])}
<h2>La conformité, non négociable</h2>
<ul>
  <li><strong>Mentions légales</strong> : identité de l'éditeur (nom, adresse, SIRET, contact), directeur de la publication, hébergeur (nom, adresse, téléphone). Obligatoires.</li>
  <li><strong>Politique de confidentialité</strong> dès qu'il y a un formulaire ou une mesure d'audience.</li>
  <li><strong>Cookies</strong> : pas de traceurs publicitaires ni de mesure d'audience non exemptée sans consentement préalable. Le plus simple : pas de traceurs, ou un outil de mesure configuré pour être exempté de consentement selon les recommandations de la CNIL.</li>
  <li><strong>Accessibilité</strong> : visez les bonnes pratiques (contrastes suffisants, titres hiérarchisés, textes alternatifs, formulaires étiquetés). Depuis le 28 juin 2025, l'acte européen sur l'accessibilité impose des exigences à certains services en ligne grand public, comme le commerce en ligne, avec une exemption pour les microentreprises de services : vérifiez la situation de chaque client.</li>
</ul>
${encart('ok', 'Remise des clés', '<p>Le domaine et l\'hébergement au nom du client, les accès transmis par un gestionnaire de mots de passe, une page d\'aide d\'une page pour modifier les horaires : vous gagnez sa confiance, et souvent un contrat de maintenance.</p>')}
<p>Pour un site de plusieurs pages, avec un historique des versions et des mises à jour régulières, vous passerez à Claude Code et Git (module 4).</p>`,
      pas: [
        pas('Rédigez le brief du site', 'Dans le Projet client : objectif, cible, pages, contenus, identité visuelle.'),
        pas('Générez l\'Artifact', 'Un seul fichier HTML responsive et accessible ; itérez sur la version mobile.'),
        pas('Préparez le dossier', '<code>index.html</code>, images compressées, page <code>mentions-legales.html</code>.'),
        pas('Mettez en ligne', 'Glissez le dossier sur la page de dépôt de Netlify ; ouvrez l\'adresse provisoire sur votre téléphone.'),
        pas('Contrôlez', 'Lancez l\'audit Lighthouse de Chrome (performances, accessibilité, SEO) et corrigez les alertes principales.')
      ],
      exercice: {
        type: 'checklist', titre: 'Checklist de mise en ligne',
        enonce: '<p>À cocher pour votre site de démonstration (ou le site d\'un client).</p>',
        items: [
          'Brief validé (objectif, cible, pages, contenus)',
          'Version mobile vérifiée sur un vrai téléphone',
          'Images compressées et textes alternatifs renseignés',
          'Site en ligne en HTTPS',
          'Nom de domaine au nom du client (ou prévu dans la proposition)',
          'Mentions légales complètes et politique de confidentialité si formulaire',
          'Aucun traceur sans consentement',
          'Audit Lighthouse lancé, alertes principales corrigées',
          'Accès et page d\'aide prêts à transmettre'
        ],
        explication: 'Site prêt à livrer. Ajoutez-le à votre portfolio (avec l\'accord du client).'
      },
      quiz: [
        q('Au nom de qui enregistrer le nom de domaine d\'un client ?', ['Au vôtre, pour garder la main', 'Au nom du client', 'Au nom de l\'hébergeur du site', 'Au vôtre, puis transféré en fin de contrat'], 1, 'Le client doit rester propriétaire de son domaine.'),
        q('Quelle information est obligatoire dans les mentions légales ?', ['L\'identité de l\'éditeur et de l\'hébergeur', 'Le nom de l\'agence qui a créé le site', 'Le nombre de visiteurs et la date de création', 'Le prix payé pour la création du site'], 0, 'La loi impose d\'identifier l\'éditeur et l\'hébergeur.'),
        q('Peut-on déposer des cookies publicitaires sans consentement ?', ['Oui, si le bandeau informe simplement le visiteur', 'Oui, tant que le site est en HTTPS', 'Oui, s\'ils sont déposés par Google lui-même', 'Non, le consentement préalable est requis'], 3, 'Les traceurs non exemptés exigent un consentement préalable.'),
        q('Quel outil gratuit permet un audit rapide performance et accessibilité ?', ['La Search Console de Google', 'Le validateur HTML du W3C', 'Lighthouse, intégré à Chrome', 'Google Analytics 4'], 2, 'Lighthouse donne des scores et des pistes de correction.')
      ],
      script: script('8 min',
        'Un site vitrine en ligne, sur son propre domaine, en HTTPS, conforme. Pas en une semaine : en un après-midi.',
        ['Le brief et l\'Artifact en un seul fichier', 'Mise en ligne par glisser-déposer', 'Domaine, DNS et HTTPS', 'La conformité : mentions, confidentialité, cookies, accessibilité', 'La remise des clés au client'],
        'Mettez en ligne votre site de démonstration et cochez la checklist.',
        'Du fichier téléchargé à l\'adresse en ligne, puis audit Lighthouse en direct.')
    },
    {
      titre: 'Documents et présentations',
      objectifs: ['Faire créer de vrais fichiers Word, Excel, PowerPoint et PDF', 'Imposer une identité visuelle et une structure', 'Contrôler la qualité avant envoi'],
      theorie: `<p>Quand la création de fichiers est activée (dans les paramètres, rubrique des capacités : exécution de code et création de fichiers), Claude peut produire de <strong>vrais fichiers</strong> téléchargeables : documents Word, classeurs Excel avec formules, présentations PowerPoint, PDF. Il écrit et exécute du code dans un environnement isolé pour les fabriquer.</p>
<h2>Ce que vous pouvez livrer</h2>
${tableau(['Fichier', 'Exemples de livrables'], [
  ['Word (.docx)', 'Proposition commerciale, compte rendu, guide d\'utilisation, charte éditoriale'],
  ['Excel (.xlsx)', 'Calendrier éditorial, tableau de suivi des prospects, simulateur de rentabilité avec formules'],
  ['PowerPoint (.pptx)', 'Présentation de rendez-vous, bilan mensuel client, support de formation'],
  ['PDF', 'Guide téléchargeable, fiche produit, rapport final']
])}
<h2>Le brief d'un document réussi</h2>
${code('markdown', `Crée une présentation PowerPoint de 8 diapositives pour le bilan mensuel
de {{client}}.
Identité : fond blanc cassé, titres en bleu nuit #1B2A4A, accent orange #F28C28,
police Arial (compatible partout).
Structure :
1. Titre + mois
2. Les 3 chiffres clés (grand format)
3. Publications du mois (tableau)
4. Meilleure publication (pourquoi elle a marché)
5. Avis clients (2 citations)
6. Ce qui n'a pas marché
7. Plan du mois prochain
8. Contact
Données : fichier joint. Une idée par diapositive, 30 mots maximum par diapositive.
Ajoute des notes de présentation sous chaque diapositive.`)}
<h2>Itérer et finaliser</h2>
<ul>
  <li>Demandez les modifications diapositive par diapositive (« diapositive 4 : remplace le texte par une citation »).</li>
  <li>Pour une identité visuelle exigeante, faites produire la structure et le contenu, puis finalisez dans PowerPoint, Google Slides ou Canva.</li>
  <li>Pour un modèle maison réutilisé souvent (votre proposition commerciale, le bilan mensuel), créez une <strong>skill</strong> qui contient vos règles et votre gabarit (module 4).</li>
</ul>
<h2>Le contrôle qualité</h2>
<ul>
  <li>Ouvrez toujours le fichier dans le logiciel du client (une mise en page peut varier entre outils).</li>
  <li>Vérifiez les chiffres et les formules : recalculez au moins un total à la main.</li>
  <li>Orthographe, noms propres, dates.</li>
  <li>Accessibilité : titres de diapositives renseignés, textes alternatifs des images, contrastes.</li>
</ul>
${encart('info', 'Gain de temps réel', '<p>Un bilan mensuel client qui prenait deux heures peut descendre à vingt minutes de relecture et d\'ajustements. Ce temps gagné, vous le réinvestissez dans la qualité de l\'analyse ou dans un client de plus.</p>')}`,
      pas: [
        pas('Activez la création de fichiers', 'Dans les paramètres de capacités, si ce n\'est pas déjà fait.'),
        pas('Préparez les données', 'Un petit fichier de données réelles ou fictives (chiffres du mois, publications).'),
        pas('Générez une présentation', 'Avec le brief de la leçon, adapté à votre client.'),
        pas('Générez un tableau Excel', 'Un suivi de prospects avec colonnes, listes déroulantes et une formule de taux de réponse.'),
        pas('Contrôlez', 'Ouvrez les fichiers dans les logiciels cibles, recalculez un total, corrigez.')
      ],
      exercice: {
        type: 'texte', titre: 'Brief de document client',
        enonce: '<p>Rédigez le brief d\'un fichier que vous livrerez régulièrement à un client : <strong>type de fichier</strong>, <strong>identité visuelle</strong> (couleurs ou police), <strong>structure</strong> détaillée, <strong>données</strong> utilisées et au moins une <strong>règle de concision</strong>.</p>',
        criteres: [
          mots(70),
          crit('Précise le type de fichier', /(word|docx|excel|xlsx|powerpoint|pptx|pdf|diapositive|classeur)/i),
          crit('Précise une identité visuelle', /(#[0-9a-f]{3,6}|couleur|police|typo|charte)/i),
          crit('Détaille la structure', /(structure|1\.|diapositive 1|section|onglet|colonnes?)/i),
          crit('Fixe une règle de concision', /(maximum|max\.|pas plus de|\d+\s*mots|une idée)/i)
        ],
        solution: '<p>« Fichier : classeur Excel de suivi mensuel des réseaux sociaux pour le restaurant Le Comptoir. Identité : en-têtes vert sapin #1E4D3A, texte blanc, police Calibri. Structure : onglet Publications (date, réseau, format, sujet, vues, interactions, taux d\'engagement calculé par formule) ; onglet Synthèse (totaux du mois, meilleure publication par formule, graphique des vues par semaine) ; onglet Idées (liste déroulante de statut). Données : export CSV joint. Règle : commentaires de synthèse de 3 phrases maximum, une recommandation par ligne. »</p>',
        explication: 'Brief exploitable. Transformez-le en skill au module 4 pour ne plus jamais le réécrire.'
      },
      quiz: [
        q('Comment Claude fabrique-t-il un fichier Excel ?', ['Il convertit sa réponse en tableau, sans exécuter de code', 'Il télécharge un classeur modèle sur internet et le remplit', 'Il écrit et exécute du code dans un environnement isolé', 'Il passe obligatoirement par le connecteur Microsoft 365'], 2, 'La création de fichiers repose sur l\'exécution de code.'),
        q('Que vérifier en priorité dans un classeur généré ?', ['La police et les couleurs', 'Le nom des onglets', 'La largeur des colonnes', 'Les chiffres et les formules'], 3, 'Une formule fausse décrédibilise tout le livrable.'),
        q('Pour un gabarit réutilisé chaque mois, quelle solution ?', ['En faire une skill avec vos règles et votre gabarit', 'Le redécrire en détail dans chaque nouvelle conversation', 'Coller l\'ancien fichier et demander « pareil »', 'Activer la mémoire, qui le reproduira à l\'identique'], 0, 'Les skills (module 4) rendent le livrable constant.'),
        q('Pourquoi ouvrir le fichier dans le logiciel du client ?', ['Pour retirer le filigrane ajouté par Claude', 'La mise en page peut varier selon le logiciel', 'Pour activer les macros, désactivées par défaut', 'Pour que le fichier perde ses métadonnées d\'IA'], 1, 'Vérifiez le rendu là où il sera lu.')
      ],
      script: script('6 min',
        'Votre client reçoit un vrai PowerPoint, à ses couleurs, avec ses chiffres du mois. Vous y avez passé vingt minutes.',
        ['Activer la création de fichiers', 'Les 4 types de fichiers et leurs usages', 'Le brief d\'une présentation, ligne par ligne', 'Itérer et finaliser dans l\'outil natif', 'Le contrôle qualité avant envoi'],
        'Écrivez le brief d\'un document récurrent de votre offre.',
        'Génération d\'une présentation de bilan mensuel, ouverture dans PowerPoint, corrections.')
    },
    {
      titre: 'Analyse de données',
      objectifs: ['Faire analyser un fichier de données de façon fiable', 'Obtenir des graphiques et des recommandations', 'Éviter les pièges classiques des fichiers français'],
      theorie: `<p>Joignez un fichier CSV ou Excel : Claude peut l'examiner, calculer, croiser, produire des graphiques et un rapport, en exécutant du code. C'est un service à forte valeur pour des petites entreprises qui ont des données mais aucun temps pour les lire.</p>
<h2>La méthode en 4 temps</h2>
<ol>
  <li><strong>Décrire avant de calculer</strong> : « Décris les colonnes, le nombre de lignes, la période couverte, et signale les anomalies (valeurs manquantes, doublons, formats incohérents). »</li>
  <li><strong>Valider la compréhension</strong> : corrigez les mauvaises interprétations (une colonne « CA » qui est en fait hors taxes, un code produit).</li>
  <li><strong>Poser les questions métier</strong> : « Quels jours et quelles heures font 50 % du chiffre d'affaires ? Quels produits progressent ? »</li>
  <li><strong>Demander la méthode et les graphiques</strong> : « Explique le calcul, puis fais 3 graphiques lisibles avec titres et unités. »</li>
</ol>
${code('markdown', `<contexte>Caisse d'un salon de thé à Toulouse, export janvier à juin.</contexte>
Étape 1 : décris le fichier et signale les anomalies. Ne calcule rien avant ma validation.
Étape 2 (après validation) : CA par jour de semaine et par tranche horaire,
top 10 produits, évolution mensuelle. Graphiques en barres, titres en français, unités en euros.
Étape 3 : 5 recommandations concrètes, chacune reliée à un chiffre du fichier.`)}
<h2>Les pièges des fichiers français</h2>
<ul>
  <li>Le <strong>séparateur</strong> point-virgule et la <strong>virgule décimale</strong> : précisez-les si les nombres sont mal lus.</li>
  <li>Les <strong>dates</strong> au format JJ/MM/AAAA, parfois confondues avec MM/JJ.</li>
  <li>Les montants <strong>HT ou TTC</strong> : à préciser systématiquement.</li>
  <li>Les lignes de <strong>totaux</strong> en bas d'un export, qui faussent les sommes.</li>
</ul>
<h2>Vérifier</h2>
<p>Recalculez un total à la main ou dans le tableur, comparez avec un chiffre connu du client (le CA du mois qu'il connaît par cœur), et faites préciser la méthode de chaque indicateur. Une analyse fausse présentée avec assurance est pire que pas d'analyse.</p>
${encart('legal', 'Données personnelles', '<p>Un fichier de clients (noms, emails, téléphones, historique d\'achat) contient des données personnelles. Retirez ou pseudonymisez les colonnes inutiles avant l\'analyse, et appliquez votre politique d\'usage des données (module 1, leçon 6, et module 8).</p>')}
<h2>L'offre associée</h2>
<p>« Tableau de bord mensuel » : le client dépose ses exports, vous livrez un rapport de 2 pages avec 3 graphiques et 5 recommandations. Une fois la méthode stabilisée, elle s'automatise (module 5).</p>`,
      pas: [
        pas('Récupérez un export', 'Ventes, réservations, statistiques de réseaux sociaux ou dépenses publicitaires (anonymisé).'),
        pas('Faites décrire le fichier', 'Colonnes, période, anomalies : ne laissez rien calculer avant validation.'),
        pas('Posez 3 questions métier', 'Celles qu\'un gérant se pose vraiment.'),
        pas('Obtenez les graphiques', 'Titres, unités, lisibilité sur mobile.'),
        pas('Vérifiez un chiffre', 'Recalculez un total et comparez avec une donnée connue.')
      ],
      exercice: {
        type: 'qcm', titre: 'Le bon réflexe',
        enonce: '<p>Un fleuriste vous envoie l\'export de sa caisse. Claude annonce un chiffre d\'affaires de janvier deux fois supérieur à ce que le fleuriste a en tête. Quelles sont les causes probables à vérifier ? (plusieurs réponses)</p>',
        multiple: true,
        options: ['Une ligne de total incluse dans les données', 'Le choix du modèle : un modèle récent double parfois les totaux', 'Des montants TTC pris pour du HT, ou l\'inverse', 'Le fleuriste a forcément tort : les calculs de Claude sont exacts', 'Des dates JJ/MM lues comme MM/JJ qui déplacent des ventes'],
        bonne: [0, 2, 4],
        explication: 'Lignes de total, confusion HT/TTC et inversion des dates sont les erreurs les plus fréquentes. On vérifie avant de contredire le client.'
      },
      quiz: [
        q('Première étape de toute analyse ?', ['Produire les graphiques demandés par le client', 'Décrire le fichier et signaler les anomalies', 'Supprimer les lignes incomplètes sans prévenir', 'Calculer directement les moyennes par colonne'], 1, 'On valide la compréhension des données avant de calculer.'),
        q('Dans un CSV français, quel piège concerne les nombres ?', ['Les montants en euros toujours stockés en centimes', 'L\'arrondi automatique de tous les nombres à l\'entier', 'Les nombres négatifs, impossibles à lire en CSV', 'La virgule décimale et le séparateur point-virgule'], 3, 'Précisez les formats si les nombres sont mal interprétés.'),
        q('Comment vérifier une analyse ?', ['Recalculer un total et le comparer à un chiffre connu du client', 'Demander à Claude s\'il est bien sûr de chacun de ses résultats', 'Relancer la même analyse et voir si le résultat change', 'Vérifier que les graphiques sont lisibles et bien titrés'], 0, 'Un contrôle simple évite les erreurs embarrassantes.'),
        q('Un fichier clients contient noms et téléphones inutiles à l\'analyse. Que faire ?', ['Les garder, puisque Claude ne les mémorise pas', 'Les chiffrer dans le fichier avant de l\'envoyer', 'Les retirer ou les pseudonymiser avant l\'analyse', 'Demander l\'accord oral du client, puis les envoyer'], 2, 'Minimisation des données : ne traitez que l\'utile.')
      ],
      script: script('6 min',
        'Votre client a des données qu\'il ne regarde jamais. Vous allez lui montrer, en trois graphiques, où est son argent.',
        ['La méthode en 4 temps', 'Démonstration sur un export de caisse', 'Les pièges des fichiers français', 'Vérifier avant d\'affirmer', 'L\'offre « tableau de bord mensuel »'],
        'Faites l\'exercice, puis analysez un vrai export anonymisé.',
        'Fichier CSV joint, description, validation, graphiques et recommandations en direct.')
    },
    {
      titre: 'Service client assisté',
      objectifs: ['Construire une base de réponses fiable pour un client', 'Rédiger des réponses justes, dans le ton, avec escalade', 'Garder l\'humain dans la boucle et respecter les données'],
      theorie: `<p>Répondre aux emails, messages et avis prend des heures aux petites entreprises. Claude peut rédiger des brouillons excellents, à condition de s'appuyer sur une <strong>base de connaissances fiable</strong> et des <strong>règles claires</strong>.</p>
<h2>1. La base de connaissances</h2>
<ul>
  <li>Une <strong>FAQ</strong> construite à partir des vraies questions : faites analyser 50 emails ou messages récents (anonymisés) pour extraire les 20 questions les plus fréquentes, puis faites valider les réponses par le client.</li>
  <li>Les <strong>politiques</strong> : délais, retours, annulations, garanties, zones de livraison, tarifs.</li>
  <li>Les <strong>informations pratiques</strong> : horaires, accès, contacts.</li>
</ul>
<h2>2. Les règles de réponse</h2>
${code('markdown', `Tu rédiges des brouillons de réponse pour le service client de {{entreprise}}.
Appuie-toi uniquement sur <faq> et <politiques>. Si la réponse n'y figure pas,
écris : « [À COMPLÉTER PAR L'ÉQUIPE] » et explique ce qui manque.
Ton : {{ton}}. Vouvoiement. 120 mots maximum.
Escalade : si le message mentionne un litige, un remboursement, une réclamation
juridique, un problème de santé ou de sécurité, ou un client très mécontent,
commence par « [ESCALADE] » et propose une réponse d'attente courte.
Ne promets jamais un remboursement, un geste commercial ou un délai non prévus par <politiques>.`)}
<h2>3. L'humain dans la boucle</h2>
<p>Au début, <strong>chaque réponse est relue</strong> avant envoi. Notez les corrections : elles enrichissent la FAQ et les règles. Avec le temps, les réponses aux questions simples (horaires, suivi) peuvent être envoyées plus vite, mais les cas d'escalade restent humains.</p>
${tableau(['Type de message', 'Traitement'], [
  ['Question pratique (horaires, accès)', 'Brouillon, relecture rapide, envoi'],
  ['Demande de devis ou de réservation', 'Brouillon + transmission à la personne en charge'],
  ['Réclamation, litige, sujet sensible', 'Escalade : réponse d\'attente, traitement humain'],
  ['Avis en ligne', 'Brouillon de réponse publique, validé par le gérant']
])}
<h2>Transparence et données</h2>
<ul>
  <li>Si un client discute avec un <strong>assistant automatisé</strong> (chatbot), il doit être informé qu'il échange avec une IA, sauf si c'est évident (module 8, AI Act). Pour un brouillon relu et envoyé par un humain, l'enjeu est différent : l'humain reste responsable du message.</li>
  <li>Ne collez que ce qui est nécessaire au traitement ; pseudonymisez quand vous analysez en masse.</li>
</ul>
${encart('ok', 'Ce que vous vendez', '<p>« Service client assisté » : mise en place de la FAQ et des règles (forfait), puis accompagnement mensuel (abonnement). Le module 5 automatise le tri et les brouillons ; le plan 4 construit un chatbot de site.</p>')}`,
      pas: [
        pas('Collectez 30 messages', 'Emails ou messages d\'un client (ou inventés de façon réaliste), anonymisés.'),
        pas('Extrayez la FAQ', 'Faites lister les questions fréquentes et leur fréquence ; rédigez les réponses avec le client.'),
        pas('Écrivez les règles', 'Ton, longueur, escalade, interdits : adaptez le modèle de la leçon.'),
        pas('Testez sur 10 messages', 'Dont au moins 3 cas d\'escalade. Notez les erreurs.'),
        pas('Corrigez la base', 'Chaque erreur devient une ligne de FAQ ou une règle.')
      ],
      exercice: {
        type: 'texte', titre: 'Les règles d\'escalade',
        enonce: '<p>Pour un client de votre choix, rédigez ses <strong>règles d\'escalade</strong> : au moins <strong>trois situations</strong> qui doivent être traitées par un humain, la <strong>réponse d\'attente</strong> type, et ce que l\'assistant ne doit <strong>jamais promettre</strong>.</p>',
        criteres: [
          mots(60),
          crit('Liste au moins trois situations', /(litige|rembours|réclamation|santé|sécurité|allerg|juridique|menace|mécontent|accident|annulation)[\s\S]*(litige|rembours|réclamation|santé|sécurité|allerg|juridique|menace|mécontent|accident|annulation)[\s\S]*(litige|rembours|réclamation|santé|sécurité|allerg|juridique|menace|mécontent|accident|annulation)/i),
          crit('Propose une réponse d\'attente', /(attente|nous revenons|nous vous recontactons|nous reviendrons|sous \d+|dans les \d+)/i),
          crit('Fixe ce qui ne doit jamais être promis', /(jamais|ne (doit|promet)|interdit|aucun(e)? promesse)/i)
        ],
        solution: '<p>« Escalade obligatoire pour : (1) toute mention d\'allergie ou de problème de santé après un repas ; (2) toute demande de remboursement ou contestation de facture ; (3) un client qui menace de laisser un avis négatif ou d\'aller en justice ; (4) toute réservation de groupe de plus de 15 personnes. Réponse d\'attente : « Merci pour votre message. Je transmets immédiatement à Julien, le gérant, qui vous recontacte personnellement dans les 24 heures. » L\'assistant ne promet jamais de remboursement, de geste commercial, de table ou de délai qui ne figure pas dans les politiques. »</p>',
        explication: 'Règles d\'escalade claires : elles protègent votre client et votre responsabilité.'
      },
      quiz: [
        q('Sur quoi les brouillons doivent-ils s\'appuyer ?', ['Sur les connaissances générales du modèle', 'Sur les réponses publiées par les concurrents', 'Uniquement sur la FAQ et les politiques validées', 'Sur une recherche web lancée à chaque message'], 2, 'Une base validée évite les promesses inventées.'),
        q('Que faire si la réponse ne figure pas dans la base ?', ['Signaler l\'information manquante à l\'équipe', 'Rédiger la réponse la plus plausible possible', 'Renvoyer le client vers la page d\'accueil', 'Chercher la réponse sur le site d\'un concurrent'], 0, 'Le repère [À COMPLÉTER] évite les erreurs et enrichit la FAQ.'),
        q('Un client mentionne une allergie après un repas. Traitement ?', ['Réponse automatique d\'excuse et bon de réduction', 'Brouillon standard validé plus tard dans la semaine', 'Classement en avis négatif, sans réponse', 'Escalade vers un humain avec réponse d\'attente'], 3, 'Santé et sécurité sont toujours traitées par un humain.'),
        q('Un visiteur discute avec un chatbot. Que doit-il savoir ?', ['Le nom exact du modèle et de son éditeur', 'Qu\'il échange avec une IA, sauf si c\'est évident', 'Rien, tant que les réponses sont exactes', 'Que ses messages servent à entraîner le modèle'], 1, 'C\'est une obligation de transparence de l\'AI Act.')
      ],
      script: script('7 min',
        'Le chatbot qui promet un remboursement que le patron n\'a jamais accordé : voilà comment perdre un client en une phrase. Voici comment l\'éviter.',
        ['Construire la FAQ à partir des vrais messages', 'Les règles : sources, ton, longueur, escalade, interdits', 'L\'humain dans la boucle', 'Transparence et données', 'L\'offre service client assisté'],
        'Écrivez les règles d\'escalade de votre premier client.',
        'Traitement de 5 messages réels anonymisés, dont un cas d\'escalade.')
    },
    {
      titre: 'Transformer une compétence en livrable vendable',
      objectifs: ['Packager une prestation en offre claire', 'Documenter un process reproductible', 'Préparer le questionnaire d\'accueil et la checklist qualité'],
      theorie: `<p>Savoir faire n'est pas vendre. Un client n'achète pas « de l'aide avec l'IA » ; il achète un <strong>résultat défini</strong>, dans un <strong>délai</strong>, pour un <strong>prix</strong>. C'est ce qu'on appelle une prestation packagée : le même livrable, livré de la même façon, à des clients similaires.</p>
<h2>La fiche d'une prestation packagée</h2>
${tableau(['Élément', 'Exemple : « Pack vidéos commerce »'], [
  ['Nom', 'Pack 8 vidéos courtes'],
  ['Résultat', 'Un mois de contenus vidéo prêts à publier sur Instagram et TikTok'],
  ['Pour qui', 'Restaurants et commerces de bouche indépendants'],
  ['Inclus', '1 demi-journée de tournage ou les rushs du client, 8 vidéos de 20 à 45 secondes, sous-titres, 8 légendes'],
  ['Non inclus', 'Publicité payante, gestion des commentaires'],
  ['Délai', '10 jours ouvrés après réception des rushs'],
  ['Process', 'Questionnaire, scripts validés, montage, une série de retouches, livraison'],
  ['Prix', 'Forfait affiché (méthode de calcul au module 7)']
])}
<h2>Le process documenté</h2>
<p>Écrivez votre process comme une recette que quelqu'un d'autre pourrait suivre : étapes, prompts utilisés, outils, durée de chaque étape, points de validation client. Trois bénéfices : vous livrez une qualité constante, vous savez combien de temps vous y passez (donc si votre prix tient), et vous pourrez un jour déléguer.</p>
<h2>Le questionnaire d'accueil</h2>
<p>Avant de produire, récoltez tout ce qu'il faut en une fois :</p>
${code('markdown', `Questionnaire d'accueil — {{prestation}}
1. Votre activité en deux phrases, vos clients types.
2. Ce qui vous différencie (3 éléments concrets).
3. Exemples de contenus que vous aimez (liens) et que vous n'aimez pas.
4. Mots, sujets ou promesses à éviter.
5. Informations obligatoires (horaires, adresse, mentions, prix).
6. Qui valide les livrables, et sous quel délai.
7. Accès nécessaires (comptes, fichiers, photos).`)}
<p>Faites générer la première version par Claude à partir de votre fiche de prestation, puis réutilisez-la (Google Forms, Tally, ou simple document).</p>
<h2>La checklist qualité</h2>
<p>Pour chaque prestation, 5 à 10 points vérifiés avant chaque livraison : orthographe et noms propres, faits et prix vérifiés, ton conforme, format et dimensions, mentions obligatoires, droits sur les images et musiques, accord pour la publication. C'est votre assurance contre les erreurs, et un argument commercial.</p>
${encart('ok', 'Cinq prestations à fort potentiel avec ce module', '<ul><li>Pack visibilité locale (articles + fiche Google)</li><li>Site vitrine express (une à cinq pages)</li><li>Réponses aux avis et service client assisté</li><li>Bilan mensuel et tableau de bord</li><li>Kit commercial (proposition, présentation, emails types)</li></ul>')}`,
      pas: [
        pas('Choisissez une prestation', 'Celle qui correspond à votre offre de la semaine 2 du plan.'),
        pas('Remplissez la fiche', 'Les 8 éléments du tableau, sans le prix pour l\'instant.'),
        pas('Écrivez le process', 'Étapes, prompts, outils, durées estimées, validations.'),
        pas('Créez le questionnaire d\'accueil', 'Faites-le générer puis adaptez-le ; mettez-le en ligne (formulaire).'),
        pas('Écrivez la checklist qualité', '5 à 10 points, à cocher avant chaque livraison.')
      ],
      exercice: {
        type: 'texte', titre: 'Votre fiche de prestation',
        enonce: '<p>Rédigez la fiche de votre prestation principale : <strong>nom</strong>, <strong>résultat</strong> pour le client, <strong>pour qui</strong>, <strong>inclus</strong>, <strong>non inclus</strong>, <strong>délai</strong> et <strong>process</strong> en étapes.</p>',
        criteres: [
          mots(80),
          crit('Indique ce qui est inclus', /inclu/i),
          crit('Indique ce qui n\'est pas inclus', /(non inclu|pas inclu|hors|n'inclut pas|exclu)/i),
          crit('Précise un délai', /(\d+\s*(jours?|semaines?|h\b|heures?)|délai)/i),
          crit('Décrit un process en étapes', /(process|étapes?|1\.|puis|ensuite)/i)
        ],
        solution: '<p>« Nom : Site vitrine express. Résultat : un site d\'une page, rapide et conforme, en ligne sur le domaine du client, qui génère des appels. Pour qui : artisans et thérapeutes indépendants sans site. Inclus : questionnaire, rédaction des textes, design responsive, mise en ligne, nom de domaine la première année, formulaire de contact, mentions légales, une série de modifications. Non inclus : photos professionnelles, référencement payant, boutique en ligne. Délai : 7 jours ouvrés après réception du questionnaire complet. Process : 1. questionnaire ; 2. structure validée ; 3. textes et maquette ; 4. retours du client ; 5. mise en ligne et contrôle ; 6. remise des accès et page d\'aide. »</p>',
        explication: 'Prestation packagée. Le module 7 vous aidera à fixer son prix et à la vendre.'
      },
      quiz: [
        q('Qu\'achète un client ?', ['Un résultat défini, dans un délai, pour un prix', 'Un nombre d\'heures de travail avec l\'IA', 'L\'accès à vos prompts et à vos outils', 'Un abonnement à Claude configuré pour lui'], 0, 'Le packaging transforme une compétence en offre lisible.'),
        q('Pourquoi préciser ce qui n\'est pas inclus ?', ['Pour justifier un prix plus élevé que la concurrence', 'Parce que la loi impose une liste d\'exclusions', 'Pour éviter les malentendus et le travail non payé', 'Pour pouvoir facturer des options dès la signature'], 2, 'Les exclusions protègent la relation et votre rentabilité.'),
        q('À quoi sert le process documenté ?', ['À remplacer le contrat signé avec le client', 'Qualité constante, temps maîtrisé, délégation possible', 'À prouver au client que vous utilisez bien l\'IA', 'À fixer le prix, calculé d\'après le nombre d\'étapes'], 1, 'Il rend la prestation reproductible et rentable.'),
        q('Quand envoyer le questionnaire d\'accueil ?', ['Après la première version, pour l\'ajuster', 'Au moment de la livraison, pour l\'avis client', 'À mi-parcours, quand les questions apparaissent', 'Avant de produire, pour tout récolter en une fois'], 3, 'Il évite les allers-retours et les oublis.')
      ],
      script: script('6 min',
        '« Je fais des trucs avec l\'IA » ne se vend pas. « 8 vidéos prêtes à publier en 10 jours » se vend. Voici comment passer de l\'un à l\'autre.',
        ['La fiche de prestation en 8 éléments', 'Le process documenté', 'Le questionnaire d\'accueil', 'La checklist qualité', 'Cinq prestations à fort potentiel'],
        'Remplissez la fiche de votre prestation principale ; vous fixerez son prix au module 7.',
        'Fiche de prestation remplie en direct, puis génération du questionnaire d\'accueil.')
    }
  ]
};
