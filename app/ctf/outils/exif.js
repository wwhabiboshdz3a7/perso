// Inspecteur de métadonnées : parseur EXIF/TIFF maison (JPEG), commentaires JPEG, blocs texte PNG,
// coordonnées GPS converties en décimal et extraction de la miniature embarquée.
import { $, esc, chargerOctets, lireFichier, copier, formatOctets, latin1 } from '../commun.js';

const NOMS = {
  ifd0: { 0x010E: 'Description de l\'image', 0x010F: 'Fabricant', 0x0110: 'Modèle', 0x0112: 'Orientation', 0x011A: 'Résolution X', 0x011B: 'Résolution Y', 0x0128: 'Unité de résolution', 0x0131: 'Logiciel', 0x0132: 'Date de modification', 0x013B: 'Auteur (Artist)', 0x8298: 'Copyright', 0x9C9B: 'Titre (Windows)', 0x9C9C: 'Commentaire (Windows)', 0x9C9D: 'Auteur (Windows)', 0x9C9E: 'Mots-clés (Windows)', 0x9C9F: 'Sujet (Windows)', 0x0213: 'Positionnement YCbCr' },
  exif: { 0x829A: 'Temps d\'exposition', 0x829D: 'Ouverture (f/)', 0x8822: 'Programme d\'exposition', 0x8827: 'ISO', 0x9000: 'Version EXIF', 0x9003: 'Date de prise de vue', 0x9004: 'Date de numérisation', 0x9010: 'Fuseau (modification)', 0x9011: 'Fuseau (prise de vue)', 0x9012: 'Fuseau (numérisation)', 0x9209: 'Flash', 0x920A: 'Focale (mm)', 0x927C: 'Note du fabricant', 0x9286: 'Commentaire utilisateur', 0xA001: 'Espace colorimétrique', 0xA002: 'Largeur (px)', 0xA003: 'Hauteur (px)', 0xA405: 'Focale équivalente 24×36', 0xA420: 'Identifiant unique', 0xA430: 'Propriétaire de l\'appareil', 0xA431: 'Numéro de série du boîtier', 0xA433: 'Fabricant de l\'objectif', 0xA434: 'Modèle de l\'objectif', 0xA435: 'Numéro de série de l\'objectif' },
  gps: { 0x0000: 'Version GPS', 0x0001: 'Latitude (réf.)', 0x0002: 'Latitude', 0x0003: 'Longitude (réf.)', 0x0004: 'Longitude', 0x0005: 'Altitude (réf.)', 0x0006: 'Altitude (m)', 0x0007: 'Heure GPS (UTC)', 0x0010: 'Direction (réf.)', 0x0011: 'Direction de prise de vue (°)', 0x0012: 'Système géodésique', 0x001D: 'Date GPS (UTC)' },
  ifd1: { 0x0103: 'Compression', 0x0201: 'Miniature : position', 0x0202: 'Miniature : taille', 0x011A: 'Résolution X', 0x011B: 'Résolution Y', 0x0128: 'Unité de résolution' }
};
const TAILLES = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

