// Résolution des cibles : sélecteurs, éléments, listes, tableaux, objets JS.
import { isStr, isArr, hasDOM, isObj } from './utils.js';

const ids = new WeakMap();
let next = 0;

/** Identifiant stable d'une cible (sert aux clés de composition). */
export function targetId(t) {
  if (!isObj(t) && typeof t !== 'function') return String(t);
  let id = ids.get(t);
  if (!id) { id = ++next; ids.set(t, id); }
  return id;
}

function isListLike(v) {
  if (!v || isStr(v) || typeof v !== 'object') return false;
  if (isArr(v)) return true;
  if (hasDOM && (v instanceof NodeList || v instanceof HTMLCollection)) return true;
  // objets « tableau » (jQuery, résultats de splitText…) mais pas les éléments ni window
  return typeof v.length === 'number' && v.nodeType === undefined && v !== globalThis && typeof v[Symbol.iterator] === 'function';
}

export function resolveTargets(input, root = hasDOM ? document : null) {
  const out = [];
  const seen = new Set();
  const visit = (v) => {
    if (v == null || v === false) return;
    if (isStr(v)) {
      if (!root) return;
      try { root.querySelectorAll(v).forEach(add); } catch (e) { /* sélecteur invalide : ignoré */ }
      return;
    }
    if (isListLike(v)) { for (const x of v) visit(x); return; }
    // nombres, booléens… : rien à animer, cible ignorée comme un sélecteur sans résultat
    if (typeof v !== 'object' && typeof v !== 'function') return;
    add(v);
  };
  const add = (v) => {
    if (seen.has(v)) return;
    seen.add(v);
    out.push(v);
  };
  visit(input);
  return out;
}
