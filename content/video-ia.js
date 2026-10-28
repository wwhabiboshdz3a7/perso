import { code } from './_outils.js';

const motsMin = n => ({ label: `Au moins ${n} mots`, verif: t => t.trim().split(/\s+/).length >= n });

export default {
  description: 'Créer des images, des vidéos et des voix avec l\'IA, du premier prompt au workflow professionnel : cohérence de personnage, contrôle du mouvement, lipsync, formats courts pour TikTok et Reels, publicité produit, UGC, montage, et un cadre éthique et juridique clair.',
  intro: `<h3>Comment travailler ce parcours</h3><p>Chaque leçon donne des méthodes, des <strong>templates de prompts</strong> et des checklists directement réutilisables dans les outils du marché (Midjourney, Runway, Kling, Higgsfield, Veo, ElevenLabs, CapCut, DaVinci Resolve…). Les exercices te font écrire des prompts et des scripts, évalués selon des critères précis, ou répondre à des QCM d'étude de cas. Pour pratiquer, ouvre un outil en parallèle : la plupart offrent des crédits gratuits.</p><p class="muted">Les outils évoluent vite : les principes (composition, lumière, mouvement, narration, rythme) restent, les interfaces changent. On insiste sur les principes.</p>`,
  modules: [
    {
      titre: 'Images par IA : les fondations', niveau: 'Débutant', description: 'Comprendre les générateurs, écrire un prompt image efficace, garder un personnage cohérent, itérer et finaliser.',
      lecons: [
        {
          titre: 'Comment une IA génère une image',
          theorie: `<p>Les générateurs d'images actuels (Midjourney, DALL·E, Stable Diffusion, Flux, Imagen…) reposent sur les <strong>modèles de diffusion</strong>. Comprendre le principe en quelques lignes change la façon dont tu écris tes prompts.</p>
<h2>Le principe de la diffusion</h2>
<p>Pendant l'entraînement, on prend des millions d'images légendées et on leur ajoute progressivement du bruit jusqu'à obtenir une « neige » aléatoire ; le modèle apprend à <em>inverser</em> ce processus, étape par étape. À la génération, il part d'un bruit pur et le « débruite » en une trentaine d'étapes, guidé par ton texte (converti en embeddings, comme dans le parcours IA). Chaque étape fait apparaître un peu plus de structure : d'abord les grandes masses, puis les formes, enfin les détails.</p>
<p>Conséquences pratiques : le modèle ne « dessine » pas, il <em>fait converger</em> vers une image plausible compatible avec ta description et avec tout ce qu'il a vu. D'où : les mots fréquents dans les légendes (termes photo, styles connus) fonctionnent mieux ; les concepts rares ou contradictoires donnent des résultats flous ; et le hasard initial (la <strong>seed</strong>) explique que le même prompt donne des images différentes.</p>
<h2>Les paramètres universels</h2>
<table><tr><th>Paramètre</th><th>Effet</th></tr>
<tr><td><strong>Seed</strong></td><td>graine aléatoire : même prompt + même seed = même image (reproductibilité, variations contrôlées)</td></tr>
<tr><td><strong>Guidance / CFG</strong></td><td>à quel point le modèle suit le texte : bas = plus libre et naturel, haut = plus littéral mais saturé</td></tr>
<tr><td><strong>Étapes</strong></td><td>nombre d'itérations de débruitage : au-delà de 25-40, peu de gain</td></tr>
<tr><td><strong>Ratio</strong></td><td>format de l'image (1:1, 16:9, 9:16, 3:2) : à choisir selon la destination</td></tr>
<tr><td><strong>Stylize / style</strong></td><td>poids de l'esthétique « maison » du modèle</td></tr>
<tr><td><strong>Prompt négatif</strong></td><td>ce qu'on ne veut pas (texte, mains déformées, flou) : utile sur Stable Diffusion, moins sur les modèles récents</td></tr></table>
<h2>Panorama des outils (2026)</h2>
<ul><li><strong>Midjourney</strong> : esthétique forte, excellent pour l'illustration et la direction artistique ; via Discord ou son site.</li><li><strong>Flux / Stable Diffusion</strong> : open source, contrôle maximal (ControlNet, LoRA), installable en local (ComfyUI, Automatic1111).</li><li><strong>DALL·E / GPT Image, Imagen, Ideogram</strong> : bonne compréhension du texte dans l'image et des instructions complexes.</li><li><strong>Higgsfield, Leonardo, Krea</strong> : suites créatives orientées produit, personnages et vidéo.</li></ul>
<h2>Ce que les modèles font mal (encore)</h2>
<p>Le texte lisible (en progrès), les mains et les doigts, les interactions physiques précises, le comptage (« exactement trois pommes »), les relations spatiales complexes, la cohérence entre plusieurs images. Chaque génération suivante améliore ces points, mais connaître les faiblesses permet de contourner : simplifier la scène, générer en plusieurs étapes, retoucher.</p>
<h2>Résolution et formats de sortie</h2>
<p>Les modèles génèrent typiquement en 1024 px de côté ; l'<strong>upscaling</strong> (agrandissement par IA : Topaz, Magnific, les outils intégrés) monte en 4K en reconstruisant les détails. Pour l'impression, prévoir 300 dpi ; pour les réseaux, 1080 px suffisent.</p>
<div class="callout info"><b>Le bon état d'esprit</b>Tu diriges, le modèle propose. Attends-toi à générer 10 images pour en garder une ; c'est normal et c'est rapide. La compétence, c'est de savoir ce que tu veux et de le décrire précisément — objet de la leçon suivante.</div>`,
          exercice: {
            type: 'qcm', titre: 'Comprendre les paramètres',
            enonce: `<p>Tu as obtenu une image presque parfaite mais tu voudrais essayer une variante légèrement différente du même cadrage. Quelle approche est la plus pertinente ?</p>`,
            options: ['Relancer le même prompt sans rien changer', 'Fixer la seed de l\'image obtenue et modifier légèrement le prompt', 'Augmenter fortement le nombre d\'étapes', 'Changer de modèle'],
            bonne: 1,
            explication: 'La seed fixe le hasard initial : en la conservant et en ajustant le prompt (ou en demandant des variations), on explore autour de l\'image qui te plaît au lieu de repartir de zéro.'
          },
          quiz: [
            { q: 'Que fait un modèle de diffusion à la génération ?', options: ['Il assemble des morceaux d\'images existantes', 'Il part d\'un bruit aléatoire et le débruite progressivement guidé par le prompt', 'Il dessine trait par trait'], bonne: 1, explication: 'Chaque étape fait émerger plus de structure, des masses aux détails.' },
            { q: 'À quoi sert la seed ?', options: ['À choisir le style', 'À reproduire ou faire varier de façon contrôlée une génération', 'À augmenter la résolution'], bonne: 1, explication: 'Même prompt + même seed = même image.' },
            { q: 'Qu\'est-ce que l\'upscaling ?', options: ['Une compression', 'Un agrandissement par IA qui reconstruit les détails', 'Un changement de ratio'], bonne: 1, explication: 'Indispensable pour l\'impression ou la 4K.' }
          ]
        },
        {
          titre: 'Anatomie d\'un prompt image',
          theorie: `<p>Un bon prompt image est une <strong>direction photo</strong> condensée : il dit quoi, comment, dans quelle lumière, avec quel cadrage et quel rendu. Les modèles récents comprennent le langage naturel ; la structure aide surtout à ne rien oublier.</p>
<h2>Le template en six blocs</h2>
${code('text', `[SUJET] + [ACTION/POSE] + [DÉCOR/CONTEXTE] + [LUMIÈRE] + [CADRAGE/OBJECTIF] + [STYLE/RENDU] (+ paramètres)

Exemple :
Une barista d'une trentaine d'années, tablier en lin beige, verse un latte art dans une tasse en céramique,
comptoir en bois clair d'un café scandinave, grandes fenêtres à l'arrière-plan,
lumière naturelle douce de fin de matinée, légère brume de vapeur,
plan rapproché à hauteur de comptoir, objectif 50 mm, faible profondeur de champ,
photographie éditoriale, couleurs chaudes et naturelles, grain fin --ar 3:2`)}
<h2>Chaque bloc en détail</h2>
<table><tr><th>Bloc</th><th>Vocabulaire utile</th></tr>
<tr><td><strong>Sujet</strong></td><td>âge, genre, vêtements, expression, matière, couleur ; un seul sujet principal</td></tr>
<tr><td><strong>Action</strong></td><td>verbe concret (verse, regarde, court) ; les poses statiques sont plus fiables</td></tr>
<tr><td><strong>Décor</strong></td><td>lieu, époque, météo, éléments d'arrière-plan, profondeur</td></tr>
<tr><td><strong>Lumière</strong></td><td>golden hour, lumière douce de fenêtre, contre-jour, néons, studio trois points, ombres marquées, volumétrique</td></tr>
<tr><td><strong>Cadrage</strong></td><td>gros plan, plan moyen, plan large, vue aérienne, contre-plongée, 35 mm / 85 mm, bokeh, profondeur de champ</td></tr>
<tr><td><strong>Style</strong></td><td>photographie éditoriale, cinématographique, illustration aquarelle, 3D Pixar-like, flat design, film argentique Kodak Portra, noir et blanc</td></tr></table>
<h2>Les principes</h2>
<ul><li><strong>Du plus important au moins important</strong> : les premiers mots pèsent plus.</li><li><strong>Concret plutôt qu'abstrait</strong> : « lumière de fenêtre à 45°, ombres douces » bat « belle lumière ».</li><li><strong>Une idée par image</strong> : trop d'éléments = scène confuse. Pour une scène complexe, générer puis retoucher (inpainting).</li><li><strong>Vocabulaire photo/ciné</strong> : les modèles ont appris sur des légendes de photographes ; parler leur langue aide.</li><li><strong>Préciser le ratio</strong> dès le départ : le cadrage change la composition.</li><li><strong>Négatif avec parcimonie</strong> : dire ce qu'on veut est plus efficace que lister ce qu'on ne veut pas.</li></ul>
<h2>Prompts par usage</h2>
${code('text', `# Portrait pro (LinkedIn)
Portrait d'une femme d'affaires de 40 ans, chemise bleu marine, sourire discret, fond de bureau flou,
lumière douce de studio, plan poitrine, 85 mm, photographie corporate, tons neutres --ar 4:5

# Packshot produit
Flacon de sérum en verre ambré, bouchon noir mat, posé sur une pierre d'ardoise, gouttes d'eau,
fond uni gris chaud, lumière de studio latérale avec reflet maîtrisé, macro 100 mm, photographie publicitaire --ar 1:1

# Illustration pour un article
Illustration flat design d'un ordinateur portable entouré d'icônes de cadenas et de boucliers,
palette bleu et vert menthe, fond clair, style vectoriel minimaliste --ar 16:9`)}
<h2>Itérer méthodiquement</h2>
<p>Change <em>un</em> bloc à la fois et compare : d'abord sujet et composition, puis lumière, puis style. Note ce qui fonctionne (un fichier de prompts validés est un vrai actif). Les variations et le remix d'une image réussie vont plus vite que repartir de zéro.</p>
<div class="callout info"><b>Tester son prompt</b>Lis-le comme un brief à un photographe : saurait-il quoi faire ? Si une question reste (« quelle heure ? quel objectif ? quelle humeur ? »), le modèle devra deviner — et devinera au hasard.</div>`,
          exercice: {
            type: 'texte', titre: 'Écrire un prompt image complet',
            enonce: `<p>Rédige un prompt pour une <strong>photo de présentation d'une boulangerie artisanale</strong> destinée à une page d'accueil (format 16:9). Il doit couvrir les six blocs : sujet précis, action, décor, lumière, cadrage/objectif, style, et indiquer le ratio. Vocabulaire photo attendu.</p>`,
            placeholder: 'Un(e) … , [action], [décor], [lumière], [cadrage, objectif], [style] --ar 16:9',
            criteres: [
              { label: 'Sujet concret lié à la boulangerie (boulanger, pain, vitrine, four…)', re: /boulang|pain|baguette|croissant|viennoiserie|vitrine|four|p[âa]te/i },
              { label: 'Une action ou une pose', re: /sort|pose|tient|dispose|p[ée]trit|enfourne|pr[ée]sente|regarde|coupe|verse|d[ée]pose|range|souri/i },
              { label: 'Un décor / contexte décrit', re: /arri[èe]re-plan|fond|comptoir|atelier|boutique|fournil|[ée]tag[èe]re|mur|fen[êe]tre/i },
              { label: 'La lumière précisée', re: /lumi[èe]re|golden hour|contre-jour|ombres?|[ée]clairage|n[ée]on|studio/i },
              { label: 'Cadrage et/ou objectif (plan, mm, profondeur de champ)', re: /plan (large|moyen|rapproch|serr|am[ée]ricain)|gros plan|\d{2,3}\s?mm|profondeur de champ|bokeh|vue (a[ée]rienne|plongeante)|contre-plong/i },
              { label: 'Style / rendu photographique', re: /photograph|[ée]ditorial|cin[ée]matograph|argentique|kodak|fuji|grain|tons?|couleurs?|palette|r[ée]aliste/i },
              { label: 'Ratio 16:9 indiqué', re: /16\s?:\s?9|--ar 16:9/ },
              motsMin(35)
            ],
            solution: `<p>Un boulanger d'une cinquantaine d'années, tablier blanc fariné, sort une plaque de baguettes dorées d'un four en pierre, fournil artisanal avec étagères en bois chargées de pains au levain et miches rustiques, lumière chaude de début de matinée entrant par une fenêtre latérale, légère vapeur et poussière de farine en suspension, plan moyen légèrement en contre-plongée, objectif 35 mm, profondeur de champ moyenne pour garder le fournil lisible, photographie éditoriale chaleureuse, tons ambrés et naturels, grain fin argentique --ar 16:9</p>`
          },
          quiz: [
            { q: 'Quel ordre pour les éléments d\'un prompt ?', options: ['Aléatoire', 'Du plus important au moins important', 'Style d\'abord'], bonne: 1, explication: 'Les premiers mots ont plus de poids.' },
            { q: 'Pourquoi utiliser du vocabulaire photographique (85 mm, golden hour) ?', options: ['Pour faire pro', 'Parce que les modèles ont appris sur des légendes de photographes', 'C\'est obligatoire'], bonne: 1, explication: 'Ces termes sont fortement associés à des rendus précis dans les données d\'entraînement.' },
            { q: 'Ta scène est confuse avec trop d\'éléments. Que faire ?', options: ['Ajouter plus de détails', 'Simplifier à une idée principale, puis retoucher/compléter', 'Augmenter la guidance au maximum'], bonne: 1, explication: 'Une idée par image ; l\'inpainting ajoute ensuite les éléments secondaires.' }
          ]
        },
        {
          titre: 'Cohérence de personnage et références',
          theorie: `<p>Le défi n° 1 de la création par IA : obtenir le <strong>même personnage</strong> (ou le même produit, le même décor) d'une image à l'autre. Sans cohérence, pas de série, pas de bande dessinée, pas de vidéo avec un héros, pas de mascotte de marque. Plusieurs techniques se combinent.</p>
<h2>1. La fiche de personnage (character sheet)</h2>
<p>Commence par générer une <strong>planche de référence</strong> : le personnage de face, de profil, de trois quarts, en pied, avec des expressions, sur fond neutre. Prompt type :</p>
${code('text', `Planche de personnage, même jeune femme sur toutes les vues : 25 ans, cheveux noirs mi-longs à frange,
yeux marron, grain de beauté sous l'œil gauche, veste en jean bleu délavé sur t-shirt blanc,
vues de face, profil, trois quarts et en pied, expressions neutre, souriante et surprise,
fond gris uni, lumière de studio uniforme, style photographique réaliste --ar 16:9`)}
<p>Les <em>détails distinctifs</em> (grain de beauté, frange, veste précise) sont des ancres que tu répéteras dans chaque prompt : le modèle les reproduit bien mieux qu'un visage « générique ».</p>
<h2>2. Les images de référence</h2>
<ul><li><strong>Référence de personnage</strong> (Midjourney <code>--cref</code>, « character reference » de Higgsfield/Leonardo, IP-Adapter sur Stable Diffusion) : on fournit l'image du personnage ; le modèle en conserve le visage et les traits.</li><li><strong>Référence de style</strong> (<code>--sref</code>) : conserve la palette et le rendu d'une image modèle.</li><li><strong>Image de départ</strong> (image-to-image) avec un poids réglable : la composition d'origine guide la nouvelle image.</li></ul>
<h2>3. Seed et prompt figés</h2>
<p>Conserver la seed et ne changer que l'action ou le décor dans le prompt garde une partie de la cohérence. Moins fiable que les références, mais gratuit et rapide pour des variantes proches.</p>
<h2>4. Entraîner un modèle personnalisé (LoRA)</h2>
<p>Avec 15 à 30 images d'un personnage, d'un produit ou d'un style, on entraîne un <strong>LoRA</strong> (petit module qui spécialise Stable Diffusion/Flux). Résultat : le personnage se génère avec un simple mot-clé, dans n'importe quelle situation, avec une fidélité élevée. C'est la méthode des studios et des marques ; des services en ligne le font sans installation.</p>
<h2>5. Cohérence des produits et des décors</h2>
<p>Pour un <strong>produit</strong> : photographier le vrai produit sur fond neutre et l'utiliser comme référence ; de nombreux outils (Higgsfield Ads, Flair, Pebblely) placent le produit réel dans des scènes générées sans le déformer. Pour un <strong>décor</strong> récurrent : générer une vue large, puis utiliser l'image-to-image pour les autres angles.</p>
<h2>Checklist de cohérence</h2>
<ul><li>Fiche de personnage validée et sauvegardée.</li><li>Liste des ancres descriptives (5 à 7 détails) copiée dans chaque prompt.</li><li>Référence de personnage activée dans l'outil, poids réglé (trop haut = pose figée, trop bas = dérive).</li><li>Même style/référence de style, même ratio, même lumière générale.</li><li>Vérification côte à côte à chaque nouvelle image ; rejeter sans hésiter.</li></ul>
<div class="callout info"><b>Pour la vidéo</b>La cohérence image par image est le socle de la cohérence vidéo (module 2) : on génère d'abord des images-clés cohérentes, puis on les anime (image-to-video). Investir ici évite des heures de corrections ensuite.</div>`,
          exercice: {
            type: 'texte', titre: 'Définir les ancres d\'un personnage',
            enonce: `<p>Décris un <strong>personnage récurrent</strong> pour une série de vidéos courtes (une mascotte ou un présentateur) en listant au moins six détails distinctifs et stables (physiques, vestimentaires, accessoires), puis écris le prompt de sa planche de référence (vues multiples, fond neutre, lumière uniforme).</p>`,
            placeholder: 'Ancres :\n1. …\n…\nPrompt de la planche : …',
            criteres: [
              { label: 'Au moins six détails distinctifs listés', verif: t => (t.match(/^\s*(\d+[.)]|[-•*])\s+\S/gm) || []).length >= 6 },
              { label: 'Un détail physique précis (cheveux, yeux, marque, taille…)', re: /cheveux|yeux|barbe|tache|grain de beaut|cicatrice|lunettes|taille|peau|frange|boucl/i },
              { label: 'Un élément vestimentaire ou accessoire stable', re: /veste|t-shirt|chemise|pull|casquette|bonnet|[ée]charpe|montre|sac|bijou|boucles? d.oreille|collier|sweat|robe|manteau|tablier/i },
              { label: 'Demande plusieurs vues (face, profil, trois quarts, en pied)', re: /face[\s\S]*profil|profil[\s\S]*face|trois[- ]quarts|en pied|plusieurs vues|vues multiples/i },
              { label: 'Fond neutre et lumière uniforme', re: /fond (neutre|uni|gris|blanc)[\s\S]*lumi[èe]re|lumi[èe]re[\s\S]*fond (neutre|uni|gris|blanc)/i },
              { label: 'Mentionne « planche » ou « character sheet »', re: /planche|character sheet|fiche de personnage/i },
              motsMin(60)
            ],
            solution: `<p>Ancres : 1. Femme d'environ 30 ans, 2. cheveux roux coupés au carré avec frange droite, 3. lunettes rondes à monture dorée, 4. taches de rousseur marquées, 5. sweat à capuche vert sapin avec un petit logo de nuage brodé, 6. montre argentée au poignet gauche, 7. sourire en coin caractéristique.</p><p>Prompt : Planche de personnage (character sheet), même femme sur toutes les vues : 30 ans, carré roux à frange droite, lunettes rondes dorées, taches de rousseur, sweat à capuche vert sapin avec logo nuage brodé, montre argentée au poignet gauche ; vues de face, de profil, de trois quarts et en pied ; expressions neutre, souriante en coin, surprise ; fond gris uni, lumière de studio uniforme sans ombres marquées, photographie réaliste, couleurs naturelles --ar 16:9</p>`
          },
          quiz: [
            { q: 'Quelle est la première étape pour un personnage cohérent ?', options: ['Générer directement les scènes finales', 'Créer une planche de référence multi-vues sur fond neutre', 'Entraîner un LoRA tout de suite'], bonne: 1, explication: 'La planche fournit la référence et les ancres pour tout le reste.' },
            { q: 'Que fait une référence de personnage (cref) ?', options: ['Elle copie le style', 'Elle conserve le visage et les traits d\'une image fournie', 'Elle fixe la seed'], bonne: 1, explication: 'Le modèle s\'appuie sur l\'image pour reproduire l\'identité.' },
            { q: 'Qu\'est-ce qu\'un LoRA ?', options: ['Un format d\'image', 'Un petit module entraîné sur quelques images pour spécialiser un modèle', 'Un outil de montage'], bonne: 1, explication: 'C\'est la méthode la plus fidèle pour un personnage, un produit ou un style récurrent.' }
          ]
        },
        {
          titre: 'Itérer, retoucher et finaliser',
          theorie: `<p>L'image générée est rarement finale. Le flux professionnel enchaîne génération, sélection, retouche ciblée, agrandissement et export, avec des critères de qualité explicites.</p>
<h2>Sélectionner vite</h2>
<p>Génère par lots de 4 à 8, compare, garde une ou deux, rejette le reste sans regret. Critères : le sujet est-il juste ? la composition lisible ? la lumière cohérente ? aucun défaut rédhibitoire (mains, texte, anatomie) ? Un défaut mineur se retouche ; un cadrage raté non.</p>
<h2>Retoucher par zones : inpainting et outpainting</h2>
<ul><li><strong>Inpainting</strong> : on sélectionne une zone (une main, un objet, un fond) et on la régénère avec un prompt local : « main tenant une tasse blanche ». On corrige sans toucher au reste. C'est l'outil le plus utilisé en finition.</li><li><strong>Outpainting</strong> : on étend l'image au-delà de ses bords (passer de 1:1 à 16:9, ajouter de l'espace pour un titre).</li><li><strong>Remplacement d'arrière-plan</strong> : détourage automatique + nouveau fond généré ou uni (packshots).</li><li><strong>Édition par instruction</strong> (« mets-lui une veste rouge », « passe la scène de nuit ») : les modèles récents la gèrent directement.</li></ul>
<h2>Agrandir et nettoyer</h2>
<p>Upscaling ×2 ou ×4 (Topaz, Magnific, Krea, fonctions intégrées) avec un niveau de « créativité » bas pour rester fidèle, plus haut pour enrichir les textures. Attention : un upscaler créatif peut altérer un visage ; vérifier à 100 %. Puis retouche classique (Photoshop, Affinity, Photopea gratuit en ligne, GIMP) : niveaux, couleurs, suppression d'un élément, netteté.</p>
<h2>Contrôler la composition : ControlNet et guides</h2>
<p>Pour imposer une pose, un cadrage ou une perspective, on fournit un guide : un croquis, une pose (squelette), une carte de profondeur ou les contours d'une photo. Le modèle respecte la structure et habille le reste. Indispensable pour reproduire une mise en page précise ou une pose exacte.</p>
<h2>Exporter correctement</h2>
<table><tr><th>Destination</th><th>Format</th></tr>
<tr><td>Web / réseaux</td><td>JPEG qualité 80-90 ou WebP, 1080 à 2048 px, sRGB</td></tr>
<tr><td>Transparence (logo, détourage)</td><td>PNG</td></tr>
<tr><td>Impression</td><td>TIFF ou JPEG max, 300 dpi, taille réelle</td></tr>
<tr><td>Vidéo (image-clé)</td><td>PNG ou JPEG max, ratio de la vidéo (16:9 ou 9:16), ≥ 1920 px</td></tr></table>
<p>Nomme les fichiers de façon exploitable (<code>projet_scene03_v2.png</code>) et conserve les prompts et seeds dans un fichier à côté : c'est ce qui permet de revenir et de décliner.</p>
<h2>Contrôle qualité : la checklist</h2>
<ul><li>Anatomie (mains, doigts, dents, yeux symétriques) et objets (poignées, anses, logos).</li><li>Texte : lisible ou absent ; sinon le refaire en post-production.</li><li>Cohérence lumière/ombres (source unique, ombres dans le même sens).</li><li>Reflets et transparences plausibles.</li><li>Pas d'artefact de bordure, pas de motif répété.</li><li>Respect de la charte (couleurs, ton) et du brief.</li></ul>
<div class="callout info"><b>Temps réaliste</b>Pour une image publiable : 15 à 45 minutes, dont la moitié en sélection et retouche. L'IA ne supprime pas le travail de direction artistique ; elle le déplace.</div>`,
          exercice: {
            type: 'qcm', titre: 'Choisir la bonne correction',
            enonce: `<p>Pour chaque situation, la bonne approche. Quelles affirmations sont correctes ? (plusieurs réponses)</p>`,
            options: ['Une main déformée sur une image sinon parfaite → inpainting ciblé de la main', 'Le cadrage est raté (sujet coupé) → inpainting', 'Il faut passer l\'image de 1:1 à 16:9 → outpainting', 'Le texte sur l\'enseigne est illisible → refaire le texte en post-production', 'L\'image est en 1024 px pour une affiche → upscaling puis vérification des visages', 'Une pose précise est exigée par le client → relancer au hasard jusqu\'à l\'obtenir'],
            bonne: [0, 2, 3, 4], multiple: true,
            explication: 'Le cadrage raté se régénère (pas d\'inpainting) ; une pose exacte s\'obtient avec un guide de pose (ControlNet), pas au hasard.'
          },
          quiz: [
            { q: 'Qu\'est-ce que l\'inpainting ?', options: ['Un agrandissement', 'La régénération d\'une zone sélectionnée avec un prompt local', 'Un filtre couleur'], bonne: 1, explication: 'On corrige un détail sans toucher au reste de l\'image.' },
            { q: 'Quel format pour une image avec fond transparent ?', options: ['JPEG', 'PNG', 'TIFF'], bonne: 1, explication: 'Le JPEG ne gère pas la transparence.' },
            { q: 'Pourquoi conserver prompts et seeds à côté des images ?', options: ['Par obligation légale', 'Pour reproduire, décliner et corriger plus tard', 'Pour la taille de fichier'], bonne: 1, explication: 'C\'est la mémoire de production du projet.' }
          ]
        }
      ]
    },
    {
      titre: 'Vidéo générée par IA', niveau: 'Intermédiaire', description: 'Text-to-video et image-to-video, contrôle du mouvement et de la caméra, voix et lipsync, continuité entre les plans.',
      lecons: [
        {
          titre: 'Text-to-video et image-to-video',
          theorie: `<p>Les modèles vidéo (Runway Gen-3/4, Kling, Veo, Sora, Luma, Pika, Hailuo, Higgsfield, Wan…) génèrent des clips de 5 à 10 secondes (parfois plus) à partir d'un texte ou d'une image. Deux modes, deux logiques.</p>
<h2>Text-to-video (T2V)</h2>
<p>Un prompt → une vidéo. Rapide pour explorer, mais peu de contrôle sur l'apparence exacte : chaque génération réinvente le sujet. Idéal pour des plans d'ambiance (paysages, textures, foules, abstractions) où l'identité précise n'importe pas.</p>
<h2>Image-to-video (I2V) : la méthode pro</h2>
<p>Une image de départ (générée ou photographiée) → une vidéo qui l'anime. L'image fixe l'apparence, le cadrage, la lumière ; le prompt ne décrit que le <strong>mouvement</strong>. C'est ainsi qu'on obtient un personnage cohérent, un produit exact, une direction artistique maîtrisée. Le flux standard : images-clés soignées (module 1) → animation → montage.</p>
${code('text', `# Prompt I2V (l'image montre déjà le sujet et le décor) :
La barista verse lentement le lait, la mousse forme une rosette, légère vapeur montante,
caméra fixe avec un très léger zoom avant, mouvement naturel et calme, 24 images/s`)}
<p>Variantes : <strong>première + dernière image</strong> (start/end frame) pour contrôler le point d'arrivée ; <strong>extension</strong> d'un clip pour prolonger ; <strong>vidéo-to-vidéo</strong> pour restyler une vidéo réelle.</p>
<h2>Ce qui fonctionne bien… et moins bien</h2>
<table><tr><th>Fiable</th><th>Difficile</th></tr>
<tr><td>mouvements lents et amples (marche, vent, eau, fumée)</td><td>mouvements rapides et complexes (sport, combat)</td></tr>
<tr><td>mouvements de caméra simples</td><td>interactions précises entre objets (verser exactement dans la tasse)</td></tr>
<tr><td>portraits qui parlent peu, regards, sourires</td><td>mains manipulant des objets, texte, foules détaillées</td></tr>
<tr><td>un sujet, une action</td><td>plusieurs sujets avec actions différentes</td></tr></table>
<h2>Paramètres vidéo</h2>
<ul><li><strong>Durée</strong> : 5 s est la valeur sûre ; la cohérence se dégrade avec la longueur. Mieux vaut enchaîner des clips courts.</li><li><strong>Ratio</strong> : 9:16 pour TikTok/Reels/Shorts, 16:9 pour YouTube/site, 1:1 pour les flux.</li><li><strong>Résolution</strong> : 720p ou 1080p natif, upscaling vidéo ensuite (Topaz Video AI).</li><li><strong>Intensité de mouvement</strong> (motion strength) : bas = presque fixe et stable, haut = dynamique mais risqué.</li><li><strong>Seed</strong> et nombre de variantes.</li></ul>
<h2>Stratégie de génération</h2>
<ol><li>Générer 3 à 4 variantes par plan, choisir la meilleure.</li><li>Couper au montage les premières et dernières images si elles « hésitent ».</li><li>Prévoir des plans de coupe (B-roll) faciles à réussir pour masquer les plans ratés.</li><li>Budget : compter 20 à 40 % de clips inutilisables ; estimer les crédits en conséquence.</li></ol>
<div class="callout info"><b>Outils, en bref</b>Runway (contrôle, outils pros), Kling (mouvements humains, durées longues), Veo (qualité et respect du prompt, audio), Higgsfield (presets caméra et effets, produit), Luma/Pika (rapidité, effets), Wan/Hunyuan (open source, local). Teste-en deux ou trois : chacun a une « personnalité ».</div>`,
          exercice: {
            type: 'texte', titre: 'Prompt image-to-video',
            enonce: `<p>Tu disposes de l'image fixe d'un <strong>coureur au lever du soleil sur une plage</strong> (générée au module 1). Écris le prompt image-to-video : décris uniquement le mouvement du sujet, les éléments d'ambiance en mouvement, un mouvement de caméra simple, et indique durée et ratio pour une publication verticale. Ne redécris pas l'apparence du sujet (elle est dans l'image).</p>`,
            placeholder: 'Le coureur … , [éléments en mouvement], caméra …, 5 s, 9:16',
            criteres: [
              { label: 'Décrit le mouvement du sujet (verbe de mouvement)', re: /court|foul[ée]e|avance|respire|balance|acc[ée]l[èe]re|ralentit|se d[ée]place/i },
              { label: 'Éléments d\'ambiance en mouvement (vagues, vent, sable, lumière)', re: /vagues?|vent|cheveux|sable|embruns?|nuages?|reflets?|lumi[èe]re (qui )?(change|monte|bouge)|ombre/i },
              { label: 'Un mouvement de caméra simple et nommé', re: /cam[ée]ra (fixe|suit|accompagne|recule|avance|tourne|panoramique|travelling)|travelling|zoom (avant|arri[èe]re)|panoramique|plan fixe|steadicam|drone/i },
              { label: 'Rythme / intensité du mouvement précisé', re: /lent|calme|fluide|naturel|doux|dynamique|rapide|r[ée]gulier|stable/i },
              { label: 'Durée indiquée', re: /\d+\s?s(ec|econdes)?\b/i },
              { label: 'Ratio vertical 9:16', re: /9\s?:\s?16/ },
              { label: 'Ne redécrit pas l\'apparence (pas de couleur de vêtement/cheveux)', verif: t => !/t-shirt (rouge|bleu|vert|noir|blanc)|cheveux (blonds|bruns|noirs|roux)/i.test(t) },
              motsMin(25)
            ],
            solution: `<p>Le coureur avance d'une foulée régulière et fluide vers la caméra, respiration visible, les vagues roulent doucement sur le sable mouillé à sa gauche, embruns légers portés par le vent, lumière rasante qui scintille sur l'eau, caméra en travelling arrière lent qui accompagne le sujet à hauteur de poitrine, mouvement stable et naturel, 5 s, 9:16</p>`
          },
          quiz: [
            { q: 'Pourquoi l\'image-to-video est-il préféré pour un personnage récurrent ?', options: ['C\'est moins cher', 'L\'image fixe l\'apparence ; le prompt ne gère que le mouvement', 'Il génère des clips plus longs'], bonne: 1, explication: 'Le T2V réinvente le sujet à chaque fois ; l\'I2V part d\'une référence exacte.' },
            { q: 'Quelle durée de clip est la plus fiable ?', options: ['30 s', '5 s environ', '60 s'], bonne: 1, explication: 'La cohérence se dégrade avec la durée : on enchaîne des clips courts au montage.' },
            { q: 'Quel type de mouvement réussit le mieux ?', options: ['Rapide et complexe', 'Lent et ample', 'Plusieurs sujets simultanés'], bonne: 1, explication: 'Marche, vent, eau, caméra simple : les valeurs sûres.' }
          ]
        },
        {
          titre: 'Diriger la caméra et le mouvement',
          theorie: `<p>Un clip IA réussi se reconnaît à sa <strong>caméra</strong> : intentionnelle, stable, cinématographique. Les outils proposent désormais un vrai contrôle du mouvement (motion control) : presets de caméra, trajectoires, références de mouvement, pinceaux. Il faut parler le langage du cinéma.</p>
<h2>Le vocabulaire des mouvements de caméra</h2>
<table><tr><th>Terme</th><th>Mouvement</th><th>Effet</th></tr>
<tr><td><strong>Plan fixe</strong></td><td>aucune</td><td>calme, documentaire, laisse l'action parler</td></tr>
<tr><td><strong>Panoramique</strong> (pan/tilt)</td><td>rotation horizontale / verticale sur place</td><td>découvrir un lieu, suivre un sujet</td></tr>
<tr><td><strong>Travelling</strong> (dolly)</td><td>la caméra se déplace (avant, arrière, latéral)</td><td>immersion, tension (avant), révélation (arrière)</td></tr>
<tr><td><strong>Zoom</strong></td><td>changement de focale sans déplacement</td><td>focalisation ; le zoom lent est très utilisé</td></tr>
<tr><td><strong>Orbite / arc</strong></td><td>tourne autour du sujet</td><td>produit, héros, moment clé</td></tr>
<tr><td><strong>Grue / drone</strong></td><td>montée ou descente ample</td><td>ouverture et fin spectaculaires</td></tr>
<tr><td><strong>Caméra épaule / handheld</strong></td><td>légers tremblements</td><td>réalisme, urgence, UGC</td></tr>
<tr><td><strong>Rack focus</strong></td><td>la mise au point passe d'un plan à l'autre</td><td>diriger le regard</td></tr></table>
<h2>Prompter le mouvement</h2>
<p>Un mouvement de caméra + un mouvement de sujet + une vitesse. Pas plus. « Travelling avant lent vers le visage, le personnage lève les yeux » est exécutable ; « la caméra tourne, zoome, puis monte en drone pendant que trois personnes dansent » ne l'est pas en 5 secondes.</p>
${code('text', `# Révélation produit
Orbite lente de 90° autour du flacon, lumière qui glisse sur le verre, reflets qui se déplacent, fond stable

# Portrait émotion
Caméra fixe, très léger zoom avant, la femme tourne lentement la tête vers l'objectif et esquisse un sourire

# Paysage d'ouverture
Drone en montée lente et progressive au-dessus de la forêt brumeuse, révélant la vallée, nuages en mouvement lent

# Style UGC
Caméra épaule tenue à la main, légers mouvements naturels, la personne parle face caméra en marchant dans la rue`)}
<h2>Les outils de contrôle du mouvement</h2>
<ul><li><strong>Presets de caméra</strong> (Higgsfield, Runway, Kling) : « crash zoom », « dolly in », « orbit », « bullet time »… un clic, résultat prévisible. À privilégier pour la régularité.</li><li><strong>Trajectoires dessinées / pinceaux de mouvement</strong> (Runway Motion Brush, Kling motion brush) : on indique quelle zone bouge et dans quelle direction.</li><li><strong>Référence de mouvement</strong> (video-to-video, motion transfer) : une vidéo réelle (toi qui fais le geste) impose le mouvement à un personnage généré. Idéal pour la danse, les gestes précis, l'acting.</li><li><strong>Première/dernière image</strong> : définit le point de départ et d'arrivée ; le modèle interpole.</li></ul>
<h2>Erreurs fréquentes</h2>
<ul><li>Trop de mouvement : morphing, membres qui fondent. Réduire l'intensité.</li><li>Mouvement de caméra contradictoire avec l'image (zoom sur un plan déjà très serré).</li><li>Oublier l'arrière-plan : « fond stable » ou « arrière-plan défile » évite les surprises.</li><li>Vitesse non précisée : le modèle choisit souvent trop rapide.</li></ul>
<div class="callout info"><b>Règle du 3</b>Une intention de caméra, une action, une ambiance. Si tu veux plus, c'est un deuxième plan.</div>`,
          exercice: {
            type: 'qcm', titre: 'Associer intention et mouvement',
            enonce: `<p>Quelles associations intention → mouvement de caméra sont pertinentes ? (plusieurs réponses)</p>`,
            options: ['Révéler un produit sous tous ses angles → orbite lente', 'Créer une sensation d\'authenticité type témoignage → caméra épaule légère', 'Installer un lieu en ouverture → drone en montée lente', 'Rendre un plan dynamique en 5 s → enchaîner zoom, panoramique et orbite', 'Diriger l\'attention vers un détail → zoom avant lent ou rack focus', 'Montrer une danse complexe fidèlement → référence de mouvement (motion transfer)'],
            bonne: [0, 1, 2, 4, 5], multiple: true,
            explication: 'Enchaîner trois mouvements dans un clip de 5 s produit des artefacts : un mouvement par plan.'
          },
          quiz: [
            { q: 'Quelle différence entre travelling et zoom ?', options: ['Aucune', 'Le travelling déplace la caméra ; le zoom change la focale sans bouger', 'Le zoom est plus lent'], bonne: 1, explication: 'La perspective change avec un travelling, pas avec un zoom.' },
            { q: 'Comment imposer un geste précis à un personnage généré ?', options: ['Un prompt très long', 'Une référence de mouvement (vidéo réelle du geste)', 'Augmenter la durée'], bonne: 1, explication: 'Le motion transfer applique le mouvement filmé au personnage.' },
            { q: 'Ton clip présente du morphing et des membres déformés. Cause probable ?', options: ['Trop de mouvement demandé', 'Résolution trop élevée', 'Seed incorrecte'], bonne: 0, explication: 'Réduire l\'intensité et simplifier à une action.' }
          ]
        },
        {
          titre: 'Voix synthétiques, lipsync et avatars',
          theorie: `<p>Le son fait la moitié d'une vidéo. Les voix synthétiques (TTS) de nouvelle génération sont naturelles, multilingues, expressives ; le <strong>lipsync</strong> fait parler un personnage généré ou une photo ; les <strong>avatars</strong> transforment un script en présentateur. Voici le pipeline audio d'une vidéo IA.</p>
<h2>Text-to-speech : les voix</h2>
<p><strong>ElevenLabs</strong> est la référence (expressivité, clonage, 30+ langues) ; alternatives : OpenAI TTS, Google, Azure, Cartesia, PlayHT, et des modèles open source (XTTS, Kokoro). Paramètres clés : <em>stabilité</em> (constance vs expressivité), <em>similarité</em> (fidélité à la voix de référence), <em>style</em>, <em>vitesse</em>. Pour la narration : stabilité moyenne-haute ; pour un personnage : plus basse.</p>
<p>Écrire pour la voix : phrases courtes, ponctuation qui guide le rythme (virgules, points de suspension pour une pause, point d'exclamation mesuré), chiffres en lettres si l'outil hésite, mots étrangers phonétisés si besoin. Générer phrase par phrase pour reprendre une seule phrase sans tout refaire.</p>
<h2>Clonage de voix</h2>
<p>Avec 1 à 5 minutes d'audio propre, on clone une voix. <strong>Uniquement la sienne ou avec consentement écrit explicite</strong> : cloner la voix d'autrui sans accord est illégal (droit à la voix, usurpation) et les plateformes vérifient. Usage légitime : décliner sa propre voix en dix langues, produire plus vite, préserver une continuité.</p>
<h2>Lipsync</h2>
<p>On fournit une vidéo (ou une image) d'un visage et un fichier audio ; l'outil synchronise les lèvres (Runway Lip Sync, Kling lip sync, Sync Labs, Hedra, HeyGen, Higgsfield). Conseils : visage de face ou trois quarts, bien éclairé, bouche visible, pas de main devant ; audio clair sans musique ; plans de 5 à 15 s. Le lipsync sur une image fixe donne un « portrait parlant » ; sur un clip généré, un personnage vivant.</p>
<h2>Avatars</h2>
<p>HeyGen, Synthesia, D-ID, Higgsfield : un présentateur (générique, ou votre clone vidéo) lit votre script, dans la langue voulue, avec traduction et lipsync automatiques. Parfait pour la formation, les explications, la communication interne, les vidéos multilingues. Limite : le rendu « présentateur » est reconnaissable ; pour des contenus émotionnels ou créatifs, privilégier image-clé + I2V + lipsync.</p>
<h2>Musique et sons</h2>
<p>Musique générée (Suno, Udio, Stable Audio, bibliothèques libres de droits comme Epidemic Sound, Artlist) ; effets sonores (ElevenLabs SFX, Freesound) ; ambiances. Mixage : voix au premier plan (−6 dB), musique en dessous (−18 à −24 dB sous la voix, « ducking » automatique dans CapCut/DaVinci), effets ponctuels pour souligner les coupes.</p>
<h2>Pipeline audio type</h2>
<ol><li>Script final (lu à voix haute : durée, respiration).</li><li>Génération de la voix, phrase par phrase, export WAV/MP3.</li><li>Montage image calé sur la voix (la voix mène le rythme).</li><li>Lipsync des plans parlés.</li><li>Musique et SFX, mixage, normalisation (−14 LUFS pour les réseaux).</li></ol>
<div class="callout warn"><b>Transparence</b>Une voix ou un visage synthétique présentés comme réels trompent le public ; les plateformes exigent de plus en plus un marquage « contenu généré par IA ». Le module 5 détaille le cadre.</div>`,
          exercice: {
            type: 'texte', titre: 'Écrire un script pour la voix',
            enonce: `<p>Écris le <strong>script voix-off d'une vidéo de 30 secondes</strong> présentant une application de méditation (environ 70 à 85 mots, c'est le débit naturel). Il doit : accrocher dès la première phrase, utiliser des phrases courtes, inclure des indications de pause (points de suspension ou [pause]), se terminer par un appel à l'action, et préciser en tête les réglages de voix souhaités (ton, stabilité, vitesse).</p>`,
            placeholder: 'Réglages : voix …, ton …, stabilité …, vitesse …\n\nScript :\n…',
            criteres: [
              { label: 'Réglages de voix précisés (ton / stabilité / vitesse)', re: /stabilit|vitesse|ton\s*:|voix\s*:/i },
              { label: 'Accroche : la première phrase du script est une question ou une affirmation forte et courte', verif: t => { const s = t.split(/script\s*:/i)[1] || t; const first = s.trim().split(/[.!?…]/)[0]; return first && first.trim().split(/\s+/).length <= 12; } },
              { label: 'Phrases courtes (moyenne ≤ 14 mots)', verif: t => { const s = (t.split(/script\s*:/i)[1] || t).replace(/\[pause\]/gi, ''); const ph = s.split(/[.!?…]+/).map(x => x.trim()).filter(Boolean); return ph.length >= 4 && ph.reduce((a, p) => a + p.split(/\s+/).length, 0) / ph.length <= 14; } },
              { label: 'Au moins une pause indiquée (… ou [pause])', re: /…|\.\.\.|\[pause\]/ },
              { label: 'Appel à l\'action final (télécharge, essaie, découvre, commence…)', re: /t[ée]l[ée]charge|essaie|essayez|d[ée]couvre|commence|rejoins|inscri|clique|lien/i },
              { label: 'Longueur du script entre 60 et 100 mots', verif: t => { const s = t.split(/script\s*:/i)[1] || t; const n = s.replace(/\[pause\]/gi, '').trim().split(/\s+/).length; return n >= 60 && n <= 100; } }
            ],
            solution: `<p>Réglages : voix féminine chaleureuse, ton posé et bienveillant, stabilité 60 %, similarité 75 %, vitesse légèrement lente.</p><p>Script : Tu as cinq minutes ? … C'est tout ce qu'il faut pour respirer vraiment. [pause] Calme t'accompagne, chaque jour, à ton rythme. Des séances courtes. Des voix douces. Aucune pression. [pause] Le matin pour bien démarrer… le soir pour lâcher prise. Tu choisis. Et quand la journée déborde, une minute suffit pour revenir à toi. [pause] Des milliers de personnes ont déjà trouvé leur calme. Et toi ? … Télécharge Calme, et offre-toi cinq minutes, dès ce soir.</p>`
          },
          quiz: [
            { q: 'Dans quel cas le clonage d\'une voix est-il acceptable ?', options: ['Pour n\'importe quelle voix trouvée en ligne', 'Sa propre voix ou avec le consentement écrit explicite de la personne', 'Pour les voix de personnalités publiques'], bonne: 1, explication: 'Cloner sans accord est illégal et contraire aux conditions des plateformes.' },
            { q: 'Qu\'exige un bon lipsync ?', options: ['Un visage de face bien éclairé et un audio clair', 'Une musique forte', 'Un plan très large'], bonne: 0, explication: 'Bouche visible, pas d\'occlusion, audio sans musique.' },
            { q: 'À quel niveau placer la musique sous une voix-off ?', options: ['Au même niveau', 'Nettement en dessous (−18 à −24 dB), avec ducking', 'Plus fort pour l\'énergie'], bonne: 1, explication: 'La voix doit rester intelligible ; le ducking baisse la musique automatiquement quand la voix parle.' }
          ]
        },
        {
          titre: 'Continuité et montage de plans générés',
          theorie: `<p>Une vidéo IA, c'est rarement un clip : c'est une <strong>séquence</strong> de 5 à 15 plans de quelques secondes, assemblés. La qualité perçue dépend de la <strong>continuité</strong> (même monde, même personnage, même lumière) et du <strong>montage</strong> (rythme, raccords). Voici comment passer de clips isolés à un film.</p>
<h2>Planifier avant de générer : le storyboard</h2>
<p>Liste chaque plan : numéro, durée, cadrage, action, mouvement de caméra, texte/voix associée. Un tableau suffit. Il évite de générer au hasard et révèle les plans difficiles à l'avance.</p>
${code('text', `#  Durée  Cadrage        Action / caméra                          Voix
1  3 s    Plan large     Ville à l'aube, drone montée lente         (musique)
2  4 s    Plan moyen     Héroïne sort d'un immeuble, marche, suivi  « Chaque matin… »
3  3 s    Gros plan      Elle regarde son téléphone, sourit         « …une idée. »
4  5 s    Insert         Écran de l'app, défilement                 « Avec Brume, … »`)}
<h2>Les techniques de continuité</h2>
<ul><li><strong>Images-clés cohérentes</strong> (module 1) : même personnage (référence), même palette, même heure de la journée dans les prompts.</li><li><strong>Dernière image → première image</strong> : exporter la dernière frame d'un clip et l'utiliser comme image de départ du suivant (ou en start/end frame) : raccord parfait.</li><li><strong>Extension de clip</strong> : prolonger un plan réussi plutôt que d'en générer un nouveau.</li><li><strong>Décor de référence</strong> : une image large du lieu, réutilisée en image-to-image pour chaque angle.</li><li><strong>Étalonnage uniforme</strong> au montage (même LUT / mêmes réglages couleur) : gomme les écarts de rendu entre clips.</li></ul>
<h2>Les raccords qui masquent les défauts</h2>
<ul><li><strong>Couper dans le mouvement</strong> : une coupe pendant une action paraît naturelle.</li><li><strong>Plan de coupe / insert</strong> (détail, objet, paysage) entre deux plans qui ne raccordent pas.</li><li><strong>Changement d'axe franc</strong> (plan large → gros plan) : on accepte la différence, contrairement à deux plans presque identiques.</li><li><strong>Couper les premières et dernières images</strong> des clips générés, souvent instables.</li><li><strong>Ralenti léger</strong> (80-90 %) : lisse un mouvement saccadé ; interpolation d'images (Topaz, RIFE) pour un vrai slow motion.</li></ul>
<h2>Rythme</h2>
<p>Sur un format court : plans de 1,5 à 3 s, coupe sur les temps forts de la musique ou les mots-clés de la voix. Sur un format explicatif : 3 à 6 s. Un plan généré de 5 s est souvent meilleur coupé à 2,5 s : on ne garde que la meilleure portion.</p>
<h2>Transitions</h2>
<p>La coupe franche dans 90 % des cas. Fondu pour un changement de temps/lieu. Les transitions « whip », zoom, glitch : avec parcimonie, pour un style précis. Les outils IA proposent aussi des transitions générées (morphing entre deux images) : spectaculaires, à ne pas abuser.</p>
<h2>Vérification finale</h2>
<p>Regarder la séquence en entier, sans son, puis avec : chaque coupe est-elle motivée ? le personnage est-il reconnaissable d'un plan à l'autre ? la lumière saute-t-elle ? y a-t-il un plan « IA évident » (morphing, main) à remplacer ou raccourcir ?</p>
<div class="callout info"><b>Le film est fait au montage</b>Générer, c'est 30 % du travail. Sélection, raccords, rythme et son font le reste. Un montage soigné de clips moyens bat une suite de clips parfaits mal assemblés.</div>`,
          exercice: {
            type: 'texte', titre: 'Storyboarder une séquence',
            enonce: `<p>Rédige le storyboard d'une vidéo de <strong>20 à 30 secondes</strong> présentant une application de livraison de repas : au moins 6 plans numérotés, chacun avec durée, cadrage (large/moyen/gros plan/insert), action et mouvement de caméra, et la ligne de voix ou de texte associée. Prévois au moins un plan de coupe (insert) et indique comment assurer la continuité du personnage principal.</p>`,
            placeholder: '1. 3 s — Plan large — … — caméra … — Voix : « … »\n2. …\nContinuité : …',
            criteres: [
              { label: 'Au moins 6 plans numérotés', verif: t => (t.match(/^\s*\d+[.)]/gm) || []).length >= 6 },
              { label: 'Durées indiquées pour les plans', verif: t => (t.match(/\d+([.,]\d)?\s?s\b/g) || []).length >= 6 },
              { label: 'Cadrages variés (large, moyen, gros plan, insert)', verif: t => ['large', 'moyen', 'gros plan', 'insert'].filter(c => new RegExp(c, 'i').test(t)).length >= 3 },
              { label: 'Mouvements de caméra précisés', re: /travelling|panoramique|zoom|orbite|drone|fixe|[ée]paule|suivi|dolly/i },
              { label: 'Voix ou texte associé aux plans', re: /voix|texte|«|"/i },
              { label: 'Méthode de continuité explicitée (référence, dernière image, palette…)', re: /continuit|r[ée]f[ée]rence|derni[èe]re (image|frame)|m[êe]me (personnage|palette|lumi[èe]re)|cref|lora|planche/i },
              motsMin(90)
            ],
            solution: `<p>1. 3 s — Plan large — Rue animée en fin de journée, lumière dorée — drone descente lente — Voix : « Il est 19 h. » 2. 3 s — Plan moyen — Léa (personnage de référence) rentre chez elle, pose ses clés — caméra épaule légère, suivi — Voix : « Tu as faim, et zéro envie de cuisiner. » 3. 2 s — Gros plan — Elle ouvre l'app sur son téléphone, sourire — fixe, zoom avant léger — Voix : « Miam, c'est trois clics. » 4. 3 s — Insert — Écran : choix d'un plat, bouton commander — fixe — Texte : « Commande en 3 clics ». 5. 4 s — Plan moyen — Livreur à vélo dans la rue, sac isotherme — travelling latéral — Voix : « Préparé par des restaurants d'ici, livré en vingt minutes. » 6. 3 s — Gros plan — Léa ouvre la boîte fumante, buée — fixe — Voix : « Chaud. Exactement comme tu l'imaginais. » 7. 3 s — Plan moyen — Léa sur son canapé, première bouchée — zoom arrière lent — Voix : « Miam. Télécharge l'app. » Continuité : planche de référence de Léa avec cref dans chaque image-clé, même tenue (pull bordeaux), même heure (lumière dorée puis intérieur chaud), dernière image du plan 2 réutilisée comme première image du plan 3, étalonnage unique au montage.</p>`
          },
          quiz: [
            { q: 'Comment obtenir un raccord parfait entre deux clips générés ?', options: ['Les générer avec le même prompt', 'Utiliser la dernière image du premier comme image de départ du second', 'Ajouter un fondu'], bonne: 1, explication: 'Le second clip part exactement de l\'état final du premier.' },
            { q: 'Deux plans ne raccordent pas bien. Solution de montage ?', options: ['Un plan de coupe (insert) entre les deux', 'Allonger les deux plans', 'Mettre une transition glitch'], bonne: 0, explication: 'L\'insert casse la comparaison directe entre les deux plans.' },
            { q: 'Quelle durée de plan sur un format court ?', options: ['10 s', '1,5 à 3 s', '6 à 8 s'], bonne: 1, explication: 'Le rythme rapide retient l\'attention ; on garde la meilleure portion de chaque clip.' }
          ]
        }
      ]
    },
    {
      titre: 'Formats courts : TikTok, Reels, Shorts', niveau: 'Intermédiaire', description: 'L\'anatomie d\'une vidéo verticale qui retient, le storytelling en 30 secondes, le son et les sous-titres, la publication et l\'analyse.',
      lecons: [
        {
          titre: 'Anatomie d\'une vidéo verticale qui retient',
          theorie: `<p>Sur TikTok, Instagram Reels et YouTube Shorts, une vidéo a <strong>une à deux secondes</strong> pour convaincre le spectateur de ne pas faire défiler. Tout le format est conçu autour de cette contrainte. L'IA produit les images ; la structure, elle, obéit à des règles éprouvées.</p>
<h2>Le format</h2>
<ul><li><strong>9:16</strong>, 1080×1920 px, 24 à 30 i/s (60 pour l'action), H.264/MP4.</li><li>Durée : 7 à 15 s pour la viralité pure, 20 à 45 s pour expliquer, jusqu'à 60-90 s si la rétention tient.</li><li><strong>Zones sûres</strong> : garder le texte et les visages au centre ; le bas (boutons, légende) et la droite (icônes) sont masqués par l'interface. Prévoir ~250 px de marge en bas, ~120 px en haut.</li><li>Son activé par défaut sur TikTok, souvent coupé sur Reels/Shorts : la vidéo doit fonctionner <em>avec et sans</em> son (sous-titres).</li></ul>
<h2>La structure en quatre temps</h2>
<ol><li><strong>Hook (0-2 s)</strong> : une image surprenante, un mouvement, un texte à l'écran qui pose une question ou une promesse. « Voici l'erreur que font 90 % des gens », « J'ai testé ça pendant 30 jours », un avant/après, un résultat montré d'abord.</li><li><strong>Tension / développement (2-20 s)</strong> : une idée à la fois, un changement visuel toutes les 1,5 à 3 s, du texte qui souligne les mots-clés.</li><li><strong>Payoff</strong> : la réponse, la révélation, le résultat.</li><li><strong>CTA / boucle</strong> : une phrase d'action (« enregistre pour plus tard », « partie 2 en commentaire ») ou une fin qui reboucle sur le début pour relancer la lecture (loop).</li></ol>
<h2>Les leviers de rétention</h2>
<ul><li><strong>Rythme</strong> : coupes fréquentes, zooms ponctuels, changements d'angle.</li><li><strong>Texte à l'écran</strong> : gros, contrasté, 3 à 6 mots à la fois, synchronisé.</li><li><strong>Mouvement permanent</strong> : jamais un plan figé plus de 2 s (l'I2V avec léger mouvement de caméra est parfait pour cela).</li><li><strong>Boucle ouverte</strong> : annoncer quelque chose qui vient (« et le troisième point va vous surprendre »).</li><li><strong>Son</strong> : tendance ou musique rythmée, effets sur les coupes.</li></ul>
<h2>Formats qui marchent avec l'IA</h2>
<table><tr><th>Format</th><th>Comment l'IA aide</th></tr>
<tr><td>Fait / liste (« 3 choses que… »)</td><td>une image-clé par point, animée en I2V, texte à l'écran</td></tr>
<tr><td>Avant / après, transformation</td><td>deux images cohérentes + transition générée</td></tr>
<tr><td>Histoire courte / micro-fiction</td><td>personnage cohérent, 5-8 plans, voix-off</td></tr>
<tr><td>Explication visuelle</td><td>métaphores visuelles impossibles à filmer</td></tr>
<tr><td>Produit en situation</td><td>product shots animés, orbites, lumière</td></tr>
<tr><td>Présentateur / avatar</td><td>face caméra avec lipsync, sous-titres dynamiques</td></tr></table>
<h2>L'algorithme, en bref</h2>
<p>Les plateformes testent chaque vidéo sur un petit groupe et mesurent : <strong>taux de visionnage à 3 s</strong>, <strong>durée moyenne de visionnage / rétention</strong>, <strong>rejeux</strong>, partages, enregistrements, commentaires. Bonne performance → audience élargie. Les deux métriques reines : le hook (3 s) et la rétention. Les abonnés comptent peu ; chaque vidéo joue sa chance.</p>
<div class="callout info"><b>Le piège de la belle vidéo</b>Une vidéo IA magnifique mais sans hook ni rythme fera 200 vues. Une vidéo simple avec un vrai hook et un bon rythme en fera 50 000. Le visuel sert la structure, pas l'inverse.</div>`,
          exercice: {
            type: 'texte', titre: 'Concevoir un hook et une structure',
            enonce: `<p>Pour une vidéo courte (20 s) sur le thème « pourquoi tu te réveilles fatigué même après 8 h de sommeil », rédige : (1) trois propositions de <strong>hook</strong> différentes (texte à l'écran + visuel), (2) la structure en quatre temps avec le timing, (3) le CTA final. Indique pour chaque hook le mécanisme utilisé (question, promesse, contradiction, résultat d'abord…).</p>`,
            placeholder: 'Hook 1 (mécanisme : …) : texte « … » / visuel : …\nHook 2 …\nHook 3 …\nStructure : 0-2 s … / 2-… s … / … / CTA : …',
            criteres: [
              { label: 'Trois hooks distincts proposés', verif: t => (t.match(/hook\s*\d/gi) || []).length >= 3 },
              { label: 'Mécanisme de chaque hook nommé', verif: t => (t.match(/m[ée]canisme/gi) || []).length >= 3 || (t.match(/question|promesse|contradiction|r[ée]sultat|avant\/apr[èe]s|chiffre|curiosit/gi) || []).length >= 3 },
              { label: 'Texte à l\'écran proposé pour les hooks (entre guillemets)', verif: t => (t.match(/«[^»]+»|"[^"]+"/g) || []).length >= 3 },
              { label: 'Un visuel décrit pour le hook', re: /visuel|image|plan|gros plan|personnage|[ée]cran/i },
              { label: 'Structure avec timings (secondes)', verif: t => (t.match(/\d+\s?(-|à|–)\s?\d+\s?s|\d+\s?s/g) || []).length >= 3 },
              { label: 'Un payoff / révélation', re: /payoff|r[ée]v[ée]lation|r[ée]ponse|la raison|la cause|solution/i },
              { label: 'Un CTA final', re: /cta|enregistre|abonne|commente|partage|partie 2|suis-moi|lien/i },
              motsMin(90)
            ],
            solution: `<p>Hook 1 (mécanisme : contradiction) : texte « 8 h de sommeil. Toujours épuisé. » / visuel : gros plan d'un réveil affichant 7:00, personnage les yeux cernés qui l'éteint, zoom lent. Hook 2 (mécanisme : promesse) : texte « La vraie raison de ta fatigue en 20 s » / visuel : I2V d'un cerveau stylisé qui s'allume par zones. Hook 3 (mécanisme : résultat d'abord) : texte « J'ai changé une chose, je me réveille en forme » / visuel : avant/après du même personnage, fatigué puis frais, transition générée. Structure : 0-2 s hook ; 2-8 s « ce n'est pas la durée, c'est le moment du réveil » avec courbe des cycles de sommeil animée ; 8-15 s les cycles de 90 min, se réveiller en fin de cycle ; 15-18 s payoff : « calcule ton heure de coucher : 7 h 30 ou 6 h avant le réveil » ; 18-20 s CTA : « Enregistre pour tester ce soir. Partie 2 : la lumière du matin. »</p>`
          },
          quiz: [
            { q: 'Combien de temps a une vidéo verticale pour retenir le spectateur ?', options: ['10 secondes', '1 à 2 secondes', '30 secondes'], bonne: 1, explication: 'D\'où l\'importance capitale du hook.' },
            { q: 'Pourquoi des sous-titres sur un Reel ?', options: ['Pour le style', 'Parce que beaucoup regardent sans le son', 'C\'est obligatoire'], bonne: 1, explication: 'La vidéo doit fonctionner avec et sans son.' },
            { q: 'Quelles métriques pèsent le plus dans la diffusion ?', options: ['Le nombre d\'abonnés', 'Le taux de visionnage à 3 s et la rétention', 'La résolution'], bonne: 1, explication: 'Chaque vidéo est testée sur un petit groupe avant d\'être élargie.' }
          ]
        },
        {
          titre: 'Storytelling en 30 secondes',
          theorie: `<p>Même en 30 secondes, ce qui retient et fait partager, c'est une <strong>histoire</strong> : un personnage, un problème, une transformation. Les structures narratives classiques se compressent très bien, et l'IA permet de les illustrer sans tournage.</p>
<h2>Les structures qui tiennent en 30 s</h2>
<table><tr><th>Structure</th><th>Schéma</th><th>Exemple</th></tr>
<tr><td><strong>Problème → Solution → Résultat</strong></td><td>douleur, découverte, après</td><td>« Mes plantes mouraient. J'ai testé ce capteur. Trois mois après… »</td></tr>
<tr><td><strong>Avant / Après</strong></td><td>état initial, transformation, état final</td><td>rénovation, apprentissage, routine</td></tr>
<tr><td><strong>Et si… ?</strong></td><td>hypothèse, exploration, chute</td><td>« Et si les chats dirigeaient le monde ? » (micro-fiction IA)</td></tr>
<tr><td><strong>Liste à rebours</strong></td><td>3… 2… 1 avec le meilleur en dernier</td><td>« 3 outils IA gratuits, le 3e est fou »</td></tr>
<tr><td><strong>Le parcours du héros compressé</strong></td><td>désir, obstacle, aide, victoire</td><td>histoire de marque, témoignage</td></tr>
<tr><td><strong>La chute</strong></td><td>mise en place sérieuse, retournement final</td><td>humour, surprise, boucle</td></tr></table>
<h2>Écrire le script</h2>
<p>Un script de 30 s fait 70 à 85 mots en voix-off (débit normal), ou 5 à 8 textes à l'écran si muet. Méthode :</p>
<ol><li><strong>Une phrase</strong> : de quoi parle la vidéo et ce que le spectateur emporte (« après cette vidéo, tu sauras calculer ton heure de coucher »).</li><li><strong>Le hook</strong> (leçon précédente).</li><li><strong>Trois temps</strong> maximum au milieu. Chaque temps = une idée = un visuel.</li><li><strong>La chute ou le résultat</strong>.</li><li><strong>Le CTA</strong>, en une phrase.</li><li>Lire à voix haute, chronométrer, couper 20 %.</li></ol>
<h2>Émotion et spécificité</h2>
<p>Ce qui marque : les détails concrets (« 6 h 12 », « le pot bleu près de la fenêtre ») plutôt que le général ; une émotion identifiable (surprise, soulagement, fierté, tendresse, rire) ; un personnage auquel s'identifier (le spectateur doit se dire « c'est moi »). L'IA permet d'illustrer littéralement ces détails : demande-les dans tes prompts.</p>
<h2>Du script au storyboard</h2>
<p>Chaque phrase du script → un visuel. Note le cadrage et l'émotion du plan. Varie les échelles (large/moyen/gros plan) pour le rythme. Puis génère les images-clés avec le personnage de référence, anime en I2V, monte sur la voix.</p>
${code('text', `Script (problème → solution → résultat), 28 s :
[Hook, gros plan plante fanée] « Mes plantes mouraient toutes. Toutes. »
[Plan moyen, personnage perplexe] « J'arrosais trop. Ou pas assez. Impossible de savoir. »
[Insert, capteur dans le pot] « Alors j'ai mis ce petit capteur dans le pot. »
[Gros plan téléphone, notification] « Il m'envoie un message quand elle a soif. C'est tout. »
[Plan large, fenêtre pleine de plantes vertes] « Trois mois plus tard… regardez. »
[Texte] « Lien en bio. Et toi, tu arroses trop ou pas assez ? »`)}
<div class="callout info"><b>Test du « et alors ? »</b>Après chaque phrase, demande-toi « et alors ? ». Si la réponse n'est pas évidente et intéressante, la phrase saute ou se réécrit. Un script de 30 s n'a pas de place pour le remplissage.</div>`,
          exercice: {
            type: 'texte', titre: 'Écrire un script narratif de 30 secondes',
            enonce: `<p>Écris le script complet (voix-off + indication visuelle entre crochets pour chaque phrase) d'une vidéo de 30 s racontant une <strong>micro-histoire</strong> au choix : un artisan qui lance sa boutique en ligne, ou une personne qui apprend à coder le soir. Structure imposée : problème → solution → résultat, avec un hook, des détails concrets (chiffres, objets, lieux), une émotion, et un CTA. 60 à 95 mots de voix-off.</p>`,
            placeholder: '[Visuel] « Phrase de voix-off. »\n[Visuel] « … »',
            criteres: [
              { label: 'Au moins 5 indications visuelles entre crochets', verif: t => (t.match(/\[[^\]]+\]/g) || []).length >= 5 },
              { label: 'Un problème clairement posé au début', re: /probl[èe]me|impossible|n.arrivais|galère|[ée]chou|perdu|trop|pas assez|peur|jamais|mourai|bloqu/i },
              { label: 'Une solution / un déclic', re: /alors|puis|jusqu.au jour|j.ai (test|essay|d[ée]couvert|commenc)|solution|d[ée]clic/i },
              { label: 'Un résultat concret (chiffre, délai, état final)', re: /\d+\s?(jours|semaines|mois|commandes|clients|euros|€|lignes|heures|h\b)|aujourd.hui|maintenant|trois mois|six mois/i },
              { label: 'Un détail concret (objet, lieu, heure)', re: /\d{1,2}\s?h|cuisine|atelier|table|fen[êe]tre|caf[ée]|lampe|carton|ordinateur|clavier|pot|boutique|[ée]cran/i },
              { label: 'Un CTA final', re: /lien|abonne|commente|partage|enregistre|et toi|suis|rejoins/i },
              { label: 'Voix-off entre 60 et 95 mots (hors crochets)', verif: t => { const n = t.replace(/\[[^\]]+\]/g, '').trim().split(/\s+/).length; return n >= 60 && n <= 95; } }
            ],
            solution: `<p>[Gros plan, mains couvertes d'argile, atelier sombre] « Pendant dix ans, mes bols sont restés sur une étagère. » [Plan moyen, Samir devant un marché vide, pluie] « Les marchés ? Trois ventes un dimanche de pluie. Je voulais arrêter. » [Insert, écran d'ordinateur sur la table de la cuisine, 23 h] « Puis un soir, à 23 h, j'ai ouvert une boutique en ligne. Deux heures. Six photos. » [Gros plan, notification « nouvelle commande »] « La première commande est arrivée de Lille. Je ne connais personne à Lille. » [Plan large, atelier éclairé, cartons empilés] « Trois mois plus tard : 140 commandes, et un deuxième four. » [Plan moyen, Samir sourit face caméra] « Si tu fabriques quelque chose de tes mains… montre-le. Lien en bio. »</p>`
          },
          quiz: [
            { q: 'Combien de mots de voix-off pour 30 secondes ?', options: ['30', '70 à 85', '150'], bonne: 1, explication: 'Au débit naturel, environ 2,5 mots par seconde.' },
            { q: 'Qu\'est-ce qui rend une micro-histoire mémorable ?', options: ['Des généralités', 'Des détails concrets et une émotion identifiable', 'Une durée longue'], bonne: 1, explication: 'Le spectateur s\'identifie au concret.' },
            { q: 'Quelle règle pour le milieu du script ?', options: ['Autant d\'idées que possible', 'Trois temps maximum, une idée par visuel', 'Pas de visuel'], bonne: 1, explication: 'Chaque phrase correspond à un plan ; au-delà de trois temps, on perd le spectateur.' }
          ]
        },
        {
          titre: 'Sous-titres, son et habillage',
          theorie: `<p>L'habillage transforme des plans en contenu « plateforme » : sous-titres dynamiques, texte à l'écran, musique, effets sonores, identité visuelle. C'est aussi ce qui rend la vidéo lisible sans son et reconnaissable au premier coup d'œil.</p>
<h2>Sous-titres</h2>
<ul><li><strong>Générés automatiquement</strong> (CapCut, Descript, Premiere, DaVinci, Submagic, Opus) depuis la voix ; relire et corriger (noms propres, homophones).</li><li><strong>Style</strong> : police lisible et grasse (Montserrat, Inter, Poppins), taille importante, contour ou fond pour le contraste, placés au centre ou au tiers inférieur <em>dans la zone sûre</em>.</li><li><strong>Dynamiques</strong> : 1 à 4 mots affichés à la fois, le mot courant surligné en couleur : la lecture suit la voix, l'attention reste.</li><li><strong>Hiérarchie</strong> : sous-titres pour la voix ; <strong>titres à l'écran</strong> (plus gros, plus courts) pour les idées-clés et le hook.</li></ul>
<h2>Musique</h2>
<p>Choisir la musique <em>avant</em> le montage fin : elle impose le rythme. Sur TikTok/Reels, utiliser un son de la bibliothèque de la plateforme (tendance, droits couverts pour les comptes personnels ; les comptes professionnels doivent utiliser la bibliothèque commerciale). Hors plateforme : musique générée (Suno, Udio : vérifier la licence commerciale), banques (Epidemic Sound, Artlist, Uppbeat). Caler les coupes sur les temps forts.</p>
<h2>Effets sonores et voix</h2>
<p>Un « whoosh » sur un changement de plan, un « pop » sur l'apparition d'un texte, un son d'ambiance sous les plans IA (qui sont muets) : les SFX donnent de la matière. Pas plus d'un effet par coupe. La voix reste au-dessus de tout (ducking).</p>
<h2>Identité visuelle</h2>
<ul><li>Une palette (2-3 couleurs), une police de titres, une police de sous-titres : identiques sur toutes les vidéos.</li><li>Un <strong>élément signature</strong> : intro de 0,5 s, cadre, position du logo (discret, dans la zone sûre), style d'image IA cohérent (référence de style).</li><li>Le personnage récurrent ou l'avatar : identité forte, reconnaissance immédiate dans le flux.</li></ul>
<h2>Les outils</h2>
<table><tr><th>Outil</th><th>Point fort</th></tr>
<tr><td><strong>CapCut</strong></td><td>gratuit, mobile et ordinateur, sous-titres auto, templates, tout-en-un pour les formats courts</td></tr>
<tr><td><strong>DaVinci Resolve</strong></td><td>gratuit, niveau professionnel : montage, étalonnage, son, effets</td></tr>
<tr><td><strong>Premiere Pro / After Effects</strong></td><td>standard de l'industrie, animations de texte avancées</td></tr>
<tr><td><strong>Descript</strong></td><td>montage par le texte (transcription), suppression des silences</td></tr>
<tr><td><strong>Canva</strong></td><td>habillage simple, templates, pour les non-monteurs</td></tr></table>
<h2>Export</h2>
<p>1080×1920, H.264, 25 ou 30 i/s, débit 10-15 Mb/s, audio AAC 192 kb/s, −14 LUFS. Un fichier par plateforme si les zones sûres diffèrent. Vérifier sur téléphone avant de publier.</p>
<div class="callout info"><b>Lisible en un coup d'œil</b>Le test : mettre la vidéo en pause à n'importe quel moment. Comprend-on l'idée du moment grâce au texte à l'écran ? Si non, l'habillage manque.</div>`,
          exercice: {
            type: 'qcm', titre: 'Habillage : vrai ou faux',
            enonce: `<p>Quelles affirmations sont correctes ? (plusieurs réponses)</p>`,
            options: ['Les sous-titres se placent en bas de l\'image, sous la zone des boutons', 'Afficher 1 à 4 mots à la fois avec le mot courant surligné améliore la rétention', 'Choisir la musique après le montage permet de mieux caler le rythme', 'Un compte professionnel ne peut pas utiliser n\'importe quel son tendance (droits commerciaux)', 'La voix doit rester au-dessus de la musique (ducking)', 'Exporter en 1080×1920 H.264 autour de −14 LUFS est adapté aux réseaux'],
            bonne: [1, 3, 4, 5], multiple: true,
            explication: 'Les sous-titres doivent être dans la zone sûre (centre/tiers inférieur, au-dessus de l\'interface), et la musique se choisit avant le montage fin car elle impose le rythme.'
          },
          quiz: [
            { q: 'Pourquoi des sous-titres « mot par mot » surlignés ?', options: ['Pour la taille de fichier', 'La lecture suit la voix et retient l\'attention', 'Par tradition'], bonne: 1, explication: 'C\'est le style dominant des formats courts performants.' },
            { q: 'Quel outil gratuit couvre montage, sous-titres auto et templates pour mobile ?', options: ['After Effects', 'CapCut', 'Photoshop'], bonne: 1, explication: 'CapCut est l\'outil d\'entrée de gamme le plus utilisé pour les formats courts.' },
            { q: 'Que vérifier avant de publier ?', options: ['Rien, l\'export suffit', 'Le rendu sur téléphone : zones sûres, lisibilité, son', 'La durée du rendu'], bonne: 1, explication: 'La vidéo sera vue sur mobile : il faut la contrôler sur mobile.' }
          ]
        },
        {
          titre: 'Publier, analyser, itérer',
          theorie: `<p>Publier n'est pas la fin : c'est le début de la boucle d'apprentissage. Les plateformes donnent des données précises ; les lire transforme chaque vidéo en expérience et chaque compte en machine à progresser.</p>
<h2>Préparer la publication</h2>
<ul><li><strong>Légende</strong> : une première ligne qui complète le hook (elle s'affiche tronquée), un contexte court, une question pour les commentaires. Mots-clés naturels : les plateformes indexent le texte (et la voix) pour la recherche.</li><li><strong>Hashtags</strong> : 3 à 5, précis (niche + thème), pas de #fyp inutiles.</li><li><strong>Miniature / couverture</strong> : pour la grille du profil (image-clé IA parfaite avec titre lisible).</li><li><strong>Horaire</strong> : quand ton audience est active (les statistiques le disent) ; en général fin de journée et week-end. La régularité (3 à 5 vidéos par semaine) compte plus que l'heure parfaite.</li><li><strong>Déclinaison</strong> : même vidéo sur TikTok, Reels et Shorts, sans filigrane d'une autre plateforme (pénalisé) ; adapter les zones sûres et la légende.</li></ul>
<h2>Lire les statistiques</h2>
<table><tr><th>Métrique</th><th>Diagnostic</th><th>Action</th></tr>
<tr><td>Taux de visionnage à 3 s faible (&lt; 60 %)</td><td>hook faible</td><td>retravailler les 2 premières secondes, texte et visuel</td></tr>
<tr><td>Chute brutale à un moment précis de la courbe de rétention</td><td>passage ennuyeux ou confus</td><td>couper ou resserrer ce passage</td></tr>
<tr><td>Rétention moyenne bonne (&gt; 50 %) mais peu de partages</td><td>contenu agréable mais pas « utile » ou émotionnel</td><td>ajouter valeur pratique, surprise, identification</td></tr>
<tr><td>Beaucoup de vues, peu d'abonnés</td><td>pas de raison de revenir</td><td>série, personnage récurrent, promesse de suite</td></tr>
<tr><td>Commentaires négatifs sur le « côté IA »</td><td>visuels artificiels mal intégrés</td><td>plus de réalisme ou assumer un style stylisé, transparence</td></tr></table>
<h2>Itérer méthodiquement</h2>
<ol><li>Produire en <strong>série</strong> : 5 à 10 vidéos sur un même format, ne changer qu'une variable (hook, durée, style visuel).</li><li>Comparer après 48-72 h (une vidéo peut repartir plus tard).</li><li>Doubler sur ce qui marche : décliner un succès en 3 variantes.</li><li>Tenir un journal : vidéo, hook, format, résultats, apprentissage.</li></ol>
<h2>Les tests A/B visuels avec l'IA</h2>
<p>L'IA rend les variantes presque gratuites : deux hooks visuels différents pour la même vidéo, deux styles (réaliste / illustration), deux personnages. Publier les variantes à quelques jours d'intervalle, mesurer, garder la meilleure. C'est un avantage concurrentiel réel du créateur IA.</p>
<h2>Construire une audience durable</h2>
<ul><li>Une <strong>niche</strong> claire (le spectateur sait ce qu'il trouvera).</li><li>Des <strong>séries</strong> reconnaissables (même format, numérotées).</li><li>Répondre aux commentaires (signal fort pour l'algorithme et la communauté).</li><li>Un chemin vers une destination (newsletter, site, produit) : l'audience sur une plateforme peut disparaître du jour au lendemain.</li></ul>
<div class="callout info"><b>Patience et volume</b>Les premiers résultats viennent souvent après 30 à 50 vidéos, pas 3. Le volume (rendu possible par l'IA) et l'analyse (rendue possible par les statistiques) font la progression.</div>`,
          exercice: {
            type: 'texte', titre: 'Diagnostiquer et corriger',
            enonce: `<p>Étude de cas : ta série de 8 vidéos IA « 1 minute de science » obtient en moyenne 1 200 vues, un taux de visionnage à 3 s de 48 %, une rétention moyenne de 35 % avec une chute nette vers 8 s (juste après le hook, quand commence l'explication), 2 partages par vidéo et 15 nouveaux abonnés au total. Rédige un diagnostic (3 problèmes identifiés à partir des métriques) et un plan d'action concret pour les 8 prochaines vidéos (une variable testée à la fois).</p>`,
            placeholder: 'Diagnostic :\n1. …\nPlan d\'action :\n…',
            criteres: [
              { label: 'Identifie le hook faible (48 % à 3 s)', re: /hook|3\s?s|accroche|premi[èe]res? secondes?/i },
              { label: 'Identifie la chute à 8 s (transition vers l\'explication)', re: /8\s?s|chute|transition|d[ée]but de l.explication|apr[èe]s le hook/i },
              { label: 'Identifie le manque de partages / d\'abonnés (valeur, série)', re: /partag|abonn|valeur|utile|s[ée]rie|revenir|fid[ée]lis/i },
              { label: 'Plan avec une seule variable testée à la fois', re: /une (seule )?variable|une chose [àa] la fois|un (seul )?changement|a\/b/i },
              { label: 'Actions concrètes sur le hook (texte, visuel, question, promesse)', re: /texte [àa] l.[ée]cran|visuel|question|promesse|r[ée]sultat d.abord|contradiction|chiffre/i },
              { label: 'Mesure et délai de comparaison prévus', re: /48|72|heures|jours|mesur|compar|journal|statisti/i },
              motsMin(100)
            ],
            solution: `<p>Diagnostic : 1. Hook insuffisant : 48 % à 3 s signifie que plus d'un spectateur sur deux part avant l'idée ; le visuel d'ouverture ou le texte ne crée pas de curiosité. 2. Chute à 8 s : la transition hook → explication est trop longue ou trop abstraite ; le spectateur ne voit pas la promesse se réaliser. 3. Peu de partages et d'abonnés : les vidéos n'apportent pas une valeur assez concrète ni une raison de revenir (pas de série numérotée, pas de personnage).</p><p>Plan : vidéos 1-4, variable « hook » : même structure, mais hook en « résultat d'abord » (le phénomène montré visuellement en 1 s + texte question « pourquoi ? ») ; mesurer le taux à 3 s après 72 h, objectif > 65 %. Vidéos 5-8, variable « transition » : la première phrase après le hook donne déjà la moitié de la réponse, visuel I2V en mouvement, texte à l'écran avec le mot-clé ; mesurer la rétention à 8-10 s. En parallèle, sans changer d'autre variable : numéroter la série (« Science en 1 min #12 ») et terminer par une question pour les commentaires. Journal : tableau vidéo / variable / métriques / apprentissage, comparaison à 72 h.</p>`
          },
          quiz: [
            { q: 'Un taux de visionnage à 3 s de 45 % indique…', options: ['Un bon hook', 'Un hook à retravailler', 'Un problème de son'], bonne: 1, explication: 'Plus de la moitié part avant l\'idée : les deux premières secondes sont en cause.' },
            { q: 'Pourquoi ne changer qu\'une variable à la fois ?', options: ['Pour aller plus vite', 'Pour savoir ce qui a causé la différence', 'C\'est imposé par les plateformes'], bonne: 1, explication: 'Sinon impossible d\'attribuer le résultat à un changement précis.' },
            { q: 'Pourquoi rediriger l\'audience vers une newsletter ou un site ?', options: ['Pour les statistiques', 'Parce que l\'audience sur une plateforme peut disparaître (algorithme, suspension)', 'Pour éviter les commentaires'], bonne: 1, explication: 'Une audience possédée est un actif durable.' }
          ]
        }
      ]
    },
    {
      titre: 'Publicité, UGC et contenu de marque', niveau: 'Avancé', description: 'Product shots et publicités, contenus UGC, storytelling de marque, et le workflow complet de l\'idée à la publication.',
      lecons: [
        {
          titre: 'Publicité produit avec l\'IA',
          theorie: `<p>La photo et la vidéo produit coûtaient un studio, un photographe, des décors. L'IA produit aujourd'hui des <strong>product shots</strong> et des publicités courtes de qualité professionnelle à partir de quelques photos du produit réel. À condition de respecter une règle absolue : <strong>le produit ne doit jamais être déformé</strong>.</p>
<h2>Le pipeline product shot</h2>
<ol><li><strong>Photographier le produit</strong> sur fond neutre, bien éclairé, sous 3-5 angles (téléphone + lumière de fenêtre suffisent). Détourer (remove.bg, Photoroom, outils intégrés).</li><li><strong>Mise en scène générée</strong> : les outils dédiés (Higgsfield Ads/Product, Photoroom, Flair, Pebblely, Claid) placent le produit <em>réel</em> dans un décor généré, avec ombres et reflets cohérents. Le produit est préservé pixel par pixel.</li><li><strong>Variantes</strong> : saisons, ambiances, couleurs de fond, contextes d'usage, en minutes.</li><li><strong>Animation</strong> : image-to-video sur le product shot (orbite lente, lumière qui glisse, éléments d'ambiance qui bougent), le produit reste fixe et net.</li><li><strong>Habillage</strong> : prix, bénéfice, logo, CTA.</li></ol>
${code('text', `# Prompt de mise en scène (le produit est fourni en image)
Flacon posé sur une pierre d'ardoise humide, gouttes d'eau, feuilles d'eucalyptus floues au premier plan,
fond vert profond, lumière latérale douce avec reflet maîtrisé sur le verre, macro 100 mm,
photographie publicitaire cosmétique premium --ar 4:5

# Prompt d'animation (I2V)
Orbite très lente de 30° autour du flacon qui reste parfaitement net, gouttes qui glissent,
feuilles qui frémissent légèrement, lumière stable, mouvement calme, 5 s`)}
<h2>Structures de publicité courte (15-30 s)</h2>
<table><tr><th>Structure</th><th>Déroulé</th></tr>
<tr><td><strong>Problème / Solution</strong></td><td>douleur illustrée (3 s) → produit en action (10 s) → résultat + offre (5 s)</td></tr>
<tr><td><strong>Démo rapide</strong></td><td>3 bénéfices en 3 plans, texte à l'écran, produit toujours visible</td></tr>
<tr><td><strong>Unboxing / révélation</strong></td><td>mystère, ouverture, produit magnifié (orbite), CTA</td></tr>
<tr><td><strong>Témoignage + produit</strong></td><td>UGC (leçon suivante) + product shots en inserts</td></tr>
<tr><td><strong>Comparaison</strong></td><td>avant/après, avec/sans, concurrent générique/produit</td></tr></table>
<h2>Ce qui fait vendre</h2>
<ul><li>Un <strong>bénéfice</strong> clair en texte dès les 2 premières secondes (pas une caractéristique : « dors mieux » plutôt que « mousse à mémoire de forme »).</li><li>Le produit visible au moins 60 % du temps.</li><li>Une <strong>preuve</strong> : chiffre, avis, démonstration.</li><li>Une <strong>offre</strong> et un CTA sans ambiguïté (« −20 % cette semaine, lien en bio »).</li><li>Plusieurs <strong>variantes</strong> testées en publicité payante (Meta, TikTok Ads) : hooks, visuels, formats. Les annonceurs performants testent 10 à 20 créations par campagne ; l'IA rend cela possible.</li></ul>
<h2>Erreurs à éviter</h2>
<ul><li>Produit déformé, logo altéré, couleur fausse : rédhibitoire (et trompeur).</li><li>Décor irréaliste par rapport à l'usage (un sérum au milieu d'un volcan).</li><li>Texte généré dans l'image : toujours le refaire en post-production.</li><li>Promesses non vérifiables ou mensongères : illégal (pratiques commerciales trompeuses).</li></ul>
<div class="callout info"><b>Checklist avant diffusion</b>Produit identique à la réalité ? Bénéfice en 2 s ? Preuve ? Offre + CTA ? Zones sûres ? Mention IA si requise ? Variantes prêtes pour le test ?</div>`,
          exercice: {
            type: 'texte', titre: 'Concevoir une publicité produit de 20 s',
            enonce: `<p>Choisis un produit (gourde isotherme, lampe de bureau, café en grains…). Rédige : le <strong>bénéfice principal</strong> en une phrase (pas une caractéristique), le <strong>script plan par plan</strong> d'une publicité de 20 s (structure problème/solution ou démo, 5 à 7 plans avec durée, visuel, texte à l'écran), le <strong>prompt de mise en scène</strong> du product shot principal, et <strong>deux variantes de hook</strong> pour un test A/B.</p>`,
            placeholder: 'Produit : …\nBénéfice : …\nPlans :\n1. 3 s — …\nPrompt product shot : …\nHook A : … / Hook B : …',
            criteres: [
              { label: 'Produit nommé', re: /produit\s*:/i },
              { label: 'Bénéfice formulé (pas une caractéristique technique seule)', re: /b[ée]n[ée]fice\s*:[\s\S]{10,}/i },
              { label: 'Au moins 5 plans avec durées', verif: t => (t.match(/^\s*\d+[.)]\s*\d+\s?s/gm) || []).length >= 5 },
              { label: 'Texte à l\'écran prévu', re: /texte|«|"/i },
              { label: 'Prompt de product shot avec décor, lumière et objectif/cadrage', verif: t => { const p = (t.split(/prompt[^:]*:/i)[1] || ''); return /lumi[èe]re/i.test(p) && /(fond|d[ée]cor|pos[ée]|sur )/i.test(p) && /(mm|macro|plan|gros plan|cadrage)/i.test(p); } },
              { label: 'Une preuve ou un chiffre', re: /\d+\s?(%|h|heures|avis|clients|jours|°C|litres|ans)|not[ée]|avis|test[ée]/i },
              { label: 'Offre ou CTA', re: /-\s?\d+\s?%|offre|code|lien|commande|d[ée]couvre|achète|promo/i },
              { label: 'Deux hooks A/B distincts', verif: t => /hook\s*a/i.test(t) && /hook\s*b/i.test(t) },
              motsMin(110)
            ],
            solution: `<p>Produit : gourde isotherme Nord. Bénéfice : ton café reste brûlant jusqu'au déjeuner, même en vélo sous la pluie. Plans : 1. 2 s — gros plan d'un café froid dans un gobelet jetable, grimace — texte « Café froid à 10 h ? » 2. 3 s — product shot animé, orbite lente de la gourde — texte « 12 h au chaud » 3. 4 s — I2V cycliste sous la pluie, gourde dans le porte-bidon — texte « Pluie, froid, trajet : peu importe » 4. 3 s — insert vapeur qui s'échappe à l'ouverture, 13 h — texte « 13 h : toujours fumant » 5. 3 s — avis client à l'écran « 4,8/5 – 2 300 avis » 6. 3 s — product shot final, 3 coloris — texte « −20 % cette semaine, code NORD20 » 7. 2 s — logo + CTA « Lien en bio ». Prompt product shot : gourde isotherme (image fournie) posée sur une table en bois brut près d'une fenêtre embuée, tasse fumante à côté, lumière douce de matin gris, reflets maîtrisés sur l'acier, macro 100 mm, photographie publicitaire chaleureuse --ar 9:16. Hook A : « Café froid à 10 h ? » (problème). Hook B : gourde ouverte, vapeur en gros plan, texte « 13 h. Toujours brûlant. » (résultat d'abord).</p>`
          },
          quiz: [
            { q: 'Quelle règle absolue pour un product shot IA ?', options: ['Un décor spectaculaire', 'Le produit réel n\'est jamais déformé ni altéré', 'Un texte généré dans l\'image'], bonne: 1, explication: 'On place le produit détouré dans un décor généré ; le produit reste exact.' },
            { q: 'Bénéfice ou caractéristique en ouverture ?', options: ['La caractéristique technique', 'Le bénéfice pour le client', 'Le prix'], bonne: 1, explication: '« Dors mieux » parle au spectateur ; « mousse à mémoire de forme » non.' },
            { q: 'Pourquoi produire 10 à 20 créations par campagne ?', options: ['Pour remplir le compte', 'Pour tester et trouver les hooks/visuels qui convertissent', 'Par obligation'], bonne: 1, explication: 'Le test multivarié est la méthode des annonceurs performants ; l\'IA le rend abordable.' }
          ]
        },
        {
          titre: 'UGC : le témoignage authentique',
          theorie: `<p>L'<strong>UGC</strong> (<em>User Generated Content</em>) désigne des vidéos au style « client ordinaire qui filme avec son téléphone » : témoignage, test, unboxing, routine. C'est le format publicitaire le plus performant de ces dernières années, parce qu'il ressemble au contenu organique et inspire confiance. L'IA permet d'en produire avec des avatars ; cela impose des règles de transparence strictes.</p>
<h2>Les codes de l'UGC</h2>
<ul><li>Face caméra, téléphone tenu à la main, légers tremblements, lumière naturelle (fenêtre, extérieur).</li><li>Décor réel et imparfait : cuisine, voiture, salle de bain, rue.</li><li>Ton parlé, spontané, à la première personne : « franchement », « je ne m'attendais pas à ça ».</li><li>Structure : hook personnel (« j'ai testé pendant 2 semaines ») → contexte/problème → produit montré et utilisé → résultat honnête (un petit bémol renforce la crédibilité) → recommandation.</li><li>Durée 20-45 s, sous-titres, pas d'habillage publicitaire lourd.</li></ul>
<h2>UGC avec l'IA : trois niveaux</h2>
<ol><li><strong>Hybride (recommandé)</strong> : un vrai créateur filme le face caméra ; l'IA produit les inserts (product shots, mises en situation, B-roll impossibles à filmer). Authenticité réelle, production accélérée.</li><li><strong>Avatar UGC</strong> : un présentateur généré (Higgsfield AI Influencer, HeyGen UGC, Arcads, Creatify) lit un script avec lipsync dans un décor généré « style téléphone ». Rapide, multilingue, scalable. Doit être signalé comme généré.</li><li><strong>Personnage de marque</strong> : un personnage IA assumé et récurrent (mascotte réaliste ou stylisée) qui ne prétend pas être un client. Transparent par nature, et différenciant.</li></ol>
${code('text', `# Prompt image-clé UGC (puis I2V + lipsync)
Jeune homme de 28 ans, sweat gris, assis dans une cuisine ordinaire, tient une gourde isotherme vers la caméra,
selfie au téléphone, cadrage légèrement de biais, lumière naturelle de fenêtre, légère surexposition,
photo réaliste de téléphone, pas de retouche, grain léger --ar 9:16

# Prompt I2V
Il parle face caméra avec des gestes naturels, montre la gourde, léger mouvement de la main qui tient le téléphone, caméra épaule, 5 s`)}
<h2>Écrire un script UGC</h2>
<p>Parlé, pas écrit : contractions, phrases qui s'enchaînent, hésitations légères. 60 à 90 mots. Un seul bénéfice principal, une preuve vécue (« je l'ai pris trois fois sous la pluie »), un bémol honnête, un CTA doux (« je vous mets le lien »).</p>
<h2>Le cadre légal et éthique</h2>
<ul><li>Un <strong>faux témoignage</strong> présenté comme réel est une <strong>pratique commerciale trompeuse</strong> (Code de la consommation) : amendes lourdes. Un avatar ne doit pas être présenté comme un client réel ; il incarne un message, et c'est dit.</li><li>Toute collaboration rémunérée avec un créateur réel doit être signalée (« publicité », « collaboration commerciale ») : loi influenceurs 2023 en France.</li><li>Les plateformes (Meta, TikTok) exigent le marquage des contenus réalistes générés par IA ; les publicités avec avatars doivent respecter leurs politiques.</li><li>Pas de clonage de voix ou de visage réels sans contrat ; pas d'allégations santé non prouvées.</li></ul>
<h2>Mesurer</h2>
<p>En publicité : coût par clic, taux de clic, coût par acquisition, et surtout le <em>hook rate</em> (3 s) et le <em>hold rate</em> (15 s). Comparer créateur réel, hybride et avatar sur le même produit : la transparence n'empêche pas la performance quand le message est bon.</p>
<div class="callout warn"><b>La ligne rouge</b>Authentique ne veut pas dire mensonger. Un avatar IA peut présenter un produit avec conviction ; il ne peut pas prétendre l'avoir acheté et utilisé. La confiance est l'actif ; la tromperie le détruit, légalement et commercialement.</div>`,
          exercice: {
            type: 'texte', titre: 'Script UGC transparent',
            enonce: `<p>Écris un <strong>script UGC de 30 s</strong> (60 à 90 mots, ton parlé) pour un produit de ton choix, destiné à un <strong>avatar IA</strong> : hook personnel, bénéfice principal, preuve concrète, un bémol honnête, CTA doux. Ajoute la mention de transparence prévue (à l'écran ou dans la légende) et le prompt de l'image-clé « style téléphone » de l'avatar.</p>`,
            placeholder: 'Script : « … »\nMention de transparence : …\nPrompt image-clé : …',
            criteres: [
              { label: 'Ton parlé (franchement, bon, honnêtement, je vous…)', re: /franchement|honn[êe]tement|bon,|alors|en vrai|je vous|j.avoue|du coup/i },
              { label: 'Un bénéfice principal', re: /enfin|plus (jamais|besoin)|[çc]a (change|marche)|grâce|r[ée]sultat|gagne|[ée]conomis|tient|dure/i },
              { label: 'Une preuve concrète (durée d\'usage, chiffre, situation)', re: /\d+\s?(jours|semaines|mois|fois|h|heures|km|%)|depuis|pendant/i },
              { label: 'Un bémol honnête', re: /b[ée]mol|par contre|seul (point|truc|d[ée]faut)|petit (point|d[ée]faut)|dommage|j.aurais aim[ée]|un peu (cher|lourd|long|gros)/i },
              { label: 'Un CTA doux', re: /lien|je vous (mets|laisse)|si [çc]a vous|allez voir|code/i },
              { label: 'Mention de transparence (contenu généré / avatar IA)', re: /g[ée]n[ée]r[ée]|avatar|intelligence artificielle|\bIA\b|synth[ée]tique|cr[ée][ée] par ia|contenu ia/i },
              { label: 'Prompt image-clé style téléphone (selfie, fenêtre, grain, pas de retouche…)', re: /selfie|t[ée]l[ée]phone|lumi[èe]re (naturelle|de fen[êe]tre)|grain|pas de retouche|cadrage (de biais|serr)/i },
              { label: 'Script entre 55 et 95 mots', verif: t => { const m = t.match(/script\s*:\s*«?([\s\S]*?)(»|\n\s*mention)/i); const s = m ? m[1] : t; const n = s.trim().split(/\s+/).length; return n >= 55 && n <= 95; } }
            ],
            solution: `<p>Script : « Bon, franchement, je ne pensais pas qu'une gourde pouvait changer mes matins. Depuis trois semaines je la prends en vélo, pluie ou pas, et à 13 h mon café est encore brûlant. Genre vraiment. Par contre, elle est un peu lourde quand elle est pleine, je préfère vous le dire. Mais pour le trajet, c'est réglé, plus de café froid. Je vous mets le lien si ça vous parle. »</p><p>Mention de transparence : texte à l'écran dès la première seconde « Présentateur généré par IA » + légende « Vidéo créée avec un avatar IA pour présenter le produit ».</p><p>Prompt image-clé : homme de 30 ans, sweat bleu, assis à une table de cuisine ordinaire, tient une gourde isotherme vers la caméra, selfie au téléphone cadré légèrement de biais, lumière naturelle de fenêtre, grain léger, aucune retouche, photo réaliste de smartphone --ar 9:16</p>`
          },
          quiz: [
            { q: 'Un avatar IA peut-il dire « j\'ai acheté ce produit et je l\'utilise depuis un mois » ?', options: ['Oui si c\'est convaincant', 'Non : faux témoignage, pratique commerciale trompeuse', 'Oui sur TikTok uniquement'], bonne: 1, explication: 'L\'avatar incarne un message et doit être signalé ; il ne simule pas un vécu client.' },
            { q: 'Quelle approche UGC combine authenticité et vitesse ?', options: ['Tout en avatar', 'Hybride : créateur réel face caméra + inserts générés', 'Tout filmé'], bonne: 1, explication: 'Le témoignage est réel ; l\'IA accélère les plans d\'illustration.' },
            { q: 'Que renforce un petit bémol honnête dans un témoignage ?', options: ['Rien, il nuit', 'La crédibilité', 'La durée'], bonne: 1, explication: 'Un avis sans aucune réserve paraît fabriqué.' }
          ]
        },
        {
          titre: 'Storytelling de marque et vidéos explicatives',
          theorie: `<p>Au-delà de la publicité directe, les marques et les créateurs ont besoin de contenus <strong>d'explication</strong> (comment ça marche, tutoriel, pédagogie) et de <strong>récit</strong> (origine, valeurs, coulisses). L'IA excelle à visualiser l'abstrait et à mettre en scène ce qui n'existe pas (encore).</p>
<h2>La vidéo explicative (explainer)</h2>
<p>Structure en 60-90 s : <strong>problème</strong> que vit le spectateur (identification) → <strong>pourquoi</strong> c'est difficile (empathie) → <strong>solution</strong> en 3 étapes ou 3 bénéfices (clarté) → <strong>preuve</strong> → <strong>appel</strong>. Un visuel par idée, une métaphore visuelle filée (un labyrinthe pour la complexité, un pont pour la connexion…), un style graphique constant (référence de style), une voix-off claire.</p>
${code('text', `# Style visuel constant pour un explainer (référence de style à réutiliser)
Illustration 3D douce, formes arrondies, palette bleu nuit / corail / crème, lumière de studio diffuse,
fond uni dégradé, rendu propre type animation moderne --sref [image de référence]

# Métaphore visuelle (plan 2 : "trop de factures")
Une personne submergée par une pile de documents qui s'élèvent en spirale autour d'elle, même style 3D doux,
expression dépassée mais sympathique, plan moyen, fond crème`)}
<h2>Le récit de marque (brand story)</h2>
<p>Pourquoi la marque existe, pour qui, ce qu'elle refuse. Structure du héros : le fondateur ou le client face à un problème, la quête, l'obstacle, la solution trouvée, le monde d'après. 60 à 120 s, musique émotionnelle, rythme plus lent (plans de 3-5 s), voix sincère. L'IA reconstitue des scènes passées (l'atelier des débuts), illustre des valeurs abstraites, voyage dans le temps — en restant honnête sur ce qui est reconstitué.</p>
<h2>Tutoriels et formation</h2>
<p>Avatar présentateur (multilingue, mises à jour faciles) + captures d'écran réelles + schémas générés. Chapitrage, texte à l'écran pour les étapes, récapitulatif final. Pour la formation interne, l'IA divise le coût par dix et permet de refaire la vidéo à chaque changement.</p>
<h2>Cohérence de marque</h2>
<ul><li><strong>Kit de marque</strong> : logo, palette, polices, ton de voix, style d'image (référence de style ou LoRA de style), voix synthétique attitrée, musique signature.</li><li>Un <strong>document de prompts validés</strong> par type de visuel : tout le monde produit dans la même direction.</li><li>Relecture : chaque visuel respecte-t-il la palette, le ton, l'esprit ? Le « joli mais hors charte » est la dérive classique de l'IA.</li></ul>
<h2>Longs formats</h2>
<p>YouTube (8-15 min) : talking head (réel ou avatar) + B-roll généré + schémas. La valeur est dans le script et le montage ; l'IA fournit l'illustration sans limite. Le podcast vidéo : résumés courts générés en clips verticaux (Opus, Vizard) pour alimenter les réseaux.</p>
<h2>Ce que l'IA ne remplace pas</h2>
<p>L'angle (ce qu'on dit que personne ne dit), la structure, la voix de la marque, la compréhension de l'audience. Les outils s'égalisent ; la pensée différencie.</p>
<div class="callout info"><b>Métaphore visuelle : la compétence clé</b>Rendre visible une idée abstraite en une image (« la dette technique » = une maison dont on repeint la façade pendant que les fondations se fissurent) est ce que l'IA fait le mieux et ce qui rend un explainer mémorable. Entraîne-toi à en trouver.</div>`,
          exercice: {
            type: 'texte', titre: 'Explainer : structure et métaphores',
            enonce: `<p>Un service de comptabilité en ligne pour indépendants veut une vidéo explicative de 60 s. Rédige : la structure en 5 blocs (problème, pourquoi c'est dur, solution en 3 points, preuve, appel) avec le texte de voix-off de chaque bloc (120 à 170 mots au total), <strong>trois métaphores visuelles</strong> (une par idée abstraite : complexité, temps perdu, sérénité), et la description du style visuel constant à appliquer à toutes les images.</p>`,
            placeholder: 'Bloc 1 – Problème : « … »\n…\nMétaphores : 1. complexité → … 2. temps → … 3. sérénité → …\nStyle visuel : …',
            criteres: [
              { label: 'Les 5 blocs présents (problème, difficulté, solution, preuve, appel)', verif: t => ['probl', 'dur|difficile|pourquoi', 'solution', 'preuve', 'appel|cta'].every(r => new RegExp(r, 'i').test(t)) },
              { label: 'Solution en trois points', verif: t => /solution[\s\S]*?(1[.)]|①|premi)[\s\S]*?(2[.)]|②|deuxi)[\s\S]*?(3[.)]|③|troisi)/i.test(t) || (t.match(/\b(un|une|d.abord|ensuite|enfin)\b/gi) || []).length >= 3 },
              { label: 'Trois métaphores visuelles décrites', verif: t => (t.match(/→|->|=>/g) || []).length >= 3 || (t.match(/m[ée]taphore/gi) || []).length >= 1 && /complexit[\s\S]*temps[\s\S]*s[ée]r[ée]nit/i.test(t) },
              { label: 'Style visuel constant (palette, rendu, lumière)', re: /style visuel[\s\S]*(palette|couleurs?)[\s\S]*(3d|illustration|flat|aquarelle|rendu|photographique|lumi[èe]re)/i },
              { label: 'Une preuve chiffrée ou concrète', re: /\d+\s?(%|indépendants|clients|heures|h|minutes|jours|€|euros)/i },
              { label: 'Voix-off entre 110 et 180 mots', verif: t => { const s = t.split(/m[ée]taphores?/i)[0]; const n = s.replace(/bloc \d[^:]*:/gi, '').trim().split(/\s+/).length; return n >= 110 && n <= 180; } }
            ],
            solution: `<p>Bloc 1 – Problème : « Tu es graphiste, coach, artisan. Pas comptable. Et pourtant, chaque mois, c'est toi qui te bats avec les factures, les justificatifs, la TVA. » Bloc 2 – Pourquoi c'est dur : « Parce que les règles changent, que chaque erreur coûte, et que tes soirées devraient servir à autre chose. » Bloc 3 – Solution : « Clair fait trois choses. Un : tes factures et tes dépenses se rangent toutes seules, une photo suffit. Deux : ta déclaration se prépare automatiquement, tu valides en deux minutes. Trois : un comptable humain répond en moins d'une heure quand tu doutes. » Bloc 4 – Preuve : « 12 000 indépendants l'utilisent, et ils récupèrent en moyenne six heures par mois. » Bloc 5 – Appel : « Essaie Clair gratuitement pendant trente jours. Tes soirées te diront merci. »</p><p>Métaphores : 1. complexité → une personne qui marche dans un labyrinthe de documents géants aux murs mouvants ; 2. temps perdu → une horloge dont les aiguilles tournent à toute vitesse pendant que la personne trie des papiers, la fenêtre passe du jour à la nuit ; 3. sérénité → la même personne assise dans un fauteuil, les documents qui se rangent seuls en une pile nette derrière elle, lumière chaude.</p><p>Style visuel : illustration 3D douce aux formes arrondies, palette bleu nuit / corail / crème, lumière de studio diffuse, fonds unis dégradés, même personnage (référence) sur tous les plans, référence de style unique.</p>`
          },
          quiz: [
            { q: 'Quelle structure pour une vidéo explicative ?', options: ['Caractéristiques en liste', 'Problème → difficulté → solution en 3 points → preuve → appel', 'Témoignage seul'], bonne: 1, explication: 'Identification, empathie, clarté, crédibilité, action.' },
            { q: 'Qu\'est-ce qu\'une métaphore visuelle ?', options: ['Un logo', 'Une image concrète qui rend visible une idée abstraite', 'Une transition'], bonne: 1, explication: 'C\'est ce que l\'IA illustre le mieux et ce qui rend le message mémorable.' },
            { q: 'Que garantit un kit de marque pour la production IA ?', options: ['La viralité', 'La cohérence : palette, style, voix, ton sur tous les contenus', 'Des crédits gratuits'], bonne: 1, explication: 'Sans kit, chaque génération dérive vers le « joli mais hors charte ».' }
          ]
        },
        {
          titre: 'Le workflow complet, de l\'idée à la publication',
          theorie: `<p>Cette leçon assemble tout : un <strong>pipeline de production</strong> reproductible, avec les outils à chaque étape, les livrables, les temps réalistes et les points de contrôle. C'est le processus qu'utilisent les créateurs et les petites agences qui produisent quotidiennement avec l'IA.</p>
<h2>Les 8 étapes</h2>
<table><tr><th>Étape</th><th>Livrable</th><th>Outils</th><th>Temps</th></tr>
<tr><td>1. <strong>Idée et angle</strong></td><td>une phrase : sujet + promesse + format + audience</td><td>veille (TikTok, YouTube, commentaires), LLM pour brainstormer 20 angles</td><td>15 min</td></tr>
<tr><td>2. <strong>Script</strong></td><td>texte voix-off + textes à l'écran, chronométré</td><td>LLM pour structurer, toi pour la voix et les détails ; lecture à voix haute</td><td>30 min</td></tr>
<tr><td>3. <strong>Storyboard</strong></td><td>tableau plan par plan (durée, cadrage, action, caméra, voix)</td><td>tableur, Notion, Milanote</td><td>20 min</td></tr>
<tr><td>4. <strong>Images-clés</strong></td><td>une image validée par plan, cohérentes</td><td>Midjourney / Flux / Higgsfield + références de personnage et de style</td><td>45-90 min</td></tr>
<tr><td>5. <strong>Voix</strong></td><td>fichiers audio par phrase</td><td>ElevenLabs (ou enregistrement réel)</td><td>15 min</td></tr>
<tr><td>6. <strong>Animation</strong></td><td>un clip par plan, 3-4 variantes, sélection</td><td>Runway / Kling / Veo / Higgsfield, lipsync si parole</td><td>60-120 min</td></tr>
<tr><td>7. <strong>Montage et habillage</strong></td><td>vidéo exportée par plateforme</td><td>CapCut / DaVinci : montage sur la voix, sous-titres, musique, SFX, étalonnage</td><td>60-90 min</td></tr>
<tr><td>8. <strong>Publication et analyse</strong></td><td>légende, hashtags, couverture ; journal de résultats à 72 h</td><td>plateformes, outils de planification (Metricool, Later)</td><td>20 min</td></tr></table>
<p>Total réaliste pour une vidéo de 30 s soignée : <strong>4 à 7 heures</strong> la première fois, 2 à 3 heures en routine avec des templates. Les séries (même personnage, même style, même structure) divisent encore le temps.</p>
<h2>Organisation des fichiers</h2>
${code('text', `projet-nom/
├── 01-brief.md            # idée, angle, audience, promesse
├── 02-script.md           # voix-off + textes écran + timings
├── 03-storyboard.csv
├── 04-images/             # scene01_v3.png + prompts.md (prompts, seeds, références)
├── 05-voix/               # phrase01.mp3 ...
├── 06-clips/              # scene01_take2.mp4 (seulement les retenus)
├── 07-montage/            # projet CapCut/DaVinci, export_tiktok.mp4, export_youtube.mp4
└── 08-resultats.md        # métriques à 72 h, apprentissages`)}
<h2>Points de contrôle (ne pas sauter)</h2>
<ul><li>Après le script : lu à voix haute, chronométré, test du « et alors ? » sur chaque phrase.</li><li>Après les images-clés : côte à côte, cohérence personnage/lumière/style, zones sûres, checklist qualité.</li><li>Après l'animation : visionnage sans son, repérage des plans « IA évidents » à régénérer ou raccourcir.</li><li>Avant export : rendu sur téléphone, sous-titres relus, mixage, mentions de transparence.</li></ul>
<h2>Budget</h2>
<p>Abonnements typiques : générateur d'images 10-30 €/mois, vidéo 15-100 €/mois selon volume, voix 5-22 €/mois, montage gratuit (CapCut, DaVinci). Un créateur solo produit 3 à 5 vidéos soignées par semaine pour 50 à 150 € d'outils par mois. Compter 30 % de générations perdues dans le calcul des crédits.</p>
<h2>Templates réutilisables</h2>
<p>Un dossier de prompts validés (par type de plan), une planche de personnage, une référence de style, un preset d'export, un template de montage (pistes, polices, positions de sous-titres), un modèle de brief. Chaque projet enrichit la bibliothèque ; c'est l'actif qui fait la vitesse.</p>
<div class="callout ok"><b>Étude de cas type</b>Une boutique de thé veut 8 vidéos courtes par mois. Semaine 1 : kit (personnage « la cheffe de thé », style, voix, 6 templates de prompts). Ensuite : lundi, 8 scripts avec un LLM à partir des questions clients ; mardi-mercredi, images et clips en lots ; jeudi, montage en série ; vendredi, programmation. Coût outils : ~90 €/mois ; temps : ~2 jours/semaine.</div>`,
          exercice: {
            type: 'texte', titre: 'Planifier une production',
            enonce: `<p>Un client (restaurant, cabinet, boutique, association : au choix) te commande <strong>4 vidéos courtes</strong> pour un mois. Rédige le plan de production : le kit à constituer (personnage/style/voix/templates), le planning par étape (8 étapes avec temps estimés), l'organisation des fichiers, les points de contrôle, le budget outils estimé, et ce que tu demandes au client avant de commencer (brief, assets, validation, mentions).</p>`,
            placeholder: 'Client : …\nKit : …\nPlanning : 1. Idée (…) 2. Script (…) …\nFichiers : …\nContrôles : …\nBudget : …\nDemandes au client : …',
            criteres: [
              { label: 'Kit décrit (personnage ou style, voix, templates)', re: /kit[\s\S]*(personnage|style|voix|template|r[ée]f[ée]rence)/i },
              { label: 'Les 8 étapes mentionnées (idée, script, storyboard, images, voix, animation, montage, publication)', verif: t => ['id[ée]e', 'script', 'storyboard', 'image', 'voix', 'anim|clip|vid[ée]o', 'montage', 'publi'].every(r => new RegExp(r, 'i').test(t)) },
              { label: 'Temps estimés (heures ou minutes)', verif: t => (t.match(/\d+\s?(h|heures?|min|minutes?|jours?)/gi) || []).length >= 4 },
              { label: 'Organisation des fichiers (dossiers, versions, prompts conservés)', re: /dossier|fichier|version|prompts? (conserv|sauvegard|not[ée])|arborescence/i },
              { label: 'Points de contrôle / validation', re: /contr[ôo]le|validation|v[ée]rif|relecture|checklist/i },
              { label: 'Budget outils chiffré', re: /\d+\s?(€|euros)/i },
              { label: 'Demandes au client (brief, logo/charte, produits, mention IA, droits)', re: /brief|logo|charte|photos? (du|des) produit|assets|mention|droits|validation/i },
              motsMin(140)
            ],
            solution: `<p>Client : fromagerie artisanale. Kit (semaine 1) : personnage « Lucie la fromagère » (planche de référence + cref), référence de style photo chaleureuse, voix ElevenLabs féminine posée, 6 templates de prompts (comptoir, cave d'affinage, plateau, gros plan texture, client, extérieur boutique), template CapCut (polices, sous-titres, logo en zone sûre). Planning par vidéo : 1. Idée (15 min, à partir des questions clients fournies) 2. Script (30 min, lu et chronométré) 3. Storyboard (20 min, tableau) 4. Images-clés (1 h, lots de 4, cohérence vérifiée côte à côte) 5. Voix (15 min, phrase par phrase) 6. Animation (1 h 30, 3 variantes par plan, lipsync sur 1 plan) 7. Montage (1 h, sur la voix, sous-titres relus, musique libre) 8. Publication (20 min, légende + couverture, journal à 72 h). Soit ~5 h par vidéo, 20 h pour le mois, en lots (scripts le lundi, images mardi, clips mercredi, montage jeudi). Fichiers : un dossier par vidéo avec sous-dossiers numérotés, prompts et seeds dans prompts.md, seuls les clips retenus conservés. Contrôles : script validé par le client avant génération ; images-clés validées ; export vérifié sur téléphone ; mention « visuels générés par IA » en légende. Budget outils : ~25 € images + 60 € vidéo + 11 € voix = ~96 €/mois, prorata facturé. Demandes au client : brief (objectifs, produits à mettre en avant, offres), logo et charte, 10 photos réelles des produits et de la boutique, validation du personnage, accord sur les mentions IA et les droits d'usage des vidéos.</p>`
          },
          quiz: [
            { q: 'Quel temps réaliste pour une vidéo courte soignée en routine ?', options: ['15 minutes', '2 à 3 heures', '2 jours'], bonne: 1, explication: 'Avec templates et séries ; 4 à 7 h la première fois.' },
            { q: 'Pourquoi conserver prompts et seeds à côté des images ?', options: ['Pour la taille', 'Pour reproduire, décliner et corriger sans repartir de zéro', 'Pour le client'], bonne: 1, explication: 'C\'est la mémoire de production, un actif réutilisable.' },
            { q: 'Quand faire valider le script par le client ?', options: ['Après le montage', 'Avant de générer les images', 'Jamais'], bonne: 1, explication: 'Une correction de script coûte 10 minutes ; après génération, des heures.' }
          ]
        }
      ]
    },
    {
      titre: 'Montage, éthique et professionnalisation', niveau: 'Avancé', description: 'Les bases du montage dans CapCut et DaVinci Resolve, le cadre juridique et éthique, les études de cas et la construction d\'un portfolio.',
      lecons: [
        {
          titre: 'Montage : CapCut et DaVinci Resolve',
          theorie: `<p>Le montage assemble les clips générés en vidéo finie. Deux outils gratuits couvrent tous les besoins : <strong>CapCut</strong> pour les formats courts (rapide, mobile ou ordinateur) et <strong>DaVinci Resolve</strong> pour un niveau professionnel (étalonnage, son, effets). Les concepts sont identiques.</p>
<h2>Les concepts universels</h2>
<ul><li><strong>Timeline</strong> : pistes vidéo (empilées, la plus haute au-dessus) et audio ; le temps de gauche à droite.</li><li><strong>Coupe</strong> (<kbd>Ctrl</kbd>+<kbd>B</kbd> CapCut, <kbd>Ctrl</kbd>+<kbd>B</kbd> Resolve) : scinder un clip à la tête de lecture ; supprimer la partie inutile.</li><li><strong>Rogner / étirer</strong> les bords d'un clip ; <strong>ripple</strong> : les clips suivants se décalent automatiquement.</li><li><strong>Transitions</strong> : glissées entre deux clips ; la coupe franche reste la norme.</li><li><strong>Texte et sous-titres</strong> : calques au-dessus de la vidéo, avec animations d'entrée/sortie.</li><li><strong>Images-clés</strong> (keyframes) : animer position, échelle, opacité dans le temps (zoom lent sur une image fixe = effet Ken Burns).</li><li><strong>Vitesse</strong> : ralenti/accéléré, courbes de vitesse pour les effets dynamiques.</li><li><strong>Audio</strong> : volume par clip, fondu, ducking (baisse automatique de la musique sous la voix), réduction de bruit.</li><li><strong>Étalonnage</strong> : correction (exposition, balance des blancs) puis look (LUT, teinte), appliqué uniformément.</li></ul>
<h2>Le flux de montage d'une vidéo IA</h2>
<ol><li>Créer le projet au bon format (1080×1920 ou 1920×1080, 30 i/s).</li><li>Importer la voix-off en premier et la poser sur la timeline : elle donne le rythme.</li><li>Poser les clips plan par plan sur la voix ; couper les débuts/fins instables ; ajuster la vitesse (80-90 % pour lisser).</li><li>Inserts et plans de coupe pour masquer les raccords difficiles.</li><li>Sous-titres automatiques, relus ; titres à l'écran pour les idées-clés.</li><li>Musique sous la voix (ducking), SFX sur les coupes importantes.</li><li>Étalonnage uniforme : une correction de base sur tous les clips (ajustement) + un look léger.</li><li>Export selon la plateforme ; vérification sur téléphone.</li></ol>
<h2>CapCut en pratique</h2>
<p>Sous-titres auto (« Texte → Sous-titres automatiques »), modèles de texte animé, suppression de l'arrière-plan, « Ajustement » pour la couleur, effets et transitions tendance, export direct 1080p. Version ordinateur plus confortable pour les projets longs. Attention aux ressources (musiques, effets) réservées à un usage non commercial dans la version gratuite : vérifier les licences.</p>
<h2>DaVinci Resolve en pratique</h2>
<p>Pages : <em>Media</em> (import), <em>Cut/Edit</em> (montage), <em>Fusion</em> (effets), <em>Color</em> (étalonnage, le meilleur du marché), <em>Fairlight</em> (son), <em>Deliver</em> (export). Transcription et sous-titres intégrés, outils IA (suppression de voix, recadrage intelligent vertical, « Magic Mask »). Courbe d'apprentissage plus longue, mais résultat professionnel et gratuit.</p>
<h2>Outils IA de montage</h2>
<p><strong>Descript</strong> (montage par le texte, suppression des « euh »), <strong>Opus Clip / Vizard</strong> (découpage automatique d'un long format en clips verticaux), <strong>Topaz Video AI</strong> (upscaling, interpolation, stabilisation), <strong>Adobe Premiere</strong> (recadrage auto, remix musical). Ils accélèrent ; ils ne décident pas du rythme à votre place.</p>
<div class="callout info"><b>Apprendre le montage</b>Une heure par jour pendant une semaine sur un outil suffit pour les formats courts. Le vrai apprentissage : regarder des vidéos performantes et compter les coupes, les mouvements de texte, les sons. Le montage s'apprend en imitant, puis en épurant.</div>`,
          exercice: {
            type: 'qcm', titre: 'Le bon ordre de montage',
            enonce: `<p>Quelles pratiques de montage d'une vidéo IA sont correctes ? (plusieurs réponses)</p>`,
            options: ['Poser la voix-off en premier et caler les clips dessus', 'Garder les clips générés en entier pour ne pas perdre de contenu', 'Couper les débuts et fins instables des clips', 'Appliquer l\'étalonnage clip par clip avec des réglages différents', 'Utiliser le ducking pour baisser la musique sous la voix', 'Vérifier l\'export sur téléphone avant de publier'],
            bonne: [0, 2, 4, 5], multiple: true,
            explication: 'On ne garde que la meilleure portion de chaque clip, et l\'étalonnage s\'applique de façon uniforme pour gommer les écarts entre générations.'
          },
          quiz: [
            { q: 'Que fait le ducking ?', options: ['Il coupe la voix', 'Il baisse automatiquement la musique quand la voix parle', 'Il accélère la vidéo'], bonne: 1, explication: 'Indispensable pour garder la voix intelligible.' },
            { q: 'Quel outil gratuit offre un étalonnage de niveau professionnel ?', options: ['CapCut', 'DaVinci Resolve', 'Canva'], bonne: 1, explication: 'La page Color de Resolve est une référence de l\'industrie.' },
            { q: 'Pourquoi poser la voix-off avant les clips ?', options: ['Pour l\'export', 'Parce qu\'elle impose le rythme et la durée de chaque plan', 'Par habitude'], bonne: 1, explication: 'Les images servent le récit, pas l\'inverse.' }
          ]
        },
        {
          titre: 'Droits, éthique et transparence',
          theorie: `<p>Créer avec l'IA engage une responsabilité : juridique (droits d'auteur, image, voix, consommation) et éthique (confiance du public, respect des personnes). Connaître le cadre protège ton activité et ton audience.</p>
<h2>Droit d'auteur : qui possède quoi ?</h2>
<ul><li><strong>Les images/vidéos générées</strong> : en Europe et aux États-Unis, une œuvre purement générée par IA sans apport créatif humain substantiel n'est généralement <em>pas</em> protégée par le droit d'auteur ; ton apport (sélection, composition, retouches, montage, script) peut l'être. Conséquence : tes visuels bruts peuvent être réutilisés par d'autres ; ta vidéo montée et scénarisée est mieux protégée.</li><li><strong>Les conditions d'utilisation</strong> des outils fixent tes droits d'usage commercial : la plupart des offres payantes les accordent ; vérifier (Midjourney, Runway, ElevenLabs, Suno ont chacun leurs clauses, notamment sur l'usage par des entreprises de grande taille).</li><li><strong>Les données d'entraînement</strong> : débats et procès en cours (artistes, presse). Reproduire explicitement le style d'un artiste vivant identifiable, ou un personnage protégé (Disney, Marvel, Nintendo…), expose à des réclamations : à éviter dans un usage commercial.</li></ul>
<h2>Droit à l'image et à la voix</h2>
<p>Générer ou cloner le <strong>visage ou la voix d'une personne réelle</strong> sans consentement écrit est interdit (droit à l'image, article 9 du Code civil ; usurpation ; depuis 2024, le Code pénal sanctionne explicitement les deepfakes diffusés sans consentement, art. 226-8-1). Cela vaut pour les personnalités publiques (usage commercial) comme pour les particuliers. Les personnages <em>fictifs</em> générés ne posent pas ce problème — c'est l'un des intérêts des personnages de marque.</p>
<h2>Transparence</h2>
<ul><li><strong>IA Act européen</strong> : obligation de signaler les contenus synthétiques réalistes (deepfakes) et les interactions avec une IA ; marquage technique des contenus générés par les fournisseurs.</li><li><strong>Plateformes</strong> : TikTok, YouTube, Meta exigent le marquage des contenus réalistes générés ou modifiés par IA (case à cocher à la publication) ; la non-déclaration peut entraîner retrait ou sanction.</li><li><strong>Publicité</strong> : un avatar ou un témoignage synthétique ne peut pas être présenté comme un client réel (pratique commerciale trompeuse) ; les partenariats rémunérés sont signalés (loi influenceurs).</li><li><strong>Bonne pratique</strong> : une mention sobre (« visuels générés par IA ») en légende ou à l'écran ; elle n'a pas d'impact négatif mesurable sur la performance quand le contenu est de qualité, et préserve la confiance.</li></ul>
<h2>Données personnelles</h2>
<p>Ne pas téléverser de photos de clients, d'employés ou d'enfants dans des outils IA sans base légale et consentement (RGPD) ; vérifier si l'outil utilise vos entrées pour l'entraînement (option de refus). Pour les projets d'entreprise, privilégier les offres qui s'engagent à ne pas entraîner sur vos données.</p>
<h2>Éthique au-delà du droit</h2>
<ul><li>Ne pas produire de contenus trompeurs (fausses actualités, faux événements), discriminants ou nuisibles, même « pour rire ».</li><li>Représenter la diversité réellement : les modèles ont des biais (genre, origine, morphologie) ; les corriger dans les prompts.</li><li>Créditer les créateurs réels avec qui on collabore ; rémunérer correctement.</li><li>Mesurer l'empreinte : une génération vidéo consomme de l'énergie ; éviter les générations inutiles (planifier avant de générer).</li></ul>
<h2>Checklist juridique avant diffusion</h2>
<ol><li>Aucune personne réelle reconnaissable sans consentement écrit.</li><li>Aucun personnage, logo ou style protégé reproduit à des fins commerciales.</li><li>Licence commerciale des outils vérifiée ; musique sous licence adaptée.</li><li>Mentions de transparence (plateforme + légende) et de partenariat.</li><li>Allégations vérifiables ; témoignages réels ou avatar clairement signalé.</li><li>Données personnelles : aucune téléversée sans base légale.</li></ol>
<div class="callout warn"><b>Le doute</b>Si tu te demandes « est-ce que j'ai le droit ? », la réponse est presque toujours : demande l'autorisation écrite, ou ne le fais pas. Les sanctions (civiles, pénales, bannissement des plateformes) dépassent largement le gain.</div>`,
          exercice: {
            type: 'qcm', titre: 'Cas pratiques juridiques',
            enonce: `<p>Quelles situations sont acceptables sans démarche supplémentaire ? (plusieurs réponses)</p>`,
            options: ['Utiliser un personnage fictif généré comme mascotte de marque', 'Cloner la voix d\'un acteur célèbre pour une publicité « hommage »', 'Générer une vidéo d\'un produit dans un décor imaginaire, avec mention « visuels générés par IA »', 'Faire dire à un avatar réaliste « j\'utilise ce produit depuis un an » sans mention', 'Reproduire le style graphique d\'un studio d\'animation célèbre pour vendre des affiches', 'Utiliser une musique générée avec un abonnement incluant la licence commerciale'],
            bonne: [0, 2, 5], multiple: true,
            explication: 'La voix d\'une personne réelle exige son consentement ; un faux témoignage est une pratique trompeuse ; le style identifiable d\'un studio protégé expose à des réclamations en usage commercial.'
          },
          quiz: [
            { q: 'Une image purement générée par IA est-elle protégée par le droit d\'auteur ?', options: ['Oui, automatiquement', 'Généralement non sans apport créatif humain substantiel', 'Oui si elle est payante'], bonne: 1, explication: 'Ton montage, ton script et ta sélection, eux, peuvent l\'être.' },
            { q: 'Que risque-t-on à diffuser un deepfake d\'une personne réelle sans consentement ?', options: ['Rien', 'Des sanctions civiles et pénales, et le bannissement des plateformes', 'Un avertissement'], bonne: 1, explication: 'Le Code pénal sanctionne explicitement les deepfakes non consentis depuis 2024.' },
            { q: 'La mention « généré par IA » nuit-elle à la performance ?', options: ['Oui fortement', 'Pas de façon mesurable quand le contenu est de qualité ; elle préserve la confiance', 'Elle double les vues'], bonne: 1, explication: 'La transparence est une exigence réglementaire et un atout de crédibilité.' }
          ]
        },
        {
          titre: 'Études de cas : décrypter ce qui marche',
          theorie: `<p>Analyser des productions réelles est le meilleur accélérateur. Voici quatre cas types, reconstitués à partir de pratiques courantes du marché, avec ce qui a fonctionné et les enseignements transférables.</p>
<h2>Cas 1 : la marque de cosmétiques et ses 40 variantes</h2>
<p><strong>Situation</strong> : une petite marque de soins avec un budget publicitaire limité et un seul packshot. <strong>Démarche</strong> : produit détouré, 40 mises en scène générées (saisons, matières, lumières), 8 animées en I2V, 5 hooks textuels. Campagne Meta avec 20 créations en test. <strong>Résultat type</strong> : coût par acquisition divisé par deux en trois semaines, trois créations concentrant 70 % des conversions — aucune n'était celle que l'équipe aurait choisie a priori. <strong>Leçon</strong> : le volume de variantes et le test battent l'intuition ; le produit exact, jamais déformé, est non négociable.</p>
<h2>Cas 2 : le créateur solo et sa série de micro-fictions</h2>
<p><strong>Situation</strong> : un créateur sans compétence de tournage lance une série « Et si… ? » (micro-fictions de 30 s). <strong>Démarche</strong> : un personnage récurrent (planche + cref), un style illustration constant, une voix synthétique attitrée, un template de montage, deux vidéos par semaine. <strong>Résultat type</strong> : 20 premières vidéos entre 500 et 3 000 vues ; la 23e dépasse le million grâce à un hook « résultat d'abord » et une chute. Les suivantes profitent de l'élan. <strong>Leçon</strong> : la régularité et l'identité (personnage, style) créent la reconnaissance ; le succès vient d'un hook, pas de la qualité d'image.</p>
<h2>Cas 3 : la PME et ses formations internes</h2>
<p><strong>Situation</strong> : une entreprise de 80 personnes avec des procédures qui changent tous les trimestres ; vidéos de formation obsolètes et coûteuses. <strong>Démarche</strong> : avatar présentateur (clone vidéo consenti d'un formateur), scripts maintenus dans un document, schémas générés, captures d'écran réelles, génération en 4 langues. <strong>Résultat type</strong> : mise à jour d'un module en une heure au lieu d'une semaine de tournage ; taux de complétion en hausse grâce aux formats courts chapitrés. <strong>Leçon</strong> : l'IA excelle quand le contenu change souvent ; la valeur est dans le script et la structure.</p>
<h2>Cas 4 : l'échec instructif</h2>
<p><strong>Situation</strong> : une agence livre une publicité « cinématographique » entièrement générée pour un restaurant : plans spectaculaires, drone, foules. <strong>Problème</strong> : les plats ne ressemblent pas à ceux du restaurant, les clients remarquent des mains à six doigts, les commentaires se moquent du « côté IA », la marque retire la vidéo. <strong>Leçon</strong> : le réalisme non maîtrisé se retourne contre la marque ; pour la nourriture et les produits, partir du réel (photos) et vérifier chaque image ; assumer un style stylisé plutôt qu'un réalisme raté ; contrôle qualité et transparence.</p>
<h2>Grille d'analyse à réutiliser</h2>
<ol><li><strong>Objectif</strong> : notoriété, conversion, formation, communauté ?</li><li><strong>Hook</strong> : mécanisme, visuel, texte ; taux à 3 s si disponible.</li><li><strong>Structure</strong> : combien de temps, de plans, quel rythme ?</li><li><strong>Cohérence</strong> : personnage, style, lumière ; défauts IA visibles ?</li><li><strong>Son</strong> : voix, musique, SFX, sous-titres.</li><li><strong>Transparence et droits</strong>.</li><li><strong>Résultat</strong> et ce qu'on reproduirait / éviterait.</li></ol>
<div class="callout info"><b>Entraînement</b>Chaque semaine, analyse trois vidéos performantes de ta niche avec cette grille. En un mois, tu auras internalisé les motifs qui marchent — et tu les reconnaîtras dans tes propres productions.</div>`,
          exercice: {
            type: 'texte', titre: 'Analyser une vidéo avec la grille',
            enonce: `<p>Choisis une vidéo courte générée (ou assistée) par IA que tu as vue récemment, ou l'un des cas ci-dessus. Rédige son analyse avec la grille en 7 points (objectif, hook, structure, cohérence, son, transparence/droits, résultat et enseignements). Sois concret : nomme le mécanisme du hook, estime le nombre de plans et leur durée, identifie au moins un point fort et un point faible.</p>`,
            placeholder: '1. Objectif : …\n2. Hook : …\n3. Structure : …\n4. Cohérence : …\n5. Son : …\n6. Transparence / droits : …\n7. Résultat et enseignements : …',
            criteres: [
              { label: 'Les 7 points de la grille abordés', verif: t => ['objectif', 'hook', 'structure', 'coh[ée]rence', 'son', 'transparence|droits', 'r[ée]sultat|enseignement'].every(r => new RegExp(r, 'i').test(t)) },
              { label: 'Mécanisme du hook nommé', re: /question|promesse|contradiction|r[ée]sultat d.abord|avant\/apr[èe]s|chiffre|curiosit|surprise|boucle/i },
              { label: 'Nombre de plans et/ou durées estimés', re: /\d+\s?plans?|\d+\s?s\b|\d+\s?secondes/i },
              { label: 'Un point fort identifié', re: /point fort|r[ée]ussi|efficace|fonctionne|bien|force/i },
              { label: 'Un point faible identifié', re: /point faible|d[ée]faut|rat[ée]|probl[èe]me|faiblesse|manque|am[ée]liorer/i },
              { label: 'Un enseignement transférable', re: /enseignement|le[çc]on|[àa] reproduire|[àa] [ée]viter|retenir|transf[ée]rable/i },
              motsMin(130)
            ],
            solution: `<p>1. Objectif : notoriété et conversion pour une marque de thé (cas 1 adapté). 2. Hook : « résultat d'abord » — gros plan de vapeur sur une tasse avec le texte « 3 min pour le thé parfait » ; estimation 65 % à 3 s. 3. Structure : 22 s, 8 plans de 2 à 3,5 s, problème (thé amer) → geste (température, temps) → résultat → offre. 4. Cohérence : personnage récurrent cohérent sur 7 plans, un plan avec une main déformée coupé à 1,2 s pour limiter la gêne ; palette chaude constante. 5. Son : voix synthétique posée, musique acoustique sous ducking, SFX d'eau versée, sous-titres mot à mot. 6. Transparence : mention « visuels IA » en légende, produit réel détouré, pas de personne réelle. 7. Résultat : point fort = la métaphore de la minuterie qui fond ; point faible = CTA trop tardif (dernière seconde). Enseignement : placer l'offre dès la mi-vidéo en texte à l'écran et garder le CTA final ; reproduire la structure geste → résultat qui crée une valeur pratique partageable.</p>`
          },
          quiz: [
            { q: 'Dans le cas de la marque de cosmétiques, qu\'est-ce qui a fait baisser le coût d\'acquisition ?', options: ['Une seule création parfaite', 'Le volume de variantes testées', 'Un décor spectaculaire'], bonne: 1, explication: 'Les créations gagnantes n\'étaient pas celles pressenties : seul le test le révèle.' },
            { q: 'Pourquoi la publicité « cinématographique » du restaurant a-t-elle échoué ?', options: ['Trop courte', 'Réalisme non maîtrisé : plats infidèles, défauts visibles, perte de confiance', 'Pas de musique'], bonne: 1, explication: 'Pour les produits réels, partir du réel et contrôler chaque image.' },
            { q: 'Quel facteur a déclenché le succès du créateur de micro-fictions ?', options: ['La qualité d\'image', 'Un hook efficace, après la régularité qui a construit l\'identité', 'Le nombre d\'abonnés initial'], bonne: 1, explication: 'La constance crée la reconnaissance ; le hook crée l\'explosion.' }
          ]
        },
        {
          titre: 'Se professionnaliser : portfolio, offre et veille',
          theorie: `<p>Les compétences de ce parcours sont demandées : créateurs de contenu, agences, marques, formations, médias. Voici comment les transformer en activité — en tant qu'indépendant, en interne ou pour ses propres projets.</p>
<h2>Le portfolio</h2>
<ul><li>5 à 8 pièces maximum, <strong>variées par usage</strong> (produit, UGC/avatar, explainer, micro-fiction, format court viral) et chacune avec le <em>brief</em>, le <em>processus</em> (storyboard, images-clés, outils) et le <em>résultat</em> (métriques si possible).</li><li>Montrer le <strong>avant/après</strong> et le <strong>contrôle</strong> (cohérence de personnage, product shot exact) : c'est ce qui rassure un client, plus que le spectaculaire.</li><li>Un projet personnel abouti (une série de 10 vidéos publiées avec leurs statistiques) vaut plus que des tests isolés.</li><li>Héberger sur une page simple (parcours HTML/CSS de Lumio) + les réseaux où vit le format.</li></ul>
<h2>Construire une offre</h2>
<table><tr><th>Offre</th><th>Pour qui</th><th>Tarification indicative (France, 2026)</th></tr>
<tr><td>Pack de product shots (20 visuels + 4 animés)</td><td>e-commerce, artisans</td><td>300 à 900 €</td></tr>
<tr><td>Série de 8 vidéos courtes / mois</td><td>commerces, coachs, PME</td><td>800 à 2 500 €/mois</td></tr>
<tr><td>Publicités avec variantes (10 créations)</td><td>marques en acquisition</td><td>1 000 à 3 000 €</td></tr>
<tr><td>Explainer 60-90 s</td><td>startups, services</td><td>800 à 2 500 €</td></tr>
<tr><td>Kit de marque IA (personnage, style, voix, templates)</td><td>toute entreprise régulière</td><td>1 000 à 3 000 € une fois</td></tr>
<tr><td>Formation / accompagnement d'équipe</td><td>agences, services marketing</td><td>600 à 1 500 €/jour</td></tr></table>
<p>Facturer la <em>valeur</em> (résultats, temps économisé) et non les heures de génération. Préciser dans le contrat : droits d'usage, mentions IA, nombre de révisions, propriété des fichiers sources (prompts, planches), confidentialité des assets client.</p>
<h2>Trouver des clients</h2>
<p>Montrer plutôt que démarcher : publier son processus et ses résultats (les coulisses intéressent), proposer un audit gratuit de 15 minutes aux commerces locaux (parcours Business de Lumio), partenariats avec des agences qui n'ont pas la compétence, plateformes de freelances avec un portfolio ciblé. Le premier client rémunéré vient souvent du cercle proche : un pack product shots pour un artisan connu.</p>
<h2>Compétences à cultiver</h2>
<ul><li><strong>Direction artistique</strong> : composition, lumière, couleur, typographie. Les livres et cours de photo/cinéma restent la meilleure école.</li><li><strong>Écriture</strong> : scripts, hooks, structure. Lire des scénaristes et des publicitaires.</li><li><strong>Montage et son</strong> : un outil maîtrisé à fond.</li><li><strong>Analyse</strong> : lire les statistiques, tester, documenter.</li><li><strong>Cadre</strong> : droit, transparence, éthique.</li></ul>
<h2>Veille : rester à jour sans s'épuiser</h2>
<p>Les outils changent chaque mois ; les principes non. Suivre 3 à 5 sources fiables (chaînes YouTube spécialisées, newsletters, les blogs officiels des outils), tester une nouveauté par semaine, et surtout <strong>produire</strong> : la pratique régulière trie seule ce qui compte. Garder un fichier « expériences » : outil, date, test, verdict.</p>
<h2>Le positionnement qui dure</h2>
<p>Ne te présente pas comme « expert d'un outil » (il sera remplacé) mais comme <strong>créateur ou producteur de contenu augmenté par l'IA</strong> : tu apportes la stratégie, le récit, la direction artistique et la rigueur ; l'IA apporte la vitesse. C'est cette combinaison que les clients paient, et qui résiste aux évolutions technologiques.</p>
<div class="callout ok"><b>Parcours terminé</b>Images, vidéo, voix, formats courts, publicité, UGC, workflow, montage, droit et portfolio : tu as une chaîne de production complète. Prochaine étape : une série de 10 vidéos sur un sujet qui te passionne, publiées, mesurées, améliorées. C'est ton premier cas d'étude — et ton portfolio.</div>`,
          exercice: {
            type: 'texte', titre: 'Rédiger une offre de service',
            enonce: `<p>Rédige une <strong>offre de service</strong> d'une page pour des commerces locaux : nom de l'offre, à qui elle s'adresse, ce qu'elle comprend précisément (livrables, volume, délais), le processus en étapes, le prix (ou une fourchette), les conditions (révisions, droits d'usage, mentions IA, fichiers sources) et une preuve ou un exemple. Ton professionnel, clair, sans jargon.</p>`,
            placeholder: 'Offre « … »\nPour : …\nComprend : …\nProcessus : …\nPrix : …\nConditions : …\nExemple : …',
            criteres: [
              { label: 'Nom de l\'offre et cible', re: /offre[\s\S]*pour\s*:|cible|destin[ée]e? (aux|à)/i },
              { label: 'Livrables précis avec volumes (nombre de vidéos/visuels)', re: /\d+\s?(vid[ée]os?|visuels?|product shots?|cr[ée]ations?|images?)/i },
              { label: 'Délais indiqués', re: /\d+\s?(jours?|semaines?)|d[ée]lai|livr[ée]/i },
              { label: 'Processus en étapes', verif: t => (t.match(/^\s*\d+[.)]|[ée]tape/gmi) || []).length >= 3 },
              { label: 'Prix ou fourchette', re: /\d+\s?(€|euros)/i },
              { label: 'Conditions : révisions, droits d\'usage, mentions IA', verif: t => ['r[ée]vision', 'droits?', 'mention|transparence|\\bIA\\b'].every(r => new RegExp(r, 'i').test(t)) },
              { label: 'Une preuve ou un exemple', re: /exemple|r[ée]sultat|cas|t[ée]moignage|portfolio|\d+\s?%|\d+\s?vues/i },
              motsMin(150)
            ],
            solution: `<p>Offre « Vitrine vidéo » — Pour : restaurants, commerces et artisans de la métropole qui veulent être visibles sur Instagram et TikTok sans y passer leurs soirées. Comprend : 8 vidéos courtes verticales par mois (20-30 s), 12 visuels produits mis en scène, sous-titres, musique sous licence, légendes et hashtags, un rapport mensuel de résultats. Délais : kit de marque livré sous 7 jours (personnage ou style, voix, templates), puis 2 vidéos par semaine. Processus : 1. Brief d'une heure et collecte des photos produits ; 2. Kit de marque et validation ; 3. Scripts du mois validés en une fois ; 4. Production (images, animation, montage) ; 5. Livraison hebdomadaire et programmation ; 6. Bilan mensuel et ajustements. Prix : 1 200 € HT par mois, engagement 3 mois, kit inclus ; pack découverte 4 vidéos à 650 €. Conditions : deux tours de révisions par vidéo ; droits d'usage illimités sur vos réseaux et votre site ; mention « visuels générés par IA » en légende ; aucune personne réelle générée sans accord écrit ; fichiers sources (prompts, planches) remis en fin de contrat. Exemple : pour une fromagerie, la série « La question du jour » a atteint 180 000 vues en six semaines et une hausse de 30 % des demandes de plateaux sur le formulaire du site.</p>`
          },
          quiz: [
            { q: 'Que doit montrer un portfolio IA pour rassurer un client ?', options: ['Uniquement des images spectaculaires', 'Le processus et le contrôle : brief, cohérence, product shots exacts, résultats', 'Le nombre d\'outils utilisés'], bonne: 1, explication: 'Le client achète la maîtrise et la fiabilité, pas l\'effet.' },
            { q: 'Sur quelle base facturer ?', options: ['Les heures de génération', 'La valeur livrée (résultats, temps économisé)', 'Le nombre de prompts'], bonne: 1, explication: 'La génération est rapide ; la valeur est dans la stratégie, la direction et la rigueur.' },
            { q: 'Quel positionnement résiste à l\'évolution des outils ?', options: ['Expert d\'un outil précis', 'Créateur/producteur de contenu augmenté par l\'IA', 'Vendeur de prompts'], bonne: 1, explication: 'Les outils se remplacent ; la stratégie, le récit et la direction artistique restent.' }
          ]
        }
      ]
    }
  ]
};
