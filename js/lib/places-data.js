// Lieux pré-enregistrés (recherche instantanée sans réseau) : quartiers de Toulouse,
// communes de la métropole et grandes villes. Coordonnées approximatives du centre.

export const TOULOUSE_AREAS = [
  { name: 'Capitole', lat: 43.6045, lng: 1.4433, r: 0.8 },
  { name: 'Carmes', lat: 43.5968, lng: 1.4452, r: 0.6 },
  { name: 'Saint-Cyprien', lat: 43.5978, lng: 1.4318, r: 0.9 },
  { name: 'Saint-Michel', lat: 43.5852, lng: 1.4468, r: 0.8 },
  { name: 'Minimes', lat: 43.6215, lng: 1.4318, r: 1 },
  { name: 'Compans-Caffarelli', lat: 43.6108, lng: 1.4335, r: 0.7 },
  { name: 'Saint-Aubin', lat: 43.6018, lng: 1.4565, r: 0.7 },
  { name: 'Côte Pavée', lat: 43.5985, lng: 1.4725, r: 1 },
  { name: 'Rangueil', lat: 43.5652, lng: 1.4605, r: 1.2 },
  { name: 'Purpan', lat: 43.6072, lng: 1.3985, r: 1 },
  { name: 'Borderouge', lat: 43.6418, lng: 1.4525, r: 1 },
  { name: 'Lardenne', lat: 43.5925, lng: 1.3905, r: 1.2 },
];

export const METRO = [
  { name: 'Toulouse (centre)', lat: 43.6045, lng: 1.4442, r: 2.5 },
  { name: 'Blagnac', lat: 43.6372, lng: 1.3905, r: 2 },
  { name: 'Colomiers', lat: 43.6112, lng: 1.3352, r: 2 },
  { name: 'Tournefeuille', lat: 43.5852, lng: 1.3448, r: 2 },
  { name: 'Balma', lat: 43.6112, lng: 1.4992, r: 1.8 },
  { name: 'L\'Union', lat: 43.6578, lng: 1.4832, r: 1.5 },
  { name: 'Ramonville-Saint-Agne', lat: 43.5452, lng: 1.4752, r: 1.5 },
  { name: 'Castanet-Tolosan', lat: 43.5162, lng: 1.4985, r: 1.5 },
  { name: 'Muret', lat: 43.4612, lng: 1.3272, r: 2 },
  { name: 'Cugnaux', lat: 43.5372, lng: 1.3442, r: 1.5 },
  { name: 'Portet-sur-Garonne', lat: 43.5232, lng: 1.4062, r: 1.5 },
  { name: 'Saint-Orens-de-Gameville', lat: 43.5532, lng: 1.5342, r: 1.5 },
];

export const CITIES = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522, r: 3 },
  { name: 'Lyon', lat: 45.764, lng: 4.8357, r: 3 },
  { name: 'Marseille', lat: 43.2965, lng: 5.3698, r: 3 },
  { name: 'Bordeaux', lat: 44.8378, lng: -0.5792, r: 3 },
  { name: 'Montpellier', lat: 43.6108, lng: 3.8767, r: 3 },
  { name: 'Nice', lat: 43.7102, lng: 7.262, r: 3 },
  { name: 'Nantes', lat: 47.2184, lng: -1.5536, r: 3 },
  { name: 'Lille', lat: 50.6292, lng: 3.0573, r: 3 },
  { name: 'Strasbourg', lat: 48.5734, lng: 7.7521, r: 3 },
  { name: 'Rennes', lat: 48.1173, lng: -1.6778, r: 3 },
  { name: 'Albi', lat: 43.9289, lng: 2.1464, r: 2 },
  { name: 'Montauban', lat: 44.0176, lng: 1.355, r: 2 },
  { name: 'Castres', lat: 43.606, lng: 2.24, r: 2 },
  { name: 'Tarbes', lat: 43.2328, lng: 0.0781, r: 2 },
  { name: 'Pau', lat: 43.2951, lng: -0.3708, r: 2.5 },
  { name: 'Perpignan', lat: 42.6887, lng: 2.8948, r: 2.5 },
  { name: 'Agen', lat: 44.2033, lng: 0.6163, r: 2 },
  { name: 'Carcassonne', lat: 43.213, lng: 2.3491, r: 2 },
  { name: 'Narbonne', lat: 43.184, lng: 3.004, r: 2 },
  { name: 'Rodez', lat: 44.3506, lng: 2.575, r: 2 },
  { name: 'Auch', lat: 43.646, lng: 0.586, r: 1.5 },
  { name: 'Cahors', lat: 44.4475, lng: 1.4419, r: 1.5 },
  { name: 'Foix', lat: 42.9653, lng: 1.607, r: 1.2 },
];

export const ALL_PLACES = [
  ...TOULOUSE_AREAS.map((p) => ({ ...p, label: `${p.name} · Toulouse` })),
  ...METRO.map((p) => ({ ...p, label: p.name })),
  ...CITIES.map((p) => ({ ...p, label: p.name })),
];

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function searchLocal(q, limit = 6) {
  const n = norm(q);
  if (!n) return [];
  const starts = [];
  const contains = [];
  for (const p of ALL_PLACES) {
    const l = norm(p.label);
    if (l.startsWith(n) || norm(p.name).startsWith(n)) starts.push(p);
    else if (l.includes(n)) contains.push(p);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Recherche en ligne (Nominatim, OpenStreetMap) : uniquement sur validation, jamais à chaque frappe. */
export async function searchNominatim(q, { fetchImpl = globalThis.fetch, signal } = {}) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=fr&accept-language=fr&q=${encodeURIComponent(q)}`;
  const res = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal });
  if (!res.ok) throw new Error(`Nominatim a répondu ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((d) => {
    const bb = (d.boundingbox || []).map(Number);
    return {
      label: d.display_name,
      name: d.name || d.display_name.split(',')[0],
      lat: Number(d.lat),
      lng: Number(d.lon),
      bbox: bb.length === 4 && bb.every(Number.isFinite) ? { south: bb[0], north: bb[1], west: bb[2], east: bb[3] } : null,
    };
  }).filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng));
}
