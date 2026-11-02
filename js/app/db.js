// Stockage local IndexedDB : photos (blobs) et gestes enregistrés.

const DB_NAME = 'jarvis';
const DB_VERSION = 1;
let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('photos')) {
        const s = db.createObjectStore('photos', { keyPath: 'id' });
        s.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('sequences')) db.createObjectStore('sequences', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Base de données bloquée'));
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    Promise.resolve(fn(s)).then((r) => { result = r; });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Transaction annulée'));
  }));
}

const req2p = (req) => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });

export const db = {
  async all(store) {
    return tx(store, 'readonly', (s) => req2p(s.getAll()));
  },
  async get(store, id) {
    return tx(store, 'readonly', (s) => req2p(s.get(id)));
  },
  async put(store, value) {
    return tx(store, 'readwrite', (s) => req2p(s.put(value)));
  },
  async delete(store, id) {
    return tx(store, 'readwrite', (s) => req2p(s.delete(id)));
  },
  async clear(store) {
    return tx(store, 'readwrite', (s) => req2p(s.clear()));
  },
  async meta(key, value) {
    if (value === undefined) {
      const r = await tx('meta', 'readonly', (s) => req2p(s.get(key)));
      return r ? r.value : undefined;
    }
    return tx('meta', 'readwrite', (s) => req2p(s.put({ key, value })));
  },
  async destroy() {
    const d = await open();
    d.close();
    dbPromise = null;
    await new Promise((resolve) => { const r = indexedDB.deleteDatabase(DB_NAME); r.onsuccess = r.onerror = r.onblocked = () => resolve(); });
  },
};
