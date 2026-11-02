// Carte des défis : Leaflet (servi localement) + tuiles OpenStreetMap, avec repli hors ligne
// sur un fond Natural Earth simplifié si les tuiles ne se chargent pas.
import { chargerScript, chargerStyle, url, esc } from './commun.js';

export async function chargerLeaflet() {
  await Promise.all([chargerStyle('vendor/leaflet/leaflet.css'), chargerScript('vendor/leaflet/leaflet.js')]);
  return window.L;
}

const ATTRIB_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">contributeurs OpenStreetMap</a>';
const ATTRIB_NE = 'Fond simplifié : <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>';
export const TUILES_OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const icone = (L, cls, txt = '') => L.divIcon({ className: 'ctf-pin ' + cls, html: `<span>${txt}</span>`, iconSize: [30, 40], iconAnchor: [15, 38] });

let paysPromesse = null;
async function chargerPays() {
  if (!paysPromesse) paysPromesse = (async () => {
    await chargerScript('vendor/topojson/topojson-client.min.js');
    const topo = await fetch(url('vendor/world-atlas/countries-50m.json')).then(r => r.json());
    return window.topojson.feature(topo, topo.objects.countries);
  })();
  return paysPromesse;
}

// Dessine un jeu de données GeoJSON (tags OSM dans les propriétés) avec un style lisible.
export function dessinerDonnees(api, fc, { etiquettes = false, surbrillance = null } = {}) {
  const L = api.L;
  const style = f => {
    const t = f.properties, on = surbrillance && surbrillance.has(t['@id']);
    let c = '#64748b', w = 2, fill = 0.15, fc = null;
    if (t.place === 'island') { c = '#c2a873'; w = 1.5; fill = 0.9; fc = '#f1e7cf'; }
    if (t.leisure === 'marina') { c = '#0284c7'; fill = 0.25; }
    if (t.natural === 'beach') { c = '#d9b25f'; fill = 0.5; fc = '#f6dc9b'; }
    if (t.man_made === 'pier') { c = '#78716c'; w = 5; }
    if (t.highway) { c = '#94a3b8'; w = t.highway === 'footway' || t.highway === 'path' ? 1.5 : 4; }
    if (t.waterway || t.natural === 'water') { c = '#0ea5e9'; w = 5; fill = 0.35; }
    if (t.leisure === 'park' || t.landuse === 'grass') { c = '#22c55e'; fill = 0.25; }
    if (t.building) { c = '#b45309'; fill = 0.25; }
    if (t.railway) { c = '#475569'; w = 3; }
    if (on) { c = '#f97316'; w += 2; fill = 0.45; }
    return { color: c, weight: w, fillOpacity: fill, fillColor: fc || c, opacity: surbrillance && !on && !t.place ? 0.45 : 1 };
  };
  return L.geoJSON(fc, {
    style,
    pointToLayer: (f, ll) => L.circleMarker(ll, { radius: surbrillance && surbrillance.has(f.properties['@id']) ? 8 : 5, ...style(f), fillOpacity: 0.85 }),
    onEachFeature: (f, couche) => {
      const t = f.properties;
      const pt = f.geometry.type === 'Point' ? `<br><code>${f.geometry.coordinates[1].toFixed(6)}, ${f.geometry.coordinates[0].toFixed(6)}</code>` : '';
      couche.bindPopup(`<b>${esc(t.name || t['@id'])}</b><br><code>${esc(t['@id'])}</code>${pt}<br>${Object.entries(t).filter(([k]) => !k.startsWith('@')).map(([k, v]) => `${esc(k)}=${esc(v)}`).join('<br>')}`);
      if (etiquettes && t.name && f.geometry.type === 'Point') couche.bindTooltip(esc(t.name), { direction: 'top', offset: [0, -4], className: 'ctf-etiq' });
    }
  }).addTo(api.map);
}

