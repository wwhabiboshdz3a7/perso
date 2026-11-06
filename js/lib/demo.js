// Données de DÉMONSTRATION entièrement fictives (noms inventés, numéros de la plage
// réservée par l'ARCEP aux œuvres de fiction) : pour découvrir l'outil sans clé Google.
import { CATEGORIES, categoryById } from './categories.js';
import { classifyWebsite } from './website.js';
import { zoneBbox, pointInZone } from './geo.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = {
  restaurant: ['Le Comptoir des Lilas', 'La Table d\'Augustin', 'Bistrot du Platane', 'L\'Assiette Rose', 'Chez Mireille', 'Le Petit Cassoulet', 'La Brasserie du Marché'],
  cafe: ['Café des Arcades', 'Le Zinc Doré', 'Bar de la Fontaine', 'Café Violette'],
  boulangerie: ['Boulangerie du Canal', 'Au Fournil d\'Émile', 'La Mie Dorée', 'Pains & Merveilles', 'Maison Bastide'],
  boucherie: ['Boucherie Sarrat', 'Maison Lacoste'],
  traiteur: ['Saveurs de Garonne', 'Traiteur Les Délices d\'Inès'],
  fastfood: ['Snack Le Soleil', 'Tacos Express Lilas'],
  pizzeria: ['Pizzeria Bella Nonna', 'Il Forno Rosso'],
  coiffeur: ['Atelier Mèches & Ciseaux', 'Coiffure Élégance', 'Studio Capella', 'L\'Instant Coiffure', 'Salon Opaline'],
  barbier: ['Barber Club Brique', 'Le Barbier du Faubourg', 'Gentleman Barber'],
  institut: ['Institut Belle Lune', 'Éclat de Soi', 'Institut Pétale'],
  ongles: ['Nails by Sofia', 'Ongles d\'Or'],
  spa: ['Spa Bulle de Rose', 'Massage Zen Garonne'],
  tatouage: ['Encre Violette Tattoo'],
  garage: ['Garage Saint-Éloi', 'Auto Service Mercadier', 'Garage des Pyrénées', 'Méca Express 31'],
  carrosserie: ['Carrosserie Ferrand', 'Carrosserie du Sud'],
  lavage: ['Lavage Éclair'],
  autoecole: ['Auto-École Feu Vert Lilas'],
  plombier: ['Plomberie Garcia', 'SOS Fuites Martin', 'Plombier Dupuy & Fils'],
  electricien: ['Élec Services Roque', 'Électricité Moreau'],
  serrurier: ['Serrurerie Rapide Lilas'],
  peintre: ['Peinture & Déco Albert'],
  couvreur: ['Toitures Fabre'],
  menuisier: ['Menuiserie Bois d\'Oc'],
  paysagiste: ['Jardins de Candie'],
  dentiste: ['Cabinet dentaire des Platanes'],
  kine: ['Kiné Santé Lilas'],
  osteo: ['Ostéopathe Claire Vidal'],
  opticien: ['Optique du Pont'],
  veterinaire: ['Clinique vétérinaire des Tilleuls'],
  avocat: ['Cabinet Maître Delpech'],
  comptable: ['Cabinet Comptable Rivière'],
  immobilier: ['Immo Rose Conseil'],
  assurance: ['Agence Assur\'Oc'],
  pressing: ['Pressing Blanc Neige'],
  cordonnerie: ['Cordonnerie du Marché'],
  retouche: ['Retouches Fil d\'Or'],
  demenageur: ['Déménagements Tolosa'],
  photographe: ['Studio Lumière Rose'],
  toilettage: ['Toilettage Patounes'],
  vetements: ['Boutique Mademoiselle Lou', 'Dressing 31'],
  chaussures: ['Chaussures Pas de Velours'],
  bijouterie: ['Bijouterie Saphir'],
  fleuriste: ['Fleurs de Garonne', 'L\'Atelier Floral Iris'],
  epicerie: ['Épicerie Fine Les Halles', 'Primeur Bio Lilas'],
  caviste: ['La Cave d\'Ernest'],
  animalerie: ['Animalerie Arche d\'Oc'],
  telephonie: ['Répar\'Phone Express'],
  sport: ['Fit Studio Garonne', 'Salle Énergie Club'],
  yoga: ['Yoga Lotus Rose'],
  hotel: ['Hôtel des Platanes', 'Chambres d\'hôtes La Glycine'],
};

