// Carte Leaflet : fond OpenStreetMap, zone de recherche (cercle, rectangle ou vue), marqueurs.
import { bboxFromCircle } from '../lib/geo.js';
import { reviewsFactor } from '../lib/score.js';
import { escapeHtml, fmtInt, fmtRating } from '../lib/format.js';
import { websiteLabel } from '../lib/website.js';

const L = () => globalThis.L;
const REDUCED = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const HEAT = { chaud: '#FBBF24', tiede: '#C084FC', froid: '#6E61A0' };
const GOOGLE_ATTR = '<span class="google-attr">Google Maps</span>';

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
    this.radiusKm = 1.5;
    this.rectBbox = null;
    this.markers = new Map();
    this.highlighted = null;
    this.googleAttr = false;
    this.drawing = false;

    const Lf = L();
    this.map = Lf.map(el, { zoomControl: true, preferCanvas: true, attributionControl: true, worldCopyJump: true });
    this.map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="Bibliothèque de cartes">Leaflet</a>');
    this.tiles = Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a>',
      crossOrigin: true,
    }).addTo(this.map);
    this.renderer = Lf.canvas({ padding: 0.3 });
    this.markerLayer = Lf.layerGroup().addTo(this.map);
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
      });
      handle.on('dragend', () => this.onZoneChange(this.zone));
    } else if (this.kind === 'rect' && this.rectBbox) {
      const b = this.rectBbox;
      Lf.rectangle([[b.south, b.west], [b.north, b.east]], style).addTo(this.zoneLayer);
    }
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
  setPlaces(places, { google = false } = {}) {
    const Lf = L();
    this.markerLayer.clearLayers();
    this.markers.clear();
    this.highlighted = null;
    // les prospects chauds sont dessinés en dernier, au-dessus
    const order = { froid: 0, tiede: 1, chaud: 2 };
    const sorted = [...places].filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
      .sort((a, b) => (order[a.level] - order[b.level]) || (a.score - b.score));
    for (const p of sorted) {
      const st = p.website?.status || 'none';
      const radius = 5 + 6 * (Number.isFinite(p.reviews) ? reviewsFactor(p.reviews) : 0.3);
      const m = Lf.circleMarker([p.lat, p.lng], {
        renderer: this.renderer,
        radius,
        fillColor: HEAT[p.level] || HEAT.froid,
        fillOpacity: st === 'site' ? 0.55 : 0.95,
        color: st === 'site' ? 'rgba(255,255,255,.25)' : '#FFFFFF',
        weight: st === 'site' ? 1 : 2,
        dashArray: st === 'social' ? '3 3' : null,
        bubblingMouseEvents: false,
      });
      const reviews = Number.isFinite(p.reviews) ? `${fmtInt(p.reviews)} avis · ${fmtRating(p.rating)} ★` : 'avis inconnus';
      m.bindTooltip(`<strong>${escapeHtml(p.name)}</strong><small>${reviews} · ${escapeHtml(websiteLabel(p.website))}</small>`, { className: 'nx-tip', direction: 'top', offset: [0, -6] });
      m.on('click', () => this.onMarkerClick(p.id));
      m.on('mouseover', () => this.onMarkerHover(p.id, true));
      m.on('mouseout', () => this.onMarkerHover(p.id, false));
      m.addTo(this.markerLayer);
      this.markers.set(p.id, { m, radius });
    }
    this.setGoogleAttribution(google);
  }

  setGoogleAttribution(on) {
    if (on === this.googleAttr) return;
    if (on) this.map.attributionControl.addAttribution(GOOGLE_ATTR);
    else this.map.attributionControl.removeAttribution(GOOGLE_ATTR);
    this.googleAttr = on;
  }

  highlight(id, on = true) {
    if (this.highlighted && this.highlighted !== id) {
      const prev = this.markers.get(this.highlighted);
      prev?.m.setRadius(prev.radius);
      this.highlighted = null;
    }
    const cur = this.markers.get(id);
    if (!cur) return;
    if (on) {
      cur.m.setRadius(cur.radius + 5).bringToFront();
      this.highlighted = id;
    } else {
      cur.m.setRadius(cur.radius);
      if (this.highlighted === id) this.highlighted = null;
    }
  }

  panTo(id) {
    const cur = this.markers.get(id);
    if (cur) this.map.panTo(cur.m.getLatLng(), { animate: !REDUCED() });
  }

  fitResults() {
    const pts = [...this.markers.values()].map((x) => x.m.getLatLng());
    if (!pts.length) return;
    this.map.fitBounds(L().latLngBounds(pts), { padding: [40, 40], maxZoom: 16, animate: !REDUCED() });
  }

  invalidate() { this.map.invalidateSize(); }
}
