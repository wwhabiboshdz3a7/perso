import { code, encart, tableau, pas, q, crit, mots, script } from './_outils.mjs';

export default {
  intro: `<p>Le prompting n'est pas une collection de formules magiques : c'est l'art de transmettre un contexte et une exigence, comme on brieferait un excellent collaborateur qui découvre le dossier. Ce module vous donne une méthode stable, qui fonctionne d'une génération de modèle à l'autre, et qui vous servira dans l'application, dans Claude Code et dans vos automatisations.</p>`,
  lecons: [
    {
      titre: 'Anatomie d\'un prompt professionnel',
      objectifs: ['Connaître les six briques d\'un prompt efficace', 'Transformer une demande vague en fiche de mission', 'Expliquer le pourquoi de vos contraintes'],
      theorie: `<p>Imaginez que vous confiez une tâche à un collaborateur très compétent qui arrive aujourd'hui dans votre entreprise. Il ne connaît ni votre client, ni vos habitudes, ni ce que vous considérez comme « bien ». Tout ce que vous ne dites pas, il le devinera. Un prompt professionnel, c'est le brief que vous lui donneriez.</p>
<h2>Les six briques</h2>
${tableau(['Brique', 'Question à se poser', 'Exemple'], [
  ['Contexte', 'Qui, pour qui, dans quelle situation ?', '« Je gère les réseaux d\'un garage indépendant à Colomiers. »'],
  ['Tâche', 'Que faut-il produire exactement ?', '« Rédige 4 posts Facebook pour le mois d\'avril. »'],
  ['Données', 'Sur quoi s\'appuyer ?', 'Les offres du mois, les horaires, les avis, en pièce jointe'],
  ['Contraintes', 'Quelles limites, et pourquoi ?', '« 80 mots maximum, car les clients lisent sur mobile. »'],
  ['Format', 'À quoi doit ressembler la sortie ?', '« Un tableau : date, texte, idée de visuel. »'],
  ['Critères de réussite', 'Comment juger que c\'est bon ?', '« Chaque post a une seule incitation à l\'action et un détail local. »']
])}
<p>Toutes les briques ne sont pas nécessaires pour une question simple. Pour un livrable client, elles le sont presque toujours.</p>
<h2>Trois principes qui changent tout</h2>
<ol>
  <li><strong>Soyez explicite.</strong> Les modèles récents suivent les consignes avec précision : ils font ce que vous demandez, pas forcément ce que vous espériez. Si vous voulez quelque chose d'ambitieux, demandez-le (« propose une version audacieuse et une version sobre »).</li>
  <li><strong>Expliquez le pourquoi.</strong> « Pas de jargon, car les lecteurs sont des retraités qui découvrent le service » donne de meilleurs résultats que « pas de jargon ». Le modèle généralise la raison à des cas que vous n'aviez pas prévus.</li>
  <li><strong>Dites quoi faire plutôt que quoi ne pas faire.</strong> « Écris en paragraphes courts et fluides » fonctionne mieux que « n'utilise pas de listes à puces ».</li>
</ol>
<h2>Avant / après</h2>
<p><strong>Avant</strong> : « Écris un post pour un garage. »</p>
<p><strong>Après</strong> :</p>
${code('markdown', `Contexte : je gère la communication du Garage des Pins, garage indépendant
à Colomiers (31), clientèle de familles et d'artisans du secteur.
Tâche : rédige 4 posts Facebook pour avril.
Données : offres du mois et horaires dans le fichier joint ; avis Google récents ci-dessous.
Contraintes : 80 mots maximum par post (lecture sur mobile), vouvoiement,
aucun prix qui ne figure pas dans le fichier (pour éviter les litiges).
Format : tableau avec colonnes Date, Texte, Idée de photo.
Critères : un seul appel à l'action par post, un détail local par post.
Si une information te manque, pose-moi tes questions avant de rédiger.`)}
<h2>La fiche de mission réutilisable</h2>
<p>Gardez ce squelette dans votre Projet « Mon activité » et remplissez-le à chaque nouvelle tâche : vous ne repartirez jamais d'une page blanche.</p>
${encart('info', 'Longueur d\'un bon prompt', '<p>Un prompt professionnel fait souvent 8 à 20 lignes. Ce n\'est pas du remplissage : chaque ligne évite une relance. Si votre prompt dépasse une page, c\'est souvent qu\'il faut le découper en étapes (leçon 4).</p>')}`,
      pas: [
        pas('Reprenez une demande récente', 'Choisissez un prompt d\'une ligne que vous avez envoyé cette semaine.'),
        pas('Complétez les six briques', 'Réécrivez-le avec contexte, tâche, données, contraintes justifiées, format et critères.'),
        pas('Comparez les résultats', 'Envoyez les deux versions dans deux conversations et comparez la qualité et le temps de retouche.'),
        pas('Ajoutez la clause « questions »', 'Terminez par « Si une information te manque, pose-moi tes questions avant de rédiger. »'),
        pas('Enregistrez la fiche', 'Copiez votre version finale dans votre Projet « Mon activité » comme modèle.')
      ],
      exercice: {
        type: 'texte', titre: 'Votre première fiche de mission',
        enonce: '<p>Transformez la demande « Fais-moi une description de mes services » en prompt professionnel pour votre activité (réelle ou envisagée). Les six briques doivent y figurer, et au moins une contrainte doit être <strong>justifiée</strong> (« car… », « parce que… », « pour que… »).</p>',
        criteres: [
          mots(80),
          crit('Contient un contexte', /(contexte|je suis|mon activité|je propose|mon entreprise|j'accompagne)/i),
          crit('Justifie au moins une contrainte', /(car |parce que|pour que|afin de|afin que)/i),
          crit('Précise un format de sortie', /(format|tableau|liste|sections?|paragraphes?|titres?)/i),
          crit('Indique des critères de réussite', /(critère|réussi|doit (contenir|inclure|permettre)|chaque|vérifie)/i)
        ],
        solution: '<p>« Contexte : je suis vidéaste indépendant à Toulouse ; je propose des vidéos courtes pour les restaurants et commerces de bouche. Tâche : rédige la description de mes services pour la page « Offres » de mon site. Données : mes 3 formules (pack découverte, abonnement mensuel, tournage événement) sont décrites dans le document joint. Contraintes : 250 mots maximum car les visiteurs viennent surtout d\'Instagram sur mobile ; vouvoiement ; pas de jargon technique pour que des restaurateurs pressés comprennent immédiatement. Format : un titre accrocheur, puis une section par formule avec 3 puces (ce qui est inclus, pour qui, délai). Critères : chaque formule doit se terminer par un bénéfice concret pour le restaurateur, et le texte doit contenir une seule incitation à réserver un appel. Si une information te manque, pose-moi tes questions avant d\'écrire. »</p>',
        explication: 'Fiche de mission complète. Gardez-la comme modèle : vous l\'adapterez à chaque nouvelle tâche.'
      },
      quiz: [
        q('Pourquoi expliquer la raison d\'une contrainte ?', ['Une contrainte sans raison est ignorée par le modèle', 'Cela rend la contrainte prioritaire sur toutes les autres', 'Les modèles récents refusent les consignes non justifiées', 'Le modèle généralise la raison à des cas non prévus'], 3, 'Comprendre l\'intention permet d\'appliquer la règle avec discernement.'),
        q('Quelle formulation fonctionne le mieux ?', ['« N\'utilise surtout aucune liste à puces »', '« Écris en paragraphes courts et fluides »', '« Pas de puces, pas de listes, rien de tout ça »', '« ÉVITE ABSOLUMENT LES LISTES ! »'], 1, 'Dire ce qu\'on veut obtenir est plus efficace que d\'énumérer les interdits.'),
        q('Que signifie « les modèles récents suivent les consignes avec précision » ?', ['Ils devinent votre intention, même si la consigne est vague', 'Ils suivent le prompt système et ignorent les consignes du message', 'Ils font ce que vous demandez : demandez explicitement ce que vous voulez', 'Ils ajoutent d\'eux-mêmes tout ce qui pourrait vous être utile'], 2, 'Soyez explicite, y compris sur le niveau d\'ambition attendu.'),
        q('Un prompt dépasse une page et mélange cinq tâches. Que faire ?', ['Le découper en étapes successives', 'Le passer en majuscules pour insister', 'Le traduire en anglais pour plus de précision', 'L\'envoyer tel quel à un modèle plus puissant'], 0, 'Les chaînes de prompts (leçon 4) rendent chaque étape plus fiable.')
      ],
      script: script('6 min',
        'Le problème n\'est presque jamais l\'IA. C\'est le brief. Voici les six briques d\'un brief professionnel.',
        ['La métaphore du nouveau collaborateur brillant', 'Les six briques avec un exemple concret', 'Les trois principes : explicite, pourquoi, quoi faire', 'Avant / après en direct', 'La fiche de mission réutilisable'],
        'Réécrivez une de vos demandes avec les six briques, comparez, et gardez la fiche dans votre Projet.',
        'Deux conversations côte à côte : prompt d\'une ligne contre fiche de mission.')
    },
    {
      titre: 'Balises XML et documents longs',
      objectifs: ['Séparer clairement consignes et données avec des balises', 'Travailler sur de longs documents sans perte de qualité', 'Obtenir des sorties faciles à réutiliser'],
      theorie: `<p>Dès qu'un prompt mélange des consignes, des documents et des exemples, Claude doit deviner où commence et où finit chaque partie. Les <strong>balises de type XML</strong> lèvent toute ambiguïté. Il n'y a pas de balises « officielles » : choisissez des noms explicites et restez cohérent.</p>
${code('markdown', `<contexte>
Agence de communication locale, client : Salon Élégance (coiffure, Blagnac).
</contexte>

<avis_clients>
[coller ici les 40 derniers avis]
</avis_clients>

<consignes>
1. Classe les avis par thème (accueil, attente, résultat, prix, autre).
2. Pour chaque thème : nombre d'avis, ton dominant, une citation courte représentative.
3. Termine par 3 actions prioritaires pour le salon.
Appuie-toi uniquement sur le contenu de <avis_clients>.
</consignes>`)}
<h2>Les règles d'or</h2>
<ul>
  <li><strong>Nommez ce que vous référencez</strong> : « en t'appuyant sur &lt;avis_clients&gt; » est plus clair que « sur les avis ci-dessus ».</li>
  <li><strong>Imbriquez</strong> quand c'est hiérarchique : plusieurs <code>&lt;document&gt;</code> dans un <code>&lt;documents&gt;</code>, avec une source pour chacun.</li>
  <li><strong>Demandez une sortie balisée</strong> quand vous allez la réutiliser : <code>&lt;analyse&gt;</code> puis <code>&lt;recommandations&gt;</code>. C'est indispensable en automatisation pour découper la réponse.</li>
</ul>
<h2>Travailler sur des documents longs</h2>
<p>Les modèles actuels acceptent des contextes immenses, mais la façon de présenter les documents compte :</p>
<ol>
  <li><strong>Documents en haut, question en bas.</strong> Placez les longs documents au début, puis vos consignes et votre question à la fin : c'est la disposition qui donne les meilleurs résultats sur les contextes longs.</li>
  <li><strong>Structurez plusieurs sources</strong> :</li>
</ol>
${code('xml', `<documents>
  <document index="1">
    <source>contrat_prestation_2026.pdf</source>
    <contenu>…</contenu>
  </document>
  <document index="2">
    <source>conditions_generales_client.pdf</source>
    <contenu>…</contenu>
  </document>
</documents>`)}
<ol start="3">
  <li><strong>Faites extraire avant d'analyser.</strong> « Commence par recopier dans &lt;citations&gt; les passages pertinents pour la question, puis réponds dans &lt;reponse&gt; en t'appuyant sur ces citations. » Cela réduit fortement les affirmations inventées et vous permet de vérifier.</li>
</ol>
${encart('warn', 'Ne confondez pas taille et attention', '<p>Pouvoir lire 500 pages ne signifie pas qu\'il faut tout envoyer. Retirez ce qui est hors sujet : moins de bruit, réponses plus justes, coût plus faible.</p>')}
<h2>Exemple de sortie réutilisable</h2>
${code('xml', `<analyse>
Thème « attente » : 9 avis, ton négatif, « 40 minutes malgré le rendez-vous ».
…
</analyse>
<recommandations>
1. Envoyer un SMS de rappel avec le créneau exact…
</recommandations>`)}
<p>Dans une automatisation (module 5), un nœud de code récupère simplement le contenu entre <code>&lt;recommandations&gt;</code> et <code>&lt;/recommandations&gt;</code>. Pour une sortie en JSON garanti, on utilisera les sorties structurées de l'API.</p>`,
      pas: [
        pas('Choisissez un document long', 'Un contrat, une étude, un ensemble d\'avis clients ou un compte rendu de réunion.'),
        pas('Placez-le en haut, balisé', 'Entourez-le de balises au nom explicite, avec sa source.'),
        pas('Écrivez les consignes en bas', 'Dans une balise &lt;consignes&gt;, en référençant les balises du document.'),
        pas('Exigez des citations', 'Demandez d\'abord les passages pertinents dans &lt;citations&gt;, puis la réponse.'),
        pas('Vérifiez trois citations', 'Retrouvez-les dans le document original : sont-elles exactes et bien interprétées ?')
      ],
      exercice: {
        type: 'texte', titre: 'Un prompt balisé pour un document client',
        enonce: '<p>Écrivez un prompt complet (sans le document lui-même, remplacé par « … ») pour analyser un document de votre choix. Il doit utiliser <strong>au moins trois balises</strong>, placer les <strong>consignes après le document</strong>, demander des <strong>citations</strong> avant la réponse, et une <strong>sortie balisée</strong>.</p>',
        criteres: [
          crit('Utilise au moins trois balises différentes', /<([a-z_]+)>[\s\S]*<\/\1>[\s\S]*<([a-z_]+)>[\s\S]*<\/\2>[\s\S]*<([a-z_]+)>/i),
          crit('Demande des citations', /citation/i),
          crit('Demande une sortie balisée', /(réponds|répond|sortie|écris|rédige).{0,60}<[a-z_]+>|dans <[a-z_]+>/i),
          mots(40)
        ],
        solution: `<pre class="prompt">&lt;document&gt;
&lt;source&gt;compte_rendu_rdv_boulangerie.txt&lt;/source&gt;
&lt;contenu&gt;…&lt;/contenu&gt;
&lt;/document&gt;

&lt;consignes&gt;
Tu prépares ma proposition commerciale pour cette boulangerie.
1. Recopie dans &lt;citations&gt; les phrases du &lt;document&gt; qui expriment un besoin, un budget ou une contrainte.
2. Dans &lt;besoins&gt;, liste les besoins du client en t'appuyant uniquement sur ces citations.
3. Dans &lt;questions&gt;, liste ce qui reste flou et qu'il faut demander au client.
&lt;/consignes&gt;</pre>`,
        explication: 'Prompt structuré et vérifiable. Testez-le sur un vrai document et contrôlez les citations.'
      },
      quiz: [
        q('Existe-t-il une liste officielle de balises à utiliser ?', ['Oui, Claude ne reconnaît que les balises documentées', 'Non : des noms explicites et cohérents suffisent', 'Oui, mais seulement pour les prompts en anglais', 'Non, et il vaut mieux changer de noms à chaque prompt'], 1, 'Les balises servent à structurer ; leur nom doit simplement être clair.'),
        q('Où placer un long document dans le prompt ?', ['En haut, avec les consignes et la question à la fin', 'À la fin, après la question, pour qu\'il soit lu en dernier', 'Au milieu des consignes, là où il est utilisé', 'Dans un message séparé, envoyé après la question'], 0, 'Documents en haut, question en bas : la disposition la plus efficace sur les contextes longs.'),
        q('Pourquoi demander des citations avant la réponse ?', ['Pour que la réponse finale soit plus longue et plus détaillée', 'Pour que le modèle traduise d\'abord le document en anglais', 'Pour respecter le droit d\'auteur du document fourni', 'Pour réduire les affirmations inventées et pouvoir vérifier'], 3, 'Les citations ancrent la réponse dans le texte source.'),
        q('Pourquoi baliser la sortie dans une automatisation ?', ['Pour réduire le nombre de jetons facturés en sortie', 'Pour que la réponse s\'affiche joliment dans l\'email', 'Pour extraire chaque partie facilement dans l\'étape suivante', 'Parce que l\'API refuse les réponses non balisées'], 2, 'Une sortie balisée se découpe sans ambiguïté par un nœud de code.')
      ],
      script: script('6 min',
        'Quand Claude mélange vos consignes et vos documents, ce n\'est pas un bug. C\'est que vous ne lui avez pas montré où était la frontière.',
        ['Pourquoi les balises : séparer consignes, données, exemples', 'Les règles d\'or : nommer, imbriquer, baliser la sortie', 'Documents longs : en haut, question en bas', 'La technique des citations avant la réponse', 'Démonstration sur 40 avis clients'],
        'Écrivez votre prompt balisé dans l\'exercice et testez-le sur un vrai document.',
        'Analyse de 40 avis Google réels anonymisés, avec sortie balisée.')
    },
    {
      titre: 'Exemples et rôles',
      objectifs: ['Utiliser des exemples pour fixer un style ou un format', 'Choisir des exemples variés et représentatifs', 'Définir un rôle utile dans un prompt système ou un Projet'],
      theorie: `<h2>Les exemples : le moyen le plus fiable de montrer ce que vous voulez</h2>
<p>Décrire un style est difficile ; le montrer est facile. Deux à cinq exemples bien choisis (on parle de « few-shot ») fixent le ton, la longueur, la structure et le niveau de détail mieux que n'importe quelle description.</p>
${code('markdown', `<exemples>
<exemple>
Accroche : « Ce croissant a mis 3 jours à naître. »
Pourquoi ça marche : surprise + promesse de coulisses.
</exemple>
<exemple>
Accroche : « Votre boulanger se lève à 3 h 40. Voilà ce qu'il fait jusqu'à 7 h. »
Pourquoi ça marche : précision chiffrée + curiosité.
</exemple>
<exemple>
Accroche : « On a testé 4 farines. Une seule est restée. »
Pourquoi ça marche : mini-suspense + exigence de qualité.
</exemple>
</exemples>

Écris 10 nouvelles accroches dans cet esprit pour la boulangerie,
sur des sujets différents de ceux des exemples.`)}
<h3>Bien choisir ses exemples</h3>
<ul>
  <li><strong>Variés</strong> : sinon Claude copie un seul motif (même longueur, même mot d'ouverture).</li>
  <li><strong>Représentatifs</strong> de ce que vous voulez vraiment en production, y compris les cas difficiles.</li>
  <li><strong>Balisés</strong> dans <code>&lt;exemple&gt;</code>, pour qu'ils ne soient pas confondus avec la consigne.</li>
  <li>Précisez « dans cet esprit, sans recopier » si vous voulez de la nouveauté.</li>
  <li>Ajoutez éventuellement <em>pourquoi</em> l'exemple est bon : Claude retient le principe, pas seulement la forme.</li>
</ul>
<h2>Les rôles</h2>
<p>Donner un rôle (« Tu es directrice artistique spécialisée dans la restauration ») oriente le vocabulaire, le niveau d'exigence et les angles. Dans l'API, le rôle se place dans le <strong>prompt système</strong> ; dans l'application, dans les <strong>instructions du Projet</strong> ou dans vos préférences.</p>
<p>Un rôle générique apporte peu. Un rôle précis, avec un contexte et des priorités, apporte beaucoup :</p>
${tableau(['Faible', 'Fort'], [
  ['« Tu es un expert marketing. »', '« Tu es responsable marketing d\'une chaîne de 12 boulangeries en Occitanie. Ta priorité : faire venir les actifs le midi. Tu juges chaque idée sur son coût et sa faisabilité par une équipe sans graphiste. »'],
  ['« Tu es un juriste. »', '« Tu relis des devis d\'artisans pour repérer les mentions obligatoires manquantes. Tu ne donnes pas de conseil juridique : tu signales et tu renvoies vers un professionnel. »']
])}
<h2>Combiner rôle, exemples et contexte</h2>
<p>La combinaison la plus efficace pour un livrable récurrent : <strong>rôle précis</strong> (dans le Projet) + <strong>contexte du client</strong> (documents du Projet) + <strong>3 exemples validés</strong> par le client + la demande du jour. C'est exactement ce que vous automatiserez au module 5.</p>
${encart('info', 'Astuce : faire évoluer ses exemples', '<p>Chaque fois qu\'un client valide un contenu avec enthousiasme, ajoutez-le à ses exemples. Votre système s\'améliore à chaque livraison.</p>')}`,
      pas: [
        pas('Collectez 3 exemples réels', 'Trois contenus que vous (ou votre client) trouvez excellents, de formes différentes.'),
        pas('Notez pourquoi ils sont bons', 'Une ligne par exemple : le mécanisme qui fonctionne.'),
        pas('Rédigez un rôle précis', 'Métier, contexte, priorité, critère de jugement.'),
        pas('Assemblez le prompt', 'Rôle, contexte, &lt;exemples&gt;, demande, et la consigne « sans recopier ».'),
        pas('Contrôlez la diversité', 'Sur 10 résultats, combien commencent pareil ? Si plus de 3, variez vos exemples.')
      ],
      exercice: {
        type: 'texte', titre: 'Prompt avec rôle et exemples',
        enonce: '<p>Écrivez un prompt qui combine un <strong>rôle précis</strong> (métier + contexte + priorité), <strong>au moins deux exemples</strong> balisés, et une demande de production en série (au moins 5 éléments) <strong>sans recopier</strong> les exemples.</p>',
        criteres: [
          crit('Définit un rôle', /\b(tu es|en tant que|ton rôle)\b/i),
          crit('Contient au moins deux exemples balisés', /<exemple>[\s\S]*<\/exemple>[\s\S]*<exemple>/i),
          crit('Demande au moins 5 éléments', /\b([5-9]|[1-9]\d)\b\s*(nouve|accroche|idée|titre|post|script|variante|élément|version|question|objet)/i),
          crit('Demande de ne pas recopier', /(sans recopier|ne recopie pas|différent|nouveaux? sujets?|sans reprendre|originaux)/i)
        ],
        solution: `<pre class="prompt">Tu es copywriter pour des commerces de quartier à Toulouse. Ta priorité : des objets d'email qui donnent envie d'ouvrir sans paraître publicitaires, car la clientèle est fidèle et déteste le marketing agressif.

&lt;exemples&gt;
&lt;exemple&gt;« Inès vous a mis de côté les premières pivoines »&lt;/exemple&gt;
&lt;exemple&gt;« Fermé lundi : on vous explique pourquoi (c'est une bonne nouvelle) »&lt;/exemple&gt;
&lt;exemple&gt;« 3 bouquets à moins de 25 € pour la fête des grands-mères »&lt;/exemple&gt;
&lt;/exemples&gt;

Écris 8 nouveaux objets d'email pour la fleuriste Les Jardins d'Inès, dans cet esprit mais sans recopier les exemples, sur des sujets variés (saison, coulisses, conseils, événements).</pre>`,
        explication: 'Prompt complet. Vérifiez la diversité des résultats et enrichissez les exemples au fil des validations.'
      },
      quiz: [
        q('Combien d\'exemples utiliser en général ?', ['Un seul, très détaillé', 'Au moins vingt, tous similaires', 'Deux à cinq, variés', 'Aucun, ils biaisent toujours'], 2, 'Quelques exemples variés suffisent à fixer style et format.'),
        q('Vos 10 résultats commencent tous par la même tournure. Pourquoi ?', ['La température est réglée trop haut', 'Le modèle a atteint sa limite d\'usage', 'Le prompt est trop court pour varier', 'Vos exemples se ressemblent trop'], 3, 'Des exemples trop homogènes enferment les résultats dans un seul motif.'),
        q('Où placer le rôle dans l\'API ?', ['Dans le prompt système', 'Dans le paramètre metadata', 'Dans le premier message assistant', 'Dans l\'en-tête de la requête HTTP'], 0, 'Le prompt système porte le rôle et les règles stables.'),
        q('Quel rôle est le plus utile ?', ['« Tu es le meilleur expert du monde dans tous les domaines »', 'Un rôle avec métier, contexte, priorité et critère de jugement', '« Tu es une IA neutre, sans opinion ni préférence de style »', 'Aucun rôle : les modèles récents n\'en tiennent plus compte'], 1, 'La précision du rôle oriente les choix concrets du modèle.')
      ],
      script: script('6 min',
        'Arrêtez de décrire le style que vous voulez. Montrez-le. Trois exemples valent trois paragraphes d\'explications.',
        ['Le few-shot : montrer plutôt que décrire', 'Bien choisir ses exemples : variés, représentatifs, balisés', 'Les rôles faibles et les rôles forts', 'La combinaison rôle + contexte + exemples', 'Faire évoluer ses exemples à chaque validation client'],
        'Construisez votre prompt rôle + exemples pour un livrable récurrent de votre offre.',
        'Génération de 10 accroches avec des exemples homogènes, puis variés : comparaison.')
    },
    {
      titre: 'Chaînes de prompts',
      objectifs: ['Découper un livrable complexe en étapes', 'Faire circuler les résultats d\'une étape à l\'autre', 'Savoir quand une chaîne vaut mieux qu\'un seul prompt'],
      theorie: `<p>Un seul prompt pour « rechercher, planifier, rédiger, relire et optimiser un article » donne un résultat moyen partout. Une <strong>chaîne de prompts</strong> confie chaque étape à un prompt dédié, dont la sortie devient l'entrée du suivant. Chaque étape est plus simple, donc plus fiable, et vous pouvez contrôler ou corriger entre deux étapes.</p>
<h2>Exemple : article de blog pour un client</h2>
${tableau(['Étape', 'Entrée', 'Sortie'], [
  ['1. Brief', 'Sujet, client, cible, mots-clés', '&lt;brief&gt; : intention de recherche, angle, questions du lecteur'],
  ['2. Plan', '&lt;brief&gt;', '&lt;plan&gt; : titres, points clés, sources à vérifier'],
  ['3. Rédaction', '&lt;brief&gt; + &lt;plan&gt; validé', '&lt;article&gt;'],
  ['4. Relecture critique', '&lt;article&gt; + grille de critères', '&lt;critique&gt; : problèmes classés par gravité'],
  ['5. Version finale', '&lt;article&gt; + &lt;critique&gt;', '&lt;article_final&gt; + méta-description']
])}
<p>Dans l'application, vous enchaînez simplement les messages dans la même conversation (ou dans le Projet du client), en validant entre chaque étape. En automatisation, chaque étape devient un appel à l'API ; vous pouvez même utiliser un modèle différent par étape (un modèle rapide pour le brief, un plus puissant pour la rédaction).</p>
<h2>Les règles d'une bonne chaîne</h2>
<ol>
  <li><strong>Une étape = un objectif clair</strong> et une sortie balisée.</li>
  <li><strong>Transmettez uniquement ce qui est utile</strong> : le brief et le plan, pas toute la conversation de recherche.</li>
  <li><strong>Placez les points de contrôle</strong> là où une erreur coûterait cher : valider le plan avant de rédiger évite de réécrire 1 500 mots.</li>
  <li><strong>Parallélisez ce qui est indépendant</strong> : 5 descriptions de produits peuvent être générées en même temps, puis harmonisées.</li>
</ol>
${code('markdown', `Étape 3 — Rédaction
<brief>{{brief}}</brief>
<plan>{{plan_valide}}</plan>
Rédige l'article en suivant strictement <plan>.
Pour chaque affirmation chiffrée, ajoute [à vérifier] si elle ne vient pas du brief.
Réponds uniquement dans <article></article>.`)}
<h2>Quand ne pas faire de chaîne</h2>
<p>Pour une tâche courte (un email, un post), un bon prompt suffit. La chaîne se justifie quand le livrable est long, qu'il combine des compétences différentes (recherche, structure, style), ou qu'il sera produit en série. Les modèles récents savent aussi enchaîner des étapes seuls si vous les décrivez : « Procède en 3 temps : plan, rédaction, relecture ; montre-moi le plan avant de continuer. »</p>
${encart('ok', 'Ce que vous vendez vraiment', '<p>Un client n\'achète pas « un prompt ». Il achète un résultat constant. Une chaîne documentée, c\'est ce qui vous permet de livrer 8 articles par mois de qualité égale, puis de l\'automatiser.</p>')}`,
      pas: [
        pas('Choisissez un livrable long', 'Article, page de vente, script de vidéo longue, rapport mensuel.'),
        pas('Découpez-le', 'Listez 3 à 5 étapes avec, pour chacune, l\'entrée et la sortie balisée.'),
        pas('Écrivez le prompt de chaque étape', 'Chaque prompt référence les balises de l\'étape précédente.'),
        pas('Exécutez avec contrôle', 'Validez ou corrigez la sortie de l\'étape 2 avant de lancer la 3.'),
        pas('Documentez la chaîne', 'Enregistrez-la dans votre Projet : elle deviendra une automatisation au module 5.')
      ],
      exercice: {
        type: 'texte', titre: 'Concevoir votre chaîne',
        enonce: '<p>Décrivez une chaîne de <strong>3 à 5 étapes</strong> pour un livrable de votre offre. Pour chaque étape : son objectif, son <strong>entrée</strong>, sa <strong>sortie balisée</strong>. Indiquez où se situe votre <strong>point de contrôle</strong>.</p>',
        criteres: [
          mots(70),
          crit('Numérote au moins trois étapes', /(1|un|premi)[\s\S]*(2|deux)[\s\S]*(3|trois)/i),
          crit('Précise entrées et sorties', /(entrée|sortie|reçoit|produit|transmet)/i),
          crit('Utilise des sorties balisées', /<[a-z_]+>/i),
          crit('Indique un point de contrôle', /(contrôle|valid|vérif|relis|relecture)/i)
        ],
        solution: '<p>« Livrable : script de vidéo YouTube de 6 minutes pour un garage. 1. Recherche — entrée : sujet et questions fréquentes des clients ; sortie : &lt;angles&gt; avec 5 angles possibles. 2. Plan — entrée : l\'angle choisi ; sortie : &lt;plan&gt; minuté (accroche, 4 parties, conclusion). Point de contrôle : je valide le plan avec le garagiste avant de rédiger. 3. Script — entrée : &lt;plan&gt; validé + 2 exemples de scripts réussis ; sortie : &lt;script&gt; avec indications de plans. 4. Relecture — entrée : &lt;script&gt; + grille (jargon expliqué, durée, appel à l\'action) ; sortie : &lt;script_final&gt; et &lt;titre&gt;. »</p>',
        explication: 'Chaîne bien conçue. Testez-la dans un Projet, puis gardez-la pour l\'automatiser.'
      },
      quiz: [
        q('Principal avantage d\'une chaîne de prompts ?', ['Elle coûte toujours moins cher qu\'un prompt unique', 'Chaque étape est plus simple, plus fiable et contrôlable', 'Elle dispense de relire, chaque étape corrigeant la précédente', 'Elle répond plus vite, les étapes s\'exécutant en parallèle'], 1, 'La décomposition rend chaque étape plus fiable et permet des points de contrôle.'),
        q('Où placer un point de contrôle ?', ['Après la version finale seulement, pour tout relire', 'Entre chaque étape sans exception, même mineure', 'Avant le brief, pour valider le modèle choisi', 'Là où une erreur coûterait cher à corriger plus tard'], 3, 'Valider le plan avant la rédaction évite de tout réécrire.'),
        q('Que transmettre d\'une étape à l\'autre ?', ['Seulement les sorties utiles, balisées', 'Toute la conversation précédente, mot pour mot', 'Uniquement le prompt de l\'étape précédente', 'Un résumé libre rédigé par vous à chaque fois'], 0, 'Moins de bruit, meilleure qualité.'),
        q('Pour un email de 100 mots, faut-il une chaîne ?', ['Oui, toujours, c\'est plus fiable', 'Oui, avec une étape par paragraphe', 'Non, un bon prompt suffit', 'Seulement si l\'email part via l\'API'], 2, 'La chaîne se justifie pour les livrables longs, combinés ou produits en série.')
      ],
      script: script('7 min',
        'Huit articles par mois, tous du même niveau, pour un client. Le secret n\'est pas un prompt parfait. C\'est une chaîne.',
        ['Le problème du prompt « tout-en-un »', 'La chaîne en 5 étapes pour un article', 'Les 4 règles : objectif, transmission, contrôle, parallélisme', 'Quand une chaîne est inutile', 'Pourquoi c\'est ce que vous vendez vraiment'],
        'Concevez votre chaîne dans l\'exercice : vous l\'automatiserez au module 5.',
        'Exécution de la chaîne complète dans un Projet, avec validation du plan à l\'écran.')
    },
    {
      titre: 'Auto-évaluation et itération',
      objectifs: ['Faire évaluer une production selon une grille', 'Construire un petit jeu de tests pour vos prompts', 'Diagnostiquer et corriger les défauts typiques'],
      theorie: `<h2>La boucle critique puis réécriture</h2>
<p>Claude est souvent meilleur pour <em>juger</em> un texte selon des critères explicites que pour tout réussir du premier coup. Exploitez-le :</p>
${code('markdown', `<grille>
1. L'accroche crée une tension dans la première phrase.
2. Un seul message principal.
3. Aucun jargon non expliqué.
4. Un appel à l'action clair et unique.
5. Moins de 120 mots.
</grille>
Évalue <texte> critère par critère (respecté / partiel / non respecté, avec la raison).
Puis réécris le texte pour respecter tous les critères. Sortie : <evaluation> puis <version_corrigee>.`)}
<p>La grille est l'élément clé : elle transforme « fais mieux » (vague) en exigences vérifiables. Construisez une grille par type de livrable et gardez-la dans le Projet du client.</p>
<h2>Les tests maison (vos « évals »)</h2>
<p>Quand un prompt sert souvent (et surtout s'il va être automatisé), testez-le comme un produit :</p>
<ol>
  <li>Constituez <strong>5 à 10 cas représentatifs</strong> : des cas faciles, des cas limites (avis agressif, demande hors sujet, information manquante).</li>
  <li>Définissez ce qu'est une <strong>bonne réponse</strong> pour chacun (critères, éléments obligatoires, éléments interdits).</li>
  <li>Passez chaque version du prompt sur tous les cas et notez les résultats dans un tableau.</li>
  <li>Ne changez qu'<strong>une chose à la fois</strong> entre deux versions, sinon vous ne saurez pas ce qui a amélioré (ou dégradé) le résultat.</li>
</ol>
<h2>Diagnostiquer les défauts typiques</h2>
${tableau(['Symptôme', 'Cause probable', 'Correction'], [
  ['Réponse générique', 'Pas assez de contexte ou d\'exemples', 'Ajouter le contexte client et 2-3 exemples'],
  ['Faits inventés', 'Question hors des données fournies', 'Autoriser « je ne sais pas », exiger des citations, fournir les sources'],
  ['Trop long', 'Longueur non précisée', 'Fixer une limite et la justifier'],
  ['Format irrégulier', 'Format décrit en prose', 'Donner un modèle de sortie ou utiliser des balises ; en API, des sorties structurées'],
  ['Ignore une règle', 'Règle noyée dans un long texte', 'La remonter, l\'expliquer, la rappeler dans les critères']
])}
${encart('info', 'Donnez la permission de dire « je ne sais pas »', '<p>« Si l\'information ne figure pas dans les documents, réponds : “Information non disponible” au lieu de deviner. » Cette simple phrase réduit fortement les inventions, ce qui est vital pour un chatbot client ou un devis.</p>')}
<h2>Les outils de la Console</h2>
<p>Si vous utilisez l'API, la Claude Console propose des outils pour générer un premier prompt à partir d'une description de tâche, l'améliorer et le tester sur plusieurs cas. Ils sont pratiques pour démarrer, mais votre jeu de tests reste la référence.</p>`,
      pas: [
        pas('Choisissez un prompt récurrent', 'Celui que vous utiliserez le plus pour vos clients.'),
        pas('Écrivez sa grille', '4 à 6 critères vérifiables, sans adjectifs vagues.'),
        pas('Préparez 5 cas de test', 'Dont au moins 2 cas limites (information manquante, demande hors sujet).'),
        pas('Testez deux versions', 'Une seule modification entre les deux ; notez les résultats dans un tableau.'),
        pas('Ajoutez la boucle critique', 'Intégrez « évalue selon &lt;grille&gt; puis réécris » dans votre prompt final.')
      ],
      exercice: {
        type: 'texte', titre: 'Votre grille et vos cas de test',
        enonce: '<p>Pour un livrable de votre offre, écrivez une <strong>grille d\'au moins 4 critères</strong> vérifiables et listez <strong>au moins 3 cas de test</strong>, dont un <strong>cas limite</strong>.</p>',
        criteres: [
          mots(60),
          crit('Liste au moins 4 critères numérotés ou en puces', /(^|\n)\s*(1|-|•|\*)[\s\S]*(^|\n)\s*(2|-|•|\*)[\s\S]*(^|\n)\s*(3|-|•|\*)[\s\S]*(^|\n)\s*(4|-|•|\*)/m),
          crit('Mentionne des cas de test', /(cas|test|scénario|exemple d'entrée)/i),
          crit('Inclut un cas limite', /(limite|manquant|hors sujet|agressif|négatif|vide|ambigu|piège|difficile)/i)
        ],
        solution: '<p>Grille pour les réponses aux avis Google :<br>1. Remercie en citant un élément précis de l\'avis.<br>2. Moins de 80 mots.<br>3. Aucune donnée personnelle ni information médicale.<br>4. Pour un avis négatif : reconnaît le problème, propose un contact direct, ne contredit pas le client publiquement.<br>5. Signée du prénom du gérant.<br>Cas de test : (a) avis 5 étoiles détaillé ; (b) avis 1 étoile agressif sur l\'attente ; (c) avis vide avec seulement 3 étoiles (cas limite) ; (d) avis qui mentionne une allergie (cas limite sensible).</p>',
        explication: 'Grille et cas de test prêts. Vous les réutiliserez pour tester l\'automatisation des avis au module 5.'
      },
      quiz: [
        q('Pourquoi une grille de critères améliore-t-elle les résultats ?', ['Elle rallonge le prompt, ce qui augmente l\'effort du modèle', 'Elle remplace les exemples, qui deviennent alors inutiles', 'Elle transforme une exigence vague en points vérifiables', 'Elle active le mode de réflexion étendue du modèle'], 2, 'Des critères explicites permettent une critique et une réécriture ciblées.'),
        q('Entre deux versions d\'un prompt, combien de changements faire ?', ['Un seul, pour savoir ce qui a eu un effet', 'Le plus possible, pour gagner du temps', 'Aucun : changer de modèle suffit', 'Trois ou quatre, regroupés par thème'], 0, 'Un changement à la fois rend les tests interprétables.'),
        q('Un chatbot invente des horaires. Correction prioritaire ?', ['Passer à un modèle plus puissant, qui se trompe moins souvent', 'Allonger les réponses pour qu\'il justifie chaque horaire', 'Lui demander d\'être plus prudent, sans autre information', 'Fournir les horaires et autoriser « information non disponible »'], 3, 'Sources fournies + permission de ne pas savoir = moins d\'inventions.'),
        q('Qu\'est-ce qu\'un cas limite ?', ['Le cas le plus fréquent, qui sert de référence aux tests', 'Une situation inhabituelle qui met le prompt à l\'épreuve', 'Une demande que le modèle refuse pour raisons de sécurité', 'Le dernier exemple du prompt, placé juste avant la question'], 1, 'Les cas limites révèlent les faiblesses avant vos clients.')
      ],
      script: script('7 min',
        'Le jour où un client vous montre une réponse absurde de votre chatbot, il est trop tard. Les tests, c\'est avant.',
        ['La boucle critique puis réécriture avec une grille', 'Construire 5 à 10 cas de test', 'Un changement à la fois', 'Le tableau des défauts et de leurs corrections', 'La phrase qui réduit les inventions'],
        'Écrivez votre grille et vos cas de test : ils serviront au module 5.',
        'Tableau de tests rempli en direct sur deux versions d\'un prompt de réponse aux avis.')
    },
    {
      titre: 'Votre bibliothèque de prompts',
      objectifs: ['Organiser vos prompts pour les retrouver et les faire évoluer', 'Adapter les prompts de la bibliothèque bonus à vos clients', 'Préparer vos prompts à devenir des automatisations'],
      theorie: `<p>Un professionnel ne réécrit pas ses meilleurs prompts de mémoire : il les range, les versionne et les améliore. Votre bibliothèque est un actif de votre entreprise.</p>
<h2>La bibliothèque bonus</h2>
<p>La formation inclut une <a href="#/prompts">bibliothèque de plus de 100 prompts métiers</a>, classés par activité (commerces, artisans, agence, immobilier, coaching, e-commerce, vidéo, prospection, juridique et administratif…). Chacun suit la structure vue dans ce module, avec des <code>{{variables}}</code> à remplacer. Utilisez la recherche et les filtres, copiez, adaptez.</p>
<h2>Adapter un prompt en 4 gestes</h2>
<ol>
  <li><strong>Remplacez les variables</strong> par les informations du client.</li>
  <li><strong>Ajoutez le contexte</strong> : déposez le prompt dans le Projet du client (qui contient déjà ses documents).</li>
  <li><strong>Ajoutez 2 ou 3 exemples</strong> validés par le client.</li>
  <li><strong>Testez sur vos cas</strong> (leçon 5) avant de l'utiliser en production.</li>
</ol>
<h2>Organiser sa propre bibliothèque</h2>
${tableau(['Champ', 'Exemple'], [
  ['Nom', 'AVIS-REPONSE-v3'],
  ['Usage', 'Répondre aux avis Google d\'un commerce'],
  ['Modèle conseillé', 'Sonnet (volume) / Opus (avis sensibles)'],
  ['Variables', '{{nom_commerce}}, {{prenom_gerant}}, {{avis}}, {{note}}'],
  ['Grille de qualité', 'Les 5 critères de la leçon 5'],
  ['Historique', 'v3 : ajout de la règle sur les allergies']
])}
<p>Où la stocker : un document ou une base Notion, un dossier dans votre Drive, ou un outil d'expansion de texte pour les plus utilisés. L'important est d'avoir <strong>une seule source de vérité</strong>.</p>
<h2>Du prompt à l'automatisation</h2>
<p>Vos prompts les plus stables ont vocation à évoluer :</p>
<ul>
  <li>en <strong>instructions de Projet</strong> (le prompt devient le cadre permanent d'un client) ;</li>
  <li>en <strong>skill</strong> réutilisable dans Claude Code et l'application (module 4) ;</li>
  <li>en <strong>étape d'automatisation</strong> appelée par l'API (module 5).</li>
</ul>
<p>C'est cette progression (prompt, puis Projet, puis skill ou automatisation) qui vous permet de vendre plus de résultats sans travailler proportionnellement plus.</p>
${encart('warn', 'Propriété et confidentialité', '<p>Les prompts que vous créez pour un client peuvent contenir ses informations. Séparez vos modèles génériques (votre savoir-faire) des versions remplies (qui appartiennent au contexte du client), et précisez dans votre contrat ce qui est livré (module 7).</p>')}`,
      pas: [
        pas('Explorez la bibliothèque', 'Ouvrez la bibliothèque bonus, filtrez sur votre métier cible et repérez 5 prompts utiles.'),
        pas('Créez votre fichier', 'Un document « Bibliothèque » avec les champs du tableau.'),
        pas('Adaptez 3 prompts', 'Variables remplacées, contexte et exemples ajoutés, testés.'),
        pas('Versionnez', 'Nommez-les avec un numéro de version et notez ce qui change.'),
        pas('Repérez le candidat à l\'automatisation', 'Lequel de vos prompts allez-vous utiliser chaque semaine ? Notez-le pour le module 5.')
      ],
      exercice: {
        type: 'checklist', titre: 'Bibliothèque opérationnelle',
        enonce: '<p>Cochez au fur et à mesure.</p>',
        items: [
          'J\'ai exploré la bibliothèque bonus et filtré sur ma cible',
          'J\'ai créé mon document de bibliothèque avec les champs nom, usage, modèle, variables, grille, historique',
          'J\'ai adapté et testé 3 prompts pour mon activité',
          'Chaque prompt a un nom et un numéro de version',
          'J\'ai séparé mes modèles génériques des versions remplies pour un client',
          'J\'ai identifié le prompt que j\'automatiserai au module 5'
        ],
        explication: 'Bibliothèque en place. Elle grandira à chaque mission.'
      },
      quiz: [
        q('Quel est le premier geste pour adapter un prompt de la bibliothèque ?', ['Remplacer les variables par les informations du client', 'Le traduire en anglais pour de meilleurs résultats', 'Le raccourcir au maximum avant de l\'essayer', 'Le tester tel quel, variables {{…}} comprises'], 0, 'Puis on ajoute contexte, exemples et tests.'),
        q('Pourquoi versionner ses prompts ?', ['Parce que Claude refuse un prompt déjà utilisé', 'Pour que le cache de prompt réduise le coût de l\'API', 'Pour savoir ce qui a changé et revenir en arrière', 'Pour les déposer et les protéger juridiquement'], 2, 'Le versionnage rend vos améliorations traçables.'),
        q('Quelle progression permet de vendre plus sans travailler proportionnellement plus ?', ['Automatisation → Projet → prompt', 'Prompt → Projet → skill ou automatisation', 'Prompt → prompt plus long → modèle plus cher', 'Projet → nouveau compte par client → prompt'], 1, 'Un prompt stable devient un cadre permanent, puis une automatisation.'),
        q('Que séparer dans votre bibliothèque ?', ['Les prompts courts et les prompts longs, rangés à part', 'Les prompts en français et leur traduction en anglais', 'Les prompts écrits par vous et ceux écrits par Claude', 'Les modèles génériques et les versions remplies pour un client'], 3, 'Votre savoir-faire d\'un côté, le contexte client de l\'autre.')
      ],
      script: script('5 min',
        'Vos meilleurs prompts valent de l\'argent. Pourtant, la plupart des gens les perdent dans leur historique.',
        ['Présentation de la bibliothèque bonus et de ses filtres', 'Adapter un prompt en 4 gestes', 'La fiche d\'un prompt : nom, usage, modèle, variables, grille, historique', 'Du prompt au Projet, à la skill, à l\'automatisation', 'Propriété et confidentialité'],
        'Créez votre bibliothèque avec 3 prompts adaptés et testés. Prochain module : produire des livrables avec Claude.',
        'Navigation dans la bibliothèque bonus, filtre par métier, copie et adaptation d\'un prompt.')
    }
  ]
};
