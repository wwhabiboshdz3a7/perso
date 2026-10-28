// Exécution de code dans le navigateur : JavaScript (Worker isolé), Python (Pyodide), HTML/CSS (iframe).

// Pyodide est servi localement (vendor/pyodide) : la plateforme fonctionne sans CDN externe.
const PYODIDE_URL = new URL('../vendor/pyodide/', import.meta.url).href;

// ---------- JavaScript : Worker + timeout ----------
const workerSource = `
  const __logs = [];
  const fmt = v => { try {
    if (typeof v === 'string') return v;
    if (v instanceof Error) return v.name + ': ' + v.message;
    if (typeof v === 'function') return v.toString();
    if (v === undefined) return 'undefined';
    return JSON.stringify(v, (k, x) => typeof x === 'bigint' ? x.toString() + 'n' : x);
  } catch (e) { return String(v); } };
  const log = (...a) => __logs.push(a.map(fmt).join(' '));
  self.console = { log, info: log, warn: log, error: log, table: log, debug: log };
  self.alert = log; self.prompt = () => null;
  // Suivi des timers en attente : on attend qu'ils soient tous passés avant de renvoyer la sortie.
  let __attente = 0;
  const __setTimeout = self.setTimeout.bind(self), __clearTimeout = self.clearTimeout.bind(self);
  self.setTimeout = (fn, ms, ...args) => { __attente++; return __setTimeout(() => { __attente--; try { fn(...args); } catch (err) { log('⚠ ' + (err && err.message || err)); } }, ms); };
  self.clearTimeout = id => { __clearTimeout(id); __attente = Math.max(0, __attente - 1); };
  // Idem pour les opérations Web Crypto asynchrones (labs de cybersécurité).
  if (self.crypto && self.crypto.subtle) {
    const proto = Object.getPrototypeOf(self.crypto.subtle);
    for (const k of ['digest', 'encrypt', 'decrypt', 'sign', 'verify', 'importKey', 'exportKey', 'deriveKey', 'deriveBits', 'generateKey', 'wrapKey', 'unwrapKey']) {
      const orig = proto[k];
      if (typeof orig !== 'function') continue;
      proto[k] = function (...args) { __attente++; let p; try { p = orig.apply(this, args); } catch (e) { __attente--; throw e; } return p.finally(() => { __attente--; }); };
    }
  }
  self.onmessage = async (e) => {
    const { code, exprs = [] } = e.data;
    let erreur = null, valeurs = [];
    // Les expressions de test sont évaluées dans la même portée que le code de l'élève
    // (sinon les const/let/class déclarés dans le code ne seraient pas visibles).
    // La fonction d'évaluation est définie dans la portée du code (fermeture) mais appelée APRÈS la fin
    // des traitements asynchrones, pour que les variables remplies par une fonction async soient visibles.
    const suffixe = '\\n;self.__evaluer__ = () => [' + exprs.map(ex => '(() => { try { return { ok: true, valeur: (' + ex + ') }; } catch (err) { return { ok: false, erreur: String(err && err.message || err) }; } })()').join(',') + '];';
    try {
      self.__evaluer__ = null;
      const r = (0, eval)(code + suffixe);
      if (r && typeof r.then === 'function') await r;
      for (let i = 0; i < 5; i++) await null;                       // laisse passer les microtâches
      while (__attente > 0) await new Promise(res => __setTimeout(res, 5));   // puis les timers (setTimeout)
      for (let i = 0; i < 5; i++) await null;
      valeurs = (self.__evaluer__ ? self.__evaluer__() : []).map(v => { try { return v.ok ? { ok: true, valeur: JSON.parse(JSON.stringify(v.valeur ?? null)) } : v; } catch { return { ok: true, valeur: String(v.valeur) }; } });
    } catch (err) {
      erreur = (err && err.name ? err.name + ': ' : '') + (err && err.message ? err.message : String(err));
      __logs.push('⚠ ' + erreur);
      valeurs = exprs.map(() => ({ ok: false, erreur }));
    }
    self.postMessage({ stdout: __logs.join('\\n'), erreur, valeurs });
  };
`;
let workerURL = null;
export function executerJS(code, exprs = [], timeout = 4000) {
  return new Promise(resolve => {
    if (!workerURL) workerURL = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    let w;
    try { w = new Worker(workerURL); } catch (e) { return resolve({ stdout: '', erreur: 'Worker indisponible : ' + e.message, valeurs: [] }); }
    const t = setTimeout(() => { w.terminate(); resolve({ stdout: '', erreur: 'Temps dépassé (' + timeout / 1000 + ' s) — boucle infinie ?', valeurs: [] }); }, timeout);
    w.onmessage = e => { clearTimeout(t); w.terminate(); resolve(e.data); };
    w.onerror = e => { clearTimeout(t); w.terminate(); resolve({ stdout: '', erreur: e.message || 'Erreur de syntaxe', valeurs: [] }); };
    w.postMessage({ code, exprs });
  });
}

