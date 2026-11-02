// Arène CTF — vérification sans secret en clair : empreintes SHA-256 des flags normalisés,
// geohash des clics sur la carte, masquage réversible des contenus révélés après coup.
// Module partagé entre le navigateur et les outils Node (outils/ctf/generer.mjs).

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function sha256hex(texte) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(texte));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- flags ---------- */
// Accepte « LUMIO{...} » ou seulement le contenu. Casse, accents et espaces sont normalisés.
export function normaliserFlag(saisie) {
  let s = String(saisie ?? '').trim();
  const m = s.match(/^lumio\s*\{([\s\S]*)\}$/i);
  if (m) s = m[1];
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, '_');
  return 'LUMIO{' + s + '}';
}
export const empreinteFlag = (id, saisie) => sha256hex('lumio-ctf|' + id + '|' + normaliserFlag(saisie));
export async function verifierFlag(defi, saisie) {
  if (!String(saisie || '').trim()) return false;
  const h = await empreinteFlag(defi.id, saisie);
  return (defi.h || []).includes(h);
}

/* ---------- geohash ---------- */
const B32 = '0123456789bcdefghjkmnpqrstuvwxyz';
export function geohash(lat, lon, precision = 7) {
  // une carte qui montre plusieurs copies du monde peut donner une longitude hors de [-180, 180]
  lon = ((((+lon + 180) % 360) + 360) % 360) - 180;
  lat = Math.max(-90, Math.min(90, +lat));
  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180;
  let bit = 0, ch = 0, pair = true, out = '';
  while (out.length < precision) {
    if (pair) { const mid = (lonMin + lonMax) / 2; if (lon >= mid) { ch = ch * 2 + 1; lonMin = mid; } else { ch *= 2; lonMax = mid; } }
    else { const mid = (latMin + latMax) / 2; if (lat >= mid) { ch = ch * 2 + 1; latMin = mid; } else { ch *= 2; latMax = mid; } }
    pair = !pair;
    if (++bit === 5) { out += B32[ch]; bit = 0; ch = 0; }
  }
  return out;
}
export function boiteGeohash(gh) {
  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180, pair = true;
  for (const c of gh) {
    const v = B32.indexOf(c);
    for (let i = 4; i >= 0; i--) {
      const b = (v >> i) & 1;
      if (pair) { const mid = (lonMin + lonMax) / 2; if (b) lonMin = mid; else lonMax = mid; }
      else { const mid = (latMin + latMax) / 2; if (b) latMin = mid; else latMax = mid; }
      pair = !pair;
    }
  }
  return { latMin, latMax, lonMin, lonMax };
}
// Taille approximative d'une cellule (mètres) selon la précision, à l'équateur.
export const TAILLE_CELLULE = { 2: 1250000, 3: 156000, 4: 39100, 5: 4890, 6: 1220, 7: 153, 8: 38, 9: 4.8 };
export function precisionPourRayon(r) {
  // la cellule la plus grande qui reste plus petite que le rayon accepté
  for (const p of [2, 3, 4, 5, 6, 7, 8, 9]) if (TAILLE_CELLULE[p] <= r) return p;
  return 9;
}

export function distance(lat1, lon1, lat2, lon2) {
  const R = 6371008.8, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
// Distance entre un point et le rectangle d'une cellule (0 si le point est dedans).
function distanceBoite(lat, lon, b) {
  const la = Math.min(Math.max(lat, b.latMin), b.latMax);
  const lo = Math.min(Math.max(lon, b.lonMin), b.lonMax);
  return distance(lat, lon, la, lo);
}
// Toutes les cellules de précision p dont une partie est à moins de r mètres du point.
export function cellulesDansRayon(lat, lon, r, p) {
  const b0 = boiteGeohash(geohash(lat, lon, p));
  const dLat = b0.latMax - b0.latMin, dLon = b0.lonMax - b0.lonMin;
  const nLat = Math.ceil((r / 111320) / dLat) + 1;
  const nLon = Math.ceil((r / (111320 * Math.max(0.05, Math.cos(lat * Math.PI / 180)))) / dLon) + 1;
  const res = new Set();
  for (let i = -nLat; i <= nLat; i++) for (let j = -nLon; j <= nLon; j++) {
    const la = lat + i * dLat, lo = lon + j * dLon;
    if (la <= -90 || la >= 90) continue;
    const gh = geohash(la, ((lo + 540) % 360) - 180, p);
    if (distanceBoite(lat, lon, boiteGeohash(gh)) <= r) res.add(gh);
  }
  return [...res];
}
export async function empreinteCellule(id, gh) { return (await sha256hex('lumio-geo|' + id + '|' + gh)).slice(0, 24); }

// zones : [{ p, part, c: [empreintes] }] du plus précis au plus large ; part = part des points obtenus.
// Renvoie { anneau, part } ou null.
export async function verifierPosition(defi, lat, lon) {
  const zones = defi.zones || [];
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    const h = await empreinteCellule(defi.id, geohash(lat, lon, z.p));
    if (z.c.includes(h)) return { anneau: i, part: z.part, rayon: z.r };
  }
  return null;
}
// Construit les zones à partir d'une cible : anneaux [{ r, part }] du plus petit au plus grand.
export async function construireZones(id, cibles, anneaux) {
  const zones = [];
  for (const a of anneaux) {
    const p = a.p || precisionPourRayon(a.r);
    const cells = new Set();
    for (const c of cibles) cellulesDansRayon(c.lat, c.lon, c.r ? c.r * a.r / anneaux[0].r : a.r, p).forEach(x => cells.add(x));
    const c = [];
    for (const gh of [...cells].sort()) c.push(await empreinteCellule(id, gh));
    zones.push({ p, part: a.part, r: a.r, c });
  }
  return zones;
}

