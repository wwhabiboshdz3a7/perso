import { encart, tableau, pas, q, crit, mots, script } from './_outils.js';

export default {
  intro: `<p>Ce module court pose les règles du jeu : comment la formation est construite, comment valider vos leçons, de quoi vous avez besoin, et surtout <strong>le plan d'action de 30 jours</strong> qui transforme ce que vous apprenez en résultats concrets : une offre, des réalisations à montrer et vos premiers échanges avec des clients.</p>`,
  lecons: [
    {
      titre: 'Comment suivre la formation',
      objectifs: [
        'Comprendre la structure des 9 modules et ce que vous saurez faire à la fin',
        'Organiser votre semaine pour avancer sans vous disperser',
        'Préparer votre carnet de bord et votre point de départ'
      ],
      theorie: `<p>Cette formation a un objectif simple : vous apprendre à utiliser Claude à un niveau professionnel <strong>et</strong> à transformer cette compétence en prestations que des clients paient. On ne collectionne pas des astuces : chaque module se termine par quelque chose que vous pouvez livrer ou vendre.</p>
<h2>Les trois étages de la formation</h2>
${tableau(['Étage', 'Modules', 'Ce que vous saurez faire'], [
  ['Maîtriser', 'M1 Claude de zéro · M2 Prompting · M3 Produire', 'Obtenir des livrables de qualité professionnelle : textes, pages web, documents, analyses, réponses clients.'],
  ['Automatiser', 'M4 Claude Code · M5 API et automatisations · M6 Vidéo IA', 'Construire des outils, des sites et des chaînes automatiques qui travaillent sans vous : prospects qualifiés, devis, avis, vidéos.'],
  ['Vendre', 'M7 Vendre · M8 Business et légal', 'Choisir une offre, fixer un prix, prospecter, signer, facturer et rester dans les clous (TVA, RGPD, AI Act).']
])}
<h2>Comment est construite chaque leçon</h2>
<ul>
  <li><strong>Théorie</strong> : l'essentiel, à jour, avec les pièges qu'on rencontre réellement en mission.</li>
  <li><strong>Pas-à-pas</strong> : les étapes à suivre <em>pendant</em> la lecture, sur votre propre projet.</li>
  <li><strong>Exercice ou checklist</strong> : vous produisez quelque chose. Les réponses rédigées sont vérifiées selon des critères affichés sous la zone de saisie.</li>
  <li><strong>Quiz</strong> : trois ou quatre questions pour ancrer les notions clés, avec l'explication de chaque réponse.</li>
  <li><strong>Script vidéo</strong> : le résumé de la leçon sous forme de script (accroche, plan, appel à l'action). Utile pour réviser, et c'est aussi un modèle pour vos propres vidéos.</li>
</ul>
<p>Une leçon se valide <strong>automatiquement</strong> quand l'exercice est réussi et que le quiz obtient au moins la moitié de bonnes réponses. Vous pouvez aussi la marquer comme terminée à la main pour suivre votre avancée ; le certificat d'un module, lui, demande que tous ses exercices et quiz soient réussis. La formation complète donne droit à un certificat de fin de formation.</p>
<h2>Le rythme qui fonctionne</h2>
<p>La régularité bat l'intensité. Le format conseillé : <strong>45 minutes par jour, 5 jours par semaine</strong>, pendant 30 jours (le plan est détaillé dans la leçon suivante). Une séance type :</p>
<ol>
  <li>15 minutes de lecture de la leçon ;</li>
  <li>20 minutes de pas-à-pas sur votre projet réel ;</li>
  <li>10 minutes d'exercice et de quiz, puis une ligne dans votre carnet de bord.</li>
</ol>
<p>À partir de la semaine 4, ajoutez une heure par jour de prospection : c'est elle qui produit les premiers clients, pas la lecture.</p>
<h2>Ce dont vous avez besoin</h2>
${tableau(['Besoin', 'Minimum', 'Recommandé'], [
  ['Ordinateur', 'Un ordinateur récent et un navigateur à jour', 'Un second écran pour suivre la leçon et pratiquer en même temps'],
  ['Claude', 'Un compte gratuit pour les modules 0 et 1', 'Une offre payante (Pro) dès le module 2 : plus d\'usage, tous les modèles, Claude Code'],
  ['Outils vidéo (M6)', 'Les offres gratuites ou d\'essai pour tester', 'Un abonnement d\'entrée de gamme à un outil de voix et à un outil de génération vidéo, une fois votre offre validée'],
  ['Automatisation (M5)', 'n8n en version d\'essai ou Make en offre gratuite', 'n8n auto-hébergé ou un abonnement cloud quand vous livrez des clients']
])}
<p>Les tarifs des outils changent souvent : vérifiez toujours la page de prix officielle avant de vous abonner, et n'achetez un outil que lorsqu'une leçon ou un client le justifie.</p>
${encart('warn', 'Ce que cette formation ne promet pas', '<p>Aucun revenu n\'est garanti. Les résultats dépendent de votre point de départ, du temps investi, de votre marché et surtout de votre prospection. Ce que la formation vous donne : une méthode, des outils, des modèles et des automatisations prêtes à adapter. Le reste, c\'est de l\'exécution.</p>')}
<h2>Votre carnet de bord</h2>
<p>Créez un document unique (Google Docs, Notion ou un simple fichier texte) intitulé « Carnet de bord ». Vous y noterez chaque jour : la leçon faite, ce que vous avez produit, une idée d'offre ou de prospect. Au module 1, vous créerez aussi un <strong>Projet Claude « Mon activité »</strong> qui servira de mémoire à votre assistant pendant toute la formation.</p>
${encart('info', 'La règle d\'or', '<p>Une leçon = une action concrète. Si vous terminez une leçon sans avoir rien produit, refaites le pas-à-pas.</p>')}`,
      pas: [
        pas('Indiquez votre nom', 'Ouvrez <a href="#/profil">Mon profil</a> et saisissez le nom qui figurera sur vos certificats.'),
        pas('Bloquez vos créneaux', 'Ajoutez dans votre agenda 5 créneaux de 45 minutes par semaine pour les 4 prochaines semaines. Traitez-les comme des rendez-vous client.'),
        pas('Créez votre carnet de bord', 'Un document avec trois colonnes : date, ce que j\'ai produit, idée d\'offre ou de prospect.'),
        pas('Créez ou ouvrez votre compte Claude', 'Sur claude.ai ou dans l\'application de bureau. Le compte gratuit suffit pour les modules 0 et 1.'),
        pas('Fixez votre point de départ', 'Remplissez l\'exercice ci-dessous : il servira de référence dans 30 jours.')
      ],
      exercice: {
        type: 'texte', titre: 'Votre point de départ',
        enonce: `<p>Décrivez en quelques lignes : vos compétences actuelles (même hors du digital), le <strong>nombre d'heures</strong> que vous pouvez consacrer par semaine, une <strong>cible</strong> de clients qui vous attire (un métier, un secteur, un type d'entreprise) et votre <strong>objectif à 30 jours</strong> formulé de façon mesurable (par exemple : « 3 réalisations dans mon portfolio et 30 prospects contactés »).</p>`,
        placeholder: 'Je sais… Je peux consacrer… heures par semaine. Je veux travailler avec… Dans 30 jours, je veux…',
        criteres: [
          mots(60),
          crit('Indique un temps disponible (heures par semaine)', /\d+\s*(h|heures?)\b/i),
          crit('Nomme une cible de clients', /(client|commer|artisan|restaur|coach|agence|entreprise|PME|TPE|indépendant|freelance|secteur|métier|boutique|cabinet|salon|garage|immobili)/i),
          crit('Fixe un objectif chiffré à 30 jours', /\d+.{0,40}(prospect|client|réalisation|projet|vidéo|devis|rendez-vous|appel|proposition|portfolio)/i)
        ],
        solution: '<p>« Je suis vendeuse en boutique depuis 6 ans, à l\'aise avec les réseaux sociaux et la relation client. Je peux consacrer 8 heures par semaine à la formation, le soir et le samedi matin. Je veux travailler avec les commerces indépendants de mon quartier : fleuristes, boulangeries, salons de coiffure. Dans 30 jours, je veux avoir 3 réalisations dans mon portfolio (un pack de posts, une page de présentation, une série de 3 vidéos courtes) et avoir contacté 30 commerçants. »</p>',
        explication: 'Point de départ enregistré. Recopiez-le dans votre carnet de bord : vous le relirez au jour 30.'
      },
      quiz: [
        q('Quand une leçon est-elle validée automatiquement ?', ['Dès que vous avez lu la théorie jusqu\'au bout', 'Quand l\'exercice et le quiz sont réussis', 'Quand vous avez ouvert le script vidéo', 'Seulement quand le formateur la corrige'], 1, 'La validation automatique demande l\'exercice (ou la checklist) réussi et au moins la moitié de bonnes réponses au quiz. Vous pouvez aussi marquer la leçon comme terminée vous-même.'),
        q('Quel rythme la formation recommande-t-elle ?', ['Tout le programme d\'un coup, en un week-end', 'Deux heures le dimanche, sans pratique entre', 'Une leçon dès que vous avez un client', '45 minutes par jour, 5 jours par semaine'], 3, 'La régularité ancre les compétences et laisse le temps de pratiquer sur un vrai projet.'),
        q('Qu\'est-ce qui produit vos premiers clients ?', ['La prospection régulière à partir de la semaine 4', 'Terminer tous les modules avant d\'en parler', 'Un portfolio parfait avant le premier contact', 'Des publicités payantes dès le premier jour'], 0, 'Les compétences sont nécessaires, mais ce sont les prises de contact qui créent les opportunités.'),
        q('Que garantit la formation ?', ['Un premier client trouvé dans les 30 jours', 'Un revenu minimum si vous suivez tout le plan', 'Une méthode et des outils, sans garantie de résultat', 'Un remboursement si vous ne signez aucun client'], 2, 'Aucun revenu n\'est garanti : les résultats dépendent de votre travail et de votre marché.')
      ],
      script: script('4 min',
        'Vous n\'avez pas besoin de connaître tous les outils d\'IA. Vous avez besoin d\'en maîtriser un, et de savoir le vendre.',
        ['Présentation : qui je suis, pourquoi cette formation', 'Les trois étages : maîtriser, automatiser, vendre', 'La structure d\'une leçon et la validation automatique', 'Le rythme de 45 minutes par jour et le carnet de bord', 'Ce que la formation ne promet pas, et pourquoi'],
        'Ouvrez votre profil, indiquez votre nom, et remplissez l\'exercice « point de départ » avant de passer à la leçon suivante.',
        'Vue du tableau de bord, puis d\'une leçon type en défilant : théorie, pas-à-pas, exercice, quiz, script.')
    },
    {
      titre: 'Votre plan d\'action 30 jours',
      objectifs: [
        'Connaître le programme semaine par semaine',
        'Savoir quels indicateurs suivre pour mesurer vos progrès',
        'Préparer la semaine 1 dans votre agenda'
      ],
      theorie: `<p>Le plan suivant suppose environ 45 minutes par jour en semaines 1 à 3, puis 1 h 30 en semaine 4 (formation + prospection). Si vous avez moins de temps, étalez-le sur 6 semaines : l'ordre compte plus que la vitesse.</p>
<h2>Semaine 1 — Maîtriser (jours 1 à 7)</h2>
<ul>
  <li>Modules 1 et 2 : comptes, Projets, Artifacts, recherche, choix du modèle, puis prompting professionnel.</li>
  <li>Livrable : votre Projet Claude « Mon activité » configuré, et trois prompts personnels testés qui vous font gagner du temps cette semaine (un email, un résumé, un plan).</li>
</ul>
<h2>Semaine 2 — Produire et choisir (jours 8 à 14)</h2>
<ul>
  <li>Module 3 (produire) puis les deux premières leçons du module 7 (choisir son offre, fixer ses prix).</li>
  <li>Livrable : <strong>une offre, une cible, un prix</strong>, écrits en une phrase. Exemple : « Je crée chaque mois 8 vidéos courtes pour les restaurants indépendants de Toulouse, 490 € HT par mois. »</li>
</ul>
<h2>Semaine 3 — Automatiser et prouver (jours 15 à 21)</h2>
<ul>
  <li>Selon votre offre : module 4 (Claude Code, sites et outils), module 5 (automatisations n8n) ou module 6 (vidéo). Ces trois modules font partie de l'offre Pro.</li>
  <li>Livrable : <strong>2 ou 3 réalisations de démonstration</strong> pour votre portfolio. Pour un vrai commerce, demandez son accord avant de publier ; sinon, présentez clairement la réalisation comme un exemple fictif.</li>
</ul>
<h2>Semaine 4 — Vendre (jours 22 à 30)</h2>
<ul>
  <li>Modules 7 (prospection, propositions, contrats, acquisition) et 8 (statut, facturation, RGPD, AI Act).</li>
  <li>Livrables : une liste de 50 prospects qualifiés, 20 à 30 prises de contact personnalisées, un modèle de proposition commerciale et un modèle de devis prêts à l'emploi.</li>
</ul>
<h2>Les indicateurs à suivre</h2>
${tableau(['Indicateur', 'Ce qu\'il mesure', 'Comment l\'améliorer'], [
  ['Leçons validées', 'Votre régularité', 'Créneaux fixes dans l\'agenda'],
  ['Réalisations publiées', 'Votre crédibilité', 'Une démo par semaine, même petite'],
  ['Prises de contact', 'Votre effort commercial', 'Un bloc quotidien, sans exception'],
  ['Taux de réponse', 'La pertinence de votre message', 'Personnaliser, raccourcir, montrer une démo'],
  ['Rendez-vous et propositions', 'L\'intérêt réel du marché', 'Qualifier avant d\'envoyer une proposition']
])}
<p>Notez ces chiffres chaque vendredi dans votre carnet de bord. Au bout de 30 jours, vous saurez précisément où se situe votre blocage : compétence, offre, message ou volume.</p>
${encart('info', 'Si vous n\'avez que l\'offre Essentiel', '<p>Suivez le même plan : en semaine 3, construisez vos démonstrations avec les modules 2 et 3 (rédaction, pages web en Artifacts, documents). Les automatisations et la vidéo pourront venir ensuite.</p>')}
${encart('warn', 'Le piège n°1', '<p>Rester en mode « j\'apprends encore » au lieu de contacter des clients. À partir du jour 22, la prospection passe avant la lecture : vous apprendrez beaucoup plus vite avec de vraies objections.</p>')}`,
      pas: [
        pas('Ouvrez votre agenda', 'Placez les 4 semaines du plan sur les 30 prochains jours, avec les jalons du vendredi.'),
        pas('Préparez la semaine 1', 'Notez les leçons du module 1 sur vos 5 premiers créneaux.'),
        pas('Créez votre tableau d\'indicateurs', 'Dans votre carnet de bord : une ligne par semaine, une colonne par indicateur.'),
        pas('Choisissez votre « jour du bilan »', 'Le vendredi par exemple : 15 minutes pour relever vos indicateurs et ajuster.'),
        pas('Cochez la checklist ci-dessous', 'Elle vous servira de feuille de route : revenez la cocher au fil des semaines.')
      ],
      exercice: {
        type: 'checklist', titre: 'Feuille de route 30 jours',
        enonce: '<p>Cochez chaque jalon au fur et à mesure. La leçon se valide quand tout est coché : vous pouvez revenir ici pendant le mois, ou valider la leçon manuellement en attendant.</p>',
        items: [
          'Créneaux de travail bloqués pour 4 semaines',
          'Carnet de bord et tableau d\'indicateurs créés',
          'Semaine 1 : Projet Claude « Mon activité » configuré',
          'Semaine 1 : trois prompts personnels testés et enregistrés',
          'Semaine 2 : une offre, une cible, un prix, écrits en une phrase',
          'Semaine 3 : deux réalisations de démonstration terminées',
          'Semaine 4 : liste de 50 prospects qualifiés',
          'Semaine 4 : 20 prises de contact personnalisées envoyées',
          'Jour 30 : bilan écrit et plan des 30 jours suivants'
        ],
        explication: 'Feuille de route complète. Faites votre bilan et fixez le prochain cycle de 30 jours.'
      },
      quiz: [
        q('Quel est le livrable de la semaine 2 ?', ['Un site vitrine complet, en ligne et indexé', 'Une liste de 100 prospects déjà contactés', 'Une offre, une cible et un prix en une phrase', 'Un compte TikTok avec dix vidéos publiées'], 2, 'Une offre claire est la base de tout le reste : démonstrations, prospection, prix.'),
        q('Comment présenter une réalisation faite pour un commerce sans son accord ?', ['Comme un exemple fictif, clairement indiqué', 'Comme une mission réelle, sans citer le nom', 'Avec son logo, puisque le travail est à vous', 'Comme un projet en cours de négociation'], 0, 'Présenter une démo comme une vraie mission serait trompeur. Indiquez « exemple » ou demandez l\'accord du commerce.'),
        q('Que faire à partir du jour 22 si vous n\'avez pas fini tous les modules ?', ['Repousser la prospection d\'une à deux semaines', 'Reprendre le module 1 pour bien consolider', 'Finir d\'abord le module vidéo, le plus vendeur', 'Prospecter quand même, la lecture passe après'], 3, 'Les vrais échanges avec des prospects font progresser plus vite que la lecture.'),
        q('Pourquoi relever ses indicateurs chaque semaine ?', ['Pour les publier comme preuve sur LinkedIn', 'Pour repérer à quelle étape vous bloquez', 'Pour débloquer les modules suivants', 'Pour calculer votre chiffre d\'affaires fiscal'], 1, 'Les chiffres montrent si le problème vient de la compétence, de l\'offre, du message ou du volume.')
      ],
      script: script('5 min',
        'Dans 30 jours, vous pouvez avoir une offre, des réalisations à montrer et vos premiers rendez-vous. Voici le plan, semaine par semaine.',
        ['Semaine 1 : maîtriser Claude et le prompting', 'Semaine 2 : produire et choisir une offre, une cible, un prix', 'Semaine 3 : automatiser et construire 2 ou 3 démonstrations', 'Semaine 4 : prospecter, proposer, se mettre en règle', 'Les 5 indicateurs à suivre chaque vendredi'],
        'Placez le plan dans votre agenda maintenant, puis commencez le module 1.',
        'Calendrier de 30 jours affiché à l\'écran, avec les jalons coloriés semaine par semaine.')
    }
  ]
};