function lireTIFF(b, debut) {
  const v = new DataView(b.buffer, b.byteOffset + debut, b.length - debut);
  const le = v.getUint16(0) === 0x4949;
  if (!le && v.getUint16(0) !== 0x4D4D) throw new Error('En-tête TIFF invalide');
  const u16 = o => v.getUint16(o, le), u32 = o => v.getUint32(o, le), s32 = o => v.getInt32(o, le);
  const lireIFD = (off, dico) => {
    const res = [];
    if (!off || off + 2 > v.byteLength) return { res, suivant: 0 };
    const n = u16(off);
    for (let i = 0; i < n; i++) {
      const e = off + 2 + i * 12;
      if (e + 12 > v.byteLength) break;
      const tag = u16(e), type = u16(e + 2), cnt = u32(e + 4);
      const taille = (TAILLES[type] || 1) * cnt;
      const vo = taille > 4 ? u32(e + 8) : e + 8;
      if (vo + taille > v.byteLength) continue;
      let val;
      if (type === 2) val = latin1(new Uint8Array(v.buffer, v.byteOffset + vo, cnt)).replace(/\0+$/, '');
      else if (type === 5 || type === 10) { val = []; for (let k = 0; k < cnt; k++) { const a = type === 5 ? u32(vo + 8 * k) : s32(vo + 8 * k), d = type === 5 ? u32(vo + 8 * k + 4) : s32(vo + 8 * k + 4); val.push(d ? a / d : 0); } }
      else if (type === 3) { val = []; for (let k = 0; k < cnt; k++) val.push(u16(vo + 2 * k)); }
      else if (type === 4 || type === 9) { val = []; for (let k = 0; k < cnt; k++) val.push(type === 4 ? u32(vo + 4 * k) : s32(vo + 4 * k)); }
      else val = new Uint8Array(v.buffer, v.byteOffset + vo, cnt).slice();
      if (Array.isArray(val) && val.length === 1) val = val[0];
      res.push({ tag, type, nom: dico[tag] || `Balise 0x${tag.toString(16).padStart(4, '0')}`, val });
    }
    const fin = off + 2 + n * 12;
    return { res, suivant: fin + 4 <= v.byteLength ? u32(fin) : 0 };
  };
  const ifd0 = lireIFD(u32(4), NOMS.ifd0);
  const pointeur = (l, t) => (l.find(x => x.tag === t) || {}).val;
  const exif = lireIFD(pointeur(ifd0.res, 0x8769), NOMS.exif);
  const gps = lireIFD(pointeur(ifd0.res, 0x8825), NOMS.gps);
  const ifd1 = lireIFD(ifd0.suivant, NOMS.ifd1);
  let miniature = null;
  const mo = pointeur(ifd1.res, 0x0201), ml = pointeur(ifd1.res, 0x0202);
  if (mo && ml && mo + ml <= v.byteLength) miniature = new Uint8Array(v.buffer, v.byteOffset + mo, ml).slice();
  return { ifd0: ifd0.res.filter(x => x.tag !== 0x8769 && x.tag !== 0x8825), exif: exif.res, gps: gps.res, ifd1: ifd1.res, miniature };
}

const ucs2 = u8 => { let s = ''; for (let i = 0; i + 1 < u8.length; i += 2) { const c = u8[i] | (u8[i + 1] << 8); if (!c) break; s += String.fromCharCode(c); } return s; };
function formater(e, groupe) {
  const v = e.val;
  if (groupe === 'ifd0' && e.tag >= 0x9C9B && e.tag <= 0x9C9F && v instanceof Uint8Array) return ucs2(v);
  if (e.tag === 0x9286 && v instanceof Uint8Array) {
    const code = latin1(v.slice(0, 8)).replace(/\0/g, '');
    const corps = v.slice(8);
    return code === 'UNICODE' ? ucs2(corps) : latin1(corps).replace(/\0+$/, '');
  }
  if (e.tag === 0x9000 && v instanceof Uint8Array) return latin1(v);
  if (groupe === 'gps' && (e.tag === 2 || e.tag === 4) && Array.isArray(v)) return `${v[0]}° ${v[1]}′ ${+v[2].toFixed(3)}″`;
  if (groupe === 'gps' && e.tag === 7 && Array.isArray(v)) return v.map(x => String(Math.floor(x)).padStart(2, '0')).join(':');
  if (groupe === 'gps' && e.tag === 0 && v instanceof Uint8Array) return [...v].join('.');
  if (e.tag === 0x829A && typeof v === 'number') return v < 1 ? `1/${Math.round(1 / v)} s` : v + ' s';
  if (e.tag === 0x0112) return ({ 1: '1 (normale)', 3: '3 (pivotée de 180°)', 6: '6 (pivotée de 90° horaire)', 8: '8 (pivotée de 90° antihoraire)' })[v] || String(v);
  if (v instanceof Uint8Array) return v.length > 48 ? `${v.length} octets` : [...v].map(x => x.toString(16).padStart(2, '0')).join(' ');
  if (Array.isArray(v)) return v.map(x => typeof x === 'number' ? +x.toFixed(4) : x).join(', ');
  if (typeof v === 'number') return String(+v.toFixed(4));
  return String(v);
}
const valeur = (l, t) => (l.find(x => x.tag === t) || {}).val;

