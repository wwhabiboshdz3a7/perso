// Orchestration des recherches : quadrillage, subdivision adaptative, cache, plafond.
import { zoneToCells, splitCell, cellKey, pointInZone } from './geo.js';
import { categoryById } from './categories.js';
import { GOOGLE_TTL_MS } from './store.js';
import { buildOverpassQuery, fetchOverpass, parseOverpass } from './osm.js';
import { classifyWebsite } from './website.js';
import { cityFromAddress } from './format.js';

export const MAX_DEPTH = 5;

export function taskKey(catId, cell) {
  return `${catId}|${cellKey(cell)}`;
}

/** Clés des tâches (cellule × catégorie) déjà en cache et encore valides. */
export async function cachedTaskKeys(store, zone, categoryIds, cellKm, now = Date.now()) {
  const keys = new Set();
  if (!store) return keys;
  const cells = zoneToCells(zone, cellKm);
  for (const catId of categoryIds) {
    for (const cell of cells) {
      const key = taskKey(catId, cell);
      const rec = await store.getCell(key);
      if (rec && !rec.partial && rec.fetchedAt > now - GOOGLE_TTL_MS) keys.add(key);
    }
  }
  return keys;
}

/** Nombre de tâches (cellule × catégorie) déjà en cache et encore valides. */
export async function countCachedTasks(store, zone, categoryIds, cellKm, now = Date.now()) {
  return (await cachedTaskKeys(store, zone, categoryIds, cellKm, now)).size;
}

const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Arrêt', 'AbortError')); }, { once: true });
});

/**
 * Recherche Google sur toute une zone.
 * @returns {Promise<{places:object[], stats:object, pending:number, aborted:boolean, fatal?:Error}>}
 */
export async function runGoogleSearch({
  api, store, zone, categoryIds, cellKm = 2, cap = 150, concurrency = 3,
  onUpdate, signal, now = () => Date.now(),
}) {
  const cells = zoneToCells(zone, cellKm);
  const queue = [];
  for (const catId of categoryIds) for (const cell of cells) queue.push({ catId, cell, depth: 0 });

  const found = new Map();
  const stats = {
    requests: 0, tasksDone: 0, cachedTasks: 0, subdivisions: 0, closed: 0, outside: 0,
    typeDropped: [], stoppedByCap: false, errors: [], initialTasks: queue.length,
  };
  let reserved = 0;
  let inflight = 0;
  let fatal = null;

  const emit = () => onUpdate?.({
    places: [...found.values()],
    stats,
    pending: queue.length,
    inflight,
    total: stats.tasksDone + queue.length + inflight,
  });

  const addPlaces = (places, catId) => {
    for (const p of places) {
      if (!pointInZone(p, zone)) { stats.outside++; continue; }
      const prev = found.get(p.id);
      if (prev) {
        if (!prev.categories.includes(catId)) prev.categories.push(catId);
        continue;
      }
      found.set(p.id, { ...p, categories: [catId] });
    }
  };

  const subdivide = (task) => {
    if (task.depth >= MAX_DEPTH) return;
    stats.subdivisions++;
    for (const c of splitCell(task.cell)) queue.push({ catId: task.catId, cell: c, depth: task.depth + 1 });
  };

  async function runTask(task) {
    const key = taskKey(task.catId, task.cell);
    const cached = store ? await store.getCell(key) : null;
    if (cached && !cached.partial && cached.fetchedAt > now() - GOOGLE_TTL_MS) {
      const places = await store.getPlaces(cached.ids || []);
      if (places.length === (cached.ids || []).length) {
        stats.cachedTasks++;
        addPlaces(places, task.catId);
        if (cached.saturated) subdivide(task);
        return 'done';
      }
    }

    const maxPages = Math.min(3, cap - stats.requests - reserved);
    if (maxPages < 1) return 'cap';
    reserved += maxPages;
    const cat = categoryById(task.catId);
    let attempt = 0;
    try {
      for (;;) {
        try {
          const res = await api.search({ cell: task.cell, category: { query: cat.query, type: cat.type }, maxPages }, { signal });
          stats.requests += res.requests || 0;
          stats.closed += res.closed || 0;
          if (res.typeDropped && !stats.typeDropped.includes(task.catId)) stats.typeDropped.push(task.catId);
          const places = res.places || [];
          if (store) {
            await store.putPlaces(places, now());
            await store.putCell({ key, ids: places.map((p) => p.id), saturated: !!res.saturated, partial: maxPages < 3 && !!res.hasMore }, now());
          }
          addPlaces(places, task.catId);
          if (res.saturated) subdivide(task);
          return 'done';
        } catch (e) {
          if (e?.name === 'AbortError') throw e;
          // Limite par minute de la fonction : on patiente puis on réessaie.
          if (e?.status === 429 && e.code === 'rate' && attempt < 3) {
            attempt++;
            await sleep(Math.min(60, Number(e.data?.retryAfter) || 10) * 1000, signal);
            continue;
          }
          if ([401, 403, 503].includes(e?.status) || (e?.status === 429)) { fatal = e; return 'fatal'; }
          stats.errors.push(e?.message || String(e));
          if (stats.errors.length >= 5) { fatal = e; return 'fatal'; }
          return 'done';
        }
      }
    } finally {
      reserved -= maxPages;
    }
  }

  async function worker() {
    while (queue.length && !fatal && !signal?.aborted) {
      const task = queue.shift();
      inflight++;
      let r;
      try {
        r = await runTask(task);
      } catch (e) {
        inflight--;
        if (e?.name === 'AbortError') { queue.unshift(task); return; }
        fatal = e;
        return;
      }
      inflight--;
      if (r === 'cap') {
        queue.unshift(task);
        // Attendre que les requêtes en cours libèrent leur réservation avant de conclure.
        if (inflight > 0) { await new Promise((res) => setTimeout(res, 50)); continue; }
        stats.stoppedByCap = true;
        return;
      }
      if (r === 'fatal') { queue.unshift(task); return; }
      stats.tasksDone++;
      emit();
    }
  }

  emit();
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  if (queue.length && !fatal && !signal?.aborted && stats.requests >= cap) stats.stoppedByCap = true;
  emit();
  return { places: [...found.values()], stats, pending: queue.length, aborted: !!signal?.aborted, fatal };
}

