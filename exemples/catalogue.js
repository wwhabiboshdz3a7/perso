// Catalogue des exemples : sert à la galerie, au bac à sable et à l'accueil.
export const categories = ['Bases', 'Timeline', 'Stagger', 'Easings et ressorts', 'Texte', 'Défilement', 'SVG', 'Interaction'];

export const examples = [
  { id: 'premiers-pas', title: 'Premiers pas', cat: 'Bases', api: ['animate'], desc: 'Translation, rotation, échelle et couleur sur une seule forme, en boucle aller-retour.' },
  { id: 'proprietes-css', title: 'Propriétés CSS', cat: 'Bases', api: ['animate', 'stagger'], desc: 'Largeur, rayon, ombre portée, clip-path et filtre : les chaînes complexes sont interpolées nombre par nombre.' },
  { id: 'couleurs-oklab', title: 'Couleurs en OKLab', cat: 'Bases', api: ['animate'], desc: 'Interpolation perceptuelle comparée au mélange sRGB naïf : plus de gris boueux au milieu.' },
  { id: 'keyframes-balle', title: 'Keyframes : la balle', cat: 'Bases', api: ['animate', 'keyframes'], desc: 'Rebond, écrasement et étirement en keyframes exprimées en pourcentages.' },
  { id: 'valeurs-relatives', title: 'Valeurs relatives', cat: 'Bases', api: ['animate'], desc: 'Des boutons qui ajoutent, retirent ou multiplient : « +=80 », « -=80 », « *=1.5 ».' },
  { id: 'objets-canvas', title: 'Objets JS et canvas', cat: 'Bases', api: ['animate', 'stagger', 'engine.onFrame'], desc: 'Kinetika anime de simples objets JavaScript, dessinés à chaque image dans un canvas.' },
  { id: 'controles-lecture', title: 'Contrôles de lecture', cat: 'Bases', api: ['play', 'pause', 'reverse', 'seek', 'speed'], desc: 'Lecture, pause, sens inverse, vitesse et tête de lecture pilotée par un curseur.' },
  { id: 'variables-css', title: 'Variables CSS', cat: 'Bases', api: ['animate'], desc: 'Un dégradé conique piloté par trois variables CSS animées indépendamment.' },

  { id: 'timeline-logo', title: 'Révélation de logo', cat: 'Timeline', api: ['timeline', 'label', 'splitText'], desc: 'Une séquence complète avec libellés, chevauchements « -= » et départs simultanés « << ».' },
  { id: 'timeline-imbriquee', title: 'Timelines imbriquées', cat: 'Timeline', api: ['timeline', 'add'], desc: 'Des sous-timelines réutilisables, assemblées dans une timeline principale qui boucle.' },
  { id: 'timeline-scrubber', title: 'Timeline au curseur', cat: 'Timeline', api: ['timeline', 'seek', 'call'], desc: 'La tête de lecture suit un curseur ; les rappels call() se déclenchent dans les deux sens.' },

  { id: 'grille-stagger', title: 'Grille en stagger', cat: 'Stagger', api: ['stagger', 'grid'], showreel: true, desc: 'Une onde part du point touché et se propage dans la grille, distance euclidienne et easing.' },
  { id: 'vague-barres', title: 'Vague de barres', cat: 'Stagger', api: ['stagger', 'loop'], desc: 'Un égaliseur : chaque barre boucle avec son propre décalage de phase.' },
  { id: 'mosaique-aleatoire', title: 'Mosaïque aléatoire', cat: 'Stagger', api: ['stagger', 'random'], desc: 'Ordre aléatoire à graine : même graine, même chorégraphie, à chaque chargement.' },

  { id: 'ressorts-lettres', title: 'Lettres-ressorts', cat: 'Easings et ressorts', api: ['spring', 'splitText'], showreel: true, desc: 'Les lettres fuient le pointeur et reviennent sur des ressorts amortis.' },
  { id: 'course-easings', title: 'Course d’easings', cat: 'Easings et ressorts', api: ['eases', 'stagger'], desc: 'Huit billes, huit courbes, la même durée : la meilleure façon de sentir un easing.' },
  { id: 'bouton-magnetique', title: 'Bouton magnétique', cat: 'Easings et ressorts', api: ['spring'], desc: 'Le bouton se laisse attirer par le pointeur, puis revient en ressort.' },
  { id: 'ressort-glisser', title: 'Glisser, relâcher', cat: 'Easings et ressorts', api: ['spring', 'velocity'], desc: 'Un jeton à lancer : la vitesse du geste devient la vitesse initiale du ressort.' },

  { id: 'split-elastique', title: 'Split élastique', cat: 'Texte', api: ['splitText', 'stagger', 'timeline'], showreel: true, desc: 'Les lettres tombent en 3D depuis le centre, avec un élastique et la largeur variable de la police.' },
  { id: 'decodage', title: 'Décodage', cat: 'Texte', api: ['scramble', 'timeline', 'call'], showreel: true, desc: 'Journal de terminal, glyphes aléatoires et barre de progression : le sens se calcule.' },
  { id: 'cylindre-3d', title: 'Cylindre 3D', cat: 'Texte', api: ['animate', 'onUpdate'], showreel: true, desc: 'Des anneaux de lettres en 3D CSS qui tournent en sens contraires, éclairés selon leur angle.' },
  { id: 'odometre', title: 'Odomètre', cat: 'Texte', api: ['odometer'], showreel: true, desc: 'Des compteurs à rouleaux géants, chiffre par chiffre, avec séparateurs conservés.' },
  { id: 'machine-a-ecrire', title: 'Machine à écrire', cat: 'Texte', api: ['typewriter'], desc: 'Plusieurs phrases tapées puis effacées, curseur clignotant, nom accessible stable.' },
  { id: 'lignes-masquees', title: 'Lignes masquées', cat: 'Texte', api: ['splitText', 'mask'], desc: 'Un paragraphe éditorial dont les lignes glissent hors de leur masque, puis les mots s’éclairent.' },
  { id: 'police-variable', title: 'Police variable', cat: 'Texte', api: ['animate', 'variables CSS'], showreel: true, desc: 'Graisse et chasse en vagues sur chaque lettre, comme la scène « Il bouge » du showreel.' },

  { id: 'marquees-vitesse', title: 'Marquees à la vitesse du défilement', cat: 'Défilement', api: ['onScroll', 'velocity', 'engine.onFrame'], showreel: true, scroll: true, desc: 'Des bandes croisées qui accélèrent et se penchent selon la vitesse de défilement.' },
  { id: 'scrub-defilement', title: 'Scrub au défilement', cat: 'Défilement', api: ['onScroll', 'scrub', 'timeline'], showreel: true, scroll: true, desc: 'Une timeline entière pilotée par la barre de défilement, avec lissage.' },
  { id: 'revelation-cartes', title: 'Révélation au défilement', cat: 'Défilement', api: ['onScroll', 'sync'], scroll: true, desc: 'Des cartes qui entrent à l’écran et ressortent à rebours quand on remonte.' },

  { id: 'trace-svg', title: 'Tracé SVG', cat: 'SVG', api: ['drawable'], showreel: true, desc: 'Un mot écrit au trait : chaque contour se dessine, puis s’efface par le début.' },
  { id: 'chemin-svg', title: 'Motion path', cat: 'SVG', api: ['motionPath', 'drawable'], showreel: true, desc: 'Un avion en papier suit une courbe en s’orientant, sa traînée se dessine derrière lui.' },
  { id: 'morphing-svg', title: 'Morphing de formes', cat: 'SVG', api: ['animate', 'd'], desc: 'L’attribut d d’un chemin interpolé point par point entre trois formes.' },

  { id: 'curseur-elastique', title: 'Curseur élastique', cat: 'Interaction', api: ['animate', 'composition'], desc: 'Un curseur et sa traîne de points qui se rattrapent avec des durées différentes.' },
  { id: 'cartes-3d', title: 'Cartes inclinables', cat: 'Interaction', api: ['animate', 'composition'], desc: 'Inclinaison 3D au survol, reflet qui suit le pointeur, retour en ressort.' },
  { id: 'menu-anime', title: 'Menu animé', cat: 'Interaction', api: ['timeline', 'reverse'], desc: 'Un menu plein écran : une timeline jouée à l’ouverture, à rebours à la fermeture.' },
];

export const byId = Object.fromEntries(examples.map((e) => [e.id, e]));
