// Référence de l'API de Kinetika : la page /api/ est générée à partir de ces données.
// Syntaxe des textes : `code`, **gras**. Paramètres : [nom, type, défaut, description].

export const sections = [
  {
    id: 'animate',
    title: 'animate()',
    intro: 'Anime une ou plusieurs cibles. Renvoie une `Animation`, lancée tout de suite (sauf `autoplay: false`) et attendable avec `await`.',
    items: [
      {
        id: 'animate-fn',
        name: 'animate(cibles, paramètres)',
        ret: 'Animation',
        desc: 'Chaque propriété non réservée des paramètres est animée sur chaque cible, avec ses propres durée, délai et easing si besoin.',
        params: [
          ['cibles', 'string | Element | NodeList | Array | object', '—', 'Sélecteur CSS, élément, liste d’éléments, tableau mêlant tout cela, ou simple objet JavaScript.'],
          ['paramètres', 'object', '—', 'Propriétés à animer et réglages de lecture (voir plus bas).'],
        ],
        code: `import { animate, stagger } from 'kinetika';

animate('.carte', {
  x: 240,                    // translateX en px
  rotate: '1turn',           // les unités sont converties
  backgroundColor: '#ff5b2b',
  delay: stagger(80),
  duration: 900,
  ease: 'outElastic(1, .5)',
});`,
      },
      {
        id: 'animate-props',
        name: 'Propriétés animables',
        desc: 'Kinetika choisit la bonne façon d’écrire chaque propriété selon la cible :',
        list: [
          '**Transformations individuelles** : `x`, `y`, `z`, `rotate`, `rotateX`, `rotateY`, `rotateZ`, `scale`, `scaleX`, `scaleY`, `scaleZ`, `skew`, `skewX`, `skewY`, `perspective`. Elles se composent dans un seul `transform`, dans un ordre fixe, et reprennent la transformation en ligne existante.',
          '**CSS** : toute propriété de `style` (`width`, `opacity`, `borderRadius`, `clipPath`, `filter`, `boxShadow`, `fontStretch`…). Les chaînes complexes sont interpolées nombre par nombre.',
          '**Couleurs** : hex, `rgb()`, `hsl()` et les 148 noms CSS (`rebeccapurple`, `darkorange`…), interpolées en OKLab (perceptuel, sans gris boueux au milieu).',
          '**Variables CSS** : `\'--teinte\': 220`.',
          '**Attributs SVG** : `d`, `points`, `cx`, `r`, `viewBox`, `stdDeviation`… ou n’importe quel attribut via `attr: { … }`.',
          '**Objets JavaScript** : toute propriété numérique (ou chaîne contenant des nombres) d’un objet.',
        ],
      },
      {
        id: 'animate-values',
        name: 'Valeurs',
        desc: 'Chaque propriété accepte plusieurs formes :',
        table: [
          ['Valeur', 'Exemple', 'Effet'],
          ['Nombre ou chaîne', '`x: 200`, `width: \'50%\'`', 'De la valeur actuelle vers celle-ci. Sans unité, celle de la propriété est utilisée (px, deg…).'],
          ['[départ, arrivée]', '`opacity: [0, 1]`', 'Départ explicite, appliqué dès la création (pas d’éclair, même avec un délai).'],
          ['Relative', '`\'+=100\'`, `\'-=1turn\'`, `\'*=2\'`, `\'/=2\'`', 'Calculée à partir de la valeur de départ, dans son unité : `rotate` à 90deg puis `\'-=1turn\'` donne −270deg, `x` à 10px puis `\'+=2rem\'` donne 42px. `*=` et `/=` prennent un facteur sans unité.'],
          ['Fonction', '`(el, i, total) => i * 20`', 'Évaluée pour chaque cible.'],
          ['Keyframes', '`y: [0, -80, 0]`', 'Plus de deux valeurs : étapes réparties sur la durée.'],
          ['Étapes détaillées', '`scale: [{ to: 1.4, duration: 200 }, { to: 1, ease: \'outBack\' }]`', 'Chaque étape a sa durée, son délai et son easing.'],
          ['Paramètres par propriété', '`rotate: { to: 360, duration: 2000, ease: \'linear\' }`', 'Remplace les réglages globaux pour cette propriété ; accepte aussi `from` et `modifier`.'],
        ],
      },
      {
        id: 'animate-keyframes',
        name: 'keyframes',
        ret: 'Array | object',
        desc: 'Keyframes au niveau de l’animation : un tableau d’états (chacun peut avoir `duration` et `ease`) ou un objet de pourcentages.',
        code: `animate('.balle', {
  keyframes: {
    '0%': { y: 0, scaleY: 1 },
    '45%': { y: -160, scaleY: 1.1, ease: 'outQuad' },
    '90%': { y: 0, scaleY: .7 },
    '100%': { y: 0, scaleY: 1 },
  },
  duration: 1200,
  loop: true,
});`,
      },
      {
        id: 'animate-params',
        name: 'Paramètres de lecture',
        params: [
          ['duration', 'number | fonction', '1000', 'Durée en millisecondes. Avec un ressort, la durée calculée par la physique est utilisée si aucune n’est donnée.'],
          ['delay', 'number | fonction', '0', 'Délai avant le départ (souvent `stagger(…)`). Il ne se rejoue pas à chaque boucle.'],
          ['ease', 'string | fonction', '\'outQuad\'', 'Nom, chaîne paramétrée, `cubicBezier()`, `steps()`, `spring()` ou fonction `(t) => valeur`. Une fonction `(el, i, total)` choisit une courbe par cible.'],
          ['loop', 'number | boolean', '0', 'Nombre de répétitions supplémentaires ; `true` pour une boucle infinie.'],
          ['loopDelay', 'number', '0', 'Pause entre deux itérations.'],
          ['alternate', 'boolean', 'false', 'Aller-retour : une itération sur deux est jouée à l’envers.'],
          ['reversed', 'boolean', 'false', 'Démarre dans le sens inverse (de la fin vers le début).'],
          ['autoplay', 'boolean | onScroll()', 'true', '`false` pour lancer plus tard avec `.play()` ; `onScroll(…)` pour lier la lecture au défilement.'],
          ['speed', 'number', '1', 'Vitesse de lecture propre à l’animation.'],
          ['composition', '\'replace\' | \'none\'', '\'replace\'', 'Avec `replace`, une nouvelle animation reprend la main sur une propriété déjà animée par une autre.'],
          ['modifier', '(n) => n', '—', 'Transforme chaque valeur numérique avant écriture (arrondi, aimantation…).'],
          ['attr', 'object', '—', 'Attributs à animer explicitement, quel que soit le type d’élément.'],
          ['reducedMotion', 'boolean', 'true', '`false` : cette animation ignore la préférence « mouvement réduit ».'],
          ['id', 'string', 'auto', 'Identifiant libre, pratique pour le débogage.'],
        ],
      },
      {
        id: 'animate-callbacks',
        name: 'Rappels',
        desc: 'Chaque rappel reçoit l’animation (ou la timeline) en argument.',
        params: [
          ['onBegin', 'fonction', '—', 'Au premier rendu actif (après le délai).'],
          ['onUpdate', 'fonction', '—', 'À chaque rendu.'],
          ['onLoop', 'fonction', '—', 'À chaque changement d’itération.'],
          ['onComplete', 'fonction', '—', 'À la fin, dans un sens comme dans l’autre.'],
          ['onPause', 'fonction', '—', 'À chaque mise en pause.'],
        ],
      },
      {
        id: 'set-fn',
        name: 'set(cibles, valeurs)',
        ret: 'Animation',
        desc: 'Applique des valeurs immédiatement, sans animation (même en mouvement réduit). Aussi disponible sous `utils.set`.',
        code: `set('.carte', { x: 0, opacity: 0, '--teinte': 40 });`,
      },
    ],
  },
  {
    id: 'lecture',
    title: 'Lecture',
    intro: 'Les animations et les timelines partagent les mêmes contrôles et propriétés.',
    items: [
      {
        id: 'lecture-methodes',
        name: 'Méthodes',
        params: [
          ['play()', '→ this', '', 'Lance ou reprend la lecture (redémarre si l’animation était terminée).'],
          ['pause()', '→ this', '', 'Met en pause.'],
          ['resume()', '→ this', '', 'Synonyme de `play()`.'],
          ['restart()', '→ this', '', 'Repart du début.'],
          ['reverse()', '→ this', '', 'Inverse le sens et relance, depuis la position actuelle.'],
          ['seek(temps)', '→ this', '', 'Place la tête de lecture (ms, délai compris). Une timeline accepte aussi un nom de libellé ; un libellé inconnu est ignoré (avertissement en console).'],
          ['complete()', '→ this', '', 'Saute à l’état final et termine.'],
          ['cancel()', '→ this', '', 'Arrête sans rien restaurer.'],
          ['revert()', '→ this', '', 'Arrête et restaure les valeurs d’origine des cibles (styles en ligne, attributs, propriétés).'],
          ['then(fn)', '→ Promise', '', 'Promesse résolue à la fin : `await animate(…)` fonctionne. Elle se résout aussi quand l’animation est entièrement reprise par une autre (composition « replace », voir `interrupted`), et elle est rejetée si un rappel lève une exception.'],
          ['catch(fn) · finally(fn)', '→ Promise', '', 'Raccourcis de la promesse.'],
        ],
      },
      {
        id: 'lecture-props',
        name: 'Propriétés',
        params: [
          ['duration', 'number', 'lecture', 'Durée totale, délai et boucles compris (`Infinity` en boucle infinie).'],
          ['iterationDuration', 'number', 'lecture', 'Durée d’une itération.'],
          ['currentTime', 'number', 'lecture / écriture', 'Temps courant en ms.'],
          ['progress', 'number', 'lecture / écriture', 'Progression totale entre 0 et 1 (celle de l’itération en cours si la boucle est infinie).'],
          ['speed', 'number', 'lecture / écriture', 'Vitesse de lecture.'],
          ['paused, began, completed, reversed', 'boolean', 'lecture', 'État de la lecture.'],
          ['interrupted', 'boolean', 'lecture', 'Vrai si toutes les propriétés ont été reprises par une animation plus récente : l’animation s’arrête et sa promesse se résout, sans `onComplete`.'],
          ['iteration', 'number', 'lecture', 'Numéro de l’itération en cours (à partir de 0).'],
          ['targets', 'Array', 'lecture', 'Cibles résolues (animations seulement).'],
        ],
        code: `const a = animate('.barre', { scaleX: [0, 1], autoplay: false });
range.oninput = () => { a.progress = range.value / 100; };
await a.play();
console.log('terminé', a.completed);`,
      },
    ],
  },
  {
    id: 'timeline',
    title: 'timeline()',
    intro: 'Enchaîne et superpose des animations, des timelines et des rappels, au millième près.',
    items: [
      {
        id: 'timeline-fn',
        name: 'timeline(paramètres)',
        ret: 'Timeline',
        desc: 'Accepte les mêmes paramètres de lecture et rappels qu’`animate()`, plus `defaults` : les réglages hérités par chaque animation ajoutée. La lecture démarre au micro-tick suivant, une fois les enfants ajoutés.',
        params: [
          ['defaults', 'object', '{}', 'Paramètres par défaut des enfants (`duration`, `ease`…).'],
          ['delay, loop, loopDelay, alternate, reversed, autoplay, speed', '', '', 'Comme pour `animate()`.'],
        ],
        code: `const tl = timeline({ defaults: { duration: 700, ease: 'outExpo' }, loop: true })
  .add('.titre', { y: ['110%', '0%'] })
  .add('.sous-titre', { opacity: [0, 1] }, '-=400')
  .label('barre')
  .add('.barre', { scaleX: [0, 1] }, 'barre')
  .call(() => console.log('fin de la barre'), '<');`,
      },
      {
        id: 'timeline-add',
        name: '.add(cibles, paramètres, position) · .add(animation | timeline, position) · .add(fonction, position)',
        ret: 'Timeline',
        desc: 'Ajoute une animation créée sur place, une animation ou une timeline existante (imbrication), ou un rappel.',
      },
      {
        id: 'timeline-positions',
        name: 'Positions',
        table: [
          ['Position', 'Signification'],
          ['(rien)', 'À la fin de la timeline.'],
          ['`500`', 'À 500 ms du début.'],
          ['`\'+=200\'` / `\'-=100\'`', 'Après la fin de la timeline / en chevauchant ses 100 dernières ms.'],
          ['`\'<\'`', 'À la fin de l’élément ajouté juste avant.'],
          ['`\'<<\'`', 'Au début de l’élément ajouté juste avant (départ simultané).'],
          ['`\'<<+=150\'`, `\'<-=50\'`', 'Les mêmes repères, avec un décalage.'],
          ['`\'intro\'`, `\'intro+=300\'`', 'Sur un libellé posé avec `.label()`. Un nom peut contenir des tirets (`\'intro-fin\'`) ; un libellé inconnu place l’élément en fin de timeline, avec un avertissement en console.'],
          ['`(tl) => nombre`', 'Calculée par une fonction.'],
        ],
      },
      {
        id: 'timeline-set',
        name: '.set(cibles, valeurs, position)',
        ret: 'Timeline',
        desc: 'Valeurs instantanées à une position (rejouées correctement en avant comme en arrière).',
      },
      {
        id: 'timeline-call',
        name: '.call(fonction, position)',
        ret: 'Timeline',
        desc: 'Appelle la fonction quand la tête de lecture passe la position, dans les deux sens, y compris pendant un `seek()`.',
      },
      {
        id: 'timeline-label',
        name: '.label(nom, position)',
        ret: 'Timeline',
        desc: 'Pose un repère nommé, réutilisable comme position et avec `seek(\'nom\')`.',
      },
      {
        id: 'timeline-props',
        name: 'labels · children',
        desc: '`labels` renvoie `{ nom: temps }` ; `children` la liste `{ animation, start, end }` dans l’ordre chronologique. Sur une même cible et une même propriété, chaque animation part de la valeur laissée par la précédente.',
      },
    ],
  },
  {
    id: 'stagger',
    title: 'stagger()',
    intro: 'Répartit une valeur (délai, décalage, rotation, couleur de départ…) sur une liste de cibles.',
    items: [
      {
        id: 'stagger-fn',
        name: 'stagger(valeur, options)',
        ret: '(el, i, total) => valeur',
        desc: 'La fonction renvoyée s’utilise partout où une valeur fonction est acceptée. Elle peut aussi être appelée à la main.',
        params: [
          ['valeur', 'number | string | [min, max]', '—', 'Pas entre deux cibles (`100`, `\'12px\'`), ou plage répartie de la première à la dernière cible (`[0, 360]`).'],
          ['from', '\'first\' | \'last\' | \'center\' | \'random\' | index', '\'first\'', 'Point de départ de la propagation.'],
          ['grid', '[colonnes, lignes]', '—', 'Distance euclidienne dans une grille.'],
          ['axis', '\'x\' | \'y\'', '—', 'Avec `grid` : distance signée sur un seul axe (pour des décalages directionnels). Les valeurs peuvent être négatives : pour un délai, ajoutez `start` (par exemple `start: 275` si la plus petite vaut −275) afin que toutes les cibles partent de leur état initial.'],
          ['ease', 'string | fonction', '—', 'Courbe appliquée à la répartition.'],
          ['start', 'number | string', '0', 'Valeur ajoutée à toutes les cibles.'],
          ['reversed', 'boolean', 'false', 'Inverse l’ordre.'],
          ['seed', 'number', '1', 'Avec `from: \'random\'` : même graine, même ordre.'],
        ],
        code: `animate('.case', {
  scale: [0, 1],
  delay: stagger(40, { grid: [12, 8], from: 'center', ease: 'inQuad' }),
});

animate('.point', { x: stagger(-3, { grid: [12, 8], from: 37, axis: 'x' }) });`,
      },
    ],
  },
  {
    id: 'easings',
    title: 'Easings',
    intro: 'Toutes les courbes prennent `t` entre 0 et 1. Le visualiseur d’easings permet de les comparer et de copier le code.',
    items: [
      {
        id: 'easings-noms',
        name: 'Noms',
        desc: '`linear`, puis les variantes `in`, `out`, `inOut` et `outIn` de chaque famille :',
        list: [
          '`Quad`, `Cubic`, `Quart`, `Quint`, `Sine`, `Expo`, `Circ`, `Bounce` : par exemple `\'outCubic\'`, `\'inOutSine\'`.',
          '`Back(dépassement = 1.70158)` : `\'outBack(2.5)\'`.',
          '`Elastic(amplitude = 1, période = .3)` : `\'outElastic(1, .4)\'`.',
          'Puissance libre : `\'out(3)\'` équivaut à `\'outCubic\'`.',
          'Alias acceptés : mots-clés CSS (`\'ease-in-out\'`, `\'cubic-bezier(.2, .8, .2, 1)\'`), noms d’anime.js (`\'easeOutQuad\'`) et de GSAP (`\'power2.out\'`, `\'back.inOut(2)\'`).',
        ],
      },
      {
        id: 'easings-eases',
        name: 'eases',
        ret: 'object',
        desc: 'Les mêmes courbes sous forme de fonctions : `eases.outQuad(0.5)`, et `eases.outElastic.with(1, .4)` pour les paramétrer. `easeNames` en donne la liste.',
      },
      {
        id: 'easings-bezier',
        name: 'cubicBezier(x1, y1, x2, y2)',
        ret: '(t) => number',
        desc: 'Courbe de Bézier cubique, comme `cubic-bezier()` en CSS.',
      },
      {
        id: 'easings-steps',
        name: 'steps(nombre, saut)',
        ret: '(t) => number',
        desc: 'Escalier de `nombre` marches ; `saut` vaut `\'end\'` (par défaut) ou `\'start\'`. En chaîne : `\'steps(4)\'`.',
      },
      {
        id: 'easings-spring',
        name: 'spring({ mass, stiffness, damping, velocity })',
        ret: '(t) => number',
        desc: 'Ressort physique amorti. La durée nécessaire pour se stabiliser est calculée et exposée dans `.duration` : elle devient la durée de l’animation si aucune n’est donnée. En chaîne : `\'spring(1, 120, 12)\'`.',
        params: [
          ['mass', 'number', '1', 'Masse : plus elle est grande, plus le mouvement est lent et ample.'],
          ['stiffness', 'number', '100', 'Raideur du ressort.'],
          ['damping', 'number', '10', 'Amortissement : faible, ça oscille ; fort, ça se pose sans rebond.'],
          ['velocity', 'number', '0', 'Vitesse initiale (positive vers la cible), pour enchaîner sur un geste.'],
        ],
        code: `const souple = spring({ stiffness: 140, damping: 8 });
console.log(souple.duration); // durée calculée, en ms
animate('.jeton', { x: 0, y: 0, ease: souple });`,
      },
      {
        id: 'easings-parse',
        name: 'parseEase(valeur)',
        ret: '(t) => number | null',
        desc: 'Transforme un nom, une chaîne paramétrée ou une fonction en fonction d’easing (avec cache).',
      },
    ],
  },
  {
    id: 'texte',
    title: 'Texte',
    intro: 'Découpage accessible et effets typographiques. Le texte reste lisible par les lecteurs d’écran : les morceaux sont `aria-hidden`, et le parent reçoit un `aria-label` s’il peut en porter un (titre, lien, bouton, section…). Sur un élément générique (`p`, `div`, `span`), où ARIA interdit `aria-label`, Kinetika ajoute à la place une copie du texte masquée visuellement (`.kt-sr`).',
    items: [
      {
        id: 'texte-split',
        name: 'splitText(cible, options)',
        ret: '{ el, chars, words, lines, masks, revert(), refresh() }',
        desc: 'Découpe le texte en lettres (graphèmes : accents composés et émojis restent entiers), mots et lignes. Les éléments imbriqués (`<em>`, `<a>`…) sont conservés ; un élément qui passe à la ligne est réparti sur les deux lignes. Les liens et boutons restent focalisables, nommés par un `aria-label`, et ne sont jamais masqués aux lecteurs d’écran. Redécouper un élément annule d’abord le découpage précédent.',
        params: [
          ['chars', 'boolean | string', 'true*', 'Découper en lettres ; une chaîne sert de nom de classe. *Par défaut seulement si ni `words` ni `lines` ne sont précisés.'],
          ['words', 'boolean | string', 'true', 'Découper en mots (classe `kt-word`).'],
          ['lines', 'boolean | string', 'false', 'Regrouper les mots en lignes selon la mise en page (classe `kt-line`).'],
          ['mask', 'boolean | \'lines\' | \'words\' | \'chars\'', 'false', 'Enveloppe chaque morceau dans un masque `overflow: clip`, pour les entrées « sous le trait ».'],
          ['maskClass', 'string', '\'kt-mask\'', 'Classe des masques.'],
        ],
        code: `const split = splitText('h1', { lines: true, mask: 'lines' });
animate(split.lines, { y: ['100%', '0%'], delay: stagger(90) });

addEventListener('resize', () => split.refresh()); // relit les lignes
split.revert(); // rétablit le HTML d’origine`,
      },
      {
        id: 'texte-scramble',
        name: 'scramble(cible, options)',
        ret: 'Animation',
        desc: 'Décodage : le texte apparaît à travers des glyphes aléatoires. Utilisable seul ou dans une timeline (`autoplay: false`).',
        params: [
          ['text', 'string', 'texte actuel', 'Texte final.'],
          ['chars', 'string', 'glyphes', 'Caractères tirés au hasard.'],
          ['duration', 'number', '1600', 'Durée totale.'],
          ['reveal', '\'start\' | \'random\'', '\'start\'', 'Ordre de révélation des lettres.'],
          ['fps', 'number', '24', 'Fréquence de renouvellement des glyphes.'],
          ['seed', 'number', '7', 'Graine de l’aléatoire.'],
          ['delay, ease, loop, autoplay, onBegin, onUpdate, onComplete', '', '', 'Comme pour `animate()`.'],
        ],
        code: `const s = scramble('.titre', { text: 'ACCÈS AUTORISÉ' });
s.revert(); // arrête et rétablit le contenu d’origine`,
      },
      {
        id: 'texte-typewriter',
        name: 'typewriter(cible, options)',
        ret: 'Timeline',
        desc: 'Machine à écrire avec curseur. Avec une liste, chaque phrase est tapée, tenue puis effacée, en boucle. Le nom accessible reste stable.',
        params: [
          ['text', 'string | string[]', 'texte actuel', 'Phrase ou liste de phrases.'],
          ['speed', 'number', '22', 'Caractères par seconde (l’effacement va 2,4 fois plus vite).'],
          ['hold', 'number', '1400', 'Temps de lecture avant l’effacement.'],
          ['gap', 'number', '300', 'Pause avant la phrase suivante.'],
          ['cursor', 'boolean', 'true', 'Afficher le curseur clignotant (`.kt-caret`).'],
          ['cursorChar', 'string', '\'▍\'', 'Caractère du curseur.'],
          ['loop, delay, autoplay, onComplete', '', '', 'Comme pour `timeline()`.'],
        ],
        code: `const tw = typewriter('.slogan', { text: ['Animer.', 'Raconter.'] });
tw.revert(); // arrête le curseur et rétablit le contenu d’origine`,
      },
      {
        id: 'texte-odometer',
        name: 'odometer(cible, options)',
        ret: '{ value, animation, set(valeur, options), revert() }',
        desc: 'Compteur à rouleaux : chaque chiffre défile dans sa fenêtre, les séparateurs (espaces, virgules) sont conservés.',
        params: [
          ['value', 'number | string', '—', 'Valeur à atteindre dès le départ.'],
          ['from', 'number | string', 'zéros', 'Valeur affichée au départ.'],
          ['duration', 'number', '1800', 'Durée du défilement.'],
          ['ease', 'string', '\'inOutExpo\'', 'Courbe de chaque rouleau.'],
          ['stagger', 'number', '80', 'Décalage entre deux chiffres (des unités vers la gauche).'],
          ['turns', 'number', '1', 'Tours complets supplémentaires (0 : chaque rouleau va directement au chiffre).'],
        ],
        code: `const prix = odometer('.prix', { value: '1 290' });
bouton.onclick = () => prix.set('4 500');`,
      },
    ],
  },
  {
    id: 'defilement',
    title: 'Défilement',
    intro: 'Déclenchement à l’entrée dans l’écran (IntersectionObserver) ou progression liée au défilement, lissée image par image.',
    items: [
      {
        id: 'scroll-fn',
        name: 'onScroll(options)',
        ret: 'ScrollObserver',
        desc: 'À utiliser comme `autoplay` d’une animation ou d’une timeline, ou seul avec des rappels.',
        params: [
          ['target', 'sélecteur | Element', 'cible de l’animation', 'Élément observé. Sans cible : toute la page.'],
          ['container', 'sélecteur | Element', 'window', 'Conteneur qui défile.'],
          ['axis', '\'y\' | \'x\'', '\'y\'', 'Axe de défilement.'],
          ['enter', 'string', '\'top bottom\'', 'Début : « bord de la cible, bord du conteneur ». Mots `top`, `center`, `bottom` (ou `left`, `right`), pourcentages, pixels et décalages `+=` / `-=`.'],
          ['leave', 'string', '\'bottom top\'', 'Fin, même syntaxe.'],
          ['scrub', 'boolean | number', '—', '`true` : la progression suit le défilement ; un nombre : lissage en secondes.'],
          ['sync', 'string', '\'play none none none\'', 'Actions sur entrée, sortie, retour, sortie par le haut : `play`, `pause`, `resume`, `reverse`, `restart`, `reset`, `complete`, `none`.'],
          ['onEnter, onLeave, onEnterBack, onLeaveBack, onUpdate', 'fonction', '—', 'Rappels, avec l’observateur en argument.'],
        ],
        code: `timeline({
  autoplay: onScroll({ target: '.section', enter: 'top top', leave: 'bottom bottom', scrub: .8 }),
}).add('.titre', { x: ['-50%', '0%'] }).add('.photo', { scale: [1.3, 1] }, '<<');

animate('.carte', {
  y: [80, 0], opacity: [0, 1],
  autoplay: onScroll({ enter: 'top 85%', sync: 'play none none reverse' }),
});`,
      },
      {
        id: 'scroll-observer',
        name: 'ScrollObserver',
        params: [
          ['progress', 'number', 'lecture', 'Progression lissée entre 0 et 1.'],
          ['rawProgress', 'number', 'lecture', 'Progression brute.'],
          ['velocity', 'number', 'lecture', 'Vitesse de défilement lissée, en px/s (retombe à 0 à l’arrêt).'],
          ['direction', '1 | -1', 'lecture', 'Sens du dernier défilement.'],
          ['isActive', 'boolean', 'lecture', 'Entre `enter` et `leave` ?'],
          ['refresh()', '→ this', '', 'Recalcule les positions après un changement de mise en page (fait automatiquement au redimensionnement).'],
          ['revert()', '→ this', '', 'Retire les écouteurs ; l’animation liée garde son état.'],
        ],
      },
    ],
  },
  {
    id: 'svg',
    title: 'SVG',
    intro: 'Tracé progressif des contours et déplacement le long d’un chemin.',
    items: [
      {
        id: 'svg-drawable',
        name: 'drawable(cibles)',
        ret: 'Drawable[]',
        desc: 'Prépare des formes SVG (`path`, `circle`, `line`, `polyline`…). Chaque objet expose `draw` (fin de la portion tracée, de 0 à 1, ou « début fin » en chaîne), `drawStart` (début) et `revert()`.',
        code: `const traits = drawable('svg path');
timeline()
  .add(traits, { draw: [0, 1], delay: stagger(80) })
  .add(traits, { drawStart: [0, 1] }, '+=1000'); // efface par le début`,
      },
      {
        id: 'svg-motionpath',
        name: 'motionPath(chemin, options)',
        ret: '{ x, y, rotate }',
        desc: 'Valeurs calculées le long d’un chemin, à étaler dans les paramètres. Une cible SVG reçoit les coordonnées du chemin ; un élément HTML est centré sur le chemin à l’écran.',
        params: [
          ['rotate', 'boolean', 'true', 'Orienter la cible selon la tangente.'],
          ['rotateOffset', 'number', '0', 'Angle ajouté (en degrés).'],
          ['start, end', 'number', '0, 1', 'Portion du chemin parcourue.'],
        ],
        code: `animate('.avion', { ...motionPath('#route'), duration: 4000, ease: 'inOutSine' });`,
      },
    ],
  },
  {
    id: 'moteur',
    title: 'Moteur',
    intro: 'Une seule boucle `requestAnimationFrame` pour toute la page, mise en veille quand rien ne bouge ou que l’onglet est masqué.',
    items: [
      {
        id: 'engine-obj',
        name: 'engine',
        params: [
          ['timeScale', 'number', '1', 'Échelle de temps globale (0,5 = tout au ralenti).'],
          ['reducedMotion', '\'auto\' | boolean', '\'auto\'', '`auto` suit `prefers-reduced-motion` : les animations sautent alors à leur état final. `true` force, `false` ignore.'],
          ['prefersReducedMotion', 'boolean', 'lecture', 'Le mouvement réduit est-il en vigueur ?'],
          ['pauseOnHidden', 'boolean', 'true', 'Suspend la boucle quand l’onglet est masqué.'],
          ['lagSmoothing', '{ threshold, adjusted } | null', '{ 250, 33 }', 'Au-delà de `threshold` ms entre deux images, on n’avance que de `adjusted` ms (pas de saut après un blocage).'],
          ['manual', 'boolean', 'false', 'Mode manuel : plus de `requestAnimationFrame`, on avance avec `tick()` (tests, rendu image par image).'],
          ['tick(ms)', '→ void', '16.7', 'Avance toutes les animations de `ms` millisecondes.'],
          ['onFrame(fn)', '→ () => void', '', 'Appelle `fn(delta, temps)` à chaque image, dans la même boucle. Renvoie la fonction d’arrêt.'],
          ['defaults', 'object', '', 'Paramètres par défaut de toutes les animations (`duration`, `ease`…).'],
          ['pause(), resume()', '→ void', '', 'Suspend ou relance toute la boucle.'],
          ['time, activeCount', 'number', 'lecture', 'Temps écoulé du moteur et nombre d’éléments actifs.'],
        ],
        code: `import { engine } from 'kinetika';

engine.defaults = { duration: 600, ease: 'outExpo' };
engine.timeScale = 0.25; // déboguer au ralenti

// tests : temps maîtrisé
engine.manual = true;
animate(objet, { v: 100, duration: 1000, ease: 'linear' });
engine.tick(500); // objet.v === 50`,
      },
    ],
  },
  {
    id: 'utils',
    title: 'Utilitaires',
    intro: 'Petits outils mathématiques et de manipulation, regroupés dans `utils` (et exportés un à un).',
    items: [
      {
        id: 'utils-math',
        name: 'Calcul',
        params: [
          ['clamp(v, min = 0, max = 1)', '→ number', '', 'Borne une valeur.'],
          ['lerp(a, b, t)', '→ number', '', 'Interpolation linéaire.'],
          ['mapRange(v, inMin, inMax, outMin, outMax)', '→ number', '', 'Projette d’un intervalle vers un autre.'],
          ['round(v, décimales = 0)', '→ number', '', 'Arrondi.'],
          ['snap(v, pas | liste)', '→ number', '', 'Aimante sur un pas régulier ou la valeur la plus proche d’une liste.'],
          ['wrap(v, min, max)', '→ number', '', 'Fait boucler dans [min, max[.'],
        ],
      },
      {
        id: 'utils-random',
        name: 'Aléatoire',
        params: [
          ['random(min?, max?, décimales?)', '→ number', '', 'Aléatoire global : `random()` ∈ [0, 1[, `random(10)`, `random(-5, 5, 1)`.'],
          ['seed(n)', '→ générateur', '', 'Fixe la graine de l’aléatoire global (compositions reproductibles).'],
          ['createRandom(graine)', '→ générateur', '', 'Générateur indépendant, avec `.int(min, max)`, `.pick(liste)` et `.shuffle(liste)`.'],
          ['shuffle(liste, générateur?)', '→ Array', '', 'Copie mélangée.'],
        ],
      },
      {
        id: 'utils-dom',
        name: 'Cibles et valeurs',
        params: [
          ['get(cible, propriété, unité?)', '→ valeur', '', 'Valeur actuelle (transformation, style calculé, attribut, propriété).'],
          ['set(cibles, valeurs)', '→ Animation', '', 'Application immédiate.'],
          ['remove(cibles, propriétés?)', '→ Array', '', 'Arrête les animations en cours sur ces cibles (ou seulement ces propriétés).'],
          ['$(cibles)', '→ Array', '', 'Résout des cibles en tableau, comme le fait `animate()`.'],
        ],
        code: `import { utils } from 'kinetika';

const tirage = utils.createRandom(42);
const x = tirage(-100, 100);           // toujours la même suite
utils.remove('.carte', 'x');           // stoppe seulement x
utils.get('.carte', 'width', 'rem');   // '12rem'`,
      },
    ],
  },
];
