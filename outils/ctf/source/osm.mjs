import { code } from './_aides.mjs';

const DONNEES = 'assets/ctf/donnees/saint-lumin.geojson';
const ile = (requete, description) => ({ type: 'geojson', titre: 'Saint-Lumin-sur-Mer — données OSM (fictives) et éditeur Overpass', src: DONNEES, requete, vue: [45.2, -3.5, 15], description: description || 'Île et commune <b>inventées</b>, placées en plein océan : les données sont fictives mais les tags suivent les conventions réelles du wiki OpenStreetMap. Clique sur un objet de la carte pour voir ses tags.' });

export default [
  {
    id: 'osm-tags', categorie: 'osm', titre: 'La fontaine accessible', difficulte: 1, points: 100,
    accroche: 'Lire des tags OSM : clé=valeur. Une seule fontaine est accessible en fauteuil.',
    briefing: `<p class="dossier">Dossier OS-01 · Préparer une balade accessible</p>
<p>Une association organise une balade sur l'île (fictive) de Saint-Lumin pour des personnes en fauteuil roulant. Il lui faut un point d'eau potable <b>accessible</b>.</p>
<p>Dans OpenStreetMap, chaque objet porte des <b>tags</b> <code>clé=valeur</code> : <code>amenity=drinking_water</code> pour un point d'eau potable, <code>wheelchair=yes|limited|no</code> pour l'accessibilité. Trouve le nom du seul point d'eau marqué <code>wheelchair=yes</code>.</p>`,
    ressources: [ile('[out:json];\n// Tous les points d\'eau potable de l\'île\nnode["amenity"="drinking_water"];\nout;')],
    outils: [],
    indices: [{ cout: 20, texte: 'Exécute la requête d\'exemple : elle liste les points d\'eau et tous leurs tags. Repère celui qui a wheelchair=yes.' }, { cout: 20, texte: 'Ou ajoute un second filtre : node["amenity"="drinking_water"]["wheelchair"="yes"];' }],
    validation: 'flag', format: 'Format : LUMIO{nom_du_lieu} (minuscules, espaces remplacés par _)',
    flags: ['LUMIO{fontaine_des_sauniers}', 'LUMIO{la_fontaine_des_sauniers}'],
    writeup: `<h3>1. Le modèle de données d'OSM</h3><p>Trois types d'objets : les <b>nœuds</b> (points), les <b>chemins</b> (lignes ou surfaces) et les <b>relations</b> (groupes). Chacun porte des tags libres mais normalisés par la communauté sur le wiki (<code>wiki.openstreetmap.org</code>).</p>
<h3>2. Filtrer</h3>${code('text', 'node["amenity"="drinking_water"]["wheelchair"="yes"];\nout;')}
<p>Les filtres entre crochets se cumulent (ET logique). Résultat : un seul objet, <b>Fontaine des Sauniers</b>. Les autres sont marqués <code>no</code>, <code>limited</code> ou n'ont pas d'information (absence de tag ≠ « non »).</p>
<p>Flag : <code>LUMIO{fontaine_des_sauniers}</code></p>`,
    retenir: 'Un objet OSM = une géométrie + des tags clé=valeur. Le wiki OSM documente chaque clé : c\'est la référence pour écrire une requête.'
  },
  {
    id: 'osm-cafe', categorie: 'osm', titre: 'Un café, le dimanche, en terrasse', difficulte: 2, points: 200,
    accroche: 'Quatre conditions, six cafés, une seule réponse : combine les filtres Overpass.',
    briefing: `<p class="dossier">Dossier OS-02 · Rendez-vous du dimanche matin</p>
<p>Des amis veulent se retrouver dimanche matin dans un café de l'île avec une <b>terrasse</b>, et payer par <b>carte</b>. Écris une requête Overpass qui trouve le seul café qui remplit les trois critères.</p>
<p>Tags utiles : <code>amenity=cafe</code>, <code>outdoor_seating=yes</code>, <code>payment:cards=yes</code>, <code>opening_hours</code> (format OSM : <code>Mo-Sa 07:00-19:00; Su 09:00-13:00</code>, les jours sont abrégés en anglais : Mo Tu We Th Fr Sa <b>Su</b>).</p>`,
    ressources: [ile('[out:json];\nnode["amenity"="cafe"];\nout;')],
    outils: [],
    indices: [
      { cout: 30, texte: 'Pour « contient », Overpass utilise ~ suivi d\'une expression régulière : ["opening_hours"~"Su"].' },
      { cout: 40, texte: 'Attention : « Mo-Su » couvre aussi le dimanche, mais ce café-là n\'accepte pas la carte. Requête complète : node["amenity"="cafe"]["outdoor_seating"="yes"]["opening_hours"~"Su"]["payment:cards"="yes"];' }
    ],
    validation: 'flag', format: 'Format : LUMIO{nom_du_cafe}',
    flags: ['LUMIO{la_vague}'],
    writeup: `<h3>1. Construire la requête filtre par filtre</h3>${code('text', `[out:json];
node["amenity"="cafe"]                 // 6 cafés
    ["outdoor_seating"="yes"]          // 4 avec terrasse
    ["opening_hours"~"Su"]             // 2 ouverts le dimanche (Mo-Su ou Su)
    ["payment:cards"="yes"];           // 1 seul accepte la carte
out;`)}
<p>Résultat : <b>La Vague</b> (<code>Mo-Fr 07:30-18:30; Su 09:00-13:00</code>). « Le Phare Bleu » est ouvert du lundi au dimanche (<code>Mo-Su</code>) mais n'accepte que les espèces.</p>
<h3>2. Les pièges des horaires</h3><p>Une recherche textuelle sur <code>opening_hours</code> est approximative : <code>Mo-Su</code> contient bien « Su », mais <code>Fr-Mo</code> inclurait aussi le dimanche sans l'écrire. Pour un vrai calcul, on utilise une bibliothèque comme <code>opening_hours.js</code>.</p>
<p>Flag : <code>LUMIO{la_vague}</code></p>`,
    retenir: 'Les filtres Overpass se cumulent ; = teste l\'égalité exacte, ~ une expression régulière (,i pour ignorer la casse).'
  },
  {
    id: 'osm-around', categorie: 'osm', titre: 'Du pain près du phare', difficulte: 2, points: 200,
    accroche: 'Une recherche par distance : (around:R, lat, lon).',
    briefing: `<p class="dossier">Dossier OS-03 · Pique-nique à la pointe</p>
<p>Tu descends du bus à l'arrêt <b>« Le Phare »</b> et tu veux acheter du pain sans marcher plus de <b>120 mètres</b>. Quelle boulangerie choisir ?</p>
<p>Overpass sait filtrer par distance avec <code>(around:RAYON_EN_MÈTRES,LATITUDE,LONGITUDE)</code>. Commence par trouver les coordonnées de l'arrêt (clic sur l'objet dans la carte, ou requête sur <code>highway=bus_stop</code>).</p>`,
    ressources: [ile('[out:json];\nnode["highway"="bus_stop"]["name"="Le Phare"];\nout;')],
    outils: [],
    indices: [{ cout: 30, texte: 'Exécute la requête d\'exemple : le tableau de résultats donne la position (latitude, longitude) de l\'arrêt. Un clic sur l\'objet dans la carte l\'affiche aussi.' }, { cout: 40, texte: 'L\'arrêt est à 45.200521, -3.492351. Requête : node["shop"="bakery"](around:120,45.200521,-3.492351);' }],
    validation: 'flag', format: 'Format : LUMIO{nom_de_la_boulangerie}',
    flags: ['LUMIO{au_fournil_des_embruns}', 'LUMIO{fournil_des_embruns}'],
    writeup: `<h3>1. Localiser l'arrêt</h3><p>L'arrêt « Le Phare » (<code>highway=bus_stop</code>) se trouve à <code>45.200521, -3.492351</code>.</p>
<h3>2. Chercher autour</h3>${code('text', 'node["shop"="bakery"](around:120,45.200521,-3.492351);\nout;')}
<p>Une seule boulangerie : <b>Au Fournil des Embruns</b>, à une cinquantaine de mètres. À 150 m, on trouverait aussi la Boulangerie des Mouettes : le rayon compte.</p>
<h3>3. Version élégante</h3><p>Overpass permet d'enchaîner sans recopier les coordonnées :</p>${code('text', 'node["highway"="bus_stop"]["name"="Le Phare"]->.arret;\nnode["shop"="bakery"](around.arret:120);\nout;')}
<p>(Cette syntaxe avec ensembles nommés fonctionne sur overpass-api.de ; le moteur local de l'arène se limite à la forme avec coordonnées.)</p>
<p>Flag : <code>LUMIO{au_fournil_des_embruns}</code></p>`,
    retenir: 'around:R,lat,lon trouve ce qui est à moins de R mètres d\'un point : la base de nombreuses géolocalisations (« quelle pharmacie est à moins de 100 m d\'un arrêt de tram ? »).'
  },
  {
    id: 'osm-ligne', categorie: 'osm', titre: 'La correspondance', difficulte: 2, points: 200,
    accroche: 'Des tags à valeurs multiples séparées par « ; » : attention aux faux amis.',
    briefing: `<p class="dossier">Dossier OS-04 · Réseau de bus de l'île</p>
<p>Sur l'île, chaque arrêt de bus indique les lignes qui le desservent dans le tag <code>route_ref</code>, avec plusieurs valeurs séparées par des points-virgules (convention OSM) : <code>route_ref=1;3</code>.</p>
<p>Quel est le <b>seul arrêt</b> desservi à la fois par la ligne <b>2</b> et par la ligne <b>5</b> ?</p>`,
    ressources: [ile('[out:json];\nnode["highway"="bus_stop"];\nout;')],
    outils: [],
    indices: [{ cout: 30, texte: 'Deux filtres par expression régulière sur la même clé : ["route_ref"~"2"]["route_ref"~"5"].' }, { cout: 30, texte: 'Pour éviter que « 2 » corresponde aussi à « 12 », on encadre : ["route_ref"~"(^|;)2(;|$)"].' }],
    validation: 'flag', format: 'Format : LUMIO{nom_de_l_arret}',
    flags: ['LUMIO{halle_aux_poissons}', 'LUMIO{la_halle_aux_poissons}'],
    writeup: `<h3>1. Valeurs multiples</h3><p>OSM stocke plusieurs valeurs dans un même tag en les séparant par <code>;</code>. Une égalité <code>["route_ref"="2"]</code> ne trouverait que les arrêts desservis <i>uniquement</i> par la ligne 2.</p>
<h3>2. Requête robuste</h3>${code('text', 'node["highway"="bus_stop"]\n    ["route_ref"~"(^|;)2(;|$)"]\n    ["route_ref"~"(^|;)5(;|$)"];\nout;')}
<p>L'expression <code>(^|;)2(;|$)</code> signifie : « 2 » précédé du début ou d'un point-virgule, et suivi d'un point-virgule ou de la fin. Résultat : <b>Halle aux Poissons</b> (<code>route_ref=1;2;5</code>).</p>
<p>Flag : <code>LUMIO{halle_aux_poissons}</code></p>`,
    retenir: 'Pour les tags à valeurs multiples, une expression régulière bien bornée évite les faux positifs.'
  },
  {
    id: 'osm-banc', categorie: 'osm', titre: 'Le banc du rendez-vous', difficulte: 3, points: 300,
    accroche: 'Trois contraintes spatiales, huit bancs : clique sur le bon.',
    briefing: `<p class="dossier">Dossier OS-05 · Message laissé dans une bouteille (jeu de piste)</p>
<p>Le message d'un jeu de piste dit : <i>« Retrouve-moi sur le banc de pierre <b>sans dossier</b>, à moins de <b>40 m d'un point d'eau potable</b>, d'où l'on voit les bateaux : à moins de <b>60 m du port</b>. »</i></p>
<p>Utilise l'éditeur Overpass pour croiser les contraintes, puis <b>clique sur le banc</b> dans la carte de validation (les données de l'île y sont affichées).</p>`,
    ressources: [ile('[out:json];\nnode["amenity"="bench"]["backrest"="no"];\nout;')],
    outils: [],
    indices: [
      { cout: 30, texte: 'Commence par lister les bancs sans dossier : node["amenity"="bench"]["backrest"="no"]; — il en reste cinq.' },
      { cout: 40, texte: 'Le point d\'eau le plus proche du port est la Fontaine du Quai (node/1031) : clique dessus dans la carte pour lire ses coordonnées, puis cherche les bancs sans dossier autour : node["amenity"="bench"]["backrest"="no"](around:40,LATITUDE,LONGITUDE);' },
      { cout: 50, texte: 'Le banc est entre la Fontaine du Quai et le bassin du port, à l\'est de la jetée.' }
    ],
    validation: 'carte', vue: [45.1985, -3.4985, 16], fond: 'aucun', calque: DONNEES,
    cible: { lieu: 'Banc de pierre du Quai du Port (île fictive de Saint-Lumin)', points: [{ lat: 45.196928, lon: -3.497195 }], anneaux: [{ r: 10, part: 1 }, { r: 25, part: 0.5 }, { r: 300, part: 0 }], dansLesDonnees: true, faux: { lat: 45.198628, lon: -3.500255 } },
    writeup: `<h3>1. Filtrer par tags</h3><p>Huit bancs sur l'île ; cinq ont <code>backrest=no</code>.</p>
<h3>2. Croiser avec la distance aux points d'eau</h3>${code('text', 'node["amenity"="drinking_water"]->.eau;\nnode["amenity"="bench"]["backrest"="no"](around.eau:40);\nout;')}
<p>Deux candidats : le banc près de la Fontaine des Sauniers (sur la place de la Halle, à 190 m du port) et celui près de la Fontaine du Quai.</p>
<h3>3. Distance au port</h3><p>Seul le second est à moins de 60 m du bassin (<code>leisure=marina</code>) : environ 20 m. Le banc près de la jetée (à l'ouest) est bien sans dossier et au bord de l'eau, mais aucun point d'eau n'est à moins de 40 m.</p>
<p>Cette démarche (filtrer par tags, puis croiser des contraintes de distance) est exactement celle utilisée en géolocalisation réelle : « une photo montre un banc, une fontaine et des bateaux : quels endroits de la ville réunissent les trois ? »</p>`,
    retenir: 'Combiner des contraintes (tags + distances) réduit une carte entière à un seul point : c\'est la force d\'Overpass en OSINT.'
  }
];
