// Faux Google Places API (New) pour les tests : jeu de lieux fictifs déterministe autour
// de Toulouse, filtrage par rectangle, pagination à 20 par page et limite de 60 résultats.
import { CATEGORIES } from '../../js/lib/categories.js';

export const TEST_KEY = 'cle-test';

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

const SURNAMES = ['Martin', 'Bernard', 'Dubois', 'Garcia', 'Roux', 'Fabre', 'Lacoste', 'Vidal', 'Castel', 'Mercier', 'Bastide', 'Rivière', 'Fontaine', 'Sarrat', 'Ferrand', 'Moreau', 'Delmas', 'Cazals'];
const PREFIX = {
  restaurant: ['Restaurant', 'Bistrot', 'La Table de', 'Chez'],
  boulangerie: ['Boulangerie', 'Le Fournil de', 'Maison'],
  coiffeur: ['Coiffure', 'Salon', 'Atelier'],
  barbier: ['Barber', 'Barbier'],
  garage: ['Garage', 'Auto Service'],
  plombier: ['Plomberie', 'Plombier'],
};
const SITES = ['', '', '', '', 'https://www.facebook.com/fictif', 'https://www.instagram.com/fictif/', 'https://www.planity.com/fictif', 'https://www.exemple-fictif.fr/', 'https://fictif.wixsite.com/site', ''];

/** Densité (lieux par km²) autour du centre de Toulouse, décroissante avec la distance. */
const DENSITY = { restaurant: 40, boulangerie: 6, coiffeur: 10, barbier: 4, garage: 3, plombier: 2 };

export function buildDataset({ seed = 7, center = { lat: 43.6045, lng: 1.4442 }, radiusKm = 6 } = {}) {
  const rnd = mulberry32(seed);
  const places = [];
  let n = 0;
  for (const cat of CATEGORIES) {
    const d = DENSITY[cat.id] ?? 1.2;
    const count = Math.round(d * Math.PI * radiusKm * radiusKm * 0.35);
    for (let i = 0; i < count; i++) {
      // concentration au centre : rayon ~ r^1.6
      const r = radiusKm * Math.pow(rnd(), 1.6);
      const a = rnd() * Math.PI * 2;
      const lat = center.lat + (r * Math.sin(a)) / 110.574;
      const lng = center.lng + (r * Math.cos(a)) / (111.32 * Math.cos((center.lat * Math.PI) / 180));
      const pre = (PREFIX[cat.id] || [cat.label.split(',')[0]])[Math.floor(rnd() * (PREFIX[cat.id]?.length || 1))];
      const name = `${pre} ${SURNAMES[Math.floor(rnd() * SURNAMES.length)]}`;
      const closed = rnd() < 0.04;
      const reviews = Math.round(Math.exp(rnd() * 5.5));
      places.push({
        id: `ChIJfictif${String(n).padStart(6, '0')}`,
        cat: cat.id,
        query: cat.query,
        type: cat.type,
        name,
        lat,
        lng,
        address: `${1 + Math.floor(rnd() * 90)} rue Fictive, 31000 Toulouse, France`,
        phone: rnd() < 0.88 ? `05 36 49 ${String(n % 100).padStart(2, '0')} ${String(Math.floor(rnd() * 100)).padStart(2, '0')}` : '',
        website: SITES[Math.floor(rnd() * SITES.length)],
        rating: Math.round((3.4 + rnd() * 1.6) * 10) / 10,
        reviews,
        status: closed ? (rnd() < 0.5 ? 'CLOSED_PERMANENTLY' : 'CLOSED_TEMPORARILY') : 'OPERATIONAL',
      });
      n++;
    }
  }
  return places;
}

function toGoogle(p) {
  const out = {
    id: p.id,
    displayName: { text: p.name, languageCode: 'fr' },
    formattedAddress: p.address,
    location: { latitude: p.lat, longitude: p.lng },
    rating: p.rating,
    userRatingCount: p.reviews,
    googleMapsUri: `https://maps.google.com/?cid=${p.id.slice(-6)}`,
    primaryType: p.type || 'establishment',
    primaryTypeDisplayName: { text: p.cat, languageCode: 'fr' },
    businessStatus: p.status,
  };
  if (p.phone) {
    out.nationalPhoneNumber = p.phone;
    out.internationalPhoneNumber = `+33 ${p.phone.slice(1)}`;
  }
  if (p.website) out.websiteUri = p.website;
  return out;
}

function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * @param {{dataset?:object[], failTypes?:string[]}} o
 */
export function createMockGoogle({ dataset = buildDataset(), failTypes = [] } = {}) {
  const calls = [];
  async function fetch(url, init = {}) {
    const headers = init.headers || {};
    calls.push({ url: String(url), body: init.body ? JSON.parse(init.body) : null, headers });
    if (headers['X-Goog-Api-Key'] !== TEST_KEY) {
      return jsonResponse(403, { error: { code: 403, message: 'API key not valid.', status: 'PERMISSION_DENIED' } });
    }
    if (String(url).startsWith('https://places.googleapis.com/v1/places:searchText')) {
      const body = JSON.parse(init.body);
      if (body.includedType && failTypes.includes(body.includedType)) {
        return jsonResponse(400, { error: { code: 400, message: `Unsupported types: ${body.includedType}.`, status: 'INVALID_ARGUMENT' } });
      }
      let pool;
      const rect = body.locationRestriction?.rectangle;
      if (rect) {
        pool = dataset.filter((p) => p.query === body.textQuery
          && p.lat >= rect.low.latitude && p.lat <= rect.high.latitude
          && p.lng >= rect.low.longitude && p.lng <= rect.high.longitude);
      } else {
        const c = body.locationBias?.circle?.center;
        const q = body.textQuery.toLowerCase();
        pool = dataset.filter((p) => q.startsWith(p.name.toLowerCase()) && c
          && Math.abs(p.lat - c.latitude) < 0.01 && Math.abs(p.lng - c.longitude) < 0.01);
      }
      const capped = pool.slice(0, 60);
      const size = Math.min(20, body.pageSize || 20);
      const offset = body.pageToken ? Number(String(body.pageToken).split(':')[1]) : 0;
      const page = capped.slice(offset, offset + size);
      const data = { places: page.map(toGoogle) };
      if (offset + size < capped.length) data.nextPageToken = `page:${offset + size}`;
      return jsonResponse(200, data);
    }
    if (String(url).startsWith('https://places.googleapis.com/v1/places/')) {
      const id = decodeURIComponent(String(url).split('/places/')[1].split('?')[0]);
      const p = dataset.find((x) => x.id === id);
      if (!p) return jsonResponse(404, { error: { code: 404, message: 'Not found', status: 'NOT_FOUND' } });
      return jsonResponse(200, toGoogle(p));
    }
    return jsonResponse(404, { error: { message: 'inconnu' } });
  }
  return { fetch, calls, dataset };
}
