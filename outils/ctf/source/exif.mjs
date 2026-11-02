import { code } from './_aides.mjs';

const F = 'assets/ctf/fichiers/';

export default [
  {
    id: 'exif-appareil', categorie: 'exif', titre: 'Quel appareil ?', difficulte: 1, points: 100,
    accroche: 'Une jolie photo de terrasse. Le fichier se souvient de l\'appareil qui l\'a prise.',
    briefing: `<p class="dossier">Dossier EX-01 · Concours photo d'une association de quartier</p>
<p>Le règlement d'un concours photo impose des images prises avec un <b>appareil photo</b>, pas avec un téléphone. Une participante envoie cette photo de terrasse. Avant d'éplucher les détails, le jury veut juste savoir : <b>quel modèle d'appareil</b> a pris la photo ?</p>
<p>Une photo numérique contient presque toujours des <b>métadonnées EXIF</b> écrites par l'appareil. Ouvre le fichier dans l'inspecteur.</p>`,
    ressources: [{ type: 'image', titre: 'terrasse.jpg', src: F + 'terrasse.jpg', alt: 'Terrasse d\'un café au store rayé vert et blanc devant une façade de brique', outils: ['exif', 'hex'] }],
    outils: ['exif', 'hex'],
    indices: [{ cout: 20, texte: 'Clique sur « Inspecteur EXIF » sous l\'image. Les balises « Fabricant » (Make) et « Modèle » (Model) sont dans le groupe « Image et appareil ».' }],
    validation: 'flag', format: 'Format : LUMIO{modele} (le nom du modèle, sans la marque)',
    flags: ['LUMIO{x-t30}', 'LUMIO{xt30}', 'LUMIO{x_t30}', 'LUMIO{fujifilm_x-t30}', 'LUMIO{fujifilm_xt30}'],
    writeup: `<h3>1. Lire les EXIF</h3><p>Le format EXIF (Exchangeable Image File Format) est un bloc de données glissé au début des JPEG. Il décrit l'appareil, les réglages, la date, parfois le lieu.</p>
${code('text', 'Fabricant      FUJIFILM\nModèle         X-T30\nLogiciel       Digital Camera X-T30 Ver2.00\nObjectif       XF23mmF2 R WR\nExposition     1/500 s · f/5.6 · ISO 200')}
<h3>2. En ligne de commande</h3>${code('bash', 'exiftool terrasse.jpg | grep -i -E "make|model"')}
<p>La photo vient d'un hybride Fujifilm X-T30 avec un objectif 23 mm : elle respecte le règlement.</p>
<p>Flag : <code>LUMIO{x-t30}</code></p>`,
    retenir: 'exiftool (ou un inspecteur EXIF) est le premier réflexe face à un fichier image : appareil, objectif, logiciel, dates, GPS.'
  },
  {
    id: 'exif-gps', categorie: 'exif', titre: 'La vue depuis le belvédère', difficulte: 1, points: 150,
    accroche: 'Mer, îles, toits orange. Le téléphone a noté bien plus que la vue.',
    briefing: `<p class="dossier">Dossier EX-02 · Photo de vacances partagée en message privé</p>
<p>Une amie t'envoie cette photo « d'un belvédère magnifique » sans dire où elle est. L'image a été transférée en fichier original (pas compressée par un réseau social) : les métadonnées sont intactes.</p>
<p><b>Place ton repère à l'endroit exact où la photo a été prise.</b></p>`,
    ressources: [{ type: 'image', titre: 'vue-mer.jpg', src: F + 'vue-mer.jpg', alt: 'Panorama sur la mer, des îles au large et des toits de tuiles orange', outils: ['exif'] }],
    outils: ['exif'],
    indices: [{ cout: 20, texte: 'L\'inspecteur EXIF affiche un groupe GPS : latitude, longitude, et leur conversion en décimal.' }, { cout: 30, texte: 'Copie les coordonnées décimales et colle-les dans le champ « Coordonnées » du panneau de validation, puis « Placer ».' }],
    validation: 'carte', vue: [44, 3, 5],
    cible: { lieu: 'Parvis de Notre-Dame-de-la-Garde, Marseille', points: [{ lat: 43.2839, lon: 5.3712 }], anneaux: [{ r: 150, part: 1 }, { r: 1500, part: 0.5 }, { r: 25000, part: 0 }] },
    writeup: `<h3>1. Les coordonnées GPS</h3>${code('text', 'Latitude     43° 17′ 2,04″ N\nLongitude    5° 22′ 16,32″ E\nAltitude     149 m\nDirection    240,5° (vers l\'ouest-sud-ouest)')}
<h3>2. Convertir en décimal</h3><p>Degrés + minutes/60 + secondes/3600 : 43 + 17/60 + 2,04/3600 = <b>43,2839</b> ; 5 + 22/60 + 16,32/3600 = <b>5,3712</b>. N et E sont positifs (S et O seraient négatifs).</p>
<h3>3. Vérifier</h3><p>Ces coordonnées tombent sur le parvis de <b>Notre-Dame-de-la-Garde</b>, à Marseille, à 149 m d'altitude. La direction 240° (vers l'ouest-sud-ouest) est cohérente avec la vue sur la mer et les îles du Frioul. Recouper les métadonnées avec le contenu de l'image est indispensable : un EXIF peut être modifié.</p>`,
    retenir: 'Une photo envoyée « en original » peut révéler un domicile au mètre près. Désactive la géolocalisation de l\'appareil photo du téléphone, ou supprime les métadonnées avant de partager.'
  },
  {
    id: 'exif-date', categorie: 'exif', titre: 'Le feu d\'artifice d\'hier soir ?', difficulte: 2, points: 200,
    accroche: 'Présentée comme récente, cette photo a pourtant une date de naissance bien précise.',
    briefing: `<p class="dossier">Dossier EX-03 · Vérification pour un média local</p>
<p>Un internaute envoie à une rédaction une photo « prise hier soir » d'un feu d'artifice au-dessus d'un pont. La rédaction veut la publier, mais la journaliste a un doute : le fichier a-t-il vraiment été pris hier ?</p>
<p><b>Question :</b> à quelle date la photo a-t-elle réellement été <b>prise</b> ? Attention, un fichier peut contenir plusieurs dates. Flag : <code>LUMIO{AAAA-MM-JJ}</code>.</p>`,
    ressources: [{ type: 'image', titre: 'feu-artifice.jpg', src: F + 'feu-artifice.jpg', alt: 'Feu d\'artifice multicolore au-dessus d\'un pont en arcs', outils: ['exif'] }],
    outils: ['exif'],
    indices: [{ cout: 30, texte: 'EXIF distingue la date de modification (DateTime, réécrite par les logiciels) et la date de prise de vue (DateTimeOriginal).' }, { cout: 30, texte: 'Le logiciel indiqué (GIMP) a réécrit la date de modification en janvier 2024. Regarde « Date de prise de vue ».' }],
    validation: 'flag', format: 'Format : LUMIO{AAAA-MM-JJ}',
    flags: ['LUMIO{2023-07-14}', 'LUMIO{14-07-2023}', 'LUMIO{2023:07:14}', 'LUMIO{14/07/2023}', 'LUMIO{2023/07/14}', 'LUMIO{14_juillet_2023}'],
    writeup: `<h3>1. Trois dates différentes</h3>${code('text', 'Date de modification     2024:01:03 10:12:44   ← réécrite par GIMP\nDate de prise de vue     2023:07:14 22:47:13   ← appareil\nDate de numérisation     2023:07:14 22:47:13\nFuseau (prise de vue)    +02:00\nLogiciel                 GIMP 2.10.36')}
<p><code>DateTimeOriginal</code> est écrite par l'appareil au déclenchement. <code>DateTime</code> est mise à jour par les logiciels d'édition. Ici la photo a été prise le <b>14 juillet 2023</b> à 22 h 47 (heure d'été), puis retouchée en janvier 2024.</p>
<h3>2. Conclusion pour la rédaction</h3><p>La photo n'est pas d'hier : c'est un feu d'artifice du 14 juillet de l'année précédente. On recoupe toujours : recherche d'image inversée, comparaison avec la météo et les événements de la date, contact avec l'auteur. Et on garde en tête que l'EXIF lui-même peut être falsifié.</p>
<p>Flag : <code>LUMIO{2023-07-14}</code></p>`,
    retenir: 'Distinguer date de prise de vue (DateTimeOriginal), date de modification (DateTime) et date du fichier sur le disque. Une seule ne prouve rien : on recoupe.'
  },
  {
    id: 'exif-miniature', categorie: 'exif', titre: 'Le recadrage qui n\'a rien caché', difficulte: 3, points: 300,
    accroche: 'L\'image a été recadrée avant publication. Sa miniature, elle, n\'a rien oublié.',
    briefing: `<p class="dossier">Dossier EX-04 · Photo de bureau publiée sur un blog d'entreprise</p>
<p>Pour un article « nos espaces de travail », un employé a publié une photo de son bureau. Il a pris soin de <b>recadrer</b> l'image pour retirer un post-it compromettant sur la gauche. Mais certains logiciels mettent à jour l'image… sans mettre à jour la <b>miniature</b> stockée dans les métadonnées.</p>`,
    ressources: [{ type: 'image', titre: 'bureau.jpg', src: F + 'bureau.jpg', alt: 'Un écran, une tasse et une plante sur un bureau en bois', outils: ['exif', 'hex'] }],
    outils: ['exif', 'hex'],
    indices: [{ cout: 30, texte: 'Les EXIF peuvent contenir une miniature JPEG (IFD1) pour l\'aperçu rapide. L\'inspecteur l\'affiche à droite de l\'image principale.' }, { cout: 40, texte: 'Compare la miniature et l\'image : la miniature montre la photo avant recadrage, post-it compris. Agrandis-la (clic droit → ouvrir l\'image, ou zoom du navigateur).' }],
    validation: 'flag', format: 'Format : LUMIO{…} (le code écrit sur le post-it)',
    flags: ['LUMIO{la_miniature_se_souvient}'],
    writeup: `<h3>1. Une image dans l'image</h3><p>Le bloc EXIF d'un JPEG peut embarquer une <b>miniature</b> (souvent 160 × 120 ou 320 × 240 px) que les explorateurs de fichiers affichent sans décoder toute l'image. Elle est décrite par les balises <code>JPEGInterchangeFormat</code> (position) et <code>JPEGInterchangeFormatLength</code> (taille) dans l'IFD1.</p>
<h3>2. Extraire</h3>${code('bash', 'exiftool -b -ThumbnailImage bureau.jpg > miniature.jpg')}
<p>L'inspecteur l'affiche directement : la miniature montre la photo <b>avant recadrage</b>, avec le post-it « Code d'accès : LUMIO{la_miniature_se_souvient} ».</p>
<h3>3. Leçon</h3><p>Des fuites réelles ont eu lieu ainsi (photos recadrées ou floutées dont la miniature était intacte). Avant de publier : exporter une nouvelle image sans métadonnées (« Exporter pour le web », <code>exiftool -all= image.jpg</code>, <code>mat2</code>) et vérifier le résultat.</p>
<p>Flag : <code>LUMIO{la_miniature_se_souvient}</code></p>`,
    retenir: 'Recadrer ou flouter ne suffit pas : il faut exporter une image propre, sans métadonnées ni miniature, puis la vérifier.'
  },
  {
    id: 'exif-auteur', categorie: 'exif', titre: 'Le photographe anonyme', difficulte: 2, points: 200,
    accroche: 'Champs « Auteur » et « Copyright » vides. Mais l\'appareil, lui, connaît son propriétaire.',
    briefing: `<p class="dossier">Dossier EX-05 · Photo envoyée « anonymement » à un journal (personnage fictif)</p>
<p>Un lecteur envoie au journal local une photo d'un rassemblement au skatepark, en demandant à rester anonyme. Il a pris soin de vider les champs « Auteur » et « Copyright ». Le journal veut protéger sa source… et vérifier que la photo ne trahit pas son identité avant publication.</p>
<p><b>Question :</b> quel nom l'appareil a-t-il enregistré comme propriétaire ? Flag : <code>LUMIO{prenom_nom}</code>.</p>`,
    ressources: [{ type: 'image', titre: 'skatepark.jpg', src: F + 'skatepark.jpg', alt: 'Trois skateurs dessinés sur une piste de skatepark', outils: ['exif'] }],
    outils: ['exif'],
    indices: [{ cout: 20, texte: 'Les champs Artist et Copyright sont vides, mais d\'autres balises existent : « Propriétaire de l\'appareil » (CameraOwnerName), numéro de série, commentaires Windows (XPComment).' }],
    validation: 'flag', format: 'Format : LUMIO{prenom_nom}',
    flags: ['LUMIO{mathis_roques}'],
    writeup: `<h3>1. Ce qui a été vidé… et ce qui reste</h3>${code('text', 'Auteur (Artist)              (vide)\nCopyright                    (vide)\nCommentaire (Windows)        Envoyé depuis le portable de Mathis\nPropriétaire de l\'appareil   Mathis Roques\nNuméro de série du boîtier   6014829')}
<p>Beaucoup d'appareils permettent d'enregistrer le nom du propriétaire, qui est alors écrit dans <b>chaque</b> photo (<code>CameraOwnerName</code>). Le numéro de série permet aussi de relier entre elles toutes les photos d'un même boîtier publiées en ligne.</p>
<h3>2. Conduite à tenir</h3><p>Pour protéger sa source, le journal publie une version <b>nettoyée</b> (sans aucune métadonnée), et prévient la personne. Mathis Roques est un personnage fictif.</p>
<p>Flag : <code>LUMIO{mathis_roques}</code></p>`,
    retenir: 'Vider un ou deux champs ne rend pas un fichier anonyme : il faut supprimer toutes les métadonnées (exiftool -all=, mat2) et vérifier.'
  }
];
