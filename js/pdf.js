// Import de PDF : PDF.js (servi localement, chargé seulement à la demande)
// extrait le texte ; on reconstruit lignes, paragraphes et titres (d'après la
// taille des caractères), sans en-têtes ni numéros de page répétés.

let lib = null;
async function load() {
  if (!lib) {
    lib = await import('../vendor/pdfjs/pdf.min.mjs');
    lib.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
  }
  return lib;
}

const MAX_PAGES = 120;
const BULLET = /^[•◦▪▫■□●○‣⁃∙·–—-]\s*/;

/** Regroupe les morceaux de texte d'une page en lignes (même ordonnée). */
export function linesOf(items) {
  const rows = [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const y = it.transform[5], x = it.transform[4];
    const size = Math.abs(it.transform[3]) || it.height || 10;
    let row = rows.find((r) => Math.abs(r.y - y) < Math.max(2, size * 0.35));
    if (!row) { row = { y, parts: [], size: 0 }; rows.push(row); }
    row.parts.push({ x, w: it.width || 0, s: it.str, size });
    row.size = Math.max(row.size, size);
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) => {
    r.parts.sort((a, b) => a.x - b.x);
    let text = '', end = null;
    for (const p of r.parts) {
      const gap = end === null ? 0 : p.x - end;
      text += end !== null && gap > p.size * 0.18 && !/\s$/.test(text) && !/^\s/.test(p.s) ? ` ${p.s}` : p.s;
      end = p.x + p.w;
    }
    return { text: text.replace(/\s+/g, ' ').trim(), size: r.size, y: r.y };
  }).filter((l) => l.text);
}

/**
 * Texte structuré (Markdown léger) à partir des lignes de chaque page.
 * @param {{text:string, size:number}[][]} pages
 */
export function pagesToText(pages) {
  // En-têtes et pieds de page : lignes identiques (chiffres ignorés) sur au moins la moitié des pages.
  const key = (t) => t.toLowerCase().replace(/\d+/g, '#').trim();
  const seen = new Map();
  for (const lines of pages) for (const k of new Set(lines.map((l) => key(l.text)))) seen.set(k, (seen.get(k) || 0) + 1);
  const repeated = new Set(pages.length >= 2 ? [...seen].filter(([k, n]) => n >= Math.max(2, pages.length / 2) && k.length < 90).map(([k]) => k) : []);
  const all = pages.flat().filter((l) => !repeated.has(key(l.text)));
  const sizes = all.map((l) => l.size).sort((a, b) => a - b);
  const body = sizes[Math.floor(sizes.length / 2)] || 10;
  const big = [...new Set(all.filter((l) => l.size >= body * 1.18).map((l) => Math.round(l.size)))].sort((a, b) => b - a);
  const out = [];
  let para = '';
  const flush = () => { if (para) { out.push(para); para = ''; } };
  let titled = false;
  let listMode = false; // après « … : », les lignes courtes sans point final sont des éléments de liste
  for (const lines of pages) {
    for (const l of lines) {
      const t = l.text;
      if (repeated.has(key(t)) || /^(page\s*)?\d{1,4}(\s*\/\s*\d{1,4})?$/i.test(t)) continue;
      const isHead = l.size >= body * 1.18 && t.length < 100 && !/[.,;]$/.test(t);
      if (isHead) {
        flush();
        listMode = false;
        const rank = big.indexOf(Math.round(l.size));
        const level = !titled && rank === 0 ? 1 : rank <= 1 ? 2 : 3;
        if (level === 1) titled = true;
        // Titre sur deux lignes : on recolle.
        const prev = out[out.length - 1];
        if (prev && prev.startsWith('#'.repeat(level) + ' ') && !/[:?!]$/.test(prev) && /^[a-zà-ÿ(]/.test(t)) out[out.length - 1] = `${prev} ${t}`;
        else out.push(`${'#'.repeat(level)} ${t}`);
        continue;
      }
      if (BULLET.test(t) || /^\d{1,2}[.)]\s+\S/.test(t)) { flush(); para = `- ${t.replace(BULLET, '').replace(/^\d{1,2}[.)]\s+/, '')}`; listMode = true; continue; }
      if (listMode && t.length < 110 && /^[A-ZÀ-Ý«"0-9]/.test(t) && !/[.!?]$/.test(para.replace(/^- /, ''))) { flush(); para = `- ${t}`; continue; }
      if (/:$/.test(para) && t.length < 110 && /^[A-ZÀ-Ý«"0-9]/.test(t)) { flush(); para = `- ${t}`; listMode = true; continue; }
      listMode = listMode && t.length < 110;
      if (!para) { para = t; continue; }
      if (/[a-zà-ÿ]-$/.test(para) && /^[a-zà-ÿ]/.test(t)) para = para.slice(0, -1) + t;          // coupure de mot
      else if (/[.!?:»"]$/.test(para) && /^[A-ZÀ-Ý«"0-9]/.test(t)) { flush(); para = t; }         // nouvelle phrase en début de ligne
      else para += ` ${t}`;
    }
    flush();
  }
  flush();
  return out.join('\n');
}

/**
 * Lit un fichier PDF.
 * @param {File|Blob} file
 * @param {{onProgress?:(done:number,total:number)=>void, thumbs?:number}} [o]
 * @returns {Promise<{text:string, title:string, pages:number, images:string[]}>}
 */
export async function readPdf(file, { onProgress, thumbs = 4 } = {}) {
  const pdfjs = await load();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  const n = Math.min(doc.numPages, MAX_PAGES);
  const pages = [], images = [];
  for (let p = 1; p <= n; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    pages.push(linesOf(tc.items));
    if (images.length < thumbs) {
      try {
        const vp1 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 760 / vp1.width });
        const c = document.createElement('canvas');
        c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        images.push(c.toDataURL('image/jpeg', 0.8));
      } catch { /* aperçu facultatif */ }
    }
    page.cleanup();
    onProgress?.(p, n);
  }
  let title = '';
  try { title = (await doc.getMetadata())?.info?.Title || ''; } catch { /* sans métadonnées */ }
  await doc.destroy();
  const text = pagesToText(pages);
  if (text.replace(/\s/g, '').length < 40) {
    const err = new Error('Ce PDF ne contient presque pas de texte (document scanné ?).');
    err.code = 'empty';
    throw err;
  }
  return { text, title: title.trim(), pages: doc.numPages, images };
}
