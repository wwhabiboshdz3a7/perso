// Carte Leaflet : fond OpenStreetMap, zone de recherche (cercle, rectangle ou vue), marqueurs.
import { bboxFromCircle } from '../lib/geo.js';
import { reviewsFactor } from '../lib/score.js';
import { escapeHtml, fmtInt, fmtRating } from '../lib/format.js';
import { websiteLabel } from '../lib/website.js';

const L = () => globalThis.L;
const REDUCED = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const GOOGLE_ATTR = '<span class="google-attr">Google Maps</span>';
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Balayage façon radar dans la zone (SVG pur) : une traînée de fines parts de disque dont
 * l'opacité décroît, qui tourne autour du centre. Lent et discret au repos, plus vif pendant
 * la recherche. Sans animation si l'utilisateur la refuse (prefers-reduced-motion).
 */
function scanSvg(round, mode) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const active = mode === 'active';
  const N = 26;
  const STEP = (active ? 4 : 3) * (Math.PI / 180);
  const R = round ? 100 : 142;
  let wedges = '';
  for (let i = 0; i < N; i++) {
    const a0 = -i * STEP - STEP;
    const a1 = -i * STEP + 0.002;
    const p = (a) => `${(100 + R * Math.sin(a)).toFixed(2)} ${(100 - R * Math.cos(a)).toFixed(2)}`;
    const op = ((active ? 0.5 : 0.3) * (1 - i / N) ** 1.6).toFixed(3);
    wedges += `<path d="M100 100 L${p(a0)} A${R} ${R} 0 0 1 ${p(a1)} Z" fill="#FBBF24" fill-opacity="${op}"/>`;
  }
  const dur = active ? '1.8s' : '7s';
  const spin = REDUCED() ? '' : `<animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="${dur}" repeatCount="indefinite"/>`;
  const clip = round ? '<circle cx="100" cy="100" r="99"/>' : '<rect width="200" height="200"/>';
  const id = `nx-scan-${Math.random().toString(36).slice(2, 8)}`;
  const rings = round && active && !REDUCED()
    ? '<circle cx="100" cy="100" r="10" fill="none" stroke="#FBBF24" stroke-width="1.2" vector-effect="non-scaling-stroke"><animate attributeName="r" from="6" to="99" dur="1.8s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" from=".8" to="0" dur="1.8s" repeatCount="indefinite"/></circle>'
    : '';
  svg.innerHTML = `<defs><clipPath id="${id}">${clip}</clipPath></defs>
    <g clip-path="url(#${id})"><g>${wedges}<line x1="100" y1="100" x2="100" y2="${100 - R}" stroke="#FDE68A" stroke-opacity="${active ? 0.9 : 0.45}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>${spin}</g>${rings}</g>`;
  return svg;
}