/* ---------- contenu réservé à la réussite (AES-GCM, clé dérivée du flag) ---------- */
// Le writeup complet (avec le flag) est chiffré par une clé de contenu aléatoire, elle-même chiffrée
// avec une clé dérivée (HKDF) de chaque flag accepté. Sans le bon flag, ce contenu reste illisible,
// même depuis la console. La clé de contenu est conservée dans la progression après la réussite.
const sub = () => globalThis.crypto.subtle;
async function cleDeFlag(id, flag) {
  const base = await sub().importKey('raw', enc.encode(normaliserFlag(flag)), 'HKDF', false, ['deriveKey']);
  return sub().deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: enc.encode('lumio-wf|' + id), info: enc.encode('writeup') }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const aes = raw => sub().importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
// IV et clé de contenu dérivés du contenu lui-même (secret) : sortie reproductible d'une génération à l'autre,
// sans jamais réutiliser un IV pour deux contenus différents avec la même clé.
const octetsHash = async t => new Uint8Array(await sub().digest('SHA-256', typeof t === 'string' ? enc.encode(t) : t));
async function chiffrer(cle, octets, graineIV) {
  const iv = (await octetsHash(graineIV)).slice(0, 12);
  return { iv: b64.enc(iv), ct: b64.enc(new Uint8Array(await sub().encrypt({ name: 'AES-GCM', iv }, cle, octets))) };
}
const dechiffrer = async (cle, x) => new Uint8Array(await sub().decrypt({ name: 'AES-GCM', iv: b64.dec(x.iv) }, cle, b64.dec(x.ct)));
export async function chiffrerPourFlags(id, texte, flags) {
  const k = await octetsHash('lumio-k|' + id + '|' + texte + '|' + flags.join('|'));
  const kh = [...k].map(b => b.toString(16).padStart(2, '0')).join('');
  const corps = await chiffrer(await aes(k), enc.encode(texte), 'iv|' + kh);
  const cles = [];
  for (const f of [...new Set(flags.map(normaliserFlag))]) cles.push(await chiffrer(await cleDeFlag(id, f), k, 'ivk|' + kh + '|' + f));
  return { ...corps, k: cles };
}
// Renvoie { texte, cle } (cle : clé de contenu en base64, à conserver) ou null.
export async function ouvrirAvecFlag(id, wf, flag) {
  if (!wf || !Array.isArray(wf.k)) return null;
  const kek = await cleDeFlag(id, flag);
  for (const x of wf.k) {
    try { const k = await dechiffrer(kek, x); return { texte: dec.decode(await dechiffrer(await aes(k), wf)), cle: b64.enc(k) }; } catch { /* autre flag */ }
  }
  return null;
}
export async function ouvrirAvecCle(wf, cle) {
  try { return dec.decode(await dechiffrer(await aes(b64.dec(cle)), wf)); } catch { return null; }
}
export const wfValide = wf => !!wf && typeof wf === 'object' && typeof wf.iv === 'string' && typeof wf.ct === 'string' && Array.isArray(wf.k)
  && /^[A-Za-z0-9+/=]{16}$/.test(wf.iv) && /^[A-Za-z0-9+/=]{1,400000}$/.test(wf.ct) && wf.k.length <= 12
  && wf.k.every(x => x && /^[A-Za-z0-9+/=]{16}$/.test(x.iv) && /^[A-Za-z0-9+/=]{40,80}$/.test(x.ct));
// Remplace chaque occurrence des flags par une marque « masqué » (version lisible après abandon).
export function masquerFlags(html, flags, marque = '<span class="ctf-flag-cache" title="Le flag exact s\'affiche une fois le défi validé">LUMIO{…}</span>') {
  let n = 0;
  const motifs = [...new Set(flags)].sort((a, b) => b.length - a.length).map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!motifs.length) return { html, n };
  const re = new RegExp(motifs.join('|'), 'gi');
  return { html: String(html).replace(re, () => { n++; return marque; }), n };
}

/* ---------- masquage réversible (contenus révélés après réussite ou abandon) ---------- */
// Ce n'est pas un secret cryptographique : c'est l'équivalent d'une enveloppe cachetée,
// pour qu'aucun flag ni aucune solution ne soit lisible dans le code livré.
function graineNum(graine) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < graine.length; i++) { h ^= graine.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function flux(graine) {
  let a = graineNum(graine);
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) & 255; };
}
const b64 = {
  enc: bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); },
  dec: str => Uint8Array.from(atob(str), c => c.charCodeAt(0))
};
export function masquer(texte, graine) {
  const b = enc.encode(texte), f = flux('lumio-env|' + graine);
  for (let i = 0; i < b.length; i++) b[i] ^= f();
  return b64.enc(b);
}
export function demasquer(code, graine) {
  const b = b64.dec(code), f = flux('lumio-env|' + graine);
  for (let i = 0; i < b.length; i++) b[i] ^= f();
  return dec.decode(b);
}
// Parcourt un objet et remplace les enveloppes { "~": "..." } par leur contenu.
export function ouvrir(valeur, graine) {
  if (Array.isArray(valeur)) return valeur.map(v => ouvrir(v, graine));
  if (valeur && typeof valeur === 'object') {
    if (typeof valeur['~'] === 'string' && (Object.keys(valeur).length === 1 || valeur.j === 1)) {
      const t = demasquer(valeur['~'], graine);
      return valeur.j === 1 ? JSON.parse(t) : t;
    }
    const o = {};
    for (const k of Object.keys(valeur)) o[k] = ouvrir(valeur[k], graine);
    return o;
  }
  return valeur;
}
