// Météo via Open-Meteo (sans clé) : géocodage de la ville puis conditions actuelles.

import { $ } from './dom.js';

const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const CACHE_MS = 15 * 60 * 1000;

const WMO = {
  0: ['ciel dégagé', 'sun'], 1: ['plutôt dégagé', 'sun'], 2: ['partiellement nuageux', 'cloudsun'], 3: ['couvert', 'cloud'],
  45: ['brouillard', 'fog'], 48: ['brouillard givrant', 'fog'],
  51: ['bruine légère', 'rain'], 53: ['bruine', 'rain'], 55: ['bruine dense', 'rain'], 56: ['bruine verglaçante', 'rain'], 57: ['bruine verglaçante', 'rain'],
  61: ['pluie faible', 'rain'], 63: ['pluie', 'rain'], 65: ['forte pluie', 'rain'], 66: ['pluie verglaçante', 'rain'], 67: ['pluie verglaçante', 'rain'],
  71: ['neige faible', 'snow'], 73: ['neige', 'snow'], 75: ['forte neige', 'snow'], 77: ['grains de neige', 'snow'],
  80: ['averses', 'rain'], 81: ['averses', 'rain'], 82: ['violentes averses', 'rain'], 85: ['averses de neige', 'snow'], 86: ['averses de neige', 'snow'],
  95: ['orage', 'storm'], 96: ['orage avec grêle', 'storm'], 99: ['orage violent', 'storm'],
};

const ICONS = {
  sun: '<circle class="sun" cx="24" cy="24" r="8"/><path class="sun" d="M24 6v5M24 37v5M6 24h5M37 24h5M11.3 11.3l3.5 3.5M33.2 33.2l3.5 3.5M11.3 36.7l3.5-3.5M33.2 14.8l3.5-3.5"/>',
  moon: '<path d="M32 30a12 12 0 0 1-14-16 12 12 0 1 0 14 16z"/>',
  cloudsun: '<circle class="sun" cx="18" cy="17" r="6"/><path class="sun" d="M18 6v3M8 17h3M10.9 9.9l2 2"/><path d="M15 36h19a7 7 0 0 0 0-14 9 9 0 0 0-17 3 5.5 5.5 0 0 0-2 11z"/>',
  cloud: '<path d="M13 35h21a8 8 0 0 0 0-16 10 10 0 0 0-19 3 6.5 6.5 0 0 0-2 13z"/>',
  fog: '<path d="M10 20h28M8 26h32M12 32h24M16 38h16"/>',
  rain: '<path d="M13 28h21a7 7 0 0 0 0-14 9 9 0 0 0-17 3 5.5 5.5 0 0 0-4 11z"/><path d="M17 33l-2 5M25 33l-2 5M33 33l-2 5"/>',
  snow: '<path d="M13 28h21a7 7 0 0 0 0-14 9 9 0 0 0-17 3 5.5 5.5 0 0 0-4 11z"/><path d="M17 35h.01M24 38h.01M31 35h.01"/>',
  storm: '<path d="M13 27h21a7 7 0 0 0 0-14 9 9 0 0 0-17 3 5.5 5.5 0 0 0-4 11z"/><path class="sun" d="M25 29l-4 7h5l-3 7"/>',
  off: '<path d="M13 35h21a8 8 0 0 0 0-16 10 10 0 0 0-19 3 6.5 6.5 0 0 0-2 13z"/><path d="M10 10l28 28"/>',
};

export function describe(code) {
  return WMO[code] || ['conditions inconnues', 'cloud'];
}

export class Weather {
  constructor(app) {
    this.app = app;
    this.cache = new Map();
  }

  async geocode(city) {
    const url = `${GEO}?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('géocodage');
    const data = await res.json();
    const r = data.results?.[0];
    if (!r) throw Object.assign(new Error('ville inconnue'), { code: 'notfound' });
    return { name: r.name, lat: r.latitude, lon: r.longitude, country: r.country, admin: r.admin1 };
  }

  async current(city) {
    const key = city.toLowerCase();
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
    const place = await this.geocode(city);
    const url = `${FORECAST}?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('prévisions');
    const json = await res.json();
    const c = json.current;
    const [desc, icon] = describe(c.weather_code);
    const data = {
      place,
      temp: Math.round(c.temperature_2m),
      feels: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      wind: Math.round(c.wind_speed_10m),
      code: c.weather_code,
      desc,
      icon: !c.is_day && icon === 'sun' ? 'moon' : icon,
    };
    this.cache.set(key, { at: Date.now(), data });
    return data;
  }

  sentence(d) {
    return `À ${d.place.name}, ${d.temp} degrés, ${d.desc}. Ressenti ${d.feels} degrés, vent ${d.wind} kilomètres-heure.`;
  }

  async refreshWidget() {
    const city = this.app.settings.get('city') || 'Toulouse';
    $('#weatherCity').textContent = city;
    try {
      const d = await this.current(city);
      this.renderWidget(d);
    } catch {
      $('#weatherTemp').textContent = '--°';
      $('#weatherDesc').textContent = 'météo hors ligne';
      $('#weatherIcon').innerHTML = ICONS.off;
    }
  }

  renderWidget(d) {
    $('#weatherTemp').textContent = `${d.temp}°`;
    $('#weatherDesc').textContent = d.desc;
    $('#weatherCity').textContent = `${d.place.name} · vent ${d.wind} km/h`;
    $('#weatherIcon').innerHTML = ICONS[d.icon] || ICONS.cloud;
  }

  start() {
    this.refreshWidget();
    setInterval(() => this.refreshWidget(), 20 * 60 * 1000);
    this.app.settings.on('change', (c) => { if ('city' in c) this.refreshWidget(); });
  }
}
