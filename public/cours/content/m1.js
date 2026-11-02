import { encart, tableau, pas, q, crit, mots, script } from './_outils.js';

const MAJ = '<p class="muted small">Informations vérifiées en novembre 2026. Les offres, les noms de menus et les limites évoluent souvent : en cas de doute, la page officielle fait foi.</p>';

export default {
  intro: `<p>Ce module vous rend autonome sur Claude, l'assistant d'Anthropic : choisir la bonne offre, travailler proprement dans l'interface, organiser vos clients en Projets, produire des livrables avec les Artifacts, brancher la recherche et vos outils, régler la mémoire et la confidentialité, et choisir le bon modèle pour chaque tâche.</p>`,
  lecons: [
    {
      titre: 'Comptes et offres : choisir sans se tromper',
      objectifs: ['Distinguer les offres grand public, équipe et l\'API', 'Choisir l\'offre adaptée à votre activité', 'Sécuriser votre compte et votre facturation'],
      theorie: `<p>Claude s'utilise de trois façons : l'application (sur claude.ai, sur ordinateur et sur mobile), <strong>Claude Code</strong> pour coder et automatiser depuis un terminal ou le web, et l'<strong>API</strong> pour intégrer Claude dans vos propres outils. Les deux premiers dépendent de votre abonnement ; l'API se paie à l'usage, séparément.</p>
<h2>Les offres de l'application</h2>
${tableau(['Offre', 'Prix indicatif', 'Pour qui', 'Ce qu\'elle apporte'], [
  ['Free', '0 €', 'Découvrir', 'Conversations sur le web, ordinateur et mobile, recherche web, Artifacts, avec un volume d\'usage limité.'],
  ['Pro', 'environ 20 $ par mois (moins en annuel)', 'Indépendant qui démarre', 'Nettement plus d\'usage, accès aux modèles les plus avancés, Claude Code, recherche approfondie, connecteurs, Projets sans limite pratique.'],
  ['Max', 'environ 100 $ ou 200 $ par mois', 'Usage intensif, Claude Code au quotidien', 'Cinq ou vingt fois l\'usage de Pro, priorité d\'accès aux nouveautés.'],
  ['Team', 'par utilisateur et par mois', 'Agence ou équipe', 'Facturation centralisée, administration, partage de Projets ; données non utilisées pour l\'entraînement par défaut.'],
  ['Enterprise', 'sur devis', 'Grandes structures', 'Authentification unique (SSO), contrôles d\'administration et de conservation des données, contrat dédié.']
])}
<p>Les prix sont affichés hors taxes, en dollars, sur la page officielle des offres ; la TVA s'ajoute pour un achat en France. Vérifiez toujours <strong>claude.com/pricing</strong> avant de vous abonner.</p>
<h2>Les limites d'usage</h2>
<p>Les abonnements ne sont pas « illimités » : l'usage est compté sur des fenêtres de quelques heures, avec en plus des plafonds hebdomadaires sur certaines offres. Ce qui consomme le plus : les longues conversations (tout l'historique est relu à chaque message), les gros fichiers, les modèles les plus puissants et la réflexion étendue. Les réglages pour économiser votre quota sont vus dans les leçons 2 et 7.</p>
<h2>L'API, un compte à part</h2>
<p>Pour automatiser (module 5), vous créerez un compte sur la <strong>Claude Console</strong> (platform.claude.com) : clé d'API, crédits prépayés, facturation au million de jetons. Votre abonnement Pro ne donne pas de crédits API, et inversement.</p>
<h2>Quelle offre choisir</h2>
<ul>
  <li><strong>Modules 0 et 1</strong> : l'offre gratuite suffit.</li>
  <li><strong>À partir du module 2</strong> : Pro. C'est l'investissement de base d'un indépendant qui vend des prestations avec Claude.</li>
  <li><strong>Module 4 au quotidien</strong> (Claude Code sur des projets clients) : envisagez Max quand vous atteignez régulièrement les limites de Pro.</li>
  <li><strong>Agence de plusieurs personnes</strong> : Team, pour l'administration et la confidentialité des données clients.</li>
</ul>
<h2>Sécuriser son compte</h2>
<ul>
  <li>Utilisez une adresse email professionnelle protégée par la double authentification : la connexion à Claude passe par cette boîte (lien de connexion) ou par un compte Google ou Apple.</li>
  <li>Renseignez vos informations d'entreprise dans la facturation pour obtenir des factures exploitables en comptabilité, et conservez-les.</li>
  <li>Ne partagez jamais un compte entre plusieurs personnes : c'est contraire aux conditions d'utilisation et vous perdez la maîtrise des données.</li>
</ul>
${MAJ}`,
      pas: [
        pas('Ouvrez la page des offres', 'Sur claude.com/pricing, relevez le prix actuel de Pro et de Max, en mensuel et en annuel.'),
        pas('Créez ou vérifiez votre compte', 'Connectez-vous avec votre adresse professionnelle. Activez la double authentification sur cette boîte mail.'),
        pas('Installez les applications', 'Application de bureau (macOS ou Windows) et application mobile : vos conversations sont synchronisées.'),
        pas('Repérez votre consommation', 'Dans les paramètres, trouvez la section qui indique votre usage et vos limites.'),
        pas('Décidez de votre offre', 'Gratuit pour ce module ; notez dans votre carnet la date à laquelle vous passerez à Pro.')
      ],
      exercice: {
        type: 'qcm', titre: 'Le bon choix d\'offre',
        enonce: '<p>Karim lance une activité de création de contenus pour des commerçants. Il veut utiliser Claude tous les jours, accéder à Claude Code pour créer de petites pages web, et automatiser plus tard des réponses aux avis Google via n8n. De quoi a-t-il besoin ?</p>',
        options: ['De l\'offre Free uniquement', 'D\'un abonnement Pro, puis d\'un compte API séparé pour les automatisations', 'D\'une offre Enterprise', 'D\'un abonnement Pro, qui inclut des crédits API illimités'],
        bonne: 1,
        explication: 'Pro couvre l\'usage quotidien et Claude Code ; l\'automatisation via n8n passe par l\'API, facturée à l\'usage sur un compte Console distinct.'
      },
      quiz: [
        q('Votre abonnement Pro donne-t-il des crédits pour l\'API ?', ['Oui, illimités', 'Oui, 20 $ par mois', 'Non, l\'API se paie à part, à l\'usage', 'Seulement en annuel'], 2, 'L\'abonnement et l\'API sont deux comptes de facturation distincts.'),
        q('Qu\'est-ce qui consomme le plus vite votre quota d\'usage ?', ['Les conversations courtes', 'Les longues conversations avec de gros fichiers et les modèles les plus puissants', 'Le mode sombre', 'Les Projets vides'], 1, 'Chaque message relit l\'historique : une conversation longue et chargée coûte plus cher à chaque échange.'),
        q('Pour une agence de 6 personnes qui manipule des données clients, quelle offre privilégier ?', ['6 comptes Free', 'Un compte Pro partagé', 'Team', 'Aucune'], 2, 'Team apporte administration, facturation centralisée, et les données ne servent pas à l\'entraînement par défaut.'),
        q('Où vérifier les prix actuels ?', ['Sur un forum', 'Sur la page officielle des offres', 'Dans cette leçon uniquement', 'Auprès d\'un concurrent'], 1, 'Les prix évoluent : la page officielle fait foi.')
      ],
      script: script('5 min',
        'Free, Pro, Max, Team, API : la moitié des débutants paient pour la mauvaise offre. En cinq minutes, vous saurez laquelle prendre.',
        ['Les trois façons d\'utiliser Claude : application, Claude Code, API', 'Le tableau des offres et à qui elles s\'adressent', 'Les limites d\'usage et ce qui les consomme', 'Pourquoi l\'API est un compte séparé', 'Ma recommandation selon votre étape'],
        'Notez dans votre carnet l\'offre que vous prendrez au module 2, et passez à la leçon sur l\'interface.',
        'Page des offres à l\'écran, puis paramètres d\'usage du compte.')
    },
    {
      titre: 'L\'interface et les bons réflexes',
      objectifs: ['Maîtriser les fonctions de base de la conversation', 'Gérer les longues conversations sans perdre en qualité', 'Adopter cinq réflexes de professionnel'],
      theorie: `<p>L'interface de Claude paraît simple, mais quelques fonctions changent tout dans un usage professionnel.</p>
<h2>Ce qu'il faut connaître</h2>
<ul>
  <li><strong>Pièces jointes</strong> : PDF, images, captures d'écran, documents texte, tableurs. Un long texte collé devient automatiquement une pièce jointe.</li>
  <li><strong>Modifier un message envoyé</strong> : survolez votre message, modifiez-le, renvoyez. Claude repart de ce point et crée une branche : vous pouvez naviguer entre les versions avec les flèches. Idéal pour tester deux formulations.</li>
  <li><strong>Relancer une réponse</strong> : pour obtenir une autre proposition sans toucher à votre demande.</li>
  <li><strong>Le menu des outils</strong> (sous la zone de saisie) : recherche web, connecteurs, styles, réflexion étendue. Ces réglages s'appliquent à la conversation en cours.</li>
  <li><strong>Le sélecteur de modèle</strong> : en haut ou près de la zone de saisie selon l'appareil (leçon 7).</li>
  <li><strong>Le mode vocal et la dictée</strong> sur mobile : pratiques pour enregistrer une idée de contenu ou préparer un rendez-vous en voiture.</li>
  <li><strong>L'historique</strong> : renommez vos conversations importantes, mettez-les en favoris, et utilisez la recherche.</li>
</ul>
<h2>Les longues conversations</h2>
<p>Chaque message relit toute la conversation. Plus elle est longue, plus elle consomme et plus le risque augmente que des détails du début soient moins bien pris en compte. Quand une conversation dépasse quelques dizaines d'échanges ou change de sujet :</p>
<ol>
  <li>demandez : « Résume les décisions prises, les contraintes et la prochaine étape en 10 lignes » ;</li>
  <li>ouvrez une nouvelle conversation (idéalement dans le bon Projet) et collez ce résumé.</li>
</ol>
<h2>Cinq réflexes de professionnel</h2>
<ol>
  <li><strong>Le contexte d'abord</strong> : qui est le client, quel est l'objectif, quelles contraintes. Une ligne de contexte vaut dix relances.</li>
  <li><strong>Un objectif par conversation</strong> : « page d'accueil du salon Élégance », pas « tout le marketing du salon ».</li>
  <li><strong>Demander des questions</strong> : « Avant de rédiger, pose-moi les 5 questions qui te manquent. »</li>
  <li><strong>Vérifier ce qui doit l'être</strong> : chiffres, dates, citations, mentions légales, prix. Claude peut se tromper avec assurance.</li>
  <li><strong>Protéger les données</strong> : ne collez pas d'informations personnelles sensibles de vos clients sans nécessité (leçon 6 et module 8).</li>
</ol>
${encart('info', 'Astuce : la phrase qui améliore presque tout', '<p>« Si quelque chose n\'est pas clair ou te manque pour bien faire, demande-moi avant de commencer. » Elle évite les réponses génériques et vous fait gagner des allers-retours.</p>')}
${MAJ}`,
      pas: [
        pas('Joignez un document', 'Ouvrez une conversation, joignez un PDF ou une capture d\'écran (une brochure, un menu de restaurant) et demandez un résumé en 5 points.'),
        pas('Créez une branche', 'Modifiez votre demande pour viser un autre public (« pour un client pressé »), renvoyez, puis comparez les deux versions avec les flèches.'),
        pas('Testez le menu des outils', 'Activez la recherche web, posez une question d\'actualité sur votre secteur, et observez les sources citées.'),
        pas('Faites un résumé de passation', 'Demandez le résumé des décisions en 10 lignes, puis ouvrez une nouvelle conversation et collez-le.'),
        pas('Organisez votre historique', 'Renommez vos conversations de test avec un nom explicite et mettez-en une en favori.')
      ],
      exercice: {
        type: 'texte', titre: 'Votre première demande professionnelle',
        enonce: '<p>Rédigez une demande que vous enverrez réellement à Claude pour une tâche de votre activité (un email à un prospect, une description de service, un post). Elle doit contenir : le <strong>contexte</strong> (qui, pour qui), l\'<strong>objectif</strong>, au moins une <strong>contrainte</strong> (longueur, ton, éléments à inclure) et la consigne de <strong>poser des questions</strong> si nécessaire. Envoyez-la, puis collez-la ici.</p>',
        criteres: [
          mots(50),
          crit('Donne un contexte (pour qui, quelle activité)', /(je suis|mon client|ma cliente|pour (un|une|le|la|les)|mon activité|ma société|mon entreprise)/i),
          crit('Fixe une contrainte de format ou de ton', /(mots|lignes|caractères|ton|style|format|tutoie|vouvoie|phrase|paragraphe|liste)/i),
          crit('Demande à Claude de poser des questions', /(pose|poser|demande|questions?)\b.*\b(avant|si|manque|pas clair)|questions?/i)
        ],
        solution: '<p>« Je suis gestionnaire de réseaux sociaux indépendante et ma cliente est une fleuriste de quartier à Toulouse (Les Jardins d\'Inès). Rédige un email de 120 mots maximum pour annoncer à ses clients fidèles la nouvelle formule d\'abonnement bouquet mensuel à 35 €. Ton chaleureux, vouvoiement, une seule incitation à l\'action : réserver en boutique ou par téléphone. Si une information te manque pour bien faire, pose-moi tes questions avant de rédiger. »</p>',
        explication: 'Votre demande contient les éléments clés. Comparez la réponse obtenue à celle d\'une demande en une seule phrase : la différence est souvent nette.'
      },
      quiz: [
        q('Que se passe-t-il quand vous modifiez un message déjà envoyé ?', ['La conversation est supprimée', 'Claude repart de ce point et crée une branche', 'Rien', 'Le message est envoyé deux fois'], 1, 'Les branches permettent de comparer plusieurs versions d\'une même demande.'),
        q('Une conversation devient très longue et change de sujet. Que faire ?', ['Continuer indéfiniment', 'Demander un résumé et repartir dans une nouvelle conversation', 'Supprimer son compte', 'Passer en mode sombre'], 1, 'Le résumé de passation garde l\'essentiel et allège le contexte.'),
        q('Quelle information devez-vous toujours vérifier vous-même ?', ['La mise en forme', 'Les chiffres, les dates, les mentions légales et les prix', 'Le nombre de paragraphes', 'Aucune'], 1, 'Claude peut se tromper avec assurance sur des faits précis.'),
        q('Quel réflexe évite le plus de réponses génériques ?', ['Écrire en majuscules', 'Donner le contexte et inviter Claude à poser ses questions', 'Envoyer dix messages courts', 'Utiliser uniquement des mots-clés'], 1, 'Le contexte et les questions préalables orientent Claude vers votre vrai besoin.')
      ],
      script: script('6 min',
        'Le même outil, deux personnes, deux résultats complètement différents. La différence tient en cinq réflexes.',
        ['Tour de l\'interface : pièces jointes, outils, modèle', 'Modifier un message et naviguer entre les branches', 'Les longues conversations : le résumé de passation', 'Les cinq réflexes de professionnel', 'La phrase qui améliore presque tout'],
        'Faites l\'exercice : envoyez votre première demande professionnelle et collez-la dans la leçon.',
        'Démonstration en direct : même demande en une phrase puis avec contexte, comparaison des deux réponses.')
    },
    {
      titre: 'Les Projets : un espace par client',
      objectifs: ['Créer un Projet avec des instructions et des documents', 'Organiser son activité avec un Projet par client', 'Rédiger des instructions de projet efficaces'],
      theorie: `<p>Un <strong>Projet</strong> regroupe des conversations qui partagent les mêmes <strong>instructions</strong> et la même <strong>base de connaissances</strong> (vos fichiers). Toute nouvelle conversation créée dans le Projet connaît déjà le client, son ton, ses offres. C'est l'outil central d'un indépendant qui gère plusieurs clients.</p>
<h2>Ce qu'on met dans un Projet</h2>
<ul>
  <li><strong>Les instructions</strong> : qui est le client, à qui il s'adresse, son ton, ses interdits, le format attendu des livrables.</li>
  <li><strong>Les connaissances</strong> : charte graphique ou éditoriale, fiche entreprise, FAQ, grille tarifaire, anciens contenus qui ont bien marché, avis clients, transcription d'un appel de découverte.</li>
  <li><strong>Les conversations</strong> : une par livrable ou par mois de travail.</li>
</ul>
<p>Quand la base de connaissances devient volumineuse, Claude n'en lit pas tout à chaque message : il recherche les passages pertinents. Des documents bien nommés et bien structurés (titres, sections) donnent de meilleurs résultats qu'un seul gros fichier fourre-tout.</p>
<h2>L'organisation recommandée</h2>
${tableau(['Projet', 'Contenu'], [
  ['Mon activité', 'Votre offre, vos prix, votre ton, vos modèles d\'emails et de propositions. Votre assistant commercial.'],
  ['Client — Nom du client', 'Un Projet par client actif : instructions, documents fournis, livrables validés.'],
  ['Atelier vidéo', 'Vos formats de scripts, accroches qui fonctionnent, consignes pour la chaîne vidéo (module 6).'],
  ['Veille', 'Sources, notes et synthèses sur votre secteur.']
])}
<h2>Des instructions de projet qui fonctionnent</h2>
<p>Elles se rédigent comme une fiche de poste pour un collaborateur brillant qui ne connaît rien au client :</p>
<pre class="prompt">Tu travailles pour [client], [activité] à [ville].
Public : [cible] ; ce qu'ils attendent : [bénéfices].
Ton : [3 adjectifs]. Vouvoiement. Jamais de [interdits].
Avant chaque livrable, vérifie la cohérence avec les documents du projet
(charte, tarifs, FAQ). Si une information manque, pose la question.
Format par défaut : [format]. Termine par 2 idées d'amélioration.</pre>
<h2>Mémoire et partage</h2>
<ul>
  <li>Quand la mémoire est activée (leçon 6), chaque Projet a sa propre mémoire : les informations d'un client ne se mélangent pas avec celles d'un autre.</li>
  <li>Avec l'offre Team, un Projet peut être partagé avec vos collaborateurs, qui retrouvent les mêmes instructions et documents.</li>
  <li>Les données des clients restent des données des clients : n'y déposez que ce qui est utile au travail (module 8).</li>
</ul>
${MAJ}`,
      pas: [
        pas('Créez le Projet « Mon activité »', 'Menu Projets, puis créer un projet. Décrivez en deux phrases ce que vous voulez vendre (même provisoirement).'),
        pas('Rédigez les instructions', 'Utilisez le modèle de la leçon : cible, ton, interdits, format, consigne de poser des questions.'),
        pas('Ajoutez trois documents', 'Votre point de départ (exercice du module 0), une description de votre parcours, un exemple de contenu que vous aimez.'),
        pas('Lancez une conversation de test', 'Dans le Projet : « Propose-moi 3 offres que je pourrais vendre, en t\'appuyant sur mes documents. »'),
        pas('Créez un Projet client fictif', 'Par exemple « Client — Boulangerie du Capitole » avec des instructions inventées, pour vous entraîner pendant la formation.')
      ],
      exercice: {
        type: 'texte', titre: 'Les instructions de votre Projet client',
        enonce: '<p>Rédigez les instructions complètes d\'un Projet pour un client réel ou fictif. Elles doivent préciser : l\'<strong>activité et la ville</strong>, la <strong>cible</strong>, le <strong>ton</strong>, au moins un <strong>interdit</strong>, le <strong>format</strong> par défaut, et la consigne de vérifier les documents ou de poser des questions.</p>',
        criteres: [
          mots(70),
          crit('Décrit le public ou la cible', /(public|cible|clients?|clientèle|s'adresse)/i),
          crit('Précise le ton', /\bton\b|style|registre/i),
          crit('Fixe au moins un interdit', /(jamais|pas de|ne pas|n'utilise pas|interdit|évite)/i),
          crit('Demande de vérifier les documents ou de poser des questions', /(document|charte|fichier|base|vérifie|pose.*question|question)/i)
        ],
        solution: '<p>« Tu travailles pour la Boulangerie du Capitole, boulangerie artisanale à Toulouse (centre-ville). Public : actifs du quartier et familles le week-end ; ils attendent de la qualité, de la rapidité le midi et des produits de saison. Ton : chaleureux, gourmand, simple. Vouvoiement. Jamais de superlatifs vides (« le meilleur pain du monde »), jamais de promesse de prix non validée. Avant chaque livrable, vérifie la cohérence avec la carte et les horaires fournis dans les documents du projet ; si une information manque, pose-moi la question. Format par défaut : posts Instagram de 80 à 120 mots avec 3 suggestions de visuels. Termine par deux idées d\'amélioration. »</p>',
        explication: 'Instructions complètes. Collez-les dans votre Projet client et testez avec une demande de contenu.'
      },
      quiz: [
        q('Que partagent les conversations d\'un même Projet ?', ['Rien', 'Les instructions et la base de connaissances', 'Uniquement le titre', 'Le mot de passe'], 1, 'C\'est tout l\'intérêt : chaque conversation démarre avec le contexte du client.'),
        q('Pourquoi un Projet par client ?', ['C\'est obligatoire', 'Pour que les instructions, documents et mémoires ne se mélangent pas', 'Pour payer moins cher', 'Pour aller plus vite à taper'], 1, 'L\'isolement par client évite les erreurs de ton ou d\'informations et protège la confidentialité.'),
        q('Quelle base de connaissances donne les meilleurs résultats ?', ['Un seul énorme fichier non structuré', 'Des documents bien nommés et structurés par sections', 'Aucun document', 'Uniquement des images'], 1, 'Sur une base volumineuse, Claude recherche les passages utiles : la structure l\'aide à trouver le bon.'),
        q('Que doivent contenir de bonnes instructions de projet ?', ['Uniquement le nom du client', 'Contexte, cible, ton, interdits, format et consigne de vérification', 'Une liste de mots-clés', 'Le prix de l\'abonnement'], 1, 'Ce sont les éléments qu\'on donnerait à un nouveau collaborateur.')
      ],
      script: script('6 min',
        'Si vous avez trois clients et une seule conversation, vous allez finir par écrire au fleuriste avec le ton du garagiste.',
        ['Ce qu\'est un Projet : instructions, connaissances, conversations', 'L\'organisation : Mon activité, un Projet par client, Atelier vidéo, Veille', 'Le modèle d\'instructions, ligne par ligne', 'Mémoire par projet et partage en équipe', 'Démonstration : création d\'un Projet client en 3 minutes'],
        'Créez votre Projet « Mon activité » maintenant et collez vos instructions dans l\'exercice.',
        'Création d\'un Projet de A à Z : instructions, ajout de deux fichiers, première conversation.')
    },
    {
      titre: 'Les Artifacts : produire des livrables',
      objectifs: ['Savoir quand Claude crée un Artifact et comment l\'itérer', 'Créer une page, un document et un petit outil interactif', 'Partager un Artifact et connaître ses limites'],
      theorie: `<p>Un <strong>Artifact</strong> est un contenu autonome que Claude affiche à côté de la conversation : un document, une page web, un schéma, un composant ou une petite application. On le modifie par la conversation, on garde ses versions, on peut le copier, le télécharger ou le partager.</p>
<h2>Ce qu'on peut créer</h2>
${tableau(['Type', 'Exemples pour vos clients'], [
  ['Document (texte mis en forme)', 'Proposition commerciale, charte éditoriale, guide d\'accueil, plan de contenus'],
  ['Page web (HTML)', 'Maquette de page d\'accueil, page de présentation d\'une offre, menu de restaurant consultable'],
  ['Schéma ou diagramme', 'Parcours client, organigramme, chaîne d\'automatisation'],
  ['Application interactive', 'Simulateur de devis, quiz de recommandation produit, calculateur de rentabilité, checklist']
])}
<p>Claude crée un Artifact de lui-même quand le contenu est long ou réutilisable. Vous pouvez aussi le demander : « Crée un Artifact avec… ».</p>
<h2>Itérer comme un pro</h2>
<ul>
  <li>Demandez des changements ciblés : « Dans la section Tarifs, passe en 3 colonnes et ajoute une ligne Options. »</li>
  <li>Une demande à la fois quand le contenu est complexe ; plusieurs petites corrections valent mieux qu'une refonte.</li>
  <li>Naviguez entre les versions pour revenir en arrière si une modification n'est pas bonne.</li>
  <li>Pour un outil interactif, testez-le vous-même dans l'aperçu comme le ferait un client, puis décrivez précisément ce qui ne va pas.</li>
</ul>
<h2>Partager et réutiliser</h2>
<p>Un Artifact peut être publié par un lien que d'autres personnes peuvent ouvrir, et parfois reprendre à leur compte pour l'adapter. Certains Artifacts intègrent l'IA elle-même (une application qui appelle Claude) : l'usage est alors décompté sur le compte de la personne qui utilise l'application, pas sur le vôtre. Les options exactes de partage dépendent de votre offre et de vos réglages.</p>
<h2>Les limites à connaître</h2>
<ul>
  <li>Un Artifact n'est <strong>pas un hébergement professionnel</strong> : pour livrer un vrai site à un client, on exporte le code et on le met en ligne sur un hébergeur, avec un nom de domaine et des mentions légales (module 3, leçon 2).</li>
  <li>Un Artifact publié est accessible à toute personne qui a le lien : n'y mettez pas de données confidentielles.</li>
  <li>Pour des fichiers Word, Excel, PowerPoint ou PDF, Claude peut aussi créer de vrais fichiers téléchargeables (module 3, leçon 3).</li>
</ul>
${encart('ok', 'Idée de vente immédiate', '<p>Un simulateur de devis en Artifact pour un artisan (« Combien coûte ma salle de bain ? ») fait une démonstration très parlante en rendez-vous. Vous le transformerez en vrai outil en ligne au module 4.</p>')}
${MAJ}`,
      pas: [
        pas('Créez une page', 'Dans votre Projet client fictif : « Crée un Artifact : page d\'accueil d\'une page, en HTML, pour [client], avec titre, 3 services, avis, horaires et bouton d\'appel. »'),
        pas('Itérez trois fois', 'Trois demandes ciblées : une couleur et une police, une section ajoutée, un texte raccourci. Naviguez entre les versions.'),
        pas('Créez un outil interactif', '« Crée un simulateur de devis : l\'utilisateur choisit la surface, la gamme et les options, le prix estimé s\'affiche avec la mention “estimation indicative”. »'),
        pas('Testez comme un client', 'Utilisez le simulateur, notez deux défauts, demandez leur correction.'),
        pas('Partagez ou exportez', 'Copiez le code ou téléchargez l\'Artifact, ou publiez-le par lien si votre offre le permet. Notez l\'adresse dans votre carnet de bord.')
      ],
      exercice: {
        type: 'texte', titre: 'Le cahier des charges d\'un Artifact vendable',
        enonce: '<p>Décrivez un Artifact interactif utile à un client précis (simulateur, quiz, calculateur, checklist). Indiquez : le <strong>client et son problème</strong>, ce que l\'utilisateur <strong>saisit</strong>, ce que l\'outil <strong>affiche</strong>, une <strong>mention de prudence</strong> si nécessaire (estimation, information non contractuelle), puis créez-le dans Claude et notez vos corrections.</p>',
        criteres: [
          mots(60),
          crit('Décrit ce que l\'utilisateur saisit ou choisit', /(saisit|choisit|sélectionne|entre|renseigne|coche|indique)/i),
          crit('Décrit ce que l\'outil affiche ou calcule', /(affiche|calcule|résultat|estimation|recommande|score|total)/i),
          crit('Prévoit une mention de prudence', /(indicati|non contractuel|estimation|à titre|sous réserve|prudence)/i)
        ],
        solution: '<p>« Client : un plaquiste-peintre à Muret. Problème : il perd du temps au téléphone avec des demandes de prix vagues. Artifact : un simulateur où l\'utilisateur choisit le type de pièce, saisit la surface en m², coche les options (enduit, peinture plafond, protection des sols) et sa ville. L\'outil affiche une fourchette de prix et le délai d\'intervention, avec la mention « estimation indicative, devis gratuit sur visite » et un bouton d\'appel. Corrections faites : arrondi des prix à la dizaine, ajout d\'une option « pièce humide », bouton plus visible sur mobile. »</p>',
        explication: 'Cahier des charges solide. Gardez cet Artifact : il rejoindra votre portfolio de démonstrations.'
      },
      quiz: [
        q('Pourquoi un Artifact ne remplace-t-il pas un site client ?', ['Il est trop lent', 'Ce n\'est pas un hébergement professionnel : pas de domaine du client, pas de mentions légales, pas de maîtrise de l\'hébergement', 'Il ne gère pas le HTML', 'Il est payant'], 1, 'Pour livrer, on exporte et on met en ligne sur un hébergeur (module 3).'),
        q('Comment itérer efficacement sur un Artifact complexe ?', ['Tout redemander d\'un coup', 'Des demandes ciblées, une à la fois, en vérifiant chaque version', 'Ne jamais le modifier', 'Recommencer une conversation à chaque fois'], 1, 'Les modifications ciblées évitent de casser ce qui fonctionnait.'),
        q('Un Artifact qui intègre l\'IA est utilisé par un visiteur. Sur quel compte l\'usage est-il décompté ?', ['Sur le vôtre', 'Sur celui de la personne qui l\'utilise', 'Sur personne', 'Sur celui d\'Anthropic'], 1, 'L\'usage est décompté sur le compte de l\'utilisateur de l\'application.'),
        q('Que ne faut-il jamais mettre dans un Artifact publié par lien ?', ['Des couleurs', 'Des données confidentielles', 'Un titre', 'Des boutons'], 1, 'Toute personne disposant du lien peut l\'ouvrir.')
      ],
      script: script('7 min',
        'Ce simulateur de devis, je l\'ai créé en quatre messages. C\'est le genre d\'outil qui fait signer un artisan en rendez-vous.',
        ['Ce qu\'est un Artifact et ce qu\'on peut créer', 'Démonstration : page d\'accueil, puis trois itérations ciblées', 'Démonstration : simulateur de devis interactif', 'Partager, exporter, et les limites', 'Comment l\'utiliser en prospection'],
        'Créez votre premier Artifact interactif et décrivez-le dans l\'exercice : il ira dans votre portfolio.',
        'Écran partagé : conversation à gauche, Artifact à droite, navigation entre les versions.')
    },
    {
      titre: 'Recherche web, recherche approfondie et connecteurs',
      objectifs: ['Utiliser la recherche web et vérifier les sources', 'Lancer une recherche approfondie pour une étude de marché', 'Brancher vos outils avec les connecteurs, en sécurité'],
      theorie: `<h2>La recherche web</h2>
<p>Activée depuis le menu des outils, elle permet à Claude d'aller chercher des informations récentes et de <strong>citer ses sources</strong>. Utilisez-la pour tout ce qui change : actualité d'un secteur, prix publics, réglementation, concurrents. Ouvrez toujours deux ou trois sources citées : une source peut être ancienne, partiale ou mal résumée.</p>
<h2>La recherche approfondie</h2>
<p>La recherche approfondie (selon votre offre) enchaîne de nombreuses recherches et lectures pendant plusieurs minutes, puis rédige un rapport structuré avec citations. Idéale pour :</p>
<ul>
  <li>une étude de marché locale (« les salons de coiffure à Toulouse qui proposent la réservation en ligne : offres, prix publics, positionnement ») ;</li>
  <li>la préparation d'un rendez-vous (« ce qu'on peut savoir publiquement de cette entreprise et de son secteur ») ;</li>
  <li>une veille réglementaire, à vérifier ensuite sur les sources officielles.</li>
</ul>
<p>Donnez un cadre précis : périmètre géographique, période, types de sources à privilégier ou à exclure, format du rapport attendu.</p>
<h2>Les connecteurs</h2>
<p>Les connecteurs donnent à Claude un accès à vos outils : messagerie, agenda et documents (Gmail, Google Agenda, Google Drive), ainsi qu'un répertoire d'outils tiers (gestion de projet, design, notes, paiement…). Ils reposent sur un standard ouvert, le <strong>Model Context Protocol (MCP)</strong>. Vous pouvez aussi ajouter un <strong>connecteur personnalisé</strong> en indiquant l'adresse d'un serveur MCP distant, et l'application de bureau accepte des extensions qui tournent sur votre ordinateur.</p>
${tableau(['Usage', 'Exemple de demande'], [
  ['Préparer sa journée', '« Regarde mon agenda de demain et prépare une fiche par rendez-vous avec les derniers échanges email. »'],
  ['Retrouver un document', '« Dans mon Drive, retrouve le devis envoyé à la boulangerie en septembre et résume les options. »'],
  ['Rédiger une réponse', '« Propose une réponse au dernier email de Mme Martin, sans l\'envoyer. »']
])}
<h2>Sécurité : les règles</h2>
<ul>
  <li><strong>N'activez que ce qui sert</strong>, et désactivez un connecteur quand vous n'en avez plus besoin.</li>
  <li><strong>Gardez la main sur les actions</strong> : Claude vous demande une autorisation avant d'utiliser un outil ; lisez ce qu'il s'apprête à faire, surtout pour l'envoi, la modification ou la suppression.</li>
  <li><strong>Méfiez-vous des contenus piégés</strong> : un email ou une page web peut contenir des instructions cachées destinées à l'IA (« injection de prompt »). Ne laissez pas Claude agir sur la base d'un contenu externe sans relire.</li>
  <li>N'installez que des connecteurs de sources fiables (éditeur officiel ou répertoire de l'application).</li>
</ul>
${encart('info', 'Pour la suite', '<p>Les connecteurs MCP prennent toute leur puissance dans Claude Code (module 4) et pour piloter les outils vidéo (module 6).</p>')}
${MAJ}`,
      pas: [
        pas('Recherche web', 'Activez-la et demandez : « Quelles sont les 3 tendances récentes du marketing pour les commerces de proximité en France ? Cite tes sources. » Ouvrez deux sources.'),
        pas('Recherche approfondie', 'Si votre offre le permet, lancez une étude de marché sur votre cible et votre ville, avec un format imposé (tableau des acteurs, prix publics, opportunités).'),
        pas('Branchez un connecteur', 'Dans les paramètres, connectez votre agenda ou votre Drive. Vérifiez les autorisations demandées.'),
        pas('Testez en lecture seule', 'Demandez un résumé de vos 3 prochains rendez-vous ou d\'un document, sans action d\'écriture.'),
        pas('Faites le ménage', 'Désactivez les connecteurs dont vous n\'aurez pas besoin cette semaine.')
      ],
      exercice: {
        type: 'texte', titre: 'Brief de recherche approfondie',
        enonce: '<p>Rédigez la demande que vous enverrez en recherche approfondie pour étudier votre marché. Elle doit préciser : le <strong>périmètre géographique</strong>, la <strong>cible</strong>, la <strong>période</strong> ou la fraîcheur des informations, les <strong>sources</strong> à privilégier ou à exclure, et le <strong>format</strong> du rapport.</p>',
        criteres: [
          mots(60),
          crit('Précise un périmètre géographique', /(ville|région|France|Toulouse|Paris|Lyon|Marseille|quartier|département|local|zone)/i),
          crit('Précise la période ou la fraîcheur', /(20\d\d|mois|récent|derni|an(s|née)?\b|période|actuel)/i),
          crit('Encadre les sources', /(sources?|sites? officiel|exclu|privilégi|blogs?|presse|annuaire)/i),
          crit('Impose un format de rapport', /(tableau|format|sections?|synthèse|liste|rapport)/i)
        ],
        solution: '<p>« Étudie le marché des salons de coiffure indépendants à Toulouse et dans un rayon de 15 km, avec des informations de moins de 12 mois. Je veux savoir : combien proposent la réservation en ligne, quels outils ils utilisent, leur présence sur Instagram et TikTok, et leurs prix publics pour une coupe femme. Privilégie les sites des salons, les fiches Google et les annuaires professionnels ; exclus les comparateurs sponsorisés. Format : un tableau de 15 salons (nom, quartier, réservation en ligne oui/non, réseaux, prix), puis une synthèse de 10 lignes et 3 opportunités d\'offre pour une prestataire en contenus et automatisation. »</p>',
        explication: 'Brief précis : vous obtiendrez un rapport exploitable. Vérifiez les chiffres clés sur les sources avant de vous en servir.'
      },
      quiz: [
        q('Pourquoi ouvrir les sources citées par Claude ?', ['Par politesse', 'Une source peut être ancienne, partiale ou mal résumée', 'Pour payer moins', 'Ce n\'est jamais utile'], 1, 'La citation n\'est pas une garantie : vérifiez les informations importantes.'),
        q('Sur quel standard reposent les connecteurs ?', ['Le Bluetooth', 'Le Model Context Protocol (MCP)', 'Le format PDF', 'Le protocole FTP'], 1, 'MCP est un standard ouvert qui permet de brancher des outils à Claude.'),
        q('Qu\'est-ce qu\'une injection de prompt ?', ['Une erreur de frappe', 'Des instructions cachées dans un contenu externe qui tentent de détourner l\'IA', 'Un type d\'abonnement', 'Une mise à jour'], 1, 'Un email ou une page peut contenir des consignes malveillantes : relisez avant toute action.'),
        q('Quelle bonne pratique pour les connecteurs ?', ['Tout activer en permanence', 'N\'activer que ce qui sert et relire avant toute action d\'écriture', 'Partager ses accès', 'Ne jamais lire les autorisations'], 1, 'Le principe du moindre privilège limite les risques.')
      ],
      script: script('6 min',
        'Claude peut lire votre agenda, vos emails et le web. C\'est puissant, et c\'est précisément pour ça qu\'il faut trois règles de sécurité.',
        ['La recherche web et la vérification des sources', 'La recherche approfondie : le brief d\'étude de marché', 'Les connecteurs : agenda, documents, outils tiers, MCP', 'Les trois règles de sécurité et l\'injection de prompt', 'Démonstration : préparer sa journée de rendez-vous'],
        'Rédigez votre brief de recherche dans l\'exercice et lancez-le sur votre marché.',
        'Lancement d\'une recherche approfondie, puis connexion de l\'agenda et fiche de préparation des rendez-vous.')
    },
    {
      titre: 'Mémoire, styles et confidentialité',
      objectifs: ['Régler la mémoire et les préférences', 'Créer un style d\'écriture à votre image ou à celle d\'un client', 'Paramétrer la confidentialité avant de travailler pour des clients'],
      theorie: `<h2>Les préférences de profil</h2>
<p>Dans les paramètres, la section des préférences personnelles accueille des consignes générales appliquées à toutes vos conversations : votre métier, votre façon de travailler, vos attentes de format. Exemple : « Je suis consultante en marketing pour des commerces de proximité. Réponds en français, de façon concrète, avec des étapes numérotées quand c'est utile. »</p>
<h2>La mémoire</h2>
<p>Quand elle est activée, Claude peut se souvenir d'éléments utiles d'une conversation à l'autre, et retrouver des échanges passés quand vous y faites référence. Vous pouvez consulter, corriger ou supprimer ce qu'il a retenu, et la désactiver. Points importants :</p>
<ul>
  <li>Chaque <strong>Projet</strong> a sa propre mémoire, séparée du reste.</li>
  <li>Les conversations en <strong>mode incognito</strong> ne sont ni enregistrées dans l'historique ni utilisées pour la mémoire.</li>
  <li>Relisez la mémoire de temps en temps : une information obsolète (ancien tarif, ancien client) peut fausser les réponses.</li>
</ul>
<h2>Les styles</h2>
<p>Les styles changent la façon dont Claude écrit : des styles prédéfinis (par exemple plus concis, plus explicatif, plus formel) et des <strong>styles personnalisés</strong> créés à partir d'exemples d'écriture. Créez :</p>
<ul>
  <li>un style « Ma voix » à partir de trois textes que vous avez écrits ;</li>
  <li>un style par client important, à partir de ses meilleurs contenus (à combiner avec son Projet).</li>
</ul>
<h2>La confidentialité, avant le premier client</h2>
<p>Sur les offres individuelles (Free, Pro, Max), un réglage permet d'autoriser ou non l'utilisation de vos conversations pour améliorer les modèles. S'il est activé, les données concernées peuvent être conservées plus longtemps (jusqu'à plusieurs années selon la politique en vigueur) ; s'il est désactivé, la durée de conservation est beaucoup plus courte. Les offres Team, Enterprise et l'API ne servent pas à l'entraînement par défaut.</p>
${encart('legal', 'Avant de traiter des données de clients', '<p>Désactivez l\'utilisation de vos conversations pour l\'entraînement (ou travaillez avec Team ou l\'API), ne collez que les données nécessaires, anonymisez quand c\'est possible (prénoms remplacés, numéros retirés), et informez vos clients de votre usage de l\'IA dans votre contrat. Le module 8 détaille vos obligations RGPD.</p>')}
<p>Enfin, vous pouvez exporter vos données ou supprimer des conversations depuis les paramètres de confidentialité. La politique applicable est consultable sur le centre de confidentialité d'Anthropic (privacy.claude.com) : relisez-la au moins une fois par an, elle évolue.</p>
${MAJ}`,
      pas: [
        pas('Rédigez vos préférences', 'Trois à cinq lignes : votre métier, votre cible, votre format préféré, la langue.'),
        pas('Réglez la mémoire', 'Activez-la si vous le souhaitez, consultez ce qui est retenu, et testez une conversation incognito.'),
        pas('Créez le style « Ma voix »', 'Fournissez trois textes écrits par vous (posts, emails) et donnez un nom au style.'),
        pas('Vérifiez la confidentialité', 'Dans les paramètres de confidentialité, choisissez votre réglage sur l\'utilisation des conversations pour l\'entraînement, en connaissance de cause.'),
        pas('Rédigez votre règle de données', 'Une phrase dans votre carnet : ce que vous acceptez de coller dans Claude pour un client, et ce que vous refusez.')
      ],
      exercice: {
        type: 'texte', titre: 'Votre politique d\'usage des données clients',
        enonce: '<p>Rédigez en quelques lignes la règle que vous appliquerez avec vos clients : quels <strong>types de données</strong> vous acceptez de traiter avec Claude, ce que vous <strong>anonymisez ou refusez</strong>, le <strong>réglage de confidentialité</strong> choisi, et comment vous <strong>informez</strong> vos clients.</p>',
        criteres: [
          mots(50),
          crit('Indique ce qui est anonymisé ou refusé', /(anonymis|pseudonymis|retir|refus|jamais|pas de|exclu|supprim)/i),
          crit('Mentionne le réglage de confidentialité ou l\'entraînement', /(entraînement|entrainement|confidentialité|paramètre|réglage|Team|API)/i),
          crit('Prévoit d\'informer le client', /(inform|contrat|mention|prévien|transparen|CGV|devis)/i)
        ],
        solution: '<p>« J\'utilise Claude pour rédiger des contenus marketing à partir d\'informations publiques ou fournies pour publication (offres, horaires, prix). J\'ai désactivé l\'utilisation de mes conversations pour l\'entraînement. Je ne colle jamais de données de santé, de coordonnées bancaires ni de fichiers clients complets ; pour analyser des avis ou des emails, je remplace les noms par des initiales et je retire téléphones et adresses. Mon contrat précise que j\'utilise des outils d\'IA, que je relis tous les livrables et que les données sont traitées dans ce cadre. »</p>',
        explication: 'Politique claire. Vous la reprendrez dans vos contrats au module 7 et dans votre registre RGPD au module 8.'
      },
      quiz: [
        q('Que se passe-t-il pour une conversation en mode incognito ?', ['Elle est publiée', 'Elle n\'est pas enregistrée dans l\'historique ni utilisée pour la mémoire', 'Elle est plus rapide', 'Elle est partagée avec l\'équipe'], 1, 'Le mode incognito sert aux échanges ponctuels que vous ne voulez pas conserver.'),
        q('Comment créer un style personnalisé efficace ?', ['Avec un seul mot-clé', 'À partir de plusieurs exemples de textes représentatifs', 'En changeant la police', 'Impossible'], 1, 'Les exemples permettent à Claude d\'imiter un ton et une structure.'),
        q('Quelles offres ne servent pas à l\'entraînement des modèles par défaut ?', ['Free uniquement', 'Team, Enterprise et l\'API', 'Pro uniquement', 'Aucune'], 1, 'Pour les offres individuelles, c\'est un réglage à choisir vous-même.'),
        q('Avant d\'analyser des avis clients contenant des noms et téléphones, que faire ?', ['Rien', 'Retirer ou pseudonymiser les données personnelles inutiles', 'Les publier', 'Les envoyer par email à Claude'], 1, 'Minimisation des données : ne traitez que ce qui est nécessaire.')
      ],
      script: script('6 min',
        'Avant votre premier client, il y a un réglage que vous devez absolument vérifier. Et un autre qui va vous faire gagner des heures.',
        ['Les préférences de profil', 'La mémoire, par projet, et le mode incognito', 'Créer le style « Ma voix » en deux minutes', 'Le réglage de confidentialité et ce qu\'il implique', 'Ma règle d\'usage des données clients'],
        'Rédigez votre politique d\'usage des données dans l\'exercice : vous la réutiliserez dans vos contrats.',
        'Paramètres à l\'écran : préférences, mémoire, création d\'un style, page de confidentialité.')
    },
    {
      titre: 'Quel modèle choisir, pour quelle tâche',
      objectifs: ['Connaître les familles de modèles et leurs forces', 'Choisir un modèle selon la tâche, le coût et la vitesse', 'Utiliser la réflexion étendue à bon escient'],
      theorie: `<p>Claude n'est pas un modèle unique mais une famille. Les noms suivent une logique stable : <strong>Haiku</strong> (rapide et économique), <strong>Sonnet</strong> (polyvalent), <strong>Opus</strong> (raisonnement profond et tâches longues), et <strong>Fable</strong>, le niveau le plus avancé, proposé à un tarif supérieur. Les numéros indiquent la génération.</p>
<h2>La gamme actuelle et les tarifs de l'API</h2>
${tableau(['Modèle', 'Identifiant API', 'Entrée / sortie (pour 1 million de jetons)', 'Points forts'], [
  ['Claude Haiku 5.5', '<code>claude-haiku-5-5</code>', '0,10 $ / 0,50 $', 'Tri, classification, extraction, réponses courtes en très grand volume'],
  ['Claude Sonnet 5.5', '<code>claude-sonnet-5-5</code>', '2 $ / 10 $', 'Rédaction, code courant, agents du quotidien : le meilleur rapport qualité-prix'],
  ['Claude Opus 5.5', '<code>claude-opus-5-5</code>', '4 $ / 20 $', 'Raisonnement complexe, stratégie, longs documents, code difficile, agents longs'],
  ['Claude Fable 5.1', '<code>claude-fable-5-1</code>', '10 $ / 50 $', 'Les tâches les plus exigeantes et les plus longues']
])}
<p>Ces modèles acceptent un contexte d'environ un million de jetons (des centaines de pages). Un jeton correspond en moyenne à un fragment de mot ; en français, comptez grossièrement 1 000 mots pour 1 500 jetons. Tarifs publics de l'API relevés en novembre 2026 (hors remises du cache et des lots, vues au module 5).</p>
<h2>Dans l'application</h2>
<p>Le sélecteur de modèle vous laisse choisir selon votre offre. Les modèles les plus puissants consomment votre quota plus vite. La <strong>réflexion étendue</strong> (ou un niveau d'« effort » plus élevé) laisse Claude réfléchir plus longtemps avant de répondre : plus juste sur les problèmes complexes, plus lent et plus coûteux sur les tâches simples.</p>
<h2>Le bon modèle pour la bonne tâche</h2>
${tableau(['Tâche', 'Choix conseillé', 'Pourquoi'], [
  ['Email, post, reformulation', 'Sonnet', 'Rapide, excellent en rédaction'],
  ['Stratégie d\'offre, analyse d\'un dossier de 80 pages', 'Opus, réflexion activée', 'Raisonnement et synthèse longue'],
  ['Trier 2 000 avis clients par thème (API)', 'Haiku', 'Coût très faible, tâche simple répétée'],
  ['Script vidéo créatif', 'Sonnet ou Opus', 'Testez les deux sur votre format'],
  ['Projet de code client avec Claude Code', 'Opus ou Sonnet', 'Selon la complexité et votre quota'],
  ['Problème critique où l\'erreur coûte cher', 'Opus ou Fable, effort élevé', 'Maximiser la justesse']
])}
<h2>La méthode pour trancher</h2>
<ol>
  <li>Prenez une tâche représentative de votre offre.</li>
  <li>Lancez-la sur deux modèles (par exemple Sonnet et Opus) avec exactement la même demande.</li>
  <li>Comparez sur trois critères : justesse, respect des consignes, temps de retouche nécessaire.</li>
  <li>Gardez le modèle le moins coûteux qui atteint votre niveau d'exigence, et refaites le test à chaque nouvelle génération.</li>
</ol>
${encart('info', 'Bon à savoir', '<p>Les identifiants et tarifs changent à chaque génération. Pour l\'API, la page officielle des modèles et la liste renvoyée par l\'API elle-même font foi (module 5).</p>')}
${MAJ}`,
      pas: [
        pas('Choisissez une tâche test', 'Une tâche réelle de votre future offre : un script vidéo, une page de présentation, une analyse d\'avis.'),
        pas('Lancez-la sur deux modèles', 'Même demande, mot pour mot, dans deux conversations avec deux modèles différents.'),
        pas('Activez la réflexion étendue sur l\'un d\'eux', 'Observez le temps de réponse et la qualité du raisonnement.'),
        pas('Notez vos résultats', 'Justesse, respect des consignes, temps de retouche : une note sur 5 pour chaque critère.'),
        pas('Fixez votre règle', 'Dans votre carnet : « Pour [tâche], j\'utilise [modèle], parce que… ».')
      ],
      exercice: {
        type: 'texte', titre: 'Votre comparatif de modèles',
        enonce: '<p>Rapportez votre test : la <strong>tâche</strong>, les <strong>deux modèles</strong> comparés, vos <strong>notes</strong> sur les trois critères, et votre <strong>décision</strong> finale.</p>',
        criteres: [
          mots(50),
          crit('Nomme au moins un modèle (Haiku, Sonnet, Opus ou Fable)', /(haiku|sonnet|opus|fable)/i),
          crit('Donne des notes ou une comparaison chiffrée', /(\d\s*\/\s*5|\d\s*sur\s*5|note|\d+\s*min|\d+\s*s\b)/i),
          crit('Formule une décision', /(je (choisis|garde|retiens|utilise|prends)|décision|conclusion|donc)/i)
        ],
        solution: '<p>« Tâche : script TikTok de 45 secondes pour une boulangerie. Sonnet : justesse 4/5, consignes 5/5, retouche 2 minutes. Opus avec réflexion : justesse 5/5, consignes 5/5, retouche 1 minute, mais réponse plus longue à venir. Décision : je garde Sonnet pour les scripts courts du quotidien et j\'utilise Opus pour les scripts de lancement ou les campagnes importantes. »</p>',
        explication: 'Décision argumentée. Refaites ce test à chaque nouvelle génération de modèles.'
      },
      quiz: [
        q('Quel modèle pour classer des milliers d\'avis clients via l\'API au moindre coût ?', ['Fable', 'Opus', 'Haiku', 'Aucun'], 2, 'Haiku est conçu pour les tâches simples en grand volume.'),
        q('Que fait la réflexion étendue ?', ['Elle traduit', 'Elle laisse Claude réfléchir plus longtemps avant de répondre', 'Elle supprime les limites', 'Elle publie la réponse'], 1, 'Utile sur les problèmes complexes, superflue sur les tâches simples.'),
        q('Comment choisir entre deux modèles pour votre offre ?', ['Prendre toujours le plus cher', 'Tester la même tâche et garder le moins coûteux qui atteint votre exigence', 'Tirer au sort', 'Prendre le plus récent sans tester'], 1, 'Le test sur votre propre tâche est le seul critère fiable.'),
        q('À peu près combien de jetons pour 1 000 mots en français ?', ['10', '150', '1 500', '100 000'], 2, 'C\'est un ordre de grandeur utile pour estimer les coûts de l\'API.')
      ],
      script: script('6 min',
        'Utiliser le modèle le plus puissant pour tout, c\'est comme livrer une pizza en camion. Voici comment choisir.',
        ['Les familles : Haiku, Sonnet, Opus, Fable', 'Le tableau des tarifs API et ce qu\'est un jeton', 'La réflexion étendue : quand l\'activer', 'Le tableau tâche par tâche', 'La méthode de test en 4 étapes'],
        'Faites votre comparatif sur une tâche de votre offre et notez votre règle dans votre carnet. Le module 2 vous attend : le prompting professionnel.',
        'Deux conversations côte à côte avec deux modèles, même demande, chronomètre à l\'écran.')
    }
  ]
};
