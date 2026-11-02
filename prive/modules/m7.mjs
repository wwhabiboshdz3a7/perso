import { code, encart, tableau, pas, q, crit, mots, script } from './_outils.mjs';

const L01 = {
  titre: 'Choisir son offre',
  objectifs: ['Comparer six façons de vendre ce que vous savez faire avec Claude', 'Formuler une offre précise : pour qui, quoi, quel résultat', 'Transformer une compétence en « service produit » au périmètre fixe'],
  theorie: `<p>Savoir utiliser Claude n'est pas une offre. Une offre, c'est un <strong>problème précis</strong> d'un <strong>client précis</strong>, résolu avec un <strong>livrable précis</strong>, à un <strong>prix connu</strong>. Les clients n'achètent pas de l'IA : ils achètent des réponses aux avis faites chaque matin, un site en ligne en dix jours, huit vidéos par mois.</p>
<h2>Six modèles</h2>
${tableau(['Modèle', 'Exemple', 'Premier euro', 'Ce qui limite'], [
  ['Agence IA (services réalisés pour le client)', 'Mise en place d\'automatisations n8n, chatbot, réponses aux avis', 'Rapide', 'Votre temps ; il faut structurer pour grandir'],
  ['Freelance en mission', 'Rédaction, SEO, sites, vidéos, à la mission ou au jour', 'Très rapide', 'Le temps facturable'],
  ['Création de contenus', 'Abonnement mensuel de vidéos ou de publications', 'Rapide', 'La régularité de production'],
  ['Produits numériques', 'Modèles, packs de prompts, workflows, guides', 'Lent (audience nécessaire)', 'L\'audience et la confiance'],
  ['Formation', 'Ateliers en entreprise, formation en ligne', 'Moyen', 'La crédibilité, la preuve'],
  ['Micro-SaaS', 'Petit outil en ligne par abonnement, construit avec Claude Code', 'Lent', 'Produit, support, acquisition']
])}
<p>Pour démarrer, les trois premiers modèles rapportent le plus vite : ils ne demandent pas d'audience, seulement des clients. Les trois derniers se construisent ensuite, à partir de ce que vous avez appris en livrant.</p>
<h2>La phrase d'offre</h2>
${code('text', `J'aide [qui, précisément] à [résultat concret et mesurable]
grâce à [livrable], en [délai], pour [prix ou fourchette].

Exemple : J'aide les restaurants de Toulouse à répondre à tous leurs avis Google
chaque matin, grâce à une automatisation validée par le gérant, mise en place en 5 jours,
pour 390 € de mise en place puis 59 € par mois.`)}
<h2>Le « service produit »</h2>
<p>Au lieu de devis sur mesure à chaque fois, vendez un <strong>service au périmètre fixe</strong> : même livrable, même délai, même prix, mêmes étapes. Avantages : vous vendez plus vite (le client comprend), vous livrez plus vite (vous répétez), et vous pouvez automatiser votre propre production.</p>
<ul>
  <li><strong>Périmètre</strong> : ce qui est inclus, et surtout ce qui ne l'est pas.</li>
  <li><strong>Étapes</strong> : appel de cadrage, livraison, une série de corrections, mise en ligne.</li>
  <li><strong>Options</strong> : deux ou trois ajouts tarifés (une langue de plus, une page de plus, un réseau de plus).</li>
</ul>
<h2>Choisir sa niche</h2>
<p>Croisez <strong>ce que vous connaissez</strong> (un secteur, un métier, une ville), <strong>ce qui se vend</strong> (un problème coûteux et fréquent) et <strong>ce que Claude fait bien</strong> (texte, code, analyse, automatisation). Une niche n'est pas une prison : c'est ce qui rend votre message clair pendant les six premiers mois.</p>
${encart('info', 'Le test des trois conversations', '<p>Avant de construire quoi que ce soit, présentez votre phrase d\'offre à trois clients potentiels. Si personne ne demande « combien ? » ou « comment ça marche ? », reformulez ou changez de cible.</p>')}`,
  pas: [
    pas('Listez vos atouts', 'Secteurs connus, compétences, réseau, ville. Demandez à Claude de croiser cette liste avec les modèles ci-dessus.'),
    pas('Choisissez un modèle et une cible', 'Un seul de chaque pour les trois prochains mois.'),
    pas('Rédigez la phrase d\'offre', 'Avec le gabarit, puis faites-la critiquer par Claude du point de vue d\'un client sceptique.'),
    pas('Fixez le périmètre', 'Inclus, exclus, étapes, délai, options.'),
    pas('Faites le test des trois conversations', 'Notez les questions posées : elles nourriront votre page et votre FAQ.')
  ],
  exercice: {
    type: 'texte', titre: 'Votre phrase d\'offre',
    enonce: '<p>Rédigez votre phrase d\'offre complète : la <strong>cible</strong> précise, le <strong>résultat</strong>, le <strong>livrable</strong>, le <strong>délai</strong> et le <strong>prix</strong>.</p>',
    placeholder: 'J\'aide … à … grâce à …, en …, pour …',
    criteres: [
      mots(25),
      crit('Nomme une cible', /j'aide|pour les|destin[ée]|aux? (restaurants?|artisans?|commer|agences?|ind[ée]pendants?|tpe|pme)/i),
      crit('Annonce un délai', /\d+\s*(jours?|semaines?|h|heures?|mois)\b/i),
      crit('Indique un prix', /\d+\s*(€|euros?)|prix|tarif/i),
      crit('Décrit un livrable', /gr[aâ]ce [àa]|avec|via|livr|automatisation|site|vid[ée]os?|chatbot/i)
    ],
    solution: '<p>« J\'aide les artisans du bâtiment de Haute-Garonne à transformer leurs demandes de devis en devis brouillons prêts à envoyer en moins d\'une heure, grâce à une automatisation connectée à leur formulaire et à leur grille tarifaire, installée en une semaine, pour 690 € HT puis 49 € HT par mois. »</p>',
    explication: 'Offre claire : un client comprend immédiatement s\'il est concerné.'
  },
  quiz: [
    q('Quels modèles rapportent le plus vite au démarrage ?', ['Micro-SaaS et produits numériques', 'Agence, freelance et création de contenus', 'Formation en ligne uniquement', 'Aucun'], 1, 'Ils ne demandent pas d\'audience, seulement des clients.'),
    q('Qu\'est-ce qu\'un « service produit » ?', ['Un logiciel', 'Un service au périmètre, délai et prix fixes', 'Un service gratuit', 'Un abonnement à Claude'], 1, 'Même livrable, même délai, même prix.'),
    q('Que vendez-vous vraiment à un restaurant ?', ['De l\'intelligence artificielle', 'Un résultat concret : des avis répondus chaque matin', 'Des jetons d\'API', 'Un abonnement Claude'], 1, 'Le client achète un résultat, pas une technologie.'),
    q('Personne ne pose de question après votre présentation. Que faire ?', ['Baisser le prix', 'Reformuler l\'offre ou changer de cible', 'Ajouter des fonctionnalités', 'Insister'], 1, 'Le test des trois conversations sert à ajuster avant de construire.')
  ],
  script: script('8 min',
    '« Je fais de l\'IA » ne vend rien. « Je réponds à vos avis Google chaque matin » vend. Voici comment passer de l\'un à l\'autre.',
    ['Une offre, ce n\'est pas une compétence', 'Six modèles et leur vitesse', 'La phrase d\'offre', 'Le service produit', 'Choisir sa niche', 'Le test des trois conversations'],
    'Rédigez votre phrase d\'offre et testez-la auprès de trois clients potentiels.',
    'Le gabarit rempli en direct, puis critiqué par Claude dans le rôle d\'un client sceptique.')
};

const L02 = {
  titre: 'Fixer ses prix',
  objectifs: ['Calculer votre tarif minimum à partir de vos objectifs', 'Passer du prix au temps au prix à la valeur', 'Construire une grille à trois niveaux et la défendre'],
  theorie: `<h2>Le prix plancher</h2>
<p>Partez de ce que vous voulez gagner, pas de ce que pratiquent les autres. Le calcul ci-dessous donne votre <strong>tarif journalier minimum</strong> : en dessous, vous travaillez à perte.</p>
${code('text', `Objectif de revenu net annuel (avant impôt)     : 36 000 €
Cotisations sociales (micro BNC, ≈ 25,6 %)      : CA nécessaire ≈ 36 000 / (1 − 0,256) ≈ 48 400 €
Frais annuels (abonnements IA, logiciels, matériel, comptable, déplacements) : + 4 000 €
Chiffre d'affaires à réaliser                   : ≈ 52 400 €
Jours facturables par an (hors congés, prospection, administration, formation) : ≈ 120
Tarif journalier minimum                        : 52 400 / 120 ≈ 437 € HT`)}
<p>Les taux de cotisations changent : prenez ceux de votre statut (module 8). Et soyez réaliste sur les jours facturables : au démarrage, la moitié de votre temps part en prospection et en administration.</p>
<h2>Ne vendez pas votre temps… surtout avec l'IA</h2>
<p>Claude vous fait gagner du temps : si vous facturez à l'heure, vous êtes puni de votre efficacité. Facturez le <strong>livrable</strong> ou le <strong>résultat</strong>, à un prix fondé sur la valeur pour le client.</p>
${tableau(['Méthode', 'Principe', 'Quand l\'utiliser'], [
  ['Au temps', 'Tarif horaire ou journalier × durée', 'Missions floues, régie, conseil ponctuel'],
  ['Au livrable', 'Prix fixe par livrable défini', 'Services produits : site, automatisation, pack de vidéos'],
  ['À la valeur', 'Une fraction de ce que le client gagne ou économise', 'Quand le gain est mesurable (heures économisées, demandes traitées)'],
  ['Abonnement', 'Forfait mensuel pour un service récurrent', 'Contenus, maintenance, automatisations suivies']
])}
<p>Exemple de raisonnement à la valeur : un artisan passe 5 heures par semaine sur ses devis. Votre automatisation lui en fait gagner 3. À 40 € de l'heure de son temps, c'est environ 500 € par mois de valeur : un abonnement à 49 € par mois et une mise en place à 690 € sont faciles à justifier.</p>
<h2>Mise en place + abonnement</h2>
<p>Pour les automatisations, chatbots et contenus : une <strong>mise en place</strong> (cadrage, construction, tests, formation) et un <strong>abonnement</strong> (hébergement, coûts d'API, surveillance, ajustements, petites évolutions). L'abonnement crée un revenu récurrent et justifie votre suivi.</p>
<h2>Trois niveaux</h2>
${tableau(['Niveau', 'Rôle', 'Exemple (vidéos pour un commerce)'], [
  ['Essentiel', 'Le minimum utile, pour les budgets serrés', '4 vidéos par mois, montage sur modèle'],
  ['Recommandé', 'Celui que vous voulez vendre', '8 vidéos, tournage mensuel, publication planifiée'],
  ['Premium', 'Ancre haute, pour les clients exigeants', '12 vidéos, deux tournages, publicités, rapport mensuel']
])}
<p>Le niveau premium sert aussi d'<strong>ancre</strong> : à côté de lui, le niveau recommandé paraît raisonnable. N'affichez jamais un niveau que vous ne voulez pas livrer.</p>
<h2>Défendre son prix</h2>
<ul>
  <li><strong>Ne baissez jamais le prix sans réduire le périmètre</strong> : « À ce budget, je vous propose l'essentiel, sans le tournage. »</li>
  <li>Une remise ne s'accorde qu'en échange de quelque chose : engagement plus long, paiement d'avance, recommandation.</li>
  <li>Augmentez vos prix pour les nouveaux clients dès que votre agenda se remplit.</li>
  <li>Répondez au « c'est cher » par la valeur : « Par rapport à quoi ? » puis rappelez le gain ou le coût du problème.</li>
</ul>
${encart('warn', 'Sans promesse de résultat', '<p>Fondez le prix sur la valeur estimée, mais ne garantissez pas de résultat chiffré (chiffre d\'affaires, nombre de clients) : vous ne le maîtrisez pas, et c\'est une source de litige.</p>')}`,
  pas: [
    pas('Calculez votre tarif minimum', 'Avec le gabarit, vos vrais frais et votre statut.'),
    pas('Estimez la valeur de votre offre', 'Heures économisées, demandes traitées, coût du problème pour le client.'),
    pas('Construisez trois niveaux', 'Essentiel, recommandé, premium, avec un périmètre clair pour chacun.'),
    pas('Préparez vos réponses aux objections', 'Demandez à Claude les dix objections probables de votre cible et rédigez vos réponses.'),
    pas('Fixez votre règle de remise', 'Ce que vous acceptez d\'échanger contre une remise, et ce que vous refusez.')
  ],
  exercice: {
    type: 'texte', titre: 'Votre tarif journalier minimum',
    enonce: '<p>Calculez votre tarif journalier minimum en détaillant : <strong>objectif de revenu</strong>, <strong>cotisations</strong>, <strong>frais</strong>, <strong>jours facturables</strong> et le <strong>résultat</strong>.</p>',
    criteres: [
      mots(30),
      crit('Fixe un objectif de revenu', /objectif|revenu|net|gagner/i),
      crit('Prend en compte les cotisations', /cotisations?|charges sociales|urssaf|%/i),
      crit('Prend en compte les frais', /frais|abonnements?|logiciels?|d[ée]penses/i),
      crit('Compte les jours facturables', /\d+\s*jours?/i),
      crit('Donne un tarif journalier', /\d+\s*€\s*(ht)?\s*(par|\/)\s*(jour|j)\b|tjm/i)
    ],
    solution: '<p>« Objectif : 30 000 € nets par an. Cotisations micro BNC d\'environ 25,6 % : il faut environ 40 300 € de chiffre d\'affaires. Frais : 3 500 € (Claude Max, n8n, ElevenLabs, comptable, matériel). Total : 43 800 €. Jours facturables : 110. Tarif minimum : environ 400 € HT par jour. »</p>',
    explication: 'Vous connaissez votre plancher : vous ne vendrez plus à perte.'
  },
  quiz: [
    q('Pourquoi éviter de facturer à l\'heure quand on travaille avec Claude ?', ['C\'est interdit', 'Votre gain de temps ferait baisser votre chiffre d\'affaires', 'Les clients refusent', 'Pour payer moins de cotisations'], 1, 'Facturez le livrable ou la valeur.'),
    q('Un client trouve le prix trop élevé. Que faire en premier ?', ['Baisser le prix', 'Réduire le périmètre en gardant la cohérence prix/contenu', 'Ajouter des options gratuites', 'Abandonner'], 1, 'Jamais de baisse de prix sans baisse de périmètre.'),
    q('À quoi sert le niveau premium d\'une grille ?', ['À rien', 'À servir d\'ancre et à accueillir les clients exigeants', 'À être vendu à tous', 'À cacher le prix'], 1, 'Il rend le niveau recommandé raisonnable, et doit rester livrable.'),
    q('Que couvre l\'abonnement d\'une automatisation ?', ['Rien', 'Hébergement, coûts d\'API, surveillance, ajustements', 'Uniquement la facture', 'La formation initiale'], 1, 'C\'est ce qui justifie un revenu récurrent.')
  ],
  script: script('9 min',
    'Si vous facturez à l\'heure et que Claude vous fait gagner la moitié de votre temps, vous venez de diviser votre revenu par deux. Voici comment fixer vos prix autrement.',
    ['Le calcul du prix plancher', 'Temps, livrable, valeur, abonnement', 'Un exemple de prix à la valeur', 'Mise en place + abonnement', 'La grille à trois niveaux', 'Défendre son prix'],
    'Calculez votre tarif minimum et construisez votre grille à trois niveaux.',
    'Le calcul en direct dans un tableur, puis la grille d\'une offre réelle.')
};

const L03 = {
  titre: 'Prospecter les commerces locaux : l\'exemple de Toulouse',
  objectifs: ['Constituer une liste de prospects qualifiés dans votre ville', 'Préparer un audit express personnalisé avec Claude', 'Contacter, relancer et suivre dans le respect du RGPD'],
  theorie: `<p>Prenons un exemple concret : vous proposez des réponses aux avis et des vidéos courtes aux restaurants et commerces de Toulouse. La méthode est la même pour n'importe quelle ville.</p>
<h2>1. Construire la liste</h2>
<ul>
  <li><strong>Choisissez un quartier et un métier</strong> : par exemple les restaurants des Carmes et de Saint-Cyprien, ou les salons de coiffure des Minimes. Un périmètre restreint permet de passer en personne.</li>
  <li><strong>Sources</strong> : Google Maps consulté à la main, les annuaires professionnels, les associations de commerçants du quartier, les événements de la CCI. Respectez les conditions d'utilisation des sites : pas d'aspiration automatique de Google Maps.</li>
  <li><strong>Signaux d'opportunité</strong> à noter pour chaque commerce : avis récents sans réponse, site absent ou daté, réseaux sociaux inactifs depuis des mois, pas de réservation en ligne, photos de mauvaise qualité.</li>
</ul>
${tableau(['Commerce', 'Quartier', 'Note / avis', 'Avis sans réponse', 'Site', 'Réseaux', 'Priorité'], [
  ['Bistrot exemple', 'Carmes', '4,3 / 412', '9 sur les 10 derniers', 'Page unique datée', 'Instagram inactif depuis 5 mois', 'Haute'],
  ['Salon exemple', 'Minimes', '4,8 / 96', '0', 'Correct', 'Actif', 'Basse']
])}
<h2>2. L'audit express avec Claude</h2>
<p>Pour chaque prospect prioritaire, préparez en dix minutes une page d'observations <strong>à partir d'informations publiques</strong> : ce que vous avez vu, ce que cela coûte probablement, ce que vous proposez.</p>
${code('xml', `<commerce>Bistrot exemple, restaurant, quartier des Carmes à Toulouse</commerce>
<observations>
- 412 avis, note 4,3 ; 9 des 10 derniers avis sans réponse, dont 2 négatifs (attente, réservation).
- Site : une page, horaires de 2024, pas de menu, pas de réservation.
- Instagram : dernière publication il y a 5 mois.
</observations>
<offre>Réponses aux avis validées par le gérant + 8 vidéos courtes par mois</offre>
Rédige une page d'audit express, bienveillante et concrète, pour le gérant :
1. Trois constats, sans jugement ni jargon.
2. Pour chacun, l'enjeu pour le restaurant, sans chiffre inventé.
3. Ce que je propose, en trois lignes, et une proposition de rendez-vous de 15 minutes.
Ton : simple, respectueux, vouvoiement. 200 mots maximum.`)}
<h2>3. Le contact</h2>
<p>Pour un commerce local, <strong>le passage en personne</strong> reste le canal le plus efficace : en dehors du coup de feu (milieu d'après-midi pour un restaurant), avec l'audit imprimé.</p>
${code('text', `« Bonjour, je suis [prénom], j'aide les restaurants du quartier à répondre à leurs avis
et à publier des vidéos sans y passer de temps. J'ai regardé votre fiche Google et j'ai préparé
trois observations, je vous les laisse. Si ça vous parle, je vous montre en 15 minutes
comment ça marche, quand vous voulez. »`)}
<p>Autres canaux : le téléphone (avec un message court), l'email professionnel, LinkedIn pour les entreprises plus structurées, le message privé Instagram pour les commerces très actifs sur ce réseau.</p>
<h2>4. Relancer et suivre</h2>
<ul>
  <li>Une relance à J+3, une à J+10, puis on passe à autre chose. Chaque relance apporte quelque chose (un exemple, une vidéo de démonstration), jamais un simple « avez-vous vu mon message ? ».</li>
  <li>Un tableau de suivi simple (Google Sheets, Notion) : statut, date du dernier contact, prochaine action. Le workflow 01 du module 5 peut qualifier les demandes entrantes.</li>
  <li>Objectif réaliste : une journée de prospection par semaine, dix commerces visités, des rendez-vous qui se transforment progressivement en clients.</li>
</ul>
${encart('legal', 'Prospection et RGPD', '<p>Les coordonnées d\'un commerçant en nom propre sont des données personnelles. Vous pouvez le prospecter par email à son adresse professionnelle sans consentement préalable si le message concerne son activité professionnelle, à condition de l\'informer de l\'usage de ses données et de lui permettre de s\'y opposer simplement (lien ou réponse « STOP »). Ne conservez pas les données d\'un prospect sans contact au-delà de trois ans, et supprimez-les immédiatement s\'il le demande.</p>')}`,
  pas: [
    pas('Choisissez un quartier et un métier', 'Un périmètre que vous pouvez parcourir à pied en une demi-journée.'),
    pas('Listez 30 commerces', 'Avec les signaux d\'opportunité, dans un tableau de suivi.'),
    pas('Préparez 10 audits express', 'Avec le prompt ci-dessus, relus et corrigés à la main.'),
    pas('Faites une tournée', 'Dix commerces, en dehors des heures d\'affluence, audit imprimé en main.'),
    pas('Relancez et notez', 'J+3 et J+10, avec un élément nouveau à chaque relance.')
  ],
  exercice: {
    type: 'texte', titre: 'Votre message de premier contact',
    enonce: '<p>Rédigez un email de premier contact pour un commerce réel de votre ville. Il doit citer une <strong>observation précise</strong>, proposer un <strong>rendez-vous court</strong>, et contenir une possibilité de <strong>refuser</strong> les prochains messages.</p>',
    criteres: [
      mots(60),
      crit('Cite une observation précise', /avis|site|instagram|tiktok|fiche|photos?|r[ée]servation|horaires/i),
      crit('Propose un rendez-vous court', /\d+\s*min|rendez-vous|appel|passer vous voir|caf[ée]/i),
      crit('Permet de refuser', /stop|d[ée]sinscri|ne plus recevoir|r[ée]pondez simplement|opposer/i),
      crit('Vouvoiement', /\bvous\b|\bvotre\b/i)
    ],
    solution: '<p>« Bonjour Madame Martin, je suis passé devant votre salon rue des Minimes et j\'ai consulté votre fiche Google : vos clientes vous laissent de très beaux avis, mais les dix derniers sont restés sans réponse. J\'aide les salons du quartier à répondre à chaque avis en deux minutes par jour, avec des réponses que vous validez. Puis-je vous montrer comment en 15 minutes, au salon ou par téléphone ? Si vous ne souhaitez pas recevoir d\'autre message de ma part, répondez simplement STOP. Bien à vous, Karim, 06 00 00 00 00. »</p>',
    explication: 'Message personnalisé, utile et conforme : il donne envie de répondre.'
  },
  quiz: [
    q('Quel est souvent le meilleur canal pour un commerce de quartier ?', ['Un email automatique en masse', 'Le passage en personne, en dehors des heures d\'affluence', 'Un appel à midi', 'Un SMS le dimanche'], 1, 'La relation de proximité compte beaucoup.'),
    q('Sur quelles informations fonder l\'audit express ?', ['Des chiffres inventés', 'Des informations publiques observées', 'Les données personnelles des clients', 'Les avis d\'un concurrent'], 1, 'On reste factuel, à partir de ce que chacun peut voir.'),
    q('Peut-on prospecter un commerçant par email sans son consentement préalable ?', ['Jamais', 'Oui, à son adresse professionnelle, pour un message lié à son activité, avec information et possibilité de s\'opposer', 'Oui, sans aucune condition', 'Seulement le dimanche'], 1, 'C\'est le régime de la prospection entre professionnels.'),
    q('Que doit apporter une relance ?', ['Une nouvelle pression', 'Un élément nouveau : exemple, démonstration', 'Rien de plus', 'Une remise automatique'], 1, 'Chaque contact doit être utile au prospect.')
  ],
  script: script('11 min',
    'Je prends une rue de Toulouse, dix commerces, et je vous montre comment j\'en fais une liste, dix audits express et une tournée en une semaine.',
    ['Choisir un quartier et un métier', 'Les signaux d\'opportunité', 'L\'audit express avec Claude', 'Le passage en boutique : le script', 'Relances et suivi', 'Prospection et RGPD'],
    'Listez 30 commerces de votre ville et préparez vos dix premiers audits.',
    'Le tableau de suivi rempli, la génération d\'un audit, et l\'audit imprimé.'),
  sources: [
    { titre: 'CNIL : la prospection commerciale par courrier électronique', url: 'https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique' }
  ]
};

const L04 = {
  titre: 'Des propositions commerciales qui signent',
  objectifs: ['Mener un appel de découverte qui prépare la proposition', 'Rédiger une proposition courte et claire avec Claude', 'Suivre la proposition jusqu\'à la signature'],
  theorie: `<h2>L'appel de découverte</h2>
<p>Une bonne proposition se gagne pendant l'appel, pas pendant la rédaction. En 20 minutes, cherchez cinq informations :</p>
<ol>
  <li><strong>La situation</strong> : comment ça se passe aujourd'hui ?</li>
  <li><strong>Le problème</strong> et son coût : temps perdu, clients perdus, stress.</li>
  <li><strong>L'objectif</strong> : à quoi ressemble la réussite dans trois mois ?</li>
  <li><strong>Le budget</strong> et la façon de décider : qui signe, avant quand ?</li>
  <li><strong>Les contraintes</strong> : outils existants, données sensibles, délais.</li>
</ol>
<p>Prenez des notes, ou enregistrez l'appel <strong>avec l'accord explicite</strong> de votre interlocuteur pour le faire transcrire.</p>
<h2>La structure d'une proposition</h2>
${tableau(['Section', 'Contenu', 'Longueur'], [
  ['Votre situation', 'Ce que vous avez compris, avec ses mots', '4-5 lignes'],
  ['L\'objectif', 'Le résultat visé, mesurable si possible', '2-3 lignes'],
  ['Ce que je propose', 'La solution et les livrables, en clair', '6-10 lignes'],
  ['Le déroulement', 'Les étapes et le calendrier', 'Un petit tableau'],
  ['L\'investissement', 'Deux ou trois options, avec leur périmètre', 'Un tableau'],
  ['Les prochaines étapes', 'Comment valider, et ce qui se passe ensuite', '3 lignes']
])}
<p>Deux pages au maximum. Le client doit pouvoir dire oui en lisant seulement la dernière page.</p>
<h2>La rédaction avec Claude</h2>
${code('xml', `<notes_appel>{collez vos notes ou la transcription}</notes_appel>
<mon_offre>{phrase d'offre, périmètre, options et prix de votre grille}</mon_offre>
Rédige une proposition commerciale de deux pages maximum, structurée ainsi :
Votre situation · L'objectif · Ce que je propose · Le déroulement · L'investissement (3 options) · Les prochaines étapes.
Règles : reprends les mots du client ; aucune promesse de résultat chiffré ; aucun jargon technique
(pas de « n8n », « API », « MCP » sans explication) ; prix HT et mention de la TVA selon mon statut ;
validité de l'offre : 30 jours. Signale entre crochets toute information manquante.`)}
<p>Relisez chaque phrase : la proposition engage votre parole. Vérifiez particulièrement le périmètre et les exclusions.</p>
<h2>Les trois options</h2>
<p>Présentez trois options construites sur votre grille. La plupart des clients choisissent l'option du milieu ; l'option haute rassure ceux qui veulent « le meilleur », l'option basse évite le refus sec.</p>
<h2>Le suivi</h2>
<ul>
  <li>Envoyez la proposition dans les 24 heures qui suivent l'appel, avec un message court qui rappelle le problème du client.</li>
  <li>Proposez dès l'appel un rendez-vous de 15 minutes pour en parler : c'est plus efficace qu'un « n'hésitez pas ».</li>
  <li>Relancez à J+3 puis J+7. Après une absence de réponse, un dernier message : « Je clos le dossier pour l'instant, je reste disponible si le sujet revient. »</li>
  <li>Facilitez la signature : signature électronique, acompte en ligne, date de démarrage proposée.</li>
</ul>
${encart('info', 'Le modèle dans les bonus', '<p>Un modèle de proposition commerciale complet vous attend dans les bonus (Modèles et checklists), avec un exemple rempli.</p>')}`,
  pas: [
    pas('Préparez votre trame d\'appel', 'Les cinq informations à obtenir, et trois questions ouvertes par information.'),
    pas('Menez un appel de découverte', 'Avec un prospect réel ou un ami qui joue le rôle, et prenez des notes.'),
    pas('Générez la proposition', 'Avec le prompt ci-dessus, puis relisez et corrigez à la main.'),
    pas('Faites-la critiquer', 'Demandez à Claude de lire la proposition comme un gérant pressé : que comprend-il en 30 secondes ?'),
    pas('Envoyez et planifiez le suivi', 'Dans les 24 heures, avec le rendez-vous de suivi déjà proposé.')
  ],
  exercice: {
    type: 'texte', titre: 'La section « Investissement »',
    enonce: '<p>Rédigez la section « L\'investissement » d\'une de vos propositions : <strong>trois options</strong> avec leur <strong>périmètre</strong>, leur <strong>prix HT</strong>, et une <strong>durée de validité</strong>.</p>',
    criteres: [
      mots(50),
      crit('Trois options', /(option|formule|offre)[\s\S]*(option|formule|offre)[\s\S]*(option|formule|offre)/i),
      crit('Prix hors taxes', /\bht\b|hors taxes?/i),
      crit('Durée de validité', /valable|validit[ée]/i),
      crit('Périmètre décrit', /inclu|comprend|compris|avec|livr/i)
    ],
    solution: '<p>Option Essentiel : réponses aux avis Google validées par email, mise en place 290 € HT, puis 39 € HT par mois. Option Recommandée : avis + 4 vidéos courtes par mois avec publication planifiée, 390 € HT puis 290 € HT par mois. Option Complète : avis + 8 vidéos + tournage mensuel sur place, 490 € HT puis 590 € HT par mois. TVA non applicable, article 293 B du CGI. Offre valable 30 jours.</p>',
    explication: 'Section claire : le client peut choisir sans vous rappeler.'
  },
  quiz: [
    q('Où se gagne une proposition commerciale ?', ['Dans la mise en page', 'Pendant l\'appel de découverte', 'Dans le prix le plus bas', 'Dans le nombre de pages'], 1, 'L\'appel fournit les mots et les enjeux du client.'),
    q('Peut-on enregistrer l\'appel pour le faire transcrire ?', ['Oui, toujours', 'Oui, avec l\'accord explicite de l\'interlocuteur', 'Non, jamais', 'Seulement en visio'], 1, 'L\'accord explicite est indispensable.'),
    q('Quelle longueur viser ?', ['Vingt pages', 'Deux pages au maximum', 'Une ligne', 'Aucune importance'], 1, 'Le client doit pouvoir décider vite.'),
    q('Quand envoyer la proposition ?', ['Un mois après', 'Dans les 24 heures qui suivent l\'appel', 'Le jour de la signature', 'Jamais par écrit'], 1, 'L\'élan de l\'appel retombe vite.')
  ],
  script: script('9 min',
    'Ma proposition tient sur deux pages, et le client peut dire oui en lisant seulement la dernière. Voici sa structure, et comment Claude la rédige à partir de mes notes.',
    ['L\'appel de découverte : cinq informations', 'La structure en six sections', 'Le prompt de rédaction', 'Les trois options', 'Le suivi jusqu\'à la signature'],
    'Menez un appel de découverte et envoyez votre proposition dans les 24 heures.',
    'Des notes d\'appel transformées en proposition, puis relues et corrigées.')
};

const L05 = {
  titre: 'Devis, contrats et CGV',
  objectifs: ['Connaître les mentions d\'un devis et les clauses d\'un contrat de prestation', 'Ajouter les clauses propres à l\'IA et aux données', 'Encadrer les abonnements et les paiements'],
  theorie: `${encart('legal', 'Avertissement', '<p>Les éléments ci-dessous sont des repères pour la France en novembre 2026. Faites relire vos modèles par un avocat ou un juriste avant de les utiliser.</p>')}
<h2>Le devis</h2>
<p>Le devis signé fait office de contrat pour une prestation simple. Mentions utiles : vos coordonnées (nom, adresse, SIREN, mention « EI » ou forme de la société), celles du client, la date et la durée de validité, le détail des prestations (désignation, quantité, prix unitaire HT), le total HT, la TVA ou la mention d'exonération, le total TTC, les conditions de paiement (acompte, échéances), le délai d'exécution, et la mention « Bon pour accord » avec signature et date.</p>
<h2>Les conditions générales de vente (CGV)</h2>
<p>Entre professionnels, vous devez communiquer vos CGV à tout client qui les demande. Elles fixent les règles par défaut : modalités de commande, prix, paiement, <strong>pénalités de retard</strong> (taux à préciser), <strong>indemnité forfaitaire de 40 € pour frais de recouvrement</strong> (obligatoire sur les factures entre professionnels), responsabilité, propriété intellectuelle, résiliation, droit applicable.</p>
<h2>Le contrat de prestation : les clauses clés</h2>
${tableau(['Clause', 'Ce qu\'elle doit dire'], [
  ['Objet et périmètre', 'Les livrables précis, ce qui est exclu, le nombre de séries de corrections'],
  ['Délais et collaboration', 'Ce que le client doit fournir et quand ; décalage des délais en cas de retard du client'],
  ['Prix et paiement', 'Acompte (30 à 50 %), échéances, abonnement, révision annuelle du prix'],
  ['Propriété intellectuelle', 'Cession des droits sur les livrables au complet paiement, en précisant les droits cédés, l\'étendue, le territoire et la durée ; ce qui reste à vous (vos outils, modèles, méthodes)'],
  ['Utilisation de l\'IA', 'Les outils utilisés, leur rôle, la relecture humaine, l\'absence de garantie de protection par le droit d\'auteur des éléments générés'],
  ['Données et confidentialité', 'Confidentialité, et si vous traitez des données personnelles pour le client : contrat de sous-traitance RGPD (article 28)'],
  ['Contenus fournis par le client', 'Le client garantit détenir les droits et autorisations (images, voix, marques) qu\'il vous fournit'],
  ['Responsabilité', 'Plafond (par exemple le montant payé sur 12 mois), exclusion des dommages indirects'],
  ['Durée et résiliation', 'Pour un abonnement : durée initiale, reconduction, préavis'],
  ['Droit applicable et litiges', 'Droit français, recherche d\'une solution amiable, tribunal compétent']
])}
<h2>La clause IA</h2>
${code('text', `Utilisation d'outils d'intelligence artificielle
Le Prestataire peut utiliser des outils d'intelligence artificielle (notamment Claude, ElevenLabs
et des générateurs d'images et de vidéos) pour réaliser tout ou partie des Livrables. Chaque Livrable
est relu et validé par le Prestataire avant remise. Le Prestataire n'introduit dans ces outils
aucune donnée personnelle ou confidentielle du Client au-delà de ce qui est nécessaire à la
Prestation, et utilise des offres dont les conditions excluent l'utilisation de ces données pour
l'entraînement des modèles. Le Client est informé que les éléments générés automatiquement
peuvent ne pas bénéficier de la protection du droit d'auteur ; le Prestataire lui cède les droits
qu'il détient sur les Livrables dans les conditions de l'article « Propriété intellectuelle ».
Les obligations de transparence applicables aux contenus générés (notamment la mention des
contenus réalistes générés par IA) sont mises en œuvre d'un commun accord lors de la publication.`)}
<h2>Abonnements et paiements</h2>
<ul>
  <li>Prélèvement ou paiement par carte récurrent (Stripe, GoCardless) : vous n'avez plus à relancer.</li>
  <li>Engagement initial court (3 mois), puis mensuel avec préavis d'un mois : rassurant pour le client, prévisible pour vous.</li>
  <li>Prévoyez l'arrêt du service en cas d'impayé après relance, et la récupération des données par le client à la fin.</li>
</ul>
<h2>Si votre client est un particulier</h2>
<p>Vendre à un particulier à distance (en ligne, par téléphone) ouvre un <strong>droit de rétractation de 14 jours</strong>. Si la prestation commence avant la fin de ce délai, il faut sa demande expresse ; pour un contenu numérique fourni immédiatement, sa renonciation expresse. La médiation de la consommation est obligatoire. Les CGV de cette formation en donnent un exemple.</p>
<p>La signature électronique (Yousign, Docusign…) a la même valeur qu'une signature manuscrite : utilisez-la, elle accélère la signature.</p>`,
  pas: [
    pas('Préparez votre modèle de devis', 'Avec toutes les mentions, dans votre outil de facturation.'),
    pas('Rédigez vos CGV', 'À partir du modèle des bonus, adaptées à votre activité.'),
    pas('Complétez le contrat de prestation', 'Les dix clauses clés, la clause IA et la propriété intellectuelle.'),
    pas('Ajoutez le contrat de sous-traitance', 'Si vous traitez des données personnelles pour vos clients (chatbot, prospects, avis).'),
    pas('Faites relire', 'Par un avocat ou un juriste : c\'est un investissement unique.')
  ],
  exercice: {
    type: 'checklist', titre: 'Vos documents contractuels',
    enonce: '<p>Cochez chaque élément quand il est prêt.</p>',
    items: [
      'Modèle de devis avec toutes les mentions et la validité',
      'CGV prestataires (pénalités de retard, indemnité de 40 €, responsabilité)',
      'Contrat de prestation avec périmètre et exclusions',
      'Clause de propriété intellectuelle (droits cédés, étendue, territoire, durée)',
      'Clause d\'utilisation de l\'IA',
      'Clause sur les contenus fournis par le client (droits et autorisations)',
      'Contrat de sous-traitance RGPD (si données personnelles)',
      'Conditions d\'abonnement : durée, reconduction, préavis',
      'Outil de signature électronique configuré',
      'Documents relus par un professionnel du droit'
    ],
    explication: 'Vos documents vous protègent et rassurent vos clients.'
  },
  quiz: [
    q('Quelle indemnité forfaitaire doit figurer sur une facture entre professionnels ?', ['10 €', '40 € pour frais de recouvrement', '100 €', 'Aucune'], 1, 'L\'indemnité forfaitaire de recouvrement est de 40 €.'),
    q('Que doit préciser une cession de droits d\'auteur ?', ['Rien', 'Les droits cédés, leur étendue, le territoire et la durée', 'Seulement le prix', 'La couleur du logo'], 1, 'Une cession imprécise est fragile.'),
    q('Vous gérez le chatbot d\'un client, qui collecte des données de ses visiteurs. Quel contrat ajouter ?', ['Aucun', 'Un contrat de sous-traitance RGPD (article 28)', 'Un bail', 'Un contrat de travail'], 1, 'Vous traitez des données pour le compte du client.'),
    q('Un particulier commande en ligne une prestation qui démarre tout de suite. Que faut-il ?', ['Rien', 'Sa demande expresse de commencer avant la fin du délai de rétractation', 'L\'accord de la CNIL', 'Une signature manuscrite'], 1, 'Le délai de rétractation de 14 jours s\'applique à la vente à distance.')
  ],
  script: script('9 min',
    'Un client qui ne paie pas, une vidéo contestée, un chatbot qui collecte des données : trois situations, trois clauses qui vous sauvent.',
    ['Le devis et ses mentions', 'Les CGV entre professionnels', 'Les dix clauses d\'un contrat de prestation', 'La clause IA', 'Abonnements et paiements', 'Si le client est un particulier'],
    'Préparez vos documents à partir des modèles des bonus et faites-les relire.',
    'Le modèle de contrat des bonus à l\'écran, clause par clause.')
};

const L06 = {
  titre: 'Portfolio et preuves honnêtes',
  objectifs: ['Construire un portfolio crédible sans faux témoignage', 'Transformer chaque mission en étude de cas', 'Présenter vos preuves sur votre site et dans vos propositions'],
  theorie: `<p>Sans client, pas de preuve ; sans preuve, pas de client. Ce cercle se brise avec des preuves <strong>honnêtes</strong> : jamais de faux avis, jamais de logo de client sans autorisation, jamais de résultat inventé. En France, ces pratiques sont des pratiques commerciales trompeuses, et elles détruisent la confiance le jour où elles sont découvertes.</p>
<h2>Cinq sources de preuves honnêtes</h2>
<ol>
  <li><strong>Vos propres projets</strong> : votre site, votre chaîne vidéo, vos automatisations. Ce sont des preuves directes de compétence.</li>
  <li><strong>Des démonstrations signalées comme telles</strong> : le site d'un restaurant fictif, une automatisation testée sur des données d'exemple, avec la mention « projet de démonstration ».</li>
  <li><strong>Des missions test</strong> avec de vrais clients, à prix réduit, en échange d'un retour honnête et de l'autorisation de présenter le travail.</li>
  <li><strong>Des études de cas</strong> de vos missions, validées par le client : situation, travail réalisé, résultats constatés (avec ses chiffres et son accord).</li>
  <li><strong>Des témoignages réels</strong>, recueillis par écrit, avec le nom (ou prénom et initiale), le métier et l'accord de publication.</li>
</ol>
<h2>L'étude de cas</h2>
${code('text', `Titre : « Les avis du Bistrot exemple, répondus chaque matin »
Le client : restaurant de 40 couverts, quartier des Carmes, Toulouse.
La situation : plus de 400 avis, presque aucun répondu ; le gérant n'avait pas le temps.
Le travail : automatisation de brouillons de réponse, validation par email chaque matin,
règles adaptées au ton du restaurant ; mise en place en 5 jours.
Ce qui a changé (selon le gérant, chiffres fournis par lui) : [à compléter avec ses données].
Ce qu'il en dit : « [témoignage réel, avec son accord écrit] »
Les outils : Claude, n8n, Google Business Profile.`)}
<p>Demandez à Claude de mettre en forme vos notes de mission en étude de cas, puis faites valider le texte par le client avant toute publication.</p>
<h2>Le portfolio en ligne</h2>
<ul>
  <li>Une page par service, avec deux ou trois réalisations chacune.</li>
  <li>Des visuels réels : captures, vidéos, avant/après.</li>
  <li>Votre façon de travailler (étapes, délais) : pour un client hésitant, c'est souvent la preuve la plus rassurante.</li>
  <li>Une FAQ honnête, qui dit aussi ce que vous ne faites pas.</li>
</ul>
<p>Le module 3 (leçon 2) vous apprend à construire et mettre en ligne ce site avec Claude.</p>
${encart('legal', 'Ce qui est interdit', '<p>Rédiger ou acheter de faux avis, publier des témoignages inventés ou retouchés, afficher le logo d\'une entreprise qui n\'est pas cliente, annoncer des résultats non vérifiables, ou laisser croire qu\'un projet de démonstration est un vrai client. La page de vente de cette formation applique la même règle : sa section témoignages reste masquée tant qu\'aucun avis réel n\'a été recueilli.</p>')}`,
  pas: [
    pas('Faites l\'inventaire de vos preuves', 'Projets personnels, démonstrations, missions, retours reçus.'),
    pas('Créez deux démonstrations', 'Dans votre niche, clairement signalées comme telles.'),
    pas('Proposez une mission test', 'À un vrai client, avec un accord écrit pour présenter le travail et recueillir son avis.'),
    pas('Rédigez une étude de cas', 'Avec le gabarit, puis faites-la valider par le client.'),
    pas('Mettez à jour votre site', 'Une page par service, avec les preuves correspondantes.')
  ],
  exercice: {
    type: 'texte', titre: 'Votre plan de preuves',
    enonce: '<p>Décrivez <strong>trois preuves</strong> que vous allez constituer ce mois-ci, en précisant pour chacune sa <strong>nature</strong> (projet personnel, démonstration, mission test, étude de cas) et comment vous la rendrez <strong>honnête</strong> (mention, accord écrit…).</p>',
    criteres: [
      mots(50),
      crit('Au moins trois preuves', /(1|un|premi)[\s\S]*(2|deux|deuxi)[\s\S]*(3|trois|troisi)/i),
      crit('Nature précisée', /d[ée]mo|projet|mission|[ée]tude de cas|t[ée]moignage/i),
      crit('Honnêteté prévue', /mention|accord|autoris|valid|sign|r[ée]el/i)
    ],
    solution: '<p>1. Ma chaîne TikTok d\'astuces pour commerçants (projet personnel, 12 vidéos ce mois-ci). 2. Un site de démonstration pour un garage fictif, avec la mention « projet de démonstration » en en-tête. 3. Une mission test à prix réduit pour la boulangerie de mon quartier, avec un accord écrit pour présenter le travail et recueillir un témoignage réel à la fin.</p>',
    explication: 'Des preuves solides et honnêtes : elles rassurent sans risque.'
  },
  quiz: [
    q('Peut-on publier un témoignage rédigé par vous « au nom » d\'un client satisfait ?', ['Oui', 'Non, un témoignage doit être réel et publié avec l\'accord de son auteur', 'Oui, sans le nom', 'Oui, si le client a payé'], 1, 'Un faux témoignage est une pratique commerciale trompeuse.'),
    q('Comment présenter un projet réalisé pour une entreprise fictive ?', ['Comme un vrai client', 'Avec la mention claire « projet de démonstration »', 'Sans rien dire', 'Avec un faux logo'], 1, 'La démonstration est une preuve de compétence, à condition d\'être signalée.'),
    q('Que faire avant de publier une étude de cas ?', ['Rien', 'La faire valider par le client', 'Arrondir les chiffres', 'Ajouter des résultats'], 1, 'Le client valide son histoire et ses chiffres.'),
    q('Quelle preuve rassure souvent le plus un client hésitant ?', ['Un logo célèbre', 'Une façon de travailler claire : étapes, délais, livrables', 'Un faux classement', 'Un compte à rebours'], 1, 'La clarté du processus réduit le risque perçu.')
  ],
  script: script('8 min',
    'Je n\'ai jamais acheté un avis, et je ne le ferai jamais. Voici comment se construire des preuves solides quand on démarre, sans tricher.',
    ['Le cercle sans preuve, sans client', 'Cinq sources de preuves honnêtes', 'L\'étude de cas', 'Le portfolio en ligne', 'Ce qui est interdit'],
    'Constituez trois preuves ce mois-ci, dont une mission test avec un vrai client.',
    'Une étude de cas rédigée à partir de notes, puis une page portfolio.')
};

const L07 = {
  titre: 'Acquisition : LinkedIn, TikTok et emailing conforme',
  objectifs: ['Choisir un canal principal et s\'y tenir', 'Publier régulièrement sur LinkedIn et TikTok avec la chaîne du module 6', 'Construire une liste email conforme au RGPD'],
  theorie: `<h2>Un canal principal</h2>
<p>Choisissez <strong>un</strong> canal principal selon votre cible, et un canal secondaire. Mieux vaut être régulier sur un réseau que présent partout par intermittence.</p>
${tableau(['Canal', 'Pour qui', 'Rythme réaliste'], [
  ['LinkedIn', 'Dirigeants de PME, agences, professions libérales, B2B', '3 publications par semaine, commentaires chaque jour'],
  ['TikTok, Reels, Shorts', 'Commerçants, indépendants, grand public, e-commerce', '3 à 5 vidéos par semaine (chaîne du module 6)'],
  ['Emailing', 'Votre audience, quel que soit le canal d\'origine', '1 email par semaine ou par quinzaine'],
  ['Réseau local et partenaires', 'Commerces, artisans : experts-comptables, agences web, clubs d\'entreprises', 'Un rendez-vous par semaine']
])}
<h2>LinkedIn</h2>
<ul>
  <li><strong>Profil</strong> : un titre qui dit pour qui vous travaillez et quel résultat (votre phrase d'offre, version courte), une bannière claire, une section « Sélection » avec vos meilleures preuves.</li>
  <li><strong>Publications</strong> : ce que vous faites vraiment (une automatisation, une erreur évitée, une démonstration), une idée par publication, une accroche dans la première ligne. Claude vous aide à structurer, mais l'expérience doit être la vôtre.</li>
  <li><strong>Commentaires</strong> : dix commentaires utiles par jour sous les publications de votre cible rapportent souvent plus que vos propres publications.</li>
  <li><strong>Messages</strong> : jamais de message commercial automatique dès la connexion. Un message personnalisé, qui apporte quelque chose.</li>
</ul>
<h2>TikTok, Reels et Shorts</h2>
<p>Utilisez votre propre chaîne vidéo (module 6) comme vitrine : montrez le « avant/après » d'une automatisation, une démonstration en 30 secondes, la réponse à une question de commerçant. Chaque vidéo est à la fois une preuve et une publicité. Ajoutez un lien vers votre aimant à prospects dans la bio.</p>
<h2>L'emailing conforme</h2>
<p>Une liste email vous appartient : elle ne dépend pas d'un algorithme. Construisez-la avec un <strong>aimant à prospects</strong> (un guide, une checklist, un module gratuit) proposé en échange de l'adresse.</p>
${tableau(['Situation', 'Règle'], [
  ['Prospection de particuliers par email', 'Consentement préalable obligatoire : case à cocher non pré-cochée, ou inscription volontaire claire'],
  ['Prospection de professionnels', 'Possible sans consentement préalable si le message concerne leur activité, avec information et droit d\'opposition'],
  ['Clients existants', 'Possible pour des produits ou services analogues, s\'ils ont été informés et peuvent s\'y opposer'],
  ['Tous les emails', 'Identité de l\'expéditeur, lien de désinscription simple, information sur l\'usage des données'],
  ['Conservation', 'Prospects : trois ans au maximum après le dernier contact de leur part']
])}
<ul>
  <li>Le <strong>double opt-in</strong> (email de confirmation) n'est pas imposé par la loi, mais il est recommandé : il prouve le consentement et garde une liste propre.</li>
  <li>Choisissez un outil d'emailing qui gère les désinscriptions et documente le consentement (par exemple Brevo, outil français), et mentionnez-le dans votre politique de confidentialité.</li>
  <li>Une séquence de bienvenue de cinq emails (présentation, ressource utile, étude de cas, réponse à une objection, offre) fait le gros du travail. VENTE.md en donne un exemple complet pour cette formation.</li>
</ul>
<h2>Mesurer</h2>
<p>Chaque mois : d'où viennent les rendez-vous, combien deviennent des clients, combien vous a coûté chaque client (temps ou argent). Gardez le canal qui apporte des clients, pas celui qui apporte des likes.</p>
${encart('warn', 'Pas d\'automatisation agressive', '<p>Les outils qui envoient des centaines d\'invitations ou de messages automatiques sur LinkedIn enfreignent ses conditions d\'utilisation et exposent votre compte à une restriction. Automatisez la production de vos contenus, pas la relation.</p>')}`,
  pas: [
    pas('Choisissez votre canal principal', 'Et un canal secondaire, selon votre cible.'),
    pas('Mettez à jour votre profil', 'Titre, bannière, sélection de preuves, lien vers l\'aimant à prospects.'),
    pas('Planifiez quatre semaines de publications', 'Avec Claude et la chaîne vidéo du module 6, à partir de votre vrai travail.'),
    pas('Créez votre aimant à prospects', 'Un guide ou une checklist utile, une page d\'inscription conforme.'),
    pas('Écrivez la séquence de bienvenue', 'Cinq emails, avec lien de désinscription et identité claire.')
  ],
  exercice: {
    type: 'texte', titre: 'Le formulaire d\'inscription conforme',
    enonce: '<p>Rédigez le texte du formulaire d\'inscription à votre aimant à prospects (destiné à des particuliers comme à des professionnels) : ce que la personne reçoit, une <strong>case de consentement</strong> non pré-cochée, l\'<strong>usage des données</strong>, la <strong>désinscription</strong> et un lien vers la <strong>politique de confidentialité</strong>.</p>',
    criteres: [
      mots(40),
      crit('Case de consentement', /j'accepte|je souhaite|je consens|cochant|case/i),
      crit('Usage des données expliqué', /utilis|donn[ée]es|adresse/i),
      crit('Désinscription', /d[ée]sinscri|d[ée]sabonn|à tout moment/i),
      crit('Politique de confidentialité', /confidentialit[ée]|vie priv[ée]e|rgpd/i)
    ],
    solution: '<p>« Recevez le guide « 7 services IA à proposer ce mois-ci » et le module gratuit. [ ] J\'accepte de recevoir le guide et, environ une fois par semaine, des emails de conseils et d\'offres sur l\'IA appliquée au business. Votre adresse sert uniquement à ces envois ; elle n\'est jamais revendue. Vous pouvez vous désinscrire à tout moment en un clic. Détails dans notre politique de confidentialité. »</p>',
    explication: 'Formulaire conforme : vos inscriptions sont solides juridiquement.'
  },
  quiz: [
    q('Peut-on envoyer des emails de prospection à des particuliers sans leur consentement préalable ?', ['Oui', 'Non, il faut leur consentement préalable', 'Oui, avec un lien de désinscription', 'Oui, le week-end'], 1, 'Pour les particuliers, le consentement préalable est la règle.'),
    q('Le double opt-in est-il obligatoire ?', ['Oui, en France', 'Non, mais il est recommandé pour prouver le consentement', 'Seulement pour les professionnels', 'Il est interdit'], 1, 'Il n\'est pas imposé, mais c\'est une bonne pratique.'),
    q('Que privilégier sur LinkedIn ?', ['Des messages commerciaux automatiques', 'Des publications sur votre vrai travail et des commentaires utiles', 'Acheter des abonnés', 'Publier une fois par an'], 1, 'L\'automatisation agressive enfreint les conditions de LinkedIn.'),
    q('Quel canal garder ?', ['Celui qui apporte le plus de likes', 'Celui qui apporte des clients', 'Tous', 'Le plus récent'], 1, 'Mesurez les rendez-vous et les clients, pas l\'audience.')
  ],
  script: script('9 min',
    'Je n\'ai pas besoin d\'être partout. J\'ai besoin d\'un canal, tenu régulièrement, et d\'une liste email qui m\'appartient. Voici comment.',
    ['Un canal principal', 'LinkedIn : profil, publications, commentaires', 'TikTok et la chaîne vidéo comme vitrine', 'L\'emailing conforme', 'La séquence de bienvenue', 'Mesurer ce qui apporte des clients'],
    'Choisissez votre canal, créez votre aimant à prospects et écrivez votre séquence de bienvenue.',
    'Un profil LinkedIn avant/après, puis un formulaire d\'inscription conforme.'),
  sources: [
    { titre: 'CNIL : la prospection commerciale par courrier électronique', url: 'https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique' },
    { titre: 'CNIL : durées de conservation', url: 'https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees' }
  ]
};

export default {
  intro: `<p>Savoir faire ne suffit pas : il faut que les bons clients le sachent, et qu'ils signent. Ce module vous fait passer de la compétence à l'activité : choisir une offre, fixer des prix qui tiennent, prospecter (avec l'exemple des commerces de Toulouse), rédiger des propositions et des contrats, constituer des preuves honnêtes et installer des canaux d'acquisition conformes au RGPD.</p>`,
  lecons: [L01, L02, L03, L04, L05, L06, L07]
};
