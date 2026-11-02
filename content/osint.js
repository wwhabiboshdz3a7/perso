import { code, expr, exprVerif, sansErreur } from './_outils.js';

const motsMin = n => ({ label: `Au moins ${n} mots`, verif: t => t.trim().split(/\s+/).filter(Boolean).length >= n });

export default {
  description: 'Enquêter en sources ouvertes avec méthode : poser la question, pivoter, recouper et documenter ; géolocaliser une image (signalisation, plaques, soleil, coordonnées) ; exploiter les cartes et OpenStreetMap avec Overpass ; connaître le cadre légal, l\'éthique et les outils de référence.',
  intro: `<h3>Comment travailler ce parcours</h3><p>Quatre modules de quatre leçons, chacune avec un exercice (QCM, code JavaScript vérifié dans la page, texte à trous ou rédaction évaluée selon des critères) et un quiz. Chaque module renvoie vers des défis de l'<a href="#/ctf">arène CTF</a> pour mettre la méthode en pratique sur des cas simulés.</p><div class="callout warn"><b>Règle d'or</b>Tout ce que tu apprends ici s'exerce sur des cas fictifs, sur toi-même ou dans un cadre autorisé. Enquêter sur une personne réelle sans base légale, publier ses informations ou accéder à un système sans autorisation est interdit (RGPD, Code pénal). Voir le module 4 et la <a href="#/ctf/charte">charte de l'arène</a>.</div>`,
  modules: [
    /* ================= MODULE 1 ================= */
    {
      titre: 'Méthodologie de l\'enquête', niveau: 'Débutant', description: 'Le cycle du renseignement, la question d\'enquête, les pivots, le recoupement et la documentation.',
      lecons: [
        {
          titre: 'Qu\'est-ce que l\'OSINT ?',
          theorie: `<p>L'<strong>OSINT</strong> (<em>Open Source Intelligence</em>, renseignement d'origine sources ouvertes) consiste à collecter et analyser des informations <strong>accessibles légalement au public</strong> pour répondre à une question précise. « Ouvert » ne veut pas dire « gratuit » ni « sans règles » : cela veut dire que l'information est obtenue sans intrusion, sans tromperie illégale et sans accès réservé.</p>
<h2>Qui fait de l'OSINT ?</h2>
<ul><li><strong>Journalistes et vérificateurs</strong> : géolocaliser une vidéo, dater une photo, démonter une fausse information.</li><li><strong>Équipes de cybersécurité</strong> : mesurer la surface d'exposition d'une entreprise (sous-domaines, fuites, informations publiées par les salariés), avec l'accord de l'entreprise.</li><li><strong>Chercheurs et ONG</strong> : documenter des conflits ou des atteintes à l'environnement à partir d'images satellites.</li><li><strong>Bénévoles encadrés</strong> : aide à la recherche de personnes disparues lors d'événements organisés avec les autorités.</li></ul>
<h2>Les sources ouvertes</h2>
<table><tr><th>Type</th><th>Exemples</th></tr>
<tr><td>Web et réseaux sociaux</td><td>pages publiques, profils, commentaires, forums</td></tr>
<tr><td>Images et vidéos</td><td>photos publiées, métadonnées, vues de rue, satellites</td></tr>
<tr><td>Données publiques</td><td>registres d'entreprises, publications légales, cadastre, open data</td></tr>
<tr><td>Données techniques</td><td>DNS, certificats, archives du Web</td></tr>
<tr><td>Cartes</td><td>OpenStreetMap, cartes en ligne, plans de transports</td></tr></table>
<h2>Le cycle du renseignement</h2>
<ol><li><strong>Besoin</strong> : quelle question précise ? pour qui ? dans quel cadre ?</li><li><strong>Planification et collecte</strong> : quelles sources, quels outils, dans quel ordre.</li><li><strong>Traitement</strong> : trier, traduire, extraire (métadonnées, texte d'une image).</li><li><strong>Analyse</strong> : recouper, évaluer la fiabilité, formuler des hypothèses.</li><li><strong>Diffusion</strong> : un rapport clair, sourcé, avec ses limites.</li></ol>
<p>Le cycle tourne : une réponse fait souvent naître une nouvelle question.</p>
<div class="callout info"><b>Ce que l'OSINT n'est pas</b>Deviner un mot de passe, se connecter avec des identifiants trouvés, se faire passer pour quelqu'un afin d'obtenir des informations privées, ou harceler une personne : ce ne sont plus des sources ouvertes, ce sont des infractions.</div>`,
          exercice: {
            type: 'qcm', titre: 'Source ouverte ou pas ?', multiple: true,
            enonce: '<p>Lesquelles de ces actions relèvent de l\'OSINT (sources ouvertes, obtenues légalement) ? (plusieurs réponses)</p>',
            options: ['Consulter la page publique d\'une entreprise sur un registre officiel', 'Se connecter à un compte avec un mot de passe trouvé dans une fuite', 'Lire les métadonnées d\'une photo publiée librement par son auteur', 'Comparer une photo avec des vues de rue en ligne', 'Appeler un standard en se faisant passer pour un technicien afin d\'obtenir un code d\'accès', 'Consulter les anciennes versions d\'une page publique dans une archive du Web'],
            bonne: [0, 2, 3, 5],
            explication: 'Registres, métadonnées d\'une photo publique, vues de rue et archives du Web sont des sources ouvertes. Utiliser des identifiants volés ou manipuler quelqu\'un pour obtenir un accès sont des infractions.'
          },
          quiz: [
            { q: 'Que signifie OSINT ?', options: ['Open Source Intelligence', 'Online Security Internet', 'Official Source Investigation'], bonne: 0, explication: 'Renseignement d\'origine sources ouvertes.' },
            { q: 'Quelle est la première étape du cycle du renseignement ?', options: ['La collecte', 'La définition du besoin (la question)', 'La diffusion'], bonne: 1, explication: 'Sans question précise, on collecte tout et on ne trouve rien.' },
            { q: 'Une information publique peut-elle être utilisée sans limite ?', options: ['Oui, elle est publique', 'Non : les données personnelles restent protégées (RGPD) et l\'usage compte', 'Seulement si elle date de plus d\'un an'], bonne: 1, explication: 'Publique ne veut pas dire libre de droits ni hors RGPD.' }
          ]
        },
        {
          titre: 'Poser la question et planifier',
          theorie: `<p>Une enquête qui commence par « trouver tout sur… » finit noyée sous les informations. Une bonne enquête commence par une <strong>question fermée et vérifiable</strong>.</p>
<h2>Formuler la question</h2>
<table><tr><th>Trop vague</th><th>Précise</th></tr>
<tr><td>Où est prise cette photo ?</td><td>Dans quelle ville, et depuis quelle rue, cette photo publiée le 3 mars a-t-elle été prise ?</td></tr>
<tr><td>Que sait-on de cette entreprise ?</td><td>Quels sous-domaines et quelles adresses e-mail de l'entreprise sont publiquement exposés (audit autorisé) ?</td></tr>
<tr><td>Cette image est-elle vraie ?</td><td>Quand et par qui cette image a-t-elle été publiée pour la première fois ?</td></tr></table>
<h2>Le plan d'enquête</h2>
<ol><li><strong>Cadre</strong> : qui demande, pourquoi, quelle base légale (mission, consentement, intérêt légitime documenté) ?</li><li><strong>Point de départ</strong> : ce que l'on a déjà (une image, un pseudo, une adresse e-mail, un nom de domaine).</li><li><strong>Hypothèses</strong> : ce que l'on pense trouver, pour pouvoir le confirmer… ou l'infirmer.</li><li><strong>Sources et outils</strong> dans l'ordre : du plus simple (lire l'image) au plus long (requêtes cartographiques).</li><li><strong>Critère d'arrêt</strong> : quand la réponse est-elle suffisante ? Combien de temps au maximum ?</li><li><strong>Limites</strong> : ce que l'on s'interdit (contacter la personne, créer de faux comptes, publier des données).</li></ol>
<h2>Biais à surveiller</h2>
<ul><li><strong>Biais de confirmation</strong> : ne retenir que ce qui va dans le sens de son hypothèse. Antidote : chercher activement ce qui la contredit.</li><li><strong>Effet tunnel</strong> : s'acharner sur une piste. Antidote : un temps maximal par piste.</li><li><strong>Ancrage</strong> : rester sur la première impression (« c'est forcément en Espagne »). Antidote : lister au moins deux autres possibilités.</li></ul>
<div class="callout info"><b>Dans l'arène</b>Chaque défi commence par un « dossier » : le cadre, le point de départ et la question. Lis-le comme un plan d'enquête.</div>`,
          exercice: {
            type: 'texte', titre: 'Rédiger un plan d\'enquête',
            enonce: `<p>Une association de quartier te transmet une photo virale présentée comme « l'inondation d'hier dans notre ville » et te demande de la vérifier avant de la relayer. Rédige un <strong>plan d'enquête</strong> en six rubriques : <code>Question</code>, <code>Cadre</code>, <code>Départ</code>, <code>Hypothèses</code>, <code>Étapes</code> (au moins trois, numérotées) et <code>Limites</code>.</p>`,
            placeholder: 'Question : …\nCadre : …\nDépart : …\nHypothèses : …\nÉtapes : 1. … 2. … 3. …\nLimites : …',
            criteres: [
              { label: 'Une question précise (avec « quand », « où » ou « qui »)', re: /question\s*:[^\n]*(quand|o[uù]|qui|premi[eè]re)/i },
              { label: 'Le cadre ou la demande est précisé', re: /cadre\s*:[^\n]{8,}/i },
              { label: 'Au moins deux hypothèses', re: /hypoth[eè]ses?\s*:[^\n]*(,|;| ou | et )/i },
              { label: 'Au moins trois étapes numérotées', verif: t => ((t.split(/[ée]tapes?\s*:/i)[1] || '').match(/\d[.)]/g) || []).length >= 3 },
              { label: 'Une recherche inversée ou la recherche de la première publication', re: /(invers|premi[eè]re publication|tineye|lens|yandex)/i },
              { label: 'Des limites (ce qu\'on s\'interdit)', re: /limites?\s*:[^\n]{8,}/i },
              motsMin(70)
            ],
            solution: '<p>Question : où et quand cette photo a-t-elle été publiée pour la première fois, et montre-t-elle bien notre ville hier ? Cadre : demande de l\'association avant relais public, vérification sur sources ouvertes uniquement. Départ : l\'image virale, la date et le compte du premier partage vu. Hypothèses : photo récente de notre ville ; ou photo ancienne d\'une autre inondation ; ou image retouchée ou générée. Étapes : 1. lire l\'image (panneaux, langue, bâtiments, météo) ; 2. recherche inversée sur Google Lens, Yandex, Bing et TinEye, tri par date ; 3. comparer avec des vues de rue et des photos d\'archives ; 4. chercher des articles et des relevés météo de la veille ; 5. conclure avec un niveau de confiance. Limites : pas de contact avec les personnes visibles, pas de publication de visages, deux heures maximum.</p>'
          },
          quiz: [
            { q: 'Quelle question d\'enquête est la meilleure ?', options: ['Tout savoir sur ce compte', 'Quand et par qui cette image a-t-elle été publiée pour la première fois ?', 'Est-ce que c\'est vrai ?'], bonne: 1, explication: 'Elle est précise, vérifiable et oriente la méthode.' },
            { q: 'À quoi sert un critère d\'arrêt ?', options: ['À arrêter dès la première piste', 'À savoir quand la réponse suffit et à borner le temps passé', 'À rien'], bonne: 1, explication: 'Il évite l\'effet tunnel et la collecte sans fin.' },
            { q: 'Comment lutter contre le biais de confirmation ?', options: ['Chercher activement ce qui contredit son hypothèse', 'Ne lire qu\'une source fiable', 'Aller plus vite'], bonne: 0, explication: 'Une hypothèse qui résiste à la contradiction est plus solide.' }
          ]
        },
        {
          titre: 'Pivoter et recouper',
          theorie: `<p>Un <strong>pivot</strong> est une donnée qui permet de passer d'une source à une autre : un pseudo, une adresse e-mail, un numéro, une photo de profil, un nom de domaine, un lieu, un objet visible. L'enquête avance de pivot en pivot, comme sur un graphe.</p>
<h2>Les pivots classiques</h2>
<table><tr><th>Pivot</th><th>Où il mène</th></tr>
<tr><td>Pseudo</td><td>d'autres réseaux (souvent avec une variante : point, tiret bas, chiffres)</td></tr>
<tr><td>Adresse e-mail</td><td>moteurs (entre guillemets), sites de partage de texte, avis, comptes associés</td></tr>
<tr><td>Photo de profil</td><td>recherche inversée : la même photo ailleurs</td></tr>
<tr><td>Nom de domaine</td><td>archives du Web, enregistrements DNS, certificats</td></tr>
<tr><td>Lieu, objet, enseigne</td><td>cartes, vues de rue, OpenStreetMap</td></tr></table>
<h2>Les variantes de pseudo</h2>
<p>Beaucoup de plateformes interdisent certains caractères. <code>ines.vldr</code> devient <code>ines_vldr</code>, <code>ines-vldr</code> ou <code>inesvldr</code>. Des outils comme <strong>Sherlock</strong> testent un pseudo sur des centaines de sites ; à toi de leur donner les bonnes variantes.</p>
${code('javascript', `"ines.vldr".replace(/[._-]+/g, "_"); // "ines_vldr"`)}
<h2>Recouper : deux sources indépendantes</h2>
<p>Deux comptes avec le même pseudo ne sont pas forcément la même personne. On cherche des <strong>éléments communs indépendants</strong> : même photo, même ville, même style d'écriture, liens croisés entre les profils. Deux sources qui se recopient ne comptent que pour une.</p>
<h2>Évaluer : la grille de l'Amirauté</h2>
<p>Les analystes notent séparément la <strong>fiabilité de la source</strong> (A = toujours fiable … E = peu fiable, F = impossible à juger) et la <strong>crédibilité de l'information</strong> (1 = confirmée par d'autres sources … 5 = improbable, 6 = impossible à juger). « B2 » : source généralement fiable, information probablement vraie.</p>
<div class="callout warn"><b>Attention aux homonymes</b>Attribuer à tort un compte à une personne peut lui nuire gravement. Sans recoupement solide, on écrit « possible » ou « non confirmé », jamais « c'est lui ».</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Générer les variantes d\'un pseudo',
            enonce: `<p>Écris <code>variantesPseudo(p)</code> qui renvoie un tableau <strong>trié</strong> (tri par défaut de JavaScript), <strong>sans doublon</strong>, des variantes d'un pseudo : on supprime les espaces autour, on passe en minuscules, puis on remplace <strong>chaque groupe</strong> de séparateurs (<code>.</code>, <code>_</code>, <code>-</code>) par <code>.</code>, puis par <code>_</code>, puis par <code>-</code>, puis par rien. Si le pseudo ne contient aucun séparateur, on renvoie <code>[pseudo]</code> (en minuscules).</p>`,
            depart: `function variantesPseudo(p) {
  // ...
}

console.log(variantesPseudo("ines.vldr"));
`,
            solution: `function variantesPseudo(p) {
  const base = p.trim().toLowerCase();
  if (!/[._-]/.test(base)) return [base];
  const res = new Set([".", "_", "-", ""].map(s => base.replace(/[._-]+/g, s)));
  return [...res].sort();
}

console.log(variantesPseudo("ines.vldr"));`,
            tests: [sansErreur(), expr('variantesPseudo("ines.vldr")', ['ines-vldr', 'ines.vldr', 'ines_vldr', 'inesvldr']), expr('variantesPseudo("  Geo_Hibou ")', ['geo-hibou', 'geo.hibou', 'geo_hibou', 'geohibou'], 'Pense à trim() et toLowerCase().'), expr('variantesPseudo("lumio")', ['lumio']), expr('variantesPseudo("a.b_c")', ['a-b-c', 'a.b.c', 'a_b_c', 'abc'], 'Chaque séparateur est remplacé par le même caractère.'), expr('variantesPseudo("x__y")', ['x-y', 'x.y', 'x_y', 'xy'], 'Un groupe de séparateurs consécutifs devient un seul caractère : utilise [._-]+ .')]
          },
          quiz: [
            { q: 'Qu\'est-ce qu\'un pivot ?', options: ['Une donnée qui permet de passer d\'une source à une autre', 'Un outil payant', 'La conclusion de l\'enquête'], bonne: 0, explication: 'Pseudo, e-mail, photo, domaine, lieu… chacun ouvre de nouvelles recherches.' },
            { q: 'Deux comptes avec le même pseudo appartiennent-ils forcément à la même personne ?', options: ['Oui', 'Non : il faut des éléments communs indépendants', 'Oui si le pseudo est rare'], bonne: 1, explication: 'Homonymes, usurpations, coïncidences : on recoupe.' },
            { q: 'Que signifie la cote « A1 » ?', options: ['Source fiable, information confirmée', 'Source inconnue, information improbable', 'Première source trouvée'], bonne: 0, explication: 'Lettre = fiabilité de la source, chiffre = crédibilité de l\'information.' }
          ]
        },
        {
          titre: 'Documenter et archiver',
          theorie: `<p>Une découverte non documentée n'existe pas : la page peut être supprimée dans l'heure, le compte rendu privé, la photo remplacée. Documenter, c'est permettre à quelqu'un d'autre de <strong>refaire ton raisonnement</strong>.</p>
<h2>Le journal d'enquête</h2>
<p>Pour chaque élément : <strong>date et heure</strong> (avec fuseau), <strong>adresse exacte</strong> (URL), ce que tu as cherché et comment (requête, outil), ce que tu as trouvé, et ton interprétation, séparée des faits.</p>
${code('text', `2026-03-04 14:12 (UTC+1) · https://chirp.example/ines_vldr
Méthode : variante du pseudo (point → tiret bas) testée sur PseudoScan
Fait : message du 26/02 « voici Pistache 🐈 »
Interprétation : le chat s'appelle probablement Pistache (B2)
Capture : 2026-03-04_chirp_ines_vldr.png · SHA-256 : 9f2c…`)}
<h2>Capturer et archiver</h2>
<ul><li><strong>Capture d'écran complète</strong> avec l'URL et l'heure visibles (ou extension de capture pleine page).</li><li><strong>Archive publique</strong> : « Save Page Now » de la Wayback Machine ou archive.today, quand c'est approprié (attention : archiver publiquement une donnée personnelle la rend plus visible).</li><li><strong>Empreinte (hash)</strong> SHA-256 de chaque fichier conservé : elle prouve qu'il n'a pas été modifié depuis.</li><li>Des outils dédiés enregistrent automatiquement tout cela (par exemple Hunchly), mais un tableur rigoureux suffit pour débuter.</li></ul>
<h2>Faits, déductions, hypothèses</h2>
<p>Dans le journal comme dans le rapport, distingue toujours : ce que l'on <strong>voit</strong> (fait), ce que l'on en <strong>déduit</strong> (avec un niveau de confiance) et ce que l'on <strong>suppose</strong> encore.</p>
<div class="callout info"><b>Minimiser aussi la conservation</b>Ne garde que ce qui sert la question, protège ces fichiers (chiffrement) et supprime-les à la fin de la mission : c'est une obligation du RGPD quand il s'agit de données personnelles.</div>`,
          exercice: {
            type: 'texte', titre: 'Une entrée de journal d\'enquête',
            enonce: `<p>À partir du défi <a href="#/ctf/osint-pseudo">« Le pseudo voyageur »</a> de l'arène (ou d'une recherche sur toi-même), rédige <strong>une entrée de journal</strong> complète avec les rubriques <code>Date</code>, <code>URL</code>, <code>Méthode</code>, <code>Fait</code>, <code>Interprétation</code> (avec une cote de l'Amirauté) et <code>Capture</code>.</p>`,
            placeholder: 'Date : …\nURL : …\nMéthode : …\nFait : …\nInterprétation : …\nCapture : …',
            criteres: [
              { label: 'Une date avec l\'heure', re: /date\s*:[^\n]*\d{1,2}[:h]\d{2}/i },
              { label: 'Une URL complète', re: /url\s*:[^\n]*https?:\/\/\S+/i },
              { label: 'La méthode ou l\'outil utilisé', re: /m[ée]thode\s*:[^\n]{8,}/i },
              { label: 'Un fait observé', re: /fait\s*:[^\n]{8,}/i },
              { label: 'Une interprétation avec une cote (ex. B2)', re: /[Ii]nterpr[ée]tation\s*:[^\n]*\b[A-F][1-6]\b/ },
              { label: 'La capture est référencée (nom de fichier ou empreinte)', re: /capture\s*:[^\n]*(\.png|\.jpg|\.pdf|sha|hash|empreinte)/i },
              motsMin(35)
            ],
            solution: '<p>Date : 2026-03-04 14:12 (UTC+1). URL : https://chirp.example/ines_vldr. Méthode : variante du pseudo ines.vldr avec un tiret bas, testée sur PseudoScan puis ouverte directement. Fait : un message du 26 février présente « Pistache 🐈 ». Interprétation : le chat d\'Inès s\'appelle très probablement Pistache, cohérent avec son commentaire sur Pixelgram (B2). Capture : 2026-03-04_chirp_ines_vldr.png, SHA-256 consigné dans le tableur.</p>'
          },
          quiz: [
            { q: 'Pourquoi calculer l\'empreinte SHA-256 d\'une capture ?', options: ['Pour la compresser', 'Pour prouver qu\'elle n\'a pas été modifiée depuis', 'Pour la chiffrer'], bonne: 1, explication: 'Le moindre changement donne une empreinte totalement différente.' },
            { q: 'Que faut-il séparer dans un journal d\'enquête ?', options: ['Les faits et les interprétations', 'Les images et les textes', 'Les sources payantes et gratuites'], bonne: 0, explication: 'Un lecteur doit savoir ce qui est observé et ce qui est déduit.' },
            { q: 'Que faire des données personnelles collectées à la fin d\'une mission ?', options: ['Les publier', 'Les garder au cas où', 'Les supprimer (ou les rendre au commanditaire) selon le cadre prévu'], bonne: 2, explication: 'Minimisation et durée de conservation limitée : principes du RGPD.' }
          ]
        }
      ]
    },
    /* ================= MODULE 2 ================= */
    {
      titre: 'Géolocalisation', niveau: 'Débutant → intermédiaire', description: 'Lire une image, signalisation et plaques, soleil et ombres, coordonnées et distances.',
      lecons: [
        {
          titre: 'Lire une image : du continent à la rue',
          theorie: `<p>Géolocaliser, c'est réduire progressivement la zone possible : <strong>continent → pays → région → ville → rue → point de vue</strong>. À chaque étape, on s'appuie sur plusieurs indices indépendants.</p>
<h2>L'inventaire systématique</h2>
<ol><li><strong>Texte</strong> : langue, alphabet, enseignes, numéros de téléphone (indicatif), noms de domaine (.fr, .dz, .co.za), plaques de rue.</li><li><strong>Route</strong> : sens de circulation, marquages (couleur des lignes), panneaux, bornes, poteaux, plaques d'immatriculation.</li><li><strong>Architecture</strong> : matériaux (brique rose de Toulouse, pierre de taille parisienne), toits (tuiles canal, ardoise), balcons, escaliers extérieurs.</li><li><strong>Nature</strong> : végétation (palmiers, oliviers, érables), relief, couleur de la terre, neige.</li><li><strong>Lumière</strong> : position du soleil, longueur et direction des ombres.</li><li><strong>Contexte</strong> : vêtements, véhicules, transports en commun, logos de métro ou de tram.</li></ol>
<h2>Indices forts et indices faibles</h2>
<table><tr><th>Indice fort</th><th>Indice faible (à confirmer)</th></tr>
<tr><td>Nom de rue lisible, monument unique</td><td>Type de végétation</td></tr>
<tr><td>Indicatif téléphonique, domaine national</td><td>Couleur des voitures, marques</td></tr>
<tr><td>Style de plaque d'immatriculation</td><td>Météo, nuages</td></tr>
<tr><td>Alphabet rare (tifinagh, géorgien…)</td><td>Style « méditerranéen »</td></tr></table>
<h2>Vérifier</h2>
<p>Une hypothèse se confirme en retrouvant le <strong>même point de vue</strong> : vue de rue (Street View, Mapillary), vue satellite, photos d'autres personnes au même endroit. On aligne au moins deux éléments fixes (un angle de bâtiment, un poteau, une silhouette de colline).</p>
<div class="callout info"><b>Dans l'arène</b>Commence par <a href="#/ctf/geo-capitole">La place aux huit colonnes</a> (texte visible), puis <a href="#/ctf/geo-kabylie">Trois écritures sur un panneau</a> (indices faibles combinés).</div>`,
          exercice: {
            type: 'qcm', titre: 'Classer les indices', multiple: true,
            enonce: '<p>Sur une photo de rue, lesquels de ces indices sont <strong>forts</strong> (ils suffisent presque à eux seuls à identifier le pays) ? (plusieurs réponses)</p>',
            options: ['Un panneau stop où est écrit « ARRÊT »', 'Des palmiers', 'Un numéro de téléphone commençant par +213', 'Un ciel nuageux', 'Une plaque d\'immatriculation « Je me souviens »', 'Une voiture rouge'],
            bonne: [0, 2, 4],
            explication: '« ARRÊT » et « Je me souviens » désignent le Québec, +213 l\'Algérie. Les palmiers, le ciel ou la couleur d\'une voiture sont des indices faibles.'
          },
          quiz: [
            { q: 'Dans quel ordre réduit-on la zone ?', options: ['Rue, ville, pays', 'Continent, pays, région, ville, rue', 'Au hasard'], bonne: 1, explication: 'Du général au particulier.' },
            { q: 'Un nom de domaine .dz sur une enseigne indique…', options: ['Le Danemark', 'L\'Algérie', 'L\'Allemagne'], bonne: 1, explication: '.dz (Dzayer) est le domaine national algérien ; .de est l\'Allemagne, .dk le Danemark.' },
            { q: 'Comment confirmer une géolocalisation ?', options: ['En retrouvant le même point de vue sur une vue de rue ou satellite', 'En demandant à une IA', 'Avec un seul indice fort'], bonne: 0, explication: 'On aligne plusieurs éléments fixes.' }
          ]
        },
        {
          titre: 'Signalisation et plaques d\'immatriculation',
          theorie: `<p>La signalisation routière est l'un des meilleurs indices : chaque pays a ses conventions, souvent très visibles.</p>
<h2>France</h2>
<ul><li><strong>Plaques (SIV, depuis 2009)</strong> : format <code>AB-123-CD</code>, bande bleue européenne à gauche avec « F », bande bleue à droite avec le <strong>logo régional</strong> et un <strong>numéro de département</strong> (31 = Haute-Garonne, 11 = Aude, 75 = Paris). Ce numéro est choisi par le propriétaire : c'est un indice, pas une preuve.</li><li><strong>Bornes kilométriques</strong> : tête <strong>rouge</strong> = route nationale, <strong>jaune</strong> = départementale.</li><li><strong>Plaques de rue</strong> : à Paris, émail bleu à cadre vert avec l'arrondissement ; à Toulouse, plaques bilingues français-occitan dans le centre.</li></ul>
<h2>Algérie</h2>
<p>Plaques à chiffres noirs sur fond blanc, au format <code>NNNNN CAA WW</code> : un numéro d'ordre à cinq chiffres, un groupe de trois chiffres (le premier indique la <strong>catégorie</strong> du véhicule, 1 pour une voiture particulière, les deux suivants l'<strong>année</strong> de mise en circulation), puis le code de la <strong>wilaya</strong> (16 = Alger, 15 = Tizi Ouzou, 31 = Oran, 25 = Constantine). Panneaux en arabe et en français, parfois en tifinagh (tamazight), surtout en Kabylie.</p>
<h2>Ailleurs</h2>
<table><tr><th>Indice</th><th>Où</th></tr>
<tr><td>Panneau stop « ARRÊT », plaque « Je me souviens » (arrière seulement)</td><td>Québec</td></tr>
<tr><td>Plaque arrière jaune, circulation à gauche</td><td>Royaume-Uni</td></tr>
<tr><td>Plaques « CA … » (Cape Town), circulation à gauche, afrikaans</td><td>Le Cap, Afrique du Sud</td></tr>
<tr><td>Lignes centrales jaunes</td><td>Amériques (États-Unis, Canada…), entre autres</td></tr></table>
<h2>Le sens de circulation</h2>
<p>Environ un tiers de la population mondiale roule à gauche (Royaume-Uni, Irlande, Japon, Inde, Australie, Afrique australe…). Attention : une image <strong>retournée en miroir</strong> inverse aussi le sens de circulation. Vérifie que le texte se lit à l'endroit.</p>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Décoder une plaque algérienne',
            enonce: `<p>Écris <code>decoderPlaqueDZ(texte)</code> qui lit une plaque au format <code>NNNNN CAA WW</code> (groupes séparés par des espaces ou des tirets) et renvoie l'objet <code>{ serie, categorie, annee, wilaya }</code> dans cet ordre : <code>serie</code> = les cinq chiffres (chaîne), <code>categorie</code> = le premier chiffre du groupe central (nombre), <code>annee</code> = 2000 + AA si AA ≤ 30, sinon 1900 + AA, <code>wilaya</code> = le dernier groupe (nombre). Si le texte ne correspond pas, renvoie <code>null</code>.</p><p>Écris aussi <code>nomWilaya(texte)</code> qui renvoie le nom de la wilaya grâce à l'objet <code>WILAYAS</code> fourni, ou <code>"inconnue"</code>.</p>`,
            depart: `const WILAYAS = { 6: "Béjaïa", 9: "Blida", 15: "Tizi Ouzou", 16: "Alger", 19: "Sétif", 23: "Annaba", 25: "Constantine", 31: "Oran" };

function decoderPlaqueDZ(texte) {
  // ...
}

function nomWilaya(texte) {
  // ...
}

console.log(decoderPlaqueDZ("04217 118 16"), nomWilaya("18342-114-15"));
`,
            solution: `const WILAYAS = { 6: "Béjaïa", 9: "Blida", 15: "Tizi Ouzou", 16: "Alger", 19: "Sétif", 23: "Annaba", 25: "Constantine", 31: "Oran" };

function decoderPlaqueDZ(texte) {
  const m = String(texte).trim().match(/^(\\d{5})[\\s-]+(\\d)(\\d{2})[\\s-]+(\\d{2})$/);
  if (!m) return null;
  const aa = Number(m[3]);
  return { serie: m[1], categorie: Number(m[2]), annee: aa <= 30 ? 2000 + aa : 1900 + aa, wilaya: Number(m[4]) };
}

function nomWilaya(texte) {
  const p = decoderPlaqueDZ(texte);
  return p ? (WILAYAS[p.wilaya] || "inconnue") : "inconnue";
}

console.log(decoderPlaqueDZ("04217 118 16"), nomWilaya("18342-114-15"));`,
            tests: [sansErreur(), expr('decoderPlaqueDZ("04217 118 16")', { serie: '04217', categorie: 1, annee: 2018, wilaya: 16 }, 'Respecte l\'ordre des clés : serie, categorie, annee, wilaya.'), expr('decoderPlaqueDZ("18342-114-15").wilaya', 15, 'Les séparateurs peuvent être des tirets.'), expr('decoderPlaqueDZ("12345 199 31").annee', 1999), expr('decoderPlaqueDZ("AB-123-CD")', null), expr('nomWilaya("00561 109 16")', 'Alger'), expr('nomWilaya("00561 109 48")', 'inconnue')]
          },
          quiz: [
            { q: 'Sur une plaque française récente, le numéro à droite indique…', options: ['La date d\'immatriculation', 'Un département choisi par le propriétaire', 'Le numéro du garage'], bonne: 1, explication: 'Indice utile, mais pas une preuve de localisation.' },
            { q: 'Une borne à tête jaune en France signale…', options: ['Une route nationale', 'Une route départementale', 'Une autoroute'], bonne: 1, explication: 'Rouge pour les nationales, jaune pour les départementales.' },
            { q: 'Pourquoi se méfier du sens de circulation sur une photo ?', options: ['L\'image peut avoir été retournée en miroir', 'Il change selon l\'heure', 'Il n\'est jamais visible'], bonne: 0, explication: 'Vérifie que les textes se lisent à l\'endroit.' }
          ]
        },
        {
          titre: 'Soleil et ombres : hémisphère et heure',
          theorie: `<p>Le soleil est une horloge et une boussole. Avec une ombre, une heure ou une date, on peut retrouver l'hémisphère, l'orientation d'une rue, voire vérifier l'heure d'une photo.</p>
<h2>L'hémisphère</h2>
<p>Vers midi solaire, le soleil est au <strong>sud</strong> dans l'hémisphère nord (au-delà du tropique du Cancer) et au <strong>nord</strong> dans l'hémisphère sud (au-delà du tropique du Capricorne). Les ombres de midi pointent donc vers le nord… ou vers le sud. Entre les tropiques, cela dépend de la saison.</p>
<h2>La direction</h2>
<ul><li>Le soleil se lève à l'<strong>est</strong> et se couche à l'<strong>ouest</strong> (nord-est/nord-ouest en été dans l'hémisphère nord).</li><li>Une ombre pointe à l'opposé du soleil : en connaissant l'heure, on en déduit l'orientation de la rue ou du bâtiment.</li><li>La <strong>longueur</strong> de l'ombre dépend de la hauteur du soleil : ombre = hauteur de l'objet ÷ tan(hauteur du soleil).</li></ul>
<h2>Heure solaire et heure légale</h2>
<p>Un cadran solaire donne l'<strong>heure solaire vraie</strong>. Pour la convertir en heure légale :</p>
${code('text', `heure légale = heure solaire
             − longitude (en degrés, positive à l'est) × 4 min
             − équation du temps (en minutes)
             + décalage du fuseau (UTC+1 en hiver, UTC+2 en été en France)`)}
<p>L'<strong>équation du temps</strong> (de −14 à +16 minutes environ) corrige l'orbite elliptique et l'inclinaison de l'axe terrestre : mi-février, le soleil « retarde » d'environ 14 minutes ; début novembre, il « avance » d'environ 16 minutes.</p>
<h2>Les outils</h2>
<p><strong>SunCalc</strong> (suncalc.org) affiche, pour un lieu et une date, la direction du soleil heure par heure ; <strong>Google Earth Pro</strong> et d'autres logiciels simulent l'éclairage. On compare la direction des ombres de la photo avec celle prévue.</p>
<div class="callout info"><b>Dans l'arène</b><a href="#/ctf/geo-le-cap">Le soleil est au nord</a> (hémisphère) et <a href="#/ctf/geo-cadran">L'heure du cadran</a> (conversion d'heure).</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'De l\'heure solaire à l\'heure légale',
            enonce: `<p>Écris <code>heureLegale(solaire, longitude, eqTemps, decalage)</code> : <code>solaire</code> est une chaîne <code>"HH:MM"</code>, <code>longitude</code> en degrés (positive à l'est), <code>eqTemps</code> en minutes, <code>decalage</code> en heures. Applique la formule de la leçon, <strong>arrondis à la minute</strong>, ramène le résultat entre 00:00 et 23:59, et renvoie une chaîne <code>"HH:MM"</code> (deux chiffres partout).</p>`,
            depart: `function heureLegale(solaire, longitude, eqTemps, decalage) {
  // ...
}

// Cadran de Toulouse le 15 août : 14 h solaires
console.log(heureLegale("14:00", 1.444, -4.1, 2));
`,
            solution: `function heureLegale(solaire, longitude, eqTemps, decalage) {
  const [h, m] = solaire.split(":").map(Number);
  let minutes = h * 60 + m - longitude * 4 - eqTemps + decalage * 60;
  minutes = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0");
}

console.log(heureLegale("14:00", 1.444, -4.1, 2));`,
            tests: [sansErreur(), expr('heureLegale("14:00", 1.444, -4.1, 2)', '15:58'), expr('heureLegale("12:00", 0, 0, 0)', '12:00'), expr('heureLegale("12:00", 2.35, 16.4, 1)', '12:34', 'Paris début novembre : 720 − 9,4 − 16,4 + 60 = 754,2 → 12:34.'), expr('heureLegale("06:05", 3.06, -3, 1)', '06:56'), expr('heureLegale("23:30", -3, 0, 2)', '01:42', 'Ramène le résultat dans la journée avec un modulo 1440.')]
          },
          quiz: [
            { q: 'À midi, en France, les ombres pointent vers…', options: ['le nord', 'le sud', 'l\'est'], bonne: 0, explication: 'Le soleil est au sud, l\'ombre à l\'opposé.' },
            { q: 'Que corrige l\'équation du temps ?', options: ['Le changement d\'heure', 'Les irrégularités de la course apparente du soleil au fil de l\'année', 'L\'altitude du lieu'], bonne: 1, explication: 'Orbite elliptique et inclinaison de l\'axe : jusqu\'à ±16 min.' },
            { q: 'Quel outil donne la direction du soleil pour un lieu, une date et une heure ?', options: ['SunCalc', 'Sherlock', 'exiftool'], bonne: 0, explication: 'Sherlock cherche des pseudos, exiftool lit des métadonnées.' }
          ]
        },
        {
          titre: 'Coordonnées, distances et précision',
          theorie: `<p>Une géolocalisation se termine par des <strong>coordonnées</strong>, et souvent par une question de distance : « à combien de mètres de la cible suis-je ? »</p>
<h2>Deux écritures</h2>
<ul><li><strong>Décimale (DD)</strong> : <code>43.6044, 1.4439</code> (latitude puis longitude ; sud et ouest en négatif).</li><li><strong>Degrés, minutes, secondes (DMS)</strong> : <code>43°36'16"N 1°26'38"E</code>.</li></ul>
${code('text', `décimal = degrés + minutes / 60 + secondes / 3600   (négatif si S ou O/W)
43°36'16"N  →  43 + 36/60 + 16/3600 = 43.6044`)}
<p>Ordre de grandeur : 1° de latitude ≈ 111 km ; 0,001° ≈ 111 m ; la 4<sup>e</sup> décimale ≈ 11 m. Donner 8 décimales pour un point estimé « à la rue près » est une fausse précision.</p>
<h2>La distance à vol d'oiseau</h2>
<p>La <strong>formule de haversine</strong> donne la distance sur une sphère de rayon R ≈ 6 371 km :</p>
${code('javascript', `const rad = Math.PI / 180;
const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
const d = 2 * 6371 * Math.asin(Math.sqrt(a)); // en km (dLat et dLon en radians)`)}
<h2>Les geohash</h2>
<p>Un <strong>geohash</strong> découpe le monde en cellules nommées par une courte chaîne : plus elle est longue, plus la cellule est petite (6 caractères ≈ 1,2 km, 7 ≈ 150 m, 8 ≈ 40 m). L'arène s'en sert pour vérifier ton clic <strong>sans stocker les coordonnées cibles</strong> : elle compare l'empreinte de la cellule cliquée à une liste d'empreintes de cellules acceptées.</p>
<h2>Exprimer la précision</h2>
<p>Dans un rapport, on indique la précision : « photo prise sur le quai de la Daurade, à ± 50 m, angle de vue vers l'ouest ». Une zone (cercle, rue, quartier) honnête vaut mieux qu'un point faussement exact.</p>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Convertir et mesurer',
            enonce: `<p>Écris <code>dmsVersDecimal(texte)</code> qui convertit une coordonnée DMS comme <code>43°36'16"N</code> en nombre décimal <strong>arrondi à 4 décimales</strong> (négatif pour S, O ou W ; renvoie <code>null</code> si le texte n'est pas reconnu), et <code>distanceKm(lat1, lon1, lat2, lon2)</code> qui renvoie la distance haversine en km (R = 6371) <strong>arrondie au dixième</strong>.</p>`,
            depart: `function dmsVersDecimal(texte) {
  // ...
}

function distanceKm(lat1, lon1, lat2, lon2) {
  // ...
}

console.log(dmsVersDecimal("43°36'16\\"N"), distanceKm(43.6044, 1.4439, 48.8566, 2.3522));
`,
            solution: `function dmsVersDecimal(texte) {
  const m = texte.match(/(\\d+(?:\\.\\d+)?)°\\s*(\\d+(?:\\.\\d+)?)'\\s*(\\d+(?:\\.\\d+)?)"\\s*([NSEOW])/i);
  if (!m) return null;
  let v = Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600;
  if (/[SOW]/i.test(m[4])) v = -v;
  return Math.round(v * 10000) / 10000;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10;
}

console.log(dmsVersDecimal("43°36'16\\"N"), distanceKm(43.6044, 1.4439, 48.8566, 2.3522));`,
            tests: [sansErreur(), expr('dmsVersDecimal("43°36\'16\\"N")', 43.6044), expr('dmsVersDecimal("1°26\'38\\"E")', 1.4439), expr('dmsVersDecimal("33°55\'30\\"S")', -33.925, 'Sud et ouest sont négatifs.'), expr('dmsVersDecimal("73°34\'48\\"O")', -73.58, 'O (ouest en français) est négatif, comme W.'), expr('dmsVersDecimal("Toulouse")', null), expr('distanceKm(0, 0, 0, 1)', 111.2), expr('distanceKm(43.6044, 1.4439, 48.8566, 2.3522)', 588.2, 'Toulouse–Paris : environ 588 km à vol d\'oiseau.'), exprVerif('distanceKm(36.7538, 3.0588, 43.6044, 1.4439)', 'Alger–Toulouse ≈ 774 km', v => Math.abs(v - 774) < 0.2)]
          },
          quiz: [
            { q: 'Que vaut 0,001° de latitude ?', options: ['Environ 1 m', 'Environ 111 m', 'Environ 11 km'], bonne: 1, explication: '1° ≈ 111 km.' },
            { q: 'Comment s\'écrit une longitude ouest en décimal ?', options: ['Avec un signe moins', 'Avec un W à la fin uniquement', 'Elle n\'existe pas'], bonne: 0, explication: 'Ouest et sud sont négatifs.' },
            { q: 'Pourquoi l\'arène utilise-t-elle des geohash hachés ?', options: ['Pour aller plus vite', 'Pour vérifier un clic sans publier les coordonnées de la cible', 'Pour dessiner la carte'], bonne: 1, explication: 'On compare des empreintes de cellules, jamais les coordonnées en clair.' }
          ]
        }
      ]
    },
    /* ================= MODULE 3 ================= */
    {
      titre: 'Cartes et OpenStreetMap', niveau: 'Intermédiaire', description: 'Les cartes de l\'enquêteur, le modèle de données OSM, Overpass QL et la traduction d\'indices en requêtes.',
      lecons: [
        {
          titre: 'Les cartes de l\'enquêteur',
          theorie: `<p>Aucune carte ne suffit seule : chacune a ses forces, ses dates de mise à jour et ses zones blanches.</p>
<table><tr><th>Outil</th><th>Atout</th><th>Limite</th></tr>
<tr><td><strong>OpenStreetMap</strong></td><td>données libres, très détaillées (bancs, fontaines, arrêts), interrogeables avec Overpass</td><td>couverture inégale selon les contributeurs</td></tr>
<tr><td><strong>Google Maps / Street View</strong></td><td>couverture des vues de rue, photos des lieux</td><td>données non libres, vues parfois anciennes</td></tr>
<tr><td><strong>Google Earth Pro</strong></td><td>historique des images satellites, 3D, mesure</td><td>logiciel à installer</td></tr>
<tr><td><strong>Mapillary</strong></td><td>photos de rue participatives et libres, souvent récentes, y compris hors des grands axes</td><td>couverture variable</td></tr>
<tr><td><strong>Bing, Yandex, Apple Plans</strong></td><td>autres images satellites et vues de rue (utile pour comparer les dates)</td><td>couverture variable</td></tr>
<tr><td><strong>Géoportail (IGN)</strong></td><td>cartes et photos aériennes françaises, historiques depuis les années 1950, cadastre</td><td>France uniquement</td></tr>
<tr><td><strong>Sentinel (Copernicus)</strong></td><td>images satellites libres tous les quelques jours</td><td>résolution de 10 m</td></tr></table>
<h2>Les bons réflexes</h2>
<ul><li><strong>Dater</strong> chaque image (satellite ou vue de rue) : un bâtiment peut avoir été construit ou démoli depuis.</li><li><strong>Comparer</strong> plusieurs fournisseurs : l'un a peut-être une vue plus récente ou sous un meilleur angle.</li><li><strong>Mesurer</strong> : la règle des outils cartographiques permet de vérifier une distance ou une hauteur estimée.</li><li><strong>Créditer</strong> : OpenStreetMap exige la mention « © contributeurs OpenStreetMap » sur toute carte réutilisée.</li></ul>
<div class="callout info"><b>Dans l'arène</b>La carte des défis utilise Leaflet et les tuiles OpenStreetMap, avec un fond simplifié Natural Earth si elles ne se chargent pas.</div>`,
          exercice: {
            type: 'qcm', titre: 'Quel outil pour quel besoin ?',
            enonce: '<p>Tu veux savoir si un bâtiment visible sur une photo existait déjà en 2012. Quel outil est le plus adapté ?</p>',
            options: ['Le moteur de recherche Overpass', 'L\'historique des images de Google Earth Pro (ou les photos aériennes anciennes de Géoportail)', 'Sherlock', 'Un traducteur en ligne'],
            bonne: 1,
            explication: 'L\'historique satellite (Google Earth Pro) ou les photos aériennes datées (Géoportail en France) montrent l\'évolution d\'un lieu.'
          },
          quiz: [
            { q: 'Quelle mention est obligatoire quand on réutilise une carte OSM ?', options: ['« Carte gratuite »', '« © contributeurs OpenStreetMap »', 'Aucune'], bonne: 1, explication: 'La licence ODbL impose l\'attribution.' },
            { q: 'Quel est l\'atout de Mapillary ?', options: ['Des photos de rue participatives et libres', 'Les images satellites militaires', 'Les annuaires téléphoniques'], bonne: 0, explication: 'Des contributeurs partagent leurs photos de rue.' },
            { q: 'Pourquoi comparer plusieurs fournisseurs de cartes ?', options: ['Les images n\'ont pas la même date ni le même angle', 'Pour la décoration', 'Ils sont toujours identiques'], bonne: 0, explication: 'Une vue plus récente peut changer la conclusion.' }
          ]
        },
        {
          titre: 'Le modèle de données OpenStreetMap',
          theorie: `<p>OpenStreetMap est une base de données géographique libre, alimentée par des millions de contributeurs. Comprendre sa structure permet de l'interroger avec précision.</p>
<h2>Trois types d'objets</h2>
<ul><li><strong>Nœud</strong> (<em>node</em>) : un point (un banc, un arbre, un arrêt de bus, une fontaine).</li><li><strong>Chemin</strong> (<em>way</em>) : une suite de nœuds, ouverte (une rue, une rivière) ou fermée (un bâtiment, un parc).</li><li><strong>Relation</strong> (<em>relation</em>) : un groupe d'objets (une ligne de bus, une commune, un bâtiment avec cour intérieure).</li></ul>
<h2>Les tags : clé=valeur</h2>
<p>Chaque objet porte des <strong>tags</strong> libres, mais normalisés par la communauté sur le <strong>wiki OSM</strong> (wiki.openstreetmap.org) :</p>
${code('text', `amenity=cafe              un café
outdoor_seating=yes       avec terrasse
opening_hours=Mo-Sa 07:00-19:00
shop=bakery               une boulangerie
highway=bus_stop          un arrêt de bus (route_ref=1;3 : lignes desservies)
amenity=drinking_water    un point d'eau potable
wheelchair=yes|limited|no accessibilité en fauteuil roulant
man_made=lighthouse       un phare
building=church           un bâtiment d'église`)}
<h2>Pièges</h2>
<ul><li><strong>Absence ≠ non</strong> : un café sans tag <code>outdoor_seating</code> n'est pas forcément sans terrasse ; l'information manque.</li><li>Les jours d'ouverture sont en <strong>anglais abrégé</strong> : Mo Tu We Th Fr Sa Su.</li><li>Un même lieu peut être un nœud ou une surface : on interroge souvent les deux (<code>nwr</code> = node, way, relation).</li></ul>
<div class="callout info"><b>Dans l'arène</b>L'île fictive de Saint-Lumin-sur-Mer a ses propres données OSM : <a href="#/ctf/osm-tags">La fontaine accessible</a>.</div>`,
          exercice: {
            type: 'trous', langage: 'text', titre: 'Les bons tags',
            enonce: '<p>Complète les tags OpenStreetMap (en minuscules, comme sur le wiki).</p>',
            code: `Un café avec terrasse :           amenity=___ et outdoor_seating=___
Une boulangerie :                 ___=bakery
Un arrêt de bus :                 highway=___
Accessible en fauteuil roulant :  ___=yes
Un phare :                        man_made=___`,
            reponses: [['cafe'], ['yes'], ['shop'], ['bus_stop'], ['wheelchair'], ['lighthouse']],
            aides: ['Le tag des cafés est amenity=cafe.', 'Valeur booléenne classique d\'OSM.', 'Les commerces utilisent la clé shop.', 'Valeur avec un tiret bas.', 'Clé anglaise pour « fauteuil roulant ».', 'Le phare se dit lighthouse.']
          },
          quiz: [
            { q: 'Comment est représenté un bâtiment dans OSM ?', options: ['Un nœud', 'Un chemin fermé (ou une relation)', 'Un tag seul'], bonne: 1, explication: 'Le contour est un chemin fermé.' },
            { q: 'Un café sans tag wheelchair est…', options: ['inaccessible', 'accessible', 'non renseigné'], bonne: 2, explication: 'L\'absence d\'information n\'est pas un « non ».' },
            { q: 'Où trouver la signification officielle d\'un tag ?', options: ['Sur le wiki OpenStreetMap', 'Dans le code de Leaflet', 'Nulle part'], bonne: 0, explication: 'Le wiki documente chaque clé et ses valeurs.' }
          ]
        },
        {
          titre: 'Interroger la carte avec Overpass QL',
          theorie: `<p><strong>Overpass API</strong> permet d'interroger les données OSM avec le langage <strong>Overpass QL</strong>. <strong>overpass-turbo.eu</strong> offre un éditeur avec carte : idéal pour apprendre.</p>
<h2>Structure d'une requête</h2>
${code('text', `[out:json][timeout:25];          // format de sortie et délai maximal
node["amenity"="cafe"]            // type d'objet + filtres sur les tags
    ["outdoor_seating"="yes"]     // filtres cumulés (ET logique)
    (around:300,43.6044,1.4436);  // à moins de 300 m de ce point
out body;                          // afficher les résultats`)}
<h2>Les filtres</h2>
<table><tr><th>Filtre</th><th>Sens</th></tr>
<tr><td><code>["clé"="valeur"]</code></td><td>égalité exacte</td></tr>
<tr><td><code>["clé"~"regex"]</code> / <code>["clé"~"regex",i]</code></td><td>expression régulière (insensible à la casse avec <code>,i</code>)</td></tr>
<tr><td><code>["clé"]</code> / <code>[!"clé"]</code></td><td>le tag existe / n'existe pas</td></tr>
<tr><td><code>(around:R,lat,lon)</code></td><td>à moins de R mètres d'un point</td></tr>
<tr><td><code>(around.ensemble:R)</code></td><td>à moins de R mètres d'objets trouvés avant</td></tr>
<tr><td><code>(area.zone)</code></td><td>à l'intérieur d'une zone (commune, quartier)</td></tr></table>
<h2>Chercher dans une commune</h2>
${code('text', `[out:json][timeout:25];
area["name"="Toulouse"]["admin_level"="8"]->.ville;   // 8 = commune en France
nwr["tourism"="museum"](area.ville);
out center;                                            // un point par objet, même pour les surfaces`)}
<h2>Combiner : « une pharmacie à moins de 50 m d'une église »</h2>
${code('text', `[out:json][timeout:25];
area["name"="Toulouse"]["admin_level"="8"]->.ville;
nwr["amenity"="place_of_worship"]["religion"="christian"](area.ville)->.eglises;
node["amenity"="pharmacy"](around.eglises:50);
out body;`)}
<div class="callout warn"><b>Ménager le service</b>Overpass est gratuit et partagé : des zones raisonnables, un <code>timeout</code>, et pas de requêtes en boucle. L'éditeur de l'arène interroge <code>overpass-api.de</code> en ligne, ou le jeu de données local de l'île fictive.</div>`,
          exercice: {
            type: 'trous', langage: 'text', titre: 'Compléter des requêtes Overpass',
            enonce: '<p>Complète les deux requêtes : la première cherche les pharmacies à moins de 300 m de la place du Capitole (résultats en JSON), la seconde les musées de la commune de Toulouse.</p>',
            code: `[out:___][timeout:25];
node["amenity"="___"](___:300,43.6044,1.4436);
out body;

area["name"="Toulouse"]["admin_level"="___"]->.ville;
nwr["tourism"="museum"](area.___);
out center;`,
            reponses: [['json'], ['pharmacy'], ['around'], ['8'], ['ville']],
            aides: ['Format de sortie lisible par un programme.', 'Le tag des pharmacies est amenity=pharmacy.', 'Filtre de distance autour d\'un point.', 'Niveau administratif des communes françaises.', 'Le nom donné à l\'ensemble avec ->.']
          },
          quiz: [
            { q: 'Que fait le filtre (around:120,45.2,-3.49) ?', options: ['Il limite aux objets à moins de 120 m du point', 'Il trie par distance', 'Il dessine un cercle'], bonne: 0, explication: 'Rayon en mètres, puis latitude et longitude.' },
            { q: 'Comment chercher « Su » dans opening_hours ?', options: ['["opening_hours"="Su"]', '["opening_hours"~"Su"]', '["Su"]'], bonne: 1, explication: '~ teste une expression régulière ; = exige l\'égalité exacte.' },
            { q: 'À quoi sert « out center; » ?', options: ['À centrer la carte', 'À obtenir un point central même pour les chemins et relations', 'À compter les résultats'], bonne: 1, explication: 'Pratique pour placer un marqueur sur un bâtiment.' }
          ]
        },
        {
          titre: 'Des indices visuels à la requête',
          theorie: `<p>La vraie force d'Overpass en géolocalisation : transformer ce que l'on <strong>voit</strong> sur une image en <strong>conditions</strong> sur la carte, puis laisser la base de données trouver les rares endroits qui les remplissent toutes.</p>
<h2>La méthode</h2>
<ol><li><strong>Lister</strong> les éléments cartographiables : une pharmacie, une église, un arrêt de tram, une fontaine, un pont, une voie ferrée.</li><li><strong>Estimer les distances</strong> entre eux (en mètres) depuis l'image, avec une marge.</li><li><strong>Délimiter</strong> une zone de recherche (pays, région ou commune) grâce aux autres indices.</li><li><strong>Écrire la requête</strong> élément par élément, en partant du plus rare.</li><li><strong>Vérifier</strong> chaque candidat sur une vue de rue.</li></ol>
<h2>Exemple</h2>
<p>Une photo montre, à Toulouse, une <strong>boulangerie</strong> juste en face d'un <strong>arrêt de bus</strong>, et un <strong>point d'eau</strong> à quelques pas.</p>
${code('text', `[out:json][timeout:25];
area["name"="Toulouse"]["admin_level"="8"]->.ville;
node["highway"="bus_stop"](area.ville)->.arrets;
node["amenity"="drinking_water"](around.arrets:40)->.eau;
node["shop"="bakery"](around.arrets:30)(around.eau:60);
out body;`)}
<p>Chaque ligne réduit l'ensemble : quelques centaines d'arrêts, quelques dizaines avec un point d'eau proche, une poignée avec aussi une boulangerie.</p>
<h2>Les limites</h2>
<ul><li>Les données peuvent être <strong>incomplètes</strong> : un objet manquant fait disparaître le bon candidat. Élargir les distances ou retirer une condition.</li><li>Les objets peuvent être cartographiés comme surfaces : utiliser <code>nwr</code> et <code>out center</code>.</li><li>Des outils spécialisés existent (par exemple des interfaces qui génèrent ces requêtes de proximité), mais comprendre Overpass reste indispensable.</li></ul>`,
          exercice: {
            type: 'texte', titre: 'Écrire la requête d\'une photo',
            enonce: `<p>Une photo prise à Toulouse montre un <strong>café avec terrasse</strong> à moins de <strong>50 m</strong> d'une <strong>station de métro</strong> (<code>railway=station</code> avec <code>station=subway</code>, ou <code>railway=subway_entrance</code> pour les bouches). Écris la requête Overpass QL complète : en-tête, zone de la commune, ensemble des stations, cafés filtrés par distance et terrasse, sortie.</p>`,
            placeholder: '[out:json][timeout:25];\narea[...]->.ville;\n...\nout body;',
            criteres: [
              { label: 'En-tête [out:json]', re: /\[out:json\]/ },
              { label: 'Zone de la commune (area … admin_level 8)', re: /area\s*\[[^\]]*name[^\]]*\][^\n]*admin_level[^\n]*->\s*\.\w+/i },
              { label: 'Un ensemble de stations ou de bouches de métro', re: /(subway|railway)[^\n]*->\s*\.\w+/i },
              { label: 'Des cafés (amenity=cafe)', re: /\["amenity"\s*=\s*"cafe"\]/ },
              { label: 'Le filtre de terrasse', re: /\["outdoor_seating"\s*=\s*"yes"\]/ },
              { label: 'Un filtre (around.ensemble:50)', re: /\(around\.\w+\s*:\s*50\)/ },
              { label: 'Une instruction out', re: /out(\s+\w+)?\s*;/ }
            ],
            solution: '<pre><code>[out:json][timeout:25];\narea["name"="Toulouse"]["admin_level"="8"]-&gt;.ville;\nnwr["railway"~"^(station|subway_entrance)$"](area.ville)-&gt;.metro;\nnwr["amenity"="cafe"]["outdoor_seating"="yes"](around.metro:50);\nout center;</code></pre>'
          },
          quiz: [
            { q: 'Par quel élément commencer une requête de proximité ?', options: ['Le plus courant', 'Le plus rare', 'Peu importe'], bonne: 1, explication: 'Partir du plus rare réduit vite l\'ensemble et accélère la requête.' },
            { q: 'Une requête ne renvoie rien alors que le lieu existe. Cause probable ?', options: ['Overpass est en panne', 'Un objet manque ou est cartographié autrement dans OSM', 'La photo est fausse'], bonne: 1, explication: 'Élargir, retirer une condition, utiliser nwr.' },
            { q: 'Que fait (around.eglises:50) ?', options: ['Il garde les objets à moins de 50 m d\'un objet de l\'ensemble .eglises', 'Il crée 50 églises', 'Il cherche 50 résultats'], bonne: 0, explication: 'La proximité se calcule par rapport à un ensemble trouvé avant.' }
          ]
        }
      ]
    },
    /* ================= MODULE 4 ================= */
    {
      titre: 'Éthique, cadre légal et outils', niveau: 'Débutant', description: 'Le droit français et le RGPD, l\'éthique de l\'enquêteur, la boîte à outils de référence et le rapport final.',
      lecons: [
        {
          titre: 'Le cadre légal en France',
          theorie: `<p>L'OSINT n'est pas une zone de non-droit. En France, plusieurs textes encadrent ce que tu peux collecter, conserver et publier.</p>
<h2>Le RGPD et la loi Informatique et libertés</h2>
<ul><li>Une donnée <strong>personnelle</strong> (nom, photo, pseudo, adresse, plaque…) reste protégée même si elle est <strong>publique</strong>.</li><li>Collecter et compiler des données sur une personne est un <strong>traitement</strong> : il faut une <strong>base légale</strong> (consentement, contrat, obligation légale, mission d'intérêt public, intérêt légitime documenté), un objectif précis, une collecte minimale et une durée de conservation limitée.</li><li>La personne a des droits (accès, effacement, opposition). La CNIL contrôle et sanctionne.</li></ul>
<h2>Le Code pénal</h2>
<table><tr><th>Article</th><th>Ce qu'il interdit</th></tr>
<tr><td><strong>323-1 et suivants</strong></td><td>Accéder ou se maintenir frauduleusement dans un système informatique (jusqu'à 3 ans et 100 000 € d'amende, davantage si des données sont modifiées ou s'il s'agit d'un système de l'État). Se connecter avec des identifiants trouvés dans une fuite en fait partie.</td></tr>
<tr><td><strong>226-1</strong> et suivants</td><td>Atteintes à la vie privée : capter ou diffuser sans consentement l'image ou les paroles d'une personne dans un lieu privé.</td></tr>
<tr><td><strong>226-18</strong></td><td>Collecter des données personnelles par un moyen frauduleux, déloyal ou illicite.</td></tr>
<tr><td><strong>223-1-1</strong></td><td>Révéler des informations sur la vie privée, familiale ou professionnelle d'une personne permettant de la localiser, pour l'exposer à un risque (le « doxing »).</td></tr>
<tr><td><strong>222-33-2-2</strong></td><td>Harcèlement moral, y compris en ligne et en meute.</td></tr>
<tr><td><strong>226-4-1</strong></td><td>Usurpation d'identité.</td></tr></table>
<h2>Les cadres autorisés</h2>
<p>Journalisme (avec ses règles déontologiques), mission d'audit avec contrat et périmètre écrits, enquête interne encadrée, recherche académique, compétitions et plateformes d'entraînement, et bien sûr les cas <strong>fictifs</strong> comme ceux de l'arène.</p>
<div class="callout warn"><b>Ceci n'est pas un avis juridique</b>Les textes évoluent : consulte legifrance.gouv.fr et cnil.fr, et en cas de doute, un juriste.</div>`,
          exercice: {
            type: 'qcm', titre: 'Légal ou pas ?', multiple: true,
            enonce: '<p>Dans lesquelles de ces situations la personne <strong>enfreint la loi</strong> ? (plusieurs réponses)</p>',
            options: ['Elle se connecte au compte d\'un collègue avec un mot de passe trouvé dans une fuite, « juste pour vérifier »', 'Elle géolocalise une photo de paysage publiée par un photographe pour un défi entre amis', 'Elle publie l\'adresse personnelle d\'un streamer avec qui elle est en conflit, en appelant à « aller le voir »', 'Elle audite l\'exposition en ligne de son entreprise avec un contrat et un périmètre écrits', 'Elle compile dans un tableur les sorties d\'une ex-compagne à partir de ses publications, pour la suivre'],
            bonne: [0, 2, 4],
            explication: 'Accès frauduleux (323-1), mise en danger par diffusion d\'informations personnelles (223-1-1) et traitement illicite de données à des fins de surveillance (RGPD, harcèlement). Les deux autres situations sont légitimes.'
          },
          quiz: [
            { q: 'Une donnée personnelle publique peut-elle être compilée librement ?', options: ['Oui', 'Non, il faut une base légale et respecter le RGPD', 'Oui si on ne la publie pas'], bonne: 1, explication: 'La compilation est un traitement de données.' },
            { q: 'Quel article réprime l\'accès frauduleux à un système ?', options: ['Article 323-1 du Code pénal', 'Article 1240 du Code civil', 'Article 9 du RGPD'], bonne: 0, explication: 'Articles 323-1 et suivants.' },
            { q: 'Qui contrôle l\'application du RGPD en France ?', options: ['L\'ANSSI', 'La CNIL', 'L\'Arcep'], bonne: 1, explication: 'L\'ANSSI s\'occupe de la sécurité des systèmes, la CNIL des données personnelles.' }
          ]
        },
        {
          titre: 'Éthique et sécurité de l\'enquêteur',
          theorie: `<p>Le droit fixe les limites ; l'éthique guide les choix à l'intérieur. Une enquête légale peut rester nuisible : une erreur d'attribution, une publication inutile, une personne exposée.</p>
<h2>Les principes</h2>
<ol><li><strong>Proportionnalité</strong> : l'intrusion doit rester à la mesure de l'enjeu.</li><li><strong>Minimisation</strong> : ne collecter que ce qui répond à la question ; pas de « tant qu'on y est ».</li><li><strong>Ne pas nuire</strong> aux tiers : flouter visages et plaques, ne pas publier d'adresse, protéger les proches et les mineurs.</li><li><strong>Exactitude</strong> : recouper, dire son niveau de confiance, corriger publiquement une erreur.</li><li><strong>Transparence</strong> sur la méthode (dans le rapport), discrétion sur les personnes.</li></ol>
<h2>La sécurité opérationnelle (OPSEC)</h2>
<ul><li><strong>Ne pas interagir</strong> avec la cible (pas d'abonnement, pas de « j'aime », pas de message) : cela alerte et modifie ce que l'on observe.</li><li>Certains sites signalent les visites (profils professionnels) : utiliser un navigateur dédié, sans être connecté à ses comptes personnels.</li><li>Les « faux profils » d'enquête (comptes d'observation) violent souvent les conditions d'utilisation et peuvent être déloyaux : à proscrire hors d'un cadre professionnel qui les autorise.</li><li>Séparer : profil de navigateur ou machine virtuelle dédiés, notes chiffrées.</li></ul>
<h2>Et pour soi</h2>
<p>Les enquêtes sur des contenus violents usent. Les vérificateurs professionnels limitent l'exposition (miniatures floutées, son coupé), font des pauses et en parlent. Et appliquer l'OSINT à <strong>soi-même</strong> est un excellent exercice : que trouverait un inconnu sur toi ?</p>`,
          exercice: {
            type: 'texte', titre: 'Le dilemme',
            enonce: `<p>En résolvant un défi de géolocalisation proposé par un ami (photo de vacances), tu découvres grâce à un reflet l'<strong>adresse personnelle</strong> d'une famille visible en arrière-plan. Explique ce que tu fais et ne fais pas, en t'appuyant sur au moins <strong>trois principes</strong> de la leçon (proportionnalité, minimisation, ne pas nuire, exactitude, transparence).</p>`,
            placeholder: 'Je fais : …\nJe ne fais pas : …\nPrincipes : …',
            criteres: [
              { label: 'Tu ne publies pas ou ne partages pas l\'adresse', re: /(ne (la |le )?(publie|partage|diffuse|communique)|pas (de |d')?(publi|partag|diffus))/i },
              { label: 'Tu préviens ou informes la personne concernée (l\'ami, l\'auteur de la photo)', re: /(pr[ée]vien|inform|signal|averti)/i },
              { label: 'Au moins trois principes cités', verif: t => ['proportionnalit', 'minimisation', 'nuire', 'exactitude', 'transparence'].filter(p => t.toLowerCase().includes(p)).length >= 3 },
              { label: 'Tu supprimes ou ne conserves pas l\'information', re: /(supprim|efface|ne (la )?(garde|conserve)|pas (la )?(garder|conserver))/i },
              motsMin(50)
            ],
            solution: '<p>Je fais : je réponds au défi sans mentionner l\'adresse (je ne la publie pas et je ne la partage avec personne), je préviens mon ami que la photo révèle l\'adresse d\'une famille et lui conseille de la retirer ou de la flouter, puis je supprime mes notes à ce sujet. Je ne fais pas : publier, partager ou rechercher davantage cette famille. Principes : minimisation (l\'adresse ne sert pas la question), ne pas nuire (des tiers non consentants), proportionnalité (un jeu ne justifie aucune intrusion) et transparence envers mon ami sur ce que j\'ai vu.</p>'
          },
          quiz: [
            { q: 'Pourquoi ne pas « aimer » une publication de la cible ?', options: ['C\'est impoli', 'Cela l\'alerte et laisse une trace', 'Cela coûte de l\'argent'], bonne: 1, explication: 'Ne jamais interagir : c\'est la base de l\'OPSEC.' },
            { q: 'Que faire des visages de passants dans un rapport public ?', options: ['Les laisser', 'Les flouter s\'ils ne sont pas nécessaires', 'Les identifier'], bonne: 1, explication: 'Ne pas nuire aux tiers.' },
            { q: 'Que signifie la minimisation ?', options: ['Réduire la taille des images', 'Ne collecter que le nécessaire pour la question posée', 'Enquêter vite'], bonne: 1, explication: 'Principe du RGPD et de l\'éthique d\'enquête.' }
          ]
        },
        {
          titre: 'La boîte à outils de référence',
          theorie: `<p>Les outils changent vite ; la méthode reste. Voici les classiques, à connaître et à essayer sur des cas autorisés.</p>
<table><tr><th>Besoin</th><th>Outils</th></tr>
<tr><td>S'orienter</td><td><strong>OSINT Framework</strong> (osintframework.com) : arbre d'outils classés par type de recherche</td></tr>
<tr><td>Pseudos</td><td><strong>Sherlock</strong> (ligne de commande, libre) : teste un pseudo sur des centaines de sites ; WhatsMyName</td></tr>
<tr><td>Métadonnées</td><td><strong>exiftool</strong> (Phil Harvey) : <code>exiftool photo.jpg</code> affiche EXIF, GPS, appareil, logiciel, miniature</td></tr>
<tr><td>Images</td><td>Google Lens, Yandex Images, Bing Visual Search, <strong>TinEye</strong> (tri par date) ; Forensically ou FotoForensics pour les retouches</td></tr>
<tr><td>Vidéos</td><td>InVID-WeVerify : découpe en images clés, recherche inversée, métadonnées</td></tr>
<tr><td>Soleil</td><td><strong>SunCalc</strong> : direction et hauteur du soleil, heure par heure</td></tr>
<tr><td>Cartes</td><td><strong>Google Earth Pro</strong> (historique), <strong>Mapillary</strong>, OpenStreetMap et <strong>overpass-turbo</strong>, Géoportail</td></tr>
<tr><td>Archives</td><td><strong>Wayback Machine</strong> d'Internet Archive, archive.today</td></tr>
<tr><td>Domaines</td><td>WHOIS/RDAP, historique DNS, journaux de certificats (crt.sh)</td></tr></table>
${code('bash', `# Sherlock : tester un pseudo et ses variantes
sherlock ines_vldr ines.vldr

# exiftool : tout lire, puis seulement le GPS
exiftool photo.jpg
exiftool -gps:all -c "%.6f" photo.jpg

# supprimer les métadonnées de SES photos avant publication
exiftool -all= mes_vacances.jpg`)}
<h2>Les bons usages</h2>
<ul><li>Un outil ne conclut pas à ta place : il produit des <strong>pistes</strong> à vérifier.</li><li>Les outils en ligne voient ce que tu leur envoies : n'y dépose pas de documents confidentiels.</li><li>L'établi de l'arène (inspecteur EXIF, hex, labo image, spectrogramme, boîte à outils) fonctionne entièrement <strong>dans ton navigateur</strong>.</li></ul>`,
          exercice: {
            type: 'trous', langage: 'text', titre: 'Le bon outil',
            enonce: '<p>Complète avec le nom de l\'outil (un seul mot).</p>',
            code: `Retrouver un pseudo sur des centaines de sites :            ___
Lire les métadonnées d'une photo en ligne de commande :      ___
Calculer la position du soleil pour un lieu et une heure :   ___
Anciennes versions d'une page : la Wayback Machine d'Internet ___
Annuaire d'outils classés par type de recherche : OSINT ___
Photos de rue participatives et libres :                     ___`,
            reponses: [['sherlock', 'Sherlock'], ['exiftool', 'ExifTool', 'Exiftool'], ['SunCalc', 'suncalc', 'Suncalc'], ['Archive', 'archive'], ['Framework', 'framework'], ['Mapillary', 'mapillary']],
            aides: ['Comme le détective.', 'Le « couteau suisse » des métadonnées, de Phil Harvey.', 'Sun + Calc.', 'La fondation à but non lucratif qui archive le Web.', 'osintframework.com', 'Alternative libre à Street View.']
          },
          quiz: [
            { q: 'Quelle commande supprime toutes les métadonnées d\'une photo avec exiftool ?', options: ['exiftool -all= photo.jpg', 'exiftool --clean photo.jpg', 'rm photo.jpg'], bonne: 0, explication: 'À faire sur ses propres photos avant de les publier.' },
            { q: 'Quel moteur permet de trier les correspondances par date ?', options: ['TinEye', 'SunCalc', 'Sherlock'], bonne: 0, explication: 'Pratique pour trouver la première publication.' },
            { q: 'Un outil d\'OSINT a trouvé un compte : que faire ?', options: ['Conclure', 'Vérifier et recouper avant toute conclusion', 'Le signaler à tout le monde'], bonne: 1, explication: 'Les outils produisent des pistes, pas des preuves.' }
          ]
        },
        {
          titre: 'Projet : le rapport d\'enquête',
          theorie: `<p>L'enquête n'est terminée que lorsqu'elle est <strong>restituée</strong> : un rapport clair permet à quelqu'un d'autre de comprendre, vérifier et décider.</p>
<h2>La structure</h2>
<ol><li><strong>Question et cadre</strong> : qui demande, pourquoi, avec quelle autorisation.</li><li><strong>Synthèse</strong> : la réponse en trois lignes, avec le <strong>niveau de confiance</strong> (élevé, moyen, faible).</li><li><strong>Méthode</strong> : sources et outils utilisés, dans l'ordre.</li><li><strong>Constatations</strong> : chaque fait avec sa source (URL, date de consultation, capture, empreinte).</li><li><strong>Analyse</strong> : les déductions, les hypothèses écartées et pourquoi.</li><li><strong>Limites</strong> : ce qui n'a pas pu être vérifié, ce qui pourrait changer la conclusion.</li><li><strong>Recommandations</strong> (pour un audit) : quoi corriger, par ordre de priorité.</li></ol>
<h2>Le vocabulaire de la confiance</h2>
<table><tr><th>Formulation</th><th>Quand l'utiliser</th></tr>
<tr><td>« Nous avons établi que… »</td><td>plusieurs sources indépendantes concordantes</td></tr>
<tr><td>« Il est probable que… »</td><td>indices concordants mais une seule source forte</td></tr>
<tr><td>« Il est possible que… »</td><td>hypothèse plausible, non vérifiée</td></tr>
<tr><td>« Nous n'avons pas pu déterminer… »</td><td>pas assez d'éléments : c'est une conclusion honorable</td></tr></table>
<h2>Pour l'audit d'une personne (avec son accord)</h2>
<p>Le rapport s'adresse à elle : ce qu'un inconnu peut apprendre, comment, et comment s'en protéger (paramètres de confidentialité, pseudos distincts, suppression de métadonnées, demandes de retrait aux archives et aux moteurs, changement des réponses aux « questions secrètes »).</p>
<div class="callout info"><b>Mise en pratique</b>Termine les cinq défis OSINT de l'arène (enquête sur Inès Valadier, personnage fictif) puis rédige le rapport ci-dessous.</div>`,
          exercice: {
            type: 'texte', titre: 'Rédiger le rapport d\'audit d\'Inès',
            enonce: `<p>À partir des défis <a href="#/ctf">OSINT de l'arène</a> (pseudo, reflet, archive, fuite, vue depuis le bureau), rédige un <strong>rapport d'audit</strong> destiné à Inès Valadier (personnage fictif, qui a donné son accord). Rubriques : <code>Cadre</code>, <code>Synthèse</code> (avec un niveau de confiance), <code>Constatations</code> (au moins trois, numérotées, chacune avec sa source), <code>Limites</code>, <code>Recommandations</code> (au moins trois).</p>`,
            placeholder: 'Cadre : …\nSynthèse : …\nConstatations : 1. … 2. … 3. …\nLimites : …\nRecommandations : 1. … 2. … 3. …',
            criteres: [
              { label: 'Le cadre mentionne l\'accord d\'Inès', re: /cadre\s*:[^\n]*(accord|consent|demande|mandat)/i },
              { label: 'Une synthèse avec un niveau de confiance', re: /synth[eè]se\s*:[\s\S]*(confiance|probable|[ée]tabli|possible|[ée]lev[ée])/i },
              { label: 'Au moins trois constatations numérotées', verif: t => { const c = (t.split(/constatations?\s*:/i)[1] || '').split(/limites?\s*:/i)[0]; return (c.match(/\d[.)]/g) || []).length >= 3; } },
              { label: 'Des sources citées (adresses .example)', re: /\.example/i },
              { label: 'Une section Limites', re: /limites?\s*:[^\n]{8,}/i },
              { label: 'Au moins trois recommandations numérotées', verif: t => ((t.split(/recommandations?\s*:/i)[1] || '').match(/\d[.)]/g) || []).length >= 3 },
              motsMin(120)
            ],
            solution: '<p>Cadre : audit d\'exposition en ligne demandé par Inès Valadier, avec son accord écrit, sur sources ouvertes simulées uniquement. Synthèse : un inconnu peut établir avec un niveau de confiance élevé le nom de son chat, le café qu\'elle fréquente, le quartier de son bureau, un ancien projet confidentiel et une note de travail publique. Constatations : 1. Pseudo réutilisé (ines.vldr / ines_vldr) reliant Pixelgram et Chirp, où le nom du chat « Pistache » est publié (chirp.example/ines_vldr). 2. Le reflet de ses lunettes révèle le Café Zéphyr (pixelgram.example/p/lunettes). 3. L\'ancienne page À propos archivée mentionne l\'« Opération Cassoulet » (archive-du-web.example, capture de 2021). 4. Une note publique contient le nom du projet client et l\'existence d\'un mot de passe provisoire (collepad.example/n8Qe2). 5. La vue depuis son bureau montre le clocher de Saint-Sernin à Toulouse (chirp.example). Limites : sites simulés ; pas de vérification sur le terrain ; d\'autres comptes peuvent exister sous des pseudos non testés. Recommandations : 1. Supprimer la note publique et changer le mot de passe mentionné. 2. Utiliser des pseudos différents et ne jamais répondre honnêtement aux questions secrètes. 3. Demander le retrait des captures archivées. 4. Vérifier reflets et vues avant de publier, et publier en différé.</p>'
          },
          quiz: [
            { q: 'Que met-on dans la synthèse ?', options: ['Tout le détail des recherches', 'La réponse courte avec son niveau de confiance', 'La liste des outils'], bonne: 1, explication: 'Le lecteur pressé doit tout comprendre en trois lignes.' },
            { q: '« Nous n\'avons pas pu déterminer… » est-il un échec ?', options: ['Oui', 'Non : c\'est une conclusion honnête et utile', 'Seulement en audit'], bonne: 1, explication: 'Mieux vaut une limite assumée qu\'une fausse certitude.' },
            { q: 'Pourquoi citer la date de consultation de chaque source ?', options: ['Pour décorer', 'Parce qu\'une page peut changer ou disparaître', 'C\'est obligatoire sur Internet'], bonne: 1, explication: 'Avec la capture et l\'empreinte, elle rend la constatation vérifiable.' }
          ]
        }
      ]
    }
  ]
};