// Analyse un fichier (octets) et renvoie un rapport de métadonnées.
export function analyser(b) {
  const rapport = { format: '?', groupes: [], gps: null, miniature: null, commentaires: [] };
  if (b[0] === 0xFF && b[1] === 0xD8) {
    rapport.format = 'JPEG';
    let o = 2;
    while (o + 4 <= b.length && b[o] === 0xFF) {
      const m = b[o + 1], len = (b[o + 2] << 8) | b[o + 3];
      if (m === 0xDA || m === 0xD9) break;
      if (m === 0xE1 && latin1(b.slice(o + 4, o + 10)) === 'Exif\0\0') {
        try {
          const t = lireTIFF(b.subarray(0, o + 2 + len), o + 10);
          const G = [['ifd0', 'Image et appareil', t.ifd0], ['exif', 'Prise de vue', t.exif], ['gps', 'GPS', t.gps], ['ifd1', 'Miniature', t.ifd1]];
          G.forEach(([g, titre, l]) => { if (l.length) rapport.groupes.push({ titre, lignes: l.map(e => ({ nom: e.nom, tag: e.tag, valeur: formater(e, g) })) }); });
          const la = valeur(t.gps, 2), lo = valeur(t.gps, 4);
          if (Array.isArray(la) && Array.isArray(lo)) {
            let lat = la[0] + la[1] / 60 + la[2] / 3600, lon = lo[0] + lo[1] / 60 + lo[2] / 3600;
            if (valeur(t.gps, 1) === 'S') lat = -lat;
            if (valeur(t.gps, 3) === 'W') lon = -lon;
            rapport.gps = { lat: +lat.toFixed(6), lon: +lon.toFixed(6) };
          }
          rapport.miniature = t.miniature;
        } catch (err) { rapport.commentaires.push('Bloc EXIF illisible : ' + err.message); }
      } else if (m === 0xFE) rapport.commentaires.push(new TextDecoder().decode(b.slice(o + 4, o + 2 + len)));
      else if (m === 0xE1 && latin1(b.slice(o + 4, o + 33)).startsWith('http://ns.adobe.com/xap/1.0/')) rapport.commentaires.push('XMP : ' + new TextDecoder().decode(b.slice(o + 33, o + 2 + len)).replace(/\s+/g, ' ').slice(0, 600));
      o += 2 + len;
    }
  } else if (b[0] === 0x89 && latin1(b.slice(1, 4)) === 'PNG') {
    rapport.format = 'PNG';
    const v = new DataView(b.buffer, b.byteOffset, b.length);
    let o = 8; const lignes = [];
    while (o + 8 <= b.length) {
      const len = v.getUint32(o), type = latin1(b.slice(o + 4, o + 8));
      if (type === 'IHDR') lignes.push({ nom: 'Dimensions', valeur: `${v.getUint32(o + 8)} × ${v.getUint32(o + 12)} px` });
      if (type === 'tEXt' || type === 'iTXt') { const d = b.slice(o + 8, o + 8 + len); const z = d.indexOf(0); lignes.push({ nom: `Texte « ${latin1(d.slice(0, z))} »`, valeur: new TextDecoder().decode(d.slice(type === 'iTXt' ? d.indexOf(0, d.indexOf(0, z + 3) + 1) + 1 : z + 1)) }); }
      if (type === 'tIME') lignes.push({ nom: 'Date de modification', valeur: `${v.getUint16(o + 8)}-${String(b[o + 10]).padStart(2, '0')}-${String(b[o + 11]).padStart(2, '0')} ${b[o + 12]}:${String(b[o + 13]).padStart(2, '0')}` });
      if (type === 'IEND') { if (o + 12 < b.length) rapport.commentaires.push(`${b.length - o - 12} octet(s) après la fin du PNG (IEND) : à examiner avec l'outil Hex.`); break; }
      o += 12 + len;
    }
    if (lignes.length) rapport.groupes.push({ titre: 'Blocs PNG', lignes });
  } else rapport.format = 'inconnu';
  if (rapport.format === 'JPEG') {
    const fin = (() => { for (let i = b.length - 2; i > 2; i--) if (b[i] === 0xFF && b[i + 1] === 0xD9) return i; return -1; })();
    if (fin > 0 && fin + 2 < b.length) rapport.commentaires.push(`${b.length - fin - 2} octet(s) après le marqueur de fin JPEG (FF D9) : à examiner avec l'outil Hex.`);
  }
  return rapport;
}

