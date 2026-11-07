// Carte mentale radiale en SVG : le titre au centre, une branche par partie
// du cours, des feuilles pour les notions. Tracé animé, zoom et déplacement.

const NS = 'http://www.w3.org/2000/svg';
const PALETTE = ['#7c5cff', '#ff5c8a', '#20c997', '#ffb020', '#3fa9ff', '#ff7a45', '#b45cff', '#2ec4b6'];

const svgEl = (tag, attrs = {}, text) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
};

/** Coupe un libellé en lignes courtes. */
function wrap(text, max = 18) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3).map((l, i, a) => (i === 2 && a.length === 3 && words.join(' ').length > l.length * 3 ? `${l}…` : l));
}

/** Feuilles d'une partie : définitions, listes, formules, dates, mots-clés. */
function leavesOf(a, sec) {
  const out = [];
  for (const d of a.definitions.filter((x) => x.section === sec.heading)) out.push({ label: d.term, tip: d.def });
  for (const f of a.formulas.filter((x) => x.section === sec.heading)) out.push({ label: f.formula, tip: f.context, mono: true });
  for (const l of a.lists.filter((x) => x.section === sec.heading)) for (const it of l.items.slice(0, 5)) out.push({ label: it, tip: l.label });
  for (const d of a.dates.filter((x) => x.section === sec.heading)) out.push({ label: d.label, tip: d.text });
  return out.slice(0, 7);
}

/**
 * Dessine la carte dans `host` ; renvoie une fonction de nettoyage.
 * @param {HTMLElement} host @param {object} a analyse @param {(tip:{label:string,tip:string}|null, ev?:Event)=>void} onTip
 */