// options : vue [lat, lon, zoom], fond 'osm' | 'aucun', onChoix(latlng), interactif (placement d'un repère), calque (GeoJSON à afficher)
export async function creerCarte(el, { vue = [30, 10, 2], fond = 'osm', onChoix = null, interactif = true, hauteur, calque = null } = {}) {
  const L = await chargerLeaflet();
  el.classList.add('ctf-map');
  if (hauteur) el.style.height = hauteur;
  el.innerHTML = `<div class="ctf-map-in"></div><div class="ctf-map-info" aria-live="polite"></div>`;
  const zone = el.querySelector('.ctf-map-in'), info = el.querySelector('.ctf-map-info');
  const map = L.map(zone, { worldCopyJump: true, zoomControl: true, attributionControl: true, minZoom: 1, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 90 }).setView([vue[0], vue[1]], vue[2]);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  L.control.scale({ metric: true, imperial: false }).addTo(map);
  let repli = false;

  async function basculerRepli(raison) {
    if (repli) return; repli = true;
    if (tuiles) map.removeLayer(tuiles);
    el.classList.add('is-repli');
    const msg = document.createElement('div');
    msg.className = 'ctf-map-repli'; msg.setAttribute('role', 'status');
    msg.innerHTML = `<b>Fond de carte simplifié</b> ${esc(raison)} Les coordonnées restent exactes : zoome, ou saisis des coordonnées.`;
    el.appendChild(msg);
    graticule(L, map);
    try {
      const pays = await chargerPays();
      L.geoJSON(pays, { style: { color: '#64748b', weight: 0.8, fillColor: '#94a3b8', fillOpacity: 0.28 }, interactive: false, attribution: ATTRIB_NE }).addTo(map);
    } catch { msg.innerHTML += ' (fond indisponible)'; }
  }

  let tuiles = null;
  if (fond === 'osm') {
    tuiles = L.tileLayer(TUILES_OSM, { maxZoom: 19, attribution: ATTRIB_OSM, crossOrigin: true });
    let ok = 0, ko = 0;
    tuiles.on('tileload', () => { ok++; });
    tuiles.on('tileerror', () => { ko++; if (!ok && ko >= 3) basculerRepli('Les tuiles OpenStreetMap ne se chargent pas (hors ligne ou réseau filtré).'); });
    tuiles.addTo(map);
    setTimeout(() => { if (!ok && !repli) basculerRepli('Les tuiles OpenStreetMap ne répondent pas.'); }, 9000);
    if (navigator.onLine === false) basculerRepli('Tu sembles hors ligne.');
  } else {
    el.classList.add('is-neutre');
    graticule(L, map, 0.005);
  }

  let repere = null, cible = null;
  const afficherInfo = () => {
    const p = repere && repere.getLatLng();
    info.textContent = p ? `Repère : ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` : (interactif ? 'Clique sur la carte pour placer ton repère.' : '');
  };
  const api = {
    map, L,
    position: () => repere ? repere.getLatLng() : null,
    placer(lat, lon, centrer = false) {
      if (!repere) {
        repere = L.marker([lat, lon], { icon: icone(L, 'is-moi'), draggable: true, keyboard: true, title: 'Ton repère (déplaçable)', alt: 'Ton repère' }).addTo(map);
        repere.on('dragend', () => { afficherInfo(); onChoix && onChoix(repere.getLatLng()); });
      } else repere.setLatLng([lat, lon]);
      if (centrer) map.setView([lat, lon], Math.max(map.getZoom(), 14));
      afficherInfo(); onChoix && onChoix(repere.getLatLng());
    },
    placerAuCentre() { const c = map.getCenter(); api.placer(c.lat, c.lng); },
    montrerCible(lat, lon, r, lieu) {
      if (cible) cible.forEach(x => map.removeLayer(x));
      cible = [L.circle([lat, lon], { radius: r, color: '#16a34a', weight: 2, fillOpacity: 0.12 }), L.marker([lat, lon], { icon: icone(L, 'is-cible', '★'), title: lieu || 'Cible', alt: 'Emplacement de la cible' }).bindPopup(esc(lieu || 'Cible'))];
      const p = repere && repere.getLatLng();
      if (p) {
        const d = map.distance(p, [lat, lon]);
        cible.push(L.polyline([p, [lat, lon]], { color: '#16a34a', dashArray: '6 6', weight: 2 }));
        info.textContent = `Ton repère est à ${d >= 1000 ? (d / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' km' : Math.round(d) + ' m'} de la cible.`;
      }
      cible.forEach(x => x.addTo(map));
      map.fitBounds(L.latLngBounds([[lat, lon], ...(p ? [p] : [])]).pad(0.6), { maxZoom: 16 });
    },
    basculerRepli
  };
  if (interactif) map.on('click', e => api.placer(e.latlng.lat, e.latlng.lng));
  if (calque) {
    try { const fc = await fetch(url(calque)).then(r => r.json()); api.donnees = dessinerDonnees(api, fc, { etiquettes: true }); } catch { /* calque indisponible */ }
  }
  afficherInfo();
  // la carte peut être montée dans un conteneur qui vient d'apparaître
  setTimeout(() => map.invalidateSize(), 60);
  if ('ResizeObserver' in window) new ResizeObserver(() => map.invalidateSize()).observe(zone);
  return api;
}

function graticule(L, map, fin = 0) {
  const groupe = L.layerGroup().addTo(map);
  const dessiner = () => {
    groupe.clearLayers();
    const z = map.getZoom();
    const pas = fin && z >= 14 ? fin : z >= 12 ? 0.01 : z >= 10 ? 0.05 : z >= 8 ? 0.25 : z >= 6 ? 1 : z >= 4 ? 5 : 10;
    const b = map.getBounds().pad(0.2);
    const s = Math.max(-85, Math.floor(b.getSouth() / pas) * pas), n = Math.min(85, b.getNorth());
    const w = Math.floor(b.getWest() / pas) * pas, e = b.getEast();
    const style = { color: '#94a3b8', weight: 0.6, opacity: 0.5, interactive: false };
    let k = 0;
    for (let la = s; la <= n && k < 400; la += pas, k++) L.polyline([[la, w], [la, e]], style).addTo(groupe);
    for (let lo = w; lo <= e && k < 800; lo += pas, k++) L.polyline([[s, lo], [n, lo]], style).addTo(groupe);
  };
  map.on('moveend zoomend', dessiner); dessiner();
}
