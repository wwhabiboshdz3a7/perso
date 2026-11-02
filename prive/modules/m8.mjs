import { code, encart, tableau, pas, q, crit, mots, script } from './_outils.mjs';

const MAJ = '<p class="muted small">Seuils, taux et dates vérifiés en novembre 2026. Ils changent presque chaque année : vérifiez-les sur autoentrepreneur.urssaf.fr, impots.gouv.fr, entreprendre.service-public.fr et cnil.fr avant toute décision, et faites-vous accompagner par un expert-comptable.</p>';
const AVERT = encart('legal', 'Avertissement', '<p>Ce module donne des repères pour lancer votre activité en France. Il ne remplace pas le conseil personnalisé d\'un expert-comptable, d\'un avocat ou des organismes officiels.</p>');

const L01 = {
  titre: 'Micro-entreprise ou SASU',
  objectifs: ['Comparer micro-entreprise et SASU pour une activité de services IA', 'Connaître les plafonds, les cotisations et les aides en 2026', 'Créer son entreprise et ouvrir les bons comptes'],
  theorie: `${AVERT}
<h2>La micro-entreprise : démarrer vite</h2>
<p>C'est le régime de l'entrepreneur individuel le plus simple : création gratuite en ligne, cotisations calculées sur le chiffre d'affaires encaissé (pas de chiffre d'affaires, pas de cotisations), comptabilité réduite à un livre des recettes. Idéal pour tester une offre et décrocher les premiers clients.</p>
${tableau(['Repère 2026', 'Prestations de services', 'Vente de marchandises'], [
  ['Plafond de chiffre d\'affaires annuel (2026 à 2028)', '83 600 €', '203 100 €'],
  ['Cotisations sociales', 'BNC (libéral, SSI) : 25,6 % ; BIC services : 21,2 %', '12,3 %'],
  ['Versement libératoire de l\'impôt (sur option, sous condition de revenus)', 'BNC : 2,2 % ; BIC services : 1,7 %', '1 %']
])}
<ul>
  <li><strong>BNC ou BIC ?</strong> La plupart des prestations intellectuelles (conseil, rédaction, création de sites, formation, automatisation) relèvent des BNC (professions libérales). La qualification dépend de l'activité exacte : déclarez-la précisément lors de la création, et vérifiez auprès de l'URSSAF ou d'un expert-comptable, notamment si vous vendez aussi des produits numériques.</li>
  <li><strong>ACRE</strong> : depuis 2026, l'aide n'est plus automatique ; il faut la demander à l'URSSAF, et seuls certains publics y ont droit (demandeurs d'emploi indemnisés, bénéficiaires de minima sociaux, moins de 26 ans…). Pour les créations à partir du 1er juillet 2026, la réduction de cotisations de la première année passe de 50 % à 25 %.</li>
  <li><strong>Limites</strong> : pas de déduction de vos frais réels (les abonnements IA, le matériel, les logiciels ne réduisent pas vos cotisations), plafond de chiffre d'affaires, image parfois moins rassurante pour les grands comptes.</li>
</ul>
<h2>La SASU : structurer et grandir</h2>
<ul>
  <li>Société à associé unique : patrimoine séparé, crédibilité, possibilité d'associer d'autres personnes plus tard.</li>
  <li>Le bénéfice est soumis à l'<strong>impôt sur les sociétés</strong> : 15 % jusqu'à 42 500 € de bénéfice (sous conditions), 25 % au-delà. Les frais réels sont déductibles.</li>
  <li>Le président est <strong>assimilé salarié</strong> s'il se verse une rémunération : protection sociale proche des salariés (sans assurance chômage), mais cotisations élevées.</li>
  <li>Il peut se rémunérer en <strong>dividendes</strong>, sans cotisations sociales mais soumis au prélèvement forfaitaire unique : 31,4 % en 2026 sur les dividendes, après la hausse de la CSG sur les revenus du capital.</li>
  <li>Coûts : création (annonce légale, greffe), expert-comptable (souvent 1 000 à 2 500 € par an), comptes annuels.</li>
</ul>
<h2>Comment choisir</h2>
${tableau(['Votre situation', 'Choix fréquent'], [
  ['Vous testez une offre, chiffre d\'affaires incertain', 'Micro-entreprise'],
  ['Chiffre d\'affaires régulier, frais importants (outils, sous-traitants, matériel)', 'Société (SASU ou EURL), à simuler avec un expert-comptable'],
  ['Vous approchez du plafond de la micro ou de la franchise de TVA', 'Anticipez le passage, au moins six mois avant'],
  ['Projet à associés, levée de fonds, micro-SaaS ambitieux', 'SAS']
])}
<p>Faites simuler les deux options avec vos chiffres : les simulateurs officiels (URSSAF, portail de la création d'entreprise) et un rendez-vous avec un expert-comptable valent bien plus qu'une règle générale.</p>
<h2>Créer et s'organiser</h2>
<ol>
  <li>Déclaration sur le <strong>guichet unique</strong> des formalités d'entreprises (formalites.entreprises.gouv.fr), avec une description précise de l'activité.</li>
  <li>Réception du numéro SIREN, puis création de votre espace sur le site de l'URSSAF (et impots.gouv.fr, espace professionnel).</li>
  <li>Un <strong>compte bancaire dédié</strong> à l'activité (obligatoire pour une micro-entreprise dont le chiffre d'affaires dépasse 10 000 € deux années de suite ; recommandé dès le départ).</li>
  <li>Une assurance responsabilité civile professionnelle : indispensable dès que vous intervenez sur les outils ou les données d'un client.</li>
  <li>Un outil de facturation conforme (leçon 2), et un calendrier des déclarations (mensuelles ou trimestrielles en micro).</li>
</ol>
<p>Pensez aussi à la <strong>cotisation foncière des entreprises</strong> (CFE), due à partir de la deuxième année, et à la contribution à la formation professionnelle, prélevée avec vos cotisations.</p>
${MAJ}`,
  pas: [
    pas('Estimez votre première année', 'Chiffre d\'affaires probable, frais réels (abonnements, matériel, logiciels, sous-traitance).'),
    pas('Simulez les deux statuts', 'Avec les simulateurs officiels, puis demandez à Claude de vous aider à comparer les résultats (sans lui confier de données personnelles inutiles).'),
    pas('Vérifiez votre catégorie', 'BNC ou BIC selon votre activité exacte, et votre éligibilité à l\'ACRE.'),
    pas('Créez l\'entreprise', 'Sur le guichet unique, avec une description précise de l\'activité.'),
    pas('Organisez-vous', 'Compte dédié, assurance RC pro, outil de facturation, calendrier des déclarations.')
  ],
  exercice: {
    type: 'qcm', titre: 'Le bon statut',
    enonce: '<p>Lina démarre une activité de création de sites et d\'automatisations pour des commerçants. Elle prévoit 25 000 € de chiffre d\'affaires la première année, avec environ 1 500 € de frais. Elle veut tester son offre sans formalités lourdes. Quel choix est le plus cohérent pour commencer ?</p>',
    options: ['Une SAS avec levée de fonds', 'Une micro-entreprise, en activité libérale (BNC) si son activité le permet', 'Aucun statut : elle facture sans SIREN', 'Une association'],
    bonne: 1,
    explication: 'Chiffre d\'affaires modeste, peu de frais, besoin de simplicité : la micro-entreprise est adaptée pour démarrer.'
  },
  quiz: [
    q('Quel est le plafond de chiffre d\'affaires d\'une micro-entreprise de services en 2026 ?', ['37 500 €', '83 600 €', '203 100 €', 'Il n\'y en a pas'], 1, '83 600 € pour les prestations de services (2026 à 2028).'),
    q('En micro-entreprise, vos abonnements IA réduisent-ils vos cotisations ?', ['Oui', 'Non, les cotisations portent sur le chiffre d\'affaires, sans déduction des frais', 'Oui, à moitié', 'Seulement en BIC'], 1, 'C\'est la principale limite du régime.'),
    q('L\'ACRE est-elle automatique en 2026 ?', ['Oui', 'Non, elle se demande à l\'URSSAF et dépend de votre situation', 'Oui, pour tout le monde', 'Elle a disparu'], 1, 'Elle n\'est plus automatique depuis 2026.'),
    q('En SASU, quel taux d\'impôt sur les sociétés s\'applique jusqu\'à 42 500 € de bénéfice (sous conditions) ?', ['0 %', '15 %', '25 %', '31,4 %'], 1, '15 %, puis 25 % au-delà.')
  ],
  script: script('10 min',
    'Micro-entreprise ou SASU ? La bonne réponse n\'est pas la même pour tout le monde, et je vais vous montrer comment trouver la vôtre en une heure.',
    ['La micro-entreprise et ses repères 2026', 'BNC ou BIC', 'L\'ACRE en 2026', 'La SASU : impôt, rémunération, dividendes', 'Comment choisir', 'Créer et s\'organiser'],
    'Simulez les deux statuts avec vos chiffres, puis créez votre entreprise.',
    'Simulateur officiel à l\'écran avec deux scénarios, puis le guichet unique.'),
  sources: [
    { titre: 'URSSAF : le site des micro-entrepreneurs', url: 'https://www.autoentrepreneur.urssaf.fr' },
    { titre: 'Guichet unique des formalités d\'entreprises', url: 'https://formalites.entreprises.gouv.fr' },
    { titre: 'Entreprendre.service-public.fr', url: 'https://entreprendre.service-public.fr' }
  ]
};