export function renderMindmap(host, a, onTip) {
  host.textContent = '';
  const W = 1600, H = 1120, cx = W / 2, cy = H / 2;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'mm', role: 'img', 'aria-label': `Carte mentale : ${a.title}` });
  const defs = svgEl('defs');
  defs.innerHTML = '<filter id="mmGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    + '<radialGradient id="mmCore"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#c9bcff"/><stop offset="1" stop-color="#7c5cff"/></radialGradient>';
  svg.append(defs);
  const world = svgEl('g', { class: 'mm__world' });
  svg.append(world);
  const linksG = svgEl('g'), nodesG = svgEl('g');
  world.append(linksG, nodesG);

  const secs = a.sections.filter((s) => s.heading).slice(0, 8);
  const n = Math.max(secs.length, 1);
  let delay = 0.25;
  secs.forEach((sec, i) => {
    const color = PALETTE[i % PALETTE.length];
    const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const r1 = 280;
    const bx = cx + Math.cos(ang) * r1 * 1.25, by = cy + Math.sin(ang) * r1;
    const c1x = cx + Math.cos(ang) * 90, c1y = cy + Math.sin(ang) * 60;
    const branch = svgEl('path', { d: `M${cx},${cy} Q${c1x},${c1y} ${bx},${by}`, class: 'mm__link mm__link--main', stroke: color, style: `--d:${delay}s` });
    linksG.append(branch);
    const leaves = leavesOf(a, sec);
    const spread = Math.min(Math.PI * 0.9, (Math.PI * 2) / n * 0.92);
    // Feuilles alignées perpendiculairement à la branche, espacées selon l'orientation.
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const gap = Math.abs(px) * 168 + Math.abs(py) * 46;
    void spread;
    leaves.forEach((leaf, j) => {
      const off = (j - (leaves.length - 1) / 2) * gap;
      const out = 190 + Math.abs(off) * 0.18;
      const lx = bx + dx * out * 1.2 + px * off, ly = by + dy * out * 0.85 + py * off;
      const d = delay + 0.35 + j * 0.07;
      linksG.append(svgEl('path', { d: `M${bx},${by} Q${(bx + lx) / 2 + Math.cos(ang) * 20},${(by + ly) / 2} ${lx},${ly}`, class: 'mm__link', stroke: color, style: `--d:${d}s` }));
      const g = svgEl('g', { class: 'mm__leaf', transform: `translate(${lx},${ly})`, style: `--d:${d + 0.25}s`, tabindex: '0', role: 'button', 'aria-label': `${leaf.label} : ${leaf.tip}` });
      const lines = wrap(leaf.label, leaf.mono ? 22 : 18);
      const w = Math.max(...lines.map((l) => l.length)) * (leaf.mono ? 9.4 : 8.6) + 26, h = lines.length * 19 + 14;
      g.append(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2 > 18 ? 14 : h / 2, class: 'mm__pill', stroke: color }));
      lines.forEach((l, k) => g.append(svgEl('text', { y: (k - (lines.length - 1) / 2) * 19 + 5, class: leaf.mono ? 'mm__t mm__t--mono' : 'mm__t' }, l)));
      const show = (ev) => onTip?.(leaf, ev);
      g.addEventListener('pointerenter', show); g.addEventListener('focus', show);
      g.addEventListener('pointerleave', () => onTip?.(null)); g.addEventListener('blur', () => onTip?.(null));
      g.addEventListener('click', show);
      nodesG.append(g);
    });
    const lines = wrap(sec.heading, 20);
    const w = Math.max(...lines.map((l) => l.length)) * 10.5 + 34, h = lines.length * 22 + 20;
    const g = svgEl('g', { class: 'mm__branch', transform: `translate(${bx},${by})`, style: `--d:${delay + 0.2}s` });
    g.append(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 14, fill: color, filter: 'url(#mmGlow)' }));
    lines.forEach((l, k) => g.append(svgEl('text', { y: (k - (lines.length - 1) / 2) * 22 + 6, class: 'mm__bt' }, l)));
    nodesG.append(g);
    delay += 0.22;
  });

  const core = svgEl('g', { class: 'mm__core', transform: `translate(${cx},${cy})` });
  const tl = wrap(a.title.replace(/\s*\([^)]*\)\s*$/, ''), 13);
  core.append(svgEl('circle', { r: 118, fill: 'url(#mmCore)', filter: 'url(#mmGlow)' }));
  core.append(svgEl('circle', { r: 134, class: 'mm__halo' }));
  tl.forEach((l, k) => core.append(svgEl('text', { y: (k - (tl.length - 1) / 2) * 26 + 8, class: 'mm__ct' }, l)));
  nodesG.append(core);
  host.append(svg);

  // Zoom (molette, pincement) et déplacement (glisser).
  let s = 1, tx = 0, ty = 0, drag = null;
  const pts = new Map();
  const apply = () => world.setAttribute('transform', `translate(${tx},${ty}) scale(${s})`);
  const toWorld = (e) => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
  const zoomAt = (p, k) => { const ns = Math.min(3, Math.max(0.5, s * k)); tx = p.x - (p.x - tx) * (ns / s); ty = p.y - (p.y - ty) * (ns / s); s = ns; apply(); };
  svg.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(toWorld(e), e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
  svg.addEventListener('pointerdown', (e) => { pts.set(e.pointerId, toWorld(e)); if (pts.size === 1) drag = { ...toWorld(e), tx, ty }; svg.setPointerCapture?.(e.pointerId); });
  svg.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = [...pts.values()];
    pts.set(e.pointerId, toWorld(e));
    if (pts.size === 2) {
      const [a1, b1] = prev, [a2, b2] = [...pts.values()];
      const d1 = Math.hypot(a1.x - b1.x, a1.y - b1.y), d2 = Math.hypot(a2.x - b2.x, a2.y - b2.y);
      if (d1 > 0) zoomAt({ x: (a2.x + b2.x) / 2, y: (a2.y + b2.y) / 2 }, d2 / d1);
    } else if (drag) { const p = toWorld(e); tx = drag.tx + (p.x - drag.x); ty = drag.ty + (p.y - drag.y); apply(); }
  });
  const up = (e) => { pts.delete(e.pointerId); drag = null; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  return {
    reset() { s = 1; tx = 0; ty = 0; apply(); },
    zoom(k) { zoomAt({ x: W / 2, y: H / 2 }, k); },
    svg,
  };
}
