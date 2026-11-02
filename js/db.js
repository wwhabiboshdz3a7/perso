// Stockage local des conversations, de la mémoire et de la bibliothèque (IndexedDB).

const DB_NAME = 'nour';
const DB_VERSION = 1;
let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('conversations')) {
        const store = db.createObjectStore('conversations', { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Base de données bloquée par un autre onglet.'));
  });
  return dbPromise;
}

function tx(storeName, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    let result;
    Promise.resolve(fn(store)).then((r) => { result = r; });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Transaction annulée'));
  }));
}

function reqP(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const db = {
  async listConversations() {
    const all = await tx('conversations', 'readonly', (s) => reqP(s.getAll()));
    return (all || []).sort((a, b) => b.updatedAt - a.updatedAt);
  },
  getConversation(id) {
    return tx('conversations', 'readonly', (s) => reqP(s.get(id)));
  },
  putConversation(conv) {
    // Copie « propre » (sans proxys ni fonctions) avant écriture.
    const data = JSON.parse(JSON.stringify(conv));
    return tx('conversations', 'readwrite', (s) => reqP(s.put(data)));
  },
  deleteConversation(id) {
    return tx('conversations', 'readwrite', (s) => reqP(s.delete(id)));
  },
  clearConversations() {
    return tx('conversations', 'readwrite', (s) => reqP(s.clear()));
  },
  kvGet(key) {
    return tx('kv', 'readonly', (s) => reqP(s.get(key)));
  },
  kvSet(key, value) {
    return tx('kv', 'readwrite', (s) => reqP(s.put(JSON.parse(JSON.stringify(value)), key)));
  },
  kvDelete(key) {
    return tx('kv', 'readwrite', (s) => reqP(s.delete(key)));
  },
};
