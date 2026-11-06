// Tests des modules partagés : sites, quadrillage, score, CSV, OSM, orchestration.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyWebsite, websiteLabel } from '../../js/lib/website.js';
import { gridCells, zoneToCells, splitCell, estimateCost, bboxSizeKm, pointInZone } from '../../js/lib/geo.js';
import { opportunityScore } from '../../js/lib/score.js';
import { toCSV, csvCell, BOM } from '../../js/lib/csv.js';
import { formatPhoneFR, telHref, cityFromAddress, nameSimilarity } from '../../js/lib/format.js';
import { buildOverpassQuery, parseOverpass } from '../../js/lib/osm.js';
import { runGoogleSearch } from '../../js/lib/search.js';
import { memoryStore, GOOGLE_TTL_MS } from '../../js/lib/store.js';
import { handle, resetRateLimits } from '../../netlify/functions/places.mjs';
import { hashPassword } from '../../js/lib/hash.js';
import { createMockGoogle, TEST_KEY } from '../fixtures/mock-google.mjs';

test('classement des sites : aucun, réseaux/annuaires, vrai site, site gratuit', () => {
  assert.equal(classifyWebsite('').status, 'none');
  assert.equal(classifyWebsite(undefined).status, 'none');
  for (const u of ['https://www.facebook.com/boulangerie', 'http://m.facebook.com/x', 'instagram.com/salon', 'https://linktr.ee/barber',
    'https://www.pagesjaunes.fr/pros/123', 'https://www.tripadvisor.fr/Restaurant', 'https://www.ubereats.com/fr/store/x',
    'https://deliveroo.fr/fr/menu/x', 'https://www.planity.com/salon-x', 'https://www.treatwell.fr/salon/x',
    'https://www.doctolib.fr/dentiste/x', 'https://sites.google.com/view/x', 'https://boulangerie-x.business.site/']) {
    assert.equal(classifyWebsite(u).status, 'social', u);
  }
  assert.equal(classifyWebsite('https://www.boulangerie-martin.fr/').status, 'site');
  const wix = classifyWebsite('https://salon.wixsite.com/accueil');
  assert.equal(wix.status, 'site');
  assert.equal(wix.free, true);
  assert.equal(websiteLabel(classifyWebsite('https://www.facebook.com/x')), 'Facebook seulement');
  // un domaine qui contient « facebook » sans en être un sous-domaine reste un vrai site
  assert.equal(classifyWebsite('https://notfacebook.com.fr/').status, 'site');
});

test('quadrillage : cellules d\'environ la taille demandée, cercle filtré, subdivision', () => {
  const bbox = { south: 43.56, west: 1.39, north: 43.65, east: 1.5 };
  const { w, h } = bboxSizeKm(bbox);
  const cells = gridCells(bbox, 2);
  assert.equal(cells.length, Math.ceil(w / 2) * Math.ceil(h / 2));
  for (const c of cells) {
    const s = bboxSizeKm(c);
    assert.ok(s.w <= 2.0001 && s.h <= 2.0001);
  }
  assert.equal(cells[cells.length - 1].north, bbox.north);
  const circle = { kind: 'circle', center: { lat: 43.6045, lng: 1.4442 }, radiusKm: 3 };
  const cc = zoneToCells(circle, 0.5);
  assert.ok(cc.length < 144 && cc.length > 100, `cellules du cercle : ${cc.length}`);
  const four = splitCell(cells[0]);
  assert.equal(four.length, 4);
  assert.ok(pointInZone({ lat: 43.6045, lng: 1.4442 }, circle));
  assert.ok(!pointInZone({ lat: 43.7, lng: 1.4442 }, circle));
});

test('estimation : bornée par le plafond, cache déduit', () => {
  const e = estimateCost({ cells: 10, categories: 3, cachedTasks: 5, pricePerRequest: 0.035, cap: 50, pagesPerTask: 2 });
  assert.equal(e.tasks, 30);
  assert.equal(e.toFetch, 25);
  assert.equal(e.min, 25);
  assert.equal(e.typical, 50);
  assert.equal(e.max, 50);
  assert.equal(e.capped, true);
  assert.ok(Math.abs(e.cost.min - 0.875) < 1e-9);
});

test('score : beaucoup d\'avis + bonne note + pas de site = chaud', () => {
  const hot = opportunityScore({ website: { status: 'none' }, reviews: 87, rating: 4.8, phone: '05' });
  const social = opportunityScore({ website: { status: 'social' }, reviews: 87, rating: 4.8, phone: '05' });
  const fewReviews = opportunityScore({ website: { status: 'none' }, reviews: 2, rating: 5, phone: '05' });
  const withSite = opportunityScore({ website: { status: 'site' }, reviews: 400, rating: 4.9, phone: '05' });
  assert.equal(hot.level, 'chaud');
  assert.ok(hot.score > social.score && social.score > withSite.score);
  assert.ok(fewReviews.score <= 55);
  assert.equal(withSite.level, 'froid');
});

