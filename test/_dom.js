// Prépare un DOM jsdom global avant de charger la librairie.
import { JSDOM } from 'jsdom';

let lib = null;

export async function load(html = '<!doctype html><html><body></body></html>') {
  if (!globalThis.document) {
    const dom = new JSDOM(html, { pretendToBeVisual: true, url: 'http://localhost/' });
    const w = dom.window;
    globalThis.window = w;
    globalThis.document = w.document;
    for (const k of ['Node', 'NodeList', 'HTMLCollection', 'HTMLElement', 'Element', 'SVGElement', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'innerWidth', 'innerHeight', 'IntersectionObserver']) {
      if (w[k] !== undefined) globalThis[k] = typeof w[k] === 'function' && !/^[A-Z]/.test(k) ? w[k].bind(w) : w[k];
    }
    globalThis.matchMedia = (q) => ({ get matches() { return globalThis.__reduced === true && q.includes('reduce'); }, media: q, addEventListener() {}, removeEventListener() {} });
  }
  if (!lib) {
    lib = await import('../src/index.js');
    lib.engine.manual = true;
  }
  return lib;
}

/** Crée des éléments dans le body et les renvoie. */
export function html(markup) {
  const box = document.createElement('div');
  box.innerHTML = markup.trim();
  document.body.appendChild(box);
  return box;
}

/** Arrondi pour comparer des nombres flottants issus du DOM. */
export const num = (v) => Math.round(parseFloat(v) * 1000) / 1000;
