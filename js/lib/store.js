// Stockage local (IndexedDB) : cache des recherches et mini CRM.
//
// Conditions de Google Maps Platform (à vérifier dans leur version en vigueur) :
// les identifiants de lieux (place ID) peuvent être conservés ; le reste du contenu
// Google n'est gardé ici que 30 jours au plus, puis effacé automatiquement.
// Le CRM ne conserve durablement que l'identifiant et vos propres informations
// (statut, notes, rappel, nom du contact). Les données OpenStreetMap (licence ODbL)
// peuvent être conservées avec attribution.

export const GOOGLE_TTL_MS = 30 * 24 * 3600 * 1000;
const DB_NAME = 'nexora-prospecteur';
const DB_VERSION = 1;

function reqP(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction annulée'));
  });
}

function openDb(indexedDB) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('places')) db.createObjectStore('places', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('cells')) db.createObjectStore('cells', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('crm')) db.createObjectStore('crm', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Base locale bloquée par un autre onglet'));
  });
}

class IdbBackend {
  constructor(db) { this.db = db; this.persistent = true; }
  async get(store, key) {
    return reqP(this.db.transaction(store).objectStore(store).get(key));
  }
  async getMany(store, keys) {
    const tx = this.db.transaction(store);
    const os = tx.objectStore(store);
    return Promise.all(keys.map((k) => reqP(os.get(k))));
  }
  async all(store) {
    return reqP(this.db.transaction(store).objectStore(store).getAll());
  }
  async putMany(store, values) {
    if (!values.length) return;
    const tx = this.db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (const v of values) os.put(v);
    await txDone(tx);
  }
  async delMany(store, keys) {
    if (!keys.length) return;
    const tx = this.db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (const k of keys) os.delete(k);
    await txDone(tx);
  }
  async clear(store) {
    const tx = this.db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    await txDone(tx);
  }
  async count(store) {
    return reqP(this.db.transaction(store).objectStore(store).count());
  }
}

class MemoryBackend {
  constructor() { this.maps = { places: new Map(), cells: new Map(), crm: new Map() }; this.persistent = false; }
  keyOf(store, v) { return store === 'cells' ? v.key : v.id; }
  async get(store, key) { return structuredClone(this.maps[store].get(key)); }
  async getMany(store, keys) { return keys.map((k) => structuredClone(this.maps[store].get(k))); }
  async all(store) { return [...this.maps[store].values()].map((v) => structuredClone(v)); }
  async putMany(store, values) { for (const v of values) this.maps[store].set(this.keyOf(store, v), structuredClone(v)); }
  async delMany(store, keys) { for (const k of keys) this.maps[store].delete(k); }
  async clear(store) { this.maps[store].clear(); }
  async count(store) { return this.maps[store].size; }
}

export class Store {
  constructor(backend) { this.b = backend; }

  get persistent() { return this.b.persistent; }

  // --- Lieux en cache -------------------------------------------------------
  async getPlaces(ids) {
    const rows = await this.b.getMany('places', ids);
    return rows.filter(Boolean);
  }
  async getPlace(id) { return this.b.get('places', id); }
  async putPlaces(places, now = Date.now()) {
    await this.b.putMany('places', places.map((p) => ({ ...p, fetchedAt: p.fetchedAt || now })));
  }

  // --- Cellules déjà interrogées -------------------------------------------
  async getCell(key) { return this.b.get('cells', key); }
  async putCell(rec, now = Date.now()) { await this.b.putMany('cells', [{ ...rec, fetchedAt: rec.fetchedAt || now }]); }

  /** Efface le contenu de plus de 30 jours (lieux et cellules). */
  async purgeExpired(now = Date.now()) {
    const limit = now - GOOGLE_TTL_MS;
    const places = (await this.b.all('places')).filter((p) => !(p.fetchedAt > limit)).map((p) => p.id);
    const cells = (await this.b.all('cells')).filter((c) => !(c.fetchedAt > limit)).map((c) => c.key);
    await this.b.delMany('places', places);
    await this.b.delMany('cells', cells);
    return { places: places.length, cells: cells.length };
  }

  async clearCache() {
    await this.b.clear('places');
    await this.b.clear('cells');
  }

  async counts() {
    const [places, cells, crm] = await Promise.all([this.b.count('places'), this.b.count('cells'), this.b.count('crm')]);
    return { places, cells, crm };
  }

  // --- CRM ------------------------------------------------------------------
  async crmAll() { return this.b.all('crm'); }
  async crmGet(id) { return this.b.get('crm', id); }
  async crmPut(rec) { await this.b.putMany('crm', [rec]); }
  async crmPutMany(recs) { await this.b.putMany('crm', recs); }
  async crmDelete(id) { await this.b.delMany('crm', [id]); }
  async crmClear() { await this.b.clear('crm'); }
}

export async function openStore({ indexedDB = globalThis.indexedDB } = {}) {
  if (indexedDB) {
    try {
      return new Store(new IdbBackend(await openDb(indexedDB)));
    } catch { /* navigation privée stricte, quota… : repli en mémoire */ }
  }
  return new Store(new MemoryBackend());
}

export function memoryStore() {
  return new Store(new MemoryBackend());
}