// ---------- Python : Pyodide chargé à la demande ----------
let pyodidePromise = null;
export function pythonPret() { return !!(pyodidePromise); }
export function chargerPython(onStatut = () => {}) {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    onStatut('Chargement de Python (~12 Mo, une seule fois)…');
    if (!window.loadPyodide) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = PYODIDE_URL + 'pyodide.js'; s.onload = res; s.onerror = () => rej(new Error('Impossible de charger Pyodide (vérifie ta connexion).'));
        document.head.appendChild(s);
      });
    }
    const py = await window.loadPyodide({ indexURL: PYODIDE_URL });
    onStatut('Python prêt.');
    return py;
  })();
  pyodidePromise.catch(() => { pyodidePromise = null; });
  return pyodidePromise;
}

export async function executerPython(code, exprs = [], onStatut = () => {}) {
  const py = await chargerPython(onStatut);
  const sortie = [];
  py.setStdout({ batched: s => sortie.push(s) });
  py.setStderr({ batched: s => sortie.push(s) });
  let erreur = null, resultat = null;
  try {
    if (/^\s*(import|from)\s+(numpy|pandas|matplotlib|scipy|sympy|micropip)/m.test(code)) {
      onStatut('Chargement des bibliothèques…');
      await py.loadPackagesFromImports(code);
      onStatut('');
    }
    // Espace de noms propre à chaque exécution pour éviter les fuites entre exercices.
    py.globals.set('__code__', code);
    resultat = py.runPython('exec(__code__, globals())');
  } catch (err) {
    const msg = String(err.message || err);
    const lignes = msg.trim().split('\n');
    erreur = lignes.slice(-1)[0];
    const ligne = (msg.match(/File "<string>", line (\d+)/g) || []).pop();
    sortie.push('⚠ ' + erreur + (ligne ? '  (' + ligne.replace('File "<string>", ', '') + ')' : ''));
  }
  const valeurs = exprs.map(ex => {
    try {
      let v = py.runPython(ex);
      if (v && typeof v.toJs === 'function') { const j = v.toJs({ dict_converter: Object.fromEntries }); v.destroy && v.destroy(); v = j; }
      if (v instanceof Map) v = Object.fromEntries(v);
      return { ok: true, valeur: v === undefined ? null : v };
    } catch (err) { return { ok: false, erreur: String(err.message || err).trim().split('\n').pop() }; }
  });
  return { stdout: sortie.join('\n'), erreur, resultat, valeurs };
}

// ---------- HTML / CSS : aperçu dans une iframe ----------
export function rendreHTML(iframe, html) {
  return new Promise(resolve => {
    iframe.onload = () => resolve({ doc: iframe.contentDocument, win: iframe.contentWindow });
    iframe.srcdoc = html;
  });
}
