// Éditeur Overpass : moteur local (sous-ensemble d'Overpass QL) sur un jeu de données GeoJSON fourni,
// et exécution en ligne sur overpass-api.de pour les données OpenStreetMap réelles.
import { $, $$, esc, url } from '../commun.js';
import { creerCarte, dessinerDonnees } from '../carte.js';

export const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const RE_STMT = /\b(node|way|relation|rel|nwr|nw|nr|wr|area)\s*((?:\s*(?:\[[^\]]*\]|\([^)]*\)))*)/g;
const chaine = s => { s = s.trim(); return /^(["']).*\1$/.test(s) ? s.slice(1, -1).replace(/\\(.)/g, '$1') : s; };

function lireFiltreTag(txt) {
  const m = txt.match(/^\s*(!)?\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^=!~\s]+)\s*(?:(!=|=|!~|~)\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^,\s]+)\s*(?:,\s*(i))?)?\s*$/);
  if (!m) throw new Error(`Filtre de tag illisible : [${txt}]`);
  const [, non, k, op, v, i] = m;
  const cle = chaine(k), val = v !== undefined ? chaine(v) : undefined;
  if (non) return t => !(cle in t);
  if (!op) return t => cle in t;
  if (op === '=') return t => t[cle] === val;
  if (op === '!=') return t => t[cle] !== val;
  let re; try { re = new RegExp(val, i ? 'i' : ''); } catch { throw new Error(`Expression régulière invalide : ${val}`); }
  return op === '~' ? t => cle in t && re.test(t[cle]) : t => !(cle in t) || !re.test(t[cle]);
}
const dist = (a, b, c, d) => { const R = 6371000, r = Math.PI / 180, x = (d - b) * r * Math.cos((a + c) / 2 * r), y = (c - a) * r; return Math.sqrt(x * x + y * y) * R; };
const sommets = g => g.type === 'Point' ? [g.coordinates] : g.type === 'LineString' || g.type === 'MultiPoint' ? g.coordinates : g.type === 'Polygon' || g.type === 'MultiLineString' ? g.coordinates.flat() : g.type === 'MultiPolygon' ? g.coordinates.flat(2) : [];
function lireFiltreSpatial(txt) {
  const t = txt.trim();
  let m = t.match(/^around\s*:\s*([\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)$/);
  if (m) { const [r, la, lo] = m.slice(1).map(Number); return f => sommets(f.geometry).some(([x, y]) => dist(la, lo, y, x) <= r); }
  if (t === '{{bbox}}') return () => true;
  m = t.match(/^(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)$/);
  if (m) { const [s, w, n, e] = m.slice(1).map(Number); return f => sommets(f.geometry).some(([x, y]) => y >= s && y <= n && x >= w && x <= e); }
  if (/^around/.test(t)) throw new Error('Syntaxe attendue : (around:RAYON_EN_MÈTRES,LATITUDE,LONGITUDE)');
  throw new Error(`Filtre spatial non pris en charge par le moteur local : (${t})`);
}
const typeDe = f => String(f.properties['@id'] || '').split('/')[0] || (f.geometry.type === 'Point' ? 'node' : 'way');

// Exécute une requête Overpass QL simplifiée sur une FeatureCollection. Renvoie les entités trouvées.
export function executerLocal(requete, fc) {
  const q = requete.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/\[\s*(out|timeout|maxsize|bbox|date)\s*:[^\]]*\]/g, '').replace(/\bout\b[^;]*;/g, '').replace(/\bis_in\b[^;]*;/g, '');
  const stmts = [...q.matchAll(RE_STMT)];
  if (!stmts.length) throw new Error('Aucune requête reconnue. Exemple : node["amenity"="cafe"];');
  const vus = new Set(), res = [];
  for (const s of stmts) {
    const type = s[1] === 'rel' ? 'relation' : s[1];
    if (type === 'area') throw new Error('Les recherches par zone (area) nécessitent la vraie base OSM : utilise le mode « En ligne » ou overpass-turbo.');
    const filtres = [];
    for (const f of (s[2] || '').matchAll(/\[([^\]]*)\]|\(([^)]*)\)/g)) {
      if (f[1] !== undefined) { const ft = lireFiltreTag(f[1]); filtres.push(x => ft(x.properties)); }
      else filtres.push(lireFiltreSpatial(f[2]));
    }
    const types = { node: ['node'], way: ['way'], relation: ['relation'], nwr: ['node', 'way', 'relation'], nw: ['node', 'way'], nr: ['node', 'relation'], wr: ['way', 'relation'] }[type];
    for (const f of fc.features) {
      if (!types.includes(typeDe(f)) || !filtres.every(fn => fn(f))) continue;
      const id = f.properties['@id'];
      if (!vus.has(id)) { vus.add(id); res.push(f); }
    }
  }
  return res;
}
const centre = f => { const p = sommets(f.geometry); const n = p.length || 1; return [p.reduce((a, x) => a + x[1], 0) / n, p.reduce((a, x) => a + x[0], 0) / n]; };
const tagsTexte = t => Object.entries(t).filter(([k]) => !k.startsWith('@')).map(([k, v]) => `${k}=${v}`).join(' · ');

