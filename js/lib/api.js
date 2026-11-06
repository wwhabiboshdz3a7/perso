// Client de la fonction Netlify /api/places (jeton de session conservé localement).

const TOKEN_KEY = 'nxp.token';

export class ApiError extends Error {
  constructor(status, code, message, data = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function safeStorage(kind) {
  try { return kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage; } catch { return null; }
}

export class PlacesApi {
  constructor({ endpoint = '/api/places', fetchImpl } = {}) {
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl || ((...a) => globalThis.fetch(...a));
    this.session = this.#loadToken();
  }

  #loadToken() {
    for (const kind of ['session', 'local']) {
      try {
        const raw = safeStorage(kind)?.getItem(TOKEN_KEY);
        if (!raw) continue;
        const s = JSON.parse(raw);
        if (s?.token && s.exp > Date.now()) return s;
      } catch { /* jeton illisible : ignoré */ }
    }
    return null;
  }

  get loggedIn() { return Boolean(this.session && this.session.exp > Date.now()); }

  logout() {
    this.session = null;
    for (const kind of ['session', 'local']) {
      try { safeStorage(kind)?.removeItem(TOKEN_KEY); } catch { /* rien */ }
    }
  }

  async #post(payload, { auth = false, signal } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      if (!this.loggedIn) throw new ApiError(401, 'token', 'Connectez-vous pour utiliser Google Places.');
      headers.Authorization = `Bearer ${this.session.token}`;
    }
    let res;
    try {
      res = await this.fetchImpl(this.endpoint, { method: 'POST', headers, body: JSON.stringify(payload), signal });
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      throw new ApiError(0, 'network', 'Fonction Netlify injoignable : vérifiez votre connexion.');
    }
    let data = null;
    const type = res.headers.get('content-type') || '';
    if (type.includes('application/json')) {
      try { data = await res.json(); } catch { data = null; }
    }
    if (!data) {
      if (res.status === 404) throw new ApiError(404, 'nofunction', 'Fonction /api/places introuvable : le site doit être publié sur Netlify (ou lancé avec « netlify dev »).');
      throw new ApiError(res.status, 'http', `Réponse inattendue du serveur (${res.status}).`);
    }
    if (!res.ok || data.ok === false) {
      if (res.status === 401 && data.error === 'token') this.logout();
      throw new ApiError(res.status, data.error || 'http', data.message || `Erreur ${res.status}`, data);
    }
    return data;
  }

  status() { return this.#post({ action: 'status' }); }

  async login(password, { remember = false } = {}) {
    const data = await this.#post({ action: 'login', password });
    this.session = { token: data.token, exp: data.exp };
    const store = safeStorage(remember ? 'local' : 'session');
    try { store?.setItem(TOKEN_KEY, JSON.stringify(this.session)); } catch { /* stockage indisponible */ }
    return data;
  }

  search({ cell, category, maxPages }, { signal } = {}) {
    return this.#post({ action: 'search', cell, category, maxPages }, { auth: true, signal });
  }

  match({ name, lat, lng, city }, { signal } = {}) {
    return this.#post({ action: 'match', name, lat, lng, city }, { auth: true, signal });
  }

  details(id, { signal } = {}) {
    return this.#post({ action: 'details', id }, { auth: true, signal });
  }
}
