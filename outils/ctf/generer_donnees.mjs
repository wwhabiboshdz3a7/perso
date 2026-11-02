// Génère le jeu de données OpenStreetMap FICTIF de l'île de Saint-Lumin-sur-Mer (défis OSM & Overpass).
// Les coordonnées sont volontairement placées en plein océan Atlantique : rien n'existe à cet endroit.
// Usage : node outils/ctf/generer_donnees.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SORTIE = path.resolve(ICI, '../../assets/ctf/donnees');
const LAT0 = 45.2, LON0 = -3.5, MX = 111320 * Math.cos(LAT0 * Math.PI / 180), MY = 111320;
export const m = (x, y) => [+(LON0 + x / MX).toFixed(6), +(LAT0 + y / MY).toFixed(6)];

let idN = 1000, idW = 500;
const F = [];
const node = (x, y, tags, meta = {}) => { const id = ++idN; F.push({ type: 'Feature', geometry: { type: 'Point', coordinates: m(x, y) }, properties: { '@id': `node/${id}`, ...meta, ...tags } }); };
const way = (pts, tags, ferme = false) => {
  const id = ++idW; const c = pts.map(([x, y]) => m(x, y));
  F.push({ type: 'Feature', geometry: ferme ? { type: 'Polygon', coordinates: [[...c, c[0]]] } : { type: 'LineString', coordinates: c }, properties: { '@id': `way/${id}`, ...tags } });
};

// île (ellipse irrégulière) et environnement
const ile = Array.from({ length: 48 }, (_, i) => { const a = i / 48 * 2 * Math.PI; const r = 1 + 0.06 * Math.sin(3 * a) + 0.04 * Math.cos(5 * a); return [Math.cos(a) * 720 * r, Math.sin(a) * 470 * r]; });
way(ile, { place: 'island', name: 'Île de Saint-Lumin', note: 'Commune fictive créée pour l\'arène Lumio CTF' }, true);
way([[-250, -455], [250, -455], [250, -362], [-250, -362]], { leisure: 'marina', name: 'Port de Saint-Lumin' }, true);
way([[0, -362], [0, -480]], { man_made: 'pier', name: 'Jetée du Large' });
way([[300, -300], [520, -330], [600, -230], [430, -200]], { natural: 'beach', name: 'Plage des Galets' }, true);
way([[-520, -60], [-380, -60], [-380, 60], [-520, 60]], { leisure: 'park', name: 'Jardin des Salines' }, true);
// rues
way([[-320, -335], [320, -335]], { highway: 'residential', name: 'Quai du Port' });
way([[-320, -335], [-330, 0], [-300, 260]], { highway: 'residential', name: 'Rue des Embruns' });
way([[0, -335], [0, 210]], { highway: 'residential', name: 'Rue de la Mairie' });
way([[-560, 50], [0, 50], [520, 50], [670, 40]], { highway: 'tertiary', name: 'Avenue des Mouettes' });
way([[-320, -150], [320, -150]], { highway: 'residential', name: 'Rue du Marché' });
way([[-620, -120], [-470, 310]], { highway: 'track', name: 'Chemin des Dunes' });
way([[320, -335], [430, -250], [600, -160], [670, 40]], { highway: 'footway', name: 'Sentier des Douaniers' });
way([[-60, -190], [60, -190], [60, -110], [-60, -110]], { highway: 'pedestrian', area: 'yes', name: 'Place de la Halle' }, true);
// bâtiments emblématiques
way([[20, 70], [80, 70], [80, 110], [20, 110]], { building: 'townhall', amenity: 'townhall', name: 'Mairie de Saint-Lumin' }, true);
way([[-90, 100], [-40, 100], [-40, 150], [-90, 150]], { building: 'church', amenity: 'place_of_worship', religion: 'christian', name: 'Église Saint-Lumin' }, true);
way([[-360, 120], [-300, 120], [-300, 170], [-360, 170]], { building: 'school', amenity: 'school', name: 'École des Embruns' }, true);
way([[-50, -175], [50, -175], [50, -125], [-50, -125]], { building: 'retail', amenity: 'marketplace', name: 'Halle aux Poissons' }, true);
node(680, 40, { man_made: 'lighthouse', name: 'Phare de la Pointe', height: '32', start_date: '1868', 'seamark:light:character': 'Fl(2)', 'seamark:light:period': '10' });
// arrêts de bus
for (const [x, y, nom, ref] of [[600, 58, 'Le Phare', '1;3'], [22, -195, 'Halle aux Poissons', '1;2;5'], [-200, -322, 'Port', '2;4'], [210, -138, 'Marché', '5;4'], [-312, 110, 'École', '2;3'], [-520, 150, 'Les Dunes', '3'], [380, -262, 'Plage', '3;4'], [120, 62, 'Mairie', '1;2']])
  node(x, y, { highway: 'bus_stop', name: nom, route_ref: ref, bench: x % 2 ? 'yes' : 'no', shelter: 'yes' });