test('CSV : BOM, point-virgule, guillemets, virgule décimale, anti-formules', () => {
  const csv = toCSV([{ n: 'Boulangerie "Le Pain"; Fils', r: 4.8, p: '+33 5 61', f: '=HYPERLINK("x")' }], [
    { key: 'n', label: 'Nom' }, { key: 'r', label: 'Note' }, { key: 'p', label: 'Tél' }, { key: 'f', label: 'F' },
  ]);
  assert.ok(csv.startsWith(BOM));
  const lines = csv.slice(1).split('\r\n');
  assert.equal(lines[0], 'Nom;Note;Tél;F');
  assert.equal(lines[1], '"Boulangerie ""Le Pain""; Fils";4,8;\'+33 5 61;"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell(null), '');
});

test('téléphones et adresses', () => {
  assert.equal(formatPhoneFR('+33 5 61 22 33 44'), '05 61 22 33 44');
  assert.equal(telHref('05 61 22 33 44'), 'tel:+33561223344');
  assert.equal(telHref('+33 6 39 98 00 01'), 'tel:+33639980001');
  assert.equal(cityFromAddress('12 Rue X, 31000 Toulouse, France'), 'Toulouse');
  assert.ok(nameSimilarity('Boulangerie du Canal', 'BOULANGERIE DU CANAL (SARL)') > 0.6);
});

test('OSM : requête Overpass et classement (sans site, réseaux, site)', () => {
  const zone = { kind: 'rect', bbox: { south: 43.6, west: 1.44, north: 43.61, east: 1.45 } };
  const q = buildOverpassQuery(zone, ['boulangerie', 'coiffeur']);
  assert.match(q, /\[out:json\]/);
  assert.match(q, /nwr\["shop"="bakery"\]\["name"\]\(43\.600000,1\.440000,43\.610000,1\.450000\);/);
  assert.match(q, /out center tags/);
  const json = { elements: [
    { type: 'node', id: 1, lat: 43.605, lon: 1.445, tags: { name: 'Fournil A', shop: 'bakery', phone: '+33 5 36 49 00 01' } },
    { type: 'way', id: 2, center: { lat: 43.606, lon: 1.446 }, tags: { name: 'Salon B', shop: 'hairdresser', 'contact:facebook': 'https://facebook.com/salonb' } },
    { type: 'node', id: 3, lat: 43.607, lon: 1.447, tags: { name: 'Salon C', shop: 'hairdresser', website: 'https://salon-c.fr' } },
    { type: 'node', id: 4, lat: 43.607, lon: 1.447, tags: { shop: 'hairdresser' } },
    { type: 'node', id: 5, lat: 44, lon: 1.447, tags: { name: 'Hors zone', shop: 'bakery' } },
  ] };
  const places = parseOverpass(json, ['boulangerie', 'coiffeur'], zone);
  assert.equal(places.length, 3);
  const byName = Object.fromEntries(places.map((p) => [p.name, p]));
  assert.equal(byName['Fournil A'].website.status, 'none');
  assert.equal(byName['Fournil A'].categories[0], 'boulangerie');
  assert.equal(byName['Salon B'].website.status, 'social');
  assert.equal(byName['Salon C'].website.status, 'site');
  assert.equal(byName['Fournil A'].reviews, null);
});

test('orchestration : quadrillage, subdivision des cellules saturées, dédoublonnage, plafond, cache', async () => {
  resetRateLimits();
  const pw = 'motdepasse-solide-42';
  const env = { GOOGLE_PLACES_API_KEY: TEST_KEY, ACCESS_PASSWORD_HASH: await hashPassword(pw, { iterations: 20000 }), TOKEN_SECRET: 'b'.repeat(64), MAX_REQUESTS_PER_DAY: '5000' };
  const google = createMockGoogle();
  let token;
  // Client minimal qui passe directement par le gestionnaire de la fonction
  const api = {
    async call(body) {
      const res = await handle(new Request('https://t.test/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      }), { env, fetch: google.fetch, quotaStore: null, ip: '9.9.9.9' });
      const data = await res.json();
      if (!res.ok) { const e = new Error(data.message); e.status = res.status; e.code = data.error; e.data = data; throw e; }
      return data;
    },
    search(p) { return this.call({ action: 'search', ...p }); },
  };
  token = (await api.call({ action: 'login', password: pw })).token;

  const store = memoryStore();
  const zone = { kind: 'circle', center: { lat: 43.6045, lng: 1.4442 }, radiusKm: 1.5 };
  const r1 = await runGoogleSearch({ api, store, zone, categoryIds: ['restaurant', 'plombier'], cellKm: 3, cap: 400 });
  assert.ok(r1.stats.subdivisions > 0, 'le centre dense doit être subdivisé');
  const ids = r1.places.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'pas de doublons');
  assert.ok(r1.places.every((p) => pointInZone(p, zone)), 'tout est dans le cercle');
  // tous les restaurants en activité du jeu de données dans le cercle sont retrouvés
  const expected = google.dataset.filter((p) => p.cat === 'restaurant' && p.status === 'OPERATIONAL' && pointInZone(p, zone)).length;
  const got = r1.places.filter((p) => p.categories.includes('restaurant')).length;
  assert.ok(got >= expected * 0.95, `restaurants trouvés ${got}/${expected}`);
  assert.equal(r1.stats.requests, google.calls.length);

  // Deuxième passage : tout vient du cache, aucune requête
  const before = google.calls.length;
  const r2 = await runGoogleSearch({ api, store, zone, categoryIds: ['restaurant', 'plombier'], cellKm: 3, cap: 400 });
  assert.equal(google.calls.length, before);
  assert.equal(r2.stats.requests, 0);
  assert.equal(r2.places.length, r1.places.length);

  // Cache expiré au-delà de 30 jours
  const later = () => Date.now() + GOOGLE_TTL_MS + 1000;
  const purged = await store.purgeExpired(later());
  assert.ok(purged.places > 0 && purged.cells > 0);

  // Plafond respecté (requêtes en parallèle comprises)
  const r3 = await runGoogleSearch({ api, store: memoryStore(), zone, categoryIds: ['restaurant'], cellKm: 1, cap: 7, concurrency: 3 });
  assert.ok(r3.stats.requests <= 7, `requêtes ${r3.stats.requests}`);
  assert.equal(r3.stats.stoppedByCap, true);
  assert.ok(r3.pending > 0);
});