const STREETS = ['rue des Lilas', 'avenue des Platanes', 'place du Marché', 'rue de la Fontaine', 'boulevard des Tilleuls', 'rue du Moulin', 'allée des Glycines', 'rue Pasteur', 'impasse des Roses', 'chemin des Vignes'];
const SOCIAL_SITES = ['https://www.facebook.com/demo.prospect', 'https://www.instagram.com/demo.prospect/', 'https://www.planity.com/demo-prospect', 'https://linktr.ee/demoprospect', 'https://demo-prospect.business.site/', 'https://www.pagesjaunes.fr/pros/demo'];
const REAL_SITES = ['https://www.demo-prospect.fr/', 'https://demo-prospect.wixsite.com/accueil', 'https://www.exemple-commerce.fr/'];

/**
 * @param {{zone:object, categoryIds:string[], seed?:number}} o
 */
export function demoPlaces({ zone, categoryIds, seed = 31 }) {
  const rnd = mulberry32(seed);
  const ids = categoryIds?.length ? categoryIds : ['restaurant', 'boulangerie', 'coiffeur', 'barbier', 'institut', 'garage'];
  const b = zoneBbox(zone);
  const out = [];
  let n = 0;
  for (const catId of ids) {
    const cat = categoryById(catId) || CATEGORIES[0];
    const names = NAMES[catId] || [`${cat.label} Démo`];
    const count = Math.max(names.length, Math.round(4 + rnd() * 6));
    for (let i = 0; i < count; i++) {
      let lat; let lng; let tries = 0;
      do {
        lat = b.south + (b.north - b.south) * (0.08 + 0.84 * rnd());
        lng = b.west + (b.east - b.west) * (0.08 + 0.84 * rnd());
        tries++;
      } while (!pointInZone({ lat, lng }, zone) && tries < 20);
      const base = names[i % names.length];
      const name = i < names.length ? base : `${base} ${['II', 'Centre', 'Sud', 'Nord'][i % 4]}`;
      const reviews = Math.round(Math.exp(1 + rnd() * 5.2));
      const rating = Math.round((3.6 + rnd() * 1.4) * 10) / 10;
      const r = rnd();
      const websiteUri = r < 0.48 ? '' : r < 0.74 ? SOCIAL_SITES[Math.floor(rnd() * SOCIAL_SITES.length)] : REAL_SITES[Math.floor(rnd() * REAL_SITES.length)];
      const mobile = rnd() < 0.35;
      const hasPhone = rnd() < 0.9;
      const num = String(n % 100).padStart(2, '0');
      const num2 = String(Math.floor(rnd() * 100)).padStart(2, '0');
      const phone = hasPhone ? (mobile ? `06 39 98 ${num} ${num2}` : `05 36 49 ${num} ${num2}`) : '';
      const street = STREETS[Math.floor(rnd() * STREETS.length)];
      n++;
      out.push({
        id: `demo:${catId}:${i}`,
        source: 'demo',
        name,
        address: `${1 + Math.floor(rnd() * 80)} ${street}, 31000 Villedémo`,
        city: 'Villedémo',
        lat,
        lng,
        phone,
        phoneIntl: phone ? `+33 ${phone.slice(1)}` : '',
        websiteUri,
        website: classifyWebsite(websiteUri),
        rating,
        reviews,
        mapsUrl: '',
        type: cat.type || '',
        typeLabel: cat.label,
        categories: [catId],
        businessStatus: 'OPERATIONAL',
      });
    }
  }
  return out;
}
