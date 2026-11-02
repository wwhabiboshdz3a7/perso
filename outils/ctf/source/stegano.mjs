import { code } from './_aides.mjs';

const F = 'assets/ctf/fichiers/';

export default [
  {
    id: 'steg-strings', categorie: 'stegano', titre: 'La mascotte bavarde', difficulte: 1, points: 100,
    accroche: 'Une image anodine. Quelques mots lisibles se cachent au milieu des octets.',
    briefing: `<p class="dossier">Dossier ST-01 · Fichier partagé par un club de robotique</p>
<p>Le club de robotique a publié la nouvelle mascotte sur son site. Un membre signale que le fichier « contient du texte ». Une image n'est qu'une suite d'octets : certaines suites forment des caractères lisibles. L'outil <code>strings</code> les extrait.</p>`,
    ressources: [{ type: 'image', titre: 'mascotte.jpg', src: F + 'mascotte.jpg', alt: 'Dessin d\'un robot gris-bleu aux yeux verts', outils: ['hex', 'exif'] }],
    outils: ['hex', 'exif'],
    indices: [{ cout: 20, texte: 'Dans « Hex & signatures », passe sur la vue « Chaînes (strings) » et filtre sur « LUMIO » ou « mot de passe ».' }],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{strings_lit_ce_que_tu_ne_vois_pas}'],
    writeup: `<h3>1. Extraire les chaînes</h3>${code('bash', 'strings -n 6 mascotte.jpg | head\n# JFIF\n# Fichier de travail - ne pas diffuser. Mot de passe de la borne Wi-Fi du club : LUMIO{…}')}
<p><code>strings</code> affiche toute suite d'au moins 4 caractères imprimables. Dans une image, la plupart des octets sont des données compressées illisibles ; les suites lisibles sont les en-têtes (<code>JFIF</code>, <code>Exif</code>) et… les textes ajoutés.</p>
<h3>2. Où était le texte ?</h3><p>Dans un segment <b>commentaire</b> JPEG (marqueur <code>FF FE</code>), que les visionneuses ignorent. L'inspecteur EXIF le signale aussi dans ses remarques.</p>
<p>Flag : <code>LUMIO{strings_lit_ce_que_tu_ne_vois_pas}</code></p>`,
    retenir: 'strings est le premier outil à lancer sur un fichier inconnu : URL, mots de passe, chemins et messages oubliés y apparaissent souvent.'
  },
  {
    id: 'steg-invisible', categorie: 'stegano', titre: 'Rien à voir ici', difficulte: 1, points: 150,
    accroche: 'Une affiche noire. Vraiment noire ?',
    briefing: `<p class="dossier">Dossier ST-02 · Affiche d'une exposition (galerie fictive)</p>
<p>L'affiche de l'exposition « Nuit noire » proclame qu'il n'y a « rien à voir ». L'artiste a pourtant écrit quelque chose dans le grand espace sombre, dans une couleur presque identique au fond : différente d'<b>une seule unité</b> sur 255.</p>
<p>L'œil ne voit pas une telle différence. Un programme, si.</p>`,
    ressources: [{ type: 'image', titre: 'affiche-nuit-noire.png', src: F + 'affiche-nuit-noire.png', alt: 'Affiche sombre avec le texte « Rien à voir ici »', outils: ['image'] }],
    outils: ['image'],
    indices: [{ cout: 20, texte: 'Dans le labo image, pousse le curseur « Amplifier les écarts » ou affiche le plan de bits Rouge, bit 0.' }, { cout: 20, texte: 'La couleur du texte vaut R=27 et celle du fond R=26 : seul le bit de poids faible du canal rouge diffère.' }],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{presque_invisible}'],
    writeup: `<h3>1. Une différence d'une unité</h3><p>Fond : <code>#1A1D24</code> (R = 26). Texte caché : <code>#1B1D24</code> (R = 27). Sur un écran, ces deux noirs sont identiques. L'inspection des pixels du labo (survol) montre pourtant des valeurs différentes au milieu de l'affiche.</p>
<h3>2. Révéler</h3><ul><li><b>Plan de bits</b> rouge, bit 0 : 26 = <code>11010</code>, 27 = <code>11011</code>. Le bit 0 vaut 0 pour le fond et 1 pour le texte : le message apparaît en blanc sur noir.</li><li><b>Amplifier les écarts</b> (multiplier les valeurs, modulo 256) ou un réglage de niveaux extrême donnent le même résultat.</li></ul>
<p>Outils de référence : StegSolve, Aperi'Solve, GIMP (Courbes).</p>
<p>Flag : <code>LUMIO{presque_invisible}</code></p>`,
    retenir: 'Réflexe stéganographie sur une image : explorer les plans de bits de chaque canal et forcer le contraste.'
  },
  {
    id: 'steg-lsb', motsPublics: ['les_bits_de_poids_faible'], categorie: 'stegano', titre: 'Le coucher de soleil codé', difficulte: 2, points: 250,
    accroche: 'Un message entier dissimulé dans le dernier bit de chaque couleur.',
    briefing: `<p class="dossier">Dossier ST-03 · Échange suspect sur un forum de dessin</p>
<p>Deux membres d'un forum s'envoient toujours la même illustration de coucher de soleil. Un modérateur soupçonne un canal caché. Le fichier est un PNG (sans perte) : chaque pixel a trois couleurs, rouge, vert, bleu, codées de 0 à 255.</p>
<p>Modifier le <b>bit de poids faible</b> (LSB) d'une couleur change sa valeur d'une unité au plus : invisible. Avec trois bits par pixel, une petite image peut transporter des milliers de caractères.</p>`,
    ressources: [{ type: 'image', titre: 'coucher-soleil.png', src: F + 'coucher-soleil.png', alt: 'Illustration d\'un coucher de soleil, avec des disques colorés', outils: ['image', 'hex'] }],
    outils: ['image', 'hex'],
    indices: [
      { cout: 30, texte: 'Le plan de bits rouge, bit 0, montre une bande de bruit en haut de l\'image : le message commence au premier pixel.' },
      { cout: 40, texte: 'Labo image → « Extraire un texte caché » : canaux RGB, bit 0. Les bits sont lus pixel par pixel, R puis G puis B, regroupés par 8.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{les_bits_de_poids_faible}'],
    writeup: `<h3>1. Repérer</h3><p>Le plan de bits 0 d'une image naturelle (ou dessinée) est très régulier sur les aplats. Ici, les premières lignes montrent un « bruit » : signe qu'on a écrit des données dans les LSB.</p>
<h3>2. Extraire</h3><p>On lit le bit 0 de R, G, B pour chaque pixel, dans l'ordre, et on regroupe les bits par paquets de 8 (bit de poids fort d'abord) :</p>
${code('python', `from PIL import Image
img = Image.open("coucher-soleil.png").convert("RGB")
bits = [c & 1 for px in img.getdata() for c in px]
octets = bytes(int("".join(map(str, bits[i:i+8])), 2) for i in range(0, len(bits), 8))
print(octets.split(b"\\x00")[0].decode())`)}
<p>Résultat : « Message caché pour l'équipe : LUMIO{les_bits_de_poids_faible} ». Outils équivalents : <code>zsteg</code> (PNG/BMP), StegSolve, Aperi'Solve.</p>
<h3>3. Limites</h3><p>Le LSB ne survit pas à une compression JPEG ni à un redimensionnement : c'est pourquoi on l'utilise sur des PNG.</p>
<p>Flag : <code>LUMIO{les_bits_de_poids_faible}</code></p>`,
    retenir: 'La stéganographie LSB cache des données sans changement visible ; on la détecte par l\'analyse des plans de bits et on l\'extrait en relisant les bits dans le bon ordre.'
  },
  {
    id: 'steg-zip', categorie: 'stegano', titre: 'La carte postale à double fond', difficulte: 2, points: 200,
    accroche: 'Une image qui pèse un peu trop lourd pour ce qu\'elle montre.',
    briefing: `<p class="dossier">Dossier ST-04 · Pièce jointe d'un courriel</p>
<p>Une « carte postale » en JPEG circule dans une équipe. Elle s'ouvre normalement, mais un analyste remarque qu'un visualiseur s'arrête de lire au marqueur de fin d'image… et que le fichier continue après.</p>`,
    ressources: [{ type: 'fichier', titre: 'Pièce jointe', nom: 'carte-postale.jpg', src: F + 'carte-postale.jpg', taille: 'environ 40 Ko', outils: ['hex', 'image', 'exif'], description: 'Une image de terrasse de café, en apparence.' }],
    outils: ['hex', 'image', 'exif'],
    indices: [{ cout: 30, texte: 'Un JPEG se termine par FF D9. L\'outil « Hex & signatures » liste les signatures trouvées dans tout le fichier : cherche celle d\'une archive (50 4B 03 04, « PK »).' }, { cout: 30, texte: 'Clique sur « Extraire à partir d\'ici » sur la ligne de l\'archive ZIP, puis affiche le fichier texte.' }],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{un_zip_colle_apres_la_fin}'],
    writeup: `<h3>1. Lister les signatures</h3>${code('bash', 'binwalk carte-postale.jpg\n# 0       JPEG image data, JFIF standard\n# 38672   Zip archive data, name: secret/message.txt')}
<p>Le marqueur de fin JPEG (<code>FF D9</code>) arrive avant la fin du fichier, et une signature <code>PK\\x03\\x04</code> apparaît juste après : une archive ZIP a été <b>concaténée</b> à l'image (<code>cat image.jpg archive.zip &gt; carte.jpg</code>).</p>
<h3>2. Extraire</h3>${code('bash', 'binwalk -e carte-postale.jpg     # ou :\nunzip carte-postale.jpg            # unzip cherche le répertoire central à la fin du fichier')}
<p>L'archive contient <code>secret/message.txt</code> (et une liste de courses, pour faire diversion). Le texte étant compressé (deflate), le flag n'apparaît même pas avec <code>strings</code>.</p>
<p>Flag : <code>LUMIO{un_zip_colle_apres_la_fin}</code></p>`,
    retenir: 'Toujours comparer la taille d\'un fichier à ce qu\'il devrait contenir et chercher des signatures au milieu du fichier (binwalk, foremost).'
  },
  {
    id: 'steg-spectre', categorie: 'stegano', titre: 'Le message du phare', difficulte: 3, points: 300,
    accroche: 'Un enregistrement de quelques secondes : écoute-le… avec les yeux.',
    briefing: `<p class="dossier">Dossier ST-05 · Enregistrement reçu par une radio amateur</p>
<p>Un radioamateur a capté un étrange son aigu par-dessus une musique douce. À l'oreille, on n'entend qu'un sifflement. Mais un son, c'est une somme de fréquences qui évoluent dans le temps, et un <b>spectrogramme</b> les dessine : temps de gauche à droite, fréquences de bas en haut.</p>`,
    ressources: [{ type: 'audio', titre: 'message-du-phare.wav', nom: 'message-du-phare.wav', src: F + 'message-du-phare.wav', outils: ['spectro', 'hex'], description: 'WAV, 9 secondes, mono.' }],
    outils: ['spectro', 'hex'],
    indices: [{ cout: 30, texte: 'Ouvre le fichier dans l\'outil « Spectrogramme ». Le message se trouve entre 2 500 et 9 000 Hz.' }, { cout: 30, texte: 'Si le texte est flou, augmente la taille de FFT et règle le contraste.' }],
    validation: 'flag', format: 'Format : LUMIO{…} (le texte lu dans le spectre)',
    flags: ['LUMIO{ecoute_avec_les_yeux}'],
    writeup: `<h3>1. Du son à l'image</h3><p>La transformée de Fourier décompose un court morceau de son en fréquences. En répétant l'opération toutes les quelques millisecondes (<b>FFT à court terme</b>) et en colorant l'intensité, on obtient un spectrogramme.</p>
<h3>2. Lire</h3><p>Entre 2,5 et 9 kHz, des sinusoïdes ont été allumées et éteintes pour « dessiner » des lettres : on lit <b>LUMIO{ECOUTE_AVEC_LES_YEUX}</b>. Les basses fréquences (200 à 400 Hz) correspondent à la musique de fond.</p>
${code('text', 'Audacity : menu de la piste → Spectrogramme\nSonic Visualiser : Calque → Ajouter un spectrogramme\nsox message-du-phare.wav -n spectrogram -o spectre.png')}
<p>Le musicien Aphex Twin a caché un visage dans le spectre d'un de ses morceaux : la technique est connue des CTF depuis longtemps.</p>
<p>Flag : <code>LUMIO{ecoute_avec_les_yeux}</code></p>`,
    retenir: 'Face à un fichier audio suspect : spectrogramme d\'abord, puis recherche de Morse, de SSTV ou de données dans les échantillons.'
  }
];