// boulangeries
for (const [x, y, nom] of [[560, 80, 'Au Fournil des Embruns'], [470, -10, 'Boulangerie des Mouettes'], [-280, -140, 'Boulangerie Kerlan'], [100, -300, 'Boulangerie Le Goff']])
  node(x, y, { shop: 'bakery', name: nom, opening_hours: 'Mo-Sa 07:00-19:30' });
// cafés
for (const [x, y, nom, terrasse, horaires, cartes] of [[-120, -312, 'Café du Port', 'yes', 'Mo-Sa 07:00-19:00', 'yes'], [620, 20, 'Le Phare Bleu', 'yes', 'Mo-Su 08:00-23:00', 'no'], [300, 64, 'Les Mouettes', 'no', 'Tu-Su 09:00-18:00', 'yes'], [240, -306, 'La Vague', 'yes', 'Mo-Fr 07:30-18:30; Su 09:00-13:00', 'yes'], [-20, -128, 'Chez Maryvonne', 'yes', 'Mo-Sa 06:30-20:00', 'yes'], [150, -318, 'L\'Écume', 'no', 'Mo-Su 10:00-02:00', 'yes']])
  node(x, y, { amenity: 'cafe', name: nom, outdoor_seating: terrasse, opening_hours: horaires, 'payment:cards': cartes, ...(cartes === 'no' ? { 'payment:cash': 'yes' } : {}) });
// pharmacies, poste, commerces
node(62, -142, { amenity: 'pharmacy', name: 'Pharmacie de la Halle', healthcare: 'pharmacy', dispensing: 'yes' });
node(-300, 62, { amenity: 'pharmacy', name: 'Pharmacie des Embruns', healthcare: 'pharmacy', dispensing: 'yes' });
node(-60, 40, { amenity: 'post_office', name: 'La Poste' });
node(-150, -150, { shop: 'supermarket', name: 'Supérette de l\'Île' });
node(-60, -318, { shop: 'seafood', name: 'Poissonnerie du Quai' });
node(330, -150, { amenity: 'restaurant', name: 'Le Homard Rieur', cuisine: 'seafood', outdoor_seating: 'yes' });
node(-410, 0, { tourism: 'information', information: 'board', name: 'Panneau du Jardin des Salines' });
// points d'eau potable
for (const [x, y, nom, fauteuil] of [[-40, -150, 'Fontaine des Sauniers', 'yes'], [200, -170, 'Fontaine du Marché', 'no'], [420, -280, 'Fontaine de la Plage', 'limited'], [650, 60, 'Point d\'eau du Phare', null], [235, -330, 'Fontaine du Quai', 'no']])
  node(x, y, { amenity: 'drinking_water', name: nom, ...(fauteuil ? { wheelchair: fauteuil } : {}) });
// bancs (le défi « rendez-vous » vise celui sans dossier, à moins de 40 m d'un point d'eau et de 60 m du port)
for (const [x, y, dossier] of [[-30, -350, 'yes'], [180, -345, 'no'], [-20, -165, 'no'], [410, -270, 'no'], [220, -342, 'no'], [262, -318, 'yes'], [-200, -346, 'no'], [640, 72, 'yes']])
  node(x, y, { amenity: 'bench', backrest: dossier, material: dossier === 'yes' ? 'wood' : 'stone' });

const fc = { type: 'FeatureCollection', metadata: { nom: 'Saint-Lumin-sur-Mer (commune fictive)', licence: 'Données inventées pour l\'arène Lumio CTF, tags conformes au wiki OpenStreetMap' }, features: F };
await mkdir(SORTIE, { recursive: true });
await writeFile(path.join(SORTIE, 'saint-lumin.geojson'), JSON.stringify(fc));
console.log(`${F.length} objets écrits dans assets/ctf/donnees/saint-lumin.geojson`);
console.log('banc cible :', m(220, -342).reverse());
