// Catégories de commerces : libellé français, requête Google Places (texte + type),
// sélecteurs OpenStreetMap pour le mode gratuit.
//
// `type` : type « Table A » de Places API (New), utilisé comme includedType avec
// strictTypeFiltering. Laissé vide quand aucun type ne correspond exactement :
// la recherche se fait alors sur le texte seul. Si Google refuse un type,
// la fonction serveur relance automatiquement la recherche sans type.

export const GROUPS = [
  { id: 'resto', label: 'Restauration' },
  { id: 'beaute', label: 'Beauté & bien-être' },
  { id: 'auto', label: 'Automobile' },
  { id: 'batiment', label: 'Artisans du bâtiment' },
  { id: 'sante', label: 'Santé' },
  { id: 'services', label: 'Services & conseil' },
  { id: 'commerce', label: 'Commerces' },
  { id: 'loisirs', label: 'Sport, loisirs & hébergement' },
];

export const CATEGORIES = [
  // Restauration
  { id: 'restaurant', label: 'Restaurant', group: 'resto', query: 'restaurant', type: 'restaurant', osm: ['["amenity"="restaurant"]'] },
  { id: 'cafe', label: 'Café, bar', group: 'resto', query: 'café bar', type: 'cafe', osm: ['["amenity"="cafe"]', '["amenity"="bar"]', '["amenity"="pub"]'] },
  { id: 'boulangerie', label: 'Boulangerie, pâtisserie', group: 'resto', query: 'boulangerie pâtisserie', type: 'bakery', osm: ['["shop"="bakery"]', '["shop"="pastry"]'] },
  { id: 'boucherie', label: 'Boucherie, charcuterie', group: 'resto', query: 'boucherie', type: 'butcher_shop', osm: ['["shop"="butcher"]'] },
  { id: 'traiteur', label: 'Traiteur', group: 'resto', query: 'traiteur', type: 'catering_service', osm: ['["craft"="caterer"]', '["shop"="deli"]'] },
  { id: 'fastfood', label: 'Snack, fast-food', group: 'resto', query: 'snack fast food', type: 'fast_food_restaurant', osm: ['["amenity"="fast_food"]'] },
  { id: 'pizzeria', label: 'Pizzeria', group: 'resto', query: 'pizzeria', type: 'pizza_restaurant', osm: ['["amenity"~"^(restaurant|fast_food)$"]["cuisine"~"pizza"]'] },

  // Beauté & bien-être
  { id: 'coiffeur', label: 'Coiffeur', group: 'beaute', query: 'coiffeur', type: 'hair_salon', osm: ['["shop"="hairdresser"]'] },
  { id: 'barbier', label: 'Barbier', group: 'beaute', query: 'barbier', type: 'barber_shop', osm: ['["shop"="hairdresser"]["hairdresser"~"barber"]', '["shop"="barber"]', '["shop"="hairdresser"]["name"~"barb",i]'] },
  { id: 'institut', label: 'Institut de beauté', group: 'beaute', query: 'institut de beauté', type: 'beauty_salon', osm: ['["shop"="beauty"]'] },
  { id: 'ongles', label: 'Onglerie', group: 'beaute', query: 'onglerie prothésiste ongulaire', type: 'nail_salon', osm: ['["shop"="beauty"]["beauty"~"nails"]'] },
  { id: 'spa', label: 'Spa, massage', group: 'beaute', query: 'spa massage', type: 'spa', osm: ['["shop"="massage"]', '["leisure"="spa"]', '["amenity"="spa"]'] },
  { id: 'tatouage', label: 'Tatoueur', group: 'beaute', query: 'salon de tatouage', type: '', osm: ['["shop"="tattoo"]'] },

  // Automobile
  { id: 'garage', label: 'Garage, mécanique', group: 'auto', query: 'garage automobile', type: 'car_repair', osm: ['["shop"="car_repair"]'] },
  { id: 'carrosserie', label: 'Carrosserie', group: 'auto', query: 'carrosserie', type: '', osm: ['["shop"="car_repair"]["name"~"carross",i]', '["craft"="car_painter"]'] },
  { id: 'lavage', label: 'Lavage auto', group: 'auto', query: 'lavage auto', type: 'car_wash', osm: ['["amenity"="car_wash"]'] },
  { id: 'autoecole', label: 'Auto-école', group: 'auto', query: 'auto-école', type: '', osm: ['["amenity"="driving_school"]', '["shop"="driving_school"]'] },

  // Artisans du bâtiment
  { id: 'plombier', label: 'Plombier', group: 'batiment', query: 'plombier', type: 'plumber', osm: ['["craft"="plumber"]'] },
  { id: 'electricien', label: 'Électricien', group: 'batiment', query: 'électricien', type: 'electrician', osm: ['["craft"="electrician"]'] },
  { id: 'serrurier', label: 'Serrurier', group: 'batiment', query: 'serrurier', type: 'locksmith', osm: ['["craft"="locksmith"]', '["shop"="locksmith"]'] },
  { id: 'peintre', label: 'Peintre en bâtiment', group: 'batiment', query: 'peintre en bâtiment', type: 'painter', osm: ['["craft"="painter"]'] },
  { id: 'couvreur', label: 'Couvreur', group: 'batiment', query: 'couvreur', type: 'roofing_contractor', osm: ['["craft"="roofer"]'] },
  { id: 'menuisier', label: 'Menuisier', group: 'batiment', query: 'menuisier', type: '', osm: ['["craft"="carpenter"]', '["craft"="joiner"]'] },
  { id: 'paysagiste', label: 'Paysagiste', group: 'batiment', query: 'paysagiste', type: '', osm: ['["craft"="gardener"]'] },

  // Santé
  { id: 'dentiste', label: 'Dentiste', group: 'sante', query: 'dentiste', type: 'dentist', osm: ['["amenity"="dentist"]', '["healthcare"="dentist"]'] },
  { id: 'kine', label: 'Kinésithérapeute', group: 'sante', query: 'kinésithérapeute', type: 'physiotherapist', osm: ['["healthcare"="physiotherapist"]'] },
  { id: 'osteo', label: 'Ostéopathe', group: 'sante', query: 'ostéopathe', type: '', osm: ['["healthcare:speciality"~"osteopath"]'] },
  { id: 'opticien', label: 'Opticien', group: 'sante', query: 'opticien', type: '', osm: ['["shop"="optician"]'] },
  { id: 'veterinaire', label: 'Vétérinaire', group: 'sante', query: 'vétérinaire', type: 'veterinary_care', osm: ['["amenity"="veterinary"]'] },

  // Services & conseil
  { id: 'avocat', label: 'Avocat', group: 'services', query: 'avocat', type: 'lawyer', osm: ['["office"="lawyer"]'] },
  { id: 'comptable', label: 'Expert-comptable', group: 'services', query: 'expert-comptable', type: 'accounting', osm: ['["office"="accountant"]'] },
  { id: 'immobilier', label: 'Agence immobilière', group: 'services', query: 'agence immobilière', type: 'real_estate_agency', osm: ['["office"="estate_agent"]'] },
  { id: 'assurance', label: 'Assurance', group: 'services', query: 'agence d\'assurance', type: 'insurance_agency', osm: ['["office"="insurance"]'] },
  { id: 'pressing', label: 'Pressing, laverie', group: 'services', query: 'pressing', type: '', osm: ['["shop"="dry_cleaning"]', '["shop"="laundry"]'] },
  { id: 'cordonnerie', label: 'Cordonnerie', group: 'services', query: 'cordonnerie', type: '', osm: ['["shop"="shoe_repair"]', '["craft"="shoemaker"]'] },
  { id: 'retouche', label: 'Couture, retouches', group: 'services', query: 'retouche couture', type: 'tailor', osm: ['["craft"="tailor"]', '["shop"="tailor"]'] },
  { id: 'demenageur', label: 'Déménageur', group: 'services', query: 'déménageur', type: 'moving_company', osm: ['["office"="moving_company"]', '["shop"="moving_company"]'] },
  { id: 'photographe', label: 'Photographe', group: 'services', query: 'photographe', type: '', osm: ['["craft"="photographer"]', '["shop"="photo"]'] },
  { id: 'toilettage', label: 'Toilettage animalier', group: 'services', query: 'toilettage chien', type: '', osm: ['["shop"="pet_grooming"]'] },

  // Commerces
  { id: 'vetements', label: 'Boutique de vêtements', group: 'commerce', query: 'boutique de vêtements', type: 'clothing_store', osm: ['["shop"="clothes"]'] },
  { id: 'chaussures', label: 'Chaussures', group: 'commerce', query: 'magasin de chaussures', type: 'shoe_store', osm: ['["shop"="shoes"]'] },
  { id: 'bijouterie', label: 'Bijouterie', group: 'commerce', query: 'bijouterie', type: 'jewelry_store', osm: ['["shop"="jewelry"]'] },
  { id: 'fleuriste', label: 'Fleuriste', group: 'commerce', query: 'fleuriste', type: 'florist', osm: ['["shop"="florist"]'] },
  { id: 'epicerie', label: 'Épicerie, primeur', group: 'commerce', query: 'épicerie', type: 'grocery_store', osm: ['["shop"="convenience"]', '["shop"="greengrocer"]'] },
  { id: 'caviste', label: 'Caviste', group: 'commerce', query: 'caviste', type: 'liquor_store', osm: ['["shop"="wine"]', '["shop"="alcohol"]'] },
  { id: 'animalerie', label: 'Animalerie', group: 'commerce', query: 'animalerie', type: 'pet_store', osm: ['["shop"="pet"]'] },
  { id: 'telephonie', label: 'Réparation téléphone', group: 'commerce', query: 'réparation téléphone', type: '', osm: ['["shop"="mobile_phone"]', '["craft"="electronics_repair"]'] },

  // Sport, loisirs & hébergement
  { id: 'sport', label: 'Salle de sport', group: 'loisirs', query: 'salle de sport', type: 'gym', osm: ['["leisure"="fitness_centre"]'] },
  { id: 'yoga', label: 'Yoga, pilates', group: 'loisirs', query: 'yoga pilates', type: 'yoga_studio', osm: ['["sport"~"yoga|pilates"]'] },
  { id: 'hotel', label: 'Hôtel, chambre d\'hôtes', group: 'loisirs', query: 'hôtel chambre d\'hôtes', type: 'lodging', osm: ['["tourism"="hotel"]', '["tourism"="guest_house"]'] },
];

export const PRESETS = [
  { id: 'classique', label: 'Classique commerces', ids: ['restaurant', 'boulangerie', 'coiffeur', 'barbier', 'institut', 'garage'] },
  { id: 'artisans', label: 'Artisans', ids: ['plombier', 'electricien', 'serrurier', 'peintre', 'couvreur', 'menuisier', 'paysagiste'] },
  { id: 'beaute', label: 'Beauté', ids: ['coiffeur', 'barbier', 'institut', 'ongles', 'spa', 'tatouage'] },
  { id: 'resto', label: 'Restauration', ids: ['restaurant', 'cafe', 'boulangerie', 'traiteur', 'fastfood', 'pizzeria', 'boucherie'] },
  { id: 'auto', label: 'Auto', ids: ['garage', 'carrosserie', 'lavage', 'autoecole'] },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryById(id) {
  return BY_ID.get(id) || null;
}

export function categoryLabel(id) {
  return BY_ID.get(id)?.label || id;
}
