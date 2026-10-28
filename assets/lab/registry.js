// Catalogue des effets du lab : métadonnées communes à la galerie et aux pages.
export const EFFECTS = [
  { slug: 'split', n: '01', name: 'Split élastique', technique: 'SplitText · stagger · elastic.out', text: 'Le texte respire', color: '#c6ff3d', modes: ['lettres', 'mots', 'lignes'] },
  { slug: 'scramble', n: '02', name: 'Décodage', technique: 'ScrambleTextPlugin · terminal', text: 'Signal reçu', color: '#c6ff3d' },
  { slug: 'cylindre', n: '03', name: 'Cylindre', technique: 'CSS 3D · preserve-3d · rotateY', text: 'Tourne encore', color: '#ff4d24' },
  { slug: 'tunnel', n: '04', name: 'Tunnel', technique: 'CSS 3D · anneaux en profondeur', text: 'Plus loin', color: '#c6ff3d' },
  { slug: 'sphere', n: '05', name: 'Sphère de lettres', technique: 'Spirale de Fibonacci sur sphère · CSS 3D', text: 'Monde', color: '#ff4d24' },
  { slug: 'ressorts', n: '06', name: 'Ressorts', technique: 'Physique masse-ressort · pointeur', text: 'Touche-moi', color: '#c6ff3d', modes: ['repousser', 'aimanter'] },
  { slug: 'variable', n: '07', name: 'Variable', technique: 'Roboto Flex · wght wdth slnt animés', text: 'Élastique', color: '#c6ff3d' },
  { slug: 'masque', n: '08', name: 'Masque vivant', technique: 'mix-blend-mode · canvas animé', text: 'Lumière', color: '#ff4d24' },
  { slug: 'particules', n: '09', name: 'Particules', technique: 'Canvas 2D · échantillonnage des pixels', text: 'Poussière', color: '#c6ff3d' },
  { slug: 'liquide', n: '10', name: 'Liquide & glitch', technique: 'WebGL · déplacement RGB · ondulation', text: 'Liquide', color: '#ff4d24' },
  { slug: 'marquees', n: '11', name: 'Marquees croisés', technique: 'Vitesse de défilement · skew', text: 'Mouvement', color: '#c6ff3d' },
  { slug: 'chemin', n: '12', name: 'Sur le chemin', technique: 'SVG textPath · startOffset · courbe animée', text: 'Le texte suit la courbe', color: '#ff4d24' },
  { slug: 'contour', n: '13', name: 'Contour', technique: 'SVG stroke-dashoffset · remplissage', text: 'Trace', color: '#c6ff3d' },
  { slug: 'machine', n: '14', name: 'Machine à écrire', technique: 'Frappe, hésitation, correction', text: 'Le texte se corrige tout seul.', color: '#ff4d24' },
  { slug: 'zoom', n: '15', name: 'Zoom infini', technique: 'Échelle exponentielle · clip-path', text: 'Motion', color: '#c6ff3d' },
  { slug: 'kaleido', n: '16', name: 'Kaléidoscope', technique: 'Canvas · symétries miroir', text: 'Miroir', color: '#ff4d24' },
  { slug: 'rideau', n: '17', name: 'Rideau de lignes', technique: 'Line reveal · masques overflow', text: 'Chaque ligne entre en scène à son tour', color: '#c6ff3d' },
  { slug: 'odometre', n: '18', name: 'Odomètre', technique: 'Rouleaux de chiffres · translateY', text: '2026', color: '#ff4d24' },
  { slug: 'gravite', n: '19', name: 'Gravité', technique: 'Physique AABB · rebonds · empilement', text: 'Tout finit par tomber un jour', color: '#c6ff3d', tone: 'light' },
  { slug: 'surlignage', n: '20', name: 'Surlignage', technique: 'Colorisation mot à mot', text: 'Chaque mot prend sa couleur au bon moment', color: '#c6ff3d', tone: 'light' },
  { slug: 'ascii', n: '21', name: 'ASCII', technique: 'Luminance → caractères · canvas', text: 'ASCII', color: '#c6ff3d' },
  { slug: 'splitflap', n: '22', name: 'Split-flap', technique: 'Volets 3D · rotateX', text: 'Départ immédiat', color: '#ffb000' },
  { slug: 'vague', n: '23', name: 'Vague', technique: 'Grille de glyphes · interférences', text: 'Onde', color: '#c6ff3d' },
  { slug: 'lorenz', n: '24', name: 'Lettres de Lorenz', technique: 'Attracteur de Lorenz · projection 3D', text: 'Chaos', color: '#ff4d24' },
  { slug: 'fibonacci', n: '25', name: 'Spirale dorée', technique: 'Phyllotaxie · angle d’or 137,5°', text: 'Fibonacci', color: '#c6ff3d' }
];

export const bySlug = (s) => EFFECTS.find((e) => e.slug === s);
