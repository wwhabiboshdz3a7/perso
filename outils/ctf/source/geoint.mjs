// Défis de géolocalisation (GEOINT) sur des scènes illustrées (outils/ctf/scenes/geoint.mjs).
// Les coordonnées ne sont exactes que pour des lieux très connus.
const IMG = 'assets/ctf/scenes/';
const scene = (n, alt, legende = '') => ({ type: 'scene', titre: 'Image à géolocaliser', src: IMG + n, alt, outils: ['image'], legende });
const FRANCE = [46.6, 2.4, 5], MONDE = [28, 8, 2];
const loin = { lat: -38.5, lon: 145 }; // faux repère pour les tests : Australie

export default [
  {
    id: 'geo-capitole', categorie: 'geoint', titre: 'La place aux huit colonnes', difficulte: 1, points: 100,
    accroche: 'Premier défi de géolocalisation : lire ce que la ville écrit pour toi.',
    briefing: `<p class="dossier">Dossier GE-01 · Carte postale sans légende</p>
<p>Une amie t'envoie cette image : « Devine où je suis ! » Pas de légende, pas de métadonnées. Réflexe n° 1 en géolocalisation : <b>lire tout le texte visible</b> (plaques, enseignes, panneaux), puis le confirmer avec l'architecture.</p>
<p>Place ton repère sur la carte, au plus près de l'endroit photographié.</p>`,
    ressources: [scene('geo-capitole.jpg', 'Grande place dallée devant un long bâtiment de brique rose et de pierre blanche ; au centre, huit colonnes de marbre rose et trois drapeaux (France, Europe, drapeau rouge à croix jaune). Au sol, une grande croix de bronze à douze pommeaux dans un cercle. À gauche, une plaque de rue bleue : « Place du Capitole » et, en dessous, « Plaça del Capitòli ». À droite, un totem de métro rouge « M Capitole, ligne A » et la terrasse du « Café des Capitouls », téléphone 05 36 49 12 34.')],
    outils: ['image'],
    indices: [{ cout: 15, texte: 'La plaque de rue est bilingue : français en haut, occitan en dessous. Les plaques bilingues français-occitan sont une signature de Toulouse.' }, { cout: 25, texte: 'Le Capitole est l\'hôtel de ville de Toulouse ; la place se trouve en plein centre, à côté de la station de métro du même nom.' }],
    validation: 'carte', vue: FRANCE,
    cible: { lieu: 'Place du Capitole, Toulouse', points: [{ lat: 43.6044, lon: 1.4436 }], anneaux: [{ r: 250, part: 1 }, { r: 2000, part: 0.5 }, { r: 30000, part: 0 }], faux: loin },
    writeup: `<h3>1. Lire le texte</h3><p>La plaque de rue indique « <b>Place du Capitole</b> », et sa seconde ligne « Plaça del Capitòli » est en <b>occitan</b>. Toulouse a généralisé ces plaques bilingues dans son centre historique. Le totem de métro confirme : station <b>Capitole</b>, ligne A.</p>
<h3>2. Confirmer avec l'architecture</h3><ul><li><b>Brique rose et pierre blanche</b> : la « ville rose ».</li><li>Les <b>huit colonnes de marbre rose</b> de la façade évoquent les huit capitouls, les magistrats qui administraient la ville.</li><li>Le drapeau rouge à <b>croix occitane</b> jaune et, au sol, la grande croix occitane de bronze entourée des signes du zodiaque (œuvre de Raymond Moretti).</li><li>Le numéro de téléphone commence par <b>05</b> : le quart sud-ouest de la France.</li></ul>
<h3>3. Placer</h3><p>On ouvre la carte sur Toulouse, on zoome sur le centre : la place du Capitole est le grand rectangle face à l'hôtel de ville. Une vue satellite ou Mapillary permet de vérifier l'angle de vue.</p>`,
    retenir: 'Toujours commencer par le texte visible (plaques, enseignes, téléphones), puis confirmer par au moins deux indices indépendants (architecture, drapeaux, transports).'
  },
  {
    id: 'geo-pont-neuf', categorie: 'geoint', titre: 'Coucher de soleil sur le fleuve', difficulte: 2, points: 200,
    accroche: 'Un pont de brique, un dôme vert-de-gris et le soleil qui se couche derrière : d\'où regarde-t-on ?',
    briefing: `<p class="dossier">Dossier GE-02 · Le fond d'écran</p>
<p>Cette image tourne comme fond d'écran sur les réseaux, sans source. Retrouve le lieu : <b>place ton repère sur le pont</b> (ou sur la rive d'où la photo a été prise).</p>
<p>Pense aux <b>détails de construction</b> (forme des arches, ouvertures dans les piles), au monument du fond, et à la <b>direction du soleil couchant</b>.</p>`,
    ressources: [scene('geo-pont-neuf.jpg', 'Au coucher du soleil, un long pont de brique à arches inégales, percé d\'ouvertures rondes au-dessus des piles, traverse un large fleuve. Derrière, sur l\'autre rive, un grand bâtiment de brique surmonté d\'un dôme vert-de-gris à lanterne. Au premier plan à droite, un quai de brique avec deux promeneurs et une borne « VélôToulouse ».')],
    outils: ['image'],
    indices: [{ cout: 30, texte: 'Les ouvertures rondes au-dessus des piles s\'appellent des « dégueuloirs » : elles laissent passer l\'eau pendant les crues. « VélôToulouse » est le vélo en libre-service de… Toulouse.' }, { cout: 40, texte: 'Le fleuve est la Garonne. Le dôme est celui de l\'hôpital de La Grave, sur la rive gauche ; le pont est le plus ancien de la ville malgré son nom.' }],
    validation: 'carte', vue: FRANCE,
    cible: { lieu: 'Pont-Neuf, dôme de La Grave et quai de la Daurade, Toulouse', points: [{ lat: 43.5997, lon: 1.4372 }, { lat: 43.6003, lon: 1.4338 }, { lat: 43.6012, lon: 1.4392 }], anneaux: [{ r: 300, part: 1 }, { r: 2500, part: 0.5 }, { r: 30000, part: 0 }], faux: loin },
    writeup: `<h3>1. Le pont</h3><p>Brique rose, <b>arches de tailles inégales</b>, et surtout des ouvertures circulaires au-dessus des piles : les <b>dégueuloirs</b>, qui soulagent le pont lors des crues. C'est le <b>Pont-Neuf de Toulouse</b>, achevé au XVII<sup>e</sup> siècle : le plus vieux pont de la ville malgré son nom.</p>
<h3>2. Le dôme</h3><p>Le dôme vert-de-gris (cuivre oxydé) est celui de la chapelle de l'<b>hôpital de La Grave</b>, sur la rive gauche de la Garonne. La borne « VélôToulouse » confirme la ville.</p>
<h3>3. Le soleil donne l'orientation</h3><p>Le soleil se couche à l'<b>ouest</b> (nord-ouest en été). Il est derrière le dôme : le photographe regarde donc vers l'ouest, depuis la <b>rive droite</b>, sur le quai de la Daurade, avec le Pont-Neuf sur sa gauche. C'est l'un des points de vue les plus photographiés de Toulouse au coucher du soleil.</p>`,
    retenir: 'Le soleil levant ou couchant donne une direction (est ou ouest) : avec un monument identifié, on en déduit d\'où regarde le photographe.'
  },
  {
    id: 'geo-cite-espace', categorie: 'geoint', titre: 'Une fusée sur le parking', difficulte: 2, points: 200,
    accroche: 'Une fusée Ariane grandeur nature… mais pas en Guyane.',
    briefing: `<p class="dossier">Dossier GE-03 · Sortie scolaire</p>
<p>Un enseignant publie cette photo de sortie scolaire : « Devinez où nous sommes allés ! » Une fusée Ariane 5 se dresse au-dessus d'un parking. Les vraies fusées décollent de Kourou, en Guyane… mais plusieurs <b>répliques</b> existent en Europe.</p>
<p>Utilise les <b>plaques d'immatriculation</b>, la <b>plaque de rue</b> et les bâtiments pour trancher, puis place ton repère.</p>`,
    ressources: [scene('geo-cite-espace.jpg', 'Une réplique de fusée Ariane 5 (inscriptions « ARIANE 5 » et « ESA ») domine un parking. À gauche, une maquette de station spatiale aux panneaux solaires bleus ; à droite, un dôme gris (planétarium) et un bâtiment vitré. Quatre voitures vues de l\'arrière ont des plaques françaises avec le numéro 31 et un logo rouge et jaune à droite. Une plaque de rue bleue indique « Avenue Jean Gonord » puis « Avenguda Jean Gonord ».')],
    outils: ['image'],
    indices: [{ cout: 30, texte: 'Sur une plaque française, le numéro à droite est un département (31 = Haute-Garonne) et le logo celui de la région. La seconde ligne de la plaque de rue est en occitan.' }, { cout: 40, texte: 'Un parc à thème consacré à l\'espace, avec une Ariane 5 grandeur nature, une station Mir et un planétarium, se trouve dans l\'est de Toulouse.' }],
    validation: 'carte', vue: FRANCE,
    cible: { lieu: 'Cité de l\'espace, avenue Jean Gonord, Toulouse', points: [{ lat: 43.5866, lon: 1.4932 }], anneaux: [{ r: 450, part: 1 }, { r: 4000, part: 0.5 }, { r: 40000, part: 0 }], faux: loin },
    writeup: `<h3>1. Éliminer les fausses pistes</h3><p>Une Ariane 5 en vrai serait à Kourou (Guyane) : végétation tropicale, pas de parking de ville. Des répliques existent notamment au Bourget (musée de l'Air et de l'Espace) et à la <b>Cité de l'espace</b> de Toulouse.</p>
<h3>2. Les plaques</h3><p>Plaques françaises (bande bleue européenne « F » à gauche) avec, à droite, le <b>31</b> (Haute-Garonne) et le logo de la région Occitanie. Attention : depuis 2009, ce numéro est <b>choisi</b> par le propriétaire et n'est donc qu'un indice, pas une preuve. Mais quatre voitures sur quatre en 31, c'est parlant.</p>
<h3>3. La plaque de rue et les bâtiments</h3><p>« Avenue Jean Gonord / Avenguda Jean Gonord » : nom de rue bilingue français-occitan (Toulouse), et c'est l'adresse de la Cité de l'espace. La station Mir et le planétarium complètent le tableau. La Cité se trouve dans l'est de Toulouse, près de la rocade.</p>`,
    retenir: 'Un objet célèbre peut avoir des copies : on vérifie avec des indices locaux (plaques, langue, nom de rue) avant de conclure.'
  },
  {
    id: 'geo-abbesses', categorie: 'geoint', titre: 'Je t\'aime en 250 langues', difficulte: 1, points: 150,
    accroche: 'Une bouche de métro Art nouveau, un mur couvert de déclarations… et une plaque qui dit tout.',
    briefing: `<p class="dossier">Dossier GE-04 · Week-end en amoureux</p>
<p>Ton cousin a posté cette photo de son week-end. Il veut voir si tu trouves l'endroit exact. Regarde la <b>plaque de rue</b> (le style des plaques est propre à chaque ville), l'entrée du métro et le mur de gauche.</p>`,
    ressources: [scene('geo-abbesses.jpg', 'À gauche, dans un square, un mur de carreaux bleu foncé couvert de « je t\'aime » écrits en de nombreuses langues et alphabets. Au centre, une entrée de métro en fonte verte de style Art nouveau, avec une verrière en éventail, deux lampes orangées et l\'enseigne « METROPOLITAIN ». Derrière, un immeuble haussmannien en pierre de taille avec balcons filants et une boulangerie-pâtisserie. À droite, une plaque de rue en émail bleu à cadre vert : « 18e Arrt — Square Jehan Rictus ».')],
    outils: ['image'],
    indices: [{ cout: 20, texte: 'Plaque bleue à cadre vert avec l\'arrondissement en haut : c\'est le modèle parisien. Le 18e arrondissement, c\'est Montmartre.' }, { cout: 30, texte: 'Le « mur des je t\'aime » est dans le square Jehan-Rictus, place des Abbesses ; la bouche de métro à verrière est celle de la station Abbesses (ligne 12).' }],
    validation: 'carte', vue: FRANCE,
    cible: { lieu: 'Place des Abbesses et square Jehan-Rictus, Paris 18e', points: [{ lat: 48.8844, lon: 2.3386 }], anneaux: [{ r: 200, part: 1 }, { r: 1500, part: 0.5 }, { r: 20000, part: 0 }], faux: loin },
    writeup: `<h3>1. La plaque de rue</h3><p>Émail <b>bleu</b>, cadre <b>vert</b>, numéro d'<b>arrondissement</b> en haut : c'est la plaque parisienne typique. Elle indique le <b>18<sup>e</sup></b> et le <b>square Jehan-Rictus</b>.</p>
<h3>2. Le métro</h3><p>Les entrées de métro en fonte verte d'Hector Guimard (vers 1900) sont nombreuses à Paris, mais les « <b>édicules</b> » couverts d'une verrière ne sont plus que deux : <b>Abbesses</b> et Porte-Dauphine.</p>
<h3>3. Le mur</h3><p>Le <b>mur des je t'aime</b> (Frédéric Baron et Claire Kito, 2000) : des carreaux de lave émaillée où « je t'aime » est écrit dans plus de 250 langues. Il est dans le square Jehan-Rictus, sur la <b>place des Abbesses</b>, au pied de Montmartre.</p>`,
    retenir: 'Le style des plaques de rue (couleur, cadre, mentions) identifie souvent la ville, parfois le quartier.'
  },
  {
    id: 'geo-carcassonne', categorie: 'geoint', titre: 'Château de conte de fées', difficulte: 2, points: 200,
    accroche: 'Des remparts, des tours pointues, des vignes et une borne à tête jaune.',
    briefing: `<p class="dossier">Dossier GE-05 · Road trip</p>
<p>Photo prise depuis la voiture lors d'un road trip dans le sud de la France. Repère la <b>double muraille</b>, la <b>borne kilométrique</b> au bord de la route et les <b>plaques</b> des voitures, puis place ton repère sur la cité fortifiée.</p>`,
    ressources: [scene('geo-carcassonne.jpg', 'Une route traverse des vignes vers une cité fortifiée : deux enceintes de remparts crénelés en pierre ocre, de nombreuses tours coiffées de toits pointus en ardoise, une grande porte en arc. Cyprès. Une voiture blanche vue de l\'arrière porte une plaque française avec le numéro 11 ; une voiture rouge arrive en face. Au bord de la route, une borne blanche à tête jaune « D 118 ». Deux panneaux : blanc « ← La Cité » et marron « Cité médiévale — UNESCO ».')],
    outils: ['image'],
    indices: [{ cout: 30, texte: 'Une borne à tête jaune signale une route départementale (rouge : nationale). Le numéro 11 sur la plaque correspond à l\'Aude.' }, { cout: 40, texte: 'La plus célèbre cité médiévale à double enceinte de France, restaurée par Viollet-le-Duc, est dans l\'Aude.' }],
    validation: 'carte', vue: FRANCE,
    cible: { lieu: 'Cité de Carcassonne (Aude)', points: [{ lat: 43.2063, lon: 2.3637 }], anneaux: [{ r: 700, part: 1 }, { r: 6000, part: 0.5 }, { r: 60000, part: 0 }], faux: loin },
    writeup: `<h3>1. La silhouette</h3><p>Deux enceintes concentriques, une cinquantaine de tours, des toits d'<b>ardoise pointus</b> : c'est la <b>Cité de Carcassonne</b>, restaurée au XIX<sup>e</sup> siècle par Viollet-le-Duc (ces toits « du Nord » font d'ailleurs débat : la région utilise plutôt la tuile). Inscrite à l'UNESCO depuis 1997.</p>
<h3>2. La route</h3><p>Borne à <b>tête jaune</b> : route <b>départementale</b> (« D »). Plaque avec le <b>11</b> : Aude. Panneaux français, vignes et cyprès : Languedoc.</p>
<h3>3. Placer</h3><p>La Cité domine la ville basse de Carcassonne, sur la rive droite de l'Aude.</p>`,
    retenir: 'Les bornes kilométriques françaises codent le type de route par la couleur de leur tête : rouge (nationale), jaune (départementale), blanche ou verte (communale ou autre).'
  },
  {
    id: 'geo-alger', categorie: 'geoint', titre: 'Trois palmes au-dessus de la baie', difficulte: 2, points: 200,
    accroche: 'Un monument immense, deux alphabets et une plaque qui finit par 16.',
    briefing: `<p class="dossier">Dossier GE-06 · Souvenirs de vacances</p>
<p>Une photo retrouvée dans l'album d'une famille, sans légende. Identifie le <b>monument</b>, appuie-toi sur la <b>langue</b> et l'<b>alphabet</b> des panneaux, le format de la <b>plaque</b>, le domaine du site web et l'indicatif téléphonique, puis place ton repère.</p>`,
    ressources: [scene('geo-alger.jpg', 'Un immense monument de béton formé de trois palmes stylisées qui se rejoignent au sommet, avec une statue de bronze au pied de chaque palme et une flamme au centre. Derrière, une baie et une ville blanche au bord de la mer ; palmiers. Un panneau bleu en arabe « رياض الفتح » et en français « Riadh El Feth ». Une affiche bilingue « Musée central de l\'Armée », « +213 21 00 00 00 · musee.dz ». Une voiture vue de l\'arrière a une plaque blanche « 04217 118 16 ».')],
    outils: ['image'],
    indices: [{ cout: 30, texte: 'Arabe et français sur les panneaux, indicatif +213, domaine .dz : Algérie. Sur une plaque algérienne, les deux derniers chiffres indiquent la wilaya (16 = Alger).' }, { cout: 40, texte: 'Le Mémorial du Martyr (Maqam Echahid) domine la baie d\'Alger depuis la colline de Riadh El Feth, dans la commune d\'El Madania.' }],
    validation: 'carte', vue: MONDE,
    cible: { lieu: 'Maqam Echahid (Mémorial du Martyr), Riadh El Feth, Alger', points: [{ lat: 36.7456, lon: 3.0697 }], anneaux: [{ r: 600, part: 1 }, { r: 5000, part: 0.5 }, { r: 80000, part: 0 }], faux: loin },
    writeup: `<h3>1. Le pays</h3><p>Panneau en <b>arabe</b> et en <b>français</b>, indicatif <b>+213</b>, site en <b>.dz</b> : Algérie. La plaque suit le format algérien : <code>04217</code> (numéro d'ordre), <code>118</code> (catégorie 1 = voiture particulière, 18 = année 2018), <code>16</code> (<b>wilaya d'Alger</b>).</p>
<h3>2. Le monument</h3><p>Trois palmes de béton de 92 m réunies au sommet, une statue de soldat au pied de chacune, une flamme éternelle : c'est le <b>Maqam Echahid</b> (Mémorial du Martyr), inauguré en 1982 pour les vingt ans de l'indépendance. Il domine la baie depuis la colline de <b>Riadh El Feth</b>, où se trouve aussi le Musée central de l'Armée.</p>
<h3>3. Placer</h3><p>Sur la carte, au sud-est du centre d'Alger, sur les hauteurs d'El Madania, face à la baie.</p>`,
    retenir: 'Langue + alphabet + indicatif + domaine donnent le pays en quelques secondes ; le format des plaques peut même donner la région.'
  },
  {
    id: 'geo-kabylie', categorie: 'geoint', titre: 'Trois écritures sur un panneau', difficulte: 3, points: 300,
    accroche: 'Arabe, latin… et un troisième alphabet aux lettres géométriques. Plus tu es précis, plus tu gagnes.',
    briefing: `<p class="dossier">Dossier GE-07 · Sur la route nationale</p>
<p>Photo prise depuis une voiture. Aucun monument célèbre ici : il faut raisonner avec la <b>signalisation</b>, les <b>alphabets</b>, les <b>plaques</b>, le <b>relief</b> et la <b>végétation</b>. Place ton repère là où la photo a été prise : les points dépendent de la distance (pleins points à moins de 25 km).</p>`,
    ressources: [scene('geo-kabylie.jpg', 'Une route nationale traverse des collines verdoyantes plantées d\'oliviers ; des villages aux toits de tuiles rouges sont perchés sur les crêtes ; au fond, une chaîne de montagnes aux sommets enneigés. Les voitures roulent à droite. Une voiture vue de l\'arrière a une plaque « 18342 114 15 », une autre en face « 00561 109 16 ». Un panneau vert indique en arabe « تيزي وزو », en tifinagh « ⵜⵉⵣⵉ ⵡⴻⵣⵣⵓ » et en latin « Tizi Ouzou », 12 km, avec un cartouche « RN 12 ». Une échoppe vend de l\'huile d\'olive (« زيت الزيتون · Huile d\'olive », 0550 00 00 00, zitouna-kabylie.dz).')],
    outils: ['image'],
    indices: [{ cout: 40, texte: 'Le troisième alphabet est le tifinagh, utilisé pour écrire le tamazight (berbère). Il est surtout présent sur les panneaux de Kabylie.' }, { cout: 50, texte: 'La wilaya 15 est celle de Tizi Ouzou. Le panneau annonce la ville à 12 km.' }],
    validation: 'carte', vue: MONDE,
    cible: { lieu: 'Route nationale 12, à une douzaine de kilomètres de Tizi Ouzou (Kabylie)', points: [{ lat: 36.7169, lon: 4.0497 }], anneaux: [{ r: 25000, part: 1 }, { r: 120000, part: 0.6 }, { r: 600000, part: 0.25 }], faux: loin },
    writeup: `<h3>1. Les alphabets</h3><p>Arabe, latin et <b>tifinagh</b> (les lettres géométriques <code>ⵜⵉⵣⵉ ⵡⴻⵣⵣⵓ</code>, « Tizi Wezzu »). Le tamazight est langue officielle en Algérie depuis 2016 et le tifinagh se voit surtout en <b>Kabylie</b>.</p>
<h3>2. Les plaques</h3><p>Format algérien. La voiture locale finit par <b>15</b> : wilaya de <b>Tizi Ouzou</b> ; celle d'en face par 16 (Alger), logique sur l'axe Alger–Tizi Ouzou.</p>
<h3>3. Paysage et signalisation</h3><p>Oliviers et huile d'olive (produit phare de la région), villages perchés sur les crêtes, massif enneigé du <b>Djurdjura</b> au fond. Le panneau annonce Tizi Ouzou à <b>12 km</b> sur la <b>RN 12</b>, la route qui relie Alger à Tizi Ouzou puis Béjaïa : on est à l'ouest de la ville, vers Draâ Ben Khedda.</p>
<h3>Le score selon la distance</h3><p>Un repère n'importe où à moins de 25 km de Tizi Ouzou donne tous les points ; en Kabylie élargie, 60 % ; en Algérie du Nord, 25 %.</p>`,
    retenir: 'Sans monument, on combine des indices faibles (alphabet, plaques, végétation, relief, distance sur un panneau) jusqu\'à une zone précise.'
  },
  {
    id: 'geo-le-cap', categorie: 'geoint', titre: 'Le soleil est au nord', difficulte: 2, points: 250,
    accroche: 'Une montagne au sommet tout plat, des voitures à gauche et une horloge qui indique midi passé.',
    briefing: `<p class="dossier">Dossier GE-08 · Escale</p>
<p>Un ami en tour du monde t'envoie cette photo prise à <b>12 h 41</b> (heure locale). Observe le <b>sens de circulation</b>, la <b>direction des ombres</b> par rapport au soleil de midi, les langues des panneaux, puis place ton repère sur la ville. Pleins points à moins de 8 km.</p>`,
    ressources: [scene('geo-le-cap.jpg', 'Une avenue mène vers une grande montagne au sommet parfaitement plat, recouvert d\'une nappe de nuages blancs, entre un pic à gauche et un sommet pointu à droite. Les voitures qui s\'éloignent roulent sur la voie de GAUCHE ; celles qui arrivent sont à droite. Une voiture rouge a une plaque jaune pâle « CA 418-206 — WESTERN CAPE ». Les ombres des piétons et des lampadaires partent vers la montagne, à l\'opposé du photographe. Une horloge affiche 12:41. Panneaux : « MyCiTi — Civic Centre · Stadsentrum », « BILTONG 021 555 0142 », « braai-shop.co.za ». Palmiers.')],
    outils: ['image'],
    indices: [{ cout: 30, texte: 'À midi, le soleil est au sud dans l\'hémisphère nord… et au nord dans l\'hémisphère sud. Ici, les ombres s\'éloignent du photographe vers la montagne.' }, { cout: 40, texte: 'Circulation à gauche, anglais et afrikaans (« Stadsentrum »), domaine .co.za : Afrique du Sud. La montagne au sommet plat est célèbre.' }],
    validation: 'carte', vue: MONDE,
    cible: { lieu: 'Le Cap (Cape Town), Afrique du Sud, au pied de Table Mountain', points: [{ lat: -33.9249, lon: 18.4241 }], anneaux: [{ r: 8000, part: 1 }, { r: 60000, part: 0.6 }, { r: 1500000, part: 0.2 }], faux: { lat: 48.85, lon: 2.35 } },
    writeup: `<h3>1. L'hémisphère grâce aux ombres</h3><p>Il est 12 h 41 : le soleil est près de son point le plus haut. Les ombres partent <b>vers la montagne</b>, donc le soleil est dans le dos du photographe. Comme on va le voir, il regarde vers le <b>sud</b> : le soleil de midi est au <b>nord</b>. C'est la signature de l'<b>hémisphère sud</b> (au-delà du tropique du Capricorne).</p>
<h3>2. Circulation et langues</h3><p>On roule à <b>gauche</b> (Royaume-Uni, Irlande, Japon, Inde, Australie, Afrique australe…). Les panneaux mêlent anglais et <b>afrikaans</b> (« Stadsentrum » = centre-ville), le domaine est en <b>.co.za</b> : <b>Afrique du Sud</b>. Biltong et braai confirment.</p>
<h3>3. La ville</h3><p>La montagne au sommet plat coiffée d'une « nappe » de nuages est <b>Table Mountain</b>, avec Devil's Peak à gauche et Lion's Head à droite : <b>Le Cap</b>. Les plaques « CA » sont celles du Cap, MyCiTi est son réseau de bus rapides, et l'indicatif 021 celui de la ville. Depuis le centre, la montagne est au sud : cohérent avec les ombres.</p>`,
    retenir: 'Ombres + heure = hémisphère (et souvent la direction). Pour vérifier un calcul précis, on utilise SunCalc ou un calcul d\'azimut solaire.'
  },
  {
    id: 'geo-montreal', categorie: 'geoint', titre: 'ARRÊT', difficulte: 3, points: 300,
    accroche: 'Un panneau stop… écrit en français. Il n\'y a qu\'un endroit au monde où c\'est la norme.',
    briefing: `<p class="dossier">Dossier GE-09 · Échange universitaire</p>
<p>Une étudiante en échange publie cette photo de « sa rue ». Le panneau stop dit « ARRÊT », les feuilles sont rouges, les escaliers extérieurs étonnent. Retrouve la ville <b>et le quartier</b> : pleins points à moins de 2,5 km.</p>`,
    ressources: [scene('geo-montreal.jpg', 'Rangée d\'immeubles de brique rouge de trois étages avec balcons en fer et escaliers extérieurs métalliques en courbe qui montent du trottoir aux balcons. Un panneau octogonal rouge « ARRÊT » sous une plaque bleue « Rue Rachel E ». À gauche, un rond bleu avec une flèche blanche vers le bas et l\'inscription « MÉTRO ». Une enseigne verte « DÉPANNEUR — Bière · Vin · Loto — 514 555-0123 ». Une voiture vue de l\'arrière porte une plaque « QUÉBEC F47 KRB — Je me souviens ». Érables aux feuilles rouges et orange.')],
    outils: ['image'],
    indices: [{ cout: 40, texte: 'Le panneau « ARRÊT » (au lieu de STOP) et la devise « Je me souviens » sont propres au Québec. L\'indicatif 514 est celui de l\'île de Montréal.' }, { cout: 50, texte: 'Les escaliers extérieurs des « plex » et la rue Rachel (avec « E » pour Est, par rapport au boulevard Saint-Laurent) mènent au Plateau-Mont-Royal.' }],
    validation: 'carte', vue: MONDE,
    cible: { lieu: 'Plateau-Mont-Royal, Montréal (rue Rachel Est)', points: [{ lat: 45.5240, lon: -73.5790 }], anneaux: [{ r: 2500, part: 1 }, { r: 30000, part: 0.6 }, { r: 800000, part: 0.2 }], faux: loin },
    writeup: `<h3>1. Le Québec</h3><p>Le panneau stop dit « <b>ARRÊT</b> » : c'est la norme au Québec (en France, on écrit STOP). La plaque « Québec — <b>Je me souviens</b> » est uniquement à l'arrière (pas de plaque avant au Québec). « <b>Dépanneur</b> » est le mot québécois pour une petite épicerie.</p>
<h3>2. Montréal</h3><p>L'indicatif <b>514</b> est celui de Montréal, et le rond bleu à flèche blanche vers le bas est le logo du <b>métro de Montréal</b>.</p>
<h3>3. Le quartier</h3><p>Les « plex » de brique avec <b>escaliers extérieurs</b> en fer forgé sont la signature du <b>Plateau-Mont-Royal</b> (et de quartiers voisins). La plaque « <b>Rue Rachel E</b> » le confirme : les rues est-ouest de Montréal sont divisées en Est et Ouest par le boulevard Saint-Laurent, et la rue Rachel Est traverse le Plateau.</p>`,
    retenir: 'Une variante locale de la signalisation (ARRÊT au Québec, panneaux bilingues, couleurs des plaques) suffit souvent à trouver la région.'
  },
  {
    id: 'geo-cadran', categorie: 'geoint', titre: 'L\'heure du cadran', difficulte: 3, points: 300,
    accroche: 'Un cadran solaire donne l\'heure solaire. Ta montre, elle, donne l\'heure légale. Quelle heure affichait-elle ?',
    briefing: `<p class="dossier">Dossier GE-10 · Alibi à vérifier</p>
<p>Un témoin affirme avoir pris cette photo « vers 13 h ». Le cadran solaire, lui, ne ment pas : lis l'<b>heure solaire</b> qu'il indique, repère le <b>lieu</b> et la <b>date</b>, puis convertis en <b>heure légale</b> (celle des montres).</p>
<p>Le cadran est vertical et orienté plein sud : les heures du matin sont à gauche, celles de l'après-midi à droite (XII = midi solaire).</p>`,
    ressources: [scene('geo-cadran.jpg', 'Un cadran solaire vertical peint sur un mur de brique rose : lignes horaires en chiffres romains de VI à XII puis de I à VI ; l\'ombre du style tombe exactement sur la ligne II, à droite de XII. Devise « L\'heure passe, l\'amitié reste » et date MDCCCXII. À gauche, une affiche « Fête du quartier — Hèsta del barri — 15 AOÛT — Assomption, bal à 21 h — Mairie de Toulouse, quartier des Carmes ». À droite, l\'ombre d\'un balcon part vers le bas à droite, et une plaque « Rue des Filatiers — Carrièra dels Filatièrs ».')],
    outils: ['image'],
    indices: [
      { cout: 40, texte: 'Le cadran indique II, soit 14 h solaires. On est à Toulouse (longitude ≈ 1,44° E) le 15 août, donc en heure d\'été : UTC+2.' },
      { cout: 50, texte: 'Heure légale = heure solaire − (longitude en degrés × 4 min) − équation du temps + décalage horaire. Le 15 août, l\'équation du temps vaut environ −4 min (le cadran « retarde »).' },
      { cout: 60, texte: '14 h 00 − 5,8 min + 4,1 min = 13 h 58 UTC → 15 h 58 à l\'heure légale française, soit 16 h 00 à la demi-heure près.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{HHhMM}, heure légale arrondie à la demi-heure (ex. LUMIO{09h30})',
    flags: ['LUMIO{16h00}', 'LUMIO{16h}', 'LUMIO{16}', 'LUMIO{16:00}', 'LUMIO{16_h}', 'LUMIO{16_h_00}', 'LUMIO{15h58}', 'LUMIO{15h59}'],
    writeup: `<h3>1. Lire le cadran</h3><p>L'ombre du style (la tige parallèle à l'axe de la Terre) tombe sur <b>II</b> : <b>14 h solaires</b>. Sur un cadran vertical plein sud, l'après-midi est bien à droite (le soleil est à l'ouest, l'ombre part à l'est). L'ombre du balcon, vers le bas à droite, confirme un soleil au sud-ouest.</p>
<h3>2. Le lieu et la date</h3><p>Affiche de la mairie de Toulouse, plaque bilingue « Rue des Filatiers » (quartier des Carmes) : <b>Toulouse</b>, longitude ≈ <b>1,44° E</b>. La fête a lieu le <b>15 août</b> : heure d'été, <b>UTC+2</b>.</p>
<h3>3. Convertir</h3><ul><li><b>Longitude</b> : la Terre tourne de 1° en 4 minutes. À 1,44° à l'est de Greenwich, midi solaire arrive 5,8 min plus tôt qu'à Greenwich : on retire 5,8 min.</li><li><b>Équation du temps</b> : à cause de l'orbite elliptique et de l'inclinaison de l'axe, le soleil « vrai » est en retard d'environ 4 min sur le soleil « moyen » à la mi-août : on ajoute 4 min.</li><li>14 h 00 − 5,8 + 4,1 ≈ <b>13 h 58 UTC</b>, soit <b>15 h 58</b> en heure légale (UTC+2).</li></ul>
<p>Le témoin qui parle de « 13 h » se trompe de trois heures : son alibi ne tient pas. Pour vérifier, <b>SunCalc</b> (suncalc.org) affiche la position du soleil pour un lieu, une date et une heure : à Toulouse le 15 août vers 16 h, l'azimut est bien sud-ouest.</p>
<p>Flag : <code>LUMIO{16h00}</code></p>`,
    retenir: 'Heure solaire ≠ heure légale : il faut corriger la longitude, l\'équation du temps et le fuseau (été/hiver). SunCalc fait ce calcul pour vérifier une photo.'
  }
];
