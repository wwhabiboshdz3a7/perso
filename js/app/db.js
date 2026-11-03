// Stockage local IndexedDB : photos (blobs) et gestes enregistrés.

const DB_NAME = 'jarvis';
const DB_VERSION = 1;
const OPEN_TIMEOUT_MS = 8000;
let dbPromise = null;

function blockedError() {
  return Object.assign(new Error('Base de données occupée par une autre fenêtre JARVIS'), { blocked: true });
}

function open() {
  if (dbPromise) return dbPromise;
  const p = new Promise((resolve, reject) => {
    let settled = false;
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    // Ouverture en attente (suppression demandée par une autre fenêtre encore
    // ouverte) : on n'attend pas indéfiniment.
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (dbPromise === p) dbPromise = null;
      reject(blockedError());
    }, OPEN_TIMEOUT_MS);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('photos')) {
        const s = db.createObjectStore('photos', { keyPath: 'id' });
        s.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('sequences')) db.createObjectStore('sequences', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => {
      const db = req.result;
      if (settled) { db.close(); return; }
      settled = true;
      clearTimeout(timer);
      // Une autre fenêtre veut supprimer ou mettre à niveau la base : on lui
      // laisse la place (la prochaine opération rouvrira une connexion).
      db.onversionchange = () => {
        db.close();
        if (dbPromise === p) dbPromise = null;
        window.dispatchEvent(new CustomEvent('jarvis:db-reset'));
      };
      db.onclose = () => { if (dbPromise === p) dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (dbPromise === p) dbPromise = null;
      reject(req.error);
    };
    req.onblocked = () => { /* mise à niveau en attente des autres fenêtres */ };
  });
  dbPromise = p;
  return p;
}

function tx(store, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    let t;
    try { t = db.transaction(store, mode); } catch (err) { dbPromise = null; reject(err); return; }
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
  /**
   * Supprime la base. Les autres fenêtres ferment leur connexion d'elles-mêmes
   * (versionchange) ; si l'une d'elles bloque encore, on rejette avec
   * { blocked: true } au lieu de recharger sur une suppression en suspens.
   */
  async destroy({ waitMs = 4000 } = {}) {
    try {
      const d = await open();
      d.close();
    } catch { /* déjà fermée */ }
    dbPromise = null;
    await new Promise((resolve, reject) => {
      const r = indexedDB.deleteDatabase(DB_NAME);
      let timer = 0;
      r.onsuccess = () => { clearTimeout(timer); resolve(); };
      r.onerror = () => { clearTimeout(timer); reject(r.error); };
      r.onblocked = () => {
        clearTimeout(timer);
        timer = setTimeout(() => reject(blockedError()), waitMs);
      };
    });
  },
};
