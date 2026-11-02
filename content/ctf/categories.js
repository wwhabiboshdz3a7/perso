// Catégories de l'arène CTF (données publiques, sans aucune solution).
const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const CATEGORIES = [
  { id: 'geoint', titre: 'Géolocalisation', court: 'GEOINT', couleur: '#f97316',
    icone: ico('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    description: 'Retrouver où une image a été prise : panneaux, plaques, langue, architecture, soleil et ombres. Validation par un clic sur la carte.' },
  { id: 'exif', titre: 'Métadonnées & EXIF', court: 'EXIF', couleur: '#ca8a04',
    icone: ico('<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/>'),
    description: 'Ce que les fichiers racontent d\'eux-mêmes : appareil, date, coordonnées GPS, logiciel, miniature oubliée.' },
  { id: 'osm', titre: 'OpenStreetMap & Overpass', court: 'OSM', couleur: '#16a34a',
    icone: ico('<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>'),
    description: 'Lire les tags OSM et interroger la carte avec Overpass QL pour trouver le bon lieu.' },
  { id: 'osint', titre: 'OSINT (personnage fictif)', court: 'OSINT', couleur: '#0891b2',
    icone: ico('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/><path d="M11 8v3l2 2"/>'),
    description: 'Enquête en sources ouvertes sur un personnage inventé : profils, pseudo réutilisé, archive, fuite, reflet.' },
  { id: 'inverse', titre: 'Image inversée & vérification', court: 'VÉRIF', couleur: '#9333ea',
    icone: ico('<rect x="3" y="4" width="13" height="13" rx="2"/><path d="m3 14 4-4 4 4"/><circle cx="17.5" cy="17.5" r="3"/><path d="m21 21-1.4-1.4"/>'),
    description: 'Remonter à la source d\'une image, repérer recadrages, miroirs, montages et images générées.' },
  { id: 'crypto', titre: 'Crypto débutant', court: 'CRYPTO', couleur: '#6d5dfc',
    icone: ico('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/>'),
    description: 'César, ROT13, Vigenère, Base64/32, hexadécimal, XOR, Morse, substitution… avec la boîte à outils intégrée.' },
  { id: 'stegano', titre: 'Stéganographie', court: 'STÉGANO', couleur: '#db2777',
    icone: ico('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>'),
    description: 'Messages cachés dans les bits d\'une image, après la fin d\'un fichier ou dans le spectre d\'un son.' },
  { id: 'web', titre: 'Web débutant', court: 'WEB', couleur: '#2563eb',
    icone: ico('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/><path d="m10 13-2 2 2 2M14 13l2 2-2 2"/>'),
    description: 'Mini-sites vulnérables simulés : code source, robots.txt, cookies, champs cachés, JavaScript côté client.' },
  { id: 'forensique', titre: 'Forensique & terminal', court: 'FORENSIQUE', couleur: '#dc2626',
    icone: ico('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>'),
    description: 'Journaux, chronologie d\'incident, signatures de fichiers et un terminal Linux simulé.' }
];
export const CATEGORIES_SPECIALES = {
  photos: { id: 'photos', titre: 'Mes photos', court: 'PHOTOS', couleur: '#0d9488', icone: ico('<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'), description: 'Défis de géolocalisation ajoutés par le propriétaire du site avec ses propres photos.' },
  packs: { id: 'packs', titre: 'Packs d\'amis', court: 'PACK', couleur: '#64748b', icone: ico('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'), description: 'Défis importés depuis un pack JSON partagé.' }
};
export const DIFFICULTES = { 1: 'Débutant', 2: 'Facile', 3: 'Intermédiaire' };