export class MapView {
  constructor(el, { wrap, onZoneChange, onMarkerClick, onMarkerHover, onDrawState } = {}) {
    this.el = el;
    this.wrap = wrap;
    this.onZoneChange = onZoneChange || (() => {});
    this.onMarkerClick = onMarkerClick || (() => {});
    this.onMarkerHover = onMarkerHover || (() => {});
    this.onDrawState = onDrawState || (() => {});
    this.kind = 'circle';
    this.center = { lat: 43.6045, lng: 1.4442 };
    this.radiusKm = 1;
    this.rectBbox = null;
    this.markers = new Map();
    this.highlighted = null;
    this.googleAttr = false;
    this.drawing = false;
    this.scanMode = 'off';
    this.scanLayer = null;

    const Lf = L();
    this.map = Lf.map(el, { zoomControl: true, attributionControl: true, worldCopyJump: true, zoomSnap: 0.5 });
    this.map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="Bibliothèque de cartes">Leaflet</a>');
    this.tiles = Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a>',
      crossOrigin: true,
    }).addTo(this.map);
    this.clusterLayer = (Lf.markerClusterGroup ? Lf.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 18,
      maxClusterRadius: (z) => (z >= 17 ? 44 : 84),
      chunkedLoading: true,
      animate: !REDUCED(),
      iconCreateFunction: (c) => this.clusterIcon(c),
    }) : Lf.featureGroup()).addTo(this.map);
    if (!this.clusterLayer.getVisibleParent) this.clusterLayer.getVisibleParent = (m) => m;
    if (!this.clusterLayer.addLayers) this.clusterLayer.addLayers = (ls) => ls.forEach((l) => this.clusterLayer.addLayer(l));
    this.rankLayer = Lf.layerGroup().addTo(this.map);
    this.points = [];
    this.zoneLayer = Lf.layerGroup().addTo(this.map);
    this.map.setView([this.center.lat, this.center.lng], 14);

    this.map.on('click', (e) => {
      if (this.drawing || this.kind !== 'circle') return;
      this.setCenter({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    this.map.on('moveend', () => { if (this.kind === 'view') this.onZoneChange(this.zone); });
  }

  // ---------------------------------------------------------------- zone
  get zone() {
    if (this.kind === 'circle') return { kind: 'circle', center: { ...this.center }, radiusKm: this.radiusKm };
    if (this.kind === 'rect' && this.rectBbox) return { kind: 'rect', bbox: { ...this.rectBbox } };
    const b = this.map.getBounds();
    return { kind: 'rect', view: true, bbox: { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() } };
  }

  setKind(kind) {
    this.cancelDraw();
    this.kind = kind;
    if (kind === 'rect' && !this.rectBbox) {
      const b = this.map.getBounds().pad(-0.2);
      this.rectBbox = { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
    }
    this.drawZone();
    this.onZoneChange(this.zone);
  }

  setRadius(km) {
    this.radiusKm = km;
    this.drawZone();
    this.onZoneChange(this.zone);
  }

  setCenter(c, { fly = false } = {}) {
    this.center = { lat: c.lat, lng: c.lng };
    this.drawZone();
    if (fly) this.fitZone();
    this.onZoneChange(this.zone);
  }

  /** Aller à un lieu : recentre la zone (cercle, rectangle) et la carte. */
  goTo({ lat, lng, r, bbox }) {
    if (this.kind === 'circle') {
      this.center = { lat, lng };
      if (r) this.radiusKm = r;
    } else if (this.kind === 'rect') {
      this.rectBbox = bbox || bboxFromCircle({ lat, lng }, r || 1.5);
    }
    this.drawZone();
    if (this.kind === 'view') {
      const b = bbox || bboxFromCircle({ lat, lng }, r || 1.5);
      this.map.fitBounds([[b.south, b.west], [b.north, b.east]], { animate: !REDUCED() });
    } else {
      this.fitZone();
    }
    this.onZoneChange(this.zone);
  }

  fitZone() {
    const z = this.zone;
    const b = z.kind === 'circle' ? bboxFromCircle(z.center, z.radiusKm) : z.bbox;
    this.map.fitBounds([[b.south, b.west], [b.north, b.east]], { padding: [30, 30], animate: !REDUCED() });
  }

  drawZone() {
    const Lf = L();
    this.zoneLayer.clearLayers();
    const style = { color: '#FBBF24', weight: 2, dashArray: '8 6', fillColor: '#7C3AED', fillOpacity: 0.07, interactive: false };
    if (this.kind === 'circle') {
      Lf.circle([this.center.lat, this.center.lng], { ...style, radius: this.radiusKm * 1000 }).addTo(this.zoneLayer);
      const handle = Lf.marker([this.center.lat, this.center.lng], {
        draggable: true,
        keyboard: true,
        title: 'Centre de la zone (glisser pour déplacer)',
        alt: 'Centre de la zone',
        icon: Lf.divIcon({ className: 'zone-handle', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
      }).addTo(this.zoneLayer);
      handle.on('drag', (e) => {
        const p = e.target.getLatLng();
        this.center = { lat: p.lat, lng: p.lng };
        this.zoneLayer.eachLayer((l) => { if (l instanceof Lf.Circle) l.setLatLng(p); });
        if (this.scanLayer) this.scanLayer.setBounds(this.#scanBounds());
      });
      handle.on('dragend', () => this.onZoneChange(this.zone));
    } else if (this.kind === 'rect' && this.rectBbox) {
      const b = this.rectBbox;
      Lf.rectangle([[b.south, b.west], [b.north, b.east]], style).addTo(this.zoneLayer);
    }
    this.#renderScan();
  }

  // ------------------------------------------------------------ balayage
  /** 'off' (résultats affichés), 'idle' (zone prête) ou 'active' (recherche en cours). */
  setScan(mode) {
    if (mode === this.scanMode) return;
    this.scanMode = mode;
    this.wrap?.classList.toggle('is-scanning', mode === 'active');
    this.#renderScan();
  }

  #scanBounds() {
    const z = this.zone;
    const b = z.kind === 'circle' ? bboxFromCircle(z.center, z.radiusKm) : z.bbox;
    return [[b.south, b.west], [b.north, b.east]];
  }

  #renderScan() {
    this.scanLayer?.remove();
    this.scanLayer = null;
    // Pas de balayage sur « vue de la carte » : la zone suit la carte elle-même.
    if (this.scanMode === 'off' || this.kind === 'view' || (this.kind === 'rect' && !this.rectBbox)) return;
    const Lf = L();
    if (!Lf.svgOverlay) return;
    this.scanLayer = Lf.svgOverlay(scanSvg(this.kind === 'circle', this.scanMode), this.#scanBounds(), {
      interactive: false, className: `nx-scan nx-scan--${this.scanMode}`,
    }).addTo(this.map);
  }

  /** Tracé d'un rectangle au doigt ou à la souris. */
  startDrawRect() {
    if (this.drawing) return;
    this.drawing = true;
    this.wrap?.classList.add('is-drawing');
    this.map.dragging.disable();
    this.map.boxZoom.disable();
    this.onDrawState(true);
    const el = this.map.getContainer();
    const Lf = L();
    let start = null;
    let rect = null;
    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest?.('.leaflet-control')) return;
      e.preventDefault();
      start = this.map.mouseEventToLatLng(e);
      try { el.setPointerCapture(e.pointerId); } catch { /* rien */ }
      rect = Lf.rectangle([start, start], { color: '#FBBF24', weight: 2, dashArray: '6 6', fillColor: '#FBBF24', fillOpacity: 0.08, interactive: false }).addTo(this.map);
    };
    const move = (e) => {
      if (!start || !rect) return;
      rect.setBounds(Lf.latLngBounds(start, this.map.mouseEventToLatLng(e)));
    };
    const up = (e) => {
      if (!start) return;
      const end = this.map.mouseEventToLatLng(e);
      const b = Lf.latLngBounds(start, end);
      rect?.remove();
      const tooSmall = this.map.distance(b.getSouthWest(), b.getNorthEast()) < 150;
      if (!tooSmall) {
        this.rectBbox = { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
      }
      this.finishDraw();
      this.drawZone();
      this.onZoneChange(this.zone);
    };
    const key = (e) => { if (e.key === 'Escape') { rect?.remove(); this.finishDraw(); } };
    this._draw = { down, move, up, key, el };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    document.addEventListener('keydown', key);
  }

  finishDraw() {
    if (!this._draw) return;
    const { down, move, up, key, el } = this._draw;
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    document.removeEventListener('keydown', key);
    this._draw = null;
    this.drawing = false;
    this.wrap?.classList.remove('is-drawing');
    this.map.dragging.enable();
    this.map.boxZoom.enable();
    this.onDrawState(false);
  }

  cancelDraw() { this.finishDraw(); }

  // ------------------------------------------------------------- marqueurs
  // Les établissements sont regroupés en grappes (Leaflet.markercluster) : chaque grappe
  // indique son nombre d'établissements et, en or, la part de prospects chauds. Le statut
  // du site se lit à la forme (disque plein = aucun site, anneau = réseaux, petit point
  // pâle = vrai site). Les 10 meilleurs scores restent toujours visibles, numérotés.
  setPlaces(places, { google = false } = {}) {
    const Lf = L();
    this.clusterLayer.clearLayers();
    this.rankLayer.clearLayers();
    this.markers.clear();
    this.points = [];
    this.highlighted = null;
    const valid = places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    const top = [...valid].sort((a, b) => b.score - a.score || (b.reviews || 0) - (a.reviews || 0)).slice(0, 10);
    const rank = new Map(top.map((p, i) => [p.id, i + 1]));
    const batch = [];
    for (const p of valid) {
      const st = p.website?.status || 'none';
      const r = rank.get(p.id);
      const reviews = Number.isFinite(p.reviews) ? `${fmtInt(p.reviews)} avis · ${fmtRating(p.rating)} ★` : 'avis inconnus';
      const tip = `${r ? `<em>N° ${r} au score</em>` : ''}<strong>${escapeHtml(p.name)}</strong><small>${reviews} · ${escapeHtml(websiteLabel(p.website))}</small>`;
      let m;
      if (r) {
        m = Lf.marker([p.lat, p.lng], {
          icon: Lf.divIcon({ className: `nx-rank nx-rank--${p.level}`, html: `<span><b>${r}</b></span>`, iconSize: [30, 38], iconAnchor: [15, 36] }),
          keyboard: false, zIndexOffset: 1000 - r, riseOnHover: true,
        });
        m.bindTooltip(tip, { className: 'nx-tip', direction: 'top', offset: [0, -34] });
        m.addTo(this.rankLayer);
      } else {
        const size = Math.round(st === 'site' ? 9 : 12 + 10 * (Number.isFinite(p.reviews) ? reviewsFactor(p.reviews) : 0.3));
        m = Lf.marker([p.lat, p.lng], {
          icon: Lf.divIcon({ className: `nx-pin nx-pin--${p.level} nx-pin--${st}`, html: '<i></i>', iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
          keyboard: false,
          level: p.level,
        });
        m.bindTooltip(tip, { className: 'nx-tip', direction: 'top', offset: [0, -size / 2] });
        batch.push(m);
      }
      m.on('click', () => this.onMarkerClick(p.id));
      m.on('mouseover', () => this.onMarkerHover(p.id, true));
      m.on('mouseout', () => this.onMarkerHover(p.id, false));
      this.markers.set(p.id, { m, ranked: Boolean(r) });
      this.points.push([p.lat, p.lng]);
    }
    this.clusterLayer.addLayers(batch);
    this.setGoogleAttribution(google);
  }

  /** Grappe : nombre d'établissements, anneau or proportionnel à la part de chauds. */
  clusterIcon(cluster) {
    const Lf = L();
    const kids = cluster.getAllChildMarkers();
    const n = kids.length;
    const hot = kids.filter((k) => k.options.level === 'chaud').length;
    const pct = Math.round((hot / Math.max(1, n)) * 100);
    const size = n < 10 ? 36 : n < 50 ? 44 : n < 200 ? 52 : 60;
    return Lf.divIcon({
      className: 'nx-cluster',
      html: `<span style="--p:${pct}%"><b>${n}</b></span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  setGoogleAttribution(on) {
    if (on === this.googleAttr) return;
    if (on) this.map.attributionControl.addAttribution(GOOGLE_ATTR);
    else this.map.attributionControl.removeAttribution(GOOGLE_ATTR);
    this.googleAttr = on;
  }

  /** Met en avant un établissement (ou la grappe qui le contient). */
  highlight(id, on = true) {
    if (this.highlighted && (this.highlighted !== id || !on)) {
      this.#markEl(this.highlighted, false);
      this.highlighted = null;
    }
    if (!on || !this.markers.has(id)) return;
    this.#markEl(id, true);
    this.highlighted = id;
  }

  #markEl(id, on) {
    const cur = this.markers.get(id);
    if (!cur) return;
    let layer = cur.m;
    if (!cur.ranked) layer = this.clusterLayer.getVisibleParent(cur.m) || cur.m;
    layer.getElement?.()?.classList.toggle('is-hl', on);
    if (on && layer === cur.m && cur.ranked === false) cur.m.setZIndexOffset(2000);
    else if (!on && !cur.ranked) cur.m.setZIndexOffset(0);
  }

  panTo(id) {
    const cur = this.markers.get(id);
    if (cur) this.map.panTo(cur.m.getLatLng(), { animate: !REDUCED() });
  }

  fitResults() {
    if (!this.points?.length) return;
    this.map.fitBounds(L().latLngBounds(this.points), { padding: [40, 40], maxZoom: 16, animate: !REDUCED() });
  }

  invalidate() { this.map.invalidateSize(); }
}
