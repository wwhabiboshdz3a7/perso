// Géométrie : zones, quadrillage en cellules, distances, estimation du coût.
// Module partagé navigateur / fonction Netlify / tests.

export const KM_PER_DEG_LAT = 110.574;
export const MAX_RESULTS_PER_QUERY = 60; // limite de Text Search : 3 pages de 20
export const MAX_PAGES = 3;

export function kmPerDegLng(lat) {
  return Math.max(0.0001, 111.32 * Math.cos((lat * Math.PI) / 180));
}

export function clampLat(v) { return Math.max(-85, Math.min(85, v)); }
export function clampLng(v) { return Math.max(-180, Math.min(180, v)); }

export function bboxFromCircle(center, radiusKm) {
  const dLat = radiusKm / KM_PER_DEG_LAT;
  const dLng = radiusKm / kmPerDegLng(center.lat);
  return {
    south: clampLat(center.lat - dLat),
    north: clampLat(center.lat + dLat),
    west: clampLng(center.lng - dLng),
    east: clampLng(center.lng + dLng),
  };
}

export function bboxSizeKm(b) {
  const midLat = (b.south + b.north) / 2;
  return {
    w: Math.abs(b.east - b.west) * kmPerDegLng(midLat),
    h: Math.abs(b.north - b.south) * KM_PER_DEG_LAT,
  };
}

export function zoneBbox(zone) {
  if (!zone) return null;
  if (zone.kind === 'circle') return bboxFromCircle(zone.center, zone.radiusKm);
  return zone.bbox;
}

export function zoneAreaKm2(zone) {
  if (!zone) return 0;
  if (zone.kind === 'circle') return Math.PI * zone.radiusKm * zone.radiusKm;
  const { w, h } = bboxSizeKm(zone.bbox);
  return w * h;
}

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function pointInBbox(p, b) {
  return p.lat >= b.south && p.lat <= b.north && p.lng >= b.west && p.lng <= b.east;
}

export function pointInZone(p, zone) {
  if (!zone || !p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
  if (zone.kind === 'circle') return haversineKm(p, zone.center) <= zone.radiusKm * 1.0001;
  return pointInBbox(p, zone.bbox);
}

/** Point de la cellule le plus proche du centre du cercle : intersection cellule / cercle. */
export function cellIntersectsCircle(cell, center, radiusKm) {
  const lat = Math.max(cell.south, Math.min(center.lat, cell.north));
  const lng = Math.max(cell.west, Math.min(center.lng, cell.east));
  return haversineKm({ lat, lng }, center) <= radiusKm;
}

/** Découpe une emprise en cellules d'environ `cellKm` de côté (au moins 1). */
export function gridCells(bbox, cellKm) {
  const { w, h } = bboxSizeKm(bbox);
  const size = Math.max(0.1, cellKm);
  const cols = Math.max(1, Math.ceil(w / size - 1e-9));
  const rows = Math.max(1, Math.ceil(h / size - 1e-9));
  const dLat = (bbox.north - bbox.south) / rows;
  const dLng = (bbox.east - bbox.west) / cols;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        south: bbox.south + r * dLat,
        north: r === rows - 1 ? bbox.north : bbox.south + (r + 1) * dLat,
        west: bbox.west + c * dLng,
        east: c === cols - 1 ? bbox.east : bbox.west + (c + 1) * dLng,
      });
    }
  }
  return cells;
}

/** Cellules couvrant une zone (rectangle ou cercle ; les cellules hors du cercle sont écartées). */
export function zoneToCells(zone, cellKm) {
  const bbox = zoneBbox(zone);
  if (!bbox) return [];
  const cells = gridCells(bbox, cellKm);
  if (zone.kind !== 'circle') return cells;
  return cells.filter((c) => cellIntersectsCircle(c, zone.center, zone.radiusKm));
}

/** Subdivision adaptative : une cellule saturée est coupée en quatre. */
export function splitCell(c) {
  const midLat = (c.south + c.north) / 2;
  const midLng = (c.west + c.east) / 2;
  return [
    { south: c.south, north: midLat, west: c.west, east: midLng },
    { south: c.south, north: midLat, west: midLng, east: c.east },
    { south: midLat, north: c.north, west: c.west, east: midLng },
    { south: midLat, north: c.north, west: midLng, east: c.east },
  ];
}

export function cellKey(c) {
  return [c.south, c.west, c.north, c.east].map((v) => v.toFixed(5)).join(',');
}

export function validBbox(b) {
  return !!b && ['south', 'west', 'north', 'east'].every((k) => Number.isFinite(b[k]))
    && b.south >= -90 && b.north <= 90 && b.west >= -180 && b.east <= 180
    && b.north > b.south && b.east > b.west;
}