export async function monter(el, opts = {}) {
  const fc = await fetch(url(opts.src)).then(r => r.json());
  const exemple = opts.requete || '[out:json];\nnode["amenity"="cafe"];\nout;';
  const enLigne = opts.enLigne || '[out:json][timeout:25];\n// Fontaines d\'eau potable autour du Capitole (Toulouse)\nnode["amenity"="drinking_water"](around:600,43.6045,1.4440);\nout body;';
  el.innerHTML = `<div class="op">
    <div class="op-modes row" role="group" aria-label="Mode d'exécution"><button type="button" class="btn small" data-m="local" aria-pressed="true">Jeu de données du défi</button><button type="button" class="btn small" data-m="ligne" aria-pressed="false">En ligne (overpass-api.de)</button><a class="btn small ghost" target="_blank" rel="noopener" data-turbo href="#">Ouvrir dans overpass-turbo ↗</a></div>
    <p class="op-info muted"></p>
    <div class="op-grille">
      <div class="op-ed"><label for="opQ" class="bx-lab">Requête Overpass QL</label><textarea id="opQ" class="op-q" spellcheck="false" rows="7"></textarea>
        <div class="row"><button type="button" class="btn primary small" data-exec>▶ Exécuter</button><span class="muted op-stat" role="status"></span><span class="muted op-raccourci">Ctrl + Entrée</span></div></div>
      <div class="op-carte"></div>
    </div>
    <div class="op-res table-scroll" aria-live="polite"></div></div>`;
  const ta = $('#opQ', el), stat = $('.op-stat', el), resZ = $('.op-res', el), info = $('.op-info', el);
  let mode = 'local', textes = { local: exemple, ligne: enLigne };
  ta.value = textes.local;
  const carte = await creerCarte($('.op-carte', el), { vue: opts.vue || [43.6, 1.44, 15], fond: 'aucun', interactif: false });
  let calque = dessinerDonnees(carte, fc, { etiquettes: true });
  carte.map.fitBounds(calque.getBounds().pad(0.08));
  let carteLigne = null, calqueLigne = null;
  const majInfo = () => {
    info.innerHTML = mode === 'local'
      ? `Moteur local : <b>${fc.features.length}</b> objets ${esc(opts.fictif === false ? 'issus d\'OpenStreetMap' : 'd\'une commune fictive (données inventées, tags OSM réels)')}. Filtres pris en charge : <code>[clé]</code>, <code>[!clé]</code>, <code>[clé=valeur]</code>, <code>[clé!=valeur]</code>, <code>[clé~"regex",i]</code>, <code>(around:R,lat,lon)</code>, <code>(sud,ouest,nord,est)</code>.`
      : 'Mode en ligne : la requête part vers <code>overpass-api.de</code> et interroge la vraie base OpenStreetMap (connexion Internet nécessaire, quelques secondes).';
    $('[data-turbo]', el).href = 'https://overpass-turbo.eu/?Q=' + encodeURIComponent(ta.value) + '&R';
  };
  $$('[data-m]', el).forEach(b => b.addEventListener('click', () => {
    textes[mode] = ta.value; mode = b.dataset.m; ta.value = textes[mode];
    $$('[data-m]', el).forEach(x => x.setAttribute('aria-pressed', x === b));
    $('.op-carte', el).hidden = mode !== 'local';
    if (carteLigne) carteLigne.el.hidden = mode !== 'ligne';
    resZ.innerHTML = ''; stat.textContent = ''; majInfo();
  }));
  ta.addEventListener('input', majInfo);
  ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); executer(); } });
  const pos = p => p ? `${p[0].toFixed(6)}, ${p[1].toFixed(6)}` : '—';
  const tableau = lignes => `<table class="ctf-table op-table"><caption class="sr">Résultats</caption><thead><tr><th scope="col">Objet</th><th scope="col">Nom</th><th scope="col">Position (lat, lon)</th><th scope="col">Tags</th></tr></thead><tbody>${lignes.slice(0, 300).map(l => `<tr><td><code>${esc(l.id)}</code></td><td>${esc(l.nom || '—')}</td><td><code class="op-pos">${esc(pos(l.pos))}</code></td><td class="op-tags">${esc(l.tags)}</td></tr>`).join('')}</tbody></table>`;
  async function executer() {
    textes[mode] = ta.value;
    if (mode === 'local') {
      try {
        const r = executerLocal(ta.value, fc);
        stat.textContent = `${r.length} résultat${r.length > 1 ? 's' : ''}`;
        resZ.innerHTML = r.length ? tableau(r.map(f => ({ id: f.properties['@id'], nom: f.properties.name, pos: centre(f), tags: tagsTexte(f.properties) }))) : '<p class="muted">Aucun objet ne correspond.</p>';
        carte.map.removeLayer(calque);
        calque = dessinerDonnees(carte, fc, { etiquettes: true, surbrillance: new Set(r.map(f => f.properties['@id'])) });
        if (r.length) carte.map.fitBounds(window.L.latLngBounds(r.map(centre)).pad(0.5), { maxZoom: 18 });
      } catch (err) { stat.textContent = ''; resZ.innerHTML = `<p class="callout warn">${esc(err.message)}</p>`; }
      return;
    }
    stat.innerHTML = '<span class="spinner"></span> Requête envoyée à overpass-api.de…';
    let q = ta.value.trim();
    if (!/\[out:json\]/.test(q)) q = '[out:json][timeout:25];\n' + q.replace(/\[out:\w+\]\s*;?/, '');
    try {
      const rep = await fetch(OVERPASS_API, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: 'data=' + encodeURIComponent(q) });
      if (!rep.ok) throw new Error(rep.status === 429 ? 'Serveur saturé (429) : réessaie dans une minute.' : rep.status === 400 ? 'Requête refusée (400) : vérifie la syntaxe.' : 'Erreur HTTP ' + rep.status);
      const json = await rep.json();
      const els = json.elements || [];
      stat.textContent = `${els.length} élément${els.length > 1 ? 's' : ''} reçu${els.length > 1 ? 's' : ''} d'OpenStreetMap`;
      resZ.innerHTML = els.length ? tableau(els.map(x => ({ id: `${x.type}/${x.id}`, nom: x.tags && x.tags.name, pos: x.lat !== undefined ? [x.lat, x.lon] : x.center ? [x.center.lat, x.center.lon] : null, tags: tagsTexte(x.tags || {}) }))) : '<p class="muted">Aucun résultat.</p>';
      if (!carteLigne) {
        const z = document.createElement('div'); z.className = 'op-carte'; $('.op-grille', el).appendChild(z);
        carteLigne = await creerCarte(z, { vue: [43.6045, 1.444, 14], fond: 'osm', interactif: false }); carteLigne.el = z;
      }
      if (calqueLigne) carteLigne.map.removeLayer(calqueLigne);
      const pts = els.map(x => x.lat !== undefined ? [x.lat, x.lon, x] : x.center ? [x.center.lat, x.center.lon, x] : null).filter(Boolean);
      calqueLigne = window.L.layerGroup(pts.map(([la, lo, x]) => window.L.circleMarker([la, lo], { radius: 6, color: '#16a34a', weight: 2, fillOpacity: 0.6 }).bindTooltip(esc((x.tags && x.tags.name) || `${x.type}/${x.id}`)))).addTo(carteLigne.map);
      if (pts.length) carteLigne.map.fitBounds(window.L.latLngBounds(pts.map(p => [p[0], p[1]])).pad(0.3), { maxZoom: 17 });
    } catch (err) {
      stat.textContent = '';
      resZ.innerHTML = `<p class="callout warn"><b>Impossible de joindre Overpass</b>${esc(err.message === 'Failed to fetch' ? 'Pas de connexion à overpass-api.de (hors ligne ou réseau filtré). Le jeu de données du défi suffit pour le résoudre ; tu peux aussi copier la requête dans overpass-turbo.' : err.message)}</p>`;
    }
  }
  $('[data-exec]', el).addEventListener('click', executer);
  majInfo();
  return { executer, requete: v => { ta.value = v; majInfo(); }, carte };
}
