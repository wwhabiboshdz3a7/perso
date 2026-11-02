import { cache, decaler, rot13, b64, b32, hex, vigenere, xorHex, morse, substitution, code } from './_aides.mjs';

const SUBST_CLAIR = 'LA CRYPTANALYSE PAR ANALYSE DE FREQUENCES A ETE DECRITE PAR LE SAVANT AL KINDI A BAGDAD AU NEUVIEME SIECLE. DANS UN TEXTE FRANCAIS LA LETTRE E EST DE LOIN LA PLUS FREQUENTE, SUIVIE DE A, S, I, N ET T. EN COMPTANT LES SYMBOLES ON RETROUVE LES LETTRES LES PLUS COURANTES, PUIS LES PETITS MOTS COMME LE, LA, DE ET EST. BRAVO, TU AS CASSE LE CHIFFRE. LE MOT DE PASSE EST KINDI.';
const SUBST_CLE = 'XNHQBWRKAZEOSGTPMDJIUVLFCY';

export default [
  {
    id: 'crypto-cesar', categorie: 'crypto', titre: 'Le message de Jules', difficulte: 1, points: 100,
    accroche: 'Une tablette de cire, onze lettres décalées et un empereur pressé.',
    briefing: `<p class="dossier">Dossier CR-01 · Atelier pédagogique, musée d'antiquités</p>
<p>Pour un atelier sur la Rome antique, une médiatrice a gravé un message « à la manière de Jules César » sur une tablette de cire. Les enfants ont trouvé la méthode en dix minutes. Et toi ?</p>
<p>Le message gravé :</p>`,
    ressources: [{ type: 'texte', titre: 'Tablette de cire', contenu: decaler('LUMIO{veni_vidi_vici}', 3) }],
    outils: ['boite'],
    indices: [
      { cout: 20, texte: 'César remplaçait chaque lettre par celle située quelques rangs plus loin dans l\'alphabet. Les accolades et les tirets bas ne bougent pas.' },
      { cout: 30, texte: 'Le début du message chiffré correspond forcément à « LUMIO ». De combien de rangs faut-il reculer pour passer de O à L ?' }
    ],
    validation: 'flag', format: 'Format : LUMIO{trois_mots_latins}',
    flags: ['LUMIO{veni_vidi_vici}'],
    writeup: `<h3>1. Reconnaître le chiffre</h3><p>Le texte garde sa structure (accolades, tirets bas, longueur des mots) : seules les lettres changent. C'est la signature d'une <b>substitution simple</b>, et l'indice « Jules » pointe vers le <b>chiffre de César</b> : chaque lettre est décalée d'un nombre fixe de rangs.</p>
<h3>2. Trouver le décalage</h3><p>On sait que tous les flags commencent par <code>LUMIO</code>. Le texte commence par <code>OXPLR</code> : O → L, c'est un recul de 3 rangs (O, N, M, L). Vérifions : X − 3 = U, P − 3 = M. C'est cohérent : la clé est <b>3</b>.</p>
<p>Sans cette astuce, on teste les 25 décalages possibles (c'est l'opération « César : tester les 25 décalages » de la boîte à outils) et on garde la seule ligne lisible : une <b>attaque par force brute</b>, triviale ici car l'espace des clés est minuscule.</p>
${code('text', 'Recette : César : décaler de n  (n = -3)\nEntrée  : OXPLR{yhql_ylgl_ylfl}\nSortie  : LUMIO{veni_vidi_vici}')}
<p>« Veni, vidi, vici » : « je suis venu, j'ai vu, j'ai vaincu », la formule attribuée à César.</p>
<p>Flag : <code>LUMIO{veni_vidi_vici}</code></p>`,
    retenir: 'Un chiffre dont la clé n\'a que 25 valeurs possibles ne résiste pas à une force brute. Et connaître un morceau du message clair (ici « LUMIO{ ») suffit souvent à retrouver la clé.'
  },
  {
    id: 'crypto-rot13', categorie: 'crypto', titre: 'Spoiler masqué', difficulte: 1, points: 100,
    accroche: 'Sur un vieux forum, les révélations sont « cachées » en ROT13.',
    briefing: `<p class="dossier">Dossier CR-02 · Forum de jeux d'énigmes</p>
<p>Sur un forum d'énigmes des années 2000, les membres cachaient les solutions pour ne pas gâcher le plaisir des autres. Le message épinglé de la modératrice dit : « Spoiler en ROT13, comme d'habitude ». Voici le message masqué.</p>`,
    ressources: [{ type: 'texte', titre: 'Message épinglé', contenu: 'Fcbvyre : ' + rot13('LUMIO{rot13_cache_mais_ne_protege_pas}') }],
    outils: ['boite'],
    indices: [
      { cout: 20, texte: 'ROT13 décale chaque lettre de 13 rangs. Comme l\'alphabet en compte 26, appliquer ROT13 deux fois redonne le texte de départ.' },
      { cout: 20, texte: 'Dans la boîte à outils, ajoute l\'opération « ROT13 » à la recette et colle le message en entrée.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{rot13_cache_mais_ne_protege_pas}'],
    writeup: `<h3>1. Identifier</h3><p>« Fcbvyre » ressemble à un mot de 7 lettres. ROT13 de « Spoiler » donne… « Fcbvyre ». La modératrice l'annonce d'ailleurs : c'est du <b>ROT13</b>, un César de décalage 13.</p>
<h3>2. Décoder</h3><p>ROT13 est son propre inverse (13 + 13 = 26) : on applique la même opération pour chiffrer et déchiffrer. Les chiffres (13) et les symboles ne bougent pas.</p>
${code('text', 'Recette : ROT13\nEntrée  : YHZVB{ebg13_pnpur_znvf_ar_cebgrtr_cnf}\nSortie  : LUMIO{rot13_cache_mais_ne_protege_pas}')}
<p>En ligne de commande : <code>echo 'YHZVB{…}' | tr 'A-Za-z' 'N-ZA-Mn-za-m'</code>.</p>
<p>Flag : <code>LUMIO{rot13_cache_mais_ne_protege_pas}</code></p>`,
    retenir: 'ROT13 n\'a pas de clé : il évite de lire par accident, il ne protège rien. Ne jamais l\'utiliser pour un secret.'
  },
  {
    id: 'crypto-base64', categorie: 'crypto', titre: 'Une signature bizarre', difficulte: 1, points: 100,
    accroche: 'Une ligne de lettres et de chiffres en bas d\'un e-mail, finie par un « = ».',
    briefing: `<p class="dossier">Dossier CR-03 · Boîte mail d'une association</p>
<p>Le trésorier d'une association reçoit un e-mail d'un bénévole qui termine toujours ses messages par une « signature geek ». Il te transfère le message : « Tu peux me dire ce que ça veut dire ? »</p>`,
    ressources: [{ type: 'texte', titre: 'Fin de l\'e-mail', contenu: `Merci pour la réunion de mardi, à samedi pour la braderie !\n\nYanis\n--\n${b64('LUMIO{base64_est_un_encodage}')}` }],
    outils: ['boite'],
    indices: [
      { cout: 20, texte: 'Majuscules, minuscules, chiffres, parfois + et /, et un ou deux « = » à la fin pour compléter : ce sont les signes d\'un encodage très courant.' },
      { cout: 30, texte: 'Opération « Depuis Base64 » dans la boîte à outils. En terminal : echo "…" | base64 -d' }
    ],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{base64_est_un_encodage}'],
    writeup: `<h3>1. Reconnaître le Base64</h3><p>Alphabet de 64 caractères (A–Z, a–z, 0–9, + et /), longueur multiple de 4, signe « = » de remplissage à la fin : c'est du <b>Base64</b>. Il sert à transporter des octets dans du texte (pièces jointes d'e-mails, images dans du CSS, jetons JWT).</p>
<h3>2. Décoder</h3>${code('bash', `echo "${b64('LUMIO{base64_est_un_encodage}')}" | base64 -d`)}
<p>Dans la boîte à outils : recette « Depuis Base64 ».</p>
<h3>3. Petit réflexe</h3><p>Un Base64 qui commence par <code>TFVNSU</code> correspond toujours à « LUMI… » : avec l'habitude, on reconnaît les débuts fréquents (<code>eyJ</code> = <code>{"</code> d'un JSON, typique des JWT).</p>
<p>Flag : <code>LUMIO{base64_est_un_encodage}</code></p>`,
    retenir: 'Encoder n\'est pas chiffrer : n\'importe qui décode du Base64 sans clé.'
  },
  {
    id: 'crypto-oignon', categorie: 'crypto', titre: 'L\'oignon', difficulte: 2, points: 200,
    accroche: 'Trois encodages empilés : épluche couche après couche.',
    briefing: `<p class="dossier">Dossier CR-04 · Capture d'un fichier de configuration</p>
<p>Un développeur pensait « cacher » une valeur de test en l'encodant plusieurs fois de suite. Chaque couche a une apparence différente. Retire-les dans le bon ordre.</p>`,
    ressources: [{ type: 'texte', titre: 'config.ini — ligne suspecte', contenu: 'secret_test = ' + b64(hex(b32('LUMIO{trois_couches_comme_un_oignon}'))) }],
    outils: ['boite'],
    indices: [
      { cout: 20, texte: 'La première couche finit par « = » : commence par « Depuis Base64 ». Regarde ensuite la sortie : quels caractères utilise-t-elle ?' },
      { cout: 30, texte: 'Uniquement 0-9 et a-f : de l\'hexadécimal. Puis des majuscules, des chiffres de 2 à 7 et des « = » : du Base32.' },
      { cout: 40, texte: 'Recette complète : Depuis Base64 → Depuis hexadécimal → Depuis Base32.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{trois_couches_comme_un_oignon}'],
    writeup: `<h3>1. Couche externe : Base64</h3><p>La chaîne se termine par <code>=</code> et mélange majuscules et minuscules : Base64. Le résultat ne contient que <code>0-9a-f</code>…</p>
<h3>2. Deuxième couche : hexadécimal</h3><p>Deux caractères hexadécimaux = un octet. On obtient une suite de majuscules, de chiffres 2 à 7 et de <code>=</code>.</p>
<h3>3. Couche interne : Base32</h3><p>L'alphabet Base32 (RFC 4648) n'utilise que A–Z et 2–7, avec un remplissage par <code>=</code> jusqu'à un multiple de 8 caractères.</p>
${code('text', 'Recette : Depuis Base64 → Depuis hexadécimal → Depuis Base32\nSortie  : LUMIO{trois_couches_comme_un_oignon}')}
<p>Méthode générale : à chaque étape, <b>observe l'alphabet utilisé</b> (quels caractères, quelle longueur, quel remplissage). C'est exactement la logique de la fonction « Magic » de CyberChef.</p>
<p>Flag : <code>LUMIO{trois_couches_comme_un_oignon}</code></p>`,
    retenir: 'Empiler des encodages n\'ajoute aucune sécurité : chaque couche se reconnaît à son alphabet et se retire sans clé.'
  },
  {
    id: 'crypto-morse', categorie: 'crypto', titre: 'Le journal du gardien de phare', difficulte: 1, points: 100,
    accroche: 'Des éclats courts et longs notés dans un carnet.',
    briefing: `<p class="dossier">Dossier CR-05 · Carnet retrouvé dans un phare de l'estuaire</p>
<p>Dans le carnet d'un ancien gardien de phare, une page entière note des éclats lumineux : « court », « long », et des pauses. Le gardien les a retranscrits avec des points et des traits. La dernière ligne de la page indique : <i>« flag = LUMIO{ les deux derniers mots, reliés par _ } »</i>.</p>`,
    ressources: [{ type: 'texte', titre: 'Carnet du gardien', contenu: morse('LE CODE EST PHARE CORDOUAN') }],
    outils: ['boite'],
    indices: [
      { cout: 20, texte: 'Points et traits, lettres séparées par des espaces, mots séparés par « / » : c\'est le code Morse international.' },
      { cout: 20, texte: 'Opération « Depuis Morse ». Le message contient cinq mots ; garde les deux derniers.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{mot_mot}',
    flags: ['LUMIO{phare_cordouan}'],
    writeup: `<h3>1. Reconnaître le Morse</h3><p>Deux symboles (court/long), des groupes de 1 à 4 symboles pour les lettres, un séparateur de mots : c'est le <b>code Morse</b>. E = <code>.</code>, T = <code>-</code>, S = <code>...</code>, O = <code>---</code>.</p>
<h3>2. Décoder</h3>${code('text', `Recette : Depuis Morse\nSortie  : LE CODE EST PHARE CORDOUAN`)}
<p>Le Morse n'est pas un chiffre (aucune clé) mais un <b>code</b> : une table publique de correspondance. Le phare de Cordouan, à l'embouchure de la Gironde, est d'ailleurs l'un des plus célèbres de France.</p>
<p>Flag : <code>LUMIO{phare_cordouan}</code></p>`,
    retenir: 'Un code (Morse, ASCII, Braille) est public ; un chiffre dépend d\'une clé secrète.'
  },
  {
    id: 'crypto-vigenere', categorie: 'crypto', titre: 'La clé coule sous le pont', difficulte: 2, points: 200,
    accroche: 'Un chiffre polyalphabétique… et une clé cachée dans une devinette toulousaine.',
    briefing: `<p class="dossier">Dossier CR-06 · Carte postale de Toulouse</p>
<p>Une carte postale représentant le Pont-Neuf de Toulouse est arrivée à un club d'énigmes. Au dos, un texte chiffré et une seule phrase en clair : <i>« La clé coule sous ce pont, en majuscules, sans accent. »</i></p>
<p>Le club pense à un chiffre de <b>Vigenère</b> : chaque lettre est décalée d'une valeur qui change selon la lettre de la clé.</p>`,
    ressources: [{ type: 'texte', titre: 'Dos de la carte postale', contenu: vigenere('BRAVO LE FLAG EST LUMIO{vigenere_resiste_a_cesar}', 'GARONNE') }],
    outils: ['boite'],
    indices: [
      { cout: 30, texte: 'Quel fleuve passe sous le Pont-Neuf de Toulouse ? C\'est la clé.' },
      { cout: 30, texte: 'Opération « Vigenère : déchiffrer » avec la clé GARONNE. Les espaces et symboles ne consomment pas de lettre de clé.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{vigenere_resiste_a_cesar}'],
    writeup: `<h3>1. Trouver la clé</h3><p>Le Pont-Neuf de Toulouse enjambe la <b>Garonne</b>. Clé : <code>GARONNE</code>.</p>
<h3>2. Comprendre Vigenère</h3><p>Chaque lettre de la clé donne un décalage (A = 0, B = 1… G = 6, R = 17…). On répète la clé sur toute la longueur du message : la 1<sup>re</sup> lettre est décalée de 6 (G), la 2<sup>e</sup> de 0 (A), la 3<sup>e</sup> de 17 (R)… Une même lettre claire peut donc donner des lettres chiffrées différentes : l'analyse de fréquences directe ne marche plus, d'où la réputation de « chiffre indéchiffrable » au XVI<sup>e</sup> siècle.</p>
${code('text', 'Recette : Vigenère : déchiffrer (clé GARONNE)\nSortie  : BRAVO LE FLAG EST LUMIO{vigenere_resiste_a_cesar}')}
<h3>3. Sans la clé ?</h3><p>Babbage puis Kasiski (XIX<sup>e</sup> siècle) ont montré comment le casser : on cherche des répétitions pour deviner la <b>longueur</b> de la clé, puis on fait une analyse de fréquences sur chaque « colonne ».</p>
<p>Flag : <code>LUMIO{vigenere_resiste_a_cesar}</code></p>`,
    retenir: 'Vigenère résiste à la force brute naïve et aux fréquences simples, mais une clé courte et répétée finit toujours par trahir le message.'
  },
  {
    id: 'crypto-xor', categorie: 'crypto', titre: 'Un seul octet de clé', difficulte: 3, points: 300,
    accroche: 'Des octets XORés avec une clé d\'un octet. Tu connais le début du message…',
    briefing: `<p class="dossier">Dossier CR-07 · Analyse d'un petit programme</p>
<p>Un programme de démonstration « chiffre » ses messages avec l'opération <b>XOR</b> et une clé d'un seul octet (une valeur entre 1 et 255). Tu as récupéré un message chiffré en hexadécimal. Tu sais une chose : comme tous les flags de l'arène, il commence par <code>LUMIO{</code>.</p>`,
    ressources: [{ type: 'texte', titre: 'Message chiffré (hexadécimal)', contenu: xorHex('LUMIO{xor_et_texte_connu}', 0x5c) }],
    outils: ['boite'],
    indices: [
      { cout: 30, texte: 'Propriété clé du XOR : si chiffré = clair ⊕ clé, alors clé = chiffré ⊕ clair. Le premier octet chiffré vaut 0x10 et la lettre claire « L » vaut 0x4c.' },
      { cout: 40, texte: '0x10 ⊕ 0x4c = 0x5c. Recette : Depuis hexadécimal → XOR avec la clé 5c (format hexadécimal). Ou : « XOR : tester les 255 clés » en filtrant sur LUMIO.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{xor_et_texte_connu}'],
    writeup: `<h3>1. Le XOR en deux mots</h3><p>Le « ou exclusif » compare deux bits : 1 s'ils diffèrent, 0 sinon. Il est réversible : <code>(m ⊕ k) ⊕ k = m</code>. Il est au cœur de nombreux chiffrements… à condition que la clé soit longue, aléatoire et jamais réutilisée.</p>
<h3>2. Attaque à clair connu</h3><p>On connaît le premier caractère du message : « L » = <code>0x4c</code>. Le premier octet chiffré est <code>0x10</code>. Donc <code>clé = 0x10 ⊕ 0x4c = 0x5c</code>. On vérifie sur le 2<sup>e</sup> octet : <code>0x09 ⊕ 0x5c = 0x55</code> = « U ». Bingo.</p>
${code('text', 'Recette : Depuis hexadécimal → XOR (clé 5c, format hexadécimal)\nSortie  : LUMIO{xor_et_texte_connu}')}
<h3>3. Variante force brute</h3><p>Avec une clé d'un octet, il n'y a que 255 essais : l'opération « XOR : tester les 255 clés » affiche les résultats lisibles. Filtrer sur « LUMIO » ne laisse qu'une ligne.</p>
<p>Flag : <code>LUMIO{xor_et_texte_connu}</code></p>`,
    retenir: 'Un XOR avec une clé courte et répétée tombe face à une attaque à texte clair connu. Un format prévisible (en-tête de fichier, « LUMIO{ », « Bonjour ») suffit à retrouver la clé.'
  },
  {
    id: 'crypto-substitution', categorie: 'crypto', titre: 'Le savant de Bagdad', difficulte: 3, points: 300,
    accroche: 'Une substitution complète : 26 lettres mélangées. Compte, devine, vérifie.',
    briefing: `<p class="dossier">Dossier CR-08 · Défi d'un professeur d'histoire des sciences</p>
<p>Chaque lettre du texte ci-dessous a été remplacée par une autre lettre, toujours la même (une <b>substitution monoalphabétique</b>). Il y a plus de 400 milliards de milliards de clés possibles : la force brute est exclue. Mais le texte est en français… et il est assez long pour une <b>analyse de fréquences</b>.</p>
<p>Le mot de passe donné à la fin du texte est le flag : <code>LUMIO{motdepasse}</code>.</p>`,
    ressources: [{ type: 'texte', titre: 'Texte chiffré', contenu: substitution(SUBST_CLAIR, SUBST_CLE) }],
    outils: ['boite'],
    indices: [
      { cout: 30, texte: 'Opération « Analyse de fréquences » : la lettre la plus fréquente est très probablement E, puis A, S, I, N, T. Les mots d\'une lettre isolée sont souvent « A ».' },
      { cout: 40, texte: 'Utilise « Substitution de lettres » : dans « Lettres du chiffré » mets les lettres chiffrées que tu as identifiées, et dans « Remplacées par » leurs équivalents clairs, dans le même ordre. Les mots de deux lettres (LE, LA, DE) et « EST » valident tes hypothèses.' },
      { cout: 60, texte: 'B → E, X → A, O → L, Q → D, J → S, I → T. Le dernier mot du texte est le nom d\'un savant cité au début.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{motdepasse}',
    flags: ['LUMIO{kindi}', 'LUMIO{al_kindi}', 'LUMIO{alkindi}'],
    writeup: `<h3>1. Compter</h3><p>L'analyse de fréquences donne en tête <code>B</code> (53 fois), puis <code>J</code>, <code>X</code>, <code>I</code>, <code>O</code>… En français, l'ordre habituel est <b>E A S I N T R U L O D</b>. Hypothèse : B = E.</p>
<h3>2. Les petits mots</h3><p>Le mot isolé d'une lettre « <code>X</code> » est sûrement « A ». Les mots de deux lettres <code>OX</code>, <code>OB</code>, <code>QB</code> deviennent « LA », « LE », « DE » si O = L et Q = D. Le mot <code>BJI</code> qui revient souvent : « EST » (J = S, I = T).</p>
<h3>3. Propager</h3><p>Chaque nouvelle lettre révèle des mots partiels (« FR_QUENCES », « S_ECLE ») qui se complètent d'eux-mêmes. En une dizaine d'hypothèses, tout le texte apparaît :</p>
<blockquote>${SUBST_CLAIR}</blockquote>
<p>Al-Kindi, savant de Bagdad au IX<sup>e</sup> siècle, a décrit le premier cette méthode dans son « Manuscrit sur le déchiffrement des messages cryptographiques ».</p>
<p>Flag : <code>LUMIO{kindi}</code> (<code>LUMIO{al_kindi}</code> est aussi accepté).</p>`,
    retenir: 'Une substitution ne cache pas les fréquences des lettres : sur un texte assez long, la langue trahit la clé. C\'est pourquoi les chiffrements modernes mélangent aussi la position (diffusion).'
  }
];