export function monter(el) {
  el.innerHTML = `<div class="ex">
    <div class="row ex-tete"><label class="btn small" for="exFile">Ouvrir un fichier image…</label><input type="file" id="exFile" accept="image/jpeg,image/png,.jpg,.jpeg,.png" hidden><span class="muted ex-nom">Aucun fichier chargé. Utilise le bouton « Inspecteur EXIF » d'une ressource, ou ouvre ta propre photo (rien n'est envoyé).</span></div>
    <div class="ex-corps"></div></div>`;
  const corps = $('.ex-corps', el);
  let url1 = null, url2 = null;
  const afficher = (b, nom) => {
    [url1, url2].forEach(u => u && URL.revokeObjectURL(u));
    const r = analyser(b);
    $('.ex-nom', el).textContent = `${nom} · ${formatOctets(b.length)} · ${r.format}`;
    url1 = URL.createObjectURL(new Blob([b]));
    url2 = r.miniature ? URL.createObjectURL(new Blob([r.miniature], { type: 'image/jpeg' })) : null;
    corps.innerHTML = `<div class="ex-grille">
      <div class="ex-tables">${r.groupes.length ? r.groupes.map(g => `<table class="ex-table"><caption>${esc(g.titre)}</caption><tbody>${g.lignes.map(l => `<tr><th scope="row">${esc(l.nom)}</th><td>${esc(l.valeur)}</td></tr>`).join('')}</tbody></table>`).join('') : '<p class="callout info">Aucune métadonnée EXIF dans ce fichier. Les réseaux sociaux les suppriment souvent à la mise en ligne.</p>'}
        ${r.commentaires.map(c => `<p class="callout warn ex-com"><b>Remarque</b>${esc(c)}</p>`).join('')}</div>
      <div class="ex-cote">
        ${r.gps ? `<div class="ex-gps"><b>Position GPS</b><code>${r.gps.lat}, ${r.gps.lon}</code><div class="row"><button type="button" class="btn small" data-copier-gps>Copier</button><a class="btn small" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${r.gps.lat}&amp;mlon=${r.gps.lon}#map=17/${r.gps.lat}/${r.gps.lon}">Voir sur OpenStreetMap ↗</a></div></div>` : ''}
        <figure class="ex-fig"><img src="${url1}" alt="Image analysée"><figcaption>Image principale</figcaption></figure>
        ${url2 ? `<figure class="ex-fig ex-mini"><img src="${url2}" alt="Miniature embarquée dans les métadonnées"><figcaption>Miniature EXIF embarquée (${formatOctets(r.miniature.length)}) — compare-la avec l'image principale !</figcaption></figure>` : ''}
      </div></div>`;
    $('[data-copier-gps]', corps)?.addEventListener('click', () => copier(`${r.gps.lat}, ${r.gps.lon}`));
    return r;
  };
  $('#exFile', el).addEventListener('change', async e => { const f = e.target.files[0]; if (f) afficher(await lireFichier(f), f.name); });
  return {
    async charger({ src, octets, nom }) {
      corps.innerHTML = '<p class="muted"><span class="spinner"></span> Lecture du fichier…</p>';
      try { const b = octets || await chargerOctets(src); return afficher(b, nom || String(src).split('/').pop()); }
      catch (err) { corps.innerHTML = `<p class="callout warn">${esc(err.message)}</p>`; }
    }
  };
}