/** Recherche gratuite OpenStreetMap. */
export async function runOsmSearch({ zone, categoryIds, store, fetchImpl, signal, now = () => Date.now() }) {
  const query = buildOverpassQuery(zone, categoryIds);
  const json = await fetchOverpass(query, { fetchImpl, signal });
  const places = parseOverpass(json, categoryIds, zone);
  if (store) await store.putPlaces(places, now());
  return { places, stats: { requests: 0, elements: json?.elements?.length || 0 } };
}

/**
 * Vérifie des candidats OpenStreetMap sur Google (avis, note, site) : 1 requête par candidat.
 * Modifie et renvoie les lieux enrichis.
 */
export async function verifyWithGoogle({ api, places, store, signal, onUpdate, now = () => Date.now() }) {
  let requests = 0;
  let matched = 0;
  const out = [];
  for (const p of places) {
    if (signal?.aborted) break;
    const city = p.city || cityFromAddress(p.address);
    const res = await api.match({ name: p.name, lat: p.lat, lng: p.lng, city }, { signal });
    requests += res.requests || 0;
    let next;
    if (res.place) {
      matched++;
      const g = res.place;
      const gWeb = classifyWebsite(g.websiteUri);
      next = {
        ...p,
        googleId: g.id,
        reviews: g.reviews,
        rating: g.rating,
        phone: p.phone || g.phone,
        phoneIntl: g.phoneIntl || p.phoneIntl,
        address: p.address || g.address,
        websiteUri: g.websiteUri || p.websiteUri,
        website: gWeb.status !== 'none' ? gWeb : p.website,
        mapsUrl: g.mapsUrl || p.mapsUrl,
        googleClosed: g.businessStatus && g.businessStatus !== 'OPERATIONAL',
        verified: 'ok',
        verifiedAt: now(),
        fetchedAt: now(),
      };
    } else {
      next = { ...p, verified: 'introuvable', verifiedAt: now() };
    }
    out.push(next);
    if (store) await store.putPlaces([next], now());
    onUpdate?.(next, { requests, matched, done: out.length, total: places.length });
  }
  return { places: out, requests, matched };
}