const L02 = {
  titre: 'Facturation, TVA et facture électronique',
  objectifs: ['Émettre des factures conformes', 'Comprendre la franchise de TVA et les ventes en ligne dans l\'Union européenne', 'Préparer le passage à la facture électronique'],
  theorie: `${AVERT}
<h2>Les mentions d'une facture</h2>
<ul>
  <li>Numéro unique, selon une suite chronologique continue, et date d'émission.</li>
  <li>Vos nom ou dénomination, adresse, SIREN, et la mention « EI » (ou « entrepreneur individuel ») si vous êtes en micro-entreprise ; pour une société, sa forme, son capital et son RCS.</li>
  <li>Nom et adresse du client (et son SIREN s'il est professionnel), numéro de TVA intracommunautaire des deux parties le cas échéant.</li>
  <li>Date de la prestation, désignation précise, quantité, prix unitaire HT, total HT.</li>
  <li>Taux et montant de TVA, total TTC, ou la mention d'exonération : <strong>« TVA non applicable, art. 293 B du CGI »</strong> en franchise.</li>
  <li>Date d'échéance, taux des pénalités de retard et, entre professionnels, l'<strong>indemnité forfaitaire de 40 €</strong> pour frais de recouvrement.</li>
</ul>
<h2>La franchise en base de TVA</h2>
${tableau(['Activité', 'Seuil de franchise', 'Seuil majoré'], [
  ['Prestations de services', '37 500 €', '41 250 €'],
  ['Vente de marchandises', '85 000 €', '93 500 €']
])}
<p>Tant que vous restez sous le seuil, vous ne facturez pas de TVA (et ne la récupérez pas sur vos achats). Si vous dépassez le seuil majoré en cours d'année, la TVA s'applique dès le jour du dépassement. Si vous dépassez le seuil de base sans atteindre le seuil majoré, la franchise prend fin au 1er janvier suivant. Vous pouvez aussi opter volontairement pour la TVA, utile si vos clients sont des entreprises qui la récupèrent et si vous avez beaucoup d'achats.</p>
<h2>Clients professionnels dans l'Union européenne</h2>
<p>Pour une prestation de services à une entreprise d'un autre pays de l'Union : facture hors taxe, numéros de TVA intracommunautaire des deux parties, mention « Autoliquidation ». Il vous faut donc un numéro de TVA intracommunautaire, même en franchise, et une déclaration européenne de services.</p>
<h2>Vendre des produits numériques en ligne</h2>
<p>Formations en ligne, modèles, packs de prompts vendus à des <strong>particuliers</strong> de toute l'Union : au-delà de 10 000 € de ventes à distance vers d'autres pays de l'Union par an, c'est la TVA du pays de l'acheteur qui s'applique, déclarée via le guichet unique européen (OSS).</p>
${encart('ok', 'La solution simple : le revendeur officiel', '<p>Les plateformes qui agissent comme <strong>revendeur officiel</strong> (« merchant of record ») vendent en leur nom et gèrent la TVA de chaque pays à votre place : c\'est le cas de Lemon Squeezy, Paddle, et de Gumroad pour ses ventes. Vous facturez ensuite la plateforme. Stripe, en revanche, n\'est qu\'un prestataire de paiement : c\'est vous le vendeur (Stripe Tax peut aider au calcul). Comparez les commissions, plus élevées chez les revendeurs officiels.</p>')}
<h2>La facture électronique</h2>
${tableau(['Date', 'Obligation'], [
  ['1er septembre 2026', 'Toutes les entreprises assujetties à la TVA en France, y compris les micro-entreprises en franchise, doivent pouvoir <strong>recevoir</strong> des factures électroniques. Les grandes entreprises et les ETI doivent aussi les <strong>émettre</strong>.'],
  ['1er septembre 2027', 'Les PME, TPE et micro-entreprises doivent <strong>émettre</strong> leurs factures électroniques entre entreprises et transmettre les données de leurs autres opérations (« e-reporting » : ventes aux particuliers, clients étrangers).']
])}
<ul>
  <li>Concrètement : choisir une <strong>plateforme agréée</strong> par l'administration fiscale (beaucoup d'outils de facturation en intègrent une ou s'y connectent), et y rattacher votre entreprise.</li>
  <li>Un PDF envoyé par email ne sera plus une facture électronique au sens de la réforme : il faut un format structuré, transmis par la plateforme.</li>
  <li>De nouvelles mentions arrivent avec votre date d'émission (SIREN du client, adresse de livraison si elle diffère, nature de l'opération : biens ou services, option pour la TVA sur les débits le cas échéant).</li>
</ul>
<h2>Facturer avec Claude ?</h2>
<p>Claude peut rédiger la désignation des prestations, préparer des relances polies et vérifier qu'une facture contient toutes les mentions. Mais émettez vos factures avec un <strong>logiciel de facturation</strong> conforme : numérotation, inaltérabilité, archivage et facture électronique ne s'improvisent pas dans un traitement de texte.</p>
${code('text', `Voici le brouillon de ma facture (copie texte). Vérifie la présence de toutes les mentions
obligatoires pour une micro-entreprise en franchise de TVA qui facture un client professionnel
en France. Liste ce qui manque ou semble incorrect, sans rien inventer. Ne modifie pas les montants.`)}
${MAJ}`,
  pas: [
    pas('Choisissez un logiciel de facturation', 'Conforme, avec plateforme agréée intégrée ou compatible pour la facture électronique.'),
    pas('Paramétrez vos mentions', 'Identité, « EI », SIREN, mention de TVA, pénalités, indemnité de 40 €.'),
    pas('Rattachez-vous à une plateforme agréée', 'Pour recevoir les factures électroniques de vos fournisseurs dès maintenant.'),
    pas('Suivez vos seuils', 'Chiffre d\'affaires cumulé chaque mois face aux seuils de TVA et de la micro.'),
    pas('Décidez de votre canal de vente en ligne', 'Revendeur officiel (TVA gérée) ou Stripe (TVA à votre charge).')
  ],
  exercice: {
    type: 'checklist', titre: 'Votre facture est conforme',
    enonce: '<p>Prenez votre modèle de facture et cochez chaque mention présente.</p>',
    items: [
      'Numéro unique et chronologique, date d\'émission',
      'Nom, adresse, SIREN et mention « EI » (ou forme et capital de la société)',
      'Nom, adresse et SIREN du client professionnel',
      'Date et désignation précise de la prestation, quantité, prix unitaire HT',
      'Total HT, TVA et total TTC, ou « TVA non applicable, art. 293 B du CGI »',
      'Date d\'échéance et taux des pénalités de retard',
      'Indemnité forfaitaire de 40 € pour frais de recouvrement (clients professionnels)',
      'Logiciel de facturation conforme et plateforme agréée choisie'
    ],
    explication: 'Vos factures sont conformes et prêtes pour la réforme.'
  },
  quiz: [
    q('Quel est le seuil de franchise de TVA pour les prestations de services en 2026 ?', ['10 000 €', '37 500 €', '83 600 €', '85 000 €'], 1, '37 500 €, avec un seuil majoré de 41 250 €.'),
    q('Depuis le 1er septembre 2026, que doit pouvoir faire une micro-entreprise ?', ['Rien de nouveau', 'Recevoir des factures électroniques', 'Émettre toutes ses factures électroniques', 'Facturer en dollars'], 1, 'L\'émission arrive au 1er septembre 2027 pour les PME et micro-entreprises.'),
    q('Qui gère la TVA de chaque pays quand vous vendez via Lemon Squeezy ?', ['Vous', 'La plateforme, en tant que revendeur officiel', 'Votre banque', 'Personne'], 1, 'Le revendeur officiel vend en son nom et gère la TVA.'),
    q('Quelle mention pour une prestation à une entreprise allemande ?', ['TVA française à 20 %', '« Autoliquidation », avec les numéros de TVA des deux parties', 'Aucune', '« Exonération Allemagne »'], 1, 'Le client autoliquide la TVA dans son pays.')
  ],
  script: script('10 min',
    'Votre facture est-elle encore valable en septembre 2027 ? Si vous l\'envoyez en PDF par email, bientôt non. Voici ce qui change, et ce qu\'il faut faire maintenant.',
    ['Les mentions d\'une facture', 'La franchise de TVA et ses seuils', 'Clients européens et autoliquidation', 'Vendre des produits numériques : le revendeur officiel', 'La facture électronique : le calendrier', 'Ce que Claude peut faire, et ne doit pas faire'],
    'Vérifiez votre modèle de facture et rattachez-vous à une plateforme agréée.',
    'Une facture annotée mention par mention, puis le calendrier de la réforme.'),
  sources: [
    { titre: 'impots.gouv.fr : espace professionnel (facturation électronique, plateformes agréées)', url: 'https://www.impots.gouv.fr/professionnel' },
    { titre: 'Entreprendre.service-public.fr : franchise en base de TVA', url: 'https://entreprendre.service-public.fr/vosdroits/F21746' },
    { titre: 'Commission européenne : guichet unique OSS', url: 'https://vat-one-stop-shop.ec.europa.eu' }
  ]
};

