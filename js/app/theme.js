// Thèmes de couleur : la feuille de style porte les couleurs (attribut
// data-theme sur <html>) ; ce module expose les mêmes couleurs aux canevas
// (HUD, particules, hologramme, captures) et prévient quand elles changent.

export const THEMES = [
  { id: 'arc', label: 'Arc · cyan et ambre' },
  { id: 'mark', label: 'Mark · rouge et or' },
  { id: 'matrix', label: 'Matrice · vert phosphore' },
  { id: 'nexora', label: 'NEXORA · violet et or' },
  { id: 'glace', label: 'Glace · blanc et bleu' },
  { id: 'solaire', label: 'Solaire · orange et corail' },
];

const listeners = new Set();
const cache = { primary: '#6ee7ff', accent: '#ffb547', bg: '#03080c', primaryRgb: '110,231,255', accentRgb: '255,181,71' };

function read() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fb) => (cs.getPropertyValue(name) || '').trim() || fb;
  const rgb = (name, fb) => v(name, fb).split(/[\s,]+/).filter(Boolean).join(',');
  cache.primary = v('--cyan', '#6ee7ff');
  cache.accent = v('--amber', '#ffb547');
  cache.bg = v('--bg', '#03080c');
  cache.primaryRgb = rgb('--cyan-rgb', '110 231 255');
  cache.accentRgb = rgb('--amber-rgb', '255 181 71');
}

/** Couleurs courantes du thème (lecture directe, toujours à jour). */
export const C = {
  get primary() { return cache.primary; },
  get accent() { return cache.accent; },
  get bg() { return cache.bg; },
  primaryA(a) { return `rgba(${cache.primaryRgb},${a})`; },
  accentA(a) { return `rgba(${cache.accentRgb},${a})`; },
};

/** Applique un thème ; renvoie l'identifiant effectivement appliqué. */
export function applyTheme(id) {
  const known = THEMES.some((t) => t.id === id) ? id : 'arc';
  const root = document.documentElement;
  if (known === 'arc') delete root.dataset.theme; else root.dataset.theme = known;
  const before = `${cache.primary}|${cache.accent}`;
  const old = { primary: cache.primary, accent: cache.accent };
  read();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', cache.bg);
  if (`${cache.primary}|${cache.accent}` !== before) for (const fn of listeners) { try { fn(C, old); } catch (e) { console.warn('[jarvis] thème :', e); } }
  return known;
}

/** Abonnement aux changements de thème. */
export function onTheme(fn) { listeners.add(fn); return () => listeners.delete(fn); }
