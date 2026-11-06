// Mode gratuit : OpenStreetMap via l'API Overpass (aucune clé, pas d'avis Google).
// Données © contributeurs OpenStreetMap, licence ODbL.
import { CATEGORIES, categoryById } from './categories.js';
import { classifyWebsite } from './website.js';
import { zoneBbox, pointInZone } from './geo.js';

export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function area(zone) {
  if (zone.kind === 'circle') {
    const r = Math.round(zone.radiusKm * 1000);
    return `(around:${r},${zone.center.lat.toFixed(6)},${zone.center.lng.toFixed(6)})`;
  }
  const b = zoneBbox(zone);
  return `(${b.south.toFixed(6)},${b.west.toFixed(6)},${b.north.toFixed(6)},${b.east.toFixed(6)})`;
}

/** Requête Overpass : tous les établissements nommés des catégories choisies dans la zone. */
export function buildOverpassQuery(zone, categoryIds, { timeout = 30 } = {}) {
  const a = area(zone);
  const lines = [];
  for (const id of categoryIds) {
    const cat = categoryById(id);
    if (!cat) continue;
    for (const sel of cat.osm) lines.push(`  nwr${sel}["name"]${a};`);
  }
  return `[out:json][timeout:${timeout}];\n(\n${[...new Set(lines)].join('\n')}\n);\nout center tags qt;`;
}

function matchesSelector(tags, sel) {
  // Sélecteurs simples de la forme ["clé"="valeur"], ["clé"~"motif"] ou ["clé"~"motif",i]
  const re = /\["([^"]+)"(=|~)"([^"]*)"(,i)?\]/g;
  let m;
  let any = false;
  while ((m = re.exec(sel))) {
    any = true;
    const v = tags[m[1]];
    if (v === undefined) return false;
    if (m[2] === '=' && v !== m[3]) return false;
    if (m[2] === '~' && !new RegExp(m[3], m[4] ? 'i' : '').test(v)) return false;
  }
  return any;
}

export function categoriesForTags(tags, categoryIds) {
  const out = [];
  for (const id of categoryIds) {
    const cat = categoryById(id);
    if (cat && cat.osm.some((s) => matchesSelector(tags, s))) out.push(id);
  }
  return out;
}

function osmAddress(t) {
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  const city = [t['addr:postcode'], t['addr:city']].filter(Boolean).join(' ');
  return [street, city].filter(Boolean).join(', ');
}

/** Transforme la réponse Overpass en établissements normalisés. */
export function parseOverpass(json, categoryIds, zone) {
  const out = new Map();
  for (const el of json?.elements || []) {
    const t = el.tags || {};
    if (!t.name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (zone && !pointInZone({ lat, lng }, zone)) continue;
    const cats = categoriesForTags(t, categoryIds);
    if (!cats.length) continue;
    const site = t.website || t['contact:website'] || t.url || '';
    const social = t['contact:facebook'] || t.facebook || t['contact:instagram'] || t.instagram || '';
    let website = classifyWebsite(site);
    if (website.status === 'none' && social) {
      const s = classifyWebsite(/^https?:/i.test(social) ? social : `https://facebook.com/${social}`);
      website = s.status === 'social' ? s : { status: 'social', host: '', provider: 'Réseaux sociaux', family: 'reseau' };
    }
    const phone = t.phone || t['contact:phone'] || t['contact:mobile'] || t.mobile || '';
    const id = `osm:${el.type}/${el.id}`;
    const address = osmAddress(t);
    const q = encodeURIComponent([t.name, address || t['addr:city'] || ''].filter(Boolean).join(' '));
    out.set(id, {
      id,
      source: 'osm',
      name: t.name,
      address,
      city: t['addr:city'] || '',
      lat,
      lng,
      phone: String(phone).split(';')[0].trim(),
      phoneIntl: '',
      websiteUri: site || social || '',
      website,
      rating: null,
      reviews: null,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${q}`,
      osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      type: '',
      typeLabel: '',
      categories: cats,
      businessStatus: '',
    });
  }
  return [...out.values()];
}

/** Interroge Overpass, en essayant le serveur de secours en cas d'échec. */
export async function fetchOverpass(query, { fetchImpl = globalThis.fetch, signal, endpoints = OVERPASS_ENDPOINTS } = {}) {
  let lastError;
  for (const url of endpoints) {
    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: `data=${encodeURIComponent(query)}`,
        signal,
      });
      if (res.status === 429) { lastError = new Error('Serveur Overpass saturé (trop de requêtes). Réessayez dans une minute.'); continue; }
      if (!res.ok) { lastError = new Error(`Overpass a répondu ${res.status}.`); continue; }
      return await res.json();
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      lastError = new Error('Overpass injoignable (connexion ou serveur indisponible).');
    }
  }
  throw lastError || new Error('Overpass injoignable.');
}

export const ALL_CATEGORY_IDS = CATEGORIES.map((c) => c.id);
