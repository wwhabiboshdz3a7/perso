// Défis « recherche d'image inversée & vérification ». Les résultats des moteurs sont simulés
// (sites en .example, personnes fictives) et masqués dans le fichier publié.
import { cache } from './_aides.mjs';

const IMG = 'assets/ctf/scenes/';
const METHODE = '<p class="muted">Dans la vraie vie : Google Lens, Yandex Images, Bing Visual Search et TinEye, en essayant aussi une version recadrée sur le détail intéressant.</p>';

export default [
  {
    id: 'inv-premiere', categorie: 'inverse', titre: 'L\'orage « de ce matin »', difficulte: 1, points: 150,
    accroche: 'Une photo spectaculaire partagée 12 000 fois. Mais qui l\'a vraiment prise, et quand ?',
    briefing: `<p class="dossier">Dossier VE-01 · Cellule de vérification</p>
<p>Ce matin, cette image circule avec la légende « TOULOUSE CE MATIN !!! ». Ta rédaction te demande de vérifier avant de la reprendre. Méthode : <b>recherche inversée</b> sur plusieurs moteurs, puis <b>tri par date</b> pour trouver la <b>première publication</b> et son auteur.</p>
<p>Question : <b>qui est l'auteur·rice de la photo originale ?</b></p>${METHODE}`,
    ressources: [
      { type: 'image', titre: 'Image virale', src: IMG + 'inv-orage-viral.jpg', alt: 'Nuit d\'orage : un éclair au-dessus de la mer, un phare rouge et blanc, des palmiers, une promenade mouillée éclairée par des lampadaires et une silhouette sous un parapluie rouge. Un bandeau rouge ajouté en haut : « TOULOUSE CE MATIN !!! INCROYABLE, PARTAGEZ ».', outils: ['image', 'exif'] },
      { type: 'lens', titre: 'Recherche inversée (résultats simulés)', image: { src: IMG + 'inv-orage-viral.jpg', alt: 'Image virale de l\'orage' }, moteurs: cache({
        google: [
          { titre: '« TOULOUSE CE MATIN !!! » — publication partagée 12 400 fois', site: 'chirp.example/meteo_choc_31', date: '2026-10-14', miniature: IMG + 'inv-orage-viral.jpg', taille: '1200×750', extrait: 'INCROYABLE, PARTAGEZ ⚡⚡⚡' },
          { titre: 'Orages : les images impressionnantes qui circulent ce matin', site: 'actu-buzz.example', date: '2026-10-14', miniature: IMG + 'inv-orage-viral.jpg', taille: '800×500' },
          { titre: 'Fond d\'écran orage phare nuit HD gratuit', site: 'fonds-ecran.example', date: '2022-05-02', miniature: IMG + 'inv-orage.jpg', taille: '1920×1200', extrait: 'Téléchargement gratuit, source inconnue.' }
        ],
        yandex: [
          { titre: 'Nuits d\'été 2019 — orage sur la promenade des Embruns', site: 'photoclub-saint-lumin.example', date: '2019-08-12', miniature: IMG + 'inv-orage.jpg', taille: '4000×2500', extrait: 'Prise le 11 août 2019 depuis la jetée, pose de 8 s.', detail: { image: IMG + 'inv-orage.jpg', alt: 'Version originale, sans bandeau', texte: '<p>Album « Nuits d\'été 2019 » du photo-club de Saint-Lumin-sur-Mer (commune fictive).</p><p>Photographe : <b>Maëlle Kerbrat</b>. Boîtier sur trépied, pose de 8 secondes à 23 h 40. Tous droits réservés.</p>' } },
          { titre: 'Storm, lighthouse and promenade at night', site: 'banque-images.example', date: '2021-03-09', miniature: IMG + 'inv-orage-filigrane.jpg', taille: '1600×1000', extrait: 'Licence payante. Crédit : M. Kerbrat.', detail: { image: IMG + 'inv-orage-filigrane.jpg', alt: 'Aperçu avec filigrane', texte: '<p>Aperçu filigrané. Crédit : <b>M. Kerbrat</b> / photo-club de Saint-Lumin.</p>' } }
        ],
        bing: [
          { titre: 'Non, cette photo d\'orage n\'a pas été prise à Toulouse', site: 'verif-info.example', date: '2026-10-14', miniature: IMG + 'inv-orage-viral.jpg', taille: '1200×750', extrait: 'Un phare, la mer… à Toulouse ?', detail: { texte: '<p>Plusieurs lecteurs nous ont signalé cette image. Toulouse n\'est pas au bord de la mer et ne possède pas de phare : l\'image circule en réalité depuis plusieurs années. Notre enquête est en cours pour retrouver son auteur.</p>' } },
          { titre: 'Fond d\'écran orage phare nuit HD gratuit', site: 'fonds-ecran.example', date: '2022-05-02', miniature: IMG + 'inv-orage.jpg', taille: '1920×1200' }
        ],
        tineye: [
          { titre: 'chirp.example/meteo_choc_31', site: 'chirp.example', date: '2026-10-14', miniature: IMG + 'inv-orage-viral.jpg', taille: '1200×750' },
          { titre: 'fonds-ecran.example/orage-phare-hd', site: 'fonds-ecran.example', date: '2022-05-02', miniature: IMG + 'inv-orage.jpg', taille: '1920×1200' },
          { titre: 'banque-images.example/photo/48213', site: 'banque-images.example', date: '2021-03-09', miniature: IMG + 'inv-orage-filigrane.jpg', taille: '1600×1000' },
          { titre: 'photoclub-saint-lumin.example/albums/nuits-ete-2019', site: 'photoclub-saint-lumin.example', date: '2019-08-12', miniature: IMG + 'inv-orage.jpg', taille: '4000×2500', detail: { image: IMG + 'inv-orage.jpg', alt: 'Version originale', texte: '<p>Plus grande résolution trouvée (4000×2500) et plus ancienne date. Légende : « Orage sur la promenade des Embruns — photo : <b>Maëlle Kerbrat</b> ».</p>' } }
        ]
      }), description: 'Lance la recherche, compare les moteurs, puis <b>trie du plus ancien</b> (comme sur TinEye). Clique sur un résultat pour l\'ouvrir.' }
    ],
    outils: ['image', 'exif'],
    indices: [{ cout: 20, texte: 'Avant même de chercher : un phare et la mer… à Toulouse ? Ensuite, dans l\'onglet TinEye, trie les résultats « du plus ancien ».' }, { cout: 30, texte: 'La plus ancienne publication (2019) est aussi la plus grande (4000×2500) : c\'est l\'album d\'un photo-club. Ouvre-la pour lire le nom.' }],
    validation: 'flag', format: 'Format : LUMIO{prenom_nom}',
    flags: ['LUMIO{maelle_kerbrat}', 'LUMIO{kerbrat}', 'LUMIO{m_kerbrat}', 'LUMIO{kerbrat_maelle}'],
    writeup: `<h3>1. Le bon sens d'abord</h3><p>Toulouse n'a ni mer ni phare : la légende est fausse avant même toute recherche. Le bandeau ajouté et la forte compression (image floue, petite) sont typiques d'une image repartagée de compte en compte.</p>
<h3>2. Plusieurs moteurs</h3><p>Google remonte surtout les partages récents. <b>Yandex</b> trouve une version de 2019 sur le site d'un photo-club ; la banque d'images cite « M. Kerbrat ». Chaque moteur a ses forces : il faut toujours en essayer plusieurs.</p>
<h3>3. Trier par date, comparer les tailles</h3><p>Sur <b>TinEye</b>, le tri « du plus ancien » donne la publication du <b>12 août 2019</b>, qui est aussi la <b>plus grande</b> (4000×2500) et la seule sans bandeau ni filigrane : c'est l'original. Légende : photo de <b>Maëlle Kerbrat</b>.</p>
<h3>4. Conclure</h3><p>Photo authentique, mais <b>sortie de son contexte</b> : prise en 2019 à Saint-Lumin-sur-Mer (commune fictive), pas à Toulouse aujourd'hui. Si on veut la publier : demander l'autorisation à l'autrice et la créditer.</p>
<p>Flag : <code>LUMIO{maelle_kerbrat}</code></p>`,
    retenir: 'Première publication = plus ancienne date + plus grande résolution + aucune surcouche. On compare plusieurs moteurs et on trie par date.'
  },
  {
    id: 'inv-miroir', categorie: 'inverse', titre: 'Une rue de Londres ?', difficulte: 2, points: 200,
    accroche: 'Les voitures roulent à gauche… et pourtant. Une image retournée trompe les yeux et les moteurs.',
    briefing: `<p class="dossier">Dossier VE-02 · Cellule de vérification</p>
<p>Un compte présente cette photo comme « une rue tranquille de Londres ». En effet, les voitures semblent rouler à gauche. Les moteurs de recherche inversée ne trouvent <b>aucune correspondance exacte</b>… Bizarre pour une photo de banque d'images.</p>
<p>Question : <b>dans quelle ville la photo a-t-elle vraiment été prise ?</b></p>${METHODE}`,
    ressources: [
      { type: 'image', titre: 'Image publiée', src: IMG + 'inv-rue-miroir.jpg', alt: 'Rue avec, à droite, un bâtiment administratif de pierre aux volets bleus et un drapeau tricolore, et une enseigne bleue au texte écrit à l\'envers ; à gauche, une boulangerie dont l\'enseigne est aussi écrite à l\'envers. Une voiture bleue s\'éloigne sur la voie de gauche, une autre arrive sur la voie de droite ; leurs plaques sont illisibles car inversées. Un panneau rond « 30 » aux chiffres inversés.', outils: ['image'], legende: 'Agrandis l\'image et essaie le bouton « Miroir ».' },
      { type: 'lens', titre: 'Recherche inversée (résultats simulés)', image: { src: IMG + 'inv-rue-miroir.jpg', alt: 'Image publiée' }, moteurs: cache({
        google: [{ titre: 'A quiet street in London', site: 'chirp.example/voyages_london', date: '2026-09-30', miniature: IMG + 'inv-rue-miroir.jpg', taille: '1080×675' }, { titre: 'Images similaires : rue, mairie, boulangerie', site: 'résultats visuellement similaires', miniature: IMG + 'inv-rue-miroir.jpg', extrait: 'Aucune correspondance exacte.' }],
        yandex: [{ titre: 'Похожие изображения (images similaires)', site: 'yandex', miniature: IMG + 'inv-rue-miroir.jpg', extrait: 'Aucune correspondance exacte trouvée.' }],
        bing: [{ titre: 'Rue commerçante et place de la mairie', site: 'banque-images-municipales.example', date: '2023-04-18', miniature: IMG + 'inv-rue-miroir.jpg', miroir: true, taille: '1600×1000', extrait: 'Correspondance trouvée en recadrant… et en retournant l\'image.', detail: { image: IMG + 'inv-rue.jpg', alt: 'Version non retournée : la mairie est à gauche', texte: '<p>Photo d\'illustration d\'une banque d\'images municipale. Légende : « Place de la mairie un jour de marché ». Licence libre, crédit : service communication.</p>' } }],
        tineye: [{ titre: '0 résultat', site: 'TinEye ne trouve que des copies exactes ou très proches', miniature: IMG + 'inv-rue-miroir.jpg', extrait: 'Une image retournée n\'est pas une copie exacte : essaie de la retourner avant de chercher.' }]
      }), description: 'Une image retournée en miroir échappe souvent aux correspondances exactes.' }
    ],
    outils: ['image'],
    indices: [{ cout: 30, texte: 'Les enseignes sont écrites à l\'envers : l\'image a été retournée horizontalement. Retourne-la (bouton « Miroir ») et relis tout.' }, { cout: 40, texte: 'Une fois remise à l\'endroit, l\'enseigne bleue du bâtiment au drapeau donne le nom de la commune.' }],
    validation: 'flag', format: 'Format : LUMIO{nom_de_la_ville}',
    flags: ['LUMIO{valdorne}', 'LUMIO{mairie_de_valdorne}'],
    writeup: `<h3>1. Le détail qui cloche</h3><p>Les enseignes, le panneau « 30 » et les plaques sont écrits <b>à l'envers</b> : l'image a été <b>retournée horizontalement</b>. Ce simple miroir inverse aussi le sens de circulation : la rue « à gauche » roule en réalité à droite.</p>
<h3>2. Remettre à l'endroit</h3><p>Avec le bouton « Miroir » (visionneuse ou labo image), tout redevient lisible : « <b>MAIRIE DE VALDORNE</b> », « Boulangerie du Marché », plaques françaises (bande bleue « F », département 31), drapeau tricolore, panneau 30 : une commune française (fictive).</p>
<h3>3. Pourquoi les moteurs échouaient</h3><p>TinEye ne trouve que des copies quasi identiques : une image en miroir lui échappe. Les désinformateurs retournent ou recadrent les images exprès. Réflexe : <b>chercher aussi la version retournée</b> et des recadrages.</p>
<p>Flag : <code>LUMIO{valdorne}</code></p>`,
    retenir: 'Texte à l\'envers = image retournée. Le miroir change aussi le sens de circulation et le côté du volant : on vérifie avant d\'en déduire un pays.'
  },
  {
    id: 'inv-recadrage', categorie: 'inverse', titre: 'Une marée humaine ?', difficulte: 1, points: 150,
    accroche: '« Des milliers de personnes ce soir ! » Le cadre serré raconte-t-il toute l\'histoire ?',
    briefing: `<p class="dossier">Dossier VE-03 · Cellule de vérification</p>
<p>Un compte publie cette photo avec la légende « Des milliers de personnes ce soir pour notre rassemblement ! ». La foule paraît compacte… La recherche inversée retrouve une version <b>plus large</b> de la même photo.</p>
<p>Question : <b>quel événement était réellement photographié ?</b></p>${METHODE}`,
    ressources: [
      { type: 'image', titre: 'Image publiée', src: IMG + 'inv-foule-recadree.jpg', alt: 'Cadre serré sur une foule dense, de nuit, devant une scène sombre.', outils: ['image'] },
      { type: 'lens', titre: 'Recherche inversée (résultats simulés)', image: { src: IMG + 'inv-foule-recadree.jpg', alt: 'Image publiée' }, moteurs: cache({
        google: [{ titre: '« Des milliers de personnes ce soir pour notre rassemblement ! »', site: 'chirp.example/collectif_xyz', date: '2026-07-06', miniature: IMG + 'inv-foule-recadree.jpg', taille: '500×360' }],
        yandex: [{ titre: 'Retour en images sur la soirée de samedi', site: 'comite-des-fetes.example', date: '2026-07-05', miniature: IMG + 'inv-foule.jpg', taille: '1600×1000', extrait: 'Merci à toutes et à tous d\'être venus !', detail: { image: IMG + 'inv-foule.jpg', alt: 'Photo complète : une petite foule devant une scène, une banderole, des lampions, beaucoup d\'espace vide autour', texte: '<p>Photo publiée la veille par le comité des fêtes (fictif). Regarde bien la banderole et l\'espace vide de chaque côté.</p>' } }],
        bing: [{ titre: 'Retour en images sur la soirée de samedi', site: 'comite-des-fetes.example', date: '2026-07-05', miniature: IMG + 'inv-foule.jpg', taille: '1600×1000', detail: { image: IMG + 'inv-foule.jpg', alt: 'Photo complète' } }],
        tineye: [{ titre: 'comite-des-fetes.example/galerie/samedi', site: 'comite-des-fetes.example', date: '2026-07-05', miniature: IMG + 'inv-foule.jpg', taille: '1600×1000', detail: { image: IMG + 'inv-foule.jpg', alt: 'Photo complète' } }, { titre: 'chirp.example/collectif_xyz', site: 'chirp.example', date: '2026-07-06', miniature: IMG + 'inv-foule-recadree.jpg', taille: '500×360' }]
      }), description: 'Compare la taille et la date des résultats : la version la plus grande et la plus ancienne est souvent l\'originale.' }
    ],
    outils: ['image'],
    indices: [{ cout: 20, texte: 'Un résultat est plus grand (1600×1000) et publié la veille : ouvre-le.' }, { cout: 30, texte: 'Sur la photo complète, lis la banderole au-dessus de la scène.' }],
    validation: 'flag', format: 'Format : LUMIO{nom_de_l_evenement}',
    flags: ['LUMIO{fete_des_lanternes}', 'LUMIO{la_fete_des_lanternes}'],
    writeup: `<h3>1. Trouver la version complète</h3><p>La recherche inversée remonte une image de <b>1600×1000</b>, publiée <b>la veille</b> par un comité des fêtes : plus grande, plus ancienne, c'est l'originale. L'image virale (500×360) n'en est qu'un <b>recadrage</b>.</p>
<h3>2. Ce que le cadre cachait</h3><p>Sur la photo complète, la foule n'occupe que le centre ; de part et d'autre, la place est presque vide. La banderole indique « <b>FÊTE DES LANTERNES</b> — Place du Marché · 21 h » : il ne s'agit pas d'un rassemblement militant.</p>
<h3>3. Leçon</h3><p>Un recadrage serré exagère la densité d'une foule (et peut masquer des panneaux, des personnes, un contexte). Pour estimer une foule, on cherche des vues larges, plusieurs angles, et on mesure la surface occupée.</p>
<p>Flag : <code>LUMIO{fete_des_lanternes}</code></p>`,
    retenir: 'Recadrer, c\'est choisir ce qu\'on montre : on cherche toujours la version la plus large de l\'image.'
  },
  {
    id: 'inv-ombres', categorie: 'inverse', titre: 'Les ombres ne mentent pas', difficulte: 3, points: 300,
    accroche: 'Un seul soleil, donc des ombres cohérentes. Deux éléments ont été ajoutés après coup.',
    briefing: `<p class="dossier">Dossier VE-04 · Cellule de vérification</p>
<p>Une agence de voyages a publié cette photo de plage pour une campagne. Un graphiste affirme que <b>deux éléments</b> ont été collés après coup. Les éléments suspects sont marqués de <b>A</b> à <b>E</b>.</p>
<p>Il n'y a qu'un soleil (en haut à gauche) : toutes les ombres doivent partir dans la même direction, avec une longueur cohérente. <b>Lesquels ont été ajoutés ?</b></p>`,
    ressources: [{ type: 'image', titre: 'Photo de la campagne', src: IMG + 'inv-montage.jpg', alt: 'Plage ensoleillée, soleil en haut à gauche. A : un palmier dont l\'ombre part vers la droite. B : une personne en rose dont l\'ombre part vers la gauche. C : un banc dont l\'ombre part vers la droite. D : un chien sans aucune ombre, éclairé du côté droit. E : un lampadaire dont l\'ombre part vers la droite. Un promeneur en bleu, sans étiquette, a une ombre vers la droite.', outils: ['image'] }],
    outils: ['image'],
    indices: [{ cout: 40, texte: 'Le soleil est en haut à gauche : les ombres doivent partir vers la droite. Lequel a une ombre dans le mauvais sens ?' }, { cout: 50, texte: 'Un autre élément n\'a aucune ombre au sol, et il est éclairé du mauvais côté.' }],
    validation: 'flag', format: 'Format : LUMIO{x_y}, les deux lettres en minuscules dans l\'ordre alphabétique (ex. LUMIO{a_c})',
    flags: ['LUMIO{b_d}', 'LUMIO{bd}', 'LUMIO{b-d}', 'LUMIO{b,d}', 'LUMIO{b_et_d}', 'LUMIO{b_,_d}', 'LUMIO{b,_d}'],
    writeup: `<h3>1. Établir la référence</h3><p>Le soleil est en haut à gauche. Le palmier (A), le banc (C), le lampadaire (E) et le promeneur sans étiquette ont tous une ombre <b>vers la droite</b>, de longueur cohérente : c'est la référence.</p>
<h3>2. Les incohérences</h3><ul><li><b>B</b> (la personne en rose) a une ombre <b>vers la gauche</b> : elle a été photographiée sous une autre lumière puis collée.</li><li><b>D</b> (le chien) n'a <b>aucune ombre</b> au sol et il est éclairé <b>par la droite</b> : collé, lui aussi.</li></ul>
<h3>3. Les outils</h3><p>Au-delà des ombres : perspective et taille relative, netteté et bruit différents, contours trop nets, reflets absents. Des outils comme <b>Forensically</b> ou <b>FotoForensics</b> (analyse du niveau d'erreur JPEG, ELA) aident, mais ne remplacent pas l'observation physique : lumière, ombres, perspective.</p>
<p>Flag : <code>LUMIO{b_d}</code></p>`,
    retenir: 'Un soleil = une direction d\'ombres. Une ombre absente ou contraire trahit souvent un montage.'
  },
  {
    id: 'inv-ia', categorie: 'inverse', titre: 'La mascotte qui avait trop de doigts', difficulte: 2, points: 250,
    accroche: 'Une « photo » du festival qui n\'a jamais été prise par un appareil. Le fichier l\'avoue, à qui sait lire.',
    briefing: `<p class="dossier">Dossier VE-05 · Cellule de vérification</p>
<p>Un compte prétend avoir photographié cette scène au « Lumio Festival ». Plusieurs détails évoquent une <b>image générée</b> par un modèle d'IA. Fais l'inventaire des indices visuels, puis examine le <b>fichier</b> lui-même : certains générateurs y laissent leur signature.</p>
<p>Question : <b>quel logiciel a produit cette image ?</b></p>`,
    ressources: [{ type: 'image', titre: 'Image publiée (PNG)', src: IMG + 'inv-generee.png', alt: 'Illustration d\'une personne qui salue devant une banderole violette où l\'on lit « LUMOI FESTVAL 2O2G ». La main levée a trop de doigts, les deux boucles d\'oreilles sont différentes (un rond jaune, un triangle bleu), les yeux sont de tailles différentes, la roue avant d\'un vélo est déformée et les lignes du bâtiment ondulent.', outils: ['exif', 'image', 'hex'] }],
    outils: ['exif', 'image', 'hex'],
    indices: [{ cout: 30, texte: 'Compte les doigts, lis la banderole, compare les deux oreilles… puis ouvre le fichier dans l\'inspecteur EXIF : un PNG peut contenir des blocs de texte.' }, { cout: 40, texte: 'Le bloc « Software » donne le nom du générateur.' }],
    validation: 'flag', format: 'Format : LUMIO{nom_du_logiciel} (sans espace ni numéro de version)',
    flags: ['LUMIO{pixelreve}', 'LUMIO{pixelreve_3}', 'LUMIO{pixelreve3}', 'LUMIO{pixel_reve}', 'LUMIO{pixel_reve_3}'],
    writeup: `<h3>1. Les indices visuels</h3><ul><li><b>Main à six doigts</b> (plus le pouce) : les mains restent un point faible des générateurs.</li><li><b>Texte illisible ou absurde</b> : « LUMOI FESTVAL 2O2G ».</li><li><b>Asymétries</b> : boucles d'oreilles différentes, yeux de tailles différentes.</li><li><b>Objets qui fondent</b> : roue de vélo déformée, lignes du bâtiment qui ondulent, bras mal raccordé.</li></ul>
<h3>2. Le fichier</h3><p>L'inspecteur EXIF lit les <b>blocs texte du PNG</b> : <code>Software: PixelReve 3 (generateur d'images)</code>, une <code>Description</code> qui contient… le <b>prompt</b>, et un <code>Comment</code> avec le code IPTC <code>DigitalSourceType: trainedAlgorithmicMedia</code>, la norme qui signale un contenu généré. (PixelRêve est un nom fictif.)</p>
<h3>3. Prudence</h3><p>Ces métadonnées s'effacent en une capture d'écran : leur <b>absence ne prouve rien</b>. Les « détecteurs d'IA » se trompent souvent. Les signatures robustes, comme les <b>Content Credentials (C2PA)</b>, et surtout la recherche de la <b>source</b> (qui a publié en premier, avec quel appareil, d'autres angles ?) restent la méthode la plus fiable.</p>
<p>Flag : <code>LUMIO{pixelreve}</code></p>`,
    retenir: 'Image générée : on cumule indices visuels (mains, texte, asymétries) et indices techniques (métadonnées, C2PA), sans jamais se fier à un seul.'
  }
];