const L03 = {
  titre: 'RGPD : les données clients avec l\'IA',
  objectifs: ['Appliquer les principes du RGPD aux usages de Claude et des automatisations', 'Distinguer responsable de traitement et sous-traitant', 'Choisir des offres et des réglages compatibles avec les données de vos clients'],
  theorie: `${AVERT}
<h2>Les principes, appliqués à l'IA</h2>
${tableau(['Principe', 'Ce que cela veut dire avec Claude'], [
  ['Finalité', 'Chaque traitement a un but précis : qualifier des demandes, répondre aux avis. Pas de réutilisation pour autre chose sans base légale.'],
  ['Minimisation', 'N\'envoyez à Claude que ce qui est nécessaire : l\'entreprise et le message, pas le téléphone ni l\'email (c\'est ce que fait le workflow 01).'],
  ['Exactitude', 'Une réponse générée sur une personne se vérifie avant d\'être utilisée.'],
  ['Durée de conservation', 'Prospects : trois ans après le dernier contact de leur part ; journaux techniques : quelques mois.'],
  ['Sécurité', 'Clés d\'API protégées, accès limités, double authentification, chiffrement, pas de données dans les noms de fichiers ou les journaux.'],
  ['Transparence', 'Les personnes savent que leurs données passent par un outil d\'IA (politique de confidentialité, mention dans le chatbot).']
])}
<h2>Qui est responsable ?</h2>
<ul>
  <li><strong>Pour vos propres prospects et clients</strong>, vous êtes <strong>responsable de traitement</strong> : vous décidez pourquoi et comment les données sont traitées.</li>
  <li><strong>Quand vous installez un chatbot ou une automatisation qui traite les données des clients de votre client</strong>, votre client est responsable de traitement, et vous êtes <strong>sous-traitant</strong>. Il faut un contrat de sous-traitance (article 28 du RGPD) : objet, durée, type de données, mesures de sécurité, sous-traitants ultérieurs (Anthropic, n8n, l'hébergeur…), sort des données à la fin.</li>
  <li>Les éditeurs d'outils (Anthropic pour l'API, votre hébergeur n8n, ElevenLabs…) sont vos <strong>sous-traitants ultérieurs</strong> : listez-les et vérifiez leurs conditions de protection des données.</li>
</ul>
<h2>Les offres et réglages de Claude</h2>
${tableau(['Usage', 'Ce qu\'il faut savoir'], [
  ['API (Claude Console)', 'Offre commerciale : les données des requêtes ne servent pas à entraîner les modèles par défaut ; conditions commerciales et accord de traitement des données disponibles. Le bon choix pour les automatisations.'],
  ['Team et Enterprise', 'Offres professionnelles : données non utilisées pour l\'entraînement par défaut, administration, contrôles de conservation.'],
  ['Free, Pro et Max', 'Offres grand public : un réglage de confidentialité permet de choisir si vos conversations peuvent servir à améliorer les modèles. Désactivez-le si vous y traitez des documents de clients, et évitez d\'y mettre des données personnelles sensibles.']
])}
<p>Les conditions évoluent : relisez les pages de confidentialité et les conditions commerciales d'Anthropic avant de traiter des données de clients, et mentionnez les outils utilisés dans vos contrats.</p>
<h2>Les transferts hors de l'Union</h2>
<p>La plupart des fournisseurs d'IA traitent des données hors de l'Union européenne, notamment aux États-Unis. Ces transferts sont encadrés : adhésion du fournisseur au cadre de protection des données UE–États-Unis, ou clauses contractuelles types. Vérifiez le mécanisme indiqué dans l'accord de traitement de chaque fournisseur et mentionnez-le dans votre registre et votre politique de confidentialité.</p>
<h2>Les bons réflexes</h2>
<ul>
  <li><strong>Pseudonymiser</strong> avant d'analyser : remplacez noms, emails et téléphones par des identifiants dans un export avant de le confier à Claude.</li>
  <li><strong>Jamais de données sensibles</strong> (santé, opinions, données bancaires, numéros d'identité) dans un prompt sans base légale solide et analyse préalable.</li>
  <li><strong>Un registre des traitements</strong>, même simple : votre prospection, votre emailing, chaque automatisation client.</li>
  <li><strong>Une analyse d'impact</strong> (AIPD) quand un traitement présente un risque élevé : surveillance, données sensibles à grande échelle, profilage avec effets importants.</li>
  <li><strong>Les droits des personnes</strong> : accès, rectification, effacement, opposition. Sachez retrouver et supprimer les données d'une personne dans chaque outil (Sheets, n8n, emailing).</li>
</ul>
${code('text', `Mon client (salon de coiffure) veut un chatbot qui prend les demandes de rendez-vous.
Aide-moi à préparer : 1) la fiche du registre des traitements (finalité, base légale, données,
destinataires, sous-traitants, durées, sécurité) ; 2) la mention d'information à afficher
dans le chatbot ; 3) la liste des points à mettre dans le contrat de sous-traitance.
Signale ce que je dois vérifier auprès des fournisseurs, sans inventer leurs engagements.`)}
${encart('info', 'Ressources officielles', '<p>La CNIL publie des fiches pratiques sur l\'IA et le RGPD (développement et déploiement de systèmes d\'IA, information des personnes, sécurité), ainsi que des modèles de registre et de clauses de sous-traitance. Ce sont vos références.</p>')}`,
  pas: [
    pas('Faites l\'inventaire', 'Quelles données passent par Claude, n8n, vos outils d\'emailing et de facturation ?'),
    pas('Vérifiez vos offres et réglages', 'API ou offre professionnelle pour les données de clients ; réglage de confidentialité de votre compte personnel.'),
    pas('Rédigez votre registre', 'Une fiche par traitement, avec l\'aide du prompt ci-dessus.'),
    pas('Mettez à jour vos contrats', 'Contrat de sous-traitance pour chaque client dont vous traitez les données.'),
    pas('Testez un droit d\'effacement', 'Retrouvez et supprimez une donnée de test dans chaque outil.')
  ],
  exercice: {
    type: 'checklist', titre: 'Vos automatisations sont conformes',
    enonce: '<p>Passez cette checklist sur une automatisation que vous avez installée (ou allez installer).</p>',
    items: [
      'La finalité est écrite et limitée',
      'Seules les données nécessaires sont envoyées à Claude (minimisation)',
      'L\'offre utilisée exclut l\'entraînement sur les données (API, Team ou Enterprise)',
      'Les personnes sont informées (politique de confidentialité, mention dans le chatbot ou le formulaire)',
      'Une durée de conservation est fixée et appliquée',
      'Un contrat de sous-traitance est signé avec le client',
      'Les sous-traitants ultérieurs et les transferts hors UE sont identifiés',
      'Les clés d\'API et les accès sont protégés',
      'Vous savez retrouver et supprimer les données d\'une personne'
    ],
    explication: 'Votre automatisation respecte le RGPD : c\'est un argument de vente auprès de vos clients.'
  },
  quiz: [
    q('Vous installez un chatbot qui collecte les demandes des clients d\'un salon. Quel est votre rôle ?', ['Responsable de traitement', 'Sous-traitant du salon', 'Aucun rôle', 'Autorité de contrôle'], 1, 'Le salon décide de la finalité ; vous traitez pour son compte.'),
    q('Quelle offre privilégier pour une automatisation qui traite des données de clients ?', ['Un compte gratuit partagé', 'L\'API, dont les données ne servent pas à l\'entraînement par défaut', 'N\'importe quel compte personnel', 'Aucune'], 1, 'L\'API relève des conditions commerciales.'),
    q('Que faire avant d\'analyser un export de clients avec Claude ?', ['Rien', 'Pseudonymiser les données identifiantes', 'Ajouter les numéros de carte', 'Le publier'], 1, 'La pseudonymisation réduit le risque.'),
    q('Combien de temps conserver les données d\'un prospect sans nouvelles ?', ['Indéfiniment', 'Trois ans au maximum après son dernier contact', 'Une semaine', 'Vingt ans'], 1, 'C\'est la recommandation de la CNIL pour la prospection.')
  ],
  script: script('10 min',
    'Votre client vous demande : « Mes données, elles vont où ? » Si vous savez répondre en trente secondes, vous signez. Voici la réponse.',
    ['Les principes du RGPD appliqués à l\'IA', 'Responsable de traitement ou sous-traitant', 'Les offres et réglages de Claude', 'Les transferts hors de l\'Union', 'Les bons réflexes', 'Le registre avec Claude'],
    'Faites l\'inventaire de vos traitements et rédigez votre registre.',
    'Le schéma des flux de données d\'une automatisation, puis la fiche registre générée et corrigée.'),
  sources: [
    { titre: 'CNIL : intelligence artificielle', url: 'https://www.cnil.fr/fr/intelligence-artificielle' },
    { titre: 'CNIL : guides et modèles pour les professionnels (registre, sous-traitance)', url: 'https://www.cnil.fr/fr/professionnel' },
    { titre: 'Anthropic : centre de confidentialité', url: 'https://privacy.anthropic.com' }
  ]
};

const L04 = {
  titre: 'AI Act : ce qui vous concerne',
  objectifs: ['Situer votre activité dans le règlement européen sur l\'IA', 'Connaître le calendrier et les obligations qui s\'appliquent déjà', 'Repérer les usages à risque à éviter ou à encadrer'],
  theorie: `${AVERT}
<h2>Le principe : des règles selon le risque</h2>
<p>Le règlement européen sur l'IA (AI Act, règlement 2024/1689) classe les usages de l'IA selon leur niveau de risque. Pour un indépendant ou une agence qui utilise Claude pour produire des contenus, des sites et des automatisations, l'essentiel tient en trois obligations : <strong>former</strong>, <strong>être transparent</strong>, et <strong>éviter les usages interdits ou à haut risque</strong> sans accompagnement.</p>
<h2>Le calendrier</h2>
${tableau(['Date', 'Ce qui s\'applique'], [
  ['1er août 2024', 'Entrée en vigueur du règlement'],
  ['2 février 2025', 'Pratiques interdites ; obligation de <strong>maîtrise de l\'IA</strong> (former les personnes qui utilisent l\'IA)'],
  ['2 août 2025', 'Obligations des fournisseurs de modèles d\'IA à usage général (ceux qui créent les modèles, comme Anthropic)'],
  ['2 août 2026', '<strong>Obligations de transparence</strong> (article 50) : chatbots, contenus générés, hypertrucages'],
  ['Décembre 2027 et août 2028', 'Obligations des systèmes à haut risque, reportées par le règlement de simplification (« omnibus numérique ») adopté en 2026']
])}
<h2>Votre rôle : le plus souvent « déployeur »</h2>
<ul>
  <li>Vous êtes <strong>déployeur</strong> quand vous utilisez un système d'IA dans votre activité professionnelle (Claude pour rédiger, ElevenLabs pour une voix).</li>
  <li>Vous pouvez devenir <strong>fournisseur</strong> d'un système d'IA si vous mettez sur le marché, sous votre nom, un outil fondé sur l'IA (un chatbot vendu en marque blanche, un micro-SaaS). Pour un système à risque limité, cela reste surtout une affaire de transparence ; pour un usage à haut risque, les obligations sont lourdes.</li>
</ul>
<h2>Ce qui vous concerne dès maintenant</h2>
${tableau(['Obligation', 'En pratique'], [
  ['Maîtrise de l\'IA (article 4)', 'Vous et les personnes qui travaillent avec vous devez avoir un niveau suffisant de compétence sur les outils utilisés, leurs limites et leurs risques. Gardez une trace de vos formations (cette formation en fait partie).'],
  ['Chatbot (article 50)', 'Informer les personnes qu\'elles échangent avec une IA, sauf si c\'est évident.'],
  ['Hypertrucages (article 50)', 'Signaler les images, sons ou vidéos réalistes générés ou manipulés (module 6, leçon 11).'],
  ['Textes d\'information (article 50)', 'Signaler un texte généré publié pour informer le public sur des sujets d\'intérêt général, sauf relecture humaine sous responsabilité éditoriale.'],
  ['Marquage', 'Ne pas retirer les filigranes et métadonnées que les fournisseurs ajoutent aux contenus générés.']
])}
<h2>Les pratiques interdites</h2>
<p>Depuis février 2025, sont notamment interdits : la manipulation subliminale ou exploitant les vulnérabilités, la notation sociale, la reconnaissance des émotions sur le lieu de travail ou à l'école (sauf raisons médicales ou de sécurité), la constitution de bases de reconnaissance faciale par aspiration non ciblée d'images, certaines catégorisations biométriques. Aucune offre légitime de ce cours n'en approche, mais refusez toute demande qui s'en rapprocherait.</p>
<h2>Les usages à haut risque</h2>
<p>Certains domaines sont classés à haut risque : <strong>recrutement et gestion du personnel</strong> (tri de CV, évaluation de candidats), accès à l'éducation et évaluation des élèves, accès au crédit et à l'assurance, services publics essentiels, et d'autres. Si un client vous demande d'automatiser une décision dans ces domaines (« Claude trie les candidatures et rejette les mauvaises »), arrêtez-vous : les obligations sont importantes (gestion des risques, documentation, contrôle humain, information des personnes), et le RGPD encadre aussi les décisions automatisées. Proposez plutôt une aide à la décision, avec une décision humaine, et faites-vous conseiller.</p>
<h2>Les sanctions</h2>
<p>Elles sont graduées : jusqu'à 35 millions d'euros ou 7 % du chiffre d'affaires mondial pour les pratiques interdites, jusqu'à 15 millions ou 3 % pour la plupart des autres manquements, dont la transparence. Pour une petite entreprise, c'est le montant le plus faible des deux qui s'applique.</p>
${encart('ok', 'Un argument de vente', '<p>Vos clients ont entendu parler de l\'AI Act sans savoir ce qu\'il implique. Leur expliquer en deux minutes ce qui les concerne, et livrer des automatisations transparentes et documentées, vous distingue de concurrents moins rigoureux.</p>')}
${MAJ}`,
  pas: [
    pas('Listez vos usages de l\'IA', 'Les vôtres et ceux que vous installez chez vos clients.'),
    pas('Classez-les', 'Usage courant, transparence requise, haut risque, interdit.'),
    pas('Documentez votre maîtrise de l\'IA', 'Formations suivies, règles internes, pour vous et vos éventuels collaborateurs.'),
    pas('Ajoutez les mentions de transparence', 'Chatbots, contenus générés réalistes, textes d\'information.'),
    pas('Rédigez votre règle de refus', 'Les demandes que vous refusez ou pour lesquelles vous exigez un accompagnement juridique.')
  ],
  exercice: {
    type: 'qcm', titre: 'Classer un usage',
    enonce: '<p>Un cabinet de recrutement vous demande une automatisation : Claude lit les CV reçus, attribue une note à chaque candidat et envoie automatiquement un refus à ceux qui ont moins de 60/100. Comment qualifier cette demande au regard de l\'AI Act ?</p>',
    options: ['Usage courant sans obligation particulière', 'Usage à haut risque (recrutement) : à ne pas livrer tel quel ; proposer une aide à la décision avec décision humaine et un accompagnement juridique', 'Pratique interdite dans tous les cas', 'Simple obligation de mention « généré par IA »'],
    bonne: 1,
    explication: 'Le tri de candidatures relève des usages à haut risque, et une décision automatique de refus pose aussi problème au regard du RGPD.'
  },
  quiz: [
    q('Depuis quand l\'obligation de maîtrise de l\'IA (article 4) s\'applique-t-elle ?', ['2 février 2025', '2 août 2026', '2028', 'Elle n\'existe pas'], 0, 'Avec les pratiques interdites, en février 2025.'),
    q('Quand vous utilisez Claude pour vos prestations, quel est en général votre rôle ?', ['Fournisseur de modèle', 'Déployeur', 'Autorité de contrôle', 'Aucun'], 1, 'Vous utilisez un système d\'IA dans votre activité professionnelle.'),
    q('Un chatbot installé sur le site d\'un client doit :', ['Se faire passer pour un humain', 'Informer les visiteurs qu\'ils échangent avec une IA', 'Collecter un maximum de données', 'Rester anonyme'], 1, 'Obligation de transparence de l\'article 50.'),
    q('Les obligations des systèmes à haut risque s\'appliquent-elles depuis août 2026 ?', ['Oui', 'Non, elles ont été reportées à décembre 2027 et août 2028', 'Elles ont été supprimées', 'Seulement en France'], 1, 'Le règlement de simplification de 2026 les a reportées ; la transparence, elle, s\'applique.')
  ],
  script: script('9 min',
    'L\'AI Act fait peur à vos clients. En réalité, pour 95 % de ce que vous allez vendre, il tient en trois règles. Les voici, avec les deux pièges à éviter.',
    ['Un règlement fondé sur le risque', 'Le calendrier', 'Déployeur ou fournisseur', 'Ce qui s\'applique déjà', 'Interdits et haut risque', 'Sanctions, et l\'argument de vente'],
    'Classez vos usages et documentez votre maîtrise de l\'IA.',
    'Le calendrier en frise, puis le classement de cinq demandes de clients.'),
  sources: [
    { titre: 'Règlement (UE) 2024/1689 sur l\'IA (EUR-Lex)', url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj' },
    { titre: 'Commission européenne : cadre réglementaire de l\'IA', url: 'https://digital-strategy.ec.europa.eu/fr/policies/regulatory-framework-ai' },
    { titre: 'CNIL : entrée en application du règlement IA', url: 'https://www.cnil.fr/fr/intelligence-artificielle' }
  ]
};

export default {
  intro: `<p>Gagner de l'argent avec Claude, c'est aussi le faire dans les règles : un statut adapté, des factures conformes (et prêtes pour la facture électronique), des données clients protégées, et une utilisation de l'IA conforme au règlement européen. Ce module vous donne les repères à jour et les bons réflexes, à valider avec vos conseils.</p>`,
  lecons: [L01, L02, L03, L04]
};
